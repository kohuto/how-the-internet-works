/* Tabs keep documents; cookies and DNS belong to the device's browser. */
(() => {
  'use strict';
  const devices=['laptop','friend','phone','cabin','cafe'];
  const shared=new Set(['cookies','dnsCache']);
  const copy=value=>structuredClone(value);
  class BrowserNavigation {
    constructor(net) {
      this.net=net;this.serial=0;this.lastRun=-1;this.devices={};
      for(const device of devices) {
        const b=net.browserFor(device);
        const blank=Object.fromEntries(Object.entries(b).filter(([key])=>!shared.has(key)));
        Object.assign(blank,{address:'',content:null,state:'idle',error:'',tlsPhase:'idle',certificateVerified:false});
        this.devices[device]={blank:copy(blank),tabs:[],active:null,panel:null,networkOpen:false};
        this.add(device);
      }
    }
    normalize(value) {return globalThis.InternetLab.webAddress(value)?.url||value.trim();}
    state(device) {return this.devices[device];}
    active(device) {const s=this.state(device);return s.tabs.find(t=>t.id===s.active);}
    capture(device) {
      const tab=this.active(device),b=this.net.browserFor(device);
      if(tab)tab.document=copy(Object.fromEntries(Object.entries(b).filter(([key])=>!shared.has(key))));
    }
    restore(device,tab) {
      const b=this.net.browserFor(device);
      for(const key of Object.keys(b))if(!shared.has(key))delete b[key];
      Object.assign(b,copy(tab.document));
      this.state(device).active=tab.id;this.state(device).panel=null;
    }
    add(device,blocked=false) {
      const s=this.state(device);if(blocked||s.tabs.length>=8)return false;
      this.capture(device);
      const tab={id:++this.serial,url:'',draft:'',history:[],index:-1,page:'home',loadedUrl:'',run:null,document:copy(s.blank)};
      s.tabs.push(tab);this.restore(device,tab);return true;
    }
    select(device,id,blocked=false) {
      const s=this.state(device),tab=s.tabs.find(t=>t.id===Number(id));
      if(blocked||!tab||tab.id===s.active)return false;
      this.capture(device);this.restore(device,tab);return true;
    }
    close(device,id,blocked=false) {
      const s=this.state(device),index=s.tabs.findIndex(t=>t.id===Number(id));
      if(blocked||index<0)return false;
      const active=s.active===Number(id);this.capture(device);s.tabs.splice(index,1);
      if(!s.tabs.length){s.active=null;return this.add(device);}
      if(active)this.restore(device,s.tabs[Math.min(index,s.tabs.length-1)]);
      return true;
    }
    begin(device,address,{preserveView=false}={}) {
      const tab=this.active(device),url=this.normalize(address);
      if(tab.history[tab.index]!==url) {
        tab.history=tab.history.slice(0,tab.index+1);tab.history.push(url);
        if(tab.history.length>50)tab.history.shift();
        tab.index=tab.history.length-1;
      }
      tab.url=url;tab.draft=url;
      if(!preserveView)tab.page='home';
      this.state(device).panel=null;
    }
    travel(device,delta,blocked=false) {
      const tab=this.active(device),index=tab.index+delta;
      if(blocked||index<0||index>=tab.history.length)return null;
      tab.index=index;return tab.history[index];
    }
    sync(sim) {
      let started=null;
      if(sim.action?.type==='web'&&sim.run!==this.lastRun) {
        this.lastRun=sim.run;started=sim.clientId();
        const p=sim.action.payload;
        this.begin(started,p.address||'knihovna.test',{preserveView:!!(p.authOp||p.privacyOp||p.method==='POST'||p.browserReload)});
        this.active(started).run=sim.run;
      }
      for(const device of devices) {
        const b=this.net.browserFor(device),tab=this.active(device);
        if(b.state==='ready'&&b.content!==null)tab.loadedUrl=this.normalize(b.address);
      }
      return started;
    }
  }
  Object.assign(globalThis.InternetLab,{BrowserNavigation});
})();
