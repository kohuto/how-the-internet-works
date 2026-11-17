import '../js/network.js';
import '../js/settings.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/privacy.js';
import '../js/auth.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';
import '../js/mail.js';
import '../js/ads.js';
import '../js/simulation.js';
import '../js/map.js';
import '../js/packet-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,Simulation,LabSettings,LAB_DETAILS,packetView}=globalThis.InternetLab;
const network=(features=[],details={})=>new Network(new LabSettings({features,details}));
function finish(sim) {
  for(let i=0;sim.status==='running'&&i<4000;i++)sim.advanceFrame();
  assert.equal(sim.status,'success',sim.current?.description);
}
function run(net,type='web',payload={}) {
  const sim=new Simulation(net);assert(sim.start(type,payload));finish(sim);return sim;
}
const packet=(sim,kind)=>[...sim.packets.values()].find(p=>p.kind===kind);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(' ');

test('TTL and TCP are independent session-only details; payload is always available',()=>{
  const settings=new LabSettings();
  assert.equal(settings.details.ttl,false);assert.equal(settings.details.tcp,false);
  assert(!LAB_DETAILS.some(d=>d.id==='payload'));
  for(const id of ['ttl','tcp'])assert.equal(LabSettings.full().details[id],true);
  const restored=new LabSettings(new LabSettings({details:{ttl:true,tcp:false}}).toJSON());
  assert.equal(restored.details.ttl,true);assert.equal(restored.details.tcp,false);
  assert(settings.sameNetwork(restored));
});

test('Base HTTP reveals request and received HTML, keeps MAC addresses and hides TTL and TCP fields',()=>{
  const net=network(),sim=run(net),request=packet(sim,'http-request'),response=packet(sim,'http-response');
  const html=packetView(net,request);
  assert(html.includes('GET / HTTP/1.1'));assert(html.includes('Host: knihovna.test'));
  assert(html.includes(request.src));assert(html.includes(request.dst));
  assert(html.includes('Ethernetový rámec'));assert(html.includes(request.frame.src));
  assert(!html.includes('TTL'));assert(!html.includes('TCP HLAVIČKA'));
  assert(!html.includes('Zdrojový port'));assert(!html.includes('SEQ'));
  const body=packetView(net,response);
  assert(body.includes('HTTP/1.1 200 OK'));assert(body.includes('&lt;h1&gt;Dnes otevřeno do 16 hodin&lt;/h1&gt;'));
  assert(!body.includes('<h1>'),'Received markup must be displayed as text');
});

test('All four TTL/TCP combinations change only their fields and preserve packet bytes and headers',()=>{
  const net=network(),sim=run(net),p=packet(sim,'http-request'),before=structuredClone(p);
  for(const ttl of [false,true])for(const tcp of [false,true]) {
    net.settings=new LabSettings({details:{ttl,tcp}});
    const html=packetView(net,p);
    assert.equal(html.includes('<dt>TTL</dt>'),ttl);
    assert.equal(html.includes('TCP HLAVIČKA'),tcp);
    assert.equal(html.includes('Pořadové číslo TCP'),tcp);
    if(tcp)assert(html.includes(`${p.sport} → ${p.dport}`));
    assert(html.includes('GET / HTTP/1.1'));
    assert.deepEqual(p,before);
  }
});

test('Individual photo bytes remain visible with TCP hidden; lesson labels and all histories stay absent even with every detail enabled',()=>{
  const net=network(['instagram']),sim=run(net,'message',{messageType:'image'});
  const p=[...sim.packets.values()].find(p=>p.kind==='message'&&p.payload.index===5);
  const photo=packetView(net,p);
  assert(photo.includes(hex(p.payload.bytes.slice(0,64))));
  assert(photo.includes('1440 B'));assert(!photo.includes('TCP HLAVIČKA'));
  const observed=structuredClone(p);
  Object.assign(observed,{state:'lost',location:'edge',natHistory:[{secret:'HISTORY-NAT'}],vpnHistory:[{secret:'HISTORY-VPN'}],satelliteHistory:[{secret:'HISTORY-SAT'}],mitmHistory:[{secret:'HISTORY-MITM'}]});
  net.settings=LabSettings.full();
  const full=packetView(net,observed);
  for(const text of [p.label,p.id,'Pokus','Ztracený paket','Doručený paket','Paket v přenosu','Router A','Pomůcka modelu','část 6','7001','8400','12000','HISTORY-','Spojení:','NAT ·','průchod'])assert(!full.includes(text),text);
  assert(full.includes('TCP HLAVIČKA'));assert(full.includes('Pořadové číslo TCP'));
});

test('TLS shows public handshake and encrypted bytes without revealing protected HTTP or cookies',()=>{
  const net=network(['tls','cookies']),sim=run(net,'web',{address:'https://knihovna.test/',method:'POST',message:'TAJNY-VZKAZ-<script>'});
  const encrypted=packetView(net,packet(sim,'https-request'));
  assert(encrypted.includes('DATA · TLS'));assert(encrypted.includes(hex(packet(sim,'https-request').payload.record.data.slice(0,160))));
  for(const secret of ['TAJNY-VZKAZ','POST /','Cookie:','Set-Cookie:'])assert(!encrypted.includes(secret),secret);
  const hello=packetView(net,packet(sim,'tls-client-hello'));
  assert(hello.includes('ClientHello'));assert(hello.includes('Server Name (SNI): knihovna.test'));
  assert(!hello.includes('TCP HLAVIČKA'));assert(!hello.includes('TTL'));
});

test('The visible VPN envelope contains only its UDP/IP fields and encrypted bytes, without tunnel history or inner data',()=>{
  const net=network(['vpn']),sim=new Simulation(net);assert(net.setVPN('laptop',true));
  assert(sim.start('web',{address:'http://knihovna.test/',method:'POST',message:'VPN-SECRET'}));
  let outer;
  for(let i=0;i<100&&!outer;i++){sim.advanceFrame();outer=[...sim.packets.values()].find(p=>p.kind.startsWith('vpn-'));}
  assert(outer);outer=structuredClone(outer);
  const html=packetView(net,outer);
  assert(html.includes('UDP HLAVIČKA'));assert(html.includes(hex(outer.payload.cipher.slice(0,160))));
  assert(!html.includes('VPN-SECRET'));assert(!html.includes('POST /'));assert(!html.includes('TTL'));
  assert(!html.includes('VPN obal'));assert(!html.includes('VPN server'));
  net.settings=new LabSettings({features:['vpn'],details:{ttl:true}});
  assert(packetView(net,outer).includes('<dt>TTL</dt>'));
  finish(sim);
});

test('DNS keeps its UDP header and query/answer visible while TCP details are disabled',()=>{
  const net=network(['dns']),sim=run(net);
  const query=packetView(net,packet(sim,'dns-query')),answer=packetView(net,packet(sim,'dns-response'));
  assert(query.includes('UDP HLAVIČKA'));assert(query.includes('Dotaz A: knihovna.test'));
  assert(answer.includes('Odpověď A: knihovna.test → 203.0.113.10'));
  assert(!query.includes('SEQ'));assert(!query.includes('TTL'));
});

test('Mail exposes encrypted payload without the lesson about mail sessions or byte offsets',()=>{
  const net=network(['mail']),sim=run(net,'mail-check',{device:'laptop'});
  const p=[...sim.packets.values()].find(p=>p.connection==='imap'),html=packetView(net,p);
  assert(html.includes(hex(p.payload.record.data.slice(0,160))));
  assert(!html.includes('Část modelového proudu'));assert(!html.includes('SMTP · odeslání'));
  assert(!html.includes('TCP HLAVIČKA'));assert(!html.includes('mailSession'));
});

test('Text data is escaped, and MAC addresses remain available only on frames that have them',()=>{
  const net=network(['instagram']),sim=run(net,'message',{text:'<img src=x onerror=alert(1)>'});
  const p=structuredClone(packet(sim,'message'));
  const html=packetView(net,p);
  assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));assert(!html.includes('<img'));
  p.frame={medium:'wifi',src:'02:00:00:00:00:01',dst:'02:00:00:00:00:02'};
  assert(packetView(net,p).includes('Wi-Fi rámec'));assert(packetView(net,p).includes(p.frame.dst));
  for(const frame of [{cellular:true},{satellite:true},null]) {
    p.frame=frame;const view=packetView(net,p);
    assert(!view.includes('Zdrojová MAC'));assert(!view.includes('undefined'));
  }
});
