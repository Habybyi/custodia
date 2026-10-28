# Architektúra

## Prehľad

```
client/   web firmy (index.html) + CRM a portál (React + Vite, app.html), jedna adresa
   │  REST /api/v1 (JSON, JWT v hlavičke Authorization), Vite/Vercel ho posiela na server
server/   Node + Express 5
   │  Prisma ORM
PostgreSQL 16 (lokálne Docker, online Render)
```

Online: Vercel servíruje web a CRM, všetko pod `/api` prepošle na server na Renderi (`client/vercel.json`, `render.yaml`). Prehliadač tak volá iba jednu adresu a CORS netreba riešiť.

## Vrstvy na serveri

Každá oblasť (`auth`, `users`, neskôr `customers`, `requests`...) je samostatný modul v `server/src/modules/`:

| Súbor | Úloha |
|---|---|
| `*.routes.js` | HTTP: čo príde a čo sa vráti. Žiadna logika |
| `*.service.js` | Pravidlá firmy, validácia (zod), audit |
| Prisma | Prístup k databáze |

Vďaka tomu sa dá vymeniť napríklad spôsob odosielania notifikácií bez zmeny routes.

## Rozhodnutia kvôli škálovateľnosti

| Rozhodnutie | Prečo |
|---|---|
| Celá dátová schéma navrhnutá vo Fáze 0 | Ďalšie fázy len pridávajú obrazovky a endpointy, vzťahy v DB sa neprestavujú |
| PostgreSQL namiesto SQLite/MongoDB | Dáta sú silno prepojené (zákazník → záhrada → zóny → zásahy), viac technikov naraz zapisuje |
| UUID ako ID, číslo požiadavky zvlášť | Bezpečné pre API, zákazník dostane čitateľné "požiadavka č. 42" |
| API pod `/api/v1` | Neskoršia v2 nerozbije starých klientov (napr. mobilnú appku) |
| Stránkovanie v každom zozname | Funguje rovnako pri 15 aj 1500 zákazníkoch |
| Používateľ ≠ zákazník, ale sú prepojené | Portál pre zákazníka (bonus) je len nová obrazovka |
| GPS pri adrese záhrady | Plánovanie podľa lokality a mapa trasy bez zmeny modelu |
| Notifikácie cez tabuľku `Notification` (outbox) | Dnes ich odosiela cron, neskôr sa dá zapojiť fronta (Redis/BullMQ) |
| Fotky cez `storageKey` | Dnes disk, neskôr S3 bez zmeny databázy |
| Soft delete (`deletedAt`) a audit log | Nič sa nestratí, dá sa dohľadať kto čo zmenil |
| Cena materiálu uložená pri použití | Staré výkazy sa nezmenia, keď sa zmení cenník |

## Plánovanie

| Pravidlo | Riešenie |
|---|---|
| Časové pásmo | Všetky dni a časy sa počítajú v `Europe/Bratislava` (`APP_TIMEZONE`), aj cez zmenu letného času |
| Kapacita dňa | Predvolený počet výjazdov z nastavení, výnimky pre konkrétny deň v tabuľke `DayCapacity` |
| Čo zaberá kapacitu | Rezervácie, potvrdené aj hotové termíny |
| Konflikty | Plný deň alebo obsadený technik vráti `409` s kódom, UI ponúkne "Naplánovať aj tak" (`force`) |
| Trvanie zásahu | Podľa typu z nastavení (napr. zazimovanie 60 min), dá sa zmeniť pri termíne |
| Plánovač dňa | Rozloží požiadavky za sebou s rezervou na presun, preskočí obsadené časy technika a to, čo sa nezmestí |

## Výjazd a sklad

- Dokončenie výjazdu je jedna transakcia: zápis práce, materiál s cenou v čase použitia, odpis zo skladu a uzavretie termínu. Buď prejde všetko, alebo nič.
- Checklist = šablóna pre typ zásahu (`MaterialTemplate`), položky "na zónu" sa násobia počtom zón záhrady.
- Pri poklese pod minimum dostane majiteľ e-mail najviac raz denne za položku.

## Pripomienky

| Pripomienka | Kedy | Ochrana proti duplicite |
|---|---|---|
| Termín zajtra (zákazník) | Od nastavenej hodiny (predvolene 17:00) | `dedupeKey` obsahuje ID a čas termínu, po presune príde nová |
| Zoznam výjazdov (technik) | Rovnako | Kľúč podľa technika, dňa a zoznamu výjazdov |
| Zazimovanie / spustenie | Automaticky v nastavený deň (+30 dní, ak server nebežal), alebo ručne | Raz za rok na zákazníka, nedostane ju ten, kto už má zásah v tejto sezóne |

Plánovač beží každých 5 minút v API serveri. Pri viacerých serveroch duplicity zastaví `dedupeKey` v databáze.

## GDPR

| Právo | Riešenie |
|---|---|
| Prístup a prenosnosť (čl. 15, 20) | Export všetkých údajov zákazníka do JSON (karta zákazníka → Export údajov) |
| Vymazanie (čl. 17) | Zmazanie zákazníka natrvalo odstráni jeho údaje, záhrady, požiadavky, termíny, históriu výjazdov, fotky, odoslané e-maily aj prístup do portálu. V logu ostane iba počet zmazaných záznamov |
| Námietka (čl. 21) | Zákazník sa môže odhlásiť zo servisných pripomienok, marketing vyžaduje samostatný súhlas |
| Minimalizácia | Verejný formulár vracia len číslo požiadavky, audit po zmazaní zákazníka neobsahuje jeho údaje |

## Notifikácie

```
akcia (nová požiadavka, hotovo)  →  tabuľka Notification (PENDING)  →  worker každých 10 s  →  SMTP
```

- Uloženie požiadavky nikdy nezlyhá kvôli výpadku e-mailu.
- Neúspešné odoslanie sa skúša znova o 1, 4, 9 a 16 minút, potom FAILED.
- Worker si notifikáciu "zarezervuje" podmieneným updatom, takže ani viac bežiacich serverov nepošle e-mail dvakrát.
- V detaile požiadavky je vidno, čo a komu odišlo.

## Bezpečnosť

- Heslá hashované cez bcrypt (12 kôl), nové účty majú dočasné heslo a musia si ho zmeniť.
- Limit pokusov o prihlásenie (10 za 15 minút z jednej IP).
- Používateľ sa pri každej požiadavke načíta z DB, deaktivácia platí okamžite.
- Rovnaká chybová hláška pri zlom e-maile aj hesle.
- Helmet (bezpečnostné HTTP hlavičky), CORS len pre adresu klienta a povolený web firmy.
- Verejný formulár: limit 5 odoslaní za 15 minút, skryté pole proti robotom, povinný súhlas GDPR, verejnosti sa vracia len číslo požiadavky.
- E-mailový webhook chránený tajným kľúčom (porovnanie odolné voči časovým útokom).

## Doplnené vo Fáze 6

| Oblasť | Riešenie |
|---|---|
| Web a CRM ako celok | Vite viacstránkový režim: `/` je web, ostatné adresy bez prípony dostanú `app.html` (CRM). Na Verceli to isté cez `vercel.json` |
| IoT | Zariadenie má vlastný kľúč (v DB iba SHA-256 hash), hodnoty idú do `DeviceReading`. Pravidlá stavu sú v `iot.rules.js` bez databázy, aby sa dali testovať. Únik vody vytvorí jednu požiadavku, nie novú pri každej správe |
| Zákaznícky portál | Rola `CUSTOMER` s prepojením `User.customerId`. API `/portal` vracia iba dáta prihláseného zákazníka, interné poznámky nie |
| Mapa trasy | Leaflet + OpenStreetMap, súradnice z karty záhrady, navigácia cez odkaz na Google Mapy |
| Meranie webu | Tabuľka `WebEvent` (typ, zdroj, čas). Bez IP, cookies a identifikátora, preto bez súhlasu. Roboty sa filtrujú podľa User-Agent |
| AI asistent | Server prepošle rozhovor do Google Gemini s kľúčom z `.env`, obmedzí dĺžku a počet otázok |
| Logy | Audit log s neúspešnými prihláseniami, stránka pre majiteľa, výpis požiadaviek do terminálu bez obsahu |
| Nasadenie | Render Blueprint (`render.yaml`): pri štarte migrácie, účet majiteľa, demo iba do prázdnej databázy. `TRUST_PROXY=2` kvôli správnej IP za Vercelom a Renderom |

