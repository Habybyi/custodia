# Custodia CRM

<p align="center"><img src="docs/brand/svg/lockup_dark.svg" alt="Custodia: Kráľovsky bez starostí" width="320"></p>

Systém na správu zákazníkov a servisu pre firmu Custodia (návrh a inštalácia smart závlahy, sezónny servis, starostlivosť o trávnik). Vznikol v rámci **SSOSTA IT Challenge 2026**, časť *Programovanie: Systém na správu zákazníkov*.

Nahrádza zošit a súkromný mobil majiteľa: žiadna požiadavka sa nestratí, o každej záhrade je jasné, čo je na nej nainštalované, a servis sa dá plánovať vopred.

## Rýchly štart

Potrebuješ **Node.js 20+** a **Docker Desktop** (zapnutý).

```bash
npm run setup
```

```bash
npm run dev
```

`setup` pripraví všetko naraz: `.env` s náhodnými kľúčmi, databázu v Dockeri, balíčky, tabuľky a ukážkové dáta. Stačí ho spustiť raz.

| Čo | Kde |
|---|---|
| Web firmy (kalkulačka, servisný formulár, AI asistent) | http://localhost:5173 |
| CRM a zákaznícky portál (prihlásenie) | http://localhost:5173/login |
| Odoslané e-maily (Mailpit) | http://localhost:8025 |
| API | http://localhost:5173/api/v1 |

| Účet | E-mail | Heslo |
|---|---|---|
| Majiteľ | `milan.kovac@custodia.sk` | `ZmenMa123!` (pri prvom prihlásení si ho zmení) |
| Brigádnik | `peter.brigadnik@custodia.sk` | `Brigadnik123` |
| Zákazník (portál) | `maria.kollarova@example.sk` | `Zakaznik123` |

Živé dáta zo senzorov na prezentáciu: `npm run iot:simulate` (s `-- --leak` po 15 s nahlási únik vody a vznikne požiadavka).

Pred ukážkou môžeš demo vrátiť do pôvodného stavu príkazom `npm run demo:reset` (zmaže zákazníkov, požiadavky a termíny a nahrá demo znova, účty a materiál ostanú).

## Scenár na prezentáciu (5 minút)

Každý krok ukazuje riešenie jedného problému z príbehu firmy.

| # | Ukáž | Problém zo zadania |
|---|---|---|
| 1 | **Prehľad**: havária navrchu, mesačný kalendár s bodkami podľa priority | Nič sa nestratí, Milan hneď vidí, čo horí |
| 2 | **Požiadavky → Nová požiadavka**: napíš „0905 301 113“, nájde Novotného, klikni Porucha, ulož | Telefonát už nejde do zošita |
| 3 | **Mailpit**: zákazník dostal potvrdenie s číslom požiadavky | Zákazník vie, že sa na neho nezabudlo |
| 4 | **Zákazníci → Hudák → Záhrady → technická karta**: zóny, postrekovače, história od roku 2021, upozornenie na starší systém | Milan si nepamätá, čo kde je |
| 5 | **Kalendár → Plánovač sezóny**: vyber obec, deň a technika, systém rozloží časy | Jarná a jesenná špička |
| 6 | **Kalendár**: plný deň alebo obsadený technik, systém upozorní | Brigádnik nie je vždy k dispozícii |
| 7 | Prihlás sa ako **brigádnik**, otvor výjazd: checklist materiálu podľa zón, navigácia, dokonči výjazd | Brigádnik ide bez materiálu a vracia sa |
| 8 | **Materiál a sklad**: zásoba sa odpísala, upozornenie na nízky stav | Prehľad o nákladoch |
| 9 | **Plánovač → Pripomienky zákazníkom**: kampaň „Blíži sa zima“ | Zadanie výslovne chce pripomienku zazimovania |
| 10 | Zmenši okno alebo otvor na mobile | Milan nie je informatik a brigádnik je v teréne |

## Stav

| Fáza | Obsah | Stav |
|---|---|---|
| 0 | Základ: databáza, prihlásenie, roly, správa tímu, dizajn | ✅ |
| 1 | Zákazníci a technická karta záhrady | ✅ |
| 2 | Servisné požiadavky | ✅ |
| 3 | Plánovanie a kalendár | ✅ |
| 4 | Výjazd, materiál a notifikácie | ✅ |
| 5 | Doladenie: rozloženie bez skrolovania, GDPR, demo dáta, testy, spúšťanie jedným príkazom | ✅ |
| 6 | Bonus: web firmy napojený na CRM, mapa trasy dňa, IoT senzory, zákaznícky portál, logy | ✅ |

## Čo už vie

- **Prihlásenie a roly:** majiteľ, technik (brigádnik), zákazník. Nové účty majú dočasné heslo.
- **Tím:** majiteľ pridá brigádnika, deaktivuje účet alebo vygeneruje nové heslo.
- **Zákazníci:** vyhľadávanie (meno, telefón, e-mail, adresa), filter podľa stavu a obce, kontakt jedným ťuknutím (zavolať, e-mail).
- **Technická karta záhrady:** zdroj vody, riadiaca jednotka, rok a verzia systému, zóny (postrekovače, ventily), fotky z mobilu, navigácia na adresu.
- **História zásahov:** časová os všetkých zásahov, dá sa do nej prepísať aj stará história zo zošita.
- Upozornenie na starší systém (staršie inštalácie mali iné diely).
- **Servisné požiadavky:** stavy (nová, naplánovaná, v riešení, hotová, uzavretá), priorita s haváriami navrchu, priradenie technikovi, história každej zmeny.
- **Jednotný príjem:** ručne počas telefonátu (nájde zákazníka aj podľa čísla v inom tvare), z webu (formulár, kalkulačka) a z e-mailu. Neznámy človek sa založí ako dopyt.
- **Kalendár:** týždeň výjazdov, kapacita každého dňa (obsadené/max), filter podľa technika. Majiteľ zmení kapacitu dňa jedným klikom (jarná špička viac, dovolenka 0).
- **Plánovanie s kontrolou:** pri termíne vidno, koľko je v ten deň voľných miest a kam sa už ide. Systém upozorní na plný deň alebo obsadeného technika a Milan sa rozhodne, či aj tak.
- **Plánovač sezóny:** nenaplánované zazimovania alebo spustenia zoskupené podľa obce. Vyberie celú obec, deň a technika, systém rozloží časy za sebou aj s presunom.
- **Rezervácie zo webu:** zákazník si vyberie voľný deň, Milan potom potvrdí presný čas. Zrušený termín vráti požiadavku medzi nové, aby sa nestratila.
- **Výjazd pre technika:** jedna obrazovka s kartou záhrady (zóny, voda, jednotka, čo sa robilo naposledy), checklistom materiálu a tlačidlami zavolať a navigovať. Odškrtnutý checklist sa nestratí ani po zatvorení appky.
- **Checklist materiálu:** podľa typu zásahu a počtu zón (zazimovanie s 5 zónami = 5 konektorov). Ukáže aj, čo chýba na sklade.
- **Dokončenie výjazdu:** čo sa urobilo, ako dlho, minutý materiál (predvyplnený z checklistu). Odpíše sa zo skladu, zapíše do histórie záhrady a požiadavka sa uzavrie alebo ostane „v riešení“, ak treba prísť znova.
- **Sklad:** katalóg s cenami, príjem tovaru, upozornenie e-mailom, keď niečo dochádza.
- **Pripomienky:** na jeseň zazimovanie, na jar spustenie (automaticky v nastavený deň, nikto ich nedostane dvakrát ani po zásahu), deň pred termínom zákazníkovi a technikovi zoznam výjazdov. Zákazník sa dá z pripomienok odhlásiť.
- **Bez skrolovania na počítači:** obrazovka sa vždy zmestí, zoznamy majú stránkovanie podľa výšky okna, detaily sú v záložkách. Na mobile sa skroluje normálne a dole je lišta.
- **Mesačný kalendár na prehľade:** bodka = výjazd vo farbe priority, klik na deň otvorí ten týždeň.
- **GDPR:** export všetkých údajov zákazníka (JSON) a natrvalo zmazanie na žiadosť.
- **Dnešné výjazdy** na prehľade (technik vidí svoje) s tlačidlami zavolať a navigovať.
- **Potvrdenia e-mailom:** zákazník dostane číslo požiadavky správu s termínom, pri presune alebo zrušení termínu a keď je hotovo. Majiteľ dostane upozornenie na novú požiadavku zvonku.

## Technológie

React 19 + Vite · Node.js + Express 5 · PostgreSQL 16 + Prisma · Docker Compose

## Testy

```bash
npm test
```

22 testov overuje logiku, na ktorej stojí najviac: párovanie telefónnych čísel, dni a časy cez zmenu letného času, validáciu formulárov, e-mailové šablóny (aj ochranu proti vloženému kódu) a odhad typu požiadavky z e-mailu.

## Dokumentácia

- **[Ako to celé funguje (hlavná dokumentácia)](docs/dokumentacia.md)**
- [Analýza: problém → funkcia → rola](docs/analyza.md)
- [Architektúra a rozhodnutia](docs/architektura.md)
- [Web firmy: nastavenia, AI asistent, cookies](docs/web.md)
- [API pre web firmy (formulár, kalkulačka, e-maily)](docs/api-pre-web.md)
- [Značka: logá (SVG) a style guide farieb](docs/brand/)

## Tím

SSOSTA IT Challenge 2026 · Adam Hyben, Marek Skokan, Randy Belačík
