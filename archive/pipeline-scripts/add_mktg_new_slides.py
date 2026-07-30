#!/usr/bin/env python3
"""Add 3 new slides to the unpacked Marketing & CX Use Cases PPTX:
  - Slide A: Use Case Portfolio Dashboard (insert as slide 1)
  - Slide B: Pakistan Use Case Applicability (insert as slide 2)
  - Slide C: Implementation Roadmap (insert as second-to-last)

New files: slide200.xml, slide201.xml, slide202.xml
New notes: notesSlide200.xml, notesSlide201.xml, notesSlide202.xml
"""
import os
import re

BASE = 'unpacked_06'

def make_paragraph(text, bold=False, size=1000, color='333333', bullet=False, spc_before=200):
    battr = ' b="1"' if bold else ''
    if bullet:
        bu = '<a:buChar char="&#8226;"/>'
        indent = '-171450'
        marL = '171450'
    else:
        bu = '<a:buNone/>'
        indent = '0'
        marL = '0'
    return (
        f'<a:p>'
        f'<a:pPr indent="{indent}" marL="{marL}" rtl="0" algn="l">'
        f'<a:spcBef><a:spcPts val="{spc_before}"/></a:spcBef>'
        f'<a:spcAft><a:spcPts val="0"/></a:spcAft>'
        f'{bu}'
        f'</a:pPr>'
        f'<a:r><a:rPr{battr} lang="en-GB" sz="{size}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="Century Gothic"/><a:ea typeface="Century Gothic"/><a:cs typeface="Century Gothic"/>'
        f'</a:rPr><a:t>{text}</a:t></a:r>'
        f'</a:p>'
    )

def make_text_shape(shape_id, name, x, y, cx, cy, paragraphs_xml):
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

def make_slide_xml(shapes_xml, shape_id_start=5000):
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

def make_notes_xml(notes_text, note_id=6000):
    paras = ''
    for line in notes_text.strip().split('\n'):
        line = line.strip()
        if not line:
            paras += '<a:p><a:endParaRPr lang="en-GB" sz="1200"/></a:p>'
        else:
            line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            paras += f'<a:p><a:r><a:rPr lang="en-GB" sz="1200"/><a:t>{line}</a:t></a:r></a:p>'
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld><p:spTree>'
        f'<p:nvGrpSpPr><p:cNvPr id="{note_id}" name="Shape {note_id}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        f'<p:sp><p:nvSpPr><p:cNvPr id="{note_id+1}" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        f'<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>'
        f'<p:txBody><a:bodyPr/><a:lstStyle/>{paras}</p:txBody></p:sp>'
        '</p:spTree></p:cSld></p:notes>'
    )

def make_slide_rels(layout, notes):
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="{layout}"/>'
        f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="{notes}"/>'
        '</Relationships>'
    )

def make_notes_rels(slide):
    return (
        '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
        f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="{slide}"/>'
        '</Relationships>'
    )


# ═══════════════════════════════════════════
# SLIDE A: Use Case Portfolio Dashboard
# ═══════════════════════════════════════════

def build_slide_a():
    title = make_paragraph('Marketing &amp; CX Use Cases — Portfolio Dashboard', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(5001, 'Title', 350000, 100000, 8400000, 400000, title)

    # Portfolio summary table
    col_widths = [1800000, 1200000, 1200000, 1200000, 1400000]
    total_w = sum(col_widths)
    grid_cols = ''.join(f'<a:gridCol w="{w}"/>' for w in col_widths)

    headers = ['Section', 'Use Cases', 'Pakistan Priority', 'Quick Wins', 'FSDM Domains']
    rows = [
        ['Customer Information (1 UC)', '1', 'Critical', 'CNIC-based 360 view', 'Party, Event'],
        ['Insight-Driven (35 UCs)', '35', 'High', 'Transaction classification, Salary detection', 'Party, Transaction'],
        ['Customer Lifecycle (10 UCs)', '10', 'Critical', 'CASA silent churn, Cross-sell pipeline', 'Party, Product'],
        ['Customer Interaction (19 UCs)', '19', 'High', 'Contact optimization, SMS fatigue fix', 'Campaign, Channel'],
        ['TOTAL', '65', '', '', ''],
    ]

    header_row = '<a:tr h="280000">'
    for h in headers:
        header_row += (
            f'<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>'
            f'<a:p><a:pPr algn="ctr"/><a:r><a:rPr b="1" lang="en-GB" sz="750"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>'
            f'<a:latin typeface="Century Gothic"/></a:rPr><a:t>{h}</a:t></a:r></a:p>'
            f'</a:txBody><a:tcPr marL="36576" marR="36576" marT="18288" marB="18288"><a:solidFill><a:srgbClr val="0079DB"/></a:solidFill></a:tcPr></a:tc>'
        )
    header_row += '</a:tr>'

    data_rows = ''
    for ri, row in enumerate(rows):
        bg = 'F2F7FC' if ri % 2 == 0 else 'FFFFFF'
        is_total = ri == len(rows) - 1
        data_rows += '<a:tr h="260000">'
        for ci, cell in enumerate(row):
            battr = ' b="1"' if ci == 0 or is_total else ''
            color = 'C55A11' if ci == 2 and 'Critical' in cell else '333333'
            data_rows += (
                f'<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>'
                f'<a:p><a:r><a:rPr{battr} lang="en-GB" sz="700"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
                f'<a:latin typeface="Century Gothic"/></a:rPr><a:t>{cell}</a:t></a:r></a:p>'
                f'</a:txBody><a:tcPr marL="36576" marR="36576" marT="18288" marB="18288"><a:solidFill><a:srgbClr val="{bg}"/></a:solidFill></a:tcPr></a:tc>'
            )
        data_rows += '</a:tr>'

    table_xml = (
        f'<p:graphicFrame>'
        f'<p:nvGraphicFramePr><p:cNvPr id="5010" name="Table"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
        f'<p:xfrm><a:off x="350000" y="550000"/><a:ext cx="{total_w}" cy="1700000"/></p:xfrm>'
        f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
        f'<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>{grid_cols}</a:tblGrid>'
        f'{header_row}{data_rows}'
        f'</a:tbl></a:graphicData></a:graphic>'
        f'</p:graphicFrame>'
    )

    # Priority matrix
    priority_title = make_paragraph('Pakistan Implementation Priority Matrix', bold=True, size=1000, color='0079DB', spc_before=0)
    p1 = make_paragraph('IMMEDIATE (0-6 mo): Transaction Classification, CASA Silent Churn, Contact Mgmt, Path to Profitable Customers, Churn Model', size=750, color='333333', bullet=True, spc_before=80)
    p2 = make_paragraph('HIGH (6-18 mo): Journey Analytics, NBA Contact Strategy, Cross-Sell Targeting, Omni-Channel, Customer Satisfaction Index', size=750, color='333333', bullet=True, spc_before=60)
    p3 = make_paragraph('STRATEGIC (18-36 mo): Real-Time Offers, Social Network Analysis, Location-Based Offers, Wealth Mgmt, Marketing Attribution', size=750, color='333333', bullet=True, spc_before=60)
    priority_shape = make_text_shape(5020, 'Priority', 350000, 2400000, 8400000, 1200000, priority_title + p1 + p2 + p3)

    # Footer
    footer = make_paragraph('erwin by Quest — Financial Services Data Model (FSDM) Banking Business Value Framework  |  65 Use Cases  |  FSDM Entities: ~180+', size=700, color='666666', spc_before=0)
    footer_shape = make_text_shape(5030, 'Footer', 350000, 3800000, 8400000, 250000, footer)

    return make_slide_xml(title_shape + table_xml + priority_shape + footer_shape, 5000)


# ═══════════════════════════════════════════
# SLIDE B: Pakistan Use Case Applicability
# ═══════════════════════════════════════════

def build_slide_b():
    title = make_paragraph('Pakistan — Marketing &amp; CX Use Case Landscape', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(5101, 'Title', 350000, 100000, 8400000, 400000, title)

    subtitle = make_paragraph('USE CASES WITH HIGHEST PAKISTAN IMPACT', bold=True, size=1000, color='333333', spc_before=0)

    uc1 = (make_paragraph('1. CASA Silent Churn (Slide 46)', bold=True, size=850, color='0079DB', spc_before=150) +
           make_paragraph('PKR 500B+ at risk in silent balance rundown. Data: RAAST/IBFT outflows, salary patterns, app logins.', size=750, color='333333', spc_before=40))

    uc2 = (make_paragraph('2. Transaction Classification (Slides 11-12)', bold=True, size=850, color='0079DB', spc_before=120) +
           make_paragraph('70% informal economy — salary detection enables lending to undocumented workforce. Data: RAAST, IBFT, POS, mobile wallet.', size=750, color='333333', spc_before=40))

    uc3 = (make_paragraph('3. Customer Churn Model (Slide 47)', bold=True, size=850, color='0079DB', spc_before=120) +
           make_paragraph('Fintech competition accelerating — SadaPay/NayaPay capturing millennials. Data: App uninstalls, balance decline, RAAST outflows.', size=750, color='333333', spc_before=40))

    uc4 = (make_paragraph('4. Cross-Sell Targeting (Slide 49)', bold=True, size=850, color='0079DB', spc_before=120) +
           make_paragraph('1.8 products/customer vs 4-5 benchmark = 2-3x revenue opportunity. Data: Product holdings, ECIB bureau.', size=750, color='333333', spc_before=40))

    uc5 = (make_paragraph('5. Contact Management (Slide 52)', bold=True, size=850, color='0079DB', spc_before=120) +
           make_paragraph('SMS fatigue crisis — 10-15 promo messages/day destroying response rates. Data: SMS delivery, opt-out rates, SBP complaints.', size=750, color='333333', spc_before=40))

    uc6 = (make_paragraph('6. Customer Network Analysis (Slide 33)', bold=True, size=850, color='0079DB', spc_before=120) +
           make_paragraph('CNIC enables household mapping unavailable in most markets. Data: CNIC prefix, IBFT patterns, joint accounts.', size=750, color='333333', spc_before=40))

    content_shape = make_text_shape(5110, 'Content', 350000, 520000, 8400000, 4000000,
                                    subtitle + uc1 + uc2 + uc3 + uc4 + uc5 + uc6)

    return make_slide_xml(title_shape + content_shape, 5100)


# ═══════════════════════════════════════════
# SLIDE C: Implementation Roadmap
# ═══════════════════════════════════════════

def build_slide_c():
    title = make_paragraph('Marketing &amp; CX Use Cases — Implementation Roadmap', bold=True, size=1600, color='0079DB', spc_before=0)
    title_shape = make_text_shape(5201, 'Title', 350000, 100000, 8400000, 400000, title)

    # Phase 1
    p1_paras = (
        make_paragraph('Phase 1: Foundation (0-6 months) — 8 Use Cases', bold=True, size=950, color='0079DB', spc_before=0) +
        make_paragraph('Transaction Classification, CASA Silent Churn, Path to Profitable Customers, Contact Management, Customer Churn Model, Prospect Screener, Customer Satisfaction (NPS), Credit Card Behavior Analysis', size=700, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 40-80M | Data: Existing EDW + RAAST/IBFT feeds', bold=True, size=700, color='C55A11', spc_before=60)
    )
    p1_shape = make_text_shape(5210, 'Phase1', 350000, 550000, 2700000, 1800000, p1_paras)

    # Phase 2
    p2_paras = (
        make_paragraph('Phase 2: Intelligence (6-18 months) — 15 Use Cases', bold=True, size=950, color='0079DB', spc_before=0) +
        make_paragraph('Journey Analytics, Cross-Sell Targeting, NBA Strategy, Event Marketing, Omni-Channel, Product Bundling, CLTV, Segmentation, Propensity, Complaints, Path to Churn, Balance Churners, Hidden Preferred, Satisfaction Index, Attitudinal Segmentation', size=700, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 100-200M | Data: + Mobile app + Call center', bold=True, size=700, color='C55A11', spc_before=60)
    )
    p2_shape = make_text_shape(5220, 'Phase2', 3200000, 550000, 2700000, 1800000, p2_paras)

    # Phase 3
    p3_paras = (
        make_paragraph('Phase 3: Advanced (18-36 months) — 12 Use Cases', bold=True, size=950, color='0079DB', spc_before=0) +
        make_paragraph('Real-Time Offers, Location Based, Social Network, Customer Network, Wealth Mgmt, Marketing Attribution, Ad Optimization, Competitor Analysis, GIS + Telco, Web/IVR Breakout, Merchant Reco, People Like Me', size=700, color='333333', bullet=True, spc_before=60) +
        make_paragraph('Investment: PKR 150-300M | Data: + Real-time + External', bold=True, size=700, color='C55A11', spc_before=60)
    )
    p3_shape = make_text_shape(5230, 'Phase3', 6050000, 550000, 2700000, 1800000, p3_paras)

    # Summary
    summary = make_paragraph(
        'Total: 35 Priority Use Cases across 3 phases | Investment: PKR 290-580M | 65 use cases with full Pakistan context',
        bold=True, size=850, color='0079DB', spc_before=0)
    summary_shape = make_text_shape(5240, 'Summary', 350000, 2500000, 8400000, 350000, summary)

    fsdm = make_paragraph(
        'FSDM Foundation: All use cases built on erwin Financial Services Data Model — 180+ entities. Party, Transaction, Event, Product, Channel, Campaign, Marketing domains.',
        size=700, color='666666', spc_before=80)
    fsdm_shape = make_text_shape(5250, 'FSDM', 350000, 2900000, 8400000, 300000, fsdm)

    return make_slide_xml(title_shape + p1_shape + p2_shape + p3_shape + summary_shape + fsdm_shape, 5200)


# ═══════════════════════════════════════════
# NOTES
# ═══════════════════════════════════════════

NOTES_A = """USE CASE PORTFOLIO DASHBOARD
65 use cases across 4 Marketing & CX domains, all enriched with Pakistan banking context.
IMMEDIATE PRIORITY (0-6 months): Transaction Classification and CASA Silent Churn are the two highest-impact use cases for Pakistan banks.
Transaction Classification: enables salary detection for 70% informal workforce, unlocking lending.
CASA Silent Churn: PKR 500B+ at risk industry-wide in silent balance rundown.
FSDM: Full Party, Transaction, Event, Product, Channel, Campaign entity domains required.
BACR: ~110 maturity assessment questions across all 4 domains."""

NOTES_B = """PAKISTAN USE CASE LANDSCAPE
The 6 highest-impact use cases for Pakistan banking:
1. CASA Silent Churn — biggest unaddressed revenue leak, PKR 500B+ at risk
2. Transaction Classification — salary detection for informal workforce lending
3. Customer Churn Model — fintech competition (SadaPay, NayaPay) accelerating
4. Cross-Sell Targeting — 1.8 vs 4-5 products/customer = massive gap
5. Contact Management — SMS fatigue destroying response rates
6. Customer Network Analysis — CNIC enables unique household mapping
Pakistan-specific data sources: CNIC, RAAST, IBFT, 1Link, ECIB, NADRA, mobile wallets.
FSDM provides the canonical data model enabling all 65 use cases."""

NOTES_C = """IMPLEMENTATION ROADMAP
Phase 1 (0-6 months): 8 foundation use cases using existing EDW + RAAST/IBFT feeds. PKR 40-80M investment.
Quick wins: salary detection from transaction classification, 20% dormant reactivation, 30% complaint prediction.
Phase 2 (6-18 months): 15 intelligence use cases adding mobile app and call center data. PKR 100-200M.
Key outcome: cross-sell response rate from <5% to 8-12%, products/customer from 1.8 to 2.5.
Phase 3 (18-36 months): 12 advanced use cases with real-time and external data. PKR 150-300M.
Target: real-time NBA, ML churn prediction, location-based offers, social network analysis.
Total 36-month investment: PKR 290-580M for 35 priority use cases.
FSDM: All phases built on erwin Financial Services Data Model — 180+ entities."""


# ═══════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════

def main():
    print('=' * 60)
    print('Adding 3 new slides to Marketing & CX deck')
    print('=' * 60)

    slides_dir = os.path.join(BASE, 'ppt', 'slides')
    slides_rels_dir = os.path.join(BASE, 'ppt', 'slides', '_rels')
    notes_dir = os.path.join(BASE, 'ppt', 'notesSlides')
    notes_rels_dir = os.path.join(BASE, 'ppt', 'notesSlides', '_rels')

    LAYOUT = '../slideLayouts/slideLayout13.xml'  # Same layout as use case slides

    new_slides = [
        ('slide200.xml', 'notesSlide200.xml', build_slide_a(), NOTES_A),
        ('slide201.xml', 'notesSlide201.xml', build_slide_b(), NOTES_B),
        ('slide202.xml', 'notesSlide202.xml', build_slide_c(), NOTES_C),
    ]

    for slide_name, notes_name, slide_xml, notes_text in new_slides:
        # Write slide
        with open(os.path.join(slides_dir, slide_name), 'w', encoding='utf-8') as f:
            f.write(slide_xml)
        print(f'  Created {slide_name}')

        # Write slide rels
        with open(os.path.join(slides_rels_dir, slide_name + '.rels'), 'w', encoding='utf-8') as f:
            f.write(make_slide_rels(LAYOUT, f'../notesSlides/{notes_name}'))
        print(f'  Created {slide_name}.rels')

        # Write notes
        with open(os.path.join(notes_dir, notes_name), 'w', encoding='utf-8') as f:
            f.write(make_notes_xml(notes_text))
        print(f'  Created {notes_name}')

        # Write notes rels
        with open(os.path.join(notes_rels_dir, notes_name + '.rels'), 'w', encoding='utf-8') as f:
            f.write(make_notes_rels(f'../slides/{slide_name}'))
        print(f'  Created {notes_name}.rels')

    # ─── Update presentation.xml.rels ───
    print('\n  Updating presentation.xml.rels...')
    pres_rels_path = os.path.join(BASE, 'ppt', '_rels', 'presentation.xml.rels')
    with open(pres_rels_path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_rels = (
        '<Relationship Id="rId700" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide200.xml"/>'
        '<Relationship Id="rId701" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide201.xml"/>'
        '<Relationship Id="rId702" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide202.xml"/>'
    )
    content = content.replace('</Relationships>', new_rels + '</Relationships>')
    with open(pres_rels_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  Added rId700-702')

    # ─── Update presentation.xml sldIdLst ───
    print('\n  Updating presentation.xml sldIdLst...')
    pres_path = os.path.join(BASE, 'ppt', 'presentation.xml')
    with open(pres_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Insert Dashboard + Pakistan Context at beginning (before first slide rId120)
    old_first = '<p:sldId id="369" r:id="rId120"/>'
    new_beginning = (
        '<p:sldId id="500" r:id="rId700"/>'   # Dashboard
        '<p:sldId id="501" r:id="rId701"/>'   # Pakistan Context
        '<p:sldId id="369" r:id="rId120"/>'   # Original first slide
    )
    content = content.replace(old_first, new_beginning)

    # Insert Roadmap before last slide (rId188 = slide69)
    old_last = '<p:sldId id="437" r:id="rId188"/>'
    new_ending = (
        '<p:sldId id="502" r:id="rId702"/>'   # Roadmap
        '<p:sldId id="437" r:id="rId188"/>'   # Original last slide
    )
    content = content.replace(old_last, new_ending)

    with open(pres_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  Inserted Dashboard + Pakistan Context at start, Roadmap before last')

    # ─── Update [Content_Types].xml ───
    print('\n  Updating [Content_Types].xml...')
    ct_path = os.path.join(BASE, '[Content_Types].xml')
    with open(ct_path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_overrides = (
        '<Override PartName="/ppt/slides/slide200.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/slides/slide201.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/slides/slide202.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide200.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide201.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
        '<Override PartName="/ppt/notesSlides/notesSlide202.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
    )
    content = content.replace('</Types>', new_overrides + '</Types>')
    with open(ct_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  Added 6 overrides')

    print('\n' + '=' * 60)
    print('3 new slides added! Total: 72 slides')
    print('=' * 60)


if __name__ == '__main__':
    main()
