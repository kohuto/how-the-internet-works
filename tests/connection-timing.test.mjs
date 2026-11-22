import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';
import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,Network,LabSettings}=globalThis.InternetLab;
const profile=(bandwidth='low',latency='low')=>({bandwidth,latency});
function finish(s) {
  const events=[];let frames=0;
  while(s.status==='running'&&frames++<6000) {
    s.advanceFrame();
    for(const e of s.frame)events.push({kind:e.kind,at:e.at,link:e.link,from:e.from,node:e.node,copy:e.copy,packetKind:e.packet&&s.vpn.logical(e.packet).kind,id:e.packet?.id});
  }
  assert.equal(s.status,'success',s.current?.description);return {events,frames,time:s.time};
}
function send(s,type='video') {assert(s.start('message',{messageType:type}));return finish(s);}
const upload=r=>r.events.filter(e=>e.kind==='hop'&&e.link==='uplink'&&e.from==='home'&&e.packetKind==='message');
const arrivals=r=>r.events.filter(e=>e.kind==='deliver'&&e.node==='instagram'&&e.packetKind==='message');
const gaps=events=>events.slice(1).map((e,i)=>e.at-events[i].at);
test('Bandwidth and latency require one optional extension, without adding devices or changing default timing',()=>{
  const base=new LabSettings({features:['instagram']}),enabled=base.toggle('connection-timing',true);
  const normal=new Simulation(new Network(base)),configured=new Simulation(new Network(enabled));
  assert.deepEqual(configured.net.visibleNodes(),normal.net.visibleNodes());
  assert.deepEqual(configured.net.visibleLinks(),normal.net.visibleLinks());
  assert(!base.sameNetwork(enabled),'Applying the extension rebuilds the session and clears profiles');
  assert(!normal.net.setConnectionProfile('laptop',profile('high','high')));
  assert.deepEqual(normal.net.connectionProfiles.laptop,profile());
  assert.deepEqual(configured.net.connectionProfiles.laptop,profile());
  assert(configured.net.setConnectionProfile('laptop',profile('high','high')));
  const a=send(normal,'image'),b=send(configured,'image');
  assert(gaps(upload(a)).every(g=>g===3));assert(!a.events.some(e=>e.kind==='connection-wait'));
  assert(gaps(upload(b)).every(g=>g===1));assert(b.events.some(e=>e.kind==='connection-wait'));
  assert.deepEqual(configured.net.friend.content.bytes,normal.net.friend.content.bytes);
  const disabled=new Network(enabled.toggle('connection-timing',false));
  assert.deepEqual(disabled.connectionProfiles.laptop,profile());
  assert(!disabled.setConnectionProfile('laptop',profile('high','high')));
  assert(new Network(LabSettings.full()).setConnectionProfile('laptop',profile('high','high')));
});
function content(s,count) {
  assert.equal(s.net.friend.receivedPackets,count);assert.equal(s.net.instagram.receivedPackets,count);
  assert.deepEqual(s.net.friend.content.bytes,s.net.sender.content.bytes);
  for(const kind of ['message','ig-delivery']) {
    const packets=[...s.packets.values()].filter(p=>p.kind===kind);assert.equal(packets.length,count);
    const first=kind==='message'?1001:8001;
    packets.forEach((p,i)=>{assert.equal(p.seq,first+i*1400);assert.equal(p.payload.packetCount,1);});
  }
}

test('Bandwidth changes packet spacing and completion time, preserving the photo/video and independent second connection',()=>{
  for(const [type,count] of [['image',9],['video',35]]) {
    const slow=new Simulation(),fast=new Simulation();fast.net.setConnectionProfile('laptop',profile('high'));
    const a=send(slow,type),b=send(fast,type);content(slow,count);content(fast,count);
    assert(gaps(upload(a)).every(g=>g===3));assert(gaps(upload(b)).every(g=>g===1));
    assert(b.time<a.time);assert(b.frames<a.frames);
    const duration=r=>{const e=r.events.filter(e=>e.kind==='origin'&&e.packetKind==='ig-delivery');return e.at(-1).at-e[0].at;};
    assert.equal(duration(a),duration(b),'Sender settings do not change the recipient connection');
  }
});

test('Higher latency shifts every arrival equally without throttling the pipeline or changing bandwidth spacing',()=>{
  const normal=new Simulation(),delayed=new Simulation();normal.net.setConnectionProfile('laptop',profile('high'));
  delayed.net.setConnectionProfile('laptop',profile('high','high'));
  const a=send(normal,'image'),b=send(delayed,'image');content(delayed,9);
  assert.deepEqual(gaps(upload(a)),gaps(upload(b)));assert.deepEqual(gaps(arrivals(a)),gaps(arrivals(b)));
  assert(arrivals(b).every((e,i)=>e.at-arrivals(a)[i].at===6));
  assert(b.events.filter(e=>e.kind==='origin'&&e.packetKind==='message'&&e.at<arrivals(b)[0].at).length>1);
  assert(b.events.some(e=>e.kind==='connection-wait'));assert(b.frames>a.frames);
});

test('Recipient settings affect only the Instagram-to-recipient leg, including its own outbound registration',()=>{
  const normal=new Simulation(),changed=new Simulation();changed.net.setConnectionProfile('friend',profile('high','high'));
  const a=send(normal,'image'),b=send(changed,'image');content(changed,9);
  assert.deepEqual(upload(a).map(e=>e.at),upload(b).map(e=>e.at));
  const received=r=>r.events.filter(e=>e.kind==='hop'&&e.link==='friend-uplink'&&e.packetKind==='ig-delivery');
  assert(gaps(received(b)).every(g=>g===1));assert(gaps(received(a)).every(g=>g===3));
  assert(b.events.some(e=>e.kind==='connection-wait'&&e.packetKind==='ig-connect'));
});

test('Applying profiles during a run preserves that run; repeating uses the new values and identical attachment',()=>{
  const s=new Simulation();assert(s.start('message',{messageType:'image'}));s.advanceFrame();
  s.net.setConnectionProfile('laptop',profile('high','high'));const a=finish(s),bytes=s.net.friend.content.bytes.slice();
  assert(gaps(upload(a)).every(g=>g===3));assert(!a.events.some(e=>e.kind==='connection-wait'));
  assert(s.repeat());const b=finish(s);assert(gaps(upload(b)).every(g=>g===1));assert(b.events.some(e=>e.kind==='connection-wait'));
  assert.deepEqual(s.net.friend.content.bytes,bytes);assert.equal(s.net.friend.content.type,'image');
});

test('Profiles are per device, validated, independent of access mode, and reset with a new model',()=>{
  const s=new Simulation(),n=s.net;assert(n.setConnectionProfile('phone',profile('high','high')));
  assert(n.setAccess('phone','wifi'));assert.deepEqual(n.connectionProfiles.phone,profile('high','high'));
  assert.deepEqual(n.connectionProfiles.laptop,profile());assert(!n.setConnectionProfile('web',profile('high')));
  assert(!n.setConnectionProfile('phone',{bandwidth:'invalid',latency:'high'}));assert(!n.setConnectionProfile('phone',null));
  assert.deepEqual(n.connectionProfiles.phone,profile('high','high'));assert.deepEqual(new globalThis.InternetLab.Network().connectionProfiles.phone,profile());
});

test('Configured delay works over cellular, satellite and VPN, while local printing never enters the internet queue',()=>{
  for(const [device,vpn,tower] of [['phone',false,'bts-lipova'],['phone',true,'bts-park'],['cabin',true]]) {
    const s=new Simulation();if(tower)s.net.setAccess(device,'cellular',tower);s.net.setConnectionProfile(device,profile('high','high'));if(vpn)s.net.setVPN(device,true);
    assert(s.start('message',{device,messageType:'image'}));const r=finish(s);content(s,9);
    const boundary=device==='phone'?`${tower}-uplink`:'cabin-wan';
    assert(r.events.some(e=>e.kind==='connection-wait'&&e.link===boundary));
    assert(r.events.some(e=>e.kind==='hop'&&e.link===boundary));
  }
  const s=new Simulation();s.net.setConnectionProfile('laptop',profile('high','high'));assert(s.start('print',{document:'Test'}));
  const r=finish(s);assert(!r.events.some(e=>e.kind==='connection-wait'));assert.equal(s.net.printer.document,'Test');
});
