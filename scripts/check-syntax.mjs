// `node --check` over every hand-written JavaScript file (legacy app, harnesses, scripts, tests).
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const SKIP = new Set(['node_modules', 'dist', 'test-results', '.git']);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(m?js)$/.test(entry.name)) yield full;
  }
}

let failed = 0;
let count = 0;
for (const file of walk(root)) {
  count++;
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    console.error(`FAIL ${relative(root, file)}\n${result.stderr}`);
  }
}
console.log(`node --check: ${count - failed}/${count} files OK`);
process.exit(failed ? 1 : 0);
