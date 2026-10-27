# Custodia: ako to celé funguje

Dokumentácia k časti **Programovanie: Web a Systém na správu zákazníkov** v SSOSTA IT Challenge 2026.
Tím: Adam Hyben, Marek Skokan, Randy Belačík.

| | |
|---|---|
| Web firmy | https://custodia-pearl.vercel.app |
| CRM a zákaznícky portál | https://custodia-pearl.vercel.app/login |
| Zdrojový kód | https://github.com/Habybyi/custodia |

## 1. O čo ide v jednej vete

Milan Kováč mal zákazníkov v zošite a požiadavky na súkromnom mobile. Custodia to nahrádza jedným systémom: **web** získava nových zákazníkov a prijíma požiadavky, **CRM** ich eviduje, plánuje a posiela brigádnika na výjazd s presným zoznamom materiálu a **zákaznícky portál** a **IoT senzory** dávajú zákazníkovi pocit „bez starostí“.

## 2. Z čoho sa systém skladá

```
                 návštevník, Milan, brigádnik, zákazník
                                  │
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  VERCEL   custodia-pearl.vercel.app                          │
   │   /            web firmy (kalkulačka, servis, AI asistent)   │
   │   /login ...   CRM a zákaznícky portál (React)               │
   └──────────────────────────────────────────────────────────────┘
                                  │  všetko, čo začína /api
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  RENDER   server (Node.js + Express), REST API /api/v1        │
   │   logika, e-maily, pripomienky, príjem dát zo senzorov       │
   └──────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                         PostgreSQL databáza

   senzory v záhrade (Packet Tracer, ESP32, simulátor) ──► /api/v1/iot/readings
   GitHub (Habybyi/custodia) ──► po každom pushi sa Vercel aj Render nasadia samy
```

Pre používateľa je to **jedna adresa**. Že web, aplikácia a server bežia na dvoch službách, nevidí.

## 3. Kto čo v systéme robí

| Rola | Kto | Čo vidí a robí |
|---|---|---|
| **Majiteľ** | Milan | všetko: zákazníci, požiadavky, kalendár, sklad, tím, logy, štatistiky webu, prístupy zákazníkov do portálu |
| **Technik** | brigádnik | prehľad, svoje výjazdy, kartu záhrady, checklist materiálu, zápis vykonanej práce |
| **Zákazník** | majiteľ záhrady | iba svoj portál: záhrady a senzory, termíny, stav požiadaviek, história servisu, nahlásenie problému, stiahnutie svojich údajov |

Prihlásenie je spoločné na `/login`. Systém podľa roly sám rozhodne, kam človeka pustí. Zákazník sa na interné stránky firmy nedostane ani cez adresu, ani cez API.

## 4. Ako to funguje krok za krokom

### 4.1 Nový zákazník z webu

1. Návštevník si na webe v **kalkulačke** (4 kroky) zadá rozmery pozemku alebo ho zakreslí na mape, odpočíta dom, terasu a chodníky, rozdelí plochu na trávnik, záhony a živý plot a vyberie zdroj vody a doplnky.
2. Dostane **odhad počtu zón a cenu od do** s upozornením, že ide o orientačnú cenu.
3. Klikne **„Chcem presnú ponuku / obhliadku“** a vyplní meno, telefón a e-mail.
4. V CRM vznikne **požiadavka „Obhliadka“ zo zdroja Kalkulačka** a celý výsledok výpočtu je uložený pri nej. Neznámy človek sa založí ako **dopyt**, existujúceho zákazníka systém spozná podľa e-mailu alebo telefónu.
5. Zákazník dostane e-mail s číslom požiadavky, Milan dostane upozornenie.

### 4.2 Porucha alebo servis od existujúceho zákazníka

Požiadavka môže prísť **šiestimi cestami** a všetky skončia na jednom mieste, v zozname **Požiadavky**:

| Cesta | Ako |
|---|---|
| Web, „Nahlásiť poruchu“ | zaškrtnutá havária = priorita **Havária**, v CRM je navrchu |
| Web, jarné spustenie alebo zazimovanie | zákazník si vyberie **iba deň, ktorý má v kalendári voľnú kapacitu**, vznikne rezervácia |
| E-mail | e-mailová služba ho prepošle na webhook, systém z textu odhadne typ a naliehavosť |
| Telefonát | Milan napíše číslo v akomkoľvek tvare (0905..., +421 905...), systém nájde zákazníka a požiadavku zapíše počas hovoru |
| Zákaznícky portál | zákazník ju zadá sám po prihlásení |
| IoT senzor | senzor úniku vody sám vytvorí poruchu s vysokou prioritou |

Každá požiadavka má **číslo, stav** (nová, naplánovaná, v riešení, hotová, uzavretá, zrušená), **prioritu, technika** a **históriu každej zmeny**. Nič sa nemaže, iba uzatvára. Zákazník dostáva e-maily pri prijatí, naplánovaní, presune a dokončení.

### 4.3 Karta zákazníka a technická karta záhrady

Rieši problém „Milan si nepamätá, čo má ktorý zákazník nainštalované“.

| Časť | Obsah |
|---|---|
| Kontakt | telefón, e-mail, fakturačná adresa, odkiaľ prišiel, súhlasy |
| Záhrada | adresa a GPS (výber kliknutím na mapu), plocha, zdroj vody, tlak, prietok, hlavný uzáver, riadiaca jednotka, dažďový senzor, **rok a verzia systému** |
| Zóny | čo zavlažuje, postrekovače alebo kvapková závlaha, typ, značka a počet kusov, ventil a kde je |
| Fotky | z mobilu priamo pri výjazde, automaticky zmenšené |
| História | všetky zásahy s dátumom, technikom a materiálom, dá sa doplniť aj stará história zo zošita |
| IoT | senzory záhrady s aktuálnou hodnotou a grafom za 24 hodín |

Pri systémoch starších ako 4 roky sa zobrazí **upozornenie**, že môžu mať iné diely (staré systémy Milan staval inak).

### 4.4 Plánovanie a jarná či jesenná špička

- **Kalendár** po týždňoch s kapacitou každého dňa (obsadené / maximum). Milan zmení kapacitu jedným klikom (v špičke viac, dovolenka 0).
- Pri plánovaní systém **upozorní na plný deň alebo obsadeného technika** a nechá Milana rozhodnúť, či termín aj tak potvrdí.
- **Plánovač sezóny** zoskupí nenaplánované zazimovania a spustenia **podľa obce**. Milan vyberie obec, deň a technika a systém rozloží časy za sebou aj s presunom.
- **Rezervácie z webu** zaberajú kapacitu hneď. Milan potom iba potvrdí presný čas.
- **Trasa dňa** ukáže výjazdy na mape v poradí, s navigáciou do Google Máp.

### 4.5 Výjazd brigádnika

Rieši problém „brigádnik ide bez materiálu a musí sa vracať“.

1. Brigádnik ráno vidí **svoje výjazdy** a trasu na mape.
2. Na obrazovke výjazdu má **kartu záhrady**, poznámky (napríklad „pes na dvore“), čo sa tam robilo naposledy, a tlačidlá **zavolať** a **navigovať**.
3. **Checklist materiálu** sa vypočíta z typu zásahu a počtu zón (zazimovanie so 4 zónami = 4 konektory). Ukáže aj, čo chýba na sklade.
4. Po práci klikne **Dokončiť**: napíše, čo urobil a ako dlho, a potvrdí minutý materiál. Jedným krokom sa zapíše do histórie záhrady, odpíše zo skladu a požiadavka sa uzavrie.

### 4.6 Sklad

Katalóg materiálu s cenami, príjem tovaru, šablóny checklistov pre každý typ zásahu a **e-mail Milanovi, keď niečo klesne pod minimum**.

### 4.7 Pripomienky a notifikácie

| Pripomienka | Komu | Kedy |
|---|---|---|
| **Blíži sa zima, treba zazimovať** | zákazníkom | automaticky v nastavený deň na jeseň (aj ručne cez Plánovač → Pripomienky) |
| Jarné spustenie | zákazníkom | automaticky na jar |
| Termín zajtra | zákazníkovi | deň pred termínom |
| Zoznam výjazdov na zajtra | technikovi | deň pred |
| Nová požiadavka zvonku, dochádza materiál | Milanovi | hneď |

Nikto nedostane tú istú pripomienku dvakrát a kto už má zásah v tejto sezóne, pripomienku nedostane. Zákazník sa z pripomienok môže odhlásiť.

### 4.8 Smart záhrada (IoT)

```
senzor v záhrade ──(hodnota + tajný kľúč)──► CRM ──► karta záhrady a portál zákazníka
                                              └──► únik vody = požiadavka „Porucha“ + e-mail Milanovi
```

| Zariadenie (ako v Packet Traceri) | Čo ukazuje | Kedy hlási problém |
|---|---|---|
| Humidity monitor | vlhkosť pôdy v % | pod 20 % = sucho |
| Water level monitor | hladina studne v % | pod 15 % |
| Trip sensor | únik vody | únik = poplach a automatická požiadavka |
| Lawn sprinkler | zapnutý / vypnutý | |
| Ceiling fan (kosačka) | kosí / v stanici | |
| Home gateway | online | nič neposlalo 30 minút = offline |

Každé zariadenie má **vlastný tajný kľúč**, ktorý sa zobrazí iba raz a v databáze je uložený iba jeho hash (ako heslo). Milan pri pridaní zariadenia dostane hotový **Python kód pre Packet Tracer**. Na prezentáciu je pripravený simulátor `npm run iot:simulate -- --leak`, ktorý po 15 sekundách nahlási únik vody.

### 4.9 Zákaznícky portál

Milan zákazníkovi v karte (záložka **Portál**) vytvorí prístup a dočasné heslo. Zákazník po prihlásení vidí:

- najbližšie termíny,
- svoje záhrady a **senzory naživo**,
- stav svojich požiadaviek a históriu servisu,
- tlačidlo **Nahlásiť problém / objednať servis**,
- nastavenia súhlasov a **stiahnutie všetkých svojich údajov (GDPR)**.

Interné poznámky firmy zákazník nevidí.

### 4.10 Web firmy

| Časť | Čo robí |
|---|---|
| Úvod, služby, príbeh, referencie (posuvník pred a po), kontakt | predstaví firmu, vzbudí dôveru |
| Kalkulačka | odhad zón a ceny, dopyt priamo do CRM |
| Servisný formulár | porucha alebo rezervácia voľného dňa, priamo do CRM |
| AI asistent | odpovedá na otázky (Google Gemini cez server, kľúč nie je v prehliadači). Bez kľúča odpovedá z pripravených otázok. Funguje aj hlasom |
| SEO | lokálne kľúčové slová (Poprad, Tatry, Spiš), údaje pre Google o firme a častých otázkach, rýchle načítanie |
| Cookies | lišta s voľbou, Google mapa sa načíta až po súhlase |
| Svetlý a tmavý režim | logo a farby sa prepínajú podľa značky |

### 4.11 Meranie webu (stránka „Web a dopyty“)

Web posiela do CRM **iba anonymné súčty**: návšteva, začatá kalkulačka, dokončený výpočet, odoslaný dopyt a zdroj (Google, Facebook, Instagram, priamo...). **Bez cookies, bez IP adresy, bez identifikátora**, preto to nepotrebuje súhlas a počíta všetkých návštevníkov. Roboty sa nepočítajú.

Milan vidí:

- návštevy, dopyty a koľko % návštev skončí dopytom,
- **lievik kalkulačky** (návšteva → začal → dokončil → odoslal) s percentami,
- návštevy po dňoch, zdroje návštev a zdroje požiadaviek v CRM,
- koľko ľudí z webu sa stalo zákazníkmi,
- obdobie 7, 30 alebo 90 dní.

### 4.12 Logy

Majiteľ vidí, **kto čo kedy v systéme spravil**, vrátane **neúspešných pokusov o prihlásenie**. Pri každom zázname je **IP adresa** a **zariadenie** (napríklad „Chrome na iPhone“).

Filtre: hľadanie podľa mena, e-mailu alebo IP, výber používateľa, typ udalosti (skupiny Bezpečnosť, Prihlásenia, Neúspešné prihlásenia, Zákazníci alebo konkrétna akcia), IP adresa a obdobie od do. Klik na IP zobrazí všetko z tejto adresy a súhrn: kedy sa objavila prvýkrát a naposledy, ktoré účty z nej boli prihlásené a koľkokrát z nej niekto zadal zlé heslo.

Server navyše vypisuje každú požiadavku do terminálu (bez obsahu, aby sa do logu nedostali heslá).

## 5. Bezpečnosť a GDPR

| Oblasť | Riešenie |
|---|---|
| Heslá | bcrypt (12 kôl), dočasné heslo pri novom účte, povinná zmena pri prvom prihlásení |
| Prihlásenie | dva kroky (e-mail, potom heslo), limit pokusov, rovnaká hláška pri zlom e-maile aj hesle |
| Logy | každá akcia s IP adresou a zariadením, filtre podľa používateľa, IP, typu a dátumu |
| Prístup | každá požiadavka overuje rolu na serveri, deaktivovaný účet prestane platiť okamžite |
| Kľúče zariadení | iba hash v databáze, nikdy sa nevracajú z API ani v exporte |
| Verejné formuláre | limit odoslaní, skryté pole proti robotom, povinný súhlas, verejnosti sa vracia iba číslo požiadavky |
| AI asistent | kľúč iba na serveri, limit otázok, do AI ide iba posledných 12 správ |
| HTTP | bezpečnostné hlavičky (Helmet), CRM je zakázané pre vyhľadávače |
| GDPR prístup a prenosnosť | export všetkých údajov do JSON (majiteľ v karte zákazníka, zákazník v portáli) |
| GDPR vymazanie | anonymizácia: osobné údaje zmiznú, servisná história ostane bez nich kvôli záruke a účtovníctvu |
| GDPR súhlasy | servisné pripomienky a marketing zvlášť, zákazník ich mení sám v portáli |
| Audit | kto čo kedy zmenil, nič sa nemaže natvrdo |

## 6. Ako sú splnené požiadavky zo zadania

### Systém na správu zákazníkov

| Požiadavka | Splnené cez |
|---|---|
| Analýza problém → funkcia → rola | [analyza.md](analyza.md), kapitola 3 |
| Evidencia zákazníkov a technická karta záhrady | kapitola 4.3 |
| Servisné požiadavky: jednotný príjem, stavy, priorita, potvrdenie | kapitola 4.2 |
| Plánovanie: kalendár, špička, rezervácie, podľa lokality, pripomienky | kapitoly 4.4 a 4.7 |
| Notifikácia o zazimovaní | kapitola 4.7 |
| Materiál pred a po výjazde | kapitoly 4.5 a 4.6 |
| Mobilné rozhranie | celý systém, na mobile spodná lišta a jeden stĺpec |
| Škálovateľnosť | kapitola 7 a [architektura.md](architektura.md) |
| User-friendly pre neinformatika | veľké tlačidlá, slovenské hlášky aj pri konkrétnom poli, na počítači bez skrolovania |
| Kreativita navyše | trasa dňa na mape, IoT, zákaznícky portál, logy, meranie webu |

### Web

| Požiadavka | Splnené cez |
|---|---|
| Úvod, služby, príbeh, referencie, kontakt | kapitola 4.10 |
| Dizajn podľa značky, responzívny, mobil prvý | farby a logá od grafikov, svetlý aj tmavý režim |
| Kalkulačka (rozmery alebo mapa, odpočty, plochy, voda, doplnky, zóny a cena, upozornenie, max 5 krokov) | kapitola 4.1, 4 kroky |
| Kontakt z kalkulačky do CRM | kapitola 4.1 |
| Servis pre existujúcich zákazníkov napojený na CRM | kapitola 4.2 |
| SEO a rýchlosť | kapitola 4.10 |
| Meranie návštev a kalkulačky | kapitola 4.11 |

## 7. Technická časť

### Technológie

| Vrstva | Technológia |
|---|---|
| Web firmy | HTML, CSS, JavaScript (bez frameworku, rýchle načítanie) |
| CRM a portál | React 19, Vite, Leaflet (mapy) |
| Server | Node.js, Express 5, zod (kontrola vstupov), Nodemailer, sharp (fotky) |
| Databáza | PostgreSQL 16, Prisma (migrácie) |
| Lokálne | Docker Compose (databáza a Mailpit na e-maily) |
| Online | Vercel (web a CRM), Render (server a databáza) |

### Štruktúra repozitára

```
client/
  index.html           web firmy
  app.html             vstup do CRM
  public/web/          CSS, JavaScript a obrázky webu
  src/pages/           obrazovky CRM a portálu
  src/components/      spoločné časti (zoznamy, okná, mapa, IoT...)
server/
  src/modules/         každá oblasť zvlášť: routes (HTTP) + service (pravidlá firmy)
  prisma/              schéma databázy, migrácie, demo dáta
  scripts/             simulátor IoT
  test/                automatické testy
docs/                  dokumentácia, analýza, architektúra, API pre web, značka
render.yaml            nastavenie servera a databázy na Renderi
```

### Databáza (hlavné tabuľky)

```
Customer ─┬─ Garden ─┬─ Zone
          │          ├─ Photo
          │          ├─ Device ── DeviceReading
          │          ├─ Appointment ── WorkLog ── WorkLogMaterial ── Material
          │          └─ WorkLog
          ├─ ServiceRequest ── RequestStatusChange
          ├─ Notification
          └─ User (účet do portálu)
User (majiteľ, technik), AuditLog, Setting, DayCapacity, MaterialTemplate, WebEvent
```

### API (prehľad)

| Adresa | Pre koho |
|---|---|
| `/api/v1/auth` | prihlásenie, zmena hesla |
| `/api/v1/public/requests`, `/bookings`, `/availability` | web: dopyt, porucha, rezervácia, voľné dni |
| `/api/v1/public/assistant`, `/public/events` | web: AI asistent, anonymné meranie |
| `/api/v1/inbound/email` | e-mailová služba (chránené tajným kľúčom) |
| `/api/v1/iot/readings` | senzory (každý s vlastným kľúčom) |
| `/api/v1/customers`, `/gardens`, `/requests`, `/schedule`, `/appointments`, `/visits`, `/materials`, `/reminders` | majiteľ a technik |
| `/api/v1/users`, `/audit`, `/stats`, `/customers/:id/portal` | iba majiteľ |
| `/api/v1/portal` | iba zákazník |

Podrobný formát pre web je v [api-pre-web.md](api-pre-web.md).

### Škálovateľnosť

- Každý zoznam je **stránkovaný**, funguje rovnako pri 15 aj 1 500 zákazníkoch.
- Server je rozdelený na **moduly**, nová oblasť sa pridá bez zásahu do ostatných.
- API má verziu **v1**, budúca mobilná aplikácia sa dá napojiť bez rozbitia webu.
- E-maily idú cez **frontu v databáze**, výpadok e-mailovej služby nezastaví prácu a ani viac serverov nepošle e-mail dvakrát.
- Roly sú pripravené na **viac technikov**, kalendár aj trasa sa dajú filtrovať podľa technika.
- Fotky sú uložené cez kľúč, disk sa dá neskôr vymeniť za cloudové úložisko bez zmeny databázy.

### Spustenie lokálne

```
npm run setup     prvýkrát: .env, Docker, balíčky, databáza, demo dáta
npm run dev       web aj CRM na http://localhost:5173, e-maily na http://localhost:8025
npm test          22 automatických testov
npm run demo:reset          čisté demo dáta pred prezentáciou
npm run iot:simulate        živé dáta zo senzorov (s "-- --leak" aj únik vody)
```

### Demo účty

| Rola | E-mail | Heslo |
|---|---|---|
| Majiteľ | `milan.kovac@custodia.sk` | nastavené pri nasadení, pri prvom prihlásení sa mení |
| Technik | `peter.brigadnik@custodia.sk` | `Brigadnik123` |
| Zákazník | `maria.kollarova@example.sk` | `Zakaznik123` |

## 8. Známe obmedzenia

| Obmedzenie | Dôvod a riešenie do budúcna |
|---|---|
| E-maily na ostrej verzii chodia až po nastavení e-mailovej služby (Brevo) na Renderi | lokálne ich zachytáva Mailpit, online treba doplniť SMTP údaje |
| Server na Renderi po 15 minútach nečinnosti zaspí, prvé načítanie trvá asi 50 sekúnd | bezplatný plán, platený plán beží stále |
| Fotky sa na Renderi pri novom nasadení stratia | bezplatný plán nemá trvalý disk, riešenie je cloudové úložisko (S3) |
| Kapacita dňa je za celú firmu, nie za každého technika | pri jednom brigádnikovi stačí, pri raste tímu sa doplní |
| Trasa dňa ide podľa času, nepočíta najkratšiu cestu | pri 4 až 6 výjazdoch denne stačí |
| Fotky v referenciách sú ilustračné | firma doplní vlastné realizácie |
| Bezplatná databáza na Renderi po 30 dňoch expiruje | na súťaž stačí, natrvalo Neon alebo platený plán |
