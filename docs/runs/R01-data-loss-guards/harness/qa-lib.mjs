// CopyBoard technical baseline audit — browser QA helpers (Run 01).
// Test evidence only. Not part of the application and not loaded by index.html.
//
// Safety model:
//  - Every scenario runs in a fresh, isolated Chromium context (no shared profile).
//  - All external CDN requests are intercepted. Supabase is NEVER contacted:
//    the Supabase CDN script is either blocked or replaced by an in-memory mock
//    whose backend lives in this Node process.
//  - Only synthetic, disposable test data is used.
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

export const BASE = process.env.CB_BASE || 'http://127.0.0.1:8765/';
export const AUDIT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const SHOT_DIR = path.join(AUDIT_DIR, 'screenshots');
const JSZIP_PATH = process.env.JSZIP_PATH || '';

// ---------- tiny PNG encoder (synthetic images) ----------
const CRC_TABLE = (()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
function crc32(buf){ let c=0xffffffff; for(const b of buf) c=CRC_TABLE[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function chunk(type, data){ const len=Buffer.alloc(4); len.writeUInt32BE(data.length); const td=Buffer.concat([Buffer.from(type),data]); const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len,td,crc]); }
export function makePng(w, h, painter){
  const raw = Buffer.alloc((w*3+1)*h);
  for(let y=0;y<h;y++){ raw[y*(w*3+1)]=0; for(let x=0;x<w;x++){ const [r,g,b]=painter(x,y); const o=y*(w*3+1)+1+x*3; raw[o]=r; raw[o+1]=g; raw[o+2]=b; } }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',ihdr), chunk('IDAT',deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}
export const pngDataUrl = buf => 'data:image/png;base64,' + buf.toString('base64');
export const IMG_GRADIENT = makePng(320, 200, (x,y)=>[Math.round(79+x/320*120), Math.round(107+y/200*80), 255]);
export const IMG_BLOCKS = makePng(240, 240, (x,y)=>((x>>5)+(y>>5))%2 ? [255,107,87] : [34,176,125]);
export const IMG_SKY = makePng(300, 180, (x,y)=>[245, Math.round(166+y/180*60), 35]);

// ---------- PIN encryption (identical algorithm to app.js, used only to seed a locked card) ----------
const b64 = buf => Buffer.from(buf).toString('base64');
export async function encryptLike(plain, pin){
  const s = webcrypto.subtle; const salt = webcrypto.getRandomValues(new Uint8Array(16)); const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const km = await s.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  const key = await s.deriveKey({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['encrypt']);
  const c = await s.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(plain));
  return {cipher:b64(c), iv:b64(iv), salt:b64(salt)};
}

// ---------- representative disposable board ----------
export async function seedState(){
  const t0 = Date.parse('2026-10-20T09:00:00Z');
  const txt = (id, data, extra={})=>({id, type:'text', name:data.trim().slice(0,40)+(data.trim().length>40?'…':''), mime:'text/plain', size:Buffer.byteLength(data), timestamp:t0, data, ...extra});
  const img = (id, name, buf, extra={})=>({id, type:'image', name, mime:'image/png', size:buf.length, timestamp:t0, data:pngDataUrl(buf), ...extra});
  const file = (id, name, mime, content, extra={})=>({id, type:'file', name, mime, size:Buffer.byteLength(content), timestamp:t0, data:`data:${mime};base64,`+Buffer.from(content).toString('base64'), ...extra});
  const lockedPlain = 'Testzugang (Dummy): demo-user / demo-pass-123';
  const lockedItem = {...txt('t_locked', lockedPlain), locked:true, lockedType:'text', data:null, encData:await encryptLike(lockedPlain,'1234')};
  const recherche = {
    itemIds:['t_notes','i_grad','f_folder','t_link','f_pdf','i_blocks','f_csv','t_locked','t_code'],
    items:{
      t_notes: txt('t_notes','Meeting-Notizen Q4: Roadmap abstimmen, Budget prüfen, Termine mit dem Design-Team fixieren.', {favorite:true}),
      t_link: txt('t_link','https://example.org/artikel/local-first-software', {pinned:true}),
      t_code: txt('t_code','const greeting = "Hallo CopyBoard";\nconsole.log(greeting);'),
      i_grad: img('i_grad','skizze-verlauf.png', IMG_GRADIENT, {favorite:true}),
      i_blocks: img('i_blocks','raster-test.png', IMG_BLOCKS),
      f_pdf: file('f_pdf','angebot-entwurf.pdf','application/pdf','%PDF-1.4 synthetic test document'),
      f_csv: file('f_csv','messwerte.csv','text/csv','datum;wert\n2026-10-01;42\n2026-10-02;43\n'),
      t_locked: lockedItem,
      f_folder: {id:'f_folder', type:'folder', name:'Projekt Alpha', timestamp:t0, itemIds:['t_in1','i_in1','f_in1']},
      t_in1: txt('t_in1','Aufgabenliste Alpha: 1) Interviews 2) Prototyp 3) Review'),
      i_in1: img('i_in1','moodboard.png', IMG_SKY),
      f_in1: file('f_in1','protokoll.txt','text/plain','Protokoll der Kickoff-Besprechung (synthetisch).'),
    }
  };
  const privat = { itemIds:['t_shop','i_sky2'], items:{
    t_shop: txt('t_shop','Einkaufsliste: Milch, Brot, Kaffee'),
    i_sky2: img('i_sky2','urlaub-platzhalter.png', IMG_SKY),
  }};
  return {
    schemaVersion:1,
    spaces:[{id:'sp_recherche', name:'Recherche', sortMode:'manual', color:'#4f6bff'},{id:'sp_privat', name:'Privat', sortMode:'manual', color:'#22b07d'},{id:'sp_archiv', name:'Archiv', sortMode:'newest'}],
    activeSpaceId:'sp_recherche',
    settings:{schemaVersion:1, appearance:{viewMode:'grid', spaceAtmosphere:'subtle'}, behavior:{defaultSortMode:'manual', confirmDestructiveActions:true, startSpace:'last'}, history:{recentLimit:30}},
    viewMode:'grid',
    recentItems:[{itemId:'t_notes', spaceId:'sp_recherche', folderId:null, action:'copy', usedAt:t0+60000},{itemId:'i_in1', spaceId:'sp_recherche', folderId:'f_folder', action:'open', usedAt:t0}],
    helpNotes:[{id:'note_a', text:'Backup am Freitag exportieren', createdAt:t0},{id:'note_b', text:'Neue Space-Farben testen', createdAt:t0+1000}],
    data:{ sp_recherche:recherche, sp_privat:privat, sp_archiv:{itemIds:[], items:{}} }
  };
}

// ---------- in-memory Supabase mock (never touches the real project) ----------
export function createCloudBackend(){
  return { meta:new Map(), objects:new Map(), log:[] };
}
function cloudMockSource(){
  return `(()=>{
    const call=(op,args)=>window.__cbCloud(op,JSON.stringify(args||{})).then(r=>JSON.parse(r));
    function createClient(){
      const listeners=[];
      const user=()=>window.__CB_MOCK_USER||null;
      return {
        auth:{
          onAuthStateChange(cb){ listeners.push(cb); return {data:{subscription:{unsubscribe(){}}}}; },
          async getSession(){ const u=user(); return {data:{session:u?{user:u}:null},error:null}; },
          async signInWithPassword(){ return {data:{user:null},error:{message:'Invalid login credentials'}}; },
          async signUp(){ return {data:{},error:{message:'Signups not allowed for this instance'}}; },
          async signOut(){ window.__CB_MOCK_USER=null; listeners.forEach(cb=>cb('SIGNED_OUT',null)); return {error:null}; }
        },
        from(table){ const q={owner:null}; const b={select(){return b;}, eq(k,v){ q.owner=v; return b; }, async maybeSingle(){ return call('meta',q); }}; return b; },
        storage:{ from(){ return {
          async upload(p,blob){ return call('upload',{path:p,text:await blob.text()}); },
          async download(p){ const r=await call('download',{path:p}); return r.error?r:{data:new Blob([r.text]),error:null}; },
          async remove(paths){ return call('remove',{paths}); }
        }; } },
        async rpc(name,params){ return call('rpc',{name,params,owner:user()?.id}); },
        channel(){ const ch={on(){return ch;}, subscribe(){return ch;}}; return ch; },
        removeChannel(){}
      };
    }
    window.supabase={createClient};
  })();`;
}
async function handleCloud(backend, op, raw){
  const a = JSON.parse(raw); backend.log.push({op, path:a.path||a.paths||a.params?.p_object_path||null, at:Date.now()});
  if(op==='meta'){ return JSON.stringify({data:backend.meta.get(a.owner)||null, error:null}); }
  if(op==='upload'){ backend.objects.set(a.path, a.text); return JSON.stringify({data:{path:a.path}, error:null}); }
  if(op==='download'){ return backend.objects.has(a.path) ? JSON.stringify({text:backend.objects.get(a.path)}) : JSON.stringify({error:{message:'not found'}}); }
  if(op==='remove'){ (a.paths||[]).forEach(p=>backend.objects.delete(p)); return JSON.stringify({data:[], error:null}); }
  if(op==='rpc'){
    const p=a.params; const cur=backend.meta.get(a.owner); const curRev=cur?.revision||0;
    if(p.p_base_revision!==curRev) return JSON.stringify({data:null, error:{message:'COPYBOARD_REVISION_CONFLICT'}});
    const next={owner_id:a.owner, revision:curRev+1, object_path:p.p_object_path, content_hash:p.p_content_hash, state_bytes:p.p_state_bytes, updated_at:new Date().toISOString(), updated_by_device:p.p_device_id};
    backend.meta.set(a.owner,next); return JSON.stringify({data:[next], error:null});
  }
  return JSON.stringify({error:{message:'unknown op'}});
}

// ---------- browser / app lifecycle ----------
let browser;
export const EXTERNAL = new Set();
export async function launch(){
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']
  });
  return browser;
}
export async function close(){ await browser?.close(); }

export async function openApp(opts={}){
  const ctxOpts = {
    viewport: opts.viewport || {width:1440, height:900},
    deviceScaleFactor: opts.deviceScaleFactor || 1,
    hasTouch: !!opts.hasTouch, isMobile: !!opts.isMobile,
    locale:'de-DE', timezoneId:'Europe/Berlin', acceptDownloads:true,
    userAgent: opts.userAgent
  };
  const context = await browser.newContext(ctxOpts);
  await context.grantPermissions(['clipboard-read','clipboard-write','microphone'], {origin:new URL(BASE).origin});
  const external = [];
  await context.route(url=>!url.href.startsWith(new URL(BASE).origin), async route=>{
    const u = route.request().url(); external.push(u); EXTERNAL.add(new URL(u).host);
    if(u.includes('jszip') && JSZIP_PATH && opts.jszip !== false) return route.fulfill({contentType:'application/javascript', body:fs.readFileSync(JSZIP_PATH,'utf8')});
    if(u.includes('supabase-js') && opts.cloud) return route.fulfill({contentType:'application/javascript', body:cloudMockSource()});
    if(u.includes('tesseract') && opts.tesseractStub) return route.fulfill({contentType:'application/javascript', body:`window.Tesseract={recognize:async()=>({data:{text:${JSON.stringify(opts.tesseractStub)}}})};`});
    return route.abort();
  });
  if(opts.cloud){
    await context.exposeFunction('__cbCloud', (op, raw)=>handleCloud(opts.cloud.backend, op, raw));
    await context.addInitScript(u=>{ window.__CB_MOCK_USER=u; }, opts.cloud.user || null);
  }
  if(opts.storage){
    await context.addInitScript(entries=>{
      if(sessionStorage.getItem('__cb_seeded')) return;
      sessionStorage.setItem('__cb_seeded','1');
      for(const [k,v] of Object.entries(entries)) localStorage.setItem(k, v);
    }, opts.storage);
  }
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [], dialogs = [];
  page.on('console', m=>{ if(m.type()==='error') consoleErrors.push(m.text()); });
  page.on('pageerror', e=>pageErrors.push(String(e)));
  page.on('dialog', d=>{ dialogs.push(d.type()+': '+d.message()); d.dismiss().catch(()=>{}); });
  await page.goto(BASE + (opts.hash || ''), {waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelectorAll('#tabsScroll .tab').length>0, null, {timeout:10000});
  await page.waitForTimeout(250);
  return {context, page, external, consoleErrors, pageErrors, dialogs};
}
export function seededStorage(state){ return {copyboard_state_v1:JSON.stringify(state), copyboard_autosave_pref:'1'}; }

export async function shot(page, name, opts={}){
  fs.mkdirSync(SHOT_DIR, {recursive:true});
  await page.waitForTimeout(opts.settle ?? 350);
  const file = path.join(SHOT_DIR, name + '.png');
  await page.screenshot({path:file, fullPage:!!opts.fullPage});
  return 'screenshots/' + name + '.png';
}
export async function toastText(page){ return page.$eval('#toast', el=>el.textContent).catch(()=>''); }
export async function cardIds(page, sel='#grid'){ return page.$$eval(sel+' > .card[data-id]', els=>els.map(e=>e.dataset.id)); }
export async function storedState(page){ return page.evaluate(()=>JSON.parse(localStorage.getItem('copyboard_state_v1')||'null')); }
export async function dispatchPaste(page, text, focusSelector){
  return page.evaluate(({text, focusSelector})=>{
    if(focusSelector){ const el=document.querySelector(focusSelector); el?.focus(); }
    const dt = new DataTransfer(); dt.setData('text/plain', text);
    const target = document.activeElement || document.body;
    target.dispatchEvent(new ClipboardEvent('paste', {clipboardData:dt, bubbles:true, cancelable:true}));
    return document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName;
  }, {text, focusSelector});
}
export async function dragPointer(page, from, to, steps=14){
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  for(let i=1;i<=steps;i++){ await page.mouse.move(from.x+(to.x-from.x)*i/steps, from.y+(to.y-from.y)*i/steps); await page.waitForTimeout(16); }
  await page.mouse.move(to.x+1, to.y+1); await page.waitForTimeout(30); await page.mouse.move(to.x, to.y); await page.waitForTimeout(30);
  await page.mouse.up(); await page.waitForTimeout(450);
}
export async function center(page, selector){
  const b = await page.locator(selector).first().boundingBox(); if(!b) throw new Error('no box for '+selector);
  return {x:b.x+b.width/2, y:b.y+b.height/2};
}
