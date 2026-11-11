import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,MITM_TITLE,DEMO_LOGIN}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<6000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function web(s,scheme='http',extra={}){assert(s.start('web',{device:'cafe',address:`${scheme}://knihovna.test`,...extra}));return finish(s);}
function attack(mode='observe'){const s=new Simulation();s.mitm.configure(true,mode);s.net.setCafeHotspot('rogue');return s;}
function until(s,condition){for(let i=0;i<6000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}

test('The cafe has a private LAN, NAT and an independent routed uplink, with one selected Wi-Fi',()=>{
 const s=new Simulation(),n=s.net;assert.equal(n.natAddress('cafe-router'),'192.0.2.69');assert.equal(n.nodes.cafe.ip,'192.168.50.10');assert(!n.nodes.south.routes.some(r=>r.prefix==='192.168.50.0/24'));
 assert(n.isActive(n.links['cafe-wifi']));assert(!n.isActive(n.links['cafe-twin']));assert(!n.setAccess('cafe','cable'));assert.notEqual(n.browserFor('cafe'),n.browser);assert(n.phishing.clients.cafe);
 const events=web(s);assert.equal(s.status,'success');assert.equal(n.server.lastRequest.sourceIp,'192.0.2.69');assert(events.some(e=>e.kind==='hop'&&e.link==='cafe-uplink'));assert.equal(n.mitm.logs.length,0);
});

test('Switching on a nearby evil twin alone does not reveal traffic, including flooded wrong-destination copies',()=>{
 const s=new Simulation();s.mitm.configure(true,'http');const events=web(s);assert.equal(s.status,'success');assert.equal(s.net.browserFor('cafe').content,s.net.server.title);assert.equal(s.net.mitm.logs.length,0);
 assert(events.some(e=>e.kind==='hop'&&e.to==='cafe-attacker'&&e.copy));assert(!events.some(e=>e.kind==='mitm'));
});

test('An evil-twin connection carries both directions through the attacker without an extra IP routing hop',()=>{
 const s=attack(),events=web(s);assert.equal(s.status,'success');const records=s.net.mitm.logs;assert.equal(records.length,4);assert.equal(new Set(records.map(r=>r.packetId)).size,4);
 assert(records.some(r=>r.direction==='out'&&r.header.src==='192.168.50.10'));assert(records.some(r=>r.direction==='in'&&r.header.dst==='192.168.50.10'));
 assert(events.some(e=>e.kind==='hop'&&e.link==='cafe-relay'));assert(events.some(e=>e.kind==='mitm'&&e.packet.visual.node==='cafe-attacker'));
 const plain=new Simulation();web(plain);const inbound=s.net.mitm.logs.find(r=>r.kind==='http-response');const p=s.packets.get(inbound.packetId),q=[...plain.packets.values()].find(p=>p.kind==='http-response');assert.equal(p.ttl,q.ttl);
});

test('HTTP response is changed only at the attacker; server stays original and client waits for delivery',()=>{
 const s=attack('http');assert(s.start('web',{device:'cafe',address:'http://knihovna.test'}));until(s,()=>s.net.mitm.logs.some(r=>r.kind==='http-response'));
 assert.equal(s.net.browserFor('cafe').content,null);assert.notEqual(s.net.server.title,MITM_TITLE);const row=s.net.mitm.logs.find(r=>r.kind==='http-response');assert(row.changed);assert(row.before.includes(s.net.server.title));assert(row.after.includes(MITM_TITLE));finish(s);assert.equal(s.net.browserFor('cafe').content,MITM_TITLE);
});

test('Plain HTTP exposes the delivered form and library cookie at the on-path attacker',()=>{
 const s=attack();web(s);web(s,'http',{method:'POST',message:'Vzkaz od hosta: modrá kavárna.'});assert.equal(s.status,'success');assert.equal(s.net.server.lastRequest.message,'Vzkaz od hosta: modrá kavárna.');
 const row=s.net.mitm.logs.filter(r=>r.kind==='http-request').at(-1);assert(row.before.includes('Vzkaz od hosta: modrá kavárna.'));assert(row.before.includes('Cookie: navstevnik=v1'));assert(!row.protected);
});

test('Valid HTTPS protects form, cookie and response from HTTP replacement mode',()=>{
 const s=attack('http');web(s,'https');const original=s.net.browserFor('cafe').content;web(s,'https',{method:'POST',message:'TAJNY-VZKAZ-Z-KAVARNY'});
 assert.equal(s.status,'success');assert(s.net.browserFor('cafe').certificateVerified);assert.equal(s.net.browserFor('cafe').content,original);assert.equal(s.net.server.lastRequest.message,'TAJNY-VZKAZ-Z-KAVARNY');
 assert(!JSON.stringify(s.net.mitm.logs).includes('TAJNY-VZKAZ-Z-KAVARNY'));assert(!JSON.stringify(s.net.mitm.logs).includes('navstevnik=v1'));assert(s.net.mitm.logs.some(r=>r.kind==='tls-client-hello'&&r.before.includes('knihovna.test')));assert(s.net.mitm.logs.filter(r=>r.protection==='TLS').every(r=>!r.changed));
});

test('A fraudulent certificate is rejected before sending HTTP data and preserves the old client page',()=>{
 const s=attack();web(s,'https');const old=s.net.browserFor('cafe').content,last=s.net.server.lastRequest;s.mitm.configure(true,'certificate');web(s,'https',{method:'POST',message:'NESMI-ODEJIT'});
 assert.equal(s.status,'failed');assert.match(s.net.browserFor('cafe').error,/certifikát/);assert(!s.net.browserFor('cafe').certificateVerified);assert.equal(s.net.browserFor('cafe').content,old);assert.equal(s.net.server.lastRequest,last);assert(![...s.packets.values()].some(p=>p.kind==='https-request'));assert(s.net.mitm.logs.some(r=>r.kind==='tls-server-response'&&r.changed));
 s.mitm.configure(true,'observe');web(s,'https');assert.equal(s.status,'success');
});

test('Changing ciphertext is detected by TLS and never becomes a silently edited server request',()=>{
 const s=attack('tls');web(s,'https',{method:'POST',message:'CHRANENY-FORMULAR'});assert.equal(s.status,'failed');assert.match(s.net.browserFor('cafe').error,/integrity/);assert.equal(s.net.server.lastRequest,null);assert.equal(s.net.server.cookies.visitors.size,0);assert(!JSON.stringify(s.net.mitm.logs).includes('CHRANENY-FORMULAR'));assert(s.net.mitm.logs.some(r=>r.kind==='https-request'&&r.changed));
});

test('VPN hides inner HTTP, DNS and TLS from every cafe attack mode without a direct fallback',()=>{
 for(const mode of ['observe','http','certificate','tls']){
  const s=attack(mode);s.net.setVPN('cafe',true);web(s,'http',{method:'POST',message:'SKRYTO-VE-VPN'});assert.equal(s.status,'success',mode);assert.equal(s.net.browserFor('cafe').content,s.net.server.title);assert.equal(s.net.server.lastRequest.sourceIp,s.net.nodes.vpn.ip);
  assert(s.net.mitm.logs.length);assert(s.net.mitm.logs.every(r=>r.protection==='VPN'&&!r.before&&!r.changed));assert(!JSON.stringify(s.net.mitm.logs).includes('SKRYTO-VE-VPN'));assert(!JSON.stringify(s.net.mitm.logs).includes('knihovna.test'));
  s.net.toggleNode('vpn');web(s);assert.equal(s.status,'failed');assert(![...s.packets.values()].some(p=>p.kind==='http-request'&&p.location==='cafe-attacker'));
 }
});

test('A dead rogue hotspot never silently falls back; trusted Wi-Fi restores service with the attacker off',()=>{
 const s=attack();s.mitm.configure(false);assert(!s.net.accessReady('cafe'));web(s);assert.equal(s.status,'failed');assert.equal(s.net.access.cafe.hotspot,'rogue');s.net.setCafeHotspot('trusted');web(s);assert.equal(s.status,'success');
 s.mitm.configure(true);s.net.setCafeHotspot('rogue');s.net.toggleNode('cafe-attacker');web(s);assert.equal(s.status,'failed');s.net.setCafeHotspot('trusted');web(s);assert.equal(s.status,'success');
});

test('Other households are unaffected and the cafe sees no traffic that took another path',()=>{
 const s=attack('http');assert(s.start('web',{device:'laptop',address:'http://knihovna.test'}));finish(s);assert.equal(s.status,'success');assert.equal(s.net.browser.content,s.net.server.title);assert.equal(s.net.mitm.logs.length,0);
 s.net.toggleLink('cafe-uplink');assert(s.start('web',{device:'phone',address:'https://knihovna.test'}));finish(s);assert.equal(s.status,'success');assert.equal(s.net.mitm.logs.length,0);
});

test('Switching Wi-Fi during a transfer stops it; next transfer keeps cookies but bypasses the attacker',()=>{
 const s=attack();web(s);const cookie=structuredClone(s.net.browserFor('cafe').cookies.items);assert(s.start('web',{device:'cafe',address:'https://knihovna.test'}));until(s,()=>[...s.packets.values()].some(p=>p.state==='transit'));s.net.setCafeHotspot('trusted');s.connectionChanged('cafe');assert.equal(s.status,'failed');const count=s.net.mitm.logs.length;web(s);assert.equal(s.status,'success');assert.equal(s.net.mitm.logs.length,count);assert.deepEqual(s.net.browserFor('cafe').cookies.items,cookie);
});

test('Losing a relay after interception fails rather than inventing client delivery; retry and log bounds work',()=>{
 const s=attack('http');assert(s.start('web',{device:'cafe',address:'http://knihovna.test'}));until(s,()=>s.net.mitm.logs.some(r=>r.kind==='http-response'));s.net.toggleLink('cafe-twin');finish(s);assert.equal(s.status,'failed');assert.equal(s.net.browserFor('cafe').content,null);s.net.toggleLink('cafe-twin');assert(s.repeat());finish(s);assert.equal(s.status,'success');
 for(let i=0;i<11;i++)web(s);assert.equal(s.net.mitm.logs.length,20);assert.equal(new Set(s.net.mitm.logs.map(r=>r.packetId)).size,20);
});

test('Cafe mail and phishing use the same real path while their model TLS remains opaque to MITM',()=>{
 const s=attack('http');assert(s.start('phish-send',{device:'hacker',target:'cafe'}));finish(s);assert.equal(s.status,'success');assert(s.start('mail-check',{device:'cafe'}));finish(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.clients.cafe.inbox.to,'host@posta.test');
 assert(s.net.mitm.logs.every(r=>r.protection==='TLS'&&!r.before));const address=s.net.phishing.clients.cafe.inbox.link;assert(s.start('web',{device:'cafe',address,method:'POST',phishLogin:true}));finish(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.captures.size,1);assert(!JSON.stringify(s.net.mitm.logs).includes(DEMO_LOGIN.password));assert.equal(s.net.phishing.lastWeb.sourceIp,'192.0.2.69');
});
