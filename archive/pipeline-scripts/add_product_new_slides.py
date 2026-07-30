#!/usr/bin/env python3
"""Add 3 new slides to the Product Management Use Cases deck (unpacked_11)."""

import xml.etree.ElementTree as ET, os, copy

BASE = "unpacked_11"

# ── Register all PPTX namespaces ──────────────────────────────────────
NS = {
    'a':    'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r':    'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'p':    'http://schemas.openxmlformats.org/presentationml/2006/main',
    'mc':   'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'mv':   'urn:schemas-microsoft-com:mac:vml',
    'c':    'http://schemas.openxmlformats.org/drawingml/2006/chart',
    'dgm':  'http://schemas.openxmlformats.org/drawingml/2006/diagram',
    'o':    'urn:schemas-microsoft-com:office:office',
    'v':    'urn:schemas-microsoft-com:vml',
    'pvml': 'urn:schemas-microsoft-com:office:powerpoint',
    'com':  'http://schemas.openxmlformats.org/drawingml/2006/compatibility',
    'p14':  'http://schemas.microsoft.com/office/powerpoint/2010/main',
    'p15':  'http://schemas.microsoft.com/office/powerpoint/2012/main',
    'ahyp': 'http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor',
}
for pfx, uri in NS.items():
    ET.register_namespace(pfx, uri)
ET.register_namespace('', 'http://schemas.openxmlformats.org/package/2006/relationships')
ET.register_namespace('', 'http://schemas.openxmlformats.org/package/2006/content-types')

RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT_NS   = 'http://schemas.openxmlformats.org/package/2006/content-types'
SLIDE_CT = 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml'
NOTES_CT = 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml'
SLIDE_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'
LAYOUT_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout'
NOTES_REL_TYPE  = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide'
NOTES_MASTER_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster'
SLIDE_BACK_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'

a = NS['a']
p = NS['p']
r = NS['r']

# ── Helper: make a text paragraph ────────────────────────────────────
def make_para(text, sz=1000, bold=False, color='000000', indent=0, bullet=False, spc_before=0):
    """Create an <a:p> element."""
    para = ET.SubElement(ET.Element('dummy'), f'{{{a}}}p')
    pPr = ET.SubElement(para, f'{{{a}}}pPr', marL=str(indent))
    if bullet:
        ET.SubElement(pPr, f'{{{a}}}buChar', char='\u2022')
    if spc_before:
        sb = ET.SubElement(pPr, f'{{{a}}}spcBef')
        ET.SubElement(sb, f'{{{a}}}spcPts', val=str(spc_before))
    run = ET.SubElement(para, f'{{{a}}}r')
    rPr = ET.SubElement(run, f'{{{a}}}rPr', lang='en-US', sz=str(sz), dirty='0')
    if bold:
        rPr.set('b', '1')
    fill = ET.SubElement(rPr, f'{{{a}}}solidFill')
    ET.SubElement(fill, f'{{{a}}}srgbClr', val=color)
    ET.SubElement(rPr, f'{{{a}}}latin', typeface='Century Gothic')
    t = ET.SubElement(run, f'{{{a}}}t')
    t.text = text
    return para

def make_paragraphs(lines, sz=900, color='333333', bold_first=False, indent=171450, bullet=True, spc=50):
    """Create multiple paragraphs from a list of strings."""
    paras = []
    for i, line in enumerate(lines):
        b = bold_first and i == 0
        paras.append(make_para(line, sz=sz if not b else sz+100, bold=b, color='1F3864' if b else color,
                               indent=indent if bullet and not b else 0, bullet=bullet and not b,
                               spc_before=spc if i > 0 else 0))
    return paras

# ── Helper: build a slide XML shell ──────────────────────────────────
def make_slide_tree():
    """Return (tree, spTree) for a new blank slide."""
    sld = ET.Element(f'{{{p}}}sld', {
        'xmlns:a': a, 'xmlns:r': r, 'xmlns:p': p
    })
    cSld = ET.SubElement(sld, f'{{{p}}}cSld')
    spTree = ET.SubElement(cSld, f'{{{p}}}spTree')
    # group shape props (required)
    nvGrpSpPr = ET.SubElement(spTree, f'{{{p}}}nvGrpSpPr')
    cNvPr = ET.SubElement(nvGrpSpPr, f'{{{p}}}cNvPr', id='1', name='')
    ET.SubElement(nvGrpSpPr, f'{{{p}}}cNvGrpSpPr')
    ET.SubElement(nvGrpSpPr, f'{{{p}}}nvPr')
    grpSpPr = ET.SubElement(spTree, f'{{{p}}}grpSpPr')
    xfrm = ET.SubElement(grpSpPr, f'{{{a}}}xfrm')
    ET.SubElement(xfrm, f'{{{a}}}off', x='0', y='0')
    ET.SubElement(xfrm, f'{{{a}}}ext', cx='0', cy='0')
    ET.SubElement(xfrm, f'{{{a}}}chOff', x='0', y='0')
    ET.SubElement(xfrm, f'{{{a}}}chExt', cx='0', cy='0')
    return sld, spTree

def add_shape(spTree, shape_id, name, x, y, cx, cy, paragraphs):
    """Add a text box shape with given paragraphs."""
    sp = ET.SubElement(spTree, f'{{{p}}}sp')
    nvSpPr = ET.SubElement(sp, f'{{{p}}}nvSpPr')
    ET.SubElement(nvSpPr, f'{{{p}}}cNvPr', id=str(shape_id), name=name)
    ET.SubElement(nvSpPr, f'{{{p}}}cNvSpPr', txBox='1')
    ET.SubElement(nvSpPr, f'{{{p}}}nvPr')
    spPr = ET.SubElement(sp, f'{{{p}}}spPr')
    xfrm = ET.SubElement(spPr, f'{{{a}}}xfrm')
    ET.SubElement(xfrm, f'{{{a}}}off', x=str(x), y=str(y))
    ET.SubElement(xfrm, f'{{{a}}}ext', cx=str(cx), cy=str(cy))
    ET.SubElement(spPr, f'{{{a}}}prstGeom', prst='rect')
    txBody = ET.SubElement(sp, f'{{{p}}}txBody')
    bodyPr = ET.SubElement(txBody, f'{{{a}}}bodyPr', wrap='square', lIns='91440', tIns='45720', rIns='91440', bIns='45720')
    ET.SubElement(txBody, f'{{{a}}}lstStyle')
    for pr in paragraphs:
        txBody.append(pr)
    return sp

# ── Helper: table builder ────────────────────────────────────────────
def make_table_cell(text, sz=800, bold=False, color='333333', fill_color=None):
    tc = ET.Element(f'{{{a}}}tc')
    txBody = ET.SubElement(tc, f'{{{a}}}txBody')
    ET.SubElement(txBody, f'{{{a}}}bodyPr')
    ET.SubElement(txBody, f'{{{a}}}lstStyle')
    pr = ET.SubElement(txBody, f'{{{a}}}p')
    run = ET.SubElement(pr, f'{{{a}}}r')
    rPr = ET.SubElement(run, f'{{{a}}}rPr', lang='en-US', sz=str(sz), dirty='0')
    if bold:
        rPr.set('b', '1')
    fl = ET.SubElement(rPr, f'{{{a}}}solidFill')
    ET.SubElement(fl, f'{{{a}}}srgbClr', val=color)
    ET.SubElement(rPr, f'{{{a}}}latin', typeface='Century Gothic')
    t = ET.SubElement(run, f'{{{a}}}t')
    t.text = text
    tcPr = ET.SubElement(tc, f'{{{a}}}tcPr')
    if fill_color:
        sf = ET.SubElement(tcPr, f'{{{a}}}solidFill')
        ET.SubElement(sf, f'{{{a}}}srgbClr', val=fill_color)
    return tc

def make_table(rows, col_widths, header_fill='1F3864', header_color='FFFFFF', alt_fill='E8EDF3'):
    """Build <a:tbl> from list of row tuples. First row = header."""
    tbl = ET.Element(f'{{{a}}}tbl')
    tblPr = ET.SubElement(tbl, f'{{{a}}}tblPr', firstRow='1', bandRow='1')
    tblGrid = ET.SubElement(tbl, f'{{{a}}}tblGrid')
    for w in col_widths:
        ET.SubElement(tblGrid, f'{{{a}}}gridCol', w=str(w))
    for ri, row in enumerate(rows):
        tr = ET.SubElement(tbl, f'{{{a}}}tr', h='260000')
        for ci, cell_text in enumerate(row):
            if ri == 0:
                tc = make_table_cell(cell_text, sz=800, bold=True, color=header_color, fill_color=header_fill)
            else:
                fill = alt_fill if ri % 2 == 0 else None
                tc = make_table_cell(cell_text, sz=750, bold=False, color='333333', fill_color=fill)
            tr.append(tc)
    return tbl

def add_table_shape(spTree, shape_id, name, x, y, cx, cy, tbl):
    """Add a graphicFrame containing a table."""
    gf = ET.SubElement(spTree, f'{{{p}}}graphicFrame')
    nvGfPr = ET.SubElement(gf, f'{{{p}}}nvGraphicFramePr')
    ET.SubElement(nvGfPr, f'{{{p}}}cNvPr', id=str(shape_id), name=name)
    cnv = ET.SubElement(nvGfPr, f'{{{p}}}cNvGraphicFramePr')
    ET.SubElement(cnv, f'{{{a}}}graphicFrameLocks', noGrp='1')
    ET.SubElement(nvGfPr, f'{{{p}}}nvPr')
    xfrm_el = ET.SubElement(gf, f'{{{p}}}xfrm')
    ET.SubElement(xfrm_el, f'{{{a}}}off', x=str(x), y=str(y))
    ET.SubElement(xfrm_el, f'{{{a}}}ext', cx=str(cx), cy=str(cy))
    graphic = ET.SubElement(gf, f'{{{a}}}graphic')
    graphicData = ET.SubElement(graphic, f'{{{a}}}graphicData',
                                uri='http://schemas.openxmlformats.org/drawingml/2006/table')
    graphicData.append(tbl)
    return gf

# ── Helper: notes slide ──────────────────────────────────────────────
def make_notes(slide_rId, notes_text):
    """Create a notes slide XML string."""
    notes = ET.Element(f'{{{p}}}notes', {'xmlns:a': a, 'xmlns:r': r, 'xmlns:p': p})
    cSld = ET.SubElement(notes, f'{{{p}}}cSld')
    spTree = ET.SubElement(cSld, f'{{{p}}}spTree')
    # group
    nvGrp = ET.SubElement(spTree, f'{{{p}}}nvGrpSpPr')
    ET.SubElement(nvGrp, f'{{{p}}}cNvPr', id='1', name='')
    ET.SubElement(nvGrp, f'{{{p}}}cNvGrpSpPr')
    ET.SubElement(nvGrp, f'{{{p}}}nvPr')
    grp = ET.SubElement(spTree, f'{{{p}}}grpSpPr')
    xf = ET.SubElement(grp, f'{{{a}}}xfrm')
    ET.SubElement(xf, f'{{{a}}}off', x='0', y='0')
    ET.SubElement(xf, f'{{{a}}}ext', cx='0', cy='0')
    ET.SubElement(xf, f'{{{a}}}chOff', x='0', y='0')
    ET.SubElement(xf, f'{{{a}}}chExt', cx='0', cy='0')
    # slide image placeholder
    sp1 = ET.SubElement(spTree, f'{{{p}}}sp')
    nv1 = ET.SubElement(sp1, f'{{{p}}}nvSpPr')
    ET.SubElement(nv1, f'{{{p}}}cNvPr', id='2', name='Slide Image Placeholder')
    ET.SubElement(nv1, f'{{{p}}}cNvSpPr')
    nvPr1 = ET.SubElement(nv1, f'{{{p}}}nvPr')
    ET.SubElement(nvPr1, f'{{{p}}}ph', type='sldImg')
    ET.SubElement(sp1, f'{{{p}}}spPr')
    # body placeholder
    sp2 = ET.SubElement(spTree, f'{{{p}}}sp')
    nv2 = ET.SubElement(sp2, f'{{{p}}}nvSpPr')
    ET.SubElement(nv2, f'{{{p}}}cNvPr', id='3', name='Notes Placeholder')
    ET.SubElement(nv2, f'{{{p}}}cNvSpPr')
    nvPr2 = ET.SubElement(nv2, f'{{{p}}}nvPr')
    ET.SubElement(nvPr2, f'{{{p}}}ph', type='body', idx='1')
    txBody = ET.SubElement(sp2, f'{{{p}}}txBody')
    ET.SubElement(txBody, f'{{{a}}}bodyPr')
    ET.SubElement(txBody, f'{{{a}}}lstStyle')
    for line in notes_text.split('\n'):
        pr = ET.SubElement(txBody, f'{{{a}}}p')
        run = ET.SubElement(pr, f'{{{a}}}r')
        rPr = ET.SubElement(run, f'{{{a}}}rPr', lang='en-US', sz='1000', dirty='0')
        ET.SubElement(rPr, f'{{{a}}}latin', typeface='Century Gothic')
        t_el = ET.SubElement(run, f'{{{a}}}t')
        t_el.text = line
    return notes

def write_xml(elem, path):
    tree = ET.ElementTree(elem)
    ET.indent(tree, space='  ')
    tree.write(path, encoding='UTF-8', xml_declaration=True)

def write_rels(rels_list, path):
    """Write a .rels file. rels_list = [(rId, type, target), ...]"""
    root = ET.Element('Relationships', xmlns=RELS_NS)
    for rid, rtype, target in rels_list:
        ET.SubElement(root, 'Relationship', Id=rid, Type=rtype, Target=target)
    tree = ET.ElementTree(root)
    ET.indent(tree, space='  ')
    tree.write(path, encoding='UTF-8', xml_declaration=True)

# ======================================================================
#  SLIDE A: Use Case Portfolio Dashboard (slide400)
# ======================================================================
def build_slide_a():
    sld, spTree = make_slide_tree()

    # Title
    title_paras = [make_para("Product Management Use Cases \u2014 Portfolio Dashboard",
                             sz=1600, bold=True, color='1F3864')]
    add_shape(spTree, 2, 'Title', 457200, 152400, 8229600, 457200, title_paras)

    # Summary table
    rows = [
        ('Section', 'Use Cases', '# UCs', 'Priority'),
        ('Product Development', 'Development & Packaging, Relationship Optimization, Merchant Acquiring, Card Spend Stimulation, Merchant Recommendation, Risk Scoring, Multivariate Testing (2)', '8', 'Critical: Card Spend, Risk Scoring'),
        ('Product Introduction', 'Competitor Analysis', '1', 'High'),
        ('Pricing & Promotion', 'Risk-Based Pricing, Behavioral Pricing, New-to-Lending Credit Models', '3', 'Critical: New-to-Lending'),
        ('Product Performance', 'Omni-Channel Sales (2), Portfolio Benchmark', '3', 'High: Omni-Channel'),
        ('TOTAL', '15 Use Cases (1 case study removed)', '15', ''),
    ]
    tbl = make_table(rows, [1800000, 3600000, 700000, 2100000])
    add_table_shape(spTree, 3, 'PortfolioTable', 457200, 650000, 8200000, 1800000, tbl)

    # Priority matrix
    priority_lines = [
        "Pakistan Priority Matrix:",
        "IMMEDIATE (0-6 months): Card Spend Stimulation, Risk Scoring Improvement, Credit Models for New-to-Lending, Competitor Analysis, Omni-Channel Sales",
        "HIGH (6-18 months): Merchant Acquiring Insights, Merchant Recommendation, Behavioral Pricing, Product Development & Packaging, Multivariate Testing",
        "STRATEGIC (18-36 months): Relationship Optimization (Graph), Portfolio Benchmark (Wealth), Advanced Risk-Based Pricing",
    ]
    prs = make_paragraphs(priority_lines, sz=850, bold_first=True, indent=171450, bullet=True)
    add_shape(spTree, 4, 'Priority', 457200, 2600000, 8200000, 2300000, prs)

    return sld

# ======================================================================
#  SLIDE B: Pakistan Context (slide401)
# ======================================================================
def build_slide_b():
    sld, spTree = make_slide_tree()

    title_paras = [make_para("Pakistan Banking \u2014 Product Use Case Priorities",
                             sz=1600, bold=True, color='1F3864')]
    add_shape(spTree, 2, 'Title', 457200, 152400, 8229600, 457200, title_paras)

    items = [
        ("1. CREDIT RISK MODELS FOR NEW-TO-LENDING (Slide 15)",
         "Why: 70% of Pakistan population has no credit bureau history",
         "Data: Mobile wallet patterns (JazzCash/Easypaisa), utility payments, RAAST P2P, NADRA demographics",
         "Impact: Expand lending to 50M+ previously unbanked \u2014 SBP financial inclusion priority"),
        ("2. CARD SPEND STIMULATION (Slide 7)",
         "Why: 30M+ debit cards, <30% used for POS purchases",
         "Data: Card transaction data, merchant category codes, 1Link switch, FSDM customer profile",
         "Impact: PKR 5-10B additional interchange revenue industry-wide"),
        ("3. RISK SCORING IMPROVEMENT (Slide 9)",
         "Why: Adding FSDM behavioral data improves Gini coefficient by 10-20%",
         "Data: ECIB + FSDM transactional patterns (salary, spending, balance, RAAST, merchant)"),
        ("4. COMPETITOR ANALYSIS (Slide 12)",
         "Why: 33+ banks + 5 Islamic + fintechs (JazzCash, Easypaisa, SadaPay, NayaPay)",
         "Data: Competitor products, rates, app reviews, social media, SBP published data"),
        ("5. OMNI-CHANNEL SALES (Slides 16-17)",
         "Why: Product sales fragmented across branch, mobile, internet, agent, call center",
         "Data: FSDM channel data + mobile analytics + branch sales + agent network"),
    ]

    all_paras = [make_para("USE CASES WITH HIGHEST PAKISTAN IMPACT:", sz=1000, bold=True, color='1F3864')]
    y_pos = 600000
    for item in items:
        for j, line in enumerate(item):
            if j == 0:
                all_paras.append(make_para(line, sz=900, bold=True, color='C00000', spc_before=100))
            else:
                all_paras.append(make_para(line, sz=800, color='333333', indent=171450, bullet=True, spc_before=30))

    add_shape(spTree, 3, 'Priorities', 457200, y_pos, 8200000, 4300000, all_paras)
    return sld

# ======================================================================
#  SLIDE C: Implementation Roadmap (slide402)
# ======================================================================
def build_slide_c():
    sld, spTree = make_slide_tree()

    title_paras = [make_para("Product Management Use Cases \u2014 Implementation Roadmap",
                             sz=1600, bold=True, color='1F3864')]
    add_shape(spTree, 2, 'Title', 457200, 152400, 8229600, 457200, title_paras)

    phases = [
        ("Phase 1: Quick Wins (0-6 months) \u2014 5 use cases", '2E75B6', [
            "Card Spend Stimulation, Risk Scoring Improvement, Credit Models for New-to-Lending, Competitor Analysis, Omni-Channel Sales Understanding",
            "Investment: PKR 40-80M | Data: FSDM + ECIB + card transaction data",
            "Quick Win: 15% increase in card activation rate, 10% expansion of lending eligibility",
        ]),
        ("Phase 2: Product Intelligence (6-18 months) \u2014 5 use cases", '548235', [
            "Merchant Acquiring Insights, Merchant Recommendation, Behavioral-Based Pricing, Product Development & Packaging, Multivariate Testing",
            "Investment: PKR 80-150M | Data: + merchant data + digital funnel + A/B testing framework",
            "Expected: 20% improvement in card interchange revenue, data-driven product pipeline",
        ]),
        ("Phase 3: Advanced Product Analytics (18-36 months) \u2014 5 use cases", '833C0B', [
            "Relationship Optimization (Graph), Portfolio Benchmark (Wealth), Advanced Risk-Based Pricing, + new use cases from product roadmap",
            "Investment: PKR 100-200M | Data: + graph analytics + market data feeds",
            "Expected: Dynamic product pricing, predictive product lifecycle management",
        ]),
    ]

    all_paras = []
    for phase_title, phase_color, phase_lines in phases:
        all_paras.append(make_para(phase_title, sz=1050, bold=True, color=phase_color, spc_before=150))
        for line in phase_lines:
            all_paras.append(make_para(line, sz=850, color='333333', indent=228600, bullet=True, spc_before=30))

    add_shape(spTree, 3, 'Roadmap', 457200, 650000, 8200000, 3600000, all_paras)

    # Summary box
    summary_paras = [
        make_para("TOTAL INVESTMENT: PKR 220-430M over 36 months", sz=950, bold=True, color='1F3864'),
        make_para("EXPECTED RETURN: PKR 10-20B annually through revenue uplift + cost reduction", sz=900, bold=True, color='548235', spc_before=50),
        make_para("DATA FOUNDATION: erwin by Quest Financial Services Data Model (FSDM)", sz=900, bold=True, color='2E75B6', spc_before=50),
    ]
    add_shape(spTree, 4, 'Summary', 457200, 4350000, 8200000, 700000, summary_paras)

    return sld

# ======================================================================
#  NOTES TEXT
# ======================================================================
NOTES_A = """Product Management Use Cases - Portfolio Dashboard
15 use cases across 4 sections: Product Development (8), Product Introduction (1), Pricing & Promotion (3), Product Performance (3).
Original Discover case study (slide 17) replaced with Pakistan Product Analytics Success Metrics.
Slides 11-12 fully rewritten from insurance/telco to banking context.
All use cases enriched with Pakistan banking context, ECIB/SBP/RAAST/FSDM references.
FSDM entities span: PRDCT, CRD, MRCHNT, RSK_SCR, BHVRL_SCR, CMPTTR, CHNL, PRTFL
BVF Reference: File 10 Product Management Capabilities (parent capabilities for these use cases)"""

NOTES_B = """Pakistan Banking - Product Use Case Priorities
The 5 highest-impact use cases for Pakistan banking product management:
1. Credit Risk Models for New-to-Lending: Financial inclusion for 70% unbanked population
2. Card Spend Stimulation: Activate 30M+ dormant POS cards, PKR 5-10B interchange opportunity
3. Risk Scoring Improvement: FSDM behavioral data improves Gini by 10-20%
4. Competitor Analysis: Monitor 33+ banks + fintechs in rapidly evolving market
5. Omni-Channel Sales: Unified product sales view across branch, mobile, internet, agent channels
FSDM: ALTNTV_DATA, CRD_TXN, BHVRL_SCR, CMPTTR, CHNL_SLS
SBP mandates: Financial inclusion, digital payments, branchless banking, RAAST adoption"""

NOTES_C = """Product Management Use Cases - Implementation Roadmap
Phase 1 (Quick Wins, 0-6 months): 5 use cases, PKR 40-80M investment
  Focus: Card activation, risk scoring, new-to-lending, competitive intelligence, omni-channel visibility
Phase 2 (Product Intelligence, 6-18 months): 5 use cases, PKR 80-150M investment
  Focus: Merchant analytics, personalized offers, behavioral pricing, data-driven product development
Phase 3 (Advanced Analytics, 18-36 months): 5 use cases, PKR 100-200M investment
  Focus: Graph analytics for relationship optimization, wealth portfolio benchmarking, dynamic pricing
Total: PKR 220-430M investment, PKR 10-20B annual return through revenue uplift and cost reduction
Data Foundation: erwin by Quest Financial Services Data Model (FSDM)
FSDM: PRDCT, CRD, MRCHNT, RSK_SCR, BHVRL_SCR, CMPTTR, CHNL, PRTFL, ALTNTV_DATA, GRP_ANLYS
BVF Reference: File 10 Product Management Capabilities"""

# ======================================================================
#  MAIN: Build files & update manifests
# ======================================================================
def main():
    print("=" * 60)
    print("Adding 3 new slides to Product Management deck")
    print("=" * 60)

    slides_dir = os.path.join(BASE, 'ppt', 'slides')
    rels_dir   = os.path.join(BASE, 'ppt', 'slides', '_rels')
    notes_dir  = os.path.join(BASE, 'ppt', 'notesSlides')
    notes_rels = os.path.join(BASE, 'ppt', 'notesSlides', '_rels')
    os.makedirs(notes_rels, exist_ok=True)

    # Build & write slide XMLs
    new_slides = [
        ('slide400', build_slide_a, NOTES_A, 'notesSlide400'),
        ('slide401', build_slide_b, NOTES_B, 'notesSlide401'),
        ('slide402', build_slide_c, NOTES_C, 'notesSlide402'),
    ]

    for slide_name, builder, notes_text, notes_name in new_slides:
        # Slide XML
        sld = builder()
        write_xml(sld, os.path.join(slides_dir, f'{slide_name}.xml'))
        print(f"  Created {slide_name}.xml")

        # Slide rels (layout + notes)
        write_rels([
            ('rId1', LAYOUT_REL_TYPE, '../slideLayouts/slideLayout13.xml'),
            ('rId2', NOTES_REL_TYPE, f'../notesSlides/{notes_name}.xml'),
        ], os.path.join(rels_dir, f'{slide_name}.xml.rels'))

        # Notes XML
        notes_elem = make_notes('rId1', notes_text)
        write_xml(notes_elem, os.path.join(notes_dir, f'{notes_name}.xml'))
        print(f"  Created {notes_name}.xml")

        # Notes rels
        write_rels([
            ('rId1', NOTES_MASTER_REL_TYPE, '../notesMasters/notesMaster1.xml'),
            ('rId2', SLIDE_BACK_REL_TYPE, f'../slides/{slide_name}.xml'),
        ], os.path.join(notes_rels, f'{notes_name}.xml.rels'))

    # ── Update presentation.xml ──────────────────────────────────────
    pres_path = os.path.join(BASE, 'ppt', 'presentation.xml')
    tree = ET.parse(pres_path)
    root = tree.getroot()
    sldIdLst = root.find(f'{{{p}}}sldIdLst')

    # Current order: rId379(slide1) ... rId395(slide17)
    # Target: slide400(A), slide401(B), slide1..slide16, slide17, slide402(C)
    # So: insert A,B at beginning, C after slide17 (at end)

    existing = list(sldIdLst)  # 17 elements

    # Clear and rebuild
    for child in existing:
        sldIdLst.remove(child)

    # Add new A (sldId 700)
    ET.SubElement(sldIdLst, f'{{{p}}}sldId', id='700', **{f'{{{r}}}id': 'rId700'})
    # Add new B (sldId 701)
    ET.SubElement(sldIdLst, f'{{{p}}}sldId', id='701', **{f'{{{r}}}id': 'rId701'})
    # Re-add existing 17
    for child in existing:
        sldIdLst.append(child)
    # Add new C (sldId 702)
    ET.SubElement(sldIdLst, f'{{{p}}}sldId', id='702', **{f'{{{r}}}id': 'rId702'})

    tree.write(pres_path, encoding='UTF-8', xml_declaration=True)
    print("  Updated presentation.xml (sldIdLst: 20 slides)")

    # ── Update presentation.xml.rels ─────────────────────────────────
    pres_rels_path = os.path.join(BASE, 'ppt', '_rels', 'presentation.xml.rels')
    ET.register_namespace('', RELS_NS)
    rels_tree = ET.parse(pres_rels_path)
    rels_root = rels_tree.getroot()

    for rid, sname in [('rId700', 'slide400'), ('rId701', 'slide401'), ('rId702', 'slide402')]:
        ET.SubElement(rels_root, 'Relationship', Id=rid, Type=SLIDE_REL_TYPE,
                      Target=f'slides/{sname}.xml')

    rels_tree.write(pres_rels_path, encoding='UTF-8', xml_declaration=True)
    print("  Updated presentation.xml.rels (+3 relationships)")

    # ── Update [Content_Types].xml ───────────────────────────────────
    ct_path = os.path.join(BASE, '[Content_Types].xml')
    ET.register_namespace('', CT_NS)
    ct_tree = ET.parse(ct_path)
    ct_root = ct_tree.getroot()

    for sname in ['slide400', 'slide401', 'slide402']:
        ET.SubElement(ct_root, 'Override',
                      PartName=f'/ppt/slides/{sname}.xml', ContentType=SLIDE_CT)
    for nname in ['notesSlide400', 'notesSlide401', 'notesSlide402']:
        ET.SubElement(ct_root, 'Override',
                      PartName=f'/ppt/notesSlides/{nname}.xml', ContentType=NOTES_CT)

    ct_tree.write(ct_path, encoding='UTF-8', xml_declaration=True)
    print("  Updated [Content_Types].xml (+6 overrides)")

    print("\n" + "=" * 60)
    print("Done! 3 new slides added (20 total)")
    print("=" * 60)

if __name__ == '__main__':
    main()
