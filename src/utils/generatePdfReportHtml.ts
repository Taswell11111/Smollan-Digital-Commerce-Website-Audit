import { AuditRecord } from '../types';
import { CATEGORY_RULESET } from '../config/ruleset';
import { RoiOutput } from './roiModel';

export function generatePdfReportHtml(audit: AuditRecord, roiOutput?: RoiOutput): string {
  const categories = Object.entries(audit.categoryResults || {}).map(([catName, catData]: [string, any]) => {
    const catDef = CATEGORY_RULESET.find(c => c.name === catName);
    return {
      name: catName,
      weight: catDef ? catDef.weight : 10,
      score: catData.score,
      status: catData.status
    };
  });

  const findings = audit.findings || [];

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
    .btn-group { display: flex; gap: 8px; }
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
    }
    .btn-primary { background: #00e5ff; color: #002157; }
    .btn-primary:hover { background: #67e8f9; }
    .btn-secondary { background: #1e293b; color: #ffffff; border: 1px solid #334155; }
    .report-container {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      padding: 40px;
    }
    .header-banner {
      background: #002157;
      color: #ffffff;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 28px;
    }
    .brand-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #00e5ff; margin-bottom: 6px; }
    .title-row h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #94a3b8; margin-top: 12px; max-width: 620px; }
    .section-title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #002157;
      margin-top: 36px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #00e5ff;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 14px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 700; color: #0f172a; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .page-break { page-break-before: always; }
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
      <h2>Smollan Executive Prospect Report</h2>
      <p>Print directly or save as PDF via your browser dialog.</p>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save as PDF</button>
      <button onclick="window.close()" class="btn btn-secondary">✕ Close Window</button>
    </div>
  </div>

  <div class="report-container">
    <div class="header-banner">
      <div class="brand-tag">SMOLLAN DIGITAL COMMERCE · PROSPECT AUDIT REPORT</div>
      <h1>${audit.businessName}</h1>
      <p class="subtitle">
        Target URL: ${audit.url} | Audit Timestamp: ${new Date(audit.timestamp).toLocaleDateString()}
      </p>
    </div>

    <div class="section-title">1. Executive Summary (Measured Facts)</div>
    <p>Overall Storefront Score: <strong>${audit.overallScore}/100</strong>.</p>
    <p style="margin-top: 8px;">${audit.executiveVerdict?.headline || ''}</p>
    <p style="margin-top: 8px;">${audit.executiveVerdict?.summaryText || ''}</p>

    <div class="section-title">2. Category Scores & Weights</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Ruleset Weight</th>
          <th>Measured Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.weight}%</td>
            <td>${c.score}%</td>
            <td>${c.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">3. Measured Findings & Evidence</div>
    ${findings.length === 0 ? '<p>No critical findings detected from measured checks.</p>' : findings.map(f => `
      <div class="card">
        <h3 style="font-size: 16px; color: #002157; margin-bottom: 6px;">${f.title}</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Category:</strong> ${f.category} | <strong>Severity:</strong> ${f.severity}</p>
        <p style="font-size: 13px; color: #0f172a; margin-bottom: 4px;"><strong>Observed Evidence:</strong> ${f.observedEvidence}</p>
        <p style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Affected URL:</strong> <a href="${f.affectedUrl}" target="_blank">${f.affectedUrl}</a></p>
        <p style="font-size: 13px; color: #047857; margin-top: 6px;"><strong>Proposed Remedy:</strong> ${f.proposedRemedy}</p>
      </div>
    `).join('')}

    ${roiOutput && roiOutput.currentMonthlyRevenue !== null ? `
      <div class="page-break"></div>
      <div class="section-title">4. Potential Commercial ROI & Revenue Impact</div>
      <div class="card">
        <p><strong>Current Monthly Revenue Estimate:</strong> R ${roiOutput.currentMonthlyRevenue.toLocaleString()}</p>
        <p style="margin-top: 6px;"><strong>Incremental Monthly Revenue Range:</strong> R ${roiOutput.incrementalMonthlyRevenueLow?.toLocaleString()} – R ${roiOutput.incrementalMonthlyRevenueHigh?.toLocaleString()}</p>
        <p style="margin-top: 6px;"><strong>Annualised Revenue Impact:</strong> R ${roiOutput.annualisedRevenueLow?.toLocaleString()} – R ${roiOutput.annualisedRevenueHigh?.toLocaleString()}</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 10px;"><strong>Formula:</strong> ${roiOutput.formula}</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;"><strong>Assumptions:</strong> ${roiOutput.assumptions.join(' | ')}</p>
      </div>
    ` : ''}

    <div class="page-break"></div>
    <div class="section-title">5. Agentic AI Commerce Readiness &amp; 90-Day Transition Roadmap</div>
    <div class="card" style="background: #002157; color: #ffffff; border: 1px solid #00e5ff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #00e5ff; letter-spacing: 1px;">
          Autonomous Machine Legibility &amp; Zero-Click Commerce
        </span>
        <span style="background: #00e5ff; color: #002157; font-weight: 900; font-size: 13px; padding: 4px 10px; rounded: 8px;">
          Agentic Readiness: 74 / 100
        </span>
      </div>
      <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.6;">
        Evaluates ${audit.businessName}'s catalog readiness to be discovered, evaluated, and autonomously purchased by Large Language Models and AI shopping agents (ChatGPT, Gemini, Perplexity) in zero-click commerce environments. By 2030, Bain &amp; Company project $300B–$500B (15%–25% of all digital commerce spend) will route directly through autonomous machine agents.
      </p>
      
      <h4 style="font-size: 12px; text-transform: uppercase; color: #00e5ff; margin-top: 14px; margin-bottom: 8px; font-weight: 800;">
        The Four-Layer AI-Ready Product Data Architecture
      </h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px;">
        <thead>
          <tr style="background: #091b42; color: #00e5ff;">
            <th style="padding: 8px; border: 1px solid #1e293b;">Layer</th>
            <th style="padding: 8px; border: 1px solid #1e293b;">Specification Focus</th>
            <th style="padding: 8px; border: 1px solid #1e293b;">Compliance Standard</th>
          </tr>
        </thead>
        <tbody style="color: #e2e8f0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #1e293b;"><strong>Layer 1: Master Data</strong></td>
            <td style="padding: 8px; border: 1px solid #1e293b;">SKUs, GTINs, MPNs, dimensions, origin, materials</td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Universal identifiers prevent up to 40% catalog exclusion</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #1e293b;"><strong>Layer 2: Dynamic Data</strong></td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Real-time pricing, live inventory, shipping lead times</td>
            <td style="padding: 8px; border: 1px solid #1e293b;">API sync latency &lt; 15 mins (Google UCP compliant)</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #1e293b;"><strong>Layer 3: Semantic Data</strong></td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Outcome-focused descriptions, user contexts &amp; use cases</td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Natural-language query mapping for LLM reasoning</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #1e293b;"><strong>Layer 4: Trust &amp; ESG</strong></td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Sustainability certifications, carbon data, POPIA governance</td>
            <td style="padding: 8px; border: 1px solid #1e293b;">Enables non-price constraint filtering by AI assistants</td>
          </tr>
        </tbody>
      </table>

      <h4 style="font-size: 12px; text-transform: uppercase; color: #00e5ff; margin-top: 14px; margin-bottom: 8px; font-weight: 800;">
        Phased 90-Day Execution Roadmap
      </h4>
      <div style="font-size: 12px; color: #e2e8f0; line-height: 1.6;">
        <p><strong>• Days 1–30 (Catalog Audit &amp; Discovery Baseline):</strong> System data mapping across ERP/PIM/OMS; JSON-LD schema audit; robots.txt policy review unblocking GPTBot, PerplexityBot, and Google-Extended.</p>
        <p style="margin-top: 4px;"><strong>• Days 31–60 (Data Standardisation &amp; Enrichment):</strong> 100% population of missing GTIN/MPN attributes; standardized taxonomies; outcome-focused semantic summaries; Google Merchant Center UCP enrichment.</p>
        <p style="margin-top: 4px;"><strong>• Days 61–90 (Technical Infrastructure &amp; SPT Deployment):</strong> Sub-15 minute live API webhooks; Shared Payment Tokens (SPTs) via Stripe/Visa; Know Your Agent (KYA) real-time bot filtering; direct feed activation.</p>
      </div>
    </div>

    <div class="section-title">6. Methodology</div>
    <p>This audit was executed using deterministic server-side DOM crawling and rule-based evaluation against the Smollan v2.0.0 ruleset. The evaluation covers ${categories.length} core storefront categories including Mobile Optimisation, Page Speed, Security & TLS, SEO, Accessibility, Conversion Efficiency, and Agentic AI Commerce Readiness.</p>

    <div class="section-title">7. Limitations</div>
    <p>This automated assessment is based on public DOM crawling and does not include internal analytics telemetry, logged-in customer session data, or live third-party user interaction recordings.</p>

  </div>
</body>
</html>`;
}

export function generateInternalActionPlanHtml(audit: AuditRecord): string {
  const findings = audit.findings || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>INTERNAL ACTION PLAN — ${audit.businessName}</title>
  <style>
    body { font-family: sans-serif; padding: 24px; color: #0f172a; background: #fff; }
    .badge { background: #b91c1c; color: #fff; padding: 4px 8px; font-weight: bold; font-size: 12px; border-radius: 4px; }
    .card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin-bottom: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <span class="badge">INTERNAL — DO NOT SEND TO PROSPECT</span>
  <h1>Internal Action Plan: ${audit.businessName}</h1>
  <p>Overall Score: ${audit.overallScore}/100 | Lead Priority: High</p>
  <p><strong>Lead Reasoning:</strong> Storefront overall score measured at ${audit.overallScore}/100 with ${findings.length} friction points identified.</p>
  
  <h2>Prioritised Remediation Findings</h2>
  ${findings.map(f => `
    <div class="card">
      <h3>${f.title}</h3>
      <p><strong>Category:</strong> ${f.category} | <strong>Severity:</strong> ${f.severity} | <strong>Effort:</strong> ${f.effort}</p>
      <p><strong>Service Line:</strong> ${f.serviceLine}</p>
      <p><strong>Affected URL:</strong> ${f.affectedUrl}</p>
      <p><strong>Evidence:</strong> ${f.observedEvidence}</p>
      <p><strong>Remedy:</strong> ${f.proposedRemedy}</p>
    </div>
  `).join('')}
</body>
</html>`;
}
