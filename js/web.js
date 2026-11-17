/* Local HTTP cookie and TLS visibility teaching model, not cryptography.
   Plain application records stay at the endpoints; packets carry opaque model bytes. */
(() => {
  'use strict';
  const encoder=new TextEncoder();
  function webAddress(value='knihovna.test') {
    const partner=/^(?:(https?):\/\/)?(obchod|zpravy)\.test\/?(?:\?tema=(cyklistika|hudba|cestovani))?$/i.exec(value.trim());
    if(partner){const secure=partner[1]?.toLowerCase()!=='http',server=partner[2].toLowerCase()==='obchod'?'shop':'news',host=partner[2].toLowerCase()+'.test',path=server==='shop'&&partner[3]?'/?tema='+partner[3].toLowerCase():'/';return {secure,server,host,path,url:`${secure?'https':'http'}://${host}${path}`};}
    const fake=/^(?:(https?):\/\/)?knihovna-podpora\.test(?:\/(?:overeni)?)?(?:\?zprava=([1-9][0-9]*))?$/i.exec(value.trim());
    if(fake){const secure=fake[1]?.toLowerCase()==='https',messageId=Number(fake[2])||0;return {host:'knihovna-podpora.test',secure,server:'phish-web',path:'/overeni',messageId,url:`${secure?'https':'http'}://knihovna-podpora.test/overeni${messageId?'?zprava='+messageId:''}`};}
    const match=/^(https?):\/\/knihovna\.test\/?$/i.exec(value.trim())||/^(knihovna\.test)\/?$/i.exec(value.trim());
    return match?{host:'knihovna.test',server:'web',path:'/',secure:match[1].toLowerCase()==='https',url:`${match[1].toLowerCase()==='https'?'https':'http'}://knihovna.test/`}:null;
  }
  // First-party visitor cookies and the separate secure library session cookie.
  // All state stays in memory, independently of the browser's real cookies.
  const WebCookies={
    expire(jar,now) {
      if(jar.session?.expiresAt<=now)jar.session=null;
      const count=jar.items.length;jar.items=jar.items.filter(c=>c.expiresAt>now);
      if(count!==jar.items.length)jar.receiveNote='Platnost cookie vypršela. Další požadavek ji už neodešle.';
    },
    header(jar,address,path,now) {
      this.expire(jar,now);
      const eligible=[...jar.items,...(jar.session&&jar.session.expiresAt>now?[jar.session]:[])].filter(c=>c.domain===address.host&&(path===c.path||path.startsWith(c.path.endsWith('/')?c.path:c.path+'/')));
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
    clear(jar) {jar.items=[];jar.session=null;jar.receiveNote='Cookies byly smazány pouze v tomto prohlížeči. Záznamy na serveru zůstaly.';},
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
    return `${p.method} ${p.path} HTTP/1.1\nHost: ${p.host||'knihovna.test'}${p.cookie?`\nCookie: ${p.cookie}`:''}${p.authorization?`\nAuthorization: ${p.authorization}`:''}${p.method==='POST'?`\nContent-Type: ${p.contentType||'text/plain; charset=utf-8'}\nContent-Length: ${encoder.encode(p.message).length}\n\n${p.message}`:'\n'}`;
  }
  function responseBody(p) {
    if(p.advertising)return JSON.stringify(p.advertising);
    if(p.partnerPage)return JSON.stringify({title:p.title,...p.partnerPage});
    if(p.auth)return JSON.stringify(p.auth);
    if(p.privacy)return JSON.stringify(p.privacy);
    if(p.document)return libraryHTML({...p.document,title:p.title},p);
    return `${p.title}${p.greeting?`\n\n${p.greeting}${p.visitor?`\nIdentifikátor: ${p.visitor.id} · načtení stránky: ${p.visitor.loads}`:''}`:''}${p.receipt?`\n\nPřijatý vzkaz: ${p.receipt}`:''}`;
  }
  function libraryHTML(page,response={}) {
    const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return `<!doctype html>\n<html lang="cs">\n<head><meta charset="utf-8"><title>${esc(page.brand)}</title></head>\n<body>\n<header>${esc(page.brand)}</header>\n<main>\n<p>${esc(page.kicker)}</p>\n<h1>${esc(page.title)}</h1>\n<p>${esc(page.description)}</p>\n</main>${response.greeting?`\n<p>${esc(response.greeting)}</p>`:''}${response.visitor?`\n<p>Identifikátor: ${esc(response.visitor.id)} · načtení stránky: ${esc(response.visitor.loads)}</p>`:''}${response.receipt?`\n<p>Přijatý vzkaz: ${esc(response.receipt)}</p>`:''}\n</body>\n</html>`;
  }
  function responseText(p) {
    return `HTTP/1.1 ${p.status} ${{200:'OK',201:'Created',400:'Bad Request',401:'Unauthorized',403:'Forbidden',409:'Conflict',503:'Service Unavailable'}[p.status]||'Response'}\nCache-Control: no-store\nContent-Type: ${p.document?'text/html':'text/plain'}; charset=utf-8${p.setCookie?`\nSet-Cookie: ${p.setCookie}`:''}\n\n${responseBody(p)}`;
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
  Object.assign(globalThis.InternetLab,{webAddress,requestText,responseText,responseBody,libraryHTML,WebCookies,ModelTLS});
})();
