# CopyBoard — Technical Baseline Audit (Run 01)

| | |
|---|---|
| Scope | Technical architecture, interaction and runtime audit of the existing app |
| Base | `develop` @ `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3`. `main` and `feature/notes-editor` point to the same commit. |
| Branch | `audit/copyboard-technical-baseline-run-01` |
| Date | 2026‑10‑21 |
| Changes made | **Documentation and test evidence only.** No application code, dependencies, database, deployment or production data were touched. |

## Contents

| File | Purpose |
|---|---|
| [01-ARCHITECTURE.md](01-ARCHITECTURE.md) | Branches, runtime composition, real layout of `app.js`, coupling, state model, data lifecycle |
| [02-FEATURE-INVENTORY.md](02-FEATURE-INVENTORY.md) | Every feature: purpose, entry points, implementation, dependencies, problems, verification, preservation requirement |
| [03-INTERACTION-MATRIX.md](03-INTERACTION-MATRIX.md) | 58 browser scenarios: expected vs. observed, status, severity |
| [04-DATA-SECURITY-AND-SYNC.md](04-DATA-SECURITY-AND-SYNC.md) | Storage limits, Supabase client contract vs. backend assumptions, sync, PIN, burn link, injection, supply chain |
| [05-TECHNICAL-DEBT-AND-RISKS.md](05-TECHNICAL-DEBT-AND-RISKS.md) | Major problems written up as evidence → cause → impact → severity → options → trade-offs |
| [06-REFRESH-READINESS.md](06-REFRESH-READINESS.md) | What a redesign must preserve or keep readable, constraints, open decisions. It does not design anything. |
| [SCREENSHOTS.md](SCREENSHOTS.md) | Index of 47 real screenshots (desktop, mobile, tablet) |
| `evidence/` | Reproducible QA harness and raw results: `qa-lib.mjs`, `qa-screens.mjs`, `qa-interactions.mjs`, `qa-results.json`, `screenshot-index.json`, `build-matrix.py` |

---

## Executive summary

### Current technical health

CopyBoard works and is feature-rich. In this run, 22 of 58 browser scenarios pass outright, including:
- paste and file capture;
- duplicate detection;
- previews;
- drag reorder and move-to-space;
- spaces;
- most undo/redo types;
- backup round trip with recovery;
- modal stacking;
- voice memo;
- local-first degradation without network.

Its engineering foundation is fragile:
- one 5,099-line closure (~300 functions, 55 mutable globals, 203 listeners) with implicit "mutate → render → persist" contracts;
- no tests, no linter, no CI;
- three unpinned or unhashed CDN dependencies;
- a Supabase backend whose security policies are not in the repository.

The run found **27 confirmed defects**: 1 Critical, 10 High, 15 Medium, 1 Low.

### Major interaction defects

| | Defect | Evidence |
|---|---|---|
| 1 | **The context menu inside an open folder sits beneath the folder overlay.** Every per-child action (rename, details, move, share, OCR, PIN, remove from folder) is unusable. | I‑46, screenshot desktop‑35 |
| 2 | **Touch: tapping a card can open and immediately close its preview or folder** (3 of 8 taps). A ghost click hits the new backdrop. | I‑M01 |
| 3 | **Inline text editing.** Clicking inside the editor opens the preview. Escape inside a folder closes the folder, and the "discarded" text is saved on the next click. | I‑11 |
| 4 | **Paste capture fires while typing** in the search, sticky-note, e-mail, PIN and inline-editor fields, creating cards from whatever was pasted. That includes passwords. | I‑02 |
| 5 | **Undo gaps.** Settings reset is not undoable. A multi-card move needs N undos. Undo after import writes orphan data. | I‑14, I‑16, I‑17 |
| 6 | **Hover- and right-click-only controls.** No multi-select or context actions on touch. Cards are not keyboard-focusable. | I‑M03, I‑M04, I‑30 |
| 7 | **Other defects.** Settings export throws (`downloadBlob` was never defined). ZIP export crashes on locked images. Nested folders orphan their content. Multi-file duplicate prompts drop files. | I‑38, I‑25, I‑22, I‑06 |

### Highest architectural risks

| | Risk | Evidence |
|---|---|---|
| 1 | **Data loss in the persistence layer.** At start-up, unreadable or newer-schema data is replaced by an empty board (**Critical**). The real localStorage capacity (~5.24 M chars) is far below the 20 MiB budget: about 3 photos fill it, and later items are lost on reload. | I‑35, I‑36 |
| 2 | **Stored XSS.** Script runs from a space name, an imported space color, and an imported `javascript:` file payload. That gives full access to the board and the Supabase session. There is no CSP or SRI. | I‑31, I‑32, I‑33b |
| 3 | **Whole-board snapshot sync with no merge.** Passive views create revisions. Losing devices can only discard local work. A remote apply silently discards an open edit while the app reports "Gespeichert". | I‑C02, I‑C03, I‑C05 |
| 4 | **Two competing event-arbitration layers.** The modal stack and local handlers fight over input, which is the root cause of defects 1–3 above. | — |
| 5 | **No safety net** (tests or CI) for any refactor or redesign. | — |

### Existing functionality worth preserving

The full list is in [06](06-REFRESH-READINESS.md) §2–3. In short:
- local-first operation without an account;
- instant paste and drop capture;
- cross-space exact-duplicate detection;
- spaces with color, order and per-space sort, with pinned items first;
- one-level folders;
- move/copy between spaces, including drag-to-tab;
- multi-select bulk actions;
- full-text search across spaces, folders and text content;
- favorites and recent items;
- inline and dialog editing, image rotate/flip, file replace;
- voice memos, OCR and palette extraction;
- PIN encryption (AES‑GCM; its ciphertext format must stay decryptable);
- undo/redo;
- temporary mode;
- storage manager;
- three import formats with a pre-import recovery point;
- revision-checked cloud publish;
- the single `normalizeState()` migration boundary.

### Readiness for a larger refresh

**Conditionally ready.** The functional contract is documented well enough to start the human-led design phase. Before *implementation* of a larger refresh, three things should land as small, independent stabilization steps:
1. data-loss guards (I‑35, I‑36);
2. XSS and import-validation fixes;
3. a regression test project derived from the Run 01 harness.

A framework migration or full rewrite is **not** required by the evidence: the defects stem from missing contracts and layering rules, not from the absence of a framework. Whether to migrate remains an open decision with the trade-offs listed in [05](05-TECHNICAL-DEBT-AND-RISKS.md) R2.

### Unverified areas

- Real Supabase: RLS, Storage policies, the RPC implementation, Auth settings, realtime delivery. These were not inspectable, and **nothing was sent to production**.
- iOS and Android hardware: long-press, touch scrolling with `touch-action:none`, native share, clipboard image write, MediaRecorder MIME types.
- Firefox and Safari.
- Real Tesseract OCR (stubbed in this run).
- Drag-out to the desktop.
- Performance near the quota and on low-end devices.
- Production hosting configuration.
- One intermittent behavior that was not confirmed as a defect: drop-on-card did not create a folder in 2 of 6 automated runs (I‑19).

### Git status and artifact locations

- Branch `audit/copyboard-technical-baseline-run-01`, created from `develop` @ `ac721fe`, contains a single documentation commit that adds `docs/audits/copyboard-technical-baseline/`.
- No other paths were modified.
- No merge, no pull request, no deployment.
- The artifacts are all in this folder: six reports, `SCREENSHOTS.md`, `screenshots/` (47 PNG files) and `evidence/`.

---

### Reproducing the evidence

```bash
# from the repository root
python3 -m http.server 8765 --bind 127.0.0.1 &
export PLAYWRIGHT_PATH=/path/to/node_modules/playwright     # Playwright ≥ 1.56 with Chromium
export JSZIP_PATH=/path/to/node_modules/jszip/dist/jszip.min.js   # npm i jszip@3.10.1
node docs/audits/copyboard-technical-baseline/evidence/qa-screens.mjs
node docs/audits/copyboard-technical-baseline/evidence/qa-interactions.mjs          # all
node docs/audits/copyboard-technical-baseline/evidence/qa-interactions.mjs 'I-C0'   # subset by regex
(cd docs/audits/copyboard-technical-baseline && python3 evidence/build-matrix.py)
```

The harness intercepts **all** external hosts. Supabase is replaced by an in-memory mock (`createCloudBackend`) or blocked, so running it never touches the production project.
