import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,HOME,FRIEND}=globalThis.InternetLab;
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<3000;i++){sim.advanceFrame();events.push(...structuredClone(sim.frame));}
  assert.notEqual(sim.status,'running');return events;
}
function run(sim,type='web',payload={}) {assert(sim.start(type,payload));return finish(sim);}
function until(sim,predicate) {
  for(let i=0;!predicate()&&sim.status==='running'&&i<1000;i++)sim.advanceFrame();
  assert(predicate());
}

test('DNS translates source IP and UDP port on WAN and restores destination only at the home router',()=> {
  const sim=new Simulation(),events=run(sim);
  assert.equal(sim.status,'success');
  const request=[...sim.packets.values()].find(p=>p.kind==='dns-query'),reply=[...sim.packets.values()].find(p=>p.kind==='dns-response');
  assert.equal(request.initialHeader.src,'192.168.10.10');assert.equal(request.src,'192.0.2.1');assert.equal(request.sport,40000);
  assert.equal(reply.initialHeader.dst,'192.0.2.1');assert.equal(reply.initialHeader.dport,40000);
  assert.equal(reply.dst,'192.168.10.10');assert.equal(reply.dport,53000);assert.equal(reply.state,'delivered');
  assert.equal(request.natHistory.length,1);assert.equal(reply.natHistory.length,1);
  assert.equal(request.natHistory[0].direction,'out');assert.equal(reply.natHistory[0].direction,'in');
  assert.equal(reply.natHistory[0].before.src,reply.natHistory[0].after.src);
  const outside=events.filter(e=>e.kind==='hop'&&e.packet.id===reply.id&&e.link==='uplink');
  assert(outside.every(e=>e.header.dst==='192.0.2.1'&&e.header.dport===40000));
  const inside=events.find(e=>e.kind==='hop'&&e.packet.id===reply.id&&e.link==='switch-home');
  assert.equal(inside.header.dst,'192.168.10.10');assert.equal(inside.header.dport,53000);
});

test('Two clients using the same UDP source port share one WAN IP with distinct return bindings',()=> {
  const sim=new Simulation();sim.net.setAccess('laptop','wifi');sim.net.setAccess('phone','wifi');
  run(sim);run(sim,'web',{device:'phone'});
  const rows=sim.net.nat.home.rows.filter(r=>r.protocol==='UDP'&&r.insidePort===53000);
  assert.equal(rows.length,2);assert.notEqual(rows[0].outsidePort,rows[1].outsidePort);
  assert(rows.every(r=>r.outsideIp==='192.0.2.1'));
  for(const row of rows) {
    const reply={protocol:'UDP',src:row.remoteIp,sport:row.remotePort,dst:row.outsideIp,dport:row.outsidePort,natHistory:[]};
    const translation=sim.net.natIncoming('home',reply,'uplink');
    assert.equal(translation.direction,'in');assert.equal(reply.dst,row.insideIp);assert.equal(reply.dport,53000);
  }
  assert.equal(sim.net.phoneBrowser.content,sim.net.server.title);assert.equal(sim.net.browser.content,sim.net.server.title);
});

test('Providers route WAN addresses, never private home prefixes; payload, TCP SEQ and routing TTL still agree',()=> {
  const sim=new Simulation(),events=run(sim);
  for(const id of ['edge','north','south','dc','peer','mobile-core'])assert(sim.net.nodes[id].routes.every(r=>r.prefix!==HOME&&r.prefix!==FRIEND));
  assert(sim.net.nodes.home.routes.some(r=>r.prefix===HOME&&r.connected));
  assert(sim.net.nodes['friend-home'].routes.some(r=>r.prefix===FRIEND&&r.connected));
  for(const e of events.filter(e=>e.kind==='hop'&&['uplink','edge-north','north-dc','dc-access'].includes(e.link))) {
    assert(!e.header.src.startsWith('192.168.')&&!e.header.dst.startsWith('192.168.'));
  }
  for(const p of sim.packets.values()) {
    assert.equal(p.ttl,64-events.filter(e=>e.kind==='route'&&e.packet.id===p.id).length);
    if(p.protocol==='TCP')assert.equal(p.seq,p.kind==='http-request'?1001:8001);
  }
  assert.equal(sim.net.browser.content,sim.net.server.title);
});

test('LAN printing bypasses NAT and mobile data keep their separate public model address',()=> {
  const sim=new Simulation();run(sim,'print',{document:'Místní tisk.pdf'});
  assert.equal(sim.status,'success');assert.equal(sim.net.nat.home.rows.length,0);
  assert([...sim.packets.values()].every(p=>p.natHistory.length===0&&p.src==='192.168.10.10'));
  run(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
  assert.equal(sim.net.nat.home.rows.length,0);
  assert([...sim.packets.values()].every(p=>p.natHistory.length===0));
  assert([...sim.packets.values()].filter(p=>p.source==='phone').every(p=>p.src==='198.51.100.10'));
});

test('Unsolicited incoming packets cannot use a binding for a different peer, port or protocol',()=> {
  const sim=new Simulation();run(sim);const row=sim.net.nat.home.rows.find(r=>r.protocol==='UDP');
  for(const mismatch of [{src:'203.0.113.80'},{sport:9999},{protocol:'TCP'},{dport:39999}]) {
    const p={protocol:'UDP',src:row.remoteIp,sport:row.remotePort,dst:row.outsideIp,dport:row.outsidePort,...mismatch};
    const original=structuredClone(p);assert(sim.net.natIncoming('home',p,'uplink').blocked);assert.deepEqual(p,original);
  }
});

test('Deleting NAT state before an HTTP reply arrives drops it; retry creates fresh state and succeeds',()=> {
  const sim=new Simulation();assert(sim.start('web'));
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='http-response'));
  const reply=[...sim.packets.values()].find(p=>p.kind==='http-response'),oldPort=reply.dport;
  sim.net.clearNat('home');finish(sim);
  assert.equal(sim.status,'failed');assert.equal(reply.state,'lost');assert.equal(reply.location,'home');assert.equal(reply.dst,'192.0.2.1');
  assert.match(sim.current.description,/záznam NAT/);assert.equal(sim.net.nodes.home.lastDecision.kind,'nat-drop');
  assert.equal(sim.net.browser.content,null);
  assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');
  const newReply=[...sim.packets.values()].find(p=>p.kind==='http-response');assert.notEqual(newReply.initialHeader.dport,oldPort);
});

test('Changing access or power removes obsolete mappings without affecting the other household',()=> {
  const sim=new Simulation();sim.net.setAccess('laptop','wifi');run(sim);run(sim,'cloud',{device:'friend',request:{op:'list'}});
  assert(sim.net.nat.home.rows.some(r=>r.insideIp==='192.168.10.11'));assert(sim.net.nat['friend-home'].rows.length);
  const friendRows=structuredClone(sim.net.nat['friend-home'].rows);
  sim.net.setAccess('laptop','cable');assert.equal(sim.net.nat.home.rows.length,0);assert.deepEqual(sim.net.nat['friend-home'].rows,friendRows);
  run(sim);assert(sim.net.nat.home.rows.length);sim.net.toggleNode('home');assert.equal(sim.net.nat.home.rows.length,0);
  assert.deepEqual(sim.net.nat['friend-home'].rows,friendRows);
  sim.net.toggleNode('friend');assert.equal(sim.net.nat['friend-home'].rows.length,0);
});

test('Instagram recipient opens the outbound NAT session before the service can deliver through it',()=> {
  const sim=new Simulation(),events=run(sim,'message',{text:'Zpráva přes dva domácí NATy 🙂'});
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,'Zpráva přes dva domácí NATy 🙂');
  const connect=events.find(e=>e.kind==='deliver'&&e.packet.kind==='ig-connect'),delivery=events.find(e=>e.kind==='origin'&&e.packet.kind==='ig-delivery');
  assert(connect&&delivery&&connect.at<delivery.at);
  assert.equal(connect.header.src,'192.0.2.26');assert.equal(connect.header.dst,'203.0.113.80');
  const p=[...sim.packets.values()].find(p=>p.kind==='ig-delivery');
  assert.equal(p.initialHeader.dst,'192.0.2.26');assert.equal(p.initialHeader.dport,connect.header.sport);
  assert.equal(p.dst,'172.16.20.10');assert.equal(p.dport,52002);
  assert.equal(p.natHistory[0].router,'friend-home');assert.equal(p.natHistory[0].direction,'in');
  assert(sim.markRead());finish(sim);assert.equal(sim.net.sender.state,'read');
  const receipt=[...sim.packets.values()].find(p=>p.kind==='ig-read'&&p.destination==='laptop');
  assert.equal(receipt.initialHeader.dst,'192.0.2.1');assert.equal(receipt.dst,'192.168.10.10');
});

test('Losing the recipient NAT session forces a new outbound session for the next stored message',()=> {
  const sim=new Simulation();run(sim,'message',{text:'První'});
  sim.net.clearNat('friend-home');const events=run(sim,'message',{text:'Druhá'});
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,'Druhá');
  assert(events.some(e=>e.kind==='origin'&&e.packet.kind==='ig-connect'&&e.packet.source==='friend'));
});

test('Cloud response segments use the observed mapped client port and retain exact file data',()=> {
  const sim=new Simulation(),local=sim.net.cloud.local.friend[0],text='Cloud za NATem: žluťoučký kůň 🙂 '.repeat(15);
  run(sim,'cloud',{device:'friend',localId:local.id,request:{op:'upload',name:'NAT.txt',content:text}});
  assert.equal(sim.status,'success');assert.equal(sim.net.cloud.files.get(local.cloudId).content,text);
  const packets=[...sim.packets.values()],requests=packets.filter(p=>p.kind==='cloud-request'),responses=packets.filter(p=>p.kind==='cloud-response');
  assert(requests.every(p=>p.src==='192.0.2.26'&&p.sport===requests[0].sport));
  assert(responses.every(p=>p.initialHeader.dst==='192.0.2.26'&&p.initialHeader.dport===requests[0].sport&&p.dst==='172.16.20.10'&&p.dport===51003));
  assert.equal(sim.net.nat['friend-home'].rows.length,1);
});
