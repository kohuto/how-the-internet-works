import '../js/network.js';
import '../js/settings.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';
import '../js/mail.js';
import '../js/privacy.js';
import '../js/auth.js';
import '../js/ads.js';
import '../js/simulation.js';
import '../js/map.js';
import '../js/instagram-ui.js';
import '../js/browser-navigation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,Simulation,instagramView,BrowserNavigation}=globalThis.InternetLab;
const finish=s=>{for(let i=0;s.status==='running'&&i<6000;i++)s.advanceFrame();assert.notEqual(s.status,'running');};
const run=(s,type,payload)=>{assert(s.start(type,payload));finish(s);assert.equal(s.status,'success',s.current?.description);};
const until=(s,predicate)=>{for(let i=0;!predicate()&&s.status==='running'&&i<6000;i++)s.advanceFrame();assert(predicate());};
const instagram=(s,id)=>instagramView(s.net,s,{message:'',messageType:'text'},id);

test('Each client cold starts with its default access and empty applications while servers and another device stay intact',()=>{
  for(const [id,mode] of [['laptop','cable'],['friend','cable'],['phone','cellular'],['cabin','wifi'],['cafe','offline']]) {
    const s=new Simulation(),n=s.net,other=id==='laptop'?'friend':'laptop';
    if(id==='cafe')assert(n.setCafeHotspot('trusted',n.cafeWifi.password));
    else n.setAccess(id,id==='phone'?'wifi':mode==='wifi'?'cable':'wifi');
    run(s,'web',{device:id});assert(n.browserFor(id).content);
    n.browserFor(id).dnsCache.extra='203.0.113.10';n.browserFor(id).cookies.allowed=false;
    n.setVPN(id,true);n.setConnectionProfile(id,{bandwidth:'high',latency:'high'});
    Object.assign(n.phishing.clients[id],{inbox:{subject:'Místní kopie'},items:[{id:'old'}],sent:[{id:'sent'}],checked:true});
    if(n.cloud.clients[id]) {Object.assign(n.cloud.clients[id],{state:'ready',catalog:[{id:'old'}],listed:true});n.cloud.saveLocal(id,{name:'Zahodit.txt',content:'Místní změna'});}
    if(n.chatbot.clients[id])n.chatbot.clients[id].turns.push({prompt:'Starý dotaz',answer:'Stará odpověď'});
    n.ads.clients[id].cookie={value:'old'};n.ads.clients[id].allowed=false;
    n.server.privacy.clients[id].snapshot={old:true};
    const otherBrowser=structuredClone(n.browserFor(other)),files=structuredClone(n.cloud.files),visitors=structuredClone(n.server.cookies.visitors),accounts=structuredClone(n.server.auth.accounts);
    n.toggleNode(id);assert.equal(n.nodes[id].on,false);n.toggleNode(id);
    assert.equal(n.access[id].mode,mode,id);assert.equal(n.browserFor(id).content,null,id);
    assert.deepEqual(n.browserFor(id).dnsCache,{});assert.deepEqual(n.browserFor(id).cookies.items,[]);
    assert.equal(n.browserFor(id).cookies.session,undefined);assert(n.browserFor(id).cookies.allowed);
    assert.equal(n.server.auth.clients[id].user,null);assert.equal(n.server.privacy.clients[id].snapshot,null);
    assert.equal(n.vpn.clients[id].enabled,false);assert.equal(n.vpn.clients[id].peer,null);assert(n.vpn.clients[id].epoch>0);
    assert.deepEqual(n.connectionProfiles[id],{bandwidth:'low',latency:'low'});
    assert.deepEqual(n.phishing.clients[id].items,[]);assert.deepEqual(n.phishing.clients[id].sent,[]);assert.equal(n.phishing.clients[id].inbox,null);
    if(n.cloud.clients[id]){assert.deepEqual(n.cloud.clients[id].catalog,[]);assert(!n.cloud.clients[id].listed);assert(!n.cloud.local[id].some(f=>f.name==='Zahodit.txt'));}
    if(n.chatbot.clients[id])assert.deepEqual(n.chatbot.clients[id].turns,[]);
    assert.equal(n.ads.clients[id].cookie,null);assert(n.ads.clients[id].allowed);
    assert.deepEqual(n.browserFor(other),otherBrowser);assert.deepEqual(n.cloud.files,files);assert.deepEqual(n.server.cookies.visitors,visitors);assert.deepEqual(n.server.auth.accounts,accounts);
  }
});

test('Boot access respects selected extensions and the currently available BTS instead of restoring a previous Wi-Fi choice',()=>{
  const basic=new Simulation(new Network(new LabSettings({features:['friend','satellite']})));
  for(const id of ['laptop','friend','cabin']){basic.net.setAccess(id,'offline');basic.net.toggleNode(id);basic.net.toggleNode(id);}
  assert.equal(basic.net.access.laptop.mode,'cable');assert.equal(basic.net.access.friend.mode,'cable');
  assert.equal(basic.net.access.cabin.mode,'cable');
  const phoneOnly=new Simulation(new Network(new LabSettings({features:['phone']})));phoneOnly.net.setAccess('phone','offline');phoneOnly.net.toggleNode('phone');phoneOnly.net.toggleNode('phone');
  assert.equal(phoneOnly.net.access.phone.mode,'wifi');
  const full=new Simulation();full.net.setAccess('phone','wifi');full.net.toggleNode('bts-lipova');full.net.toggleNode('phone');full.net.toggleNode('phone');
  assert.equal(full.net.access.phone.mode,'cellular');assert.equal(full.net.access.phone.tower,'bts-park');
});

test('Power off cancels a pending web response and chatbot computation so a restarted device cannot receive stale results',()=>{
  const s=new Simulation();assert(s.start('web'));
  until(s,()=>[...s.packets.values()].some(p=>p.kind==='http-response'));
  const request=s.net.server.lastRequest;s.net.toggleNode('laptop');
  assert.equal(s.status,'failed');assert.equal(s.net.browser.state,'idle');assert.equal(s.net.browser.content,null);
  s.net.toggleNode('laptop');assert.equal(s.advanceFrame(),null);assert.equal(s.net.browser.content,null);assert.equal(s.net.server.lastRequest,request);
  run(s,'web');assert(s.net.browser.content);
  assert(s.start('chatbot',{device:'laptop',prompt:'Přerušit výpočet'}));until(s,()=>s.net.chatbot.server.state==='processing');
  s.net.toggleNode('laptop');assert.equal(s.status,'failed');assert.deepEqual(s.net.chatbot.clients.laptop.turns,[]);
  s.net.toggleNode('laptop');assert.equal(s.advanceFrame(),null);
  run(s,'chatbot',{device:'laptop',prompt:'Nový dotaz'});assert.equal(s.net.chatbot.clients.laptop.turns.length,1);
});

test('Resetting local mail never removes the server mailbox and accepted SMTP content',()=>{
  const s=new Simulation();assert(s.start('mail-send',{device:'laptop',target:'friend',subject:'Na serveru',body:'Zůstává uložené'}));
  until(s,()=>s.mail.entry.accepted);s.net.toggleNode('laptop');
  assert.equal(s.status,'failed');assert.deepEqual(s.net.phishing.clients.laptop.sent,[]);
  assert.equal(s.net.mail.boxes.friend[0].body,'Zůstává uložené');s.net.toggleNode('laptop');
  run(s,'mail-check',{device:'friend'});assert.equal(s.net.phishing.clients.friend.inbox.body,'Zůstává uložené');
  s.net.toggleNode('friend');s.net.toggleNode('friend');assert.deepEqual(s.net.phishing.clients.friend.items,[]);
  run(s,'mail-check',{device:'friend'});assert.equal(s.net.phishing.clients.friend.inbox.body,'Zůstává uložené');
});

test('Instagram clears only the restarted client history and still receives messages queued while it is off',()=>{
  const s=new Simulation();run(s,'message',{device:'laptop',text:'Starší zpráva'});
  assert(instagram(s,'friend').includes('Starší zpráva'));
  s.net.toggleNode('friend');assert(!instagram(s,'friend').includes('Starší zpráva'));
  assert(instagram(s,'laptop').includes('Starší zpráva'));assert.equal(s.net.instagram.text,'Starší zpráva');
  assert(s.start('message',{device:'laptop',text:'Čeká na zapnutí'}));finish(s);assert.equal(s.status,'waiting');
  s.net.toggleNode('friend');assert(s.resumePending());finish(s);assert.equal(s.status,'success');
  assert(instagram(s,'friend').includes('Čeká na zapnutí'));assert(!instagram(s,'friend').includes('Starší zpráva'));
});

test('Browser restart removes that device tabs, history and panels without changing another browser',()=>{
  const s=new Simulation(),nav=new BrowserNavigation(s.net);
  run(s,'web',{device:'laptop'});nav.sync(s);nav.capture('laptop');nav.add('laptop');nav.begin('laptop','https://obchod.test');
  nav.state('laptop').panel='cookies';nav.state('laptop').networkOpen=true;
  const other=structuredClone(nav.state('friend'));
  s.net.toggleNode('laptop');nav.reset('laptop');s.net.toggleNode('laptop');nav.sync(s);
  assert.equal(nav.state('laptop').tabs.length,1);assert.equal(nav.active('laptop').url,'');assert.equal(nav.active('laptop').draft,'');
  assert.deepEqual(nav.active('laptop').history,[]);assert.equal(nav.state('laptop').panel,null);assert(!nav.state('laptop').networkOpen);
  assert.equal(s.net.browser.content,null);assert.deepEqual(nav.state('friend'),other);
});

test('Attacker computers reset their local controls and cached administration without deleting remote captures',()=>{
  const s=new Simulation(),n=s.net;n.phishing.captures.set('saved',{username:'Ukázka'});
  Object.assign(n.phishing.hacker,{state:'ready',results:[{username:'Místní kopie'}],fetched:true});
  n.setVPN('hacker',true);n.toggleNode('hacker');n.toggleNode('hacker');
  assert.equal(n.vpn.clients.hacker.enabled,false);assert.deepEqual(n.phishing.hacker.results,[]);assert(n.phishing.captures.has('saved'));
  s.mitm.configure(true,'observe');n.mitm.ssid='Jiná síť';n.mitm.logs.push({label:'Starý záznam'});
  n.toggleNode('cafe-attacker');n.toggleNode('cafe-attacker');
  assert.equal(n.mitm.active,false);assert.equal(n.mitm.ssid,'Kavarna_free');assert.deepEqual(n.mitm.logs,[]);
});


test('Power off before an Instagram upload creates packets cannot send the old draft after boot',()=>{
  const s=new Simulation();assert(s.start('message',{device:'laptop',text:'Neposílat po zapnutí'}));
  assert.equal(s.packets.size,0);s.net.toggleNode('laptop');assert.equal(s.status,'failed');
  s.net.toggleNode('laptop');assert.equal(s.advanceFrame(),null);assert.equal(s.net.instagram.text,'');
  assert(!instagram(s,'laptop').includes('Neposílat po zapnutí'));
  run(s,'message',{device:'laptop',text:'Nová zpráva'});assert.equal(s.net.friend.text,'Nová zpráva');
});
