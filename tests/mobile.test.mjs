import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/privacy.js';import '../js/auth.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/ads.js';import '../js/simulation.js';import '../js/map.js';import '../js/connection-ui.js';import '../js/computer.js';
import test from 'node:test';import assert from 'node:assert/strict';

const {Network,LabSettings,Simulation,computerView}=globalThis.InternetLab;
const create=()=>new Simulation(new Network(new LabSettings({features:['mobile','wifi']})));
const view=s=>computerView(s.net,s,{monitorDevice:'phone',phoneTab:'network'});
function finish(s,expected='success') {
  const events=[];
  for(let i=0;s.status==='running'&&i<2000;i++){s.advanceFrame();events.push(...structuredClone(s.frame));}
  assert.equal(s.status,expected,s.current?.description);return events;
}

test('Mobile data choose the nearest usable BTS automatically and stay off until explicitly enabled',()=>{
  const s=create(),n=s.net;
  assert.equal(n.access.phone.tower,'bts-lipova');
  Object.assign(n.nodes.phone,{x:1200,y:800});n.changed();assert.equal(n.access.phone.tower,'bts-park');
  assert.equal(n.visibleLinks().filter(l=>l.medium==='cellular'&&n.isActive(l)).length,1);
  n.setAccess('phone','offline');assert.equal(n.access.phone.tower,null);assert(!n.accessReady('phone'));
  n.toggleNode('bts-park');n.toggleNode('bts-park');assert.equal(n.access.phone.mode,'offline');assert.equal(n.access.phone.tower,null);
  n.setAccess('phone','wifi');assert.equal(n.access.phone.tower,null);assert(n.accessReady('phone'));
  n.toggleNode('bts-lipova');assert.equal(n.access.phone.mode,'wifi');assert.equal(n.access.phone.tower,null);
  n.setAccess('phone','cellular');assert.equal(n.access.phone.tower,'bts-park');assert(n.accessReady('phone'));
  n.toggleNode('phone');assert.equal(n.access.phone.tower,null);assert(!n.accessReady('phone'));
  n.toggleNode('phone');assert.equal(n.access.phone.tower,'bts-park');
});

test('Quick settings have data switches and passive BTS details, including no available station',()=>{
  const s=create(),n=s.net;
  const check=()=>{const html=view(s);assert(!/cell-tower|data-tower|ZÁKLADNOVÁ STANICE|undefined/.test(html));assert(html.includes('data-network-toggle="cellular"'));assert(html.includes('role="switch"'));assert(!html.includes('data-access-mode'));return html;};
  assert(check().includes('BTS · '+n.nodes[n.access.phone.tower].ip));
  n.toggleNode('bts-lipova');assert(check().includes('BTS · '+n.nodes[n.access.phone.tower].ip));
  n.toggleNode('bts-park');assert.equal(n.access.phone.tower,null);assert(!n.accessReady('phone'));
  const unavailable=check();assert(unavailable.includes('Mobilní síť není dostupná'));assert(unavailable.includes('Žádná dostupná BTS'));
  n.setMobileData(false);assert(check().includes('Nepřipojeno'));assert(!n.connectionControls.phone.mobileEnabled);
  n.toggleNode('bts-lipova');assert.equal(n.access.phone.mode,'offline');
  n.setAccess('phone','cellular');assert(check().includes('BTS · '+n.nodes[n.access.phone.tower].ip));
});

test('Losing the radio carrying an in-flight packet does not invent delivery; retry uses the new automatic BTS',()=>{
  const s=create();assert(s.start('web',{device:'phone',address:'http://knihovna.test/'}));
  for(let i=0;i<100&&!s.queue.some(e=>e.kind==='hop'&&e.link==='phone-bts-lipova');i++)s.advanceFrame();
  assert(s.queue.some(e=>e.kind==='hop'&&e.link==='phone-bts-lipova'));
  s.net.toggleNode('bts-lipova');assert.equal(s.net.access.phone.tower,'bts-park');finish(s,'failed');
  assert.equal(s.net.phoneBrowser.content,null);
  assert(s.repeat());const events=finish(s);
  assert.equal(s.net.phoneBrowser.content,s.net.server.title);
  assert(events.some(e=>e.kind==='hop'&&e.link==='phone-bts-park'));
  assert(!events.some(e=>e.kind==='hop'&&e.link==='phone-bts-lipova'));
});
