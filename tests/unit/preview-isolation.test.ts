import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { previewInfo } from '../../src/next/preview-info';

const root = resolve(import.meta.dirname, '../..');
const nextDir = join(root, 'src/next');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

describe('preview track is isolated from the live data path', () => {
  it('declares itself read-only and offline', () => {
    expect(previewInfo.writesEnabled).toBe(false);
    expect(previewInfo.cloudEnabled).toBe(false);
  });

  // Run A guarantee: no second writer, no real save/cloud endpoints. Later runs must pass synthetic fixtures instead.
  const forbidden = [
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /copyboard_/,
    /supabase/i,
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /js\/app\.js/,
    /js\/config\/constants/,
  ];

  for (const file of sourceFiles(nextDir)) {
    it(`${file.slice(root.length + 1)} has no storage, network or legacy-app access`, () => {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) expect(text, String(pattern)).not.toMatch(pattern);
    });
  }

  it('preview.html loads only the preview entry', () => {
    const html = readFileSync(join(root, 'preview.html'), 'utf8');
    expect(html).toContain('./src/next/main.ts');
    expect(html).not.toMatch(/src\/js\/app\.js|https?:\/\//);
  });
});
