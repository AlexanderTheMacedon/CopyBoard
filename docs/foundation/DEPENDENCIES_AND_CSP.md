# Runtime dependencies, CSP and SRI (R02b stays an open release gate)

Status: **catalogued, not hardened.** No CSP or SRI is deployed or enabled. Nothing here is claimed as PASS.

## Third-party runtime dependencies of the legacy app (`index.html`)

| Dependency | Source | Version spec | Risk |
| --- | --- | --- | --- |
| JSZip | `cdnjs.cloudflare.com` | `3.10.1` (exact) | Pinned; no SRI attribute yet |
| Tesseract.js | `cdn.jsdelivr.net/npm/tesseract.js@5` | **floating major** | Version drifts; loads further worker/core/language data at runtime from the CDN (not yet catalogued); no SRI possible while floating |
| supabase-js | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | **floating major** | Version drifts; no SRI possible while floating; talks to the production Supabase project |
| Fraunces | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | CSS API | Third-party request leaks the visitor IP; no SRI possible |
| Supabase project | `https://nfltixnoopjjpkbbpfus.supabase.co` (`src/js/config/constants.js`) | n/a | Real RLS/Storage/RPC policies are **unverified** from this repo |

Vite bundles only first-party code. The CDN `<script>` tags are left untouched in `dist/index.html`.

The React preview (`/preview.html`, Run B) has **no** third-party runtime request: React/React DOM `19.3.1` are exact-pinned npm packages bundled into
`dist/assets/preview-*.js`; fonts are system fonts; icons are inline SVG. A future CSP for the preview can therefore start from `default-src 'self'`
(plus `style-src 'unsafe-inline'` for React `style` attributes that only carry CSS custom properties).

## Candidate policy (untested sketch, do not deploy)

```
default-src 'self';
script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;   # + 'wasm-unsafe-eval' / worker-src blob: for Tesseract: unverified
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;              # app.js and index.html use many inline styles (53 style= in index.html, 75 .style/cssText uses in app.js)
font-src https://fonts.gstatic.com;
img-src 'self' data: blob:;
media-src 'self' data: blob:;
connect-src 'self' https://nfltixnoopjjpkbbpfus.supabase.co wss://nfltixnoopjjpkbbpfus.supabase.co https://cdn.jsdelivr.net;   # Tesseract data hosts unverified
worker-src 'self' blob:;
object-src 'none'; base-uri 'self'; frame-ancestors 'none';   # frame-ancestors is ignored in <meta>, needs a header (Pages cannot set headers)
```

## Why this is deferred

CSP/SRI may only be tightened after controlled browser proof that OCR, ZIP export and cloud sync still work with real CDN responses. This sprint's
harness blocks or mocks all CDNs, so it cannot give that proof. Required before R02b can close: pin Tesseract and supabase-js to exact versions, add SRI hashes,
test OCR (including its worker/core/language fetches), ZIP and a sync round trip against a non-production Supabase project, then ship CSP in report-only mode first.
GitHub Pages cannot send response headers, so only a `<meta http-equiv>` CSP is possible without another host.
