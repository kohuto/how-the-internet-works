import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,CLOUD_MSS}=globalThis.InternetLab;
const decoder=new TextDecoder();
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<3000;i++){sim.advanceFrame();events.push(...sim.frame);}
  assert.notEqual(sim.status,'running');return events;
}
function until(sim,predicate) {
  for(let i=0;!predicate()&&sim.status==='running'&&i<3000;i++)sim.advanceFrame();
  assert(predicate(),'Expected intermediate state was not reached');
}
function run(sim,device,request,localId) {
  assert(sim.start('cloud',{device,request,localId}));finish(sim);return sim.net.cloud.clients[device];
}
function upload(sim,device='laptop',text='Přesný obsah: háčky, čárky a emoji 🙂 '.repeat(12)) {
  const file=sim.net.cloud.local[device][0];
  run(sim,device,{op:'upload',name:file.name,content:text},file.id);
  assert.equal(sim.status,'success');return sim.net.cloud.files.get(file.cloudId);
}
function share(sim,file,permission) {
  return run(sim,file.owner==='ty'?'laptop':'friend',{op:'permissions',fileId:file.id,permission,aclVersion:file.aclVersion});
}

test('Cloud upload commits only after all request bytes arrive; the client waits for the complete reply',()=> {
  const sim=new Simulation(),cloud=sim.net.cloud,local=cloud.local.laptop[0],text='Kůň 🙂 — data '.repeat(30),initial=cloud.files.size;
  assert(sim.start('cloud',{device:'laptop',request:{op:'upload',name:'Soubor.txt',content:text},localId:local.id}));
  until(sim,()=>cloud.clients.laptop.sentBytes>0);
  assert.equal(cloud.files.size,initial);assert.equal(local.cloudId,null);
  until(sim,()=>cloud.files.size>initial);
  const saved=[...cloud.files.values()].at(-1);
  assert.equal(saved.content,text);assert.equal(saved.owner,'ty');assert.equal(cloud.access(saved,'friend'),'none');
  assert.equal(local.cloudId,null,'Server commit is not yet a received acknowledgement');
  assert.equal(cloud.clients.laptop.catalog.length,0);
  finish(sim);assert.equal(local.cloudId,saved.id);assert.equal(local.cloudVersion,1);
  assert.equal(cloud.clients.laptop.state,'ready');
  const packets=[...sim.packets.values()],requests=packets.filter(p=>p.kind==='cloud-request'),replies=packets.filter(p=>p.kind==='cloud-response');
  assert(requests.length>2&&replies.length>0);
  const request=JSON.parse(decoder.decode(Uint8Array.from(requests.flatMap(p=>[...p.payload.bytes]))));
  assert.equal(request.content,text);
  for(const p of packets){assert(p.payload.bytes.length<=CLOUD_MSS);assert.equal(p.connection,'cloud');assert.equal(p.protocol,'TCP');assert(p.payload.bytes.length+40<1500);}
  assert.equal(requests[0].dst,'203.0.113.140');assert.equal(requests[0].dport,443);
  assert.equal(replies[0].src,'203.0.113.140');assert.equal(replies[0].sport,443);
});

test('A private file is omitted from another user’s list and a known ID cannot bypass server authorization',()=> {
  const sim=new Simulation(),file=upload(sim),count=sim.net.cloud.local.friend.length;
  run(sim,'friend',{op:'list'});
  assert(!sim.net.cloud.clients.friend.catalog.some(f=>f.id===file.id));
  const client=run(sim,'friend',{op:'download',fileId:file.id,user:'ty'});
  assert.equal(sim.status,'failed');assert.equal(sim.current.kind,'rejected');assert.match(client.message,/403/);
  assert.equal(sim.net.cloud.local.friend.length,count);
  assert([...sim.packets.values()].every(p=>p.state==='delivered'),'403 is a delivered server reply, not a lost packet');
  const response=JSON.parse(decoder.decode(Uint8Array.from([...sim.packets.values()].filter(p=>p.kind==='cloud-response').flatMap(p=>[...p.payload.bytes]))));
  assert.equal(response.file,undefined);assert(!JSON.stringify(response).includes(file.content));
});

test('Read access downloads exact UTF-8 bytes over the second household and cannot update content or permissions',()=> {
  const sim=new Simulation(),file=upload(sim);share(sim,file,'read');
  const count=sim.net.cloud.local.friend.length;
  assert(sim.start('cloud',{device:'friend',request:{op:'download',fileId:file.id}}));
  until(sim,()=>sim.net.cloud.clients.friend.receivedBytes>0);
  assert.equal(sim.net.cloud.local.friend.length,count,'A partial response must not create a local file');
  const events=finish(sim),copy=sim.net.cloud.local.friend.at(-1);
  assert.equal(copy.content,file.content);assert.equal(copy.cloudId,file.id);assert.equal(copy.cloudVersion,1);
  assert(events.some(e=>e.kind==='hop'&&e.link==='friend-uplink'));
  assert(events.some(e=>e.kind==='hop'&&e.link==='north-peer'));
  const content=file.content;
  run(sim,'friend',{op:'upload',fileId:file.id,version:1,name:'Změna.txt',content:'Pokus o přepis'},copy.id);
  assert.match(sim.net.cloud.clients.friend.message,/403/);assert.equal(file.content,content);
  run(sim,'friend',{op:'permissions',fileId:file.id,permission:'write',aclVersion:file.aclVersion});
  assert.match(sim.net.cloud.clients.friend.message,/403/);assert.equal(file.permissions.matej,'read');
});

test('Write access updates the same cloud file, keeps ownership and rejects an outdated local version',()=> {
  const sim=new Simulation(),file=upload(sim);share(sim,file,'write');
  run(sim,'friend',{op:'download',fileId:file.id});const copy=sim.net.cloud.local.friend.at(-1);
  run(sim,'friend',{op:'upload',fileId:file.id,version:copy.cloudVersion,name:'Společný soubor.txt',content:'Matějova úprava 🙂'},copy.id);
  assert.equal(sim.status,'success');assert.equal(file.owner,'ty');assert.equal(file.version,2);assert.equal(copy.cloudVersion,2);
  assert.equal(file.content,'Matějova úprava 🙂');
  const ownerCopy=sim.net.cloud.local.laptop[0];
  run(sim,'laptop',{op:'upload',fileId:file.id,version:ownerCopy.cloudVersion,name:'Stará verze.txt',content:'Starý obsah'},ownerCopy.id);
  assert.match(sim.net.cloud.clients.laptop.message,/409/);assert.equal(file.version,2);assert.equal(file.content,'Matějova úprava 🙂');
  run(sim,'friend',{op:'permissions',fileId:file.id,permission:'none',aclVersion:file.aclVersion});
  assert.match(sim.net.cloud.clients.friend.message,/403/);
});

test('Revoking access blocks new downloads from a stale catalog while an existing local copy remains',()=> {
  const sim=new Simulation(),file=upload(sim);share(sim,file,'read');run(sim,'friend',{op:'download',fileId:file.id});
  const copy=sim.net.cloud.local.friend.at(-1),count=sim.net.cloud.local.friend.length;
  share(sim,file,'none');
  assert(sim.net.cloud.clients.friend.catalog.some(f=>f.id===file.id),'The old received list is a snapshot');
  run(sim,'friend',{op:'download',fileId:file.id});
  assert.match(sim.net.cloud.clients.friend.message,/403/);assert.equal(sim.net.cloud.local.friend.length,count);assert.equal(copy.content,file.content);
  assert(!sim.net.cloud.clients.friend.catalog.some(f=>f.id===file.id));
});

test('Permission changes are applied by the server after the complete request and confirmed over the network',()=> {
  const sim=new Simulation(),file=upload(sim),before=file.aclVersion;
  assert(sim.start('cloud',{device:'laptop',request:{op:'permissions',fileId:file.id,permission:'write',aclVersion:before}}));
  sim.advanceFrame();assert.equal(file.permissions.matej,undefined);
  until(sim,()=>file.aclVersion>before);
  assert.equal(file.permissions.matej,'write');assert.equal(sim.net.cloud.clients.laptop.catalog.find(f=>f.id===file.id).sharing,'none');
  finish(sim);assert.equal(sim.net.cloud.clients.laptop.catalog.find(f=>f.id===file.id).sharing,'write');
  run(sim,'laptop',{op:'permissions',fileId:file.id,permission:'none',aclVersion:before});
  assert.match(sim.net.cloud.clients.laptop.message,/409/);assert.equal(file.permissions.matej,'write');
});

test('A broken upload leaves existing files untouched; retry after a lost reply does not duplicate the committed mutation',()=> {
  const sim=new Simulation(),file=upload(sim),local=sim.net.cloud.local.laptop[0],content=file.content;
  assert(sim.start('cloud',{device:'laptop',localId:local.id,request:{op:'upload',fileId:file.id,version:file.version,name:file.name,content:'Nový text '.repeat(100)}}));
  until(sim,()=>sim.net.cloud.clients.laptop.sentBytes>0);
  sim.net.toggleLink('cloud-switch');finish(sim);
  assert.equal(sim.status,'failed');assert.equal(file.content,content);assert.equal(file.version,1);
  sim.net.toggleLink('cloud-switch');assert(sim.repeat());
  until(sim,()=>file.version===2);
  sim.net.toggleLink('cloud-switch');finish(sim);assert.equal(sim.status,'failed');assert.equal(local.cloudVersion,1);
  sim.net.toggleLink('cloud-switch');assert(sim.repeat());finish(sim);
  assert.equal(sim.status,'success');assert.equal(file.version,2);assert.equal(local.cloudVersion,2);
  assert.equal(file.content,'Nový text '.repeat(100));
});

test('Local files are independent of connectivity; server and access outages preserve downloaded copies',()=> {
  const sim=new Simulation(),cloud=sim.net.cloud;
  sim.net.setAccess('friend','offline');
  assert(cloud.saveLocal('friend',{name:'Offline.txt',content:'Bez internetu'}));
  run(sim,'friend',{op:'list'});assert.equal(sim.status,'failed');assert.equal(cloud.clients.friend.listed,false);
  sim.net.setAccess('friend','wifi');run(sim,'friend',{op:'download',fileId:'cloud-1'});assert.equal(sim.status,'success');
  const saved=cloud.local.friend.at(-1);sim.net.toggleNode('cloud');
  run(sim,'friend',{op:'download',fileId:'cloud-1'});assert.equal(sim.status,'failed');assert.equal(saved.content,cloud.files.get('cloud-1').content);
  sim.net.toggleNode('cloud');
  assert(sim.start('cloud',{device:'friend',request:{op:'list'}}));sim.advanceFrame();sim.net.setAccess('friend','cable');sim.connectionChanged('friend');
  assert.equal(sim.status,'failed');assert.equal(cloud.clients.friend.state,'error');
});

test('Both users can own files; downloading a shared file does not change its original until a new version arrives',()=> {
  const sim=new Simulation(),file=upload(sim,'friend','Matějův vlastní soubor');
  assert.equal(file.owner,'matej');share(sim,file,'read');
  run(sim,'laptop',{op:'download',fileId:file.id});const copy=sim.net.cloud.local.laptop.at(-1);
  sim.net.cloud.saveLocal('laptop',{id:copy.id,name:'Moje místní změna.txt',content:'Změna jen u mě'});
  assert.equal(file.content,'Matějův vlastní soubor');
  run(sim,'laptop',{op:'upload',name:copy.name,content:copy.content},copy.id);
  assert.equal(sim.status,'success');assert.notEqual(copy.cloudId,file.id);assert.equal(sim.net.cloud.files.get(copy.cloudId).owner,'ty');
  assert.equal(file.content,'Matějův vlastní soubor');
});
