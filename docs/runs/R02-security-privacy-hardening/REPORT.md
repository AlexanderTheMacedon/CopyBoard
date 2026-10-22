# CUTLER R02 — Security & Privacy Hardening

Stand: 22.10.2026 · Branch `fix/r02-security-privacy-hardening` · Modus: eigenständiger Coding-Run, STOP am Human Gate

## Kurzfazit

Alle bestätigten R02-Befunde sind geschlossen und mit synthetischen Daten belegt: Stored XSS (I-31, I-32, I-33b), Paste-Erfassung in fremden Feldern (I-02, N1), PIN-Umgehung und Klartext-Bearbeitung gesperrter Karten (I-13, I-39, N5a, N5b) sowie das stille Scheitern der PIN-Sperre bei großen Inhalten (N2). Die R02-Suite (29 Tests) läuft auf dem R02-Stand vollständig grün; auf dem Ausgangsstand `develop` scheitern dieselben 20 Sicherheitstests, die 9 Positiv- und Kompatibilitätskontrollen bestehen auf beiden Ständen.

Das PIN-Format ist unverändert (AES-GCM-256, PBKDF2-SHA-256 × 150 000, `{cipher, iv, salt}`, PIN bytegenau); bestehende verschlüsselte Karten und alte Backups bleiben lesbar. Keine Änderung an Schema, Storage-Keys, Backup-Format, Supabase-Schema oder RPC-Protokoll. CSP/SRI/Dependency-Pinning bleiben bewusst R02b.

Empfehlung: **MERGE READY** (Details in Abschnitt 7).

## 1. Git-Ausgangslage und finaler HEAD

| Ref | SHA | Prüfung |
| --- | --- | --- |
| `origin/develop` | `35bde4c7fdbe6c55f659ba721dc3ddecbe870754` | `git fetch` vor Beginn, identisch mit Auftrag; Arbeitsbaum sauber |
| `develop` ↔ R01.1-Head `734b09f` | baumgleich | `git diff 734b09f 35bde4c` leer → R01.1-Belege gelten unverändert als Referenz für `develop` |
| Branch | `fix/r02-security-privacy-hardening` | von `origin/develop` erstellt |

Commits (nur `src/js/app.js`, produktiv +199 / −56):

| Commit | Inhalt | Diff |
| --- | --- | --- |
| `1530138` | S1 · Stored XSS, Import-Validierung, sichere Downloads | +64 / −18 |
| `614d820` | S3 + S4 · zentrale PIN-Zugriffsregel, robuste PIN-Kryptografie | +107 / −34 |
| `ce2a64e` | S2 · Paste-/Drop-Erfassung nur auf dem Board | +28 / −4 |
| Doku-Commit | dieser Bericht, Testsuite und Belege unter `docs/runs/R02-security-privacy-hardening/` | SHA in der CUTLER-Meldung |

Jeder Code-Commit besteht für sich `node --check`. Kein PR, kein Merge, kein Deployment, kein Kontakt zu Supabase.

## 2. Implementierung S1–S4

### S1 · Stored XSS (I-31, I-32, I-33b)

**Sinks.**
- `renderContextRows()` setzt Labels per `textContent`. Nur statische App-Icons werden noch als Markup eingefügt. Farbpunkte entstehen als DOM-Element (`colorSwatch()`), Farbe per CSSOM, nie per Template-String.
- Share-Sheet-Zeilen ebenso (Labels als Text).
- Der Datei-Badge (Dateiendung, max. 4 Zeichen) wird zusätzlich escaped (R00: nicht ausnutzbar, Defense in Depth).

**Sicherheitsgrenze.** `normalizeState()`/`normalizeSpaceData()`/`normalizeItem()` sind bereits der einzige Eingang für Laden, Board- und Space-Import, Cloud-Apply, Recovery, Undo/Redo und die Legacy-Migration. Dort gilt jetzt:
- Space-Farbe nur als `#rgb`, `#rgba`, `#rrggbb` oder `#rrggbbaa`, sonst entfernt. Die App hat nie andere Formate erzeugt (`SPACE_COLORS`, Git-Historie geprüft).
- MIME nur als gültiges Token `typ/subtyp` mit optionalen Parametern (`audio/webm;codecs=opus` bleibt), sonst `application/octet-stream`.
- Nicht-Text-Inhalte nur als `data:`-URL. `javascript:`, `vbscript:`, `http(s):`, `blob:` und Varianten mit Leerzeichen oder Großschreibung werden zu `data:null`. Die Karte selbst (Name, Metadaten) bleibt erhalten. Alle legitimen Erfassungswege (Datei, Paste, Drop, Bildbearbeitung, Sprachmemo) erzeugen ausschließlich `data:`-URLs.
- Der Space-Import (`importSpacePayload`) prüft die Farbe zusätzlich, weil er die Farbe außerhalb von `normalizeState` übernimmt.

**Downloads.** `dataUrlToBlob()` dekodiert die gespeicherte `data:`-URL lokal (kein `fetch`, keine Navigation). Herunterladen, Kopieren, Teilen und ZIP verwenden nur noch diesen Blob über den vorhandenen `downloadBlob()`. Fehlt ein gültiger Inhalt: „Download nicht möglich · Dateiinhalt fehlt oder ist ungültig“. Drag-out setzt `DownloadURL` nur für `data:`-URLs.

### S2 · Clipboard Privacy (I-02, N1)

Ein Paste wird nur dann zur Karte, wenn es **auf das Board** zielt (`isBoardPaste()`):
- kein editierbares Element im `composedPath()` des Events und keines fokussiert (auch in Shadow Roots): `input` außer Button-/Checkbox-/Datei-artigen Typen, also auch `password`, `email`, `search`, PIN; `textarea`; `select`; `contenteditable` samt Kindelementen; `role="textbox"`;
- kein offener Dialog (`.overlay.show`), außer der Ordneransicht, in der Board-Paste schon bisher funktionierte.

Unverändert bleiben:
- Strg/Cmd+V auf dem Board;
- der Dialog „Zwischenablage einfügen“ (dort füllt Paste nur das Textfeld, die Karte entsteht erst mit „Ablegen“);
- Kontextmenü „Einfügen“;
- Bild-Paste.

Zusätzlich bleibt Text, der in ein Feld **gezogen** wird, in diesem Feld. Dateien werden weiter immer erfasst, weil der Browser-Default sonst die Seite verlassen würde.

### S3 · PIN-Zugriff (I-13, I-39, N5a, N5b)

**Eine zentrale Regel** im Abschnitt „ACCESS POLICY FOR LOCKED CARDS“:
- `openPreview()` ist der einzige Vorschau-Eingang (Kartenschaltfläche, Schnellvorschau, Suche, Inspector, Speicherübersicht, Verlauf, Favoriten, Duplikate). Gesperrte Karten leitet er immer in die PIN-Abfrage.
- `contentAccessAllowed(item)` verweigert jeden Inhaltszugriff auf gesperrte Karten: Kopieren, Herunterladen, Teilen, OCR, Farbpalette, Burn-Link.
- `contentEditAllowed(item)` verlangt zusätzlich: keine PIN-Vorschau-Kopie und eine Karte, die tatsächlich im Board liegt (Identitätsprüfung über alle Spaces). Das gilt auch beim Sperren.
- Text-, Bild- und Datei-Editor sowie der Inline-Editor prüfen beim **Speichern** erneut, ob die Karte inzwischen gesperrt ist.
- Gesperrte Karten werden beim ZIP-Export übersprungen (I-25, vorher Absturz).

**PIN-entsperrte Vorschau = schreibgeschützt.**
- Die Klartext-Kopie wird in einem `WeakSet` (`unlockedViews`) markiert.
- Die Vorschau zeigt Kopieren und Herunterladen. „Inhalt bearbeiten“ ist deaktiviert (Tooltip: „Bearbeiten erst nach „PIN entfernen“ möglich“).
- „Teilen“ entfällt, weil das Share-Sheet „In anderen Space kopieren“ enthält und damit eine unverschlüsselte Duplikatkarte entstehen würde.
- Bearbeiten bleibt bis zur vollständigen Entsperrung („PIN entfernen“) bewusst deaktiviert, wie im Auftrag als Rückfall vorgesehen.

### S4 · PIN-Kryptografie (N2)

- `bufToBase64()` arbeitet in Blöcken von 32 KiB (`String.fromCharCode.apply` auf `subarray`) statt eines Spreads über den gesamten Puffer. Die Ausgabe ist byte-identisch; nur der Stack-Überlauf ab etwa 120–250 KB entfällt.
- Unverändert: AES-GCM-256, PBKDF2-SHA-256 mit 150 000 Iterationen, 16-Byte-Salt, 12-Byte-IV, Feldnamen und Base64-Kodierung. Die PIN geht unverändert als `TextEncoder`-Bytes ein: keine Normalisierung, kein Trim.

**Sperren ist atomar.** `encryptPayloadWithPin()` liefert nur das Chiffrat. Erst danach wird geprüft, ob
- die Karte noch dieselbe ist, im Board liegt und nicht gesperrt ist,
- und das Chiffrat in den lokalen Speicher passt (`MAX_LOCAL_STATE_CHARS`).

Erst dann folgen `mutationCheckpoint` und eine einzige Zuweisung. Ein Fehler hinterlässt deshalb weder eine halb gesperrte Karte noch einen Undo-Eintrag.

**Ehrliche Meldungen.**

| Situation | Meldung |
| --- | --- |
| Sperren erfolgreich | `showEditSaveToast` aus R01.1 („PIN-Sperre gespeichert“ bzw. „… übernommen · Speichern fehlgeschlagen/gesperrt/Temporärer Modus“) |
| Verschlüsselung scheitert | „Sperren fehlgeschlagen · Karte bleibt unverändert“ |
| Chiffrat passt nicht in den Speicher | „Sperren nicht möglich · verschlüsselte Karte passt nicht in den lokalen Speicher“ |
| Karte während der Schlüsselableitung geändert | „Sperren abgebrochen · Karte wurde inzwischen geändert“ |
| AES-GCM-Authentifizierung scheitert | „Falscher PIN“ |
| PIN-Daten fehlen oder sind kein gültiges Base64 | „Entschlüsselung fehlgeschlagen · PIN-Daten sind beschädigt oder unvollständig“ |
| `crypto.subtle` nicht verfügbar | „PIN-Schutz hier nicht verfügbar“ |

Entsperren nutzt ebenfalls `showEditSaveToast` („Entsperrung gespeichert“ bzw. ehrlicher Fehlerzustand) statt eines pauschalen „Entsperrt“.

## 3. Testmatrix

Umgebung: macOS, Node v24.18.1, Playwright 1.63.0, Chromium headless. Jeder Stand wurde als `git archive`-Snapshot über `python3 -m http.server` auf 127.0.0.1 ausgeliefert. Jeder Test läuft in einem frischen, isolierten Browser-Kontext.

Externe Hosts:
- Angefragt und abgefangen wurden nur `fonts.googleapis.com`, `cdnjs.cloudflare.com` und `cdn.jsdelivr.net`.
- Auf dem Ausgangsstand fragte die App zusätzlich `example.invalid` an (X2b, CSS-`url()` aus einer importierten Farbe). Der Request wurde abgefangen und hat das Gerät nicht verlassen.
- Supabase lief nur als In-Memory-Mock (`supabaseContacted:false`).

Belege in `evidence/`:
- `r02-security.mjs` (Suite);
- `r02-results-r02-ce2a64e.json` + `r02-security-r02-ce2a64e.log`;
- `r02-results-baseline-35bde4c.json` + `r02-security-baseline-35bde4c.log`.

### 3.1 R02-Suite (29 Tests)

| Test | Deckt ab | R02 `ce2a64e` | `develop` `35bde4c` | Kernbeobachtung R02 (Ausgangsstand) |
| --- | --- | --- | --- | --- |
| X1 | I-31 | **PASS** | FAIL | Space-Name `<img src=x onerror=…>`: im Picker und in Bestätigungen als Text, 0 Handler (Handler ausgeführt) |
| X1b | I-31 (Import) | **PASS** | FAIL | importierte Payload-Namen bleiben erhalten, nur als Text (Handler ausgeführt, Picker leer) |
| X2 | I-32 | **PASS** | FAIL | Farb-Payload beim Space-Import verworfen (Payload gespeichert, Handler ausgeführt) |
| X2b | I-32 (Board/Cloud-Grenze) | **PASS** | FAIL | `#4f6bff` und `#abc` bleiben, `url(javascript:…)` und CSS-Anhang verworfen (alles gespeichert, externer Request) |
| X2c | Positivkontrolle Farbe | **PASS** | PASS | Picker speichert `#ff6b57`, Swatch korrekt |
| X3 | I-33b | **PASS** | FAIL | 7 unsichere Referenzen (`javascript:`, getarnt, `vbscript:`, `https:`, `blob:`, Bild, Audio) → `data:null`; kein Skript, kein Download, keine Navigation (Ausgangsstand: Skript bricht die Seite, Testabbruch) |
| X3b | I-33b (Bestand) | **PASS** | FAIL | bereits gespeicherter `javascript:`-Eintrag wird beim Laden neutralisiert (Handler ausgeführt) |
| X4 | sichere Downloads | **PASS** | PASS | PDF, CSV, PNG, Text über Vorschau und Menü byte-identisch, URL unverändert |
| X5 | MIME-Grenze | **PASS** | FAIL | 4 legitime MIME-Typen unverändert, 3 Payloads → `application/octet-stream` |
| X6 | Kompatibilität | **PASS** | PASS | Bestandsboard, Backup v1, Legacy-Rohformat, Space-Export→Import: alle Karten inkl. PIN-Karte und Farben byte-identisch |
| P1 | I-02, N1 | **PASS** | FAIL | 17 Felder/Kontexte, 0 Karten (Ausgangsstand: 12 von 17 erzeugen eine Karte, u. a. Cloud-Passwort, PIN, contenteditable, Shadow DOM) |
| P1k | N1 (echte Tastatur) | **PASS** | FAIL | echtes Strg/Cmd+V in Cloud-E-Mail und -Passwort: Feld erhält den Text, 0 Karten (je 1 Karte) |
| P2 | Positivkontrollen | **PASS** | PASS | Board-Paste (synthetisch und echte Tastatur), offener Ordner, Text-Dialog, „Einfügen“, Bild-Paste: je genau 1 Karte |
| P3 | Drop | **PASS** | FAIL | Text ins Passwortfeld gezogen: keine Karte; aufs Board: 1 Karte |
| B1 | I-13 | **PASS** | FAIL | Schnellvorschau auf gesperrter Karte → PIN-Abfrage (Vorschau ohne PIN) |
| B2 | I-39 | **PASS** | FAIL | Suche + Enter → PIN-Abfrage (Vorschau ohne PIN) |
| B3 | Inspector | **PASS** | FAIL | „Vorschau öffnen“ → PIN-Abfrage (Vorschau ohne PIN) |
| B4 | Speicherübersicht | **PASS** | FAIL | Vorschau-Schaltfläche → PIN-Abfrage (Vorschau ohne PIN) |
| B5 | Favoriten (Kontrolle) | **PASS** | PASS | war bereits geschützt |
| B6 | Menüs (Kontrolle) | **PASS** | PASS | Menü ohne Inhaltsaktionen, kein Inline-Editor, kein Drag-out |
| B7 | N5b | **PASS** | FAIL | PIN-Vorschau: Klartext sichtbar, „Inhalt bearbeiten“ deaktiviert, kein „Teilen“, Kopieren/Download = Klartext, Karte unverändert (Editor öffnet die Kopie, Änderung geht verloren) |
| B8 | N5a | **PASS** | FAIL | kein Weg zum Editor ohne PIN (Ausgangsstand: Umgehungsvorschau → Editor → **Karte halb gesperrt: `locked:true` + Klartext gespeichert**) |
| B9 | Fehlerpfade | **PASS** | FAIL | falscher PIN → „Falscher PIN“; beschädigte Daten → „Entschlüsselung fehlgeschlagen …“; Karte unverändert (Ausgangsstand: immer „Falscher PIN“) |
| C1 | Testvektoren | **PASS** | PASS | App-Chiffrat mit Node-Referenz entschlüsselt (Salt 16 B, IV 12 B); Seed-Vektor (PIN 1234) in der App entsperrt |
| C1b | PIN bytegenau | **PASS** | PASS | PIN `" 1é3 "`: getrimmt → falsch, NFD → falsch, exakt → entsperrt |
| C2 | N2 große Inhalte | **PASS** | FAIL | Bild 1,96 M Zeichen und Datei 0,82 M Zeichen gesperrt, Referenz = Original, Bild nach PIN sichtbar, Datei nach Entsperren byte-identisch (Ausgangsstand: Sperre scheitert still, Testabbruch) |
| C3 | Speichergrenze | **PASS** | FAIL | „Sperren nicht möglich …“, Stand unverändert, Strg+Z: „Nichts zum Rückgängigmachen“ (`RangeError: Maximum call stack size exceeded`, kein Hinweis, Undo-Eintrag) |
| C4 | Verschlüsselungsfehler | **PASS** | FAIL | „Sperren fehlgeschlagen · Karte bleibt unverändert“, kein Undo-Eintrag (unbehandelter Fehler, kein Hinweis, Undo-Eintrag) |
| C5 | Legacy-Backups | **PASS** | PASS | PIN-Karte aus Backup v1 und Legacy-Rohformat mit PIN 1234 lesbar |

Summe: R02 **29 PASS**; `develop` 20 FAIL / 9 PASS (alle 9 sind Kontrollen).

### 3.2 R01-Regression (Save-ACKs, Cloud-Guards)

Die unveränderte R01-Suite (`../R01-data-loss-guards/evidence/r01-guards.mjs`) lief einmal im `ce2a64e`-Snapshot. Belege: `evidence/r01-results-r02-ce2a64e.json` + `r01-guards-r02-ce2a64e.log`; Referenz ist `r01-results-r01.1-77a2fcf.json`, gültig für `develop`, weil der Baum identisch ist.

| Tests | R01.1 `77a2fcf` (= `develop`) | **R02 `ce2a64e`** |
| --- | --- | --- |
| A1, A2, A2b, A2c (G1 unlesbarer State) | PASS | **PASS** |
| A3, A3b, A4, S1 (G2 Quota/Save-ACK) | PASS | **PASS** |
| A5, A5b (G3 Recovery-Pflicht) | PASS | **PASS** |
| A6, A6b, A7 (G4 Cloud nur mit lokaler Bestätigung) | PASS | **PASS** |
| A8 (G5 Fremd-Tab, sequenziell) | PASS | **PASS** |
| A8r (gleichzeitige Tabs) | RISK | **RISK** (unverändert, R05) |
| E1–E10 (ehrliche Save-Toasts) | PASS | **PASS** |
| A10 `node --check` (5 Module) | PASS | **PASS** |

Damit sind Save-ACKs, Sperrlogik und Cloud-Guards aus R01/R01.1 unverändert wirksam. Supabase wurde nicht kontaktiert.

### 3.3 Vollständige bestehende Regression (A9, Run-01-Suite, 58 Szenarien)

Einmaliger Komplettlauf der Run-01-Suite (`harness/qa-interactions.mjs`, unverändert) im `ce2a64e`-Snapshot, mit JSZip 3.10.1 lokal.

Belege:
- `evidence/qa-results-r02-ce2a64e.json` + `qa-run-r02-ce2a64e.log`;
- Vergleich `evidence/a9-compare-r02.json`, erzeugt mit dem R01-Skript `compare-a9.mjs`. Dessen Feld `r01` steht dort für den neuen Lauf.

Referenz ist `qa-results-r01.1-77a2fcf.json` (= `develop`). Ein zusätzlicher Baseline-Komplettlauf war deshalb nicht nötig.

| | PASS | DEFECT | OBSERVATION | NOT VERIFIED | BLOCKED |
| --- | --- | --- | --- | --- | --- |
| `develop` (R01.1-Lauf) | 24 | 26 | 5 | 2 | 1 |
| **R02 `ce2a64e`** | **30** | **19** | **6** | 2 | 1 |

**PASS → nicht-PASS: keine → A9 PASS.** Geänderte Szenarien:

| Szenario | `develop` → R02 | Erklärung |
| --- | --- | --- |
| I-02 | DEFECT → PASS | S2 |
| I-13 | DEFECT → PASS | S3 |
| I-39 | DEFECT → PASS | S3 |
| I-31 | DEFECT → PASS | S1 |
| I-32 | DEFECT → PASS | S1 |
| I-25 | DEFECT → PASS | Nebeneffekt von S3: PIN-Karten werden im ZIP übersprungen, `Projekt Alpha.zip` entsteht ohne Fehler |
| I-33b | DEFECT → OBSERVATION | Kein Skript mehr. Die Run-01-Klassifizierung meldet OBSERVATION, weil die Karte importiert wird. Das ist beabsichtigt: Die Karte bleibt mit Name und Metadaten erhalten, nur die unsichere Referenz wird zu `null` (X3). |

Unverändert DEFECT bleiben die Befunde außerhalb des R02-Umfangs, z. B. I-26 (Klartext-Name), I-46 (Menü im Ordner), Cloud-Sync I-C03/I-C05 sowie BLOCKED I-35 (Testartefakt, siehe R01-Bericht 3.1).

## 4. Vorher/Nachher der bestätigten Schwachstellen

| Befund | Vorher (`develop`) | Nachher (R02) | Beleg |
| --- | --- | --- | --- |
| I-31 Space-Name im Menü | `innerHTML` → Skript läuft | Label per `textContent` | X1, X1b, A9 I-31 |
| I-32 Space-Farbe | ungeprüft in `style="…${color}"` → Skript läuft | nur Hex an der Normalisierungsgrenze; Swatch per CSSOM | X2, X2b, A9 I-32 |
| I-33b Datei-Referenz | `a.href = item.data` → `javascript:` läuft | nur `data:`; Download per lokalem Blob | X3, X3b, X4, A9 I-33b |
| I-02 Paste in Feldern | 12/17 Felder erzeugen Karten | 0/17 | P1, P1k, A9 I-02 |
| N1 Cloud-Passwort | Passwort wird Karte (und ggf. synchronisiert) | bleibt im Feld | P1, P1k, P3 |
| I-13 Schnellvorschau | leere Vorschau ohne PIN | PIN-Abfrage | B1, A9 I-13 |
| I-39 Suche | leere Vorschau ohne PIN | PIN-Abfrage | B2, A9 I-39 |
| N5a Bearbeiten aus Umgehungsvorschau | Klartext neben `locked:true` gespeichert | kein Zugang | B8 |
| N5b Bearbeiten in PIN-Vorschau | Änderung an Kopie, verloren | Bearbeiten deaktiviert | B7 |
| N2 große Inhalte | `RangeError`, Sperre scheitert still, Undo-Eintrag | Sperre funktioniert; Fehler mit Meldung, ohne Undo-Eintrag | C2, C3, C4 |
| I-25 ZIP mit PIN-Karte (Nebeneffekt) | `TypeError`, kein ZIP | PIN-Karte übersprungen, ZIP entsteht | A9 I-25 |

## 5. PIN- und Backup-Kompatibilität

- **Format:** Algorithmus, Parameter, Feldnamen und Kodierung sind unverändert. C1 belegt beide Richtungen: Ein in Node mit dem Referenzalgorithmus erzeugter Vektor (R00-Seed, PIN 1234) wird in der App entsperrt, und App-Chiffrat entschlüsselt der Node-Referenzcode.
- **PIN bytegenau:** C1b; Leerzeichen und Unicode-Form bleiben signifikant, wie bisher.
- **Große Inhalte:** C2 (Bild 1,96 M, Datei 0,82 M Zeichen), Referenzprüfung außerhalb der App.
- **Backups:**
  - Backup v1, Legacy-Rohformat (V16–V22) und Space-Export bleiben byte-identisch (X6).
  - PIN-Karten aus beiden Backup-Formaten sind lesbar (C5).
  - Bestands-`localStorage` wird nach dem nächsten Speichern unverändert zurückgeschrieben (X6 „Bestand“).
- **Was sich an Daten ändern kann:** nur Werte, die die App selbst nie erzeugt:
  - Farben, die kein Hex sind, fallen weg;
  - ungültige MIME-Typen werden zu `application/octet-stream`;
  - Nicht-`data:`-Referenzen von Dateien und Bildern werden zu `null`.

  Das geschieht im RAM beim Laden bzw. Import und wird mit dem nächsten Speichern dauerhaft.
- **Rollback:** Ein `git revert` der drei Code-Commits stellt das alte Verhalten her. Es gibt kein neues Format und keinen neuen Key, deshalb ist keine Rückmigration nötig. Neutralisierte Werte (siehe oben) kommen nicht zurück; sie waren nicht legitim.

## 6. Offene Risiken und bewusst verschobene Arbeiten

**R02b (eigener Lauf, wie beauftragt):**
- CSP (Tesseract-Worker und Blob-URLs, Inline-`style`-Attribute und `innerHTML`-Icons erfordern eine sorgfältige Policy);
- SRI für die drei CDN-Skripte;
- Pinning von `supabase-js@2` und `tesseract.js@5` auf exakte Versionen.

R02 hat dafür vorgearbeitet: Downloads nutzen kein `fetch(data:)` mehr, sodass `connect-src` später ohne `data:` auskommen kann.

**Weiter offen (nicht im R02-Auftrag):**
- **I-26:** Der Name einer gesperrten Textkarte (die ersten 40 Zeichen) bleibt Klartext. Er ist in Karte, Suche, Backup und Cloud sichtbar; die Suche findet gesperrte Karten über diesen Namen (B2 öffnet danach nur die PIN-Abfrage).
- **PIN-Policy:** Jede nicht-leere PIN wird akzeptiert; 4-stellige PINs sind offline brute-forcebar. Eine Policy-Änderung wäre eine UX- und Kompatibilitätsentscheidung.
- **Undo nach dem Sperren** stellt die unverschlüsselte Karte wieder her (normales Undo-Verhalten, der Snapshot liegt nur im RAM). Wer sperrt und dann Strg+Z drückt, hat wieder Klartext gespeichert.
- **I-27 Burn-Link:** Das Geheimnis steckt im Link, ohne Backend.
- **Cloud-Sync** (I-C02–I-C05), Supabase-Backend (RLS/Policies) unverifiziert (Gate H2), Single-Writer (R05): unverändert aus R01.

**Bewusste Verhaltensänderungen:**
- Paste bei offenem Dialog (außer Ordneransicht) erzeugt keine Karte mehr. Vorher entstand die Karte unsichtbar hinter dem Dialog.
- Die PIN-Vorschau bietet kein „Teilen“ mehr.
- Dateikarten mit neutralisierter Referenz bleiben als Karte sichtbar. „Herunterladen“ meldet dann „Download nicht möglich …“.

**Grenzen der Tests:**
- Getestet wurde nur Chromium; Safari/Firefox (Paste-/Drop-Events, `composedPath`, Clipboard-Rechte) wurden nicht geprüft.
- Paste wird synthetisch ausgelöst (`composed:true`, wie der Browser). P1k und P2 belegen zusätzlich echte Tastatur-Pastes in Chromium.
- Shadow DOM ist heute in der App nicht im Einsatz und wurde mit einem injizierten Testelement geprüft.

## 7. Empfehlung

**MERGE READY**:
- alle Sicherheitsziele S1–S4 umgesetzt und belegt;
- PIN- und Backup-Kompatibilität nachgewiesen;
- R01-Save-ACKs und Cloud-Guards unverändert;
- keine Regression in der Run-01-Suite (Abschnitt 3.3).

Vorschlag für das Human Gate:
1. Review der drei Code-Commits (`1530138`, `614d820`, `ce2a64e`), danach PR `fix/r02-security-privacy-hardening → develop`.
2. Vor dem Release ein manueller Smoke-Test in Safari und Firefox mit Test-Board: Strg/Cmd+V auf dem Board und im Cloud-Passwortfeld, PIN sperren/entsperren eines großen Bildes, Datei-Download.
3. R02b (CSP/SRI/Pinning) als eigener, kontrollierter Lauf.

STOP am Human Gate. Kein PR, kein Merge, kein Deployment. `develop`, `main`, Production und Supabase wurden nicht berührt.

## Reproduktion

```bash
# einmalig: Playwright 1.63 und JSZip 3.10.1 lokal (nicht im Repo)
git archive ce2a64e | tar -x -C /tmp/cb-r02 && (cd /tmp/cb-r02 && python3 -m http.server 8769 --bind 127.0.0.1)
git archive 35bde4c | tar -x -C /tmp/cb-base && (cd /tmp/cb-base && python3 -m http.server 8768 --bind 127.0.0.1)

cd docs/runs/R02-security-privacy-hardening/evidence
CB_BASE=http://127.0.0.1:8769/ R02_LABEL=r02-ce2a64e PLAYWRIGHT_PATH=<…/node_modules/playwright> node r02-security.mjs
CB_BASE=http://127.0.0.1:8768/ R02_LABEL=baseline-35bde4c PLAYWRIGHT_PATH=<…> node r02-security.mjs

# R01-Suite und A9 im Snapshot (Pfad ohne Leerzeichen, siehe R01-Bericht):
cd /tmp/cb-r02/docs/runs/R01-data-loss-guards/evidence && CB_BASE=http://127.0.0.1:8769/ R01_LABEL=r02-ce2a64e PLAYWRIGHT_PATH=<…> JSZIP_PATH=<…> node r01-guards.mjs
cd /tmp/cb-r02/docs/runs/R01-data-loss-guards && CB_BASE=http://127.0.0.1:8769/ PLAYWRIGHT_PATH=<…> JSZIP_PATH=<…> node harness/qa-interactions.mjs
node docs/runs/R01-data-loss-guards/evidence/compare-a9.mjs <qa-results-r01.1-77a2fcf.json> <qa-results-r02-ce2a64e.json> a9-compare-r02.json
```
