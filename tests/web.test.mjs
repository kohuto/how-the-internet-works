import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {Simulation,webAddress,requestText,responseText}=globalThis.InternetLab;
function finish(sim) {
  const events=[];for(let i=0;i<1000&&sim.status==='running';i++){sim.advance();events.push(structuredClone(sim.current));}
  assert.notEqual(sim.status,'running');return events;
}
function until(sim,predicate) {for(let i=0;i<1000&&sim.status==='running'&&!predicate();i++)sim.advance();assert(predicate());}
function run(sim,secure=true,extra={}) {assert(sim.start('web',{address:`${secure?'https':'http'}://knihovna.test`,...extra}));return finish(sim);}
const post={method:'POST',message:'Tajný vzkaz: Žluťoučký kůň 🙂'};

test('HTTP and HTTPS use the same page and server; TLS completes before any protected HTTP request',()=> {
  const sim=new Simulation();run(sim,false);const page=sim.net.browser.content;
  assert.equal(sim.net.browser.loadedSecure,false);
  const events=run(sim),origins=events.filter(e=>e.kind==='origin').map(e=>e.packet.kind);
  assert.deepEqual(origins,['tls-client-hello','tls-server-response','tls-finished','https-request','https-response']);
  assert.equal(sim.net.browser.content,page);assert.equal(sim.net.browser.loadedSecure,true);assert.equal(sim.net.browser.certificateVerified,true);
  const request=events.findIndex(e=>e.kind==='origin'&&e.packet.kind==='https-request');
  assert(request>events.findIndex(e=>e.kind==='deliver'&&e.packet.kind==='tls-finished'));
  const packets=[...sim.packets.values()];assert(packets.filter(p=>p.source==='laptop').every(p=>p.initialHeader.dport===443));
  assert(packets.filter(p=>p.source==='web').every(p=>p.initialHeader.sport===443));
});

test('A fresh HTTPS visit keeps ordinary DNS and SNI visible while request and response stay opaque',()=> {
  const sim=new Simulation();run(sim,true,post);assert.equal(sim.status,'success');
  const packets=[...sim.packets.values()];assert(packets.some(p=>p.kind==='dns-query'&&p.payload.name==='knihovna.test'));
  assert(packets.find(p=>p.kind==='tls-client-hello').payload.publicText.includes('knihovna.test'));
  const protectedPackets=packets.filter(p=>p.payload.record);
  assert.equal(protectedPackets.length,4);
  for(const p of protectedPackets){assert(!JSON.stringify(p).includes(post.message));assert(!JSON.stringify(p.payload).includes('/vzkaz'));}
  assert.equal(sim.net.server.lastRequest.message,post.message);assert.equal(sim.net.browser.receipt,post.message);
});

test('HTTP form data is readable in both directions but the server receives it only on actual delivery',()=> {
  const sim=new Simulation();sim.start('web',{address:'http://knihovna.test',...post});
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='http-request'));
  const p=[...sim.packets.values()].find(p=>p.kind==='http-request');
  assert.equal(sim.net.server.lastRequest,null);assert.equal(p.initialHeader.dport,80);assert(requestText(p.payload).includes(post.message));
  until(sim,()=>sim.net.server.lastRequest!==null);assert.equal(sim.net.browser.receipt,'');
  assert(responseText([...sim.packets.values()].find(p=>p.kind==='http-response').payload).includes(post.message));
  finish(sim);assert.equal(sim.net.browser.receipt,post.message);assert.equal(sim.net.browser.loadedSecure,false);
});

test('HTTPS decrypts on endpoints; the server sees the form before the client receives confirmation',()=> {
  const sim=new Simulation();sim.start('web',{address:'https://knihovna.test',...post});
  until(sim,()=>sim.current?.kind==='deliver'&&sim.current.packet.kind==='https-request');
  assert.equal(sim.net.server.lastRequest,null);assert.equal(sim.net.browser.receipt,'');
  assert.equal(sim.advance().kind,'web-decrypt-request');assert.equal(sim.net.server.lastRequest.message,post.message);assert.equal(sim.net.browser.tlsPhase,'processing');
  until(sim,()=>sim.current?.kind==='deliver'&&sim.current.packet.kind==='https-response');
  assert.equal(sim.net.browser.receipt,'');assert.equal(sim.net.browser.content,null);
  sim.advance();assert.equal(sim.status,'success');assert.equal(sim.net.browser.receipt,post.message);
});

test('Expired, untrusted or wrong-domain certificates prevent sending the form; HTTP still works',()=> {
  for(const change of [{valid:false},{trusted:false},{name:'jiny-web.test'}]) {
    const sim=new Simulation();Object.assign(sim.net.server.certificate,change);run(sim,true,post);
    assert.equal(sim.status,'failed');assert.equal(sim.net.server.lastRequest,null);assert.equal(sim.net.browser.certificateVerified,false);
    assert(![...sim.packets.values()].some(p=>p.kind==='https-request'));assert(sim.net.browser.error.includes('certifikát'));
    run(sim,false,post);assert.equal(sim.status,'success');assert.equal(sim.net.browser.receipt,post.message);
    Object.assign(sim.net.server.certificate,{valid:true,trusted:true,name:'knihovna.test'});run(sim,true,post);assert.equal(sim.status,'success');
  }
});

test('Modified protected request or response fails integrity checks without exposing a new result',()=> {
  for(const kind of ['https-request','https-response','tls-server-response']) {
    const sim=new Simulation();run(sim,false);const previous=sim.net.browser.content;sim.net.server.lastRequest=null;
    sim.start('web',{address:'https://knihovna.test',...post});
    until(sim,()=>[...sim.packets.values()].some(p=>p.kind===kind));
    const p=[...sim.packets.values()].find(p=>p.kind===kind);p.payload.record.data[3]^=1;
    finish(sim);assert.equal(sim.status,'failed');assert(sim.net.browser.error.includes('integrity'));
    assert.equal(sim.net.browser.receipt,'');assert.equal(sim.net.browser.content,previous);
    if(kind!=='https-response')assert.equal(sim.net.server.lastRequest,null);
    assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.browser.receipt,post.message);
  }
});

test('HTTPS handshake and response use observed NAT mappings and monotonically increasing SEQ',()=> {
  const sim=new Simulation();run(sim,true,post);assert.equal(sim.status,'success');
  const packets=[...sim.packets.values()].filter(p=>p.connection==='https'),out=packets.filter(p=>p.source==='laptop'),back=packets.filter(p=>p.source==='web');
  assert(out.every(p=>p.src==='192.0.2.1'));
  assert(back.every(p=>p.initialHeader.dst==='192.0.2.1'&&p.initialHeader.dport===out[0].sport&&p.dst==='192.168.10.10'&&p.dport===51000));
  for(const direction of [out,back])for(let i=1;i<direction.length;i++)assert(direction[i].seq>direction[i-1].seq);
  assert.equal(sim.net.nat.home.rows.filter(r=>r.remotePort===443).length,1);
});

test('A lost NAT binding on return prevents a response from being rendered and retry restores it',()=> {
  const sim=new Simulation();sim.start('web',{address:'https://knihovna.test',...post});
  until(sim,()=>[...sim.packets.values()].some(p=>p.kind==='https-response'));sim.net.clearNat('home');finish(sim);
  assert.equal(sim.status,'failed');assert.equal(sim.net.browser.content,null);assert.equal(sim.net.browser.receipt,'');
  assert.equal(sim.net.server.lastRequest.message,post.message);assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');
});

test('HTTPS works through laptop Wi-Fi and both phone accesses and fails with the selected path down',()=> {
  for(const [device,mode,link] of [['laptop','wifi','laptop-wifi'],['phone','wifi','phone-wifi'],['phone','cellular','phone-bts-lipova']]) {
    const sim=new Simulation();sim.net.setAccess(device,mode);const events=run(sim,true,{device,...post});
    assert.equal(sim.status,'success');assert.equal(sim.net.browserFor(device).receipt,post.message);
    assert(events.some(e=>e.kind==='hop'&&e.link===link));
    sim.net.toggleLink(link);run(sim,true,{device,...post});assert.equal(sim.status,'failed');
    assert.equal(sim.net.browserFor(device).receipt,post.message,'Previously delivered receipt is preserved with old content');
  }
});

test('Changing access during TLS stops the old session; repeating uses a new session and address',()=> {
  const sim=new Simulation();sim.start('web',{address:'https://knihovna.test',...post});until(sim,()=>sim.net.browser.certificateVerified);
  const session=sim.tls.id;sim.net.setAccess('laptop','wifi');sim.connectionChanged('laptop');assert.equal(sim.status,'failed');
  assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');assert.notEqual(sim.tls.id,session);
  assert.equal([...sim.packets.values()].find(p=>p.kind==='https-request').initialHeader.src,'192.168.10.11');
});

test('Encrypted response snapshots server content when decrypted request is processed, not at display time',()=> {
  const sim=new Simulation();sim.start('web',{address:'https://knihovna.test',...post});
  until(sim,()=>sim.current?.kind==='web-decrypt-request');const title=sim.net.server.title;
  sim.net.server.title='Pozdější změna';sim.net.server.revision++;finish(sim);
  assert.equal(sim.net.browser.content,title);assert.equal(sim.net.browser.revision,1);
  assert(sim.repeat());finish(sim);assert.equal(sim.net.browser.content,'Pozdější změna');assert.equal(sim.net.browser.receipt,post.message);
});

test('Web addresses are bounded to the model, both schemes share DNS, and UTF-8 form survives transport',()=> {
  for(const input of ['javascript:alert(1)','https://cizi.test','https://knihovna.test/cizi','knihovna.test.evil'])assert.equal(webAddress(input),null);
  assert.equal(webAddress(' HTTPS://KNIHOVNA.TEST/ ').secure,true);assert.equal(webAddress('knihovna.test/').secure,false);
  const sim=new Simulation(),message='漢'.repeat(160);run(sim,true,{method:'POST',message});assert.equal(sim.status,'success');assert.equal(sim.net.browser.receipt,message);
  const events=run(sim,false);assert(!events.some(e=>e.kind==='origin'&&e.packet.kind==='dns-query'));
});
