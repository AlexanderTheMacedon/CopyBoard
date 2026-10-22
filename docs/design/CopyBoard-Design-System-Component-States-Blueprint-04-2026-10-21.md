# CopyBoard — Design System & Component States Blueprint 04

**Stand:** 21. Oktober 2026  
**Artefakt:** DS-04 · Consolidation Phase 04 · Konzeptrevision v0.37  
**Quellen:** `CopyBoard-Design-Masterplan-v0.36-2026-10-21.md`; `CopyBoard-Screen-Inventory-IA-Blueprint-02-2026-10-21.md`; `CopyBoard-Interaction-Motion-Blueprint-03-2026-10-21.md`; `CopyBoard-Decision-Integrity-Audit-01-2026-10-21.md`.  
**Status:** visuelle Spezifikation als **Implementation Candidate**, kein freigegebenes Pixeldesign, keine Browser-/Produkt-QA, keine Code-, Repository- oder Production-Änderung.

> **Integritätshinweis:** Die ausdrücklich gewählten D-001–D-033 sind verbindlich; ein Beispiel-Hexwert oder eine unten stehende Zahl ist es nicht. `[FIX D-…]` bedeutet explizit beschlossen, `[DERIVED]` eine folgerichtige Strukturkonsequenz, `[PROPOSAL]` ein kalibrierbarer Vorschlag, `[HUMAN GATE]` echte Nutzerfreigabe, `[TECH GATE]` technischer Nachweis. Kein `[PROPOSAL]` darf durch Übernahme in ein Agentenbriefing automatisch zur genehmigten Entscheidung werden.

## 0. Executive Specification

**Produktcharakter:** Ein warmer, extrem hochwertiger, direkt bedienbarer Capture-/Clipboard-/Asset-Workspace mit Mist/Lavender, weichen Squircles, zielgerichtet frosted Floating Layers, klaren Arbeitsflächen und erkennbarem, aber kontrolliertem 80/20-Motion-Charakter. **Keine** schwere SaaS-Dashboard-Optik, kein allgegenwärtiges Glas, kein permanentes visuelles Feuerwerk.

**Visuelle Invarianten:**

1. `[FIX D-012/013/019/031]` Lavender-Bokeh fließt **ohne gerahmte Hero-Kante** in den Canvas; pro Space dezente Licht-Tönung, Marke bleibt violet/lavender.
2. `[FIX D-015]` Soft Elevation / gezieltes Frosted ~70/30 als **Material-Hierarchie**; opake Inhalte und Editorflächen; transparent geblurrte schwebende Elemente.
3. `[FIX D-014]` Squircle-/abgerundete Rechteck-Hierarchie; keine pauschalen Capsules/Pills.
4. `[FIX D-016]` Soft Editorial für Headlines, hochlesbare UI-Typografie, Monospace für Code.
5. `[FIX D-017]` Expressive Motion ~80 % / räumlich präzise Soft Choreography ~20 % als Charakter, nicht als numerische Laufzeitquote.
6. `[FIX D-002/018/020]` Sidebar-Rail und Collapsing Ambient dürfen keine horizontale Canvas-Jitter-/Remount-Effekte verursachen.
7. `[FIX D-027/028/029]` visuelle Erfolgssignale unterliegen **echten** lokalen bzw. Cloud-Zuständen; Restore schützt bestehende Revisionen.
8. `[FIX D-030/032/033]` Adaptive Mobile Dock, Dichte und Quick/Studio Preferences sind Zustandsvarianten desselben UI-Systems, keine parallelen unabhängigen Implementierungen.
9. `[DERIVED]` Status, aktive Auswahl und Fokus sind nie allein über Farbe, Glühen oder Bewegung erkennbar.
10. `[DERIVED]` Gestaltungsqualität schließt Screenreader, Touch, große Schrift, Offline, Reduced Motion und High Contrast ein; dekorative Überlagerungen dürfen die Funktion nicht verdecken.

## 1. Design-Tokens: Naming, Ownership & Status

### 1.1 Token-Schichten

| Ebene | Namensraum, Beispiele | Wer befüllt sie? | Änderungsregel |
|---|---|---|---|
| Primitives | `color.iris.500`, `space.4`, `radius.3`, `font.size.3` | Design System | niemals direkt in fachlicher Komponente referenzieren, außer Visualisierungsexperiment |
| Semantik | `color.text.primary`, `color.surface.canvas`, `color.status.error` | Theme-Resolver | Light/Dark + Kontrast-Regeln; unabhängiger Status von Space-Farbe |
| Material | `material.surface.raised`, `material.frosted.popover` | Material-System | Blur-Fallback und semantischer Kontrast obligatorisch |
| Komponenten | `component.card.padding.standard`, `component.capture.radius`, `component.dock.min-height` | Component Layer | über Dichte, Viewport und Interaktionskontext ableiten |
| Motion | `motion.duration.feedback`, `motion.spring.card`, `motion.reduced` | Motion System | visuelle Bewegung von Daten-/Focus-Lifecycle trennen |
| Plattform | `layout.safe-area.bottom`, `layout.type.scale`, `layout.ime-inset` | Responsive/Device Adapter | Browser-/Font-/Input-spezifisch; keine Geräteerkennung nur per User-Agent |

**Ein Wert — eine Quelle:** Light/Dark/Space-Tint wirken über Theme-Tokens. Quick Preferences und Settings Studio ändern denselben Preference-State. Density ändert Layout-Varianten, nicht Domain-Item-Order. Daten-ACK und UI-Animation bleiben getrennte Owner.

**Notation:** Pixelwerte sind im Folgenden **unverbindliche Referenzwerte** für spätere visuelle Kalibrierung. Tokens sind vorgeschlagene Schlüssel, keine bereits im Projekt existierenden CSS Custom Properties.

### 1.2 Helle Palette — Kandidaten `[PROPOSAL]`

| Token | Hexwert | Einsatz | Hinweis |
|---|---|---|---|
| `color.surface.canvas` | `#F8F7FB` | neutraler unterer Workspace | überwiegend opak |
| `color.surface.base` | `#FFFFFF` | Grid Cards, Inspector, Editoren | niedrige visuelle Unruhe |
| `color.surface.subtle` | `#F4F1F8` | optionale Tonfläche / Gruppierung | nicht als Textkontrast allein verwenden |
| `color.surface.hover` | `#F1EDF8` | Hover-/Focus-in-neighbor | nicht statt Focus Ring |
| `color.surface.selected` | `#EBE4FC` | ausgewählte Karte/Row | immer mit Icon/Outline ergänzen |
| `color.text.primary` | `#292536` | primäre Texte | hoher Kontrast |
| `color.text.secondary` | `#625C70` | Hilfstexte/Metadaten | geprüft gegen White/Canvas |
| `color.text.tertiary` | `#716B7F` | ergänzende lesbare Beschreibung | kleine Texte nur nach Prüfung |
| `color.border.subtle` | `#E4DEEC` | feine Hairlines | Focus braucht stärkeren separaten Token |
| `color.accent.brand` | `#7064C8` | Hauptaktionen, Fokusakzent | Zielkontrast Weiß ≈ 4,83:1 |
| `color.accent.hover` | `#5B4EB8` | aktive Brand-Interaktion | text-/iconcontrast prüfen |
| `color.ambient.lilac` | `#C4B5FD` | Hintergrundlicht, **nicht** Text | FIX D-013 Farbstudie |
| `color.ambient.orchid` | `#DBB6F5` | Hintergrundlicht, nicht als Statusfarbe | FIX D-013 Farbstudie |
| `color.ambient.periwinkle` | `#AEB8FA` | Hintergrundlicht, nicht als Statusfarbe | FIX D-013 Farbstudie |
| `color.status.success` | `#216E52` | Text/Icon Success mit Label | Erfolg nur bei bestätigtem Scope |
| `color.status.warning` | `#875A18` | Pending/Degraded | Textlabel unabhängig vom Ton |
| `color.status.error` | `#A8334D` | Fehlerzustand | nicht als dekorativen Ambient-Ton verwenden |
| `color.status.info` | `#3E5FAA` | nichtkritischer Hinweis | gegen jede Ziel-Surface separat prüfen |

### 1.3 Dark Palette — unabhängig abgestimmt `[PROPOSAL]`

| Token | Hexwert | Einsatz | Hinweis |
|---|---|---|---|
| `color.surface.canvas` | `#161520` | dunkler Canvas | kein simples invertiertes Light |
| `color.surface.base` | `#23212E` | Karten/Editor | primäre Lesefläche |
| `color.surface.subtle` | `#2D2A3A` | differenzierte Sekundärflächen | dunkles Studio, keine schwarze Leere |
| `color.surface.hover` | `#373247` | Hover | mit Fokuszustand trennen |
| `color.surface.selected` | `#403558` | Auswahl | Outline/Icon zusätzlich |
| `color.text.primary` | `#F5F2FA` | primärer Text | hoher Kontrast |
| `color.text.secondary` | `#C8C1D3` | Sekundärtext | geprüfter Kandidat |
| `color.text.tertiary` | `#AAA1BB` | ergänzende Beschriftung | geprüfter Kandidat |
| `color.border.subtle` | `#484257` | Kontur | für Focus nicht ausreichend |
| `color.accent.brand` | `#B9A8FF` | Highlights/Fokus/Links | für helle Schrift auf Brand ungeeignet |
| `color.accent.on-brand` | `#211B35` | Text auf hellem Iris-Accent | deutlicher Kontrast |
| `color.status.success` | `#83DBB5` | bestätigter Zustand | mit Icon und Text |
| `color.status.warning` | `#F8CB79` | Pending/Conflict-Hinweis | Statusarten textlich differenzieren |
| `color.status.error` | `#FF9EB0` | Fehler | nicht mit Space-Accent koppeln |
| `color.status.info` | `#A0BFFF` | Info | eigene Surface-Prüfung |

**Kontrast-Sanity-Check am 21.10.2026 (rein rechnerisch):** Light `primary`/White ca. 14,87:1; `secondary`/White 6,39:1; `secondary`/Canvas 6,00:1; `accent.brand`/White 4,83:1; Dark `primary`/Dark Base 14,28:1; `secondary`/Dark Base 9,05:1; `accent.brand`/Dark Base 7,61:1; `on-brand`/Brand 7,94:1. Geprüft sind **diese Einzelpaare**, nicht die ganze App, alle States oder Blur-/Bildhintergründe. Farbvarianten/Opacity/Text antialiasing können Resultate ändern. Später WCAG 2.2 AA mit Text, Icons, Focus und nichttextuellen UI-Grenzen gegen gerenderte Komponenten prüfen (`[TECH GATE]`).

### 1.4 Semantic Colors > Space-Tint `[FIX D-031]`

`ambient.tint` erbt ausschließlich eine gedämpfte Space-Farbkomponente, **keine** Error-/Success-/Warning-Token. Space-Farbe gehört in Bokeh-Orbs, dezente aktive Space-Markierung und kleine ornamentale Flächen. Es darf keinen semantisch andersfarbigen „Success“-Button erzeugen. Änderungen dürfen nicht plötzlich Icons, Selektionstext oder den Inhalt im Editor umfärben.

**Space-Bildwelt als Beispiele `[PROPOSAL]`:** Lavender `#BDA7F4`, Sky `#A7C9EB`, Sage `#B8D9BD`; Dark-Tints mit gesonderter Dämpfung/Blend-Stärke. Ein Theme arbeitet erst `Light/Dark/System`, dann Space-Ambient. `System` folgt der Betriebssystempräferenz; manuelle Auswahl darf nicht ungefragt überschrieben werden. Beim Space-Wechsel bleibt Contrast invariant.

### 1.5 Ambient Canvas & Bokeh `[FIX D-013/019/020/031]` + `[PROPOSAL]`

- Drei oder vier große, überlagernde **diffuse Lichtfelder** (violett/lilac/orchid/periwinkle plus gedämpfter Space-Akzent), **nicht** ein sichtbarer harter linearer Banner. Die Flächen lösen sich nach unten in `surface.canvas` auf; keine Hero-Karte mit Kante.
- Für einen Prototyp: diffuse Orbs mit mehrstufiger Unschärfe im Bereich von etwa `36–88 px`; geringe Opazität in Dark, hellere aber ebenfalls gedämpfte Light-Komposition. Werte aus Performance-, Kontrast- und Zoom-Tests ableiten; keine per-frame teuer gerechneten großen Backdrop-Filter als Pflicht.
- Bokeh liegt **hinter** Inhalt/Focus-Indikatoren. Ambient-Verlauf im Header per Compositing/Opacity transformieren; auf Scroll nicht das DOM der Capture Bar remounten.
- Collapsed sticky Zustand erhält maximal einen dünnen Lichtrest oder eine gedeckte Materialfläche; kein plötzlich abgeschnittenes Farbfeld. Sticky-Schwelle aus IA/Interaction noch zu kalibrieren.
- `prefers-reduced-motion`: konstante Lichtlage ohne Drift/Parallax; bei Low-Power oder ohne Filterunterstützung statische Gradient-/Raster-Fallbacks; keine informationstragenden Bewegungen.

## 2. Form, Abstände, Elevation & Material

### 2.1 Spacing & Maße `[PROPOSAL]`

| Schlüssel | Vorschlag | Einsatzbeispiel |
|---|---|---|
| `space.1` | `4 px` | Icon-Baseline, dichte Gruppen |
| `space.2` | `8 px` | Chip-internal, kompakte Abstände |
| `space.3` | `12 px` | Input-Inset, Mini-Card |
| `space.4` | `16 px` | normaler Panel-Inset |
| `space.5` | `20 px` | Detail-/Popover-Spacing |
| `space.6` | `24 px` | Kartengruppe, größere Panel-Innenkante |
| `space.8` | `32 px` | Sektionen, Desktop-Bereiche |
| `space.10` | `40 px` | Schwerpunktflächen |
| `space.12` | `48 px` | großzügige Empty-Stage |

**Keine Fixierung auf 8-px-only Grid**: optische Feinjustierung ist erlaubt, aber Abstände folgen der Skala statt zufälligen Einzelwerten. Relative Layoutwerte dürfen mit Textzoom wachsen. `safe-area-inset-*`, Sidebar/Inspector-Breite, Tastaturhöhe und Scrollbars werden dynamisch berücksichtigt.

### 2.2 Radius & Squircle `[FIX D-014]` plus `[PROPOSAL]`

| Token | Kandidat | Komponenten |
|---|---|---|
| `radius.control-sm` | 8 px | Icon Button, kleine Row-Aktion |
| `radius.control` | 12 px | Inputs, Segmented, Standardbutton |
| `radius.card` | 18 px | Smart-Grid-Karten |
| `radius.panel` | 22 px | Inspector-Fläche, Popover und Floating Bar |
| `radius.sheet` | 28 px | Dialog, Handoff Sheet, Studio Space Sheet |
| `radius.ambient` | keine harte Kante | Header-Background, Bokeh |

**Squircle-Implementierungsregel:** Wenn echte Superellipse technisch performant/semantisch korrekt verfügbar ist, in wenigen markanten Oberflächen nutzen; ansonsten optisch präzise `border-radius`-Fallbacks. Keine nichtstandardmäßigen Masken bei fokussierbaren Controls, falls Hit-Test/Focus-Clipping leidet. Capsules nur dort, wo ein Status-Indikator oder ein kurzer Inline-Chip es wirklich rechtfertigt. Mobil bleiben Hit-Targets unabhängig vom sichtbaren Radius groß genug.

### 2.3 Material- und Elevation-Tiers `[FIX D-015]` plus `[PROPOSAL]`

| Material | Alpha-Kandidat | Blur-Kandidat | Shadow-/Border-Verhalten | Referenz |
|---|---|---|---|---|
| `opaque.canvas` | 1,00 | 0 | keine Glas-Anmutung | Board-Hauptfläche |
| `opaque.card` | 0,98–1,00 | 0 | subtile Kontur, leichter Lift bei Hover | Smart Grid |
| `opaque.editor` | 1,00 | 0 | höhere Trennung zugunsten Textlesbarkeit | Hybrid Composer |
| `elevated.panel` | 0,94–1,00 | 0 | klarer Layer-Schatten/Outline | Inspector, Context Rail |
| `frosted.popover` | 0,78–0,88 | 16–28 px | sichtbarer Hintergrund, **opake innere Textflächen** | Search/Quick Prefs |
| `frosted.sheet` | 0,82–0,92 | 12–24 px | größere Squircle und Trennung | Space/Handoff |
| `frosted.floating` | 0,76–0,88 | 14–26 px | leichter Shadow, visuell stabil | Recorder, Bulk Bar |
| `frosted.sticky` | 0,90–0,97 | 8–18 px | Beschriftung niemals durch Bokeh schwächen | Collapsed Header / Dock |

**Achtung:** Diese Alpha-/Blur-Werte sind Kandidaten aus D-015, keine „70 % opacity / 30 % blur“-Formel. Material-70/30 bedeutet vorherrschende opake Arbeitsflächen plus wenige frosted Akzentebenen. Opaque-Fallback bei unsupported `backdrop-filter`, stärkere Opacity unter hohen Kontrastanforderungen oder hinter Bildern. Translucent-Layer braucht lesbares inneres Surface/Textpaar, keine direkte semitransparente Schrift auf unberechenbarem Bild.

### 2.4 Elevation als semantische Staffelung `[PROPOSAL]`

`elevation.0` eingebettet; `elevation.1` Hover-/Selected Card; `elevation.2` Inspector/Persistent Panel; `elevation.3` Popover/Recorder; `elevation.4` Sheet/Modal; `elevation.5` Palette/critical Notice. Keine festen CSS-`z-index`-Nummern jetzt: funktionale Layer L0–L6 aus IA-02 und Input-/Focus-Priorität aus Blueprint 03 bestimmen die tatsächliche Überlagerung. Kritischer Error darf nicht hinter Blur verschwinden.

## 3. Typography & Icons

### 3.1 Soft Editorial `[FIX D-016]`, optische Skala `[PROPOSAL]`

| Rolle | Größe / line-height | Gewicht | Einsatz |
|---|---|---|---|
| `display.workspace` | 36 / 42 px (Desktop), fluid kleiner mobil | 600–700 | Ambient Space-Titel |
| `heading.section` | 24 / 31 px | 600–650 | Workspace/Composer Überschriften |
| `heading.panel` | 18 / 25 px | 600 | Inspector, Sheets |
| `text.body` | 15 / 23 px | 400–500 | App-Fließtext, Karten |
| `text.ui` | 14 / 20 px | 450–550 | Button, Menü, Option |
| `text.meta` | 13 / 19 px | 400–500 | sekundäre Infos |
| `text.caption` | 12 / 17 px | 450 | seltene kurze Labels; auf Mobil-Zoom testen |
| `text.mono` | 13–15 / 1,55 | 400–500 | Code, Markdown-Quelle |

**Font-Stack `[PROPOSAL]`:** system-ui / `-apple-system` / Segoe UI / Arial als robustes UI-Fallback; alternativ erst nach Font-Lizenz-, Rendering- und Performance-Gate Inter. Kein Zwang zu einer neuen Display-Schrift. Editor-Schriftwahl als separate Preference nur falls technisch/basierend auf Nutzerbedarf gerechtfertigt. Dynamic Type, 200–400-%-Zoom und Browserfontskalierung: keine abgeschnittenen Beschriftungen, keine fixierten kleinen Control-Höhen.

### 3.2 Lucide-artige Icons `[FIX D-002/014]`, Feinheit `[PROPOSAL]`

24-px-Icon-Grundraster; bei 16/18/20 px kleine Varianten. Strichstärke fein und ruhig, z. B. 1,5 px in Standard-UI, 1,3 px an passenden dekorativen Stellen; kritische kleine Icons bei 1,5–1,75 px halten. Gleiche optische Innenränder; Icon selbst nicht als alleiniger semantischer Status. Icon Buttons erhalten immer `aria-label`, Tooltip und sichtbaren Tastaturfokus; reines `:hover` offenbart keine exklusiven Aktionen.

## 4. Density & Responsive Layout System

### 4.1 Drei gespeicherte Dichten `[FIX D-032]` mit Layout-Kandidaten `[PROPOSAL]`

| Parameter | Komfort | Standard (vorgeschl. Default) | Kompakt |
|---|---|---|---|
| Card-Minimum-Breite Desktop | 272 px | 220 px | 176 px |
| Card-Preview-Höhe | 160–208 px | 104–144 px | 64–100 px |
| Kartenabstand | 20–24 px | 12–16 px | 8–12 px |
| Karten-Inset | 16–20 px | 12–16 px | 10–12 px |
| Metadaten | breit sichtbar | relevante, scannbare | reduziert, erreichbar im Inspector |
| List Row Mindesthöhe | 64 px | 52 px | 44 px Desktop, Touch-Ziel min. 44 |

**Invariante:** Dichte darf weder Inhaltssortierung, Selection-Set, Fokus noch aktive Aufzeichnung ändern. Grid-/List-Umschaltung ist eine andere Preference als Dichte. Preview-Skalen bleiben typabhängig; kein chaotisches Masonry. Kleiner Viewport darf anstelle eines unbrauchbar verdichteten 4-Spalten-Grids die Spaltenzahl reduzieren. Virtuelles Grid: Spatial Handoff auf Offscreen-Items nicht „erfinden“.

### 4.2 Responsive Adaptation `[DERIVED]` + Candidate Breakpoints

| Viewport-Klasse | Richtbereich (nicht entschieden) | Primäre Shell | Detail und Capture |
|---|---|---|---|
| Small phone | < 600 CSS px | Top context + Adaptive Mobile Dock | Inspector/Composer als Screen/Sheet, Recorder reserviert Safe Area |
| Tablet | 600–1023 CSS px | kompakte Sidebar/Drawer je verfügbarem Raum | adaptive Pane-Breiten, Context Rail als Sheet wenn nötig |
| Desktop | ≥ 1024 CSS px | linke Rail + Ambient Header + Board | Inspector rechts, Composer fokussierbar, Rail nur Composer |
| Wide Desktop | ≥ 1440 CSS px | gleicher Informationsbaum, großzügiger Canvas | kein neues zusätzliches Navigationssystem |

Die Werte sind **Vorschläge**, gemessen wird in tatsächlich verfügbarem Containerraum, nicht allein Fensterbreite. Multiwindow, Split View, Textzoom, virtuelle Tastatur und Safe Areas sind verpflichtende Layoutfälle. Keine redundante mobile Capture-Logik. Sichtbare Aktionen haben ein geeignetes Touch-Ziel; `:hover` ist auf Touch irrelevant.

## 5. Semantisches State & Feedback-System

### 5.1 Zustandsvokabular

| State | Visueller Grundvertrag | Semantik & A11y |
|---|---|---|
| `rest` | opake Surface + feine Kontur | alle Kernaktionen sichtbar/erreichbar |
| `hover` | sanfter Surface-Tint + kontrollierter Lift | nur Ergänzung; darf Touch nicht ausschließen |
| `pressed` | leicht reduzierter Lift/Kompression | reagiert sofort, nicht erst nach Animation |
| `focus-visible` | 2-px stark kontrastierender Outline + Abstand (Kandidat) | für Keyboard stets erkennbar; system High Contrast |
| `selected` | getönte Surface + explizites Häkchen/Count | per Screenreader ausgewählt angekündigt |
| `active` | klare aktuelle Navigation/Segment-Wahl | `aria-current`, `aria-selected` oder `aria-pressed` passend |
| `disabled` | reduzierte Interaktivität *und* semantischer Grund | kein untoter klickbarer Control; Erklärung erreichbar |
| `loading` | Skeleton/Spinner nur wenn sinnvoll | `aria-busy`/Status, kein erfundenes Erfolgsergebnis |
| `pending` | eigene Wartemarkierung | lokaler Commit und Cloud-Pending getrennt |
| `success` | Check/Statusmeldung erst nach echtem ACK des betroffenen Scopes | assertive nur bei nötiger Aufmerksamkeit |
| `warning` | Label + Hinweis/Optionen | Pending, Unterbrechung, limitierte Funktion konkret benennen |
| `error` | hohe Lesbarkeit, Ursache und Recovery-Aktion | keine rein dekorative rote Glowmeldung |
| `offline` | stabile Daten weiter nutzbar falls lokal vorhanden | keine fingierte Cloudverbindung |
| `conflict` | beide Versionen und bewusste Wahl | niemals still überschreiben |
| `empty` | Living Empty nur für tatsächlich 0 gespeicherte Items | Such-Empty/Filter-Empty/Loading/Offline getrennt |
| `dirty` | editierte, noch nicht dauerhaft bestätigte Änderung | Warnung bei unsicherem Verlassen, Save-Zustand eindeutig |
| `interrupted` | Audio nicht mehr live aufgenommen | Session-Rettung zeigen statt Fake-Timer |
| `reduced-motion` | stille räumlich eindeutige Zustandswechsel | keine Informationen allein über Animation |

**Überlagerung von States:** `focus-visible` bleibt auch bei `selected`, `disabled` gewinnt über Hover, `error` gewinnt über Success-Glühen, `cloud.pending` darf lokalen `saved`-Status nicht ausradieren. Fehlersignale sind persistent bis zur tatsächlichen Auflösung, nicht ein flüchtiger Toast.

### 5.2 Truthful Status Contract `[FIX D-027/028/029]`

`draft.dirty` ≠ `local.saving` ≠ `local.durable` ≠ `cloud.pending` ≠ `cloud.acknowledged(revision)` ≠ `cloud.conflict` ≠ `local.failed`. Kein generisches „Gespeichert“ bei unklarem Scope. Labels etwa „Auf Gerät gesichert“, „Cloud wartet“, „Alles synchronisiert“ nur wenn die einzelnen technischen Beweise vorliegen. Cloud-Symbol nicht gleich lokale Quota-Sicherheit. Erfolgshandoff auf lokale bestätigte Durable-Speicherung gate'n, Cloud-ACK separat. Version Restore erzeugt nach bestätigter Sicherung der aktuellen Fassung eine neue Revision; Offline-/Konfliktfällen eigene UI.

### 5.3 Universal Microfeedback Contract `[PROPOSAL]`

- Copy erfolgreich: dezentes Check + accessible Text, nicht eine große modale Animation; Clipboard API Error ist ein sichtbarer Error mit manueller Alternative.
- Paste/Capture: kein zweites Item bei Composer-Fokus; nach lokalem Commit räumlicher Handoff nur wenn Ziel sichtbar und stabil, ansonsten zusammengefasste Confirmation mit „Anzeigen“.
- Save: persistent lokaler und Cloud-Zustand getrennt; Toast darf Fehler nicht verdecken.
- Remove/Trash: Undo unmittelbar (falls gültig), Papierkorb für spätere Wiederherstellung; keine erfundene Retention.
- Recorder: `idle/requesting/recording/paused/interrupted/stopping/saved/error`; ein roter Recording-Indikator nur solange tatsächlich Capture aktiv.
- Handoff: Copy nur Text; .md einzeln; ZIP mit Assets und Manifest; vor Erfolg Vollständigkeit/Dateireferenzen prüfen, Audio explicit opt-in.

## 6. Komponenten-Katalog — 40 Familien

**Leseschlüssel:** `DS-Cxx` = Designsystem-Komponentenfamilie; Mapping `SC-xx` kommt aus IA-02; `D-xxx` aus Benutzerentscheidungen. Eine Familie kann mehrere UI-Varianten enthalten, wird aber nicht als unabhängige Datenquelle dupliziert.

| ID | Familie | Pflichtvarianten / States | Herkunft / Screen |
|---|---|---|---|
| DS-C01 | App Shell | desktop/tablet/mobile, auth/loading/offline | D-001 / SC-01/24 |
| DS-C02 | Sidebar Icon Rail | compact/pinned/dynamic overlay, focus/hover | D-002/018 / SC-02 |
| DS-C03 | Space Switcher / Space Row | active/inactive/overflow/locked, space tint | D-018/031 / SC-02 |
| DS-C04 | Global Quick Nav | Alle/Favoriten/Zuletzt/Sessions, active | D-018 / SC-04–07 |
| DS-C05 | Ambient Header | expanded/collapsed/transition, light/dark | D-013/019/020/031 / SC-02 |
| DS-C06 | Sticky Workspace Toolbar | space/search/capture, keyboard/safe area | D-020/021 / SC-02 |
| DS-C07 | Smart Capture Bar | rest/focus/typing/dnd/upload/disabled/error | D-003/027 / SC-02 |
| DS-C08 | Living Empty Stage | zero/saving/first commit/reduced | D-026/027 / SC-09 |
| DS-C09 | Smart Grid Card | text/image/audio/file/folder, hover/selected | D-005/006/032 / SC-02 |
| DS-C10 | Smart List Row | same item/action grammar, dense/comfy | D-005/032 / SC-02 |
| DS-C11 | Card Preview | text excerpt/image/thumbnail/audio/unknown | D-005 / SC-02/10 |
| DS-C12 | Card Quick Actions | copy/more, focus/touch access | D-006 / SC-02 |
| DS-C13 | Unified Action Menu | context and ellipsis share action registry | D-006 / SC-23 |
| DS-C14 | Breadcrumb Trail | folder location / overflow / ancestor focus | D-024 / SC-03 |
| DS-C15 | Folder Card | preview, nested, selected, open vs detail gate H-01 | D-024 / SC-03 |
| DS-C16 | Folder Move Target | valid/invalid/cycle/forbidden/pending | D-022–024 / SC-25 |
| DS-C17 | Sorting Control | automatic/manual, never silently rerank | D-023 / SC-16 |
| DS-C18 | Density + View Toggle | comfort/standard/compact, grid/list | D-005/032 / SC-16 |
| DS-C19 | Bulk Selection Bar | n selected/hidden scope/undo, mobile | D-022 / SC-15 |
| DS-C20 | Adaptive Item Inspector | open/close/loading/locked/resizable | D-004 / SC-10 |
| DS-C21 | Hybrid Composer | source/preview/split, dirty/saved/conflict | D-007/009 / SC-11 |
| DS-C22 | Markdown Toolbar | formatting, cursor/selection/disabled | D-007 / SC-11 |
| DS-C23 | Context Rail | assets/timeline/collapsed/mobile-sheet | D-010 / SC-12 |
| DS-C24 | Inline Asset Reference | inserted/missing/linked/broken | D-007/010 / SC-11/12 |
| DS-C25 | Floating Recorder | permission/recording/paused/interrupted | D-008 / SC-13 |
| DS-C26 | Session Timeline | ordered moments, assets, missing, seek | D-008 / SC-13 |
| DS-C27 | Post-Stop Session Flow | saving/failure/composer, originals retained | D-009 / SC-11/13 |
| DS-C28 | Smart Handoff Sheet | copy/md/zip, manifest, audio opt-in, error | D-011 / SC-17 |
| DS-C29 | Smart Search Palette | query/results/commands/zero/error/mobile | D-021 / SC-14 |
| DS-C30 | Trust Indicator | locally-saved/pending/synced/offline/error | D-028 / SC-18 |
| DS-C31 | Sync Center | revision evidence/conflict/details/retry | D-028 / SC-18 |
| DS-C32 | Undo / Toast | contextual/actionable/expired/error, a11y | D-027/029 / SC-15/19 |
| DS-C33 | Trash List & Restore | deleted/recovering/missing assets/conflict | D-029 / SC-19 |
| DS-C34 | Version Timeline | current/preview/restore-as-revision | D-029 / SC-20 |
| DS-C35 | Studio Space Sheet | name/color/icon, saving/error/enter | D-025 / SC-08 |
| DS-C36 | Quick Preferences | sidebar/density/theme, single state | D-002/033 / SC-21 |
| DS-C37 | Settings Studio | general/appearance/data/security | D-031–033 / SC-22 |
| DS-C38 | Adaptive Mobile Dock | default/select/recorder/ime/critical | D-030 / SC-24 |
| DS-C39 | Content-Specific Tools | image/OCR/PIN/file etc. — parity **unverified** | SC-27 / LEGACY GATE |
| DS-C40 | Import/Backup/Auth Utilities | backups, connection, migration — parity **unverified** | SC-01/26/28 / LEGACY GATE |

**Zusätzliche Primitive** (kein zusätzlicher Screen): Button, Icon Button, Input, Textarea, Select, Segmented Control, Tooltip, Popover, Dialog/Sheet, Disclosure, Skeleton, Status Banner, Progress, Inline Alert, Safe-Area Spacer, Focus Scope, Overlay Portal. Sie teilen Farb-, Radius-, Motion- und Interaktionswerte, haben aber keine eigenen Fachaktionen.

## 7. Component State Contracts — die neuralgischen Familien

### 7.1 Smart Capture / Handoff (`DS-C07`,`C08`,`C09`,`C32`)

| Trigger | Eingangsbedingung | UI State | Feedback / Exit |
|---|---|---|---|
| Paste außerhalb editierbarer Ziele | Inhalt validiert | `capture.pending` | lokalen Commit abwarten; bei Erfolg Card-Handoff |
| Paste im Composer | Composer hat Textfocus | `composer.editing` | eine Markdown-Editierung, **keine** neue Capture-Card |
| Drop über Canvas | erlaubter Inhalt | `drop.ready` | echte, zugängliche Dropzone + Typcheck |
| Local commit failure | Quota, Schema, IO | `capture.error` | keine grüne Animation; sichere Kopier-/Export-Rettung anbieten |
| Local durable success | Zielcard sichtbar | `handoff.flying -> settling` | Zielgeometrie; Undo textlich+per Keyboard |
| Local durable success, Ziel offscreen/virtualisiert | stable ID, nicht gerenderter Target | `handoff.summary` | keine erlogene Flugroute; „Anzeigen“ |
| Batch import | viele Dateien | `handoff.batch` | aggregierter Übergang, per-Datei-Fehlerliste zugänglich |
| Neues Space-Item nach 0 | Count nach bestätigtem Commit >0 | `empty.exit` | Grid-Card erscheint, keine Fake-Daten |

### 7.2 Card/Selection/Inspector (`DS-C09`–`C20`)

- Desktop Hover zeigt primäre Copy- und Mehr-Aktion nur am kompatiblen Typ; Fokus zeigt dieselben Aktionen; Mobile zeigt sichtbaren, erreichbaren Einstieg.
- Primary click auf **normaler** Karte → Inspector; Copy-Icon → Copy ohne Inspector; Checkbox/Select Mode → Auswahl ohne Öffnen; Drag Handle/Pointer Threshold → Move/Reorder ohne Klick. Für **Ordner** `H-01` noch offen; Empfehlung „öffnen“, Informationen via Menü.
- Selected State nicht nur per lavendelfarbener Fläche, sondern Auswahlhäkchen/Count. Bei Filterwechsel `selected total` und `visible selected` getrennt; Hidden-Scope-Bulk-Aktion bestätigen (`[PROPOSAL]`).
- Auto-Sort ≠ manueller Rank. Kein Drag über „Auto“-Wert als implizites Umsortieren. Switch Density/Theme/Grid/List erhält IDs und Scrollanker.
- Inspector Loading und „Item gelöscht/gesperrt“ sind visuell eigene Zustände. Composer-Einstieg ersetzt regulären Inspector rechts; Scroll-/Fokusort bleibt rekonstruierbar.

### 7.3 Composer / Rail / Handoff (`DS-C21`–`C24`,`C28`)

- Source/Preview/Split ein **Dokument**. Optischer Preview-Inhalt ist aus sicher verarbeitetem Markdown, **kein** Vertrauen in HTML des Users.
- Rail ist Context zum Composer, nicht zweite konkurrierende Karte-Detail-UI. Asset-Referenzen konsistent mit Manifest; broken references als echter Alert.
- `dirty` ist sichtbar bis durable bestätigt. Beim Verlassen keine fingierte Sicherung; Draft-Rettung oder explicit Confirm je technischer Kapazität.
- Handoff: `.md`-Text und ZIP mit Anhängen werden unterschiedlich bezeichnet. Audio nur per bewusster Opt-in; fehlende Dateien vor „Export fertig“ melden.

### 7.4 Recorder / Mobile Dock (`DS-C25`–`C27`,`C38`)

- Recorder bleibt bei Space-/Inspector-Navigation im eigenen persistenten Activity-Layer. Das Dock behält Spaces/Search/Capture; an Keyboard/Safe Area angepasst.
- Recorder `interrupted` stoppt Live-Status, erklärt Browser-/OS-Unterbrechung und erlaubt Rettung soweit Rohdaten wirklich existieren. Keine Fake-Resume-Garantie.
- Mobile Auswahl und Aufnahme: eigene Slots oberhalb oder innerhalb des Docks, Priorität den aktiven sicherheitsrelevanten Aktionen, keine verdeckten Buttons unter iOS-Keyboard.

### 7.5 Trust / Recovery / Settings (`DS-C30`–`C37`)

- Lokales Speichern, Cloud-Sync, Conflict und Offline mit getrennten Status; Header-Icon ist kompakt im Normalfall und deutlich bei Problemen.
- Version-Restore erzeugt neue Revision (falls technisch machbar), Trash stellt Verweise und Assets wieder her; kein UI-Versprechen ohne echtes Speichermodell.
- Quick Prefs + Studio zeigen `sidebar.mode`, `view.density`, `theme.mode` aus **einer** Quelle; endgültige Scopes `H-03` ungeklärt. UI muss bei Offline/Save-Fail korrekte Rückmeldung geben.

## 8. Motion Tokens & Choreography Crosswalk

### 8.1 Kandidaten der Motion Grammar `[PROPOSAL]`

| Token | Dauer/Ziel | Kurvenidee | Haupteinsatz |
|---|---|---|---|
| `motion.fast` | 100–160 ms | soft-out | Check, Hover, pressed, icon state |
| `motion.standard` | 180–260 ms | ease-out/soft spring | Menu/Popover, Small Sheets |
| `motion.scene` | 240–340 ms | räumlich koordiniert | Sidebar, Inspector, Rail, Dock state |
| `motion.expressive` | 340–480 ms | spring + kurzer Overshoot/Settle | Capture Handoff, Space Sheet, erste Karte |
| `motion.stagger` | etwa 25–60 ms Abstand | begrenzt auf sichtbare Elemente | 2–8 Karten/Settings, nicht 10.000 Elemente |
| `motion.reduced` | sofort bis max. kurzer Opacity-Wechsel | ohne Parallax, Scale-Fly, Overshoot | OS-Präferenz/Accessibility |

**Die exakten Zahlen bleiben Kandidaten**, konsistent zu Blueprint 03 §4.2; Springs/Easings sind nicht festgelegt, bevor wir Render-Reflow, reale GPU-Leistung, Pointer-Dauer, Reduced Motion und schnelle Wechsel testen. Keine künstliche Animationsverzögerung vor Tastendruck/Copy/Save.

### 8.2 Crosswalk M-01–M-12 → Komponenten

| Motion | Betroffene Familie | Qualitätsanforderung |
|---|---|---|
| M-01 Sidebar Rail | C02/03 | Overlay expansion ohne Canvas-Reflow; Hover Intent Delay |
| M-02 Ambient Header | C05/06/07 | Scroll Collapse ohne Capture-Remount/Caretverlust |
| M-03 Smart Capture | C07 | Rest → Edit/Drop/Recorder; gleiche Action-Quelle |
| M-04 Spatial Handoff | C07/09/32 | echte Zielgeometrie **nach** lokalem Commit, Offscreen Fallback |
| M-05 Card → Inspector | C09/20 | räumliche Kontinuität, stabiler Board-Kontext |
| M-06 Inspector → Composer/Rail | C20–23 | rechte Spalte nie doppelt; Dokumentzustand erhalten |
| M-07 Recorder Mini ↔ Panel | C25/26 | Activity-State persistent, Timer unabhängig |
| M-08 Selection/Bulk | C19/09 | visuelle Zählung und Schließpriorität stabil |
| M-09 Manual Reorder/Move | C16–18 | manuelle Reihenfolge erkennbar; Virtualization-Fallback |
| M-10 Living Empty → First Card | C08/09 | erst wenn erstes Item existiert und lokal gesichert |
| M-11 Search/Popover/Handoff | C28/29/35–37 | Fokusführung und Layer-Priorität vor schöner Fluganimation |
| M-12 Atmosphere & Density | C03/05/09/18 | Space-/Theme-Tint und Dichtewechsel ohne Statusfarbverlust oder Selection-Mutation |

**Storyboard-IDs:** Die Reihenfolge M-01..M-12 entspricht dem Interaction Blueprint 03 §4.3. **Adaptive Mobile Dock (C38)** nutzt zusätzlich `SM-11` und dieselbe Scene-Motion-Grammatik; es erhält **keine künstlich umnummerierte M-ID**. Keine neuen Motion-Sprints durch Umbenennung auslösen.

## 9. Accessibility, Robustness & Design QA

### 9.1 Zielnormen und praktische Prüfungen

**Ziel:** WCAG 2.2 AA als Abnahmerahmen, soweit für die Web-App anwendbar. Das heißt **nicht**, dass eine visuelle Skizze dies bereits erfüllt. Semantisches HTML, `prefers-reduced-motion`, `prefers-contrast`/Forced Colors, Touch, Keyboard, 200–400-%-Zoom und Screenreader als QA-Arbeitspakete.

- Text: i. d. R. mindestens 4,5:1 für normalen Text, mindestens 3:1 für große Schrift; UI-Indikatoren/Focus 3:1 gegen relevante Nachbarfarben prüfen.
- Bewegungen: alle Aktionen ohne Motion erreichbar; Browser-/OS-Reduced-Motion respektieren; visuelles Floating-Morphing darf nicht Fokusposition diktieren.
- Touch: Zielgrößen **als Implementierungsziel** 44×44 CSS px für primäre mobile Touch-Aktionen; WCAG-2.2-Mindestanforderungen separat prüfen (nicht gleichsetzen). 44-px-Zeilenhöhe auch in compact, falls die Zeile tappable ist.
- Focus: klar sichtbare Ringform, Reihenfolge folgt logischem DOM; beim Schließen Fokus zurück zum Trigger bzw. sinnvoller Nachfolger; persistente Recorder-Layer bei Tab-Order erreichbar.
- Inline-Status: Live Regions gezielt, nicht jede animierte Karte mit Screenreader-Ausgabe überfluten; Error darf nicht nach Timeout verschwinden.
- Markers: ausgewählte Items, Space-Active, Sync und Cloud Conflict nie nur als Farbfleck.
- Zoom/Dynamic Type: Textwrap vor Icon-Verschwinden; Editor/Panels nicht unter festen Höhen abschneiden. Browser-IME, macOS Compose Keys, iOS Keyboard mit Safe Area QA.

### 9.2 Visuelle QA-Matrix — 32 vorgeschlagene spätere Checks

| ID | Prüfszene | Erwartung |
|---|---|---|
| DS-QA-01 | Light Ambient + Header expanded | Violet-Bokeh ohne harte Hero-Kante, Kontrast |
| DS-QA-02 | Dark Ambient + gleiche Space-Tint | eigener Dark-Look, nicht invertiert |
| DS-QA-03 | 3 Space-Farben wechselnd | nur Ambient/Mikro-Akzente wechseln; Status semantisch stabil |
| DS-QA-04 | Text auf Bokeh und Frosted | überall ausreichend Kontrast, keine Textmilch |
| DS-QA-05 | Unsupported Backdrop Filter | opaker lesbarer Fallback |
| DS-QA-06 | Low Power / GPU Weak | keine Blur-Pflicht, sanfter stabiler Fallback |
| DS-QA-07 | Sidebar alle 3 Modi | kein Canvas-Jump, Focus gleichbleibend |
| DS-QA-08 | Workspace Header collapse + IME | keine doppelte Capture-Instanz, Caret stabil |
| DS-QA-09 | Squircles + Focus Ring | kein Outline-Clipping durch Masken |
| DS-QA-10 | Grid-Card Hover, Copy, Focus | Aktion ohne Hover per Keyboard/Touch |
| DS-QA-11 | Selected Card in Light/Dark | Check/Icon/Count, nicht nur Farbwechsel |
| DS-QA-12 | 3 Density × Grid/List | alle 6 Modi sauber, keine Sort-/Selection-Mutation |
| DS-QA-13 | Large Text + Compact Density | kein abgeschnittener Text, Touch-Ziel sicher |
| DS-QA-14 | 0/1/100/10.000 Items | keine exzessive Stagger-/Renderlast |
| DS-QA-15 | Folder Card Click | H-01 nach expliziter Abnahme einheitlich |
| DS-QA-16 | Composer Source/Preview/Split | gleiche Daten, kein HTML-XSS, Fokus |
| DS-QA-17 | Rail + Inspector Wechsel | nicht zwei konkurrierende rechte Spalten |
| DS-QA-18 | Session Recording + Mobile Dock | Safe Area, keine Occlusion |
| DS-QA-19 | Recorder interrupted | sichtbarer Interrupted-/Recovery-State, kein Fake-Timer |
| DS-QA-20 | Local Save Fail | keine Success-/Fluganimation |
| DS-QA-21 | Cloud ACK alter Revision | nicht „alles synchronisiert“ |
| DS-QA-22 | Offline + Sync Pending | lokal vs. Cloud getrennt |
| DS-QA-23 | Search-Empty vs. Space-Empty | Living Empty nur bei tatsächlich leerem Space |
| DS-QA-24 | Restore einer alten Revision | aktuelle Revision vor Restore erhalten |
| DS-QA-25 | Handoff Audio opt-in | ZIP-Inhalt stimmt, kein ungefragter Audio-Export |
| DS-QA-26 | Settings Quick↔Studio | eine Preference-Datenquelle, Scope angezeigt |
| DS-QA-27 | Palette Shortcut im Composer | H-02 bestätigt, Browser/Editor nicht übersteuert |
| DS-QA-28 | Modal + Recorder + Global Error | Critical Alert nicht verdeckt; Escape sicher |
| DS-QA-29 | Screenreader VoiceOver / NVDA | Fokus, Labels, Status, Selected Items |
| DS-QA-30 | Reduced Motion / Forced Colors | gleichwertige Bedienbarkeit und sichtbarer Status |
| DS-QA-31 | Textzoom 200 %, 400 % / Mobile landscape | kein funktionskritisches Abschneiden |
| DS-QA-32 | Legacy OCR/PIN/Backup/Bildtools | funktionale Parität nur nach Legacy-Feature-Audit beanspruchen |

**32 Design-QA-Fälle sind neue *Testfälle für später*, keine ausgeführten Tests.** Sie ergänzen die 36 `IM-QA`-Szenarien, ersetzen sie nicht; Überlappungen im finalen Testplan de-duplizieren.

## 10. Token Governance, QA-Gates und Freigabeliste

### 10.1 Was bereits verbindlich ist

Die gewählten D-001–D-033, insbesondere Lavender, Space-Ambient, Dark-Mode, Squircle, Soft Elevation / Frosted 70/30, Editorial Fonts, Expressive 80/20, Smart Capture/Grid/Composer/Recorder/Dock/Trust/Recovery und die gemeinsame Preference-Quelle. Kein Architekturbedarf darf diese Richtungen still kippen.

### 10.2 Was **nicht** als endgültig beschlossen gelten darf

Exakte Hexwerte, Breakpoints, Font-Schnitt, Radiuswerte, Zeitkurven, Shadow-Blur, Opacity, C01–C40-Komponentenschnittstellen, Tooltip-Spacing, Containerbreiten, Figma-Realisierung, Wireframes als Pixelwahrheit. Der Design-Blueprint bietet **Kandidaten und testbare Kontrakte**.

### 10.3 Noch offene Benutzer-/Technik-Gates

| Gate | Status nach Phase 04 | Empfehlung |
|---|---|---|
| H-01 Folder Card Klick | **offen** | direkt öffnen, Details separat (keine stille Freigabe) |
| H-02 Palette vs Composer Shortcuts | **offen** | Kollisionsfreie Prioritätsmatrix nach Keyboard-Prototyp |
| H-03 Preferences Scope | **offen** | Gerät/Konto/Space je Setting festlegen |
| H-04 Bulk Group Drag | **offen** | zunächst explizites Bulk Move bevorzugen |
| H-05 Retention / Media Budget | **offen** | Storage-/Privacy-Gesetzmäßigkeit + Nutzerregel |
| T-01 local write / revision ACK | **nicht nachgewiesen** | echter Offline/Crash/Quota/Test |
| T-02 Audio Web/PWA/iPhone | **nicht nachgewiesen** | reale Device-Aufnahme-/Interruption-Tests |
| T-03 Responsive/A11y/Performance | **nicht nachgewiesen** | echte Geräte und Screenreader testen |
| T-04 Security & Legacy Parity | **nicht nachgewiesen** | RLS/XSS/CSP/OCR/PIN/Bild/Backup-Inventar |
| T-05 Storage/Revision/Migration | **nicht nachgewiesen** | Migrations-/Referenzmodell mit Recovery |
| DS-TOKEN-01 Farbwerte/Font/Radius | **nur Kandidaten** | Render-Visual-QA in Light/Dark/Space-Szenen |
| DS-TOKEN-02 Material/Glass/Perf | **nur Kandidaten** | Performance-Fallback und Kontrastauf echtem Device |
| DS-TOKEN-03 Motion-Easings/Durations | **nur Kandidaten** | Real-Browser-Kalibrierung mit Reduced Motion |

### 10.4 Nächste Phase und Übergabe

**Consolidation Phase 05: Technical Feasibility, Security, Legacy Feature Parity, Storage/Sync/Recovery/Migration.** Erst danach: agententaugliches Implementierungsbriefing mit Decision Ledger, IA-02, Motion-03, DS-04, P0/P1/H/T-Gate-Abnahme, Single-Owner-API-/State-Verträgen und konkretem QA-Plan. Nur mit separater ausdrücklicher Nutzerfreigabe und isoliertem Branch später Code anfassen. Keine Production-Änderung ohne zusätzliches Human Gate.

**Freeze-Protokoll:** Kein Änderungsantrag an D-001–D-033. Bei tokenbezogener Anpassung neue DS-04-Revision mit Änderungsgrund und Screenshot/QA-Nachweis; nicht rückwirkend Masterplan-Entscheidungsblock verändern.
