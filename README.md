# drinkR – Promille-Verlauf

**Neu (in Entwicklung): Deutschsprachige Ionic-PWA.**

Die modernisierte Anwendung liegt unter [`web/`](web/README.md).
Sie verwendet Ionic React, TypeScript, Recharts und Vite und ist
für GitHub Pages unter <https://j0hnhaas.github.io/drinkr/> vorbereitet.

Der historische R-Code von **Rasmus Bååth (2014)** bleibt unverändert:
- [`shiny_app/`](shiny_app/) – klassische R-Shiny-App.
- [`shinylive_app/`](shinylive_app/) – Shinylive/WebAssembly-Export.

Original-Projekt: <https://github.com/rasmusab/drinkr> ·
Original-Demo: <https://rasmusab.github.io/drinkr/>.

## Erste Schritte zur neuen PWA

```bash
cd web
npm install
npm test
npm run dev
npm run build
```

GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Das Workflow-File `.github/workflows/pages.yml` baut und testet Pull Requests
und veröffentlicht nach Merge in `master`.

**Hinweis:** Der Rechner ist ein vereinfachtes Modell und keine Messung.
Insbesondere darf er nicht für Entscheidungen über Fahrtüchtigkeit genutzt werden.

Lizenz: MIT (siehe [LICENCE.txt](LICENCE.txt)); Originalcode © 2014 Rasmus Bååth.
