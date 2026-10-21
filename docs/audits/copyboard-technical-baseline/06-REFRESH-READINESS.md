# 06 — Refresh Readiness

This document lists the **existing behaviors, data structures and technical constraints** that any future product or UI refresh has to account for. It does **not** define the new product, the visual design, the interaction model or the technology choice. Those belong to the human-led design phase that follows this audit.

---

## 1. Readiness verdict

| Dimension | State | Comment |
|---|---|---|
| Functional scope understood | ✅ | 40+ features inventoried ([02](02-FEATURE-INVENTORY.md)); none undocumented |
| Behavior captured as executable evidence | ◑ | 57 browser scenarios in `evidence/qa-interactions.mjs`; not yet a maintained test suite |
| Data model stable and documented | ◑ | Single schema v1 with a normalization boundary, but field contents are unvalidated and the start-up path destroys unreadable data (I‑35) |
| Safe to change storage or sync | ❌ | No test net; persistence limits (I‑36) and sync conflicts (I‑C03, I‑C05) are open; backend policies not in the repository |
| Safe to change UI layer | ◑ | The UI is tangled with state mutation (05/R2). A visual refresh that keeps the DOM contracts is feasible. A structural one needs the mutation entry point and tests first. |
| Security baseline | ❌ | Three stored-XSS paths, no CSP or SRI ([04](04-DATA-SECURITY-AND-SYNC.md) §8) |

**Overall: conditionally ready.** The design phase can begin. Before implementation of a larger refresh starts, the following should be in place:

1. The data-loss guards (I‑35, I‑36).
2. The XSS fixes (I‑31, I‑32, I‑33b).
3. A regression test project derived from the Run 01 harness.

These are prerequisites that protect existing users. They are not part of the redesign. Whether and when to do them is a separate decision.

## 2. Data structures a refresh must keep readable

These formats exist in users' browsers, backup files and cloud snapshots. A refresh may change how they are stored internally, but it **must keep reading all of them**, or ship a tested migration.

| Structure | Where | Must preserve |
|---|---|---|
| `copyboard_state_v1` (schema 1) | localStorage | `spaces[]` order, `activeSpaceId`, `data[spaceId].itemIds` (manual order), `items` map incl. folder `itemIds`, `settings` (registry keys), legacy `viewMode` mirror, `recentItems`, `helpNotes`, unknown keys (kept today by design) |
| Item fields | Every item | `id`, `type` (`text`/`image`/`file`/`folder`), `name` vs. `customName`, `mime`, `size`, `timestamp`, `data` (text or base64 data URL), `favorite`, `pinned`, `locked` + `lockedType` + `encData{cipher,iv,salt}` |
| PIN ciphertext | `encData` | AES-GCM-256, PBKDF2-SHA-256 150,000 iterations, 16-byte salt, 12-byte IV, base64. Plaintext is the original `data` string. **Must stay decryptable with the user's PIN.** |
| Backup formats | Files | `copyboard-backup` v1, `copyboard-space` v1, legacy raw state (V16–V22), `copyboard-settings` v1 |
| Legacy `window.storage` keys | Very old installs | Only if those users still exist (unknown) |
| Cloud | Supabase | Row `copyboard_boards` (`revision`, `object_path`, `content_hash`, …); objects `<uid>/snapshots/*.json` containing the full state JSON; device-local `copyboard_cloud_meta_v1:<uid>` and `copyboard_cloud_device_id_v1` |
| Settings registry | `constants.js` | Key names and normalizers (`appearance.viewMode`, `appearance.spaceAtmosphere`, `behavior.defaultSortMode`, `behavior.confirmDestructiveActions`, `behavior.startSpace`, `history.recentLimit`, `device.autoSave`) |

## 3. Behaviors to preserve (functional contract)

These behaviors are verified or clearly intended, and users rely on them. They are stated so that any implementation can be checked against them.

**Capture**
- Pasting on the board (outside text fields) creates a card immediately: text → text card, image → image card.
- Drag-and-drop of files or text from the OS anywhere on the page.
- Exact-duplicate warning across all spaces and folders, with "show existing" and "add anyway".
- Per-file size limit with a clear message.

**Organization**
- Ordered, named, colored spaces.
- Manual order per space.
- Sort modes per space (manual/name/newest/oldest/size/type), with **pinned items always first**.
- One-level folders created by drop-on-card or by selection. Folder thumbnails show the first four children.
- Move or copy to another space, including "create new space" from the picker.
- Multi-select with range selection and bulk move, folder, duplicate and delete.

**Retrieval**
- Search across all spaces and folders, including text content, with snippets.
- Favorites and recently-used lists that navigate to the item, opening the folder when needed.
- Item details: metadata and the original filename after a rename.

**Editing**
- Text editing (inline and dialog), image rotate/flip, file replace.
- Custom display names that keep the original name.

**Output**
- Copy to the system clipboard (text, images as PNG).
- Download a single item.
- Folder as ZIP.
- Native share where available.

**Safety**
- Undo/redo for every content mutation (20 steps).
- Confirmation for destructive actions, with a user setting to turn it off.
- Temporary (no-save) mode with a leave warning.
- Storage overview with largest-items cleanup.
- Full backup export/import with a pre-import recovery point.

**Local-first**
- The board works fully without an account and without network.
- Each CDN-based feature degrades independently (I‑C01).

**Cloud (optional)**
- Revision-checked publish: never a blind overwrite of a newer cloud state.
- A local recovery point before replacing local data.
- Status indicator.

**Layering**
- Escape and outside clicks affect only the top-most layer (I‑40), as a rule rather than an implementation.

## 4. Behaviors that must not be carried over unchanged

These behaviors are verified as defects. A redesign that copies the current interaction code as-is would inherit them.

| Behavior | Evidence |
|---|---|
| Paste creates cards while typing in other inputs | I‑02 |
| Opening on `pointerup` plus a global capture-phase backdrop close (touch tap opens and closes) | I‑M01 |
| Popups below modals; Escape order between popups and modals | I‑46, I‑10 |
| Inline editor nested in the press-to-open area; Escape and commit-on-next-click | I‑11 |
| Hover-only controls and right-click-only actions | I‑M03, I‑M04, I‑30 |
| Silent overwrite of unreadable stored data; silent loss after a failed save | I‑35, I‑36 |
| Unescaped `innerHTML` for user strings; unvalidated imported `data`/`color` | I‑31, I‑32, I‑33b |
| Lock bypass to an empty preview; plaintext names on locked items | I‑13, I‑39, I‑26 |
| "Burn-after-reading" label on a reusable plaintext link | I‑27 |
| Passive activity in the synced payload; remote apply under open editors | I‑C02, I‑C05 |
| Settings and multi-item actions outside the single-step undo model | I‑14, I‑16, I‑17 |

## 5. Technical constraints and open decisions for the design phase

These are inputs to the design process, not decisions.

| # | Constraint / question | Why it matters |
|---|---|---|
| C1 | **Storage ceiling.** Today about 5 M characters in localStorage. More capacity needs IndexedDB or OPFS (05/R1). | Determines how many images or files the product can promise, and whether "any file up to 8 MiB" is honest. |
| C2 | **Static hosting with no build step** is the current deployment model (GitHub Pages + CDN). | A framework, TypeScript or bundling changes hosting, contributor workflow and the CDN/SRI story. |
| C3 | **Desktop-first interactions** (hover, right-click, pointer-drag). | Mobile parity requires explicit entry points for every action (05/R6). |
| C4 | **Many features are reachable only through the command palette or the context menu**: backup, sort, duplicate audit, OCR, PIN, burn link, move. | Information architecture must decide which ones get visible entry points. |
| C5 | **Sync granularity** is the whole board. | Item-level sync needs backend schema work that cannot be done from this repository (04 §3.1). |
| C6 | **All UI text is German and inline** in HTML/JS. Icon selection depends on German labels. | Copy changes can silently break icons; i18n would need a string layer. |
| C7 | **PIN protection semantics.** Encryption exists; the help text says it does not. Metadata is not covered. | The product needs one honest claim. That affects naming, help copy and the threat model. |
| C8 | **Burn-after-reading** cannot be one-time without a server component. | Keep it (renamed), redesign it with a backend, or drop it: this is a product decision. |
| C9 | **Undo is in memory only**, max 20 steps, and lost on reload. | Whether undo should survive a reload is a product question; it affects the storage design. |
| C10 | **Accessibility.** Cards are not focusable; menus have no keyboard navigation; the modal stack sets `role=dialog`/`aria-modal`. | The new interaction model should define keyboard and screen-reader paths from the start. |
| C11 | **The backend is not in the repository.** | Any sync redesign starts by exporting and reviewing the Supabase schema and policies. |
| C12 | **Single shared state object, mutated in place.** | Any new UI layer must either keep the normalization boundary (`normalizeState`) and the single persistence path, or replace both together. |

## 6. Suggested sequencing (non-binding)

1. **Stabilize** (independent of any redesign):
   - I‑35 and I‑36 guards;
   - XSS fixes and import validation;
   - `downloadBlob`;
   - z‑index and Escape layering;
   - touch-tap ghost click.
   Each fix is small and local.
2. **Safety net:**
   - convert the Run 01 harness into Playwright tests;
   - add `no-undef` linting;
   - add CI on `develop`.
3. **Design phase** (human-led), using 02/03/06 as its functional contract.
4. **Structural work** chosen by the design outcome:
   - mutation entry point and module extraction (05/R2);
   - storage split (R1);
   - sync model (R5).

## 7. Unverified areas the design phase should not rely on

The following are NOT VERIFIED. They need real devices or production access.

- Real Supabase behavior: RLS, Storage policies, RPC body, Auth email flows, realtime delivery.
- iOS/Android hardware: long-press, scrolling with `touch-action:none`, share sheet, clipboard image write, MediaRecorder MIME types, private-mode quotas.
- Firefox and Safari in general.
- Real OCR quality and performance (Tesseract was stubbed).
- Drag-out to the desktop.
- Performance with boards near the real quota, or on low-end devices.
- The production deployment, including GitHub Pages configuration and cache headers.
