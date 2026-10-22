# CopyBoard — Decision Integrity Audit 01

**Auditstand:** 21. Oktober 2026  · **Eingabe:** CopyBoard Design-Masterplan v0.33 + vorliegender Entscheidungsgesprächsverlauf  · **Auditstatus:** UX-Konzeptprüfung, nicht technische Code-/Backend-Verifikation.

> **Ergebnis:** Alle 33 Richtungsentscheidungen D-001 bis D-033 sind dokumentiert und in der überprüften Historie durchgängig vorhanden. Es gibt **keinen irreversiblen Grundsatzwiderspruch**, aber mehrere echte **Interaktionslücken** und kritische **technische Freigabegates**, die vor der Implementierung spezifiziert beziehungsweise vor Release nachgewiesen werden müssen. „Formal vollständig“ bedeutet ausdrücklich **nicht** „umsetzungsreif und verifiziert“.

## 1. Prüfgegenstand und Methode

1. Jede Version v0.17–v0.33 gegen fortlaufende Decision-IDs, Duplikate und ausgelassene Entscheidungen prüfen.
2. Erstausgabe jedes Decision-Abschnitts gegen den Stand v0.33 abgleichen; Änderungen kenntlich machen.
3. Jede Richtungswahl mit dem im Gespräch sichtbaren Nutzerbeschluss abgleichen. Zusammengesetzte Entscheidungen (B+C, 70/30, 80/20) ausdrücklich getrennt prüfen.
4. Abhängigkeiten und konkurrierende Interaktionen über die Entscheidungen hinweg identifizieren; **keine** bisher nicht getroffene UX-Entscheidung als bereits beschlossen ausgeben.
5. Resultat als Auditbefund mit Schwere, Lösungsrichtung, offenen Fragen und überprüfbarem Abnahmekriterium dokumentieren.

### Prüfumfang / belegbare Fakten

- **17 vorhandene Masterplan-Versionen**, v0.17 bis v0.33; jede enthielt exakt die erwarteten fortlaufenden Decision-IDs und keine doppelten Decision-Überschriften.
- **33/33 IDs D-001 bis D-033** im letzten Stand vorhanden; Richtung der 33 Nutzerentscheidungen stimmt mit dem vorliegenden Gespräch überein.
- **Zwei inhaltliche Aktualisierungen** an früheren Entscheidungsabschnitten seit deren Erstfassung: D-019 wurde um den danach beschlossenen Scroll-Modus D-020 präzisiert; D-027 wurde um das danach beschlossene Trust-System D-028 präzisiert. Die Richtungswahl wurde dabei nicht überschrieben.
- **Nicht untersucht:** der tatsächliche aktuelle Repository-Code, live Supabase-Policies, Datenbankmigrationen, Browserrealität, UI-Konformität, aktuelle Produktionsdaten oder Plattform-API-Verfügbarkeit. Dafür ist ein getrennter Technical Feasibility Gate notwendig.

## 2. Entscheidungstreue — D-001 bis D-033

| ID | Gewählt | Festgelegter Kern | Besondere Nuance / Abgrenzung | Audit |
|---|---|---|---|---|
| D-001 | C | Hybrid Workspace | Grundlayout, linke Navigation + große Arbeitsfläche | Richtungswahl bestätigt |
| D-002 | B | Hover-Sidebar | Drei Modi: immer kompakt, immer offen, dynamisch | Richtungswahl bestätigt |
| D-003 | B | Smart Capture Bar | Optionales Floating Capture Dock C nur vorgemerkt | Richtungswahl bestätigt |
| D-004 | C | Adaptive Detail View | Inspector und Fokus-/Vollansicht | Richtungswahl bestätigt |
| D-005 | C | Smart Grid | Typgerechte Vorschauen, keine Masonry-Struktur | Richtungswahl bestätigt |
| D-006 | C | Smart Actions | Kopieren + …, Click für Inspector, Touch zugänglich | Richtungswahl bestätigt |
| D-007 | C | Hybrid Composer | Markdown, Split View, Vorschau | Richtungswahl bestätigt |
| D-008 | C | Floating Recorder | Session Panel mit Zeitstempel-Timeline | Richtungswahl bestätigt |
| D-009 | B | Session-to-Composer | Originale sichern, danach Composer öffnen | Richtungswahl bestätigt |
| D-010 | A | Context Rail | Rechte Materialleiste mit Timeline, Mobile Drawer | Richtungswahl bestätigt |
| D-011 | B | Smart Handoff Sheet | Direktkopie, Markdown, Asset-ZIP | Richtungswahl bestätigt |
| D-012 | B + C | Soft Studio + Precision | Soft Studio als Basis, präziser Workspace-Akzent | Richtungswahl bestätigt |
| D-013 | B | Mist & Lavender | Violetter Bokeh-Blur wie ibo Editor Header | Richtungswahl bestätigt |
| D-014 | B | Soft Squircle | Formhierarchie, keine Pillenflut | Richtungswahl bestätigt |
| D-015 | B + C | Soft Elevation / Frosted | Material-Hierarchie ungefähr 70/30 | Richtungswahl bestätigt |
| D-016 | B | Soft Editorial | Charakter im Titel, präzise UI-Typografie | Richtungswahl bestätigt |
| D-017 | C + B | Expressive / Choreography | Motion-Charakter ungefähr 80/20 | Richtungswahl bestätigt |
| D-018 | B | Spaces First | Spaces prominent, globale Shortcuts nachgeordnet | Richtungswahl bestätigt |
| D-019 | C | Ambient Canvas | Gradient fließt ohne harte Headerkante aus | Richtungswahl bestätigt |
| D-020 | B | Collapsing Ambient | Header verwandelt sich in Sticky-Toolbar | Richtungswahl bestätigt |
| D-021 | C | Smart Search Hybrid | Command Palette plus Filter, globaler Suchtrigger | Richtungswahl bestätigt |
| D-022 | C | Smart Selection Hybrid | Desktop-Modifikatoren, Mobile-Auswahl, Floating Bar | Richtungswahl bestätigt |
| D-023 | C | Smart Sorting Hybrid | Sortiermodi + separate manuelle Reihenfolge | Richtungswahl bestätigt |
| D-024 | C | Smart Folder Navigation | Folder Cards, Breadcrumbs, optionale Pins | Richtungswahl bestätigt |
| D-025 | B | Studio Space Sheet | Live-Vorschau, schnelle Erstellung (A-Tempo) | Richtungswahl bestätigt |
| D-026 | B | Living Empty State | Kein Wizard, kein Demo-Content, Quick Starts | Richtungswahl bestätigt |
| D-027 | C | Spatial Capture Handoff | Save before celebrate, Zielkarten-Bewegung | Richtungswahl bestätigt |
| D-028 | C | Adaptive Trust System | Lokale vs. Cloud-Bestätigung trennen | Richtungswahl bestätigt |
| D-029 | C | Recovery Studio | Undo, Trash, Revisionen | Richtungswahl bestätigt |
| D-030 | C | Adaptive Mobile Dock | Stabile Hauptaktionen und Kontext-Strip | Richtungswahl bestätigt |
| D-031 | C | Adaptive Atmosphere | Light/Dark/System plus Space-Tints | Richtungswahl bestätigt |
| D-032 | C | Adaptive Density | Komfort/Standard/Kompakt als persistente Wahl | Richtungswahl bestätigt |
| D-033 | C | Smart Preferences Hybrid | Quick Preferences + gemeinsames Settings Studio | Richtungswahl bestätigt |

**Wichtig:** D-012 ist **B mit C-Präzision**. D-015 ist **Soft Elevation B / Frosted C ≈ 70/30**. D-017 ist **Expressive C / Choreography B ≈ 80/20** – die vom Nutzer ausdrücklich geänderte Verteilung, nicht die vorherige B-Empfehlung. D-025 ist **B mit der Schnelligkeit von A**, kein Wechsel zu Variante A. D-003s Desktop-Capture-Dock C ist **vorgemerkt**, D-030s Mobile Dock C dagegen **beschlossen**.

## 3. Befunde — Prioritäten

**P0 = vor Umsetzung architektonisch klären bzw. vor Release zwingend nachweisen. P1 = UI-State-/Interaction-Spezifikation nötig. P2 = Design-Polish/QA.** Diese Labels beschreiben die Freigaberelevanz, nicht, dass ein Defekt bereits im neuen, noch nicht implementierten Produkt existiert.

### P0 — Verlässlichkeit, Daten und Sicherheit

**P0-01 · Persistenzzustände dürfen nicht simuliert werden.** **D-003/D-025/D-026/D-027/D-028:** „lokal gespeichert“ erst nach tatsächlichem Durable Commit; „Cloud aktuell“ erst nach Server-ACK für die korrekte Revision. Lokale Quota-/Storage-Fehler sind kein Sync-Pending. **Gate:** Fehlerszenarien Storage voll, Tab-Crash, Reload, Offline, Netzausfall und Retry ohne fiktiven grünen Haken nachweisen.

**P0-02 · Sync/Recovery brauchen kompatible Revisions- und Besitzlogik.** **D-028/D-029/D-023/D-033:** Undo, Trash, Revisionen, manuelle Sortierung und Multi-Device-Sync dürfen nicht gegenseitig Daten überschreiben. Wiederherstellen einer alten Fassung muss die bisher aktuelle Fassung absichern; gelöschte Ordner/Spaces mit Kindern dürfen keine verwaisten Anhänge erzeugen. **Gate:** Datenmodell mit IDs, revisionsgebundenen Writes, idempotenten Retries, Konflikt-UI und Restore-Tests.

**P0-03 · Bestehende Sicherheits- und Migrationsrisiken separat beheben.** Der alte technische Audit dokumentiert Risiken bei localStorage-Schema-/Quota-Fehlern, gespeicherten XSS-Pfaden und nicht vollständig verifiziertem Cloud-/RLS-Verhalten. **D-001/D-028/D-029** beschreiben Soll-UX, keine Reparatur. **Gate:** sichere lesende Alt-Datenmigration, Export-/Rollbackoption, XSS-Abwehr/Sanitization/CSP, Auth- und Supabase-RLS-Nachweis vor Freigabe.

**P0-04 · Aufnahme/Session-Erhalt vor Composer-Autostart.** **D-008/D-009/D-010:** Aufzeichnung kann durch Mikrofonberechtigung, Hintergrundbetrieb und Browserabbruch gestört werden; UI muss unvollständige Sessions kenntlich machen. Audio und Anhänge müssen nachweislich referenzierbar gespeichert sein, bevor Composer den Abschluss behauptet. **Gate:** Stoppen, Unterbrechung, Speicherfehler, Tab-Schließen und Wiederaufnahme/Export auf echten Zielbrowsern prüfen.

**P0-05 · Paste und Handoff benötigen Inhalts- und Privatsphäregrenzen.** **D-003/D-007/D-011:** `Cmd/Ctrl+V` in Markdown-Editor/Textfeld darf nicht global abgefangen werden; Asset-Referenzen dürfen bei ZIP/Markdown nicht ins Leere zeigen; binäre Dateien werden nicht still mit einem Text-Copy „übertragen“. Audio, Screenshots und private Dateien gehen nur mit expliziter Handlung an externe Dienste. **Gate:** Clipboard-/Drag-Ingest-Routing, Paketmanifest/-referenzen, Download-Verifikation und explizite Weitergabe prüfen.

### P1 — Tatsächliche Interaktionskollisionen und offene Semantik

**P1-01 · Ordnerkarte: Öffnen oder Inspector?** **D-004/D-024/D-006:** D-004 sagt „Kartenklick öffnet Inspector“, während die Ordner-Layoutstudie einen Ordner direkt per Klick öffnet und D-024 ihn als navigierbares Objekt beschreibt. **Dies ist eine echte, noch nicht entschiedene Primäraktions-Ambiguität.** Kandidat: Ordner-Tap/-Click öffnet Folder; Details über `…`/Info. **Nicht** ohne bewusste Abnahme als bereits beschlossen behandeln.

**P1-02 · Rechte Bildschirmebene und Fokuskontext.** **D-004/D-007/D-010:** Inspector, fokussierter Composer und Context Rail verlangen einen eigenen, expliziten `workspace → inspector → composer → context rail`-View-State; kein unkontrolliertes doppeltes rechtes Panel. **Gate:** Öffnen/Schließen/Zurück/Escape/Focus-Restore und Deep-Link/History-Fälle als Zustandsmatrix.

**P1-03 · Mehrfachauswahl vs. Drag, Sortierung und normale Kartenaktionen.** **D-006/D-022/D-023/D-024/D-032:** Auswahl-Metadaten, Ein-Klick-Kopieren, Card-Open, eigener Sortiermodus, Bulk Move und Ordner-Drop-Ziele brauchen klar getrennte Gesten; `Shift`-Range folgt sichtbarer, gefilterter Reihenfolge. **Gate:** Desktop-, Touch- und Keyboard-Gestentabelle inkl. Abbruch, Undo und Reload.

**P1-04 · Drei potenzielle Floating-/Bottom-Layer.** **D-003/D-008/D-022/D-030:** Floating Recorder, Mehrfachauswahl-Bar und mobiles Dock können sich überlagern; optionales Desktop-Capture-Dock ist außerdem vorgemerkt. **Gate:** Prioritäts-/Docking-Modell mit Safe Areas, virtueller Tastatur, Screenreader-Fokus und simultaner Session + Auswahl.

**P1-05 · Header-Morphing vs. aktive Eingaben.** **D-019/D-020/D-003/D-021/D-028:** Sticky Header darf Fokus/Markierung in der Capture Bar, sichtbaren Sync-Zustand und Suchtrigger beim Scrollen nicht remounten oder verschlucken. **Gate:** Scroll in aktiver Texteingabe, geöffnetem Inspector, nach Space-Wechsel und bei Browser-Restoration prüfen.

**P1-06 · Command Palette vs. Editor-Shortcuts.** **D-007/D-021/D-022:** `Cmd/Ctrl+K` kann im Editor bereits Link-Aktionen beanspruchen; `Escape` kann Menü, Auswahl oder Editor verlassen. **Gate:** zentrale Shortcut-Prioritäten (Fokus-Scope), sichtbare Konfliktlösung und tastaturgleichwertige Alternativen.

**P1-07 · Preferences-Scope und Identität.** **D-002/D-023/D-031/D-032/D-033:** Sidebar-/Theme-/Density-/Sortier-Einstellungen dürfen nicht gleichzeitig widersprüchlich als global, pro-Space, pro-Device und Konto-Einstellungen gespeichert werden. **Gate:** je Preference definierter Geltungsbereich, Default, Migration, Persistenz/Sync und Quelle der Wahrheit.

**P1-08 · Legacy-Funktionsparität noch nicht überprüft.** Die 33 UI-Richtungen decken zentrale Flows ab, aber kein vollständiger Abgleich gegen die **bestehende Funktionsinventarliste** ist sichtbar. Besonders zu prüfen: OCR, Bildrotation/-spiegelung, PIN/geschützte Inhalte, Duplikaterkennung, bisheriges Backup/Import, Files/Clipboard-Sonderfälle, Favoriten und Cloud-Auth. **Gate:** Feature-Parity-Matrix „erhalten / bewusst ersetzen / gesondert freigeben“, bevor Komponenten gestrichen werden.

**P1-09 · Suche/Filter/Empty State/Virtualisierung.** **D-005/D-021/D-022/D-026/D-032:** „kein Treffer“ darf nicht „leerer Space“ heißen, unsichtbare ausgewählte Karten dürfen nicht vergessen oder still mitbearbeitet werden; Reflow bei großen Libraries/hohem Zoom muss stabil bleiben. **Gate:** State-Inventar und Tests mit 0, 1, 100, 10.000 Karten; Keyboard-/Screenreader-Navigation.

**P1-10 · Ordner-/Space-Moves brauchen stabile Referenzen.** **D-018/D-023/D-024/D-025/D-029:** Verschieben/Rename/Pin einer Ordnerhierarchie, Referenzen aus Composer und Zip-Assets sowie Restore aus Trash dürfen keine Zyklen, verwaisten Referenzen oder unsichtbare Dopplungen erzeugen. **Gate:** Moves innerhalb/zwischen Spaces, gleichnamige Ordner, gelöschte Eltern, spätere Restore-Kollisionen.

### P2 — Designqualität und nachgelagerte Klarheit

**P2-01 · Bokeh- und Material-Hierarchie.** **D-013/D-015/D-019/D-031:** 70/30 ist Designgewicht, keine globale Alpha-Verteilung; Space-Tint nicht als Status-/Fehlerfarbe verwenden. Design-Tokens samt Dark und Blur-Fallback fehlen noch.

**P2-02 · Animation als wohldefinierter Zustandsübergang.** **D-017/D-020/D-027:** 80/20 beschreibt Charakter, nicht Anzahl/Länge von Animationen. Motion-Storyboard mit Start-/End-Koordinaten, Unterbrechbarkeit, Stagger-Budget, Reduced Motion und Blick-/Fokus-Stabilität nötig.

**P2-03 · Kein endgültiger Komponenten-/Breakpoint-Satz.** **D-014/D-016/D-030/D-032/D-033:** Formgeometrie, Typografie, Icon-Stroke, responsive Layoutgrenzen und Hover-/Keyboard-/Touch-Varianten noch nicht pixelgenau beschlossen. Keine ungeprüften Design-Tokens aus den Demos übernehmen.

**P2-04 · Copy und Selection bei Dateitypen präzisieren.** **D-006/D-011/D-022:** Copy-Feedback, Bild-Clipboard-Fallbacks, Download statt Copy für Dateien, gemischte Mehrfachauswahl und Tastaturkonventionen pro Plattform noch spezifizieren.

**P2-05 · Empty-State-Illustration ist nicht freigegeben.** **D-026:** Die gezeigte kleine Illustration ist Richtung, kein finales Asset und keine explizite Maskottchenfreigabe. Übernahme einer Fremdmarken-Illustration wäre unzulässig.

## 4. Kritische State-/Routing-Matrix (vor Implementierung zu finalisieren)

| Ausgangszustand | Aktion | Erwarteter Grundsatz | Offene Detailentscheidung |
|---|---|---|---|
| Board normal | Klick auf Inhalt | Inspector öffnet | Ordner gesondert definieren (P1-01) |
| Board normal | Kopier-Icon | Kopiert geeigneten Inhalt | Binär-/Bild-Fallback, Status |
| Board normal | Cmd/Ctrl+V bei nicht-editierendem Fokus | Capture gemäß Datentyp | Dateimix, Rechte, Fehlerzustand |
| Composer mit Texteingabefokus | Cmd/Ctrl+V | Fügt in Editor ein; nicht global capturen | Media-Paste/Anhänge und Undo |
| Board Auswahl | Klick/Tap Karte | Toggle Selection | Auswahl bei Filtern/Virtualisierung |
| Board manuell sortiert | Drag innerhalb des Grid | Reorder eigener Reihenfolge | Multi-Drag/Threshold |
| Board automatisch sortiert | Drag innerhalb des Grid | Keine stille manuelle Sortierungs-Mutation | Hinweis/Alternative |
| Space/Ordner | Drag auf Ordner | Move, nicht Reorder | Fremde Space-Ziele, Cycle-Prüfung |
| Aufnahme aktiv | Navigation/Inspector/Space-Wechsel | Aufnahme und Session-Kontext bleiben sichtbar und erhalten | Browser-Unterbrechungen |
| Aufnahme gestoppt, Originale gesichert | Open Composer | Entwurf mit Original-Assets verknüpft | Speicherausfall / Wiederaufnahme |
| Composer | Context Rail öffnen | Kontext-Materialien zeigen, Editor bleibt nutzbar | Konkurrenz Inspector / kleine Breite |
| Capture-Commit lokal bestätigt | Spatial Handoff | Karte setzen + lokale Bestätigung | Offscreen-Ziel, Batching |
| Cloud Pending oder Offline | Save-/Sync-Indikator | Keine Cloud-Erfolgsmeldung | Retry/Conflict/Export |
| Version restaurieren | Wiederherstellen | Frühere Fassung als neuer Revisionsstand, Original aktuell erhalten | Storage/Ownership |
| Mobile Auswahl + Recorder | Dock/Panels öffnen | Hauptnavigation bleibt, kontextuelle Aktionen kollidieren nicht | Priorität/Position |
| Suche geöffnet | Cmd/Ctrl+K/Escape | Search-Fokus korrekt, Back-Stack eindeutig | Editor-Shortcuts |
| Header kollabiert | Capture-Einstieg | Gleicher Capture-Flow, kein zweiter Store | Fokus/Scroll-Restoration |
| Quick Preference geändert | Settings Studio öffnen | identische Preference-Werte | Device/Account/Space-Scope |

## 5. Priorisierte nächste Artefakte

1. **IA & Screen Inventory**: Routen/Overlays/Empty-/Loading-/Error-/Offline-/Conflict-/Trash-/Mobile-States; inklusive P1-01 Folder-Primäraktion als ausdrücklich offener Human-UX-Gate.
2. **Interaction Contract & State Machines**: Copy vs. Open vs. Select vs. Drag; Recorder/Mobile-Dock/Context-Rail/Inspector; Keyboard-, Focus- und Escape-Prioritäten.
3. **Token & Component Spec**: Mist/Lavender + Space-Tint, Dark/Bokeh, Squircle, Surface/Shadow/Blur, Density, Type, Icon und A11y; Motion-Szenen/Reduced Motion.
4. **Technical Feasibility / Feature Parity / Security**: Alt-Feature-Liste (inkl. OCR/PIN/Import/Backup), Storage/Migration, revisionsfähiger Sync/Restore, RLS/XSS, reale Browser-APIs.
5. **Agent-ready Implementation Brief**: Alle Beschlüsse + ungelöste Gates + konkrete testbare Akzeptanzkriterien, auf separatem Branch erst nach ausdrücklicher Freigabe.

## 6. Audit-Fazit

**Bestätigt:** 33 Beschlüsse, IDs D-001..D-033, keine verlorene Richtungswahl in der Versionskette. **Nicht bestätigt:** technische Umsetzbarkeit, jeder Pixel-/State-Detailgrad, Funktionsparität und Daten-Sicherheit. **Konkreter offener UX-Widerspruch:** Ordnerkarten-Primäraktion (P1-01). **Zentrale release-kritische Bedingungen:** P0-01 bis P0-05. **Status:** geeignet als Ausgangsbasis für die Blueprint-Spezifikation, ausdrücklich **nicht** als sofort ausführbarer Coding-Auftrag.

---

**Dokumentationsregel:** Diese Prüfung fügt keine neuen Grundsatz-D-Entscheidungen hinzu, ersetzt keine früheren Beschlüsse und gibt weder Repository- noch Production-Änderungen frei.
