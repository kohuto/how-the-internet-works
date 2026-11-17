(() => {
  'use strict';
  const {esc,requestText,responseText}=globalThis.InternetLab;
  const definition=(label,value)=>`<dt>${label}</dt><dd>${esc(value)}</dd>`;
  const preview=text=>`<div class="payload-preview">${esc(text)}</div>`;
  const hex=(bytes,limit)=>Array.from(bytes.slice(0,limit),b=>b.toString(16).padStart(2,'0')).join(' ')+(bytes.length>limit?' …':'');

  function packetData(p) {
    const pl=p.payload;
    let label='',content='';
    if(pl.cipher) {
      label='VPN';content=preview(hex(pl.cipher,160));
    } else if(pl.record||pl.publicText) {
      label='TLS';
      if(pl.publicText)content+=preview(pl.publicText);
      if(pl.record)content+=preview(hex(pl.record.data,160));
    } else if(pl.bytes) {
      if(pl.contentType&&pl.contentType!=='text') {
        label=pl.contentType==='video'?'video':'obrázek';content=preview(hex(pl.bytes,64));
      } else {
        content=preview(new TextDecoder().decode(pl.bytes));
        content+=`<details><summary class="hint">Bajty v šestnáctkové soustavě</summary>${preview(hex(pl.bytes,pl.bytes.length))}</details>`;
      }
    } else if(p.kind==='dns-query') {
      label='DNS';content=preview(`Dotaz ${pl.type||'A'}: ${pl.name}`);
    } else if(p.kind==='dns-response') {
      label='DNS';content=preview(`Odpověď ${pl.type||'A'}: ${pl.name} → ${pl.exchange?pl.preference+' '+pl.exchange+'; A → ':''}${pl.answer}`);
    } else if(p.kind==='http-request') {
      label='HTTP';content=preview(requestText(pl));
    } else if(p.kind==='http-response') {
      label='HTTP';content=preview(responseText(pl));
    } else if(p.kind==='ig-connect') {
      content=preview(JSON.stringify({purpose:pl.purpose}));
    } else if(p.kind==='ig-read') {
      content=preview(JSON.stringify({messageId:pl.messageId}));
    } else if(p.kind==='print') {
      content=preview(pl.document);
    }
    return `<section class="protocol-box packet-data"><h3>DATA${label?' · '+label:''}</h3>${content||preview('Bez dat')}</section>`;
  }

  function packetView(net,p) {
    const detailed=net.detailEnabled('headers');
    let html='<div class="packet-heading"><h2 id="packet-title">Paket</h2></div>';
    html+=`<section class="protocol-box"><h3>${detailed?'IP HLAVIČKA · IPv4':'HLAVIČKA PAKETU'}</h3><dl class="dl">${definition('Zdrojová IP adresa',p.src)}${definition('Cílová IP adresa',p.dst)}${detailed?definition('Protokol',p.protocol):definition('Pořadí paketu',p.packetOrder)}${net.detailEnabled('ttl')?definition('TTL',p.ttl):''}${detailed&&p.payload.bytes?definition('Celková délka modelového IP paketu',`${40+p.payload.bytes.length} B`):''}</dl></section>`;
    if(detailed) {
      html+=`<section class="protocol-box tcp"><h3>${p.protocol==='TCP'?'TCP HLAVIČKA':'UDP HLAVIČKA'}</h3><dl class="dl">${definition('Zdrojový port → cílový port',`${p.sport} → ${p.dport}`)}${p.protocol==='TCP'?definition('Pořadové číslo TCP · SEQ',p.seq):''}</dl></section>`;
    }
    html+=packetData(p);
    if(p.frame&&!p.frame.satellite&&!p.frame.cellular) {
      html+=`<details><summary class="hint">${p.frame.medium==='wifi'?'Wi-Fi':'Ethernetový'} rámec</summary><dl class="dl">${definition('Zdrojová MAC',p.frame.src)}${definition('Cílová MAC',p.frame.dst)}</dl></details>`;
    }
    return html;
  }
  Object.assign(globalThis.InternetLab,{packetView});
})();
