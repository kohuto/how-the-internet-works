import '../js/network.js';
import '../js/cloud.js';
import '../js/settings.js';
import '../js/map.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,NetworkMap,MAP_LAYOUT,LAB_FEATURES}=globalThis.InternetLab;
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

test('Connections meet only at their shared device, without crossings or overlapping stretches',()=>{
  const links=Object.values(net.links),collisions=[];
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const on=(a,b,p)=>cross(a,b,p)===0&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);
  for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){
    const a=links[i],b=links[j],shared=[a.a,a.b].find(id=>[b.a,b.b].includes(id));
    const [p,q,r,s]=[a.a,a.b,b.a,b.b].map(id=>net.nodes[id]);
    if(shared){
      const origin=net.nodes[shared],u=net.nodes[a.a===shared?a.b:a.a],v=net.nodes[b.a===shared?b.b:b.a];
      if(cross(origin,u,v)===0&&(u.x-origin.x)*(v.x-origin.x)+(u.y-origin.y)*(v.y-origin.y)>0)collisions.push(`${a.id} overlaps ${b.id}`);
    }else{
      const crossing=cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0;
      const touching=[on(p,q,r),on(p,q,s),on(r,s,p),on(r,s,q)].some(Boolean);
      if(crossing||touching)collisions.push(`${a.id} crosses ${b.id}`);
    }
  }
  assert.deepEqual(collisions,[]);
});

test('A connection stays clear of the halo of every device it does not connect',()=>{
  const collisions=[];
  for(const l of Object.values(net.links)){
    const a=net.nodes[l.a],b=net.nodes[l.b],dx=b.x-a.x,dy=b.y-a.y;
    for(const n of Object.values(net.nodes))if(![l.a,l.b].includes(n.id)){
      const t=Math.max(0,Math.min(1,((n.x-a.x)*dx+(n.y-a.y)*dy)/(dx*dx+dy*dy)));
      if(Math.hypot(n.x-a.x-t*dx,n.y-a.y-t*dy)<43)collisions.push(`${l.id} / ${n.id}`);
    }
  }
  assert.deepEqual(collisions,[]);
});

test('No connection needs a long stretch across the map',()=>{
  const long=Object.values(net.links).filter(l=>Math.hypot(net.nodes[l.a].x-net.nodes[l.b].x,net.nodes[l.a].y-net.nodes[l.b].y)>600);
  assert.deepEqual(long.map(l=>l.id),[]);
});

test('The full, base and individual extension camera bounds contain devices and their two-line labels',()=>{
  for(const settings of [new LabSettings(),LabSettings.full(),...LAB_FEATURES.map(f=>new LabSettings({features:[f.id]}))]){
    const net=new Network(settings),[x,y,w,h]=NetworkMap.prototype.networkBounds.call({net});
    for(const n of net.visibleNodes())assert(n.x-43>=x&&n.x+43<=x+w&&n.y-43>=y&&n.y+96<=y+h,`${n.id} and its label must remain in the fitted view`);
  }
});
