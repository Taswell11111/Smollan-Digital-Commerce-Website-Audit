import { AuditRecord } from '../types';

export function generatePdfReportHtml(audit: AuditRecord): string {
  const currentOverall = audit.overallScore;
  const projectedScore = Math.max(currentOverall, audit.projectedOverallScore || Math.min(100, currentOverall + 16));
  const uplift = Math.max(0, projectedScore - currentOverall);

  const essentialFindings = (audit.findings || []).filter(f => f.severity === 'Essential');
  const recommendedFindings = (audit.findings || []).filter(f => f.severity === 'Recommended');
  const contentFindings = (audit.findings || []).filter(f => f.severity === 'Content & Settings');

  const categories = Object.entries(audit.categoryResults || {}).map(([catName, catData]: [string, any]) => {
    const currentVal = catData.score;
    const enhancedVal = Math.max(currentVal, catData.enhancedScore || Math.min(100, currentVal + 20));
    return {
      name: catName,
      current: currentVal,
      enhanced: enhancedVal,
      status: catData.status
    };
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smollan Executive Audit Report - ${audit.businessName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.6;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .no-print {
      background: #002157;
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .no-print h2 { font-size: 16px; font-weight: 800; color: #00e5ff; }
    .no-print p { font-size: 12px; color: #cbd5e1; margin-top: 2px; }
    .no-print .btn-group { display: flex; gap: 8px; }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #00e5ff; color: #002157; }
    .btn-primary:hover { background: #67e8f9; }
    .btn-secondary { background: #1e293b; color: #ffffff; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }

    .report-container {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      padding: 40px;
    }

    /* Executive Hero Header */
    .header-banner {
      background: #002157;
      color: #ffffff;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 28px;
    }

    /* TOC */
    .toc {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .toc h2 { font-size: 16px; font-weight: 900; margin-bottom: 16px; color: #002157; }
    .toc ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .toc li { font-size: 14px; color: #334155; font-weight: 600; }
    
    .section-spacing { margin-top: 48px; margin-bottom: 24px; }
    .page-break { page-break-before: always; }

    .brand-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #00e5ff; margin-bottom: 6px; }
    .title-row h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #94a3b8; margin-top: 12px; max-width: 620px; }
    
    .section-title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #002157;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #00e5ff;
    }

    /* Print Overrides */
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .report-container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
      .page-break { page-break-before: always; }
      @page { margin: 12mm; size: A4 portrait; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div>
      <h2>Smollan Executive Audit Report Ready</h2>
      <p>Print directly to your local printer or select "Save as PDF" in your print dialog.</p>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save as PDF</button>
      <button onclick="window.close()" class="btn btn-secondary">✕ Close Window</button>
    </div>
  </div>

  <div class="report-container">
    <div class="header-banner">
      <div class="brand-tag">SMOLLAN DIGITAL COMMERCE · WINNING AT THE POINT OF PURCHASE</div>
      <h1>Audit Report: ${audit.businessName}</h1>
      <p class="subtitle">
        Comprehensive UX/UI and technical performance analysis.
      </p>
    </div>

    <!-- Table of Contents -->
    <div class="toc">
      <h2>Table of Contents</h2>
      <ul>
        <li>1. Executive Summary & Scoring</li>
        <li>2. Performance Metrics</li>
        <li>3. Remediation Plan</li>
        <li>4. Detailed Findings</li>
      </ul>
    </div>

    <div class="section-spacing">
        <h2 class="section-title">1. Executive Summary</h2>
        <p>This report provides a comprehensive audit of ${audit.businessName}. The analysis includes an overall store score, industry benchmarking, and a prioritized remediation plan to drive conversion and performance.</p>
    </div>

    <!-- ... rest of report body ... -->

  </div>
</body>
</html>`;
}
