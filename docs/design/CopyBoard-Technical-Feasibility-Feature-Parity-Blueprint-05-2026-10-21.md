# CopyBoard — Technical Feasibility & Feature Parity Blueprint 05

**Consolidation Phase:** 05 · Technical Readiness / Security / Feature Parity  
**Datum:** 21. Oktober 2026  
**Status:** **READ-ONLY TECHNICAL REVIEW — NO-GO für sofortigen großen UI-Implementierungsrun**  
**Repository:** `AlexanderTheMacedon/CopyBoard`  
**Basis-SHA `main` / `develop`:** `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` (letzter Commit laut GitHub: 2026-09-06).  
**Vorliegender technischer Audit:** Branch `audit/copyboard-technical-baseline-run-01`, SHA `33600a1c5d5c9c842ff84585e429796f0dff7c3e` (Berichte vom 21.10.2026).  
**Designbasis:** Masterplan v0.37 mit D-001 bis D-033, Decision Integrity Audit 01, IA Blueprint 02, Interaction/Motion Blueprint 03 und Design System Blueprint 04.  
**Explizit nicht getan:** Kein Repository-Write, kein Branch/Commit, keine DB-Migration, keine echten Supabase- oder Live-API-Aufrufe, kein Browser-E2E- oder Hardwaretest, kein Deployment.

> **Unterscheidung der Evidenz:** **R** = bei dieser Phase im GitHub-Code oder README gelesen; **A** = Ergebnis des vorherigen dokumentierten, reproduzierbaren Browser-Audits (nicht in dieser Phase neu ausgeführt); **X** = anhand öffentlicher Browser-/Plattformdokumentation plausibilisiert; **U** = ungeprüft/Backend/Produktion/echtes Gerät; **P** = vorgeschlagener Soll-Vertrag, nicht beschlossen/implementiert. Ein auf dem Audit-Branch dokumentierter Defekt ist nicht automatisch ein in dieser Sitzung erneut reproduzierter Fehler oder der Beweis des aktuellen Production-Deploystands.

---

## 1. Executive Assessment

### 1.1 Gesamturteil

**Designkonzept: GRÜN** für die weitere Spezifikation.  
**Bestehende Daten-/Security-Basis: ROT** als Startpunkt für einen ungeschützten Großumbau.  
**Funktionale Parität: GELB** – ausreichend inventarisiert, aber zu einem späteren Zeitpunkt zwingend ausführbar gegenzuprüfen.  
**Backend-/Mobile-Behauptungen: UNVERIFIZIERT**.  
**Empfohlene Reihenfolge:** Bestand sichern → datenerhaltende Stabilisierung → XSS/Privacy → automatisierte Regression → Storage-/Sync-Migrationskonzept → neuer UI-Aufbau in Feature-Slices, jeweils separat freizugeben.

### 1.2 In Zahlen — ausdrücklich aus dem EXISTIERENDEN Audit übernommen

- **58** dokumentierte Browser-Szenarien, davon **22** uneingeschränkt bestanden; Stand früherer Audit, **nicht heute neu ausgeführt** (A).
- **27 bestätigte Befunde**, darunter **1 Critical, 10 High, 15 Medium, 1 Low**; Severity aus Audit, keine Neureklassifizierung (A).
- Eine ca. **5.099-Zeilen-Closure** in `src/js/app.js`, rund 300 Funktionen, 55 mutable Globals, 203 Listener laut dokumentierter Analyse (A). Code-Dateigröße auf GitHub 260.715 Byte (R).
- **Kein Maintained Test Suite, keine CI, kein Linter** auf der Baseline laut README/Audit (R/A).
- **Keine Supabase SQL-Migrationen/RLS-Policies/RPC-Implementierung im Repository**: echte Sicherheitsgrenzen backendseitig unbekannt (R/U).

### 1.3 Entscheidungen, die daraus **nicht** folgen

- **Keine automatische React-/TypeScript-/Vite-Freigabe.** Die bestehende App ist HTML/CSS/native ES Modules. Ein Frameworkwechsel ist eine getrennte Architekturentscheidung.
- **Keine Behauptung, dass IndexedDB alle Datenverlustrisiken eliminiert.** Browser-Speicher ist best-effort, Quota-/Eviction-/Private-Mode- und Nutzerlöschvorgänge bleiben relevant.
- **Keine Vollabdeckung durch das alte Testharness.** Es verwendet Chromium, Supabase-Mocks und teils OCR-Stubs.
- **Keine Empfehlung, bereits gespeicherte Bestandsdaten durch einen UI-Reset zu ersetzen.** Bestehende Datenformate und PIN-Ciphertexte gehören zu den harten Kompatibilitätsverträgen.

---

## 2. Tatsächlich inspizierter Repository-Stand

| Prüfgegenstand | Beobachtung | Evidenz |
|---|---|---|
| `main`, `develop`, `feature/notes-editor` | gleicher SHA `ac721fe...`; `main` ist kein Snapshot der neuen D-001..033-Oberfläche | R, GitHub Branch API |
| Audit-Branch | SHA `33600a1...`; Report- und Beweisdateien liegen unter `docs/audits/copyboard-technical-baseline/` | R |
| Baseline-Runtime | `index.html`, `src/styles/app.css`, `src/js/app.js`, `src/js/config/constants.js`, Utility-/Toast-Module; kein Buildschritt | R, README/Contents |
| Runtime-Dependencies | JSZip 3.10.1, Tesseract.js `@5`, Supabase JS `@2`, Google Fonts per CDN | R, `index.html` |
| Inhaltsgrößen | `MAX_FILE_BYTES=8 MiB`; `MAX_TOTAL_BYTES=20 MiB`; ein Board-JSON in `localStorage['copyboard_state_v1']` | R |
| Persistenz | `loadPersistedState()` fängt Parse-/Normalize-Fehler ab und gibt `null` zurück; `flushPersistedState()` fängt `setItem`-Fehler ab, lässt UI-Mutation jedoch bestehen | R, `app.js` 450–545 |
| Cloud | `copyboard_boards`, Bucket `copyboard-snapshots`, RPC `copyboard_publish_snapshot`, 900-ms Push-Debounce | R, README/constants/app.js |
| Cloud-Apply | Remote-Snapshot ersetzt `state` und zeigt anschließend „Synchronisiert“, ohne offenen Editorkontext auszuhandeln | R/A, `app.js` 1130–1175 |
| Clipboard-Ereignis | Globaler `document.addEventListener('paste')` mit einer unvollständigen Input-Exclusion-Liste | R/A, `app.js` ca. 3703 |
| Preimport-Restore | Einzelner `localStorage`-Recovery-Slot; Fehler bei `setItem` liefern `false` | R, `app.js` ca. 4228 |
| Supabase-Key | Öffentlicher Publishable-Key in Client-Konfiguration; **nicht an sich ein Geheimnis**. Sicherheit hängt von RLS/Storage/RPC ab | R/U |
| Deployment | Domain laut README `copyboard.astambke.de`, tatsächlicher Live-Build/Cache/Host nicht überprüft | R/U |

**Quellenpfade:**
- [Repository README](https://github.com/AlexanderTheMacedon/CopyBoard/blob/main/README.md)
- [Runtime-Konstanten](https://github.com/AlexanderTheMacedon/CopyBoard/blob/main/src/js/config/constants.js)
- [App-Orchestrierung](https://github.com/AlexanderTheMacedon/CopyBoard/blob/main/src/js/app.js)
- [Technischer Audit — README](https://github.com/AlexanderTheMacedon/CopyBoard/blob/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline/README.md)
- [Audit 02 — Feature Inventory](https://github.com/AlexanderTheMacedon/CopyBoard/blob/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline/02-FEATURE-INVENTORY.md)
- [Audit 04 — Data/Security/Sync](https://github.com/AlexanderTheMacedon/CopyBoard/blob/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline/04-DATA-SECURITY-AND-SYNC.md)
- [Audit 05 — Debt and Risks](https://github.com/AlexanderTheMacedon/CopyBoard/blob/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline/05-TECHNICAL-DEBT-AND-RISKS.md)
- [Audit 06 — Refresh Readiness](https://github.com/AlexanderTheMacedon/CopyBoard/blob/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline/06-REFRESH-READINESS.md)

---

## 3. Harte Sicherheits- und Datenerhaltungs-Gates

### G-01 — Bestehende Daten bei fehlerhaftem Load niemals überschreiben — BLOCKER

**Befund:** `loadPersistedState()` unterscheidet aus Sicht des Aufrufers nicht verlässlich zwischen „kein Bestand vorhanden“, „kaputtes JSON“, „nicht unterstützte Schema-Version“ und „Speicher temporär unlesbar“. Der Audit meldet bei fehlerhaften/neuen Schemas **Critical I-35** (A/R).

**Verbindlicher Sicherheitsvertrag [P]:**
1. Explizite Ladezustände `empty | loaded | unreadable | unsupported_version | storage_unavailable`.
2. `unreadable` / `unsupported_version` → **read-only Quarantäne**; Originalbytes nicht überschreiben, bis Export/Reparatur/Freigabe gesichert sind.
3. Vor jedem Migrationsversuch Rohdaten-Backup, Migration auf Kopie, Versionierung und Integritätsprüfung.
4. Eine erfolgreich angezeigte neue Board-Ansicht darf nie das einzige Signal für erfolgreiches Speichern sein.
5. Testbar: beschädigter Datensatz, unbekannte zukünftige Version, simulierte Lesefehler, Tab-Neustart, Wiederholungsmigration.

**Abhängigkeiten:** D-026 (Empty State), D-027 (Capture-Erfolg), D-028 (Trust), D-029 (Recovery).

### G-02 — Quota- und Crash-Sicherheit — BLOCKER

**Befund:** Der bisherige Audit misst ungefähr 5,24 Mio. Zeichen für einen einzelnen Chromium-`localStorage`-Wert; das Budget `MAX_TOTAL_BYTES = 20 MiB` ist keine wirkliche Browserquote. Bei `setItem`-Fehlern bleibt ein neuer Inhalt visuell vorhanden und verschwindet beim Reload (**High I-36**, A/R). Audio und Assets werden per Base64 in den gemeinsamen JSON-Blob serialisiert.

**Minimaler Vorabfix [P, separat freizugeben]:** Fehlerzustand prominent, unsaved Items kenntlich halten, neue Mutationen risikobegrenzt, robuste Export-/Freigabeoption, echte Save-ACK-Semantik; keine voreilige 20-MiB-Anzeige.

**Zielarchitektur-Kandidat [P]:** IndexedDB für Metadaten/strukturierte Records und binäre `Blob`s; optional OPFS erst bei nachgewiesenem Bedarf. **Transaktionale Metadaten- und Blob-Referenzen**, asset-reference counting, GC erst nach confirmed commit. Best-effort-Speicher, QuotaExceededError, `navigator.storage.persist()` und vollständige externe Backup-Fähigkeit einplanen. **Keine verpflichtende OPFS-/Frameworkentscheidung.**

### G-03 — Stored XSS und Import-Validierung — BLOCKER

**Befund:** Der technische Audit bestätigt drei Einfallstore (**I-31, I-32, I-33b**): unsicher gerenderte Space-Namen, importierte Space-Farben und `javascript:`-Payloads in importierten Dateiinhalten (A; Code-Muster sind im Audit referenziert). Ein XSS kann den Browser-origin-Kontext inkl. Board und Supabase-Session erreichen. Kein belastbarer CSP-/SRI-Schutz im Basisdokument nachgewiesen (R/A).

**Schutzvertrag [P]:** untrusted Text durch `textContent`; DOM-Fragmente nur durch sichere APIs/Trusted Types/CSP-kompatible Renderingstrategie; Imports mit Schema- und URL/MIME/Size-Validierung; keine `javascript:`-Navigation; CSP, Dependency-Pinning, SRI oder self-hosted geprüfte Bundles; Auth/Token-Handling und sicherer Preview-Sandbox-Vertrag. Test-Cases für alle bekannten Payload-Klassen ohne schädliche Inhalte zu reproduzieren.

### G-04 — Eingabe-/Privacy-Routing — BLOCKER

**Befund:** Der globale Paste-Listener verarbeitet derzeit verschiedene fokussierte Eingaben weiter (**High I-02**, A/R). Damit können in Such- oder PIN-Feldern eingefügte Inhalte als Karten gespeichert werden. Weitere Fokus-/Pointer-Kollisionen I-11, I-M01.

**Vertrag [P]:** Paste-Capture **nur bei eindeutigem Board-Fokus/ausdrücklicher Capture-Aktion**, niemals in `input`, `textarea`, `select`, `contenteditable`, Dialog/Palette, PIN-Feld, Markdown-Composer oder laufendem IME; native Paste in Textfeldern erhalten; Privacy-Akzeptanztest mit Geheimnis-Teststring, ohne Log/Telemetry.

### G-05 — Cloud-Berechtigungen, Sync und konfliktsicherer Apply — BLOCKER

**Befund:** Cloud ist optional, aber `copyboard_boards` / Supabase Storage / `copyboard_publish_snapshot` bilden eine Security-Boundary. **Die echte RLS-, Storage- und RPC-Konfiguration ist NICHT im Repo** (U). Whole-board-Revisionskonflikte haben keinen sauberen Merge; `cloudApplySnapshot()` ersetzt state bei offenem Editor (High I-C03/I-C05, A/R).

**Vor Nutzung/Refaktor [P]:** SQL-/RLS-/Storage-/RPC-Bestand **read-only auditieren**, im Repo als reviewbare Migrationen versionieren, Owner-ID/Objektpfad mit `auth.uid()` abgleichen, atomische Revision verifizieren; authentifizierte Cross-User-Negativtests. Nie `service_role` im Browser. Das öffentliche Publishable-Key-Format ist kein Befund für einen geleakten Secret Key.

**D-028-Semantik:** `local_commit` ≠ `cloud_pending` ≠ `server_revision_acked` ≠ `conflict`. Realtime-Event allein beweist keine lokale bzw. globale Konfliktfreiheit. Bei Apply unter Dirty Editor **nicht überschreiben**: Draft einfrieren / gezieltes Merge/Conflict UI anbieten und aktuellen Stand sichern.

### G-06 — Regressionen und Legacy-Parität — BLOCKER

**Befund:** 58-Szenarien-Audit existiert, aber kein durchgehendes, gepflegtes Test-Projekt auf `develop`; Browser-Matrix und Backend fehlen (A/R).

**Gate [P]:** Audit-Harness in reproduzierbare Playwright-Suite und CI übernehmen; bestandene Alt-Features als automatische Verträge; neue D-001..D-033-Features als separate E2E; Chromium/Firefox/WebKit, echte iOS-/Android-Hardware-Smokes; Import-, PIN-Decrypt-, Data-Integrity-Fixtures, A11y, Offline und Crash/Reload.

---

## 4. Persistenz- und Migrationsstrategie (Vorschlag, KEIN finaler Technologieentscheid)

### 4.1 Kompatibilitätsgrenze

**Unbedingt lesbar zu halten:** `copyboard_state_v1` Schema 1, `spaces[]` + Reihenfolge, `activeSpaceId`, `data[spaceId].itemIds`, `items` + Folder-`itemIds`, `settings` und unbekannte Keys, `recentItems`, `helpNotes`, `viewMode`-Mirror; `copyboard-backup` v1, `copyboard-space` v1, `copyboard-settings` v1, Legacy Raw V16–V22, eventuell alte `window.storage`-Installationen. Originalname und `customName` getrennt halten. **PIN-Datensätze müssen mit dem bisherigen PIN entschlüsselbar bleiben.**

### 4.2 Pseudomodell für neue Datenverantwortung

| Domain | Record-Ownership [P] | Wichtige Anforderungen |
|---|---|---|
| Space | `Space(id, name, color, order, preferences)` | D-018, D-025, D-031; Stable IDs, Tints nur Präsentation |
| Folder | `Folder(id, parentId?, spaceId, order)` | D-024 Nested Folders, zyklusfreie Moves, Restore des gesamten Subtrees |
| Item | `Item(id, folderId?, spaceId, type, mime, name, customName, revision, …)` | Originalnamen, pinned, selected, modifiedAt, safe duplicate signature |
| Asset | `Asset(id, blob, digest, size, refCount)` | Große Daten getrennt von Metadaten, keine Orphans und kein Leak |
| DocumentRevision | `Revision(id, itemId, parentRev, contentRef, createdAt, author)` | D-029 Versionsverlauf, Wiederherstellung als neue Revision |
| Session | `Session(id, status, startedAt, endedAt?, attachments[])` | D-008/009/010; Zeitbezug und Interruptions-
| Trash | `Tombstone(recordId, deletionRevision, dependencies, deletedAt)` | D-029; Soft Delete, definierbare Retention, kein stilles endgültiges Löschen |
| SyncOperation | `Op(id, deviceId, baseRevision, payloadRef, ackState)` | Retry, Idempotenz, Durability, explizite Konflikte |
| Preferences | `Preference(key, scope, owner, value, version)` | D-033 Quick + Studio **eine Datenquelle** |

*Die Tabelle ist eine mögliche Zielabstraktion, kein festgelegtes SQL-, IndexedDB- oder Supabase-Schema.*

### 4.3 Zweiphasige Migration mit Rollback

1. **Discovery:** Originalzustand erfassen, Schema/Quota/Asset-Volumen prüfen; keine Mutation beim Laden der Statistik.
2. **Snapshot:** Original rohen JSON-Export schreiben und verifizieren; Warnung falls Browser-Speicher nicht ausreicht; Sicherung außerhalb derselben Quota ermöglichen.
3. **Staging:** In neuen Speicher `migration_<version>` schreiben; Records/Assets deduplizieren, Pfade und Parent IDs validieren; bestehende PIN-Ciphertexte unverändert durchreichen.
4. **Validation:** Item-/Folder-/Space-Zählung, `digest`, Referenzintegrität und Test-Decryption-Fixtures abgleichen; unbekannte Felder konservativ erhalten.
5. **Atomic cutover:** Neuen Store erst nach validiertem Abschluss als `activeStoreVersion` markieren. Alter Store **nicht** beim ersten Erfolg löschen.
6. **Rollback:** Auf altes Snapshot-Format exportieren bzw. read-only Fallback ermöglichen; Crash an jeder Phase simulieren.
7. **Quarantäne:** Bei jeder Inkonsistenz in read-only/safe error; Nutzeraktion statt stiller „Reparatur“.

### 4.4 Separate Export-Strategie

- Voll-Backup umfasst JSON-Manifeste **und** Blob-Dateien, ggf. versioniertes ZIP; Checksums/Version-Manifest, tatsächliche Dateigrößen und bestätigten Export offenlegen.
- D-011 Smart Handoff ist **kein** vollständiges Datenbackup; D-029 Recovery ist kein Ersatz für externes Backup.
- Alte Importformate sind lesbar; ein neuer Export braucht zusätzlich einen Abwärtskompatibilitätsplan.
- Beim Löschen von Items, Ordnern und Spaces bleibt ein wohldefinierter Graph; kein `itemIds`-Orphan, keine doppelte Asset-Freigabe.

---

## 5. Supabase, Multi-Device und Recovery

### 5.1 Bestehender Cloud-Vertrag [R/A]

- `copyboard_boards`: `owner_id`, `revision`, `object_path`, `content_hash`, `state_bytes`, `updated_at`, `updated_by_device`.
- `copyboard-snapshots`: `<uid>/snapshots/*.json` mit vollständigem Board; `upsert:false`.
- `copyboard_publish_snapshot(p_base_revision, p_object_path, p_content_hash, p_state_bytes, p_device_id)`: konfliktprüfender Publish-Schritt, Signalisierung u. a. via `COPYBOARD_REVISION_CONFLICT`.
- Download und Realtime/online/visibility können Remote-Snapshots anstoßen. Passives Öffnen ändert den in Cloud enthaltenen Recents-/Active-Space-Status (I-C02).

### 5.2 Soll: Sync-Semantik D-028 + D-029 [P]

```text
INPUT / EDIT
    → lokale validierte Mutation
    → persistenter Commit bestätigt
    → Operation in Sync-Outbox; local_saved=true
    → idempotenter Upload/Publish (mit baseRevision, operationId)
        ├─ ACK für exakt diese Revision → synced=true
        ├─ offline / timeout → pending; Retry, keine Fake-Success-UI
        └─ conflict → lokaler Stand bleibt erhalten; Conflict Resolution UI
```

- **Passives UI-Browsing nicht als Content-Revision behandeln.** Device-only Preferences, Recents und Sichtzustände logisch isolieren.
- **Remote Apply bei offenem Draft** blockieren bzw. konfliktbewusst fächern; kein stale object pointer und keine grüne Falschmeldung.
- **„Keep mine“, „Use remote“, „Compare“** als mögliche Auflösungen; exakt zulässige Mechanik später spezifizieren und testen, keine automatische Last-write-wins-Annahme.
- **Conflict State > Sync OK State:** Solange eine reale Konfliktentscheidung fehlt, nicht „Synchronisiert“ zeigen.
- **Accountwechsel:** Local-only Board nicht automatisch in ein anderes Konto hochladen (I-C04), sondern import-/merge-optionen explizit machen.
- **Multi-device Recovery:** Ein Restore erzeugt eine neue Änderungsoperation/Revision und erhält (nach Möglichkeit) den bisher aktuellen Stand.
- **Deletion-/Tombstone-Regeln:** Idempotent bei Offline-Geräten; Wiederauftauchen alter Items durch stale Snapshots verhindern.
- **Keine irreversible Cloud-Migration**, bevor echter Backend-Inventur und Rollback-Plan unterschrieben sind.

### 5.3 Pflichtprüfungen für echtes Supabase-Backend [U]

| Prüfung | Nachweis nötig |
|---|---|
| Tabellen | Schema/Constraints/Indexes/Owner-Bindings `copyboard_boards` |
| RLS | Reads/Writes unterschiedlicher Accounts strikt isoliert; `auth.uid()`/Ownership |
| Storage | Bucket Policies verhindern `select/insert/delete` in fremden Owner-Prefixes |
| RPC | `SECURITY DEFINER`-/Search-Path-Review, atomische Compare-and-Swap-Revision, Objektpfad gehört zu User |
| Realtime | Abonnements liefern keine fremden Metadaten; Remote-Apply bei offenen Drafts getestet |
| Cleanup | Snapshot-Sammelreste/Orphans, Quotas, Lebenszyklen, Retry und Failure-Recovery |
| Auth | Session-Handling, Sign-out, Device/Account Switch, expired token, rate limits |
| Environment | Dev/Staging getrennt von Production, keine unnötigen Secret-Exporte |

---

## 6. Recovery Studio und Sensitivität

- **Legacy-Undo**: max. 20 In-Memory-Schritte, nicht reload-persistent; Batch-Moves ggf. mehrere Undos. D-029 soll verbessern, ohne Alt-Funktionen still zu verlieren.
- **Papierkorb**: Hierarchie/Subtrees und Asset-Lebensdauer, Selektion, Folder-Zyklen und Undo prüfen. Retentionfrist **offen (H-05)**; nicht erfinden.
- **Revisionsverlauf**: Auf editierbare Notizen/Markdown begrenzen, später erweiterbar. Versionsinhalte dürfen im UI/Export nur bei geeigneter Berechtigung erscheinen.
- **PIN**: bestehendes `encData{cipher,iv,salt}`: AES-GCM-256, PBKDF2-SHA256 mit 150.000 Iterationen, 16-byte Salt, 12-byte IV; Legacy-PIN-Datensätze müssen weiter entschlüsselbar bleiben. Kein irreführender Geheimnisschutz von Klartext-Metadaten; Fehlermeldungen/Locked Previews vereinheitlichen.
- **Backup**: Externer exportierter Sicherungsstand ist höherwertig als Undo; Recovery-/Autosave-Claims können ohne echten Persistenznachweis nicht „sicher“ heißen.
- **Burn Link**: Alt-Implementierung enthält Text Base64-codiert im URL-Fragment und ist **nicht one-time** (I-27). Eine echte Einmal-URL braucht Server- oder vertrauenswürdige Abruf-/Löschlogik. Kein Burn-Versprechen ohne Backend; Produktfreigabe notwendig.
- **Privacy**: Lokale Dateien/Audios/Screenshots niemals still an KI-, OCR- oder andere Drittservices übermitteln; OCR/CDN-Datenflüsse gesondert offenlegen und ggf. lokal/opt-in absichern.

---

## 7. Feature-Parity-Matrix — Legacy → 33er-Zielprodukt

**Legende:** `P` = Bestandsvertrag erhalten; `F` = behalten, **vor Umsetzung erst Defekt beheben**; `N` = neue Designfunktion (kein Legacy-Test); `G` = durch menschliche Produktentscheidung/technisches Gate noch offen. Ein „P“ bedeutet nicht, dass die Legacy-Funktion fehlerfrei ist; dafür die eigenen Szenarien prüfen.

| ID | Feature / Vertrag | Altbestand / Risiko (A/R) | Ziel / Freigabekriterium | Status |
|---|---|---|---|---|
| FP-01 | Start ohne Account / Offline | Grundworkflow funktioniert offline | Anonyme lokale Nutzung unverändert | P |
| FP-02 | Clipboard Text / Bild Paste | Dokumentweites Event; I-02 | Board-Capture und Field-Paste strikt getrennt | F |
| FP-03 | Datei Drop / Picker | 8-MiB-Files, Base64; Quota I-36 | Bestand importierbar, Blob-Persistenz geprüft | F |
| FP-04 | Cross-Space-Duplikate | exact match; Batch-Drop Bug I-06 | Mehrere Duplicates ohne Item-Verlust | F |
| FP-05 | Text-Modal / Clipboard-Preview | Permission Prompt möglich | Explizite und kontrollierte Capture-Action | P |
| FP-06 | Spaces: Name/Farbe/Reihenfolge | Vorhanden, Farbimport XSS | D-018/D-025/D-031, sichere Name-/Color-Validierung | F |
| FP-07 | Space duplizieren | Vorhanden | IDs/Asset-Refs konsistent, Undo | P |
| FP-08 | Space Export / Import | `copyboard-space` v1 | Altformate lesen, neue Daten nicht verlieren | P |
| FP-09 | Space löschen/leer | Vorhanden | Trash/Restore mit Kindgraph D-029 | N |
| FP-10 | Manuelle Reihenfolge / Drag | Vorhanden | D-023 persistente Manual Order | P |
| FP-11 | Sortiermodi pro Space | 6 Modi | pinned-first & manual unabhängig | P |
| FP-12 | Angeheftete Items | Vorhanden, Folder eingeschränkt | Pinned-First inkl. Folder Scope | F |
| FP-13 | Ein-Ebenen-Ordner | Vorhanden; I-22 | D-024 verschachtelte Ordner inkl. Zyklusschutz | N |
| FP-14 | Ordner-Preview (4 Miniaturen) | Vorhanden | Locked Assets korrekt maskieren | F |
| FP-15 | Ordneraktionen / Child Menus | I-46 Overlay falsch | Erreichbar per Touch/Mouse/Keyboard | F |
| FP-16 | Ordner-ZIP | I-25 bei locked image | Gemischte/locked Dateien sicher exportieren | F |
| FP-17 | Verschieben/Kopieren Space | Drag/Menu/Bulk | Kein Orphan, ein Undo pro User-Aktion | F |
| FP-18 | Bulk Select / Range | Hover-only auf Touch | D-022 explizites Mobile Select, Keyboard | F |
| FP-19 | Bulk Duplicate / Folder / Delete | Vorhanden | Ein Operation Grouping, Undo/Restore | F |
| FP-20 | Gesamtsuche/Command Palette | Derzeit wichtige Menüs nur Palette | D-021 Aktionen zusätzlich auffindbar | P |
| FP-21 | Suche in Space/Folder/Text | Vorhanden | Suchindex/locked-Metadaten sensibel | F |
| FP-22 | Favoriten | Vorhanden | Neue Spaces-First-IA erhält globalen Zugriff | P |
| FP-23 | Zuletzt verwendet | Vorhanden; erzeugt Cloud-Revs | Device-/Space-Pref Scope, kein Content Sync Noise | F |
| FP-24 | Grid / Liste | Vorhanden | D-005 plus D-032 drei Dichten | N |
| FP-25 | Item-Preview | Touch Ghost-Click I-M01 | Inspector/Detail zuverlässig, Fokus | F |
| FP-26 | Spacebar Quick Look | PIN-Bypass I-13 | Kein Lock-Bypass, Keyboard-Parität | F |
| FP-27 | Inline Text Edit | Escape/Click Bug I-11 | Scope, Cancel, Persist/Dirty robust | F |
| FP-28 | Modal Text Edit | Remote Apply Bug I-C05 | Composer als souveräner Draft Owner | F |
| FP-29 | Bild drehen / spiegeln | Vorhanden; Format/Size beachten | Inhaltsmutation + Revision + Quota | P |
| FP-30 | Datei ersetzen | Fehlende Quota/Duplicate Checks | Neues Blob atomar, Ursprungsname getrennt | F |
| FP-31 | Rename / Originalname | Vorhanden | name/customName behalten | P |
| FP-32 | Copy Text/Bild | Vorhanden, PNG Clipboard | Fallback bei Browserblockade | P |
| FP-33 | Einzeldatei Download | unsichere importierte href möglich | Sanitization, echte File Blob | F |
| FP-34 | Drag-out Desktop | Nicht verifiziert | Fallback Download, Plattformcheck | G |
| FP-35 | Native Share | Browserabhängig | Nur nach sichtbarer Nutzeraktion | G |
| FP-36 | Sprachnotiz | MediaRecorder-WebM | D-008 zeitgebundene Session, MIME detect | F |
| FP-37 | OCR DE/EN | Tesseract Stub in Audit | Real lokal/per Consent testen, Fehlerstatus | G |
| FP-38 | Bild-Farbpalette | Vorhanden | Farbextraktion, Copy/Save as card | P |
| FP-39 | PIN AES-GCM | Klartext Metadaten, Preview Leak | Ciphertext kompatibel, ehrliche Copy | F |
| FP-40 | Burn-Link | mehrfach nutzbare Fragment-URL I-27 | Umbenennen oder Backend-Service | G |
| FP-41 | Undo/Redo | In-Memory 20 Schritte, Lücken | D-029 atomare semantische Ops | F |
| FP-42 | Temporärmodus | Vorhanden | Kein Save/Cloud, Warnung und Status | P |
| FP-43 | Storage Manager | 20 MiB Anzeige irreführend | Reale Quota/Blob/Export Fehler | F |
| FP-44 | Full Backup Export/Import | Altformate, Restore Slot | Roundtrip + Verify + Migration | F |
| FP-45 | Recovery vor Import | Quota-Fehler silent | Externer Sicherungsbeleg, atomar | F |
| FP-46 | Settings Import/Export/Reset | Export `downloadBlob` fehlt I-38 | `copyboard-settings` v1, Undo/Scope | F |
| FP-47 | Sticky Notes / Help Notes | Außerhalb Spaces | Daten erhalten, ggf. neuer Ort in IA | P |
| FP-48 | Account Auth / Sign-Out | Vorhanden | Local-first bleibt beim Logout | P |
| FP-49 | Cloud Snapshot Publish | Revisionskontrolle, kein Merge | D-028 Multi-Device Konfliktvertrag | F |
| FP-50 | Supabase Realtime | Echtbetrieb ungetestet | RLS + Geräte-QA | G |
| FP-51 | Living Empty State | Neu D-026 | erst nach local durable commit auflösen | N |
| FP-52 | Smart Handoff ZIP/MD | Neu D-011 | Assets & Manifest ohne Broken Refs | N |
| FP-53 | Markdown Hybrid Composer | Neu D-007 | Draft isoliert, Dirty/Save/Versionen | N |
| FP-54 | Recorder + Timeline + Context Rail | Neu D-008..D-010 | Audio/Assets vollständig committen | N |
| FP-55 | Trust Center / Recovery Studio | Neu D-028/D-029 | lokaler Save, Cloud ACK, Delete/Restore | N |
| FP-56 | Adaptive Mobile Dock | Neu D-030 | Plattform-API, Safe Area, Keyboard | N |
| FP-57 | Adaptive Theme/Density/Settings | Neu D-031..033 | Pref-Scope eindeutig, kein UI-Duplikat | N |
| FP-58 | Nested Folder Navigation | Neu D-024 | Cycle detection, Tree Moves, Restore | N |

**Paritätszählung:** 58 eigenständig prüfbare Funktions-/Vertragszeilen. Kein implizites Recht, ein Legacy-Feature wegen geringer Nutzung still zu streichen; für nicht sinnvoll migrierbare Funktionen ist eine **explizite** Produktentscheidung nötig.

---

## 8. Browser-/PWA-/Recording-Machbarkeit

| Fähigkeit | Baseline | Benötigter Nachweis vor Zusicherung |
|---|---|---|
| `MediaRecorder` | Chromium-Mock Aufnahme, feste WebM-Annahme | echte Safari/iOS-/Android-Codecs, `MediaRecorder.isTypeSupported`, Audio-Abbruch, Mic Permission |
| Hintergrundaufnahme/PWA | Nicht untersucht | Screen lock, Tab Hintergrund, OS-App-Kill; **keine zugesicherte Hintergrundaufnahme** |
| Clipboard Read/Write | Browserberechtigungen variieren | Safari/Firefox, iOS, Fallbacks für Text/Bild, echte User Gestures |
| Drag & Drop | Desktop weitgehend nutzbar | Touch alternative Aktionen, iOS Long Press, virtuelles Keyboard |
| Offline | Board im Audit lokal nutzbar, CDN-Ausfälle getrennt | echte Offline-Startfähigkeit hängt von Caching/Hosting; kein PWA-Offline-Start-Versprechen |
| Local Storage | In-memory/Quota bekannt | Browserprofile, Private Mode, Eviction, Safari 7-Tage-Regeln und externes Backup |
| IndexedDB / OPFS | Nicht vorhanden | Konfig/Support & Write-Transaction QA, große Blobs, Migration |
| OCR | CDN und weitere Runtime-Assets | Offline-Sprachen, echte Qualität, Datenschutz, Performance |
| Native Share/ZIP/Download | Browserabhängig | Gerätetest, Fallback und Inhaltsvalidierung |
| Reduced Motion/A11y | Neue Designspezifikation, nicht Legacy-Tests | WebKit/Firefox + reale Screen Reader/Keyboard-Checks |

**Technikquellen zur Plausibilisierung:** [MDN — Storage quotas/eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [MDN — Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [MDN — MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported), [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Kein allgemeiner Browser-Supportclaim wurde hier auf echtem Gerät gemessen.

---

## 9. Implementierungsarchitektur — Optionen statt heimlicher Stackwahl

### Option A: Bestehende ES Modules schrittweise stabilisieren

**Stärken:** Kein abruptes Toolchain-Risiko, geringere Migration zu Beginn; vorhandene DOM-Verträge können zunächst erhalten bleiben.  
**Risiken:** 5.099-Zeilen-Closure, UI/Mutationen eng gekoppelt, hohe Komplexität der 33er-Ziel-IA.  
**Sinnvoll für:** kurzfristige Daten-/Security-Fixes und Testnetz, auch bei späterer Frameworkmigration.

### Option B: Nach Stabilisierung React + TypeScript + Vite (oder gleichwertiger Komponentenstack)

**Stärken:** Komponenten- und State-Verträge des Blueprints leichter ausdrückbar, Reuse und Testbarkeit, neue Motion-/Responsive-Shell besser kapselbar.  
**Risiken:** UI-Neubau plus Storage-/Auth-Migration zur gleichen Zeit gefährlich; alte PIN-/Backup-/Clipboard-Funktionen können verloren gehen; Build/Hosting ändert sich.  
**Sinnvoll für:** größere strukturelle Modernisierung **nach** Migration/Regression-Safety und separat entschiedener Stackwahl.

### Architekturprinzip, unabhängig von A/B

**Eine fachliche Source of Truth** und ein definierter Mutationspfad; UI nur Projektion. Klare Schnittstellen `StorageAdapter`, `BackupCodec`, `SyncAdapter`, `AssetStore`, `MutationService`, `RecoveryService`, `CaptureInputRouter` und `FeatureCapabilities`. Provenienz/Fehlerstatus jeder Operation explizit, observierbar, testbar. **Keine zweite Datenhaltung durch schwebende UI-Module.**

**Empfehlung:** Zuerst **Stabilization First** (ohne Framework-Entscheidung). Die konkrete Stackwahl erst mit geprüftem Datenmigrations-PoC und minimalem Vertical Slice entscheiden. Nicht ohne Freigabe in Phase 05 abschließen.

---

## 10. Geordneter Run-Plan (Freigabeprotokoll, ausdrücklich NO EXECUTION)

| Run | Ziel | Vorbedingung | Fertig, wenn ... | Änderungen erlaubt? |
|---|---|---|---|---|
| R00 Read-only Baseline | Branch-/Feature-/DB-Inventar, Datenbackup-Anleitung, Snapshot SHA | keine | Vollständige Inputs/Fixtures und Staginggrenzen | **Nein** |
| R01 P0 Data-Loss Guard | I-35/I-36, Save-Status, Quota und Quarantäne | ausdrücklicher Auftrag | 100 % Guard-Tests, kein Überschreiben von rohen Daten | Nur nach Freigabe |
| R02 P0 Security & Privacy | I-31/32/33b, I-02, sichere Imports/CDNs, PIN-Leaks | R01/isolierter Testbranch | Angriffsklassen negativ, Clipboard-Secrets nie gecaptured | Nur nach Freigabe |
| R03 Regression Infrastructure | Playwright/CI, Accessibility, Mock Supabase | R01/R02 | Alt-Feature-Matrix als regressiver Gate | Nur nach Freigabe |
| R04 Storage & Migration PoC | IndexedDB/Blob-Store, Read-only Legacy Import | R01–R03 | Crash-/Quota-Roundtrip, Rollback und PIN-Ciphertext-Test | Nur nach Freigabe |
| R05 Cloud/Recovery Architecture | RLS/RPC Schema, revisionssicherer Sync/Trash | R04 + Backend-Audit | Cross-user/Device Konfilikt- und Restore-Tests | Nur nach Freigabe |
| R06 App Shell/DS Slice | Sidebar/Ambient/Capture/Grid, no data-path rewrite | R03 + gewählte Stackstrategie | Screenshots, Focus, Reduced Motion, Parity | Nur nach Freigabe |
| R07 Composer/Recorder/Context | D-007..011, Sessions, Handoff | R04–06 | Browser-Recording, interrupts, export manifest | Nur nach Freigabe |
| R08 Trust/Recovery/Mobile | D-028..030, Multi-device/PWA | R05–07 | echte Hardware, Error/Conflict, Retention | Nur nach Freigabe |
| R09 Hardening & Release | Full parity, migrations, rollback, staging soak | R01–08 | Go-Live Checklist signed, Backup/Restore rehearse | Nur nach Freigabe |

**Architektur-Abhängigkeit beachten:** Einzelne Runs können anders geschnitten werden; sie sind **ein Plan**, keine Erlaubnis zum Schreiben/Pushen. R01/R02 stabilisieren den existierenden Datenpfad isoliert; nicht zeitgleich vollständige UI ersetzen.

---

## 11. Reproduzierbare QA- und Abnahmefälle

| Test-ID | Testfall / Akzeptanzkriterium |
|---|---|
| TF-QA-01 | Ungültiges State-JSON startet **nicht** mit stiller Neuinitialisierung/Überschreibung. |
| TF-QA-02 | Unbekannte zukünftige Schema-Version bleibt bytegenau erhalten, read-only Warnung. |
| TF-QA-03 | Simulierter QuotaExceeded nach Hinzufügen → kein falscher grüner Save-ACK, Export möglich. |
| TF-QA-04 | Tab-Kill zwischen Asset und Metadata Commit → keine verlorenen oder verwaisten Items. |
| TF-QA-05 | Import V16–V22, state_v1 und Space Backup als Fixtures gelesen/gezählt. |
| TF-QA-06 | PIN-V1-Datensatz nach Migration mit altem PIN identisch entschlüsselbar. |
| TF-QA-07 | Verschachtelter Ordner-Delete/Undo/Trash erhalten alle Child-Assets. |
| TF-QA-08 | Multi-File-Duplikate führen nicht zum Drop nicht-doppelter Dateien. |
| TF-QA-09 | Paste in Passwortfeld/PIN/Editor/Suche führt nie zu Board-Karte. |
| TF-QA-10 | Board-Paste außerhalb Eingabefokus funktioniert weiterhin für Text und Bild. |
| TF-QA-11 | Importierter Space-Name wird nicht ausführbar gerendert. |
| TF-QA-12 | Importierte Space-Farbe wird normalisiert/abgewiesen. |
| TF-QA-13 | Importiertes Dateipayload erzeugt keine `javascript:`-Navigation. |
| TF-QA-14 | Dependency-CSP/SRI/pinning: keine unkontrollierten CDN-Versionen. |
| TF-QA-15 | Account A kann weder Row noch Snapshot von Account B lesen/schreiben/löschen. |
| TF-QA-16 | RPC verweigert Owner-fremden object_path auch bei geänderter Payload. |
| TF-QA-17 | Offline → Pending → Retry → korrekter Cloud-ACK, ohne fiktives Synced. |
| TF-QA-18 | Zwei Geräte editieren dieselbe Revision; keine stille Überschreibung. |
| TF-QA-19 | Remote-Update bei offenem Composer erhält lokalen Draft und Konfliktangabe. |
| TF-QA-20 | Nur „Zuletzt“ öffnen produziert keine Content-Cloud-Revision. |
| TF-QA-21 | Accountwechsel vermischt lokale Boards nicht ohne Nutzereinwilligung. |
| TF-QA-22 | Restore einer alten Fassung erhält aktuelle als eigene Revision. |
| TF-QA-23 | Wiederholtes Restore/Retry löscht keine aktuellen Assets und erzeugt keinen Loop. |
| TF-QA-24 | Gesperrte Cards verraten keinen Inhalt über Quick Look, Suche oder Kontextaktionen. |
| TF-QA-25 | Settings Export importierbar, kein `downloadBlob`-ReferenceError. |
| TF-QA-26 | Folder ZIP mit gemischten/gesperrten Objekten – keine Crash-/Leckfolge. |
| TF-QA-27 | Import/Export Roundtrip preserves Space-Reihenfolge, Pins, Sort, customName, Notes. |
| TF-QA-28 | Cmd/Ctrl+K im Composer folgt freizugebender Shortcut-Hierarchie, ohne Textverlust. |
| TF-QA-29 | Esc schließt oberstes Overlay; kein Ghost-Click und kein unerwartetes Commit. |
| TF-QA-30 | Bulk Move/Undo ist eine logische Transaktion. |
| TF-QA-31 | Rec Stop / Permission Denied / Background unter Safari/iOS/Android liefert ehrliche Session. |
| TF-QA-32 | Handoff ZIP enthält alle referenzierten lokalen Assets und Manifest. |
| TF-QA-33 | 100+ Items Grid/Compact mit Reduced Motion und Screenreader-Keyboard. |
| TF-QA-34 | Storage-Löschung/Browsing-Data-Clear: ehrliche Warnungen/Backup-Anleitung, keine falsche Durability. |
| TF-QA-35 | Nach Deploy/Migration ist das getestete Rollback inklusive Wiederherstellung ausführbar. |
| TF-QA-36 | Live und Staging IDs / Supabase Credentials technisch getrennt und sauber dokumentiert. |

**Ausführung:** Alle 36 Testfälle sind **noch nicht ausgeführt**. Zusätzlich gelten die Audit-58-Szenarien, Blueprint-02-20-Szenarien, Blueprint-03-36-IM-QA und Blueprint-04-32-DS-QA. Diese Zählungen sind verschiedene Testmengen mit potenzieller Überlappung; **nicht** zu einer „Gesamttestabdeckung“ addieren.

---

## 12. Offene Human- und Technical-Gates

### Human

- **H-01:** Folder Card Primäraktion (direkte Navigation vs. Inspector); Vorschlag direct-open mit Info-Aktion.
- **H-02:** finale Escape-/Back-/⌘K-Shortcut-Policy in Editor/Command Palette.
- **H-03:** Preference Scope (`device`, `board`, `space`, `account`) pro Key.
- **H-04:** Bulk Drag/Move und Folder-Cycle-Semantik für verschachtelte Ordner.
- **H-05:** Trash-/Revision-Retention und Datenschutz/Löschverhalten; keine erfundene Frist.
- **H-06 (neu identifiziert):** Burn-Link-Produktaussage: „normaler teilbarer Textlink“ oder echter servergebundener One-Time-Mechanismus.
- **H-07 (neu identifiziert):** Framework-/Frontend-Migrationsstrategie (ESM-Weiterentwicklung versus React/TS/Vite), nach Stabilisierung/PoC.
- **H-08 (neu identifiziert):** Cloud-Accountwechsel und Same-Device-Multi-Account-Onboarding/Merge-UX.

### Technical (nachzuweisen, nicht als implementiert ausgeben)

- **T-01:** Datenintegrität/Quota/Migration/Backup inklusive Crash-Recovery.
- **T-02:** Cloud RLS, RPC, Snapshot-Policies, Realtime, Ownership und echte Konfliktbehandlung.
- **T-03:** Security-XSS, sichere Imports, PIN/Locked-Metadaten, Clipboard Privacy, Supply Chain.
- **T-04:** Recorder, Mobil-/PWA-/Clipboard-API und echte Geräte.
- **T-05:** Regression, Feature-Parity und Live-Observability/rollback.

---

## 13. Entscheidungsempfehlung und nächster Auftrag

**Technische Empfehlung:** Die 33 UX-Beschlüsse **unverändert behalten**. **Keinen Full Redesign Coding Run autorisieren**, bevor mindestens R01–R03 als eigene abgesicherte Stabilisierung realisiert und überprüft wurden; ohne Live-DB-Zugang einen Cloud-Erfolg oder RLS-Sicherheit nie behaupten. Den Stack erst danach anhand eines Vertical-Slice-Prototyps und konkreter Tests wählen.

**Nächster sinnvoller Dokumentationsschritt:** Consolidation Phase 06 — **Implementation Readiness & Agent Runbook** als read-only Plan mit Run-spezifischen Prompts, Branch-Regeln, deterministischen Akzeptanztests, Human Gates, Rollback, Deploy-Gates. **Noch kein Codieren.** Für eventuell benötigte Backup-/Stabilisierungsruns ausdrücklich separate, präzise Freigabe einholen.

### Prüfliste der Grenzen

- [x] 33 Designentscheidungen als Ledger referenziert, keine Änderung daran
- [x] Audit-/Repo-SHA sowie geprüfte Pfade benannt
- [x] Quelle/Evidenzgrad vs. neues Soll getrennt
- [x] Legacy-PIN- und Backup-Kompatibilität als harte Gates erfasst
- [x] RLS/Backend und echte Mobilplattformen als **ungeprüft** markiert
- [x] 58 Zeilen Feature-/Contract-Crosswalk + 36 künftige QA-Fälle
- [ ] Tests umgesetzt/ausgeführt
- [ ] Backend-Security bestätigt
- [ ] Nutzerfreigaben H-01..H-08 erteilt
- [ ] Implementierung/Branch/Deployment freigegeben

**Quellenhinweis:** Befundzahlen und Defekte folgen den am 21.10.2026 auf dem Audit-Branch dokumentierten Ergebnissen; Phase 05 selbst war eine read-only Detailprüfung von GitHub-Rohdateien und kein neuer Runtime-Testlauf.
