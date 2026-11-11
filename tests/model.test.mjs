import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const {Network,Simulation,DEFAULT_MESSAGE,MSS,DELIVERY_MSS,MAC}=globalThis.InternetLab;
const LONG_MESSAGE=DEFAULT_MESSAGE.repeat(12);
function finish(sim) {
  const events=[];
  for(let n=0;sim.status==='running'&&n<2500;n++) {
    sim.advanceFrame();events.push(...structuredClone(sim.frame));
  }
  assert.notEqual(sim.status,'running','Simulation must terminate');
  return events;
}
function action(sim,type,payload={}) {sim.start(type,payload);return finish(sim);}
function branch(events) {return events.filter(e=>e?.kind==='hop'&&!e.discarded).map(e=>e.link);}

test('DNS precedes HTTP, response content is delivered and rendered only after reception',()=> {
  const sim=new Simulation();sim.start('web');
  assert.equal(sim.net.browser.content,null);
  const events=finish(sim);
  assert.equal(sim.status,'success');
  const origins=events.filter(e=>e?.kind==='origin').map(e=>e.packet.kind);
  assert.deepEqual(origins,['dns-query','dns-response','http-request','http-response']);
  assert.equal(sim.net.browser.content,'Dnes otevřeno do 16 hodin');
  assert.equal(sim.net.browser.dnsCache['knihovna.test'],'203.0.113.10');
  const content=sim.net.browser.content;
  sim.net.server.title='Dnes otevřeno do 18 hodin';sim.net.server.revision++;
  assert.equal(sim.net.browser.content,content,'Server edit must not push content to browser');
  const second=action(sim,'web');
  assert(!second.some(e=>e?.packet?.kind==='dns-query'),'DNS cache skips a second query');
  assert.equal(sim.net.browser.content,sim.net.server.title);
  assert.equal(sim.net.browser.revision,2);
  sim.net.toggleLink('uplink');action(sim,'web');
  assert.equal(sim.status,'failed');
  assert.equal(sim.net.browser.state,'error');
  assert.equal(sim.net.browser.content,'Dnes otevřeno do 18 hodin','Failed refresh preserves the previously displayed content');
});

test('Server content is snapshotted when HTTP request arrives, not at action start or at response delivery',()=> {
  const sim=new Simulation();sim.start('web');
  while(![...sim.packets.values()].some(p=>p.kind==='http-request'))sim.advance();
  sim.net.server.title='Změněno před přijetím požadavku';sim.net.server.revision=2;
  while(![...sim.packets.values()].some(p=>p.kind==='http-response'))sim.advance();
  sim.net.server.title='Změněno až po odeslání odpovědi';sim.net.server.revision=3;
  finish(sim);
  assert.equal(sim.net.browser.content,'Změněno před přijetím požadavku');
  assert.equal(sim.net.browser.revision,2);
});

test('LAN print works without provider or router; first frame learns only source and floods active other ports',()=> {
  const sim=new Simulation();sim.net.toggleLink('uplink');
  const events=action(sim,'print',{document:'Síť.pdf'});
  assert.equal(sim.status,'success');assert.equal(sim.net.printer.document,'Síť.pdf');
  const decision=events.find(e=>e?.kind==='switch'&&e.node==='switch').decision;
  assert.equal(decision.input,'p1');assert.equal(decision.src,MAC.laptop);assert.equal(decision.dst,MAC.printer);
  assert.equal(decision.action,'flood');assert.deepEqual(decision.ports,['p2','p3','p4']);
  assert.equal(decision.table[MAC.laptop],'p1');assert(!decision.table[MAC.printer],'Destination address must not be learned from destination field');
  assert(!branch(events).includes('uplink'));
  sim.net.toggleNode('home');action(sim,'print');assert.equal(sim.status,'success');
  action(sim,'web');assert.equal(sim.status,'failed');
});

test('Known MAC selects the learned port; NAT changes the WAN header and routers rewrite Ethernet',()=> {
  const sim=new Simulation();const events=action(sim,'web');
  const returned=events.find(e=>e?.kind==='switch'&&e.node==='switch'&&e.packet.kind==='dns-response');
  assert.equal(returned.decision.action,'known');assert.deepEqual(returned.decision.ports,['p1']);
  assert.equal(returned.decision.table[MAC.home],'p3');
  const outgoing=events.filter(e=>e?.kind==='hop'&&e.packet.kind==='http-request');
  assert(outgoing.some(e=>e.frame.dst===MAC.home));
  assert(outgoing.some(e=>e.from==='hosting-router'&&e.frame.dst===MAC.web));
  assert(outgoing.every(e=>e.header.src===(e.from==='laptop'||e.from==='switch'||e.from==='ap'?'192.168.10.10':'192.0.2.1')&&e.header.dst==='203.0.113.10'));
  assert(outgoing.some(e=>e.from==='home'&&e.header.sport>=40000));
  for(const e of events.filter(e=>e?.kind==='route')) {
    assert(e.decision.row);assert.equal(e.decision.dst,e.packet.dst);
  }
});

test('Message splits into genuinely needed segments on sender and reassembles UTF-8 bytes exactly',()=> {
  const sim=new Simulation();sim.start('message',{text:LONG_MESSAGE});
  const first=sim.advance();assert.equal(first.kind,'segment');
  const parts=[...sim.packets.values()];assert(parts.length>=3);
  const encoded=new TextEncoder().encode(LONG_MESSAGE);
  assert.equal(parts.length,Math.ceil(encoded.length/MSS));
  for(const [i,p] of parts.entries()) {
    assert.equal(p.location,'laptop');assert.equal(p.seq,1001+i*MSS);
    assert.equal(p.payload.offset,i*MSS);assert(p.payload.bytes.length<=MSS);
    assert.deepEqual(p.payload.bytes,encoded.slice(p.payload.offset,p.payload.end));
    assert(40+p.payload.bytes.length<1500,'No IP fragmentation required');
  }
  finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,LONG_MESSAGE);
  assert.equal(sim.net.instagram.receivedBytes,encoded.length);
  const unicode='🙂ěščřžýáíé'.repeat(300);action(sim,'message',{text:unicode});
  assert.equal(sim.net.friend.text,unicode,'Byte splitting inside a Unicode character must not corrupt reassembly');
});

test('Stable routes, alternate route, total failure, restore and repeat preserve network and server edits',()=> {
  const sim=new Simulation();
  const first=branch(action(sim,'web'));
  assert(first.includes('edge-north'));assert(!first.includes('edge-south'));
  sim.repeat();const warm=branch(finish(sim));sim.repeat();assert.deepEqual(branch(finish(sim)),warm);
  sim.net.server.title='Změna přetrvá';sim.net.server.revision=2;
  sim.net.toggleLink('north-dc');sim.repeat();
  const alternate=branch(finish(sim));assert.equal(sim.status,'success');assert(alternate.includes('edge-south'));assert(!alternate.includes('north-dc'));
  sim.net.toggleLink('south-dc');sim.repeat();finish(sim);assert.equal(sim.status,'failed');assert.equal(sim.net.browser.content,'Změna přetrvá');
  sim.net.toggleLink('north-dc');sim.repeat();finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.browser.content,'Změna přetrvá');
  sim.net.toggleLink('dc-access');sim.repeat();finish(sim);assert.equal(sim.status,'failed');
  sim.net.toggleLink('dc-access');sim.repeat();finish(sim);assert.equal(sim.status,'success');
  const clean=new Network();assert.equal(clean.server.revision,1);assert.equal(clean.server.title,'Dnes otevřeno do 16 hodin');assert(Object.values(clean.links).every(l=>l.on));assert.deepEqual(clean.nodes.switch.macTable,{});
});

test('TCP passes only contiguous bytes to the application; a later web action does not corrupt partial-message totals',()=> {
  const sim=new Simulation();sim.start('message',{text:LONG_MESSAGE});sim.advance();
  // Inject reordered arrival without adding a student-facing control for future stages.
  [sim.queue[0].at,sim.queue[1].at]=[sim.queue[1].at,sim.queue[0].at];
  sim.queue.sort((a,b)=>a.at-b.at||a.order-b.order);
  for(let i=0;i<100&&sim.net.instagram.receivedBytes===0;i++)sim.advance();
  assert.equal(sim.net.instagram.receivedBytes,MSS);assert.equal(sim.net.instagram.streamBytes,0);
  for(let i=0;i<100&&sim.net.instagram.streamBytes===0;i++)sim.advance();
  assert.equal(sim.net.instagram.streamBytes,2*MSS);
  const total=sim.net.instagram.totalBytes;
  // Later segments have already passed the uplink; cut the link still ahead of them.
  sim.net.toggleLink('instagram-switch');finish(sim);assert.equal(sim.status,'failed');
  assert.equal(sim.net.instagram.state,'failed');assert.equal(sim.net.friend.text,'');
  action(sim,'web');assert.equal(sim.net.instagram.totalBytes,total);assert.equal(sim.net.instagram.streamBytes,2*MSS);
  sim.net.toggleLink('instagram-switch');action(sim,'message',{text:LONG_MESSAGE});
  assert.equal(sim.net.friend.text,LONG_MESSAGE);assert.equal(sim.net.instagram.state,'delivered');
});

test('A packet scheduled onto a link that is then cut is lost and never teleports to an alternative',()=> {
  const sim=new Simulation();sim.start('message',{text:DEFAULT_MESSAGE});
  for(let i=0;i<200;i++) {
    const e=sim.advance();if(e?.kind==='route'&&e.node==='edge')break;
  }
  const scheduled=sim.queue.find(e=>e.kind==='hop'&&e.link==='edge-north');assert(scheduled);
  const id=scheduled.packet.id;sim.net.toggleLink('edge-north');
  const events=finish(sim);assert.equal(events.at(-1).kind,'failure');assert.equal(sim.status,'failed');
  assert(!events.some(e=>e.kind==='hop'&&e.packet.id===id&&e.link==='edge-south'));
  assert.equal(sim.packets.get(id).state,'lost');assert.equal(sim.packets.get(id).location,'edge');assert.equal(sim.net.friend.text,'');
  assert([...sim.packets.values()].every(p=>p.state!=='transit'&&p.state!=='waiting'),'Failure stops every remaining in-flight or queued segment');
  sim.repeat();const retried=branch(finish(sim));assert.equal(sim.status,'success');assert(retried.includes('edge-south'));
});

test('Message packets launch with a gap, overlap in flight and move on different links in the same frame',()=> {
  const sim=new Simulation();sim.start('message',{text:LONG_MESSAGE});
  const events=[];let concurrentHops=false,concurrentLocations=false,lastTime=0;
  while(sim.status==='running') {
    sim.advanceFrame();assert(sim.time>=lastTime);lastTime=sim.time;
    assert(sim.frame.every(e=>e.at===sim.time),'One frame covers one shared time slot');
    events.push(...structuredClone(sim.frame));
    const hops=sim.frame.filter(e=>e.kind==='hop'&&!e.discarded);
    if(new Set(hops.map(e=>e.packet.id)).size>1&&new Set(hops.map(e=>e.link)).size>1)concurrentHops=true;
    const active=[...sim.packets.values()].filter(p=>p.state==='transit');
    if(active.length>=3&&new Set(active.map(p=>p.location)).size>=3)concurrentLocations=true;
  }
  const origins=events.filter(e=>e.kind==='origin'),deliveries=events.filter(e=>e.kind==='deliver');
  assert(origins[1].at<deliveries[0].at,'Second packet leaves before the first reaches the server');
  assert(origins.every((e,i)=>!i||e.at>origins[i-1].at),'Packets leave at distinct times');
  assert(concurrentHops,'Multiple packets traverse different links together');assert(concurrentLocations);
  assert.equal(sim.net.friend.text,LONG_MESSAGE);
  sim.repeat();const warm=finish(sim).filter(e=>!e.discarded).map(e=>[e.at,e.kind,e.link,e.packet?.id.split('.')[1]]);
  sim.repeat();assert.deepEqual(finish(sim).filter(e=>!e.discarded).map(e=>[e.at,e.kind,e.link,e.packet?.id.split('.')[1]]),warm,'Repeats with the same prepared NAT sessions preserve deterministic timing');
});

test('Packets contending for one outgoing link use separate time slots and reassemble correctly',()=> {
  const sim=new Simulation();sim.start('message',{text:'🙂ěščřž'.repeat(600)});sim.advanceFrame();
  // Stress the link queue by making all prepared segments ready at once.
  for(const e of sim.queue)e.at=sim.time+1;
  const events=finish(sim),occupied=new Set();
  for(const e of events.filter(e=>e.kind==='hop')) {
    const slot=`${e.at}:${e.link}:${e.from}`;
    assert(!occupied.has(slot),'A link must serialize frames in each direction');occupied.add(slot);
  }
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,'🙂ěščřž'.repeat(600));
});

test('Endpoint outages and restoration produce consistent delivery results',()=> {
  const sim=new Simulation();sim.net.toggleNode('printer');action(sim,'print');assert.equal(sim.status,'failed');assert.equal(sim.net.printer.count,0);
  sim.net.toggleNode('printer');action(sim,'print');assert.equal(sim.status,'success');assert.equal(sim.net.printer.count,1);
  sim.net.toggleNode('dns');action(sim,'web');assert.equal(sim.status,'failed');assert.equal(sim.net.browser.content,null);
  sim.net.toggleNode('dns');action(sim,'web');assert.equal(sim.status,'success');
  sim.net.toggleNode('dns');action(sim,'web');assert.equal(sim.status,'success','Cached DNS does not require a live DNS server');
  sim.net.toggleNode('web');action(sim,'web');assert.equal(sim.status,'failed');assert(sim.net.browser.content);
});

test('Instagram accepts a complete message before creating independent delivery packets for another household',()=> {
  const sim=new Simulation();sim.start('message',{text:DEFAULT_MESSAGE});
  for(let n=0;!sim.net.instagram.text&&n<200;n++)sim.advanceFrame();
  assert.equal(sim.net.instagram.text,DEFAULT_MESSAGE);assert.equal(sim.net.friend.text,'');
  assert.equal(sim.net.sender.state,'sent');assert.equal(sim.net.instagram.state,'queued');
  assert([...sim.packets.values()].every(p=>p.kind==='message'),'Second leg starts only after the server accepted the complete message');
  const upload=[...sim.packets.values()];
  for(let n=0;![...sim.packets.values()].some(p=>p.kind==='ig-delivery')&&n<150;n++)sim.advanceFrame();
  const delivery=[...sim.packets.values()].filter(p=>p.kind==='ig-delivery');
  assert(delivery.length);assert.equal(upload.length,delivery.length,'Equal MSS produces the same count, with independent packet identities');
  assert(upload.every(p=>p.initialHeader.src==='192.168.10.10'&&p.src==='192.0.2.1'&&p.dst==='203.0.113.80'&&p.connection==='ty-instagram'));
  assert(delivery.every(p=>p.src==='203.0.113.80'&&p.dst==='192.0.2.26'&&p.connection==='instagram-matej'));
  for(const [i,p] of delivery.entries()){assert.equal(p.seq,8001+i*DELIVERY_MSS);assert(p.payload.bytes.length<=DELIVERY_MSS);assert(!upload.some(u=>u.id===p.id));}
  finish(sim);assert.equal(sim.net.friend.text,DEFAULT_MESSAGE);assert.equal(sim.net.sender.state,'delivered');
  assert.equal(sim.net.friend.read,false);assert(![...sim.packets.values()].some(p=>p.kind==='ig-read'));
});

test('Offline recipient leaves the accepted message on Instagram; later delivery survives sender disconnection and other experiments',()=> {
  const sim=new Simulation();sim.net.toggleNode('friend');action(sim,'message',{text:DEFAULT_MESSAGE});
  assert.equal(sim.status,'waiting');assert.equal(sim.net.instagram.text,DEFAULT_MESSAGE);assert.equal(sim.net.friend.text,'');assert.equal(sim.net.sender.state,'sent');
  assert.equal(sim.start('message',{text:'Nesmí přepsat čekající zprávu'}),false);
  action(sim,'web');assert.equal(sim.net.browser.state,'ready');assert.equal(sim.net.instagram.text,DEFAULT_MESSAGE);
  sim.net.toggleNode('friend');sim.net.toggleLink('uplink');assert(sim.resumePending());
  const events=finish(sim);assert.equal(sim.net.friend.text,DEFAULT_MESSAGE);
  assert(!events.some(e=>e.packet?.kind==='message'),'A stored message is not uploaded again');
  assert(!branch(events).includes('uplink'),'Recipient delivery does not require the sender household online');
});

test('Interrupted recipient delivery keeps the stored message and retries with fresh packet identities',()=> {
  const sim=new Simulation();sim.start('message',{text:'Žluťoučký kůň 🙂 '.repeat(350)});
  for(let n=0;sim.net.friend.receivedBytes===0&&n<300;n++)sim.advanceFrame();
  assert(sim.net.friend.receivedBytes>0);assert(sim.net.friend.receivedBytes<sim.net.instagram.totalBytes);
  const stored=sim.net.instagram.text,oldIds=[...sim.packets.values()].filter(p=>p.kind==='ig-delivery').map(p=>p.id);
  sim.net.toggleLink('friend-laptop-switch');finish(sim);
  assert.equal(sim.status,'waiting');assert.equal(sim.net.instagram.text,stored);assert.equal(sim.net.friend.text,'');
  sim.net.toggleLink('friend-laptop-switch');assert(sim.resumePending());finish(sim);
  assert.equal(sim.net.friend.text,stored);assert.equal(sim.net.friend.receivedBytes,new TextEncoder().encode(stored).length);
  assert([...sim.packets.values()].some(p=>p.kind==='ig-delivery'&&!oldIds.includes(p.id)));
  sim.start('message',{text:stored});
  for(let n=0;sim.net.instagram.state!=='delivering'&&n<300;n++)sim.advanceFrame();
  sim.net.toggleNode('friend');sim.status='stopped';sim.repeat();
  assert.equal(sim.status,'waiting');assert.equal(sim.net.instagram.text,stored);
  assert([...sim.packets.values()].every(p=>p.state!=='transit'&&p.state!=='waiting'),'Repeating an unavailable second leg leaves no old flight running');
  sim.net.toggleNode('friend');assert(sim.resumePending());finish(sim);assert.equal(sim.net.friend.text,stored);
});

test('Opening the recipient conversation creates a read receipt through Instagram before the sender sees it',()=> {
  const sim=new Simulation();action(sim,'message',{text:DEFAULT_MESSAGE});
  assert.equal(sim.net.sender.state,'delivered');assert(sim.markRead());assert.equal(sim.net.friend.read,true);
  assert.equal(sim.net.sender.state,'delivered','Reading locally is not yet a receipt at the sender');
  for(let n=0;!sim.net.instagram.readKnown&&n<200;n++)sim.advanceFrame();
  assert(sim.net.instagram.readKnown);assert.equal(sim.net.sender.state,'delivered');
  finish(sim);assert.equal(sim.net.sender.state,'read');
  const receipts=[...sim.packets.values()].filter(p=>p.kind==='ig-read');
  assert.deepEqual(receipts.map(p=>[p.source,p.destination]),[['friend','instagram'],['instagram','laptop']]);
  assert(receipts.every(p=>p.state==='delivered'));assert.equal(sim.net.instagram.readNotified,true);
});

test('Disabled read receipts keep sender at delivered, including a conversation already open during reception',()=> {
  const sim=new Simulation();sim.net.friend.receipts=false;sim.net.friend.chatOpen=true;
  action(sim,'message',{text:DEFAULT_MESSAGE});assert.equal(sim.net.friend.read,true);assert.equal(sim.net.sender.state,'delivered');
  assert(![...sim.packets.values()].some(p=>p.kind==='ig-read'));
  sim.net.friend.receipts=true;assert(sim.markRead());finish(sim);assert.equal(sim.net.sender.state,'read');
});

test('A conversation open during delivery reads the completed message and sends the receipt automatically',()=> {
  const sim=new Simulation();sim.net.friend.chatOpen=true;
  action(sim,'message',{text:DEFAULT_MESSAGE});
  assert.equal(sim.net.friend.text,DEFAULT_MESSAGE);assert.equal(sim.net.friend.read,true);
  assert.equal(sim.net.sender.state,'read');assert.equal(sim.net.instagram.readNotified,true);
});

test('Instagram queues a read receipt while sender is offline and forwards only the remaining leg after reconnection',()=> {
  const sim=new Simulation();action(sim,'message',{text:DEFAULT_MESSAGE});sim.net.toggleLink('uplink');assert(sim.markRead());finish(sim);
  assert.equal(sim.status,'waiting');assert(sim.net.instagram.readKnown);assert(!sim.net.instagram.readNotified);assert.equal(sim.net.sender.state,'delivered');
  sim.net.toggleLink('uplink');assert(sim.resumePending());const events=finish(sim);
  assert(events.filter(e=>e.kind==='origin'&&e.packet.kind==='ig-read').every(e=>e.packet.source==='instagram'&&e.packet.destination==='laptop'));
  assert(events.some(e=>e.kind==='origin'&&e.packet.kind==='ig-connect'&&e.packet.source==='laptop'),'The sender reopens its NAT session before the stored receipt returns');
  assert.equal(sim.net.sender.state,'read');
});

test('Sender and Instagram outages prevent acceptance; an offline Instagram retains an already accepted message',()=> {
  for(const [kind,id] of [['node','laptop'],['node','instagram'],['link','uplink'],['link','instagram-switch']]) {
    const sim=new Simulation();kind==='node'?sim.net.toggleNode(id):sim.net.toggleLink(id);action(sim,'message',{text:DEFAULT_MESSAGE});
    assert.equal(sim.status,'failed');assert.equal(sim.net.instagram.text,'');assert.equal(sim.net.friend.text,'');
  }
  const sim=new Simulation();sim.net.toggleNode('friend');action(sim,'message',{text:DEFAULT_MESSAGE});
  sim.net.toggleNode('instagram');sim.net.toggleNode('friend');assert.equal(sim.resumePending(),false);assert.equal(sim.net.instagram.text,DEFAULT_MESSAGE);
  sim.net.toggleNode('instagram');assert(sim.resumePending());finish(sim);assert.equal(sim.net.friend.text,DEFAULT_MESSAGE);
});

test('Laptop Wi-Fi bridges into the home LAN and returns DNS/HTTP through the AP',()=> {
  const sim=new Simulation();sim.net.setAccess('laptop','wifi');
  const events=action(sim,'web'),hops=branch(events);
  assert.equal(sim.status,'success');assert(hops.includes('laptop-wifi'));assert(hops.includes('ap-switch'));
  assert(!hops.includes('laptop-switch'));assert.equal(sim.net.nodes.laptop.ip,'192.168.10.11');
  assert(events.some(e=>e.kind==='switch'&&e.node==='ap'&&e.frame.src===sim.net.nodes.laptop.mac));
  const received=[...sim.packets.values()].find(p=>p.kind==='http-response');
  assert.equal(received.dst,'192.168.10.11');assert.equal(received.state,'delivered');
  assert.equal(sim.net.browser.content,sim.net.server.title);
});

test('Wi-Fi local print survives an offline home router; AP loss affects Wi-Fi but not cable',()=> {
  const sim=new Simulation();sim.net.setAccess('laptop','wifi');sim.net.toggleNode('home');
  const events=action(sim,'print',{document:'Bezdrátový tisk.pdf'});
  assert.equal(sim.status,'success');assert(!branch(events).includes('uplink'));
  sim.net.toggleNode('ap');action(sim,'print');assert.equal(sim.status,'failed');
  sim.net.setAccess('laptop','cable');action(sim,'print');assert.equal(sim.status,'success');
  sim.net.setAccess('laptop','offline');action(sim,'print');assert.equal(sim.status,'failed');
});

test('Phone cellular DNS/HTTP crosses a BTS and operator core in both directions, with no home LAN',()=> {
  const sim=new Simulation();sim.net.toggleLink('uplink');sim.net.toggleNode('ap');
  const events=action(sim,'web',{device:'phone'}),hops=branch(events);
  assert.equal(sim.status,'success');assert.equal(sim.net.phoneBrowser.content,sim.net.server.title);assert.equal(sim.net.browser.content,null);
  for(const id of ['phone-bts-lipova','bts-lipova-core','mobile-uplink'])assert(hops.includes(id));
  for(const id of ['phone-wifi','ap-switch','uplink','phone-bts-park'])assert(!hops.includes(id));
  assert(events.some(e=>e.kind==='hop'&&e.from==='phone'&&e.to==='bts-lipova'));
  assert(events.some(e=>e.kind==='hop'&&e.from==='bts-lipova'&&e.to==='phone'));
  assert(!events.some(e=>e.kind==='route'&&e.node.startsWith('bts-')),'BTS does not route or decrement inner IP TTL');
  for(const p of sim.packets.values()) {
    const routed=events.filter(e=>e.kind==='route'&&e.packet.id===p.id).length;
    assert.equal(p.ttl,64-routed);
    assert.equal(p.source==='phone'?p.src:p.dst,'198.51.100.10');
  }
  assert(events.some(e=>e.kind==='radio-relay'));
});

test('Phone Wi-Fi and cellular paths fail independently, use different IPs, and preserve separate browser caches',()=> {
  const sim=new Simulation();sim.net.setAccess('phone','wifi');
  let events=action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
  assert(branch(events).includes('phone-wifi'));assert(!branch(events).includes('mobile-uplink'));
  assert.equal(sim.net.nodes.phone.ip,'192.168.10.30');assert(sim.net.phoneBrowser.dnsCache['knihovna.test']);assert.deepEqual(sim.net.browser.dnsCache,{});
  sim.net.toggleLink('uplink');action(sim,'web',{device:'phone'});assert.equal(sim.status,'failed');
  sim.net.setAccess('phone','cellular');events=action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
  assert.equal(sim.net.nodes.phone.ip,'198.51.100.10');assert(!branch(events).includes('uplink'));
  sim.net.toggleLink('mobile-uplink');action(sim,'web',{device:'phone'});assert.equal(sim.status,'failed');
  sim.net.toggleLink('uplink');sim.net.setAccess('phone','wifi');action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
});

test('Only the selected BTS carries mobile data; another station can restore service after a tower or backhaul outage',()=> {
  const sim=new Simulation();sim.net.toggleNode('bts-lipova');action(sim,'web',{device:'phone'});assert.equal(sim.status,'failed');
  sim.net.setAccess('phone','cellular','bts-park');let events=action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
  assert(branch(events).includes('phone-bts-park'));assert(branch(events).includes('bts-park-core'));assert(!branch(events).includes('bts-lipova-core'));
  sim.net.toggleLink('bts-park-core');action(sim,'web',{device:'phone'});assert.equal(sim.status,'failed');
  sim.net.toggleNode('bts-lipova');sim.net.setAccess('phone','cellular','bts-lipova');action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
});

test('Changing active access stops the old transfer; retry creates packets for the new interface and IP',()=> {
  const sim=new Simulation();sim.start('web',{device:'phone'});
  while(![...sim.packets.values()].some(p=>p.state==='transit'))sim.advanceFrame();
  sim.net.setAccess('phone','wifi');sim.connectionChanged('phone');
  assert.equal(sim.status,'failed');assert([...sim.packets.values()].every(p=>!['waiting','transit'].includes(p.state)));
  sim.repeat();finish(sim);assert.equal(sim.status,'success');assert([...sim.packets.values()].some(p=>p.initialHeader.src==='192.168.10.30'&&p.src==='192.0.2.1'));
  sim.start('web');sim.advanceFrame();sim.net.setAccess('phone','cellular');sim.connectionChanged('phone');assert.equal(sim.status,'running','Unrelated device changes do not stop the notebook');finish(sim);assert.equal(sim.status,'success');
});

test('Phone Instagram uploads through cellular, reaches a friend on Wi-Fi, and receives its read receipt on the phone',()=> {
  const sim=new Simulation();sim.net.setAccess('friend','wifi');
  const text='Z telefonu přes BTS 🙂 '.repeat(20),events=action(sim,'message',{device:'phone',text});
  assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,text);assert.equal(sim.net.instagram.senderDevice,'phone');
  assert(branch(events).includes('phone-bts-lipova'));assert(branch(events).includes('friend-wifi'));
  assert([...sim.packets.values()].filter(p=>p.kind==='message').every(p=>p.src==='198.51.100.10'));
  assert([...sim.packets.values()].filter(p=>p.kind==='ig-delivery').every(p=>p.dst==='172.16.20.11'));
  assert(sim.markRead());finish(sim);assert.equal(sim.net.sender.state,'read');
  const receipt=[...sim.packets.values()].find(p=>p.kind==='ig-read'&&p.source==='instagram');assert.equal(receipt.destination,'phone');assert.equal(receipt.dst,'198.51.100.10');
});

test('An accepted phone message survives source disconnect; delayed receipt follows a new Wi-Fi connection',()=> {
  const sim=new Simulation();sim.net.toggleNode('friend');action(sim,'message',{device:'phone',text:DEFAULT_MESSAGE});assert.equal(sim.status,'waiting');
  sim.net.setAccess('phone','offline');sim.net.toggleNode('friend');assert(sim.resumePending());finish(sim);assert.equal(sim.net.friend.text,DEFAULT_MESSAGE);
  assert(sim.markRead());finish(sim);assert.equal(sim.status,'waiting');assert(sim.net.instagram.readKnown);
  sim.net.setAccess('phone','wifi');assert(sim.resumePending());const events=finish(sim);assert.equal(sim.net.sender.state,'read');
  assert(branch(events).includes('phone-wifi'));assert(!branch(events).includes('phone-bts-lipova'));
  const p=[...sim.packets.values()].find(p=>p.kind==='ig-read'&&p.destination==='phone'&&p.state==='delivered');assert.equal(p.dst,'192.168.10.30');
});

test('Two Wi-Fi clients share the AP without mixing their web responses or MAC associations',()=> {
  const sim=new Simulation();sim.net.setAccess('laptop','wifi');sim.net.setAccess('phone','wifi');
  action(sim,'web');assert.equal(sim.status,'success');assert.equal(sim.net.phoneBrowser.content,null);
  sim.net.server.title='Obsah pouze pro nové načtení v telefonu';sim.net.server.revision++;
  const events=action(sim,'web',{device:'phone'});assert.equal(sim.status,'success');
  assert.equal(sim.net.phoneBrowser.content,sim.net.server.title);assert.equal(sim.net.browser.content,'Dnes otevřeno do 16 hodin');
  assert.equal(sim.net.nodes.ap.macTable[sim.net.nodes.laptop.mac],'wifi1');
  assert.equal(sim.net.nodes.ap.macTable[sim.net.nodes.phone.mac],'wifi2');
  assert(events.filter(e=>e.kind==='deliver'&&e.packet.kind==='http-response').every(e=>e.node==='phone'));
  action(sim,'message',{device:'phone',text:'Stejná Wi-Fi, samostatná zařízení 🙂'});assert.equal(sim.status,'success');assert.equal(sim.net.friend.text,'Stejná Wi-Fi, samostatná zařízení 🙂');
});
