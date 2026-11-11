(() => {
  'use strict';
  const {Network,MESSAGE_MSS,makeMessage,messagePlan,CHATBOT_REPLY,webAddress,requestText,responseText,responseBody,WebCookies,ModelTLS,VPNTransport,PhishingScenario,MITMScenario}=globalThis.InternetLab;
  const encoder=new TextEncoder(),decoder=new TextDecoder();
  const MSS=MESSAGE_MSS;
  const DELIVERY_MSS=MESSAGE_MSS;
  const PACKET_GAP=3;
  const CLOUD_MSS=160;
  const DEFAULT_MESSAGE='Čau Matěji! Nechceš zítra po škole vyrazit ven? Můžeme se sejít ve tři u hřiště a vzít s sebou míč. Pak bych ti rád ukázal náš projekt o internetu. Zkoušíme, kudy putují zprávy mezi dvěma domácnostmi a co se stane, když někde vypadne připojení. Vezmu i tu knížku, co jsem ti slíbil. Dej vědět, jestli se ti to hodí. Těším se!';
  class Simulation {
    constructor(network=new Network()) {
      this.net=network;this.queue=[];this.packets=new Map();this.current=null;this.status='idle';this.lastAction=null;this.action=null;this.run=0;this.serial=0;this.steps=0;this.chunks=new Map();this.totalBytes=0;
      this.time=0;this.order=0;this.linkReady=new Map();this.frame=[];this.phase='upload';this.vpn=new VPNTransport(this);this.phishing=new PhishingScenario(this);this.mitm=new MITMScenario(this);
    }
    clientId() {return this.action?.payload.device||'laptop';}
    clientName() {return this.net.nodes[this.clientId()].name;}
    browser() {return this.net.browserFor(this.clientId());}
    connectionChanged(id) {
      if(this.status!=='running')return;
      const p=[...this.packets.values()].find(p=>['waiting','transit'].includes(p.state)&&(p.source===id||p.destination===id));
      if(p||((!this.packets.size||['chatbot','web','mail-check','phish-send','phish-results'].includes(this.action?.type))&&this.clientId()===id))this.failure(`${this.net.nodes[id].name} změnil připojení. Původní přenos je ukončený; spusť akci znovu.`,p,id);
    }
    createPacket(kind,src,dst,payload={},header={}) {
      const protocol=kind.startsWith('dns')?'UDP':'TCP';
      const response=kind.endsWith('response');
      const p={id:`${this.run}.${++this.serial}`,kind,src:this.net.nodes[src].ip,dst:this.net.nodes[dst].ip,source:src,destination:dst,protocol,ttl:64,payload,location:src,state:'waiting',run:this.run,
        sport:response?(protocol==='UDP'?53:80):(protocol==='UDP'?53000:kind==='print'?51001:51000),dport:response?(protocol==='UDP'?53000:51000):(protocol==='UDP'?53:kind==='print'?9100:80),seq:protocol==='TCP'?(response?8001:1001)+(payload.offset||0):null,
        label:kind==='dns-query'?'DNS · dotaz':kind==='dns-response'?'DNS · odpověď':kind==='http-request'?'HTTP · požadavek':kind==='http-response'?'HTTP · obsah':kind==='print'?'Dokument':`Část zprávy ${payload.index+1}/${payload.total}`,direction:response?'response':'request'};
      if(kind==='message')Object.assign(p,{sport:51002,dport:443,connection:'ty-instagram',label:`Ty → Instagram · ${payload.index+1}/${payload.total}`});
      if(kind==='ig-delivery')Object.assign(p,{sport:443,dport:52002,seq:8001+(payload.offset||0),connection:'instagram-matej',direction:'delivery',label:`Instagram → Matěj · ${payload.index+1}/${payload.total}`});
      if(kind==='ig-read')Object.assign(p,{sport:src==='friend'?52002:443,dport:src==='friend'?443:51002,seq:src==='friend'?4001:12001,connection:src==='friend'?'instagram-matej':'ty-instagram',direction:'receipt',label:src==='friend'?'Přečtení · Matěj → Instagram':'Přečtení · Instagram → ty'});
      if(kind.startsWith('cloud-'))Object.assign(p,{sport:response?443:51003,dport:response?51003:443,connection:'cloud',label:`Cloud · ${response?'odpověď':'požadavek'} ${payload.index+1}/${payload.total}`});
      if(kind.startsWith('chatbot-'))Object.assign(p,{sport:response?443:51004,dport:response?51004:443,connection:'chatbot',label:`Chatbot · ${response?'odpověď':'dotaz'} ${payload.index+1}/${payload.total}`});
      if(kind==='cloud-replica')Object.assign(p,{sport:52004,dport:443,connection:'replica',direction:'replication',label:`Kopie A → B · ${payload.index+1}/${payload.total}`});
      if(kind==='ig-connect')Object.assign(p,{sport:src==='friend'?52002:51002,dport:443,connection:src==='friend'?'instagram-matej':'ty-instagram',label:`Připojení · ${this.net.nodes[src].name} → Instagram`});
      if(kind.startsWith('http-')){p.connection='http';if(payload.cookie)p.label='HTTP · Cookie';else if(payload.setCookie)p.label='HTTP · Set-Cookie';}
      if(kind.startsWith('https-')||kind.startsWith('tls-')) {
        const labels={'tls-client-hello':'TLS · ClientHello','tls-server-response':'TLS · odpověď serveru','tls-finished':'TLS · dokončení','https-request':'HTTPS · požadavek','https-response':'HTTPS · obsah'};
        Object.assign(p,{sport:response?443:51000,dport:response?51000:443,connection:'https',label:labels[kind],seq:this.webSeq[response?'response':'request']});
        this.webSeq[response?'response':'request']+=(payload.record?.data.length||0)+encoder.encode(payload.publicText||'').length;
      }
      if(payload.packetCount>1)p.label=`${kind==='message'?'Do Instagramu':'K Matějovi'} · skupina ${payload.index+1}–${payload.index+payload.packetCount} / ${payload.total}`;
      Object.assign(p,header);this.vpn.prepare(p);p.initialHeader=this.net.packetHeader(p);p.natHistory=[];
      this.packets.set(p.id,p);return p;
    }
    replyPacket(kind,request,payload) {
      return this.createPacket(kind,request.destination,request.source,payload,{src:request.dst,sport:request.dport,dst:request.src,dport:request.sport});
    }
    receiptRelay() {
      return {kind:'receipt-relay',node:'instagram',title:'Instagram připravuje potvrzení pro tvoje zařízení',description:'Odpověď použije spojení otevřené zařízením směrem ven.'};
    }
    start(type,payload={}) {
      if(this.status==='running')return false;
      if(!['web','print','message','cloud','replicate','chatbot'].includes(type)&&!this.phishing.accepts(type))return false;
      if(this.phishing.accepts(type)&&!this.phishing.validate(type,payload))return false;
      if(type==='chatbot'&&(!this.net.chatbot.clients[payload.device||'laptop']||typeof payload.prompt!=='string'||!payload.prompt.trim()))return false;
      if(type==='cloud') {
        if(!this.net.cloud.user(payload.device))return false;
        payload={...payload,server:payload.server==='cloud-backup'?'cloud-backup':'cloud',request:{...payload.request,requestId:payload.request?.requestId||`request-${++this.net.cloud.requestSerial}`}};
      }
      if(type==='message'&&['queued','delivering'].includes(this.net.instagram.state))return false;
      // Repeating an unfinished experiment must not leave a pending conversation behind.
      if(this.action?.type==='chatbot'&&['sending','processing','receiving'].includes(this.chatTurn()?.state)) {
        Object.assign(this.chatTurn(),{state:'error',error:'Původní pokus byl ukončen. Odešli dotaz znovu.'});
        if(this.net.chatbot.server.state==='processing')this.net.chatbot.server.state='interrupted';
      }
      this.mitm.reset();this.vpn.reset();for(const c of Object.values(this.net.vpn.clients))c.path=[];
      this.run++;this.serial=0;this.steps=0;this.packets.clear();this.queue=[];this.chunks.clear();this.current=null;this.totalBytes=0;
      this.time=0;this.order=0;this.linkReady.clear();this.frame=[];
      this.tls=null;this.webSeq={request:1001,response:8001};this.webRequest=null;this.webReply=null;
      this.action={type,payload:{...payload}};this.lastAction={type,payload:{...payload}};this.status='running';
      for(const n of Object.values(this.net.nodes))n.lastDecision=null;
      if(this.phishing.accepts(type)) {this.phishing.start(type);
      } else if(type==='chatbot') {
        const turn={id:++this.net.chatbot.serial,prompt:payload.prompt,answer:'',state:'sending',sentBytes:0,requestBytes:encoder.encode(payload.prompt).length,receivedBytes:0,responseBytes:0,error:''};
        this.action.payload.turnId=turn.id;
        this.net.chatbot.clients[this.clientId()].turns.push(turn);
        this.next([{kind:'chatbot-prepare',node:this.clientId(),title:`${this.clientName()} připravuje dotaz chatbotovi`,description:'Zařízení odešle text. Odpověď připraví vzdálený server.'}]);
      } else if(type==='replicate') {
        Object.assign(this.net.cloud.replica,{state:'sending',message:'Připravuje se přenos kopie z centra A do centra B.'});
        this.next([{kind:'replica-prepare',node:'cloud',title:'Cloud A připravuje kopii pro centrum B',description:'Soubory a přístupová práva se přenesou po síti.'}]);
      } else if(type==='web') {
        Object.assign(this.browser(),{state:'loading',error:'',address:payload.address||'knihovna.test',secure:!!webAddress(payload.address||'knihovna.test')?.secure,tlsPhase:'dns',certificateVerified:false});
        this.next([{kind:'prepare',title:`${this.clientName()} připravuje otevření webu`,description:'Nejprve potřebuje IP adresu serveru.',node:this.clientId()}]);
      } else if(type==='print') {
        this.net.printer.state='sending';
        this.next([{kind:'prepare',title:'Dokument je připravený k odeslání',description:'Tiskárna má adresu ve stejné podsíti jako notebook.',node:this.clientId()}]);
      } else if(type==='cloud') {
        const client=this.net.cloud.clients[this.clientId()];
        Object.assign(client,{state:'sending',message:'Požadavek čeká na odeslání do cloudu.',sentBytes:0,receivedBytes:0,totalBytes:0,requestBytes:0,server:payload.server,phase:'request'});
        this.next([{kind:'cloud-prepare',title:`${this.clientName()} připravuje cloudový požadavek`,description:'Soubor i přístupová práva zpracuje vzdálený cloudový server.',node:this.clientId()}]);
      } else {
        const content=makeMessage(payload.messageType||'text',payload.text||DEFAULT_MESSAGE),text=content.type==='text'?new TextDecoder().decode(content.bytes):content.name;
        Object.assign(this.net.sender,{text,content,sentBytes:0,sentPackets:0,state:'sending'});
        Object.assign(this.net.instagram,{id:this.net.instagram.id+1,text:'',content:null,state:'receiving',totalBytes:content.size,totalPackets:messagePlan(content.size).packets,receivedBytes:0,receivedPackets:0,sentBytes:0,sentPackets:0,streamBytes:0,readRequested:false,readKnown:false,readNotified:false,error:'',senderDevice:this.clientId()});
        Object.assign(this.net.friend,{text:'',content:null,state:'idle',receivedBytes:0,receivedPackets:0,streamBytes:0,read:false});
        this.phase='upload';
        this.next([{kind:'segment',title:`${this.clientName()} připravuje zprávu pro @matej`,description:'První spojení vede z tvého zařízení ke službě Instagram.',node:this.clientId()}]);
      }
      return true;
    }
    repeat() {
      if(!this.lastAction)return false;
      if(this.action?.type==='message'&&this.net.instagram.text&&['queued','delivering'].includes(this.net.instagram.state)) {
        this.net.instagram.state='queued';this.wait('Zpráva čeká na Instagramu','Pro doručení musí být dostupné připojení k Matějovi.','instagram');return this.resumePending();
      }
      return this.start(this.lastAction.type,this.lastAction.payload);
    }
    wait(title,description,node='instagram') {
      for(const p of this.packets.values())if(p.state==='transit'||p.state==='waiting')p.state='stopped';
      this.status='waiting';this.queue=[];this.current={kind:'waiting',at:this.time,title,description,node,packet:this.current?.packet};return this.current;
    }
    continuation() {
      if(this.action?.type!=='message'){this.run++;this.serial=0;this.packets.clear();this.time=0;this.order=0;}
      for(const p of this.packets.values())if(p.state==='transit'||p.state==='waiting')p.state='stopped';
      this.queue=[];this.chunks.clear();this.linkReady.clear();this.frame=[];this.totalBytes=this.net.instagram.totalBytes;
      this.action={type:'message',payload:{text:this.net.sender.text,messageType:this.net.instagram.content?.type||'text',device:this.net.instagram.senderDevice}};this.lastAction={...this.action,payload:{...this.action.payload}};this.status='running';
    }
    resumePending() {
      if(this.status==='running')return false;
      const ig=this.net.instagram;
      if(ig.text&&ig.state==='queued'&&this.net.canReach('instagram','friend')) {
        this.continuation();this.phase='delivery';
        this.next([{kind:'relay',node:'instagram',title:'Matěj je připojený. Instagram připravuje doručení',description:'Zpráva uložená na serveru vyrazí v nových paketech.'}]);
      } else if(ig.readRequested&&!ig.readNotified&&this.net.canReach(ig.readKnown?'instagram':'friend',ig.readKnown?ig.senderDevice:'instagram')) {
        this.continuation();this.phase='read';
        this.next([ig.readKnown?this.receiptRelay():this.originate(this.createPacket('ig-read','friend','instagram',{messageId:ig.id}))]);
      } else return false;
      this.current={kind:'ready',at:this.time,node:'instagram',title:this.phase==='read'?'Potvrzení přečtení je připravené':'Instagram může doručit čekající zprávu',description:'Přenos spusť přehráním nebo krokováním.'};return true;
    }
    markRead() {
      const friend=this.net.friend,ig=this.net.instagram;
      if(!this.net.nodes.friend.on||!friend.text)return false;
      friend.read=true;friend.state='read';
      if(friend.receipts&&!ig.readNotified)ig.readRequested=true;
      return this.resumePending();
    }
    messagePackets(kind,from,to,bytes,size,header={}) {
      const {packets:total,groupSize,groups}=messagePlan(bytes.length),events=[];
      for(let offset=0,groupIndex=0;offset<bytes.length;offset+=size*groupSize,groupIndex++) {
        const data=bytes.slice(offset,offset+size*groupSize),index=offset/size,packetCount=Math.ceil(data.length/size);
        const packet=this.createPacket(kind,from,to,{bytes:data,offset,end:offset+data.length,index,total,totalBytes:bytes.length,packetCount,groupSize,groupIndex,groups,mss:size,contentType:this.net.sender.content?.type||'text',messageId:this.net.instagram.id},header);
        events.push({...this.originate(packet),at:this.time+1+groupIndex*PACKET_GAP});
      }
      this.next(events);return total;
    }
    packetMember(group,index=0) {
      const pl=group.payload;if(!Number.isInteger(index)||index<0||index>=(pl.packetCount||1))return null;
      const offset=index*pl.mss,data=pl.bytes.slice(offset,offset+pl.mss),absolute=pl.offset+offset;
      return {...group,id:`${group.id}:${index}`,parentId:group.id,seq:group.seq+offset,label:`Paket ${pl.index+index+1} / ${pl.total}`,payload:{...pl,bytes:data,offset:absolute,end:absolute+data.length,index:pl.index+index,packetCount:1}};
    }
    cloudPackets(kind,from,to,value,header={}) {
      const bytes=encoder.encode(JSON.stringify(value)),total=Math.ceil(bytes.length/CLOUD_MSS),events=[];
      for(let offset=0,index=0;offset<bytes.length;offset+=CLOUD_MSS,index++) {
        const data=bytes.slice(offset,offset+CLOUD_MSS);
        const p=this.createPacket(kind,from,to,{bytes:data,offset,end:offset+data.length,index,total,totalBytes:bytes.length},header);
        events.push({...this.originate(p),at:this.time+1+index*PACKET_GAP});
      }
      this.next(events);return bytes.length;
    }
    chatTurn() {return this.net.chatbot.clients[this.clientId()]?.turns.find(t=>t.id===this.action?.payload.turnId);}
    chatbotPackets(kind,from,to,text,header={}) {
      const bytes=encoder.encode(text),total=Math.ceil(bytes.length/MSS),events=[];
      for(let offset=0,index=0;offset<bytes.length;offset+=MSS,index++) {
        const data=bytes.slice(offset,offset+MSS);
        const p=this.createPacket(kind,from,to,{bytes:data,offset,end:offset+data.length,index,total,totalBytes:bytes.length,turnId:this.chatTurn().id},header);
        events.push({...this.originate(p),at:this.time+1+index*PACKET_GAP});
      }
      this.next(events);return bytes.length;
    }
    receiveChatbot(p,event) {
      const turn=this.chatTurn(),server=this.net.chatbot.server,request=p.kind==='chatbot-request';
      this.chunks.set(p.payload.offset,p.payload.bytes);
      const received=[...this.chunks.values()].reduce((n,b)=>n+b.length,0);
      if(request) {
        turn.sentBytes=received;
        if(this.chunks.size===1)Object.assign(server,{prompt:'',answer:'',step:0,client:this.clientId()});
        Object.assign(server,{state:'receiving',receivedBytes:received,totalBytes:p.payload.totalBytes});
      }else turn.receivedBytes=received;
      let contiguous=0;while(this.chunks.has(contiguous))contiguous+=this.chunks.get(contiguous).length;
      event.description=`${request?'Server přijímá dotaz':'Zařízení přijímá odpověď'}: ${received} / ${p.payload.totalBytes} B. Aplikace čeká na všechny bajty v pořadí.`;
      if(contiguous!==p.payload.totalBytes)return;
      const bytes=new Uint8Array(contiguous);for(const [offset,data] of this.chunks)bytes.set(data,offset);
      const text=decoder.decode(bytes);this.chunks.clear();
      if(request) {
        Object.assign(server,{state:'processing',step:0,prompt:text,answer:'',client:this.clientId()});turn.state='processing';
        // Reply to the tuple actually seen by the server, including the client's NAT translation.
        this.chatReplyHeader={src:p.dst,sport:p.dport,dst:p.src,dport:p.sport};
        event.title='Chatbot přijal celý dotaz na serveru';event.description='Text je na serveru. Nyní začne zpracování; žádná odpověď ještě nevyrazila.';
        this.next([{kind:'chatbot-compute',node:'chatbot',step:1,title:'Server zpracovává dotaz · 1 / 3',description:'Server načte přijatý text do své aplikace.'}]);
      } else {
        turn.answer=text;turn.state='ready';
        this.finish('Odpověď chatbota dorazila do zařízení','Zařízení složilo doručené bajty a teprve teď zobrazilo odpověď serveru.',this.clientId());
      }
    }
    receiveCloud(p,event) {
      const client=this.net.cloud.clients[this.clientId()],request=p.kind==='cloud-request';
      this.chunks.set(p.payload.offset,p.payload.bytes);
      const received=[...this.chunks.values()].reduce((n,b)=>n+b.length,0);
      if(request)client.sentBytes=received;else client.receivedBytes=received;
      let contiguous=0;
      while(this.chunks.has(contiguous))contiguous+=this.chunks.get(contiguous).length;
      event.description=`Cloudový ${request?'požadavek':'výsledek'}: přijato ${received} / ${p.payload.totalBytes} B, v pořadí ${contiguous} B. Aplikace čeká na celý přenos.`;
      if(contiguous!==p.payload.totalBytes)return;
      const bytes=new Uint8Array(contiguous);
      for(const [offset,data] of this.chunks)bytes.set(data,offset);
      const value=JSON.parse(decoder.decode(bytes));this.chunks.clear();
      if(request) {
        const response=this.net.cloud.handle(this.clientId(),value,p.destination);
        this.net.nodes[p.destination].lastDecision={kind:'cloud',operation:value.op,user:this.net.cloud.user(this.clientId()).name,status:response.status,message:response.message,packetId:p.id};
        client.phase='response';client.message='Čekání na úplnou odpověď cloudového serveru.';client.totalBytes=this.cloudPackets('cloud-response',p.destination,this.clientId(),response,{src:p.dst,sport:p.dport,dst:p.src,dport:p.sport});
        event.title=`${this.net.nodes[p.destination].name}: ${response.status} · ${response.status<300?'požadavek přijat':'požadavek zamítnut'}`;
        event.description=`${response.message} Výsledek teď musí dorazit zpět do notebooku.`;
      } else {
        this.net.cloud.receive(this.clientId(),value,this.action.payload.localId);
        this.finish(value.status<300?'Cloudový přenos je dokončený':'Cloudový server požadavek zamítl',`${value.status} · ${value.message}`,this.clientId());
        if(value.status>=300){this.status='failed';this.current.kind='rejected';}
      }
    }
    receiveReplica(p,event) {
      this.chunks.set(p.payload.offset,p.payload.bytes);
      const received=[...this.chunks.values()].reduce((n,b)=>n+b.length,0);
      this.net.cloud.replica.message=`Přijato ${received} / ${p.payload.totalBytes} B kopie. Původní úplná kopie zůstává zachovaná.`;
      event.description=this.net.cloud.replica.message;
      let contiguous=0;while(this.chunks.has(contiguous))contiguous+=this.chunks.get(contiguous).length;
      if(contiguous!==p.payload.totalBytes)return;
      const bytes=new Uint8Array(contiguous);for(const [offset,data] of this.chunks)bytes.set(data,offset);
      this.net.cloud.applyReplica(JSON.parse(decoder.decode(bytes)));this.chunks.clear();
      this.finish('Kopie dorazila do cloudového centra B','Soubory, verze i přístupová práva jsou zkopírované. Centrum B je může poskytovat ke čtení.','cloud-backup');
    }
    webTarget() {return webAddress(this.browser().address)?.server||'web';}
    webHost() {return webAddress(this.browser().address)?.host||'knihovna.test';}
    prepareWebCookies() {
      const b=this.browser(),address=webAddress(b.address),cookie=WebCookies.header(b.cookies,address,this.webRequest.path,this.net.cookieTime);
      delete this.webRequest.cookie;if(cookie)this.webRequest.cookie=cookie;
    }
    webConnect() {
      const client=this.clientId(),b=this.browser(),target=this.webTarget();
      if(b.secure) {
        this.tls=new ModelTLS(this.run,client);b.tlsPhase='handshake';
        this.next([this.originate(this.createPacket('tls-client-hello',client,target,{publicText:`ClientHello · TLS 1.3\nServer Name (SNI): ${this.webHost()}\nNabídka parametrů a veřejný příspěvek k dohodě klíčů.`}))]);
      } else {
        b.tlsPhase='request';this.prepareWebCookies();
        this.next([this.originate(this.createPacket('http-request',client,target,this.webRequest))]);
      }
    }
    webResponse(request,secure,packet) {
      if(packet.destination==='phish-web')return this.phishing.respondWeb(request,secure,packet);
      const server=this.net.server;
      server.lastRequest={...request,secure,client:this.clientId(),sourceIp:packet.src,sourcePort:packet.sport};
      const response={status:200,cacheControl:'no-store',title:server.title,revision:server.revision,receipt:request.method==='POST'?request.message:'',...WebCookies.respond(server.cookies,request,{secure,sourceIp:packet.src,packetId:packet.id},this.net.cookieTime)};
      response.bodyBytes=encoder.encode(responseBody(response)).length;return response;
    }
    showWeb(response,secure) {
      const b=this.browser();WebCookies.receive(b.cookies,response.setCookie,webAddress(b.address),this.net.cookieTime);
      Object.assign(b,{pageType:response.pageType||'library',loadedHost:this.webHost(),loadedMessageId:response.messageId||0,submitted:!!response.submitted,visitor:response.visitor,greeting:response.greeting,content:response.title,revision:response.revision,receipt:response.receipt||'',state:'ready',loadedSecure:secure,tlsPhase:'done'});
      if(response.pageType==='phishing'){this.finish(response.submitted?'Ukázkové údaje dorazily na podvodný server':'Podvodná stránka dorazila do prohlížeče',response.submitted?`${secure?'Data se dešifrovala na podvodném serveru.':'Data dorazila čitelným HTTP přenosem na podvodný server.'} Útočník si je může načíst ze svého počítače.`:'Otevření stránky v tomto pokusu neodeslalo přihlašovací údaje. Prohlédni skutečnou doménu.',this.clientId());return;}
      this.finish(this.clientId()==='phone'?'Web se zobrazil na telefonu':'Web se zobrazil na notebooku',`${secure?'Prohlížeč dešifroval odpověď. ':''}Doručený obsah verze ${response.revision}${response.receipt?' včetně potvrzení přijatého vzkazu':''}. ${b.cookies.receiveNote}`,this.clientId());
    }
    webEvent(e) {
      const p=e.packet,client=this.clientId(),b=this.browser(),target=this.webTarget();
      if(!this.net.nodes[e.node].on)return this.failure(`${this.net.nodes[e.node].name} je vypnutý.`,p,e.node);
      try {
        if(e.kind==='tls-verify') {
          const cert=this.mitm.certificateFor(p)||this.tls.open(p.payload.record,client,'handshake');
          if(cert.name!==this.webHost()||!cert.valid||!cert.trusted)return this.failure(`HTTPS nelze navázat: certifikát serveru není platný, důvěryhodný nebo nepatří doméně ${this.webHost()}. Požadavek s formulářem nebyl odeslán.`,p,client);
          b.certificateVerified=true;b.tlsPhase='finishing';
          e.description=`Prohlížeč ověřil doménu ${this.webHost()}, platnost a důvěryhodnost certifikátu. Certifikát ověřuje doménu, nikoli poctivost provozovatele.`;
          this.next([this.originate(this.createPacket('tls-finished',client,target,{record:this.tls.seal('finished',{confirmed:true},target)}))]);
        } else if(e.kind==='web-encrypt-request') {
          b.tlsPhase='request';this.prepareWebCookies();
          this.next([this.originate(this.createPacket('https-request',client,target,{record:this.tls.seal('request',this.webRequest,target)}))]);
          e.description='Metoda HTTP, cesta, cookies i text formuláře jsou chráněné TLS. IP adresy a TCP porty zůstávají viditelné.';
        } else if(e.kind==='web-decrypt-request') {
          const request=this.tls.open(p.payload.record,target,'request');
          this.webReply=this.webResponse(request,true,p);b.tlsPhase='processing';
          e.description=`Server dešifroval a zpracoval ${request.method} ${request.path}${request.method==='POST'?' včetně celého formuláře':''}. Připravil obsah verze ${this.webReply.revision}.`;
          this.next([{kind:'web-encrypt-response',node:target,packet:p,title:'Server šifruje odpověď pro prohlížeč',description:'Stejnou stránku odešle zpět v šifrované podobě.'}]);
        } else if(e.kind==='web-encrypt-response') {
          b.tlsPhase='response';
          this.next([this.originate(this.replyPacket('https-response',p,{record:this.tls.seal('response',this.webReply,client)}))]);
        } else if(e.kind==='web-decrypt-response')this.showWeb(this.tls.open(p.payload.record,client,'response'),true);
      } catch(error){return this.failure(error.message,p,e.node);}
      return this.current;
    }
    next(events) {
      for(const event of events) {
        let at=event.at??this.time+1;
        // One frame per directed link and time slot; different links run concurrently.
        if(event.kind==='hop') {
          const key=`${event.link}:${event.from}`;
          at=Math.max(at,this.linkReady.get(key)||0);this.linkReady.set(key,at+1);
          const travel=this.net.links[event.link].travelSteps||1;
          for(let part=1;part<travel;part++)this.queue.push({...event,kind:'satellite-flight',progress:part/travel,startProgress:(part-1)/travel,at:at+part-1,order:++this.order});
          if(travel>1){event.startProgress=(travel-1)/travel;at+=travel-1;}
        }
        this.queue.push({...event,at,order:++this.order});
      }
      this.queue.sort((a,b)=>a.at-b.at||a.order-b.order);
    }
    originate(packet,node) {if(!node&&this.vpn.needsWrap(packet))return this.vpn.event(packet);node??=packet.source;return {kind:'origin',packet,node,title:`${this.net.nodes[node].name} odesílá: ${packet.label}`,description:`IP ${packet.src} → ${packet.dst}`};}
    hop(from,link,packet,frame,copy=false) {return {kind:'hop',from,to:this.net.peer(link,from),link:link.id,packet,copy,frame:{...frame,medium:link.medium},title:`${packet.label} ${link.medium==='wifi'?'putuje přes Wi-Fi':link.medium==='satellite'?'putuje přes satelitní rádio':link.medium==='cellular'?'putuje přes mobilní rádio':'putuje po spoji'}`,description:`${this.net.nodes[from].name} → ${this.net.nodes[this.net.peer(link,from)].name}`};}
    failure(reason,packet,node) {
      if(packet) {packet.state='lost';packet.location=node||packet.location;packet.visual={kind:'failure',node:packet.location};}
      for(const p of this.packets.values())if(p.state==='waiting'||p.state==='transit')p.state='stopped';
      this.status='failed';this.queue=[];
      if(this.phishing.accepts(this.action.type))this.phishing.failure(reason);
      if(this.action.type==='replicate')Object.assign(this.net.cloud.replica,{state:'error',message:`${reason} Předchozí úplná kopie zůstala zachovaná.`});
      if(this.action.type==='web') {this.browser().state='error';this.browser().error=reason;this.browser().tlsPhase='error';}
      if(this.action.type==='print')this.net.printer.state='error';
      if(this.action.type==='cloud')Object.assign(this.net.cloud.clients[this.clientId()],{state:'error',message:`${reason} Pokud už server požadavek převzal, změna na něm zůstala. Obnov seznam nebo opakuj akci.`});
      if(this.action.type==='chatbot') {
        Object.assign(this.chatTurn(),{state:'error',error:reason});
        if(['receiving','processing'].includes(this.net.chatbot.server.state))this.net.chatbot.server.state='interrupted';
      }
      if(this.action.type==='message') {
        const ig=this.net.instagram;ig.error=reason;
        if(ig.text) {
          if(packet?.kind==='ig-read'||['read','connect-read'].includes(this.phase))return this.wait('Potvrzení přečtení čeká na připojení',reason,packet?.location||node);
          ig.state='queued';Object.assign(this.net.friend,{state:'idle',receivedBytes:0,receivedPackets:0,streamBytes:0});
          return this.wait('Zpráva zůstala na Instagramu',`${reason} Po obnovení připojení může server zkusit nové doručení.`);
        }
        ig.state='failed';this.net.sender.state='failed';
      }
      this.current={kind:'failure',at:this.time,title:'Přenos se nepodařilo doručit',description:reason,packet,node:node||packet?.location};
      return this.current;
    }
    finish(title,description,node) {this.status='success';this.queue=[];this.current={kind:'complete',at:this.time,title,description,node,packet:this.current?.packet};return this.current;}
    advanceFrame() {
      if(this.status!=='running'||!this.queue.length)return null;
      const at=this.queue[0].at,events=[];
      do {events.push(this.advance());}while(this.status==='running'&&this.queue[0]?.at===at);
      this.frame=events;
      if(events.length>1&&this.status==='running'&&this.action.type==='message') {
        const connecting=this.phase.startsWith('connect-'),kind=connecting?'ig-connect':this.phase==='upload'?'message':this.phase==='delivery'?'ig-delivery':'ig-read';
        const packets=[...this.packets.values()].filter(p=>this.vpn.logical(p).kind===kind&&p.state!=='stopped'&&p.state!=='lost'),count=p=>p.payload.packetCount||1,active=packets.filter(p=>p.state==='transit').reduce((n,p)=>n+count(p),0),delivered=packets.filter(p=>p.state==='delivered').reduce((n,p)=>n+count(p),0),total=packets.reduce((n,p)=>n+count(p),0);
        this.current={...events.at(-1),kind:'parallel',title:`${connecting?'Otevření spojení k Instagramu':this.phase==='upload'?'Ty → Instagram':this.phase==='delivery'?'Instagram → Matěj':'Potvrzení přečtení'} · na cestě ${active} z ${total}`,description:`Doručeno ${delivered} / ${total}. ${events.at(-1).title}`};
      }
      return this.current;
    }
    advance() {
      if(this.status!=='running'||!this.queue.length)return null;
      const e=this.queue.shift();this.current=e;this.frame=[e];this.time=e.at;this.steps++;
      const p=e.packet;
      if(p)e.header=this.net.packetHeader(p);
      if(e.kind==='mitm'){this.mitm.inspect(e);return this.current;}
      if(e.kind==='phishing-prepare'){this.phishing.prepare(e);return this.current;}
      if(['vpn-wrap','vpn-unpack'].includes(e.kind))return this.vpn.handle(e);
      if(['tls-verify','web-encrypt-request','web-decrypt-request','web-encrypt-response','web-decrypt-response'].includes(e.kind))return this.webEvent(e);
      if(e.kind==='chatbot-prepare') {
        const client=this.clientId();
        if(!this.net.nodes[client].on||!this.net.accessReady(client))return this.failure(`${this.clientName()} nemá dostupné připojení.`,null,client);
        const bytes=this.chatbotPackets('chatbot-request',client,'chatbot',this.chatTurn().prompt);
        e.description=`Dotaz má ${bytes} B. Pakety s nejvýše ${MSS} B dat putují k serveru 203.0.113.30. Odpověď se v zařízení nepočítá.`;
      } else if(e.kind==='chatbot-compute') {
        if(!this.net.nodes.chatbot.on)return this.failure('Server chatbota je vypnutý. Nemůže dokončit zpracování dotazu.',null,'chatbot');
        const server=this.net.chatbot.server;server.step=e.step;
        if(e.step<3)this.next([{kind:'chatbot-compute',node:'chatbot',step:e.step+1,title:`Server zpracovává dotaz · ${e.step+1} / 3`,description:e.step===1?'Server spouští program chatbota. V této ukázce vybírá vždy stejný text.':'Server dokončí odpověď a připraví ji k odeslání.'}]);
        else {
          // The fixed teaching response is created here, never by the sending client.
          server.answer=CHATBOT_REPLY;server.processed++;server.state='ready';
          const turn=this.chatTurn();turn.state='receiving';
          turn.responseBytes=this.chatbotPackets('chatbot-response','chatbot',this.clientId(),server.answer,this.chatReplyHeader);
          e.title='Server dokončil výpočet a odesílá odpověď';e.description='Odpověď vznikla na serveru. Zařízení ji uvidí až po návratu všech paketů.';
        }
      } else if(e.kind==='replica-prepare') {
        const snapshot=this.net.cloud.snapshot();
        const size=this.cloudPackets('cloud-replica','cloud','cloud-backup',snapshot);
        e.description=`Snímek verze ${snapshot.revision}: ${size} B dat a práv. Nová kopie se zpřístupní až po přijetí všech částí.`;
      } else if(e.kind==='cloud-prepare') {
        const device=this.clientId();
        if(!this.net.nodes[device].on||!this.net.accessReady(device))return this.failure(`${this.clientName()} nemá dostupné připojení.`,null,device);
        const client=this.net.cloud.clients[device];
        client.message='Odesílání požadavku do cloudu…';
        client.requestBytes=this.cloudPackets('cloud-request',device,this.action.payload.server,this.action.payload.request);
        e.description=`${client.requestBytes} B požadavku se rozdělí na části do ${CLOUD_MSS} B. Další část vyrazí dříve, než předchozí dorazí do cloudu.`;
      } else if(e.kind==='prepare') {
        const client=this.clientId();
        if(!this.net.nodes[client].on)return this.failure(`${this.clientName()} je vypnutý.`,null,client);
        if(!this.net.accessReady(client))return this.failure(`${this.clientName()} nemá dostupné připojení.`,null,client);
        if(this.action.type==='web') {
          const address=webAddress(this.browser().address);
          if(!address)return this.failure('V modelu otevři knihovna.test nebo knihovna-podpora.test, přes HTTP či HTTPS.',null,client);
          const method=this.action.payload.method==='POST'?'POST':'GET';let message=this.action.payload.message||'';
          if(address.server==='phish-web'&&method==='POST'){if(!this.action.payload.phishLogin)return this.failure('Použij formulář s ukázkovým přihlášením.',null,client);message=this.phishing.prepareLogin(address);if(!message)return this.failure('Zpráva byla označena jako phishing. Přihlašovací údaje se neodešlou.',null,client);}
          if(address.server!=='phish-web'&&method==='POST'&&(!message.trim()||message.length>160))return this.failure('Vzkaz musí mít 1 až 160 znaků.',null,client);
          this.webRequest={method,path:address.server==='phish-web'?address.path+(address.messageId?'?zprava='+address.messageId:''):method==='POST'?'/vzkaz':'/',host:address.host,...(method==='POST'?{message}:{})};
          const cached=this.browser().dnsCache[address.host];
          if(cached) {
            e.description=`DNS odpověď už zařízení zná: ${address.host} → ${cached}. ${address.secure?'Následuje navázání TLS a až potom šifrovaný požadavek.':'Nový HTTP požadavek přesto odešle po síti.'}`;
            this.webConnect();
          } else this.next([this.originate(this.createPacket('dns-query',client,'dns',{name:address.host,type:'A'}))]);
        } else this.next([this.originate(this.createPacket('print',client,'printer',{document:this.action.payload.document||'Poznámky k projektu.pdf'}))]);
      } else if(e.kind==='segment') {
        if(!this.net.nodes[this.clientId()].on)return this.failure(`${this.clientName()} je vypnutý.`,null,this.clientId());
        if(!this.net.accessReady(this.clientId()))return this.failure(`${this.clientName()} nemá dostupné připojení.`,null,this.clientId());
        const bytes=this.net.sender.content.bytes;this.totalBytes=bytes.length;
        const total=this.messagePackets('message',this.clientId(),'instagram',bytes,MSS);
        const plan=messagePlan(bytes.length);e.description=`${bytes.length} B → ${total} datových paketů, nejvýše ${MSS} B dat v jednom. ${plan.groupSize>1?`Zhuštěné zobrazení: jedna značka představuje nejvýše ${plan.groupSize} paketů.`:'Pakety odcházejí jednotlivě s odstupem.'}`;
      } else if(e.kind==='relay') {
        const ig=this.net.instagram;
        if(!this.net.canReach('instagram','friend')) {ig.state='queued';return this.wait('Zpráva čeká na Instagramu','Matějovo zařízení nebo cesta k němu je nedostupná. Zpráva je uložená pro pozdější doručení.');}
        const channel=this.net.instagramChannel('friend');
        if(!channel) {
          this.phase='connect-delivery';
          e.title='Matějův notebook otevírá spojení k Instagramu';e.description='Klient zahájí spojení směrem ven. Domácí NAT si připraví překlad pro návrat zprávy.';
          this.next([this.originate(this.createPacket('ig-connect','friend','instagram',{purpose:'delivery'}))]);return e;
        }
        ig.state='delivering';ig.error='';this.phase='delivery';this.chunks.clear();Object.assign(this.net.friend,{state:'receiving',receivedBytes:0,receivedPackets:0,streamBytes:0});ig.sentBytes=0;ig.sentPackets=0;
        const total=this.messagePackets('ig-delivery','instagram','friend',ig.content.bytes,DELIVERY_MSS,{dst:channel.ip,dport:channel.port});
        e.title='Instagram vytváří nové pakety pro Matěje';e.description=`Připravené spojení: 203.0.113.80:443 → ${channel.ip}:${channel.port}. ${total} nových částí; Matějův router obnoví soukromou adresu a port.`;
      } else if(e.kind==='receipt-relay') {
        const ig=this.net.instagram,device=ig.senderDevice,channel=this.net.instagramChannel(device);
        if(!this.net.canReach('instagram',device))return this.wait('Instagram uchoval potvrzení přečtení','Tvoje zařízení nebo jeho připojení je nedostupné.');
        if(!channel) {
          this.phase='connect-read';
          e.title=`${this.net.nodes[device].name} obnovuje spojení k Instagramu`;e.description='Po změně připojení musí zařízení otevřít nové spojení ze svého aktuálního připojení.';
          this.next([this.originate(this.createPacket('ig-connect',device,'instagram',{purpose:'read'}))]);
        } else {this.phase='read';this.next([this.originate(this.createPacket('ig-read','instagram',device,{messageId:ig.id},{dst:channel.ip,dport:channel.port}))]);}
      } else if(e.kind==='origin') {
        if(!this.net.nodes[e.node].on)return this.failure(`${this.net.nodes[e.node].name} je vypnutý.`,p,e.node);
        const out=this.net.ethernetFor(e.node,p.dst);
        if(!out)return this.failure('Odesílatel nezná další uzel pro cílovou IP adresu.',p,e.node);
        p.state='transit';p.location=e.node;p.visual={kind:'origin',node:e.node};
        const logical=this.vpn.logical(p);
        if(!p.sent&&['message','ig-delivery'].includes(logical.kind)){const source=logical.kind==='message'?this.net.sender:this.net.instagram;source.sentBytes+=logical.payload.bytes.length;source.sentPackets+=logical.payload.packetCount||1;}p.sent=true;
        e.frame={...out.frame};this.next([this.hop(e.node,out.link,p,out.frame)]);
      } else if(e.kind==='satellite-flight') {
        const l=this.net.links[e.link];if(!this.net.isActive(l))return this.failure(`Satelitní spoj „${l.name}“ není dostupný.`,p,e.from);
        p.frame={...e.frame};p.visual={kind:'hop',from:e.from,to:e.to,link:e.link,progress:e.progress,startProgress:e.startProgress};
        e.title=`${p.label} · let rádiového signálu`;e.description=`${this.net.nodes[e.from].name} → ${this.net.nodes[e.to].name}. Zpomalený let je výukový, nikoliv měření skutečné odezvy.`;
      } else if(e.kind==='hop') {
        const l=this.net.links[e.link];
        if(!this.net.isActive(l))return this.failure(`Spoj „${l.name}“ není dostupný. Tento paket se ztratil; opakuj akci po změně sítě.`,p,e.from);
        const n=this.net.nodes[e.to];if(!e.copy)this.vpn.observeHop(p,l.id);
        const accepts=['switch','ap','bts','terminal','satellite'].includes(n.type)||(e.frame.satellite?n.type==='router':e.frame.cellular?(n.id==='mobile-core'||n.id==='phone'&&this.net.access.phone.mode==='cellular'):this.net.iface(e.to,l).mac===e.frame.dst);
        if(!accepts) {
          e.discarded=true;
          e.title=`${n.name} kopii rámce nepřevezme`;
          e.description='Cílová MAC adresa patří jinému zařízení. Tato kopie se zde zahodí.';
        } else {
          if(!e.copy){p.location=e.to;p.frame={...e.frame};p.visual={kind:'hop',from:e.from,to:e.to,link:e.link,startProgress:e.startProgress};if(l.medium==='satellite'){p.satelliteHistory??=[];p.satelliteHistory.push({link:l.id,from:e.from,to:e.to,ttl:p.ttl,header:this.net.packetHeader(p)});}}
          if(n.id==='cafe-attacker'&&!e.copy)this.next([{kind:'mitm',node:n.id,inLink:l.id,frame:e.frame,packet:p}]);
          else if(['switch','ap'].includes(n.type)) this.next([{kind:'switch',node:n.id,inLink:l.id,frame:e.frame,packet:p,copy:e.copy}]);
          else if(['terminal','satellite'].includes(n.type))this.next([{kind:'satellite-relay',node:n.id,inLink:l.id,frame:e.frame,packet:p}]);
          else if(n.type==='bts')this.next([{kind:'radio-relay',node:n.id,inLink:l.id,frame:e.frame,packet:p}]);
          else if(n.type==='router') this.next([{kind:'route',node:n.id,inLink:l.id,packet:p,frame:e.frame}]);
          else if(n.ip===p.dst) this.next([{kind:'deliver',node:n.id,packet:p,frame:e.frame}]);
          else return this.failure('IP paket dorazil na jiné cílové zařízení.',p,e.to);
        }
      } else if(e.kind==='switch') {
        const n=this.net.nodes[e.node];if(!n.on)return this.failure(`${n.name} je vypnutý.`,p,n.id);
        if(!e.copy)p.visual={kind:'switch',node:n.id};
        const decision=this.net.switchFrame(n.id,e.inLink,e.frame,p.id);e.decision=decision;
        e.title=decision.known?`${n.name} zná cílovou MAC adresu`:`${n.name} zatím nezná cílovou MAC adresu`;
        e.description=`Ze zdrojové adresy se naučí port ${decision.input}. `+(decision.known?`Rámec pošle na ${decision.known}.`:`Kopii pošle na ostatní aktivní porty: ${decision.ports.join(', ')||'žádné'}.`);
        if(!decision.ports.length) {
          if(e.copy){e.discarded=true;e.title=`${n.name} nemá další port pro kopii rámce`;}
          else return this.failure('Přepínač nemá aktivní výstupní port pro tento rámec.',p,n.id);
        }
        // Wrong-destination copies are observable too; the intended copy is last.
        const outputs=decision.ports.map(port=>this.net.links[n.interfaces[port].link]);
        outputs.sort((a,b)=> {
          const ma=this.net.linkLeadsTo(a,n.id,e.frame.dst)?1:0;
          const mb=this.net.linkLeadsTo(b,n.id,e.frame.dst)?1:0;return ma-mb;
        });
        this.next(outputs.map(l=>this.hop(n.id,l,p,e.frame,e.copy||!this.net.linkLeadsTo(l,n.id,e.frame.dst))));
      } else if(e.kind==='satellite-relay') {
        const n=this.net.nodes[e.node],out=this.net.adjacent(n.id).find(l=>l.id!==e.inLink&&this.net.isActive(l));
        if(!n.on||!out)return this.failure(`${n.name} nemůže předat satelitní data dál. Zkontroluj napájení, výhled antény a spoje.`,p,n.id);
        p.visual={kind:'satellite-relay',node:n.id};n.forwarded=(n.forwarded||0)+(p.payload.packetCount||1);
        n.lastDecision={kind:'satellite',packetId:p.id,input:this.net.port(this.net.links[e.inLink],n.id),out:this.net.port(out,n.id),version:this.net.version};
        e.title=`${n.name} předává data`;e.description='Satelitní přístup nese původní IP paket. V tomto zjednodušeném modelu přenosová část nemění jeho IP adresy, porty ani TTL a nesestavuje zprávu.';
        this.next([this.hop(n.id,out,p,{satellite:true,target:p.dst})]);
      } else if(e.kind==='radio-relay') {
        const n=this.net.nodes[e.node],out=this.net.adjacent(n.id).find(l=>l.id!==e.inLink&&this.net.isActive(l));
        if(!n.on||!out)return this.failure(`${n.name} nemůže předat data dál.`,p,n.id);
        p.visual={kind:'radio-relay',node:n.id};
        n.lastDecision={kind:'cellular',packetId:p.id,input:this.net.port(this.net.links[e.inLink],n.id),out:this.net.port(out,n.id),version:this.net.version};
        e.title=`${n.name} předává mobilní data`;e.description=out.medium==='cellular'?'Ze sítě operátora rádiem do telefonu.':'Z rádiového spoje po přípojce do sítě operátora. BTS nesestavuje aplikační zprávu ani nesnižuje TTL vnitřního IP paketu.';
        this.next([this.hop(n.id,out,p,e.frame)]);
      } else if(e.kind==='route') {
        const n=this.net.nodes[e.node];if(!n.on)return this.failure(`${n.name} je vypnutý.`,p,n.id);
        p.visual={kind:'route',node:n.id};
        if(p.ttl<=1)return this.failure('Paket vyčerpal TTL a byl zahozen.',p,n.id);
        let nat=this.net.natIncoming(n.id,p,e.inLink);
        if(nat?.blocked){n.lastDecision={kind:'nat-drop',packetId:p.id,reason:nat.reason,version:this.net.version};e.decision=n.lastDecision;return this.failure(nat.reason,p,n.id);}
        const out=this.net.ethernetFor(n.id,p.dst);
        if(out&&!nat)nat=this.net.natOutgoing(n.id,p,e.inLink,out.link.id);
        if(nat?.blocked){n.lastDecision={kind:'nat-drop',packetId:p.id,reason:nat.reason,version:this.net.version};e.decision=n.lastDecision;return this.failure(nat.reason,p,n.id);}
        n.lastDecision={kind:'route',packetId:p.id,dst:p.dst,row:out?.row?{...out.row}:null,nat,version:this.net.version};e.decision=n.lastDecision;e.header=this.net.packetHeader(p);
        e.title=`${n.name} vybírá další krok podle cílové IP`;
        if(!out)return this.failure(`${n.name} nemá v aktuální směrovací tabulce cestu pro ${p.dst}.`,p,n.id);
        if(n.id==='sat-gateway')n.forwarded=(n.forwarded||0)+(p.payload.packetCount||1);
        p.ttl--;e.description=`Cíl ${p.dst} odpovídá ${out.row.prefix}. Výstup ${out.row.out}; ${out.row.next?`další router ${this.net.nodes[out.row.next].name} (${out.row.nextIp})`:'cílové zařízení v přímo připojené síti'}.`;
        if(nat) {e.title=`${n.name}: NAT ${nat.direction==='out'?'směrem do internetu':'zpět do domácnosti'}`;e.description=`${nat.direction==='out'?`${nat.before.src}:${nat.before.sport} → ${nat.after.src}:${nat.after.sport}`:`${nat.before.dst}:${nat.before.dport} → ${nat.after.dst}:${nat.after.dport}`}. ${e.description}`;}
        this.next([this.hop(n.id,out.link,p,out.frame)]);
      } else if(e.kind==='deliver') {
        const n=this.net.nodes[e.node];if(!n.on)return this.failure(`${n.name} je vypnutý.`,p,n.id);
        p.state='delivered';p.location=n.id;p.visual={kind:'deliver',node:n.id};e.title=`${n.name} přijímá: ${p.label}`;e.description=`IP paket je u cíle ${p.dst}.`;
        if(p.kind.startsWith('vpn-')||n.id==='vpn'){this.vpn.receive(p,e);return this.current;}
        if(p.connection==='phishing-api'){this.phishing.receive(p,e);return this.current;}
        if(p.destination==='instagram'&&p.source!=='instagram')this.net.rememberInstagramChannel(p);
        if(p.kind==='ig-connect') {
          e.title='Instagram přijal spojení otevřené klientem';e.description=`Pro odpovědi použije ${p.src}:${p.sport}. Server použije adresu a port pozorované na přijatém paketu.`;
          this.next([p.payload.purpose==='read'?this.receiptRelay():{kind:'relay',node:'instagram',title:'Instagram doručí zprávu po otevřeném spojení',description:'NAT příjemce už zná návratovou cestu.'}]);
        } else if(p.kind.startsWith('chatbot-'))this.receiveChatbot(p,e);
        else if(p.kind==='cloud-replica')this.receiveReplica(p,e);
        else if(p.kind.startsWith('cloud-'))this.receiveCloud(p,e);
        else if(p.kind==='dns-query') {
          this.next([this.originate(this.replyPacket('dns-response',p,{name:p.payload.name,answer:this.net.dnsRecords[p.payload.name],type:'A'}))]);
          e.description=`DNS server připravil odpověď: ${p.payload.name} → ${this.net.dnsRecords[p.payload.name]}. Obsah webu neposkytuje.`;
        } else if(p.kind==='dns-response') {
          this.browser().dnsCache[p.payload.name]=p.payload.answer;
          this.webConnect();
          e.description=`Zařízení zná IP adresu. ${this.browser().secure?'Nejprve naváže TLS spojení se serverem. HTTPS samo nešifruje tento běžný DNS dotaz.':'Nyní může odeslat HTTP požadavek.'}`;
        } else if(p.kind==='tls-client-hello') {
          const record=this.tls.seal('handshake',p.destination==='phish-web'?this.net.phishing.certificate:this.net.server.certificate,p.source);
          this.next([this.originate(this.replyPacket('tls-server-response',p,{publicText:'ServerHello · TLS 1.3\nVolba parametrů a veřejný příspěvek k dohodě klíčů.',record}))]);
          e.description='Server odpovídá parametry TLS a chráněnou částí handshake s certifikátem. Jde o zjednodušený společný přenos několika TLS zpráv.';
        } else if(p.kind==='tls-server-response') {
          this.browser().tlsPhase='certificate';
          this.next([{kind:'tls-verify',node:p.destination,packet:p,title:'Prohlížeč ověřuje certifikát serveru',description:'Ověří název domény, platnost a důvěryhodnost certifikátu.'}]);
        } else if(p.kind==='tls-finished') {
          try{this.tls.open(p.payload.record,p.destination,'finished');}catch(error){return this.failure(error.message,p,p.destination);}
          this.tls.ready=true;this.browser().tlsPhase='established';
          this.next([{kind:'web-encrypt-request',node:p.source,title:'Prohlížeč šifruje HTTP požadavek',description:'TLS je ověřené. Nyní lze bezpečně odeslat aplikační data.'}]);
          e.title='Zabezpečené spojení TLS je navázané';e.description='Prohlížeč i server mohou chránit obsah. Routery nepotřebují znát šifrovací klíče.';
        } else if(p.kind==='https-request'||p.kind==='https-response') {
          const request=p.kind==='https-request';
          this.next([{kind:request?'web-decrypt-request':'web-decrypt-response',node:p.destination,packet:p,title:request?'Server dešifruje a zpracuje požadavek':'Prohlížeč dešifruje odpověď',description:'Čitelný obsah je dostupný na konci zabezpečeného spojení.'}]);
          e.description='Dorazil šifrovaný obsah. Příjemce ho nyní musí dešifrovat a ověřit jeho integritu.';
        } else if(p.kind==='http-request') {
          const server=this.net.server;
          this.browser().tlsPhase='response';
          try{this.next([this.originate(this.replyPacket('http-response',p,this.webResponse(p.payload,false,p)))]);}
          catch(error){return this.failure(error.message,p,p.destination);}
          if(p.destination==='phish-web')e.description='Podvodný server připravil odpověď. Při přijetí formuláře se ukázkové údaje uloží právě zde.';
          else e.description=`Server ${server.cookies.last.returning?'rozpoznal prohlížeč podle cookie':'vytvořil nové ID prohlížeče'} ${server.cookies.last.id}. Do odpovědi přidal Set-Cookie a obsah verze ${server.revision}. Změna obsahu po tomto okamžiku už tuto odpověď nezmění.`;
        } else if(p.kind==='http-response') {
          this.showWeb(p.payload,false);
        } else if(p.kind==='print') {
          this.net.printer.count++;this.net.printer.document=p.payload.document;this.net.printer.state='ready';
          this.finish('Dokument je vytištěný',`${p.payload.document} dorazil do tiskárny po místní síti.`,'printer');
        } else if(p.kind==='message'||p.kind==='ig-delivery') {
          const recipient=p.kind==='message'?this.net.instagram:this.net.friend;
          this.chunks.set(p.payload.offset,p.payload.bytes);recipient.receivedPackets=[...this.chunks.values()].reduce((n,b)=>n+Math.ceil(b.length/MSS),0);recipient.receivedBytes=[...this.chunks.values()].reduce((n,b)=>n+b.length,0);
          let contiguous=0;
          while(this.chunks.has(contiguous))contiguous+=this.chunks.get(contiguous).length;
          recipient.streamBytes=contiguous;
          e.description=`TCP přijalo ${recipient.receivedBytes} B a v pořadí předalo aplikaci ${contiguous} B. ${p.kind==='message'?'Instagram':'Matějův notebook'} čeká na všech ${this.totalBytes} B.`;
          if(recipient.receivedBytes===this.totalBytes) {
            const bytes=new Uint8Array(this.totalBytes);
            for(const [offset,data] of this.chunks)bytes.set(data,offset);
            const original=p.kind==='message'?this.net.sender.content:this.net.instagram.content;
            recipient.content={...original,bytes};recipient.text=original.type==='text'?decoder.decode(bytes):original.name;
            if(p.kind==='message') {
              recipient.state='queued';this.net.sender.state='sent';
              e.title='Instagram převzal celou zprávu';e.description='Zpráva je uložená pro @matej. Služba nyní připraví druhé spojení.';
              this.next([{kind:'relay',node:'instagram',title:'Instagram připravuje doručení Matějovi',description:'Na druhém spojení vzniknou nové pakety s jinými adresami.'}]);
            } else {
              recipient.state='delivered';this.net.instagram.state='delivered';this.net.sender.state='delivered';
              this.finish('Zpráva dorazila Matějovi',`${this.totalBytes} B je složeno v jeho notebooku. Přečtení nastane po otevření konverzace.`,'friend');
              if(recipient.chatOpen)this.markRead();
            }
          }
        } else if(p.kind==='ig-read') {
          if(p.destination==='instagram') {
            this.net.instagram.readKnown=true;e.title='Instagram přijal potvrzení přečtení';
            if(this.net.canReach('instagram',this.net.instagram.senderDevice))this.next([this.receiptRelay()]);
            else return this.wait('Instagram uchoval potvrzení přečtení','Tvoje zařízení je nedostupné. Potvrzení dorazí po obnovení připojení.');
          } else {
            this.net.instagram.readNotified=true;this.net.sender.state='read';
            this.finish('Matěj zprávu přečetl', 'Potvrzení přečtení dorazilo přes Instagram zpět do tvého zařízení.',this.net.instagram.senderDevice);
          }
        }
      }
      // A flooded copy can be the last surviving event when the target port is down.
      if(this.status==='running'&&!this.queue.length)return this.failure('Cílové zařízení rámec neobdrželo. Zkontroluj jeho napájení a připojení.',p,p?.location);
      return this.current;
    }
  }
  Object.assign(globalThis.InternetLab,{Simulation,MSS,DELIVERY_MSS,CLOUD_MSS,DEFAULT_MESSAGE});
})();
