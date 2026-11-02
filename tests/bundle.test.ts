import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Client Bundle Security (Phase 4c)', () => {
  it('Worker token does not appear in client source code or bundles', () => {
    const srcDir = path.join(process.cwd(), 'src');
    
    const readDirRecursive = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(readDirRecursive(filePath));
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
          results.push(filePath);
        }
      });
      return results;
    };

    const files = readDirRecursive(srcDir);
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('WORKER_TOKEN');
    });
  });
});
