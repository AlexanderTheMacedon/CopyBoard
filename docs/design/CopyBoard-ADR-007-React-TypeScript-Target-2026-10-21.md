# CopyBoard — ADR-007: React + TypeScript als verbindlicher Zielstack

**Datum:** 21. Oktober 2026  
**Status:** ACCEPTED (Nutzerentscheidung) / NOT IMPLEMENTED  
**Bezugsbasis:** CopyBoard Masterplan v0.40, Runbook 06 Revision 1.1, technischer Audit `audit/copyboard-technical-baseline-run-01`.

## Kontext
Die alte CopyBoard-Anwendung basiert auf statischem HTML, CSS und nativen JS-Modulen. Der Nutzer hat nach abgeschlossener Designkonsolidierung ausdrücklich entschieden, dass die **künftige CopyBoard-Anwendung in React und TypeScript aufgebaut wird**. Die Architekturfrage H-07 war bisher offen.

## Entscheidung
1. **React + TypeScript ist bindend.** Keine erneute Framework-Abstimmung in R00 oder R06.
2. **Vite ist das bevorzugte Build-Tool**; technische Prüfung von Build, Hosting, Testlauf und Deployment-Artefakten steht noch aus. Die Wahl von Router, State-, Form-, CSS- und Testing-Libraries ist **nicht** Teil dieser Entscheidung.
3. **Eine gemeinsame React-Oberfläche** für Desktop, Tablet und Mobile, mit responsive/adaptiven Zuständen gemäß D-001..D-033. Legacy bleibt vorübergehender Sicherheits-, Migrations- und Rollbackpfad, **kein dauerhaftes paralleles Produkt**.
4. Neue UI-Komponenten sprechen mit getrennten typisierten Domain-/Persistence-/Sync-Adaptern. UI-Schichten dürfen keine direkt von UI-Zuständen abgeleiteten falschen Save-/Cloud-ACKs melden.
5. **Keine Big-Bang-Migration**, kein erzwungener lokaler oder Cloud-Datenwechsel bei Design-Implementierung. Alte Formate müssen lesbar, vollständig und reversibel migrierbar bleiben.

## Auswirkungen auf die Run-Sequenz
| Run | Rolle nach dieser ADR |
|---|---|
| R00 | Read-only GitHub-/Audit-Prüfung; React-/TypeScript-Zielarchitektur; kein Branch |
| R01 | Datenverlust-Schutz im vorhandenen ESM-Code; isolierter Fix erst nach separater Freigabe |
| R02 | XSS/Import/Paste im vorhandenen ESM-Code; isolierter Fix |
| R03 | Migrations- und Regressionstestnetz |
| R04 | Typisierter Legacy-Reader, IndexedDB-/Blob-Speicher-Migrationsprototyp |
| R05 | Cloud-/Recovery-Verträge, Backend-/RLS-Review und konfliktfreie Strategien |
| R06 | React-/TypeScript-/vorzugsweise Vite-App-Shell, Komponenten und Designsystem, zunächst Fixtures/Adapter |
| R07–R08 | Feature-Aufbau und Integration nach Gates, inkl. Composer, Recorder, Sync Center, Recovery, Mobile |
| R09 | Separater Staging- und Produktionsfreigabeprozess |

## Schutz- und Kompatibilitätsverträge
- Bestehende Daten `copyboard_state_v1`, historische Backups, Space-/Item-IDs, Sortierung, Settings und originale Attachments nicht still löschen oder überschreiben.
- AES-GCM/PBKDF2-basiertes vorhandenes PIN-Ciphertextformat entschlüsselbar halten.
- P0: lokale Quota-/Schema-Datenverluste, gespeicherte XSS, Paste-Privacy; danach erst kontrollierter Umbau.
- Cloud-Berechtigungen, RPC/Storage und echte Sync-Revisions-ACKs sind **UNVERIFIED**, bis Backend-/Integrationstests mit ausdrücklicher Freigabe stattfinden.
- Realgerät-/Safari-/PWA-/MediaRecorder-Grenzen bleiben ausdrücklich offen; keine Versprechen ohne Tests.

## Status der Entscheidungsgrenzen
**H-07: CLOSED** durch ausdrückliche Nutzerentscheidung. H-01–H-06/H-08 und technische Gates G-01–G-06/T-01–T-05 bleiben offen. Nicht beschlossen sind Vite-Versionsnummern, andere Libraries, Daten- und Backend-Migration, schreibende Agentenaufträge oder Release.

## Konsequenzen und Alternativen
Eine React-/TypeScript-Migration erhöht anfänglich die Tooling-/Build-/Migrationskosten; sie ermöglicht aber eine klarere typisierte Komponenten-/State-Struktur für die komplexe UI. Vanilla-ESM als *langfristiger Zielstack* steht nicht mehr zur Entscheidung. Legacy-ESM bleibt **vorübergehend notwendiger Bestands-Code**, bis der neue Stack getestet und freigegeben ist.

**Änderungsart:** Reines Architektur-/Planungsdokument. Keine Dateien im GitHub-Repository verändert, kein Code, keine Datenbank, kein Deployment.
