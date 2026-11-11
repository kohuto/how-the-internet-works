import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,makeMessage,messagePlan,MESSAGE_MSS}=globalThis.InternetLab;
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advanceFrame();
    events.push(...sim.frame.map(e=>({kind:e.kind,at:e.at,id:e.packet?.id,link:e.link,from:e.from,count:e.packet?.payload.packetCount||1})));
  }
  assert.notEqual(sim.status,'running');return events;
}
function run(sim,type,payload={}) {assert(sim.start(type,payload));return finish(sim);}
function until(sim,predicate) {
  for(let i=0;!predicate()&&sim.status==='running'&&i<4000;i++)sim.advanceFrame();
  assert(predicate());
}

test('Content size determines packet counts with the same 1400-byte data limit',()=> {
  assert.equal(MESSAGE_MSS,1400);
  assert.equal(messagePlan(makeMessage('text','a'.repeat(1000)).size).packets,1);
  assert.deepEqual(messagePlan(100000),{packets:72,groupSize:10,groups:8});
  assert.deepEqual(messagePlan(5000000),{packets:3572,groupSize:100,groups:36});
  assert.equal(messagePlan(makeMessage('text','🙂'.repeat(1000)).size).packets,3,'UTF-8 bytes, not character count');
});

test('Image groups overlap in flight and counters account for every data packet on both legs',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));
  const expected=sim.net.sender.content.bytes.slice();
  let overlap=false,partial=false;
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advanceFrame();
    if(new Set([...sim.packets.values()].filter(p=>p.state==='transit').map(p=>p.location)).size>=3)overlap=true;
    if(sim.net.instagram.receivedBytes>0&&!sim.net.instagram.content)partial=true;
  }
  assert.equal(sim.status,'success');assert(overlap);assert(partial);
  assert.equal(sim.net.sender.sentPackets,72);assert.equal(sim.net.instagram.receivedPackets,72);
  assert.equal(sim.net.instagram.sentPackets,72);assert.equal(sim.net.friend.receivedPackets,72);
  assert.equal(sim.net.sender.sentBytes,100000);assert.equal(sim.net.friend.receivedBytes,100000);
  assert.deepEqual(sim.net.instagram.content.bytes,expected);assert.deepEqual(sim.net.friend.content.bytes,expected);
  assert.equal(sim.net.friend.content.type,'image');
  for(const kind of ['message','ig-delivery']) {
    const groups=[...sim.packets.values()].filter(p=>p.kind===kind);
    assert.equal(groups.length,8);assert.equal(groups.at(-1).payload.packetCount,2);
  }
});

test('A video is bounded to 36 groups per leg; expanded members keep correct SEQ, bytes and MTU',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'video'}));sim.advanceFrame();
  const groups=[...sim.packets.values()];assert.equal(groups.length,36);
  let total=0,bytes=0,previousSeq=null;
  for(const group of groups)for(let i=0;i<group.payload.packetCount;i++) {
    const p=sim.packetMember(group,i);assert(p);total++;bytes+=p.payload.bytes.length;
    assert(p.payload.bytes.length<=1400);assert(p.payload.bytes.length+40<=1440);
    assert.equal(p.seq,1001+p.payload.offset);
    if(previousSeq!==null)assert.equal(p.seq,previousSeq);
    previousSeq=p.seq+p.payload.bytes.length;
    assert.deepEqual(p.payload.bytes,sim.net.sender.content.bytes.slice(p.payload.offset,p.payload.end));
  }
  assert.equal(total,3572);assert.equal(bytes,5000000);
  const last=sim.packetMember(groups.at(-1),71);assert.equal(last.payload.bytes.length,600);
  assert.equal(sim.packetMember(groups[0],100),null);
  finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.friend.receivedPackets,3572);
  assert.deepEqual(sim.net.friend.content.bytes,sim.net.sender.content.bytes);
});

test('NAT counts grouped data packets rather than just the number of map markers',()=> {
  const sim=new Simulation();run(sim,'message',{messageType:'video'});
  const sender=sim.net.nat.home.rows.find(r=>r.remotePort===443),recipient=sim.net.nat['friend-home'].rows.find(r=>r.remotePort===443);
  assert.equal(sender.outbound,3572);assert.equal(recipient.inbound,3572);assert.equal(recipient.outbound,1,'Outbound Instagram registration is a separate control packet');
  const packet=[...sim.packets.values()].find(p=>p.kind==='ig-delivery');
  const member=sim.packetMember(packet,42);assert.equal(member.dst,'172.16.20.10');assert.equal(member.dport,52002);assert.equal(member.natHistory[0].direction,'in');
});

test('An accepted attachment survives another experiment and a disconnected recipient',()=> {
  const sim=new Simulation();sim.net.toggleNode('friend');run(sim,'message',{messageType:'image',device:'phone'});
  assert.equal(sim.status,'waiting');const stored=sim.net.instagram.content.bytes.slice();
  run(sim,'web');assert.deepEqual(sim.net.instagram.content.bytes,stored);
  sim.net.toggleNode('friend');sim.net.toggleNode('phone');assert(sim.resumePending());finish(sim);
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.content.type,'image');assert.deepEqual(sim.net.friend.content.bytes,stored);
});

test('An interrupted grouped delivery exposes no partial attachment and retries only the stored leg',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));
  until(sim,()=>sim.net.friend.receivedBytes>0);
  assert.equal(sim.net.friend.content,null);assert(sim.net.friend.receivedPackets<72);
  const stored=sim.net.instagram.content.bytes.slice();sim.net.toggleLink('friend-laptop-switch');finish(sim);
  assert.equal(sim.status,'waiting');assert.equal(sim.net.friend.receivedPackets,0);assert.equal(sim.net.friend.content,null);
  sim.net.toggleLink('friend-laptop-switch');assert(sim.resumePending());const events=finish(sim);
  assert(!events.some(e=>e.kind==='origin'&&sim.packets.get(e.id)?.kind==='message'));
  assert.deepEqual(sim.net.friend.content.bytes,stored);assert.equal(sim.net.friend.receivedPackets,72);
});

test('Video read receipts and repeat preserve attachment type while a new text replaces it',()=> {
  const sim=new Simulation();run(sim,'message',{messageType:'video'});assert(sim.markRead());finish(sim);
  assert.equal(sim.net.sender.state,'read');assert.equal(sim.net.friend.content.type,'video');
  assert(sim.repeat());finish(sim);assert.equal(sim.net.friend.content.type,'video');assert.equal(sim.net.friend.receivedBytes,5000000);
  run(sim,'message',{text:'Hotovo 🙂',messageType:'text'});
  assert.equal(sim.net.friend.content.type,'text');assert.equal(sim.net.friend.text,'Hotovo 🙂');assert.equal(sim.net.friend.receivedPackets,1);
});
