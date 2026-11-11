(() => {
  'use strict';
  const icons={
    laptop:'<rect x="-27" y="-24" width="54" height="35" rx="4"/><path d="m-34 19 7-8h54l7 8z"/><path d="M-10 18h20"/><path class="icon-screen" d="m-10-8 6 6-6 6m13 0h8"/>',
    printer:'<path d="M-17-13v-17h34v17"/><rect x="-28" y="-13" width="56" height="32" rx="6"/><path d="M-17 8h34v23h-34z"/><path d="M-10 16h20m-20 7h14"/><circle cx="18" cy="-3" r="2" class="led"/>',
    switch:'<rect x="-32" y="-17" width="64" height="34" rx="7"/><path d="M-23-3h10v10h-10zm18 0H5v10H-5zm18 0h10v10H13z"/><path d="m-18-9 5-4m12 4 5-4m12 4 5-4"/>',
    router:'<circle r="27"/><path d="M-17-10h15m-5-5 5 5-5 5M17 10H2m5-5-5 5 5 5M10-17v15m-5-5 5 5 5-5M-10 17V2m-5 5 5-5 5 5"/>',
    server:'<rect x="-24" y="-34" width="48" height="68" rx="5"/><path d="M-24-11h48m-48 22h48M-15-23H3m-18 23H3m-18 22H3"/><circle cx="14" cy="-23" r="2" class="led"/><circle cx="14" cy="0" r="2" class="led"/><circle cx="14" cy="22" r="2" class="led"/>',
    ap:'<rect x="-27" y="4" width="54" height="22" rx="7"/><path d="M-18 4v-19M18 4v-19M-18-21q18-17 36 0m-28 5q10-9 20 0"/><circle cx="0" cy="15" r="2" class="led"/>',
    phone:'<rect x="-18" y="-32" width="36" height="64" rx="7"/><path d="M-7-24H7M-5 24H5"/><path class="icon-screen" d="m-7-5 5 5-5 5m12 0h6"/>',
    bts:'<path d="M0-25-22 32M0-25l22 57M-12 8h24M-18 23h36M-20 32h40M0-35v22M-11-30q-12 12 0 24m22-24q12 12 0 24M-21-38q-20 20 0 40m42-40q20 20 0 40"/>'
  };
  icons.vpn='<path d="M0-34 27-24v24c0 19-27 34-27 34S-27 19-27 0v-24Z"/><rect x="-12" y="-6" width="24" height="22" rx="4"/><path d="M-7-6v-7a7 7 0 0 1 14 0v7"/>';
  icons.cafe=icons.laptop;icons['cafe-attacker']=icons.laptop;icons.hacker=icons.laptop;icons['phish-web']=icons.server;icons.mail='<rect x="-30" y="-22" width="60" height="44" rx="6"/><path d="m-29-18 29 24 29-24M-30 20-9 1m39 19L9 1"/>';
  icons.cabin=icons.laptop;
  icons.terminal='<path d="M-24-22q-2 38 38 37Z"/><path d="M-7-5 18-30m-3-3 6 6M-2 13v16m-14 3h32"/>';
  icons['sat-gateway']=icons.terminal;
  icons.satellite='<rect x="-12" y="-18" width="24" height="36" rx="4"/><path d="M-15-13h-25v26h25m30-26h25v26H15M-31-13v26m62-26v26M0-18v-10m-5-3h10M0 18v13m-8-3q8 9 16 0"/>';
  icons.friend=icons.laptop;icons.instagram=icons.server;
  const presets={cafe:[25,1070,865,540],home:[35,270,465,440],city:[470,100,1020,650],dc:[880,35,980,1400],friend:[1820,365,560,510],mobile:[100,530,930,530],vpn:[1300,1040,620,440],hacker:[1810,1000,560,490],satellite:[10,-565,1325,1080],all:[20,-565,2320,2180]};
  const decor=`
    <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#bdc9c0" opacity=".55"/></pattern><pattern id="floor" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 0h28v28" fill="none" stroke="#dedfd2" stroke-width=".6"/></pattern><filter id="shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#213d37" flood-opacity=".09"/></filter></defs>
    <rect x="-3000" y="-3000" width="7000" height="7000" fill="#f0f3eb"/><rect x="-3000" y="-3000" width="7000" height="7000" fill="url(#grid)"/>
    <g class="satellite-scenery"><rect x="45" y="-550" width="1170" height="240" rx="40" fill="#e7eef3" stroke="#cadce7" stroke-dasharray="6 10"/><path d="M100-360Q660-580 1160-360" fill="none" stroke="#b8cfdf" stroke-dasharray="4 10"/><text x="600" y="-525" class="place-label">11 / SATELITNÍ PŘÍSTUP · LEO</text><text x="600" y="-500" class="center-subtitle">POLOHA A VZDÁLENOSTI JSOU SCHEMATICKÉ</text>
    <path d="M70-145 255-235 435-145" fill="#ddd9bf" stroke="#babda5" stroke-width="4"/><rect x="70" y="-145" width="365" height="350" rx="9" fill="#faf8ee" stroke="#b7c1b2" stroke-width="4"/><rect x="76" y="-139" width="353" height="338" fill="url(#floor)"/><rect x="106" y="2" width="90" height="75" rx="9" fill="#e4d4b8" stroke="#cbb897"/><text x="70" y="-255" class="place-label">10 / CHATA ZA MĚSTEM</text>
    <path d="M80 235q210 90 450 0" stroke="#c8d8be" fill="none" stroke-width="2" stroke-dasharray="8 10"/><g fill="#d9e5ce" stroke="#b2c5a7" stroke-width="2"><path d="m50-100-30 65h60Z"/><path d="m470 125-30 65h60Z"/></g>
    <rect x="820" y="-140" width="160" height="150" rx="14" fill="#e7eef3" stroke="#bdd1df" stroke-width="2"/><text x="820" y="-165" class="place-label">12 / POZEMNÍ BRÁNA</text></g>
    <g class="scenery"><path d="M483 181q139-70 310 0t168 109v329q-23 106-185 97T483 659Z" fill="#e7ede3" stroke="#d7e0d3" stroke-dasharray="5 8"/>
    <path d="M525 406h367M627 211v492" fill="none" stroke="#d3dccd" stroke-width="27"/><path d="M525 406h367M627 211v492" fill="none" stroke="#f4f5ee" stroke-width="23"/><path d="M525 406h367M627 211v492" fill="none" stroke="#d7dece" stroke-width="1" stroke-dasharray="5 8"/>
    <g fill="#d9e2d6" stroke="#c1cfbe" stroke-width="1.5"><rect x="528" y="233" width="52" height="65" rx="5"/><rect x="779" y="202" width="57" height="62" rx="4"/><path d="m774 549 31-22 31 22v66h-62z"/><rect x="527" y="589" width="48" height="76" rx="3"/></g>
    <g stroke="#b9c7b5" stroke-width="5" stroke-dasharray="8 8"><path d="M539 247h29m-29 13h29m-29 13h29m224-57h34m-34 15h34m-34 15h34M789 561h32m-32 16h32M537 605h27m-27 16h27m-27 16h27"/></g>
    <g fill="#d4e3c8"><circle cx="872" cy="236" r="22"/><circle cx="853" cy="657" r="27"/><circle cx="505" cy="354" r="21"/><circle cx="927" cy="626" r="18"/></g><g stroke="#a7bd9f" stroke-width="2"><path d="M872 220v40m-8-24 8 9 9-12M853 640v43m-11-23 11 8 12-14M505 342v32M927 615v28"/></g>
    <rect x="62" y="316" width="395" height="342" rx="10" fill="#faf8ee" stroke="#b7c1b2" stroke-width="5"/>
    <rect x="69" y="323" width="381" height="328" rx="5" fill="url(#floor)"/>
    <path d="M67 538h134m58 0h43M249 323v59m0 73v83M351 555v98" fill="none" stroke="#b7c1b2" stroke-width="5"/>
    <path d="M202 538a56 56 0 0 1 56-56v56M249 382a73 73 0 0 1 73 73h-73" fill="none" stroke="#c7ccbd" stroke-width="1.2"/>
    <rect x="104" y="380" width="93" height="78" rx="10" fill="#e4d4b8" stroke="#cbb897" stroke-width="2"/>
    <path d="M121 463v13m57-13v13" stroke="#cbb897" stroke-width="5"/>
    <rect x="108" y="557" width="84" height="66" rx="6" fill="#e7e5d7" stroke="#d2cebb" stroke-width="2"/>
    <g transform="translate(365 366)"><rect width="61" height="45" rx="9" fill="#dde3c9" stroke="#bdcbaa" stroke-width="1.5"/><path d="M6 18h49M16 8v20m29-20v20M8 46v6m45-6v6" fill="none" stroke="#bdcbaa" stroke-width="2"/></g>
    <g transform="translate(285 610)"><circle r="19" fill="#d7e2c0"/><path d="M0 14V-13M-10-1 0 5 11-7" stroke="#a2b784" fill="none" stroke-width="2"/><rect x="-11" y="12" width="22" height="16" rx="3" fill="#d2b89a"/></g>
    <path d="M90 316h69m190 0h53" stroke="#a9ccc9" stroke-width="7"/><path d="M96 316h56m203 0h40" stroke="#e2f2ea" stroke-width="4"/>
    <text x="80" y="350" class="room-label">PRACOVNA</text><text x="80" y="642" class="room-label">TISKOVÝ KOUT</text>
    ${[
      [1000,110,'03 / HOSTING','WEB · DNS · POŠTA · CHATBOT','#e8edf1','#bfccd2',410],
      [1480,110,'04 / INSTAGRAM','ZPRÁVY A ÚČTY','#f0e8f3','#d4c3dc'],
      [1000,735,'05 / CLOUD · CENTRUM A','HLAVNÍ SOUBORY · ZÁPIS A ČTENÍ','#e5eff1','#b8d4d8'],
      [1480,735,'06 / CLOUD · CENTRUM B','KOPIE SOUBORŮ · ČTENÍ','#f4eddf','#d9caa8'],
      [1950,-205,'14 / CIZÍ HOSTING','SERVER PODVODNÉ STRÁNKY','#f2e8e5','#d6bdb6'],
      [1480,1120,'09 / VPN CENTRUM','ŠIFROVANÝ TUNEL · VÝSTUP DO INTERNETU','#ece8f4','#c7bdd8']
    ].map(([x,y,title,subtitle,fill,stroke,height=300])=>`<g class="data-center"><rect x="${x}" y="${y}" width="320" height="${height}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M${x+14} ${y+18}h292M${x+14} ${y+height-18}h292" stroke="${stroke}" stroke-width="4" opacity=".45"/><g fill="${stroke}" opacity=".38"><rect x="${x+16}" y="${y+38}" width="24" height="77" rx="3"/><rect x="${x+46}" y="${y+38}" width="24" height="77" rx="3"/></g><text x="${x+4}" y="${y-28}" class="place-label">${title}</text><text x="${x+4}" y="${y-10}" class="center-subtitle">${subtitle}</text></g>`).join('')}
    <text x="73" y="292" class="place-label">01 / BYT NA LIPOVÉ</text><text x="520" y="149" class="place-label">02 / MĚSTO LIPOV</text>
    <text x="658" y="195" class="region-subtitle">JEDEN POSKYTOVATEL · DVĚ VĚTVE</text>
    <path d="M1240 455q100-65 180 12l-5 125q-89 69-180 0Z" fill="#e8ede5" stroke="#d2decd" stroke-dasharray="5 8"/>
    <text x="1240" y="425" class="place-label">DALŠÍ POSKYTOVATEL</text><g transform="translate(460 30)">
    <rect x="1475" y="400" width="350" height="340" rx="10" fill="#faf8ee" stroke="#b7c1b2" stroke-width="5"/>
    <rect x="1482" y="407" width="336" height="326" rx="5" fill="url(#floor)"/>
    <path d="M1480 650h160m65 0h117M1635 405v37m0 90v115" fill="none" stroke="#b7c1b2" stroke-width="5"/>
    <path d="M1635 443a88 88 0 0 1 88 88h-88M1640 650a64 64 0 0 1 64-64v64" fill="none" stroke="#c7ccbd" stroke-width="1.2"/>
    <rect x="1661" y="465" width="98" height="76" rx="10" fill="#e4d4b8" stroke="#cbb897" stroke-width="2"/>
    <path d="M1500 400h62m169 0h61" stroke="#a9ccc9" stroke-width="7"/>
    <g transform="translate(1520 460)"><rect width="59" height="44" rx="9" fill="#dde3c9" stroke="#bdcbaa" stroke-width="1.5"/><path d="M6 18h47M15 8v20m29-20v20" stroke="#bdcbaa" stroke-width="2" fill="none"/></g>
    <g transform="translate(1770 690)"><circle r="20" fill="#d7e2c0"/><path d="M0 14V-13M-10-1 0 5 11-7" stroke="#a2b784" fill="none" stroke-width="2"/><rect x="-11" y="12" width="22" height="16" rx="3" fill="#d2b89a"/></g>
    <text x="1490" y="375" class="place-label">07 / U MATĚJE</text><text x="1680" y="441" class="room-label">MATĚJŮV POKOJ</text>
    </g><path d="M150 815q430-150 800 5v192H150Z" fill="#ece7f2" stroke="#d6c9e3" stroke-dasharray="6 9"/>
    <text x="170" y="785" class="place-label">08 / MOBILNÍ SÍŤ</text>
    <g class="cafe-house"><rect x="65" y="1135" width="765" height="425" rx="18" fill="#f4ede0" stroke="#c7b797" stroke-width="4"/><rect x="72" y="1142" width="751" height="411" rx="12" fill="url(#floor)"/><path d="M100 1135h690" stroke="#b58e67" stroke-width="14" stroke-dasharray="40 14"/><circle cx="180" cy="1300" r="63" fill="#e5d4b8" stroke="#c6ac84" stroke-width="2"/><circle cx="440" cy="1440" r="63" fill="#dac9d5" stroke="#b69aaf" stroke-width="2"/><path d="M635 1160h160v65H635z" fill="#dfceb1" stroke="#c7b797"/><path d="M673 1182h20v21h-20zm20 3q16-3 12 9h-12" fill="none" stroke="#a48c67" stroke-width="3"/><text x="560" y="1105" class="place-label">15 / KAVÁRNA NA ROHU</text><text x="78" y="1538" class="region-subtitle">HOST · VEŘEJNÁ WI-FI · NAPODOBENÝ HOTSPOT</text></g>
    <g class="hacker-house"><rect x="1935" y="1080" width="350" height="350" rx="12" fill="#ede6ee" stroke="#c3b4c8" stroke-width="4"/><rect x="1942" y="1087" width="336" height="336" rx="6" fill="url(#floor)" opacity=".5"/><rect x="2125" y="1140" width="92" height="82" rx="9" fill="#c6bbce" stroke="#a597af" stroke-width="2"/><text x="1935" y="1050" class="place-label">13 / HACKERSKÉ DOUPĚ</text><text x="1950" y="1405" class="region-subtitle">POČÍTAČ ÚTOČNÍKA · VLASTNÍ PŘÍPOJKA</text></g>
    <text x="650" y="1020" class="region-subtitle">BTS · PŘÍPOJKA · SÍŤ OPERÁTORA</text>
    </g>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class NetworkMap {
    constructor(svg,net,onSelect) {
      this.svg=svg;this.net=net;this.scene='home';this.box=[...presets.home];this.onSelect=onSelect;this.labels=true;this.lastEvent=null;this.selected=null;this.selectedPacket=null;svg.dataset.scene='home';
      this.packets=new Map();this.packetViews=new Map();this.frame=[];this.pointers=new Map();
      svg.innerHTML=decor+'<g id="links-layer"></g><g id="nodes-layer"></g><g id="packet-layer"></g>';
      svg.addEventListener('click',e=> {
        if(this.dragged)return;
        const target=e.target.closest('[data-map-kind]');if(target)this.onSelect(target.dataset.mapKind,target.dataset.id);
      });
      svg.addEventListener('keydown',e=> {
        if(e.key==='Enter'||e.key===' ') {const target=e.target.closest('[data-map-kind]');if(target){e.preventDefault();this.onSelect(target.dataset.mapKind,target.dataset.id);}}
      });
      svg.addEventListener('pointerdown',e=> {
        if(e.button!==0)return;
        if(!this.pointers.size)this.dragged=false;
        const target=e.target.closest('[data-map-kind]');
        if(target&&e.pointerType!=='touch')return;
        this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(this.pointers.size===2) {
          this.dragged=true;this.drag=null;
          for(const id of this.pointers.keys())svg.setPointerCapture(id);
          this.pinch=this.pointerPinch();return;
        }
        if(this.pointers.size>2)return;
        if(target){target.setPointerCapture(e.pointerId);return;}
        this.drag={x:e.clientX,y:e.clientY,box:[...this.box]};svg.setPointerCapture(e.pointerId);
      });
      svg.addEventListener('pointermove',e=> {
        if(!this.pointers.has(e.pointerId))return;
        this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(this.pointers.size>=2) {
          const next=this.pointerPinch();
          if(this.pinch?.distance>0&&next.distance>0)this.zoom(this.pinch.distance/next.distance,this.pinch.center,next.center);
          this.pinch=next;return;
        }
        if(!this.drag)return;
        const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)<5)return;
        this.dragged=true;const scale=Math.max(this.box[2]/svg.clientWidth,this.box[3]/svg.clientHeight);
        this.box=[this.drag.box[0]-dx*scale,this.drag.box[1]-dy*scale,this.box[2],this.box[3]];this.setBox();
      });
      const endPointer=e=> {
        if(e.type==='lostpointercapture'&&svg.hasPointerCapture(e.pointerId))return;
        if(!this.pointers.delete(e.pointerId))return;
        this.pinch=this.pointers.size>=2?this.pointerPinch():null;
        const point=this.pointers.values().next().value;
        this.drag=this.pointers.size===1?{...point,box:[...this.box]}:null;
      };
      for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,endPointer);
      // Trackpad pinch is reported as Ctrl + wheel in Chromium and Firefox.
      svg.addEventListener('wheel',e=> {
        if(!e.ctrlKey&&!e.metaKey)return;
        e.preventDefault();
        if(this.gesture||this.pointers.size>=2)return;
        const unit=e.deltaMode===1?16:e.deltaMode===2?svg.clientHeight:1;
        this.zoom(Math.exp(Math.max(-1,Math.min(1,e.deltaY*unit*.005))),{x:e.clientX,y:e.clientY});
        this.rebaseDrag();
      },{passive:false});
      // Safari also provides native gesture events. Do not apply a touch pinch twice.
      svg.addEventListener('gesturestart',e=> {
        e.preventDefault();this.gesture={scale:e.scale||1,touch:this.pointers.size>=2};
      },{passive:false});
      svg.addEventListener('gesturechange',e=> {
        e.preventDefault();
        if(this.gesture&&this.pointers.size>=2)this.gesture.touch=true;
        if(!this.gesture||this.gesture.touch||!(e.scale>0))return;
        this.zoom(this.gesture.scale/e.scale,{x:e.clientX,y:e.clientY});
        this.gesture.scale=e.scale;this.rebaseDrag();
      },{passive:false});
      svg.addEventListener('gestureend',e=>{e.preventDefault();this.gesture=null;},{passive:false});
      this.render();
    }
    pointerPinch() {
      const [a,b]=this.pointers.values();
      return {distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};
    }
    rebaseDrag() {
      if(this.drag&&this.pointers.size===1)this.drag={...this.pointers.values().next().value,box:[...this.box]};
    }
    setBox() {this.svg.setAttribute('viewBox',this.box.join(' '));}
    setScene(scene) {this.scene=scene;this.svg.dataset.scene=scene;this.box=[...presets[scene]];this.setBox();}
    zoom(factor,origin,destination=origin) {
      if(!Number.isFinite(factor)||factor<=0)return;
      const [x,y,w,h]=this.box,rect=this.svg.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      if(!Number.isFinite(origin?.x)||!Number.isFinite(origin?.y))origin=center;
      if(!Number.isFinite(destination?.x)||!Number.isFinite(destination?.y))destination=origin;
      // Match SVG's xMidYMid meet, including the blank space beside a tall/wide viewBox.
      const scale=Math.max(w/rect.width,h/rect.height),nw=Math.min(4000,Math.max(220,w*factor)),nh=h*nw/w;
      const nextScale=scale*nw/w;
      this.box=[x+w/2+(origin.x-center.x)*scale-nw/2-(destination.x-center.x)*nextScale,
        y+h/2+(origin.y-center.y)*scale-nh/2-(destination.y-center.y)*nextScale,nw,nh];
      this.setBox();
    }
    setAnimationsPlaying(playing) {
      for(const view of this.packetViews.values())if(view.animation)playing?view.animation.play():view.animation.pause();
    }
    animationTimeRemaining() {
      let remaining=0;
      for(const {animation} of this.packetViews.values())if(animation) {
        remaining=Math.max(remaining,Number(animation.effect.getTiming().duration)-(animation.currentTime||0));
      }
      return Math.max(0,remaining);
    }
    finishAnimations() {
      for(const view of this.packetViews.values())if(view.animation) {
        view.g.setAttribute('transform',view.destination);view.animation.cancel();view.animation=null;
      }
    }
    render(event=this.lastEvent,selected=this.selected,selectedPacket=this.selectedPacket,animate=false,duration=650,packets=this.packets,frame=this.frame) {
      this.lastEvent=event;this.selected=selected;this.selectedPacket=selectedPacket;this.packets=packets;this.frame=frame;
      this.svg.classList.toggle('hide-labels',!this.labels);
      const vpnLinks=new Set(Object.values(this.net.vpn?.clients||{}).filter(c=>c.enabled).flatMap(c=>c.path));
      this.svg.querySelector('#links-layer').innerHTML=Object.values(this.net.links).map(l=> {
        const a=this.net.nodes[l.a],b=this.net.nodes[l.b],active=this.net.isActive(l),current=frame.some(e=>['hop','satellite-flight'].includes(e.kind)&&e.link===l.id);
        let x=(a.x+b.x)/2,y=(a.y+b.y)/2;if(l.id==='north-peer'){x+=120;y-=35;}
        const unused=!this.net.selectedAccess(l),radio=['wifi','cellular','satellite'].includes(l.medium);
        const label=radio&&active?`<g class="link-label radio-label" transform="translate(${x},${y-12})"><rect x="-27" y="-11" width="54" height="20" rx="6"/><text text-anchor="middle" y="3">${l.medium==='satellite'?'rádio':l.medium==='wifi'?'Wi-Fi':'data'}</text></g>`:['uplink','edge-north','north-dc','edge-south','south-dc','dc-access','north-peer','friend-uplink','mobile-uplink'].includes(l.id)?`<g class="link-label" transform="translate(${x},${y-13})"><rect x="-22" y="-11" width="44" height="20" rx="6"/><text text-anchor="middle" y="3">${l.on?'↔':'odpojeno'}</text></g>`:'';
        return `<g class="map-link medium-${l.medium} ${active?'':'offline'} ${unused?'unused':''} ${selected?.kind==='link'&&selected.id===l.id?'selected':''} ${current?'carrying':''} ${active&&vpnLinks.has(l.id)?'vpn-route':''} ${active&&['cafe-twin','cafe-relay'].includes(l.id)?'mitm-route':''}" data-map-kind="link" data-id="${l.id}" role="button" aria-label="${esc(l.name)} · ${unused?'nevybrané připojení':active?'spojeno':'nedostupné'}" tabindex="0"><title>${esc(l.name)} · otevřít detail</title><path class="link-hit" d="M${a.x},${a.y}L${b.x},${b.y}"/><path class="link-line" d="M${a.x},${a.y}L${b.x},${b.y}"/>${label}${!active&&!unused?`<g transform="translate(${x},${y})" class="cut-mark"><circle r="10"/><path d="m-4-4 8 8m0-8-8 8"/></g>`:''}</g>`;
      }).join('');
      this.svg.querySelector('#nodes-layer').innerHTML=Object.values(this.net.nodes).map(n=> {
        const icon=icons[n.id]||icons[n.type]||icons.server;
        const chosen=selected?.kind==='node'&&selected.id===n.id,current=frame.some(e=>e.node===n.id);
        const below=n.id==='friend-home'?72:n.id==='printer'?49:n.id==='dns'||n.id==='web'||n.id==='chatbot'||n.id==='instagram'?53:48;
        const mode=this.net.access[n.id]?.mode;
        const subtitle=n.id==='cafe-attacker'?(this.net.mitm.active&&n.on?'NAPODOBENÝ HOTSPOT ZAPNUTÝ':'NAPODOBENÝ HOTSPOT VYPNUTÝ'):n.id==='cafe'?this.net.access.cafe.hotspot==='rogue'?'PŘES NAPODOBENOU WI-FI':'WI-FI KAVÁRNY':n.type==='satellite'?'PŘEPOSÍLÁNÍ DAT · LEO':n.type==='terminal'?(this.net.satellite.clearView?'VOLNÝ VÝHLED':'ZAKRYTÝ VÝHLED'):n.id==='sat-gateway'?'SATELIT ↔ INTERNET':mode?({cable:'KABEL',wifi:'WI-FI',cellular:'MOBILNÍ DATA',offline:'BEZ PŘIPOJENÍ'}[mode]):n.type==='bts'?'RÁDIOVÝ PŘÍSTUP':n.type==='ap'?'PŘÍSTUPOVÝ BOD':n.id==='mobile-core'?'BRÁNA DO INTERNETU':n.id==='hacker'?'PHISHING · VÝUKOVÝ SCÉNÁŘ':n.id==='phish-web'?'KNIHOVNA-PODPORA.TEST':n.id==='mail'?'SCHRÁNKY A E-MAILY':n.id==='dns'?'NÁZEV → IP':n.id==='web'?'OBSAH WEBU':n.id==='vpn'?'KONEC VPN TUNELU':n.id==='chatbot'?(this.net.chatbot.server.state==='processing'?`ZPRACOVÁVÁ · ${this.net.chatbot.server.step} / 3`:'VÝPOČET NA SERVERU'):n.id==='cloud'?'HLAVNÍ SOUBORY':n.id==='cloud-backup'?'KOPIE · ČTENÍ':n.id==='instagram'?'ZPRÁVY MEZI ÚČTY':n.id==='switch'?'PŘEPÍNÁNÍ':this.net.nat?.[n.id]?'SMĚROVÁNÍ · NAT':n.id==='dc-switch'?'PŘEPÍNÁNÍ':'';
        return `<g transform="translate(${n.x},${n.y})" data-map-kind="node" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)} · ${n.on?'zapnuto':'vypnuto'}" class="map-node node-${n.type} node-${n.id} ${n.on?'':'off'} ${n.type==='terminal'&&!this.net.satellite.clearView?'obstructed':''} ${chosen?'selected':''} ${current?'current':''} ${n.id==='chatbot'&&this.net.chatbot.server.state==='processing'&&n.on?'computing':''}"><title>${esc(n.name)} · otevřít zařízení</title><circle class="node-halo" r="43"/><g class="device-icon">${icon}</g>${!n.on?'<g class="power-off"><circle cx="25" cy="-25" r="10"/><path d="m21-29 8 8m0-8-8 8"/></g>':''}<g class="node-label"><text class="device-name" text-anchor="middle" y="${below}">${esc(n.name)}</text>${subtitle?`<text class="device-subtitle" text-anchor="middle" y="${below+14}">${subtitle}</text>`:''}</g>${n.id==='laptop'?'<circle class="you-dot" cx="29" cy="-22" r="5"/>':''}</g>`;
      }).join('');
      const layer=this.svg.querySelector('#packet-layer'),visible=new Map();
      for(const p of packets.values())if(p.state==='transit'||(p.state==='lost'&&event?.packet?.id===p.id)||selectedPacket===p.id) {
        visible.set(p.id,{p,visual:p.visual||{kind:'origin',node:p.location}});
      }
      // A switch can send an extra copy to a different port while forwarding the same packet.
      if(!['complete','failure','waiting'].includes(event?.kind))for(const e of frame)if(e.kind==='hop'&&(e.discarded||e.copy))visible.set(`${e.packet.id}:${e.link}`,{p:e.packet,visual:e,copy:true});
      for(const [id,view] of this.packetViews)if(!visible.has(id)) {
        view.animation?.cancel();view.g.remove();this.packetViews.delete(id);
      }
      for(const [id,{p,visual,copy}] of visible) {
        const from=this.net.nodes[visual.from||visual.node||p.location],to=this.net.nodes[visual.to||visual.node||p.location];
        if(!from||!to)continue;
        const isHop=visual.kind==='hop';
        // A hop ends exactly where processing and the next hop begin.
        const start=visual.startProgress||0,end=visual.progress??1;
        const origin={x:from.x+(to.x-from.x)*start,y:from.y+(to.y-from.y)*start},destination={x:from.x+(to.x-from.x)*end,y:from.y+(to.y-from.y)*end};
        let view=this.packetViews.get(id);
        if(!view) {
          const g=document.createElementNS('http://www.w3.org/2000/svg','g');
          g.dataset.mapKind='packet';g.dataset.id=p.id;g.setAttribute('tabindex','0');g.setAttribute('role','button');layer.append(g);
          view={g,visual:null,animation:null};this.packetViews.set(id,view);
        }
        const {g}=view,message=Boolean(p.payload.bytes),grouped=p.payload.packetCount>1,label=p.kind.startsWith('vpn-')?`VPN ${p.vpn.direction==='out'?'→ server':'→ zařízení'}${grouped?' ×'+p.payload.packetCount:''}`:grouped?`${p.kind==='message'?'Do IG':'Matěj'} ${p.payload.index+1}–${p.payload.index+p.payload.packetCount}`:message?`${copy?'Kopie':p.connection==='replica'?'A → B':p.connection==='cloud'?(p.direction==='response'?'Cloud ↓':'Cloud ↑'):p.connection==='chatbot'?(p.direction==='response'?'Chatbot ↓':'Chatbot ↑'):p.kind==='ig-delivery'?'Matěj':'Do IG'} ${p.payload.index+1} / ${p.payload.total}`:p.kind==='ig-read'?'Přečtení':p.label;
        g.setAttribute('class',`packet ${p.direction} ${p.state==='lost'?'lost':''} ${selectedPacket===p.id?'selected':''} ${copy?'frame-copy':''} ${grouped?'packet-group':''} ${p.payload.record?'secure':''} ${p.kind.startsWith('tls-')?'tls':''} ${p.kind.startsWith('vpn-')?'vpn':''}`);
        g.setAttribute('aria-label',`${copy?'Kopie rámce · ':''}${grouped?'Prozkoumat skupinu '+p.payload.packetCount+' paketů':'Prozkoumat paket'} ${p.label}`);
        g.innerHTML=`${grouped?'<rect x="-16" y="-19" width="43" height="26" rx="7" class="group-stack"/><rect x="-20" y="-16" width="43" height="26" rx="7" class="group-stack"/>':''}<circle r="23" class="packet-hit"/><rect x="${grouped?-24:-17}" y="-13" width="${grouped?48:34}" height="26" rx="8"/><text text-anchor="middle" y="5">${p.state==='lost'?'×':grouped?'×'+p.payload.packetCount:message?p.payload.index+1:p.direction==='response'?'↩':'→'}</text><g class="packet-label" transform="translate(0,-28)"><rect x="${message?-44:-62}" y="-13" width="${message?88:124}" height="23" rx="7"/><text y="3" text-anchor="middle">${esc(label)}</text></g>`;
        if(p.kind.startsWith('vpn-'))g.innerHTML=`<circle r="30" class="packet-hit"/><rect class="vpn-shell" x="-27" y="-20" width="54" height="40" rx="10"/><rect class="vpn-inner" x="-17" y="-11" width="34" height="23" rx="5"/>${grouped?`<text text-anchor="middle" y="5">×${p.payload.packetCount}</text>`:'<path class="vpn-lock" d="M-5-3v-5a5 5 0 0 1 10 0v5M-7-3H7V8H-7Z"/>'}<g class="packet-label" transform="translate(0,-34)"><rect x="-62" y="-13" width="124" height="23" rx="7"/><text y="3" text-anchor="middle">${esc(label)}</text></g>`;
        // Keep an existing animation when a panel, labels or the viewport changes.
        if(view.visual===visual)continue;
        view.animation?.cancel();view.animation=null;view.visual=visual;
        view.destination=`translate(${destination.x},${destination.y})`;
        g.setAttribute('transform',view.destination);
        if(animate&&isHop&&!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const animation=g.animate([{transform:`translate(${origin.x}px,${origin.y}px)`},{transform:`translate(${destination.x}px,${destination.y}px)`}],{duration:Math.max(100,duration*.8),fill:'forwards',easing:'linear'});
          view.animation=animation;
          animation.onfinish=()=> {
            if(view.animation!==animation)return;
            g.setAttribute('transform',view.destination);animation.cancel();view.animation=null;
          };
        }
      }
    }
  }
  Object.assign(globalThis.InternetLab,{NetworkMap,presets,icons,esc});
})();
