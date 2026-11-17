/* Local mail transport: prepared TLS sessions, a short SMTP dialogue, MX relay,
   IMAP snapshots and flags. No real mail, sockets or credentials are used. */
(() => {
  'use strict';
  const {ModelTLS,PHISH_CLIENTS,emailFor,mailTemplate}=globalThis.InternetLab;
  const encoder=new TextEncoder(),decoder=new TextDecoder(),CHUNK=192;
  const serverFor=id=>id==='friend'?'mail-dopis':'mail';
  const domainOf=address=>address.split('@')[1];
  const mailWire=m=>`Message-ID: <${m.id}@${domainOf(m.from)}>\r\nFrom: ${m.from}\r\nTo: ${m.to}\r\nSubject: ${m.subject}\r\n\r\n${m.body.replace(/\r?\n/g,'\r\n').replace(/^\./gm,'..')}\r\n.\r\n`;
  class MailScenario {
    #sessions=new Map();#buffers=new Map();#transfer=0;#sessionSerial=0;
    constructor(sim){
      this.sim=sim;this.net=sim.net;
      this.state=this.net.mail??={serial:0,boxes:Object.fromEntries(PHISH_CLIENTS.map(id=>[id,[]])),queue:new Map(),mxCache:{},dialogue:[],current:null};
      for(const c of Object.values(this.net.phishing.clients)){c.items??=[];c.notice??='';}
      this.entry=null;this.phase='idle';
    }
    accepts(type){return ['mail-send','mail-check','mail-seen','mail-retry','phish-send'].includes(type);}
    validate(type,p){
      if(type==='phish-send')return p.device==='hacker'&&PHISH_CLIENTS.includes(p.target);
      if(type==='mail-retry')return this.state.queue.get(String(p.messageId))?.state==='queued';
      if(!PHISH_CLIENTS.includes(p.device))return false;
      if(type==='mail-send')return PHISH_CLIENTS.includes(p.target)&&typeof p.subject==='string'&&p.subject.trim().length>0&&p.subject.length<=100&&typeof p.body==='string'&&p.body.trim().length>0&&p.body.length<=1200;
      if(type==='mail-seen')return this.net.phishing.clients[p.device].items.some(m=>String(m.id)===String(p.messageId));
      return type==='mail-check';
    }
    start(type){
      const s=this.sim,a=s.action,p=a.payload,c=this.net.phishing.clients[s.clientId()];
      this.#sessions.clear();this.#buffers.clear();this.#transfer=0;this.#sessionSerial=0;this.entry=null;
      if(type==='mail-send'||type==='phish-send'){
        if(type==='phish-send')p.messageId??=++this.net.phishing.serial;else p.messageId??=`mail-${++this.state.serial}`;
        s.lastAction.payload.messageId=p.messageId;
        const old=this.state.queue.get(String(p.messageId));
        const message=old?.message||(type==='phish-send'?{...mailTemplate(p.target,p.messageId),source:'hacker'}:{id:p.messageId,source:p.device,target:p.target,from:emailFor(p.device),fromName:this.net.nodes[p.device].name,to:emailFor(p.target),subject:p.subject.trim().replace(/[\r\n]/g,' '),body:p.body});
        this.entry=old||{message,origin:serverFor(p.device),destination:serverFor(p.target),state:'new',accepted:false,clientAccepted:false,attempts:0,lastError:''};
        this.phase='submission';
        if(c)Object.assign(c,{state:'sending',error:'',notice:'SMTP připravuje odeslání zprávy.'});
        else Object.assign(this.net.phishing.hacker,{state:'sending',lastTarget:p.target,notice:'SMTP připravuje podvodný e-mail.'});
      }else if(type==='mail-retry'){this.entry=this.state.queue.get(String(p.messageId));this.phase='retry';}
      else {this.phase='imap';Object.assign(c,{state:'loading',error:'',notice:type==='mail-check'?'IMAP načítá schránku.':'IMAP ukládá příznak přečtení.'});}
      this.state.current={run:s.run,device:s.clientId(),phase:this.phase,messageId:p.messageId||null};
      s.next([{kind:'mail-prepare',node:type==='mail-retry'?this.entry.origin:s.clientId(),title:this.phase==='imap'?'IMAP · přístup ke schránce':'SMTP · odesílání zprávy',description:'Přenos spusť krokováním nebo přehráním.'}]);
    }
    log(node,session,direction,value){
      this.state.dialogue.push({run:this.sim.run,node,session:session.id,protocol:session.protocol,phase:session.phase,direction,wire:value.wire,say:value.say});
      if(this.state.dialogue.length>160)this.state.dialogue.shift();
    }
    session(from,to,protocol,phase){
      const id=`mail-${this.sim.run}-${++this.#sessionSerial}`,tls=new ModelTLS(this.sim.run*100+this.#sessionSerial,from);tls.ready=true;
      const session={id,from,to,protocol,phase,tls,index:0,requestSeq:1001,responseSeq:8001,lastRequest:null};this.#sessions.set(id,session);return session;
    }
    send(session,value,response=false){
      const s=this.sim,bytes=encoder.encode(JSON.stringify(value)),transfer=++this.#transfer,from=response?session.to:session.from,to=response?session.from:session.to;
      if(!this.net.nodes[from].on)return s.failure(`${this.net.nodes[from].name} je vypnutý.`,null,from);
      this.log(from,session,'out',value);
      const events=[];for(let offset=0;offset<bytes.length;offset+=CHUNK){
        const data={transfer,offset,length:bytes.length,bytes:Array.from(bytes.slice(offset,offset+CHUNK))},record=session.tls.seal('mail-chunk',data,to);
        const payload={record,mailSession:session.id};
        const kind=`${session.protocol.toLowerCase()}-${response?'response':'request'}`;
        const p=response?s.replyPacket(kind,session.lastRequest,payload):s.createPacket(kind,from,to,payload,{sport:session.phase==='relay'?52006:session.protocol==='SMTP'?51006:51007,dport:session.phase==='relay'?25:session.protocol==='SMTP'?465:993});
        p.connection=session.protocol.toLowerCase();p.label=`${session.protocol} · ${response?'odpověď':'požadavek'}${bytes.length>CHUNK?' '+(Math.floor(offset/CHUNK)+1)+'/'+Math.ceil(bytes.length/CHUNK):''}`;
        p.seq=session[response?'responseSeq':'requestSeq'];session[response?'responseSeq':'requestSeq']+=record.data.length;
        p.mailMeta={protocol:session.protocol,phase:session.phase,session:session.id,offset,total:bytes.length,partBytes:data.bytes.length};
        p.initialHeader=this.net.packetHeader(p);events.push({kind:'mail-part',node:from,packet:p,at:s.time+1+Math.floor(offset/CHUNK)*3,title:`${session.protocol} · příprava části ${Math.floor(offset/CHUNK)+1} / ${Math.ceil(bytes.length/CHUNK)}`,description:`${this.net.nodes[from].name} → ${this.net.nodes[to].name}. ${session.phase==='relay'?'Samostatné předání mezi poštovními servery.':session.protocol==='IMAP'?'Přístup ke schránce.':'Odeslání přes vlastní poštovní server.'}`});
      }s.next(events);
    }
    beginSMTP(relay=false){
      this.phase=relay?'relay':'submission';this.state.current.phase=this.phase;
      const e=this.entry;e.lastError='';if(relay)e.attempts++;
      const session=this.session(relay?e.origin:this.sim.clientId(),relay?e.destination:e.origin,'SMTP',this.phase);
      this.smtpCommand(session);
    }
    smtpCommand(session){
      const m=this.entry.message,from=m.source==='hacker'?'utocnik@posta.test':m.from;
      const commands=[
        {cmd:'MAIL',wire:`MAIL FROM:<${from}>`,say:'Chci odeslat e-mail. Toto je odesílatel.'},
        {cmd:'RCPT',wire:`RCPT TO:<${m.to}>`,say:'Zpráva je pro tuto adresu.'},
        {cmd:'DATA',wire:'DATA',say:'Mohu poslat obsah zprávy?'},
        {cmd:'CONTENT',wire:mailWire(m),say:'Tady je hlavička a obsah e-mailu.',message:structuredClone(m)}
      ];this.send(session,commands[session.index]);
    }
    imapCommand(session){
      const id=this.sim.clientId(),a=this.sim.action;
      if(a.type==='mail-seen'&&session.index>0){
        const m=this.state.boxes[id].find(m=>String(m.id)===String(a.payload.messageId));
        return this.send(session,{cmd:'STORE',wire:`A2 UID STORE ${m?.uid||0} +FLAGS (\\Seen)`,say:'Ulož příznak přečtení této zprávy.',messageId:a.payload.messageId});
      }
      this.send(session,session.index===0?{cmd:'SELECT',wire:'A1 SELECT INBOX',say:'Otevři mou doručenou schránku.'}:{cmd:'FETCH',wire:'A2 UID FETCH 1:* (FLAGS BODY.PEEK[])',say:'Pošli obsah a příznaky zpráv. Samotné načtení je neoznačí jako přečtené.'});
    }
    storeInbox(){
      const e=this.entry,m=e.message,box=this.state.boxes[m.target];
      if(!box.some(x=>x.id===m.id))box.push({...structuredClone(m),uid:box.length+1,seen:false});
      this.net.phishing.mailboxes[m.target]=m.id;
    }
    serverCommand(session,value,e){
      const s=this.sim;let reply;
      if(session.protocol==='SMTP'){
        const expected=['MAIL','RCPT','DATA','CONTENT'][session.index];if(value.cmd!==expected)throw new Error('SMTP: příkaz neodpovídá stavu rozhovoru.');
        if(value.cmd==='CONTENT'){
          const entry=this.entry;
          if(!value.message||value.message.id!==entry.message.id||value.message.target!==entry.message.target)throw new Error('SMTP: obsah nepatří této obálce.');
          entry.message=structuredClone(value.message);const m=entry.message;
          if(session.phase==='submission'){
            if(!entry.accepted){entry.accepted=true;entry.state='queued';this.state.queue.set(String(m.id),entry);this.net.phishing.messages.set(m.id,structuredClone(m));this.net.phishing.requests.set(m.id,true);}
            if(entry.origin===entry.destination){this.storeInbox();entry.state='delivered';}
          }else this.storeInbox();
          reply={cmd:'OK',wire:'250 2.0.0 Zpráva přijata',say:session.phase==='relay'||this.entry.origin===this.entry.destination?'Zpráva je uložená ve schránce na serveru.':'Zprávu jsem převzal do odchozí fronty.'};
        }else reply={cmd:'OK',wire:value.cmd==='DATA'?'354 Pošli obsah, ukonči jej tečkou':'250 2.1.0 OK',say:value.cmd==='MAIL'?'Odesílatele přijímám.':value.cmd==='RCPT'?'Adresu příjemce přijímám.':'Pošli hlavičku a obsah e-mailu.'};
      }else{
        const client=s.clientId(),box=this.state.boxes[client];
        if(session.to!==serverFor(client))throw new Error('IMAP účet nepatří tomuto serveru.');
        if(value.cmd==='SELECT')reply={cmd:'OK',wire:`* ${box.length} EXISTS\r\nA1 OK Schránka otevřena`,say:`Počet zpráv ve schránce: ${box.length}.`};
        else if(value.cmd==='FETCH')reply={cmd:'OK',wire:box.map((m,i)=>`* ${i+1} FETCH (UID ${m.uid} FLAGS (${m.seen?'\\Seen':''}) BODY[] {${encoder.encode(mailWire(m)).length}})`).join('\r\n')+'\r\nA2 OK Obsah zpráv odeslán',say:'Tady jsou zprávy uložené na serveru. Obsah e-mailů je součástí odpovědi; výpis ukazuje jejich UID, příznaky a délku.',items:structuredClone(box)};
        else if(value.cmd==='STORE'){
          const m=box.find(m=>String(m.id)===String(value.messageId));if(!m)throw new Error('IMAP: zpráva už ve schránce není.');m.seen=true;
          reply={cmd:'OK',wire:`* ${box.indexOf(m)+1} FETCH (UID ${m.uid} FLAGS (\\Seen))\r\nA2 OK Příznak \\Seen uložen`,say:'Příznak přečtení je uložen na serveru.',messageId:m.id};
        }else throw new Error('IMAP: neznámý příkaz.');
      }
      e.title=`${session.protocol} · server zpracoval příkaz`;e.description=reply.say;this.send(session,reply,true);
    }
    clientReply(session,value){
      const s=this.sim,c=this.net.phishing.clients[s.clientId()];
      if(session.protocol==='SMTP'){
        if(++session.index<4)return this.smtpCommand(session);
        const e=this.entry;e.clientAccepted=true;
        if(session.phase==='relay'||e.origin===e.destination){e.state='delivered';return this.completeSend();}
        this.phase='mx';this.state.current.phase='mx';
        if(c)Object.assign(c,{state:'ready',notice:'Tvůj server zprávu převzal. Následuje předání druhému poskytovateli.'});
        else this.net.phishing.hacker.notice='SMTP předalo zprávu tvému serveru. Následuje předání serveru příjemce.';
        if(!this.net.featureEnabled('dns'))return this.lookupMX();
        s.next([{kind:'mail-mx',node:e.origin,title:'Poštovní server hledá cílovou doménu',description:'Použije DNS záznam MX.'}]);
      }else if(session.index++===0)this.imapCommand(session);
      else if(s.action.type==='mail-seen'){
        for(const m of c.items)if(m.id===value.messageId)m.seen=true;if(c.inbox?.id===value.messageId)c.inbox.seen=true;
        Object.assign(c,{state:'ready',notice:'IMAP uložilo příznak přečtení na serveru.'});s.finish('IMAP · příznak přečtení uložen','Příznak schránky není automatické potvrzení odesílateli.',s.clientId());
      }else{
        const old=c.inbox?.id;c.items=value.items;c.inbox=c.items.at(-1)||null;c.opened=!!c.inbox&&c.inbox.id===old&&c.opened;
        Object.assign(c,{state:'ready',error:'',notice:`IMAP načetlo zprávy do zařízení. Počet: ${c.items.length}.`});s.finish('IMAP · obsah schránky dorazil do zařízení','Serverová schránka a místní kopie zpráv jsou samostatné.',s.clientId());
      }
    }
    completeSend(){
      const s=this.sim,c=this.net.phishing.clients[this.entry.message.source];
      if(c)Object.assign(c,{state:'ready',error:'',notice:'Zpráva je v modelu doručená do serverové schránky příjemce.'});
      if(this.entry.message.source==='hacker')Object.assign(this.net.phishing.hacker,{state:'ready',notice:'SMTP doručilo podvodný e-mail do schránky. Příjemce si jej načte přes IMAP.'});
      this.state.current.phase='delivered';s.finish('SMTP · zpráva dorazila do schránky','Příjemce nemusí mít zapnuté zařízení. IMAP si obsah načte samostatným přenosem.',this.entry.destination);
    }
    open(device,id){const c=this.net.phishing.clients[device],m=c.items.find(m=>String(m.id)===String(id));if(!m)return false;c.inbox=m;c.opened=true;return true;}
    handle(e){
      const s=this.sim;
      if(e.kind==='mail-part'){s.next([s.originate(e.packet)]);return;}
      if(e.kind==='mail-prepare'){
        if(s.action.type==='mail-retry'){this.phase='mx';this.state.current.phase='mx';return this.lookupMX();}
        const id=s.clientId();if(!this.net.nodes[id].on||!this.net.accessReady(id))return s.failure(`${this.net.nodes[id].name} nemá dostupné připojení.`,null,id);
        if(this.phase==='imap'){const session=this.session(id,serverFor(id),'IMAP','access');this.imapCommand(session);}else this.beginSMTP();return;
      }if(e.kind==='mail-mx')this.lookupMX();
    }
    lookupMX(){
      const s=this.sim,domain=domainOf(this.entry.message.to),cached=this.state.mxCache[this.entry.origin+':'+domain];
      if(!this.net.featureEnabled('dns')){
        const prepared=this.net.mailMXRecords[domain];
        if(!prepared)return s.failure('Pro doménu příjemce není připravený poštovní server.',null,this.entry.origin);
        this.entry.destination=prepared.server;return this.beginSMTP(true);
      }
      if(cached){this.entry.destination=cached.server;return this.beginSMTP(true);}
      const p=s.createPacket('dns-query',this.entry.origin,'dns',{name:domain,type:'MX'},{sport:53006,dport:53,connection:'mail-dns',label:'DNS · MX pro poštu'});s.next([s.originate(p)]);
    }
    receive(p,e){
      const s=this.sim;
      try{
        if(p.connection==='mail-dns'){
          if(p.kind==='dns-query'){
            const answer=this.net.mailMXRecords[p.payload.name];if(!answer)throw new Error('DNS nemá MX pro doménu příjemce.');
            const q=s.replyPacket('dns-response',p,{name:p.payload.name,type:'MX',exchange:answer.exchange,preference:10,answer:answer.address,server:answer.server});q.connection='mail-dns';q.label='DNS · MX a přidružený záznam A';s.next([s.originate(q)]);
            e.description=`MX ${p.payload.name} → ${answer.exchange}; přidružený A → ${answer.address}.`;
          }else{this.state.mxCache[this.entry.origin+':'+p.payload.name]={server:p.payload.server};this.entry.destination=p.payload.server;this.beginSMTP(true);}return;
        }
        const session=this.#sessions.get(p.payload.mailSession);if(!session)throw new Error('Poštovní spojení už není platné.');
        const response=p.kind.endsWith('response'),receiver=response?session.from:session.to;
        if(p.destination!==receiver)throw new Error('Poštovní data dorazila jinému konci spojení.');
        const part=session.tls.open(p.payload.record,receiver,'mail-chunk'),key=session.id+':'+part.transfer;
        let buffer=this.#buffers.get(key);if(!buffer){buffer={length:part.length,chunks:new Map()};this.#buffers.set(key,buffer);}
        if(part.length!==buffer.length||part.offset<0||part.offset+part.bytes.length>buffer.length)throw new Error('Neplatná část poštovního přenosu.');
        buffer.chunks.set(part.offset,new Uint8Array(part.bytes));if([...buffer.chunks.values()].reduce((n,b)=>n+b.length,0)!==buffer.length)return;
        const bytes=new Uint8Array(buffer.length);let contiguous=0;for(const [at,b] of [...buffer.chunks].sort((a,b)=>a[0]-b[0])){if(at!==contiguous)throw new Error('Poštovní přenos nemá souvislé bajty.');bytes.set(b,at);contiguous+=b.length;}
        this.#buffers.delete(key);const value=JSON.parse(decoder.decode(bytes));this.log(receiver,session,'in',value);
        if(response)this.clientReply(session,value);else{session.lastRequest={...p};this.serverCommand(session,value,e);}
      }catch(error){s.failure(error.message,p,e.node);}
    }
    failure(reason){
      const s=this.sim,c=this.net.phishing.clients[s.action.type==='mail-retry'?this.entry.message.source:s.clientId()];
      if(this.entry?.accepted&&['mx','relay','retry'].includes(this.phase)){
        this.entry.state='queued';this.entry.lastError=reason;this.state.current.phase='queued';
        if(c)Object.assign(c,{state:'ready',notice:'Tvůj server drží zprávu ve frontě.',error:''});
        if(s.action.type==='phish-send')Object.assign(this.net.phishing.hacker,{state:'ready',notice:'E-mail čeká ve frontě poštovního serveru.'});
        s.wait('SMTP · zpráva čeká ve frontě',reason+' Server ji uchoval. Pozdější doručení spusť v jeho okně.',this.entry.origin);return true;
      }
      if(c)Object.assign(c,{state:'error',error:reason});
      if(s.action.type==='phish-send')Object.assign(this.net.phishing.hacker,{state:'error',notice:reason+' Pokud server zprávu už převzal, zůstává u něj.'});return false;
    }
  }
  Object.assign(globalThis.InternetLab,{MailScenario,mailServerFor:serverFor,mailWire});
})();
