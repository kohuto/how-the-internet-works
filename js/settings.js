/* Session-only availability of lessons and their displayed details. */
(() => {
  'use strict';
  const FEATURES=[
    {id:'friend',group:'areas',label:'Matějův byt',description:'Druhý notebook s vlastní domácí sítí.',regions:['friend']},
    {id:'satellite',group:'areas',label:'Chata se satelitem',description:'Notebook na chatě, anténa, satelit LEO a pozemní stanice.',regions:['cabin','satellite']},
    {id:'mobile',group:'areas',label:'Mobilní síť a BTS',description:'Dvě základnové stanice a síť mobilního operátora.',requires:['phone'],regions:['mobile']},
    {id:'cafe',group:'areas',label:'Kavárna',description:'Notebook hosta a veřejná Wi-Fi s vlastní přípojkou.',nodes:['cafe','cafe-ap','cafe-router']},
    {id:'hacker',group:'areas',label:'Hackerské doupě',description:'Počítač útočníka pro pokus s podvodným e-mailem.',requires:['mail','phishing'],regions:['hacker']},
    {id:'printer',group:'services',label:'Tiskárna',description:'Místní tisk z dokumentu na notebooku.',nodes:['printer']},
    {id:'dns',group:'services',label:'DNS server',description:'Překlad názvů webů a hledání poštovních serverů. Bez rozšíření se tento krok vynechá.',nodes:['dns']},
    {id:'tls',group:'services',label:'TLS / HTTPS',description:'Zabezpečení webu, ověření certifikátu a šifrovaný přenos. Bez rozšíření se používá HTTP.'},
    {id:'cookies',group:'services',label:'Cookies',description:'Rozpoznání prohlížeče, záznamy návštěv a cookies přihlašovacích relací.'},
    {id:'wifi',group:'services',label:'Wi-Fi v bytě na Lipové',description:'Bezdrátové připojení notebooku a telefonu.',nodes:['ap']},
    {id:'phone',group:'services',label:'Telefon',description:'Telefon s prohlížečem a dalšími zapnutými aplikacemi.',requires:['wifi'],nodes:['phone']},
    {id:'mail',group:'services',label:'Pošta Lipov',description:'Poštovní aplikace a server pro doménu posta.test.',nodes:['mail']},
    {id:'mail-b',group:'services',label:'Pošta Dopis',description:'Druhý poskytovatel pošty a Matějova schránka.',requires:['mail','friend'],regions:['mail-b']},
    {id:'instagram',group:'services',label:'Instagram',description:'Zprávy mezi tebou a Matějem přes vzdálený server.',requires:['friend'],regions:['instagram']},
    {id:'cloud',group:'services',label:'Cloud',description:'Ukládání, stahování a sdílení souborů.',regions:['cloud']},
    {id:'replica',group:'services',label:'Záložní cloud',description:'Druhé datové centrum a kopírování souborů mezi centry.',requires:['cloud'],regions:['replica']},
    {id:'vpn',group:'services',label:'VPN',description:'VPN server a volba šifrovaného tunelu v připojení.',regions:['vpn']},
    {id:'chatbot',group:'services',label:'Chatbot',description:'Dotaz a odpověď zpracovaná na vzdáleném serveru.',nodes:['chatbot']},
    {id:'phishing',group:'services',label:'Podvodný web',description:'Napodobená knihovna v samostatném hostingu.',regions:['phish']},
    {id:'mitm',group:'services',label:'Útočník v kavárně',description:'Napodobený hotspot a porovnání HTTP a HTTPS.',requires:['cafe'],nodes:['cafe-attacker']},
    {id:'shop',group:'services',label:'E-shop',description:'Ukázkový web obchod.test.',nodes:['shop']},
    {id:'news',group:'services',label:'Zprávy',description:'Ukázkový web zpravy.test.',nodes:['news']},
    {id:'ads',group:'services',label:'Reklamní partner',description:'Společná reklama dvou webů. Tento pokus používá HTTPS a zabezpečenou cookie.',requires:['shop','news','tls','cookies'],nodes:['ads']}
  ];
  const DETAILS=[
    {id:'mac',label:'MAC tabulky',description:'Naučené adresy, porty a připojené spoje switchů a přístupových bodů. Také podrobnosti spojnic.'},
    {id:'routes',label:'Směrovací tabulky',description:'Cílové sítě, rozhraní a připojené spoje routerů. Také podrobnosti spojnic.'},
    {id:'nat',label:'NAT',description:'Tabulky a záznamy překladu IP adres a portů v routerech.'},
    {id:'ttl',label:'TTL',description:'Hodnota životnosti v IP hlavičce paketu.'},
    {id:'headers',label:'IP a TCP hlavička',description:'Oddělené IP a TCP/UDP hlavičky. U TCP se místo zjednodušeného pořadí zobrazí skutečné číslo SEQ.'}
  ];
  const featureById=new Map(FEATURES.map(f=>[f.id,f]));
  class LabSettings {
    constructor({features=[],details={}}={}) {
      this.selected=new Set(features.filter(id=>featureById.has(id)));
      this.enabled=new Set(this.selected);
      for(const id of this.enabled)for(const dependency of this.dependencies(id))this.enabled.add(dependency);
      this.details=Object.fromEntries(DETAILS.map(d=>[d.id,details[d.id]===true]));
    }
    static full() {return new LabSettings({features:FEATURES.map(f=>f.id),details:Object.fromEntries(DETAILS.map(d=>[d.id,true]))});}
    toJSON() {return {features:FEATURES.filter(f=>this.selected.has(f.id)).map(f=>f.id),details:{...this.details}};}
    has(id) {return this.enabled.has(id);}
    dependencies(id) {return id==='phone'&&this.has('mobile')?[]:featureById.get(id)?.requires||[];}
    requiredBy(id) {return FEATURES.filter(f=>this.has(f.id)&&this.dependencies(f.id).includes(id));}
    toggle(id,on) {
      if(!featureById.has(id)||!on&&this.requiredBy(id).length)return this;
      const selected=new Set(this.selected);on?selected.add(id):selected.delete(id);
      return new LabSettings({features:[...selected],details:this.details});
    }
    sameNetwork(other) {return FEATURES.every(f=>this.has(f.id)===other.has(f.id));}
    nodeEnabled(node) {
      if(node.enabledBy)return !node.enabledBy.length||node.enabledBy.some(id=>this.has(id));
      if(node.id==='peer')return ['friend','instagram','replica','vpn','hacker','phishing','shop','news','ads'].some(id=>this.has(id));
      if(['partners-router','partners-switch'].includes(node.id))return ['shop','news','ads'].some(id=>this.has(id));
      const feature=FEATURES.find(f=>f.nodes?.includes(node.id)||f.regions?.includes(node.region));
      return feature?this.has(feature.id):true;
    }
  }
  Object.assign(globalThis.InternetLab,{LabSettings,LAB_FEATURES:FEATURES,LAB_DETAILS:DETAILS});
})();
