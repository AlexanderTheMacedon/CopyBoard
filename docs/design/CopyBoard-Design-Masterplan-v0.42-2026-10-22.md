# CopyBoard — Master Design Blueprint & Decision Ledger

**Version:** v0.42 · **Stand:** 22. Oktober 2026 · **Status:** UX-/UI-Konzept, **keine Implementierungsfreigabe**

> **Single source of truth (Konzept-Snapshot):** Dieses Dokument bündelt die im Designgespräch ausdrücklich ausgewählten Richtungen und ihre dazu besprochenen Interaktionsregeln. Es ist ein versionierbares Arbeitsartefakt, **noch keine Entwicklerfreigabe und keine Pixel-Spezifikation**. Abweichungen und neue Details sind bei der nächsten Revision ausdrücklich zu dokumentieren. Als separate Quelle bleiben die ursprünglichen Gesprächsbeiträge maßgeblich, wenn eine Formulierung hier eine Nuance verkürzt.

## 0. Produktauftrag und unverhandelbare Grundsätze

- CopyBoard ist eine Evolution des bisherigen, schnellen Clipboard-/Capture-/Asset-Workspaces, kein beliebiger generischer Filemanager und keine ersatzlose Neuerfindung.
- Inhalte und Arbeitsabläufe: Text, Code, Markdown, Screenshots, Bilder, Dateien, Ordner, Spaces, Suche, Kopieren, Favoriten, später Audio-Sessions und Prompt-/Agent-Handoff.
- Der Kern bleibt: **schnell alles erfassen, finden, kopieren und weiterverarbeiten**. Neue Agentic-Funktionen ergänzen den Kern, sie verdrängen ihn nicht.
- **UX-/UI-Entscheidungen werden hier im Gespräch gemeinsam getroffen**, bevor irgendein Agent Code ändert. Kein eigenmächtiger Implementierungs- oder Live-Deployment-Run.
- Sicherer Entwicklungsprozess später: isolierter Branch, Architektur-/Migrationskonzept, Tests und echte Browser-QA, manueller Human Gate vor Production.
- Bestehende kritische Auditthemen (Datenverlust bei Storage/Schema-/Quota-Problemen, XSS, Cloud-/Konfliktverhalten, Mobile-/Touch-Bedienung, Zugänglichkeit) **dürfen nicht ungeprüft mit in den neuen Release übernommen werden**. Keine sensiblen Originaldaten für ungesicherte Tests verwenden.

## 1. Festgelegte Entscheidungen — in Reihenfolge

### D-001 · Gesamtarchitektur der Oberfläche: Hybrid Workspace (C)
- **Status: beschlossen.** Schmale linke Navigationsleiste, kompakte obere Kontext-/Werkzeugleiste, große zentrale Inhaltsfläche; je nach Tätigkeit eigene Ansichtstiefe für Karteninspektor und Composer.
- Nicht: eine dauerhaft dominierende Vollbreitennavigation oder reine horizontale Spaces-Leiste.

### D-002 · Sidebar: Kompakt mit Hover-Expansion (B), Supabase-artig
- **Status: beschlossen.** Im Ausgangszustand Icon-Rail; bei Maus-Hover weich aufklappende Seitenleiste.
- Bottom-Button öffnet ein kleines Popover mit **drei expliziten Modi**: (1) *Immer kompakt*, (2) *Immer ausgefahren*, (3) *Dynamisch/Hover*.
- **Vorgeschlagener Standard:** dynamisch; gewählter Modus nutzerseitig persistent.
- Temporäre Expansion als Overlay **ohne Layoutsprung** des Hauptinhalts; kontrollierte Ein-/Ausfahrchoreografie und kleine Schließverzögerung, kein Hover-Flackern.
- Im rein kompakten Modus hilfreiche Tooltips. Voll per Tastatur fokussierbar.
- **Mobile:** Hover entfällt; Sidebar als per Tap öffnender Drawer/Overlay.
- Icon-Stil: Lucide-artig, fein, Squircles statt pillenförmiger Controls.

### D-003 · Capture-Einstieg: Smart Capture Bar (B)
- **Status: beschlossen.** Kompakte, zentrale Capture Bar unterhalb Workspace-Header statt ständig riesiger Dropzone.
- Ruhezustand: Schreiben/Einfügen/Ablegen, Anhänge und Mikrofon als klare Einstiegspunkte.
- Fokus und Aktion lassen die Bar kontrolliert expandieren: Texteingabe/Notiz, Drag-&-Drop-Zone oder Recorder.
- **Cmd/Ctrl+V** muss unmittelbar und intuitiv funktionieren; Drag & Drop kann das ganze Canvas zum Drop Target machen.
- **Vorgemerkt (nicht Standard):** Floating Capture Dock (ursprüngliche Variante C) als optionaler, ausklappbarer Schnellzugriff. Eine gemeinsame Aktionslogik, kein redundantes System.

### D-004 · Karten öffnen: Adaptive Detail View (C)
- **Status: beschlossen.** Karte anklicken öffnet rechte Inspector-/Detailansicht, Board bleibt kontextuell sichtbar.
- Bei großen Arbeitsinhalten optional **Fokus-/Vollbildmodus** mit mehr Platz, insbesondere Markdown-/Prompt-Editor und größere Bildbearbeitung.
- Inspector auf Desktop später in der Breite anpassbar. Auf kleinen Screens als passende Vollansicht/Sheet.
- Kein Zwang, ständig zwischen isolierten Modal-Dialogen zu wechseln.

### D-005 · Inhaltsdarstellung: Smart Grid (C)
- **Status: beschlossen.** Einheitliche Kartenraster-Grundgeometrie, Abstände und nachvollziehbare Reihenfolge. **Keine unruhige Pinterest-/Masonry-Anordnung.**
- Je Inhaltstyp eigene semantische Preview: Markdown/Text (Auszug), Bild (echte Vorschau), Audio (Wellenform/Metadaten), Ordner (Mini-Übersicht), sonst Dateien/Code entsprechend.
- **Listenansicht bleibt vorhanden**; Wechsel zwischen Grid und Liste.
- Karten beim Hinzufügen/Sortieren/Umordnen hochwertig animieren, ohne störende Sprünge.

### D-006 · Kartenaktionen: Smart Actions (C)
- **Status: beschlossen.** Desktop zeigt beim Hover/Fokus nur wichtige Direktaktionen (insbesondere **Kopieren**, plus **…**). Keine überladene Karte.
- Kartenklick öffnet Inspector; erweiterte Aktionen im einheitlichen Menü und der Detailansicht.
- Kontext-/Rechtsklick-Menü und Drei-Punkte-Menü bilden **dieselbe logische Aktionspalette**, keine widersprüchlichen Zweitsysteme.
- Mobil keine Hover-Abhängigkeit: wichtige Aktionen per sichtbarem Control oder geeignetem Touch-Verhalten erreichbar.
- Kopieren bleibt als Kernhandlung **ein Klick**, sofern Inhaltstyp dies unterstützt. Downloads gesondert für binäre Dateitypen.

### D-007 · Markdown-/Prompt-Editor: Hybrid Composer (C)
- **Status: beschlossen.** Drei Modi: Markdown-Quelltext, visuelle Vorschau und **Split View**.
- Markdown als portables, maßgebliches Textformat; direkter Code-/Syntaxkomfort, aber kein schwerfälliges IDE-Interface.
- Bilder im Markdown inline referenzierbar; echte Dateien bleiben als Anhänge erhalten.
- Typografisch sauber, wenige präzise Werkzeuge, Copy/Save/Export/Bundle, automatische Entwurfssicherung.
- Desktop kann Split View nutzen; auf Mobile in der Regel nur eine Editorfläche zur selben Zeit.
- Editor integriert sich in adaptive Detail-/Fokusansicht.

### D-008 · Sprach-Session: Floating Recorder + Session Panel (C)
- **Status: beschlossen.** Kleine Recorder-Leiste bleibt beim Arbeiten in der App sichtbar, ohne vom normalen Inspector abhängig zu sein.
- Ausklappbares Session Panel mit chronologischer Timeline und Materialien (Screenshots, Dateien, Audio).
- Jeder angehängte Inhalt bekommt einen Zeitstempel relativ zur Aufnahme; originale Assets bleiben erhalten.
- Während der Aufnahme im Workspace navigieren, Assets öffnen und hinzufügen können.
- **Browser-/Mobile-Vorbehalt:** Aufnahme bei App-Wechsel, Hintergrund oder Berechtigungswechsel kann unterbrochen werden; keine unzutreffenden PWA-Garantien.

### D-009 · Nach dem Stoppen: Composer automatisch öffnen (B)
- **Status: beschlossen.** Reihenfolge: Aufnahme beenden → alle Originale robust sichern → vorbereiteten Hybrid Composer öffnen.
- Session und Draft bleiben eigenständig erhalten; fortsetzbare Entwürfe und klare Save-Zustände.
- Eine KI-Aufbereitung/Transkription ist **optional**, nicht Voraussetzung der UX und wird niemals als ungefragt stattfindend dargestellt.

### D-010 · Anhänge im Composer: Context Rail rechts (A)
- **Status: beschlossen.** Schmale, auf Wunsch ein-/ausklappbare Materialspalte rechts neben dem Editor; Audio, Screenshots, Dokumente und **Timeline**.
- Desktop: einstellbare Breite vorgesehen, editorfreundliche Restfläche. Mobil: Drawer/Sheet statt permanenter Dreispaltigkeit.
- Einzelne Screenshots über Drag & Drop oder explizite Aktion an Cursorposition ins Markdown referenzieren. Timeline führt zur passenden Stelle der Audioaufnahme.
- **Keine Konkurrenz** zwischen Material-Rail im Composer und normalem Karten-Inspector. Jede Ebene hat klaren Kontext.

### D-011 · Übergabe an Agenten: Smart Handoff Sheet (B)
- **Status: beschlossen.** Der direkte Copy-Button bleibt immer in Reichweite, dazu ein erweiterter Handoff-Dialog/Sheet.
- Drei Primärwege: (1) **Prompt kopieren** (Markdown-Text), (2) **Markdown exportieren**, (3) **vollständiges ZIP-Paket** inkl. ausgewählter Screenshots/Assets und nutzbarer relativer Verweise.
- Copy darf **nicht** suggerieren, dass binäre Anhänge automatisch mitübertragen wurden. Reine .md-Datei und Paket sind begrifflich klar getrennt.
- Sprach-Originale nur bewusst in Übergabe aufnehmen; nichts ohne explizite Nutzerhandlung zu Drittanbietern senden.
- **Nicht entschieden/optional später:** Agenten-Presets für Opus, Fable, Codex und echte direkte Integrationen.

### D-012 · Visuelle Grundidentität: Soft Studio (B) mit Precision-Anteil (C)
- **Status: beschlossen.** Hochwertig, weich, zugänglich und mit Charakter – ohne operative Präzision zu opfern.
- Referenzrichtung: Superlist, Sketch; zusätzlich die Effizienz/Detailklarheit von Linear/Supabase sowie die Qualität bereits gestalteter eigener Anwendungen.
- Keine überladene Toolbar, keine generische SaaS-Ästhetik und kein beliebiges Glassmorphism.

### D-013 · Farbe: Mist & Lavender (B), Lavender Bokeh
- **Status: beschlossen.** Kühles Mist-Grau und Lavendeltöne als Markenwelt; Graphit für Lesbarkeit und dezentes Iris als Akzent.
- **Expliziter Wunsch:** Bokeh-/Blurry-Gradient wie im ibo Editor Header, **in lila/violetten harmonischen Verlaufsfarben** mit mehreren ineinanderfließenden weichen Lichtfeldern statt flachem linearen Verlauf.
- Besonders in Header/Hero und ausgewählten Empty States; keine wilde Verlaufskonkurrenz hinter allen Grid-Inhalten.
- Individuelle Space-Farben bleiben von Hauptpalette unabhängig. Eigener gedämpfter Bokeh-Dark-Mode vorgesehen.
- **Vorläufige Farbstudie, noch keine finalen Tokens:** Mist `#F5F3FA`, Lilac `#C4B5FD`, Orchid `#DBB6F5`, Periwinkle `#AEB8FA`, Iris `#7064C8`.

### D-014 · Formensprache: Soft Squircle (B)
- **Status: beschlossen.** Klar erkennbar abgerundete Rechtecke/Squircles; kompaktere Radien bei Controls, großzügiger bei Karten, noch größer bei Dialogen/schwebenden Layers.
- Keine durchgängigen übertriebenen Pillen; saubere geometrische Hierarchie.
- Wo technisch/visuell sinnvoll echte Squircle-Silhouetten statt nur maximal runde Ecken.

### D-015 · Materialität: Soft Elevation (B) + Frosted Layers (C) ungefähr 70/30
- **Status: beschlossen.** 70/30 ist eine **Design-Hierarchie**, nicht eine einheitliche Opacity-Zahl für alle Elemente.
- Basis: überwiegend opake, weiche Flächen, haarfeine Konturen, dezente Schatten – für Grid-Karten, Listen, Editor, Context Rail, Inspector, generelle Sidebar.
- Gezielt atmosphärische Blur-/Frosted-Schichten für schwebende Popovers, Handoff Sheet, Floating Recorder, Quick Actions, Command Palette, Layer über Bokeh-Hero.
- **Sichtbarer Blur hinter transparenten Akzentflächen ist erwünscht**; nicht bloß trübes halbtransparentes Weiß. Kontrast/Lesbarkeit und leistungsfähige Fallbacks bleiben wichtig.
- Aus Gespräch als Startpunkt, **keine fixen CSS-Tokens**: Hauptflächen ~90–100 % opak, schwebende Secondary Layers ~82–92 %, ausgewählte Frosted Popovers ~72–86 % plus echter Backdrop-Blur.

### D-016 · Typografie: Soft Editorial (B)
- **Status: beschlossen.** Systemische, sehr gut lesbare Schriftfamilie im UI (SF-Pro-/Inter-Charakter), mit dezent mehr Ausdruck in Workspace-Titeln, Headern, Empty States.
- Text, Listen, Controls: produktive Präzision. Code und Markdown-Quelltext: Monospace.
- Keine ungesteuerte Mischung vieler Displayfonts; abgestufte Größe/Gewicht/Zeilenhöhe, starke Lesbarkeit auch auf Mobile.
- Exakte Fontfamilie und Typografie-Tokens noch offen.

### D-017 · Motion Design: **80 % Expressive Motion (C) / 20 % Soft Choreography (B)**
- **Status: beschlossen am 21.10.2026; neueste explizite Nutzervorgabe.** Diese Entscheidung **ersetzt die zuvor empfohlene B-dominierte Bewegungsrichtung**.
- CopyBoard darf erkennbar lebendig, charaktervoll, federnd, verspielt und wow-würdig sein: bouncy Cards, koordinierte Stagger-Sequenzen, Hover-Lift/-Zoom, lebendige Mikrointeraktionen und elegante Morph-/Transition-Zustände.
- Die 20 % Soft Choreography sind der **Qualitäts- und Kohärenzrahmen**, nicht ein Auftrag, Animationen beliebig laut zu machen: räumliche Kontinuität, kontrollierte Übergaben, konsistentes Timing, stabile Layouts, klare Ausgangs-/Endpunkte.
- Vier priorisierte Motion-Momente: (1) dynamische Sidebar öffnet sich mit räumlichem Morphing ohne Content-Jump, (2) Smart Capture Bar verwandelt sich in Eingabe/Drop/Recorder, (3) Grid-Karte wird nachvollziehbar zu Inspector/Fokusansicht, (4) hinzugefügte/verschobene Karten setzen sich sichtbar und angenehm in das Raster.
- Zusätzlich: Recorder-Miniatur ↔ Session Panel, Context Rail, Handoff Sheet, schwebende Aktionsebenen, Menü-Popovers und Undo/Toast sinnvoll choreografieren.
- **Motion-Engineering-Gates:** schnelles Klicken/Wechseln/Abbrechen ohne Stottern, harte Sprünge oder falsche Zustände; Eingaben niemals blockieren; `prefers-reduced-motion` respektieren; Touch, Tastatur und Fokusführung berücksichtigen; Animation unterstützt Interaktion, ersetzt sie nicht.
- **Wichtig:** 80/20 ist eine Richtungspräferenz, keine exakt messbare Laufzeit-, Anzahl- oder Frequenzquote.

### D-018 · Workspace-Navigation: Spaces First (B)
- **Status: beschlossen am 21.10.2026; ausdrücklich vom Nutzer mit „B“ gewählt.** Die Spaces sind in CopyBoard die primäre Navigations- und Organisationsmetapher. **Globale Ansichten sind nachgeordnet** und jederzeit erreichbar.
- In der erweiterten Supabase-artigen Seitenleiste steht oben der Bereich **„Deine Spaces“** mit den farblich unterscheidbaren Spaces (im diskutierten Beispiel: Entwicklung, Design, Kunden); darunter, räumlich und visuell separat, ein Bereich **„Schnellzugriff“** für **Alle Inhalte, Favoriten, Zuletzt und Sessions**.
- Der Nutzer kann einen Space unmittelbar anwählen; der aktive Space muss eindeutig erkennbar sein. Die Farben gehören der individuellen Space-Identität und sind **nicht** mit der Lavender-Bokeh-Markenpalette zu verwechseln.
- Das muss im **kompakten Icon-Rail**-Zustand und in der **temporär überlagernden Hover-Expansion** aus D-002 funktionieren. Der Sidebar-Bottom-Button behält unverändert das Popover mit **Immer kompakt / Immer ausgefahren / Dynamisch (Hover)**. Keine zusätzliche Navigationsstufe aus der nicht gewählten Variante „Adaptive Navigation“.
- **Vorgeschlagene, noch zu detaillierende Informationsarchitektur:** primäre Space-Shortcuts im oberen Teil, klar abgesetzte globale Shortcuts darunter; Optionen für lange Space-Listen, Sortierung, Verschachtelung/Ordner und den Space-Erstellen-Einstieg werden in späterem Sprint konkret festgelegt. Nicht entschieden: genaue Icon-Reihenfolge, ob „Alle Inhalte“ permanent vor oder nach den Space-Einträgen liegt, Darstellung von Unterordnern, Mengenbegrenzung im schmalen Rail und genaue Behandlung der Übersicht bei vielen Spaces.
- **Nicht gewählt:** A (Library First), C (zusätzliche adaptive Rail-Navigationsebene). Keine Änderung der anderen D-001 bis D-017-Entscheidungen. **Noch keine Implementierung.**

### D-019 · Workspace-Header: Ambient Canvas (C)
- **Status: beschlossen am 21.10.2026.** Nutzer tendierte ausdrücklich zu **C – Ambient Canvas** statt des zuvor vom Assistenten empfohlenen B – Framed Studio. Die gewählte Designrichtung ist verbindliche Grundlage für die weitere Header-Ausarbeitung.
- Der **Lavender-Bokeh-Verlauf beginnt im oberen Bereich des Workspaces** und **verliert sich nach unten stufenlos** in die helle, ruhige Inhaltsfläche. **Kein separat umrahmter Hero-/Header-Container und keine harte Unterkante**; nicht bloß ein Panorama-Banner.
- Space-Kontext und großer, leicht editorialer Space-Titel liegen im oberen atmosphärischen Bereich; darunter die **Smart Capture Bar (D-003)** als eigenständige, sehr gut lesbare Fläche und schließlich das **Smart Grid (D-005)**. Die Illustration ist eine Richtungsstudie, **keine fixierte Pixel-/Höhenvorgabe**.
- Bokeh aus **mehreren weich verschwimmenden violett-lavendelfarbenen Lichtfeldern** mit abgestimmten Lilac-, Orchid- und Periwinkle-Tönen; **kein flacher linearer Verlauf** als alleiniger Effekt. Innerhalb des Textbereichs immer ausreichende Kontraste und ruhige Zwischenflächen.
- Oberflächenhierarchie bleibt **Soft Elevation ~70 % / Frosted Accents ~30 % (D-015)**: Die Smart Capture Bar darf subtil über dem Ambient-Hintergrund schweben; Karten/Editor bleiben weitgehend opak. Sichtbarer Backdrop-Blur auf gezielten Überlagerungen statt flächendeckend milchiger Inhalte.
- Optionaler ambienter Hintergrund-Motion-Effekt **langsam und kaum wahrnehmbar**; Expressive Motion **80/20 (D-017)** bleibt vor allem für tatsächliche Interaktion (Hover, Capture, Karte/Inspector, Drag/Drop) reserviert. `prefers-reduced-motion` und Performance-Fallback beachten.
- **Scroll-Verhalten inzwischen entschieden:** siehe D-020 – Collapsing Ambient (B). Offen: konkrete Headerhöhen und Scrollschwellen, Such-/Command-Positionierung, Mobile-Crop, Dark Mode und endgültige Gradient-Tokens.
- **Nicht gewählt:** A – Panorama Header, B – Framed Studio. Keine Änderung an D-001 bis D-018. **Keine Implementierung.**

### D-020 · Header beim Scrollen: Collapsing Ambient (B)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „B“.** Der großflächige **Ambient-Canvas-Header (D-019)** wird beim Scrollen **weich zu einer schmalen, sticky Workspace-Toolbar verdichtet**, statt abrupt zu verschwinden oder den vollen Bokeh-Header dauerhaft anzuheften.
- **Ausgangszustand:** Freier Lavender-Bokeh-Verlauf ohne harte Containerkante, mit Space-Kontext, Soft-Editorial-Überschrift, Smart Capture Bar und anschließendem Smart Grid. Der Gradientenbereich fließt in den neutralen Canvas aus (D-019).
- **Beim Herunterscrollen:** Der große Titel/atmosphärische Header reduziert sich räumlich nachvollziehbar. Eine kleine Toolbar hält **aktiven Space, Suche und schnellen Capture-Zugang** erreichbar. Der ausgedehnte Bokeh-Effekt zieht sich zurück, die Arbeitsfläche gewinnt vertikalen Platz.
- **Beim Zurückscrollen nach oben:** Der große Ambient-Header kehrt wieder in seinen ursprünglichen Zustand zurück. Kurze Richtungswechsel und schnelles Scrollen dürfen weder flackern noch mehrfaches Expand/Collapse erzwingen.
- **Motion:** Der Übergang ist ein bewusst sichtbarer, hochwertiger Moment im **80 % Expressive / 20 % Soft Choreography**-System (D-017), jedoch niemals auf Kosten von Performance, Lesbarkeit, Fokus oder direkter Bedienbarkeit. Für `prefers-reduced-motion` ein reduzierter, nicht-transformierender Zustandswechsel.
- **Smart Capture (D-003) bleibt eine eindeutige Funktion:** In der kompakten Toolbar ist ein schneller Capture-Einstieg erreichbar; **keine zweite konkurrierende Erfassungslogik** erfinden. Die große Bar muss nicht permanent sticky bleiben.
- **Kompatibilität:** Supabase-artige Hover-Sidebar (D-002) und rechter Inspector/Context Rail (D-004/D-010) bleiben unabhängig nutzbar; Header-Transition darf kein horizontal springendes Layout erzeugen. Mobile angepasst, keine zwingende großflächige sticky Fläche.
- **Noch offen:** genaue Kollaps-Schwelle, Höhen und Easing, Platzierung der Such-/Command-Funktion und Quick Actions, Verhalten bei geöffnetem Inspector, Wechsel zwischen Spaces und Restore-Scrollposition, Mobile-/Tablet-Breakpoints, Verhalten bei Fokus in Smart Capture und Browser-Scroll-Restoration.
- **Nicht gewählt:** A – Natural Scroll (vollständig mitscrollender Header); C – Persistent Ambient (dauerhaft sichtbarer größerer Gradient). **Keine Implementierung, keine Repository-Änderungen.**

### D-021 · Suche: Smart Search Hybrid (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Ein **dezenter Suchtrigger** im Workspace-Header und in dessen kompaktem Sticky-Zustand öffnet eine **großzügige, globale Suchoberfläche** mit Command-Palette-Funktionen. Kein dauerhaft dominierendes Suchfeld.
- **Einheitlicher Einstieg:** Suchsymbol oder Tastenkürzel (Desktop: vorgeschlagen **Cmd/Ctrl+K**); die Suche muss auch ohne Tastenkürzel und auf Touchgeräten auffindbar sein.
- **Suchräume:** globale Suche über Spaces hinweg sowie **gezielte Space- und Dateitypfilter**. Ergebnisgruppen machen Inhaltstyp und Fundort transparent (z. B. „Agent-Briefing.md · Entwicklung / Prompts“). Treffer können Karten/Inspector öffnen; Navigation zu einem Space ist ebenfalls möglich.
- **Suche und Befehle in einer Palette, aber erkennbar getrennt:** Treffer lesen/öffnen ist nicht dasselbe wie eine Aktion ausführen. **Kein versehentliches Löschen, Verschieben oder sonstiges mutierendes Verhalten durch einfache Texteingabe**; destruktive Aktionen nur klar gekennzeichnet und abgesichert.
- **Visuelle Richtung:** Soft-Studio-Suchtrigger entwickelt sich optional über eine hochwertige, räumlich nachvollziehbare Expansion zur Palette; Frosted Accent auf der schwebenden Ebene, opake Ergebnislisten für Lesbarkeit, D-015/D-017 respektieren. Nicht als automatische technische Pflicht für Shared-Element-Morphing ohne Machbarkeitsprüfung interpretieren.
- **Interaktion/Access:** Tastatursteuerung, klarer Fokus, Escape/Schließen, sichtbarer Filterstatus, Screenreader-Beschriftung und auf Mobile ausreichend große Touch-Flächen. Zurück zur vorherigen Workspace-/Scrollposition ohne Kontextverlust.
- **Noch offen:** genaue Suchsyntax, Ranking, Volltextumfang (z. B. Dateiinhalte/OCR), Befehlsgruppen, Vorschaupanel, Zero-Results/Loading, Filter-Chips, mobile Vollbild-Variante und Suchindex-/Performancearchitektur. Beispiele in UI-Mockups sind Platzhalter, keine nachgewiesenen Suchergebnisse.
- **Nicht gewählt:** A – dauerhaft sichtbare Persistent Search; B – Command Palette ohne explizites hybrides Header-/Filtersystem. **Keine Implementierung, keine Repository-Änderung.**


### D-022 · Mehrfachauswahl & Sammelaktionen: Smart Selection Hybrid (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Mehrfachauswahl kombiniert **Tastatur-/Pointer-Interaktionen am Desktop** und einen **klar zugänglichen Auswahlmodus auf Mobile**. Eine **kontextabhängige Floating Action Bar** erscheint ausschließlich bei aktiver Auswahl; keine dauerhaft sichtbaren Checkboxen im normalen Smart Grid.
- **Unveränderte Primärinteraktion:** Normaler Kartenklick öffnet Inspector (D-004); schnelle Direktaktion Kopieren bleibt von der Auswahl getrennt (D-006). Im expliziten Auswahlmodus dient ein Tap/Klick auf die Karte der Auswahl – nicht zugleich dem Öffnen, Bearbeiten oder Kopieren. Visueller Selektionszustand eindeutig erkennbar, unabhängig von Farbe allein.
- **Desktop-Effizienz:** Zusätzlich zum expliziten „Auswählen“-Modus unterstützt die Konzeption **Cmd/Ctrl+Klick** zum An-/Abwählen einzelner Items und **Shift+Klick** für Auswahlbereiche in der **sichtbar sortierten Reihenfolge**. **Escape** schließt/cleart den Modus bzw. hebt Auswahl kontrolliert auf. Tastaturfokus, Screenreader-Auswahlstatus und Shortcuts ohne Konflikt mit Browser, Texteditor oder Command Palette prüfen.
- **Mobile/Touch:** Gut erreichbarer Einstieg „Auswählen“ in der Board-Toolbar; im Auswahlmodus eindeutige Auswahlmarker und ausreichend große Touch-Ziele; **keine Hover-Pflicht** und kein versteckter Long-Press als alleiniger Einstieg. Kontextmenü/Normalaktionen bleiben bei Bedarf separat erreichbar.
- **Schwebende Sammelaktionsleiste:** Erst ab ≥1 gewähltem Element sichtbar. Zeigt Anzahl und wenige priorisierte Aktionen (**Kopieren soweit kompatibel, Verschieben, Exportieren, Mehr**). Je nach Auswahl heterogener Inhaltstypen inkompatible Aktionen klar erklären bzw. unterbinden. Zusätzliche Aktionen über „Mehr“, insbesondere Duplizieren, Favorisieren, ggf. Löschen.
- **Destruktives Verhalten:** Löschen verlangt passende Bestätigung bzw. verlässlich wiederherstellbare Undo-Mechanik; niemals durch versehentliches Verlassen/Wechseln des Auswahlmodus auslösen. Kein stilles Mitnehmen nicht sichtbarer Items über Filter, Pagination und Spaces hinweg.
- **Räumliche Choreografie und Materialien:** Floating Bar entsteht beim ersten gewählten Element weich, mit eigenem lokalen Ursprung, kontrollierter Federung und Frosted Accent (Materialsystem D-015: Soft Elevation/Frosted ca. 70/30; Motion D-017: Expressive ca. 80/Soft Choreography ca. 20). Reflow und springende Kartengrößen vermeiden, bei `prefers-reduced-motion` vereinfachen. Mobile-Safe-Areas, Tastatur und Recorder/Handoff auf Überlagerung prüfen.
- **Grid/List-Parität:** Die Auswahl ist eine gemeinsame Zustandslogik in Grid und Liste; bei View-Wechsel/Sortierung kein unerklärliches Verlieren oder unbemerktes Erweitern des ausgewählten Satzes.
- **Noch offen:** Regeln bei Filter-/Space-Wechsel, Bereichsauswahl über nachgeladene Karten, Drag-Selection/Marquee, Bulk-Copy-Mischtypen, Positions-/Dockingregeln der Leiste und Konfliktauflösung mit Floating Recorder/Optional-Dock. Auch Auswahllimit, Toast-/Undo-Feedback und Massenexportformat später spezifizieren.
- **Nicht gewählt:** A – ständig sichtbare Auswahlmarker; B – ausschließlich expliziter Auswahlmodus auf allen Geräten. **Noch keine Implementierung und keine Repository-Änderungen.**

### D-023 · Sortierung, freie Kartenanordnung & Drag & Drop: Smart Sorting Hybrid (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** CopyBoard bietet **automatische Sortiermodi** (beispielsweise Neueste zuerst, Name A–Z, nach Typ) **UND eine davon unabhängige, persistente eigene Reihenfolge**. Die beiden Systeme sind keine konkurrierenden Datenquellen: Wechsel zu automatischer Sortierung darf die gespeicherte manuelle Reihenfolge **niemals überschreiben oder zerstören**.
- **Ausgangspunkt:** Smart Grid (D-005) bleibt ein ordentliches Raster ohne Masonry-Zufall. Gleiche Sortiersemantik für **Grid und Liste**. Die Darstellung wird umgeschaltet; das Umschalten erzeugt weder neue Reihenfolgen noch verliert es eine bestehende.
- **Sortiersteuerung:** Eine klar beschriftete, zurückhaltende Sortierkontrolle im Inhalts-Toolbar. Darin expliziter Eintrag **„Eigene Reihenfolge“** neben automatischen Optionen. Die aktive Sortierart ist erkennbar; kein verborgenes Umordnen durch Drag bei aktivierter Sortierung nach Datum/Name.
- **Manuelle Reihung:** Nur im Modus „Eigene Reihenfolge“ verschiebt Drag & Drop einzelne Karten (später gegebenenfalls Auswahlgruppen). Nach dem Loslassen bleibt die neue Reihenfolge erhalten; andere Karten rücken räumlich nachvollziehbar mit, nicht sprunghaft. Fehleingaben müssen abbrechbar sein, idealerweise per Undo rückgängig.
- **Drag-Ziel trennen:** *Umordnen innerhalb einer Sammlung*, *in einen Ordner verschieben* und *in einen anderen Space verschieben* sind unterschiedliche Operationen mit eindeutigen Drop-Hinweisen und Feedback. Ein Drag an anderer Stelle darf nicht still Inhalte aus dem Space verschieben oder die Reihenfolge umschreiben.
- **Konfliktfreiheit mit D-006/D-022:** Ein normaler Klick öffnet weiterhin den Inspector; Copy-Aktion bleibt separat. Start einer Drag-Geste benötigt eindeutigen Schwellenwert bzw. Handle/Fokus-Mechanik, damit Klick, Textauswahl, Mehrfachselektion und Drag nicht versehentlich ineinandergreifen. Bei aktiver Mehrfachauswahl erst die Regeln für Gruppendrag/Batch-Verschieben präzisieren.
- **Desktop & Mobile:** Maus-/Trackpad-Drag mit erkennbarem Drag-Preview und Insert-Marker; auf Touchgeräten zusätzlich ein klarer, barrierearm erreichbarer Umordnen-/Verschieben-Einstieg ohne Hover-Abhängigkeit. Tastatur-Alternative zum Umordnen/Verschieben und Screenreader-Feedback vor Implementierung spezifizieren.
- **Animation & Rückmeldung:** D-017 (Expressive Motion 80/20) gilt für Karten-Lift, weiches Verschieben umliegender Karten und präzises Einsetzen. Bei `prefers-reduced-motion` deutlich vereinfacht; keine Layoutsprünge, Autoscroll-Fallen oder dauerhaft schwebenden Ghost Cards. D-015 (Frosted 70/30) bleibt unabhängig davon.
- **Daten-/Sicherheitsdisziplin:** Reihenfolge bezieht sich auf stabile Karten-IDs innerhalb einer eindeutig definierten Sammlung (Space/Ordner). Speicherung muss Quota-, Offline-, Sync- und Konfliktfehler sichtbar behandeln; keine nur optisch geänderte Reihenfolge, die nach Reload verschwindet. Frühere kritische Auditrisiken beim technischen Entwurf mitbehandeln.
- **Noch offen:** Exakte Sortieroptionen und Tie-Breaker; Sortier-Defaults je Space/Ordner; Einfügeposition neuer Karten im manuellen Modus; Regeln für virtuelle/lazy-loaded Listen, Filter und Suchergebnisse; Misch-Auswahl-Gruppendrag; Keyboard-Reorder-Schema; Touch-Drag/Autoscroll und Undo-Details. Das wird im Implementierungs-Blueprint finalisiert, nicht hier als bereits beschlossen ausgegeben.
- **Nicht gewählt:** A – nur automatische Sortierung; B – nur manuelle Anordnung. **Noch keine Implementierung, keine Repository-Änderungen.**

### D-024 · Ordnernavigation: Smart Folder Navigation (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Die **Spaces-first-Navigation aus D-018 bleibt unverändert primär**. Ordner werden **innerhalb des Workspace-Canvas** über hochwertige Folder Cards und **Breadcrumbs** erschlossen; keine dauerhaft ausufernde Explorer-Tree-Sidebar.
- **Ordner als Smart-Grid-Karten:** Ordner haben eindeutig erkennbare, typgerechte Vorschauen (Folder Icon und, wo sinnvoll, Mini-Inhaltsübersicht), Namen und Inhaltszahlen. Auswahl/Öffnen folgt kontextsensitivem Kartenmodell aus D-004/D-006; keine Sonderausnahmen, die Copy/Inspector/Mehrfachauswahl widersprechen.
- **Breadcrumbs:** Über dem aktuellen Ordnerinhalt bleibt der Pfad `Space / Ordner / Unterordner` erreichbar. Ein Klick auf ein höheres Pfadsegment navigiert dorthin zurück. Auf kleinen Screens passt sich die Pfaddarstellung an, ohne den aktuellen Kontext zu verschleiern.
- **Verschachtelung:** Die gewählte C-Variante erlaubt eine verständliche Unterordnerhierarchie im Canvas; sie ist **nicht** auf nur eine flache Ordner-Ebene (Variante A) beschränkt. **Nicht beschlossen** ist unbegrenzte oder eine konkrete maximal zulässige Tiefe. Diese Grenze wird erst in der technischen Spezifikation festgelegt.
- **Sidebar bleibt ruhig:** Die kompakte Supabase-artige Rail und ihr Bottom-Modus-Popover aus D-002 bleiben unverändert. **Kein eigener permanenter Ordnerbaum** neben allen Spaces (nicht gewählte Variante B). Die Nutzerführung bleibt direkt über Space-Namen/Farben und globale Schnellzugriffe erfassbar.
- **Anheften:** Häufig verwendete Ordner lassen sich **optional als Schnellzugriff anheften** und ebenso wieder entfernen. Die UI muss erkennbar zwischen normalem Ordner und angeheftetem Shortcut unterscheiden; ein angehefteter Verweis ist keine zweite Kopie der Daten.
- **Auf Mobilgeräten:** Navigation über klare Pfad-/Zurück-Aktionen; Folder Cards und Menüs per Tap, nicht auf Hover angewiesen. Der Arbeitsbereich bleibt nutzbar, ohne permanente Doppelnavigation.
- **Drag & Drop / Datenbezug:** Ordner sind explizite Zielobjekte für das aus D-023 vorgesehene Verschieben, **nicht** automatisch neue Sortierpositionen. Beim Bewegen von Objekten zwischen Ordnern/Spaces müssen eindeutige Zielmarkierungen und sichtbare Speicher-/Fehlerzustände bestehen. Bestehende Datenverlust-/Sync-Risiken aus Audit bleiben Umsetzungssperre ohne Safeguards.
- **Materialität/Motion:** Folder Cards übernehmen Smart-Grid/Squircle/Soft-Elevation-Design (D-005/D-014/D-015); das Öffnen und Zurücknavigieren nutzt Expressive Motion 80/20 (D-017), bleibt auch bei schnellen Wechseln stabil und respektiert Reduced Motion.
- **Noch offen, nicht heimlich beschlossen:** konkrete Ordner-Tiefengrenze; genaue Folder-Preview bei leeren/sehr vollen Ordnern; Position/Limit gepinnter Ordner in kompakter/erweiterter Sidebar; Pfadkürzung auf iPhone; Ordner-Neuanlage, Umbenennung und Verschieben bei Schreibkonflikten; Sortierzustand je Ordner; Copy-/Move-Dialoge und Tastaturkürzel.
- **Nicht gewählt:** A – Flat Folders als starre einzige Ebene; B – ständig sichtbarer Explorer Tree. **Keine Implementierung und keine Repository-Änderungen.**

### D-025 · Space-Erstellung: Studio Space Sheet (B) mit Instant-Speed (A)
- **Status: beschlossen am 21.10.2026.** Nutzer wählte ausdrücklich **B – Studio Space Sheet**; der zuvor empfohlene Grundsatz **„mit der Schnelligkeit von A“** gehört zum gewählten Konzept. **Keine Template-Gallery als verpflichtender Einstieg**.
- **Einstieg:** Ein klarer **Plus-/Neuer-Space-Trigger** in der Spaces-First-Navigation (D-018), auch in der kompakten Supabase-artigen Rail erreichbar. Eine separate tiefe Navigationsebene wird nicht eingeführt.
- **Erscheinung:** Kleines, hochwertiges, weich geformtes **Frosted Studio Sheet/Popover** mit sichtbarem Backdrop-Blur, zart abgestimmten Lavender-/Violet-Bokeh-Lichtflächen und Soft-Elevation-Schattierung; keine riesige Wizard- oder Vollbildmaske als Desktop-Standard. Visuell entsprechend D-013, D-014 und D-015.
- **Motion:** Das Sheet entfaltet sich räumlich nachvollziehbar aus dem auslösenden Plus-Button; federnde, gut kontrollierte Transformationsbewegung und koordiniertes Staggering ausgewählter Unterelemente gemäß **80 % Expressive Motion / 20 % Soft Choreography (D-017)**. Bei raschem Öffnen/Schließen, Escape, mehrfachen Klicks oder Reduced Motion darf nichts springen oder in falsche Zustände geraten.
- **Minimaler Creation-Flow:** **Plus drücken → Name vergeben → optional Farbe und/oder Icon anpassen → Space erstellen.** Weder ein Template noch weitere Eigenschaften sind obligatorisch. Fokus initial auf das Namensfeld; Standardfarbe/-icon ermöglichen die unmittelbare Erstellung, sobald ein gültiger Name gesetzt ist.
- **Live Preview:** Name, gewählte Farbe und optionales Symbol aktualisieren den Vorschaubereich *sofort und ohne Speichervorgang*. Der künftige Space zeigt seine eigene Akzentidentität, unabhängig von der globalen Mist-&-Lavender-Brandingpalette.
- **Farbwahl:** Kleine sorgfältig aufeinander abgestimmte Swatch-Palette (illustriert: Lavender, Orchid, Sky, Sage, Peach). Die gezeigten Hex-Werte und Anordnung sind **Illustrationswerte, keine finalen Tokens**. Eindeutige Aktivzustände nicht allein durch Farbe; Tastatur-/Touchbedienung und verständliche Farbnamen.
- **Optionales Symbol:** Auswahl aus einer kleinen, konsistenten Icon-Kollektion (Lucide-artig, wie Folder, Code, Palette, Business, Layers); **kein Pflichtschritt**. Icon-Darstellung in Rail und Expanded-Sidebar eindeutig, auch wenn zwei Spaces gleiche Farben wählen.
- **Abschluss:** Nach erfolgreichem Anlegen direkt in den **neuen Space** navigieren. Dort soll eine passende, später zu entscheidende **Empty-State-/Smart-Capture-Experience** willkommen heißen. Fokus und Tastaturbedienung müssen nach Schließen oder Bestätigen sinnvoll wiederhergestellt werden.
- **Speicher-/Fehlersemantik:** Ein neu erstellter Space wird erst als erfolgreich bestätigt/angezeigt, wenn ein belastbarer lokaler Speichervorgang abgeschlossen ist; Fehlschläge/Quota-/Sync-Probleme sichtbar behandeln, um die im technischen Audit benannten Datenverlustrisiken nicht zu wiederholen. Keine implizite Cloud-Erfolgsgarantie.
- **Mobile:** Dasselbe inhaltliche Erstellmodell als gut erreichbares Sheet/Drawer, mit großen Touch Targets, sinnvoller Tastatur- und Fokusführung; keine Hover-Abhängigkeit.
- **Konzept-Vorschau:** Das im Gespräch gezeigte interaktive Formular mit bearbeitbarem Space-Namen, fünf Farb-Swatches und Icons ist **nur eine UI-Demonstration** und erstellt weder reale Spaces noch Daten. Die genaue Formulierung eines Demo-Buttons ist **keine** bereits beschlossene Produkt-Mikrokopie.
- **Abgrenzung:** **A – Instant Space** als alleiniger nüchterner Dialog wurde nicht gewählt; seine Geschwindigkeit wird aber übernommen. **C – Template Gallery** wurde nicht gewählt und bleibt höchstens eine separat zu beschließende spätere Erweiterung.
- **Noch offen:** genaue Feldvalidierung, Duplikatnamen, Undo/Löschen-Flow, Personalisierungsdialog für bestehende Spaces, Default-Farbvergabe, wann Create-Button aktiv ist, Space-Limits, Empty State, genaue Bokeh- und Motion-Tokens, Safe-Sync-Konfliktauflösung. Nichts davon darf aus der Illustration als bereits beschlossen ausgegeben werden.
- **Keine Implementierung, keine Repository-Änderungen.** D-001 bis D-024 behalten ihre Beschlüsse.


### D-026 · Leerer Space: Living Empty State (B)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „B“.** Eine frisch angelegte, tatsächlich leere Sammlung begrüßt den Nutzer mit einem **freundlichen, lebendigen Empty State** statt einer kahlen Ablagefläche oder eines verpflichtenden Einrichtungsassistenten.
- **Visuelle Hierarchie:** Die mit D-019 beschlossene **Ambient-Canvas-/Lavender-Bokeh-Sprache** bleibt Grundlage. Eine **eigenständige kleine Illustration bzw. ikonische Komposition** mit subtiler, charmanter Bewegung setzt einen freundlichen Akzent; **nicht** ungeprüft eine generische Standard-Lottie übernehmen. Konkretes Motiv/Mascot wird später entschieden und darf nicht aus der Skizze als freigegeben gelten.
- **Primäraktion:** Die schon beschlossene **Smart Capture Bar (D-003)** ist der eindeutig wichtigste Einstieg für den ersten Inhalt. Keine zweite konkurrierende Dropzone und keine zusätzliche Pflichtnavigation. Eine knappe, kontextuelle Botschaft erklärt den nächsten Schritt.
- **Drei optionale Schnellstarts:** **Notiz erstellen**, **Datei ablegen** und **Session starten**. Dies sind direkte Shortcuts auf bereits beschlossene Capture-/Composer-/Recorder-Flows, **kein separates Funktionssystem**. Sie sind ohne Maus-Hover zugänglich.
- **Keine Produktreibung:** Keine verpflichtende Tour, kein Step-by-Step-Wizard, keine automatisch angelegten Demo- oder Beispielkarten und keine erzwungene KI-Verarbeitung. Das leere Board bleibt unmittelbar bedienbar; Clipboard-Paste (`Cmd/Ctrl+V`) und Drag & Drop funktionieren wie sonst auch.
- **First-content-Choreografie:** Sobald der erste Inhalt **tatsächlich erfolgreich und dauerhaft lokal gespeichert** wurde, zieht sich das Empty-State-Motiv in einer hochwertigen, räumlich nachvollziehbaren **Expressive-Motion-80/20-Transition (D-017)** zurück und die erste **Smart-Grid-Karte (D-005)** setzt sich ein. Visuelle Bestätigung nicht vor abgeschlossenem Speichererfolg. Bei Fehlern den Zustand erhalten und klar reparierbare Fehlermeldung zeigen.
- **Wann der Empty State erscheint:** Ausschließlich bei *wirklich leerem* Space oder passendem wirklich leerem Ordner. Ein durch Filter oder Suche leerer Trefferbereich, ein fehlgeschlagener Ladevorgang oder ein Offline-/Synchronisationsproblem müssen **eigene Zustände** bekommen und dürfen keine falsche First-Run-Begrüßung auslösen.
- **Wiederkehrende Leere:** Nach absichtlichem Entfernen aller Inhalte kann eine reduzierte, respektvolle Variante erscheinen; das emphatische erste Erscheinen muss nicht bei jedem Besuch neu abgespielt werden. Präzise First-Visit-Logik ist noch offen.
- **Responsivität & Accessibility:** Auf Mobile kompaktere Illustration, sofort erkennbare Capture-Aktion, ausreichende Touch-Ziele und gute Fokusreihenfolge. Screenreader-Hinweise statt rein visueller Erklärung. Systempräferenz `prefers-reduced-motion`, reduzierte Daten/Leistung sowie schnelle Navigation dürfen keine Animation erzwingen oder Eingaben blockieren.
- **Materialsystem:** Soft Elevation mit dosiertem Frosted-Anteil gemäß D-015 (70/30) bleibt erhalten; das Empty State ist kein Auftrag, den gesamten Canvas mit Glas zu überziehen.
- **Nicht gewählt:** A – Minimal Canvas als alleiniger nüchterner Einstieg; C – Guided Studio mit größerer Setup-Tour. **Keine Implementierung, keine Repository-Änderungen.** D-001 bis D-025 bleiben in ihren Beschlüssen erhalten.
- **Noch offen:** finales Illustrationsthema, Mikrokopie, konkrete Bewegungsphasen/-dauern, genaue Platzierung der Schnellaktionen gegenüber der Smart Capture Bar, Verhalten in sehr schmalen Views, States für leer nach Filter/Suche/Fehler sowie deren visuelle Differenzierung.

### D-027 · Capture-Feedback & Speichermoment: Spatial Capture Handoff (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Beim Erfassen eines Inhalts über Smart Capture, Cmd/Ctrl+V, Drag & Drop, Notiz oder Import wird der Vorgang mit einer **räumlich nachvollziehbaren Übergabe an die tatsächliche Zielposition im Smart Grid** beantwortet. Kein bloßer Toast als einziges Erlebnis, kein unvermitteltes Auftauchen.
- **Sichtbarer räumlicher Zusammenhang:** Nach erfolgreicher Persistierung/Commit erzeugt die Capture-Fläche einen kurzen Übergang in die Zielkarte (Position nach aktuell aktiver Sortierung D-023). Die betroffenen Nachbarkarten weichen koordiniert, ohne wilde Layoutsprünge. Es muss erkennbar bleiben, *was* eingefügt wurde und *wo* es zu finden ist.
- **Save before celebrate:** Die grüne Erfolgsmeldung, „Gespeichert“-Kennzeichnung und finale Erfolgsanimation erscheinen **erst nach nachweislich erfolgreichem lokalem dauerhaften Speichern**. Reine optimistische Darstellung im Arbeitsspeicher ist kein Speichern. Bei Datenbank-/Quota-/Schreibfehlern stattdessen klaren Fehlerzustand, Erhalt der Eingabe und praktikable Wiederholen-/Export-Möglichkeiten; keine falsche Sicherheit vermitteln.
- **Sync ist eine getrennte Wahrheit:** Lokale Sicherung und Cloud-Synchronisierung dürfen nicht als identischer Status ausgegeben werden. Wenn nach lokalem Save Cloud-Sync noch aussteht, darf die Bestätigung nicht behaupten, alles sei in der Cloud. Das konkrete, nun als D-028 beschlossene Status-/Sync-Center-Modell definiert die verlässliche Trennung.
- **Undo:** Nach erfolgreichem Capture bleibt ein leicht erreichbarer, zeitlich angemessener und tastaturzugänglicher Rückgängig-Einstieg sichtbar. Das Undo muss fachlich konsistent zum tatsächlichen Datenzustand sein und in bestehenden Board-/Mehrfachauswahl-Abläufen funktionieren.
- **Batch-Verarbeitung:** Bei mehreren gleichzeitig eingefügten Dateien wird die visuelle Bewegung zu einem gemeinsamen Paket bzw. einer gestaffelten kompakten Choreografie zusammengefasst. Keine 40 einzelnen, kaskadierenden Effektfeuerwerke; echte pro-Datei-Fehler/Teilerfolge dennoch unterscheidbar.
- **Timing/Interaktion:** Animation nie auf Kosten der Erfassungsrate; rasch aufeinanderfolgende Paste-Aktionen müssen korrekt verarbeitet werden. Während der Animation keine blockierte Navigation, kein verlorener Fokus und keine unterbrochene Drag-Auswahl.
- **Motion/Material:** Expressive Motion 80 % / Soft Choreography 20 % (D-017) im *Charakter*, nicht in der Anzahl ständig animierter Elemente. Nur bei erfolgreichem Abschluss kurzer federnder Settle-Effekt; Frosted Accent im knappen Save-/Undo-Feedback, Hauptkarten weiterhin Soft Elevation 70/30 (D-015). `prefers-reduced-motion` nutzt klare statische Zustandsänderung und gleichwertiges Statusfeedback.
- **Empty State:** Bei der **allerersten** erfolgreichen Speicherung wird D-026 Living Empty State synchron zur ersten tatsächlichen Karte abgelöst; bei Fehler bleibt der Empty State bzw. zeigt einen transparenten Fehlerzustand, keine fiktiv gespeicherte Karte.
- **Responsiv & inklusiv:** Auf Mobilgeräten keinen Offscreen-Flug erwarten; den Einsetzpunkt im sichtbaren Bereich verständlich signalisieren, ggf. Ziel sichtbar machen ohne unerwartetes Auto-Scroll. Screenreader-Live-Status mit sinnvoller Dosierung, farbunabhängiger Erfolg/Fehler/Undo-Semantik.
- **Nicht gewählt:** A – Quiet Confirmation als alleinige, weitgehend statische Rückmeldung; B – Capture Bar Receipt als einzige Bestätigung ohne räumliche Verknüpfung zur neu entstehenden Karte. Es darf weiterhin **zusätzlich** ein zurückhaltendes Save-/Undo-Receipt geben, aber als Begleitung der räumlichen Übergabe.
- **Noch offen:** Festlegung von Animationstracks, Schwellen, Dauer/Easing und Fallback beim Ziel außerhalb des Viewports; Verhalten bei Auto-Sortierung bzw. aktiver manueller Ordnung; Größen-/Datei-Fehler, Abbruch, Teilerfolge; Undo-Scope; genaue visuelle Ausprägung von lokalem Speicher- und Cloud-Synchronisationsstatus. **Keine Implementierung, keine Repository-Änderungen.**

### D-028 · Speichervertrauen & Synchronisation: Adaptive Trust System (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** CopyBoard verwendet ein **adaptives, dezentes Save-/Sync-Statussystem**: im bestätigten Normalzustand ruhig, bei ausstehenden Uploads, Offline-Betrieb, Fehlern oder Konflikten jedoch deutlich und verständlich sichtbar. Ein **Sync Center** zeigt Details statt eines dauerhaft dominierenden Statuspanels.
- **Zwei unabhängige Wahrheiten:** (1) **lokal dauerhaft gesichert** bedeutet, dass der aktuelle Schreibvorgang auf dem Gerät nachweislich erfolgreich abgeschlossen ist; (2) **Cloud-synchronisiert** bedeutet, dass die betreffende Version vom Server bestätigt wurde und – soweit das Sync-/Versionsmodell es ermöglicht – mit dem lokalen Stand abgeglichen ist. Ein grüner Wolkenhaken darf niemals allein aufgrund eines lokalen Speichervorgangs erscheinen.
- **Kernzustände (mindestens):** *Ungesicherte Änderungen / Speichern läuft*; *lokal gesichert, Cloud ausstehend*; *synchronisiert/aktuell*; *offline, lokal verfügbar*; *Fehler beim lokalen Speichern*; *Sync fehlgeschlagen*; *Konflikt bzw. fremde Revision*. Ein Problem beim lokalen Save ist ernster als eine ausstehende Cloud und muss als solches behandelt werden. Die UI darf keine Cloud-Wahrheit vortäuschen, die die spätere Architektur technisch nicht ermitteln kann.
- **Adaptive Sichtbarkeit:** Kompaktes Statussymbol/kleines Statuslabel im Workspace-Header, auch im Collapsing-Ambient-Modus (D-020) zugänglich. *Normal*: eher zurückhaltend, ohne permanente Benachrichtigungen; *Pending*: diskreter, erreichbarer Hinweis auf ausstehende Änderungen; *Fehler/Konflikt*: persistenter, eindeutig beschrifteter Status und Möglichkeit zur Problemlösung. **Nicht** alle paar Sekunden störende Toaster anzeigen.
- **Sync Center:** Popover/Sheet bzw. dedizierte Detailansicht bei Bedarf. Zeigt getrennt lokalen Speicherzustand und Cloudstand, beispielsweise Zahl ausstehender Operationen, nachvollziehbare Bestätigungszeit sofern tatsächlich bekannt, Internet-/Anmeldestatus, Fehlerbegründung soweit verfügbar sowie mögliche Aktionen wie *Erneut versuchen*, *Konflikt ansehen* oder *lokale Inhalte sicher exportieren*. Zeitangaben nie raten; bloßer Netzstatus ist keine bestätigte Synchronisierung.
- **Konflikte und Datensicherheit:** Kein stilles Last-Write-Wins-Überschreiben offener Edits oder anderer Geräteversionen, solange Nutzer dies nicht ausdrücklich in einem geeigneten Konfliktflow bestätigt. Lokale, möglicherweise neuere Fassungen erhalten und ggf. als separate Revision sichern. Fehlgeschlagene Uploads werden sauber erneut versucht; Wiederholungen dürfen nicht duplizieren oder fremde Daten überschreiben.
- **Offline-Verhalten:** Erlaubte lokale Arbeit bleibt möglich, soweit der tatsächliche Speicher/Browser dies verlässlich unterstützt. Der Status zeigt **offline/Cloud ausstehend**, ohne Cloudgarantie. Änderungen aus Offline-Sessions müssen nach erneuter Verbindung geprüft und konfliktfest synchronisiert werden; bei Speicherplatz-/Quota-Problemen aktive Warnung und verlustarme Export-/Wiederherstellungswege anbieten.
- **Verknüpfung mit anderen Entscheidungen:** Spatial Capture Handoff (D-027) bestätigt lediglich **lokalen** Save-Erfolg; Session-to-Composer (D-009), Hybrid Composer (D-007), Smart Grid (D-005) und Smart Handoff (D-011) respektieren die tatsächlichen Speicherebenen. Bei Navigation, App-Schließen und Gerätewechsel dürfen ungesicherte oder nur lokal verfügbare Änderungen nicht irreführend als überall verfügbar präsentiert werden.
- **Visual & Motion:** Soft Studio / Lavender Bokeh (D-012/D-013), Soft Elevation und Frosted Accents (D-015) für kompakte Status-/Detailflächen; 80/20 Expressive Motion (D-017) nur als knappe, passende Rückmeldung. Bei Fehlern keine spielerisch-grüne Erfolgsanimation. Lesbarkeit, farbunabhängige Icons und Texte, per Tastatur und Screenreader erreichbar, `aria-live` dosiert und `prefers-reduced-motion` berücksichtigen.
- **Technischer Nachweis vor Freigabe:** Reales Supabase-Auth-/RLS-/Storage-/Sync- und Multi-Device-Verhalten inklusive konkurrierender Versionen, Wiederverbindungsversuchen, Speicherquota, iOS/PWA und Offline prüfen. Ohne echte technische Bestätigung **nur wahrheitsgemäße eingeschränkte Statussemantik**. Die Konzeptskizze und interaktiven Demo-Statusfelder sind **keine** reale Sync-Implementierung.
- **Offen (Implementierungs-/Detailphase):** Transaktions-/Revisionseinheiten, Scope pro Karte/Space/Konto, genaue Zeitangaben und Statuspersistenz, Versions-/Konfliktauflösungsmodell, Retry-Backoff, Auth-Abbruch, serverseitiger Versionsstempel, sichere lokale Persistenztechnik, Browsergrenzen, Sync-Center-Lokalisierung und Token-/Iconposition, ggf. Recovery- und Revision-History als eigener UX-Entscheid D-029.
- **Nicht gewählt:** A – ständig dominanter, dauerhaft ausgeschriebener Syncstatus; B – ausschließlich minimales Statussymbol ohne adaptives Detail- und Fehlerkonzept. **Keine Implementierung, keine Repository-Änderungen.** D-001 bis D-027 behalten ihre Beschlüsse.


### D-029 · Wiederherstellung & Versionskontrolle: Recovery Studio (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Ein mehrstufiges, im Alltag bewusst zurückhaltendes Wiederherstellungssystem verbindet **Instant Undo**, **Papierkorb & Wiederherstellen** sowie **gezielten Versionsverlauf** für bearbeitbare Inhalte. Es ersetzt nicht das Adaptive Trust System (D-028), sondern ergänzt dessen Datenintegritäts- und Konfliktkonzept.
- **Schutzstufe 1 – Instant Undo:** Für gerade ausgelöste Aktionen wie Löschen, Verschieben, Sortieren oder Bearbeitung, soweit sinnvoll rückgängig zu machen. Rückgängig über gut sichtbare, aber dezente Bestätigung und passende Tastaturfunktion; Bestätigung/Undo erst nach tatsächlich nachvollziehbarem Aktionszustand. Die im Spatial Capture Handoff (D-027) vorgesehene Undo-Aktion nutzt dieselbe konsistente Logik. Keine irreführende Undo-Zusage bei technisch nicht reversiblen Operationen.
- **Schutzstufe 2 – Papierkorb:** Gelöschte Karten, Dateien/Assets, Ordner und ganze Spaces landen zunächst in einem gesonderten wiederherstellbaren Zustand; Papierkorb zeigt Bezeichnung, Typ, ursprünglichen Space/Pfad und Löschzeitpunkt soweit nachweisbar. Wiederherstellen stellt auch die fachlich zusammengehörigen Assets und Referenzen wieder her, statt lediglich verwaiste Platzhalter anzuzeigen. Bei fehlendem ursprünglichem Ziel explizite Zielauswahl; Namens-/Versionskonflikte werden nicht still überschrieben. Dauer bis zur endgültigen Löschung, Speicherquota und optionale manuelle Leerung sind **noch nicht beschlossen**.
- **Schutzstufe 3 – Versionsverlauf:** Für bearbeitbare Inhalte wie Markdown-Prompts und Notizen frühere, technisch tatsächlich erhaltene Fassungen einsehen und gezielt wiederherstellen. Der Verlauf zeigt nachvollziehbare Änderungszeitpunkte/Revisionen, optional später Vergleich/Diff. *Wiederherstellen* darf spätere Fassungen nicht unwiederbringlich überschreiben: bevorzugt eine neue Revision aus der älteren Fassung erzeugen, vorausgesetzt durch das gewählte Versionsmodell abgesichert. Nicht jeder Zwischenzustand oder jede Binärdatei wird automatisch als versioniert behauptet.
- **Progressive Disclosure / Platzierung:** Im Alltag primär unkompliziertes Undo. Der Papierkorb ist über Navigation/Schnellzugriff bzw. Suche erreichbar, ohne die Spaces-first-Sidebar (D-018) zu überladen. Versionsverlauf erscheint kontextbezogen im Inspector/Hybrid Composer (D-004/D-007) als bei Bedarf geöffnetes Sheet/Panel. Keine dauerhaft dominante Recovery-Oberfläche.
- **Speicher- und Sync-Wahrheit:** Löschmarker, Papierkorb-Inhalte, Entwürfe und Revisionen müssen zum lokalen/cloudbasierten Speicherzustand der betroffenen Version passen; offline und noch nicht synchronisierte Löschungen sowie konkurrierende Gerätefassungen gesondert ausweisen. Niemals eine wiederherstellbare Version anzeigen, die das System nicht mehr tatsächlich besitzt. Cross-Device-Restore, RLS/Autorisierung und Konfliktlösung vor Release mit realem Backend nachweisen. Aus Recovery entsteht kein Recht zum Zugriff auf fremde Inhalte.
- **Sicherheitsregeln:** Endgültig löschen ist eine bewusst abgesicherte irreversible Aktion und darf nicht wie normales Entfernen aussehen. Bei großen Ordner-/Space-Strukturen vor Massendeletion/Restore die Auswirkungen verständlich zeigen; keine versehentliche Kaskadenlöschung. Wiederherstellung erzeugt nachvollziehbare Ergebnisse einschließlich Teilerfolgen/Fehlern. Supabase/Auth- und Gerätewechselzustände sind explizite Testfälle.
- **Visual & Motion:** Recovery Studio folgt Soft Studio, Soft Squircle, Lavender-Bokeh und Material-70/30 (D-012–D-015); Undo und Restore erhalten eine kurze räumliche, klar lesbare Choreografie gemäß Expressive-Motion-80/20 (D-017), ohne Erfolg vor Datenbestätigung zu inszenieren. Tastatur, Touch, Screenreader, Kontrast und Reduced Motion gleichwertig berücksichtigen.
- **Nicht gewählt:** A – reines Instant Undo ohne langfristigen Rückweg; B – alleiniger Papierkorb ohne Versionssicherung für bearbeitbare Inhalte. Beide Elemente bleiben **Bestandteil** des gewählten dreistufigen Konzepts, aber nicht dessen alleiniger Umfang.
- **Noch offen (Detail- und Architekturphase):** Aufbewahrungsdauer, mögliche Größenlimits/Quota, Versionierungsstrategie (Zeit-/Aktionsbasiert; automatische Snapshot-Frequenz), betroffene Inhaltstypen, UI für Versionsvergleich, Wiederherstellungsziel bei verschwundenen Spaces/Ordnern, eindeutige Tombstone-/Delete-Semantik im Cloud-Sync, Schlüsselschutz/Verschlüsselung, Löschung aus Backups und Datenschutzfristen. Das sind keine stillschweigend genehmigten Produktzusagen. **Keine Implementierung, keine Repository-Änderungen.**


### D-030 · Mobile Experience & Quick Capture: Adaptive Mobile Dock (C)
- **Status: beschlossen am 21.10.2026; Nutzer wählte ausdrücklich „C“.** Die mobile App erhält ein **kompaktes, hochwertiges, kontextabhängiges Dock** statt einer bloß verkleinerten Desktop-Oberfläche oder eines ausschließlich versteckten Navigations-Drawers. Es verbindet ergonomisch erreichbare Hauptzugriffe mit einer passenden, situationsbezogenen Aktionsfläche.
- **Stabile Hauptaktionen:** Zugriff auf **Spaces**, **globale Suche** und **Smart Capture** bleibt eindeutig und erreichbar, unabhängig von geöffnetem Space, Scrollposition und Kontextmodus. Zusätzliche direkte Aufnahme- bzw. Session-Aktion kann angeboten werden, ohne parallele, widersprüchliche Capture-Systeme. Icon-only-Elemente erhalten zugängliche Labels; Fokus, Kontrast, ausreichend große Touchziele und Safe-Area-Abstände sind verbindlich.
- **Spaces First (D-018) bleibt intakt:** Spaces bleiben primäre Organisationsorte. Auswahl eines Space öffnet mobil ein verständliches, per Tap bedienbares Sheet/Drawer beziehungsweise eine entsprechende Space-Auswahl; es wird **keine zusätzliche, verschachtelte Hauptnavigation** erzeugt. Die am Desktop beschlossene Hover-Sidebar (D-002) wird mobil **nicht per Hover simuliert**, sondern als explizite, erreichbare Navigation dargestellt.
- **Adaptive kontextabhängige Zustände:** Bei aktiver **Aufnahme** bleibt deren Status und der Zugang zum Floating Recorder/Session Panel (D-008) sicher erkennbar; eine **Mehrfachauswahl** nutzt die Smart Selection-/Bulk-Aktionsfläche (D-022); im **Composer**/Inspector werden Bearbeitungs- und Kontextaktionen zugänglich, ohne Inhalte zu verdecken oder neue Editor-Modi zu erfinden. Das Dock passt sich behutsam an, **ohne seine Hauptaktionen überraschend zu verbergen oder umzubelegen**.
- **Abgrenzung zu bestehenden Komponenten:** Smart Capture Bar (D-003) bleibt die zentrale Capture-Logik; Dock-Aktionen sind mobile Einstiegspunkte in dieselben Funktionen. Context Rail (D-010) und Inspector (D-004) öffnen als mobile Sheets/Vollansichten, nicht als eine gleichzeitig sichtbare, unbedienbare Mehrspaltenlandschaft. Das **optional vorgemerkte Floating Capture Dock für Desktop** aus D-003 ist eine getrennte Idee; D-030 bedeutet keine automatische Freigabe dieses zusätzlichen Desktop-Features.
- **Interaktionslogik:** Das Dock darf beim Scrollen kompakter werden, bleibt bei Bedarf zuverlässig wieder erreichbar und berücksichtigt Tastatur, VoiceOver/Screenreader, Gestennavigation und virtuelle Bildschirmtastatur. Eingabefelder, Editor-Caret, Bestätigungsdialoge und Dateiauswahl haben Vorrang vor einer störenden schwebenden Leiste. Bei aktiver Aufnahme oder noch nicht gesicherten Änderungen keine verdeckten Stop-/Save-Informationen.
- **Material und Motion:** Soft Studio (D-012), Mist & Lavender plus Ambient-Bokeh-Header (D-013/D-019), Soft Squircle (D-014), gezielte Soft Elevation/Frosted Layers 70/30 (D-015), Soft Editorial (D-016) und Expressive Motion 80/20 (D-017). Dock-Transitions sind räumlich nachvollziehbar, aber keine hektischen morphenden Zielwechsel unter dem Finger; Reduced Motion zeigt stabile Alternativen.
- **Layout- und Sicherheitsbedingungen:** iPhone/PWA inklusive Safari-Safe-Areas, dynamischer Viewport-Höhe, Bildschirmtastatur, Datei-Picker, Microphone-Permission/Recording-Unterbrechungen und Offline-/Sync-State (D-028) in echter Browser-QA prüfen. Kollisionsfreiheit mit Floating Recorder, Auswahlleiste, Sync-Center, Toast-/Undo-Feedback, Bottom Sheets und Browser-Navigation sicherstellen.
- **Nicht gewählt:** A – reine Desktop-Drawer-Ableitung ohne mobile Schnellzugriffe; B – starre Bottom-Navigation mit unveränderlichem, stets großem Flächenbedarf. **Keine Implementierung, keine Repository-Änderungen.**
- **Noch offen:** Exakte Dock-Ankerposition, Anzahl sichtbarer Funktionen, Icons/Labels, Auflösung bei sehr schmalen Displays und Landscape, Scroll-Verdichtung, Toolbars in Editor-/Auswahl-/Aufnahmezuständen, Tastatur-/Screenreader-Fokusmanagement, Tablet-Breakpoints, Safe-Area-Metriken und mögliche Web-vs-PWA-Varianten. Das ist keine stillschweigende Produktfreigabe.

### D-031 · Erscheinungsbild & Farb-Atmosphäre: Adaptive Atmosphere (C)
- **Status: beschlossen am 21.10.2026.** Nutzer wählte im Design Sprint 28 ausdrücklich **C – Adaptive Atmosphere** statt A (*Light First*) und B (*Dual Studio ohne Space-Tönung*).
- **Drei Themes:** *Hell*, *Dunkel*, *System*. System folgt der Betriebssystempräferenz; eine explizite Nutzerauswahl überschreibt diese bis zur nächsten Änderung. Die gewählte Einstellung wird persistent gespeichert und möglichst geräteübergreifend übernommen, soweit Auth-/Settings-Sync technisch verifiziert ist. Keine Behauptung einer bestätigten Cloud-Einstellung ohne technische Grundlage.
- **Eigenständiger Dark Mode:** Kein simples Invertieren der hellen Oberfläche. Der helle Modus nutzt Mist/Off-White und Lavender-Bokeh; der dunkle Modus entwickelt eine eigene lesbare Graphit-/Aubergine-Basis mit kontrolliertem violettem Licht. Karten, Editor, Inspector, Kontextleiste und Sync-/Recovery-Flächen bekommen eigenständige Oberflächen-/Text-/Border-Tokens je Theme.
- **Dynamischer Space-Ambient:** Die vom Nutzer in D-025 ausgewählte Space-Akzentfarbe beeinflusst **sanft den diffusen Ambient-Bokeh-Lichtschein im Workspace**. Beispielsweise kann ein lavendelfarbener Space eher iris-/lilafarbene, ein blauer Space eher kühle und ein grüner eher salbeigrüne Lichtflächen erhalten. Die globale Produktidentität bleibt CopyBoards Mist-&-Lavender-DNA (D-013), nicht pro Space ein vollständig neues Farbdesign.
- **Begrenzte Wirkung:** Die Space-Farbe tintet primär unscharfe Hintergrund-Lichter und kleine Identitätsakzente wie Space-Markierung; **nicht** unkontrolliert Fließtext, Editorhintergründe, Warn-/Erfolgsfarben, Interaktionskontraste oder komplette Smart-Grid-Karten. Das Ambient-Licht löst sich nach unten ins neutrale Content Canvas auf (D-019) und respektiert Collapsing Ambient (D-020).
- **Beide Dimensionen unabhängig:** Light/Dark/System ist die globale Erscheinungsbild-Einstellung; Space-Farbtemperatur ist eine kontextbezogene Akzentschicht. Der Space-Wechsel darf das Theme **nicht** umstellen. Standard-Fallback für unkonfigurierte/ungewöhnliche Space-Farben bleibt Lavender mit begrenzter Tönung.
- **Materialität unverändert:** D-015 bleibt **ca. 70 % Soft Elevation / 30 % gezielte Frosted Accents**; Frosting/Blur sind nur dort sichtbar, wo echte Hintergründe durchscheinen, ohne milchige Unlesbarkeit. Farb-/Alpha-/Blur-Wirkung in Light und Dark einzeln abstimmen.
- **Motion unverändert:** D-017 bleibt **80 % Expressive / 20 % Soft Choreography** als Charakterregel, **nicht** als Daueranimation. Theme-/Space-Wechsel mit diskreter, räumlich plausibler Ambient-Überblendung ohne Flash, Font-Neulayout, Input-Fokusverlust oder leistungsintensive Dauereffekte; bei `prefers-reduced-motion` unmittelbar bzw. reduziert wechseln.
- **Accessibility und Performance:** Kontraste aller Texte/Controls und Zustandsfarben im realen Composite prüfen (auch über Frosted-/Bokeh-Flächen), einschließlich High-Contrast-/Reduced-Transparency-Szenarien, Farbsehschwächen, Touch und Screenreader. Bei Transparenz-/GPU-Schwäche stabile Farbflächen statt defekter Blur-Effekte. Kein Bedeutungsunterschied allein durch Space-Farbe.
- **Systemische Grenzen:** Kritische Speicherzustände (D-028) und Recovery (D-029) bleiben in jedem Theme eindeutig und semantisch, auch wenn der Space selbst rot/grün gefärbt ist. Kein Verlust von Benutzerpräferenzen und keine behauptete Synchronisierung bei Theme-Wechsel.
- **Nicht beschlossen:** finale HEX-/OKLCH-Tokens, Blur-Stärken, konkrete Space-Hue-Mischformel und Farb-Budgets, Theme-Switch-Platzierung, automatische Geräte-Synchronisierung als nachgewiesenes Feature, Dark-Mode-Screenshots und Cross-Browser-QA. Diese Punkte sind Bestandteil des anschließenden Detail-Blueprints.
- **Keine Implementierung/keine Repository-Änderungen.**

### D-032 · Dichte und Kartenmaßstab: Adaptive Density (C)
- **Status: beschlossen am 21.10.2026.** Nutzer wählte im Design Sprint 29 ausdrücklich **C – Adaptive Density** statt A (*Spacious Gallery*) und B (*Precision Dense*).
- **Drei manuell wählbare Darstellungsdichten:** **Komfort**, **Standard** und **Kompakt**. **Standard** ist der ausgewogene Ausgangspunkt; Komfort gibt Vorschauen, Karten und Zwischenräumen bewusst mehr Platz, Kompakt priorisiert Übersicht und hohe Informationsdichte. Alle drei nutzen dieselbe grundlegende **Smart-Grid-Systematik** aus D-005 – kein Wechsel zu Masonry oder zufälliger Karte-an-Karte-Geometrie.
- **Freiwillige, persistente Einstellung:** Ein kompakter, zugänglicher Display-/Density-Selector gehört in die Content-Ansichtsoptionen (Grid/List) bzw. nachprüfbar erreichbare View Settings. Die Auswahl wird lokal gespeichert; eine mögliche geräteübergreifende Synchronisierung ist erst nach technischer Verifikation zugesichert. Ein Wechsel des Spaces darf nicht unerwartet eine andere Dichte vortäuschen; globaler Standard und etwaige spätere pro-Space-Overrides sind noch getrennt zu spezifizieren.
- **Responsive, aber nicht eigenmächtig:** Die Anzahl der Spalten und Preview-Flächen passt sich sinnvoll an die **tatsächlich verfügbare Containerbreite** an (auch bei geöffneter Sidebar, Inspector oder Context Rail). Der gewählte Modus bleibt semantisch bestehen; responsive Breakpoints dürfen Spaltenzahl/Abstände anpassen, aber **nicht bei jedem Dateityp heimlich die Dichtestufe wechseln**. Bei wenig Platz gewinnt Lesbarkeit vor starr erzwungener Spaltenzahl.
- **Grid und Liste:** Beide Anzeigemodi bleiben verfügbar. Dichte steuert konsistent Kachelgröße/-abstände, Vorschauhöhe, Metadatenumfang und passende Zeilenhöhen, ohne Einträge willkürlich auszublenden. Bei Fotos/Screenshots bleiben erkenn- und aufrufbare reale Vorschaubilder; bei Text/Audio/Ordnern bleiben spezifische Vorschauinformationen. Kompakt bedeutet **weniger Platz pro Karte**, nicht Verlust der Nutzbarkeit oder zwangsweise reine Icon-Ansicht.
- **Content- und Interaktionsstabilität:** Keine Änderung der **persistenten manuellen Sortierreihenfolge** aus D-023 beim Dichtewechsel; Fokus, aktuell selektierte Karten, Scrollposition/Anker und aktiver Inspector bleiben möglichst erhalten. Mehrfachauswahl (D-022), Hover-/Fokusaktionen (D-006), Drag & Drop und ein Klick zum Kopieren dürfen in keiner Dichtestufe in Konflikt geraten. Eine Dichteänderung ist reine Darstellungseinstellung, kein Datenmutationsevent.
- **Designsystem bleibt dieselbe Marke:** Soft Squircle (D-014), Soft Studio und Precision-Akzent (D-012), Soft Editorial (D-016), Soft Elevation/Frosted 70/30 (D-015) und Adaptive Atmosphere (D-031) werden **nicht** durch Kompakt zu ungestylten Tabellen oder durch Komfort zu übergroßen Pillen. Abstände, Typografie und Preview-Größen folgen **diskreten Design-Tokens** statt beliebigen individuellen Skalierungsfaktoren.
- **Motion:** Der Wechsel zwischen Dichten soll räumlich nachvollziehbar (D-017), aber kurz und stabil sein. Kein chaotisches Hin- und Herfliegen von vielen Karten, keine ungewollten Scrollsprünge; unter Reduced Motion werden sofortige, fokussichere Übergänge genutzt. Große Libraries und virtualisierte Rastersysteme müssen ohne teure Animationslast funktionieren.
- **Accessibility/Touch:** Kontrast, Textskalierung, Screenreader-Reihenfolge, Tastatur-/Focus-Navigation und ausreichend große Touch Targets in **allen** Dichten gewährleisten. Kompakt darf Touch-Ziele nicht unbedienbar machen; bei kleiner Breite, Zoom oder vergrößerter Schrift darf die UI auf größere Zielgrößen bzw. weniger Spalten zurückfallen.
- **Integration:** Das mobile Dock (D-030), Collapsing Ambient (D-020), der per Hover öffnende Desktop-Sidebar-Overlay (D-002) und der Inspector/Composer (D-004/D-007/D-010) dürfen durch den Density-Selector weder überlagert noch verdoppelt werden. Einstellungen sind über die UI klar erreichbar; View-Control-Position ist noch nicht pixelgenau beschlossen.
- **Nicht gewählt:** A – ausschließlich großzügige Gallery; B – ausschließlich dichte Power-User-Darstellung. Keine automatische dateitypabhängige Modusumschaltung und keine zusätzlichen Dateisortier- oder Löschregeln aus dieser Entscheidung ableiten.
- **Noch offen für Detail-Blueprint:** Exakte Kartenbreiten, adaptive Spaltenanzahl und Breakpoints, Abstand/Typografie-/Zeilen-Tokens je Stufe, Vorschau-Seitenverhältnisse und Text-Clamping, Grid-/List-Einstellungslogik, globale vs. mögliche pro-Space-Speicherung, Resize-Verhalten bei offenen Inspector/Context Rail, Design-/Accessibility-/Performance-Browser-QA.
- **Keine Implementierung, keine Repository-Änderungen.**

### D-033 · Settings & Preferences: Smart Preferences Hybrid (C)
- **Status: beschlossen am 21.10.2026 (Design Sprint 30, letzte geplante große Richtungsentscheidung).** Nutzer entscheidet ausdrücklich **C – Smart Preferences Hybrid**. Diese Entscheidung komplettiert die grundlegende UX-Richtungsphase; sie ist **keine Implementierungsfreigabe**.
- **Zwei Zugriffstiefen auf dasselbe Einstellungsmodell:** (1) schlanke, kontextuelle Quick Preferences direkt dort, wo die Einstellung benötigt wird; (2) zentraler, hochwertiger **Settings Studio**-Bereich für fortgeschrittene Einstellungen, Account, Synchronisierung, Datenschutz und Sicherheit. Keine voneinander unabhängigen Zustände oder widersprüchlichen Duplikate.
- **Kontextuelle Quick Preferences:** Das bereits beschlossene **Sidebar-Bottom-Popover (D-002)** bleibt unverändert mit den drei Modi **Immer kompakt / Immer ausgefahren / Dynamisch (Hover)**. An den Ansichtsoptionen für Smart Grid und Liste (D-032) bleibt der **Density-Switch Komfort / Standard / Kompakt** erreichbar. Hell / Dunkel / System (D-031) ist über ein leicht auffindbares Theme-Popover umstellbar; kontextuelle Controls müssen nicht zusätzlich als drei permanente Header-Icons nebeneinander stehen.
- **Settings Studio – Informationsarchitektur als Richtungsentwurf:** **Allgemein & Darstellung** (Sprache, Layout-/Sidebar-Modus, Theme, Dichte, gegebenenfalls Motion-/Accessibility-Präferenzen), **Daten & Synchronisierung** (Speichermodell, Konto-Verbindung, verifizierte Sync-Zustände, Offline-/Export- und Backup-Optionen), **Sicherheit & Datenschutz** (Berechtigungen, Session-/Audio-Einstellungen, Datenschutz, gegebenenfalls PIN/Entsperrung). Kategorien sind logisch, aber Namen und konkrete Feldplatzierung werden im Blueprint noch geschärft.
- **Eigenständige Werkzeuge bleiben eigenständig:** Das **Sync Center (D-028)** ist der maßgebliche Ort für echten Sync-/Fehler-/Konfliktstatus; das **Recovery Studio (D-029)** für Undo, Papierkorb und Versionen. Settings können dorthin verlinken, aber diese Funktionen nicht als irreführende Mini-Kopien nachbauen.
- **Speicher- und Zustandskonsistenz:** Alle Einstellungsorte teilen sich eine klar definierte persistente Preference-Quelle; Änderung im Kontext-Popover spiegelt sich unmittelbar im zentralen Studio und umgekehrt. Lokal bestätigte Settings von geräteübergreifend bestätigten Präferenzen unterscheiden. Grenzen von Browser-/Account-/Device-Speicherung nicht erfinden.
- **Spatial & Visual Experience:** Soft Studio mit Precision-Anteil (D-012), Lavender Bokeh und Adaptive Atmosphere (D-013/D-019/D-031), Soft Squircle (D-014), **Soft Elevation/Frosted ~70/30 (D-015)**; Popovers dürfen gezielt Frosted Blur tragen, Settings-Arbeitsflächen bleiben überwiegend lesbar und opak. Übergänge mit **Expressive Motion 80/20 (D-017)**, sinnvollen Ursprungsorten, ohne störende oder blockierende Animation.
- **Responsivität/Accessibility:** Desktop-Quick-Popovers haben Tastatur-/Screenreader-Beschriftungen, Fokusmanagement, Esc und Klick-außerhalb ohne Zustandsverlust. Auf Mobile in passende Bottom Sheets/Settings-Ansicht überführen, Safe Areas und virtuelle Tastatur berücksichtigen. Keine Hover-exklusive Bedienung. System-/Reduced-Motion-Einstellungen dürfen nicht von einer dekorativen Animation abhängig sein.
- **Sicherheit:** Keine sicherheitskritischen Schalter, Cloud-Fehler oder endgültigen Löschaktionen hinter rein dekorativen Quick-Toggles verstecken. Destruktive Konten-/Lösch-/Reset-Vorgänge erfordern explizite verständliche Bestätigung und belastbare Zustandsrückmeldung; kein unsicheres „Alles synchronisiert“ bei ausstehender Übertragung.
- **Nicht gewählt:** A – ausschließlich ein kompaktes Preferences-Modal; B – ausschließlich ein separater umfangreicher Settings-Workspace ohne kontextuelle Schnellzugriffe. **C ist die bewusste Kombination beider Tiefen**, nicht das parallele Implementieren zweier Preference-Systeme.
- **Für die Konsolidierung offen:** finale IA, konkrete Einstellungsnamen/Defaults, Gerät-vs.-Account-Persistenz, Fokus-/Popover-/Sheet-State-Matrix, Datenschutz-/Berechtigungsmatrix und technischer Nachweis. Diese Detailarbeiten sind Teil des jetzt folgenden Blueprints, **keine neue große Richtungsrunde**.
- **Keine Implementierung, keine Repository-Änderungen.**

## 2. Systemische UX-Verkettung

1. **Alltag**: Nutzer wählt Space (Sidebar), erfasst Material (Smart Capture / Paste / Drop), erhält nach belastbar erfolgreicher Speicherung das räumliche Spatial-Capture-Handoff (D-027), findet es im Smart Grid/der Liste, kopiert mit einer Aktion oder öffnet Inspector.
2. **Prompt**: Karte oder neue Notiz → Hybrid Composer → Markdown/Split/Preview → bei Bedarf Context Rail und inline referenzierte Assets → Direktkopie oder Smart Handoff.
3. **Sprach-Session**: Floating Recorder läuft beim Navigieren → Screenshots/Dateien mit Zeitstempel in Timeline → Stoppen und Originale sichern → Composer mit Kontext → optional Transkription/KI → Handoff.
4. **Responsive**: **Adaptive Mobile Dock (D-030)** mit stabilen Spaces-/Suche-/Capture-Zugriffen und kontextadaptiven Aktionen; Sidebar per Tap als Drawer/Sheet, Smart Actions ohne Hover, Editor einspaltig, Context Rail als Sheet. iOS/PWA-/Safe-Area-/Mikrofon-Limits explizit behandeln.
5. **Zugänglichkeit**: Tastatur, Fokus, Kontrast, Reduced Motion, Touch Targets, Screenreader-Beschriftungen und Zustandsfeedback systemweit.

## 3. Details, die noch **nicht** endgültig beschlossen sind

- **Grundhierarchie beschlossen: Spaces First (D-018).** Offen: exakte Reihenfolge/Struktur der einzelnen Navigationseinträge, Space-Folder-Tree, Verhalten bei sehr vielen Spaces, Erstellung nach D-025 sowie Living Empty State nach D-026 beschlossen; offen sind nachgelagerte Umbenennung/Personalisierung und Details der globalen Ansichten sowie die nun entschiedene Settings-Experience (D-033); Details der einzelnen Preference-Controls bleiben im Blueprint zu konkretisieren.
- Ambient-Canvas-Header beschlossen (D-019), **Scroll-/Sticky-Verhalten ebenfalls beschlossen als Collapsing Ambient (D-020)**; offen bleiben konkrete Kollaps-Schwelle und Headerhöhe, konkrete Suchtrigger-Position und Palette-Ausgestaltung (hybrides Suchmodell D-021 bereits beschlossen), Branding, Space-Switcher, Quick Actions und Mobile-/Dark-Mode-Adaption.
- **Adaptive Atmosphere (D-031) beschlossen:** Hell/Dunkel/System plus dezente, farblich an den aktiven Space angepasste Bokeh-Lichtstimmung bei unveränderter Lavender-Markenidentität. Offen: konkrete Farbtokens/Kontrastwerte, Dark-Mode-Farbskala, exakte Gradient-/Bokeh- und Space-Tint-Parameter sowie belastbare Browser-/Accessibility-Verifikation.
- **Adaptive Density (D-032) beschlossen:** Komfort, Standard, Kompakt mit persistenter Nutzerwahl. Offen bleiben Kartengrößen/Spalten-/Abstand-Tokens, Listenzeilen, Responsive-/Zoom-Parameter, Performance und gegebenenfalls pro-Space-Overrides.
- Fontfamilie, optische Größen-Skala, Spacing-/Radius-Tokens, Icon-Sizes und Strichstärken.
- Exakte Animationstracks/Dauer/Easing, Hover-Verhalten, Shared Element Transition (nach technischer Machbarkeit), Performance-Budgets.
- **Mehrfachauswahl beschlossen als Smart Selection Hybrid (D-022); Sortierung als Smart Sorting Hybrid (D-023).** Offen bleiben Range-/Filter-/Space-Grenzen, Mixed-Type-Sammelaktionen, Koexistenz der Floating Bar mit anderen Controls sowie exakte Drag-/Drop- und Reorder-Regeln. Außerdem offen: detaillierte Regeln der mit D-024 beschlossenen Ordner-/Breadcrumb-/Pin-Navigation, die mit D-025 beschlossene Space-Erstellung inklusive Duplikat-/Fehlermeldungen, Personalisierung, Feinheiten des Living Empty State (D-026) und technische/inhaltliche Suchdetails (D-021).
- **Spatial Capture Handoff (D-027) beschlossen;** konkrete Animationstracks, Undo-/Teilerfolgsmeldungen und fehlgeschlagene Schreibversuche noch detaillieren. Mobile/Tablet-Breakpoints, Browser-Verhalten bei Aufnahme, Offline-Fälle, belastbare Datenpersistenz und Cloud-Synchronisierung; mit dem nun beschlossenen Adaptive Trust System (D-028): lokaler Save, Offline, ausstehende Cloud-Operationen, Konflikte und Fehler werden wahrheitsgemäß getrennt. Recovery Studio (D-029) jetzt beschlossen; offen bleiben konkrete Aufbewahrungs- und Versionsparameter.
- **Adaptive Trust System (D-028) beschlossen;** offen bleiben die technische Realisierbarkeit eines ehrlichen Sync Center, Konfliktversionierung, Offline-Persistenz und Retry-Verhalten, sowie die Architektur/UX-Details des jetzt beschlossenen Recovery Studio (D-029).
- **Recovery Studio (D-029) beschlossen:** Instant Undo, Papierkorb, gezielte Revisionen früherer bearbeitbarer Fassungen. Offen: Aufbewahrungsdauer, Papierkorb-Quota/Endgültiges Löschen, Snapshot-Frequenz, Versionsvergleich und geräteübergreifende konfliktfeste Wiederherstellung.
- **Mobile Experience entschieden (D-030): Adaptive Mobile Dock (C).** Noch offen: exakte Dock-Anordnung, Safe-Area-/Keyboard-Verhalten, Kontextzustände und echte iPhone-/PWA-Tests. **Adaptive Density (D-032) beschlossen:** Komfort/Standard/Kompakt als persistente, bewusst ausgewählte Ansichtsmodi; weiterhin offen: konkrete Stufen-Tokens, responsive Raster- und Listenkonfiguration sowie globale vs. pro-Space-Einstellung.
- KI-Backend/Datenschutz/Transkription, Token- und Kostenmodell, Agenten-Presets und direkte Integrationen.
- Regelwerk für Asset-Verweise im Export bei Bildern/Dateien und Größenlimits.
- **Smart Preferences Hybrid (D-033) beschlossen:** Kontextuelle Quick Preferences und zentrales Settings Studio bedienen ein gemeinsames persistentes Einstellungsmodell. Offene Detailfragen: Speicherreichweite (Device/Account), Defaults und Migration bestehender Einstellungen, Sortierung/Gliederung des Settings Studio, Tastatur-/Mobile-Popoververhalten sowie Sicherheit/Privacy.
- Optionales Floating Capture Dock als separates späteres Feature, nicht Grundlayout.

## 4. Änderungsdisziplin (damit nichts verloren geht)

- Jeder neue Designentscheid bekommt **eine neue Decision-ID**, expliziten Status (*beschlossen*, *vorgemerkt*, *offen*), Datum und gegebenenfalls »ersetzt Entscheidung X«.
- Ein Master-Blueprint pro Revision; Änderungen gegenüber der Vorversion in einem Abschnitt »Changelog« festhalten. Nie heimlich frühere Wünsche umdeuten.
- Keine Optik-Vorgabe in Code umsetzen, bevor der Nutzer Design-Spezifikation und Implementierungs-Run explizit freigibt.
- Vor technischem Agent-Run: Decision-Ledger plus QA-/Datenmigrationsbedingungen als Pflichtlektüre in den Implementierungs-Prompt.

## 5. Nächster Designschritt und Abschlussplanung

**Sprint 24 abgeschlossen: Spatial Capture Handoff (D-027, C).** Nach erfolgreich bestätigtem Speichern werden erfasste Inhalte mit nachvollziehbarer räumlicher Choreografie von Smart Capture an die echte Zielposition im Smart Grid übergeben, begleitet von knappem Save-/Undo-Feedback. Batch-Optimierung, Fehler-/Teilerfolgstransparenz und Reduced Motion sind Pflicht. Keine falsche Speichergarantie.

**Sprint 25 abgeschlossen: Adaptive Trust System (D-028, C).** Ein ruhiger Normalzustand und ein bei Bedarf deutlich sichtbares Sync Center trennen bestätigten lokalen Speichererfolg, Cloud-Bestätigung, Offline-/Pendingzustände, lokale Save-Fehler und Versionskonflikte. Nur technisch nachgewiesene Zustände dürfen als gesichert dargestellt werden.

**Sprint 26 abgeschlossen: Recovery Studio (D-029, C).** Drei abgestufte Schutzebenen: Instant Undo, wiederherstellbarer Papierkorb für Karten/Ordner/Spaces einschließlich zugehöriger Assets und bedarfsorientierter Versionsverlauf für bearbeitbare Markdown-Prompts/Notizen. Speicherstatus, Datenschutz-/Retention-Grenzen, echte Wiederherstellbarkeit und Konfliktfreiheit bleiben technische Freigabebedingungen.

**Sprint 27 abgeschlossen: Adaptive Mobile Dock (D-030, C).** Mobile Navigation ist eigenständig und ergonomisch: Spaces, Suche und Smart Capture bleiben stabil erreichbar; Auswahl-/Recorder-/Editor-Aktionen passen sich kontextbewusst an. Der mobile Dock ist kein Ersatz für den Desktop-Floating-Capture-Dock-Vormerkposten. Safe Areas, virtuelle Tastatur, Drawer-/Sheet-Kollisionen und echte iOS/PWA-Aufnahmelimits bleiben verbindliche QA-Themen.

**Sprint 28 abgeschlossen: Adaptive Atmosphere (D-031, C).** Light/Dark/System sind vollwertige Theme-Modi; Space-Akzentfarben beeinflussen subtil das Ambient Bokeh und kleine Space-Marker, ohne die Lavender-Marke, Lesbarkeit, Sync-/Fehlersemantik oder das 70/30-Materialsystem zu verändern. Farb- und Blur-Tokens sowie Theme-QA bleiben zur Umsetzung offen.

**Sprint 29 abgeschlossen: Adaptive Density (D-032, C).** Drei bewusst wählbare, persistente Modi Komfort/Standard/Kompakt; Smart Grid, Listenansicht, vorhandene Aktionen, Sortierzustand und Accessibility bleiben stabil. Dichte wird nicht willkürlich je Dateityp gewechselt.

**Richtungsphase abgeschlossen:** Alle **33 geplanten Grundsatzentscheidungen D-001 bis D-033** sind getroffen. Neue D-IDs sind nicht als fortlaufende Pflichtumfrage vorgesehen; bei belastbar neuen Grundsatzfragen oder expliziten Nutzeränderungen werden sie nachvollziehbar neu vergeben. Jetzt folgt der **vollständige Design-Konsistenz- und Vollständigkeits-Audit**, dann der detaillierte Design-System-/Motion-/State-/Responsive-/Sicherheits-Blueprint und erst danach die Vorbereitung eines möglichen Implementierungsbriefings. Eine Code- oder Deployment-Freigabe liegt weiterhin nicht vor.

**Sprint 30 abgeschlossen: D-033 – Smart Preferences Hybrid (C).** Kontextuelle Quick Preferences für Sidebar/Dichte/Theme plus Settings Studio für vertiefte Konfiguration auf einer gemeinsamen Preference-Quelle. Sync Center und Recovery Studio bleiben eigenständig. **Nächste Phase:** Blueprint-Konsolidierung, keine weitere Auswahlrunde ohne echte Unklarheit.

**Gedächtnis-/Versionsregel:** Gesprächskontext allein ist nicht ausreichend für langfristig exakte Spezifikation. Dieses versionierte Dokument ist der transportable Designstand; jede künftige D-Entscheidung wird als neue Revision **unter Erhalt aller früheren Entscheidungen und offenen Fragen** ergänzt. Vor Implementierung muss ein vollständiger Konsistenzcheck sicherstellen, dass keine Entscheidung nur als A/B/C-Kürzel festgehalten wurde.

## 6. Konsolidierungs-Preflight nach D-033 (erster, vorläufiger Prüfstand)

**Stand:** 21.10.2026 · **Prüfstatus:** Die 33 Decision-Abschnitte sind formal vorhanden; Richtungsentscheidungen sind gesammelt. Dieser Preflight ist **noch nicht** das endgültige pixelgenaue UX-Audit, keine Codeanalyse und keine Aussage darüber, dass jeder Screen/State bereits spezifiziert wäre.

### 6.1 Verbindliche Integrationslinien für den Haupt-Blueprint

| Cluster | D-IDs | Zu prüfende Wechselwirkungen im Detail |
| --- | --- | --- |
| Sidebar, Spaces, Ordner, Mobile und Settings | D-001, 002, 018, 024, 025, 030, 033 | Hover-Overlay vs. Mobile Drawer; viele Spaces; aktiver Space; Pins; Bottom-Popover und zentraler Preferences-Stand |
| Capture, Sessions, Aufnahme und Erfolgsmeldungen | D-003, 008, 009, 026, 027, 030 | Capture-Bar vs. optionales Dock; Recorder unabhängiger vom Inspector; gesicherte Originale; Save-before-celebrate; Mobile Aufnahmeabbrüche |
| Inspector, Composer, Context Rail und Handoff | D-004, 007, 010, 011 | Gemeinsame Breitenlogik, Fokusmodus, Markdown-Asset-Verweise, Export/ZIP/Audio-Opt-in und mobile Sheet-Kollisionen |
| Grid, Aktionen, Suche, Selektion, Sortierung, Dichte | D-005, 006, 021, 022, 023, 032 | Klick/Kopieren/Öffnen vs. Auswahl, Bulk-Toolbar vs. Mobile Dock, Filter/Range, Grid/List-Reihenfolge, Drag & Drop bei manueller Sortierung |
| Visuelle Identität, Header, Motion und Themes | D-012 bis D-017, D-019, 020, 031 | 70/30 Material ist unabhängig von 80/20 Motion; Ambient ohne harte Kante; Collapsing Header; Space-Tints mit stabiler Lavender-Marke; Reduced Motion |
| Speicher, Sync, Wiederherstellung, Datenschutz, Settings | D-027 bis D-029, D-033 | Lokaler Save vs. Cloud-Ack vs. Offline/Fehler; echte Recovery von Assets/Versionen; sichere destruktive Aktionen; ehrliche Präferenz-Synchronisation |

### 6.2 Technisch/produktseitig offene, nicht heimlich zu entscheidende Punkte

1. **Datenmodell und Migration:** Alt-CopyBoard-Daten/Anhänge einschließlich Speicherkontingenten, schema-sicherem Start, geordneter Migration und gesicherter Datenrückkehr; kritische Bestandsrisiken aus dem Architektur-Audit nicht verdrängen.
2. **Cloud- und Versionssemantik:** Supabase-RLS/Auth, Offline-Queue, idempotentes Retry, echte Bestätigung, Konfliktpolitik, Recovery-Historie und Speicherlimits. Ohne nachweisbaren Persistenzmechanismus keine falschen Cloud-/Restore-Versprechen.
3. **Komponenten-State-Matrix:** Sidebar/Popover, Header-Sticky, Capture-Bearbeitung, Auswahl, Drag & Drop, Inspector/Composer/Context Rail, Recorder und Mobile Dock; welche Flächen schließen, welche offen bleiben, wo Fokus und Scroll-Anker bleiben.
4. **Design-Tokens:** Typografie-Familie/Skala, Squircle-Geometrie, Spacing, Shadow, Blur, Surface-Opacity, Farben inklusive Dark und Space-Tints, Density-Stufen, Icon-Stroke, responsive Breakpoints.
5. **Motion-Storyboard:** Zustandsübergänge, gemeinsame Herkunft/Zielpunkte, Choreografien, Easing, Unterbrechbarkeit, Performance und Reduced Motion; keine Fantasie-Morphs ohne validierten DOM-/Layout-Ansatz.
6. **Reale Plattform-QA:** iPhone Safari/PWA und Mac/Desktop, Clipboard-APIs und Datei-Transfer, Background-Recording-Abbrüche, Drag/Drop, Tastatur, Screenreader, Zoom, mehrere tausend Elemente und Browser-Speichergrenzen.
7. **KI und Handoff-Opt-in:** keine automatische Sendung von sensiblen Aufnahmen oder Dateien; optionaler Agenten-Dienst, Transkription, Kostentransparenz und Export-Paketintegrität.

### 6.3 Vorläufige Widerspruchsprüfung

- **Kein offensichtlicher Grundsatzwiderspruch** zwischen beschlossenen Optionen gefunden. Häufige potenzielle Kollisionsstellen werden im Detail-Blueprint explizit als gemeinsames Interaktionssystem modelliert, statt aus Screenshots zu erraten.
- **Zwei bekannte 70/30- und 80/20-Verhältnisse dürfen nicht verwechselt werden:** Materialität (Soft Elevation/Frosted) vs. Motion (Expressive/Choreography).
- **Optionales Desktop-Floating-Capture-Dock ist vorgemerkt, nicht Baseline.** Mobile Dock (D-030) ist dagegen beschlossene mobile Baseline. Beide teilen Aktionslogik mit Smart Capture (D-003).
- **Kopieren und Kartenklick sind unterschiedliche Aktionen.** Auswahlzustand, Drag-Drop-Handle und Kontextmenü müssen diese Trennung respektieren; genaue Touch-/Keyboard-Routen sind noch zu spezifizieren.
- **D-028 Trust System und D-029 Recovery Studio sind kein Beleg, dass das aktuelle Backend die Anforderungen schon erfüllt.** Das ist ein hartes Implementierungs-/QA-Gate.
- **D-033 führt keine zweite Settings-Datenquelle ein.** Quick Preferences und Settings Studio müssen denselben Zustand präsentieren.

### 6.4 Nächste Artefakte der Konsolidierungsphase (ohne Codeänderungen)

1. **Decision Integrity Audit:** Jede D-001 bis D-033 gegen originalen Gesprächsbeschluss prüfen; Unklarheiten und Änderungshistorie explizit markieren.
2. **Screen Inventory & IA:** Desktop-, Tablet-, Mobile-Screens, Navigationslandkarte und Informationstiefe bis zu Empty-/Error-/Offline-/Conflict-States.
3. **Token & Component Spec:** Design Tokens, Varianten, Hover/Focus/Disabled/Skeleton/Failure, responsives Raster.
4. **Motion & Interaction Blueprint:** Choreografie, Zustandsautomaten, Fokus-/Keyboard-/Touch-Matrix, QA-Akzeptanzkriterien.
5. **Technical Feasibility Gate und Implementierungsbriefing:** Alt-Datenmigration, Sicherheits-/XSS-Audit, Sync-/Recovery-Architektur und überprüfbare Tests. **Erst nach separater ausdrücklicher Freigabe implementieren.**

## 7. Decision Integrity Audit 01 — verifizierter Konsolidierungsstand

**Auditdatum:** 21. Oktober 2026  
**Prüfbericht:** [CopyBoard — Decision Integrity Audit 01](CopyBoard-Decision-Integrity-Audit-01-2026-10-21.md)  
**Status:** Konzept-integrität geprüft; **nicht** Code/Backend/Production verifiziert und **keine Implementierungsfreigabe**.

### 7.1 Ergebnis und dokumentierte Provenienz

- Alle **17 Masterplan-Versionen v0.17–v0.33** haben lückenlose, eindeutige fortlaufende D-IDs bis zu ihrem jeweiligen Stand; im aktuellen Snapshot sind **D-001 bis D-033 vollständig** vorhanden.
- Erstausgabe-vs.-v0.33-Textvergleich: **Nur D-019 und D-027 wurden inhaltlich nachträglich präzisiert**, um später beschlossene Entscheidungen D-020 und D-028 korrekt zu verlinken. **Keine frühere Richtungsentscheidung still ersetzt.**
- D-012 = **B Soft Studio mit C Precision**; D-013 = **B Lavender Bokeh**; D-015 = **B Soft Elevation + C Frosted ca. 70/30**; D-017 = **C Expressive 80 % + B Choreography 20 %**; D-025 = **B Studio Space Sheet mit A-Geschwindigkeit**. Diese gemischten Richtungen sind ausdrücklich zu erhalten.
- **Kein unvereinbarer Grundsatzwiderspruch** festgestellt; allerdings **offene Primäraktions-Semantik** bei Ordnerkarten, Überlagerungs-/Keyboard-Kollisionen und unbelegte technische Sicherheits-/Storage-Claims. D-001 bis D-033 bleiben ohne Änderung beschlossen.

### 7.2 Vor Implementierung zwingend klären (P0)

1. **P0-01:** belastbare lokale Persistenz und getrennte Cloud-Bestätigung vor Save-/Sync-Erfolgsmeldung (D-025 bis D-029).
2. **P0-02:** einheitliches, konfliktfestes Revisions-/Ownership-/Trash-/Restore- und manuelles Sortiermodell (D-023/D-028/D-029).
3. **P0-03:** Migration ohne Alt-Datenverlust, XSS-/Auth-/RLS-Absicherung und reale Browser-/Supabase-QA.
4. **P0-04:** Recorder-Unterbrechung und Originale-Save bevor automatische Composer-Öffnung Erfolg anzeigt (D-008/D-009).
5. **P0-05:** kontextgerechtes Paste-Routing, portable Assets im Handoff und explizite Weitergabe statt stiller Drittanbieter-Uploads (D-003/D-007/D-011).

### 7.3 Noch offene Interaktionsverträge (P1)

- **P1-01: Ordnerkarten:** D-004s Klick-öffnet-Inspector und D-024s Ordner-Klick-navigiert haben unterschiedliche Primärsemantik. Erst nach bewusster Freigabe festlegen; vorläufiger Vorschlag: Ordner öffnet Ordner, Details per Menü/Info.
- **P1-02:** Inspector, Composer-Fokus und Context Rail zu einem eindeutig navigierbaren View-State zusammenführen.
- **P1-03:** Click/Copy/Select/Drag/Reorder/Move einschließlich Grid/List, Touch, Filter und Tastatur lückenlos trennen.
- **P1-04:** Mobile Dock, Floating Recorder, Auswahl-Bar und optionales Desktop-Dock in einer Layer-Priorität organisieren.
- **P1-05:** Sticky Header/Smart Capture/Suche/Sync bei Scroll, Editor-Fokus und Restore ohne Remount/Fokusverlust.
- **P1-06:** Command-Shortcuts, Editor-Shortcuts, Escape und Selection-Scope definieren.
- **P1-07:** Für jede Preference Device-/Konto-/Space-Scope, Default und persistente Quelle festlegen.
- **P1-08:** Legacy Feature Parity (u. a. OCR, Bildbearbeitung, PIN, Backup, Import, Duplikate) gegen den bestehenden Funktionsinventar-Audit nachweisen.
- **P1-09:** Such-Empty-State, Loading/Error/Offline und hohe Kartenmengen/Virtualisierung unterscheiden.
- **P1-10:** Ordner-/Space-Moves, gepinnte Verweise, Restore und Referenzen ohne Zyklen oder verwaiste Assets gewährleisten.

### 7.4 Konsequenz für die nächsten Phasen

**Nächster Arbeitsschritt:** IA & Screen Inventory mit expliziter State-/Routen-/Modal-/Drawer-Matrix; danach Interaction Contract, Design Tokens/Motion und technischer Security-/Feature-Parity-Gate. **Keine neuen Grundsatzoptionen erzwingen**, aber echte widersprüchliche oder nicht autorisierte Produktentscheidungen dem Nutzer transparent zur Freigabe vorlegen. Ein Coding-Prompt ohne diese Gates wäre verfrüht.

**Provenienzschutz:** Der vollständige Decision Integrity Audit ist als separates, gleichnamiges Begleitdokument versioniert. **Das Masterplan-D-001–D-033-Ledger bleibt unverändert; keine Implementierung, kein Branch, kein Deployment.**

## 8. Screen Inventory & Information Architecture Blueprint 02 — Konsolidierungsphase

**Ausarbeitung:** 21. Oktober 2026  
**Begleitdokument:** [CopyBoard — Screen Inventory & Information Architecture Blueprint 02](CopyBoard-Screen-Inventory-IA-Blueprint-02-2026-10-21.md)  
**Status:** IA/Interaction-Mapping ausgearbeitet; noch keine technische Verifikation und keine Implementierungsfreigabe.

### 8.1 Beibehaltene Entscheidungen und Dokumentationsregeln

- **D-001 bis D-033 bleiben im vorstehenden Ledger unverändert.** D-002 Hover-Sidebar/3 Modi; D-003 Smart Capture; D-004 Inspector/Fokus; D-007 Composer; D-008 Recorder; D-010 Context Rail; D-018 Spaces First; D-019/020 Ambient/Collapse; D-030 Mobile Dock; D-033 gemeinsame Preferences bleiben Teil **einer** Shell.
- **Designverhältnisse bleiben eigenständig:** Material D-015 = 70 % Soft Elevation / 30 % Frosted; Motion D-017 = 80 % Expressive / 20 % Choreography. Space-Tints D-031 verändern vor allem Ambient, nicht Statusfarben.
- IA-Screens sind technische-/konzeptionelle Inventar-IDs (`SC-01..SC-28`), **keine neuen Nutzerentscheidungen D-034 ff.** Neue Detailregeln werden als beschlossen/abgeleitet/Vorschlag/Human-/Technical-Gate unterschieden.

### 8.2 Hauptresultate

1. **28 Screen- und View-Kontexte** von Shell/Spaces bis Handoff, Sync, Recovery und Legacy-Parity inventarisiert; inkl. Mobile/Tablet und Loading, Empty, No-Results, Offline, Save-Failure, Conflict.
2. **Layer- und Ownership-Modell:** Board, Inspector, Composer/Context Rail, Recorder, Mobile Dock, Command Palette, Modals und Trust-Hinweise jeweils mit eindeutiger Verantwortung. Kein zweiter Capture-Store, kein doppelt konkurrierender rechter Inspector, Recorder nicht als flüchtiges Modal.
3. **Interaktionsarchitektur:** Input-Routing, Selection/Drag/Sort, Breadcrumbs, Fokus/Back/Escape, Sticky Header, Pref-Scopes und Export-/Save-Semantik als Prüfverträge dargestellt.
4. **20 Integrationstest-Szenarien** formuliert; zusätzlich bleiben alle fünf P0-Sicherheits-/Data-Gates und zehn P1-Auditthemen aus Decision Integrity Audit 01 verbindlich.

### 8.3 Offene Freigaben (nicht stillschweigend beschlossen)

- **H-01:** Ordnerkarte öffnen oder zuerst Inspector? **Vorschlag** direkte Ordnernavigation, Informationen per Menü; Nutzerfreigabe ausstehend.
- **H-02:** Finale Escape-/History- und `Cmd/Ctrl+K`-Priorität im Composer; muss im Interaction Blueprint konkretisiert/abgenommen werden.
- **H-03:** Preference-Scopes, belastbare Persistenz/Revisionen, Mobile-Recording und echte Alt-Datenmigration technisch zu beweisen, bevor Success/Cloud-/Recovery-Claims implementiert werden.

### 8.4 Nächster Schritt

`Interaction Contract & Motion State Machines 03` mit abschließender State-/Fokus-/Overlay-Matrix und Storyboards, anschließend Design Tokens/Component-Blueprint sowie separat technischer Sicherheits-/Migration-/Feature-Parity-Gate. **Keine Code-, Branch- oder Production-Änderung.**

## 9. Interaction Contract & Motion State Machines Blueprint 03 — Konsolidierungsphase

**Stand:** 21. Oktober 2026  
**Spezifikation:** [CopyBoard — Interaction Contract & Motion State Machines 03](CopyBoard-Interaction-Motion-Blueprint-03-2026-10-21.md)  
**Status:** konzeptioneller Interaction-/Motion-Vertrag **mit markierten Vorschlägen und Human-/Technical-Gates**; weder Implementierung noch verifizierte Browser-QA.

### 9.1 Was nun systematisch spezifiziert ist

- Zehn ausdrücklich textuell prüfbare Invarianten `INV-01..INV-10` zum Zustandseigentum, Datenschutz, Rev-Sicherheit, Recorder-Lifecycle, Fokus und Sichtbarkeit.
- Elf fachliche State Machines `SM-01..SM-11`: Navigation/Composer, Capture/Spatial Handoff, Mehrfachauswahl/Drag, Recorder, Persistenz/Cloud, Recovery, Suche, Preferences, Empty State, Ambient Header sowie Adaptive Mobile Dock.
- Getrennte visuelle Layer- und Eingabe-/Fokuspriorität; deterministische `Escape`-/Back-Policies, Keyboard-/Touch-Aktionszuordnung und Schnellklick-Interruptions.
- Zwölf Motion-Storyboards `M-01..M-12` samt vorgeschlagenen Timing-Bereichen, Expressive-80/Soft-20-Grundlinie, Fallbacks für offscreen Targets/Virtualisierung und Reduced Motion.
- **36 noch auszuführende QA-Szenarien** `IM-QA-01..IM-QA-36` inkl. Save/Cloud ACK, Konflikt, Session-Unterbrechung, Batch-Handoff, Fokus und Layout-Performance.

### 9.2 Status- und Freigabegrenzen

**D-001..D-033 bleiben unverändert.** Die Bewegungszeiten und genauen Escape-/Keyboard-Regeln sind *spezifikationsreife Vorschläge*, nicht rückwirkend gewählte UI-Alternativen. Weiter ausdrücklich offen: `H-01` Ordnerkarten-Klick; `H-02` globale Palette vs. Composer-Shortcuts; `H-03` Preference-Scopes; ergänzend `H-04` Gruppen-Drag und `H-05` Recovery-Aufbewahrung. Die technischen Gates `T-01..T-05` und **sämtliche** P0-Gates aus Audit 01 bleiben unbewiesen. Die Quellenlage reicht ausdrücklich **nicht**, um erfolgreiche Cloud-Sicherung, Recovery oder Mobile-Recording im bestehenden Code zu behaupten.

### 9.3 Nächster Schritt

**Consolidation Phase 04:** Design System & Component States (Farb-/Typo-/Material-/Squircle-/Density-Tokens; States und Responsive; visuelle Motion-Kalibrierung), danach technische Machbarkeit, Security, Feature-Parity, Migration und testbares agententaugliches Implementierungsbriefing. **Keine Repository-Änderung/Implementierungsfreigabe.**


## 10. Design System & Component States Blueprint 04 — Konsolidierungsphase

**Stand:** 21. Oktober 2026  
**Begleitdokument:** [CopyBoard — Design System & Component States Blueprint 04](CopyBoard-Design-System-Component-States-Blueprint-04-2026-10-21.md)  
**Status:** Designsystem-Kandidaten dokumentiert, jedoch **keine Pixel-/Farbtoken-Freigabe und keine Implementierungsfreigabe**.

### 10.1 Beschlossene Designidentität unverändert

- **D-012–D-016:** Soft Studio mit Precision, Mist/Lavender und mehrteiligen Violet-Bokeh-Lichtflächen, Soft Squircle, Soft Elevation / Frosted ca. 70/30, Soft Editorial Typografie.
- **D-017:** Expressive Motion ca. 80/20 als Gestaltungscharakter, nicht messbare Dauerquote.
- **D-019/020/031:** Ambient Canvas ohne umrahmte Header-Kante, weich kollabierend, mit Light/Dark/System und dezenter Space-Tint; semantische Statusfarben bleiben unabhängig.
- **D-027/028/029:** Save-before-celebrate, lokale Sicherung strikt von Cloud-ACK getrennt, Recovery ohne stillen Datenverlust.
- **D-030/032/033:** mobiles Adaptive Dock, Komfort/Standard/Kompakt und ein gemeinsamer Preference-Zustand für Quick-/Studio-Einstellungen.

### 10.2 Spezifikationsergebnis

- Vorgeschlagenes mehrstufiges Token-System aus Primitives, semantischen Theme-Tokens, Material, Components, Motion und Platform/Responsive.
- Kandidatenpaletten für **Light und Dark**, Bokeh/Space-Tint-Regeln, Grundkontrast-Messungen für ausgewählte Text-/Accentpaare; kein vollständiger WCAG- oder Live-Browser-Nachweis.
- Konkrete Vorschlags-Skalen für Spacing, Squircle-Radien, Typography, Icon-Größen, Elevation/Frosted Opacity/Blur, Density sowie responsive Varianten. **Kein vorgeschlagener Zahlenwert ist durch diesen Anhang automatisch zum Beschluss geworden.**
- **40 Komponentenfamilien `DS-C01..DS-C40`**, einschließlich Shell, Sidebar, Capture, Grid/List, Selection, Composer, Recorder, Handoff, Trust, Recovery, Mobile Dock und Parity-Utilities, mit zugeordneten Screen-IDs.
- Universale State-Taxonomie inkl. `focus-visible`, `selected`, `pending`, `offline`, `conflict`, `dirty`, `interrupted` und `reduced-motion`, inklusive getrenntem Cloud-/Local-Feedback.
- Motion-Crosswalk zu bestehenden zwölf `M-01..M-12`; keine neuen Grundsatz-Sprints durch rein technische Systematisierung.
- **32 spätere DS-QA-Szenarien**, zusätzlich zu den bisher definierten **36 IM-QA-Szenarien**, noch nicht ausgeführt.

### 10.3 Offene Freigaben — nicht stillschweigend schließen

- Bestehende `H-01..H-05` und `T-01..T-05` bleiben offen; besonders Folder-Click-Primäraktion, Shortcut-Policy, Preference-Scopes, Retention und belastbare lokale/Cloud-Speicherung.
- Zusätzlich `DS-TOKEN-01..03`: echte Render-/A11y-Kontrasttests der Kandidaten, Frosted-/GPU-Fallbacks und visuelle Motion-Kalibrierung mit realen Geräten.
- Die tatsächliche Implementierbarkeit sämtlicher Legacy-Funktionen (u. a. OCR, PIN, Backup, Bildwerkzeuge, Import/Export) wurde **nicht** geprüft oder zugesichert.

### 10.4 Nächster Schritt

**Consolidation Phase 05:** technische Machbarkeit, Security, Legacy-Feature-Parity, Datenmodell, Migration, Sync/Recovery, PWA-/Recorder-Grenzen und QA-Gates auf Basis der bestehenden Architektur. Für GitHub/Live-Anwendung weiterhin **keine Code-, Branch- oder Deployment-Freigabe**.


## 11. Technical Feasibility & Feature Parity Blueprint 05 — Konsolidierungsphase

**Stand:** 21. Oktober 2026  
**Begleitdokument:** [CopyBoard — Technical Feasibility & Feature Parity Blueprint 05](CopyBoard-Technical-Feasibility-Feature-Parity-Blueprint-05-2026-10-21.md)  
**Status:** Read-only GitHub- und Audit-Abgleich; **NO-GO für einen sofortigen ungeschützten Full-Redesign-Implementierungsrun**; keine Repo-/DB-/Live-Mutation.

### 11.1 Verifizierte Quellenlage

- `main` und `develop` von `AlexanderTheMacedon/CopyBoard` zeigen derzeit beide SHA `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` (statisches HTML/CSS/ES-Module-System, kein Buildschritt). Der dokumentierte technische Baseline-Audit befindet sich auf Branch `audit/copyboard-technical-baseline-run-01` SHA `33600a1c5d5c9c842ff84585e429796f0dff7c3e` und **nicht** als Code-Fix auf `main`.
- Einzelne kritische Runtime-Ausschnitte (`loadPersistedState`, `flushPersistedState`, `cloudApplySnapshot`, dokumentweiter Paste-Listener, Preimport-Recovery-Slot) wurden read-only mit GitHub eingesehen. Weitere Browser-/Defektzahlen stammen aus dem vorliegenden Audit, **nicht** aus heute neu gestarteten Tests.
- Auditbericht meldet **27 Defekte** (1 Critical, 10 High, 15 Medium, 1 Low) aus **58 Browser-Szenarien** (22 voll bestanden), darunter I-35/I-36 Datenverlust, I-31/I-32/I-33b Stored XSS, I-02 Paste-Privacy und I-C03/I-C05 Sync/Draft-Konflikte. Diese Resultate sind Audit-Evidenz, kein Live-Deploy-Beweis.
- Echte Supabase-Backend-Policies/RPC/Realtime, iOS-/Safari-/Firefox-Geräteverhalten und aktuelles Production-Deployment bleiben **unverifiziert**.

### 11.2 Technische Blocker — vor jeder größeren Umsetzung

1. **G-01/G-02:** Datenverlust-Schutz für unlesbare/future-schema Boards, Quota-Failure und wahrheitsgemäße Local-Save-ACKs. Bestands-JSON niemals aus Default-Pfad überschreiben. Option IndexedDB/Blob-Migration **nicht** automatisch beschlossen.
2. **G-03/G-04:** Stored XSS, importierte Farben/URLs, Clipboard-Privacy und Drittanbieter-Skripte absichern. Öffentlicher Supabase-Publishable-Key ist **kein** nachgewiesener Secret-Leak.
3. **G-05:** RLS-/Storage-/RPC-Review sowie konflikt- und editor-sichere Revisionen, Accountwechsel und wahrheitsgemäße Cloud-ACKs.
4. **G-06:** Regression- und Feature-Parity-Suite auf Basis des vorhandenen Audit-Harness inkl. sicherer PIN-/Backup-/Importfixtures, Geräten, A11y und Rollback.
5. **Alle P0-01..P0-05** aus Decision Integrity Audit 01 behalten Gültigkeit; `G-01..G-06` ordnen sie dem aktuellen Code- und Testbestand zu, ohne sie zu ersetzen.

### 11.3 Erhaltenswerte Bestandsverträge und technische Folgeplanung

- **58 Positionen** `FP-01..FP-58` im Parity-Crosswalk: Capture, Spaces/Folder, Sort/Pins, Suche/Palette, Favoriten/Recent, Multi-Select, Inline-Edit, Bildbearbeitung, Voice, OCR, Farbpalette, PIN, Burn Link, Undo/Redo, temporäres Speichern, Backup/Import, Sticky Notes, Account und Supabase-Sync sowie neue Designerlebnisse D-001..033.
- Alte Formate `copyboard_state_v1`, `copyboard-backup`, `copyboard-space`, `copyboard-settings`, Legacy V16–V22 und **bestehende PIN-Ciphertexte** sind als Lesbarkeits-/Migrationsverträge notiert. Neue Hierarchie, Assets, Tombstones und Revisionen bedürfen prüfbarem Rollback.
- Vorgeschlagener Run-Plan `R00..R09`: Baseline → gesondert autorisierte Data-Loss-Guards → Security/Privacy → Testnetz → Migration-PoC → Backend/Sync/Recovery → Shell/UI/Composer/Mobile → QA/Release. **Alle Runs sind nur geplant, keiner ausgeführt.**
- `TF-QA-01..TF-QA-36`: separate **künftige** Technical QA, nicht mit 58 historischen Audit-Szenarien oder anderen Blueprint-Testmengen zu summieren.

### 11.4 Freigaben und Nächster Schritt

- Human Gates `H-01..H-05` bestehen fort; ergänzt `H-06` Burn-Link-Semantik, `H-07` ESM vs. React/TypeScript/Vite nach Stabilisierung, `H-08` Accountwechsel-/Merge-UX. Keine davon im Rahmen der Konzeptarbeit stillschweigend beschlossen.
- Technical Gates `T-01..T-05` bleiben offen, inklusive realer Backend- und Mobilverifikation. „Cloud synchronisiert“, „Recovery sicher“ und „Aufnahme läuft im Hintergrund“ dürfen nicht ohne nachgewiesenen Runtime-Vertrag behauptet werden.
- **Nächster Schritt (Phase 06):** Implementation Readiness & Agent Runbook: versionierte read-only Implementierungsabfolge, Human Gates, Testdefinitionen, Prompt-Pakete, Stop-/Rollback-Kriterien. Für echte Fixes und Repositoryänderungen ist eine **separate ausdrückliche Nutzerfreigabe** erforderlich.

## 12. Implementation Readiness & Agent Runbook 06 — Konsolidierungsphase

**Stand:** 21. Oktober 2026  
**Begleitdokument:** [CopyBoard — Implementation Readiness & Agent Runbook 06](CopyBoard-Implementation-Readiness-Agent-Runbook-06-2026-10-21.md)  
**Status:** **RUNBOOK READY / IMPLEMENTATION NOT AUTHORIZED** — alle nachfolgenden Runs sind **geplant, keiner gestartet**, kein Branch/Commit/DB-/Live-Write.

### 12.1 Ergebnis: sichere Reihenfolge statt monolithischem Coding-Run

- Die 33 verbindlichen Produkt-/Designrichtungen **D-001 bis D-033** bleiben die unveränderte Zieloberfläche und werden durch Phase 06 nicht neu entschieden; konkrete Pixel-/Timing-Token bleiben zum Teil Kandidaten.
- Repository-Baseline `main`/`develop` zuletzt read-only `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3`; ursprünglicher Audit-Branch `audit/copyboard-technical-baseline-run-01` zuletzt `33600a1c5d5c9c842ff84585e429796f0dff7c3e`. Vor der tatsächlichen Ausführung stets frische Branch-/SHA- und Dirty-State-Prüfung; die historische SHAs sind **keine** Aufforderung, refs auf diese Werte zurückzustellen.
- **Run-Strategie R00–R09** (entspricht Phase 05): `R00` reiner Baseline-/Backup-Preflight → `R01` schreibgeschützter/robuster Local Load/Save-Guard → `R02` XSS/Paste/Privacy → `R03` Test-/CI-Gate → `R04` Storage-/Migration-Prototyp → `R05` RLS/Sync/Recovery-Backend-Read-Audit und Architektur → `R06` App-Shell/Designsystem-Vertical-Slice → `R07` Composer/Recorder/Handoff → `R08` Trust/Recovery/Mobile → `R09` Staging/QA/Release-Vorbereitung. **R04/R05 sind keine automatisch freigegebenen Live-Migrationen.**
- Jeder **schreibende** Run verlangt eine eigene ausdrückliche Freigabe und einen vom aktuellen `origin/develop` abgeleiteten, getrennten Branch/PR. Kein ungefragtes Merge, kein `main`-Push, kein Force-Push, kein Deploy. Production hat einen **eigenen Release-Gate**.
- Komplette **Copy-Paste-Agentenbriefings R00–R09** samt globalem Scope-Vertrag, Modell-/Reviewer-Rollen, Stop-Kriterien, `CUTLER`-Übergabe, Test-/Rollback-Verträgen im Begleitdokument.

### 12.2 Verbindlicher Prioritätskonflikt: Design-Reife ≠ Data-/Security-Reife

**Design und Interaktionen:** durch D-001..D-033, IA-02, Motion-03 und DS-04 hinreichend spezifiziert für einen isolierten UI-Vertical-Slice. **Aktuelle Daten-/Security- und Sync-Basis:** **nicht** sicher als Ausgangspunkt für einen großen, produktionsnahen UI-Rewrite. Phase 05 belegt G-01..G-06; Runbook 06 behandelt die notwendigen Fix-/Backend-/Parity-Gates als **vorherige, separat genehmigte Arbeit**.

1. **R01 vor dem Full Redesign:** keine stillen Default-Überschreibungen bei korruptem/neuerem lokalen State; Quota-Failure bedeutet sichtbaren Unsaved-State statt Save-Erfolg.
2. **R02 vor dem Full Redesign:** Stored-XSS- und importierte URL/Farb-Pfade absichern, globales Paste bei Editoren/Secret-Feldern unterdrücken.
3. **R03 vor dem Full Redesign:** den historischen Audit-Harness in pflegbare, isolierte Regressionstests/CI überführen. Alte Ergebnisse sind **historisch**, neue PASS brauchen konkrete Ausführung.
4. **Storage-/Cloud-Neuarchitektur separat:** `IndexedDB`/Blob-Migration, Supabase-RLS/RPC-/Storage-Review, Sync-Konflikte, PIN-Ciphertext-/Backup-Kompatibilität, Recovery, Tombstones und Daten-Rollback müssen nachweisbar sein; das neue UI erzeugt diesen Nachweis nicht von allein.
5. **Frontend-Technologie H-07 offen:** kein automatisch beschlossener Wechsel auf React/TypeScript/Vite; gezielter Vergleich/PoC nach Stabilisierung.

### 12.3 Human Gates bleiben offen, Agenten dürfen sie nicht entscheiden

- **H-01:** Ordnerkarten-Primärklick Öffnen vs. Inspector (Vorschlag: direkt öffnen + Info-Aktion).
- **H-02:** Editor-/Palette-/Escape-/Back-Shortcuts.
- **H-03:** Settings-Scope pro Gerät/Space/Board/Account und Migration.
- **H-04:** Bulk Drag vs. Bulk Move, Folder-Zyklen und Reihenfolge.
- **H-05:** Trash-/Versionen-Retention, Löschung, Assets und Datenschutz.
- **H-06:** Burn-Link als ehrlich benannter teilbarer Link vs. echte serverseitige Einmalfreigabe.
- **H-07:** Frontend-Stack anhand eines separaten Vertical-Slice-Vergleichs.
- **H-08:** Konto-Wechsel/Merge, Isolierung lokaler Bestandsdaten.

**Technische Gates:** T-01 Datenintegrität, T-02 RLS/Sync, T-03 XSS/PIN/Paste, T-04 Safari/iOS/PWA/Recorder, T-05 Regression/Parity/Rollback und G-01..G-06 aus Phase 05. Werden Quellen nicht gelesen oder Tests nicht ausgeführt, bleiben sie ausdrücklich **UNVERIFIED/SKIP**.

### 12.4 Agenten-, Test- und Rollback-Kontrakt

- Opus High für Architektur, Daten-/Security-/Migrationsreviews; Sonnet High für eng geschnittene Feature-/Test-Runs; unabhängiger zweiter Reviewer z. B. GPT-6 High. **Die Test-/Evidence-Gates, nicht der Modellname, entscheiden.**
- Jeder Run meldet echte HEADs, Dateipfade, Branch/Dirty-Status, ausgeführte Testkommandos, `PASS/FAIL/SKIP` mit Gründen, Legacy-Parity, offene Human-/Technical-Gates und Rückfallplan. Form des Abschlusses: `CUTLER — CopyBoard Run Rxx`.
- Echte User-Browserdaten, Token/Keys, geschützte Notizen und Supabase-Daten dürfen weder für Testfixtures extrahiert noch in Logs/Prompts veröffentlicht werden. Produktive Cloud-Mutationen ohne gesonderte Freigabe sind untersagt.
- Ein Code-Rollback ersetzt **keinen** Daten-/Asset-/Backend-Rollback. Für Migrationsruns ist ein getesteter Read-Only-/Backup-/Rollbackpfad zwingend, bevor bestehende Daten transformiert werden.
- Audit-58, IA-20, Motion-36, DS-32, Technical-36 sind sich teilweise überschneidende historische bzw. künftige Testkataloge; ihre Zahlen ergeben **keine Gesamtquote**.

### 12.5 Abschluss des Designkonsolidierungszyklus — Empfehlung und nächste Nutzerfreigabe

**Phase 01–06 der konzeptionellen Konsolidierung abgeschlossen.** Die vorhandenen Dateien ergeben ein schlüssiges, agententaugliches **Planungspaket**, aber **keine implementierte, getestete oder produktionsbereite App**. Empfohlene nächste **separate Freigabe:** erst `R00` zum Read-only-Baseline-/Backup-Preflight; danach, nur ausdrücklich gewünscht, `R01` als enger P0-Data-Loss-Stabilisierungslauf. Keine implizite Zustimmung durch dieses Dokument; kein Branch, Commit, PR, SQL, Hostingänderung oder Deployment.


## 13. Verbindliche Architekturentscheidung — React + TypeScript (H-07 geschlossen)

**Beschlussdatum:** 21. Oktober 2026 · **Entscheider:** Nutzer · **Status:** ARCHITEKTUR-FREEZE (Zielstack), **keine Implementierungsfreigabe**  
**Primärdokument:** [ADR-007 — React + TypeScript Target](CopyBoard-ADR-007-React-TypeScript-Target-2026-10-21.md)  
**Aktualisiertes Agentenhandbuch:** [Runbook 06 v1.1](CopyBoard-Implementation-Readiness-Agent-Runbook-06-v1.1-2026-10-21.md)

### 13.1 Was ausdrücklich beschlossen wurde

- **React + TypeScript ist verbindlich der künftige App-Stack.** Die Frage ESM versus React wurde durch den Nutzer entschieden und wird nicht erneut als offene Alternative präsentiert. **H-07 ist mit Beschluss „React + TypeScript“ geschlossen.**
- **Vite wird als bevorzugtes Build- und Entwicklungswerkzeug vorgesehen**, vor der späteren Einrichtung im Migrations-/Build-PoC auf Hosting-/Build- und Testkompatibilität zu verifizieren. Vite ist hier eine Architektur-Empfehlung, nicht mit der Nutzerentscheidung über React/TypeScript gleichzusetzen. Weder Router noch State-Library, CSS-Framework, UI-Kit oder Dependency-Versionen sind freigegeben.
- Das Ziel ist **eine einzige React-/TypeScript-Produktoberfläche** für Desktop, Tablet und iPhone; keine ungewollt fortgeführte zweite Legacy-UI. Legacy darf als kontrollierter Migrations-/Rollbackpfad bestehen bleiben, bis der Ersatz abgenommen ist.
- Die Produkt- und Designentscheidungen **D-001 bis D-033 bleiben unverändert maßgeblich**; die neue Technologie ersetzt weder Feature-Parity noch die Cloud-/Security-/Recovery-Gates.

### 13.2 Konsequenzen für R00–R09

1. **R00 unverändert READ-ONLY**, aber zusätzlich mit einer typisierten React-Zielarchitektur und Migrationsstrategie; der Agent soll React versus Vanilla JavaScript nicht neu entscheiden. R00 arbeitet ausschließlich mit Repository-/Audit-Lesezugriff und synthetischen Beispielen, ändert **keine Dateien**.
2. **R01 und R02 bleiben gezielte Legacy-ESM-Sicherheitsfixes**, ohne React-Refactor. Denn bestehende Nutzer dürfen bis zur späteren Ablösung keinen Daten- oder XSS-Risiken ausgesetzt werden.
3. **R03** übernimmt das Altbestands-QA-Harness, definiert Tests für Legacy-Kompatibilität und bildet die Basis für spätere React-Parität.
4. **R04** prüft IndexedDB-/Blob-Store, Schema-Kompatibilität und typisierte Legacy-Adapter unter React + TypeScript; keine Migration produktiver Nutzerdaten.
5. **R05** prüft Backend/Sync/Recovery; Frontend-Neuaufbau rechtfertigt **keine** Annahme sicherer oder bereits vorhandener Supabase-Policies.
6. **R06** realisiert erst nach separater Schreibfreigabe einen React-/TypeScript-App-Shell-Vertical-Slice (Vite vorzugsweise nach PoC), zunächst mit synthetischen Daten und Adaptergrenzen, **nicht** als versteckten Komplett-Rewrite.
7. **R07–R09** bauen auf geprüfter Parität, echten Save-/Cloud-ACKs, Sicherheits-Gates, Accessibility und Browserhardware auf. Staging/Production bleiben jeweils separat freizugeben.

### 13.3 Technischer Zielzuschnitt (Vorschlag, keine automatische Freigabe)

`src/app` (Shell/Routing), `src/features` (Spaces, Capture, Grid, Inspector, Composer, Recorder, Trust, Recovery, Settings), `src/domain` (typisierte Entities/Mutation-/Undo-Verträge), `src/data` (Legacy-Reader, Migration, IndexedDB/Blob, Export), `src/integrations` (Supabase, Browser-APIs), `src/design-system` (Tokens/Primitives/States), `tests` (Unit/Integration/E2E). Die genaue Ordnerstruktur ist vom späteren Coding-Agenten zu begründen, bevor sie implementiert wird. React-Komponenten dürfen weder direkte Cloud-Snapshots manipulieren noch lokale Saves als Cloud-Synchronisierung deklarieren.

**Nicht verhandelbar:** `copyboard_state_v1`, historische JSON-Backup-Formate, PIN-AES-GCM/PBKDF2-Ciphertexte und bestehende Space-/Item-IDs müssen korrekt lesbar oder verlustfrei/idempotent migrierbar bleiben; keine stillschweigende Default-Überschreibung, keine XSS-Übernahme, keine ungefragten produktiven Datenzugriffe. Bestehende Legacy-Features einschließlich OCR, ZIP, Bildoperationen, Import, Undo und Offline müssen erhalten oder ausdrücklich als geplante Ausnahme abgenommen werden.

### 13.4 Status der übrigen Gates

**H-07: CLOSED / DECIDED — React + TypeScript.** H-01..H-06 und H-08 bleiben offen; die technischen T-01..T-05 und G-01..G-06 weiterhin offen bzw. zu beweisen. Konkrete Library-/Toolchain-Auswahl innerhalb des Stacks wird nach Read-only-Analyse und PoC in getrennt freizugebenden Runs getroffen.

**Erster Auftrag:** [R00 Read-only Safety & React Migration Preflight](CopyBoard-R00-ReadOnly-Preflight-Prompt-2026-10-21.md). Dies ist ein Copy-Paste-Prompt zur **externen** Ausführung, keine automatisch gestartete oder autorisierte Repo-Mutation.

**Vorrang-/Historienregel:** Früher in §11–12 oder im ursprünglichen Runbook formulierte Aussagen „H-07 offen“, „Stackwahl offen“ und „ESM vs. React noch zu entscheiden“ beschreiben ihren damaligen Versionsstand und sind **ab v0.40 durch §13 explizit überholt**. Frühere Beschlüsse D-001..D-033, alle Sicherheitsgates und die R00–R09-Sequenz sind dadurch nicht aufgehoben.

## 14. CUTLER R00 — akzeptierter Bericht, neue P0-Evidenz und Run-Plan-Präzisierung

**Bericht vom 21. Oktober 2026:** [CUTLER R00 – Safety & React Migration Preflight](CopyBoard%20R00%20%E2%80%94%20Safety%20%26%20React%20Migration%20Preflight%20%28CUTLER%20R00%29.md) (vom Nutzer übergeben).  
**Begleitreviews:** [R00 Review & R01 Triage](CopyBoard-R00-Review-and-R01-Triage-2026-10-21.md); [R01 Prompt](CopyBoard-R01-Data-Loss-Guards-Prompt-2026-10-21.md).  
**Status:** R00 im fremden Agenten-Workspace read-only abgeschlossen. **R01 vorbereitet, noch nicht gestartet oder durch dieses Dokument freigegeben.**

### 14.1 Neues Security-/Data-Delta gegenüber v0.40

- **P0-N3/N3b:** Überschrittener Cloud-Snapshot mit fehlgeschlagenem lokalem Write kann im isolierten, synthetischen **Mock-Backend** schließlich zu einem leeren hochgeladenen Board führen; das vorherige Bucketobjekt wurde im Mock gelöscht. **Reale Supabase-Storage-Policies und echte Delete-Ausführung: UNVERIFIED.** Die frühere allgemeine Sync-Warnung hat nun einen konkreten, vor R01 zu testenden Failure-Case.
- **P0-I-35:** Überschreibung unlesbarer/neuerer gespeicherter Zustände weiterhin reproduziert.
- **P1-I-36/N4/N8:** realistische Quota-Fehler, fortgesetzte Importe ohne tatsächlich vorhandene Recovery-Kopie, gegenseitige Schreibverluste über zwei Tabs.
- **P1-N1/N2/N5a und P2-N5b:** Passwort-Paste, gescheiterte PIN-Verschlüsselung großer Dateien und klartextige bzw. verlorene PIN-Edits müssen R02 negativ testen.
- R00 berichtet **11 PASS, 24 FAIL, 1 Beobachtung** über 36 Prüfungen und **acht UNVERIFIED-Bereiche**. Die Mehrzahl der FAIL reproduziert bekannte Sicherheitsabweichungen, nicht 24 neue Produktdefekte.
- Der R00-Agent konnte **D-001 bis D-033 nicht lesen**. Diese sind in diesem lokalen Masterplan vollständig enthalten und bleiben ohne Neuentscheidung verbindlich. Vor R06 muss das Designpaket dem ausführenden Agenten nach eigener Freigabe zur Verfügung stehen.

### 14.2 Vorrangregeln R01 nach kritischem Review

1. **R01 ist der nächste schreibende Run, aber nur nach eigenständigem GO im ausführenden Agenten-Chat.** Keine implizite Freigabe durch Übergabe des R00-Berichts.
2. `R01` stabilisiert **Legacy-ESM**, nicht React. React + TypeScript (H-07 CLOSED), Vite bevorzugt, bleibt die Zielarchitektur; danach `R02`, `R03`, R04a Toolchain, R04b TS-Codecs, R05 gemeinsamer Store, R06 React-Shell.
3. Quota-Sperre und Löschfreigabe müssen als konsistenter State Machine-Vertrag umgesetzt werden: kein global blockierter Flush, der eine versprochene Platzfreigabe technisch unmöglich macht.
4. Ein `storage`-Event für Cross-Tab-Änderungen ist **keine atomare Single-Writer-Garantie**; volle N8-Abnahme bleibt bis zu getesteter Lock/Generation-Architektur offen.
5. Cloud-`synced` und Upload dürfen nur auf einem **tatsächlich lokal bestätigten Write** beruhen; ein unbestätigter Cloud-Apply blockiert Uploads, Revision-/Hash-Meta werden nicht voreilig erhöht. Keine produktiven Supabase-Tests.
6. Der technische Audit-Branch muss nicht als vorgeschalteter Merge auf `develop` landen; isoliertes Übernehmen der **erforderlichen QA-Harness-Dateien** in den späteren R01-Branch ist die empfohlene risikoärmere Prozessvariante. **Keine automatische Git-Mutation.**

### 14.3 Quellen- und Freigabestatus

| Artefakt / Gate | Stand |
|---|---|
| Originalbericht R00 | Vom Nutzer eingereicht; read-only durchgeführt laut Agentenbericht, reproduzierte Mock-Befunde |
| R00 fachlicher Review | Dokumentiert in `CopyBoard-R00-Review-and-R01-Triage-2026-10-21.md`; selbst **keine** Browser-Tests ausgeführt |
| R01 ausführbarer Prompt | Datei `CopyBoard-R01-Data-Loss-Guards-Prompt-2026-10-21.md`, **nur Vorlage; noch nicht gestartet** |
| D-001..D-033 | Unverändert; Entscheidungen bleiben bindend |
| H-07 | CLOSED: React + TypeScript; Vite bevorzugt |
| H0 / R01-Write-GO | Offen bis separate Ausführungsgenehmigung |
| Supabase-Backend-Policies, Produktionslöschung | UNVERIFIED |
| React/Legacy-Datenmigration | Nicht begonnen |

**Vorrang gegenüber früheren Plantexten:** Abschnitt 14 und Begleit-Review präzisieren riskante R01-Pfade sowie die feinere Runfolge R04a/R04b/R05. Historische Formulierungen in §§11–13 und früheren Runbooks behalten Quellencharakter, sind aber bei Widerspruch hierdurch als überholt markiert. **Kein Branch, Commit, Push, Merge, Deployment oder Cloud-Datenänderung durch diese Dokumentation.**

## 15. CUTLER R01/R02 — verifizierter Stand und beschleunigter 2+1-Implementierungsplan

**Stand 22.10.2026.** Diese Sektion ersetzt bei Widerspruch ausschließlich historische Status-/Run-Ablauf-Aussagen aus §§11–14 und dem alten Runbook. Die ausdrücklich getroffenen Entscheidungen D-001–D-033 bleiben unverändert. **Keine eigenständige Repository-, Produktiv- oder Backend-Freigabe durch dieses Konzeptdokument.**

### 15.1 Verifizierter Code-/Auditstand

- `main`: `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` — weiterhin ohne R01/R02-Release zum Prüfzeitpunkt.
- `develop`: `35bde4c7fdbe6c55f659ba721dc3ddecbe870754` — R01/R01.1 über PR #1 als Squash integriert.
- `fix/r02-security-privacy-hardening`: `424ca75440b8247bccd3186da298cafdb8a29f52` — R02 laut GitHub vier Commits vor `develop`, nicht gemergt; 29 R02-Tests laut committeter synthetischer Evidence PASS, keine zuvor grünen Run-01-Szenarien regressiv. Evidenz geprüft, **nicht unabhängig auf unserem Container ausgeführt**.
- R01 schließt nach Tests Quota-/Schema-/Cloud-Apply-/Importverlustpfade G1–G4; sequentieller Tab-Schutz G5. **A8r** (simultane Tabs, 5/5 Verluste) und **I-C05** (offener Editor bei Cloud-Apply) bleiben offen.
- R02 schützt gegen gemeldete Stored-XSS-, Paste-Capture-/Credentials- und PIN-Bypass-/Großdatenfehler S1–S4. Die alten Probleme **I-26** (Klartext-Titel bei gesperrten Textkarten), Undo-Re-Exposition, schwache PINs, Burn-Link, Backend-RLS/Policies bleiben offen. CSP/SRI/Version-Pinning noch nicht abgeschlossen.

### 15.2 Beschleunigtes Parallel-UI statt riskanter Big-Bang-Cutover

**Neuer Nutzerwunsch:** in **zwei gebündelten technischen Coding-Runs** zur *laufenden React+TypeScript-Preview* und unmittelbar danach ein **großer Fable-/Design-WOW-Run**. Dies ersetzt die frühere praktische Run-Zerlegung R02b/R03/R04a/R04b/R05/R06 **für die Erstellung einer schreibgeschützten Design-Preview**, **nicht** die zugrunde liegenden Sicherheits-, Datenintegritäts- oder Release-Gates.

| Sprint | Technischer Auftrag | Ergebnis/Grenze |
| --- | --- | --- |
| **A · Foundation Sprint** | R02 bei positivem PR-Gate nach `develop` integrieren; reproduzierbares npm/Vite-/TS-Dev-Setup und fokussiertes CI-/Testgerüst auf Feature-Branch. | Legacy-App unverändert benutzbar; **kein `main`-Merge/Deployment**. Kein ungeprüfter CSP-Flip oder Browser-Datentransfer. |
| **B · React Foundation** | React+TypeScript-App-Shell und isolierte **read-only Fixture-/Codec-Grenze** auf A-Stand; lauffähige separate Preview-Route. | React UI sichtbar und startbar, aber **keine echten Write-/Sync-/Undo-Operationen**; nicht als fertiges Produktionsprodukt deklarieren. |
| **C · Design WOW V1** | Fable High (oder anderes geeignetes Design-Coding-Modell) baut DS-/UI-/Motion-Vertical-Slices entsprechend D-001..033. | Interaktive, mobile Design-Preview mit *synthetischen Fixtures*, keine Nutzerdaten, keine Deploymentänderungen; UX-Kanten als `PROPOSAL/HUMAN GATE` markieren. |

**Release-Gates bleiben separat:** Single-Writer/Atomic Commit (A8r), Draft-vs.-Remote-Conflict (I-C05), Supabase-RLS/RPC/Account-Isolation, PIN-Metadaten und Recovery, CSP/SRI, Safari/Firefox/iOS-Tests, vollständige Feature-Parity, Same-Origin-Cutover und echte Datenmigration. Design-Preview auf anderer Origin sieht produktiven Browser-`localStorage` **nicht**, was hier bewusst erwünscht ist. Eine spätere Produktivmigration erfordert unveränderte Origin `copyboard.astambke.de` und einen eigens abgenommenen Datenadapter.

### 15.3 Design-Handoff-Provenienz und Ausführungsdisziplin

Die sechs Original-Blueprints 01–06, ADR-007 und dieser aktualisierte Masterplan werden **unverändert als Quellen (außer diesem Status-Anhang)** in einer ZIP gebündelt. Quelle für Designpriorität: D-001..033 > nachfolgende explizite Entscheidungen > `[DERIVED]`-Invarianten > `[PROPOSAL]`-Kandidaten. Offene H-01..06 und H-08 werden nicht vom Designagenten geschlossen. Für den großen Design-Run ist die ZIP **explizit in Claude Code zugänglich zu machen**; ein GitHub-Agent kann auf lokale Dateien nicht allein wegen ihrer Erwähnung zugreifen.

**Effizienz:** Ein Hauptagent pro Sprint; nur fokussierte Subagenten bei klarer Isolation. Vorhandene Berichte und Tests wiederverwenden. Keine asynchronen Wartefloskeln ohne konkret laufenden Prozess; nach Abschluss direkt CUTLER-Report. Keine technischen Extras, die den sichtbaren React-/Designpfad unnötig verzögern.

## Changelog

- **v0.42 · 2026-10-22:** R01/R01.1-Merge auf `develop`, R02-Branch/Evidenz und verbleibende Cloud-/PIN-/Multi-Tab-Risiken als Statusdelta dokumentiert. Nutzer legt beschleunigten 2+1-Pfad fest: A Foundation Sprint, B React-Preview, C Design WOW. Keine Designentscheidung D-001..033 geändert; keine produktiven Mutationen.

- **v0.41 · 2026-10-21:** Eingegangener CUTLER-R00-Bericht mit P0-N3/N3b-Cloud-Kettenfehler (isoliertes Mock-Backend, reales Supabase unverified), I-35, N4, N8, N1/N2/N5a/N5b ausgewertet; separate fachliche Review, korrigierter R01-Prompt und Runbook v1.2 ergänzt. H-07 React+TS weiter CLOSED. Quota-Recovery-Deadlock und nur best-effort `storage`-Event gegen Cross-Tab-Verlust explizit berücksichtigt. D-001..D-033 wortgetreu erhalten; keine Implementierungsfreigabe.

- **v0.40 · 2026-10-21:** Nutzer entscheidet den Zielstack **React + TypeScript** verbindlich; **H-07 CLOSED**. Vite bevorzugtes Build-Tool mit Eignungsprüfung, keine automatisch beschlossenen Router/State-/Styling-Libraries. Die R00–R09-Sequenz wird in Runbook 06 v1.1 auf Legacy-Sicherheitsfixes vor schrittweiser React-Migration präzisiert. Neue ADR-007 und sofort nutzbarer strikt lesender R00-Agentenprompt. Alte Ledger D-001..D-033 unverändert; keine Code-/Repo-/DB-/Deploy-Mutation.



- **v0.39 · 2026-10-21:** Consolidation Phase 06: Implementation Readiness & Agent Runbook 06 (R00–R09) mit konkreten Agentenbriefings, Branch-/PR-Gates, Human-/Technical-Gates, P0-Data-/Security-first, Test-/Evidence-Protokoll, CUTLER und Daten-Rollback erstellt. Konzeptzyklus 01–06 abgeschlossen; **keine Coding-, Branch-, Repo-, DB- oder Deployment-Freigabe**. D-001 bis D-033 aus v0.38 inhaltlich unverändert erhalten.

- **v0.38 · 2026-10-21:** Consolidation Phase 05: read-only GitHub- und Audit-Review des CopyBoard-Bestands (main/develop SHA `ac721fe...`, Audit SHA `33600a1...`). Separater Technical Feasibility & Feature Parity Blueprint 05 mit 6 Release-Blocker-Gates, 58 Funktions-/Vertrags-Crosswalks, 36 künftigen TF-QA-Fällen, R00–R09 als unverbindlicher Implementierungsabfolge, Daten-/XSS-/Sync-/PIN-/Migration-/Browser-Evidenz und offener Framework-Entscheidung. D-001 bis D-033 vollständig und wortgetreu aus v0.37 übernommen; **keine Code-/Repository-/DB-/Live-Änderung**.


- **v0.37 · 2026-10-21:** Consolidation Phase 04: eigenständiger Design System & Component States Blueprint 04 erstellt (Light-/Dark-Token-Kandidaten, Ambient/Space-Tint, Soft Squircle, Frosted/Tiers, Typography, Responsive/Density, 40 Komponentenfamilien, State-Verträge, Motion-Crosswalk, 32 spätere DS-QA-Szenarien). Explizite Trennung zwischen **beschlossener Richtung** und **unfreigegebenen Zahlen-/Pixelwerten**, Human/Tech/Token-Gates erhalten. D-001 bis D-033 wortgetreu aus v0.36 übernommen; keine Implementierung/Repositoryänderung.


- **v0.36 · 2026-10-21:** Consolidation Phase 03 abgeschlossen: separater Interaction Contract & Motion State Machines Blueprint 03 mit 10 Invarianten, 11 State Machines, 12 Motion Storyboards, 36 künftigen QA-Szenarien, Fokus-/Shortcut-/Overlay-Prioritäten und Explizitstatus der Human-/Technical-Gates. D-001 bis D-033 wortgetreu aus v0.35 übernommen; weder Implementierung noch Repositoryänderung.

- **v0.35 · 2026-10-21:** Konsolidierung Phase 02: Screen Inventory & IA Blueprint 02 erstellt (SC-01..SC-28, Layer-/Ownership-Modell, Desktop/Tablet/Mobile, State-/Konfliktmatrix und 20 zukünftige Integrationstests). H-01 Folder-Primäraktion sowie H-02/H-03 bewusst offen statt als beschlossen dargestellt. D-001..D-033 aus v0.34 unverändert übernommen; keine Implementierung/Repository-Änderung.

- **v0.34 · 2026-10-21:** Decision Integrity Audit 01 abgeschlossen: 17 Versionssnapshots strukturell geprüft, 33/33 Entscheidungen erhalten, zwei historische Klarstellungen (D-019, D-027) identifiziert, 5 P0-Gates und 10 P1-Kollisions-/Spezifikationsstellen explizit erfasst. Separater ausführlicher Auditbericht mit 33er-Matrix und 18 Interaktionsszenarien. Bestehende Decision-Abschnitte D-001 bis D-033 bewusst unverändert; keine Implementierung/Repositoryänderung.

- **v0.33 · 2026-10-21:** D-033 ergänzt: **Smart Preferences Hybrid (C)** – kontextuelle Sidebar-/Dichte-/Theme-Schnelloptionen plus Settings Studio mit einer gemeinsamen Preference-Quelle. Die 33-Entscheidungen-Richtungsphase geschlossen; erster systematischer Integrations-/Widerspruchs-Preflight und konkrete Konsolidierungsaufgaben (Abschnitt 6) ergänzt. Keine Implementierung, keine Repository-Änderungen; D-001 bis D-032 vollständig erhalten.

- **v0.32 · 2026-10-21:** D-032 ergänzt: **Adaptive Density (C)** – persistent wählbare Komfort-/Standard-/Kompaktansicht in Grid und Liste; responsive Raster ohne willkürliche dateitypspezifische Umstellung, keine Mutation von Sortierreihenfolge, Fokus- und Auswahlstabilität, Accessibility und Performance-Rahmen. Nächster abschließender Richtungs-Sprint D-033: Settings/Preferences. D-001 bis D-031 in ihren Beschlüssen erhalten; keine Repository-Änderungen.

- **v0.31 · 2026-10-21:** D-031 ergänzt: **Adaptive Atmosphere (C)** – Hell/Dunkel/System als unabhängige Theme-Modi plus gedämpftes, Space-farbadaptives Bokeh; Lavender-Markenidentität, Ambient Canvas und Collapsing Ambient bleiben maßgeblich. Klare Trennung von Hintergrundakzent und semantischen Statusfarben, eigenständiger Dark Mode, Accessibility-/Performance-/Motion-Grenzen ergänzt. Nächster Sprint D-032: Workspace Density. D-001 bis D-030 in ihren Beschlüssen erhalten; keine Repository-Änderungen.

- **v0.30 · 2026-10-21:** D-030 ergänzt: **Adaptive Mobile Dock (C)** – stabil erreichbare mobile Hauptaktionen (Spaces/Suche/Smart Capture), situationsabhängige Aufnahme-/Auswahl-/Editoraktionen, Tap-Drawer statt Hover und saubere Abgrenzung zu optionalem Desktop-Capture-Dock. Safe-Area-, Tastatur-, Recording-/PWA-, Accessibility- und Kollisionsvorgaben ergänzt. Nächster Sprint D-031: Erscheinungsbild Light/Dark/System und Lavender-Bokeh-Themes. D-001 bis D-029 in ihren Beschlüssen erhalten; keine Repository-Änderungen.

- **v0.29 · 2026-10-21:** D-029 ergänzt: **Recovery Studio (C)** – konsistente Instant-Undo-Aktionen, Papierkorb/Restore inklusive zugehöriger Assets und gezielte frühere Fassungen für Markdown-Prompts/Notizen. Sicherheits-, Cloud-Konflikt-, Versions- und Datenschutzgrenzen klar markiert; keine erfundene Retentionfrist. Nächster Sprint D-030: Mobile Experience & Quick Capture. D-001 bis D-028 unverändert beschlossen; keine Repository-Änderungen.

- **v0.28 · 2026-10-21:** D-028 ergänzt: **Adaptive Trust System (C)** – ruhiger Default-Status, klar sichtbare Offline-/Pending-/Fehler-/Konfliktzustände, Sync Center und ausdrückliche Trennung zwischen bestätigter lokaler Speicherung und Cloud-Synchronisierung. Kein fingierter Speicherstatus; Multi-Device-, Browser- und Supabase-Nachweis vor Freigabe. Nächster Sprint D-029: Recovery & Revision Experience. D-001 bis D-027 in ihren Beschlüssen unverändert; keine Repository-Änderungen.

- **v0.27 · 2026-10-21:** D-027 ergänzt: **Spatial Capture Handoff (C)** – Erfasstes Material erreicht über eine räumlich nachvollziehbare Choreografie das echte Smart Grid; verbindliche Regel „Save before celebrate“, separates Cloud-Sync-Signal, kompakte Batch-Bewegung, Undo, Error-/Reduced-Motion- und Accessibility-Fallbacks. Nächster Sprint D-028: Save & Sync Confidence. D-001 bis D-026 in ihren Beschlüssen unverändert; keine Repository-Änderungen.

- **v0.26 · 2026-10-21:** D-026 ergänzt: **Living Empty State (B)**, freundliche kleine Illustration/gezielte Animation mit Smart Capture als primärem Einstieg, drei optionalen Direktaktionen (Notiz, Datei, Session), ohne Wizard oder Beispieldaten. Erst nach belastbar gesichertem erstem Inhalt choreografierter Übergang in Smart Grid. Abgrenzung von gefilterter/leergefundener Suche und Fehlerzuständen, Mobile-/Reduced-Motion- und Persistenzregeln ergänzt. Nächster Sprint: Capture Feedback und Save Confirmation. D-001 bis D-025 in ihren Beschlüssen unverändert; keine Repository-Änderungen.

- **v0.25 · 2026-10-21:** D-025 ergänzt: **Studio Space Sheet (B)** mit schneller Erstellung, räumlich federnder Frosted-Animation aus dem Plus-Button, sofortiger Vorschau von Name/Farbe/optionalem Icon und direktem Einstieg in den neuen Space. Kein Template-Zwang. UX-Sicherheitsregeln, Mobile-Adaption und offene Fragen dokumentiert. Nächster Sprint: Empty State. D-001 bis D-024 in ihren Beschlüssen unverändert; keine Repository-Änderungen.

- **v0.24 · 2026-10-21:** D-024 ergänzt: **Smart Folder Navigation (C)** – Folder Cards im Canvas, Breadcrumbs, optional angeheftete Ordner und verschachtelte Ordner ohne permanenten Explorer Tree in der Sidebar; Interaktions-, Responsive-, Drag-/Move- und Accessibility-Grenzen klargestellt. Nächster Sprint: Space-Erstellung und Personalisierung. D-001 bis D-023 in ihren Beschlüssen unverändert; keine Repository-Änderungen.

- **v0.23 · 2026-10-21:** D-023 ergänzt: **Smart Sorting Hybrid (C)** – unabhängige automatische Sortierung und persistente eigene Reihenfolge, Grid-/List-Parität, Drag-&-Drop-Trennung und Konfliktfreiheit zu Karte/Mehrfachauswahl. Abschlussplanung auf ungefähr D-030–D-033 als unverbindlichen Richtwert ergänzt; nächster Sprint: Ordner/Spaces. D-001 bis D-022 unverändert; keine Repository-Änderungen.

- **v0.22 · 2026-10-21:** D-022 ergänzt: **Smart Selection Hybrid (C)** – Desktop-Modifikatortasten und explizite Touch-Auswahl mit schwebender Sammelaktionsleiste, klare Abgrenzung zu Kartenklick/Kopieren, Accessibility sowie Bulk-Sicherheit. Offene Zustands-/Konfliktfragen erfasst. Nächster Sprint: Sortierung und Drag & Drop. D-001 bis D-021 unverändert; keine Repository-Änderungen.

- **v0.21 · 2026-10-21:** D-021 ergänzt: **Smart Search Hybrid (C)** – kompakter Header-Suchtrigger mit globaler Such-/Command-Oberfläche, Space-/Dateitypfilterung und klarer Trennung von Suchtreffern und Aktionen. Neue offene Suchdetails konkretisiert. Nächster Sprint: Mehrfachauswahl & Bulk Actions. D-001 bis D-020 unverändert; keine Repository-Änderungen.

- **v0.20 · 2026-10-21:** D-020 ergänzt: **Collapsing Ambient (B)** – Lavender-Bokeh-Header verdichtet sich beim Scrollen weich zu einer sticky Toolbar mit Space-Kontext, Suche und Capture-Einstieg. Ausformulierte Motion-, Accessibility- und Responsive-Prinzipien; genaue Schwellen offen. Nächster Sprint: Suche und Command Palette. D-001 bis D-019 unverändert; keine Repository-Änderungen.

- **v0.19 · 2026-10-21:** D-019 ergänzt: **Ambient Canvas (C)** statt Panorama/Framed Studio; violettes Bokeh fließt ohne sichtbare Header-Containerkante in den Canvas aus. Material-70/30, Motion-80/20 und Smart Capture konsistent verknüpft. Scroll-Verhalten für Sprint 17 ausdrücklich offengehalten. D-001 bis D-018 unverändert; keine Repository-Änderung.
- **v0.18 · 2026-10-21:** D-018 ergänzt: **Spaces First (B)** als primäre Navigation, globale Schnellzugriffe nachgeordnet. Vorige D-001 bis D-017 erhalten; neue offene Detailfragen und Sprint-16-Fokus (Workspace Header/Bokeh) präzisiert. Keine Repository-Änderung.
- **v0.17 · 2026-10-21:** Konsolidierter Erstsnapshot von D-001 bis D-017. D-017 als **Expressive Motion (C) 80 % / Soft Choreography (B) 20 %** festgehalten; D-015 als B/C **70/30** zur Abgrenzung separat dokumentiert. Keine Repository-Änderung.
