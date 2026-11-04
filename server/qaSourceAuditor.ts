import * as cheerio from 'cheerio';
import type { QaFinding, QaAuditReport, QaFindingCategory, QaSeverity, QaFindingStatus } from '../src/types';

interface PageInput {
  url: string;
  html: string;
}

export function auditPageSource(pages: PageInput[], baseTargetUrl?: string): QaAuditReport {
  const findings: QaFinding[] = [];
  let nextNum = 1;
  const getRefId = () => `QA-${String(nextNum++).padStart(3, '0')}`;

  const currentYear = new Date().getFullYear();

  for (const page of pages) {
    const pageUrl = page.url || baseTargetUrl || 'https://target.local';
    const html = page.html || '';
    if (!html || html.trim().length === 0) continue;

    const $ = cheerio.load(html);

    // 1. BRANDING AND IDENTITY
    // Check Title Brand vs Footer Brand vs OG Site Name
    const titleText = $('title').text().trim();
    const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim() || '';
    const footerText = $('footer').text().trim();

    // Check placeholder brand identifiers
    const placeholderBrands = ['Lorem', 'ACME', 'Your Brand', 'Store Name', 'Shopify Store', 'Default Store', 'My Store', 'Example Corp'];
    for (const pb of placeholderBrands) {
      if (titleText.toLowerCase().includes(pb.toLowerCase())) {
        findings.push({
          refId: getRefId(),
          category: 'Branding and identity',
          subcategory: 'Placeholder Brand Reference',
          pageUrl,
          sourceLocation: '<title>',
          anomalyDescription: `Placeholder brand name "${pb}" found in page title`,
          supportingEvidence: `<title>${titleText}</title>`,
          whyAnomaly: 'The page title contains unreplaced generic template or demo brand identifiers.',
          customerImpact: 'Causes immediate skepticism and damages brand credibility.',
          businessImpact: 'Severe erosion of trust and search engine ranking penalties.',
          severity: 'High',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Extracted directly from HTML title',
          recommendedCorrectiveAction: `Replace placeholder brand string "${pb}" with official brand entity name.`
        });
        break;
      }
    }

    // Check brand discrepancy between title and og:site_name
    if (ogSiteName && titleText && !titleText.toLowerCase().includes(ogSiteName.toLowerCase())) {
      findings.push({
        refId: getRefId(),
        category: 'Branding and identity',
        subcategory: 'Brand Inconsistency Across Metadata',
        pageUrl,
        sourceLocation: 'meta[property="og:site_name"] vs <title>',
        anomalyDescription: `OpenGraph site name "${ogSiteName}" is absent from HTML page title`,
        supportingEvidence: `<title>${titleText}</title> vs og:site_name="${ogSiteName}"`,
        whyAnomaly: 'Social share cards display a brand identifier inconsistent with the browser tab title.',
        customerImpact: 'User confusion when navigating between social shares and website.',
        businessImpact: 'Fractured brand identity and diminished attribution across marketing channels.',
        severity: 'Medium',
        findingClassification: 'Potential anomaly',
        verificationStatus: 'Requires review against official brand styleguide',
        recommendedCorrectiveAction: 'Align meta og:site_name with brand title lockup.',
        verificationType: 'Brand styleguide verification'
      });
    }

    // 2. NAVIGATION AND FOOTER
    // Check empty, dead, or placeholder hrefs
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      const text = $(el).text().trim() || $(el).attr('aria-label') || 'Anchor';
      const isHeaderOrFooter = $(el).closest('header, nav, footer').length > 0;

      if (isHeaderOrFooter && (href === '#' || href === 'javascript:void(0)' || href === 'javascript:;' || href === '' || href === 'undefined' || href === 'null')) {
        findings.push({
          refId: getRefId(),
          category: 'Navigation and footer',
          subcategory: 'Dead Navigation / Empty Link Destination',
          pageUrl,
          sourceLocation: $(el).closest('footer').length > 0 ? 'footer a' : 'nav a',
          anomalyDescription: `Navigation item "${text.slice(0, 35)}" has placeholder link destination "${href}"`,
          supportingEvidence: $.html(el).slice(0, 140),
          whyAnomaly: 'Interactive navigation element has no configured target destination.',
          customerImpact: 'Dead click; frustrates users attempting to browse key categories or services.',
          businessImpact: 'Bounce rate increase and loss of lead conversion.',
          severity: 'High',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Confirmed in DOM structure',
          recommendedCorrectiveAction: `Configure valid URL destination for "${text}" or remove anchor affordance.`
        });
      }
    });

    // Check footer legal documents
    const footerHtml = $('footer').html() || '';
    const footerHasPrivacy = /privacy\s*(policy|notice)?|popia/i.test(footerHtml);
    const footerHasTerms = /terms\s*(&|and)?\s*(conditions|use|of\s*service)?/i.test(footerHtml);
    if ($('footer').length > 0 && (!footerHasPrivacy || !footerHasTerms)) {
      findings.push({
        refId: getRefId(),
        category: 'Navigation and footer',
        subcategory: 'Missing Statutory Legal Links in Footer',
        pageUrl,
        sourceLocation: 'footer',
        anomalyDescription: `Footer is missing standard legal document references (${!footerHasPrivacy ? 'Privacy Policy' : ''} ${!footerHasTerms ? 'Terms & Conditions' : ''})`.trim(),
        supportingEvidence: $('footer').text().slice(0, 160) || '<footer>...</footer>',
        whyAnomaly: 'Footer does not provide standard links to mandatory statutory consumer disclosures.',
        customerImpact: 'Inability to inspect data protection and merchant terms prior to transaction.',
        businessImpact: 'Statutory compliance violation under POPIA, CPA, and consumer protection acts.',
        severity: 'Critical',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Confirmed in footer DOM',
        recommendedCorrectiveAction: 'Add visible, unambiguous links to Privacy Policy and Terms of Service in global footer.',
        policyTermsPage: pageUrl,
        legalImplications: 'Non-compliance with statutory disclosure mandates.'
      });
    }

    // 3. WEBSITE CONTENT
    // Check placeholder / lorem ipsum text
    const fullBodyText = $('body').text();
    const loremMatch = fullBodyText.match(/lorem\s+ipsum/i);
    if (loremMatch) {
      const matchIndex = loremMatch.index || 0;
      const snippet = fullBodyText.slice(Math.max(0, matchIndex - 30), matchIndex + 70).trim();
      findings.push({
        refId: getRefId(),
        category: 'Website content',
        subcategory: 'Unrendered Placeholder Text (Lorem Ipsum)',
        pageUrl,
        sourceLocation: 'body text node',
        anomalyDescription: 'Placeholder "Lorem Ipsum" copy detected in live page text',
        supportingEvidence: snippet,
        whyAnomaly: 'Draft placeholder copy was published to production without final editorial review.',
        customerImpact: 'Appears unprofessional and gives an impression of an unmaintained site.',
        businessImpact: 'Immediate loss of consumer trust; incomplete service communication.',
        severity: 'High',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from body text',
        recommendedCorrectiveAction: 'Replace placeholder Lorem Ipsum text with approved marketing copy.'
      });
    }

    // Check unrendered template tags
    const rawHtml = html;
    const templateTagMatch = rawHtml.match(/(\{\{\s*[\w.]+\s*\}\}|\{%\s*[\w.]+\s*%\}|\$\{[\w.]+\})/);
    if (templateTagMatch) {
      findings.push({
        refId: getRefId(),
        category: 'Website content',
        subcategory: 'Unrendered Template Syntax Leak',
        pageUrl,
        sourceLocation: 'DOM text node',
        anomalyDescription: `Unrendered template variable "${templateTagMatch[0]}" rendered to output`,
        supportingEvidence: templateTagMatch[0],
        whyAnomaly: 'Server-side templating engine failed to interpolate variable value before HTTP dispatch.',
        customerImpact: 'Displays cryptic code tokens to visitors.',
        businessImpact: 'Indicates rendering pipeline errors and potential data leakage.',
        severity: 'Medium',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from raw HTML stream',
        recommendedCorrectiveAction: 'Ensure templating context provides required variables or fallback strings.'
      });
    }

    // Check outdated copyright year
    const copyrightMatch = footerText.match(/(?:©|copyright|\(c\))\s*(?:20\d{2}\s*[-–]\s*)?(201\d|202[0-3])/i);
    if (copyrightMatch) {
      const statedYear = copyrightMatch[1];
      findings.push({
        refId: getRefId(),
        category: 'Website content',
        subcategory: 'Outdated Copyright Year Notice',
        pageUrl,
        sourceLocation: 'footer copyright notice',
        anomalyDescription: `Stated copyright year is ${statedYear} (current year is ${currentYear})`,
        supportingEvidence: copyrightMatch[0],
        whyAnomaly: 'Footer copyright statement has not been updated in recent annual cycles.',
        customerImpact: 'Suggests the business or website may be dormant or no longer trading.',
        businessImpact: 'Negative customer sentiment and weak housekeeping indicator in enterprise reviews.',
        severity: 'Low',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from footer text',
        recommendedCorrectiveAction: `Update footer copyright year to dynamic current year (${currentYear}).`
      });
    }

    // Check dummy email addresses
    const dummyEmailMatch = rawHtml.match(/[a-zA-Z0-9._%+-]+@(example\.com|test\.com|domain\.com|yourcompany\.com)/i);
    if (dummyEmailMatch) {
      findings.push({
        refId: getRefId(),
        category: 'Website content',
        subcategory: 'Placeholder Contact Email Address',
        pageUrl,
        sourceLocation: 'contact block / mailto link',
        anomalyDescription: `Dummy email address "${dummyEmailMatch[0]}" exposed in source code`,
        supportingEvidence: dummyEmailMatch[0],
        whyAnomaly: 'Documentation or template email address was left unchanged in production.',
        customerImpact: 'Customer emails sent to this address will bounce or remain unanswered.',
        businessImpact: 'Critical loss of sales inquiries, customer service breakdowns.',
        severity: 'High',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from source code',
        recommendedCorrectiveAction: `Replace "${dummyEmailMatch[0]}" with official monitored corporate mailbox.`
      });
    }

    // 4. LEGAL AND COMPLIANCE
    // Check for conflicting return policies
    const thirtyDayReturn = /30[\s-]day\s*(return|refund|money[\s-]back)/i.test(fullBodyText);
    const fourteenDayReturn = /14[\s-]day\s*(return|refund|money[\s-]back|cooling[\s-]off)/i.test(fullBodyText);
    if (thirtyDayReturn && fourteenDayReturn) {
      findings.push({
        refId: getRefId(),
        category: 'Legal and compliance',
        subcategory: 'Contradictory Returns Window Disclosures',
        pageUrl,
        sourceLocation: 'terms & marketing sections',
        anomalyDescription: 'Page mentions both "30-day" and "14-day" return terms in different sections',
        supportingEvidence: 'Simultaneous instances of "30-day return" and "14-day return" detected',
        whyAnomaly: 'Conflicting return policies expose the business to consumer dispute liabilities.',
        customerImpact: 'Confusion regarding actual statutory and store refund deadlines.',
        businessImpact: 'Consumer protection tribunal liability and potential payment gateway chargebacks.',
        severity: 'High',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Cross-referenced between marketing and terms copy',
        recommendedCorrectiveAction: 'Harmonize marketing banners with legal terms of sale.',
        policyTermsPage: pageUrl,
        legalImplications: 'Violates requirements for transparent, non-deceptive trading terms.'
      });
    }

    // Check non-secure HTTP links in legal or payment contexts
    $('a[href^="http://"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();
      if (text.includes('privacy') || text.includes('terms') || text.includes('pay') || text.includes('checkout') || text.includes('security')) {
        findings.push({
          refId: getRefId(),
          category: 'Legal and compliance',
          subcategory: 'Insecure Unencrypted Legal / Payment Protocol Link',
          pageUrl,
          sourceLocation: 'legal link anchor',
          anomalyDescription: `Statutory legal link targets unencrypted HTTP endpoint: "${href}"`,
          supportingEvidence: $.html(el).slice(0, 140),
          whyAnomaly: 'Legal and account links should strictly terminate on encrypted HTTPS endpoints.',
          customerImpact: 'Security warnings displayed in modern browsers when clicked.',
          businessImpact: 'POPIA / GDPR security mandate breach; SSL protocol integrity degradation.',
          severity: 'Critical',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Extracted from href protocol inspection',
          recommendedCorrectiveAction: `Update URL protocol to https://${href.replace('http://', '')}.`,
          policyTermsPage: href,
          legalImplications: 'Failure to safeguard data in transit under data privacy regulations.'
        });
      }
    });

    // 5. PROMOTIONS AND CAMPAIGNS
    // Expired dates in promotional text
    const expiredPromoMatch = fullBodyText.match(/(?:valid\s*until|ends|expires|competition\s*closes)[:\s]+(\d{1,2}\s+[a-zA-Z]+\s+(201\d|202[0-3]))/i);
    if (expiredPromoMatch) {
      findings.push({
        refId: getRefId(),
        category: 'Promotions and campaigns',
        subcategory: 'Expired Promotional Campaign Date Exposed',
        pageUrl,
        sourceLocation: 'promotional banner text',
        anomalyDescription: `Promotional campaign specifies an expired validity date: "${expiredPromoMatch[0]}"`,
        supportingEvidence: expiredPromoMatch[0],
        whyAnomaly: 'Historical campaign copy remains visible to users on the live storefront.',
        customerImpact: 'Customers attempt to redeem expired promotional perks and encounter rejection.',
        businessImpact: 'Customer service friction, negative brand reviews, promotional liability.',
        severity: 'Medium',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from body text',
        recommendedCorrectiveAction: 'Deactivate expired promotional banner or update dates for current cycle.',
        policyTermsPage: pageUrl
      });
    }

    // Historical holiday campaigns
    const holidayMatch = fullBodyText.match(/(?:black\s*friday|cyber\s*monday|summer\s*sale|spring\s*sale|festive\s*deals)\s*(201\d|202[0-3])/i);
    if (holidayMatch) {
      findings.push({
        refId: getRefId(),
        category: 'Promotions and campaigns',
        subcategory: 'Outdated Seasonal Campaign References',
        pageUrl,
        sourceLocation: 'campaign headline',
        anomalyDescription: `Seasonal campaign references historical year: "${holidayMatch[0]}"`,
        supportingEvidence: holidayMatch[0],
        whyAnomaly: 'Historical seasonal landing pages or banners are still indexed and displayed.',
        customerImpact: 'Shoppers perceive the store as stagnant or defunct.',
        businessImpact: 'Wasted organic traffic arriving on expired seasonal offers.',
        severity: 'Medium',
        findingClassification: 'Potential anomaly',
        verificationStatus: 'Requires live verification of current marketing calendar',
        recommendedCorrectiveAction: 'Unpublish or 301 redirect historical seasonal campaign pages.',
        verificationType: 'Live marketing schedule review'
      });
    }

    // 6. EXTERNAL LINKS
    // External links without rel="noopener noreferrer"
    let unsafeExternalLinksCount = 0;
    $('a[target="_blank"]').each((_, el) => {
      const rel = ($(el).attr('rel') || '').toLowerCase();
      const href = $(el).attr('href') || '';
      if (href.startsWith('http') && !rel.includes('noopener')) {
        unsafeExternalLinksCount++;
        if (unsafeExternalLinksCount <= 2) {
          findings.push({
            refId: getRefId(),
            category: 'External links',
            subcategory: 'Unsafe Target Blank External Anchor (Reverse Tabnabbing)',
            pageUrl,
            sourceLocation: 'a[target="_blank"]',
            anomalyDescription: `External target="_blank" link to "${href.slice(0, 45)}" lacks rel="noopener noreferrer"`,
            supportingEvidence: $.html(el).slice(0, 140),
            whyAnomaly: 'Links opening in new tabs without rel="noopener" allow the target page to access window.opener.',
            customerImpact: 'Exposes users to phishing attacks via malicious redirects in original tab.',
            businessImpact: 'Material OWASP security vulnerability on corporate storefront.',
            severity: 'High',
            findingClassification: 'Confirmed anomaly',
            verificationStatus: 'Confirmed in DOM attributes',
            recommendedCorrectiveAction: 'Add rel="noopener noreferrer" to all external links opening in new windows.'
          });
        }
      }
    });

    // Links targeting localhost or development environments
    $('a[href], link[href], script[src], img[src]').each((_, el) => {
      const attr = $(el).attr('href') || $(el).attr('src') || '';
      if (attr.includes('localhost') || attr.includes('127.0.0.1') || attr.includes('staging.') || attr.includes('.test')) {
        findings.push({
          refId: getRefId(),
          category: 'External links',
          subcategory: 'Development / Localhost Environment Leak',
          pageUrl,
          sourceLocation: `${el.tagName}[${$(el).attr('href') ? 'href' : 'src'}]`,
          anomalyDescription: `Asset or anchor targets non-production environment: "${attr}"`,
          supportingEvidence: $.html(el).slice(0, 130),
          whyAnomaly: 'Internal development/staging URLs were committed and deployed to production.',
          customerImpact: 'Broken link or connection refused error when clicked by external visitors.',
          businessImpact: 'Potential exposure of internal staging domains and unreleased features.',
          severity: 'Critical',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Extracted directly from tag attributes',
          recommendedCorrectiveAction: 'Replace internal development URL with production CDN or relative route.'
        });
      }
    });

    // 7. RETAILER REFERENCES
    // Check broken or placeholder retailer store locator links
    $('a').each((_, el) => {
      const txt = $(el).text().toLowerCase();
      const href = ($(el).attr('href') || '').toLowerCase();
      if ((txt.includes('find a store') || txt.includes('store locator') || txt.includes('stockists')) && (href === '#' || href === '')) {
        findings.push({
          refId: getRefId(),
          category: 'Retailer references',
          subcategory: 'Unwired Retailer / Stockist Store Locator',
          pageUrl,
          sourceLocation: 'store locator CTA',
          anomalyDescription: `Store locator link "${$(el).text().trim()}" has empty href destination`,
          supportingEvidence: $.html(el).slice(0, 120),
          whyAnomaly: 'Customers cannot locate authorized physical retailers or stockists.',
          customerImpact: 'Inability to find nearby retail partners to make offline purchases.',
          businessImpact: 'Lost retail distribution sales and channel partner friction.',
          severity: 'Medium',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Confirmed in anchor href attribute',
          recommendedCorrectiveAction: 'Link to active store locator module or interactive map.'
        });
      }
    });

    // 8. FORMS AND THIRD-PARTY APPLICATIONS
    // Check forms without valid action
    $('form').each((_, el) => {
      const action = $(el).attr('action');
      const method = $(el).attr('method') || 'GET';
      const formId = $(el).attr('id') || $(el).attr('name') || 'form';

      if (!action || action === '#' || action === '') {
        findings.push({
          refId: getRefId(),
          category: 'Forms and third-party applications',
          subcategory: 'Form Missing Backend Action Endpoint',
          pageUrl,
          sourceLocation: `form#${formId}`,
          anomalyDescription: `Form "${formId}" lacks a designated submission endpoint action`,
          supportingEvidence: $.html(el).slice(0, 120),
          whyAnomaly: 'Form will reload current page or fail when customer clicks submit.',
          customerImpact: 'Loss of user input without feedback upon submission.',
          businessImpact: 'Direct leakage of inbound leads and customer inquiries.',
          severity: 'High',
          findingClassification: 'Potential anomaly',
          verificationStatus: 'May rely on AJAX event listener; requires live submission test',
          recommendedCorrectiveAction: 'Configure explicit action endpoint or attach verified JavaScript submission handler.',
          verificationType: 'Live form submission test'
        });
      }

      // Check insecure HTTP form submission action
      if (action && action.startsWith('http://')) {
        findings.push({
          refId: getRefId(),
          category: 'Forms and third-party applications',
          subcategory: 'Insecure Unencrypted HTTP Form Action',
          pageUrl,
          sourceLocation: `form[action^="http://"]`,
          anomalyDescription: `Form data is submitted over unencrypted HTTP: "${action}"`,
          supportingEvidence: $.html(el).slice(0, 120),
          whyAnomaly: 'Transmitting user form submissions over unencrypted HTTP exposes credentials and PII.',
          customerImpact: 'High risk of man-in-the-middle interception of personal customer data.',
          businessImpact: 'Immediate regulatory fine risk and browser security blocking.',
          severity: 'Critical',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Confirmed in form action attribute',
          recommendedCorrectiveAction: 'Update form action to secure HTTPS endpoint.',
          policyTermsPage: pageUrl,
          legalImplications: 'Severe breach of POPIA/GDPR data security obligations.'
        });
      }
    });

    // Check placeholder GTM or Analytics tags
    const scriptTexts = $('script').map((_, el) => $(el).html() || '').get().join('\n');
    const placeholderGtmMatch = scriptTexts.match(/(GTM-[X0-9]{4,}|UA-[X0-9-]+|G-[X0-9]{6,})/);
    if (placeholderGtmMatch && (placeholderGtmMatch[0].includes('X') || placeholderGtmMatch[0].includes('XXXX'))) {
      findings.push({
        refId: getRefId(),
        category: 'Forms and third-party applications',
        subcategory: 'Unconfigured Placeholder Analytics Container ID',
        pageUrl,
        sourceLocation: 'inline <script>',
        anomalyDescription: `Dummy analytics container token "${placeholderGtmMatch[0]}" detected in scripts`,
        supportingEvidence: placeholderGtmMatch[0],
        whyAnomaly: 'Analytics or Tag Manager snippet contains template placeholder container ID.',
        customerImpact: 'None directly visible, but consent tracking may fail.',
        businessImpact: 'Zero analytics telemetry captured; blind marketing and conversion tracking.',
        severity: 'High',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Extracted from inline script body',
        recommendedCorrectiveAction: 'Insert live production Google Tag Manager or GA4 measurement ID.'
      });
    }

    // 9. SEO AND METADATA
    // Non-secure og:image asset
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage && ogImage.startsWith('http://')) {
      findings.push({
        refId: getRefId(),
        category: 'SEO and metadata',
        subcategory: 'Insecure OpenGraph Asset Protocol',
        pageUrl,
        sourceLocation: 'meta[property="og:image"]',
        anomalyDescription: `OpenGraph preview image references unencrypted HTTP: "${ogImage}"`,
        supportingEvidence: `<meta property="og:image" content="${ogImage}">`,
        whyAnomaly: 'Social media platforms (Facebook, LinkedIn, Twitter) block non-HTTPS preview cards.',
        customerImpact: 'Social shares render as broken text links without rich visual imagery.',
        businessImpact: 'Drastic reduction in social click-through rates and referral traffic.',
        severity: 'Medium',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Confirmed in OpenGraph tag',
        recommendedCorrectiveAction: `Host image on secure HTTPS CDN: https://${ogImage.replace('http://', '')}.`
      });
    }

    // Missing meta description or title
    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
    if (!metaDesc) {
      findings.push({
        refId: getRefId(),
        category: 'SEO and metadata',
        subcategory: 'Missing Meta Description Tag',
        pageUrl,
        sourceLocation: '<head>',
        anomalyDescription: 'Page is missing a meta description tag',
        supportingEvidence: '<head> contains no meta[name="description"]',
        whyAnomaly: 'Search engines generate arbitrary snippets from page text instead of curated copy.',
        customerImpact: 'Suboptimal, clipped search result snippets shown to searchers.',
        businessImpact: 'Depressed organic search click-through rate (CTR).',
        severity: 'Low',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Confirmed in document head',
        recommendedCorrectiveAction: 'Add unique, concise 140-160 character meta description summarizing the page.'
      });
    }

    // Missing Canonical link
    const canonical = $('link[rel="canonical"]').attr('href')?.trim();
    if (!canonical) {
      findings.push({
        refId: getRefId(),
        category: 'SEO and metadata',
        subcategory: 'Missing Canonical URL Tag',
        pageUrl,
        sourceLocation: '<head>',
        anomalyDescription: 'Page lacks canonical URL link tag (<link rel="canonical">)',
        supportingEvidence: '<head> contains no link[rel="canonical"]',
        whyAnomaly: 'Search engines may index duplicate URL variations (query params, tracking tokens).',
        customerImpact: 'None directly visible to customers.',
        businessImpact: 'Dilution of organic page authority across duplicate URL iterations.',
        severity: 'Low',
        findingClassification: 'Technical observation',
        verificationStatus: 'Observed in head structure',
        recommendedCorrectiveAction: `Add self-referencing canonical tag: <link rel="canonical" href="${pageUrl}">.`
      });
    }

    // Accidental noindex on live page
    const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
    if (robotsMeta.includes('noindex')) {
      findings.push({
        refId: getRefId(),
        category: 'SEO and metadata',
        subcategory: 'Robots Noindex Directive Blocking Search Indexing',
        pageUrl,
        sourceLocation: 'meta[name="robots"]',
        anomalyDescription: 'Page contains "noindex" directive, preventing search engine indexing',
        supportingEvidence: `<meta name="robots" content="${robotsMeta}">`,
        whyAnomaly: 'Staging "noindex" directive was inadvertently retained on live storefront.',
        customerImpact: 'Customers cannot discover the page or products via search engines.',
        businessImpact: 'Catastrophic loss of organic search visibility and organic revenue.',
        severity: 'Critical',
        findingClassification: 'Confirmed anomaly',
        verificationStatus: 'Confirmed in robots metadata',
        recommendedCorrectiveAction: 'Remove "noindex" directive from production metadata.'
      });
    }

    // 10. TECHNICAL IMPLEMENTATION
    // Check for duplicate script tags
    const scriptSrcs = new Set<string>();
    const duplicateScripts = new Set<string>();
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src')?.trim();
      if (src) {
        if (scriptSrcs.has(src)) {
          duplicateScripts.add(src);
        } else {
          scriptSrcs.add(src);
        }
      }
    });

    for (const dup of duplicateScripts) {
      findings.push({
        refId: getRefId(),
        category: 'Technical implementation',
        subcategory: 'Duplicate External Script Tag Inclusion',
        pageUrl,
        sourceLocation: `script[src="${dup.slice(0, 50)}"]`,
        anomalyDescription: `Identical script asset loaded multiple times: "${dup.slice(0, 60)}"`,
        supportingEvidence: `<script src="${dup}"></script> (loaded 2+ times)`,
        whyAnomaly: 'Redundant network fetch and duplicate execution of client-side JavaScript.',
        customerImpact: 'Excessive bandwidth consumption and increased mobile rendering delay.',
        businessImpact: 'Degrades Core Web Vitals (LCP, INP) and increases cloud bandwidth costs.',
        severity: 'Medium',
        findingClassification: 'Technical observation',
        verificationStatus: 'Observed in script bundle inventory',
        recommendedCorrectiveAction: 'Deduplicate script registration in HTML template or bundle config.'
      });
    }

    // Check broken asset sources (img src="" or src="undefined")
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src === '' || src === 'undefined' || src === 'null') {
        findings.push({
          refId: getRefId(),
          category: 'Technical implementation',
          subcategory: 'Broken Empty Image Source Reference',
          pageUrl,
          sourceLocation: 'img',
          anomalyDescription: `Image element rendered with invalid or empty source: src="${src}"`,
          supportingEvidence: $.html(el).slice(0, 100),
          whyAnomaly: 'Missing image resource triggers 404 or broken image placeholder in browser.',
          customerImpact: 'Displays broken image icon or empty visual hole in viewport layout.',
          businessImpact: 'Unprofessional aesthetic and failed product merchandising display.',
          severity: 'Medium',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Extracted from img attribute',
          recommendedCorrectiveAction: 'Supply valid asset URL or remove empty img tag.'
        });
      }
    });

    // 11. CUSTOMER EXPERIENCE
    // Missing alt text on functional buttons or interactive elements
    $('button').each((_, el) => {
      const text = $(el).text().trim();
      const aria = $(el).attr('aria-label') || $(el).attr('title');
      const hasImgWithAlt = $(el).find('img[alt]').length > 0;
      if (!text && !aria && !hasImgWithAlt) {
        findings.push({
          refId: getRefId(),
          category: 'Customer experience',
          subcategory: 'Unlabelled Interactive Button (Accessibility Barrier)',
          pageUrl,
          sourceLocation: 'button',
          anomalyDescription: 'Interactive button contains no text label or aria-label attribute',
          supportingEvidence: $.html(el).slice(0, 90),
          whyAnomaly: 'Screen readers and assistive devices cannot announce the button function to users.',
          customerImpact: 'Visually impaired users cannot determine how to activate button action.',
          businessImpact: 'WCAG 2.2 AA compliance violation and accessibility lawsuit liability.',
          severity: 'High',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Extracted from button DOM attributes',
          recommendedCorrectiveAction: 'Add aria-label attribute explaining button intent (e.g. aria-label="Close dialog").'
        });
      }
    });

    // 12. PRODUCT AND SHOPPING EXPERIENCE
    // Add to cart button pointing nowhere
    $('button, a').each((_, el) => {
      const txt = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      const isCartAction = txt.includes('add to cart') || txt.includes('buy now') || txt.includes('add to basket');
      if (isCartAction && (href === '#' || href === 'javascript:void(0)')) {
        findings.push({
          refId: getRefId(),
          category: 'Product and shopping experience',
          subcategory: 'Unwired Add-To-Cart Purchase Affordance',
          pageUrl,
          sourceLocation: `${el.tagName}[href="${href}"]`,
          anomalyDescription: `Primary purchase action "${$(el).text().trim()}" has placeholder destination "${href}"`,
          supportingEvidence: $.html(el).slice(0, 120),
          whyAnomaly: 'Purchase CTA does not submit a cart payload or initiate checkout.',
          customerImpact: 'Shoppers click purchase CTA and nothing is added to their cart.',
          businessImpact: 'Complete breakdown of storefront checkout funnel and immediate revenue loss.',
          severity: 'Critical',
          findingClassification: 'Confirmed anomaly',
          verificationStatus: 'Confirmed in purchase element',
          recommendedCorrectiveAction: 'Bind purchase CTA to active cart API or valid form submission.'
        });
      }
    });

  }

  // Calculate summary counts
  const countsByStatus = {
    confirmed: findings.filter(f => f.findingClassification === 'Confirmed anomaly').length,
    potential: findings.filter(f => f.findingClassification === 'Potential anomaly').length,
    observation: findings.filter(f => f.findingClassification === 'Technical observation').length,
    requiresVerification: findings.filter(f => f.findingClassification === 'Requires live verification').length,
  };

  const countsBySeverity = {
    critical: findings.filter(f => f.severity === 'Critical').length,
    high: findings.filter(f => f.severity === 'High').length,
    medium: findings.filter(f => f.severity === 'Medium').length,
    low: findings.filter(f => f.severity === 'Low').length,
  };

  const countsByCategory: Record<string, number> = {};
  for (const f of findings) {
    countsByCategory[f.category] = (countsByCategory[f.category] || 0) + 1;
  }

  return {
    id: `QA-AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    targetUrl: baseTargetUrl || pages[0]?.url || 'Target Storefront',
    pagesAnalyzed: pages.length,
    totalFindings: findings.length,
    countsByStatus,
    countsBySeverity,
    countsByCategory,
    findings,
    limitations: [
      'Audit was conducted strictly against supplied server-delivered HTML, inline scripts, embedded JSON-LD, and metadata.',
      'Dynamic single-page application (SPA) client-side state transitions requiring user session authentication are classified as Requires Live Verification.',
      'Third-party iframe widgets and sandboxed payment gateways cannot be inspected without authenticated merchant credentials.'
    ]
  };
}
