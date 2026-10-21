# drinkR – Ionic-PWA (Deutsch)

Die neue Version läuft ausschließlich im Browser. Sie verwendet Ionic React, TypeScript,
Recharts und Vite. Die bisherigen R-Versionen bleiben unverändert unter
`shiny_app/` und `shinylive_app/` erhalten.

## Lokal

Node.js 20+ wird empfohlen.

```bash
cd web
npm install
npm test
npm run dev
npm run build
npm run preview
```

## GitHub Pages

In GitHub unter **Settings → Pages → Build and deployment** als Quelle
**GitHub Actions** auswählen. Nach Merge in `master` veröffentlicht
`.github/workflows/pages.yml` das Build unter
`https://j0hnhaas.github.io/drinkr/`. Ein Pull Request testet und baut,
veröffentlicht jedoch nicht.

## Eigene Domain

Beim Build die Umgebungsvariable `VITE_BASE_PATH=/` setzen und den
Inhalt von `web/dist/` nach `https://drinkr.mindster.at/` übertragen.
Es werden keine absoluten GitHub-URLs im App-Code verwendet.

## Modell & Grenzen

`src/model.ts` portiert den historischen drinkR-Algorithmus
von Rasmus Bååth: Seidl/Widmark-Verteilungsfaktor, exponentielle
Resorption (Halbwertszeit) und minutengenaue lineare Elimination.
Die Anzeige ist **Promille (‰)**, im Original dagegen **Prozent (%)**.
Daher gilt: `1 % BAC = 10 ‰`. Die Option zum Abbau wird in
`‰ pro Stunde` angegeben, das Original verwendete `% pro Stunde`.

Die berechneten Werte sind Modellschätzungen, keine Messungen. Sie sind
insbesondere **nicht zur Beurteilung der Fahrtüchtigkeit** geeignet.
Die Anwendung erfasst keine Daten auf dem Server; Eingaben bleiben
nur während der aktuellen Sitzung im Arbeitsspeicher des Browsers.

## Rechte

Die neue Oberfläche steht unter der MIT-Lizenz des Originalprojekts.
Copyright (c) 2014 Rasmus Bååth für den Originalcode.
Die originale `LICENCE.txt` bleibt erhalten.
