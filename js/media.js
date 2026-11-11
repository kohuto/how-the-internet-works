/* Local preview assets illustrate deterministic model bytes, not real file uploads. */
(() => {
  'use strict';
  const MESSAGE_MSS=1400;
  const MESSAGE_TYPES={text:{label:'Text',name:'Textová zpráva'},image:{label:'Obrázek',name:'Odpoledne na hřišti.jpg',size:100000},video:{label:'Video',name:'Hra na hřišti.mp4',size:5000000}};
  const formatBytes=n=>n<1000?`${n} B`:n<1000000?`${(n/1000).toLocaleString('cs-CZ',{maximumFractionDigits:1})} kB`:`${(n/1000000).toLocaleString('cs-CZ',{maximumFractionDigits:2})} MB`;
  const packetWord=n=>n===1?'paket':n>=2&&n<=4?'pakety':'paketů';
  const formatPackets=(n,data=false)=>`${n.toLocaleString('cs-CZ')} ${data?(n===1?'datový paket':n>=2&&n<=4?'datové pakety':'datových paketů'):packetWord(n)}`;
  function makeMessage(type='text',text='') {
    if(!MESSAGE_TYPES[type])type='text';
    const spec=MESSAGE_TYPES[type],bytes=type==='text'?new TextEncoder().encode(text):new Uint8Array(spec.size);
    if(type!=='text')for(let i=0;i<bytes.length;i++)bytes[i]=(i*31+(i>>>8)+(type==='image'?73:151))&255;
    return {type,name:spec.name,size:bytes.length,bytes};
  }
  function messagePlan(size) {
    const packets=Math.ceil(size/MESSAGE_MSS),groupSize=packets<=16?1:packets<=200?10:100;
    return {packets,groupSize,groups:Math.ceil(packets/groupSize)};
  }
  function messagePreview(content,playable=false) {
    if(!content||content.type==='text')return '';
    return `<figure class="message-preview ${content.type}">${content.type==='video'&&playable?'<video controls playsinline preload="metadata" poster="./assets/message-scene.svg" aria-label="Přehrát doručené ukázkové video"><source src="./assets/message-video.mp4" type="video/mp4"></video>':`<img src="./assets/message-scene.svg" alt="Ukázka hřiště s míčem">${content.type==='video'?'<span class="preview-play" aria-hidden="true">▶</span>':''}`}<figcaption>${content.type==='video'?'Video · 4 s':'Obrázek'} · modelový přenos ${formatBytes(content.size)}</figcaption></figure>`;
  }
  Object.assign(globalThis.InternetLab,{MESSAGE_MSS,MESSAGE_TYPES,formatBytes,formatPackets,makeMessage,messagePlan,messagePreview});
})();
