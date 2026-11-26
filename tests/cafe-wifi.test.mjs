import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mitm-ui.js';import '../js/connection-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,connectionPanel,computerView,mitmApp,MITM_TITLE}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['mitm']})));
function finish(s,expected='success'){for(let i=0;i<2000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,expected,s.current?.description);}
const web=s=>s.start('web',{device:'cafe',address:'http://knihovna.test/'});

test('Cafe starts offline and trusted Wi-Fi requires the correct password with no generic Wi-Fi bypass',()=>{
 const s=create(),n=s.net;assert.equal(n.access.cafe.mode,'offline');assert(!n.accessReady('cafe'));
 assert.deepEqual(n.cafeNetworks(),[{id:'trusted',ssid:n.cafeWifi.ssid,secured:true}]);
 assert(web(s));finish(s,'failed');assert.equal(n.mitm.logs.length,0);
 for(const password of ['', 'nespravne']){assert(!n.setCafeHotspot('trusted',password));assert.equal(n.access.cafe.mode,'offline');}
 assert(!n.setAccess('cafe','wifi'));assert(!n.setCafeHotspot('rogue'));
 assert(n.setCafeHotspot('trusted',n.cafeWifi.password));assert(n.accessReady('cafe'));assert(web(s));finish(s);assert.equal(n.cafeBrowser.content,n.server.title);assert.equal(n.mitm.logs.length,0);
});
test('Only a broadcasting attacker hotspot appears under its chosen name and it never connects the guest automatically',()=>{
 const s=create(),n=s.net;assert(s.mitm.configure(false,'http','Wi-Fi zdarma'));
 assert(!n.cafeNetworks().some(x=>x.id==='rogue'));assert(!n.setCafeHotspot('rogue'));
 assert(s.mitm.configure(true));assert(n.cafeNetworks().some(x=>x.id==='rogue'&&x.ssid==='Wi-Fi zdarma'&&!x.secured));assert(!n.accessReady('cafe'));
 assert(n.setCafeHotspot('rogue'));assert(web(s));finish(s);assert.equal(n.cafeBrowser.content,MITM_TITLE);assert(n.mitm.logs.some(r=>r.changed));
 assert(n.setCafeHotspot('trusted',n.cafeWifi.password));assert(web(s));finish(s);assert.equal(n.cafeBrowser.content,n.server.title);
});
test('Switching off or renaming the selected hotspot disconnects the guest and ends an in-flight transfer without fallback or automatic reconnection',()=>{
 const s=create(),n=s.net;s.mitm.configure(true,'http','Pokus');n.setCafeHotspot('rogue');
 assert(web(s));s.advanceFrame();assert(s.mitm.configure(true,'http','Novy nazev'));assert.equal(s.status,'failed');assert.equal(n.access.cafe.mode,'offline');assert(!n.accessReady('cafe'));
 assert(n.setCafeHotspot('rogue'));s.mitm.configure(false);assert(!n.cafeNetworks().some(x=>x.id==='rogue'));assert(!n.accessReady('cafe'));
 s.mitm.configure(true);assert(!n.accessReady('cafe'));assert(n.setCafeHotspot('rogue'));
 n.toggleNode('cafe-attacker');assert.equal(n.access.cafe.mode,'offline');assert(!n.cafeNetworks().some(x=>x.id==='rogue'));
 n.toggleNode('cafe-attacker');assert(!n.accessReady('cafe'));assert(n.setCafeHotspot('trusted',n.cafeWifi.password));
 n.toggleNode('cafe-ap');assert.equal(n.access.cafe.mode,'offline');assert(!n.cafeNetworks().some(x=>x.id==='trusted'));
 n.toggleNode('cafe-ap');assert(!n.accessReady('cafe'));assert(!n.setCafeHotspot('trusted',''));assert(n.setCafeHotspot('trusted',n.cafeWifi.password));
});
test('Names remain distinct from network identity, allow matching SSIDs and are safely displayed as text',()=>{
 const s=create(),n=s.net;s.mitm.configure(true,'observe',n.cafeWifi.ssid);
 assert.equal(n.cafeNetworks().length,2);assert.equal(n.cafeNetworks()[0].ssid,n.cafeNetworks()[1].ssid);
 assert(!n.setCafeHotspot('trusted'));assert(n.setCafeHotspot('rogue'));
 const unsafe='<img src=x onerror=alert(1)>';s.mitm.configure(true,'observe',unsafe);assert(n.setCafeHotspot('rogue'));
 const guest=computerView(n,s,{monitorDevice:'cafe',cafeTab:'network'}),attacker=mitmApp(n,s,{mitmSsid:unsafe});
 for(const html of [guest,attacker]){assert(html.includes('&lt;img'));assert(!html.includes('<img'));}
 for(const invalid of ['', ' ', 'x'.repeat(33), 'a\nb'])assert(!s.mitm.configure(true,'observe',invalid));
 assert.equal(n.mitm.ssid,unsafe);assert(!attacker.includes('data-action="cafe-connect-rogue"'));
 s.mitm.configure(false);assert(!connectionPanel(n,'cafe',s).includes('data-wifi-network="rogue"'));
 const form=connectionPanel(n,'cafe',s,{networkDrafts:{cafe:{selected:'trusted',passwordStep:true,password:'" autofocus="x',error:'Chybné heslo'}}});
 assert(form.includes('data-form="wifi-connect"'));assert(form.includes('type="password"'));assert(form.includes('role="alert"'));assert(form.includes('&quot; autofocus=&quot;'));
});
test('A Wi-Fi access point stays discoverable with a broken internet uplink, but web delivery still fails',()=>{
 const s=create(),n=s.net;n.toggleLink('cafe-uplink');assert(n.cafeNetworks().some(x=>x.id==='trusted'));
 assert(n.setCafeHotspot('trusted',n.cafeWifi.password));assert(n.accessReady('cafe'));assert(web(s));finish(s,'failed');
});
