// Baseline screenshot capture (Run 01). Captures real, tested UI states with disposable data.
import * as L from './qa-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const index = [];
const rec = (file, state, how) => { index.push({file, state, how}); console.log('captured', file); };

await L.launch();
const state = await L.seedState();

// ---------- Desktop 1440x900 ----------
{
  const {page, context} = await L.openApp({});
  rec(await L.shot(page,'desktop-01-empty-board'), 'Empty board (first start, default space "Dein CopyBoard")', 'Fresh profile, no storage');
  await page.click('#cloudToggle');
  rec(await L.shot(page,'desktop-20-cloud-dialog-library-unavailable'), 'Cloud dialog, signed out, Supabase library not loadable (CDN blocked in audit sandbox)', 'Click account button');
  await page.keyboard.press('Escape');
  await context.close();
}
{
  const {page, context} = await L.openApp({storage:L.seededStorage(state)});
  rec(await L.shot(page,'desktop-02-populated-grid'), 'Populated grid: text, image, file, folder, pinned, favorite and PIN-locked cards', 'Seeded disposable board');
  await page.click('#viewListBtn');
  rec(await L.shot(page,'desktop-03-list-view'), 'List view of the same space', 'Click list view toggle');
  await page.click('#viewGridBtn');

  await page.hover('#grid .card[data-id="t_notes"] .thumb');
  rec(await L.shot(page,'desktop-04-card-hover-controls'), 'Card hover state: drag handle, select box, drag-out, inline edit trigger', 'Mouse hover');

  await page.click('#grid .card[data-id="t_notes"] .thumb', {button:'right'});
  rec(await L.shot(page,'desktop-05-card-context-menu'), 'Card context menu (text card)', 'Right-click card');
  await page.hover('#contextMenu .ctx-row.has-submenu');
  rec(await L.shot(page,'desktop-06-card-context-submenu'), 'Nested submenu "Weitere Aktionen"', 'Hover submenu row');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="f_folder"] .thumb', {button:'right'});
  rec(await L.shot(page,'desktop-07-folder-context-menu'), 'Folder context menu (flat structure, no submenu)', 'Right-click folder');
  await page.keyboard.press('Escape');

  await page.click('#tabsScroll .tab[data-id="sp_recherche"]', {button:'right'});
  rec(await L.shot(page,'desktop-08-space-tab-context-menu'), 'Space tab context menu', 'Right-click active tab');
  await page.keyboard.press('Escape');

  await page.click('#dropzone', {button:'right'});
  rec(await L.shot(page,'desktop-09-background-context-menu'), 'Board background context menu (paste, new space, view)', 'Right-click drop zone');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="f_folder"] .thumb');
  await page.waitForSelector('#folderOverlay.show');
  rec(await L.shot(page,'desktop-10-folder-open'), 'Folder overlay with three child cards', 'Click folder thumbnail');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="t_notes"] .thumb');
  await page.waitForSelector('#previewOverlay.show');
  rec(await L.shot(page,'desktop-11-preview-text'), 'Text preview modal', 'Click text card');
  await page.keyboard.press('Escape');
  await page.click('#grid .card[data-id="i_grad"] .thumb');
  await page.waitForSelector('#previewOverlay.show');
  rec(await L.shot(page,'desktop-12-preview-image'), 'Image preview modal', 'Click image card');
  await page.keyboard.press('Escape');

  await page.hover('#grid .card[data-id="t_code"] .thumb');
  await page.click('#grid .card[data-id="t_code"] .inline-text-edit-trigger');
  rec(await L.shot(page,'desktop-13-inline-text-edit'), 'Inline text editing inside a card', 'Hover + inline edit trigger');
  await page.click('#grid .card[data-id="t_code"] .inline-text-cancel');

  await page.click('#grid .card[data-id="t_notes"] .thumb', {button:'right'});
  await page.click('#contextMenu .ctx-row:has-text("Inhalt bearbeiten")');
  await page.waitForSelector('#textOverlay.show');
  rec(await L.shot(page,'desktop-14-edit-text-modal'), 'Edit text content modal', 'Context menu → Inhalt bearbeiten');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="i_grad"] .thumb', {button:'right'});
  await page.click('#contextMenu .ctx-row:has-text("Inhalt bearbeiten")');
  await page.waitForSelector('#imageEditOverlay.show');
  rec(await L.shot(page,'desktop-15-image-edit-modal'), 'Image edit modal (rotate/flip canvas)', 'Context menu → Inhalt bearbeiten on image');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="t_notes"] .thumb', {button:'right'});
  await page.click('#contextMenu .ctx-row:has-text("Details")');
  rec(await L.shot(page,'desktop-16-inspector'), 'Item details inspector', 'Context menu → Details');
  await page.keyboard.press('Escape');

  await page.keyboard.press('Control+k');
  await page.waitForSelector('#paletteOverlay.show');
  rec(await L.shot(page,'desktop-17-command-palette'), 'Command palette (actions list)', 'Ctrl+K');
  await page.keyboard.type('roadmap');
  rec(await L.shot(page,'desktop-18-palette-search'), 'Command palette full-text search hit in text content', 'Type "roadmap"');
  await page.keyboard.press('Escape');

  await page.click('#helpToggle');
  rec(await L.shot(page,'desktop-19-help-start'), 'Help & Settings center — start panel', 'Click help/settings button');
  await page.click('[data-help-panel="settings"]');
  rec(await L.shot(page,'desktop-21-settings-panel'), 'Help & Settings center — settings panel', 'Settings nav item');
  await page.click('[data-help-panel="notes"]');
  rec(await L.shot(page,'desktop-22-sticky-notes'), 'Help & Settings center — sticky notes', 'Notes nav item');
  await page.click('[data-help-panel="storage"]');
  await page.click('#helpOverlay [data-help-content="storage"] [data-help-action="storage"]');
  rec(await L.shot(page,'desktop-23-storage-over-help'), 'Storage manager stacked above help center (modal stack)', 'Help → Speicher → Öffnen');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');

  await page.click('#favoritesHeaderBtn');
  rec(await L.shot(page,'desktop-24-favorites'), 'Favorites list', 'Header star button');
  await page.keyboard.press('Escape');
  await page.click('#recentHeaderBtn');
  rec(await L.shot(page,'desktop-25-recent'), 'Recently used list', 'Header clock button');
  await page.keyboard.press('Escape');

  for(const id of ['t_notes','i_grad','f_pdf']){
    await page.hover(`#grid .card[data-id="${id}"] .thumb`);
    await page.click(`#grid .card[data-id="${id}"] .card-select`);
  }
  rec(await L.shot(page,'desktop-26-multi-select-bar'), 'Multi-selection with floating selection bar', 'Hover + select boxes on 3 cards');
  await page.click('#selClearBtn');

  await page.click('#grid .card[data-id="t_locked"] .thumb');
  await page.waitForSelector('#pinOverlay.show');
  rec(await L.shot(page,'desktop-27-pin-prompt'), 'PIN prompt for a locked card', 'Click locked card');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="f_pdf"] .btn-del');
  rec(await L.shot(page,'desktop-28-confirm-delete'), 'Destructive confirmation dialog', 'Card delete button');
  await page.keyboard.press('Escape');

  await L.dispatchPaste(page, 'Einkaufsliste: Milch, Brot, Kaffee');
  await page.waitForSelector('#duplicateDetectedOverlay.show');
  rec(await L.shot(page,'desktop-29-duplicate-detected'), 'Duplicate detected on paste (exists in another space)', 'Paste existing text');
  await page.click('#duplicateAddAnywayBtn');
  await page.keyboard.press('Control+k'); await page.keyboard.type('Duplikate'); await page.keyboard.press('Enter');
  rec(await L.shot(page,'desktop-30-duplicate-audit'), 'Duplicate audit dialog', 'Palette → Duplikate prüfen');
  await page.keyboard.press('Escape');

  await page.click('#grid .card[data-id="f_folder"] .thumb', {button:'right'});
  await page.click('#contextMenu .ctx-row:has-text("Teilen")');
  rec(await L.shot(page,'desktop-31-share-sheet'), 'Share sheet (no navigator.share in desktop Chromium headless)', 'Folder → Teilen');
  await page.keyboard.press('Escape');

  for(let i=0;i<6;i++) await page.click('#tabAddBtn');
  rec(await L.shot(page,'desktop-32-many-spaces-overflow'), 'Many spaces: tab overflow controls', 'Add 6 spaces');
  await page.click('#tabOverflowBtn');
  rec(await L.shot(page,'desktop-33-spaces-dropdown'), 'Spaces overflow dropdown', 'Overflow button');
  await context.close();
}
{ // signed-in cloud dashboard — mock backend only
  const backend = L.createCloudBackend();
  const {page, context} = await L.openApp({storage:L.seededStorage(state), cloud:{backend, user:{id:'00000000-0000-4000-8000-000000000001', email:'audit-user@example.invalid'}}});
  await page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced', null, {timeout:8000});
  await page.click('#cloudToggle');
  rec(await L.shot(page,'desktop-34-cloud-dashboard-mock'), 'Cloud dashboard signed in (IN-MEMORY MOCK backend, not Supabase)', 'Mocked session + click account button');
  await context.close();
}
// ---------- Mobile 390x844 (touch emulation) ----------
const mobile = {viewport:{width:390, height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'};
{
  const {page, context} = await L.openApp({...mobile});
  rec(await L.shot(page,'mobile-01-empty-board'), 'Mobile empty board', 'Fresh profile, 390x844 touch');
  await context.close();
}
{
  const {page, context} = await L.openApp({...mobile, storage:L.seededStorage(state)});
  rec(await L.shot(page,'mobile-02-populated-grid'), 'Mobile populated grid (above the fold)', 'Seeded board');
  rec(await L.shot(page,'mobile-03-populated-full-page', {fullPage:true}), 'Mobile populated grid (full page)', 'Full-page capture');
  await page.click('#viewListBtn');
  rec(await L.shot(page,'mobile-04-list-view'), 'Mobile list view', 'Tap list toggle');
  await page.click('#viewGridBtn');
  await page.click('#grid .card[data-id="f_folder"] .thumb'); // touch tap closes immediately (ghost click, see I-M01)
  await page.waitForSelector('#folderOverlay.show');
  rec(await L.shot(page,'mobile-05-folder-open'), 'Mobile folder overlay', 'Opened via synthetic mouse click (a touch tap opens and immediately closes it, see I-M01)');
  await page.click('#folderCloseBtn');
  await page.click('#grid .card[data-id="t_notes"] .thumb');
  await page.waitForSelector('#previewOverlay.show');
  rec(await L.shot(page,'mobile-06-preview'), 'Mobile text preview', 'Tap text card');
  await page.click('#previewCloseBtn');
  await page.click('#helpToggle');
  rec(await L.shot(page,'mobile-07-help'), 'Mobile help & settings', 'Tap help');
  await page.click('[data-help-panel="settings"]');
  rec(await L.shot(page,'mobile-08-settings'), 'Mobile settings panel', 'Settings nav');
  await page.click('#helpCloseBtn');
  await page.click('#cloudToggle');
  rec(await L.shot(page,'mobile-09-cloud-dialog'), 'Mobile cloud dialog (library unavailable in sandbox)', 'Tap account');
  await page.click('#cloudCloseBtn');
  await page.click('#searchOpenBtn');
  rec(await L.shot(page,'mobile-10-command-palette'), 'Mobile command palette', 'Tap search');
  await page.keyboard.press('Escape');
  await page.click('#grid .card[data-id="t_notes"] .thumb', {button:'right'});
  rec(await L.shot(page,'mobile-11-context-menu-via-right-click'), 'Mobile context menu (opened via synthetic right-click; long-press on real devices NOT VERIFIED)', 'Synthetic contextmenu');
  await context.close();
}
// ---------- Tablet 820x1180 ----------
{
  const {page, context} = await L.openApp({viewport:{width:820, height:1180}, hasTouch:true, isMobile:true, storage:L.seededStorage(state)});
  rec(await L.shot(page,'tablet-01-populated-grid'), 'Tablet portrait populated grid', 'Seeded board, 820x1180');
  await context.close();
}
await L.close();
fs.writeFileSync(path.join(L.AUDIT_DIR,'evidence','screenshot-index.json'), JSON.stringify(index,null,2));
console.log('done', index.length);
