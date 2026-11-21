import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mail-ui.js';import '../js/phishing-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,mailApp,phishingApp,computerView,mailTemplate,mailWire,emailFor,DEMO_LOGIN}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['hacker']})));
const state=(extra={})=>({monitorDevice:'hacker',hackerTab:'desktop',mailComposer:{hacker:{tab:'inbox',target:'laptop',subject:'',body:'',search:'',composeOpen:false,sentId:null,...extra}}});
function finish(s){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success',s.current?.description);}
function until(s,condition){for(let i=0;i<2000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
function capture(s){assert(s.start('phish-send',{device:'hacker',target:'laptop'}));finish(s);assert(s.start('mail-check',{device:'laptop'}));finish(s);assert(s.start('web',{device:'laptop',address:s.net.phishing.clients.laptop.inbox.link,method:'POST',phishLogin:true}));finish(s);}

test('The attacker has separate Gmail and site management apps, with a fixed mail draft matching the submitted link and account',()=>{
  const s=create(),ui=state({composeOpen:true}),mail=mailTemplate('laptop',1);
  const desktop=computerView(s.net,s,ui);assert(desktop.includes('data-computer-app="mail"'));assert(desktop.includes('data-computer-app="attack"'));assert(desktop.includes('Správa webu'));
  const html=mailApp(s.net,s,ui,'hacker');assert(html.includes(emailFor('hacker')));assert(html.includes('data-form="phish-mail"'));assert(html.includes(mail.link));assert(html.includes('readonly required'));
  assert(!html.includes('data-action="phish-results"'));assert(!s.mail.validate('mail-send',{device:'hacker',target:'laptop',subject:'Volný předmět',body:'Volný obsah'}));
  const admin=phishingApp(s.net,s,ui);assert(admin.includes(mail.link));assert(admin.includes('data-action="phish-compose"'));assert(!admin.includes('data-form="phish-mail"'));
  assert(s.start('phish-send',{device:'hacker',target:'laptop'}));finish(s);
  const submitted=s.net.mail.boxes.laptop[0];assert.equal(submitted.link,mail.link);assert.equal(submitted.from,emailFor('hacker'));
  assert(mailWire(submitted).includes(mail.link));assert(s.net.mail.dialogue.some(r=>r.node==='hacker'&&r.wire===`MAIL FROM:<${emailFor('hacker')}>`));
});

test('Attacker sent mail appears only after SMTP acknowledgement, remains independent of server storage, and cannot open the lure as a victim',()=>{
  const s=create(),ui=state({tab:'sent'}),admin=structuredClone(s.net.phishing.hacker);
  assert(s.start('phish-send',{device:'hacker',target:'laptop'}));until(s,()=>s.mail.entry?.accepted);
  assert.equal(s.net.phishing.clients.hacker.sent.length,0);assert(!mailApp(s.net,s,ui,'hacker').includes('data-gmail-sent="1"'));
  finish(s);assert.deepEqual(s.net.phishing.hacker,admin);assert.equal(s.net.phishing.clients.hacker.sent.length,1);
  s.net.mail.boxes.laptop[0].subject='Změněný serverový obsah';ui.mailComposer.hacker.sentId='1';
  const html=mailApp(s.net,s,ui,'hacker');assert(html.includes('Ověření čtenářského účtu'));assert(!html.includes('Změněný serverový obsah'));
  assert(html.includes('gmail-sent-link'));assert(!html.includes('data-action="phish-open"'));assert(!html.includes('data-action="phish-report"'));
  assert(s.start('mail-check',{device:'hacker'}));finish(s);assert.deepEqual(s.net.phishing.clients.hacker.items,[]);
});

test('Captured credentials are visible only in the separate admin app after the result response arrives, with failed refreshes preserving the last fetched copy',()=>{
  const s=create(),ui=state();capture(s);
  assert.equal(s.net.phishing.captures.size,1);assert(!phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));assert(!mailApp(s.net,s,ui,'hacker').includes(DEMO_LOGIN.password));
  assert(s.start('phish-results',{device:'hacker'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-response'));
  assert(!phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));finish(s);assert(phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));
  assert(!mailApp(s.net,s,ui,'hacker').includes(DEMO_LOGIN.password));const previous=structuredClone(s.net.phishing.hacker.results);
  s.net.toggleLink('phish-uplink');assert(s.start('phish-results',{device:'hacker'}));for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'failed');assert.deepEqual(s.net.phishing.hacker.results,previous);
  s.net.phishing.hacker.results[0].username='<img src=x onerror=alert(1)>';
  const safe=phishingApp(s.net,s,ui);assert(safe.includes('&lt;img'));assert(!safe.includes('<img'));assert(safe.includes('role="status"'));
});
