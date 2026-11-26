import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/connection-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,Simulation,LabSettings,computerView,connectionPanel}=globalThis.InternetLab;
const finish=s=>{for(let i=0;i<3000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,'success',s.current?.description);};

test('Wi-Fi discovers only available local radios, validates credentials and remembers them for this device session',()=>{
  const n=new Simulation().net;
  assert.deepEqual(n.wifiNetworks('laptop').map(x=>x.id),['ap']);
  assert(!n.connectWifi('laptop','friend-ap','matej1234'));assert(!n.connectWifi('laptop','ap','wrong'));assert.equal(n.access.laptop.mode,'cable');
  assert(n.connectWifi('laptop','ap','lipova1234'));assert(n.wifiKnown('laptop','ap'));assert.equal(n.nodes.laptop.ip,'192.168.10.11');
  assert(!n.wifiKnown('phone','ap'));assert(n.disconnectWifi('laptop'));assert.equal(n.access.laptop.mode,'cable');assert(n.connectWifi('laptop','ap'));
  n.wifiProfiles.ap.password='new-password';assert(!n.wifiKnown('laptop','ap'));n.disconnectWifi('laptop');assert(!n.connectWifi('laptop','ap'));assert(n.connectWifi('laptop','ap','new-password'));
  n.toggleNode('ap');assert.deepEqual(n.wifiNetworks('laptop'),[]);assert(!n.accessReady('laptop'));
  n.toggleNode('ap');n.toggleLink('laptop-wifi');assert.deepEqual(n.wifiNetworks('laptop'),[]);
});

test('Wi-Fi and mobile data have independent switches, with Wi-Fi selection and automatic mobile fallback',()=>{
  const s=new Simulation(),n=s.net;assert(n.connectionControls.phone.mobileEnabled);assert(n.connectionControls.phone.wifiEnabled);
  assert(n.connectWifi('phone','ap','lipova1234'));assert.equal(n.access.phone.mode,'wifi');assert(n.connectionControls.phone.mobileEnabled);
  assert(n.setWifiEnabled('phone',false));assert.equal(n.access.phone.mode,'cellular');assert(n.accessReady('phone'));assert(!n.connectWifi('phone','ap'));
  assert(n.setMobileData(false));assert.equal(n.access.phone.mode,'offline');assert(!n.accessReady('phone'));
  assert(n.setWifiEnabled('phone',true));assert.equal(n.access.phone.mode,'offline');assert(n.connectWifi('phone','ap'));
  assert(n.setMobileData(true));assert.equal(n.access.phone.mode,'wifi');assert(n.disconnectWifi('phone'));assert.equal(n.access.phone.mode,'cellular');
  assert(s.start('web',{device:'phone'}));finish(s);assert(n.phoneBrowser.content);
});

test('Wired access returns automatically after Wi-Fi disconnect, restoring the cable or powering its peer back on',()=>{
  const n=new Simulation().net;
  assert(n.connectWifi('laptop','ap','lipova1234'));assert(n.disconnectWifi('laptop'));assert.equal(n.access.laptop.mode,'cable');
  n.connectWifi('laptop','ap');n.toggleLink('laptop-switch');n.disconnectWifi('laptop');assert.equal(n.access.laptop.mode,'offline');
  n.toggleLink('laptop-switch');assert.equal(n.access.laptop.mode,'cable');assert(n.accessReady('laptop'));
  n.connectWifi('laptop','ap');n.toggleLink('laptop-switch');assert.equal(n.access.laptop.mode,'wifi');
  n.toggleLink('laptop-switch');assert.equal(n.access.laptop.mode,'cable');assert.equal(n.nodes.laptop.ip,'192.168.10.10');
  n.connectWifi('laptop','ap');n.toggleNode('switch');n.disconnectWifi('laptop');assert.equal(n.access.laptop.mode,'offline');
  n.toggleNode('switch');assert.equal(n.access.laptop.mode,'cable');assert(n.accessReady('laptop'));
});

test('Restart resets radio controls and learned credentials without resetting another device',()=>{
  const n=new Simulation().net;n.connectWifi('laptop','ap','lipova1234');n.connectWifi('phone','ap','lipova1234');
  n.setMobileData(false);n.setWifiEnabled('phone',false);n.toggleNode('phone');n.toggleNode('phone');
  assert(n.connectionControls.phone.mobileEnabled);assert(n.connectionControls.phone.wifiEnabled);assert(!n.wifiKnown('phone','ap'));
  assert.equal(n.access.phone.mode,'cellular');assert(n.wifiKnown('laptop','ap'));assert.equal(n.access.laptop.mode,'wifi');
});

test('Extension choices hide unavailable radios, while café authentication and attacker identities remain distinct',()=>{
  const basic=new Simulation(new Network(new LabSettings()));assert(!basic.net.setWifiEnabled('laptop',true));assert(!basic.net.connectWifi('laptop','ap','lipova1234'));assert(!basic.net.setMobileData(true));
  const html=connectionPanel(basic.net,'laptop',basic);assert(!html.includes('Ethernet'));assert(html.includes('Wi-Fi není k dispozici'));assert(!html.includes('data-network-toggle'));
  const s=new Simulation(),n=s.net;s.mitm.configure(true,'observe',n.cafeWifi.ssid);
  assert(!n.connectWifi('cafe','trusted'));assert(n.connectWifi('cafe','rogue'));assert.equal(n.access.cafe.hotspot,'rogue');assert(!n.wifiKnown('cafe','trusted'));
  assert(!n.connectWifi('cafe','trusted','wrong'));assert(n.connectWifi('cafe','trusted','kava1234'));
  assert(n.setWifiEnabled('cafe',false));assert.equal(n.access.cafe.mode,'offline');assert(!n.connectWifi('cafe','rogue'));
});

test('Flyout preserves the current application and keeps technical details and password fields out of the initial view',()=>{
  const s=new Simulation(),n=s.net;
  const html=computerView(n,s,{monitorDevice:'laptop',tab:'vpn',networkPanel:'laptop'});
  assert(html.includes('vpn-app'));assert(!html.includes('network-ethernet'));assert(!html.includes('>Ethernet<'));assert(html.indexOf('data-network-toggle="wifi"')<html.indexOf('id="wifi-network-list"'));assert(html.includes('id="connection-panel"'));assert(!html.includes('connection-modes'));
  assert(!html.includes('type="password"'));assert(html.includes('<details class="network-details" >'));assert(!html.includes('taskbar-app active" data-computer-app="network"'));
  const phone=computerView(n,s,{monitorDevice:'phone',phoneTab:'desktop',networkPanel:'phone'});assert(phone.includes('id="connection-panel-title">Wi-Fi</h3>'));assert(phone.includes('data-network-toggle="cellular"'));assert(!phone.includes('cell-tower'));
});
