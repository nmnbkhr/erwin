# PROMPT 6I: File 04 — Customer Lifecycle Management & Customer Interaction Management

## Role

You are a senior banking CRM & customer lifecycle consultant and presentation specialist. You are rebuilding BVF PowerPoint File 04, which covers Customer Lifecycle Management (CLM) capability details and Customer Interaction Management (CIM) overview. You have deep expertise in Pakistan's banking sector — acquisition economics, digital onboarding (CNIC/NADRA e-KYC), churn dynamics (fintech competition from SadaPay, NayaPay, JazzCash), loyalty programs (HBL Konnect, UBL Rewards), and cross-sell in a market averaging only 1.8 products per customer.

---

## Source File

```
INPUT:  ./04_Customer_Lifecycle_Management.pptx  (18 slides — ALL have full content)
OUTPUT: ./pptout/04_Customer_Lifecycle_Management_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 18 slides contain complete Teradata BVF content. NO placeholder or empty slides.

**Work required:**
1. Add Pakistan banking context to every capability and maturity slide
2. Add Global/Regional layering (South Asia, Middle East)
3. Update all statistics from "H1 2018" to 2024-2026
4. Update maturity assessments for Pakistan banking reality
5. Map FSDM entities to each capability
6. Fix content overflow in dense table cells
7. Move detailed content to speaker notes where needed
8. Add 3 new supplementary slides (Dashboard, Pakistan Context, Roadmap)
9. Remove/replace all Teradata branding

---

## Reference Data — Read Before Starting

```
./OVERVIEW.md                                       # Pipeline context, FSDM domains
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM entity mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json              # BACR maturity questions
```

---

## EXISTING SLIDE STRUCTURE (18 Slides)

### Section 1: Customer Lifecycle Management — Capability Details (Slides 1-14)

*Continues from File 03 slides 29-30 which had CLM section overview and capability listing.*

| Slide | Title | Type | Content |
|-------|-------|------|---------|
| 1 | Customer Acquisition | Capability Detail | Full — Objectives / Data & Solution / Outcome |
| 2 | Customer Acquisition | Maturity Table | Full — 5 levels, Current=Developing, Desired=Innovating |
| 3 | Customer On-Boarding and Development | Capability Detail | Full |
| 4 | Customer On-Boarding and Development | Maturity Table | Full — 5 levels |
| 5 | Customer Retention | Capability Detail | Full |
| 6 | Customer Retention | Maturity Table | Full — 5 levels |
| 7 | Customer Churn | Capability Detail | Full |
| 8 | Customer Churn | Maturity Table | Full — 5 levels |
| 9 | Customer Re-engagement | Capability Detail | Full |
| 10 | Customer Re-engagement | Maturity Table | Full — 5 levels |
| 11 | Customer Loyalty | Capability Detail | Full |
| 12 | Customer Loyalty | Maturity Table | Full — 5 levels |
| 13 | Cross Sell/Up-Sell | Capability Detail | Full |
| 14 | Cross Sell/Up-Sell | Maturity Table | Full — 5 levels |

### Section 2: Customer Interaction Management — Overview (Slides 15-18)

| Slide | Title | Type | Content |
|-------|-------|------|---------|
| 15 | Customer Interaction Management | Section Title + Why Important | Full — 4 importance bullets |
| 16 | CIM — How Capability Areas (1/3) | Capability List | Full — 7 capabilities |
| 17 | CIM — How Capability Areas (2/3) | Capability List | Full — 6 capabilities |
| 18 | CIM — How Capability Areas (3/3) | Capability List | Full — 2 capabilities |

> **Note:** CIM capability detail slides are in File 05. This file only has the CIM intro/overview.

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"Customer Lifecycle & Interaction Management — At a Glance"**

Three-column comparison:

| | 🌍 Global | 🌏 South Asia & ME | 🇵🇰 Pakistan |
|---|---|---|---|
| Digital onboarding rate | 65%+ of new accounts | 30-40% (urban) | <15% (mostly fintech-led) |
| Avg products/customer | 4-5 (mature banks) | 2.5-3.0 | 1.8 (massive cross-sell gap) |
| Annual churn rate | 10-15% | 15-25% | 20-30% (salary switching) |
| Dormant account rate | 10-15% | 20-30% | 25%+ (~15M dormant) |
| Loyalty penetration | 60-70% | 25-35% | <15% (basic programs) |
| NBA adoption | 45% of mature banks | <15% | <5% (manual campaigns) |
| Acquisition cost | $50-100 (digital) | $15-30 | PKR 3K-5K (branch) / PKR 500-1K (digital) |

Info bar:
```
BVF Sub-capabilities: 7 (CLM) + 14 (CIM) = 21 | FSDM Entities: ~180+
BACR Questions: ~110 | Maturity Focus: Developing → Innovating
```

### NEW Slide B: Pakistan Market Context (insert after Dashboard)

**"🇵🇰 Pakistan Banking — Customer Lifecycle Landscape"**

Key Challenges:
```
Products per Customer:     1.8 avg — benchmark is 4-5
Dormant Accounts:          15M+ across industry
Digital Onboarding:        <15% — NADRA e-KYC adoption growing
Branch Acquisition Cost:   PKR 3,000-5,000 per customer
Digital Acquisition Cost:  PKR 500-1,000 (5x cheaper)
Fintech Churn Threat:      SadaPay, NayaPay targeting salary accounts
Loyalty Programs:          Basic points-only, low engagement
Cross-Sell Conversion:     <5% on batch campaigns
```

Competitive Dynamics:
- Traditional: 33 scheduled banks, same 60M account base
- Digital: 5 new digital bank licenses (2022)
- Fintech: JazzCash (40M+), Easypaisa (30M+) — frictionless activation
- Islamic: 85% want Shariah-compliant — lifecycle opportunity

### NEW Slide C: Implementation Roadmap (second-to-last slide)

```
Phase 1 (0-6 months): Foundation
  • CNIC digital onboarding (NADRA biometric e-KYC)
  • Dormant re-activation program (15M+ target)
  • Basic churn scoring model
  • Salary account welcome journey (first 90 days)
  Investment: PKR 40-70M | Quick Win: 20% dormant re-activation

Phase 2 (6-18 months): Core Capabilities
  • Automated lifecycle campaign engine
  • Cross-sell propensity models (CASA → card → loan → investment)
  • Retention triggers (balance decline, competitor signals)
  • Loyalty upgrade (points + experiential + Islamic rewards)
  Investment: PKR 80-150M | Products/customer: 1.8 → 2.5

Phase 3 (18-36 months): Advanced Intelligence
  • Real-time Next Best Action across all channels
  • ML churn prediction (30-day advance warning)
  • Contextual decisioning (in-app, branch, call center)
  • Personalized pricing and offer optimization
  Investment: PKR 120-250M | 30% churn reduction, 3.0+ products/customer
```

---

## SLIDE-BY-SLIDE ENRICHMENT INSTRUCTIONS

### SLIDES 1-2: Customer Acquisition + Maturity

**Slide 1 — Enrich Business Objectives with Pakistan:**
- "Reduce acquisition cost from PKR 3K-5K (branch) to PKR 500-1K (digital) via CNIC e-KYC"
- "Target unbanked 70% of adults through agent banking and simplified accounts"
- "Compete with fintech onboarding (SadaPay: 3-min signup vs. banks: 30-60 min)"
- "Leverage employer partnerships for salary account acquisition (payroll pipeline)"

**Enrich Data & Solution:**
- "NADRA biometric verification API (CNIC + fingerprint + photo)"
- "SBP Asaan Account / Asaan Digital Account tiers"
- "Agent network data (500,000+ branchless agents)"
- "Digital marketing attribution (social, Google, in-app referrals)"

**Enrich Outcome:**
- "Achieve 50%+ digital onboarding (current <15%) by 2027"
- "Reduce time-to-account from 3-5 days to <10 minutes"
- "Acquire 2-3M new customers annually at 60% lower cost"

**Slide 2 — Maturity: Current=Developing, Desired=Innovating**
- Replace "H1 2018" → "H1 2025 — H2 2026"
- Key areas: "NADRA e-KYC, agent acquisition analytics, cost-per-channel tracking"

**Speaker Notes:**
```
GLOBAL: DBS, Revolut, Nubank achieve 80%+ digital acquisition. Cost 5-10x lower than branch.
REGIONAL:
- India: Aadhaar e-KYC + Jan Dhan Yojana = 500M+ accounts. 5-min digital onboarding.
- Saudi: STC Bank, D360 = 90%+ digital onboarding via NID.
- UAE: Liv., Mashreq Neo = 100% digital acquisition with Emirates ID.

PAKISTAN: Branch-heavy despite regulatory enablement:
1. NADRA e-KYC approved but <15% adoption
2. SBP Asaan Account/Asaan Digital Account tiers underutilized
3. 500,000+ agent network — largest physical distribution for inclusion
4. SadaPay onboards in 3 min vs banks 30-60 min
5. 5 digital bank licenses (Hugo, KT, Mashreq Digital, Raqami, EasyPay) intensify competition

FSDM: PRSPCT, APLCTN, APLCTN_STS, ACQSTN_CHNL, ACQSTN_SRC, CNVRSN, ACQSTN_CST, PRTY_ONBRDNG
```

---

### SLIDES 3-4: Customer On-Boarding + Maturity

**Slide 3 — Enrich:**
- "Execute CNIC + biometric auth within first-day onboarding"
- "Activate debit card, mobile banking, RAAST ID within 48 hours"
- "Drive first IBFT/RAAST transaction within first week"
- "Cross-sell debit → credit → personal loan within first 90 days"
- "Personalize for conventional vs. Islamic customers"

**Data additions:** NADRA status, app download/activation, first transaction, digital milestones

**Outcomes:** "90-day activation: 60% → 85%; 70%+ mobile activation in month 1; 1-year churn: 30% → 15%"

**Speaker Notes:**
```
PAKISTAN ONBOARDING: 40% of new accounts never have a 2nd transaction. 50%+ debit cards never activated at POS. Only 30% download mobile app in month 1.

Recommended journey:
Day 0: CNIC verification + account + instant debit
Day 1: Welcome SMS + mobile activation link
Day 3: First RAAST tutorial + PKR 100 cashback incentive
Day 7: Debit card POS activation reminder
Day 14: Bill payment auto-debit setup
Day 30: Cross-sell prompt (salary? card? savings?)
Day 60: Profitability assessment + segment assignment
Day 90: Relationship review + loyalty enrollment

FSDM: ONBRDNG, ONBRDNG_STP, ONBRDNG_STS, ACTVTN, FRST_TXN, PRTY_EVNT, MLSTN
```

---

### SLIDES 5-6: Customer Retention + Maturity

**Slide 5 — Enrich:**
- "Retain salary accounts targeted by fintechs (SadaPay zero-fee transfers)"
- "Prevent balance attrition to NSS during high-rate environments (SBP 17.5%)"
- "Build stickiness through multi-product (1.8 → 3.0+ products)"
- "Value-based retention: invest PKR 10K-50K for top-tier, zero for mass dormant"

**Data:** Salary credit patterns, competing bank IBFT outflows, RAAST new beneficiary patterns, app usage decline, NSS/prize bond purchases

**Outcomes:** "Churn 20-30% → 10-15%; save PKR 5-10B replacement costs; protect CASA book"

**Speaker Notes:**
```
PAKISTAN RETENTION:
1. SALARY ACCOUNT WAR: Fintechs offer zero-fee IBFT/RAAST to lure salary credits
2. NSS COMPETITION: High policy rate → deposits shift to tax-free government schemes
3. MULTI-BANKING: 1.5 bank relationships avg — easy to shift primary banking
4. DORMANCY SPIRAL: Reduced activity → SBP dormancy rules → customer opens account elsewhere
5. ISLAMIC SWITCHING: Customers moving to full Islamic banks for religious reasons

Key signals: salary credit stops/drops, IBFT to competitors, app login decline >50% in 30 days, auto-debit cancellations, branch visit after long digital-only period

FSDM: RTNTN, RTNTN_CMPGN, RTNTN_OFFR, ATTRTN, RTNTN_SCRD, CSTMR_RTNTN_RSK
```

---

### SLIDES 7-8: Customer Churn + Maturity

**Slide 7 — Enrich:**
- "Predict salary account churn 30-60 days in advance via transaction pattern shifts"
- "Differentiate: full exit vs. balance migration vs. product downgrade vs. dormancy"
- "Model fintech churn (SadaPay, NayaPay, digital banks) separately from traditional switching"
- "Detect Pakistan-specific signals: salary redirect, NSS purchases, reduced RAAST usage"

**Data:** Salary regularity, IBFT outflows, ECIB inquiries, mobile engagement, SBP complaints

**Outcomes:** "75%+ accuracy on 30-day prediction; prioritize top 20% at-risk; reduce CASA loss PKR 20-50B"

**Speaker Notes:**
```
PAKISTAN CHURN TYPES:
- SALARY REDIRECT: Moves salary to another bank, keeps ghost account
- BALANCE MIGRATION: Deposits → NSS, prize bonds, competitor FDs
- PRODUCT CHURN: Closes credit card but keeps CASA
- DORMANCY: Zero transactions 12+ months — economically churned
- FULL EXIT: Account closure — least common

DRIVERS: Employer-directed switching, fintech migration (young professionals), Islamic conversion, NSS rate advantage, poor branch experience (#1 SBP complaint), unexpected service charges

PREDICTION VARIABLES: Salary amount change (10%+ decline), IBFT to competitor accounts, app login decline, ECIB inquiry from another bank, SBP complaint filed, branch visit after digital-only period

FSDM: CHRN, CHRN_PRBLTY, CHRN_MDL, CHRN_TYP, CHRN_RSN, CHRN_SCRD, ATTRTN_RSK
```

---

### SLIDES 9-10: Customer Re-engagement + Maturity

**Slide 9 — Enrich:**
- "Re-activate 15M+ dormant accounts (SBP regulatory pressure)"
- "Convert dormant Asaan Account holders to active digital users"
- "Re-engage diaspora RDA inactive accounts"
- "Prioritize by estimated value (don't invest equally in all dormant)"

**Data:** Dormancy classification (6/12/24+ months), last transaction type, CNIC cross-check, historical peak balance

**Outcomes:** "Re-activate 20-30% (~3-5M accounts); recover PKR 500B+ dormant deposits; SBP compliance"

**Speaker Notes:**
```
PAKISTAN DORMANCY: ~15M dormant accounts. SBP Unclaimed Deposits Fund receives billions annually. Asaan Accounts opened for one-time govt payments (BISP/Ehsaas) and never reused. RDA accounts saw initial diaspora enthusiasm then dormancy.

Re-engagement: SMS/WhatsApp with cashback incentive, reduced minimum balance, mobile re-activation via NADRA, agent-assisted rural re-activation, salary account re-engagement via employer HR, Islamic product conversion offer.

FSDM: RENGMT, DRMNT_ACCT, DRMNT_CLSFCTN, REACTVTN, RENGMT_CMPGN
```

---

### SLIDES 11-12: Customer Loyalty + Maturity

**Slide 11 — Enrich:**
- "Compete with fintech cashback and zero-fee propositions"
- "Design Islamic-compliant loyalty (avoid interest-based reward structures)"
- "Create tiered loyalty: Mass, Emerging, Priority, HNW"
- "Integrate loyalty across conventional and Islamic products"

**Data:** HBL Konnect/UBL Rewards data, debit card POS transactions, RAAST/IBFT volumes, app engagement

**Outcomes:** "Penetration <15% → 40%+; retention +20-25% for members; drive POS usage"

**Speaker Notes:**
```
PAKISTAN LOYALTY:
Current: HBL Konnect (points), UBL Rewards (vouchers), MCB Rewards (credit card). Low engagement <15%.
Challenges: Cash economy (85%+ retail cash), low card penetration (<5% credit), Islamic compliance, generic rewards.
Opportunities: RAAST-linked loyalty, Islamic rewards (Hajj savings, charitable), experiential (airport lounge, cricket), merchant partnerships (Foodpanda, Daraz, Careem), gamification.

FSDM: LYLTY, LYLTY_PRGM, LYLTY_TIER, RWRD, RWRD_PNT, RDMPTN, LYLTY_MBRSHP
```

---

### SLIDES 13-14: Cross-Sell/Up-Sell + Maturity

**Slide 13 — Enrich:**
- "Increase products/customer from 1.8 to 3.0+ through data-driven cross-sell"
- "Build the pipeline: CASA → debit → credit → personal loan → auto → home → investment"
- "Cross-sell Islamic products to conventional customers and vice versa"
- "Leverage salary credit events for personal loan and credit card triggers"
- "Enable agent-assisted cross-sell at 500,000+ branchless points"

**Data:** Product holding matrix, salary credit, transaction patterns (rent→home, school→education loan), ECIB bureau, app browsing

**Outcomes:** "Conversion <5% → 15-20%; incremental PKR 50-100B lending; 80% lower cost vs. new acquisition"

**Speaker Notes:**
```
PAKISTAN CROSS-SELL PIPELINE:
1. CASA (60M accounts) → 2. Debit activation (50% don't activate) → 3. Credit card (salary holders 6+ months) → 4. Personal loan (salary verified, ECIB clean, 12+ months) → 5. Auto finance (PKR 50K+ salary) → 6. Home finance (PKR 100K+, Diminishing Musharaka for Islamic) → 7. Investment (mutual funds, govt securities) → 8. Insurance (life, health, Takaful) → 9. Business banking (detect self-employment → SME products)

EVENT TRIGGERS: Salary credit → card pre-approval 48hr; balance accumulation → FD/fund rec; school fee → education finance; rent payment → home finance; remittance → diaspora products; car dealer POS → auto insurance; business patterns → SME upgrade

ISLAMIC CROSS-SELL: Conventional CASA → Islamic savings; car loan → Diminishing Musharaka; credit card → Islamic card; insurance → Takaful; mutual funds → Islamic funds

FSDM: XSL, UPSLL, NBO, PRDCT_RCMDTN, PRDCT_AFFNTY, PRDCT_HLDNG, OFFR, OFFR_RSPNS
```

---

### SLIDES 15-18: Customer Interaction Management Overview

**Slide 15 — "Why Important" — Enrich:**
1. "Customers interact across 16K branches, 16K ATMs, mobile apps, USSD, WhatsApp, call centers, 500K+ agents"
2. "Marketing automation needed to close cross-sell gap at scale (1.8 → 3.0+ products)"
3. "Speed-to-market: fintechs launch campaigns in days vs. banks' weeks/months"
4. "60% of customers use 2+ channels — inconsistent experience drives churn"

**Slides 16-18 — Add Pakistan context line under each of 14 capabilities:**

1. **Communication Targeting** → "CNIC-based targeting; mobile-first for 60% under-30"
2. **Contact Optimization** → "SBP opt-out mandates; frequency caps"
3. **Response Optimization** → "Improve <5% campaign response rates"
4. **Cross Channel CX** → "Branch+ATM+mobile+USSD+WhatsApp+agent = 6 channels"
5. **Contextual Decisioning** → "In-app offers triggered by RAAST/IBFT events"
6. **Call Center Optimization** → "80% complaints via call center — FCR critical"
7. **Digital Optimization** → "Reduce 40-60% onboarding dropout"
8. **SEO** → "Urdu+English bilingual search optimization"
9. **Personalization** → "Segment → behavior → individual personalization"
10. **Next Best Action** → "Real-time NBA at branch, call center, mobile"
11. **Product Recommendations** → "ML from transaction patterns and life events"
12. **Multi-Step Campaigns** → "Automated: onboarding, cross-sell, retention, re-engagement"
13. **Marketing Effectiveness** → "Campaign ROI across all channels with attribution"
14. **Brand Analytics** → "Brand perception vs. fintechs (NPS, app store, social)"

**Speaker Notes for Slides 15-18:**
```
PAKISTAN CIM CONTEXT:
Channel fragmentation: 6+ touchpoints with no unified interaction layer (branch 16K+, ATM 16K+, mobile app, USSD, WhatsApp, agent 500K+, call center, internet banking).

Campaign maturity: Most PK banks run monthly batch campaigns via SAS/Salesforce. <5% response rate. No real-time triggers. Manual list generation. Limited A/B testing.

Contact policy: SBP requires consent; opt-out mandatory; frequency capping not widely implemented; PTA regulations on SMS marketing.

Personalization: Most banks at segment-level (5-10 segments). No individual-level. No real-time contextual offers. Islamic vs. conventional is primary dimension.

Note: CIM capability detail slides are in File 05.

FSDM: MKTG_CMPGN, CMPGN_RSPNS, CNTCT_PLCY, OFFR, CHNL_INTN, NBA, PRSNLZTN, CNTXTL_DCSN, MKTG_ATRBTN
```

---

## CONTENT DENSITY RULES

| Container | Max Content | Font Size |
|---|---|---|
| Table cell (Objectives) | 6 bullets, 15 words each | 10-11pt |
| Table cell (Data) | 6 bullets, 12 words each | 10-11pt |
| Table cell (Outcome) | 6 bullets, 15 words each | 10-11pt |
| Maturity level cell | 3 sentences, 15 words each | 10-11pt |
| Body text box | 5 bullets, 15 words each | 13-14pt |

Condense ON SLIDE. Move detail to SPEAKER NOTES with Global/Regional/Pakistan/FSDM.

---

## TERADATA BRANDING REMOVAL

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" (standalone) | "Enterprise Analytics Platform" |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |
| Teradata logo | Theme logo |
| "H1 2018" | "H1 2025 — H2 2026" |
| "For use in Maturity Assessment..." | REMOVE |
| "Photos can be any photo..." | REMOVE |

KEEP: FSDM entity references, BVF capability names, maturity framework.

---

## FINAL OUTPUT SLIDE STRUCTURE (21+ slides)

| # | Slide | Status |
|---|-------|--------|
| **1** | **CLM & CIM — At a Glance** | **NEW** |
| **2** | **🇵🇰 Pakistan Lifecycle Landscape** | **NEW** |
| 3 | Customer Acquisition | Enriched |
| 4 | Customer Acquisition — Maturity | Updated |
| 5 | Customer On-Boarding | Enriched |
| 6 | Customer On-Boarding — Maturity | Updated |
| 7 | Customer Retention | Enriched |
| 8 | Customer Retention — Maturity | Updated |
| 9 | Customer Churn | Enriched |
| 10 | Customer Churn — Maturity | Updated |
| 11 | Customer Re-engagement | Enriched |
| 12 | Customer Re-engagement — Maturity | Updated |
| 13 | Customer Loyalty | Enriched |
| 14 | Customer Loyalty — Maturity | Updated |
| 15 | Cross Sell/Up-Sell | Enriched |
| 16 | Cross Sell/Up-Sell — Maturity | Updated |
| 17 | CIM — Why Important | Enriched |
| 18 | CIM Capabilities (1/3) | Pakistan context |
| 19 | CIM Capabilities (2/3) | Pakistan context |
| 20 | CIM Capabilities (3/3) | Pakistan context |
| **21** | **Implementation Roadmap** | **NEW** |
| 22 | Thank You / Next Steps | Updated |

---

## VISUAL QA

```bash
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide
```

```
□ No text overflow in ANY table cell
□ Min 0.06" cell padding, font ≥ 10pt
□ No Teradata branding (logo, orange, text, "H1 2018")
□ Pakistan context on EVERY capability slide
□ Speaker notes: Global/Regional/Pakistan/FSDM
□ 3 new slides present
□ Updated maturity Current/Desired
□ No placeholder text remnants
□ Footer, page numbers, theme colors consistent
```
