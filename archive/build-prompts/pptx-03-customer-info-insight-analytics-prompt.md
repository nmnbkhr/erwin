# PROMPT 6H: File 03 — Customer Information & Insight Analytics

## Role

You are a senior banking analytics consultant and presentation specialist. You are rebuilding BVF PowerPoint File 03, which covers Customer Information Management, Insight-Driven Customer Analytics, and Customer Lifecycle Management capabilities. You have deep expertise in Pakistan's banking sector (SBP, CNIC/NADRA, RAAST, JazzCash/Easypaisa, Islamic banking), FSDM data modeling, and customer analytics maturity frameworks.

---

## Source File

```
INPUT:  ./03_Customer_Information_Insight_Analytics.pptx  (30 slides — ALL have full content)
OUTPUT: ./pptout/03_Customer_Information_Insight_Analytics_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 30 slides contain complete Teradata BVF content. NO slides have "Point 1" or empty placeholders.

**Work required:**
1. Add Pakistan banking context to every capability slide
2. Add Global/Regional layering (South Asia, Middle East comparisons)
3. Update all statistics from "H1 2018" to 2024-2026
4. Update maturity assessments to reflect Pakistan banking reality
5. Map FSDM entities to each capability
6. Fix content overflow in dense table slides
7. Move detailed content to speaker notes where needed
8. Add 3 new supplementary slides (Dashboard, Pakistan Context, Roadmap)
9. Remove/replace all Teradata branding

---

## Reference Data — Read Before Starting

```
./OVERVIEW.md                                       # Pipeline context, FSDM domains, BVF structure
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping (party_management domain)
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM entity mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json              # BACR maturity assessment questions
```

---

## EXISTING SLIDE STRUCTURE (30 Slides)

### Section 1: Customer Information Management (Slides 1-5)

| Slide | Title | Type | Content Status |
|-------|-------|------|---------------|
| 1 | Customer Information Management | Section Overview | Full — 2 capability descriptions |
| 2 | Single View of Customer | Capability Detail | Full — Objectives / Data & Solution / Outcome table |
| 3 | Single View of Customer | Maturity Table | Full — 5 levels, Current=Developing, Desired=Innovating |
| 4 | Multi-Dimensional Customer View | Capability Detail | Full — Objectives / Data & Solution / Outcome table |
| 5 | Multi-Dimensional Customer View | Maturity Table | Full — 5 levels, Current=Developing, Desired=Innovating |

### Section 2: Insight-Driven Customer Management (Slides 6-28)

| Slide | Title | Type | Content Status |
|-------|-------|------|---------------|
| 6 | Insight Driven Customer Management | Section Title + Why Important | Full — 5 importance bullets |
| 7 | Insight Driven Customer Management | How — Capability Areas (1/2) | Full — 6 capabilities listed |
| 8 | Insight Driven Customer Management | How — Capability Areas (2/2) | Full — 4 capabilities listed |
| 9 | Customer Value & Profitability | Capability Detail | Full — heavy table |
| 10 | Customer Value & Profitability | Maturity Table | Full — 5 levels |
| 11 | Customer Satisfaction Indexing | Capability Detail | Full — heavy table |
| 12 | Customer Satisfaction Indexing | Maturity Table | Full — 5 levels |
| 13 | Customer Experience Analytics | Capability Detail | Full — heavy table |
| 14 | Customer Experience Analytics | Maturity Table | Full — 5 levels |
| 15 | Transaction Classification | Capability Detail | Full — heavy table |
| 16 | Transaction Classification | Maturity Table | Full — 5 levels |
| 17 | Customer Journey Analysis | Capability Detail | Full — heavy table |
| 18 | Customer Journey Analysis | Maturity Table | Full — 5 levels |
| 19 | Event Analytics | Capability Detail | Full — heavy table |
| 20 | Event Analytics | Maturity Table | Full — 5 levels |
| 21 | Customer Segmentation | Capability Detail | Full — heavy table |
| 22 | Customer Segmentation | Maturity Table | Full — 5 levels |
| 23 | Customer Connection Analytics | Capability Detail | Full — heavy table |
| 24 | Customer Connection Analytics | Maturity Table | Full — 5 levels |
| 25 | Behavioral/Preference Analytics | Capability Detail | Full — heavy table |
| 26 | Behavioral/Preference Analytics | Maturity Table | Full — 5 levels |
| 27 | Customer Life Stage | Capability Detail | Full — heavy table |
| 28 | Customer Life Stage | Maturity Table | Full — 5 levels |

### Section 3: Customer Lifecycle Management (Slides 29-30)

| Slide | Title | Type | Content Status |
|-------|-------|------|---------------|
| 29 | Customer Lifecycle Management | Section Title + Why Important | Full — 5 importance bullets |
| 30 | Customer Lifecycle Management | How — Capability Areas | Full — 7 capabilities listed |

> **Note:** CLM capability detail slides (Acquisition, On-Boarding, Retention, Churn, Re-engagement, Loyalty, Cross-Sell) are in File 04. This file only has the CLM intro/overview.

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 2, after title)

**"Customer Information & Insight Analytics — At a Glance"**

Three-column comparison:

| | 🌍 Global | 🌏 South Asia & ME | 🇵🇰 Pakistan |
|---|---|---|---|
| Single Customer View adoption | 78% of G-SIBs | 45% of top-20 banks | <25% (fragmented core systems) |
| 360° Customer analytics | $12B market by 2026 | Fastest-growing region | Nascent — <10 banks active |
| Customer data integration | 85% cloud-based | 35% cloud, 65% on-prem | 90% on-prem, batch-based |
| Real-time event detection | 60% of mature banks | 20% of digital-first banks | <5% (JazzCash, SadaPay only) |
| Average data latency | Minutes | Hours-to-Days | Days-to-Weeks |

Info bar:
```
BVF Sub-capabilities: 12 | FSDM Entities: ~200+ (Party, Event, Channel domains)
BACR Questions: ~95 | Maturity Focus: Developing → Innovating
```

### NEW Slide B: Pakistan Market Context (insert before Section 2 — slide 6 area)

**"🇵🇰 Pakistan Banking — Customer Analytics Landscape"**

Key Statistics:
```
Bank Accounts:      60M+ (but 30% financial inclusion)
Mobile Wallets:     100M+ (JazzCash 40M+, Easypaisa 30M+)
CNIC Penetration:   98% adult coverage (unique national ID)
Avg Products/Cust:  1.8 (global benchmark: 4-5)
Digital Adoption:   40% YoY growth
Youth Population:   60% under 30
RAAST Transactions: PKR 1.5T+ monthly
Core Systems/Bank:  4-5 average (major integration challenge)
```

Regulators & Regs:
- SBP: Digital banking framework, branchless banking regs, e-KYC via CNIC/NADRA biometrics
- SECP: Customer data protection, mutual fund distribution
- PTA: Mobile financial services oversight

Competitive Landscape:
- Traditional: 33 scheduled banks (Big 5: HBL, UBL, MCB, ABL, NBP)
- Islamic: 5 full Islamic banks + 17 with Islamic windows
- Digital: 5 digital bank licenses (2022), JazzCash, SadaPay, NayaPay, Easypaisa
- Fintech: 60+ licensed EMIs and PSOs

### NEW Slide C: Implementation Roadmap (insert as slide 34, second-to-last)

**"Customer Analytics — Implementation Roadmap"**

```
Phase 1: Foundation (0-6 months)
  • Consolidate customer master from 4-5 core systems
  • CNIC-based customer deduplication (NADRA verification)
  • Basic customer segmentation (value, product, demographic)
  Investment: PKR 50-80M | Quick Win: Single customer ID

Phase 2: Core Analytics (6-18 months)
  • Customer 360° view (transactions + digital + branch)
  • Profitability model (activity-based costing per customer)
  • Journey analytics across branch/ATM/mobile/internet
  • Transaction classification engine
  Investment: PKR 100-200M | Expected: 15-20% cross-sell uplift

Phase 3: Advanced Intelligence (18-36 months)
  • Real-time event detection (RAAST, IBFT, POS patterns)
  • ML-based churn prediction and NBO (Next Best Offer)
  • Connection analytics (household, business networks via CNIC linkage)
  • Behavioral scoring and life-stage inference
  Investment: PKR 150-300M | Expected: 2-3x customer lifetime value growth
```

---

## SLIDE-BY-SLIDE ENRICHMENT INSTRUCTIONS

### SLIDE 1: Customer Information Management — Section Overview

**Current:** Generic Teradata intro with 2 capability descriptions.

**Enrich with:**
- Pakistan context: "Pakistan's 33 banks operate 4-5 core systems each, creating fragmented customer views. CNIC (Computerized National Identity Card) provides a unique national identifier enabling true single-customer-view — an advantage over markets without universal ID."
- Regional comparison: "India's Aadhaar and Pakistan's CNIC enable identity-linked analytics unavailable in many Western markets."

**Speaker Notes:**
```
GLOBAL: Customer information management is the foundation of every data-driven banking strategy. Gartner estimates 78% of global systemically important banks have implemented some form of single customer view. The global customer analytics market reached $10.5B in 2024 (MarketsandMarkets).

REGIONAL: In South Asia and the Middle East, national ID systems (India's Aadhaar, Pakistan's CNIC, UAE's Emirates ID, Saudi's NID) provide unique identifiers that simplify customer matching. However, most banks in the region still operate multiple core banking platforms creating siloed customer data. The typical South Asian bank has 3-7 core systems with inconsistent customer identifiers.

PAKISTAN: Pakistan's 33 scheduled banks operate an average of 4-5 core banking systems each (CTL, Temenos, Oracle, Finacle, Symbols, etc.). Customer data is fragmented across credit cards, deposits, lending, trade finance, and treasury systems. The CNIC (13-digit unique national ID with 98% adult coverage) provides an extraordinary opportunity for customer deduplication — but fewer than 25% of banks have implemented CNIC-based single customer view across all product lines.

Key Pakistan challenges:
- 4-5 core banking systems per bank with inconsistent customer keys
- Historical batch processes (daily/weekly) creating stale customer views
- Branchless banking data (JazzCash, Easypaisa) not integrated with bank EDW
- NADRA biometric verification used for e-KYC but not for ongoing analytics
- Islamic banking subsidiaries often operate separate core systems
- Average 1.8 products per customer vs. 4-5 in mature markets

FSDM Entities: INDVDL (Individual), ORGN (Organization), PRTY (Party), IP_RLTNP (Inter-Party Relationship), PRTY_IDNTFR (Party Identifier — maps to CNIC), PRTY_ADDR (Party Address), PRTY_CNTCT (Party Contact)
```

---

### SLIDES 2-3: Single View of Customer + Maturity

**Slide 2 — Capability Detail Table**

**Enrich Business Objectives with Pakistan context:**
- Add: "Leverage CNIC as universal customer key across all product lines and channels"
- Add: "Integrate branchless banking/mobile wallet identity with conventional banking records"
- Add: "Enable SBP-mandated CDD (Customer Due Diligence) through unified customer view"

**Enrich Data & Solution with Pakistan specifics:**
- Add under Data: "CNIC (13-digit), NADRA biometric verification, mobile number linkage, RAAST ID"
- Add under Analytics: "CNIC-based deduplication across core banking, cards, lending, Islamic banking systems"
- Add: "Integration with 1Link switch data for ATM/POS/IBFT transaction identity"

**Enrich Outcome with Pakistan banking value:**
- Add: "Reduce duplicate customer records (typical Pakistan bank has 20-30% duplication)"
- Add: "Enable SBP regulatory reporting with consistent customer counts"
- Add: "Unified view across conventional and Islamic product holdings"

**Slide 3 — Maturity Table Updates:**

Update Current/Desired maturity for Pakistan banking reality:

| Level | Pakistan Assessment |
|-------|-------------------|
| Leading | CNIC-based universal customer ID across all systems, real-time, digital+branch. <5% of PK banks |
| Innovating | Enterprise customer master with CNIC, NADRA integration, near-real-time. ~10% of PK banks |
| Practicing | CNIC-based matching across major systems but batch-only, some gaps. ~20% of PK banks |
| Developing ✓ (Current) | Customer IDs exist per system but no enterprise master. CNIC captured but not used for cross-match. ~40% of PK banks |
| Emerging | No integrated view. Each product system maintains own customer records. ~30% of PK banks |

**Priority Section Updates:**
- Replace "H1 2018" → "H1 2025 — H2 2026"
- Key areas: "CNIC-based customer deduplication across 4-5 core systems; NADRA biometric integration for e-KYC; Branchless banking identity linkage; Islamic subsidiary customer integration"

**Speaker Notes for Slide 3:**
```
GLOBAL: Mature banks (JP Morgan, HSBC, DBS) achieved single customer view 10+ years ago using MDM platforms (Informatica, IBM InfoSphere). Current frontier is real-time identity resolution across digital channels including social media and non-authenticated sessions.

REGIONAL:
- India: Aadhaar-linked customer view adopted by most top-20 banks. IndiaStack enables consent-based data sharing. Account Aggregator framework connects financial data.
- Saudi Arabia: NID-based KYC centralized through SAMA's "Absher" platform. Banks mandated to use NID for all customer onboarding.
- UAE: Emirates ID + Al Etihad Credit Bureau provides unified view. CBUAE pushing for consolidated customer data across licensed entities.

PAKISTAN: Most banks are at Developing level — CNIC is captured in each system but enterprise-level deduplication is rare. Key blockers:
1. Multiple core banking systems (CTL, Temenos, Oracle, Finacle) with incompatible customer keys
2. Batch-only data integration (ETL runs nightly/weekly)
3. Islamic banking subsidiaries/windows operate separate cores
4. Branchless banking (JazzCash/Easypaisa) data sits outside bank EDW
5. Historical data quality — millions of records with incorrect/incomplete CNIC

Priority implementation:
- Phase 1: CNIC-based customer master integrating top 3 core systems
- Phase 2: Extend to Islamic banking, cards, trade finance
- Phase 3: Real-time integration with RAAST, branchless banking, digital channels

FSDM: INDVDL, ORGN, PRTY, PRTY_IDNTFR (maps CNIC, passport, NTN), IP_RLTNP (household/business relationships), PRTY_ADDR, PRTY_CNTCT, PRTY_PREF, PRTY_ACCT_RLTNP (party-account linkage across products)
```

---

### SLIDES 4-5: Multi-Dimensional Customer View + Maturity

**Slide 4 — Enrich with Pakistan context:**

**Business Objectives — add:**
- "Build customer 360 incorporating branch visits, ATM, mobile banking, IBFT/RAAST, POS, and internet banking interactions"
- "Integrate mobile wallet transaction data (JazzCash, Easypaisa) for thin-file customers"
- "Capture customer events across digital channels (app usage, USSD sessions, QR payments)"

**Data & Solution — add under Data:**
- "RAAST instant payment events, IBFT transfers, 1Link ATM/POS transactions"
- "Mobile banking app events (login, bill payment, fund transfer, biometric auth)"
- "SBP credit bureau (ECIB) inquiry and account data"
- "Utility payment data (K-Electric, SSGC, PTCL — via bill payment integrations)"

**Data & Solution — add under Analytics:**
- "CNIC-based household mapping to build family relationship networks"
- "Mobile wallet + bank account transaction correlation for holistic spending view"
- "Salary vs. expense pattern analytics using transaction classification"

**Outcome — add:**
- "Achieve true 360° view for 60M+ bank account holders by linking with 100M+ mobile wallet users"
- "Enable cross-sell from conventional to Islamic products and vice versa"
- "Identify salary accounts → lending → investment lifecycle opportunities"

**Slide 5 — Maturity Updates:**

Pakistan reality: Most banks are at Developing — core product/transaction data loaded daily, but clickstream, mobile app events, and interaction data remain siloed.

**Speaker Notes for Slide 5:**
```
GLOBAL: Leading banks (DBS, Citi, ING) have real-time multi-dimensional customer views incorporating social media sentiment, device fingerprinting, geolocation, and IoT data. Customer data platforms (CDPs) like Segment, Tealium, and Adobe CDP are now standard.

REGIONAL:
- India: UPI (Unified Payment Interface) provides massive transaction data for customer views. PhonePe, Google Pay, Paytm wallet data being integrated by progressive banks.
- Saudi: SAMA's Open Banking framework (launched 2023) enables third-party data enrichment. Banks building 360° views using STC Pay, Apple Pay transaction data.
- UAE: Strong digital adoption (95%+) means rich clickstream data. Emirates NBD's "Liv." and Mashreq's "Neo" digital brands generate comprehensive behavioral data.

PAKISTAN: Rich transaction data opportunity but poor integration:
- RAAST (instant payments) generates 50M+ monthly transactions — underutilized for analytics
- IBFT/1Link switching data provides cross-bank transaction visibility
- Mobile banking adoption growing 40% YoY — app event data not captured in EDW
- Branchless banking (JazzCash 40M+, Easypaisa 30M+ users) is the largest untapped data source
- Most banks still load transaction data in nightly batch — no intraday analytics

Key opportunity: Pakistan's CNIC + mobile number can serve as a universal customer key linking bank accounts, mobile wallets, utility bills, and government payments into a single 360° view — technically feasible but operationally unimplemented.

FSDM: EVNT (Event), EVNT_TYP (Event Type), INTN (Interaction), CHNL (Channel), TXN (Transaction), ACCT_TXN (Account Transaction), CSTMR_INTN (Customer Interaction), PRTY_EVNT (Party Event), DGTL_INTN (Digital Interaction)
```

---

### SLIDES 6-8: Insight Driven Customer Management — Section Overview

**Slide 6 — "Why is it important" — Enrich bullets with Pakistan context:**

Replace generic bullets with Pakistan-relevant versions:
1. "Creates competitive advantage through unique customer insights — critical as Pakistan's 33 banks compete for the same 60M account holders with average 1.8 products per customer"
2. "Enables personalization for 60% under-30 population who expect digital-first, relevant experiences"
3. "Provides insights to improve both customer interactions and compliance — SBP requires customer understanding for risk-based KYC and AML/CFT"
4. "Analyzes customer behaviors across branch (16,000+), ATM (16,000+), mobile app, and digital channels"
5. "Improves customer experience to compete with fintech challengers (SadaPay, NayaPay) who have 10x better NPS scores"

**Slides 7-8 — Capability Areas — Add Pakistan context to each capability name:**

No major changes needed to capability listing — these are capability names. Add a brief Pakistan context line under each:
- Customer Value & Profitability → "Activity-based costing across multi-system environment"
- Customer Satisfaction Indexing → "NPS/CSAT critical as fintechs raise the bar"
- Customer Experience Analytics → "Branch + digital CX measurement"
- Transaction Classification → "RAAST/IBFT/POS/ATM transaction categorization"
- Customer Journey Analysis → "Branch-to-digital migration tracking"
- Event Analytics → "Real-time event detection for RAAST/mobile triggers"
- Customer Segmentation → "Value-based + Islamic/conventional + urban/rural"
- Customer Connection Analytics → "CNIC-based household and business networks"
- Behavioral/Preference Analytics → "Channel preference, spending behavior, Islamic preference"
- Customer Life Stage → "Youth bulge (60% under 30) creates unique life-stage patterns"

**Speaker Notes for Slides 6-8:**
```
PAKISTAN CONTEXT: Pakistan's customer analytics landscape is at an inflection point. With 100M+ mobile wallet users, 60M+ bank accounts, and only 1.8 products per customer, the opportunity for insight-driven customer management is enormous but largely untapped.

Key Pakistan dynamics driving the need for customer insights:
1. LOW PRODUCTS/CUSTOMER: 1.8 average vs. 4-5 in mature markets — massive cross-sell opportunity
2. YOUTH BULGE: 60% under 30 with smartphone-first behavior
3. FINANCIAL INCLUSION GAP: 30% inclusion — 70% unbanked population represents addressable market
4. DIGITAL ACCELERATION: 40% YoY growth in digital banking
5. ISLAMIC DEMAND: 85% want Shariah-compliant products but only 20% market share
6. FINTECH COMPETITION: JazzCash, SadaPay, NayaPay offering superior UX with thin profit margins
7. REGULATORY PUSH: SBP's Digital Banking Framework mandates data-driven risk assessment

Ten capabilities in this section map directly to FSDM domains:
- Party Management (INDVDL, ORGN, PRTY — customer master)
- Event & Interaction (EVNT, INTN, CHNL — journey and interaction data)
- Transaction (TXN, ACCT_TXN — financial transactions)
- Product (PRDCT, PRDCT_FMLY — product holdings)
- Marketing (MKTG_CMPGN, OFFR — campaign and offer management)
- Channel (CHNL, CHNL_INTN — multi-channel interactions)
```

---

### SLIDES 9-10: Customer Value & Profitability + Maturity

**Slide 9 — Enrich with Pakistan context:**

**Business Objectives — add:**
- "Calculate customer-level profitability across conventional AND Islamic product lines"
- "Enable relationship-based pricing to compete with fintech flat-fee models"
- "Support SBP's risk-based capital allocation by linking profitability to risk-adjusted returns"
- "Drill into branch-level profitability across 16,000+ branches"

**Data — add:**
- "PKR-denominated transaction data across RAAST, IBFT, POS, ATM, branch"
- "Activity-based costing data from 4-5 core systems with different cost structures"
- "Islamic banking profit-sharing data (Mudaraba, Musharaka returns)"
- "CASA vs. fixed deposit cost of funds"

**Outcome — add:**
- "Identify profitable vs. unprofitable customer segments across Pakistan's highly CASA-dependent banking model (47% CASA share)"
- "Optimize branch network (16,000+) based on customer profitability"
- "Develop tiered service models for mass market (PKR <500K) vs. affluent (PKR 5M+) vs. HNW (PKR 50M+)"

**Slide 10 — Maturity Assessment Update:**

Pakistan reality: Most banks at Developing/Emerging — profitability calculated at product level using averages, not activity-based costing at customer level.

Key areas for improvement:
- "Activity-based costing engine across multi-system environment"
- "Customer-level P&L incorporating Islamic product profit-sharing"
- "Integration of digital channel costs (mobile banking, internet banking, RAAST)"
- Timeline: "H1 2025 — H2 2026"

**Speaker Notes:**
```
PAKISTAN PROFITABILITY CONTEXT:
Pakistan banks face unique profitability challenges:
1. CASA DEPENDENCY: 47% of deposits in current/savings accounts — zero/low-cost funding but volatile
2. SPREAD COMPRESSION: SBP policy rate at 17.5% creates high KIBOR but fierce competition for quality assets
3. NPL BURDEN: ~7.5% industry NPL ratio erodes customer-level profitability
4. BRANCH COST: 16,000+ branches with high fixed costs — branch profitability varies 10x
5. ISLAMIC COMPLEXITY: Islamic product profit-sharing (Mudaraba, Musharaka, Diminishing Musharaka) requires different profitability calculation methodology
6. DIGITAL DISRUPTION: Digital transactions growing 40% YoY but banks haven't re-allocated cost-to-serve

UBL Context: UBL's Customer Profitability Engine (built on FSDM star schema) calculates profitability at customer, product, channel, and branch levels using FACT_CUSTOMER_PROFITABILITY with 35+ measures. Dimensions include DIM_CUSTOMER (SCD Type 2), DIM_PRODUCT, DIM_CHANNEL, DIM_BRANCH, DIM_TIME.

FSDM: CSTMR_PRFTBLTY (Customer Profitability), ACTVTY_BSS_CST (Activity Based Cost), PRDCT_PRFTBLTY (Product Profitability), CHNL_CST (Channel Cost), RVNU (Revenue), EXPNS (Expense), FND_TRFR_PRC (Funds Transfer Pricing)
```

---

### SLIDES 11-12: Customer Satisfaction Indexing + Maturity

**Slide 11 — Enrich with Pakistan context:**

**Business Objectives — add:**
- "Measure NPS and CSAT across branch, ATM, mobile app, call center, and digital channels"
- "Benchmark against fintech NPS scores (SadaPay ~70 NPS vs. traditional banks ~20-30)"
- "Incorporate SBP Consumer Protection complaints data as satisfaction signal"
- "Develop Islamic banking-specific satisfaction metrics (Shariah compliance perception)"

**Data — add:**
- "SBP Consumer Protection complaint records"
- "App store ratings and reviews (Google Play, Apple App Store)"
- "Social media sentiment (Twitter/X, Facebook, Pakistan-specific forums)"
- "Branch queue wait times and service completion data"

**Outcome — add:**
- "Close the NPS gap between traditional banks (20-30) and fintechs (60-70)"
- "Reduce customer complaints to SBP (compliance benefit)"
- "Identify branch-level vs. digital-channel satisfaction drivers"

**Slide 12 — Maturity: Current=Developing (survey-based), Desired=Innovating (cross-channel)**

Timeline: "H2 2025 — H1 2026"

**Speaker Notes:**
```
PAKISTAN: Customer satisfaction measurement is primarily survey-based at most Pakistan banks. Very few banks integrate cross-channel interaction data. The emergence of fintechs (SadaPay NPS ~70) has highlighted the satisfaction gap. SBP Consumer Protection Department receives 10,000+ complaints annually — this data is underutilized as a satisfaction signal.

Key Pakistan opportunity: Mobile banking app data (login frequency, feature usage, session duration, error rates) provides continuous satisfaction signals without survey fatigue.

FSDM: CSTMR_STSFCTN (Customer Satisfaction), SRVY (Survey), SRVY_RSPNS (Survey Response), CMPLNT (Complaint), CSTMR_FDBCK (Customer Feedback), INTN (Interaction), NPS_SCR (Net Promoter Score)
```

---

### SLIDES 13-14: Customer Experience Analytics + Maturity

**Enrich with Pakistan context:**

- "Map customer journeys across Pakistan's unique channel mix: 16,000 branches + 16,000 ATMs + mobile banking + USSD + branchless agent networks (500,000+ agents)"
- "Measure digital onboarding experience (e-KYC via NADRA biometric verification)"
- "Track service efficiency at branch level (average wait time, teller utilization)"
- "Incorporate WhatsApp banking interaction data (growing channel in Pakistan)"

**Speaker Notes:**
```
PAKISTAN CX CONTEXT: Pakistan banks face a unique CX challenge — serving a bifurcated customer base:
1. URBAN DIGITAL: 40% of customers prefer mobile/internet banking, expect fintech-level UX
2. RURAL/BRANCH: 60% rely on branch/agent networks, expect personal relationship banking
3. AGENT BANKING: 500,000+ branchless banking agents are the primary touchpoint for financial inclusion customers

The CX measurement challenge is integrating these disparate channels into a unified experience metric. Most banks measure branch satisfaction and digital satisfaction separately with no cross-channel view.

FSDM: CSTMR_EXPRNC (Customer Experience), CSTMR_JRNY (Customer Journey), TCHPNT (Touchpoint), CHNL_INTN (Channel Interaction), SVC_RQST (Service Request), CSTMR_CMPLN (Customer Complaint)
```

---

### SLIDES 15-16: Transaction Classification + Maturity

**Enrich with Pakistan context:**

- "Classify RAAST instant payments by purpose (P2P, P2M, bill payment, salary, remittance)"
- "Categorize IBFT transfers by relationship type (self-transfer, family, business, rent)"
- "Analyze POS/debit card spending by merchant category (MCC codes) — growing rapidly post-COVID"
- "Classify mobile wallet transactions to understand unbanked customer behavior"
- "Map salary credits to build income verification models (critical for lending in Pakistan where formal income documentation is rare)"

**Speaker Notes:**
```
PAKISTAN TRANSACTION CONTEXT: Transaction classification is particularly valuable in Pakistan because:
1. SALARY DETECTION: Only 30% of Pakistan's workforce has formal employment — salary credit identification enables income verification for 70% who can't provide salary slips
2. RAAST DATA: RAAST handles 50M+ monthly transactions — classifying by purpose reveals customer intent
3. IBFT PATTERNS: Self-transfers between own accounts at different banks reveal multi-banking behavior
4. MOBILE WALLET: JazzCash/Easypaisa transactions show spending patterns for 100M+ users outside formal banking
5. UTILITY BILLS: Bill payment amounts reveal household size, location, and income level
6. REMITTANCE: Pakistan receives $30B+ annual remittances — classifying inbound flows reveals diaspora relationships

Key classification categories for Pakistan:
- Salary/Income (regular credits matching payroll patterns)
- Rent/Housing (recurring outflows to property owners)
- Utility (K-Electric, SSGC, PTCL, internet, mobile recharge)
- Education (school/university fee payments — seasonal pattern)
- Healthcare (hospital, pharmacy, lab payments)
- Religious (Zakat, Sadaqah, Hajj/Umrah — seasonal)
- Remittance (inbound from Gulf, UK, US — key for cross-sell)
- Government (tax, passport, CNIC renewal, fines)

FSDM: TXN (Transaction), TXN_CLSFCTN (Transaction Classification), TXN_CTGRY (Transaction Category), ACCT_TXN (Account Transaction), PMT (Payment), MRCHNT (Merchant), MCC (Merchant Category Code)
```

---

### SLIDES 17-18: Customer Journey Analysis + Maturity

**Enrich with Pakistan context:**

- "Map onboarding journey: Branch walk-in → CNIC verification → NADRA biometric → account opening → first transaction"
- "Track digital migration journey: Branch-only → ATM → mobile app download → first RAAST → fully digital"
- "Identify churn journey: Reduced transactions → dormancy → zero balance → account closure"
- "Analyze remittance-to-investment journey for diaspora customers"
- "Map financial inclusion journey: Agent account opening → first deposit → first IBFT → first savings"

**Speaker Notes:**
```
PAKISTAN JOURNEY CONTEXT: Critical customer journeys for Pakistan banks:

1. DIGITAL ONBOARDING: CNIC → NADRA biometric → video KYC → account activation → first fund transfer
   Current: 15-30 minute process | Target: <5 minutes (fintech benchmark)
   Dropoff rate: 40-60% at biometric verification step

2. BRANCH-TO-DIGITAL MIGRATION: Walk-in customers → ATM activation → mobile app download → digital-primary
   Current: <20% of branch customers adopt digital | Target: 50%+ in 3 years
   Key barrier: Trust (customers prefer branch for high-value transactions)

3. FINANCIAL INCLUSION: Agent network → basic account → utility payments → savings → micro-lending
   Target: Move 70M unbanked adults through this funnel by 2028 (SBP NFIS target)

4. CROSS-SELL EXPANSION: CASA-only → debit card → credit card → personal loan → auto loan → home finance
   Current: 1.8 products/customer | Benchmark: 4-5 products

5. ISLAMIC CONVERSION: Conventional → awareness → first Islamic deposit → full Islamic banking relationship
   Opportunity: 85% want Shariah-compliant but only 20% market share

FSDM: CSTMR_JRNY (Customer Journey), JRNY_STP (Journey Step), EVNT_SEQ (Event Sequence), CHNL_TRNSTN (Channel Transition), TCHPNT_SEQ (Touchpoint Sequence), PTH_ANLYS (Path Analysis)
```

---

### SLIDES 19-20: Event Analytics + Maturity

**Enrich with Pakistan context:**

- "Detect salary credit events to trigger cross-sell (personal loan, credit card, investment) within 24 hours"
- "Monitor RAAST inbound remittance events to trigger diaspora-specific products"
- "Identify large balance changes (>PKR 1M) for wealth management outreach"
- "Detect first-time digital transactions to trigger digital adoption nurture campaigns"
- "Monitor dormancy signals (no transactions for 30+ days) for re-engagement"

**Speaker Notes:**
```
PAKISTAN EVENT ANALYTICS: High-value events for Pakistan banking:

INCOME EVENTS:
- Salary credit detection (day 1-5 of month — trigger cross-sell)
- Remittance receipt from Gulf/UK/US (trigger forex, investment, home finance offers)
- Government payment receipt (pension, tax refund — trigger age-appropriate offers)

SPENDING EVENTS:
- Large education payment (school fee — trigger education financing)
- Healthcare spend spike (trigger health insurance)
- Travel-related spend (trigger travel card, forex)
- Recurring rent payment (trigger home financing pre-qualification)

LIFE EVENTS:
- Address change (relocation — trigger branch reassignment)
- Large gift/transfer to new beneficiary (possible marriage — trigger package upgrade)
- First salary credit (new job — trigger salary account benefits)

DIGITAL EVENTS:
- First RAAST transaction (digital adoption — trigger digital banking features)
- Mobile app download without activation (followup nurture)
- Failed biometric verification (NADRA issue — trigger branch support)

RISK EVENTS:
- Sudden large outflows (potential churn — trigger retention)
- Multiple failed login attempts (security risk — trigger verification)
- International transaction from new country (fraud risk + travel products)

FSDM: EVNT (Event), EVNT_DTCTN (Event Detection), EVNT_TYP (Event Type), EVNT_ACTN (Event Action), TRGR (Trigger), ALRT (Alert), CSTMR_EVNT (Customer Event)
```

---

### SLIDES 21-22: Customer Segmentation + Maturity

**Enrich with Pakistan context:**

- "Segment by value tier: Mass (<PKR 500K), Affluent (PKR 500K-5M), Priority (PKR 5M-50M), HNW (PKR 50M+), UHNW (PKR 500M+)"
- "Segment by Islamic preference: Fully Islamic, Islamic-leaning, Conventional-only, Agnostic"
- "Segment by channel preference: Branch-only, Digital-primary, Hybrid, Agent-banking-only"
- "Geographic segmentation: Tier 1 (Karachi, Lahore, Islamabad), Tier 2 (Faisalabad, Rawalpindi, Multan), Tier 3 (remaining), Rural"
- "Life-stage: Student, Young Professional, Family Formation, Established, Pre-retirement, Retired, Diaspora"

**Speaker Notes:**
```
PAKISTAN SEGMENTATION: Multi-dimensional segmentation model for Pakistan banking:

DIMENSION 1 — VALUE (using profitability, not just balance):
- Mass Market: PKR <500K deposits, 1-2 products, basic CASA | 70% of customers, 15% of revenue
- Emerging Affluent: PKR 500K-5M, 2-3 products, growing digital adoption | 20% of customers, 35% of revenue
- Priority: PKR 5M-50M, 4+ products, relationship managed | 8% of customers, 30% of revenue
- HNW/UHNW: PKR 50M+, full product suite, dedicated RM | 2% of customers, 20% of revenue

DIMENSION 2 — BEHAVIORAL:
- Digital First: <25 age, mobile-primary, high RAAST/IBFT usage, low branch visits
- Hybrid: 25-45 age, uses mobile for routine, branch for complex transactions
- Branch Dependent: 45+ age, primary branch/ATM, limited digital
- Agent Banking: Rural, limited formal banking, uses JazzCash/Easypaisa agents

DIMENSION 3 — PRODUCT NEED:
- Savings-focused: CASA, fixed deposits, prize bonds, NSS certificates
- Borrowing-focused: Personal loans, auto finance, credit cards, home finance
- Investment-focused: Mutual funds, stocks, gold, government securities
- Trade-focused: Business accounts, trade finance, LC/LG, supply chain finance
- Islamic-focused: Shariah-compliant deposits, Diminishing Musharaka, Ijarah, Takaful

DIMENSION 4 — GEOGRAPHIC:
- Tier 1 Urban: Karachi, Lahore, Islamabad — digital-first, multi-banked
- Tier 2 Urban: Faisalabad, Rawalpindi, Multan, Peshawar — growing digital
- Tier 3/Semi-urban: Smaller cities — branch-dependent, agent banking growing
- Rural: Agent-banking and branchless — financial inclusion frontier

FSDM: SGMNT (Segment), CSTMR_SGMNT (Customer Segment), SGMNT_CRTRA (Segment Criteria), CLSTR (Cluster), CSTMR_CLSFCTN (Customer Classification)
```

---

### SLIDES 23-24: Customer Connection Analytics + Maturity

**Enrich with Pakistan context:**

- "Leverage CNIC-based household identification — family members share address, last name, CNIC prefix (first 5 digits = area code)"
- "Map business networks through inter-account transfer patterns (IBFT, RAAST)"
- "Identify influencers in microfinance communities and agent banking networks"
- "Detect informal hawala networks through unusual transaction patterns (AML/CFT application)"
- "Build social graphs from mobile contact data (with consent) for thin-file credit scoring"

**Speaker Notes:**
```
PAKISTAN CONNECTION ANALYTICS: Unique opportunities:
1. CNIC LINKAGE: CNIC first 5 digits encode area — family members in same household share similar CNIC prefix and address. This enables automated household identification unavailable in most markets.
2. IBFT/RAAST NETWORKS: Transaction flow analysis reveals customer networks — who transfers money to whom, how often, and how much. This builds social graphs without social media data.
3. JOINT ACCOUNT DATA: Multiple signatories on business accounts reveal corporate networks.
4. AGENT BANKING NETWORKS: Agent-to-customer transaction patterns reveal community structures in rural areas.
5. REMITTANCE CORRIDORS: Inbound remittance patterns from Gulf/UK/US reveal diaspora family networks.

AML/CFT Application: Connection analytics is critical for detecting hawala networks, structuring (smurfing), and beneficial ownership chains — directly supporting SBP's FATF compliance requirements.

FSDM: IP_RLTNP (Inter-Party Relationship), RLTNP_TYP (Relationship Type), NTWRK (Network), CNCTN (Connection), INFLNCR (Influencer), GRP (Group), HHLD (Household)
```

---

### SLIDES 25-26: Behavioral/Preference Analytics + Maturity

**Enrich with Pakistan context:**

- "Understand channel preferences: branch vs. ATM vs. mobile app vs. USSD vs. agent"
- "Identify Islamic banking preference from transaction patterns (avoidance of interest-based products)"
- "Detect spending persona: Conservative saver, Active spender, Seasonal spender (Eid, Ramadan)"
- "Track digital adoption curve: Resistor → Experimenter → Adopter → Champion"
- "Infer income stability from transaction regularity (critical for lending decisions in informal economy)"

**Speaker Notes:**
```
PAKISTAN BEHAVIORAL PATTERNS:
1. SEASONAL SPENDING: Marked spending spikes during Ramadan, Eid-ul-Fitr, Eid-ul-Adha, wedding season (Nov-Feb), back-to-school (August). Understanding these patterns enables timing-optimized offers.
2. ISLAMIC PREFERENCE SIGNAL: Customers who avoid interest-based FDs, use Qard-e-Hasna accounts, or make Zakat payments are signaling Islamic preference — opportunity to convert to full Islamic banking.
3. REMITTANCE BEHAVIOR: Regular inbound remittance recipients have distinct spending patterns — lump-sum spending post-receipt, savings for property, education investment for children.
4. DIGITAL MIGRATION: Tracking the progression from branch-only → first ATM use → first mobile login → first RAAST → first QR payment reveals digital readiness.
5. CASH vs. DIGITAL: High ATM withdrawal patterns indicate cash preference — opportunity for POS/QR payment nudges.

FSDM: BHVR (Behavior), PREF (Preference), CSTMR_BHVR (Customer Behavior), BHVR_SCRD (Behavior Scorecard), BHVR_CHNG (Behavior Change), CHNL_PREF (Channel Preference)
```

---

### SLIDES 27-28: Customer Life Stage + Maturity

**Enrich with Pakistan context:**

Pakistan-specific life stages (reflecting demographics and cultural norms):

| Life Stage | Age Range | Key Indicators | Banking Needs |
|---|---|---|---|
| Student | 15-22 | Education payments, pocket money deposits, first mobile wallet | Basic CASA, student card, mobile app |
| Young Professional | 22-28 | First salary credit, rental payments, car purchase | Salary account, credit card, auto finance |
| Family Formation | 28-35 | Marriage (large expenditure spike), spouse joint account, baby-related spend | Home finance, life insurance, family savings |
| Growing Family | 35-45 | School fees, children's accounts, property investment | Education planning, investment, second property |
| Established | 45-55 | Peak earning, investment diversification, Hajj/Umrah | Wealth management, premium banking, Hajj savings |
| Pre-Retirement | 55-60 | Pension planning, asset consolidation, children's marriage | Retirement products, pension fund, gold savings |
| Retirement | 60+ | Pension income, healthcare expenses, estate planning | Pension account, health cover, will/estate services |
| Diaspora | Any | Remittance inflows, property purchase, family support | Roshan Digital Account, remittance, NRP products |

**Speaker Notes:**
```
PAKISTAN LIFE STAGE CONTEXT:
1. YOUTH BULGE: 60% of 220M population is under 30 — the Student and Young Professional segments are enormous and growing. This is fundamentally different from aging populations in Europe/Japan.
2. EARLY MARRIAGE: Median marriage age is 22 (women) / 26 (men) — Family Formation stage starts earlier than Western markets.
3. LARGE FAMILIES: Average household size 6.7 — multi-generational households create complex financial relationships.
4. DIASPORA: 9M+ overseas Pakistanis sending $30B+ annually — a distinct life stage with unique banking needs (Roshan Digital Account, RDA).
5. INFORMAL ECONOMY: 70% of workforce in informal sector — life stage inference from transaction patterns is more valuable than self-reported data.
6. ISLAMIC LIFECYCLE: Religious milestones (Hajj, Umrah, Zakat, Qurbani) create additional life-stage markers unique to Pakistan's Muslim-majority population.

Life stage detection signals:
- First salary credit → Young Professional
- Joint account opening + large gift inflows → Marriage/Family Formation
- School fee payments starting → Growing Family (infer number of children from payment count)
- Hajj savings account opening → Established (religious milestone)
- Pension credit starting → Retirement
- Roshan Digital Account opening → Diaspora

FSDM: LF_STG (Life Stage), CSTMR_LF_STG (Customer Life Stage), LF_EVNT (Life Event), DMGRPHC (Demographic), AGE_GRP (Age Group), INCM_BRKT (Income Bracket)
```

---

### SLIDES 29-30: Customer Lifecycle Management — Section Overview

**Slide 29 — "Why is it important" — Enrich with Pakistan context:**

Replace generic bullets:
1. "Recognize best customers and retain — Top 2% generate 20% of revenue in Pakistan banking"
2. "Migrate low-engaged customers (1.8 products/customer) toward higher value (target: 3.0+)"
3. "Reduce churn to fintechs — SadaPay, NayaPay, Zindigi are actively targeting salary account holders"
4. "Identify best acquisition channels: branch walk-in vs. digital onboarding vs. agent network vs. employer tie-up"
5. "Manage the complete customer lifecycle from CNIC-based onboarding through wealth management to estate planning"

**Slide 30 — Capability Areas — Add Pakistan context under each:**

- Customer Acquisition → "Digital bank onboarding (e-KYC via NADRA), agent-led financial inclusion acquisition"
- Customer On-Boarding → "CNIC-based instant onboarding, biometric verification, first-transaction activation"
- Customer Retention → "Salary account lock-in, relationship pricing, loyalty programs"
- Customer Churn → "Detect dormancy signals, compete with fintech migration, balance attrition prevention"
- Customer Re-engagement → "Reactivate dormant accounts (SBP has 15M+ dormant accounts)"
- Customer Loyalty → "Points programs (HBL Konnect, UBL Rewards), Islamic loyalty alternatives"
- Cross-Sell/Up-Sell → "CASA → Cards → Loans → Insurance → Investment pipeline"

**Speaker Notes:**
```
PAKISTAN CLM CONTEXT: Customer Lifecycle Management is critical because:
1. ACQUISITION COST: Branch-based acquisition costs PKR 3,000-5,000 per customer vs. PKR 500-1,000 for digital onboarding — 5x cost difference
2. DORMANCY CRISIS: ~15M dormant accounts across the industry — massive re-engagement opportunity
3. FINTECH THREAT: SadaPay acquired 2M+ customers in 2 years with zero branches — all digital
4. CROSS-SELL GAP: 1.8 products/customer vs. 4-5 benchmark = 2-3x revenue opportunity per existing customer
5. RETENTION ECONOMICS: Acquiring a new customer costs 5-7x more than retaining existing — critical in Pakistan's competitive market

Note: Detailed capability slides for CLM are in File 04 (Customer Lifecycle Management). This file provides the overview and strategic context.

FSDM: CSTMR_LFCYCL (Customer Lifecycle), ACQSTN (Acquisition), ONBRDNG (Onboarding), RTNTN (Retention), CHRN (Churn), LYLTY (Loyalty), XSL (Cross-Sell)
```

---

## CONTENT DENSITY RULES (Apply to ALL Slides)

### Overflow Prevention

The original file has DENSE table cells with 200+ character paragraphs. Apply these STRICT rules:

| Container | Max Content | Font Size |
|---|---|---|
| Table cell (Business Objectives) | 6 bullets, 15 words each | 10-11pt |
| Table cell (Data & Solution) | 6 bullets, 12 words each | 10-11pt |
| Table cell (Outcome) | 6 bullets, 15 words each | 10-11pt |
| Maturity level cell | 3 sentences, 15 words each | 10-11pt |
| Priority cell | 4 bullets, 12 words each | 10pt |
| Body text box | 5 bullets, 15 words each | 13-14pt |

### Condensation Strategy

For EVERY capability table (slides 2, 4, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27):
1. **ON SLIDE:** Condense to 4-6 crisp bullets per section (Business Objectives, Data, Outcome)
2. **SPEAKER NOTES:** Move the full detailed content + add Global/Regional/Pakistan context + FSDM entities
3. Include Pakistan-specific bullets ON THE SLIDE (not just in notes)

**Example — Slide 2 (Single View of Customer) — Business Objectives:**

BEFORE (overflow):
```
Create a single view of the customer across the organisation Effectively manage customer
relationships through a single customer view across business units, brands, channels and
third party relationships Extend the single customer view to include identifiers across
digital channels such as social media or non-authenticated websites Measure the depth
and value of the entire customer relationship Understand household customer relationships
Treat customers consistently across brands and channels
```

AFTER (fits in cell):
```
• Single customer view across all business units, channels, and products
• Extend identity to digital channels (mobile app, RAAST, agent banking)
• Leverage CNIC as universal customer key across 4-5 core systems
• Map household relationships using CNIC and address linkage
• Measure depth of relationship (1.8 products/customer → 3.0+ target)
• Enable consistent treatment across conventional and Islamic divisions
```

---

## TERADATA BRANDING REMOVAL

Apply to ALL 30+ slides:

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" (standalone) | "Enterprise Analytics Platform" |
| "Teradata Confidential" | [Theme footer per master prompt] |
| #F58220 (orange) | Theme accent color |
| #00539F (blue) | Theme primary color |
| Teradata logo | Theme logo |
| "H1 2018" | "H1 2025 — H2 2026" |
| "For use in Maturity Assessment & Roadmap Engagements" | REMOVE (or move to speaker notes) |
| Photos placeholder text "Photos can be any photo from the Marcom Central" | REMOVE |

**KEEP:** All FSDM entity references, BVF capability names, maturity framework structure.

---

## FINAL OUTPUT SLIDE STRUCTURE (33+ slides)

| # | Slide | Type | Status |
|---|-------|------|--------|
| 1 | Customer Information & Insight Analytics | Title | Updated branding |
| **2** | **Domain Dashboard — At a Glance** | **NEW** | Global/Regional/Pakistan metrics |
| 3 | Single View of Customer | Capability Detail | Enriched with Pakistan |
| 4 | Single View of Customer — Maturity | Maturity Table | Updated assessment |
| 5 | Multi-Dimensional Customer View | Capability Detail | Enriched with Pakistan |
| 6 | Multi-Dimensional Customer View — Maturity | Maturity Table | Updated assessment |
| 7 | Insight Driven Customer Management | Section Overview | Enriched bullets |
| **8** | **🇵🇰 Pakistan Banking — Customer Analytics Landscape** | **NEW** | Market context |
| 9 | Insight Driven Customer Mgmt — Capabilities (1/2) | Capability List | Pakistan context added |
| 10 | Insight Driven Customer Mgmt — Capabilities (2/2) | Capability List | Pakistan context added |
| 11 | Customer Value & Profitability | Capability Detail | Enriched |
| 12 | Customer Value & Profitability — Maturity | Maturity Table | Updated |
| 13 | Customer Satisfaction Indexing | Capability Detail | Enriched |
| 14 | Customer Satisfaction Indexing — Maturity | Maturity Table | Updated |
| 15 | Customer Experience Analytics | Capability Detail | Enriched |
| 16 | Customer Experience Analytics — Maturity | Maturity Table | Updated |
| 17 | Transaction Classification | Capability Detail | Enriched |
| 18 | Transaction Classification — Maturity | Maturity Table | Updated |
| 19 | Customer Journey Analysis | Capability Detail | Enriched |
| 20 | Customer Journey Analysis — Maturity | Maturity Table | Updated |
| 21 | Event Analytics | Capability Detail | Enriched |
| 22 | Event Analytics — Maturity | Maturity Table | Updated |
| 23 | Customer Segmentation | Capability Detail | Enriched |
| 24 | Customer Segmentation — Maturity | Maturity Table | Updated |
| 25 | Customer Connection Analytics | Capability Detail | Enriched |
| 26 | Customer Connection Analytics — Maturity | Maturity Table | Updated |
| 27 | Behavioral/Preference Analytics | Capability Detail | Enriched |
| 28 | Behavioral/Preference Analytics — Maturity | Maturity Table | Updated |
| 29 | Customer Life Stage | Capability Detail | Enriched |
| 30 | Customer Life Stage — Maturity | Maturity Table | Updated |
| 31 | Customer Lifecycle Management | Section Overview | Enriched |
| 32 | Customer Lifecycle Management — Capabilities | Capability List | Pakistan context |
| **33** | **Implementation Roadmap** | **NEW** | 3-phase roadmap |
| 34 | Thank You / Next Steps | Closing | Updated branding |

---

## VISUAL QA CHECKLIST

After generating the updated file:

```bash
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide
```

Check EVERY slide for:
```
□ No text overflow in ANY table cell
□ All table cells have minimum 0.06" internal padding
□ Font ≥ 10pt in all tables
□ No Teradata branding (logo, orange, "Teradata" text, "H1 2018")
□ Pakistan context present on EVERY capability slide
□ Speaker notes populated with Global/Regional/Pakistan/FSDM content
□ 3 new slides present (Dashboard, Pakistan Context, Roadmap)
□ Maturity tables show updated Pakistan Current/Desired levels
□ No "Photos can be any photo from the Marcom Central" text
□ No "For use in Maturity Assessment & Roadmap Engagements" on slide face
□ Footer shows correct branding
□ Page numbers sequential
□ Consistent theme colors throughout
```
