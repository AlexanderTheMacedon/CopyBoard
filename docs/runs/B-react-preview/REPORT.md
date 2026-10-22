# Run B · React Foundation — Bericht

**Datum:** 22.10.2026 · **Branch:** `feature/copyboard-react-preview-b` (von `1fe15eb9cfb80ebb216fd700baac0e7e625474bf`)
**Status:** React-Preview lauffähig unter `/preview.html`, schreibgeschützt auf synthetischen Fixtures. Kein PR, kein Merge, kein Deployment.

## 1. Ausgangslage (verifiziert)

- `origin/develop` = `ec71762bb492288c916f16b34a2115ad6e8baf2b` (R02 enthalten).
- Foundation-Branch und HEAD = `1fe15eb9…`; Arbeitsbaum sauber; Zielbranch existierte weder lokal noch remote.

## 2. Abhängigkeiten (exakt gepinnt, `save-exact`)

| Paket | Version | Art | Kompatibilität |
| --- | --- | --- | --- |
| `react` | 19.3.1 | dependency | — |
| `react-dom` | 19.3.1 | dependency | Peer `react ^19.3.1` |
| `@types/react` | 19.3.0 | dev | — |
| `@types/react-dom` | 19.3.0 | dev | Peer `@types/react ^19.3.0` |
| `@vitejs/plugin-react` | 6.1.2 | dev | Peer `vite ^8.0.0` (vorhanden: 8.3.5); optionale Peers (Babel, React Compiler) nicht installiert |

Keine weitere Bibliothek: kein Router, kein State-Manager, keine CSS-/Icon-/Markdown-Library. Bestehende Vite-/TS-/Vitest-/Playwright-Infrastruktur unverändert weiterverwendet.

## 3. Architektur (`src/next`)

```
main.tsx            Entry, StrictMode, setzt data-preview-status="react-foundation"
app/                App (useReducer), Context, UI-State + Reducer, Preference-Modell, Hooks
domain/             Typen, ReadOnlyLibrary-Interface (ohne Schreibmethoden), lokale Suche
fixtures/           synthetische Spaces/Items → fixtureLibrary (einzige Datenquelle)
components/         Primitive: Icon, IconButton, SegmentedControl, Popover, Dialog, DemoBadge
features/           shell · spaces · capture · grid · items · inspector · composer · recorder · search · settings
styles/             tokens · base · components · shell · board · panels
```

- **Datengrenze (ADR-007 §4):** Komponenten sehen nur `ReadOnlyLibrary`. Ein späterer, separat freizugebender Adapter kann dasselbe Interface liefern.
- **State:** ein Reducer für Navigation, Inspector/Composer, Overlays, Recorder-Sichtbarkeit und Preferences; eine Preference-Quelle für Quick Preferences und Settings Studio (D-033). Alles flüchtig.
- **Aktionsregister** (`features/items/item-actions.ts`): eine Quelle für Karten-Quick-Action und Inspector (D-006); Demo-Aktionen melden nur „nicht verfügbar“.
- **Vite:** React-Plugin nur für `src/next/**/*.ts(x)`; die Dev-only-Fast-Refresh-Präambel wird nur in `preview.html` injiziert, `/` wird im Dev wie in Run A ausgeliefert.

## 4. Implementierte Komponenten und Interaktionen

| # | Bereich | Umsetzung | Bezug |
| --- | --- | --- | --- |
| 1 | App Shell | Sidebar · Sticky-Toolbar + Ambient-Header · Workspace · rechte Kontextfläche (Inspector **oder** Composer) · Activity-Layer (Recorder) · modale Layer · Skip-Link | D-001, IA-02 §3 |
| 2 | Spaces | „Deine Spaces“ + „Schnellzugriff“ (Alle, Favoriten, Zuletzt, Sessions), `aria-current`, Zähler, „Neuer Space“ als Demo; Sidebar-Modi kompakt/ausgefahren/dynamisch (Overlay ohne Layoutsprung) | D-002, D-018 |
| 3 | Smart Grid | Grid und Liste mit identischer Kachel und Reihenfolge, Dichte Komfort/Standard/Kompakt, typgerechte Vorschauen (Text, Markdown, Code, Bild, Datei, Audio), Copy/Download als Demo-Quick-Action | D-005, D-006, D-032 |
| 4 | Smart Capture | Eingabe, Anhang (Demo), Mikrofon → Recorder, Hinzufügen (Demo, keine Karte), Drop-Zustand ohne Lesen der Drop-Daten; Capture-Trigger in Toolbar und Dock öffnen dieselbe Bar | D-003, D-020 |
| 5 | Inspector | Detail je Typ, Metadaten, Tags, Aktionen aus dem Register, „Im Space anzeigen“; Fokus auf Titel, Escape → Fokus zurück zur Karte | D-004 |
| 6 | Search Palette | Combobox/Listbox, Pfeiltasten/Enter/Escape, Zuletzt-Liste, Befehle (Space, Ansicht, Theme, Einstellungen), Leerzustand; Treffer öffnen den Inspector **ohne** stillen Space-Wechsel; `Cmd/Ctrl+K` nur als H-02-Vorschlag | D-021, SM-07 |
| 7 | Composer | Quelltext/Vorschau/Split (Split auf Phone deaktiviert), sichere Markdown-Vorschau ohne HTML-Interpretation, Context Rail (Materialien/Timeline als Platzhalter), Status „nicht gespeichert“ | D-007, D-010 |
| 8 | Recorder | Floating Shell, Zustandsvorschau idle…error als reine Darstellung, Start deaktiviert, Session-Panel, bleibt beim Space-Wechsel offen | D-008 |
| 9 | Settings | Settings Studio (Allgemein & Darstellung / Daten & Sync / Sicherheit & Datenschutz) mit Tabs; Theme, Sidebar, Dichte, Ansicht funktionsfähig; übrige Felder als „noch nicht verfügbar“ | D-031, D-033 |
| 10 | Mobile | < 600 px: Sidebar → Drawer, Adaptive Dock (Spaces/Suche/Erfassen + Aufnahme), Inspector/Palette/Settings als Vollansicht, Recorder oberhalb des Docks, Safe-Area-Token | D-030 |

Querschnitt: Design-Tokens als CSS-Variablen (Blueprint-04-Kandidaten), Light/Dark/System ohne Persistenz, eigener Dark-Mode, Space-Tint im Ambient, `prefers-reduced-motion`/`prefers-reduced-transparency`, `corner-shape: squircle` als Progressive Enhancement, sichtbarer Fokusring.

## 5. Testmatrix (Abschlusslauf, ein Durchgang)

| Prüfung | Ergebnis |
| --- | --- |
| `npm ci` | OK (nur npm-Hinweis `allow-scripts` zu `fsevents`, wie bisher) |
| `npm test` → `check:syntax` | 14/14 Dateien OK |
| `npm test` → `typecheck` (strict + legacy) | OK |
| `npm test` → `test:unit` | 4 Dateien, **80/80 PASS** (legacy-contract 5 · preview-isolation 54 · preview-domain 16 · preview-render 5) |
| `npm run build` | OK; `dist/index.html`, `preview.html`, `assets/`, `CNAME` |
| Legacy-Build-Vergleich gegen `1fe15eb` | `index.html`, `main-*.js`, `main-*.css`, `modulepreload-polyfill-*.js`, `CNAME` **byte-identisch** |
| Legacy-Quellen gegen `1fe15eb` | `index.html`, `src/js`, `src/styles`, `CNAME` unverändert |
| `node scripts/e2e.mjs smoke` (dist) | Foundation **6/6** · Preview **13/13** · R02-Subset **8/8** · `E2E OK` |
| `node scripts/e2e.mjs smoke --target=dev` | Foundation **6/6** · Preview **13/13** · R02-Subset **8/8** · `E2E OK` |
| Negativprobe Isolations-Guard | temporäre Datei mit `navigator.clipboard` + Legacy-Import → 2 FAIL wie erwartet, danach entfernt |

Preview-Browser-Suite `tests/e2e/preview.mjs` (P1–P13): Boot ohne Fehler · Space-Wechsel · Grid/Liste + Dichte mit gemeinsamer Preference · Inspector + Fokus · Suche/Befehle/Shortcut · Composer + XSS-Probe · Recorder ohne Mikrofon · Capture/Drop/Copy nur Demo · Theme/System/Sidebar ohne Persistenz · Hover-Sidebar ohne Layoutsprung · Empty/Unavailable · Phone-Layout · Reduced Motion.

## 6. Nachweis der Datenisolation

1. **Statisch** (`preview-isolation.test.ts`, jede Datei in `src/next` inkl. CSS): verboten sind Storage (`localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `caches`), Netzwerk (`fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `http(s)://`), Supabase, Clipboard, `getUserMedia`/`MediaRecorder`, `FileReader`, `dataTransfer.files/items/getData`, Datei-Picker, `innerHTML`/`dangerouslySetInnerHTML`, Legacy-Module. Importe nur innerhalb `src/next` oder `react`/`react-dom/client`.
2. **Laufzeit** (jede Preview-Browser-Probe): Instrumentierung vor dem ersten Skript zählt jeden Zugriff auf Storage-Getter und -Methoden, Cookie, Cache Storage, `fetch`, XHR, `sendBeacon`, Clipboard, `getUserMedia`, `permissions.query`, `DataTransfer.files/items/getData`, `window.open`; zusätzlich alle Requests außerhalb der Origin (abgebrochen) sowie fetch/xhr/eventsource/websocket-Requests. Ergebnis in allen 13 Proben: **0**. Smoke F5 bestätigt zusätzlich 0 Storage-Writes bei vorbelegtem Legacy-Board auf derselben Origin.
3. **Bundle:** `dist/assets/preview-*.js` enthält keine Treffer für `localStorage|sessionStorage|indexedDB|supabase|getUserMedia|navigator.clipboard`.
4. `previewInfo.writesEnabled === false`, `cloudEnabled === false`; `ReadOnlyLibrary` hat keine Schreibmethode (Unit-Test).

## 7. Bekannte Einschränkungen

- Nur Chromium getestet (Desktop 1440×900, Phone 390×844 emuliert). Safari/iOS, Firefox, echte Geräte, Screenreader und Kontrast im gerenderten Composite sind **nicht** geprüft.
- Bewusst nicht gebaut: Ordner/Breadcrumbs, Mehrfachauswahl, Sortierung/Drag & Drop, Space-Erstellung, Handoff Sheet, Sync Center, Recovery, Kontextmenü, Inspector-Resize/Fokusmodus, Virtualisierung (Details: `DESIGN-HANDOFF.md` §6).
- Markdown-Vorschau ist ein minimaler sicherer Teilumfang (Überschriften, Listen, Codeblöcke, Absätze).
- Tablet: im Modus „Immer ausgefahren“ bleibt die Sidebar unter 1024 px als Rail mit Overlay (Ableitung aus IA-02 §4.2, keine Nutzerentscheidung).
- `Cmd/Ctrl+K` und Breakpoints 600/1024 px sind Vorschläge (H-02, IA-02 §4.4).
- Smoke-Test F5 heißt noch „renders the placeholder“; seine Prüfung (0 Storage-Writes, 0 fremde Requests) läuft jetzt gegen die React-App und ist grün.
- Die vollständige R02-Suite (`test:e2e:full`) wurde in diesem Run nicht ausgeführt; Legacy-Quellen und Legacy-Build sind byte-gleich zu `1fe15eb`.

## 8. Lokal starten

```bash
npm ci
npm run dev       # → http://127.0.0.1:5173/preview.html
# oder als Build:
npm run build && npm run preview   # → http://127.0.0.1:4173/preview.html
```
