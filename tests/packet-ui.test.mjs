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

test('TTL, split headers and frames are independent session-only details; payload is always available',()=>{
  const settings=new LabSettings();
  assert.equal(settings.details.ttl,false);assert.equal(settings.details.headers,false);assert.equal(settings.details.frames,false);
  assert(!LAB_DETAILS.some(d=>['payload','tcp'].includes(d.id)));
  assert(LAB_DETAILS.some(d=>d.id==='headers'));
  for(const id of ['ttl','headers','frames'])assert.equal(LabSettings.full().details[id],true);
  const restored=new LabSettings(new LabSettings({details:{ttl:true,headers:false,frames:true}}).toJSON());
  assert.equal(restored.details.ttl,true);assert.equal(restored.details.headers,false);assert.equal(restored.details.frames,true);assert.equal(restored.details.mac,false);
  assert(settings.sameNetwork(restored));
});

test('Base HTTP reveals ports, request and received HTML, but hides frame MAC addresses, TTL and SEQ',()=>{
  const net=network(),sim=run(net),request=packet(sim,'http-request'),response=packet(sim,'http-response');
  const html=packetView(net,request);
  assert(html.includes('GET / HTTP/1.1'));assert(html.includes('Host: knihovna.test'));
  assert(html.includes(request.src));assert(html.includes(request.dst));
  assert(!html.includes('Ethernetový rámec'));assert(!html.includes('Zdrojová MAC'));assert(!html.includes(request.frame.src));assert(!html.includes(request.frame.dst));
  assert(!html.includes('TTL'));assert(!html.includes('TCP HLAVIČKA'));
  assert(html.includes(`<dt>Zdrojový port → cílový port</dt><dd>${request.sport} → ${request.dport}</dd>`));assert(!html.includes('SEQ'));
  assert(html.includes('HLAVIČKA PAKETU'));assert(!html.includes('IP HLAVIČKA'));
  assert(html.includes('<dt>Pořadí paketu</dt><dd>1</dd>'));
  assert(!html.includes('<dt>Protokol</dt>'));
  const body=packetView(net,response);
  assert(body.includes(`<dt>Zdrojový port → cílový port</dt><dd>${response.sport} → ${response.dport}</dd>`));
  assert(body.includes('HTTP/1.1 200 OK'));assert(body.includes('&lt;h1&gt;Dnes otevřeno do 16 hodin&lt;/h1&gt;'));
  assert(!body.includes('<h1>'),'Received markup must be displayed as text');
});

test('The frames option reveals real Ethernet and Wi-Fi MACs at every observed hop without changing packets',()=>{
  for(const mode of ['cable','wifi']) {
    const net=network(['wifi']),sim=new Simulation(net),observed=[],nodes=new Set();
    assert(net.setAccess('laptop',mode)||net.access.laptop.mode===mode);
    assert(sim.start('web',{address:'http://knihovna.test/'}));
    for(let i=0;sim.status==='running'&&i<4000;i++) {
      const e=sim.advance();
      if(e.kind==='hop'&&!e.copy&&e.packet.frame?.src) {
        observed.push(structuredClone(e.packet));nodes.add(e.from);nodes.add(e.to);
      }
    }
    assert.equal(sim.status,'success');assert(nodes.has('laptop')&&nodes.has('home')&&nodes.has('web'));
    assert(observed.some(p=>p.frame.medium==='cable'));
    if(mode==='wifi')assert(observed.some(p=>p.frame.medium==='wifi'));
    const before=structuredClone(observed),packets=sim.packets,current=sim.current,nat=structuredClone(net.nat);
    for(const frames of [false,true,false])for(const headers of [false,true]) {
      net.settings=new LabSettings({features:['wifi'],details:{frames,headers,mac:!frames}});
      for(const p of observed) {
        const html=packetView(net,p),label=p.frame.medium==='wifi'?'Wi-Fi rámec':'Ethernetový rámec';
        assert.equal(html.includes(label),frames);
        assert.equal(html.includes('Zdrojová MAC'),frames);assert.equal(html.includes('Cílová MAC'),frames);
        assert.equal(html.includes(p.frame.src),frames);assert.equal(html.includes(p.frame.dst),frames);
        assert(html.includes('DATA'));assert(html.includes(p.src)&&html.includes(p.dst));
      }
    }
    assert.deepEqual(observed,before);assert.strictEqual(sim.packets,packets);assert.strictEqual(sim.current,current);assert.deepEqual(net.nat,nat);
    assert.equal(net.browser.content,net.server.title);
  }
});

test('All four TTL/header combinations change only their fields and preserve packet bytes and headers',()=>{
  const net=network(),sim=run(net),p=packet(sim,'http-request'),before=structuredClone(p);
  for(const ttl of [false,true])for(const tcp of [false,true]) {
    net.settings=new LabSettings({details:{ttl,headers:tcp}});
    const html=packetView(net,p);
    assert.equal(html.includes('<dt>TTL</dt>'),ttl);
    assert.equal(html.includes('TCP HLAVIČKA'),tcp);
    assert.equal(html.includes('Pořadové číslo TCP'),tcp);
    assert.equal(html.includes('IP HLAVIČKA'),tcp);
    assert.equal(html.includes('<dt>Pořadí paketu</dt>'),!tcp);
    assert(html.includes(`${p.sport} → ${p.dport}`));
    assert.equal(html.split('<dt>Zdrojový port → cílový port</dt>').length-1,1);
    if(tcp)assert(!html.split('</section>')[0].includes('Zdrojový port'),'Ports belong to the transport header in detailed mode');
    assert(html.includes('GET / HTTP/1.1'));
    assert.deepEqual(p,before);
  }
});

test('Individual photo bytes remain visible with TCP hidden; lesson labels and all histories stay absent even with every detail enabled',()=>{
  const net=network(['instagram']),sim=run(net,'message',{messageType:'image'});
  const p=[...sim.packets.values()].find(p=>p.kind==='message'&&p.payload.index===5);
  const photo=packetView(net,p);
  assert(photo.includes(hex(p.payload.bytes.slice(0,64))));
  assert(photo.includes('<dt>Pořadí paketu</dt><dd>6</dd>'));assert(!photo.includes('TCP HLAVIČKA'));
  assert(!photo.includes('1440 B'));
  const observed=structuredClone(p);
  Object.assign(observed,{state:'lost',location:'edge',natHistory:[{secret:'HISTORY-NAT'}],vpnHistory:[{secret:'HISTORY-VPN'}],satelliteHistory:[{secret:'HISTORY-SAT'}],mitmHistory:[{secret:'HISTORY-MITM'}]});
  net.settings=LabSettings.full();
  const full=packetView(net,observed);
  for(const text of [p.label,p.id,'Pokus','Ztracený paket','Doručený paket','Paket v přenosu','Router A','Pomůcka modelu','část 6','7001','8400','12000','HISTORY-','Spojení:','NAT ·','průchod'])assert(!full.includes(text),text);
  assert(full.includes('TCP HLAVIČKA'));assert(full.includes('Pořadové číslo TCP'));
  assert(full.includes('1440 B'));assert(full.includes('<dd>8001</dd>'));
  assert(!full.includes('<dt>Pořadí paketu</dt>'));
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
  assert(html.includes(`<dt>Zdrojový port → cílový port</dt><dd>${outer.sport} → ${outer.dport}</dd>`));
  assert(html.includes('HLAVIČKA PAKETU'));assert(!html.includes('UDP HLAVIČKA'));assert(html.includes(hex(outer.payload.cipher.slice(0,160))));
  assert(!html.includes('VPN-SECRET'));assert(!html.includes('POST /'));assert(!html.includes('TTL'));
  assert(!html.includes('VPN obal'));assert(!html.includes('VPN server'));
  net.settings=new LabSettings({features:['vpn'],details:{ttl:true,headers:true}});
  assert(packetView(net,outer).includes('<dt>TTL</dt>'));
  assert(packetView(net,outer).includes('UDP HLAVIČKA'));
  finish(sim);
});

test('DNS has the same simple header and reveals its actual UDP header in detailed mode',()=>{
  const net=network(['dns']),sim=run(net);
  const query=packetView(net,packet(sim,'dns-query')),answer=packetView(net,packet(sim,'dns-response'));
  for(const kind of ['dns-query','dns-response']) {
    const p=packet(sim,kind);
    assert(packetView(net,p).includes(`<dt>Zdrojový port → cílový port</dt><dd>${p.sport} → ${p.dport}</dd>`));
  }
  assert(query.includes('HLAVIČKA PAKETU'));assert(!query.includes('UDP HLAVIČKA'));assert(query.includes('Dotaz A: knihovna.test'));
  net.settings=new LabSettings({features:['dns'],details:{headers:true}});
  const detailed=packetView(net,packet(sim,'dns-query'));
  assert(detailed.includes('IP HLAVIČKA'));assert(detailed.includes('UDP HLAVIČKA'));
  assert(!detailed.includes('Pořadí paketu'));
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
  const net=network(['instagram'],{frames:true}),sim=run(net,'message',{text:'<img src=x onerror=alert(1)>'});
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
