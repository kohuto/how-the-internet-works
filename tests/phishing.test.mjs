import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,PHISH_HOST,DEMO_LOGIN,webAddress,requestText}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<5000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function run(s,type,payload={}){assert(s.start(type,payload),type);return finish(s);}
function until(s,condition){for(let i=0;i<5000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
function send(s,target='laptop'){return run(s,'phish-send',{device:'hacker',target});}
function fetch(s,device='laptop'){return run(s,'mail-check',{device});}
function link(s,device='laptop'){return s.net.phishing.clients[device].inbox.link;}
function visit(s,device='laptop',extra={}){return run(s,'web',{device,address:link(s,device),...extra});}
function submit(s,device='laptop'){return visit(s,device,{method:'POST',phishLogin:true});}
function capture(s,device='laptop'){send(s,device);fetch(s,device);visit(s,device);return submit(s,device);}

test('The lair has an independent private LAN/NAT and the fake hosting and mail servers have real routed endpoints',()=>{
 const s=new Simulation(),n=s.net;assert.equal(n.nodes.hacker.type,'host');assert.equal(n.natAddress('hacker-router'),'192.0.2.62');assert.equal(n.nodes.mail.ip,'203.0.113.40');assert.equal(n.nodes['phish-web'].ip,'192.0.2.170');
 assert(!n.nodes.peer.routes.some(r=>r.prefix==='192.168.40.0/24'));assert(n.route('peer','192.0.2.170'));assert(n.physicalCanReach('hacker','mail'));assert(n.physicalCanReach('hacker','phish-web'));
 assert(!s.start('phish-send',{device:'laptop',target:'friend'}));assert(!s.start('phish-results',{device:'phone'}));assert(!s.start('mail-check',{device:'hacker'}));
});

test('Mail is stored only when the request arrives; the recipient sees it only after its own fetch response',()=>{
 const s=new Simulation();assert(s.start('phish-send',{device:'hacker',target:'laptop'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-request'));assert.equal(s.net.phishing.messages.size,0);
 until(s,()=>s.net.phishing.messages.size===1);assert.equal(s.net.phishing.clients.laptop.inbox,null);assert.equal(s.net.phishing.hacker.state,'sending');finish(s);assert.equal(s.net.phishing.hacker.state,'ready');
 assert(s.start('mail-check',{device:'laptop'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-response'));assert.equal(s.net.phishing.clients.laptop.inbox,null);finish(s);
 assert.equal(s.net.phishing.clients.laptop.inbox.id,1);assert.equal(s.net.phishing.clients.phone.inbox,null);
});

test('Mail survives an offline recipient and an offline attacker and is later fetched through the recipient network',()=>{
 const s=new Simulation();s.net.toggleNode('friend');send(s,'friend');assert.equal(s.status,'success');assert(s.net.phishing.messages.has(1));fetch(s,'friend');assert.equal(s.status,'failed');
 s.net.toggleNode('hacker');s.net.toggleNode('friend');const events=fetch(s,'friend');assert.equal(s.status,'success');assert.equal(s.net.phishing.clients.friend.inbox.id,1);assert(events.some(e=>e.kind==='hop'&&e.link==='friend-uplink'));assert(!events.some(e=>e.kind==='hop'&&e.link==='hacker-uplink'));
});

test('Opening mail or the fake site sends no credentials; valid HTTPS authenticates the fake host itself',()=>{
 const s=new Simulation();send(s);fetch(s);s.net.phishing.clients.laptop.opened=true;assert.equal(s.net.phishing.captures.size,0);
 const events=visit(s);assert.equal(s.status,'success');assert.equal(s.net.browser.pageType,'phishing');assert(s.net.browser.certificateVerified);assert.equal(s.net.phishing.captures.size,0);assert.equal(s.net.server.lastRequest,null);
 assert(events.some(e=>e.packet?.kind==='dns-query'&&e.packet.payload.name===PHISH_HOST));assert(events.some(e=>e.kind==='hop'&&e.link==='phish-uplink'));
 assert.equal(s.net.browser.dnsCache[PHISH_HOST],s.net.nodes['phish-web'].ip);assert(s.net.phishing.lastWeb.secure);
});

test('Fictional credentials arrive at the fake endpoint before any copy is available on the attacker computer',()=>{
 const s=new Simulation();send(s);fetch(s);visit(s);assert(s.start('web',{device:'laptop',address:link(s),method:'POST',phishLogin:true}));
 until(s,()=>s.current?.kind==='deliver'&&s.current.packet.kind==='https-request');assert.equal(s.net.phishing.captures.size,0);s.advance();assert.equal(s.net.phishing.captures.size,1);assert.equal(s.net.phishing.hacker.results.length,0);assert(!s.net.browser.submitted);finish(s);assert(s.net.browser.submitted);
 const record=[...s.net.phishing.captures.values()][0];assert.equal(record.username,DEMO_LOGIN.username);assert.equal(record.password,DEMO_LOGIN.password);assert.equal(record.sourceIp,'192.0.2.1');assert(record.secure);
 assert(s.start('phish-results',{device:'hacker'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-response'));assert.equal(s.net.phishing.hacker.results.length,0);finish(s);assert.deepEqual(s.net.phishing.hacker.results,[record]);
});

test('Reporting the message blocks this campaign before form packets leave; known library remains available',()=>{
 const s=new Simulation();send(s);fetch(s);visit(s);assert(s.phishing.report('laptop'));assert(s.phishing.blocked('laptop',1));
 submit(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.captures.size,0);assert(![...s.packets.values()].some(p=>p.kind==='https-request'));run(s,'web',{device:'laptop',address:'https://knihovna.test'});assert.equal(s.status,'success');assert.equal(s.net.browser.pageType,'library');
 send(s);fetch(s);assert.equal(s.net.phishing.clients.laptop.inbox.id,2);assert(!s.phishing.blocked('laptop',2));
});

test('The legitimate cookie stays bound to the library and is never sent to the lookalike domain',()=>{
 const s=new Simulation();run(s,'web',{address:'https://knihovna.test'});const cookie=structuredClone(s.net.browser.cookies.items);send(s);fetch(s);visit(s);submit(s);
 assert.equal(s.net.phishing.lastWeb.cookie,'');assert.deepEqual(s.net.browser.cookies.items,cookie);assert.equal(s.net.server.cookies.visitors.size,1);
 run(s,'web',{address:'https://knihovna.test'});assert.equal(s.net.browser.visitor.id,'v1');assert.equal(s.net.browser.visitor.loads,2);
});

test('The scenario works through all recipient accesses, including satellite, and keeps requests/responses bound through VPN',()=>{
 for(const [device,mode,linkId] of [['laptop','wifi','laptop-wifi'],['friend','wifi','friend-wifi'],['phone','cellular','phone-bts-park'],['phone','wifi','phone-wifi'],['cabin','wifi','sat-uplink']]){
 const s=new Simulation();s.net.setAccess(device,mode,device==='phone'?'bts-park':undefined);s.net.setVPN(device,true);s.net.setVPN('hacker',true);
 const events=capture(s,device);assert.equal(s.status,'success',device+' '+mode);assert(events.some(e=>e.kind==='hop'&&e.link===linkId));assert.equal(s.net.phishing.lastWeb.sourceIp,s.net.nodes.vpn.ip);
 run(s,'phish-results',{device:'hacker'});assert.equal(s.status,'success');assert.equal(s.net.phishing.hacker.results.length,1);assert(s.net.vpnPeerValid('hacker'));
 }
});

test('Cutting mail or fake hosting affects their own service and leaves the other service usable',()=>{
 const s=new Simulation();s.net.toggleNode('mail');send(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.messages.size,0);s.net.toggleNode('mail');send(s);fetch(s);
 s.net.toggleLink('phish-uplink');visit(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.captures.size,0);fetch(s);assert.equal(s.status,'success');s.net.toggleLink('phish-uplink');visit(s);assert.equal(s.status,'success');
});

test('A lost send confirmation does not duplicate the stored email on repeat',()=>{
 const s=new Simulation();assert(s.start('phish-send',{device:'hacker',target:'phone'}));until(s,()=>s.net.phishing.messages.size===1);s.net.clearNat('hacker-router');finish(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.hacker.state,'error');
 assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.messages.size,1);assert.equal(s.net.phishing.mailboxes.phone,1);
});

test('A lost login response preserves the server capture and retry is idempotent',()=>{
 const s=new Simulation();send(s);fetch(s);visit(s);assert(s.start('web',{address:link(s),method:'POST',phishLogin:true}));until(s,()=>s.net.phishing.captures.size===1);s.net.clearNat('home');finish(s);assert.equal(s.status,'failed');assert(!s.net.browser.submitted);
 assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.captures.size,1);assert(s.net.browser.submitted);
});

test('TLS corruption, an invalid fake-site certificate or interrupted access prevents acceptance and preserves prior state',()=>{
 const s=new Simulation();assert(s.start('phish-send',{device:'hacker',target:'laptop'}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='phish-request'));[...s.packets.values()][0].payload.record.data[0]^=1;finish(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.messages.size,0);
 send(s);fetch(s);s.net.phishing.certificate.valid=false;visit(s);assert.equal(s.status,'failed');assert(!s.net.browser.certificateVerified);assert.equal(s.net.phishing.captures.size,0);s.net.phishing.certificate.valid=true;
 assert(s.start('mail-check',{device:'laptop'}));s.net.setAccess('laptop','wifi');s.connectionChanged('laptop');assert.equal(s.status,'failed');assert.equal(s.net.phishing.clients.laptop.state,'error');fetch(s);assert.equal(s.status,'success');
 assert(s.start('web',{device:'laptop',address:link(s).replace('https:','http:'),method:'POST',phishLogin:true}));until(s,()=>[...s.packets.values()].some(p=>p.kind==='http-request'));[...s.packets.values()].find(p=>p.kind==='http-request').payload.message='{invalid';finish(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.captures.size,0);
});

test('Mail/admin payloads and HTTPS credential payloads are opaque in transit, while HTTP credentials are visible',()=>{
 const s=new Simulation();const mail=send(s);assert(mail.filter(e=>e.kind==='hop'&&e.packet.connection==='phishing-api').every(e=>e.packet.payload.record&&!JSON.stringify(e.packet).includes('Ověření čtenářského účtu')));fetch(s);const secure=capture(s);
 assert(secure.filter(e=>e.kind==='hop'&&e.packet.kind==='https-request').every(e=>!JSON.stringify(e.packet).includes(DEMO_LOGIN.password)));
 run(s,'web',{address:link(s).replace('https:','http:'),method:'POST',phishLogin:true});assert.equal(s.status,'success');assert([...s.packets.values()].some(p=>p.kind==='http-request'&&requestText(p.payload).includes(DEMO_LOGIN.password)));assert(s.current.description.includes('HTTP'));assert(!s.current.description.includes('dešifrovala'));
});

test('Web navigation accepts only the two fixed model domains and keeps fake-domain query identifiers',()=>{
 for(const value of ['https://example.com','https://knihovna-podpora.test.evil','https://knihovna-podpora.test/other','https://knihovna-podpora.test/overeni?url=https://example.com','javascript:alert(1)'])assert.equal(webAddress(value),null);
 const a=webAddress('https://knihovna-podpora.test/overeni?zprava=7');assert.equal(a.server,'phish-web');assert.equal(a.messageId,7);assert.equal(a.host,PHISH_HOST);assert.equal(webAddress('https://knihovna.test').server,'web');
});
