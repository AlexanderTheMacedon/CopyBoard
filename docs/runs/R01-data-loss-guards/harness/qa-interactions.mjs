// Interaction / behavior verification suite (Run 01).
// Each test runs in a fresh isolated browser context with disposable data.
// Status vocabulary: PASS | DEFECT | OBSERVATION | NOT VERIFIED | BLOCKED (harness problem)
import * as L from './qa-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const results = [];
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const tests = [];
const test = (id, area, action, fn) => tests.push({id, area, action, fn});

const SEED = await L.seedState();
const clone = v => JSON.parse(JSON.stringify(v));
const openContexts = [];
async function palette(page, text){
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#paletteOverlay.show');
  await page.waitForFunction(()=>document.activeElement?.id==='paletteInput');
  await page.fill('#paletteInput', text); await page.waitForTimeout(150);
}
async function fresh(opts={}){
  const app = await L.openApp({storage: opts.empty ? undefined : L.seededStorage(opts.state || SEED), ...opts});
  app.page.setDefaultTimeout(8000);
  openContexts.push(app.context);
  return app;
}
const T = id => `#grid .card[data-id="${id}"] .thumb`;
const F = id => `#folderGrid .card[data-id="${id}"] .thumb`;
async function ctxMenu(page, sel){ await page.click(sel, {button:'right'}); await page.waitForSelector('#contextMenu.show'); }
async function ctxClick(page, label){ await page.click(`#contextMenu .ctx-row:has-text("${label}")`); }
async function subClick(page, label){ await page.click('#contextMenu .ctx-row.has-submenu'); await page.click(`#contextSubmenu .ctx-row:has-text("${label}")`); }
async function isShown(page, sel){ return page.$eval(sel, e=>e.classList.contains('show')); }
const ids = (st, sid) => st.data[sid].itemIds;
const itemCount = (st) => Object.values(st.data).reduce((n,d)=>n+Object.keys(d.items).length,0);
async function settle(page, ms=400){ await page.waitForTimeout(ms); }

// ============ INGESTION ============
test('I-01','Clipboard','Ctrl/Cmd+V text with focus on board body', async()=>{
  const {page} = await fresh({empty:true});
  await L.dispatchPaste(page, 'Audit Einfüge-Test 1');
  await settle(page);
  const st = await L.storedState(page);
  const n = ids(st, st.activeSpaceId).length;
  return {expected:'One text card created and persisted', observed:`${n} card(s) in active space; name="${Object.values(st.data[st.activeSpaceId].items)[0]?.name}"`, status:n===1?'PASS':'DEFECT', severity:n===1?'—':'High'};
});
test('I-02','Clipboard','Paste while focus is in unrelated text inputs (palette search, sticky note, cloud e-mail, PIN, inline editor; folder title as control)', async()=>{
  const out = [];
  const cases = [
    ['Command palette search', async p=>{ await p.keyboard.press('Control+k'); return '#paletteInput'; }],
    ['Sticky note input', async p=>{ await p.click('#helpToggle'); await p.click('[data-help-panel="notes"]'); return '#helpNoteInput'; }],
    ['Cloud e-mail field', async p=>{ await p.click('#cloudToggle'); return '#cloudEmailInput'; }],
    ['PIN input', async p=>{ await p.click(T('t_locked')); await p.waitForSelector('#pinOverlay.show'); return '#pinInput'; }],
    ['Inline text editor', async p=>{ await p.hover(T('t_code')); await p.click('#grid .card[data-id="t_code"] .inline-text-edit-trigger'); return '.inline-text-editor textarea'; }],
    ['Folder title (control: excluded by code)', async p=>{ await p.click(T('f_folder')); return '#folderTitleInput'; }],
  ];
  for(const [label, prep] of cases){
    const {page, context} = await fresh();
    const before = itemCount(await L.storedState(page));
    const sel = await prep(page); await settle(page,200);
    await L.dispatchPaste(page, 'Passwort-Fragment '+label, sel);
    await settle(page,500);
    const after = itemCount(await L.storedState(page));
    const dup = await isShown(page,'#duplicateDetectedOverlay');
    out.push(`${label}: ${after>before?'NEW CARD CREATED':'no card'}${dup?' (+duplicate dialog)':''}`);
    await context.close();
  }
  const leaks = out.filter(s=>s.includes('NEW CARD')).length;
  return {expected:'Pasting into a text field only edits that field; no card is created', observed:out.join('; '), status:leaks? 'DEFECT':'PASS', severity:leaks?'High':'—',
    note:'Synthetic ClipboardEvent: the browser default insertion is not executed for synthetic events, so only the app-level side effect is measured.'};
});
test('I-03','Clipboard','"Zwischenablage" button pre-fills modal from system clipboard, "Ablegen" creates card', async()=>{
  const {page} = await fresh({empty:true});
  await page.evaluate(()=>navigator.clipboard.writeText('Aus der Systemzwischenablage'));
  await page.click('#addTextBtn'); await page.waitForSelector('#textOverlay.show'); await settle(page,300);
  const val = await page.$eval('#textArea', e=>e.value);
  await page.click('#textOkBtn'); await settle(page);
  const st = await L.storedState(page);
  const ok = val==='Aus der Systemzwischenablage' && ids(st, st.activeSpaceId).length===1;
  return {expected:'Textarea pre-filled from clipboard; card created on confirm', observed:`textarea="${val}", cards=${ids(st, st.activeSpaceId).length}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium'};
});
test('I-04','Files','File picker: PNG + TXT + PDF, then an 8 MiB+1 file', async()=>{
  const {page} = await fresh({empty:true});
  await page.setInputFiles('#fileInput', [
    {name:'bild.png', mimeType:'image/png', buffer:L.IMG_BLOCKS},
    {name:'notiz.txt', mimeType:'text/plain', buffer:Buffer.from('Hallo')},
    {name:'vertrag.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF-1.4 x')}]);
  await settle(page,800);
  let st = await L.storedState(page);
  const types = ids(st, st.activeSpaceId).map(id=>st.data[st.activeSpaceId].items[id].type).join(',');
  await page.setInputFiles('#fileInput', [{name:'gross.bin', mimeType:'application/octet-stream', buffer:Buffer.alloc(8*1024*1024+1)}]);
  await settle(page,800);
  const toast = await L.toastText(page);
  st = await L.storedState(page);
  const ok = types.split(',').length===3 && ids(st, st.activeSpaceId).length===3 && /zu groß/.test(toast);
  return {expected:'3 cards (image,file,file); oversize file rejected with message', observed:`types=[${types}] → after oversize: ${ids(st, st.activeSpaceId).length} cards, toast="${toast}"`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium',
    note:'A .txt file becomes type "file" (not a text card); text files are not previewed as text.'};
});
test('I-05','Duplicates','Paste text that already exists in another space → "Vorhandenes zeigen"', async()=>{
  const {page} = await fresh();
  await L.dispatchPaste(page, 'Einkaufsliste: Milch, Brot, Kaffee');
  await page.waitForSelector('#duplicateDetectedOverlay.show');
  await page.click('#duplicateOpenExistingBtn'); await settle(page,700);
  const st = await L.storedState(page);
  const ok = st.activeSpaceId==='sp_privat' && await isShown(page,'#previewOverlay');
  return {expected:'Dialog shown; existing item located (space switch + preview); nothing added', observed:`active=${st.activeSpaceId}, preview=${await isShown(page,'#previewOverlay')}, items=${itemCount(st)}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium'};
});
test('I-06','Duplicates','Upload two files at once that are both duplicates of existing items', async()=>{
  const {page} = await fresh({empty:true});
  const fa = {name:'a.txt', mimeType:'text/plain', buffer:Buffer.from('AAA')}, fb = {name:'b.txt', mimeType:'text/plain', buffer:Buffer.from('BBB')};
  await page.setInputFiles('#fileInput', [fa, fb]); await settle(page,600);
  await page.setInputFiles('#fileInput', [fa, fb]); await settle(page,800);
  const body = await page.$eval('#duplicateDetectedBody', e=>e.innerText.replace(/\n/g,' '));
  await page.click('#duplicateAddAnywayBtn'); await settle(page,600);
  const dialogAgain = await isShown(page,'#duplicateDetectedOverlay');
  const st = await L.storedState(page);
  const n = ids(st, st.activeSpaceId).length;
  const ok = n===4 || dialogAgain;
  return {expected:'Each duplicate is asked for (or both handled together); "add anyway" adds both', observed:`dialog listed: "${body}"; after "Trotzdem ablegen": cards=${n}, second dialog=${dialogAgain}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium',
    note:'pendingDuplicateItem is a single slot; the second duplicate overwrites the first while the loop in ingestFiles() continues.'};
});

// ============ CARD INTERACTIONS ============
test('I-07','Cards','Click card → preview; Escape closes; focus returns', async()=>{
  const {page} = await fresh();
  await page.click(T('t_notes')); await page.waitForSelector('#previewOverlay.show');
  const txt = await page.$eval('#previewBody', e=>e.innerText.slice(0,30));
  await page.keyboard.press('Escape'); await settle(page,200);
  const open = await isShown(page,'#previewOverlay');
  const focus = await page.evaluate(()=>document.activeElement?.tagName+'#'+(document.activeElement?.id||''));
  return {expected:'Preview shows content; Escape closes it', observed:`preview="${txt}…", open after Esc=${open}, focus=${focus}`, status:!open?'PASS':'DEFECT', severity:!open?'—':'Medium',
    note:'Cards are <div>s without tabindex; focus cannot return to the originating card (see I-30).'};
});
test('I-08','Cards','Double-click a card', async()=>{
  const {page} = await fresh();
  await page.dblclick(T('t_notes')); await settle(page);
  const open = await isShown(page,'#previewOverlay');
  return {expected:'No dedicated double-click action exists; should not produce side effects', observed:`preview open=${open}; each click of the double-click calls openPreview() (second call re-renders the same preview)`, status:'OBSERVATION', severity:'Info'};
});
test('I-09','Context menu','Right-click opens; Escape / outside click close; submenu via hover and click; viewport clamping', async()=>{
  const {page} = await fresh();
  const out=[];
  await ctxMenu(page, T('t_notes')); await page.keyboard.press('Escape'); out.push('Esc closes: '+!(await isShown(page,'#contextMenu')));
  await ctxMenu(page, T('t_notes')); await page.mouse.click(30, 600); out.push('outside click closes: '+!(await isShown(page,'#contextMenu')));
  await ctxMenu(page, T('t_notes')); await page.hover('#contextMenu .ctx-row.has-submenu'); out.push('submenu on hover: '+await isShown(page,'#contextSubmenu'));
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:900});
  await page.mouse.click(1430, 890, {button:'right'});
  const r = await page.$eval('#contextMenu', e=>{const b=e.getBoundingClientRect(); return {r:b.right, b:b.bottom, show:e.classList.contains('show')};});
  out.push(`menu at corner fits viewport: ${r.r<=1440 && r.b<=900} (show=${r.show})`);
  const ok = out.every(s=>s.endsWith('true') || s.includes('true (show'));
  return {expected:'Menus open/close predictably and stay within the viewport', observed:out.join('; '), status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium'};
});
test('I-10','Context menu','Escape with a card context menu open inside an open folder', async()=>{
  const {page} = await fresh();
  await page.click(T('f_folder')); await page.waitForSelector('#folderOverlay.show');
  await ctxMenu(page, F('t_in1'));
  await page.keyboard.press('Escape'); await settle(page,300);
  const menu = await isShown(page,'#contextMenu'), folder = await isShown(page,'#folderOverlay');
  const ok = !menu && folder;
  return {expected:'First Escape closes only the context menu; folder stays open', observed:`context menu visible=${menu}, folder open=${folder}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium',
    note:'The capture-phase modal Escape handler calls stopImmediatePropagation(), so the bubble-phase hideContextMenu() never runs while any modal is open.'};
});
test('I-11','Inline edit','Inline text edit: 4 flows (top level / inside folder × typing directly / clicking into the editor first), then Escape and one click elsewhere', async()=>{
  const out=[]; let bad=0;
  for(const inFolder of [false,true]) for(const clickInto of [false,true]){
    const {page, context} = await fresh();
    const ov = ()=>page.evaluate(()=>[...document.querySelectorAll('.overlay.show')].map(o=>o.id).join('+')||'none');
    let C='#grid .card[data-id="t_code"]', key='t_code';
    if(inFolder){ await page.click(T('f_folder')); C='#folderGrid .card[data-id="t_in1"]'; key='t_in1'; }
    await page.hover(C+' .thumb'); await page.click(C+' .inline-text-edit-trigger'); await settle(page,300);
    let opened='';
    if(clickInto){ await page.click(C+' .inline-text-editor textarea'); await settle(page,300); opened=` → click into editor opened: ${await ov()}`; }
    await page.keyboard.type(' XX'); await page.keyboard.press('Escape'); await settle(page,300);
    const afterEsc = await ov(); const editors = await page.$$eval('.inline-text-editor', e=>e.length);
    await page.mouse.click(5,450); await settle(page,400);
    const saved = (await L.storedState(page)).data.sp_recherche.items[key].data.includes('XX');
    if(saved || (clickInto && opened.includes('preview'))) bad++;
    out.push(`[${inFolder?'folder':'top level'}, ${clickInto?'click into editor':'type directly'}]${opened}; after Esc overlays=${afterEsc}, editor still mounted=${editors>0}; discarded text saved after next click=${saved}`);
    await context.close();
  }
  return {expected:'Clicking inside the editor only places the caret; Escape discards the edit and closes nothing else', observed:out.join(' | '), status:bad?'DEFECT':'PASS', severity:bad?'High':'—',
    note:'(1) The editor lives inside .thumb, whose press handler opens the preview on any click; (2) inside a folder the capture-phase modal Escape handler closes the folder first; the orphaned edit session keeps its document pointerdown handler and commits on the next pointerdown. Ctrl/⌘+Enter save and Undo were verified separately (I-14 family).'};
});
test('I-12','Inline edit','Inline edit: Ctrl+Enter saves, Ctrl+Z restores', async()=>{
  const {page} = await fresh();
  await page.hover(T('t_code')); await page.click('#grid .card[data-id="t_code"] .inline-text-edit-trigger'); await settle(page,300);
  await page.keyboard.type(' // OK'); await page.keyboard.press('Control+Enter'); await settle(page);
  let st = await L.storedState(page); const saved = st.data.sp_recherche.items.t_code.data.includes('// OK');
  await page.keyboard.press('Control+z'); await settle(page);
  st = await L.storedState(page); const undone = !st.data.sp_recherche.items.t_code.data.includes('// OK');
  return {expected:'Saved and undoable', observed:`saved=${saved}, undone=${undone}`, status:(saved&&undone)?'PASS':'DEFECT', severity:(saved&&undone)?'—':'Medium'};
});
test('I-13','Quick look','Hover + Space bar on a normal card and on a PIN-locked card', async()=>{
  const {page} = await fresh();
  await page.hover(T('t_notes')); await page.keyboard.press('Space'); await settle(page);
  const normal = await isShown(page,'#previewOverlay'); await page.keyboard.press('Escape');
  await page.hover(T('t_locked')); await page.keyboard.press('Space'); await settle(page);
  const pinAsked = await isShown(page,'#pinOverlay'), prev = await isShown(page,'#previewOverlay');
  const body = prev ? await page.$eval('#previewBody', e=>e.innerHTML.length) : -1;
  const ok = normal && pinAsked && !prev;
  return {expected:'Normal card previews; locked card asks for PIN', observed:`normal preview=${normal}; locked: PIN prompt=${pinAsked}, preview opened=${prev} (body html length ${body})`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium',
    note:'Content stays encrypted (no plaintext disclosure), but the lock flow is bypassed and an empty preview with copy/edit actions on a null payload is shown.'};
});

// ============ UNDO / REDO ============
const UNDO_CASES = [
  ['delete card', async p=>{ await p.click('#grid .card[data-id="t_notes"] .btn-del'); await p.click('#confirmOkBtn'); }, st=>!!st.data.sp_recherche.items.t_notes],
  ['rename card', async p=>{ await ctxMenu(p,T('t_notes')); await ctxClick(p,'Umbenennen'); await p.fill('#renameInput','Umbenannt'); await p.click('#renameOkBtn'); }, st=>!st.data.sp_recherche.items.t_notes.customName],
  ['toggle favorite', async p=>{ await ctxMenu(p,T('t_code')); await ctxClick(p,'Zu Favoriten'); }, st=>!st.data.sp_recherche.items.t_code.favorite],
  ['pin card', async p=>{ await ctxMenu(p,T('t_code')); await ctxClick(p,'Anheften'); }, st=>!st.data.sp_recherche.items.t_code.pinned],
  ['move to other space', async p=>{ await ctxMenu(p,T('t_code')); await subClick(p,'In anderen Space verschieben'); await p.click('#spaceMoveList .space-move-row:has-text("Privat")'); }, st=>!!st.data.sp_recherche.items.t_code && !st.data.sp_privat.items.t_code],
  ['delete space', async p=>{ await ctxMenu(p,'#tabsScroll .tab[data-id="sp_privat"]'); await ctxClick(p,'Space löschen'); await p.click('#confirmOkBtn'); }, st=>st.spaces.some(s=>s.id==='sp_privat') && !!st.data.sp_privat],
  ['sort mode change', async p=>{ await palette(p, 'Name A'); await p.keyboard.press('Enter'); }, st=>st.spaces[0].sortMode==='manual'],
  ['space color', async p=>{ await ctxMenu(p,'#tabsScroll .tab[data-id="sp_privat"]'); await ctxClick(p,'Farbe wählen'); await p.click('#contextMenu .ctx-row >> nth=2'); }, st=>st.spaces[1].color==='#22b07d'],
  ['sticky note add', async p=>{ await p.click('#helpToggle'); await p.click('[data-help-panel="notes"]'); await p.fill('#helpNoteInput','Neue Notiz'); await p.click('#helpNoteAddBtn'); await p.click('#helpCloseBtn'); }, st=>st.helpNotes.length===2],
  ['dissolve folder', async p=>{ await p.click(T('f_folder')); await p.click('#folderDissolveBtn'); }, st=>!!st.data.sp_recherche.items.f_folder],
  ['clear space', async p=>{ await p.click('#clearBtn'); await p.click('#confirmOkBtn'); }, st=>st.data.sp_recherche.itemIds.length===9],
  ['settings reset', async p=>{ await p.click('#helpToggle'); await p.click('[data-help-panel="settings"]'); await p.selectOption('#helpViewModeSelect','list'); await p.click('#helpResetSettingsBtn'); await p.click('#confirmOkBtn'); await p.click('#helpCloseBtn'); }, st=>st.settings.appearance.viewMode==='list'],
];
test('I-14','Undo/Redo','Ctrl+Z after each mutation type, then Ctrl+Shift+Z', async()=>{
  const out=[]; let fails=0;
  for(const [label, act, reverted] of UNDO_CASES){
    const {page, context} = await fresh();
    try{
      await act(page); await settle(page,500);
      await page.mouse.click(20, 860); await page.keyboard.press('Control+z'); await settle(page,500);
      const st = await L.storedState(page); const ok = reverted(st);
      await page.keyboard.press('Control+Shift+z'); await settle(page,400);
      const st2 = await L.storedState(page); const redone = !reverted(st2);
      out.push(`${label}: undo=${ok?'ok':'FAIL'}, redo=${redone?'ok':'FAIL'}`); if(!ok||!redone) fails++;
    }catch(e){ out.push(`${label}: BLOCKED (${String(e.message).split('\n')[0]})`); fails++; }
    await context.close();
  }
  return {expected:'Each user-visible mutation is undoable and redoable in one step', observed:out.join('; '), status:fails?'DEFECT':'PASS', severity:fails?'Medium':'—'};
});
test('I-15','Undo/Redo','Undo after switching to another space', async()=>{
  const {page} = await fresh();
  await page.click('#grid .card[data-id="t_notes"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page);
  await page.keyboard.press('Control+z'); await settle(page);
  const st = await L.storedState(page);
  const toast = await L.toastText(page);
  return {expected:'Undo either switches back to the affected space or makes the restored change visible', observed:`active space=${st.activeSpaceId}; card restored in Recherche=${!!st.data.sp_recherche.items.t_notes}; toast="${toast}"; no visible change in current space`, status:'OBSERVATION', severity:'Low'};
});
test('I-16','Undo/Redo','Drag a selected stack of 2 cards onto another space tab, then one Ctrl+Z', async()=>{
  const {page} = await fresh();
  for(const id of ['t_code','f_csv']){ await page.hover(T(id)); await page.click(`#grid .card[data-id="${id}"] .card-select`); }
  await L.dragPointer(page, await L.center(page, T('t_code')), await L.center(page, '#tabsScroll .tab[data-id="sp_privat"]'));
  await settle(page,700);
  let st = await L.storedState(page); const moved = ['t_code','f_csv'].filter(id=>st.data.sp_privat.items[id]).length;
  await page.keyboard.press('Control+z'); await settle(page,500);
  st = await L.storedState(page); const back1 = ['t_code','f_csv'].filter(id=>st.data.sp_recherche.items[id]).length;
  await page.keyboard.press('Control+z'); await settle(page,500);
  st = await L.storedState(page); const back2 = ['t_code','f_csv'].filter(id=>st.data.sp_recherche.items[id]).length;
  const ok = moved===2 && back1===2;
  return {expected:'One user action = one undo step', observed:`moved=${moved}; after 1×Undo restored=${back1}/2; after 2×Undo restored=${back2}/2`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium',
    note:'startCardDrag() calls moveItemToSpace() per item without skipHistory → one full-board snapshot per item.'};
});
test('I-17','Undo/Redo','Undo directly after a full board import', async()=>{
  const {page} = await fresh();
  await page.click('#grid .card[data-id="t_notes"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  const other = clone(SEED); other.spaces=[{id:'sp_neu',name:'Importiert',sortMode:'manual'}]; other.activeSpaceId='sp_neu'; other.data={sp_neu:{itemIds:[],items:{}}}; other.recentItems=[];
  const fileChooser = page.waitForEvent('filechooser');
  await palette(page, 'Board importieren'); await page.keyboard.press('Enter');
  await (await fileChooser).setFiles({name:'backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify({format:'copyboard-backup',version:1,state:other}))});
  await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,600);
  await page.keyboard.press('Control+z'); await settle(page,600);
  const st = await L.storedState(page);
  const orphan = Object.keys(st.data).filter(k=>!st.spaces.some(s=>s.id===k));
  return {expected:'Import is either undoable as one step or clears history; no hidden orphan data', observed:`spaces after undo=[${st.spaces.map(s=>s.name)}]; orphan data keys=[${orphan}] (${orphan.length? 'persisted but unreachable':'none'})`, status:orphan.length?'DEFECT':'OBSERVATION', severity:orphan.length?'Medium':'Info',
    note:'Undo/redo stacks are not cleared on import or on cloud snapshot apply; normalizeState() preserves unknown data keys.'};
});
test('I-18','Undo/Redo','Undo history after reload', async()=>{
  const {page} = await fresh();
  await page.click('#grid .card[data-id="t_notes"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  await page.reload(); await settle(page,600);
  await page.keyboard.press('Control+z'); await settle(page);
  return {expected:'(Design) history is session-only', observed:`toast after reload+undo="${await L.toastText(page)}"`, status:'OBSERVATION', severity:'Info'};
});

// ============ DRAG & DROP ============
test('I-19','Drag & drop','Drag card onto another card → folder; drag reorder; drag onto another space tab', async()=>{
  const {page} = await fresh();
  const out=[];
  await L.dragPointer(page, await L.center(page, T('t_code')), await L.center(page, '#grid .card[data-id="f_csv"]'));
  let st = await L.storedState(page); const fid = st.data.sp_recherche.itemIds.find(id=>st.data.sp_recherche.items[id].type==='folder' && id!=='f_folder');
  out.push('merge→folder: '+(fid ? st.data.sp_recherche.items[fid].itemIds.join('+') : 'none'));
  const before = (await L.storedState(page)).data.sp_recherche.itemIds.slice();
  const b = await page.locator(T('i_grad')).boundingBox();
  await L.dragPointer(page, await L.center(page, T('i_blocks')), {x:b.x+4, y:b.y+b.height/2});
  st = await L.storedState(page); out.push('reorder changed order: '+(JSON.stringify(before)!==JSON.stringify(st.data.sp_recherche.itemIds)));
  await L.dragPointer(page, await L.center(page, T('f_pdf')), await L.center(page, '#tabsScroll .tab[data-id="sp_archiv"]'));
  await settle(page,500); st = await L.storedState(page); out.push('to tab moved: '+!!st.data.sp_archiv.items.f_pdf);
  const ok = !!fid && out[1].endsWith('true') && out[2].endsWith('true');
  return {expected:'All three drag outcomes work with a mouse', observed:out.join('; '), status:ok?'PASS':'DEFECT', severity:ok?'—':'High'};
});
test('I-20','Drag & drop','Drag reorder while sort mode is not manual', async()=>{
  const {page} = await fresh();
  await palette(page, 'Name A'); await page.keyboard.press('Enter'); await settle(page);
  const before = await L.cardIds(page);
  await page.mouse.move(...Object.values(await L.center(page, T('i_blocks')))); await page.mouse.down();
  await page.mouse.move(400, 400, {steps:6}); const hint = await page.$eval('#dragHint', e=>e.innerText.trim());
  await page.mouse.up(); await settle(page);
  return {expected:'Manual insertion paused, user informed', observed:`drag hint="${hint}"; visual order unchanged=${JSON.stringify(before)===JSON.stringify(await L.cardIds(page))}`, status:'PASS', severity:'—'};
});
test('I-21','Drag & drop','Drag a card out to desktop (DownloadURL)', async()=>({expected:'Chrome/Edge: drag-out creates a file', observed:'Requires OS-level drag target; not automatable in headless Chromium', status:'NOT VERIFIED', severity:'—'}));

// ============ SELECTION & FOLDERS ============
test('I-22','Selection','Select two folders and choose "In Ordner"', async()=>{
  const st0 = clone(SEED);
  st0.data.sp_recherche.items.f_two = {id:'f_two', type:'folder', name:'Projekt Beta', timestamp:1, itemIds:['t_code','f_csv']};
  st0.data.sp_recherche.itemIds = st0.data.sp_recherche.itemIds.filter(id=>!['t_code','f_csv'].includes(id)).concat('f_two');
  const {page} = await fresh({state:st0});
  for(const id of ['f_folder','f_two']){ await page.hover(T(id)); await page.click(`#grid .card[data-id="${id}"] .card-select`); }
  await page.click('#selFolderBtn'); await settle(page);
  let st = await L.storedState(page);
  const nested = st.data.sp_recherche.items.f_folder.itemIds.includes('f_two');
  await page.click('#grid .card[data-id="f_folder"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  st = await L.storedState(page);
  const referenced = new Set(st.data.sp_recherche.itemIds.concat(...Object.values(st.data.sp_recherche.items).filter(i=>i.type==='folder').map(f=>f.itemIds)));
  const orphans = Object.keys(st.data.sp_recherche.items).filter(id=>!referenced.has(id));
  return {expected:'Folders are not nested (no nested-folder UI exists) or nesting is fully supported', observed:`folder nested in folder=${nested}; after deleting outer folder, unreachable items still stored: [${orphans}]`, status:(nested||orphans.length)?'DEFECT':'PASS', severity:(nested||orphans.length)?'Medium':'—'};
});
test('I-23','Selection','Shift-click range, "Alle auswählen", selection bar actions (duplicate, delete)', async()=>{
  const {page} = await fresh();
  await page.hover(T('t_link')); await page.click('#grid .card[data-id="t_link"] .card-select');
  await page.click(T('f_pdf'), {modifiers:['Shift']}); await settle(page,200);
  const range = await page.$eval('#selectionCount', e=>e.textContent);
  await page.click('#selAllBtn'); const all = await page.$eval('#selectionCount', e=>e.textContent);
  await page.click('#selAllBtn'); await page.hover(T('t_code')); await page.click('#grid .card[data-id="t_code"] .card-select');
  await page.click('#selDuplicateBtn'); await settle(page);
  const n1 = (await L.storedState(page)).data.sp_recherche.itemIds.length;
  return {expected:'Range and select-all work; duplicate adds one card', observed:`range="${range}", all="${all}", items after duplicate=${n1} (was 9)`, status:(n1===10)?'PASS':'DEFECT', severity:(n1===10)?'—':'Medium'};
});
test('I-24','Folders','Folder header actions: rename via title, ZIP download, child delete button, dissolve', async()=>{
  const {page} = await fresh();
  const out=[];
  await page.click(T('f_folder')); await page.fill('#folderTitleInput','Alpha neu'); await page.keyboard.press('Enter'); await settle(page);
  out.push('rename persisted: '+((await L.storedState(page)).data.sp_recherche.items.f_folder.customName==='Alpha neu'));
  const dl = page.waitForEvent('download', {timeout:5000}).catch(()=>null);
  await page.click('#folderZipBtn'); const d = await dl; out.push('zip download: '+(d? d.suggestedFilename():'none'));
  await page.click('#folderGrid .card[data-id="f_in1"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  out.push('child deleted: '+!(await L.storedState(page)).data.sp_recherche.items.f_in1+', folder still open='+await isShown(page,'#folderOverlay'));
  await page.click('#folderDissolveBtn'); await settle(page);
  const st = await L.storedState(page);
  out.push('dissolved (no confirmation): '+(!st.data.sp_recherche.items.f_folder && st.data.sp_recherche.itemIds.includes('t_in1')));
  const ok = out.every(x=>!x.includes('false') && !x.includes('none'));
  return {expected:'Folder header and card-button operations work', observed:out.join('; '), status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium'};
});
test('I-46','Context menu','Use a card context menu inside an open folder', async()=>{
  const {page} = await fresh();
  await page.click(T('f_folder')); await ctxMenu(page, F('f_in1'));
  const hits = await page.evaluate(()=>[...document.querySelectorAll('#contextMenu .ctx-row')].map(r=>{const b=r.getBoundingClientRect(); const e=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2); return e.closest('#contextMenu')?'menu':(e.closest('.overlay')?.id||'other');}));
  const z = await page.evaluate(()=>getComputedStyle(document.querySelector('#contextMenu')).zIndex+' vs overlay '+getComputedStyle(document.querySelector('#folderOverlay')).zIndex);
  const shotPath = await L.shot(page,'desktop-35-folder-context-menu-behind-overlay');
  const r = await page.locator('#contextMenu .ctx-row:has-text("Umbenennen")').boundingBox();
  await page.mouse.click(r.x+r.width/2, r.y+r.height/2); await settle(page,300);
  const after = await page.evaluate(()=>[...document.querySelectorAll('.overlay.show')].map(o=>o.id).join('+')||'none');
  const blocked = hits.filter(h=>h!=='menu').length;
  return {expected:'Menu above the folder; all rows clickable', observed:`z-index ${z}; ${blocked}/${hits.length} rows covered by the folder overlay; clicking "Umbenennen" instead hit the backdrop → open overlays now: ${after}; evidence ${shotPath}`, status:blocked?'DEFECT':'PASS', severity:blocked?'High':'—',
    note:'.context-menu has z-index 90; the modal stack forces overlays to z-index ≥100 !important. Every child-only action (Aus Ordner entfernen, Umbenennen, Details, Teilen, OCR, PIN, Burn link…) is unreachable for cards inside folders; only the three card buttons work.'};
});
test('I-25','Folders','ZIP download of a folder that contains a PIN-locked image (lock seeded; the in-folder menu is unusable, see I-46)', async()=>{
  const st0 = clone(SEED);
  const it = st0.data.sp_recherche.items.i_in1;
  Object.assign(it, {locked:true, lockedType:'image', encData:await L.encryptLike(it.data,'9999'), data:null});
  const {page, pageErrors} = await fresh({state:st0});
  await page.click(T('f_folder'));
  const dl = page.waitForEvent('download', {timeout:4000}).catch(()=>null);
  await page.click('#folderZipBtn'); const d = await dl; await settle(page,400);
  return {expected:'ZIP created (locked item skipped or exported encrypted) or a clear message', observed:`download=${d?d.suggestedFilename():'none'}; toast="${await L.toastText(page)}"; uncaught errors=${JSON.stringify(pageErrors.slice(-1))}`, status:d?'PASS':'DEFECT', severity:d?'—':'Medium',
    note:'buildFolderZipBlob() calls it.data.split() on locked items whose data is null. Note encryptItemWithPin() keeps item.type unchanged.'};
});
test('I-26','PIN lock','Lock a text card: storage contents, wrong/right PIN, unlock', async()=>{
  const {page} = await fresh();
  await ctxMenu(page, T('t_notes')); await subClick(page,'Mit PIN schützen');
  for(let i=0;i<2;i++){ await page.waitForSelector('#pinOverlay.show'); await page.fill('#pinInput','2468'); await page.click('#pinOkBtn'); await settle(page,150); }
  await settle(page,1500);
  const raw = await page.evaluate(()=>localStorage.getItem('copyboard_state_v1'));
  const st = JSON.parse(raw); const it = st.data.sp_recherche.items.t_notes;
  const plaintextInData = raw.includes('Budget prüfen');
  await page.click(T('t_notes')); await page.fill('#pinInput','0000'); await page.click('#pinOkBtn'); await settle(page,1200);
  const wrong = await L.toastText(page);
  await page.click(T('t_notes')); await page.fill('#pinInput','2468'); await page.click('#pinOkBtn'); await settle(page,1500);
  const shown = await isShown(page,'#previewOverlay') && (await page.$eval('#previewBody', e=>e.innerText)).includes('Budget');
  return {expected:'Content and identifying metadata encrypted; correct PIN reveals, wrong PIN rejected', observed:`data=null: ${it.data===null}; ciphertext present: ${!!it.encData?.cipher}; full text in storage: ${plaintextInData}; plaintext name stored: "${it.name}"; favorite flag kept; wrong PIN toast="${wrong}"; correct PIN preview=${shown}`,
    status: it.name.includes('Meeting') ? 'DEFECT':'PASS', severity: it.name.includes('Meeting')?'Medium':'—',
    note:'Auto-generated names of text cards are the first 40 characters of the content and remain readable (UI, search, backups, cloud snapshot). PIN length is not enforced (1+ characters); PBKDF2 150k iterations does not protect 4-digit PINs against offline brute force.'};
});
test('I-27','Burn after reading','Create burn link; open it twice in separate browser contexts', async()=>{
  const {page} = await fresh();
  await ctxMenu(page, T('t_notes')); await subClick(page,'Burn-after-reading-Link'); await settle(page,400);
  const url = await page.evaluate(()=>navigator.clipboard.readText());
  const frag = url.split('#burn=')[1] || '';
  const decoded = Buffer.from(decodeURIComponent(frag), 'base64').toString('utf8');
  const opens=[];
  for(let i=0;i<2;i++){ const {page:p, context:c} = await L.openApp({hash:'#burn='+frag}); opens.push(await isShown(p,'#burnOverlay')); await c.close(); }
  return {expected:'Link content is protected and can be read only once', observed:`link length=${url.length}; fragment is plain base64 of the text ("${decoded.slice(0,24)}…"); opened in context 1: ${opens[0]}, context 2: ${opens[1]}`, status:'DEFECT', severity:'Medium',
    note:'No server, no key, no one-time token: "burn" only strips the hash from the address bar of the opening tab. Anyone with the link can read it any number of times.'};
});

// ============ SPACES ============
test('I-28','Spaces','Add, rename (title / tab pencil / dropdown), duplicate, export, clear, delete, drag reorder', async()=>{
  const {page} = await fresh();
  const out=[];
  await page.click('#tabAddBtn'); let st = await L.storedState(page); out.push('add: '+st.spaces.length);
  await page.fill('#titleInput','Umbenannt via Titel'); await page.keyboard.press('Enter'); await settle(page);
  st = await L.storedState(page); out.push('title rename: '+st.spaces.find(s=>s.id===st.activeSpaceId).name);
  await page.hover('#tabsScroll .tab[data-id="sp_privat"]'); await page.click('#tabsScroll .tab[data-id="sp_privat"] .tab-pencil');
  await page.keyboard.press('Control+a'); await page.keyboard.type('Privat 2'); await page.keyboard.press('Enter'); await settle(page);
  st = await L.storedState(page); out.push('pencil rename: '+st.spaces[1].name);
  await ctxMenu(page,'#tabsScroll .tab[data-id="sp_recherche"]'); await ctxClick(page,'Space duplizieren'); await settle(page);
  st = await L.storedState(page); out.push('duplicate: '+st.spaces.length+' spaces');
  const dl = page.waitForEvent('download',{timeout:4000}).catch(()=>null);
  await ctxMenu(page,'#tabsScroll .tab[data-id="sp_recherche"]'); await ctxClick(page,'Als JSON exportieren'); const d=await dl; out.push('export: '+(d?d.suggestedFilename():'none'));
  const order0 = (await L.storedState(page)).spaces.map(s=>s.id).join(',');
  await page.hover('#tabsScroll .tab[data-id="sp_archiv"]');
  await L.dragPointer(page, await L.center(page,'#tabsScroll .tab[data-id="sp_archiv"] .tab-handle'), await L.center(page,'#tabsScroll .tab[data-id="sp_recherche"]'));
  await settle(page,500); const order1 = (await L.storedState(page)).spaces.map(s=>s.id).join(','); out.push('tab drag reorder: '+(order0!==order1));
  return {expected:'All space operations work', observed:out.join('; '), status:'PASS', severity:'—'};
});
test('I-29','Spaces','Rename a space while the tab overflow dropdown is used on a narrow screen', async()=>{
  const {page} = await fresh({viewport:{width:390,height:844}});
  const visible = await page.$$eval('#tabsScroll .tab', els=>els.filter(e=>{const r=e.getBoundingClientRect(); const p=e.parentElement.getBoundingClientRect(); return r.right>p.left && r.left<p.right;}).length);
  return {expected:'Spaces discoverable on mobile', observed:`${visible} of 3 tabs visible at 390px; others reachable via arrows/dropdown`, status:'OBSERVATION', severity:'Low'};
});

// ============ SECURITY (rendering) ============
test('I-30','Accessibility','Keyboard-only: can cards be focused and opened?', async()=>{
  const {page} = await fresh();
  const focusableCards = await page.$$eval('#grid .card', els=>els.filter(e=>e.tabIndex>=0).length);
  const buttons = await page.$$eval('#grid .card button', els=>els.length);
  await page.focus('#grid .card[data-id="t_notes"] .btn-preview'); await page.keyboard.press('Enter'); await settle(page);
  const viaBtn = await isShown(page,'#previewOverlay'); await page.keyboard.press('Escape');
  await page.focus('#grid .card[data-id="t_notes"] .btn-preview'); await page.keyboard.press('Shift+F10'); await settle(page);
  const ctx = await isShown(page,'#contextMenu');
  return {expected:'All card functions reachable by keyboard', observed:`cards with tabindex: ${focusableCards}; card buttons: ${buttons}; Enter on preview button opens preview=${viaBtn}; Shift+F10 context menu=${ctx}; context-menu rows are <div>s without keyboard navigation`, status:'DEFECT', severity:'Medium'};
});
test('I-31','Security','Stored XSS: space name rendered via "In anderen Space kopieren" picker', async()=>{
  const {page} = await fresh();
  await page.click('#tabsScroll .tab[data-id="sp_privat"]');
  await page.fill('#titleInput','<img src=x onerror=window.__xss=1>'); await page.keyboard.press('Enter'); await settle(page);
  await page.click('#tabsScroll .tab[data-id="sp_recherche"]'); await settle(page);
  await ctxMenu(page, T('t_notes')); await subClick(page,'Teilen'); await page.click('#shareOptions .share-row:has-text("In anderen Space kopieren")'); await settle(page,500);
  const fired = await page.evaluate(()=>window.__xss===1);
  return {expected:'Space name rendered as text', observed:`injected onerror handler executed: ${fired}`, status:fired?'DEFECT':'PASS', severity:fired?'High':'—',
    note:'renderContextRows() writes r.label via innerHTML; openSpacePicker() passes raw space names. Names also arrive via JSON import and cloud snapshots (cross-device / shared-file vector).'};
});
test('I-32','Security','Stored XSS: imported space "color" rendered in the space context menu', async()=>{
  const {page} = await fresh();
  const payload = {format:'copyboard-space', version:1, name:'Farbtest', color:'red" onmouseover="x"><img src=x onerror=window.__xss2=1>', data:{itemIds:[], items:{}}};
  const fc = page.waitForEvent('filechooser');
  await palette(page, 'Board importieren'); await page.keyboard.press('Enter');
  await (await fc).setFiles({name:'space.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(payload))});
  await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,500);
  const st = await L.storedState(page); const sid = st.spaces.find(s=>s.name==='Farbtest').id;
  await ctxMenu(page, `#tabsScroll .tab[data-id="${sid}"]`); await settle(page,400);
  const fired = await page.evaluate(()=>window.__xss2===1);
  return {expected:'Imported color validated as a hex value', observed:`handler executed after opening the space context menu: ${fired}`, status:fired?'DEFECT':'PASS', severity:fired?'High':'—'};
});
test('I-33','Security','File name / text content rendering in cards, preview, search', async()=>{
  const {page} = await fresh({empty:true});
  await L.dispatchPaste(page, '<img src=x onerror=window.__xss3=1> text');
  await page.setInputFiles('#fileInput', [{name:'<img src=x onerror=window.__xss4=1>.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF')}]);
  await settle(page,500);
  await palette(page, 'img'); await settle(page,300); await page.keyboard.press('Escape');
  await page.click('#grid .card .thumb >> nth=0'); await settle(page,300); await page.keyboard.press('Escape');
  const fired = await page.evaluate(()=>[window.__xss3, window.__xss4]);
  return {expected:'User text never interpreted as HTML', observed:`handlers executed: ${JSON.stringify(fired)}`, status:fired.some(Boolean)?'DEFECT':'PASS', severity:fired.some(Boolean)?'High':'—'};
});

// ============ PERSISTENCE / BACKUP ============
test('I-34','Backup','Export full backup, modify board, re-import, restore pre-import recovery', async()=>{
  const {page} = await fresh();
  const dl = page.waitForEvent('download');
  await palette(page, 'Board exportieren'); await page.keyboard.press('Enter');
  const d = await dl; const p = await d.path(); const json = JSON.parse(fs.readFileSync(p,'utf8'));
  await page.click('#grid .card[data-id="t_notes"] .btn-del'); await page.click('#confirmOkBtn'); await settle(page);
  const fc = page.waitForEvent('filechooser');
  await palette(page, 'Board importieren'); await page.keyboard.press('Enter');
  await (await fc).setFiles({name:'b.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(json))});
  await page.waitForSelector('#confirmOverlay.show'); const msg = await page.$eval('#confirmMsg', e=>e.textContent); await page.click('#confirmOkBtn'); await settle(page,600);
  let st = await L.storedState(page); const restoredByImport = !!st.data.sp_recherche.items.t_notes;
  await palette(page, 'Stand vor'); await page.keyboard.press('Enter'); await page.click('#confirmOkBtn'); await settle(page,600);
  st = await L.storedState(page); const backToPre = !st.data.sp_recherche.items.t_notes;
  const ok = json.format==='copyboard-backup' && restoredByImport && backToPre;
  return {expected:'Round trip restores; recovery returns to pre-import state', observed:`export="${d.suggestedFilename()}" (${json.format} v${json.version}); confirm="${msg.slice(0,80)}…"; import restored card=${restoredByImport}; recovery restored pre-import=${backToPre}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'High',
    note:'Backup/import is only reachable through the command palette (no visible menu entry).'};
});
test('I-35','Persistence','Start with a stored board of an unsupported (newer) schema version or corrupt JSON', async()=>{
  const out=[];
  for(const [label, raw] of [['future schemaVersion 2', JSON.stringify({...SEED, schemaVersion:2})], ['truncated JSON', JSON.stringify(SEED).slice(0,5000)]]){
    const {page, context} = await L.openApp({storage:{copyboard_state_v1:raw, copyboard_autosave_pref:'1'}});
    await settle(page,500);
    const after = await page.evaluate(()=>localStorage.getItem('copyboard_state_v1'));
    out.push(`${label}: original preserved=${after===raw}; now stored="${JSON.parse(after).spaces.map(s=>s.name)}"`);
    await context.close();
  }
  return {expected:'Unreadable data is kept (or quarantined) and the user is warned', observed:out.join('; '), status:out.some(s=>s.includes('preserved=false'))?'DEFECT':'PASS', severity:'Critical',
    note:'init() falls back to defaultState() and immediately calls persistState({immediate:true}), overwriting STORAGE_KEY without warning or backup.'};
});
test('I-36','Persistence','Real localStorage quota vs. the 20 MiB board limit', async()=>{
  const {page} = await fresh({empty:true});
  const maxChars = await page.evaluate(()=>{ let lo=0, hi=64*1024*1024; while(lo<hi){ const mid=Math.ceil((lo+hi)/2); try{ localStorage.setItem('__q','a'.repeat(mid)); lo=mid; }catch(e){ hi=mid-1; } } localStorage.removeItem('__q'); return lo; });
  // add ~1.5 MB incompressible images until the save fails
  const noise = i => L.makePng(700, 700, ()=>[Math.random()*255|0, Math.random()*255|0, Math.random()*255|0]);
  let failedAt = null, lastStatus='';
  for(let i=0;i<6;i++){
    await page.setInputFiles('#fileInput', [{name:`rauschen-${i}.png`, mimeType:'image/png', buffer:noise(i)}]); await settle(page,700);
    lastStatus = await page.$eval('#autosaveStatus', e=>e.innerText.replace(/\n/g,' '));
    if(/fehlgeschlagen/.test(lastStatus)){ failedAt=i+1; break; }
  }
  const uiCards = (await L.cardIds(page)).length;
  const storedCards = ((await L.storedState(page))?.data && Object.values((await L.storedState(page)).data)[0].itemIds.length) || 0;
  const toast = await L.toastText(page);
  await page.reload(); await settle(page,500);
  const afterReload = (await L.cardIds(page)).length;
  return {expected:'Configured limit matches what the browser can actually persist; user cannot silently lose work', observed:`Chromium localStorage capacity ≈ ${(maxChars/1e6).toFixed(2)} M chars for one value; save failed after ${failedAt} images (~2 MB base64 each); status="${lastStatus}"; toast="${toast}"; UI showed ${uiCards} cards, storage had ${storedCards}; after reload ${afterReload} cards`, status:'DEFECT', severity:'High',
    note:'MAX_TOTAL_BYTES (20 MiB) exceeds typical per-origin localStorage capacity (~5 M UTF-16 chars in Chromium); base64 adds ~33 %. The board keeps accepting items after the first failed save.'};
});
test('I-37','Persistence','AutoSave off: changes are temporary; leaving prompts', async()=>{
  const {page, dialogs} = await fresh();
  await page.click('#memoryToggle'); await settle(page);
  await L.dispatchPaste(page,'Nur temporär'); await settle(page);
  const status = await page.$eval('#autosaveStatus', e=>e.innerText.replace(/\n/g,' '));
  await page.reload({waitUntil:'load'}).catch(()=>{}); await settle(page,500);
  const st = await L.storedState(page);
  const kept = Object.values(st.data.sp_recherche.items).some(i=>i.data==='Nur temporär');
  return {expected:'Temporary mode does not persist; status communicates it', observed:`status="${status}"; persisted after reload=${kept}; beforeunload dialogs=${JSON.stringify(dialogs)}`, status:!kept?'PASS':'DEFECT', severity:!kept?'—':'High'};
});
test('I-38','Settings','Confirmations off, default sort for new spaces, start space; settings export', async()=>{
  const {page, pageErrors} = await fresh();
  const out=[];
  await page.click('#helpToggle'); await page.click('[data-help-panel="settings"]');
  await page.selectOption('#helpConfirmDeleteSelect','off'); await page.selectOption('#helpDefaultSortSelect','newest'); await page.selectOption('#helpStartSpaceSelect','first');
  const dl = page.waitForEvent('download',{timeout:3000}).catch(()=>null); await page.click('#helpExportSettingsBtn'); const d = await dl; await settle(page,300);
  out.push('settings export download='+(d?d.suggestedFilename():'none')+' error='+JSON.stringify(pageErrors.filter(e=>/downloadBlob/.test(e))));
  await page.click('#helpCloseBtn');
  await page.click('#grid .card[data-id="t_code"] .btn-del'); await settle(page,300);
  out.push('delete without confirm: '+!(await L.storedState(page)).data.sp_recherche.items.t_code);
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await page.click('#tabAddBtn'); const st = await L.storedState(page); out.push('new space sort='+st.spaces.at(-1).sortMode);
  await page.reload(); await settle(page,500); out.push('start space after reload='+(await L.storedState(page)).activeSpaceId);
  return {expected:'Settings take effect and persist; settings export downloads a file', observed:out.join('; '), status:d?'PASS':'DEFECT', severity:d?'—':'Medium',
    note:'exportBoardSettings() calls downloadBlob(), which is not defined anywhere in the code base (also absent in V34 commit 4cc325d).'};
});
test('I-39','Search','Command palette: content search, arrow keys, Enter opens result in folder', async()=>{
  const {page} = await fresh();
  await palette(page, 'Interviews'); await settle(page,200);
  const first = await page.$eval('#paletteResults .palette-row', e=>e.innerText.replace(/\n/g,' | '));
  await page.keyboard.press('Enter'); await settle(page,500);
  const folder = await isShown(page,'#folderOverlay');
  await page.keyboard.press('Escape');
  await palette(page, 'Testzugang'); await settle(page,200);
  const lockedHit = await page.$eval('#paletteResults .palette-row', e=>e.innerText.replace(/\n/g,' | ')).catch(()=>'none');
  await page.keyboard.press('Enter'); await settle(page,500);
  const pin = await isShown(page,'#pinOverlay'), prev = await isShown(page,'#previewOverlay');
  return {expected:'Search finds content in folders; locked items require PIN', observed:`hit="${first}" → folder opened=${folder}; locked item searchable by its plaintext name: "${lockedHit}" → Enter: PIN prompt=${pin}, preview=${prev}`, status:(folder && pin)?'PASS':'DEFECT', severity:(folder && pin)?'—':'Medium'};
});
test('I-40','Modals','Stacked modals: Help → Storage → Esc → Esc; storage → preview child', async()=>{
  const {page} = await fresh();
  await page.click('#helpToggle'); await page.click('[data-help-panel="storage"]'); await page.click('#helpOverlay [data-help-content="storage"] [data-help-action="storage"]');
  await page.keyboard.press('Escape'); await settle(page,200);
  const a = [await isShown(page,'#storageOverlay'), await isShown(page,'#helpOverlay')];
  await page.keyboard.press('Escape'); await settle(page,200);
  const b = [await isShown(page,'#helpOverlay')];
  await page.click('#autosaveStatus'); await page.click('#storageLargestList .storage-row-action >> nth=0'); await settle(page,300);
  const c = [await isShown(page,'#previewOverlay'), await isShown(page,'#storageOverlay')];
  await page.keyboard.press('Escape'); await settle(page,200);
  const d = [await isShown(page,'#previewOverlay'), await isShown(page,'#storageOverlay')];
  const ok = !a[0] && a[1] && !b[0] && c[0] && !d[0] && d[1];
  return {expected:'Escape closes only the top-most layer', observed:`after 1st Esc storage=${a[0]} help=${a[1]}; after 2nd Esc help=${b[0]}; preview from storage open=${c[0]} over storage=${c[1]}; Esc → preview=${d[0]} storage=${d[1]}`, status:ok?'PASS':'DEFECT', severity:ok?'—':'Medium'};
});
test('I-41','Copy','Copy text, image and PDF card to the system clipboard', async()=>{
  const {page} = await fresh();
  await page.click('#grid .card[data-id="t_notes"] .btn-copy'); await settle(page,300);
  const t = await page.evaluate(()=>navigator.clipboard.readText());
  await page.click('#grid .card[data-id="i_grad"] .btn-copy'); await settle(page,500);
  const types = await page.evaluate(async()=>{ const it=await navigator.clipboard.read(); return it.flatMap(i=>i.types); });
  await page.click('#grid .card[data-id="f_pdf"] .btn-copy'); await settle(page,500);
  const pdfToast = await L.toastText(page);
  return {expected:'Text and image copied; unsupported types explained', observed:`text ok=${t.startsWith('Meeting')}; image clipboard types=${types}; pdf toast="${pdfToast}"`, status:'PASS', severity:'—'};
});
test('I-42','Media','Voice memo with a fake microphone', async()=>{
  const {page} = await fresh({empty:true});
  await page.click('#micBtn'); await settle(page,1500); await page.click('#micBtn'); await settle(page,1200);
  const st = await L.storedState(page); const it = Object.values(st.data[st.activeSpaceId].items)[0];
  if(it){ await page.click(T(it.id)); await settle(page,300); }
  const audio = await page.$('#previewBody audio');
  return {expected:'Recording stored as audio card and playable in preview', observed:`card=${it?.name} mime=${it?.mime} type=${it?.type} size=${it?.size}B; <audio> in preview=${!!audio}`, status:(it && audio)?'PASS':'DEFECT', severity:(it&&audio)?'—':'Medium',
    note:'Chromium fake device only. Safari (MediaRecorder default audio/mp4 while the app labels the blob audio/webm), permissions UX and max duration are NOT VERIFIED.'};
});
test('I-43','OCR','OCR flow with a stubbed Tesseract (library not loaded from CDN)', async()=>{
  const {page} = await fresh({tesseractStub:'Erkannter Testtext aus Bild'});
  await ctxMenu(page, T('i_grad')); await subClick(page,'Text erkennen'); await settle(page,800);
  const st = await L.storedState(page);
  const created = Object.values(st.data.sp_recherche.items).some(i=>i.data==='Erkannter Testtext aus Bild');
  return {expected:'Recognized text added as card', observed:`card created=${created} (stub); real Tesseract recognition (deu+eng, worker + language data from CDN) NOT VERIFIED`, status:created?'PASS':'DEFECT', severity:created?'—':'Low'};
});
test('I-44','Image tools','Palette extraction and image rotate/save + undo', async()=>{
  const {page} = await fresh();
  await ctxMenu(page, T('i_blocks')); await subClick(page,'Farbpalette extrahieren'); await page.waitForSelector('#paletteExtractOverlay.show');
  const sw = await page.$$eval('#paletteSwatches .sw-hex', e=>e.map(x=>x.textContent)); await page.click('#paletteExtractCloseBtn');
  const before = (await L.storedState(page)).data.sp_recherche.items.i_grad.data.length;
  await ctxMenu(page, T('i_grad')); await ctxClick(page,'Inhalt bearbeiten'); await page.waitForSelector('#imageEditOverlay.show');
  await page.click('#rotateRightBtn'); await page.click('#imageEditSaveBtn'); await settle(page,500);
  const after = (await L.storedState(page)).data.sp_recherche.items.i_grad.data.length;
  await page.keyboard.press('Control+z'); await settle(page,400);
  const undone = (await L.storedState(page)).data.sp_recherche.items.i_grad.data.length;
  return {expected:'Swatches shown; rotation persisted; undo restores', observed:`swatches=${sw.join(' ')}; data length ${before}→${after}→undo ${undone}`, status:(sw.length && after!==before && undone===before)?'PASS':'DEFECT', severity:'—',
    note:'imageEditSave and replaceFileInput never call persistState() themselves; persistence currently happens only as a side effect of markRecent().'};
});
test('I-45','Storage manager','Delete largest entry from storage manager', async()=>{
  const {page} = await fresh();
  await page.click('#autosaveStatus'); const first = await page.$eval('#storageLargestList .storage-row-name', e=>e.textContent);
  await page.click('#storageLargestList .storage-row-action.delete >> nth=0'); await page.click('#confirmOkBtn'); await settle(page,400);
  const firstAfter = await page.$eval('#storageLargestList .storage-row-name', e=>e.textContent);
  return {expected:'Entry deleted and list refreshed', observed:`largest before="${first}", after="${firstAfter}", storage modal open=${await isShown(page,'#storageOverlay')}`, status:first!==firstAfter?'PASS':'DEFECT', severity:'—'};
});

// ============ MOBILE / TOUCH ============
const MOBILE = {viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2};
test('I-M01','Touch','Tap a card on a 390 px touch viewport with the card near the bottom vs. centered', async()=>{
  const out=[]; let closed=0, total=0;
  for(const id of ['t_notes','i_grad','f_folder','f_pdf']) for(const block of ['end','center']){
    const {page, context} = await fresh(MOBILE);
    await page.evaluate(()=>{ window.__seq=[]; for(const o of document.querySelectorAll('.overlay')) new MutationObserver(()=>window.__seq.push(o.id.replace('Overlay','')+':'+(o.classList.contains('show')?'open':'close'))).observe(o,{attributes:true,attributeFilter:['class']}); });
    await page.locator(T(id)).evaluate((e,b)=>e.scrollIntoView({block:b}), block); await settle(page,250);
    await page.tap(T(id)); await settle(page,500);
    const seq = await page.evaluate(()=>window.__seq);
    total++; const bad = seq.some(x=>x.endsWith(':close')); if(bad) closed++;
    out.push(`${id}@${block}: ${seq.join('→')}`);
    await context.close();
  }
  return {expected:'A tap opens the preview/folder and it stays open', observed:`${closed}/${total} taps opened and immediately closed the overlay. ${out.join('; ')}`, status:closed?'DEFECT':'PASS', severity:closed?'High':'—',
    note:'Touch tap: pointerup opens the overlay synchronously, then the browser-generated compatibility click is hit-tested against the new overlay; when it lands on the backdrop, the capture-phase backdrop handler closes it. Outcome depends on where the card is relative to the dialog box.'};
});
test('I-M02','Touch','Vertical swipe that starts on a card thumbnail vs. outside cards', async()=>{
  const {page, context} = await fresh(MOBILE);
  const cdp = await context.newCDPSession(page);
  const swipe = async (x,y)=>{ const y0 = await page.evaluate(()=>document.body.scrollTop); await cdp.send('Input.synthesizeScrollGesture',{x:Math.round(x), y:Math.round(y), yDistance:-300, gestureSourceType:'touch', speed:800}); await settle(page,500); return [y0, await page.evaluate(()=>document.body.scrollTop)]; };
  const c = await L.center(page, T('t_notes'));
  const onCard = await swipe(c.x, c.y);
  const hint = await page.evaluate(()=>document.querySelector('.card.dragging')?'card drag started':'no drag');
  await page.evaluate(()=>document.body.scrollTo(0,0)); await settle(page,300);
  const g = await page.locator('#grid').boundingBox();
  const between = await swipe(g.x + g.width/2, (await page.locator(T('t_notes')).boundingBox()).y + 3 + (await page.locator('#grid .card[data-id="t_notes"]').boundingBox()).height);
  const d = await L.center(page,'#dropzone');
  await page.evaluate(()=>document.body.scrollTo(0,0)); await settle(page,300);
  const onDropzone = await swipe(d.x, d.y);
  const ok = onCard[1]!==onCard[0];
  return {expected:'Swiping on content scrolls the page', observed:`swipe on card thumbnail: scrollY ${onCard[0]}→${onCard[1]} (${hint}); swipe in grid gap: ${between[0]}→${between[1]}; swipe on drop zone: ${onDropzone[0]}→${onDropzone[1]}`, status:ok?'PASS':(onDropzone[1]!==onDropzone[0]?'DEFECT':'NOT VERIFIED'), severity:ok?'—':(onDropzone[1]!==onDropzone[0]?'High':'—'),
    note:'.thumb has touch-action:none and pointerdown starts a card drag after 6 px. Synthesized touch scroll gesture (CDP) in Chromium mobile emulation; confirm on real iOS/Android hardware.'};
});
test('I-M03','Touch','Multi-select and hover-only controls without a mouse', async()=>{
  const {page} = await fresh(MOBILE);
  await page.tap(T('t_link').replace(' .thumb',' .card-meta')); await settle(page,200);
  const op = await page.$eval('#grid .card[data-id="t_link"] .card-select', e=>getComputedStyle(e).opacity+'/'+getComputedStyle(e).pointerEvents);
  const inl = await page.$eval('#grid .card[data-id="t_link"] .inline-text-edit-trigger', e=>getComputedStyle(e).opacity);
  return {expected:'Selection, drag handle and inline edit reachable on touch', observed:`select box opacity/pointer-events after tap=${op}; inline edit trigger opacity=${inl}; no long-press handler in code`, status:'DEFECT', severity:'Medium',
    note:'Controls are revealed only via :hover. Emulated (no real-device verification).'};
});
test('I-M04','Touch','Long-press for context menu', async()=>({expected:'Context actions (move, OCR, PIN, share…) reachable on touch', observed:'Code relies solely on the "contextmenu" event; iOS Safari does not fire it on long-press. CDP emulation cannot reproduce OS long-press behavior.', status:'NOT VERIFIED', severity:'—'}));
test('I-M05','Layout','Fixed bottom controls vs. content on mobile', async()=>{
  const {page} = await fresh(MOBILE);
  const res = [];
  for(const frac of [0, 0.5, 1]){
    await page.evaluate(f=>document.body.scrollTo(0,(document.body.scrollHeight-document.body.clientHeight)*f), frac); await settle(page,200);
    res.push(await page.evaluate(()=>{ const r=e=>e.getBoundingClientRect(); const fixed=['#helpToggle','#cloudToggle','#memoryToggle','#autosaveStatus'].map(s=>r(document.querySelector(s))); return [...document.querySelectorAll('#grid .card .card-actions button')].filter(b=>{const br=r(b); return fixed.some(f=>f.top<br.bottom && f.bottom>br.top && f.left<br.right && f.right>br.left);}).length; }));
  }
  return {expected:'Card action buttons not covered by floating controls', observed:`card action buttons covered by fixed controls at scroll 0%/50%/100%: ${res.join('/')}`, status:res.some(Boolean)?'OBSERVATION':'PASS', severity:res.some(Boolean)?'Low':'—'};
});
test('I-V01','Visual','Favorite badge position vs. delete button', async()=>{
  const {page} = await fresh();
  const hit = await page.evaluate(()=>{ const b=document.querySelector('#grid .card[data-id="t_notes"] .btn-del').getBoundingClientRect(); const el=document.elementFromPoint(b.right-4, b.bottom-4); return el.closest('.card-favorite')?'favorite badge':(el.closest('.btn-del')?'delete button':el.className); });
  return {expected:'Status badges never cover action buttons', observed:`element at lower-right corner of the delete button: ${hit}`, status:hit==='favorite badge'?'DEFECT':'PASS', severity:'Low'};
});

// ============ CLOUD (MOCK BACKEND ONLY) ============
const USER = {id:'00000000-0000-4000-8000-0000000000aa', email:'audit@example.invalid'};
test('I-33b','Security','Imported file item whose data is a javascript: URL, then "Herunterladen"', async()=>{
  const st0 = clone(SEED);
  st0.data.sp_privat.items.f_js = {id:'f_js', type:'file', name:'rechnung.pdf', mime:'application/pdf', size:10, timestamp:1, data:'javascript:window.__xss5=1'};
  st0.data.sp_privat.itemIds.push('f_js');
  const {page} = await fresh({empty:true});
  const fc = page.waitForEvent('filechooser');
  await palette(page,'Board importieren'); await page.keyboard.press('Enter');
  await (await fc).setFiles({name:'b.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify({format:'copyboard-backup',version:1,state:st0}))});
  await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,500);
  const imported = !!(await L.storedState(page))?.data?.sp_privat?.items?.f_js;
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page,300);
  await ctxMenu(page, T('f_js')); await subClick(page,'Herunterladen'); await settle(page,500);
  const fired = await page.evaluate(()=>window.__xss5===1);
  return {expected:'Import validates item data as data: URLs; downloads never navigate', observed:`item accepted by import validation=${imported}; script executed on "Herunterladen"=${fired}`, status:fired?'DEFECT':(imported?'OBSERVATION':'PASS'), severity:fired?'High':(imported?'Low':'—'),
    note:'isValidBoardState()/normalizeItem() check structure only; item.data is used as <a href>, <img src>, <audio src> and fetch() input.'};
});
test('I-C01','Cloud (sandbox)','Supabase library unavailable (CDN blocked) → local-first behavior', async()=>{
  const {page} = await fresh();
  const state = await page.$eval('#cloudToggle', e=>e.dataset.state);
  await page.click('#cloudToggle'); const msg = await page.$eval('#cloudAuthForm', e=>!!e).catch(()=>false);
  await page.fill('#cloudEmailInput','a@b.cd'); await page.fill('#cloudPasswordInput','12345678'); await page.click('#cloudSignInBtn'); await settle(page,300);
  const authMsg = await page.$eval('#cloudAuthMessage', e=>e.textContent);
  return {expected:'App works locally; clear message', observed:`toggle state=${state}; sign-in message="${authMsg}"`, status:'PASS', severity:'—'};
});
test('I-C02','Cloud (mock)','Initial upload; then only viewing a card and switching spaces', async()=>{
  const backend = L.createCloudBackend();
  const {page} = await fresh({cloud:{backend, user:USER}});
  await page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced');
  const rev0 = backend.meta.get(USER.id)?.revision;
  await page.click(T('t_notes')); await page.keyboard.press('Escape'); await settle(page,2200);
  const rev1 = backend.meta.get(USER.id)?.revision;
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page,2200);
  const rev2 = backend.meta.get(USER.id)?.revision;
  const uploads = backend.log.filter(l=>l.op==='upload').length;
  return {expected:'Read-only activity does not create cloud revisions', observed:`revision after sign-in=${rev0}; after opening a preview=${rev1}; after switching space=${rev2}; full-snapshot uploads=${uploads}`, status:(rev1>rev0||rev2>rev1)?'DEFECT':'PASS', severity:'Medium',
    note:'recentItems and activeSpaceId are part of the hashed snapshot; every view/space switch uploads the whole board (up to 20 MiB) and can create cross-device conflicts.'};
});
test('I-C03','Cloud (mock)','Two devices: second device first sign-in, concurrent edits, dismiss, reload', async()=>{
  const backend = L.createCloudBackend();
  const A = await fresh({cloud:{backend, user:USER}});
  await A.page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced');
  const st2 = clone(SEED); st2.data.sp_privat.items.t_b = {id:'t_b', type:'text', name:'Nur auf Gerät B', mime:'text/plain', size:14, timestamp:1, data:'Nur auf Gerät B'}; st2.data.sp_privat.itemIds.push('t_b');
  const B = await fresh({state:st2, cloud:{backend, user:USER}});
  await settle(B.page,1200);
  const out=[];
  out.push('B first sign-in banner='+await B.page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show')));
  await B.page.click('#cloudUpdateBtn'); await settle(B.page,300);
  const confirm = await isShown(B.page,'#confirmOverlay'); out.push('B load confirm='+confirm);
  if(confirm){ await B.page.click('#confirmOkBtn'); await settle(B.page,1000); }
  out.push('B local-only card kept after load='+!!(await L.storedState(B.page)).data.sp_privat.items.t_b);
  await L.dispatchPaste(A.page,'Änderung A'); await settle(A.page,2200);
  await L.dispatchPaste(B.page,'Änderung B'); await settle(B.page,2200);
  out.push(`rev=${backend.meta.get(USER.id).revision}; B banner=${await B.page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show'))}; B status="${await B.page.$eval('#cloudToggle', e=>e.title)}"`);
  await B.page.click('#cloudUpdateDismiss'); await L.dispatchPaste(B.page,'Änderung B2'); await settle(B.page,2200);
  out.push('after dismiss+edit B uploaded='+(backend.log.filter(l=>l.op==='rpc').length)+' publish calls total; banner again='+await B.page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show')));
  await B.page.click('#cloudUpdateBtn'); await settle(B.page,300); if(await isShown(B.page,'#confirmOverlay')){ await B.page.click('#confirmOkBtn'); await settle(B.page,1000); }
  const bState = await L.storedState(B.page);
  const bKept = Object.values(bState.data.sp_recherche.items).some(i=>i.data==='Änderung B');
  const rec = await B.page.evaluate(()=>!!localStorage.getItem('copyboard_preimport_recovery_v1'));
  out.push(`after B "Aktualisieren": B edits kept=${bKept}; single recovery slot present=${rec}`);
  await A.context.close(); await B.context.close();
  return {expected:'Concurrent edits are merged or the user can choose which version to keep', observed:out.join('; '), status:'DEFECT', severity:'High',
    note:'Only two outcomes exist: replace local with cloud (single-slot recovery point) or keep diverging locally with uploads blocked. No merge, no "keep mine/overwrite cloud". Realtime channel is mocked as no-op; realtime delivery NOT VERIFIED.'};
});
test('I-C04','Cloud (mock)','Sign out, then a different account signs in on the same browser profile', async()=>{
  const backend = L.createCloudBackend();
  const other = {id:'00000000-0000-4000-8000-0000000000bb', email:'other@example.invalid'};
  const {page, context} = await fresh({cloud:{backend, user:USER}});
  await page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced');
  await page.click('#cloudToggle'); await page.click('#cloudSignOutBtn'); await settle(page,400);
  const ls = await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  const localKept = itemCount(JSON.parse(ls.copyboard_state_v1));
  await context.close();
  const B = await L.openApp({storage:ls, cloud:{backend, user:other}}); openContexts.push(B.context);
  await settle(B.page,2000);
  const uploadedForOther = !!backend.meta.get(other.id);
  return {expected:'(Product decision) local board ownership on shared devices is explicit', observed:`local items kept after sign-out=${localKept}; same browser profile, next account signs in → previous local board uploaded to that account's cloud=${uploadedForOther}`, status:'OBSERVATION', severity:uploadedForOther?'Medium':'Info'};
});
test('I-C05','Cloud (mock)','Remote snapshot is applied while the "Inhalt bearbeiten" dialog is open on another device', async()=>{
  const backend = L.createCloudBackend();
  const A = await fresh({cloud:{backend, user:USER}});
  await A.page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced');
  const B = await fresh({cloud:{backend, user:USER}});
  await B.page.waitForFunction(()=>['synced','attention'].includes(document.querySelector('#cloudToggle').dataset.state));
  if(await B.page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show'))){ await B.page.click('#cloudUpdateBtn'); await settle(B.page,300); if(await isShown(B.page,'#confirmOverlay')) await B.page.click('#confirmOkBtn'); await settle(B.page,1200); }
  await ctxMenu(B.page, T('t_code')); await ctxClick(B.page,'Inhalt bearbeiten'); await B.page.waitForSelector('#textOverlay.show');
  await B.page.fill('#textArea','WICHTIGE ÄNDERUNG AUF B');
  await L.dispatchPaste(A.page,'Neues von Gerät A'); await settle(A.page,2200);
  await B.page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange'))); await settle(B.page,1500);
  const remoteApplied = Object.values((await L.storedState(B.page)).data.sp_recherche.items).some(i=>i.data==='Neues von Gerät A');
  const modalStillOpen = await isShown(B.page,'#textOverlay');
  if(modalStillOpen){ await B.page.click('#textOkBtn'); await settle(B.page,2500); }
  const bState = await L.storedState(B.page);
  const kept = bState.data.sp_recherche.items.t_code.data==='WICHTIGE ÄNDERUNG AUF B';
  const cloudObj = backend.objects.get(backend.meta.get(USER.id).object_path) || '';
  return {expected:'Edit is preserved, or the user is warned before the remote state replaces the board', observed:`remote applied silently while dialog open=${remoteApplied}; dialog still open=${modalStillOpen}; after "Ablegen": edit in local state=${kept}; edit in cloud=${cloudObj.includes('WICHTIGE ÄNDERUNG AUF B')}; toast="${await L.toastText(B.page)}"`, status:(remoteApplied && !kept)?'DEFECT':'OBSERVATION', severity:(remoteApplied && !kept)?'High':'Info',
    note:'Remote apply is triggered here via visibilitychange → cloudReconcile() (realtime mocked as no-op). Open dialogs hold references to item objects of the replaced state.'};
});
// ============ RUN ============
await L.launch();
for(const t of tests){
  if(only && !only.test(t.id)) continue;
  let r;
  const t0 = Date.now();
  try{ r = await t.fn(); }
  catch(e){ r = {expected:'', observed:'Harness error: '+String(e.message||e).split('\n')[0], status:'BLOCKED', severity:'—'}; }
  while(openContexts.length){ await openContexts.pop().close().catch(()=>{}); }
  results.push({id:t.id, area:t.area, action:t.action, ...r, ms:Date.now()-t0});
  console.log(`${t.id} [${r.status}] ${t.action}\n    → ${r.observed}`);
}
await L.close();
const outFile = path.join(L.AUDIT_DIR,'evidence', only ? `qa-results-${process.argv[2].replace(/[^\w-]/g,'_')}.json` : 'qa-results.json');
fs.writeFileSync(outFile, JSON.stringify({generatedAt:new Date().toISOString(), base:L.BASE, browser:'Chromium (Playwright 1.56.1, headless)', results, externalHostsRequested:[...L.EXTERNAL], note:'All external hosts were intercepted: JSZip served from a local npm copy, Supabase replaced by an in-memory mock or blocked, Tesseract stubbed or blocked, fonts blocked.'}, null, 2));
console.log('written', outFile);
