import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mail-ui.js';import '../js/phishing-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,mailApp,phishingApp,phishingPage,computerView,mailTemplate,mailWire,emailFor,DEMO_LOGIN}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['hacker']})));
const state=(extra={})=>({monitorDevice:'hacker',hackerTab:'desktop',mailComposer:{hacker:{tab:'inbox',target:'laptop',subject:'',body:'',search:'',composeOpen:false,sentId:null,...extra}}});
function finish(s){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success',s.current?.description);}
function until(s,condition){for(let i=0;i<2000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
function capture(s){assert(s.start('phish-send',{device:'hacker',target:'laptop'}));finish(s);assert(s.start('mail-check',{device:'laptop'}));finish(s);assert(s.start('web',{device:'laptop',address:s.net.phishing.clients.laptop.inbox.link,method:'POST',phishLogin:true}));finish(s);}

test('The attacker has separate Gmail and site management apps, with a prepared mail draft matching the submitted link and account',()=>{
  const s=create(),ui=state({composeOpen:true}),mail=mailTemplate('laptop',1);
  const desktop=computerView(s.net,s,ui);assert(desktop.includes('data-computer-app="mail"'));assert(desktop.includes('data-computer-app="attack"'));assert(desktop.includes('Správa webu'));
  const html=mailApp(s.net,s,ui,'hacker');assert(html.includes(emailFor('hacker')));assert(html.includes('data-form="phish-mail"'));assert(html.includes(mail.link));assert(html.includes('readonly required'));assert(!/<textarea[^>]*readonly/.test(html));
  assert(!html.includes('data-action="phish-results"'));assert(!s.mail.validate('mail-send',{device:'hacker',target:'laptop',subject:'Volný předmět',body:'Volný obsah'}));
  const admin=phishingApp(s.net,s,ui);assert(admin.includes(mail.link));assert(admin.includes('data-action="phish-compose"'));assert(!admin.includes('data-form="phish-mail"'));
  assert(s.start('phish-send',{device:'hacker',target:'laptop'}));finish(s);
  const submitted=s.net.mail.boxes.laptop[0];assert.equal(submitted.link,mail.link);assert.equal(submitted.from,emailFor('hacker'));
  assert(mailWire(submitted).includes(mail.link));const request=s.net.mail.dialogue.filter(r=>r.node==='hacker'&&r.direction==='out');assert.equal(request.length,1);assert(request[0].wire.includes(`From: ${emailFor('hacker')}`));assert(request[0].wire.includes(mail.link));
});

test('Edited attacker mail survives recipient changes and is delivered exactly over SMTP and IMAP, with and without TLS',()=>{
  for(const tls of [false,true]){
    const s=new Simulation(new Network(new LabSettings({features:['hacker',...(tls?['tls']:[])]})));assert.equal(s.net.featureEnabled('tls'),tls);
    const template=mailTemplate('laptop',1),body='Upravený text 🐎.\n.Další řádek <b>zprávy</b>.',full=body+'\n\nVlastní popisek\n'+template.link;
    const ui=state({composeOpen:true,phishBody:full});ui.mailComposer.hacker.target='friend';
    const html=mailApp(s.net,s,ui,'hacker');assert(html.includes('Upravený text'));assert(html.includes('&lt;b&gt;zprávy&lt;/b&gt;'));assert(html.includes('data-mail-field="phishBody"'));assert(!/<textarea[^>]*readonly/.test(html));
    assert(s.start('phish-send',{device:'hacker',target:'friend',body:full}));finish(s);
    const stored=s.net.mail.boxes.friend[0],sent=s.net.phishing.clients.hacker.sent[0];
    for(const m of [stored,sent]){assert.equal(m.body,body);assert.equal(m.link,template.link);assert.equal(m.linkLabel,'Vlastní popisek');assert.equal(m.to,emailFor('friend'));}
    assert(s.net.mail.dialogue.some(r=>r.node==='hacker'&&r.wire.includes(body.replace(/\n/g,'\r\n').replace(/^\./gm,'..'))));
    assert(s.start('mail-check',{device:'friend'}));finish(s);assert.equal(s.net.phishing.clients.friend.inbox.body,body);assert.equal(s.net.phishing.clients.friend.inbox.link,template.link);s.net.phishing.clients.friend.opened=true;
    const received=mailApp(s.net,s,{mailComposer:{friend:{tab:'inbox',search:''}}},'friend');assert(!received.includes('data-action="phish-report"'));assert(!received.includes('data-action="phish-legit"'));assert(received.includes('data-action="phish-open"'));
    assert(s.start('phish-send',{device:'hacker',target:'laptop',body:'Zpráva bez odkazu'}));finish(s);assert.equal(s.net.mail.boxes.laptop[0].body,'Zpráva bez odkazu');assert(!s.net.mail.boxes.laptop[0].link);
    for(const invalid of ['', '   ', 3, 'x'.repeat(1201)])assert(!s.mail.validate('phish-send',{device:'hacker',target:'laptop',body:invalid}));
  }
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
  const page=phishingPage(s.net,s,'laptop',s.net.browser);assert(!page.includes('phish-outcome'));assert(!page.includes('phish-domain-note'));assert(!page.includes('Pro pokus jsou připravené'));assert(page.includes('Ověření bylo přijato.'));
  assert.equal(s.net.phishing.captures.size,1);assert(!phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));assert(!mailApp(s.net,s,ui,'hacker').includes(DEMO_LOGIN.password));
  assert(s.start('phish-results',{device:'hacker'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-response'));
  assert(!phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));finish(s);assert(phishingApp(s.net,s,ui).includes(DEMO_LOGIN.password));
  assert(!mailApp(s.net,s,ui,'hacker').includes(DEMO_LOGIN.password));const previous=structuredClone(s.net.phishing.hacker.results);
  s.net.toggleLink('phish-uplink');assert(s.start('phish-results',{device:'hacker'}));for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'failed');assert.deepEqual(s.net.phishing.hacker.results,previous);
  s.net.phishing.hacker.results[0].username='<img src=x onerror=alert(1)>';
  const safe=phishingApp(s.net,s,ui);assert(safe.includes('&lt;img'));assert(!safe.includes('<img'));assert(safe.includes('role="status"'));
});
