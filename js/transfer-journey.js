/* Presentation lifecycle only; packet creation and model stepping stay in Simulation. */
(() => {
  'use strict';
  class TransferJourney {
    constructor({onMinimize=()=>{},onRestore=()=>{},onClear=()=>{},setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),departure=500,arrival=700}={}) {
      Object.assign(this,{onMinimize,onRestore,onClear,setTimer,clearTimer,departure,arrival});
      this.current=null;this.departTimer=null;this.returnTimer=null;
    }
    begin(sim,info) {
      this.clear();const context=this.current={...info,run:sim.run,phase:'departing'};
      this.departTimer=this.setTimer(()=>{this.departTimer=null;if(this.current===context)this.minimize();},this.departure);
      return context;
    }
    minimize() {
      if(!this.current)return;
      this.clearTimer(this.departTimer);this.departTimer=null;this.current.phase='map';this.onMinimize(this.current);
    }
    expand() {
      if(!this.current)return;
      this.clearTimer(this.departTimer);this.departTimer=null;this.current.phase='expanded';return this.current;
    }
    browse() {
      if(!this.current)return;
      this.clearTimer(this.departTimer);this.departTimer=null;this.current.phase='map';
    }
    observe(sim,{blocked=false,sourceOn=true}={}) {
      const context=this.current;if(!context)return;
      if(sim.run!==context.run||!sourceOn||sim.status==='cancelled'){this.clear();return;}
      const result=sim.replicaResult||{status:sim.status,current:sim.current};
      if(result.status==='running'){this.clearTimer(this.returnTimer);this.returnTimer=null;return;}
      if(blocked){this.clearTimer(this.returnTimer);this.returnTimer=null;return;}
      if(this.returnTimer!==null)return;
      this.returnTimer=this.setTimer(()=>{
        this.returnTimer=null;if(this.current!==context)return;
        this.clear();this.onRestore(context,result);
      },this.arrival);
    }
    clear() {
      this.clearTimer(this.departTimer);this.clearTimer(this.returnTimer);this.departTimer=null;this.returnTimer=null;
      const previous=this.current;this.current=null;if(previous)this.onClear(previous);
    }
  }
  function transferCaption(sim) {
    const a=sim.action||{},p=a.payload||{};
    if(a.type==='web')return p.authOp?'Ověřuji přihlášení':p.privacyOp?'Načítám údaje ze serveru':p.method==='POST'?'Odesílám formulář':sim.webHost?.()==='knihovna.test'?'Načítám knihovnu':'Načítám webovou stránku';
    if(a.type==='cloud')return ({upload:'Nahrávám soubor',download:'Stahuji soubor',permissions:'Ukládám sdílení',list:'Načítám soubory z cloudu'})[p.request?.op]||'Pracuji s cloudem';
    if(a.type==='message')return ['read','connect-read'].includes(sim.phase)?'Posílám potvrzení přečtení':p.messageType==='image'?'Posílám obrázek':p.messageType==='video'?'Posílám video':'Posílám zprávu';
    return ({print:'Posílám dokument do tiskárny',chatbot:'Čekám na odpověď chatbota','mail-send':'Posílám e-mail','phish-send':'Posílám e-mail','mail-check':'Načítám poštu','mail-seen':'Ukládám přečtení zprávy','phish-results':'Načítám záznamy serveru',replicate:'Kopíruji data mezi servery'})[a.type]||'Přenos v síti';
  }
  Object.assign(globalThis.InternetLab,{TransferJourney,transferCaption});
})();
