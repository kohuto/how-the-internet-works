import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,WebCookies,requestText,responseText}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<5000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function web(s,device='laptop',extra={}){assert(s.start('web',{device,address:'https://knihovna.test',...extra}));return finish(s);}
const privacy=(s,op='read',device='laptop')=>web(s,device,{privacyOp:op});
const account=(s,id='ctenar-1')=>s.net.server.privacy.accounts.get(id);
const client=(s,device='laptop')=>s.net.server.privacy.clients[device];
const packet=(s,kind)=>[...s.packets.values()].find(p=>p.kind===kind);
function until(s,predicate){for(let i=0;i<5000&&s.status==='running'&&!predicate();i++)s.advance();assert(predicate());}

test('A GDPR read is an authenticated ordinary HTTPS exchange and updates the client only after arrival',()=>{
 const s=new Simulation();web(s);assert.equal(client(s).snapshot,null);assert(s.start('web',{address:'https://knihovna.test',privacyOp:'read'}));
 until(s,()=>!!packet(s,'https-response'));assert.equal(client(s).snapshot,null);assert.equal(s.webRequest.path,'/soukromi/udaje');assert.equal(s.webRequest.method,'GET');assert.match(requestText(s.webRequest),/Cookie: .*library_session=[a-f0-9]{64}/);finish(s);
 assert.equal(s.status,'success');assert.equal(client(s).snapshot.profile.name,'Alex Lipovský');assert.equal(client(s).snapshot.visits.length,1);assert.equal(client(s).snapshot.browserRecords,1);assert(packet(s,'https-response').payload.record);
});
test('The returned data is a server-time snapshot, not a live view into the server',()=>{
 const s=new Simulation();assert(s.start('web',{address:'https://knihovna.test',privacyOp:'read'}));until(s,()=>!!packet(s,'https-response'));account(s).profile.name='Pozdější úprava';finish(s);assert.equal(client(s).snapshot.profile.name,'Alex Lipovský');privacy(s);assert.equal(client(s).snapshot.profile.name,'Pozdější úprava');
});
test('A missing login returns a refusal over HTTPS without leaking another snapshot or changing server data',()=>{
 const s=new Simulation();web(s);privacy(s);const old=structuredClone(client(s).snapshot),before=structuredClone(account(s));s.net.browser.cookies.session=null;privacy(s,'erase');assert.equal(s.status,'success');assert.equal(s.webReply.status,401);assert.equal(client(s).state,'error');assert.deepEqual(client(s).snapshot,old);assert.deepEqual(account(s),before);assert(!responseText(s.webReply).includes('Alex Lipovský'));assert.equal(s.current.title,'Server žádost odmítl');
});
test('Erasure commits on decrypted server reception; a confirmation reaches the device separately',()=>{
 const s=new Simulation();web(s);privacy(s);const jar=structuredClone(s.net.browser.cookies.items);assert(s.start('web',{address:'https://knihovna.test',privacyOp:'erase'}));
 until(s,()=>!!packet(s,'https-request'));assert(account(s).profile);assert.equal(client(s).receipt,null);
 until(s,()=>account(s).erased);assert.equal(account(s).profile,null);assert.equal(account(s).visits.length,0);assert.equal(s.net.server.cookies.visitors.size,0);assert.equal(s.net.server.cookies.last,null);assert.equal(s.net.server.lastRequest,null);assert(client(s).snapshot.profile);assert.equal(client(s).receipt,null);
 finish(s);assert.equal(client(s).snapshot,null);assert(client(s).receipt.ok);assert.equal(client(s).receipt.removed.visits,1);assert.deepEqual(s.net.browser.cookies.items,jar);assert.equal(client(s).receipt.retained.holder,'Alex Lipovský');
});
test('Retention keeps only a separate minimal document; turning the prepared obligation off allows full model erasure',()=>{
 for(const hold of [true,false]){const s=new Simulation();assert(s.privacy.setHold('ctenar-1',hold));privacy(s,'erase');assert.equal(account(s).profile,null);assert.equal(!!account(s).document,hold);assert.equal(!!client(s).receipt.retained,hold);assert(!s.privacy.setHold('ctenar-1',!hold));privacy(s);assert.equal(client(s).snapshot.erased,true);assert.equal(!!client(s).snapshot.retained,hold);if(hold)assert(!JSON.stringify(account(s).document).includes('alex@gmail.com'));}
});
test('Deleting cookies changes only local identifiers and does not erase account data or server visits',()=>{
 const s=new Simulation();web(s);const old=structuredClone(account(s).profile),cookie=s.net.browser.cookies.items[0].value;WebCookies.clear(s.net.browser.cookies);assert(s.net.server.cookies.visitors.has(cookie));assert.deepEqual(account(s).profile,old);assert.equal(account(s).visits.length,1);privacy(s);assert.equal(s.webReply.status,401);assert.equal(client(s).snapshot,null);assert.deepEqual(account(s).profile,old);assert.equal(s.net.browser.cookies.items.length,0);
});
test('Notebook, phone and cabin share a reader; other accounts and locally cached data stay independent',()=>{
 const s=new Simulation();for(const d of ['laptop','phone','cabin','friend','cafe']){if(d==='cafe')assert(s.net.setCafeHotspot('trusted',s.net.cafeWifi.password));web(s,d);privacy(s,'read',d);}assert.equal(account(s).visitorIds.size,3);const friend=structuredClone(account(s,'ctenar-2')),host=structuredClone(account(s,'ctenar-3'));privacy(s,'erase');
 assert.equal(account(s).visitorIds.size,0);assert.equal(account(s).visits.length,0);assert.deepEqual(account(s,'ctenar-2'),friend);assert.deepEqual(account(s,'ctenar-3'),host);assert.equal(s.net.server.cookies.visitors.size,2);assert(client(s,'phone').snapshot.profile);privacy(s,'read','phone');assert.equal(client(s,'phone').snapshot.profile,null);
});
test('Privacy reads and subsequent authenticated page loads do not recreate erased profiles, histories or tracking records',()=>{
 const s=new Simulation();web(s);privacy(s,'erase');const revision=account(s).revision;for(let i=0;i<3;i++){privacy(s);assert.equal(client(s).snapshot.profile,null);web(s);}assert.equal(account(s).revision,revision);assert.equal(account(s).visits.length,0);assert.equal(s.net.server.cookies.visitors.size,0);assert.equal(s.net.server.lastRequest,null);assert.equal(s.status,'success');
});
test('An anonymous browser record can be associated by a later authenticated request, without cookie-based account authentication',()=>{
 const s=new Simulation();web(s,'laptop',{address:'http://knihovna.test'});assert.equal(account(s).visitorIds.size,0);assert.equal(s.net.server.cookies.visitors.size,1);privacy(s);assert.equal(client(s).snapshot.browserRecords,1);
 const noLogin=s.privacy.handle({path:'/soukromi/udaje',method:'GET',cookie:'navstevnik=v1'},true);assert.equal(noLogin.status,401);privacy(s,'erase');assert.equal(s.net.server.cookies.visitors.size,0);
});
test('The service selects the account from a valid session cookie and rejects missing auth, HTTP, wrong methods or malformed requests',()=>{
 const s=new Simulation(),p=s.privacy;const read={path:'/soukromi/udaje',method:'GET',cookie:'library_session='+s.net.browserFor('friend').cookies.session.value};
 assert.equal(p.handle(read,true).privacy.snapshot.account,'ctenar-2');assert.equal(p.handle({...read,cookie:'library_session=invalid'},true).status,401);assert.equal(p.handle(read,false).status,403);assert.equal(p.handle({...read,method:'POST'},true).status,400);
 assert.equal(p.handle({...read,path:'/soukromi/vymaz',method:'POST',message:'broken'},true).status,400);assert.equal(p.handle({...read,path:'/soukromi/vymaz',method:'POST',message:'{}'},true).status,400);
 p.handle({...read,path:'/soukromi/vymaz',method:'POST',message:JSON.stringify({requestId:'vymaz-1',account:'ctenar-1'})},true);assert(account(s,'ctenar-2').erased);assert(!account(s).erased);
 for(const extra of [{address:'http://knihovna.test'},{address:'https://knihovna-podpora.test'},{privacyOp:'all'},{device:'hacker'}])assert(!s.start('web',{address:'https://knihovna.test',privacyOp:'read',...extra}));
});
test('A failed request leaves server data intact and preserves an explicitly stale client copy',()=>{
 const s=new Simulation();web(s);privacy(s);const before=structuredClone(account(s));s.net.toggleLink('uplink');privacy(s,'erase');assert.equal(s.status,'failed');assert.deepEqual(account(s),before);assert(client(s).snapshot.profile);assert.equal(client(s).receipt,null);assert.equal(client(s).state,'error');
});
test('A lost erasure reply leaves server changes committed; repeating the same request is idempotent',()=>{
 const s=new Simulation();web(s);privacy(s);assert(s.start('web',{address:'https://knihovna.test',privacyOp:'erase'}));until(s,()=>account(s).erased);const revision=account(s).revision,id=s.action.payload.privacyRequestId;s.net.clearNat('home');finish(s);assert.equal(s.status,'failed');assert.equal(client(s).receipt,null);assert(client(s).snapshot.profile);
 assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(client(s).receipt.requestId,id);assert.equal(client(s).receipt.removed.visits,1);assert.equal(account(s).revision,revision);assert.equal(s.net.server.privacy.requests.size,1);privacy(s);assert.equal(client(s).snapshot.profile,null);
});
test('Certificate or request integrity failure cannot erase; a corrupted response cannot update the local view',()=>{
 for(const kind of ['certificate','https-request','https-response']){const s=new Simulation();web(s);privacy(s);if(kind==='certificate')s.net.server.certificate.valid=false;assert(s.start('web',{address:'https://knihovna.test',privacyOp:'erase'}));if(kind!=='certificate'){until(s,()=>!!packet(s,kind));packet(s,kind).payload.record.data[0]^=1;}finish(s);assert.equal(s.status,'failed');assert.equal(account(s).erased,kind==='https-response');assert.equal(client(s).receipt,null);assert(client(s).snapshot.profile);}
});
test('Private profile responses are opaque on the wire and remain protected through the cafe observer and VPN',()=>{
 const s=new Simulation();s.mitm.configure(true,'http');s.net.setCafeHotspot('rogue');web(s,'cafe');const e=privacy(s,'read','cafe');assert.equal(s.status,'success');assert.equal(client(s,'cafe').snapshot.profile.name,'Host Kavárenský');assert(s.net.mitm.logs.length);assert(!JSON.stringify(s.net.mitm.logs).includes('Host Kavárenský'));assert(e.filter(x=>x.kind==='hop').every(x=>!JSON.stringify(x.packet).includes('Host Kavárenský')));
 s.net.setVPN('cafe',true);const v=privacy(s,'erase','cafe');assert.equal(s.status,'success');assert(account(s,'ctenar-3').erased);assert(v.some(x=>x.packet?.kind==='vpn-outbound'));assert(v.filter(x=>x.kind==='hop'&&x.link==='cafe-twin').every(x=>x.packet.kind.startsWith('vpn-')));
});
test('The bounded history shows actual observed IPs and the protected overview stays within the model MTU',()=>{
 const s=new Simulation();for(let i=0;i<5;i++)web(s);s.net.setVPN('laptop',true);web(s);privacy(s);const snap=client(s).snapshot;assert.equal(snap.visits.length,3);assert.equal(snap.visits.at(-1).ip,s.net.nodes.vpn.ip);const p=packet(s,'https-response');assert(p.payload.record.data.length+40<=1500,`size ${p.payload.record.data.length+40}`);assert(responseText(s.webReply).includes('Alex Lipovský'));
});
