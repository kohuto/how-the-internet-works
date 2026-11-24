import '../js/network.js';
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
import '../js/packet-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Simulation,instagramView,packetView}=globalThis.InternetLab;
const finish=s=>{for(let i=0;s.status==='running'&&i<4000;i++)s.advanceFrame();assert.notEqual(s.status,'running');};
const send=(s,device,text,extra={})=>{assert(s.start('message',{device,text,...extra}));finish(s);};
const until=(s,predicate)=>{for(let i=0;!predicate()&&s.status==='running'&&i<4000;i++)s.advanceFrame();assert(predicate());};
const read=(s,device)=>{assert(s.markRead(device));finish(s);};
const html=(s,device)=>instagramView(s.net,s,{message:'',messageType:'text'},device);

test('Matěj can initiate a real transfer through Instagram to the laptop with correct client ports and NAT',()=>{
  const s=new Simulation();send(s,'friend','Ahoj, píše Matěj 😊');
  assert.equal(s.status,'success');assert.equal(s.net.friend.text,'Ahoj, píše Matěj 😊');
  assert.equal(s.net.instagram.recipientDevice,'laptop');
  const upload=[...s.packets.values()].find(p=>p.kind==='message');
  const delivery=[...s.packets.values()].find(p=>p.kind==='ig-delivery');
  assert.equal(upload.source,'friend');assert.equal(upload.destination,'instagram');
  assert.equal(upload.initialHeader.sport,52002);assert.equal(upload.dport,443);
  assert.equal(delivery.source,'instagram');assert.equal(delivery.destination,'laptop');assert.equal(delivery.dport,51002);
  assert.equal(delivery.seq,8001);assert.notEqual(upload.id,delivery.id);
  assert(upload.natHistory.some(t=>t.router==='friend-home'&&t.direction==='out'));
  assert(delivery.natHistory.some(t=>t.router==='home'&&t.direction==='in'));
  assert.equal(s.net.instagram.history[0].status,'delivered');
});

test('Alternating messages retain history and their own delivery and read receipts',()=>{
  const s=new Simulation();send(s,'laptop','Otázka');read(s,'friend');
  send(s,'friend','Odpověď');assert.equal(s.markRead('friend'),false);read(s,'laptop');
  send(s,'laptop','Díky');read(s,'friend');
  assert.deepEqual(s.net.instagram.history.map(m=>[m.text,m.senderDevice,m.recipientDevice,m.status]),[
    ['Otázka','laptop','friend','read'],['Odpověď','friend','laptop','read'],['Díky','laptop','friend','read']
  ]);
  for(const device of ['laptop','friend'])for(const text of ['Otázka','Odpověď','Díky'])assert(html(s,device).includes(text));
});

test('Matěj can send image and video; both legs account for every data packet and reconstruct exact bytes',()=>{
  const s=new Simulation();
  for(const [type,count] of [['image',9],['video',35]]) {
    send(s,'friend','',{messageType:type});
    assert.equal(s.status,'success');assert.equal(s.net.sender.sentPackets,count);assert.equal(s.net.instagram.receivedPackets,count);assert.equal(s.net.friend.receivedPackets,count);
    assert.deepEqual(s.net.friend.content.bytes,s.net.sender.content.bytes);
    assert.equal(s.net.instagram.history.at(-1).content.type,type);
    assert.equal(s.net.instagram.history.at(-1).content.bytes,undefined,'History keeps attachment metadata rather than duplicating model bytes');
    assert([...s.packets.values()].filter(p=>p.kind==='ig-delivery').every(p=>p.destination==='laptop'));
  }
  assert.equal(s.net.instagram.history.length,2);
});

test('Recipient chat does not reveal sent text before complete network delivery and safely escapes content',()=>{
  const s=new Simulation(),text='Tajná odpověď <script>alert(1)</script> 😊';
  assert(s.start('message',{device:'friend',text}));
  assert(!html(s,'laptop').includes('Tajná odpověď'));
  until(s,()=>s.net.instagram.state==='delivering');
  assert(!html(s,'laptop').includes('Tajná odpověď'));
  finish(s);assert(html(s,'laptop').includes('Tajná odpověď &lt;script&gt;'));
  assert(!html(s,'laptop').includes('<script>'));
});

test('Reply targets the device that last wrote to Matěj and waits on the server while that phone is offline',()=>{
  const s=new Simulation();send(s,'phone','Píšu z telefonu');
  assert.equal(s.net.instagram.replyDevice,'phone');s.net.toggleNode('phone');
  send(s,'friend','Odpověď na mobil',{messageType:'image'});
  assert.equal(s.status,'waiting');assert.equal(s.net.instagram.recipientDevice,'phone');
  assert.equal(s.net.instagram.history.at(-1).accepted,true);assert.equal(s.net.instagram.history.at(-1).delivered,false);
  assert(!html(s,'phone').includes('Odpoledne na hřišti.jpg'));
  assert(s.start('web'));finish(s);s.net.toggleNode('phone');s.net.toggleNode('friend');
  assert(s.resumePending());finish(s);assert.equal(s.status,'success');
  assert.equal(s.net.friend.content.type,'image');assert.equal(s.net.instagram.history.length,2);
  assert([...s.packets.values()].filter(p=>p.kind==='ig-delivery').every(p=>p.destination==='phone'));
  assert(![...s.packets.values()].some(p=>p.kind==='message'),'Resume does not upload the accepted reply again');
});

test('Interrupted reverse delivery never exposes partial media and resumes the same history entry',()=>{
  const s=new Simulation();assert(s.start('message',{device:'friend',messageType:'image'}));
  until(s,()=>s.net.friend.receivedPackets>0&&s.net.friend.receivedPackets<9);
  assert(!html(s,'laptop').includes('Odpoledne na hřišti.jpg'));s.net.toggleLink('uplink');finish(s);
  assert.equal(s.status,'waiting');assert.equal(s.net.instagram.history[0].delivered,false);
  s.net.toggleLink('uplink');assert(s.resumePending());finish(s);
  assert.equal(s.net.instagram.history.length,1);assert.equal(s.net.instagram.history[0].delivered,true);
  assert.deepEqual(s.net.friend.content.bytes,s.net.sender.content.bytes);
});

test('Reverse media and read receipts traverse VPN and independent channels in both households',()=>{
  const s=new Simulation();s.net.setVPN('laptop',true);s.net.setVPN('friend',true);
  send(s,'friend','',{messageType:'image'});assert.equal(s.status,'success');
  assert.equal(s.net.friend.receivedPackets,9);assert(s.net.instagramChannel('laptop'));assert(s.net.instagramChannel('friend'));
  assert([...s.packets.values()].some(p=>p.kind==='ig-check'&&p.source==='laptop'&&p.vpnHistory?.some(t=>t.client==='laptop'&&t.direction==='out')));
  assert([...s.packets.values()].some(p=>p.vpnHistory?.some(t=>t.client==='friend'&&t.direction==='out')));
  read(s,'laptop');assert.equal(s.net.instagram.history[0].status,'read');assert.equal(s.net.sender.state,'read');
});

test('Reverse read confirmation waits for the original sender to reconnect',()=>{
  const s=new Simulation();send(s,'friend','Jsem tu');s.net.toggleNode('friend');read(s,'laptop');
  assert.equal(s.status,'waiting');assert.equal(s.net.instagram.readKnown,true);
  assert.equal(s.net.instagram.history[0].status,'delivered');
  s.net.toggleNode('friend');assert(s.resumePending());finish(s);
  assert.equal(s.net.instagram.history[0].status,'read');
});

test('Invalid reply targets and starting over a stored delivery do not corrupt the conversation',()=>{
  const s=new Simulation();assert.equal(s.start('message',{device:'friend',targetDevice:'web',text:'Neplatný cíl'}),false);
  s.net.toggleNode('laptop');send(s,'friend','Čekající zpráva');
  assert.equal(s.start('message',{device:'laptop',text:'Jiná zpráva'}),false);
  assert.equal(s.net.instagram.history.length,1);assert.equal(s.net.instagram.history[0].text,'Čekající zpráva');
});


test('Every message waits for a recipient check at the server, including reused channels and reverse replies',()=>{
  const s=new Simulation();
  for(const [device,text] of [['laptop','První zpráva'],['laptop','Druhá zpráva'],['friend','Odpověď']]) {
    const recipient=device==='friend'?'laptop':'friend';
    assert(s.start('message',{device,text}));
    until(s,()=>s.net.instagram.text===text);
    assert.equal(s.net.friend.text,'');
    assert(![...s.packets.values()].some(p=>p.kind==='ig-check'||p.kind==='ig-delivery'));
    until(s,()=>[...s.packets.values()].some(p=>p.kind==='ig-check'&&p.state==='delivered'));
    const checks=[...s.packets.values()].filter(p=>p.kind==='ig-check');
    assert.equal(checks.length,1);const check=checks[0];
    assert.equal(check.source,recipient);assert.equal(check.destination,'instagram');
    assert.equal(check.initialHeader.dport,443);assert.equal(check.initialHeader.sport,recipient==='friend'?52002:51002);
    assert.equal(check.payload.account,recipient==='friend'?'@matej':'@ty.na.lipove');
    assert(check.label.includes('Kontrola nových zpráv'));
    assert(packetView(s.net,check).includes('Kontrola nových zpráv'));
    assert(packetView(s.net,check).includes(check.payload.account));
    assert(![...s.packets.values()].some(p=>p.kind==='ig-delivery'),'No response exists until the server processes the received check');
    finish(s);assert.equal(s.status,'success');assert.equal(s.net.friend.text,text);
    const delivery=[...s.packets.values()].find(p=>p.kind==='ig-delivery');
    assert.equal(delivery.initialHeader.dst,check.src);assert.equal(delivery.initialHeader.dport,check.sport);
  }
});

test('An offline recipient and a lost check keep the stored message; reconnecting checks again without uploading again',()=>{
  const s=new Simulation(),text='Zpráva počká na kontrolu';s.net.toggleNode('friend');
  send(s,'laptop',text);assert.equal(s.status,'waiting');
  const uploads=[...s.packets.values()].filter(p=>p.kind==='message').map(p=>p.id);
  assert(![...s.packets.values()].some(p=>p.kind==='ig-check'||p.kind==='ig-delivery'));
  s.net.toggleNode('friend');assert(s.resumePending());
  until(s,()=>[...s.packets.values()].some(p=>p.kind==='ig-check'&&p.state==='transit'));
  s.net.toggleLink('friend-uplink');finish(s);
  assert.equal(s.status,'waiting');assert.equal(s.net.instagram.text,text);assert.equal(s.net.friend.text,'');
  assert(![...s.packets.values()].some(p=>p.kind==='ig-delivery'));
  s.net.toggleLink('friend-uplink');assert(s.resumePending());finish(s);
  assert.equal(s.status,'success');assert.equal(s.net.friend.text,text);
  assert.equal([...s.packets.values()].filter(p=>p.kind==='ig-check').length,2);
  assert.deepEqual([...s.packets.values()].filter(p=>p.kind==='message').map(p=>p.id),uploads);
});

test('Losing the NAT binding after a check requires another check before returning the message',()=>{
  const s=new Simulation();assert(s.start('message',{text:'Nová návratová cesta'}));
  until(s,()=>[...s.packets.values()].some(p=>p.kind==='ig-check'&&p.state==='delivered'));
  assert(![...s.packets.values()].some(p=>p.kind==='ig-delivery'));
  s.net.clearNat('friend-home');finish(s);
  assert.equal(s.status,'success');assert.equal(s.net.friend.text,'Nová návratová cesta');
  const checks=[...s.packets.values()].filter(p=>p.kind==='ig-check');assert.equal(checks.length,2);
  const delivery=[...s.packets.values()].find(p=>p.kind==='ig-delivery');
  assert.equal(delivery.initialHeader.dst,checks[1].src);assert.equal(delivery.initialHeader.dport,checks[1].sport);
});
