#!/usr/bin/env python3
"""
Python script to generate a downloadable, professionally formatted Excel workbook (.xlsx)
for Systematic Technical Website Page-Source QA Audits.
Standard library only (zipfile + xml), zero external dependency requirements.
"""

import sys
import json
import zipfile
import html

def escape_xml(s):
    if s is None:
        return ""
    return html.escape(str(s))

def col_letter(col_idx):
    """1-indexed column index to Excel column letters (1 -> A, 27 -> AA, etc.)"""
    result = ""
    while col_idx > 0:
        col_idx, remainder = divmod(col_idx - 1, 26)
        result = chr(65 + remainder) + result
    return result

def build_styles_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="8">
    <font><sz val="10.5"/><name val="Segoe UI"/><color rgb="FF1E293B"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="14"/><name val="Segoe UI"/><color rgb="FF091B42"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FF091B42"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FF991B1B"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FFC2410C"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FFA16207"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FF475569"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF091B42"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFEDD5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF9C3"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="10">
    <!-- 0: Regular data cell with border and text wrapping -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment wrapText="1" vertical="top"/>
    </xf>
    <!-- 1: Dark Header Row (Navy Blue #091B42, Bold White, Centered, Wrapped) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: Critical Severity (Red Background #FEE2E2, Dark Red Text) -->
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <!-- 3: High Severity (Orange Background #FFEDD5, Dark Orange Text) -->
    <xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <!-- 4: Medium Severity (Yellow Background #FEF9C3, Dark Yellow Text) -->
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <!-- 5: Low Severity (Grey Background #F1F5F9, Slate Text) -->
    <xf numFmtId="0" fontId="7" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <!-- 6: Title Big Header -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <!-- 7: Section Header Bold -->
    <xf numFmtId="0" fontId="3" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <!-- 8: Center aligned data cell -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <!-- 9: Number right aligned -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="top"/>
    </xf>
  </cellXfs>
</styleSheet>"""

def build_worksheet_xml(rows, col_widths, freeze_row=1, freeze_col=0, enable_autofilter=True):
    """
    rows: list of lists, where each cell is either a string, number, or (value, style_idx)
    """
    max_cols = max(len(r) for r in rows) if rows else 1
    total_rows = len(rows)
    
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    ]
    
    if freeze_row > 0 or freeze_col > 0:
        top_left = f"{col_letter(freeze_col + 1)}{freeze_row + 1}"
        xml_parts.append(f'''  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane xSplit="{freeze_col}" ySplit="{freeze_row}" topLeftCell="{top_left}" activePane="bottomRight" state="frozen"/>
    </sheetView>
  </sheetViews>''')
        
    if col_widths:
        xml_parts.append('  <cols>')
        for idx, width in enumerate(col_widths, 1):
            xml_parts.append(f'    <col min="{idx}" max="{idx}" width="{width}" customWidth="1"/>')
        xml_parts.append('  </cols>')
        
    xml_parts.append('  <sheetData>')
    
    for row_idx, row in enumerate(rows, 1):
        xml_parts.append(f'    <row r="{row_idx}">')
        for c_idx, cell in enumerate(row, 1):
            cell_ref = f"{col_letter(c_idx)}{row_idx}"
            
            style_idx = 0
            if isinstance(cell, tuple):
                val, style_idx = cell
            else:
                val = cell
                
            if val is None:
                val = ""
                
            if isinstance(val, (int, float)):
                xml_parts.append(f'      <c r="{cell_ref}" s="{style_idx}"><v>{val}</v></c>')
            else:
                esc_val = escape_xml(str(val))
                xml_parts.append(f'      <c r="{cell_ref}" s="{style_idx}" t="inlineStr"><is><t>{esc_val}</t></is></c>')
        xml_parts.append('    </row>')
        
    xml_parts.append('  </sheetData>')
    
    if enable_autofilter and total_rows > 1 and max_cols > 0:
        filter_ref = f"A1:{col_letter(max_cols)}{total_rows}"
        xml_parts.append(f'  <autoFilter ref="{filter_ref}"/>')
        
    xml_parts.append('</worksheet>')
    return "\n".join(xml_parts)

def get_severity_style(severity):
    sev = str(severity).strip().lower()
    if sev == 'critical':
        return 2
    elif sev == 'high':
        return 3
    elif sev == 'medium':
        return 4
    elif sev == 'low':
        return 5
    return 8

def generate_excel(audit_data, output_path):
    findings = audit_data.get('findings', [])
    summary = audit_data.get('countsByStatus', {})
    sev_counts = audit_data.get('countsBySeverity', {})
    cat_counts = audit_data.get('countsByCategory', {})
    target_url = audit_data.get('targetUrl', 'Target Website')
    timestamp = audit_data.get('timestamp', '')
    limitations = audit_data.get('limitations', [])

    # 1. Executive Summary Sheet
    summary_rows = [
        [("Technical Website Page-Source QA Audit: Executive Summary", 6), "", ""],
        [("Target URL:", 7), target_url, ""],
        [("Audit Date:", 7), timestamp, ""],
        [("Total Anomalies & Technical Findings:", 7), len(findings), ""],
        ["", "", ""],
        [("Classification Status Breakdown", 7), ("Count", 7), ("Ratio", 7)],
        ["Confirmed Anomaly", summary.get('confirmed', 0), f"{(summary.get('confirmed', 0)/(len(findings) or 1))*100:.1f}%"],
        ["Potential Anomaly", summary.get('potential', 0), f"{(summary.get('potential', 0)/(len(findings) or 1))*100:.1f}%"],
        ["Technical Observation", summary.get('observation', 0), f"{(summary.get('observation', 0)/(len(findings) or 1))*100:.1f}%"],
        ["Requires Live Verification", summary.get('requiresVerification', 0), f"{(summary.get('requiresVerification', 0)/(len(findings) or 1))*100:.1f}%"],
        ["", "", ""],
        [("Severity Distribution", 7), ("Count", 7), ("Ratio", 7)],
        [("Critical (Immediate Security/Legal/Operational Risk)", 2), sev_counts.get('critical', 0), f"{(sev_counts.get('critical', 0)/(len(findings) or 1))*100:.1f}%"],
        [("High (Material Customer or Legal Inconsistency)", 3), sev_counts.get('high', 0), f"{(sev_counts.get('high', 0)/(len(findings) or 1))*100:.1f}%"],
        [("Medium (Content, Functionality, Process Issue)", 4), sev_counts.get('medium', 0), f"{(sev_counts.get('medium', 0)/(len(findings) or 1))*100:.1f}%"],
        [("Low (Minor Editorial or Housekeeping)", 5), sev_counts.get('low', 0), f"{(sev_counts.get('low', 0)/(len(findings) or 1))*100:.1f}%"],
        ["", "", ""],
        [("Category Scope Distribution", 7), ("Findings", 7), ("Status", 7)]
    ]
    
    categories = [
        "Branding and identity",
        "Navigation and footer",
        "Website content",
        "Legal and compliance",
        "Promotions and campaigns",
        "External links",
        "Retailer references",
        "Forms and third-party applications",
        "SEO and metadata",
        "Technical implementation",
        "Customer experience",
        "Product and shopping experience"
    ]
    for cat in categories:
        cnt = cat_counts.get(cat, 0)
        summary_rows.append([cat, cnt, "Audited"])
        
    if limitations:
        summary_rows.append(["", "", ""])
        summary_rows.append([("Methodology Scope & Audit Limitations", 7), "", ""])
        for lim in limitations:
            summary_rows.append([lim, "", ""])

    sheet1_xml = build_worksheet_xml(summary_rows, [44, 25, 25], freeze_row=0, enable_autofilter=False)

    # 2. Complete Anomaly Register
    reg_headers = [
        ("Reference ID", 1),
        ("Category", 1),
        ("Subcategory", 1),
        ("Page / URL", 1),
        ("Source Location", 1),
        ("Anomaly Description", 1),
        ("Supporting Evidence", 1),
        ("Why This Is An Anomaly", 1),
        ("Potential Customer Impact", 1),
        ("Potential Business/Operational Impact", 1),
        ("Severity", 1),
        ("Finding Classification", 1),
        ("Verification Status", 1),
        ("Recommended Corrective Action", 1),
        ("Additional Comments", 1)
    ]
    reg_rows = [reg_headers]
    for f in findings:
        sev_style = get_severity_style(f.get('severity', 'Low'))
        reg_rows.append([
            f.get('refId', ''),
            f.get('category', ''),
            f.get('subcategory', ''),
            f.get('pageUrl', ''),
            f.get('sourceLocation', ''),
            f.get('anomalyDescription', ''),
            f.get('supportingEvidence', ''),
            f.get('whyAnomaly', ''),
            f.get('customerImpact', ''),
            f.get('businessImpact', ''),
            (f.get('severity', 'Low'), sev_style),
            f.get('findingClassification', ''),
            f.get('verificationStatus', ''),
            f.get('recommendedCorrectiveAction', ''),
            f.get('additionalComments', '')
        ])
    sheet2_xml = build_worksheet_xml(
        reg_rows, 
        [14, 26, 24, 30, 26, 36, 40, 36, 32, 32, 14, 25, 22, 36, 28], 
        freeze_row=1
    )

    # 3. Technical Findings (Filtered for "Technical observation")
    tech_findings = [f for f in findings if f.get('findingClassification') == 'Technical observation']
    tech_rows = [reg_headers]
    for f in tech_findings:
        sev_style = get_severity_style(f.get('severity', 'Low'))
        tech_rows.append([
            f.get('refId', ''),
            f.get('category', ''),
            f.get('subcategory', ''),
            f.get('pageUrl', ''),
            f.get('sourceLocation', ''),
            f.get('anomalyDescription', ''),
            f.get('supportingEvidence', ''),
            f.get('whyAnomaly', ''),
            f.get('customerImpact', ''),
            f.get('businessImpact', ''),
            (f.get('severity', 'Low'), sev_style),
            f.get('findingClassification', ''),
            f.get('verificationStatus', ''),
            f.get('recommendedCorrectiveAction', ''),
            f.get('additionalComments', '')
        ])
    sheet3_xml = build_worksheet_xml(
        tech_rows, 
        [14, 26, 24, 30, 26, 36, 40, 36, 32, 32, 14, 25, 22, 36, 28], 
        freeze_row=1
    )

    # 4. Legal & Compliance Findings
    legal_headers = [
        ("Reference ID", 1),
        ("Relevant Policy / Terms Page", 1),
        ("Exact Wording / Reference", 1),
        ("Nature of Inconsistency", 1),
        ("Potential Legal / Compliance Implications", 1),
        ("Severity", 1),
        ("Recommended Review / Correction", 1)
    ]
    legal_findings = [
        f for f in findings 
        if f.get('category') in ['Legal and compliance', 'Promotions and campaigns']
    ]
    legal_rows = [legal_headers]
    for f in legal_findings:
        sev_style = get_severity_style(f.get('severity', 'Low'))
        legal_rows.append([
            f.get('refId', ''),
            f.get('policyTermsPage') or f.get('pageUrl', ''),
            f.get('supportingEvidence', ''),
            f.get('anomalyDescription', ''),
            f.get('legalImplications') or f.get('businessImpact', ''),
            (f.get('severity', 'Low'), sev_style),
            f.get('recommendedCorrectiveAction', '')
        ])
    sheet4_xml = build_worksheet_xml(
        legal_rows,
        [14, 30, 42, 36, 38, 14, 38],
        freeze_row=1
    )

    # 5. Verification Required
    verif_headers = [
        ("Reference ID", 1),
        ("Category", 1),
        ("Anomaly Description", 1),
        ("Page / URL", 1),
        ("Verification Type", 1),
        ("Severity", 1),
        ("Preliminary Action Plan", 1)
    ]
    verif_findings = [f for f in findings if f.get('findingClassification') == 'Requires live verification']
    verif_rows = [verif_headers]
    for f in verif_findings:
        sev_style = get_severity_style(f.get('severity', 'Low'))
        verif_rows.append([
            f.get('refId', ''),
            f.get('category', ''),
            f.get('anomalyDescription', ''),
            f.get('pageUrl', ''),
            f.get('verificationType', 'Live website testing'),
            (f.get('severity', 'Low'), sev_style),
            f.get('recommendedCorrectiveAction', '')
        ])
    sheet5_xml = build_worksheet_xml(
        verif_rows,
        [14, 26, 38, 32, 24, 14, 36],
        freeze_row=1
    )

    # Assembly into OPC Zip Archive
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # [Content_Types].xml
        zf.writestr('[Content_Types].xml', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""")

        # _rels/.rels
        zf.writestr('_rels/.rels', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""")

        # xl/_rels/workbook.xml.rels
        zf.writestr('xl/_rels/workbook.xml.rels', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""")

        # xl/workbook.xml
        zf.writestr('xl/workbook.xml', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Executive Summary" sheetId="1" r:id="rId1"/>
    <sheet name="Complete Anomaly Register" sheetId="2" r:id="rId2"/>
    <sheet name="Technical Findings" sheetId="3" r:id="rId3"/>
    <sheet name="Legal &amp; Compliance" sheetId="4" r:id="rId4"/>
    <sheet name="Verification Required" sheetId="5" r:id="rId5"/>
  </sheets>
</workbook>""")

        # xl/styles.xml
        zf.writestr('xl/styles.xml', build_styles_xml())

        # xl/worksheets
        zf.writestr('xl/worksheets/sheet1.xml', sheet1_xml)
        zf.writestr('xl/worksheets/sheet2.xml', sheet2_xml)
        zf.writestr('xl/worksheets/sheet3.xml', sheet3_xml)
        zf.writestr('xl/worksheets/sheet4.xml', sheet4_xml)
        zf.writestr('xl/worksheets/sheet5.xml', sheet5_xml)

if __name__ == '__main__':
    if len(sys.argv) > 2:
        in_path = sys.argv[1]
        out_path = sys.argv[2]
        with open(in_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        generate_excel(data, out_path)
        print(f"Generated Excel workbook at: {out_path}")
    elif len(sys.argv) == 2:
        out_path = sys.argv[1]
        data = json.load(sys.stdin)
        generate_excel(data, out_path)
        print(f"Generated Excel workbook at: {out_path}")
    else:
        print("Usage: python3 generate_qa_excel.py <input.json> <output.xlsx>")
        sys.exit(1)
