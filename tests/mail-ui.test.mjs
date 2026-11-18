import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mail-ui.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,mailApp}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['mail']})));
const state=(device,extra={})=>({mailDraft:{[device]:{tab:'inbox',target:device==='friend'?'laptop':'friend',subject:'',body:'',...extra}},mailDialogue:{}});
function finish(s){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success',s.current?.description);}
function send(s,subject,body){assert(s.start('mail-send',{device:'laptop',target:'friend',subject,body}));finish(s);}

test('The Gmail inbox shows only fetched local copies, not messages still held on the server',()=>{
  const s=create(),ui=state('friend');send(s,'Soukromý předmět','Obsah, který ještě nebyl načten.');
  assert.equal(s.net.mail.boxes.friend.length,1);
  const before=mailApp(s.net,s,ui,'friend');assert(!before.includes('Soukromý předmět'));assert(!before.includes('Obsah, který ještě nebyl načten.'));
  assert(s.start('mail-check',{device:'friend'}));finish(s);
  const after=mailApp(s.net,s,ui,'friend');assert(after.includes('Soukromý předmět'));assert(after.includes('Obsah, který ještě nebyl načten.'));
  assert(after.includes('gmail-app'));assert(!after.includes('gmail-network'));assert(!after.includes('UID 1'));
});
test('The sent folder waits for the SMTP acknowledgement and keeps an independent local copy',()=>{
  const s=create(),ui=state('laptop',{tab:'sent'});
  assert(s.start('mail-send',{device:'laptop',target:'friend',subject:'Potvrzené odeslání',body:'Neměnná místní kopie.'}));
  for(let i=0;i<2000&&!s.mail.entry?.accepted;i++)s.advanceFrame();assert(s.mail.entry.accepted);
  assert(!mailApp(s.net,s,ui,'laptop').includes('Potvrzené odeslání'));
  finish(s);s.net.mail.boxes.friend[0].body='Změna serverové schránky';
  const html=mailApp(s.net,s,ui,'laptop');assert(html.includes('Potvrzené odeslání'));assert(html.includes('Neměnná místní kopie.'));assert(!html.includes('Změna serverové schránky'));
  assert(!mailApp(s.net,s,state('friend',{tab:'sent'}),'friend').includes('Potvrzené odeslání'));
});
test('Search filters local messages and all displayed subjects, content and drafts remain escaped',()=>{
  const s=create();send(s,'Běžný pozdrav','Ahoj Matěji');send(s,'Tajné <script>test()</script>','Obrázek <img src=x onerror=alert(1)>');
  assert(s.start('mail-check',{device:'friend'}));finish(s);
  const ui=state('friend',{search:'tajné'}),html=mailApp(s.net,s,ui,'friend');assert(!html.includes('Běžný pozdrav'));assert(html.includes('Tajné &lt;script&gt;'));
  s.mail.open('friend',s.net.phishing.clients.friend.items.at(-1).id);
  const letter=mailApp(s.net,s,ui,'friend');assert(letter.includes('&lt;img'));assert(!letter.includes('<img'));assert(!letter.includes('<script>'));
  Object.assign(ui.mailDraft.friend,{composeOpen:true,subject:'" onfocus="alert(1)',body:'</textarea><script>alert(1)</script>'});
  const compose=mailApp(s.net,s,ui,'friend');assert(compose.includes('&quot; onfocus=&quot;'));assert(compose.includes('&lt;/textarea&gt;'));assert(!compose.includes('<script>'));
});
