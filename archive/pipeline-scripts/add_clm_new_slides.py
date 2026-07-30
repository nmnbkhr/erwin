#!/usr/bin/env python3
"""Add 3 new slides to the unpacked CLM PPTX:
  - Slide A: Domain Dashboard "At a Glance" (insert as slide 1)
  - Slide B: Pakistan Market Context (insert after Dashboard, as slide 2)
  - Slide C: Implementation Roadmap (insert as second-to-last, before current last slide 18)

New files: slide183.xml, slide184.xml, slide185.xml
New notes: notesSlide183.xml, notesSlide184.xml, notesSlide185.xml
"""
import os
import re
import xml.etree.ElementTree as ET

BASE = 'unpacked_04'

# ─── Namespace registration ───
NSMAP = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'p14': 'http://schemas.microsoft.com/office/powerpoint/2010/main',
    'p15': 'http://schemas.microsoft.com/office/powerpoint/2012/main',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'mv': 'urn:schemas-microsoft-com:mac:vml',
    'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
    'dgm': 'http://schemas.openxmlformats.org/drawingml/2006/diagram',
    'o': 'urn:schemas-microsoft-com:office:office',
    'v': 'urn:schemas-microsoft-com:vml',
    'pvml': 'urn:schemas-microsoft-com:office:powerpoint',
    'com': 'http://schemas.openxmlformats.org/drawingml/2006/compatibility',
    'ahyp': 'http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor',
}
for prefix, uri in NSMAP.items():
    ET.register_namespace(prefix, uri)

# Also register the relationship namespace used by .rels files
ET.register_namespace('', 'http://schemas.openxmlformats.org/package/2006/relationships')

SLIDE_LAYOUT = '../slideLayouts/slideLayout11.xml'  # blank-ish layout used by most content slides
SLIDE_SIZE_CX = 9144000  # slide width in EMU
SLIDE_SIZE_CY = 5143500  # slide height in EMU

# ─── Helper to build a slide XML string ───

def make_paragraph(text, bold=False, size=1000, color='333333', indent=0, bullet=False, spc_before=200, lang='en-GB'):
    """Build a single <a:p> element string."""
    battr = ' b="1"' if bold else ''
    mar_l = indent * 228600  # each indent level ~ 0.25 inch

    if bullet:
        bu = '<a:buChar char="&#8226;"/>'
        indent_val = -171450
    else:
        bu = '<a:buNone/>'
        indent_val = 0

    return (
        f'<a:p>'
        f'<a:pPr indent="{indent_val}" lvl="{indent}" marL="{mar_l + (171450 if bullet else 0)}" rtl="0" algn="l">'
        f'<a:spcBef><a:spcPts val="{spc_before}"/></a:spcBef>'
        f'<a:spcAft><a:spcPts val="0"/></a:spcAft>'
        f'{bu}'
        f'</a:pPr>'
        f'<a:r><a:rPr{battr} lang="{lang}" sz="{size}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="Century Gothic"/><a:ea typeface="Century Gothic"/><a:cs typeface="Century Gothic"/>'
        f'</a:rPr><a:t>{text}</a:t></a:r>'
        f'</a:p>'
    )

def make_table_row(cells, is_header=False):
    """Build a table row XML string. Each cell is a string."""
    h = 280000  # row height
    sz = 900 if not is_header else 900
    bold = is_header
    color = 'FFFFFF' if is_header else '333333'
    fill = '<a:solidFill><a:srgbClr val="0079DB"/></a:solidFill>' if is_header else '<a:solidFill><a:srgbClr val="F2F2F2"/></a:solidFill>' if not is_header else ''

    row_xml = f'<a:tr h="{h}">'
    for cell_text in cells:
        battr = ' b="1"' if bold else ''
        row_xml += (
            f'<a:tc>'
            f'<a:txBody><a:bodyPr/><a:lstStyle/>'
            f'<a:p><a:r><a:rPr{battr} lang="en-GB" sz="{sz}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Century Gothic"/></a:rPr><a:t>{cell_text}</a:t></a:r></a:p>'
            f'</a:bodyPr></a:txBody>'
            f'<a:tcPr marL="45720" marR="45720" marT="18288" marB="18288">{fill}</a:tcPr>'
            f'</a:tc>'
        )
    row_xml += '</a:tr>'
    return row_xml

def make_slide_xml(shapes_xml, shape_id_start=2000):
    """Wrap shapes in a full slide XML document."""
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld><p:spTree>'
        f'<p:nvGrpSpPr><p:cNvPr id="{shape_id_start}" name="Shape {shape_id_start}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        f'{shapes_xml}'
        '</p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
        '</p:sld>'
    )

def make_text_shape(shape_id, name, x, y, cx, cy, paragraphs_xml):
    """Build a text box shape."""
    return (
        f'<p:sp>'
        f'<p:nvSpPr><p:cNvPr id="{shape_id}" name="{name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr>'
        f'<a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln>'
        f'</p:spPr>'
        f'<p:txBody>'
        f'<a:bodyPr anchorCtr="0" anchor="t" bIns="45720" lIns="91440" rIns="91440" wrap="square" tIns="45720"><a:noAutofit/></a:bodyPr>'
        f'<a:lstStyle/>'
        f'{paragraphs_xml}'
        f'</p:txBody>'
        f'</p:sp>'
    )

def make_notes_xml(notes_text, note_id_start=3000):
    """Create a notes slide XML."""
    # Split into paragraphs
    paras = ''
    for line in notes_text.strip().split('\n'):
        line = line.strip()
        if not line:
            paras += '<a:p><a:endParaRPr lang="en-GB" sz="1200"/></a:p>'
        else:
            # Escape XML entities
            line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            paras += f'<a:p><a:r><a:rPr lang="en-GB" sz="1200"/><a:t>{line}</a:t></a:r></a:p>'

    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld>'
        '<p:spTree>'
        f'<p:nvGrpSpPr><p:cNvPr id="{note_id_start}" name="Shape {note_id_start}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        f'<p:sp>'
        f'<p:nvSpPr><p:cNvPr id="{note_id_start+1}" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        f'<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>'
        f'<p:spPr/>'
        f'<p:txBody><a:bodyPr/><a:lstStyle/>'
        f'{paras}'
        f'</p:txBody></p:sp>'
        '</p:spTree></p:cSld></p:notes>'
    )

def make_slide_rels(layout_target, notes_target):
    """Create a slide .rels file."""
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="{layout_target}"/>'
        f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="{notes_target}"/>'
        '</Relationships>'
    )

def make_notes_rels(slide_target):
    """Create a notes slide .rels file."""
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
        f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="{slide_target}"/>'
        '</Relationships>'
    )

# ═══════════════════════════════════════════
# SLIDE A: Domain Dashboard "At a Glance"
# ═══════════════════════════════════════════

def build_slide_a():
    """Build the Dashboard slide."""
    # Title
    title_paras = make_paragraph('Customer Lifecycle &amp; Interaction Management — At a Glance', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(2001, 'Title', 350000, 120000, 8400000, 450000, title_paras)

    # Build comparison table
    # 4 columns: Metric | Global | South Asia & ME | Pakistan
    col_widths = [2200000, 1800000, 2000000, 2400000]
    total_w = sum(col_widths)

    headers = ['Metric', 'Global', 'South Asia &amp; ME', 'Pakistan']
    rows_data = [
        ['Digital onboarding rate', '65%+ of new accounts', '30-40% (urban)', '&lt;15% (mostly fintech-led)'],
        ['Avg products/customer', '4-5 (mature banks)', '2.5-3.0', '1.8 (massive cross-sell gap)'],
        ['Annual churn rate', '10-15%', '15-25%', '20-30% (salary switching)'],
        ['Dormant account rate', '10-15%', '20-30%', '25%+ (~15M dormant)'],
        ['Loyalty penetration', '60-70%', '25-35%', '&lt;15% (basic programs)'],
        ['NBA adoption', '45% of mature banks', '&lt;15%', '&lt;5% (manual campaigns)'],
        ['Acquisition cost', '$50-100 (digital)', '$15-30', 'PKR 3K-5K (branch) / PKR 500-1K (digital)'],
    ]

    # Build table XML
    grid_cols = ''.join(f'<a:gridCol w="{w}"/>' for w in col_widths)

    # Header row
    header_row = f'<a:tr h="320000">'
    for i, h in enumerate(headers):
        header_row += (
            f'<a:tc>'
            f'<a:txBody><a:bodyPr/><a:lstStyle/>'
            f'<a:p><a:pPr algn="ctr"/><a:r><a:rPr b="1" lang="en-GB" sz="800"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>'
            f'<a:latin typeface="Century Gothic"/></a:rPr><a:t>{h}</a:t></a:r></a:p>'
            f'</a:txBody>'
            f'<a:tcPr marL="45720" marR="45720" marT="18288" marB="18288"><a:solidFill><a:srgbClr val="0079DB"/></a:solidFill></a:tcPr>'
            f'</a:tc>'
        )
    header_row += '</a:tr>'

    # Data rows with alternating colors
    data_rows = ''
    for ri, row in enumerate(rows_data):
        bg = 'F2F7FC' if ri % 2 == 0 else 'FFFFFF'
        data_rows += f'<a:tr h="320000">'
        for ci, cell in enumerate(row):
            battr = ' b="1"' if ci == 0 else ''
            algn = 'l' if ci == 0 else 'ctr'
            # Pakistan column in accent color
            color = 'C55A11' if ci == 3 else '333333'
            data_rows += (
                f'<a:tc>'
                f'<a:txBody><a:bodyPr/><a:lstStyle/>'
                f'<a:p><a:pPr algn="{algn}"/><a:r><a:rPr{battr} lang="en-GB" sz="750"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
                f'<a:latin typeface="Century Gothic"/></a:rPr><a:t>{cell}</a:t></a:r></a:p>'
                f'</a:txBody>'
                f'<a:tcPr marL="45720" marR="45720" marT="18288" marB="18288"><a:solidFill><a:srgbClr val="{bg}"/></a:solidFill></a:tcPr>'
                f'</a:tc>'
            )
        data_rows += '</a:tr>'

    table_xml = (
        f'<p:graphicFrame>'
        f'<p:nvGraphicFramePr><p:cNvPr id="2010" name="Table 1"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
        f'<p:xfrm><a:off x="350000" y="650000"/><a:ext cx="{total_w}" cy="2900000"/></p:xfrm>'
        f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
        f'<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>{grid_cols}</a:tblGrid>'
        f'{header_row}{data_rows}'
        f'</a:tbl></a:graphicData></a:graphic>'
        f'</p:graphicFrame>'
    )

    # Info bar at bottom
    info_paras = make_paragraph(
        'BVF Sub-capabilities: 7 (CLM) + 14 (CIM) = 21  |  FSDM Entities: ~180+  |  BACR Questions: ~110  |  Maturity Focus: Developing → Innovating',
        bold=False, size=800, color='666666', spc_before=0
    )
    info_shape = make_text_shape(2020, 'InfoBar', 350000, 3700000, 8400000, 300000, info_paras)

    # Subtitle context line
    sub_paras = make_paragraph(
        'erwin by Quest — Financial Services Data Model (FSDM) Banking Business Value Framework',
        bold=False, size=900, color='666666', spc_before=0
    )
    sub_shape = make_text_shape(2025, 'Subtitle', 350000, 4050000, 8400000, 250000, sub_paras)

    return make_slide_xml(title_shape + table_xml + info_shape + sub_shape, 2000)


# ═══════════════════════════════════════════
# SLIDE B: Pakistan Market Context
# ═══════════════════════════════════════════

def build_slide_b():
    """Build the Pakistan Market Context slide."""
    # Title
    title_paras = make_paragraph('Pakistan Banking — Customer Lifecycle Landscape', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(2101, 'Title', 350000, 120000, 8400000, 400000, title_paras)

    # Left column: Key Challenges
    left_paras = (
        make_paragraph('Key Challenges', bold=True, size=1100, color='0079DB', spc_before=0) +
        make_paragraph('Products per Customer:  1.8 avg — benchmark is 4-5', size=850, color='333333', bullet=True, spc_before=150) +
        make_paragraph('Dormant Accounts:  15M+ across industry', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Digital Onboarding:  &lt;15% — NADRA e-KYC adoption growing', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Branch Acquisition Cost:  PKR 3,000-5,000 per customer', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Digital Acquisition Cost:  PKR 500-1,000 (5x cheaper)', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Fintech Churn Threat:  SadaPay, NayaPay targeting salary accounts', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Loyalty Programs:  Basic points-only, low engagement', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Cross-Sell Conversion:  &lt;5% on batch campaigns', size=850, color='333333', bullet=True, spc_before=100)
    )
    left_shape = make_text_shape(2110, 'Challenges', 350000, 580000, 4200000, 2800000, left_paras)

    # Right column: Competitive Dynamics
    right_paras = (
        make_paragraph('Competitive Dynamics', bold=True, size=1100, color='0079DB', spc_before=0) +
        make_paragraph('Traditional: 33 scheduled banks, same 60M account base', size=850, color='333333', bullet=True, spc_before=150) +
        make_paragraph('Digital: 5 new digital bank licenses (2022)', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Fintech: JazzCash (40M+), Easypaisa (30M+) — frictionless activation', size=850, color='333333', bullet=True, spc_before=100) +
        make_paragraph('Islamic: 85% want Shariah-compliant — lifecycle opportunity', size=850, color='333333', bullet=True, spc_before=100)
    )
    right_shape = make_text_shape(2120, 'Dynamics', 4750000, 580000, 4050000, 2000000, right_paras)

    # Bottom: Opportunity statement
    opp_paras = (
        make_paragraph('The Opportunity', bold=True, size=1000, color='0079DB', spc_before=0) +
        make_paragraph('Pakistan banks have &lt;2 products/customer vs. 4-5 globally. With 70% unbanked adults, 15M dormant accounts, and fintechs capturing digital-first customers, '
                       'data-driven lifecycle management represents a PKR 200-500B revenue opportunity through improved acquisition, reduced churn, and systematic cross-sell.',
                       size=850, color='333333', spc_before=100)
    )
    opp_shape = make_text_shape(2130, 'Opportunity', 350000, 3500000, 8400000, 1200000, opp_paras)

    return make_slide_xml(title_shape + left_shape + right_shape + opp_shape, 2100)


# ═══════════════════════════════════════════
# SLIDE C: Implementation Roadmap
# ═══════════════════════════════════════════

def build_slide_c():
    """Build the Implementation Roadmap slide."""
    # Title
    title_paras = make_paragraph('CLM Implementation Roadmap — Pakistan Banking', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(2201, 'Title', 350000, 120000, 8400000, 400000, title_paras)

    # Phase 1
    p1_paras = (
        make_paragraph('Phase 1: Foundation (0-6 months)', bold=True, size=1000, color='0079DB', spc_before=0) +
        make_paragraph('CNIC digital onboarding (NADRA biometric e-KYC)', size=800, color='333333', bullet=True, spc_before=80) +
        make_paragraph('Dormant re-activation program (15M+ target)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Basic churn scoring model', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Salary account welcome journey (first 90 days)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 40-70M  |  Quick Win: 20% dormant re-activation', bold=True, size=750, color='C55A11', spc_before=80)
    )
    p1_shape = make_text_shape(2210, 'Phase1', 350000, 580000, 2700000, 2200000, p1_paras)

    # Phase 2
    p2_paras = (
        make_paragraph('Phase 2: Core Capabilities (6-18 months)', bold=True, size=1000, color='0079DB', spc_before=0) +
        make_paragraph('Automated lifecycle campaign engine', size=800, color='333333', bullet=True, spc_before=80) +
        make_paragraph('Cross-sell propensity models (CASA → card → loan → investment)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Retention triggers (balance decline, competitor signals)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Loyalty upgrade (points + experiential + Islamic rewards)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 80-150M  |  Products/customer: 1.8 → 2.5', bold=True, size=750, color='C55A11', spc_before=80)
    )
    p2_shape = make_text_shape(2220, 'Phase2', 3200000, 580000, 2700000, 2200000, p2_paras)

    # Phase 3
    p3_paras = (
        make_paragraph('Phase 3: Advanced Intelligence (18-36 months)', bold=True, size=1000, color='0079DB', spc_before=0) +
        make_paragraph('Real-time Next Best Action across all channels', size=800, color='333333', bullet=True, spc_before=80) +
        make_paragraph('ML churn prediction (30-day advance warning)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Contextual decisioning (in-app, branch, call center)', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Personalized pricing and offer optimization', size=800, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 120-250M  |  30% churn reduction, 3.0+ products/customer', bold=True, size=750, color='C55A11', spc_before=80)
    )
    p3_shape = make_text_shape(2230, 'Phase3', 6050000, 580000, 2750000, 2200000, p3_paras)

    # Bottom summary bar
    summary_paras = (
        make_paragraph('Total 36-Month Investment: PKR 240-470M  |  Target: 1.8 → 3.0+ products/customer  |  30% churn reduction  |  50%+ digital onboarding',
                       bold=True, size=850, color='0079DB', spc_before=0)
    )
    summary_shape = make_text_shape(2240, 'Summary', 350000, 3000000, 8400000, 400000, summary_paras)

    # FSDM foundation note
    fsdm_paras = (
        make_paragraph('FSDM Foundation: All phases built on erwin Financial Services Data Model — 180+ entities providing unified customer, product, transaction, and interaction data layer.',
                       size=750, color='666666', spc_before=100)
    )
    fsdm_shape = make_text_shape(2250, 'FSDM', 350000, 3450000, 8400000, 350000, fsdm_paras)

    return make_slide_xml(title_shape + p1_shape + p2_shape + p3_shape + summary_shape + fsdm_shape, 2200)


# ═══════════════════════════════════════════
# NOTES CONTENT
# ═══════════════════════════════════════════

NOTES_A = """DOMAIN DASHBOARD - Speaker Notes
GLOBAL: DBS, Revolut, Nubank achieve 80%+ digital acquisition. Mature banks: 4-5 products per customer. Churn 10-15%.
REGIONAL:
- India: Jan Dhan Yojana = 500M+ accounts. Products/customer still 2.0-2.5. UPI driving engagement.
- Saudi: Digital banks (STC Bank, D360) = 3-min onboarding. Vision 2030 pushing financial inclusion.
- UAE: Mashreq NEO, Liv = AI-driven lifecycle. 3.5+ products/customer.
- Turkey: CEPTETEB, Papara = mobile-first onboarding. QR+NFC+IBAN in one app.
PAKISTAN:
- 33 scheduled banks competing for same 60M active account base
- 70% adults unbanked — massive greenfield opportunity
- Fintechs (JazzCash 40M+, Easypaisa 30M+) demonstrate demand for digital
- 5 digital bank licenses (2022) will disrupt traditional model
- 1.8 products/customer vs. 4-5 global benchmark = PKR 200-500B revenue gap
FSDM: Party, Party_Account, Customer_Journey, Interaction_Event — foundation for unified lifecycle view across all 21 sub-capabilities."""

NOTES_B = """PAKISTAN MARKET CONTEXT - Speaker Notes
KEY DATA POINTS:
- SBP: 60M+ bank accounts, 100M+ branchless banking accounts (2024)
- Digital transactions growing 45%+ YoY via RAAST instant payment system
- NADRA biometric database: 130M+ CNICs — world-class digital identity infrastructure
- Mobile penetration: 190M+ SIMs, 120M+ broadband subscribers
COMPETITIVE LANDSCAPE:
- Traditional banks: Branch-heavy model, 16K+ branches, high cost-to-serve
- Fintechs: SadaPay (zero-fee accounts), NayaPay (business + personal), TAG (Islamic digital)
- Digital banks: 5 licenses granted — will compete on onboarding speed and UX
- Islamic banking: 22% market share, growing 25%+ annually. 85% population preference.
LIFECYCLE CHALLENGES:
- Dormancy: SBP definition = 12 months no transaction. 15M+ accounts dormant across industry.
- Churn: Salary account switching driven by employer partnerships and fintech zero-fee offers.
- Cross-sell: Manual batch campaigns with <5% conversion. No real-time NBA capability.
- Loyalty: Basic points programs, no experiential or Islamic-specific reward structures.
FSDM RELEVANCE: Party_Life_Stage, Financial_Event, Channel_Session, Interaction_Event entities map directly to Pakistan lifecycle challenges. 180+ entities cover end-to-end customer journey."""

NOTES_C = """IMPLEMENTATION ROADMAP - Speaker Notes
PHASE 1 FOUNDATION (0-6 months):
- NADRA e-KYC integration: PKR 5-10M per bank for API integration. Reduces onboarding from 3-5 days to <10 minutes.
- Dormant re-activation: Target 3M accounts (20% of 15M). Revenue uplift PKR 500-1,000 per reactivated account.
- Churn scoring: Basic logistic regression on transaction decline, balance attrition, competitor signals.
- Welcome journey: Automated 90-day program for salary accounts. Target: 3+ digital transactions in first month.
- Quick win: 20% dormant re-activation = PKR 1.5-3B incremental deposits.

PHASE 2 CORE CAPABILITIES (6-18 months):
- Campaign automation: Event-driven triggers replacing monthly batch. Real-time salary credit → loan offer within 48 hours.
- Cross-sell models: CASA → debit card → credit card → personal loan → auto → home → investment → insurance pipeline.
- Retention: Balance decline alerts, competitor signal detection, proactive retention offers for top-tier customers.
- Loyalty: Points + experiential + Islamic rewards (Hajj/Umrah, Qurbani, Zakat auto-calculation).

PHASE 3 ADVANCED INTELLIGENCE (18-36 months):
- Real-time NBA: Contextual offers across all channels (branch, mobile, ATM, call center, WhatsApp).
- ML churn: 30-day advance prediction. Differentiate full exit vs. balance migration vs. product downgrade.
- Personalized pricing: Dynamic rate/fee optimization based on customer value, risk, and competitive position.
- Omnichannel decisioning: Unified interaction layer across 8+ touchpoints (16K branches, mobile, USSD, agents, etc.).

FSDM: Customer_Journey, Interaction_Event, Channel_Session, Next_Best_Action, Campaign_Response — entities supporting all three phases. Data model ensures consistent customer view across lifecycle stages."""


# ═══════════════════════════════════════════
# MAIN: Create files and update metadata
# ═══════════════════════════════════════════

def main():
    print('=' * 60)
    print('Adding 3 new slides to CLM deck')
    print('=' * 60)

    slides_dir = os.path.join(BASE, 'ppt', 'slides')
    slides_rels_dir = os.path.join(BASE, 'ppt', 'slides', '_rels')
    notes_dir = os.path.join(BASE, 'ppt', 'notesSlides')
    notes_rels_dir = os.path.join(BASE, 'ppt', 'notesSlides', '_rels')

    # New file numbers
    new_slides = [
        ('slide183.xml', 'notesSlide183.xml', build_slide_a(), NOTES_A),  # Dashboard
        ('slide184.xml', 'notesSlide184.xml', build_slide_b(), NOTES_B),  # Pakistan Context
        ('slide185.xml', 'notesSlide185.xml', build_slide_c(), NOTES_C),  # Roadmap
    ]

    for slide_name, notes_name, slide_xml, notes_text in new_slides:
        # Write slide XML
        slide_path = os.path.join(slides_dir, slide_name)
        with open(slide_path, 'w', encoding='utf-8') as f:
            f.write(slide_xml)
        print(f'  Created {slide_name}')

        # Write slide .rels
        rels_path = os.path.join(slides_rels_dir, slide_name + '.rels')
        with open(rels_path, 'w', encoding='utf-8') as f:
            f.write(make_slide_rels(SLIDE_LAYOUT, f'../notesSlides/{notes_name}'))
        print(f'  Created {slide_name}.rels')

        # Write notes XML
        notes_path = os.path.join(notes_dir, notes_name)
        with open(notes_path, 'w', encoding='utf-8') as f:
            f.write(make_notes_xml(notes_text))
        print(f'  Created {notes_name}')

        # Write notes .rels
        nrels_path = os.path.join(notes_rels_dir, notes_name + '.rels')
        with open(nrels_path, 'w', encoding='utf-8') as f:
            f.write(make_notes_rels(f'../slides/{slide_name}'))
        print(f'  Created {notes_name}.rels')

    # ─── Update presentation.xml.rels ───
    print('\n  Updating presentation.xml.rels...')
    pres_rels_path = os.path.join(BASE, 'ppt', '_rels', 'presentation.xml.rels')
    with open(pres_rels_path, 'r', encoding='utf-8') as f:
        rels_content = f.read()

    # Add 3 new relationships before closing </Relationships>
    new_rels = (
        '<Relationship Id="rId183" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide183.xml"/>'
        '<Relationship Id="rId184" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide184.xml"/>'
        '<Relationship Id="rId185" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide185.xml"/>'
    )
    rels_content = rels_content.replace('</Relationships>', new_rels + '</Relationships>')
    with open(pres_rels_path, 'w', encoding='utf-8') as f:
        f.write(rels_content)
    print('  Added rId183, rId184, rId185 to presentation.xml.rels')

    # ─── Update presentation.xml sldIdLst ───
    # Insert Dashboard (rId183) and Pakistan Context (rId184) at beginning
    # Insert Roadmap (rId185) before the last slide (rId89 = slide18)
    print('\n  Updating presentation.xml sldIdLst...')
    pres_path = os.path.join(BASE, 'ppt', 'presentation.xml')
    with open(pres_path, 'r', encoding='utf-8') as f:
        pres_content = f.read()

    # Current sldIdLst: ids 321-338 (18 slides), rIds 72-89
    # New ids: 339, 340, 341
    # Insert Dashboard and Pakistan Context at the beginning
    # Insert Roadmap before the last slide (rId89)

    # Add slides A and B at the beginning of sldIdLst
    old_first = '<p:sldId id="321" r:id="rId72"/>'
    new_beginning = (
        '<p:sldId id="339" r:id="rId183"/>'  # Dashboard
        '<p:sldId id="340" r:id="rId184"/>'  # Pakistan Context
        '<p:sldId id="321" r:id="rId72"/>'   # Original first slide
    )
    pres_content = pres_content.replace(old_first, new_beginning)

    # Add Roadmap before last slide (rId89 = original slide 18)
    old_last = '<p:sldId id="338" r:id="rId89"/>'
    new_ending = (
        '<p:sldId id="341" r:id="rId185"/>'  # Roadmap
        '<p:sldId id="338" r:id="rId89"/>'   # Original last slide
    )
    pres_content = pres_content.replace(old_last, new_ending)

    with open(pres_path, 'w', encoding='utf-8') as f:
        f.write(pres_content)
    print('  Inserted Dashboard + Pakistan Context at start, Roadmap before last slide')

    # ─── Update [Content_Types].xml ───
    print('\n  Updating [Content_Types].xml...')
    ct_path = os.path.join(BASE, '[Content_Types].xml')
    with open(ct_path, 'r', encoding='utf-8') as f:
        ct_content = f.read()

    new_overrides = (
        '<Override PartName="/ppt/slides/slide183.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/slides/slide184.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/slides/slide185.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide183.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide184.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide185.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
    )
    ct_content = ct_content.replace('</Types>', new_overrides + '</Types>')
    with open(ct_path, 'w', encoding='utf-8') as f:
        f.write(ct_content)
    print('  Added 6 overrides to [Content_Types].xml')

    print('\n' + '=' * 60)
    print('3 new slides added successfully!')
    print('Final slide order: Dashboard, Pakistan Context, [18 original slides], Roadmap, [original last slide]')
    print('Total: 21 slides')
    print('=' * 60)


if __name__ == '__main__':
    main()
