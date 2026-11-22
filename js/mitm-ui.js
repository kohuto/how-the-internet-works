(() => {
  'use strict';
  const {esc,MITM_MODES}=globalThis.InternetLab;
  const disabled=sim=>sim.status==='running'?'disabled':'';
  function cafeConnection(net,sim,ui={}){
    const a=net.access.cafe,connected=a.mode==='wifi',networks=net.cafeNetworks();
    return `<section class="cafe-networks" aria-label="Dostupné Wi-Fi sítě">
      <div class="field-label">DOSTUPNÉ SÍTĚ</div><div class="cafe-hotspots">${networks.length?networks.map(n=>`<button type="button" data-cafe-hotspot="${n.id}" aria-pressed="${connected&&a.hotspot===n.id}" ${disabled(sim)}><strong>${esc(n.ssid)}</strong><small>${n.secured?'🔒 Zabezpečená síť':'Otevřená síť'}${connected&&a.hotspot===n.id?' · Připojeno':''}</small></button>`).join(''):'<p>Žádné dostupné sítě.</p>'}</div>
      ${ui.cafeWifiChoice==='trusted'&&networks.some(n=>n.id==='trusted')?`<form class="cafe-wifi-login" data-form="cafe-wifi"><label for="cafe-wifi-password">Heslo pro ${esc(net.cafeWifi.ssid)}</label><input id="cafe-wifi-password" type="password" data-field="cafePassword" value="${esc(ui.cafePassword||'')}" autocomplete="off" required ${disabled(sim)}>${ui.cafeWifiError?`<p class="cafe-wifi-error" role="alert">${esc(ui.cafeWifiError)}</p>`:''}<div><button type="submit" class="primary-button" ${disabled(sim)}>Připojit</button><button type="button" class="secondary-button" data-action="cafe-wifi-cancel">Zrušit</button></div></form>`:''}
      </section>`;
  }
  function cafeBrowserInfo(net){
    const a=net.access.cafe;
    return `<div class="cafe-browser-info"><strong>☕ Notebook hosta</strong><span>${a.mode==='offline'?'Bez připojení':esc(a.hotspot==='rogue'?net.mitm.ssid:net.cafeWifi.ssid)}</span><button class="inline-link" data-computer-app="network">Změnit připojení ↗</button></div>`;
  }
  function mitmApp(net,sim,ui={}){
    const m=net.mitm;
    return `<div class="mitm-app"><form class="mitm-hotspot-settings" data-form="mitm-hotspot" aria-labelledby="mitm-hotspot-title"><div class="mitm-hotspot-header"><div><h4 id="mitm-hotspot-title">Hotspot</h4><span>${m.active?'Zapnutý':'Vypnutý'}</span></div><input class="mitm-hotspot-switch" type="checkbox" role="switch" data-mitm-active aria-label="Zapnout hotspot" ${m.active?'checked':''} ${disabled(sim)}></div><label for="mitm-ssid">Název Wi-Fi</label><input id="mitm-ssid" class="text-input" data-field="mitmSsid" value="${esc(ui.mitmSsid??m.ssid)}" maxlength="32" required ${disabled(sim)}><button type="submit" class="secondary-button" ${disabled(sim)}>Uložit název</button></form><label class="field-label" for="mitm-mode">CO ÚTOČNÍK ZKUSÍ</label><select id="mitm-mode" class="text-input" data-mitm-mode ${disabled(sim)}>${Object.entries(MITM_MODES).filter(([id])=>net.featureEnabled('tls')||!['certificate','tls'].includes(id)).map(([id,label])=>`<option value="${id}" ${m.mode===id?'selected':''}>${label}</option>`).join('')}</select><section class="mitm-log"><header><h3>Co útočníkem opravdu prošlo</h3></header>${m.logs.length?[...m.logs].reverse().map(row=>`<article class="mitm-record ${row.changed?'changed':''}"><div class="mitm-record-heading"><strong>${esc(row.label)}</strong></div><code class="mitm-endpoints">${esc(row.header.src)}:${row.header.sport} → ${esc(row.header.dst)}:${row.header.dport}</code><div class="mitm-record-state">${row.protected?'▣ '+row.protection+' · obsah chráněný':row.kind.startsWith('tls-')?'TLS handshake · veřejná část':row.kind.startsWith('dns-')?'DNS · čitelné':'HTTP · čitelné'}${row.changed?' · zásah útočníka':''}</div>${row.before?`<details ${row.protected?'':'open'}><summary>${row.protected?'Veřejná část handshake':'Přečtený obsah'+(row.changed?' před změnou':'')}</summary><pre>${esc(row.before)}</pre></details>`:''}${row.changed&&!row.protected?`<details open><summary>Po změně útočníkem</summary><pre>${esc(row.after)}</pre></details>`:''}</article>`).join(''):'<div class="mitm-empty">Zatím tudy neprošel žádný paket hosta. Zapni hotspot, připoj k němu hosta a spusť jeho přenos.</div>'}</section></div>`;
  }
  Object.assign(globalThis.InternetLab,{mitmApp,cafeConnection,cafeBrowserInfo});
})();
