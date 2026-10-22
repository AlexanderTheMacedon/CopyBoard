# CopyBoard — Implementation Readiness & Agent Runbook 06 · Revision 1.2 (React/TypeScript + CUTLER R00)

**Consolidation Phase:** 06 · Implementierungsvorbereitung und Freigabechoreografie  
**Stand:** 21. Oktober 2026  
**Status:** **READ-ONLY PLAN / NOT APPROVED FOR EXECUTION**  
**Repository:** [`AlexanderTheMacedon/CopyBoard`](https://github.com/AlexanderTheMacedon/CopyBoard)  
**Unveränderte Zielprodukt-Beschlüsse:** D-001 bis D-033 im Masterplan v0.41  
**Technische Basis, zuletzt read-only geprüft:** `main` = `develop` = `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3`; Audit-Branch `audit/copyboard-technical-baseline-run-01` = `33600a1c5d5c9c842ff84585e429796f0dff7c3e`. **Die SHAs sind Referenzen, vor jedem späteren Run neu read-only verifizieren.**

> **VERBINDLICHE FREIGABEGRUNDLAGE:** Dieses Dokument darf gelesen, kopiert und für Agentenbriefings verwendet werden. Es autorisiert **weder** Branch/Commit/Push/PR **noch** DB-/Storage-Änderungen, echte Cloud-Tests, Produktivzugriffe oder Deployments. Jeder schreibende Run braucht einen **gesonderten ausdrücklichen Nutzerauftrag**. Insbesondere sind die nachfolgenden Prompts **Vorlagen, keine hiermit gestarteten Aufgaben**.


> **ARCHITEKTURUPDATE 21.10.2026 — VORRANGIG:** Der Nutzer hat **React + TypeScript** als Zielstack ausdrücklich festgelegt (**H-07: CLOSED**). **Vite bevorzugt**, abhängig von Build-/Hosting-PoC. Historische „Framework offen“-Formulierungen in früheren Artefakten sind überholt; kein Agent darf React versus ESM erneut zur Produktentscheidung machen. **R01/R02 schützen weiter die aktuelle ESM-App**, die tatsächliche React-Migration startet erst in getrennt autorisierten Runs nach P0-Fixes und Tests. [ADR-007](CopyBoard-ADR-007-React-TypeScript-Target-2026-10-21.md). **Keine Ausführung genehmigt.**

## 0. Quellen, Belegqualität und Produkt-Guardrails

1. [Masterplan v0.38](CopyBoard-Design-Masterplan-v0.38-2026-10-21.md) → 33 verbindliche Gestaltungsrichtungen (fortgeschrieben in v0.39, Ledger inhaltlich unverändert).
2. [Decision Integrity Audit 01](CopyBoard-Decision-Integrity-Audit-01-2026-10-21.md) → 33/33, 5 P0, 10 P1, 18 UX-Szenarien.
3. [Screen Inventory & IA 02](CopyBoard-Screen-Inventory-IA-Blueprint-02-2026-10-21.md) → 28 Screen-/State-Kontexte, 10 Interaction Contracts, 20 konzeptionelle QA-Szenarien.
4. [Interaction & Motion 03](CopyBoard-Interaction-Motion-Blueprint-03-2026-10-21.md) → 11 State Machines, 12 Motion Storyboards, 36 konzeptionelle QA-Szenarien, 80/20 Expressive/Soft.
5. [Design System & Component States 04](CopyBoard-Design-System-Component-States-Blueprint-04-2026-10-21.md) → 40 Komponentenfamilien, Token-Kandidaten, 32 konzeptionelle Design-QA-Szenarien.
6. [Technical Feasibility & Feature Parity 05](CopyBoard-Technical-Feasibility-Feature-Parity-Blueprint-05-2026-10-21.md) → G-01..G-06, 58 FP-Verträge, 36 vorgeschlagene technische QA-Szenarien.
7. [Repository-Baseline-Audit, Branch Run 01](https://github.com/AlexanderTheMacedon/CopyBoard/tree/audit/copyboard-technical-baseline-run-01/docs/audits/copyboard-technical-baseline) → 58 bereits geprüfte Browser-Szenarien, 27 dokumentierte Defekte, Screenshots, Test-Harness und Einzelbelege. **Historischer Audit-Lauf, kein neu ausgeführter Test in Phase 06.**

**Fachliche Nichtverhandelbarkeit:** lokale Nutzung ohne Account; bestehende `copyboard_state_v1`-/Backup-/Space-/Settings-Formate und PIN-Ciphertexte lesbar halten; keine heimliche Migration oder Löschung; Clipboard-Paste im fokussierten Editor bleibt Editor-Paste; Space-/Item-IDs und Anhangsreferenzen stabil; echte lokale Save-ACKs und separat bestätigte Cloud-ACKs; kein Fake-Burn-Link; die D-001..D-033 bleiben die UI-Quelle. Unbekannte Supabase-RLS/Storage-/RPC-Definitionen und iOS-/Safari-Geräteverhalten gelten **nicht als verifiziert**.

### 0.1 Evidenzklassen

| Kürzel | Bedeutung | Darf als „geprüft“ berichtet werden? |
|---|---|---|
| `[CODE]` | In Repository-Dateien nachgelesen | Nur statischer Code-Stand, kein Live-Beweis |
| `[AUDIT]` | Im Baseline-Audit reproduziert/dokumentiert | Als **historischer** reproduzierter Befund, nicht als frischer Run |
| `[DESIGN]` | Vom Nutzer ausdrücklich gewählte D-Entscheidung | Als UX-Anforderung, nicht implementiert |
| `[PROPOSAL]` | Konkrete technische/UX-Ausgestaltung | Nein; Freigabe oder technische Evaluation erforderlich |
| `[UNVERIFIED]` | Backend, Staging, Live oder Hardware ungeprüft | Niemals als nachgewiesene Funktion darstellen |

## 1. Status und Freigaben

**Jetzt:** `PLAN COMPLETE / EXECUTION NOT AUTHORIZED`.

Die Implementierungssequenz nutzt die im Phase-05-Dokument eingeführten **R00–R09** und verändert ihre Reihenfolge nicht. Aus dieser Sequenz ergeben sich drei voneinander getrennte Freigabearten:

- **Research Gate:** Rein lesende GitHub-/Dokumentationsarbeit. Kein Shell-Befehl, der lokale Referenzen, Dateien oder Datenbanken modifiziert, ohne ausdrücklich genehmigten Arbeitsbereich.
- **Implementation Gate:** Genau ein benannter schreibender Run, mit separatem Branch, konkretem Diff-Scope und Tests. Kein automatisches Ausführen des Folge-Runs.
- **Release Gate:** Staging und besonders Production verlangen eine **eigene explizite Freigabe**. Ein gemergter Branch ist keine Deploy-Freigabe.

### 1.1 Statusmodell je Run

`PLANNED → AUTHORIZED → IN_PROGRESS → TESTED → HUMAN_REVIEWED → MERGED (optional) → DEPLOYED (separate approval)`. `BLOCKED` oder `CUTLER` unterbrechen das Vorhaben; ohne ausdrückliche Zustimmung keine Promotion. Die erste Autorisierung wird hier **nicht** erteilt.

### 1.2 Branch- und Merge-Disziplin (Vorschlag, nie automatisch ausführen)

- `main`: ausschließlich freigegebene Production-Releases.
- `develop`: Integrationsbasis, nach separat abgenommenen PRs.
- Audit-Branch bleibt **read-only historische Referenz**, nicht ungefragt in `develop` mergen; die dortigen Dokumente und Harness-Dateien können auf Freigabe später gezielt übernommen werden.
- Für einen genehmigten Run vor dem Branch-Anlegen Ausgangs-Branch, Remote-Head, Dirty-Status, offene Änderungen und Asset-Sicherungen **prüfen**. Sollten die referenzierten SHAs inzwischen abweichen, neue Basis dokumentieren und keine SHA erzwingen.
- Schreibende Runs starten **einzeln von aktuellem `origin/develop`** und schließen mit separatem PR. Keine parallelen Mutationen derselben State-/Sync-Dateien; keine direkten Pushes zu `main`/`develop`, kein Force Push, kein automatisches Merge.
- Benennungsvorschläge stehen in der Run-Matrix; die Namen sind **reservierte Beispiele, keine erzeugten Branches**.
- Keine schreibenden Tests gegen Production-Supabase. Testumgebungen und Datenräume müssen nachweislich getrennt sein; beim Fehlen: **STOP**.
- Jeder Agent liefert am Ende `CUTLER`-fähige Übergabe: SHA, Dateiliste, Teststatus, offene Risiken, Artefakte, konkrete nächste Freigabe; während der Planung keine SHAs erfinden.

### 1.3 Werkzeug-/Agenten-Rollen (Empfehlung, keine Qualitätssicherheit)

- **Claude Opus, High Thinking:** Architektur, Daten-/Security-Änderungen, Storage-/Sync-Migrationsentwurf, zentrale Reviews.
- **Claude Sonnet, High Thinking:** Eng gefasste Implementierungs- und Regression-Runs nach stabiler Spezifikation.
- **GPT-6, High Thinking oder ein separater zweiter Reviewer:** Gegenprüfung von Migration, Testlücken, Sicherheitsgrenzen, Design-Parity – möglichst nicht dasselbe Modell/Prompt, das den Change geschrieben hat.
- Die Agentenwahl ist **nicht** entscheidend für QA-Wahrheit. Entscheidend sind Scope, Reproduktion, Diff-Review, unabhängige Tests, Human Gate und Rollback.

## 2. Sequenzielle Run-Matrix mit Abhängigkeiten

| Run | Gegenstand | Vorgeschlagener Branch | Voraussetzungen | Freigabe-/Mergeziel | Nachweis vor Abschluss |
|---|---|---|---|---|---|
| **R00** | Read-only Baseline & Repro-Plan | **Kein Branch** | Read-Zugriff, bestehende Auditquellen | Bericht, kein PR | SHA, Backend-/Production-Grenzen, Testplan, Dateninventar |
| **R01** | Data-Loss Guards für Legacy | `fix/copyboard-storage-guards-r01` | R00 und explizite Schreibfreigabe | isolierter PR → `develop` | I-35/I-36 negativ, keine Originalüberschreibung, Save-ACK-Wahrheit |
| **R02** | Stored-XSS + Paste Privacy | `fix/copyboard-security-privacy-r02` | R01-Freigabe/Koordination, Testfixtures | isolierter PR → `develop` | I-31/32/33b und I-02 geschlossen; PIN-/Importleaks abgedeckt |
| **R03** | Testnetz/CI/Feature-Parity | `test/copyboard-regression-r03` | R01/R02 bestätigt | isolierter PR → `develop` | früherer Harness reproduzierbar, CI/Testberichte, Failure-Gates |
| **R04** | Storage-/Migration-Prototyp | `spike/copyboard-storage-migration-r04` | R01–R03, Migrationsziel definiert | **PoC-Review, kein automatischer Produktiv-Merge** | idempotente Lesbarkeit, Crash-/Quota-/PIN-Tests, Rollback |
| **R05** | Cloud/Recovery Architektur & Backend-Review | `spike/copyboard-sync-recovery-r05` | R04-Befunde, reale RLS/RPC/Storage-Read-Zugriffe oder als BLOCKED | **Architektur-Gate vor DB-Schreiben** | Zugriffskontrollen, Cross-Device-Konflikte, Asset-Revisionen, Konto-Isolation |
| **R06** | App Shell + Designsystem Vertical Slice | `feature/copyboard-shell-r06` | R03; React + TypeScript gesetzt, Vite-PoC, Adapter-Schnittstellen | UI-PR ohne Datenpfad-Rewrite | Sidebar/Ambient/Space/Smart Capture/Grid + A11y/Motion |
| **R07** | Composer, Recorder, Context & Handoff | `feature/copyboard-composer-recorder-r07` | R04–R06, Browserfähigkeit evaluiert | PR nach realer Session-/Export-QA | Markdown, Originale, Zeitbezüge, ZIP, Permission-/Offline-States |
| **R08** | Trust, Recovery, Mobile & Integration | `feature/copyboard-trust-mobile-r08` | R05–R07, H-01..H-08 geklärt, echte Geräte | PR + Hardware-Gate | Save/Sync-ACK, Undo/Trash/Versionen, Mobile Dock, PWA |
| **R09** | Hardening, Staging, Release-Candidate | `release/copyboard-refresh-r09` (**erst nach Freigabe**) | R01–R08 bestanden, Backend/QA bestätigt | Staging und später separater Production-Gate | Migration Drill, Feature-Parity, Fehlertelemetrie, Recovery/Rollback |

**Abhängigkeitsausnahme:** R06 kann ein rein visueller, isolierter, nicht auf Production zugreifender Vertical Slice werden, bevor R04/R05 live integriert sind, wenn der Stack entschieden und die Legacy-Schnittstelle gemockt ist. Ein solcher Slice ist **kein** Release-Gate für Sync/Recovery. R04/R05 bleiben unabhängig als PoC/Architekturphase, keine verdeckten Live-Migrationen.

## 3. Human Gates – die bewusst noch offenen Produktentscheidungen

| Gate | Entscheidung / zu liefernder Nachweis | Idealer Zeitpunkt | Wenn offen ... |
|---|---|---|---|
| **H-01** | Ordnerkarte: Primärklick direkt öffnen (empfohlen) oder Inspector; separate Info-Aktion | R06 | Folder-Card-Interaktion nicht finalisieren |
| **H-02** | Escape/Back/⌘K im Composer und globale Shortcut-Priorität | R06/R07 | kein Shortcut-Hijacking |
| **H-03** | Preference-Scope: pro Gerät, Board, Space, Account; Migrationsregel | R04/R06 | keine stillen Cross-Device-Overrides |
| **H-04** | Gruppen-Drag vs. Bulk Move; Nested-Folder-Zyklen/Order | R06 | keine still eingeschaltete Mehrfachverschiebung |
| **H-05** | Retention, Lösch-/Privacy-Politik, Anhänge, Revisionen | vor R05/R08 | keine erfundenen Aufbewahrungszeiten |
| **H-06** | Burn-Link: ehrlich benannter teilbarer Link oder echte serverseitige Einmalfreigabe | vor Feature-Parity in R08 | keine falsche „einmal lesen“-Behauptung |
| **H-07** | **GESCHLOSSEN: React + TypeScript verbindlich; Vite bevorzugt, Build-PoC erforderlich** | Beschluss 21.10.2026 | kein React-vs.-ESM-Entscheidungsgate mehr |
| **H-08** | Sign-in eines anderen Accounts bei vorhandenem lokalen Board: Trennung/Import/Merge | vor R05/R08 | keine automatische Übertragung fremder lokaler Daten |

**H-07 ist explizit entschieden.** Die übrigen H-01..H-06 und H-08 bleiben offen und dürfen von Agenten nicht eigenmächtig entschieden werden. Technische Notwendigkeiten sind davon getrennt: T-01 Daten-/Quota-Integrität; T-02 Backend-RLS/RPC/Sync; T-03 XSS/Clipboard/PIN; T-04 Safari/iOS/PWA/Recorder; T-05 Regression/Parity/Rollback. Die G-01..G-06 aus Blueprint 05 bleiben harte technische Gates.

## 4. Globaler Agentenvertrag (jeden späteren Run-Prompt voranstellen)

```text
PROJEKT: AlexanderTheMacedon/CopyBoard
MODUS: Ausführung ausschließlich innerhalb des ausdrücklich freigegebenen Runs.

1. Lies README, Konfiguration, betroffene Codepfade, Baseline-Audit und die
   für diesen Run relevanten CopyBoard-Blueprints (D-001..D-033 bleiben gültig).
2. Verifiziere Branch, HEAD, Remote-Basis, Working-Tree-Status und Scope.
   Bei Divergenz oder ungesicherten User-Dateien: STOP; nichts überschreiben.
3. Kein ungefragtes Deployment, kein main-Push, kein Force-Push, kein PR-Merge.
   Keine produktive Supabase-Mutation, kein Eintragen/Loggen realer Tokens,
   keine Daten-Exfiltration und keine künstlichen Sicherheits- oder Save-ACKs.
4. Arbeite minimal-invasiv, halte Legacy-Formate lesbar und Datenspeicherung
   transaktional/testbar. Beweise jede Erfolgsmeldung mit dem echten Commit-ACK.
5. Für jeden Befund: CODE / historischer AUDIT / neuer TEST / UNVERIFIED trennen.
6. Führe Tests tatsächlich aus oder markiere sie ehrlich als NICHT AUSGEFÜHRT.
   Ein Testkatalog und ein Screenshot sind keine erfolgreiche Testausführung.
7. Halte bei Datenverlust, offenem Produktionszugang, unsicherer Migration,
   fehlender RLS oder unverifizierbarer Behauptung sofort an.
8. Abschlussbericht: Scope, geänderte Dateien, Tests mit PASS/FAIL/SKIP,
   SHA (nur falls real), offene Risiken, Rollback, Human Gate. CUTLER-Freeze.
```

## 5. Copy-Paste-Briefings für die zehn Runs

**Nutzung:** Den jeweiligen Run-Prompt **erst nach gesonderter Freigabe** zusammen mit §4 in der Repository-gebundenen Agentenumgebung ausführen. Für einen rein konzeptionellen Folgeauftrag bleibt §4 auf read-only beschränkt. Agenten sollen die Artefakte selbst einlesen; Dateien, die nicht im Repository liegen, müssen vom Nutzer angehängt oder bewusst ins geplante Dokumentationspaket übernommen werden. **Nicht annehmen, dass ein Agent diese Sandbox-Dateien automatisch kennt.**

### R00 — Baseline, Import-Recovery & Run-Freeze (READ-ONLY)

**Modellvorschlag:** Claude Opus High oder GPT-6 High. **Autorisierbare Aktion:** Berichte lesen und schreiben **nur im vom Nutzer freigegebenen Ausgabeort**, sonst keine Repo-Schreiboperation.

```text
COPYBOARD — R00 READ-ONLY BASELINE & SAFETY PREFLIGHT
Repository AlexanderTheMacedon/CopyBoard, audit baseline
`audit/copyboard-technical-baseline-run-01`, main/develop SHA neu ermitteln.
Keinen Branch anlegen, nichts committen, pushen, deployen oder gegen echte
Backend-Daten mutieren. Schreibe keine Secrets oder Board-Payloads in Logs.

1. Prüfe HEADs, README, app.js, config/constants.js und Auditdokumente 01–06.
2. Trenne behobene/ungeprüfte/neue Befunde. Reproduziere nur in nachweislich
   isoliertem lokaler Sandbox und nur wenn dafür explizit freigegeben.
3. Entwerfe gesicherte Backup- und Notfall-Export-Schritte für den Nutzer, aber
   lese/extrahiere keine produktiven lokalen Browserdaten ohne Freigabe.
4. React + TypeScript sind als Zielstack festgelegt; entwirf read-only die
   modulare Zielarchitektur, typisierte Legacy-Adapter und Vite-Build-PoC.
   Nicht React versus Vanilla JS neu zur Wahl stellen.
5. Erstelle eine Risiko-/Diff-Scope-Matrix für R01–R03; definiere fixtures
   mit kaputtem JSON, future-schema, Quota, geheimen Paste-Feldern und XSS.
6. Liefere Cutler-Report mit neuen HEADs, Repro-Grenzen und R01-Freigabe-Check.
STOP wenn eine Basis oder Sicherheitsgrenze ungeklärt ist.
```

**Abnahme R00:** Nur lesender Bericht; exakte SHAs; keine geänderten Repo-Dateien; Testergebnisse klar historisch/neu markiert. **R00 ist noch nicht ausgeführt.**

### R01 — P0 Durable Load & Save Guards (WRITES ONLY IF AUTHORIZED)

**Modellvorschlag:** Claude Opus High; unabhängiger Review GPT-6 High. **Branch-Kandidat:** `fix/copyboard-storage-guards-r01`.

```text
COPYBOARD — R01 P0 DATA LOSS GUARDS (GESONDERT FREIZUGEBEN)
Neuen isolierten Branch von verifiziertem origin/develop; keine DB/Live-Änderung.
Scope: I-35, I-36 und die Save-Status-Wahrheit im EXISTIERENDEN ESM-Code.
NICHT: React/TS, Redesign, IndexedDB-Rollout, Cloud-Schema-Rewrite.

Implementiere eine nicht-destruktive Ladezustandsmaschine: 'leer' ist nie
mit 'unlesbar' oder 'future schema' gleichzusetzen. Unlesbare Rohdaten dürfen
nicht durch einen neuen Default-State überschrieben werden; kontrollierter
read-only-/Export-/Recovery-Pfad. Isoliere und teste diesen Pfad.
Ein fehlgeschlagenes lokales persistState/setItem führt zu sichtbarem
UNSAVED/ERROR, keinen vorgetäuschten Success-/Undo-/Capture-ACKs, und darf
vorige Persistenz nicht beschädigen. Wiederholtes Speichern und Reload testen.
Scope der 20-MiB-Angabe ehrlich behandeln; keine pauschale Quota-Garantie.

Tests: beschädigtes JSON, künftig unbekanntes Schema, Storage blocked,
QuotaExceeded, alternierende 2 erfolgreiche/1 fehlgeschlagene Commits,
Reload und Preimport-Slot unter Quota. Testfixture-Daten, keine User-Boards.
Lieferung: gezielter Diff + Tests + dokumentierter Rollback + Stop bei
möglicher Originalüberschreibung. Kein PR-Merge/Deploy ohne Gate.
```

**Abnahme R01:** Tests zu I-35/I-36 grün; tatsächlicher Local-Commit-ACK bestätigt; die originalen Bytes bleiben im Fehlerfall erhalten; keine neue Datenmigration. **CUTLER bei gefährdeter Lesbarkeit.**

### R02 — P0 Security, Paste & Safe Import (WRITES ONLY IF AUTHORIZED)

**Modellvorschlag:** Claude Opus High für Threat Model, Sonnet High für klar getrennte Fix-Patches; Independent Review. **Branch:** `fix/copyboard-security-privacy-r02`.

```text
COPYBOARD — R02 SECURITY & PRIVACY HARDENING (GESONDERT FREIZUGEBEN)
Arbeite auf Basis des abgenommenen R01-Standes in einem neuen isolierten Branch.
Scope I-31/I-32/I-33b und I-02, plus die direkt zugehörigen Import-/Preview-
Validierungen. Prüfe jede HTML-Senke, nicht nur die drei bekannten Beispiele.

Space-/Dateinamen und importierte untrusted Strings niemals als ausführbares
HTML injizieren; importierte Farben/Links/MIME/payloads validieren. Keine
javascript:- oder unsichere data:-Navigationsziele; keine Regression für
legitime Bild-/Audio-/Textdateien. Globalen Paste-Capture auf Board-Fokus
beschränken; Suchfeld, PIN, Account, Dialog, Markdown-Editor und contenteditable
gehen immer vor. PIN-Feldinhalt nie als Karte persistieren.

Liefer negativen XSS-/Paste-Testkatalog, CSP-/Dependency-Pinning-/SRI-Plan,
aber keinen unreviewten CSP-Rollout, der OCR oder Supabase unsichtbar bricht.
Gewöhnliche publishable Supabase-Client-Keys nicht als Secret-Leak bezeichnen;
RLS/Policies gesondert behandeln. Tests im isolierten Browser mit harmlosen
Test-Payloads; keine externen Netzwerk-Egress-Pfade oder echten Konten.
STOP wenn Auth oder PIN-Entschlüsselung beeinträchtigt wird.
```

**Abnahme R02:** Negative Tests für drei Stored-XSS-Klassen und Paste in allen Editor-/Secret-Feldern bestehen, wichtige Basisfunktion unverändert; unabhängiger Security-Review. **Nicht behaupten, Backend sei dadurch sicher.**

### R03 — Maintained Regression & CI (WRITES ONLY IF AUTHORIZED)

**Modellvorschlag:** Sonnet High für Harness/CI, Opus High für Scoping/Review. **Branch:** `test/copyboard-regression-r03`.

```text
COPYBOARD — R03 REGRESSION TEST SAFETY NET (GESONDERT FREIZUGEBEN)
Verwende den Alt-Audit-Harness unter docs/audits/copyboard-technical-baseline/
als Provenienz (nicht blind den ganzen Audit-Branch mergen). Errichte
reproduzierbare, versionierte Tests und CI auf develop für
Core-Capture, Legacy-Storage, Import/Export, Sort/Pin/Folder, PIN, OCR-Stubs,
Undo, Device-Scopes und mocked Cloud; dokumentiere die Abdeckungsgrenzen.

Beginne mit rot/grün-Tests für I-35/I-36, I-31/I-32/I-33b, I-02, I-C03/I-C05
(soweit mit reproduzierbaren isolierten Mocks möglich); daneben wichtige
Alt-Features und Tastatur-/Touch-Fälle. Kein produktiver Supabase-Zugriff.
Pinne Testdeps im eigenen Lockfile und liefere lokale Run-Commands, CI-Gates,
Flake-Protokoll und Beispiel-Reports. Unbekannte Failures = FAIL, nicht 'skip'
ohne Grund. Kein unnötiger Toolchainwechsel für den Runtime-Code.
STOP bei unstabilen oder irreführenden Testresultaten.
```

**Abnahme R03:** CI reproduzierbar; Fixture-Isolation beweisbar; keine falschen grün markierten Safari-/RLS-/Real-OCR-Tests; Baseline-Parity-Katalog referenziert.

### R04 — Storage/Migration Architectural Spike (REACT/TYPESCRIPT ADAPTER TARGET; NO LIVE MIGRATION)

**Modellvorschlag:** Claude Opus High. **Branch:** `spike/copyboard-storage-migration-r04`.

```text
COPYBOARD — R04 STORAGE & MIGRATION SPIKE (GESONDERT FREIZUGEBEN)
PoC mit anonymen Fixtures, kein echter Nutzerbestand und kein Production-
Schreibpfad. Evaluiere IndexedDB Blob Store + transaktionales Item-/Asset-
Datenmodell gegen minimale Erweiterung der ES-Module-Basis. OPFS optional nur
nach belegtem Bedarf. Lese CopyBoard State v1, Space-/Settings-Backups,
Legacy V16–V22 und PIN encData weiter. Keine echte Nutzerdatei entschlüsseln.

Migration: dry-run, Backup, Copy-on-write, versioned schema, explicit commit,
interruption-resume/idempotency, refcount/GC erst nach gesichertem Zustand,
quota/offline/crash checks und reversible Read-Only-Fallback. Beweise durch
Fixtures, dass alle referenzierten Assets erhalten sind.

Gib mindestens zwei Optionen mit Risiken, Speicher-/Browsergrenzen,
zeitlichem Migrationsfenster und automatisierten Tests; keine eigenmächtige Abkehr von React + TypeScript.
Abschluss: PoC/ADR + Human-/Technical-Gate, kein Release.
```

**Abnahme R04:** 0 verlorene Fixture-Items nach Crash-/Reload-/Retry; bewusste und getestete Legacy-Lesbarkeit; PIN-Ciphertext unverändert entschlüsselbar; kein Production-Rollout.

### R05 — Supabase, Conflict & Recovery Architecture (BACKEND READ-ONLY FIRST)

**Modellvorschlag:** Claude Opus High + unabhängiger Security Review. **Branch-Kandidat:** `spike/copyboard-sync-recovery-r05` **nur nach Autorisierung**.

```text
COPYBOARD — R05 CLOUD/RECOVERY SECURITY ARCHITECTURE
Zuerst ausschließlich READ-ONLY SQL-/Policy-/RPC-/Storage-/Realtime-/Auth-
Inventar aus autorisierter Staging-Konfiguration. Sind echte Backend-Policies
nicht lesbar: BLOCKED, niemals RLS-Sicherheit behaupten.

Prüfe copyboard_boards, copyboard-snapshots, RPC copyboard_publish_snapshot,
Owner-Prefix, Storage delete/read/write, atomic revision compare, realtime
ownership und same-device account switch. Entwerfe conflict-safe Strategien
mit getrennten local commit, upload pending, cloud ACK. Remote Snapshots dürfen
keinen dirty Editor still überschreiben. Verwaiste Objekte und Storage-Kosten
nachweisen; Restore erzeugt eine neue Revision statt Aktuelles zu löschen.

Retention, Tombstones, Verschlüsselungs- und Privacypolitik sind H-Gates;
nicht erraten. Schreibe ADR, Threat Model, Testfälle (User A gegen B, 2 Geräte,
Offline/Conflict, Erst-Login mit lokalem Board), Migrations- und Rollbackplan.
Bei Wunsch zu SQL-Migration/Deployment: STOP, eigene explizite Freigabe einholen.
```

**Abnahme R05:** Schema/Policies nicht nur aus Clientcode erschlossen; Staging-Testplan mit echten Eigentumsgrenzen; Zero-Data-Loss-Invarianten; keine unautorisierten Backend-Änderungen.

### R06 — App Shell & Design-System Vertical Slice (REACT + TYPESCRIPT TARGET)

**Modellvorschlag:** Opus High für Architektur, Sonnet High für Visual Slice, separater Design-Audit. **Branch:** `feature/copyboard-shell-r06`.

```text
COPYBOARD — R06 DESIGN-SYSTEM & APP-SHELL VERTICAL SLICE
H-07 ist beschlossen: nutze React + TypeScript; Vite bevorzugt nach PoC. Verwende die D-001..D-033,
IA-02, Interaction-03, DS-04 als verbindliches UX-Soll. Implementiere einen
abschaltbaren, isolierten Slice (kein automatischer Default für bestehende User):
Spaces-First-Sidebar, dynamische Overlay-Hoverexpansion, Ambient-/Collapsing-
Header, Smart Capture Bar, Smart Grid/List und Adaptive Density, Light/Dark/
System, Space-Ambient, Empty-State sowie statuskorrekte lokale Fehlersignale.

Bestands-State lesbar halten, keine parallele Storage Source of Truth; Adapter
mocken oder bestätigte Schnittstellen verwenden. Capture-Handoff bei
fehlgeschlagenem Save niemals feiern. Keyboard, Focus, 200%-Zoom,
Reduced Motion, mobile Grundlayout, Default/Loading/Error/Empty testen.

Liefere Visual Before/After, Component Inventory, tokens used vs. proposed,
Screenshot-Diff und konkrete Restabweichungen zu D-001..033.
STOP wenn ein alter Feature-Einstieg entfällt oder der Datenpfad verändert wird.
```

**Abnahme R06:** Parity nicht verschlechtert; Components/States gemäß DS-04; keine neuen Legacy-Datenformate ohne ADR; H-01/H-03/H-04 vor betroffenen Flows geklärt.

### R07 — Hybrid Composer, Recorder, Context Rail & Handoff

**Modellvorschlag:** Claude Opus High für Session-Datenmodell, Sonnet High für UI. **Branch:** `feature/copyboard-composer-recorder-r07`.

```text
COPYBOARD — R07 COMPOSER & SESSION EXPERIENCE
Implementiere nach Freigabe D-007..D-011 und die M-/SM-Kontrakte aus Blueprint 03.
Markdown source, visual preview, split, gezielte Asset-Anhänge, Context Rail,
Floating Recorder und chronologische Session-Timeline. Nach STOP: originale
Audio- und Dateiinhalte erfolgreich sichern, DANN Hybrid Composer öffnen.
Optional AI/Agent-Output nur als ausdrücklich optionale Aktion.

Audio permission denied, unsupported MIME, Pause/Resume, Tabwechsel, Lock,
Browserunterbrechungen, Offline und max storage testen; Safari/iOS nur nach
realem Gerätetest als supported bezeichnen. Keine dauerhafte Hintergrund-
Aufnahme versprechen. Handoff: Clipboard/.md/ZIP + Manifest und explizite
Attachment-Auswahl, keine stille Agenten-Uploadfunktion.

Hard Gate: Kein Originalasset durch Composer-/Session-Abbruch verlieren;
kein Draft-Overwrite durch Cloud-Apply. Tests + Video/Screenreader-QA.
```

**Abnahme R07:** Session-Artefakte unverändert erhalten; Dokumentreferenzen korrekt; tatsächliche ZIP-Manifest-Parität; iOS-Failure ehrlich benannt.

### R08 — Adaptive Trust, Recovery & Mobile Dock

**Modellvorschlag:** Opus High für Sync/Recovery, Sonnet High für Mobile UI; zweiter Reviewer. **Branch:** `feature/copyboard-trust-mobile-r08`.

```text
COPYBOARD — R08 TRUST / RECOVERY / MOBILE INTEGRATION
Verknüpfe bestätigte Storage-/Sync-Adapter mit D-028/D-029/D-030:
Local Saved, Cloud Pending, Cloud Confirmed, Offline, Conflict, Error dürfen
nur echte Backend-ACKs widerspiegeln. Recovery: unmittelbares Undo, Trash,
Version-Restore als NEUE Revision, einschließlich Anhängen und Querverweisen.
Niemals aktuelles Dokument nach Restore unsichtbar verwerfen.

Mobile Dock mit konstant erreichbarer Space-/Suche-/Capture-Navigation,
kontextabhängige Auswahl-/Recorder-Aktionen, Safe Areas, virtueller Tastatur,
VoiceOver und Reduced Motion. Keine hover-only Aktionen. Preference-
Schnellzugriffe und Settings Studio referenzieren dieselben Setting-Werte.

Human Gates H-01..H-08 müssen für berührte Features geschlossen sein;
keine erfundene Trash-Retention. Mindestens Staging- und echte iPhone-
Browser-Tests. Backend-Policies und Produktion weiterhin getrennt genehmigen.
```

**Abnahme R08:** Cross-Device Offline/Conflict geprüft, kein falsches „Synced“, Restore-/Attachment-Referenzen intakt, iPhone-Recorder-Grenzen dokumentiert.

### R09 — Integration QA, Staging & Production Release Gates

**Modellvorschlag:** Opus High QA/Review, separates GPT-6 High Audit, Human-Release-Owner. **Branch-Kandidat:** `release/copyboard-refresh-r09`.

```text
COPYBOARD — R09 RELEASE CANDIDATE & GO/NO-GO
Lass zuerst alle Feature-Parity-, Data-Safety-, Auth-/RLS-, Browser-/Touch-,
Accessibility-, Regression- und visuellen Acceptance-Gates laufen. Überprüfe
jede D-001..D-033-Entscheidung am gerenderten Ergebnis und markiere Ausnahmen.
Führe vor Produktionsänderung einen dokumentierten Restore-/Migrations-/
Rollback-Dry-Run mit isolierten Staging-Fake-Daten durch. Cross-device mit
mindestens zwei Testkonten plus unsynchronisierten lokalen Änderungen prüfen.

Erstelle Release Notes, Datenmigration/Feature-Flag-/Fallback/Telemetry-
Strategie, Support-Plan und expliziten Go/No-Go-Bericht; keine ungeprüfte
Aussage, dass Legacy-Backups oder PIN-Ciphertexte sicher überleben.

STOP vor jeder echten Production-DB-, Cloud-, DNS- oder App-Deployment-Aktion.
Eine separate Human-Release-Freigabe ist zwingend.
```

**Abnahme R09:** Nachweisbare PASS-Berichte und echte Abnahme statt „alle Tests geplant“, Produktion separat bestätigt, Rollback inklusive Datenformate geprobt.

## 6. Test- und Evidenzplan: Gates statt bloßer Testanzahl

### 6.1 Testquellen (nicht additiv)

- Historisch: **58 Baseline-Szenarien**, **22 voll bestanden**, **27 Defekte**; verifizierte Quelle ist der Audit-Bericht, kein neuer Run.
- Konzept: **18 Decision-Integrity-Szenarien**, **20 IA-QA**, **36 Interaction/Motion-QA**, **32 Design-QA**, **36 Technical-QA**. **Diese Kataloge überlappen sich**; keine „Gesamttestquote“ aus Summen ableiten.
- **Neue Ausführung zählt nur mit Run-ID, Umgebung, Commit-SHA, Browser, Fixture, erwarteten/observierten Ergebnissen, PASS/FAIL/SKIP-Grund und Artefaktbeweis.**

### 6.2 Harte Minimal-Abnahmen

| Bereich | Muss vor Freigabe belegt sein | Scheitert wenn ... |
|---|---|---|
| **Local Data** | Quota-/Corrupt-/Future-schema-/Reload-/Failure-Tests | Original-JSON überschrieben, Save-ACK erfunden |
| **Security** | 3 Stored-XSS-Klassen und Secret-Paste negativ; untrusted Imports sicher | Ausführung aus Nutzerdaten, PIN im Board persistiert |
| **Legacy** | State/Backups/Spaces/Settings/ältere Imports, AES-GCM-PIN roundtrip | verlusthafte Migration oder PIN-Bruch |
| **Supabase** | RLS/Storage/RPC Owner Isolation + revision races an Staging | Cross-account Zugriff oder Overwrite |
| **Sync/Recovery** | 2 Geräte, dirty editor, offline, conflict, restore als neue Revision | stiller Verlust, falscher Status, gelöschte Assets |
| **UI/A11y** | Fokus, Esc, Screenreader, Touch, 200% Zoom, Reduced Motion | unzugängliche Aktionen, Ghost Click |
| **Mobile/Recorder** | echte iPhone/Safari und unterstützter Browser-Codec | Versprechen einer nicht möglichen Hintergrundaufnahme |
| **Release** | Backup, Staging-Migration, Daten-Rollback-Plan, Benutzerkommunikation | Code-Rollback allein soll Daten rückgängig machen |

### 6.3 Definition of Done je Run

1. Scope und erlaubte Pfade vorab benannt, User-Freigabe vorhanden; Baseline sauber.
2. Reproduzierbare Tests passend zur Run-Gefahr; relevante Legacy-Parity beweisbar.
3. Error-, Offline-, Permission-, Crash- und Rollback-Pfade für die angefasste Funktion.
4. Diff verständlich und kleiner als ein kompletter Architektur-/UI-Rewrite (Ausnahme ausdrücklich autorisierter Spike/ADR).
5. Keine unbekannten produktiven Secrets/realen Nutzerdateien in CI, Logs oder Anhängen.
6. Unabhängiger Review für Datensicherheit/Auth/Security/Sync, dokumentierte Human-Gates.
7. Abschlussbericht mit `PASS/FAIL/SKIP`, SHAs, Risiken und `CUTLER`-Freeze vor dem nächsten Run.

## 7. Rollback- und Datenintegritätskonzept

**Rollback ist kein einzelner `git revert`.** Ein Code-Rollback stellt weder Cloudrevisionen noch verschobene Blobs oder ein migriertes Browser-Schema wieder her.

| Änderungstyp | Rollback-Vertrag |
|---|---|
| **R01/R02 Guards** | Codepfad auf sicheren Vorgänger; Originaldaten werden nie verändert, Quarantäne bleibt exportierbar |
| **R03 CI** | Tests/Workflow isoliert deaktivieren; Code- und Datenpfade unverändert |
| **R04 Migration PoC** | Nur Fixture-Store; dual-read, no-delete, idempotent; Abbruch ohne Verlust der v1-Quelle |
| **R05 Supabase** | Vorab DB-/Storage-Backup, separate Migration/RLS-Rollback und Retention; kein Schema-Drop als „Rollback“ |
| **R06–R08 UI** | Feature Flag / reversible Routing-Entscheidung; der Datenpfad bleibt bei deaktivierter UI vollständig funktionsfähig |
| **R09 Production** | Snapshot-/Rollback-Rehearsal in Staging, Releasefenster, Fallback-Owner, klare Anzeige für betroffene Nutzer |

**Vor jeder produktiven Migration:** Backup existiert und ist **erfolgreich zurückgespielt** in Testumgebung, Read-Only-Fallback belegt, tatsächlicher Schreib-/Backend-Gate geklärt. Kann eine Datenkonvertierung nicht verlustfrei rückgängig gemacht werden, ist das ein **Blocker**, der Nutzereinwilligung und Migrationsdesign erfordert.

## 8. Human-Review-Paket und Stop-Kriterien

### Stop/No-Go sofort, falls:

- Load-Failure mit leerem Board überschrieben werden könnte oder ein Save-/Sync-Erfolg nicht beweisbar ist.
- Ein XSS-Payload, Secret Paste, PIN-Leak, fremder Accountzugriff oder ungesicherter Import möglich ist.
- Backups/PIN nicht lesbar, verwaiste Folder-/Asset-Referenzen, Undo-/Cloud-Overwrite beobachtet werden.
- Backend-RLS/RPC/Storage unzugänglich ist, der Run aber sichere Cloudbehauptungen machen müsste.
- Agents ungefragt Stack, Datenformat, Ordner-Primärklick, Retention oder Burn-Link-Produktversprechen entscheiden.
- Ein UI-Polish eine schwere Regession bei Copy/Paste/OCR/Export/Offline erzeugt.
- Ein realer Production-Zugriff, Live-Deploy oder Merge ohne separate Freigabe nötig wäre.

### Standard-CUTLER-Antwort des Agenten

```text
CUTLER — CopyBoard Run Rxx
Scope / Branch / HEAD: ... (real, verifiziert)
Resultat: PASS / PARTIAL / BLOCKED / FAIL
Dateien / relevante Architekturänderungen: ...
Automatisierte Tests: PASS n; FAIL n; SKIP n (jeweils Gründe und Kommandos)
Manuelle Browser-/Gerätetests: ... (tatsächlich ausgeführt oder NICHT GETESTET)
Daten / Security / Legacy-PIN / Backup: ...
Offene Human-Gates: H-...
Offene Risiken / bekannte Lücken: ...
Rollback-/Recovery-Bereitschaft: ...
Empfehlung: REVIEW / STOP / MERGE REQUEST / FOLGE-RUN NUR NACH FREIGABE
Keine automatisch ausgelöste Folgemaßnahme.
```

## 9. Architektur-Freeze und Produkt-Freeze

Der für einen späteren Agenten verbindliche **Produkt-Freeze** ist D-001..D-033 **plus der später ausdrücklich beschlossene React-/TypeScript-Zielstack gemäß H-07/ADR-007**. Nicht final freigegeben sind Tokenpixelwerte, konkrete React-Libraries, Retention, Burn-Link-Semantik, Folder-Primäraktion, der finale Editor-Shortcut-Kontrakt und die Account-Merge-UX. Diese bleiben als **offene H-/Implementierungs-Gates** bestehen und dürfen niemals durch einen Agenten untergeschoben werden. H-07 ist hingegen geschlossen.

Technische Architekturgrundsätze für jede der möglichen Implementierungsstrategien: `StorageAdapter` für lokale, tatsächliche Writes; `AssetStore` für Blob-Lifecycle; `BackupCodec` für alle Altformate; `MutationService` für einzelne atomare User-Aktionen; `SyncAdapter` für bestätigte Revisions-ACKs; `RecoveryService` für Undo/Trash/Versionen; `CaptureInputRouter` für Fokus-/Privacy-Gates; `FeatureCapabilities` für Browser-/PWA-Unterschiede. **Das sind vorgeschlagene Schnittstellen**, keine bereits existierenden Code-Module.

### 9.1 Entscheidung zur Frontend-Technologie – Prüfverfahren, nicht Vorfestlegung

**Historisch betrachtete, jetzt verworfene Zielalternative:** native ESM konsequent modularisieren; bestehendes Deployment wäre vereinfacht, allerdings ohne den vom Nutzer festgelegten React-/TypeScript-Zielstack.  
**Gewählter Zielstack:** React + TypeScript, Vite bevorzugt; mit strikter Adaptergrenze, bestehende Persistenz/PIN/Backup im ersten Slice nur lesen; höherer initialer Umbau- und Migrationsaufwand.

**Bewertungsmaßstab für den React-/TypeScript-PoC (nicht für erneute Stackwahl):** Testbarkeit, Import-/PIN-Kompatibilität, Vite-Build/Hosting, Motion/Performance, Code-Lebenszyklus und Rollback. **H-07 ist entschieden; PoC entscheidet nur Ausführungsdetails.**

## 10. Implementation Readiness Verdict

| Teilbereich | Stand nach Phase 06 | Handlung |
|---|---|---|
| **Design & IA** | **READY FOR SPECIFIED UI VERTICAL SLICE**, nicht implementiert | D-001..D-033 und Blueprint 02–04 als Pflichtenheft |
| **Data Integrity** | **NO-GO für Full Redesign** | R01 zuerst freigeben und testen |
| **Security & Privacy** | **NO-GO** | R02 einschließlich Input-/Import-Gates |
| **Automated Quality** | **NO-GO** | R03 etablieren und nachweisen |
| **Storage Migration** | **UNDECIDED** | R04 PoC mit Fixture/Rollback, kein Live-Schreibpfad |
| **Supabase / Revision / Recovery** | **UNVERIFIED/NO-GO** | R05 Backend-Read-Audit + separate DB-Freigabe |
| **iOS / Safari / PWA** | **UNVERIFIED** | R07/R08 echte Hardwaretests vor Zusicherung |
| **Production Release** | **NOT AUTHORIZED** | R09 plus separate explizite Human-Release-Freigabe |

**Abschließende Empfehlung:** Der sinnvollste **erste spätere schreibende Auftrag** ist R01 in enger Abgrenzung; vorher darf ein R00-Preflight die Repo- und Backup-Grenzen rein lesend aktualisieren. Kein monolithischer „Opus baut CopyBoard neu“-Prompt, solange die G-01..G-06 blockieren. Ein kompletter UI-Run wäre derzeit ein vermeidbares Datenrisiko.

---

**Phase-06-Grenze:** Für dieses Dokument wurden **keine** Repo-/DB-/Hosting-/Live-Operationen durchgeführt. Die Prompts sind **nur vorbereitet** und nicht gestartet. Jeder Freigabe- und Teststatus ist deshalb Planung statt Umsetzung.


## 10. Revision 1.1 — Umsetzung des React-/TypeScript-Beschlusses

- **Bindender Stack:** React + TypeScript. **Vite bevorzugt** und im technischen Build-/Hosting-/Test-PoC nachzuweisen. Kein Agent darf ohne neuen Nutzerentscheid auf Vue, Angular, Next.js oder ein Vanilla-JS-Zielprodukt umstellen.
- **R00 zuerst, weiterhin READ-ONLY:** [vollständiger R00-Prompt](CopyBoard-R00-ReadOnly-Preflight-Prompt-2026-10-21.md). Ausgabe nur im Agenten-Chat; kein Branch, kein Repo-Schreibzugriff, keine produktiven Daten.
- **R01/R02 in Legacy ESM:** zwingende eng gefasste Sicherheitsmaßnahmen für die bis zur Ablösung existierende App. Sie sind keine Abkehr vom React-Ziel.
- **R03:** Legacy-Regression als Migrations-Orakel, CI/Tests.
- **R04:** Typisierte Legacy-State-/Backup-/PIN-Adapter, Blob-Storage-Prototyp, idempotente Migration; keine Echtmigration.
- **R05:** Backend-/RLS-/Recovery-Vertrag von React entkoppelt.
- **R06:** React/TypeScript-App-Shell mit DS-04, zuerst Mock-/Fixture-Daten, getrennter Build, reversible Umschaltung, noch kein Live-Sync-/Storage-Rewrite.
- **R07–R09:** erst nach erfüllten Gates/Feature-Parity und eigenen Schreib-/Release-Freigaben.
- **Human Gates:** H-07 ist **geschlossen**; H-01 bis H-06 und H-08 bleiben offen. Ohne entsprechenden Beschluss keine implizite Festlegung der Folder-Primäraktion, Retention, Account-Isolierung, Burn-Link-Semantik etc.
- **Nicht beschlossen:** konkrete React-Router-/State-/Styling-/Testing-Bibliotheken, Quota-Architektur, Supabase-Backendänderung, Datenumwandlung oder Production-Promotion.
- **Änderungsumfang dieser Revision:** ausschließlich Planungstexte. Die Originaldatei `Runbook 06` bleibt historisch erhalten. Kein Repository wurde verändert.



## 11. Revision 1.2 — CUTLER R00 eingegangen / R01-Sicherheitsrevision

**Quelle:** Nutzerbericht `CopyBoard R00 — Safety & React Migration Preflight (CUTLER R00).md`. **Fachliches Review:** [CopyBoard-R00-Review-and-R01-Triage-2026-10-21.md](CopyBoard-R00-Review-and-R01-Triage-2026-10-21.md). **R01 Agentenprompt:** [CopyBoard-R01-Data-Loss-Guards-Prompt-2026-10-21.md](CopyBoard-R01-Data-Loss-Guards-Prompt-2026-10-21.md). **Master:** v0.41.

**R00 = DONE (read-only), nicht R01 = DONE.** 36 Prüfungen: 11 PASS, 24 FAIL, 1 Beobachtung; 8 UNVERIFIED-Bereiche. P0-N3/N3b: Cloud-Snapshot kann nach fehlgeschlagener Persistierung im synthetischen Mock zu leerem Publish führen; reale Supabase-Policies und Backendlöschung bleiben UNVERIFIED. P0-I-35 (Startüberschreibung) bestätigt. P1-I-36/N4/N8; R02-Gates N1/N2/N5a/N5b (Paste/PIN). Kein Audit-Ergebnis wird als produktiver Fix interpretiert.

**Verbindliche Präzisierungen für den nächsten Run:**

- `R01` wird auf separatem Feature-Branch von `origin/develop` nur nach ausdrücklicher externer GO-Aktion umgesetzt; kein Merge/Deploy.
- Audit-Branch vorab nach `develop` mergen ist **keine notwendige Bedingung**; minimaler QA-Harness darf auf R01-Branch selektiv übernommen werden.
- `persistBlockedReason=quota` darf keine zugesagte Datenlöschung/Platzfreigabe logisch blockieren. Entweder sicherer Recovery-Commit nach bestätigtem Save oder expliziter STOP/Export.
- `storage`-Event löst N8 nur bei beobachtbaren, sequenziellen Fremdänderungen; kein atomarer Lock. Rest-Gate für simultane Schreiber bleibt offen.
- Cloud-Apply, lokale Persistenz, Cloud-Revisions-Meta und Cloud-Upload müssen eine überprüfbare Save-ACK-Reihenfolge erhalten; andernfalls fail-closed.
- `R01` kein React, kein Vite, kein TS, kein Security/PIN-Scope-Creep. Danach R02, R03; neu aufgelöst R04a Toolchain, R04b TypeScript-Codec, R05 Single-Writer/Store und R06 React-Shell.
- Vor R06 müssen D-001..D-033 plus Design-/Motion-/Component-Blueprints dem Agenten vorliegen.

**Archivprinzip:** Frühere Runbook-Abschnitte bleiben lesbar; diese Revision ist bei abweichendem R01-Gate-/Runsequenz-Wortlaut **vorrangig**. Es gab durch dieses Dokument keinerlei Repo-, Datenbank- oder Deploy-Aktion.
