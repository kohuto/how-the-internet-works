/* Session-only availability of lessons and their displayed details. */
(() => {
  'use strict';
  const FEATURES=[
    {id:'friend',group:'areas',label:'Matějův byt',description:'Druhý notebook s vlastní domácí sítí.',regions:['friend']},
    {id:'satellite',group:'areas',label:'Chata se satelitem',description:'Notebook na chatě, anténa, satelit LEO a pozemní stanice.',regions:['cabin','satellite']},
    {id:'mobile',group:'areas',label:'Mobilní síť a BTS',description:'Dvě základnové stanice a síť mobilního operátora.',requires:['phone'],regions:['mobile']},
    {id:'mitm',group:'areas',label:'Útočník v kavárně',description:'Kavárna s notebookem hosta, veřejnou Wi-Fi a útočníkovým hotspotem. Porovnání HTTP a HTTPS.',regions:['cafe']},
    {id:'hacker',group:'areas',label:'Hackerské doupě',description:'Počítač útočníka, podvodný e-mail a server s falešnou knihovnou.',requires:['mail'],regions:['hacker','phish']},
    {id:'printer',group:'services',label:'Tiskárna',description:'Místní tisk z dokumentu na notebooku.',nodes:['printer']},
    {id:'dns',group:'services',label:'DNS server',description:'Překlad názvů webů na IP adresy. Bez rozšíření se tento krok vynechá.',nodes:['dns']},
    {id:'tls',group:'services',label:'TLS / HTTPS',description:'Zabezpečení webu, ověření certifikátu a šifrovaný přenos. Bez rozšíření se používá HTTP.'},
    {id:'cookies',group:'services',label:'Cookies',description:'Rozpoznání prohlížeče, záznamy návštěv a cookies přihlašovacích relací.'},
    {id:'wifi',group:'services',label:'Wi-Fi v domácnostech',description:'Bezdrátové připojení na Lipové, u Matěje a na chatě. Platí pro zapnuté domácnosti.',nodes:['ap','friend-ap','cabin-ap']},
    {id:'connection-timing',group:'services',label:'Šířka pásma a Latence',description:'Volby šířky pásma a latence v aplikaci Připojení na počítačích a telefonu. Umožní porovnat rozestupy paketů a zdržení přenosu.'},
    {id:'phone',group:'services',label:'Telefon',description:'Telefon s prohlížečem a dalšími zapnutými aplikacemi.',requires:['wifi'],nodes:['phone']},
    {id:'mail',group:'services',label:'E-mail',description:'Společná poštovní služba pro tebe a Matěje. Odesílání zpráv a schránky uložené na serveru.',requires:['friend'],nodes:['mail']},
    {id:'instagram',group:'services',label:'Instagram',description:'Zprávy mezi tebou a Matějem přes vzdálený server.',requires:['friend'],regions:['instagram']},
    {id:'cloud',group:'services',label:'Cloud',description:'Ukládání, stahování a sdílení souborů. Hlavní i záložní datové centrum a kopírování mezi nimi.',regions:['cloud','replica']},
    {id:'vpn',group:'services',label:'VPN',description:'Samostatná aplikace VPN pro zapnutí šifrovaného tunelu a VPN server.',regions:['vpn']},
    {id:'chatbot',group:'services',label:'Chatbot',description:'Dotaz a odpověď zpracovaná na vzdáleném serveru.',nodes:['chatbot']},
    {id:'ads',group:'services',label:'Personalizovaná reklama',description:'E-shop a Zprávy se společným reklamním serverem. Ukáže, jak prohlížení na jednom webu ovlivní reklamu na druhém.',requires:['tls','cookies'],nodes:['shop','news','ads']}
  ];
  const DETAILS=[
    {id:'devices',label:'Routery a switche',description:'Rozliší chytré křižovatky na routery a switche a zobrazí jejich původní názvy a ikony.'},
    {id:'mac',label:'MAC tabulky',description:'Naučené adresy, rozhodování, porty a připojené spoje switchů a přístupových bodů. Také podrobnosti spojnic.'},
    {id:'frames',label:'Ethernetové a Wi-Fi rámce',description:'Rozbalovací obal paketu se zdrojovou a cílovou MAC adresou v detailu paketu.'},
    {id:'routes',label:'Směrovací tabulky',description:'Cílové sítě, rozhodování, rozhraní a připojené spoje routerů. Také podrobnosti spojnic.'},
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
      if(['ap','friend-ap','cabin-ap'].includes(node.id)&&!this.has('wifi'))return false;
      if(node.enabledBy)return !node.enabledBy.length||node.enabledBy.some(id=>this.has(id));
      if(node.id==='peer')return ['friend','instagram','cloud','vpn','hacker','ads'].some(id=>this.has(id));
      if(['partners-router','partners-switch'].includes(node.id))return this.has('ads');
      const feature=FEATURES.find(f=>f.nodes?.includes(node.id)||f.regions?.includes(node.region));
      return feature?this.has(feature.id):true;
    }
  }
  Object.assign(globalThis.InternetLab,{LabSettings,LAB_FEATURES:FEATURES,LAB_DETAILS:DETAILS});
})();
