# Foundation (Run A) and React preview (Run B)

Reproducible tooling around the **unchanged legacy app**. The legacy app at `/` is still plain ESM and still runs without any build
(`python3 -m http.server`). Vite adds dev server, production build, type checking and tests. `main` stays the GitHub Pages source.

## Requirements and quickstart

Node `>=22.12` (`.nvmrc` pins 24), npm 10+. All dependencies are exact-pinned in `package.json` and `package-lock.json`.

```bash
npm ci                       # clean install
npx playwright install chromium   # once, only needed for e2e (browser is not bundled with npm)
npm run dev                  # http://127.0.0.1:5173/  legacy app; http://127.0.0.1:5173/preview.html = React preview
npm run build                # -> dist/ (index.html, preview.html, assets/, CNAME)
npm run preview              # serve dist/ at http://127.0.0.1:4173/
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run check:syntax` | `node --check` for every `.js/.mjs` (legacy app, harness, scripts) |
| `npm run typecheck` | `tsc` strict for new TypeScript (`src/next`, `tests/unit`, `vite.config.ts`); `tsconfig.legacy.json` checks `src/js/config` and `src/js/utils` with `checkJs` (non-strict). `src/js/app.js` and `ui/` are **not** type-checked |
| `npm run test:unit` | Vitest: legacy storage/PIN contract guards, format helpers, preview isolation guard, preview domain/reducer/search tests, React server-render tests |
| `npm test` | syntax + typecheck + unit (no browser) |
| `npm run test:smoke` | build, then Playwright smoke against `dist/`: 6 foundation checks + 13 React preview checks + 8 tests of the R02 suite. **This is the PR gate** |
| `npm run test:smoke:dev` | same smoke against the Vite dev server |
| `npm run test:e2e:full` | build + the complete R02 acceptance suite (29 tests), manual |
| `npm run ci` | `test` + `test:smoke` |

Test results are written to `test-results/` (git-ignored). Every suite exits non-zero on any FAIL; nothing is marked PASS to hide a defect.
The Playwright harness is the existing one (`docs/runs/R01-data-loss-guards/harness/qa-lib.mjs`, unchanged): fresh isolated Chromium
contexts, synthetic data only, every request outside the app origin is intercepted, Supabase is replaced by an in-memory mock, jszip is served from
the pinned devDependency. `r02-security.mjs` got two additive changes: `R02_OUT_DIR` (result location) and a non-zero exit code on failure.

## Entries and isolation

- `/` (`index.html`) → `src/js/app.js`: the legacy app, untouched. Storage key `copyboard_state_v1`, backup schema and AES-GCM/PBKDF2 parameters are unchanged
  (guarded by `tests/unit/legacy-contract.test.ts`).
- `/preview.html` → `src/next/main.tsx`: the React 19 + TypeScript preview (Run B), a read-only product preview on synthetic fixtures. It imports
  nothing from the legacy app, has no storage, no network, no cloud endpoint and no clipboard/microphone/file access, and is therefore no second writer.
  `tests/unit/preview-isolation.test.ts` fails if `src/next` touches storage, network, device APIs, HTML injection or the legacy modules, or imports
  anything but React; `tests/e2e/preview.mjs` instruments those APIs in the browser and fails on any access, foreign request or API request.
  Structure and design hand-off: `docs/runs/B-react-preview/`.
- `base: './'`, `dist/CNAME` is the unchanged repo `CNAME` (smoke F6). No Pages workflow was added or changed.

## Known limits of this foundation

- The legacy app is bundled and minified by Vite for `dist/`. The unbundled sources remain the reference; the R02 subset passes on both dev and build.
- Smoke covers Chromium only. Firefox/WebKit/iOS are unverified.
- Only a subset of the R02 suite runs in CI; the full suite is manual. The older R01 guard suite and `qa-interactions.mjs` (documents known legacy defects as
  DEFECT/OBSERVATION) are not wired into npm scripts; they remain reference harnesses.
- CI action versions are pinned by major tag, not by commit SHA.
