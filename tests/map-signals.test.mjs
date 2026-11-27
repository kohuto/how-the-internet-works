import '../js/network.js';
import '../js/settings.js';
import '../js/cloud.js';
import '../js/map.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,NetworkMap}=globalThis.InternetLab;
class Element extends EventTarget {
  dataset={};children=[];attributes=new Map();style={setProperty(){}};
  querySelectorAll(){return [];}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  append(child){child.parent=this;this.children.push(child);}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
}
// Use real source visibility and power/link state, without rendering unrelated map content.
class SignalMap extends NetworkMap {render(){this.renderSignals();}}
function setup(t,settings=LabSettings.full()) {
  const previous=globalThis.document;
  globalThis.document={createElementNS:()=>new Element()};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
  const svg=new Element(),layer=new Element(),net=new Network(settings);
  svg.querySelector=selector=>selector==='#signal-coverage-layer'?layer:null;
  return {map:new SignalMap(svg,net,()=>{}),net,layer};
}

test('Signal display preserves existing wave elements across updates and removes only powered-off sources',t=>{
  const {map,net,layer}=setup(t);
  assert.equal(layer.children.length,0);
  map.signalCoverage=true;map.render();
  const ap=map.signalViews.get('ap'),bts=map.signalViews.get('bts-lipova'),waves=[...ap.children];
  assert(ap&&bts);assert.equal(waves.length,2);
  map.render();map.setScene('all');map.render();
  assert.equal(map.signalViews.get('ap'),ap);assert.deepEqual(ap.children,waves);
  net.toggleNode('bts-lipova');map.render();
  assert(!map.signalViews.has('bts-lipova'));assert(!layer.children.includes(bts));
  assert.equal(map.signalViews.get('ap'),ap);assert.deepEqual(ap.children,waves);
  net.toggleNode('bts-lipova');map.render();assert(map.signalViews.has('bts-lipova'));
  map.signalCoverage=false;map.render();assert.equal(layer.children.length,0);assert.equal(map.signalViews.size,0);
});

test('Radio sources follow enabled features and hotspot state while disconnected backhaul still emits',t=>{
  const {map,net}=setup(t);
  map.signalCoverage=true;map.render();assert(!map.signalViews.has('cafe-attacker'));
  net.mitm.active=true;map.render();assert(map.signalViews.has('cafe-attacker'));
  net.mitm.active=false;map.render();assert(!map.signalViews.has('cafe-attacker'));
  const ap=map.signalViews.get('ap'),backhaul=Object.values(net.links).find(l=>(l.a==='ap'||l.b==='ap')&&l.medium!=='wifi');
  assert(backhaul);net.toggleLink(backhaul.id);map.render();assert.equal(map.signalViews.get('ap'),ap);
  const before=JSON.stringify(net);
  map.signalCoverage=false;map.render();map.signalCoverage=true;map.render();
  assert.equal(JSON.stringify(net),before);
  map.net=new Network(new LabSettings());map.render();assert.equal(map.signalViews.size,0);
});
