/* Closed advertising lesson. Only fictional sites, model cookies and network packets. */
(() => {
  'use strict';
  const {webAddress,ModelTLS,responseBody}=globalThis.InternetLab,encoder=new TextEncoder();
  const TOPICS={cyklistika:{label:'Cyklistika',title:'Kolo pro tvoje další dobrodružství',text:'Ukázková nabídka jízdních kol a příslušenství.',symbol:'◎'},hudba:{label:'Hudba',title:'Hudba, kterou si vezmeš s sebou',text:'Ukázková nabídka sluchátek a hudebních nástrojů.',symbol:'♫'},cestovani:{label:'Cestování',title:'Připrav se na další výlet',text:'Ukázková nabídka batohů a vybavení na cesty.',symbol:'↗'},obecna:{label:'Obecná reklama',title:'Objev něco nového',text:'Obecná ukázková nabídka bez historie návštěv.',symbol:'✦'}};
  const HOSTS={shop:'obchod.test',news:'zpravy.test',ads:'reklamy.test'};
  class AdsScenario {
    constructor(sim){
      this.sim=sim;this.net=sim.net;this.context=null;this.pending=null;
      this.state=this.net.ads={serial:0,requests:0,profiles:new Map(),last:null,clients:Object.fromEntries(['laptop','friend','phone','cabin','cafe'].map(id=>[id,{allowed:true,cookie:null,lastSent:'',lastReceived:'',notice:'Výukový režim: propojení návštěv je povolené.'}])),certificates:Object.fromEntries(Object.entries(HOSTS).map(([id,name])=>[id,{name,issuer:'Výuková certifikační autorita',trusted:true,valid:true}]))};
    }
    reset(){this.context=null;this.pending=null;}
    get embedded(){return this.context?.phase==='partner';}
    address(){const secure=this.net.featureEnabled('tls');return this.embedded?{host:HOSTS.ads,server:'ads',secure,path:'/vyber',url:`${secure?'https':'http'}://reklamy.test/vyber`}:webAddress(this.sim.browser().address);}
    certificate(target){return this.state.certificates[target];}
    page(request,packet){
      const kind=packet.destination,topic=kind==='shop'?(/(?:\?|&)tema=(cyklistika|hudba|cestovani)(?:&|$)/.exec(request.path)?.[1]||'cyklistika'):'obecna';
      return {status:200,title:kind==='shop'?'Obchod na rohu':'Lipovské zprávy',revision:1,pageType:kind,partnerPage:{kind,topic,partner:HOSTS.ads},bodyBytes:250};
    }
    receivePage(response,secure){
      const sim=this.sim,b=sim.browser(),a=webAddress(b.address);
      Object.assign(b,{content:response.title,revision:1,pageType:response.pageType,loadedHost:a.host,loadedSecure:secure,state:'ready',tlsPhase:'done',visitor:null,receipt:'',adPage:{...response.partnerPage,run:sim.run,ad:null,state:'waiting',notice:'Stránka dorazila. Její vložený reklamní kód nyní kontaktuje jiný server.'}});
      if(!this.net.featureEnabled('ads')){b.adPage.state='disabled';sim.finish('Webová stránka dorazila do prohlížeče','Obsah byl přijat ze serveru.',sim.clientId());return;}
      this.context={phase:'page',site:a.host,kind:response.pageType,topic:response.partnerPage.topic,topSecure:secure};
      sim.next([{kind:'ads-prepare',node:sim.clientId(),title:'Stránka obsahuje kód reklamního partnera',description:`Prohlížeč načetl ${a.host}. Nyní samostatně požádá reklamy.test o výběr reklamy.`}]);
    }
    prepare(){
      const sim=this.sim,c=this.context;if(!c)return;
      c.phase='partner';sim.tls=null;sim.webSeq={request:1001,response:8001};
      const client=this.state.clients[sim.clientId()];
      const data={site:c.site,context:c.topic,...(client.allowed?{event:c.kind==='shop'?'prohlizeni':'zobrazeni',...(c.kind==='shop'?{topic:c.topic}:{})}:{event:'kontextova-reklama'})};
      sim.webRequest={method:'POST',host:HOSTS.ads,path:'/vyber',contentType:'application/json',message:JSON.stringify(data)};
      Object.assign(sim.browser(),{tlsPhase:this.net.featureEnabled('dns')?'dns':this.address().secure?'handshake':'request',certificateVerified:false});
      if(!this.net.featureEnabled('dns')||sim.browser().dnsCache[HOSTS.ads])sim.webConnect();
      else sim.next([sim.originate(sim.createPacket('dns-query',sim.clientId(),'dns',{name:HOSTS.ads,type:'A'}))]);
    }
    cookieHeader(){
      const c=this.state.clients[this.sim.clientId()];if(c.cookie?.expiresAt<=this.net.cookieTime)c.cookie=null;
      c.lastSent=c.allowed&&c.cookie&&(!c.cookie.secure||this.address().secure)?`reklama_id=${c.cookie.value}`:'';
      delete this.sim.webRequest.cookie;if(c.lastSent)this.sim.webRequest.cookie=c.lastSent;
      c.notice=c.allowed?(c.lastSent?'Prohlížeč připojil vlastní identifikátor reklamního partnera.':'Požadavek neměl reklamní cookie. Nové ID server vrátí v odpovědi.'):'Propojení vypnuté: reklamní cookie se neodesílá a historie se nezapisuje do profilu. Volba používá jen kontext této stránky.';
    }
    select(request,packet){
      let data;try{data=JSON.parse(request.message);}catch{throw new Error('Reklamní požadavek nemá platná data.');}
      if(request.host!==HOSTS.ads||request.method!=='POST'||request.path!=='/vyber'||!['obchod.test','zpravy.test'].includes(data.site)||!Object.hasOwn(TOPICS,data.context))throw new Error('Neplatný modelový reklamní požadavek.');
      const tracking=['prohlizeni','zobrazeni'].includes(data.event),id=/(?:^|;\s*)reklama_id=(r[1-9][0-9]*)(?:;|$)/.exec(request.cookie||'')?.[1];
      let profile=tracking?this.state.profiles.get(id):null;
      if(tracking&&!profile){profile={id:`r${++this.state.serial}`,interests:{},events:[],requests:0,lastIp:''};this.state.profiles.set(profile.id,profile);}
      const number=++this.state.requests;
      if(profile){profile.requests++;profile.lastIp=packet.src;if(data.site==='obchod.test'&&data.event==='prohlizeni'&&['cyklistika','hudba','cestovani'].includes(data.topic))profile.interests[data.topic]=(profile.interests[data.topic]||0)+1;profile.events.push({site:data.site,topic:data.topic||null,number});profile.events=profile.events.slice(-8);}
      const ranking=profile?Object.entries(profile.interests).sort((a,b)=>b[1]-a[1]):[];
      const personalized=!!ranking.length,topic=personalized?ranking[0][0]:data.context;
      const ad={topic,title:TOPICS[topic].title,text:TOPICS[topic].text,personalized,reason:personalized?`Podle uloženého zájmu „${TOPICS[topic].label}“ z prohlížení obchod.test.`:data.context==='obecna'?'Obecný výběr bez uloženého zájmu.':'Podle tématu právě otevřené stránky; historie nebyla potřeba.',provider:HOSTS.ads};
      const response={status:200,title:'Výběr reklamy',revision:number,advertising:{ad},...(profile?{setCookie:`reklama_id=${profile.id}; Path=/; Max-Age=3600${this.address().secure?'; Secure':''}; HttpOnly${this.address().secure?'; SameSite=None':''}`}:{})};
      this.state.last={number,profile:profile?.id||null,site:data.site,event:data.event,topic:data.topic||null,context:data.context,cookie:request.cookie||'',ad:structuredClone(ad),sourceIp:packet.src,packetId:packet.id};
      response.bodyBytes=encoder.encode(responseBody(response)).length;return response;
    }
    handle(e){
      const sim=this.sim;
      if(!this.net.nodes[e.node].on)return sim.failure(`${this.net.nodes[e.node].name} je vypnutý.`,e.packet,e.node);
      if(e.kind==='ads-prepare'){if(!this.net.accessReady(sim.clientId()))return sim.failure('Zařízení nemá připojení pro načtení reklamy.',null,sim.clientId());this.prepare();return;}
      try{sim.webReply=this.select(this.pending,e.packet);this.pending=null;
        e.description=`${this.state.last.profile?'Server použil profil '+this.state.last.profile+'.':'Server nepropojuje návštěvy.'} ${sim.webReply.advertising.ad.reason} Reklama teprve čeká na doručení.`;
        if(this.address().secure)sim.next([{kind:'web-encrypt-response',node:'ads',packet:e.packet,title:'Reklamní server šifruje odpověď',description:'Vybraný banner a případná Set-Cookie se vracejí přes HTTPS do prohlížeče.'}]);
        else sim.next([sim.originate(sim.replyPacket('http-response',e.packet,sim.webReply))]);
      }catch(error){sim.failure(error.message,e.packet,e.node);}
    }
    receive(response){
      const sim=this.sim,c=this.state.clients[sim.clientId()],b=sim.browser();
      if(response.setCookie){c.lastReceived=response.setCookie;const value=/^reklama_id=(r[1-9][0-9]*);/.exec(response.setCookie)?.[1],secure=/;\s*Secure(?:;|$)/i.test(response.setCookie);if(c.allowed&&value&&(!secure||this.address().secure))c.cookie={name:'reklama_id',value,domain:HOSTS.ads,path:'/',secure,httpOnly:true,sameSite:secure?'None':null,expiresAt:this.net.cookieTime+3600};}
      Object.assign(b.adPage,{ad:structuredClone(response.advertising.ad),state:'ready',notice:'Banner se zobrazil až po doručení odpovědi reklamního serveru.'});
      Object.assign(b,{state:'ready',tlsPhase:'done',loadedSecure:this.context.topSecure,certificateVerified:this.context.topSecure});this.context.phase='done';
      sim.finish('Reklama dorazila do prohlížeče',b.adPage.ad.reason,sim.clientId());
    }
    failure(){if(this.embedded){const b=this.sim.browser();if(b.adPage?.run===this.sim.run){Object.assign(b.adPage,{state:'error',notice:'Reklama se nenačetla. Hlavní stránka už dorazila a zůstává dostupná.'});Object.assign(b,{state:'ready',tlsPhase:'done',error:'',certificateVerified:this.context.topSecure});}}this.pending=null;}
    setAllowed(device,value){if(!this.state.clients[device]||this.sim.status==='running')return false;this.state.clients[device].allowed=!!value;return true;}
    clear(device){if(this.sim.status==='running')return false;const c=this.state.clients[device];c.cookie=null;c.notice='Reklamní cookie je smazaná pouze zde. Profily na serveru zůstaly; další návštěva je s původním ID nespojí.';return true;}
  }
  Object.assign(globalThis.InternetLab,{AdsScenario,AD_TOPICS:TOPICS,AD_HOSTS:HOSTS});
})();
