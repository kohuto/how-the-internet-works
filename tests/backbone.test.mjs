import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';
import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';
import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,LAB_FEATURES,Simulation,contains}=globalThis.InternetLab;
function finish(sim){
  const events=[];
  for(let i=0;sim.status==='running'&&i<3000;i++){sim.advanceFrame();events.push(...structuredClone(sim.frame));}
  assert.notEqual(sim.status,'running');return events;
}

test('Every backbone segment has its own subnet and both endpoint interfaces remain intact',()=>{
  const net=new Network(LabSettings.full()),links=Object.values(net.links);
  for(const l of links)for(const id of [l.a,l.b])assert.equal(net.iface(id,l).link,l.id,`${id} port must not be overwritten`);
  const added=links.filter(l=>l.id.startsWith('backbone-'));
  assert.equal(added.length,35);
  for(const l of added){
    assert(l.prefix.endsWith('/30'));
    for(const id of [l.a,l.b]){
      const iface=net.iface(id,l);assert(contains(l.prefix,iface.ip));
      assert(net.nodes[id].routes.some(r=>r.connected&&r.link===l.id&&r.prefix===l.prefix));
    }
    for(const other of links)if(other!==l){
      assert(!contains(l.prefix,other.prefix.split('/')[0])&&!contains(other.prefix,l.prefix.split('/')[0]),`${l.id} must not overlap ${other.id}`);
    }
  }
});

test('New base routers forward real packets and the lower branch still restores a failed upper route',()=>{
  const net=new Network(new LabSettings()),sim=new Simulation(net);
  assert(sim.start('web'));let events=finish(sim);assert.equal(sim.status,'success');
  assert(events.some(e=>e.kind==='route'&&e.node==='transit-v'));
  net.toggleLink('edge-north');assert(sim.repeat());events=finish(sim);assert.equal(sim.status,'success');
  assert(events.some(e=>e.kind==='route'&&e.node==='transit-f'));
  for(const p of sim.packets.values())assert.equal(p.ttl,64-events.filter(e=>e.kind==='route'&&e.packet.id===p.id).length);
  net.toggleNode('transit-v');assert(sim.repeat());finish(sim);assert.equal(sim.status,'failed');
  net.toggleNode('transit-v');assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');
});

test('Shared backbone branches deliver messages and an Instagram branch outage leaves hosting available',()=>{
  const net=new Network(new LabSettings({features:['instagram']})),sim=new Simulation(net);
  const visible=net.visibleNodes().filter(n=>n.id.startsWith('transit-')).map(n=>n.id).sort();
  assert.deepEqual(visible,['transit-f','transit-g','transit-h','transit-k','transit-n','transit-o','transit-p','transit-v','transit-w','transit-x','transit-y']);
  assert(sim.start('message',{text:'Více kratších spojů'}));const events=finish(sim);assert.equal(sim.status,'success');
  assert.equal(net.friend.text,'Více kratších spojů');
  for(const id of ['transit-g','transit-h','transit-n','transit-o'])assert(events.some(e=>e.kind==='route'&&e.node===id));
  net.toggleNode('transit-o');assert(sim.start('message',{text:'Nedostupná větev'}));finish(sim);assert.equal(sim.status,'failed');
  assert(sim.start('web'));finish(sim);assert.equal(sim.status,'success');assert.equal(net.browser.content,net.server.title);
});

test('Every enabled backbone stays connected after any single backbone link or router failure',()=>{
  const core=n=>n.type==='router'&&['city','peer'].includes(n.region);
  for(const settings of [new LabSettings(),LabSettings.full(),...LAB_FEATURES.map(f=>new LabSettings({features:[f.id]}))]){
    const net=new Network(settings),nodes=net.visibleNodes().filter(core);
    const links=net.visibleLinks().filter(l=>core(net.nodes[l.a])&&core(net.nodes[l.b]));
    for(const failed of [...links,...nodes]){
      failed.on=false;
      const remaining=nodes.filter(n=>n.on),source=remaining[0].id;
      for(const target of remaining){
        const path=net.shortest(source,target.id);
        assert(path,`${settings.toJSON().features}: ${failed.id} disconnects ${target.id}`);
        assert(!path.includes(failed.id));
      }
      failed.on=true;
    }
  }
});

test('Instagram delivers through recomputed real routes after independent core link and router outages',()=>{
  for(const [kind,id] of [['link','backbone-e-n'],['link','north-peer'],['link','backbone-h-o'],['node','peer'],['node','transit-g'],['node','transit-h'],['node','dc']]){
    const net=new Network(new LabSettings({features:['instagram']})),sim=new Simulation(net);
    if(kind==='link')net.toggleLink(id);else net.toggleNode(id);
    const text=`Náhradní cesta po výpadku ${id}`;
    assert(sim.start('message',{text}));const events=finish(sim);
    assert.equal(sim.status,'success',`${kind} ${id}`);assert.equal(net.friend.text,text);
    assert(!events.some(e=>e.kind==='route'&&e.node===id||e.kind==='hop'&&e.link===id));
    for(const p of sim.packets.values())assert.equal(p.ttl,64-events.filter(e=>e.kind==='route'&&e.packet.id===p.id).length);
  }
});

test('The image still reaches Matej through W after the old E–N link fails',()=>{
  const net=new Network(new LabSettings({features:['instagram']})),sim=new Simulation(net);
  net.toggleLink('backbone-e-n');assert(sim.start('message',{messageType:'image'}));
  const events=finish(sim);assert.equal(sim.status,'success');assert.equal(net.friend.receivedBytes,12000);
  assert(events.some(e=>e.kind==='route'&&e.node==='transit-w'));
  assert.equal([...sim.packets.values()].filter(p=>p.kind==='ig-delivery'&&p.state==='delivered').length,9);
});
