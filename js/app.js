(() => {
  'use strict';
  const {Network,Simulation,NetworkMap,DEFAULT_MESSAGE,formatPackets,messagePreview,requestText,esc,computerView,fixedMailRecipient,serverStorage}=globalThis.InternetLab;
  const ANIMATION_DELAY=650;
  const $=s=>{const first=document.querySelector(s);return !first||first.id==='transfer-preview'||!first.closest('#transfer-preview')?first:[...document.querySelectorAll(s)].find(el=>!el.closest('#transfer-preview'));},encoder=new TextEncoder();
  let net=new Network(new globalThis.InternetLab.LabSettings()),sim=new Simulation(net),timer=null,playing=false,toastTimer=null;
  let timerDue=0,remaining=0,playbackRate=1,computerViewKey='',deviceViewKey='';
  const messageKey=(device,field='message')=>device==='laptop'?field:`${device}${field[0].toUpperCase()}${field.slice(1)}`;
  const addressKey=device=>device==='laptop'?'address':`${device}Address`;
  function createUI() {
    const ui={selection:{kind:'node',id:'laptop'},tab:'desktop',hackerTab:'desktop',friendTab:'desktop',friendAddress:'knihovna.test',cabinTab:'desktop',cabinAddress:'knihovna.test',cabinMessage:DEFAULT_MESSAGE,cabinMessageType:'text',phoneTab:'desktop',phoneAddress:'knihovna.test',phoneMessage:DEFAULT_MESSAGE,phoneMessageType:'text',messageType:'text',monitorDevice:'laptop',monitorOpen:false,deviceOpen:false,linkOpen:false,packetOpen:false,packetResume:false,address:'knihovna.test',document:'Poznámky k projektu.pdf',message:DEFAULT_MESSAGE,scene:'home'};
    ui.friendMessage='';ui.friendMessageType='text';
    ui.cafeTab='desktop';ui.cafeAttackerTab='desktop';ui.cafeAddress='http://knihovna.test';
    ui.mailComposer=Object.fromEntries(globalThis.InternetLab.MAIL_CLIENTS.map(id=>[id,{tab:'inbox',target:id==='hacker'?'laptop':fixedMailRecipient(id)||(net.nodeAvailable('friend')&&net.nodeAvailable('mail')?'friend':'laptop'),subject:'',body:'',phishBody:null,phishSubject:null,search:'',composeOpen:false,sentId:null}]));
    ui.mitmSsid=net.mitm.ssid;
    ui.connectionDrafts={};ui.networkPanel=null;ui.networkDrafts={};
    ui.authDraft=Object.fromEntries(Object.keys(globalThis.InternetLab.PRIVACY_OWNERS).map(device=>[device,{mode:'login',username:device==='friend'?'matej':device==='cafe'?'host':'alex',email:'novy@knihovna.test',password:'KNIHOVNA-DEMO'}]));
    ui.phishDraft=Object.fromEntries(globalThis.InternetLab.PHISH_CLIENTS.map(device=>[device,{...globalThis.InternetLab.DEMO_LOGIN}]));
    ui.privacyOpen={cafe:false,laptop:false,friend:false,phone:false,cabin:false};
    ui.cookieOpen={cafe:false,laptop:false,friend:false,phone:false,cabin:false};
    ui.chatbot={laptop:'',friend:'',phone:'',cabin:''};
    ui.webMessages={cafe:'Ahoj z kavárny, prosím o prodloužení výpůjčky.',friend:'Ahoj, píše Matěj.',cabin:'Ahoj z chaty! Zpráva putuje přes satelit.',laptop:'Ahoj, prosím o prodloužení výpůjčky.',phone:'Ahoj, prosím o prodloužení výpůjčky.'};
    ui.files=Object.fromEntries(Object.keys(net.cloud.clients).map(device=>[device,{view:'files',localId:null,name:'',content:'',editorKey:0}]));
    ui.cloud=Object.fromEntries(Object.keys(net.cloud.clients).map(device=>[device,{view:'files',editorKey:0,remoteId:null,remoteVersion:null,cloudName:'',cloudContent:'',shareId:null,shareUser:'',downloadSerial:0,resultSerial:0,uploadOpen:false,uploadId:null,downloadNotice:null}]));
    return ui;
  }
  function resetDeviceUI(device) {
    const tabs={laptop:'tab',friend:'friendTab',phone:'phoneTab',cabin:'cabinTab',cafe:'cafeTab',hacker:'hackerTab','cafe-attacker':'cafeAttackerTab'};
    if(!tabs[device])return;
    if(ui.transferOutcome?.device===device)ui.transferOutcome=null;
    const initial=createUI();ui[tabs[device]]='desktop';
    for(const field of ['address','message','messageType']){const key=field==='address'?addressKey(device):messageKey(device,field);if(Object.hasOwn(initial,key))ui[key]=initial[key];}
    for(const field of ['mailComposer','authDraft','phishDraft','privacyOpen','cookieOpen','chatbot','webMessages','cloud','files'])if(Object.hasOwn(initial[field],device))ui[field][device]=initial[field][device];
    delete ui.connectionDrafts[device];delete ui.networkDrafts[device];if(ui.networkPanel===device)ui.networkPanel=null;
    if(device==='laptop')ui.document=initial.document;
    if(device==='cafe-attacker')ui.mitmSsid=initial.mitmSsid;
    if(browserNavigation.reset(device))ui[addressKey(device)]='';
  }
  const ui=createUI();
  let browserNavigation=ui.browserNavigation=new globalThis.InternetLab.BrowserNavigation(net);
  for(const device of Object.keys(browserNavigation.devices))ui[addressKey(device)]='';
  const map=new NetworkMap($('#network-map'),net,select);
  let journeyAnimation=null;
  const tabKey=device=>device==='laptop'?'tab':device==='cafe-attacker'?'cafeAttackerTab':`${device}Tab`;
  const transferApp=type=>type.startsWith('mail-')||type==='phish-send'?'mail':type==='phish-results'?'attack':type==='message'?'message':type==='cloud'||type==='replicate'?'cloud':type==='chatbot'?'chatbot':type==='print'?'print':'web';
  const journey=new globalThis.InternetLab.TransferJourney({
    onClear:()=>{journeyAnimation?.cancel();journeyAnimation=null;},
    onMinimize:context=>{
      journeyAnimation?.cancel();journeyAnimation=null;
      if(ui.monitorDevice===context.device)ui.monitorOpen=false;
      syncReader();render();
      if(!ui.packetOpen&&!ui.deviceOpen&&!ui.linkOpen&&!$('#settings-dialog').open)$('#play').focus({preventScroll:true});
    },
    onRestore:(context,result)=>{
      if(sim.run!==context.run||!net.nodes[context.device]?.on)return;
      const from=$('.transfer-thumbnail').getBoundingClientRect();
      ui.networkPanel=null;ui.monitorDevice=context.device;ui[tabKey(context.device)]=context.app;ui.selection={kind:'node',id:context.device};
      ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;
      ui.transferOutcome=['failed','waiting'].includes(result.status)||sim.action?.type==='print'?{device:context.device,status:result.status,text:net.displayText(result.current?.description||result.current?.title||'Přenos je dokončený.')} :null;
      syncReader();render();animateMonitor(from,false);resumeBackground();
    }
  });
  function animateMonitor(thumbnail,departing) {
    journeyAnimation?.cancel();journeyAnimation=null;
    const monitor=$('#monitor-content'),full=monitor.getBoundingClientRect();
    if(!full.width||!thumbnail.width||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const scale=Math.min(thumbnail.width/full.width,thumbnail.height/full.height);
    const transform=`translate(${thumbnail.left+(thumbnail.width-full.width*scale)/2-full.left}px,${thumbnail.top+(thumbnail.height-full.height*scale)/2-full.top}px) scale(${scale})`;
    const small={transform,opacity:.35},large={transform:'none',opacity:1};
    journeyAnimation=monitor.animate(departing?[large,small]:[small,large],{duration:departing?500:420,easing:'cubic-bezier(.22,.68,.2,1)',fill:departing?'forwards':'none'});
    if(!departing)journeyAnimation.onfinish=()=>{journeyAnimation=null;monitor.focus({preventScroll:true});};
  }
  function playAutomatically() {
    if(playing||ui.packetOpen||sim.status!=='running')return;
    remaining=0;playing=true;map.setAnimationsPlaying(true);schedule();
  }
  function resumeBackground() {
    if(!journey.current&&sim.status!=='running'&&sim.action&&sim.action.type!=='message'&&sim.resumePending()){playAutomatically();render();}
  }
  function beginTransfer(app) {
    journey.clear();ui.transferOutcome=null;ui.networkPanel=null;
    const device=sim.clientId();ui.monitorDevice=device;ui[tabKey(device)]=app;ui.selection={kind:'node',id:device};
    ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;ui.packetResume=false;
    syncReader();remaining=0;render();
    const monitor=$('#monitor-content');journey.begin(sim,{device,app,caption:globalThis.InternetLab.transferCaption(sim),snapshot:monitor.innerHTML,width:monitor.clientWidth,height:monitor.clientHeight});
    playAutomatically();render();animateMonitor($('.transfer-thumbnail').getBoundingClientRect(),true);
  }
  function renderJourney() {
    const context=journey.current,card=$('#transfer-card'),departing=context?.phase==='departing';
    card.hidden=!context||context.phase==='expanded';card.classList.toggle('departing',!!departing);
    $('#monitor-overlay').classList.toggle('departing',!!departing);$('#monitor-content').inert=!!departing;
    if(!context||context.phase==='expanded'){
      const preview=$('#transfer-preview');preview.replaceChildren();preview.journeyContext=null;return;
    }
    $('#transfer-device').textContent=net.nodes[context.device].name;$('#transfer-caption').textContent=context.caption;
    card.setAttribute('aria-label',`Zvětšit zařízení ${net.nodes[context.device].name}`);
    const preview=$('#transfer-preview');
    if(preview.journeyContext!==context){
      preview.journeyContext=context;preview.classList.toggle('phone-window',context.device==='phone');preview.innerHTML=context.snapshot;
      preview.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      preview.querySelectorAll('video,audio').forEach(el=>el.remove());
      preview.style.width=`${context.width}px`;preview.style.height=`${context.height}px`;
    }
    const box=$('.transfer-thumbnail'),scale=Math.min(box.clientWidth/context.width,box.clientHeight/context.height);
    preview.style.transform=`scale(${scale})`;preview.style.left=`${(box.clientWidth-context.width*scale)/2}px`;preview.style.top=`${(box.clientHeight-context.height*scale)/2}px`;
  }
  const disabled=()=>sim.status==='running'?'disabled':'';
  const definition=(label,value)=>`<dt>${label}</dt><dd>${esc(value)}</dd>`;
  const serverServices=value=>net.detailEnabled('headers')?`<dl class="dl">${definition('Služby',value)}</dl>`:'';
  const button=(action,label,cls='primary-button wide',extra='')=>`<button data-action="${action}" class="${cls}" ${extra}>${label}</button>`;
  function notify(message) {
    clearTimeout(toastTimer);$('#toast').textContent=net.displayText(message);$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);
  }
  function stop() {
    if(timer!==null)remaining=Math.max(0,timerDue-performance.now());
    else remaining=Math.max(remaining,map.animationTimeRemaining());
    playing=false;clearTimeout(timer);timer=null;map.setAnimationsPlaying(false);
  }
  function setScene(scene) {
    ui.scene=scene;map.setScene(scene);
  }
  function select(kind,id) {
    ui.networkPanel=null;
    if(kind==='node'&&!net.nodeAvailable(id)||kind==='link'&&!net.linkAvailable(net.links[id]))return;
    journeyAnimation?.cancel();journeyAnimation=null;
    if(kind==='packet'&&journey.current?.phase==='expanded')journey.minimize();
    if(journey.current&&kind!=='packet'){
      if(kind==='node'&&id===journey.current.device)journey.expand();else journey.browse();
    }
    if(ui.monitorOpen&&(kind!=='node'||id!==ui.monitorDevice))clearMailComposer();
    const resume=ui.packetOpen&&kind!=='packet'&&ui.packetResume;
    if(kind==='packet') {if(!ui.packetOpen)ui.packetResume=playing;stop();}
    else ui.packetResume=false;
    ui.selection={kind,id};ui.monitorOpen=kind==='node'&&['laptop','friend','phone','cabin','hacker','cafe','cafe-attacker'].includes(id);ui.deviceOpen=kind==='node'&&!ui.monitorOpen;ui.linkOpen=kind==='link';ui.packetOpen=kind==='packet';if(ui.monitorOpen)ui.monitorDevice=id;syncReader();render();
    $(ui.monitorOpen?'#monitor-content':'#device-content').focus({preventScroll:true});
    if(resume)resumePlayback();
  }
  function closeMonitor() {
    if(ui.cloud[ui.monitorDevice])Object.assign(ui.cloud[ui.monitorDevice],{uploadOpen:false,shareId:null});
    ui.networkPanel=null;
    if(journey.current&&journey.current.device===ui.monitorDevice){
      if(sim.status==='running'&&!sim.replicaResult){journey.minimize();return;}
      journey.clear();
    }
    clearMailComposer();
    ui.monitorOpen=false;syncReader();render();
    $(`#network-map [data-map-kind="node"][data-id="${ui.monitorDevice}"]`).focus({preventScroll:true});
  }
  function closeDevice() {
    const resume=ui.packetOpen&&ui.packetResume;
    ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;ui.packetResume=false;render();
    const source=ui.selection.kind==='link'?net.links[ui.selection.id]?.a:null;
    ($(`#network-map [data-map-kind="${ui.selection.kind}"][data-id="${ui.selection.id}"]`)||(source&&$(`#network-map [data-map-kind="node"][data-id="${source}"]`))||$('#open-settings')).focus({preventScroll:true});
    if(resume)resumePlayback();
  }
  function openComputerApp(app) {
    if(app==='network'){toggleNetworkPanel();return;}
    ui.networkPanel=null;
    if(app!=='cloud'&&ui.cloud[ui.monitorDevice])Object.assign(ui.cloud[ui.monitorDevice],{uploadOpen:false,shareId:null});
    if(!net.appAvailable(app,ui.monitorDevice))return;
    if(!['desktop','web','print','message','cloud','files','chatbot','network','vpn','mail','attack','mitm'].includes(app))return;
    if(journey.current)journey.browse();ui.transferOutcome=null;
    if(app!=='mail')clearMailComposer();
    if(ui.monitorDevice==='cafe-attacker'){if(!['desktop','mitm'].includes(app))return;ui.cafeAttackerTab=app;}else if(ui.monitorDevice==='cafe'){if(!['desktop','web','network','vpn','mail'].includes(app))return;ui.cafeTab=app;}else if(ui.monitorDevice==='hacker'){if(!['desktop','mail','attack','network','vpn'].includes(app))return;ui.hackerTab=app;}else if(ui.monitorDevice==='cabin'){if(app==='print')return;ui.cabinTab=app;}else if(ui.monitorDevice==='friend'){if(!['desktop','web','message','cloud','files','chatbot','network','vpn','mail'].includes(app))return;ui.friendTab=app;}else if(ui.monitorDevice==='phone'){if(app==='print')return;ui.phoneTab=app;}else ui.tab=app;syncReader();render();
    const input=['cloud','files'].includes(app)?$('.drive-scroll'):app==='vpn'?$('#monitor-content [data-action="vpn-toggle"]'):$('#monitor-content [data-field]');
    (input||$('#monitor-content')).focus({preventScroll:true});
    if(app==='cloud'&&!net.cloud.clients[ui.monitorDevice].listed&&net.cloud.clients[ui.monitorDevice].state==='idle'&&sim.status!=='running')startCloud({op:'list'});
  }
  function clearMailComposer() {
    const composer=ui.mailComposer[ui.monitorDevice];
    if(composer)Object.assign(composer,{composeOpen:false,subject:'',body:'',phishBody:null,phishSubject:null});
  }
  function syncReader() {
    net.friend.chatOpen=ui.monitorOpen&&ui.monitorDevice==='friend'&&ui.friendTab==='message'&&net.nodes.friend.on;
    const tab=ui.monitorDevice==='laptop'?ui.tab:ui[`${ui.monitorDevice}Tab`];
    net.instagram.openDevice=ui.monitorOpen&&tab==='message'&&net.nodes[ui.monitorDevice].on?ui.monitorDevice:null;
    if(net.instagram.openDevice&&sim.markRead(net.instagram.openDevice))playAutomatically();
  }
  function resumeMessage(showJourney=false) {if(sim.resumePending()||sim.resumeReplication()){stop();if(showJourney&&net.nodes[sim.clientId()]?.on)beginTransfer('message');else{playAutomatically();render();}return true;}return false;}
  function loadLocal(device,id) {
    const file=net.cloud.local[device].find(f=>f.id===id);if(!file)return;
    Object.assign(ui.files[device],{localId:id,name:file.name,content:file.content,view:'editor',editorKey:(ui.files[device].editorKey||0)+1});
  }
  function saveLocal() {
    const device=ui.monitorDevice,draft=ui.files[device];if(!draft)return null;
    const file=net.cloud.saveLocal(device,{id:draft.localId,name:draft.name,content:draft.content});
    if(!file){notify('Vyplň název souboru do 70 znaků a text do 1200 znaků.');return null;}
    draft.localId=file.id;return file;
  }
  function startCloud(request,localId,preview=false) {
    const device=ui.monitorDevice;if(ui.packetOpen||sim.status==='running'||!ui.cloud[device])return;
    stop();if(!sim.start('cloud',{device,server:'cloud',request,localId,preview}))return;
    if(preview)Object.assign(ui.cloud[device],{view:'preview',remoteId:request.fileId,remoteVersion:null,cloudName:'',cloudContent:''});
    ui.selection={kind:'node',id:device};ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;
    if(ui.scene==='home')setScene('all');
    beginTransfer('cloud');
  }
  function closeCloudPicker(){ui.cloud[ui.monitorDevice].uploadOpen=false;render();$('.drive-add>summary')?.focus({preventScroll:true});}
  function closeCloudShare(){const d=ui.cloud[ui.monitorDevice],id=d.shareId;d.shareId=null;render();$(`[data-cloud-share="${id}"]`)?.focus({preventScroll:true});}
  function networkDraft() {return ui.networkDrafts[ui.monitorDevice]??={selected:null,passwordStep:false,password:'',error:'',details:false};}
  function focusWifiPassword() {const input=$('#wifi-password');if(input){input.focus({preventScroll:true});input.form.scrollIntoView({block:'nearest'});}}
  function closeNetworkPanel(focus=true) {
    ui.networkPanel=null;const d=networkDraft();d.password='';d.error='';d.passwordStep=false;
    render();if(focus)$('#monitor-content .computer-connection')?.focus({preventScroll:true});
  }
  function toggleNetworkPanel() {
    const id=ui.monitorDevice;if(!net.access[id]||!net.nodes[id].on)return;
    if(ui.networkPanel===id){closeNetworkPanel();return;}
    ui.networkPanel=id;const d=networkDraft();Object.assign(d,{selected:net.access[id].mode==='wifi'?net.wifiNetworkId(id):null,passwordStep:false,password:'',error:''});
    render();($('#connection-panel [data-network-toggle]')||$('#connection-panel [data-action="network-close"]'))?.focus({preventScroll:true});
  }
  function updateConnection(change,message,focus) {
    const id=ui.monitorDevice,before=JSON.stringify(net.access[id]);
    if(!change())return false;
    if(JSON.stringify(net.access[id])!==before)sim.connectionChanged(id);
    if(sim.status!=='running')stop();syncReader();if(message)notify(message);
    if(!resumeMessage())render();
    if(focus)$('#monitor-content '+focus)?.focus({preventScroll:true});
    return true;
  }
  function connectWifi(key,password='') {
    const id=ui.monitorDevice,d=networkDraft();
    if(!updateConnection(()=>net.connectWifi(id,key,password),'Připojeno k Wi-Fi.',`[data-wifi-network="${key}"]`)){
      d.error='Připojení se nezdařilo. Zkontroluj heslo a dostupnost sítě.';render();focusWifiPassword();return;
    }
    Object.assign(d,{selected:key,passwordStep:false,password:'',error:''});render();$(`#monitor-content [data-wifi-network="${key}"]`)?.focus({preventScroll:true});
  }
  function setDeviceHelpOpen(open) {
    const help=$('#device-help'),show=open&&!help.hidden;
    help.dataset.open=String(show);
    $('#device-help-content').hidden=!show;
    $('#device-help-trigger').setAttribute('aria-expanded',String(show));
  }
  function organizeDeviceHelp(body) {
    const notes=ui.deviceOpen?[...body.querySelectorAll('[data-device-help]')]:[];
    const help=$('#device-help'),content=$('#device-help-content');
    help.hidden=!notes.length;$('#device-content').classList.toggle('has-device-help',!!notes.length);
    content.replaceChildren();
    if(!notes.length){setDeviceHelpOpen(false);return;}
    const topics=new Map();
    for(const note of notes) {
      const topic=note.dataset.deviceHelp;
      if(!topics.has(topic)) {
        const section=document.createElement('section'),title=document.createElement('h3');
        title.textContent=topic;section.append(title);content.append(section);topics.set(topic,section);
      }
      topics.get(topic).append(note);
    }
  }
  function portList(n) {
    return `<div class="port-list">${Object.values(n.interfaces).filter(i=>net.linkAvailable(net.links[i.link])).map(i=> {const l=net.links[i.link],peer=net.nodes[net.peer(l,n.id)];return `<div class="port-item ${net.isActive(l)?'':'off'}"><i class="port-led"></i><code>${i.port}</code><span>${esc(net.displayName(peer))}</span>${['switch','router','terminal','bts'].includes(n.type)?'':`<button data-select-link="${l.id}" aria-label="Otevřít spoj ${esc(net.displayLinkName(l))}">↗</button>`}</div>`;}).join('')}</div>`;
  }
  function natEndpoint(ip,port) {
    return `${ip}<wbr><span class="nat-port">:${port}</span>`;
  }
  function natComparison(trace) {
    const outgoing=trace.direction==='out',before=trace.before,after=trace.after;
    return `<div class="nat-comparison"><div><small>PŘED PŘEKLADEM</small><code>${natEndpoint(outgoing?before.src:before.dst,outgoing?before.sport:before.dport)}</code></div><span aria-hidden="true">→</span><div><small>PO PŘEKLADU</small><code>${natEndpoint(outgoing?after.src:after.dst,outgoing?after.sport:after.dport)}</code></div></div>`;
  }
  function natTable(n) {
    const nat=net.nat[n.id];if(!nat||!net.detailEnabled('nat'))return '';
    return `<section class="nat-panel" aria-label="Tabulka NAT"><div class="section-label">PŘEKLAD ADRES A PORTŮ · NAT/PAT</div><p class="hint">Veřejná WAN adresa: <strong>${net.natAddress(n.id)}</strong></p><p class="hint" data-device-help="NAT">${net.detailEnabled('devices')?'Router':'Zařízení'} rozlišuje zařízení podle soukromé adresy a portu. Odpověď vrátí podle záznamu v této tabulce.</p>${nat.rows.length?nat.rows.map(row=>`<article class="nat-entry"><div class="nat-entry-heading"><strong>${esc(net.nodes[row.device].name)}</strong><span>${row.protocol}</span></div><div class="nat-comparison"><div><small>V DOMÁCNOSTI</small><code>${natEndpoint(row.insideIp,row.insidePort)}</code></div><span aria-hidden="true">↔</span><div><small>V INTERNETU</small><code>${natEndpoint(row.outsideIp,row.outsidePort)}</code></div></div><p>Protějšek <code>${row.remoteIp}:${row.remotePort}</code><br>Pakety ven: ${row.outbound} · zpět: ${row.inbound}</p></article>`).join(''):'<p class="empty-table">Zatím žádný překlad.</p>'}<button class="secondary-button wide" data-action="clear-nat" data-id="${n.id}" ${nat.rows.length?'':'disabled'}>Vymazat tabulku NAT</button><p class="hint" data-device-help="NAT">Bez záznamu nelze příchozí paket přiřadit zařízení. Nové odchozí spojení založí nový překlad. Spusť přenos do internetu; místní tisk přes toto zařízení neprochází.</p></section>`;
  }
  function decision(n) {
    const d=n.lastDecision;if(!d)return '<div class="note-card"><strong>Zatím žádné rozhodnutí v tomto pokusu.</strong>Spusť přenos a krokuj jej až k tomuto zařízení.</div>';
    const old=d.version!==net.version;
    let html=`<div class="decision"><div class="decision-id">PAKET ${d.packetId}${old?' · PŘED ZMĚNOU SÍTĚ':' · TENTO POKUS'}</div>`;
    if(d.kind==='nat-drop')return html+`<h3>NAT paket nepředal do domácnosti</h3><p>${esc(d.reason)}</p></div>`;
    if(d.kind==='satellite')return html+`<h3>Předání satelitních dat</h3><p>Vstup: <code>${d.input}</code><br>Výstup: <code>${d.out}</code></p></div>`;
    if(d.kind==='cellular')return html+`<h3>Předání mobilních dat</h3><p>Vstup: <code>${d.input}</code><br>Výstup: <code>${d.out}</code></p></div>`;
    if(d.action==='direct')html+=`<h3>${d.ports.length?'Paket předal směrem k cíli':'Pro cíl není dostupná cesta'}</h3>`;
    else if(d.kind==='switch')html+=`<h3>${d.known?'Cílová MAC je známá':'Neznámá cílová MAC → rozeslání'}</h3><p>Vstupní port: <code>${d.input}</code></p><p>Zdrojová MAC: <code>${esc(d.src)}</code><br>Cílová MAC: <code>${esc(d.dst)}</code></p><p>Ze <strong>zdrojové</strong> MAC se naučil port ${d.learned}. ${d.known?`Pro cílovou MAC vybral ${d.known}.`:`Cílová MAC v tabulce nebyla. Kopie poslal na ${d.ports.join(', ')||'žádný port'}.`}</p>`;
    else if(!net.detailEnabled('routes'))html+=`<h3>${d.row?'Paket předal dál':'Pro cíl není dostupná cesta'}</h3>`;
    else html+=`<h3>${d.row?'Rozhodnutí podle cílové IP':'Pro cíl není dostupná cesta'}</h3><p>Cílová IP: <code>${d.dst}</code></p>${d.row?`<p>Použitý záznam: <code>${d.row.prefix}</code><br>Výstup: <code>${d.row.out}</code><br>Další uzel: ${d.row.next?`${esc(net.nodes[d.row.next].name)} · ${d.row.nextIp}`:'cílové zařízení v přímo připojené síti'}</p>`:''}`;
    if(d.nat&&net.detailEnabled('nat'))html+=`<h3>NAT · ${d.nat.direction==='out'?'změna zdroje':'obnovení cíle'}</h3>${natComparison(d.nat)}`;
    return html+`${old?'<p>Tabulky už odpovídají aktuálnímu stavu. Toto je záznam dřívějšího rozhodnutí v tomto pokusu.</p>':''}</div>`;
  }
  function centerInfo(n) {
    const centers={partners:['Weby a reklamní partner','Tři samostatné služby v síti 192.0.2.224/27 s vlastní přípojkou. Společná budova neznamená společnou databázi; pro reklamu prohlížeč kontaktuje reklamy.test zvlášť.'],cafe:['Kavárna na rohu',`Veřejná Wi-Fi a samostatná síť 192.168.50.0/24. ${net.detailEnabled('nat')?'Router používá NAT a vlastní přípojku přes router U.':'Vlastní přípojka vede přes router U.'}`],vpn:['VPN centrum','Samostatná síť 192.0.2.128/27 připojená přes router M. Tunel končí na VPN serveru, další provoz pokračuje po internetu.'],dc:['Datové centrum hostingu','Servery různých zákazníků sdílejí switch a přípojku v síti 203.0.113.0/26 přes router V.'],instagram:['Instagram','Samostatné centrum služby ve vlastní síti 203.0.113.64/26, připojené přes druhého poskytovatele. Ikona představuje skupinu serverů.'],cloud:['Cloud · centrum A','Hlavní soubory a přístupová práva v síti 203.0.113.128/26. Změny se zapisují sem; do centra B se kopírují samostatným přenosem.'],replica:['Cloud · centrum B','Druhá lokalita stejného poskytovatele cloudu, síť 203.0.113.192/26. Uchovává samostatnou kopii a poskytuje ji ke čtení i při výpadku centra A.']};
    if(n.region==='partners'&&!net.featureEnabled('ads'))centers.partners=['Webové služby','Samostatné webové servery v síti 192.0.2.224/27 s vlastní přípojkou.'];
    if(!net.detailEnabled('devices')){centers.cafe[1]=`Veřejná Wi-Fi a samostatná síť 192.168.50.0/24.${net.detailEnabled('nat')?' Internetové připojení používá NAT.':''}`;centers.vpn[1]='Samostatná síť 192.0.2.128/27 s vlastní přípojkou. Tunel končí na VPN serveru, další provoz pokračuje po internetu.';centers.dc[1]='Servery různých zákazníků jsou připojené ke společné síti 203.0.113.0/26 a přípojce do internetu.';}
    const c=centers[n.region];return c?`<div class="center-notice" data-device-help="Umístění v síti"><strong>${c[0]}</strong><br>${c[1]}</div>`:'';
  }
  function satelliteInfo(n) {
    const terminal=n.id==='sat-terminal',leo=n.id==='sat-leo',router=n.id==='cabin-router';
    const text=terminal?'Venkovní terminál mění přenos z kabelu na obousměrný rádiový spoj. Potřebuje volný výhled na oblohu.':leo?'Přeposílá data mezi anténou na chatě a pozemní stanicí. Weby, Instagram, cloud a chatbot běží na svých serverech na zemi.':router?`Notebook se připojuje přes Wi-Fi nebo kabel. Router posílá internetový provoz do satelitní antény${net.detailEnabled('nat')?' a překládá soukromé adresy pomocí NAT':''}.`:'Propojuje satelitní přístup s pozemní sítí poskytovatele. Odsud pakety pokračují běžnými routery k datovým centrům.';
    return `<div class="satellite-notice"><strong>${terminal?'Satelitní přístup · anténa':leo?'LEO · nízká oběžná dráha':router?'Připojení k poskytovateli: satelit':'Brána ze satelitní sítě do internetu'}</strong><p data-device-help="Satelitní přístup">${net.detailEnabled('devices')?text:terminal?'Venkovní terminál mění přenos z kabelu na obousměrný rádiový spoj. Potřebuje volný výhled na oblohu.':leo?text:router?'Předává internetový provoz z místní sítě do satelitní antény.':'Propojuje satelitní přístup s pozemní sítí poskytovatele.'}</p><span>${net.physicalCanReach('cabin-router','sat-gateway')?'Satelitní cesta je dostupná':'Satelitní cesta je přerušená'}</span></div>${terminal?`<div class="satellite-view"><strong>${net.satellite.clearView?'Volný výhled na oblohu':'Výhled antény je zakrytý'}</strong><button class="secondary-button" data-action="satellite-view">${net.satellite.clearView?'Zakrýt výhled antény':'Obnovit volný výhled'}</button></div>`:''}${router?`<div class="satellite-view"><strong>Satelitní přípojka ${net.links['cabin-wan'].on?'zapnutá':'vypnutá'}</strong><button class="secondary-button" data-action="toggle-link" data-id="cabin-wan">${net.links['cabin-wan'].on?'Odpojit satelitní přípojku':'Připojit satelitní přípojku'}</button></div>`:''}${leo?'<div class="note-card" data-device-help="Satelitní přístup"><strong>Jedna zastavená poloha pro přehlednost</strong>Skutečné LEO satelity se pohybují a spojení se mezi nimi předává. Model používá jeden pevně zobrazený satelit; oběžné dráhy a předávání spojení nesimuluje.</div>':''}<p class="hint" data-device-help="Satelitní přístup">Rádiový let je zpomalený do tří kroků, aby šel sledovat. Nejde o skutečné milisekundy ani porovnání rychlosti poskytovatelů. Přenosová část anténa–satelit předává IP paket beze změny; rádiové protokoly model nerozepisuje. HTTPS i VPN fungují nad tímto připojením.</p>${router?`<button class="inline-link" data-select-node="cabin" data-open-tab="network">Otevřít notebook na chatě ↗</button>`:''}`;
  }
  function cookieServer() {
    const state=net.server.cookies,last=state.last,busy=sim.status==='running';
    return `<section class="cookie-server" aria-label="Serverové záznamy prohlížečů"><div class="section-label">COOKIES · ROZPOZNÁNÍ PROHLÍŽEČE</div><p class="hint" data-device-help="Cookies">Server hledá identifikátor z hlavičky Cookie. IP adresa ani jméno zařízení tento záznam neurčují. Počet načtení roste při GET stránky; odeslání vzkazu POST se počítá jen do všech požadavků.</p>${net.featureEnabled('tls')?`<label class="cookie-toggle"><input type="checkbox" data-cookie-secure ${state.secureOnly?'checked':''} ${busy?'disabled':''}> Vyžadovat HTTPS pro cookie · Secure</label><p class="hint" data-device-help="Cookies">Přepínač změní příznak Set-Cookie v příští odpovědi. Již uložená cookie se změní až po jejím přijetí. Cookie se Secure poslanou přes HTTP prohlížeč odmítne.</p>`:''}${last?`<div class="cookie-server-last"><strong>${last.returning?'Známý prohlížeč':'Nový identifikátor'} · ${esc(last.id)}</strong><p>${last.received?'Přijatá hlavička:':'Požadavek neobsahoval cookie.'}</p>${last.received?`<code>Cookie: ${esc(last.received)}</code>`:''}<p>Hlavička připravená do odpovědi:</p><code>Set-Cookie: ${esc(last.setCookie)}</code>${sim.packets.has(last.packetId)?`<button class="inline-link" data-select-packet="${last.packetId}">Prozkoumat přijatý paket ↗</button>`:''}</div>`:''}<div class="cookie-server-list">${state.visitors.size?[...state.visitors.values()].map(v=>`<article class="cookie-server-row ${last?.id===v.id?'used':''}"><div><strong>${esc(v.id)}</strong>${last?.id===v.id?'<span>Poslední požadavek</span>':''}</div><p>Načtení stránky: <b>${v.loads}</b> · Všechny požadavky: ${v.requests}</p><small>Poslední zdroj: ${esc(v.lastIp)} · ${v.lastProtocol}</small></article>`).join(''):'<p class="empty-table">Žádné záznamy. Otevři web knihovny v některém zařízení.</p>'}</div><div class="note-card" data-device-help="Cookies">Smazání cookies v zařízení tyto záznamy neodstraní. Bez původního ID další požadavek vytvoří nový záznam. ID v1, v2… je názorná pomůcka; nejde o bezpečný přihlašovací token.</div></section>`;
  }
  function deviceDetail(n) {
    const junction=net.displayType(n)==='junction';
    let html=junction?'':centerInfo(n);
    if(junction) {
      html+='<p class="hint" data-device-help="Jak zařízení funguje">Přijímá pakety a předává je dál směrem k cíli. Když zařízení vypneš, cesty vedoucí přes něj se přeruší.</p>';
      if(['cabin-router','sat-gateway'].includes(n.id))html+=satelliteInfo(n);
      if(!(n.type==='switch'?net.detailEnabled('mac'):net.detailEnabled('routes')||net.detailEnabled('nat')))return html;
    }
    if(['shop','news','ads'].includes(n.id))return html+globalThis.InternetLab.adsServer(net,sim,n)+`<dl class="dl">${definition('Doména',globalThis.InternetLab.AD_HOSTS[n.id])}</dl>`;
    if(n.id==='mail')return html+globalThis.InternetLab.mailServerDetail(net,sim,n);
    if(n.id==='phish-web')return html+globalThis.InternetLab.phishingServerDetail(net,sim,n);
    if(['terminal','satellite'].includes(n.type))return html+satelliteInfo(n)+decision(n);
    if(n.type==='bts')return html+`<p class="hint" data-device-help="Jak zařízení funguje">Spojuje telefon rádiem s připojenou sítí. Přijatá data předává po kabelové přípojce k zařízení ${esc(net.displayName(net.peer(net.adjacent(n.id).find(l=>l.medium==='backhaul'),n.id)))}.</p>${decision(n)}<div class="note-card" data-device-help="Mobilní síť">BTS zajišťuje rádiový přístup. Dál paket pokračuje přes připojené ${net.detailEnabled('devices')?'routery':'chytré křižovatky'} k cíli. Vnitřní IP adresy a TCP segmenty při předání přes BTS zůstávají stejné.</div>`;
    if(n.type==='ap')html+=`<dl class="dl">${definition('Wi-Fi síť',net.wifiProfile(n.id).ssid)}${net.wifiProfile(n.id).password?definition('Heslo k Wi-Fi',net.wifiProfile(n.id).password):''}</dl><p class="hint" data-device-help="Přepínání v LAN">Přístupový bod propojuje bezdrátová zařízení ${net.detailEnabled('devices')?'se switchem':'s chytrou křižovatkou'} v domácí síti.</p>`;
    if(n.type==='switch'||n.type==='ap') {
      if(!junction)html+=`<p class="hint" data-device-help="Jak zařízení funguje">${net.detailEnabled('devices')?`${n.type==='ap'?'Přemosťuje Wi-Fi a Ethernet uvnitř jedné LAN.':'Přeposílá ethernetové rámce uvnitř jedné LAN.'} Pro rozhodování používá MAC adresy.`:'Předává paket jediným dostupným spojem směrem k cíli.'}</p>`;
      if(net.detailEnabled('mac')) {
      html+=decision(n);
      html+='<div class="section-label">AKTUÁLNÍ TABULKA MAC ADRES</div>';
      const entries=Object.entries(n.macTable);
      html+=entries.length?`<table class="data-table"><thead><tr><th>NAUČENÁ ZDROJOVÁ MAC</th><th>PORT</th></tr></thead><tbody>${entries.map(([mac,port])=>`<tr class="${n.lastDecision?.src===mac?'used':''}"><td class="mac-cell">${mac}</td><td>${port}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-table">Tabulka je prázdná.</p>';
      html+=`<div class="section-label">PORTY · STAV PŘEPOSÍLÁNÍ</div>${portList(n)}`;
      }
      html+=`<div class="note-card" data-device-help="Přepínání v LAN">${net.detailEnabled('devices')?'Všechny aktivní porty patří do jedné LAN a přeposílají. Neznámý unicast se rozesílá na ostatní aktivní porty; cílová MAC se přitom nemění. Tabulka na začátku není předvyplněná. První příchozí rámec přidá zdrojovou adresu a vstupní port.':'V tomto režimu se paket nerozkopíruje do dalších zařízení. Učení MAC adres a rozesílání neznámých rámců se zapne volbou Routery a switche.'}</div>`;
    } else if(n.type==='router') {
      if(!junction&&['cabin-router','sat-gateway'].includes(n.id))html+=satelliteInfo(n);
      html+=`${natTable(n)}<p class="hint" data-device-help="Jak zařízení funguje">IP paket předává podle <strong>cílové IP adresy</strong>. Další spoj určuje nejpřesnější odpovídající záznam v tabulce.</p>`;
      if(net.detailEnabled('routes')) {
      html+=decision(n);
      html+='<div class="section-label">AKTUÁLNÍ SMĚROVACÍ TABULKA</div>';
      html+=n.routes.length?`<table class="data-table"><thead><tr><th>CÍLOVÁ SÍŤ</th><th>DALŠÍ IP</th><th>VÝSTUP</th></tr></thead><tbody>${n.routes.map(r=>`<tr class="${n.lastDecision?.version===net.version&&n.lastDecision?.row?.prefix===r.prefix&&n.lastDecision?.row?.link===r.link?'used':''}"><td>${r.prefix}</td><td>${r.nextIp||'přímo'}</td><td>${r.out}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-table">Žádná dostupná cesta.</p>';
      html+=`<details><summary class="hint">Rozhraní a připravené adresy</summary><dl class="dl">${Object.values(n.interfaces).filter(i=>net.linkAvailable(net.links[i.link])).map(i=>['satellite','satellite-access'].includes(net.links[i.link].medium)?definition(`${i.port} · satelitní přenos`,i.ip||'Přenosový kanál bez samostatné IP'):net.links[i.link].medium==='backhaul'?definition(`${i.port} · přípojka BTS`,'Uživatelský kanál mobilní sítě'):definition(`${i.port} · ${net.links[i.link].prefix}`,`${i.ip} · ${i.mac}`)).join('')}</dl></details><div class="section-label">PŘIPOJENÉ SPOJE</div>${portList(n)}`;
      }
      html+=`<div class="note-card" data-device-help="Směrování">Tabulky se po změně spojů přepočítají okamžitě. Metrikou je počet spojů modelové cesty. Při shodě zůstává výběr stabilní, horní větev má přednost. Délka čáry na obrázku není metrika.</div>`;
    } else if(n.id==='dns') {
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Překládá názvy webů na IP adresy (A). Samotný obsah webů je uložený na webových serverech.</p><div class="section-label">PŘIPRAVENÝ DNS ZÁZNAM</div><table class="data-table"><thead><tr><th>NÁZEV</th><th>TYP</th><th>ODPOVĚĎ</th></tr></thead><tbody>${Object.entries(net.dnsRecords).map(([name,ip])=>`<tr><td>${name}</td><td>A</td><td>${ip}</td></tr>`).join('')}</tbody></table>${net.detailEnabled('headers')?`<dl class="dl">${definition('Výchozí brána','203.0.113.1')}</dl>`:''}<div class="note-card" data-device-help="DNS">Notebook má adresu tohoto DNS serveru připravenou. Úspěšnou DNS odpověď si pamatuje do obnovení modelu. Následující načtení webu už DNS nepotřebuje.</div>`;
    } else if(net.hostedSites[n.id]) {
      const site=net.hostedSites[n.id];
      html+=serverStorage(site,site.host);
    } else if(n.id==='web') {
      html+=serverStorage(net.server,'knihovna.test');
      html+=serverServices(net.featureEnabled('tls')?'HTTP · TCP/80 a HTTPS · TLS nad TCP/443':'HTTP · TCP/80');
      if(net.featureEnabled('tls')&&net.featureEnabled('cookies')){html+=globalThis.InternetLab.authServer(net,sim);html+=globalThis.InternetLab.privacyServer(net,sim);}
      if(net.featureEnabled('cookies'))html+=cookieServer();
      const cert=net.server.certificate,last=net.server.lastRequest;
      if(net.featureEnabled('tls'))html+=`<div class="section-label">HTTPS · CERTIFIKÁT SERVERU</div><div class="note-card"><strong>${esc(cert.name)}</strong>Vydavatel: ${esc(cert.issuer)}<br>${cert.valid&&cert.trusted&&cert.name==='knihovna.test'?'Platný a důvěryhodný pro knihovna.test':'Certifikát neprojde ověřením pro knihovna.test'}</div><label class="field-label" for="web-certificate">MODELOVÝ STAV CERTIFIKÁTU</label><select class="text-input" id="web-certificate" data-web-certificate><option value="valid" ${cert.valid&&cert.trusted&&cert.name==='knihovna.test'?'selected':''}>Platný certifikát</option><option value="expired" ${!cert.valid?'selected':''}>Platnost vypršela</option><option value="wrong-name" ${cert.name!=='knihovna.test'?'selected':''}>Patří jiné doméně</option><option value="untrusted" ${!cert.trusted?'selected':''}>Nedůvěryhodný vydavatel</option></select><p class="hint" data-device-help="Jak zařízení funguje">Prohlížeč certifikát ověří při novém HTTPS spojení. Neplatný certifikát zabrání odeslání formuláře. HTTP certifikát nepoužívá.</p>`;
      html+=`${last?`<div class="section-label">POSLEDNÍ ZPRACOVANÝ POŽADAVEK</div><div class="note-card"><strong>${last.secure?'HTTPS · dešifrováno na serveru':'HTTP · přijato jako čitelný text'}</strong>${esc(net.nodes[last.client].name)} · ${esc(last.method)} ${esc(last.path)}<br>Zdroj viděný webem: ${esc(last.sourceIp)}:${last.sourcePort}</div><div class="payload-preview">${esc(requestText(last))}</div>`:''}`;
    } else if(n.id==='vpn') {
      const v=net.vpn,last=v.last,clients=Object.entries(v.clients).filter(([id])=>net.nodeAvailable(id)&&net.vpnPeerValid(id));
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Šifrovaný tunel končí zde. VPN server sejme vnější obal a původní paket předá do internetu. ${net.detailEnabled('nat')?'Cílová služba uvidí veřejnou IP VPN serveru.':'Cílová služba uvidí vnitřní IP zařízení ve VPN.'} Případné HTTPS uvnitř server VPN nedešifruje.</p><div class="section-label">AKTIVNÍ VPN SPOJENÍ</div>${clients.length?clients.map(([id,c])=>`<div class="vpn-client-row"><strong>${esc(net.nodes[id].name)}</strong><span>Vnitřní IP ${c.ip}</span><small>Do internetu: ${formatPackets(c.sent)} · Zpět: ${formatPackets(c.received)}</small></div>`).join(''):'<p class="empty-table">Žádné aktivní VPN spojení.</p>'}${last?`<div class="section-label">POSLEDNÍ PAKET · POHLED VPN SERVERU</div><div class="payload-preview">${esc(last.preview)}</div>`:''}${net.detailEnabled('nat')?`<div class="section-label">VÝSTUP DO INTERNETU · NAT/PAT</div>${v.rows.length?v.rows.map(r=>`<article class="vpn-exit-row"><strong>${esc(net.nodes[r.client].name)} · ${r.protocol}</strong><code>${r.insideIp}:${r.insidePort} ↔ ${r.outsideIp}:${r.outsidePort}</code><span>Protějšek ${r.remoteIp}:${r.remotePort}<br>Ven ${r.outbound} · zpět ${r.inbound}</span></article>`).join(''):'<p class="empty-table">Zatím žádný přenos přes VPN.</p>'}`:''}<p class="hint" data-device-help="Jak zařízení funguje">VPN neznamená anonymitu. Provozovatel VPN zná cílové služby; HTTP může číst, obsah HTTPS chrání samostatné TLS mezi prohlížečem a webem.</p>${net.detailEnabled('headers')?`<dl class="dl">${definition('Síť VPN centra','192.0.2.128/27')}${definition('Služby','Modelový šifrovaný tunel · UDP / 51820')}</dl>`:''}`;
    } else if(n.id==='chatbot') {
      const server=net.chatbot.server,state={idle:'Čeká na první dotaz',receiving:'Přijímá dotaz',processing:`Zpracovává dotaz · ${server.step} / 3`,ready:'Odpověď připravena na serveru',interrupted:'Zpracování přerušeno'}[server.state];
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Zařízení odešle text po síti. Teprve po přijetí celého dotazu tento server spustí program chatbota a připraví odpověď.</p><div class="status-box"><strong>${state}</strong>Dokončené výpočty: ${server.processed}<br>Přijato z posledního dotazu: ${server.receivedBytes} / ${server.totalBytes} B${server.client?`<br>Zařízení: ${esc(net.nodes[server.client].name)}`:''}</div>${server.prompt?`<div class="section-label">POSLEDNÍ CELÝ DOTAZ NA SERVERU</div><div class="payload-preview">${esc(server.prompt)}</div>`:''}${server.answer?`<div class="endpoint-result"><strong>Odpověď připravená na serveru</strong>${esc(server.answer)}</div><p class="hint" data-device-help="Jak zařízení funguje">Připravená odpověď ještě nemusí být doručená. Zařízení ji zobrazí až po návratu všech bajtů.</p>`:''}<div class="note-card" data-device-help="Chatbot"><strong>Výpočet probíhá zde</strong>Tři kroky názorně oddělují přijetí dotazu, spuštění programu a přípravu odpovědi. Program v této ukázce vrací vždy stejný text. Routery dotaz jen předávají a zařízení zobrazuje doručený výsledek.</div>${serverServices('Modelový chatbot · TCP / 443')}`;
    } else if(n.id==='instagram') {
      const ig=net.instagram,recipient=ig.recipientDevice==='friend'?'@matej':'@ty.na.lipove';
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Uchová celou zprávu. Příjemci ji odešle až jako odpověď na jeho kontrolu nových zpráv.</p>${ig.text?`<div class="endpoint-result"><strong>Zpráva uchovaná na serveru</strong><div class="instagram-server-recipient">Příjemce: ${recipient}</div>${ig.content?.type!=='text'?messagePreview(ig.content):esc(ig.text)}</div>`:'<p class="empty-table">Zatím žádná přijatá zpráva.</p>'}${ig.readKnown?`<div class="status-box"><strong>Instagram přijal potvrzení přečtení</strong>${ig.readNotified?'Potvrzení už dorazilo do zařízení odesílatele.':'Čeká na doručení do zařízení odesílatele.'}</div>`:''}${serverServices('Modelové spojení Instagramu · TCP / 443')}<div class="note-card" data-device-help="Instagram">Na obou stranách služby jsou samostatná spojení. Zařízení příjemce automaticky kontroluje nové zprávy; model ukazuje jednu kontrolu pro každé doručení místo pravidelných dotazů na pozadí. Server odpoví novými pakety až po přijetí požadavku. Při nedostupném příjemci zprávu uchová.</div>`;
    } else if(n.id==='cloud'||n.id==='cloud-backup') {
      const storage=net.cloud,backup=n.id==='cloud-backup',files=backup?storage.replica.files:storage.files;
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Změny souborů i práv se automaticky kopírují po síti do centra B. Při výpadku zůstává poslední úplná kopie a synchronizace pokračuje po obnovení spojení.</p>`;
      html+=`<p class="hint" data-device-help="Jak zařízení funguje">Cloud ukládá soubory na vzdáleném serveru. Každý požadavek kontroluje podle přihlášeného uživatele a práv souboru. IP adresa slouží k doručení; totožnost představuje připravené přihlášení v aplikaci.</p><div class="section-label">SOUBORY NA SERVERU</div>${[...files.values()].map(f=>`<div class="note-card"><strong>${esc(f.name)}</strong>${esc(f.id)} · verze ${f.version} · vlastník ${f.owner==='ty'?'Ty':'Matěj'}<br>${Object.entries(f.permissions).filter(([,v])=>v!=='none').map(([id,role])=>`${id==='ty'?'Ty':'Matěj'}: ${role==='write'?'čtení a úpravy':'čtení'}`).join(', ')||'Soukromý soubor'}</div>`).join('')}${serverServices('Modelové spojení cloudu · TCP / 443')}<div class="note-card" data-device-help="Cloud">Správcovský přehled ukazuje globální stav simulace. V noteboocích se seznam i obsah souborů zobrazí až po přijetí odpovědi serveru. Stažená místní kopie zůstává i po odebrání přístupu.</div>`;
    } else if(n.id==='printer') {
      html+=net.printer.count?`<div class="endpoint-result"><strong>Vytištěné dokumenty · ${net.printer.count}</strong>${esc(net.printer.document)}</div>`:'<div class="doc-preview"><p>Tiskárna čeká na dokument.</p></div>';
      if(net.printer.state==='error')html+='<div class="status-box error">Poslední tiskový pokus selhal. Dříve vytištěné dokumenty zůstávají vytištěné.</div>';
      html+=`<dl class="dl">${definition('IP adresa / podsíť',`${n.ip} / 24`)}${definition('MAC adresa',n.mac)}${definition('Modelová tisková služba','TCP · port 9100')}</dl>`;
    }
    return html;
  }
  function linkTitle(link) {return {cable:'Kabelové spojení','satellite-access':'Kabelové spojení',backhaul:'Kabelové spojení',wifi:'Bezdrátové spojení – Wi-Fi',cellular:'Bezdrátové spojení – mobilní síť',satellite:'Bezdrátové spojení – satelit'}[link.medium];}
  function linkDetail(id) {
    const l=net.links[id],a=net.nodes[l.a],b=net.nodes[l.b],medium={'satellite-access':'Kabel do satelitního terminálu','satellite':'Satelitní rádio · obousměrný přenos',cable:'Kabel · Ethernet',wifi:'Wi-Fi · rádio',cellular:'Mobilní data · rádio',backhaul:`Kabelová přípojka BTS k zařízení ${net.displayName(b)}`}[l.medium];
    const detailed=net.detailEnabled('mac')||net.detailEnabled('routes');
    let problem='';
    if(!l.on)problem='Spoj je odpojený.';
    else if(!a.on||!b.on)problem='Spoj nefunguje, protože je některé z připojených zařízení vypnuté.';
    else if(l.requiresView&&!net.satellite.clearView)problem='Spoj nefunguje, protože je zakrytý výhled satelitní antény.';
    else if(!net.selectedAccess(l))problem='Spoj se nyní nepoužívá. Zařízení má vybrané jiné připojení.';
    const status=problem?`<div class="status-box ${!l.on||!a.on||!b.on||l.requiresView&&!net.satellite.clearView?'error':''}" role="status">${esc(problem)}</div>`:'';
    return `${status}${detailed?`${['wifi','satellite','backhaul'].includes(l.medium)?`<div class="note-card"><strong>${esc(medium)}</strong>${l.medium==='satellite'?'Rádiová část satelitního přístupu spojuje uživatelskou anténu, satelit LEO a pozemní stanici. Ta předává pakety do pozemního internetu. Let je zpomalený do tří modelových kroků.':l.medium==='wifi'?'Rádiový úsek vede pouze k přístupovému bodu. Dál data pokračují domácí sítí.':'Telefon komunikuje rádiem s BTS, která paket předá po této přípojce dál do sítě. Domácí Wi-Fi ani přípojku bytu tato cesta nepoužívá.'}</div>`:''}<dl class="dl" style="margin-top:24px">${definition('První konec',`${net.displayName(a)} · ${l.pa}`)}${definition('Druhý konec',`${net.displayName(b)} · ${l.pb}`)}${definition('Připojená síť',l.prefix)}</dl>`:''}`;
  }
  function packetDetail(id) {
    const p=sim.packets.get(id);
    return p?globalThis.InternetLab.packetView(net,p):'<p class="hint">Paket už není součástí tohoto pokusu. Vyber paket z právě probíhajícího přenosu.</p>';
  }
  function pruneUnavailable(root) {
    root.querySelectorAll('[data-select-node], [data-select-link], [data-ads-open]').forEach(el=>{
      if((el.dataset.adsOpen&&el.dataset.adsOpen!=='library'&&!net.nodeAvailable(el.dataset.adsOpen))||el.dataset.selectNode&&!net.nodeAvailable(el.dataset.selectNode)||el.dataset.selectLink&&!net.linkAvailable(net.links[el.dataset.selectLink]))el.remove();
    });
  }
  function applySettings(next) {
    if(net.settings.sameNetwork(next)){
      const devicesChanged=net.detailEnabled('devices')!==next.details.devices;net.settings=next;
      if(devicesChanged){sim.deviceModeChanged();map.finishAnimations();}
      render();return;
    }
    journey.clear();stop();sim.auth.cancel();sim.onAsyncReady=null;settingsWasPlaying=false;ui.transferOutcome=null;
    net=new Network(next);sim=new Simulation(net);
    for(const key of Object.keys(ui))delete ui[key];
    Object.assign(ui,createUI());
    browserNavigation=ui.browserNavigation=new globalThis.InternetLab.BrowserNavigation(net);
    for(const device of Object.keys(browserNavigation.devices))ui[addressKey(device)]='';
    map.finishAnimations();map.net=net;map.lastEvent=null;map.frame=[];map.packets=sim.packets;
    remaining=0;computerViewKey='';deviceViewKey='';setScene('all');render();
    notify('Nová sestava je připravená. Otevři notebook a spusť přenos.');
  }
  function render(animate=false) {
    const networkDetails=$('#connection-panel .network-details');
    if(networkDetails&&ui.networkPanel===ui.monitorDevice)networkDraft().details=networkDetails.open;
    sim.onAsyncReady=()=>render();
    journey.observe(sim,{blocked:ui.packetOpen||$('#settings-dialog').open,sourceOn:!journey.current||net.nodes[journey.current.device]?.on});
    for(const [device,draft] of Object.entries(ui.mailComposer))if(draft.sendingId&&net.phishing.clients[device].sent.some(m=>m.id===draft.sendingId))Object.assign(draft,{sendingId:null,subject:'',body:'',phishBody:null,phishSubject:null,composeOpen:false});
    const webStarted=browserNavigation.sync(sim);
    if(webStarted)ui[addressKey(webStarted)]=browserNavigation.active(webStarted).draft;
    for(const device of Object.keys(net.cloud.clients)) {
      const client=net.cloud.clients[device],draft=ui.cloud[device];
      if(draft.resultSerial!==client.resultSerial){
        draft.resultSerial=client.resultSerial;
        if(client.state==='ready'&&sim.action?.type==='cloud'&&sim.clientId()===device){
          if(sim.action.payload.request.op==='upload')Object.assign(draft,{view:'files',remoteId:null,remoteVersion:null,cloudName:'',cloudContent:''});
          if(sim.action.payload.request.op==='permissions')draft.shareId=null;
          if(sim.action.payload.preview&&draft.view==='preview'&&client.preview?.id===draft.remoteId&&client.preview.server==='cloud'&&['owner','write'].includes(client.preview.access))Object.assign(draft,{view:'editor',cloudName:client.preview.name,cloudContent:client.preview.content,remoteVersion:client.preview.version,editorKey:draft.editorKey+1});
          if(sim.action.payload.request.op!=='list')notify(client.message.replace(/^\d+ · /,''));
        }
      }
      if(draft.downloadSerial!==client.downloadSerial){draft.downloadNotice=client.lastDownload;draft.downloadSerial=client.downloadSerial;}
    }
    const videoStates=[...document.querySelectorAll('#monitor-content video')].map((v,i)=>({key:v.closest('[data-instagram-message]')?.dataset.instagramMessage||`index:${i}`,time:v.currentTime,paused:v.paused,device:ui.monitorDevice,src:v.querySelector('source')?.getAttribute('src')}));
    const focused=document.activeElement,networkPassword=focused?.hasAttribute('data-network-password'),networkFocus=focused?.closest('#connection-panel')?focused.dataset.networkFocus:null,networkScroll=$('#connection-panel .network-panel-scroll')?.scrollTop||0,browserFocus=focused?.dataset?.browserFocus,authField=focused?.dataset?.authField,mailField=focused?.dataset?.mailField,field=focused?.dataset?.field,start=focused?.selectionStart,end=focused?.selectionEnd;
    const key=ui.monitorOpen?`${ui.monitorDevice}:${ui.monitorDevice==='cafe-attacker'?ui.cafeAttackerTab:ui.monitorDevice==='cafe'?ui.cafeTab:ui.monitorDevice==='hacker'?ui.hackerTab:ui.monitorDevice==='cabin'?ui.cabinTab:ui.monitorDevice==='friend'?ui.friendTab:ui.monitorDevice==='phone'?ui.phoneTab:ui.tab}`:'';
    const browserKey=ui.monitorOpen&&browserNavigation.state(ui.monitorDevice)&&key.endsWith(':web')?`${browserNavigation.active(ui.monitorDevice)?.id}:${browserNavigation.active(ui.monitorDevice)?.page}:${browserNavigation.state(ui.monitorDevice)?.panel}`:'';
    const fullComputerKey=key+':'+browserKey;
    const computerDetails=fullComputerKey===computerViewKey?[...document.querySelectorAll('.computer-app-body details[open]')].map(d=>d.dataset.detailKey||d.querySelector('summary')?.textContent):[];
    const computerScroll=fullComputerKey===computerViewKey?$('.computer-app-body')?.scrollTop||0:0;
    const taskbarScroll=fullComputerKey===computerViewKey?$('.taskbar-apps')?.scrollLeft||0:0;
    const mailScroll=fullComputerKey===computerViewKey?$('.gmail-scroll')?.scrollTop||0:0;
    const oldDrive=$('.drive-scroll'),driveScroll=fullComputerKey===computerViewKey&&oldDrive?{key:oldDrive.dataset.viewKey,top:oldDrive.scrollTop}:null;
    const cloudTextScroll=['cloudContent','filesContent'].includes(field)?focused.scrollTop:null;
    const oldChat=$('.ig-conversation, .chatbot-conversation');
    const chatScroll=fullComputerKey===computerViewKey&&oldChat?{top:oldChat.scrollTop,turns:oldChat.dataset.turnCount,bottom:oldChat.scrollHeight-oldChat.scrollTop-oldChat.clientHeight<24}:null;
    computerViewKey=fullComputerKey;
    const infoOpen=ui.deviceOpen||ui.linkOpen||ui.packetOpen;
    const deviceKey=infoOpen?`${ui.selection.kind}:${ui.selection.id}`:'',sameDevice=deviceKey!==''&&deviceKey===deviceViewKey;
    const deviceScroll=sameDevice?$('#device-body').scrollTop:0;
    const helpScroll=sameDevice?$('#device-help-content').scrollTop:0;
    if(!sameDevice)setDeviceHelpOpen(false);
    const expanded=sameDevice?[...document.querySelectorAll('#device-body details[open]')].map(d=>d.dataset.detailKey||d.querySelector('summary')?.textContent):[];
    const deviceToggleFocused=sameDevice&&focused?.matches('#device-content [data-action="toggle-node"], #device-content [data-action="toggle-link"]')?{action:focused.dataset.action,id:focused.dataset.id}:null;
    deviceViewKey=deviceKey;
    $('#monitor-overlay').hidden=!ui.monitorOpen;
    $('#monitor-content').classList.toggle('phone-window',ui.monitorDevice==='phone');
    $('#monitor-content').innerHTML=ui.monitorOpen?computerView(net,sim,ui):'';
    if(ui.monitorOpen&&ui.transferOutcome?.device===ui.monitorDevice){
      const notice=document.createElement('div');notice.className=`transfer-outcome ${ui.transferOutcome.status}`;notice.setAttribute('role','status');notice.textContent=ui.transferOutcome.text;
      $('#monitor-content .monitor-heading')?.after(notice);
    }
    renderJourney();
    if($('#connection-panel .network-panel-scroll'))$('#connection-panel .network-panel-scroll').scrollTop=networkScroll;
    if(networkFocus)$(`[data-network-focus="${networkFocus}"]`)?.focus({preventScroll:true});
    if(networkPassword){const input=$('#wifi-password');if(input){input.focus({preventScroll:true});if(typeof start==='number')input.setSelectionRange(start,end);}}
    document.querySelectorAll('.computer-app-body details').forEach(d=>{if(computerDetails.includes(d.dataset.detailKey||d.querySelector('summary')?.textContent))d.open=true;});
    if($('.real-browser'))$('.real-browser').style.setProperty('--browser-panel-height',`${Math.max(80,$('.computer-app-body').clientHeight-$('.browser-chrome').offsetHeight-12)}px`);
    if($('.computer-app-body'))$('.computer-app-body').scrollTop=computerScroll;
    const taskbar=$('.taskbar-apps'),activeApp=taskbar?.querySelector('.taskbar-app.active');
    if(taskbar) {
      taskbar.scrollLeft=taskbarScroll;
      if(activeApp&&activeApp.offsetLeft<taskbar.scrollLeft)taskbar.scrollLeft=activeApp.offsetLeft;
      else if(activeApp&&activeApp.offsetLeft+activeApp.offsetWidth>taskbar.scrollLeft+taskbar.clientWidth)taskbar.scrollLeft=activeApp.offsetLeft+activeApp.offsetWidth-taskbar.clientWidth+10;
    }
    if($('.gmail-scroll'))$('.gmail-scroll').scrollTop=mailScroll;
    const drive=$('.drive-scroll');if(drive&&driveScroll?.key===drive.dataset.viewKey)drive.scrollTop=driveScroll.top;
    const chat=$('.ig-conversation, .chatbot-conversation');if(chat)chat.scrollTop=chat.dataset.turnCount==='0'?0:!chatScroll||chatScroll.bottom||chat.dataset.turnCount!==chatScroll.turns?chat.scrollHeight:chatScroll.top;
    document.querySelectorAll('#monitor-content video').forEach((video,i)=>{const key=video.closest('[data-instagram-message]')?.dataset.instagramMessage||`index:${i}`,state=videoStates.find(v=>v.key===key&&v.device===ui.monitorDevice&&v.src===video.querySelector('source')?.getAttribute('src'));if(state){const restore=()=>{video.currentTime=state.time;if(!state.paused)video.play().catch(()=>{});};if(video.readyState)restore();else video.addEventListener('loadedmetadata',restore,{once:true});}});
    $('#device-overlay').hidden=!infoOpen;
    $('#device-content').classList.toggle('packet-window',ui.packetOpen);
    $('#device-content').classList.toggle('link-window',ui.linkOpen);
    $('#device-content').setAttribute('aria-labelledby',ui.packetOpen?'packet-title':ui.linkOpen?'link-title':'device-title');
    $('#device-content .device-close').setAttribute('aria-label',`Zavřít informace o ${ui.packetOpen?'paketu':ui.linkOpen?'spoji':'zařízení'} a vrátit se k mapě`);
    const selectedNode=ui.deviceOpen?net.nodes[ui.selection.id]:null,selectedLink=ui.linkOpen?net.links[ui.selection.id]:null;
    const windowTitle=$('.device-window-title');windowTitle.id=ui.packetOpen?'packet-title':ui.linkOpen?'link-title':'device-title';windowTitle.hidden=!infoOpen;
    windowTitle.textContent=ui.packetOpen?'Paket':selectedNode?net.displayName(selectedNode):selectedLink?linkTitle(selectedLink):'';
    const controls=$('#device-controls');controls.hidden=!selectedNode&&!selectedLink;
    controls.innerHTML=selectedNode?button('toggle-node',selectedNode.on?'Vypnout zařízení':'Zapnout zařízení',`toggle-button device-control-button ${selectedNode.on?'danger':''}`,`data-id="${selectedNode.id}"`):selectedLink?button('toggle-link',selectedLink.on?'Odpojit spoj':'Obnovit spoj',`toggle-button device-control-button ${selectedLink.on?'danger':''}`,`data-id="${selectedLink.id}"`):'';
    $('#device-body').innerHTML=ui.packetOpen?packetDetail(ui.selection.id):ui.linkOpen?linkDetail(ui.selection.id):ui.deviceOpen?deviceDetail(net.nodes[ui.selection.id]):'';
    organizeDeviceHelp($('#device-body'));
    pruneUnavailable($('#device-content'));pruneUnavailable($('#monitor-content'));
    $('#device-help-content').scrollTop=helpScroll;
    if(infoOpen) {
      document.querySelectorAll('#device-body details').forEach(d=>{d.open=expanded.includes(d.dataset.detailKey||d.querySelector('summary')?.textContent);});
      $('#device-body').scrollTop=deviceScroll;
      if(deviceToggleFocused)$(`#device-content [data-action="${deviceToggleFocused.action}"][data-id="${deviceToggleFocused.id}"]`)?.focus({preventScroll:true});
    }
    if(browserFocus&&!field&&!authField)$(`[data-browser-focus="${browserFocus}"]`)?.focus({preventScroll:true});
    if(authField){const el=$(`[data-auth-field="${authField}"]`);if(el){el.focus({preventScroll:true});if(typeof start==='number'&&el.type!=='email')el.setSelectionRange(start,end);}}
    if(mailField){const el=$(`[data-mail-field="${mailField}"]`);if(el){el.focus({preventScroll:true});if(typeof start==='number'&&['text','search','textarea'].includes(el.type))el.setSelectionRange(start,end);}}
    if(field) {const el=$(`[data-field="${field}"]`);if(el){el.focus({preventScroll:true});if(typeof start==='number')el.setSelectionRange(start,end);if(cloudTextScroll!==null)el.scrollTop=cloudTextScroll;}}
    const current=sim.current;
    $('#event-title').textContent=net.displayText(current?.title||'')||'Síť čeká na tvůj první přenos';$('#event-description').textContent=net.displayText(current?.description||'')||(ui.monitorOpen?(ui.monitorDevice==='cafe-attacker'?'Otevři MITM a nastav hotspot.':ui.monitorDevice==='cafe'?(net.accessReady('cafe')?'Otevři Prohlížeč a načti web.':'V Připojení nejprve vyber Wi-Fi.'):ui.monitorDevice==='hacker'?'Otevři Správu webu nebo Gmail.':ui.monitorDevice==='cabin'?'Otevři některou z dostupných aplikací na chatě.':ui.monitorDevice==='friend'?'Otevři některou z dostupných aplikací u Matěje.':ui.monitorDevice==='phone'?'Otevři některou z dostupných aplikací v telefonu.':'Na ploše otevři některou z dostupných aplikací.'):'Klikni na notebook v mapě a otevři jeho plochu.');
    $('#run-dot').className=`status-dot ${sim.status}`;
    $('.transport-buttons').hidden=sim.status!=='running';
    $('#toggle-explanation').hidden=sim.status!=='running';
    if(sim.status!=='running')setExplanationOpen(false);
    $('#play').disabled=ui.packetOpen||sim.status!=='running';$('#play').innerHTML=playing?'Ⅱ <span>Pauza</span>':'▶ <span>Pokračovat</span>';$('#play').setAttribute('aria-label',playing?'Pozastavit přenos':'Pokračovat v přenosu');
    $('#step').disabled=ui.packetOpen||sim.status!=='running'||sim.auth.working;$('#repeat').disabled=ui.packetOpen||!sim.lastAction;
    $('#playback-speed').value=String(playbackRate);$('#cancel-transfer').disabled=sim.status!=='running';
    map.setSignalWavesPlaying((sim.status!=='running'||playing)&&!ui.packetOpen&&!$('#settings-dialog').open);
    map.render(current,ui.selection,ui.selection.kind==='packet'?ui.selection.id:null,animate,ANIMATION_DELAY,sim.packets,sim.frame);
  }
  function advance() {if(ui.packetOpen)return;map.finishAnimations();remaining=0;sim.advanceFrame();if(sim.status!=='running')stop();render(true);resumeBackground();}
  function schedule(delay=ANIMATION_DELAY/playbackRate) {
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
  function startMail(type,extra={}){
    if(ui.packetOpen||sim.status==='running')return;stop();
    const device=ui.monitorDevice;if(!sim.start(type,{device,...extra}))return;
    const draft=ui.mailComposer[device];
    if(draft&&['mail-send','phish-send'].includes(type))Object.assign(draft,{sendingId:sim.action.payload.messageId,composeOpen:false,tab:'sent',sentId:null});
    if(ui.monitorOpen)ui.selection={kind:'node',id:device};
    if(type!=='mail-seen'&&['home','hacker'].includes(ui.scene))setScene('all');beginTransfer('mail');
  }
  function startPhishing(type) {
    if(ui.packetOpen||sim.status==='running')return;stop();
    const device=ui.monitorDevice;if(!sim.start(type,{device}))return;
    ui.selection={kind:'node',id:device};if(['home','hacker'].includes(ui.scene))setScene('all');beginTransfer('attack');
  }
  function startAction(type,extra={}) {
    if(ui.packetOpen||sim.status==='running')return;
    const device=ui.monitorDevice,message=ui[messageKey(device)],address=ui[addressKey(device)];
    const payload={device,messageType:ui[messageKey(device,'messageType')],...(type==='chatbot'?{prompt:ui.chatbot[device]}:type==='web'?{address,...extra}:type==='print'?{document:ui.document.trim()}:{text:message})};
    if(type==='chatbot'&&!payload.prompt.trim()){notify('Nejprve napiš dotaz.');return;}
    if(type==='message'&&payload.messageType==='text'&&!message.trim()){notify('Nejprve napiš zprávu.');return;}
    if(type==='print'&&!ui.document.trim()){notify('Pojmenuj dokument.');return;}
    stop();if(!sim.start(type,payload)){render();return;}ui.selection={kind:'node',id:device};ui.monitorDevice=device;ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;syncReader();
    if(type==='chatbot')ui.chatbot[device]='';
    if(type!=='print'&&ui.scene==='home')setScene('all');
    beginTransfer(type==='message'?'message':type==='print'?'print':type==='chatbot'?'chatbot':'web');
  }
  function handleInput(e) {
    if(e.target.hasAttribute('data-network-password')){networkDraft().password=e.target.value;return;}
    if(e.target.dataset.connectionField){const id=e.target.closest('[data-device]').dataset.device;ui.connectionDrafts[id]??={...net.connectionProfiles[id]};ui.connectionDrafts[id][e.target.dataset.connectionField]=e.target.value;return;}
    if(e.target.dataset.authField){ui.authDraft[ui.monitorDevice][e.target.dataset.authField]=e.target.value;return;}
    if(e.target.dataset.mailField){const field=e.target.dataset.mailField,draft=ui.mailComposer[ui.monitorDevice];draft[field]=e.target.value;if(field==='search'){draft.sentId=null;net.phishing.clients[ui.monitorDevice].opened=false;}if(['target','search'].includes(field)&&!e.isComposing)render();return;}
    if(['phishUsername','phishPassword'].includes(e.target.dataset.field)){ui.phishDraft[ui.monitorDevice][e.target.dataset.field==='phishUsername'?'username':'password']=e.target.value;return;}
    if(e.target.dataset.field==='webMessage'){ui.webMessages[ui.monitorDevice]=e.target.value;return;}
    if(e.target.dataset.field==='chatPrompt'){ui.chatbot[ui.monitorDevice]=e.target.value;return;}
    if(['filesName','filesContent'].includes(e.target.dataset.field)){ui.files[ui.monitorDevice][e.target.dataset.field==='filesName'?'name':'content']=e.target.value;return;}
    if(['cloudName','cloudContent'].includes(e.target.dataset.field)) {ui.cloud[ui.monitorDevice][e.target.dataset.field]=e.target.value;return;}
    const field=e.target.dataset.field;if(!field)return;const key=ui.monitorOpen&&['phone','cabin','friend'].includes(ui.monitorDevice)&&field==='message'?`${ui.monitorDevice}${field[0].toUpperCase()}${field.slice(1)}`:field;ui[key]=e.target.value;
    if(field==='message')render();
  }
  function handleSubmit(e) {
    e.preventDefault();const form=e.target.dataset.form;
    if(form==='wifi-connect'){connectWifi(e.target.dataset.network,networkDraft().password);return;}
    if(form==='mitm-hotspot'){
      if(ui.monitorDevice!=='cafe-attacker'||sim.status==='running')return;
      const ssid=ui.mitmSsid.trim();if(!ssid||ssid.length>32){notify('Zadej název Wi-Fi o 1–32 znacích.');return;}
      sim.mitm.configure(net.mitm.active,net.mitm.mode,ssid);ui.mitmSsid=net.mitm.ssid;render();return;
    }
    if(form==='connection-profile'){
      const id=e.target.dataset.device,values=new FormData(e.target),profile={bandwidth:values.get('bandwidth'),latency:values.get('latency')};
      if(net.setConnectionProfile(id,profile)){delete ui.connectionDrafts[id];notify('Vlastnosti připojení jsou nastavené pro další přenos.');render();$(`#monitor-content [data-form="connection-profile"] button`).focus({preventScroll:true});}
      return;
    }
    if(form==='auth'){const d=ui.authDraft[ui.monitorDevice],address='https://knihovna.test';ui[addressKey(ui.monitorDevice)]=address;if(!sim.auth.validate({...d,device:ui.monitorDevice,address,authOp:d.mode})){notify('Použij jméno o 3–24 znacích (a–z, číslice, _ nebo -), heslo o 4–80 znacích a fiktivní e-mail končící .test.');return;}startAction('web',{address,authOp:d.mode,username:d.username,password:d.password,...(d.mode==='register'?{email:d.email}:{})});return;}
    if(form==='phish-mail'){if(ui.monitorDevice==='hacker'){const {target,phishBody,phishSubject}=ui.mailComposer.hacker;startMail('phish-send',{target,...(phishSubject!==null&&phishSubject!==undefined?{subject:phishSubject}:{}),...(phishBody!==null&&phishBody!==undefined?{body:phishBody}:{})});}return;}
    if(form==='mail-send'){const {target,subject,body}=ui.mailComposer[ui.monitorDevice];startMail('mail-send',{target:fixedMailRecipient(ui.monitorDevice)||target,subject,body});return;}
    if(form==='phish-login'){const b=net.browserFor(ui.monitorDevice);ui[addressKey(ui.monitorDevice)]=`${b.loadedSecure?'https':'http'}://knihovna-podpora.test/overeni${b.loadedMessageId?'?zprava='+b.loadedMessageId:''}`;startAction('web',{method:'POST',phishLogin:true,...ui.phishDraft[ui.monitorDevice]});
    }else if(form==='web-message') {
      const device=ui.monitorDevice,b=net.browserFor(device),address=b.loadedSecure?'https://knihovna.test':'http://knihovna.test';
      if(!ui.webMessages[device].trim()){notify('Nejprve napiš vzkaz.');return;}
      ui[addressKey(device)]=address;
      startAction('web',{address,method:'POST',message:ui.webMessages[device]});
    } else if(form==='files-save') {
      if(saveLocal()){notify('Soubor je uložený v tomto zařízení.');render();}
    } else if(form==='cloud-save') {
      const d=ui.cloud[ui.monitorDevice];startCloud({op:'upload',name:d.cloudName,content:d.cloudContent,...(d.remoteId?{fileId:d.remoteId,version:d.remoteVersion}:{})});
    } else if(form==='cloud-permissions') {
      const fileId=e.target.dataset.cloudId,draft=ui.cloud[ui.monitorDevice],file=net.cloud.clients[ui.monitorDevice].catalog.find(f=>f.id===fileId&&f.access==='owner');
      if(file)startCloud({op:'permissions',fileId,userId:draft.shareUser,permission:e.submitter?.hasAttribute('data-cloud-revoke')?'none':'write',aclVersion:file.aclVersion});
    } else startAction(form);
  }
  function handleClick(e) {
    if(e.target===$('#monitor-overlay')){closeMonitor();return;}
    if(e.target===$('#device-overlay')){closeDevice();return;}
    if(e.target.hasAttribute('data-cloud-picker-backdrop')){closeCloudPicker();return;}
    if(e.target.hasAttribute('data-cloud-share-backdrop')){closeCloudShare();return;}
    const addMenu=$('.drive-add');if(addMenu?.open&&!e.target.closest('.drive-add'))addMenu.open=false;
    const b=e.target.closest('button');
    const webState=ui.monitorOpen?browserNavigation.state(ui.monitorDevice):null;
    if(webState&&['menu','security'].includes(webState.panel)&&!e.target.closest('.browser-chrome')){webState.panel=null;if(!b){render();return;}}
    if(!b||b.disabled)return;
    if(b.dataset.browserTab||b.dataset.browserClose||b.dataset.browserNav||b.dataset.browserPage||b.dataset.browserUrl) {
      const device=ui.monitorDevice,state=browserNavigation.state(device),tab=browserNavigation.active(device),busy=sim.status==='running',previousPanel=state?.panel;
      if(!state)return;
      if(b.dataset.browserUrl){if(busy)return;ui[addressKey(device)]=b.dataset.browserUrl;startAction('web');return;}
      if(b.dataset.browserPage){tab.page=b.dataset.browserPage;state.panel=null;render();return;}
      if(b.dataset.browserTab){if(!browserNavigation.select(device,b.dataset.browserTab,busy))return;}
      else if(b.dataset.browserClose){
        const last=state.tabs.length===1;
        if(!browserNavigation.close(device,b.dataset.browserClose,busy))return;
        if(last){
          if(journey.current?.device===device&&journey.current.app==='web')journey.clear();
          ui[addressKey(device)]='';openComputerApp('desktop');return;
        }
      }
      else {
        const action=b.dataset.browserNav;
        if(action==='reload') {
          if(busy)return;
          if(!tab.url)return;ui[addressKey(device)]=tab.url;startAction('web',{browserReload:true});return;
        }
        if(action==='new'){if(!browserNavigation.add(device,busy))return;}
        else if(action==='menu'||action==='security')state.panel=state.panel===action?null:action;
        else if(action==='cookies'&&net.featureEnabled('cookies'))state.panel='cookies';
        else if(action==='close-panel')state.panel=null;
      }
      ui[addressKey(device)]=browserNavigation.active(device).draft;render();
      if(b.dataset.browserTab)$(`[data-browser-tab="${browserNavigation.active(device).id}"]`)?.focus({preventScroll:true});
      else if(b.dataset.browserNav==='new')$(`[data-browser-tab="${browserNavigation.active(device).id}"]`)?.focus({preventScroll:true});
      else if(state.panel)$('.browser-popover button, .browser-drawer button')?.focus({preventScroll:true});
      else if(b.dataset.browserNav==='close-panel')$(`[data-browser-nav="${previousPanel==='security'?'security':'menu'}"]`)?.focus({preventScroll:true});
      return;
    }
    if(b.dataset.action==='network-toggle'){toggleNetworkPanel();return;}
    if(b.dataset.action==='network-close'){closeNetworkPanel();return;}
    if(b.dataset.networkToggle){
      const kind=b.dataset.networkToggle,id=ui.monitorDevice,d=networkDraft();Object.assign(d,{selected:null,passwordStep:false,password:'',error:''});
      updateConnection(()=>kind==='wifi'?net.setWifiEnabled(id,!net.connectionControls[id].wifiEnabled):net.setMobileData(!net.connectionControls.phone.mobileEnabled),null,`[data-network-toggle="${kind}"]`);return;
    }
    if(b.dataset.wifiNetwork){const d=networkDraft();Object.assign(d,{selected:d.selected===b.dataset.wifiNetwork?null:b.dataset.wifiNetwork,passwordStep:false,password:'',error:''});render();$(`#monitor-content [data-wifi-network="${b.dataset.wifiNetwork}"]`)?.focus({preventScroll:true});return;}
    if(b.dataset.wifiConnect){
      const id=ui.monitorDevice,key=b.dataset.wifiConnect,network=net.wifiNetworks(id).find(n=>n.id===key);if(!network)return;
      if(network.secured&&!net.wifiKnown(id,key)){const d=networkDraft();Object.assign(d,{passwordStep:true,password:'',error:''});render();focusWifiPassword();}
      else connectWifi(key);return;
    }
    if(b.dataset.action==='wifi-disconnect'){const key=net.wifiNetworkId(ui.monitorDevice);updateConnection(()=>net.disconnectWifi(ui.monitorDevice),'Wi-Fi odpojena.',`[data-wifi-network="${key}"]`);return;}
    if(b.dataset.action==='wifi-cancel'){Object.assign(networkDraft(),{passwordStep:false,password:'',error:''});render();$('#connection-panel .selected [data-wifi-connect]')?.focus({preventScroll:true});return;}
    if(b.dataset.gmailAction){
      const d=ui.mailComposer[ui.monitorDevice],c=net.phishing.clients[ui.monitorDevice],action=b.dataset.gmailAction;
      if(action==='compose'){if(sim.status==='running'&&['mail-send','phish-send'].includes(sim.action?.type)&&sim.clientId()===ui.monitorDevice)return;Object.assign(d,{composeOpen:true});}
      if(action==='close-compose')clearMailComposer();
      if(action==='back'){d.sentId=null;c.opened=false;}
      if(action==='reply'){if(sim.status==='running'||!c.inbox||!globalThis.InternetLab.PHISH_CLIENTS.includes(c.inbox.source)||fixedMailRecipient(ui.monitorDevice)&&c.inbox.source!==fixedMailRecipient(ui.monitorDevice))return;if(d.composeOpen&&(d.subject||d.body)){d.composeOpen=true;notify('Nejprve dokonči nebo zavři rozepsanou zprávu.');render();return;}Object.assign(d,{target:c.inbox.source,subject:(/^Re:/i.test(c.inbox.subject)?c.inbox.subject:'Re: '+c.inbox.subject).slice(0,100),body:'',composeOpen:true});}
      render();if(['compose','reply'].includes(action))$(ui.monitorDevice==='hacker'?'[data-mail-field="target"]':'[data-mail-field="subject"]')?.focus({preventScroll:true});return;
    }
    if(b.dataset.gmailSent){ui.mailComposer[ui.monitorDevice].sentId=b.dataset.gmailSent;render();return;}
    if(b.dataset.mailTab){const d=ui.mailComposer[ui.monitorDevice];d.tab=b.dataset.mailTab;d.sentId=null;net.phishing.clients[ui.monitorDevice].opened=false;render();return;}
    if(b.dataset.mailOpen){if(sim.status==='running')return;if(sim.mail.open(ui.monitorDevice,b.dataset.mailOpen)){if(!net.phishing.clients[ui.monitorDevice].inbox.seen)startMail('mail-seen',{messageId:net.phishing.clients[ui.monitorDevice].inbox.id});else render();}return;}
    if(b.dataset.action==='phish-compose'){if(ui.monitorDevice!=='hacker'||sim.status==='running')return;ui.mailComposer.hacker.composeOpen=true;openComputerApp('mail');return;}
    if(['phish-send','mail-check'].includes(b.dataset.action)){startMail(b.dataset.action);return;}
    if(['phish-results'].includes(b.dataset.action)){startPhishing(b.dataset.action);return;}
    if(b.dataset.action==='mail-open'){net.phishing.clients[ui.monitorDevice].opened=true;render();return;}
    if(b.dataset.action==='phish-open'){const m=net.phishing.clients[ui.monitorDevice].inbox;if(!m||sim.phishing.blocked(ui.monitorDevice,m.id))return;ui[addressKey(ui.monitorDevice)]=m.link;openComputerApp('web');startAction('web');return;}
    if(b.dataset.adsOpen||b.dataset.adsTopic){const address=b.dataset.adsTopic?'https://obchod.test/?tema='+b.dataset.adsTopic:b.dataset.adsOpen==='shop'?'https://obchod.test':b.dataset.adsOpen==='news'?'https://zpravy.test':'https://knihovna.test';ui[addressKey(ui.monitorDevice)]=address;startAction('web',{address});return;}
    if(b.dataset.action==='ads-clear'){if(sim.ads.clear(ui.monitorDevice))render();return;}
    if(b.dataset.authMode){ui.authDraft[ui.monitorDevice].mode=b.dataset.authMode;render();return;}
    if(b.dataset.authOp){const address='https://knihovna.test';ui[addressKey(ui.monitorDevice)]=address;startAction('web',{address,authOp:b.dataset.authOp});return;}
    if(b.dataset.action==='privacy-panel'){ui.privacyOpen[ui.monitorDevice]=!ui.privacyOpen[ui.monitorDevice];render();$('[data-action=privacy-panel]')?.focus({preventScroll:true});return;}
    if(b.dataset.privacyOp){const address='https://knihovna.test';ui[addressKey(ui.monitorDevice)]=address;startAction('web',{address,privacyOp:b.dataset.privacyOp});return;}
    if(b.dataset.action==='cookie-panel'){ui.cookieOpen[ui.monitorDevice]=!ui.cookieOpen[ui.monitorDevice];render();$('[data-action="cookie-panel"]')?.focus({preventScroll:true});return;}
    if(['cookie-clear','cookie-time'].includes(b.dataset.action)){if(!net.featureEnabled('cookies')||sim.status==='running')return;if(b.dataset.action==='cookie-clear'){globalThis.InternetLab.WebCookies.clear(net.browserFor(ui.monitorDevice).cookies);notify('Cookies byly smazány z tohoto prohlížeče. Záznamy na serveru zůstaly.');}else{net.advanceCookieTime();notify('Modelový čas se posunul o hodinu. Cookies s prošlou platností byly odstraněny.');}render();return;}
    if(b.dataset.webProtocol){const address=globalThis.InternetLab.webAddress(browserNavigation.active(ui.monitorDevice).url||ui[addressKey(ui.monitorDevice)]);ui[addressKey(ui.monitorDevice)]=address?.server==='phish-web'?`${b.dataset.webProtocol}://knihovna-podpora.test/overeni${address.messageId?'?zprava='+address.messageId:''}`:`${b.dataset.webProtocol}://${address?.host||'knihovna.test'}${address?.path==='/'?'':address?.path||''}`;startAction('web');return;}
    if(b.dataset.messageType){const key=messageKey(ui.monitorDevice,'messageType');ui[key]=b.dataset.messageType;render();$(`[data-message-type="${ui[key]}"]`).focus({preventScroll:true});return;}
    if(b.dataset.action==='satellite-view'){net.setSatelliteView(!net.satellite.clearView);notify(net.satellite.clearView?'Anténa má opět volný výhled.':'Výhled antény je zakrytý. Satelitní spoj je nedostupný.');if(!resumeMessage())render();return;}
    if(b.dataset.action==='close-device'){closeDevice();return;}
    if(b.dataset.action==='clear-nat'){net.clearNat(b.dataset.id);notify('Tabulka NAT je prázdná. Příchozí odpovědi bez záznamu se nedoručí.');render();$('#device-content').focus({preventScroll:true});return;}
    if(b.dataset.filesOpen){loadLocal(ui.monitorDevice,b.dataset.filesOpen);render();$('#files-name').focus({preventScroll:true});return;}
    if(b.dataset.action==='files-new'){
      const d=ui.files[ui.monitorDevice];if(d.view==='editor'&&!saveLocal())return;
      Object.assign(d,{localId:null,name:'Nový dokument.txt',content:'',view:'editor',editorKey:d.editorKey+1});render();$('#files-name').focus({preventScroll:true});$('#files-name').select();return;
    }
    if(b.dataset.action==='files-list'){const d=ui.files[ui.monitorDevice];if(d.view==='editor'&&!saveLocal())return;d.view='files';render();return;}
    if(b.dataset.cloudOpen){startCloud({op:'download',fileId:b.dataset.cloudOpen},undefined,true);return;}
    if(b.dataset.cloudShare){
      if(sim.status==='running')return;
      const file=net.cloud.clients[ui.monitorDevice].catalog.find(f=>f.id===b.dataset.cloudShare&&f.access==='owner');if(!file)return;
      const d=ui.cloud[ui.monitorDevice];Object.assign(d,{shareId:file.id,shareUser:net.cloud.other(ui.monitorDevice).id,uploadOpen:false});
      if($('.drive-add'))$('.drive-add').open=false;render();$('#cloud-share-user').focus({preventScroll:true});return;
    }
    if(b.dataset.action==='cloud-share-close'){closeCloudShare();return;}
    if(b.dataset.cloudDownload){startCloud({op:'download',fileId:b.dataset.cloudDownload});return;}
    if(b.dataset.action==='cloud-refresh'){startCloud({op:'list'});return;}
    if(b.dataset.action==='cloud-list'){if(sim.status==='running'&&ui.cloud[ui.monitorDevice].view==='editor')return;ui.cloud[ui.monitorDevice].view='files';render();return;}
    if(b.dataset.action==='cloud-new'){
      if(sim.status==='running')return;
      const d=ui.cloud[ui.monitorDevice];if($('.drive-add'))$('.drive-add').open=false;
      Object.assign(d,{cloudName:'Nový dokument.txt',cloudContent:'',remoteId:null,remoteVersion:null,view:'editor',editorKey:d.editorKey+1,downloadNotice:null});render();$('#cloud-name').focus({preventScroll:true});$('#cloud-name').select();return;
    }
    if(b.dataset.action==='cloud-picker-open'){
      if(sim.status==='running')return;
      if($('.drive-add'))$('.drive-add').open=false;
      Object.assign(ui.cloud[ui.monitorDevice],{uploadOpen:true,uploadId:null});render();($('.drive-picker-file')||$('.drive-picker [data-action="cloud-open-files"]')||$('.drive-picker button'))?.focus({preventScroll:true});return;
    }
    if(b.dataset.action==='cloud-picker-cancel'){closeCloudPicker();return;}
    if(b.dataset.cloudPick){ui.cloud[ui.monitorDevice].uploadId=b.dataset.cloudPick;render();$(`[data-cloud-pick="${b.dataset.cloudPick}"]`)?.focus({preventScroll:true});return;}
    if(b.dataset.action==='cloud-picker-upload'){
      if(sim.status==='running')return;
      const d=ui.cloud[ui.monitorDevice],f=net.cloud.local[ui.monitorDevice].find(f=>f.id===d.uploadId);if(!f)return;
      Object.assign(d,{uploadOpen:false,view:'files',downloadNotice:null});startCloud({op:'upload',name:f.name,content:f.content},f.id);return;
    }
    if(b.dataset.action==='cloud-open-files'){ui.cloud[ui.monitorDevice].uploadOpen=false;openComputerApp('files');return;}
    if(b.dataset.action==='cloud-show-download'){const d=ui.cloud[ui.monitorDevice];loadLocal(ui.monitorDevice,d.downloadNotice);d.downloadNotice=null;openComputerApp('files');return;}
    if(b.dataset.action==='cloud-dismiss-download'){ui.cloud[ui.monitorDevice].downloadNotice=null;render();return;}
    if(b.dataset.action==='vpn-toggle') {
      const id=b.dataset.id;
      if(id!==ui.monitorDevice||!net.appAvailable('vpn',id))return;
      if(net.setVPN(id,!net.vpn.clients[id].enabled)) {
        sim.connectionChanged(id);if(sim.status!=='running')stop();syncReader();
        notify(`VPN ${net.vpn.clients[id].enabled?'zapnutá':'vypnutá'} pro ${net.nodes[id].name}.`);
        if(!resumeMessage())render();
        $(`#monitor-content [data-action="vpn-toggle"][data-id="${id}"]`)?.focus({preventScroll:true});
      }
      return;
    }
    if(b.dataset.computerApp){openComputerApp(b.dataset.computerApp);return;}
    if(b.dataset.action==='close-monitor'||b.dataset.action==='show-map'){closeMonitor();return;}
    if(b.dataset.action==='computer-home'){openComputerApp('desktop');return;}
    if(b.dataset.action==='open-library'){ui[addressKey(ui.monitorDevice)]='knihovna.test';startAction('web');return;}
    if(b.dataset.action==='resume-message'){resumeMessage(true);return;}
    if(b.dataset.selectNode) {if(b.dataset.openTab){if(b.dataset.selectNode==='cafe-attacker')ui.cafeAttackerTab=b.dataset.openTab;else if(b.dataset.selectNode==='cafe')ui.cafeTab=b.dataset.openTab;else if(b.dataset.selectNode==='hacker')ui.hackerTab=b.dataset.openTab;else if(b.dataset.selectNode==='cabin')ui.cabinTab=b.dataset.openTab;else if(b.dataset.selectNode==='friend')ui.friendTab=b.dataset.openTab;else if(b.dataset.selectNode==='phone')ui.phoneTab=b.dataset.openTab;else ui.tab=b.dataset.openTab;}select('node',b.dataset.selectNode);if(b.hasAttribute('data-auth-server'))$('.auth-server')?.scrollIntoView({block:'start'});if(b.hasAttribute('data-privacy-server'))$('.privacy-server')?.scrollIntoView({block:'start'});}
    else if(b.dataset.selectLink)select('link',b.dataset.selectLink);
    else if(b.dataset.selectPacket)select('packet',b.dataset.selectPacket);
    else if(b.dataset.action==='toggle-node') {
      const on=net.toggleNode(b.dataset.id);
      if(!on)resetDeviceUI(b.dataset.id);
      if(sim.status!=='running')stop();syncReader();
      notify(`${net.nodes[b.dataset.id].name}: ${on?'zapnuto':'vypnuto'}.`);if(!resumeMessage())render();
      if(ui.monitorOpen&&b.dataset.id===ui.monitorDevice)$('.computer-power').focus({preventScroll:true});
    } else if(b.dataset.action==='toggle-link') {
      const link=net.links[b.dataset.id],previous=link.device&&net.access[link.device].mode,on=net.toggleLink(b.dataset.id);
      if(link.device&&net.access[link.device].mode!==previous)sim.connectionChanged(link.device);
      notify(`${link.name}: ${on?'spoj obnoven':'spoj odpojen'}.`);if(!resumeMessage())render();
    }
  }
  for(const root of [$('#monitor-overlay'),$('#device-overlay')]) {
    root.addEventListener('input',handleInput);
    root.addEventListener('change',e=>{
      if(e.target.hasAttribute('data-mitm-active')||e.target.hasAttribute('data-mitm-mode')){if(sim.status==='running')return;sim.mitm.configure(e.target.hasAttribute('data-mitm-active')?e.target.checked:net.mitm.active,e.target.hasAttribute('data-mitm-mode')?e.target.value:net.mitm.mode,e.target.hasAttribute('data-mitm-active')&&e.target.checked?ui.mitmSsid:net.mitm.ssid);ui.mitmSsid=net.mitm.ssid;render();$(e.target.hasAttribute('data-mitm-active')?'[data-mitm-active]':'[data-mitm-mode]')?.focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-ads-allowed')){if(sim.ads.setAllowed(ui.monitorDevice,e.target.checked)){render();$('[data-ads-allowed]')?.focus({preventScroll:true});}return;}
      if(e.target.dataset.privacyHold){if(sim.status==='running')return;sim.privacy.setHold(e.target.dataset.privacyHold,e.target.checked);render();$(`[data-privacy-hold="${e.target.dataset.privacyHold}"]`)?.focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cookie-allowed')){if(!net.featureEnabled('cookies')||sim.status==='running')return;net.browserFor(ui.monitorDevice).cookies.allowed=e.target.checked;render();$('[data-cookie-allowed]')?.focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cookie-secure')){if(!net.featureEnabled('cookies')||sim.status==='running')return;net.server.cookies.secureOnly=e.target.checked;render();$('[data-cookie-secure]')?.focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-web-certificate')){const value=e.target.value;Object.assign(net.server.certificate,{name:value==='wrong-name'?'jiny-web.test':'knihovna.test',valid:value!=='expired',trusted:value!=='untrusted'});render();$('#web-certificate').focus({preventScroll:true});return;}
      if(e.target.hasAttribute('data-cloud-share-user')){ui.cloud[ui.monitorDevice].shareUser=e.target.value;return;}
      if(e.target.hasAttribute('data-receipts')){net.friend.receipts=e.target.checked;if(net.friend.read&&net.friend.receipts&&sim.markRead('friend'))playAutomatically();render();}
    });
    root.addEventListener('toggle',e=>{if(e.target.isConnected&&e.target.matches('.network-details'))networkDraft().details=e.target.open;},true);
    root.addEventListener('submit',handleSubmit);
    root.addEventListener('click',handleClick);
  }
  $('#zoom-in').addEventListener('click',()=>map.zoom(.9));$('#zoom-out').addEventListener('click',()=>map.zoom(1/.9));
  const deviceHelp=$('#device-help'),helpTrigger=$('#device-help-trigger');
  deviceHelp.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&matchMedia('(any-hover: hover)').matches)setDeviceHelpOpen(true);});
  deviceHelp.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')setDeviceHelpOpen(false);});
  helpTrigger.addEventListener('focus',()=>{if(helpTrigger.matches(':focus-visible'))setDeviceHelpOpen(true);});
  helpTrigger.addEventListener('click',e=>{
    const hovering=e.pointerType==='mouse'&&matchMedia('(any-hover: hover)').matches;
    setDeviceHelpOpen(hovering||helpTrigger.getAttribute('aria-expanded')!=='true');
  });
  deviceHelp.addEventListener('focusout',e=>{if(!deviceHelp.contains(e.relatedTarget))setDeviceHelpOpen(false);});
  document.addEventListener('pointerdown',e=>{if(!deviceHelp.contains(e.target))setDeviceHelpOpen(false);});
  function setExplanationOpen(show) {
    const button=$('#toggle-explanation');
    $('#transmission-explanation').hidden=!show;
    $('.transport').classList.toggle('explanation-hidden',!show);
    button.setAttribute('aria-expanded',String(show));
    button.setAttribute('aria-label',show?'Skrýt vysvětlení':'Zobrazit vysvětlení');
  }
  $('#toggle-explanation').addEventListener('click',e=>setExplanationOpen(e.currentTarget.getAttribute('aria-expanded')!=='true'));
  $('#step').addEventListener('click',()=>{stop();advance();});
  function expandTransfer() {
    const from=$('.transfer-thumbnail').getBoundingClientRect();
    const context=journey.expand();if(!context)return;
    journeyAnimation?.cancel();journeyAnimation=null;
    ui.networkPanel=null;ui.monitorDevice=context.device;ui[tabKey(context.device)]=context.app;ui.selection={kind:'node',id:context.device};
    ui.monitorOpen=true;ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;syncReader();render();animateMonitor(from,false);$('#monitor-content').focus({preventScroll:true});
  }
  $('#transfer-card').addEventListener('click',expandTransfer);
  $('#transfer-card').addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    e.preventDefault();if(!e.repeat)expandTransfer();
  });
  window.addEventListener('resize',renderJourney);
  $('#play').addEventListener('click',()=> {
    if(playing){stop();render();}
    else resumePlayback();
  });
  $('#playback-speed').addEventListener('change',e=>{
    const rate=Number(e.target.value);if(![1,2,4].includes(rate)||rate===playbackRate)return;
    const resume=playing,previous=playbackRate;stop();playbackRate=rate;remaining*=previous/rate;map.setPlaybackRate(rate);
    if(resume)resumePlayback();else render();
  });
  $('#cancel-transfer').addEventListener('click',()=>{
    if(sim.status!=='running')return;
    const context=journey.current||{device:sim.clientId(),app:transferApp(sim.action.type)},from=$('.transfer-thumbnail').getBoundingClientRect();
    stop();sim.cancel();journey.clear();map.finishAnimations();remaining=0;ui.packetResume=false;settingsWasPlaying=false;
    ui.networkPanel=null;ui.monitorDevice=context.device;ui[tabKey(context.device)]=context.app;ui.selection={kind:'node',id:context.device};
    ui.monitorOpen=!!net.nodes[context.device]?.on;ui.deviceOpen=false;ui.linkOpen=false;ui.packetOpen=false;
    ui.transferOutcome={device:context.device,status:'cancelled',text:'Přenos byl zrušen. Můžeš začít jinou akci.'};
    if(ui.mailComposer[context.device])ui.mailComposer[context.device].sendingId=null;
    syncReader();render();if(ui.monitorOpen){animateMonitor(from,false);$('#monitor-content').focus({preventScroll:true});}
  });
  $('#repeat').addEventListener('click',()=> {
    stop();if(sim.status==='running')sim.status='stopped';if(!sim.repeat()){render();return;}
    if(ui.selection.kind==='packet')ui.selection={kind:'node',id:sim.clientId()};
    beginTransfer(transferApp(sim.action.type));notify('Opakuji stejnou akci. Změny sítě i serveru zůstaly.');
  });
  let settingsWasPlaying=false;
  const settingsPanel=new globalThis.InternetLab.SettingsPanel({getSettings:()=>net.settings,onOpen:()=>{ui.networkPanel=null;settingsWasPlaying=playing;stop();render();},onApply:applySettings,onClose:()=>{if(settingsWasPlaying)resumePlayback();else render();}});
  document.addEventListener('keydown',e=> {
    if(settingsPanel.dialog.open)return;
    const picker=$('.drive-picker');
    if(ui.monitorOpen&&picker){
      if(e.key==='Escape'){e.preventDefault();if(picker.classList.contains('drive-share'))closeCloudShare();else closeCloudPicker();return;}
      if(e.key==='Tab'){const items=[...picker.querySelectorAll('button:not(:disabled),select:not(:disabled)')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
    }
    if(e.key==='Escape'&&$('.drive-add')?.open){e.preventDefault();$('.drive-add').open=false;$('.drive-add>summary').focus();return;}
    if(e.key==='Escape'&&ui.networkPanel){e.preventDefault();closeNetworkPanel();return;}
    if(e.key==='Escape'&&!$('#device-help-content').hidden){e.preventDefault();helpTrigger.focus({preventScroll:true});setDeviceHelpOpen(false);return;}
    if(ui.monitorOpen&&$('.gmail-application')){
      const draft=ui.mailComposer[ui.monitorDevice];
      if(e.key==='Escape'&&draft.composeOpen){e.preventDefault();clearMailComposer();render();$('[data-gmail-action="compose"]')?.focus({preventScroll:true});return;}
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&e.target.closest('.gmail-compose-form')){e.preventDefault();const form=e.target.closest('form');if(!form.querySelector('[type="submit"]').disabled)form.requestSubmit();return;}
    }
    if(ui.monitorOpen&&e.target.matches?.('.ig-compose textarea, .chatbot-compose textarea')&&e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.isComposing) {
      e.preventDefault();if(!e.target.form.querySelector('[type="submit"]').disabled)e.target.form.requestSubmit();return;
    }
    if(ui.monitorOpen&&$('.browser-application')) {
      const device=ui.monitorDevice,state=browserNavigation.state(device);
      if(e.target.dataset.browserTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) {
        e.preventDefault();const index=state.tabs.findIndex(t=>t.id===state.active),next=e.key==='Home'?0:e.key==='End'?state.tabs.length-1:(index+(e.key==='ArrowLeft'?-1:1)+state.tabs.length)%state.tabs.length;
        if(browserNavigation.select(device,state.tabs[next].id,sim.status==='running')){ui[addressKey(device)]=browserNavigation.active(device).draft;render();$(`[data-browser-tab="${state.active}"]`)?.focus({preventScroll:true});}return;
      }
      if(e.key==='Escape'&&state.panel){e.preventDefault();state.panel=null;render();$('[data-browser-nav="menu"]')?.focus({preventScroll:true});return;}
    }
    if(e.key==='Escape'&&ui.monitorOpen){e.preventDefault();closeMonitor();}
    else if(e.key==='Escape'&&(ui.deviceOpen||ui.linkOpen||ui.packetOpen)){e.preventDefault();closeDevice();}
    else if(e.key==='Escape'&&ui.selection.id!=='laptop')select('node','laptop');
  });
  render();
})();
