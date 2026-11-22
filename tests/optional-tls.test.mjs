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
import '../js/mail-ui.js';
import '../js/ads-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,LabSettings,Simulation,packetView,mailServerDetail,adsPage,DEMO_LOGIN}=globalThis.InternetLab;
const create=(features,tls=false)=>new Simulation(new Network(new LabSettings({features:[...features,...(tls?['tls']:[])]})));
const draft={device:'laptop',target:'friend',subject:'Pozdrav',body:'TAJNY-OBSAH '.repeat(8)+'<script>Žluťoučký 🐎</script>\n.Druhý řádek'};
function finish(s,expected='success') {
  const events=[];
  for(let i=0;s.status==='running'&&i<12000;i++){s.advanceFrame();events.push(...structuredClone(s.frame));}
  assert.equal(s.status,expected,s.current?.description);return events;
}
function run(s,type,payload){assert(s.start(type,payload));return finish(s);}
function until(s,condition){for(let i=0;s.status==='running'&&!condition()&&i<12000;i++)s.advance();assert(condition());}
const packets=(s,kind)=>[...s.packets.values()].filter(p=>p.kind===kind);
const bytes=p=>p.payload.record?.data||p.payload.bytes;
function clearText(group){return new TextDecoder().decode(new Uint8Array(group.sort((a,b)=>a.seq-b.seq).flatMap(p=>Array.from(p.payload.bytes))));}

test('SMTP, IMAP fetch and read flags use the chosen TLS mode and keep endpoint commit boundaries',()=>{
  for(const tls of [false,true]){
    const s=create(['mail'],tls);
    assert(s.start('mail-send',draft));
    until(s,()=>packets(s,'smtp-request').some(p=>p.state==='delivered'));
    assert.equal(s.net.mail.boxes.friend.length,0);assert.equal(s.net.phishing.clients.laptop.sent.length,0);
    until(s,()=>s.mail.entry.accepted);
    assert.equal(s.net.mail.boxes.friend[0].body,draft.body);assert.equal(s.net.phishing.clients.laptop.sent.length,0);
    finish(s);assert.equal(s.net.phishing.clients.laptop.sent[0].body,draft.body);
    const send=packets(s,'smtp-request');
    assert(send.every(p=>p.initialHeader.dport===(tls?465:587)));
    assert.equal(send.every(p=>!!p.payload.record),tls);
    assert.equal(send.some(p=>packetView(s.net,p).includes('TAJNY-OBSAH')),!tls);
    assert(send.every(p=>!packetView(s.net,p).includes('<script>')));
    if(!tls){assert(clearText(send).includes(draft.body.replace(/\n/g,'\r\n').replace(/^\./gm,'..')));assert(send.every(p=>packetView(s.net,p).includes('DATA · SMTP')));}
    assert(s.start('mail-check',{device:'friend'}));
    until(s,()=>packets(s,'imap-response').some(p=>p.state==='delivered'));
    assert.equal(s.net.phishing.clients.friend.items.length,0);
    finish(s);assert.equal(s.net.phishing.clients.friend.inbox.body,draft.body);
    const fetch=packets(s,'imap-response');
    assert(packets(s,'imap-request').every(p=>p.initialHeader.dport===(tls?993:143)));
    assert.equal(fetch.some(p=>packetView(s.net,p).includes('TAJNY-OBSAH')),!tls);
    if(!tls)assert(clearText(fetch).includes(draft.body.replace(/\n/g,'\r\n').replace(/^\./gm,'..')));
    assert(s.start('mail-seen',{device:'friend',messageId:'mail-1'}));
    until(s,()=>s.net.mail.boxes.friend[0].seen);assert(!s.net.phishing.clients.friend.inbox.seen);
    finish(s);assert(s.net.phishing.clients.friend.inbox.seen);
    assert.equal(packets(s,'imap-request').some(p=>packetView(s.net,p).includes('UID STORE')),!tls);
    const html=mailServerDetail(s.net,s,s.net.nodes.mail);
    assert.equal(html.includes('Na síti obsah chrání model TLS.'),tls);
    assert.equal(html.includes('TLS a přihlášení jsou připravené'),tls);
  }
});

test('Readable UTF-8 mail parts use real consecutive byte SEQ and bytes below MTU',()=>{
  const s=create(['mail']);const body='Žluťoučký 🐎🐳\n.'.repeat(45);
  run(s,'mail-send',{...draft,body});const groups=[packets(s,'smtp-request'),packets(s,'smtp-response')];
  run(s,'mail-check',{device:'friend'});groups.push(packets(s,'imap-request'),packets(s,'imap-response'));
  assert.equal(s.net.phishing.clients.friend.inbox.body,body);
  for(const group of groups){
    assert(group.length);
    for(const [i,p] of group.entries()){
      assert(!p.payload.record);assert(p.payload.bytes.length<=192);assert(bytes(p).length+40<=1500);
      assert(!new TextDecoder('utf-8',{fatal:true}).decode(p.payload.bytes).includes('\ufffd'));
      if(group.length>1)assert(p.label.endsWith(`${i+1}/${group.length}`));
      if(i)assert.equal(p.seq,group[i-1].seq+bytes(group[i-1]).length);
    }
  }
});

test('An unencrypted mail transfer is parsed from the received bytes, and a missing SEQ range cannot store it',()=>{
  const s=create(['mail']);assert(s.start('mail-send',{...draft,body:'ORIGINAL'}));s.advance();
  const group=packets(s,'smtp-request'),text=new TextDecoder().decode(new Uint8Array(group.flatMap(p=>Array.from(p.payload.bytes))));
  assert(text.includes('ORIGINAL'));const position=new TextEncoder().encode(text.slice(0,text.indexOf('ORIGINAL'))).length;let base=0;
  for(const p of group){for(let i=0;i<p.payload.bytes.length;i++)if(base+i>=position&&base+i<position+8)p.payload.bytes[i]='CHANGED!'.charCodeAt(base+i-position);base+=p.payload.bytes.length;}
  finish(s);assert.equal(s.net.mail.boxes.friend[0].body,'CHANGED!');
  const broken=create(['mail']);assert(broken.start('mail-send',draft));broken.advance();packets(broken,'smtp-request')[0].seq++;
  finish(broken,'failed');assert.equal(broken.net.mail.boxes.friend.length,0);
});

test('The cafe observer reads unencrypted mail and cannot read the same content with TLS',()=>{
  for(const tls of [false,true]){
    const s=create(['mitm','mail'],tls);s.mitm.configure(true,'observe');assert(s.net.setCafeHotspot('rogue'));
    run(s,'mail-send',{...draft,device:'cafe'});
    assert(s.net.mitm.logs.length);assert.equal(s.net.mitm.logs.some(r=>r.before.includes('TAJNY-OBSAH')),!tls);
    assert(s.net.mitm.logs.every(r=>r.protection===(tls?'TLS':'')));
  }
});

test('Phishing mail, the fake web and its administration all follow the shared TLS setting',()=>{
  for(const tls of [false,true]){
    const s=create(['hacker'],tls);
    run(s,'phish-send',{device:'hacker',target:'laptop'});run(s,'mail-check',{device:'laptop'});
    const link=s.net.phishing.clients.laptop.inbox.link;
    run(s,'web',{device:'laptop',address:link,method:'POST',phishLogin:true});
    assert.equal(s.net.phishing.captures.size,1);assert.equal(s.net.phishing.lastWeb.secure,tls);
    assert.equal(s.net.phishing.hacker.results.length,0);
    assert(s.start('phish-results',{device:'hacker'}));
    until(s,()=>packets(s,'phish-response').length>0);assert.equal(s.net.phishing.hacker.results.length,0);
    finish(s);assert.equal(s.net.phishing.hacker.results[0].password,DEMO_LOGIN.password);
    const request=packets(s,'phish-request')[0],response=packets(s,'phish-response')[0];
    assert.equal(request.initialHeader.dport,tls?443:80);assert.equal(!!request.payload.record,tls);
    assert.equal(packetView(s.net,response).includes(DEMO_LOGIN.password),!tls);
    assert.equal(packetView(s.net,request).includes('DATA · HTTP'),!tls);
    assert.equal(s.current.description.includes('chráněnou'),tls);
  }
});

test('Advertising works over readable HTTP or TLS without enabling TLS as a dependency',()=>{
  for(const tls of [false,true]){
    const s=create(['ads'],tls);assert.equal(s.net.featureEnabled('tls'),tls);
    const kinds=tls?['https-request','https-response']:['http-request','http-response'];
    assert(s.start('web',{address:'https://obchod.test/?tema=hudba'}));
    until(s,()=>s.queue.some(e=>e.kind==='ads-select'));assert.equal(s.net.ads.profiles.size,0);assert.equal(s.net.browser.adPage.ad,null);
    s.advance();assert.equal(s.net.ads.profiles.size,1);assert.equal(s.net.browser.adPage.ad,null);finish(s);
    const cookie=s.net.ads.clients.laptop.cookie;assert.equal(cookie.secure,tls);assert.equal(cookie.sameSite,tls?'None':null);
    assert.equal(s.net.ads.clients.laptop.lastReceived.includes('Secure'),tls);
    run(s,'web',{address:'https://zpravy.test/'});
    assert.equal(s.net.browser.adPage.ad.topic,'hudba');assert(s.net.browser.adPage.ad.personalized);assert.equal(s.net.ads.profiles.size,1);
    for(const kind of kinds)assert(packets(s,kind).some(p=>p.source==='ads'||p.destination==='ads'));
    assert.equal([...s.packets.values()].some(p=>p.kind.startsWith('tls-')),tls);
    const request=packets(s,kinds[0]).find(p=>p.destination==='ads');
    assert.equal(request.initialHeader.dport,tls?443:80);
    assert.equal(packetView(s.net,request).includes('reklama_id=r1'),!tls);
    const page=adsPage(s.net,s,'laptop',s.net.browser);assert.equal(page.includes('Secure ·'),tls);assert.equal(page.includes('SameSite=None'),tls);
    s.ads.setAllowed('laptop',false);run(s,'web',{address:'https://zpravy.test/'});
    assert(!s.net.browser.adPage.ad.personalized);assert.equal(s.net.ads.profiles.size,1);
  }
});

test('VPN still hides the outer mail payload with TLS disabled and exposes clear mail only after its exit',()=>{
  const s=create(['mail','vpn']);s.net.setVPN('laptop',true);
  const events=run(s,'mail-send',draft),outer=events.filter(e=>e.kind==='hop'&&e.packet?.kind==='vpn-outbound');
  assert(outer.length);assert(outer.every(e=>e.packet.payload.cipher&&!packetView(s.net,e.packet).includes('TAJNY-OBSAH')));
  const exit=events.filter(e=>e.kind==='hop'&&e.packet?.vpn?.stage==='exit'&&e.packet.kind==='smtp-request');
  assert(exit.some(e=>packetView(s.net,e.packet).includes('TAJNY-OBSAH')));assert.equal(s.net.mail.boxes.friend[0].body,draft.body);
});

test('Plain SMTP retry is idempotent and interrupted IMAP preserves the old snapshot and UID flags',()=>{
  const s=create(['mail']);s.net.toggleNode('friend');assert(s.start('mail-send',draft));
  until(s,()=>s.mail.entry.accepted);s.net.clearNat('home');finish(s,'failed');
  assert.equal(s.net.mail.boxes.friend.length,1);assert.equal(s.net.phishing.clients.laptop.sent.length,0);
  assert(s.repeat());finish(s);assert.equal(s.net.mail.boxes.friend.length,1);assert.equal(s.net.phishing.clients.laptop.sent.length,1);
  s.net.toggleNode('friend');run(s,'mail-check',{device:'friend'});
  const body='Řádek s 🐎\n..dva body\n.\n';run(s,'mail-send',{...draft,body});
  assert(s.start('mail-check',{device:'friend'}));until(s,()=>packets(s,'imap-response').some(p=>p.state==='delivered'));
  s.net.clearNat('friend-home');finish(s,'failed');assert.equal(s.net.phishing.clients.friend.items.length,1);
  assert(s.repeat());finish(s);assert.deepEqual(s.net.phishing.clients.friend.items.map(m=>m.uid),[1,2]);assert.equal(s.net.phishing.clients.friend.inbox.body,body);
  run(s,'mail-seen',{device:'friend',messageId:'mail-1'});run(s,'mail-check',{device:'friend'});
  assert.deepEqual(s.net.phishing.clients.friend.items.map(m=>m.seen),[true,false]);
});

test('Both mail modes deliver over Wi-Fi, cellular, satellite and cafe access with or without VPN',()=>{
  for(const tls of [false,true])for(const vpn of [false,true])for(const [device,mode,link] of [['laptop','wifi','laptop-wifi'],['phone','cellular','phone-bts-park'],['cabin','wifi','sat-uplink'],['cafe','wifi','cafe-wifi']]){
    const s=create(['mail','wifi','mobile','satellite','mitm','vpn'],tls);
    if(device==='cafe')assert(s.net.setCafeHotspot('trusted',s.net.cafeWifi.password));else s.net.setAccess(device,mode);if(device==='phone'&&mode==='cellular')s.net.toggleNode('bts-lipova');
    if(vpn)s.net.setVPN(device,true);
    const events=run(s,'mail-send',{...draft,device});
    assert(events.some(e=>e.kind==='hop'&&e.link===link),device);
    assert.equal(events.some(e=>e.kind==='hop'&&e.packet?.kind==='vpn-outbound'),vpn);
    run(s,'mail-check',{device:'friend'});assert.equal(s.net.phishing.clients.friend.inbox.body,draft.body);
  }
});
