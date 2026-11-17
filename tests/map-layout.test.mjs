import '../js/network.js';
import '../js/cloud.js';
import '../js/settings.js';
import '../js/map.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,NetworkMap,MAP_LAYOUT}=globalThis.InternetLab;
const net=new Network(LabSettings.full());
const peripheral=Object.entries(MAP_LAYOUT.bounds).filter(([region])=>!['city','peer'].includes(region));
function owns(region,ends){return ends.includes(region)||['cabin','satellite'].includes(region)&&ends.some(r=>['cabin','satellite'].includes(r));}
function intersects(a,b,[x,y,w,h],padding=10){
  let first=0,last=1;
  for(const [start,delta,min,max] of [[a.x,b.x-a.x,x-padding,x+w+padding],[a.y,b.y-a.y,y-padding,y+h+padding]]){
    if(delta===0){if(start<min||start>max)return false;continue;}
    const atMin=(min-start)/delta,atMax=(max-start)/delta;
    first=Math.max(first,Math.min(atMin,atMax));last=Math.min(last,Math.max(atMin,atMax));
    if(first>last)return false;
  }
  return first<=last;
}

test('Routers and their halos stay outside unrelated peripheral areas',()=>{
  const collisions=[];
  for(const n of Object.values(net.nodes).filter(n=>n.type==='router'))for(const [region,[x,y,w,h]] of peripheral){
    if(owns(region,[n.region]))continue;
    const dx=n.x-Math.max(x,Math.min(x+w,n.x)),dy=n.y-Math.max(y,Math.min(y+h,n.y));
    if(Math.hypot(dx,dy)<43)collisions.push(`${n.id} / ${region}`);
  }
  assert.deepEqual(collisions,[]);
});

test('Every connection avoids the reserved area of unrelated homes and services',()=>{
  const collisions=[];
  for(const link of Object.values(net.links)){
    const a=net.nodes[link.a],b=net.nodes[link.b];
    for(const [region,box] of peripheral)if(!owns(region,[a.region,b.region])&&intersects(a,b,box))collisions.push(`${link.id} / ${region}`);
  }
  assert.deepEqual(collisions,[]);
});

test('The full and base camera bounds contain each visible device and its halo',()=>{
  for(const settings of [new LabSettings(),LabSettings.full()]){
    const net=new Network(settings),[x,y,w,h]=NetworkMap.prototype.networkBounds.call({net});
    for(const n of net.visibleNodes())assert(n.x-43>=x&&n.x+43<=x+w&&n.y-43>=y&&n.y+43<=y+h,`${n.id} must remain in the fitted view`);
  }
});
