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

test('Playback speed retimes existing and subsequent packet animations without moving or resuming paused packets',t=>{
  const {map,layer}=setup(t),previous=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:false});t.after(()=>{globalThis.matchMedia=previous;delete Element.prototype.animate;});
  Element.prototype.animate=function(_keyframes,timing){return {currentTime:0,playbackRate:1,paused:false,effect:{getTiming:()=>timing},updatePlaybackRate(rate){this.playbackRate=rate;},pause(){this.paused=true;},play(){this.paused=false;},cancel(){}};};
  const p=packet('speed'),visual={kind:'hop',from:'client',to:'server'};p.visual=visual;
  const packets=new Map([[p.id,p]]);map.render(null,null,null,true,650,packets,[]);
  const animation=map.packetViews.get(p.id).animation;assert.equal(animation.playbackRate,1);animation.currentTime=130;
  map.setPlaybackRate(2);assert.equal(animation.currentTime,130);assert.equal(animation.playbackRate,2);assert.equal(map.animationTimeRemaining(),195);
  map.setAnimationsPlaying(false);map.setPlaybackRate(4);assert(animation.paused);assert.equal(animation.currentTime,130);assert.equal(map.animationTimeRemaining(),97.5);
  map.render(null,null,null,false,650,packets,[]);assert.equal(map.packetViews.get(p.id).animation,animation);assert.equal(layer.children.length,1);
  map.setPlaybackRate(0);assert.equal(animation.playbackRate,4);map.setAnimationsPlaying(true);assert(!animation.paused);
  p.visual={...visual};map.render(null,null,null,true,650,packets,[]);assert.equal(map.packetViews.get(p.id).animation.playbackRate,4);
  map.finishAnimations();assert.equal(map.animationTimeRemaining(),0);assert.equal(p.state,'transit');
});

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

function trace(sim,map,layer,inspect){
  map.net.nodes=sim.net.nodes;
  for(let i=0;sim.status==='running'&&i<8000;i++){
    sim.advanceFrame();map.render(sim.current,null,null,false,650,sim.packets,sim.frame);
    for(const g of layer.children){
      const p=sim.packets.get(g.dataset.id);
      assert(!/NaN|undefined/.test(g.innerHTML),p.label);
      inspect(g,p);
    }
  }
  assert.equal(sim.status,'success',sim.current?.description);
}

test('Actual SMTP and IMAP markers retain mail labels and arrows with and without TLS',t=>{
  const {map,layer}=setup(t),{Network,LabSettings,Simulation}=InternetLab;
  for(const tls of [false,true]){
    const sim=new Simulation(new Network(new LabSettings({features:['mail',...(tls?['tls']:[])]}))),seen=new Set();
    const inspect=(g,p)=>{
      assert(['smtp','imap'].includes(p.connection));seen.add(p.kind);
      assert(g.innerHTML.includes(`>${p.label}</text>`));assert(!g.innerHTML.includes('Do IG'));
      assert(g.innerHTML.includes(`y="5">${p.direction==='response'?'↩':'→'}</text>`));
      assert(g.attributes.get('aria-label').includes(p.label));
    };
    assert(sim.start('mail-send',{device:'laptop',target:'friend',subject:'Popisek pošty',body:'Dlouhá zpráva s diakritikou 🐎. '.repeat(30)}));trace(sim,map,layer,inspect);
    assert([...sim.packets.values()].filter(p=>p.kind==='smtp-request').length>1);
    assert(sim.start('mail-check',{device:'friend'}));trace(sim,map,layer,inspect);
    assert(sim.start('mail-seen',{device:'friend',messageId:'mail-1'}));trace(sim,map,layer,inspect);
    assert.deepEqual([...seen].sort(),['imap-request','imap-response','smtp-request','smtp-response']);
    assert(sim.net.phishing.clients.friend.inbox.seen);
  }
});

test('Actual indexed Instagram, cloud, replica and chatbot packets keep their numeric markers',t=>{
  const {map,layer}=setup(t),{Network,LabSettings,Simulation}=InternetLab;
  const sim=new Simulation(new Network(new LabSettings({features:['instagram','cloud','chatbot']}))),seen=new Set();
  for(const [type,payload] of [['message',{text:'Ahoj Matěji!'}],['cloud',{device:'laptop',request:{op:'list'}}],['replicate',{}],['chatbot',{prompt:'Jak se přenášejí data?'}]]){
    assert(sim.start(type,payload));
    trace(sim,map,layer,(g,p)=>{
      if(!p.payload.bytes)return;
      const copy=g.attributes.get('class').includes('frame-copy'),prefix=copy?'Kopie':p.connection==='replica'?'A → B':p.connection==='cloud'?'Cloud':p.connection==='chatbot'?'Chatbot':p.kind==='ig-delivery'?'Matěj':'Do IG';
      assert(g.innerHTML.includes(prefix));assert(g.innerHTML.includes(`${p.payload.index+1} / ${p.payload.total}</text>`));
      assert(g.innerHTML.includes(`y="5">${p.payload.index+1}</text>`));seen.add(prefix);
    });
  }
  for(const prefix of ['Do IG','Matěj','Cloud','A → B','Chatbot'])assert(seen.has(prefix),prefix);
});
