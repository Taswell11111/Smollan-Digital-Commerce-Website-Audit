import { execFile } from 'child_process';
import path from 'path';

export interface RemediationItem {
  wcag_criteria: string;
  severity: 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'MINOR';
  element_identifier: string;
  issue_description: string;
  remediation_fix: string;
}

export interface PythonAuditResult {
  compliance_status: 'COMPLIANT' | 'NON-COMPLIANT';
  critical_count: number;
  serious_count: number;
  minor_moderate_count: number;
  remediation_backlog: RemediationItem[];
  accessibility_wins: string[];
}

/**
 * Invokes the Python WCAG 2.2 AA accessibility worker (/server/accessibility_worker.py)
 * passing the target URL and returning the parsed AuditResult object.
 */
export function runPythonAccessibilityAudit(targetUrl: string): Promise<PythonAuditResult | null> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'server', 'accessibility_worker.py');
    
    // Pass process.env so GEMINI_API_KEY is available to Python
    execFile(
      'python3', 
      [scriptPath, targetUrl], 
      { 
        maxBuffer: 10 * 1024 * 1024, 
        timeout: 45000,
        env: { ...process.env }
      }, 
      (error, stdout) => {
        if (error) {
          console.warn('Python accessibility worker notice:', error.message);
          return resolve(null);
        }
        try {
          const jsonStart = stdout.indexOf('{');
          if (jsonStart === -1) return resolve(null);
          const jsonStr = stdout.slice(jsonStart);
          const parsed = JSON.parse(jsonStr) as PythonAuditResult;
          resolve(parsed);
        } catch (e) {
          console.warn('Python output parse notice:', e);
          resolve(null);
        }
      }
    );
  });
}
