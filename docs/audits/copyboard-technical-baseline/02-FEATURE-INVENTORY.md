# 02 — Functional Inventory

This inventory lists every user-facing capability found in the audited commit `ac721fe`, including features that are hard to discover. It does **not** judge whether a feature is worth keeping on grounds of complexity alone. Every feature below has real users of its behavior or data. A redesign must either preserve each one or make an explicit, recorded decision to drop it.

**Verification column.**
- **Browser** = exercised in the Run 01 Playwright suite. The IDs point to [03-INTERACTION-MATRIX.md](03-INTERACTION-MATRIX.md).
- **Code** = established by reading the code only.
- **NOT VERIFIED** = needs hardware, accounts or production resources that were not available.

There is **no automated test coverage** for any feature: the repository has no test suite.

Line numbers refer to `src/js/app.js` unless stated otherwise.

---

## A. Capture and ingestion

| Feature | User purpose | Entry points / controls | Implementation | Data and state dependencies | Known problems | Verification | Preservation requirement |
|---|---|---|---|---|---|---|---|
| **Paste capture** | Drop clipboard text or images onto the board | Ctrl/⌘+V anywhere; background context menu "Einfügen"; drop zone hint | `document` `paste` listener, 3703; `pasteFromClipboard` 3658 | Active space; `addItem` | **Fires while typing in the palette, sticky note, cloud e-mail, PIN and inline editor fields, creating stray cards (I‑02)**. Always targets the top level of the active space, even with a folder open. | Browser I‑01, I‑02 | Always-on board paste (the explicit decision in commit `dcde803`), but scoped to non-input focus |
| **Text modal ("Zwischenablage")** | Review or edit clipboard text before saving | Header "+ Zwischenablage", drop zone link, palette | `openTextModal` 3630, `textOkBtn` 4598 | Clipboard read permission | Auto-reads the clipboard when the modal opens (permission prompt; privacy expectation) | Browser I‑03 | Pre-fill from clipboard with an editable preview |
| **File ingestion** | Store any file, up to 8 MiB each | Drop zone click (file picker, multiple), drag-and-drop anywhere, pasted files | `ingestFiles` 3643, `document` `drop` 3693 | `MAX_FILE_BYTES` 8 MiB, `MAX_TOTAL_BYTES` 20 MiB; base64 data URL stored inline | Images become `image`; everything else, including `.txt`, becomes an opaque `file`. Dropped links become text cards. The 20 MiB budget exceeds the real storage capacity (I‑36). | Browser I‑04, I‑36 | Any-file support; per-file limit message |
| **Voice memo** | Quick audio note | Mic button in header (toggle record/stop) | `startRecording` 4681 | `MediaRecorder`, `getUserMedia`; saved as `type:'file'`, `mime:'audio/webm'` | MIME type hard-coded as webm (Safari records mp4). No duration or size cap before the 20 MiB check. No visible timer beyond the button state. | Browser I‑42 (Chromium fake mic); Safari NOT VERIFIED | Recording → playable audio card |
| **OCR** | Extract text from an image into a new text card | Card menu → Weitere Aktionen → "Text erkennen (OCR)" (images only) | `runOcr` 4765 | Tesseract.js 5 from CDN, `deu+eng`; language data fetched at runtime | Network-dependent; no progress UI beyond a toast | Browser I‑43 (stub only); real recognition NOT VERIFIED | OCR result as a new card, original untouched |
| **Color-palette extraction** | Get the dominant colors of an image | Image card → Weitere Aktionen → "Farbpalette extrahieren" | `extractPalette` 4710 | Canvas 80×80 sampling | — | Browser I‑44 | Swatches copyable; "save as card" |
| **Duplicate detection on add** | Avoid storing the same content twice | Automatic on every add; dialog "Vorhandenes zeigen / Trotzdem ablegen" | `addItem` 3507, `findExactDuplicates` 3356 | Exact `type+mime+data` match across **all spaces and folders** | Single pending slot: with several duplicates in one upload, all but the last are silently dropped (I‑06) | Browser I‑05, I‑06 | Cross-space exact-match warning with "show existing" |

## B. Organization

| Feature | User purpose | Entry points | Implementation | Data and state | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|---|
| **Spaces (tabs)** | Separate boards for separate contexts | Tab bar; "+" button; background menu "Neuer Space"; palette | `renderTabs` 1678, `addSpace` 678, `deleteSpace` 686 | `state.spaces[]`, `state.data[spaceId]`, `activeSpaceId` | Only 1–2 tabs visible at 390 px (scroll arrows plus dropdown) | Browser I‑28, I‑29 | Ordered, named, colored spaces with independent content |
| Space rename | — | Big title input, tab pencil, tab context menu, overflow dropdown | 695, 1725, 1765 | — | 4 parallel rename paths with slightly different behavior | Browser I‑28 | One coherent rename |
| Space color / "atmosphere" | Visual identity of a space; tints the background | Tab dot, context menu "Farbe wählen", dropdown | `openColorPicker` 4352, `applySpaceAtmosphere` 1651 | `space.color` (7 presets), setting `appearance.spaceAtmosphere` off/subtle/strong | Imported color values are not validated → HTML injection (I‑32) | Browser I‑32, I‑14 | Color label and optional tint |
| Space duplicate / export JSON / clear / delete | Space lifecycle | Tab context menu, tab "×", dropdown | 716, 706, 728, 686 | `copyboard-space` v1 format | — | Browser I‑28, I‑14 | Formats must remain importable |
| Space drag-reorder | Order tabs | Drag handle on tab (hover) | `startTabDrag` 1865 | `state.spaces` order | Hover-only handle (unusable on touch) | Browser I‑28 | Reorderable tabs |
| **Folders** | Group cards inside a space | Drag a card onto another card; select ≥2 → "In Ordner"; drag a stack onto a card | `mergeIntoFolder` 3916, `selFolderBtn` 3301 | `folder.itemIds`; children live in the same `items` map | Nested folders can be created by the selection action and orphan their content on delete (I‑22). Removing a child down to one auto-dissolves the folder (I‑24). Folder thumbnails show locked children as broken images. | Browser I‑19, I‑22, I‑24 | One-level folders, auto-thumbnail of the first 4 children |
| Folder overlay ops | Rename, ZIP download, dissolve, delete-with-contents, per-child remove/delete | Folder header buttons; child card menus | 3951–4064 | JSZip | **The child card context menu is rendered beneath the folder overlay and cannot be used (I‑46).** That makes rename, details, share, move, OCR, PIN, "Aus Ordner entfernen" and friends unreachable for cards inside folders. ZIP fails on locked images (I‑25). "Dissolve" has no confirmation (intentional comment at 4008). | Browser I‑24, I‑25, I‑46 | All five actions, plus a working per-child action menu |
| **Manual order and sort modes** | Arrange cards | Drag reorder (manual mode); palette "Sortieren: …"; default for new spaces in Settings | `sortItemsForView` 633, `setSortMode` 652 | `space.sortMode` ∈ manual/name/newest/oldest/size/type; pinned items always first | Sort UI only via the palette | Browser I‑20, I‑14, I‑38 | Per-space sort plus pinned-first |
| **Pinning** | Keep a card at the top | Card menu "Anheften/Lösen" | `togglePin` 4564 | `item.pinned` | Not available for cards inside folders | Browser I‑14 | Pinned-first ordering |
| **Move / copy between spaces** | Re-file content | Drag card onto a tab; menu "In anderen Space verschieben"; share sheet "In anderen Space kopieren"; selection bar "Verschieben" (incl. new space) | `moveItemToSpace` 2633, `copyItemToSpace` 2613 | Folder children move along | Stack drag creates one undo step per card (I‑16). The space picker renders names as HTML (I‑31). | Browser I‑19, I‑16, I‑31 | All four routes, or a deliberate consolidation |
| **Multi-select** | Bulk actions | Hover checkbox; Shift-click range; "Alle auswählen"; drag a selected stack | `toggleSelect` 3197, selection bar 3250–3326 | `selectedIds` (memory only, top level only) | Checkbox only visible on hover (I‑M03). Not available inside folders. | Browser I‑23, I‑M03 | Select, move, folder, duplicate, delete in bulk |

## C. Finding things

| Feature | User purpose | Entry points | Implementation | Data | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|---|
| **Command palette** | Universal search and the *only* entry point to several functions | Ctrl/⌘+K, search icon, help buttons | `buildPaletteActions` 4380, `renderPalette` 4499 | — | Board backup export/import, recovery, sort, duplicate audit and storage status are hidden behind it | Browser I‑39, I‑34 | Keyboard-first command access; **every action must stay reachable** |
| Full-text search | Find cards across spaces/folders by name, space, folder, type, text content, favorite, original filename | Palette query | `buildPaletteCardResults` 4456, scoring 4445 | Text content only (no OCR index) | Locked items found by their plaintext name; opening them skips the PIN (I‑39) | Browser I‑39 | Cross-space content search with snippets |
| **Favorites** | Star important items | Card menu, header star (visible once ≥1 exists), palette | `toggleFavorite` 2182, `openFavorites` 2348 | `item.favorite` | Badge overlaps the delete button (I‑V01) | Browser I‑14, I‑V01 | Cross-space favorites list |
| **Recently used** | Return to recently opened/copied/edited items | Header clock (visible once ≥1 exists), palette | `markRecent` 2239, `renderRecentItems` 2279 | `state.recentItems` (limit 5–100, default 30); persisted and synced | Every view writes state and triggers a cloud upload (I‑C02) | Browser I‑C02 | History with action labels |
| Quick look | Preview a hovered card with the Space bar | Space key while hovering | 4557 | `hoveredCardItem` | Bypasses the PIN prompt for locked cards (I‑13) | Browser I‑13 | Space-bar preview on desktop |
| **Item inspector ("Details")** | Metadata, internal ID, locate/open | Card menu "Details" | `openInspector` 2414 | — | — | Screenshot desktop‑16 | Metadata view |
| **Duplicate audit** | Find identical content board-wide | Palette "Duplikate prüfen" | `openDuplicateAudit` 3411 | Same signature as on add | — | Screenshot desktop‑30 | Board-wide duplicate report |

## D. Viewing and editing

| Feature | User purpose | Entry points | Implementation | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|
| **Grid / list view** | Density choice | Header toggle, background menu, palette, Settings | `setViewMode` 1923 | — | Screenshots desktop‑02/03 | Both views, persisted per board |
| **Preview** | View text, image, audio; file badge for others | Click/tap card, eye button, menus | `openPreview` 3581 | Touch: opens and closes immediately depending on card position (I‑M01). No PDF/video rendering. | Browser I‑07, I‑M01 | Preview with share/copy/edit/download |
| **Inline text editing** | Edit text directly on the card | Hover pencil on text cards | `startInlineTextEdit` 3120 | Clicking inside the editor opens the preview. Escape inside a folder closes the folder and the discarded text is saved on the next click (I‑11). | Browser I‑11, I‑12 | Direct edit with Esc = cancel, ⌘/Ctrl+Enter = save |
| Edit text (modal) | Larger editing surface | Menu/preview "Inhalt bearbeiten" | 4578, 4598 | Remote cloud apply while open can lose the edit (I‑C05) | Browser I‑C05 | — |
| **Image edit** | Rotate 90°, flip H/V | Image "Inhalt bearbeiten" | 4620–4653 | Re-encodes non-PNG as JPEG 0.92; no size check | Browser I‑44 | Lossless-enough rotate/flip |
| Replace file | Swap a file's content, keep its card | File "Inhalt bearbeiten" → file picker | 4657 | No duplicate or total-size check; can change type file↔image | Code | — |
| Rename / reset name | Custom display name, keeping the original filename | Menu "Umbenennen" / "Namen zurücksetzen" | `startCardRename` 2743, `resetItemName` 2851 | `customName` vs. `name` | Browser I‑14 | Custom name plus original name kept |
| Duplicate card | Copy in place | Menu, selection bar | `duplicateItem` 2540 | — | Browser I‑23 | — |

## E. Output and sharing

| Feature | Purpose | Entry | Implementation | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|
| **Copy to clipboard** | Reuse content elsewhere | Card copy button, menu, preview | `copyItem` 3558 | Images normalized to PNG. Other types are usually rejected by the browser, which shows a toast with a hint. | Browser I‑41 | Copy text and images |
| Download | Export a single item | Menu, preview | `downloadItem` 3573 | Uses `item.data` as `href` without validation (I‑33b) | Browser I‑33b | — |
| Folder → ZIP | Export a folder | Folder menu/header | `buildFolderZipBlob` 2659 | Locked image crashes the export (I‑25) | Browser I‑24, I‑25 | — |
| Drag-out to desktop | Drag a card to the OS (Chrome/Edge) | Hover download handle | `handleCardDragStart` 3025 | — | NOT VERIFIED (I‑21) | — |
| **Share sheet** | Native share (Web Share API) plus fallbacks | Menu "Teilen", preview | `openShareSheet` 2718, `nativeShare` 2697 | Desktop Chromium shows no native option; labels rendered as HTML | Screenshot desktop‑31; native share NOT VERIFIED | Native share on mobile |
| **Burn-after-reading link** | Send a one-time text via link | Text card → Weitere Aktionen | `createBurnLink` 4862, `checkBurnHash` 4871 | The link *is* the content (base64 in the URL fragment) and can be opened repeatedly (I‑27) | Browser I‑27 | Only with an honest name, or a real one-time mechanism |

## F. Protection, safety and recovery

| Feature | Purpose | Entry | Implementation | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|
| **PIN-protected cards** | Hide sensitive card content | Weitere Aktionen → "Mit PIN schützen"; locked card buttons "Mit PIN anzeigen" / "PIN entfernen" | AES-GCM-256 + PBKDF2-SHA256 (150k), 4795–4859 | Name (first 40 chars of text) stays plaintext. No PIN policy. Bypass paths show empty previews (I‑13, I‑39). In-app help says it is "keine echte Verschlüsselung" (index.html:556). | Browser I‑26, I‑13, I‑39 | Encrypted-at-rest content; `encData` format must stay decryptable |
| **Undo / Redo** | Recover from mistakes | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z, Ctrl/⌘+Y, palette | `MUTATION_POLICY` 4069, `undoLast` 4174 | 20 steps, memory only. Settings reset/import not restorable. Stack moves need N steps. Undo after import creates orphan data. Cross-space undo is invisible. (I‑14…I‑18) | Browser I‑14–I‑18 | One user action = one step, for all content mutations |
| **Destructive-action confirmations** | Prevent accidental loss | Dialogs; toggle in Settings | `openDestructiveConfirm` 1471 | Import/recovery confirmations always shown (by design) | Browser I‑38 | — |
| **AutoSave toggle (temporary mode)** | Work without persisting | Bottom-right save button; Settings; palette | 1600 | Temporary mode also disables cloud upload | Browser I‑37 | Device-level preference |
| **Storage manager** | See usage, largest items, preview/delete | Click the autosave status pill; help; palette | `openStorageStatus` 1534 | Percentage is of the 20 MiB budget, not of the real quota | Browser I‑45 | Usage meter plus largest-items cleanup |
| **Full backup export/import** | Move or secure the whole board | Palette only | `exportBackup` 4286, `importBackupFile` 4318 | Not discoverable. 30 MiB import cap. Accepts `copyboard-backup` v1, `copyboard-space` v1 and legacy raw state (V16–V22). | Browser I‑34 | **All three formats must remain importable** |
| Pre-import recovery | Undo an import / manual cloud load | Palette "Stand vor letztem Import wiederherstellen" | 4228–4258 | Single slot, a full second copy in localStorage; silently not created when quota is exhausted | Browser I‑34 | — |
| Settings export/import/reset | Move preferences only | Help → Settings | 196–283 | Reset/import not undoable (I‑14) | Browser I‑38, I‑14 | `copyboard-settings` v1 |
| Legacy migration | Import from an older `window.storage` version | Automatic at start-up | `migrateFromLegacyWindowStorage` 575 | Only when no current state exists | Code | Keep until no V≤15 users remain (unknown) |

## G. Help, settings and notes

| Feature | Purpose | Implementation | Verification | Preservation |
|---|---|---|---|---|
| Help & Settings center (8 panels: Start, Bedienung, Tastenkürzel, Spaces, Speicher & Backup, Einstellungen, Sticky Notes, Hinweise & Grenzen) | Onboarding, shortcuts, limits | index.html 459–560, `openHelp` 2794 | Screenshots desktop‑19/21/22, mobile‑07/08 | Content must be revised; some statements are out of date (PIN) |
| Board settings: view mode, space atmosphere, default sort, confirm destructive actions, start space (last/first), recent-history limit | Preferences | `SETTINGS_REGISTRY` (constants.js), `setSetting` 168 | Browser I‑38 | Registry keys and their normalization |
| **Sticky Notes** | Small notes stored with the board, outside of spaces | Help → Sticky Notes | 2297–2328 | Browser I‑14 | `state.helpNotes` content |

## H. Cloud synchronization (optional)

| Feature | Purpose | Entry | Implementation | Known problems | Verification | Preservation |
|---|---|---|---|---|---|---|
| Account (sign up / sign in / sign out) | Optional multi-device | Account button (bottom-left) → dialog | 1398–1455 | Signing out keeps the local board. A different account signing in on the same profile uploads it (I‑C04). | Mock I‑C04; real Supabase NOT VERIFIED | Local-first: the app is fully usable without an account |
| Snapshot sync with revisions | Same board on several devices | Automatic (900 ms debounce), "Synchronisieren", "Cloud-Stand laden", update banner | 1117–1342 | Whole-board snapshots; no merge; passive activity uploads; remote apply can drop open edits (I‑C02, I‑C03, I‑C05) | Mock I‑C02/03/05 | Revision-checked publish (no blind overwrite) and local recovery point |
| Realtime notification | Learn about remote changes | Supabase Realtime `postgres_changes` | `cloudSubscribe` 1198 | — | NOT VERIFIED (mocked as no-op) | — |
| Cloud dashboard | Status, revision, last sync, counts | Account button when signed in | 1006 | — | Screenshot desktop‑34 (mock) | — |

## I. Less visible behaviors worth preserving

- **Start-space behavior.** The app reopens the last-used space by default, or the first space when that setting is chosen.
- **Page-exit flush.** Pending debounced saves are written on `pagehide`, on `visibilitychange:hidden` and on `beforeunload`. Temporary mode warns before unload.
- **Graceful degradation.** Each CDN feature (ZIP, OCR, cloud) fails independently with a message. The core board needs no network (I‑C01).
- **FLIP animations** for reorder, move and delete. Cards moved to another space fly into the target tab.
- **Pinned items stay first** in every sort mode.
- **Drag hint text** changes when manual ordering is paused by a sort mode (I‑20).
- **Custom names keep the original file name.** It appears in the inspector and stays searchable.
- **Escape and backdrop clicks close only the top-most layer** of the modal stack (I‑40). This is also the source of three defects.
- **The schema migration boundary.** `normalizeState()` is the single entry point for any loaded, imported or synced board.
