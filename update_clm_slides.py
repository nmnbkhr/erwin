#!/usr/bin/env python3
"""
Enrich 04_Customer_Lifecycle_Management.pptx with Pakistan context.
- Add bullets to existing table cells
- Update speaker notes
- Add 3 new slides
"""
import xml.etree.ElementTree as ET
import copy
import os
import re

# Register namespaces
for prefix, uri in [
    ('a', 'http://schemas.openxmlformats.org/drawingml/2006/main'),
    ('p', 'http://schemas.openxmlformats.org/presentationml/2006/main'),
    ('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'),
]:
    ET.register_namespace(prefix, uri)

BASE = '/mnt/e/erwin/unpacked_04'
SLIDES = f'{BASE}/ppt/slides'
NOTES = f'{BASE}/ppt/notesSlides'
NS = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

# ─────────────────────────────────────────
# HELPER: Add bullets to a table cell
# ─────────────────────────────────────────

def find_table_cell_containing(root, text_fragment, ns):
    """Find the table cell (<a:tc>) containing a text fragment. Return the tc element.
    Concatenates all <a:t> text within a cell for matching, since PowerPoint
    splits text across multiple runs."""
    for tc in root.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}tc'):
        # First try individual runs (faster for simple cases)
        for t in tc.findall('.//a:t', ns):
            if t.text and text_fragment in t.text:
                return tc
        # Fall back to concatenated text across all runs
        full_text = ''.join(t.text for t in tc.findall('.//a:t', ns) if t.text)
        if text_fragment in full_text:
            return tc
    return None


def add_text_to_cell(tc, new_lines, ns):
    """Append new bullet lines to a table cell, copying format from last paragraph."""
    txBody = tc.find('a:txBody', ns)
    if txBody is None:
        return False

    paras = list(txBody.findall('a:p', ns))
    # Find a good template paragraph (non-empty, non-header)
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

    if template is None:
        return False

    for line in new_lines:
        new_p = copy.deepcopy(template)
        # Set text of first run
        for r in new_p.findall('a:r', ns):
            t = r.find('a:t', ns)
            if t is not None:
                t.text = line
                break
        txBody.append(new_p)

    return True


def add_text_to_shape(root, shape_text_fragment, new_lines, ns):
    """Find a shape containing text_fragment and append lines."""
    for sp in root.findall('.//p:sp', ns):
        txBody = sp.find('.//p:txBody', ns)
        if txBody is None:
            txBody = sp.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}txBody')
        if txBody is None:
            continue

        for t in txBody.findall('.//a:t', ns):
            if t.text and shape_text_fragment in t.text:
                # Found the shape - append lines
                paras = list(txBody.findall('a:p', ns))
                template = None
                for p in reversed(paras):
                    for r in p.findall('a:r', ns):
                        te = r.find('a:t', ns)
                        if te is not None and te.text and len(te.text.strip()) > 5:
                            template = p
                            break
                    if template:
                        break

                if template is None:
                    return False

                for line in new_lines:
                    new_p = copy.deepcopy(template)
                    for r in new_p.findall('a:r', ns):
                        te = r.find('a:t', ns)
                        if te is not None:
                            te.text = line
                            break
                    txBody.append(new_p)
                return True
    return False


# ─────────────────────────────────────────
# HELPER: Update speaker notes
# ─────────────────────────────────────────

def update_notes(slide_num, notes_text):
    """Update speaker notes for a slide."""
    # Slide N -> notesSlide{65+N}.xml
    notes_num = 65 + slide_num
    notes_file = os.path.join(NOTES, f'notesSlide{notes_num}.xml')

    if not os.path.exists(notes_file):
        print(f'  Notes file not found: notesSlide{notes_num}.xml')
        return False

    tree = ET.parse(notes_file)
    root = tree.getroot()

    # Find the notes body text shape (usually type="body" or has text content)
    for sp in root.findall('.//{http://schemas.openxmlformats.org/presentationml/2006/main}sp'):
        # Check if this is the notes body
        nvSpPr = sp.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}nvSpPr')
        if nvSpPr is not None:
            nvPr = nvSpPr.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}nvPr')
            if nvPr is not None:
                ph = nvPr.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}ph')
                if ph is not None and ph.get('type') == 'body':
                    txBody = sp.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}txBody')
                    if txBody is None:
                        txBody = sp.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}txBody')
                    if txBody is None:
                        continue

                    # Get existing paragraphs
                    paras = list(txBody.findall('{http://schemas.openxmlformats.org/drawingml/2006/main}p'))

                    # Find template paragraph
                    template = None
                    for p in paras:
                        template = p
                        break

                    if template is None:
                        continue

                    # Clear existing content (keep first as template structure)
                    for p in paras[1:]:
                        txBody.remove(p)

                    # Set first paragraph text
                    lines = notes_text.strip().split('\n')
                    first = True
                    for line in lines:
                        if first:
                            # Update first paragraph
                            runs = template.findall('{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                            if runs:
                                t = runs[0].find('{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                                if t is not None:
                                    t.text = line
                            else:
                                # Create a run if none exists
                                r_elem = ET.SubElement(template, '{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                                t_elem = ET.SubElement(r_elem, '{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                                t_elem.text = line
                            first = False
                        else:
                            new_p = copy.deepcopy(template)
                            runs = new_p.findall('{http://schemas.openxmlformats.org/drawingml/2006/main}r')
                            if runs:
                                t = runs[0].find('{http://schemas.openxmlformats.org/drawingml/2006/main}t')
                                if t is not None:
                                    t.text = line
                            txBody.append(new_p)

                    tree.write(notes_file, xml_declaration=True, encoding='UTF-8')
                    return True

    return False


# ─────────────────────────────────────────
# ENRICHMENT DATA
# ─────────────────────────────────────────

# Slide enrichments: slide_num -> { 'table_additions': {cell_text_fragment: [new_lines]}, 'shape_additions': {text_fragment: [new_lines]} }
ENRICHMENTS = {
    1: {  # Customer Acquisition - Capability Detail
        'table_additions': {
            'Increase the efficiency': [
                'Reduce acquisition cost from PKR 3K-5K (branch) to PKR 500-1K (digital) via CNIC e-KYC',
                'Target unbanked 70% of adults through agent banking and simplified Asaan Accounts',
                'Compete with fintech onboarding speed (SadaPay: 3-min signup vs. banks: 30-60 min)',
                'Leverage employer partnerships for salary account acquisition (payroll pipeline)',
            ],
            '3rd party prospect data': [
                'NADRA biometric verification API (CNIC + fingerprint + photo match)',
                'SBP Asaan Account / Asaan Digital Account tier data',
                'Agent network data (500,000+ branchless banking agents across Pakistan)',
                'Digital marketing attribution (social media, Google, in-app referrals, RAAST invitations)',
            ],
            'Reduced costs of new customer': [
                'Achieve 50%+ digital onboarding rate (current <15%) by 2027',
                'Reduce time-to-account from 3-5 days to <10 minutes via digital channels',
                'Acquire 2-3M new customers annually at 60% lower cost through digital and agent channels',
            ],
        },
    },
    3: {  # Customer On-Boarding - Capability Detail
        'table_additions': {
            'Onboard new customers': [
                'Execute CNIC + biometric auth within first-day onboarding workflow',
                'Activate debit card, mobile banking, RAAST ID within 48 hours of account opening',
                'Drive first IBFT/RAAST transaction within first week through incentives',
                'Cross-sell debit to credit to personal loan within first 90 days',
                'Personalize onboarding journey for conventional vs. Islamic customers',
            ],
        },
    },
    5: {  # Customer Retention - Capability Detail
        'table_additions': {
            'Develop strategies to retain': [
                'Retain salary accounts targeted by fintechs (SadaPay zero-fee transfers, NayaPay)',
                'Prevent balance attrition to NSS during high-rate environments (SBP policy rate 17.5%)',
                'Build stickiness through multi-product relationships (1.8 to 3.0+ products per customer)',
                'Value-based retention: invest PKR 10K-50K for top-tier, zero for mass dormant',
            ],
        },
    },
    7: {  # Customer Churn - Capability Detail
        'table_additions': {
            'Predict customers who are likely to churn': [
                'Predict salary account churn 30-60 days in advance via transaction pattern shifts',
                'Differentiate: full exit vs. balance migration vs. product downgrade vs. dormancy',
                'Model fintech churn (SadaPay, NayaPay, digital banks) separately from traditional switching',
                'Detect Pakistan-specific signals: salary redirect, NSS purchases, reduced RAAST usage',
            ],
        },
    },
    9: {  # Customer Re-engagement - Capability Detail
        'table_additions': {
            'Respond to early warning signs': [
                'Re-activate 15M+ dormant accounts across Pakistan banking industry (SBP regulatory pressure)',
                'Convert dormant Asaan Account holders to active digital banking users',
                'Re-engage diaspora RDA inactive accounts through targeted value propositions',
                'Prioritize by estimated lifetime value (invest selectively, not equally across all dormant)',
            ],
        },
    },
    11: {  # Customer Loyalty - Capability Detail
        'table_additions': {
            'Attract profitable members': [
                'Compete with fintech cashback and zero-fee propositions (SadaPay, NayaPay)',
                'Design Islamic-compliant loyalty (avoid interest-based reward structures; Hajj/Umrah rewards)',
                'Create tiered loyalty: Mass, Emerging, Priority, HNW with differentiated benefits',
                'Integrate loyalty across conventional and Islamic products within unified program',
            ],
        },
    },
    13: {  # Cross Sell/Up-Sell - Capability Detail
        'table_additions': {
            'Identify and execute': [
                'Increase products/customer from 1.8 to 3.0+ through data-driven cross-sell models',
                'Build pipeline: CASA > debit > credit > personal loan > auto > home > investment > insurance',
                'Cross-sell Islamic products to conventional customers and vice versa',
                'Leverage salary credit events for personal loan and credit card triggers within 48 hours',
                'Enable agent-assisted cross-sell at 500,000+ branchless banking points',
            ],
        },
    },
}

# Speaker notes for each slide
SPEAKER_NOTES = {
    1: """CUSTOMER ACQUISITION - Speaker Notes
GLOBAL: DBS, Revolut, Nubank achieve 80%+ digital acquisition. Cost 5-10x lower than branch.
REGIONAL:
- India: Aadhaar e-KYC + Jan Dhan Yojana = 500M+ accounts. 5-min digital onboarding.
- Saudi: STC Bank, D360 = 90%+ digital onboarding via NID.
- UAE: Liv., Mashreq Neo = 100% digital acquisition with Emirates ID.

PAKISTAN: Branch-heavy despite regulatory enablement:
1. NADRA e-KYC approved but <15% adoption across scheduled banks
2. SBP Asaan Account/Asaan Digital Account tiers underutilized
3. 500,000+ agent network — largest physical distribution for financial inclusion
4. SadaPay onboards in 3 min vs banks 30-60 min — massive experience gap
5. 5 digital bank licenses (Hugo, KT, Mashreq Digital, Raqami, EasyPay) intensify competition

FSDM Entities: PRSPCT, APLCTN, APLCTN_STS, ACQSTN_CHNL, ACQSTN_SRC, CNVRSN, ACQSTN_CST, PRTY_ONBRDNG""",

    2: """CUSTOMER ACQUISITION MATURITY - Speaker Notes
Current State: Developing — Summary acquisition data loaded weekly for some processes.
Desired State: Innovating — Detailed acquisition data with channel/progress/rejection analytics.

Pakistan Reality:
- Digital onboarding <15% vs. 65%+ globally
- Branch acquisition cost PKR 3K-5K vs. digital PKR 500-1K
- NADRA e-KYC API available but not widely integrated
- Key priority: NADRA e-KYC integration, agent acquisition analytics, cost-per-channel tracking

FSDM: PRSPCT, APLCTN, APLCTN_STS, ACQSTN_CHNL, ACQSTN_SRC""",

    3: """CUSTOMER ON-BOARDING - Speaker Notes
PAKISTAN ONBOARDING REALITY:
- 40% of new accounts never have a 2nd transaction
- 50%+ debit cards never activated at POS
- Only 30% download mobile app in month 1
- First 90 days are critical — 30% churn in year 1

Recommended Pakistan Journey:
Day 0: CNIC verification + account + instant debit card
Day 1: Welcome SMS + mobile app activation link
Day 3: First RAAST tutorial + PKR 100 cashback incentive
Day 7: Debit card POS activation reminder
Day 14: Bill payment auto-debit setup prompt
Day 30: Cross-sell assessment (salary? card? savings?)
Day 60: Profitability assessment + segment assignment
Day 90: Relationship review + loyalty enrollment

Target: 90-day activation from 60% to 85%; 70%+ mobile activation in month 1; 1-year churn from 30% to 15%

FSDM: ONBRDNG, ONBRDNG_STP, ONBRDNG_STS, ACTVTN, FRST_TXN, PRTY_EVNT, MLSTN""",

    4: """CUSTOMER ON-BOARDING MATURITY - Speaker Notes
Pakistan banks at Developing level. Need to move to Innovating:
- Real-time milestone tracking for all onboarding events
- Digital first: CNIC e-KYC, instant debit, same-day mobile activation
- Product activation monitoring (debit POS, mobile app, first IBFT/RAAST)

FSDM: ONBRDNG, ONBRDNG_STP, ONBRDNG_STS, ACTVTN""",

    5: """CUSTOMER RETENTION - Speaker Notes
PAKISTAN RETENTION CHALLENGES:
1. SALARY ACCOUNT WAR: Fintechs offer zero-fee IBFT/RAAST to lure salary credits away
2. NSS COMPETITION: High SBP policy rate drives deposits to tax-free government schemes
3. MULTI-BANKING: 1.5 bank relationships avg — easy to shift primary banking relationship
4. DORMANCY SPIRAL: Reduced activity triggers SBP dormancy rules, customer opens elsewhere
5. ISLAMIC SWITCHING: Customers moving to full Islamic banks for religious compliance

Key Churn Signals:
- Salary credit stops or drops >10%
- IBFT outflows to competitor bank accounts
- App login decline >50% in 30 days
- Auto-debit cancellations
- Branch visit after long digital-only period (often closing account)

Target: Churn 20-30% to 10-15%; save PKR 5-10B replacement costs; protect CASA book

FSDM: RTNTN, RTNTN_CMPGN, RTNTN_OFFR, ATTRTN, RTNTN_SCRD, CSTMR_RTNTN_RSK""",

    6: """CUSTOMER RETENTION MATURITY - Speaker Notes
Pakistan banks at Developing level for retention analytics.
Key gap: No predictive retention models, no real-time trigger-based retention.
Priority: Build churn prediction model, salary account protection program, value-based retention investment.

FSDM: RTNTN, RTNTN_CMPGN, RTNTN_OFFR, ATTRTN""",

    7: """CUSTOMER CHURN - Speaker Notes
PAKISTAN CHURN TYPES:
- SALARY REDIRECT: Moves salary to another bank, keeps ghost account open
- BALANCE MIGRATION: Deposits shift to NSS, prize bonds, competitor FDs
- PRODUCT CHURN: Closes credit card but keeps CASA (partial churn)
- DORMANCY: Zero transactions 12+ months — economically churned
- FULL EXIT: Account closure — least common but most visible

KEY DRIVERS IN PAKISTAN:
Employer-directed switching, fintech migration (young professionals 25-35), Islamic conversion demand, NSS rate advantage during high policy rate, poor branch experience (#1 SBP complaint), unexpected service charges (hidden fees)

PREDICTION VARIABLES:
Salary amount change (>10% decline), IBFT to competitor accounts (new beneficiary at top-5 bank), app login decline, ECIB inquiry from another bank, SBP complaint filed, branch visit after long digital-only period

Target: 75%+ accuracy on 30-day prediction; prioritize top 20% at-risk; reduce CASA loss PKR 20-50B

FSDM: CHRN, CHRN_PRBLTY, CHRN_MDL, CHRN_TYP, CHRN_RSN, CHRN_SCRD, ATTRTN_RSK""",

    8: """CUSTOMER CHURN MATURITY - Speaker Notes
Pakistan: Developing level. Most banks have no churn prediction model.
Priority: Build salary churn model, fintech churn model, balance migration detection.
Key data need: IBFT beneficiary analysis, salary credit pattern monitoring, ECIB inquiry alerts.

FSDM: CHRN, CHRN_PRBLTY, CHRN_MDL, CHRN_TYP""",

    9: """CUSTOMER RE-ENGAGEMENT - Speaker Notes
PAKISTAN DORMANCY LANDSCAPE:
- 15M+ dormant accounts across banking industry
- SBP Unclaimed Deposits Fund receives billions annually from dormant accounts
- Asaan Accounts opened for one-time govt payments (BISP/Ehsaas/Benazir) and never reused
- RDA accounts saw initial diaspora enthusiasm (2020-21) then significant dormancy

RE-ENGAGEMENT STRATEGIES:
1. SMS/WhatsApp with cashback incentive for first transaction
2. Reduced minimum balance or fee waiver for 6 months
3. Mobile re-activation via NADRA biometric verification
4. Agent-assisted rural re-activation at nearest branchless point
5. Salary account re-engagement via employer HR department partnerships
6. Islamic product conversion offer for customers citing religious reasons

Target: Re-activate 20-30% (~3-5M accounts); recover PKR 500B+ in dormant deposits; SBP compliance

FSDM: RENGMT, DRMNT_ACCT, DRMNT_CLSFCTN, REACTVTN, RENGMT_CMPGN""",

    10: """CUSTOMER RE-ENGAGEMENT MATURITY - Speaker Notes
Pakistan: Emerging level. Limited analytics on dormant accounts, mostly manual re-engagement.
Priority: Dormant account scoring (value estimation), automated re-engagement campaigns, NADRA re-verification for KYC refresh.

FSDM: RENGMT, DRMNT_ACCT, DRMNT_CLSFCTN, REACTVTN""",

    11: """CUSTOMER LOYALTY - Speaker Notes
PAKISTAN LOYALTY LANDSCAPE:
Current Programs: HBL Konnect (points), UBL Rewards (vouchers), MCB Rewards (credit card only). Low engagement <15%.

Challenges:
- Cash economy (85%+ retail transactions in cash) limits transaction-linked rewards
- Low card penetration (<5% credit card) reduces earning opportunities
- Islamic compliance needed for reward structures
- Generic rewards with low perceived value

Opportunities:
- RAAST-linked loyalty (earn on digital payments to drive adoption)
- Islamic rewards (Hajj/Umrah savings contribution, Zakat calculation, charitable giving)
- Experiential rewards (airport lounge, Pakistan cricket team events, concert access)
- Merchant partnerships (Foodpanda, Daraz, Careem, TCS delivery)
- Gamification (challenges, streaks, tier progression)

Target: Penetration from <15% to 40%+; retention +20-25% for loyalty members; drive POS and digital usage

FSDM: LYLTY, LYLTY_PRGM, LYLTY_TIER, RWRD, RWRD_PNT, RDMPTN, LYLTY_MBRSHP""",

    12: """CUSTOMER LOYALTY MATURITY - Speaker Notes
Pakistan: Emerging level. Basic points programs, no behavioral loyalty analytics.
Priority: Tiered loyalty design, Islamic loyalty structure, RAAST-linked earning, merchant partnerships.

FSDM: LYLTY, LYLTY_PRGM, LYLTY_TIER, RWRD""",

    13: """CROSS-SELL/UP-SELL - Speaker Notes
PAKISTAN CROSS-SELL PIPELINE:
1. CASA (60M accounts) > 2. Debit activation (50% don't activate) > 3. Credit card (salary holders 6+ months) > 4. Personal loan (salary verified, ECIB clean, 12+ months) > 5. Auto finance (PKR 50K+ salary) > 6. Home finance (PKR 100K+, Diminishing Musharaka for Islamic) > 7. Investment (mutual funds, govt securities) > 8. Insurance (life, health, Takaful) > 9. Business banking (detect self-employment -> SME products)

EVENT TRIGGERS:
Salary credit -> card pre-approval within 48hr
Balance accumulation -> FD/mutual fund recommendation
School fee payment -> education finance offer
Rent payment -> home finance pre-qualification
Remittance receipt -> diaspora product bundle
Car dealer POS transaction -> auto insurance offer
Business transaction patterns -> SME banking upgrade

ISLAMIC CROSS-SELL:
Conventional CASA -> Islamic savings; Auto loan -> Diminishing Musharaka; Credit card -> Islamic card; Insurance -> Takaful; Mutual funds -> Islamic funds. 85% of Pakistan wants Shariah-compliant products.

Current: <5% conversion on batch campaigns. Target: 15-20% with event-triggered, personalized offers. Incremental PKR 50-100B lending opportunity.

FSDM: XSL, UPSLL, NBO, PRDCT_RCMDTN, PRDCT_AFFNTY, PRDCT_HLDNG, OFFR, OFFR_RSPNS""",

    14: """CROSS-SELL/UP-SELL MATURITY - Speaker Notes
Pakistan: Developing level. Manual campaign lists, no propensity models, no event triggers.
Priority: Build product propensity models (salary->card, card->loan), implement event triggers, Islamic cross-sell pathways.

FSDM: XSL, UPSLL, NBO, PRDCT_RCMDTN, PRDCT_AFFNTY""",

    15: """CIM - WHY IMPORTANT - Speaker Notes
PAKISTAN CIM CONTEXT:
Channel fragmentation: 16K+ branches, 16K+ ATMs, mobile app, USSD, WhatsApp, 500K+ agents, call center, internet banking — 8+ touchpoints with no unified interaction layer.

Campaign maturity: Most Pakistan banks run monthly batch campaigns via SAS/Salesforce. <5% response rate. No real-time triggers. Manual list generation. Limited A/B testing.

Contact policy: SBP requires consent and opt-out; frequency capping not widely implemented; PTA regulations on SMS marketing volume caps.

Personalization: Most banks at segment-level (5-10 segments). No individual-level personalization. No real-time contextual offers. Islamic vs. conventional is the primary segmentation dimension.

Note: CIM capability detail slides are in File 05.

FSDM: MKTG_CMPGN, CMPGN_RSPNS, CNTCT_PLCY, OFFR, CHNL_INTN, NBA, PRSNLZTN, CNTXTL_DCSN, MKTG_ATRBTN""",

    16: """CIM CAPABILITIES 1/3 - Speaker Notes
Pakistan context for capabilities on this slide:
1. Communication Targeting: CNIC-based targeting; mobile-first for 60% under-30 demographics
2. Contact Optimization: SBP consent/opt-out mandates; PTA SMS frequency caps
3. Response Optimization: Improve current <5% campaign response rates through personalization
4. Cross Channel CX: Branch+ATM+mobile+USSD+WhatsApp+agent = 6+ channels needing unified CX

FSDM: MKTG_CMPGN, CMPGN_RSPNS, CNTCT_PLCY, CHNL_INTN""",

    17: """CIM CAPABILITIES 2/3 - Speaker Notes
Pakistan context for capabilities on this slide:
5. Contextual Decisioning: In-app offers triggered by RAAST/IBFT events in real time
6. Call Center Optimization: 80% complaints via call center — FCR (first-call-resolution) critical
7. Digital Optimization: Reduce 40-60% onboarding dropout on digital application flows
8. SEO: Urdu+English bilingual search optimization for banking product queries
9. Personalization: Move from segment-level (5-10 segments) to individual behavioral personalization
10. Next Best Action: Real-time NBA at branch teller screen, call center agent, mobile app

FSDM: NBA, PRSNLZTN, CNTXTL_DCSN, CHNL_OPTMZTN""",

    18: """CIM CAPABILITIES 3/3 - Speaker Notes
Pakistan context for capabilities on this slide:
11. Product Recommendations: ML models using transaction patterns and life events (salary, marriage, child)
12. Multi-Step Campaigns: Automated journeys for onboarding, cross-sell, retention, re-engagement
13. Marketing Effectiveness: Campaign ROI measurement across all channels with proper attribution
14. Brand Analytics: Brand perception vs. fintechs — measure NPS, app store ratings, social sentiment

Note: CIM capability detail slides with full 7-field use case format are in File 05.

FSDM: PRDCT_RCMDTN, MLTISTP_CMPGN, MKTG_ATRBTN, BRND_ANLYTCS""",
}


# CIM slides (15-18) enrichment
CIM_ENRICHMENTS = {
    15: {  # Why Important
        'shape_additions': {
            'Customers expect': [
                'Pakistan: Customers interact across 16K branches, 16K ATMs, mobile apps, USSD, WhatsApp, call centers, 500K+ agents',
                'Marketing automation needed to close cross-sell gap at scale (1.8 to 3.0+ products/customer)',
                'Speed-to-market: fintechs launch campaigns in days vs. banks weeks/months',
                '60% of Pakistan bank customers use 2+ channels — inconsistent experience drives churn',
            ],
        },
    },
}


def enrich_slide(slide_num, enrichment):
    """Apply enrichments to a slide."""
    filepath = os.path.join(SLIDES, f'slide{slide_num}.xml')
    tree = ET.parse(filepath)
    root = tree.getroot()

    changes = 0

    # Table cell additions
    if 'table_additions' in enrichment:
        for frag, lines in enrichment['table_additions'].items():
            tc = find_table_cell_containing(root, frag, NS)
            if tc is not None:
                if add_text_to_cell(tc, lines, NS):
                    changes += 1
                    print(f'  slide{slide_num}: Added {len(lines)} lines to table cell "{frag[:30]}..."')
                else:
                    print(f'  slide{slide_num}: WARNING - could not add to cell "{frag[:30]}..."')
            else:
                print(f'  slide{slide_num}: WARNING - cell not found: "{frag[:30]}..."')

    # Shape text additions
    if 'shape_additions' in enrichment:
        for frag, lines in enrichment['shape_additions'].items():
            if add_text_to_shape(root, frag, lines, NS):
                changes += 1
                print(f'  slide{slide_num}: Added {len(lines)} lines to shape "{frag[:30]}..."')
            else:
                print(f'  slide{slide_num}: WARNING - shape not found: "{frag[:30]}..."')

    if changes > 0:
        tree.write(filepath, xml_declaration=True, encoding='UTF-8')

    return changes


def main():
    print("=" * 60)
    print("Enriching 04_Customer_Lifecycle_Management.pptx")
    print("=" * 60)

    # Phase 1: Enrich capability detail slides (odd: 1,3,5,7,9,11,13)
    print("\n--- Phase 1: Capability Detail Enrichment ---")
    for slide_num, enrichment in sorted(ENRICHMENTS.items()):
        enrich_slide(slide_num, enrichment)

    # Phase 2: Enrich CIM overview slides
    print("\n--- Phase 2: CIM Overview Enrichment ---")
    for slide_num, enrichment in sorted(CIM_ENRICHMENTS.items()):
        enrich_slide(slide_num, enrichment)

    # Phase 3: Update Speaker Notes
    print("\n--- Phase 3: Speaker Notes ---")
    for slide_num, notes_text in sorted(SPEAKER_NOTES.items()):
        if update_notes(slide_num, notes_text):
            print(f'  slide{slide_num}: Notes updated')
        else:
            print(f'  slide{slide_num}: WARNING - Notes update failed')

    print("\n--- Phase 4: Maturity Table Date Updates ---")
    # Update any remaining date references in maturity slides
    for sn in [2, 4, 6, 8, 10, 12, 14]:
        fpath = os.path.join(SLIDES, f'slide{sn}.xml')
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        updated = False
        for old in ['2018', '2019', '2020']:
            if old in content and '2025' not in content.replace(old, ''):
                content = content.replace(old, '2025-2027')
                updated = True
        if updated:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'  slide{sn}: Updated year references')
        else:
            print(f'  slide{sn}: No date updates needed')

    print("\n" + "=" * 60)
    print("Enrichment complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
