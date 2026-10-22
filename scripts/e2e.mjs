// Starts the app (built `dist` via vite preview, or the dev server) on a free port and runs the Playwright suites against it.
//   node scripts/e2e.mjs smoke [--target=dev]   bounded, deterministic subset (PR CI)
//   node scripts/e2e.mjs full  [--target=dev]   complete R02 acceptance suite (manual, a few minutes)
// Safety: the harness intercepts every request outside the app origin and replaces Supabase by an in-memory mock.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { join } from 'node:path';
import { createServer, preview } from 'vite';

const root = join(import.meta.dirname, '..');
const suite = process.argv[2];
const target = (process.argv.find((a) => a.startsWith('--target=')) ?? '--target=preview').slice('--target='.length);
if (!['smoke', 'full'].includes(suite ?? '') || !['preview', 'dev'].includes(target)) {
  console.error('usage: node scripts/e2e.mjs <smoke|full> [--target=preview|dev]');
  process.exit(2);
}
if (target === 'preview' && !existsSync(join(root, 'dist/index.html'))) {
  console.error('dist/ is missing: run `npm run build` first (the npm scripts do this).');
  process.exit(2);
}

const freePort = () =>
  new Promise((resolvePort, reject) => {
    const probe = createNetServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });

const port = await freePort();
const server =
  target === 'dev'
    ? await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true } })
    : await preview({ root, logLevel: 'error', preview: { host: '127.0.0.1', port, strictPort: true } });
if (target === 'dev') await server.listen();

const outDir = join(root, 'test-results', `${suite}-${target}`);
mkdirSync(outDir, { recursive: true });
const env = {
  ...process.env,
  CB_BASE: `http://127.0.0.1:${port}/`,
  JSZIP_PATH: join(root, 'node_modules/jszip/dist/jszip.min.js'),
  R02_OUT_DIR: outDir,
  R02_LABEL: `${suite}-${target}`,
  E2E_TARGET: target,
};

// Smoke subset of the R02 suite: XSS neutralisation, safe downloads/compat, paste privacy, PIN access, PIN crypto vectors.
const R02_SMOKE_IDS = '^(X1|X3|X6|P1|P2|B1|B8|C1)$';
const steps = [];
if (suite === 'smoke') steps.push(['tests/e2e/smoke.mjs', []]);
steps.push(['docs/runs/R02-security-privacy-hardening/evidence/r02-security.mjs', suite === 'smoke' ? [R02_SMOKE_IDS] : []]);

let exitCode = 0;
try {
  for (const [script, args] of steps) {
    console.log(`\n=== ${script} ${args.join(' ')} · ${target} ${env.CB_BASE} ===`);
    // Async spawn: the in-process Vite server must keep serving while the suite runs.
    const status = await new Promise((done) => {
      spawn(process.execPath, [join(root, script), ...args], { env, stdio: 'inherit', cwd: root }).on('close', done);
    });
    if (status !== 0) exitCode = 1;
  }
} finally {
  await server.close();
}
console.log(exitCode === 0 ? '\nE2E OK' : '\nE2E FAILED');
process.exit(exitCode);
