# Run C · Design WOW v1 — CUTLER-C-Bericht

**Datum:** 22.10.2026 · **Modell:** Fable 5.1 · **Branch:** `feature/copyboard-design-wow-v1` (von `ed551d90a6e41447821e703735a90e4631a2e6e1`)
**Status:** Visueller Design-Run der React-Preview unter `/preview.html` abgeschlossen; Cloudflare-Preview-Build eingerichtet. Kein PR, kein Merge, kein Deployment, keine Änderung an `develop`, `main`, Production oder Supabase. **STOP am Human Gate.**

## 1. Übernahme und Ausgangslage (verifiziert)

- Workspace sauber, HEAD = `ed551d9`, Design-Branch bereits lokal vorhanden; kein zweiter Branch angelegt, keine Änderungen verworfen.
- Ein vorheriger Agent hatte nur Git-Stand, Branch und Dokumentation geprüft; es existierten keine Designänderungen.
- Grundlage: `DESIGN-HANDOFF.md` (Run B), Masterplan v0.42 (D-001…D-033), Blueprints 02–04. Offene Human Gates (H-01…H-05, H-08) wurden **nicht** entschieden; wo sie die Oberfläche berühren, ist das im Code kommentiert (z. B. `Cmd/Ctrl+K` nur als Vorschlag, Empty-State-Motiv als Studie).

## 2. Commits auf dem Design-Branch

| Commit | Inhalt |
| --- | --- |
| `a21f534` | Cloudflare-Pages-Preview-Build (`build:pages-preview` → `dist-preview`, Check-Skript, Test-Parametrisierung). Zwischen-Push für das erste Cloudflare-Preview-Deployment. |
| *(dieser Commit)* | Design-WOW-Run: Tokens, Shell, Board, Panels, Komponenten, Screenshots, dieser Bericht. |

## 3. Cloudflare-Preview-Build (Addendum)

| Punkt | Umsetzung |
| --- | --- |
| Befehl | `npm run build:pages-preview` = `vite build --mode pages-preview` |
| Output | `dist-preview/` mit `index.html`, `assets/preview-*.js`, `assets/preview-*.css`, `favicon.svg` — sonst nichts |
| Mechanik | `vite.config.ts` erhält im Modus `pages-preview` **nur** den Input `preview.html`; ein `enforce: 'post'`-Plugin benennt die emittierte `preview.html` nach dem Schreiben in `index.html` um und legt ein Inline-SVG-Favicon ab. Die Legacy-Eingabe ist nicht Teil dieses Builds, daher können weder Legacy-Bundle, Legacy-CSS, `CNAME` noch Supabase-Konfiguration in den Output gelangen. |
| Normaler Build | unverändert: `dist/index.html`, `main-*.js`, `main-*.css`, `modulepreload-polyfill-*.js`, `CNAME` sind **byte-identisch** zu `ed551d9` (SHA-256-Vergleich vor und nach beiden Commits). |
| Prüfung | `npm run test:pages-preview`: statischer Check (Dateiinventar, relative `./assets`-Pfade, keine externen URLs, keine `localStorage/indexedDB/supabase/getUserMedia/clipboard`-Strings in JS/CSS) + Start von `vite preview` auf `dist-preview` + **komplette Preview-Browser-Suite P1–P13 gegen `/`** inkl. Laufzeit-Instrumentierung (0 Storage-, Netzwerk-, Clipboard-, Mikrofon-, DataTransfer-Zugriffe). |
| Git | `dist-preview/` ist ignoriert. Keine Wrangler-/API-/Cloudflare-Konfiguration berührt. |
| Hinweis | Cloudflare muss Node ≥ 22.12 verwenden (`.nvmrc` = 24, `engines` gesetzt). Ob das Projekt das `.nvmrc` liest, wurde hier nicht geprüft; falls das Deployment mit einer Node-Version-Meldung scheitert, ist `NODE_VERSION` in den Cloudflare-Build-Einstellungen zu setzen (Nutzeraktion, nicht Teil dieses Runs). |

## 4. Designsystem (Tokens, `src/next/styles/tokens.css`)

Alle Werte sind kalibrierte Kandidaten auf Basis der Blueprint-04-Vorschläge, keine finalen Produkt-Tokens (DS-TOKEN-01…03 bleiben offen).

| Bereich | Entscheidung in diesem Run |
| --- | --- |
| Farbe Light | Canvas `#f7f5fb`, Base `#fff`, Text `#27223a / #5f5873 / #7c7590`, Accent Iris `#6e5fcb`, Accent-Soft `#ece7fb`; Statusfarben unverändert semantisch. |
| Farbe Dark | eigenständig: Canvas `#15121f` (Graphit/Aubergine), Base `#1f1b2c`, Accent `#b6a5ff` mit `on-accent #1b1630`; Bokeh-Orbs gesättigter bei 0,6 Opazität. |
| Ambient | Fünf Lichtfelder (Lilac, Orchid, Periwinkle, Iris, Orchid klein) + ein Space-getöntes Feld, 72 px Blur, kontinuierliche Wash-Schicht, Maskenverlauf 560 px → Canvas ohne Kante. Drift 32 s, bei Reduced Motion statisch. |
| Material (D-015) | opak: Karten, Editor, Inspector, Rail, Settings; frosted: Capture (Ruhezustand), Popover, Palette, Recorder, Dock, Sticky-Toolbar, Sidebar-Overlay. Alpha 0,76–0,84, Blur 16–24 px, opake Fallbacks bei `prefers-reduced-transparency` / fehlendem `backdrop-filter`. |
| Form (D-014) | Radien 9 / 12 / 20 / 24 / 30 px (Control-sm / Control / Card / Panel / Sheet); echte Squircles via `corner-shape: squircle` mit Boost 1,35, Fallback `border-radius`. Keine Pills außer Statusindikatoren. |
| Typografie (D-016) | System-Stack (Font-Gate offen); Display 700 · clamp(34–46 px) · Tracking −0,028 em; Section 650/24; Panel 650/18; UI 500/14; Meta 13; Caption 12; Mono 13/1,6. |
| Motion (D-017) | `instant 80 · micro 150 · swift 220 · standard 300 · expressive 440 ms`, `stagger 28 ms` (Deckel 12 Elemente), Spring `cubic-bezier(.3,1.35,.5,1)`, Soft-Spring, Settle 1,018. Alle Dauern/Shifts werden unter `prefers-reduced-motion` auf 0 gesetzt. |
| Layout | Rail 68, Sidebar 260, Inspector 400, Context Rail 300, Toolbar 60, Dock 68, Content-Max 1320. Breakpoints 600/1024 bleiben Blueprint-Kandidaten. |

## 5. Implementierung je Bereich

| Bereich | Umsetzung |
| --- | --- |
| **A Workspace & Ambient** | Hero mit Soft-Editorial-Titel, Space-Dot mit Halo, Beschreibung und **Fakten-Chips** (Anzahl je Typ, Favoriten, letzte Änderung; auf Phone eine wischbare Zeile). Collapsing Ambient per Scroll mit **Hysterese** (kollabiert > 128 px, expandiert < 44 px, rAF-gedrosselt) statt einfacher Schwelle; Sticky-Toolbar bleibt gemountet, zeigt im kollabierten Zustand Space-Dot, Titel, Anzahl und Capture-Button, frosted mit Lichtsaum. Space-Wechsel setzt die Scrollposition auf den Anfang. |
| **B Sidebar** | Rail/Pinned/Dynamic. Overlay-Expansion mit Intent-Delay (110 ms auf, 160 ms zu), frosted Material und Schatten; Labels und Zähler werden **gestaffelt** (`--i` je Eintrag) eingeblendet, Icons bleiben in einer 36-px-Spalte verankert. Space-Swatches als Gradient-Squircles, aktiver Eintrag mit Space-farbigem Balken. Neues Brand-Mark (Inline-SVG). Grid-Track `minmax(0,1fr)` + `overflow: clip` verhindern horizontales Scrollen der Rail (Fehler in der Foundation entdeckt und behoben). |
| **C Smart Capture** | Drei Zustände: *rest* (frosted, einzeilig, ⌘V-Hinweis, Anhang/Mikro), *focus* (opakes Editor-Material, Accent-Ring, Lead-Icon dreht sich, Eingabe wächst, Aktionsreihe mit Demo-Hinweis und „Hinzufügen“), *drag* (gestrichelter Accent-Rahmen, schraffierte Dropzone, Settle-Scale). Dropzone und Aktionsreihe bleiben gemountet und expandieren über `grid-template-rows` — kein Remount, kein Caret-Sprung (SM-10). |
| **D Smart Grid** | Karten mit Hover-Lift/Scale, Reveal-Stagger beim Einsortieren (auch bei Dichte-/Ansichtswechsel, M-12). Vorschauen: Text als Papierblatt mit Fade; Markdown mit extrahierter Überschrift und Farbbalken; Code mit Editor-Chrome, Sprach-Label und Zeilennummern; Bild mit Maß-Chip; Datei als Dokument mit Eselsohr; Audio mit Wellenform und Play-Glyph. Liste: gleiche Kachel, Glyph-Vorschau, Meta rechts, Aktionen immer sichtbar. Aktionen: Kopieren/Download + **„…“-Menü aus dem gemeinsamen Aktionsregister** (D-006). „Im Inspector geöffnet“-Marker unten rechts (nicht nur Farbe). Touch: Aktionen in der Meta-Zeile statt über der Vorschau. |
| **E Inspector & Composer** | Inspector gleitet von rechts, Sektionen reveal-gestaffelt; Kind-Chip mit Typ-Tönung, Primäraktion als Primary-Button, Inhaltskarte (Code dunkel), Fakten/Tags. Composer als Szenenwechsel (Scale/Fade), Pane-Labels „Markdown/Vorschau“, Mono-Editor mit Accent-Fokuskante, typografische Vorschau; Status-Pill wechselt bei Änderung in Warning-Tönung („Geändert – wird nicht gespeichert“). Context Rail mit Material-Slots und Timeline-Platzhaltern; auf Tablet/Phone als Sheet über dem Editor statt dritter Spalte. |
| **F Recorder** | Frosted Floating Bar; Status-Indikator pulsiert nur im Zustand *recording*; Panel bleibt gemountet und morpht über `grid-template-rows` (Breite 480 → 560 px), Inhalte gestaffelt; Zustandsvorschau als Chips, Timeline-Platzhalter. Entrance skaliert aus der Ankerecke, damit die Unterkante nie ins Dock ragt. Phone: Timer/Badge ausgeblendet. |
| **G Suche, Settings, Overlays** | Palette expandiert von oben (frosted Rahmen, opake Ergebnisliste), Icon-Kacheln je Typ, Enter-Hinweis am aktiven Treffer, Kbd-Footer. Settings Studio mit Tab-Icons, gestaffelten Zeilen, „Noch nicht verfügbar“ als Lock-Karten. Popover/Dialog/Notice mit gemeinsamer Pop-/Sheet-Choreografie, Backdrop-Blur 10 px. Living Empty State (D-026): drei schwebende Blätter mit Glow (Motiv-Studie), drei Schnellstarts (Notiz, Datei, Session) als Shortcuts in bestehende Flows; *unavailable* mit Lock-Kachel. |
| **H Mobile & Tablet** | Dock frosted mit Primary-Capture-Knopf, Safe-Area-Padding; Spaces-Drawer mit Brand-Header; Inspector/Palette/Settings als Vollansicht mit Safe-Top; Capture kompakt; Liste mit umbrechender Meta-Zeile; Fakten-Chips wischbar. Tablet: Rail kompakt, Inspector als 440-px-Overlay, Rail des Composers als Sheet. |

Nicht angefasst: `app/state.ts`, `app/preferences.ts`, `domain/*`, `fixtures/*`, `AppShell.tsx`, `Dialog.tsx`, `SegmentedControl.tsx`, `MarkdownPreview.tsx`, Aktionsregister. Keine zweite State-, Preference- oder Capture-Logik.

## 6. Motion-Momente (Blueprint 03 §4.3)

| Moment | Umsetzung |
| --- | --- |
| M-01 Sidebar | Overlay-Breite mit Intent-Delay, Labels/Zähler mit `--i`-Stagger (70 ms + 22 ms·i), kein Board-Reflow (P10: Workspace-Left 68 → 68). |
| M-02 Ambient Collapse | Scroll-Hysterese, Toolbar-Kontext gleitet ein, Capture-Button poppt; kein Remount von Suche/Capture/Trust. |
| M-03 Capture Expand | Materialwechsel frosted → opak, Ring, Lead-Rotation, Zeilen-Expansion über Grid-Rows. |
| M-05 Card → Inspector | Karte settle (1,018), Marker, Inspector-Slide mit Sektions-Stagger (45 ms·i). Shared-Element bewusst nicht gebaut (nur nach Machbarkeit). |
| M-06 Inspector → Composer | Szenenwechsel, Rail gleitet lokal ein. |
| M-07 Recorder Mini ↔ Panel | Breiten- und Höhen-Morph, Inhalte gestaffelt, Stream-unabhängig (es gibt keinen). |
| M-11 Palette/Popover | Expansion aus Trigger/oben, Backdrop-Fade. |
| M-12 Atmosphere/Density | Tint-Transition 440 ms, Reveal-Stagger beim Dichte-/Ansichtswechsel (gedeckelt). |
| M-04/08/09/10 | weiterhin **nicht anwendbar** (kein Commit, keine Auswahl, kein Reorder, kein echter erster Inhalt). |

Reduced Motion (P13 + Screenshot 60): Dauern 0, keine Orb-Drift, keine Float-/Pulse-Animationen, alle Zustände statisch lesbar.

## 7. Tests (Abschlusslauf)

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` (check:syntax · typecheck strict + legacy · test:unit) | 16/16 Dateien OK · tsc OK · **81/81 PASS** (legacy-contract 5 · preview-isolation 55 · preview-domain 16 · preview-render 5) |
| `npm run build` | OK; Legacy-Output byte-identisch zu `ed551d9` |
| `npm run test:smoke` (dist) | Foundation **6/6** · Preview **13/13** · R02-Subset **8/8** · `E2E OK` |
| `node scripts/e2e.mjs smoke --target=dev` | Foundation 6/6 · Preview 13/13 · R02 8/8 · `E2E OK` |
| `npm run test:pages-preview` | statischer Check OK (4 Dateien) · Preview-Suite gegen `dist-preview` an `/` **13/13** · `PAGES PREVIEW OK` |
| Isolation | Laufzeit-Zähler in allen Proben 0 (Storage, Cookie, Cache, fetch/XHR/Beacon, Clipboard, getUserMedia, Permissions, DataTransfer, window.open); keine fremden Requests; statischer Guard über alle `src/next`-Dateien inkl. CSS grün. |

Während des Runs behoben: P12 schlug einmal fehl, weil die Recorder-Entrance (translateY 16 px) kurzzeitig unter die Dock-Oberkante reichte → Entrance jetzt als Scale aus der Ankerecke.

## 8. Visuelle QA

41 Screenshot-Szenen (Playwright, Chromium, DPR 2) über 1440×900, 1280×800, 768×1024 (Touch) und 390×844 (Touch), Light und Dark, Sidebar-Modi, Grid/Liste × Dichten, Capture rest/focus/drag, Sticky-Toolbar, Inspector, Composer split/preview, Recorder mini/panel, Palette, Settings, Theme-Popover, Empty/Unavailable, Drawer, Dock, Reduced Motion. Korrekturen innerhalb des Runs:

1. Aktiver Schnellzugriff-Eintrag in der Rail ohne Icon (horizontales Scrollen durch Fokus) → Grid-Track und `overflow: clip`.
2. Inspector-Marker verdeckte Markdown-Überschrift → unten rechts.
3. Touch: Aktionen über der Vorschau → in die Meta-Zeile.
4. Tablet-Composer mit drei engen Spalten → Rail als Sheet.
5. Phone: Fakten-Chips in drei Zeilen → wischbare Zeile; Recorder-Bar zu dicht → Timer/Badge ausgeblendet; Listen-Meta lief unter die Aktionen → Umbruch + Padding.
6. Scroll-Collapse war bei 6 Karten auf 1440×900 nicht auslösbar (kein Overflow) → Szene auf „Alle Inhalte“ verifiziert.

Ausgewählte Screenshots (1×) in `docs/runs/C-design-wow/screenshots/`:

| Datei | Szene |
| --- | --- |
| `01-desktop-light-board.jpg` | Ambient-Header, Fakten, Capture rest, Smart Grid Standard |
| `02-desktop-light-sidebar-hover.jpg` | Dynamische Sidebar als Overlay (M-01) |
| `04-desktop-light-capture-focus.jpg` / `05-…-drag.jpg` | Capture focus / drag (M-03) |
| `06-desktop-light-scrolled-toolbar.jpg` | Collapsing Ambient, Sticky-Toolbar (M-02) |
| `07-desktop-light-list-comfort.jpg` | Liste, Dichte Komfort |
| `09-desktop-light-inspector.jpg` | Karte → Inspector (M-05) |
| `11-desktop-light-composer-split.jpg` | Composer Split + Context Rail (M-06) |
| `14-desktop-light-recorder-panel-recording.jpg` | Recorder Panel, Zustand Aufnahme (M-07) |
| `15-desktop-light-search.jpg` / `17-…-settings.jpg` | Palette / Settings Studio |
| `19-desktop-light-empty-space.jpg` | Living Empty State mit Schnellstarts |
| `21-…` `22-…` `23-…` `24-desktop-dark-*.jpg` | Dark Mode: Board, Inspector, Composer, Palette + Recorder |
| `40-tablet-light-board.jpg` / `42-tablet-dark-composer.jpg` | 768×1024 |
| `50-…` `52-…` `54-…` `56-…` `58-phone-*.jpg` | 390×844: Board, Inspector, Capture + Recorder, Liste, Empty |

## 9. Verbleibende Einschränkungen

- Nur Chromium (Playwright) geprüft; Safari/iOS, Firefox, echte Geräte, Screenreader und Kontrastmessung im gerenderten Composite stehen aus (T-03). `corner-shape: squircle` greift nur in Browsern mit Unterstützung; sonst `border-radius`.
- Schrift bleibt System-Stack (Font-Lizenz-Gate D-016). Hex-, Blur-, Radius- und Motion-Werte sind kalibrierte Kandidaten.
- Shared-Element-Morph Karte → Inspector und FLIP-Reflow beim Dichtewechsel nicht gebaut (Blueprint 03: nur nach Machbarkeit); stattdessen Settle + Reveal-Stagger.
- Weiterhin nicht gebaut (unverändert aus Run B): Ordner/Breadcrumbs (H-01), Mehrfachauswahl/Bulk-Bar, Sortierung/Drag & Drop, Space-Erstellung, Handoff Sheet, Sync Center, Recovery, Inspector-Resize/Fokusmodus, Tooltips (weiterhin `title`), Virtualisierung. Das „…“-Menü nutzt das vorhandene Register; ein Kontextmenü per Rechtsklick fehlt.
- `Cmd/Ctrl+K` bleibt Vorschlag (H-02); Empty-State-Motiv ist eine Studie (D-026, Motiv offen).
- Scroll-Verhalten beim Space-Wechsel (Reset auf Anfang) ist eine neutrale Arbeitsannahme, keine Entscheidung zu D-020 „Restore-Scrollposition“.
- Cloudflare: Deployment-Erfolg wurde nicht beobachtet (kein Zugriff, keine Konfiguration geändert); nur der lokale Build und seine Tests sind verifiziert.

## 10. Lokal starten

```bash
npm ci
npm run dev                 # http://127.0.0.1:5173/preview.html
npm run build:pages-preview # dist-preview/ (Cloudflare-Variante, React unter /)
npx vite preview --mode pages-preview   # http://127.0.0.1:4173/
```

**CUTLER C — STOP am Human Gate.**
