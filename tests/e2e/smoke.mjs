// Foundation smoke suite: the legacy app at "/" still boots, captures, persists and previews; the preview entry is inert.
// Reuses the R01/R02 harness library unchanged (isolated Chromium contexts, synthetic data, no network beyond the app origin).
import fs from 'node:fs';
import path from 'node:path';
import * as L from '../../docs/runs/R01-data-loss-guards/harness/qa-lib.mjs';

const KEY = 'copyboard_state_v1';
const OUT = process.env.R02_OUT_DIR || path.resolve('test-results');
const CDN_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net']);
const SEED = await L.seedState();
const tests = [];
const results = [];
const open = [];
const test = (id, title, fn) => tests.push({ id, title, fn });
const seeded = async (opts = {}) => {
  const app = await L.openApp({ storage: L.seededStorage(SEED), ...opts });
  app.page.setDefaultTimeout(8000);
  open.push(app.context);
  return app;
};

test('F1', 'legacy "/" boots with a seeded board and no errors', async () => {
  const { page, external, pageErrors } = await seeded();
  const cards = await L.cardIds(page);
  const tabs = await page.$$eval('#tabsScroll .tab', (els) => els.length);
  const unexpected = [...new Set(external.map((u) => new URL(u).host))].filter((h) => !CDN_HOSTS.has(h));
  const ok = cards.length === SEED.data.sp_recherche.itemIds.length && tabs === 3 && !pageErrors.length && !unexpected.length;
  return { ok, observed: `cards=${cards.length}, tabs=${tabs}, pageErrors=${pageErrors.length}, unexpected hosts=${unexpected.join(',') || '-'}` };
});

test('F2', 'board paste creates a card, is saved to copyboard_state_v1 and survives a reload', async () => {
  const { page } = await seeded();
  const text = 'Foundation smoke paste ' + Date.now();
  await L.dispatchPaste(page, text);
  await page.waitForFunction((t) => JSON.parse(localStorage.getItem('copyboard_state_v1') || 'null')
    ?.data?.sp_recherche && Object.values(JSON.parse(localStorage.getItem('copyboard_state_v1')).data.sp_recherche.items).some((i) => i.data === t), text);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#tabsScroll .tab');
  const state = await L.storedState(page);
  const saved = Object.values(state.data.sp_recherche.items).some((i) => i.data === text);
  const shown = await page.evaluate((t) => document.body.innerText.includes(t.slice(0, 20)), text);
  return { ok: saved && shown && state.schemaVersion === 1, observed: `saved=${saved}, visible after reload=${shown}, schemaVersion=${state.schemaVersion}` };
});

test('F3', 'text card opens in the preview overlay', async () => {
  const { page } = await seeded();
  await page.click('#grid .card[data-id="t_notes"] .thumb');
  await page.waitForSelector('#previewOverlay.show');
  const body = await page.$eval('#previewBody', (e) => e.innerText);
  return { ok: body.includes('Meeting-Notizen'), observed: `preview text starts "${body.slice(0, 40)}"` };
});

test('F4', 'locked card never shows plaintext without the PIN (R02 access rule)', async () => {
  const { page } = await seeded();
  await page.click('#grid .card[data-id="t_locked"] .thumb');
  await page.waitForSelector('#pinOverlay.show');
  const previewOpen = await page.$eval('#previewOverlay', (e) => e.classList.contains('show'));
  const leaked = await page.evaluate(() => document.body.innerText.includes('demo-pass-123'));
  return { ok: !previewOpen && !leaked, observed: `PIN prompt shown, preview open=${previewOpen}, plaintext in DOM=${leaked}` };
});

test('F5', 'preview.html renders the placeholder without storage writes or network access', async () => {
  const { context, page: legacy } = await seeded();
  await legacy.close();
  const page = await context.newPage();
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  // Count every storage mutation the preview page attempts (the origin already holds the seeded legacy board).
  await page.addInitScript(() => {
    window.__storageWrites = 0;
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { window.__storageWrites++; return original.apply(this, args); };
    }
  });
  await page.goto(L.BASE + 'preview.html', { waitUntil: 'load' });
  await page.waitForSelector('#preview-root[data-preview-status]');
  const text = await page.$eval('#preview-root', (e) => e.textContent);
  const writes = await page.evaluate(() => window.__storageWrites);
  const foreign = requests.filter((u) => !u.startsWith(L.BASE) && !u.startsWith('data:'));
  return { ok: /Preview/.test(text) && writes === 0 && !foreign.length, observed: `text="${text}", storage writes=${writes}, foreign requests=${foreign.length}` };
});

test('F6', 'CNAME is served unchanged at the origin root', async () => {
  const { page } = await seeded();
  const served = await page.evaluate(async () => (await fetch('/CNAME')).text());
  const repo = fs.readFileSync(path.resolve('CNAME'), 'utf8');
  // The dev server appends a source-map comment to extension-less files; the built output must be byte-identical.
  const exact = process.env.E2E_TARGET === 'dev' ? served.startsWith(repo) : served === repo;
  return { ok: exact && repo.trim() === 'copyboard.astambke.de', observed: `served="${served.trim()}"` };
});

await L.launch();
for (const t of tests) {
  const t0 = Date.now();
  let r;
  try { r = await t.fn(); } catch (e) { r = { ok: false, observed: 'Testfehler: ' + String(e.message || e).split('\n')[0] }; }
  while (open.length) await open.pop().close().catch(() => {});
  results.push({ id: t.id, title: t.title, status: r.ok ? 'PASS' : 'FAIL', observed: r.observed, ms: Date.now() - t0 });
  console.log(`${t.id} [${r.ok ? 'PASS' : 'FAIL'}] ${t.title}\n    → ${r.observed}`);
}
await L.close();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'smoke-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base: L.BASE, results }, null, 2));
const failed = results.filter((r) => r.status !== 'PASS');
console.log(`summary: ${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
