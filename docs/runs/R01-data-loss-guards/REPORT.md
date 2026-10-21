# CUTLER R01 — Data-Loss Guards (Legacy)

Stand: 21.10.2026 · Branch `fix/r01-data-loss-guards` · Modus: isolierter Coding-Run, STOP am Human Gate

> **Nachtrag R01.1 (Safety Closure vor PR):** Abschnitte 1–6 beschreiben R01 unverändert (Stand `7eb65b9`). Was R01.1 ergänzt und korrigiert, steht abgegrenzt in [Abschnitt 7](#7-r011--final-safety-closure).

## Kurzfazit

Alle in R00 nachgewiesenen Datenverlust-Pfade für lokale Speicherung, Import und Cloud-Sync (I-35, I-36, N3, N3b, N4) sind auf Commit `025287f` geschlossen und mit synthetischen Daten belegt. Derselbe Testlauf gegen den unveränderten Stand `ac721fe` liefert für jeden dieser Pfade FAIL. N8 (zwei Tabs) ist **teilweise** abgesichert: Sequenzielle Fremdschreibvorgänge werden erkannt und gesperrt. Echte gleichzeitige Schreibrennen verlieren weiterhin eine Karte. Das geschieht aber nicht mehr still: Beide Tabs werden gesperrt und bieten einen RAM-Export. Eine Single-Writer-Garantie bleibt Aufgabe von R05 (Web Locks).

Keine Änderung an Schema, Storage-Keys, Serialisierung, Backup-Format, PIN-Format oder am Snapshot-/RPC-Protokoll. Kein Merge, kein PR, kein Deployment, kein Kontakt zu Supabase.

## 1. Ausgangslage, Branch und Diff

| Ref | SHA | Prüfung |
| --- | --- | --- |
| `main` | `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` | `git ls-remote`, identisch mit R00 |
| `develop` | `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` | identisch mit R00 |
| `audit/copyboard-technical-baseline-run-01` | `33600a1c5d5c9c842ff84585e429796f0dff7c3e` | identisch mit R00; **nicht** gemergt |
| `feature/notes-editor`, `feature/copyboard-v2-react` | `ac721fe…` | keine eigenen Commits (der zweite fehlt in der R00-Tabelle, ist aber unkritisch) |

- Arbeitsbaum vor Beginn: sauber. Branch `fix/r01-data-loss-guards` von `origin/develop` (`ac721fe`) erstellt.
- Produktiver Code-Commit: `025287f` „fix(r01): add data-loss guards …“.
- Diff `ac721fe..025287f`: 5 Dateien, +199 / −59 (258 geänderte Zeilen, Grenze 300).

| Datei | + / − |
| --- | --- |
| `src/js/app.js` | +181 / −55 |
| `index.html` | +8 / −2 |
| `src/styles/app.css` | +5 / −0 |
| `src/js/config/constants.js` | +3 / −1 |
| `README.md` | +2 / −1 |

Testdateien und dieser Bericht liegen in einem separaten Commit unter `docs/runs/R01-data-loss-guards/`.

## 2. Implementierung G1–G5

**Gemeinsamer Mechanismus.** Es gibt genau einen Sperrzustand `persistBlockedReason` (`null | 'quota' | 'foreign-writer' | 'unreadable-store'`) mit Rangfolge: Quota kann zu Fremd-Tab eskalieren, nie umgekehrt. Bei einer Sperre:
- erscheint ein dauerhafter Hinweis `#persistBlockedBanner` (kein einmaliger Toast) mit passender Aktion (Rohdaten-Export, Backup-Export aus dem RAM oder Neu laden);
- zeigt die Status-Pille „Speichern fehlgeschlagen“ bzw. „Speichern gesperrt“, nie „Gespeichert“;
- lehnt `captureBlocked()` Erfassung, Duplizieren, Kopieren in einen Space, Space duplizieren, Space- und Board-Import sowie Recovery-Restore ab;
- bleibt Löschen erlaubt.

**G1 · Unlesbarer oder zu neuer Zustand (I-35).** `loadPersistedState()` liefert jetzt `absent | valid | unreadable | unsupported`.
- `unreadable`: kein gültiges JSON, kein Objekt oder ein Normalisierungsfehler.
- `unsupported`: `UNSUPPORTED_*`, also eine State- oder Settings-`schemaVersion`, die größer ist als die unterstützte.

In beiden Fällen setzt die App die Sperre `unreadable-store` und läuft nur im Speicher mit `defaultState()`. Kein Schreibpfad erreicht dann `copyboard_state_v1`, und weder die Legacy-`window.storage`-Migration noch der Cloud-Sync werden gestartet. Der Originalstring bleibt nur im RAM und lässt sich über „Rohdaten exportieren“ unverändert herunterladen; es entsteht keine zweite localStorage-Kopie. Ein „Neu beginnen“ gibt es bewusst nicht.

**G2 · Quota und Schreibfehler (I-36).**
- `MAX_LOCAL_STATE_CHARS = 4_500_000` (UTF-16-Codeeinheiten von `JSON.stringify(state)`) ersetzt `MAX_TOTAL_BYTES` (20 MiB). Die Grenze ist ein konservativer Kandidat, keine Quota-Garantie. Sie gilt für `addItem` samt 90-%-Warnung, für den Board-Import, für den Cloud-Apply und für die Speicheranzeige.
- `flushPersistedState()` prüft den Write per Read-back (`getItem === serialized`). Nur ein verifizierter Write aktualisiert `lastPersistedJson`, `lastSavedAt`, den Status und die Cloud-Markierung.
- Ein Fehlschlag setzt die Sperre `quota`.
- Der Zeitstempel `copyboard_autosave_last_saved` wird in einem eigenen `try` geschrieben (best effort); sein Fehlschlag ist kein Save-Fehler mehr (S1).
- Rettungsweg: „Backup exportieren“ lädt den aktuellen RAM-Zustand als `copyboard-backup v1` herunter, ohne localStorage-Write und ohne Netzwerk.
- Verlassen der Seite bei aktiver Quota-Sperre und ungespeicherten Änderungen löst die bestehende `beforeunload`-Warnung aus.

**Auflösung des Quota-Widerspruchs (Quota-Recovery-Commit).** `quota` blockiert Flushes *nicht*. Unter `quota` versucht jeder Save weiter, den vollständigen aktuellen Zustand zu schreiben. Das ist sicher, weil `localStorage.setItem` atomar ist: Bei `QuotaExceededError` bleibt der alte Wert unverändert. Ein Write enthält immer den gesamten RAM-Zustand, also auch die bisher ungespeicherten Änderungen; es wird nichts still verworfen. Die Sperre fällt nur in zwei Fällen:
1. nach einem verifizierten Write (setItem plus Read-back);
2. wenn der RAM-Zustand wieder exakt dem zuletzt verifizierten Save entspricht.

Neue Inhalte bleiben bis dahin gesperrt; Löschen kann so tatsächlich Platz schaffen (A4). Die Sperren `foreign-writer` und `unreadable-store` blockieren dagegen jeden Write.

**G3 · Recovery-Pflicht (N4).** Der Board-Import (`importBoardState`) und das manuelle Laden des Cloud-Stands bei lokalen Änderungen (`cloudLoadLatest({manual:true})`) brechen ab, wenn `savePreImportRecovery()` `false` liefert. Der aktuelle Stand bleibt dann unverändert, und ein Toast nennt den Grund. Der Toast „Board importiert · Rückkehr möglich“ erscheint nur noch, wenn die Sicherung existiert. Zusätzlich löscht `restorePreImportRecovery()` den Wiederherstellungspunkt nur noch nach einem verifizierten Save; vorher ging er auch bei gescheitertem Speichern verloren.

**G4 · Cloud nur mit lokaler Bestätigung (N3, N3b).**
- `cloudApplySnapshot` lehnt ab, bevor sich der State ändert:
  - wenn der normalisierte Snapshot `MAX_LOCAL_STATE_CHARS` überschreitet;
  - wenn eine Sperre aktiv oder AutoSave aus ist (fail-closed).
- Danach muss `persistState({immediate:true, force:true})` den lokalen Commit verifiziert bestätigen. Andernfalls werden der vorherige State und die Darstellung wiederhergestellt. `cloudRevision`, `cloudObjectPath`, `cloudLastSyncedHash`, `cloudDirty` und die lokale Cloud-Meta bleiben unverändert, und der Status nennt den Grund.
- `cloudUploadNow` flusht zuerst. Hochgeladen wird ausschließlich `lastPersistedJson`, und nur, wenn der Flush bestätigt, dass dieser String dem aktiven State entspricht. Andernfalls gibt es keinen Upload, und der Status lautet „Lokale Änderungen nicht gespeichert – Upload angehalten“.
- Snapshot-Protokoll, RPC-Parameter und das Löschen des Vorgängerobjekts nach erfolgreichem Publish sind unverändert.

**G5 · Fremder Tab (N8), nur Risikobegrenzung.** Ein `storage`-Listener reagiert auf `key === STORAGE_KEY` mit `newValue !== lastPersistedJson` und auf `key === null` (`clear()`). Er setzt die Sperre `foreign-writer`: Der Hinweis lautet „In einem anderen Tab geändert. Neu laden, um weiterzuarbeiten.“ und bietet „Neu laden“ sowie „Backup exportieren“. Danach schreibt der Tab nichts mehr, auch nicht bei `pagehide`/`beforeunload`, und lädt nichts in die Cloud. storage-Events sind nicht atomar; zwischen zwei nahezu gleichzeitigen Writes gibt es keinen Schutz (A8r). Eine echte Single-Writer-Garantie (Web Locks + BroadcastChannel) ist bewusst nicht Teil dieses Mini-Runs → **Gate R05**.

## 3. Akzeptanznachweise

Umgebung: macOS, Node v24.18.1, Playwright 1.63.0, Chromium 153 headless; App über `python3 -m http.server` auf 127.0.0.1. Geprüft wurde jeweils ein Snapshot aus `git archive 025287f` (R01) bzw. `git archive ac721fe` (Baseline). Externe Hosts: nur `fonts.googleapis.com`, `cdnjs.cloudflare.com` und `cdn.jsdelivr.net` wurden angefragt und alle abgefangen. Das Supabase-SDK wurde durch den In-Memory-Mock ersetzt; `*.supabase.co` wurde nie kontaktiert (`supabaseContacted:false`).

Belege in `docs/runs/R01-data-loss-guards/evidence/`:
- `r01-results-r01-025287f.json` + `.log`: R01;
- `r01-results-baseline-ac721fe.json` + `.log`: gleiche Suite auf dem Ausgangsstand;
- `qa-results-r01-025287f.json`, `qa-results-baseline-ac721fe.json` + `qa-run-*.log`, `a9-compare.json`: A9.

| Test | Deckt ab | R01 `025287f` | Baseline `ac721fe` | Kernbeobachtung R01 |
| --- | --- | --- | --- | --- |
| A1 | G1 · I-35 | **PASS** | FAIL | `schemaVersion:2`: Key nach Start, 5 s, Paste und Reload byte-identisch; Hinweis sichtbar; Paste abgelehnt; Rohdaten-Export = Original; 0 Cloud-Operationen |
| A2 | G1 · I-35 | **PASS** | FAIL | abgeschnittenes JSON: wie A1 |
| A2b | G1 | **PASS** | FAIL | `settings.schemaVersion:2` (Zusatzfall): wie A1 |
| A2c | G1 | **PASS** | FAIL | JSON-Array statt Objekt (Zusatzfall): wie A1 |
| A3 | G2 · I-36 | **PASS** | FAIL | 3. Rausch-PNG vor dem Quota-Fehler abgelehnt; nie „fehlgeschlagen“; UI = gespeichert = nach Reload = 2 (3,92 M Zeichen) |
| A3b | G2 · Save-ACK | **PASS** | FAIL | echter setItem-Fehler (Speicher verknappt): dauerhafter Hinweis, Status „Speichern fehlgeschlagen“, gespeicherter Stand unverändert, Paste abgelehnt, RAM-Backup enthält die ungespeicherte Karte, `beforeunload` warnt |
| A4 | G2 · Recovery-Commit | **PASS** | FAIL | Löschen der alten Karte → verifizierter Save inkl. des zuvor ungespeicherten Bildes, Sperre aufgehoben, neuer Paste gespeichert, Reload = UI |
| S1 | G2 · Zeitstempel | **PASS** | FAIL | Zeitstempel-Write scheitert, State gespeichert → Status „Gespeichert“, keine Sperre |
| A5 | G3 · N4 | **PASS** | FAIL | Board mit 3,3 M Zeichen, Recovery passt nicht → „Import abgebrochen …“, Board byte-identisch |
| A5b | G3 · N4 (Cloud) | **PASS** | FAIL | manuelles „Aktualisieren“ bei lokalen Änderungen, Recovery passt nicht → abgebrochen, lokale Änderung erhalten, Cloud unverändert |
| A6 | G4 · N3 | **PASS** | FAIL | 6,3-M-Snapshot, leeres Gerät, Reload: nicht angewendet, keine Cloud-Meta, Revision bleibt 1, Originalobjekt bleibt, 0 Schreibops. Baseline: Revision 2 hochgeladen, Original gelöscht |
| A6b | G4 · Abort/Restore | **PASS** | FAIL | Cloud-Stand (3 M) passt nicht in den verknappten Speicher → Rollback: State und Meta byte-identisch, Status nennt Grund, auch nach Reload kein Upload/Löschen. Baseline: Revision 3 hochgeladen, Revision-2-Objekt gelöscht |
| A7 | G4 · N3b | **PASS** | FAIL | gescheiterter Save, „Synchronisieren“: kein Upload, Revision 1→1, Status „Lokale Änderungen nicht gespeichert – Upload angehalten“. Baseline: Revision 1→2 |
| A8 | G5 · N8 (sequenziell) | **PASS** | FAIL | veralteter Tab gesperrt, sein Paste abgelehnt, Karte aus dem anderen Tab erhalten; nach „Neu laden“ frei; am Ende beide Karten gespeichert |
| A8r | G5 · Restrisiko | **RISK** | RISK | gleichzeitige Writes, 5 Durchläufe: je eine Karte nicht gespeichert (5/5), **aber** beide Tabs gesperrt (RAM-Export möglich). Baseline: 5/5 still verloren, keine Sperre |
| A9 | Regression | **PASS** | Referenz | Run-01-Suite (58 Szenarien): kein PASS→nicht-PASS. Baseline 22 PASS / 29 DEFECT / 5 OBS / 2 NV → R01 23 PASS / 27 DEFECT / 5 OBS / 2 NV / 1 BLOCKED. Zwei Abweichungen, erklärt in 3.1 |
| A10 | Syntax | **PASS** | (n/a) | `node --check` für alle 5 Module. Im Baseline-Lauf prüft A10 den Arbeitsbaum, nicht `ac721fe`, und ist dort ohne Aussage |

### 3.1 A9: erklärte Abweichungen

| Szenario | Baseline → R01 | Erklärung |
| --- | --- | --- |
| I-35 | DEFECT → BLOCKED | Beabsichtigt. Der Run-01-Test ruft nach dem Start `JSON.parse(localStorage.getItem(…))` auf. Weil das abgeschnittene JSON jetzt unverändert erhalten bleibt (das Ziel des Szenarios), wirft der Test selbst einen SyntaxError. Das Verhalten belegen A1/A2 (PASS). Der Run-01-Test muss in R03 angepasst werden. |
| I-38 | DEFECT → PASS | Nebeneffekt. G1 brauchte für den Rohdaten-Export einen Download-Helfer. Er heißt `downloadBlob`, also genau wie die Funktion, die `exportBoardSettings` bisher vergeblich aufrief (ReferenceError). Der Settings-Export funktioniert dadurch wieder. Das war für R03 vorgesehen und ist hier dokumentiert statt verborgen. |
| I-36 | DEFECT → DEFECT | Status im Run-01-Test fest auf DEFECT kodiert. Beobachtung jetzt: kein „fehlgeschlagen“, Toast „Lokales Speicherlimit erreicht“, UI 2 = gespeichert 2 = nach Reload 2. Inhaltlich behoben, siehe A3. |

Hinweis: Die Baseline-Zählung (22/29/5/2) weicht leicht vom committeten Run-01-Ergebnis ab (22/27/6/3; Playwright 1.56.1). Ursache ist die neuere Umgebung (Playwright 1.63, Chromium 153). Für A9 gilt nur der Vergleich zweier Läufe in derselben Umgebung.

### Reproduktion

```bash
# einmalig: Playwright und JSZip 3.10.1 lokal (nicht im Repo), z. B. npm i playwright jszip@3.10.1
git archive 025287f | tar -x -C /tmp/cb-r01 && (cd /tmp/cb-r01 && python3 -m http.server 8766 --bind 127.0.0.1)
git archive ac721fe | tar -x -C /tmp/cb-base && (cd /tmp/cb-base && python3 -m http.server 8765 --bind 127.0.0.1)

cd docs/runs/R01-data-loss-guards/evidence
CB_BASE=http://127.0.0.1:8766/ R01_LABEL=r01-025287f PLAYWRIGHT_PATH=<…/node_modules/playwright> node r01-guards.mjs
CB_BASE=http://127.0.0.1:8765/ R01_LABEL=baseline-ac721fe PLAYWRIGHT_PATH=<…> node r01-guards.mjs

# A9: qa-lib.mjs löst Pfade über URL.pathname auf und scheitert an Leerzeichen im Pfad
# ("CopyBoard 2"). Deshalb harness/ in ein Verzeichnis ohne Leerzeichen kopieren:
cp -r ../harness /tmp/a9/harness && mkdir -p /tmp/a9/evidence && cd /tmp/a9
CB_BASE=http://127.0.0.1:8766/ PLAYWRIGHT_PATH=<…> JSZIP_PATH=<…/jszip/dist/jszip.min.js> node harness/qa-interactions.mjs
node <repo>/docs/runs/R01-data-loss-guards/evidence/compare-a9.mjs <baseline.json> <r01.json> a9-compare.json
```

### Herkunft des Harness

`harness/qa-lib.mjs` und `harness/qa-interactions.mjs` sind byte-identische Kopien aus `33600a1:docs/audits/copyboard-technical-baseline/evidence/` (Git-Blobs `f2bae31` bzw. `20f221e`). Sonst wurde nichts aus dem Audit-Branch übernommen; der Branch wurde nicht gemergt. Die R00-Probes lagen nicht im Repository. `evidence/r01-guards.mjs` setzt die Szenarien deshalb neu nach der R00-Beschreibung um und behauptet nicht, die Original-Probes zu sein.

## 4. Status der R00-Befunde

| Befund | Status nach R01 | Beleg |
| --- | --- | --- |
| I-35 unlesbarer/zu neuer State überschrieben | **geschlossen** | A1, A2, A2b, A2c |
| I-36 Board-Limit über realer Quota, stiller Verlust | **geschlossen** (Grenze 4,5 M; echte Fehler → Sperre) | A3, A3b, A4 |
| N3 Cloud-Apply ignoriert gescheiterten Save → leere Revision, Original gelöscht | **geschlossen** | A6, A6b |
| N3b Upload ungespeicherten RAM-States | **geschlossen** | A7 |
| N4 Import trotz gescheiterter Recovery | **geschlossen** (Board-Import und manueller Cloud-Load) | A5, A5b |
| N8 zwei Tabs überschreiben sich | **teilweise**: sequenziell geschlossen (A8), gleichzeitig Restrisiko mit Sperre statt stillem Verlust (A8r) | A8, A8r |
| P3 Zeitstempel-Write im selben try | **geschlossen** (als Teil von G2) | S1 |

## 5. Weiterhin offen (nicht Teil von R01)

- **R02 Security, unverändert offen:** Stored XSS (I-31, I-32, I-33b); Paste-Erfassung in fremden Eingabefeldern inkl. Cloud-Passwortfeld (I-02, N1); PIN-Bypass und Klartext-Bearbeitung gesperrter Karten (I-13, I-39, N5a, N5b); stilles Scheitern der PIN-Sperre ab etwa 120–250 KB (N2); Import-URL-Validierung (`javascript:`-Daten); CSP/SRI und schwebende CDN-Majors (R02b).
- **Sync-Logik:** I-C02 (Revisionen durch reines Ansehen), I-C03 (kein Merge, „Meine Version behalten“), I-C04 (Board landet im nächsten Konto), I-C05 (Remote-Apply bei offenem Editor). Dazu kommt das Supabase-Backend (RLS, Storage-Policies, RPC-Body, Löschrechte): weiter UNVERIFIED, Gate H2.
- **Quota-Restgefahren:**
  - Die 4,5-M-Grenze ist nur für Chromium belegt (≈ 5,24 M Zeichen pro Origin). Firefox, Safari und iOS sind ungeprüft. Ist deren Quota niedriger, greift statt der Vorabprüfung die Sperre `quota` (A3b).
  - Die Recovery-Kopie und Fremd-Keys verbrauchen dieselbe Origin-Quota; die Vorabprüfung zählt nur den State.
  - Ein Board nahe der Grenze kann nicht importiert werden, weil die Recovery-Kopie nicht passt. Das ist so gewollt; der Weg führt über Backup-Export und Freigabe von Platz.
  - Bestands-Boards zwischen 4,5 M Zeichen und realer Quota laden weiter, nehmen aber keine neuen Inhalte mehr an, bis Platz frei wird.
- **Multi-Tab:** keine Single-Writer-Garantie (A8r) → R05.
- **UI-Ehrlichkeit, Rest:** Edit-Toasts („Text gespeichert“, „Gespeichert“, „Bild gespeichert“, „Sticky Note gespeichert“) bestätigen weiterhin die Änderung im Speicher, auch bei aktiver Sperre. Hinweis und Status-Pille bleiben sichtbar und korrekt. Ein UI-weiter Save-ACK ist Teil von R05.
- **Geänderte Randverhalten (bewusst, fail-closed):**
  - Im Temporärmodus (AutoSave aus) wird kein Cloud-Stand mehr übernommen; bisher geschah das nur im RAM, mit gespeicherter Meta, was zu N3-artigem Überschreiben führen konnte.
  - Bei `unreadable-store` startet der Cloud-Sync nicht.

## 6. Rollback und Empfehlung

- **Rollback ohne Nutzerdatenverlust:** R01 ändert weder Speicherformat noch Keys noch Serialisierung. Ein `git revert 025287f` (oder ein Deployment des vorherigen Stands) stellt das alte Verhalten her und liest denselben `copyboard_state_v1`. Eine Rückmigration ist nicht nötig. R01 legt keine neuen localStorage-Keys an; die Testsuite nutzt `__r01_probe`/`__r01_filler` nur in isolierten Testkontexten.
- **Empfehlung (Human Gate):**
  1. Review des Code-Commits `025287f`, danach PR `fix/r01-data-loss-guards → develop`. Den Doku-/Evidenz-Commit separat mergen oder auf `develop` zusammenfassen.
  2. Vor dem Release: manueller Smoke-Test auf der Produktions-Origin in Chromium **und** Safari/Firefox (Quota-Verhalten, Banner-Layout mobil) mit einem Test-Board, nicht mit echten Daten.
  3. Release `develop → main` erst danach. Bis dahin bleibt der Hinweis aus R00 gültig: Cloud-Nutzer mit großen Boards sollten regelmäßig ein Backup exportieren.
  4. R02 erst nach separatem GO.

STOP am Human Gate. R02 wurde nicht gestartet; `develop`, `main`, Production und Supabase wurden nicht berührt.

---

## 7. R01.1 · Final Safety Closure

Stand: 21.10.2026 · Auftrag: externe Prüfung von R01 akzeptiert G1–G5. Vor dem Merge gibt es einen eng begrenzten Abschluss: ehrliche Erfolgsmeldungen, Regressionstests und eine erneute Bestätigung von A8r. Kein PR, kein Merge, kein Deployment, kein Kontakt zu Supabase.

### 7.1 Ausgangslage und neuer HEAD

| Ref | SHA | Prüfung |
| --- | --- | --- |
| `fix/r01-data-loss-guards` vor R01.1 | `7eb65b9fba20ba7398cefb490c448db294ffee82` | lokal = `origin`, Arbeitsbaum sauber |
| `develop` (lokal und `origin`) | `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` | unverändert seit R00/R01 |
| `main` (`origin`) | `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` | unverändert |
| **R01.1 Code-Commit** | `77a2fcf667ca24d7e44e98ae5d11418cc2bf8650` | `fix(r01.1): only claim "gespeichert" after a verified local write` |
| **R01.1 Doku-/Evidenz-Commit** | neuer HEAD des Branches (enthält diesen Abschnitt) | SHA in der CUTLER-Meldung R01.1 |

Diff-Kennzahlen:
- R01.1 Code (`7eb65b9..77a2fcf`): nur `src/js/app.js`, +28 / −9.
- Produktiver Gesamtumfang R01 + R01.1 gegenüber `develop`: +226 / −67, also 293 geänderte Zeilen (Grenze 300).

### 7.2 Änderung: ehrliche Erfolgsmeldungen

**Befund auf `7eb65b9`.** Sieben Erfolgsmeldungen bestätigten ein Speichern, das nicht bestätigt war:

| Stelle | alter Toast | Problem |
| --- | --- | --- |
| Text bearbeiten (Dialog) | „Gespeichert“ | `persistState()` plant nur (Debounce 140 ms); bei Sperre wird gar nicht geschrieben |
| Text bearbeiten (inline) | „Text gespeichert“ | wie oben |
| Bild bearbeiten (drehen/spiegeln) | „Bild gespeichert“ | wie oben; Speichern geschieht nur als Nebeneffekt von `markRecent()` |
| Datei ersetzen | „Datei ersetzt“ | meldet Erfolg, auch wenn der Write scheitert |
| Sticky Note | „Sticky Note gespeichert“ | wie oben |
| Standardsortierung | „Standardsortierung gespeichert“ | wie oben |
| Sprachmemo | „Sprachmemo gespeichert“ | Write geplant, aber noch nicht bestätigt |

Status-Pille und Sperrhinweis waren bereits korrekt; nur die Toasts widersprachen ihnen.

**Korrektur (klein, kein neues Save-State-System).** Ein Helfer `showEditSaveToast(subject, item?)` ersetzt diese sieben Toasts. Eine Bearbeitung ist ein expliziter Commit. Deshalb wird sofort geflusht (`persistState({immediate:true})`), statt auf den Debounce zu warten, und der Toast folgt aus dem tatsächlichen Ergebnis:

| Zustand | Bedingung | Toast (Beispiel Text) |
| --- | --- | --- |
| lokal gespeichert und bestätigt | verifizierter Write (setItem + Read-back) oder RAM = letzter verifizierter Stand | „Text gespeichert“ |
| nur in der UI übernommen | Temporärmodus (AutoSave aus) | „Text übernommen · Temporärer Modus, nicht gespeichert“ |
| Speicherung ausstehend | Write noch geplant (`persistPending`) | „Text übernommen · Speichern ausstehend“ |
| Speichern fehlgeschlagen | Write gescheitert oder Quota-Sperre | „Text übernommen · Speichern fehlgeschlagen“ |
| Speichern gesperrt | Sperre `foreign-writer` oder `unreadable-store` | „Text übernommen · Speichern gesperrt“ |
| Änderung nicht im Board | die bearbeitete Karte gehört nicht mehr zum Board (Cloud-Apply bei offenem Editor, I-C05) | „Text nicht übernommen · Karte wurde inzwischen ersetzt“ |

Anmerkungen:
- **„Ausstehend“ tritt heute praktisch nicht auf.** Der Flush ist synchron, deshalb ist der Zweig defensiv. Für entprellte Änderungen ohne Toast zeigt weiterhin die Status-Pille „Speichert …“.
- **Die letzte Zeile ist ein Fund aus A9.** Im Szenario I-C05 meldete auch der R01.1-Zwischenstand „Text gespeichert“. Der Save war korrekt verifiziert, enthielt die Änderung aber nicht: Der offene Dialog hielt eine Referenz auf eine Karte des ersetzten States. Der Guard macht nur die Meldung ehrlich. Der Verlust selbst (I-C05) bleibt offen.
- **Nicht geändert:** Speicherformat, Keys, Serialisierung, Sperrlogik G1–G5, Cloud-Protokoll. Toasts, die kein Speichern behaupten (z. B. „Board importiert · Rückkehr möglich“, „Angeheftet“), bleiben unverändert.
- **Verhaltensänderung:** Bearbeitungen werden jetzt sofort statt nach 140 ms geschrieben. Das kostet pro Commit ein zusätzliches synchrones `JSON.stringify` mit Read-back; bei einem Board nahe 4,5 M Zeichen sind das Millisekunden bis wenige Zehntel. Massenänderungen wie Paste oder Drag bleiben entprellt.

### 7.3 Neue Regressionstests (E1–E10)

Sie sind in `evidence/r01-guards.mjs` ergänzt und arbeiten nur mit synthetischen Daten. Den Toast lesen sie direkt nach der Aktion, bevor ein Debounce greifen könnte.

| Test | Szenario | R01.1 `77a2fcf` | R01 `7eb65b9` | Kernbeobachtung R01.1 (R01) |
| --- | --- | --- | --- | --- |
| E1 | Quota-Sperre aktiv, Text im Dialog bearbeiten | **PASS** | FAIL | „Text übernommen · Speichern fehlgeschlagen“; Stand byte-identisch; Änderung im RAM-Backup (R01: „Gespeichert“) |
| E2 | Quota-Sperre, Inline-Textbearbeitung | **PASS** | FAIL | wie E1 (R01: „Text gespeichert“) |
| E3 | Quota-Sperre, Bild drehen | **PASS** | FAIL | „Bild übernommen · Speichern fehlgeschlagen“ (R01: „Bild gespeichert“) |
| E4 | Quota-Sperre, Datei ersetzen | **PASS** | FAIL | „Datei übernommen · Speichern fehlgeschlagen“ (R01: „Datei ersetzt“, kein Hinweis auf den Fehlschlag) |
| E5 | Quota-Sperre, Sticky Note | **PASS** | FAIL | „Sticky Note übernommen · Speichern fehlgeschlagen“; Notiz im RAM-Backup (R01: „Sticky Note gespeichert“) |
| E5b | Quota-Sperre, Standardsortierung | **PASS** | FAIL | „… Speichern fehlgeschlagen“ (R01: „Standardsortierung gespeichert“) |
| E6 | Fremd-Tab-Sperre, Bearbeitung im gesperrten Tab | **PASS** | FAIL | „Text übernommen · Speichern gesperrt“; Stand des anderen Tabs byte-identisch (R01: „Gespeichert“) |
| E7 | setItem verwirft den Write still (kein Fehler) | **PASS** | FAIL | Read-back erkennt es: „… Speichern fehlgeschlagen“, Sperre aktiv (R01: „Gespeichert“) |
| E8 | Positivkontrolle ohne Sperre (Text Dialog/inline, Bild, Notiz) | **PASS** | FAIL | „… gespeichert“, und zu diesem Zeitpunkt steht die Änderung schon in localStorage (R01: Toast vor dem Write, 4/4 noch nicht gespeichert) |
| E9 | Temporärmodus, Text bearbeiten | **PASS** | FAIL | „Text übernommen · Temporärer Modus, nicht gespeichert“ (R01: „Gespeichert“) |
| E10 | Cloud-Apply bei offenem Bearbeiten-Dialog (I-C05) | **PASS** | FAIL | „Text nicht übernommen · Karte wurde inzwischen ersetzt“ (R01: „Gespeichert“, obwohl die Änderung verloren ist) |

### 7.4 Erneute Prüfung A1–A10 und bisherige PASS-Szenarien

Die Umgebung ist dieselbe wie in Abschnitt 3: macOS, Node v24.18.1, Playwright 1.63.0, Chromium headless, `git archive 77a2fcf` über `python3 -m http.server` auf 127.0.0.1. Alle externen Hosts wurden abgefangen; angefragt wurden `fonts.googleapis.com`, `cdnjs.cloudflare.com` und `cdn.jsdelivr.net`. Supabase lief nur als In-Memory-Mock (`supabaseContacted:false`).

| Test | R01 `025287f` | **R01.1 `77a2fcf`** |
| --- | --- | --- |
| A1, A2, A2b, A2c (G1) | PASS | **PASS** |
| A3, A3b, A4, S1 (G2) | PASS | **PASS** |
| A5, A5b (G3) | PASS | **PASS** |
| A6, A6b, A7 (G4) | PASS | **PASS** |
| A8 (G5 sequenziell) | PASS | **PASS** |
| A8r (G5 gleichzeitig) | RISK | **RISK**, siehe 7.5 |
| E1–E10 (R01.1) | – | **PASS** (11/11) |
| A9 Run-01-Suite (58) | PASS | **PASS**: kein PASS→nicht-PASS gegenüber Baseline und gegenüber R01 |
| A10 `node --check` (5 Module) | PASS | **PASS** |

A9 im Detail:
- Zählung: Baseline 22 PASS / 29 DEFECT / 5 OBS / 2 NV. R01 23 / 27 / 5 / 2 / 1 BLOCKED. R01.1 24 / 26 / 5 / 2 / 1 BLOCKED.
- I-35 (BLOCKED) und I-38 (PASS) sind wie in 3.1 erklärt.
- **I-42 (Sprachmemo) DEFECT → PASS ist kein R01.1-Effekt.** Isoliert besteht der Test 3/3 auch auf R01 `7eb65b9`; das DEFECT im R01-Gesamtlauf war Timing der Fake-Mikrofon-Aufnahme. Die Zählung ist deshalb nicht als Verbesserung zu lesen.
- I-C05 bleibt DEFECT (Änderung verloren). Die Meldung lautet jetzt aber „Text nicht übernommen · Karte wurde inzwischen ersetzt“ statt „Gespeichert“.

Neue Belege in `evidence/`:
- `r01-results-r01.1-77a2fcf.json` + `r01-guards-r01.1-77a2fcf.log`: komplette R01-Suite inklusive E1–E10 auf R01.1;
- `r01-results-r01-7eb65b9-_E.json` + `r01-guards-r01-7eb65b9-E.log`: E1–E10 auf dem R01-Stand (Gegenprobe, 11/11 FAIL);
- `qa-results-r01.1-77a2fcf.json` + `qa-run-r01.1-77a2fcf.log`, `a9-compare-r01.1.json`: A9 (Baseline → R01.1).

Die Reproduktion entspricht Abschnitt 3 mit `git archive 77a2fcf`, `R01_LABEL=r01.1-77a2fcf` und für die Gegenprobe `node r01-guards.mjs '^E'` gegen `git archive 7eb65b9`.

### 7.5 Gleichzeitige Tabs (A8r): Befund bestätigt

Erneut 5/5 Durchläufe, in denen eine von zwei gleichzeitig gespeicherten Karten nicht persistiert wird. In allen 5 Durchläufen sind **beide** Tabs gesperrt und bieten den RAM-Export; einen stillen Verlust gab es nicht.

**Es gibt keine Single-Writer-Garantie, und R01/R01.1 behaupten auch keine.** Der `storage`-Listener begrenzt nur das Risiko: storage-Events sind nicht atomar, und zwischen zwei nahezu gleichzeitigen Writes gewinnt der letzte. Web Locks und BroadcastChannel gehören in den späteren Architektur-Run (R05) oder in einen ausdrücklich separat freigegebenen Sicherheitslauf vor Production. R01.1 ändert daran nichts.

### 7.6 Weiterhin offene Risiken

- **A8r:** keine Single-Writer-Garantie (siehe 7.5). Der unterlegene Tab muss seinen RAM-Stand aktiv exportieren, sonst ist die Karte beim Neuladen weg.
- **I-C05:** Ein Cloud-Apply bei offenem Editor verwirft die Bearbeitung weiterhin; jetzt sagt das die Meldung. Gehört zur Sync-Logik (zusammen mit I-C02, I-C03, I-C04).
- **Ursache in der Meldung:** Ein still verworfener Write (E7, Read-back-Mismatch ohne Exception) wird als Sperre `quota` behandelt. Der Hinweis lautet dann „Browser-Speicher ist voll“, obwohl die Ursache eine andere sein kann. Das Verhalten ist sicher (fail-closed), der Text ist ungenau.
- **Sticky Notes und Einstellungen** werden bei aktiver Sperre weiterhin im RAM angenommen. Die Meldung ist jetzt ehrlich, sie sind aber nicht durch `captureBlocked()` gesperrt. Sie sind klein und im RAM-Backup enthalten.
- **Kein UI-weiter Save-ACK:** Nur die sieben Bearbeitungs-Toasts sind an die Bestätigung gebunden. Eine vollständige Save-State-Modellierung kommt mit dem TypeScript-BoardStore.
- **Unverändert aus Abschnitt 5:** R02 Security (XSS, PIN, Paste-Capture, CSP/SRI), Quota-Grenze nur für Chromium belegt (Firefox, Safari, iOS ungeprüft), Supabase-Backend UNVERIFIED (Gate H2).

### 7.7 Empfehlung

1. **PR `fix/r01-data-loss-guards → develop` ist aus Sicht von R01.1 freigabefähig.** Review-Schwerpunkt sind die Code-Commits `025287f` (R01) und `77a2fcf` (R01.1). Die Doku-/Evidenz-Commits können zusammengefasst werden.
2. Vor dem Release `develop → main` (unverändert aus 6):
   - manueller Smoke-Test auf der Produktions-Origin in Chromium **und** Safari/Firefox mit einem Test-Board, mit Blick auf das Quota-Verhalten und das Banner-Layout mobil;
   - zusätzlich die Bearbeitungs-Toasts im Temporärmodus und bei voller Quota.
3. Die Single-Writer-Absicherung (Web Locks + BroadcastChannel) braucht eine **eigene Freigabe**, vor Production oder im Architektur-Run R05.
4. R02 erst nach separatem GO.

STOP am Human Gate. Kein PR, kein Merge, kein Deployment. `develop`, `main`, Production und Supabase wurden nicht berührt.
