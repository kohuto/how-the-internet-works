/* A closed teaching scenario. Fixed fictional mail and credentials, no real network I/O.
   Mail/admin use prepared model TLS sessions; web navigation uses the full existing TLS flow. */
(() => {
  'use strict';
  const CLIENTS=['laptop','friend','phone','cabin','cafe'];
  const PHISH_HOST='knihovna-podpora.test';
  const DEMO_LOGIN=Object.freeze({username:'ctenar-demo',password:'UKAZKOVE-HESLO'});
  const emailFor=id=>({laptop:'ty@posta.test',friend:'matej@posta.test',phone:'telefon@posta.test',cabin:'chata@posta.test',cafe:'host@posta.test'})[id];
  function mailTemplate(target,id) {
    return {id,target,to:emailFor(target),fromName:'Podpora knihovny',from:'podpora@knihovna-podpora.test',subject:'Ověření čtenářského účtu',body:'Dobrý den, ověřte prosím svůj čtenářský účet pomocí odkazu níže. Po ověření můžete pokračovat v používání knihovny.',linkLabel:'Ověřit účet knihovny',link:`https://${PHISH_HOST}/overeni?zprava=${id}`};
  }
  class PhishingScenario {
    constructor(sim) {
      this.sim=sim;this.net=sim.net;this.tls=null;
      this.state=this.net.phishing??={serial:0,submissionSerial:0,messages:new Map(),requests:new Map(),mailboxes:Object.fromEntries(CLIENTS.map(id=>[id,null])),clients:Object.fromEntries(CLIENTS.map(id=>[id,{inbox:null,opened:false,reported:[],state:'idle',error:'',lastVisit:null}])),hacker:{state:'idle',notice:'Připrav e-mail pro některé zařízení v mapě.',lastTarget:'laptop',results:[],fetched:false,total:0},captures:new Map(),lastWeb:null,certificate:{name:PHISH_HOST,issuer:'Výuková certifikační autorita',valid:true,trusted:true}};
    }
    accepts(type){return ['phish-send','mail-check','phish-results'].includes(type);}
    validate(type,payload) {
      if(type==='phish-send')return payload.device==='hacker'&&CLIENTS.includes(payload.target);
      if(type==='phish-results')return payload.device==='hacker';
      return type==='mail-check'&&CLIENTS.includes(payload.device);
    }
    start(type) {
      const s=this.sim,a=s.action,c=this.state.clients[s.clientId()],h=this.state.hacker;
      this.tls=new globalThis.InternetLab.ModelTLS(s.run,s.clientId());this.tls.ready=true;
      if(type==='phish-send') {
        a.payload.messageId??=++this.state.serial;s.lastAction.payload.messageId=a.payload.messageId;
        Object.assign(h,{state:'sending',lastTarget:a.payload.target,notice:'E-mail čeká na přenos na poštovní server.'});
      }else if(type==='mail-check'){c.state='loading';c.error='';}
      else {h.state='loading';h.notice='Připravuje se dotaz na záznamy podvodného serveru.';}
      s.next([{kind:'phishing-prepare',node:s.clientId(),title:type==='phish-send'?'Útočník připravuje podvodný e-mail':type==='mail-check'?'Pošta kontroluje schránku na serveru':'Útočník načítá záznamy podvodného webu',description:'Přenos spusť krokováním nebo přehráním.'}]);
    }
    prepare(e) {
      const s=this.sim,id=s.clientId(),a=s.action;
      if(!this.net.nodes[id].on||!this.net.accessReady(id))return s.failure(`${this.net.nodes[id].name} nemá dostupné připojení.`,null,id);
      const op=a.type==='phish-send'?'send':a.type==='mail-check'?'fetch':'results',server=op==='results'?'phish-web':'mail';
      const value=op==='send'?{op,message:mailTemplate(a.payload.target,a.payload.messageId)}:{op};
      const body={method:'POST',path:op==='results'?'/sprava/zaznamy':'/posta/'+op,host:op==='results'?PHISH_HOST:'posta.test',message:JSON.stringify(value)};
      const p=s.createPacket('phish-request',id,server,{record:this.tls.seal('request',body,server)},{sport:51005,dport:443,connection:'phishing-api',label:op==='send'?'Pošta · odeslání':op==='fetch'?'Pošta · kontrola schránky':'Útočník · dotaz na záznamy'});
      s.next([s.originate(p)]);e.description='Poštovní účet nebo správcovské přihlášení je připravené. Model TLS chrání obsah; tento pokus nerozepisuje jeho handshake.';
    }
    receive(p,e) {
      const s=this.sim,id=s.clientId();
      try {
        if(p.kind==='phish-request') {
          const body=this.tls.open(p.payload.record,p.destination,'request'),value=JSON.parse(body.message);let result;
          if(value.op==='send'&&id==='hacker'&&p.destination==='mail') {
            const m=value.message;
            if(!CLIENTS.includes(m.target)||m.id!==s.action.payload.messageId)throw new Error('Poštovní server odmítl neplatný modelový e-mail.');
            if(!this.state.requests.has(m.id)) {
              const mail=mailTemplate(m.target,m.id);this.state.messages.set(mail.id,mail);this.state.mailboxes[mail.target]=mail.id;this.state.requests.set(mail.id,true);
            }
            result={status:202,id:m.id,target:m.target};e.title='Poštovní server uložil e-mail do schránky';e.description='Zpráva zůstane na serveru i při vypnutém zařízení příjemce. Teď se vrací potvrzení útočníkovi.';
          }else if(value.op==='fetch'&&CLIENTS.includes(id)&&p.destination==='mail') {
            const message=this.state.messages.get(this.state.mailboxes[id]);result={status:200,message:message?structuredClone(message):null};
            e.title='Poštovní server připravil obsah schránky';e.description='E-mail se v zařízení zobrazí až po doručení této odpovědi.';
          }else if(value.op==='results'&&id==='hacker'&&p.destination==='phish-web') {
            result={status:200,items:[...this.state.captures.values()].slice(-4).map(x=>({...x})),total:this.state.captures.size};
            e.title='Podvodný server připravil záznamy pro útočníka';e.description='Záznamy ještě nejsou na jeho počítači. Musí se přenést zpět.';
          }else throw new Error('Server odmítl požadavek: neodpovídá připravenému přihlášení tohoto scénáře.');
          const reply={status:200,title:JSON.stringify(result),revision:1};
          const q=s.replyPacket('phish-response',p,{record:this.tls.seal('response',reply,id)});q.connection='phishing-api';q.label='Pošta / správa · odpověď';
          s.next([s.originate(q)]);
        }else {
          const result=JSON.parse(this.tls.open(p.payload.record,id,'response').title),h=this.state.hacker;
          if(s.action.type==='phish-send')Object.assign(h,{state:'ready',notice:`E-mail ${result.id} je uložený na poštovním serveru. Příjemce si ho může načíst v aplikaci Pošta.`});
          else if(s.action.type==='mail-check') {
            const c=this.state.clients[id],old=c.inbox?.id;c.inbox=result.message;c.opened=result.message?.id===old&&c.opened;c.state='ready';c.error='';
          }else Object.assign(h,{state:'ready',results:result.items,total:result.total,fetched:true,notice:result.total?'Záznamy dorazily z podvodného serveru.':'Server zatím nepřijal žádné ukázkové přihlášení.'});
          s.finish(s.action.type==='phish-send'?'Podvodný e-mail je uložený na serveru':s.action.type==='mail-check'?'Obsah schránky dorazil do zařízení':'Záznamy dorazily do počítače útočníka','Přijímající zařízení ověřilo a otevřelo modelově chráněnou odpověď.',id);
        }
      }catch(error){s.failure(error.message,p,e.node);}
    }
    failure(reason) {
      if(this.sim.action?.type==='mail-check')Object.assign(this.state.clients[this.sim.clientId()],{state:'error',error:reason});
      else Object.assign(this.state.hacker,{state:'error',notice:reason+' Pokud už server požadavek převzal, jeho záznam zůstává uložený.'});
    }
    report(device) {
      const c=this.state.clients[device],mail=c?.inbox;if(!mail||c.reported.includes(mail.id))return false;
      c.reported.push(mail.id);return true;
    }
    blocked(device,messageId) {return !!this.state.clients[device]?.reported.includes(messageId);}
    prepareLogin(address) {
      const s=this.sim;
      if(this.blocked(s.clientId(),address.messageId))return null;
      s.action.payload.submissionId??=++this.state.submissionSerial;s.lastAction.payload.submissionId=s.action.payload.submissionId;
      return JSON.stringify({...DEMO_LOGIN,messageId:address.messageId,submissionId:s.action.payload.submissionId});
    }
    respondWeb(request,secure,p) {
      const address=globalThis.InternetLab.webAddress(this.net.browserFor(this.sim.clientId()).address),post=request.method==='POST';
      const result={status:200,title:'Ověření čtenářského účtu',revision:1,pageType:'phishing',messageId:address.messageId,submitted:false,receipt:''};
      if(post) {
        const value=JSON.parse(request.message);
        if(value.username!==DEMO_LOGIN.username||value.password!==DEMO_LOGIN.password||value.submissionId!==this.sim.action.payload.submissionId)throw new Error('Formulář tohoto pokusu používá pouze pevné ukázkové údaje.');
        if(!this.state.captures.has(value.submissionId))this.state.captures.set(value.submissionId,{id:value.submissionId,messageId:value.messageId,username:value.username,password:value.password,sourceIp:p.src,secure});
        result.submitted=true;result.receipt='Ověření bylo přijato.';
      }
      this.state.lastWeb={method:request.method,host:request.host,sourceIp:p.src,secure,messageId:address.messageId,cookie:request.cookie||'',submitted:post};
      return result;
    }
  }
  Object.assign(globalThis.InternetLab,{PhishingScenario,PHISH_CLIENTS:CLIENTS,PHISH_HOST,DEMO_LOGIN,mailTemplate,emailFor});
})();
