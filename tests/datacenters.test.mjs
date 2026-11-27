import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,contains}=globalThis.InternetLab;
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<4000;i++){sim.advanceFrame();events.push(...structuredClone(sim.frame));}
  assert.notEqual(sim.status,'running');return events;
}
function run(sim,type,payload={}) {assert(sim.start(type,payload));return finish(sim);}
function until(sim,predicate) {for(let i=0;!predicate()&&sim.status==='running'&&i<4000;i++)sim.advanceFrame();assert(predicate());}
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

test('Hosting customers share a switch but keep separate stored pages and server availability',()=> {
  const sim=new Simulation(),net=sim.net,customers=['hosting-web-2','hosting-web-3'];
  for(const id of customers){
    const node=net.nodes[id],link=net.adjacent(id)[0];
    assert.equal(net.peer(link,id),'dc-switch');
    assert(contains('203.0.113.0/26',node.ip));
    assert.notEqual(node.mac,net.nodes.web.mac);
    assert.notEqual(net.hostedSites[id].files['index.html'],net.server.files['index.html']);
  }
  const stored=structuredClone(net.hostedSites);
  const events=run(sim,'web');assert.equal(sim.status,'success');
  for(const id of customers){
    assert(events.some(e=>e.kind==='hop'&&e.to===id&&e.discarded),'Unknown-unicast copies are rejected by the other customers');
    assert(!events.some(e=>e.kind==='deliver'&&e.node===id));
    net.toggleNode(id);
  }
  run(sim,'web');assert.equal(sim.status,'success');assert.equal(net.browser.content,net.server.title);
  for(const id of customers)net.toggleNode(id);
  net.toggleNode('web');run(sim,'web');assert.equal(sim.status,'failed');
  assert.deepEqual(net.hostedSites,stored,'A library request or power change does not overwrite another customer’s files');
});

test('Automatic replication transports a complete UTF-8 snapshot and ACLs before publishing it',()=> {
  const sim=new Simulation(),text='Žluťoučký kůň 🙂 '.repeat(40),file=upload(sim,text),storage=sim.net.cloud;
  assert(sim.start('cloud',{device:'laptop',request:{op:'permissions',fileId:file.id,permission:'read',aclVersion:file.aclVersion}}));
  until(sim,()=>!!sim.replicaResult);
  assert.equal(storage.clients.laptop.state,'ready');assert(!storage.replicaCurrent());
  assert.equal(storage.replica.files.get(file.id).permissions.matej,undefined);
  let partial=false;const events=[];
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advanceFrame();events.push(...structuredClone(sim.frame));
    const packets=[...sim.packets.values()].filter(p=>p.kind==='cloud-replica'),delivered=packets.filter(p=>p.state==='delivered');
    if(delivered.length&&delivered.length<packets.length){partial=true;assert.equal(storage.replica.files.get(file.id).permissions.matej,undefined);}
  }
  assert.equal(sim.status,'success');assert(partial);assert(storage.replicaCurrent());
  assert.deepEqual(storage.replica.files.get(file.id),file);assert.notEqual(storage.replica.files.get(file.id),file);
  assert(events.some(e=>e.kind==='hop'&&e.link==='cloud-uplink'));
  assert(events.some(e=>e.kind==='hop'&&e.link==='replica-uplink'));
  const packets=[...sim.packets.values()].filter(p=>p.kind==='cloud-replica');assert(packets.length>1);
  assert(packets.every(p=>p.kind==='cloud-replica'&&p.src==='203.0.113.140'&&p.dst==='203.0.113.204'&&p.natHistory.length===0));
  const snapshot=new Uint8Array(packets[0].payload.totalBytes);
  for(const p of packets)snapshot.set(p.payload.bytes,p.seq-1001);
  assert.equal(JSON.parse(new TextDecoder().decode(snapshot)).files.find(f=>f.id===file.id).content,text);
});

test('The second center serves current copies with exact permissions even while the primary is offline',()=> {
  const sim=new Simulation(),file=upload(sim);
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'read',aclVersion:file.aclVersion});
  sim.net.toggleLink('cloud-uplink');
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
  cloud(sim,'permissions','cloud','laptop',{fileId:file.id,permission:'read',aclVersion:file.aclVersion});
  assert(sim.start('cloud',{device:'laptop',request:{op:'permissions',fileId:file.id,permission:'none',aclVersion:file.aclVersion}}));
  until(sim,()=>file.permissions.matej==='none');sim.net.toggleNode('cloud');finish(sim);
  cloud(sim,'download','cloud-backup','friend',{fileId:file.id});assert.equal(sim.status,'failed');assert.match(storage.clients.friend.message,/503/);
  sim.net.toggleNode('cloud');sim.advanceFrame();finish(sim);assert(storage.replicaCurrent());
  cloud(sim,'download','cloud-backup','friend',{fileId:file.id});assert.equal(sim.status,'failed');assert.match(storage.clients.friend.message,/403/);
  assert(!storage.local.friend.some(f=>f.cloudId===file.id));
});

test('Interrupted automatic synchronization preserves the complete copy and retries after recovery',()=> {
  const sim=new Simulation(),storage=sim.net.cloud,before=structuredClone(storage.replica.files);
  assert(sim.start('cloud',{device:'laptop',request:{op:'upload',name:'Přerušená kopie.txt',content:'Celý text '.repeat(100)}}));
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='cloud-replica'&&p.state==='delivered'));
  sim.net.toggleLink('replica-server');finish(sim);assert.equal(sim.status,'success');assert.equal(storage.clients.laptop.state,'ready');assert.deepEqual(storage.replica.files,before);
  assert(!storage.replicaCurrent());assert.equal(storage.replica.state,'pending');
  for(let i=0;i<5;i++)assert.equal(sim.advanceFrame(),null);
  sim.net.toggleLink('replica-server');sim.advanceFrame();assert.equal(sim.status,'running');finish(sim);
  assert.equal(sim.status,'success');assert(storage.replicaCurrent());assert.deepEqual(storage.replica.files,storage.files);
});

test('A lost acknowledgement and an offline client do not cancel automatic replication of a committed write',()=>{
  const sim=new Simulation(),storage=sim.net.cloud,initial=storage.files.size;
  assert(sim.start('cloud',{device:'laptop',request:{op:'upload',name:'Bez potvrzení.txt',content:'Data už převzal server.'}}));
  until(sim,()=>storage.files.size>initial);
  sim.net.setAccess('laptop','offline');sim.connectionChanged('laptop');sim.advanceFrame();finish(sim);
  assert.equal(sim.status,'failed');assert.equal(storage.clients.laptop.state,'error');
  assert(storage.replicaCurrent());assert.deepEqual(storage.replica.files,storage.files);
  assert([...sim.packets.values()].some(p=>p.kind==='cloud-replica'&&p.state==='delivered'));
});

test('A newer server change during automatic replication triggers another complete snapshot',()=>{
  const sim=new Simulation(),storage=sim.net.cloud;
  assert(sim.start('cloud',{device:'laptop',request:{op:'upload',name:'Souběžná změna.txt',content:'První verze '.repeat(50)}}));
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='cloud-replica'&&p.state==='delivered'));
  assert(sim.replicaResult,'The newer change is made while replication is still in progress');
  const file=[...storage.files.values()].at(-1);
  const result=storage.handle('laptop',{op:'upload',fileId:file.id,version:file.version,name:file.name,content:'Novější verze 🙂'});
  assert.equal(result.status,200);finish(sim);
  assert(storage.replicaCurrent());assert.equal(storage.replica.files.get(file.id).content,'Novější verze 🙂');
  assert.equal(storage.replica.files.get(file.id).version,2);
});

test('Reads, rejected writes and repeating a confirmed write do not cause redundant replication',()=>{
  const sim=new Simulation(),storage=sim.net.cloud,file=upload(sim),revision=storage.revision,count=storage.files.size;
  assert.equal(sim.lastAction.type,'cloud');assert(sim.repeat());finish(sim);
  assert.equal(storage.revision,revision);assert.equal(storage.files.size,count);
  assert(![...sim.packets.values()].some(p=>p.kind==='cloud-replica'));
  cloud(sim,'list');assert(![...sim.packets.values()].some(p=>p.kind==='cloud-replica'));
  cloud(sim,'download','cloud','friend',{fileId:file.id});assert.equal(sim.status,'failed');
  assert(![...sim.packets.values()].some(p=>p.kind==='cloud-replica'));assert(storage.replicaCurrent());
});

test('Repeating during automatic replication restarts the original request and never publishes a partial copy',()=>{
  const sim=new Simulation(),storage=sim.net.cloud,before=structuredClone(storage.replica.files);
  assert(sim.start('cloud',{device:'laptop',request:{op:'upload',name:'Opakování.txt',content:'Snímek, který se nesmí zveřejnit napůl. '.repeat(20)}}));
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='cloud-replica'&&p.state==='delivered'));
  assert.deepEqual(storage.replica.files,before);
  const revision=storage.revision,count=storage.files.size;
  sim.status='stopped';assert(sim.repeat());finish(sim);
  assert.equal(sim.status,'success');assert.equal(storage.revision,revision);assert.equal(storage.files.size,count);
  assert.equal(storage.clients.laptop.state,'ready');assert(storage.replicaCurrent());assert.deepEqual(storage.replica.files,storage.files);
});
