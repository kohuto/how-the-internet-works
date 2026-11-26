/* Isolated IPv4 model: Ethernet, bridged Wi-Fi and a schematic cellular bearer. No real network requests. */
(() => {
  'use strict';
  const HOME = '192.168.10.0/24', DC = '203.0.113.0/26', IG = '203.0.113.64/26', CLOUD = '203.0.113.128/26', REPLICA = '203.0.113.192/26', FRIEND = '172.16.20.0/24', MOBILE = '198.51.100.0/24';
  const VPN='192.0.2.128/27', CABIN='192.168.30.0/24', SAT_WAN='192.0.2.52/30', HACKER='192.168.40.0/24', PHISH='192.0.2.160/27', CAFE='192.168.50.0/24';
  const PARTNERS='192.0.2.224/27';
  // Shared placement keeps devices, scenery and camera bounds together.
  const MAP_LAYOUT={
    offsets:{dc:[500,-400],instagram:[1170,100],friend:[770,200],cloud:[500,600],replica:[670,480],vpn:[520,700],hacker:[1070,110],phish:[420,-50],cafe:[150,250],partners:[510,-230],peer:[630,30]},
    positions:{
      edge:[680,550],north:[1030,280],south:[1240,1000],dc:[1450,550],ap:[150,590],printer:[305,355],
      'hosting-router':[1450,-70],'dc-switch':[1600,-70],web:[1750,-70],
      'hosting-web-2':[1750,-250],'hosting-web-3':[1750,100],dns:[1600,-285],chatbot:[1440,-260],mail:[1600,100]
    },
    bounds:{
      home:[40,270,460,430],city:[520,120,1110,1090],peer:[1820,390,320,330],
      cabin:[10,-280,470,565],satellite:[10,-565,1215,700],
      dc:[1340,-420,520,580],instagram:[2540,150,470,400],friend:[2580,570,540,470],
      cafe:[175,1320,865,540],
      cloud:[1340,1270,520,430],replica:[2050,1150,500,430],vpn:[1820,1740,620,440],
      hacker:[2870,1100,540,520],phish:[2240,-320,500,410],partners:[1820,-850,1080,420]
    }
  };
  const browserState=()=>({content:null,pageDocument:null,revision:null,state:'idle',error:'',dnsCache:{},address:'knihovna.test',secure:false,loadedSecure:false,tlsPhase:'idle',certificateVerified:false,receipt:'',visitor:null,greeting:'',cookies:{allowed:true,items:[],lastSent:'',lastReceived:'',sendNote:'Zatím žádný webový požadavek.',receiveNote:'Zatím žádná odpověď s cookie.'}});
  const CLIENT_DEVICES=['laptop','friend','phone','cabin','cafe','hacker','cafe-attacker'];
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
    ['hosting-web-2','Server pekárny','host',1250,150,'203.0.113.11','02:00:00:00:20:11','dc'],
    ['hosting-web-3','Server cykloservisu','host',1250,500,'203.0.113.12','02:00:00:00:20:12','dc'],
    ['chatbot','Chatbot · server','host',1100,155,'203.0.113.30','02:00:00:00:20:30','dc'],
    ['instagram','Instagram','host',1710,270,'203.0.113.80',MAC.instagram,'instagram'],
    ['peer','Router E','router',1320,520,null,null,'peer'],
    ['friend-home','Matějův router','router',1880,640,'172.16.20.1',MAC['friend-home'],'friend'],
    ['friend-switch','Matějův switch','switch',2040,640,null,null,'friend'],
    ['friend','Matějův notebook','host',2170,530,'172.16.20.10',MAC.friend,'friend'],
    ['ap','Wi-Fi Lipová','ap',305,355,null,null,'home'],
    ['friend-ap','Wi-Fi u Matěje','ap',1990,490,null,null,'friend'],
    ['phone','Tvůj telefon','host',390,625,'198.51.100.10',null,'home'],
    ['bts-lipova','BTS','bts',600,350,'198.51.100.2',null,'city'],
    ['bts-park','BTS','bts',1230,790,'198.51.100.3',null,'city'],
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
    ['mail','Gmail','host',1100,450,'203.0.113.40','02:00:00:00:20:40','dc'],
    ['cafe','Notebook hosta','host',180,1300,'192.168.50.10','02:00:00:00:c0:10','cafe'],
    ['cafe-attacker','Útočník v kavárně','ap',440,1440,null,null,'cafe'],
    ['cafe-ap','Wi-Fi kavárny','ap',440,1190,null,null,'cafe'],
    ['cafe-router','Router kavárny','router',750,1300,'192.168.50.1','02:00:00:00:c0:01','cafe'],
    ['partners-router','Router partnerů','router',1440,-325,'192.0.2.225','02:00:00:00:e0:01','partners'],
    ['partners-switch','Switch partnerů','switch',1590,-325,null,null,'partners'],
    ['shop','E-shop · obchod.test','host',1740,-440,'192.0.2.226','02:00:00:00:e0:10','partners'],
    ['news','Zprávy · zpravy.test','host',1950,-440,'192.0.2.227','02:00:00:00:e0:11','partners'],
    ['ads','Společný reklamní server','host',2160,-325,'192.0.2.228','02:00:00:00:e0:12','partners'],
    ['cloud-backup','Cloud B · kopie','host',1710,870,'203.0.113.204','02:00:00:00:70:20','replica']
  ];
  // Real forwarding nodes; their coordinates are absolute and optional branches
  // appear only while at least one of their downstream lessons is enabled.
  const peerFeatures=['friend','instagram','cloud','vpn','hacker','ads'];
  const backboneRouters=[
    ['f',960,775,'city',[]],
    ['g',1700,550,'peer',peerFeatures],
    ['h',2040,150,'peer',peerFeatures],
    ['i',2040,-150,'peer',['hacker','ads']],
    ['j',2040,-350,'peer',['hacker','ads']],
    ['k',2000,950,'peer',peerFeatures],
    ['l',2000,1350,'peer',['cloud','vpn']],
    ['m',2000,1690,'peer',['cloud','vpn']],
    ['n',2300,700,'peer',peerFeatures],
    ['o',2300,200,'peer',peerFeatures],
    ['p',2300,1000,'peer',peerFeatures],
    ['q',2700,1200,'peer',['hacker']],
    ['r',1450,1000,'city',['cloud','mitm','vpn']],
    ['s',1240,1350,'city',['mitm']],
    ['t',1100,1680,'city',['mitm']],
    ['u',1070,1275,'city',['mitm']],
    ['v',1450,210,'city',[]],
    ['w',2300,450,'peer',peerFeatures],
    ['x',1740,260,'peer',peerFeatures],
    ['y',1910,200,'peer',peerFeatures],
    ['z',1910,-250,'peer',['hacker','ads']],
    ['aa',2500,1010,'peer',['hacker']],
    ['ab',1910,1150,'peer',['cloud','vpn']],
    ['ac',1910,1500,'peer',['cloud','vpn']]
  ];
  for(const [letter,x,y,region,enabledBy] of backboneRouters)nodeDefinitions.push([`transit-${letter}`,`Router ${letter.toUpperCase()}`,'router',x,y,null,null,region,enabledBy]);
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
    ['edge-south','edge','transit-f','eth2','eth0','A — F · dolní větev', ['192.0.2.13','192.0.2.14','192.0.2.12/30']],
    ['south-dc','south','dc','eth1','eth1','C — D · dolní větev', ['192.0.2.17','192.0.2.18','192.0.2.16/30']],
    ['dc-access','transit-v','hosting-router','eth1','wan0','Přípojka hostingu',['192.0.2.33','192.0.2.34','192.0.2.32/30']],
    ['dns-switch','dc-switch','dns','p2','eth0','Hosting — DNS'],
    ['web-switch','dc-switch','web','p3','eth0','Hosting — web'],
    ['chatbot-switch','dc-switch','chatbot','p4','eth0','Hosting — chatbot'],
    ['instagram-switch','ig-switch','instagram','p2','eth0','Instagram — server',null,{prefix:IG}],
    ['north-peer','dc','transit-g','eth5','eth0','Propojení poskytovatelů', ['192.0.2.21','192.0.2.22','192.0.2.20/30']],
    ['friend-uplink','transit-n','friend-home','eth1','wan0','Matějova přípojka', ['192.0.2.25','192.0.2.26','192.0.2.24/30']],
    ['friend-switch-home','friend-home','friend-switch','lan0','p1','Matějův router — switch'],
    ['friend-laptop-switch','friend-switch','friend','p2','eth0','Matějův notebook — switch',null,{device:'friend',mode:'cable'}],
    ['ap-switch','ap','switch','eth0','p4','Wi-Fi Lipová — switch',null,{prefix:HOME}],
    ['laptop-wifi','laptop','ap','wlan0','wifi1','Notebook — Wi-Fi Lipová',null,{prefix:HOME,medium:'wifi',device:'laptop',mode:'wifi'}],
    ['phone-wifi','phone','ap','wlan0','wifi2','Telefon — Wi-Fi Lipová',null,{prefix:HOME,medium:'wifi',device:'phone',mode:'wifi'}],
    ['friend-ap-switch','friend-ap','friend-switch','eth0','p3','Wi-Fi u Matěje — switch',null,{prefix:FRIEND}],
    ['friend-wifi','friend','friend-ap','wlan0','wifi1','Matějův notebook — Wi-Fi',null,{prefix:FRIEND,medium:'wifi',device:'friend',mode:'wifi'}],
    ['phone-bts-lipova','phone','bts-lipova','cell1','radio','Telefon — BTS',null,{prefix:MOBILE,medium:'cellular',device:'phone',mode:'cellular',tower:'bts-lipova'}],
    ['phone-bts-park','phone','bts-park','cell2','radio','Telefon — BTS',null,{prefix:MOBILE,medium:'cellular',device:'phone',mode:'cellular',tower:'bts-park'}],
    ['bts-lipova-uplink','bts-lipova','edge','backhaul','mobile1','BTS — Router A',null,{prefix:MOBILE,medium:'backhaul'}],
    ['bts-park-uplink','bts-park','south','backhaul','mobile1','BTS — Router C',null,{prefix:MOBILE,medium:'backhaul'}],
    ['cloud-switch','cloud-switch','cloud','p2','eth0','Cloud A — server',null,{prefix:CLOUD}],
    ['hosting-lan','hosting-router','dc-switch','lan0','p1','Hosting — switch',null,{prefix:DC}],
    ['ig-uplink','transit-o','ig-router','eth1','wan0','Přípojka Instagramu',['192.0.2.37','192.0.2.38','192.0.2.36/30']],
    ['ig-lan','ig-router','ig-switch','lan0','p1','Instagram — switch',null,{prefix:IG}],
    ['cloud-uplink','transit-r','cloud-router','eth1','wan0','Přípojka cloudu A',['192.0.2.41','192.0.2.42','192.0.2.40/30']],
    ['cloud-lan','cloud-router','cloud-switch','lan0','p1','Cloud A — switch',null,{prefix:CLOUD}],
    ['replica-uplink','transit-l','replica-router','eth2','wan0','Přípojka cloudu B',['192.0.2.45','192.0.2.46','192.0.2.44/30']],
    ['replica-lan','replica-router','replica-switch','lan0','p1','Cloud B — switch',null,{prefix:REPLICA}],
    ['replica-server','replica-switch','cloud-backup','p2','eth0','Cloud B — server',null,{prefix:REPLICA}],
    ['vpn-uplink','transit-m','vpn-router','eth1','wan0','Přípojka VPN centra',['192.0.2.49','192.0.2.50','192.0.2.48/30']],
    ['vpn-lan','vpn-router','vpn-switch','lan0','p1','VPN centrum — switch',null,{prefix:VPN}],
    ['vpn-server','vpn-switch','vpn','p2','eth0','VPN centrum — server',null,{prefix:VPN}],
    ['hacker-cable','hacker','hacker-switch','eth0','p1','Počítač útočníka — switch',null,{prefix:HACKER,device:'hacker',mode:'cable'}],
    ['hacker-lan','hacker-switch','hacker-router','p2','lan0','Switch — router doupěte',null,{prefix:HACKER}],
    ['hacker-uplink','transit-q','hacker-router','eth1','wan0','Přípojka hackerského doupěte',['192.0.2.61','192.0.2.62','192.0.2.60/30']],
    ['phish-uplink','transit-i','phish-router','eth2','wan0','Přípojka cizího hostingu',['192.0.2.65','192.0.2.66','192.0.2.64/30']],
    ['phish-lan','phish-router','phish-switch','lan0','p1','Cizí hosting — switch',null,{prefix:PHISH}],
    ['phish-server','phish-switch','phish-web','p2','eth0','Cizí hosting — podvodný web',null,{prefix:PHISH}],
    ['cafe-wifi','cafe','cafe-ap','wlan0','wifi1','Host — Wi-Fi kavárny',null,{prefix:CAFE,medium:'wifi',device:'cafe',mode:'wifi',hotspot:'trusted'}],
    ['cafe-twin','cafe','cafe-attacker','wlan1','wifi1','Host — napodobená Wi-Fi',null,{prefix:CAFE,medium:'wifi',device:'cafe',mode:'wifi',hotspot:'rogue',attackOnly:true}],
    ['cafe-relay','cafe-attacker','cafe-ap','upstream','wifi2','Útočník — Wi-Fi kavárny',null,{prefix:CAFE,medium:'wifi',attackOnly:true}],
    ['cafe-lan','cafe-ap','cafe-router','eth0','lan0','Wi-Fi — router kavárny',null,{prefix:CAFE}],
    ['cafe-uplink','cafe-router','transit-u','wan0','eth1','Přípojka kavárny',['192.0.2.69','192.0.2.70','192.0.2.68/30']],
    ['partners-uplink','transit-j','partners-router','eth1','wan0','Přípojka partnerů',['192.0.2.77','192.0.2.78','192.0.2.76/30']],
    ['partners-lan','partners-router','partners-switch','lan0','p1','Partneři — switch',null,{prefix:PARTNERS}],
    ['shop-server','partners-switch','shop','p2','eth0','Partneři — e-shop',null,{prefix:PARTNERS}],
    ['news-server','partners-switch','news','p3','eth0','Partneři — zprávy',null,{prefix:PARTNERS}],
    ['ads-server','partners-switch','ads','p4','eth0','Partneři — reklamní server',null,{prefix:PARTNERS}],
    ['mail-switch','dc-switch','mail','p5','eth0','Hosting — Gmail',null,{prefix:DC}]
  ];
  // Each short backbone segment has its own prepared /30 network, separate
  // from the existing service LANs and access WANs.
  const backboneLinks=[
    ['f-c','transit-f','south','eth1','eth0'],
    ['g-e','transit-g','peer','eth1','eth0'],
    ['e-h','peer','transit-h','eth1','eth0'],
    ['h-i','transit-h','transit-i','eth1','eth0'],
    ['i-j','transit-i','transit-j','eth1','eth0'],
    ['e-k','peer','transit-k','eth2','eth0'],
    ['k-l','transit-k','transit-l','eth1','eth0'],
    ['l-m','transit-l','transit-m','eth1','eth0'],
    ['e-n','peer','transit-n','eth3','eth0'],
    ['h-o','transit-h','transit-o','eth2','eth0'],
    ['k-p','transit-k','transit-p','eth2','eth0'],
    ['p-q','transit-p','transit-q','eth1','eth0'],
    ['d-r','dc','transit-r','eth3','eth0'],
    ['r-s','transit-r','transit-s','eth2','eth0'],
    ['s-t','transit-s','transit-t','eth1','eth0'],
    ['c-u','south','transit-u','eth3','eth0'],
    ['d-v','dc','transit-v','eth2','eth0'],
    ['b-v','north','transit-v','eth2','eth2'],
    ['v-x','transit-v','transit-x','eth3','eth0'],
    ['x-y','transit-x','transit-y','eth1','eth0'],
    ['y-h','transit-y','transit-h','eth1','eth3'],
    ['o-w','transit-o','transit-w','eth2','eth0'],
    ['w-n','transit-w','transit-n','eth1','eth2'],
    ['n-p','transit-n','transit-p','eth3','eth2'],
    ['n-aa','transit-n','transit-aa','eth4','eth0'],
    ['aa-q','transit-aa','transit-q','eth1','eth2'],
    ['y-z','transit-y','transit-z','eth2','eth0'],
    ['z-j','transit-z','transit-j','eth1','eth2'],
    ['c-r','south','transit-r','eth4','eth3'],
    ['u-s','transit-u','transit-s','eth2','eth2'],
    ['u-t','transit-u','transit-t','eth3','eth2'],
    ['r-k','transit-r','transit-k','eth4','eth3'],
    ['r-ab','transit-r','transit-ab','eth5','eth0'],
    ['ab-ac','transit-ab','transit-ac','eth1','eth0'],
    ['ac-m','transit-ac','transit-m','eth1','eth2']
  ];
  const backboneLetter=id=>({edge:'A',north:'B',south:'C',dc:'D',peer:'E'}[id]||id.replace(/^transit-/,'').toUpperCase());
  for(const [index,[id,a,b,pa,pb]] of backboneLinks.entries()){
    linkDefinitions.push([`backbone-${id}`,a,b,pa,pb,`${backboneLetter(a)} — ${backboneLetter(b)}`,[`198.18.0.${index*4+1}`,`198.18.0.${index*4+2}`,`198.18.0.${index*4}/30`]]);
  }
  linkDefinitions.push(
    ['hosting-web-2-switch','dc-switch','hosting-web-2','p6','eth0','Hosting — web pekárny',null,{prefix:DC}],
    ['hosting-web-3-switch','dc-switch','hosting-web-3','p7','eth0','Hosting — web cykloservisu',null,{prefix:DC}]
  );
  const ipv4 = ip => ip.split('.').reduce((n,b)=>(n*256 + Number(b))>>>0,0);
  const contains = (prefix,ip) => {
    const [net,bits] = prefix.split('/'); const shift = 32-Number(bits);
    return (ipv4(net)>>>shift) === (ipv4(ip)>>>shift);
  };
  class Network {
    constructor(settings=null) {
      // A bare model retains the complete topology for standalone experiments.
      // The application supplies its explicit, session-only starting selection.
      this.settings=settings;
      this.nodes = Object.fromEntries(nodeDefinitions.map(([id,name,type,x,y,ip,mac,region,enabledBy])=>[id,{id,name,type,x,y,ip,mac,region,enabledBy,on:true,interfaces:{},macTable:{},lastDecision:null}]));
      for(const n of Object.values(this.nodes)){
        const offset=n.enabledBy?[0,0]:MAP_LAYOUT.offsets[n.region]||[0,0];n.x+=offset[0];n.y+=offset[1];
        if(MAP_LAYOUT.positions[n.id])[n.x,n.y]=MAP_LAYOUT.positions[n.id];
      }
      this.satellite={clearView:true};this.mitm={active:false,ssid:'Kavarna_free',mode:'observe',logs:[],serial:0};this.cafeWifi={ssid:'Kavarna_hoste',password:'kava1234'};
      this.access={cafe:{mode:'offline',hotspot:null},hacker:{mode:'cable'},cabin:{mode:'wifi'},laptop:{mode:'cable'},friend:{mode:'cable'},phone:{mode:'cellular',tower:null}};
      this.connectionProfiles=Object.fromEntries(Object.keys(this.access).map(id=>[id,{bandwidth:'low',latency:'low'}]));
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
      // Schematic identities for simplified junctions, without adding switch IP interfaces.
      const usedAddresses=new Set(Object.values(this.nodes).flatMap(n=>[n.ip,...Object.values(n.interfaces).map(i=>i.ip)]).filter(Boolean));
      for(const n of Object.values(this.nodes).filter(n=>n.type==='switch')) {
        const [subnet,bits]=Object.values(n.interfaces)[0].prefix.split('/'),first=ipv4(subnet),last=first+2**(32-Number(bits))-1;
        for(let address=first+2;address<last;address++) {
          const ip=[24,16,8,0].map(shift=>(address>>>shift)&255).join('.');
          if(!usedAddresses.has(ip)){n.junctionIp=ip;usedAddresses.add(ip);break;}
        }
      }
      this.version=1;
      this.server={
        files:{'index.html':{name:'index.html',mediaType:'text/html; charset=utf-8',content:{brand:'knihovna na rohu',kicker:'MĚSTSKÁ KNIHOVNA LIPOV',title:'Dnes otevřeno do 16 hodin',description:'Vítejte v knihovně na rohu. Spravujte své výpůjčky nebo nám napište.'}}},
        get title(){return this.files['index.html'].content.title;},
        set title(value){this.files['index.html'].content.title=value;},
        revision:1,certificate:{name:'knihovna.test',issuer:'Výuková certifikační autorita',trusted:true,valid:true},lastRequest:null
      };
      this.hostedSites={
        'hosting-web-2':{host:'pekarna.test',files:{'index.html':{name:'index.html',mediaType:'text/html; charset=utf-8',content:{brand:'Pekárna U lípy',kicker:'PEKÁRNA V LIPOVĚ',title:'Každé ráno čerstvý chléb',description:'Chléb, rohlíky a koláče z naší pekárny.'}}}},
        'hosting-web-3':{host:'cykloservis.test',files:{'index.html':{name:'index.html',mediaType:'text/html; charset=utf-8',content:{brand:'Cykloservis Lipov',kicker:'SERVIS JÍZDNÍCH KOL',title:'Připravíme vaše kolo na cestu',description:'Opravy kol, seřízení brzd a pravidelná údržba.'}}}}
      };
      this.sender={text:'',content:null,sentBytes:0,sentPackets:0,state:'idle'};
      this.instagram={id:0,text:'',content:null,receivedPackets:0,sentBytes:0,sentPackets:0,state:'idle',totalBytes:0,receivedBytes:0,streamBytes:0,readRequested:false,readKnown:false,readNotified:false,error:'',senderDevice:'laptop',recipientDevice:'friend',replyDevice:'laptop',openDevice:null,selfReceipts:true,history:[]};
      this.friend={text:'',content:null,receivedPackets:0,state:'idle',receivedBytes:0,streamBytes:0,read:false,receipts:true,chatOpen:false};
      this.cookieTime=0;this.browser=browserState();this.phoneBrowser=browserState();this.cabinBrowser=browserState();this.friendBrowser=browserState();this.cafeBrowser=browserState();
      this.server.cookies={secureOnly:false,serial:0,visitors:new Map(),last:null};
      this.printer={count:0,document:'',state:'idle'};
      this.chatbot={serial:0,clients:Object.fromEntries(['laptop','friend','phone','cabin'].map(id=>[id,{turns:[]}])),server:{state:'idle',step:0,processed:0,prompt:'',answer:'',client:null,receivedBytes:0,totalBytes:0}};
      this.cloud=new globalThis.InternetLab.CloudStorage();
      this.nat={'cafe-router':{lan:CAFE,lanLink:'cafe-lan',wanLink:'cafe-uplink',rows:[],nextPort:40000},'hacker-router':{lan:HACKER,lanLink:'hacker-lan',wanLink:'hacker-uplink',rows:[],nextPort:40000},'cabin-router':{lan:CABIN,lanLink:'cabin-lan',wanLink:'cabin-wan',rows:[],nextPort:40000},home:{lan:HOME,lanLink:'switch-home',wanLink:'uplink',rows:[],nextPort:40000},'friend-home':{lan:FRIEND,lanLink:'friend-switch-home',wanLink:'friend-uplink',rows:[],nextPort:40000}};
      this.instagramChannels={};
      this.vpn={clients:Object.fromEntries(['laptop','friend','phone','cabin','hacker','cafe'].map((id,i)=>[id,{enabled:false,ip:`10.8.0.${10+i}`,port:54010+i,epoch:0,peer:null,path:[],sent:0,received:0}])),rows:[],nextPort:55000,sent:0,received:0,last:null};
      this.dnsRecords={'obchod.test':'192.0.2.226','zpravy.test':'192.0.2.227','reklamy.test':'192.0.2.228','knihovna.test':'203.0.113.10','knihovna-podpora.test':'192.0.2.170'};
      if(!this.featureEnabled('mobile'))this.access.phone.mode='wifi';
      if(!this.featureEnabled('wifi'))this.access.cabin.mode='cable';
      this.wifiProfiles={ap:{ssid:'Lipova',password:'lipova1234'},'friend-ap':{ssid:'U Mateje',password:'matej1234'},'cabin-ap':{ssid:'Chata',password:'chata1234'}};
      this.connectionControls=Object.fromEntries(Object.entries(this.access).map(([id,a])=>[id,{wifiEnabled:this.accessModeAvailable(id,'wifi')&&id!=='hacker',mobileEnabled:id==='phone'&&a.mode==='cellular',known:{}}]));
      this.dnsRecords=Object.fromEntries(Object.entries(this.dnsRecords).filter(([,ip])=>this.hostId(ip)));
      this.updateCellularAccess();
      this.applyAccess('cafe');this.applyAccess('hacker');this.applyAccess('cabin');this.applyAccess('laptop');this.applyAccess('friend');this.applyAccess('phone');
      this.recomputeRoutes();
      this.clientDefaults={};this.captureClientDefaults();
    }
    clientStateSlots(id) {
      const browserKeys={laptop:'browser',friend:'friendBrowser',phone:'phoneBrowser',cabin:'cabinBrowser',cafe:'cafeBrowser'};
      return [
        ['access',this.access,id],['connectionControls',this.connectionControls,id],['connectionProfile',this.connectionProfiles,id],['browser',this,browserKeys[id]],
        ['vpn',this.vpn.clients,id],['chatbot',this.chatbot.clients,id],['cloudClient',this.cloud.clients,id],['localFiles',this.cloud.local,id],
        ['mail',this.phishing?.clients,id],['auth',this.server.auth?.clients,id],['privacy',this.server.privacy?.clients,id],['ads',this.ads?.clients,id],
        ['admin',this.phishing,id==='hacker'?'hacker':undefined],['hotspot',this,id==='cafe-attacker'?'mitm':undefined]
      ].filter(([,parent,key])=>parent&&key!==undefined&&Object.hasOwn(parent,key));
    }
    captureClientDefaults() {
      for(const id of CLIENT_DEVICES) {
        const initial=this.clientDefaults[id]??={};
        for(const [name,parent,key] of this.clientStateSlots(id))if(!Object.hasOwn(initial,name))initial[name]=structuredClone(parent[key]);
      }
    }
    resetClient(id) {
      const initial=this.clientDefaults[id];if(!initial)return false;
      const epoch=this.vpn.clients[id]?.epoch;
      for(const [name,parent,key] of this.clientStateSlots(id))if(Object.hasOwn(initial,name))parent[key]=structuredClone(initial[name]);
      if(this.vpn.clients[id])this.vpn.clients[id].epoch=epoch+1;
      this.vpn.rows=this.vpn.rows.filter(row=>row.client!==id);delete this.instagramChannels[id];
      if(this.server.auth?.clients[id])Object.assign(this.server.auth.clients[id],{user:null,notice:''});
      this.instagram.hidden??={};
      this.instagram.hidden[id]=new Set(this.instagram.history.filter(m=>m.senderDevice===id||m.recipientDevice===id&&m.delivered).map(m=>m.id));
      if(this.instagram.openDevice===id)this.instagram.openDevice=null;
      if(this.instagram.recipientDevice===id)Object.assign(this.friend,{text:'',content:null,receivedPackets:0,state:'idle',receivedBytes:0,streamBytes:0,read:false});
      if(id==='friend'){this.friend.receipts=true;this.friend.chatOpen=false;}
      if(this.access[id])this.applyAccess(id);
      this.nodes[id].lastDecision=null;return true;
    }
    featureEnabled(id) {return this.settings?.has(id)??true;}
    webAddress(value) {
      const address=globalThis.InternetLab.webAddress(value);
      return address&&!this.featureEnabled('tls')?{...address,secure:false,url:address.url.replace(/^https:/,'http:')}:address;
    }
    detailEnabled(id) {return this.settings?.details[id]??true;}
    displayType(node) {
      const n=typeof node==='string'?this.nodes[node]:node;
      return !this.detailEnabled('devices')&&['router','switch'].includes(n.type)?'junction':n.type;
    }
    displayName(node) {
      const n=typeof node==='string'?this.nodes[node]:node;
      return this.displayType(n)==='junction'?'Chytrá křižovatka':n.name;
    }
    displayIp(node) {
      const n=typeof node==='string'?this.nodes[node]:node;
      if(n.type==='switch') {
        return this.displayType(n)==='junction'?n.junctionIp:null;
      }
      return n.ip||(n.type==='router'?Object.values(n.interfaces).find(i=>i.ip&&this.linkAvailable(this.links[i.link]))?.ip:null)||null;
    }
    displayLinkName(link) {
      return !this.detailEnabled('devices')&&[link.a,link.b].some(id=>this.displayType(id)==='junction')?`${this.displayName(link.a)} — ${this.displayName(link.b)}`:link.name;
    }
    displayText(value) {
      if(this.detailEnabled('devices'))return value;
      // Event text retains the real names so changing presentation is reversible mid-transfer.
      let text=String(value);
      const names=Object.values(this.nodes).filter(n=>['router','switch'].includes(n.type)).map(n=>n.name).sort((a,b)=>b.length-a.length);
      for(const name of names)text=text.split(name).join('Chytrá křižovatka');
      return text.replace(/další router/g,'další zařízení').replace(/rozhodnutí routeru/g,'rozhodnutí zařízení');
    }
    appAvailable(app,device) {
      const feature={mail:'mail',print:'printer',message:'instagram',cloud:'cloud',chatbot:'chatbot',vpn:'vpn',attack:'hacker',mitm:'mitm'}[app];
      return this.nodeAvailable(device)&&(!feature||this.featureEnabled(feature))&&(app!=='vpn'||!!this.vpn.clients[device])&&(app!=='mail'||this.nodeAvailable(globalThis.InternetLab.mailServerFor(device)));
    }
    nodeAvailable(id) {return !!this.nodes[id]&&(!this.settings||this.settings.nodeEnabled(this.nodes[id]));}
    linkAvailable(link) {return !!link&&this.nodeAvailable(link.a)&&this.nodeAvailable(link.b);}
    visibleNodes() {return Object.values(this.nodes).filter(n=>this.nodeAvailable(n.id));}
    visibleLinks() {return Object.values(this.links).filter(l=>this.linkAvailable(l));}
    accessModeAvailable(id,mode) {
      if(mode==='offline')return true;
      if(mode==='cellular')return this.featureEnabled('mobile');
      if(mode==='wifi')return this.nodeAvailable(id==='cafe'?'cafe-ap':id==='friend'?'friend-ap':id==='cabin'?'cabin-ap':'ap');
      return true;
    }
    peer(link,node) {return link.a===node?link.b:link.a;}
    port(link,node) {return link.a===node?link.pa:link.pb;}
    selectedAccess(link) {return (!link.attackOnly||this.mitm.active)&&(!link.device||(this.access[link.device].mode===link.mode&&(!link.tower||this.access[link.device].tower===link.tower)&&(!link.hotspot||this.access[link.device].hotspot===link.hotspot)));}
    isActive(link) {return this.linkAvailable(link) && link.on && this.selectedAccess(link) && (!link.requiresView||this.satellite.clearView) && this.nodes[link.a].on && this.nodes[link.b].on;}
    browserFor(id='laptop') {return id==='cafe'?this.cafeBrowser:id==='friend'?this.friendBrowser:id==='cabin'?this.cabinBrowser:id==='phone'?this.phoneBrowser:this.browser;}
    advanceCookieTime(seconds=3600) {if(!Number.isFinite(seconds)||seconds<0)return false;this.cookieTime+=seconds;for(const id of ['laptop','friend','phone','cabin','cafe'])globalThis.InternetLab.WebCookies.expire(this.browserFor(id).cookies,this.cookieTime);for(const c of Object.values(this.ads?.clients||{}))if(c.cookie?.expiresAt<=this.cookieTime)c.cookie=null;return true;}
    accessLink(id) {return this.adjacent(id).find(l=>l.device===id&&this.selectedAccess(l))||null;}
    accessReady(id) {return this.isActive(this.accessLink(id));}
    wifiProfile(ap) {return ap==='cafe-ap'?this.cafeWifi:this.wifiProfiles[ap];}
    wifiNetworks(id) {
      if(id==='cafe')return this.cafeNetworks().map(n=>({...n,signal:3}));
      return this.adjacent(id).filter(l=>l.device===id&&l.mode==='wifi'&&l.on&&this.nodes[this.peer(l,id)].on)
        .map(l=>{const ap=this.peer(l,id),profile=this.wifiProfile(ap);return profile?{id:ap,ssid:profile.ssid,secured:true,signal:3}:null;}).filter(Boolean);
    }
    wifiNetworkId(id) {const l=this.adjacent(id).find(l=>l.device===id&&l.mode==='wifi');return id==='cafe'?this.access.cafe.hotspot:l?this.peer(l,id):null;}
    wifiPassword(id,key) {return id==='cafe'?(key==='trusted'?this.cafeWifi.password:''):this.wifiProfile(key)?.password;}
    wifiKnown(id,key) {
      const network=this.wifiNetworks(id).find(n=>n.id===key);
      return !!network&&this.connectionControls[id]?.known[key]===`${network.ssid}\n${this.wifiPassword(id,key)}`;
    }
    cableLink(id) {return this.adjacent(id).find(l=>l.device===id&&l.mode==='cable')||null;}
    cableReady(id) {const l=this.cableLink(id);return !!l&&l.on&&this.nodes[id].on&&this.nodes[this.peer(l,id)].on;}
    fallbackAccess(id) {return id==='phone'&&this.connectionControls.phone.mobileEnabled?'cellular':this.cableReady(id)?'cable':'offline';}
    setWifiEnabled(id,enabled) {
      const controls=this.connectionControls[id];
      if(!controls||id==='hacker'||!this.nodeAvailable(id)||!this.accessModeAvailable(id,'wifi')||typeof enabled!=='boolean'||controls.wifiEnabled===enabled)return false;
      controls.wifiEnabled=enabled;
      if(!enabled&&this.access[id].mode==='wifi')this.setAccess(id,this.fallbackAccess(id));
      return true;
    }
    connectWifi(id,key,password='') {
      const controls=this.connectionControls[id],network=this.wifiNetworks(id).find(n=>n.id===key);
      if(!controls?.wifiEnabled||!this.nodes[id].on||!network||network.secured&&!this.wifiKnown(id,key)&&password!==this.wifiPassword(id,key))return false;
      if(id==='cafe')this.setCafeHotspot(key,this.wifiPassword(id,key));else this.setAccess(id,'wifi');
      controls.known[key]=`${network.ssid}\n${this.wifiPassword(id,key)}`;
      return true;
    }
    disconnectWifi(id) {return this.access[id]?.mode==='wifi'&&this.setAccess(id,this.fallbackAccess(id));}
    setMobileData(enabled) {
      const controls=this.connectionControls.phone;
      if(!this.nodeAvailable('phone')||!this.featureEnabled('mobile')||typeof enabled!=='boolean'||controls.mobileEnabled===enabled)return false;
      controls.mobileEnabled=enabled;
      if(!enabled&&this.access.phone.mode==='cellular')this.setAccess('phone','offline');
      else if(enabled&&this.access.phone.mode==='offline')this.setAccess('phone','cellular');
      return true;
    }
    updateCellularAccess() {
      const access=this.access.phone,phone=this.nodes.phone;
      // Distance is only a teaching approximation; radio propagation is not simulated.
      const towers=access.mode==='cellular'&&phone.on?this.adjacent('phone')
        .filter(l=>l.medium==='cellular'&&l.on&&this.nodes[this.peer(l,'phone')].on)
        .map(l=>this.nodes[this.peer(l,'phone')])
        .filter(n=>this.adjacent(n.id).some(l=>l.medium==='backhaul'&&this.isActive(l)))
        .sort((a,b)=>Math.hypot(a.x-phone.x,a.y-phone.y)-Math.hypot(b.x-phone.x,b.y-phone.y)||a.id.localeCompare(b.id)):[];
      access.tower=towers[0]?.id||null;
    }
    setConnectionProfile(id,profile) {
      const current=this.connectionProfiles[id];
      if(!this.featureEnabled('connection-timing')||!this.nodeAvailable(id)||!current||!profile||!['low','high'].includes(profile.bandwidth)||!['low','high'].includes(profile.latency))return false;
      if(current.bandwidth===profile.bandwidth&&current.latency===profile.latency)return false;
      this.connectionProfiles[id]={bandwidth:profile.bandwidth,latency:profile.latency};return true;
    }
    connectionLink(id) {return id==='phone'&&this.access.phone.mode==='cellular'?this.adjacent(this.access.phone.tower).find(l=>l.medium==='backhaul')?.id:this.nat[this.natRouterFor(id)]?.wanLink;}
    applyAccess(id) {
      const n=this.nodes[id],mode=this.access[id].mode;
      const profiles={cafe:{wifi:['192.168.50.10','02:00:00:00:c0:10']},hacker:{cable:['192.168.40.10','02:00:00:00:a0:10']},cabin:{cable:['192.168.30.10','02:00:00:00:90:10'],wifi:['192.168.30.11','02:00:00:00:90:11']},laptop:{cable:['192.168.10.10',MAC.laptop],wifi:['192.168.10.11','02:00:00:00:10:11']},friend:{cable:['172.16.20.10',MAC.friend],wifi:['172.16.20.11','02:00:00:00:30:11']},phone:{wifi:['192.168.10.30','02:00:00:00:10:30'],cellular:['198.51.100.10',null]}};
      if(profiles[id][mode])[n.ip,n.mac]=profiles[id][mode];
      for(const i of Object.values(n.interfaces)) {
        const l=this.links[i.link],profile=profiles[id][l.mode];
        if(profile){i.ip=profile[0];i.mac=profile[1];}
      }
    }
    setAccess(id,mode) {
      const allowed=id==='cafe'?['offline']:id==='hacker'?['cable','offline']:id==='phone'?['wifi','cellular','offline']:['cable','wifi','offline'];
      if(!this.nodeAvailable(id)||!this.access[id]||!allowed.includes(mode)||!this.accessModeAvailable(id,mode))return false;
      if(this.access[id].mode===mode)return false;
      if(mode==='wifi')this.connectionControls[id].wifiEnabled=true;
      if(mode==='cellular')this.connectionControls[id].mobileEnabled=true;
      this.access[id]={mode,...(id==='phone'?{tower:null}:id==='cafe'?{hotspot:this.access.cafe.hotspot}:{})};this.applyAccess(id);this.changed();return true;
    }
    cafeNetworks() {
      if(!this.nodeAvailable('cafe'))return [];
      const networks=[];
      if(this.nodeAvailable('cafe-ap')&&this.nodes['cafe-ap'].on)networks.push({id:'trusted',ssid:this.cafeWifi.ssid,secured:true});
      if(this.featureEnabled('mitm')&&this.nodeAvailable('cafe-attacker')&&this.nodes['cafe-attacker'].on&&this.mitm.active)networks.push({id:'rogue',ssid:this.mitm.ssid,secured:false});
      return networks;
    }
    setCafeHotspot(hotspot,password='') {
      if(!this.cafeNetworks().some(n=>n.id===hotspot)||hotspot==='trusted'&&password!==this.cafeWifi.password||this.access.cafe.mode==='wifi'&&this.access.cafe.hotspot===hotspot)return false;
      this.access.cafe={mode:'wifi',hotspot};this.applyAccess('cafe');this.changed();return true;
    }
    adjacent(id) {return this.visibleLinks().filter(l=>l.a===id||l.b===id);}
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
      const domains=[{prefix:PARTNERS,router:'partners-router',link:'partners-lan'},{prefix:CAFE,router:'cafe-router',link:'cafe-lan',private:true},{prefix:'192.0.2.68/30',router:this.links['cafe-uplink'].b,link:'cafe-uplink'},{prefix:PHISH,router:'phish-router',link:'phish-lan'},{prefix:HACKER,router:'hacker-router',link:'hacker-lan',private:true},{prefix:'192.0.2.60/30',router:this.links['hacker-uplink'].a,link:'hacker-uplink'},{prefix:CABIN,router:'cabin-router',link:'cabin-lan',private:true},{prefix:SAT_WAN,router:'sat-gateway',link:'sat-downlink'},{prefix:HOME,router:'home',link:'switch-home',private:true},{prefix:DC,router:'hosting-router',link:'hosting-lan'},{prefix:IG,router:'ig-router',link:'ig-lan'},{prefix:CLOUD,router:'cloud-router',link:'cloud-lan'},{prefix:REPLICA,router:'replica-router',link:'replica-lan'},{prefix:FRIEND,router:'friend-home',link:'friend-switch-home',private:true},{prefix:VPN,router:'vpn-router',link:'vpn-lan'},
        {prefix:'192.0.2.0/30',router:'edge',link:'uplink'},{prefix:'192.0.2.24/30',router:this.links['friend-uplink'].a,link:'friend-uplink'}];
      // The selected tower's existing router also represents the mobile gateway.
      // Only this attachment advertises the phone's return path.
      if(this.access.phone.mode==='cellular') {
        const uplink=this.links[this.connectionLink('phone')];
        if(uplink)domains.push({prefix:MOBILE,router:this.peer(uplink,this.access.phone.tower),link:uplink.id});
      }
      // Without NAT, this teaching model routes client addresses directly,
      // including tunnel addresses whose next host is the VPN endpoint.
      if(!this.detailEnabled('nat'))for(const c of Object.values(this.vpn.clients))if(c.enabled)domains.push({prefix:`${c.ip}/32`,router:'vpn-router',link:'vpn-lan',host:'vpn'});
      for(const n of Object.values(this.nodes).filter(n=>n.type==='router')) {
        n.routes=[]; if(!n.on)continue;
        for(const d of domains) {
          if(d.private&&this.detailEnabled('nat')&&n.id!==d.router)continue;
          if(!this.isActive(this.links[d.link]))continue;
          if(d.prefix.endsWith('/30')&&this.adjacent(n.id).some(l=>l.prefix===d.prefix&&this.isActive(l)))continue;
          const path=this.shortest(n.id,d.router); if(!path)continue;
          const next=path.slice(1).find(id=>this.nodes[id].type==='router'); const l=path[1]?this.adjacent(n.id).find(l=>this.peer(l,n.id)===path[1]):this.links[d.link];
          n.routes.push({prefix:d.prefix,out:this.port(l,n.id),link:l.id,next:next||null,nextIp:next?Object.values(this.nodes[next].interfaces).find(i=>i.prefix===l.prefix)?.ip:null,metric:path.length-1,connected:!next,...(d.host?{host:d.host}:{})});
        }
        for(const l of this.adjacent(n.id).filter(l=>l.prefix?.endsWith('/30')&&this.isActive(l))) {
          n.routes.push({prefix:l.prefix,out:this.port(l,n.id),link:l.id,next:null,nextIp:null,metric:0,connected:true});
        }
      }
    }
    changed() {
      this.version++;
      this.updateCellularAccess();
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
    toggleLink(id) {
      const link=this.links[id];if(!this.linkAvailable(link))return false;
      link.on=!link.on;
      if(link.on&&link.device&&link.mode==='cable'&&this.access[link.device].mode!=='cable'&&this.cableReady(link.device))this.setAccess(link.device,'cable');
      this.changed();return link.on;
    }
    toggleNode(id) {
      if(!this.nodeAvailable(id))return false;
      this.nodes[id].on=!this.nodes[id].on;
      if(!this.nodes[id].on&&CLIENT_DEVICES.includes(id)){this.onClientPowerOff?.(id);this.resetClient(id);}
      if(!this.nodes[id].on&&((id==='cafe-ap'&&this.access.cafe.hotspot==='trusted')||(id==='cafe-attacker'&&this.access.cafe.hotspot==='rogue')))this.access.cafe.mode='offline';
      if(this.nodes[id].on)for(const link of this.adjacent(id).filter(l=>l.device&&l.mode==='cable'))if(this.access[link.device].mode==='offline'&&this.cableReady(link.device))this.setAccess(link.device,'cable');
      this.changed();return this.nodes[id].on;
    }
    packetHeader(p) {return {protocol:p.protocol,src:p.src,sport:p.sport,dst:p.dst,dport:p.dport};}
    natAddress(id) {return this.iface(id,this.links[this.nat[id].wanLink]).ip;}
    clearNat(id) {if(this.nat[id]){this.nat[id].rows=[];this.version++;}}
    recordNat(id,p,row,direction,before) {
      const trace={router:id,direction,before,after:this.packetHeader(p),mapping:{...row}};
      p.natHistory??=[];p.natHistory.push(trace);return trace;
    }
    natIncoming(id,p,inLink) {
      if(!this.detailEnabled('nat'))return null;
      const nat=this.nat[id];if(!nat||p.dst!==this.natAddress(id))return null;
      if(inLink!==nat.wanLink)return {blocked:true,reason:'Přístup na vlastní veřejnou adresu zevnitř (hairpin NAT) se v tomto modelu nepoužívá.'};
      const row=nat.rows.find(r=>r.protocol===p.protocol&&r.outsidePort===p.dport&&r.remoteIp===p.src&&r.remotePort===p.sport);
      if(!row)return {blocked:true,reason:`${this.nodes[id].name}: pro ${p.protocol} ${p.dst}:${p.dport} a tento protějšek není záznam NAT. Paket nelze předat do domácnosti.`};
      const before=this.packetHeader(p);p.dst=row.insideIp;p.dport=row.insidePort;row.inbound+=p.payload?.packetCount||1;
      return this.recordNat(id,p,row,'in',before);
    }
    natOutgoing(id,p,inLink,outLink) {
      if(!this.detailEnabled('nat'))return null;
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
      if(c.vpn)return this.vpnPeerValid(device)&&c.epoch===this.vpn.clients[device].epoch&&(this.detailEnabled('nat')?this.vpn.rows.some(r=>r.client===device&&r.protocol==='TCP'&&r.insidePort===c.insidePort&&r.remoteIp===this.nodes.instagram.ip&&r.remotePort===443&&r.outsidePort===c.port):c.ip===this.vpn.clients[device].ip&&c.port===c.insidePort)?c:null;
      if(this.vpn.clients[device]?.enabled)return null;
      if(!this.detailEnabled('nat'))return c.ip===c.insideIp&&c.port===c.insidePort?c:null;
      const router=this.natRouterFor(device);
      if(router&&!this.nat[router].rows.some(r=>r.protocol==='TCP'&&r.insideIp===c.insideIp&&r.insidePort===c.insidePort&&r.remoteIp===this.nodes.instagram.ip&&r.remotePort===443&&r.outsidePort===c.port))return null;
      return c;
    }
    setVPN(id,enabled) {
      if(!this.featureEnabled('vpn')||!this.nodeAvailable(id))return false;
      const c=this.vpn.clients[id];if(!c||c.enabled===enabled)return false;
      Object.assign(c,{enabled,epoch:c.epoch+1,peer:null,path:[],sent:0,received:0});
      this.vpn.rows=this.vpn.rows.filter(r=>r.client!==id);delete this.instagramChannels[id];
      if(['laptop','friend','phone','cabin','cafe'].includes(id))this.browserFor(id).dnsCache={};
      this.changed();return true;
    }
    vpnPeerValid(id) {
      const c=this.vpn.clients[id],p=c?.peer;if(!c?.enabled||!p||p.epoch!==c.epoch||p.physicalIp!==this.nodes[id].ip||!this.accessReady(id)||!this.physicalCanReach(id,'vpn'))return false;
      const router=this.natRouterFor(id);
      if(!this.detailEnabled('nat')||!router)return p.ip===p.physicalIp&&p.port===c.port;
      return this.nat[router].rows.some(r=>r.protocol==='UDP'&&r.insideIp===p.physicalIp&&r.insidePort===c.port&&r.outsidePort===p.port&&r.remoteIp===this.nodes.vpn.ip&&r.remotePort===51820);
    }
    vpnClientFor(ip) {return Object.keys(this.vpn.clients).find(id=>this.vpn.clients[id].enabled&&this.vpn.clients[id].ip===ip);}
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
      if(!this.detailEnabled('devices')) {
        const out=this.adjacent(id).find(l=>l.id!==inLink&&this.isActive(l)&&this.linkLeadsTo(l,id,frame.dst));
        const decision={kind:'switch',packetId,input,src:frame.src,dst:frame.dst,learned:null,known:null,ports:out?[this.port(out,id)]:[],action:'direct',version:this.version,table:{...n.macTable}};
        n.lastDecision=decision;return decision;
      }
      n.macTable[frame.src]=input;
      const known=n.macTable[frame.dst];
      const ports=known?(known===input?[]:[known]):Object.keys(n.interfaces).filter(p=>p!==input&&this.isActive(this.links[n.interfaces[p].link]));
      const decision={kind:'switch',packetId,input,src:frame.src,dst:frame.dst,learned:input,known:known||null,ports,action:known?'known':'flood',version:this.version,table:{...n.macTable}};
      n.lastDecision=decision; return decision;
    }
    hostId(ip) {return this.visibleNodes().find(n=>n.type==='host'&&n.ip===ip)?.id;}
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
        const local=contains({partners:PARTNERS,cafe:CAFE,hacker:HACKER,phish:PHISH,cabin:CABIN,home:HOME,dc:DC,friend:FRIEND,instagram:IG,cloud:CLOUD,replica:REPLICA,vpn:VPN}[n.region],ip);
        const target=local?this.nodes[this.hostId(ip)]:this.nodes[{partners:'partners-router',cafe:'cafe-router',hacker:'hacker-router',phish:'phish-router',cabin:'cabin-router',home:'home',dc:'hosting-router',friend:'friend-home',instagram:'ig-router',cloud:'cloud-router',replica:'replica-router',vpn:'vpn-router'}[n.region]];
        if(!target)return null;
        return {link:l,frame:{src:n.mac,dst:target.mac}};
      }
      const row=this.route(id,ip); if(!row)return null;
      const l=this.links[row.link],iface=this.iface(id,l);
      if(['satellite','satellite-access'].includes(l.medium))return {link:l,frame:{satellite:true,target:ip},row};
      if(l.medium==='backhaul')return {link:l,frame:{cellular:true,target:ip},row};
      const target=row.next?this.iface(row.next,l):l.prefix.endsWith('/30')?this.iface(this.peer(l,id),l):this.nodes[row.host||this.hostId(ip)];
      if(!target)return null;
      return {link:l,frame:{src:iface.mac,dst:target.mac},row};
    }
  }
  globalThis.InternetLab={Network,HOME,DC,IG,CLOUD,REPLICA,FRIEND,MOBILE,MAC,contains,CHATBOT_REPLY,VPN,CABIN,SAT_WAN,HACKER,PHISH,CAFE,PARTNERS,MAP_LAYOUT};
})();
