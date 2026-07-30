#!/usr/bin/env python3
"""Enrich all 65 use case slides in 06_Marketing_CX_Use_Cases.pptx with Pakistan context.

Approach:
- Find shapes by header text (Objective, Source Data, Expected Outcome, Challenges)
- Append Pakistan-specific bullet paragraphs, copying format from existing content
- Replace all notes with Pakistan context + FSDM entity references
- Section dividers (slides 1, 3, 39, 50) get updated titles only
"""
import xml.etree.ElementTree as ET
import copy, os, re

BASE = 'unpacked_06'

# ─── Namespace registration ───
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
    """Find a shape (<p:sp>) whose text starts with header_text."""
    for sp in root.findall('.//p:sp', ns):
        texts = []
        for t in sp.findall('.//a:t', ns):
            if t.text:
                texts.append(t.text)
        full = ''.join(texts)
        if full.startswith(header_text):
            return sp
    return None

def find_template_paragraph(sp):
    """Find a good template paragraph (non-empty, with formatting) in a shape."""
    txBody = sp.find('.//p:txBody', ns)
    if txBody is None:
        return None, None
    paras = list(txBody.findall('a:p', ns))
    template = None
    for p in reversed(paras):
        runs = p.findall('a:r', ns)
        for r in runs:
            t = r.find('a:t', ns)
            if t is not None and t.text and len(t.text.strip()) > 5:
                template = p
                break
        if template is not None:
            break
    return txBody, template

def append_lines_to_shape(sp, new_lines):
    """Append new bullet lines to a shape, copying format from existing paragraphs."""
    txBody, template = find_template_paragraph(sp)
    if txBody is None or template is None:
        return False

    for line in new_lines:
        new_p = copy.deepcopy(template)
        # Set text of first run only, remove extra runs
        runs = new_p.findall('a:r', ns)
        if runs:
            first_run = runs[0]
            t = first_run.find('a:t', ns)
            if t is not None:
                t.text = line
            # Remove extra runs
            for r in runs[1:]:
                new_p.remove(r)
        txBody.append(new_p)
    return True

def update_notes(slide_num, notes_text):
    """Replace notes content for a slide."""
    notes_num = slide_num + 113
    notes_path = os.path.join(BASE, 'ppt', 'notesSlides', f'notesSlide{notes_num}.xml')
    if not os.path.exists(notes_path):
        return False

    tree = ET.parse(notes_path)
    root = tree.getroot()

    # Find the body placeholder
    for sp in root.findall('.//p:sp', ns):
        nvPr = sp.find('.//p:nvPr', ns)
        if nvPr is not None:
            ph = nvPr.find('p:ph', ns)
            if ph is not None and ph.get('type') == 'body':
                txBody = sp.find('p:txBody', ns)
                if txBody is None:
                    continue

                # Get existing paragraphs for template
                paras = list(txBody.findall('a:p', ns))
                template = None
                for p in paras:
                    runs = p.findall('a:r', ns)
                    for r in runs:
                        t = r.find('a:t', ns)
                        if t is not None and t.text and len(t.text.strip()) > 3:
                            template = p
                            break
                    if template is not None:
                        break

                if template is None:
                    # Create a basic template
                    template = ET.SubElement(txBody, '{http://schemas.openxmlformats.org/drawingml/2006/main}p')
                    r = ET.SubElement(template, '{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                    rPr = ET.SubElement(r, '{http://schemas.openxmlformats.org/drawingml/2006/main}rPr')
                    rPr.set('lang', 'en-GB')
                    rPr.set('sz', '1200')
                    t = ET.SubElement(r, '{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                    t.text = 'placeholder'

                # Remove all existing paragraphs
                for p in paras:
                    txBody.remove(p)

                # Add new paragraphs from notes_text
                for line in notes_text.strip().split('\n'):
                    new_p = copy.deepcopy(template)
                    runs = new_p.findall('{http://schemas.openxmlformats.org/drawingml/2006/main}r', ns)
                    if runs:
                        t = runs[0].find('{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                        if t is not None:
                            t.text = line.strip() if line.strip() else ' '
                        for r in runs[1:]:
                            new_p.remove(r)
                    txBody.append(new_p)

                tree.write(notes_path, xml_declaration=True, encoding='UTF-8')
                return True
    return False


# ═══════════════════════════════════════════
# ENRICHMENT CONTENT FOR ALL 65 USE CASES
# ═══════════════════════════════════════════
# Format: slide_num -> { field_header: [lines_to_append] }
# field_header must match the start of the shape's text content

ENRICHMENTS = {
    # ─── Section 1: Customer Information Management ───
    2: {  # Multi-Dimensional Customer View
        'Objective': [
            'Pakistan banks operate 4-5 core systems per bank. Building a 360 view requires integrating CTL, Temenos, Oracle, and Finacle customer data using CNIC as universal key.',
        ],
        'Source Data': [
            'Pakistan: CNIC-verified customer records, RAAST transaction data, mobile banking app events, 1Link ATM/POS data, JazzCash/Easypaisa wallet data, NADRA biometric verification',
        ],
        'Expected Outcome': [
            'Unified view of 60M+ bank customers by linking with 100M+ mobile wallet users via CNIC/mobile number',
        ],
        'Challenges': [
            'Pakistan: 4-5 incompatible core banking systems, 20-30% duplicate records, batch-only ETL processes',
        ],
    },

    # ─── Section 2: Insight-Driven Customer Management ───
    4: {  # Path to Profitable/Unprofitable Customers
        'Objective': [
            'In Pakistan, understanding the path from new account to profitability is critical given PKR 3-5K acquisition cost and only 1.8 products/customer.',
        ],
        'Source Data': [
            'Pakistan: CNIC-verified customer data, salary credit patterns, RAAST/IBFT transaction history, branch visit frequency, mobile app engagement',
        ],
        'Expected Outcome': [
            'Identify onboarding interventions that accelerate path to profitability — target: reduce time-to-profit from 18 months to 9 months',
        ],
        'Challenges': [
            'Pakistan: Activity-based costing data not available at most banks; cost-to-serve varies 10x between branch and digital',
        ],
    },
    5: {  # Customer Life Time Value
        'Objective': [
            'Pakistan banks must calculate CLTV incorporating both conventional and Islamic product holdings, CASA deposits, lending, cards, and fee income.',
        ],
        'Source Data': [
            'Pakistan: Product holdings across all core systems, KIBOR-based funds transfer pricing, activity-based costing, ECIB credit bureau data',
        ],
        'Expected Outcome': [
            'Enable value-based customer management — top 2% of Pakistan bank customers generate ~20% of revenue',
        ],
        'Challenges': [
            'Pakistan: No activity-based costing in most banks; Islamic product profit-sharing requires different CLTV methodology',
        ],
    },
    6: {  # Customer Satisfaction (NPS)
        'Objective': [
            'Benchmark NPS against fintech competitors: traditional banks NPS ~20-30 vs. SadaPay ~70. Build continuous measurement from digital interaction data.',
        ],
        'Source Data': [
            'Pakistan: SBP Consumer Protection complaint data, Google Play app ratings, social media sentiment (Twitter/X, Facebook)',
        ],
        'Expected Outcome': [
            'Real-time NPS tracking across branch, digital, and agent channels with fintech benchmarking',
        ],
    },
    7: {  # Customer Satisfaction Index
        'Objective': [
            'In Pakistan, satisfaction measurement is primarily survey-based — opportunity to build continuous measurement from digital interaction data.',
        ],
        'Source Data': [
            'Pakistan: SBP Consumer Protection complaint data, Google Play ratings, branch queue times, call center wait times',
        ],
    },
    8: {  # Predict Complaint
        'Objective': [
            'Predict SBP Consumer Protection complaints before filing — each formal complaint carries regulatory cost and reputation risk.',
        ],
        'Source Data': [
            'Pakistan: SBP complaint history, call center sentiment data, social media mentions, branch queue wait times',
        ],
        'Expected Outcome': [
            'Target: predict 30% of complaints 7 days before filing, enabling proactive resolution',
        ],
    },
    9: {  # Identify Broken/Sub Optimal Processes
        'Objective': [
            'Identify broken processes in Pakistan multi-system environment: account opening requires 5 systems, NADRA verification adds latency, debit card issuance takes 7-14 days.',
        ],
        'Expected Outcome': [
            'Key broken processes: digital onboarding (40-60% dropoff), IBFT failure handling, cheque clearing delays, loan disbursement (7-21 days)',
        ],
    },
    10: {  # Call Centre Sentiment
        'Objective': [
            'Analyze sentiment in Urdu and English call recordings — Urdu NLP models less mature, requires custom training.',
        ],
        'Source Data': [
            'Pakistan: Urdu/English call recordings, IVR interaction logs, WhatsApp chat transcripts. 1M+ calls/month per large bank.',
        ],
    },
    11: {  # Transactional Classification (1)
        'Objective': [
            'Classify RAAST instant payments by purpose: P2P, P2M, bill payment, salary, remittance, Zakat. Detect salary credits in accounts without employer tags — enables lending for 70% informal workforce.',
        ],
        'Source Data': [
            'Pakistan: RAAST transaction data, IBFT transfers, POS/debit card spending (MCC codes), mobile wallet data, utility bill payments',
        ],
        'Expected Outcome': [
            'Pakistan-specific categories: salary, rent, utility, education fees, healthcare, religious (Zakat/Qurbani), remittance, government payments',
        ],
    },
    12: {  # Transactional Classification (2)
        'Objective': [
            'Classify mobile wallet transactions to understand spending patterns of 100M+ JazzCash/Easypaisa users linked to bank accounts.',
        ],
        'Source Data': [
            'Pakistan: JazzCash/Easypaisa transaction data, RAAST P2M payments, utility payment classification, mobile top-up patterns',
        ],
    },
    13: {  # Sales Process Improvement
        'Objective': [
            'Optimize branch sales process — Pakistan branch staff close <5% of sales leads due to manual processes. Improve digital sales funnel — mobile app loan application to disbursement takes 7-21 days vs. fintech 24-48 hours.',
        ],
    },
    14: {  # Path to Purchase — Event Based Marketing
        'Objective': [
            'Design event-triggered campaigns around Pakistan-specific events: salary credit (1st-5th), Ramadan/Eid, back-to-school (August), wedding season (Nov-Feb), Hajj season.',
        ],
        'Source Data': [
            'Pakistan: RAAST salary credit events, IBFT large transfer events, POS spending spikes, mobile app product page views',
        ],
    },
    15: {  # Customer Journey Analytics (1)
        'Objective': [
            'Map key Pakistan banking journeys: onboarding (CNIC → NADRA → account → first transaction), branch-to-digital migration, financial inclusion (agent → basic account → savings → lending).',
        ],
        'Source Data': [
            'Pakistan: Branch visit data, ATM usage, mobile app sessions, RAAST/IBFT, agent network interactions',
        ],
        'Expected Outcome': [
            'Map why 40-60% of digital onboarding applicants drop off at NADRA biometric step',
        ],
    },
    16: {  # Customer Journey Analytics (2)
        'Objective': [
            'Analyze cross-channel journey patterns unique to Pakistan: customers using both traditional branch and branchless agent channels simultaneously.',
        ],
        'Source Data': [
            'Pakistan: Agent network transaction data, USSD session logs, WhatsApp banking interactions, RAAST payment journey data',
        ],
    },
    17: {  # Path to Appointment
        'Objective': [
            'In Pakistan, branch appointment is rare — most are walk-ins. However, RM-managed priority/HNW customers need appointment optimization. Digital alternative: WhatsApp-based RM scheduling.',
        ],
    },
    18: {  # Product Sequence: Path to Value
        'Objective': [
            'Map Pakistan product sequences: CASA → Debit Card → Credit Card → Personal Loan → Auto → Home Finance → Insurance → Investment. Track Islamic product path separately.',
        ],
        'Expected Outcome': [
            'Identify fastest path to 3+ products/customer (from current 1.8). Target: reduce time from CASA to second product from 24 months to 6 months.',
        ],
    },
    19: {  # Credit Card Spending Journey
        'Objective': [
            'Pakistan credit card market: ~3M cards, growing 25% YoY. 30% of issued cards never activated. Map journey from issuance to activation to regular usage.',
        ],
        'Expected Outcome': [
            'Increase credit card activation rate from 70% to 90%. Target: first swipe within 7 days of issuance.',
        ],
    },
    20: {  # Abandoned Online Purchase
        'Objective': [
            'In Pakistan banking: abandoned loan applications (started online, not completed), abandoned account opening (dropped at NADRA step), abandoned card applications. 40-60% abandonment rate at digital onboarding.',
        ],
    },
    21: {  # Wealth Management — Proactive Advice
        'Objective': [
            'Pakistan HNW segment (PKR 50M+ deposits) is relationship-managed but reactive. Proactive advice based on portfolio analytics is rare.',
        ],
        'Source Data': [
            'Pakistan: Portfolio holdings (FDs, NSS, PIBs, mutual funds, stocks), RAAST large value transfers, property transaction signals',
        ],
        'Expected Outcome': [
            'Opportunity: NSS certificates maturing, PIB/T-Bill laddering, Islamic wealth management (Sukuk, Islamic mutual funds)',
        ],
    },
    22: {  # Portfolio Increase and New "Win-Over"
        'Objective': [
            'Win-over high-value customers from competitors by detecting multi-banking signals: IBFT outflows to competitor, ECIB inquiries by other banks.',
        ],
        'Expected Outcome': [
            'Target: win-over 5% of competitor high-value customers annually through superior analytics-driven service',
        ],
    },
    23: {  # Lead Generation From Branch Notes
        'Objective': [
            'Pakistan branch RMs capture customer notes manually (paper or basic CRM). Text mining these notes can uncover cross-sell leads. Urdu text analytics required — RMs often write in mixed Urdu/English.',
        ],
        'Source Data': [
            'Pakistan: Branch CRM notes, RM visit reports, call center conversation transcripts (Urdu/English)',
        ],
    },
    24: {  # Identify Potential Money Flow to Retain
        'Objective': [
            'Detect RAAST/IBFT outflows to competitor banks — if a customer regularly transfers salary to another bank, retention intervention needed.',
        ],
        'Expected Outcome': [
            'Monitor FD maturity events — if not renewed, funds may be leaving to competitor offering higher rate',
        ],
    },
    25: {  # Investor Segmentation
        'Objective': [
            'Segment Pakistan investors: NSS certificate holders (conservative), mutual fund investors (moderate), stock traders (active), gold savers (traditional), crypto curious (emerging). Islamic investment preference is critical dimension.',
        ],
    },
    26: {  # Identify 'Hidden' Individual Business Owners
        'Objective': [
            "Pakistan's 70% informal economy means many business owners bank as individuals. Detecting business patterns (multiple salary disbursements, high transaction volumes, supplier payments) enables SME product offers.",
        ],
        'Source Data': [
            'Pakistan: CNIC data (individual vs. NTN business), transaction patterns, RAAST payment frequency to multiple recipients',
        ],
    },
    27: {  # Credit/Debit Card Spend Stimulation
        'Objective': [
            '30M+ debit cards issued but average monthly POS usage <5 transactions. Ramadan/Eid spending spike = ideal period for card stimulation campaigns.',
        ],
        'Expected Outcome': [
            'Convert ATM-cash-withdrawal-heavy customers to POS/QR payment users. Target 30-50% increase in card usage.',
        ],
    },
    28: {  # People Like Me
        'Objective': [
            'Build look-alike models for Pakistan segments: find customers similar to high-value customers for upgrade. Special application: find unbanked individuals similar to recently banked customers for financial inclusion targeting.',
        ],
    },
    29: {  # Attitudinal Segmentation
        'Objective': [
            'Key attitudinal dimensions for Pakistan: Islamic finance preference, digital readiness, brand loyalty vs. rate shopping, savings vs. spending orientation. Infer attitudes from behavior — Islamic preference from Zakat payments, digital readiness from app usage.',
        ],
    },
    30: {  # Hidden 'Preferred' Customers
        'Objective': [
            'Identify mass-market customers who actually qualify for priority/preferred banking. In Pakistan: customers with PKR 5M+ spread across 2-3 bank accounts appear mass-market individually. CNIC-based total relationship view reveals hidden value.',
        ],
    },
    31: {  # Propensity Modeling
        'Objective': [
            'Build propensity models for Pakistan banking products: credit card, personal loan, auto finance, home finance, mutual fund, insurance.',
        ],
        'Source Data': [
            'Pakistan-specific features: salary regularity score, ECIB credit bureau score, RAAST activity level, product holding count, branch visit frequency',
        ],
    },
    32: {  # Social Network Driven Potential Value
        'Objective': [
            'CNIC-based network analysis: CNIC first 5 digits encode geographic area — family members share prefix. IBFT/RAAST transfer graph reveals customer relationships.',
        ],
    },
    33: {  # Customer Network Analysis
        'Objective': [
            'CNIC enables household mapping unavailable in most markets. IBFT/RAAST transfer patterns reveal relationship networks.',
        ],
        'Source Data': [
            'Pakistan: CNIC prefix linkage, IBFT transfer patterns, joint account data',
        ],
        'Expected Outcome': [
            'Application: AML/CFT network detection (SBP FATF compliance), household product bundling, referral program targeting',
        ],
    },
    34: {  # Client Connections
        'Objective': [
            'Map client connections using RAAST/IBFT transaction graphs and CNIC family prefix linkage for household-level banking relationships.',
        ],
    },
    35: {  # Credit Card Holder Behavior Analysis (1)
        'Objective': [
            'Analyze Pakistan credit card behavior: average ticket size, merchant categories (grocery, fuel, dining, online), installment plan usage, reward point redemption.',
        ],
        'Expected Outcome': [
            'Key insight: Pakistan credit card users show extreme seasonality — Eid spending is 3-5x normal months',
        ],
    },
    36: {  # Credit Card Holder Behavior Analysis (2)
        'Objective': [
            'Deep-dive into Pakistan credit card usage patterns: supplementary card usage, international spending, contactless adoption, QR payment adoption rates.',
        ],
    },
    37: {  # Client Branch Visit Preference Behavior
        'Objective': [
            'Pakistan still branch-heavy: 60%+ high-value transactions done in-branch. Detect customers visiting branch for transactions that could be done digitally — target for app adoption campaigns.',
        ],
    },
    38: {  # Customer Life-Based Events
        'Objective': [
            'Pakistan-specific life events: first salary credit, marriage (gift inflows), first child (school fee pattern), Hajj/Umrah savings, property purchase, retirement, overseas migration. Islamic calendar: Ramadan (Zakat, charity), Eid-ul-Adha (Qurbani).',
        ],
    },

    # ─── Section 3: Customer Lifecycle Management ───
    40: {  # Lunch Buddy Analysis
        'Objective': [
            'Adapt for Pakistan: identify customers who regularly transact together (shared POS location, same merchant, same timing). If one churns, proactively retain the lunch buddy before social influence drives their churn.',
        ],
    },
    41: {  # Prospect Screener
        'Objective': [
            'Screen prospects using ECIB credit bureau data, CNIC verification, NADRA biometric, PTA mobile number verification.',
        ],
        'Source Data': [
            'Pakistan: ECIB credit bureau, CNIC/NADRA verification, mobile wallet transaction history (JazzCash, Easypaisa) as proxy for creditworthiness',
        ],
    },
    42: {  # Product Sequence: Path to Value (Lifecycle)
        'Objective': [
            'Track time between product adoptions and identify accelerators. Pakistan target: reduce average time from CASA to second product from 24 months to 6 months.',
        ],
    },
    43: {  # Path to Churn
        'Objective': [
            'Map event sequences leading to churn in Pakistan: balance decline → reduced transactions → app login drop → salary redirect → account dormancy.',
        ],
        'Expected Outcome': [
            'Pakistan-specific churn paths: employer salary account switch, fintech migration, Islamic conversion, overseas migration path',
        ],
    },
    44: {  # Identify 'Balance' Churners
        'Objective': [
            'Balance churn (gradual withdrawal without closing account) is the dominant churn type in Pakistan — accounts remain open with minimum balance while customer moves to competitor.',
        ],
        'Source Data': [
            'Pakistan: Detect via RAAST/IBFT — customer transferring increasing amounts to another bank monthly',
        ],
    },
    45: {  # Credit Card Balance Churn
        'Objective': [
            'Credit card balance churn in Pakistan: customer reduces spending, transfers balance to competitor card offering lower rate/better rewards.',
        ],
        'Expected Outcome': [
            'Detect via: declining monthly spend, balance transfer transactions, zero-spend months',
        ],
    },
    46: {  # CASA Silent Churn — HIGHEST PRIORITY
        'Objective': [
            'CASA silent churn is Pakistan banking\'s biggest unaddressed revenue leak. PKR 500B+ estimated at risk across industry.',
        ],
        'Source Data': [
            'Pakistan: Salary credit stops, balance below 6-month average, RAAST outflows exceed inflows, no branch visit 90+ days',
        ],
        'Expected Outcome': [
            'Target: identify 20% of silent churners 30 days before balance drops below retention threshold',
        ],
    },
    47: {  # Customer Churn Model in Retail Banking
        'Objective': [
            'Build Pakistan-specific churn model features: salary credit continuity, RAAST/IBFT outflow ratio, mobile app login frequency, SBP complaint filing, branch visit frequency change, FD maturity renewal rate.',
        ],
        'Expected Outcome': [
            'Model must differentiate: competitive churn (to fintech), rate shopping, life event churn (overseas migration), dormancy slide',
        ],
    },
    48: {  # Broker Introduced Insurance — Path to Churn
        'Objective': [
            'Adapt for Pakistan bancassurance: customers sold insurance at account opening (often without full understanding). Pakistan insurance penetration <1% — every policy retention matters.',
        ],
    },
    49: {  # Improving Cross-Sell Targeting
        'Objective': [
            'Current cross-sell response rate <5% in Pakistan banking. Key improvements: salary-event trigger (within 24 hours), Islamic preference matching, ECIB pre-screening.',
        ],
        'Expected Outcome': [
            'Improvement target: 8-12% response rate. Never cross-sell conventional interest products to Islamic-preference customers.',
        ],
    },

    # ─── Section 4: Customer Interaction Management ───
    51: {  # Social Networks Data for Marketing Campaigns
        'Objective': [
            'Pakistan social media: Facebook (45M+), Instagram (15M+), TikTok (30M+), YouTube (70M+). SBP guidelines restrict use of social data for credit decisions.',
        ],
    },
    52: {  # Contact Management
        'Objective': [
            'Solve SMS fatigue: implement unified contact management. Pakistan-specific: coordinate SBP-mandated notifications (OTP, transaction alerts) with marketing messages.',
        ],
        'Expected Outcome': [
            'Target: reduce opt-out rate by 40% through intelligent contact frequency management',
        ],
    },
    53: {  # Omni-Channel Customer Experience Optimization
        'Objective': [
            'Unify customer interaction history across branch, ATM, mobile app, internet banking, contact center, USSD, agent network, RAAST.',
        ],
        'Expected Outcome': [
            'Enable seamless handoff: customer starts loan application on mobile, continues at branch, gets approval via SMS',
        ],
    },
    54: {  # Omni-Channel Customer Engagement
        'Objective': [
            'Pakistan channels: 16K+ branches, 16K+ ATMs, mobile apps, USSD, WhatsApp, 500K+ agents, call centers, internet banking — 8+ touchpoints requiring unified engagement.',
        ],
    },
    55: {  # Location Based Offers
        'Objective': [
            'Pakistan telco partnerships (Jazz, Telenor, Zong, Ufone) can provide anonymized location data for targeted offers.',
        ],
        'Expected Outcome': [
            'Use cases: branch proximity offers, shopping mall POS cashback, airport travel card promotion, petrol station fuel card offer',
        ],
    },
    56: {  # Real-time Customer GIS Location in Collaboration with Telcos
        'Objective': [
            'Pakistan telco-bank collaboration for GIS-based offers. Privacy consideration: SBP and PTA guidelines on location data usage.',
        ],
    },
    57: {  # RTIM and Real-Time
        'Objective': [
            'Real-time interaction management is the aspirational target for Pakistan banking — currently batch-only. First steps: real-time RAAST event triggers, mobile app in-session offers, ATM screen personalization.',
        ],
    },
    58: {  # Web/IVR Breakout
        'Objective': [
            'Analyze IVR breakout patterns — when customers press 0 to speak to agent, what were they trying to do? Urdu IVR optimization — many customers struggle with English-only IVR menus.',
        ],
    },
    59: {  # Complaints Process Optimisation
        'Objective': [
            'SBP mandates complaint resolution within defined SLAs. Categorize per SBP Consumer Protection framework: unauthorized transactions, service charges, digital banking failures, ATM issues.',
        ],
    },
    60: {  # Onsite Search Engine Optimization
        'Objective': [
            'Optimize bank website internal search for Urdu and Roman Urdu queries. Most Pakistan bank websites return zero results for Urdu product searches.',
        ],
    },
    61: {  # Customized "Amount" Button
        'Objective': [
            'Personalize quick-transfer amounts on mobile app based on customer most frequent amounts. Pakistan specific: utility bill amounts, school fees, regular RAAST transfer amounts.',
        ],
    },
    62: {  # Enhanced NBA Contact Strategy
        'Objective': [
            'Islamic-aware NBA: never recommend conventional products to Islamic-preference customers. Salary-day NBA: cross-sell within 24 hours of salary credit. Ramadan NBA: Zakat, Islamic investment, charity offers.',
        ],
    },
    63: {  # Next Best Product Offer
        'Objective': [
            'Pakistan product bundles: Salary Package (CASA + credit card + personal loan), Home Package (home finance + insurance + furnishing loan), Islamic Package (Islamic CASA + Takaful + Islamic FD), Diaspora Bundle (RDA + NPC + remittance).',
        ],
    },
    64: {  # Product Bundling
        'Objective': [
            'Design bundles for Pakistan life stages: Student (education loan + debit card), Young Professional (salary account + credit card), Family (home finance + insurance + education saving).',
        ],
    },
    65: {  # Individualized Merchants Recommendation
        'Objective': [
            'Recommend merchants based on Pakistan-specific categories: grocery (Imtiaz, Chase Up), fuel (PSO, Shell), dining, mobile recharge. Partner with merchant networks for cashback offers driving card usage.',
        ],
    },
    66: {  # Advertising Creative Optimization
        'Objective': [
            'Test Urdu vs. English vs. bilingual creative across digital channels. Optimize for Pakistan mobile-first audience: vertical video, short-form content, WhatsApp-compatible formats.',
        ],
    },
    67: {  # Competitor Analysis
        'Objective': [
            'Key competitors to track: Big 5 banks, Meezan Bank (Islamic leader), SadaPay/NayaPay (fintech), digital bank licensees.',
        ],
        'Source Data': [
            'Pakistan: SBP published data (deposits, advances by bank), app store analytics, social media monitoring',
        ],
    },
    68: {  # Marketing Attribution
        'Objective': [
            'Build attribution across Pakistan offline-heavy marketing mix: TV 35%, outdoor 20%, print 15%, digital 15%, direct 10%, agent 5%. Start with digital attribution (UTM tracking) then expand to cross-channel.',
        ],
    },
    69: {  # Attribution
        'Objective': [
            'Complement attribution with Pakistan-specific digital journey tracking: app install → first login → first transaction → product adoption, across paid and organic channels.',
        ],
    },
}

# ═══════════════════════════════════════════
# SPEAKER NOTES FOR ALL SLIDES
# ═══════════════════════════════════════════

NOTES = {
    1: """SECTION: Customer Information Management
This section covers the foundational use case for all banking analytics — creating a unified customer view.
Pakistan context: 33 scheduled banks, 4-5 core systems each, 60M+ accounts, 100M+ mobile wallets.
FSDM Domains: Party (INDVDL, ORGN, PRTY, PRTY_IDNTFR), Event, Channel, Transaction""",

    2: """MULTI-DIMENSIONAL CUSTOMER VIEW
PAKISTAN: This is the foundational use case for all Pakistan banking analytics. Without a single customer view across multiple core systems, no downstream analytics is possible.
Challenge: Pakistan banks operate CTL, Temenos, Oracle, Finacle — the FSDM-based platform integrates these into a unified customer master using CNIC as primary key.
Target: Unified view of 60M+ bank customers, linked to 100M+ mobile wallet users via CNIC/mobile number.
FSDM: INDVDL, ORGN, PRTY, PRTY_IDNTFR (CNIC), IP_RLTNP, PRTY_ADDR, EVNT, INTN, CHNL, TXN, ACCT_TXN
BVF Capability: Customer Information Management > Multi-Dimensional Customer View""",

    3: """SECTION: Insight-Driven Customer Management
35 use cases covering profitability, segmentation, journey analytics, and event-based marketing.
Pakistan priority: Transaction Classification (salary detection), Customer Satisfaction (fintech benchmarking), and Event-Based Marketing (Ramadan/Eid campaigns).
FSDM Domains: Party, Transaction, Event, Product, Channel, Marketing""",

    4: """PATH TO PROFITABLE/UNPROFITABLE CUSTOMERS
PAKISTAN: PKR 3-5K acquisition cost per customer, only 1.8 products/customer. Most banks cannot calculate true customer profitability due to lack of activity-based costing.
Key insight: Digital acquisition cost PKR 500-1K vs branch PKR 3-5K — 5x difference drives the business case for digital transformation.
FSDM: PRTY, ACCT, TXN, PRDCT, CHNL_INTN, COST_ALLCTN
BVF Capability: Insight-Driven Customer Management > Customer Profitability
BACR: Revenue attribution, cost allocation, product-level P&L questions""",

    5: """CUSTOMER LIFETIME VALUE
PAKISTAN: Top 2% of customers generate ~20% of revenue. CLTV must incorporate both conventional and Islamic product holdings.
Challenge: KIBOR-based funds transfer pricing varies significantly. Islamic products use profit-sharing, requiring different CLTV methodology.
FSDM: PRTY, ACCT, TXN, PRDCT, PRDCT_PRFT, LTV_SCRE
BVF Capability: Insight-Driven > Customer Value Management""",

    6: """CUSTOMER SATISFACTION (NPS)
PAKISTAN: Traditional banks NPS ~20-30 vs. SadaPay ~70 vs. JazzCash ~50. Gap driven by digital experience quality.
SBP Consumer Protection data provides additional satisfaction signals. Google Play app ratings: most Pakistan banks 2-3 stars vs. fintechs 4+ stars.
FSDM: PRTY, SRVY_RSPNS, CMPLNT, CHNL_INTN, SNTMNT_SCRE
BVF Capability: Insight-Driven > Customer Experience Management""",

    7: """CUSTOMER SATISFACTION INDEX
PAKISTAN: Opportunity to build continuous satisfaction measurement from digital interaction data rather than periodic surveys.
Key dimensions: Branch wait time, digital transaction success rate, complaint resolution time, call center hold time.
FSDM: PRTY, SRVY_RSPNS, CMPLNT, SVC_RQST, CHNL_INTN
BVF Capability: Insight-Driven > Customer Experience Management""",

    8: """PREDICT COMPLAINT
PAKISTAN: SBP Consumer Protection complaints carry regulatory cost and reputation risk. 30% prediction target enables proactive resolution.
Key signals: repeated failed transactions, long call center wait, branch queue abandonment, social media negative mentions.
FSDM: PRTY, CMPLNT, SVC_RQST, CHNL_INTN, TXN_FAIL, SNTMNT
BVF Capability: Insight-Driven > Complaint Analytics""",

    9: """IDENTIFY BROKEN/SUB-OPTIMAL PROCESSES
PAKISTAN: Account opening requires 5 systems, NADRA verification adds latency, debit card issuance takes 7-14 days.
Key broken processes: digital onboarding (40-60% dropoff), IBFT failure handling, cheque clearing delays, loan disbursement (7-21 days).
FSDM: PRCS_STP, SVC_RQST, WAIT_TM, CHNL_INTN, TXN_FAIL
BVF Capability: Insight-Driven > Process Analytics""",

    10: """CALL CENTRE SENTIMENT
PAKISTAN: Urdu NLP models less mature, requires custom training. 1M+ calls/month per large bank — massive unstructured data opportunity.
WhatsApp banking conversations also provide sentiment data. IVR interaction patterns reveal frustration signals.
FSDM: PRTY, CHNL_INTN, CALL_RCRD, SNTMNT_SCRE, IVR_INTN
BVF Capability: Insight-Driven > Unstructured Data Analytics""",

    11: """TRANSACTIONAL CLASSIFICATION (1) — HIGHEST PRIORITY USE CASE
PAKISTAN: Classifying RAAST/IBFT payments enables salary detection for 70% informal workforce — unlocking lending for undocumented income.
Categories: salary, rent, utility, education fees, healthcare, religious (Zakat/Qurbani), remittance, government payments.
100M+ JazzCash/Easypaisa transactions provide additional classification opportunity.
FSDM: TXN, TXN_CLSFCTN, PYMT_TYP, MRCHNT_CTGRY, ACCT_TXN
BVF Capability: Insight-Driven > Transaction Analytics""",

    12: """TRANSACTIONAL CLASSIFICATION (2)
PAKISTAN: Extension of classification to mobile wallet transactions and QR payments. Key for understanding spending patterns of Pakistan's mobile-first population.
FSDM: TXN, TXN_CLSFCTN, MBL_TXN, WLLT_TXN, QR_PYMT
BVF Capability: Insight-Driven > Transaction Analytics""",

    13: """SALES PROCESS IMPROVEMENT
PAKISTAN: Branch staff close <5% of sales leads. Mobile app loan application takes 7-21 days vs. fintech 24-48 hours.
Opportunity: digital sales funnel optimization can increase conversion by 3-5x.
FSDM: SLS_OPPRTNTY, SLS_FNNL, CHNL_INTN, PRDCT_APPLCTN
BVF Capability: Insight-Driven > Sales Analytics""",

    14: """PATH TO PURCHASE — EVENT BASED MARKETING
PAKISTAN: Events — salary credit (1st-5th), Ramadan/Eid, back-to-school (August), wedding season (Nov-Feb), Hajj season.
Real-time event triggers via RAAST enable within-24-hour campaign activation.
FSDM: EVNT, EVNT_TRGGR, CMPGN, CMPGN_RSPNS, PRTY_EVNT
BVF Capability: Insight-Driven > Event-Based Marketing""",

    15: """CUSTOMER JOURNEY ANALYTICS (1)
PAKISTAN: Key journeys — onboarding (CNIC → NADRA → account → first transaction), branch-to-digital migration, financial inclusion (agent → basic account → savings → lending).
Critical question: why do 40-60% of digital onboarding applicants drop off at NADRA biometric step?
FSDM: CSTMR_JRNY, JRNY_STP, CHNL_INTN, EVNT, CNVRSN
BVF Capability: Insight-Driven > Journey Analytics""",

    16: """CUSTOMER JOURNEY ANALYTICS (2)
PAKISTAN: Cross-channel journeys — customers using both traditional branch and branchless agent channels simultaneously.
FSDM: CSTMR_JRNY, JRNY_STP, CHNL_INTN, AGNT_INTN
BVF Capability: Insight-Driven > Journey Analytics""",

    17: """PATH TO APPOINTMENT
PAKISTAN: Branch appointment rare for mass market. Priority/HNW customers need RM scheduling optimization via WhatsApp.
FSDM: APPTMNT, CHNL_INTN, RM_ASGNMNT, PRTY
BVF Capability: Insight-Driven > Branch Analytics""",

    18: """PRODUCT SEQUENCE: PATH TO VALUE
PAKISTAN: CASA → Debit Card → Credit Card → Personal Loan → Auto → Home Finance → Insurance → Investment.
Islamic path: Islamic CASA → Islamic FD → Diminishing Musharaka → Takaful.
Target: 3+ products/customer from current 1.8.
FSDM: PRDCT_HLDNG, PRDCT_SQNCE, PRTY_PRDCT, ACCT
BVF Capability: Customer Lifecycle > Cross-Sell""",

    19: """CREDIT CARD SPENDING JOURNEY
PAKISTAN: ~3M credit cards, 25% YoY growth. 30% never activated. Journey: issuance → first swipe → online usage → installment plans → supplementary card.
FSDM: CRD_TXN, MRCHNT_CTGRY, CRD_ACTV, SPNDNG_PTTRN
BVF Capability: Insight-Driven > Card Analytics""",

    20: """ABANDONED ONLINE PURCHASE
PAKISTAN: Primary abandonment: digital onboarding (40-60% at NADRA step), online loan applications, card applications.
FSDM: DGTL_JRNY, ABNDNMNT_EVNT, FRML_CMPLTTN, CHNL_INTN
BVF Capability: Insight-Driven > Digital Analytics""",

    21: """WEALTH MANAGEMENT — PROACTIVE ADVICE
PAKISTAN: HNW segment (PKR 50M+ deposits) reactive, not proactive. Opportunities: NSS maturity, PIB/T-Bill laddering, Islamic wealth (Sukuk, Islamic mutual funds).
FSDM: PRTFL_HLDNG, INVSTMNT_TXN, NSS_MTRY, PRTY_WLTH
BVF Capability: Insight-Driven > Wealth Analytics""",

    22: """PORTFOLIO INCREASE AND NEW WIN-OVER
PAKISTAN: Detect multi-banking via IBFT outflows and ECIB inquiries. Target: 5% win-over of competitor high-value customers annually.
FSDM: PRTY, ACCT_BLNCE, IBFT_TXN, ECIB_INQRY, CMPTTV_INTL
BVF Capability: Insight-Driven > Competitive Intelligence""",

    23: """LEAD GENERATION FROM BRANCH NOTES
PAKISTAN: RMs write mixed Urdu/English. Text mining branch CRM notes and call center transcripts for cross-sell leads.
FSDM: RM_NTS, CRM_RCRD, TXT_ANLTCS, SLS_OPPRTNTY
BVF Capability: Insight-Driven > Unstructured Analytics""",

    24: """IDENTIFY POTENTIAL MONEY FLOW TO RETAIN
PAKISTAN: RAAST/IBFT outflows to competitor banks signal retention risk. FD maturity non-renewal indicates potential exit.
FSDM: TXN, IBFT_TXN, ACCT_BLNCE, FD_MTRY, RTNTN_RSK
BVF Capability: Customer Lifecycle > Retention""",

    25: """INVESTOR SEGMENTATION
PAKISTAN: NSS holders (conservative), mutual fund (moderate), stock traders (active), gold savers (traditional), crypto curious (emerging).
Islamic investment preference is critical segmentation dimension: Sukuk, Islamic mutual funds, Naya Pakistan Certificates.
FSDM: PRTY, INVSTMNT_PRFL, PRDCT_HLDNG, RSK_PRFL
BVF Capability: Insight-Driven > Segmentation""",

    26: """IDENTIFY HIDDEN INDIVIDUAL BUSINESS OWNERS
PAKISTAN: 70% informal economy. Many business owners bank as individuals. Detect via multiple salary disbursements, high transaction volumes, supplier payments.
FSDM: PRTY, TXN, TXN_PTTRN, BSNS_INDCTR, CNIC_DATA
BVF Capability: Insight-Driven > Customer Classification""",

    27: """CREDIT/DEBIT CARD SPEND STIMULATION
PAKISTAN: 30M+ debit cards with <5 POS transactions/month avg. Ramadan/Eid = ideal stimulation period (3-5x spending spike).
Target: convert ATM-cash customers to POS/QR users.
FSDM: CRD_TXN, POS_TXN, ATM_TXN, CMPGN, CMPGN_RSPNS
BVF Capability: Insight-Driven > Card Analytics""",

    28: """PEOPLE LIKE ME
PAKISTAN: Look-alike models for segment upgrade and financial inclusion. Find unbanked individuals similar to recently banked customers.
FSDM: PRTY, SGMNT, PRFL_ATTR, BHVRL_SCRE
BVF Capability: Insight-Driven > Advanced Segmentation""",

    29: """ATTITUDINAL SEGMENTATION
PAKISTAN: Key dimensions — Islamic finance preference, digital readiness, brand loyalty vs. rate shopping, savings vs. spending orientation.
Infer from behavior: Zakat payments → Islamic preference, app usage → digital readiness.
FSDM: PRTY, SGMNT, ATTTDNL_SCRE, BHVRL_INDCTR
BVF Capability: Insight-Driven > Behavioral Segmentation""",

    30: """HIDDEN PREFERRED CUSTOMERS
PAKISTAN: Customers with PKR 5M+ across 2-3 bank accounts appear mass-market individually. CNIC-based total relationship view reveals hidden value.
FSDM: PRTY, ACCT_BLNCE, RLTNP_VL, SGMNT_MIGRT
BVF Capability: Insight-Driven > Value-Based Segmentation""",

    31: """PROPENSITY MODELING
PAKISTAN: Models for credit card, personal loan, auto finance, home finance, mutual fund, insurance.
Features: salary regularity, ECIB score, RAAST activity, product count, branch frequency.
FSDM: PRTY, PRPNSTY_SCRE, PRDCT_HLDNG, BHVRL_FTRS
BVF Capability: Insight-Driven > Predictive Analytics""",

    32: """SOCIAL NETWORK DRIVEN POTENTIAL VALUE
PAKISTAN: CNIC first 5 digits = geographic area, family members share prefix. IBFT/RAAST transfer graph reveals relationships.
FSDM: PRTY, NTWRK_GRPH, TXN_RLTNP, CNIC_PREFIX
BVF Capability: Insight-Driven > Network Analytics""",

    33: """CUSTOMER NETWORK ANALYSIS
PAKISTAN: CNIC-based household mapping. IBFT/RAAST patterns reveal networks. Applications: AML/CFT (FATF compliance), household bundling, referral targeting.
FSDM: PRTY, NTWRK_GRPH, TXN_RLTNP, AML_ALRT
BVF Capability: Insight-Driven > Network Analytics""",

    34: """CLIENT CONNECTIONS
PAKISTAN: RAAST/IBFT transaction graphs + CNIC family prefix = household-level banking relationships.
FSDM: PRTY, IP_RLTNP, TXN_GRPH, HSHOLD_GRPNG
BVF Capability: Insight-Driven > Relationship Analytics""",

    35: """CREDIT CARD HOLDER BEHAVIOR ANALYSIS (1)
PAKISTAN: Average ticket size, merchant categories (grocery, fuel, dining, online), installment usage, reward redemption.
Key: extreme Eid seasonality (3-5x normal months).
FSDM: CRD_TXN, MRCHNT_CTGRY, SPNDNG_PTTRN, INSTLMNT_PLN
BVF Capability: Insight-Driven > Card Analytics""",

    36: """CREDIT CARD HOLDER BEHAVIOR ANALYSIS (2)
PAKISTAN: Supplementary card usage, international spending, contactless adoption, QR payment adoption rates.
FSDM: CRD_TXN, CRD_TYP, CNTCTLS_TXN, QR_TXN
BVF Capability: Insight-Driven > Card Analytics""",

    37: """CLIENT BRANCH VISIT PREFERENCE BEHAVIOR
PAKISTAN: 60%+ high-value transactions in-branch. Detect branch visits for digital-capable transactions to target for app adoption.
FSDM: BRNCH_VST, CHNL_INTN, CHNL_PRFRNCE, DGTL_RDNSS
BVF Capability: Insight-Driven > Channel Analytics""",

    38: """CUSTOMER LIFE-BASED EVENTS
PAKISTAN: First salary, marriage (gift inflows), first child (school fees), Hajj/Umrah savings, property purchase, retirement, overseas migration.
Islamic calendar: Ramadan (Zakat, charity), Eid-ul-Adha (Qurbani), Shab-e-Qadr.
FSDM: PRTY_EVNT, LF_EVNT, EVNT_TRGGR, CLNDR_EVNT
BVF Capability: Insight-Driven > Event Analytics""",

    39: """SECTION: Customer Lifecycle Management
10 use cases covering acquisition, churn prediction, cross-sell, and lifecycle path optimization.
Pakistan priority: CASA Silent Churn (PKR 500B+ at risk), Customer Churn Model (fintech competition), Cross-Sell Targeting (1.8 to 3+ products).
FSDM Domains: Party, Account, Product, Event, Transaction""",

    40: """LUNCH BUDDY ANALYSIS
PAKISTAN: Identify co-transacting customers (shared POS, merchant, timing). If one churns, retain the buddy before social influence drives their churn.
FSDM: PRTY, TXN, POS_TXN, MRCHNT, CO_TXN_PTTRN
BVF Capability: Customer Lifecycle > Retention""",

    41: """PROSPECT SCREENER
PAKISTAN: ECIB credit bureau, CNIC/NADRA verification, PTA mobile number verification. Mobile wallet history as creditworthiness proxy.
FSDM: PRSPCT, CRDT_SCRE, IDNTTY_VRFCTN, WLLT_HSTRY
BVF Capability: Customer Lifecycle > Acquisition""",

    42: """PRODUCT SEQUENCE: PATH TO VALUE (LIFECYCLE)
PAKISTAN: Track time between product adoptions. Target: CASA to second product from 24 months to 6 months.
FSDM: PRDCT_HLDNG, PRDCT_SQNCE, TM_TO_ADOPT, PRTY_PRDCT
BVF Capability: Customer Lifecycle > Cross-Sell""",

    43: """PATH TO CHURN
PAKISTAN: Balance decline → reduced transactions → app login drop → salary redirect → dormancy.
Churn paths: employer switch, fintech migration, Islamic conversion, overseas migration.
FSDM: PRTY, CHRN_EVNT, CHRN_PTH, BHVRL_DCLN
BVF Capability: Customer Lifecycle > Churn Prevention""",

    44: """IDENTIFY BALANCE CHURNERS
PAKISTAN: Dominant churn type — accounts open with minimum balance while customer moves to competitor. RAAST/IBFT increasing outflows signal.
FSDM: PRTY, ACCT_BLNCE, BLNCE_TRND, IBFT_OUTFLW
BVF Capability: Customer Lifecycle > Churn Detection""",

    45: """CREDIT CARD BALANCE CHURN
PAKISTAN: Customer reduces spending, transfers balance to competitor. Detect via declining spend, balance transfers, zero-spend months.
FSDM: CRD_ACCT, CRD_BLNCE, BLNCE_TRNSF, SPND_DCLN
BVF Capability: Customer Lifecycle > Card Retention""",

    46: """CASA SILENT CHURN — HIGHEST PRIORITY USE CASE
PAKISTAN: Biggest unaddressed revenue leak. PKR 500B+ at risk. Top-tier customers move funds without formal closure.
Signals: salary credit stops, balance below 6-month avg, RAAST outflows > inflows, no branch visit 90+ days.
Target: identify 20% of silent churners 30 days before balance drops below threshold.
FSDM: PRTY, ACCT_BLNCE, SLNT_CHRN_SCRE, SLRY_CRDT, IBFT_RATIO
BVF Capability: Customer Lifecycle > CASA Retention""",

    47: """CUSTOMER CHURN MODEL IN RETAIL BANKING
PAKISTAN: Features — salary continuity, RAAST/IBFT outflow ratio, app login frequency, SBP complaints, branch visit change, FD renewal rate.
Differentiate: competitive churn (fintech), rate shopping, life event (overseas), dormancy.
FSDM: PRTY, CHRN_SCRE, CHRN_DRVR, BHVRL_FTRS, CMPTTV_INDCTR
BVF Capability: Customer Lifecycle > Churn Prediction""",

    48: """BROKER INTRODUCED INSURANCE — PATH TO CHURN
PAKISTAN: Bancassurance customers sold at account opening. Pakistan insurance penetration <1%. High lapse rates indicate satisfaction issues.
FSDM: PLCY, PLCY_LAPSE, BNCASSRNCE, PRTY_PLCY
BVF Capability: Customer Lifecycle > Insurance Retention""",

    49: """IMPROVING CROSS-SELL TARGETING
PAKISTAN: Current response rate <5%. Target: 8-12%. Key: salary-event trigger (24hr), Islamic preference matching, ECIB pre-screening.
Never cross-sell conventional interest products to Islamic-preference customers.
FSDM: PRTY, XSL_SCRE, PRPNSTY, ISLMC_PRFRNCE, CMPGN_RSPNS
BVF Capability: Customer Lifecycle > Cross-Sell Optimization""",

    50: """SECTION: Customer Interaction Management
19 use cases covering contact management, omnichannel optimization, NBA, real-time interaction, and personalization.
Pakistan priority: Contact Management (SMS fatigue fix), NBA (Islamic-aware), Omnichannel (8+ touchpoints).
FSDM Domains: Campaign, Channel, Interaction, Marketing, Contact""",

    51: """SOCIAL NETWORKS DATA FOR MARKETING CAMPAIGNS
PAKISTAN: Facebook 45M+, TikTok 30M+, YouTube 70M+. No formal data privacy law but SBP restricts social data for credit decisions.
FSDM: SCLA_MDA_PRFL, SCLA_SNTMNT, CMPGN, CMPGN_CHNL
BVF Capability: Customer Interaction > Social Analytics""",

    52: """CONTACT MANAGEMENT
PAKISTAN: SMS fatigue crisis — 10-15 promotional messages/day. Coordinate SBP-mandated notifications with marketing messages.
Target: reduce opt-out rate by 40% through intelligent frequency management.
FSDM: CNTCT_HSTRY, CNTCT_PRFRNCE, CMPGN, MSG_DLVRY, OPT_OUT
BVF Capability: Customer Interaction > Contact Optimization""",

    53: """OMNI-CHANNEL CUSTOMER EXPERIENCE OPTIMIZATION
PAKISTAN: Branch + ATM + mobile + internet + call center + USSD + agent + RAAST = 8+ touchpoints.
Enable seamless handoff: start on mobile, continue at branch, approve via SMS.
FSDM: CHNL_INTN, CHNL_SSSN, OMNI_JRNY, SVC_RQST
BVF Capability: Customer Interaction > Omnichannel""",

    54: """OMNI-CHANNEL CUSTOMER ENGAGEMENT
PAKISTAN: 16K+ branches, 16K+ ATMs, mobile apps, USSD, WhatsApp, 500K+ agents, call centers, internet banking.
FSDM: CHNL_INTN, ENGMNT_SCRE, CHNL_PRFRNCE, PRSNLZTN
BVF Capability: Customer Interaction > Engagement""",

    55: """LOCATION BASED OFFERS
PAKISTAN: Telco partnerships (Jazz, Telenor, Zong, Ufone) for anonymized location data.
Use cases: branch proximity, mall cashback, airport travel card, petrol station fuel card.
FSDM: LCTN_DATA, MRCHNT_PRXMTY, OFFR, GEO_TRGGR
BVF Capability: Customer Interaction > Location Marketing""",

    56: """REAL-TIME CUSTOMER GIS LOCATION WITH TELCOS
PAKISTAN: Telco-bank collaboration for GIS offers. SBP and PTA privacy guidelines on location data.
FSDM: GIS_DATA, TELCO_LCTN, PRXMTY_ALRT, PRSNLZD_OFFR
BVF Capability: Customer Interaction > GIS Analytics""",

    57: """RTIM AND REAL-TIME
PAKISTAN: Currently batch-only. First steps: real-time RAAST event triggers, mobile app in-session offers, ATM screen personalization.
FSDM: RT_EVNT, RT_DCSNNG, CHNL_INTN, OFFR_DLVRY
BVF Capability: Customer Interaction > Real-Time Marketing""",

    58: """WEB/IVR BREAKOUT
PAKISTAN: IVR breakout analysis — why do customers press 0? Urdu IVR optimization needed.
FSDM: IVR_INTN, BRKOUT_EVNT, CHNL_INTN, CALL_RSLT
BVF Capability: Customer Interaction > IVR Analytics""",

    59: """COMPLAINTS PROCESS OPTIMISATION
PAKISTAN: SBP mandates resolution SLAs. Categories: unauthorized transactions, service charges, digital failures, ATM issues, staff behavior.
FSDM: CMPLNT, CMPLNT_CTGRY, SLA_TRCKNG, RSLUTN_PRCS
BVF Capability: Customer Interaction > Complaint Management""",

    60: """ONSITE SEARCH ENGINE OPTIMIZATION
PAKISTAN: Optimize internal search for Urdu and Roman Urdu. Most bank websites return zero results for Urdu product searches.
FSDM: WEB_SRCH, SRCH_RSLT, CNTNT_MTCH, LNG_PRCSNG
BVF Capability: Customer Interaction > Digital Experience""",

    61: """CUSTOMIZED AMOUNT BUTTON
PAKISTAN: Personalize quick-transfer amounts based on frequent amounts. Utility bills, school fees, regular RAAST transfers.
FSDM: TXN_PTTRN, FRQNT_AMNT, PRSNLZTN, MBL_UX
BVF Capability: Customer Interaction > Digital Personalization""",

    62: """ENHANCED NBA CONTACT STRATEGY
PAKISTAN: Islamic-aware NBA (never conventional to Islamic customers). Salary-day NBA (cross-sell within 24hr). Ramadan NBA (Zakat, charity).
FSDM: NBA_SCRE, CNTCT_STRTGY, ISLMC_PRFRNCE, EVNT_TRGGR
BVF Capability: Customer Interaction > Next Best Action""",

    63: """NEXT BEST PRODUCT OFFER
PAKISTAN: Salary Package (CASA + credit card + personal loan), Home Package, Islamic Package, Diaspora Bundle (RDA + NPC + remittance).
FSDM: NBP_SCRE, PRDCT_BNDL, PRPNSTY, OFFR_OPTMZTN
BVF Capability: Customer Interaction > Product Recommendation""",

    64: """PRODUCT BUNDLING
PAKISTAN: Life-stage bundles — Student, Young Professional, Family, HNW, Retiree, Diaspora.
FSDM: PRDCT_BNDL, LF_STG, BNDL_PRFMNCE, PRTY_SGMNT
BVF Capability: Customer Interaction > Bundle Optimization""",

    65: """INDIVIDUALIZED MERCHANTS RECOMMENDATION
PAKISTAN: Categories — Imtiaz/Chase Up (grocery), PSO/Shell (fuel), dining chains, mobile recharge. Partner for cashback offers.
FSDM: MRCHNT, MRCHNT_CTGRY, RCMNDTN, CRD_TXN
BVF Capability: Customer Interaction > Merchant Analytics""",

    66: """ADVERTISING CREATIVE OPTIMIZATION
PAKISTAN: Test Urdu vs English vs bilingual. Mobile-first: vertical video, short-form, WhatsApp-compatible.
FSDM: CMPGN_CREATV, AB_TST, CHNL_PRFMNCE, CREATV_ATTR
BVF Capability: Customer Interaction > Creative Optimization""",

    67: """COMPETITOR ANALYSIS
PAKISTAN: Big 5 banks, Meezan Bank (Islamic leader), SadaPay/NayaPay (fintech), digital bank licensees.
FSDM: CMPTTV_DATA, MKT_SHRE, PRDCT_BNCHMRK, PRCE_CMPRN
BVF Capability: Customer Interaction > Competitive Intelligence""",

    68: """MARKETING ATTRIBUTION
PAKISTAN: Offline-heavy mix: TV 35%, outdoor 20%, print 15%, digital 15%, direct 10%, agent 5%. Start with digital UTM tracking.
FSDM: CMPGN, CHNL_ATTR, CNVRSN, CMPGN_ROI
BVF Capability: Customer Interaction > Marketing Attribution""",

    69: """ATTRIBUTION
PAKISTAN: Digital journey tracking: app install → first login → first transaction → product adoption, across paid and organic channels.
FSDM: ATTR_MDL, DGTL_JRNY, CNVRSN_PTH, CHNL_CNTRBTN
BVF Capability: Customer Interaction > Multi-Touch Attribution""",
}


# ═══════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════

def main():
    print('=' * 60)
    print('Enriching 06_Marketing_CX_Use_Cases.pptx')
    print('=' * 60)

    # Section dividers (no enrichment needed, just notes)
    section_dividers = {1, 3, 39, 50}

    # ─── Phase 1: Slide content enrichment ───
    print('\n--- Phase 1: Use Case Slide Enrichment ---')
    enriched = 0
    failed = 0

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
                    print(f'  slide{slide_num}: WARN - could not append to "{header[:30]}"')
            else:
                print(f'  slide{slide_num}: WARN - shape not found: "{header[:30]}"')

        if changed:
            tree.write(fpath, xml_declaration=True, encoding='UTF-8')
            enriched += 1
        else:
            failed += 1

    print(f'  Enriched: {enriched}, Failed: {failed}')

    # ─── Phase 2: Speaker Notes ───
    print('\n--- Phase 2: Speaker Notes ---')
    notes_ok = 0
    notes_fail = 0

    for slide_num, notes_text in NOTES.items():
        if update_notes(slide_num, notes_text):
            notes_ok += 1
        else:
            print(f'  slide{slide_num}: WARN - notes update failed')
            notes_fail += 1

    print(f'  Notes updated: {notes_ok}, Failed: {notes_fail}')

    print('\n' + '=' * 60)
    print('Enrichment complete!')
    print('=' * 60)


if __name__ == '__main__':
    main()
