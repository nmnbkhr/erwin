# PROMPT 6P: File 11 — Product Management Use Cases

## Role

You are a senior banking product strategy consultant and presentation specialist. You are rebuilding BVF PowerPoint File 11, which contains 15 use cases for the Product Management domain. You have deep expertise in Pakistan banking products (CASA, lending, cards, Islamic), product analytics, competitive pricing, and digital banking product management.

---

## Source File

```
INPUT:  ./11_Product_Management_Use_Cases.pptx  (17 slides)
OUTPUT: ./pptout/11_Product_Management_Use_Cases_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

17 slides: 1 section divider + 15 use case slides (some banking-specific, some insurance/telco — rewrite non-banking) + 1 Discover case study (Teradata client — REMOVE/REPLACE).

**Work required:**
1. Add Pakistan banking product context to ALL use cases
2. Rewrite insurance/telco use cases for banking applicability
3. Replace Teradata case study (slide 17) with Pakistan banking product analytics summary
4. Remove IC owner names and Teradata references
5. Add 3 new supplementary slides
6. Map FSDM entities to each use case in speaker notes

---

## EXISTING SLIDE STRUCTURE (17 Slides)

| Slide | Section | Title | Banking Relevance |
|-------|---------|-------|-------------------|
| 1 | — | **SECTION DIVIDER** — Product Management Use Cases | — |
| 2 | Product Development | Product Development and Packaging | **HIGH** — Direct banking |
| 3 | Product Development | Relationship Mgt. and Optimization (Product Usage) | **HIGH** — Banking graph analytics |
| 4 | Product Development | Merchant Acquiring Insights | **HIGH** — Card acquiring |
| 5 | Product Development | Credit/Debit Card Spend Stimulation | **CRITICAL** — Pakistan cards |
| 6 | Product Development | Individualized Merchants Recommendation | **HIGH** — Card merchant offers |
| 7 | Product Development | Improvement in Risk Scoring Models | **CRITICAL** — ECIB + transactional |
| 8 | Product Development | Multivariate Testing (page 1) | **HIGH** — Digital banking A/B |
| 9 | Product Development | Multivariate Testing (page 2 — analytics) | **HIGH** — Continued |
| 10 | Product Introduction | Competitor Analysis | **HIGH** — Banking competition |
| 11 | Pricing & Promotion | Advanced Risk and Pricing Insights | **MEDIUM** — Rewrite from insurance→banking |
| 12 | Pricing & Promotion | Behavioral-Based Pricing with Telematics Data | **LOW** — Rewrite from auto insurance→banking |
| 13 | Pricing & Promotion | Credit Risk Models for 'New-to-Lending' | **CRITICAL** — Financial inclusion |
| 14 | Product Performance | Understanding Sales Across All Channels (page 1) | **HIGH** — Omni-channel banking |
| 15 | Product Performance | Understanding Sales Across All Channels (page 2) | **HIGH** — Continued |
| 16 | Product Performance | Compare Portfolio to Benchmark | **HIGH** — Wealth management |
| 17 | — | Discover Case Study | **REMOVE** — Teradata client |

---

## USE CASE SLIDE FORMAT

Same 7-field format as File 06 and File 09:
```
1. Objective / Problem Statement
2. Business Benefit
3. Source Data
4. Methodology / Analytic Technique
5. Expected Outcome
6. Challenges
7. Success Criteria
```

Plus: Owner/References (Teradata IC names — REMOVE), Notes (triangle legend — REPLACE).

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Use Case Portfolio Dashboard (insert as slide 1)

**"Product Management Use Cases — Portfolio Dashboard"**

| Section | Use Cases | Priority |
|---|---|---|
| Product Development (7 UCs) | Development & Packaging, Relationship Optimization, Merchant Acquiring, **Card Spend Stimulation**, Merchant Recommendation, **Risk Scoring Improvement**, Multivariate Testing | Critical: Card Spend, Risk Scoring |
| Product Introduction (1 UC) | Competitor Analysis | High |
| Pricing & Promotion (3 UCs) | Risk-Based Pricing, **Behavioral Pricing**, **New-to-Lending Credit Models** | Critical: New-to-Lending |
| Product Performance (3 UCs) | **Omni-Channel Sales**, Portfolio Benchmark | High: Omni-Channel |
| **TOTAL** | **15 Use Cases** (1 case study removed) | |

Pakistan Priority Matrix:
```
IMMEDIATE (0-6 months):  Card Spend Stimulation, Risk Scoring Improvement, Credit Models for
                         New-to-Lending, Competitor Analysis, Omni-Channel Sales Understanding
HIGH (6-18 months):      Merchant Acquiring Insights, Merchant Recommendation, Behavioral Pricing,
                         Product Development & Packaging, Multivariate Testing
STRATEGIC (18-36 months): Relationship Optimization (Graph), Portfolio Benchmark (Wealth),
                          Advanced Risk-Based Pricing
```

### NEW Slide B: Pakistan Context (insert as slide 2)

**"Pakistan Banking — Product Use Case Priorities"**

```
USE CASES WITH HIGHEST PAKISTAN IMPACT:

1. CREDIT RISK MODELS FOR NEW-TO-LENDING (Slide 13)
   Why: 70% of Pakistan population has no credit bureau history — cannot access formal lending
   Pakistan data: Mobile wallet transaction patterns (JazzCash/Easypaisa), utility payment history,
                  RAAST P2P patterns, employer salary credits, NADRA demographic data
   Impact: Expand lending to 50M+ previously unbanked — SBP financial inclusion priority

2. CARD SPEND STIMULATION (Slide 5)
   Why: Pakistan has 30M+ debit cards but <30% are actively used for POS purchases
   Pakistan data: Card transaction data (POS, ATM, e-commerce), merchant category codes,
                  1Link switch data, customer demographics from FSDM
   Impact: Shift cash transactions to card — increase interchange revenue PKR 5-10B industry-wide

3. RISK SCORING IMPROVEMENT (Slide 7)
   Why: Current scoring models use limited variables. Adding transactional behavior from FSDM
        can improve Gini coefficient by 10-20%
   Pakistan data: ECIB bureau data + FSDM transactional patterns (salary regularity, spending
                  behavior, balance trends, RAAST usage, merchant category patterns)

4. COMPETITOR ANALYSIS (Slide 10)
   Why: Intense competition from 33+ banks + 5 Islamic + JazzCash/Easypaisa/SadaPay/NayaPay
   Pakistan data: Competitor product features, rate sheets, app store reviews, social media sentiment

5. OMNI-CHANNEL SALES (Slides 14-15)
   Why: Product sales fragmented across branch, mobile, internet, agent, call center — no unified view
   Pakistan data: FSDM channel data + mobile app analytics + branch sales register + agent network
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Product Management Use Cases — Implementation Roadmap"**

```
Phase 1: Quick Wins (0-6 months) — 5 use cases
  Card Spend Stimulation, Risk Scoring Improvement, Credit Models for New-to-Lending,
  Competitor Analysis, Omni-Channel Sales Understanding
  Investment: PKR 40-80M | Data: FSDM + ECIB + card transaction data
  Quick Win: 15% increase in card activation rate, 10% expansion of lending eligibility

Phase 2: Product Intelligence (6-18 months) — 5 use cases
  Merchant Acquiring Insights, Individualized Merchant Recommendation,
  Behavioral-Based Pricing, Product Development & Packaging, Multivariate Testing
  Investment: PKR 80-150M | Data: + merchant data + digital funnel + A/B testing framework
  Expected: 20% improvement in card interchange revenue, data-driven product pipeline

Phase 3: Advanced Product Analytics (18-36 months) — 5 use cases
  Relationship Optimization (Graph), Portfolio Benchmark (Wealth),
  Advanced Risk-Based Pricing, + new use cases from product roadmap
  Investment: PKR 100-200M | Data: + graph analytics + market data feeds
  Expected: Dynamic product pricing, predictive product lifecycle management
```

---

## SLIDE-BY-SLIDE ENRICHMENT

### Slide 2: Product Development and Packaging

**Pakistan enrichment:**
- Objective ADD: "Design new banking products aligned with Pakistan market needs: digital-first accounts, Islamic product variants, financial inclusion products, Roshan Digital Account extensions, green banking products."
- Source Data ADD: "FSDM customer/transaction data, SBP financial inclusion survey, mobile app usage patterns, RAAST adoption data, competitor product analysis, Islamic banking demand indicators"
- Methodology ADD: "Product usage clustering (identify unmet needs), propensity modeling for new product adoption, cannibalization analysis (will new product erode existing?)"
- Outcome ADD: "Data-driven product pipeline: 3-5 new products/year based on analytics, not intuition. Reduced product failure rate from ~40% to <20%."
- Challenges ADD: "SBP product approval timeline (4-8 weeks), Islamic Shariah board approval, core banking configuration across 4-5 systems"

**Speaker Notes:**
```
PAKISTAN PRODUCT DEVELOPMENT PRIORITIES:
1. DIGITAL-FIRST: Account opening via selfie + CNIC, instant nano-lending (PKR 5K-50K), QR merchant payments
2. ISLAMIC VARIANTS: Every conventional product needs Islamic equivalent — many gaps exist
3. FINANCIAL INCLUSION: SBP mandate for Basic Banking Account, Asaan Mobile Account, agent banking products
4. ROSHAN DIGITAL: Extensions for overseas Pakistanis (Naya Pakistan Certificate, stock market access, home finance)
5. SME PRODUCTS: Digital onboarding, supply chain finance, invoice discounting
6. GREEN BANKING: SBP green taxonomy products — green loans, green deposits

FSDM: PRDCT (Product), PRDCT_FTRE (Product Feature), PRDCT_DSGN (Product Design), MKT_ND (Market Need), CSTMR_SGMNT (Customer Segment)
BVF Capability: Product Development > Research New Product Opportunities (File 10, Slides 21-22)
```

---

### Slide 3: Relationship Management and Optimization (Product Usage)

**Pakistan enrichment:**
- Objective ADD: "Analyze relationships between banking objects — customer ↔ product ↔ channel ↔ branch ↔ RM ↔ transaction — using graph analytics to identify optimization opportunities."
- "Pakistan banking: understand which RM behaviors drive higher product adoption. Identify why certain branches have 3x products/customer vs. others."
- Source Data ADD: "FSDM: customer-product holdings, transaction patterns, channel usage, RM assignment, branch allocation, product lifecycle events"
- Methodology ADD: "Graph analysis on FSDM relationship data, RM productivity benchmarking, product affinity network analysis"
- Outcome ADD: "Optimize RM-customer allocation for maximum cross-sell, identify successful RM behaviors for training/replication"

**Speaker Notes:**
```
PAKISTAN CONTEXT:
RM effectiveness varies enormously in Pakistan banks:
- Top 10% of RMs generate 3-5x products/customer vs. average
- Graph analysis can reveal: which product sequencing works, which RM behaviors drive adoption, which branch configurations produce best results
- Challenge: RM data (assignments, interactions) often not captured systematically in core banking systems — FSDM can integrate CRM + core banking + call center data

FSDM: IP_RLTNP (Inter-Party Relationship), CSTMR_PRDCT (Customer-Product), RM_ALLCTN (RM Allocation), GRP_ANLYS (Graph Analysis)
```

---

### Slide 4: Merchant Acquiring Insights

**Pakistan enrichment:**
- Objective ADD: "Leverage card transaction data to provide merchant acquirers (banks operating POS networks) with customer insights. Pakistan's POS network is growing rapidly — 100,000+ terminals."
- "New revenue opportunity: monetize aggregated card transaction analytics for merchant business insights (footfall patterns, average ticket size, competitive share-of-wallet)"
- Source Data ADD: "Card transaction data from FSDM, merchant category codes (MCC), merchant location data, 1Link POS switch data, customer demographics"
- Outcome ADD: "New fee income from merchant analytics services, increased POS terminal deployment, merchant loyalty through value-added insights"

**Speaker Notes:**
```
PAKISTAN MERCHANT ACQUIRING:
Pakistan POS landscape:
- 100,000+ POS terminals (growing rapidly with SBP push for digital payments)
- Major acquirers: HBL, MCB, UBL, Allied, Bank Alfalah
- Visa/Mastercard interchange: 1.5-2.5% — bank earns acquiring share
- Opportunity: Sell anonymized, aggregated spending insights to merchants (like Visa Analytics, MC SpendingPulse)
- Example: "Your restaurant's average ticket is PKR 2,500, 30% below area average — opportunity to upsell"

FSDM: MRCHNT (Merchant), MRCHNT_TXN (Merchant Transaction), MCC (Merchant Category Code), INTRCHNG (Interchange), POS_TRML (POS Terminal)
```

---

### Slide 5: Credit/Debit Card Spend Stimulation — CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Pakistan has 30M+ debit cards but <30% are actively used for POS purchases (most used only for ATM cash withdrawal). Stimulate card spend to increase interchange revenue and reduce cash handling cost."
- "Identify dormant/low-usage cardholders with high spending potential. Match with relevant merchant offers."
- Source Data ADD: "Card transaction data (ATM vs. POS vs. e-commerce split), customer FSDM profile, salary credit data (spending capacity indicator), merchant category preferences, previous offer response data"
- Methodology ADD: "Collaborative filtering (customers with similar profiles who spend more → target non-spenders), propensity to activate POS usage, merchant offer matching"
- Outcome ADD: "Target: activate 30% of dormant POS cards, increase average POS spend by 25% in targeted segment. Revenue impact: PKR 2-5B additional interchange industry-wide."

**Speaker Notes:**
```
PAKISTAN CARD SPEND:
The card spend opportunity in Pakistan is massive:
- 30M+ debit cards issued, but >70% used ONLY for ATM cash withdrawal
- Credit card base ~3M with ~60% active — low by global standards
- Cash-on-delivery still dominates e-commerce (70%+)
- SBP pushing digital payments: RAAST QR, POS incentives

Stimulation strategies:
1. Cashback on first POS transaction (activate dormant cards)
2. Merchant-specific offers based on spending patterns (collaborative filtering)
3. Salary-day spend stimulation (within 48 hours of salary credit)
4. Category spend challenges (spend PKR 10K at restaurants → get PKR 500 cashback)
5. EMI conversion offers (convert large purchases to installments — increases revolving revenue)

Data requirements: Full card transaction history, merchant data, customer demographics, salary patterns.

FSDM: CRD (Card), CRD_TXN (Card Transaction), POS_TXN (POS Transaction), ATM_TXN (ATM Transaction), MRCHNT_OFFR (Merchant Offer), INTRCHNG (Interchange)
```

---

### Slide 6: Individualized Merchants Recommendation

**Pakistan enrichment:**
- Objective ADD: "Recommend relevant merchants to individual cardholders based on spending patterns, location, preferences. Increase card usage frequency and average spend."
- Source Data ADD: "FSDM card transaction data by MCC and merchant, customer location (branch, home address), spending pattern history, merchant location data"
- Outcome ADD: "Personalized merchant recommendations via mobile app push notification, SMS, or in-app widget. Target: 10-15% increase in card transaction frequency."

---

### Slide 7: Improvement in Risk Scoring Models — CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Enhance ECIB-based credit scoring with transactional behavior data from FSDM. Pakistan's ECIB has limited data for many customers (thin-file or new-to-bureau). Adding behavioral indicators from transactions dramatically improves predictive power."
- Source Data ADD: "ECIB bureau data, FSDM: salary credit regularity, balance volatility, RAAST/IBFT outflow patterns, merchant spend categories, overdraft frequency, cheque bounce history, mobile app login frequency"
- Methodology ADD: "Build enhanced scorecards: traditional credit variables + behavioral variables from FSDM. Test with out-of-sample validation. Champion/challenger deployment."
- Outcome ADD: "Improve Gini coefficient by 10-20%, reduce false rejection rate by 15-25%, enable lending to 'thin-file' customers previously declined"

**Speaker Notes:**
```
PAKISTAN RISK SCORING:
Current state: Most Pakistan banks use ECIB score + basic internal rating.
Challenge: ECIB has limited history for 70%+ of population (new-to-bureau or thin-file).

FSDM-enhanced variables that improve scoring:
1. SALARY REGULARITY: Is salary credited consistently? Amount trend up/down?
2. BALANCE BEHAVIOR: Average balance trend, minimum balance, balance volatility
3. TRANSACTION PATTERNS: Regular bill payments (disciplined), frequent ATM withdrawals (cash-dependent)
4. RAAST/IBFT: Outflow pattern — regular payments suggest obligations, erratic suggest instability
5. MERCHANT SPEND: Spend categories reveal lifestyle/income level
6. DIGITAL ENGAGEMENT: App login frequency, bill payment regularity
7. RELATIONSHIP DEPTH: Products held, tenure, cross-sell response history
8. OVERDRAFT BEHAVIOR: Frequency, amount, recovery speed

These variables are available in FSDM but NOT in ECIB bureau data — unique competitive advantage for banks with integrated data warehouses.

FSDM: RSK_SCR (Risk Score), BHVRL_SCR (Behavioral Score), ECIB_SCR (ECIB Score), PD (Probability of Default), SCRCRD (Scorecard), MDLNG (Modeling)
BVF Reference: File 12-13 Risk Management, File 08-09 Profitability (risk-adjusted pricing)
```

---

### Slides 8-9: Multivariate Testing

**Pakistan enrichment:**
- Objective ADD: "A/B and multivariate testing for Pakistan digital banking: test mobile app product screens, lending application flow, deposit rate display, card offer placement, onboarding funnel optimization."
- "Pakistan context: digital banking is early stage — A/B testing can yield 20-50% improvement in conversion rates because baseline is unoptimized."
- Source Data ADD: "Mobile app event data, internet banking clickstream, onboarding funnel data, digital sales conversion data"
- Outcome ADD: "Evidence-based digital UX optimization, reduced onboarding dropoff (target: from 40-60% to <20%), improved digital product cross-sell conversion"

---

### Slide 10: Competitor Analysis

**Pakistan enrichment:**
- Objective ADD: "Monitor 33+ commercial banks, 5 full Islamic banks, 11 microfinance banks, and fintechs (JazzCash, Easypaisa, SadaPay, NayaPay, TAG) — their products, pricing, features, marketing, and customer sentiment."
- Source Data ADD: "Competitor websites, app store reviews (Google Play), SBP published data (rates, financials), social media (Twitter, Facebook), job postings (indicate strategic direction), annual reports"
- Methodology ADD: "NLP/text analytics on competitor reviews and social media, rate comparison dashboards, feature gap analysis, market share trend tracking (SBP data)"
- Outcome ADD: "Quarterly competitor intelligence report, real-time rate comparison alerts, product gap identification, fintech threat assessment"

**Speaker Notes:**
```
PAKISTAN COMPETITIVE LANDSCAPE:
Direct competitors: HBL, MCB, UBL, Allied, Bank Alfalah, Meezan (Islamic), Bank Islami
Fintech disruptors: JazzCash (50M+ users), Easypaisa (40M+), SadaPay, NayaPay, TAG
International: Standard Chartered, Citibank (exited retail)

Key competitive dimensions:
1. DEPOSIT RATES: Savings rate, FD rates by tenor — published by SBP
2. LENDING RATES: Personal loan markup, home finance rate, credit card rate
3. DIGITAL EXPERIENCE: App rating (Google Play), feature set, onboarding speed
4. BRANCH NETWORK: Coverage, quality, operating hours
5. ISLAMIC PRODUCTS: Range, Shariah compliance reputation
6. CUSTOMER SERVICE: NPS, complaint resolution (SBP publishes complaint data)

FSDM: CMPTTR (Competitor), CMPTTR_PRDCT (Competitor Product), MKT_SHR (Market Share), BNCHMRK (Benchmark)
```

---

### Slide 11: Advanced Risk and Pricing Insights — REWRITE FROM INSURANCE

**FULL REWRITE — currently property insurance (hurricane/storm surge). Rewrite for banking:**

- **New Title:** "Advanced Risk-Based Pricing Analytics"
- Objective: "Use granular risk data to price lending products more accurately than standard KIBOR + flat spread. Differentiate pricing by customer risk profile, collateral quality, sector risk, and geographic risk."
- Source Data: "ECIB credit scores, FSDM behavioral risk indicators, collateral valuation data, sector performance data (SBP sector-wise NPL data), geographic risk data (flood zone, security zone), macroeconomic forward indicators"
- Methodology: "Risk-based pricing models combining PD (from enhanced scorecard) × LGD (from collateral and recovery data) × EAD to set minimum risk-adjusted price. Overlay with competitive pricing intelligence."
- Outcome: "Risk-adjusted lending rates that properly compensate for credit risk, reduced adverse selection, improved portfolio risk-return trade-off"

**Speaker Notes:**
```
PAKISTAN RISK-BASED PRICING:
Currently: Most Pakistan banks price lending as KIBOR + flat spread by segment. A corporate customer with AA rating pays similar rate to BBB customer in same segment.

Target: Granular risk-based pricing where:
- Rate = Cost of Funds (FTP) + Operating Cost (ABC) + Expected Loss (PD × LGD) + Capital Charge + Target Margin
- Each component calculated per individual customer
- Result: Low-risk customers get competitive rates (retain against competitors), high-risk customers are priced for risk (or declined)

Impact: 20-50bps NIM improvement, reduced adverse selection, better risk-adjusted returns.

FSDM: RSK_PRCNG (Risk-Based Pricing), PD (PD), LGD (LGD), EAD (EAD), RSK_PREMM (Risk Premium), FTP_RT (FTP Rate)
```

---

### Slide 12: Behavioral-Based Pricing with Telematics Data — REWRITE FROM AUTO INSURANCE

**FULL REWRITE — currently auto insurance telematics. Rewrite for banking behavioral pricing:**

- **New Title:** "Behavioral-Based Product Pricing"
- Objective: "Price banking products based on actual customer behavior rather than static attributes. Reward positive financial behavior with better pricing."
- "Pakistan context: reward customers who maintain stable balances (lower deposit cost), who transact digitally (lower cost-to-serve), who use products across categories (higher lifetime value)"
- Source Data: "FSDM behavioral data: balance stability (coefficient of variation), digital transaction ratio, product breadth, payment punctuality, salary credit consistency"
- Methodology: "Behavioral scoring models that create dynamic pricing tiers, updated monthly based on trailing 6-month behavior"
- Expected Outcome: "Better customer retention through fairness-based pricing, reduced cost-to-serve by incentivizing digital behavior, improved NIM through behavioral segmentation"
- Challenges: "SBP minimum rate constraints, customer communication of dynamic pricing, system capability for frequent rate changes"

**Speaker Notes:**
```
PAKISTAN BEHAVIORAL PRICING:
Example applications:
1. SAVINGS RATE: Customers who maintain stable monthly balance get 50bps premium on savings rate
2. LENDING RATE: Customers with 12+ months perfect repayment get 100bps reduction on next loan
3. CARD FEES: Heavy digital spenders get annual fee waiver (lower cost-to-serve justifies it)
4. ACCOUNT FEES: Customers who go fully digital (no branch visits) get zero maintenance fee
5. FD RATES: Customers with 3+ products get loyalty premium on FD rate (retention value justifies cost)

Behavioral variables from FSDM:
- Balance stability index (low volatility = lower funding risk = reward)
- Digital transaction ratio (higher digital = lower cost = reward)
- Product breadth score (more products = lower churn risk = reward)
- Payment discipline score (on-time payments = lower credit risk = reward)
- Relationship tenure (longer = more predictable = reward)

FSDM: BHVRL_SCR (Behavioral Score), BHVRL_PRCNG (Behavioral Pricing), CSTMR_BHVR (Customer Behavior), PRCNG_TR (Pricing Tier)
```

---

### Slide 13: Credit Risk Models for 'New-to-Lending' Customers — CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Pakistan has 150M+ adults with no formal credit history. Build credit models using alternative data to enable lending to the unbanked and underbanked — SBP financial inclusion mandate."
- Source Data ADD: "Mobile wallet transaction data (JazzCash/Easypaisa), utility payment history (K-Electric, SSGC, SNGPL), telecom usage/payment data (Jazz, Telenor, Zong), RAAST P2P patterns, NADRA demographic data, employer verification, social media (with consent)"
- Methodology ADD: "Alternative data credit scoring: ML models trained on default outcomes of thin-file customers who were subsequently lent to. Feature engineering from mobile wallet and utility payment regularity."
- Outcome ADD: "Expand addressable lending market from 30M (current bank customers) to 80M+ (include mobile wallet users). Enable nano-lending (PKR 5K-50K) via digital channel."

**Speaker Notes:**
```
PAKISTAN NEW-TO-LENDING:
This is THE most impactful use case for Pakistan financial inclusion:

THE PROBLEM:
- 150M+ adults, only ~60M have bank accounts, only ~20M have credit bureau history
- ECIB data is insufficient to score 80%+ of the population
- Result: Banks lend only to salaried/documented sector (20-30% of workforce)
- 70% informal sector is excluded from formal credit

THE SOLUTION:
Alternative data sources available in Pakistan:
1. MOBILE WALLETS: JazzCash (50M+) and Easypaisa (40M+) have transaction histories — payment regularity, balance patterns, peer-to-peer behavior
2. TELECOM: 190M+ mobile connections — top-up patterns, call behavior, data usage correlate with income stability
3. UTILITY PAYMENTS: K-Electric, SSGC, SNGPL, WASA — regular payment = financial discipline
4. RAAST: Growing P2P transaction data — can infer income, spending patterns
5. NADRA: Demographic data (age, location, family size) — can inform risk segmentation

MODEL APPROACH:
- Train on existing customers where outcome (default/non-default) is known
- Engineer features from alternative data
- Validate on out-of-sample population
- Deploy with small initial credit limits, expand based on repayment behavior
- Champion/challenger: traditional model vs. alternative data model

IMPACT: If even 10% of unbanked adults get access to PKR 50K credit, that's PKR 750B+ in new lending opportunity.

FSDM: ALTNTV_DATA (Alternative Data), CRDTH_SCR (Credit Score), MOBL_WLT (Mobile Wallet), UTLTY_PMT (Utility Payment), THNFL (Thin File)
```

---

### Slides 14-15: Understanding Sales Across All Channels

**Pakistan enrichment:**
- Objective ADD: "Unified view of product sales across all Pakistan banking channels: branch (16,000+), mobile app, internet banking, call center, agent network (branchless), ATM/kiosk, employer partnership (salary accounts), RAAST onboarding."
- Source Data ADD: "FSDM: product origination channel tag, branch sales register, mobile app funnel data, internet banking applications, call center lead data, agent network transaction data"
- Outcome ADD: "Channel-level product sales dashboard: which products sell on which channels? Where are the dropoffs? Which channels are cannibalizing (intended or not)?"

---

### Slide 16: Compare Portfolio to Benchmark

**Pakistan enrichment:**
- Objective ADD: "Pakistan's wealth management is nascent — bank financial advisors manage customer investment portfolios (mutual funds, government securities, equities, insurance). Compare customer portfolio allocation to age/risk-appropriate benchmarks."
- "Pakistan context: National Savings Certificates dominate retail investment — banks need to offer competitive alternatives. SECP-regulated mutual fund industry growing (PKR 1.5T+ AUM)."
- Source Data ADD: "Customer investment holdings (FSDM), age/risk profile, benchmark portfolio models, market data (PSX, mutual fund NAVs), National Savings rates"
- Outcome ADD: "Advisor-facing portfolio comparison tool, automated alerts for out-of-benchmark portfolios, product recommendation engine"

---

### Slide 17: Discover Case Study — REPLACE

**REPLACE Teradata Discover case study with:**

**"Pakistan Product Analytics — Success Metrics"**

```
PRODUCT MANAGEMENT ANALYTICS IMPACT (Pakistan Banking Targets):

Products per Customer:      1.8 → 2.5      (+39% revenue per customer)
Card POS Activation:        <30% → 50%     (PKR 3-5B additional interchange)
Digital Product Sales:      15% → 40%      (of total product originations)
Product Launch Cycle:       16 weeks → 8    (with data-driven development)
Cross-sell Response Rate:   <5% → 10%      (through analytics targeting)
New-to-Lending Coverage:    20M → 40M      (through alternative data models)
Product Failure Rate:       ~40% → <20%    (through business impact prediction)
Risk Scoring Accuracy:      +10-20% Gini   (through FSDM behavioral data)

INVESTMENT:  PKR 200-400M over 3 years
RETURN:      PKR 10-20B annually through revenue uplift + cost reduction
```

---

## TERADATA BRANDING REMOVAL

| Find | Replace |
|---|---|
| IC names ("Andrew Johnston", "Dominic Ligot", "Vince Leat", "Tim Dickson", "Yasmeen Ahmed", "Nick Campbell", "Simon Axon", "Terence Kong") | "Banking Industry Best Practice" or REMOVE |
| "Owner:" field with names | REMOVE |
| "Teradata" in text | REMOVE or "Enterprise Analytics Platform" |
| Triangle color legend in Notes | Replace with Pakistan context + FSDM |
| "RACE-type engagement" / "RACE Relevant" | REMOVE |
| Discover case study (Slide 17) | Replace with Pakistan success metrics slide |
| "Aster" / "nPath" / "Teradata tools" | "Advanced analytics platform" / "Path analysis" / "Analytics toolset" |

## CONTENT DENSITY RULES

Same as File 06/09. 7-field use case format. Strict limits per field, overflow to speaker notes.

## FINAL OUTPUT (19+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Use Case Portfolio Dashboard** | **NEW** |
| **2** | **Pakistan Product Use Case Priorities** | **NEW** |
| 3 | SECTION: Product Management Use Cases | Updated divider |
| 4-9 | 6 Product Development use cases | All enriched |
| 10-11 | 2 Multivariate Testing slides | Enriched |
| 12 | 1 Competitor Analysis | Enriched |
| 13 | Advanced Risk-Based Pricing | **REWRITTEN** from insurance |
| 14 | Behavioral-Based Product Pricing | **REWRITTEN** from telematics |
| 15 | Credit Risk Models for New-to-Lending | Enriched (critical) |
| 16-17 | 2 Omni-Channel Sales slides | Enriched |
| 18 | Portfolio Benchmark | Enriched |
| 19 | **Pakistan Product Analytics Metrics** | **REPLACED** (was Discover) |
| **20** | **Implementation Roadmap** | **NEW** |

## VISUAL QA CHECKLIST

```
No Teradata IC owner names visible
No Teradata tool references (Aster, nPath)
No insurance/telematics language (slides 11-12 fully rewritten)
Discover case study replaced with Pakistan metrics
Pakistan banking product context on every use case
Speaker notes with FSDM entity references + cross-references to File 10
3 new slides + 1 replacement = 4 changed slides
Font >= 10pt, no overflow
Consistent theme throughout
```
