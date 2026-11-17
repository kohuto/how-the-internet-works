/* Closed GDPR teaching model; account access is checked by AuthService. */
(() => {
  'use strict';
  const owners={laptop:'ctenar-1',phone:'ctenar-1',cabin:'ctenar-1',friend:'ctenar-2',cafe:'ctenar-3'};
  class PrivacyService {
    constructor(net){
      this.net=net;
      this.state=net.server.privacy??={serial:0,revision:0,requests:new Map(),clients:Object.fromEntries(Object.keys(owners).map(id=>[id,{snapshot:null,receipt:null,state:'idle',error:'',notice:'Údaje ze serveru zatím nebyly vyžádány.'}])),accounts:new Map([
        ['ctenar-1',{profile:{name:'Alex Lipovský',email:'alex@posta.test',genres:'Dobrodružné příběhy, příroda'},hold:true}],
        ['ctenar-2',{profile:{name:'Matěj Dopis',email:'matej@dopis.test',genres:'Komiksy, technika'},hold:false}],
        ['ctenar-3',{profile:{name:'Host Kavárenský',email:'host@posta.test',genres:'Cestování, historie'},hold:false}]
      ].map(([id,a])=>[id,{...a,id,visits:[],visitorIds:new Set(),collecting:true,erased:false,revision:0,document:{holder:a.profile.name,label:'Ukázkový účetní doklad o čtenářském poplatku',reason:'Modelová zákonná povinnost uchovat účetní doklad po stanovenou dobu.'}}]))};
    }
    owner(device){return owners[device];}
    validate(p){if(!this.net.featureEnabled('cookies')||!this.net.featureEnabled('tls'))return false;return !!owners[p.device||'laptop']&&['read','erase'].includes(p.privacyOp)&&globalThis.InternetLab.webAddress(p.address)?.secure&&globalThis.InternetLab.webAddress(p.address)?.server==='web';}
    begin(p){
      const c=this.state.clients[p.device||'laptop'];
      if(p.privacyOp==='erase')p.privacyRequestId??=`vymaz-${++this.state.serial}`;
      Object.assign(c,{state:'loading',error:'',notice:p.privacyOp==='read'?'HTTPS přenáší žádost o přehled údajů.':'Žádost o výmaz čeká na doručení serveru.'});
    }
    account(request){return this.state.accounts.get(this.auth?.account(request)?.id);}
    shouldRecord(request){return this.account(request)?.collecting!==false;}
    observe(request,response,meta){
      const a=this.account(request);if(!a?.collecting||!response.visitor)return;
      // A cookie identifies this browser. Only the separate session cookie binds
      // its visitor record to a reader account.
      for(const other of this.state.accounts.values())other.visitorIds.delete(response.visitor.id);
      a.visitorIds.add(response.visitor.id);
      if(request.method==='GET'){
        a.visits.push({at:this.net.cookieTime,path:request.path,ip:meta.sourceIp,protocol:meta.secure?'HTTPS':'HTTP'});
        a.visits=a.visits.slice(-3);a.revision=++this.state.revision;
      }
    }
    snapshot(a){return {account:a.id,revision:a.revision,profile:structuredClone(a.profile),visits:structuredClone(a.visits),browserRecords:a.visitorIds.size,collecting:a.collecting,erased:a.erased,retained:a.document?{...a.document,required:a.hold,reason:a.hold?a.document.reason:'V tomto scénáři není povinnost dalšího uchování. Při výmazu se odstraní také tento doklad.'}:null};}
    bindVisitor(a,request){
      const visitor=/\bnavstevnik=(v[1-9][0-9]*)\b/.exec(request.cookie||'')?.[1];
      if(a.collecting&&this.net.server.cookies.visitors.has(visitor)&&![...this.state.accounts.values()].some(other=>other!==a&&other.visitorIds.has(visitor)))a.visitorIds.add(visitor);
    }
    handle(request,secure){
      const fail=(status,title)=>({status,title,revision:0,privacy:{ok:false,message:title}});
      if(!secure)return fail(403,'Tato modelová žádost vyžaduje HTTPS.');
      const a=this.account(request);if(!a)return fail(401,'Chybí platné přihlášení k účtu. Přihlas se přes HTTPS.');
      if(request.path==='/soukromi/udaje'&&request.method==='GET'){this.bindVisitor(a,request);return {status:200,title:'Moje údaje',revision:a.revision,privacy:{ok:true,op:'read',snapshot:this.snapshot(a)}};}
      if(request.path!=='/soukromi/vymaz'||request.method!=='POST')return fail(400,'Neznámá žádost o soukromí.');
      let body;try{body=JSON.parse(request.message);}catch{return fail(400,'Žádost o výmaz není platná.');}
      if(!/^vymaz-[1-9][0-9]*$/.test(body.requestId||''))return fail(400,'Chybí identifikátor žádosti.');
      const key=a.id+':'+body.requestId,previous=this.state.requests.get(key);if(previous)return structuredClone(previous);
      this.bindVisitor(a,request);
      const removed={profile:!!a.profile,visits:a.visits.length,browserRecords:a.visitorIds.size};
      for(const id of a.visitorIds)this.net.server.cookies.visitors.delete(id);
      if(a.visitorIds.has(this.net.server.cookies.last?.id))this.net.server.cookies.last=null;
      if(this.account(this.net.server.lastRequest||{})?.id===a.id)this.net.server.lastRequest=null;
      const credentials=[...this.auth.state.accounts.values()].find(row=>row.id===a.id);if(credentials)credentials.email=null;
      a.profile=null;a.visits=[];a.visitorIds.clear();a.collecting=false;a.erased=true;if(!a.hold)a.document=null;a.revision=++this.state.revision;
      const response={status:200,title:'Žádost o výmaz vyřízena',revision:a.revision,privacy:{ok:true,op:'erase',requestId:body.requestId,removed,retained:a.document?structuredClone(a.document):null}};
      this.state.requests.set(key,structuredClone(response));return response;
    }
    receive(device,response){
      const c=this.state.clients[device],p=response.privacy;
      if(!p.ok){Object.assign(c,{state:'error',error:p.message,notice:'Server žádost odmítl.'});return;}
      if(p.op==='read')Object.assign(c,{snapshot:structuredClone(p.snapshot),state:'ready',error:'',notice:'Přehled dorazil ze serveru. Jde o kopii platnou při vyřízení požadavku.'});
      else Object.assign(c,{snapshot:null,receipt:structuredClone(p),state:'ready',error:'',notice:'Potvrzení výmazu dorazilo. Novým načtením můžeš ověřit zbývající údaje.'});
    }
    failure(device){const c=this.state.clients[device];Object.assign(c,{state:'error',error:'Odpověď nedorazila. Dřívější přehled není aktuální potvrzení. Pokud server už žádost zpracoval, změna u něj zůstala.',notice:'Stav ověř novým načtením údajů.'});}
    setHold(id,value){const a=this.state.accounts.get(id);if(!a||a.erased)return false;a.hold=!!value;return true;}
  }
  Object.assign(globalThis.InternetLab,{PrivacyService,PRIVACY_OWNERS:owners});
})();
