/* Both ends of one conversation, backed by delivered messages in the network model. */
(() => {
  'use strict';
  const {esc,MESSAGE_TYPES,formatBytes,messagePreview}=globalThis.InternetLab;
  const encoder=new TextEncoder();
  const paths={
    text:'<path d="M4 5h16M12 5v15m-4 0h8"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    send:'<path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
  };
  const icon=id=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[id]}</svg>`;
  const avatar=(self=false,large=false)=>`<span class="ig-avatar ${self?'self':''} ${large?'large':''}" aria-hidden="true">${self?'T':'M'}</span>`;
  const receiptSetting=net=>`<label class="ig-receipt-setting"><input type="checkbox" data-receipts ${net.friend.receipts?'checked':''}> Potvrzení přečtení</label>`;
  const visibleMessages=(net,device)=>net.instagram.history.filter(m=>m.senderDevice===device||(m.recipientDevice===device&&m.delivered));
  const senderStatus=(net,entry)=>({sending:'Odesílání…',sent:entry.id===net.instagram.id&&net.instagram.state==='queued'?'Odesláno · čeká na připojení':'Odesláno',delivered:'Doručeno',read:'Zobrazeno',failed:'Nepodařilo se odeslat'}[entry.status]);

  function contact(friend) {
    const name=friend?'Ty':'Matěj',handle=friend?'ty.na.lipove':'matej';
    return `<header class="ig-contact">${avatar(friend)}<div class="ig-contact-name"><strong>${name}</strong><small>@${handle}</small></div><button type="button" class="ig-icon-button ig-close" data-action="computer-home" aria-label="Zavřít Instagram" title="Zavřít Instagram">${icon('close')}</button></header>`;
  }
  function sidebar(net,friend,device) {
    const latest=visibleMessages(net,device).at(-1),preview=latest?.content.type==='text'?latest.text:latest?.content.name;
    return `<aside class="ig-sidebar" aria-label="Konverzace"><div class="ig-sidebar-brand">Instagram</div><div class="ig-account">${avatar(!friend)}<span><strong>${friend?'Matěj':'Ty'}</strong><small>@${friend?'matej':'ty.na.lipove'}</small></span></div><div class="ig-sidebar-label">Zprávy <span>1</span></div><div class="ig-thread" aria-current="true">${avatar(friend)}<div><strong>${friend?'Ty':'Matěj'}</strong><p>${esc(preview||'Začni konverzaci')}</p></div></div><span class="ig-sidebar-note">Přímé zprávy</span></aside>`;
  }
  function introduction(friend) {
    return `<div class="ig-chat-intro">${avatar(friend,true)}<strong>${friend?'Ty':'Matěj'}</strong><small>@${friend?'ty.na.lipove':'matej'} · Instagram</small><p>Tady začíná vaše konverzace.</p></div>`;
  }
  function message(net,entry,device) {
    const outgoing=entry.senderDevice===device,content=entry.content,status=outgoing?senderStatus(net,entry):entry.read?'Zobrazeno':'Doručeno';
    return `<article class="ig-message-group ${outgoing?'outgoing':'incoming'}" data-instagram-message="${entry.id}" aria-label="${outgoing?'Odeslaná':'Přijatá'} zpráva">${content.type==='text'?`<div class="ig-bubble ${outgoing?'outgoing':'incoming'}">${esc(entry.text)}</div>`:`<div class="ig-media-message">${messagePreview(content,!outgoing)}<small>${esc(content.name)}</small></div>`}<span class="ig-message-status ${entry.status==='failed'?'error':''}">${status}</span></article>`;
  }
  function composer(net,sim,ui,friend) {
    const type=ui.messageType||'text',size=type==='text'?encoder.encode(ui.message).length:MESSAGE_TYPES[type].size,busy=sim.status==='running'||['queued','delivering'].includes(net.instagram.state),draft={...MESSAGE_TYPES[type],type,size};
    return `<form data-form="message" class="ig-compose"><div class="ig-compose-types" aria-label="Typ odesílaného obsahu">${Object.entries(MESSAGE_TYPES).map(([id,spec])=>`<button type="button" data-message-type="${id}" aria-pressed="${id===type}" ${busy?'disabled':''}>${icon(id)}<span>${spec.label}</span></button>`).join('')}</div>${type==='text'?'':`<div class="ig-attachment">${messagePreview(draft)}<div><strong>${esc(draft.name)}</strong><small>${formatBytes(size)}</small></div><button type="button" class="ig-icon-button" data-message-type="text" aria-label="Odebrat přílohu" ${busy?'disabled':''}>${icon('close')}</button></div>`}<div class="ig-compose-box">${type==='text'?`<textarea id="message-text" data-field="message" aria-label="Zpráva pro ${friend?'@ty.na.lipove':'Matěje'}" placeholder="Napiš zprávu…" rows="1" maxlength="4000" required>${esc(ui.message)}</textarea>`:`<span class="ig-attachment-ready">${type==='image'?'Obrázek':'Video'} je připravené k odeslání</span>`}<button type="submit" class="ig-send" ${busy?'disabled':''} aria-label="${type==='text'?'Odeslat zprávu':type==='image'?'Odeslat obrázek':'Odeslat video'}"><span>Odeslat</span>${icon('send')}</button></div></form>`;
  }
  function instagramView(net,sim,ui,device='laptop') {
    const friend=device==='friend',ig=net.instagram,entries=visibleMessages(net,device);
    const receiving=ig.recipientDevice===device&&net.friend.state==='receiving'&&!ig.history.at(-1)?.delivered;
    const ownTransfer=ig.senderDevice===device;
    const notices=ownTransfer?`${ig.state==='queued'?'<div class="ig-notice">Příjemce není dostupný. Instagram zprávu uchoval a doručí ji po připojení.</div>':''}${ig.error?`<div class="ig-notice error">${esc(ig.error)}</div>`:''}`:'';
    return `<div class="instagram-app">${sidebar(net,friend,device)}<section class="ig-main" aria-label="Chat s ${friend?'tebou':'Matějem'}">${contact(friend)}<div class="ig-conversation" tabindex="0" aria-label="Zprávy v konverzaci">${introduction(friend)}${entries.map(entry=>message(net,entry,device)).join('')}${receiving?'<div class="ig-receiving" role="status"><i></i><i></i><i></i><span>Přijímání zprávy…</span></div>':''}${notices}</div>${composer(net,sim,ui,friend)}${ownTransfer&&ig.state==='queued'?'<div class="ig-retry"><button type="button" class="ig-text-button" data-action="resume-message">Zkusit doručit znovu ↗</button></div>':''}</section></div>`;
  }
  Object.assign(globalThis.InternetLab,{instagramView,instagramReceiptSetting:receiptSetting});
})();
