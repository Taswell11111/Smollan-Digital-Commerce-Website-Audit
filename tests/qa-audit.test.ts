import { describe, it, expect } from 'vitest';
import { auditPageSource } from '../server/qaSourceAuditor';
import { generateQaExcelWorkbook } from '../server/qaExcelBridge';

describe('Systematic Technical Website Page-Source QA Audit Engine', () => {
  it('handles minimal HTML without error', () => {
    const report = auditPageSource([{ url: 'https://test.com', html: '<!doctype html><html><head><title>Home</title></head><body>Hello</body></html>' }]);
    expect(report.id).toBeDefined();
    expect(report.pagesAnalyzed).toBe(1);
    expect(Array.isArray(report.findings)).toBe(true);
  });

  it('detects placeholder branding and outdated brand identities', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head>
          <title>ACME Corporation - Demo Store</title>
          <meta property="og:site_name" content="RealBrand Official">
        </head>
        <body>
          <header><h1>Welcome to ACME</h1></header>
          <footer><p>&copy; 2026 RealBrand Group</p></footer>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://realbrand.com', html: sampleHtml }]);
    const brandFindings = report.findings.filter(f => f.category === 'Branding and identity');
    expect(brandFindings.length).toBeGreaterThan(0);
    expect(brandFindings.some(f => f.anomalyDescription.includes('ACME'))).toBe(true);
  });

  it('detects dead navigation links and missing statutory legal links in footer', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>Test Store</title></head>
        <body>
          <nav>
            <a href="#">Category 1</a>
            <a href="javascript:void(0)">Category 2</a>
          </nav>
          <footer>
            <p>Copyright 2026</p>
          </footer>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const navFindings = report.findings.filter(f => f.category === 'Navigation and footer');
    expect(navFindings.some(f => f.subcategory.includes('Dead Navigation'))).toBe(true);
    expect(navFindings.some(f => f.subcategory.includes('Missing Statutory Legal Links'))).toBe(true);
  });

  it('detects unrendered template variables and outdated copyright years in website content', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>Template Test</title></head>
        <body>
          <div>Welcome {{ user.first_name }} to our store</div>
          <footer><p>&copy; 2019 Legacy Company</p></footer>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const contentFindings = report.findings.filter(f => f.category === 'Website content');
    expect(contentFindings.some(f => f.subcategory.includes('Template Syntax'))).toBe(true);
    expect(contentFindings.some(f => f.subcategory.includes('Copyright Year'))).toBe(true);
  });

  it('detects conflicting return policies and unencrypted legal links under legal and compliance', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>Policy Test</title></head>
        <body>
          <div class="banner">30-day money-back guarantee on all orders</div>
          <div class="terms">Customer has 14-day return period as per standard terms.</div>
          <footer><a href="http://store.com/privacy-policy">Privacy Policy</a></footer>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const legalFindings = report.findings.filter(f => f.category === 'Legal and compliance');
    expect(legalFindings.some(f => f.subcategory.includes('Contradictory Returns'))).toBe(true);
    expect(legalFindings.some(f => f.subcategory.includes('Insecure Unencrypted Legal'))).toBe(true);
  });

  it('detects expired promotional dates under promotions and campaigns', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>Promo Test</title></head>
        <body>
          <div class="promo">Spring Promotion - Valid until 15 March 2022!</div>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const promoFindings = report.findings.filter(f => f.category === 'Promotions and campaigns');
    expect(promoFindings.some(f => f.subcategory.includes('Expired Promotional Campaign'))).toBe(true);
  });

  it('detects reverse tabnabbing and localhost environment leaks under external links', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>Links Test</title></head>
        <body>
          <a href="https://external-partner.com" target="_blank">External Partner</a>
          <a href="http://localhost:8080/api/debug">Debug Endpoint</a>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const extFindings = report.findings.filter(f => f.category === 'External links');
    expect(extFindings.some(f => f.subcategory.includes('Reverse Tabnabbing'))).toBe(true);
    expect(extFindings.some(f => f.subcategory.includes('Localhost Environment Leak'))).toBe(true);
  });

  it('detects unconfigured analytics tokens and insecure form actions under forms and third-party apps', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head>
          <script>
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime()});})(window,document,'script','dataLayer','GTM-XXXXXX');
          </script>
        </head>
        <body>
          <form action="http://insecure.api.com/submit" method="POST">
            <input type="text" name="email">
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const formFindings = report.findings.filter(f => f.category === 'Forms and third-party applications');
    expect(formFindings.some(f => f.subcategory.includes('Insecure Unencrypted HTTP Form Action'))).toBe(true);
    expect(formFindings.some(f => f.subcategory.includes('Placeholder Analytics Container ID'))).toBe(true);
  });

  it('detects non-secure OpenGraph image URLs and missing meta descriptions under SEO and metadata', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Store SEO</title>
          <meta property="og:image" content="http://images.store.com/hero.jpg">
        </head>
        <body>SEO content</body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const seoFindings = report.findings.filter(f => f.category === 'SEO and metadata');
    expect(seoFindings.some(f => f.subcategory.includes('Insecure OpenGraph Asset'))).toBe(true);
    expect(seoFindings.some(f => f.subcategory.includes('Missing Meta Description Tag'))).toBe(true);
  });

  it('detects duplicate script inclusions under technical implementation', () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head>
          <script src="https://cdn.example.com/bundle.js"></script>
          <script src="https://cdn.example.com/bundle.js"></script>
        </head>
        <body>Body</body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const techFindings = report.findings.filter(f => f.category === 'Technical implementation');
    expect(techFindings.some(f => f.subcategory.includes('Duplicate External Script Tag Inclusion'))).toBe(true);
  });

  it('generates a valid binary Excel (.xlsx) workbook with python script', async () => {
    const sampleHtml = `
      <!doctype html>
      <html>
        <head><title>ACME Store</title></head>
        <body>
          <a href="#">Dead Link</a>
          <footer>&copy; 2020 ACME</footer>
        </body>
      </html>
    `;
    const report = auditPageSource([{ url: 'https://store.com', html: sampleHtml }]);
    const buffer = await generateQaExcelWorkbook(report);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard ZIP signature (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });
});
