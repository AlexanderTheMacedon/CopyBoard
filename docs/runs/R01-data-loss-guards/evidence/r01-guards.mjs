// CopyBoard R01 — Data-Loss Guards acceptance suite (A1–A10 + supplementary checks).
// Test evidence only. Not part of the application and not loaded by index.html.
//
// Safety model (inherited from ../harness/qa-lib.mjs, copied unchanged from audit commit 33600a1):
//  - Fresh, isolated Chromium contexts; only synthetic data.
//  - Every request outside CB_BASE is intercepted. Supabase is replaced by an in-memory mock
//    living in this Node process; *.supabase.co is never contacted.
//
// Usage:
//   CB_BASE=http://127.0.0.1:8766/ R01_LABEL=r01 PLAYWRIGHT_PATH=… JSZIP_PATH=… node r01-guards.mjs [idRegex]
// Status vocabulary: PASS | FAIL | SKIP | RISK (documented residual risk, not a pass)
import * as L from '../harness/qa-lib.mjs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVIDENCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(EVIDENCE_DIR, '../../../..');
const LABEL = process.env.R01_LABEL || 'run';
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const KEY = 'copyboard_state_v1';
const USER = {id:'00000000-0000-4000-8000-0000000000aa', email:'r01@example.invalid'};
const SEED = await L.seedState();
const sha = s => createHash('sha256').update(s, 'utf8').digest('hex');
const settle = (page, ms=400) => page.waitForTimeout(ms);
const tests = [];
const results = [];
const openContexts = [];
const test = (id, covers, title, fn) => tests.push({id, covers, title, fn});

async function open(opts={}){
  const app = await L.openApp(opts);
  app.page.setDefaultTimeout(10000);
  openContexts.push(app.context);
  return app;
}
const raw = page => page.evaluate(k=>localStorage.getItem(k), KEY);
const bannerShown = page => page.$eval('#persistBlockedBanner', el=>!el.hidden).catch(()=>false);
const bannerText = page => page.$eval('#persistBlockedText', el=>el.textContent).catch(()=>'');
const status = page => page.$eval('#autosaveStatus', el=>el.innerText.replace(/\n/g,' '));
const cardCount = async page => (await L.cardIds(page)).length;
const storedItemCount = s => s ? Object.values(s.data).reduce((n,d)=>n+Object.keys(d.items).length,0) : 0;
const storedTexts = s => s ? Object.values(s.data).flatMap(d=>Object.values(d.items).map(i=>i.data)).filter(v=>typeof v === 'string' && v.length < 1000) : [];
async function waitTabs(page){ await page.waitForFunction(()=>document.querySelectorAll('#tabsScroll .tab').length>0, null, {timeout:10000}); await settle(page,300); }
async function palette(page, text){
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#paletteOverlay.show');
  await page.waitForFunction(()=>document.activeElement?.id==='paletteInput');
  await page.fill('#paletteInput', text); await settle(page,150);
}
async function importBackup(page, payload){
  const fc = page.waitForEvent('filechooser');
  await palette(page, 'Board importieren'); await page.keyboard.press('Enter');
  await (await fc).setFiles({name:'backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(payload))});
  await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,900);
}
async function download(page, selector){
  const dl = page.waitForEvent('download', {timeout:5000});
  dl.catch(()=>{}); // the button may not exist (baseline run); the click below then throws instead
  await page.click(selector, {timeout:3000});
  const d = await dl;
  return fs.readFileSync(await d.path(), 'utf8');
}
// Free localStorage capacity (UTF-16 chars) for one additional value; probe key is removed again.
function measureFree(page){
  return page.evaluate(()=>{ let lo=0, hi=12*1024*1024; while(lo<hi){ const mid=Math.ceil((lo+hi)/2); try{ localStorage.setItem('__r01_probe','a'.repeat(mid)); lo=mid; }catch(e){ hi=mid-1; } } localStorage.removeItem('__r01_probe'); return lo; });
}
function fillStorage(page, chars){ return page.evaluate(n=>localStorage.setItem('__r01_filler','f'.repeat(n)), chars); }
const noisePng = () => L.makePng(700, 700, ()=>[Math.random()*255|0, Math.random()*255|0, Math.random()*255|0]);
async function addPng(page, name){ await page.setInputFiles('#fileInput', [{name, mimeType:'image/png', buffer:noisePng()}]); await settle(page,900); }
// Synthetic board of roughly `chars` serialized characters (file items with dummy base64).
function bigState(chars, label='gross'){
  const per = 1_000_000, items = {}, itemIds = [];
  for(let i=0, left=chars; left>0; i++, left-=per){
    const n = Math.min(per, left), id = `f_${label}_${i}`;
    items[id] = {id, type:'file', name:`${label}-${i}.bin`, mime:'application/octet-stream', size:Math.floor(n*0.75), timestamp:1, data:'data:application/octet-stream;base64,'+'QUJD'.repeat(Math.ceil(n/4))};
    itemIds.push(id);
  }
  return {schemaVersion:1, spaces:[{id:'sp_gross', name:'Großes Board', sortMode:'manual'}], activeSpaceId:'sp_gross', data:{sp_gross:{itemIds, items}}};
}
function putRemote(backend, state, revision, device='device-other'){
  const text = JSON.stringify(state), p = `${USER.id}/snapshots/${revision}-${device}.json`;
  backend.objects.set(p, text);
  backend.meta.set(USER.id, {owner_id:USER.id, revision, object_path:p, content_hash:sha(text), state_bytes:text.length, updated_at:new Date().toISOString(), updated_by_device:device});
  return p;
}
const writes = (backend, from=0) => backend.log.slice(from).filter(l=>['upload','rpc','remove'].includes(l.op)).map(l=>l.op);

// ============ G1 · I-35 ============
const unreadableCases = [
  ['A1', 'schemaVersion:2', JSON.stringify({...SEED, schemaVersion:2})],
  ['A2', 'abgeschnittenes JSON', JSON.stringify(SEED).slice(0,5000)],
  ['A2b', 'settings.schemaVersion:2', JSON.stringify({...SEED, settings:{...SEED.settings, schemaVersion:2}})],
  ['A2c', 'JSON-Array statt Objekt', '[1,2,3]'],
];
for(const [id, label, original] of unreadableCases){
  test(id, 'G1 · I-35', `Gespeicherter State: ${label} — Start, 5 s, Paste-Versuch, Rohdaten-Export, Reload`, async()=>{
    const backend = L.createCloudBackend();
    const {page} = await open({storage:{[KEY]:original, copyboard_autosave_pref:'1'}, cloud:{backend, user:USER}});
    const afterStart = await raw(page) === original;
    const shown = await bannerShown(page), text = await bannerText(page);
    await settle(page, 5000);
    const after5s = await raw(page) === original;
    await L.dispatchPaste(page, 'R01 Paste-Versuch '+id); await settle(page,600);
    const pasteToast = await L.toastText(page);
    const pasteRejected = await cardCount(page) === 0 && await raw(page) === original;
    const exported = await download(page, '#persistRawExportBtn').catch(e=>'ERR '+e.message);
    const exportOk = exported === original;
    const st = await status(page);
    await page.reload(); await waitTabs(page); await settle(page,1500);
    const afterReload = await raw(page) === original;
    const shownAfterReload = await bannerShown(page);
    const cloudWrites = writes(backend).length, cloudOps = backend.log.length;
    const ok = afterStart && after5s && pasteRejected && exportOk && afterReload && shown && shownAfterReload && cloudOps === 0 && !/Gespeichert/.test(st);
    return {status:ok?'PASS':'FAIL', expected:'Key byte-identisch nach Start, 5 s, Paste und Reload; Hinweis sichtbar; Paste abgelehnt; Rohdaten-Export = Original; keine Cloud-Operation',
      observed:`identisch: Start=${afterStart}, 5s=${after5s}, Reload=${afterReload}; Hinweis=${shown}/${shownAfterReload} "${text}"; Paste abgelehnt=${pasteRejected} (Toast "${pasteToast}"); Export=Original: ${exportOk} (${exported.length} Zeichen); Status="${st}"; Cloud-Operationen=${cloudOps} (Schreibend ${cloudWrites})`};
  });
}

// ============ G2 · I-36 ============
test('A3', 'G2 · I-36', 'Rausch-PNGs bis zur Grenze: Ablehnung vor dem Fehlschlag, Kartenzahl UI = gespeichert = nach Reload', async()=>{
  const {page} = await open({});
  const log = []; let everFailed = false, rejectedAt = null;
  for(let i=0;i<4;i++){
    const before = await cardCount(page);
    await addPng(page, `rauschen-${i}.png`);
    const st = await status(page), toast = await L.toastText(page), after = await cardCount(page);
    if(/fehlgeschlagen/.test(st)) everFailed = true;
    if(after === before && rejectedAt === null) rejectedAt = i+1;
    log.push(`#${i+1}: Karten ${after}, Status "${st}", Toast "${toast}"`);
  }
  const ui = await cardCount(page), stored = storedItemCount(await L.storedState(page)), chars = (await raw(page)).length;
  await page.reload(); await waitTabs(page);
  const reload = await cardCount(page);
  const ok = !everFailed && rejectedAt !== null && ui === stored && stored === reload;
  return {status:ok?'PASS':'FAIL', expected:'Erfassung wird vor dem echten Quota-Fehler abgelehnt; keine Karte geht beim Reload verloren',
    observed:`${log.join('; ')}; abgelehnt bei Bild ${rejectedAt}; Speichern je fehlgeschlagen=${everFailed}; UI=${ui}, gespeichert=${stored} (${chars} Zeichen), nach Reload=${reload}`};
});
let quotaPage = null; // shared by A3b → A4
test('A3b', 'G2 · I-36 / Save-ACK', 'Echter Quota-Fehler (Speicher künstlich verknappt): dauerhafter Hinweis, kein "Gespeichert", Erfassung gesperrt, RAM-Export rettet', async()=>{
  const app = await open({});
  const page = app.page; quotaPage = app;
  await addPng(page, 'bild-1.png');
  const imgChars = (await raw(page)).length;
  const free = await measureFree(page);
  await fillStorage(page, Math.max(0, free - Math.floor(imgChars/2)));
  const storedBefore = await raw(page);
  await addPng(page, 'bild-2.png');
  const shown = await bannerShown(page), text = await bannerText(page), st = await status(page);
  const storedUnchanged = await raw(page) === storedBefore;
  const uiCards = await cardCount(page);
  await L.dispatchPaste(page, 'R01 Text bei vollem Speicher'); await settle(page,600);
  const pasteToast = await L.toastText(page);
  const pasteRejected = await cardCount(page) === uiCards;
  const backup = JSON.parse(await download(page, '#persistBackupExportBtn'));
  const backupItems = storedItemCount(backup.state);
  const leaveWarns = await page.evaluate(()=>{ const e = new Event('beforeunload', {cancelable:true}); window.dispatchEvent(e); return e.defaultPrevented; });
  const ok = shown && /voll/.test(text) && /fehlgeschlagen/.test(st) && !/Gespeichert/.test(st) && storedUnchanged && pasteRejected && backupItems === 2 && leaveWarns;
  return {status:ok?'PASS':'FAIL', expected:'setItem-Fehler → Sperre quota, dauerhafter Hinweis, gespeicherter Stand unverändert, neue Erfassung abgelehnt, Backup aus RAM enthält ungespeicherte Karte',
    observed:`Hinweis=${shown} "${text}"; Status="${st}"; gespeicherter Stand unverändert=${storedUnchanged}; UI-Karten=${uiCards}; Paste abgelehnt=${pasteRejected} (Toast "${pasteToast}"); RAM-Backup Karten=${backupItems} (Format ${backup.format} v${backup.version}); Verlassen-Warnung=${leaveWarns}`};
});
test('A4', 'G2 · Quota-Recovery-Commit', 'Wie A3b, dann gespeicherte Karte löschen: verifizierter Save hebt Sperre auf, Erfassung wieder möglich', async()=>{
  if(!quotaPage) return {status:'SKIP', expected:'', observed:'A3b nicht gelaufen'};
  const {page} = quotaPage;
  const ids = await L.cardIds(page);
  const oldest = ids[ids.length-1];
  await page.click(`#grid .card[data-id="${oldest}"] .btn-del`);
  if(await page.$eval('#confirmOverlay', e=>e.classList.contains('show'))) await page.click('#confirmOkBtn');
  await settle(page,900);
  const shown = await bannerShown(page), st = await status(page);
  const stored1 = await L.storedState(page);
  const savedUnsavedImage = storedItemCount(stored1) === 1 && !stored1.data[stored1.activeSpaceId].items[oldest];
  await L.dispatchPaste(page, 'R01 Text nach Freigabe'); await settle(page,700);
  const stored2 = await L.storedState(page);
  const pasteSaved = storedTexts(stored2).includes('R01 Text nach Freigabe');
  const ui = await cardCount(page);
  await page.reload(); await waitTabs(page);
  const reload = await cardCount(page);
  const ok = !shown && /Gespeichert/.test(st) && savedUnsavedImage && pasteSaved && ui === reload && reload === 2;
  return {status:ok?'PASS':'FAIL', expected:'Löschen bleibt erlaubt; nächster verifizierter Save (inkl. der zuvor ungespeicherten Karte) hebt die Sperre auf; Erfassung danach wieder möglich',
    observed:`Hinweis nach Löschen=${shown}; Status="${st}"; gespeichert: zuvor ungespeichertes Bild übernommen=${savedUnsavedImage}; neuer Paste gespeichert=${pasteSaved}; UI=${ui}, nach Reload=${reload}`};
});
test('S1', 'G2 · Save-ACK vs. Zeitstempel', 'Schreiben von copyboard_autosave_last_saved scheitert, State-Write gelingt', async()=>{
  const {page, context} = await open({});
  await context.addInitScript(()=>{
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){ if(k === 'copyboard_autosave_last_saved') throw new DOMException('simuliert', 'QuotaExceededError'); return orig.call(this, k, v); };
  });
  await page.reload(); await waitTabs(page);
  await L.dispatchPaste(page, 'R01 Zeitstempel-Test'); await settle(page,700);
  const st = await status(page), shown = await bannerShown(page);
  const saved = storedTexts(await L.storedState(page)).includes('R01 Zeitstempel-Test');
  const ok = saved && /Gespeichert/.test(st) && !shown;
  return {status:ok?'PASS':'FAIL', expected:'State gespeichert → Status "Gespeichert"; gescheiterter Zeitstempel ist kein Save-Fehler',
    observed:`State gespeichert=${saved}; Status="${st}"; Sperr-Hinweis=${shown}`};
});

// ============ G3 · N4 ============
test('A5', 'G3 · N4', 'Board mit 3,3 M Zeichen, Backup-Import, Recovery-Kopie passt nicht in den Speicher', async()=>{
  const {page} = await open({storage:L.seededStorage(bigState(3_300_000))});
  const before = await raw(page);
  await importBackup(page, {format:'copyboard-backup', version:1, stateSchemaVersion:1, exportedAt:new Date().toISOString(), state:SEED});
  const toast = await L.toastText(page);
  await settle(page,600);
  const after = await raw(page);
  const recovery = await page.evaluate(()=>localStorage.getItem('copyboard_preimport_recovery_v1') !== null);
  const uiStillOld = (await L.cardIds(page)).every(id=>id.startsWith('f_gross_'));
  const ok = after === before && /Import abgebrochen/.test(toast) && uiStillOld;
  return {status:ok?'PASS':'FAIL', expected:'Import abgebrochen, gespeichertes Board byte-identisch, Toast nennt Grund',
    observed:`Board ${before.length} Zeichen; nach Import byte-identisch=${after === before}; UI zeigt alten Stand=${uiStillOld}; Recovery-Key vorhanden=${recovery}; Toast="${toast}"`};
});
test('A5b', 'G3 · N4 (Cloud)', 'Manuelles "Aktualisieren" bei lokalen Änderungen, Recovery-Kopie passt nicht', async()=>{
  const backend = L.createCloudBackend();
  const {page} = await open({storage:L.seededStorage(bigState(3_300_000)), cloud:{backend, user:USER}});
  await page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced', null, {timeout:15000});
  putRemote(backend, SEED, 2);
  await L.dispatchPaste(page, 'R01 lokale Änderung'); await settle(page,2500);
  const banner = await page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show'));
  const before = await raw(page), logFrom = backend.log.length;
  await page.click('#cloudUpdateBtn'); await page.waitForSelector('#confirmOverlay.show'); await page.click('#confirmOkBtn'); await settle(page,1500);
  const toast = await L.toastText(page);
  const after = await raw(page);
  const keptLocal = storedTexts(await L.storedState(page)).includes('R01 lokale Änderung');
  const ok = banner && after === before && keptLocal && /abgebrochen/.test(toast) && backend.meta.get(USER.id).revision === 2 && writes(backend, logFrom).length === 0;
  return {status:ok?'PASS':'FAIL', expected:'Laden abgebrochen, lokaler Stand inkl. ungesyncter Änderung byte-identisch, Cloud unverändert',
    observed:`Update-Banner=${banner}; lokal byte-identisch=${after === before}; lokale Änderung erhalten=${keptLocal}; Toast="${toast}"; Cloud-Revision=${backend.meta.get(USER.id).revision}; Cloud-Schreibops danach=${JSON.stringify(writes(backend, logFrom))}`};
});

// ============ G4 · N3 / N3b ============
test('A6', 'G4 · N3', 'Mock-Snapshot 6,3 M Zeichen, leeres Gerät, danach Reload', async()=>{
  const backend = L.createCloudBackend();
  const p1 = putRemote(backend, bigState(6_300_000, 'cloud'), 1);
  const {page} = await open({cloud:{backend, user:USER}});
  await settle(page,3000);
  const st1 = await page.$eval('#cloudToggle', e=>e.dataset.state+' / '+e.title);
  const meta1 = await page.evaluate(k=>localStorage.getItem(k), 'copyboard_cloud_meta_v1:'+USER.id);
  const localChars1 = (await raw(page) || '').length;
  await page.reload(); await waitTabs(page); await settle(page,3000);
  const st2 = await page.$eval('#cloudToggle', e=>e.dataset.state+' / '+e.title);
  const rev = backend.meta.get(USER.id).revision, objKept = backend.objects.has(p1), w = writes(backend);
  const ok = rev === 1 && objKept && w.length === 0 && meta1 === null && !/synced/.test(st1);
  return {status:ok?'PASS':'FAIL', expected:'Snapshot nicht angewendet; Backend-Revision bleibt 1; Originalobjekt bleibt; kein Upload; keine Cloud-Meta',
    observed:`Status Start="${st1}"; nach Reload="${st2}"; lokale Cloud-Meta=${meta1}; lokaler State ${localChars1} Zeichen; Backend-Revision=${rev}; Originalobjekt vorhanden=${objKept}; Cloud-Schreibops=${JSON.stringify(w)}`};
});
test('A6b', 'G4 · Abort/Restore', 'Synchronisiertes Gerät, neuer Cloud-Stand (3 M) passt nicht in den verknappten Speicher → Rollback', async()=>{
  const backend = L.createCloudBackend();
  const first = await open({storage:L.seededStorage(SEED), cloud:{backend, user:USER}});
  await first.page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced', null, {timeout:15000});
  const ls = await first.page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  const free = await measureFree(first.page);
  await first.context.close();
  const p2 = putRemote(backend, bigState(3_000_000, 'neu'), 2);
  const logFrom = backend.log.length;
  const filler = Math.max(0, free - 700_000);
  const {page} = await open({storage:{...ls, __r01_filler:'f'.repeat(filler)}, cloud:{backend, user:USER}});
  await settle(page,3500);
  const metaKey = 'copyboard_cloud_meta_v1:'+USER.id;
  const check = async()=>({
    localSame: await raw(page) === ls[KEY],
    metaSame: await page.evaluate(k=>localStorage.getItem(k), metaKey) === ls[metaKey],
    ui: (await L.cardIds(page)).includes('t_notes'),
    banner: await bannerShown(page),
    st: await page.$eval('#cloudToggle', e=>e.dataset.state+' / '+e.title)
  });
  const c1 = await check();
  await page.reload(); await waitTabs(page); await settle(page,3500);
  const c2 = await check();
  const w = writes(backend, logFrom), rev = backend.meta.get(USER.id).revision, objKept = backend.objects.has(p2);
  const ok = [c1,c2].every(c=>c.localSame && c.metaSame && c.ui && !c.banner && !/synced/.test(c.st)) && w.length === 0 && rev === 2 && objKept;
  return {status:ok?'PASS':'FAIL', expected:'Lokaler Commit scheitert → vorheriger State aktiv, Meta unverändert, Status nennt Grund, kein Upload/Löschen, auch nach Reload',
    observed:`vor Reload ${JSON.stringify(c1)}; nach Reload ${JSON.stringify(c2)}; Backend-Revision=${rev}; Objekt rev2 vorhanden=${objKept}; Cloud-Schreibops=${JSON.stringify(w)}; Füller=${filler} Zeichen`};
});
test('A7', 'G4 · N3b', 'Gescheiterter Save, dann "Jetzt synchronisieren"', async()=>{
  const backend = L.createCloudBackend();
  const {page} = await open({storage:L.seededStorage(SEED), cloud:{backend, user:USER}});
  await page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced', null, {timeout:15000});
  const free = await measureFree(page);
  await fillStorage(page, Math.max(0, free - 200_000));
  await L.dispatchPaste(page, 'Q'.repeat(400_000)); await settle(page,800);
  const st = await status(page), shown = await bannerShown(page);
  const logFrom = backend.log.length, rev0 = backend.meta.get(USER.id).revision;
  await page.click('#cloudToggle'); await page.waitForSelector('#cloudOverlay.show');
  await page.click('#cloudSyncNowBtn'); await settle(page,2000);
  const label = await page.$eval('#cloudStatusLabel', e=>e.textContent);
  const w = writes(backend, logFrom), rev1 = backend.meta.get(USER.id).revision;
  const ok = w.length === 0 && rev1 === rev0 && /Upload angehalten/.test(label) && shown;
  return {status:ok?'PASS':'FAIL', expected:'Kein Upload, Revision unverändert, Status nennt den Grund',
    observed:`Autosave-Status="${st}"; Sperr-Hinweis=${shown}; Revision ${rev0}→${rev1}; Cloud-Schreibops=${JSON.stringify(w)}; Sync-Status="${label}"`};
});

// ============ G5 · N8 ============
async function twoTabs(){
  const A = await open({});
  const B = await A.context.newPage(); B.setDefaultTimeout(10000);
  await B.goto(L.BASE, {waitUntil:'load'}); await waitTabs(B);
  return {A:A.page, B, context:A.context};
}
test('A8', 'G5 · N8', 'Zwei Tabs, sequenziell: Tab A speichert, dann Paste im veralteten Tab B; danach Neu laden', async()=>{
  const {A, B} = await twoTabs();
  await L.dispatchPaste(A, 'Karte aus Tab A'); await settle(A,800);
  const bBlocked = await bannerShown(B), bText = await bannerText(B);
  await L.dispatchPaste(B, 'Karte aus Tab B (veraltet)'); await settle(B,800);
  const s1 = storedTexts(await L.storedState(A));
  const aKept = s1.includes('Karte aus Tab A'), staleRejected = !s1.includes('Karte aus Tab B (veraltet)');
  if(!bBlocked) return {status:'FAIL', expected:'Veralteter Tab wird gesperrt, überschreibt nichts', observed:`B gesperrt nach Write von A=false; Karte A erhalten=${aKept}; veralteter Paste in B gespeichert=${!staleRejected}`};
  await Promise.all([B.waitForNavigation({waitUntil:'load'}), B.click('#persistReloadBtn')]); await waitTabs(B);
  const bSeesA = (await B.$$eval('#grid .card', els=>els.length)) === 1 && !(await bannerShown(B));
  await L.dispatchPaste(B, 'Karte aus Tab B'); await settle(B,800);
  const aBlocked = await bannerShown(A);
  await A.reload(); await waitTabs(A); await settle(A,500);
  const s2 = storedTexts(await L.storedState(A));
  const both = s2.includes('Karte aus Tab A') && s2.includes('Karte aus Tab B');
  const aSees = await A.$$eval('#grid .card', els=>els.length);
  const ok = bBlocked && aKept && staleRejected && bSeesA && aBlocked && both && aSees === 2;
  return {status:ok?'PASS':'FAIL', expected:'Veralteter Tab wird gesperrt, überschreibt nichts; nach Neu laden sieht er den fremden Stand; beide Karten bleiben erhalten',
    observed:`B gesperrt nach Write von A=${bBlocked} "${bText}"; Karte A erhalten=${aKept}; veralteter Paste in B abgelehnt=${staleRejected}; B nach Neu laden sieht A und ist frei=${bSeesA}; A gesperrt nach Write von B=${aBlocked}; final beide Karten gespeichert=${both}; A zeigt nach Reload ${aSees} Karten`};
});
test('A8r', 'G5 · Restrisiko', 'Zwei Tabs, gleichzeitig (5 Durchläufe): echte Schreibrennen', async()=>{
  const out = []; let lost = 0;
  for(let i=0;i<5;i++){
    const {A, B, context} = await twoTabs();
    await Promise.all([L.dispatchPaste(A, `Race A ${i}`), L.dispatchPaste(B, `Race B ${i}`)]);
    await settle(A,900);
    const s = storedTexts(await L.storedState(A));
    const kept = [s.includes(`Race A ${i}`), s.includes(`Race B ${i}`)];
    const blocked = [await bannerShown(A), await bannerShown(B)];
    const silentLoss = kept.includes(false) && !blocked.some(Boolean);
    if(kept.includes(false)) lost++;
    out.push(`#${i+1}: gespeichert A/B=${kept.join('/')}, gesperrt A/B=${blocked.join('/')}${silentLoss?' STILL VERLOREN':''}`);
    await context.close();
  }
  return {status:'RISK', expected:'Keine Garantie in R01: storage-Events sind nicht atomar; echte Single-Writer-Sicherheit erst mit Web Locks (R05)',
    observed:`${out.join('; ')}; Durchläufe mit nicht gespeicherter Karte: ${lost}/5`,
    note:'Bei verlorener Karte ist der unterlegene Tab gesperrt und bietet RAM-Export; still ist der Verlust nur, wenn kein Tab gesperrt wurde.'};
});

// ============ R01.1 · ehrliche Erfolgsmeldungen (E1–E9) ============
// Edit toasts may claim "gespeichert" only after a verified local write. Toasts are read directly after
// the action, before any debounce could fire, so a stale success message cannot hide behind a later save.
const T = id => `#grid .card[data-id="${id}"] .thumb`;
async function ctxEdit(page, id){
  await page.click(T(id), {button:'right'}); await page.waitForSelector('#contextMenu.show');
  await page.click('#contextMenu .ctx-row:has-text("Inhalt bearbeiten")');
}
const claimsSaved = toast => /gespeichert/i.test(toast) && !/nicht gespeichert/i.test(toast);
const EDITS = {
  dialogText: async page=>{
    await ctxEdit(page, 't_notes'); await page.waitForSelector('#textOverlay.show');
    await page.fill('#textArea', 'R01.1 Dialog-Bearbeitung'); await page.click('#textOkBtn');
    return {id:'t_notes', expectRam:'R01.1 Dialog-Bearbeitung'};
  },
  inlineText: async page=>{
    await page.hover(T('t_code')); await page.click('#grid .card[data-id="t_code"] .inline-text-edit-trigger');
    await page.fill('.inline-text-editor textarea', 'R01.1 Inline-Bearbeitung'); await page.click('.inline-text-save');
    return {id:'t_code', expectRam:'R01.1 Inline-Bearbeitung'};
  },
  image: async page=>{
    await ctxEdit(page, 'i_grad'); await page.waitForSelector('#imageEditOverlay.show');
    await page.click('#rotateRightBtn'); await page.click('#imageEditSaveBtn');
    return {id:'i_grad'};
  },
  fileReplace: async page=>{
    const fc = page.waitForEvent('filechooser');
    await ctxEdit(page, 'f_csv');
    await (await fc).setFiles({name:'ersetzt.csv', mimeType:'text/csv', buffer:Buffer.from('r01;1\n')});
    await page.waitForFunction(()=>/Datei|ersetzt/.test(document.getElementById('toast').textContent), null, {timeout:5000}).catch(()=>{});
    return {id:'f_csv'};
  },
  stickyNote: async page=>{
    await page.click('#helpToggle'); await page.click('[data-help-panel="notes"]');
    await page.fill('#helpNoteInput', 'R01.1 Sticky Note'); await page.click('#helpNoteAddBtn');
    return {note:'R01.1 Sticky Note'};
  },
  defaultSort: async page=>{
    await page.click('#helpToggle'); await page.click('[data-help-panel="settings"]');
    await page.selectOption('#helpDefaultSortSelect', 'name');
    return {};
  },
};
// Fills the origin almost completely and pastes a card that cannot be written → quota block with unsaved RAM state.
async function openQuotaBlocked(){
  const app = await open({storage:L.seededStorage(SEED)});
  const free = await measureFree(app.page);
  await fillStorage(app.page, Math.max(0, free - 20_000));
  await L.dispatchPaste(app.page, 'Q'.repeat(60_000)); await settle(app.page,700);
  return app;
}
for(const [id, edit, label] of [['E1','dialogText','Text (Dialog)'],['E2','inlineText','Text (inline)'],['E3','image','Bild drehen'],['E4','fileReplace','Datei ersetzen'],['E5','stickyNote','Sticky Note'],['E5b','defaultSort','Standardsortierung']]){
  test(id, 'R01.1 · Quota-Sperre', `Bearbeitung während Quota-Sperre: ${label} — kein "gespeichert", Stand unverändert, RAM behält Änderung`, async()=>{
    const {page} = await openQuotaBlocked();
    const blocked = await bannerShown(page), storedBefore = await raw(page);
    const info = await EDITS[edit](page);
    const toast = await L.toastText(page);
    await settle(page,600);
    const storedSame = await raw(page) === storedBefore, st = await status(page), still = await bannerShown(page);
    let ramOk = true;
    if(await page.$('#helpOverlay.show')) await page.click('#helpCloseBtn');
    if(info.expectRam || info.note){
      const backup = JSON.parse(await download(page, '#persistBackupExportBtn'));
      ramOk = info.note ? backup.state.helpNotes.some(n=>n.text === info.note) : backup.state.data.sp_recherche.items[info.id].data === info.expectRam;
    }
    const ok = blocked && !claimsSaved(toast) && /übernommen · Speichern fehlgeschlagen/.test(toast) && storedSame && still && /fehlgeschlagen/.test(st) && ramOk;
    return {status:ok?'PASS':'FAIL', expected:'Toast "… übernommen · Speichern fehlgeschlagen", kein "gespeichert"; gespeicherter Stand byte-identisch; Hinweis und Status bleiben; Änderung im RAM-Backup',
      observed:`Sperre vorher=${blocked}; Toast="${toast}"; gespeichert byte-identisch=${storedSame}; Hinweis danach=${still}; Status="${st}"; Änderung im RAM-Backup=${ramOk}`};
  });
}
test('E6', 'R01.1 · Fremd-Tab-Sperre', 'Zwei Tabs sequenziell: Bearbeitung im gesperrten Tab B meldet "Speichern gesperrt" und überschreibt nichts', async()=>{
  const A = await open({storage:L.seededStorage(SEED)});
  const B = await A.context.newPage(); B.setDefaultTimeout(10000);
  await B.goto(L.BASE, {waitUntil:'load'}); await waitTabs(B);
  await L.dispatchPaste(A.page, 'Karte aus Tab A'); await settle(A.page,800);
  const bBlocked = await bannerShown(B), storedBefore = await raw(A.page);
  await EDITS.dialogText(B);
  const toast = await L.toastText(B);
  await settle(B,600);
  const storedSame = await raw(A.page) === storedBefore;
  const ok = bBlocked && !claimsSaved(toast) && /Speichern gesperrt/.test(toast) && storedSame;
  return {status:ok?'PASS':'FAIL', expected:'Toast "Text übernommen · Speichern gesperrt"; Stand von Tab A byte-identisch',
    observed:`B gesperrt=${bBlocked}; Toast="${toast}"; Stand von A byte-identisch=${storedSame}`};
});
test('E7', 'R01.1 · verworfener Write', 'setItem verwirft den State-Write still (kein Fehler): Read-back erkennt es, Bearbeitung meldet kein "gespeichert"', async()=>{
  const {page, context} = await open({storage:L.seededStorage(SEED)});
  await context.addInitScript(k=>{
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, v){ if(key === k && window.__r01DropWrites) return; return orig.call(this, key, v); };
  }, KEY);
  await page.reload(); await waitTabs(page);
  const storedBefore = await raw(page);
  await page.evaluate(()=>{ window.__r01DropWrites = true; });
  await EDITS.dialogText(page);
  const toast = await L.toastText(page);
  await settle(page,600);
  const storedSame = await raw(page) === storedBefore, st = await status(page), shown = await bannerShown(page);
  const ok = !claimsSaved(toast) && /Speichern fehlgeschlagen/.test(toast) && storedSame && shown && /fehlgeschlagen/.test(st);
  return {status:ok?'PASS':'FAIL', expected:'Kein "gespeichert"-Toast; Status "Speichern fehlgeschlagen"; dauerhafter Hinweis',
    observed:`Toast="${toast}"; gespeichert unverändert=${storedSame}; Status="${st}"; Hinweis=${shown}`};
});
test('E8', 'R01.1 · Positivkontrolle', 'Normale Bearbeitung: "gespeichert" erscheint erst, wenn der Write schon verifiziert im Speicher steht', async()=>{
  const {page} = await open({storage:L.seededStorage(SEED)});
  const out = [];
  for(const edit of ['dialogText','inlineText','image','stickyNote']){
    const before = await raw(page);
    const info = await EDITS[edit](page);
    // read toast and storage in one evaluate, before any debounce timer could run
    const snap = await page.evaluate(k=>({toast:document.getElementById('toast').textContent, raw:localStorage.getItem(k)}), KEY);
    const s = JSON.parse(snap.raw);
    const persisted = info.note ? s.helpNotes.some(n=>n.text === info.note)
      : info.expectRam ? s.data.sp_recherche.items[info.id].data === info.expectRam
      : snap.raw !== before;
    out.push({edit, toast:snap.toast, persisted, ok:claimsSaved(snap.toast) && persisted});
    if(edit === 'stickyNote') await page.click('#helpCloseBtn');
    await settle(page,400);
  }
  const ok = out.every(o=>o.ok);
  return {status:ok?'PASS':'FAIL', expected:'Toast "… gespeichert" und im selben Moment ist die Änderung bereits in localStorage',
    observed:out.map(o=>`${o.edit}: "${o.toast}", bereits gespeichert=${o.persisted}`).join('; ')};
});
test('E9', 'R01.1 · Temporärmodus', 'AutoSave aus, Text bearbeiten: Toast nennt "nicht gespeichert", localStorage unverändert', async()=>{
  const {page} = await open({storage:L.seededStorage(SEED)});
  await page.click('#memoryToggle'); await settle(page,300);
  const storedBefore = await raw(page);
  await EDITS.dialogText(page);
  const toast = await L.toastText(page);
  await settle(page,600);
  const storedSame = await raw(page) === storedBefore;
  const ok = !claimsSaved(toast) && /Temporärer Modus, nicht gespeichert/.test(toast) && storedSame;
  return {status:ok?'PASS':'FAIL', expected:'Toast "Text übernommen · Temporärer Modus, nicht gespeichert"; Stand unverändert',
    observed:`Toast="${toast}"; gespeichert unverändert=${storedSame}`};
});

test('E10', 'R01.1 · verwaiste Karte (I-C05)', 'Cloud-Stand wird angewendet, während der Bearbeiten-Dialog offen ist: kein "gespeichert" für die verlorene Änderung', async()=>{
  const backend = L.createCloudBackend();
  const A = await open({storage:L.seededStorage(SEED), cloud:{backend, user:USER}});
  await A.page.waitForFunction(()=>document.querySelector('#cloudToggle').dataset.state==='synced', null, {timeout:15000});
  const B = await open({storage:L.seededStorage(SEED), cloud:{backend, user:USER}});
  await B.page.waitForFunction(()=>['synced','attention'].includes(document.querySelector('#cloudToggle').dataset.state), null, {timeout:15000});
  if(await B.page.$eval('#cloudUpdateBanner', e=>e.classList.contains('show'))){ await B.page.click('#cloudUpdateBtn'); await settle(B.page,300); if(await B.page.$eval('#confirmOverlay', e=>e.classList.contains('show'))) await B.page.click('#confirmOkBtn'); await settle(B.page,1200); }
  await ctxEdit(B.page, 't_code'); await B.page.waitForSelector('#textOverlay.show');
  await B.page.fill('#textArea', 'R01.1 Änderung auf B');
  await L.dispatchPaste(A.page, 'Neues von Gerät A'); await settle(A.page,2200);
  await B.page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange'))); await settle(B.page,1500);
  const remoteApplied = storedTexts(await L.storedState(B.page)).includes('Neues von Gerät A');
  await B.page.click('#textOkBtn');
  const toast = await L.toastText(B.page);
  await settle(B.page,600);
  const kept = (await L.storedState(B.page)).data.sp_recherche.items.t_code.data === 'R01.1 Änderung auf B';
  const ok = remoteApplied && (kept ? claimsSaved(toast) : !claimsSaved(toast) && /nicht übernommen/.test(toast));
  return {status:ok?'PASS':'FAIL', expected:'Geht die Änderung verloren (I-C05, weiterhin offen), meldet der Toast "nicht übernommen" statt "gespeichert"',
    observed:`Remote angewendet bei offenem Dialog=${remoteApplied}; Änderung gespeichert=${kept}; Toast="${toast}"`,
    note:'Prüft nur die Ehrlichkeit der Meldung. Der Verlust der Änderung selbst (I-C05) bleibt offen.'};
});

// ============ A10 ============
test('A10', 'Syntax', 'node --check für alle Module', async()=>{
  const files = ['src/js/app.js','src/js/config/constants.js','src/js/ui/toast.js','src/js/utils/files.js','src/js/utils/format.js'];
  const out = files.map(f=>{ try{ execFileSync(process.execPath, ['--check', path.join(REPO_ROOT, f)], {stdio:'pipe'}); return f+': ok'; }catch(e){ return f+': FEHLER '+String(e.stderr||e.message).split('\n')[0]; } });
  return {status:out.every(s=>s.endsWith('ok'))?'PASS':'FAIL', expected:'alle bestanden', observed:out.join('; ')};
});

// ============ RUN ============
await L.launch();
for(const t of tests){
  if(only && !only.test(t.id)) continue;
  const t0 = Date.now();
  let r;
  try{ r = await t.fn(); }
  catch(e){ r = {status:'FAIL', expected:'', observed:'Harness-/Testfehler: '+String(e.message||e).split('\n')[0]}; }
  if(t.id !== 'A3b') while(openContexts.length){ await openContexts.pop().close().catch(()=>{}); }
  results.push({id:t.id, covers:t.covers, title:t.title, ...r, ms:Date.now()-t0});
  console.log(`${t.id} [${r.status}] ${t.title}\n    → ${r.observed}`);
}
while(openContexts.length){ await openContexts.pop().close().catch(()=>{}); }
await L.close();
const external = [...L.EXTERNAL];
const outFile = path.join(EVIDENCE_DIR, `r01-results-${LABEL}${only ? '-'+process.argv[2].replace(/[^\w-]/g,'_') : ''}.json`);
fs.writeFileSync(outFile, JSON.stringify({generatedAt:new Date().toISOString(), base:L.BASE, label:LABEL, browser:'Chromium (Playwright, headless)', results, externalHostsRequested:external,
  supabaseContacted:external.some(h=>/supabase\.co$/.test(h)), note:'All external hosts intercepted (aborted or served locally); Supabase replaced by an in-memory mock; synthetic data only.'}, null, 2));
console.log('written', outFile);
