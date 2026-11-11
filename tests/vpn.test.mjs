import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,CHATBOT_REPLY}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<30000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function until(s,predicate){for(let i=0;i<30000&&s.status==='running'&&!predicate();i++)s.advance();assert(predicate(),'Expected state must be reachable');}
function run(s,type='web',payload={}){assert(s.start(type,{address:'http://knihovna.test',device:'laptop',...payload}));return finish(s);}
const post={method:'POST',message:'Soukromý vzkaz knihovně 🙂'};

test('VPN is an independent layer above cable, Wi-Fi and data with separate tunnel addresses',()=>{
 const s=new Simulation();for(const [i,id] of ['laptop','friend','phone'].entries()){
  const access=structuredClone(s.net.access[id]),ip=s.net.nodes[id].ip;assert(s.net.setVPN(id,true));
  assert.deepEqual(s.net.access[id],access);assert.equal(s.net.nodes[id].ip,ip);assert.equal(s.net.vpn.clients[id].ip,`10.8.0.${10+i}`);
 }
 assert.equal(Object.keys(s.net.nodes).length,53);assert.equal(Object.keys(s.net.links).length,59);
});

test('The VPN envelope hides the entire DNS and HTTP packet on the access path and exposes HTTP only at the exit',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);const events=run(s,'web',post);assert.equal(s.status,'success');
 const access=events.filter(e=>e.kind==='hop'&&e.link==='uplink'&&!e.copy&&e.from==='home');
 assert.equal(access.length,2);assert(access.every(e=>e.packet.kind==='vpn-outbound'&&e.header.dst===s.net.nodes.vpn.ip&&e.header.dport===51820&&e.header.protocol==='UDP'));
 assert(access.every(e=>!JSON.stringify(e.packet).includes(post.message)&&!JSON.stringify(e.packet).includes('knihovna.test')));
 const outside=events.find(e=>e.kind==='origin'&&e.node==='vpn'&&e.packet.kind==='http-request');
 assert.equal(outside.packet.src,s.net.nodes.vpn.ip);assert.equal(outside.packet.payload.message,post.message);assert.equal(outside.packet.natHistory[0].router,'vpn');
 assert.equal(s.net.browser.receipt,post.message);assert.equal(s.net.server.lastRequest.sourceIp,s.net.nodes.vpn.ip);
 assert(s.net.vpn.clients.laptop.path.includes('vpn-uplink'));assert(!s.net.vpn.clients.laptop.path.includes('ap-switch'));
});

test('Home NAT sees only the UDP tunnel while VPN exit NAT independently tracks DNS and HTTP',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);run(s,'web',post);
 assert.equal(s.net.nat.home.rows.length,1);const row=s.net.nat.home.rows[0];assert.equal(row.protocol,'UDP');assert.equal(row.remotePort,51820);
 assert.deepEqual(s.net.vpn.rows.map(r=>[r.protocol,r.remotePort]),[['UDP',53],['TCP',80]]);
 assert.equal(s.net.vpn.clients.laptop.peer.ip,'192.0.2.1');assert.equal(s.net.vpn.clients.laptop.peer.port,row.outsidePort);
 const reply=[...s.packets.values()].find(p=>p.kind==='http-response');assert.equal(reply.dst,'10.8.0.10');assert.equal(reply.dport,51000);
 assert.equal(reply.vpnHistory[0].received.dst,'192.168.10.10');assert.equal(reply.vpnHistory[0].natHistory[0].router,'home');
});

test('HTTPS remains protected after VPN decapsulation and is decoded only by the browser and web server',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);const events=run(s,'web',{address:'https://knihovna.test',...post});assert.equal(s.status,'success');
 const outside=events.find(e=>e.kind==='origin'&&e.node==='vpn'&&e.packet.kind==='https-request');
 assert(outside.packet.payload.record);assert(!JSON.stringify(outside.packet).includes(post.message));assert.equal(outside.packet.src,s.net.nodes.vpn.ip);
 const inside=events.find(e=>e.kind==='origin'&&e.packet.kind==='vpn-outbound'&&e.packet.payload.protectedBytes>100);assert(!inside.packet.payload.record);
 assert(events.some(e=>e.kind==='web-decrypt-request'));assert.equal(s.net.browser.receipt,post.message);assert(s.net.browser.loadedSecure);
 assert.equal(s.net.vpn.last.https,true);assert(!s.net.vpn.last.preview.includes(post.message));
});

test('VPN works independently through laptop Wi-Fi, friend Wi-Fi and phone Wi-Fi/cellular',()=>{
 for(const [id,mode,link] of [['laptop','wifi','laptop-wifi'],['friend','wifi','friend-wifi'],['phone','wifi','phone-wifi'],['phone','cellular','phone-bts-park']]){
  const s=new Simulation();s.net.setAccess(id,mode,id==='phone'?'bts-park':undefined);s.net.setVPN(id,true);
  const events=run(s,'chatbot',{device:id,prompt:'Ahoj přes VPN'});assert.equal(s.status,'success');assert.equal(s.chatTurn().answer,CHATBOT_REPLY);
  assert(events.some(e=>e.kind==='hop'&&e.link===link));assert(s.net.vpnPeerValid(id));
  if(mode==='cellular')assert.equal(s.net.nat.home.rows.length,0);
 }
});

test('Local cable and Wi-Fi printing bypass VPN even while its server is off',()=>{
 for(const mode of ['cable','wifi']){
  const s=new Simulation();s.net.setAccess('laptop',mode);s.net.setVPN('laptop',true);s.net.toggleNode('vpn');
  const events=run(s,'print');assert.equal(s.status,'success');assert.equal(s.net.printer.count,1);
  assert(!events.some(e=>e.kind==='vpn-wrap'||e.kind==='vpn-unpack'));assert.equal(s.net.vpn.rows.length,0);assert.equal(s.net.nat.home.rows.length,0);
 }
});

test('An unavailable VPN server or uplink fails without a cleartext fallback and repeat restores service',()=>{
 for(const target of ['vpn','vpn-uplink']){
  const s=new Simulation();run(s);const previous=s.net.browser.content;s.net.setVPN('laptop',true);
  if(target==='vpn')s.net.toggleNode(target);else s.net.toggleLink(target);
  const events=run(s,'web',post);assert.equal(s.status,'failed');assert.equal(s.net.browser.content,previous);assert.equal(s.net.browser.receipt,'');
  assert(!events.some(e=>e.kind==='origin'&&e.node==='laptop'&&['http-request','dns-query'].includes(e.packet.kind)));
  if(target==='vpn')s.net.toggleNode(target);else s.net.toggleLink(target);
  assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.browser.receipt,post.message);
 }
});

test('Lost outer NAT or VPN exit mappings prevent return delivery rather than bypassing the tunnel',()=>{
 for(const target of ['home','exit']){
  const s=new Simulation();s.net.setVPN('laptop',true);s.start('web',{address:'http://knihovna.test',...post});
  until(s,()=>!!s.net.server.lastRequest);if(target==='home')s.net.clearNat('home');else s.net.vpn.rows=[];
  finish(s);assert.equal(s.status,'failed');assert.equal(s.net.browser.receipt,'');assert.equal(s.net.server.lastRequest.message,post.message);
  assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.browser.receipt,post.message);
 }
});

test('Changing VPN or physical access interrupts the old transfer and leaves new attempts consistent',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);s.start('web',{address:'http://knihovna.test',...post});
 until(s,()=>[...s.packets.values()].some(p=>p.kind==='vpn-outbound'&&p.state==='transit'));
 s.net.setVPN('laptop',false);s.connectionChanged('laptop');assert.equal(s.status,'failed');assert(s.repeat());finish(s);assert.equal(s.status,'success');
 assert.equal([...s.packets.values()].filter(p=>p.kind.startsWith('vpn-')).length,0);assert.equal(s.net.server.lastRequest.sourceIp,'192.0.2.1');
 s.net.setVPN('laptop',true);run(s);s.net.setAccess('laptop','wifi');assert(!s.net.vpnPeerValid('laptop'));
 run(s,'web',post);assert.equal(s.status,'success');assert.equal(s.net.vpn.clients.laptop.peer.physicalIp,'192.168.10.11');
});

test('Corrupted VPN ciphertext cannot reach its inner application and can be retried',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);s.start('web',{address:'http://knihovna.test'});
 until(s,()=>[...s.packets.values()].some(p=>p.kind==='vpn-outbound'));const p=[...s.packets.values()].find(p=>p.kind==='vpn-outbound');p.payload.cipher[0]^=1;
 finish(s);assert.equal(s.status,'failed');assert(s.current.description.includes('integrity'));assert.deepEqual(s.net.browser.dnsCache,{});assert.equal(s.net.browser.content,null);
 assert(s.repeat());finish(s);assert.equal(s.status,'success');
});

test('Grouped Instagram image data and read receipts survive VPN on both households without double counting',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);s.net.setVPN('friend',true);
 const events=run(s,'message',{messageType:'image'});assert.equal(s.status,'success');assert.equal(s.net.sender.sentPackets,72);assert.equal(s.net.friend.receivedPackets,72);
 assert.deepEqual(s.net.friend.content.bytes,s.net.sender.content.bytes);assert(events.some(e=>e.packet?.kind==='vpn-outbound'&&e.packet.payload.packetCount===10));
 const rows=s.net.vpn.rows.filter(r=>r.protocol==='TCP'&&r.remotePort===443);assert.equal(rows.length,2);assert.notEqual(rows[0].outsidePort,rows[1].outsidePort);
 assert.equal(s.net.vpn.sent,73);assert.equal(s.net.vpn.received,72);assert(s.markRead());finish(s);assert.equal(s.net.sender.state,'read');
});

test('Cloud authorization and queued Instagram delivery retain their behavior through VPN',()=>{
 const s=new Simulation();s.net.setVPN('laptop',true);s.net.setVPN('friend',true);
 run(s,'cloud',{request:{op:'list'}});assert.equal(s.status,'success');assert.equal(s.net.cloud.clients.laptop.state,'ready');
 s.start('message',{text:'Uchovaná zpráva',device:'laptop'});until(s,()=>s.net.instagram.state==='queued');s.net.toggleNode('vpn');finish(s);
 assert.equal(s.status,'waiting');assert.equal(s.net.instagram.text,'Uchovaná zpráva');s.net.toggleNode('vpn');s.net.toggleNode('laptop');
 assert(s.resumePending());finish(s);assert.equal(s.status,'success');assert.equal(s.net.friend.text,'Uchovaná zpráva');
});
