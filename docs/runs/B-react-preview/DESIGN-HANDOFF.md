# Run B → Run C · Design-Handoff für den Design-WOW-Run (Fable)

**Stand:** 22.10.2026 · Branch `feature/copyboard-react-preview-b` · Grundlage: Masterplan v0.42, Blueprints 02–04, ADR-007.
**Verbindlich:** D-001 bis D-033. Offene Human Gates (H-01…H-06, H-08) werden im Design-Run **nicht** entschieden, sondern als `PROPOSAL/HUMAN GATE` markiert.

## 1. Starten

```bash
npm ci
npm run dev        # http://127.0.0.1:5173/preview.html  (Legacy-App unverändert unter /)
npm run test:unit  # schnell: Isolation, Domain, Render
npm run test:smoke # Build + Browser-Suiten (Legacy-Smoke, Preview P1–P13, R02-Subset)
```

## 2. Wo was liegt

| Bereich | Datei(en) | Hinweis für das Design |
| --- | --- | --- |
| **Tokens** | `src/next/styles/tokens.css` | Alle Farben, Radien, Typo, Motion, Material, Dichte. Werte sind Blueprint-04-**Kandidaten** → hier kalibrieren, nicht in Komponenten |
| Basis/Fokus/A11y | `styles/base.css` | Fokusring, Skip-Link, `cb-visually-hidden` |
| Primitive | `styles/components.css`, `src/next/components/*` | Button, IconButton, SegmentedControl (Radiogroup), Popover, Dialog (native `<dialog>`), DemoBadge, Icon (Inline-SVG, Lucide-artig) |
| Shell | `styles/shell.css`, `features/shell/*` | Sidebar-Modi, Toolbar, Ambient, Hero, Dock, Drawer |
| Board | `styles/board.css`, `features/capture`, `features/grid` | Smart Capture, View-Controls, Grid/Liste, Kachelvorschauen, Empty States |
| Schichten | `styles/panels.css`, `features/inspector`, `composer`, `recorder`, `search`, `settings` | Inspector, Composer + Context Rail, Recorder, Palette, Settings Studio |
| Daten | `src/next/fixtures/*`, `domain/*` | Synthetisch, read-only (`ReadOnlyLibrary`). Neue Demo-Inhalte nur hier ergänzen |
| UI-State | `app/state.ts`, `app/preferences.ts` | Ein Reducer, **eine** Preference-Quelle (D-033) |

## 3. Zustände als Styling-Hooks (keine Logik nötig)

| Selektor | Werte | Entscheidung |
| --- | --- | --- |
| `.cb-app[data-theme]` | `light` / `dark` (System wird aufgelöst) | D-031 |
| `.cb-app[data-sidebar]` | `compact` / `expanded` / `dynamic` | D-002 (dynamisch = Overlay ohne Layoutsprung) |
| `.cb-app[data-detail]` | `none` / `inspector` / `composer` | D-004 / D-007 |
| `.cb-app[data-recorder]` | gesetzt, wenn Recorder offen | D-008 |
| `.cb-toolbar[data-collapsed]`, `.cb-ambient[data-collapsed]` | Collapsing Ambient | D-019 / D-020 (M-02) |
| `.cb-ambient` + `--cb-ambient-tint` | Space-Farbe tönt **ein** Lichtfeld | D-013 / D-031 |
| `.cb-capture[data-state]` | `rest` / `focus` / `drag` | D-003 (M-03) |
| `.cb-grid[data-view][data-density]` | `grid`/`list` × `comfort`/`standard`/`compact` | D-005 / D-032 |
| `.cb-tile[data-kind][data-selected]` | `text`, `markdown`, `code`, `image`, `file`, `audio` | D-005 / D-006 |
| `.cb-composer[data-mode][data-rail]` | `source` / `preview` / `split` | D-007 / D-010 |
| `.cb-recorder[data-status][data-panel]` | `idle` … `error` (Blueprint 04 §5.3) | D-008 |
| `.cb-empty[data-variant]` | `space-empty` / `collection-empty` / `unavailable` | D-026, SM-09 |

Squircles: `@supports (corner-shape: squircle)` in `tokens.css` schaltet echte Silhouetten für Karten, Panels, Sheets, Controls frei; `--cb-squircle-boost` gleicht den optisch kleineren Radius aus. Fallback bleibt `border-radius` (D-014).

## 4. Motion-Momente: vorhandene Ankerpunkte

| Moment | Heute vorhanden | Für Run C |
| --- | --- | --- |
| M-01 Sidebar | CSS-Breitenübergang + Intent-Delay, Labels per `--cb-labels` | räumliches Morphing, gestaffelte Labels |
| M-02 Ambient Collapse | IntersectionObserver → `data-collapsed`, Toolbar bleibt gemountet | Höhe/Schwelle/Hysterese kalibrieren |
| M-03 Capture Expand | `data-state` + Dropzone | Expand-Choreografie |
| M-05 Card → Inspector | Inspector-Slide-in, Fokus auf Titel, Rückfokus auf Karte | Shared-Element nur nach Machbarkeit (Blueprint 03) |
| M-06 Inspector → Composer | Composer ersetzt Inspector, eigene Rail | Bühnenwechsel |
| M-07 Recorder Mini ↔ Panel | `data-panel` | Morph |
| M-11 Palette/Popover | `cb-pop-in`-Keyframe, native Dialog-Backdrop | Expansion aus dem Trigger |
| M-12 Atmosphere/Density | Token-Wechsel, Tint-Transition | Reflow-Choreografie (FLIP, gedeckelt) |
| M-04, M-08, M-09, M-10 | **nicht anwendbar**: kein Speichern, keine Auswahl, kein Reorder | erst mit echtem Commit-Adapter; nie Erfolg vor Durable Commit inszenieren |

Reduced Motion: alle Dauern laufen über `--cb-dur-*` und werden unter `prefers-reduced-motion` auf 0 gesetzt; Ambient-Drift ist dann aus (Test P13). Neue Animationen bitte ebenfalls über diese Tokens bauen.

## 5. Leitplanken, die der Design-Run nicht brechen darf

1. **Datenisolation:** kein Storage, kein Netzwerk, keine Clipboard-/Mikrofon-/Datei-APIs, kein `innerHTML`, keine externen Fonts/CDNs. `tests/unit/preview-isolation.test.ts` und `tests/e2e/preview.mjs` prüfen das; Webfonts nur lokal gebündelt nach Lizenz-Gate (D-016).
2. **Ehrliche Zustände:** Demo-Aktionen sagen „nicht verfügbar“, nie „gespeichert/kopiert/synchronisiert“ (D-027/D-028, Blueprint 04 §5.2). Der Recorder fordert keine Berechtigung an.
3. **Semantik & Fokus:** Rollen/ARIA (radiogroup, combobox/listbox, tablist, `aria-current`) und Fokusführung beibehalten; Fokusring auf Frosted/Bokeh sichtbar halten.
4. **Test-Selektoren:** Die Browser-Suite nutzt `cb-*`-Klassen, `data-*`-Attribute und `aria-label`s. Bei Umbenennungen `tests/e2e/preview.mjs` mitziehen.
5. **Keine zweite Capture-Logik**, keine zweite Preference-Quelle, kein zweites rechtes Panel neben dem Composer.

## 6. Bewusst noch nicht gebaut (Struktur vorbereitet oder dokumentiert)

- Ordner/Breadcrumbs (D-024, H-01 offen), Mehrfachauswahl + Bulk-Bar (D-022), Sortierung/Drag & Drop (D-023), Studio Space Sheet (D-025, heute Demo-Hinweis), Smart Handoff Sheet (D-011), Sync Center (D-028, heute nur ehrlicher Vorschau-Indikator), Recovery Studio (D-029), Kontext-/Drei-Punkte-Menü (D-006; das Aktionsregister `features/items/item-actions.ts` ist bereits die gemeinsame Quelle), Inspector-Resize und Fokus-/Vollbildmodus (D-004), echte Tooltips (heute `title`), Virtualisierung großer Boards.
- Shortcut `Cmd/Ctrl+K` ist nur **vorgeschlagen** (H-02) und in editierbaren Feldern deaktiviert.
- Breakpoints 600/1024 px sind Blueprint-Kandidaten, keine Entscheidung (IA-02 §4.4).
- Finale Schrift, Farb-/Blur-Tokens, Dark-Mode-Feinabstimmung, Bokeh-Parameter: Aufgabe von Run C.
