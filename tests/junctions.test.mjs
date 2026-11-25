import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';
import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,LAB_FEATURES}=globalThis.InternetLab;
const technical=n=>['router','switch'].includes(n.type);
function finish(sim) {
  const events=[];
  for(let i=0;sim.status==='running'&&i<2000;i++) {
    sim.advanceFrame();
    events.push(...sim.frame.map(e=>({kind:e.kind,at:e.at,node:e.node,link:e.link,from:e.from,to:e.to,packet:e.packet?.id,header:e.header,copy:e.copy,decision:e.decision&&structuredClone(e.decision)})));
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
test('Every visible host, router, simplified junction and BTS has one distinct map address',()=>{
  for(const settings of [new LabSettings(),LabSettings.full(),...LAB_FEATURES.map(f=>new LabSettings({features:[f.id]}))]){
    settings.details.devices=false;
    const net=new Network(settings),addresses=new Set();
    for(const n of net.visibleNodes()){
      const ip=net.displayIp(n);
      if(['host','bts'].includes(n.type)||technical(n)){
        assert.match(ip,/^(\d{1,3}\.){3}\d{1,3}$/,n.id);
        assert(ip.split('.').every(part=>Number(part)<256),n.id);
        assert(!addresses.has(ip),`${n.id}: duplicate ${ip}`);addresses.add(ip);
        if(n.type==='router')assert(Object.values(n.interfaces).some(i=>i.ip===ip),n.id);
      }else assert.equal(ip,null,n.id);
    }
    const routerAddresses=net.visibleNodes().filter(n=>n.type==='router').map(n=>[n,net.displayIp(n)]);
    settings.details.devices=true;
    for(const n of net.visibleNodes().filter(n=>n.type==='switch'))assert.equal(net.displayIp(n),null,n.id);
    for(const [n,ip] of routerAddresses)assert.equal(net.displayIp(n),ip,n.id);
  }
});
test('Map addresses follow client access and remain visible through router and link outages',()=>{
  const settings=LabSettings.full(),net=new Network(settings);
  settings.details.devices=false;
  assert.equal(net.displayIp('laptop'),'192.168.10.10');
  assert(net.setAccess('laptop','wifi'));assert.equal(net.displayIp('laptop'),'192.168.10.11');
  assert.equal(net.displayIp('phone'),'198.51.100.10');
  assert(net.setAccess('phone','wifi'));assert.equal(net.displayIp('phone'),'192.168.10.30');
  const nodes=net.visibleNodes().filter(technical),before=nodes.map(n=>net.displayIp(n));
  for(const n of nodes)n.on=false;
  for(const l of net.visibleLinks())l.on=false;
  assert.deepEqual(nodes.map(n=>net.displayIp(n)),before);
  assert.equal(net.nodes.switch.ip,null,'A schematic junction address does not turn the switch into an IP host');
  assert(Object.values(net.nodes.switch.interfaces).every(i=>i.ip===null));
});
test('The shared option changes forwarding mode without resetting the network selection or running transfer',()=>{
  const basic=new LabSettings({features:['instagram'],details:{mac:true,routes:true}}),detailed=new LabSettings({...basic.toJSON(),details:{...basic.details,devices:true}});
  assert(basic.sameNetwork(detailed));assert(!basic.details.devices);assert(detailed.details.mac&&detailed.details.routes);
  assert.deepEqual(new LabSettings(detailed.toJSON()).toJSON(),detailed.toJSON());
  const net=new Network(basic),sim=new Simulation(net);assert(sim.start('web'));sim.advanceFrame();sim.advanceFrame();
  const packets=sim.packets,current=sim.current,queue=sim.queue,routes=net.nodes.home.routes;
  const basicText=net.displayText('Domácí switch → Domácí router; Router AC → Router A');
  assert(!/switch|router/i.test(basicText));assert.equal(net.displayName('home'),'Chytrá křižovatka');
  net.settings=detailed;sim.deviceModeChanged();
  assert.strictEqual(sim.packets,packets);assert.strictEqual(sim.current,current);assert.strictEqual(sim.queue,queue);assert.strictEqual(net.nodes.home.routes,routes);
  assert.equal(net.displayName('home'),'Domácí router');assert.equal(net.displayText('Router AC → Router A'),'Router AC → Router A');finish(sim);
});
test('Both modes use the same intended web path, headers and topology; only real switches learn and flood',()=>{
  const create=devices=>new Simulation(new Network(new LabSettings({details:{devices}}))),basic=create(false),detailed=create(true);
  assert(basic.start('web'));assert(detailed.start('web'));
  const direct=finish(basic),switched=finish(detailed);
  const path=events=>events.filter(e=>e.kind==='hop'&&!e.copy).map(e=>[e.from,e.to,e.packet,e.header]);
  assert.deepEqual(path(direct),path(switched));assert.deepEqual(basic.net.nat,detailed.net.nat);
  assert(!direct.some(e=>e.copy));assert(switched.some(e=>e.copy));
  assert.deepEqual(basic.net.nodes.switch.macTable,{});assert(Object.keys(detailed.net.nodes.switch.macTable).length);
  assert.equal(basic.net.browser.content,detailed.net.browser.content);
  assert.deepEqual(basic.net.visibleLinks(),detailed.net.visibleLinks());
  const topology=net=>net.visibleNodes().map(({macTable,lastDecision,...node})=>node);
  assert.deepEqual(topology(basic.net),topology(detailed.net));
});
test('User data containing real device names is preserved and delivered without presentation substitutions',()=>{
  const sim=new Simulation(new Network(new LabSettings({features:['instagram']}))),text='Router A, Domácí switch a Router AC jsou jen slova v mojí zprávě.';
  assert(sim.start('message',{text}));finish(sim);assert.equal(sim.net.friend.text,text);assert.equal(sim.net.instagram.text,text);
  assert(sim.packets.size>0);assert(sim.net.visibleNodes().filter(technical).every(n=>sim.net.displayType(n)==='junction'));
});

test('Simplified first web and local print use one output per junction even with MAC, frames and routing details enabled',()=>{
  const net=new Network(new LabSettings({features:['wifi','phone','printer'],details:{mac:true,frames:true,routes:true}})),sim=new Simulation(net);
  for(const type of ['web','print']){
    assert(sim.start(type));const events=finish(sim),decisions=events.filter(e=>e.kind==='switch');assert(decisions.length);
    assert(!events.some(e=>e.copy));assert(!events.some(e=>e.kind==='hop'&&e.to==='phone'));
    if(type==='web')assert(!events.some(e=>e.kind==='hop'&&e.to==='printer'));
    else assert(!events.some(e=>e.kind==='hop'&&e.to==='home'));
    for(const e of decisions){assert.equal(e.decision.action,'direct');assert.equal(e.decision.ports.length,1);}
    assert(Object.values(net.nodes).filter(n=>['switch','ap'].includes(n.type)).every(n=>Object.keys(n.macTable).length===0));
  }
  assert.equal(net.printer.count,1);assert.equal(net.browser.content,net.server.title);
});
test('Basic forwarding reaches only the correct hosting customer and fails when its path is unavailable',()=>{
  const net=new Network(new LabSettings()),sim=new Simulation(net);
  assert(sim.start('web'));const events=finish(sim);
  assert(events.some(e=>e.kind==='hop'&&e.to==='web'));
  for(const id of ['hosting-web-2','hosting-web-3'])assert(!events.some(e=>e.kind==='hop'&&e.to===id));
  net.toggleLink('web-switch');assert(sim.start('web'));
  for(let i=0;sim.status==='running'&&i<1000;i++)sim.advanceFrame();
  assert.equal(sim.status,'failed');assert.equal(net.nodes['dc-switch'].lastDecision.ports.length,0);
  assert(sim.current.description.includes('dostupný spoj'));
});
test('Simplified forwarding ignores stale MAC rows and respects active links rather than flooding around a failure',()=>{
  const net=new Network(new LabSettings({features:['printer','wifi']})),frame={src:net.nodes.laptop.mac,dst:net.nodes.home.mac};
  net.nodes.switch.macTable[frame.dst]='p2';
  let d=net.switchFrame('switch','laptop-switch',frame,'probe');assert.equal(d.action,'direct');assert.deepEqual(d.ports,['p3']);
  net.toggleLink('switch-home');d=net.switchFrame('switch','laptop-switch',frame,'probe');assert.deepEqual(d.ports,[]);
});
test('Real switches still flood the first unknown frame and learn the return port after enabling the option',()=>{
  const net=new Network(new LabSettings({features:['printer','wifi'],details:{devices:true}})),sim=new Simulation(net);
  assert(sim.start('web'));const events=finish(sim),first=events.find(e=>e.kind==='switch'&&e.node==='switch');
  assert.equal(first.decision.action,'flood');assert.deepEqual(first.decision.ports,['p2','p3','p4']);
  assert(events.some(e=>e.copy&&e.to==='printer'));assert(events.some(e=>e.kind==='switch'&&e.node==='switch'&&e.decision.action==='known'));
  assert.equal(net.nodes.switch.macTable[net.nodes.laptop.mac],'p1');
});
test('Live mode changes discard scheduled copies and preserve the original packet, queue destination and application result',()=>{
  const settings=new LabSettings({features:['printer','wifi'],details:{devices:true}}),net=new Network(settings),sim=new Simulation(net);
  assert(sim.start('web'));
  for(let i=0;sim.status==='running'&&!sim.queue.some(e=>e.copy)&&i<100;i++)sim.advanceFrame();
  assert(sim.queue.some(e=>e.copy));const packets=sim.packets,run=sim.run;
  net.settings=new LabSettings({features:['printer','wifi']});sim.deviceModeChanged();
  assert.strictEqual(sim.packets,packets);assert.equal(sim.run,run);assert.equal(sim.status,'running');
  assert(!sim.queue.some(e=>e.copy));assert(!sim.frame.some(e=>e.copy));assert(!finish(sim).some(e=>e.copy));
  assert.equal(net.browser.content,net.server.title);
  net.settings=settings;sim.deviceModeChanged();assert(sim.start('web'));
  const detailed=finish(sim);assert(detailed.some(e=>e.decision?.action==='flood'));assert(detailed.some(e=>e.copy));
});
test('Simplified forwarding works through every bridge on Wi-Fi, satellite, cafe, Instagram and VPN paths',()=>{
  const features=['wifi','mobile','satellite','mitm','instagram','vpn'];
  for(const [device,mode,vpn] of [['laptop','wifi',false],['phone','wifi',false],['cabin','wifi',false],['cafe','trusted',false],['cafe','rogue',false],['laptop','wifi',true]]){
    const net=new Network(new LabSettings({features})),sim=new Simulation(net);
    if(device==='cafe'){
      if(mode==='rogue')sim.mitm.configure(true,'http');
      assert(net.setCafeHotspot(mode,...(mode==='trusted'?[net.cafeWifi.password]:[])));
    }else if(net.access[device].mode!==mode)net.setAccess(device,mode);
    if(vpn)net.setVPN(device,true);
    assert(sim.start('web',{device}));const events=finish(sim);
    assert(!events.some(e=>e.copy),`${device}/${mode}/${vpn}`);
    assert(events.filter(e=>e.kind==='switch').every(e=>e.decision.action==='direct'&&e.decision.ports.length===1));
  }
  const sim=new Simulation(new Network(new LabSettings({features})));
  assert(sim.start('message',{messageType:'image'}));assert(!finish(sim).some(e=>e.copy));
  assert.deepEqual(sim.net.friend.content.bytes,sim.net.sender.content.bytes);
});
