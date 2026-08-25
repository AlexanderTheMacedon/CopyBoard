# CopyBoard Online

A fast, local-first workspace for clipboard content and files — directly in your browser.

[Open CopyBoard](https://copyboard.astambke.de)

CopyBoard helps you collect text, images, documents, links, and voice notes in visual spaces. It works without an installation or account, keeps the local workflow fast, and can optionally synchronize a personal board through Supabase.

## Why CopyBoard?

- **Start immediately:** open the web app and paste or drop content.
- **Stay organized:** separate work into spaces and use grid or list view.
- **Find things again:** search, favorites, recent items, and sorting are built in.
- **Keep control:** local autosave, JSON import/export, and recovery flows protect your board.
- **Work across devices:** optional account-based cloud sync adds revisions, realtime updates, and conflict-aware pull/push behavior.
- **Remain local-first:** the core app continues to work when you are signed out or offline.

## Quick start

Use the hosted version at [copyboard.astambke.de](https://copyboard.astambke.de), or run the repository locally:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

A local web server is required because CopyBoard uses native JavaScript modules. No package installation or build step is needed.

## Data and privacy

CopyBoard stores the working board in the browser first. Cloud sync is optional and uses the signed-in Supabase user ID as the ownership boundary. Signing out does not remove the local board.

Current browser-side limits:

- Maximum size per file: 8 MiB
- Maximum estimated board size: 20 MiB
- Backups and transfers: CopyBoard JSON format

Browser storage is device- and browser-profile-specific. Export a JSON backup before clearing site data or moving critical content.

## Development

### Architecture

CopyBoard is a static, standalone web app built with HTML, CSS, and native ES modules. There is no framework, package manager, bundler, or compile step.

```text
index.html                     Application shell and modal markup
src/
├── styles/app.css             Complete application styling
└── js/
    ├── app.js                 State, UI, persistence, and cloud orchestration
    ├── config/constants.js    Limits, storage keys, settings, and cloud config
    ├── ui/toast.js            Toast notifications
    └── utils/
        ├── files.js           File helpers
        └── format.js          Formatting helpers
```

The larger feature domains remain together in `app.js` until they can be extracted behind explicit interfaces without changing runtime behavior.

### Runtime dependencies

Runtime libraries are loaded from CDNs in `index.html`:

- Supabase JavaScript client v2
- JSZip 3.10.1
- Tesseract.js 5
- Google Fonts

An internet connection is required for those CDN assets and for cloud sync. Locally stored board data remains available without Supabase.

### Supabase cloud sync

The browser client configuration lives in `src/js/config/constants.js`. Only a public/publishable client key belongs there — never add a service-role key or another secret to the repository.

The existing cloud implementation uses:

- Supabase Auth with persisted sessions and token refresh
- `copyboard_boards` for revision metadata
- the `copyboard-snapshots` Storage bucket for board snapshots
- `copyboard_publish_snapshot` for conflict-aware publishing
- Realtime updates scoped to the authenticated owner

Security depends on matching Row Level Security, Storage policies, and RPC checks in Supabase. The backend schema and policies are not currently provisioned from this repository, so a new Supabase project requires those resources to be configured separately.

### Verification

There is currently no automated test suite. Before opening a pull request:

```bash
node --check src/js/app.js
node --check src/js/config/constants.js
node --check src/js/utils/files.js
node --check src/js/utils/format.js
node --check src/js/ui/toast.js
python3 -m http.server 8000
```

Then test the local-first workflow, import/export, responsive layout, and relevant signed-out/signed-in cloud paths in the browser.

### Branch workflow

Create feature branches from `develop`, merge reviewed features back into `develop`, and promote tested releases from `develop` to `main`. Avoid direct feature work on `main`.
