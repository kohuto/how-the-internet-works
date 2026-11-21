import '../js/network.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {Simulation,mailServerFor,emailFor}=globalThis.InternetLab;
function finish(s){const events=[];for(let i=0;i<20000&&s.status==='running';i++){s.advanceFrame();events.push(...structuredClone(s.frame));}assert.notEqual(s.status,'running');return events;}
function run(s,type,payload){assert(s.start(type,payload),type);return finish(s);}
const draft=(device='laptop',target='friend',extra={})=>({device,target,subject:'Pozdrav',body:'Ahoj! Žluťoučký kůň 🐎.\n.Druhý řádek',...extra});
const send=(s,device='laptop',target='friend',extra={})=>run(s,'mail-send',draft(device,target,extra));
const check=(s,device='friend')=>run(s,'mail-check',{device});
function until(s,condition){for(let i=0;i<20000&&s.status==='running'&&!condition();i++)s.advance();assert(condition());}
const outgoing=(s,node,phase)=>s.net.mail.dialogue.filter(r=>r.node===node&&r.direction==='out'&&(!phase||r.phase===phase));

test('One shared Gmail server holds every account; the second provider is removed',()=>{
 const s=new Simulation(),n=s.net;
 for(const id of ['laptop','friend','phone','cabin','cafe']){assert.equal(mailServerFor(id),'mail');assert(emailFor(id).endsWith('@gmail.com'));}
 assert.equal(n.nodes.mail.name,'Gmail');assert(!n.nodes['mail-dopis']);assert(!n.nodes['mail-router']);assert(!n.nodes['mail-switch']);
 assert(!Object.values(n.nodes).some(n=>n.region==='mail-b'));assert(!Object.keys(n.dnsRecords).some(name=>/posta|dopis/.test(name)));
 for(const p of [draft('hacker'),draft('laptop','web'),draft('laptop','friend',{subject:''}),draft('laptop','friend',{body:'x'.repeat(1201)})])assert(!s.start('mail-send',p));
 assert(!s.start('mail-retry',{messageId:'missing'}));assert(!s.start('mail-seen',{device:'friend',messageId:'missing'}));
});
test('The two notebooks can send only to each other; other clients keep their recipients',()=>{
 const s=new Simulation();
 for(const device of ['laptop','friend'])for(const target of ['laptop','friend','phone','cabin','cafe']){
   const expected=device==='laptop'?'friend':'laptop';
   assert.equal(s.mail.validate('mail-send',draft(device,target)),target===expected,`${device} → ${target}`);
   if(target!==expected)assert(!s.start('mail-send',draft(device,target)));
 }
 assert.equal(s.net.mail.deliveries.size,0);assert.equal(s.net.mail.serial,0);
 assert(s.mail.validate('mail-send',draft('phone','cafe')));
 assert(s.mail.validate('phish-send',{device:'hacker',target:'laptop'}));
});
test('SMTP submits once to Gmail on port 465 and stores directly without DNS MX or server relay',()=>{
 const s=new Simulation(),events=send(s);assert.equal(s.status,'success');
 assert.deepEqual(outgoing(s,'laptop','submission').map(r=>r.wire.split(/[ :\r]/)[0]),['MAIL','RCPT','DATA','Message-ID']);
 assert.deepEqual(outgoing(s,'mail','submission').map(r=>r.wire.slice(0,3)),['250','250','354','250']);
 const requests=[...s.packets.values()].filter(p=>p.kind==='smtp-request');assert(requests.length>0);
 assert(requests.every(p=>p.source==='laptop'&&p.destination==='mail'&&p.initialHeader.dport===465&&p.mailMeta.phase==='submission'));
 assert(!events.some(e=>e.packet?.kind.startsWith('dns-')||e.packet?.mailMeta?.phase==='relay'));
 assert.equal(s.net.mail.deliveries.get('mail-1').state,'delivered');assert.equal(s.net.mail.boxes.friend[0].body,draft().body);assert.equal(s.net.phishing.clients.friend.inbox,null);
});
test('Server storage precedes the SMTP acknowledgement and does not update the recipient local inbox',()=>{
 const s=new Simulation();assert(s.start('mail-send',draft()));until(s,()=>s.mail.entry?.accepted);
 assert.equal(s.net.mail.boxes.friend.length,1);assert.equal(s.net.mail.deliveries.get('mail-1').state,'delivered');assert(!s.mail.entry.clientAccepted);
 assert.equal(s.net.phishing.clients.friend.items.length,0);finish(s);assert.equal(s.status,'success');assert(s.mail.entry.clientAccepted);
 check(s);assert.equal(s.net.phishing.clients.friend.items.length,1);
});
test('A powered-off recipient receives server mail and can fetch it later with the sender disconnected',()=>{
 const s=new Simulation();s.net.toggleNode('friend');send(s);assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.friend.length,1);
 s.net.toggleNode('laptop');s.connectionChanged('laptop');check(s);assert.equal(s.status,'failed');assert.equal(s.net.mail.boxes.friend.length,1);
 s.net.toggleNode('friend');check(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.clients.friend.inbox.body,draft().body);
});
test('Both directions and additional devices use separate mailboxes on the same Gmail server',()=>{
 const s=new Simulation();assert(s.net.setCafeHotspot('trusted',s.net.cafeWifi.password));send(s,'cafe','phone');assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.phone.length,1);
 send(s,'laptop','friend');assert.equal(s.status,'success');send(s,'friend','laptop');assert.equal(s.status,'success');
 assert.equal(s.net.mail.boxes.laptop[0].from,'matej@gmail.com');assert.equal(s.net.mail.boxes.friend[0].from,'ty@gmail.com');
 assert.equal(s.net.mail.boxes.friend.length,1);assert.equal(s.net.mail.boxes.phone.length,1);
 assert(outgoing(s,'friend','submission').length>0);assert(s.net.mail.dialogue.every(r=>['submission','access'].includes(r.phase)));
 check(s,'laptop');assert.equal(s.net.phishing.clients.laptop.inbox.from,'matej@gmail.com');
});
test('An unavailable DNS server does not interrupt mail within the same prepared provider',()=>{
 const s=new Simulation();s.net.toggleNode('dns');send(s);assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.friend.length,1);
 check(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.clients.friend.inbox.body,draft().body);
 assert(![...s.packets.values()].some(p=>p.kind.startsWith('dns-')));
});
test('An outage of the common server blocks new sending and fetching; restore permits repeat without losing stored mail',()=>{
 const s=new Simulation();s.net.toggleNode('mail');send(s);assert.equal(s.status,'failed');assert.equal(s.net.mail.boxes.friend.length,0);assert.equal(s.net.mail.deliveries.size,0);
 s.net.toggleNode('mail');assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.friend.length,1);
 check(s);assert.equal(s.status,'success');s.net.toggleNode('mail');check(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.clients.friend.items.length,1);
 s.net.toggleNode('mail');assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.friend.length,1);
});
test('A lost submission acknowledgement retains accepted mail and explicit repeat does not duplicate this model ID',()=>{
 const s=new Simulation();assert(s.start('mail-send',draft()));until(s,()=>s.mail.entry?.accepted);s.net.clearNat('home');finish(s);assert.equal(s.status,'failed');assert.equal(s.net.mail.boxes.friend.length,1);
 assert.equal(s.net.phishing.clients.laptop.sent.length,0,'A stored server message is not yet a confirmed local sent copy');
 assert(s.repeat());finish(s);assert.equal(s.status,'success');assert.equal(s.net.mail.boxes.friend.length,1);assert.equal(s.net.mail.deliveries.size,1);
 assert.equal(s.net.phishing.clients.laptop.sent.length,1);assert.equal(s.net.phishing.clients.laptop.sent[0].body,draft().body);
});
test('IMAP SELECT precedes FETCH, with no local update until all response bytes arrive',()=>{
 const s=new Simulation();send(s);assert(s.start('mail-check',{device:'friend'}));until(s,()=>outgoing(s,'mail','access').some(r=>r.wire.includes('A2 OK')));assert.equal(s.net.phishing.clients.friend.items.length,0);finish(s);
 const c=s.net.phishing.clients.friend;assert.equal(c.items.length,1);assert.equal(c.inbox.body,draft().body);assert(!c.inbox.seen);assert(!s.net.mail.boxes.friend[0].seen);assert.deepEqual(outgoing(s,'friend','access').map(r=>r.wire.split(' ').slice(0,2).join(' ')),['A1 SELECT','A2 UID']);
 assert(c.checked);assert.equal(s.net.phishing.clients.laptop.checked,false);assert.equal(c.sent.length,0);
});
test('Multiple messages retain immutable UID; opening uses IMAP STORE, no receipt to the sender',()=>{
 const s=new Simulation();send(s);send(s,'laptop','friend',{subject:'Druhá zpráva',body:'Další obsah'});check(s);const c=s.net.phishing.clients.friend;assert.deepEqual(c.items.map(m=>m.uid),[1,2]);assert.equal(c.inbox.id,'mail-2');assert(s.mail.open('friend','mail-1'));
 assert(s.start('mail-seen',{device:'friend',messageId:'mail-1'}));until(s,()=>s.net.mail.boxes.friend[0].seen);assert(!c.inbox.seen);assert(!c.items[1].seen);finish(s);assert(c.inbox.seen);assert.equal(s.status,'success');
 assert(outgoing(s,'friend','access').some(r=>r.wire==='A2 UID STORE 1 +FLAGS (\\Seen)'));assert(![...s.packets.values()].some(p=>p.destination==='laptop'));check(s);assert.deepEqual(c.items.map(m=>m.seen),[true,false]);
});
test('An interrupted IMAP response preserves the previously fetched local snapshot',()=>{
 const s=new Simulation();send(s);check(s);send(s,'laptop','friend',{body:'Nový e-mail'});assert(s.start('mail-check',{device:'friend'}));until(s,()=>outgoing(s,'mail','access').some(r=>r.run===s.run&&r.wire.includes('A2 OK')));s.net.clearNat('friend-home');finish(s);assert.equal(s.status,'failed');assert.equal(s.net.phishing.clients.friend.items.length,1);assert.equal(s.net.mail.boxes.friend.length,2);
 check(s);assert.equal(s.status,'success');assert.equal(s.net.phishing.clients.friend.items.length,2);
});
test('UTF-8 mail reassembles across many staggered protected chunks below MTU with contiguous SEQ',()=>{
 const s=new Simulation(),body='Žluťoučký 🐎🐳\n.'.repeat(45),events=send(s,'laptop','friend',{body});assert.equal(s.status,'success');check(s);assert.equal(s.net.phishing.clients.friend.inbox.body,body);
 const packets=events.filter(e=>e.kind==='create'&&e.packet?.connection==='smtp').map(e=>e.packet);
 const all=packets.length?packets:events.filter(e=>e.kind==='hop'&&e.packet?.connection==='smtp').map(e=>e.packet);assert(all.length>10);
 const unique=[...new Map(all.map(p=>[p.id,p])).values()];for(const p of unique){assert(p.payload.record.data.length+40<=1500);assert(p.mailMeta.partBytes<=192);assert(!JSON.stringify(p.payload).includes('Žluťoučký'));}
 for(const id of new Set(unique.map(p=>p.mailMeta.session)))for(const kind of ['smtp-request','smtp-response']){const group=unique.filter(p=>p.mailMeta.session===id&&p.kind===kind).sort((a,b)=>a.seq-b.seq);for(let i=1;i<group.length;i++)assert.equal(group[i].seq,group[i-1].seq+group[i-1].payload.record.data.length);}
 assert(events.some((e,i)=>e.kind==='hop'&&events.slice(i+1,i+8).some(x=>x.kind==='hop'&&x.packet.id!==e.packet.id)));
});
test('Client SMTP and IMAP reach the shared provider across Wi-Fi, cellular, satellite and VPN',()=>{
 for(const [device,mode,link] of [['laptop','wifi','laptop-wifi'],['phone','cellular','phone-bts-park'],['cabin','wifi','sat-uplink']]){
 const s=new Simulation();s.net.setAccess(device,mode,device==='phone'?'bts-park':undefined);s.net.setVPN(device,true);const events=send(s,device,'friend');assert.equal(s.status,'success',device);assert(events.some(e=>e.kind==='hop'&&e.link===link));assert(events.some(e=>e.packet?.kind==='vpn-outbound'));assert(!events.some(e=>e.packet?.mailMeta?.phase==='relay'));check(s);assert.equal(s.net.phishing.clients.friend.inbox.body,draft().body);
 }
});
test('Cafe observer cannot read mail bodies; changing access or corrupting TLS rejects the old transfer',()=>{
 const s=new Simulation();s.mitm.configure(true,'observe');s.net.setCafeHotspot('rogue');send(s,'cafe','friend',{body:'TAJNY-MAIL-OBSAH'});assert.equal(s.status,'success');assert(s.net.mitm.logs.length>0);assert(!JSON.stringify(s.net.mitm.logs).includes('TAJNY-MAIL-OBSAH'));
 assert(s.start('mail-check',{device:'friend'}));s.net.setAccess('friend','wifi');s.connectionChanged('friend');assert.equal(s.status,'failed');assert.equal(s.net.phishing.clients.friend.items.length,0);
 assert(s.start('mail-send',draft()));until(s,()=>[...s.packets.values()].some(p=>p.kind==='smtp-request'));[...s.packets.values()].find(p=>p.kind==='smtp-request').payload.record.data[0]^=1;finish(s);assert.equal(s.status,'failed');assert.equal(s.net.mail.deliveries.size,1);
});
