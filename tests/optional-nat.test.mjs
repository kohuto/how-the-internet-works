import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';
import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';
import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,Simulation,LabSettings,HOME,FRIEND,LAB_FEATURES}=globalThis.InternetLab;
const create=(features=[],nat=false)=>new Simulation(new Network(new LabSettings({features,details:{nat}})));
function finish(s,expected='success') {
  const events=[];
  for(let i=0;s.status==='running'&&i<12000;i++){
    s.advanceFrame();
    events.push(...s.frame.map(e=>({kind:e.kind,node:e.node,link:e.link,from:e.from,to:e.to,copy:e.copy,header:e.header&&{...e.header},packet:e.packet?.id,packetKind:e.packet?.kind})));
  }
  assert.equal(s.status,expected,s.current?.description);return events;
}
function run(s,type='web',payload={}){assert(s.start(type,payload));return finish(s);}
function noNat(s){
  assert(Object.values(s.net.nat).every(n=>n.rows.length===0));assert.equal(s.net.vpn.rows.length,0);
  for(const p of s.packets.values()){
    assert.deepEqual(p.natHistory,[]);
    for(const trace of p.vpnHistory||[])assert.deepEqual(trace.natHistory,[]);
  }
}
test('Base web keeps the actual laptop/server tuple on every hop in both directions',()=>{
  const s=create(),events=run(s),request=[...s.packets.values()].find(p=>p.kind==='http-request'),reply=[...s.packets.values()].find(p=>p.kind==='http-response');
  assert.deepEqual(s.net.packetHeader(request),{protocol:'TCP',src:'192.168.10.10',sport:51000,dst:'203.0.113.10',dport:80});
  assert.deepEqual(s.net.packetHeader(reply),{protocol:'TCP',src:request.dst,sport:80,dst:request.src,dport:51000});
  for(const p of [request,reply]){
    const hops=events.filter(e=>e.kind==='hop'&&e.packet===p.id);assert(hops.length>5);
    for(const e of hops)assert.deepEqual(e.header,p.initialHeader,e.link);
    assert.equal(p.state,'delivered');
  }
  assert.equal(s.net.server.lastRequest.sourceIp,s.net.nodes.laptop.ip);noNat(s);
  assert(s.net.nodes.edge.routes.some(r=>r.prefix===HOME));
});
test('NAT is opt-in independently of every extension, and changes network mode rather than presentation',()=>{
  const base=new LabSettings(),nat=new LabSettings({details:{nat:true}});
  assert(!base.sameNetwork(nat));assert(!nat.sameNetwork(base));assert(nat.sameNetwork(new LabSettings(nat.toJSON())));
  assert(base.sameNetwork(new LabSettings({details:{routes:true,devices:true,headers:true}})));
  for(const f of LAB_FEATURES)assert(!new LabSettings({features:[f.id]}).details.nat,f.id);
  const s=create([],true),events=run(s),request=[...s.packets.values()].find(p=>p.kind==='http-request');
  assert.equal(request.src,s.net.natAddress('home'));assert.equal(request.sport,40000);
  assert(events.some(e=>e.kind==='hop'&&e.link==='uplink'&&e.header.src==='192.0.2.1'));
  assert.equal(s.net.nat.home.rows.length,1);assert.equal(request.natHistory.length,1);
  assert(s.net.nodes.edge.routes.every(r=>r.prefix!==HOME&&r.prefix!==FRIEND));
});
test('Direct return routing works over each home access, both mobile attachments, satellite and cafe Wi-Fi',()=>{
  for(const [device,mode] of [['laptop','cable'],['laptop','wifi'],['friend','cable'],['friend','wifi'],['cabin','cable'],['cabin','wifi'],['phone','wifi'],['phone','cellular'],['phone','fallback'],['cafe','trusted'],['cafe','rogue']]){
    const s=create(['friend','satellite','mobile','wifi','mitm','dns','tls']);
    if(device==='cafe'){
      if(mode==='rogue')s.mitm.configure(true,'http');
      assert(s.net.setCafeHotspot(mode,...(mode==='trusted'?[s.net.cafeWifi.password]:[])));
    }
    else if(mode==='fallback')s.net.toggleNode('bts-lipova');
    else if(s.net.access[device].mode!==mode)assert(s.net.setAccess(device,mode));
    const ip=s.net.nodes[device].ip,events=run(s,'web',{device,address:'https://knihovna.test/'});
    for(const p of s.packets.values()){
      assert.deepEqual(s.net.packetHeader(p),p.initialHeader,`${device}/${mode}/${p.kind}`);
      assert.equal(p.source===device?p.src:p.dst,ip);
    }
    assert.equal(s.net.server.lastRequest.sourceIp,ip);noNat(s);
    if(mode==='fallback')assert(events.some(e=>e.link==='bts-park-uplink'));
    if(device==='cabin')assert(events.some(e=>e.link==='sat-uplink'));
  }
});
test('SMTP, IMAP, chatbot and cloud retain real device endpoints without NAT',()=>{
  const s=create(['mail','chatbot','cloud']);
  const actions=[['mail-send',{device:'laptop',target:'friend',subject:'Bez NAT',body:'Pozdrav přes síť'}],['mail-check',{device:'friend'}],['chatbot',{device:'friend',prompt:'Ahoj'}],['cloud',{device:'laptop',request:{op:'list'}}]];
  for(const [type,payload] of actions){
    run(s,type,payload);noNat(s);
    for(const p of s.packets.values())assert.deepEqual(s.net.packetHeader(p),p.initialHeader,p.kind);
  }
  assert.equal(s.net.phishing.clients.friend.inbox.body,'Pozdrav přes síť');
});
test('Instagram checks, opposite messages, queued delivery and read receipts use direct channels',()=>{
  const s=create(['instagram']);
  run(s,'message',{device:'laptop',text:'První'});noNat(s);
  assert.equal(s.net.instagramChannel('friend').ip,s.net.nodes.friend.ip);
  assert(s.markRead());finish(s);assert.equal(s.net.sender.state,'read');noNat(s);
  run(s,'message',{device:'friend',text:'Odpověď'});noNat(s);
  assert([...s.packets.values()].some(p=>p.kind==='ig-check'&&p.source==='laptop'));
  s.net.setAccess('friend','offline');
  assert(s.start('message',{device:'laptop',text:'Počkám'}));finish(s,'waiting');
  s.net.setAccess('friend','cable');assert(s.resumePending());finish(s);noNat(s);
  assert.equal(s.net.friend.text,'Počkám');
});
test('VPN without NAT routes tunnel addresses back through the VPN endpoint with no address or port translation',()=>{
  for(const [device,mode] of [['laptop','cable'],['friend','wifi'],['phone','cellular'],['phone','wifi'],['cabin','wifi'],['cafe','trusted']]){
    const s=create(['vpn','friend','mobile','satellite','wifi','mitm','dns','tls']);
    if(device==='cafe')s.net.setCafeHotspot('trusted',s.net.cafeWifi.password);
    else if(s.net.access[device].mode!==mode)s.net.setAccess(device,mode);
    assert(s.net.setVPN(device,true));const ip=s.net.nodes[device].ip,c=s.net.vpn.clients[device];
    const events=run(s,'web',{device,address:'https://knihovna.test/',method:'POST',message:'Tunel bez NAT'});
    assert.equal(s.net.server.lastRequest.sourceIp,c.ip);assert.equal(s.net.browserFor(device).receipt,'Tunel bez NAT');
    assert.equal(c.peer.ip,ip);assert.equal(c.peer.port,c.port);assert(s.net.vpnPeerValid(device));noNat(s);
    const exits=events.filter(e=>e.kind==='origin'&&e.node==='vpn'&&!e.packetKind.startsWith('vpn-'));assert(exits.length);
    assert(exits.every(e=>e.header.src===c.ip));
    const outer=events.filter(e=>e.kind==='hop'&&e.packetKind==='vpn-outbound');assert(outer.length);
    assert(outer.every(e=>e.header.src===ip&&e.header.sport===c.port));
    const replies=events.filter(e=>e.kind==='hop'&&e.link==='vpn-server'&&e.to==='vpn'&&!e.packetKind.startsWith('vpn-'));assert(replies.length);
    assert(replies.every(e=>e.header.dst===c.ip));
  }
});
test('Two VPN Instagram clients with the same source port remain distinct without exit NAT',()=>{
  const s=create(['vpn','instagram','cloud']);s.net.setVPN('laptop',true);s.net.setVPN('friend',true);
  run(s,'message',{device:'laptop',text:'Přes tunely'});noNat(s);
  for(const device of ['laptop','friend'])assert.equal(s.net.instagramChannel(device).ip,s.net.vpn.clients[device].ip);
  assert(s.markRead());finish(s);assert.equal(s.net.sender.state,'read');noNat(s);
  run(s,'message',{device:'friend',text:'Zpět'});noNat(s);
  run(s,'cloud',{device:'laptop',request:{op:'list'}});noNat(s);
});
test('Direct routes follow outages and an unavailable VPN does not fall back to an unprotected path',()=>{
  const s=create(['vpn']);s.net.toggleLink('edge-north');
  const events=run(s);assert(events.some(e=>e.link==='edge-south'));noNat(s);
  s.net.setVPN('laptop',true);s.net.toggleNode('vpn');
  assert(s.start('web'));finish(s,'failed');assert(![...s.packets.values()].some(p=>p.kind==='http-request'&&p.state==='delivered'));noNat(s);
  s.net.toggleNode('vpn');assert(s.repeat());finish(s);noNat(s);
});
