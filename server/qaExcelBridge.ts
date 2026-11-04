import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { QaAuditReport } from '../src/types';

export function generateQaExcelWorkbook(report: QaAuditReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const uniqueId = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempJsonPath = path.join(tempDir, `${uniqueId}.json`);
    const tempXlsxPath = path.join(tempDir, `${uniqueId}.xlsx`);
    const scriptPath = path.join(process.cwd(), 'server', 'generate_qa_excel.py');

    fs.writeFile(tempJsonPath, JSON.stringify(report), 'utf-8', (writeErr) => {
      if (writeErr) {
        return reject(writeErr);
      }

      execFile(
        'python3',
        [scriptPath, tempJsonPath, tempXlsxPath],
        { timeout: 30000 },
        (error, stdout, stderr) => {
          // Clean up input json
          try { fs.unlinkSync(tempJsonPath); } catch {}

          if (error) {
            try { fs.unlinkSync(tempXlsxPath); } catch {}
            console.error('Python QA Excel generation error:', stderr || error.message);
            return reject(error);
          }

          fs.readFile(tempXlsxPath, (readErr, buffer) => {
            // Clean up output xlsx
            try { fs.unlinkSync(tempXlsxPath); } catch {}

            if (readErr) {
              return reject(readErr);
            }
            resolve(buffer);
          });
        }
      );
    });
  });
}
