# Záznam ověření

## Volitelné rámce a odstranění přepínače Popisky · 22. listopadu 2026

Do Nastavení → Zobrazované podrobnosti přidána samostatná volba Ethernetové a Wi-Fi rámce, ve výchozím stavu vypnutá. Společný detail paketu vykreslí rozbalovací rámec se zdrojovou a cílovou MAC adresou jen při jejím zapnutí. Platí pro všechny pakety a zařízení, nezávisle na MAC tabulkách a zobrazení hlaviček; přepnutí zachová běžící přenos. Z mapy odstraněn přepínač Popisky, jeho obsluha, stav a nepoužívané styly skrývání. Názvy a IP adresy zařízení zůstávají viditelné, samostatný přepínač Dosah signálu zůstává funkční. README aktualizováno, prostředky `v=157`.

Prošla celá sada **342 testů**, včetně **46 souvisejících testů nastavení a detailů paketů** a **16 testů mapy**, i kontrola syntaxe čtyř upravených skriptů a obou upravených testů. Nový integrační test sleduje skutečné HTTP pakety na každém pozorovaném ethernetovém a Wi-Fi úseku a ověřuje nezávislé skrytí/zobrazení rámců bez změny dat, hlaviček, NATu či výsledku přenosu. Základní nastavení rámce skrývá, úplné je zapíná a převod nastavení uchovává jejich volbu.

V prohlížeči při 1047 × 858 px ověřeno výchozí skrytí ethernetového rámce, zapnutí a opětovné vypnutí u stejného živého paketu bez resetu i následné úspěšné doručení webu. Při 320 × 568 px ověřena dostupnost nové volby, výchozí skrytí Wi-Fi rámce, zobrazení jeho skutečných MAC adres po zapnutí a dokončení přenosu přes Wi-Fi. Přepínač Popisky v obou rozloženích chybí, názvy a adresy zařízení zůstávají viditelné; zapnutí a vypnutí Dosahu signálu je zachová. Rozhraní bez vodorovného přetékání, konzole bez chyb a varování.


## Statické vyhledávání v Gmailu · 22. listopadu 2026

Vyhledávací oblast v záhlaví Gmailu nově tvoří běžný blok s ikonou a textem Hledat v poště. Původní label a readonly vstup odstraněny, takže oblast neobsahuje zaměřitelné ani editovatelné pole. Dekorace je skrytá před asistivními technologiemi, nepodporuje výběr textu a používá běžný kurzor. Zachována barva, zaoblení, rozměry, ikona a typografie včetně úzkého rozložení. Odstraněny nepoužívané styly vstupu, placeholderu a focus-within. README aktualizováno, prostředky `v=156`.

Prošlo všech **10 souvisejících testů Gmailu a phishingového rozhraní** i kontrola syntaxe upraveného skriptu. V prohlížeči při 1047 × 858 px ověřena statická oblast s původní výškou 42 px a barvou; kliknutí a pokus o zaměření jí nepředaly fokus ani nezměnily pozadí, stín či obrys. Při 320 × 568 px ověřena výška 31 px, zachovaný vzhled a absence vodorovného přetékání. Napsat dál otevírá nové zprávy. Také Gmail útočníka používá stejnou statickou oblast bez vstupu a fokusu. Konzole bez chyb a varování.


## Jediný požadavek a odpověď pro SMTP a IMAP · 21. listopadu 2026

Odesílání běžných i phishingových e-mailů zkráceno na přenos celé zprávy a potvrzení jejího uložení. Samostatné výměny MAIL FROM, RCPT TO a DATA odstraněny; odesílatel, příjemce a obsah jsou zahrnuty v odeslané zprávě. Načtení schránky tvoří jediná žádost a odpověď s celým snímkem, uložení příznaku přečtení jediný požadavek a potvrzení. Přípravný SELECT se neposílá. Stavový index vícekrokového rozhovoru odstraněn a popisky paketů rozlišují e-mail, potvrzení, žádost o zprávy, obsah schránky a příznak přečtení. Model TLS, TCP SEQ, chráněné části do 192 B, časování a skutečná cesta sítí zůstávají. Server ukládá až úplný e-mail, místní Odeslané čekají na potvrzení, Přijaté na celé doručení snímku a místní přečtení na potvrzení serveru. README popisuje zjednodušení, prostředky `v=155`.

Prošla celá sada **341 testů**, včetně **40 souvisejících testů pošty a phishingu**, a kontrola syntaxe obou upravených skriptů i obou testovacích souborů. Testy nyní ověřují jedinou výměnu požadavku a odpovědi na skutečných koncích spojení, nemožnost přijetí SMTP nebo zveřejnění IMAP po pouhé části dat, celé UTF-8 zprávy přes chráněné části obou protokolů, souvislá SEQ a MTU. Nový test ztráty potvrzení přečtení kontroluje zachování serverového příznaku, nezměněnou místní kopii a úspěšné opakování. Zachovány kontroly ztráty SMTP potvrzení bez duplikace, přerušeného IMAP se starším snímkem, offline příjemce, integrity TLS, phishingu, Wi-Fi, mobilního, satelitního i VPN přístupu.

V prohlížeči při 763 × 743 px odeslán vlastní e-mail s diakritikou a emoji. Před potvrzením byla zpráva uložená na serveru, ale Odeslané zůstaly prázdné; po potvrzení obsahovaly jedinou zprávu. Matějův Gmail ji ukázal až po samostatném Obnovit poštu. Otevření uložilo přečtení a serverový přehled ukázal přesně dva záznamy pro každý úkon: požadavek a odpověď, bez přípravných výměn. Při 320 × 568 px odeslána delší UTF-8 zpráva z telefonu přes mobilní data a VPN. Z doupěte doručen předpřipravený phishingový e-mail do telefonu a přes VPN načten i označen jako přečtený. Adresa odesílatele a odkaz zůstaly správné, žádný obsah se neobjevil před načtením a serverový výpis stále obsahoval jedinou výměnu pro každý úkon. Gmail a detail serveru bez vodorovného přetékání; konzole bez chyb a varování.


## Odstranění doprovodné věty před prvním VPN přenosem · 21. listopadu 2026

Ze stavu připravené VPN odstraněna věta Při příštím internetovém přenosu se naváže šifrovaný tunel. Odstavec se v tomto stavu nevykresluje, takže po něm nezůstává prázdné místo. Prostředky `v=154`.

Prošly všechny **4 integrační testy rozhraní VPN** a kontrola syntaxe upraveného skriptu. V prohlížeči při 763 × 743 a 320 × 568 px ověřen stav zapnuté VPN bez věty a jejího odstavce, funkční Odpojit a opětovné Připojit i absence vodorovného přetékání. Konzole bez chyb a varování.


## Stručnější detail VPN serveru · 21. listopadu 2026

Z detailu odstraněn souhrnný čítač Provoz VPN serveru, pole s vysvětlením rozbaleného paketu a směru přenosu i odkaz Prozkoumat tento paket. Odstranění pole platí také pro variantu HTTPS a odpověď pro zařízení. Nepoužívané styly vpn-layer-note odstraněny; sdílené styly stavových polí a obsluha prohlížení paketů používaná jinde zůstávají. Přehled aktivních spojení s počty paketů, obsah posledního paketu, volitelné NAT údaje a model přenosů zůstávají. Prostředky `v=153`.

Prošlo všech **16 testů VPN a jejího rozhraní** i kontrola syntaxe upraveného skriptu. V prohlížeči při 763 × 743 px ověřen prázdný server, skutečný HTTP požadavek během běžícího přenosu i jeho úspěšné dokončení a zobrazení HTTP odpovědi. Odstraněné bloky chybí, aktivní spojení a náhled paketu zůstávají. Při 320 × 568 px úspěšně doručeno HTTPS přes VPN; detail ukazuje aktivní spojení a chráněný obsah posledního paketu bez odstraněných bloků a bez vodorovného přetékání. Konzole bez chyb a varování.


## Odstranění doprovodné věty při vypnuté VPN · 21. listopadu 2026

Z vypnutého stavu aplikace VPN odstraněna věta Internet používá běžné připojení. Nevytváří se ani prázdný odstavec po textu. Prostředky `v=152`.

Prošly všechny **4 integrační testy rozhraní VPN** a kontrola syntaxe upraveného skriptu. V prohlížeči při 763 × 743 a 320 × 568 px ověřena absence věty i jejího odstavce před zapnutím a po opětovném vypnutí VPN; tlačítko zůstává funkční a na telefonu je viditelné bez vodorovného přetékání. Ostatní stavové texty se při zapnutí zobrazují. Konzole bez chyb a varování.


## Samostatná aplikace VPN · 21. listopadu 2026

Ovládání VPN přesunuto z Připojení do samostatné aplikace s ikonou štítu na ploše a v hlavním panelu. Jedno tlačítko Připojit / Odpojit mění stávající stav VPN klienta. Rozhraní rozlišuje vypnutí, připravenou VPN před prvním přenosem, skutečně navázaný tunel a nedostupnou cestu/server. Podrobnosti spojení jsou rozbalovací. Aplikace se řídí rozšířením VPN a je dostupná na šesti skutečných klientských zařízeních; notebook útočníka v kavárně zůstává pouze hotspotem. Připojení obsahuje fyzický přístup a případné volitelné vlastnosti přípojky. Původní model tunelu, ověřování protějšku a zastavení přenosu při změně VPN zůstávají. Hlavní panel lze vodorovně posunout, takže při úplné sestavě zůstávají všechny aplikace dosažitelné i na telefonu; aktivní aplikace se po vykreslení udrží v dohledu. Aktualizována nabídka rozšíření a README, prostředky `v=151`.

Prošla celá sada **340 testů**, z toho **28 souvisejících testů** VPN, rozhraní VPN, Wi-Fi kavárny a časování přípojek. Čtyři nové integrační testy ověřují dostupnost na skutečných klientech, skrytí bez rozšíření, oddělení od Připojení, poctivý stav před prvním přenosem, přenos přes skutečný modelový tunel i po jeho vypnutí, výpadek bez nechráněného návratu a nezávislost klientů včetně ručně připojovaného hosta kavárny. Kontrola syntaxe všech čtyř upravených skriptů a nového testu prošla.

V prohlížeči při 763 × 743 px ověřeno otevření VPN na všech šesti klientech, absence u hotspotu útočníka, zapnutí z plochy, stav před prvním přenosem, skutečné načtení HTTP přes VPN, stav Připojeno a dostupné podrobnosti. Mezerník VPN odpojil a zachoval fokus na tlačítku; nedostupný server zobrazil příslušný stav s funkčním Odpojit. Při 320 × 568 px v úplné sestavě ověřena dostupnost ikony pomocí posunu hlavního panelu, viditelné hlavní tlačítko a zachování fokusu. HTTPS z telefonu uspělo přes VPN na mobilních datech i po přepnutí na domácí Wi-Fi; stav po změně přípojky odpovídal novému navázání. Vypnutí VPN během přenosu pokus ukončilo. Podrobnosti byly dostupné posunem obsahu bez vodorovného přetékání; odebrání rozšíření skrylo aplikaci a ponechalo telefon dostupný. Konzole bez chyb a varování.


## Aktivní tunely na VPN serveru a odstranění místní IP z Připojení · 21. listopadu 2026

Detail VPN serveru nově uvádí pouze dostupné klienty s platným navázaným tunelem podle stávající kontroly VPN protějšku. Zapnutá VPN bez prvního přenosu se za aktivní spojení nepovažuje. Sekce Aktivní VPN spojení ukazuje zařízení, vnitřní IP tunelu a počty paketů do internetu a zpět; bez platných tunelů uvádí Žádné aktivní VPN spojení. Odstraněny odkazy do klientského nastavení a jejich nepoužívaný styl. Nastavení VPN zůstává v aplikaci Připojení zařízení, provozní statistiky a serverové záznamy zůstávají. Z Připojení odstraněn údaj místní IP klienta, včetně hosta kavárny; nevznikají prázdné seznamy údajů. Název Wi-Fi a volitelné informace NAT zůstávají dostupné. README aktualizováno, prostředky `v=150`.

Prošlo všech **24 souvisejících testů** VPN, připojování v kavárně a časování přípojek i kontrola syntaxe tří upravených skriptů. Model tunelů, předávání dat a IP adresace se nemění.

V prohlížeči při 763 × 743 px ověřen prázdný server před zapnutím VPN i po zapnutí bez přenosu, skutečné načtení webu přes VPN a následný záznam notebooku s jedním paketem v obou směrech. Po vypnutí VPN se zobrazil prázdný stav; po opětovném navázání a odpojení přístupu také. Odkazy do nastavení klientů chybí. V úplné sestavě ověřeno odstranění místní IP u notebooku na Lipové, u Matěje, na chatě, telefonu, útočníka i připojeného hosta kavárny; názvy Wi-Fi a volitelné NAT údaje zůstávají. Při 320 × 568 px ověřeno Připojení telefonu bez místní IP, úspěšné načtení webu přes VPN a aktivní tunel telefonu s počty paketů bez vodorovného přetékání. Konzole obou náhledů bez chyb a varování.


## Odstranění otevíracích tlačítek z detailů reklamního scénáře · 21. listopadu 2026

Z detailů e-shopu a Zpráv odstraněno tlačítko Otevřít web na notebooku. Ze společného reklamního serveru odstraněna obě tlačítka Otevřít e-shop na notebooku a Otevřít zprávy na notebooku včetně jejich prázdného obalu. Odstraněna také nepoužívaná obsluha těchto zkratek a jejich filtrování; weby se otevírají prostřednictvím prohlížeče. Prostředky `v=149`.

Prošlo všech **16 testů** reklamního scénáře a kontrola syntaxe obou upravených skriptů. V prohlížeči při 763 × 743 a 320 × 568 px ověřeny detaily všech tří serverů bez odstraněných tlačítek, se zachovanou doménou, nápovědou a ovládáním napájení. Na úzké obrazovce obsah nepřetéká. Načtení e-shopu přes záložku v prohlížeči včetně přijetí reklamy uspělo. Konzole obou náhledů bez chyb a varování.


## Jediný scénář Personalizovaná reklama · 21. listopadu 2026

Samostatné volby E-shop, Zprávy a Reklamní partner sloučeny do jediné volby **Personalizovaná reklama**. Zapíná oba weby, společný reklamní server, router, switch a potřebné páteřní přípojky. Automaticky vyžaduje TLS / HTTPS a Cookies. Vypnutí odebere celou větev, připravené adresy i nabídky obou webů; společné páteřní uzly zůstávají při zapnutém hackerském doupěti. Dostupnost záložek, zkratek a přechodů mezi weby i otevření ze serverů se řídí dostupností zařízení. Odstraněné samostatné volby už nelze vybrat. Nastavení obsahuje 18 rozšíření, úplná sestava dál 84 zařízení a 101 spojů. README aktualizováno, prostředky `v=148`.

Prošla celá sada **336 testů** i kontrola syntaxe čtyř upravených skriptů a testu. Integrační test zapíná jediné rozšíření, načte Hudbu v e-shopu a Zprávy, ověří společný profil a odpovídající personalizovanou reklamu. Po vypnutí kontroluje skrytí celé větve a jejích DNS záznamů, selhání přímého načtení obou skrytých webů, neplatnost starých voleb a zachování společné páteře pro hackerské doupě. Test historie a opakování pokrývá knihovnu a podvodný web s TLS i bez něj a oba weby nového scénáře s automatickým TLS.

V prohlížeči při 1047 × 858 px ověřena jediná volba, automatické závislosti, zapnutí všech pěti zařízení oblasti, záložky i zkratky obou webů, přechod z e-shopu na Zprávy a reklama podle uloženého zájmu. Reklamní server ukázal společný profil a ponechal funkční nabídky otevření obou webů. Vypnutí obnovilo základních 14 zařízení a jedinou záložku Knihovna. Při 320 × 568 px se jediná volba vejde bez přetékání; v telefonu po zapnutí fungují oba weby i přenos personalizované reklamy. Po vypnutí zůstal telefon se svou Wi-Fi dostupný, oba weby i reklamní server zmizely a prohlížeč nabízel jen knihovnu. Konzole obou náhledů bez chyb a varování.


## Odstranění odkazu na mapu z partnerských webů · 21. listopadu 2026

Ze společné šablony e-shopu a Zpráv odstraněno tlačítko Sledovat požadavky v mapě. Ostatní navigace, kategorie a reklamní přenosy zůstávají; prostředky `v=147`.

Prošlo všech **16 testů** reklamního scénáře a kontrola syntaxe upraveného skriptu. V prohlížeči při 1047 × 858 px ověřeno samostatné rozšíření E-shop přes HTTP, načtení stránky, změna kategorie na Hudbu a absence odkazu. Při 320 × 568 px ověřen e-shop se zapnutým reklamním partnerem přes HTTPS, přijetí reklamy, přechod na Zprávy a načtení reklamy i tam. Oba weby postrádají odstraněný odkaz a nepřetékají vodorovně. Konzole obou náhledů bez chyb a varování.


## Odstranění vnitřního nadpisu MITM · 21. listopadu 2026

Z aplikace odstraněn blok s ikonou a nadpisem MITM v kavárně. Obsah začíná kartou Hotspot bez prázdného místa po nadpisu; název MITM v horní liště aplikace zůstává. Odstraněn nepoužívaný styl ikony, prostředky `v=146`.

Prošlo všech **5 testů** připojování v kavárně včetně vykreslení MITM a kontrola syntaxe upraveného skriptu. V prohlížeči při 1047 × 858 a 320 × 568 px ověřena absence vnitřního nadpisu, umístění Hotspotu na začátku obsahu a žádné vodorovné přetékání. Na úzkém zobrazení ověřeno také zapnutí hotspotu. Konzole obou náhledů bez chyb a varování.


## Stručnější zachycené zprávy MITM · 21. listopadu 2026

Ze všech karet zachycených zpráv odstraněn doprovodný komentář výsledku a údaj o směru s číslem paketu v pravém horním rohu. Změna platí společně pro HTTP, DNS, TLS i VPN. Typ zprávy, adresy a porty, stav ochrany, obsah a případná změna zůstávají dostupné; modelové záznamy se nemění. Nepoužívané styly odstraněny, prostředky `v=145`.

Prošlo všech **19 souvisejících testů** MITM a připojování v kavárně i kontrola syntaxe upraveného skriptu. V prohlížeči při 1047 × 858 px úspěšně doručeno HTTP s DNS i následné HTTPS přes hotspot; všech devět zachycených záznamů postrádalo oba odstraněné prvky a ponechalo původní obsah i ochranu. Při 320 × 568 px ověřen skutečný HTTP přenos, obě karty bez komentáře a údaje o směru/čísle, čitelný obsah a žádné vodorovné přetékání. Konzole obou náhledů bez chyb a varování.


## Společná karta Hotspot v aplikaci MITM · 21. listopadu 2026

Nastavení názvu sítě a zapnutí / vypnutí sloučeno do jediné karty **Hotspot**. Obsahuje aktuální stav, přepínač, název Wi-Fi a tlačítko Uložit název. Přepínač má přístupnou roli switch a po změně si zachová fokus; totéž platí pro výběr režimu MITM. Pojmenování Napodobený hotspot odstraněno z této aplikace i jejího stavového pokynu. Z přehledu odstraněna poznámka o nejvýše 20 paketech a tlačítko Vymazat přehled včetně jeho nepoužívané obsluhy a stylů. Zachytávání a uchovávání paketů se nemění. README aktualizováno, prostředky `v=144`.

Prošlo všech **19 testů** připojování v kavárně a MITM i kontrola syntaxe obou upravených skriptů. V prohlížeči při 1047 × 858 px ověřeno uložení vlastního názvu, společné umístění přepínače a názvu, oba stavy, dostupnost sítě u hosta, ruční připojení a odpojení po vypnutí hotspotu. HTTP přenos z hostova prohlížeče uspěl a v přehledu se zobrazil požadavek i odpověď bez odstraněné poznámky a tlačítka. Přepnutí mezerníkem změnilo stav a zachovalo fokus. Při 320 × 568 px ověřeno zapnutí s rozepsaným názvem a následné uložení jiného názvu; karta, tlačítko i přehled nepřetékají vodorovně. Konzole obou náhledů bez chyb a varování.


## Zjednodušení MITM a přesun hesla Wi-Fi kavárny · 21. listopadu 2026

Z aplikace MITM odstraněn podtitulek pod názvem, doprovodné vysvětlení jednotlivých režimů, stav přenosové cesty, tři odkazy na hosta/server/mapu, poznámka o přemosťování a tlačítka spouštějící web u hosta. Přenos se otevírá přímo v hostově Prohlížeči. Odstraněny také nepoužívané styly a obsluha těchto tlačítek; nastavení hotspotu, režimy zásahu a přehled zachycených paketů zůstávají. Na notebooku hosta odstraněna karta Heslo od obsluhy a textová trasa připojení. Detail přístupového bodu **Wi-Fi kavárny** nově uvádí skutečný název sítě Kavarna_hoste a Heslo k Wi-Fi; původní nesprávný název U Mateje se zde už nezobrazuje. README aktualizováno, prostředky `v=143`.

Prošlo všech **19 souvisejících testů** MITM a připojování v kavárně i kontrola syntaxe obou upravených skriptů. Model útoku, připojování a kontroly hesla se nemění.

V prohlížeči při 1047 × 858 px ověřen přesun hesla do detailu přístupového bodu a jeho použití pro skutečné připojení hosta k zabezpečené síti. Odstraněné prvky chybí ve všech čtyřech režimech MITM, pojmenování a zapnutí hotspotu funguje. Po ručním přepnutí hosta na hotspot a otevření HTTP v jeho Prohlížeči dorazil změněný nadpis; útočníkův přehled obsahoval požadavek i odpověď a zaznamenal zásah. Vymazání přehledu funguje. Při 320 × 568 px ověřen detail sítě a hesla, pojmenování a zapnutí hotspotu, ruční připojení hosta, absence hesla a textové trasy v jeho aplikaci Připojení a zobrazení MITM bez vodorovného přetékání. Konzole obou náhledů bez chyb a varování.


## Volitelné rozšíření Šířka pásma a Latence · 21. listopadu 2026

Nastavení obsahuje jedinou volbu **Šířka pásma a Latence** v části Zařízení a služby. Zpočátku je vypnutá a ovládání obou vlastností se v aplikaci Připojení nevykresluje. Zapnutí zpřístupní stávající volby všem dostupným klientům, bez přidání zařízení nebo spojů. Model odmítne změnu profilu bez rozšíření; vypnutí při změně sestavy obnoví výchozí Nižší / Nižší. Dosavadní časování, oddělené profily zařízení a zachování hodnot běžícího přenosu se nemění. Nastavení má 20 rozšíření; prostředky `v=142`.

Prošlo všech **336 testů** i kontrola syntaxe tří upravených skriptů a testu. Nový integrační test ověřuje blokování změn bez rozšíření, totožnou topologii, změnu rozestupů a zdržení po zapnutí při zachování obsahu, obnovení výchozího profilu po vypnutí i zapnutí přes kompletní sestavu.

V prohlížeči při 1047 × 858 px ověřena jediná zpočátku vypnutá volba, zachování základních 14 zařízení při samostatném zapnutí, uložení obou hodnot, skrytí po vypnutí a návrat Nižší / Nižší po opětovném zapnutí. V úplné sestavě ověřeno společné zapnutí i skrytí na notebooku na Lipové, u Matěje, na chatě, telefonu, počítači útočníka a notebooku hosta kavárny. Při 320 × 568 px se volba i oba ovladače vejdou bez vodorovného přetékání; uložení na telefonu funguje a po vypnutí rozšíření telefon zůstává dostupný s připojením Wi-Fi. Konzole obou náhledů bez chyb a varování.


## Ruční připojení hosta k Wi-Fi a pojmenovatelný hotspot · 21. listopadu 2026

Host kavárny nyní začíná odpojený. V Připojení vidí pouze vysílající přístupové body podle názvu a zabezpečení. Kavárna nabízí síť Kavarna_hoste s ukázkovým heslem kava1234, dostupným v rozbalovací kartě Heslo od obsluhy. Chybné či chybějící heslo připojení nezmění; obecný přepínač přístupu kontrolu neobchází. Útočník může zadat vlastní název hotspotu o 1–32 znacích a zapnout vysílání. Jeho otevřená síť se hostovi objeví teprve po zapnutí. Útočník už nemůže hosta připojit tlačítkem za něj. Vypnutí, přejmenování či vypnutí zařízení s vybraným přístupovým bodem hosta odpojí; nedojde k přepnutí na jinou síť ani k automatickému opětovnému připojení. Viditelnost Wi-Fi zůstává oddělená od dostupnosti internetové přípojky. Prostředky `v=141`.

Prošlo všech **335 automatických testů** a kontrola syntaxe pěti změněných skriptů. Pět nových testů ověřuje počáteční odpojení, správné i chybné heslo, nemožnost připojit se k vypnutému hotspotu, dynamický seznam a vlastní názvy, shodné názvy různých sítí, skutečný HTTP průchod přes útočníka, odpojení a ukončení přenosu při přejmenování, žádný automatický návrat po zapnutí, bezpečné vykreslení textu a výpadek internetové přípojky při dál vysílající Wi-Fi. Starší scénáře se připojují výslovně ve svých testovacích přípravách; TLS, VPN, pošta, soukromí a ostatní přenosy prošly celou sadou.

V prohlížeči při 1047 × 858 px host začal bez připojení s jedinou zabezpečenou sítí. Chybné heslo vyvolalo chybu, správné připojilo k Wi-Fi kavárny. Zapnutí stejně pojmenovaného hotspotu přidalo druhou otevřenou síť a ponechalo původní připojení. Host ji ručně vybral a změněný HTTP nadpis dorazil přes útočníka. Přejmenování odpojilo hosta a nabídlo nové jméno; vypnutí po opětovném připojení odstranilo hotspot ze seznamu a host zůstal odpojený. Při 320 × 568 px ověřeno zadání hesla, připojení ke kavárně, pojmenování hotspotu, zapnutí přímo s rozepsaným názvem a ruční přechod hosta na novou otevřenou síť. Pole i tlačítka se vejdou bez vodorovného přetékání. Konzole obou náhledů bez chyb a varování.


## Jediný scénář Útočník v kavárně · 21. listopadu 2026

Volby Kavárna a Útočník v kavárně sloučeny do jediné volby Útočník v kavárně v části Části sítě. Zahrnuje celou kavárnu: notebook hosta, veřejný přístupový bod, útočníkův hotspot, router a potřebné páteřní přípojky. Vypnutí odstraní celou oblast; společný router R zůstává, pokud jej potřebuje zapnutý Cloud nebo VPN. Scénář nevyžaduje domácí Wi-Fi, e-mail ani TLS. Host dál začíná na běžné Wi-Fi; zapnutí a použití napodobeného hotspotu zůstává ovládáním uvnitř scénáře. Nastavení má 19 rozšíření. README a prostředky aktualizovány na `v=140`.

Prošlo **62 souvisejících testů** nastavení, útoku v kavárně, páteřní sítě, geometrie mapy a chytrých křižovatek. Nový integrační test zapne jediný scénář bez dalších závislostí, ověří HTTP přes útočníka, návrat na běžnou Wi-Fi, vypnutí celé oblasti při zachování Cloudu a pošty i neplatnost staré samostatné volby. Úplná sestava stále obsahuje 84 zařízení a 101 spojů. Syntaxe obou změněných skriptů prošla.

V prohlížeči při 1047 × 858 px dostupná jediná volba, která zapne všechna čtyři zařízení kavárny. Přes napodobený hotspot prošel HTTP přenos a změněný nadpis dorazil k hostovi; přehled útočníka ukázal skutečný zásah do odpovědi. Návrat na veřejnou Wi-Fi byl dostupný. Vypnutí scénáře skrylo kavárnu i její vyhrazené páteřní uzly, přičemž zapnutý Cloud, jeho záloha a společný router zůstaly. Při 320 × 568 px jedna volba bez přetékání, zapnutí přidá všechna čtyři zařízení a vypnutí vrátí základních 14. Konzole obou náhledů bez chyb a varování.


## Odstranění tří doprovodných textů Správy webu · 21. listopadu 2026

Ze Správy webu odstraněna doména pod názvem aplikace, vysvětlení Načti údaje uložené na podvodném serveru a poznámka Používají se pouze předpřipravené ukázkové údaje. Jejich nepoužívané styly odstraněny; adresa odkazu v kartě Falešná knihovna zůstává. Prostředky `v=139`.

Prošly všechny tři stávající testy odděleného Gmailu a Správy webu i kontrola syntaxe. V prohlížeči při 1047 × 858 a 320 × 568 px označené texty chybí, tlačítka zůstávají dostupná a obsah nepřetéká vodorovně. Na počítači ověřeno vložení správného odkazu do předpřipravené zprávy v Gmailu i skutečné načtení prázdného výsledku ze serveru. Konzole bez chyb a varování.


## Gmail útočníka a samostatná Správa webu · 21. listopadu 2026

Původní aplikace Phishing rozdělena na Gmail a Správu webu. Správa zobrazuje odkaz na již připravenou falešnou knihovnu a tlačítkem Vložit odkaz do e-mailu otevře předpřipravenou zprávu v Gmailu. Stejnou zprávu lze otevřít tlačítkem Napsat; vybrat lze pouze dostupné modelové příjemce. Odesílatel i SMTP obálka používají `podpora@knihovna-podpora.test`, předmět, obsah a odkaz jsou pevné. Odkaz je nyní i v textovém SMTP výpisu obsahu. Gmail má vlastní stav, schránku a potvrzené odeslané kopie; návštěvní ovládání phishingové zprávy se v Odeslaných nenabízí. Správa webu má oddělený stav a nadále zobrazuje pouze poslední přijatý snímek záznamů po skutečném přenosu ze serveru. Poštovní provoz nemění výsledek správcovského načtení. Prostředky `v=138`.

Prošlo všech **329 automatických testů** a kontrola syntaxe všech sedmi změněných skriptů. Tři nové testy ověřují propojení odkazu a pevného účtu s odesílanou zprávou, odeslané kopie až po SMTP potvrzení a jejich oddělení od serverového obsahu, samostatné načtení zachycených údajů, zachování staré kopie při výpadku a bezpečné zobrazení obsahu. Stávající testy přizpůsobeny samostatnému poštovnímu stavu útočníka; ostatní scénáře prošly beze změn.

V prohlížeči při 1047 × 858 px otevřeny obě aplikace z plochy i hlavního panelu. Odkaz z webové správy se shoduje s odkazem ve zprávě i u příjemce. Před potvrzením odeslání nejsou v Odeslaných žádné nové zprávy; po potvrzení lze otevřít nezávislou kopii. Příjemce načetl e-mail, otevřel falešnou stránku a odeslal pevné ukázkové údaje. Správa je nezobrazila před načtením; po samostatném přenosu dorazil správný záznam. Při vypnutém podvodném serveru načtení selhalo a zachovalo předchozí záznam; Gmail dál úspěšně odeslal další návnadu, včetně výběru Matěje. Při 320 × 568 px ověřeno vložení odkazu, čitelnost celé zprávy posouváním, dostupné Odeslat, odeslání Matějovi a načtení prázdného výsledku ve Správě webu. Stránka ani aplikace nepřetékají vodorovně. Konzole obou náhledů bez chyb a varování.


## Jednodušší aplikace Phishing · 21. listopadu 2026

Z aplikace v počítači útočníka odstraněn podtitulek Počítač útočníka · připravený scénář, celý čtyřbodový přehled postupu a pomocná tlačítka Otevřít Poštu u příjemce a Sledovat přenos v mapě. Nepoužívaná pomocná funkce a styly přehledu kroků odstraněny. Název, výběr příjemce, náhled e-mailu, skutečné odesílání a načítání záznamů ze serveru zachovány. Prostředky `v=137`.

Prošlo všech **14 testů phishingu** a kontrola syntaxe změněného skriptu. V prohlížeči při 1047 × 858 px ověřena nepřítomnost všech označených prvků a celý scénář: odeslání e-mailu, otevření Gmailu přes mapu, načtení zprávy, falešná knihovna, odeslání pevného ukázkového přihlášení a získání správného záznamu počítačem útočníka. Při 320 × 568 px bez vodorovného přetékání stránky i aplikace; zbývající tlačítka jsou dostupná posouváním a tlačítko načtení má výšku 40 px. Konzole obou náhledů bez chyb a varování.


## Podvodný web jako součást Hackerského doupěte · 21. listopadu 2026

Samostatné rozšíření Podvodný web odstraněno z katalogu nastavení. Hackerské doupě nyní přímo zahrnuje také oblast cizího hostingu, její router, switch a podvodný server; potřebná pošta a Matějův byt se přidávají stejně jako dříve. Závislosti páteřní sítě upraveny podle nové společné volby. Ostatní současné scénáře podvodný hosting samostatně nevyžadují; Útočník v kavárně zůstává nezávislý. Nastavení má 20 rozšíření, README a prostředky aktualizovány na `v=136`.

Prošlo **83 souvisejících testů** nastavení, phishingu, útoku v kavárně, páteřní sítě, mapy, chytrých křižovatek a navigace prohlížeče. Dva nové testy ověřují, že žádné jiné samostatné rozšíření falešný hosting nepřidá, vypnutí doupěte zachová nezávisle zvolenou poštu, obchod i kavárnu a celý phishingový scénář funguje ve všech čtyřech kombinacích DNS a TLS. Falešný server dál odpovídá i při vypnutém počítači útočníka. Syntaxe obou změněných skriptů bez chyb.

V prohlížeči při 1074 × 858 px zapnuto pouze Hackerské doupě: objevila se jeho síť i falešný hosting, doručil se podvodný e-mail, příjemce jej načetl přes IMAP, otevřel falešnou knihovnu a odeslal pevné ukázkové přihlášení. Počítač útočníka si následně načetl správný záznam samostatným přenosem. Bez doupěte podvodný server chybí, zatímco samostatně zvolená pošta, obchod a útočník v kavárně zůstávají dostupní. Při 320 × 568 px stará volba chybí, popis doupěte se vejde bez vodorovného přetékání a zapnutí/vypnutí přidá/odebere falešný hosting. Konzole obou náhledů bez chyb a varování.


## Automatická replikace, společné záhlaví náhledů a jednodušší nastavení · 21. listopadu 2026

Cloud po změně souborů nebo práv automaticky naváže přenosem úplného snímku A → B. Kopie se zpřístupní až po přijetí všech částí. Při nedostupné cestě čeká, po obnovení spojení se připraví nový pokus. Ztracené potvrzení klientovi nezruší zápis ani následnou kopii; výpadek kopírování nezmění úspěšné uložení v A. Opakování během kopírování bezpečně obnoví původní požadavek bez duplicit. Tlačítko Synchronizovat centra i panel s čísly verzí a stavem kopie odstraněny. Síťový přenos dál postupuje přehráváním/krokováním, nikoli nezávislými hodinami na pozadí.

Názvy informačních oken zařízení a spojnic jsou v horní zelené liště vedle křížku. Vypnutí nebo odpojení je samostatné menší tlačítko vpravo pod lištou (32 px na počítači, 40 px na telefonu); lišta i ovládání zůstávají dostupné při posouvání obsahu. Zachovány přístupné názvy dialogů a obnovení zaměření konkrétního ovládacího prvku. Poznámka pod Zobrazované podrobnosti v nastavení i její nepoužitý styl odstraněny. Prostředky `v=135`.

Prošlo všech **324 testů**. Upravené testy ověřují automatický přenos úplného obsahu a práv, nepřístupnost zastaralé kopie, zachování posledního úplného snímku při výpadku a automatický nový pokus. Čtyři nové kontroly pokrývají ztracené potvrzení s offline klientem, novější změnu během přenosu, vynechání zbytečných kopií při čtení a opakování hotového zápisu a bezpečné opakování uprostřed kopírování. Syntaxe všech čtyř změněných skriptů prošla.

V prohlížeči při 1074 × 858 a 320 × 568 px otevřeno všech 77 informačních náhledů zařízení a 90 zakreslených spojnic úplné sestavy: název v liště, ovládání pod ní, bez překrytí a bez vodorovného přetékání stránky. Navíc ověřeno Wi-Fi spojení, vypnutí/zapnutí webu, odpojení/obnovení kabelu, zachování zaměření tlačítka, pevné záhlaví při posouvání a nezměněné otevření i zavření náhledu paketu.

Cloudový dokument se po nahrání objevil v B bez dalšího tlačítka. Při odpojeném kabelu do B nová kopie nevznikla; obnovení kabelu samo připravilo přenos a dokument poté dorazil. Na telefonu ověřeno automatické kopírování i opakování během kopie bez zdvojení souboru. Oba cloudové servery neobsahují zrušené tlačítko ani stavový panel. Poznámka v nastavení chybí. Konzole obou náhledů bez chyb a varování.


## Cloudový server bez souhrnu posledního požadavku · 21. listopadu 2026

Z detailu hlavního i záložního cloudu odstraněn diagnostický blok Poslední požadavek s výsledkem operace a odkazem na paket. Výsledky nadále zpracovává a zobrazuje klientská aplikace; seznam uložených souborů, oprávnění a synchronizace zůstávají.

Prošlo 16 stávajících testů cloudového modelu a rozhraní a kontrola syntaxe skriptu. V prohlížeči ověřeno nahrání dokumentu a synchronizace: oba servery zobrazují uložený soubor pod nadpisem SOUBORY NA SERVERU bez diagnostického bloku; napájení a synchronizace jsou dostupné. Pokus Matěje stáhnout soukromý soubor dál zobrazí zamítnutí přístupu v aplikaci. Konzole bez chyb a varování. Prostředky `v=134`.


## Nadpis souborů cloudového serveru · 21. listopadu 2026

Z nadpisu hlavního i záložního cloudu odstraněn dodatek „· POHLED SPRÁVCE“. Zůstává pouze „SOUBORY NA SERVERU“. Ověřena syntaxe skriptu a oba detaily v prohlížeči: správný nadpis, zachovaný seznam souborů, napájení i synchronizace; konzole bez chyb a varování. Prostředky `v=133`.


## Jediné rozšíření Cloud pro obě datová centra · 21. listopadu 2026

Volby Cloud a Záložní cloud sloučeny do jediného rozšíření **Cloud**. Zapíná obě lokality, jejich přípojky a potřebné páteřní uzly, aplikaci Cloud, výběr hlavního/záložního úložiště i synchronizaci A → B. Samostatná volba zálohy a její závislost odstraněny; nastavení má 21 rozšíření. Vypnutí Cloudu skryje obě centra i aplikaci a znemožní oba typy přenosu. Data a pravidla replikace se nemění. README a cache prostředků aktualizovány na `v=132`.

Prošlo **68 souvisejících testů** nastavení, cloudu, datových center, páteřní sítě, rozložení mapy a IP popisků. Nový test zapne pouze Cloud, nahraje dokument, přenese kopii po obou přípojkách a stáhne ji ze zálohy při vypnutém hlavním serveru; po vypnutí rozšíření ověřuje skrytí obou center a blokování operací. Syntaxe pěti upravených skriptů bez chyb.

V prohlížeči při 1074 × 858 px jediná zaškrtnutá volba Cloud ukázala obě centra a obě možnosti v aplikaci. Dokument úspěšně nahrán, synchronizován a po vypnutí hlavního serveru otevřen i stažen ze zálohy se stejným textem. Při 320 × 568 px nastavení obsahuje jedinou volbu Cloud, popis se vejde bez přetékání; zapnutí ukáže obě centra, vypnutí vrátí základních 14 zařízení a odebere aplikaci. Konzole bez chyb a varování.


## Cloud jako jednoduché úložiště souborů · 21. listopadu 2026

Aplikace Cloud má společné rozhraní pro notebooky i telefon: seznam Na cloudu, samostatné místní soubory V počítači / V telefonu, tlačítko Nový dokument, textový editor a náhled jednoho souboru. Otevření vzdáleného dokumentu načte celý obsah po síti bez vytvoření místního souboru; samostatné stažení vytvoří místní kopii a otevře ji v editoru. Nahrání, aktualizace, sdílení i výběr záložního úložiště zachovávají původní serverové operace a kontroly práv a verzí. Telefon sdílí účet Ty s notebookem a chatou, má však oddělené místní soubory. Technické možnosti jsou v nabídce tří teček; sdílení je sbalené v náhledu vlastního dokumentu.

Prošlo všech **319 automatických testů**. Čtyři nové modelové kontroly ověřují náhled až po úplném doručení bez místní kopie, nové ověření práv a vymazání předchozího náhledu při odmítnutí, upload/download telefonu přes Wi-Fi i mobilní data a čtení aktuální či odmítnutí zastaralé záložní kopie. Tři nové kontroly rozhraní ověřují zobrazení pouze přijatých dat, escapování názvů a obsahu a dostupnost cloudu v telefonu. Syntaxe všech pěti upravených a nových skriptů bez chyb.

V prohlížeči při 1074 × 858 px ověřeno načtení seznamu, otevření sdíleného dokumentu, stažení do místního editoru a vytvoření i nahrání nového dokumentu. Při 390 × 844 px telefon vytvořil, uložil a nahrál dokument, povolil Matějovi čtení a Matěj jej následně otevřel a stáhl do svého notebooku; editor jeho kopie nabízí uložení nového souboru. Při 320 × 568 px ověřen seznam se záložním centrem bez přetékání, dlouhý text, zachování posunu panelu i textového pole a kurzoru během uložení a krokování, aktualizace cloudové verze a odmítnutí neaktuální zálohy. Místní úpravy lze uložit a znovu otevřít i offline; zavření a otevření aplikace zachová rozepsaný dokument. Konzole telefonu bez chyb a varování. Prostředky `v=131`.


## Odstranění odkazu Tvůj cloud · 21. listopadu 2026

Z detailu hlavního i záložního cloudového serveru odstraněno tlačítko Tvůj cloud. Pokud není dostupný Matějův notebook, nevzniká prázdný řádek tlačítek. Seznam souborů, práva a synchronizace se nemění.

Ověřena syntaxe skriptu a prohlížeč při 1047 × 858 px: bez Matěje chybí tlačítko i prázdný řádek, uložený soubor a napájení jsou dostupné, obsah nepřetéká. S Matějem a záložním cloudem chybí Tvůj cloud na obou serverech; tlačítko synchronizace je dostupné a zbývající odkaz do Matějova cloudu otevře správné centrum. Cache prostředků `v=130`.


## Odstranění přepínače měřítka mapy · 19. listopadu 2026

Z mapy odstraněna navigace Byt / Město / Celá síť včetně jejího obslužného kódu a nepoužívaných stylů. Zachována tlačítka +/−, posouvání a gesta i automatické přizpůsobení výřezu při změně nastavení a zahájení přenosů. Nápověda v README upravena podle současného ovládání.

Ověřeno 15 stávajících testů ovládání a geometrie mapy, syntaxe skriptu a prohlížeč při 1074 × 858 a 320 × 568 px. Přepínač chybí, zoom funguje a po přidání rozšíření se výřez přizpůsobí celé dostupné síti. Nastavení je dostupné a obsah nepřetéká. Cache prostředků `v=129`.


## Sjednocené informace serverů · 19. listopadu 2026

Ostatní servery přebírají zjednodušení webového serveru knihovny: vlastní IP a MAC adresa ani seznam připojených fyzických portů se v jejich detailu neopakují. IP zůstávají v mapě, síťový model a adresy v paketech se nemění. Služby chatbota, Instagramu a cloudu, SMTP/IMAP na Gmailu, výchozí brána DNS a technické údaje VPN jsou dostupné pouze při zapnutí IP a TCP hlavička. Web knihovny používá stejný společný způsob zobrazení služeb jako ostatní služby. Stav VPN už neopakuje její vlastní IP.

Zachovány DNS záznamy včetně odpovědí, serverové soubory a práva, uložené schránky a zprávy, dotaz a odpověď chatbota, stav tunelů, certifikáty, údaje o přijatých požadavcích a ovládací prvky scénářů. Tiskárna a síťová zařízení nejsou touto úpravou dotčena.

Ověření: **312 testů prošlo**, syntaxe obou skriptů i kontrola změn bez chyb. V prohlížeči zkontrolováno všech 14 serverů při 1074 × 858 px s podrobnostmi vypnutými a pouze hlavičkami zapnutými; navíc DNS a Gmail s úplnou sestavou. Ve všech režimech chybí vlastní IP/MAC a fyzické porty, služby se přepínají podle hlaviček a IP popisky zůstávají v mapě. Při 320 × 844 px ověřeny všechny základní náhledy bez vodorovného přetékání. Skutečný přenos chatbota zachoval dotaz a odpověď na serveru i doručení do zařízení; po 150 krocích SMTP lze na serveru rozbalit nově doručenou zprávu ve správné schránce i bez zobrazení SMTP/IMAP karet. Cache prostředků `v=128`.


## Další zjednodušení chatbota · 19. listopadu 2026

Z chatbota odstraněna lišta Čekání na dokončení přenosu / Sledovat v mapě a její vlastní styly. Z detailu serveru odstraněno tlačítko Otevřít Chatbot na notebooku. Ověřena syntaxe obou skriptů a prohlížeč při 1074 × 858 px: po odeslání lišta chybí, čekání v konverzaci i blokování odesílání funguje, po 37 krocích dorazí celá odpověď. V detailu serveru tlačítko chybí a ovládání napájení je dostupné. Cache prostředků `v=127`.


## Zjednodušení rozhraní chatbota · 19. listopadu 2026

Odstraněn štítek Výuková ukázka v záhlaví, nápověda Enter / Shift + Enter pod polem zprávy a celá rozbalovací položka Průběh přenosu včetně nepoužitých stylů a pomocných údajů. Odstraněn také odkaz `aria-describedby` na zrušenou nápovědu. Odesílání, historie, stav čekání a serverový přenos se nemění. Detail serveru je dostupný z mapy.

Ověřeno 11 stávajících testů chatbota, syntaxe skriptu a prohlížeč při 1074 × 858 a 320 × 568 px. Všechny tři prvky chybí, obsah nepřetéká; Enter dál spustí přenos a odpověď se zobrazí až po doručení. Cache prostředků `v=126`.


## Rozhraní chatbota · 19. listopadu 2026

Chatbot má nové rozhraní konverzace: uživatelské bubliny, odpovědi s ikonou, samostatně posuvnou historii, úvodní obrazovku a pole zprávy ukotvené dole. Křížek vrací na plochu. Enter odesílá přes dosavadní formulář, Shift + Enter vloží nový řádek; odesílání respektuje probíhající přenos i skládání textu pomocí IME. Technické fáze, počty doručených bajtů a odkaz na server jsou ve výchozím stavu sbalené v položce Průběh přenosu. Text čekání odpovídá skutečnému odesílání, výpočtu či návratu odpovědi. Model sítě a pevná serverová odpověď se nemění.

Ověření: všech **312 automatických testů** prošlo, včetně dvou nových kontrol vykreslení chatbota. Ty ověřují skrytí odpovědi až do úplného doručení, nezměněný stav při vykreslování, oddělené historie zařízení, escapování dotazu a rozepsaného textu i zachování dřívější odpovědi po výpadku. Syntaxe obou upravených skriptů prošla.

V prohlížeči ověřeno při 1074 × 858, 390 × 844 a 320 × 568 px: skutečný průchod dotazu přes síť, tři serverové kroky, návrat odpovědi, blokování dalšího odeslání během přenosu, Enter / Shift + Enter, rozbalení průběhu během krokování, dlouhá historie, zachování pozice při čtení, rozepsaného textu a kurzoru. Zavření křížkem a opětovné otevření zachovává konverzaci. Na telefonu ověřena doručená odpověď i výpadek serveru bez ztráty předchozí odpovědi. Obsah nepřetéká vodorovně a psaní zůstává dostupné pod historií. Cache prostředků zvýšena na `v=125`.


Poslední ověření 19. listopadu 2026. Použité podmínky: lokální statické HTTP, prohlížeč v náhledu Codex a Node.js pro testy samotného modelu. Aplikace pro používání Node.js nepotřebuje.

## Rozbalovací schránky a celé zprávy na serveru — 19. listopadu 2026, v124

Detail Gmailu používá nativní rozbalovací schránky s adresou účtu a počtem zpráv. Po rozbalení se zobrazí zprávy s předmětem a odesílatelem; každá se rozbaluje na adresáty, serverový stav přečtení a celý text se zachovanými řádky. Případný odkaz se vypíše bezpečně jako text. Schránky i zprávy začínají sbalené. Stabilní klíče podle schránky a UID zachovávají otevřené položky při překreslení. Nadpis je Schránky na serveru a odstraněn duplicitní souhrn přijatých zpráv. Prohlížení přímo čte uložené schránky, nevytváří přenosy, nenačítá klientskou kopii a nemění přečtení. Prostředky v124.

Prošlo všech 310 automatických testů, včetně 22 cílených testů poštovního modelu a rozhraní. Dva nové testy ověřují serverový obsah až po přijetí SMTP, zobrazení před načtením do vypnutého klienta, zachování příznaků i probíhajícího přenosu, oddělené klíče zpráv různých schránek a bezpečné escapování předmětu, těla i odkazu. Syntaxe js/mail-ui.js bez chyb.

V prohlížeči při 1074 × 858 px ověřeny dvě výchozí sbalené schránky a rozbalení prázdné schránky. Skutečný e-mail byl dostupný k otevření na serveru po 132 krocích ještě za běžícího SMTP, přičemž místní schránka příjemce zůstala prázdná. Kliknutí na schránku a zprávu zachovalo počet paketů, záznamů, pokus i příznak nepřečtení. Otevření přežilo další kroky, dokončení přenosu i vypnutí serveru. Při doručení druhé zprávy se stejným předmětem zůstala první otevřená a nová byla samostatně sbalená; Enter otevřel druhou, obě zůstaly nepřečtené. Při 320 × 844 px ověřeno všech pět schránek a otevřená připravená dlouhá zpráva s dlouhou URL, bez vodorovného přetékání stránky i detailu. Konzole bez chyb a varování.

## Volitelné služby webu a detail Gmailu bez adres — 19. listopadu 2026, v123

Řádek Služby v detailu webového serveru je v základním zobrazení skrytý. Zobrazuje se až při zapnutí podrobnosti IP a TCP hlavička; obsah dál odpovídá zapnutí TLS / HTTPS. Z detailu poštovního serveru Gmail odstraněn řádek IP adresa a skryt řádek MAC adresa; IP v mapě a adresy přenosů zůstávají. Prostředky v123.

Ověřena syntaxe js/app.js a všechny čtyři kombinace TLS a zobrazení hlaviček v prohlížeči při 1074 × 858 px. Bez hlaviček chybí řádek služeb i při zapnutém TLS, s hlavičkami ukazuje HTTP na TCP/80 a po zapnutí TLS také HTTPS na TCP/443. Úložiště stránky, ovládání certifikátu a IP v mapě zůstávají dostupné podle příslušných voleb. Konzole bez chyb a varování.

V prohlížeči při stejném rozlišení ověřen Gmail se samotným rozšířením E-mail i v úplné sestavě: v detailu chybí oba řádky adres, IP v mapě zůstává 203.0.113.40. Obě schránky, SMTP a IMAP jsou nadále dostupné. Syntaxe js/app.js a konzole bez chyb.

## Skryté pravidlo HTTP cache v detailu serveru — 19. listopadu 2026, v122

Z detailu serveru knihovny skryt řádek Pravidlo HTTP cache. Cache-Control: no-store zůstává v modelových odpovědích a jejich textu, protože načtení webu vždy probíhá přes síť. Prostředky v122.

Ověřena syntaxe js/app.js a rozhraní při 1074 × 858 px v základní a úplné sestavě. Detail neukazuje řádky IP, MAC ani HTTP cache; uložená stránka, služby a rozšířené ovládání HTTPS zůstávají. IP pod serverem v mapě je zachovaná. Web se úspěšně načetl za 34 kroků a jeho skutečná modelová odpověď nadále obsahovala cacheControl no-store i hlavičku Cache-Control: no-store. Konzole bez chyb a varování.

## Detail webového serveru bez IP a MAC adres — 19. listopadu 2026, v121

Z detailu serveru knihovny odstraněn řádek IP adresa a skryt řádek MAC adresa. Úložiště, služby a pravidlo HTTP cache zůstávají zobrazené. IP pod názvem serveru v mapě a adresy používané přenosy zůstávají zachované. Prostředky v121.

Ověřena syntaxe js/app.js a detail v prohlížeči při 1074 × 858 px v základní i úplné sestavě: oba řádky chybí, mapa dál ukazuje 203.0.113.10, uložená stránka a služby zůstaly dostupné. Úplná sestava zachovala HTTPS a ovládání certifikátu. Konzole bez chyb a varování.

## IP adresy pod názvy zařízení v mapě — 19. listopadu 2026, v120

Pod názvy koncových zařízení a routerů přidán menší, méně výrazný řádek s jednou IPv4 adresou. Router přednostně ukazuje svou připravenou adresu, jinak adresu jednoho rozhraní do zapnuté části sítě. Adresa zůstává zobrazená při vypnutí zařízení či odpojení spoje. Chytré křižovatky představující switche dostávají odlišné schematické adresy ze své LAN s vynecháním již použitých adres; tyto adresy se nestávají IP rozhraními switchů. Zapnutí Routery a switche je u switchů skryje. IP koncových zařízení sleduje aktuální kabelové, Wi-Fi či mobilní připojení. Wi-Fi body, BTS, anténa a satelit vlastní adresu v modelu nemají. Popisky skrývají jméno i IP společně; adresa je také v přístupném názvu zařízení. Rozšířeny okraje výřezů pro druhý řádek. Prostředky v120.

Prošlo všech 308 automatických testů. Dva nové testy ověřují platné odlišné adresy v základní, úplné a každé samostatné volitelné sestavě, skutečné adresy rozhraní routerů, skrytí u switchů, aktualizaci klientů, stabilitu při výpadcích a zachování původních IP rozhraní switchů. Po úpravě okrajů znovu prošlo všech 22 testů prezentace křižovatek, mapy, gest a paketů; geometrický test nově zahrnuje prostor pro oba řádky. Syntaxe obou změněných skriptů bez chyb.

V prohlížeči při 1053 × 858 px ověřeny menší IP v základu, všech 75 adres v úplné zjednodušené mapě bez duplicit a bez chybějící adresy křižovatky; po rozlišení zařízení bez IP u switchů a s adresou u každého routeru. Přechod notebooku na Wi-Fi aktualizoval popisek na 192.168.10.11. Přepnutí podrobností během webového přenosu zachovalo stejné objekty modelu, paketů i aktuální události; přenos úspěšně doběhl za dalších 137 kroků. Vypnutý router ponechal svou adresu. Popisky skryly a obnovily oba řádky. V detailním výřezu hostingu se dolní popisky Gmailu a serveru cykloservisu vešly celé. Při 320 × 844 px názvy i IP tří domácích zařízení uvnitř mapy, bez vodorovného přetékání. Konzole bez chyb a varování.

## Detail webového serveru bez seznamu portů — 19. listopadu 2026, v119

Z detailu serveru knihovny odstraněn seznam portů s řádkem eth0 a názvem připojeného zařízení. Odstraněna také nepotřebná výjimka pro tento server ve společném vykreslování portů. IP a MAC adresy, služby, pravidlo HTTP cache, uložená stránka a poslední zpracovaný požadavek zůstávají dostupné. Prostředky v119.

Ověřena syntaxe js/app.js a skutečný detail v prohlížeči při 806 × 743 px před přenosem i po něm. Web se načetl za 34 kroků, detail zobrazil přijatý GET a adresy, seznam portů chyběl v obou stavech. Konzole bez chyb a varování.

## Společná volba Wi-Fi v domácnostech — 19. listopadu 2026, v118

Volba Wi-Fi v domácnostech řídí přístupové body na Lipové, u Matěje a na chatě. Matějův a chatový bod vyžadují současně svou zapnutou oblast. Bez této volby zůstávají domácí notebooky připojené kabelem; chata nově volí kabel také při vytvoření modelu. Kavárna si ponechává vlastní Wi-Fi nezávisle. Dokumentace a prostředky v118.

Prošlo všech 306 automatických testů a kontrola syntaxe obou změněných skriptů. Dva nové regresní testy ověřují skryté body a jejich spoje, odmítnutí nedostupné Wi-Fi, funkční výchozí přístup, samostatnou volbu Wi-Fi bez skrytých domácností, mobilní síť a načtení webu ze všech tří domácností přes kabel i Wi-Fi i nezávisle z kavárny. Přenos z chaty v obou případech prochází satelitem.

V prohlížeči při 806 × 743 px se po přidání Matěje, chaty a kavárny bez Wi-Fi zobrazil pouze bod kavárny. Zapnutí Wi-Fi přidalo tři domácí body a všechny domácí notebooky nabízely funkční bezdrátové připojení se správnou sítí a adresou. Opětovné vypnutí odstranilo domácí body i možnost Wi-Fi; všechny tři notebooky byly připojené kabelem. Samotná Wi-Fi přidala pouze bod na Lipové. Konzole bez chyb a varování.

## Zjednodušení Gmailu a tlačítko nastavení — 19. listopadu 2026, v117

Z horní lišty Gmailu odstraněn počet zpráv a související pomocná funkce i styly. Běžná spodní stavová lišta včetně Zpráva odeslána se již nezobrazuje; chyby zůstávají viditelné jako upozornění. Odstraněn nepotřebný příznak justSent. Vyhledávací pole zůstává zobrazené, ale je pouze pro čtení a mimo pořadí tabulátoru. Počítadla poštovních složek v levém panelu zůstávají. Tlačítko nastavení při otevřeném monitoru nebo detailu zmizí a po zavření se znovu zobrazí na stejném místě mapy. Dokumentace a prostředky v117.

Syntaxe app.js a mail-ui.js bez chyb, všech pět testů rozhraní pošty prošlo. V prohlížeči při 806 × 743 px odeslaná zpráva zůstala v seznamu, horní lišta obsahovala pouze Odeslané a běžná stavová lišta chyběla. Skutečný stisk klávesy nezměnil hodnotu viditelného vyhledávacího pole. Při vypnutém serveru zůstal důvod neúspěchu viditelný s rolí alert. Nastavení mělo před otevřením zařízení, během detailu i monitoru a po jejich zavření shodné souřadnice; při otevřených oknech bylo skryté a po zavření šlo znovu otevřít. Konzole bez chyb a varování.

## Schránky serveru bez odkazů na zařízení — 19. listopadu 2026, v116

Ze všech schránek v detailu serveru Gmailu odstraněn odkaz Otevřít Gmail v zařízení. Prostředky v116. Ověřena syntaxe mail-ui.js, testy rozhraní pošty a v prohlížeči nepřítomnost odkazů při zachování adres a přehledu zpráv.

## Pevní příjemci, křížky aplikací a životnost značek paketů — 19. listopadu 2026, v115

Notebook na Lipové má pevného příjemce matej@gmail.com a Matějův notebook ty@gmail.com. Adresa je zobrazená jako needitovatelný text, odeslání v aplikaci ji odvozuje ze zařízení a model odmítá jiného příjemce. Odpovědět se nabízí pouze na zprávu od povoleného protějšku. Ostatní klienti si ponechávají výběr příjemce a phishingový scénář se nemění. Z detailu serveru Gmailu odstraněn řádek s portem a připojenou chytrou křižovatkou. Gmail má vlastní křížek, prohlížeč i obecná záhlaví aplikací používají křížek místo minimalizace a Instagram má křížek vpravo v záhlaví konverzace. Zavření vrací na plochu a neruší probíhající přenos. Odstraněno spodní tlačítko Prozkoumat paket, jeho obsluhy a styly; ovladače přehrávání zůstávají vpravo. Náhled nadále otevírá kliknutí na paket v mapě. Paket nemá obrys při zaměření. Dřívější výběr paketu jej již nepřidržuje na mapě po doručení. Aktualizována dokumentace a prostředky v115.

Syntaxe upravených skriptů bez chyb, všech 304 testů prošlo. Přibyly testy omezení příjemců, statické adresy i při vypnutém příjemci, odpovídání a regrese vykreslování doručeného vybraného paketu. Poslední test před opravou reprodukoval chybu a po opravě prošel. Dřívější testy jiných zařízení i ztraceného SMTP potvrzení zachovávají pokrytí s povolenými adresami. V prohlížeči ověřeny obě pevné adresy, skutečné odeslání, načtení přes IMAP a příprava odpovědi; zpráva se doručila i po zavření Gmailu. Všech sedm aplikací na notebooku a Gmail či příslušná aplikace ostatních šesti zařízení se zavřely viditelným křížkem. V emulaci 320 × 844 px křížek Gmailu dostupný a pevný příjemce i okno zprávy bez vodorovného přetékání. Kliknutí na paket otevřelo náhled bez obrysu; po zavření náhledu a doručení vybraný paket okamžitě zmizel, na konci přenosu zůstala mapa bez značek paketů. Konzole bez chyb a varování.

## Drobné úpravy Gmailu a nastavení — 19. listopadu 2026, v114

Rozšíření E-mail (Gmail) přejmenováno na E-mail. Z postranního panelu klienta odstraněna adresa účtu a z horní lišty tlačítko Podrobnosti přenosu včetně jeho panelu, souvisejících obsluh a nepoužívaných stylů. Předmět a text nové zprávy již při zaměření nemají modré ohraničení. Aktualizována dokumentace a verze prostředků v114.

Ověřena syntaxe settings.js, mail-ui.js a app.js a všechny tři existující testy rozhraní pošty (viditelnost až po IMAP načtení, Odeslané až po SMTP potvrzení, místní hledání a escapování obsahu). V prohlížeči potvrzen název E-mail, chybějící adresa v postranním panelu i tlačítko a panel podrobností. Při 857 × 743 px obě textová pole i ve stavu focus-visible mají outline-style none, nulový okraj a žádný box-shadow; stránka nepřetéká vodorovně. Konzole bez chyb a varování.

## Gmail bez konceptů — 18. listopadu 2026, v113

Odstraněna složka Koncepty, počítadlo, její prázdné i vyplněné zobrazení, ikona, související styly a ovládání ukládání či zahození konceptu. V Gmailu zůstávají pouze Přijaté a Odeslané, hledání, čtení, odpovědi a Napsat. Okno nové zprávy udržuje pouze právě vyplňovaný formulář; křížek nebo Escape jej vyčistí, stejně jako zavření monitoru a opuštění aplikace. Zrušení formuláře nezasahuje do již zahájeného přenosu. Interní stav přejmenován na mailComposer, odstraněna pomocná příznaková logika konceptu a aktualizována dokumentace. Verze prostředků v113.

Ověřena syntaxe app.js a mail-ui.js a všech 17 testů pošty a jejího rozhraní. V prohlížeči při 1053 × 858 px potvrzeny právě dvě složky Přijaté/Odeslané, nepřítomnost textů a ovládání konceptů a prázdná pole po zavření a opětovném otevření okna nové zprávy. Escape ponechal monitor otevřený a rozepsaný text odstranil; zavření monitoru text také neuchovalo. Následný e-mail se skutečně přenesl, objevil v Odeslaných a Matěj ho načetl přes IMAP do Přijatých. Při 320 × 844 px obě složky i okno zprávy bez vodorovného přetékání a tlačítko Odeslat celé dostupné. Konzole bez chyb a varování.

## Zjednodušené rozhraní Gmailu — 18. listopadu 2026, v112

Klientskou poštu nahrazuje rozhraní ve stylu Gmailu s bočními složkami Doručené, Odeslané a Koncepty, hledáním v místních zprávách, počtem nepřečtených zpráv, seznamem s náhledy a samostatným čtením zprávy. Napsat otevře okno s příjemcem, předmětem, textem, odesláním a zahozením; zavření a Escape zachovají jeden místní koncept každého zařízení. Odpovědět připraví příjemce a Re: bez přepsání již rozepsaného konceptu. Ctrl/Cmd + Enter odešle platný formulář. Technické karty, vysvětlení a rozhovory SMTP/IMAP jsou přesunuty do Podrobností přenosu; podrobnosti společného serveru zůstávají dostupné. Přibyl samostatný gmail.css, Gmail má vlastní velikosti podle šířky aplikace a na úzké obrazovce okno zprávy vyplní aplikaci. Síťový průběh a porty se nemění. Odeslané používají samostatnou místní kopii přidanou až po SMTP potvrzení, doručené nadále vyžadují IMAP.

Prošlo všech 300 automatických testů. Tři nové integrační testy rozhraní ověřují, že zpráva uložená jen na serveru není před IMAP v klientovi vidět, Odeslané čekají na SMTP potvrzení a uchovají nezávislou místní kopii, hledání pracuje s místní poštou a předměty, obsah i koncepty jsou bezpečně escapované. Rozšířen test ztraceného SMTP potvrzení a příznaku dokončené kontroly pošty. Po posledních úpravách popisků a přístupnosti opět prošlo všech 17 testů pošty a jejího rozhraní. Syntaxe všech 27 skriptů ověřena.

V prohlížeči při 1053 × 858 px ověřen prázdný Gmail, uložení a znovuotevření konceptu, odeslání bez předčasné položky v Odeslaných, skutečný SMTP přenos a teprve následná místní odeslaná kopie. Matěj před IMAP zprávu neviděl; poté seznam ukázal nepřečtenou zprávu, čtení spustilo STORE a odpověď předvyplnila adresu i Re:. Escape uchoval koncept a ponechal monitor otevřený, Ctrl + Enter odeslal odpověď přes síť. Hledání zachovalo fokus i pozici kurzoru, rozlišilo nalezený a prázdný výsledek. Při 320 × 844 px notebook i telefon bez vodorovného přetékání; celé okno zprávy, příjemce a tlačítko Odeslat byly dostupné. Koncept se zachoval při přepnutí zařízení, druhé zařízení jej nevidělo a koš jej odstranil. Ověřen panel technických podrobností a odkaz na server. Phishingový e-mail prošel SMTP/IMAP, v novém čtení zůstal odkaz i skutečná adresa a nahlášení odkaz zablokovalo. Konzole bez chyb a varování. Verze prostředků v112.

## Společný Gmail pro oba účastníky — 18. listopadu 2026, v111

Pošta Lipov a Pošta Dopis nahrazeny jediným rozšířením E-mail (Gmail), které automaticky přidá Matějův byt. Všechny běžné klienty obsluhuje společný server Gmail v hostingu se samostatnými schránkami @gmail.com. SMTP na TCP/465 ukládá zprávu přímo do schránky příjemce; IMAP na TCP/993 ji následně načítá. Odstraněn druhý poskytovatel, jeho router, switch, oblast a tři spoje, meziserverové SMTP, vyhledávání DNS MX, odchozí fronty a jejich ruční předávání. Router T zůstává v záložním okruhu přípojky kavárny. Výchozí síť má stále 14 zařízení / 15 spojů; samotný E-mail má 29 / 34 a úplná sestava 84 / 101. Nastavení má 22 rozšíření. Uživatelské názvy aplikace, adresy, výchozí příjemci, přehled společných schránek, výukové profily i dokumentace odpovídají společné službě. Jde výhradně o místní model bez komunikace se skutečným Gmailem.

Prošlo všech 297 automatických testů, včetně 44 cílených testů pošty, nastavení a geometrie mapy, a kontrola syntaxe všech 27 skriptů. Poštovní testy nyní ověřují jediný server, oba směry, uložení před přijetím SMTP potvrzení, samostatné IMAP, vypnutého příjemce a odpojeného odesílatele, výpadek společného serveru a opakování, nepotřebnost DNS MX, zachování přijaté zprávy při ztrátě potvrzení, nezměněné UTF-8 a SEQ, více zpráv a příznaky, Wi-Fi/BTS/satelit/VPN i ochranu obsahu v kavárně. Registrace knihovny nadále používá ukázkovou doménu .test; všech 16 testů autentizace prošlo.

V prohlížeči při 1053 × 858 px ověřena jediná volba pro e-mail a automatické zapnutí Matějova bytu. Přenos od ty@gmail.com k matej@gmail.com použil pouze SMTP klient–Gmail; před kontrolou pošty byla zpráva pouze na serveru. IMAP ji načetlo a samostatné STORE uložilo příznak přečtení. Matějova odpověď dorazila přes tentýž Gmail k odesílateli. Další zpráva dorazila do Matějovy schránky při vypnutém notebooku; po jeho zapnutí vzrostl místní seznam z jedné zprávy na dvě až po IMAP kontrole. Detail Gmailu ukázal obě schránky a přijaté zprávy, bez odchozí fronty a ovládání předání. Na úzké obrazovce 320 × 844 px formulář i nastavení bez vodorovného přetékání. Zapnout vše zobrazilo 84 uzlů a právě jeden Gmail, bez staré oblasti a serveru. Konzole bez chyb a varování. Verze prostředků v111.

## Chytré křižovatky a volitelné routery a switche — 18. listopadu 2026, v110

Přidána společná volba Routery a switche mezi zobrazované podrobnosti, výchozí stav vypnuto. Všechna zařízení typu router a switch mají v tomto stavu společný název Chytrá křižovatka a stejnou zelenou ikonu; přepínají se také jejich detaily, názvy konců spojů a aktuální stav přenosu. Každý původní uzel i spoj zůstává zachován. Zapnutí obnoví původní názvy a ikony, nezmění síťový model ani přenos. MAC, směrovací tabulky a NAT zůstávají samostatnými volbami; ovládání napájení i satelitní přípojky je dostupné také ve zjednodušeném detailu. Uživatelský obsah se nepřejmenovává.

Prošla kontrola syntaxe změněných skriptů a všech 297 automatických testů. Čtyři nové testy ověřují všechna routerová a switchová zařízení, samostatnost volby, totožný průběh webového přenosu včetně hlaviček, časování a síťového stavu a doručení nezměněné uživatelské zprávy obsahující původní názvy zařízení. Cílených 39 testů nastavení a mapy rovněž prošlo.

V prohlížeči při 1053 × 858 px potvrzeno 10 chytrých křižovatek v základní sestavě a všech 56 v úplné síti, shodná ikona i barva, původní názvy a ikony ostatních typů zařízení, napájení a nezávislé zobrazení MAC a směrovací tabulky. Přepnutí oběma směry během webového přenosu zachovalo stejné objekty simulace, aktuální události, fronty a paketů včetně polohy animace a výřezu mapy; následné načtení knihovny uspělo. Na chatě ověřeno odpojení a obnovení satelitní přípojky v detailu chytré křižovatky. Při 320 × 844 px bez vodorovného přetékání, volba dostupná klávesnicí a po potvrzení skutečný nadpis Domácí router. Obnovení stránky vrátilo vypnutou volbu a základních 14 uzlů včetně 10 chytrých křižovatek. Konzole bez chyb a varování. Verze prostředků v110.

## Nastavení bez úvodních a stavových textů — 18. listopadu 2026, v109

Odstraněn popis pod nadpisem Nastavení aplikace, rámeček Základ je vždy zapnutý a textový stav v patě dialogu včetně jeho dynamických variant. Pata obsahuje pouze tlačítko Použít změny. Odstraněny nepoužívané styly, odkaz aria-describedby a aktualizace odebraného stavu; nadpis zůstává přístupným názvem dialogu.

Ověřena syntaxe settings-ui.js a všech 24 testů nastavení. V prohlížeči při 691 × 858 px potvrzena nepřítomnost všech tří částí, návaznost seznamu na panel nástrojů a pata s tlačítkem vpravo. Instagram automaticky zapnul Matějův byt, potvrzení vytvořilo novou sestavu a Základní sestava vrátila 14 zařízení. Při 320 × 844 px žádné vodorovné přetékání, tlačítko celé dostupné; Zapnout vše a potvrzení zobrazily všech 87 zařízení. Escape zahodil nepotvrzenou změnu a opětovné otevření ukázalo uloženou sestavu s neaktivním tlačítkem. Konzole bez chyb a varování. Verze prostředků v109.

## Šířka pásma a latence jednotlivých připojení — 18. listopadu 2026, v108

Do Připojení přidány dvě nezávislé volby Nižší / Vyšší, potvrzované tlačítkem Použít změny. Každý z šesti klientů má vlastní nastavení pro oba směry internetového připojení. Vyšší šířka pásma mění rozestupy segmentů ze tří modelových kroků na jeden a stejný limit se uplatní při předání do internetové přípojky. Vyšší latence přidá šest kroků čekání každému paketu; neobsadí jimi výstup a nevytváří přenos typu odeslat–čekat na doručení. Čekání jsou skutečné přehrávané události. Snímek voleb na začátku pokusu zachovává běžící přenos i po uložení nových hodnot; opakování použije nové. Lokální tisk se nemění. Model neudává Mb/s či milisekundy ani nemění tempo animace, data, TCP SEQ či počet paketů.

Prošlo všech 293 automatických testů včetně šesti nových scénářů porovnávajících přesný obsah a TCP SEQ fotky i videa, rozestupy a dobu dokončení, konstantní posun doručení při vyšší latenci, nezávislou druhou větev Instagramu, změny během pokusu, opakování, validaci a obnovení hodnot, mobilní síť, satelit, VPN a místní tisk. Ověřena syntaxe pěti změněných skriptů. V prohlížeči při 1053 × 858 px potvrzeno, že nepotvrzená volba neovlivní odeslání fotky; uložené nové hodnoty se během pokusu do jeho snímku nepromítnou. Opakovaná fotka při vyšší šířce pásma měla na přípojce rozestupy jeden krok; zvýšení samotné latence posunulo všech devět doručení Instagramu přesně o šest kroků a rozestupy zachovalo. Paket byl během čekání viditelný na domácím routeru. Video dorazilo jako 35 samostatných paketů a úplných 48 000 B. Matějovy volby zůstaly nezávislé.

Při 320 × 844 px zkontrolovány ovládací prvky ve všech šesti klientských zařízeních včetně telefonu a kavárny bez vodorovného přetékání; tlačítko fungovalo klávesou Enter a zachovalo zaměření. Obnovení stránky vrátilo základní sestavu a obě volby Nižší. Konzole bez chyb a varování. Verze prostředků v108.

## Jednotný dosah bezdrátových připojení — 18. listopadu 2026, v107

Přepínač Dosah Wi-Fi přejmenován na Dosah signálu a zpřístupněn také pro sestavy s BTS nebo satelitem. Zapnuté přístupové body, BTS a satelit LEO kreslí kruhový radiální přechod ve vlastním odstínu, s ilustračními poloměry 320, 800 a 900 mapových jednotek. Vrstva leží za spoji, zařízeními a pakety a nezachytává interakce. Rádiové spoje Wi-Fi, telefon–BTS a anténa–satelit–pozemní stanice nemají v mapě čáry, štítky, značky přerušení ani interakční plochy. Modelová propojení a samostatné pakety zůstávají zachované; kabelové přípojky se kreslí dál. Dosah nemění připojení ani rychlost.

Prošlo všech 15 testů geometrie a ovládání mapy a syntaxe obou změněných skriptů. V prohlížeči při 1053 × 858 px ověřena mobilní sestava bez Wi-Fi s dvěma oblastmi BTS, jejich skrytí při vypnutí vysílače a obnovení po zapnutí. Při kroku telefon → BTS byl viditelný a animovaný samostatný paket bez čáry; knihovna se načetla za 34 kroků. V samostatné satelitní sestavě byly oblasti Wi-Fi Chata a LEO; vypnutí a zapnutí LEO skrylo a obnovilo jeho oblast. Detail skrytého satelitního spoje se otevřel ze seznamu portů a po zavření vrátil zaměření na LEO. Kabel router–anténa zůstal. Paket na úseku anténa → LEO byl viditelný a animovaný bez čáry; knihovna dorazila za 54 kroků.

Úplná sestava měla sedm oblastí (čtyři skutečné AP, dvě BTS a LEO) se středy na příslušných zařízeních. Ze 104 modelových spojů se kreslilo 93: všech 11 rádiových spojů zůstalo pouze v modelu. Zachovány obě kabelové přípojky BTS i kabel k satelitní anténě. Vizuálně zkontrolovány přechody i vrstvy. Při 320 × 844 px přepínače uvnitř mapy bez překrytí a vodorovného přetékání; mezerník skryl oblasti, obnovení je vrátilo a změna Popisků je neovlivnila. Obnovení stránky vrátilo základních 14 zařízení, vypnutý a skrytý přepínač a žádné oblasti. Konzole bez chyb a varování. Verze prostředků v107.

## Wi-Fi bez nakreslených spojnic — 18. listopadu 2026, v106

Z mapy odstraněny skupiny spojnic s médiem Wi-Fi: jejich čáry, štítky, značky přerušení i neviditelné klikací plochy. Platí také pro Matěje, chatu, telefon a hotspoty v kavárně. Modelové bezdrátové spoje nadále přenášejí jednotlivé pakety; ilustrační dosah se zobrazuje nezávisle. Kabelové přípojky AP zůstávají zakreslené. Detail Wi-Fi spoje z rozšířeného seznamu portů zůstává dostupný; při zavření se zaměření vrátí na připojené zařízení.

Prošlo všech 15 testů geometrie a ovládání mapy a syntaxe obou změněných skriptů. V prohlížeči při 1053 × 858 px potvrzena absence Wi-Fi skupin i interakčního cíle notebook–AP při zapnutém i vypnutém dosahu; přípojka AP–switch zůstala. Ověřen detail Wi-Fi ze seznamu portů a návrat zaměření na notebook. Při kroku Notebook → Wi-Fi Lipová byl viditelný a animovaný samostatný paket bez čáry; knihovna se načetla za 38 kroků. V úplné sestavě ověřen počet vykreslených spojů odpovídající všem modelovým spojům kromě Wi-Fi, zachované kabely, mobilní i satelitní spoje a vrstva dosahu. Při 320 × 844 px stejné skrytí bez vodorovného přetékání; konzole bez chyb a varování. Verze prostředků v106.

## Zapínatelný ilustrační dosah Wi-Fi — 18. listopadu 2026, v105

Do mapy přidán přepínač Dosah Wi-Fi vedle Popisků, zpočátku vypnutý a dostupný až při přidání některého Wi-Fi bodu. Vrstva za spoji, zařízeními a pakety vykresluje jemný radiální přechod od každého zapnutého AP až do úplné průhlednosti bez obrysu. Z ikony AP odstraněny směrově působící oblouky. Poloměr je pouze schematický; model připojení, dosah, směrování ani přenosovou rychlost nijak nevyhodnocuje. Popis přepínače a README uvádějí ilustrační význam. Napodobený hotspot kreslí oblast pouze při aktivním vysílání. Vrstva je bez interakčních cílů a neblokuje zařízení, spoje ani posouvání mapy.

Prošlo všech 15 testů geometrie a ovládání mapy a syntaxe obou změněných skriptů. V prohlížeči při 1053 × 858 px ověřen skrytý přepínač a žádná oblast v základu; po přidání Wi-Fi dostupný vypnutý přepínač a po kliknutí oblast se správným středem. Vizuálně zkontrolován plynulý přechod, pořadí vrstev a žádné překrytí přepínačů. Otevření zařízení i spoje přes oblast fungovalo. Vypnutí a obnovení AP odstranilo a vrátilo plochu; odpojení jeho přípojky ji ponechalo. Popisky, dosah a přiblížení fungují nezávisle. Přepnutí dosahu během přehrávání zachovalo stejný objekt animace paketu, výřez, stav i běžící přehrávání. Knihovna přes Wi-Fi úspěšně dorazila za 38 kroků. V úplné sestavě byly čtyři oblasti skutečných AP, aktivace napodobeného hotspotu přidala pátou a jeho zastavení ji odstranilo. Středy všech oblastí odpovídaly skutečným polohám zařízení.

Při 320 × 844 px oba přepínače bez překrytí a vodorovného přetékání; přepínání mezerníkem fungovalo. Při 700 × 400 px ovládání uvnitř mapy a bez vodorovného přetékání. Přechod na základní sestavu skryl plochy i volbu, opětovné přidání Wi-Fi zachovalo volbu v rámci stejného otevření. Po obnovení stránky ověřen návrat do základní sestavy s vypnutou vrstvou. Testování zásahu myši potvrdilo zařízení i Wi-Fi spojnici pod plochou. Konzole bez chyb a varování. Verze prostředků v105.

## Rozhodování routerů jako podrobnost směrování — 18. listopadu 2026, v104

Rozhodnutí routeru i hlášení, že zatím žádné rozhodnutí nevzniklo, jsou dostupné až po zapnutí Směrovacích tabulek. Stejná volba už zpřístupňuje směrovací tabulku, rozhraní a připojené spoje. Doplněn její popis v nastavení. Zobrazení samostatné tabulky NAT a ovládání napájení zůstávají nezávislé.

Ověřena syntaxe obou změněných skriptů. V prohlížeči při 1053 × 858 px potvrzen základní domácí router bez rozhodnutí, čekání na rozhodnutí se zapnutými tabulkami a opětovné skrytí po vypnutí volby. Během HTTP přenosu po 12 krocích zapnutí tabulek zobrazilo skutečné rozhodnutí pro paket 1.1 a ponechalo stejný stav pokusu. Zapnuté MAC a NAT bez směrovacích tabulek rozhodnutí neukázaly; NAT zůstal dostupný. Ověřen také Router A a nepřítomnost odkazu na paket. Přenos po dalších 22 krocích úspěšně zobrazil knihovnu. Při 320 × 844 px router s podrobnostmi bez vodorovného přetékání; konzole bez chyb a varování. Verze prostředků v104.

## Rozhodování switchů a Wi-Fi jako podrobnost MAC — 18. listopadu 2026, v103

Rozhodnutí switchů a Wi-Fi přístupových bodů se zobrazuje jen se zapnutými MAC tabulkami. Totéž platí pro hlášení, že zařízení zatím nezpracovalo žádný rámec. Záznamy rozhodnutí již neobsahují odkaz na otevření paketu, ani u routerů, BTS a satelitu. Spodní tlačítko Prozkoumat paket zůstává funkční. SSID přístupových bodů je běžný údaj Wi-Fi síť bez barevného stavového rámečku; vysvětlení jeho funkce zůstalo v Nápovědě. Doplněn popis volby MAC tabulky v nastavení.

Prošlo všech 24 testů nastavení a syntaxe obou změněných skriptů. V prohlížeči při 1053 × 858 px ověřen Wi-Fi bod bez rozhodnutí a tabulky v základu i před prvním přenosem; zapnutí MAC před přenosem ukázalo prázdnou tabulku a čekání na rozhodnutí. Web přes Wi-Fi se načetl za 38 kroků. Po přenosu měly Wi-Fi bod i switch bez MAC skryté rozhodnutí, po zapnutí MAC se bez opakování přenosu ukázalo skutečné rozhodnutí a naučené adresy. Odkaz na paket chybí u Wi-Fi, switche i routeru; hlavní Prozkoumat paket otevřelo náhled. Při 320 × 844 px základní i rozšířený Wi-Fi detail bez vodorovného přetékání; samotné směrovací tabulky rozhodnutí Wi-Fi nezpřístupnily. Konzole bez chyb a varování. Verze prostředků v103.

## Připojení bez ikony nadpisu — 18. listopadu 2026, v102

Odstraněna ikona vedle nadpisu Připojení k síti ve společném okně připojení zařízení. Nadpis je zarovnaný s navazujícím obsahem; odstraněny styly ikony i jejího původního sloupce.

Ověřena syntaxe computer.js. V prohlížeči při 1053 × 858 px potvrzena nepřítomnost ikony u nadpisu, zarovnání s označením používaného připojení, zachování ikon tlačítek a odpojení / obnovení kabelu. Při 320 × 844 px stejné zarovnání a žádné vodorovné přetékání. Konzole bez chyb a varování. Verze prostředků v102.

## Připojení bez úvodní instrukce — 17. listopadu 2026, v101

Z okna Připojení odstraněna věta „Vyber, kudy bude notebook posílat data.“ včetně společné varianty pro telefon a počítač. Nadpis a ikona jsou nyní v jednom svisle vycentrovaném řádku; odstraněny nepoužívané styly podnadpisu.

Ověřena syntaxe computer.js. V prohlížeči při 1053 × 858 px potvrzena nepřítomnost odstavce, zarovnání nadpisu s ikonou, odpojení a obnovení kabelového připojení. Při 320 × 844 px nadpis s ikonou vycentrovaný a bez vodorovného přetékání. Konzole bez chyb a varování. Verze prostředků v101.

## Výběr zařízení a spojnic bez ohraničení — 17. listopadu 2026, v100

Odstraněn obrys zaměřených zařízení a spojnic v mapě, barevné zvýraznění vybraného zařízení i zesílení vybrané spojnice. Zrušeno také zvýraznění zařízení při ovládání klávesnicí v úzkém zobrazení. Výběr a otevírání detailů zůstávají funkční; ostatní ovládací prvky si zachovávají indikátor zaměření.

Prošlo všech devět testů ovládání mapy. V prohlížeči při 939 × 858 px ověřeno kliknutí na domácí router a kabel, stejné výsledné styly vybraného a běžného prvku a návrat zaměření bez obrysu po zavření detailu. Enter znovu otevřel kabel; při 320 × 844 px mezerník otevřel router, Escape vrátil zaměření bez obrysu a bez zesílení kruhu. Tlačítko nastavení při ovládání klávesnicí nadále má viditelný indikátor zaměření. Úzká mapa bez vodorovného přetékání, vizuální kontrola mapy po výběru a konzole bez chyb a varování. Verze prostředků v100.

## Volitelné podrobnosti spojnic, routerů a switchů — 17. listopadu 2026, v99

Základní detail kabelu obsahuje název Kabelové spojení a tlačítko Odpojit / Obnovit spoj. Údaje První konec, Druhý konec, označení portů a Připojená síť jsou dostupné při zapnutí MAC tabulek nebo směrovacích tabulek. U routerů směrovací tabulky zpřístupní také rozhraní s adresami a připojené spoje; u switchů a Wi-Fi přístupových bodů MAC tabulky zpřístupní seznam portů a spojů. Skryty také konkrétní vstupní/výstupní porty v základním přehledu posledního rozhodnutí. Doplněny popisy obou voleb v nastavení.

Nezávisle na podrobnostech zůstává viditelné hlášení o odpojení, vypnutém zařízení na konci nebo zakrytém výhledu antény. Nevybrané připojení Wi-Fi dostává neutrální informaci, že se právě používá jiná cesta. Vysvětlení rádiového přenosu je součástí rozšířeného detailu spoje. Napájení routerů a switchů i odpojování spojů zůstávají dostupné.

Prošlo všech 24 testů nastavení a přenosů; model sítě se nemění. Ověřena syntaxe obou změněných skriptů a existence 33 místních prostředků. V prohlížeči při 939 × 858 px ověřeny všechny čtyři kombinace MAC/směrování, obě zařízení, zachování názvu Kabelové spojení, odpojení/obnova a nefunkční spoj při vypnutém switchi. Ověřeno čekání na Použít změny, zahození změn zavřením nastavení a zachování otevřené spojnice. U Wi-Fi a satelitu ověřeny skryté údaje a správná informace o neaktivním nebo zakrytém spoji; přístupový bod bez portů v základu a s porty při zapnutí MAC. Knihovna se načetla za 34 kroků, základní rozhodnutí routeru a switche neukázala označení portů. Při 320 × 844 px základní i rozšířená spojnice s odpojením bez vodorovného přetékání. Konzole bez chyb a varování. Verze prostředků v99.

## Propojené okruhy páteřních routerů — 17. listopadu 2026, v98

Přidáno sedm skutečně směrujících routerů W, X, Y, Z, AA, AB a AC a osmnáct spojů. Horní, pravá i spodní větev nyní tvoří propojené okruhy. Páteř má v úplné sestavě 29 routerů; po výpadku kteréhokoli jednoho páteřního spoje nebo routeru zůstávají ostatní zapnuté páteřní routery propojené. Dostupnost konkrétní služby dále závisí také na jejím přístupovém uzlu, jediné přípojce a koncovém zařízení. Způsob směrování, stabilní volba stejné metriky, NAT a chování přerušeného pokusu zachovány; ztracená data se automaticky neopakují. Nový pokus použije aktuálně dostupnou cestu.

Sdílené tranzitní routery se zobrazují podle zapnutých rozšíření, aniž by zapínaly cizí služby. Základ má 14 zařízení / 15 spojů, Instagram s Matějem 31 / 36, úplná síť 87 / 104. Nové spoje mají vlastní rozhraní a podsítě /30 v 198.18.0.0/24. Doplněny připravené adresy v README. Výřez celé sítě počítá také se skutečnými polohami právě zapnutých uzlů.

Prošlo všech 287 testů ve 24 souborech. Tři nové testy ověřují dosažitelnost všech zbývajících páteřních routerů při každém jednotlivém výpadku spoje i routeru v základní, úplné a každé samostatně zapnuté sestavě; přenos zprávy a správné TTL při sedmi různých výpadcích; úplné složení devíti paketů fotky přes W po odpojení E–N. Aktualizovány kontroly počtů, trasy mezi Matějem a cloudem i zkouška úplného odpojení bytu přerušením A–B a A–F. Samostatně prošlo 67 cílených testů přenosů, nastavení a páteře a všech 15 kontrol geometrie a ovládání mapy. Další tři přímé modelové pokusy ověřily načtení e-shopu přes Z při vypnutém H, seznam souborů záložního cloudu přes AB/AC při vypnutém K a web z doupěte přes AA při vypnutém P. Všech 104 spojů bez křížení, překrytí s cizím zařízením či oblastí; nejdelší nový úsek má přibližně 552 mapových jednotek, maximum celé mapy je 570 při limitu 600. Syntaxe všech 27 skriptů a existence 33 místních prostředků ověřeny.

V prohlížeči zkontrolována úplná mapa při 1400 × 1050 px a varianta Instagramu při 939 × 858 px. Ověřena okna všech sedmi nových routerů se skutečnými rozhraními a nejméně dvěma spoji. Po odpojení E–N dorazila fotka 12000 B přes W za 109 kroků; po dalším vypnutí E a opakování dorazila přes X, Y a W za 91 kroků. Při 320 × 844 px detail Routeru AA se směrovací tabulkou i základní mapa bez vodorovného přetékání. Základní knihovna se načetla za 34 kroků a po odpojení A–B za 42 kroků přes F. Konzole bez chyb a varování. Verze prostředků v98.

## Datové centrum hostingu se třemi servery — 17. listopadu 2026, v97

Oblast 03 přejmenována na Datové centrum hostingu. V základu obsahuje router, switch a tři samostatně připojené servery: web knihovny, pekárnu a cykloservis. Dva nové servery mají vlastní IP/MAC, porty switche a oddělené úložiště index.html s rozbalovacím náhledem. Weby dalších zákazníků slouží k prohlížení uložených souborů; síťový pokus prohlížeče dál používá knihovnu. DNS, pošta a chatbot zůstávají volitelné. Základ má 14 zařízení / 14 spojů, úplná síť 80 / 86. Rozšířeno vyobrazení budovy a upraveny polohy jejích zařízení; přípojka a vnitřní spoje se nekříží ani nezasahují do cizích zařízení či oblastí.

Prošlo všech 284 testů ve 24 souborech. Nová kontrola ověřuje oddělení souborů zákazníků, skutečné připojení do společného switche, odmítnutí cizích unicastových kopií a nezávislost dostupnosti knihovny na napájení sousedních serverů. Aktualizovány počty základní, DNS a úplné sestavy. Všech šest geometrických testů prošlo také po konečné úpravě výřezu. Syntaxe všech 27 skriptů, vyvážení CSS a existence 33 místních prostředků ověřeny.

V prohlížeči ověřeny všechny tři uložené stránky, nepřítomnost editace, zachování souboru po vypnutí serveru, 14/14 v základu a 80/86 po Zapnout vše. Knihovna se v základu načetla za 38 kroků, s úplným rozšířením včetně DNS/TLS/Cookies za 138 kroků. Vizuální kontrola při 1400 × 1050 a 939 × 858 px; název oblasti je zahrnutý do celkového výřezu. Při 320 × 844 px rozbalený soubor cykloservisu bez vodorovného přetékání. Konzole bez chyb a varování. Verze prostředků v97.

## Porty v základní hlavičce paketu — 17. listopadu 2026, v96

Základní Hlavička paketu nově ukazuje zdrojový a cílový port pro TCP i UDP. Po zapnutí rozlišených hlaviček se porty zobrazují pouze v TCP nebo UDP hlavičce. Ostatní údaje a data se nemění.

Prošlo všech devět testů náhledu paketů, včetně portů HTTP požadavku a odpovědi, UDP/DNS a vnějšího VPN obalu, všech kombinací TTL a rozlišených hlaviček a kontroly, že se porty nezobrazují dvakrát ani v samostatné IP hlavičce. Syntaxe změněného skriptu ověřena.

V prohlížeči ověřen HTTP paket před NATem (51000 → 80) a po NATu (40000 → 80). Přepnutí stejného paketu zachovalo data a přesunulo porty do TCP hlavičky. Při 320 × 844 px základní náhled s rozbalenými MAC nepřetéká vodorovně; konzole bez chyb a varování. Verze prostředků v96.

## Společná a rozlišená hlavička, skládání podle SEQ — 17. listopadu 2026, v95

Základní náhled má obecný nadpis Paket a jedinou Hlavičku paketu: zdrojovou IP, cílovou IP a pořadí 1, 2, 3… v daném směru přenosu. Data i MAC adresy zůstávají dostupné. Původní samostatnou volbu TCP hlavička nahrazuje jeden přepínač IP a TCP hlavička. Po zapnutí oddělí IP a TCP/UDP údaje a zjednodušené pořadí nahradí u TCP skutečným SEQ. UDP nezobrazuje falešné SEQ. Nezávislé TTL zůstává volitelné v obou zobrazeních. Změna podrobností zachovává otevřený paket i přenos a platí až po Použít změny.

Skládání fotek, videí, UTF-8 textů, cloudu, replikace a chatbota nyní používá přímo TCP SEQ s připraveným počátečním číslem proudu. Odstraněna pole offset/end z částí přenosu. Společný přijímací proud zvládá jiné pořadí příchodu, přesné duplicity, shodné překryvy a přetočení 32bitového SEQ, sleduje jedinečně přijaté i souvislé bajty a odmítá rozporná či mimorozsahová data. Pošta používá stejnou kontrolu pořadí chráněných TCP dat a skládá dešifrované části podle jejich SEQ; pomocný offset odstraněn také z jejích dat a metadat. Zjednodušené pořadí se vede samostatně od ID pokusu a při novém segmentovaném přenosu začíná jedničkou. Úplný TCP handshake, ACK ani automatické opakování ztracených dat nejsou přidány.

Prošlo všech 283 testů ve 24 souborech. Šest nových testů ověřuje SEQ včetně příchodu prvního segmentu fotky až jako posledního na obou spojeních, přesné složení, ignorování podvrženého offsetu/pořadí části, skutečný vliv změny SEQ na pořadí bajtů, neúspěch při chybějícím rozsahu navzdory duplicitě a kontrolu SEQ také u šifrované pošty. Aktualizovány testy médií, modelu, replikace, nastavení i náhledu. Samostatně prošlo 64 cílených modelových testů, 33 testů náhledu/nastavení a šest nových testů skládání.

V prohlížeči při 939 × 858 px ověřena přesně třípoložková základní hlavička HTTP i šestého paketu fotky. Po zapnutí rozlišení stejného paketu se ukázalo SEQ 8001, porty a délka 1440 B; data zůstala shodná. Ověřeno čekání na Použít změny, zahození volby zavřením nastavení, samostatné TTL a pokračování přenosu po zavření detailu. Fotka dorazila. Při 320 × 844 px základní i podrobný náhled včetně rozbalených MAC bez vodorovného přetékání. DNS po rozlišení ukázalo UDP hlavičku bez SEQ, TLS TCP hlavičku s chráněnými daty a úspěšné načtení webu. Přes VPN ověřen šestý paket v základním náhledu s pořadím 6, vnější IP/UDP obal, obnovený vnitřní TCP paket se SEQ 8001 a úspěšné doručení fotky. Konzole bez chyb a varování. Syntaxe všech 27 skriptů, vyvážení CSS a existence všech 33 místních prostředků ověřeny. Verze prostředků v95.

## Zjednodušený náhled paketů, volitelné TTL a TCP — 17. listopadu 2026, v94

Základní náhled nyní obsahuje IP adresy, protokol, dostupnou délku modelového paketu, vlastní přenášená data a rozbalovací MAC adresy rámce. TTL a celá TCP hlavička (porty a SEQ) mají dva samostatné přepínače, výchozí stav je vypnuto. UDP hlavička zůstává dostupná. Obsah je viditelný vždy; původní přepínač Obsah paketů odstraněn také s navazujícím skrýváním v přehledu VPN serveru a MITM. Veřejné části TLS, chráněné záznamy TLS/pošty a vnější VPN obaly zůstávají oddělené od čitelného obsahu. Model a časování přenosu se nemění.

Náhled paketu používá obecný nadpis IP paket. Odstraněny směrové názvy a čísla částí, ID pokusu/paketu, stav/poloha, pořadí a rozsahy bajtů fotky, historie NATu, satelitu, VPN i MITM, vysvětlující karty a navigace do zařízení. Historie a tabulky v samostatných oknech zařízení zůstávají dostupné. Vykreslování odděleno do js/packet-ui.js, odstraněna původní speciální VPN a poštovní nápověda i nepoužívané styly.

Prošlo všech 277 testů ve 23 souborech. Devět nových testů pokrývá všechny čtyři kombinace TTL/TCP bez změny dat/hlaviček, výchozí HTTP požadavek a HTML odpověď, data fotky, chybějící popisky/historie i se všemi podrobnostmi, DNS/UDP, MAC podle média, escapování textu a zachování ochrany TLS/VPN/pošty.

V prohlížeči při 939 × 858 px ověřeny všechny kombinace TTL/TCP, čekání na Použít změny, zahození změny zavřením nastavení a zachování stejného otevřeného paketu. Viditelný GET i přijaté HTML jako text, základní DNS datagram a šifrovaná data TLS. U šestého paketu fotky ověřeny vlastní bajty, délka 1440 B, po zapnutí TCP porty a SEQ 8001, bez původních popisků a historie. Fotka dorazila i po prohlížení a změnách podrobností. Při 320 × 844 px náhled s TTL/TCP a rozbalenými MAC i nastavení bez vodorovného přetékání; zavření detailu obnovilo krokování. Z chaty přes satelit a VPN ověřen vnější UDP obal s chráněnými bajty, následný vnitřní HTTP paket bez historie a úspěšné načtení webu za 129 kroků. Konzole bez chyb a varování. Ověřena syntaxe všech 27 skriptů, vyvážení CSS a existence všech 33 místních prostředků. Verze prostředků v94.

## Odebrání přehledu Instagramových paketů z mapy — 17. listopadu 2026, v93

Z levého dolního rohu mapy odstraněn fialový přehled typu zprávy, velikosti, počtu odeslaných a přijatých paketů. Odebrán jeho HTML prvek, vykreslování, nepoužívané importy a styly včetně mobilní varianty.

V prohlížeči při 939 × 858 px doručeno celé video s 35 pakety na každém spojení za 269 kroků, nejvýše osm současných samostatných značek. Přehled se nevyskytuje při přenosu ani po doručení. Při 320 × 844 px ověřeno opakování přenosu, osm viditelných paketů a otevření detailu 1/35 se správným pozastavením a pokračováním po zavření, bez vodorovného přetékání. Konzole bez chyb a varování. Prošlo všech 16 cílených testů médií a Instagramové konverzace, syntaxe aplikace, vyvážení CSS a existence všech 32 místních prostředků. Verze prostředků v93.

## Samostatný přenos každého mediálního paketu — 17. listopadu 2026, v92

Odstraněno společné plánování a zpracování skupin. Každý mediální segment nyní vzniká jako samostatný paket s vlastním ID, TCP SEQ, nejvýše 1 400 B dat, časem odeslání, polohou a stavem doručení. Další paket odchází po třech logických krocích, zatímco dřívější jsou dál na cestě. Instagram po úplném přijetí vytvoří druhou nezávislou sadu paketů. Ukázkový obrázek zmenšen na 12 000 B (9 paketů na spojení) a video na 48 000 B (35 paketů), aby přenos zůstal zvládnutelný bez seskupování. Modelové bajty i místní náhledy zůstávají oddělené. Odstraněny značky skupin, rozbalování členů, společný detail a doprovodné texty/styly; kliknutí otevírá přímo konkrétní paket. Každý mediální paket má vlastní VPN obal, pokud je VPN zapnutá.

Prošlo všech 268 testů. Aktualizované mediální testy ověřují vlastní identity, samostatné bajtové buffery, rozvrh odchodů, souběžné různé polohy i stavy, TCP SEQ a MTU každého paketu, přesné složení obou přenosů, NAT, přerušení a obnovení uložené druhé fáze, opakování a potvrzení přečtení. Testy obousměrného chatu a VPN ověřují nová média i přes tunely obou domácností a správné jednotlivé počítání. Velikost určuje počet paketů i pro větší vstupy, nezávisle na typu obsahu.

V prohlížeči ověřeno osm současně viditelných paketů obrázku na osmi různých místech trasy, bez skupinových značek. Detail paketu 2/9 ukázal 1 400 B dat, IPv4 délku 1 440 B a TCP SEQ 2 401. Poslední paket videa 35/35 měl vlastní ID, 400 B dat, délku 440 B a SEQ 48 601. Obě média dorazila celá; pro video bylo při obou cestách pozorováno 70 samostatných ID, u příjemce funkční přehrávač a potvrzení přečtení. V opačném směru ověřen detail Matěj → Instagram · 1/9. Přes VPN viditelných šest samostatných obalů, detail jednoho vnitřního paketu a úspěšné doručení obrázku. Otevření detailu pozastavuje krokování, po zavření lze pokračovat. Při 1025 × 858 a 320 × 844 px bez vodorovného přetékání, konzole bez chyb a varování. Syntaxe všech 26 skriptů, vyvážení CSS a existence 32 místních prostředků ověřeny. Verze prostředků v92.

## Odebrání přehledu přenosu z Instagramu — 17. listopadu 2026, v91

Z Instagramu odstraněn celý rozbalovací přehled Přenos v síti včetně počtu paketů, podrobností a tlačítka pro přechod do mapy. Odebrány příslušné pomocné funkce, ikona, styly a uchovávání posuvu tohoto panelu. Chat, přílohy, stavy doručení/přečtení a simulovaný přenos používají původní model.

V prohlížeči ověřena nepřítomnost panelu před odesláním, při odesílání i po doručení. Obrázek doručen z notebooku Matějovi za 107 kroků, následných 45 kroků doručilo potvrzení přečtení. Náhled obrázku a pole pro odpověď fungují na obou koncích. Při 1025 × 858 a 320 × 844 px pole pro zprávu navazuje na spodní okraj chatu, konverzace se posouvá a dokument nepřetéká vodorovně. Prošlo všech 9 testů obousměrného Instagramového chatu včetně textu, obrázků/videa, historie, escapování, VPN, výpadků a potvrzení přečtení. Konzole bez chyb a varování, syntaxe obou změněných skriptů a vyvážení CSS ověřeny; všech 32 místních prostředků existuje. Verze prostředků v91.

## Přenos bez hnědého zvýraznění — 17. listopadu 2026, v90

Z mapy odstraněny třídy a styly, které při pohybu paketu měnily spoj na hnědý a při zpracování zvýrazňovaly obrys zařízení. Odebrána i samostatná hnědá varianta satelitních spojů. Pohyb a výběr paketů, ruční výběr zařízení a spojů, značení výpadků a zvláštní styly VPN zůstávají zachované.

V prohlížeči krokován celý HTTP přenos z notebooku (38 kroků) a chaty přes satelit (58 kroků). V každém kroku porovnány skutečné vykreslené barvy, výplně a tloušťky spojů i obrysů zařízení s počátečním stavem: žádná změna vlivem přenosu, žádné zbývající třídy carrying/current. Oba přenosy doručily knihovnu. Potvrzena pokračující animace paketů, modrá satelitní spojnice a zachovaný ruční výběr notebooku. Konzole bez chyb a varování. Prošlo všech 15 cílených testů geometrie a ovládání mapy. Ověřena syntaxe mapy, existence 32 místních prostředků a verze prostředků v90.

## Více routerů a spojnice bez křížení — 17. listopadu 2026, v89

Přidáno 17 skutečných směrujících routerů F–V a 17 krátkých propojů. Úplná síť má 78 zařízení a 84 spojů; základ má 12 zařízení a 12 spojů. Napojení poskytovatelů vede z D přes G do E. Odtud pokračují společné severní a jižní větve a kratší odbočky k jednotlivým oblastem. Hosting je dostupný přes V, dolní náhradní větev vede přes F, cloud a pošta mají rozdělenou větev přes R a kavárna přes U. Routery volitelných větví se zobrazují pouze při zapnutí služeb, které je potřebují. Nové úseky mají nezávislé sítě /30 a samostatná rozhraní. Opraveny návratové směry k WAN sítím Matěje, kavárny a doupěte po přesunu jejich přípojek. Pro odstranění místních křížení změněna také poloha domácího AP/tiskárny, BTS Park a mobilního jádra; připojení i jejich funkce zůstávají zachované. Popisek odpojeného propoje D–G leží uprostřed nového krátkého úseku.

Prošlo všech 268 testů ve 22 souborech. Geometrie kontroluje všech 84 spojů současně včetně nevybraných přístupových spojů: žádné křížení, překrývající se úseky ani průchod přes obrys cizího zařízení nebo cizí oblast. Nejdelší úsek má 570 jednotek mapy; každý je kratší než 600. Výřezy obsahují všechna zařízení v základu, úplné síti i každém samostatném rozšíření. Nové modelové testy ověřují nepřekrývající se podsítě a neporušená rozhraní, skutečné předání přes nové routery včetně TTL, dolní náhradní cestu, výpadek V a nezávislý výpadek Instagramové větve. Stávající testy služeb, NAT, VPN, DNS/TLS/Cookies, přenosů souborů, pošty a výpadků prošly. Po konečné úpravě popisku opět prošlo 18 cílených testů topologie, geometrie a ovládání mapy.

V prohlížeči ověřena základní sestava 12/12 a HTTP načtení knihovny za 38 kroků přes V. Samostatný Instagram má 24/25 a doručil text za 65 kroků. V úplné síti otevřeno všech 17 nových routerů s platným názvem a nejméně dvěma dostupnými rozhraními; vypnutí a zapnutí V funguje. Z přímo vykreslených SVG koncových bodů zkontrolováno všech 84 spojů bez křížení a dlouhých úseků. Vizuálně ověřeno při 1400 × 1050 a 853 × 858 px, při 320 × 844 px dostupné přiblížení a detail routeru bez vodorovného přetékání; konzole bez chyb a varování. Syntaxe všech 26 skriptů a existence všech 32 místních prostředků ověřeny. Verze prostředků v89.

## Rozšířené rozložení městské sítě — 17. listopadu 2026, v88

Routery A–D rozestoupeny ve větší oblasti města Lipov, router E posunut vpravo. Hosting a ostatní volitelné oblasti mají samostatná místa kolem městské sítě. Polohy zařízení, dekorací a hranice výřezů vycházejí ze společného popisu rozložení. Propojení, adresy, směrování ani časování modelu se nemění; animace paketů používají nové koncové body spojů. Celá síť přizpůsobuje výřez právě zapnutým oblastem.

Prošlo všech 262 testů ve 21 souborech. Tři nové geometrické kontroly pokrývají routery včetně jejich obrysů mimo cizí oblasti, všech 67 spojů s odstupem od cizích oblastí a zahrnutí všech zařízení do základního i úplného výřezu. Devět testů ovládání mapy ověřuje přiblížení, oddálení, posun a gesta v obou poměrech stran.

V prohlížeči vizuálně ověřena základní sestava (10 zařízení / 10 spojů), samostatný Instagram s Matějovým bytem (18 / 19) a úplná síť (61 / 67), včetně městského výřezu. Všechna vykreslená zařízení i konce spojů odpovídají souřadnicím modelu. Knihovna se v základu načetla za 34 kroků, animace odpovědi sledovala nový spoj server–switch. Instagram doručil zkušební zprávu za 45 kroků. Při 1400 × 1050, 853 × 858 a 320 × 844 px byly dostupné přepínače měřítek a přiblížení, bez vodorovného přetékání dokumentu. Běžné načtení a ovládání bez chyb a varování konzole. Syntaxe všech 26 skriptů a existence všech 32 místních prostředků ověřeny. Verze prostředků v88.

## Odebrání poznámky o velikosti paketů — 17. listopadu 2026, v87

Z detailu datových paketů odstraněn odstavec začínající V tomto porovnání nese datový paket nejvýše 1400 B aplikačních dat. V náhledu ověřen paket Instagram → Matěj · 1/1: odstavec chybí, údaje IPv4, TCP, pořadové číslo a velikost dat segmentu zůstávají dostupné. Konzole bez chyb a varování. Ověřena syntaxe skriptu a existence všech 32 místních prostředků, verze prostředků v87.

## Cookies jako volitelné rozšíření — 17. listopadu 2026, v86

Přidán samostatný přepínač Cookies, ve výchozí sestavě vypnutý. Bez něj model neposílá Cookie/Set-Cookie, nevytváří návštěvnická ID, záznamy návštěv ani přihlašovací cookie/relace. Vynechá rozpoznávání i doprovodné texty událostí. Přehledy cookies, jejich ovládání a odkazy jsou skryté v prohlížeči i na webovém serveru. Uložený soubor knihovny, načtení i formulář zůstávají funkční. DNS, TLS a Cookies jsou nezávislé volby. Můj účet a Soukromí vyžadují Cookies i TLS; samotné TLS může pracovat bez cookies. Reklamní partner automaticky vyžaduje také Cookies a panel uvádí návaznost. Použití této volby vytváří nový model stejně jako ostatní rozšíření.

Prošlo všech 259 testů modelu. Pět nových testů pokrývá osm kombinací DNS/TLS/Cookies včetně opakovaného GET a POST, chybějících hlaviček/ID a prázdných relací, ignorování případných starších hodnot cookies při vypnutém rozšíření také přes VPN, rozdíl mezi vypnutým rozšířením a zákazem v prohlížeči, dostupnost účtu a Soukromí jen s Cookies+TLS a automatické zapnutí cookies s rozpoznáním reklamního profilu na dvou webech. Stávající testy cookies, autentizace, soukromí i ostatních služeb prošly.

V prohlížeči ověřena výchozí vypnutá volba a nepřítomnost cookies v detailu serveru, menu prohlížeče i výsledných událostech. Knihovna i vzkaz bez cookies dorazily přes HTTP za 34 kroků. Po použití Cookies se objevily přehledy a cookie navstevnik=v1; opakované načtení použilo stejné ID se dvěma návštěvami. Se současným TLS se objevily přihlašovací cookie, Můj účet a Soukromí. Po vypnutí Cookies samotné HTTPS dál načetlo knihovnu za 90 kroků bez přehledů, účtu a Soukromí. Ověřeno čekání na Použít změny a automatická závislost reklamního partnera. Při 853 × 858 a 320 × 844 px dialog nepřetéká vodorovně a volba i použití změn jsou dostupné, konzole bez chyb a varování. Syntaxe všech 26 skriptů a existence 32 místních prostředků ověřeny. Verze prostředků v86.

## Stránka uložená na webovém serveru — 17. listopadu 2026, v85

Zrušen editor nadpisu i jeho ukládací akce. Místo něj detail webového serveru ukazuje Uložené soubory, složku knihovna.test a rozbalovací soubor index.html. Otevření zobrazí náhled značky knihovny, nadpisu a úvodního textu bez možnosti úpravy. Vysvětlení cesty server → odpověď → kopie v prohlížeči je ve sbalené Nápovědě.

Obsah souboru je zdroj v modelovém úložišti serveru. Při zpracování požadavku se kopíruje do odpovědi, která nyní obsahuje modelové HTML s Content-Type text/html. Prohlížeč používá přijatou kopii také pro značku a úvodní text, ne živá serverová data. Pozdější změna serverového modelu nepřepíše již připravenou odpověď ani přijatý dokument. Soubor je přítomný před prvním načtením a přežije vypnutí serveru; úložiště je stejně jako celá síť součástí lokální simulace v paměti.

Prošlo všech 254 testů modelu. Čtyři nové testy ověřují přítomnost souboru a zachování po vypnutí, HTTP/HTTPS doručení nezávislé kopie včetně HTML a jeho délky/ochrany, snímek obsahu při přípravě odpovědi a escapování uloženého textu i vzkazu. Stávající testy ověřily také karty/historii, formuláře, cookies, TLS, MITM a ostatní služby.

V prohlížeči ověřeno otevření souboru a shodný obsah v náhledu i notebooku, neexistence editoru, zachování souboru i rozbalení při vypnutí zařízení, selhání nového požadavku při vypnutém serveru a úspěšné načtení po zapnutí. Ověřeno HTTP i HTTPS a doručení vzkazu knihovně, dostupnost nastavení certifikátu se zapnutým TLS. Při 853 × 858 a 320 × 844 px čitelný náhled bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe všech 26 skriptů, vyvážení CSS bloků a existence 32 místních prostředků. Verze prostředků v85.

## Odebrání odkazů z webového serveru — 17. listopadu 2026, v84

Z detailu webového serveru odstraněn odkaz Otevřít prohlížeč na notebooku, skupina odkazů na prohlížeče pod cookies a šipka pro otevření spoje Hosting — web. Odstraněny nepoužívané styly skupiny odkazů. Port eth0, název switche, napájení, úprava obsahu a nápověda zůstávají dostupné.

V prohlížeči ověřeno odstranění všech tří prvků v základní i úplné sestavě s TLS, zachování nastavení certifikátu při zapnutém TLS a funkční uložení změněného nadpisu včetně jeho skutečného načtení přes HTTP do notebooku. Při 853 × 858 a 320 × 844 px bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe skriptu, vyvážení CSS bloků a existence všech 32 místních prostředků. Verze prostředků v84.

## TLS jako volitelné rozšíření — 17. listopadu 2026, v83

Přidána samostatná volba TLS / HTTPS, výchozí stav je vypnuto. Základní web i formulář knihovny nyní používají HTTP na TCP/80, bez TLS handshake a certifikátu. Zapnutí přidá výchozí HTTPS odkazy, handshake, ověření certifikátu a chráněné záznamy na TCP/443. DNS zůstává nezávislé. Adresní řádek, historie, opakování i partnerské a podvodné weby používají skutečný protokol pokusu. Webový server a prohlížeč bez TLS nenabízejí certifikát, Secure cookie ani zabezpečené přihlášení/Soukromí; bezpečné operace se neposílají čitelně. Kavárna bez TLS nabízí pozorování a změnu HTTP, s TLS i oba HTTPS pokusy. Reklamní partner automaticky vyžaduje TLS pro Secure cookie a návaznost je uvedena v nastavení. Připravená ochrana pošty a správcovských spojení a samostatný VPN scénář nejsou touto webovou volbou změněny.

Prošlo všech 250 testů modelu. Šest nových testů ověřuje všechny čtyři kombinace DNS/TLS včetně formuláře, portů, druhů paketů a čitelnosti dat; platné/neplatné certifikáty; historii a opakování všech webů; závislost reklamy; MITM s TLS i bez něj; odmítnutí zabezpečených operací přes HTTP. Upraveny starší testy HTTPS pro explicitně zapnuté rozšíření. Bez DNS vznikají dva HTTP pakety, se zapnutým TLS pět paketů handshake a HTTPS; zapnuté DNS přidá dotaz a odpověď. Počet zařízení zapnutí TLS nemění.

V prohlížeči ověřeno načtení knihovny se všemi čtyřmi kombinacemi DNS a TLS. Základní HTTP načtení i odeslání vzkazu bez DNS mají 34 kroků; HTTPS bez DNS má 90 kroků, s DNS 124. Bez TLS chybějí přepínače protokolu a zabezpečené části knihovny; po zapnutí jsou dostupné a spojení je označeno jako šifrované. Změna certifikátu na prošlý způsobila selhání nového HTTPS načtení se zachováním starší stránky. Změny se projeví až po Použít změny, reload obnovuje vypnuté TLS. Ověřeny omezené volby MITM bez TLS a automatická závislost reklamního partnera. Konzole bez chyb a varování, syntaxe všech 26 skriptů a existence 32 místních prostředků ověřeny. Při šířce 320 px má dialog dostupnou volbu TLS i tlačítko Použít změny a nepřetéká vodorovně. Verze prostředků v83.

## DNS jako volitelné rozšíření — 17. listopadu 2026, v82

DNS server je samostatná volba mezi zařízeními a službami, výchozí sestava jej nemá. Obsahuje nyní 10 zařízení a 10 spojů. Názvy webů a nabízené odkazy zůstávají funkční díky připraveným adresám, bez DNS událostí, paketů a naplňování cache. Po zapnutí DNS se objeví jeho uzel/spoj v hostingu a běžné dotazy i odpovědi A/MX s cache. Výpadek napájení či spoje zapnutého DNS tuto zkratku neaktivuje. Vynechání funguje i pro vložený reklamní požadavek a poštovní MX při předání i opakovaném předání mezi poskytovateli. Změna volby nadále podléhá společnému tlačítku Použít změny.

Prošlo všech 244 testů. Čtyři nové testy ověřují HTTP/HTTPS formulář se zachovaným obsahem také přes VPN, zapnuté DNS a cache včetně selhání vypnutého serveru, samostatné vyhledání reklamního partnera a SMTP předání s DNS MX i bez něj. Upraveno očekávání základní topologie a nepřítomnosti DNS přenosů.

V prohlížeči základní sestava bez DNS načetla knihovnu z původního odkazu https://knihovna.test/ za 90 kroků, s původním nadpisem a bez DNS událostí. Po zaškrtnutí DNS a použití změn se objevil server i popisek WEB · DNS; stejná knihovna se načetla za 124 kroků včetně DNS dotazu a odpovědi. Základní popis v nastavení i nápověda hostingu odpovídají výběru. Ověřena syntaxe změněných skriptů a verze prostředků v82.

## Odebrání popisku cesty připojení — 17. listopadu 2026, v81

Ze společného přehledu připojení odstraněn popisek Kabel → switch → domácí síť včetně jeho variant pro Wi-Fi a mobilní data. Odstraněn také nepoužívaný styl connection-path. Stav připojení, IP adresy a ovládací prvky zůstávají.

V prohlížeči ověřeno kabelové i Wi-Fi připojení notebooku a mobilní připojení telefonu: bez popisku, se správnými IP adresami a stavem připojení. Konzole bez chyb a varování. Ověřena syntaxe skriptu a aktualizována verze prostředků na v81.

## Odebrání odkazů na mapu z připojení — 17. listopadu 2026, v80

Z aplikace Připojení odstraněna tlačítka Sledovat síť v mapě a Prohlédnout připojení v mapě. Společná změna platí pro notebook, telefon, Matějův notebook, chatu a doupě; tlačítko Sledovat síť v mapě odstraněno také z kavárenské varianty připojení. Odstraněna nepoužívaná proměnná pro odkaz na přístupový spoj.

V prohlížeči ověřena nepřítomnost obou odkazů ve všech šesti variantách připojení, zachování ovládání připojení a VPN, odpojení i opětovné připojení notebooku kabelem. Konzole bez chyb a varování. Ověřena syntaxe obou změněných skriptů a aktualizována verze prostředků na v80.

## Volitelné části a podrobnosti — 17. listopadu 2026, v79

Přidáno vždy dostupné nastavení s 20 samostatnými rozšířeními a čtyřmi přepínači podrobností. Základní sestava obsahuje 11 zařízení a 11 spojů pro otevření webu. Automatické návaznosti ukazují, která volba součást vyžaduje. Telefon bez mobilní sítě přidá Wi-Fi, samotná mobilní síť domácí Wi-Fi nevyžaduje. Vypnuté oblasti nemají viditelné budovy, uzly, spoje, DNS záznamy ani dostupné aplikace/příjemce a nesměrují provoz. Celá síť přizpůsobuje výřez zapnutým oblastem.

Změny se použijí společně tlačítkem Použít změny. Změna sestavy zruší starý pokus, časovač i asynchronní výpočet a vytvoří výchozí data nové sítě; samotná změna podrobností zachová současný pokus. Zavření nastavení změny zahodí. Přehrávání během otevřeného nastavení stojí a po zavření se obnoví, pokud předtím běželo. Nastavení není ukládané; nové načtení obnoví základ.

- Všech 240 testů modelu prošlo, včetně devíti nových testů základního HTTPS webu, závislostí, jednotlivých rozšíření a nezměněného chování se skrytými podrobnostmi.
- V prohlížeči ověřeno HTTPS načtení knihovny v základní sestavě (124 kroků), pouze Prohlížeč/Připojení na ploše a pouze Knihovna v záložkách. Přidání Instagramu přidá Matějův byt, ale mapa se nemění před použitím změn. Zapnout vše obnoví všech 61 zařízení a 67 spojů.
- Zkontrolováno všech 61 oken bez chybějícího názvu, také se všemi čtyřmi podrobnostmi vypnutými. Ověřeno skrytí MAC/směrovací tabulky a NAT, zachování adres/portů a skrytí bajtů TLS. Zapnutí podrobností při otevřeném paketu zachovalo jeho číslo a pokus, pouze doplnilo obsah a tabulky.
- Samostatně zapnutý e-shop se načetl bez reklamního požadavku, reklamního bloku a odkazu na vypnuté Zprávy. Samostatná kavárna nemá nabídku napodobeného hotspotu. Telefon bez BTS má pouze Wi-Fi/odpojení, bez vypnutých voleb VPN/NAT.
- Ověřeno zahazování změn křížkem i Escape, obnovení základní sestavy po reloadu bez localStorage/sessionStorage a změna sestavy během přehrávání bez pozdějšího pokračování starého časovače. Při 853 × 858 a 320 × 844 px dialog nepřetéká vodorovně, má posuvný obsah a dostupné použití změn. Opraveno překrytí nastavení a zavírání monitoru na úzké obrazovce.
- Konzole bez chyb a varování, ověřena syntaxe všech skriptů a existence všech místních prostředků. Aktualizována verze prostředků na v79.

## Odebrání adresy knihovny — 17. listopadu 2026, v78

Z patičky webu knihovny odstraněn text Lipov · Školní 12. Odkaz Soukromí zůstává zarovnaný vpravo. Ověřeno odstranění textu ze zdroje, zachování odkazu, zarovnání patičky a syntaxe skriptu. Aktualizována verze prostředků.

## Zjednodušení detailu paketu — 17. listopadu 2026, v77

Z detailů paketů odstraněno oznámení Přenos je pozastavený a dekorativní ikona vedle nadpisu, včetně varianty VPN. Ze společného záhlaví odstraněny zbývající šipka zpět a popisek Pod lupou; odstraněna jejich nepoužívaná historie navigace a styly. Zavírací křížek, údaje paketů a ovládání skupin zůstávají.

V rozhraní ověřen DNS dotaz s IP/UDP údaji a VPN paket s vnějším obalem. Otevření detailu nadále pozastaví přenos: během čekání se stav nezměnil, po zavření se dříve přehrávaný přenos automaticky rozběhl a dříve ručně pozastavený zůstal pozastavený. Znovu otevřeno všech 61 zařízení bez chybějících názvů a chyb po odstranění společného záhlaví. Při 853 × 858 a 320 × 844 px bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe skriptu, odstranění nepoužívaných prvků, vyvážení CSS bloků a existence 29 místních prostředků, aktualizována verze prostředků.

## Odebrání mapy z podrobností prohlížeče — 17. listopadu 2026, v76

Z panelu Síťový přenos odstraněno tlačítko Sledovat v mapě ↗. Pokud není dostupný aktuální paket, nevytváří se ani prázdný řádek akcí. V prohlížeči ověřeno otevření a zavření panelu, nepřítomnost tlačítka mapy a zachování tlačítka Prozkoumat aktuální paket včetně funkčního otevření detailu. Konzole bez chyb a varování. Syntaxe skriptu ověřena, aktualizována verze prostředků.

## Čistší obrazovka načítání prohlížeče — 17. listopadu 2026, v75

Z obrazovky načítání odstraněn odkaz Sledovat průběh přenosu. Ze spodní lišty odstraněn popis fáze přenosu a odkaz Sledovat v mapě; zbývající Podrobnosti jsou zarovnány vpravo. Podrobné fáze zůstávají v rozbaleném síťovém panelu. V prohlížeči ověřena nepřítomnost všech tří označených prvků, otevření a zavření Podrobností a úspěšné dokončení HTTPS načítání na notebooku i telefonu. Rozložení ověřeno při 853 × 858 a 320 × 844 px bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe skriptu, aktualizována verze prostředků.

## Odebrání odkazu na připojení telefonu — 17. listopadu 2026, v74

Z oken BTS odstraněno tlačítko Připojení telefonu ↗. V prohlížeči ověřena jeho nepřítomnost u BTS Lipová i BTS Park a zachování obou portů, napájení a sbalené nápovědy. Konzole bez chyb a varování. Syntaxe skriptu ověřena, aktualizována verze prostředků.

## Odebrání šipek u portů BTS — 17. listopadu 2026, v73

Ze seznamu portů obou BTS odstraněna tlačítka otevření připojených spojů. V prohlížeči ověřeny BTS Lipová i BTS Park: oba porty, názvy protějších zařízení a kontrolky zůstávají, šipky chybějí. Sbalená nápověda a odkaz na připojení telefonu jsou zachovány a dříve odstraněný stavový panel se nevrací. Konzole bez chyb a varování. Syntaxe skriptu ověřena, aktualizována verze prostředků.

## Odebrání poznámky mobilního spoje — 17. listopadu 2026, v72

Z detailů obou mobilních spojů odstraněn celý vysvětlující panel Mobilní data · rádio. V prohlížeči ověřena nepřítomnost panelu u spojů telefonu s BTS Lipová i BTS Park, zachování nadpisu, obou konců, sítě a ovládání odpojení/obnovení. Ověřeno odpojení a opětovné připojení spoje i zavření okna. Při 731 × 858 px bez vodorovného přetékání, konzole bez chyb a varování. Syntaxe skriptu ověřena, aktualizována verze prostředků.

## Odebrání panelu vybrané BTS — 17. listopadu 2026, v71

Z oken obou BTS odstraněn stavový panel Telefon má vybranou tuto BTS / Telefon tuto BTS právě nepoužívá s opakovaným názvem stanice. V prohlížeči ověřeno odstranění panelu u BTS Lipová i BTS Park, zachování názvu, napájení, obou portů, odkazu na připojení telefonu a sbalené nápovědy. Ověřeno vypnutí a zapnutí BTS a zavření křížkem. Při 731 × 858 px bez vodorovného přetékání, konzole bez chyb a varování. Syntaxe skriptu ověřena, aktualizována verze prostředků.

## Vysvětlení zařízení v rozbalovací nápovědě — 16. listopadu 2026, v70

Obecné popisy a výukové poznámky v informačních oknech zařízení jsou přesunuty do jedné výchozí sbalené položky Nápověda dole v okně, s texty seskupenými podle tématu. Zahrnuty switche, routery a NAT, Wi-Fi, mobilní a satelitní síť, DNS, web, cookies, přihlášení a soukromí, pošta, Instagram, cloud, chatbot, reklama a podvodný web. Přesouvají se pouze výslovně označená vysvětlení. Smíšené bloky byly rozděleny, aby aktuální WAN adresa, stav satelitní cesty, platnost certifikátu a počet reklamních požadavků zůstaly viditelné. Rozhodnutí, tabulky, prázdné stavy, data a ovládání zůstávají v hlavním náhledu. Při aktualizaci stejného okna se zachovává rozbalení nápovědy i dalších podrobností.

V rozhraní znovu otevřeno všech 61 zařízení. Z 54 informačních oken má 53 sbalenou nápovědu; tiskárna nemá obecný vysvětlující text. Všechny označené poznámky jsou uvnitř nápovědy, žádné tlačítko ani formulář do ní nebyly přesunuty. Ověřeno otevření Enterem, zavření, zachování rozbalení při vypnutí a zapnutí a současně s podrobnostmi rozhraní routeru. Místní tisk uspěl, rozhodnutí a naučená MAC zůstaly viditelné a otevřená nápověda přežila všechna krokování. Na webovém serveru ověřeno uložení nového nadpisu i dostupnost certifikátu, Secure cookie, přepínačů soukromí a účtů; u reklamy viditelný počet požadavků a u cloudu synchronizace, stav a soubory. Rozbalování a rozložení ověřeno při 814 × 858 a 320 × 844 px bez vodorovného přetékání, včetně dlouhé nápovědy webového serveru. Konzole bez chyb a varování. Ověřena syntaxe šesti upravených skriptů a místní prostředky, aktualizována dokumentace a verze prostředků.

## Jednotné čisté záhlaví všech zařízení — 16. listopadu 2026, v69

Ze společné šablony oken zařízení odstraněny ikona u názvu, menší podnadpis a stav Zapnuto/Vypnuto s barevnou tečkou. V oknech všech zařízení se již nezobrazuje šipka zpět ani popisek záhlaví. Tlačítko napájení je jednotně vpravo. Odstraněny nepoužívané styly a podmínky podle typu zařízení; ikony přímo v mapě zůstávají.

V rozhraní otevřeno všech 61 zařízení: 54 informačních oken a 7 monitorů počítačů či telefonu. V žádném nezůstaly požadované prvky; názvy, napájení a zavření jsou dostupné. U devíti zástupců různých typů ověřeno vypnutí a opětovné zapnutí bez návratu odstraněných prvků. Při 814 × 858 a 320 × 844 px bez vodorovného přetékání; na úzké obrazovce ověřeny Wi-Fi, webový server, BTS a domácí router. Úspěšně proveden místní tisk, otevření detailu paketu a následné okno tiskárny. Detail paketu si zachovává vlastní záhlaví i návrat. Konzole bez chyb a varování. Ověřena syntaxe skriptu a existence 29 místních prostředků, aktualizována verze prostředků.

## Zjednodušení okna satelitní antény — 16. listopadu 2026, v68

Z okna satelitní antény odstraněny ikona, podtitulek, stav Zapnuto/Vypnuto s barevnou tečkou, šipka zpět, text Uvnitř sítě, oba odkazy na připojené spoje a odkaz na notebook na chatě. Název, napájení, nastavení výhledu, výukové informace, rozhodnutí a oba porty s kontrolkami zůstávají. V rozhraní ověřena nepřítomnost všech označených prvků, vypnutí a zapnutí antény, zakrytí a obnovení výhledu s odpovídající změnou dostupnosti satelitní cesty a zavření křížkem. Změna je omezena na uživatelský terminál; satelit LEO si zachovává své ovládací prvky a router svůj stav napájení. Při 814 × 858 px bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe skriptu, aktualizována verze prostředků.

## Zjednodušení okna routeru — 16. listopadu 2026, v67

Z oken routerů odstraněna ikona u názvu, podtitulek, šipka zpět, text Uvnitř sítě a tlačítka otevření připojených spojů. Stav napájení, ovládání, seznam portů, směrovací tabulka a NAT zůstávají. V rozhraní ověřeno všech 20 routerů, vypnutí a zapnutí domácího routeru i zavření okna. Předchozí zjednodušení switchů zůstává; přístupové body si zachovávají své ikony, podtitulky i odkazy. Při 814 × 858 px bez vodorovného přetékání, konzole bez chyb a varování. Ověřena syntaxe skriptu a existence všech 29 místních prostředků, aktualizována verze prostředků.

## Zjednodušení okna switche — 16. listopadu 2026, v65–66

Z oken switchů odstraněna šipka zpět, text Uvnitř sítě, ikona u názvu, podtitulek Ethernet · přepínání rámců, stav Zapnuto/Vypnuto s tečkou a tlačítka otevření spojů v seznamu portů. Názvy portů, protější zařízení a jejich stavové kontrolky zůstávají. V rozhraní ověřeno všech 12 switchů, vypnutí a opětovné zapnutí domácího switche, zachování MAC tabulky a výukového obsahu a předchozí úpravy tiskárny. Při 814 × 858 px bez vodorovného přetékání. Konzole bez chyb a varování, syntaxe skriptu ověřena. Aktualizována verze prostředků.

## Obousměrná konverzace s Matějem — 16. listopadu 2026, v64

Matějův chat má stejné psaní a volby Text, Obrázek a Video. Každé zařízení uchovává vlastní rozepsaný text a volbu přílohy. Oba směry používají skutečný modelový přenos: klient → Instagram → příjemce, s novými pakety, samostatnými klientskými porty, NAT a případně VPN. Matěj odpovídá do zařízení poslední doručené zprávy, výchozí je notebook na Lipové. Ve všech směrech funguje čekání na serveru při odpojení příjemce a samostatné potvrzení přečtení. Zprávy zůstávají v historii zařízení, která je odeslala nebo plně přijala; obsah ani náhled přílohy se příjemci neukáže před dokončením přenosu. Historie ukládá metadata příloh, nikoli další kopie jejich modelových bajtů. Popisky serveru, paketů a mapy sledují aktuální směr.

Prošlo všech **231 automatických testů**, včetně devíti nových scénářů obousměrného chatu: porty a překlady NAT, střídání zpráv a potvrzení, obě přílohy a přesné složení bajtů, viditelnost obsahu a escapování, odpověď na telefon, výpadek a nové doručení, VPN obou domácností, zpožděné potvrzení a odmítnutí neplatného cíle. Původní scénáře webu, pošty, cloudu, reklamy, bezpečnosti a přístupových sítí zůstávají úspěšné.

V rozhraní ověřena výměna textových zpráv v obou směrech, vlastní rozepsané texty a typy příloh, historie čtyř zpráv včetně Matějova obrázku a přehratelného videa a potvrzení přečtení zpět. Odpověď se po zprávě z telefonu skutečně vrátila do telefonu. Ověřen přehled Matěj → Instagram → Ty a odpovídající počty paketů. Při 320 × 844 px má telefon obsah 252/252 px bez vodorovného přetékání a dostupné psaní i všechny tři volby; vzhled ověřen také při 814 × 858 px. Dvě doručená videa zachovala po aktualizaci rozhraní samostatné pozice 0,5 s a 1,5 s i pozastavení. Odstraněné akce záhlaví a údaj o bajtech se nevracejí. Konzole bez chyb a varování. Ověřena syntaxe všech 24 skriptů a 29 místních prostředků, aktualizována dokumentace a verze prostředků.

## Kratší výchozí zpráva Instagramu — 16. listopadu 2026, v63

Výchozí text změněn na „Čau Matěji! Nechceš zítra po škole vyrazit ven?“. Společná konstanta předvyplňuje notebook, telefon i notebook na chatě. Nový text má 52 B v UTF-8; údaj aktualizován v dokumentaci. Dlouhý text pro testy segmentace oddělen od uživatelské ukázky, aby nadále pokrýval více paketů. Prošlo všech 28 testů modelu a kontrola syntaxe skriptu. Aktualizována verze prostředků.

## Odebrání velikosti zprávy u psaní — 16. listopadu 2026, v62

Z řádku voleb Text / Obrázek / Video odstraněn údaj o velikosti připravované zprávy v bajtech a obě jeho pravidla vzhledu. Ověřena nepřítomnost prvku ve zdroji a syntaxe skriptu. Aktualizována verze prostředků.

## Zjednodušení záhlaví Instagramu — 16. listopadu 2026, v61

Ze záhlaví chatu odstraněno tlačítko Mapa i celá nabídka informací o konverzaci včetně ikony. Odstraněny jejich nepoužívané ikony, styly a obsluha zavírání nabídky. V prohlížeči ověřena nepřítomnost obou prvků na notebooku, telefonu i u Matěje, zachování kontaktu a návratu na plochu, odesílání a přehledu Přenos v síti. Zavření monitoru funguje, konzole bez chyb a varování. Ověřena syntaxe upravených skriptů, aktualizována dokumentace a verze prostředků.

## Instagram ve vzhledu chatu — 16. listopadu 2026, v60

Přepracován Instagram na přímé zprávy: seznam konverzací vlevo na větší obrazovce, profil v záhlaví, odchozí a příchozí bubliny, přílohy a psaní dole. Podrobnosti o obou spojích, porovnání velikostí a výběr paketů jsou v rozbalovacím Přenosu v síti. Nabídka informací otevře druhou stranu chatu a u Matěje nastavení potvrzení přečtení. Enter odesílá, Shift + Enter zůstává novým řádkem; nabídku zavře Escape i kliknutí mimo ni. Původní síťový model a jedna poslední zpráva zůstávají zdrojem stavu. Nové rozhraní a styly jsou v samostatných souborech. Při aktualizaci zůstávají zachované posunutí chatu, kurzor i otevřené podrobnosti; klíč pohledu vychází z aktuálně vybrané aplikace.

V prohlížeči úspěšně odeslán text s diakritikou, emoji a značkami, ověřeno bezpečné vykreslení, příjem u Matěje a návrat potvrzení Zobrazeno. Přenesen obrázek i video; u příjemce je video přehratelné s ovládáním. Detail paketu z přehledu pozastaví krokování. Ověřeny počty 72 paketů pro obrázek a 3 572 pro video, zachování přehledu při změně přílohy a původního rozepsaného textu. Odeslání z telefonu při vypnutém Matějově notebooku zprávu uchovalo na serveru; po zapnutí se doručila. Vypnutá potvrzení ponechala odesílateli Doručeno, jejich zapnutí připravilo a úspěšně přeneslo potvrzení přečtení. Enter při blokovaném odesílání nespustil nový přenos.

Vzhled ověřen při 814 × 858, 390 × 844 a 320 × 844 px včetně monitoru telefonu. Při 320 px má obsah 252/252 px bez vodorovného přetékání, psaní a odeslání zůstávají dostupné i s rozbalenými podrobnostmi; nabídka informací se vejde do obrazovky. Ověřeno přepínání s prohlížečem, Poštou a Připojením, zachování posunutí a fokusu při aktualizaci. Konzole bez chyb a varování. Prošlo sedm testů médií a osm testů navigace prohlížeče; ověřena syntaxe všech 24 skriptů a existence 29 místních prostředků. Aktualizována dokumentace a verze prostředků.

## Odebrání názvů místností v bytě — 16. listopadu 2026, v59

Ze SVG bytu na Lipové odstraněny textové prvky Pracovna a Tiskový kout. Ověřena nepřítomnost obou popisků ve zdroji mapy a syntaxe skriptu. Aktualizována verze prostředků.

## Odebrání obrázku listu v tiskárně — 16. listopadu 2026, v58

Z okna tiskárny odstraněn dekorativní list Připraveno k tisku a jeho nepoužívaná pravidla vzhledu. Zůstává samotná zpráva Tiskárna čeká na dokument; její panel již nezabírá prostor po obrázku. V prohlížeči ověřeno odstranění listu i jeho textu, kompaktní panel, zachování údajů IP/MAC/služba, tlačítka napájení a zavření okna. Konzole bez chyb a varování, syntaxe skriptu ověřena. Aktualizována verze prostředků.

## Odebrání štítku nad monitorem — 16. listopadu 2026, v57

Nad monitorem odstraněn viditelný štítek se jménem zařízení a stavovou tečkou. Zavírací tlačítko zůstává vpravo. Název zařízení je zachován jako skrytý nadpis pro přístupné pojmenování dialogu. V prohlížeči ověřena nepřítomnost štítku a tečky, zarovnání zavření, otevření Dokumentu s tlačítkem Tisk a zavření monitoru. Strom přístupnosti nadále uvádí dialog Notebook. Konzole bez chyb a varování, syntaxe skriptu ověřena. Aktualizována verze prostředků.

## Popisek tlačítka Tisk — 16. listopadu 2026, v56

Tlačítko v aplikaci Dokument přejmenováno z Odeslat do tiskárny na Tisk. Změněn pouze jeho text; odeslání formuláře a obsluha tisku zůstávají stejné. Ověřen nový text ve zdroji a syntaxe skriptu. Aktualizována verze prostředků.

## Odebrání úpravy názvu dokumentu — 16. listopadu 2026, v55

Z aplikace Dokument odstraněn popisek Název dokumentu i pole pro přejmenování. Tlačítko Odeslat do tiskárny zůstává vpravo nad náhledem dokumentu. Odstraněna také nepoužívaná pravidla vzhledu pole. V prohlížeči ověřena nepřítomnost pole a popisku i úspěšné odeslání a vytištění dokumentu se stávajícím názvem Poznámky k projektu.pdf. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků.

## Zjednodušení záhlaví tiskárny — 16. listopadu 2026, v54

Z okna tiskárny odstraněna ikona u nadpisu, podtitulek Místní síť · byt na Lipové a stav Zapnuto/Vypnuto včetně barevné tečky. Tlačítko napájení zůstává vpravo. V prohlížeči ověřeno odstranění všech tří prvků při zapnuté i vypnuté tiskárně, funkční přepnutí napájení a zavření okna, zachování náhledu dokumentu i údajů IP/MAC/služba. U switche ověřeno zachování jeho ikony, podtitulu a stavu. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků; ZIP se podle přání uživatele dále nevytváří.

## Zjednodušení okna tiskárny — 16. listopadu 2026, v53

Z okna tiskárny odstraněna šipka zpět, označení Koncové zařízení, vysvětlující text o místním tisku, odkaz na dokument v notebooku a celá sekce připojení včetně portu a odkazu na spoj. V prohlížeči ověřena nepřítomnost všech označených prvků, zachování náhledu dokumentu a údajů IP/MAC/služba, vypnutí i zapnutí tiskárny a zavření křížkem. Ostatní zařízení si zachovávají své záhlaví, navigaci i porty. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Čistý prohlížeč — 16. listopadu 2026, v52

Zapracována schválená čistá varianta: karty, historie, obnovení, adresní řádek, záložky a nabídka. Ikona u adresy ukazuje informace o skutečném spojení a zámek až po ověření TLS. Cookies a výukový přehled přenosu jsou dostupné na vyžádání. Účet, registrace, vzkaz a soukromí patří do webu knihovny; další vysvětlení jsou rozbalovací.

Přidán model karet s nezávislými dokumenty a rozepsanými adresami, společnými cookies a DNS v rámci zařízení. Přepnutí obnoví místní snímek, historie a obnovení posílají nové požadavky přes síť. Během probíhajícího pokusu nelze měnit cílovou kartu. Původní síťový model, směrování, NAT a bezpečnostní scénáře zůstávají zachované.

Prošlo všech **222 automatických testů**, včetně osmi nových testů navigace a izolace karet. V prohlížeči ověřeno HTTPS načtení knihovny, nový požadavek a reklama v druhé kartě, obnovení původní stránky, přihlášení s výpočtem na serveru, odeslání vzkazu a jeho doručené potvrzení, načtení osobních údajů, obě varianty HTTP/HTTPS, ověření šifrování a načtení podvodného formuláře. Upraven vzor uživatelského jména pro HTML regulární výrazy v režimu v; jméno s pomlčkou projde a mezera se odmítne. Ověřena také chybná adresa: důvod chyby je viditelný a dříve doručená stránka zůstává označená jako starší obsah.

Vizuálně ověřeno při 658 × 858 px a na telefonu při 390 × 844 a 320 × 844 px. Cookies, přihlášení, registrace i hlavní stránka při 320 px nepřetékají vodorovně (šířka obsahu 252/252 px). Osm otevřených karet se při 390 px zalomí bez překrytí ovládacích prvků. Nabídka respektuje dostupnou výšku monitoru. Kliknutí na aktuální paket z přehledu přenosu zastaví simulaci a zavření dovolí pokračovat; po dokončení zůstává stránka načtená. Konzole bez chyb a varování. Upravena dokumentace, verze prostředků a přenosný ZIP.

## Nadpisy podle typu spojení — 16. listopadu 2026, v51

Nadpisy oken spojů nově rozlišují Kabelové spojení a Bezdrátové spojení – Wi-Fi / mobilní síť / satelit. Konkrétní zařízení a porty zůstávají v údajích První konec a Druhý konec. Kabel k satelitní anténě a přípojky BTS jsou v tomto modelu označené jako kabelové úseky. V prohlížeči ověřeno všech šest druhů média na reprezentativních spojích, přístupný název okna, zavření a zachování nadpisu při odpojení i obnovení. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Upravena dokumentace, verze prostředků a přenosný ZIP.

## Jednolité pozadí mapy a budov — 16. listopadu 2026, v50

Odstraněn tečkovaný vzor na celé ploše mapy a čtvercová mřížka podlah v pěti budovách: byt na Lipové, chata, Matějova domácnost, kavárna a doupě. Smazány obě definice SVG vzorů a všech šest překryvných obdélníků; pod nimi zůstávají jednolité barevné výplně. V prohlížeči ověřeny pohledy Byt, Město a Celá síť bez vzorů, všech 61 zařízení a 67 spojů a zachování barev jednotlivých ploch. Vzhled bytu a pozadí vizuálně ověřen. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Zavírání samotným křížkem — 16. listopadu 2026, v49

Zavírací tlačítko informačních oken má pouze křížek bez textu a rámečku; přístupný název pro čtečky zůstává zachován. U okna spoje je křížek přímo v pravém horním rohu a prázdné záhlaví nezabírá místo. Nadpis má rezervované místo, aby do křížku nezasahoval. Vzhled vizuálně ověřen při šířce 658 px, u delšího názvu také rozměry při skutečné šířce výřezu 500 px: bez překryvu nadpisu a vodorovného přetékání. Ověřeno zavření kliknutím, návrat fokusu na spoj, Escape a zavírací křížek v okně zařízení. Konzole bez chyb a varování. Upravena dokumentace, verze prostředků a přenosný ZIP.

## Odebrání popisku Detail spoje — 16. listopadu 2026, v48

Ze záhlaví okna spoje odstraněn popisek Detail spoje. V prohlížeči ověřeno jeho odstranění i po změně stavu spoje a funkční zavření k mapě. Popisky ostatních typů oken zůstávají dostupné. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Odebrání odkazu na připojení zařízení — 16. listopadu 2026, v47

Z detailů spojů odstraněn odkaz Vybrat připojení zařízení. V prohlížeči ověřeno jeho odstranění u kabelového i Wi-Fi připojení, zachování tří údajů o spoji, funkční odpojení a obnovení i zavření k mapě. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Další zjednodušení okna spoje — 16. listopadu 2026, v46

Z detailů spojů odstraněn horní ukazatel dostupnosti a obě spodní tlačítka koncových zařízení; šipka zpět se v těchto oknech nezobrazuje. V prohlížeči ověřeny kabelový i Wi-Fi spoj se třemi zbývajícími údaji, funkční odpojení a obnovení, zavření k mapě a zachování navigace zpět v oknech zařízení. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Odebrání ikon obousměrných spojů — 16. listopadu 2026, v45

Z mapy odstraněny značky ↔ v obdélníkových štítcích spojnic. Zachovány popisky rádiových spojů a označení odpojených spojů. V prohlížeči ověřeno všech 67 spojů bez ikon ↔, otevření detailu kliknutím přímo na spojnici a odpojení i obnovení vybrané větve. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Odebrání řádku Způsob přenosu — 16. listopadu 2026, v44

Z údajů detailu spoje odstraněn řádek Způsob přenosu včetně hodnoty. V prohlížeči ověřeny kabelový i Wi-Fi spoj: zůstávají údaje První konec, Druhý konec a Připojená síť, tlačítko odpojení i odkazy na obě zařízení. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Odebrání podnadpisu spoje — 16. listopadu 2026, v43

Z detailu spoje odstraněn řádek s názvy propojených zařízení a obousměrnou šipkou pod hlavním nadpisem. V prohlížeči ověřeno, že po nadpisu přímo následuje dostupnost spoje a zůstávají čtyři údaje, ovládání a odkazy na koncová zařízení. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Odebrání řádku Stav spoje — 16. listopadu 2026, v42

Z údajů detailu spoje odstraněn řádek Stav spoje včetně jeho rádiové varianty a hodnoty. V prohlížeči ověřeny čtyři zbývající údaje, odkazy na koncová zařízení a funkční odpojení i obnovení spoje. Horní indikátor dostupnosti funguje dál. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Zjednodušení detailu spoje — 16. listopadu 2026, v41

Odstraněna spodní vysvětlující karta spoje a navazující poznámka o aktualizaci směrovacích tabulek. V prohlížeči ověřen detail Notebook — switch: oba bloky chybí, pět údajů o spoji a odkazy na koncová zařízení zůstávají dostupné. Odpojení i obnovení spoje funguje. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Detail spoje bez ilustrace — 16. listopadu 2026, v40

Odstraněna dekorativní ilustrace dvou koleček a spojnice z okna detailu spoje i její nepoužívané styly. V prohlížeči ověřeno otevření detailu Notebook — switch, zachování stavu a ovládání, odpojení a opětovné připojení spoje. Ilustrace se neobjevuje ani při změně stavu. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Hlavní popisky zařízení — 16. listopadu 2026, v39

Odstraněny drobné vedlejší popisky pod zařízeními ve všech měřítkách. Zachovány hlavní názvy a informace v oknech zařízení. V prohlížeči ověřeno 61 hlavních názvů a žádný vedlejší popisek v pohledech Byt, Město a Celá síť; detail DNS serveru se otevírá správně. Konzole bez chyb a varování, syntaxe upraveného skriptu ověřena. Aktualizována verze prostředků a přenosný ZIP.

## Zjednodušení navigace — 16. listopadu 2026

Horní navigace mapy obsahuje pouze **Byt**, **Město** a **Celá síť**. V prohlížeči ověřeno přepínání všech tří výřezů; model nadále obsahuje 61 zařízení. Ostatní oblasti a jejich funkce zůstávají dostupné přiblížením a posunutím mapy. Upravena související dokumentace a přenosný ZIP.

## Obnovení původní mapy — 16. listopadu 2026, v38

Vrácena poslední úprava mapy se sítěmi provozovatelů. Obnovena předchozí topologie **61 zařízení a 67 spojů**, původní souřadnice, pohled Byt a výřez Celá síť `20 -565 2320 2180`, původní přepočet směrovacích tabulek i mobilní prefix /24. Předchozí služby, bezpečnostní scénáře a ovládání paketů zůstávají zachované. Dokumentace i přenosný ZIP odpovídají obnovené mapě.

Ověřeno všech **214 původních automatických testů**, syntaxe **21 JS souborů** a existence všech 24 relativních prostředků indexu. V prohlížeči ověřen výchozí výřez `35 270 465 440`, počet zařízení/spojů, původní navigace a úspěšné načtení knihovny přes DNS/HTTP po krokování. Konzole bez chyb a varování. Verze prostředků zvýšena na `v=38`, aby se načetly obnovené skripty a styly.

## Společný reklamní server 12. listopadu 2026

Nový e-shop `obchod.test` (192.0.2.226), zprávy `zpravy.test` (192.0.2.227) a společný partner `reklamy.test` (192.0.2.228) jsou tři skutečné hostitelské uzly v modelu. Mají vlastní partnerskou LAN 192.0.2.224/27, router, switch a přípojku přes E. Celkem je nyní **61 zařízení a 67 spojů**. Oblast **Reklama** ukazuje jednotlivé služby v mapě. Všechny běžné prohlížeče mají rychlou volbu Knihovna / E-shop / Zprávy.

Ověřeno ovládáním místního náhledu:

- Notebook → Prohlížeč → E-shop spustil DNS a HTTPS k e-shopu. Hlavní stránka s kategorií Cyklistika se zobrazila před dokončením reklamy. V ní zůstávalo čekání na jiný server, dokud neproběhl další DNS/TLS/HTTPS přenos. Teprve přijatá odpověď zobrazila banner a vlastní cookie `reklama_id=r1` s příznaky Secure, HttpOnly a SameSite=None.
- Přechod přes tlačítko Zprávy zahájil nový přenos ke druhému webu a další žádost k témuž reklamnímu serveru. Přijatý banner nabídl kola a uvedl důvod „Podle uloženého zájmu Cyklistika z prohlížení obchod.test“. Adresa prohlížeče zůstala zpravy.test; vložená reklama hlavní web nenahrazuje.
- Odkaz na reklamní server otevřel informace nad mapou. Profil r1 měl jeden bod Cyklistika, dva požadavky a oddělené návštěvy obchod.test / zpravy.test. Serverový přehled výslovně odlišuje skutečný stav serveru od dříve přijaté reklamy v zařízení.
- Vypnutí propojení a nové načtení Zpráv doručilo obecnou nabídku „Objev něco nového“ a důvod bez uloženého zájmu. Uložená cookie zůstala v zařízení, ale neodesílala se. Profil se tímto požadavkem nezměnil (ověřeno také automaticky).
- Rozhraní ověřeno při 1280 × 720 a 1280 × 900 px. Při 390 × 844 px měla stránka 308/308 px, banner 306/306 px (clientWidth/scrollWidth). Při 320 × 568 px měla stránka 238/238 px, banner 236/236 px, serverový oddíl 252/252 px. Dokument měl vždy 390/390, respektive 320/320 px. Nová oblast mapy byla vizuálně upravena tak, aby nezasahovala do sousedního cizího hostingu. Konzole bez chyb a varování. Dočasná karta, rozměry a server po kontrole uklizeny.

**214 automatických testů úspěšných:** předchozích 198 a 16 nových v `tests/ads.test.mjs`. Pokrývají adresy a skutečné vratné cesty tří služeb; nezávislé načtení stránky/partnera; uložení zájmu až serverovým krokem a cookie/banner až po odpovědi; doporučení na druhém webu; změny skóre a shody; kontext bez profilování; smazání a expiraci bez smazání serverových profilů; dvě zařízení za stejným NAT; oddělení knihovních cookies a přihlášení; výpadky hlavního webu a partnera, ztracené potvrzení a zachování stránky; certifikáty a integritu obou směrů; HTTP hlavní web s HTTPS reklamou a doručeným zásahem MITM do hlavního nadpisu; neprůhlednost v kavárně; Wi-Fi, mobilní data, satelit, VPN a MTU. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Syntaxe **21 skriptů**, dvě CSS a relativní prostředky ověřeny. Cache **v=36**. Přenosný ZIP aktualizován a bajtově porovnán se zdroji.

Pokus používá přímo sbíraná data reklamního partnera a samostatnou cookie třetí strany, nikoli přeprodej databáze. Přepínač je výukové povolení propojení, nikoli změna reálného nastavení prohlížeče nebo plnohodnotný proces souhlasu. Reálné prohlížeče mají rozdílné politiky blokování/dělení cookies. CORS, preflight, iframe, skutečné skripty dalších webů, aukce a statistické doporučovací modely nejsou implementované. Vyhrává nejčastěji navštívená kategorie; při shodě dříve zaznamenaná. Data jsou v paměti simulace a neposílají se žádné skutečné reklamní síti. Dřívější oddíly níže popisují předchozí verze.

Snímky: [doporučená reklama na zprávách](docs/ads-news.jpg), [profil serveru](docs/ads-server.jpg), [kontext bez propojení](docs/ads-context.jpg), [mapa](docs/ads-map.jpg), [390 px](docs/ads-mobile.jpg), [320 px](docs/ads-mobile-small.jpg).

## Registrace, hesla a přihlášení 12. listopadu 2026

Na knihovně ve všech pěti běžných zařízeních je nová část **Jak se ověřuje heslo?** s registrací, přihlášením, ověřením aktuální relace a odhlášením. Výchozí tři účty začínají přihlášené. Nové účty se vytvářejí a ověřují na modelovém serveru po skutečném průchodu DNS/TLS/HTTPS. Síť zůstává na 56 zařízeních a 62 spojích.

Ověřeno ovládáním místního náhledu, bez přímého volání interního modelu:

- Notebook načetl knihovnu přes HTTPS. Registrace fiktivního účtu `ukazka` prošla sítí a v zařízení se potvrdila až po doručení odpovědi. Následující přihlášení s chybným heslem bylo odmítnuto, správné heslo potvrdilo nový účet a relaci. Rozepsané hodnoty zůstaly zachované během překreslování a krokování.
- **Ověřit přihlášení** dokončilo nový přenos s hlášením „Server ověřil cookie relace. Heslo nebylo odesláno.“ Soukromí poté načetlo profil `ctenar-4` se jménem a e-mailem nového účtu.
- Odkaz na otisky otevřel okno webového serveru přímo u nového oddílu. Po přihlášení ukázal použitou sůl, nový a uložený otisk se stejnými 64 hexadecimálními znaky a výsledek SHODA. Níže byly tři oddělené záznamy účtů se stejným ukázkovým heslem, různými solemi a otisky, parametry PBKDF2 a tabulka relací.
- Rozhraní kontrolováno při 1280 × 720 a 1280 × 900 px. Při 390 × 844 px měl formulář 274/274 px a panel 306/306 px; serverový oddíl 322/322 px. Při 320 × 568 px měl formulář 204/204 px, panel 236/236 px a server 252/252 px. Dokument měl vždy shodnou clientWidth/scrollWidth (390/390 a 320/320), dlouhé otisky se zalamovaly. Obsah se posouvá uvnitř monitoru, ovládání přenosu zůstává mimo něj. Konzole bez chyb a varování.

**198 automatických testů úspěšných:** předchozích 182, upravených pro přihlašovací relace místo připraveného Bearer tokenu, a 16 nových v `tests/auth.test.mjs`. Nové testy ověřují shodu skutečného PBKDF2 s nezávislou implementací Node crypto, UTF-8, náhodné soli a různé otisky stejného hesla, ukládání až samostatným serverovým krokem po výpočtu, doručení potvrzení zvlášť, žádné heslo v databázi nebo běžných síťových záznamech, chybná/neexistující přihlášení, rotaci a zneplatnění relací, expiraci/zákaz/smazání cookies, doménu a HTTPS, certifikát a integritu, výpadek serveru během výpočtu, ochranu proti pozdnímu dokončení zrušené akce, ztracená potvrzení, registraci bez duplicit, dynamickou identitu GDPR a odstranění e-mailu, Wi-Fi/data/satelit/VPN, neprůhlednost pro MITM a mez MTU. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Syntaxe všech **19 skriptů**, obě CSS a relativní prostředky ověřeny. Cache `v=35`. Přenosný ZIP aktualizován a porovnán se zdroji. Dočasná kontrolní karta, rozměry a server po práci uklizeny.

KDF je skutečné PBKDF2-HMAC-SHA-256 (600 000 iterací, náhodná 16B sůl, 32B otisk); používá se vestavěné Web Crypto bez závislostí. Síť/TLS a obě logické role serveru a klienta zůstávají v jednom místním výukovém modelu. Není to produkční zabezpečení ani trvalá registrace. Heslo je v klientském rozepsaném formuláři a poslední akci; po dešifrování jej server přechodně zná, ale databáze ukládá pouze sůl, otisk a parametry. Výmaz dobrovolného profilu odstraňuje i kopii e-mailu u přihlašovacího účtu, ponechává však přihlašovací jméno/otisk/relace pro přístup k výsledku a případnému dokladu; nejde o zrušení účtu. Starší oddíly níže popisují tehdejší verze.

Snímky: [monitor](docs/auth-desktop.jpg), [porovnání otisků](docs/auth-server.jpg), [390 px](docs/auth-mobile.jpg), [server na telefonu](docs/auth-server-mobile.jpg), [320 px](docs/auth-mobile-small.jpg).

## GDPR · přístup a výmaz 12. listopadu 2026

Na stránce knihovny přibyla nabídka **Soukromí a moje údaje**. Model má tři připravené fiktivní účty: notebook, telefon a chata sdílejí `ctenar-1`, Matěj a host kavárny mají samostatné účty. Síť zůstává na 56 zařízeních a 62 spojích. Přibyla pouze aplikační logika nad stávajícím DNS/TLS/HTTPS, NAT a VPN. Přihlášení je oddělené od cookie. Údaje se přijímají přes `GET /soukromi/udaje`, žádost o výmaz přes `POST /soukromi/vymaz`; na síti jsou to běžné chráněné HTTPS pakety.

Ověřeno skutečným ovládáním místního náhledu:

- Notebook načetl knihovnu přes HTTPS. Rozbalení nabídky a Zobrazit moje údaje zahájilo nový přenos; až jeho dokončení ukázalo jméno Alex Lipovský, e-mail, žánry, návštěvu se zdrojem po NAT `192.0.2.1` a jeden přidružený záznam prohlížeče.
- Požádat o výmaz a dokončení dalšího přenosu doručilo potvrzení samostatně. Nové zobrazení údajů ukázalo prázdný profil a historii, nulový počet záznamů a vypnutý dobrovolný sběr účtu. Ukázkový účetní doklad se jménem zůstal označen důvodem uchování. Odkaz na server otevřel přímo příslušný správcovský oddíl nad mapou a ukázal stejný skutečný stav; ostatní dva profily zůstaly beze změny.
- Matějův notebook samostatně načetl svůj profil a návštěvu s NAT `192.0.2.26`. Jeho výmaz potvrdil odstranění také samostatného dokladu; nové načtení přehledu neobsahovalo žádný další doklad. Otevření detailu TLS paketu pozastavilo krokování i přehrávání; po zavření šel dokončit původní přenos a znovu otevřít zachovanou aplikaci.
- Soukromí mělo při 390 × 844 px obsah 330/330 px a při 320 × 568 px 260/260 px (clientWidth/scrollWidth); dokument zůstal široký přesně 390, respektive 320 px. Tlačítka se na úzkém displeji skládají pod sebe, texty se zalamují a obsah se posouvá uvnitř monitoru. Dočasná změna rozměrů byla vrácena. Konzole neobsahovala chyby ani varování. Kontrolní karta zavřena a dočasný server ukončen.

**182 automatických testů úspěšných:** dosavadních 167 a 15 nových v `tests/privacy.test.mjs`. Nové testy ověřují načtení až po doručení a serverový snímek, odmítnutí chybějícího přihlášení bez úniku dat, okamžik výmazu a návrat potvrzení, obě varianty uchování, samostatné lokální mazání cookies, sdílený účet a izolaci ostatních uživatelů, zastavení dalšího přihlášeného sběru, přiřazení dosavadního prohlížeče bez autentizace cookie, přijetí pouze správného HTTPS požadavku, výpadek před zpracováním a po něm, opakování se stejnou identitou žádosti, certifikát a integritu obou směrů, neprůhlednost při MITM a VPN, skutečné pozorované IP, tři návštěvy a MTU. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Syntaxe všech **17 skriptů**, dva CSS soubory a relativní prostředky ověřeny. Cache `v=34`. Přenosný ZIP byl aktualizován a jeho soubory bajtově porovnány se zdroji.

Jde o uzavřený fiktivní scénář, nikoli produkční GDPR proces. Podmínky výmazu jsou pro dobrovolný profil předpokládané, právní důvod dokladu je ukázková varianta a přihlášení připravené. Čas je zkrácený. Nepřiřazené záznamy se neidentifikují podle IP; model nevyhledává všechny osobní údaje napříč skutečnou organizací. Výuková síťová historie, ostatní služby a dřívější místní kopie nejsou globálně mazány. Další meze a právní zdroje jsou v README.

Snímky: [přehled údajů](docs/privacy-profile.jpg), [stav serveru po výmazu](docs/privacy-server.jpg), [úplný výmaz druhého účtu](docs/privacy-erasure.jpg), [pozastavený TLS paket](docs/privacy-packet.jpg), [390 px](docs/privacy-mobile.jpg), [320 px](docs/privacy-mobile-small.jpg).

## SMTP a IMAP 12. listopadu 2026

Pošta Lipov (`posta.test`, 203.0.113.40) a nová Pošta Dopis (`dopis.test`, 192.0.2.194) mají oddělené serverové schránky. Dopis má vlastní router, switch, LAN /27 a přípojku do D. Model nyní obsahuje **56 zařízení a 62 spojů**. Všech pět běžných klientů může psát i číst e-maily; Matějův účet je `matej@dopis.test`. Dřívější oddíly níže popisují tehdejší verze; jejich původní Poštu přes HTTPS API nyní nahrazuje tento model SMTP/IMAP.

Ověřeno ovládáním skutečných prvků místního náhledu:

- Notebook → Pošta → Napsat e-mail: změna příjemce aktualizovala trasu, vlastní předmět a text se zachovaly. SMTP předalo zprávu vlastnímu serveru, ten provedl DNS MX a samostatné předání druhému poskytovateli. Pošta Dopis zobrazila schránku, UID a nepřečtený e-mail i při vypnutém Matějově notebooku. Rozhovor obsahoval MAIL FROM, RCPT TO, DATA, 354 a konečné 250.
- Po zapnutí příjemce byla jeho místní Pošta prázdná. Teprve IMAP · Zkontrolovat poštu provedlo SELECT a FETCH a zpřístupnilo doručenou zprávu. Otevření zprávy vyvolalo samostatné SELECT/UID STORE a příznak přečtení se potvrdil po návratu odpovědi. Rozbalený rozhovor zůstal otevřený během krokování i překreslování. Odesílateli se potvrzení přečtení neposílalo.
- Vypnutí Pošty Lipov před odesláním z Matějovy Pošty ponechalo e-mail ve frontě Pošty Dopis. Okno serveru ukázalo čekání a počet pokusů. Po zapnutí Lipova tlačítko Zkusit předat z fronty dokončilo samostatný SMTP přenos. Fronta změnila stav na doručeno, počet pokusů na dva.
- Detail SMTP paketu nad mapou zobrazil TCP/465 a návrat přes NAT, chráněné modelové TLS bajty a vysvětlení odeslání. Po dobu prohlížení byly krokování a přehrávání deaktivované. Zavření umožnilo dokončit tentýž přenos. SMTP značky jsou oranžové, IMAP modré; směr rozlišují šipky a popisky. Příprava dalších částí má vlastní popis kroku.
- Pošta měla při 390 × 844 px obsah 330/330 px a při 320 × 568 px 260/260 px (clientWidth/scrollWidth). Dokument byl široký přesně 390, respektive 320 px. Na 320 px fungoval výběr příjemce a aktualizace trasy; formulář a rozhovory se posouvají uvnitř monitoru. Dočasné rozměry byly vráceny. Při této kontrole byla opravena výjimka při obnovení fokusu výběru příjemce; kontrola po novém načtení už neobsahovala chyby ani varování. Kontrolní karta byla zavřena.

**167 automatických testů úspěšných:** předchozích 153 a 14 nových v `tests/mail.test.mjs`. Kontroly pokrývají role a směrování dvou poskytovatelů, příkazy a oddělené porty/TLS relace, čas převzetí a potvrzení, offline příjemce a odpojení odesílatele, místní i opačné předání, MX a nedostupný cílový server, uloženou frontu a retry, ztrátu potvrzení a modelovou deduplikaci, IMAP snapshot až po doručení, více zpráv/UID/Seen a nulové potvrzení odesílateli, zachování staré kopie při chybě, vícebajtové UTF-8 přes souběžné části, MTU a SEQ, Wi-Fi/data/satelit/VPN, neprůhlednost při kavárenském odposlechu, změnu připojení a odmítnutí poškozeného TLS. Dosavadní phishingové kontroly nově procházejí skutečnými modelovými SMTP/IMAP přenosy. Příkaz: `node --test --test-concurrency=1 tests/*.test.mjs`.

Syntaxe všech **15 skriptů**, dva CSS soubory a relativní odkazy ověřeny; cache `v=33`. Přenosný ZIP byl aktualizován a jeho soubory bajtově porovnány se zdroji. Zůstává bez sestavení a externích závislostí.

Meze: krátký připravený protokolový rozhovor, připravené účty a TLS bez animace handshake, interní JSON po částech 192 B před obalením, ruční retry a pouze paměťové schránky. Výpis FETCH zkracuje těla, celá data však putují v odpovědi. Modelová deduplikace stejné identity není záruka reálného SMTP. TLS chrání samostatné úseky, nikoli obsah před poštovními poskytovateli. Úplné příkazy, autentizace, TCP retransmise, přílohy, bounce a antispam se nesimulují. Podrobnosti a primární RFC jsou v README.

Snímky: [server a odlišení protokolů](docs/mail-server.jpg), [IMAP rozhovor](docs/mail-imap.jpg), [SMTP paket](docs/mail-packet.jpg), [odchozí fronta](docs/mail-queue.jpg), [Pošta na 390 px](docs/mail-mobile.jpg), [formulář na 320 px](docs/mail-compose-mobile.jpg).

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
