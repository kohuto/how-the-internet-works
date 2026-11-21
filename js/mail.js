/* Local Gmail model: prepared TLS sessions, a short SMTP dialogue,
   IMAP snapshots and flags. No real mail, sockets or credentials are used. */
(() => {
  'use strict';
  const {ModelTLS,PHISH_CLIENTS,MAIL_CLIENTS,emailFor,mailTemplate}=globalThis.InternetLab;
  const encoder=new TextEncoder(),decoder=new TextDecoder(),CHUNK=192;
  const serverFor=()=>'mail';
  const fixedMailRecipient=device=>device==='laptop'?'friend':device==='friend'?'laptop':null;
  const domainOf=address=>address.split('@')[1];
  const mailWire=m=>`Message-ID: <${m.id}@${domainOf(m.from)}>\r\nFrom: ${m.from}\r\nTo: ${m.to}\r\nSubject: ${m.subject}\r\n\r\n${(m.body+(m.link?'\n\n'+m.linkLabel+'\n'+m.link:'')).replace(/\r?\n/g,'\r\n').replace(/^\./gm,'..')}\r\n.\r\n`;
  class MailScenario {
    #sessions=new Map();#buffers=new Map();#transfer=0;#sessionSerial=0;
    constructor(sim){
      this.sim=sim;this.net=sim.net;
      this.state=this.net.mail??={serial:0,boxes:Object.fromEntries(MAIL_CLIENTS.map(id=>[id,[]])),deliveries:new Map(),dialogue:[],current:null};
      for(const c of Object.values(this.net.phishing.clients)){c.items??=[];c.sent??=[];c.checked??=false;c.notice??='';}
      this.entry=null;this.phase='idle';
    }
    accepts(type){return ['mail-send','mail-check','mail-seen','phish-send'].includes(type);}
    validate(type,p){
      if(type==='phish-send')return p.device==='hacker'&&PHISH_CLIENTS.includes(p.target);
      if(!MAIL_CLIENTS.includes(p.device))return false;
      if(type==='mail-send')return p.device!=='hacker'&&PHISH_CLIENTS.includes(p.target)&&(!fixedMailRecipient(p.device)||p.target===fixedMailRecipient(p.device))&&typeof p.subject==='string'&&p.subject.trim().length>0&&p.subject.length<=100&&typeof p.body==='string'&&p.body.trim().length>0&&p.body.length<=1200;
      if(type==='mail-seen')return this.net.phishing.clients[p.device].items.some(m=>String(m.id)===String(p.messageId));
      return type==='mail-check';
    }
    start(type){
      const s=this.sim,a=s.action,p=a.payload,c=this.net.phishing.clients[s.clientId()];
      this.#sessions.clear();this.#buffers.clear();this.#transfer=0;this.#sessionSerial=0;this.entry=null;
      if(type==='mail-send'||type==='phish-send'){
        if(type==='phish-send')p.messageId??=++this.net.phishing.serial;else p.messageId??=`mail-${++this.state.serial}`;
        s.lastAction.payload.messageId=p.messageId;
        const old=this.state.deliveries.get(String(p.messageId));
        const message=old?.message||(type==='phish-send'?{...mailTemplate(p.target,p.messageId),source:'hacker'}:{id:p.messageId,source:p.device,target:p.target,from:emailFor(p.device),fromName:this.net.nodes[p.device].name,to:emailFor(p.target),subject:p.subject.trim().replace(/[\r\n]/g,' '),body:p.body});
        this.entry=old||{message,origin:serverFor(p.device),destination:serverFor(p.target),state:'new',accepted:false,clientAccepted:false};
        this.phase='submission';
        if(c)Object.assign(c,{state:'sending',error:'',notice:'SMTP připravuje odeslání zprávy.'});
      }else {this.phase='imap';Object.assign(c,{state:'loading',error:'',notice:type==='mail-check'?'IMAP načítá schránku.':'IMAP ukládá příznak přečtení.'});}
      this.state.current={run:s.run,device:s.clientId(),phase:this.phase,messageId:p.messageId||null};
      s.next([{kind:'mail-prepare',node:s.clientId(),title:this.phase==='imap'?'IMAP · přístup ke schránce':'SMTP · odesílání zprávy',description:'Přenos spusť krokováním nebo přehráním.'}]);
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
      const sequence=response?'responseSeq':'requestSeq',firstSeq=session[sequence],events=[];
      for(let position=0;position<bytes.length;position+=CHUNK){
        const data={transfer,length:bytes.length,bytes:Array.from(bytes.slice(position,position+CHUNK))},record=session.tls.seal('mail-chunk',data,to);
        const payload={record,mailSession:session.id};
        const kind=`${session.protocol.toLowerCase()}-${response?'response':'request'}`;
        const p=response?s.replyPacket(kind,session.lastRequest,payload):s.createPacket(kind,from,to,payload,{sport:session.protocol==='SMTP'?51006:51007,dport:session.protocol==='SMTP'?465:993});
        p.connection=session.protocol.toLowerCase();p.label=`${session.protocol} · ${response?'odpověď':'požadavek'}${bytes.length>CHUNK?' '+(Math.floor(position/CHUNK)+1)+'/'+Math.ceil(bytes.length/CHUNK):''}`;
        p.seq=session[sequence];session[sequence]=(session[sequence]+record.data.length)>>>0;
        p.mailMeta={protocol:session.protocol,phase:session.phase,session:session.id,seq:p.seq,total:bytes.length,partBytes:data.bytes.length};
        p.initialHeader=this.net.packetHeader(p);events.push({kind:'mail-part',node:from,packet:p,at:s.time+1+Math.floor(position/CHUNK)*s.packetGap(from,to),title:`${session.protocol} · příprava části ${Math.floor(position/CHUNK)+1} / ${Math.ceil(bytes.length/CHUNK)}`,description:`${this.net.nodes[from].name} → ${this.net.nodes[to].name}. ${session.protocol==='IMAP'?'Přístup ke schránce.':'Odeslání přes společný server Gmailu.'}`});
      }
      this.#buffers.set(session.id+':'+transfer,{length:bytes.length,stream:new globalThis.InternetLab.TCPReceiveStream(firstSeq,(session[sequence]-firstSeq)>>>0),chunks:new Map()});
      s.next(events);
    }
    beginSMTP(){
      this.phase='submission';this.state.current.phase=this.phase;
      const session=this.session(this.sim.clientId(),this.entry.origin,'SMTP',this.phase);
      this.smtpCommand(session);
    }
    smtpCommand(session){
      const m=this.entry.message,from=m.from;
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
          if(!entry.accepted){entry.accepted=true;this.state.deliveries.set(String(m.id),entry);this.net.phishing.messages.set(m.id,structuredClone(m));this.net.phishing.requests.set(m.id,true);}
          this.storeInbox();entry.state='delivered';
          reply={cmd:'OK',wire:'250 2.0.0 Zpráva přijata',say:'Zpráva je uložená ve schránce na společném serveru Gmailu.'};
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
        this.entry.clientAccepted=true;return this.completeSend();
      }else if(session.index++===0)this.imapCommand(session);
      else if(s.action.type==='mail-seen'){
        for(const m of c.items)if(m.id===value.messageId)m.seen=true;if(c.inbox?.id===value.messageId)c.inbox.seen=true;
        Object.assign(c,{state:'ready',notice:'IMAP uložilo příznak přečtení na serveru.'});s.finish('IMAP · příznak přečtení uložen','Příznak schránky není automatické potvrzení odesílateli.',s.clientId());
      }else{
        const old=c.inbox?.id;c.items=value.items;c.inbox=c.items.at(-1)||null;c.opened=!!c.inbox&&c.inbox.id===old&&c.opened;
        Object.assign(c,{state:'ready',checked:true,error:'',notice:`IMAP načetlo zprávy do zařízení. Počet: ${c.items.length}.`});s.finish('IMAP · obsah schránky dorazil do zařízení','Serverová schránka a místní kopie zpráv jsou samostatné.',s.clientId());
      }
    }
    completeSend(){
      const s=this.sim,c=this.net.phishing.clients[this.entry.message.source];
      if(c){if(!c.sent.some(m=>m.id===this.entry.message.id))c.sent.push(structuredClone(this.entry.message));Object.assign(c,{state:'ready',error:'',notice:'Zpráva je v modelu doručená do serverové schránky příjemce.'});}
      this.state.current.phase='delivered';s.finish('SMTP · zpráva dorazila do schránky','Příjemce nemusí mít zapnuté zařízení. IMAP si obsah načte samostatným přenosem.',this.entry.destination);
    }
    open(device,id){const c=this.net.phishing.clients[device],m=c.items.find(m=>String(m.id)===String(id));if(!m)return false;c.inbox=m;c.opened=true;return true;}
    handle(e){
      const s=this.sim;
      if(e.kind==='mail-part'){s.next([s.originate(e.packet)]);return;}
      if(e.kind==='mail-prepare'){
        const id=s.clientId();if(!this.net.nodes[id].on||!this.net.accessReady(id))return s.failure(`${this.net.nodes[id].name} nemá dostupné připojení.`,null,id);
        if(this.phase==='imap'){const session=this.session(id,serverFor(id),'IMAP','access');this.imapCommand(session);}else this.beginSMTP();return;
      }
    }
    receive(p,e){
      const s=this.sim;
      try{
        const session=this.#sessions.get(p.payload.mailSession);if(!session)throw new Error('Poštovní spojení už není platné.');
        const response=p.kind.endsWith('response'),receiver=response?session.from:session.to;
        if(p.destination!==receiver)throw new Error('Poštovní data dorazila jinému konci spojení.');
        const part=session.tls.open(p.payload.record,receiver,'mail-chunk'),key=session.id+':'+part.transfer;
        const buffer=this.#buffers.get(key);
        if(!buffer||part.length!==buffer.length)throw new Error('Neplatná část poštovního přenosu.');
        buffer.stream.receive(p.seq,p.payload.record.data);buffer.chunks.set(p.seq,new Uint8Array(part.bytes));
        if(!buffer.stream.complete)return;
        const bytes=new Uint8Array(buffer.length);let position=0;
        for(const [,data] of [...buffer.chunks].sort((a,b)=>((a[0]-buffer.stream.firstSeq)>>>0)-((b[0]-buffer.stream.firstSeq)>>>0))){bytes.set(data,position);position+=data.length;}
        if(position!==buffer.length)throw new Error('Poštovní přenos nemá souvislé bajty.');
        this.#buffers.delete(key);const value=JSON.parse(decoder.decode(bytes));this.log(receiver,session,'in',value);
        if(response)this.clientReply(session,value);else{session.lastRequest={...p};this.serverCommand(session,value,e);}
      }catch(error){s.failure(error.message,p,e.node);}
    }
    failure(reason){
      const s=this.sim,c=this.net.phishing.clients[s.clientId()];
      if(c)Object.assign(c,{state:'error',error:reason});
      return false;
    }
  }
  Object.assign(globalThis.InternetLab,{MailScenario,mailServerFor:serverFor,mailWire,fixedMailRecipient});
})();
