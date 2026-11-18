import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';
import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation}=globalThis.InternetLab;
const technical=n=>['router','switch'].includes(n.type);
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<2000;i++) {
    sim.advanceFrame();
    events.push(...sim.frame.map(e=>({kind:e.kind,at:e.at,node:e.node,link:e.link,from:e.from,to:e.to,packet:e.packet?.id,header:e.header,copy:e.copy})));
  }
  assert.equal(sim.status,'success',sim.current?.description);return events;
}
test('Every original router and switch has the same basic presentation, including optional areas',()=>{
  const settings=LabSettings.full();settings.details.devices=false;
  const net=new Network(settings),nodes=net.visibleNodes().filter(technical);
  assert(nodes.length>30);
  for(const n of nodes){assert.equal(net.displayType(n),'junction');assert.equal(net.displayName(n),'Chytrá křižovatka');}
  for(const n of net.visibleNodes().filter(n=>!technical(n))){assert.equal(net.displayType(n),n.type);assert.equal(net.displayName(n),n.name);}
  for(const l of net.visibleLinks())assert(!/router|switch/i.test(net.displayLinkName(l)));
  settings.details.devices=true;
  for(const n of nodes){assert.equal(net.displayType(n),n.type);assert.equal(net.displayName(n),n.name);}
  for(const l of net.visibleLinks())assert.equal(net.displayLinkName(l),l.name);
});
test('The shared option changes presentation without changing the network selection or other details',()=>{
  const basic=new LabSettings({features:['instagram'],details:{mac:true,routes:true}}),detailed=new LabSettings({...basic.toJSON(),details:{...basic.details,devices:true}});
  assert(basic.sameNetwork(detailed));assert(!basic.details.devices);assert(detailed.details.mac&&detailed.details.routes);
  assert.deepEqual(new LabSettings(detailed.toJSON()).toJSON(),detailed.toJSON());
  const net=new Network(basic),sim=new Simulation(net);assert(sim.start('web'));sim.advanceFrame();sim.advanceFrame();
  const packets=sim.packets,current=sim.current,queue=sim.queue,routes=net.nodes.home.routes;
  const basicText=net.displayText('Domácí switch → Domácí router; Router AC → Router A');
  assert(!/switch|router/i.test(basicText));assert.equal(net.displayName('home'),'Chytrá křižovatka');
  net.settings=detailed;
  assert.strictEqual(sim.packets,packets);assert.strictEqual(sim.current,current);assert.strictEqual(sim.queue,queue);assert.strictEqual(net.nodes.home.routes,routes);
  assert.equal(net.displayName('home'),'Domácí router');assert.equal(net.displayText('Router AC → Router A'),'Router AC → Router A');finish(sim);
});
test('Both presentations have exactly the same web path, timing, headers, topology and network state',()=>{
  const create=devices=>new Simulation(new Network(new LabSettings({details:{devices}}))),basic=create(false),detailed=create(true);
  assert(basic.start('web'));assert(detailed.start('web'));
  assert.deepEqual(finish(basic),finish(detailed));assert.deepEqual(basic.net.nat,detailed.net.nat);
  assert.equal(basic.net.browser.content,detailed.net.browser.content);
  assert.deepEqual(basic.net.visibleLinks(),detailed.net.visibleLinks());
  assert.deepEqual(basic.net.visibleNodes(),detailed.net.visibleNodes());
});
test('User data containing real device names is preserved and delivered without presentation substitutions',()=>{
  const sim=new Simulation(new Network(new LabSettings({features:['instagram']}))),text='Router A, Domácí switch a Router AC jsou jen slova v mojí zprávě.';
  assert(sim.start('message',{text}));finish(sim);assert.equal(sim.net.friend.text,text);assert.equal(sim.net.instagram.text,text);
  assert(sim.packets.size>0);assert(sim.net.visibleNodes().filter(technical).every(n=>sim.net.displayType(n)==='junction'));
});
