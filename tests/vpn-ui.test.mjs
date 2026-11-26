import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/mitm-ui.js';import '../js/connection-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Network,LabSettings,Simulation,computerView}=globalThis.InternetLab;
const clients=['laptop','friend','phone','cabin','hacker','cafe'];
const create=(vpn=true)=>new Simulation(new Network(new LabSettings({features:[...(vpn?['vpn']:[]),'friend','phone','satellite','hacker','mitm']})));
const view=(s,id='laptop',tab='vpn')=>computerView(s.net,s,{monitorDevice:id,tab,friendTab:tab,phoneTab:tab,cabinTab:tab,hackerTab:tab,cafeTab:tab,cafeAttackerTab:tab});
function finish(s,expected='success'){for(let i=0;i<30000&&s.status==='running';i++)s.advanceFrame();assert.equal(s.status,expected,s.current?.description);}
function web(s,id='laptop'){assert(s.start('web',{device:id,address:'http://knihovna.test/'}));finish(s);}

test('The optional VPN app belongs to each real client, and physical connection settings have no VPN control',()=>{
  for(const enabled of [false,true]){
    const s=create(enabled);
    for(const id of clients){
      assert.equal(s.net.appAvailable('vpn',id),enabled,id);
      assert.equal(view(s,id,'desktop').includes('data-computer-app="vpn"'),enabled,id);
      assert.equal(view(s,id).includes('data-action="vpn-toggle"'),enabled,id);
      const connection=view(s,id,'network');
      assert(!connection.includes('data-action="vpn-toggle"'),id);assert(!connection.includes('data-vpn='),id);
    }
    for(const id of ['cafe-attacker','vpn','web'])assert(!s.net.appAvailable('vpn',id),id);
    assert(!view(s,'cafe-attacker','desktop').includes('data-computer-app="vpn"'));
  }
});

test('VPN app follows the real tunnel lifecycle without claiming a connection before the first transfer',()=>{
  const s=create(),n=s.net,access=structuredClone(n.access.laptop);
  assert(view(s).includes('vpn-off'));assert(view(s).includes('aria-label="Připojit VPN"'));
  assert(n.setVPN('laptop',true));assert(!n.vpnPeerValid('laptop'));
  assert(view(s).includes('vpn-ready'));assert(view(s).includes('aria-label="Odpojit VPN"'));
  assert(!view(s).includes('vpn-connected'));assert.deepEqual(n.access.laptop,access);
  web(s);assert(n.vpnPeerValid('laptop'));assert(view(s).includes('vpn-connected'));
  assert.equal(n.server.lastRequest.sourceIp,n.vpn.clients.laptop.ip);
  assert(n.vpn.clients.laptop.sent>0&&n.vpn.clients.laptop.received>0);
  assert(n.setVPN('laptop',false));assert(!n.vpnPeerValid('laptop'));assert(view(s).includes('vpn-off'));
  web(s);assert.equal(n.server.lastRequest.sourceIp,n.nodes.laptop.ip);
});

test('Unavailable VPN is shown honestly, can be disabled, and never falls back to an unprotected transfer',()=>{
  for(const failure of ['server','access']){
    const s=create(),n=s.net;n.setVPN('laptop',true);web(s);
    if(failure==='server')n.toggleNode('vpn');else n.setAccess('laptop','offline');
    assert(!n.vpnPeerValid('laptop'));assert(view(s).includes('vpn-unavailable'));
    assert(view(s).includes('aria-label="Odpojit VPN"'));
    const lastRequest=n.server.lastRequest;assert(lastRequest);assert(s.start('web',{device:'laptop',address:'http://knihovna.test/'}));finish(s,'failed');
    assert.equal(n.server.lastRequest,lastRequest);
    assert(n.setVPN('laptop',false));assert(view(s).includes('vpn-off'));
  }
});

test('Client VPN apps keep independent state, including the cafe guest before and after Wi-Fi selection',()=>{
  const s=create(),n=s.net;n.setVPN('phone',true);
  assert(view(s,'phone').includes('vpn-ready'));assert(view(s,'friend').includes('vpn-off'));
  n.setVPN('cafe',true);assert(view(s,'cafe').includes('vpn-unavailable'));
  assert(n.setCafeHotspot('trusted',n.cafeWifi.password));assert(view(s,'cafe').includes('vpn-ready'));
  web(s,'cafe');assert(view(s,'cafe').includes('vpn-connected'));assert(view(s,'phone').includes('vpn-ready'));
  assert(!n.vpnPeerValid('phone'));assert(!n.vpn.clients.laptop.enabled);
});
