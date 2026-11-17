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
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,Simulation,LabSettings,LAB_FEATURES}=globalThis.InternetLab;
const network=features=>new Network(new LabSettings({features}));
function finish(sim,expected='success') {
  const events=[];
  for(let i=0;sim.status==='running'&&i<1500;i++){sim.advanceFrame();events.push(...sim.frame);}
  assert.equal(sim.status,expected,sim.current?.description);
  return events;
}
test('The base is a usable web network without optional hosts or DNS transfers',()=>{
  const net=network([]),sim=new Simulation(net);
  assert.deepEqual(net.visibleNodes().map(n=>n.id).sort(),['laptop','switch','home','edge','north','south','dc','dc-switch','web','hosting-router'].sort());
  assert.equal(net.visibleLinks().length,10);
  assert.deepEqual(net.dnsRecords,{'knihovna.test':'203.0.113.10'});
  assert.deepEqual(net.mailMXRecords,{});
  assert.equal(net.appAvailable('web','laptop'),true);
  for(const app of ['print','mail','message','cloud','chatbot'])assert.equal(net.appAvailable(app,'laptop'),false);
  sim.start('web',{address:'https://knihovna.test/'});const events=finish(sim);
  assert.equal(net.browser.content,net.server.title);
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
  for(const id of ['phone','friend','mail','phishing','cloud','shop','news'])assert(settings.has(id),id);
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
  assert.equal(net.visibleNodes().length,61);assert.equal(net.visibleLinks().length,67);
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
  settings.details={mac:true,routes:true,nat:true,payload:true};
  const same=new Network(settings),second=new Simulation(same);second.start('web',{address:'http://knihovna.test/'});
  assert.deepEqual(finish(second).filter(e=>e.kind==='hop').map(e=>[e.from,e.to]),first);
  assert.deepEqual(same.nat.home.rows,net.nat.home.rows);
});
test('Without DNS, normal domain URLs still deliver HTTP, HTTPS and forms, also through VPN',()=>{
  for(const features of [[],['vpn']])for(const protocol of ['http','https']){
    const net=network(features),sim=new Simulation(net);
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
  const net=network(['dns']),sim=new Simulation(net);
  assert(net.nodeAvailable('dns'));assert.equal(net.visibleLinks().length,11);
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
