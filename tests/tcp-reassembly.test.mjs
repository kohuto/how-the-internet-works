import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/privacy.js';
import '../js/auth.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';
import '../js/mail.js';
import '../js/ads.js';
import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,TCPReceiveStream}=globalThis.InternetLab;
const bytes=Uint8Array.from({length:12},(_,i)=>i+1);
function finish(sim) {
  for(let i=0;sim.status==='running'&&i<4000;i++)sim.advance();
  assert.equal(sim.status,'success',sim.current?.description);
}

test('TCP SEQ restores reversed segments, waits for gaps and does not count duplicates twice',()=>{
  const stream=new TCPReceiveStream(1001,bytes.length);
  stream.receive(1009,bytes.slice(8));
  assert.equal(stream.received,4);assert.equal(stream.contiguous,0);assert(!stream.complete);
  stream.receive(1009,bytes.slice(8));assert.equal(stream.received,4);
  stream.receive(1001,bytes.slice(0,4));assert.equal(stream.contiguous,4);assert(!stream.complete);
  stream.receive(1005,bytes.slice(4,8));
  assert(stream.complete);assert.equal(stream.received,12);assert.deepEqual(stream.bytes,bytes);
});

test('SEQ reassembly handles overlapping segments and the 32-bit sequence-number wrap',()=>{
  const stream=new TCPReceiveStream(0xfffffff9,bytes.length);
  stream.receive(1,bytes.slice(8));assert.equal(stream.contiguous,0);
  stream.receive(0xfffffff9,bytes.slice(0,9));
  assert(stream.complete);assert.equal(stream.received,12);assert.deepEqual(stream.bytes,bytes);
  assert.throws(()=>stream.receive(0xfffffff8,bytes.slice(0,1)),/SEQ/);
  assert.throws(()=>stream.receive(0xfffffff9,new Uint8Array([255])),/neshodují/);
  assert.deepEqual(stream.bytes,bytes,'Rejected data must not corrupt the stream');
});

test('An image is reassembled exactly on both connections when its first segment arrives last',()=>{
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));sim.advance();
  const original=sim.net.sender.content.bytes.slice();
  const delayFirst=kind=>{
    const event=sim.queue.find(e=>e.kind==='origin'&&e.packet.kind===kind&&e.packet.payload.index===0);
    assert(event);event.at+=200;sim.queue.sort((a,b)=>a.at-b.at||a.order-b.order);
  };
  for(const p of sim.packets.values())assert(!Object.hasOwn(p.payload,'offset'));
  delayFirst('message');
  let uploadGap=false,deliveryGap=false,delayedDelivery=false;
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    sim.advance();
    uploadGap ||= sim.net.instagram.receivedBytes>0&&sim.net.instagram.streamBytes===0;
    if(!delayedDelivery&&sim.queue.some(e=>e.kind==='origin'&&e.packet.kind==='ig-delivery')){delayFirst('ig-delivery');delayedDelivery=true;}
    deliveryGap ||= sim.net.friend.receivedBytes>0&&sim.net.friend.streamBytes===0;
  }
  assert.equal(sim.status,'success');assert(uploadGap);assert(deliveryGap);
  assert.deepEqual(sim.net.instagram.content.bytes,original);assert.deepEqual(sim.net.friend.content.bytes,original);
  assert.equal(sim.net.instagram.receivedPackets,9);assert.equal(sim.net.friend.receivedPackets,9);
  for(const kind of ['message','ig-delivery'])assert.deepEqual([...sim.packets.values()].filter(p=>p.kind===kind).map(p=>p.packetOrder),[1,2,3,4,5,6,7,8,9]);
});

test('Actual SEQ rather than lesson indices or a forged offset determines where image bytes go',()=>{
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));sim.advance();
  const packets=[...sim.packets.values()],expected=sim.net.sender.content.bytes.slice();
  const first=expected.slice(0,1400),second=expected.slice(1400,2800);
  expected.set(second,0);expected.set(first,1400);
  [packets[0].seq,packets[1].seq]=[packets[1].seq,packets[0].seq];
  for(const p of packets)p.payload.offset=999999;
  finish(sim);
  assert.deepEqual(sim.net.instagram.content.bytes,expected);assert.deepEqual(sim.net.friend.content.bytes,expected);
});

test('A missing SEQ range cannot be completed by receiving another segment twice',()=>{
  const sim=new Simulation();assert(sim.start('message',{messageType:'image'}));sim.advance();
  const packets=[...sim.packets.values()];
  packets[1].seq=packets[0].seq;packets[1].payload.bytes=packets[0].payload.bytes.slice();
  for(let i=0;sim.status==='running'&&i<4000;i++)sim.advance();
  assert.equal(sim.status,'failed');assert.equal(sim.net.instagram.content,null);
  assert.equal(sim.net.instagram.receivedBytes,10600);
});

test('Mail also waits for the actual encrypted TCP SEQ range before processing a command',()=>{
  const sim=new Simulation();assert(sim.start('mail-check',{device:'laptop'}));
  let changed=false;
  for(let i=0;sim.status==='running'&&i<4000;i++) {
    if(!changed) {
      const p=[...sim.packets.values()].find(p=>p.connection==='imap');
      if(p){assert(!Object.hasOwn(p.mailMeta,'offset'));p.seq+=1;changed=true;}
    }
    sim.advance();
  }
  assert(changed);assert.equal(sim.status,'failed');assert.match(sim.current.description,/SEQ/);
});
