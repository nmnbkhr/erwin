#!/usr/bin/env python3
"""Enrich all 15 use case slides + rewrite slides 11-12 + replace slide 17 in 11_Product_Management_Use_Cases.pptx."""
import xml.etree.ElementTree as ET
import copy, os, re

BASE = 'unpacked_11'
NOTES_OFFSET = 372  # slide N -> notesSlide(N+372)

NSMAP = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'mv': 'urn:schemas-microsoft-com:mac:vml',
    'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
    'dgm': 'http://schemas.openxmlformats.org/drawingml/2006/diagram',
    'o': 'urn:schemas-microsoft-com:office:office',
    'v': 'urn:schemas-microsoft-com:vml',
    'pvml': 'urn:schemas-microsoft-com:office:powerpoint',
    'com': 'http://schemas.openxmlformats.org/drawingml/2006/compatibility',
    'p14': 'http://schemas.microsoft.com/office/powerpoint/2010/main',
    'p15': 'http://schemas.microsoft.com/office/powerpoint/2012/main',
    'ahyp': 'http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor',
}
for prefix, uri in NSMAP.items():
    ET.register_namespace(prefix, uri)
ns = NSMAP

# ─── Helpers ───

def find_shape_by_header(root, header_text):
    for sp in root.findall('.//p:sp', ns):
        texts = []
        for t in sp.findall('.//a:t', ns):
            if t.text: texts.append(t.text)
        full = ''.join(texts)
        if full.startswith(header_text):
            return sp
    return None

def append_lines_to_shape(sp, new_lines):
    txBody = sp.find('.//p:txBody', ns)
    if txBody is None:
        return False
    paras = list(txBody.findall('a:p', ns))
    template = None
    for p in reversed(paras):
        for r in p.findall('a:r', ns):
            t = r.find('a:t', ns)
            if t is not None and t.text and len(t.text.strip()) > 5:
                template = p
                break
        if template: break
    if template is None:
        return False
    for line in new_lines:
        new_p = copy.deepcopy(template)
        runs = new_p.findall('a:r', ns)
        if runs:
            runs[0].find('a:t', ns).text = line
            for r in runs[1:]:
                new_p.remove(r)
        txBody.append(new_p)
    return True

def replace_shape_content(sp, header_text, new_lines):
    """Replace ALL content in a shape, keeping header paragraph and its format."""
    txBody = sp.find('.//p:txBody', ns)
    if txBody is None:
        return False
    paras = list(txBody.findall('a:p', ns))
    if len(paras) < 2:
        return False

    # Keep first para as header template, second as content template
    template = paras[1]

    # Remove all paragraphs except header
    for p in paras[1:]:
        txBody.remove(p)

    # Add new content
    for line in new_lines:
        new_p = copy.deepcopy(template)
        runs = new_p.findall('a:r', ns)
        if runs:
            runs[0].find('a:t', ns).text = line
            for r in runs[1:]:
                new_p.remove(r)
        txBody.append(new_p)
    return True

def update_notes(slide_num, notes_text):
    notes_num = slide_num + NOTES_OFFSET
    notes_path = os.path.join(BASE, 'ppt', 'notesSlides', f'notesSlide{notes_num}.xml')
    if not os.path.exists(notes_path):
        return False
    tree = ET.parse(notes_path)
    root = tree.getroot()
    for sp in root.findall('.//p:sp', ns):
        nvPr = sp.find('.//p:nvPr', ns)
        if nvPr is not None:
            ph = nvPr.find('p:ph', ns)
            if ph is not None and ph.get('type') == 'body':
                txBody = sp.find('p:txBody', ns)
                if txBody is None: continue
                paras = list(txBody.findall('a:p', ns))
                template = None
                for p in paras:
                    for r in p.findall('a:r', ns):
                        t = r.find('a:t', ns)
                        if t is not None and t.text and len(t.text.strip()) > 3:
                            template = p; break
                    if template: break
                if template is None:
                    template = ET.SubElement(txBody, '{http://schemas.openxmlformats.org/drawingml/2006/main}p')
                    r = ET.SubElement(template, '{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                    rPr = ET.SubElement(r, '{http://schemas.openxmlformats.org/drawingml/2006/main}rPr')
                    rPr.set('lang', 'en-GB'); rPr.set('sz', '1200')
                    t = ET.SubElement(r, '{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                    t.text = 'placeholder'
                for p in paras:
                    txBody.remove(p)
                for line in notes_text.strip().split('\n'):
                    new_p = copy.deepcopy(template)
                    runs = new_p.findall('{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                    if runs:
                        t = runs[0].find('{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                        if t is not None: t.text = line.strip() if line.strip() else ' '
                        for r in runs[1:]: new_p.remove(r)
                    txBody.append(new_p)
                tree.write(notes_path, xml_declaration=True, encoding='UTF-8')
                return True
    return False

# ═══════════════════════════════════════════
# ENRICHMENT CONTENT
# ═══════════════════════════════════════════

ENRICHMENTS = {
    2: {  # Product Development and Packaging
        'Objective': [
            'Design new products for Pakistan: digital-first accounts, Islamic variants, financial inclusion products, Roshan Digital Account extensions, green banking products.',
        ],
        'Source Data': [
            'Pakistan: FSDM customer/transaction data, SBP financial inclusion survey, mobile app usage, RAAST adoption data, competitor product analysis, Islamic banking demand indicators',
        ],
        'Methodology': [
            'Product usage clustering (unmet needs), propensity for new product adoption, cannibalization analysis (will new product erode existing?)',
        ],
        'Expected Outcome': [
            'Data-driven product pipeline: 3-5 new products/year based on analytics. Reduced product failure rate from ~40% to <20%.',
        ],
        'Challenges': [
            'Pakistan: SBP product approval timeline (4-8 weeks), Shariah board approval, core banking config across 4-5 systems',
        ],
    },
    3: {  # Relationship Mgt. and Optimization
        'Objective': [
            'Analyze relationships between banking objects — customer, product, channel, branch, RM, transaction — using graph analytics. Identify why certain branches have 3x products/customer vs. others.',
        ],
        'Source Data': [
            'FSDM: customer-product holdings, transaction patterns, channel usage, RM assignment, branch allocation, product lifecycle events',
        ],
        'Expected Outcome': [
            'Optimize RM-customer allocation for maximum cross-sell, identify successful RM behaviors for training/replication',
        ],
    },
    4: {  # Merchant Acquiring Insights
        'Objective': [
            "Pakistan's POS network growing rapidly — 100,000+ terminals. Monetize aggregated card transaction analytics for merchant business insights (footfall, ticket size, competitive share-of-wallet).",
        ],
        'Source Data': [
            'Pakistan: Card transaction data from FSDM, merchant category codes (MCC), merchant location, 1Link POS switch data, customer demographics',
        ],
        'Expected Outcome': [
            'New fee income from merchant analytics services, increased POS terminal deployment, merchant loyalty through value-added insights',
        ],
    },
    5: {  # Credit/Debit Card Spend Stimulation — CRITICAL
        'Objective': [
            'Pakistan: 30M+ debit cards but <30% actively used for POS (most ATM-only). Identify dormant/low-usage cardholders with high spending potential. Match with relevant merchant offers.',
        ],
        'Source Data': [
            'Pakistan: Card transaction data (ATM vs. POS vs. e-commerce), customer FSDM profile, salary credit data, merchant category preferences, offer response data',
        ],
        'Methodology': [
            'Collaborative filtering (similar-profile high-spenders → target non-spenders), propensity to activate POS usage, merchant offer matching',
        ],
        'Expected Outcome': [
            'Target: activate 30% of dormant POS cards, increase average POS spend by 25%. Revenue: PKR 2-5B additional interchange industry-wide.',
        ],
    },
    6: {  # Individualized Merchants Recommendation
        'Objective': [
            'Recommend relevant merchants to individual cardholders based on spending patterns, location, preferences. Increase card usage frequency and average spend.',
        ],
        'Source Data': [
            'FSDM card transaction data by MCC and merchant, customer location, spending pattern history, merchant location data',
        ],
        'Expected Outcome': [
            'Personalized merchant recommendations via mobile app push, SMS, or in-app widget. Target: 10-15% increase in card transaction frequency.',
        ],
    },
    7: {  # Risk Scoring Improvement — CRITICAL
        'Objective': [
            "Enhance ECIB-based credit scoring with transactional behavior from FSDM. Pakistan's ECIB has limited data for many customers (thin-file). Adding behavioral indicators dramatically improves predictive power.",
        ],
        'Source Data': [
            'Pakistan: ECIB bureau data, FSDM: salary regularity, balance volatility, RAAST/IBFT patterns, merchant spend categories, overdraft frequency, cheque bounce history, mobile app frequency',
        ],
        'Methodology': [
            'Enhanced scorecards: traditional credit + behavioral variables from FSDM. Out-of-sample validation. Champion/challenger deployment.',
        ],
        'Expected Outcome': [
            "Improve Gini coefficient by 10-20%, reduce false rejection by 15-25%, enable lending to 'thin-file' customers previously declined",
        ],
    },
    8: {  # Multivariate Testing (1)
        'Objective': [
            'A/B testing for Pakistan digital banking: mobile app product screens, lending flow, deposit rate display, card offer placement, onboarding funnel optimization. Early stage = 20-50% improvement potential.',
        ],
        'Source Data': [
            'Pakistan: Mobile app event data, internet banking clickstream, onboarding funnel data, digital sales conversion data',
        ],
    },
    9: {  # Multivariate Testing (2)
        'Objective': [
            'Evidence-based digital UX optimization. Reduced onboarding dropoff (target: from 40-60% to <20%), improved digital product cross-sell conversion.',
        ],
    },
    10: {  # Competitor Analysis
        'Objective': [
            'Monitor 33+ banks, 5 Islamic banks, 11 microfinance banks, and fintechs (JazzCash, Easypaisa, SadaPay, NayaPay, TAG) — products, pricing, features, sentiment.',
        ],
        'Source Data': [
            'Pakistan: Competitor websites, Google Play reviews, SBP published data, social media, job postings, annual reports',
        ],
        'Methodology': [
            'NLP on competitor reviews/social media, rate comparison dashboards, feature gap analysis, market share tracking (SBP data)',
        ],
        'Expected Outcome': [
            'Quarterly competitor intelligence report, real-time rate alerts, product gap identification, fintech threat assessment',
        ],
    },
    13: {  # Credit Risk Models for New-to-Lending — CRITICAL
        'Objective': [
            'Pakistan: 150M+ adults with no formal credit history. Build credit models using alternative data for unbanked — SBP financial inclusion mandate.',
        ],
        'Source Data': [
            'Pakistan: JazzCash/Easypaisa wallet data, utility payment history (K-Electric, SSGC), telecom usage, RAAST P2P patterns, NADRA demographic data, employer verification',
        ],
        'Methodology': [
            'Alternative data credit scoring: ML models on thin-file customers. Feature engineering from mobile wallet and utility payment regularity.',
        ],
        'Expected Outcome': [
            'Expand addressable lending from 30M (banked) to 80M+ (include mobile wallet users). Enable nano-lending (PKR 5K-50K) via digital.',
        ],
    },
    14: {  # Understanding Sales Across All Channels (1)
        'Objective': [
            'Unified product sales view across Pakistan channels: branch (16K+), mobile app, internet banking, call center, agent network (500K+), ATM/kiosk, employer partnerships, RAAST onboarding.',
        ],
        'Source Data': [
            'FSDM: product origination channel tag, branch sales register, mobile app funnel, internet banking applications, call center leads, agent network data',
        ],
        'Expected Outcome': [
            'Channel-level product sales dashboard: which products sell where? Where are dropoffs? Which channels cannibalize?',
        ],
    },
    15: {  # Understanding Sales Across All Channels (2)
        'Objective': [
            'Deep-dive channel analytics: conversion rates by product by channel, digital vs. branch cost-to-originate, agent network product enablement opportunities.',
        ],
    },
    16: {  # Compare Portfolio to Benchmark
        'Objective': [
            "Pakistan wealth management is nascent — NSS certificates dominate retail investment. SECP mutual fund industry growing (PKR 1.5T+ AUM). Compare customer portfolio to age/risk-appropriate benchmarks.",
        ],
        'Source Data': [
            'Pakistan: Customer investment holdings (FSDM), risk profile, benchmark models, market data (PSX, mutual fund NAVs), National Savings rates',
        ],
        'Expected Outcome': [
            'Advisor-facing portfolio comparison tool, automated out-of-benchmark alerts, product recommendation engine',
        ],
    },
}

# Slides 11-12: FULL REWRITE content (replace all field content)
REWRITES = {
    11: {  # Advanced Risk and Pricing Insights -> Risk-Based Pricing Analytics
        'title': 'Advanced Risk-Based Pricing Analytics',
        'Objective': [
            'Use granular risk data to price lending products more accurately than standard KIBOR + flat spread.',
            'Differentiate pricing by customer risk profile, collateral quality, sector risk, and geographic risk.',
        ],
        'Business Benefit': [
            'Risk-adjusted lending rates that properly compensate for credit risk',
            'Reduced adverse selection — low-risk customers get competitive rates (retain against competitors)',
            'High-risk customers priced for risk or declined — improved portfolio quality',
        ],
        'Source Data': [
            'ECIB credit scores, FSDM behavioral risk indicators, collateral valuation data',
            'SBP sector-wise NPL data, geographic risk data (flood/security zones)',
            'Macroeconomic forward indicators, KIBOR/FTP rates',
        ],
        'Methodology': [
            'Risk-based pricing: PD (scorecard) x LGD (collateral/recovery) x EAD = expected loss',
            'Rate = FTP + Operating Cost (ABC) + Expected Loss + Capital Charge + Target Margin',
            'Overlay with competitive pricing intelligence from market data',
        ],
        'Expected Outcome': [
            'Per-customer risk-adjusted pricing replacing flat segment spreads',
            '20-50bps NIM improvement through better risk-return trade-off',
            'Reduced adverse selection and improved portfolio risk-return',
        ],
        'Challenges': [
            'SBP minimum rate constraints and regulatory pricing guidance',
            'Activity-based costing data not available at most Pakistan banks',
            'System capability for per-customer pricing in core banking platforms',
        ],
        'Success Criteria': [
            'Measurable NIM improvement vs. flat pricing baseline',
            'Reduced NPL ratio in risk-priced portfolio vs. flat-priced comparison',
            'Customer retention rate maintained despite pricing differentiation',
        ],
    },
    12: {  # Behavioral-Based Pricing with Telematics -> Behavioral-Based Product Pricing
        'title': 'Behavioral-Based Product Pricing',
        'Objective': [
            'Price banking products based on actual customer behavior rather than static attributes.',
            'Pakistan: reward customers who maintain stable balances, transact digitally, use multiple products.',
        ],
        'Business Benefit': [
            'Better retention through fairness-based pricing — good behavior = better rates',
            'Reduced cost-to-serve by incentivizing digital behavior',
            'Improved NIM through behavioral segmentation and dynamic pricing tiers',
        ],
        'Source Data': [
            'FSDM behavioral data: balance stability (coefficient of variation), digital transaction ratio',
            'Product breadth score, payment punctuality, salary credit consistency',
            'Channel usage patterns, relationship tenure, cross-sell response history',
        ],
        'Methodology': [
            'Behavioral scoring models creating dynamic pricing tiers, updated monthly on trailing 6-month behavior',
            'Multi-variable optimization: balance stability + digital ratio + product breadth = pricing tier',
            'Champion/challenger testing of behavioral pricing vs. static pricing',
        ],
        'Expected Outcome': [
            'Savings rate premium for stable-balance customers (50bps reward)',
            'Lending rate reduction for perfect-repayment customers (100bps reward)',
            'Fee waivers for fully digital customers (cost-to-serve justifies)',
        ],
        'Challenges': [
            'SBP minimum rate constraints on certain product categories',
            'Customer communication of dynamic pricing changes',
            'System capability for frequent rate changes across core banking platforms',
        ],
        'Success Criteria': [
            'Customer retention uplift in behaviorally-priced segment vs. control',
            'Digital transaction ratio increase in incentivized segment',
            'NIM improvement vs. static pricing baseline',
        ],
    },
}

# Speaker notes for all slides
NOTES = {
    1: """SECTION: Product Management Use Cases
15 use cases across Product Development, Product Introduction, Pricing & Promotion, and Product Performance.
Pakistan priorities: Card Spend Stimulation, Risk Scoring Improvement, New-to-Lending Credit Models.
FSDM Domains: Product, Card, Transaction, Risk, Channel, Merchant""",

    2: """PRODUCT DEVELOPMENT AND PACKAGING
PAKISTAN PRIORITIES: 1) Digital-first accounts (selfie+CNIC), 2) Islamic variants for every product, 3) Financial inclusion (Asaan accounts), 4) Roshan Digital extensions, 5) SME digital products, 6) SBP green banking products.
FSDM: PRDCT, PRDCT_FTRE, PRDCT_DSGN, MKT_ND, CSTMR_SGMNT
BVF Capability: Product Development > Research New Product Opportunities""",

    3: """RELATIONSHIP MGT. AND OPTIMIZATION (PRODUCT USAGE)
PAKISTAN: Top 10% of RMs generate 3-5x products/customer vs. average. Graph analysis reveals which product sequencing works, which RM behaviors drive adoption.
Challenge: RM data often not captured systematically — FSDM integrates CRM + core banking + call center.
FSDM: IP_RLTNP, CSTMR_PRDCT, RM_ALLCTN, GRP_ANLYS
BVF Capability: Product Development > Relationship Optimization""",

    4: """MERCHANT ACQUIRING INSIGHTS
PAKISTAN: 100K+ POS terminals growing rapidly. Major acquirers: HBL, MCB, UBL, Allied, Bank Alfalah.
Opportunity: Sell anonymized spending insights to merchants (like Visa Analytics). Example: 'Your restaurant ticket is PKR 2,500, 30% below area average.'
FSDM: MRCHNT, MRCHNT_TXN, MCC, INTRCHNG, POS_TRML
BVF Capability: Product Development > Merchant Analytics""",

    5: """CREDIT/DEBIT CARD SPEND STIMULATION — CRITICAL
PAKISTAN: 30M+ debit cards, >70% ATM-only. Credit cards ~3M with ~60% active. Cash-on-delivery 70%+ of e-commerce.
Strategies: 1) Cashback on first POS transaction, 2) Merchant-specific offers (collaborative filtering), 3) Salary-day spend stimulation, 4) Category challenges (spend PKR 10K → PKR 500 back), 5) EMI conversion.
FSDM: CRD, CRD_TXN, POS_TXN, ATM_TXN, MRCHNT_OFFR, INTRCHNG
BVF Capability: Product Development > Card Revenue Optimization""",

    6: """INDIVIDUALIZED MERCHANTS RECOMMENDATION
PAKISTAN: Recommend grocery (Imtiaz, Chase Up), fuel (PSO, Shell), dining, mobile recharge based on spending patterns and location.
FSDM: MRCHNT, MRCHNT_RCMNDTN, CRD_TXN, CSTMR_PRFRNCE
BVF Capability: Product Development > Personalized Merchant Offers""",

    7: """IMPROVEMENT IN RISK SCORING MODELS — CRITICAL
PAKISTAN: ECIB has limited history for 70%+ of population. FSDM-enhanced variables: 1) Salary regularity, 2) Balance behavior, 3) Transaction patterns, 4) RAAST/IBFT patterns, 5) Merchant spend, 6) Digital engagement, 7) Relationship depth, 8) Overdraft behavior.
These variables are in FSDM but NOT in ECIB — unique competitive advantage.
FSDM: RSK_SCR, BHVRL_SCR, ECIB_SCR, PD, SCRCRD, MDLNG
BVF: File 12-13 Risk Management cross-reference""",

    8: """MULTIVARIATE TESTING (1)
PAKISTAN: Digital banking early stage — A/B testing yields 20-50% improvement because baseline is unoptimized.
Test: mobile product screens, lending flow, deposit rate display, card offer placement, onboarding funnel.
FSDM: DGTL_EVNT, AB_TST, CNVRSN_RT, FNNL_STP
BVF Capability: Product Development > Digital Optimization""",

    9: """MULTIVARIATE TESTING (2)
PAKISTAN: Target onboarding dropoff from 40-60% to <20%. Digital product cross-sell conversion optimization.
FSDM: DGTL_EVNT, TST_RSLT, CNVRSN_OPTMZTN
BVF Capability: Product Development > Digital Optimization""",

    10: """COMPETITOR ANALYSIS
PAKISTAN: Direct — HBL, MCB, UBL, Allied, Bank Alfalah, Meezan, Bank Islami. Fintech — JazzCash 50M+, Easypaisa 40M+, SadaPay, NayaPay, TAG.
Key dimensions: deposit rates, lending rates, digital experience (app ratings), branch network, Islamic products, customer service (SBP complaint data).
FSDM: CMPTTR, CMPTTR_PRDCT, MKT_SHR, BNCHMRK
BVF Capability: Product Introduction > Competitive Intelligence""",

    11: """ADVANCED RISK-BASED PRICING ANALYTICS (REWRITTEN FROM INSURANCE)
PAKISTAN: Most banks price as KIBOR + flat spread by segment. Target: granular pricing where Rate = FTP + OpCost + Expected Loss + Capital Charge + Margin.
Impact: 20-50bps NIM improvement, reduced adverse selection.
FSDM: RSK_PRCNG, PD, LGD, EAD, RSK_PREMM, FTP_RT
BVF: File 12-13 Risk Management cross-reference""",

    12: """BEHAVIORAL-BASED PRODUCT PRICING (REWRITTEN FROM AUTO INSURANCE)
PAKISTAN: Reward good behavior — stable balances (50bps savings premium), perfect repayment (100bps lending reduction), fully digital (fee waiver), 3+ products (FD rate loyalty premium).
FSDM behavioral variables: balance stability index, digital transaction ratio, product breadth score, payment discipline, relationship tenure.
FSDM: BHVRL_SCR, BHVRL_PRCNG, CSTMR_BHVR, PRCNG_TR
BVF Capability: Pricing & Promotion > Dynamic Pricing""",

    13: """CREDIT RISK MODELS FOR NEW-TO-LENDING — CRITICAL
THE MOST IMPACTFUL USE CASE FOR PAKISTAN FINANCIAL INCLUSION.
Problem: 150M+ adults, only ~20M have ECIB credit history. 70% informal sector excluded from formal credit.
Solution: Alternative data — JazzCash (50M+), Easypaisa (40M+), telecom (190M+ connections), utility payments, RAAST.
Impact: If 10% of unbanked get PKR 50K credit = PKR 750B+ new lending opportunity.
FSDM: ALTNTV_DATA, CRDTH_SCR, MOBL_WLT, UTLTY_PMT, THNFL
BVF Capability: Pricing & Promotion > Financial Inclusion Lending""",

    14: """UNDERSTANDING SALES ACROSS ALL CHANNELS (1)
PAKISTAN: Branch (16K+) + mobile + internet + call center + agent (500K+) + ATM + employer + RAAST = 8+ origination channels.
FSDM: CHNL_SLS, PRDCT_ORGNT, SLS_FNNL, CHNL_CNVRSN
BVF Capability: Product Performance > Channel Analytics""",

    15: """UNDERSTANDING SALES ACROSS ALL CHANNELS (2)
PAKISTAN: Deep-dive — conversion by product by channel, digital vs. branch cost-to-originate, agent enablement.
FSDM: CHNL_SLS, CNVRSN_RT, CST_TO_ORGNTN
BVF Capability: Product Performance > Channel Analytics""",

    16: """COMPARE PORTFOLIO TO BENCHMARK
PAKISTAN: NSS certificates dominate retail investment. SECP mutual funds PKR 1.5T+ AUM growing. Banks must offer competitive alternatives.
Advisor tool: portfolio comparison, out-of-benchmark alerts, product recommendation engine.
FSDM: PRTFL_HLDNG, BNCHMRK_PRTFL, INVSTMNT_ALLCTN, MKT_DATA
BVF Capability: Product Performance > Wealth Analytics""",

    17: """PAKISTAN PRODUCT ANALYTICS — SUCCESS METRICS
Key targets: Products/customer 1.8→2.5, Card POS activation <30%→50%, Digital sales 15%→40%, Product launch 16→8 weeks, Cross-sell <5%→10%, New-to-lending 20M→40M, Product failure ~40%→<20%, Risk scoring +10-20% Gini.
Investment: PKR 200-400M over 3 years. Return: PKR 10-20B annually.
FSDM: Foundation for all product analytics — Party, Product, Transaction, Channel, Risk, Marketing domains.""",
}


def main():
    print('=' * 60)
    print('Enriching 11_Product_Management_Use_Cases.pptx')
    print('=' * 60)

    # ─── Phase 1: Enrich use case slides ───
    print('\n--- Phase 1: Use Case Enrichment ---')
    enriched = 0
    for slide_num, fields in ENRICHMENTS.items():
        fpath = os.path.join(BASE, 'ppt', 'slides', f'slide{slide_num}.xml')
        tree = ET.parse(fpath)
        root = tree.getroot()
        changed = False
        for header, lines in fields.items():
            sp = find_shape_by_header(root, header)
            if sp is not None:
                if append_lines_to_shape(sp, lines):
                    changed = True
                else:
                    print(f'  slide{slide_num}: WARN - append failed for "{header[:30]}"')
            else:
                print(f'  slide{slide_num}: WARN - shape not found: "{header[:30]}"')
        if changed:
            tree.write(fpath, xml_declaration=True, encoding='UTF-8')
            enriched += 1
    print(f'  Enriched: {enriched} slides')

    # ─── Phase 2: Rewrite slides 11-12 ───
    print('\n--- Phase 2: Rewrite Slides 11-12 ---')
    for slide_num, rewrite in REWRITES.items():
        fpath = os.path.join(BASE, 'ppt', 'slides', f'slide{slide_num}.xml')
        tree = ET.parse(fpath)
        root = tree.getroot()
        changed = False

        # Update title shape
        for sp in root.findall('.//p:sp', ns):
            texts = []
            for t in sp.findall('.//a:t', ns):
                if t.text: texts.append(t.text)
            full = ''.join(texts).strip()
            # Find title shape (matches old title)
            if full in ['Advanced Risk and  Pricing Insights', 'Advanced Risk and Pricing Insights',
                        'Behavioral-Based Pricing with Telematics Data', 'Behavioral-Based Pricing',
                        'Behavioral-Based Pricing with Telematics']:
                for t in sp.findall('.//a:t', ns):
                    if t.text and len(t.text.strip()) > 5:
                        t.text = rewrite['title']
                        break
                changed = True

        # Replace field content
        for field_name, lines in rewrite.items():
            if field_name == 'title':
                continue
            sp = find_shape_by_header(root, field_name)
            if sp is not None:
                if replace_shape_content(sp, field_name, lines):
                    changed = True
                else:
                    print(f'  slide{slide_num}: WARN - replace failed for "{field_name[:30]}"')
            else:
                print(f'  slide{slide_num}: WARN - shape not found for rewrite: "{field_name[:30]}"')

        if changed:
            tree.write(fpath, xml_declaration=True, encoding='UTF-8')
            print(f'  slide{slide_num}: REWRITTEN as "{rewrite["title"]}"')
        else:
            print(f'  slide{slide_num}: WARNING - no changes applied')

    # ─── Phase 3: Replace slide 17 (Discover case study) ───
    print('\n--- Phase 3: Replace Slide 17 ---')
    fpath = os.path.join(BASE, 'ppt', 'slides', f'slide17.xml')
    tree = ET.parse(fpath)
    root = tree.getroot()

    # Replace the content of slide 17 with Pakistan Product Analytics metrics
    # Find all shapes and update their text
    for sp in root.findall('.//p:sp', ns):
        texts = []
        for t in sp.findall('.//a:t', ns):
            if t.text: texts.append(t.text)
        full = ''.join(texts)

        if 'Discover' in full and len(full) < 30:
            # Title shape - rename
            for t in sp.findall('.//a:t', ns):
                if t.text and 'Discover' in t.text:
                    t.text = 'Product Management'
                    break

        elif 'Driving Further' in full:
            # Subtitle - rename
            for t in sp.findall('.//a:t', ns):
                if t.text and 'Driving' in t.text:
                    t.text = 'Pakistan Product Analytics — Success Metrics'
                    break

        elif 'Challenge' in full or 'Vision' in full or 'centralized' in full:
            # Main content - replace
            txBody = sp.find('.//p:txBody', ns)
            if txBody is not None:
                paras = list(txBody.findall('a:p', ns))
                template = paras[0] if paras else None
                if template:
                    for p in paras:
                        txBody.remove(p)
                    metrics = [
                        'PRODUCT MANAGEMENT ANALYTICS IMPACT (Pakistan Targets):',
                        ' ',
                        'Products per Customer:      1.8 → 2.5      (+39% revenue/customer)',
                        'Card POS Activation:        <30% → 50%     (PKR 3-5B additional interchange)',
                        'Digital Product Sales:      15% → 40%      (of total originations)',
                        'Product Launch Cycle:       16 weeks → 8    (data-driven development)',
                        'Cross-sell Response:        <5% → 10%      (analytics targeting)',
                        'New-to-Lending Coverage:    20M → 40M      (alternative data models)',
                        'Product Failure Rate:       ~40% → <20%    (business impact prediction)',
                        'Risk Scoring Accuracy:      +10-20% Gini   (FSDM behavioral data)',
                        ' ',
                        'INVESTMENT:  PKR 200-400M over 3 years',
                        'RETURN:      PKR 10-20B annually (revenue uplift + cost reduction)',
                    ]
                    for line in metrics:
                        new_p = copy.deepcopy(template)
                        runs = new_p.findall('a:r', ns)
                        if runs:
                            t = runs[0].find('a:t', ns)
                            if t is not None: t.text = line
                            for r in runs[1:]: new_p.remove(r)
                        txBody.append(new_p)

        elif 'teradatamagazine' in full or 'http' in full:
            # URL reference - remove text
            for t in sp.findall('.//a:t', ns):
                if t.text:
                    t.text = 'erwin by Quest — Financial Services Data Model (FSDM)'

    tree.write(fpath, xml_declaration=True, encoding='UTF-8')
    print('  slide17: REPLACED with Pakistan Product Analytics metrics')

    # ─── Phase 4: Speaker Notes ───
    print('\n--- Phase 4: Speaker Notes ---')
    notes_ok = 0
    for slide_num, notes_text in NOTES.items():
        if update_notes(slide_num, notes_text):
            notes_ok += 1
        else:
            print(f'  slide{slide_num}: WARN - notes update failed')
    print(f'  Notes updated: {notes_ok}/{len(NOTES)}')

    print('\n' + '=' * 60)
    print('Enrichment complete!')
    print('=' * 60)


if __name__ == '__main__':
    main()
