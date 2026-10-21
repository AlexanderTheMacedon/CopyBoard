# 04 — Data, Supabase and Security

This document keeps three kinds of statement apart:

- **[Repo-verified]** — proven by the code and/or reproduced in the browser. The test ID is cited.
- **[Backend-assumed]** — depends on Supabase configuration (RLS, Storage policies, RPC body, Auth settings). None of that is in the repository, so it **cannot be inspected**.
- **[NOT VERIFIED]** — needs real devices, accounts or production resources.

**Safety statement for this run.**
- No request was sent to `*.supabase.co`.
- The Supabase JS CDN was blocked by the sandbox egress policy and, in addition, intercepted by the harness.
- All cloud behavior below was exercised against an **in-memory mock backend** (`evidence/qa-lib.mjs`, `createCloudBackend`) that mimics the client contract only.
- No credentials were used, created or exposed. The public Supabase URL and publishable key in `constants.js` were left untouched.

---

## 1. Local browser storage

| Aspect | Finding | Evidence |
|---|---|---|
| Store | One JSON string in `localStorage['copyboard_state_v1']`. Binary content is inlined as base64 data URLs. | [Repo-verified] `app.js:484–542` |
| Configured limits | Per file `MAX_FILE_BYTES` = 8 MiB. Board `MAX_TOTAL_BYTES` = 20 MiB, estimated as `new Blob([JSON.stringify(state)]).size` (UTF-8 bytes). Import file cap 30 MiB. | [Repo-verified] `constants.js` |
| **Real capacity** | About **5.24 M characters** for a single value in Chromium, measured. localStorage counts UTF-16 code units, so the 20 MiB budget can never be reached. Base64 adds 33 % to every file. | [Repo-verified] I‑36 |
| **Failure handling** | When `setItem` throws, the status pill shows "Speichern fehlgeschlagen" and **one** toast appears. The new card stays visible in the UI, and the app keeps accepting more items. After a reload the unsaved items are gone: the UI showed 3, storage held 2, 2 survived the reload. | [Repo-verified] I‑36 |
| Recovery copy | `copyboard_preimport_recovery_v1` stores a **full second copy** of the board before an import or a manual cloud load. At about half the capacity this second write fails. `savePreImportRecovery()` returns `false`, and the import or cloud load continues anyway, with only a different toast. | [Repo-verified] code `app.js:4228`, `1170`, `4306` |
| **Start-up with unreadable data** | If the stored JSON cannot be parsed or has a newer `schemaVersion`, `init()` falls back to `defaultState()` and immediately writes it. The **previous board is overwritten** with no warning and no backup. This is triggered by corruption, by a partial write, or by opening an older cached app version after a newer one has migrated the schema. | [Repo-verified] I‑35 (both cases) |
| Temporary mode | When AutoSave is off, nothing is written, a `beforeunload` prompt is shown, and cloud upload is also suspended. | [Repo-verified] I‑37, `app.js:1257` |
| Private mode / storage disabled | `checkStorageAvailable()` flips the UI to "Nicht verfügbar". The board then works in memory only. | [Repo-verified] code; [NOT VERIFIED] Safari private mode quotas |
| Main-thread cost | Every debounced save calls `JSON.stringify` on the whole board (plus SHA-256 when signed in). Every `addItem` stringifies it again for the size estimate. Every undo checkpoint deep-clones a space, or the **entire board** for cross-space actions, and up to 20 such clones are kept in memory. | [Repo-verified] code; not benchmarked |

## 2. Large files and audio

- `FileReader.readAsDataURL` loads each file completely into memory. An 8 MiB file becomes about an 11 MB string. That string is copied again on serialization, hashing, undo snapshots, the duplicate signature (`type::mime::data`) and ZIP export. **[Repo-verified]**
- In practice, **2–3 photos of normal size fill the real quota** (I‑36). The per-file limit (8 MiB) is larger than what a near-empty board can persist.
- Voice memos:
  - Always labeled `audio/webm`, whatever `MediaRecorder` actually produced. Safari produces `audio/mp4` by default, so playback there is [NOT VERIFIED].
  - No duration limit. The only size check is the 20 MiB budget, which is itself above capacity.
  - Recording works with Chromium's fake device (I‑42).
- Previews use data URLs directly. Videos and PDFs are not rendered; they show a file badge. **[Repo-verified]**

## 3. Supabase integration (client side)

**[Repo-verified]**, from `app.js:939–1460` and `constants.js`:

| Element | Client usage |
|---|---|
| Project | `https://nfltixnoopjjpkbbpfus.supabase.co`, **publishable** key `sb_publishable_…`. Public by design. No service-role key is present. |
| Auth | Email + password (`signUp`, `signInWithPassword`, `signOut`), `persistSession:true` (supabase-js stores the session in localStorage), `autoRefreshToken`, `detectSessionInUrl`. Client-side validation: password of at least 8 characters, plus a regex on the email. |
| Table `copyboard_boards` | `select owner_id, revision, object_path, content_hash, state_bytes, updated_at, updated_by_device where owner_id = <uid>` → `maybeSingle()` |
| Storage bucket `copyboard-snapshots` | `upload(<uid>/snapshots/<ms>-<deviceId>.json, upsert:false)`, `download(object_path)`, `remove([previousPath])` |
| RPC `copyboard_publish_snapshot` | `(p_base_revision, p_object_path, p_content_hash, p_state_bytes, p_device_id)` → new row/revision. A conflict is detected by an error message containing `COPYBOARD_REVISION_CONFLICT`. |
| Realtime | `channel('copyboard-'+uid).on('postgres_changes', {table:'copyboard_boards', filter:'owner_id=eq.'+uid})` |
| Integrity | SHA-256 of the snapshot is compared with `content_hash` on download. This is integrity, not authenticity. In non-secure contexts there is an FNV fallback, which produces **different** hashes than other devices → a "Prüfsumme" error. |

### 3.1 Security properties that depend on the backend [Backend-assumed — not inspectable]

The README states that the schema and policies are not in this repository. CopyBoard's multi-user security rests entirely on the following being true in the Supabase project:

1. **RLS on `copyboard_boards`.**
   - `select` only where `owner_id = auth.uid()`.
   - No direct `insert`/`update`/`delete` from clients; changes only through the RPC.
   - The Realtime publication must honor RLS too, otherwise other users' metadata could leak.
2. **The RPC `copyboard_publish_snapshot`**, if it runs as `SECURITY DEFINER`, must:
   - derive the owner from `auth.uid()`, never from a parameter;
   - check the revision atomically (row lock or compare-and-set);
   - **validate that `p_object_path` starts with `auth.uid() || '/'`**. Otherwise a user could point their board row at another user's object path. Storage read policies should still stop the download, but this is defense in depth.
3. **Storage policies on `copyboard-snapshots`.**
   - The bucket is private.
   - `select`/`insert`/`delete` only where `(storage.foldername(name))[1] = auth.uid()::text`.
   - `upsert:false` is a client choice; the server must not depend on it.
4. **Quotas and abuse limits.**
   - Sign-up appears open (the client offers registration).
   - There should be per-user caps on object size and object count. The client deletes the previous snapshot only best-effort (`.catch(()=>{})`), so orphaned objects can pile up.
   - Email confirmation and rate limiting are Auth settings.
5. **Retention.** Deleted boards and old snapshots, and account deletion. The client has no account-deletion or data-export-from-cloud function.

None of the above was tested. **Recommended verification before any refresh work touches sync:**
- export the SQL for the table, RLS policies, RPC and storage policies into the repository (`supabase/` migrations);
- review them;
- add an automated policy test with two test users on a **non-production** project.

## 4. Snapshot and revision logic

```text
local persist ─▶ SHA-256(JSON) ≠ lastSyncedHash ─▶ debounce 900 ms ─▶ cloudUploadNow():
   fetch metadata ─▶ remote.revision > local.revision ? show "update" banner, stop
                 ─▶ upload new object ─▶ RPC publish(base_revision) ─▶ ok: revision++, delete previous object
                                                                     └ conflict: delete own upload, show banner
remote change (realtime / visibilitychange / online) ─▶ newer revision:
   local clean  → download + replace state silently
   local dirty  → banner "Neue Elemente auf einem anderen Gerät verfügbar" → user: Aktualisieren (replace local; recovery copy) | ×
```

Observed behavior (mock backend):

| # | Behavior | Severity | Evidence |
|---|---|---|---|
| S1 | **Passive activity creates revisions.** Opening a preview or switching spaces changes `recentItems`/`activeSpaceId`, so the full board is uploaded each time (3 uploads for sign-in + 1 view + 1 space switch). Costs bandwidth (up to 20 MiB per upload) and creates avoidable cross-device conflicts. | Medium | I‑C02 |
| S2 | **No merge and no "keep mine".** A device whose edits lost the race can only replace its local state with the cloud state. Its uploads are blocked until it does: after "×" the next edit just shows the banner again. Local edits survive only in the single recovery slot, as a whole-board restore, without selective recovery. | High | I‑C03 |
| S3 | **Second device, first sign-in.** If the device already has local content, the user must choose "Aktualisieren", which discards local-only items. The recovery copy is the only way back. | High | I‑C03 |
| S4 | **Remote apply while editing.** When the device is "clean", a newer remote snapshot replaces `state` silently. An open "Inhalt bearbeiten" dialog keeps its reference to the old item object. Saving it shows "Gespeichert", but the edit is neither in local state nor in the cloud. **Silent data loss.** | High | I‑C05 |
| S5 | Undo/redo stacks are not cleared when a remote snapshot or an import is applied. Undo can then reintroduce pre-sync data, or write orphan space data. | Medium | I‑17 (import); code `app.js:1139–1163` (cloud) |
| S6 | **Shared browser profile.** After user A signs out, the board stays local. If user B signs in on that profile and has no cloud board, **A's local board is uploaded into B's account automatically**. | Medium (privacy) | I‑C04 |
| S7 | Offline: a failed upload sets "Upload ausstehend — lokale Kopie ist sicher". `online`/`visibilitychange` trigger reconcile. | — | Code; realtime and network flaps [NOT VERIFIED] |
| S8 | Size guard: a remote snapshot over 20 MiB is refused on download. Local pushes have no explicit size guard beyond the add-time estimate. | Low | Code |

## 5. Backup, recovery and migration compatibility

| Format | Producer | Accepted by |
|---|---|---|
| `copyboard-backup` v1 `{format, version, stateSchemaVersion, exportedAt, state}` | Palette "Board exportieren" | `importBackupFile` → `importBoardState` |
| `copyboard-space` v1 `{format, version, name, color, exportedAt, data}` | Space menu "Als JSON exportieren" | `importSpacePayload` (adds a new space) |
| Legacy raw state (V16–V22, unwrapped) | Older versions | `isValidBoardState` fallback |
| `copyboard-settings` v1 | Help → Einstellungen exportieren (**broken**: `downloadBlob` undefined, I‑38) | `importBoardSettingsFile` |
| `window.storage` keys (`spaces-index`, `space:<id>:data`, …) | Pre-localStorage versions | `migrateFromLegacyWindowStorage` at start-up |

- **Round trip verified** (I‑34): export → change → import → "Stand vor letztem Import wiederherstellen".
- **Validation is structural only.**
  - `isValidBoardState`/`isValidSpaceData` check ids, arrays and folder references.
  - Item fields (`data`, `mime`, `type`, `name`) and space fields (`color`) are **not** type- or content-checked. This is the root cause of I‑32 and I‑33b.
- **Forward compatibility.** A file with a newer `schemaVersion` is rejected on import. That is correct. At start-up, however, the same condition **destroys** the stored board (I‑35).

## 6. PIN encryption

**[Repo-verified]**, `app.js:4795–4859`:
- AES-GCM-256 with a fresh random 16-byte salt and 12-byte IV per lock.
- Key derived with PBKDF2-SHA-256 at 150,000 iterations.
- The plaintext (`item.data`) is replaced by `encData`; `lockedType` remembers the original type.
- The crypto primitives are appropriate.

Weaknesses:

1. **Metadata stays plaintext** (I‑26). The `name` of a text card is its first 40 characters, which for a password note is often the secret itself. It stays readable in the card UI, search results, backups and cloud snapshots. Favorite flag, size and timestamps also stay visible.
2. **No PIN policy.** Any non-empty string is accepted, including 1 character. A 4-digit PIN gives 10⁴ candidates × 150k PBKDF2 iterations, which an attacker holding a backup file or cloud snapshot can brute-force offline on commodity hardware.
3. **Lock bypass paths** (I‑13 Space-bar quick look, I‑39 search → Enter).
   - They open an *empty* preview without asking for the PIN.
   - **No plaintext is revealed**, but the copy/edit actions then run on `null` data.
   - "Inhalt bearbeiten" from that preview opens the text dialog prefilled with `null`. Saving it would overwrite the encrypted item with plaintext and leave `locked:true` set. [Code-derived; not executed]
4. **Locked items break other features.** ZIP export throws (I‑25). Folder thumbnails render `src=null`.
5. **Documentation drift.** The in-app help (`index.html:556`) calls it a "Prototyp und keine echte Verschlüsselung". The HTML maintenance note lists "Real encrypted PIN protection" as deferred. The code does encrypt. The redesign must settle on one truthful claim.

## 7. Burn-after-reading

**[Repo-verified]**, I‑27:
- The link is `<current URL>#burn=<base64(text)>`. **The secret travels inside the link.** No server is involved, there is no key, and there is no one-time token.
- "Burning" only removes the fragment from the address bar of the tab that opened it (`history.replaceState`).
- The same link opened again, in a second browser context, showed the content again.
- Anyone who sees the link (chat history, mail scanners, browser sync, shoulder surfing) can decode it with `atob`.

## 8. Injection, unsafe rendering and file processing

| Sink | User-controlled input | Result | Evidence |
|---|---|---|---|
| `renderContextRows()` → `row.innerHTML = icon + '<span>'+label+'</span>'` | Space names, via share sheet → "In anderen Space kopieren" (`openSpacePicker`). Names come from typing (max 40 chars is enough), JSON import or cloud snapshots. | **Script execution** (stored XSS) | I‑31 |
| `buildSpaceContextMenu()` icon `style="background:${sp.color}"` | `color` from a space/board import or a cloud snapshot | **Script execution** when the tab context menu opens | I‑32 |
| `downloadItem()` `a.href = item.data` | `data` of an imported file item (`javascript:` URL) | **Script execution** on "Herunterladen" | I‑33b |
| Card/preview/search/inspector/favorites/recent/storage/duplicate lists | Names, text content | Escaped (`textContent`, or `escapeHtml` in the palette) | I‑33 PASS |
| `extMeta().label` in `innerHTML` (file badge) | Filename extension, upper-cased, max 4 chars | Not exploitable in practice (no complete tag fits in 4 chars) | Code |
| `img.src`, `audio.src`, `fetch(item.data)` | Imported `data` | `img`/`audio` do not execute `javascript:`. `fetch` rejects it. | Code |

Impact of the three XSS paths:
- Script runs in the CopyBoard origin.
- It has full access to `localStorage`: the entire board, **the Supabase session token**, and the PIN ciphertexts.
- Delivery is by sharing a crafted board or space JSON, or through any synced device.

There is **no Content-Security-Policy** that could limit this.

Other file-processing notes:
- JSON import is limited to 30 MiB and parsed with `JSON.parse` on the main thread.
- Images are decoded by the browser (`Image`, canvas).
- OCR runs Tesseract in a worker loaded from jsDelivr.
- ZIP generation runs through JSZip in memory.
- No file is executed or rendered as HTML.

## 9. Supply chain and privacy

- **Third-party scripts without SRI.** Three CDN scripts load without Subresource Integrity, two of them on floating major versions (`supabase-js@2`, `tesseract.js@5`). A compromised CDN response would get the same powers as the XSS above. **[Repo-verified]** (`index.html:14–28`)
- **Clipboard read on open.** Opening the text modal reads the clipboard automatically (`navigator.clipboard.readText()`). Browsers show a permission prompt. The user should know why. **[Repo-verified]** (I‑03)
- **Paste into unrelated fields.** Pasting into the palette search, sticky-note, e-mail, PIN or inline-editor fields **also stores the pasted content as a card** (I‑02). A password pasted into the PIN or a login field ends up persisted, and synced to the cloud when signed in.
- **Google Fonts** requests reveal visitor IP and user agent to Google (GDPR consideration). **[Repo-verified]**

## 10. Summary of security-relevant defects

| ID | Finding | Severity |
|---|---|---|
| I‑31, I‑32, I‑33b | Stored XSS via space name, space color and imported file data | High |
| I‑35 | Unreadable or newer stored board overwritten at start-up | Critical (data loss) |
| I‑36 | Real quota far below the configured limit; silent loss after reload | High |
| I‑C05 | Remote apply discards an open edit while reporting success | High |
| I‑C03 | No merge; local-only work discarded on first sync and after conflicts | High |
| I‑02 | Pasted secrets in input fields persisted as cards | High |
| I‑26 | PIN-locked text keeps a plaintext 40-character prefix as its name | Medium |
| I‑27 | Burn-after-reading is neither secret nor one-time | Medium |
| I‑C04 | Local board uploaded into the next account on a shared profile | Medium |
| — | No SRI or CSP; floating CDN versions | Medium |
| — | RLS, Storage, RPC and Auth configuration not in the repository | Unknown — **NOT VERIFIABLE** |
