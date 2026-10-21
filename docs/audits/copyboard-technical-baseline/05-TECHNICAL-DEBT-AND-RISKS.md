# 05 — Technical Debt, Risks and Engineering Assessment

Each major problem below is written up in the same way: **evidence → cause → impact → severity → possible approaches → dependencies and trade-offs**. The goal is to set out options, not to prescribe a solution. In particular, nothing here assumes that a framework migration or a rewrite has been approved.

Severity scale:
- **Critical**: data loss without user action.
- **High**: data loss or security impact under normal use, or a core flow broken on a major platform.
- **Medium**: functional defect with a workaround, or significant maintainability cost.
- **Low**: cosmetic or edge case.

---

## R1 — Persistence layer: localStorage + inline base64 (Critical/High)

**Evidence.**
- I‑36: the Chromium quota is about 5.24 M chars against a 20 MiB configured budget. The third ~1.5 MB photo already fails to save. Unsaved items stay visible until the next reload and are then gone.
- I‑35: unreadable or newer-schema data is overwritten by an empty board at start-up.
- The recovery copy doubles storage use and fails silently (`app.js:4228`).

**Cause.**
- The whole board is one `localStorage` value, and binary content is stored inline as base64.
- The size check estimates UTF-8 bytes, while the browser quota counts UTF-16 code units for the entire origin. That origin also holds the recovery copy and the Supabase session.
- `init()` treats "could not load" the same as "no data".

**Impact.**
- Users hit the wall after a handful of images.
- Saves fail with only a transient toast.
- A schema bump or a corrupted write wipes the board.
- Every save serializes the whole board on the main thread.

**Severity.** Critical (I‑35), High (I‑36).

**Possible approaches.**
1. *Minimal hardening, no new storage:*
   - In `init()`, never overwrite on load failure. Copy the raw value to a quarantine key and warn the user.
   - Align `MAX_TOTAL_BYTES` with a measured quota (`navigator.storage.estimate()` is not reliable for localStorage; use a probe) and count characters.
   - Block adds after the first failed save.
   - Make a failed recovery write abort the import.
2. *Split store:* keep metadata in localStorage and move blobs to **IndexedDB** (stored as `Blob`, no base64), optionally with `navigator.storage.persist()`. The HTML maintenance note already lists an "IndexedDB migration" as deferred.
3. *OPFS* (Origin Private File System) for large blobs. Very fast, but with less tooling and older-Safari caveats.

**Dependencies and trade-offs.**
- (2) and (3) change the backup and cloud snapshot formats: blobs can no longer be part of `JSON.stringify(state)`. Cloud sync, duplicate detection (`data` string signature), undo snapshots, ZIP and export all have to be adapted together.
- (1) is independent and should come first, because it protects existing users during any later migration.
- A migration path from `copyboard_state_v1` must be idempotent and must survive interruption.

## R2 — Single 5,000-line closure with implicit contracts (Medium)

**Evidence.**
- `app.js:57–5099`: one IIFE, ~299 functions, 55 mutable closure variables, 203 listeners, 56 `persistState` call sites and 46 `mutationCheckpoint` call sites.
- Persistence after an image edit or file replace only happens as a side effect of `markRecent()` (`app.js:4641`, `4657`).
- `downloadBlob` is called but has never been defined (I‑38). Neither tests nor a linter could catch it.

**Cause.** Organic growth through versioned "V25…V34" increments, plus a cautious refactor that extracted only leaf utilities (format, files, toast, constants). The README says the big domains stay in `app.js` "until they can be extracted behind explicit interfaces without changing runtime behavior".

**Impact.**
- Every change requires knowing the right sequence of `mutationCheckpoint → mutate → refreshItems/render → persistState → showToast` by convention.
- Mistakes show up as missed saves, undo gaps (I‑14 settings, I‑16 stack moves) or stale UI.
- Nothing can be unit-tested.

**Severity.** Medium (maintainability), and the root of several verified defects.

**Possible approaches.**
1. Introduce **one mutation entry point** (`commit(kind, mutatorFn, {space})`) that performs checkpoint → mutate → normalize → persist → notify. Then migrate call sites one by one. This needs no framework.
2. Extract modules along the existing seams, with explicit parameters instead of closure access:
   - `state/` (schema, normalize, persistence)
   - `history/`
   - `cloud/`
   - `ingest/`
   - `ui/modals`
   - `ui/contextMenu`
   - `features/` (pin, burn, ocr, palette, voice)
3. Add a **render subscription**: state changes emit an event, and views re-render from state. This replaces the hand-picked render calls.
4. A component framework (React, Svelte, Lit, …) is **one** possible end state. The evidence does not *require* it: most defects come from missing contracts, not from the lack of a virtual DOM. If chosen, it changes the deployment model (a build step), the CDN-only constraint and contributor workflow.

**Dependencies and trade-offs.**
- (1) and (2) are low-risk only when tests exist first (see R7).
- A framework rewrite would discard working, edge-case-hardened behavior (modal stack, FLIP, schema normalization). Every preserved behavior in [06-REFRESH-READINESS.md](06-REFRESH-READINESS.md) would then need re-verification.

## R3 — Competing event arbitration (High)

**Evidence.**
- I‑46: the card context menu inside a folder renders **below** the folder overlay (z‑index 90 vs. ≥100 `!important`). All rows are unclickable, and a click closes the folder.
- I‑10: Escape closes the folder but leaves the context menu.
- I‑11: Escape inside an in-folder inline editor closes the folder, and the discarded text is saved on the next click. Clicking inside the inline editor opens the preview.
- I‑M01: on touch devices, a tap opens and immediately closes the preview or folder, depending on where the card sits (3/8 taps).

**Cause.** The modal stack (`app.js:4889–5065`) was layered over existing overlays:
- It intercepts Escape and backdrop clicks globally, in the capture phase, with `stopImmediatePropagation`.
- It raises z‑index above every non-modal popup.

Local components (context menu, inline editor, card press handler) still assume they receive events first. On top of that:
- Card opening happens on `pointerup`, not on `click`, so the touch compatibility click lands on the freshly opened backdrop.
- The inline editor is nested inside `.thumb`, whose press handler opens the preview.

**Impact.**
- Folder children have no rename, move, details, share, OCR, PIN or "remove from folder" actions.
- Unreliable mobile opening.
- Silent unwanted saves.

**Severity.** High.

**Possible approaches.**
1. Treat popups (context menu, submenu, color picker, dropdown) as **layers in the same stack**, so they get z‑index and Escape priority above the current modal.
2. Open on `click` (or ignore the follow-up click after a `pointerup` open, for example with a short `pointerdown` origin check on the backdrop handler: only close when the press *started* on the backdrop).
3. Move the inline editor out of `.thumb`, or stop pointer propagation from the editor. Make Escape inside editable elements a local concern first.

**Dependencies.** Visual layer ordering is part of the redesign. The *rule* matters more than the numbers: "the most recently opened layer receives Escape and outside clicks first".

## R4 — Unsafe rendering and unvalidated import data (High)

**Evidence.** I‑31, I‑32, I‑33b. Script execution through a space name, a space color, and an imported `javascript:` file payload.

**Cause.**
- `innerHTML` templates with raw strings (`renderContextRows`, share rows, space-color icon).
- Import validation that checks structure but not field content.

**Impact.** A shared board JSON, or any device on the same account, can run code in the CopyBoard origin, with access to the board, the PIN ciphertexts and the Supabase session.

**Severity.** High.

**Possible approaches.**
1. Build menu rows with DOM APIs and `textContent`. Keep icons as trusted constants.
2. Validate on `normalizeItem`/`normalizeState`:
   - `data` must be `data:` for file and image items, or a string for text items;
   - `color` must match `^#[0-9a-f]{6}$`;
   - `mime` must match a token grammar.
3. Add a meta CSP (`script-src 'self' <pinned CDNs>`, no `unsafe-inline`). This needs the inline `<script type="application/json">` manifest and the comment-bearing script tags to be reviewed.
4. Add SRI hashes and pin exact versions for the CDN scripts.

**Dependencies.** Normalization changes affect imports of old backups. Lenient-but-safe coercion is better than rejection.

## R5 — Snapshot-based sync without merge (High)

**Evidence.**
- I‑C02: passive views create revisions.
- I‑C03: no merge, uploads blocked after a dismiss, local-only items discarded on the first sign-in of a second device.
- I‑C05: remote apply loses an open edit while showing "Gespeichert".
- I‑C04: cross-account upload on a shared profile.

**Cause.**
- The whole-state hash includes UI and activity fields.
- Conflict handling is binary: replace local, or wait.
- Remote apply swaps the `state` object under live UI references.

**Impact.** Multi-device users can lose work, and conflicts are frequent even without real concurrent editing.

**Severity.** High (sync is optional, but the users who enable it are exactly the multi-device users).

**Possible approaches.**
1. *Quick wins:*
   - Exclude `recentItems`, `activeSpaceId` and other UI state from the synced hash and payload (keep them device-local).
   - Never auto-apply while any edit dialog or inline editor is open; defer and show the banner.
   - Clear undo history on apply.
   - Offer "Lokale Version behalten (Cloud überschreiben)" alongside "Cloud laden".
2. *Item-level three-way merge* using the last synced snapshot as the base (CopyBoard already stores `contentHash`; it would also need the base snapshot locally). Most edits touch disjoint items, so automatic merge would succeed often.
3. *Per-item records* (a table of items plus a blob store) with per-item revisions or CRDT-like last-writer-wins on fields. This is the largest change and requires backend schema work.

**Dependencies.** (2) and (3) depend on R1 (blob storage), on the backend schema (not in the repository; see 04 §3.1) and on a migration of existing cloud snapshots.

## R6 — Touch and keyboard accessibility (High/Medium)

**Evidence.**
- I‑M01: tap opens and closes.
- I‑M03: select, drag handle and inline-edit controls are hover-only.
- I‑M04: context actions depend on the `contextmenu` event, which iOS does not fire.
- I‑M02: `.thumb { touch-action:none }` blocks panning that starts on a card. That follows from the CSS spec; the emulation could not reproduce scrolling at all.
- I‑30: cards cannot be focused; menus have no keyboard navigation.

**Cause.** A desktop/mouse-first interaction model: hover reveal, right-click, pointer-drag on the main tap target.

**Impact.**
- On phones, large parts of the feature set (folder child actions, OCR, PIN, move, share, multi-select) are hard or impossible to reach.
- Keyboard and screen-reader users cannot operate cards except through the three per-card buttons.

**Severity.** High for mobile, Medium for keyboard.

**Possible approaches.**
- An explicit "more" button per card that opens the same action list as the context menu.
- Long-press with a timer.
- A selection mode toggle.
- A drag handle as the only drag source on touch (remove `touch-action:none` from `.thumb`).
- `tabindex`, roving focus and ARIA menu roles.

**Dependencies.** These are product and UX decisions for the redesign. The technical constraint is that every action must keep one implementation that is reachable from several entry points.

## R7 — No automated tests, no CI (Medium, process)

**Evidence.**
- There are no test files, workflow files or linter config.
- The README's verification step is `node --check` plus manual testing.
- `downloadBlob` has been undefined since at least V34 (I‑38).

**Impact.** Every refactor risks regressions that nobody notices, and the redesign will touch almost every interaction.

**Possible approaches.**
1. Turn the Run 01 harness (`evidence/qa-*.mjs`) into a Playwright test project. Its scenarios already encode the expected behavior for 50+ interactions. The repository would need a `package.json`, which is the first deviation from "no package manager" and should be decided explicitly.
2. Add unit tests for pure functions (`normalizeState`, `isValidBoardState`, sort, search scoring, `exportFilename`). This needs R2's extraction first.
3. Add an ESLint `no-undef` pass. It alone would have caught `downloadBlob`.
4. Add a GitHub Actions workflow running (1)–(3) on pull requests to `develop`.

## R8 — Performance characteristics (Medium, not benchmarked)

The following is code-derived and was not measured in this run:
- O(board) work on every save: stringify, plus SHA-256 when signed in.
- O(board) on every add: `estimateBytes(state)`, and the duplicate scan compares full data strings across all spaces.
- O(board) deep clones for cross-space undo checkpoints, with up to 20 retained, so memory can reach 20× the board size.
- Full grid rebuild on any change (`replaceChildren`), mitigated by a signature check.
- `MutationObserver` on the whole `document.body` for icon decoration, plus a capture-phase `click` listener that re-scans all menus on every click.

At today's real size limit (~5 M chars) this is acceptable. Raising the storage ceiling (R1) without addressing these costs would make the UI janky.

## R9 — Smaller verified defects (Low–Medium)

| ID | Defect | Severity |
|---|---|---|
| I‑02 | Paste capture creates cards from pastes into other inputs | High (privacy/data) |
| I‑06 | Multi-file upload with several duplicates silently drops all but the last | Medium |
| I‑13, I‑39 | PIN bypass to an empty preview (Space quick look, search) | Medium |
| I‑14 | Settings reset/import not undoable (`boardData` snapshot excludes `settings`) | Medium |
| I‑16 | Stack move to another space needs one undo per card | Medium |
| I‑17 | Undo after import writes orphan space data | Medium |
| I‑22 | Selection "In Ordner" with two folders nests folders; deleting the outer folder orphans the inner folder's children | Medium |
| I‑25 | ZIP export throws on locked images | Medium |
| I‑26 | PIN-locked text name keeps a plaintext 40-character prefix | Medium |
| I‑27 | Burn-after-reading link is neither secret nor one-time | Medium |
| I‑38 | Settings export throws `ReferenceError: downloadBlob is not defined` | Medium |
| I‑15 | Undo restores changes in a non-visible space without feedback | Low |
| I‑V01 | Favorite badge overlaps the delete button | Low |
| Code | `itemTypeLabel` handles `type:'audio'`, which never occurs; voice memos are `file` with an audio MIME type | Low |
| Code | `HTML <script src=jszip>` tag carries an inline comment body (ignored) | Low |
| Code | Header source map (`app.js:35`) no longer matches the file layout | Low |
| Code | In-app help states the PIN is not real encryption (index.html:556) | Low (documentation) |

## R10 — Operational risks

- **Single maintainer, no CI, direct publish from `main`** (presumably GitHub Pages). A broken commit reaches users immediately, and users cannot pin an older version.
- **The browser cache can serve an older `app.js` against data written by a newer one.** Combined with I‑35, a future `STATE_SCHEMA_VERSION = 2` rollout is dangerous until start-up stops overwriting unreadable data.
- **The Supabase backend is not reproducible from the repository.** Disaster recovery and audits depend on manual project state.
- **Third-party CDN availability and integrity** (see R4).

## Browser compatibility notes

| Area | Status |
|---|---|
| Chromium (desktop + mobile emulation) | Exercised in this run |
| Firefox | NOT VERIFIED |
| Safari / iOS | NOT VERIFIED. Known API differences: `ClipboardItem` support for images, `navigator.clipboard.read()` permission UX, MediaRecorder MIME type, no `contextmenu` on long-press, localStorage limits in private mode, `DownloadURL` drag-out unsupported. |
| Module support | Required (native ES modules), no fallback |
| `crypto.randomUUID` / `crypto.subtle` | Fallbacks exist for UUID and hash. PIN protection requires `crypto.subtle`, which means a secure context. |
