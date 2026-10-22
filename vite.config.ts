import { readFileSync } from 'node:fs';
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

export default defineConfig({
  // Relative base keeps asset URLs valid under any origin or sub-path, like the unbundled legacy app.
  base: './',
  // Multi-page app without SPA fallback: unknown paths 404 like on static hosting.
  appType: 'mpa',
  plugins: [reactPreviewOnly(), emitCname()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // "/" is the unchanged legacy app. "/preview.html" is the isolated entry for the React/TypeScript preview track.
        main: resolve(root, 'index.html'),
        preview: resolve(root, 'preview.html'),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
