import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
// Import the production module, not a copy of it.
import { readStorage, writeStorage, StorageCorruptError } from '../server/storage';

describe('storage (production module)', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-test-'));
    file = path.join(dir, 'audits.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns [] when the file does not exist', () => {
    expect(readStorage(file)).toEqual([]);
  });

  it('round-trips data through writeStorage/readStorage', () => {
    writeStorage(file, [{ id: 1 }, { id: 2 }]);
    expect(readStorage(file)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('leaves no temp files behind after a write', () => {
    writeStorage(file, [{ id: 1 }]);
    expect(fs.readdirSync(dir)).toEqual(['audits.json']);
  });

  it('quarantines a corrupt file instead of returning [] over it', () => {
    fs.writeFileSync(file, '{ not json');
    expect(() => readStorage(file)).toThrow(StorageCorruptError);
    expect(fs.existsSync(file)).toBe(false);
    const quarantined = fs.readdirSync(dir).filter(f => f.startsWith('audits.json.corrupt-'));
    expect(quarantined).toHaveLength(1);
    expect(fs.readFileSync(path.join(dir, quarantined[0]), 'utf-8')).toBe('{ not json');
  });

  it('treats a truncated (empty) file as corrupt, not as an empty store', () => {
    fs.writeFileSync(file, '');
    expect(() => readStorage(file)).toThrow(StorageCorruptError);
  });

  it('rejects valid JSON that is not an array', () => {
    fs.writeFileSync(file, '{"not":"an array"}');
    expect(() => readStorage(file)).toThrow(StorageCorruptError);
  });
});
