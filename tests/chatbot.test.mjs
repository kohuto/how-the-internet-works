import '../js/network.js';
import '../js/cloud.js';
import '../js/media.js';
import '../js/web.js';
import '../js/vpn.js';
import '../js/phishing.js';
import '../js/mitm.js';import '../js/simulation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {Simulation,CHATBOT_REPLY,MSS}=globalThis.InternetLab;
const turn=sim=>sim.chatTurn();
function until(sim,predicate) {
  for(let i=0;i<1500&&!predicate()&&sim.status==='running';i++)sim.advance();
  assert(predicate(),'Expected simulation state must be reached');
}
function finish(sim) {
  const events=[];
  for(let i=0;i<1500&&sim.status==='running';i++){sim.advanceFrame();events.push(...sim.frame);}
  assert.notEqual(sim.status,'running');return events;
}
function run(sim,prompt='Ahoj',device='laptop'){assert(sim.start('chatbot',{prompt,device}));return finish(sim);}

test('A complete prompt reaches the server before three compute steps; answer appears only after the return trip',()=> {
  const sim=new Simulation();assert(sim.start('chatbot',{prompt:'Jak se máš?'}));
  assert.equal(turn(sim).answer,'');assert.equal(sim.net.chatbot.server.prompt,'');
  until(sim,()=>turn(sim).state==='processing');
  assert.equal(sim.net.chatbot.server.prompt,'Jak se máš?');assert.equal(sim.net.chatbot.server.step,0);
  assert(![...sim.packets.values()].some(p=>p.kind==='chatbot-response'));
  for(let step=1;step<=2;step++) {
    assert.equal(sim.advance().kind,'chatbot-compute');assert.equal(sim.net.chatbot.server.step,step);
    assert.equal(turn(sim).answer,'');assert.equal(sim.net.chatbot.server.answer,'');
  }
  sim.advance();assert.equal(sim.net.chatbot.server.answer,CHATBOT_REPLY);assert.equal(sim.net.chatbot.server.processed,1);
  assert.equal(turn(sim).state,'receiving');assert.equal(turn(sim).answer,'');
  const reply=[...sim.packets.values()].find(p=>p.kind==='chatbot-response');assert.equal(reply.state,'waiting');
  finish(sim);assert.equal(sim.status,'success');assert.equal(turn(sim).answer,CHATBOT_REPLY);
  assert.equal(turn(sim).receivedBytes,new TextEncoder().encode(CHATBOT_REPLY).length);
});

test('Every arbitrary prompt gets the same server answer and histories stay independent across all devices',()=> {
  const sim=new Simulation(),prompts=['Kolik je 2 + 2?','<script>dotaz</script> & 🙂\n世界','Pověz příběh'];
  for(const [i,device] of ['laptop','friend','phone'].entries()) {
    run(sim,prompts[i],device);assert.equal(sim.status,'success');
    assert.equal(turn(sim).answer,CHATBOT_REPLY);assert.equal(sim.net.chatbot.server.prompt,prompts[i]);
    assert.equal(sim.net.chatbot.clients[device].turns.length,1);
  }
  run(sim,'Úplně jiný dotaz');assert.equal(sim.net.chatbot.clients.laptop.turns.length,2);
  assert.equal(sim.net.chatbot.clients.friend.turns.length,1);assert.equal(sim.net.chatbot.server.processed,4);
  assert(!sim.start('chatbot',{prompt:' \n '}));assert(!sim.start('chatbot',{prompt:'Ahoj',device:'web'}));
});

test('Long UTF-8 input is reassembled completely, including out-of-order segments, before computation',()=> {
  const sim=new Simulation(),prompt='a'.repeat(MSS-1)+'🙂 příliš žluťoučký kůň '.repeat(130);
  assert(sim.start('chatbot',{prompt}));sim.advance();
  const origins=sim.queue.filter(e=>e.kind==='origin');assert(origins.length>2);
  // Delay the first segment so later bytes arrive first; the server must still wait.
  origins[0].at+=300;sim.queue.sort((a,b)=>a.at-b.at||a.order-b.order);
  until(sim,()=>turn(sim).sentBytes>0);
  assert.equal(turn(sim).state,'sending');assert.equal(sim.net.chatbot.server.prompt,'');assert.equal(sim.net.chatbot.server.processed,0);
  finish(sim);assert.equal(sim.status,'success');assert.equal(sim.net.chatbot.server.prompt,prompt);
  assert.equal(turn(sim).answer,CHATBOT_REPLY);
  const packets=[...sim.packets.values()].filter(p=>p.kind==='chatbot-request');
  assert.equal(packets.length,Math.ceil(new TextEncoder().encode(prompt).length/MSS));
  assert(packets.every(p=>p.payload.bytes.length<=MSS));assert.equal(packets[1].seq,1001+MSS);
});

test('Home NAT translates the chatbot request and restores the response on each household connection',()=> {
  for(const [device,router] of [['laptop','home'],['friend','friend-home']]) {
    const sim=new Simulation();run(sim,'Ahoj',device);assert.equal(sim.status,'success');
    const request=[...sim.packets.values()].find(p=>p.kind==='chatbot-request'),reply=[...sim.packets.values()].find(p=>p.kind==='chatbot-response');
    assert.equal(request.src,sim.net.natAddress(router));assert.equal(reply.initialHeader.dst,request.src);assert.equal(reply.initialHeader.dport,request.sport);
    assert.equal(reply.dst,sim.net.nodes[device].ip);assert.equal(reply.dport,51004);assert.equal(reply.natHistory[0].direction,'in');
  }
});

test('Wi-Fi and cellular use their active access path without substituting a local answer',()=> {
  for(const [device,mode,link] of [['laptop','wifi','laptop-wifi'],['friend','wifi','friend-wifi'],['phone','wifi','phone-wifi'],['phone','cellular','phone-bts-lipova']]) {
    const sim=new Simulation();sim.net.setAccess(device,mode);
    const events=run(sim,'Odkud přichází odpověď?',device);assert.equal(sim.status,'success');
    assert(events.some(e=>e.kind==='hop'&&e.link===link));assert.equal(turn(sim).answer,CHATBOT_REPLY);
    if(mode==='cellular'){assert(!events.some(e=>e.kind==='route'&&e.node==='home'));assert([...sim.packets.values()].every(p=>p.natHistory.length===0));}
  }
});

test('Offline client or unreachable server yields no answer and does not erase earlier delivered conversations',()=> {
  for(const outage of ['client','access','server','hosting']) {
    const sim=new Simulation();run(sim);const previous=turn(sim);
    if(outage==='client')sim.net.toggleNode('laptop');if(outage==='access')sim.net.setAccess('laptop','offline');
    if(outage==='server')sim.net.toggleNode('chatbot');if(outage==='hosting')sim.net.toggleLink('dc-access');
    run(sim,'Druhý dotaz');assert.equal(sim.status,'failed');assert.equal(turn(sim).state,'error');assert.equal(turn(sim).answer,'');
    assert.equal(previous.answer,CHATBOT_REPLY);assert.equal(sim.net.chatbot.server.processed,1);
  }
});

test('Power loss during server computation prevents a reply and a restored server accepts retry',()=> {
  const sim=new Simulation();sim.start('chatbot',{prompt:'Než vypnu server'});until(sim,()=>sim.net.chatbot.server.step===1);
  sim.net.toggleNode('chatbot');finish(sim);assert.equal(sim.status,'failed');assert.equal(turn(sim).answer,'');
  assert.equal(sim.net.chatbot.server.state,'interrupted');assert.equal(sim.net.chatbot.server.processed,0);
  assert(![...sim.packets.values()].some(p=>p.kind==='chatbot-response'));
  sim.net.toggleNode('chatbot');assert(sim.repeat());finish(sim);assert.equal(turn(sim).answer,CHATBOT_REPLY);
  assert.equal(sim.net.chatbot.clients.laptop.turns[0].state,'error');
});

test('A server-computed answer is not displayed when the return NAT binding is gone',()=> {
  const sim=new Simulation();sim.start('chatbot',{prompt:'Dorazí odpověď?'});until(sim,()=>turn(sim).state==='receiving');
  assert.equal(sim.net.chatbot.server.answer,CHATBOT_REPLY);sim.net.clearNat('home');finish(sim);
  assert.equal(sim.status,'failed');assert.equal(turn(sim).answer,'');assert.equal(sim.net.chatbot.server.processed,1);
  assert(sim.repeat());finish(sim);assert.equal(sim.status,'success');assert.equal(turn(sim).answer,CHATBOT_REPLY);
});

test('Changing client access or repeating during compute closes the pending turn and never leaves it waiting',()=> {
  const sim=new Simulation();sim.start('chatbot',{prompt:'První pokus'});until(sim,()=>turn(sim).state==='processing');
  sim.net.setAccess('laptop','wifi');sim.connectionChanged('laptop');assert.equal(sim.status,'failed');assert.equal(turn(sim).state,'error');
  assert(sim.repeat());until(sim,()=>turn(sim).state==='processing');const abandoned=turn(sim);
  sim.status='stopped';assert(sim.repeat());assert.equal(abandoned.state,'error');finish(sim);
  assert.equal(turn(sim).answer,CHATBOT_REPLY);assert.equal(sim.net.chatbot.clients.laptop.turns.length,3);
});
