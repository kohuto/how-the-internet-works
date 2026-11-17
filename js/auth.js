/* Local authentication lesson: real PBKDF2, simulated HTTPS/server, memory only. */
(() => {
  'use strict';
  const {PRIVACY_OWNERS,webAddress}=globalThis.InternetLab;
  const encoder=new TextEncoder(),ITERATIONS=600000;
  const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const unhex=s=>Uint8Array.from(s.match(/../g),x=>parseInt(x,16));
  const random=length=>hex(crypto.getRandomValues(new Uint8Array(length)));
  const seeds=[
    ['alex','ctenar-1','32c896dc6d8e0d3506a1ee92a83921bd','ec61499bdc03c787dc5bab82e8dd70197475f9fc040a51569e552b1e6b74449f'],
    ['matej','ctenar-2','fb16ab2ae6af027d8e88c3641ed1d020','8c93fc4243101b8de1f3998865c9da08ba5b12434b887cce2c001d2f34474d85'],
    ['host','ctenar-3','9135499eaf6519c257b68df924c52ad1','2c98ed3be6838b5bfea979a43cd2ab8b06c0f3a782bf681f907536a5687864fc']
  ];
  async function passwordHash(password,salt,iterations=ITERATIONS){
    if(!globalThis.crypto?.subtle)throw new Error('Výpočet hesla vyžaduje Web Crypto. Otevři aplikaci v moderním prohlížeči přes localhost nebo HTTPS.');
    const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
    return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(salt),iterations},key,256)));
  }
  class AuthService {
    constructor(sim){
      this.sim=sim;this.net=sim.net;this.pending=null;
      this.state=this.net.server.auth={serial:3,accounts:new Map(),sessions:new Map(),clients:{},last:null};
      for(const [username,id,salt,hash] of seeds)this.state.accounts.set(username,{username,id,email:sim.privacy.state.accounts.get(id).profile.email,salt,hash,algorithm:'PBKDF2-HMAC-SHA-256',iterations:ITERATIONS});
      const signedIn=this.net.featureEnabled('cookies')&&this.net.featureEnabled('tls');
      for(const [device,id] of Object.entries(PRIVACY_OWNERS)){
        const account=[...this.state.accounts.values()].find(a=>a.id===id);
        if(signedIn)this.net.browserFor(device).cookies.session=this.cookie(this.issue(account));
        this.state.clients[device]={user:signedIn?this.publicUser(account):null,state:'ready',error:'',notice:signedIn?'Ukázkový účet je na začátku přihlášený. Odhlas se a vyzkoušej přihlášení nebo registraci.':''};
      }
      sim.privacy.auth=this;
    }
    publicUser(a){return a?{id:a.id,username:a.username}:null;}
    issue(a){const token=random(32);this.state.sessions.set(token,{account:a.id,username:a.username,created:this.net.cookieTime,expiresAt:this.net.cookieTime+3600});return token;}
    cookie(value){return {name:'library_session',value,domain:'knihovna.test',path:'/',secure:true,httpOnly:true,sameSite:'Lax',expiresAt:this.net.cookieTime+3600};}
    token(request){return /(?:^|;\s*)library_session=([a-f0-9]{64})(?:;|$)/.exec(request.cookie||'')?.[1];}
    account(request){const s=this.state.sessions.get(this.token(request));return s&&s.expiresAt>this.net.cookieTime?[...this.state.accounts.values()].find(a=>a.id===s.account):null;}
    validate(p){if(!this.net.featureEnabled('cookies')||!this.net.featureEnabled('tls'))return false;const a=webAddress(p.address);return !!this.state.clients[p.device||'laptop']&&a?.secure&&a.server==='web'&&['register','login','status','logout'].includes(p.authOp)&&(!['register','login'].includes(p.authOp)||(typeof p.username==='string'&&/^[a-z0-9_-]{3,24}$/.test(p.username)&&typeof p.password==='string'&&p.password.length>=4&&p.password.length<=80&&(p.authOp!=='register'||/^[^\s@]{1,40}@[^\s@]{1,40}\.test$/.test(p.email||''))));}
    begin(device){Object.assign(this.state.clients[device],{state:'loading',error:'',notice:'Požadavek čeká na doručení přes HTTPS. Heslo zpracuje až server.'});}
    response(status,op,message,account,setCookie){return {status,title:message,auth:{ok:status<400,op,message,user:this.publicUser(account)},...(setCookie?{setCookie}:{}),revision:0};}
    sessionLine(token){return `library_session=${token}; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax`;}
    revoke(request){this.state.sessions.delete(this.token(request));}
    beginServer(request,packet){
      const sim=this.sim,op=request.path.split('/').at(-1),a=this.account(request);
      const send=response=>this.send(response,packet);
      if(request.host!=='knihovna.test'||request.method!==(op==='status'?'GET':'POST')){send(this.response(400,op,'Neplatný požadavek na účet.'));return;}
      if(op==='status'){send(this.response(a?200:401,op,a?'Server ověřil cookie relace. Heslo nebylo odesláno.':'Přihlášení chybí nebo vypršelo.',a));return;}
      if(op==='logout'){this.revoke(request);send(this.response(200,op,'Server zrušil relaci. Prohlížeč ji odstraní po přijetí odpovědi.',null,'library_session=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax'));return;}
      let body;try{body=JSON.parse(request.message);}catch{send(this.response(400,op,'Neplatný formulář.'));return;}
      if(!this.validate({...body,authOp:op,device:sim.clientId(),address:'https://knihovna.test'})){send(this.response(400,op,'Použij fiktivní jméno, heslo o 4–80 znacích a e-mail s doménou .test.'));return;}
      const known=this.state.accounts.get(body.username);
      if(op==='register'&&known){send(this.response(409,op,'Toto uživatelské jméno už existuje.'));return;}
      const salt=op==='register'?random(16):(known||this.state.accounts.get('alex')).salt,iterations=op==='register'?ITERATIONS:known?.iterations||ITERATIONS;
      const task={run:sim.run,op,username:body.username,email:body.email,salt,iterations,known,request,packet,result:null,error:null};
      this.pending=task;this.state.last={op,username:task.username,phase:'hashing',salt,iterations,hash:null,storedHash:known?.hash||null,match:null};
      // Promise computes only. Account/session mutations await an explicit simulation step.
      task.promise=passwordHash(body.password,salt,iterations).then(hash=>{task.result=hash;},error=>{task.error=error.message;}).then(()=>{
        if(this.pending!==task||sim.run!==task.run||sim.status!=='running')return;
        sim.next([{kind:'auth-finish',node:'web',packet,title:op==='register'?'Server ukládá sůl a otisk hesla':'Server porovnává vypočtený otisk',description:'Výpočet je hotový. Další krok provede uložení nebo ověření na serveru.'}]);
        sim.onAsyncReady?.();
      });
    }
    get working(){return !!this.pending&&!this.pending.result&&!this.pending.error;}
    complete(){
      const t=this.pending;if(!t||t.run!==this.sim.run)return;
      this.pending=null;
      if(t.error){this.state.last.phase='error';this.send(this.response(503,t.op,t.error),t.packet);return;}
      Object.assign(this.state.last,{phase:'done',hash:t.result});
      if(t.op==='register'){
        if(this.state.accounts.has(t.username)){this.send(this.response(409,t.op,'Toto uživatelské jméno už existuje.'),t.packet);return;}
        const id=`ctenar-${++this.state.serial}`,account={id,username:t.username,email:t.email,salt:t.salt,hash:t.result,algorithm:'PBKDF2-HMAC-SHA-256',iterations:ITERATIONS};
        this.state.accounts.set(t.username,account);
        this.sim.privacy.state.accounts.set(id,{id,profile:{name:t.username,email:t.email,genres:'Zatím nevybrané'},visits:[],visitorIds:new Set(),collecting:true,erased:false,revision:0,hold:false,document:null});
        this.send(this.response(201,t.op,'Registrace dokončena. Na serveru je sůl a otisk, nikoli heslo. Nyní se přihlas.'),t.packet);
      }else{
        let difference=0;const stored=t.known?.hash||'0'.repeat(64);for(let i=0;i<64;i++)difference|=stored.charCodeAt(i)^t.result.charCodeAt(i);
        const match=!!t.known&&difference===0;this.state.last.match=match;
        if(!match){this.send(this.response(401,t.op,'Uživatelské jméno nebo heslo není správné.'),t.packet);return;}
        this.revoke(t.request);const token=this.issue(t.known);
        this.send(this.response(200,t.op,'Otisky se shodují. Server vytvořil novou přihlašovací relaci.',t.known,this.sessionLine(token)),t.packet);
      }
    }
    send(response,packet){this.sim.current.description=response.auth.message+' Zařízení teprve čeká na doručení této odpovědi.';response.bodyBytes=encoder.encode(JSON.stringify(response.auth)).length;this.sim.webReply=response;this.sim.next([{kind:'web-encrypt-response',node:'web',packet,title:'Server šifruje výsledek přihlášení',description:'Výsledek a případná Set-Cookie cestují zpět přes HTTPS. Zařízení je ještě nepřijalo.'}]);}
    receive(device,response){
      const c=this.state.clients[device],jar=this.net.browserFor(device).cookies,p=response.auth;
      if(response.setCookie){jar.lastReceived=response.setCookie;if(jar.allowed){if(p.op==='logout')jar.session=null;else jar.session=this.cookie(response.setCookie.split(';')[0].split('=')[1]);jar.receiveNote='Přihlašovací cookie byla přijata přes HTTPS.';}else jar.receiveNote='Přihlašovací cookie nebyla uložena: cookies jsou zakázané.';}
      Object.assign(c,{state:p.ok?'ready':'error',error:p.ok?'':p.message,notice:p.message});
      if(p.op!=='register'&&(p.ok||p.op==='status')){c.user=p.user;Object.assign(this.sim.privacy.state.clients[device],{snapshot:null,receipt:null,state:'idle',error:'',notice:'Načti údaje aktuálně přihlášeného účtu.'});}
      if(p.op==='login'&&p.ok&&!jar.allowed)c.notice+=' Cookie se neuložila; další požadavek nebude přihlášený.';
    }
    failure(device){this.cancel();Object.assign(this.state.clients[device],{state:'error',error:'Odpověď nedorazila. Změna už mohla na serveru proběhnout; ověř přihlášení novým požadavkem.'});}
    cancel(){this.pending=null;if(this.state.last?.phase==='hashing')this.state.last.phase='interrupted';}
  }
  Object.assign(globalThis.InternetLab,{AuthService,passwordHash,AUTH_ITERATIONS:ITERATIONS});
})();
