import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/cloud-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,cloudApp,filesApp,computerView}=globalThis.InternetLab;
const state=(device='laptop',extra={})=>({monitorDevice:device,phoneTab:'cloud',files:{[device]:{view:'files',editorKey:0,localId:null,name:'',content:''}},cloud:{[device]:{view:'files',editorKey:0,remoteId:null,remoteVersion:null,cloudName:'',cloudContent:'',shareId:null,shareUser:'',...extra}}});
function finish(s){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success');}
function sharedFile(s){
  const storage=s.net.cloud,response=storage.handle('friend',{op:'upload',name:'Sdílený test.txt',content:'Obsah přijatý ze serveru.'});
  const file=storage.files.get(response.saved.id);storage.handle('friend',{op:'permissions',fileId:file.id,userId:'ty',permission:'read',aclVersion:file.aclVersion});storage.applyReplica(storage.snapshot());return file;
}

test('The file browser and preview show only received data, not the omniscient server storage',()=>{
  const s=new Simulation(),ui=state(),file=sharedFile(s);
  assert(!cloudApp(s.net,s,ui,'laptop').includes(file.name));
  assert(s.start('cloud',{device:'laptop',request:{op:'list'}}));finish(s);
  const listed=cloudApp(s.net,s,ui,'laptop');assert(listed.includes(file.name));assert(!listed.includes(file.content));
  Object.assign(ui.cloud.laptop,{view:'preview',remoteId:file.id});
  assert(s.start('cloud',{device:'laptop',request:{op:'download',fileId:file.id},preview:true}));
  assert(!cloudApp(s.net,s,ui,'laptop').includes(file.content));finish(s);
  assert(cloudApp(s.net,s,ui,'laptop').includes(file.content));
});

test('Document names, local drafts and received preview text are escaped',()=>{
  const s=new Simulation(),unsafe='</textarea><script>alert(1)</script>',ui=state('laptop',{view:'editor',cloudName:'" onfocus="alert(1)',cloudContent:unsafe});
  const editor=cloudApp(s.net,s,ui,'laptop');assert(editor.includes('&lt;script&gt;'));assert(!editor.includes('<script>'));assert(editor.includes('&quot; onfocus='));
  s.net.cloud.clients.laptop.preview={id:'cloud-1',server:'cloud',name:unsafe,content:unsafe};
  Object.assign(ui.cloud.laptop,{view:'preview',remoteId:'cloud-1'});
  const preview=cloudApp(s.net,s,ui,'laptop');assert(preview.includes('&lt;script&gt;'));assert(!preview.includes('<script>'));
});

test('The phone offers separate Cloud and Files applications with its own local documents',()=>{
  const s=new Simulation(),ui=state('phone');
  const view=computerView(s.net,s,ui);assert(view.includes('data-computer-app="cloud"'));assert(view.includes('data-computer-app="files"'));assert(!view.includes('data-cloud-tab="local"'));ui.phoneTab='files';assert(computerView(s.net,s,ui).includes('V tomto telefonu'));assert(view.includes('drive-app'));
});


test('Cloud lists only remote replies and offers creating or uploading through Add',()=>{
  const s=new Simulation(),ui=state(),local=s.net.cloud.local.laptop[0],remote=sharedFile(s);
  assert(s.start('cloud',{device:'laptop',request:{op:'list'}}));finish(s);
  const html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('class="drive-add"'));assert(html.includes('Textový dokument'));assert(html.includes('Nahrát z počítače'));
  assert(!html.includes(local.name));assert(!html.includes('data-cloud-tab'));assert(!html.includes('Uložit v počítači'));
  const files=filesApp(s.net,s,ui,'laptop');assert(files.includes(local.name));assert(!files.includes(remote.name));assert(!files.includes('data-cloud-download'));
});

test('Creating and editing directly on Cloud never creates a local file',()=>{
  const s=new Simulation(),ui=state('laptop',{view:'editor',cloudName:'Pouze na cloudu.txt',cloudContent:'Vzdálený obsah'}),before=structuredClone(s.net.cloud.local);
  const html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('data-form="cloud-save"'));assert(!html.includes('data-form="files-save"'));assert(!html.includes('Uložit v počítači'));
  assert(s.start('cloud',{device:'laptop',request:{op:'upload',name:ui.cloud.laptop.cloudName,content:ui.cloud.laptop.cloudContent}}));finish(s);
  const file=[...s.net.cloud.files.values()].at(-1);assert.equal(file.content,'Vzdálený obsah');assert.deepEqual(s.net.cloud.local,before);
  assert(s.start('cloud',{device:'laptop',request:{op:'upload',fileId:file.id,version:file.version,name:file.name,content:'Nová vzdálená verze'}}));finish(s);
  assert.equal(s.net.cloud.files.get(file.id).content,'Nová vzdálená verze');assert.deepEqual(s.net.cloud.local,before);
});

test('The upload picker reads only this device files and a completed upload preserves the local original',()=>{
  const s=new Simulation(),f=s.net.cloud.local.laptop[0],ui=state('laptop',{uploadOpen:true,uploadId:f.id}),before=structuredClone(s.net.cloud.local.laptop);
  const html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('role="dialog"'));assert(html.includes(f.name));assert(!html.includes(s.net.cloud.local.friend[0].name));assert(html.includes('aria-pressed="true"'));
  assert.deepEqual(s.net.cloud.local.laptop,before);
  assert(s.start('cloud',{device:'laptop',localId:f.id,request:{op:'upload',name:f.name,content:f.content}}));finish(s);
  assert.equal(s.net.cloud.local.laptop.length,before.length);assert.equal(f.content,before[0].content);assert.equal(s.net.cloud.files.get(f.cloudId).content,f.content);
  ui.cloud.laptop.uploadOpen=false;assert(!cloudApp(s.net,s,ui,'laptop').includes('role="dialog"'));
});

test('Local files work offline and cloud downloads appear only in Files',()=>{
  const s=new Simulation(),ui=state(),remote=sharedFile(s);s.net.setAccess('laptop','offline');const run=s.run;
  const f=s.net.cloud.saveLocal('laptop',{name:'Offline.txt',content:'Místní práce'});assert(f);assert(filesApp(s.net,s,ui,'laptop').includes('Offline.txt'));assert.equal(s.run,run);
  s.net.setAccess('laptop','cable');assert(s.start('cloud',{device:'laptop',request:{op:'download',fileId:remote.id}}));finish(s);
  const downloaded=s.net.cloud.local.laptop.at(-1);assert.equal(downloaded.cloudId,remote.id);assert(filesApp(s.net,s,ui,'laptop').includes(downloaded.name));
  ui.cloud.laptop.downloadNotice=downloaded.id;const html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('Soubor je uložený v aplikaci Soubory.'));assert(!html.includes('data-cloud-tab="local"'));
});

test('Cloud has no storage selector or technical menu and read-only files still cannot be edited',()=>{
  const s=new Simulation(),ui=state();
  for(const device of ['laptop','friend','cabin','phone']){
    const html=cloudApp(s.net,s,state(device),device);
    for(const removed of ['data-cloud-center','drive-options','Prohlédnout server','Stáhnout podle ID','Záložní kopie'])assert(!html.includes(removed));
    assert(html.includes('data-action="cloud-new"'));assert(html.includes('data-action="cloud-picker-open"'));
  }
  const f=sharedFile(s);assert(s.start('cloud',{device:'laptop',request:{op:'download',fileId:f.id},preview:true}));finish(s);Object.assign(ui.cloud.laptop,{view:'preview',remoteId:f.id});
  assert(!cloudApp(s.net,s,ui,'laptop').includes('data-form="cloud-save"'));assert(!cloudApp(s.net,s,ui,'laptop').includes('data-action="cloud-edit"'));
});


test('Owners can share from the file list or preview; another user cannot reshare their file',()=>{
  const s=new Simulation(),storage=s.net.cloud,reply=storage.handle('laptop',{op:'upload',name:'Soukromý.txt',content:'Vlastní text'}),file=storage.files.get(reply.saved.id),ui=state();
  storage.receive('laptop',reply);
  let html=cloudApp(s.net,s,ui,'laptop');assert(html.includes(`data-cloud-share="${file.id}"`));assert(html.includes('Soukromý soubor'));
  Object.assign(ui.cloud.laptop,{shareId:file.id,shareUser:'matej'});
  html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('Sdílet soubor'));assert(html.includes('value="matej"'));assert(!html.includes('cloud-share-permission'));assert(!html.includes('Oprávnění</label>'));assert(!html.includes('Může číst'));assert(!html.includes('data-cloud-revoke'));
  assert.equal(file.permissions.matej,undefined,'Opening the dialog must not change server permissions');
  storage.receive('laptop',storage.handle('laptop',{op:'permissions',fileId:file.id,userId:'matej',permission:'write',aclVersion:file.aclVersion}));
  html=cloudApp(s.net,s,ui,'laptop');assert(html.includes('data-cloud-revoke'));assert(html.includes('Sdíleno · Matěj'));
  storage.receive('friend',storage.handle('friend',{op:'list'}));const friend=state('friend',{shareId:file.id});
  const shared=cloudApp(s.net,s,friend,'friend');assert(!shared.includes('data-cloud-share='));assert(!shared.includes('cloud-share-title'));
  Object.assign(ui.cloud.laptop,{shareId:null,view:'preview',remoteId:file.id});storage.clients.laptop.preview={...storage.metadata(file,'laptop'),content:file.content,server:'cloud'};
  assert(cloudApp(s.net,s,ui,'laptop').includes(`data-cloud-share="${file.id}"`));
});


test('An opened cloud editor keeps its draft and offers save, sharing and download without an Edit step',()=>{
  const s=new Simulation(),storage=s.net.cloud,reply=storage.handle('laptop',{op:'upload',name:'Původní.txt',content:'Uložený text'}),file=storage.files.get(reply.saved.id);
  storage.receive('laptop',reply);storage.clients.laptop.preview={...storage.metadata(file,'laptop'),content:file.content,server:'cloud'};
  const ui=state('laptop',{view:'editor',remoteId:file.id,remoteVersion:file.version,cloudName:'Rozepsaný název.txt',cloudContent:'Neuložené změny'}),before=structuredClone(ui);
  let html=cloudApp(s.net,s,ui,'laptop');
  assert(html.includes('data-form="cloud-save"'));assert(html.includes('Uložit změny na cloud'));assert(html.includes('Neuložené změny'));assert(html.includes('Rozepsaný název.txt'));
  assert(html.includes(`data-cloud-share="${file.id}"`));assert(html.includes(`data-cloud-download="${file.id}"`));assert(!html.includes('data-action="cloud-edit"'));
  assert.deepEqual(ui,before);assert.equal(file.content,'Uložený text');
  storage.handle('laptop',{op:'permissions',fileId:file.id,userId:'matej',permission:'write',aclVersion:file.aclVersion});storage.receive('friend',storage.handle('friend',{op:'list'}));
  html=cloudApp(s.net,s,state('friend',{view:'editor',remoteId:file.id,remoteVersion:file.version,cloudName:file.name,cloudContent:file.content}),'friend');
  assert(html.includes('Uložit změny na cloud'));assert(!html.includes('data-cloud-share='));assert(html.includes('data-cloud-download='));
});
