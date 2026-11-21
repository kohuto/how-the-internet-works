/* The notebook's desktop is a view of the same network and transfer state as the map. */
(() => {
  'use strict';
  const {esc}=globalThis.InternetLab;
  const apps={mail:'Gmail',web:'Prohlížeč',print:'Dokument',message:'Instagram',cloud:'Cloud',chatbot:'Chatbot',network:'Připojení'};
  const symbols={
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    mitm:'<path d="M3 5h18v12H3zM1 21h22M7 10h10m-4-3 3 3-3 3"/>',
    attack:'<path d="M4 5h16v12H4zM2 21h20M7 9l3 3-3 3m6 0h4"/>',
    web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
    print:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
    message:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>',
    cloud:'<path d="M6 18a4 4 0 1 1 0-8 6 6 0 0 1 11-3 5 5 0 0 1 1 11H6zM12 10v10m-3-7 3-3 3 3"/>',
    chatbot:'<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8 9h8m-8 4h5"/>',
    desktop:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    power:'<path d="M12 3v9m-5-7a9 9 0 1 0 10 0"/>',
    cable:'<path d="M7 3v5m10-5v5M5 8h14v7H5zm7 7v6m-4 0h8"/>',
    wifi:'<path d="M3 8q9-8 18 0M6 12q6-5 12 0m-9 4q3-2 6 0"/><circle cx="12" cy="20" r="1"/>',
    cellular:'<path d="M4 20v-3m5 3v-7m5 7V9m5 11V4"/>',
    offline:'<path d="M4 4l16 16M3 8q9-8 18 0M6 12q6-5 12 0"/>',
    network:'<path d="M3 8q9-8 18 0M6 12q6-5 12 0m-9 4q3-2 6 0"/><circle cx="12" cy="20" r="1"/>'
  };
  const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${symbols[name]}</svg>`;
  function transfer(sim,tab,device='laptop') {
    if(sim.status!=='running'||sim.action?.type!==tab||sim.clientId()!==device)return '';
    return '<div class="computer-transfer"><span><i></i>Čekání na dokončení přenosu</span><button type="button" data-action="show-map">Sledovat v mapě ↗</button></div>';
  }
  function browser(net,sim,ui,device='laptop') {return globalThis.InternetLab.browserView(net,sim,ui,device);}
  function vpnSettings(net,id) {
    if(!net.featureEnabled('vpn'))return '';
    const c=net.vpn.clients[id],reachable=net.physicalCanReach(id,'vpn'),active=net.vpnPeerValid(id);
    return `<section class="vpn-settings" aria-label="VPN tunel"><label class="vpn-toggle"><span><strong>VPN</strong><small>Šifrovaný tunel pro internet</small></span><input type="checkbox" data-vpn="${id}" aria-label="Zapnout VPN" ${c.enabled?'checked':''}></label><div class="vpn-setting-state ${c.enabled?'enabled':''} ${c.enabled&&!reachable?'unavailable':''}"><i></i>${!c.enabled?'Vypnutá · přímý přístup do internetu':!reachable?'Zapnutá · VPN server nebo cesta nejsou dostupné':active?'Zapnutá · tunel přenáší data':'Zapnutá · připravena pro další přenos'}</div><p>VPN funguje přes kabel, Wi-Fi i mobilní data. Internetový provoz včetně DNS půjde přes VPN server; místní tisk zůstane v domácí síti.</p>${c.enabled?`<dl class="vpn-addresses"><dt>IP uvnitř tunelu</dt><dd>${c.ip}</dd><dt>Veřejná IP při výstupu z VPN</dt><dd>${net.nodes.vpn.ip}</dd></dl><p class="vpn-no-fallback">Když tunel nefunguje, přenos se zastaví. Na nechráněnou cestu se sám nepřepne.</p>`:''}<button type="button" class="inline-link" data-select-node="vpn">Prohlédnout VPN server ↗</button></section>`;
  }
  function connectionPerformance(net,id,ui) {
    const draft=ui.connectionDrafts?.[id]||net.connectionProfiles[id];
    return `<form class="connection-performance" data-form="connection-profile" data-device="${id}" aria-label="Vlastnosti internetového připojení"><h4>Vlastnosti internetového připojení</h4><div class="connection-performance-fields">${[['bandwidth','Šířka pásma'],['latency','Latence']].map(([key,label])=>`<label for="connection-${key}-${id}">${label}<select id="connection-${key}-${id}" name="${key}" data-connection-field="${key}"><option value="low" ${draft[key]==='low'?'selected':''}>Nižší</option><option value="high" ${draft[key]==='high'?'selected':''}>Vyšší</option></select></label>`).join('')}</div><p>Šířka pásma mění rozestupy mezi pakety. Vyšší latence přidává zdržení na cestě. Porovnání je názorné, bez skutečného časového měřítka.</p><button type="submit" class="secondary-button">Použít změny</button><p>Změny platí pro další přenos, v obou směrech. Stejný soubor porovnáš opakováním přenosu.</p></form>`;
  }
  function connectionView(net,id,sim,ui) {
    const performance=connectionPerformance(net,id,ui);
    if(id==='cafe')return globalThis.InternetLab.cafeConnection(net,sim,performance+vpnSettings(net,id));
    const access=net.access[id],phone=id==='phone',ready=net.accessReady(id),ssid=id==='cabin'?'Chata':id==='friend'?'U Mateje':'Lipova',natRouter=net.natRouterFor(id);
    const modes=(id==='hacker'?[['cable','Kabel'],['offline','Odpojit']]:phone?[['wifi','Wi-Fi'],['cellular','Mobilní data'],['offline','Odpojit']]:[['cable','Kabel'],['wifi','Wi-Fi'],['offline','Odpojit']]).filter(([mode])=>net.accessModeAvailable(id,mode));
    const name=access.mode==='wifi'?`Wi-Fi · ${ssid}`:access.mode==='cellular'?`Mobilní data · ${net.nodes[access.tower].name}`:access.mode==='cable'?'Síťový kabel':'Bez připojení';
    return `<div class="connection-settings"><div class="connection-intro"><h3>Připojení k síti</h3></div><div class="field-label">POUŽÍVANÉ PŘIPOJENÍ</div><div class="connection-modes">${modes.map(([mode,label])=>`<button type="button" data-access-mode="${mode}" data-id="${id}" aria-pressed="${access.mode===mode}" class="${access.mode===mode?'active':''}">${icon(mode)}<span>${label}</span></button>`).join('')}</div><div class="connection-status ${ready?'':'unavailable'}"><strong>${name}</strong><span>${access.mode==='offline'?'Zařízení je odpojené.':ready?'Připojeno':access.mode==='wifi'?'Wi-Fi není dostupná. Zkontroluj přístupový bod a jeho připojení.':access.mode==='cellular'?'Mobilní síť není dostupná. Zkontroluj BTS a operátora.':`Kabel není dostupný. Zkontroluj spoj a ${net.detailEnabled('devices')?'switch':'chytrou křižovatku'}.`}</span></div>${phone&&access.mode==='cellular'?`<label class="field-label" for="cell-tower">ZÁKLADNOVÁ STANICE</label><select id="cell-tower" data-tower="phone"><option value="bts-lipova" ${access.tower==='bts-lipova'?'selected':''}>BTS Lipová</option><option value="bts-park" ${access.tower==='bts-park'?'selected':''}>BTS Park</option></select>`:''}${access.mode!=='offline'?`<dl class="connection-address"><dt>IP adresa</dt><dd>${esc(net.nodes[id].ip)}</dd>${access.mode==='wifi'?`<dt>Wi-Fi síť</dt><dd>${ssid}</dd>`:''}${natRouter&&net.detailEnabled('nat')?`<dt>Veřejná IP přes NAT</dt><dd>${net.natAddress(natRouter)}</dd>`:''}</dl>${natRouter&&net.detailEnabled('nat')?`<p><button class="inline-link" data-select-node="${natRouter}">Prohlédnout NAT ↗</button></p>`:''}`:''}${performance}${id==='cabin'?`<div class="satellite-notice"><strong>Z chaty pokračují data přes satelit</strong><p>Wi-Fi nebo kabel vede ${net.detailEnabled('devices')?'do domácího routeru':'k chytré křižovatce'}. Dál data pokračují přes satelitní anténu, satelit LEO a pozemní stanici.</p><span>${net.physicalCanReach('cabin','sat-gateway')?'Satelitní cesta je dostupná':'Satelitní cesta je přerušená'}</span><button class="inline-link" data-select-node="cabin-router">${net.detailEnabled('devices')?'Připojení routeru':'Připojení chytré křižovatky'} ↗</button><button class="inline-link" data-select-node="sat-terminal">Výhled antény ↗</button></div>`:''}${vpnSettings(net,id)}</div>`;
  }
  function documentApp(net,sim) {
    return `<form data-form="print" class="computer-document"><div class="computer-document-toolbar"><button type="submit" class="primary-button" ${sim.status==='running'?'disabled':''}>Tisk</button></div><div class="computer-paper"><div class="paper-kicker">MOJE POZNÁMKY</div><h3>Jak spolu mluví<br>počítače</h3><p>Notebook, tiskárna a síť, která je propojuje.</p><div class="paper-rule"></div><div class="paper-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="paper-page">1</span></div></form>${net.printer.state==='ready'?`<div class="status-box"><strong>Poslední dokument je vytištěný</strong>${esc(net.printer.document)}</div>`:''}${net.printer.state==='error'?'<div class="status-box error"><strong>Dokument se nepodařilo doručit</strong>Zkontroluj tiskárnu a její připojení.</div>':''}${transfer(sim,'print')}`;
  }
  const receiptSetting=net=>globalThis.InternetLab.instagramReceiptSetting(net);
  function chatbotApp(net,sim,ui,device) {
    const turns=net.chatbot.clients[device].turns,busy=sim.status==='running';
    const messages=turns.map(t=>{
      const pending={sending:'Odesílání zprávy…',processing:'Přemýšlím…',receiving:'Přijímání odpovědi…'}[t.state]||'Čekání na odpověď…';
      return `<article class="chatbot-turn"><div class="chatbot-bubble chat-user"><span class="sr-only">Ty:</span><p>${esc(t.prompt)}</p></div><div class="chatbot-assistant"><span class="chatbot-avatar" aria-hidden="true">${icon('chatbot')}</span><div class="chatbot-answer-content"><strong>Chatbot</strong>${t.answer?`<div class="chatbot-bubble chat-answer"><p>${esc(t.answer)}</p></div>`:t.state==='error'?`<p class="chatbot-turn-error" role="status">${esc(t.error)} Odpověď nebyla doručena.</p>`:`<p class="chatbot-pending" role="status"><span class="chatbot-typing" aria-hidden="true"><i></i><i></i><i></i></span>${pending}</p>`}</div></div></article>`;
    }).join('');
    return `<div class="chatbot-app">
      <header class="chatbot-brand"><span class="chatbot-brand-name">Chatbot</span><button type="button" data-action="computer-home" class="chatbot-close" aria-label="Zavřít aplikaci Chatbot" title="Zavřít aplikaci Chatbot">${icon('close')}</button></header>
      <div class="chatbot-conversation" data-turn-count="${turns.length}" role="region" tabindex="0" aria-label="Konverzace s chatbotem"><div class="chatbot-thread">${turns.length?messages:`<div class="chatbot-empty"><span class="chatbot-empty-icon" aria-hidden="true">${icon('chatbot')}</span><h3>S čím ti můžu pomoct?</h3><p>Napiš zprávu a začni konverzaci.</p></div>`}</div></div>
      <footer class="chatbot-footer">
        <form data-form="chatbot" class="chatbot-compose"><div class="chatbot-input-box"><label for="chatbot-prompt" class="sr-only">Zpráva pro chatbota</label><textarea id="chatbot-prompt" data-field="chatPrompt" rows="2" maxlength="4000" placeholder="Napiš zprávu…" required>${esc(ui.chatbot[device])}</textarea><button type="submit" class="chatbot-send" aria-label="Odeslat zprávu" title="Odeslat zprávu" ${busy?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></div></form>
        <p class="chatbot-model-note">Výuková ukázka · odpověď je vždy stejná.</p>
      </footer>
    </div>`;
  }
  function computerView(net,sim,ui) {
    const device=ui.monitorDevice,friend=device==='friend',phone=device==='phone',cabin=device==='cabin',n=net.nodes[device],baseApps=device==='cafe-attacker'?{mitm:'MITM'}:device==='cafe'?{mail:'Gmail',web:'Prohlížeč',network:'Připojení'}:device==='hacker'?{attack:'Phishing',network:'Připojení'}:cabin?{mail:'Gmail',web:'Prohlížeč',message:'Instagram',cloud:'Cloud',chatbot:'Chatbot',network:'Připojení'}:friend?{mail:'Gmail',web:'Prohlížeč',message:'Instagram',cloud:'Cloud',chatbot:'Chatbot',network:'Připojení'}:phone?{mail:'Gmail',web:'Prohlížeč',message:'Instagram',cloud:'Cloud',chatbot:'Chatbot',network:'Připojení'}:apps,availableApps=Object.fromEntries(Object.entries(baseApps).filter(([app])=>net.appAvailable(app,device))),tab=device==='cafe-attacker'?ui.cafeAttackerTab:device==='cafe'?ui.cafeTab:device==='hacker'?ui.hackerTab:cabin?ui.cabinTab:friend?ui.friendTab:phone?ui.phoneTab:ui.tab,connected=net.accessReady(device),app=availableApps[tab];
    const viewUi=device==='cafe'?{...ui,address:ui.cafeAddress}:friend?{...ui,address:ui.friendAddress,message:ui.friendMessage,messageType:ui.friendMessageType}:cabin?{...ui,address:ui.cabinAddress,message:ui.cabinMessage,messageType:ui.cabinMessageType}:phone?{...ui,address:ui.phoneAddress,message:ui.phoneMessage,messageType:ui.phoneMessageType}:ui;
    const shortcuts=Object.entries(availableApps).map(([id,name])=>`<button class="desktop-shortcut" data-computer-app="${id}"><span class="desktop-app-icon app-${id}">${icon(id)}</span><span>${name}</span></button>`).join('');
    let screen;
    if(!n.on)screen=`<div class="computer-off"><span aria-hidden="true">◌</span><p>${phone?'Telefon je vypnutý':['hacker','cafe-attacker'].includes(device)?'Počítač je vypnutý':'Notebook je vypnutý'}</p><small>Zapni ho tlačítkem pod obrazovkou.</small></div>`;
    else {
      screen=`<div class="computer-wallpaper" aria-hidden="true"><i></i><i></i><i></i></div>${app?'':`<div class="desktop-shortcuts" aria-label="Aplikace na ploše">${shortcuts}</div>${friend&&net.featureEnabled('instagram')?`<div class="desktop-chat-settings">${receiptSetting(net)}</div>`:''}`}`;
      if(app) {
        const content=tab==='mitm'?globalThis.InternetLab.mitmApp(net,sim,ui):tab==='attack'?globalThis.InternetLab.phishingApp(net,sim,ui):tab==='mail'?globalThis.InternetLab.mailApp(net,sim,ui,device):tab==='network'?connectionView(net,device,sim,ui):tab==='cloud'?globalThis.InternetLab.cloudApp(net,sim,ui,device):tab==='chatbot'?chatbotApp(net,sim,ui,device):tab==='web'?browser(net,sim,viewUi,device):tab==='print'?documentApp(net,sim):globalThis.InternetLab.instagramView(net,sim,viewUi,device);
        screen+=`<section class="computer-application ${tab==='web'?'browser-application':tab==='message'?'instagram-application':tab==='mail'?'gmail-application':tab==='chatbot'?'chatbot-application':tab==='cloud'?'cloud-application':''}" aria-label="${app}"><div class="computer-app-title"><span class="app-title-icon app-${tab}">${icon(tab)}</span><h3>${app}</h3><button type="button" data-action="computer-home" aria-label="Zavřít aplikaci ${app}" title="Zavřít aplikaci ${app}">${icon('close')}</button></div><div class="computer-app-body">${content}</div></section>`;
      }
      screen+=`${phone?`<div class="phone-status"><span>Lipová</span><span>${net.access.phone.mode==='cellular'?'Mobilní data':net.access.phone.mode==='wifi'?'Wi-Fi':'Offline'}</span></div>`:''}<div class="computer-taskbar" aria-label="Hlavní panel zařízení"><button class="computer-start ${tab==='desktop'?'active':''}" data-action="computer-home" aria-label="Zobrazit plochu" title="Plocha">${icon('desktop')}</button><span class="taskbar-divider"></span>${Object.entries(availableApps).map(([id,name])=>`<button class="taskbar-app ${tab===id?'active':''}" data-computer-app="${id}" aria-label="Otevřít ${name.toLowerCase()}" aria-pressed="${tab===id}" title="${name}">${icon(id)}<span>${name}</span></button>`).join('')}${device==='cafe-attacker'?'<button class="computer-connection" data-computer-app="mitm" aria-label="Otevřít ovládání hotspotu">'+icon('wifi')+'</button>':`<button class="computer-connection ${connected?'':'disconnected'}" data-computer-app="network" aria-label="Připojení: ${connected?net.access[device].mode==='wifi'?'Wi-Fi':net.access[device].mode==='cellular'?'mobilní data':'kabel':'nedostupné'}">${icon(net.access[device].mode)}</button>`}</div>`;
    }
    return `<div class="monitor-heading"><h2 id="computer-title" hidden>${esc(n.name)}</h2><button class="monitor-close" data-action="close-monitor" aria-label="Zavřít monitor a vrátit se k mapě"><span>Zpět k mapě</span> ×</button></div><div class="monitor-frame"><div class="monitor-screen ${n.on?'':'screen-off'}">${screen}</div><div class="monitor-chin"><span class="monitor-brand">LIPOV</span><span class="monitor-power-light ${n.on?'on':''}"></span><button class="computer-power" data-action="toggle-node" data-id="${n.id}" aria-label="${n.on?'Vypnout':'Zapnout'} ${phone?'telefon':['hacker','cafe-attacker'].includes(device)?'počítač':friend?'Matějův notebook':'notebook'}" title="${n.on?'Vypnout':'Zapnout'} ${phone?'telefon':['hacker','cafe-attacker'].includes(device)?'počítač':friend?'Matějův notebook':'notebook'}">${icon('power')}</button></div></div>${phone?'':'<div class="monitor-stand" aria-hidden="true"><i></i><span></span></div>'}`;
  }
  Object.assign(globalThis.InternetLab,{computerView});
})();
