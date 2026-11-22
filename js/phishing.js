/* A closed teaching scenario. Fixed fictional mail and credentials, no real network I/O.
   Admin access follows the optional TLS setting; web navigation uses the full existing TLS flow. */
(() => {
  'use strict';
  const CLIENTS=['laptop','friend','phone','cabin','cafe'];
  const MAIL_CLIENTS=[...CLIENTS,'hacker'];
  const PHISH_HOST='knihovna-podpora.test';
  const DEMO_LOGIN=Object.freeze({username:'ctenar-demo',password:'UKAZKOVE-HESLO'});
  const emailFor=id=>({laptop:'ty@gmail.com',friend:'matej@gmail.com',phone:'telefon@gmail.com',cabin:'chata@gmail.com',cafe:'host@gmail.com',hacker:'podpora@knihovna-podpora.test'})[id];
  function mailTemplate(target,id) {
    return {id,target,to:emailFor(target),fromName:'Podpora knihovny',from:'podpora@knihovna-podpora.test',subject:'Ověření čtenářského účtu',body:'Dobrý den, ověřte prosím svůj čtenářský účet pomocí odkazu níže. Po ověření můžete pokračovat v používání knihovny.',linkLabel:'Ověřit účet knihovny',link:`https://${PHISH_HOST}/overeni?zprava=${id}`};
  }
  class PhishingScenario {
    constructor(sim) {
      this.sim=sim;this.net=sim.net;this.tls=null;
      this.state=this.net.phishing??={serial:0,submissionSerial:0,messages:new Map(),requests:new Map(),mailboxes:Object.fromEntries(CLIENTS.map(id=>[id,null])),clients:Object.fromEntries(MAIL_CLIENTS.map(id=>[id,{inbox:null,opened:false,reported:[],state:'idle',error:'',lastVisit:null}])),hacker:{state:'idle',notice:'Záznamy se zobrazí až po načtení ze serveru.',results:[],fetched:false,total:0},captures:new Map(),lastWeb:null,certificate:{name:PHISH_HOST,issuer:'Výuková certifikační autorita',valid:true,trusted:true}};
    }
    accepts(type){return type==='phish-results';}
    validate(type,payload){return type==='phish-results'&&payload.device==='hacker';}
    start(){
      const s=this.sim;this.tls=this.net.featureEnabled('tls')?new globalThis.InternetLab.ModelTLS(s.run,s.clientId()):null;if(this.tls)this.tls.ready=true;
      Object.assign(this.state.hacker,{state:'loading',notice:'Připravuje se dotaz na záznamy podvodného serveru.'});
      s.next([{kind:'phishing-prepare',node:s.clientId(),title:'Útočník načítá záznamy podvodného webu',description:'Přenos spusť krokováním nebo přehráním.'}]);
    }
    prepare(e){
      const s=this.sim,id=s.clientId();
      if(!this.net.nodes[id].on||!this.net.accessReady(id))return s.failure(`${this.net.nodes[id].name} nemá dostupné připojení.`,null,id);
      const body={method:'POST',path:'/sprava/zaznamy',host:PHISH_HOST,message:JSON.stringify({op:'results'})};
      const p=s.createPacket('phish-request',id,'phish-web',this.tls?{record:this.tls.seal('request',body,'phish-web')}:body,{sport:51005,dport:this.tls?443:80,connection:'phishing-api',label:'Útočník · dotaz na záznamy'});
      s.next([s.originate(p)]);e.description=this.tls?'Správcovské přihlášení a model TLS jsou připravené.':'Správcovské přihlášení je připravené. Požadavek se odešle přes HTTP.';
    }
    receive(p,e){
      const s=this.sim,id=s.clientId();
      try{
        if(p.kind==='phish-request'){
          const value=JSON.parse((this.tls?this.tls.open(p.payload.record,p.destination,'request'):p.payload).message);
          if(value.op!=='results'||id!=='hacker'||p.destination!=='phish-web')throw new Error('Server odmítl požadavek.');
          const result={status:200,items:[...this.state.captures.values()].slice(-4).map(x=>({...x})),total:this.state.captures.size};
          e.title='Podvodný server připravil záznamy pro útočníka';e.description='Ještě se musí přenést zpět do počítače.';
          const body={status:200,title:JSON.stringify(result),revision:1};
          const q=s.replyPacket('phish-response',p,this.tls?{record:this.tls.seal('response',body,id)}:body);q.connection='phishing-api';q.label='Správa · odpověď';s.next([s.originate(q)]);
        }else{
          const result=JSON.parse((this.tls?this.tls.open(p.payload.record,id,'response'):p.payload).title);
          Object.assign(this.state.hacker,{state:'ready',results:result.items,total:result.total,fetched:true,notice:result.total?'Záznamy dorazily z podvodného serveru.':'Server zatím nepřijal žádné ukázkové přihlášení.'});
          s.finish('Záznamy dorazily do počítače útočníka',this.tls?'Zařízení ověřilo a otevřelo modelově chráněnou odpověď.':'Zařízení přijalo čitelnou HTTP odpověď.',id);
        }
      }catch(error){s.failure(error.message,p,e.node);}
    }
    failure(reason){Object.assign(this.state.hacker,{state:'error',notice:reason});}
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
  Object.assign(globalThis.InternetLab,{PhishingScenario,PHISH_CLIENTS:CLIENTS,MAIL_CLIENTS,PHISH_HOST,DEMO_LOGIN,mailTemplate,emailFor});
})();
