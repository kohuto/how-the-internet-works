import '../js/network.js';
import '../js/map.js';
import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal SVG surface: exercise the real packet renderer and element removal.
class Element extends EventTarget {
  dataset={};children=[];attributes=new Map();classList={toggle(){}};
  setAttribute(name,value){this.attributes.set(name,value);}
  querySelectorAll(){return [];}
  append(child){child.parent=this;this.children.push(child);}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
}
function setup(t){
  const previous=globalThis.document;
  globalThis.document={createElementNS:()=>new Element()};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
  const svg=new Element(),layers=new Map(['signal-coverage','links','nodes','packet'].map(name=>[`#${name}-layer`,new Element()]));
  svg.querySelector=selector=>layers.get(selector)||null;
  const net={nodes:{client:{x:0,y:0},server:{x:100,y:0}},visibleNodes:()=>[],visibleLinks:()=>[],featureEnabled:()=>false};
  return {map:new InternetLab.NetworkMap(svg,net,()=>{}),layer:layers.get('#packet-layer')};
}
const packet=(id,direction='request')=>({id,state:'transit',location:'client',kind:`smtp-${direction}`,direction,connection:'smtp',label:`SMTP ${direction}`,payload:{}});

test('An inspected packet disappears on delivery while its response continues without another selection',t=>{
  const {map,layer}=setup(t),request=packet('1'),packets=new Map([[request.id,request]]),selection={kind:'packet',id:request.id};
  map.render(null,selection,request.id,false,650,packets,[]);
  assert.equal(layer.children.length,1);
  let cancelled=false;map.packetViews.get(request.id).animation={cancel(){cancelled=true;}};
  request.state='delivered';request.location='server';
  const reply=packet('2','response');packets.set(reply.id,reply);
  map.render({kind:'create',packet:reply},selection,request.id,false,650,packets,[]);
  assert(cancelled);assert(!map.packetViews.has(request.id));
  assert.deepEqual(layer.children.map(g=>g.dataset.id),[reply.id]);
  map.render();assert.deepEqual(layer.children.map(g=>g.dataset.id),[reply.id]);
  reply.state='delivered';
  map.render({kind:'complete'},selection,request.id,false,650,packets,[]);
  assert.equal(layer.children.length,0);
});
