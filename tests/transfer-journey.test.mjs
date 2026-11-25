import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';
import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';
import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/transfer-journey.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {TransferJourney,Simulation,Network,LabSettings,transferCaption}=globalThis.InternetLab;
function setup(){
  let now=0,serial=0;const tasks=new Map(),events=[];
  const journey=new TransferJourney({
    setTimer:(fn,ms)=>{const id=++serial;tasks.set(id,{at:now+ms,fn});return id;},clearTimer:id=>tasks.delete(id),
    onMinimize:c=>events.push(['map',c.device,c.run]),onRestore:(c,r)=>events.push(['restore',c.device,c.app,r.status]),onClear:()=>events.push(['clear'])
  });
  function tick(ms){const end=now+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;tasks.delete(next[0]);now=next[1].at;next[1].fn();}now=end;}
  return {journey,events,tick,tasks};
}
const model=()=>new Simulation(new Network(new LabSettings({features:['instagram','mail','cloud','chatbot','printer','hacker']})));
function begin(journey,s,app='web'){return journey.begin(s,{device:s.clientId(),app,caption:transferCaption(s)});}
function finish(s){for(let i=0;s.status==='running'&&i<12000;i++)s.advanceFrame();assert.notEqual(s.status,'running');}

test('The loading view automatically minimizes, then restores the same app only after real network completion',()=>{
  const {journey,events,tick}=setup(),s=model();s.start('web');begin(journey,s);
  tick(499);assert.equal(journey.current.phase,'departing');assert.deepEqual(events,[]);
  tick(1);assert.equal(journey.current.phase,'map');assert.deepEqual(events,[['map','laptop',s.run]]);
  journey.observe(s);tick(1000);assert(!events.some(e=>e[0]==='restore'));
  finish(s);assert.equal(s.net.browser.content,s.net.server.title);journey.observe(s);
  tick(699);assert(journey.current);tick(1);assert.equal(journey.current,null);assert.deepEqual(events.at(-1),['restore','laptop','web','success']);
});
test('Every explicit application transfer follows the same presentation lifecycle',()=>{
  for(const [type,payload,app] of [
    ['web',{},'web'],['print',{},'print'],['message',{messageType:'image'},'message'],
    ['chatbot',{prompt:'Ahoj'},'chatbot'],['cloud',{device:'laptop',request:{op:'list'}},'cloud'],
    ['mail-send',{device:'laptop',target:'friend',subject:'Ahoj',body:'Obsah'},'mail'],['mail-check',{device:'friend'},'mail'],
    ['phish-send',{device:'hacker',target:'laptop'},'mail'],['phish-results',{device:'hacker'},'attack']
  ]){
    const {journey,tick,events}=setup(),s=model();assert(s.start(type,payload),type);begin(journey,s,app);tick(500);finish(s);assert.equal(s.status,'success',type);journey.observe(s);tick(700);
    assert.deepEqual(events.at(-1),['restore',payload.device||'laptop',app,'success'],type);
  }
});
test('Server failure and offline recipients return with an honest failure or waiting result',()=>{
  for(const waiting of [false,true]){
    const {journey,tick,events}=setup(),s=model();s.net.toggleNode(waiting?'friend':'web');s.start(waiting?'message':'web');begin(journey,s,waiting?'message':'web');tick(500);finish(s);
    const status=waiting?'waiting':'failed';assert.equal(s.status,status);journey.observe(s);tick(700);assert.equal(events.at(-1)[3],status);
  }
});
test('Pausing, empty async queues and packet/settings inspection cannot cause an early return',()=>{
  const {journey,tick,events}=setup(),s=model();s.start('web');begin(journey,s);tick(500);
  const queue=s.queue;s.queue=[];journey.observe(s);tick(3000);assert(journey.current);assert(!events.some(e=>e[0]==='restore'));s.queue=queue;
  finish(s);journey.observe(s);tick(300);journey.observe(s,{blocked:true});tick(3000);assert(journey.current);
  journey.observe(s,{blocked:false});tick(700);assert.equal(events.at(-1)[0],'restore');
});
test('Browsing another view preserves the thumbnail and restores the originating app after delivery',()=>{
  for(const phase of ['departing','map','expanded']){
    const {journey,tick,events}=setup(),s=model();s.start('web');begin(journey,s);
    if(phase==='map')tick(500);else if(phase==='expanded')journey.expand();
    const context=journey.current;journey.browse();tick(1000);journey.observe(s);
    assert.equal(journey.current,context);assert.equal(context.phase,'map');
    if(phase==='departing')assert(!events.some(e=>e[0]==='map'));
    assert(!events.some(e=>e[0]==='restore'));
    finish(s);journey.observe(s);tick(699);assert.equal(journey.current,context);
    tick(1);assert.deepEqual(events.at(-1),['restore','laptop','web','success']);assert.equal(journey.current,null);
  }
});
test('Browsing during the arrival delay preserves the pending return, while inspection can still defer it',()=>{
  for(const blocked of [false,true]){
    const {journey,tick,events}=setup(),s=model();s.start('web');begin(journey,s);tick(500);finish(s);journey.observe(s);tick(300);
    journey.browse();journey.observe(s,{blocked});
    if(blocked){tick(2000);assert(journey.current);assert(!events.some(e=>e[0]==='restore'));journey.observe(s);tick(700);}
    else tick(400);
    assert.deepEqual(events.at(-1),['restore','laptop','web','success']);assert.equal(journey.current,null);
  }
});
test('Expanding the originating device is reversible and does not restart or step the simulation',()=>{
  const {journey,tick}=setup(),s=model();s.start('web');const packetCount=s.packets.size;begin(journey,s);tick(200);
  assert.equal(journey.expand().phase,'expanded');tick(1000);assert.equal(journey.current.phase,'expanded');
  journey.minimize();assert.equal(journey.current.phase,'map');assert.equal(s.packets.size,packetCount);assert.equal(s.steps,0);
});
test('Repeat, a new transfer, reset or power-off cancels stale return timers',()=>{
  const {journey,tick,events}=setup(),s=model();s.start('web');begin(journey,s);tick(500);finish(s);journey.observe(s);
  assert(s.repeat());begin(journey,s);tick(700);assert(!events.some(e=>e[0]==='restore'));assert.equal(journey.current.run,s.run);
  finish(s);journey.observe(s,{sourceOn:false});tick(1000);assert.equal(journey.current,null);assert(!events.some(e=>e[0]==='restore'));
  s.start('web');begin(journey,s);s.run++;journey.observe(s);tick(1000);assert.equal(journey.current,null);
});
test('A committed cloud operation can return to its client while server replication continues',()=>{
  const {journey,tick,events}=setup(),s=model();assert(s.start('cloud',{device:'laptop',request:{op:'upload',name:'Kopie.txt',content:'Data na serveru'}}));begin(journey,s,'cloud');tick(500);
  for(let i=0;s.status==='running'&&!s.replicaResult&&i<12000;i++)s.advanceFrame();assert(s.replicaResult);assert.equal(s.net.cloud.clients.laptop.state,'ready');
  journey.observe(s);tick(700);assert.deepEqual(events.at(-1),['restore','laptop','cloud','success']);assert.equal(s.status,'running');finish(s);assert(s.net.cloud.replicaCurrent());
});
test('Transfer captions describe the user action and distinguish message attachments',()=>{
  const s=model();for(const [messageType,caption] of [['text','Posílám zprávu'],['image','Posílám obrázek'],['video','Posílám video']]){
    if(s.status==='running')s.status='stopped';assert(s.start('message',{messageType}));assert.equal(transferCaption(s),caption);
  }
  s.status='stopped';s.start('web');assert.equal(transferCaption(s),'Načítám knihovnu');
});
