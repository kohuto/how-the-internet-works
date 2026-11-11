/* Isolated IPv4 model: Ethernet, bridged Wi-Fi and a schematic cellular bearer. No real network requests. */
(() => {
  'use strict';
  const HOME = '192.168.10.0/24', DC = '203.0.113.0/26', IG = '203.0.113.64/26', CLOUD = '203.0.113.128/26', REPLICA = '203.0.113.192/26', FRIEND = '172.16.20.0/24', MOBILE = '198.51.100.0/24';
  const VPN='192.0.2.128/27', CABIN='192.168.30.0/24', SAT_WAN='192.0.2.52/30', HACKER='192.168.40.0/24', PHISH='192.0.2.160/27', CAFE='192.168.50.0/24';
  const browserState=()=>({content:null,revision:null,state:'idle',error:'',dnsCache:{},address:'knihovna.test',secure:false,loadedSecure:false,tlsPhase:'idle',certificateVerified:false,receipt:'',visitor:null,greeting:'',cookies:{allowed:true,items:[],lastSent:'',lastReceived:'',sendNote:'Zatím žádný webový požadavek.',receiveNote:'Zatím žádná odpověď s cookie.'}});
  const CHATBOT_REPLY='Ahoj! Tvůj dotaz dorazil na server. Tady jsem připravil tuto odpověď a poslal ji přes síť zpět do tvého zařízení.';
  const MAC = {laptop:'02:00:00:00:10:10', printer:'02:00:00:00:10:20', home:'02:00:00:00:10:01', dc:'02:00:00:00:20:01', dns:'02:00:00:00:20:53', web:'02:00:00:00:20:10',instagram:'02:00:00:00:20:80',friend:'02:00:00:00:30:10','friend-home':'02:00:00:00:30:01'};
  const nodeDefinitions = [
    ['cabin','Notebook na chatě','host',150,40,'192.168.30.10','02:00:00:00:90:10','cabin'],
    ['cabin-switch','Switch na chatě','switch',245,140,null,null,'cabin'],
    ['cabin-ap','Wi-Fi Chata','ap',235,-60,null,null,'cabin'],
    ['cabin-router','Router na chatě','router',390,95,'192.168.30.1','02:00:00:00:90:01','cabin'],
    ['sat-terminal','Satelitní anténa','terminal',510,-70,null,null,'satellite'],
    ['sat-leo','Satelit LEO','satellite',680,-420,null,null,'satellite'],
    ['sat-gateway','Pozemní stanice','router',900,-70,null,null,'satellite'],
    ['laptop','Notebook','host',150,420,'192.168.10.10',MAC.laptop,'home'],
    ['printer','Tiskárna','host',150,590,'192.168.10.20',MAC.printer,'home'],
    ['switch','Domácí switch','switch',300,500,null,null,'home'],
    ['home','Domácí router','router',425,500,'192.168.10.1',MAC.home,'home'],
    ['edge','Router A','router',560,500,null,null,'city'],
    ['north','Router B','router',705,300,null,null,'city'],
    ['south','Router C','router',705,625,null,null,'city'],
    ['dc','Router D','router',890,500,null,null,'city'],
    ['dc-switch','Switch hostingu','switch',1100,270,null,null,'dc'],
    ['dns','DNS server','host',1230,190,'203.0.113.53',MAC.dns,'dc'],
    ['web','Webový server','host',1230,345,'203.0.113.10',MAC.web,'dc'],
    ['chatbot','Chatbot · server','host',1100,155,'203.0.113.30','02:00:00:00:20:30','dc'],
    ['instagram','Instagram','host',1710,270,'203.0.113.80',MAC.instagram,'instagram'],
    ['peer','Router E','router',1320,520,null,null,'peer'],
    ['friend-home','Matějův router','router',1880,640,'172.16.20.1',MAC['friend-home'],'friend'],
    ['friend-switch','Matějův switch','switch',2040,640,null,null,'friend'],
    ['friend','Matějův notebook','host',2170,530,'172.16.20.10',MAC.friend,'friend'],
    ['ap','Wi-Fi Lipová','ap',305,355,null,null,'home'],
    ['friend-ap','Wi-Fi u Matěje','ap',1990,490,null,null,'friend'],
    ['phone','Tvůj telefon','host',390,625,'198.51.100.10',null,'home'],
    ['bts-lipova','BTS Lipová','bts',245,880,null,null,'mobile'],
    ['bts-park','BTS Park','bts',550,950,null,null,'mobile'],
    ['mobile-core','Síť operátora','router',780,880,'198.51.100.1','02:00:00:00:40:01','mobile'],
    ['cloud','Cloud A · hlavní','host',1230,870,'203.0.113.140','02:00:00:00:60:14','cloud'],
    ['hosting-router','Router hostingu','router',950,270,'203.0.113.1',MAC.dc,'dc'],
    ['ig-router','Router Instagramu','router',1430,270,'203.0.113.65','02:00:00:00:50:01','instagram'],
    ['ig-switch','Switch Instagramu','switch',1570,270,null,null,'instagram'],
    ['cloud-router','Router cloudu A','router',950,870,'203.0.113.129','02:00:00:00:60:01','cloud'],
    ['cloud-switch','Switch cloudu A','switch',1100,870,null,null,'cloud'],
    ['replica-router','Router cloudu B','router',1430,870,'203.0.113.193','02:00:00:00:70:01','replica'],
    ['replica-switch','Switch cloudu B','switch',1570,870,null,null,'replica'],
    ['vpn-router','Router VPN','router',1430,1240,'192.0.2.129','02:00:00:00:80:01','vpn'],
    ['vpn-switch','Switch VPN','switch',1570,1240,null,null,'vpn'],
    ['vpn','VPN server','host',1710,1240,'192.0.2.130','02:00:00:00:80:30','vpn'],
    ['hacker','Počítač útočníka','host',2170,1190,'192.168.40.10','02:00:00:00:a0:10','hacker'],
    ['hacker-switch','Switch doupěte','switch',2040,1310,null,null,'hacker'],
    ['hacker-router','Router doupěte','router',1880,1310,'192.168.40.1','02:00:00:00:a0:01','hacker'],
    ['phish-router','Router cizího hostingu','router',1880,-50,'192.0.2.161','02:00:00:00:b0:01','phish'],
    ['phish-switch','Switch cizího hostingu','switch',2040,-50,null,null,'phish'],
    ['phish-web','Podvodný web','host',2170,-50,'192.0.2.170','02:00:00:00:b0:10','phish'],
    ['mail','Poštovní server','host',1100,450,'203.0.113.40','02:00:00:00:20:40','dc'],
    ['cafe','Notebook hosta','host',180,1300,'192.168.50.10','02:00:00:00:c0:10','cafe'],
    ['cafe-attacker','Útočník v kavárně','ap',440,1440,null,null,'cafe'],
    ['cafe-ap','Wi-Fi kavárny','ap',440,1190,null,null,'cafe'],
    ['cafe-router','Router kavárny','router',750,1300,'192.168.50.1','02:00:00:00:c0:01','cafe'],
    ['cloud-backup','Cloud B · kopie','host',1710,870,'203.0.113.204','02:00:00:00:70:20','replica']
  ];
  const linkDefinitions = [
    ['cabin-cable','cabin','cabin-switch','eth0','p1','Notebook — switch na chatě',null,{prefix:CABIN,device:'cabin',mode:'cable'}],
    ['cabin-wifi','cabin','cabin-ap','wlan0','wifi1','Notebook — Wi-Fi Chata',null,{prefix:CABIN,medium:'wifi',device:'cabin',mode:'wifi'}],
    ['cabin-ap-switch','cabin-ap','cabin-switch','eth0','p2','Wi-Fi Chata — switch',null,{prefix:CABIN}],
    ['cabin-lan','cabin-switch','cabin-router','p3','lan0','Switch — router na chatě',null,{prefix:CABIN}],
    ['cabin-wan','cabin-router','sat-terminal','wan0','ethernet','Router — satelitní anténa',['192.0.2.53',null,SAT_WAN],{medium:'satellite-access'}],
    ['sat-uplink','sat-terminal','sat-leo','radio','user','Anténa — satelit LEO',null,{prefix:SAT_WAN,medium:'satellite',requiresView:true,travelSteps:3}],
    ['sat-downlink','sat-leo','sat-gateway','gateway','radio','Satelit LEO — pozemní stanice',[null,'192.0.2.54',SAT_WAN],{medium:'satellite',travelSteps:3}],
    ['sat-internet','sat-gateway','north','wan0','eth3','Pozemní stanice — poskytovatel B',['192.0.2.57','192.0.2.58','192.0.2.56/30']],
    ['laptop-switch','laptop','switch','eth0','p1','Notebook — switch'],
    ['printer-switch','printer','switch','eth0','p2','Tiskárna — switch'],
    ['switch-home','switch','home','p3','lan0','Switch — domácí router'],
    ['uplink','home','edge','wan0','eth0','Přípojka bytu', ['192.0.2.1','192.0.2.2','192.0.2.0/30']],
    ['edge-north','edge','north','eth1','eth0','A — B · horní větev', ['192.0.2.5','192.0.2.6','192.0.2.4/30']],
    ['north-dc','north','dc','eth1','eth0','B — D · horní větev', ['192.0.2.9','192.0.2.10','192.0.2.8/30']],
    ['edge-south','edge','south','eth2','eth0','A — C · dolní větev', ['192.0.2.13','192.0.2.14','192.0.2.12/30']],
    ['south-dc','south','dc','eth1','eth1','C — D · dolní větev', ['192.0.2.17','192.0.2.18','192.0.2.16/30']],
    ['dc-access','dc','hosting-router','eth2','wan0','Přípojka hostingu',['192.0.2.33','192.0.2.34','192.0.2.32/30']],
    ['dns-switch','dc-switch','dns','p2','eth0','Hosting — DNS'],
    ['web-switch','dc-switch','web','p3','eth0','Hosting — web'],
    ['chatbot-switch','dc-switch','chatbot','p4','eth0','Hosting — chatbot'],
    ['instagram-switch','ig-switch','instagram','p2','eth0','Instagram — server',null,{prefix:IG}],
    ['north-peer','north','peer','eth2','eth0','Propojení poskytovatelů', ['192.0.2.21','192.0.2.22','192.0.2.20/30']],
    ['friend-uplink','peer','friend-home','eth1','wan0','Matějova přípojka', ['192.0.2.25','192.0.2.26','192.0.2.24/30']],
    ['friend-switch-home','friend-home','friend-switch','lan0','p1','Matějův router — switch'],
    ['friend-laptop-switch','friend-switch','friend','p2','eth0','Matějův notebook — switch',null,{device:'friend',mode:'cable'}],
    ['ap-switch','ap','switch','eth0','p4','Wi-Fi Lipová — switch',null,{prefix:HOME}],
    ['laptop-wifi','laptop','ap','wlan0','wifi1','Notebook — Wi-Fi Lipová',null,{prefix:HOME,medium:'wifi',device:'laptop',mode:'wifi'}],
    ['phone-wifi','phone','ap','wlan0','wifi2','Telefon — Wi-Fi Lipová',null,{prefix:HOME,medium:'wifi',device:'phone',mode:'wifi'}],
    ['friend-ap-switch','friend-ap','friend-switch','eth0','p3','Wi-Fi u Matěje — switch',null,{prefix:FRIEND}],
    ['friend-wifi','friend','friend-ap','wlan0','wifi1','Matějův notebook — Wi-Fi',null,{prefix:FRIEND,medium:'wifi',device:'friend',mode:'wifi'}],
    ['phone-bts-lipova','phone','bts-lipova','cell1','radio','Telefon — BTS Lipová',null,{prefix:MOBILE,medium:'cellular',device:'phone',mode:'cellular',tower:'bts-lipova'}],
    ['phone-bts-park','phone','bts-park','cell2','radio','Telefon — BTS Park',null,{prefix:MOBILE,medium:'cellular',device:'phone',mode:'cellular',tower:'bts-park'}],
    ['bts-lipova-core','bts-lipova','mobile-core','backhaul','mobile1','BTS Lipová — síť operátora',null,{prefix:MOBILE,medium:'backhaul'}],
    ['bts-park-core','bts-park','mobile-core','backhaul','mobile2','BTS Park — síť operátora',null,{prefix:MOBILE,medium:'backhaul'}],
    ['mobile-uplink','mobile-core','south','wan0','eth2','Operátor — internet',['192.0.2.30','192.0.2.29','192.0.2.28/30']],
    ['cloud-switch','cloud-switch','cloud','p2','eth0','Cloud A — server',null,{prefix:CLOUD}],
    ['hosting-lan','hosting-router','dc-switch','lan0','p1','Hosting — switch',null,{prefix:DC}],
    ['ig-uplink','peer','ig-router','eth2','wan0','Přípojka Instagramu',['192.0.2.37','192.0.2.38','192.0.2.36/30']],
    ['ig-lan','ig-router','ig-switch','lan0','p1','Instagram — switch',null,{prefix:IG}],
    ['cloud-uplink','dc','cloud-router','eth3','wan0','Přípojka cloudu A',['192.0.2.41','192.0.2.42','192.0.2.40/30']],
    ['cloud-lan','cloud-router','cloud-switch','lan0','p1','Cloud A — switch',null,{prefix:CLOUD}],
    ['replica-uplink','peer','replica-router','eth3','wan0','Přípojka cloudu B',['192.0.2.45','192.0.2.46','192.0.2.44/30']],
    ['replica-lan','replica-router','replica-switch','lan0','p1','Cloud B — switch',null,{prefix:REPLICA}],
    ['replica-server','replica-switch','cloud-backup','p2','eth0','Cloud B — server',null,{prefix:REPLICA}],
    ['vpn-uplink','peer','vpn-router','eth4','wan0','Přípojka VPN centra',['192.0.2.49','192.0.2.50','192.0.2.48/30']],
    ['vpn-lan','vpn-router','vpn-switch','lan0','p1','VPN centrum — switch',null,{prefix:VPN}],
    ['vpn-server','vpn-switch','vpn','p2','eth0','VPN centrum — server',null,{prefix:VPN}],
    ['hacker-cable','hacker','hacker-switch','eth0','p1','Počítač útočníka — switch',null,{prefix:HACKER,device:'hacker',mode:'cable'}],
    ['hacker-lan','hacker-switch','hacker-router','p2','lan0','Switch — router doupěte',null,{prefix:HACKER}],
    ['hacker-uplink','peer','hacker-router','eth5','wan0','Přípojka hackerského doupěte',['192.0.2.61','192.0.2.62','192.0.2.60/30']],
    ['phish-uplink','peer','phish-router','eth6','wan0','Přípojka cizího hostingu',['192.0.2.65','192.0.2.66','192.0.2.64/30']],
    ['phish-lan','phish-router','phish-switch','lan0','p1','Cizí hosting — switch',null,{prefix:PHISH}],
    ['phish-server','phish-switch','phish-web','p2','eth0','Cizí hosting — podvodný web',null,{prefix:PHISH}],
    ['cafe-wifi','cafe','cafe-ap','wlan0','wifi1','Host — Wi-Fi kavárny',null,{prefix:CAFE,medium:'wifi',device:'cafe',mode:'wifi',hotspot:'trusted'}],
    ['cafe-twin','cafe','cafe-attacker','wlan1','wifi1','Host — napodobená Wi-Fi',null,{prefix:CAFE,medium:'wifi',device:'cafe',mode:'wifi',hotspot:'rogue',attackOnly:true}],
    ['cafe-relay','cafe-attacker','cafe-ap','upstream','wifi2','Útočník — Wi-Fi kavárny',null,{prefix:CAFE,medium:'wifi',attackOnly:true}],
    ['cafe-lan','cafe-ap','cafe-router','eth0','lan0','Wi-Fi — router kavárny',null,{prefix:CAFE}],
    ['cafe-uplink','cafe-router','south','wan0','eth3','Přípojka kavárny',['192.0.2.69','192.0.2.70','192.0.2.68/30']],
    ['mail-switch','dc-switch','mail','p5','eth0','Hosting — poštovní server',null,{prefix:DC}]
  ];
  const ipv4 = ip => ip.split('.').reduce((n,b)=>(n*256 + Number(b))>>>0,0);
  const contains = (prefix,ip) => {
    const [net,bits] = prefix.split('/'); const shift = 32-Number(bits);
    return (ipv4(net)>>>shift) === (ipv4(ip)>>>shift);
  };
  class Network {
    constructor() {
      this.nodes = Object.fromEntries(nodeDefinitions.map(([id,name,type,x,y,ip,mac,region])=>[id,{id,name,type,x,y,ip,mac,region,on:true,interfaces:{},macTable:{},lastDecision:null}]));
      this.satellite={clearView:true};this.mitm={active:false,mode:'observe',logs:[],serial:0};
      this.access={cafe:{mode:'wifi',hotspot:'trusted'},hacker:{mode:'cable'},cabin:{mode:'wifi'},laptop:{mode:'cable'},friend:{mode:'cable'},phone:{mode:'cellular',tower:'bts-lipova'}};
      this.links = Object.fromEntries(linkDefinitions.map(([id,a,b,pa,pb,name,addresses,options={}],i)=> {
        if(id==='laptop-switch')options={...options,device:'laptop',mode:'cable'};
        const link={id,a,b,pa,pb,name,on:true,cost:1,medium:'cable',prefix:addresses?.[2]|| (this.nodes[a].region==='friend'?FRIEND:['laptop-switch','printer-switch','switch-home'].includes(id)?HOME:DC),...options};
        for (const [idx,node,port] of [[0,a,pa],[1,b,pb]]) {
          const n=this.nodes[node];
          const mac=n.mac && (!addresses) ? n.mac : `02:00:00:01:${(i+1).toString(16).padStart(2,'0')}:${(idx+1).toString(16).padStart(2,'0')}`;
          n.interfaces[port]={port,link:id,ip:addresses?.[idx] || n.ip,mac,prefix:link.prefix};
        }
        return [id,link];
      }));
      this.version=1;
      this.server={title:'Dnes otevřeno do 16 hodin',revision:1,certificate:{name:'knihovna.test',issuer:'Výuková certifikační autorita',trusted:true,valid:true},lastRequest:null};
      this.sender={text:'',content:null,sentBytes:0,sentPackets:0,state:'idle'};
      this.instagram={id:0,text:'',content:null,receivedPackets:0,sentBytes:0,sentPackets:0,state:'idle',totalBytes:0,receivedBytes:0,streamBytes:0,readRequested:false,readKnown:false,readNotified:false,error:'',senderDevice:'laptop'};
      this.friend={text:'',content:null,receivedPackets:0,state:'idle',receivedBytes:0,streamBytes:0,read:false,receipts:true,chatOpen:false};
      this.cookieTime=0;this.browser=browserState();this.phoneBrowser=browserState();this.cabinBrowser=browserState();this.friendBrowser=browserState();this.cafeBrowser=browserState();
      this.server.cookies={secureOnly:false,serial:0,visitors:new Map(),last:null};
      this.printer={count:0,document:'',state:'idle'};
      this.chatbot={serial:0,clients:Object.fromEntries(['laptop','friend','phone','cabin'].map(id=>[id,{turns:[]}])),server:{state:'idle',step:0,processed:0,prompt:'',answer:'',client:null,receivedBytes:0,totalBytes:0}};
      this.cloud=new globalThis.InternetLab.CloudStorage();
      this.nat={'cafe-router':{lan:CAFE,lanLink:'cafe-lan',wanLink:'cafe-uplink',rows:[],nextPort:40000},'hacker-router':{lan:HACKER,lanLink:'hacker-lan',wanLink:'hacker-uplink',rows:[],nextPort:40000},'cabin-router':{lan:CABIN,lanLink:'cabin-lan',wanLink:'cabin-wan',rows:[],nextPort:40000},home:{lan:HOME,lanLink:'switch-home',wanLink:'uplink',rows:[],nextPort:40000},'friend-home':{lan:FRIEND,lanLink:'friend-switch-home',wanLink:'friend-uplink',rows:[],nextPort:40000}};
      this.instagramChannels={};
      this.vpn={clients:Object.fromEntries(['laptop','friend','phone','cabin','hacker','cafe'].map((id,i)=>[id,{enabled:false,ip:`10.8.0.${10+i}`,port:54010+i,epoch:0,peer:null,path:[],sent:0,received:0}])),rows:[],nextPort:55000,sent:0,received:0,last:null};
      this.dnsRecords={'knihovna.test':'203.0.113.10','knihovna-podpora.test':'192.0.2.170'};
      this.applyAccess('cafe');this.applyAccess('hacker');this.applyAccess('cabin');this.applyAccess('laptop');this.applyAccess('friend');this.applyAccess('phone');
      this.recomputeRoutes();
    }
    peer(link,node) {return link.a===node?link.b:link.a;}
    port(link,node) {return link.a===node?link.pa:link.pb;}
    selectedAccess(link) {return (!link.attackOnly||this.mitm.active)&&(!link.device||(this.access[link.device].mode===link.mode&&(!link.tower||this.access[link.device].tower===link.tower)&&(!link.hotspot||this.access[link.device].hotspot===link.hotspot)));}
    isActive(link) {return !!link && link.on && this.selectedAccess(link) && (!link.requiresView||this.satellite.clearView) && this.nodes[link.a].on && this.nodes[link.b].on;}
    browserFor(id='laptop') {return id==='cafe'?this.cafeBrowser:id==='friend'?this.friendBrowser:id==='cabin'?this.cabinBrowser:id==='phone'?this.phoneBrowser:this.browser;}
    advanceCookieTime(seconds=3600) {if(!Number.isFinite(seconds)||seconds<0)return false;this.cookieTime+=seconds;for(const id of ['laptop','friend','phone','cabin','cafe'])globalThis.InternetLab.WebCookies.expire(this.browserFor(id).cookies,this.cookieTime);return true;}
    accessLink(id) {return this.adjacent(id).find(l=>l.device===id&&this.selectedAccess(l))||null;}
    accessReady(id) {return this.isActive(this.accessLink(id));}
    applyAccess(id) {
      const n=this.nodes[id],mode=this.access[id].mode;
      const profiles={cafe:{wifi:['192.168.50.10','02:00:00:00:c0:10']},hacker:{cable:['192.168.40.10','02:00:00:00:a0:10']},cabin:{cable:['192.168.30.10','02:00:00:00:90:10'],wifi:['192.168.30.11','02:00:00:00:90:11']},laptop:{cable:['192.168.10.10',MAC.laptop],wifi:['192.168.10.11','02:00:00:00:10:11']},friend:{cable:['172.16.20.10',MAC.friend],wifi:['172.16.20.11','02:00:00:00:30:11']},phone:{wifi:['192.168.10.30','02:00:00:00:10:30'],cellular:['198.51.100.10',null]}};
      if(profiles[id][mode])[n.ip,n.mac]=profiles[id][mode];
      for(const i of Object.values(n.interfaces)) {
        const l=this.links[i.link],profile=profiles[id][l.mode];
        if(profile){i.ip=profile[0];i.mac=profile[1];}
      }
    }
    setAccess(id,mode,tower=this.access[id]?.tower) {
      const allowed=id==='cafe'?['wifi','offline']:id==='hacker'?['cable','offline']:id==='phone'?['wifi','cellular','offline']:['cable','wifi','offline'];
      if(!this.access[id]||!allowed.includes(mode)||(id==='phone'&&!['bts-lipova','bts-park'].includes(tower)))return false;
      if(this.access[id].mode===mode&&this.access[id].tower===tower)return false;
      this.access[id]={mode,...(id==='phone'?{tower}:id==='cafe'?{hotspot:this.access.cafe.hotspot}:{})};this.applyAccess(id);this.changed();return true;
    }
    setCafeHotspot(hotspot) {
      if(!['trusted','rogue'].includes(hotspot)||this.access.cafe.mode==='wifi'&&this.access.cafe.hotspot===hotspot)return false;
      this.access.cafe={mode:'wifi',hotspot};this.applyAccess('cafe');this.changed();return true;
    }
    adjacent(id) {return Object.values(this.links).filter(l=>l.a===id||l.b===id);}
    iface(node,link) {return this.nodes[node].interfaces[this.port(link,node)];}
    shortest(from,to) {
      if (!this.nodes[from].on || !this.nodes[to].on) return null;
      const q=[[from]], seen=new Set([from]);
      while(q.length) {
        const path=q.shift(),at=path.at(-1); if(at===to)return path;
        for(const l of this.adjacent(at)) {
          const next=this.peer(l,at);
          if(this.isActive(l)&&['router','terminal','satellite'].includes(this.nodes[next].type)&&!seen.has(next)) {seen.add(next);q.push([...path,next]);}
        }
      }
      return null;
    }
    recomputeRoutes() {
      const domains=[{prefix:CAFE,router:'cafe-router',link:'cafe-lan',private:true},{prefix:'192.0.2.68/30',router:'south',link:'cafe-uplink'},{prefix:PHISH,router:'phish-router',link:'phish-lan'},{prefix:HACKER,router:'hacker-router',link:'hacker-lan',private:true},{prefix:'192.0.2.60/30',router:'peer',link:'hacker-uplink'},{prefix:CABIN,router:'cabin-router',link:'cabin-lan',private:true},{prefix:SAT_WAN,router:'sat-gateway',link:'sat-downlink'},{prefix:HOME,router:'home',link:'switch-home',private:true},{prefix:DC,router:'hosting-router',link:'hosting-lan'},{prefix:IG,router:'ig-router',link:'ig-lan'},{prefix:CLOUD,router:'cloud-router',link:'cloud-lan'},{prefix:REPLICA,router:'replica-router',link:'replica-lan'},{prefix:FRIEND,router:'friend-home',link:'friend-switch-home',private:true},{prefix:VPN,router:'vpn-router',link:'vpn-lan'},
        {prefix:'192.0.2.0/30',router:'edge',link:'uplink'},{prefix:'192.0.2.24/30',router:'peer',link:'friend-uplink'}];
      if(this.access.phone.mode==='cellular')domains.push({prefix:MOBILE,router:'mobile-core',link:`${this.access.phone.tower}-core`});
      for(const n of Object.values(this.nodes).filter(n=>n.type==='router')) {
        n.routes=[]; if(!n.on)continue;
        for(const d of domains) {
          if(d.private&&n.id!==d.router)continue;
          if(!this.isActive(this.links[d.link]))continue;
          if(d.prefix.endsWith('/30')&&this.adjacent(n.id).some(l=>l.prefix===d.prefix&&this.isActive(l)))continue;
          const path=this.shortest(n.id,d.router); if(!path)continue;
          const next=path.slice(1).find(id=>this.nodes[id].type==='router'); const l=path[1]?this.adjacent(n.id).find(l=>this.peer(l,n.id)===path[1]):this.links[d.link];
          n.routes.push({prefix:d.prefix,out:this.port(l,n.id),link:l.id,next:next||null,nextIp:next?Object.values(this.nodes[next].interfaces).find(i=>i.prefix===l.prefix)?.ip:null,metric:path.length-1,connected:!next});
        }
        for(const l of this.adjacent(n.id).filter(l=>l.prefix?.endsWith('/30')&&this.isActive(l))) {
          n.routes.push({prefix:l.prefix,out:this.port(l,n.id),link:l.id,next:null,nextIp:null,metric:0,connected:true});
        }
      }
    }
    changed() {
      this.version++;
      for(const n of Object.values(this.nodes).filter(n=>['switch','ap'].includes(n.type))) {
        for(const [mac,port] of Object.entries(n.macTable)) {
          const l=this.links[n.interfaces[port].link]; if(!n.on||!this.isActive(l))delete n.macTable[mac];
        }
      }
      for(const [id,nat] of Object.entries(this.nat)) {
        nat.rows=nat.rows.filter(row=>this.nodes[id].on&&this.isActive(this.links[nat.lanLink])&&this.isActive(this.links[nat.wanLink])&&this.nodes[row.device]?.ip===row.insideIp&&this.accessReady(row.device));
      }
      for(const [id,client] of Object.entries(this.vpn.clients))if(!this.vpnPeerValid(id)){client.peer=null;client.path=[];this.vpn.rows=this.vpn.rows.filter(r=>r.client!==id);}
      this.recomputeRoutes();
    }
    setSatelliteView(clear) {if(this.satellite.clearView===clear)return false;this.satellite.clearView=clear;this.changed();return true;}
    natRouterFor(id) {return id==='cafe'?'cafe-router':id==='hacker'?'hacker-router':id==='cabin'?'cabin-router':id==='friend'?'friend-home':id==='phone'&&this.access.phone.mode==='cellular'?null:'home';}
    toggleLink(id) {this.links[id].on=!this.links[id].on;this.changed();return this.links[id].on;}
    toggleNode(id) {this.nodes[id].on=!this.nodes[id].on;this.changed();return this.nodes[id].on;}
    packetHeader(p) {return {protocol:p.protocol,src:p.src,sport:p.sport,dst:p.dst,dport:p.dport};}
    natAddress(id) {return this.iface(id,this.links[this.nat[id].wanLink]).ip;}
    clearNat(id) {if(this.nat[id]){this.nat[id].rows=[];this.version++;}}
    recordNat(id,p,row,direction,before) {
      const trace={router:id,direction,before,after:this.packetHeader(p),mapping:{...row}};
      p.natHistory??=[];p.natHistory.push(trace);return trace;
    }
    natIncoming(id,p,inLink) {
      const nat=this.nat[id];if(!nat||p.dst!==this.natAddress(id))return null;
      if(inLink!==nat.wanLink)return {blocked:true,reason:'Přístup na vlastní veřejnou adresu zevnitř (hairpin NAT) se v tomto modelu nepoužívá.'};
      const row=nat.rows.find(r=>r.protocol===p.protocol&&r.outsidePort===p.dport&&r.remoteIp===p.src&&r.remotePort===p.sport);
      if(!row)return {blocked:true,reason:`${this.nodes[id].name}: pro ${p.protocol} ${p.dst}:${p.dport} a tento protějšek není záznam NAT. Paket nelze předat do domácnosti.`};
      const before=this.packetHeader(p);p.dst=row.insideIp;p.dport=row.insidePort;row.inbound+=p.payload?.packetCount||1;
      return this.recordNat(id,p,row,'in',before);
    }
    natOutgoing(id,p,inLink,outLink) {
      const nat=this.nat[id];if(!nat||inLink!==nat.lanLink||outLink!==nat.wanLink||!contains(nat.lan,p.src))return null;
      let row=nat.rows.find(r=>r.protocol===p.protocol&&r.insideIp===p.src&&r.insidePort===p.sport&&r.remoteIp===p.dst&&r.remotePort===p.dport);
      if(!row) {
        const device=this.hostId(p.src);if(!device)return {blocked:true,reason:'NAT nezná odesílající zařízení v domácí síti.'};
        let port;
        for(let i=0;i<25536;i++) {
          const candidate=nat.nextPort++;if(nat.nextPort>65535)nat.nextPort=40000;
          if(!nat.rows.some(r=>r.protocol===p.protocol&&r.outsidePort===candidate)){port=candidate;break;}
        }
        if(port===undefined)return {blocked:true,reason:'Router nemá volný port pro nový překlad NAT.'};
        row={protocol:p.protocol,device,insideIp:p.src,insidePort:p.sport,outsideIp:this.natAddress(id),outsidePort:port,remoteIp:p.dst,remotePort:p.dport,outbound:0,inbound:0};nat.rows.push(row);
      }
      const before=this.packetHeader(p);p.src=row.outsideIp;p.sport=row.outsidePort;row.outbound+=p.payload?.packetCount||1;
      return this.recordNat(id,p,row,'out',before);
    }
    rememberInstagramChannel(p) {
      this.instagramChannels[p.source]={device:p.source,insideIp:this.nodes[p.source].ip,insidePort:p.source==='friend'?52002:51002,ip:p.src,port:p.sport,vpn:!!this.vpn.clients[p.source]?.enabled,epoch:this.vpn.clients[p.source]?.epoch};
    }
    instagramChannel(device) {
      const c=this.instagramChannels[device];if(!c||c.insideIp!==this.nodes[device].ip||!this.accessReady(device))return null;
      if(c.vpn)return this.vpnPeerValid(device)&&c.epoch===this.vpn.clients[device].epoch&&this.vpn.rows.some(r=>r.client===device&&r.protocol==='TCP'&&r.insidePort===c.insidePort&&r.remoteIp===this.nodes.instagram.ip&&r.remotePort===443&&r.outsidePort===c.port)?c:null;
      if(this.vpn.clients[device]?.enabled)return null;
      const router=this.natRouterFor(device);
      if(router&&!this.nat[router].rows.some(r=>r.protocol==='TCP'&&r.insideIp===c.insideIp&&r.insidePort===c.insidePort&&r.remoteIp===this.nodes.instagram.ip&&r.remotePort===443&&r.outsidePort===c.port))return null;
      return c;
    }
    setVPN(id,enabled) {
      const c=this.vpn.clients[id];if(!c||c.enabled===enabled)return false;
      Object.assign(c,{enabled,epoch:c.epoch+1,peer:null,path:[],sent:0,received:0});
      this.vpn.rows=this.vpn.rows.filter(r=>r.client!==id);delete this.instagramChannels[id];
      if(['laptop','friend','phone','cabin','cafe'].includes(id))this.browserFor(id).dnsCache={};
      this.changed();return true;
    }
    vpnPeerValid(id) {
      const c=this.vpn.clients[id],p=c?.peer;if(!c?.enabled||!p||p.epoch!==c.epoch||p.physicalIp!==this.nodes[id].ip||!this.accessReady(id)||!this.physicalCanReach(id,'vpn'))return false;
      const router=this.natRouterFor(id);
      return !router||this.nat[router].rows.some(r=>r.protocol==='UDP'&&r.insideIp===p.physicalIp&&r.insidePort===c.port&&r.outsidePort===p.port&&r.remoteIp===this.nodes.vpn.ip&&r.remotePort===51820);
    }
    canReach(from,to) {
      if(this.vpn.clients[from]?.enabled&&!['home','friend','cabin','hacker','cafe'].includes(this.nodes[to].region))return this.physicalCanReach(from,'vpn')&&this.physicalCanReach('vpn',to);
      if(this.vpn.clients[to]?.enabled&&!['home','friend','cabin','hacker','cafe'].includes(this.nodes[from].region))return this.physicalCanReach(from,'vpn')&&this.physicalCanReach('vpn',to);
      return this.physicalCanReach(from,to);
    }
    physicalCanReach(from,to) {
      if(!this.nodes[from].on||!this.nodes[to].on)return false;
      const queue=[from],seen=new Set(queue);
      while(queue.length) {
        const at=queue.shift();if(at===to)return true;
        for(const link of this.adjacent(at)) {
          const next=this.peer(link,at);
          if(this.isActive(link)&&!seen.has(next)&&(next===to||this.nodes[next].type!=='host')){seen.add(next);queue.push(next);}
        }
      }
      return false;
    }
    route(id,ip) {return this.nodes[id].routes.filter(r=>contains(r.prefix,ip)).sort((a,b)=>Number(b.prefix.split('/')[1])-Number(a.prefix.split('/')[1]))[0]||null;}
    switchFrame(id,inLink,frame,packetId) {
      const n=this.nodes[id],input=this.port(this.links[inLink],id);
      n.macTable[frame.src]=input;
      const known=n.macTable[frame.dst];
      const ports=known?(known===input?[]:[known]):Object.keys(n.interfaces).filter(p=>p!==input&&this.isActive(this.links[n.interfaces[p].link]));
      const decision={kind:'switch',packetId,input,src:frame.src,dst:frame.dst,learned:input,known:known||null,ports,action:known?'known':'flood',version:this.version,table:{...n.macTable}};
      n.lastDecision=decision; return decision;
    }
    hostId(ip) {return Object.values(this.nodes).find(n=>n.type==='host'&&n.ip===ip)?.id;}
    linkLeadsTo(link,from,mac) {
      const seen=new Set([from]),queue=[[this.peer(link,from),link]];
      while(queue.length) {
        const [at,incoming]=queue.shift();if(seen.has(at)||!this.isActive(incoming))continue;seen.add(at);
        const n=this.nodes[at];
        if(this.iface(at,incoming).mac===mac)return true;
        if(['switch','ap'].includes(n.type))for(const out of this.adjacent(at))if(this.isActive(out)&&!seen.has(this.peer(out,at)))queue.push([this.peer(out,at),out]);
      }
      return false;
    }
    ethernetFor(id,ip) {
      const n=this.nodes[id];
      if(n.type==='host') {
        const l=this.access[id]?this.accessLink(id):this.adjacent(id)[0];
        if(!l||!this.isActive(l))return null;
        if(id==='phone'&&this.access.phone.mode==='cellular')return {link:l,frame:{cellular:true,target:ip}};
        const local=contains({cafe:CAFE,hacker:HACKER,phish:PHISH,cabin:CABIN,home:HOME,dc:DC,friend:FRIEND,instagram:IG,cloud:CLOUD,replica:REPLICA,vpn:VPN}[n.region],ip);
        const target=local?this.nodes[this.hostId(ip)]:this.nodes[{cafe:'cafe-router',hacker:'hacker-router',phish:'phish-router',cabin:'cabin-router',home:'home',dc:'hosting-router',friend:'friend-home',instagram:'ig-router',cloud:'cloud-router',replica:'replica-router',vpn:'vpn-router'}[n.region]];
        if(!target)return null;
        return {link:l,frame:{src:n.mac,dst:target.mac}};
      }
      const row=this.route(id,ip); if(!row)return null;
      const l=this.links[row.link],iface=this.iface(id,l);
      if(['satellite','satellite-access'].includes(l.medium))return {link:l,frame:{satellite:true,target:ip},row};
      if(id==='mobile-core'&&row.prefix===MOBILE)return {link:l,frame:{cellular:true,target:ip},row};
      const target=row.next?this.iface(row.next,l):l.prefix.endsWith('/30')?this.iface(this.peer(l,id),l):this.nodes[this.hostId(ip)];
      if(!target)return null;
      return {link:l,frame:{src:iface.mac,dst:target.mac},row};
    }
  }
  globalThis.InternetLab={Network,HOME,DC,IG,CLOUD,REPLICA,FRIEND,MOBILE,MAC,contains,CHATBOT_REPLY,VPN,CABIN,SAT_WAN,HACKER,PHISH,CAFE};
})();
