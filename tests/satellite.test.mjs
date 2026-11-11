import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,CABIN,SAT_WAN,contains,CHATBOT_REPLY}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<6000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function run(s,type='web',payload={}){assert(s.start(type,{device:'cabin',...payload}));return finish(s);}
function until(s,predicate){for(let i=0;i<6000&&s.status==='running'&&!predicate();i++)s.advanceFrame();assert(predicate());}
const hops=events=>events.filter(e=>e.kind==='hop'&&!e.copy);

test('The cabin uses its own LAN and radio bearer, with IP routing at terrestrial gateways and NAT at the cabin',()=>{
 const s=new Simulation(),n=s.net;assert.equal(n.access.cabin.mode,'wifi');assert(contains(CABIN,n.nodes.cabin.ip));
 assert.equal(n.natAddress('cabin-router'),'192.0.2.53');assert.equal(n.nodes['sat-leo'].type,'satellite');
 assert.equal(n.route('cabin-router',n.nodes.web.ip).next,'sat-gateway');assert.equal(n.route('sat-gateway','192.0.2.53').prefix,SAT_WAN);
 for(const id of ['edge','north','dc','hosting-router'])assert(!n.nodes[id].routes.some(r=>r.prefix===CABIN));
 assert.deepEqual(n.shortest('cabin-router','north'),['cabin-router','sat-terminal','sat-leo','sat-gateway','north']);
});

test('DNS and HTTP requests and replies cross both satellite radio links and preserve NAT return bindings',()=>{
 const s=new Simulation(),events=run(s),wanted=['cabin-wifi','cabin-ap-switch','cabin-lan','cabin-wan','sat-uplink','sat-downlink','sat-internet'];assert.equal(s.status,'success');
 for(const kind of ['dns-query','dns-response','http-request','http-response'])for(const link of wanted)assert(hops(events).some(e=>e.link===link&&e.packet.kind===kind),kind+' on '+link);
 assert.equal(s.net.cabinBrowser.content,s.net.server.title);assert.equal(s.net.server.lastRequest.sourceIp,'192.0.2.53');assert.equal(s.net.browser.content,null);
 assert.equal(s.net.nat['cabin-router'].rows.length,2);assert(s.net.nat['cabin-router'].rows.every(r=>r.outbound&&r.inbound));
 assert([...s.packets.values()].every(p=>p.satelliteHistory.length===2));
});

test('Radio propagation uses three continuous portions and leaves the IP packet unchanged between antenna and gateway',()=>{
 const s=new Simulation(),events=run(s),packet=[...s.packets.values()].find(p=>p.kind==='dns-query');
 const radio=events.filter(e=>e.packet?.id===packet.id&&e.link==='sat-uplink'&&['satellite-flight','hop'].includes(e.kind));
 assert.deepEqual(radio.map(e=>e.kind),['satellite-flight','satellite-flight','hop']);assert.deepEqual(radio.slice(0,2).map(e=>e.progress),[1/3,2/3]);
 assert.equal(radio[1].at-radio[0].at,1);assert.equal(radio[2].at-radio[1].at,1);assert.equal(radio[2].packet.visual.startProgress,2/3);
 const route=hops(events).filter(e=>e.packet.id===packet.id&&['cabin-wan','sat-uplink','sat-downlink'].includes(e.link));
 assert.equal(new Set(route.map(e=>e.packet.ttl)).size,1);assert(route.every(e=>e.frame.satellite&&!e.frame.src&&!e.frame.dst));
 assert.deepEqual(route.map(e=>e.header),[route[0].header,route[0].header,route[0].header]);
});

test('HTTPS and VPN work over satellite, with opaque tunnel data and independent exit NAT',()=>{
 for(const vpn of [false,true]){const s=new Simulation();if(vpn)s.net.setVPN('cabin',true);
 const text='HTTPS z chaty 🙂',events=run(s,'web',{address:'https://knihovna.test',method:'POST',message:text});assert.equal(s.status,'success');assert.equal(s.net.cabinBrowser.receipt,text);assert(s.net.cabinBrowser.loadedSecure);
 const radio=hops(events).filter(e=>e.link==='sat-uplink');assert(radio.length);if(vpn){assert(radio.every(e=>e.packet.kind.startsWith('vpn-')));assert(radio.every(e=>!JSON.stringify(e.packet).includes(text)));assert.equal(s.net.server.lastRequest.sourceIp,s.net.nodes.vpn.ip);assert.equal(s.net.vpn.clients.cabin.peer.ip,'192.0.2.53');assert(s.net.vpnPeerValid('cabin'));}else assert.equal(s.net.server.lastRequest.sourceIp,'192.0.2.53');}
});

test('The cabin cloud keeps its own local files and transports uploads, ACLs and downloads over satellite',()=>{
 const s=new Simulation(),text='Deník z chaty přes satelit 🙂';let events=run(s,'cloud',{request:{op:'upload',name:'Chata.txt',content:text}});assert.equal(s.status,'success');assert(hops(events).some(e=>e.link==='sat-uplink'));
 const file=[...s.net.cloud.files.values()].find(f=>f.name==='Chata.txt');assert.equal(file.owner,'ty');
 run(s,'cloud',{request:{op:'permissions',fileId:file.id,permission:'read',aclVersion:file.aclVersion}});assert.equal(s.status,'success');assert.equal(file.permissions.matej,'read');
 run(s,'cloud',{request:{op:'download',fileId:file.id}});assert.equal(s.status,'success');assert.equal(s.net.cloud.local.cabin.at(-1).content,text);assert(!s.net.cloud.local.laptop.some(f=>f.cloudId===file.id));
});

test('Concurrent message packets cross satellite and the read receipt returns to the cabin through its original binding',()=>{
 const s=new Simulation(),text='Zpráva přes satelit 🙂 '.repeat(200);assert(s.start('message',{device:'cabin',text}));let overlap=false;
 for(let i=0;i<6000&&s.status==='running';i++){s.advanceFrame();const active=[...s.packets.values()].filter(p=>p.kind==='message'&&p.state==='transit');if(active.length>1&&new Set(active.map(p=>p.visual?.link||p.location)).size>1)overlap=true;}
 assert.equal(s.status,'success');assert(overlap);assert.equal(s.net.friend.text,text);assert.equal(s.net.instagram.senderDevice,'cabin');
 assert(s.markRead());const events=finish(s);assert.equal(s.net.sender.state,'read');assert(hops(events).some(e=>e.link==='sat-downlink'&&e.packet.kind==='ig-read'));assert.equal(s.net.instagramChannel('cabin').ip,'192.0.2.53');
});

test('The chatbot computes on its original server and returns the complete answer over satellite',()=>{
 const s=new Simulation(),events=run(s,'chatbot',{prompt:'Jak to funguje na chatě?'});assert.equal(s.status,'success');assert.equal(s.net.chatbot.clients.cabin.turns.at(-1).answer,CHATBOT_REPLY);
 assert(events.some(e=>e.kind==='chatbot-compute'));assert(hops(events).some(e=>e.link==='sat-uplink'&&e.packet.kind==='chatbot-response'));assert.equal(s.net.chatbot.clients.laptop.turns.length,0);
});

test('Wi-Fi and cable are local choices; disabling the cabin AP leaves satellite available over cable',()=>{
 const s=new Simulation();s.net.toggleNode('cabin-ap');run(s);assert.equal(s.status,'failed');s.net.setAccess('cabin','cable');
 const events=run(s);assert.equal(s.status,'success');assert(hops(events).some(e=>e.link==='cabin-cable'));assert(!hops(events).some(e=>e.link==='cabin-wifi'));assert(hops(events).some(e=>e.link==='sat-uplink'));assert.equal(s.net.nodes.cabin.ip,'192.168.30.10');
});

test('A blocked view, power loss or cut link interrupts satellite access and restoration permits retry without affecting the city',()=>{
 for(const id of ['view','sat-terminal','sat-leo','sat-gateway','cabin-wan','sat-uplink','sat-downlink','sat-internet']){
 const s=new Simulation(),n=s.net;const toggle=()=>id==='view'?n.setSatelliteView(!n.satellite.clearView):n.nodes[id]?n.toggleNode(id):n.toggleLink(id);toggle();run(s);assert.equal(s.status,'failed',id);assert.equal(n.cabinBrowser.content,null);
 run(s,'web',{device:'laptop'});assert.equal(s.status,'success',id+' must not affect the city');toggle();run(s);assert.equal(s.status,'success',id+' restored');}
});

test('Blocking the antenna during flight loses the packet, exposes no partial result and can be repeated',()=>{
 const s=new Simulation();assert(s.start('web',{device:'cabin'}));until(s,()=>s.current?.kind==='satellite-flight');s.net.setSatelliteView(false);finish(s);assert.equal(s.status,'failed');assert.equal(s.net.cabinBrowser.content,null);assert([...s.packets.values()].some(p=>p.state==='lost'));
 s.net.setSatelliteView(true);assert(s.repeat());finish(s);assert.equal(s.status,'success');
});
