import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTOSAVE_PREF_KEY, MAX_LOCAL_STATE_CHARS, STATE_SCHEMA_VERSION, STORAGE_KEY } from '../../src/js/config/constants.js';
import { extMeta, extOf, fmtSize } from '../../src/js/utils/format.js';

const root = resolve(import.meta.dirname, '../..');
const appSource = readFileSync(resolve(root, 'src/js/app.js'), 'utf8');

describe('legacy storage contract (R01) is unchanged', () => {
  it('keeps storage keys, schema version and local limit', () => {
    expect(STORAGE_KEY).toBe('copyboard_state_v1');
    expect(AUTOSAVE_PREF_KEY).toBe('copyboard_autosave_pref');
    expect(STATE_SCHEMA_VERSION).toBe(1);
    expect(MAX_LOCAL_STATE_CHARS).toBe(4_500_000);
  });

  it('keeps the backup envelope', () => {
    expect(appSource).toContain("format:'copyboard-backup', version:1");
  });
});

describe('PIN crypto parameters (R02) are unchanged', () => {
  it('keeps AES-GCM-256 and PBKDF2-SHA-256 x 150000', () => {
    expect(appSource).toContain("{ name:'PBKDF2', salt:saltBytes, iterations:150000, hash:'SHA-256' }");
    expect(appSource).toContain("{ name:'AES-GCM', length:256 }");
    expect(appSource).toMatch(/crypto\.getRandomValues\(new Uint8Array\(16\)\)/);
    expect(appSource).toMatch(/crypto\.getRandomValues\(new Uint8Array\(12\)\)/);
  });
});

describe('format helpers', () => {
  it('formats sizes', () => {
    expect(fmtSize(512)).toBe('512 B');
    expect(fmtSize(2048)).toBe('2.0 KB');
    expect(fmtSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('derives extension metadata', () => {
    expect(extOf('Report.PDF')).toBe('pdf');
    expect(extOf('noext')).toBe('');
    expect(extMeta('x.pdf').label).toBe('PDF');
    expect(extMeta('x').label).toBe('FILE');
  });
});
