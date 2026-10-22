import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import type { IndexHtmlTransformHook } from 'vite';
import { defineConfig, type Plugin } from 'vitest/config';

const root = import.meta.dirname;

// GitHub Pages reads CNAME from the published root. The file stays in the repo root, the build copies it unchanged.
function emitCname(): Plugin {
  return {
    name: 'copyboard-emit-cname',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'CNAME', source: readFileSync(resolve(root, 'CNAME')) });
    },
  };
}

// React (JSX + Fast Refresh) for the preview only. The legacy ESM sources under src/js are never transformed, and the dev-only
// Fast Refresh preamble is injected into preview.html only, so the legacy page "/" is served exactly as before.
function reactPreviewOnly(): Plugin[] {
  return react({ include: /\/src\/next\/.*\.tsx?$/ }).map((plugin) => {
    const hook = plugin.transformIndexHtml;
    if (!hook) return plugin;
    const handler: IndexHtmlTransformHook = typeof hook === 'function' ? hook : hook.handler;
    const scoped: IndexHtmlTransformHook = function (this: unknown, html, ctx) {
      return ctx.filename.endsWith('preview.html') ? handler.call(this as never, html, ctx) : undefined;
    };
    return { ...plugin, transformIndexHtml: typeof hook === 'function' ? scoped : { ...hook, handler: scoped } };
  });
}

// Favicon of the Cloudflare preview deployment (inline SVG, no binary asset, no external request).
const PREVIEW_FAVICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#dbb6f5"/><stop offset="1" stop-color="#7064c8"/></linearGradient></defs>' +
  '<rect width="64" height="64" rx="18" fill="url(#g)"/><rect x="22" y="14" width="24" height="30" rx="7" fill="#fff" opacity=".45"/>' +
  '<rect x="16" y="20" width="24" height="30" rx="7" fill="#fff"/></svg>\n';

/**
 * Cloudflare Pages preview build (`npm run build:pages-preview`, output `dist-preview`): only the synthetic React preview and
 * its own assets. The emitted preview.html becomes index.html so the React app starts at "/". No legacy entry, no legacy
 * bundles, no CNAME, no Supabase configuration: the legacy input is simply not part of this build.
 */
function pagesPreviewEntry(outDir: string): Plugin {
  return {
    name: 'copyboard-pages-preview-entry',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('preview.html')) return;
        return html.replace('<title>CopyBoard Preview</title>', '<title>CopyBoard 2 · Preview</title>\n<link rel="icon" type="image/svg+xml" href="./favicon.svg">');
      },
    },
    closeBundle() {
      const dir = resolve(root, outDir);
      renameSync(resolve(dir, 'preview.html'), resolve(dir, 'index.html'));
      writeFileSync(resolve(dir, 'favicon.svg'), PREVIEW_FAVICON);
    },
  };
}

export default defineConfig(({ mode }) => {
  const pagesPreview = mode === 'pages-preview';
  const previewOutDir = 'dist-preview';
  // "/" is the unchanged legacy app. "/preview.html" is the isolated entry for the React/TypeScript preview track.
  // The Cloudflare preview build has only the preview entry, so no legacy chunk can even be generated.
  const input: Record<string, string> = pagesPreview
    ? { preview: resolve(root, 'preview.html') }
    : { main: resolve(root, 'index.html'), preview: resolve(root, 'preview.html') };
  return {
    // Relative base keeps asset URLs valid under any origin or sub-path, like the unbundled legacy app.
    base: './',
    // Multi-page app without SPA fallback: unknown paths 404 like on static hosting.
    appType: 'mpa',
    plugins: [reactPreviewOnly(), pagesPreview ? pagesPreviewEntry(previewOutDir) : emitCname()],
    server: { host: '127.0.0.1', port: 5173 },
    preview: { host: '127.0.0.1', port: 4173 },
    build: {
      outDir: pagesPreview ? previewOutDir : 'dist',
      emptyOutDir: true,
      rollupOptions: { input },
    },
    test: {
      include: ['tests/unit/**/*.test.{ts,tsx}'],
      environment: 'node',
    },
  };
});
