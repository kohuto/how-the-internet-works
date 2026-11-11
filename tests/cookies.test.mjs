import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,WebCookies,requestText,responseText}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<4000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function run(s,{device='laptop',secure=false,...rest}={}){assert(s.start('web',{device,address:`${secure?'https':'http'}://knihovna.test`,...rest}));return finish(s);}
function until(s,condition){for(let i=0;i<4000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
const jar=(s,d='laptop')=>s.net.browserFor(d).cookies;
const visitor=(s,d='laptop')=>s.net.browserFor(d).visitor;
const packet=(s,kind)=>[...s.packets.values()].find(p=>p.kind===kind);

test('A visitor is created on server reception and the browser stores Set-Cookie only after the response is delivered',()=>{
 const s=new Simulation();assert(s.start('web'));until(s,()=>!!packet(s,'http-request'));
 assert.equal(s.net.server.cookies.visitors.size,0);assert.equal(jar(s).items.length,0);assert(!packet(s,'http-request').payload.cookie);
 until(s,()=>!!packet(s,'http-response'));assert.equal(s.net.server.cookies.visitors.size,1);assert.equal(jar(s).items.length,0);assert.equal(visitor(s),null);
 assert(responseText(packet(s,'http-response').payload).includes('Set-Cookie: navstevnik=v1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax'));
 finish(s);assert.equal(jar(s).items[0].value,'v1');assert.equal(visitor(s).loads,1);assert.equal(visitor(s).returning,false);
 run(s);assert.equal(packet(s,'http-request').payload.cookie,'navstevnik=v1');assert.equal(visitor(s).loads,2);assert(visitor(s).returning);
 const header=requestText(packet(s,'http-request').payload);assert(header.includes('Cookie: navstevnik=v1'));assert(!header.includes('Max-Age'));assert(!header.includes('HttpOnly'));assert(!header.includes('SameSite'));
});

test('All four browsers have separate cookies and DNS/page state, including two clients sharing the same NAT IP',()=>{
 const s=new Simulation();s.net.setAccess('phone','wifi');const ids=[];
 for(const device of ['laptop','phone','friend','cabin']){run(s,{device});assert.equal(s.status,'success');ids.push(visitor(s,device).id);assert.equal(visitor(s,device).loads,1);assert.equal(jar(s,device).items.length,1);}
 assert.equal(new Set(ids).size,4);const rows=[...s.net.server.cookies.visitors.values()];assert.equal(rows[0].lastIp,rows[1].lastIp);assert.notEqual(rows[0].id,rows[1].id);
 run(s,{device:'friend'});assert.equal(visitor(s,'friend').loads,2);assert.equal(visitor(s).loads,1);assert.notEqual(s.net.browserFor('friend'),s.net.browser);
});

test('Deleting browser cookies leaves the server and other browser untouched; the next visit creates a new ID',()=>{
 const s=new Simulation();run(s);const old=visitor(s).id;run(s,{device:'phone'});const phone=structuredClone(jar(s,'phone'));
 WebCookies.clear(jar(s));assert.equal(s.net.server.cookies.visitors.get(old).loads,1);assert.equal(jar(s).items.length,0);assert.deepEqual(jar(s,'phone'),phone);
 run(s);assert.notEqual(visitor(s).id,old);assert.equal(visitor(s).loads,1);assert.equal(s.net.server.cookies.visitors.get(old).loads,1);assert.equal(s.net.server.cookies.visitors.size,3);
});

test('Blocking cookies stops both sending and storing, preserves existing cookies, and does not stop the web',()=>{
 const s=new Simulation();run(s);const id=visitor(s).id;jar(s).allowed=false;
 for(let i=0;i<2;i++){run(s);assert.equal(s.status,'success');assert(!packet(s,'http-request').payload.cookie);assert.equal(visitor(s).returning,false);assert.notEqual(visitor(s).id,id);assert.equal(jar(s).items[0].value,id);assert.match(jar(s).receiveNote,/zakázané/);}
 jar(s).allowed=true;run(s);assert.equal(visitor(s).id,id);assert.equal(visitor(s).loads,2);
 WebCookies.clear(jar(s));jar(s).allowed=false;run(s);assert.equal(jar(s).items.length,0);assert.equal(s.status,'success');
});

test('Secure cookies are accepted and sent through HTTPS and neither sent nor overwritten through HTTP',()=>{
 const s=new Simulation();s.net.server.cookies.secureOnly=true;run(s);assert.equal(jar(s).items.length,0);assert.match(jar(s).receiveNote,/Secure.*HTTP/);
 run(s,{secure:true});assert.equal(jar(s).items.length,1);assert(jar(s).items[0].secure);const id=visitor(s).id;
 run(s);assert.equal(jar(s).lastSent,'');assert.equal(jar(s).items[0].value,id);assert(!packet(s,'http-request').payload.cookie);assert.notEqual(visitor(s).id,id);
 s.net.server.cookies.secureOnly=false;run(s);assert.equal(jar(s).items[0].value,id);assert(jar(s).items[0].secure);assert.match(jar(s).receiveNote,/přepsat/);
 s.net.server.cookies.secureOnly=true;run(s,{secure:true});assert.equal(visitor(s).id,id);assert.equal(visitor(s).loads,2);assert(jar(s).lastSent.includes(id));
});

test('The Secure switch affects the next received response and never retroactively changes a stored cookie',()=>{
 const s=new Simulation();run(s);const id=visitor(s).id;assert(!jar(s).items[0].secure);s.net.server.cookies.secureOnly=true;assert(!jar(s).items[0].secure);
 assert(s.start('web',{address:'https://knihovna.test'}));until(s,()=>s.current?.kind==='deliver'&&s.current.packet.kind==='https-response');assert(!jar(s).items[0].secure);
 finish(s);assert(jar(s).items[0].secure);assert.equal(jar(s).items[0].value,id);
});

test('Expiry uses a shared model clock, renews on received responses, and preserves server records',()=>{
 const s=new Simulation();run(s);const id=visitor(s).id;s.net.advanceCookieTime(3599);assert.equal(jar(s).items.length,1);run(s);assert.equal(visitor(s).id,id);assert.equal(jar(s).items[0].expiresAt,7199);
 run(s,{device:'phone'});const phone=visitor(s,'phone').id;s.net.advanceCookieTime(3600);assert.equal(s.net.cookieTime,7199);assert.equal(jar(s).items.length,0);assert.equal(jar(s,'phone').items.length,0);
 assert(s.net.server.cookies.visitors.has(id));assert(s.net.server.cookies.visitors.has(phone));run(s);assert.notEqual(visitor(s).id,id);assert.equal(visitor(s).loads,1);
});

test('Changing Wi-Fi, cellular, cable or VPN preserves identity even when the observed public IP changes',()=>{
 for(const device of ['laptop','phone','friend','cabin']){
 const s=new Simulation();run(s,{device});const id=visitor(s,device).id,oldIp=s.net.server.lastRequest.sourceIp;
 s.net.setAccess(device,device==='phone'?'wifi':device==='cabin'?'cable':'wifi');run(s,{device});assert.equal(visitor(s,device).id,id);assert.equal(visitor(s,device).loads,2);
 s.net.setVPN(device,true);run(s,{device});assert.equal(visitor(s,device).id,id);assert.equal(visitor(s,device).loads,3);assert.equal(s.net.server.lastRequest.sourceIp,s.net.nodes.vpn.ip);assert.notEqual(oldIp,s.net.server.lastRequest.sourceIp);
 }
});

test('A lost request creates no visitor and a lost reply does not install its cookie; retry creates a new record',()=>{
 const s=new Simulation();s.net.toggleLink('uplink');run(s);assert.equal(s.status,'failed');assert.equal(s.net.server.cookies.visitors.size,0);assert.equal(jar(s).items.length,0);
 s.net.toggleLink('uplink');assert(s.start('web'));until(s,()=>!!packet(s,'http-response'));const first=s.net.server.cookies.last.id;s.net.clearNat('home');finish(s);assert.equal(s.status,'failed');assert.equal(jar(s).items.length,0);assert.equal(visitor(s),null);
 run(s);assert.equal(s.status,'success');assert.notEqual(visitor(s).id,first);assert.equal(s.net.server.cookies.visitors.size,2);
});

test('TLS authentication/integrity failure cannot install or upgrade a cookie or process a corrupted request',()=>{
 for(const kind of ['https-request','https-response']){
 const s=new Simulation();run(s);const original=structuredClone(jar(s).items),loads=s.net.server.cookies.visitors.get('v1').loads;s.net.server.cookies.secureOnly=true;
 assert(s.start('web',{address:'https://knihovna.test'}));until(s,()=>!!packet(s,kind));packet(s,kind).payload.record.data[0]^=1;finish(s);
 assert.equal(s.status,'failed');assert.deepEqual(jar(s).items,original);assert.equal(visitor(s).loads,1);assert.equal(s.net.server.cookies.visitors.get('v1').loads,loads+(kind==='https-response'?1:0));
 }
 const s=new Simulation();s.net.server.certificate.valid=false;run(s,{secure:true});assert.equal(s.net.server.cookies.visitors.size,0);assert.equal(jar(s).items.length,0);
});

test('Cookies travel in readable HTTP headers and remain opaque inside TLS and the access-side VPN envelope',()=>{
 for(const secure of [false,true])for(const vpn of [false,true]){
 const s=new Simulation();run(s);if(vpn)s.net.setVPN('laptop',true);const events=run(s,{secure});assert.equal(s.status,'success');assert.equal(visitor(s).id,'v1');
 const application=packet(s,secure?'https-request':'http-request');if(secure){assert(application.payload.record);assert(!JSON.stringify(application.payload).includes('navstevnik'));}else assert(requestText(application.payload).includes('Cookie: navstevnik=v1'));
 if(vpn){const access=events.filter(e=>e.kind==='hop'&&e.link==='uplink');assert(access.length);assert(access.every(e=>!JSON.stringify(e.packet).includes('navstevnik')));const outside=events.find(e=>e.kind==='origin'&&e.node==='vpn'&&e.packet.kind===(secure?'https-request':'http-request'));assert(outside);if(!secure)assert.equal(outside.packet.payload.cookie,'navstevnik=v1');}
 }
});

test('The cookie is selected for the destination host/path and never sent in DNS or TLS negotiation',()=>{
 const s=new Simulation();run(s);const j=jar(s);assert.equal(WebCookies.header(j,{host:'cizi.test',secure:true},'/',0),'');assert.equal(WebCookies.header(j,{host:'knihovna.test',secure:true},'/vzkaz',0),'navstevnik=v1');
 assert(!WebCookies.receive(j,'navstevnik=v9; Domain=cizi.test; Path=/; Max-Age=3600',{host:'knihovna.test',secure:true},0));assert.equal(j.items[0].value,'v1');
 const e=run(s,{secure:true});assert(e.filter(e=>e.packet&&(e.packet.kind.startsWith('dns-')||e.packet.kind.startsWith('tls-'))).every(e=>!JSON.stringify(e.packet).includes('navstevnik')));
});

test('GET page loads and POST messages share visitor identity but have separate page-load and request counters',()=>{
 const s=new Simulation();run(s);run(s,{method:'POST',message:'Ahoj s cookie!'});assert.equal(visitor(s).id,'v1');assert.equal(visitor(s).loads,1);assert.equal(visitor(s).requests,2);assert.equal(s.net.browser.receipt,'Ahoj s cookie!');run(s);assert.equal(visitor(s).loads,2);assert.equal(visitor(s).requests,3);
});
