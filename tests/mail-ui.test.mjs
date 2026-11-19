import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mail-ui.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,mailApp,mailServerDetail}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['mail']})));
const state=(device,extra={})=>({mailComposer:{[device]:{tab:'inbox',target:device==='friend'?'laptop':'friend',subject:'',body:'',...extra}}});
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
test('Search filters local messages and all displayed subjects, content and composition fields remain escaped',()=>{
  const s=create();send(s,'Běžný pozdrav','Ahoj Matěji');send(s,'Tajné <script>test()</script>','Obrázek <img src=x onerror=alert(1)>');
  assert(s.start('mail-check',{device:'friend'}));finish(s);
  const ui=state('friend',{search:'tajné'}),html=mailApp(s.net,s,ui,'friend');assert(!html.includes('Běžný pozdrav'));assert(html.includes('Tajné &lt;script&gt;'));
  s.mail.open('friend',s.net.phishing.clients.friend.items.at(-1).id);
  const letter=mailApp(s.net,s,ui,'friend');assert(letter.includes('&lt;img'));assert(!letter.includes('<img'));assert(!letter.includes('<script>'));
  Object.assign(ui.mailComposer.friend,{composeOpen:true,subject:'" onfocus="alert(1)',body:'</textarea><script>alert(1)</script>'});
  const compose=mailApp(s.net,s,ui,'friend');assert(compose.includes('&quot; onfocus=&quot;'));assert(compose.includes('&lt;/textarea&gt;'));assert(!compose.includes('<script>'));
});

test('Notebook composers display a fixed recipient, including when the destination is switched off',()=>{
  const s=create();
  for(const [device,target,address] of [['laptop','friend','matej@gmail.com'],['friend','laptop','ty@gmail.com']]){
    s.net.toggleNode(target);
    const html=mailApp(s.net,s,state(device,{composeOpen:true,target:'phone'}),device);
    assert(html.includes(`<span class="gmail-recipient">${address}</span>`));
    assert(!html.includes('data-mail-field="target"'));assert(!html.includes('<select'));
    s.net.toggleNode(target);
  }
});
test('Reply is offered only when the notebook can send back to that sender',()=>{
  const s=create();
  for(const [device,source] of [['laptop','friend'],['friend','laptop']]){
    const c=s.net.phishing.clients[device];c.opened=true;
    c.inbox={subject:'Pozdrav',body:'Ahoj',fromName:'Odesílatel',from:'ukazka@gmail.com',to:'prijemce@gmail.com',seen:true,source};
    assert(mailApp(s.net,s,state(device),device).includes('data-gmail-action="reply"'));
    c.inbox.source='phone';assert(!mailApp(s.net,s,state(device),device).includes('data-gmail-action="reply"'));
  }
});
test('Server mailboxes expose stored messages before client fetch without changing unread or transfer state',()=>{
  const s=create(),render=()=>mailServerDetail(s.net,s,s.net.nodes.mail);
  const empty=render();assert(empty.includes('SCHRÁNKY NA SERVERU'));assert(empty.includes('Schránka je prázdná.'));
  assert(!empty.includes('POHLED SPRÁVCE'));assert(!empty.includes('PŘIJATÉ ZPRÁVY · POHLED SERVERU'));
  s.net.toggleNode('friend');
  assert(s.start('mail-send',{device:'laptop',target:'friend',subject:'Přímo na serveru',body:'Obsah před načtením do vypnutého počítače.'}));
  assert(!render().includes('Přímo na serveru'));
  for(let i=0;i<2000&&!s.mail.entry?.accepted;i++)s.advanceFrame();assert(s.mail.entry.accepted);
  const boxes=structuredClone(s.net.mail.boxes),items=structuredClone(s.net.phishing.clients.friend.items),current=s.current,packets=s.packets.size,dialogue=s.net.mail.dialogue.length;
  const html=render();assert(html.includes('Přímo na serveru'));assert(html.includes('Obsah před načtením do vypnutého počítače.'));
  assert(html.includes('data-detail-key="mailbox-friend-message-1"'));assert(html.includes('Nepřečtená'));
  assert.deepEqual(s.net.mail.boxes,boxes);assert.deepEqual(s.net.phishing.clients.friend.items,items);
  assert.equal(items.length,0);assert.strictEqual(s.current,current);assert.equal(s.packets.size,packets);assert.equal(s.net.mail.dialogue.length,dialogue);
  finish(s);
});
test('Server message previews keep each mailbox separate and escape content and phishing URLs',()=>{
  const s=create();send(s,'Předmět <script>test()</script>','První řádek\n<img src=x onerror=alert(1)>');
  assert(s.start('mail-send',{device:'friend',target:'laptop',subject:'Odpověď',body:'Druhá schránka'}));finish(s);
  const message=s.net.mail.boxes.friend[0];message.linkLabel='<svg onload=alert(1)>';message.link='https://knihovna-podpora.test/" onclick="alert(1)';
  const html=mailServerDetail(s.net,s,s.net.nodes.mail);
  for(const key of ['mailbox-laptop-message-1','mailbox-friend-message-1'])assert(html.includes(`data-detail-key="${key}"`));
  assert.equal((html.match(/class="mail-server-message"/g)||[]).length,2);
  assert(html.includes('Předmět &lt;script&gt;'));assert(html.includes('První řádek\n&lt;img'));
  assert(html.includes('&lt;svg onload='));assert(html.includes('&quot; onclick=&quot;'));
  assert(!html.includes('<script>'));assert(!html.includes('<img'));assert(!html.includes('data-action="phish-open"'));assert(!html.includes('<a '));
  assert(!s.net.mail.boxes.friend[0].seen);assert(!s.net.mail.boxes.laptop[0].seen);
});
