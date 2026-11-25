import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';
import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';
import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,Network,LabSettings}=globalThis.InternetLab;
const model=()=>new Simulation(new Network(new LabSettings({features:['instagram','mail','cloud','chatbot','printer','hacker','tls','cookies']})));
function until(s,condition){for(let i=0;!condition()&&s.status==='running'&&i<12000;i++)s.advanceFrame();assert(condition(),s.current?.description);}
function finish(s){until(s,()=>s.status!=='running');assert.equal(s.status,'success',s.current?.description);}
function stopped(s){
  assert.equal(s.status,'cancelled');assert.deepEqual(s.queue,[]);assert.deepEqual(s.frame,[]);assert.equal(s.tcpStream,null);
  assert(![...s.packets.values()].some(p=>['waiting','transit'].includes(p.state)));
  const time=s.time;for(let i=0;i<3;i++){assert.equal(s.advanceFrame(),null);assert.equal(s.resumePending(),false);assert.equal(s.resumeReplication(),false);}
  assert.equal(s.time,time);assert.equal(s.status,'cancelled');
}
test('Cancellation stops every application transfer and immediately permits a different action',()=>{
  for(const [type,payload] of [
    ['web',{}],['print',{}],['chatbot',{prompt:'Ahoj'}],['cloud',{device:'laptop',request:{op:'list'}}],
    ['mail-send',{device:'laptop',target:'friend',subject:'Zrušit',body:'Nedokončená zpráva'}],['mail-check',{device:'friend'}],
    ['phish-send',{device:'hacker',target:'laptop'}],['phish-results',{device:'hacker'}]
  ]){
    const s=model();assert(s.start(type,payload),type);s.advanceFrame();assert(s.cancel(),type);stopped(s);
    assert(s.start('web',{device:'laptop'}),type);finish(s);assert(s.net.browser.content,type);
  }
});
test('Cancelled web responses preserve an earlier document and already processed server requests',()=>{
  const s=model();s.start('web');finish(s);const content=s.net.browser.content;
  s.start('web',{address:'https://knihovna.test'});until(s,()=>[...s.packets.values()].some(p=>p.kind==='https-response'));
  const request=structuredClone(s.net.server.lastRequest);s.cancel();stopped(s);
  assert.equal(s.net.browser.content,content);assert.equal(s.net.browser.state,'cancelled');assert.deepEqual(s.net.server.lastRequest,request);
  s.start('web');finish(s);assert.equal(s.net.browser.state,'ready');
});
test('Cancelling an Instagram upload releases the composer and never delivers its incomplete content',()=>{
  const s=model();s.start('message',{messageType:'video'});until(s,()=>s.packets.size>0);s.cancel();stopped(s);
  assert.equal(s.net.instagram.text,'');assert.equal(s.net.instagram.history[0].status,'cancelled');assert(!s.net.instagram.history[0].accepted);
  assert(s.start('message',{text:'Nová zpráva'}));finish(s);assert.equal(s.net.friend.text,'Nová zpráva');assert(!s.net.instagram.history[0].delivered);
});
test('An accepted Instagram message remains on the server but cancellation stops delivery and automatic retries',()=>{
  const s=model();s.start('message',{text:'Zůstává na serveru'});until(s,()=>!!s.net.instagram.text);const entry=s.instagramEntry();
  s.cancel();stopped(s);assert(entry.accepted);assert(!entry.delivered);assert.equal(s.net.instagram.text,'Zůstává na serveru');
  assert.equal(s.net.instagram.state,'cancelled');s.start('web');finish(s);assert(!s.resumePending());assert(!entry.delivered);
  assert(s.start('message',{text:'Další zpráva'}));finish(s);assert.equal(s.net.friend.text,'Další zpráva');assert(!entry.delivered);
});
test('Cancelling a read receipt retains delivered messages without restarting the receipt on the next render',()=>{
  const s=model();s.start('message',{text:'Doručená zpráva'});finish(s);assert(s.markRead('friend'));assert.equal(s.status,'running');
  const entry=s.instagramEntry();s.cancel();stopped(s);assert(entry.delivered);assert.equal(s.net.friend.text,'Doručená zpráva');
  assert(!s.markRead('friend'));s.start('web');finish(s);assert(!s.markRead('friend'));assert.equal(s.status,'success');
});
test('Cancelling cloud operations keeps committed files and leaves uncommitted uploads absent',()=>{
  for(const committed of [false,true]){
    const s=model(),files=s.net.cloud.files,before=files.size;s.start('cloud',{device:'laptop',request:{op:'upload',name:'Zrušit.txt',content:'Zachovaná data'}});
    if(committed)until(s,()=>files.size>before);else s.advanceFrame();
    s.cancel();stopped(s);assert.equal(files.size,before+(committed?1:0));
    assert(s.start('cloud',{device:'laptop',request:{op:'list'}}));finish(s);assert(s.net.cloud.clients.laptop.listed);
  }
});
test('Cancelling automatic replication preserves both the committed client result and the previous backup',()=>{
  const s=model();s.start('cloud',{device:'laptop',request:{op:'upload',name:'Nový soubor.txt',content:'Hlavní kopie'}});
  until(s,()=>!!s.replicaResult);const files=structuredClone(s.net.cloud.files),backup=structuredClone(s.net.cloud.replica.files);
  s.cancel();stopped(s);assert.deepEqual(s.net.cloud.files,files);assert.deepEqual(s.net.cloud.replica.files,backup);assert.equal(s.net.cloud.clients.laptop.state,'ready');
  assert(s.start('web'));finish(s);assert(s.net.cloud.replicaCurrent());
});
test('An SMTP message already accepted by the server survives cancellation of its confirmation',()=>{
  const s=model();s.start('mail-send',{device:'laptop',target:'friend',subject:'Uloženo',body:'Na serveru zůstává'});
  until(s,()=>s.net.mail.boxes.friend.length>0);const saved=structuredClone(s.net.mail.boxes.friend);
  s.cancel();stopped(s);assert.deepEqual(s.net.mail.boxes.friend,saved);
  assert(s.start('mail-check',{device:'friend'}));finish(s);assert.equal(s.net.phishing.clients.friend.inbox.body,'Na serveru zůstává');
});
test('Cancellation invalidates asynchronous authentication before it can commit or enqueue a late result',async()=>{
  const s=model(),accounts=s.auth.state.accounts.size;
  assert(s.start('web',{address:'https://knihovna.test',authOp:'register',username:'novy',email:'novy@knihovna.test',password:'ZKUSEBNI-HESLO'}));
  until(s,()=>s.auth.working);const pending=s.auth.pending;
  s.cancel();stopped(s);assert.equal(s.auth.pending,null);await pending.promise;assert.equal(s.auth.state.accounts.size,accounts);assert.deepEqual(s.queue,[]);
  assert(s.start('web'));finish(s);assert.equal(s.auth.state.accounts.size,accounts);
});
test('Cancellation is a no-op without an active transfer',()=>{
  const s=model();assert(!s.cancel());assert.equal(s.status,'idle');s.start('web');finish(s);const result=s.current;assert(!s.cancel());assert.equal(s.current,result);
});
