/* Closed evil-twin experiment. This observes model packets on a real model path.
   It never opens TLS/VPN application records and never touches a real network. */
(() => {
  'use strict';
  const {requestText,responseText,responseBody,ModelTLS}=globalThis.InternetLab;
  const MITM_TITLE='Tento obsah změnil útočník v kavárně.';
  const MITM_MODES={observe:'Pouze sledovat',http:'Změnit HTTP stránku',certificate:'Podstrčit certifikát',tls:'Poškodit HTTPS data'};
  class MITMScenario {
    #seen=new Set();
    #forged=new Map();
    constructor(sim){this.sim=sim;this.net=sim.net;}
    reset(){this.#seen.clear();this.#forged.clear();}
    configure(active,mode=this.net.mitm.mode){
      if(!Object.hasOwn(MITM_MODES,mode))return false;
      const changed=this.net.mitm.active!==active||this.net.mitm.mode!==mode;
      Object.assign(this.net.mitm,{active,mode});if(changed)this.net.changed();return changed;
    }
    certificateFor(p){const session=this.#forged.get(p.id);return session?session.open(p.payload.record,'cafe','handshake'):null;}
    inspect(e){
      const s=this.sim,n=this.net,p=e.packet;
      if(!n.nodes[e.node].on||!n.mitm.active)return s.failure('Útočníkův hotspot už není dostupný. Zvol jinou Wi-Fi a spusť přenos znovu.',p,e.node);
      p.visual={kind:'mitm',node:e.node};
      if(!this.#seen.has(p.id)){
        this.#seen.add(p.id);
        const outer=p.kind.startsWith('vpn-'),protectedData=outer||!!p.payload.record;
        const before=p.kind==='http-request'?requestText(p.payload):p.kind==='http-response'?responseText(p.payload):p.kind.startsWith('dns-')?`DNS · ${p.payload.name}${p.payload.answer?' → '+p.payload.answer:''}`:p.payload.publicText||'';
        const row={id:++n.mitm.serial,run:s.run,packetId:p.id,kind:p.kind,label:p.label,header:{...n.packetHeader(p)},direction:e.inLink==='cafe-twin'?'out':'in',protected:protectedData,protection:outer?'VPN':p.payload.record?'TLS':'',before,after:before,changed:false,result:''};
        if(n.mitm.mode==='http'&&p.kind==='http-response'){
          p.payload.title=MITM_TITLE;p.payload.bodyBytes=new TextEncoder().encode(responseBody(p.payload)).length;
          row.changed=true;row.after=responseText(p.payload);row.result='HTTP odpověď byla změněna po cestě. Obsah na původním serveru zůstal stejný.';
        }else if(n.mitm.mode==='certificate'&&p.kind==='tls-server-response'){
          // Prepared fraudulent peer: only its handshake/certificate is modelled.
          // It cannot present a trusted certificate for the real library.
          const forged=new ModelTLS(s.run,'cafe');forged.id=`mitm-${s.run}`;
          p.payload.record=forged.seal('handshake',{name:s.webHost(),issuer:'Neznámý vydavatel útočníka',trusted:false,valid:true},'cafe');
          this.#forged.set(p.id,forged);row.changed=true;row.result='Útočník předložil vlastní nedůvěryhodný certifikát. Prohlížeč jej musí odmítnout před odesláním HTTP obsahu.';
        }else if(n.mitm.mode==='tls'&&p.kind==='https-request'){
          p.payload.record.data[0]^=1;row.changed=true;row.result='Změněn bajt chráněného záznamu. Příjemce změnu odhalí kontrolou integrity; nevznikne platný upravený požadavek.';
        }else if(outer)row.result='Viditelné jsou vnější IP a UDP porty tunelu. Původní IP, DNS i webový obsah jsou uvnitř VPN skryté.';
        else if(protectedData)row.result='HTTP obsah nelze na tomto místě přečíst ani platně přepsat. TLS končí až v prohlížeči a na webovém serveru.';
        else row.result='Nešifrovaný obsah je na útočníkově přenosové cestě čitelný.';
        n.mitm.logs.push(row);if(n.mitm.logs.length>20)n.mitm.logs.shift();
        p.mitmHistory??=[];p.mitmHistory.push({node:e.node,logId:row.id,changed:row.changed,protection:row.protection,result:row.result});
        e.title=row.changed?'MITM · útočník zasahuje do přenosu':protectedData?'MITM · útočník vidí chráněný přenos':'MITM · útočník čte přenos';
        e.description=row.result;
      }
      s.next([{kind:'switch',node:e.node,inLink:e.inLink,frame:e.frame,packet:p}]);
    }
  }
  Object.assign(globalThis.InternetLab,{MITMScenario,MITM_TITLE,MITM_MODES});
})();
