import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
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

test('Content size determines individual packet counts with the same 1400-byte data limit',()=> {
  assert.equal(MESSAGE_MSS,1400);
  assert.equal(messagePlan(makeMessage('text','a'.repeat(1000)).size).packets,1);
  assert.deepEqual(messagePlan(100000),{packets:72});
  assert.deepEqual(messagePlan(5000000),{packets:3572});
  assert.deepEqual(messagePlan(makeMessage('image').size),{packets:9});
  assert.deepEqual(messagePlan(makeMessage('video').size),{packets:35});
  assert.equal(messagePlan(makeMessage('text','🙂'.repeat(1000)).size).packets,3,'UTF-8 bytes, not character count');
});

test('Individual image packets overlap in flight and both legs account for every byte and packet',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));
  const expected=sim.net.sender.content.bytes.slice();
  let overlap=false,partial=false,independentState=false;
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advanceFrame();
    const packets=[...sim.packets.values()].filter(p=>p.kind==='message');
    if(new Set(packets.filter(p=>p.state==='transit').map(p=>p.location)).size>=3)overlap=true;
    if(packets.some(p=>p.state==='delivered')&&packets.some(p=>p.state==='transit'))independentState=true;
    if(sim.net.instagram.receivedBytes>0&&!sim.net.instagram.content)partial=true;
  }
  assert.equal(sim.status,'success');assert(overlap);assert(partial);assert(independentState);
  assert.equal(sim.net.sender.sentPackets,9);assert.equal(sim.net.instagram.receivedPackets,9);
  assert.equal(sim.net.instagram.sentPackets,9);assert.equal(sim.net.friend.receivedPackets,9);
  assert.equal(sim.net.sender.sentBytes,12000);assert.equal(sim.net.friend.receivedBytes,12000);
  assert.deepEqual(sim.net.instagram.content.bytes,expected);assert.deepEqual(sim.net.friend.content.bytes,expected);
  assert.equal(sim.net.friend.content.type,'image');
  for(const kind of ['message','ig-delivery']) {
    const packets=[...sim.packets.values()].filter(p=>p.kind===kind);
    assert.equal(packets.length,9);assert(packets.every(p=>p.payload.packetCount===1));
    assert.equal(new Set(packets.map(p=>p.id)).size,9);assert.equal(packets.at(-1).payload.bytes.length,800);
  }
});

test('Video packets have independent identities, scheduling, SEQ, bytes and MTU on both connections',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'video'}));sim.advanceFrame();
  const packets=[...sim.packets.values()];assert.equal(packets.length,35);
  let bytes=0,previousSeq=1001;
  assert.equal(new Set(packets.map(p=>p.payload.bytes)).size,35,'Each packet owns a separate byte buffer');
  for(const p of packets) {
    bytes+=p.payload.bytes.length;assert.equal(p.payload.packetCount,1);
    assert(p.payload.bytes.length<=1400);assert(p.payload.bytes.length+40<=1440);
    assert(!Object.hasOwn(p.payload,'offset'));assert.equal(p.seq,previousSeq);
    previousSeq=p.seq+p.payload.bytes.length;
    assert.deepEqual(p.payload.bytes,sim.net.sender.content.bytes.slice(p.seq-1001,p.seq-1001+p.payload.bytes.length));
  }
  assert.equal(bytes,48000);assert.equal(packets.at(-1).payload.bytes.length,400);
  const events=finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.friend.receivedPackets,35);
  const departures=events.filter(e=>e.kind==='origin'&&sim.packets.get(e.id)?.kind==='message');
  assert.equal(departures.length,35);
  for(let i=1;i<departures.length;i++)assert.equal(departures[i].at-departures[i-1].at,3);
  const delivered=[...sim.packets.values()].filter(p=>p.kind==='ig-delivery');
  assert.equal(delivered.length,35);assert(delivered.every(p=>p.payload.packetCount===1));
  assert.equal(delivered[0].seq,8001);assert.equal(delivered.at(-1).seq,8001+34*1400);
  assert(!delivered.some(p=>packets.some(q=>q.id===p.id)),'The second connection creates new packets');
  assert.deepEqual(sim.net.friend.content.bytes,sim.net.sender.content.bytes);
});

test('NAT counts each individually forwarded media packet and restores its own return header',()=> {
  const sim=new Simulation();run(sim,'message',{messageType:'video'});
  const sender=sim.net.nat.home.rows.find(r=>r.remotePort===443),recipient=sim.net.nat['friend-home'].rows.find(r=>r.remotePort===443);
  assert.equal(sender.outbound,35);assert.equal(recipient.inbound,35);assert.equal(recipient.outbound,1,'Outbound Instagram registration is a separate control packet');
  for(const p of [...sim.packets.values()].filter(p=>p.kind==='ig-delivery')){
    assert.equal(p.dst,'172.16.20.10');assert.equal(p.dport,52002);assert.equal(p.natHistory[0].direction,'in');
  }
});

test('An accepted attachment survives another experiment and a disconnected recipient',()=> {
  const sim=new Simulation();sim.net.toggleNode('friend');run(sim,'message',{messageType:'image',device:'phone'});
  assert.equal(sim.status,'waiting');const stored=sim.net.instagram.content.bytes.slice();
  run(sim,'web');assert.deepEqual(sim.net.instagram.content.bytes,stored);
  sim.net.toggleNode('friend');sim.net.toggleNode('phone');assert(sim.resumePending());finish(sim);
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.content.type,'image');assert.deepEqual(sim.net.friend.content.bytes,stored);
});

test('An interrupted individual delivery exposes no partial attachment and retries only the stored leg',()=> {
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));
  until(sim,()=>sim.net.friend.receivedBytes>0);
  assert.equal(sim.net.friend.content,null);assert(sim.net.friend.receivedPackets<9);
  const stored=sim.net.instagram.content.bytes.slice();sim.net.toggleLink('friend-laptop-switch');finish(sim);
  assert.equal(sim.status,'waiting');assert.equal(sim.net.friend.receivedPackets,0);assert.equal(sim.net.friend.content,null);
  sim.net.toggleLink('friend-laptop-switch');assert(sim.resumePending());const events=finish(sim);
  assert(!events.some(e=>e.kind==='origin'&&sim.packets.get(e.id)?.kind==='message'));
  assert.deepEqual(sim.net.friend.content.bytes,stored);assert.equal(sim.net.friend.receivedPackets,9);
});

test('Video read receipts and repeat preserve attachment type while a new text replaces it',()=> {
  const sim=new Simulation();run(sim,'message',{messageType:'video'});assert(sim.markRead());finish(sim);
  assert.equal(sim.net.sender.state,'read');assert.equal(sim.net.friend.content.type,'video');
  assert(sim.repeat());finish(sim);assert.equal(sim.net.friend.content.type,'video');assert.equal(sim.net.friend.receivedBytes,48000);
  run(sim,'message',{text:'Hotovo 🙂',messageType:'text'});
  assert.equal(sim.net.friend.content.type,'text');assert.equal(sim.net.friend.text,'Hotovo 🙂');assert.equal(sim.net.friend.receivedPackets,1);
});
