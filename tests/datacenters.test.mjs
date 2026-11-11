import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,contains}=globalThis.InternetLab;
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<4000;i++){sim.advanceFrame();events.push(...structuredClone(sim.frame));}
  assert.notEqual(sim.status,'running');return events;
}
function run(sim,type,payload={}) {assert(sim.start(type,payload));return finish(sim);}
function cloud(sim,op='list',server='cloud',device='laptop',extra={}) {
  return run(sim,'cloud',{device,server,request:{op,...extra}});
}
function upload(sim,text='Kopie dat 🙂') {
  cloud(sim,'upload','cloud','laptop',{name:'Dvě centra.txt',content:text});
  assert.equal(sim.status,'success');return [...sim.net.cloud.files.values()].at(-1);
}

test('Four service LANs have distinct prefixes, routers and return paths through their own switches',()=> {
  const sim=new Simulation(),net=sim.net;
  for(const [host,gateway,link] of [['web','hosting-router','hosting-lan'],['dns','hosting-router','hosting-lan'],['instagram','ig-router','ig-lan'],['cloud','cloud-router','cloud-lan'],['cloud-backup','replica-router','replica-lan']]) {
    const out=net.ethernetFor(host,net.nodes.laptop.ip);
    assert.equal(out.frame.dst,net.nodes[gateway].mac);
    assert(net.nodes[gateway].routes.some(r=>r.link===link&&r.connected&&contains(r.prefix,net.nodes[host].ip)));
    assert.equal(net.nodes[gateway].routes.filter(r=>r.connected&&contains(r.prefix,net.nodes[host].ip)).length,1);
  }
  assert.equal(new Set(['web','instagram','cloud','cloud-backup'].map(id=>net.nodes[id].region)).size,4);
  for(const link of Object.values(net.links))for(const id of [link.a,link.b])assert(net.nodes[id].interfaces[net.port(link,id)]);
});

test('Hosting and Instagram outages affect their own service while the other centers remain reachable',()=> {
  const sim=new Simulation();sim.net.toggleLink('dc-access');
  run(sim,'web');assert.equal(sim.status,'failed');
  const events=run(sim,'message',{text:'Jiná budova, jiná přípojka.'});assert.equal(sim.status,'success');
  assert(events.some(e=>e.kind==='hop'&&e.link==='ig-uplink'));assert(!events.some(e=>e.kind==='hop'&&e.link==='dc-access'));
  cloud(sim);assert.equal(sim.status,'success');
  sim.net.toggleLink('dc-access');sim.net.toggleLink('ig-uplink');
  run(sim,'web');assert.equal(sim.status,'success');
  run(sim,'message',{text:'Nedostupný Instagram'});assert.equal(sim.status,'failed');
  cloud(sim);assert.equal(sim.status,'success');
});

test('Replication transports a complete UTF-8 snapshot and ACLs between independent centers before publishing it',()=> {
  const sim=new Simulation(),text='Žluťoučký kůň 🙂 '.repeat(40),file=upload(sim,text),storage=sim.net.cloud;
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'read',aclVersion:file.aclVersion});
  assert(!storage.replicaCurrent());assert(!storage.replica.files.has(file.id));
  assert(sim.start('replicate'));let partial=false;const events=[];
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advanceFrame();events.push(...structuredClone(sim.frame));
    const delivered=[...sim.packets.values()].filter(p=>p.state==='delivered');
    if(delivered.length&&delivered.length<sim.packets.size){partial=true;assert(!storage.replica.files.has(file.id));}
  }
  assert.equal(sim.status,'success');assert(partial);assert(storage.replicaCurrent());
  assert.deepEqual(storage.replica.files.get(file.id),file);assert.notEqual(storage.replica.files.get(file.id),file);
  assert(events.some(e=>e.kind==='hop'&&e.link==='cloud-uplink'));
  assert(events.some(e=>e.kind==='hop'&&e.link==='replica-uplink'));
  const packets=[...sim.packets.values()];assert(packets.length>1);
  assert(packets.every(p=>p.kind==='cloud-replica'&&p.src==='203.0.113.140'&&p.dst==='203.0.113.204'&&p.natHistory.length===0));
  const snapshot=new Uint8Array(packets[0].payload.totalBytes);
  for(const p of packets)snapshot.set(p.payload.bytes,p.payload.offset);
  assert.equal(JSON.parse(new TextDecoder().decode(snapshot)).files.find(f=>f.id===file.id).content,text);
});

test('The second center serves current copies with exact permissions even while the primary is offline',()=> {
  const sim=new Simulation(),file=upload(sim);
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'read',aclVersion:file.aclVersion});
  run(sim,'replicate');sim.net.toggleLink('cloud-uplink');
  const events=cloud(sim,'download','cloud-backup','friend',{fileId:file.id});
  assert.equal(sim.status,'success');assert.equal(sim.net.cloud.local.friend.at(-1).content,file.content);
  assert(events.some(e=>e.kind==='deliver'&&e.node==='cloud-backup'));
  assert(!events.some(e=>e.kind==='hop'&&e.link==='cloud-uplink'));
  const reply=[...sim.packets.values()].find(p=>p.kind==='cloud-response');assert.equal(reply.src,'203.0.113.204');assert.equal(reply.dst,'172.16.20.10');assert.equal(reply.natHistory[0].direction,'in');
  cloud(sim,'upload','cloud-backup','friend',{fileId:file.id,version:file.version,name:file.name,content:'Zápis do kopie'});
  assert.equal(sim.status,'failed');assert.match(sim.net.cloud.clients.friend.message,/405/);
  assert.notEqual(sim.net.cloud.replica.files.get(file.id).content,'Zápis do kopie');
});

test('A stale copy cannot bypass a revoked ACL; synchronization applies the new rights',()=> {
  const sim=new Simulation(),file=upload(sim),storage=sim.net.cloud;
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'read',aclVersion:file.aclVersion});run(sim,'replicate');
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'none',aclVersion:file.aclVersion});
  cloud(sim,'download','cloud-backup','friend',{fileId:file.id});assert.equal(sim.status,'failed');assert.match(storage.clients.friend.message,/503/);
  run(sim,'replicate');cloud(sim,'download','cloud-backup','friend',{fileId:file.id});assert.equal(sim.status,'failed');assert.match(storage.clients.friend.message,/403/);
  assert(!storage.local.friend.some(f=>f.cloudId===file.id));
});

test('Interrupted synchronization preserves the last complete copy and can be repeated without partial data',()=> {
  const sim=new Simulation(),storage=sim.net.cloud;upload(sim);const before=structuredClone(storage.replica.files);
  assert(sim.start('replicate'));
  for(let i=0;![...sim.packets.values()].some(p=>p.state==='delivered')&&i<1000;i++)sim.advanceFrame();
  sim.net.toggleLink('replica-server');finish(sim);assert.equal(sim.status,'failed');assert.deepEqual(storage.replica.files,before);
  assert(!storage.replicaCurrent());sim.net.toggleLink('replica-server');assert(sim.repeat());finish(sim);
  assert.equal(sim.status,'success');assert(storage.replicaCurrent());assert.deepEqual(storage.replica.files,storage.files);
});
