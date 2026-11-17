import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,webAddress,requestText}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<6000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function web(s,site='shop',device='laptop',extra={}){assert(s.start('web',{device,address:site==='shop'?'https://obchod.test/?tema=cyklistika':site==='news'?'https://zpravy.test':site,...extra}));return finish(s);}
function until(s,condition){for(let i=0;i<6000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
const c=(s,d='laptop')=>s.net.ads.clients[d],page=(s,d='laptop')=>s.net.browserFor(d).adPage;
const packets=(s,kind,target)=>[...s.packets.values()].filter(p=>p.kind===kind&&(!target||p.destination===target));

test('Three distinct domains and server addresses share an actual routed partner LAN',()=>{
 const s=new Simulation(),n=s.net;assert.equal(Object.keys(n.nodes).length,80);assert.equal(Object.keys(n.links).length,86);
 for(const [site,id] of [['obchod','shop'],['zpravy','news']]){const a=webAddress('https://'+site+'.test');assert.equal(a.server,id);assert.equal(n.dnsRecords[a.host],n.nodes[id].ip);assert.equal(n.ethernetFor(id,n.nodes.laptop.ip).frame.dst,n.nodes['partners-router'].mac);}
 assert.equal(n.dnsRecords['reklamy.test'],n.nodes.ads.ip);assert.equal(webAddress('obchod.test/?tema=hudba').path,'/?tema=hudba');assert(!webAddress('https://cizi.test'));assert(!webAddress('https://reklamy.test'));assert(!webAddress('https://obchod.test/?tema=hesla'));
});
test('A page arrives before a separate request to the ad server, which records interest only at its own processing step',()=>{
 const s=new Simulation();assert(s.start('web',{address:'https://obchod.test/?tema=cyklistika'}));until(s,()=>s.queue.some(e=>e.kind==='ads-prepare'));
 assert.equal(s.net.browser.pageType,'shop');assert.equal(page(s).ad,null);assert.equal(s.net.ads.profiles.size,0);assert.equal(c(s).cookie,null);assert.equal(packets(s,'https-request','ads').length,0);
 until(s,()=>s.queue.some(e=>e.kind==='ads-select'));assert.equal(s.net.ads.profiles.size,0);s.advance();assert.equal(s.net.ads.profiles.size,1);assert.equal(s.net.ads.profiles.get('r1').interests.cyklistika,1);assert.equal(page(s).ad,null);assert.equal(c(s).cookie,null);
 finish(s);assert.equal(s.status,'success');assert.equal(page(s).ad.topic,'cyklistika');assert.equal(c(s).cookie.value,'r1');assert.equal(c(s).cookie.sameSite,'None');assert(c(s).cookie.secure);assert.equal(s.net.browser.address,'https://obchod.test/?tema=cyklistika');
 const request=JSON.parse(s.webRequest.message);assert.deepEqual(request,{site:'obchod.test',context:'cyklistika',event:'prohlizeni',topic:'cyklistika'});assert.equal(s.webRequest.cookie,undefined);
});
test('A second unrelated website asks the same partner and displays a recommendation from the previously learned interest',()=>{
 const s=new Simulation();web(s);const events=web(s,'news');assert.equal(s.status,'success');assert.equal(s.net.browser.loadedHost,'zpravy.test');assert.equal(page(s).kind,'news');assert.equal(page(s).ad.topic,'cyklistika');assert(page(s).ad.personalized);assert.equal(s.net.ads.profiles.size,1);assert.equal(s.net.ads.profiles.get('r1').requests,2);assert.equal(s.net.ads.profiles.get('r1').events.at(-1).site,'zpravy.test');assert.equal(s.webRequest.cookie,'reklama_id=r1');assert.equal(JSON.parse(s.webRequest.message).topic,undefined);
 assert(events.some(e=>e.kind==='hop'&&e.link==='partners-uplink'));const targets=new Set(packets(s,'https-request').map(p=>p.destination));assert(targets.has('news')&&targets.has('ads'));assert.equal(s.current.title,'Reklama dorazila do prohlížeče');
});
test('Category visits change the server ranking, with a stable and explicit tie policy',()=>{
 const s=new Simulation();web(s);web(s,'https://obchod.test/?tema=hudba');assert.equal(page(s).ad.topic,'cyklistika');web(s,'https://obchod.test/?tema=hudba');web(s,'news');assert.equal(page(s).ad.topic,'hudba');assert.equal(s.net.ads.profiles.get('r1').interests.hudba,2);
});
test('Blocked linking sends neither an ID nor a tracking event, preserves old profiles and uses contextual ads',()=>{
 const s=new Simulation();web(s);const old=structuredClone(s.net.ads.profiles);s.ads.setAllowed('laptop',false);web(s,'news');assert.equal(s.webRequest.cookie,undefined);assert.equal(JSON.parse(s.webRequest.message).event,'kontextova-reklama');assert.equal(page(s).ad.topic,'obecna');assert.equal(page(s).ad.personalized,false);assert.deepEqual(s.net.ads.profiles,old);assert(c(s).cookie);
 web(s,'https://obchod.test/?tema=cestovani');assert.equal(page(s).ad.topic,'cestovani');assert(!page(s).ad.personalized);assert.deepEqual(s.net.ads.profiles,old);s.ads.setAllowed('laptop',true);web(s,'news');assert.equal(page(s).ad.topic,'cyklistika');
});
test('Deleting or expiring the ad cookie does not erase server profiles and prevents subsequent matching',()=>{
 const s=new Simulation();web(s);assert(s.ads.clear('laptop'));assert.equal(s.net.ads.profiles.size,1);web(s,'news');assert.equal(c(s).cookie.value,'r2');assert.equal(page(s).ad.topic,'obecna');assert.equal(s.net.ads.profiles.get('r1').interests.cyklistika,1);
 s.net.advanceCookieTime(3600);assert.equal(c(s).cookie,null);web(s,'news');assert.equal(c(s).cookie.value,'r3');assert.equal(page(s).ad.personalized,false);assert.equal(s.net.ads.profiles.size,3);
});
test('A new browser receives a general ad and cannot inherit another browser profile even behind the same NAT',()=>{
 const s=new Simulation();web(s);s.net.setAccess('phone','wifi');web(s,'news','phone');assert.equal(c(s,'phone').cookie.value,'r2');assert(!page(s,'phone').ad.personalized);assert.notEqual(c(s).cookie.value,c(s,'phone').cookie.value);assert.equal(s.net.ads.profiles.get('r1').lastIp,s.net.ads.profiles.get('r2').lastIp);assert.equal(page(s).ad.topic,'cyklistika');
});
test('Library credentials and visitor cookies do not leak to either partner site or the ad server',()=>{
 const s=new Simulation();web(s,'https://knihovna.test');const visitor=structuredClone(s.net.browser.cookies.items);const session=s.net.browser.cookies.session.value;
 const events=web(s);for(const p of packets(s,'https-request')){if(p.destination==='ads')continue;const origin=events.find(e=>e.packet?.id===p.id&&e.kind==='origin');assert(origin);}assert.equal(s.webRequest.cookie,undefined);assert(!requestText(s.webRequest).includes(session));assert(!requestText(s.webRequest).includes('navstevnik'));
 web(s,'news');assert.equal(s.webRequest.cookie,'reklama_id=r1');assert.deepEqual(s.net.browser.cookies.items,visitor);web(s,'https://knihovna.test');assert(!requestText(s.webRequest).includes('reklama_id'));assert(requestText(s.webRequest).includes('library_session='+session));
});
test('An unavailable ad service leaves the freshly loaded main page available without inventing a banner',()=>{
 for(const kind of ['server','link']){const s=new Simulation();if(kind==='server')s.net.nodes.ads.on=false;else s.net.toggleLink('ads-server');web(s);assert.equal(s.status,'failed');assert.equal(s.net.browser.pageType,'shop');assert.equal(s.net.browser.state,'ready');assert.equal(page(s).state,'error');assert.equal(page(s).ad,null);assert.equal(s.net.ads.profiles.size,0);assert.equal(c(s).cookie,null);}
});
test('A lost ad reply leaves the server interest committed but does not install a cookie or banner',()=>{
 const s=new Simulation();assert(s.start('web',{address:'https://obchod.test'}));until(s,()=>!!s.net.ads.last);s.net.clearNat('home');finish(s);assert.equal(s.status,'failed');assert.equal(s.net.ads.profiles.size,1);assert.equal(c(s).cookie,null);assert.equal(page(s).ad,null);assert.equal(page(s).state,'error');web(s);assert.equal(s.status,'success');assert.equal(s.net.ads.profiles.size,2);assert.equal(c(s).cookie.value,'r2');
});
test('Main site failure triggers no partner request and a failed new page preserves the previous snapshot',()=>{
 const s=new Simulation();web(s);const old=structuredClone(page(s));s.net.nodes.news.on=false;web(s,'news');assert.equal(s.status,'failed');assert.deepEqual(page(s),old);assert.equal(packets(s,'https-request','ads').length,0);assert.equal(s.net.ads.profiles.get('r1').requests,1);
});
test('TLS validates each distinct endpoint and corrupted ad requests or replies cannot update the wrong side',()=>{
 for(const kind of ['certificate','request','response']){const s=new Simulation();if(kind==='certificate')s.net.ads.certificates.ads.valid=false;assert(s.start('web',{address:'https://obchod.test'}));if(kind!=='certificate'){until(s,()=>packets(s,'https-'+kind,kind==='request'?'ads':'laptop').some(p=>p.source===(kind==='request'?'laptop':'ads')));const p=packets(s,'https-'+kind).find(p=>p.source===(kind==='request'?'laptop':'ads')&&p.destination===(kind==='request'?'ads':'laptop'));p.payload.record.data[0]^=1;}finish(s);assert.equal(s.status,'failed');assert.equal(s.net.ads.profiles.size,kind==='response'?1:0);assert.equal(c(s).cookie,null);assert.equal(page(s).ad,null);assert.equal(s.net.browser.state,'ready');}
});
test('HTTP main sites still use a separate HTTPS connection to the advertising partner',()=>{
 const s=new Simulation();web(s,'http://obchod.test');assert.equal(s.status,'success');assert(packets(s,'http-request','shop').length);assert.equal(packets(s,'http-request','ads').length,0);assert(packets(s,'https-request','ads').length);assert.equal(s.net.browser.loadedSecure,false);assert.equal(s.net.browser.address,'http://obchod.test');
});
test('The cafe observer cannot read tracking identifiers, categories or selected ads protected by HTTPS',()=>{
 const s=new Simulation();s.mitm.configure(true,'observe');s.net.setCafeHotspot('rogue');web(s,'shop','cafe');web(s,'news','cafe');assert.equal(s.status,'success');assert.equal(page(s,'cafe').ad.topic,'cyklistika');assert(s.net.mitm.logs.length);const wire=JSON.stringify(s.net.mitm.logs);assert(!wire.includes('reklama_id'));assert(!wire.includes('cyklistika'));assert(!wire.includes('Kolo pro tvoje'));assert(s.net.mitm.logs.every(r=>r.protection==='TLS'||r.kind.startsWith('dns-')||r.kind==='tls-client-hello'));
});
test('Wi-Fi, data, satellite and VPN preserve the independent advertising cookie and stay within MTU',()=>{
 const s=new Simulation();for(const device of ['laptop','phone','cabin','friend']){if(device==='laptop')s.net.setAccess(device,'wifi');const events=web(s,'shop',device);assert.equal(s.status,'success');const id=c(s,device).cookie.value;s.net.setVPN(device,true);const vpn=web(s,'news',device);assert.equal(s.status,'success');assert.equal(c(s,device).cookie.value,id);assert(page(s,device).ad.personalized);assert(vpn.some(e=>e.packet?.kind==='vpn-outbound'));assert.equal(s.net.ads.profiles.get(id).lastIp,s.net.nodes.vpn.ip);if(device==='cabin')assert(events.some(e=>e.kind==='hop'&&s.net.links[e.link]?.medium==='satellite'));for(const p of s.packets.values())if(p.payload.record)assert(p.payload.record.data.length+40<=1500);}
});

test('The HTTP cafe modification reaches the main site title while the separate HTTPS advertisement remains intact',()=>{
 const s=new Simulation();s.mitm.configure(true,'http');s.net.setCafeHotspot('rogue');web(s,'http://obchod.test','cafe');assert.equal(s.status,'success');assert.equal(s.net.browserFor('cafe').content,globalThis.InternetLab.MITM_TITLE);assert.equal(page(s,'cafe').ad.topic,'cyklistika');assert(s.net.mitm.logs.some(r=>r.kind==='http-response'&&r.changed));assert(s.net.mitm.logs.filter(r=>r.kind==='https-response').every(r=>r.protection==='TLS'&&!r.changed));
});
