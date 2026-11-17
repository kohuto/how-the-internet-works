import '../js/network.js';
import '../js/settings.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/privacy.js';
import '../js/auth.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';
import '../js/mail.js';
import '../js/ads.js';
import '../js/simulation.js';
import '../js/browser-navigation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,Simulation,LabSettings,LAB_FEATURES,BrowserNavigation,requestText,responseText}=globalThis.InternetLab;
const network=features=>new Network(new LabSettings({features}));
function finish(sim,expected='success') {
  const events=[];
  for(let i=0;sim.status==='running'&&i<1500;i++){sim.advanceFrame();events.push(...sim.frame);}
  assert.equal(sim.status,expected,sim.current?.description);
  return events;
}
test('The base is a usable web network without optional hosts or DNS transfers',()=>{
  const net=network([]),sim=new Simulation(net);
  assert.deepEqual(net.visibleNodes().map(n=>n.id).sort(),['laptop','switch','home','edge','north','south','dc','dc-switch','web','hosting-web-2','hosting-web-3','hosting-router','transit-f','transit-v'].sort());
  assert.equal(net.visibleLinks().length,15);
  assert.deepEqual(net.dnsRecords,{'knihovna.test':'203.0.113.10'});
  assert.deepEqual(net.mailMXRecords,{});
  assert.equal(net.appAvailable('web','laptop'),true);
  for(const app of ['print','mail','message','cloud','chatbot'])assert.equal(net.appAvailable(app,'laptop'),false);
  sim.start('web',{address:'https://knihovna.test/'});const events=finish(sim);
  assert.equal(net.browser.content,net.server.title);
  assert.equal(net.browser.address,'http://knihovna.test/');
  assert.equal(net.browser.loadedSecure,false);
  assert.deepEqual([...sim.packets.values()].map(p=>p.kind),['http-request','http-response']);
  assert(!events.some(e=>e.packet?.kind.startsWith('dns-')));
  assert.deepEqual(net.browser.dnsCache,{},'Prepared addresses are not fabricated DNS replies');
  assert.deepEqual(events.find(e=>e.kind==='switch').decision.ports,['p3']);
  assert(net.nodes.switch.macTable[net.nodes.laptop.mac]);
  assert(net.nodes.home.routes.length>0);
  assert(net.nat.home.rows.length>0,'NAT still operates with its display disabled');
  assert(Object.values(net.settings.details).every(v=>!v));
});
test('Dependencies are added transitively and stay enabled until their dependents are removed',()=>{
  let settings=new LabSettings({features:['mobile','instagram','hacker','replica','ads']});
  for(const id of ['phone','friend','mail','phishing','cloud','shop','news','tls','cookies'])assert(settings.has(id),id);
  assert(!settings.has('wifi'),'Mobile-only phone does not require home Wi-Fi');
  assert.deepEqual(new LabSettings({features:['phone']}).requiredBy('wifi').map(f=>f.id),['phone']);
  settings=settings.toggle('mobile',false);
  assert(!settings.has('phone'));assert(!settings.has('wifi'));
  settings=settings.toggle('replica',false);assert(!settings.has('cloud'));
  const restored=new LabSettings(settings.toJSON());
  assert.deepEqual([...restored.enabled].sort(),[...settings.enabled].sort());
  assert.equal(new LabSettings().enabled.size,0,'A fresh session always starts from base');
});
test('Explicit selections survive removal of the feature that also required them',()=>{
  let settings=new LabSettings({features:['wifi','phone']});
  settings=settings.toggle('phone',false);
  assert(settings.has('wifi'));assert(!settings.has('phone'));
});
test('Every optional area can stand alone with its dependencies; all restores the complete map',()=>{
  for(const f of LAB_FEATURES){
    const net=network([f.id]);
    for(const l of net.visibleLinks()){assert(net.nodeAvailable(l.a));assert(net.nodeAvailable(l.b));}
    for(const n of Object.values(net.nodes))if(!net.nodeAvailable(n.id)){
      assert(net.adjacent(n.id).length===0,`${f.id}: hidden node ${n.id} has no usable links`);
      assert(Object.values(net.links).filter(l=>l.a===n.id||l.b===n.id).every(l=>!net.isActive(l)));
    }
  }
  const net=new Network(LabSettings.full());
  assert.equal(net.visibleNodes().length,87);assert.equal(net.visibleLinks().length,104);
});
test('Phone Wi-Fi and mobile access only offer enabled connections',()=>{
  const wifi=network(['phone']);
  assert.equal(wifi.access.phone.mode,'wifi');assert(wifi.accessReady('phone'));
  assert.equal(wifi.setAccess('phone','cellular','bts-park'),false);
  assert.equal(network([]).setAccess('laptop','wifi'),false);
  const mobile=network(['mobile']);assert.equal(mobile.access.phone.mode,'cellular');assert(mobile.accessReady('phone'));
  for(const net of [wifi,mobile]){const sim=new Simulation(net);sim.start('web',{device:'phone',address:'https://knihovna.test/'});finish(sim);assert(net.phoneBrowser.content);}
});
test('Satellite, Instagram, printing and two-provider mail work as individual additions',()=>{
  for(const [features,type,payload] of [
    [['satellite'],'web',{device:'cabin',address:'https://knihovna.test/'}],
    [['instagram'],'message',{device:'laptop',text:'Ahoj!'}],
    [['printer'],'print',{document:'Ukázka.pdf'}],
    [['mail-b'],'mail-send',{device:'laptop',target:'friend',subject:'Pozdrav',body:'Ahoj!'}]
  ]){const sim=new Simulation(network(features));assert(sim.start(type,payload));finish(sim);}
});
test('Hidden services cannot be started through simulation controls',()=>{
  const sim=new Simulation(network([]));
  for(const [type,payload] of [['print',{}],['message',{text:'Ahoj'}],['chatbot',{prompt:'Ahoj'}],['replicate',{}],['mail-check',{device:'laptop'}],['web',{device:'friend'}]])assert.equal(sim.start(type,payload),false,type);
  assert.equal(sim.net.setVPN('laptop',true),false);
  assert.equal(sim.net.toggleNode('hacker'),false);
});
test('An independent partner website loads without making hidden advertising requests',()=>{
  const sim=new Simulation(network(['shop']));sim.start('web',{address:'https://obchod.test/'});const events=finish(sim);
  assert.equal(sim.net.browser.pageType,'shop');assert.equal(sim.net.browser.adPage.state,'disabled');
  assert.equal(sim.net.ads.requests,0);
  assert(!events.some(e=>e.packet?.destination==='ads'));
});
test('Showing details changes no forwarding, data delivery or address translation',()=>{
  const settings=new LabSettings(),net=new Network(settings),sim=new Simulation(net);
  sim.start('web',{address:'http://knihovna.test/'});const first=finish(sim).filter(e=>e.kind==='hop').map(e=>[e.from,e.to]);
  settings.details={mac:true,routes:true,nat:true,ttl:true,headers:true};
  const same=new Network(settings),second=new Simulation(same);second.start('web',{address:'http://knihovna.test/'});
  assert.deepEqual(finish(second).filter(e=>e.kind==='hop').map(e=>[e.from,e.to]),first);
  assert.deepEqual(same.nat.home.rows,net.nat.home.rows);
});
test('Without DNS, normal domain URLs still deliver HTTP, HTTPS and forms, also through VPN',()=>{
  for(const features of [[],['vpn']])for(const protocol of ['http','https']){
    const net=network([...features,...(protocol==='https'?['tls']:[])]),sim=new Simulation(net);
    if(features.includes('vpn'))assert(net.setVPN('laptop',true));
    assert(sim.start('web',{address:`${protocol}://knihovna.test/`,method:'POST',message:'Pozdrav knihovně'}));
    assert.notEqual(net.browser.tlsPhase,'dns');
    finish(sim);
    assert.equal(net.browser.content,net.server.title);
    assert.equal(net.browser.receipt,'Pozdrav knihovně');
    assert.equal(net.browser.loadedSecure,protocol==='https');
    assert(![...sim.packets.values()].some(p=>p.kind.startsWith('dns-')));
    assert(!net.nodeAvailable('dns'));assert(!net.linkAvailable(net.links['dns-switch']));
    assert.deepEqual(net.browser.dnsCache,{});
  }
});
test('Enabling DNS restores cold lookups and learned cache; a powered-off DNS server is not bypassed',()=>{
  const net=network(['dns','tls']),sim=new Simulation(net);
  assert(net.nodeAvailable('dns'));assert.equal(net.visibleLinks().length,16);
  sim.start('web',{address:'https://knihovna.test/'});finish(sim);
  assert([...sim.packets.values()].some(p=>p.kind==='dns-query'&&p.payload.name==='knihovna.test'));
  assert.equal(net.browser.dnsCache['knihovna.test'],net.nodes.web.ip);
  sim.start('web',{address:'https://knihovna.test/'});finish(sim);
  assert(![...sim.packets.values()].some(p=>p.kind==='dns-query'));
  net.browser.dnsCache={};net.toggleNode('dns');
  sim.start('web',{address:'https://knihovna.test/'});finish(sim,'failed');
  assert([...sim.packets.values()].some(p=>p.kind==='dns-query'));
  assert(![...sim.packets.values()].some(p=>p.kind==='https-request'));
});
test('The advertising partner uses its own DNS lookup only when the DNS extension is enabled',()=>{
  for(const enabled of [false,true]){
    const sim=new Simulation(network(['ads',...(enabled?['dns']:[])]));
    sim.start('web',{address:'https://obchod.test/'});finish(sim);
    assert.equal(sim.net.ads.requests,1);assert.equal(sim.net.browser.adPage.state,'ready');
    const names=[...sim.packets.values()].filter(p=>p.kind==='dns-query').map(p=>p.payload.name);
    assert.deepEqual(names,enabled?['obchod.test','reklamy.test']:[]);
  }
});
test('Mail between providers preserves delivery and SMTP relay with or without DNS MX',()=>{
  for(const enabled of [false,true]){
    const sim=new Simulation(network(['mail-b',...(enabled?['dns']:[])]));
    sim.start('mail-send',{device:'laptop',target:'friend',subject:'Pozdrav',body:'Stejný obsah bez DNS.'});const events=finish(sim);
    assert.equal(sim.net.mail.boxes.friend[0].body,'Stejný obsah bez DNS.');
    assert([...sim.packets.values()].some(p=>p.mailMeta?.phase==='relay'));
    assert.equal([...sim.packets.values()].some(p=>p.connection==='mail-dns'),enabled);
    if(!enabled){assert(!events.some(e=>e.kind==='mail-mx'));assert.deepEqual(sim.net.mail.mxCache,{});}
  }
});
test('DNS and TLS are independent steps; the same form is delivered in all four combinations',()=>{
  const message='Vzkaz knihovně 🙂';
  for(const dns of [false,true])for(const tls of [false,true]){
    const net=network([...(dns?['dns']:[]),...(tls?['tls']:[])]),sim=new Simulation(net);
    assert(sim.start('web',{address:'https://knihovna.test/',method:'POST',message}));finish(sim);
    const packets=[...sim.packets.values()],kinds=packets.map(p=>p.kind);
    assert.deepEqual(kinds,[...(dns?['dns-query','dns-response']:[]),...(tls?['tls-client-hello','tls-server-response','tls-finished','https-request','https-response']:['http-request','http-response'])]);
    assert.equal(net.browser.certificateVerified,tls);assert.equal(net.browser.loadedSecure,tls);
    assert.equal(net.browser.address,`${tls?'https':'http'}://knihovna.test/`);
    assert.equal(sim.lastAction.payload.address,net.browser.address);
    assert.equal(net.browser.receipt,message);assert.equal(net.server.lastRequest.message,message);
    const request=packets.find(p=>p.kind===(tls?'https-request':'http-request'));
    assert.equal(request.initialHeader.dport,tls?443:80);
    if(tls){assert(request.payload.record);assert(!JSON.stringify(request).includes(message));}
    else assert(requestText(request.payload).includes(message));
    assert.equal(net.visibleNodes().length,dns?15:14,'TLS adds no map devices');
  }
});
test('Certificate rejection is restored by TLS, while disabled TLS delivers readable HTTP',()=>{
  for(const change of [{valid:false},{trusted:false},{name:'jiny-web.test'}])for(const tls of [false,true]){
    const net=network(tls?['tls']:[]),sim=new Simulation(net);Object.assign(net.server.certificate,change);
    assert(sim.start('web',{address:'https://knihovna.test/',method:'POST',message:'Pokus s certifikátem'}));finish(sim,tls?'failed':'success');
    assert.equal(net.browser.certificateVerified,false);
    if(tls){assert.equal(net.server.lastRequest,null);assert(![...sim.packets.values()].some(p=>p.kind==='https-request'));}
    else assert.equal(net.browser.receipt,'Pokus s certifikátem');
  }
});
test('Browser history and repeat use the effective protocol for all optional websites',()=>{
  for(const tls of [false,true]){
    const net=network(['shop','news','phishing',...(tls?['tls']:[])]),sim=new Simulation(net),nav=new BrowserNavigation(net);
    for(const url of ['https://knihovna.test/','https://obchod.test/?tema=hudba','https://zpravy.test/','https://knihovna-podpora.test/overeni?zprava=1']){
      assert(sim.start('web',{address:url}));nav.sync(sim);finish(sim);nav.sync(sim);
      const effective=tls?url:url.replace('https:','http:');
      assert.equal(nav.active('laptop').url,effective);assert.equal(nav.active('laptop').loadedUrl,effective);
      assert.equal(net.browser.loadedSecure,tls);
      assert(sim.repeat());nav.sync(sim);finish(sim);nav.sync(sim);
      assert.equal(nav.active('laptop').history.at(-1),effective);
    }
    assert.equal(nav.active('laptop').history.length,4);
  }
});
test('Only the secure advertising lesson automatically requires web TLS',()=>{
  for(const feature of LAB_FEATURES)assert.equal(new LabSettings({features:[feature.id]}).has('tls'),['tls','ads'].includes(feature.id),feature.id);
  assert.deepEqual(new LabSettings({features:['ads']}).requiredBy('tls').map(f=>f.id),['ads']);
  assert.equal(new LabSettings({features:['ads']}).toggle('ads',false).has('tls'),false);
});
test('The cafe HTTP attack works without TLS and gains encrypted web protection when enabled',()=>{
  for(const tls of [false,true]){
    const net=network(['mitm',...(tls?['tls']:[])]),sim=new Simulation(net);
    sim.mitm.configure(true,'http');net.setCafeHotspot('rogue');
    assert(sim.start('web',{device:'cafe',address:'https://knihovna.test/',method:'POST',message:'Vzkaz od hosta'}));finish(sim);
    assert.equal(net.browserFor('cafe').receipt,'Vzkaz od hosta');
    assert.equal(net.browserFor('cafe').content===net.server.title,tls);
    assert.equal(net.mitm.logs.some(row=>row.before.includes('Vzkaz od hosta')),!tls);
  }
});
test('Secure account and privacy operations cannot be silently sent in plaintext',()=>{
  for(const operation of [{authOp:'status'},{privacyOp:'read'}]){
    const sim=new Simulation(network([]));
    assert.equal(sim.start('web',{address:'https://knihovna.test/',...operation}),false);
    assert.equal(sim.packets.size,0);assert.equal(sim.net.server.lastRequest,null);
  }
});

test('Cookies, DNS and TLS are independent; GET and POST work in all eight combinations',()=>{
  for(const cookies of [false,true])for(const dns of [false,true])for(const tls of [false,true]){
    const net=network([...(cookies?['cookies']:[]),...(dns?['dns']:[]),...(tls?['tls']:[])]),sim=new Simulation(net);
    for(const extra of [{},{},{method:'POST',message:'Vzkaz funguje i bez cookies'}]){
      assert(sim.start('web',{address:'https://knihovna.test/',...extra}));finish(sim);
      const reply=tls?sim.webReply:[...sim.packets.values()].find(p=>p.kind==='http-response').payload;
      assert.equal(net.browser.loadedSecure,tls);assert.equal(net.browser.content,net.server.files['index.html'].content.title);
      assert.equal(!!reply.setCookie,cookies);assert.equal(!!reply.visitor,cookies);
      assert.equal(responseText(reply).includes('Set-Cookie:'),cookies);
      assert.equal([...sim.packets.values()].some(p=>p.kind.startsWith('tls-')),tls);
      if(!cookies){
        assert(!requestText(sim.webRequest).includes('Cookie:'));
        assert(!responseText(reply).includes('Identifikátor:'));
        assert.equal(net.browser.visitor,null);assert.equal(net.browser.greeting,'');
        assert(!/cookie|identifikátor/i.test(sim.current.description));
      }
    }
    assert.equal(net.browser.receipt,'Vzkaz funguje i bez cookies');
    assert.equal(net.browser.cookies.items.length,cookies?1:0);
    assert.equal(net.server.cookies.visitors.size,cookies?1:0);
    if(cookies){assert.equal(net.server.cookies.last.returning,true);assert.equal(net.server.cookies.visitors.get('v1').loads,2);assert.equal(net.server.cookies.visitors.get('v1').requests,3);}
    else{assert.equal(net.server.cookies.serial,0);assert.equal(net.server.cookies.last,null);}
    assert.equal(net.server.auth.sessions.size,cookies&&tls?5:0);
    assert.equal(net.visibleNodes().length,dns?15:14,'Cookies add no network nodes');
  }
});

test('Disabling the cookie extension omits cookies even if a browser has residual stored values',()=>{
  const net=network(['tls','vpn']),sim=new Simulation(net);net.setVPN('laptop',true);
  net.browser.cookies.items.push({name:'navstevnik',value:'v99',domain:'knihovna.test',path:'/',secure:false,expiresAt:3600});
  net.browser.cookies.session={name:'library_session',value:'a'.repeat(64),domain:'knihovna.test',path:'/',secure:true,expiresAt:3600};
  sim.start('web',{address:'https://knihovna.test/'});finish(sim);
  assert(!sim.webRequest.cookie);assert(!sim.webReply.setCookie);
  assert.equal(net.server.cookies.visitors.size,0);assert.equal(net.server.auth.sessions.size,0);
  assert.equal(net.browser.visitor,null);assert(!net.browser.cookies.lastSent);assert(!net.browser.cookies.lastReceived);
});

test('The browser cookie permission remains different from removing the cookie lesson',()=>{
  const net=network(['cookies']),sim=new Simulation(net);net.browser.cookies.allowed=false;
  for(let i=0;i<2;i++){sim.start('web',{address:'http://knihovna.test/'});finish(sim);}
  assert.equal(net.browser.cookies.items.length,0);assert.equal(net.server.cookies.visitors.size,2);
  assert.equal(net.server.cookies.last.returning,false,'The server still tries to assign an ID when only browser permission is denied');
});

test('Account and privacy operations require cookies and TLS together',()=>{
  for(const cookies of [false,true])for(const tls of [false,true]){
    const net=network([...(cookies?['cookies']:[]),...(tls?['tls']:[])]),sim=new Simulation(net);
    const available=cookies&&tls;
    for(const device of ['laptop','phone','friend','cabin','cafe'])assert.equal(!!net.browserFor(device).cookies.session,available);
    for(const op of [{authOp:'status'},{privacyOp:'read'}]){
      assert.equal(sim.start('web',{address:'https://knihovna.test/',...op}),available);
      if(available){finish(sim);assert.equal(sim.webReply.status,200);}
      else assert.equal(sim.packets.size,0);
    }
  }
});

test('The advertising scenario automatically adds cookies and recognizes its profile across websites',()=>{
  for(const feature of LAB_FEATURES)assert.equal(new LabSettings({features:[feature.id]}).has('cookies'),['cookies','ads'].includes(feature.id),feature.id);
  const settings=new LabSettings({features:['ads']});
  assert.deepEqual(settings.requiredBy('cookies').map(f=>f.id),['ads']);
  assert(!settings.toggle('ads',false).has('cookies'));
  const net=new Network(settings),sim=new Simulation(net);
  for(const address of ['https://obchod.test/','https://zpravy.test/']){sim.start('web',{address});finish(sim);}
  assert.equal(net.ads.requests,2);assert.equal(net.ads.profiles.size,1);
  assert.equal(net.ads.profiles.get(net.ads.clients.laptop.cookie.value).events.length,2);
});
