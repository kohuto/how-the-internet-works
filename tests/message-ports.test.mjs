import '../js/network.js';import '../js/settings.js';import '../js/cloud.js';import '../js/media.js';import '../js/web.js';
import '../js/vpn.js';import '../js/phishing.js';import '../js/mitm.js';import '../js/mail.js';import '../js/privacy.js';
import '../js/auth.js';import '../js/ads.js';import '../js/simulation.js';
import test from 'node:test';import assert from 'node:assert/strict';

const {Simulation,Network,LabSettings}=globalThis.InternetLab;
const pair=p=>`${p.sport} → ${p.dport}`;
const create=(features,nat)=>new Simulation(new Network(new LabSettings({features,details:{nat}})));

// Compare every part at the same point on its connection, keeping the two
// Instagram legs and the inner/outer VPN packets separate. NAT may legitimately
// change a tuple across a router, but cannot assign a new port to each part.
function transfer(s,type,payload) {
  assert(s.start(type,payload));const hops=new Map();
  for(let i=0;s.status==='running'&&i<12000;i++){
    s.advanceFrame();
    for(const e of s.frame)if(e.kind==='hop'&&!e.copy){
      const p=e.packet,logical=s.vpn.logical(p);
      const key=[logical.kind,logical.source,logical.destination,p.kind,e.link,e.from,e.to].join('|');
      const group=hops.get(key)||{kind:logical.kind,ports:new Set(),packets:new Set()};
      group.ports.add(pair(e.header));group.packets.add(p.id);hops.set(key,group);
    }
  }
  assert.equal(s.status,'success',s.current?.description);return hops;
}
function parts(s,hops,kind,min=2) {
  const packets=[...s.packets.values()].filter(p=>p.kind===kind);assert(packets.length>=min,kind);
  assert.equal(new Set(packets.map(p=>pair(p.initialHeader))).size,1,`${kind}: every part starts with the same ports`);
  assert.equal(new Set(packets.map(pair)).size,1,`${kind}: every part arrives with the same ports`);
  const groups=[...hops].filter(([,g])=>g.kind===kind);assert(groups.length,kind);
  for(const [key,g] of groups){
    assert.equal(g.ports.size,1,`${key}: inconsistent ports ${[...g.ports]}`);
    assert.equal(g.packets.size,packets.length,`${key}: every part must be checked`);
  }
  return packets;
}

for(const nat of [false,true])for(const vpn of [false,true]){
  test(`Instagram text, image and video keep one port pair per connection in both directions (NAT ${nat}, VPN ${vpn})`,()=>{
    const s=create(['instagram',...(vpn?['vpn']:[])],nat);
    if(vpn){s.net.setVPN('laptop',true);s.net.setVPN('friend',true);}
    for(const device of ['laptop','friend'])for(const messageType of ['text','image','video']){
      const hops=transfer(s,'message',{device,messageType,text:'Dlouhá textová zpráva 🙂 '.repeat(180)});
      const upload=parts(s,hops,'message'),delivery=parts(s,hops,'ig-delivery');
      assert.equal(upload.length,delivery.length);
      assert.equal(upload[0].initialHeader.sport,device==='friend'?52002:51002);assert.equal(upload[0].initialHeader.dport,443);
      assert.equal(delivery[0].initialHeader.sport,443);
      assert.equal(delivery[0].dport,device==='friend'?51002:52002);
      const check=[...s.packets.values()].find(p=>p.kind==='ig-check');assert(check);
      assert.equal(delivery[0].initialHeader.dport,check.sport,'Every reply part uses the port observed on the recipient check');
      assert.deepEqual(s.net.friend.content.bytes,s.net.sender.content.bytes);
    }
  });
}

test('Mobile, home Wi-Fi and satellite image packets keep their connection ports',()=>{
  for(const nat of [false,true])for(const [device,mode] of [['laptop','wifi'],['phone','cellular'],['cabin','wifi']]){
    const s=create(['instagram','mobile','satellite','wifi'],nat);
    if(s.net.access[device].mode!==mode)assert(s.net.setAccess(device,mode));
    const hops=transfer(s,'message',{device,messageType:'image'});
    parts(s,hops,'message');parts(s,hops,'ig-delivery');
  }
});

test('Segmented mail, chatbot and cloud data keep their source and destination ports, with optional NAT and TLS',()=>{
  for(const nat of [false,true])for(const tls of [false,true]){
    const s=create(['mail','chatbot','cloud',...(tls?['tls']:[])],nat);
    let hops=transfer(s,'mail-send',{device:'laptop',target:'friend',subject:'Porty zprávy',body:'Pozdrav z více paketů. '.repeat(45)});
    parts(s,hops,'smtp-request');
    hops=transfer(s,'mail-check',{device:'friend'});parts(s,hops,'imap-response');
    hops=transfer(s,'chatbot',{device:'laptop',prompt:'Delší dotaz na server. '.repeat(160)});parts(s,hops,'chatbot-request');parts(s,hops,'chatbot-response',1);
    hops=transfer(s,'cloud',{device:'laptop',request:{op:'upload',name:'Soubor k ověření portů.txt',content:'Zkušební obsah '.repeat(40)}});parts(s,hops,'cloud-request');parts(s,hops,'cloud-response');
    hops=transfer(s,'cloud',{device:'laptop',request:{op:'list'}});parts(s,hops,'cloud-request',1);parts(s,hops,'cloud-response');
  }
});
