# PROMPT 6K: File 06 — Marketing & Customer Experience Use Cases

## Role

You are a senior banking analytics consultant and presentation specialist. You are rebuilding BVF PowerPoint File 06, which contains 65 use cases across the entire Marketing & Customer Experience domain — Customer Information Management, Insight-Driven Customer Management, Customer Lifecycle Management, and Customer Interaction Management. You have deep expertise in Pakistan's banking sector, customer analytics, and data-driven marketing in emerging markets.

---

## Source File

```
INPUT:  ./06_Marketing_CX_Use_Cases.pptx  (69 slides — ALL have full content)
OUTPUT: ./pptout/06_Marketing_CX_Use_Cases_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 69 slides have complete Teradata BVF use case content. 4 section dividers + 65 use case slides. NO empty/placeholder slides.

**Work required:**
1. Add Pakistan banking context to EVERY use case (problem statement + outcome + data sources)
2. Add FSDM entity references to every use case speaker notes
3. Update all references (remove Teradata IC names, update timeframes)
4. Fix content overflow in dense use case slides
5. Add 3 new supplementary slides
6. Remove/replace all Teradata branding

---

## EXISTING SLIDE STRUCTURE (69 Slides)

### USE CASE SLIDE FORMAT (Consistent across all 65 use case slides)

Every use case slide has 7 fields:
```
1. Objective / Problem Statement    (2-4 sentences)
2. Business Benefit                 (2-4 bullets)
3. Source Data                      (3-6 data items)
4. Methodology / Analytic Technique (2-4 techniques)
5. Expected Outcome                 (3-5 bullets)
6. Challenges                       (1-3 items)
7. Success Criteria                 (1-3 measurable targets)
```

Plus: References/IC field (contains Teradata consultant names — REMOVE) and Notes (contain Teradata triangle color legend — REMOVE/REPLACE).

---

### Section 1: Customer Information Management (Slides 1-2)

| Slide | Title | Content |
|-------|-------|---------|
| 1 | **SECTION DIVIDER** — Customer Information Management | Title only |
| 2 | Multi-Dimensional Customer View | Full use case |

### Section 2: Insight-Driven Customer Management (Slides 3-38)

| Slide | Title |
|-------|-------|
| 3 | **SECTION DIVIDER** — Insight Driven Customer Management |
| 4 | Path to Profitable/Unprofitable Customers |
| 5 | Customer Life Time Value |
| 6 | Customer Satisfaction (NPS) |
| 7 | Customer Satisfaction Index |
| 8 | Predict Complaint |
| 9 | Identify Broken/Sub Optimal Processes |
| 10 | Call Centre Sentiment |
| 11 | Transactional Classification (1) |
| 12 | Transactional Classification (2) |
| 13 | Sales Process Improvement |
| 14 | Path to Purchase — Event Based Marketing |
| 15 | Customer Journey Analytics (1) |
| 16 | Customer Journey Analytics (2) |
| 17 | Path to Appointment |
| 18 | Product Sequence: Path to Value |
| 19 | Credit Card Spending Journey |
| 20 | Abandoned Online Purchase |
| 21 | Wealth Management — Proactive Advice |
| 22 | Portfolio Increase and New "Win-Over" |
| 23 | Lead Generation From Branch Notes |
| 24 | Identify Potential Money Flow to Retain |
| 25 | Investor Segmentation |
| 26 | Identify 'Hidden' Individual Business Owners |
| 27 | Credit/Debit Card Spend Stimulation |
| 28 | People Like Me |
| 29 | Attitudinal Segmentation |
| 30 | Hidden 'Preferred' Customers |
| 31 | Propensity Modeling |
| 32 | Social Network Driven Potential Value |
| 33 | Customer Network Analysis |
| 34 | Client Connections |
| 35 | Credit Card Holder Behavior Analysis (1) |
| 36 | Credit Card Holder Behavior Analysis (2) |
| 37 | Client Branch Visit Preference Behavior |
| 38 | Customer Life-Based Events |

### Section 3: Customer Lifecycle Management (Slides 39-49)

| Slide | Title |
|-------|-------|
| 39 | **SECTION DIVIDER** — Customer Lifecycle |
| 40 | Lunch Buddy Analysis |
| 41 | Prospect Screener |
| 42 | Product Sequence: Path to Value |
| 43 | Path to Churn |
| 44 | Identify 'Balance' Churners |
| 45 | Credit Card Balance Churn |
| 46 | CASA Silent Churn |
| 47 | Customer Churn Model in Retail Banking |
| 48 | Broker Introduced Insurance — Path to Churn |
| 49 | Improving Cross-Sell Targeting |

### Section 4: Customer Interaction Management (Slides 50-69)

| Slide | Title |
|-------|-------|
| 50 | **SECTION DIVIDER** — Customer Interaction Management |
| 51 | Social Networks Data for Marketing Campaigns |
| 52 | Contact Management |
| 53 | Omni-Channel Customer Experience Optimization |
| 54 | Omni-Channel Customer Engagement |
| 55 | Location Based Offers |
| 56 | Real-time Customer GIS Location in Collaboration with Telcos |
| 57 | RTIM and Real-Time |
| 58 | Web/IVR Breakout |
| 59 | Complaints Process Optimisation |
| 60 | Onsite Search Engine Optimization |
| 61 | Customized "Amount" Button |
| 62 | Enhanced NBA Contact Strategy |
| 63 | Next Best Product Offer |
| 64 | Product Bundling |
| 65 | Individualized Merchants Recommendation |
| 66 | Advertising Creative Optimization |
| 67 | Competitor Analysis |
| 68 | Marketing Attribution |
| 69 | Attribution |

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Use Case Portfolio Dashboard (insert as slide 1, replacing current section divider)

**"Marketing & CX Use Cases — Portfolio Dashboard"**

| Section | Use Cases | Pakistan Priority | Quick Wins | FSDM Domains |
|---|---|---|---|---|
| Customer Information (1 UC) | Multi-Dimensional View | Critical | CNIC-based 360 view | Party, Event |
| Insight-Driven (35 UCs) | Profitability, Segmentation, Journey, Events | High | Transaction classification, Salary detection | Party, Transaction, Event |
| Customer Lifecycle (10 UCs) | Churn, Cross-sell, Acquisition | Critical | CASA silent churn, Cross-sell pipeline | Party, Product, Account |
| Customer Interaction (19 UCs) | NBA, Omnichannel, Personalization | High | Contact optimization, SMS fatigue fix | Campaign, Channel, Interaction |
| **TOTAL** | **65 Use Cases** | | | |

Pakistan Implementation Priority Matrix:
```
IMMEDIATE (0-6 months): Transaction Classification, CASA Silent Churn, Contact Management,
                         Path to Profitable Customers, Customer Churn Model
HIGH (6-18 months):      Customer Journey Analytics, NBA Contact Strategy, Cross-Sell Targeting,
                         Omni-Channel Optimization, Customer Satisfaction Index
STRATEGIC (18-36 months): Real-Time Offers, Social Network Analysis, Location-Based Offers,
                          Wealth Management Proactive Advice, Marketing Attribution
```

### NEW Slide B: Pakistan Context — Use Case Applicability (insert as slide 2)

**"Pakistan — Marketing & CX Use Case Landscape"**

```
USE CASES WITH HIGHEST PAKISTAN IMPACT:

1. CASA Silent Churn (Slide 46)
   Why: PKR 500B+ at risk in silent balance rundown across industry
   Pakistan data: RAAST/IBFT outflows, salary credit patterns, mobile app logins

2. Transaction Classification (Slides 11-12)
   Why: 70% informal economy — salary detection enables lending to undocumented workforce
   Pakistan data: RAAST, IBFT, POS, bill payments, mobile wallet transactions

3. Customer Churn Model (Slide 47)
   Why: Fintech competition accelerating — SadaPay/NayaPay capturing millennials
   Pakistan data: App uninstalls, balance decline, RAAST outflows to competitors

4. Cross-Sell Targeting (Slide 49)
   Why: 1.8 products/customer vs. 4-5 benchmark = 2-3x revenue opportunity
   Pakistan data: Product holdings across 4-5 core systems, ECIB bureau data

5. Contact Management (Slide 52)
   Why: SMS fatigue crisis — 10-15 promotional messages/day destroying response rates
   Pakistan data: SMS delivery/open rates, opt-out rates, SBP complaint data

6. Customer Network Analysis (Slide 33)
   Why: CNIC enables household mapping unavailable in most markets
   Pakistan data: CNIC prefix linkage, IBFT transfer patterns, joint account data
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Marketing & CX Use Cases — Implementation Roadmap"**

```
Phase 1: Foundation Use Cases (0-6 months) — 8 use cases
  Transaction Classification, CASA Silent Churn, Path to Profitable Customers,
  Contact Management, Customer Churn Model, Prospect Screener,
  Customer Satisfaction (NPS), Credit Card Behavior Analysis
  Investment: PKR 40-80M | Data: Existing EDW + RAAST/IBFT feeds

Phase 2: Intelligence Use Cases (6-18 months) — 15 use cases
  Customer Journey Analytics, Cross-Sell Targeting, NBA Contact Strategy,
  Event Based Marketing, Omni-Channel Optimization, Product Bundling,
  Customer Life Time Value, Segmentation suite, Propensity Modeling,
  Complaints Process Optimization, Path to Churn, Balance Churners,
  Hidden Preferred Customers, Customer Satisfaction Index, Attitudinal Segmentation
  Investment: PKR 100-200M | Data: + Mobile app events + Call center data

Phase 3: Advanced Use Cases (18-36 months) — 12 use cases
  Real-Time Offers, Location Based, Social Network Analysis,
  Customer Network Analysis, Wealth Management Proactive Advice,
  Marketing Attribution, Advertising Optimization, Competitor Analysis,
  GIS Location + Telco, Web/IVR Breakout, Individualized Merchant Reco,
  People Like Me (look-alike modeling)
  Investment: PKR 150-300M | Data: + Real-time streams + External data
```

---

## ENRICHMENT RULES — APPLY TO ALL 65 USE CASE SLIDES

### Rule 1: Pakistan Context in Every Use Case

For EVERY use case slide, add Pakistan-specific content to these fields:

**Objective/Problem Statement — ADD 1-2 Pakistan-specific sentences:**
Pattern: "In Pakistan's banking context, [specific challenge related to SBP/CNIC/RAAST/Islamic banking/financial inclusion/fintech competition]"

**Source Data — ADD Pakistan data sources:**
Always consider adding where relevant:
- CNIC data (13-digit national ID, NADRA verification)
- RAAST instant payment data
- IBFT inter-bank transfer data
- 1Link ATM/POS switch data
- Mobile banking app event data
- JazzCash/Easypaisa mobile wallet data
- ECIB credit bureau data
- SBP regulatory reporting data
- Islamic banking product data (Mudaraba, Musharaka, Ijarah)

**Expected Outcome — ADD Pakistan-specific measurable targets:**
Pattern: Use PKR amounts, Pakistan market benchmarks, SBP compliance benefits.

**Challenges — ADD Pakistan-specific barriers:**
Common Pakistan challenges to reference:
- 4-5 core banking systems per bank (data fragmentation)
- Batch-only data processing (no real-time)
- Low data quality / incomplete CNIC records
- Islamic banking separate systems
- Limited analytics talent pool in Pakistan
- SBP data privacy considerations
- Urdu/English bilingual requirements

### Rule 2: FSDM Entity References in Speaker Notes

For EVERY use case, add to speaker notes:
```
FSDM Entities: [list relevant FSDM entities from Party, Event, Transaction, Product, Channel, Marketing domains]
BVF Capability: [link to parent capability from Files 03-05]
BACR Questions: [reference applicable BACR maturity assessment questions]
```

### Rule 3: Remove Teradata References

On EVERY use case slide:
- **References field:** Remove Teradata IC names (e.g., "IC Andrew Johnston", "ICs CK Loy & Vince Leat"). Replace with: "Banking Industry Best Practice" or remove field entirely.
- **Notes:** Remove "The colours of the triangles indicate the type of Use Case: Orange = Traditional Teradata / Data Warehouse, Red = 'Big Data' / Advanced Analytics, Blue = Non-Analytical Hadoop / Data Lake use case (e.g. Archiving)". Replace with Pakistan context notes + FSDM mapping.

### Rule 4: Content Density

Use case slides are already dense (7 fields). Apply STRICT limits:

| Field | Max Content |
|---|---|
| Objective | 4 sentences, 20 words each max |
| Business Benefit | 4 bullets, 12 words each |
| Source Data | 6 items, 10 words each |
| Methodology | 4 techniques, 8 words each |
| Expected Outcome | 5 bullets, 15 words each |
| Challenges | 3 items, 12 words each |
| Success Criteria | 3 items, 15 words each |

Move ALL overflow content to speaker notes.

---

## SECTION-BY-SECTION ENRICHMENT GUIDE

### SECTION 1: Customer Information Management (1 use case)

#### Slide 2: Multi-Dimensional Customer View

**Pakistan enrichment:**
- Objective: "Pakistan banks operate 4-5 core systems per bank. Building a 360 view requires integrating CTL, Temenos, Oracle, and Finacle customer data using CNIC as the universal key."
- Source Data ADD: "CNIC-verified customer records, RAAST transaction data, mobile banking app events, 1Link ATM/POS data, JazzCash/Easypaisa wallet data, NADRA biometric verification records"
- Expected Outcome ADD: "Unified view of 60M+ bank customers by linking with 100M+ mobile wallet users via CNIC/mobile number"
- Challenges ADD: "4-5 incompatible core banking systems, 20-30% duplicate customer records, batch-only ETL processes"

**Speaker Notes:**
```
PAKISTAN: This is the foundational use case for all Pakistan banking analytics. Without a single customer view across multiple core systems, no downstream analytics (profitability, journey, segmentation) is possible.

UBL Context: UBL operates CTL plus 4 other core systems. The FSDM-based data warehouse integrates these into a unified customer master using CNIC as primary key.

FSDM: INDVDL, ORGN, PRTY, PRTY_IDNTFR (CNIC), IP_RLTNP, PRTY_ADDR, EVNT, INTN, CHNL, TXN, ACCT_TXN
BVF Capability: Customer Information Management > Multi-Dimensional Customer View (File 03, Slides 4-5)
```

---

### SECTION 2: Insight-Driven Customer Management (35 use cases)

#### Slide 4: Path to Profitable/Unprofitable Customers

**Pakistan enrichment:**
- Objective ADD: "In Pakistan, understanding the path from new account opening to profitability is critical given PKR 3-5K acquisition cost per customer and only 1.8 products per customer."
- Source Data ADD: "CNIC-verified customer data, salary credit patterns, RAAST/IBFT transaction history, branch visit frequency, mobile app engagement"
- Outcome ADD: "Identify onboarding interventions that accelerate path to profitability — target: reduce time-to-profit from 18 months to 9 months"
- Challenges ADD: "Activity-based costing data not available at most Pakistan banks; cost-to-serve varies 10x between branch and digital"

#### Slide 5: Customer Life Time Value

**Pakistan enrichment:**
- Objective ADD: "Pakistan banks must calculate CLTV incorporating both conventional and Islamic product holdings, CASA deposits, lending, cards, and fee income."
- Source Data ADD: "Product holdings across all core systems, KIBOR-based funds transfer pricing, activity-based costing, ECIB credit bureau data"
- Outcome ADD: "Enable value-based customer management — top 2% of Pakistan bank customers generate ~20% of revenue"
- Challenges ADD: "No activity-based costing in most Pakistan banks; Islamic product profit-sharing requires different CLTV methodology"

#### Slides 6-7: Customer Satisfaction / NPS / Satisfaction Index

**Pakistan enrichment:**
- "Benchmark NPS against fintech competitors: traditional banks NPS ~20-30 vs. SadaPay ~70"
- Source Data ADD: "SBP Consumer Protection complaint data, Google Play app ratings, social media sentiment (Twitter/X, Facebook)"
- "In Pakistan, satisfaction measurement is primarily survey-based — opportunity to build continuous measurement from digital interaction data"

#### Slide 8: Predict Complaint

**Pakistan enrichment:**
- "Predict SBP Consumer Protection complaints before they are filed — each formal complaint carries regulatory cost and reputation risk"
- Source Data ADD: "SBP complaint history, call center sentiment data, social media mentions, branch queue wait times"
- "Target: predict 30% of complaints 7 days before filing, enabling proactive resolution"

#### Slide 9: Identify Broken/Sub Optimal Processes

**Pakistan enrichment:**
- "Identify broken processes in Pakistan's multi-system environment — e.g., account opening requires 5 systems, NADRA verification adds latency, debit card issuance takes 7-14 days"
- "Key broken processes in Pakistan banking: digital onboarding (40-60% dropoff), IBFT failure handling, cheque clearing delays, loan disbursement (7-21 days)"

#### Slide 10: Call Centre Sentiment

**Pakistan enrichment:**
- "Analyze sentiment in Urdu and English call recordings — Urdu NLP models less mature, requires custom training"
- "Pakistan call centers handle 1M+ calls/month per large bank — massive unstructured data opportunity"
- Source Data ADD: "Urdu/English call recordings, IVR interaction logs, WhatsApp chat transcripts"

#### Slides 11-12: Transactional Classification

**Pakistan enrichment — HIGHEST PRIORITY USE CASE:**
- "Classify RAAST instant payments by purpose: P2P, P2M, bill payment, salary, remittance, Zakat"
- "Detect salary credits in accounts without employer tags — enables lending for 70% informal workforce"
- "Classify mobile wallet transactions to understand spending patterns of 100M+ JazzCash/Easypaisa users"
- Source Data ADD: "RAAST transaction data, IBFT transfers, POS/debit card spending (MCC codes), mobile wallet data, utility bill payments"
- "Pakistan-specific categories: salary, rent, utility, education fees, healthcare, religious (Zakat/Qurbani), remittance, government payments"

#### Slide 13: Sales Process Improvement

**Pakistan enrichment:**
- "Optimize branch sales process — Pakistan branch staff close <5% of sales leads due to manual processes"
- "Improve digital sales funnel — mobile app loan application to disbursement takes 7-21 days vs. fintech 24-48 hours"

#### Slide 14: Path to Purchase — Event Based Marketing

**Pakistan enrichment:**
- "Design event-triggered campaigns around Pakistan-specific events: salary credit (1st-5th), Ramadan/Eid, back-to-school (August), wedding season (Nov-Feb), Hajj season"
- Source Data ADD: "RAAST salary credit events, IBFT large transfer events, POS spending spikes, mobile app product page views"

#### Slides 15-16: Customer Journey Analytics

**Pakistan enrichment:**
- "Map key Pakistan banking journeys: onboarding (CNIC → NADRA → account → first transaction), branch-to-digital migration, financial inclusion (agent → basic account → savings → lending)"
- Source Data ADD: "Branch visit data, ATM usage, mobile app sessions, RAAST/IBFT, agent network interactions"
- "Key journey to map: why do 40-60% of digital onboarding applicants drop off at NADRA biometric step?"

#### Slide 17: Path to Appointment

**Pakistan enrichment:**
- "In Pakistan context, branch appointment is rare — most are walk-ins. However, RM-managed priority/HNW customers do need appointment optimization."
- "Digital alternative: WhatsApp-based RM scheduling for priority banking customers"

#### Slides 18, 42: Product Sequence — Path to Value

**Pakistan enrichment:**
- "Map Pakistan product sequences: CASA → Debit Card → Credit Card → Personal Loan → Auto → Home Finance → Insurance → Investment"
- "Identify fastest path to 3+ products per customer (from current 1.8)"
- "Track Islamic product adoption path separately: Islamic CASA → Islamic FD → Diminishing Musharaka → Takaful"

#### Slide 19: Credit Card Spending Journey

**Pakistan enrichment:**
- "Pakistan credit card market: ~3M cards, growing 25% YoY. Typical journey: activation → first swipe → online usage → installment plans → supplementary card"
- "Key challenge: 30% of issued credit cards never activated. Map journey from issuance to activation to regular usage."

#### Slide 20: Abandoned Online Purchase

**Pakistan enrichment:**
- "In Pakistan banking context: abandoned loan applications (started online, not completed), abandoned account opening (dropped at NADRA step), abandoned card applications"
- "40-60% abandonment rate at digital onboarding — highest priority abandonment to fix"

#### Slide 21: Wealth Management — Proactive Advice

**Pakistan enrichment:**
- "Pakistan HNW segment (PKR 50M+ deposits) is relationship-managed but reactive. Proactive advice based on portfolio analytics is rare."
- "Opportunity: NSS certificates maturing, PIB/T-Bill laddering, Islamic wealth management (Sukuk, Islamic mutual funds)"
- Source Data ADD: "Portfolio holdings (FDs, NSS, PIBs, mutual funds, stocks), RAAST large value transfers, property transaction signals"

#### Slide 22: Portfolio Increase and New "Win-Over"

**Pakistan enrichment:**
- "Win-over high-value customers from competitors by detecting multi-banking signals: IBFT outflows to competitor, ECIB inquiries by other banks"
- "Target: win-over 5% of competitor high-value customers annually through superior analytics-driven service"

#### Slide 23: Lead Generation From Branch Notes

**Pakistan enrichment:**
- "Pakistan branch RMs capture customer notes manually (paper or basic CRM). Text mining these notes can uncover cross-sell leads."
- "Urdu text analytics required — RMs often write in mixed Urdu/English"
- Source Data ADD: "Branch CRM notes, RM visit reports, call center conversation transcripts (Urdu/English)"

#### Slide 24: Identify Potential Money Flow to Retain

**Pakistan enrichment:**
- "Detect RAAST/IBFT outflows to competitor banks — if a customer regularly transfers salary to another bank, retention intervention needed"
- "Monitor FD maturity events — if not renewed, funds may be leaving to competitor offering higher rate"

#### Slide 25: Investor Segmentation

**Pakistan enrichment:**
- "Segment Pakistan investors: NSS certificate holders (conservative), mutual fund investors (moderate), stock market traders (active), gold savers (traditional), crypto curious (emerging)"
- "Islamic investment preference is a critical segmentation dimension — Sukuk, Islamic mutual funds, Naya Pakistan Certificates"

#### Slide 26: Identify 'Hidden' Individual Business Owners

**Pakistan enrichment:**
- "Pakistan's 70% informal economy means many business owners bank as individuals. Detecting business patterns (multiple salary disbursements, high transaction volumes, supplier payments) enables SME product offers."
- Source Data ADD: "CNIC data (individual vs. NTN business), transaction patterns, RAAST payment frequency to multiple recipients"

#### Slide 27: Credit/Debit Card Spend Stimulation

**Pakistan enrichment:**
- "30M+ debit cards issued but average monthly POS usage is <5 transactions. Stimulation campaigns can drive 30-50% increase in card usage."
- "Target: convert ATM-cash-withdrawal-heavy customers to POS/QR payment users"
- "Ramadan/Eid spending spike = ideal period for card stimulation campaigns"

#### Slide 28: People Like Me

**Pakistan enrichment:**
- "Build look-alike models for Pakistan segments: find customers similar to high-value customers and target for upgrade"
- "Special application: find unbanked individuals similar to recently banked customers for financial inclusion targeting"

#### Slide 29: Attitudinal Segmentation

**Pakistan enrichment:**
- "Key attitudinal dimensions for Pakistan: Islamic finance preference, digital readiness, brand loyalty vs. rate shopping, savings orientation vs. spending orientation"
- "Infer attitudes from behavior — Islamic preference from Zakat payments, digital readiness from app usage frequency"

#### Slide 30: Hidden 'Preferred' Customers

**Pakistan enrichment:**
- "Identify mass-market customers who actually qualify for priority/preferred banking but haven't been migrated"
- "Common in Pakistan: customers with PKR 5M+ spread across 2-3 bank accounts appear as mass-market in each bank individually"
- "CNIC-based total relationship view across product systems reveals hidden value"

#### Slide 31: Propensity Modeling

**Pakistan enrichment:**
- "Build propensity models for Pakistan banking products: credit card, personal loan, auto finance, home finance, mutual fund, insurance"
- "Pakistan-specific features: salary regularity score, ECIB credit bureau score, RAAST activity level, product holding count, branch visit frequency"

#### Slides 32-34: Social Network / Customer Network / Client Connections

**Pakistan enrichment:**
- "CNIC-based network analysis: CNIC first 5 digits encode geographic area — family members share prefix"
- "IBFT/RAAST transfer graph reveals customer relationships without social media data"
- "Application: AML/CFT network detection (SBP FATF compliance), household product bundling, referral program targeting"

#### Slides 35-36: Credit Card Holder Behavior Analysis

**Pakistan enrichment:**
- "Analyze Pakistan credit card behavior: average ticket size, merchant categories (grocery, fuel, dining, online), installment plan usage, reward point redemption"
- "Key insight: Pakistan credit card users show extreme seasonality — Eid spending is 3-5x normal months"

#### Slide 37: Client Branch Visit Preference Behavior

**Pakistan enrichment:**
- "Pakistan still branch-heavy: 60%+ of high-value transactions done in-branch. Understanding branch visit patterns enables: staffing optimization, RM assignment, digital migration targeting"
- "Detect customers visiting branch for transactions that could be done digitally — target for app adoption campaigns"

#### Slide 38: Customer Life-Based Events

**Pakistan enrichment:**
- "Pakistan-specific life events: first salary credit (new job), marriage (large gift inflows), first child (school fee pattern), Hajj/Umrah savings, property purchase, retirement/pension start, overseas migration"
- "Islamic calendar events: Ramadan (Zakat, charity), Eid-ul-Adha (Qurbani), Shab-e-Qadr"

---

### SECTION 3: Customer Lifecycle Management (10 use cases)

#### Slide 40: Lunch Buddy Analysis

**Pakistan enrichment:**
- "Adapt for Pakistan: identify customers who regularly transact together (shared POS location, same merchant, same timing) — indicates colleague or friend relationship"
- "Application: if one customer churns, proactively retain the 'lunch buddy' before social influence drives their churn too"

#### Slide 41: Prospect Screener

**Pakistan enrichment:**
- "Screen prospects using ECIB credit bureau data, CNIC verification, NADRA biometric, PTA mobile number verification"
- "For financial inclusion prospects: use mobile wallet transaction history (JazzCash, Easypaisa) as proxy for creditworthiness"

#### Slide 42: Product Sequence — Path to Value (Lifecycle version)

**Pakistan enrichment:**
- Same as Slide 18 but lifecycle-focused: "Track time between product adoptions and identify accelerators"
- "Pakistan target: reduce average time from CASA to second product from 24 months to 6 months"

#### Slide 43: Path to Churn

**Pakistan enrichment:**
- "Map event sequences leading to churn in Pakistan: balance decline → reduced transactions → app login drop → salary redirect → account dormancy"
- "Pakistan-specific churn paths: employer salary account switch, fintech migration path, Islamic conversion path, overseas migration path"

#### Slide 44: Identify 'Balance' Churners

**Pakistan enrichment:**
- "Balance churn (gradual withdrawal without closing account) is the dominant churn type in Pakistan — accounts remain open with minimum balance while customer has moved to competitor"
- "Detect via RAAST/IBFT: customer transferring increasing amounts to another bank monthly"

#### Slide 45: Credit Card Balance Churn

**Pakistan enrichment:**
- "Credit card balance churn in Pakistan: customer reduces spending, transfers balance to competitor card offering lower rate/better rewards"
- "Detect via: declining monthly spend, balance transfer transactions, zero-spend months"

#### Slide 46: CASA Silent Churn — HIGHEST PRIORITY

**Pakistan enrichment:**
- "CASA silent churn is Pakistan banking's biggest unaddressed revenue leak. Top-tier customers move funds without formal account closure."
- "PKR 500B+ estimated at risk across industry. Detect via: salary credit stops, balance below 6-month average, RAAST outflows exceed inflows, no branch visit for 90+ days"
- "Target: identify 20% of silent churners 30 days before balance drops below retention threshold"

#### Slide 47: Customer Churn Model in Retail Banking

**Pakistan enrichment:**
- "Build Pakistan-specific churn model features: salary credit continuity, RAAST/IBFT outflow ratio, mobile app login frequency, SBP complaint filing, branch visit frequency change, FD maturity renewal rate"
- "Model must differentiate: competitive churn (to fintech), rate shopping churn, life event churn (overseas migration), dormancy slide"

#### Slide 48: Broker Introduced Insurance — Path to Churn

**Pakistan enrichment:**
- "Adapt for Pakistan: Bancassurance customers who were sold insurance products at account opening (often without full understanding). High lapse rates indicate satisfaction issues."
- "Pakistan insurance penetration is <1% — every policy retention matters"

#### Slide 49: Improving Cross-Sell Targeting

**Pakistan enrichment:**
- "Current cross-sell response rate <5% in Pakistan banking. Improvement target: 8-12% through better targeting."
- "Key improvements: salary-event trigger (within 24 hours), Islamic preference matching, ECIB pre-screening, life event detection"
- "Never cross-sell conventional interest products to Islamic-preference customers"

---

### SECTION 4: Customer Interaction Management (19 use cases)

#### Slide 51: Social Networks Data for Marketing Campaigns

**Pakistan enrichment:**
- "Pakistan's social media landscape: Facebook (45M+), Instagram (15M+), Twitter/X (5M+), TikTok (30M+ — growing bank presence), YouTube (70M+)"
- "Privacy considerations: Pakistan has no formal data privacy law yet, but SBP guidelines restrict use of social data for credit decisions"

#### Slide 52: Contact Management

**Pakistan enrichment:**
- "Solve SMS fatigue: implement unified contact management across all outbound channels"
- "Pakistan-specific: coordinate SBP-mandated notifications (OTP, transaction alerts) with marketing messages to avoid overload"
- "Target: reduce opt-out rate by 40% through intelligent contact frequency management"

#### Slides 53-54: Omni-Channel CX Optimization / Engagement

**Pakistan enrichment:**
- "Unify customer interaction history across branch, ATM, mobile app, internet banking, contact center, USSD, agent network, RAAST"
- "Enable seamless handoff: customer starts loan application on mobile, continues at branch, gets approval via SMS"

#### Slides 55-56: Location Based Offers / GIS + Telcos

**Pakistan enrichment:**
- "Pakistan telco partnerships (Jazz, Telenor, Zong, Ufone) can provide anonymized location data for targeted offers"
- "Use cases: branch proximity offers, shopping mall POS cashback, airport travel card promotion, petrol station fuel card offer"
- "Privacy consideration: SBP and PTA guidelines on location data usage"

#### Slide 57: RTIM and Real-Time

**Pakistan enrichment:**
- "Real-time interaction management is the aspirational target for Pakistan banking — currently batch-only"
- "First steps: real-time RAAST event triggers, mobile app in-session offers, ATM screen personalization"

#### Slide 58: Web/IVR Breakout

**Pakistan enrichment:**
- "Analyze IVR breakout patterns — when customers press 0 to speak to agent, what were they trying to do? Fix the IVR for those journeys."
- "Urdu IVR optimization — many customers struggle with English-only IVR menus"

#### Slide 59: Complaints Process Optimisation

**Pakistan enrichment:**
- "SBP mandates complaint resolution within defined SLAs. Optimizing complaint routing and resolution reduces regulatory risk."
- "Categorize complaints per SBP Consumer Protection framework: unauthorized transactions, service charges, digital banking failures, ATM issues, staff behavior"

#### Slide 60: Onsite Search Engine Optimization

**Pakistan enrichment:**
- "Optimize bank website internal search for Urdu and Roman Urdu queries"
- "Most Pakistan bank websites return zero results for Urdu product searches"

#### Slide 61: Customized "Amount" Button

**Pakistan enrichment:**
- "Personalize quick-transfer amounts on mobile app based on customer's most frequent transfer amounts"
- "Pakistan specific: utility bill amounts, school fee amounts, regular RAAST transfer amounts"

#### Slide 62: Enhanced NBA Contact Strategy

**Pakistan enrichment:**
- "Islamic-aware NBA: never recommend conventional products to Islamic-preference customers"
- "Salary-day NBA: cross-sell within 24 hours of salary credit detection"
- "Ramadan NBA: Zakat, Islamic investment, and charity-focused offers during holy month"

#### Slides 63-64: Next Best Product Offer / Product Bundling

**Pakistan enrichment:**
- "Pakistan product bundles: Salary Package (CASA + credit card + personal loan), Home Package (home finance + insurance + home furnishing loan), Islamic Package (Islamic CASA + Takaful + Islamic FD)"
- "Diaspora Bundle: Roshan Digital Account + NPC + property investment + family remittance"

#### Slide 65: Individualized Merchants Recommendation

**Pakistan enrichment:**
- "Recommend merchants based on Pakistan-specific categories: grocery (Imtiaz, Chase Up), fuel (PSO, Shell), dining, mobile recharge"
- "Partner with merchant networks for cashback offers driving card usage"

#### Slide 66: Advertising Creative Optimization

**Pakistan enrichment:**
- "Test Urdu vs. English vs. bilingual creative across digital channels"
- "Optimize for Pakistan's mobile-first audience: vertical video, short-form content, WhatsApp-compatible formats"

#### Slide 67: Competitor Analysis

**Pakistan enrichment:**
- "Monitor competitor product launches, rate changes, and digital features"
- "Key competitors to track: Big 5 banks, Meezan Bank (Islamic leader), SadaPay/NayaPay (fintech), digital bank licensees"
- Source Data ADD: "SBP published data (deposits, advances by bank), app store analytics, social media monitoring"

#### Slides 68-69: Marketing Attribution / Attribution

**Pakistan enrichment:**
- "Build attribution across Pakistan's offline-heavy marketing mix: TV 35%, outdoor 20%, print 15%, digital 15%, direct 10%, agent 5%"
- "Start with digital attribution (UTM tracking) then expand to cross-channel"
- "Merge slides 68-69 if content overlaps significantly"

---

## TERADATA BRANDING REMOVAL — GLOBAL RULES

Apply to ALL 69 slides:

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" (standalone) | Remove or "Enterprise Analytics Platform" |
| IC names ("Andrew Johnston", "CK Loy", "Vince Leat", etc.) | "Banking Industry Best Practice" or remove |
| Triangle color legend in Notes | Replace with Pakistan context + FSDM mapping |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |
| "Marcom Central" references | REMOVE |

---

## FINAL OUTPUT STRUCTURE (72+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Use Case Portfolio Dashboard** | **NEW** |
| **2** | **Pakistan Use Case Applicability** | **NEW** |
| 3 | SECTION: Customer Information Management | Updated |
| 4 | Multi-Dimensional Customer View | Enriched |
| 5 | SECTION: Insight Driven Customer Management | Updated |
| 6-40 | 35 Insight-Driven use cases | All enriched |
| 41 | SECTION: Customer Lifecycle Management | Updated |
| 42-51 | 10 Lifecycle use cases | All enriched |
| 52 | SECTION: Customer Interaction Management | Updated |
| 53-71 | 19 Interaction use cases | All enriched |
| **72** | **Implementation Roadmap** | **NEW** |

---

## VISUAL QA CHECKLIST

```bash
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide
```

```
No text overflow in any use case field
All 7 fields visible on every use case slide
Font >= 10pt in all fields
No Teradata IC names visible
No Teradata triangle color legend in notes
Pakistan context added to every use case
Speaker notes have FSDM entity references
3 new slides present
Footer correct, page numbers sequential
No "Marcom Central" references
Consistent theme throughout all 72+ slides
```
