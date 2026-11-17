import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/browser-navigation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,BrowserNavigation,WebCookies}=globalThis.InternetLab;
function setup(){const sim=new Simulation();return {sim,net:sim.net,nav:new BrowserNavigation(sim.net)};}
function visit(sim,nav,address,device='laptop',extra={}){
  assert(sim.start('web',{device,address,...extra}));nav.sync(sim);
  for(let i=0;i<6000&&sim.status==='running';i++){sim.advance();nav.sync(sim);}
  assert.equal(sim.status,'success');return sim.net.browserFor(device);
}
test('A new browser starts on an empty tab without discarding its shared cookies or DNS',()=>{
  const sim=new Simulation(),b=sim.net.browser,cookies=b.cookies,dns=b.dnsCache;dns['example.test']='192.0.2.10';
  const nav=new BrowserNavigation(sim.net);
  assert.equal(nav.active('laptop').url,'');assert.equal(b.content,null);assert.equal(b.state,'idle');
  assert.equal(b.cookies,cookies);assert.equal(b.dnsCache,dns);assert.equal(b.dnsCache['example.test'],'192.0.2.10');assert.equal(sim.run,0);
});
test('Tabs restore separate library and advertising documents while sharing device cookies',()=>{
  const {sim,net,nav}=setup();visit(sim,nav,'https://knihovna.test');
  const library=nav.active('laptop').id,title=net.browser.content,cookies=net.browser.cookies,dns=net.browser.dnsCache;
  nav.active('laptop').draft='https://knihovna.test/';assert(nav.add('laptop'));const shop=nav.active('laptop').id;
  assert.equal(net.browser.content,null);visit(sim,nav,'https://obchod.test/?tema=cyklistika');
  assert.equal(net.browser.adPage.state,'ready');assert.equal(net.browser.pageType,'shop');
  assert(nav.select('laptop',library));assert.equal(net.browser.content,title);assert.equal(net.browser.pageType,'library');assert.equal(net.browser.adPage,undefined);
  assert.equal(net.browser.cookies,cookies);assert.equal(net.browser.dnsCache,dns);assert(dns['obchod.test']);
  WebCookies.clear(cookies);assert(nav.select('laptop',shop));assert.equal(net.browser.cookies.items.length,0);assert.equal(net.browser.cookies.session,null);
  assert.equal(net.browser.adPage.state,'ready');assert.equal(net.browser.adPage.ad.topic,'cyklistika');
});
test('History requests a fresh response and a new navigation removes only forward entries',()=>{
  const {sim,net,nav}=setup();visit(sim,nav,'https://knihovna.test');visit(sim,nav,'https://obchod.test');
  assert.deepEqual(nav.active('laptop').history,['https://knihovna.test/','https://obchod.test/']);
  net.server.title='Nová serverová odpověď';net.server.revision++;
  const back=nav.travel('laptop',-1);assert.equal(back,'https://knihovna.test/');visit(sim,nav,back);
  assert.equal(net.browser.content,'Nová serverová odpověď');assert.equal(nav.active('laptop').history.length,2);assert.equal(nav.active('laptop').index,0);
  assert([...sim.packets.values()].some(p=>p.kind==='https-request'));
  visit(sim,nav,'https://zpravy.test');assert.deepEqual(nav.active('laptop').history,['https://knihovna.test/','https://zpravy.test/']);assert.equal(nav.travel('laptop',1),null);
});
test('A pending transfer cannot lose its target tab through switching, adding or closing',()=>{
  const {sim,net,nav}=setup();nav.add('laptop');const active=nav.active('laptop').id,other=nav.state('laptop').tabs[0].id;
  assert(sim.start('web',{address:'https://knihovna.test',device:'laptop'}));nav.sync(sim);
  assert.equal(nav.select('laptop',other,true),false);assert.equal(nav.add('laptop',true),false);assert.equal(nav.close('laptop',active,true),false);
  for(let i=0;i<1000&&sim.status==='running';i++){sim.advance();nav.sync(sim);}
  assert.equal(nav.active('laptop').id,active);assert.equal(net.browser.pageType,'library');assert.equal(nav.active('laptop').loadedUrl,'https://knihovna.test/');
});
test('Closing a background tab preserves the current document; closing the last leaves a fresh tab',()=>{
  const {sim,net,nav}=setup();visit(sim,nav,'https://knihovna.test');const first=nav.active('laptop').id,cookies=net.browser.cookies;
  nav.add('laptop');visit(sim,nav,'http://knihovna.test');const current=nav.active('laptop').id;
  assert(nav.close('laptop',first));assert.equal(nav.active('laptop').id,current);assert.equal(net.browser.loadedSecure,false);
  assert(nav.close('laptop',current));assert.equal(nav.state('laptop').tabs.length,1);assert.equal(nav.active('laptop').url,'');assert.equal(net.browser.content,null);assert.equal(net.browser.cookies,cookies);
});
test('Each device has its own tabs, cookies and drafts',()=>{
  const {sim,net,nav}=setup();visit(sim,nav,'https://knihovna.test');const laptop=nav.active('laptop').id;
  nav.active('laptop').draft='http://knihovna.test/';nav.add('laptop');visit(sim,nav,'https://zpravy.test','phone');
  assert.equal(nav.state('phone').tabs.length,1);assert.equal(nav.state('laptop').tabs.length,2);assert.notEqual(net.phoneBrowser.cookies,net.browser.cookies);
  nav.select('laptop',laptop);assert.equal(nav.active('laptop').draft,'http://knihovna.test/');assert.equal(net.browser.pageType,'library');assert.equal(net.phoneBrowser.pageType,'news');
});
test('Switching tabs restores the actual protocol and verification state',()=>{
  const {sim,net,nav}=setup();visit(sim,nav,'https://knihovna.test');const secure=nav.active('laptop').id;
  nav.add('laptop');visit(sim,nav,'http://knihovna.test');assert.equal(net.browser.certificateVerified,false);
  nav.select('laptop',secure);assert.equal(net.browser.loadedSecure,true);assert.equal(net.browser.certificateVerified,true);assert.equal(net.browser.secure,true);
});
test('POST forms and reloads preserve the site section and do not duplicate history',()=>{
  const {sim,nav}=setup();visit(sim,nav,'https://knihovna.test');nav.active('laptop').page='message';
  visit(sim,nav,'https://knihovna.test','laptop',{method:'POST',message:'Pozdrav knihovně'});
  assert.equal(nav.active('laptop').page,'message');assert.equal(nav.active('laptop').history.length,1);
  visit(sim,nav,'https://knihovna.test','laptop',{browserReload:true});assert.equal(nav.active('laptop').page,'message');assert.equal(nav.active('laptop').history.length,1);
});
