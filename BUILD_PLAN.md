# Malta2900: Build-Plan

> **Anleitung für Claude Code:** Diese Datei ist der Bauplan für dieses Projekt und lebt im Projekt-Root. Arbeite die Phasen in Reihenfolge ab - immer nur die eine, die laut Tabelle unten als `offen` markiert ist. Bevor du mit einer Phase beginnst: sieh dir den tatsächlich vorhandenen Code an (nicht nur den "Kontext"-Absatz der Phase), um den echten Stand zu verifizieren - der Kontext-Absatz ist eine Zusammenfassung, kein Ersatz fürs Nachschauen. Setze den Status einer Phase erst dann von `offen` auf `erledigt` (sowohl in der Tabelle als auch in der Überschrift der Phase selbst), wenn du sie wirklich implementiert UND aktiv getestet hast (siehe Akzeptanzkriterien je Phase) - nicht schon, wenn der Code nur plausibel aussieht. Bearbeite pro Durchlauf genau eine Phase, es sei denn, der Nutzer sagt ausdrücklich etwas anderes. Wenn eine als "erledigt" markierte Phase bei genauerem Hinsehen nicht wirklich funktioniert, korrigiere den Status ehrlich zurück auf `offen` und erkläre kurz warum, statt es zu verschweigen.

## Projektübersicht

- **Titel**: Malta2900
- **Storyline**: Der Spieler wird ins Jahr 2900 transportiert und erwacht am Strand von Malta. Die Insel ist mittlerweile menschenleer und verfallen (Ruinen statt lebendiger Zivilisation) - warum, bleibt bewusst offen/unausgesprochen, das ist reine Stimmungs-Prämisse, kein Quest-System. Der Spieler muss nun ums Überleben kämpfen: Dinge sammeln, anbauen, sich versorgen.
- **Setting**: Verlassenes, zukünftiges Malta statt eines generischen Tropen-Eilands - Ruinen, Zisternen, verwilderte Feigenbäume und Gärten statt Dschungel/Palmen. Entspanntes Survival ohne Kampf/Gegner (keine feindlichen Überlebenden oder Kreaturen).
- **Spielgefühl**: Kein Echtzeit-Bewegungsspiel mit Figur/Canvas, sondern ein **strategisches Management-Spiel**: Formularelemente, Buttons, Balken, kleine Icons/Grafiken. Man trifft Entscheidungen und startet Aktionen (Sammeln, Anbauen, Schlafen, Craften), die reale Zeit brauchen.
- **Persistenz**: Die Spielwelt läuft serverseitig weiter, auch wenn der Nutzer den Browser geschlossen hat - Aktionen wie Schlafen oder Anbauen sind beim nächsten Login fertig, ohne dass der Nutzer online sein musste.
- **Kernmechaniken**: Hunger & Durst, Ressourcen sammeln, Anbauen (Gemüsegarten mit echter Wartezeit) & Craften, (leichter) Basisbau, Tag-/Nacht-Zyklus & Wetter.
- **RPG-Tiefe**: Leichte Progression (XP/Level mit spürbaren, aber einfachen Boni) - keine Skillbäume, keine Story/Quests über die eingangs erwähnte Prämisse hinaus.
- **Mehrere Nutzer**: Registrierung/Login, jeder Account hat einen eigenen, unabhängigen Spielstand (eigene Insel-Erfahrung).
- **Umfang**: Kompakter Kern in 4 Phasen.

### Architektur

Docker-Compose-Stack mit drei Containern:

- **`app`**: Next.js (Frontend + Backend über API-Routen in einem Projekt)
- **`worker`**: eigener Node.js-Prozess, der die Spielwelt in einer Schleife fortlaufend simuliert (Hunger-/Durstabbau, Abschluss zeitbasierter Aktionen, Tag/Nacht, Wetter) - läuft unabhängig davon, ob ein Nutzer eingeloggt ist
- **`db`**: PostgreSQL für alle Spielstände, angebunden über Prisma als ORM

### Getroffene Annahmen (vor dem Start anpassen, falls gewünscht)

- **Auth**: NextAuth.js mit Credentials-Provider (Benutzername/Passwort, Passwort gehasht z. B. mit bcrypt). Wenn du lieber eine andere Auth-Lösung willst (z. B. Magic Links, OAuth), ändere das in Phase 1, bevor sie begonnen wird.
- **Zeitmodell**: Zeitbasierte Aktionen speichern Start-Zeitpunkt + Dauer in der Datenbank; der Worker prüft periodisch (Tick), was inzwischen fertig ist, und rechnet dabei die *tatsächlich vergangene* Zeit nach - nicht nur eine Tick-Anzahl. Dadurch stimmt der Fortschritt auch nach längerer Downtime.
- **Zahlen/Balancing** (Sammel-Dauer, Abbauraten, Kosten) sind bewusst grobe, aber in sich konsistente Platzhalterwerte - leicht später nachjustierbar, wenn sich das Spielgefühl nicht richtig anfühlt.
- **Frontend-Updates**: Das Dashboard fragt den Server per einfachem Polling (z. B. alle 10 Sekunden) nach dem aktuellen Zustand ab - kein WebSocket/Realtime nötig für den kompakten Kern.

## Phasenübersicht

| # | Phase | Status |
|---|-------|--------|
| 1 | Infrastruktur-Grundgerüst, Auth & leerer Spielstand | erledigt |
| 2 | Grundbedürfnisse & Worker-Tick (Feige) | erledigt |
| 3 | Ressourcen, Anbauen, Crafting & Basisbau | erledigt |
| 4 | Tag/Nacht, Wetter & leichte Progression | erledigt |

---

## Phase 1: Infrastruktur-Grundgerüst, Auth & leerer Spielstand — Status: erledigt

**Kontext:**
Das ist ein neues Projekt namens **Malta2900**. Es gibt noch keinen Code. Storyline: Der Spieler wurde ins Jahr 2900 transportiert und erwacht am Strand der mittlerweile verlassenen Insel Malta - muss nun ums Überleben kämpfen (sammeln, anbauen, sich versorgen). Technisch ist es ein browserbasiertes Survival-Management-Spiel (kein Echtzeit-Bewegungsspiel, sondern ein Dashboard mit Aktionen/Buttons/Balken), das serverseitig auch ohne aktiven Browser weiterläuft. In dieser ersten Phase geht es nur um Infrastruktur, Login und einen leeren Spielstand - Survival-Mechaniken kommen erst in späteren Phasen.

**Ziel dieser Phase:**
`docker compose up` startet den kompletten Stack. Man kann sich registrieren, sich einloggen und landet auf einem Dashboard mit dem Titel "Malta2900", das eine kurze Intro-Zeile zur Storyline (angespült am Strand des Jahres 2900) sowie die Grundwerte Hunger, Durst und Energie bei jeweils 100 anzeigt.

**Anforderungen:**
- Next.js-Projekt (App Router, TypeScript) im `app`-Service.
- PostgreSQL im `db`-Service mit einem Docker-Volume, damit Daten Container-Neustarts überleben.
- Prisma als ORM. Schema mit mindestens den Modellen `User` (id, username, passwordHash, createdAt) und `PlayerState` (id, userId, hunger, thirst, energy, createdAt, updatedAt - Startwerte jeweils 100).
- Registrierung: Formular mit Benutzername + Passwort, Passwort gehasht gespeichert (z. B. bcrypt). Beim Registrieren wird automatisch ein `PlayerState` mit Startwerten angelegt.
- Login: Formular mit Benutzername + Passwort, Session-Verwaltung über NextAuth.js (Credentials Provider).
- Dashboard-Seite (nur für eingeloggte Nutzer erreichbar) mit Titel "Malta2900", einer kurzen Intro-/Flavor-Zeile (z. B. "Jahr 2900. Du erwachst am Strand einer verlassenen Insel...") und Hunger/Durst/Energie als Balken oder Zahlen.
- `worker`-Service: eigener kleiner Node.js-Prozess im selben Repo, der beim Start nur "Worker gestartet" loggt und dann in einer einfachen Endlosschleife (z. B. alle 30 Sekunden) "Worker-Tick" loggt - echte Logik kommt in Phase 2.
- `docker-compose.yml` mit den drei Services `app`, `worker`, `db`. `DATABASE_URL` wird als Umgebungsvariable an `app` und `worker` durchgereicht.
- Kurzes README mit Startanleitung (inkl. eventuell nötigem einmaligem Migrationsbefehl).

**Technische Vorgaben:**
- Next.js (aktuelle stabile Version), TypeScript.
- Prisma für Datenmodell und Migrationen.
- NextAuth.js für Auth (Credentials Provider), Session per JWT oder DB-Session - wähle die im NextAuth-Ökosystem übliche Standardvariante und begründe sie kurz im README.
- Kein Styling-Aufwand - funktionale HTML-Formularelemente (Input, Button, einfache Balken/Progress-Elemente) reichen völlig.
- Alles muss über `docker compose up` (nach den im README beschriebenen Erstinstallationsschritten) startbar sein.

**Akzeptanzkriterien:**
- [ ] `docker compose up` startet drei laufende Container: `app`, `worker`, `db`.
- [ ] Über die Next.js-App lässt sich ein neuer Account registrieren (Benutzername + Passwort).
- [ ] Mit dem erstellten Account lässt sich einloggen.
- [ ] Nach dem Login zeigt das Dashboard Hunger, Durst und Energie jeweils bei 100.
- [ ] Ein zweiter, separat registrierter Account hat einen eigenen, unabhängigen Spielstand (Datentrennung funktioniert nachweisbar).
- [ ] Die Logs des `worker`-Containers zeigen die Start- und Tick-Meldungen.
- [ ] Öffne die Anwendung tatsächlich im Browser (Screenshot-Tool/Playwright), teste Registrierung, Login und Dashboard-Anzeige aktiv, bevor du diese Phase als erledigt markierst.

**Bewusst NICHT in dieser Phase:**
- Keine echte Worker-Logik (Hunger-/Durstabbau, Aktionen) - kommt in Phase 2.
- Keine Ressourcen, kein Crafting, kein Basisbau.
- Kein Tag-/Nacht-Zyklus, kein Wetter.
- Kein "Passwort vergessen"-Flow, keine E-Mail-Verifizierung.
- Kein visuelles Styling-Feinschliff.

---

## Phase 2: Grundbedürfnisse & Worker-Tick (Feige) — Status: erledigt

**Kontext:**
Es existiert bereits ein Next.js/Prisma/PostgreSQL/NextAuth-Projekt mit Docker-Compose-Stack (`app`, `worker`, `db`). Registrierung, Login und ein Dashboard mit Hunger/Durst/Energie (je 100) pro Nutzer funktionieren. Der `worker`-Container läuft bereits in einer Schleife, tut aber inhaltlich noch nichts.

**Ziel dieser Phase:**
Hunger und Durst sinken jetzt tatsächlich über echte Zeit, weil der Worker sie im Hintergrund für alle Spieler abbaut - auch wenn niemand eingeloggt ist. Der Spieler kann durch eine erste zeitbasierte Sammel-Aktion (Feige) gegensteuern.

**Anforderungen:**
- Der Worker verarbeitet in jedem Tick (z. B. alle 30 Sekunden) ALLE Spieler aus der Datenbank.
- Der Hunger-/Durstabbau wird anhand der seit dem letzten Tick tatsächlich vergangenen Zeit berechnet (z. B. über ein `lastTickAt`-Feld pro Spieler), nicht anhand einer festen Tick-Anzahl - so stimmt der Fortschritt auch nach einer Downtime des Workers.
- Beispiel-Raten: Hunger sinkt um 1 Punkt pro 2 Minuten realer Zeit, Durst um 1 Punkt pro 90 Sekunden.
- Fällt Hunger oder Durst auf 0, sinkt zusätzlich die Energie kontinuierlich (z. B. 1 Punkt pro Minute), solange der Zustand anhält.
- Das Dashboard fragt den aktuellen Zustand per API-Route regelmäßig ab (z. B. alle 10 Sekunden Polling) und aktualisiert die Anzeige ohne Seiten-Neuladen.
- Neues Datenmodell `PendingAction` (id, playerId, type, startedAt, readyAt) für zeitbasierte Aktionen.
- Button "Feige sammeln": legt eine `PendingAction` vom Typ `collect_figs` mit z. B. 60 Sekunden Dauer an. Während eine Aktion läuft, zeigt die UI einen Countdown, und der Button ist deaktiviert.
- Der Worker schließt bei jedem Tick fällige `PendingAction`-Einträge ab (readyAt in der Vergangenheit) und wendet ihren Effekt an - hier: eine Feige landet im Inventar (einfaches Feld `figCount` am `PlayerState` reicht).
- Button "Feige essen" (nur aktiv, wenn `figCount` > 0): füllt Hunger sofort um 20 Punkte auf (max. 100) und reduziert `figCount` um 1.
- Zeige `figCount` als Zahl im Dashboard.

**Technische Vorgaben:**
- Erweitere das bestehende Prisma-Schema (kein neues Projekt), füge Migrationen hinzu.
- Zeitbasierte Aktionen ausschließlich serverseitig speichern und auswerten (kein reiner Client-seitiger Timer), damit sie auch nach Tab-Schließen/Neuladen korrekt weiterlaufen.
- Die Polling-API-Route soll effizient nur den eigenen Spielerzustand zurückgeben (Auth-geschützt über die bestehende Session).

**Akzeptanzkriterien:**
- [ ] Ohne jede Interaktion sinkt der Hunger-Wert sichtbar, wenn man nach ca. 3 Minuten das Dashboard erneut ansieht (auch nach zwischenzeitlichem Schließen des Tabs).
- [ ] Klick auf "Feige sammeln" zeigt einen sichtbaren Countdown; der Button ist währenddessen deaktiviert.
- [ ] Nach Ablauf der Sammel-Zeit erscheint automatisch eine Feige im Inventar - auch dann, wenn man während des Wartens die Seite neu geladen oder den Tab geschlossen hatte.
- [ ] Klick auf "Feige essen" erhöht Hunger sichtbar und verringert die Feige-Anzahl um 1.
- [ ] Zwei unterschiedliche eingeloggte Accounts haben nachweisbar unabhängige Hunger-/Durst-/Inventar-Werte.
- [ ] Teste dies aktiv im Browser (inkl. eines simulierten Wartens/Neuladens per Screenshot-Tool/Playwright), bevor du diese Phase als erledigt markierst.

**Bewusst NICHT in dieser Phase:**
- Kein Crafting-System, kein Basisbau.
- Keine weiteren Ressourcen außer Feige.
- Kein Tag-/Nacht-Zyklus, kein Wetter.
- Keine Progression/XP/Level.
- Kein eigener Trinken-Mechanismus für Durst - kommt in Phase 3 zusammen mit Wasser als Ressource.

---

## Phase 3: Ressourcen, Anbauen, Crafting & Basisbau — Status: erledigt

**Kontext:**
Es existiert bereits ein Projekt mit funktionierendem Worker-Tick, der Hunger/Durst über echte Zeit abbaut, sowie einer ersten zeitbasierten Sammel-Aktion (Feige) über ein `PendingAction`-System.

**Ziel dieser Phase:**
Der Spieler kann mehrere Rohstoffe sammeln, daraus Gegenstände craften (inklusive eines einfachen Unterschlupfs), erstmals aktiv Nahrung **anbauen** statt nur zu sammeln, und durch eine Schlafen-Aktion Energie zurückgewinnen - alles über echte Zeit, auch bei geschlossenem Browser.

**Anforderungen:**
- Erweitere das `PendingAction`-System um zwei weitere Sammel-Ressourcen: Holz (`collect_wood`, z. B. 90 Sekunden Dauer) und Wasser (`collect_water`, z. B. 45 Sekunden Dauer). Beide erhöhen nach Abschluss die jeweilige Inventar-Zahl (`woodCount`, `waterCount`) am `PlayerState`.
- Neue Aktion "Wasser trinken" (nur aktiv, wenn `waterCount` > 0): erhöht Durst sofort um 20 Punkte (max. 100), verbraucht eine Wassereinheit.
- Crafting-Bereich im Dashboard mit zwei Rezepten:
  - **Lagerfeuer**: kostet 5 Holz, einmalig baubar (Flag `hasFireplace` am `PlayerState`).
  - **Unterschlupf**: kostet 10 Holz, einmalig baubar (Flag `hasShelter`); reduziert danach dauerhaft die Hunger-/Durstabbaurate um 20 % (im Worker-Tick berücksichtigen).
- Craften ist nur möglich, wenn genug Rohstoffe vorhanden sind; die entsprechende Menge wird beim Craften abgezogen. Bereits gebaute Gebäude können nicht erneut gebaut werden (Button verschwindet/ist deaktiviert).
- Neue, deutlich längere Aktion "Gemüse anbauen" (Typ `plant_vegetables`, z. B. 3 Stunden Dauer statt Sekunden - das ist bewusst die längste Aktion im Spiel bisher): kostet einmalig 2 Feigen als Saatgut-Ersatz, danach liefert die Ernte 8 Einheiten Gemüse (`vegetableCount` am `PlayerState`) und füllt beim Ernten zusätzlich sofort etwas Hunger auf (z. B. +15). Diese Aktion demonstriert besonders deutlich das zentrale "läuft auch offline weiter"-Versprechen des Spiels, weil ihre Dauer deutlich länger ist als eine kurze Sammel-Aktion - der Spieler startet sie, schließt den Browser, und die Ernte ist beim nächsten Login fertig.
- Neue Aktion "Schlafen" (Typ `sleep`, z. B. 4 Minuten Dauer als Platzhalter für "eine Nacht"): Hunger/Durst sinken währenddessen ganz normal weiter, aber am Ende der Aktion wird Energie auf 100 gesetzt.
- Es darf pro Spieler immer nur eine `PendingAction` gleichzeitig aktiv sein - der Server muss neue Aktionen ablehnen, solange eine läuft, und die UI muss das klar anzeigen (z. B. "Du bist gerade beschäftigt (Gemüse wächst / Schlafen) - andere Aktionen sind gesperrt").
- Inventar-Bereich im Dashboard mit allen Mengen (Feige, Holz, Wasser, Gemüse) sowie dem Baustatus (Lagerfeuer/Unterschlupf: ja/nein).

**Technische Vorgaben:**
- Erweitere das bestehende Prisma-Schema um die neuen Felder/Flags am `PlayerState` (keine separate Item-Tabelle nötig für diesen Umfang).
- Serverseitige Validierung, dass keine zweite `PendingAction` gestartet werden kann, solange eine offen ist.
- Der Worker muss den Unterschlupf-Bonus (falls `hasShelter` true) beim Abbau-Tick anwenden.

**Akzeptanzkriterien:**
- [ ] Holz und Wasser lassen sich über eigene Sammel-Buttons mit eigenem Countdown sammeln, analog zur Feige.
- [ ] "Wasser trinken" erhöht Durst sichtbar und verringert die Wasser-Anzahl um 1.
- [ ] Bei ausreichend Holz lässt sich das Lagerfeuer craften; der Holzbestand sinkt entsprechend, der Baustatus ist im Inventar sichtbar.
- [ ] Nach dem Bau des Unterschlupfs sinkt die Hunger-/Durstabbaurate nachweisbar langsamer als vorher (im Vergleich über denselben Beobachtungszeitraum vor/nach dem Bau).
- [ ] Bei ausreichend Feigen lässt sich "Gemüse anbauen" starten; die Feigen-Anzahl sinkt entsprechend, und ein sichtbarer Countdown/Fortschritt für die lange Wachstumszeit erscheint.
- [ ] Nach Ablauf der Wachstumszeit ist Gemüse im Inventar vorhanden und Hunger wurde beim Ernten erhöht - auch wenn der Tab während der gesamten Wartezeit geschlossen war (nicht nur kurz zwischendurch).
- [ ] Während einer laufenden Aktion (z. B. Schlafen oder Gemüse-Anbau) sind andere Aktions-Buttons sichtbar gesperrt.
- [ ] Nach Abschluss des Schlafens ist Energie wieder bei 100 - auch wenn der Tab währenddessen geschlossen war.
- [ ] Teste den kompletten Ablauf aktiv im Browser (Screenshot-Tool/Playwright), bevor du diese Phase als erledigt markierst. Für die 3-Stunden-Wachstumszeit reicht es, das Prinzip zu verifizieren (z. B. `readyAt` in der Datenbank manuell/testweise auf "gleich fällig" zu setzen oder die Dauer für den Test kurzzeitig zu verkürzen) statt real 3 Stunden zu warten.

**Bewusst NICHT in dieser Phase:**
- Kein Tag-/Nacht-Zyklus, kein Wettersystem.
- Keine Progression/XP/Level.
- Keine weiteren Gebäude, Rezepte oder Feldfrüchte-Sorten über die genannten hinaus.
- Kein eigenes "Gemüse essen" (das Gemüse wird in dieser Phase nur beim Ernten automatisch etwas Hunger auffüllen; ein separater Verzehr-Button kann bei Bedarf später ergänzt werden).
- Keine Warteschlange für mehrere aufeinanderfolgende Aktionen - eine aktive Aktion nach der anderen reicht.

---

## Phase 4: Tag/Nacht, Wetter & leichte Progression — Status: erledigt

**Kontext:**
Es existiert bereits ein Projekt mit Ressourcen-Sammeln (Feige/Holz/Wasser), einer Anbauen-Mechanik (Gemüse mit langer Wachstumszeit), Crafting (Lagerfeuer/Unterschlupf), Schlafen-Mechanik und einem Worker-getriebenen Hunger-/Durstsystem inklusive Unterschlupf-Bonus.

**Ziel dieser Phase:**
Die Spielwelt hat jetzt einen global fortschreitenden Tag-/Nacht-Zyklus und gelegentliches Wetter, die sich auf Aktionen auswirken. Außerdem sammelt der Spieler durch abgeschlossene Aktionen Erfahrungspunkte, die zu spürbaren, aber einfachen Verbesserungen führen.

**Anforderungen:**
- Neues Modell `WorldState` (eine einzige Zeile, kein Modell pro Spieler) mit aktueller Zykluszeit/Uhrzeit und aktuellem Wetter (z. B. `sunny` oder `rainy`).
- Der Worker schreibt den Tag-/Nacht-Zyklus fort, z. B. ein voller Zyklus alle 10 Minuten realer Zeit. Zeige Uhrzeit oder ein Tag/Nacht-Icon im Dashboard.
- Nachts dauern neu gestartete Sammel-Aktionen spürbar länger (z. B. +50 % Dauer) - wende diesen Modifikator beim Start einer Aktion an (nicht rückwirkend auf bereits laufende Aktionen).
- Der Worker würfelt periodisch (z. B. alle paar Minuten) ein neues globales Wetter. Bei Regen ist die Wasser-Sammel-Dauer kürzer (z. B. -30 %) - ebenfalls nur bei Start einer neuen Aktion angewendet.
- Führe XP ein: jede abgeschlossene Sammel-, Anbau-, Bau- oder Schlafen-Aktion gibt eine kleine feste XP-Menge (z. B. 10 XP für Sammeln, 25 XP fürs Ernten, 30 XP fürs Craften, 20 XP fürs Schlafen).
- Bei Erreichen von XP-Schwellen (z. B. alle 100 XP) steigt ein sichtbares Level, das eine einfache Verbesserung bringt (z. B. 10 % kürzere Sammel-Zeiten pro Level, additiv).
- Zeige Level und XP-Fortschritt (z. B. "Level 2 - XP: 40/100") im Dashboard.

**Technische Vorgaben:**
- `WorldState` wird ausschließlich vom Worker aktualisiert, alle Spieler lesen denselben globalen Zustand.
- `xp` und `level` als neue Felder am `PlayerState`.
- Modifikatoren (Nacht, Regen, Level-Bonus) werden zum Zeitpunkt des Aktionsstarts berechnet und in der `PendingAction` (z. B. als tatsächliche `readyAt`-Zeit) festgeschrieben - eine später eintretende Wetteränderung darf eine bereits laufende Aktion nicht nachträglich verändern.

**Akzeptanzkriterien:**
- [ ] Im Dashboard ist erkennbar, ob gerade Tag oder Nacht ist, und der Zustand wechselt im beobachteten Zeitraum (z. B. nach 5-10 Minuten) tatsächlich.
- [ ] Eine nachts gestartete Sammel-Aktion dauert nachweisbar länger als dieselbe Aktion tagsüber.
- [ ] Das angezeigte Wetter ändert sich im Beobachtungszeitraum mindestens einmal, und eine bei Regen gestartete Wasser-Sammel-Aktion ist nachweisbar kürzer als bei Sonne.
- [ ] Nach mehreren abgeschlossenen Aktionen steigt die XP-Anzeige sichtbar; bei Erreichen der Schwelle steigt das Level, und eine danach gestartete Sammel-Aktion ist nachweisbar kürzer als vor dem Level-Aufstieg.
- [ ] Teste den kompletten Ablauf aktiv im Browser über einen längeren Beobachtungszeitraum (Screenshot-Tool/Playwright), bevor du diese Phase als erledigt markierst.

**Bewusst NICHT in dieser Phase:**
- Keine weiteren Wetter-Typen über Sonnig/Regen hinaus.
- Keine Skillbäume oder wählbare Perks - ein einziger automatischer Level-Bonus reicht.
- Keine Interaktion zwischen Spielern (kein Handel, kein Chat, keine gemeinsame Insel) - jeder Spieler bleibt für sich, auch wenn die Weltzeit global geteilt ist.
- Kein Sound, keine mobile/Touch-Optimierung, kein visuelles Politur-Feinschliff über funktionale Formularelemente hinaus.

---

## Hinweis zur Benutzung dieser Datei

Lege diese Datei als `BUILD_PLAN.md` im Root deines Projektordners ab (dort, wo später auch `docker-compose.yml` liegen wird), damit eine Claude-Code-Session sie automatisch im Kontext sieht bzw. du sie gezielt referenzieren kannst. Starte Claude Code in diesem Ordner und sag z. B.: *"Lies BUILD_PLAN.md und arbeite die nächste offene Phase ab."* Claude Code sollte nach jeder abgeschlossenen und getesteten Phase den Status in dieser Datei selbst aktualisieren (Tabelle oben + Überschrift der jeweiligen Phase), damit der Fortschritt auch über mehrere Sessions hinweg sichtbar bleibt - sag das beim ersten Aufruf ruhig nochmal explizit dazu, falls Claude Code es nicht von selbst tut.
