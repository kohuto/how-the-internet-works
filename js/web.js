/* Local HTTP cookie and TLS visibility teaching model, not cryptography.
   Plain application records stay at the endpoints; packets carry opaque model bytes. */
(() => {
  'use strict';
  const encoder=new TextEncoder();
  function webAddress(value='knihovna.test') {
    const fake=/^(?:(https?):\/\/)?knihovna-podpora\.test(?:\/(?:overeni)?)?(?:\?zprava=([1-9][0-9]*))?$/i.exec(value.trim());
    if(fake){const secure=fake[1]?.toLowerCase()==='https',messageId=Number(fake[2])||0;return {host:'knihovna-podpora.test',secure,server:'phish-web',path:'/overeni',messageId,url:`${secure?'https':'http'}://knihovna-podpora.test/overeni${messageId?'?zprava='+messageId:''}`};}
    const match=/^(https?):\/\/knihovna\.test\/?$/i.exec(value.trim())||/^(knihovna\.test)\/?$/i.exec(value.trim());
    return match?{host:'knihovna.test',server:'web',path:'/',secure:match[1].toLowerCase()==='https',url:`${match[1].toLowerCase()==='https'?'https':'http'}://knihovna.test/`}:null;
  }
  // Only the first-party visitor cookie of the model library is supported.
  // All state stays in memory, independently of the browser's real cookies.
  const WebCookies={
    expire(jar,now) {
      const count=jar.items.length;jar.items=jar.items.filter(c=>c.expiresAt>now);
      if(count!==jar.items.length)jar.receiveNote='Platnost cookie vypršela. Další požadavek ji už neodešle.';
    },
    header(jar,address,path,now) {
      this.expire(jar,now);
      const eligible=jar.items.filter(c=>c.domain===address.host&&(path===c.path||path.startsWith(c.path.endsWith('/')?c.path:c.path+'/')));
      const sent=jar.allowed?eligible.filter(c=>!c.secure||address.secure):[];
      jar.lastSent=sent.map(c=>`${c.name}=${c.value}`).join('; ');
      jar.sendNote=!jar.allowed?'Cookies jsou pro tento web zakázané.':jar.lastSent?'Prohlížeč připojil cookie k požadavku.':eligible.some(c=>c.secure&&!address.secure)?'Cookie má Secure. Přes HTTP ji prohlížeč neodešle.':'Pro tento požadavek není uložená platná cookie.';
      return jar.lastSent;
    },
    receive(jar,line,address,now) {
      if(!line)return false;
      this.expire(jar,now);jar.lastReceived=line;
      if(!jar.allowed){jar.receiveNote='Cookie nebyla uložena: cookies jsou pro tento web zakázané.';return false;}
      const [pair,...attributes]=line.split(';').map(x=>x.trim()),match=/^navstevnik=(v[1-9][0-9]*)$/.exec(pair);
      const attrs=Object.fromEntries(attributes.map(x=>{const at=x.indexOf('=');return at<0?[x.toLowerCase(),true]:[x.slice(0,at).toLowerCase(),x.slice(at+1)];}));
      if(!match||address.host!=='knihovna.test'||attrs.domain||(attrs.path&&attrs.path!=='/')){jar.receiveNote='Cookie byla odmítnuta: model přijímá jen cookie navstevnik pro knihovna.test a cestu /.';return false;}
      const secure=attrs.secure===true;
      if(!address.secure&&(secure||jar.items.some(c=>c.secure&&c.name==='navstevnik'&&c.domain===address.host))){jar.receiveNote=secure?'Cookie se Secure přišla přes HTTP, proto ji prohlížeč neuložil.':'HTTP nemůže přepsat dříve uloženou cookie se Secure.';return false;}
      const lifetime=Number(attrs['max-age']);if(!Number.isInteger(lifetime)||lifetime<=0){jar.receiveNote='Cookie nemá platnou modelovou dobu platnosti.';return false;}
      jar.items=jar.items.filter(c=>!(c.name==='navstevnik'&&c.domain===address.host&&c.path==='/'));
      jar.items.push({name:'navstevnik',value:match[1],domain:address.host,path:'/',secure,httpOnly:attrs.httponly===true,sameSite:attrs.samesite||'Lax',expiresAt:now+lifetime});
      jar.receiveNote='Cookie je uložená v tomto prohlížeči. Platnost se obnovila na jednu modelovou hodinu.';return true;
    },
    clear(jar) {jar.items=[];jar.receiveNote='Cookies byly smazány pouze v tomto prohlížeči. Záznamy na serveru zůstaly.';},
    respond(state,request,meta,now) {
      const value=(request.cookie||'').split(';').map(x=>x.trim()).find(x=>/^navstevnik=v[1-9][0-9]*$/.test(x))?.split('=')[1];
      let row=state.visitors.get(value);const returning=!!row;
      if(!row){row={id:`v${++state.serial}`,loads:0,requests:0,lastIp:'',lastProtocol:'',lastAt:now};state.visitors.set(row.id,row);}
      row.requests++;if(request.method==='GET')row.loads++;
      Object.assign(row,{lastIp:meta.sourceIp,lastProtocol:meta.secure?'HTTPS':'HTTP',lastAt:now});
      const line=`navstevnik=${row.id}; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax${state.secureOnly?'; Secure':''}`;
      state.last={setCookie:line,packetId:meta.packetId,id:row.id,received:request.cookie||'',returning,method:request.method,sourceIp:meta.sourceIp,secure:meta.secure};
      return {visitor:{id:row.id,loads:row.loads,requests:row.requests,returning},greeting:returning?'Vítej zpět! Server rozpoznal tento prohlížeč.':'Vítej! Server přidělil tomuto prohlížeči nový identifikátor.',setCookie:line};
    }
  };
  function requestText(p) {
    return `${p.method} ${p.path} HTTP/1.1\nHost: ${p.host||'knihovna.test'}${p.cookie?`\nCookie: ${p.cookie}`:''}${p.method==='POST'?`\nContent-Type: text/plain; charset=utf-8\nContent-Length: ${encoder.encode(p.message).length}\n\n${p.message}`:'\n'}`;
  }
  function responseBody(p) {
    return `${p.title}${p.greeting?`\n\n${p.greeting}\nIdentifikátor: ${p.visitor.id} · načtení stránky: ${p.visitor.loads}`:''}${p.receipt?`\n\nPřijatý vzkaz: ${p.receipt}`:''}`;
  }
  function responseText(p) {
    return `HTTP/1.1 ${p.status} OK\nCache-Control: no-store\nContent-Type: text/plain; charset=utf-8${p.setCookie?`\nSet-Cookie: ${p.setCookie}`:''}\n\n${responseBody(p)}`;
  }
  class ModelTLS {
    #records=new Map();
    constructor(run,client) {this.id=`tls-${run}`;this.client=client;this.ready=false;this.serial=0;}
    seal(kind,value,to) {
      const text=JSON.stringify(value),length=encoder.encode(kind==='request'?requestText(value):kind==='response'?responseText(value):text).length+16;
      const id=++this.serial,data=new Uint8Array(length);
      // Opaque, deterministic illustration. No XOR cipher or real-world security claim.
      let seed=(id*2654435761+length*97+Number(this.id.slice(4)))>>>0;
      for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed>>>24;}
      this.#records.set(id,{kind,to,text,data:data.slice()});
      return {session:this.id,id,data};
    }
    open(record,to,kind) {
      const saved=this.#records.get(record?.id);
      if(record?.session!==this.id||!saved||saved.to!==to||saved.kind!==kind||record.data.length!==saved.data.length||!record.data.every((b,i)=>b===saved.data[i]))throw new Error('Kontrola integrity TLS selhala. Data byla změněna nebo nepatří tomuto spojení.');
      if(['request','response'].includes(kind)&&!this.ready)throw new Error('Zabezpečené spojení ještě není ověřené.');
      return JSON.parse(saved.text);
    }
  }
  Object.assign(globalThis.InternetLab,{webAddress,requestText,responseText,responseBody,WebCookies,ModelTLS});
})();
