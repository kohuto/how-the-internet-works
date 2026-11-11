(() => {
  'use strict';
  const {Network,Simulation,NetworkMap,DEFAULT_MESSAGE,MSS,CLOUD_MSS,MESSAGE_TYPES,formatBytes,formatPackets,messagePlan,messagePreview,requestText,responseText,esc,icons,computerView}=globalThis.InternetLab;
  const ANIMATION_DELAY=650;
  const $=s=>document.querySelector(s),encoder=new TextEncoder();
  let net=new Network(),sim=new Simulation(net),timer=null,playing=false,toastTimer=null;
  let timerDue=0,remaining=0,computerViewKey='',deviceViewKey='';
  const ui={selection:{kind:'node',id:'laptop'},back:[],tab:'desktop',hackerTab:'desktop',attackTarget:'laptop',friendTab:'desktop',friendAddress:'knihovna.test',cabinTab:'desktop',cabinAddress:'knihovna.test',cabinMessage:DEFAULT_MESSAGE,cabinMessageType:'text',phoneTab:'desktop',phoneAddress:'knihovna.test',phoneMessage:DEFAULT_MESSAGE,phoneMessageType:'text',messageType:'text',monitorDevice:'laptop',monitorOpen:false,deviceOpen:false,linkOpen:false,packetOpen:false,packetMember:null,packetResume:false,address:'knihovna.test',document:'Poznámky k projektu.pdf',message:DEFAULT_MESSAGE,title:net.server.title,scene:'home'};
  ui.cafeTab='desktop';ui.cafeAttackerTab='desktop';ui.cafeAddress='http://knihovna.test';
  ui.cookieOpen={cafe:false,laptop:false,friend:false,phone:false,cabin:false};
  const addressKey=device=>device==='laptop'?'address':`${device}Address`;
  ui.chatbot={laptop:'',friend:'',phone:'',cabin:''};
  ui.webMessages={cafe:'Ahoj z kavárny, prosím o prodloužení výpůjčky.',friend:'Ahoj, píše Matěj.',cabin:'Ahoj z chaty! Zpráva putuje přes satelit.',laptop:'Ahoj, prosím o prodloužení výpůjčky.',phone:'Ahoj, prosím o prodloužení výpůjčky.'};
  ui.cloud=Object.fromEntries(['laptop','friend','cabin'].map(device=>{const f=net.cloud.local[device][0];return [device,{tab:'local',server:'cloud',localId:f.id,cloudName:f.name,cloudContent:f.content,cloudFileId:'',permissions:{},downloadSerial:0}];}));
  const map=new NetworkMap($('#network-map'),net,select);
  // The SVG also has data-scene; only navigation buttons may reset its viewport.
  const sceneButtons=document.querySelectorAll('.scene-nav button[data-scene]');
  const disabled=()=>sim.status==='running'?'disabled':'';
  const definition=(label,value)=>`<dt>${label}</dt><dd>${esc(value)}</dd>`;
  const button=(action,label,cls='primary-button wide',extra='')=>`<button data-action="${action}" class="${cls}" ${extra}>${label}</button>`;
  function notify(message) {
    clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);
  }
  function stop() {
    if(timer!==null)remaining=Math.max(0,timerDue-performance.now());
    else remaining=Math.max(remaining,map.animationTimeRemaining());
    playing=false;clearTimeout(timer);timer=null;map.setAnimationsPlaying(false);
  }
  function setScene(scene) {
    ui.scene=scene;map.setScene(scene);
    sceneButtons.forEach(b=>{b.classList.toggle('active',b.dataset.scene===scene);b.setAttribute('aria-pressed',b.dataset.scene===scene);});
  }
  function select(kind,id,push=true) {
    const resume=ui.packetOpen&&kind!=='packet'&&ui.packetResume;
    if(kind==='packet') {if(!ui.packetOpen)ui.packetResume=playing;stop();}
    else ui.packetResume=false;
    if(push&&(ui.selection.kind!==kind||ui.selection.id!==id)) {ui.back.push({...ui.selection});if(ui.back.length>20)ui.back.shift();}
    if(kind==='packet'&&(ui.selection.kind!=='packet'||ui.selection.id!==id))ui.packetMember=null;
    ui.selection={kind,id};ui.monitorOpen=kind==='node'&&['laptop','friend','phone','cabin','hacker','cafe','cafe-attacker'].includes(id);ui.deviceOpen=kind==='node'&&!ui.monitorOpen;ui.linkOpen=kind==='link';ui.packetOpen=kind==='packet';if(ui.monitorOpen)ui.monitorDevice=id;syncReader();render();
    $(ui.monitorOpen?'#monitor-content':'#device-content').focus({preventScroll:true});
    if(resume)resumePlayback();
  }
  function closeMonitor() {
    ui.monitorOpen=false;syncReader();render();
    $(`#network-map [data-map-kind="node"][data-id="${ui.monitorDevice}"]`).focus({preventScroll:true});
  }
  function closeDevice() {
    const resume=ui.packetOpen&&ui.packetResume;
    ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;ui.packetResume=false;render();
    ($(`#network-map [data-map-kind="${ui.selection.kind}"][data-id="${ui.selection.id}"]`)||$('#packet-detail')).focus({preventScroll:true});
    if(resume)resumePlayback();
  }
  function backDetail() {
    const selection=ui.back.pop();if(selection)select(selection.kind,selection.id,false);
  }
  function openComputerApp(app) {
    if(!['desktop','web','print','message','cloud','chatbot','network','mail','attack','mitm'].includes(app))return;
    if(ui.monitorDevice==='cafe-attacker'){if(!['desktop','mitm'].includes(app))return;ui.cafeAttackerTab=app;}else if(ui.monitorDevice==='cafe'){if(!['desktop','web','network','mail'].includes(app))return;ui.cafeTab=app;}else if(ui.monitorDevice==='hacker'){if(!['desktop','attack','network'].includes(app))return;ui.hackerTab=app;}else if(ui.monitorDevice==='cabin'){if(app==='print')return;ui.cabinTab=app;}else if(ui.monitorDevice==='friend'){if(!['desktop','web','message','cloud','chatbot','network','mail'].includes(app))return;ui.friendTab=app;}else if(ui.monitorDevice==='phone'){if(['print','cloud'].includes(app))return;ui.phoneTab=app;}else ui.tab=app;syncReader();render();
    const input=$('#monitor-content [data-field]');
    (input||$('#monitor-content')).focus({preventScroll:true});
  }
  function syncReader() {
    net.friend.chatOpen=ui.monitorOpen&&ui.monitorDevice==='friend'&&ui.friendTab==='message'&&net.nodes.friend.on;
    if(net.friend.chatOpen)sim.markRead();
  }
  function resumeMessage() {if(sim.resumePending()){stop();advance();return true;}return false;}
  function loadLocal(device,id) {
    const file=net.cloud.local[device].find(f=>f.id===id);if(!file)return;
    Object.assign(ui.cloud[device],{localId:id,cloudName:file.name,cloudContent:file.content,tab:'local'});
  }
  function saveLocal() {
    const device=ui.monitorDevice,draft=ui.cloud[device];if(!draft)return null;
    const file=net.cloud.saveLocal(device,{id:draft.localId,name:draft.cloudName,content:draft.cloudContent});
    if(!file){notify('Vyplň název souboru do 70 znaků a text do 1200 znaků.');return null;}
    draft.localId=file.id;return file;
  }
  function startCloud(request,localId) {
    const device=ui.monitorDevice;if(ui.packetOpen||sim.status==='running'||!ui.cloud[device])return;
    stop();if(!sim.start('cloud',{device,server:ui.cloud[device].server,request,localId}))return;
    ui.back=[];ui.selection={kind:'node',id:device};ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;
    if(ui.scene==='home')setScene('all');
    advance();
  }
  function changeAccess(id,mode,tower,focusTower=false) {
    if(!net.setAccess(id,mode,tower))return;
    sim.connectionChanged(id);
    if(sim.status!=='running')stop();
    syncReader();notify(`${net.nodes[id].name}: ${mode==='wifi'?'Wi-Fi':mode==='cellular'?'mobilní data':mode==='cable'?'kabel':'odpojeno'}.`);
    if(!resumeMessage())render();
    $(focusTower?'#cell-tower':'#monitor-content [data-access-mode][aria-pressed="true"]')?.focus({preventScroll:true});
  }
  function heading(n) {
    const icon=icons[n.id]||icons[n.type]||icons.server;
    const desc=n.id==='mail'?'Poštovní schránky · přenos e-mailu':n.id==='phish-web'?'Podvodná stránka · jiná doména':n.type==='satellite'?'Nízká oběžná dráha · přenos dat':n.type==='terminal'?'Uživatelský terminál · satelitní přístup':n.id==='sat-gateway'?'Pozemní brána · satelit a internet':n.id==='mobile-core'?'Mobilní síť · brána uživatelských dat':n.type==='bts'?'Základnová stanice · rádiový přístup':n.type==='ap'?'Přístupový bod · Wi-Fi a místní síť':n.id==='laptop'?'Tvůj výchozí bod v síti':n.id==='printer'?'Místní síť · byt na Lipové':n.id==='dns'?'Překládá názvy na IP adresy':n.id==='web'?'Školní knihovna · modelová služba':n.id==='vpn'?'Šifrovaný tunel · vstup a výstup do internetu':n.id==='chatbot'?'Vzdálený výpočet · odpovědi chatbotovi':n.id==='cloud'?'Hlavní úložiště · čtení a zápis':n.id==='cloud-backup'?'Druhé centrum · kopie ke čtení':n.id==='instagram'?'Zprávy mezi účty · Instagram':n.type==='switch'?'Ethernet · přepínání rámců':'IPv4 · směrování paketů';
    return `<div class="device-heading"><span class="device-symbol"><svg viewBox="-42 -42 84 84" aria-hidden="true">${icon}</svg></span><div><h2 id="device-title">${esc(n.name)}</h2><p>${desc}</p></div></div><div class="power-row"><span class="state-pill ${n.on?'':'off'}"><i></i>${n.on?'Zapnuto':'Vypnuto'}</span><button class="toggle-button ${n.on?'danger':''}" data-action="toggle-node" data-id="${n.id}">${n.on?'Vypnout zařízení':'Zapnout zařízení'}</button></div>`;
  }
  function portList(n) {
    return `<div class="port-list">${Object.values(n.interfaces).map(i=> {const l=net.links[i.link],peer=net.nodes[net.peer(l,n.id)];return `<div class="port-item ${net.isActive(l)?'':'off'}"><i class="port-led"></i><code>${i.port}</code><span>${esc(peer.name)}</span><button data-select-link="${l.id}" aria-label="Otevřít spoj ${esc(l.name)}">↗</button></div>`;}).join('')}</div>`;
  }
  function natEndpoint(ip,port) {
    return `${ip}<wbr><span class="nat-port">:${port}</span>`;
  }
  function natComparison(trace) {
    const outgoing=trace.direction==='out',before=trace.before,after=trace.after;
    return `<div class="nat-comparison"><div><small>PŘED PŘEKLADEM</small><code>${natEndpoint(outgoing?before.src:before.dst,outgoing?before.sport:before.dport)}</code></div><span aria-hidden="true">→</span><div><small>PO PŘEKLADU</small><code>${natEndpoint(outgoing?after.src:after.dst,outgoing?after.sport:after.dport)}</code></div></div>`;
  }
  function natTable(n) {
    const nat=net.nat[n.id];if(!nat)return '';
    return `<section class="nat-panel" aria-label="Tabulka NAT"><div class="section-label">PŘEKLAD ADRES A PORTŮ · NAT/PAT</div><p class="hint">Veřejná WAN adresa: <strong>${net.natAddress(n.id)}</strong><br>Router rozlišuje zařízení podle soukromé adresy a portu. Odpověď vrátí podle záznamu v této tabulce.</p>${nat.rows.length?nat.rows.map(row=>`<article class="nat-entry"><div class="nat-entry-heading"><strong>${esc(net.nodes[row.device].name)}</strong><span>${row.protocol}</span></div><div class="nat-comparison"><div><small>V DOMÁCNOSTI</small><code>${natEndpoint(row.insideIp,row.insidePort)}</code></div><span aria-hidden="true">↔</span><div><small>V INTERNETU</small><code>${natEndpoint(row.outsideIp,row.outsidePort)}</code></div></div><p>Protějšek <code>${row.remoteIp}:${row.remotePort}</code><br>Pakety ven: ${row.outbound} · zpět: ${row.inbound}</p></article>`).join(''):'<p class="empty-table">Zatím žádný překlad. Spusť přenos do internetu. Místní tisk přes tento router neprochází.</p>'}<button class="secondary-button wide" data-action="clear-nat" data-id="${n.id}" ${nat.rows.length?'':'disabled'}>Vymazat tabulku NAT</button><p class="hint">Bez záznamu nelze příchozí paket přiřadit zařízení. Nové odchozí spojení založí nový překlad.</p></section>`;
  }
  function decision(n) {
    const d=n.lastDecision;if(!d)return '<div class="note-card"><strong>Zatím žádné rozhodnutí v tomto pokusu.</strong>Spusť přenos a krokuj jej až k tomuto zařízení.</div>';
    const old=d.version!==net.version;
    let html=`<div class="decision"><div class="decision-id">PAKET ${d.packetId}${old?' · PŘED ZMĚNOU SÍTĚ':' · TENTO POKUS'}</div>`;
    if(d.kind==='nat-drop')return html+`<h3>NAT paket nepředal do domácnosti</h3><p>${esc(d.reason)}</p><button class="inline-link" data-select-packet="${d.packetId}">Otevřít tento paket ↗</button></div>`;
    if(d.kind==='satellite')return html+`<h3>Předání satelitních dat</h3><p>Vstup: <code>${d.input}</code><br>Výstup: <code>${d.out}</code></p><button class="inline-link" data-select-packet="${d.packetId}">Otevřít tento paket ↗</button></div>`;
    if(d.kind==='cellular')return html+`<h3>Předání mobilních dat</h3><p>Vstup: <code>${d.input}</code><br>Výstup: <code>${d.out}</code></p><button class="inline-link" data-select-packet="${d.packetId}">Otevřít tento paket ↗</button></div>`;
    if(d.kind==='switch')html+=`<h3>${d.known?'Cílová MAC je známá':'Neznámá cílová MAC → rozeslání'}</h3><p>Vstupní port: <code>${d.input}</code></p><p>Zdrojová MAC: <code>${esc(d.src)}</code><br>Cílová MAC: <code>${esc(d.dst)}</code></p><p>Ze <strong>zdrojové</strong> MAC se naučil port ${d.learned}. ${d.known?`Pro cílovou MAC vybral ${d.known}.`:`Cílová MAC v tabulce nebyla. Kopie poslal na ${d.ports.join(', ')||'žádný port'}.`}</p>`;
    else html+=`<h3>${d.row?'Rozhodnutí podle cílové IP':'Pro cíl není dostupná cesta'}</h3><p>Cílová IP: <code>${d.dst}</code></p>${d.row?`<p>Použitý záznam: <code>${d.row.prefix}</code><br>Výstup: <code>${d.row.out}</code><br>Další uzel: ${d.row.next?`${esc(net.nodes[d.row.next].name)} · ${d.row.nextIp}`:'cílové zařízení v přímo připojené síti'}</p>`:''}`;
    if(d.nat)html+=`<h3>NAT · ${d.nat.direction==='out'?'změna zdroje':'obnovení cíle'}</h3>${natComparison(d.nat)}`;
    return html+`<button class="inline-link" data-select-packet="${d.packetId}">Otevřít tento paket ↗</button>${old?'<p>Tabulky už odpovídají aktuálnímu stavu. Toto je záznam dřívějšího rozhodnutí v tomto pokusu.</p>':''}</div>`;
  }
  function centerInfo(n) {
    const centers={cafe:['Kavárna na rohu','Veřejná Wi-Fi a samostatná síť 192.168.50.0/24. Router používá NAT a vlastní přípojku k poskytovateli C.'],vpn:['VPN centrum','Samostatná síť 192.0.2.128/27 připojená přes poskytovatele E. Tunel končí na VPN serveru, další provoz pokračuje po internetu.'],dc:['Hosting','Web knihovny, DNS, pošta a chatbot sdílejí budovu. Hosting má vlastní síť 203.0.113.0/26 a přípojku k routeru D.'],instagram:['Instagram','Samostatné centrum služby ve vlastní síti 203.0.113.64/26, připojené přes druhého poskytovatele. Ikona představuje skupinu serverů.'],cloud:['Cloud · centrum A','Hlavní soubory a přístupová práva v síti 203.0.113.128/26. Změny se zapisují sem; do centra B se kopírují samostatným přenosem.'],replica:['Cloud · centrum B','Druhá lokalita stejného poskytovatele cloudu, síť 203.0.113.192/26. Uchovává samostatnou kopii a poskytuje ji ke čtení i při výpadku centra A.']};
    const c=centers[n.region];return c?`<div class="center-notice"><strong>${c[0]}</strong><br>${c[1]}</div>`:'';
  }
  function satelliteInfo(n) {
    const terminal=n.id==='sat-terminal',leo=n.id==='sat-leo',router=n.id==='cabin-router';
    const text=terminal?'Venkovní terminál mění přenos z kabelu na obousměrný rádiový spoj. Potřebuje volný výhled na oblohu.':leo?'Přeposílá data mezi anténou na chatě a pozemní stanicí. Weby, Instagram, cloud a chatbot běží na svých serverech na zemi.':router?'Notebook se připojuje přes Wi-Fi nebo kabel. Router posílá internetový provoz do satelitní antény a překládá soukromé adresy pomocí NAT.':'Propojuje satelitní přístup s pozemní sítí poskytovatele. Odsud pakety pokračují běžnými routery k datovým centrům.';
    return `<div class="satellite-notice"><strong>${terminal?'Satelitní přístup · anténa':leo?'LEO · nízká oběžná dráha':router?'Připojení k poskytovateli: satelit':'Brána ze satelitní sítě do internetu'}</strong><p>${text}</p><span>${net.physicalCanReach('cabin-router','sat-gateway')?'Satelitní cesta je dostupná':'Satelitní cesta je přerušená'}</span></div>${terminal?`<div class="satellite-view"><strong>${net.satellite.clearView?'Volný výhled na oblohu':'Výhled antény je zakrytý'}</strong><button class="secondary-button" data-action="satellite-view">${net.satellite.clearView?'Zakrýt výhled antény':'Obnovit volný výhled'}</button></div>`:''}${router?`<div class="satellite-view"><strong>Satelitní přípojka ${net.links['cabin-wan'].on?'zapnutá':'vypnutá'}</strong><button class="secondary-button" data-action="toggle-link" data-id="cabin-wan">${net.links['cabin-wan'].on?'Odpojit satelitní přípojku':'Připojit satelitní přípojku'}</button></div>`:''}${leo?'<div class="note-card"><strong>Jedna zastavená poloha pro přehlednost</strong>Skutečné LEO satelity se pohybují a spojení se mezi nimi předává. Model používá jeden pevně zobrazený satelit; oběžné dráhy a předávání spojení nesimuluje.</div>':''}${!router?`<dl class="dl">${definition('Předané pakety',n.forwarded||0)}${definition('Úloha',leo?'Přenos dat, nikoliv aplikační server':terminal?'Uživatelský satelitní terminál':'Pozemní brána a směrování')}</dl>`:''}<p class="hint">Rádiový let je zpomalený do tří kroků, aby šel sledovat. Nejde o skutečné milisekundy ani porovnání rychlosti poskytovatelů. Přenosová část anténa–satelit předává IP paket beze změny; rádiové protokoly model nerozepisuje. HTTPS i VPN fungují nad tímto připojením.</p><button class="inline-link" data-select-node="cabin" data-open-tab="network">Otevřít notebook na chatě ↗</button>`;
  }
  function cookieServer() {
    const state=net.server.cookies,last=state.last,busy=sim.status==='running';
    return `<section class="cookie-server" aria-label="Serverové záznamy prohlížečů"><div class="section-label">COOKIES · ROZPOZNÁNÍ PROHLÍŽEČE</div><p class="hint">Server hledá identifikátor z hlavičky Cookie. IP adresa ani jméno zařízení tento záznam neurčují. Počet načtení roste při GET stránky; odeslání vzkazu POST se počítá jen do všech požadavků.</p><label class="cookie-toggle"><input type="checkbox" data-cookie-secure ${state.secureOnly?'checked':''} ${busy?'disabled':''}> Vyžadovat HTTPS pro cookie · Secure</label><p class="hint">Přepínač změní příznak Set-Cookie v příští odpovědi. Již uložená cookie se změní až po jejím přijetí. Cookie se Secure poslanou přes HTTP prohlížeč odmítne.</p>${last?`<div class="cookie-server-last"><strong>${last.returning?'Známý prohlížeč':'Nový identifikátor'} · ${esc(last.id)}</strong><p>${last.received?'Přijatá hlavička:':'Požadavek neobsahoval cookie.'}</p>${last.received?`<code>Cookie: ${esc(last.received)}</code>`:''}<p>Hlavička připravená do odpovědi:</p><code>Set-Cookie: ${esc(last.setCookie)}</code>${sim.packets.has(last.packetId)?`<button class="inline-link" data-select-packet="${last.packetId}">Prozkoumat přijatý paket ↗</button>`:''}</div>`:''}<div class="cookie-server-list">${state.visitors.size?[...state.visitors.values()].map(v=>`<article class="cookie-server-row ${last?.id===v.id?'used':''}"><div><strong>${esc(v.id)}</strong>${last?.id===v.id?'<span>Poslední požadavek</span>':''}</div><p>Načtení stránky: <b>${v.loads}</b> · Všechny požadavky: ${v.requests}</p><small>Poslední zdroj: ${esc(v.lastIp)} · ${v.lastProtocol}</small></article>`).join(''):'<p class="empty-table">Žádné záznamy. Otevři web knihovny v některém zařízení.</p>'}</div><div class="note-card">Smazání cookies v zařízení tyto záznamy neodstraní. Bez původního ID další požadavek vytvoří nový záznam. ID v1, v2… je názorná pomůcka; nejde o bezpečný přihlašovací token.</div><div class="cookie-browser-links">${['laptop','friend','phone','cabin'].map(id=>`<button class="secondary-button" data-select-node="${id}" data-open-tab="web">${esc(net.nodes[id].name)} ↗</button>`).join('')}</div></section>`;
  }
  function deviceDetail(n) {
    let html=heading(n)+centerInfo(n);
    if(['mail','phish-web'].includes(n.id))return html+globalThis.InternetLab.phishingServerDetail(net,sim,n)+`<dl class="dl">${definition('IP adresa',n.ip)}${definition('MAC adresa',n.mac)}</dl>${portList(n)}`;
    if(['terminal','satellite'].includes(n.type))return html+satelliteInfo(n)+decision(n)+`<div class="section-label">PŘIPOJENÍ</div>${portList(n)}`;
    if(n.type==='bts')return html+`<p class="hint">Spojuje telefon rádiem se sítí mobilního operátora. Přijatá data předává po své přípojce dál.</p><div class="status-box"><strong>${net.access.phone.mode==='cellular'&&net.access.phone.tower===n.id?'Telefon má vybranou tuto BTS':'Telefon tuto BTS právě nepoužívá'}</strong>${n.name}</div>${decision(n)}<div class="section-label">PŘIPOJENÍ</div>${portList(n)}<div class="note-card">BTS zajišťuje rádiový přístup. Uživatelská data pokračují sítí operátora k jeho bráně do internetu. Vnitřní IP adresy a TCP segmenty při tomto předání zůstávají stejné.</div><button class="secondary-button wide" data-select-node="phone" data-open-tab="network">Připojení telefonu ↗</button>`;
    if(n.type==='ap')html+=`<div class="status-box"><strong>Wi-Fi síť: ${n.id==='cabin-ap'?'Chata':n.id==='ap'?'Lipova':'U Mateje'}</strong>Přístupový bod propojuje bezdrátová zařízení se switchem v domácí síti.</div>`;
    if(n.type==='switch'||n.type==='ap') {
      html+=`<p class="hint">${n.type==='ap'?'Přemosťuje Wi-Fi a Ethernet uvnitř jedné LAN.':'Přeposílá ethernetové rámce uvnitř jedné LAN.'} Pro rozhodování používá MAC adresy.</p>${decision(n)}<div class="section-label">AKTUÁLNÍ TABULKA MAC ADRES</div>`;
      const entries=Object.entries(n.macTable);
      html+=entries.length?`<table class="data-table"><thead><tr><th>NAUČENÁ ZDROJOVÁ MAC</th><th>PORT</th></tr></thead><tbody>${entries.map(([mac,port])=>`<tr class="${n.lastDecision?.src===mac?'used':''}"><td class="mac-cell">${mac}</td><td>${port}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-table">Tabulka je prázdná. První příchozí rámec přidá zdrojovou adresu a vstupní port.</p>';
      html+=`<div class="section-label">PORTY · STAV PŘEPOSÍLÁNÍ</div>${portList(n)}<div class="note-card">Všechny aktivní porty patří do jedné LAN a přeposílají. Neznámý unicast se rozesílá na ostatní aktivní porty; cílová MAC se přitom nemění. Tabulka na začátku není předvyplněná.</div>`;
    } else if(n.type==='router') {
      if(['cabin-router','sat-gateway'].includes(n.id))html+=satelliteInfo(n);
      if(n.id==='mobile-core')html+='<div class="note-card"><strong>Brána mobilních dat do internetu</strong>Převezme data od BTS a směruje je dál. Návratové pakety pošle přes vybranou BTS do telefonu. Model shrnuje uživatelskou část mobilního jádra (například UPF).</div>';
      html+=`${natTable(n)}<p class="hint">IP paket předává podle <strong>cílové IP adresy</strong>. Další spoj určuje nejpřesnější odpovídající záznam v tabulce.</p>${decision(n)}<div class="section-label">AKTUÁLNÍ SMĚROVACÍ TABULKA</div>`;
      html+=n.routes.length?`<table class="data-table"><thead><tr><th>CÍLOVÁ SÍŤ</th><th>DALŠÍ IP</th><th>VÝSTUP</th></tr></thead><tbody>${n.routes.map(r=>`<tr class="${n.lastDecision?.version===net.version&&n.lastDecision?.row?.prefix===r.prefix&&n.lastDecision?.row?.link===r.link?'used':''}"><td>${r.prefix}</td><td>${r.nextIp||'přímo'}</td><td>${r.out}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-table">Žádná dostupná cesta.</p>';
      html+=`<details><summary class="hint">Rozhraní a připravené adresy</summary><dl class="dl">${Object.values(n.interfaces).map(i=>['satellite','satellite-access'].includes(net.links[i.link].medium)?definition(`${i.port} · satelitní přenos`,i.ip||'Přenosový kanál bez samostatné IP'):net.links[i.link].medium==='backhaul'?definition(`${i.port} · přípojka BTS`,'Uživatelský kanál mobilní sítě'):definition(`${i.port} · ${net.links[i.link].prefix}`,`${i.ip} · ${i.mac}`)).join('')}</dl></details><div class="section-label">PŘIPOJENÉ SPOJE</div>${portList(n)}<div class="note-card">Tabulky se po změně spojů přepočítají okamžitě. Metrikou je počet spojů modelové cesty. Při shodě zůstává výběr stabilní, horní větev má přednost. Délka čáry na obrázku není metrika.</div>`;
    } else if(n.id==='dns') {
      html+=`<p class="hint">Odpovídá na otázku „Jakou IP adresu má knihovna.test?“ Webovou stránku neposkytuje.</p><div class="section-label">PŘIPRAVENÝ DNS ZÁZNAM</div><table class="data-table"><thead><tr><th>NÁZEV</th><th>TYP</th><th>ODPOVĚĎ</th></tr></thead><tbody>${Object.entries(net.dnsRecords).map(([name,ip])=>`<tr><td>${name}</td><td>A</td><td>${ip}</td></tr>`).join('')}</tbody></table><dl class="dl">${definition('IP adresa DNS serveru',n.ip)}${definition('Výchozí brána','203.0.113.1')}${definition('MAC adresa',n.mac)}</dl><div class="note-card">Notebook má adresu tohoto DNS serveru připravenou. Úspěšnou DNS odpověď si pamatuje do obnovení modelu. Následující načtení webu už DNS nepotřebuje.</div>${portList(n)}`;
    } else if(n.id==='web') {
      html+=`<div class="section-label">OBSAH WEBU · VERZE ${net.server.revision}</div><form data-form="server"><label class="field-label" for="server-title">NADPIS NA STRÁNCE KNIHOVNA.TEST</label><textarea id="server-title" data-field="title" maxlength="100" style="min-height:82px" required>${esc(ui.title)}</textarea><button type="submit" class="primary-button wide" style="margin-top:10px">Uložit obsah serveru</button></form><p class="hint">Změna se projeví až v nové odpovědi serveru. Už otevřená stránka na notebooku se sama nezmění.</p><button class="inline-link" data-select-node="laptop" data-open-tab="web">Otevřít prohlížeč na notebooku ↗</button>`;
      html+=`<dl class="dl">${definition('IP adresa',n.ip)}${definition('Služby','HTTP · TCP/80 a HTTPS · TLS nad TCP/443')}${definition('Pravidlo HTTP cache','Cache-Control: no-store')}${definition('MAC adresa',n.mac)}</dl>${portList(n)}`;
      html+=cookieServer();
      const cert=net.server.certificate,last=net.server.lastRequest;
      html+=`<div class="section-label">HTTPS · CERTIFIKÁT SERVERU</div><div class="note-card"><strong>${esc(cert.name)}</strong>Vydavatel: ${esc(cert.issuer)}<br>${cert.valid&&cert.trusted&&cert.name==='knihovna.test'?'Platný a důvěryhodný pro knihovna.test':'Certifikát neprojde ověřením pro knihovna.test'}</div><label class="field-label" for="web-certificate">MODELOVÝ STAV CERTIFIKÁTU</label><select class="text-input" id="web-certificate" data-web-certificate><option value="valid" ${cert.valid&&cert.trusted&&cert.name==='knihovna.test'?'selected':''}>Platný certifikát</option><option value="expired" ${!cert.valid?'selected':''}>Platnost vypršela</option><option value="wrong-name" ${cert.name!=='knihovna.test'?'selected':''}>Patří jiné doméně</option><option value="untrusted" ${!cert.trusted?'selected':''}>Nedůvěryhodný vydavatel</option></select><p class="hint">Prohlížeč certifikát ověří při novém HTTPS spojení. Neplatný certifikát zabrání odeslání formuláře. HTTP certifikát nepoužívá.</p>${last?`<div class="section-label">POSLEDNÍ ZPRACOVANÝ POŽADAVEK</div><div class="note-card"><strong>${last.secure?'HTTPS · dešifrováno na serveru':'HTTP · přijato jako čitelný text'}</strong>${esc(net.nodes[last.client].name)} · ${esc(last.method)} ${esc(last.path)}<br>Zdroj viděný webem: ${esc(last.sourceIp)}:${last.sourcePort}</div><div class="payload-preview">${esc(requestText(last))}</div>`:''}`;
    } else if(n.id==='vpn') {
      const v=net.vpn,last=v.last;
      html+=`<p class="hint">Šifrovaný tunel končí zde. VPN server sejme vnější obal a původní paket předá do internetu. Cílová služba uvidí jeho veřejnou IP. Případné HTTPS uvnitř server VPN nedešifruje.</p><div class="status-box"><strong>Veřejná IP VPN: ${n.ip}</strong>Rozbaleno směrem do internetu: ${formatPackets(v.sent)}<br>Zabaleno zpět do zařízení: ${formatPackets(v.received)}</div><div class="section-label">ZAŘÍZENÍ A TUNELY</div>${Object.entries(v.clients).map(([id,c])=>`<div class="vpn-client-row"><strong>${esc(net.nodes[id].name)}</strong><span>${!c.enabled?'VPN vypnutá':net.vpnPeerValid(id)?'Tunel aktivní':'VPN zapnutá · čeká na spojení'}</span><small>${c.enabled?`Vnitřní IP ${c.ip} · ven ${c.sent} / zpět ${c.received}`:''}</small><button class="inline-link" data-select-node="${id}" data-open-tab="network">Nastavení připojení ↗</button></div>`).join('')}${last?`<div class="section-label">POSLEDNÍ PAKET · POHLED VPN SERVERU</div><div class="vpn-layer-note"><strong>${last.https?'Uvnitř zůstává HTTPS/TLS':'Vnitřní paket lze předat dál'}</strong><p>${last.direction==='out'?'Směr k cílové službě':'Odpověď pro zařízení'} · ${esc(net.nodes[last.client].name)}</p></div><div class="payload-preview">${esc(last.preview)}</div>${sim.packets.has(last.packetId)?`<button class="inline-link" data-select-packet="${last.packetId}">Prozkoumat tento paket ↗</button>`:''}`:''}<div class="section-label">VÝSTUP DO INTERNETU · NAT/PAT</div>${v.rows.length?v.rows.map(r=>`<article class="vpn-exit-row"><strong>${esc(net.nodes[r.client].name)} · ${r.protocol}</strong><code>${r.insideIp}:${r.insidePort} ↔ ${r.outsideIp}:${r.outsidePort}</code><span>Protějšek ${r.remoteIp}:${r.remotePort}<br>Ven ${r.outbound} · zpět ${r.inbound}</span></article>`).join(''):'<p class="empty-table">Zatím žádný přenos přes VPN.</p>'}<p class="hint">VPN neznamená anonymitu. Provozovatel VPN zná cílové služby; HTTP může číst, obsah HTTPS chrání samostatné TLS mezi prohlížečem a webem.</p><dl class="dl">${definition('Síť VPN centra','192.0.2.128/27')}${definition('VPN služba','Modelový šifrovaný tunel · UDP / 51820')}${definition('MAC',n.mac)}</dl>${portList(n)}`;
    } else if(n.id==='chatbot') {
      const server=net.chatbot.server,state={idle:'Čeká na první dotaz',receiving:'Přijímá dotaz',processing:`Zpracovává dotaz · ${server.step} / 3`,ready:'Odpověď připravena na serveru',interrupted:'Zpracování přerušeno'}[server.state];
      html+=`<p class="hint">Zařízení odešle text po síti. Teprve po přijetí celého dotazu tento server spustí program chatbota a připraví odpověď.</p><div class="status-box"><strong>${state}</strong>Dokončené výpočty: ${server.processed}<br>Přijato z posledního dotazu: ${server.receivedBytes} / ${server.totalBytes} B${server.client?`<br>Zařízení: ${esc(net.nodes[server.client].name)}`:''}</div>${server.prompt?`<div class="section-label">POSLEDNÍ CELÝ DOTAZ NA SERVERU</div><div class="payload-preview">${esc(server.prompt)}</div>`:''}${server.answer?`<div class="endpoint-result"><strong>Odpověď připravená na serveru</strong>${esc(server.answer)}</div><p class="hint">Připravená odpověď ještě nemusí být doručená. Zařízení ji zobrazí až po návratu všech bajtů.</p>`:''}<div class="note-card"><strong>Výpočet probíhá zde</strong>Tři kroky názorně oddělují přijetí dotazu, spuštění programu a přípravu odpovědi. Program v této ukázce vrací vždy stejný text. Routery dotaz jen předávají a zařízení zobrazuje doručený výsledek.</div><button class="secondary-button wide" data-select-node="laptop" data-open-tab="chatbot">Otevřít Chatbot na notebooku ↗</button><dl class="dl">${definition('IP adresa',n.ip)}${definition('Služba','Modelový chatbot · TCP / 443')}${definition('MAC adresa',n.mac)}</dl>${portList(n)}`;
    } else if(n.id==='instagram') {
      const ig=net.instagram;
      html+=`<p class="hint">Převezme zprávu pro účet @matej a doručí ji druhým spojením do jeho domácnosti.</p><div class="section-label">ZPRÁVA PRO MATĚJE</div>`;
      const state={idle:'Zatím žádná zpráva',receiving:'Přijímání od tebe',queued:'Uloženo · čeká na připojení Matěje',delivering:'Doručování Matějovi',delivered:'Doručeno Matějovi',failed:'Zpráva na Instagram nedorazila'}[ig.state];
      html+=`<div class="status-box ${ig.state==='failed'?'error':''}"><strong>${state}</strong>Ty → Instagram: ${ig.receivedBytes} / ${ig.totalBytes} B<br>Instagram → Matěj: ${net.friend.receivedBytes} / ${ig.totalBytes} B</div>${ig.text?`<div class="endpoint-result"><strong>Zpráva uchovaná na serveru</strong>${ig.content?.type!=='text'?messagePreview(ig.content):esc(ig.text)}</div>`:''}${ig.readKnown?`<div class="status-box"><strong>Instagram přijal potvrzení přečtení</strong>${ig.readNotified?'Potvrzení už dorazilo i do tvého zařízení.':'Čeká na doručení do tvého zařízení.'}</div>`:''}<div class="action-row"><button class="secondary-button" data-select-node="${ig.senderDevice}" data-open-tab="message">Tvůj Instagram ↗</button><button class="secondary-button" data-select-node="friend" data-open-tab="message">Matějův Instagram ↗</button></div>${ig.state==='queued'?'<button class="inline-link" data-action="resume-message">Zkusit doručit znovu ↗</button>':''}<dl class="dl">${definition('IP adresa',n.ip)}${definition('Služba','Modelové spojení Instagramu · TCP / 443')}${definition('Příjemce zprávy','Účet @matej')}${definition('MAC adresa',n.mac)}</dl><div class="note-card">Na obou stranách služby jsou samostatná spojení. Pro druhé spojení vznikají nové pakety s vlastními IP adresami, TCP SEQ a rozdělením dat. Přijatá zpráva může na serveru počkat.</div>${portList(n)}`;
    } else if(n.id==='cloud'||n.id==='cloud-backup') {
      const last=n.lastDecision,storage=net.cloud,backup=n.id==='cloud-backup',files=backup?storage.replica.files:storage.files;
      html+=`<div class="center-notice ${storage.replicaCurrent()?'':'stale'}"><strong>${storage.replicaCurrent()?'Kopie v centru B je aktuální':'Kopie v centru B čeká na synchronizaci'}</strong><br>Stav dat A: ${storage.revision} · kopie B: ${storage.replica.revision}<br>${esc(storage.replica.message)}</div><button class="secondary-button wide" data-action="cloud-sync" ${sim.status==='running'?'disabled':''}>Synchronizovat centra A → B</button><p class="hint">Přenos kopíruje soubory i práva po síti. Centrum B poskytne čtení pouze z aktuální kopie; změny se ukládají do A.</p>`;
      html+=`<p class="hint">Cloud ukládá soubory na vzdáleném serveru. Každý požadavek kontroluje podle přihlášeného uživatele a práv souboru. IP adresa slouží k doručení; totožnost představuje připravené přihlášení v aplikaci.</p>${last?`<div class="decision"><h3>Poslední požadavek · ${last.status}</h3><p>${esc(last.user)} · ${esc({list:'seznam souborů',download:'stažení souboru',upload:'uložení souboru',permissions:'změna přístupu'}[last.operation])}</p><p>${esc(last.message)}</p><button class="inline-link" data-select-packet="${last.packetId}">Otevřít tento paket ↗</button></div>`:''}<div class="section-label">SOUBORY NA SERVERU · POHLED SPRÁVCE</div>${[...files.values()].map(f=>`<div class="note-card"><strong>${esc(f.name)}</strong>${esc(f.id)} · verze ${f.version} · vlastník ${f.owner==='ty'?'Ty':'Matěj'}<br>${Object.entries(f.permissions).filter(([,v])=>v!=='none').map(([id,role])=>`${id==='ty'?'Ty':'Matěj'}: ${role==='write'?'čtení a úpravy':'čtení'}`).join(', ')||'Soukromý soubor'}</div>`).join('')}<div class="action-row" style="margin-top:16px"><button class="secondary-button" data-select-node="laptop" data-cloud-server="${n.id}" data-open-tab="cloud">Tvůj cloud ↗</button><button class="secondary-button" data-select-node="friend" data-cloud-server="${n.id}" data-open-tab="cloud">Matějův cloud ↗</button></div><dl class="dl">${definition('IP adresa',n.ip)}${definition('Služba','Modelové spojení cloudu · TCP / 443')}${definition('MAC adresa',n.mac)}</dl><div class="note-card">Správcovský přehled ukazuje globální stav simulace. V noteboocích se seznam i obsah souborů zobrazí až po přijetí odpovědi serveru. Stažená místní kopie zůstává i po odebrání přístupu.</div>${portList(n)}`;
    } else if(n.id==='printer') {
      html+=`<p class="hint">Přijímá dokument přímo z místní sítě. Odpojení poskytovatele místnímu tisku nevadí.</p>`;
      html+=net.printer.count?`<div class="endpoint-result"><strong>Vytištěné dokumenty · ${net.printer.count}</strong>${esc(net.printer.document)}</div>`:'<div class="doc-preview"><div class="doc-sheet" aria-hidden="true"><strong>Připraveno<br>k tisku</strong><i></i><i></i><i></i></div><p>Tiskárna čeká na dokument.</p></div>';
      if(net.printer.state==='error')html+='<div class="status-box error">Poslední tiskový pokus selhal. Dříve vytištěné dokumenty zůstávají vytištěné.</div>';
      html+=`<dl class="dl">${definition('IP adresa / podsíť',`${n.ip} / 24`)}${definition('MAC adresa',n.mac)}${definition('Modelová tisková služba','TCP · port 9100')}</dl><button class="secondary-button wide" data-select-node="laptop" data-open-tab="print">Otevřít dokument na notebooku ↗</button><div class="section-label">PŘIPOJENÍ</div>${portList(n)}`;
    }
    return html;
  }
  function linkDetail(id) {
    const l=net.links[id],a=net.nodes[l.a],b=net.nodes[l.b],active=net.isActive(l),unused=!net.selectedAccess(l),radio=['wifi','cellular','satellite'].includes(l.medium),medium={'satellite-access':'Kabel do satelitního terminálu','satellite':'Satelitní rádio · obousměrný přenos',cable:'Kabel · Ethernet',wifi:'Wi-Fi · rádio',cellular:'Mobilní data · rádio',backhaul:'Přípojka BTS · přenos do mobilního jádra'}[l.medium];
    return `<h2 id="link-title">${esc(l.name)}</h2><p class="hint">${esc(a.name)} <span aria-hidden="true">↔</span> ${esc(b.name)}</p><div class="link-visual ${active?'':'disconnected'}"><span aria-hidden="true">○</span><i></i><span aria-hidden="true">○</span></div><div class="power-row"><span class="state-pill ${active?'':'off'}"><i></i>${unused?'Připojení není vybrané':active?'Spoj je dostupný':!l.on?'Spoj je odpojený':'Zařízení nebo připojení je nedostupné'}</span></div>${radio||l.medium==='backhaul'?`<div class="note-card"><strong>${medium}</strong>${l.medium==='satellite'?'Rádiová část satelitního přístupu spojuje uživatelskou anténu, satelit LEO a pozemní stanici. Ta předává pakety do pozemního internetu. Let je zpomalený do tří modelových kroků.':l.medium==='wifi'?'Rádiový úsek vede pouze k přístupovému bodu. Dál data pokračují domácí sítí.':'Telefon komunikuje přes BTS a síť operátora. Domácí Wi-Fi ani přípojku bytu tato cesta nepoužívá.'}</div>`:''}${l.device?`<button class="inline-link" data-select-node="${l.device}" data-open-tab="network">Vybrat připojení zařízení ↗</button>`:''}${button('toggle-link',l.on?'Odpojit spoj':'Obnovit spoj',l.on?'toggle-button danger wide':'primary-button wide',`data-id="${id}"`)}<dl class="dl" style="margin-top:24px">${definition('První konec',`${a.name} · ${l.pa}`)}${definition('Druhý konec',`${b.name} · ${l.pb}`)}${definition('Připojená síť',l.prefix)}${definition('Způsob přenosu',medium)}${definition(radio?'Dostupnost rádiového spoje':'Stav spoje',l.on?'povoleno':'odpojeno')}</dl><div class="note-card"><strong>${['cabin-wan','sat-uplink','sat-downlink','sat-internet'].includes(id)?'Satelitní přípojka chaty.':id==='friend-uplink'?'Připojení Matějovy domácnosti.':id==='north-peer'?'Propojení dvou poskytovatelů.':id==='uplink'?'Přípojka do světa.':id==='dc-access'?'Přípojka hostingu.':['edge-north','north-dc','edge-south','south-dc'].includes(id)?'Dvě větve, jeden cíl.':l.medium==='cellular'?'Rádiové spojení s BTS.':l.medium==='backhaul'?'Přípojka základnové stanice.':id==='mobile-uplink'?'Výstup mobilního operátora do internetu.':'Spojení uvnitř jedné LAN.'}</strong>${['cabin-wan','sat-uplink','sat-downlink','sat-internet'].includes(id)?'Přerušení této cesty odpojí chatu od internetu. Wi-Fi a kabel uvnitř chaty mohou zůstat dostupné.':id==='friend-uplink'||id==='north-peer'?'Odpojení přeruší cestu k Matějovi. Zpráva přijatá Instagramem na serveru počká.':id==='uplink'?'Její odpojení oddělí byt od poskytovatele. Notebook a tiskárna spolu mohou dál komunikovat.':id==='dc-access'?'Odpojení znepřístupní web a DNS hostingu. Instagram a obě cloudová centra mají vlastní přípojky.':['edge-north','north-dc','edge-south','south-dc'].includes(id)?'Po odpojení používané větve může přenos pokračovat druhou větví. Zkus stejnou akci zopakovat.':'Při odpojení tohoto spoje přes něj žádná nová data neprojdou.'}</div><p class="hint">Změna dostupnosti okamžitě aktualizuje směrovací tabulky modelu. Paket ztracený na odpojeném spoji se nepřesune jinam.</p><div class="action-row"><button class="secondary-button" data-select-node="${a.id}">${esc(a.name)} ↗</button><button class="secondary-button" data-select-node="${b.id}">${esc(b.name)} ↗</button></div>`;
  }
  function packetGroupDetail(p) {
    const pl=p.payload;
    return `<div class="packet-pause-note"><span aria-hidden="true">▤</span><div><strong>Skupina ${pl.packetCount} datových paketů</strong><span>Zhuštěné zobrazení více běžných paketů, každý s nejvýše ${pl.mss} B dat.</span></div></div><h2 id="packet-title">Pakety ${pl.index+1}–${pl.index+pl.packetCount} z ${pl.total.toLocaleString('cs-CZ')}</h2><p class="hint">${esc(p.kind==='message'?'Ty → Instagram':'Instagram → Matěj')} · ${esc(net.nodes[p.location].name)} · ${({delivered:'doručeno',lost:'skupina se ztratila',stopped:'přenos byl zastaven',waiting:'čeká na odeslání'})[p.state]||'přenos pozastaven při prohlížení'}</p><div class="note-card"><strong>${formatBytes(pl.bytes.length)} dat v této skupině</strong>Bajty ${pl.offset+1}–${pl.end} z ${pl.totalBytes.toLocaleString('cs-CZ')}. Všechny pakety skupiny používají v modelu stejnou trasu. Jejich průchod se přehrává společně; nejde o jeden velký IP paket.</div><button class="primary-button wide" data-group-member="0">Prozkoumat první paket</button><details class="packet-members"><summary>Rozbalit skupinu na jednotlivé pakety (${pl.packetCount})</summary><p class="hint">Vyber číslo a prohlédni si samostatné TCP SEQ, rozsah bajtů a velikost paketu.</p><div>${Array.from({length:pl.packetCount},(_,i)=>`<button class="secondary-button" data-group-member="${i}" aria-label="Prozkoumat datový paket ${pl.index+i+1}">${pl.index+i+1}</button>`).join('')}</div></details>`;
  }
  function vpnPacketDetail(p) {
    const c=net.vpn.clients[p.vpn.client],out=p.vpn.direction==='out',count=p.payload.packetCount||1;
    return `${sim.status==='running'?'<div class="packet-pause-note"><span>Ⅱ</span><div><strong>Přenos je pozastavený</strong><span>Po zavření okna může pokračovat.</span></div></div>':''}<div class="packet-heading"><div class="packet-illustration vpn">▣</div><div><h2 id="packet-title">VPN · paket uvnitř paketu</h2><p>${out?'Zařízení → VPN server':'VPN server → zařízení'} · ${esc(p.id)}</p></div></div><div class="vpn-packet-diagram"><div class="vpn-outer-title">VNĚJŠÍ IP PAKET · ČITELNÝ OBAL</div><dl class="dl">${definition('Zdrojová IP',p.src)}${definition('Cílová IP',p.dst)}${definition('Protokol a porty',`UDP · ${p.sport} → ${p.dport}`)}${definition('TTL vnějšího paketu',p.ttl)}</dl><div class="vpn-sealed-packet"><span aria-hidden="true">▣</span><strong>${count>1?`${count} původních paketů · zhuštěné zobrazení`:'Původní IP paket'}</strong><p>Šifrovaný obsah včetně vnitřních IP adres a dat. Na tomto úseku nelze přečíst požadavek, vzkaz ani cílový web.</p><code>${Array.from(p.payload.cipher.slice(0,48),b=>b.toString(16).padStart(2,'0')).join(' ')} …</code></div></div><div class="note-card"><strong>VPN obal se otevře až na konci tunelu</strong>${out?'VPN server původní paket rozbalí a předá dál. HTTP bude za VPN čitelné; případné HTTPS zůstane chráněné.':'Zařízení odstraní VPN obal. Pokud původní paket obsahuje HTTPS, prohlížeč následně dešifruje ještě TLS.'}</div>${p.natHistory.map(t=>`<section class="nat-translation"><h3>NAT vnějšího VPN paketu · ${esc(net.nodes[t.router].name)}</h3>${natComparison(t)}</section>`).join('')}<button type="button" class="secondary-button wide" data-select-node="vpn">Prohlédnout VPN server ↗</button><p class="hint">VPN běží nad vybraným připojením zařízení ${esc(net.nodes[p.vpn.client].name)}. Velikost a načasování přenosu zůstávají pozorovatelné. Bajty představují výukový model šifrování a ověření, nikoliv skutečnou kryptografii.</p>`;
  }
  function packetDetail(id) {
    let p=sim.packets.get(id);if(!p)return '<h2 id="packet-title">Paket už není součástí tohoto pokusu.</h2><p class="hint">Vyber paket z právě probíhajícího přenosu.</p>';
    if(p.kind.startsWith('vpn-'))return vpnPacketDetail(p);
    const group=p.payload.packetCount>1?p:null;
    if(group){if(ui.packetMember===null)return packetGroupDetail(group);p=sim.packetMember(group,ui.packetMember)||sim.packetMember(group,0);}
    const pl=p.payload,segmented=Boolean(pl.bytes);
    let html=`${group?'<button class="inline-link" data-action="packet-group">← Zpět na celou skupinu</button>':''}${sim.status==='running'?`<div class="packet-pause-note"><span aria-hidden="true">Ⅱ</span><div><strong>Přenos je pozastavený</strong><span>${ui.packetResume?'Po zavření okna bude pokračovat.':'Pokračovat můžeš po zavření okna.'}</span></div></div>`:''}<div class="packet-heading"><div class="packet-illustration ${p.direction}">${p.direction==='response'?'↩':'→'}</div><div><h2 id="packet-title">${esc(p.label)}</h2><p>Pokus ${p.run} · paket ${p.id}</p></div></div><div class="status-box ${p.state==='lost'?'error':''}"><strong>${p.state==='lost'?'Ztracený paket':p.state==='delivered'?'Doručený paket':p.state==='waiting'?'Připravený k odeslání':p.state==='stopped'?'Přenos paketu byl zastaven':'Paket v přenosu'}</strong>${esc(net.nodes[p.location]?.name||'')} · ${p.kind==='cloud-replica'?'kopie mezi centry':p.kind==='ig-read'?'potvrzení aplikace':p.kind==='ig-delivery'?'Instagram → Matěj':p.kind==='message'?'ty → Instagram':p.direction==='response'?'odpověď serveru':'požadavek / data klienta'}</div>`;
    if(p.vpnHistory?.length)html+=`<div class="vpn-layer-note"><strong>VPN obal byl odstraněn ${p.vpn.stage==='exit'?'na VPN serveru':'v zařízení'}</strong><p>Nyní prohlížíš původní vnitřní paket. ${p.payload.record?'Jeho obsah dál chrání HTTPS/TLS.':'VPN už tento úsek nešifruje.'}</p><details><summary>Vnější obal během průchodu tunelem</summary>${p.vpnHistory.map(t=>`<dl class="dl">${definition('Vnější zdroj',t.received.src)}${definition('Vnější cíl',t.received.dst)}${definition('VPN protokol','UDP / 51820')}</dl>`).join('')}</details></div>`;
    if(p.mitmHistory?.length)html+=`<section class="mitm-packet-note"><strong>Průchod útočníkovým hotspotem</strong>${p.mitmHistory.map(row=>`<p>${esc(row.result)}</p>`).join('')}<button class="inline-link" data-select-node="cafe-attacker" data-open-tab="mitm">Co viděl útočník ↗</button></section>`;
    if(p.natHistory?.length)html+=p.natHistory.map(trace=>`<section class="nat-translation"><h3>NAT · ${esc(net.nodes[trace.router].name)}</h3><p>${trace.direction==='out'?'Změnila se zdrojová IP adresa a port.':'Cílová IP adresa a port se obnovily podle tabulky NAT.'}</p>${natComparison(trace)}<p>${p.protocol} · protějšek ${trace.mapping.remoteIp}:${trace.mapping.remotePort}</p><button class="inline-link" data-select-node="${trace.router}">Otevřít tabulku NAT routeru ↗</button></section>`).join('');
    if(segmented)html+=`<div class="note-card"><strong>Pomůcka modelu: část ${pl.index+1} z ${pl.total}</strong>${p.connection==='replica'?'Bajty kopie souborů a přístupových práv':p.connection==='cloud'?'Bajty cloudového požadavku nebo odpovědi':'Bajty odesílaného obsahu'} ${pl.offset+1}–${pl.end} z ${pl.totalBytes}. Toto pořadové označení není pole IP ani TCP.</div>`;
    html+=`<div class="protocol-box"><h3>IP PAKET · IPv4</h3><dl class="dl">${definition('Zdrojová IP adresa',p.src)}${definition('Cílová IP adresa',p.dst)}${definition('Protokol / TTL',`${p.protocol} / ${p.ttl}`)}${segmented?definition('Celková délka modelového IP paketu',`${40+pl.bytes.length} B · 20 B IPv4 + 20 B TCP + data`):''}</dl></div><div class="protocol-box tcp"><h3>${p.protocol==='TCP'?'PŘENÁŠENÝ TCP SEGMENT':'PŘENÁŠENÝ UDP DATAGRAM'}</h3><dl class="dl">${definition('Zdrojový port → cílový port',`${p.sport} → ${p.dport}`)}${p.protocol==='TCP'?definition('Pořadové číslo TCP · SEQ',p.seq):''}${pl.bytes?definition('Data tohoto segmentu',`${pl.bytes.length} B · SEQ ${p.seq} až ${p.seq+pl.bytes.length-1}`):''}</dl></div>`;
    if(p.connection==='replica')html+='<div class="note-card"><strong>Cloud A → Cloud B · synchronizace center</strong>Snímek souborů, verzí a přístupových práv putuje po skutečné trase modelové sítě. Kopie se vymění až po složení všech bajtů. Jde o oddělený přenos mezi servery.</div>';
    else if(p.connection==='cloud')html+=`<div class="note-card"><strong>Spojení notebook ↔ cloudový server</strong>Modelová služba TCP/443. Přístup ověřuje server podle připraveného uživatelského přihlášení; běžné routery předávají pakety a domácí NAT překládá adresu i port.</div>`;
    else if(['http','https'].includes(p.connection))html+=`<div class="web-packet-visibility ${p.connection}"><strong>${p.connection==='https'?'HTTPS · obsah chrání TLS':'HTTP · obsah není šifrovaný'}</strong><p>${p.connection==='https'?'Na síti jsou vidět IP adresy, porty, velikost a načasování přenosu. HTTP metoda, cesta, cookies, formulář i odpověď jsou chráněné. Čitelný obsah má prohlížeč a server.':'Pohled pozorovatele na síti: požadavek i odpověď lze přečíst, včetně odeslaného vzkazu.'}</p></div>`;
    else if(p.connection==='chatbot')html+='<div class="note-card"><strong>Zařízení ↔ server chatbota</strong>Dotaz putuje na server 203.0.113.30. Server zpracuje až celý dotaz, připraví odpověď a odešle nové pakety zpět po stejném spojení. V zařízení se odpověď zobrazí až po doručení.</div>';
    else if(p.connection==='phishing-api')html+='<div class="note-card"><strong>Pošta / správa podvodného serveru</strong>Přenáší se skutečný modelový požadavek nebo odpověď s připraveným přihlášením. Obsah chrání model TLS; handshake tohoto připraveného API se nerozepisuje. E-mail i záznamy se v zařízení zobrazí až po doručení.</div>';
    else if(p.connection)html+=`<div class="note-card"><strong>${p.connection==='ty-instagram'?`Spojení: ${esc(net.nodes[net.instagram.senderDevice].name)} ↔ Instagram`:'Spojení: Instagram ↔ Matějův notebook'}</strong>${p.kind==='ig-delivery'?'Nový paket vytvořený Instagramem pro druhé spojení.':p.kind==='ig-connect'?'Klient otevírá spojení směrem ven. Server použije pozorovanou adresu a port; domácí NAT připraví návratovou cestu.':p.kind==='ig-read'?'Potvrzení přečtení vytváří aplikace. Jde o jinou informaci než TCP ACK.':'Cílová IP patří Instagramu. Příjemcem zprávy je účet @matej.'}</div>`;
    if(p.connection==='http'&&(pl.cookie||pl.setCookie))html+=`<div class="cookie-packet-note"><strong>${pl.cookie?'Cookie · prohlížeč → server':'Set-Cookie · server → prohlížeč'}</strong><code>${pl.cookie?'Cookie: '+esc(pl.cookie):'Set-Cookie: '+esc(pl.setCookie)}</code><p>${pl.cookie?'Server použije odeslaný identifikátor k vyhledání svého záznamu.':'Prohlížeč ji vyhodnotí a může uložit až po doručení odpovědi.'} Jde o HTTP hlavičku uvnitř tohoto přenosu.</p></div>`;
    if(pl.record||pl.publicText) {
      if(pl.publicText)html+=`<div class="section-label">VEŘEJNÁ ČÁST TLS HANDSHAKE</div><div class="payload-preview">${esc(pl.publicText)}</div><p class="hint">Název serveru může být vidět v ClientHello (SNI) i v běžném DNS. HTTPS samo tyto údaje neskrývá.</p>`;
      if(pl.record)html+=`<div class="section-label">ŠIFROVANÁ TLS DATA · POHLED NA SÍŤ</div><div class="tls-ciphertext"><strong>Obsah je chráněný</strong><code>${Array.from(pl.record.data.slice(0,160),b=>b.toString(16).padStart(2,'0')).join(' ')}${pl.record.data.length>160?' …':''}</code><span>${pl.record.data.length} B modelového chráněného obsahu</span></div><p class="hint">${p.kind.startsWith('tls-')?'Tento paket navazuje zabezpečené spojení.':'Obsah se šifruje před odesláním a dešifruje až na přijímajícím konci TLS.'} Bajty jsou výukové znázornění šifrovaného záznamu; simulace neprovádí skutečnou kryptografii TLS.</p>`;
    } else if(pl.bytes&&pl.contentType&&pl.contentType!=='text') {
      html+=`<div class="section-label">BINÁRNÍ MODELOVÁ DATA · ${pl.contentType==='video'?'VIDEO':'OBRÁZEK'}</div><p class="hint">Náhled je ukázka obsahu. Přenáší se deterministické modelové bajty zvolené velikosti, nikoli skutečně zakódovaný mediální soubor.</p><div class="payload-preview">${Array.from(pl.bytes.slice(0,64),b=>b.toString(16).padStart(2,'0')).join(' ')}${pl.bytes.length>64?' …':''}</div>`;
    } else if(pl.bytes) {
      const preview=new TextDecoder().decode(pl.bytes);
      html+=`<div class="section-label">PŘENÁŠENÉ BAJTY · UTF-8</div><div class="payload-preview">${esc(preview)}</div><p class="hint">Hranice segmentu může ležet uvnitř vícebajtového znaku. Celý text dekóduje až příjemce po složení bajtů.</p><details><summary class="hint">Bajty v šestnáctkové soustavě</summary><div class="payload-preview">${Array.from(pl.bytes,b=>b.toString(16).padStart(2,'0')).join(' ')}</div></details>`;
    } else {
      let payload=p.kind==='dns-query'?`DNS dotaz A: ${pl.name}`:p.kind==='dns-response'?`DNS odpověď A: ${pl.name} → ${pl.answer}`:p.kind==='http-request'?requestText(pl):p.kind==='ig-connect'?'Otevření modelového spojení klienta k Instagramu. Server odpoví na adresu a port, ze kterých požadavek přijal.':p.kind==='ig-read'?`Potvrzení přečtení zprávy ${pl.messageId} · účet @matej`:p.kind==='http-response'?responseText(pl):`Tiskový dokument: ${pl.document}`;
      html+=`<div class="section-label">APLIKAČNÍ OBSAH · ZKRÁCENÝ NÁHLED</div><div class="payload-preview">${esc(payload)}</div>`;
    }
    if(p.satelliteHistory?.length)html+=`<div class="satellite-notice"><strong>Paket prošel satelitním přístupem</strong><p>${p.satelliteHistory.map(h=>`${esc(net.nodes[h.from].name)} → ${esc(net.nodes[h.to].name)}`).join('<br>')}</p><span>IP a TCP/UDP se přenášejí v rádiovém systému. Satelit sám nenahrazuje HTTPS ani VPN.</span></div>`;
    if(p.frame?.satellite)html+='<div class="note-card"><strong>Satelitní přenosový úsek</strong>Model zde nezobrazuje ethernetové MAC adresy. Původní IP paket nese satelitní rádiový systém.</div>';
    else if(p.frame?.cellular)html+='<div class="note-card"><strong>Mobilní přístup</strong>Na úseku telefon–BTS–operátor se přenášejí uživatelská data mobilní sítě. Ethernetové MAC adresy zde model nezobrazuje.</div>';
    else if(p.frame)html+=`<details><summary class="hint">${p.frame.medium==='wifi'?'Wi-Fi':'Ethernet'} posledního pozorovaného rámce</summary><dl class="dl">${definition('Zdrojová MAC',p.frame.src)}${definition('Cílová MAC',p.frame.dst)}</dl><p class="hint">Router na dalším spoji vytvoří nový rámec. Domácí NAT navíc překládá IP adresu a port; změnu ukazuje historie překladu výše.</p></details>`;
    if(segmented&&['cloud','replica'].includes(p.connection))html+=`<p class="hint">${p.connection==='replica'?'Kopie mezi centry':'Cloudový požadavek i odpověď'} má části do ${CLOUD_MSS} B. Aplikace zpracuje až všechny složené bajty. Přihlášení je připravené; TLS, TCP ACK a opakování ztracených segmentů se nesimulují.</p>`;
    else if(segmented&&p.connection==='chatbot')html+=`<p class="hint">Dotaz i odpověď se přenášejí jako UTF-8, nejvýše ${MSS} B dat na paket. IP serveru a připojení jsou připravené. TCP handshake, ACK, TLS a opakování ztracených segmentů se nesimulují.</p>`;
    else if(segmented)html+=`<p class="hint">V tomto porovnání nese datový paket nejvýše ${MSS} B aplikačních dat. Počet se počítá z velikosti, ne z typu souboru. Skupiny časově zhušťují průchod paketů; TCP ACK, TLS a opakování nejsou započítané. Router segmenty nevytváří.</p>`;
    return html;
  }
  function render(animate=false) {
    for(const device of ['laptop','friend','cabin']) {
      const client=net.cloud.clients[device],draft=ui.cloud[device];
      if(draft.resultSerial!==client.resultSerial){draft.permissions={};draft.resultSerial=client.resultSerial;}
      if(draft.downloadSerial!==client.downloadSerial){loadLocal(device,client.lastDownload);draft.downloadSerial=client.downloadSerial;}
    }
    const oldVideo=$('#monitor-content video'),videoState=oldVideo?{time:oldVideo.currentTime,paused:oldVideo.paused,device:ui.monitorDevice,src:oldVideo.querySelector('source')?.getAttribute('src')}:null;
    const focused=document.activeElement,field=focused?.dataset?.field,start=focused?.selectionStart,end=focused?.selectionEnd;
    const key=ui.monitorOpen?`${ui.monitorDevice}:${ui.monitorDevice==='cafe-attacker'?ui.cafeAttackerTab:ui.monitorDevice==='cafe'?ui.cafeTab:ui.monitorDevice==='hacker'?ui.hackerTab:ui.monitorDevice==='cabin'?ui.cabinTab:ui.monitorDevice==='friend'?ui.friendTab:ui.monitorDevice==='phone'?ui.phoneTab:ui.tab}`:'';
    const computerScroll=key===computerViewKey?$('.computer-app-body')?.scrollTop||0:0;computerViewKey=key;
    const infoOpen=ui.deviceOpen||ui.linkOpen||ui.packetOpen;
    const deviceKey=infoOpen?`${ui.selection.kind}:${ui.selection.id}${ui.packetOpen?':'+ui.packetMember:''}`:'',sameDevice=deviceKey!==''&&deviceKey===deviceViewKey;
    const deviceScroll=sameDevice?$('#device-body').scrollTop:0;
    const expanded=sameDevice?[...document.querySelectorAll('#device-body details')].map(d=>d.open):[];
    const deviceToggleFocused=sameDevice&&focused?.matches('#device-body [data-action="toggle-node"], #device-body [data-action="toggle-link"]');
    deviceViewKey=deviceKey;
    $('#monitor-overlay').hidden=!ui.monitorOpen;
    $('#monitor-content').classList.toggle('phone-window',ui.monitorDevice==='phone');
    $('#monitor-content').innerHTML=ui.monitorOpen?computerView(net,sim,ui):'';
    if($('.computer-app-body'))$('.computer-app-body').scrollTop=computerScroll;
    const newVideo=$('#monitor-content video');if(videoState&&newVideo&&videoState.src===newVideo.querySelector('source')?.getAttribute('src')){const restore=()=>{newVideo.currentTime=videoState.time;if(!videoState.paused)newVideo.play().catch(()=>{});};if(newVideo.readyState)restore();else newVideo.addEventListener('loadedmetadata',restore,{once:true});}
    $('#device-overlay').hidden=!infoOpen;
    $('#device-content').classList.toggle('packet-window',ui.packetOpen);
    $('#device-content').classList.toggle('link-window',ui.linkOpen);
    $('#device-content').setAttribute('aria-labelledby',ui.packetOpen?'packet-title':ui.linkOpen?'link-title':'device-title');
    $('#device-content .device-close').setAttribute('aria-label',`Zavřít informace o ${ui.packetOpen?'paketu':ui.linkOpen?'spoji':'zařízení'} a vrátit se k mapě`);
    $('#device-body').innerHTML=ui.packetOpen?packetDetail(ui.selection.id):ui.linkOpen?linkDetail(ui.selection.id):ui.deviceOpen?deviceDetail(net.nodes[ui.selection.id]):'';
    if(infoOpen) {
      $('#device-eyebrow').textContent=ui.packetOpen?(sim.packets.get(ui.selection.id)?.payload.packetCount>1&&ui.packetMember===null?'POD LUPOU · SKUPINA PAKETŮ':'POD LUPOU · JEDEN PAKET'):ui.linkOpen?'DETAIL SPOJE':net.nodes[ui.selection.id].type==='host'?'KONCOVÉ ZAŘÍZENÍ':'UVNITŘ SÍTĚ';
      $('#device-back').hidden=ui.back.length===0;
      document.querySelectorAll('#device-body details').forEach((d,i)=>{d.open=expanded[i]||false;});
      $('#device-body').scrollTop=deviceScroll;
      if(deviceToggleFocused)$('#device-body [data-action="toggle-node"], #device-body [data-action="toggle-link"]').focus({preventScroll:true});
    }
    if(field) {const el=$(`[data-field="${field}"]`);if(el){el.focus({preventScroll:true});if(typeof start==='number')el.setSelectionRange(start,end);}}
    const current=sim.current;
    const badge=$('#message-map-status'),ig=net.instagram;badge.hidden=sim.action?.type!=='message'||!net.sender.content;
    if(!badge.hidden){const c=net.sender.content,plan=messagePlan(c.size);badge.innerHTML=`<strong>${MESSAGE_TYPES[c.type].label} · ${formatBytes(c.size)} · ${formatPackets(plan.packets)}</strong><span>Odesláno: ${net.sender.sentPackets||0} · Instagram přijal: ${ig.receivedPackets||0} · Matěj přijal: ${net.friend.receivedPackets||0}</span>${plan.groupSize>1?`<small>Zhuštěné zobrazení: značka = až ${plan.groupSize} paketů. Klikni pro rozbalení.</small>`:''}`;}
    $('#event-title').textContent=current?.title||'Síť čeká na tvůj první přenos';$('#event-description').textContent=current?.description||(ui.monitorOpen?(ui.monitorDevice==='cafe-attacker'?'Otevři MITM a nastav napodobený hotspot.':ui.monitorDevice==='cafe'?'Porovnej HTTP a HTTPS přes Wi-Fi kavárny.':ui.monitorDevice==='hacker'?'Otevři Phishing a vyber příjemce e-mailu v mapě.':ui.monitorDevice==='cabin'?'Na chatě otevři prohlížeč, Instagram, cloud nebo chatbot.':ui.monitorDevice==='friend'?'Na Matějově ploše otevři Instagram, cloud nebo připojení.':ui.monitorDevice==='phone'?'Na telefonu otevři prohlížeč, Instagram nebo připojení.':'Na ploše otevři prohlížeč, dokument, Instagram, cloud nebo připojení.'):'Klikni na notebook v mapě a otevři jeho plochu.');
    $('#run-dot').className=`status-dot ${sim.status}`;
    $('#play').disabled=ui.packetOpen||sim.status!=='running';$('#play').innerHTML=playing?'Ⅱ <span>Pauza</span>':'▶ <span>Přehrát</span>';$('#play').setAttribute('aria-label',playing?'Pozastavit přenos':'Přehrát přenos');
    $('#step').disabled=ui.packetOpen||sim.status!=='running';$('#repeat').disabled=ui.packetOpen||!sim.lastAction;
    const activePacket=ui.selection.kind==='packet'?ui.selection.id:current?.packet?.id;
    $('#packet-detail').disabled=ui.packetOpen||!activePacket;
    map.render(current,ui.selection,ui.selection.kind==='packet'?ui.selection.id:null,animate,ANIMATION_DELAY,sim.packets,sim.frame);
  }
  function advance() {if(ui.packetOpen)return;map.finishAnimations();remaining=0;sim.advanceFrame();if(sim.status!=='running'){stop();if(sim.action?.type!=='message')sim.resumePending();}render(true);}
  function schedule(delay=ANIMATION_DELAY) {
    timerDue=performance.now()+delay;
    timer=setTimeout(()=> {timer=null;remaining=0;if(!playing||ui.packetOpen)return;advance();if(playing)schedule();},delay);
  }
  function resumePlayback() {
    if(ui.packetOpen||sim.status!=='running')return;
    remaining=Math.max(remaining,map.animationTimeRemaining());
    playing=true;map.setAnimationsPlaying(true);
    if(remaining>0){schedule(remaining);remaining=0;render();}
    else {advance();if(playing)schedule();}
  }
  function startPhishing(type) {
    if(ui.packetOpen||sim.status==='running')return;stop();
    const device=ui.monitorDevice;if(!sim.start(type,{device,target:ui.attackTarget}))return;
    ui.back=[];ui.selection={kind:'node',id:device};if(['home','hacker'].includes(ui.scene))setScene('all');advance();
  }
  function startAction(type,extra={}) {
    if(ui.packetOpen||sim.status==='running')return;
    const device=ui.monitorDevice,message=device==='cabin'?ui.cabinMessage:device==='phone'?ui.phoneMessage:ui.message,address=ui[addressKey(device)];
    const payload={device,messageType:device==='cabin'?ui.cabinMessageType:device==='phone'?ui.phoneMessageType:ui.messageType,...(type==='chatbot'?{prompt:ui.chatbot[device]}:type==='web'?{address,...extra}:type==='print'?{document:ui.document.trim()}:{text:message})};
    if(type==='chatbot'&&!payload.prompt.trim()){notify('Nejprve napiš dotaz.');return;}
    if(type==='message'&&payload.messageType==='text'&&!message.trim()){notify('Nejprve napiš zprávu.');return;}
    if(type==='print'&&!ui.document.trim()){notify('Pojmenuj dokument.');return;}
    stop();if(!sim.start(type,payload)){render();return;}ui.back=[];ui.selection={kind:'node',id:device};ui.monitorDevice=device;ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;syncReader();
    if(type==='chatbot')ui.chatbot[device]='';
    if(type!=='print'&&ui.scene==='home')setScene('all');
    advance();
  }
  function handleInput(e) {
    if(e.target.dataset.field==='webMessage'){ui.webMessages[ui.monitorDevice]=e.target.value;return;}
    if(e.target.dataset.field==='chatPrompt'){ui.chatbot[ui.monitorDevice]=e.target.value;return;}
    if(['cloudName','cloudContent','cloudFileId'].includes(e.target.dataset.field)) {ui.cloud[ui.monitorDevice][e.target.dataset.field]=e.target.value;return;}
    const field=e.target.dataset.field;if(!field)return;if(field==='address'){ui[addressKey(ui.monitorDevice)]=e.target.value;return;}const key=ui.monitorOpen&&['phone','cabin'].includes(ui.monitorDevice)&&['address','message'].includes(field)?`${ui.monitorDevice}${field[0].toUpperCase()}${field.slice(1)}`:field;ui[key]=e.target.value;
    if(field==='message')render();
  }
  function handleSubmit(e) {
    e.preventDefault();const form=e.target.dataset.form;
    if(form==='phish-login'){const b=net.browserFor(ui.monitorDevice);ui[addressKey(ui.monitorDevice)]=`${b.loadedSecure?'https':'http'}://knihovna-podpora.test/overeni${b.loadedMessageId?'?zprava='+b.loadedMessageId:''}`;startAction('web',{method:'POST',phishLogin:true});
    }else if(form==='web-message') {
      const device=ui.monitorDevice,b=net.browserFor(device),address=b.loadedSecure?'https://knihovna.test':'http://knihovna.test';
      if(!ui.webMessages[device].trim()){notify('Nejprve napiš vzkaz.');return;}
      ui[addressKey(device)]=address;
      startAction('web',{address,method:'POST',message:ui.webMessages[device]});
    } else if(form==='cloud-local') {
      if(saveLocal()){notify('Soubor je uložený v tomto notebooku.');render();}
    } else if(form==='cloud-download') {
      const fileId=ui.cloud[ui.monitorDevice].cloudFileId.trim();if(fileId)startCloud({op:'download',fileId});
    } else if(form==='cloud-permissions') {
      const fileId=e.target.dataset.cloudId,draft=ui.cloud[ui.monitorDevice],file=net.cloud.clients[ui.monitorDevice].catalog.find(f=>f.id===fileId);
      if(file)startCloud({op:'permissions',fileId,permission:draft.permissions[fileId]??file.sharing,aclVersion:file.aclVersion});
    } else if(form==='server') {
      const title=ui.title.trim();if(!title)return;
      if(net.server.title!==title){net.server.title=title;net.server.revision++;ui.title=title;}
      notify(`Obsah serveru uložen · verze ${net.server.revision}`);render();
    } else startAction(form);
  }
  function handleClick(e) {
    if(e.target===$('#monitor-overlay')){closeMonitor();return;}
    if(e.target===$('#device-overlay')){closeDevice();return;}
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.cafeHotspot){if(sim.status==='running')return;if(net.setCafeHotspot(b.dataset.cafeHotspot))sim.connectionChanged('cafe');render();return;}
    if(b.dataset.action==='cafe-connect-rogue'){if(sim.status==='running'||!net.mitm.active)return;net.setCafeHotspot('rogue');sim.connectionChanged('cafe');notify('Host v modelu vybral napodobený hotspot. Jeho pakety nyní půjdou přes útočníka.');render();return;}
    if(b.dataset.cafeTest){if(sim.status==='running')return;ui.cafeTab='web';ui.cafeAddress=`${b.dataset.cafeTest}://knihovna.test`;select('node','cafe');startAction('web');return;}
    if(b.dataset.action==='mitm-clear'){if(sim.status==='running')return;net.mitm.logs=[];render();return;}
    if(['phish-send','mail-check','phish-results'].includes(b.dataset.action)){startPhishing(b.dataset.action);return;}
    if(b.dataset.action==='mail-open'){net.phishing.clients[ui.monitorDevice].opened=true;render();return;}
    if(b.dataset.action==='phish-report'){if(sim.status==='running')return;sim.phishing.report(ui.monitorDevice);notify('Zpráva je označená jako phishing. Odkaz a přihlášení tohoto pokusu jsou zablokované.');render();return;}
    if(b.dataset.action==='phish-open'){const m=net.phishing.clients[ui.monitorDevice].inbox;if(!m||sim.phishing.blocked(ui.monitorDevice,m.id))return;ui[addressKey(ui.monitorDevice)]=m.link;openComputerApp('web');startAction('web');return;}
    if(b.dataset.action==='phish-legit'){ui[addressKey(ui.monitorDevice)]='https://knihovna.test';openComputerApp('web');startAction('web');return;}
    if(b.dataset.action==='cookie-panel'){ui.cookieOpen[ui.monitorDevice]=!ui.cookieOpen[ui.monitorDevice];render();$('[data-action="cookie-panel"]')?.focus({preventScroll:true});return;}
    if(['cookie-clear','cookie-time'].includes(b.dataset.action)){if(sim.status==='running')return;if(b.dataset.action==='cookie-clear'){globalThis.InternetLab.WebCookies.clear(net.browserFor(ui.monitorDevice).cookies);notify('Cookies byly smazány z tohoto prohlížeče. Záznamy na serveru zůstaly.');}else{net.advanceCookieTime();notify('Modelový čas se posunul o hodinu. Cookies s prošlou platností byly odstraněny.');}render();return;}
    if(b.dataset.webProtocol){const address=globalThis.InternetLab.webAddress(ui[addressKey(ui.monitorDevice)]);ui[addressKey(ui.monitorDevice)]=address?.server==='phish-web'?`${b.dataset.webProtocol}://knihovna-podpora.test/overeni${address.messageId?'?zprava='+address.messageId:''}`:`${b.dataset.webProtocol}://knihovna.test`;startAction('web');return;}
    if(b.dataset.messageType){const key=ui.monitorDevice==='cabin'?'cabinMessageType':ui.monitorDevice==='phone'?'phoneMessageType':'messageType';ui[key]=b.dataset.messageType;render();$(`[data-message-type="${ui[key]}"]`).focus({preventScroll:true});return;}
    if(b.hasAttribute('data-group-member')){ui.packetMember=Number(b.dataset.groupMember);$('#device-body').scrollTop=0;render();$('#device-content').focus({preventScroll:true});return;}
    if(b.dataset.action==='satellite-view'){net.setSatelliteView(!net.satellite.clearView);notify(net.satellite.clearView?'Anténa má opět volný výhled.':'Výhled antény je zakrytý. Satelitní spoj je nedostupný.');if(!resumeMessage())render();return;}
    if(b.dataset.action==='packet-group'){ui.packetMember=null;$('#device-body').scrollTop=0;render();return;}
    if(b.dataset.action==='close-device'){closeDevice();return;}
    if(b.dataset.action==='back-device'){backDetail();return;}
    if(b.dataset.action==='cloud-sync'){if(ui.packetOpen||sim.status==='running')return;stop();if(sim.start('replicate')){setScene('dc');advance();}return;}
    if(b.dataset.action==='clear-nat'){net.clearNat(b.dataset.id);notify('Tabulka NAT je prázdná. Příchozí odpovědi bez záznamu se nedoručí.');render();$('#device-content').focus({preventScroll:true});return;}
    if(b.dataset.cloudTab){const tab=b.dataset.cloudTab;ui.cloud[ui.monitorDevice].tab=tab;render();$(`#monitor-content [data-cloud-tab="${tab}"]`).focus({preventScroll:true});return;}
    if(b.dataset.cloudDownload){startCloud({op:'download',fileId:b.dataset.cloudDownload});return;}
    if(b.dataset.action==='cloud-refresh'){startCloud({op:'list'});return;}
    if(b.dataset.action==='cloud-new'){Object.assign(ui.cloud[ui.monitorDevice],{localId:null,cloudName:'Nový soubor.txt',cloudContent:'',tab:'local'});render();$('#cloud-name').focus({preventScroll:true});return;}
    if(b.dataset.action==='cloud-upload') {
      if(sim.status==='running')return;
      const file=saveLocal();if(!file)return;
      startCloud({op:'upload',name:file.name,content:file.content,...(b.dataset.replace?{fileId:file.cloudId,version:file.cloudVersion}:{})},file.id);return;
    }
    if(b.dataset.accessMode){changeAccess(b.dataset.id,b.dataset.accessMode);return;}
    if(b.dataset.computerApp){openComputerApp(b.dataset.computerApp);return;}
    if(b.dataset.action==='close-monitor'||b.dataset.action==='show-map'){closeMonitor();return;}
    if(b.dataset.action==='computer-home'){openComputerApp('desktop');return;}
    if(b.dataset.action==='open-library'){ui[addressKey(ui.monitorDevice)]='knihovna.test';startAction('web');return;}
    if(b.dataset.action==='resume-message'){resumeMessage();return;}
    if(b.dataset.selectNode) {if(b.dataset.cloudServer&&ui.cloud[b.dataset.selectNode]){const device=b.dataset.selectNode;ui.cloud[device].server=b.dataset.cloudServer;ui.cloud[device].permissions={};Object.assign(net.cloud.clients[device],{state:'idle',catalog:[],listed:false});}if(b.dataset.openTab){if(b.dataset.selectNode==='cafe-attacker')ui.cafeAttackerTab=b.dataset.openTab;else if(b.dataset.selectNode==='cafe')ui.cafeTab=b.dataset.openTab;else if(b.dataset.selectNode==='hacker')ui.hackerTab=b.dataset.openTab;else if(b.dataset.selectNode==='cabin')ui.cabinTab=b.dataset.openTab;else if(b.dataset.selectNode==='friend')ui.friendTab=b.dataset.openTab;else if(b.dataset.selectNode==='phone')ui.phoneTab=b.dataset.openTab;else ui.tab=b.dataset.openTab;}select('node',b.dataset.selectNode);}
    else if(b.dataset.selectLink)select('link',b.dataset.selectLink);
    else if(b.dataset.selectPacket)select('packet',b.dataset.selectPacket);
    else if(b.dataset.action==='toggle-node') {
      const on=net.toggleNode(b.dataset.id);
      if(b.dataset.id==='cafe-attacker')ui.cafeAttackerTab='desktop';if(b.dataset.id==='cafe')ui.cafeTab='desktop';if(b.dataset.id==='hacker')ui.hackerTab='desktop';if(b.dataset.id==='cabin')ui.cabinTab='desktop';if(b.dataset.id==='laptop')ui.tab='desktop';if(b.dataset.id==='friend')ui.friendTab='desktop';if(b.dataset.id==='phone')ui.phoneTab='desktop';syncReader();
      notify(`${net.nodes[b.dataset.id].name}: ${on?'zapnuto':'vypnuto'}.`);if(!resumeMessage())render();
      if(ui.monitorOpen&&b.dataset.id===ui.monitorDevice)$('.computer-power').focus({preventScroll:true});
    } else if(b.dataset.action==='toggle-link') {
      const on=net.toggleLink(b.dataset.id);notify(`${net.links[b.dataset.id].name}: ${on?'spoj obnoven':'spoj odpojen'}.`);if(!resumeMessage())render();
    }
  }
  for(const root of [$('#monitor-overlay'),$('#device-overlay')]) {
    root.addEventListener('input',handleInput);
    root.addEventListener('change',e=>{
      if(e.target.hasAttribute('data-mitm-active')||e.target.hasAttribute('data-mitm-mode')){if(sim.status==='running')return;sim.mitm.configure(e.target.hasAttribute('data-mitm-active')?e.target.checked:net.mitm.active,e.target.hasAttribute('data-mitm-mode')?e.target.value:net.mitm.mode);render();return;}
      if(e.target.hasAttribute('data-attack-target')){ui.attackTarget=e.target.value;render();return;}
      if(e.target.hasAttribute('data-cookie-allowed')){if(sim.status==='running')return;net.browserFor(ui.monitorDevice).cookies.allowed=e.target.checked;render();$('[data-cookie-allowed]')?.focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cookie-secure')){if(sim.status==='running')return;net.server.cookies.secureOnly=e.target.checked;render();$('[data-cookie-secure]')?.focus({preventScroll:true});return;}
      if(e.target.dataset.vpn){const id=e.target.dataset.vpn;if(net.setVPN(id,e.target.checked)){sim.connectionChanged(id);if(sim.status!=='running')stop();syncReader();notify(`VPN ${net.vpn.clients[id].enabled?'zapnutá':'vypnutá'} pro ${net.nodes[id].name}.`);if(!resumeMessage())render();$(`#monitor-content [data-vpn="${id}"]`)?.focus({preventScroll:true});}return;}
      if(e.target.hasAttribute('data-web-certificate')){const value=e.target.value;Object.assign(net.server.certificate,{name:value==='wrong-name'?'jiny-web.test':'knihovna.test',valid:value!=='expired',trusted:value!=='untrusted'});render();$('#web-certificate').focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cloud-center')){const device=ui.monitorDevice,draft=ui.cloud[device];draft.server=e.target.value;draft.permissions={};Object.assign(net.cloud.clients[device],{state:'idle',catalog:[],listed:false});render();$('#monitor-content [data-cloud-center]').focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cloud-local')){loadLocal(ui.monitorDevice,e.target.value);render();$('#monitor-content [data-cloud-local]').focus({preventScroll:true});return;}
      if(e.target.dataset.cloudAccess){ui.cloud[ui.monitorDevice].permissions[e.target.dataset.cloudAccess]=e.target.value;return;}
      if(e.target.dataset.tower){changeAccess('phone','cellular',e.target.value,true);return;}
      if(e.target.hasAttribute('data-receipts')){net.friend.receipts=e.target.checked;if(net.friend.read&&net.friend.receipts)sim.markRead();render();}
    });
    root.addEventListener('submit',handleSubmit);
    root.addEventListener('click',handleClick);
  }
  sceneButtons.forEach(b=>b.addEventListener('click',()=>setScene(b.dataset.scene)));
  $('#zoom-in').addEventListener('click',()=>map.zoom(.78));$('#zoom-out').addEventListener('click',()=>map.zoom(1.28));
  $('#labels').addEventListener('change',e=>{map.labels=e.target.checked;map.render();});
  $('#packet-detail').addEventListener('click',()=>{const p=ui.selection.kind==='packet'?ui.selection.id:sim.current?.packet?.id;if(p)select('packet',p);});
  $('#step').addEventListener('click',()=>{stop();advance();});
  $('#play').addEventListener('click',()=> {
    if(playing){stop();render();}
    else resumePlayback();
  });
  $('#repeat').addEventListener('click',()=> {
    stop();if(sim.status==='running')sim.status='stopped';sim.repeat();ui.back=[];
    if(ui.selection.kind==='packet')ui.selection={kind:'node',id:sim.clientId()};
    advance();notify('Stejná akce je připravená. Změny sítě i serveru zůstaly.');
  });
  document.addEventListener('keydown',e=> {
    if(e.key==='Escape'&&ui.monitorOpen){e.preventDefault();closeMonitor();}
    else if(e.key==='Escape'&&(ui.deviceOpen||ui.linkOpen||ui.packetOpen)){e.preventDefault();closeDevice();}
    else if(e.key==='Escape'&&ui.selection.id!=='laptop')select('node','laptop');
  });
  render();
})();
