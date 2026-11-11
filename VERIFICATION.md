# Záznam ověření

Poslední ověření 11. listopadu 2026. Použité podmínky: lokální statické HTTP, prohlížeč v náhledu Codex a Node.js pro testy samotného modelu. Aplikace pro používání Node.js nepotřebuje.

## Kavárna a MITM 11. listopadu 2026

Přibyly čtyři uzly a pět spojů: notebook hosta, útočníkův notebook plnící také roli AP/mostu, běžný přístupový bod a router kavárny s vlastním NAT a přípojkou do C. Celkem **53 zařízení a 59 spojů**. Host má oddělený Prohlížeč, Poštu a Připojení; útočník vlastní aplikaci MITM. Vše se otevírá v monitorech nad mapou. Knihovna a další dosavadní služby se používají ve společném modelu.

Ověřeno skutečným ovládáním místního náhledu:

- Kavárna zobrazila oba notebooky, AP a router, běžnou Wi-Fi a neaktivní napodobenou cestu. Zapnutí hotspotu a samostatné připojení hosta změnilo cestu přes útočníka, oba úseky se barevně zvýraznily. Nový přenos měl na útočníkovi samostatný krok MITM, pak pokračoval běžným přemosťováním.
- V režimu Změnit HTTP stránku dorazil do notebooku nadpis „Tento obsah změnil útočník v kavárně.“. Původní obsah serveru zůstal stejný. Přehled útočníka zaznamenal požadavky i odpovědi včetně původního a změněného HTTP obsahu. V režimu stejného HTTP zásahu dorazila následující HTTPS stránka s původním nadpisem „Dnes otevřeno do 16 hodin“; přehled měl místo jejího obsahu chráněné TLS záznamy.
- Podstrčit certifikát ukončilo HTTPS po návratu handshake chybou ověření certifikátu; prohlížeč žádný formulář neodeslal. Poškodit HTTPS data dokončilo ověření legitimního certifikátu, ale změněný chráněný požadavek skončil chybou integrity. Dřívější stránka zůstala zachovaná a rozhraní ji označilo jako starší obsah.
- Opravené nastavení kavárenské Wi-Fi otevřelo obě nabídky Kavarna_hoste, vybraný hotspot, IP `192.168.50.10`, vlastní NAT `192.0.2.69` a přepínač VPN. Zapnutí VPN a HTTP přenos přes napodobenou Wi-Fi zobrazily původní stránku. Útočník viděl pouze vnější pakety VPN, nikoli vnitřní DNS či HTTP.
- Otevření VPN paketu přímo v kroku MITM zobrazilo nad mapou vnější IP `192.168.50.10 → 192.0.2.130`, UDP `54015 → 51820`, uzamčený původní paket a vysvětlení tunelu. Krokování bylo po dobu otevření neaktivní. Návrat do monitoru umožnil dokončit stejný přenos. Také detail běžného DNS paketu ukázal záznam průchodu útočníkovým hotspotem a pozastavil krokování.
- Rozložení MITM přehledu ověřeno na 390 × 844 px (330 px obsahu bez přetečení) a 320 × 568 px (260 px obsahu bez přetečení). Nastavení Wi-Fi mělo na 320 px také obsah 260 px; dokument zůstal přesně 320 px široký a obsah se posouval uvnitř monitorů. Dočasné rozměry byly vráceny. Závěrečná kontrola konzole bez chyb a varování; kontrolní karta zavřena.

**153 automatických testů úspěšných:** předchozích 139 a 14 nových v tests/mitm.test.mjs. Ověřují vlastní LAN/NAT a přesnou cestu, oba směry bez nadbytečného IP skoku, nulový odposlech bez připojení hosta včetně odhozených kopií rámců, okamžik změny HTTP a doručení, zachycení formuláře/cookies, neporušené HTTPS při HTTP zásahu, odmítnutí falešného certifikátu před odesláním dat, odhalení změny ciphertextu, VPN ve všech režimech, výpadky bez automatického přepnutí, ostatní domácnosti, přepnutí Wi-Fi během přenosu, zachování cookies, ztrátu po zachycení, opakování a mez 20 záznamů i návaznost Pošty/phishingu na nového klienta. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Evil twin, síťové rozhraní notebooku útočníka a volba cesty jsou připravený lokální model. Nepoužívá rádio, skutečné sítě, reálné útoky na Wi-Fi ani ARP spoofing. HTTP se mění jen pevným nadpisem. Certifikát je modelová nabídka jiného, nedůvěryhodného TLS protějška; úplné dvě TLS relace se nesimulují. Útočník nevolá dešifrování cizího TLS/VPN obsahu. Veřejná část ClientHello/DNS a chráněné záznamy jsou v přehledu odlišené. Obsah čitelný v přehledu serveru či koncového prohlížeče nepředstavuje úspěšné dešifrování u útočníka. Přehled je historie konkrétních pokusů, ne živý pohled do všech zařízení.

Syntaxe třinácti skriptů a relativní prostředky ověřeny. Cache `v=32`; přenosný ZIP aktualizován a porovnán se zdroji.

Snímky: [kavárna a skutečná cesta](docs/mitm-cafe.jpg), [změněná HTTP stránka](docs/mitm-http.jpg), [odmítnutí certifikátu](docs/mitm-certificate.jpg), [přehled VPN](docs/mitm-vpn.jpg), [VPN paket nad mapou](docs/mitm-vpn-packet.jpg), [zachycený DNS paket](docs/mitm-packet.jpg), [mobilní přehled](docs/mitm-mobile.jpg), [nastavení na 320 px](docs/mitm-settings-mobile.jpg).

## Phishingové doupě a Pošta 9. listopadu 2026

Přibylo sedm zařízení a sedm spojů: kabelový počítač útočníka, jeho switch a router s vlastní LAN/NAT; samostatný cizí hosting s routerem, switchem a podvodným webem; poštovní server v původním hostingu. Celkem **49 zařízení a 54 spojů**. Přepínač Doupě otevře novou lokalitu. Počítač má aplikace Phishing a Připojení; všechny čtyři běžné klientské přístroje mají Poštu. Původní odstraněné části rozhraní se nevrátily.

Ověřeno skutečným ovládáním místního náhledu:

- Doupě → Počítač útočníka → Phishing nabídlo čtyři příjemce a pevnou ukázku e-mailu. Odeslání na notebook prošlo 34 ručními kroky do potvrzení uložení na serveru. Pošta notebooku samostatně načetla schránku dalšími 34 kroky; otevřený e-mail ukázal skutečného odesílatele a cílovou adresu odkazu.
- Kliknutí na odkaz provedlo DNS, TLS a načtení falešného webu `knihovna-podpora.test`. Prohlížeč ukázal certifikát ověřený právě pro tuto doménu. Stránka měla neupravitelné ukázkové jméno a heslo. Samotné otevření zobrazilo vysvětlení, že přihlášení neodeslalo.
- Odeslání ukázkového formuláře dokončilo nový HTTPS přenos. Výsledek vysvětlil přijetí na podvodném serveru. Po otevření počítače útočníka stále nebyla přijata žádná odpověď se záznamy. Teprve Načíst záznamy ze serveru a 26 kroků doručilo jednu kopii přihlášení se skutečně pozorovanou IP notebooku po NAT `192.0.2.1` a údajem HTTPS / dešifrováno na serveru.
- Po obnovení finální verze byl e-mail doručen na telefon přes mobilní data. Jeho HTTP návštěva a formulář dorazily na podvodný server; výsledek výslovně popsal čitelný HTTP přenos. Útočník po novém načtení viděl zdroj `198.51.100.10` a HTTP. Aplikace Phishing měla také na 320 px šířku obsahu 260 px bez přetečení.
- Označit jako phishing v Poště zobrazilo potvrzení a deaktivovalo tlačítko odkazu. Po odeslání a načtení nového e-mailu šel nový samostatný pokus opět otevřít. Poštovní server zobrazil uložený e-mail jen ve správné schránce, ostatní byly prázdné.
- Detail nového paketu se otevřel nad mapou, ukázal IP `192.168.40.10 → 203.0.113.40`, TCP `51005 → 443`, neprůhledný model TLS a výslovné vysvětlení připraveného API. Krokování bylo při otevřeném detailu neaktivní; návrat do monitoru umožnil dokončit stejný přenos.
- Na 390 × 844 px měla Pošta obsah široký 330 px bez vodorovného přetečení. Na 320 × 568 px měla Pošta i podvodný formulář 260 px bez přetečení, dokument měl přesně 320 px. Dlouhé adresy se zalamovaly a obsah se posouval uvnitř monitoru. Konzole bez chyb a varování. Dočasné rozměry vráceny; kontrolní karta zavřena.

**139 automatických testů úspěšných:** předchozích 125 a 14 nových pro phishing. Nové kontroly ověřují LAN/NAT a role, okamžik uložení na server a doručení klientovi, offline schránku a nezávislost útočníkova počítače, prázdný výsledek pouhého GET, vlastní platný certifikát falešné domény, POST a samostatné načtení záznamů, blokování a nový pokus, oddělení cookies, kabel/Wi-Fi/data/satelit/VPN, nezávislé výpadky, opakování ztraceného potvrzení bez dvojího uložení zprávy či přihlášení, poškození TLS a certifikátu, změnu přístupu, čitelnost HTTP oproti HTTPS a vymezení adres na dva modelové weby. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Poštovní i správcovské API používá připravený model TLS nad TCP/443, bez animace handshake, SMTP/IMAP nebo skutečného přihlašování. Webové návštěvy používají stávající DNS/TLS tok. Schránka drží poslední e-mail; útočníkův klient přijme nejvýše čtyři poslední záznamy a celkový počet. Správcovský pohled je výslovně označen. Blokování je místní stav scénáře; neodvolává již přijaté údaje. Vše je lokální model s pevnými fiktivními údaji. Žádné skutečné e-maily, hesla nebo síťové služby se nepoužívají. Další útoky tato změna neimplementuje.

Syntaxe jedenácti skriptů a relativní prostředky ověřeny. Cache `v=31`; přenosný ZIP aktualizován a porovnán se zdroji.

Snímky: [doupě v mapě](docs/phishing-map.jpg), [aplikace útočníka](docs/phishing-lair.jpg), [Pošta](docs/phishing-mail.jpg), [falešný formulář](docs/phishing-https.jpg), [načtené záznamy](docs/phishing-results.jpg), [detail paketu](docs/phishing-packet.jpg), [Pošta na malé obrazovce](docs/phishing-mobile.jpg), [formulář na 320 px](docs/phishing-form-mobile.jpg).

## Cookies knihovny 9. listopadu 2026

Každý ze tří notebooků i telefon má vlastní prohlížeč a úložiště cookies. Matějovi přibyla aplikace Prohlížeč s oddělenou adresou, DNS a stránkou. První odpověď knihovny předává skutečnou modelovou Set-Cookie, další požadavek vrací Cookie. Uložení se provede až po doručení a případném ověření/dešifrování TLS. Server počítá GET načtení a všechny GET/POST požadavky pouze podle přijatého identifikátoru. Výpadek odpovědi může zachovat serverový záznam, aniž by klient dostal cookie.

Ověřeno skutečným ovládáním místního náhledu:

- První HTTP načtení na notebooku uložilo v1 až z odpovědi; druhé odeslalo `Cookie: navstevnik=v1`. Stránka ukázala Vítej zpět a počet načtení 2. Panel Cookies ukázal hodnotu, web/cestu, zbývající platnost 60 modelových minut, HttpOnly/SameSite a skutečné poslední hlavičky.
- Odkaz z prohlížeče otevřel správné okno webového serveru. Jeho řádek v1 měl 2 načtení/2 požadavky a pozorovanou WAN IP `192.0.2.1`. Změna Secure přepínače ponechala historickou Set-Cookie beze změny; novou nastavil až další serverový přenos.
- Po dokončeném HTTPS přenosu se v1 uložila se Secure. Následující HTTP ji neodeslal a přijímanou Set-Cookie se Secure prohlížeč odmítl. Původní Secure v1 zůstala uložená. Čitelný panel je výslovně označen jako pohled koncového prohlížeče.
- Na Matějově ploše otevřen nový samostatný Prohlížeč a dokončen HTTP přenos. Smazat cookies odstranilo v1 jen z jeho úložiště. Další načtení vytvořilo v2 a počet 1; další vrátilo v2 a počet 2. Detail HTTP odpovědi skutečně zvýraznil Set-Cookie. V serveru zůstaly oba záznamy: v1 s jedním a v2 se dvěma načteními, oba s WAN IP Matějova routeru `192.0.2.26`.
- Posunout čas o 1 hodinu vyprázdnilo prošlé úložiště. Oba serverové řádky přetrvaly. Přepínač povolení cookies fungoval také na telefonu.
- Rozložení ověřeno na výchozích 1280 × 720 a při 390 × 844 a 320 × 568 px. Notebook měl na 390 px obsah široký 330 px bez přetečení, na 320 px 260 px; telefon na 320 px 252 px. Serverové okno na 320 px mělo obsah 284 px bez přetečení. Dokument měl přesně šířku displeje, delší hlavičky se zalamují a obsah se posouvá uvnitř oken. Dočasné rozměry byly vráceny, kontrolní karta zavřena. Konzole bez chyb a varování.

**125 automatických testů úspěšných:** předchozích 112 a 13 nových pro cookies. Pokrývají doručení před uložením, první a druhé načtení, správný obsah hlaviček bez atributů v požadavku, čtyři oddělené prohlížeče včetně sdílené WAN, smazání bez zásahu do serveru, zákaz přijímání/odesílání, obnovení povolení, Secure a ochranu proti HTTP přepsání, příznak až po nové odpovědi, sdílené modelové hodiny a obnovení platnosti, změny kabel/Wi-Fi/data/VPN bez ztráty identity, ztrátu požadavku/odpovědi, chybný certifikát/integritu, HTTP/HTTPS/VPN viditelnost, vymezení hosta/cesty a odlišné počítání GET/POST. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Podporována je jediná cookie prvé strany knihovny. Třetí strany, přihlášení a API webového JavaScriptu nejsou součástí pokusu. Hodiny platnosti jsou ruční; úplné obnovení aplikace obnoví vše do výchozího stavu. Žádné skutečné cookies, přihlášení ani síťové služby se nepoužívají. Syntaxe devíti skriptů a relativní prostředky ověřeny. Cache `v=30`; přenosný ZIP aktualizován a porovnán se zdroji.

Snímky: [úložiště prohlížeče](docs/cookies-browser.jpg), [serverový záznam](docs/cookies-server.jpg), [detail Set-Cookie](docs/cookies-packet.jpg), [návrat prohlížeče](docs/cookies-return.jpg), [ovládání na telefonu](docs/cookies-mobile.jpg).

## Satelitní připojení chaty 9. listopadu 2026

Přibylo sedm zařízení a osm spojů: notebook na chatě, switch, Wi-Fi AP, router s NAT, satelitní terminál, jeden schematický LEO satelit a pozemní brána připojená do B. Celkem **42 zařízení a 47 spojů**. Pohled Satelit ukazuje cestu z chaty přes oba rádiové úseky do internetu. Satelitní přípojka patří routeru, Wi-Fi/kabel zůstávají místní volbou notebooku. Všechna informační okna fungují nad mapou.

Ověřeno skutečným ovládáním místního náhledu:

- Notebook na chatě otevřel vlastní plochu a Připojení s Wi-Fi Chata, IP `192.168.30.11`, WAN přes NAT `192.0.2.53`, odkazy na router/anténu a nezávislou VPN.
- HTTP požadavek včetně předchozího DNS prošel oběma rádiovými úseky a v prohlížeči se po návratu zobrazil správný obsah. Let rádia postupuje po třetinách stejné spojnice. Otevřený paket ukázal NAT `192.168.30.11:53000 → 192.0.2.53:40000` a přenosový kanál bez ethernetových MAC; krokování bylo po dobu prohlížení neaktivní.
- Zakrytí výhledu v okně antény označilo satelitní cestu jako přerušenou. Nové načtení webu skutečně selhalo. Lokální Wi-Fi se nepřepínala na jiné připojení.
- Z nového notebooku nahrán Soubor Satelitní deník.txt: po doručení celé odpovědi se objevilo potvrzení 201 a soukromý soubor. Obnovit seznam přeneslo katalog zpět a nabídlo jeho sdílení s Matějem. Místní soubor zůstává samostatný.
- Odeslání obrázku vytvořilo 72 datových paketů ve skupinách po nejvýše 10. V mapě byly současně pakety u notebooku, switche, routeru, na rádiovém spoji, na satelitu a u pozemní stanice; počítadlo odpovídalo odeslaným 60 / 72. Otevření skupiny zobrazilo správné členy a zastavilo přenos.
- Rozložení ověřeno na výchozím náhledu 1280 × 720 a při 390 × 844 a 320 × 568 px. Na 390 px měl detail antény 354 px bez vodorovného přetečení; na 320 px měl 284 px. Notebook na 320 px měl obsah 260 px bez přetečení. Dokument zůstal přesně 390/320 px široký a delší obsah se posouvá uvnitř oken. Dočasné rozměry byly vráceny. Konzole bez chyb a varování.

**112 automatických testů úspěšných**: původních 102 a deset nových pro satelit. Ověřují oddělenou LAN, veřejnou WAN a NAT, přesnou obousměrnou cestu DNS/HTTP, tři fáze letu a zachování hlaviček/TTL na přenosové části, HTTPS s VPN i bez ní, cloudové soubory a ACL, souběžné zprávy a vratné potvrzení přečtení, výpočet chatbota na serveru, přechod na kabel po výpadku AP, všechny klíčové výpadky a obnovu, nezávislost původní domácnosti a ztrátu při zakrytí během letu. Příkaz `node --test --test-concurrency=1 tests/*.test.mjs`.

Satelit je úmyslně pevný; orbitalita, handover, GEO, laserové spoje a skutečné časové či rádiové parametry se nemodelují. Tři kroky letu jsou názorná animace, ne údaj o latenci. Detaily a README toto zjednodušení uvádějí. Syntaxe devíti skriptů a relativní prostředky ověřeny; cache `v=29`. Přenosný ZIP aktualizován a porovnán se zdroji.

Snímky: [satelitní mapa se souběžnými pakety](docs/satellite-map.jpg), [anténa](docs/satellite-antenna.jpg), [anténa na telefonu](docs/satellite-antenna-mobile.jpg), [notebook na 320 px](docs/satellite-settings-mobile.jpg), [detail skupiny](docs/satellite-packet.jpg).

## VPN a paket uvnitř paketu 9. listopadu 2026

Připojení obou notebooků a telefonu má nezávislý přepínač VPN. Internetový provoz včetně DNS se zapouzdří, zatímco místní tisk jde přímo po LAN. Nové centrum VPN má router, switch a server `192.0.2.130/27`, přípojku k E přes `192.0.2.48/30` a vlastní síť `192.0.2.128/27`. Topologie má nyní **35 zařízení a 39 spojů**. Přibyl pohled mapy VPN; celkový pohled i Centra zahrnují novou lokalitu. Šifrované obaly mají větší fialovou značku se skrytým paketem uvnitř, jejich projeté spoje se zvýrazní. Nejde o novou fyzickou linku.

Původní paket včetně vnitřních IP a obsahu uchovává oddělený model konců tunelu. Vnější paket nese neprůhledný záznam a směruje se běžnou sítí přes UDP/51820. Domácí NAT překládá jen vnější obal. VPN server ho ověří, rozbalí a předá původní paket přes vlastní výstupní NAT; služby tedy pozorují jeho veřejnou IP. Pro návrat je nutný správný záznam a platný tunel klienta. HTTPS zůstává po rozbalení VPN chráněné TLS, HTTP je na zbývající cestě čitelné. Vnější a vnitřní hlavičky/TTL se nepletou; historie obalu zůstává dostupná po rozbalení.

Ověřeno skutečným ovládáním prohlížeče:

- VPN zapnuta nad kabelovým připojením notebooku. Rozhraní zachovalo fyzické připojení a ukázalo virtuální IP `10.8.0.10` a výstupní IP `192.0.2.130`. Přepínač je samostatný, mimo volbu Kabel/Wi-Fi/Data.
- První DNS přenos byl vnější UDP paket `192.168.10.10:54010 → 192.0.2.130:51820`, TTL 64. Jeho detail ukázal vnější obal a zamčený původní IP paket bez domény či aplikačních dat. Otevření zastavilo krokování, Escape ho znovu umožnilo.
- Obal projel osmi skutečnými spoji ke VPN serveru; tyto úseky byly zvýrazněné. V pohledu VPN se paket překrýval se středem serveru a při rozbalení zůstal na stejném místě.
- HTTP formulář „Vzkaz uvnitř VPN: vrátím knihu v pátek.“ nebyl v tunelu čitelný. Po rozbalení se stejný paket zobrazil jako `POST /vzkaz` s 43 B UTF-8 dat, přesným textem a poznámkou o odstranění VPN obalu. Webový server zaznamenal zdroj `192.0.2.130:55001`. Okno VPN serveru ukázalo čitelnou HTTP odpověď, klienta a oddělené NAT vazby pro DNS a HTTP.
- Telefon zapnul VPN nad mobilními daty. HTTPS navázalo TLS přes VPN; po sejmutí VPN obalu u požadavku zůstal TLS obsah chráněný a detail to výslovně uvedl. Dokončený přenos zobrazil stránku na telefonu.
- Při novém pokusu byl VPN server vypnut. Internetový přenos selhal bez přechodu na přímý HTTP. Následující místní tisk z notebooku se zapnutou VPN při stále vypnutém VPN serveru uspěl.
- Rozložení zkontrolováno při 1280 × 900, 390 × 844 a 320 × 568 px. Na 320 px měl obsah telefonu 252 px bez přetečení; dokument měl přesně 320 px. Okno chráněného vnějšího paketu i vnitřního HTTPS mělo obsah 284 px bez přetečení. Nastavení, tabulky a delší detaily se posouvají uvnitř oken. Konzole bez chyb a varování.

Všech **102 automatických testů** úspěšných: předchozích 90 a 12 nových pro VPN. Ověřují oddělení VPN od přístupu, skrytý DNS/HTTP a čitelný HTTP za výstupem, dvě vrstvy NAT, zachování HTTPS, Wi-Fi/data a druhou domácnost, místní tisk při výpadku VPN, nepřítomnost přímé náhradní cesty, ztrátu NAT vazeb, přepnutí přístupu/VPN, poškozený obal, skupiny obrázku se správnými bajty a počítadly, potvrzení přečtení, cloud a odložené doručení Instagramu při offline odesílateli. Syntaxe devíti skriptů a relativní prostředky ověřeny. Cache verze `v=28`. Přenosný ZIP aktualizován a porovnán se zdroji.

Omezení: VPN i TLS jsou výukové modely, nikoliv skutečná kryptografie. VPN má připravené klíče/účastníky, nevykonává skutečný handshake WireGuardu, obnovování klíčů, keepalive nebo ochranu proti replay. Ověření neprůhledného záznamu je modelové. Fialové zvýraznění ukazuje prošlé úseky tunelu v aktuálním pokusu. Detail v tunelu neodhaluje původní IP/obsah; správcovský pohled VPN serveru ukazuje data až na konci tunelu. Počty mediálních skupin zůstávají zhuštěné. Přenosy i celé VPN centrum běží pouze uvnitř prohlížeče.

Snímky: [nastavení VPN](docs/vpn-settings.jpg), [paket uvnitř paketu](docs/vpn-envelope.jpg), [VPN centrum](docs/vpn-map.jpg), [HTTP po výstupu z VPN](docs/vpn-http-exit.jpg), [VPN server](docs/vpn-server.jpg), [nastavení telefonu](docs/vpn-mobile-settings.jpg), [HTTPS za VPN na telefonu](docs/vpn-https-mobile.jpg), [prohlížeč telefonu](docs/vpn-mobile-browser.jpg), [vnější paket na malém displeji](docs/vpn-envelope-mobile.jpg).

## HTTP a HTTPS 9. listopadu 2026

Prohlížeč notebooku a telefonu nabízí stejnou knihovnu přes HTTP i HTTPS. Přepínače načtou `http://knihovna.test` / `https://knihovna.test` ze stejného serveru `203.0.113.10`. Stránka obsahuje formulář Vzkaz knihovně do 160 znaků, zpracovaný serverem po doručení. HTTP používá TCP/80, modelový HTTPS TLS nad TCP/443. Zobrazení načteného obsahu, rozepsaný vzkaz, přijaté potvrzení a DNS cache jsou oddělené pro notebook a telefon.

TLS má samostatné síťové a koncové události: ClientHello, serverovou odpověď s veřejným ServerHello a chráněnou částí certifikátu, ověření domény/platnosti/důvěryhodnosti, klientské dokončení, šifrování požadavku, dešifrování a zpracování na serveru, šifrování odpovědi a dešifrování v prohlížeči. Chráněné záznamy v paketech neobsahují původní text; koncová data zůstávají v odděleném interním modelu. Změněný záznam neprojde kontrolou integrity. Směrovací IP a porty zůstávají viditelné a fungují s NAT. Běžný DNS a SNI jsou v modelu čitelné. Server má nastavitelný platný, prošlý, cizí nebo nedůvěryhodný certifikát. Certifikát se kontroluje před odesláním aplikačního požadavku.

Ověřeno skutečným ovládáním prohlížeče:

- HTTP načetlo stránku „Dnes otevřeno do 16 hodin“. Formulář s textem „Ahoj, prosím o prodloužení výpůjčky. 🙂“ o 47 UTF-8 B vytvořil čitelný `POST /vzkaz`, hlavičky a přesný text v detailu paketu. Potvrzení se zobrazilo až po návratu odpovědi.
- HTTPS zobrazilo stejnou stránku a zachovalo rozepsaný formulář. Během navazování se změnil stav na ověřování certifikátu a dokončení TLS. Požadavek s totožným vzkazem ukázal TCP `51000 → 443`, SEQ, nezakryté IP a 164 B modelových chráněných dat; text vzkazu se v detailu nikde nevyskytoval. Detail pozastavil krokování, zavření jej opět zpřístupnilo.
- Webový server po dešifrování ukázal přesný `POST /vzkaz` a jeho text. To odděluje pohled na přenos od čitelného obsahu na jeho koncích.
- Změna certifikátu na Platnost vypršela zastavila nové HTTPS načtení. Rozhraní vysvětlilo neplatný certifikát a předchozí obsah zřetelně označilo jako dříve načtený. Neobjevilo se potvrzení nové operace.
- Telefon načetl HTTPS přes mobilní data/BTS. Odeslal „Vzkaz z telefonu přes mobilní data.“ a obdržel přesné potvrzení přes HTTPS.
- Rozložení kontrolováno při 1280 × 900, 390 × 844 a 320 × 568 px. Obsah telefonu měl při 390 px šířku 322 px a při 320 px 252 px bez vodorovného přetečení. Dokument měl přesně šířku displeje. Okno chráněného paketu na 320 px mělo 286 px, obsah 284 px bez přetečení. Formulář a delší detaily se posouvají uvnitř okna. Konzole bez chyb a varování.

Všech **90 automatických testů** úspěšných: předchozích 78 a 12 nových webových. Nové kontroly pokrývají shodný obsah HTTP/HTTPS, návaznost TLS před aplikačními daty, viditelnost DNS/SNI a chráněné tělo, skutečné předání formuláře a pozdní zobrazení odpovědi, tři vadné certifikáty, změněný požadavek/odpověď/serverový handshake, NAT a SEQ, ztracený návratový záznam, Wi-Fi/data, změnu připojení, snímek serverového obsahu, omezené adresy, sdílenou DNS cache a vícebajtový UTF-8. Syntaxe osmi skriptů a relativní prostředky ověřeny. Cache verze `v=27`. Přenosný ZIP aktualizován a obsah porovnán se zdroji.

Omezení: nejde o skutečnou kryptografii nebo úplnou implementaci TLS 1.3. Neprůhledné deterministické bajty a oddělený model koncových dat názorně představují šifrování, dešifrování a integritu; formulář nikam mimo prohlížeč neodchází. Handshake slučuje několik zpráv, nepočítá skutečné certifikační řetězce, klíče ani přesnou TLS režii. TCP handshake/ACK, obnovení TLS, HTTP/2, HTTP/3/QUIC, ECH, HSTS a šifrované DNS nejsou součástí této etapy. Princip chráněných zpráv po ServerHello byl ověřen podle [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html).

Snímky: [prohlížeč s HTTPS](docs/https-browser.jpg), [čitelný HTTP vzkaz](docs/http-packet.jpg), [chráněný HTTPS vzkaz](docs/https-packet.jpg), [chybný certifikát](docs/https-certificate.jpg), [HTTPS na telefonu](docs/https-mobile.jpg), [detail na malém displeji](docs/https-mobile-packet.jpg).

## Chatbot a vzdálený výpočet 9. listopadu 2026

V obou noteboocích a telefonu je aplikace Chatbot. Přijímá libovolný neprázdný text do 4 000 znaků, zachovává vlastní historii a rozepsaný dotaz pro každé zařízení. V hostingu přibyl samostatný server `203.0.113.30/26` a spoj do portu p4 switche hostingu; topologie má nyní **32 zařízení a 36 spojů**. Dotaz a pevná odpověď se skutečně přenášejí po modelové síti v UTF-8 segmentech nejvýše 1 400 B. Server začne počítat až po složení všech bajtů dotazu, provede tři oddělené kroky a teprve potom vytvoří odpověď. Klient odpověď zobrazí až po dokončení návratového přenosu. Server používá pozorovanou adresu a port požadavku, takže návrat funguje přes NAT.

Ověřeno skutečným ovládáním prohlížeče:

- Z notebooku odeslán dotaz „Proč se střídá den a noc? 🙂“ o 34 B. Ve fázi zpracování 1/3 aplikace čekala bez odpovědi. Server byl zvýrazněný v mapě; jeho okno ukazovalo celý přijatý dotaz, správné zařízení a zatím 0 dokončených výpočtů. Odpověď se objevila až po návratu paketů.
- Dotaz „Kolik je 2 + 2?“ vytvořil další konverzační tah a dostal přesně stejnou odpověď. Detail paketu ukázal cílovou IP `203.0.113.30`, porty `51004 → 443`, SEQ 1001, 15 B aplikačních dat a vysvětlení vzdáleného zpracování. Při otevřeném detailu bylo krokování pozastavené, po Escape šlo pokračovat.
- Z Matějova notebooku odeslán dotaz z druhé domácnosti. Vypnutí serveru při zpracování způsobilo chybu bez odpovědi; okno serveru uvedlo přerušení. Po zapnutí a opakování se odpověď doručila, předchozí chybný pokus zůstal v historii.
- Z telefonu odeslán dotaz přes mobilní data. Odpověď dorazila a zobrazila se jen v jeho samostatné konverzaci.
- Rozložení ověřeno při 1280 × 800, 390 × 844 a 320 × 568 px. Na 390 px měl obsah telefonu šířku 322 px bez přetečení, na 320 px 252 px; obsah notebooku na 320 px měl 260 px bez přetečení a hlavní panel 272 px bez přetečení. Dokument měl vždy šířku displeje. Všechny aplikace včetně Chatbota byly dostupné na hlavním panelu i na ploše. Delší konverzace a formulář se posouvají uvnitř monitoru.
- Text `<b>Ahoj</b> & 🙂` se zobrazil doslovně bez vytvoření HTML elementu. Po obnovení aktuální verze nebyly v konzoli chyby ani varování.

Všech **78 automatických testů** úspěšných: původních 69 a 9 nových pro chatbot. Nové kontroly ověřují oddělení přijetí/výpočtu/odpovědi, stále shodnou odpověď pro různé dotazy a zařízení, dlouhý UTF-8 dotaz s obráceným pořadím příchodu segmentů, NAT obou domácností, Wi-Fi/mobilní přístupy, nedostupnost klienta/serveru/hostingu, vypnutí během výpočtu, ztracený návratový záznam NAT, opakování a změnu připojení při výpočtu. Syntaxe sedmi skriptů a relativní prostředky ověřeny. Cache verze `v=26`. Přenosný ZIP aktualizován a jeho obsah porovnán se zdrojovými soubory.

Omezení: jde o lokální model serverové aplikace s pevnou odpovědí, nikoliv skutečné AI nebo vzdálenou službu. Tři kroky výpočtu nejsou měřením výkonu. DNS adresa služby je připravená, TLS, tokenové streamování, HTTP protokol a úplný TCP handshake se nesimulují. Žádný dotaz neopouští prohlížeč; historie se neukládá mezi načteními aplikace.

Snímky: [konverzace v notebooku](docs/chatbot-desktop.jpg), [zpracování na serveru](docs/chatbot-server.jpg), [telefon](docs/chatbot-mobile.jpg).

## Text, obrázek a video 9. listopadu 2026

Instagram na notebooku a telefonu nabízí Text / Obrázek / Video, velikost a počet datových paketů, náhled, rozdělení do značek a počítadla obou spojení. Text se měří podle skutečných UTF-8 bajtů, obrázek má modelově 100 000 B a video 5 000 000 B. Obě spojení nyní používají 1 400 B dat na paket: výchozí text 363 B tvoří 1 paket, obrázek 72 a video 3 572. Toto nahrazuje dřívější výukové velikosti 112/144 B. Původní testy segmentace a souběhu proto používají delší textové vstupy; zachovávají kontrolu skutečného dělení a bajtového pořadí.

Malé přenosy se zobrazují jednotlivě, obrázek v 8 skupinách nejvýše 10 paketů a video ve 36 skupinách nejvýše 100. Poslední skupina se zkrátí na skutečný počet. Skupina je výslovně označené zhuštění animačních a síťových událostí; nepředstavuje jeden velký IP paket. Všechny modelové bajty se skutečně uchovají a znovu složí. Kliknutí na skupinu pozastaví přenos, nabídne rozbalení a jednotlivé pakety se správnou délkou, rozsahem bajtů, TCP SEQ, NAT a společnou modelovou polohou. NAT započítává všechny reprezentované pakety. Náhled a přehrávač se u příjemce zpřístupní až po úplném doručení. Čekání na offline příjemce, opakování a potvrzení přečtení fungují i s přílohami.

Ověřeno skutečným ovládáním prohlížeče:

- Přepínání typů zachovalo rozepsaný text Ahoj Matěji s emoji. Velikost se aktualizovala na 17 B a 1 paket. Volby ukazovaly obrázek 100 kB / 72 a video 5 MB / 3 572 paketů, stejný limit 1 400 B a explicitní velikost skupin.
- Obrázek odeslaný z notebooku vytvořil souběžné skupiny na různých uzlech. Po 40 odeslaných paketech ještě Instagram neměl žádný přijatý; počítadla tyto stavy odlišovala. Po doručení ukázal Matějův notebook 72 / 72, 100 kB a obrázek. Otevření konverzace připravilo samostatné potvrzení přečtení.
- Skupina 11–20 byla rozbalena a zvolen paket 13: bajty 16801–18200, TCP SEQ 17801, 1 400 B dat a celkem 1 440 B modelového IPv4 paketu. Zobrazil se překlad soukromé adresy a portu na `192.0.2.1:40000`. Otevření detailu zablokovalo krokování, po Escape přenos pokračoval.
- Video vytvořilo 36 skupin. V mapě byly zároveň značky ×100 na různých spojích a počítadlo Odesláno 600 / celkem 3 572. Ve skupině 201–300 bylo možné vybrat paket 250: TCP SEQ 349601, bajty 348601–350000 a 1 400 B dat. Binární data jsou správně označená a nejsou vydávaná za UTF-8 text.
- Během druhého spojení měl Instagram všech 3 572 paketů, zatímco Matěj jen 300 (420 kB). Jeho aplikace ukazovala skládání a nepovolovala předčasné přehrání. Po úplném přijetí ukázala 5 MB / 5 MB a skutečný místní přehrávač.
- Ukázkové MP4 se načetlo bez chyby, délka 4 s, readyState 4. Kliknutí na přehrávání spustilo video; při dalším kroku simulace pokračoval čas z přibližně 0,235 na 0,579 s a paused zůstalo false. Potvrzení přečtení se následně vrátilo do původního notebooku.
- Z telefonu odeslán nový obrázek přes mobilní data. Došel přes BTS a operátora a skončil se shodnými počty 72 odeslaných / 72 přijatých Instagramem / 72 přijatých Matějem.
- Rozložení kontrolováno při 1280 × 720, 1280 × 900, 390 × 844 a 320 × 568 px. Na šířce 320 px se vejdou všechny tři volby. Dokument má přesně 320 px, obsah aplikace 260 px bez vodorovného přetečení; při 390 px je obsah 330 px. Okno skupiny na 320 px má 286 × 423 px a obsah 284 px bez přetečení. Seznam členů se posouvá uvnitř okna. Konzole bez chyb a varování.

Všech **69 automatických testů** úspěšných: předchozích 62 a 7 nových mediálních. Nové kontroly ověřují velikosti UTF-8, shodný limit datového paketu, 72/3 572 skutečně reprezentovaných paketů, meze počtu značek, souběh, odesílací i přijímací počítadla, přesné binární bajty, atomické zpřístupnění, SEQ a poslední zkrácený paket, NAT počítadla, odloženou přílohu po jiném pokusu, přerušení druhé fáze, opakování a přečtení. Syntaxe všech sedmi skriptů, relativní prostředky a CSS ověřeny. Prostředky používají `v=25`.

Omezení: obrázek a video obsahují deterministické modelové bajty dané velikosti; ukázkový SVG a MP4 jsou samostatné lokální náhledy. MP4 má 480 × 270 px, H.264/yuv420p, délku 4 s a velikost 8 271 B; není tvrzeno, že tento malý ukázkový soubor tvoří 5MB modelový přenos. Nejde o skutečné nahrávání souboru ani plnou simulaci kodeků, TLS, TCP ACK a přenosového výkonu. Čas skupin je zhuštěný a neslouží k měření reálné doby přenosu. Vše běží lokálně.

Snímky: [volba obsahu](docs/media-compose.jpg), [proud skupin videa](docs/media-map.jpg), [rozbalená skupina](docs/media-group.jpg), [skládání u příjemce](docs/media-reassembly.jpg), [doručené video](docs/media-received.jpg), [volba na telefonu](docs/media-mobile.jpg), [skupina na telefonu](docs/media-mobile-group.jpg).

## Čtyři datová centra 9. listopadu 2026

Topologie má nyní 31 zařízení a 35 spojů. Původní společná LAN vzdálených služeb se rozdělila na čtyři směrované sítě: hosting webu a DNS `203.0.113.0/26`, Instagram `203.0.113.64/26`, cloud A `203.0.113.128/26` a cloud B `203.0.113.192/26`. Každé centrum má vlastní router, switch a přípojku. Hosting a A se připojují k routeru D, Instagram a B k druhému poskytovateli přes E. Původní adresy webu, DNS, Instagramu, domácností a NAT zůstaly stejné; hlavní cloud se přesunul na `203.0.113.140`, kopie má `203.0.113.204`. Výchozí brány odpovídají novým LAN.

Mapa zobrazuje čtyři samostatné barevné budovy. Upraveny výřezy Centra, Kamarád a Celá síť, Matějova domácnost se přesunula doprava a operátor tak, aby se nekřížily názvy sousedních routerů. Okna zařízení vysvětlují příslušnost a roli centra. Informace o přípojce hostingu už neslibují výpadek všech služeb.

Cloud B uchovává samostatnou mapu souborů a práv. Ruční Synchronizovat centra A → B přenese snímek jako UTF-8 bajty v segmentech do 160 B se souběhem na různých úsecích. Nová kopie se zpřístupní až po úplném přijetí. Přerušený přenos zachová předchozí kopii. V obou noteboocích lze vybrat centrum A nebo B; B poskytuje seznam a stahování, zápis vrací 405. Neaktuální kopie vrací 503, aby stará práva neobešla revokaci. Aktuální kopie umožňuje čtení při vypnutém hlavním serveru či jeho přípojce. Nejde o automatickou replikaci nebo automatické přepnutí služby; tyto meze popisuje README.

Ověřeno skutečným ovládáním rozhraní v místním náhledu:

- Celá síť při 1280 × 720 px ukazuje všechny čtyři budovy, jejich brány, přepínače a samostatné přípojky. Každý klikací prvek dál otevírá překryvné okno. Přepínač Centra zaměří obě dvojice center.
- Web knihovny úspěšně dorazil přes nový router hostingu. Notebook zobrazil skutečně doručený obsah verze 1.
- Do centra A nahrán Dvě centra.txt s textem a emoji. Okno serveru ukázalo stav dat A: 2 / kopie B: 1 a upozornění na nutnou synchronizaci.
- Synchronizace přenesla 407 B ve třech částech. Na mapě byly současně pakety na různých uzlech, označené A → B. Detail druhé části ukázal `203.0.113.140 → 203.0.113.204`, TCP `52004 → 443`, SEQ 1161 a správné skutečné JSON bajty. Otevření detailu zablokovalo krokování; po Escape šel přenos dokončit.
- Po doručení okno centra B zobrazilo samostatnou kopii Dvě centra.txt, správného vlastníka, verzi, soukromá práva a stav A: 2 / B: 2. Odkaz Tvůj cloud otevřel notebook s předvoleným B.
- Hlavní server A byl vypnutý. Z B se úspěšně načetl seznam a stáhl přesný text Samostatná kopie souboru s emoji. Tlačítka pro nahrání a novou verzi byla při vybraném B neaktivní. Místní uložení zůstalo dostupné.
- Instagram v samostatném centru úspěšně doručil zprávu 45 B do Matějovy domácnosti, zatímco cloud A zůstal vypnutý.
- Rozložení kontrolováno při 1280 × 720, 390 × 844 a 320 × 568 px. Výběr centra má na úzkém displeji vlastní řádek a vejde se. Při 320 px je šířka dokumentu přesně 320 px a posuvného obsahu aplikace 260 px bez vodorovného přetečení; monitor končí na y=441, přenosové ovladače jsou pod mapou. Konzole bez chyb a varování.

Všech **62 automatických testů** úspěšných: 28 síťových, 9 ovládání mapy, 9 cloudových, 10 NAT a 6 nových pro datová centra. Nové testy kontrolují oddělené podsítě a správné výchozí brány, nezávislé výpadky služeb, přesné bajty a práva kopie, atomické zveřejnění až po úplném přenosu, čtení z B za domácím NAT při výpadku A, odmítnutí zápisu, blokování neaktuálních práv, revokaci po synchronizaci a opakování přerušené kopie. Stávající testy byly upraveny pro novou IP cloudu a nový router hostingu. Test náhradní větve nyní používá web, protože Instagram má jinou přípojku. Syntaxe všech šesti skriptů ověřena. Prostředky používají `v=21`.

Snímky: [čtyři centra v celé síti](docs/datacenters-map.jpg), [souběžné pakety kopie](docs/datacenters-sync.jpg), [obsah centra B](docs/datacenters-copy.jpg), [výběr centra na telefonu](docs/datacenters-mobile.jpg).

## NAT/PAT v obou domácnostech 8. listopadu 2026

Oba domácí routery nyní při odchozím TCP/UDP přenosu mění zdrojovou soukromou adresu a port na veřejnou WAN adresu a přidělený port. Návratová odpověď projde jen při shodě protokolu, veřejného portu a vzdálené adresy/portu s tabulkou NAT; router obnoví soukromý cíl. Poskytovatelé už nemají směrovací záznamy pro soukromé domácí prefixy. Překlad nemění data ani TCP SEQ. Princip NAPT odpovídá [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022.html); zjednodušení jsou uvedena v README.

DNS, HTTP a cloud odpovídají na skutečně pozorovanou adresu a port požadavku. Instagram si ukládá veřejný konec každého klientského spojení. Před prvním doručením Matějův notebook odešle modelový paket Připojení směrem ven; po ztrátě vazby NAT je nutné nové odchozí připojení. Nejde o úplnou simulaci TCP handshake. Mobilní data zatím používají veřejnou modelovou IP bez CGNAT.

Ověřeno skutečným ovládáním rozhraní:

- DNS dotaz z notebooku se na domácím routeru změnil z `192.168.10.10:53000` na `192.0.2.1:40000`, protějšek `203.0.113.53:53`. Detail paketu zobrazil obě hodnoty a aktuální veřejnou hlavičku. Otevření detailu dál blokovalo krokování. Odkaz z paketu otevřel správný router a jeho skutečný záznam NAT.
- Vrácená DNS odpověď obnovila cíl `192.168.10.10:53000` z `192.0.2.1:40000`. Detail ukázal obrácený překlad, UDP `53 → 53000` a TTL 60.
- Po přijetí HTTP požadavku serverem byla tabulka NAT ručně vymazána. Odpověď na `192.0.2.1:40001` skončila na domácím routeru s vysvětlením chybějícího záznamu. Opakovaný pokus vytvořil nový port 40002 a web se zobrazil.
- V nastavení notebooku je soukromá i veřejná IP. Tlačítko Prohlédnout NAT routeru otevřelo příslušné okno; návrat obnovil obrazovku Připojení. Směrovací tabulka obsahuje přímo připojený WAN prefix jen jednou.
- Instagram přijal krátkou zprávu a následovala viditelná událost Matějův notebook otevírá spojení k Instagramu. Matějův router vytvořil TCP vazbu `172.16.20.10:52002 ↔ 192.0.2.26:40000` k `203.0.113.80:443`. Po doručení měl počty paketů ven 1 / zpět 1. Po otevření Matějovy konverzace se potvrzení přečtení vrátilo přes Instagram až do původního notebooku.
- Rozložení zkontrolováno při 1280 × 720, 390 × 844 a 320 × 568 px. Na nejmenším telefonu má okno 286 × 423 px a končí na y=440; ovladače jsou dále dostupné pod mapou. Obsah NAT tabulky má 284 px bez vodorovného přetečení, celý dokument přesně 320 px. Adresa a port se mohou zalomit mezi sebou; číslo portu zůstává pohromadě. Při 390 px má obsah 354 px, opět bez přetečení. Konzole bez chyb a varování.

Všech **56 automatických testů** úspěšných: 28 síťových, 9 vstupu mapy, 9 cloudových a 10 nových NAT. Nové kontroly ověřují obousměrný překlad, dva klienty se stejným zdrojovým portem na jedné veřejné adrese, oddělení soukromých prefixů, neměnné TCP SEQ a data, TTL, místní tisk a mobilní přenos bez domácího NAT, odmítnutí chybného protějšku/protokolu/portu, ztrátu a obnovu vazby, změny přístupu/napájení, odchozí spojení Instagramu a přesný cloudový obsah. Syntaxe všech šesti skriptů a relativní prostředky ověřeny. Prostředky používají `v=19`.

Snímky: [odchozí paket před a po NAT](docs/nat-packet-desktop.jpg), [tabulka domácího routeru](docs/nat-router-desktop.jpg), [návrat DNS odpovědi](docs/nat-return-desktop.jpg), [NAT na telefonu](docs/nat-mobile.jpg).

## Cloudové soubory a přístupová práva 8. listopadu 2026

Do obou notebooků přidána aplikace Cloud. Každý má samostatné místní textové soubory a rozepsaný editor. Nový cloudový server `203.0.113.90` je připojen na p5 switche datového centra; topologie má nyní 23 zařízení a 27 spojů. Rozšířen výřez Servery a budova datového centra. Původní adresy a pořadí existujících propojení zůstaly zachované.

Upload, stažení, seznam i změna práv jsou obousměrné přenosy požadavku a odpovědi přes připravené spojení TCP/443. Přenášejí se skutečné modelové UTF-8 bajty v částech do 160 B, s odstupem a souběhem na různých spojích. Server provede operaci až po složení celého požadavku; notebook zobrazí výsledek až po složení odpovědi. Nové soubory jsou soukromé. Práva pro druhého uživatele jsou žádný přístup, čtení/stažení a také úpravy. Změnu přístupu smí odeslat pouze vlastník. Server kontroluje oprávnění i výchozí verzi při každém novém požadavku. Opakování už provedené mutace nezdvojí výsledek, pokud se ztratilo pouze potvrzení.

Ověřeno skutečným ovládáním rozhraní:

- Z notebooku Ty nahrán Skupinový projekt.txt, 130 B textu včetně diakritiky a emoji. Požadavek měl 215 B včetně metadat. V mapě byly obě jeho části zároveň na různých uzlech. Detail ukázal cloudové označení, IP `192.168.10.10 → 203.0.113.90`, TCP `51003 → 443`, SEQ 1001, 160 B dat a správný JSON náhled. Otevření detailu pozastavilo krokování.
- Po dokončení odpovědi 201 byl soubor na serveru i v přijatém seznamu vlastníka jako soukromý. Matějův pokus stáhnout známé ID cloud-2 dostal doručenou odpověď 403; obsah souboru ani místní kopie se mu nevytvořily.
- Vlastník povolil čtení/stažení. Matěj stáhl přesně stejný text včetně emoji; Uložit novou verzi zůstalo neaktivní. Po povolení úprav a obnovení seznamu se zpřístupnilo. Matěj změnil text a uložil verzi 2 stejného cloud-2. Vlastník si následně stáhl přesně tuto novou verzi.
- Okno Cloudového serveru ukázalo správnou IP, uložené soubory, verzi 2, vlastníka Ty a Matějovo právo číst/upravovat; poslední požadavek a odkaz na jeho paket fungovaly. Správcovský přehled je výslovně označený.
- Po novém načtení ověřena předpřipravená Matějova cloud-1 a její změna z práva číst na soukromou. Ve stejném notebooku vytvořen a místně uložen nový vlastní text. Obě aplikace mají samostatné místní seznamy a účty.
- Rozložení kontrolováno při 1280 × 720, 1280 × 900, 390 × 844 a 320 × 568 px. Na nejmenší šířce měly dokument i aplikace přesnou šířku bez vodorovného přetečení: obsah 260 px, hlavní panel 272 px. Pět ikon na ploše notebooku se vešlo do dvou řad. Monitor končil na y=441 a přenosové ovladače začínaly na y=456. Pole i výběr práv šly posouvat do zobrazení. Klávesnicové zaměření se při přepnutí cloudových karet vrátilo na zvolenou kartu. Konzole bez chyb a varování.

Všech **46 automatických testů** úspěšných: 28 původních síťových, 9 ovládání mapy a 9 nových cloudových. Nové kontroly ověřují úplný příjem před uložením a před potvrzením, správné UTF-8 bajty, soukromý soubor a pokus podvrhnout uživatele v požadavku, stažení z druhé domácnosti, rozdíl čtení/úprav/správy práv, konflikt staré verze, odebrání práva při starém seznamu, zachování místních kopií, potvrzení změny práv, přerušený upload, ztracenou odpověď a opakování bez duplicit, nezávislost místních souborů na připojení a cloud vlastněný oběma účty. Syntaxe všech šesti skriptů a relativní prostředky zkontrolované. Verze prostředků `v=18`.

Jde o modelové textové soubory do 1200 znaků v paměti simulace. Žádná externí služba, skutečné nahrávání z disku, trvalé úložiště nebo reálné přihlašování se nepřidává. Omezení a připravené relace popisuje README.

Snímky: [cloud v notebooku](docs/cloud-desktop.jpg), [cloud na telefonu](docs/cloud-mobile.jpg), [souběžné cloudové pakety](docs/cloud-map.jpg), [stav cloudového serveru](docs/cloud-server.jpg).

## Všechny spoje v okně nad mapou 8. listopadu 2026

Poslední detail v bočním panelu — spoj — nyní používá sdílené informační okno zařízení a paketů. Platí pro všech 26 spojů bez ohledu na médium nebo způsob otevření. Zachován původní obsah, stav, odpojování/obnovení a odkazy na koncová zařízení. Odstraněna HTML lišta, obsluha sbalení i její nevyužité styly; pracovní plocha má stále jeden sloupec. Okno má vlastní přístupný nadpis a popis zavření pro spoj. Posunutí obsahu i zaměření tlačítka odpojování se při překreslení zachovávají.

Ověřeno skutečným ovládáním rozhraní:

- Kliknutí na Notebook — switch otevřelo okno nad mapou. Výřez `35 270 465 440` a rozměry SVG (1232 × 569 px při 1280 × 720 px) zůstaly stejné. Dokument už neobsahuje žádný boční panel.
- Odpojení a obnovení kabelu aktualizovalo skutečný stav i vykreslenou linku. Zaměření klávesnice zůstalo na přepínači. Odkaz ze spoje otevřel okno switche a šipka zpět obnovila správný detail spoje.
- Ověřeno otevření nevybrané Wi-Fi, mobilního rádia Telefon — BTS Lipová, přípojky BTS Lipová — síť operátora a Propojení poskytovatelů. Všechny měly správné názvy i informace o způsobu přenosu.
- Odkaz Vybrat připojení zařízení otevřel nastavení notebooku; tlačítko Prohlédnout připojení v mapě z monitoru otevřelo okno kabelu. Odkaz z portu BTS otevřel okno její přípojky.
- Zavření fungovalo tlačítkem, Escape i kliknutím mimo okno. Escape vrátil zaměření na původní spoj. Otevření a zavření neměnilo zvolený výřez.
- V otevřeném detailu A — B při krokování zůstalo posunutí obsahu přesně 281 px. Tlačítko Prozkoumat paket přešlo do pozastaveného detailu paketu; šipka zpět obnovila okno spoje a zpřístupnila krokování.
- Rozložení zkontrolováno při 1280 × 720, 390 × 844 a 320 × 568 px. Na nejmenším telefonu se dlouhý název přípojky přirozeně zalomil. Okno mělo 286 × 423 px a končilo na y=440; přenosové ovladače začínaly na y=456. Obsah měl šířku 284 px bez vodorovného přetečení a šel posunout až o 498 px. Celý dokument měl šířku 320 px (resp. 390 px).

Všech 37 stávajících automatických testů úspěšných, syntaxe řadiče ověřena. Síťový model a ovládání mapy se neměnily. Konzole bez chyb a varování. Prostředky používají `v=17`.

Snímky: [okno kabelového spoje](docs/link-window-desktop.jpg), [přípojka BTS na telefonu](docs/link-window-mobile.jpg).

## Zoom gesty a kolečkem 8. listopadu 2026

Mapa nyní přijímá sevření/rozevření prstů na touchpadu, Ctrl/Cmd + kolečko a dvě dotykové pozice na obrazovce. Zoom zůstává ukotvený pod kurzorem nebo mezi prsty, včetně prázdného prostoru kolem SVG při různých poměrech stran. Tlačítka +/− zachovávají střed výřezu. Limit oddálení zvýšen z 1800 na 4000 jednotek: původní limit byl menší než výřez Celá síť (1840), takže první oddálení paradoxně přibližovalo.

Obsluha je připojená jen na SVG, s nepasivními posluchači pro potlačení výchozího zoomu stránky. Běžné kolečko bez modifikátoru se nezachytává. Safari používá také vlastní události gest; současný dotykový nebo wheel vstup se neuplatní dvakrát. Použité události popisují [MDN: wheel](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event) a [Apple: Handling Gesture Events](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html).

- Všech **37 automatických testů** úspěšných: 28 kontrol modelu a 9 nových kontrol vstupu mapy. Nové testy spouštějí skutečné obsluhy událostí na testovacím povrchu a ověřují ukotvení kurzoru v širokém i vysokém SVG, oba směry zoomu, pixelové/řádkové/stránkové delta jednotky, normální scroll bez modifikátoru, limity a okamžité obrácení gesta na limitu, události Safari, souběh s dotykem, posun během sevření, pokračování jedním prstem a ztrátu zachycení ukazatele.
- V prohlížeči při 1280 × 720 px ověřeno oddálení Celé sítě na šířku 2355,2 a opětovné přiblížení. Tažení přiblížené mapy změnilo počátek výřezu z `223.54816 171.73024` na `320.31049 227.02300`; po uvolnění a překreslení popisků zůstal výřez přesně stejný.
- Ověřeno otevření monitoru notebooku, příprava DNS přenosu, krokování a přiblížení během pokusu. Kliknutí přímo na paket otevřelo jeho informační okno a znepřístupnilo krokování. Výřez se otevřením okna nezměnil.
- Na 320 × 568 px zůstaly dostupné oba zoomovací ovladače. Navigace končila na x=262,03 a tlačítka začínala na x=274; dokument měl šířku 320 px, bez vodorovného přetečení. Konzole bez chyb a varování.

Dostupné ovládání prohlížeče neumí vytvořit fyzické gesto touchpadu ani kolečko s podrženým modifikátorem. Tyto vstupy byly ověřeny automatickými testy obsluh, nikoli skutečným hardwarem; totéž platí pro Safari a dotykové sevření. V prohlížeči byly přímo ověřeny tlačítka, tažení a navazující funkce aplikace. Syntaxe skriptů zkontrolována. Prostředky používají `v=16`.

Snímky: [přiblížená síť](docs/map-zoom-desktop.jpg), [mapa na telefonu](docs/map-zoom-mobile.jpg).

## Okno paketu a průjezd přes zařízení 8. listopadu 2026

Detail paketu nyní používá stejné překryvné okno jako zařízení. Postranní panel zůstává pro spoje. Otevření paketu zastaví čas simulace i všechny rozjeté animace a do zavření znepřístupní přehrávání, krokování a opakování. Původně běžící přenos se po zavření obnoví; ručně pozastavený zůstane pozastavený. U samostatně krokované animace se zachová i její zbývající čas, aby následné přehrání nemuselo dokončit rozjetý úsek skokem.

Pohyb paketu vede od středu zdrojového zařízení do středu cílového. Během rozhodnutí zůstává na stejném bodě, ze kterého následně začne další úsek. Odstraněno zkracování spoje před kolečky i svislý posun paketu o 58 jednotek nad zařízení. Stejnou geometrii používají i rozeslané kopie rámce.

Ověřeno skutečným ovládáním rozhraní:

- Po vytvoření první části zprávy měl paket stejný transform jako notebook: `translate(150,420)`. Ve fázi zpracování se shodoval se středem switche `translate(300,500)` a routeru `translate(425,500)`; odchylka obrazových středů byla nejvýše 0,000031 px kvůli zaokrouhlení. Pakety nyní viditelně překrývají středy ikon.
- Otevřen detail během rozjetého úseku. Obrazová poloha zůstala přesně shodná po celou dobu čtení a nezměnil se ani aktuální stav simulace. Ručně pozastavený přenos po zavření zůstal na stejné pozici.
- Při přehrávání kliknuto přímo na druhý paket ze tří současně aktivních částí. Otevřel se správný detail 2/4; během čtení byly všechny obrazové pozice i aktuální událost beze změny. Okno ukazovalo možnost automatického pokračování, všechna tlačítka přenosu byla neaktivní. Po zavření se přehrávání obnovilo.
- Ověřen vstup přes tělo paketu v mapě, tlačítko Prozkoumat paket i konkrétní část v Instagramu. Šipka zpět přešla mezi pakety a následně do monitoru notebooku. Zavření křížkem, Escape i kliknutím mimo okno fungovalo.
- Rozbalení hexadecimálních bajtů a posouvání obsahu nechalo přenos pozastavený. Po zavření šlo pokračovat a zpráva 363 B se doručila Matějovi. Detail už doručeného paketu neobnovoval dokončený přenos.
- Rozložení ověřeno při 1280 × 720, 390 × 844 a 320 × 568 px. Okno na malém telefonu mělo 286 × 423 px, končilo na y=440 a přehrávání začínalo na y=456. Šířka dokumentu byla 320 px; obsah okna nepřetékal vodorovně. Konzole bez chyb a varování.

Všech 28 testů modelu úspěšných. Upravené skripty prošly kontrolou syntaxe; časový plán a síťový model se neměnily. Prostředky používají `v=15`.

Snímky: [okno paketu](docs/packet-window-desktop.jpg), [pakety ve středech zařízení](docs/packet-center-path.jpg), [okno na telefonu](docs/packet-window-mobile.jpg).

## Kabel, Wi-Fi a mobilní data 8. listopadu 2026

Topologie rozšířena na 22 zařízení a 26 spojů: dva přístupové body Wi-Fi, telefon v bytě na Lipové, BTS Lipová, BTS Park a uzel Síť operátora. Oba notebooky mají Kabel/Wi-Fi/Odpojit, telefon Wi-Fi/Mobilní data/Odpojit a ruční výběr BTS. Nastavení je součástí jejich obrazovek. Telefon má samostatný prohlížeč, rozepsaný text a vlastní fyzický vzhled obrazovky.

Ověřeno skutečným ovládáním rozhraní:

- Notebook přepnut na Wi-Fi `Lipova`, nastavení ukázalo IP `192.168.10.11`. DNS paket se pohyboval bezdrátově do AP; celý přenos webu se dokončil.
- Vypnut domácí router. Telefon přes BTS Park načetl web a zobrazil doručený obsah. Po přepnutí na Wi-Fi jeho další načtení selhalo a zachovalo označený dřívější obsah.
- Vypnuta BTS Lipová. Telefon ukázal nedostupnou mobilní síť. Z jeho nastavení vybrána BTS Park a odeslána zpráva 363 B; v mapě současně viditelné různé části na rádiu, BTS a v síti operátora. Obě přípojky BTS jsou kreslené tak, aby nevypadaly jako řetěz věží.
- Matějův notebook během první fáze přepnut na Wi-Fi. Druhá fáze doručila přesně stejný text. Otevření konverzace připravilo potvrzení; po jeho návratu do telefonu se zobrazilo Přečteno. Výchozí rozepsaný text zůstal zachován.
- Paket na BTS ukázal IP `198.51.100.10 → 203.0.113.53`, UDP/53 a poznámku o mobilním přístupu místo smyšlených ethernetových MAC. Okno operátora zobrazilo tabulku a mobilní kanály bez ethernetových MAC. Ověřena také informace o vypnuté BTS.
- Přepnutí rozpracovaného telefonního přenosu z dat na Wi-Fi jej ukončilo s vysvětlením. Opakování vytvořilo paket z IP `192.168.10.30`; jeho detail rozpoznal Wi-Fi rámec. Výběr BTS zachoval klávesnicové zaměření v seznamu.
- Ověřeno vypnutí/zapnutí telefonu, jeho návrat na plochu a přepínání aplikací. Při 1280 × 720, 390 × 844 a 320 × 568 px nedocházelo k vodorovnému přetečení. Na malém telefonu monitor končil na y=441 a přehrávání začínalo na y=456. Šest přepínačů mapy končilo na x=262,5 a zoom začínal na x=274.
- Ruční posun mapy změnil výřez `100 530 930 530` na `58.08435852372583 502.0562390158172 930 530`; po uvolnění a překreslení popisků zůstal zachován. Konzole bez chyb a varování.

Všech 28 testů modelu úspěšných. Devět nových kontrol ověřuje Wi-Fi přemostění a tisk bez routeru, nezávislé výpadky AP/kabelu a domácí/mobilní přípojky, obousměrný přenos přes BTS, zachování vnitřního TTL na BTS, výběr druhé věže, ukončení přenosu při změně rozhraní, dvě nezávislé DNS cache, telefonní Instagram, Matějovu Wi-Fi, potvrzení na novém připojení a dvě Wi-Fi zařízení na stejném AP. Syntaxe všech pěti skriptů ověřena. Prostředky používají `v=14`.

Snímky: [Wi-Fi v bytě](docs/access-wifi-map.png), [připojení notebooku](docs/access-laptop-desktop.png), [nastavení telefonu](docs/access-phone-desktop.png), [mobilní cesta](docs/access-cellular-map.png), [telefon na úzkém displeji](docs/access-phone-mobile.png). Mobilní jádro, rádiové kanály a Wi-Fi mají výslovně popsaná zjednodušení v README; handover, SIM, zabezpečení rádia ani GTP tunely se nesimulují.

## Informační okna zařízení 8. listopadu 2026

Switche, routery, servery a tiskárna nyní zobrazují původní obsah detailu v samostatném okně nad mapou. Notebooky si ponechávají monitor. Spoje a pakety zůstávají v postranním panelu. Otevření zařízení nezmenšuje mapu a nezmění její výřez.

Ověřeno skutečným ovládáním rozhraní:

- Domácí switch otevřel okno se stavem, porty a MAC tabulkou. Vypnutí a opětovné zapnutí fungovalo přímo v okně. Během krokování se zobrazilo skutečné rozhodnutí o rozeslání a naučená MAC notebooku na p1.
- Z portu switche otevřen detail spoje v panelu; z něj otevřen domácí router v překryvu. Odkaz na konkrétní paket otevřel správný paket v panelu, šipka zpět obnovila okno zařízení.
- Router zobrazil směrovací tabulku i rozhraní. Po rozbalení rozhraní a posunutí obsahu následný krok zachoval otevřenou sekci, scrollTop 390 i výřez mapy `20 60 1840 790`.
- Webový server v okně uložil nový nadpis, zvýšil verzi na 2 a odkazem otevřel monitor notebooku. Po dokončení přenosu prohlížeč zobrazil nový obsah. Ověřen také detail tiskárny a informační okno Instagramu.
- Zavření tlačítkem, klávesou Escape i kliknutím mimo okno vrátilo mapu. Spodní přehrávání a krokování zůstalo dostupné i při otevřeném okně.
- Rozložení ověřeno při 1280 × 720, 390 × 844 a 320 × 568 px. Na malém telefonu mělo okno rozměry 286 × 423 px a končilo na y=440; přehrávání začínalo na y=456. Šířka dokumentu 320 px, žádné vodorovné přetečení obsahu okna.

Všech 19 testů modelu úspěšných, syntaxe upraveného řadiče ověřena. Prostředky zvýšeny na `v=13`. Snímky: [switch nad mapou](docs/device-window-desktop.png), [router na telefonu](docs/device-window-mobile.png).

## Úprava rozhraní 8. listopadu 2026

Podle sedmi komentářů odstraněna legenda požadavku/odpovědi, spodní popisek oblasti, nadpis nad mapou, tlačítko Otevřít notebook, tlačítko přizpůsobení výřezu, volba rychlosti a celá horní lišta. Uvolněný prostor využívá mapa. Přehrávání má stálé tempo; úplný výchozí stav se nyní obnovuje novým načtením aplikace v prohlížeči.

Ověřeno spuštění aplikace bez chyb konzole, absence všech odstraněných prvků, zahájení DNS přenosu, krokování, přehrání/pauza, otevření paketu, návrat k notebooku a změna měřítka. Rozložení ověřeno při 1101 × 944 a 320 × 568 px: pracovní plocha začíná u horního okraje a vyplňuje výšku, na telefonu nejsou vodorovné posuvníky ani překryv detailu s krokováním. Aktuální snímky rozhraní jsou ve složce `docs`.

## Oprava posouvání mapy 8. listopadu 2026

Příčinou návratu výřezu byl společný selektor `[data-scene]`: zahrnoval také samotné SVG mapy. Kliknutí vzniklé po dokončení tažení proto spustilo přepnutí pohledu a obnovilo jeho připravený výřez. Obsluha přepínání i označování aktivního pohledu nyní pracuje pouze s tlačítky uvnitř `.scene-nav`.

Chování nejprve zopakováno skutečným tažením myši. Po opravě posun o 90 × 60 obrazových bodů změnil výřez z `35 285 465 390` na `-26.687170474516698 243.87521968365553 465 390` a po uvolnění tlačítka jej zachoval. Stejný výřez zůstal po přepnutí popisků a otevření detailu switche. Ověřeno i další tažení po přiblížení, přepnutí pohledu tlačítkem a zachování ručního posunu při krokování a přehrání/pauze přenosu. Konzole bez chyb. [Snímek po posunutí mapy](docs/drag-map.png).

## Instagram a druhá domácnost 8. listopadu 2026

Zpráva se nyní posílá z aplikace Instagram na notebooku účtu `@matej`. Mapa má 16 zařízení: přibyla samostatná služba Instagram, router dalšího poskytovatele a Matějův router, switch a notebook. Matěj má vlastní monitor s konverzací, vypínačem a přepínačem potvrzení přečtení. Web a tisk zůstávají samostatnými pokusy.

Ověřeno skutečným ovládáním rozhraní:

- Vypnut Matějův notebook, z tvého Instagramu odeslána zpráva 363 B. Čtyři části dorazily do Instagramu; server ukázal 363 / 363 B a stav „Uloženo · čeká na připojení Matěje“. Příjemce měl 0 / 363 B a přenos čekal.
- Po zapnutí Matějova notebooku se připravilo doručení uložené zprávy. Tři nové fialové pakety cestovaly současně na různých úsecích druhé cesty. Detail druhého paketu ukázal IP `203.0.113.80 → 172.16.20.10`, porty `443 → 52002`, TCP SEQ 8145 a bajty 145–288. Po doručení byl v Matějově konverzaci přesně stejný celý text.
- Otevření konverzace u Matěje připravilo potvrzení přečtení. Přehráno po síti `Matěj → Instagram → tvůj notebook`; až po jeho návratu se u odesílatele objevil stav Přečteno.
- V Matějově Instagramu vypnuta potvrzení. Potom odeslána nová krátká zpráva o 44 B včetně emoji. Matěj ji přijal a přečetl; u odesílatele zůstalo Doručeno Matějovi a nevznikly pakety potvrzení.
- Ověřeno rozložení při 1280 × 720, 390 × 844 a 320 × 568 px. Na telefonu je dostupný formulář i sledování v mapě. Na malém telefonu monitor končil na y=441 a přehrávání začínalo na y=456; bez vodorovného přetečení. Pět přepínačů pohledu se nepřekrývalo s přibližováním.
- Ruční posun mapy s více pakety změnil výřez z `20 60 1840 790` na `-24.8051948051948 74.93506493506493 1840 790`; po uvolnění a překreslení popisků zůstal zachován. Konzole bez chyb a varování.

Všech 19 testů modelu úspěšných. Nové kontroly pokrývají dvě samostatná spojení, samostatné TCP číslování a segmentaci, čekání na příjemce, doručení i po odpojení odesílatele, uchování zprávy při jiném pokusu, výpadek a nový pokus druhé fáze, oba úseky potvrzení přečtení, vypnutá potvrzení, konverzaci otevřenou už během doručování a pozdější předání potvrzení offline odesílateli. Syntaxe všech skriptů a existence relativně odkazovaných prostředků ověřena. Verze prostředků `v=12`.

Snímky: [Instagram na notebooku](docs/instagram-desktop.png), [druhá cesta v mapě](docs/instagram-map.png), [Instagram na telefonu](docs/instagram-mobile.png). Meze modelu, včetně připravených spojení, schematického portu 443 a přehledu globálního stavu, popisuje README.

## Souběžný přenos paketů 8. listopadu 2026

Fronta událostí nyní používá společné logické časové kroky. Notebook pouští další část vzkazu po třech krocích, zatímco předchozí části pokračují sítí. Události stejného kroku se přehrávají současně. Jeden spoj v jednom směru řadí rámce za sebe. Každý paket má vlastní polohu, animaci a detail; kopie neznámého unicastu jsou odlišené přerušovaným obrysem a popiskem Kopie.

Ověřeno skutečným ovládáním rozhraní:

- Po rozdělení výchozího vzkazu viditelné postupné vypouštění částí 1–4. V jednom okamžiku byly všechny čtyři části na různých místech mapy; dva pakety se v témže kroku pohybovaly po různých spojích.
- Pauza zachovala přesně stejné obrazové pozice všech čtyř částí i rozeslané kopie rámce. Opětovné přehrání pokračovalo a na server dorazil přesný celý vzkaz o 356 B. Výběr druhé části otevřel správné bajty 113–224 a TCP SEQ 1113.
- Krok posouval společný čas sítě. Otevření detailu a přepnutí velikosti náhledu nezahodilo ostatní části. Ruční posun mapy zůstal po otevření detailu zachován.
- Po rozhodnutí routeru A odpojen spoj A–B. Paket se ztratil u routeru A, ostatní nedokončené části se zastavily a pokus skončil chybou. Opakování odstranilo značky předchozího pokusu; nové pakety šly přes router C a vzkaz se správně doručil.
- Na telefonu 390 × 844 px byly dostupné čtyři pakety, jejich detail i krokování. Šířka dokumentu byla 390 px; detail končil na y=732, kde začínalo spodní ovládání. Konzole bez chyb a varování.

Všech 11 testů modelu úspěšných. Nové kontroly ověřují odchod dalšího paketu před doručením prvního, souběžné předávání na různých spojích, opakovatelnost časového plánu a řazení více připravených rámců na jediném výstupu. Kontrola syntaxe všech tří upravených skriptů úspěšná. Prostředky v `index.html` zvýšeny na `v=11`.

Časové kroky slouží animaci; TCP okna, ACK, opakování ztracených dat ani skutečná latence a kapacita se nadále nesimulují. [Souběžné pakety na počítači](docs/parallel-packets.png), [detail na telefonu](docs/parallel-packets-mobile.png).

## Monitor notebooku 8. listopadu 2026

Notebook nyní otevírá monitor uprostřed mapy. Jeho plocha nabízí Prohlížeč, Dokument a Vzkaz; původní formuláře notebooku už nejsou v postranním panelu. Tlačítko na rámečku vypíná a zapíná skutečné modelové zařízení. Po vypnutí je obrazovka černá a aplikace nejsou dostupné. Přehrávání a krokování zůstávají pod mapou mimo překryv.

Kontrolováno skutečným ovládáním rozhraní:

- Z prohlížeče monitoru načten web s nadpisem „Dnes otevřeno do 16 hodin“. Úprava serveru na 18 hodin ponechala starou stránku; nové načtení přes síť přineslo nový nadpis. Při odpojené přípojce nové načtení selhalo a ponechalo označený dřívější obsah.
- Z aplikace Dokument odeslán soubor `Pokus z monitoru.pdf` do tiskárny při odpojené přípojce bytu. Dokument se vytiskl. Rozepsaný název zůstal zachován při přepínání aplikací i během překreslování simulace.
- Odeslán vlastní vzkaz o 404 B ve čtyřech částech. Druhá část otevřela detail paketu: bajty 113–224, TCP SEQ 1113, 112 B dat. Návrat obnovil přesný rozepsaný text a stav přenosu. Na serveru následně ověřen celý správný vzkaz.
- Zavření a znovuotevření monitoru zachovalo rozepsaný vzkaz, načtenou stránku i ručně posunutý výřez mapy. Tlačítko Sledovat v mapě zpřístupnilo animaci a ponechalo připravený přenos.
- Ověřeno zapnutí/vypnutí, otevření všech tří aplikací, hlavní panel a návrat na plochu. Po prvním načtení je vidět samotná mapa a monitor se otevře až kliknutím na notebook.
- Rozložení ověřeno při 1280 × 720, 390 × 844 a 320 × 568 px. Na telefonu zůstávají dostupná tlačítka zavření, napájení i spodní ovládání přenosu; bez vodorovného přetečení a překryvu s přehráváním.

Devět testů modelu znovu úspěšných, syntaxe nových/změněných skriptů bez chyb. Podcesta `/projekt/jak-funguje-internet/` načetla obě CSS a všech pět skriptů ve verzi `v=10`; kliknutí na notebook otevřelo monitor se třemi aplikacemi. Konzole bez chyb a varování.

Aktuální snímky: [monitor na počítači](docs/monitor-desktop.png), [monitor na telefonu](docs/monitor-mobile.png). Starší snímky níže zachycují předchozí podobu rozhraní.

## Model: 19 úspěšných testů

Příkaz: `node --test tests/model.test.mjs`.

1. DNS předchází HTTP. Obsah se zobrazí až po doručení odpovědi. Změna serveru sama neaktualizuje notebook; nové načtení ji přinese. DNS cache vynechá opakovaný dotaz. Chyba obnovení uchová dříve doručený obsah.
2. HTTP odpověď obsahuje verzi platnou v okamžiku zpracování požadavku na serveru. Pozdější úprava obsah rozpracované odpovědi nezmění.
3. Místní tisk funguje bez poskytovatele i s vypnutým domácím routerem. První rámec naučí switch pouze zdrojovou MAC a neznámý unicast rozešle na ostatní aktivní porty LAN.
4. Známá cílová MAC vybere jediný naučený port. Router mění ethernetový obal a zachovává zdrojovou/cílovou IP. Zobrazené záznamy odpovídají směrování konkrétních paketů.
5. Delší text opravdu potřebuje více segmentů. Části mají správné bajty, offsety a TCP SEQ, zůstávají pod MTU a příjemce beze změny složí text včetně vícebajtových znaků na hranicích segmentů.
6. Trasa je stabilní, při výpadku funguje druhá větev, po odpojení obou větví i společné přípojky nastane chyba a po obnově přenos uspěje. Opakování zachová síť a obsah serveru; nový výchozí model obnoví původní podmínky.
7. Při testem vynuceném jiném pořadí segmentů TCP předá aplikaci pouze souvislý začátek proudu. Pozdější webový pokus nezmění počty bajtů předchozího nedokončeného vzkazu.
8. Paket, pro který byl vybrán následně odpojený výstup, se ztratí a nepřeskočí na jinou linku. Nový pokus použije dostupnou větev.
9. Vypínání a obnova tiskárny, DNS a webového serveru odpovídají výsledkům. Po uložení DNS odpovědi lze web otevřít i při vypnutém DNS serveru.
10. Části vzkazu odcházejí s odstupem před dokončením cesty předchozích částí. Více částí se v témže časovém kroku pohybuje po různých spojích; opakování obnoví stejný časový plán.
11. Rámce připravené najednou pro stejný výstup spoje použijí různé časové kroky. Přenos správně složí i vícebajtové znaky rozdělené mezi segmenty.
12. Instagram převezme celý text před vytvořením druhého přenosu. Obě fáze mají odlišné IP, identity paketů, TCP SEQ a rozdělení dat; příjem zprávy ještě neznamená přečtení.
13. Offline příjemce ponechá zprávu uloženou na Instagramu. Po obnovení lze doručit i s odpojeným odesílatelem a po jiném síťovém pokusu.
14. Výpadek během druhého přenosu uchová přijatý text. Nový pokus má nové pakety a příjemce složí správný celý text.
15. Otevření konverzace u příjemce vytvoří potvrzení přes Instagram. Odesílatel se o přečtení dozví až po přijetí navazujícího paketu.
16. Vypnutá potvrzení nevytvoří žádný paket přečtení; zapnutí je umožní odeslat.
17. Konverzace otevřená během doručování přečte dokončenou zprávu a připraví potvrzení automaticky.
18. Při offline odesílateli Instagram uchová přijaté potvrzení a po obnovení odešle už jen zbývající část cesty.
19. Výpadek odesílatele nebo Instagramu před převzetím zabrání přijetí zprávy. Výpadek služby po převzetí zachová uloženou zprávu pro pozdější doručení.

## Rozhraní: ovládání stejné jako u žáka

Kontrolováno klepáním na skutečné prvky rozhraní, bez přímého volání interních funkcí modelu.

- Načten web s nadpisem „Dnes otevřeno do 16 hodin“. Na serveru uložen nadpis „Dnes otevřeno do 18 hodin“. Notebook zachoval původní text; po dalším načtení zobrazil nový.
- Odpojena Přípojka bytu. Dokument se vytiskl. Nové načtení webu skončilo chybou a zřetelně označený dřívější obsah zůstal na obrazovce.
- Odeslán výchozí vzkaz: 356 B ve čtyřech částech. V pauze otevřena část 2/4: bajty 113–224, TCP SEQ 1113, 112 B dat, IP 192.168.10.10 → 203.0.113.10. Přepnutí měřítka ponechalo vybraný paket. Na serveru ověřen celý správný text.
- Odpojen spoj B–D horní větve. Při opakování detail routeru A ukázal pro 203.0.113.0/24 výstup eth2 a router C, IP 192.0.2.14. Přenos uspěl. Po odpojení i C–D další pokus selhal. Po obnově C–D opět uspěl.
- V kroku příjmu prvního rámce otevřen domácí switch. Ukázal vstup p1, zdrojovou MAC notebooku, cílovou MAC domácí brány a rozeslání na p2/p3. Detail domácího routeru ukázal konkrétní prefix, wan0 a další IP 192.0.2.2.
- Úplné obnovení vrátilo byt, prázdný prohlížeč, oba aktivní spoje a původní nadpis na serveru.
- Ověřeno přehrání, pauza, krokování, návrat z detailu, změna měřítka a sbalení mobilního panelu. Opraveno překrytí středu zařízení paketem, aby šly oba samostatně vybrat.

## Displeje a prostředky

Ověřené skutečné CSS rozměry náhledu: počítač přibližně 1309 × 818 px, tablet 909 × 1000 px, telefon 355 × 767 px a malý telefon 320 × 568 px. Náhled zohledňuje i měřítko prostředí prohlížeče.

Na telefonu otevřen prohlížeč, detail paketu i spoje; spoj odpojen/obnoven a přenos krokován. Detail a spodní ovládání se nepřekrývají. U 320 × 568 px odpovídala šířka dokumentu šířce displeje, spodní ovládání zůstalo na obrazovce. Na tabletu se detail i mapa vešly vedle sebe.

Podcesta `/ukazka/jak-funguje-internet/` načetla CSS, všechny čtyři skripty a všech 11 zařízení. Z této podcesty byl zahájen a krokován DNS přenos. Statická kontrola rovněž potvrzuje existenci a relativní cesty všech odkazovaných prostředků. V konzoli při kontrole nebyly chyby ani varování.

Snímky: [počítač](docs/preview-desktop.png), [telefon](docs/preview-mobile.png).

## Meze ověření

- Nepublikováno do skutečného GitHub repozitáře; ověřena struktura a odpovídající projektová podcesta. Pro publikování stačí uživatelské zapnutí Pages podle README.
- Přímé otevření přes `file://` testovací náhled z bezpečnostních důvodů nepovoluje, proto nebylo touto cestou automaticky ověřeno. Projekt používá klasické lokální skripty a nevyžaduje aplikační server, moduly, `fetch` ani sestavení. Provedené interaktivní kontroly běžely přes lokální statické HTTP.
- Emulována úzká velikost displeje, nikoliv fyzický telefon nebo úplná matice prohlížečů. Funkce se aktivují klepnutím/kliknutím a nepoužívají závislost na hoveru.
