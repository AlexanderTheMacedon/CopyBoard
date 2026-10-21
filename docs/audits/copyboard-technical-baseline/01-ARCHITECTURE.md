# 01 — Architecture

CopyBoard Technical Baseline Audit, Run 01. This run only documents the code. It changes no application code.

| | |
|---|---|
| Audited commit | `ac721fe444a3e0f0a0fb97bc192d495dc252d6a3` ("fix: refine autosave status UI", 2026‑09‑07) |
| Audit branch | `audit/copyboard-technical-baseline-run-01`, created from `develop` |
| Method | Full read of `src/js/app.js` (5,099 lines), `index.html`, `src/styles/app.css` and the helper modules, plus browser runs in isolated Playwright/Chromium contexts (see [03-INTERACTION-MATRIX.md](03-INTERACTION-MATRIX.md)) |

Line references such as `app.js:484` point to the audited commit.

---

## 1. Repository and branch state

| Ref | SHA | Notes |
|---|---|---|
| `origin/main` | `ac721fe` | Same commit as `develop` |
| `origin/develop` | `ac721fe` | Audit base |
| `origin/feature/notes-editor` | `ac721fe` | **No commits of its own.** The branch name suggests a notes editor, but the branch has no unique work. |
| tag `pre-structure-refactor` | `7d5964b` | State before the ES‑module split ("V34.1.1") |

- `main`, `develop` and `develop`'s only feature branch all point to the same commit, so nothing is waiting to be merged or released.
- The history has 21 commits, all by one author. It is mostly linear, with one merge (`ff81809`, the modularization).
- The README describes the workflow: feature branch → `develop` → `main`.
- There is **no CI**: no `.github/`, workflows, tests, linter or formatter config. The only documented verification is `node --check` on each module plus manual browser testing. All five modules pass `node --check` on the audited commit.
- Deployment is probably GitHub Pages: a `CNAME` (`copyboard.astambke.de`) sits at the repo root. The hosting setup is **not verifiable** from the repository.

## 2. Runtime composition

```text
index.html (61 KB)       app shell, 20 modal overlays, help/settings content,
                         large HTML comments (version notes, icon manifest JSON)
src/styles/app.css (74 KB, 1,125 lines)   all styling, 9 @media blocks
src/js/app.js (261 KB, 5,099 lines)       everything else (one IIFE)
src/js/config/constants.js (64 lines)     limits, storage keys, Supabase URL + publishable key, settings registry
src/js/utils/format.js (31 lines)         extOf, extMeta, displayName, uid, fmtSize, fmtTime
src/js/utils/files.js (20 lines)          sanitizeFilename, exportFilename
src/js/ui/toast.js (21 lines)             showToast
```

- **No build step, package manager or framework.** The app is native ES modules served statically.
- **Third-party scripts come from CDNs as classic `<script>` tags with no Subresource Integrity:**
  - `jszip@3.10.1` from cdnjs. Pinned. The tag also has a stray inline comment body, which browsers ignore.
  - `tesseract.js@5` from jsDelivr. Floating major version.
  - `@supabase/supabase-js@2` from jsDelivr. Floating major version.
  - Google Fonts (Fraunces).
- The scripts load synchronously before `app.js`. If a CDN is blocked, the features that need it degrade with a toast ("ZIP-Funktion nicht verfügbar", "OCR nicht verfügbar"). The cloud button switches to `error` state. This was verified in the sandbox, where all CDNs were blocked; see I‑C01.
- There is no Content-Security-Policy. A static host cannot set one by header, but a `<meta http-equiv>` CSP would be possible.

## 3. Module structure of `app.js`

`app.js` imports four small helper modules. After that, **the whole application is one closure**: `(function(){ … })()` at `app.js:57–5099`. Nothing is exported and nothing can be tested from outside.

| Metric (audited commit) | Value |
|---|---|
| Named functions inside the closure | ~299 |
| Closure-level mutable variables (`let`) | 55 |
| `addEventListener` registrations | 203. Of these, 30 are on `document`/`window`: 4× `click`, 3× `keydown`, 3× `pointermove`/`pointerup`, `paste`, `drop`, `contextmenu`, … |
| `innerHTML` assignments | 64 |
| `persistState(` call sites | 56 |
| `mutationCheckpoint(` call sites | 46 |
| `getElementById` DOM references cached at start-up | ~180 (`app.js:755–937`) |

The header comment (`app.js:35–55`) promises 14 ordered sections. The file does not follow it. For example, the whole cloud-sync implementation sits between the DOM-reference block and the confirm dialog. The real layout is:

| Lines | Responsibility |
|---|---|
| 57–290 | Settings registry access (`getSetting`/`setSetting`), settings export/import/reset |
| 289–600 | State schema defaults, normalization (`normalizeState`), localStorage persistence (debounced + flush), legacy `window.storage` migration |
| 602–752 | Spaces model, sort modes, space CRUD, space export/duplicate/clear, space context menu |
| 754–937 | DOM references |
| 939–1460 | **Cloud sync**: Supabase client, auth UI, metadata, snapshot upload/download, revision publish RPC, realtime channel, online/offline/visibility hooks |
| 1462–1628 | Confirm dialogs, storage manager, AutoSave toggle, page-exit flush |
| 1630–1925 | Tabs rendering, space "atmosphere" colors, tab drag-reorder, overflow dropdown, view toggle |
| 1927–2180 | Context-menu engine, four icon registries, icon "decoration" by label inference |
| 2182–2453 | Favorites, recent items, sticky notes, item inspector |
| 2455–2860 | Item action-menu builder, duplicate, move/copy between spaces, ZIP, share sheet, rename, help-center settings bindings |
| 2860–3195 | Card DOM builder, delegated card events, thumb press/drag detection, inline text editing, grid render with signature cache |
| 3196–3330 | Multi-select and selection-bar actions |
| 3330–3505 | Duplicate detection (exact content signature) |
| 3506–3711 | Add/remove/clear, clipboard copy, download, preview, text modal, **ingestion** (file input, drag-in, paste), board background context menu |
| 3712–4065 | Card drag (reorder / merge-into-folder / move-to-space, multi-card stacks), folder overlay operations |
| 4066–4190 | Mutation policy, undo/redo snapshots |
| 4191–4350 | Import/export validation, backup, pre-import recovery, space import |
| 4350–4545 | Space color picker, command palette and full-text search |
| 4546–4562 | Global keyboard shortcuts |
| 4563–4677 | Pin, content editing (text, image canvas, file replace) |
| 4678–4775 | Voice memo, color-palette extraction, OCR |
| 4777–4882 | PIN prompt, AES-GCM card encryption, burn-after-reading link |
| 4884–5066 | Icon decoration observer, **central modal stack** (MutationObserver per overlay, Escape/backdrop arbitration) |
| 5068–5098 | `init()` |

### 3.1 Tightly coupled responsibilities (evidence)

1. **No boundary between state and DOM.** Mutation functions change `state`, then call `refreshItems()`, `render()`/`flipRenderGrid()`/`renderFolderGrid()`, `persistState()` and `showToast()` in hand-written sequences. Two examples: `removeFromFolder` (`app.js:4023`) and the selection-bar folder action (`app.js:3301`). Each call site picks its own subset. One result is that `imageEditSaveBtn` (`app.js:4641`) and the file-replace handler (`app.js:4657`) **never call `persistState()` themselves**. They are saved only because `markRecent()` calls `persistState()` as a side effect.
2. **Dual sources of truth.** The module variables `spaces`, `currentSpaceId`, `items` and `viewMode` mirror `state.spaces`, `state.activeSpaceId`, `state.data[…]` and `state.settings`. `syncFromState()` must be called after every wholesale replacement (import, recovery, cloud apply, undo). Several call sites assign `spaces = …` and `state.spaces = spaces` by hand (`app.js:691`, `1903`, `2572`, `4280`).
3. **Items are addressed through the current space.** Card handlers look up items with `dataOf(currentSpaceId)` (`app.js:2982`), and the undo checkpoint helpers default to the current space. This works only because cards are rendered for the active space alone. Cross-space features (favorites, recent, search, storage manager, duplicate audit) have to call `switchSpace()` first and then reach the target through `setTimeout(…, 60)` and `setTimeout(…, 80)` chains (`app.js:2271`, `2333`, `3371`, `4482`).
4. **Icon decoration by text inference.** A `MutationObserver` on `document.body` (`app.js:2096`, `4884`) plus a capture-phase `click` listener re-scan menus. They inject icons based on German label regexes (`inferMenuIcon`, `app.js:2049`). Renaming a label silently changes or removes its icon.
5. **Modal stack bolted on afterwards.** Twenty overlays open themselves with `classList.add('show')`. A separate layer (`app.js:4889–5065`) watches the class attribute through one MutationObserver per overlay and enforces the stack order. It handles Escape and backdrop clicks globally in the capture phase. This central arbitration conflicts with local handlers that also react to Escape and backdrop clicks; see defects I‑10, I‑11, I‑46 and I‑M01.
6. **Cloud sync wired into the persistence path.** `flushPersistedState()` calls `cloudMarkLocalPersisted()` (`app.js:530`). That means *every* persisted change is hashed and scheduled for upload, including passive activity (recent items, active space).
7. **German UI strings are inlined everywhere.** There is no i18n layer, and some behavior depends on these strings (icon inference, palette search keywords).

## 4. State model

There is one JSON document, `state`, persisted under `localStorage['copyboard_state_v1']` (`STATE_SCHEMA_VERSION = 1`):

```text
state
├─ schemaVersion: 1
├─ spaces: [{ id, name, sortMode, color? }]           // ordered tabs
├─ activeSpaceId
├─ settings: { schemaVersion:1, appearance{viewMode, spaceAtmosphere},
│              behavior{defaultSortMode, confirmDestructiveActions, startSpace},
│              history{recentLimit} }
├─ viewMode                                           // legacy mirror of settings.appearance.viewMode
├─ recentItems: [{ itemId, spaceId, folderId, action, usedAt }]   // ≤ recentLimit
├─ helpNotes: [{ id, text, createdAt }]               // "Sticky Notes" in the help center
└─ data: { [spaceId]: { itemIds:[top-level order], items:{ [id]: Item } } }

Item (text | image | file | folder)
  id, type, name, customName?, timestamp, favorite?, pinned?
  non-folder: mime, size, data (string: plain text or data: URL, base64)
  folder:     itemIds:[child ids]  (children also live in the same space's items map)
  locked:     locked:true, lockedType, encData{cipher, iv, salt}, data:null
```

Other localStorage keys:

| Key | Content |
|---|---|
| `copyboard_autosave_pref` | `'1'` or `'0'`. Device-scoped setting. |
| `copyboard_autosave_last_saved` | Timestamp |
| `copyboard_preimport_recovery_v1` | A **full second copy** of the board, written before an import or a manual cloud load |
| `copyboard_cloud_device_id_v1` | Random UUID |
| `copyboard_cloud_meta_v1:<userId>` | `{revision, contentHash, objectPath, savedAt}` |
| `sb-*` | Supabase session, managed by supabase-js |

Characteristics:

- **All binary content is stored inline as base64 data URLs.** This adds about 33 % overhead and makes the state one large string. Every save calls `JSON.stringify` on the whole board (`app.js:502`), and the cloud path does it again (`app.js:1263`). Undo snapshots deep-clone with `JSON.parse(JSON.stringify())` (`app.js:4192`).
- **Folders are one level deep by convention, not by schema.** `normalizeItem` and `isValidSpaceData` allow any item id in `itemIds`, including other folders. The UI can produce nested folders (I‑22). Deletion code only removes direct children.
- **`normalizeState` keeps unknown top-level keys and unknown `data` keys** (`...source`, `{...rawData}`). This helps forward compatibility, but orphaned space data survives indefinitely (I‑17).
- Item `name` is derived from the first 40 characters of text content and is **not** encrypted for PIN-locked items. See [04-DATA-SECURITY-AND-SYNC.md](04-DATA-SECURITY-AND-SYNC.md).

## 5. Data lifecycle (create → mutate → persist → restore → export → delete)

```text
create    paste (document 'paste') ─┐
          file input / drop ────────┼─▶ ingestFiles()/ingestText() ─▶ addItem()
          text modal / OCR / voice ─┘      │ duplicate check (all spaces, exact data)
                                           │ size check (estimateBytes(state) ≤ 20 MiB)
                                           ▼
mutate    mutationCheckpoint(kind) ─▶ change state ─▶ refreshItems()/render*() ─▶ persistState()
                │ snapshot into undoStack (≤20, memory only)
persist   persistState(): debounce 140 ms ─▶ flushPersistedState(): JSON.stringify(state)
                ─▶ localStorage.setItem ─▶ cloudMarkLocalPersisted(): SHA-256 ─▶ cloudSchedulePush() (900 ms)
          flush on pagehide / visibilitychange(hidden) / beforeunload
          AutoSave off: nothing written, beforeunload prompt
restore   init(): localStorage ─▶ normalizeState ─▶ (on failure: legacy window.storage ─▶ defaultState()) ─▶ immediate write
          cloud: metadata ─▶ storage download ─▶ hash check ─▶ normalizeState ─▶ replace state
export    full backup (copyboard-backup v1, palette only) · space JSON (copyboard-space v1) · settings JSON
          single item download · folder ZIP (JSZip)
import    backup / space / legacy raw state ─▶ isValidBoardState ─▶ normalize ─▶ confirm ─▶ recovery copy ─▶ replace
delete    card / folder (+children) / selection / clear space / delete space / storage manager / undo history only in memory
```

## 6. Rendering and events

- **Grid.** `render(force)` rebuilds the whole active grid with `replaceChildren()`. It skips the rebuild when `gridRenderSignature()` is unchanged. The signature is a fingerprint of every item: id, type, names, size, flags, and the first and last 32 characters of `data`. `flipRenderGrid()` measures card positions before and after a render to animate moves (FLIP).
- **Folder overlay.** `renderFolderGrid()` follows the same signature approach.
- **Card events.** Click, contextmenu and dragstart are delegated on `#grid` and `#folderGrid` (`bindDelegatedCardEvents`). The thumbnail press/drag gesture is bound per card (`bindThumbDrag`) and listens on `document` for `pointermove`/`pointerup`.
- **Tabs and dropdown.** Re-rendered from scratch on every change, with per-element listeners.
- **Global keyboard.**

  | Keys | Action |
  |---|---|
  | Ctrl/⌘+K | Palette (works even while typing) |
  | Ctrl/⌘+Z | Undo, when not typing |
  | Ctrl/⌘+Shift+Z, Ctrl/⌘+Y | Redo, when not typing |
  | Space on a hovered card | Quick look |
  | Escape | Handled by the modal stack (capture phase) |
  | Escape | Context menu (bubble phase; never reached while a modal is open) |

  There is no arrow-key or Tab-order navigation for cards or menus.

## 7. Architectural risks (summary)

These risks are covered in depth, with evidence and options, in [05-TECHNICAL-DEBT-AND-RISKS.md](05-TECHNICAL-DEBT-AND-RISKS.md).

| # | Risk | Kind |
|---|---|---|
| A1 | localStorage + inline base64 as the only local store. The 20 MiB budget is above the real browser capacity, and saves block the main thread with full serialization. | Verified defect (I‑36) + design limit |
| A2 | Start-up silently replaces unreadable or newer-schema data with an empty board | Verified defect (I‑35) |
| A3 | One 5,000-line closure with implicit render/persist contracts | Maintainability |
| A4 | Two competing event-arbitration layers (modal stack vs. local handlers) | Verified defects (I‑10, I‑11, I‑46, I‑M01) |
| A5 | `innerHTML` with unescaped user strings; imported item data used unvalidated as URLs | Verified defects (I‑31, I‑32, I‑33b) |
| A6 | Whole-board snapshot sync with no merge; passive activity triggers uploads; remote apply drops open edits | Verified on mock (I‑C02, I‑C03, I‑C05) |
| A7 | No automated tests, no CI, unpinned CDN majors without SRI | Process |

**What counts as a defect.** In this package, "defect" means behavior that contradicts the app's own labels, comments or obvious user intent, reproduced in the browser or proven from the code path. "Improvement" means a design limitation that works as written but constrains the refresh. The two are kept apart throughout.
