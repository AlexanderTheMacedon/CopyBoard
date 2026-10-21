# Screenshot Index — Existing UI Baseline (Run 01)

Every image is a capture of the **real, unmodified application** at commit `ac721fe`, in headless Chromium with **disposable synthetic data**. None of them is a mockup.

- Desktop: 1440×900, DPR 1.
- Mobile: 390×844, DPR 2, touch emulation, Android Chrome user agent.
- Tablet: 820×1180.

Captured by `evidence/qa-screens.mjs` (except desktop‑35, from `qa-interactions.mjs` I‑46).

**Rendering caveats.**
- After capture, the files were re-encoded as 256-color palette PNGs to keep the repository small (19.4 MB → 7.3 MB). This adds slight banding on gradients; the content is unchanged.
- Google Fonts (Fraunces) were blocked in the sandbox, so the space title renders in the fallback serif.
- The cloud dialog shows its *library unavailable* state because the Supabase CDN was blocked. The signed-in dashboard (desktop‑34) is backed by an **in-memory mock**, not Supabase.
- Opening the mobile folder and preview used a synthetic mouse click, because a touch tap at that position opens and immediately closes the overlay (I‑M01).

| # | Screenshot | State | How it was reached |
|---|---|---|---|
| 1 | [desktop-01-empty-board.png](screenshots/desktop-01-empty-board.png) | Empty board (first start, default space "Dein CopyBoard") | Fresh profile, no storage |
| 2 | [desktop-20-cloud-dialog-library-unavailable.png](screenshots/desktop-20-cloud-dialog-library-unavailable.png) | Cloud dialog, signed out, Supabase library not loadable (CDN blocked in audit sandbox) | Click account button |
| 3 | [desktop-02-populated-grid.png](screenshots/desktop-02-populated-grid.png) | Populated grid: text, image, file, folder, pinned, favorite and PIN-locked cards | Seeded disposable board |
| 4 | [desktop-03-list-view.png](screenshots/desktop-03-list-view.png) | List view of the same space | Click list view toggle |
| 5 | [desktop-04-card-hover-controls.png](screenshots/desktop-04-card-hover-controls.png) | Card hover state: drag handle, select box, drag-out, inline edit trigger | Mouse hover |
| 6 | [desktop-05-card-context-menu.png](screenshots/desktop-05-card-context-menu.png) | Card context menu (text card) | Right-click card |
| 7 | [desktop-06-card-context-submenu.png](screenshots/desktop-06-card-context-submenu.png) | Nested submenu "Weitere Aktionen" | Hover submenu row |
| 8 | [desktop-07-folder-context-menu.png](screenshots/desktop-07-folder-context-menu.png) | Folder context menu (flat structure, no submenu) | Right-click folder |
| 9 | [desktop-08-space-tab-context-menu.png](screenshots/desktop-08-space-tab-context-menu.png) | Space tab context menu | Right-click active tab |
| 10 | [desktop-09-background-context-menu.png](screenshots/desktop-09-background-context-menu.png) | Board background context menu (paste, new space, view) | Right-click drop zone |
| 11 | [desktop-10-folder-open.png](screenshots/desktop-10-folder-open.png) | Folder overlay with three child cards | Click folder thumbnail |
| 12 | [desktop-11-preview-text.png](screenshots/desktop-11-preview-text.png) | Text preview modal | Click text card |
| 13 | [desktop-12-preview-image.png](screenshots/desktop-12-preview-image.png) | Image preview modal | Click image card |
| 14 | [desktop-13-inline-text-edit.png](screenshots/desktop-13-inline-text-edit.png) | Inline text editing inside a card | Hover + inline edit trigger |
| 15 | [desktop-14-edit-text-modal.png](screenshots/desktop-14-edit-text-modal.png) | Edit text content modal | Context menu → Inhalt bearbeiten |
| 16 | [desktop-15-image-edit-modal.png](screenshots/desktop-15-image-edit-modal.png) | Image edit modal (rotate/flip canvas) | Context menu → Inhalt bearbeiten on image |
| 17 | [desktop-16-inspector.png](screenshots/desktop-16-inspector.png) | Item details inspector | Context menu → Details |
| 18 | [desktop-17-command-palette.png](screenshots/desktop-17-command-palette.png) | Command palette (actions list) | Ctrl+K |
| 19 | [desktop-18-palette-search.png](screenshots/desktop-18-palette-search.png) | Command palette full-text search hit in text content | Type "roadmap" |
| 20 | [desktop-19-help-start.png](screenshots/desktop-19-help-start.png) | Help & Settings center — start panel | Click help/settings button |
| 21 | [desktop-21-settings-panel.png](screenshots/desktop-21-settings-panel.png) | Help & Settings center — settings panel | Settings nav item |
| 22 | [desktop-22-sticky-notes.png](screenshots/desktop-22-sticky-notes.png) | Help & Settings center — sticky notes | Notes nav item |
| 23 | [desktop-23-storage-over-help.png](screenshots/desktop-23-storage-over-help.png) | Storage manager stacked above help center (modal stack) | Help → Speicher → Öffnen |
| 24 | [desktop-24-favorites.png](screenshots/desktop-24-favorites.png) | Favorites list | Header star button |
| 25 | [desktop-25-recent.png](screenshots/desktop-25-recent.png) | Recently used list | Header clock button |
| 26 | [desktop-26-multi-select-bar.png](screenshots/desktop-26-multi-select-bar.png) | Multi-selection with floating selection bar | Hover + select boxes on 3 cards |
| 27 | [desktop-27-pin-prompt.png](screenshots/desktop-27-pin-prompt.png) | PIN prompt for a locked card | Click locked card |
| 28 | [desktop-28-confirm-delete.png](screenshots/desktop-28-confirm-delete.png) | Destructive confirmation dialog | Card delete button |
| 29 | [desktop-29-duplicate-detected.png](screenshots/desktop-29-duplicate-detected.png) | Duplicate detected on paste (exists in another space) | Paste existing text |
| 30 | [desktop-30-duplicate-audit.png](screenshots/desktop-30-duplicate-audit.png) | Duplicate audit dialog | Palette → Duplikate prüfen |
| 31 | [desktop-31-share-sheet.png](screenshots/desktop-31-share-sheet.png) | Share sheet (no navigator.share in desktop Chromium headless) | Folder → Teilen |
| 32 | [desktop-32-many-spaces-overflow.png](screenshots/desktop-32-many-spaces-overflow.png) | Many spaces: tab overflow controls | Add 6 spaces |
| 33 | [desktop-33-spaces-dropdown.png](screenshots/desktop-33-spaces-dropdown.png) | Spaces overflow dropdown | Overflow button |
| 34 | [desktop-34-cloud-dashboard-mock.png](screenshots/desktop-34-cloud-dashboard-mock.png) | Cloud dashboard signed in (IN-MEMORY MOCK backend, not Supabase) | Mocked session + click account button |
| 35 | [mobile-01-empty-board.png](screenshots/mobile-01-empty-board.png) | Mobile empty board | Fresh profile, 390x844 touch |
| 36 | [mobile-02-populated-grid.png](screenshots/mobile-02-populated-grid.png) | Mobile populated grid (above the fold) | Seeded board |
| 37 | [mobile-03-populated-full-page.png](screenshots/mobile-03-populated-full-page.png) | Mobile populated grid (full page) | Full-page capture |
| 38 | [mobile-04-list-view.png](screenshots/mobile-04-list-view.png) | Mobile list view | Tap list toggle |
| 39 | [mobile-05-folder-open.png](screenshots/mobile-05-folder-open.png) | Mobile folder overlay | Opened via synthetic mouse click (a touch tap opens and immediately closes it, see I-M01) |
| 40 | [mobile-06-preview.png](screenshots/mobile-06-preview.png) | Mobile text preview | Tap text card |
| 41 | [mobile-07-help.png](screenshots/mobile-07-help.png) | Mobile help & settings | Tap help |
| 42 | [mobile-08-settings.png](screenshots/mobile-08-settings.png) | Mobile settings panel | Settings nav |
| 43 | [mobile-09-cloud-dialog.png](screenshots/mobile-09-cloud-dialog.png) | Mobile cloud dialog (library unavailable in sandbox) | Tap account |
| 44 | [mobile-10-command-palette.png](screenshots/mobile-10-command-palette.png) | Mobile command palette | Tap search |
| 45 | [mobile-11-context-menu-via-right-click.png](screenshots/mobile-11-context-menu-via-right-click.png) | Mobile context menu (opened via synthetic right-click; long-press on real devices NOT VERIFIED) | Synthetic contextmenu |
| 46 | [tablet-01-populated-grid.png](screenshots/tablet-01-populated-grid.png) | Tablet portrait populated grid | Seeded board, 820x1180 |
| 47 | [desktop-35-folder-context-menu-behind-overlay.png](screenshots/desktop-35-folder-context-menu-behind-overlay.png) | DEFECT evidence: card context menu inside an open folder rendered beneath the folder overlay (I-46) | Open folder → right-click child card (captured by qa-interactions.mjs I-46) |

## Required states → screenshots

| Requested state | Files |
|---|---|
| Empty board | desktop‑01, mobile‑01 |
| Populated grid | desktop‑02, mobile‑02/03, tablet‑01 |
| List view | desktop‑03, mobile‑04 |
| Menus (card, submenu, folder, space tab, background) | desktop‑05…09, mobile‑11; defect desktop‑35 |
| Folder | desktop‑10, mobile‑05 |
| Preview | desktop‑11/12, mobile‑06 |
| Editing (inline, text dialog, image, details) | desktop‑13…16 |
| Command palette / search | desktop‑17/18, mobile‑10 |
| Settings / help | desktop‑19/21/22, mobile‑07/08 |
| Storage manager (stacked modal) | desktop‑23 |
| Favorites / recent | desktop‑24/25 |
| Selection, PIN, confirm, duplicates, share | desktop‑26…31 |
| Many spaces / overflow | desktop‑32/33 |
| Cloud dialog | desktop‑20 (signed out, library unavailable), desktop‑34 (signed in, mock), mobile‑09 |
