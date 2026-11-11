/* Local teaching model: opaque VPN envelopes, endpoint-only inner packets,
   real model routes and separate exit NAT. No actual VPN or cryptography. */
(() => {
  'use strict';
  const encoder=new TextEncoder();
  const fields=['kind','src','dst','source','destination','protocol','sport','dport','seq','label','payload','direction','connection','ttl','initialHeader','natHistory'];
  class VPNTransport {
    #records=new Map();
    constructor(sim){this.sim=sim;this.net=sim.net;}
    reset(){this.#records.clear();}
    logical(p){return this.#records.get(p.id)?.inner||p;}
    needsWrap(p){return !p.kind.startsWith('vpn-')&&this.net.vpn.clients[p.source]?.enabled&&!['home','friend','cabin','hacker','cafe'].includes(this.net.nodes[p.destination].region);}
    prepare(p){if(this.needsWrap(p))p.src=this.net.vpn.clients[p.source].ip;}
    event(p,node=p.source,direction='out') {
      return {kind:'vpn-wrap',node,packet:p,client:direction==='out'?p.source:p.destination,direction,title:direction==='out'?'Zařízení šifruje a balí původní paket do VPN':'VPN server balí odpověď do šifrovaného tunelu',description:'Původní IP paket se ukryje uvnitř nového IPv4/UDP paketu.'};
    }
    size(p){
      const pl=p.payload,count=pl.packetCount||1;
      if(pl.bytes)return pl.bytes.length+40*count;
      if(pl.record)return pl.record.data.length+encoder.encode(pl.publicText||'').length+40;
      const text=p.kind==='http-request'?globalThis.InternetLab.requestText(pl):p.kind==='http-response'?globalThis.InternetLab.responseText(pl):JSON.stringify(pl);
      return encoder.encode(text).length+(p.protocol==='UDP'?28:40);
    }
    wrap(p,client,direction) {
      const n=this.net,c=n.vpn.clients[client];
      if(!c?.enabled||!n.nodes[client].on||!n.accessReady(client))throw new Error('VPN klient je vypnutý nebo nemá připojení. Přenos se neodešle nechráněnou cestou.');
      if(direction==='in'&&!n.vpnPeerValid(client))throw new Error('VPN nemá platný návratový tunel k zařízení. Obnov připojení a opakuj akci.');
      const inner=Object.fromEntries(fields.map(k=>[k,p[k]])),count=p.payload.packetCount||1,size=this.size(p),cipher=new Uint8Array(Math.min(size+16,96));
      let seed=(this.sim.run*97+this.sim.serial*173+c.epoch*31+size)>>>0;
      for(let i=0;i<cipher.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;cipher[i]=seed>>>24;}
      this.#records.set(p.id,{inner,client,direction,epoch:c.epoch,cipher:cipher.slice(),outerInitial:null});
      const out=direction==='out';
      Object.assign(p,{kind:out?'vpn-outbound':'vpn-inbound',source:out?client:'vpn',destination:out?'vpn':client,src:out?n.nodes[client].ip:n.nodes.vpn.ip,dst:out?n.nodes.vpn.ip:c.peer.ip,sport:out?c.port:51820,dport:out?51820:c.peer.port,protocol:'UDP',seq:null,ttl:64,connection:'vpn',direction:out?'request':'response',label:out?'VPN · chráněný paket k serveru':'VPN · chráněný paket do zařízení',payload:{cipher,protectedBytes:size,packetCount:count},natHistory:[],state:'waiting',location:out?client:'vpn',vpn:{stage:'tunnel',client,direction}});
      p.initialHeader=n.packetHeader(p);this.#records.get(p.id).outerInitial={...p.initialHeader};
    }
    restore(p,node) {
      const r=this.#records.get(p.id),c=this.net.vpn.clients[r?.client];
      if(!r||!c.enabled||r.epoch!==c.epoch||p.payload.cipher.length!==r.cipher.length||!p.payload.cipher.every((b,i)=>b===r.cipher[i]))throw new Error('VPN obal neprošel ověřením integrity nebo byl tunel ukončen.');
      if(node!==(r.direction==='out'?'vpn':r.client))throw new Error('Tento uzel není koncem VPN tunelu.');
      const trace={client:r.client,direction:r.direction,before:r.outerInitial,received:this.net.packetHeader(p),natHistory:p.natHistory.map(t=>structuredClone(t))};
      if(r.direction==='out')c.peer={ip:p.src,port:p.sport,physicalIp:this.net.nodes[r.client].ip,epoch:c.epoch};
      Object.assign(p,r.inner);p.location=node;p.state='transit';p.vpn={stage:r.direction==='out'?'exit':'delivered',client:r.client,direction:r.direction};
      p.vpnHistory??=[];p.vpnHistory.push(trace);p.visual={kind:'vpn-unpack',node};
      this.#records.delete(p.id);return r;
    }
    exit(p,client) {
      const n=this.net,c=n.vpn.clients[client];
      if(p.ttl<=1)throw new Error('Vnitřní paket vyčerpal TTL na VPN serveru.');p.ttl--;
      let row=n.vpn.rows.find(r=>r.client===client&&r.epoch===c.epoch&&r.protocol===p.protocol&&r.insideIp===p.src&&r.insidePort===p.sport&&r.remoteIp===p.dst&&r.remotePort===p.dport);
      if(!row){
        const port=n.vpn.nextPort++;if(n.vpn.nextPort>65535)n.vpn.nextPort=55000;
        row={client,epoch:c.epoch,protocol:p.protocol,insideIp:p.src,insidePort:p.sport,outsideIp:n.nodes.vpn.ip,outsidePort:port,remoteIp:p.dst,remotePort:p.dport,outbound:0,inbound:0};n.vpn.rows.push(row);
      }
      const before=n.packetHeader(p);p.src=row.outsideIp;p.sport=row.outsidePort;row.outbound+=p.payload.packetCount||1;
      n.recordNat('vpn',p,row,'out',before);this.remember(p,client,'out');
    }
    remember(p,client,direction) {
      const n=this.net,count=p.payload.packetCount||1,c=n.vpn.clients[client];
      if(direction==='out'){n.vpn.sent+=count;c.sent+=count;}else{n.vpn.received+=count;c.received+=count;}
      const preview=p.kind==='http-request'?globalThis.InternetLab.requestText(p.payload):p.kind==='http-response'?globalThis.InternetLab.responseText(p.payload):p.payload.record?'Obsah uvnitř dál chrání HTTPS/TLS. VPN server jej nedešifruje.':p.kind.startsWith('dns')?`DNS ${p.payload.name}${p.payload.answer?' → '+p.payload.answer:''}`:'Aplikační data modelu. Prohlédni si předávaný paket.';
      n.vpn.last={client,direction,packetId:p.id,header:n.packetHeader(p),https:!!p.payload.record,preview};
    }
    receive(p,e) {
      if(p.kind.startsWith('vpn-')){
        p.state='transit';this.sim.next([{kind:'vpn-unpack',node:e.node,packet:p,title:e.node==='vpn'?'VPN server ověřuje a rozbaluje VPN obal':'Zařízení rozbaluje odpověď z VPN tunelu',description:'Z vnějšího paketu získá původní vnitřní paket.'}]);
        e.description='Dorazil chráněný VPN obal. Jeho vnitřní IP a obsah nejsou na síti čitelné.';return;
      }
      const n=this.net,row=n.vpn.rows.find(r=>r.protocol===p.protocol&&r.outsidePort===p.dport&&r.remoteIp===p.src&&r.remotePort===p.sport);
      if(!row||!n.vpnPeerValid(row.client))return this.sim.failure('VPN server nemá platný záznam pro návrat tohoto paketu. Nechráněné doručení se nepoužije.',p,'vpn');
      const before=n.packetHeader(p);p.dst=row.insideIp;p.dport=row.insidePort;p.ttl--;row.inbound+=p.payload.packetCount||1;
      n.recordNat('vpn',p,row,'in',before);this.remember(p,row.client,'in');
      p.state='transit';this.sim.next([this.event(p,'vpn','in')]);e.title='VPN server přijal odpověď z internetu';e.description='Podle svého záznamu obnovil vnitřní adresu zařízení. Nyní odpověď zabalí do VPN.';
    }
    handle(e) {
      const s=this.sim,p=e.packet;
      try {
        if(!this.net.nodes[e.node].on)throw new Error(`${this.net.nodes[e.node].name} je vypnutý.`);
        if(e.kind==='vpn-wrap'){
          this.wrap(p,e.client,e.direction);p.state='transit';p.visual={kind:'vpn-wrap',node:e.node};
          s.next([s.originate(p,e.node)]);
        }else{
          const r=this.restore(p,e.node);
          if(r.direction==='out'){
            this.exit(p,r.client);e.title='VPN server sejmul vnější obal a předává původní paket';
            e.description=p.payload.record?'HTTPS uvnitř zůstává šifrované. Web uvidí veřejnou IP VPN serveru.':p.connection==='http'?'VPN ochrana zde končí. HTTP obsah je na cestě k webu čitelný; web uvidí IP VPN serveru.':'Původní paket pokračuje do internetu z IP VPN serveru. VPN obal byl odstraněn.';
            s.next([s.originate(p,'vpn')]);
          }else s.next([{kind:'deliver',node:r.client,packet:p,title:'Zařízení předává rozbalený paket své aplikaci',description:'Případné HTTPS ještě musí dešifrovat prohlížeč.'}]);
        }
      }catch(error){return s.failure(error.message,p,e.node);}
      return s.current;
    }
    observeHop(p,link) {
      if(!p.kind.startsWith('vpn-'))return;
      const c=this.net.vpn.clients[p.vpn.client];if(!c.path.includes(link))c.path.push(link);
    }
  }
  Object.assign(globalThis.InternetLab,{VPNTransport});
})();
