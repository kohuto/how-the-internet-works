import '../js/network.js';
import '../js/map.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {NetworkMap}=globalThis.InternetLab;
// Exercise the real input handlers without needing a browser or rendering the network.
class InputMap extends NetworkMap {render() {}}
class MapSurface extends EventTarget {
  dataset={};attributes=new Map();captures=new Set();
  constructor(width=1000,height=600) {super();this.clientWidth=width;this.clientHeight=height;}
  closest() {return null;}
  setAttribute(name,value) {this.attributes.set(name,value);}
  getBoundingClientRect() {return {left:40,top:20,width:this.clientWidth,height:this.clientHeight};}
  setPointerCapture(id) {this.captures.add(id);}
  hasPointerCapture(id) {return this.captures.has(id);}
}
function setup(width,height) {
  const svg=new MapSurface(width,height),selected=[];
  return {svg,map:new InputMap(svg,{},(...args)=>selected.push(args)),selected};
}
function input(svg,type,values={}) {
  const event=new Event(type,{cancelable:true});
  Object.assign(event,{button:0,pointerId:1,pointerType:'mouse',clientX:600,clientY:300,deltaMode:0,...values});
  svg.dispatchEvent(event);return event;
}
function near(actual,expected) {assert(Math.abs(actual-expected)<1e-8,`${actual} ≈ ${expected}`);}
function worldAt(svg,box,point) {
  const rect=svg.getBoundingClientRect(),[x,y,w,h]=box;
  const fitted=Math.min(rect.width/w,rect.height/h);
  return [x+(point.x-rect.left-(rect.width-w*fitted)/2)/fitted,
    y+(point.y-rect.top-(rect.height-h*fitted)/2)/fitted];
}

test('Ctrl/Cmd wheel and trackpad pinch zoom around the cursor in both SVG aspect ratios',()=> {
  for(const [width,height] of [[1000,600],[320,700]]) {
    const {svg,map}=setup(width,height),point={x:width*.8,y:height*.4};
    const anchor=worldAt(svg,map.box,point),before=map.box[2];
    assert(input(svg,'wheel',{clientX:point.x,clientY:point.y,ctrlKey:true,deltaY:-30}).defaultPrevented);
    assert(map.box[2]<before);
    worldAt(svg,map.box,point).forEach((v,i)=>near(v,anchor[i]));
    input(svg,'wheel',{clientX:point.x,clientY:point.y,metaKey:true,deltaY:30});
    near(map.box[2],before);
    worldAt(svg,map.box,point).forEach((v,i)=>near(v,anchor[i]));
  }
});

test('Unmodified wheel remains available for ordinary scrolling',()=> {
  const {svg,map}=setup(),before=[...map.box];
  assert.equal(input(svg,'wheel',{deltaY:100}).defaultPrevented,false);
  assert.deepEqual(map.box,before);
});

test('Wheel line and page deltas work in both directions',()=> {
  for(const [deltaMode,deltaY] of [[0,-32],[1,-2],[2,-32/600]]) {
    const {svg,map}=setup(),before=map.box[2];
    input(svg,'wheel',{ctrlKey:true,deltaY,deltaMode});
    assert(map.box[2]<before);
    input(svg,'wheel',{ctrlKey:true,deltaY:-deltaY,deltaMode});
    near(map.box[2],before);
  }
});

test('Zoom buttons keep the map center and allow zooming out from the entire network',()=> {
  const {map}=setup();map.setScene('all');
  const [x,y,w,h]=map.box;map.zoom(1.28);
  assert(map.box[2]>w);
  near(map.box[0]+map.box[2]/2,x+w/2);near(map.box[1]+map.box[3]/2,y+h/2);
  near(map.box[2]/map.box[3],w/h);
});

test('Zoom limits remain finite and reversing a gesture immediately leaves either limit',()=> {
  const {svg,map}=setup(),point={x:750,y:200};
  for(const direction of [1,-1]) {
    for(let i=0;i<30;i++)input(svg,'wheel',{ctrlKey:true,deltaY:direction*10000,clientX:point.x,clientY:point.y});
    const width=map.box[2],anchor=worldAt(svg,map.box,point);
    input(svg,'wheel',{ctrlKey:true,deltaY:direction*-20,clientX:point.x,clientY:point.y});
    assert(direction>0?map.box[2]<width:map.box[2]>width);
    worldAt(svg,map.box,point).forEach((v,i)=>near(v,anchor[i]));
    assert(map.box.every(Number.isFinite));
  }
});

test('Safari native gestures suppress duplicate wheel zoom and finish cleanly',()=> {
  const {svg,map}=setup(),point={x:600,y:300},anchor=worldAt(svg,map.box,point),width=map.box[2];
  assert(input(svg,'gesturestart',{scale:1}).defaultPrevented);
  input(svg,'gesturechange',{scale:1.5});near(map.box[2],width/1.5);
  const during=[...map.box];
  assert(input(svg,'wheel',{ctrlKey:true,deltaY:-20}).defaultPrevented);assert.deepEqual(map.box,during);
  input(svg,'gesturechange',{scale:1.2});near(map.box[2],width/1.2);
  worldAt(svg,map.box,point).forEach((v,i)=>near(v,anchor[i]));
  input(svg,'gestureend');input(svg,'wheel',{ctrlKey:true,deltaY:20});assert(map.box[2]>during[2]);
});

test('Two touch pointers can pinch and pan together, then continue dragging without a jump',()=> {
  const {svg,map}=setup();
  input(svg,'pointerdown',{pointerType:'touch',clientX:400,clientY:300});
  input(svg,'pointerdown',{pointerType:'touch',pointerId:2,clientX:600,clientY:300});
  const anchor=worldAt(svg,map.box,{x:500,y:300}),width=map.box[2];
  input(svg,'pointermove',{pointerType:'touch',pointerId:2,clientX:700,clientY:340});
  assert(map.box[2]<width);
  worldAt(svg,map.box,{x:550,y:320}).forEach((v,i)=>near(v,anchor[i]));
  const before=[...map.box];
  input(svg,'pointerup',{pointerType:'touch',pointerId:2});
  input(svg,'pointermove',{pointerType:'touch',clientX:400,clientY:300});assert.deepEqual(map.box,before);
  input(svg,'pointermove',{pointerType:'touch',clientX:430,clientY:320});assert(map.box[0]<before[0]);
  input(svg,'pointercancel',{pointerType:'touch'});const cancelled=[...map.box];
  input(svg,'pointermove',{pointerType:'touch',clientX:500,clientY:400});assert.deepEqual(map.box,cancelled);
  assert.equal(map.pointers.size,0);assert(map.dragged);
});

test('Safari touch gesture events do not double the two-pointer zoom',()=> {
  const {svg,map}=setup();
  input(svg,'pointerdown',{pointerType:'touch',clientX:400,clientY:300});
  input(svg,'pointerdown',{pointerType:'touch',pointerId:2,clientX:600,clientY:300});
  input(svg,'gesturestart',{scale:1});
  input(svg,'pointermove',{pointerType:'touch',pointerId:2,clientX:650,clientY:300});
  const box=[...map.box];input(svg,'gesturechange',{scale:1.25});assert.deepEqual(map.box,box);
});

test('Mouse drag survives wheel zoom and pointer capture loss without snapping back',()=> {
  const {svg,map}=setup();
  input(svg,'pointerdown',{clientX:400,clientY:300});
  input(svg,'pointermove',{clientX:440,clientY:320});
  input(svg,'wheel',{ctrlKey:true,deltaY:-30,clientX:440,clientY:320});
  const zoomed=[...map.box];
  input(svg,'pointermove',{clientX:440,clientY:320});assert.deepEqual(map.box,zoomed);
  input(svg,'pointermove',{clientX:460,clientY:320});assert(map.box[0]<zoomed[0]);
  svg.captures.clear();input(svg,'lostpointercapture');const released=[...map.box];
  input(svg,'pointermove',{clientX:500,clientY:320});assert.deepEqual(map.box,released);
});
