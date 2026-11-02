import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('Storage Safety & Concurrency Tests', () => {
  const testDir = path.join(process.cwd(), 'data-test');
  const testFile = path.join(testDir, 'test-storage.json');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('missing file returns empty array', () => {
    const readStorageTest = (file: string) => {
      if (!fs.existsSync(file)) return [];
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    };
    expect(readStorageTest(testFile)).toEqual([]);
  });

  it('corrupt file throws error and renames file without overwriting', () => {
    fs.writeFileSync(testFile, '{ invalid json');
    const readStorageTest = (file: string) => {
      if (!fs.existsSync(file)) return [];
      try {
        const content = fs.readFileSync(file, 'utf-8');
        return JSON.parse(content);
      } catch (e: any) {
        const corruptPath = `${file}.corrupt-${Date.now()}.json`;
        fs.renameSync(file, corruptPath);
        throw new Error(`Corrupt: ${e.message}`);
      }
    };

    expect(() => readStorageTest(testFile)).toThrowError(/Corrupt/);
    expect(fs.existsSync(testFile)).toBe(false);
    const files = fs.readdirSync(testDir);
    expect(files.some(f => f.includes('.corrupt-'))).toBe(true);
  });

  it('atomic write and concurrent writes persist successfully', async () => {
    const writeStorageAtomic = (file: string, data: any) => {
      const tmpFile = `${file}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data));
      fs.renameSync(tmpFile, file);
    };

    const fileLocks = new Map<string, Promise<any>>();
    const withLock = (file: string, op: () => void) => {
      const lock = (fileLocks.get(file) || Promise.resolve()).then(op);
      fileLocks.set(file, lock);
      return lock;
    };

    await Promise.all([
      withLock(testFile, () => {
        const curr = fs.existsSync(testFile) ? JSON.parse(fs.readFileSync(testFile, 'utf-8')) : [];
        curr.push({ id: 1 });
        writeStorageAtomic(testFile, curr);
      }),
      withLock(testFile, () => {
        const curr = fs.existsSync(testFile) ? JSON.parse(fs.readFileSync(testFile, 'utf-8')) : [];
        curr.push({ id: 2 });
        writeStorageAtomic(testFile, curr);
      })
    ]);

    const finalData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
    expect(finalData.length).toBe(2);
  });
});
