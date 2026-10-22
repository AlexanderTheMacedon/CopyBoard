// CopyBoard R02 — Security & Privacy Hardening acceptance suite (S1–S4).
// Test evidence only. Not part of the application and not loaded by index.html.
//
// Safety model (inherited from ../../R01-data-loss-guards/harness/qa-lib.mjs, copied unchanged from audit commit 33600a1):
//  - Fresh, isolated Chromium contexts; only synthetic data (dummy texts, generated PNGs, random bytes, test PINs).
//  - Every request outside CB_BASE is intercepted. Supabase is replaced by an in-memory mock living in this
//    Node process; *.supabase.co is never contacted.
//
// Usage:
//   CB_BASE=http://127.0.0.1:8767/ R02_LABEL=r02 PLAYWRIGHT_PATH=… node r02-security.mjs [idRegex]
// Status vocabulary: PASS | FAIL | SKIP
import * as L from '../../R01-data-loss-guards/harness/qa-lib.mjs';
import { webcrypto, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVIDENCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const LABEL = process.env.R02_LABEL || 'run';
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const KEY = 'copyboard_state_v1';
const SEED = await L.seedState();
const LOCKED_PLAIN = 'Testzugang (Dummy): demo-user / demo-pass-123';
const clone = v => JSON.parse(JSON.stringify(v));
const settle = (page, ms=400) => page.waitForTimeout(ms);
const tests = [];
const results = [];
const openContexts = [];
const test = (id, covers, title, fn) => tests.push({id, covers, title, fn});

async function open(opts={}){
  const app = await L.openApp(opts);
  app.page.setDefaultTimeout(8000);
  openContexts.push(app.context);
  return app;
}
const seeded = (state=SEED) => open({storage:L.seededStorage(state)});
const T = id => `#grid .card[data-id="${id}"] .thumb`;
const shown = (page, sel) => page.$eval(sel, e=>e.classList.contains('show')).catch(()=>false);
const itemCount = s => s ? Object.values(s.data).reduce((n,d)=>n+Object.keys(d.items).length,0) : 0;
const storedItem = async (page, sid, id) => (await L.storedState(page))?.data?.[sid]?.items?.[id];
const clearToast = page => page.evaluate(()=>{ document.getElementById('toast').textContent=''; });
const xssFired = page => page.evaluate(()=>window.__xss || 0);
const XSS = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
const XSS_SHORT = '<img src=x onerror=__xss=1>'; // fits the 40-character title field
async function ctxMenu(page, sel){ await page.click(sel, {button:'right'}); await page.waitForSelector('#contextMenu.show'); }
async function ctxClick(page, label){ await page.click(`#contextMenu .ctx-row:has-text("${label}")`); }
async function subClick(page, label){ await page.click('#contextMenu .ctx-row.has-submenu'); await page.click(`#contextSubmenu .ctx-row:has-text("${label}")`); }
async function ctxLabels(page, sel){ await ctxMenu(page, sel); const rows = await page.$$eval('#contextMenu .ctx-row', els=>els.map(e=>e.textContent.trim())); await page.keyboard.press('Escape'); await page.mouse.click(5,5); await settle(page,150); return rows; }
async function palette(page, text){
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#paletteOverlay.show');
  await page.waitForFunction(()=>document.activeElement?.id==='paletteInput');
  await page.fill('#paletteInput', text); await settle(page,150);
}
async function importFile(page, payload, name='import.json'){
  const fc = page.waitForEvent('filechooser');
  await palette(page, 'Board importieren'); await page.keyboard.press('Enter');
  await (await fc).setFiles({name, mimeType:'application/json', buffer:Buffer.from(JSON.stringify(payload))});
  await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,900);
}
async function enterPin(page, pin){ await page.waitForSelector('#pinOverlay.show'); await page.fill('#pinInput', pin); await page.click('#pinOkBtn'); }
async function lockWithPin(page, sel, pin){
  await ctxMenu(page, sel); await subClick(page, 'Mit PIN schützen');
  await enterPin(page, pin); await settle(page,150); await enterPin(page, pin);
}
async function captureDownload(page, action, timeout=4000){
  const dl = page.waitForEvent('download', {timeout}).catch(()=>null);
  await action();
  const d = await dl;
  return d ? {name:d.suggestedFilename(), buf:fs.readFileSync(await d.path())} : null;
}
// Paste exactly like a real browser paste: composed:true, dispatched on the focused element (also inside shadow roots).
function pasteOn(page, spec, text){
  return page.evaluate(({spec, text})=>{
    const el = spec.shadowHost ? document.querySelector(spec.shadowHost).shadowRoot.querySelector(spec.inner)
      : spec.sel ? document.querySelector(spec.sel) : document.body;
    if(el && el !== document.body) el.focus();
    const dt = new DataTransfer(); dt.setData('text/plain', text);
    (el || document.body).dispatchEvent(new ClipboardEvent('paste', {clipboardData:dt, bubbles:true, cancelable:true, composed:true}));
    return el ? (el.id || el.className || el.tagName) : 'none';
  }, {spec, text});
}
function dropTextOn(page, sel, text){
  return page.evaluate(({sel, text})=>{
    const el = sel ? document.querySelector(sel) : document.body;
    const dt = new DataTransfer(); dt.setData('text/plain', text);
    el.dispatchEvent(new DragEvent('drop', {dataTransfer:dt, bubbles:true, cancelable:true, composed:true}));
  }, {sel, text});
}
// Reference implementation of the unchanged PIN format (AES-GCM-256, PBKDF2-SHA-256 × 150 000).
async function refDecrypt(encData, pin){
  const s = webcrypto.subtle, b = v => Buffer.from(v, 'base64');
  const km = await s.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  const key = await s.deriveKey({name:'PBKDF2', salt:b(encData.salt), iterations:150000, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['decrypt']);
  return new TextDecoder().decode(await s.decrypt({name:'AES-GCM', iv:b(encData.iv)}, key, b(encData.cipher)));
}
const lockedOf = async (plain, pin, base) => ({...base, locked:true, lockedType:base.type, data:null, encData:await L.encryptLike(plain, pin)});
const noisePng = (w, h) => L.makePng(w, h, ()=>[Math.random()*255|0, Math.random()*255|0, Math.random()*255|0]);

// ===================== S1 · Stored XSS =====================
test('X1', 'S1 · I-31', 'Space-Name mit HTML-Payload: Umbenennen, Space-Picker, Dropdown, Palette, Bestätigung', async()=>{
  const {page} = await seeded();
  await page.click('#tabsScroll .tab[data-id="sp_privat"]');
  await page.fill('#titleInput', XSS_SHORT); await page.keyboard.press('Enter'); await settle(page);
  await page.click('#tabsScroll .tab[data-id="sp_recherche"]'); await settle(page);
  await ctxMenu(page, T('t_notes')); await subClick(page, 'Teilen');
  await page.click('#shareOptions .share-row:has-text("In anderen Space kopieren")'); await settle(page,500);
  const pickerText = await page.$$eval('#contextMenu .ctx-row', els=>els.map(e=>e.textContent));
  const pickerAsText = pickerText.includes(XSS_SHORT);
  await page.keyboard.press('Escape'); await page.mouse.click(5,5);
  await palette(page, 'Wechseln zu'); await settle(page,200); await page.keyboard.press('Escape');
  await ctxMenu(page, '#tabsScroll .tab[data-id="sp_privat"]'); await ctxClick(page, 'Space leeren'); await settle(page,300);
  const confirmText = await page.$eval('#confirmMsg', e=>e.textContent).catch(()=>'');
  await page.click('#confirmCancelBtn').catch(()=>{});
  await settle(page,500);
  const fired = await xssFired(page);
  const ok = fired === 0 && pickerAsText && confirmText.includes(XSS_SHORT);
  return {status:ok?'PASS':'FAIL', expected:'Space-Name überall als Text; kein Handler ausgeführt',
    observed:`Handler ausgeführt=${fired}; Picker zeigt Namen als Text=${pickerAsText}; Bestätigungstext enthält Namen als Text=${confirmText.includes(XSS_SHORT)}`};
});
test('X1b', 'S1 · I-31 (Import)', 'Board-Import mit Space-Namen als Payload: Tabs, Space-Picker, Menüs', async()=>{
  const st = clone(SEED); st.spaces[1].name = XSS; st.spaces[2].name = '<svg onload="window.__xss=(window.__xss||0)+1">';
  const {page} = await seeded();
  await importFile(page, {format:'copyboard-backup', version:1, state:st});
  await ctxMenu(page, T('t_notes')); await subClick(page, 'Teilen');
  await page.click('#shareOptions .share-row:has-text("In anderen Space kopieren")'); await settle(page,500);
  const rows = await page.$$eval('#contextMenu .ctx-row', els=>els.map(e=>e.textContent));
  await page.keyboard.press('Escape'); await page.mouse.click(5,5);
  await ctxMenu(page, '#tabsScroll .tab[data-id="sp_archiv"]'); await page.keyboard.press('Escape'); await page.mouse.click(5,5);
  await settle(page,500);
  const fired = await xssFired(page);
  const ok = fired === 0 && rows.includes(XSS);
  return {status:ok?'PASS':'FAIL', expected:'Importierte Namen bleiben erhalten und werden nur als Text dargestellt',
    observed:`Handler ausgeführt=${fired}; Picker-Zeilen=${JSON.stringify(rows)}`};
});
test('X2', 'S1 · I-32', 'Space-Import mit Farb-Payload: Kontextmenü, Tab, Dropdown; Farbe verworfen', async()=>{
  const {page} = await seeded();
  const payload = {format:'copyboard-space', version:1, name:'Farbtest', color:'red" onmouseover="x"><img src=x onerror="window.__xss=(window.__xss||0)+1">', data:{itemIds:[], items:{}}};
  await importFile(page, payload, 'space.json');
  const st = await L.storedState(page); const sp = st.spaces.find(s=>s.name==='Farbtest');
  await ctxMenu(page, `#tabsScroll .tab[data-id="${sp.id}"]`); await settle(page,400);
  const fired = await xssFired(page);
  const ok = fired === 0 && sp.color === undefined;
  return {status:ok?'PASS':'FAIL', expected:'Ungültige Farbe wird beim Import verworfen; kein Handler ausgeführt',
    observed:`Handler ausgeführt=${fired}; gespeicherte Farbe=${JSON.stringify(sp.color)}`};
});
test('X2b', 'S1 · I-32 (Board/Cloud-Grenze)', 'Board-Import mit ungültigen Farben in state.spaces; legitime Hex-Farben bleiben', async()=>{
  const st = clone(SEED);
  st.spaces[0].color = '#4f6bff';
  st.spaces[1].color = 'url(javascript:alert(1))';
  st.spaces[2].color = '#22b07d;background-image:url(https://example.invalid/t.png)';
  st.spaces.push({id:'sp_short', name:'Kurz', sortMode:'manual', color:' #abc '}); st.data.sp_short = {itemIds:[], items:{}};
  const {page} = await seeded();
  await importFile(page, {format:'copyboard-backup', version:1, state:st});
  const colors = Object.fromEntries((await L.storedState(page)).spaces.map(s=>[s.id, s.color ?? null]));
  for(const id of Object.keys(colors)){ await ctxMenu(page, `#tabsScroll .tab[data-id="${id}"]`); await page.keyboard.press('Escape'); await page.mouse.click(5,5); }
  await settle(page,400);
  const fired = await xssFired(page);
  const extHit = [...L.EXTERNAL].includes('example.invalid');
  const ok = fired === 0 && !extHit && colors.sp_recherche === '#4f6bff' && colors.sp_privat === null && colors.sp_archiv === null && colors.sp_short === '#abc';
  return {status:ok?'PASS':'FAIL', expected:'#4f6bff und #abc bleiben, url()/CSS-Anhänge werden verworfen, kein externer Request',
    observed:`Farben=${JSON.stringify(colors)}; Handler=${fired}; example.invalid angefragt=${extHit}`};
});
test('X2c', 'S1 · Positivkontrolle Farbe', 'Farbe über den Picker wählen: Hex gespeichert, Swatch im Menü sichtbar', async()=>{
  const {page} = await seeded();
  await ctxMenu(page, '#tabsScroll .tab[data-id="sp_archiv"]'); await ctxClick(page, 'Farbe wählen'); await settle(page,300);
  await page.click('#contextMenu .ctx-row:has-text("Farbe") >> nth=1'); await settle(page,400);
  const color = (await L.storedState(page)).spaces.find(s=>s.id==='sp_archiv').color;
  await ctxMenu(page, '#tabsScroll .tab[data-id="sp_archiv"]');
  const swatch = await page.$eval('#contextMenu .ctx-row:has-text("Farbe wählen") span', e=>getComputedStyle(e).backgroundColor);
  const ok = color === '#ff6b57' && swatch === 'rgb(255, 107, 87)';
  return {status:ok?'PASS':'FAIL', expected:'#ff6b57 gespeichert, Swatch rgb(255, 107, 87)', observed:`gespeichert=${color}; Swatch=${swatch}`};
});

const UNSAFE_REFS = {
  f_js:  {type:'file', name:'rechnung.pdf', mime:'application/pdf', data:'javascript:void(window.__xss=(window.__xss||0)+1)'},
  f_js2: {type:'file', name:'tarnung.pdf', mime:'application/pdf', data:'  JaVaScRiPt:void(window.__xss=(window.__xss||0)+1)'},
  f_vbs: {type:'file', name:'alt.txt', mime:'text/plain', data:'vbscript:msgbox(1)'},
  f_http:{type:'file', name:'fern.bin', mime:'application/octet-stream', data:'https://example.invalid/exfil'},
  f_blob:{type:'file', name:'blob.bin', mime:'application/octet-stream', data:'blob:https://example.invalid/0000'},
  i_js:  {type:'image', name:'bild.png', mime:'image/png', data:'javascript:void(window.__xss=(window.__xss||0)+1)'},
  a_js:  {type:'file', name:'memo.webm', mime:'audio/webm', data:'javascript:void(window.__xss=(window.__xss||0)+1)'},
};
function unsafeRefState(){
  const st = clone(SEED);
  for(const [id, it] of Object.entries(UNSAFE_REFS)){ st.data.sp_privat.items[id] = {id, size:10, timestamp:1, ...it}; st.data.sp_privat.itemIds.push(id); }
  return st;
}
test('X3', 'S1 · I-33b', 'Import mit javascript:/vbscript:/http:/blob:-Daten: Herunterladen, Vorschau, Kopieren', async()=>{
  const {page} = await seeded();
  const url0 = page.url();
  await importFile(page, {format:'copyboard-backup', version:1, state:unsafeRefState()});
  const stored = (await L.storedState(page)).data.sp_privat.items;
  const neutralized = Object.keys(UNSAFE_REFS).map(id=>`${id}:${stored[id] ? JSON.stringify(stored[id].data) : 'fehlt'}`);
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page,300);
  const per = [];
  for(const id of Object.keys(UNSAFE_REFS)){
    await clearToast(page);
    const d = await captureDownload(page, async()=>{ await ctxMenu(page, T(id)); await subClick(page, 'Herunterladen'); }, 1500);
    await settle(page,200);
    per.push(`${id}: Download=${d ? d.name : 'keiner'}, Toast="${await L.toastText(page)}"`);
    await page.click(T(id)); await settle(page,250); await page.keyboard.press('Escape'); await settle(page,150);
  }
  await settle(page,600);
  const fired = await xssFired(page);
  const extHit = [...L.EXTERNAL].includes('example.invalid');
  const allNull = Object.keys(UNSAFE_REFS).every(id=>stored[id] && stored[id].data === null);
  const ok = fired === 0 && page.url() === url0 && allNull && !extHit && per.every(p=>p.includes('Download=keiner'));
  return {status:ok?'PASS':'FAIL', expected:'Unsichere Referenzen werden an der Import-Grenze verworfen (Karte bleibt, data=null); kein Skript, keine Navigation, kein externer Request',
    observed:`Handler=${fired}; URL unverändert=${page.url()===url0}; gespeichert: ${neutralized.join(', ')}; ${per.join('; ')}; example.invalid angefragt=${extHit}`};
});
test('X3b', 'S1 · I-33b (Bestand)', 'Bereits gespeicherter javascript:-Eintrag aus einem Alt-Import: Herunterladen nach dem Laden', async()=>{
  const {page} = await seeded(unsafeRefState());
  const url0 = page.url();
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page,300);
  const d = await captureDownload(page, async()=>{ await ctxMenu(page, T('f_js')); await subClick(page, 'Herunterladen'); }, 1500);
  await settle(page,500);
  const fired = await xssFired(page);
  const ok = fired === 0 && !d && page.url() === url0;
  return {status:ok?'PASS':'FAIL', expected:'Auch Bestandsdaten werden beim Laden normalisiert; kein Skript', observed:`Handler=${fired}; Download=${d?d.name:'keiner'}; Toast="${await L.toastText(page)}"`};
});
test('X4', 'S1 · sichere Downloads', 'Legitime Datei, CSV, Bild und Text herunterladen: Bytes identisch, keine Navigation', async()=>{
  const {page} = await seeded();
  const url0 = page.url();
  const expect = {
    f_pdf: Buffer.from('%PDF-1.4 synthetic test document'),
    f_csv: Buffer.from('datum;wert\n2026-10-01;42\n2026-10-02;43\n'),
    i_grad: L.IMG_GRADIENT,
    t_notes: Buffer.from(SEED.data.sp_recherche.items.t_notes.data),
  };
  const out = [];
  for(const [id, bytes] of Object.entries(expect)){
    await page.click(T(id)); await page.waitForSelector('#previewOverlay.show');
    const d = await captureDownload(page, ()=>page.click('#previewFooter button:has-text("Herunterladen")'));
    await page.keyboard.press('Escape'); await settle(page,200);
    out.push({id, name:d?.name, same:!!d && Buffer.compare(d.buf, bytes) === 0});
  }
  const viaMenu = await captureDownload(page, async()=>{ await ctxMenu(page, T('f_pdf')); await subClick(page, 'Herunterladen'); });
  const ok = out.every(o=>o.same) && viaMenu && Buffer.compare(viaMenu.buf, expect.f_pdf) === 0 && page.url() === url0;
  return {status:ok?'PASS':'FAIL', expected:'Jeder Download liefert die Originalbytes über einen lokalen Blob; Seite bleibt',
    observed:out.map(o=>`${o.id}: "${o.name}" identisch=${o.same}`).join('; ')+`; Kontextmenü f_pdf identisch=${!!viaMenu && Buffer.compare(viaMenu.buf, expect.f_pdf)===0}; URL unverändert=${page.url()===url0}`};
});
test('X5', 'S1 · MIME-Grenze', 'Import mit MIME-Payloads: ungültige ersetzt, legitime unverändert', async()=>{
  const st = clone(SEED);
  const mimes = {
    m_ok1:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', m_ok2:'audio/webm;codecs=opus', m_ok3:'image/svg+xml',
    m_ok4:'text/plain; charset="utf-8"', m_bad1:'text/html"><img src=x onerror="window.__xss=1">', m_bad2:'image/png\n<script>', m_bad3:'javascript:alert(1)',
  };
  for(const [id, mime] of Object.entries(mimes)){ st.data.sp_archiv.items[id] = {id, type:'file', name:id+'.bin', mime, size:3, timestamp:1, data:'data:application/octet-stream;base64,QUJD'}; st.data.sp_archiv.itemIds.push(id); }
  const {page} = await seeded();
  await importFile(page, {format:'copyboard-backup', version:1, state:st});
  const items = (await L.storedState(page)).data.sp_archiv.items;
  const got = Object.fromEntries(Object.keys(mimes).map(id=>[id, items[id]?.mime]));
  const ok = Object.entries(mimes).every(([id, m])=> id.startsWith('m_ok') ? got[id] === m : got[id] === 'application/octet-stream');
  return {status:ok?'PASS':'FAIL', expected:'Gültige MIME-Typen (inkl. Parameter) bleiben; ungültige → application/octet-stream', observed:JSON.stringify(got)};
});
test('X6', 'S1 · Kompatibilität', 'Bestandsboard, Backup v1, Legacy-Rohformat und Space-Export bleiben verlustfrei', async()=>{
  const cmp = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const seedItems = sid => SEED.data[sid].items;
  const sameItems = (st, sids=['sp_recherche','sp_privat']) => sids.every(sid=>Object.entries(seedItems(sid)).every(([id, it])=>cmp(st.data[sid].items[id], it)));
  const out = [];
  { // a) stored board loads and survives the next save unchanged
    const {page} = await seeded();
    await L.dispatchPaste(page, 'R02 Speicher-Anstoß'); await settle(page,600);
    const st = await L.storedState(page);
    out.push(['Bestand', sameItems(st) && cmp(st.spaces.map(s=>s.color ?? null), SEED.spaces.map(s=>s.color ?? null))]);
  }
  for(const [label, payload] of [['Backup v1', {format:'copyboard-backup', version:1, state:SEED}], ['Legacy-Rohformat', SEED]]){
    const {page} = await open({});
    await importFile(page, payload);
    const st = await L.storedState(page);
    out.push([label, !!st && sameItems(st) && cmp(st.spaces.map(s=>s.color ?? null), SEED.spaces.map(s=>s.color ?? null))]);
  }
  { // space export round trip
    const {page} = await seeded();
    const d = await captureDownload(page, async()=>{ await ctxMenu(page, '#tabsScroll .tab[data-id="sp_recherche"]'); await ctxClick(page, 'Als JSON exportieren'); });
    const exported = JSON.parse(d.buf.toString('utf8'));
    await importFile(page, exported, 'space.json');
    const st = await L.storedState(page); const sp = st.spaces.find(s=>s.name.startsWith('Recherche ('));
    out.push(['Space-Export → Import', !!sp && sp.color === '#4f6bff' && Object.entries(seedItems('sp_recherche')).every(([id, it])=>cmp(st.data[sp.id].items[id], it))]);
  }
  const ok = out.every(([, v])=>v);
  return {status:ok?'PASS':'FAIL', expected:'Alle Karten (inkl. PIN-Karte, Bilder, Dateien) und Farben byte-identisch', observed:out.map(([l, v])=>`${l}: ${v}`).join('; ')};
});

// ===================== S2 · Clipboard privacy =====================
const PASTE_FIELDS = [
  ['Palette-Suche', async p=>{ await p.keyboard.press('Control+k'); await p.waitForSelector('#paletteOverlay.show'); return {sel:'#paletteInput'}; }],
  ['Sticky Note', async p=>{ await p.click('#helpToggle'); await p.click('[data-help-panel="notes"]'); return {sel:'#helpNoteInput'}; }],
  ['Cloud-E-Mail', async p=>{ await p.click('#cloudToggle'); await p.waitForSelector('#cloudEmailInput', {state:'visible'}); return {sel:'#cloudEmailInput'}; }],
  ['Cloud-Passwort', async p=>{ await p.click('#cloudToggle'); await p.waitForSelector('#cloudPasswordInput', {state:'visible'}); return {sel:'#cloudPasswordInput'}; }],
  ['Cloud-Passwort bestätigen', async p=>{ await p.click('#cloudToggle'); await p.click('#cloudRegisterModeBtn'); await p.waitForSelector('#cloudPasswordConfirmInput', {state:'visible'}); return {sel:'#cloudPasswordConfirmInput'}; }],
  ['PIN', async p=>{ await p.click(T('t_locked')); await p.waitForSelector('#pinOverlay.show'); return {sel:'#pinInput'}; }],
  ['Inline-Texteditor', async p=>{ await p.hover(T('t_code')); await p.click('#grid .card[data-id="t_code"] .inline-text-edit-trigger'); return {sel:'.inline-text-editor textarea'}; }],
  ['Text-Dialog (bewusste Erfassung)', async p=>{ await p.click('#addTextBtn'); await p.waitForSelector('#textOverlay.show'); return {sel:'#textArea'}; }],
  ['Karte umbenennen', async p=>{ await ctxMenu(p, T('t_notes')); await ctxClick(p, 'Umbenennen'); await p.waitForSelector('#renameOverlay.show'); return {sel:'#renameInput'}; }],
  ['Board-Titel', async ()=>({sel:'#titleInput'})],
  ['Ordnertitel', async p=>{ await p.click(T('f_folder')); await p.waitForSelector('#folderOverlay.show'); return {sel:'#folderTitleInput'}; }],
  ['Tab umbenennen', async p=>{ await ctxMenu(p, '#tabsScroll .tab[data-id="sp_privat"]'); await ctxClick(p, 'Umbenennen'); await p.waitForSelector('.tab-rename-input'); return {sel:'.tab-rename-input'}; }],
  ['contenteditable', async p=>{ await p.evaluate(()=>{ const d=document.createElement('div'); d.id='r02Editable'; d.contentEditable='true'; d.innerHTML='<p><span id="r02EditableSpan">Notiz</span></p>'; document.body.appendChild(d); }); return {sel:'#r02Editable'}; }],
  ['contenteditable (Kindelement)', async p=>{ await p.evaluate(()=>{ const d=document.createElement('div'); d.contentEditable='true'; d.innerHTML='<p><span id="r02EditableSpan" tabindex="-1">Notiz</span></p>'; document.body.appendChild(d); }); return {sel:'#r02EditableSpan'}; }],
  ['Shadow-DOM-Passwortfeld', async p=>{ await p.evaluate(()=>{ const h=document.createElement('div'); h.id='r02Host'; document.body.appendChild(h); h.attachShadow({mode:'open'}).innerHTML='<input type="password" id="inner">'; }); return {shadowHost:'#r02Host', inner:'#inner'}; }],
  ['role=textbox', async p=>{ await p.evaluate(()=>{ const d=document.createElement('div'); d.id='r02Textbox'; d.setAttribute('role','textbox'); d.tabIndex=0; document.body.appendChild(d); }); return {sel:'#r02Textbox'}; }],
  ['Dialog offen, Fokus auf Schaltfläche', async p=>{ await p.click('#clearBtn'); await p.waitForSelector('#confirmOverlay.show'); return {sel:'#confirmCancelBtn'}; }],
];
test('P1', 'S2 · I-02, N1', 'Paste in jedes sensible bzw. editierbare Feld erzeugt keine Karte', async()=>{
  const out = [];
  for(const [label, prep] of PASTE_FIELDS){
    const {page, context} = await seeded();
    const before = itemCount(await L.storedState(page));
    const spec = await prep(page); await settle(page,200);
    await pasteOn(page, spec, 'geheim-R02-'+label);
    await settle(page,600);
    const after = itemCount(await L.storedState(page)), dup = await shown(page, '#duplicateDetectedOverlay');
    out.push({label, leak:after > before || dup});
    await context.close();
  }
  const leaks = out.filter(o=>o.leak);
  return {status:leaks.length?'FAIL':'PASS', expected:'Kein Feld erzeugt eine Karte', observed:out.map(o=>`${o.label}: ${o.leak?'KARTE ERZEUGT':'keine Karte'}`).join('; ')};
});
test('P1k', 'S2 · N1 (echte Tastatur)', 'Echtes Strg/Cmd+V in Cloud-E-Mail und Cloud-Passwort: Paste-Ereignis erreicht das Feld, keine Karte', async()=>{
  const out = [];
  for(const sel of ['#cloudEmailInput', '#cloudPasswordInput']){
    const {page, context} = await seeded();
    await page.evaluate(()=>{ window.__pastes=[]; document.addEventListener('paste', e=>window.__pastes.push(e.target.id||e.target.tagName), true); return navigator.clipboard.writeText('R02-Passwort-Dummy'); });
    const before = itemCount(await L.storedState(page));
    await page.click('#cloudToggle'); await page.waitForSelector(sel, {state:'visible'}); await settle(page,500); // dialog autofocuses the e-mail field
    await page.focus(sel); await page.keyboard.press('ControlOrMeta+V'); await settle(page,600);
    out.push({sel, events:await page.evaluate(()=>window.__pastes), value:await page.$eval(sel, e=>e.value), cards:itemCount(await L.storedState(page)) - before});
    await context.close();
  }
  const fired = out.filter(o=>o.events.length);
  if(!fired.length) return {status:'SKIP', expected:'', observed:'Headless-Browser löst bei Tastatur-Paste kein paste-Ereignis aus: '+JSON.stringify(out)};
  const ok = out.every(o=>o.cards === 0);
  return {status:ok?'PASS':'FAIL', expected:'Paste-Ereignis am Feld, keine neue Karte',
    observed:out.map(o=>`${o.sel}: Ereignisse=${JSON.stringify(o.events)}, Feldwert="${o.value}", neue Karten=${o.cards}`).join('; ')};
});
test('P2', 'S2 · Positivkontrollen', 'Paste aufs Board, bei offenem Ordner, Text-Dialog, Kontextmenü „Einfügen“, Bild-Paste', async()=>{
  const out = [];
  { const {page} = await open({}); await pasteOn(page, {}, 'R02 Board-Paste'); await settle(page,600);
    out.push(['Board (synthetisch)', itemCount(await L.storedState(page)) === 1]); }
  { const {page} = await open({}); await page.evaluate(()=>navigator.clipboard.writeText('R02 echtes Strg+V'));
    await page.mouse.click(700, 600); await page.keyboard.press('ControlOrMeta+V'); await settle(page,700);
    const n = itemCount(await L.storedState(page)); out.push(['Board (echte Tastatur)', n === 1 ? true : n === 0 ? 'SKIP' : false]); }
  { const {page} = await seeded(); const before = itemCount(await L.storedState(page));
    await page.click(T('f_folder')); await page.waitForSelector('#folderOverlay.show'); await page.evaluate(()=>document.activeElement?.blur());
    await pasteOn(page, {}, 'R02 bei offenem Ordner'); await settle(page,600);
    out.push(['offener Ordner, Fokus nicht im Feld', itemCount(await L.storedState(page)) === before + 1]); }
  { const {page} = await open({}); await page.click('#addTextBtn'); await page.waitForSelector('#textOverlay.show');
    await page.fill('#textArea', 'R02 bewusst erfasst'); await page.click('#textOkBtn'); await settle(page,600);
    out.push(['Text-Dialog „Ablegen“', itemCount(await L.storedState(page)) === 1]); }
  { const {page} = await open({}); await page.evaluate(()=>navigator.clipboard.writeText('R02 über Kontextmenü'));
    await page.click('#grid', {button:'right', position:{x:40, y:40}}).catch(()=>page.mouse.click(700, 600, {button:'right'}));
    await page.waitForSelector('#contextMenu.show'); await ctxClick(page, 'Einfügen'); await settle(page,700);
    out.push(['Kontextmenü „Einfügen“', itemCount(await L.storedState(page)) === 1]); }
  { const {page} = await open({});
    await page.evaluate(b64=>{ const bin=atob(b64); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
      const dt=new DataTransfer(); dt.items.add(new File([u], 'geklebt.png', {type:'image/png'}));
      document.body.dispatchEvent(new ClipboardEvent('paste', {clipboardData:dt, bubbles:true, cancelable:true, composed:true})); }, L.IMG_BLOCKS.toString('base64'));
    await settle(page,900);
    const st = await L.storedState(page); const it = st && Object.values(Object.values(st.data)[0].items)[0];
    out.push(['Bild-Paste', it?.type === 'image']); }
  const hard = out.filter(([, v])=>v !== 'SKIP');
  const ok = hard.every(([, v])=>v === true);
  return {status:ok?'PASS':'FAIL', expected:'Ausdrückliches Paste aufs Board und bewusste Erfassung erzeugen weiterhin genau eine Karte',
    observed:out.map(([l, v])=>`${l}: ${v === 'SKIP' ? 'SKIP (Headless fügt nicht ein)' : v}`).join('; ')};
});
test('P3', 'S2 · Drop', 'Text in das Cloud-Passwortfeld ziehen: keine Karte; Text aufs Board ziehen: Karte', async()=>{
  const {page} = await seeded();
  const before = itemCount(await L.storedState(page));
  await page.click('#cloudToggle'); await page.waitForSelector('#cloudPasswordInput', {state:'visible'});
  await dropTextOn(page, '#cloudPasswordInput', 'R02 gezogenes Passwort'); await settle(page,600);
  const afterField = itemCount(await L.storedState(page));
  await page.click('#cloudCloseBtn').catch(()=>page.keyboard.press('Escape')); await settle(page,300);
  await dropTextOn(page, null, 'R02 aufs Board gezogen'); await settle(page,600);
  const afterBoard = itemCount(await L.storedState(page));
  const ok = afterField === before && afterBoard === before + 1;
  return {status:ok?'PASS':'FAIL', expected:'Feld: keine Karte; Board: eine Karte', observed:`Karten vorher ${before}, nach Drop ins Feld ${afterField}, nach Drop aufs Board ${afterBoard}`};
});

// ===================== S3 · PIN access =====================
async function noBypass(page){ return {pin:await shown(page,'#pinOverlay'), preview:await shown(page,'#previewOverlay')}; }
test('B1', 'S3 · I-13', 'Schnellvorschau (Hover + Leertaste) auf gesperrter Karte', async()=>{
  const {page} = await seeded();
  await page.hover(T('t_notes')); await page.keyboard.press('Space'); await settle(page);
  const normal = await shown(page,'#previewOverlay'); await page.keyboard.press('Escape'); await settle(page,200);
  await page.hover(T('t_locked')); await page.keyboard.press('Space'); await settle(page);
  const r = await noBypass(page);
  const ok = normal && r.pin && !r.preview;
  return {status:ok?'PASS':'FAIL', expected:'Normale Karte: Vorschau; gesperrte Karte: PIN-Abfrage, keine Vorschau', observed:`normal=${normal}; gesperrt: PIN-Abfrage=${r.pin}, Vorschau=${r.preview}`};
});
test('B2', 'S3 · I-39', 'Suche → Enter auf gesperrter Karte', async()=>{
  const {page} = await seeded();
  await palette(page, 'Testzugang'); await settle(page,200); await page.keyboard.press('Enter'); await settle(page,600);
  const r = await noBypass(page);
  return {status:r.pin && !r.preview?'PASS':'FAIL', expected:'PIN-Abfrage statt Vorschau', observed:`PIN-Abfrage=${r.pin}, Vorschau=${r.preview}`};
});
test('B3', 'S3 · Inspector', 'Details → „Vorschau öffnen“ auf gesperrter Karte', async()=>{
  const {page} = await seeded();
  await ctxMenu(page, T('t_locked')); await ctxClick(page, 'Details'); await page.waitForSelector('#inspectorOverlay.show');
  await page.click('#inspectorOpenBtn'); await settle(page,600);
  const r = await noBypass(page);
  return {status:r.pin && !r.preview?'PASS':'FAIL', expected:'PIN-Abfrage statt Vorschau', observed:`PIN-Abfrage=${r.pin}, Vorschau=${r.preview}`};
});
test('B4', 'S3 · Speicherübersicht', 'Speicherstatus → Vorschau einer gesperrten Karte', async()=>{
  const st = clone(SEED);
  st.data.sp_recherche.items.t_locked = await lockedOf('Großer Geheimtext '.repeat(4000), '1234', SEED.data.sp_recherche.items.t_locked);
  const {page} = await seeded(st);
  await palette(page, 'Speicherstatus'); await page.keyboard.press('Enter'); await page.waitForSelector('#storageOverlay.show');
  const btn = await page.$(`#storageLargestList .storage-row-action[aria-label="Vorschau für ${SEED.data.sp_recherche.items.t_locked.name}"]`);
  if(!btn) return {status:'SKIP', expected:'', observed:'gesperrte Karte nicht in der Liste'};
  await btn.click(); await settle(page,600);
  const r = await noBypass(page);
  return {status:r.pin && !r.preview?'PASS':'FAIL', expected:'PIN-Abfrage statt Vorschau', observed:`PIN-Abfrage=${r.pin}, Vorschau=${r.preview}`};
});
test('B5', 'S3 · Favoriten/Zuletzt (Kontrolle)', 'Favoriten- und Verlaufseintrag einer gesperrten Karte öffnen', async()=>{
  const st = clone(SEED);
  st.data.sp_recherche.items.t_locked.favorite = true;
  st.recentItems.unshift({itemId:'t_locked', spaceId:'sp_recherche', folderId:null, action:'open', usedAt:Date.parse('2026-10-20T10:00:00Z')});
  const {page} = await seeded(st);
  await palette(page, 'Favoriten öffnen'); await page.keyboard.press('Enter'); await page.waitForSelector('#favoritesOverlay.show');
  await page.click(`#favoritesList .favorite-row:has-text("Testzugang") button[title="Öffnen"]`); await settle(page,600);
  const fav = await noBypass(page);
  return {status:fav.pin && !fav.preview?'PASS':'FAIL', expected:'PIN-Abfrage statt Vorschau', observed:`Favoriten: PIN-Abfrage=${fav.pin}, Vorschau=${fav.preview}`};
});
test('B6', 'S3 · Menüs und Kartenaktionen', 'Kontextmenü und Kartenschaltflächen einer gesperrten Karte bieten keinen Inhaltszugriff', async()=>{
  const {page} = await seeded();
  const rows = await ctxLabels(page, T('t_locked'));
  const forbidden = rows.filter(r=>/^(Vorschau|Kopieren|Inhalt bearbeiten|Herunterladen|Teilen|Duplizieren)$/.test(r) || r === 'Weitere Aktionen');
  await page.hover(T('t_locked'));
  const inline = await page.$('#grid .card[data-id="t_locked"] .inline-text-edit-trigger');
  const dragout = await page.$('#grid .card[data-id="t_locked"] [data-card-action="dragout"]');
  const ok = !forbidden.length && !inline && !dragout;
  return {status:ok?'PASS':'FAIL', expected:'Nur PIN-Anzeige, PIN entfernen, Details, Umbenennen, Favorit, Löschen', observed:`Menü=${JSON.stringify(rows)}; Inline-Editor=${!!inline}; Drag-out=${!!dragout}`};
});
test('B7', 'S3 · N5b', 'PIN-entsperrte Vorschau ist schreibgeschützt; Kopieren/Herunterladen liefern den Klartext', async()=>{
  const {page} = await seeded();
  const before = await storedItem(page, 'sp_recherche', 't_locked');
  await page.click(T('t_locked')); await enterPin(page, '1234'); await page.waitForSelector('#previewOverlay.show');
  const body = await page.$eval('#previewBody', e=>e.innerText);
  const buttons = await page.$$eval('#previewFooter button', els=>els.map(e=>({t:e.textContent.trim(), disabled:e.disabled})));
  const edit = buttons.find(b=>b.t.includes('bearbeiten'));
  await page.click('#previewFooter button:has-text("bearbeiten")', {force:true, timeout:1500}).catch(()=>{}); await settle(page,400);
  const editorOpened = await shown(page,'#textOverlay');
  let lostEdit = false;
  if(editorOpened){ await page.fill('#textArea','R02 Änderung in der Vorschau-Kopie'); await clearToast(page); await page.click('#textOkBtn'); await settle(page,500); lostEdit = true; }
  const toastAfterEdit = await L.toastText(page);
  if(!editorOpened){
    await page.click('#previewFooter button:has-text("Kopieren")'); await settle(page,400);
  }
  const clip = await page.evaluate(()=>navigator.clipboard.readText()).catch(()=>'');
  let dl = null;
  if(await shown(page,'#previewOverlay')) dl = await captureDownload(page, ()=>page.click('#previewFooter button:has-text("Herunterladen")'));
  const after = await storedItem(page, 'sp_recherche', 't_locked');
  const unchanged = JSON.stringify(after) === JSON.stringify(before);
  const ok = body.includes(LOCKED_PLAIN) && edit?.disabled && !editorOpened && !buttons.some(b=>b.t.includes('Teilen')) && clip === LOCKED_PLAIN && dl?.buf.toString('utf8') === LOCKED_PLAIN && unchanged;
  return {status:ok?'PASS':'FAIL', expected:'Klartext sichtbar; „Inhalt bearbeiten“ deaktiviert, kein „Teilen“; Kopieren/Download = Klartext; gespeicherte Karte unverändert verschlüsselt',
    observed:`Klartext sichtbar=${body.includes(LOCKED_PLAIN)}; Schaltflächen=${JSON.stringify(buttons)}; Editor geöffnet=${editorOpened}${lostEdit?` (Änderung an der Kopie, Toast "${toastAfterEdit}")`:''}; Zwischenablage=Klartext ${clip===LOCKED_PLAIN}; Download=Klartext ${dl?.buf.toString('utf8')===LOCKED_PLAIN}; gespeicherte Karte unverändert=${unchanged}`};
});
test('B8', 'S3 · N5a', 'Umgehungsvorschau → „Inhalt bearbeiten“ → Speichern darf die gesperrte Karte nicht mit Klartext überschreiben', async()=>{
  const {page} = await seeded();
  const before = await storedItem(page, 'sp_recherche', 't_locked');
  await page.hover(T('t_locked')); await page.keyboard.press('Space'); await settle(page);
  let path = 'keine Vorschau';
  if(await shown(page,'#previewOverlay')){
    path = 'Vorschau ohne PIN';
    await page.click('#previewFooter button:has-text("bearbeiten")', {timeout:1500}).catch(()=>{}); await settle(page,400);
    if(await shown(page,'#textOverlay')){ path += ' → Editor'; await page.fill('#textArea','R02 Klartext-Überschreibung'); await page.click('#textOkBtn'); await settle(page,600); }
  }
  const after = await storedItem(page, 'sp_recherche', 't_locked');
  const corrupted = after?.locked === true && after?.data !== null;
  const ok = JSON.stringify(after) === JSON.stringify(before);
  return {status:ok?'PASS':'FAIL', expected:'Kein Weg zum Editor; Karte bleibt unverändert verschlüsselt', observed:`Pfad: ${path}; gespeichert unverändert=${ok}; halb gesperrt (locked + Klartext)=${corrupted}`};
});
test('B9', 'S3 · Fehlerpfade', 'Falscher PIN und beschädigte PIN-Daten: keine Vorschau, ehrliche Meldung, Karte unverändert', async()=>{
  const st = clone(SEED);
  st.data.sp_privat.items.t_bad = {...clone(SEED.data.sp_recherche.items.t_locked), id:'t_bad', name:'Beschädigt', encData:{...SEED.data.sp_recherche.items.t_locked.encData, salt:'%%%kein-base64%%%'}};
  st.data.sp_privat.itemIds.push('t_bad');
  const {page} = await seeded(st);
  await clearToast(page); await page.click(T('t_locked')); await enterPin(page, '0000'); await settle(page,1500);
  const wrong = {toast:await L.toastText(page), preview:await shown(page,'#previewOverlay')};
  await page.click('#tabsScroll .tab[data-id="sp_privat"]'); await settle(page,300);
  const before = await storedItem(page, 'sp_privat', 't_bad');
  await clearToast(page); await page.click(T('t_bad')); await enterPin(page, '1234'); await settle(page,800);
  const corrupt = {toast:await L.toastText(page), preview:await shown(page,'#previewOverlay')};
  await clearToast(page); await ctxMenu(page, T('t_bad')); await ctxClick(page, 'PIN entfernen'); await enterPin(page, '1234'); await settle(page,800);
  const corruptUnlock = await L.toastText(page);
  const unchanged = JSON.stringify(await storedItem(page, 'sp_privat', 't_bad')) === JSON.stringify(before);
  const ok = wrong.toast === 'Falscher PIN' && !wrong.preview && /beschädigt/.test(corrupt.toast) && !corrupt.preview && /beschädigt/.test(corruptUnlock) && unchanged;
  return {status:ok?'PASS':'FAIL', expected:'Falscher PIN → „Falscher PIN“; beschädigte Daten → „… beschädigt …“; keine Vorschau; Karte unverändert',
    observed:`falscher PIN: Toast "${wrong.toast}", Vorschau=${wrong.preview}; beschädigt: Toast "${corrupt.toast}", Vorschau=${corrupt.preview}; PIN entfernen: "${corruptUnlock}"; unverändert=${unchanged}`};
});

// ===================== S4 · PIN crypto =====================
test('C1', 'S4 · Testvektoren', 'Format-Kompatibilität in beide Richtungen: Node-Vektor → App, App → Node-Referenz', async()=>{
  const {page} = await seeded();
  // App → reference
  const plain = SEED.data.sp_recherche.items.t_notes.data;
  await lockWithPin(page, T('t_notes'), '2468'); await settle(page,1800);
  const enc = (await storedItem(page, 'sp_recherche', 't_notes'))?.encData;
  let refPlain = null; try{ refPlain = await refDecrypt(enc, '2468'); }catch(e){ refPlain = 'FEHLER '+e.message; }
  const shape = enc && Buffer.from(enc.salt,'base64').length === 16 && Buffer.from(enc.iv,'base64').length === 12;
  // legacy vector (Node, R00 seed format) → app
  await ctxMenu(page, T('t_locked')); await ctxClick(page, 'PIN entfernen'); await enterPin(page, '1234'); await settle(page,1800);
  const unlocked = await storedItem(page, 'sp_recherche', 't_locked');
  const ok = refPlain === plain && shape && unlocked?.data === LOCKED_PLAIN && !unlocked.locked && !unlocked.encData && unlocked.type === 'text';
  return {status:ok?'PASS':'FAIL', expected:'Referenz entschlüsselt App-Chiffrat (Salt 16 B, IV 12 B); App entsperrt Seed-Vektor (PIN 1234) zum Originaltext',
    observed:`Referenz=Original ${refPlain===plain}; Salt/IV-Längen ok=${shape}; Seed entsperrt=${unlocked?.data===LOCKED_PLAIN}, Felder entfernt=${!unlocked?.locked && !unlocked?.encData}`};
});
test('C1b', 'S4 · PIN bytegenau', 'PIN mit Leerzeichen und NFC-Umlaut: nur die exakte Eingabe entsperrt', async()=>{
  const pin = ' 1é3 '; // leading/trailing space, é as U+00E9 (NFC)
  const st = clone(SEED);
  st.data.sp_recherche.items.t_locked = await lockedOf(LOCKED_PLAIN, pin, SEED.data.sp_recherche.items.t_locked);
  const {page} = await seeded(st);
  const attempt = async p => { await clearToast(page); await page.click(T('t_locked')); await enterPin(page, p); await settle(page,1500);
    const ok = await shown(page,'#previewOverlay'); const t = await L.toastText(page); if(ok){ await page.keyboard.press('Escape'); await settle(page,200); } return ok ? 'entsperrt' : t; };
  const r = {trimmed:await attempt(pin.trim()), nfd:await attempt(pin.normalize('NFD')), exact:await attempt(pin)};
  const ok = r.trimmed === 'Falscher PIN' && r.nfd === 'Falscher PIN' && r.exact === 'entsperrt';
  return {status:ok?'PASS':'FAIL', expected:'getrimmt → Falscher PIN; NFD → Falscher PIN; exakt → entsperrt', observed:JSON.stringify(r)};
});
test('C2', 'S4 · N2 große Dateien', 'Großes Bild (~1,4 MB) und große Datei (~600 KB) sperren, extern prüfen, ansehen, entsperren', async()=>{
  const {page, pageErrors} = await open({});
  const png = noisePng(700, 700), bin = randomBytes(600*1024);
  await page.setInputFiles('#fileInput', [{name:'gross.png', mimeType:'image/png', buffer:png}]); await settle(page,1200);
  await page.setInputFiles('#fileInput', [{name:'gross.bin', mimeType:'application/octet-stream', buffer:bin}]); await settle(page,1200);
  const st0 = await L.storedState(page); const sid = st0.activeSpaceId;
  const byName = n => Object.values(st0.data[sid].items).find(i=>i.name===n);
  const img = byName('gross.png'), file = byName('gross.bin');
  const out = [];
  for(const [it, pin] of [[img, '7070'], [file, '8080']]){
    await clearToast(page); await lockWithPin(page, T(it.id), pin); await settle(page,2500);
    const s = await storedItem(page, sid, it.id);
    let ref = null; try{ ref = await refDecrypt(s.encData, pin); }catch(e){ ref = null; }
    out.push({name:it.name, toast:await L.toastText(page), locked:s?.locked === true && s.data === null, refOk:ref === it.data, dataChars:it.data.length, cipherChars:s?.encData?.cipher?.length || 0});
  }
  await page.click(T(img.id)); await enterPin(page, '7070'); await page.waitForSelector('#previewOverlay.show', {timeout:15000}).catch(()=>{});
  const imgW = await page.$eval('#previewBody img', e=>e.complete ? e.naturalWidth : -1).catch(()=>0);
  await page.keyboard.press('Escape'); await settle(page,300);
  await ctxMenu(page, T(file.id)); await ctxClick(page, 'PIN entfernen'); await enterPin(page, '8080'); await settle(page,2500);
  const restored = await storedItem(page, sid, file.id);
  const dl = await captureDownload(page, async()=>{ await ctxMenu(page, T(file.id)); await subClick(page, 'Herunterladen'); });
  const ok = out.every(o=>o.locked && o.refOk && /PIN-Sperre gespeichert|gesperrt/.test(o.toast)) && imgW === 700 && restored?.data === file.data && !!dl && Buffer.compare(dl.buf, bin) === 0;
  return {status:ok?'PASS':'FAIL', expected:'Beide Karten verschlüsselt (Referenz = Original), Bild nach PIN sichtbar, Datei nach Entsperren byte-identisch',
    observed:out.map(o=>`${o.name}: ${o.dataChars} Zeichen → Chiffrat ${o.cipherChars}, gesperrt=${o.locked}, Referenz=Original ${o.refOk}, Toast "${o.toast}"`).join('; ')+`; Bildbreite nach PIN=${imgW}; Datei entsperrt identisch=${restored?.data===file.data}; Download identisch=${!!dl && Buffer.compare(dl.buf, bin)===0}; Seitenfehler=${JSON.stringify(pageErrors.slice(-1))}`};
});
test('C3', 'S4 · Grenze', 'Sperren einer Karte, deren Chiffrat nicht mehr in den lokalen Speicher passt', async()=>{
  const chars = 3_500_000, id = 'f_riesig';
  const st = {schemaVersion:1, spaces:[{id:'sp_gross', name:'Groß', sortMode:'manual'}], activeSpaceId:'sp_gross',
    data:{sp_gross:{itemIds:[id], items:{[id]:{id, type:'file', name:'riesig.bin', mime:'application/octet-stream', size:Math.floor(chars*0.75), timestamp:1, data:'data:application/octet-stream;base64,'+'QUJD'.repeat(chars/4)}}}}};
  const {page, pageErrors} = await seeded(st);
  const before = await page.evaluate(k=>localStorage.getItem(k), KEY);
  await clearToast(page); await lockWithPin(page, T(id), '4242'); await settle(page,3000);
  const toast = await L.toastText(page);
  const sameStored = await page.evaluate(k=>localStorage.getItem(k), KEY) === before;
  const card = await page.$eval(`#grid .card[data-id="${id}"]`, e=>!!e.querySelector('.locked-thumb'));
  await clearToast(page); await page.mouse.click(5,5); await page.keyboard.press('ControlOrMeta+z'); await settle(page,400);
  const undo = await L.toastText(page);
  const ok = /Sperren nicht möglich/.test(toast) && sameStored && !card && undo === 'Nichts zum Rückgängigmachen';
  return {status:ok?'PASS':'FAIL', expected:'Klare Meldung, Karte unverändert, kein Undo-Eintrag',
    observed:`Toast="${toast}"; gespeichert unverändert=${sameStored}; UI gesperrt=${card}; Strg+Z: "${undo}"; Seitenfehler=${JSON.stringify(pageErrors.slice(-1))}`};
});
test('C4', 'S4 · Verschlüsselungsfehler', 'crypto.subtle.encrypt schlägt fehl: keine halbe Sperre, kein Erfolg, kein Undo-Eintrag', async()=>{
  const {page, pageErrors} = await seeded();
  const before = await storedItem(page, 'sp_recherche', 't_notes');
  await page.evaluate(()=>{ crypto.subtle.encrypt = async()=>{ throw new DOMException('simuliert', 'OperationError'); }; });
  await clearToast(page); await lockWithPin(page, T('t_notes'), '1357'); await settle(page,1800);
  const toast = await L.toastText(page);
  const after = await storedItem(page, 'sp_recherche', 't_notes');
  const uiLocked = await page.$eval('#grid .card[data-id="t_notes"]', e=>!!e.querySelector('.locked-thumb'));
  await clearToast(page); await page.mouse.click(5,5); await page.keyboard.press('ControlOrMeta+z'); await settle(page,400);
  const undo = await L.toastText(page);
  const ok = /Sperren fehlgeschlagen/.test(toast) && JSON.stringify(after) === JSON.stringify(before) && !uiLocked && undo === 'Nichts zum Rückgängigmachen';
  return {status:ok?'PASS':'FAIL', expected:'„Sperren fehlgeschlagen · Karte bleibt unverändert“; gespeichert und UI unverändert; Strg+Z: nichts rückgängig zu machen',
    observed:`Toast="${toast}"; gespeichert unverändert=${JSON.stringify(after)===JSON.stringify(before)}; UI gesperrt=${uiLocked}; Strg+Z: "${undo}"; Seitenfehler=${JSON.stringify(pageErrors.slice(-1))}`};
});
test('C5', 'S4 · Legacy-Backups', 'Backup v1 und Legacy-Rohformat mit PIN-Karten importieren und entsperren', async()=>{
  const out = [];
  for(const [label, payload] of [['Backup v1', {format:'copyboard-backup', version:1, state:SEED}], ['Legacy-Rohformat', SEED]]){
    const {page} = await open({});
    await importFile(page, payload);
    await page.click(T('t_locked')); await enterPin(page, '1234'); await page.waitForSelector('#previewOverlay.show', {timeout:8000}).catch(()=>{});
    const body = await page.$eval('#previewBody', e=>e.innerText).catch(()=>'');
    out.push([label, body.includes(LOCKED_PLAIN)]);
  }
  const ok = out.every(([, v])=>v);
  return {status:ok?'PASS':'FAIL', expected:'PIN-Karte aus beiden Formaten mit PIN 1234 lesbar', observed:out.map(([l, v])=>`${l}: ${v}`).join('; ')};
});

// ============ RUN ============
await L.launch();
for(const t of tests){
  if(only && !only.test(t.id)) continue;
  const t0 = Date.now();
  let r;
  try{ r = await t.fn(); }
  catch(e){ r = {status:'FAIL', expected:'', observed:'Harness-/Testfehler: '+String(e.message||e).split('\n')[0]}; }
  while(openContexts.length){ await openContexts.pop().close().catch(()=>{}); }
  results.push({id:t.id, covers:t.covers, title:t.title, ...r, ms:Date.now()-t0});
  console.log(`${t.id} [${r.status}] ${t.title}\n    → ${r.observed}`);
}
await L.close();
const external = [...L.EXTERNAL];
const outFile = path.join(EVIDENCE_DIR, `r02-results-${LABEL}${only ? '-'+process.argv[2].replace(/[^\w-]/g,'_') : ''}.json`);
fs.writeFileSync(outFile, JSON.stringify({generatedAt:new Date().toISOString(), base:L.BASE, label:LABEL, browser:'Chromium (Playwright, headless)', results, externalHostsRequested:external,
  supabaseContacted:external.some(h=>/supabase\.co$/.test(h)), note:'All external hosts intercepted (aborted or served locally); Supabase replaced by an in-memory mock; synthetic data only.'}, null, 2));
console.log('written', outFile);
