import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/cloud-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,cloudApp,computerView}=globalThis.InternetLab;
const state=(device='laptop',extra={})=>({monitorDevice:device,phoneTab:'cloud',cloud:{[device]:{tab:'remote',view:'files',server:'cloud',remoteId:null,localId:null,cloudName:'',cloudContent:'',cloudFileId:'',permissions:{},...extra}}});
function finish(s){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success');}

test('The file browser and preview show only received data, not the omniscient server storage',()=>{
  const s=new Simulation(),ui=state(),file=s.net.cloud.files.get('cloud-1');
  assert(!cloudApp(s.net,s,ui,'laptop').includes(file.name));
  assert(s.start('cloud',{device:'laptop',request:{op:'list'}}));finish(s);
  const listed=cloudApp(s.net,s,ui,'laptop');assert(listed.includes(file.name));assert(!listed.includes(file.content));
  Object.assign(ui.cloud.laptop,{view:'preview',remoteId:file.id});
  assert(s.start('cloud',{device:'laptop',request:{op:'download',fileId:file.id},preview:true}));
  assert(!cloudApp(s.net,s,ui,'laptop').includes(file.content));finish(s);
  assert(cloudApp(s.net,s,ui,'laptop').includes(file.content));
});

test('Document names, local drafts and received preview text are escaped',()=>{
  const s=new Simulation(),unsafe='</textarea><script>alert(1)</script>',ui=state('laptop',{view:'editor',tab:'local',cloudName:'" onfocus="alert(1)',cloudContent:unsafe});
  const editor=cloudApp(s.net,s,ui,'laptop');assert(editor.includes('&lt;script&gt;'));assert(!editor.includes('<script>'));assert(editor.includes('&quot; onfocus='));
  s.net.cloud.clients.laptop.preview={id:'cloud-1',server:'cloud',name:unsafe,content:unsafe};
  Object.assign(ui.cloud.laptop,{view:'preview',remoteId:'cloud-1'});
  const preview=cloudApp(s.net,s,ui,'laptop');assert(preview.includes('&lt;script&gt;'));assert(!preview.includes('<script>'));
});

test('The phone offers the Cloud application and its own local document location',()=>{
  const s=new Simulation(),ui=state('phone');
  const view=computerView(s.net,s,ui);assert(view.includes('data-computer-app="cloud"'));assert(view.includes('V telefonu'));assert(view.includes('drive-app'));
});
