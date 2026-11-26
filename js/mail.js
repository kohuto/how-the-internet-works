/* Local Gmail model: one request/reply, optionally protected by TLS, per SMTP submission or IMAP
   operation. No real mail, sockets or credentials are used. */
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
      if(type==='phish-send')return p.device==='hacker'&&PHISH_CLIENTS.includes(p.target)&&(p.subject===undefined||typeof p.subject==='string'&&p.subject.trim().length>0&&p.subject.length<=100)&&(p.body===undefined||typeof p.body==='string'&&p.body.trim().length>0&&p.body.length<=1200);
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
        const message=old?.message||(type==='phish-send'?this.readMessage(mailWire({...mailTemplate(p.target,p.messageId),...(typeof p.subject==='string'?{subject:p.subject.trim().replace(/[\r\n]/g,' ')}:{}),...(typeof p.body==='string'?{body:p.body,link:null}:{}),source:'hacker'})):{id:p.messageId,source:p.device,target:p.target,from:emailFor(p.device),fromName:this.net.nodes[p.device].name,to:emailFor(p.target),subject:p.subject.trim().replace(/[\r\n]/g,' '),body:p.body});
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
      const id=`mail-${this.sim.run}-${++this.#sessionSerial}`,tls=this.net.featureEnabled('tls')?new ModelTLS(this.sim.run*100+this.#sessionSerial,from):null;if(tls)tls.ready=true;
      const session={id,from,to,protocol,phase,tls,requestSeq:1001,responseSeq:8001,lastRequest:null};this.#sessions.set(id,session);return session;
    }
    encodePlain(session,value,response){
      if(session.protocol==='IMAP'&&response&&value.items){
        return encoder.encode(value.items.map((m,i)=>{
          const wire=mailWire(m);
          return `* ${i+1} FETCH (UID ${m.uid} FLAGS (${m.seen?'\\Seen':''}) BODY[] {${encoder.encode(wire).length}}\r\n${wire})\r\n`;
        }).join('')+'A1 OK Obsah zpráv odeslán');
      }
      return encoder.encode(value.wire);
    }
    readMessage(wire){
      const m=/^Message-ID: <([^<>]+)>\r\nFrom: ([^\r\n]+)\r\nTo: ([^\r\n]+)\r\nSubject: ([^\r\n]+)\r\n\r\n([\s\S]*)\r\n\.\r\n$/.exec(wire);
      if(!m)throw new Error('Neplatný formát přenášeného e-mailu.');
      const source=MAIL_CLIENTS.find(id=>emailFor(id)===m[2]),target=PHISH_CLIENTS.find(id=>emailFor(id)===m[3]),rawId=m[1].slice(0,m[1].lastIndexOf('@'));
      if(!source||!target||m[1]!==rawId+'@'+domainOf(m[2])||!(/^(?:mail-[1-9][0-9]*|[1-9][0-9]*)$/).test(rawId))throw new Error('Neplatná adresa nebo ID přenášeného e-mailu.');
      const id=/^[0-9]+$/.test(rawId)?Number(rawId):rawId,body=m[5].replace(/\r\n/g,'\n').replace(/^\.\./gm,'.');
      const message={id,source,target,from:m[2],fromName:source==='hacker'?mailTemplate(target,id).fromName:this.net.nodes[source].name,to:m[3],subject:m[4],body};
      if(source==='hacker'){
        const link=/\n\n([^\n]+)\n(https:\/\/knihovna-podpora\.test\/overeni\?zprava=[0-9]+)$/.exec(body);
        if(link)Object.assign(message,{body:body.slice(0,link.index),linkLabel:link[1],link:link[2]});
      }
      return message;
    }
    decodePlain(session,bytes,response){
      const text=decoder.decode(bytes),fail=()=>{throw new Error('Neplatná odpověď nebo příkaz poštovního přenosu.');};
      if(session.protocol==='SMTP'){
        if(!response)return {cmd:'CONTENT',message:this.readMessage(text),wire:text,say:'Přijatý e-mail.'};
        if(text!=='250 2.0.0 Zpráva přijata')return fail();
        return {cmd:'OK',wire:text,say:'E-mail je uložený ve schránce příjemce.'};
      }
      if(!response){
        if(text==='A1 UID FETCH 1:* (FLAGS BODY.PEEK[])')return {cmd:'FETCH',wire:text,say:'Pošli mi obsah doručené schránky.'};
        const store=/^A1 UID STORE ([1-9][0-9]*) \+FLAGS \(\\Seen\)$/.exec(text),m=store&&this.state.boxes[session.from].find(m=>m.uid===Number(store[1]));
        if(!m)return fail();
        return {cmd:'STORE',messageId:m.id,wire:text,say:'Označ tuto zprávu jako přečtenou.'};
      }
      if(this.sim.action.type==='mail-seen'){
        const store=/^\* [1-9][0-9]* FETCH \(UID ([1-9][0-9]*) FLAGS \(\\Seen\)\)\r\nA1 OK Příznak \\Seen uložen$/.exec(text),m=store&&this.net.phishing.clients[session.from].items.find(m=>m.uid===Number(store[1]));
        if(!m)return fail();
        return {cmd:'OK',messageId:m.id,wire:text,say:'Příznak přečtení je uložen na serveru.'};
      }
      const items=[];let position=0;
      while(bytes[position]===42){
        const end=bytes.indexOf(13,position);if(end<0||bytes[end+1]!==10)return fail();
        const line=decoder.decode(bytes.subarray(position,end)),m=/^\* [1-9][0-9]* FETCH \(UID ([1-9][0-9]*) FLAGS \((\\Seen)?\) BODY\[\] \{([0-9]+)\}$/.exec(line);
        if(!m)return fail();
        const start=end+2,after=start+Number(m[3]);
        if(after>bytes.length||decoder.decode(bytes.subarray(after,after+3))!==')\r\n')return fail();
        items.push({...this.readMessage(decoder.decode(bytes.subarray(start,after))),uid:Number(m[1]),seen:!!m[2]});position=after+3;
      }
      if(decoder.decode(bytes.subarray(position))!=='A1 OK Obsah zpráv odeslán')return fail();
      return {cmd:'OK',items,wire:text,say:'Posílám zprávy uložené ve tvé schránce.'};
    }
    send(session,value,response=false){
      const s=this.sim,bytes=session.tls?encoder.encode(JSON.stringify(value)):this.encodePlain(session,value,response),transfer=++this.#transfer,from=response?session.to:session.from,to=response?session.from:session.to;
      if(!this.net.nodes[from].on)return s.failure(`${this.net.nodes[from].name} je vypnutý.`,null,from);
      this.log(from,session,'out',value);
      const sequence=response?'responseSeq':'requestSeq',firstSeq=session[sequence],events=[];
      const purpose=session.protocol==='SMTP'?(response?'potvrzení přijetí':'e-mail'):this.sim.action.type==='mail-seen'?(response?'potvrzení přečtení':'označení přečtení'):(response?'zprávy ze schránky':'žádost o zprávy');
      const parts=[];
      for(let position=0;position<bytes.length;){
        let end=Math.min(position+CHUNK,bytes.length);
        // Keep a complete UTF-8 character in each readable part. TCP still uses byte SEQ.
        if(!session.tls)while(end<bytes.length&&(bytes[end]&0xc0)===0x80)end--;
        parts.push(bytes.slice(position,end));position=end;
      }
      for(const [index,chunk] of parts.entries()){
        const data={transfer,length:bytes.length,bytes:Array.from(chunk)};
        const payload=session.tls?{record:session.tls.seal('mail-chunk',data,to),mailSession:session.id}:{bytes:chunk,mailPart:{transfer,length:bytes.length},mailSession:session.id};
        const kind=`${session.protocol.toLowerCase()}-${response?'response':'request'}`;
        const p=response?s.replyPacket(kind,session.lastRequest,payload):s.createPacket(kind,from,to,payload,{sport:session.protocol==='SMTP'?51006:51007,dport:session.protocol==='SMTP'?(session.tls?465:587):(session.tls?993:143)});
        p.connection=session.protocol.toLowerCase();p.label=`${session.protocol} · ${purpose}${parts.length>1?' '+(index+1)+'/'+parts.length:''}`;
        p.seq=session[sequence];session[sequence]=(session[sequence]+(payload.record?.data.length||chunk.length))>>>0;
        p.mailMeta={protocol:session.protocol,phase:session.phase,session:session.id,seq:p.seq,total:bytes.length,partBytes:data.bytes.length};
        p.initialHeader=this.net.packetHeader(p);events.push({kind:'mail-part',node:from,packet:p,at:s.time+1+index*s.packetGap(from,to),title:`${session.protocol} · ${purpose}${parts.length>1?` · část ${index+1} / ${parts.length}`:''}`,description:`${this.net.nodes[from].name} → ${this.net.nodes[to].name}. ${session.protocol==='IMAP'?'Přístup ke schránce.':'Odeslání přes společný server Gmailu.'}`});
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
      const m=this.entry.message;
      this.send(session,{cmd:'CONTENT',wire:mailWire(m),say:'Odesílám e-mail s adresou odesílatele, příjemce a obsahem zprávy.',message:structuredClone(m)});
    }
    imapCommand(session){
      const id=this.sim.clientId(),a=this.sim.action;
      if(a.type==='mail-seen'){
        const m=this.state.boxes[id].find(m=>String(m.id)===String(a.payload.messageId));
        return this.send(session,{cmd:'STORE',wire:`A1 UID STORE ${m?.uid||0} +FLAGS (\\Seen)`,say:'Označ tuto zprávu jako přečtenou.',messageId:a.payload.messageId});
      }
      this.send(session,{cmd:'FETCH',wire:'A1 UID FETCH 1:* (FLAGS BODY.PEEK[])',say:'Pošli mi obsah doručené schránky.'});
    }
    storeInbox(){
      const e=this.entry,m=e.message,box=this.state.boxes[m.target];
      if(!box.some(x=>x.id===m.id))box.push({...structuredClone(m),uid:box.length+1,seen:false});
      this.net.phishing.mailboxes[m.target]=m.id;
    }
    serverCommand(session,value,e){
      const s=this.sim;let reply;
      if(session.protocol==='SMTP'){
        const entry=this.entry;
        if(value.cmd!=='CONTENT'||!value.message||value.message.id!==entry.message.id||value.message.target!==entry.message.target)throw new Error('SMTP: zpráva neodpovídá připravenému odeslání.');
        entry.message=structuredClone(value.message);const m=entry.message;
        if(!entry.accepted){entry.accepted=true;this.state.deliveries.set(String(m.id),entry);this.net.phishing.messages.set(m.id,structuredClone(m));this.net.phishing.requests.set(m.id,true);}
        this.storeInbox();entry.state='delivered';
        reply={cmd:'OK',wire:'250 2.0.0 Zpráva přijata',say:'E-mail je uložený ve schránce příjemce.'};
      }else{
        const client=s.clientId(),box=this.state.boxes[client];
        if(session.to!==serverFor(client))throw new Error('IMAP účet nepatří tomuto serveru.');
        if(value.cmd==='FETCH'&&s.action.type==='mail-check')reply={cmd:'OK',wire:box.map((m,i)=>`* ${i+1} FETCH (UID ${m.uid} FLAGS (${m.seen?'\\Seen':''}) BODY[] {${encoder.encode(mailWire(m)).length}})`).join('\r\n')+'\r\nA1 OK Obsah zpráv odeslán',say:'Posílám zprávy uložené ve tvé schránce.',items:structuredClone(box)};
        else if(value.cmd==='STORE'&&s.action.type==='mail-seen'){
          const m=box.find(m=>String(m.id)===String(value.messageId));if(!m)throw new Error('IMAP: zpráva už ve schránce není.');m.seen=true;
          reply={cmd:'OK',wire:`* ${box.indexOf(m)+1} FETCH (UID ${m.uid} FLAGS (\\Seen))\r\nA1 OK Příznak \\Seen uložen`,say:'Příznak přečtení je uložen na serveru.',messageId:m.id};
        }else throw new Error('IMAP: neznámý příkaz.');
      }
      e.title=session.protocol==='SMTP'?'SMTP · e-mail uložen do schránky':s.action.type==='mail-seen'?'IMAP · zpráva označena jako přečtená':'IMAP · server odesílá zprávy';e.description=reply.say;this.send(session,reply,true);
    }
    clientReply(session,value){
      const s=this.sim,c=this.net.phishing.clients[s.clientId()];
      if(session.protocol==='SMTP'){
        this.entry.clientAccepted=true;return this.completeSend();
      }else if(s.action.type==='mail-seen'){
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
        const part=session.tls?session.tls.open(p.payload.record,receiver,'mail-chunk'):{...p.payload.mailPart,bytes:p.payload.bytes},key=session.id+':'+part.transfer;
        const buffer=this.#buffers.get(key);
        if(!buffer||part.length!==buffer.length)throw new Error('Neplatná část poštovního přenosu.');
        buffer.stream.receive(p.seq,session.tls?p.payload.record.data:p.payload.bytes);buffer.chunks.set(p.seq,new Uint8Array(part.bytes));
        if(!buffer.stream.complete)return;
        const bytes=new Uint8Array(buffer.length);let position=0;
        for(const [,data] of [...buffer.chunks].sort((a,b)=>((a[0]-buffer.stream.firstSeq)>>>0)-((b[0]-buffer.stream.firstSeq)>>>0))){bytes.set(data,position);position+=data.length;}
        if(position!==buffer.length)throw new Error('Poštovní přenos nemá souvislé bajty.');
        this.#buffers.delete(key);const value=session.tls?JSON.parse(decoder.decode(bytes)):this.decodePlain(session,bytes,response);this.log(receiver,session,'in',value);
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
