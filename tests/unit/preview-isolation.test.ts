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

  // Run A guarantee, extended in Run B: no second writer, no real save/cloud endpoints, no device APIs, synthetic fixtures only.
  const forbidden = [
    // storage
    /localStorage/,
    /sessionStorage/,
    /indexedDB/i,
    /document\.cookie/,
    /caches\./,
    /copyboard_/,
    // network / backend
    /supabase/i,
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /EventSource/,
    /sendBeacon/,
    /https?:\/\//,
    // device and content access (clipboard, microphone, files, uploads)
    /navigator\.clipboard/,
    /\bclipboardData\b/,
    /getUserMedia|mediaDevices|MediaRecorder/,
    /\bFileReader\b/,
    /dataTransfer\.(files|items|getData)/,
    /showOpenFilePicker|showSaveFilePicker/,
    /type=["']file["']/,
    // HTML injection
    /dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML/,
    // legacy app modules
    /js\/app\.js/,
    /js\/config\/constants/,
    /['"](\.\.\/)+js\//,
  ];

  const files = sourceFiles(nextDir);

  it('covers the React sources', () => {
    expect(files.some((f) => f.endsWith('.tsx'))).toBe(true);
    expect(files.some((f) => f.endsWith('.css'))).toBe(true);
  });

  for (const file of files) {
    it(`${file.slice(root.length + 1)} has no storage, network, device or legacy-app access`, () => {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) expect(text, String(pattern)).not.toMatch(pattern);
    });
  }

  it('imports stay inside src/next, React or CSS', () => {
    for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
      const specifiers = [...readFileSync(file, 'utf8').matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1] ?? '');
      for (const spec of specifiers) {
        const external = !spec.startsWith('.');
        if (external) expect(['react', 'react-dom/client'], `${file}: ${spec}`).toContain(spec);
        else expect(resolve(file, '..', spec).startsWith(nextDir), `${file}: ${spec}`).toBe(true);
      }
    }
  });

  it('preview.html loads only the preview entry', () => {
    const html = readFileSync(join(root, 'preview.html'), 'utf8');
    expect(html).toContain('src="./src/next/main.tsx"');
    expect(html).not.toMatch(/src\/js\/|https?:\/\//);
  });
});
