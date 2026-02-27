# PROMPT 6N: File 09 — Finance & Performance Management Use Cases

## Role

You are a senior banking CFO advisory consultant and presentation specialist. You are rebuilding BVF PowerPoint File 09, which contains 31 use cases across the entire Finance & Performance Management domain — Accounting Operations, Enterprise Performance Management, Treasury Insight & Management, and Financial Reporting. You have deep expertise in Pakistan banking finance, SBP regulations, KIBOR/FTP, IFRS 9 ECL, Islamic accounting (AAOIFI), Basel III capital/liquidity, and UBL's FSDM-based Customer Profitability Engine.

---

## Source File

```
INPUT:  ./09_Finance_PM_Use_Cases.pptx  (32 slides — ALL have full content)
OUTPUT: ./pptout/09_Finance_PM_Use_Cases_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 32 slides have complete Teradata BVF use case content. 1 section divider + 31 use case slides. NO empty/placeholder slides.

**Work required:**
1. Add Pakistan banking finance context to EVERY use case
2. Add FSDM entity references to every use case speaker notes
3. Remove Teradata owner names (Lance Dacre, Jay Humphries, Bob Brady, David Rosal, etc.)
4. Fix content overflow in dense use case slides
5. Add 3 new supplementary slides
6. Remove/replace all Teradata branding

---

## Reference Data

```
./OVERVIEW.md                                       # FSDM domains, BVF structure
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
```

---

## EXISTING SLIDE STRUCTURE (32 Slides)

### USE CASE SLIDE FORMAT (Consistent across all 31 use case slides)

Every use case slide has 7 fields:
```
1. Objective / Problem Statement
2. Business Benefit
3. Source Data
4. Methodology / Analytic Technique
5. Expected Outcome
6. Challenges
7. Success Criteria
```

Plus: "Owner" field (contains Teradata consultant names — REMOVE) and Notes (contain Teradata triangle color legend or RACE engagement references — REMOVE/REPLACE).

---

### Section 1: Accounting Operations & Close (Slides 1-12)

| Slide | Title |
|-------|-------|
| 1 | **SECTION DIVIDER** — Finance and Performance Management Use Cases |
| 2 | Vendor Analytics |
| 3 | Payables Analytics |
| 4 | Procure to Pay Optimization |
| 5 | Accounting Hub / Sub Ledger |
| 6 | Valuation of Intangible Assets |
| 7 | Fixed Asset Utilization Optimization |
| 8 | Asset Backed Securitization (ABS) |
| 9 | Reconciliation Process |
| 10 | Consolidation Optimization |
| 11 | Close Process Optimization |
| 12 | Accelerated Financial Data Acquisition |

### Section 2: Enterprise Performance Management (Slides 13-20)

| Slide | Title |
|-------|-------|
| 13 | Revenue Analytics Optimisation |
| 14 | HR Analytics Optimization |
| 15 | Activity Based Costing |
| 16 | Risk Adjusted Return on Capital (RAROC) |
| 17 | Profitability Analytics |
| 18 | Individual Loan Price Optimisation |
| 19 | Performance Management & KPI Factory |
| 20 | Budget & Forecasting Process Improvement |

### Section 3: Treasury Insight & Management (Slides 21-25)

| Slide | Title |
|-------|-------|
| 21 | Cash Flow Optimization |
| 22 | Reserve Portfolio Optimization |
| 23 | Asset & Liability Management — Treasury Ops |
| 24 | Liquidity Management |
| 25 | Currency Hedge Analytics |

### Section 4: Financial Reporting (Slides 26-32)

| Slide | Title |
|-------|-------|
| 26 | External Reporting Support |
| 27 | Financial Reporting Efficiency and Effectiveness |
| 28 | Integrated Regulatory & Compliance Reporting |
| 29 | Sales Reporting & Analytics |
| 30 | Project Accounting — Cost Management |
| 31 | Internal — Exception Reporting |
| 32 | Executive Information Hub |

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Use Case Portfolio Dashboard (insert as slide 1)

**"Finance & PM Use Cases — Portfolio Dashboard"**

| Section | Use Cases | Pakistan Priority | Quick Wins | FSDM Domains |
|---|---|---|---|---|
| Accounting Operations (11 UCs) | Vendor, Payables, P2P, Sub-ledger, Assets, ABS, Reconciliation, Consolidation, Close, Data Acquisition | High | Close Process, Reconciliation, Sub-ledger Integration | GL, Account, Financial Instrument |
| EPM (8 UCs) | Revenue, HR, ABC, RAROC, Profitability, Loan Pricing, KPI, Budget | Critical | **Profitability Analytics**, **RAROC**, KPI Factory | Party, Product, Cost Center, Performance |
| Treasury (5 UCs) | Cashflow, Reserve Portfolio, ALM, Liquidity, Currency Hedge | Critical | **Liquidity Mgmt**, **ALM**, Cashflow Optimization | Financial Instrument, Market Data, Balance |
| Financial Reporting (7 UCs) | External, Efficiency, Regulatory, Sales, Project, Exception, Executive | High | **Regulatory Reporting**, Executive Dashboard | GL, Regulatory, Report |
| **TOTAL** | **31 Use Cases** | | | |

Pakistan Implementation Priority Matrix:
```
IMMEDIATE (0-6 months):  Reconciliation Process, Close Process Optimization, Profitability Analytics,
                         Regulatory & Compliance Reporting, Liquidity Management, KPI Factory
HIGH (6-18 months):      RAROC, ALM, Revenue Analytics, Activity Based Costing, Loan Price Optimization,
                         Budget & Forecasting, Consolidation, Executive Info Hub, Sales Reporting
STRATEGIC (18-36 months): Reserve Portfolio Optimization, Currency Hedge Analytics, ABS,
                          HR Analytics, Vendor Analytics, Project Accounting
```

### NEW Slide B: Pakistan Context — Finance Use Case Applicability (insert as slide 2)

**"Pakistan Banking — Finance Use Case Priorities"**

```
USE CASES WITH HIGHEST PAKISTAN IMPACT:

1. PROFITABILITY ANALYTICS (Slide 17)
   Why: <15% of Pakistan banks can calculate customer-level profitability
   Pakistan data: FSDM star schema — NII, fees, costs, provisions at individual customer level
   UBL: Customer Profitability Engine already built on FSDM — needs expansion and operationalization

2. RAROC (Slide 16)
   Why: SBP ICAAP requires risk-adjusted performance measurement — most banks use crude ROE
   Pakistan data: RWA by customer/product, IFRS 9 ECL, KIBOR-based FTP, capital allocation
   Impact: Enables capital optimization — redirect capital from low-RAROC to high-RAROC segments

3. LIQUIDITY MANAGEMENT (Slide 24)
   Why: SBP Basel III LCR/NSFR compliance, RAAST real-time settlement changes intraday dynamics
   Pakistan data: HQLA portfolio (PKR 10T+ in PIBs/T-Bills), deposit maturity profiles, RAAST flows

4. REGULATORY & COMPLIANCE REPORTING (Slide 28)
   Why: 30+ SBP statutory returns largely manual — consuming 40%+ of finance team bandwidth
   Pakistan data: GL, sub-ledger, customer, product data from 4-5 core banking systems

5. RECONCILIATION PROCESS (Slide 9)
   Why: 4-5 core systems generate fragmented GL — reconciliation consumes weeks per month-end
   Pakistan data: GL from multiple ERPs, RAAST/1Link/NIFT settlements, card network settlements

6. CLOSE PROCESS OPTIMIZATION (Slide 11)
   Why: Monthly close takes 15-30 days (vs. 3-5 day global benchmark)
   Pakistan data: All GL/sub-ledger data centralized in FSDM data warehouse
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Finance Use Cases — Implementation Roadmap"**

```
Phase 1: Foundation Use Cases (0-6 months) — 6 use cases
  Reconciliation Process, Close Process Optimization, Profitability Analytics,
  Regulatory & Compliance Reporting, KPI Factory, Liquidity Management
  Investment: PKR 60-120M | Data: FSDM warehouse + GL feeds from all core systems
  Quick Win: Close cycle from 30 days to 15 days, automated SBP top-5 returns

Phase 2: Performance Use Cases (6-18 months) — 12 use cases
  RAROC, Activity Based Costing, Revenue Analytics, Loan Price Optimization,
  ALM — Treasury Ops, Budget & Forecasting, Consolidation Optimization,
  Executive Information Hub, Sales Reporting, Financial Reporting Efficiency,
  Cashflow Optimization, Accounting Hub / Sub-ledger
  Investment: PKR 150-300M | Data: + ABC drivers + Treasury positions + HR data
  Expected: Customer/branch/product profitability, RAROC-based capital allocation

Phase 3: Advanced Use Cases (18-36 months) — 13 use cases
  Reserve Portfolio Optimization, Currency Hedge Analytics, ABS, Vendor Analytics,
  Payables Analytics, Procure to Pay, Fixed Asset Optimization, Intangible Assets,
  HR Analytics, Project Accounting, External Reporting, Exception Reporting,
  Accelerated Financial Data Acquisition
  Investment: PKR 200-400M | Data: + Market data feeds + External data + Unstructured
  Expected: Real-time treasury, predictive analytics, full process automation
```

---

## SECTION-BY-SECTION ENRICHMENT GUIDE

### SECTION 1: ACCOUNTING OPERATIONS & CLOSE (11 use cases)

#### Slide 2: Vendor Analytics

**Pakistan enrichment:**
- Objective ADD: "Pakistan banks manage 5,000-20,000 vendors across 16,000+ branches. Vendor analytics enables procurement consolidation, FBR WHT compliance, and vendor rationalization."
- Source Data ADD: "FBR Active Taxpayer List (ATL), vendor NTN/CNIC, WHT rate schedules, vendor bank account details for RAAST/RTGS payments"
- Outcome ADD: "Automated FBR WHT calculation at payment time, vendor performance scorecards, procurement spend visibility across group entities"
- Challenges ADD: "Decentralized procurement — many branches source locally without central oversight. FBR filer status changes monthly."

**Speaker Notes:**
```
PAKISTAN VENDOR ANALYTICS:
Vendor management in Pakistan banking is complex:
- Large banks manage 5,000-20,000 vendors (IT, construction, security, stationery, marketing, consulting)
- Procurement is often decentralized — branch managers make local purchase decisions
- FBR WHT: Every payment requires withholding tax deduction. Rates vary by vendor type and filer status:
  Services: 8% (filer) / 16% (non-filer), Supplies: 4% / 8%, Contracts: 7% / 14%
- ATL (Active Taxpayer List) must be checked monthly — vendor filer status changes
- Vendor consolidation opportunity: Multiple branches buying same items from different vendors at different prices

FSDM: VNDR (Vendor), PO (Purchase Order), INVCE (Invoice), PMT (Payment), WHT (Withholding Tax), VNDR_PRFMNC (Vendor Performance)
BVF Capability: Accounting Operations > Procurement & Payment (File 07, Slides 24-25)
```

---

#### Slide 3: Payables Analytics

**Pakistan enrichment:**
- Objective ADD: "Optimize accounts payable across all group entities — conventional bank, Islamic subsidiary, insurance/Takaful, AMC, brokerage."
- Source Data ADD: "AP sub-ledger from all ERPs, FBR WHT certificates, inter-company payables register"
- Outcome ADD: "Optimize payment timing to maximize float while meeting vendor terms, automate FBR WHT reporting"
- Challenges ADD: "Multiple ERP systems across group entities — no consolidated AP view"

**Speaker Notes:**
```
PAKISTAN AP CONTEXT:
Pakistan banking AP challenges:
- Multiple group entities, each with own ERP/accounting system
- WHT deduction and reporting creates manual overhead on every payment
- Inter-company payments between group entities (bank → insurance, bank → AMC) must be tracked for consolidation elimination
- Payment methods: cheque (still common for large vendors), RTGS (high value), RAAST (growing), bank transfer

FSDM: AP_BLNC (AP Balance), INVCE (Invoice), PMT (Payment), WHT (WHT), IC_PMT (Inter-Company Payment)
BVF Capability: Accounting Operations > Procurement & Payment
```

---

#### Slide 4: Procure to Pay Optimization

**Pakistan enrichment:**
- Objective ADD: "End-to-end P2P optimization: requisition → PO → goods receipt → invoice matching → payment → FBR WHT reporting"
- "In Pakistan, manual P2P processes create: duplicate payments, missed early-payment discounts, late WHT filings"
- Outcome ADD: "3-way match automation (PO-GRN-Invoice), reduced duplicate payments, improved vendor payment terms"

**Speaker Notes:**
```
PAKISTAN P2P:
Most Pakistan banks still use semi-manual P2P:
- Branch-initiated requisitions → regional approval → central procurement → PO → delivery → invoice → payment
- Manual 3-way matching creates delays and errors
- Early payment discounts typically lost due to process delays (15-20 days average invoice-to-payment)
- Audit trail often incomplete — difficult to trace from payment back to original requisition

FSDM: RQSTN (Requisition), PO (Purchase Order), GRN (Goods Receipt), INVCE (Invoice), PMT (Payment), P2P_PRCS (P2P Process)
```

---

#### Slide 5: Accounting Hub / Sub Ledger

**Pakistan enrichment — CRITICAL:**
- Objective ADD: "Create centralized accounting hub that generates sub-ledger entries from 4-5 core banking systems (CTL, Temenos, Oracle, Finacle) with consistent chart of accounts mapping."
- "Support dual IFRS + AAOIFI accounting for Islamic banking transactions from single operational transaction."
- Source Data ADD: "Core banking transaction data from all systems, Islamic banking sub-system, cards system, trade finance system, treasury system"
- Outcome ADD: "Single source of truth for all financial reporting. Transaction-level drill-down from GL to individual customer transactions."

**Speaker Notes:**
```
PAKISTAN ACCOUNTING HUB:
This is the foundational finance use case for Pakistan banks. Without a centralized accounting hub:
- 4-5 core banking systems post summary entries to GL independently
- No transaction-level sub-ledger data in the data warehouse
- Cannot drill from GL balance to individual customer transactions
- IFRS 9 ECL cannot be calculated at individual loan level
- Customer profitability cannot be computed
- Branch P&L is impossible

Implementation approach:
1. Define unified Chart of Accounts (CoA) mapping from all source system CoAs
2. Build accounting rules engine that generates sub-ledger entries from operational transactions
3. For Islamic transactions: generate dual entries (IFRS + AAOIFI) from single source transaction
4. Aggregate sub-ledger to GL postings with full lineage
5. Store in FSDM Financial Instrument and Accounting domains

UBL Context: FSDM data warehouse already integrates data from multiple core systems. The Accounting Hub use case formalizes the accounting entry generation and ensures auditability.

FSDM: ACCTNG_HUB (Accounting Hub), SUB_LDGR (Sub-Ledger), GL_PSTNG (GL Posting), COA (Chart of Accounts), ACCTNG_RULE (Accounting Rule), FIN_INSTRMT (Financial Instrument)
```

---

#### Slide 6: Valuation of Intangible Assets

**Pakistan enrichment:**
- Objective ADD: "Value banking intangible assets: core banking system licenses, customer relationships (for M&A valuation), brand value, goodwill from acquisitions"
- "Pakistan context: Several bank mergers/acquisitions in recent years (e.g., bank license consolidations) — intangible asset valuation critical for purchase price allocation"
- Challenges ADD: "Limited M&A valuation expertise in Pakistan banking, IFRS 3 compliance for business combinations"

**Speaker Notes:**
```
PAKISTAN: Bank M&A activity requires intangible asset valuation:
- Goodwill from acquisitions (historical mergers — HBL/Habib AG, MCB/Macquarie, etc.)
- Core banking system licenses (CTL, Temenos, Oracle — significant book value)
- Customer relationship value (for M&A due diligence and purchase price allocation)
- SBP minimum capital requirements are driving consolidation — more M&A expected

FSDM: INTNGBL_ASST (Intangible Asset), GDWLL (Goodwill), ASST_VLTN (Asset Valuation), AMRTZTN (Amortization)
```

---

#### Slide 7: Fixed Asset Utilization Optimization

**Pakistan enrichment:**
- Objective ADD: "Optimize utilization of PKR 500B+ in fixed assets across Pakistan banking sector: 16,000+ branches (property), 16,000+ ATMs, IT infrastructure, vehicle fleets"
- "Identify underperforming branch properties — cost-per-square-foot vs. revenue generation"
- Source Data ADD: "Branch property register (location, area, rent/owned, value), ATM uptime/transaction data, IT asset register"
- Outcome ADD: "Branch rationalization recommendations, ATM optimization (relocate low-usage, add high-traffic), IT asset lifecycle management"

**Speaker Notes:**
```
PAKISTAN FIXED ASSETS:
Major fixed asset categories for Pakistan banks:
1. BRANCH PROPERTIES: 16,000+ branches — mix of owned (revalued per SBP) and rented. Some inner-city branches have prime real estate value exceeding banking revenue.
2. ATMs: 16,000+ units. Average cost PKR 2-3M per ATM. Utilization varies 10x between locations.
3. IT INFRASTRUCTURE: Data centers, servers, networking — accelerating investment due to digital transformation.
4. VEHICLES: Fleet for cash-in-transit, executive, field operations.
5. FURNITURE & EQUIPMENT: Branch furniture, counters, security systems.

SBP requires periodic revaluation of owned properties. Revaluation surplus feeds Tier 2 capital (discounted).

FSDM: FXD_ASST (Fixed Asset), ASST_UTLZTN (Asset Utilization), BRCH_PRPRTY (Branch Property), ATM_PRFMNC (ATM Performance), DPRCTN (Depreciation)
```

---

#### Slide 8: Asset Backed Securitization (ABS)

**Pakistan enrichment:**
- Objective ADD: "Pakistan securitization market is nascent but growing. SBP has issued guidelines for asset securitization. Islamic securitization (Sukuk) is more developed than conventional ABS."
- "Key assets for securitization: auto loans, home finance, credit card receivables, SME lending, remittance flows"
- "Islamic Sukuk: asset-backed Islamic bonds — Pakistan has active Sukuk market (government and corporate)"
- Challenges ADD: "Limited secondary market depth, legal framework still developing, investor base concentrated in banks/insurance/pension"

**Speaker Notes:**
```
PAKISTAN SECURITIZATION:
ABS market is small but strategic:
- Government Sukuk (Ijara): Largest securitization — government issues PKR-denominated Sukuk backed by government assets
- Corporate Sukuk: Growing — K-Electric, WAPDA, major corporates
- Bank securitization: Limited — a few auto loan securitizations attempted
- SBP guidelines: Asset Securitization Rules 2019 — provide framework

Analytics needed:
- Pool performance tracking (delinquency, prepayment, loss)
- Cash waterfall modeling
- Investor reporting
- For Islamic Sukuk: tracking of underlying asset/lease payments

FSDM: SCRTZTN (Securitization), SCRTY (Security), SUKUK (Sukuk), ABS_POOL (ABS Pool), CSHFLW_WTRFL (Cashflow Waterfall)
```

---

#### Slide 9: Reconciliation Process

**Pakistan enrichment — HIGH PRIORITY:**
- Objective ADD: "Automate GL-to-sub-ledger reconciliation across 4-5 core banking systems. Currently 40-50% of finance team time consumed by manual reconciliation."
- Source Data ADD: "GL balances from multiple core systems, RAAST settlement data, 1Link switch data, Visa/MC settlement, NIFT cheque clearing, SBP clearing house data, nostro/vostro records"
- Outcome ADD: "Reduce reconciliation time by 70%, auto-detect and flag breaks, workflow for break resolution, full audit trail"

**Speaker Notes:**
```
PAKISTAN RECONCILIATION:
This is one of the biggest pain points for Pakistan bank finance teams:
1. CORE SYSTEM → GL: Each of 4-5 core systems posts to GL independently. Totals must reconcile daily.
2. PAYMENT SYSTEMS: RAAST (real-time), 1Link (ATM/POS), NIFT (cheque clearing), SWIFT (international) — each settles separately and must match internal records
3. CARD NETWORKS: Visa and Mastercard daily settlement files must reconcile against card system and GL
4. NOSTRO/VOSTRO: Correspondent bank accounts reconciled daily (often manually with SWIFT statements)
5. INTER-BRANCH: Head office vs. branch ledger reconciliation (SBP requires this)

Estimated: Large Pakistan banks employ 50-100 staff just for reconciliation activities.
Automation opportunity: 70-80% of breaks follow patterns that can be auto-resolved with rules.

FSDM: RCNCLTN (Reconciliation), BREK (Break), ADJSTMNT (Adjustment), GL_BLNC (GL Balance), STLMNT (Settlement), NSTRO (Nostro)
BVF Capability: Accounting Operations > Reconciliation, Validation & Adjustments (File 07, Slides 36-37)
```

---

#### Slide 10: Consolidation Optimization

**Pakistan enrichment:**
- Objective ADD: "Optimize consolidation across Pakistan banking group: parent bank + Islamic subsidiary/window + insurance/Takaful + AMC + brokerage + modaraba + microfinance subsidiary."
- "Eliminate inter-company transactions, manage multiple GAAP (IFRS + AAOIFI), handle currency translation for overseas branches/subsidiaries"
- Source Data ADD: "GL data from all group entities (different ERPs), Islamic banking separate books, subsidiary financial data, inter-company register, FX rates for overseas operations"
- Outcome ADD: "Consolidation cycle from 20+ days to <5 days, automated inter-company elimination, single-click drill-down from group to entity to transaction"

**Speaker Notes:**
```
PAKISTAN CONSOLIDATION:
Banking group consolidation scope (typical large bank):
- Conventional bank (parent) — primary core banking system
- Islamic banking subsidiary or window — separate books (IFRS + AAOIFI)
- Insurance/Takaful subsidiary — IFRS 4/17 applicable
- Asset management company — mutual fund NAV accounting
- Brokerage subsidiary — CDC/NCCPL reporting
- Leasing company (if any)
- Microfinance bank (if any)
- Overseas branches (UK, Middle East, etc.) — foreign currency translation

Challenges:
- Each entity may use different ERP/accounting system
- Islamic entities require dual GAAP treatment
- Inter-company transactions (bank → insurance, bank → AMC management fees) must be identified and eliminated
- SBP requires BOTH solo and consolidated regulatory returns

FSDM: CNSLDTN (Consolidation), LGL_ENTTY (Legal Entity), IC_TXN (Inter-Company Transaction), ELMNTN (Elimination), FX_TRNSLTN (FX Translation)
```

---

#### Slide 11: Close Process Optimization

**Pakistan enrichment — HIGH PRIORITY:**
- Objective ADD: "Reduce Pakistan banking monthly close from 15-30 days to <10 days (target: <5 days)."
- "Key bottlenecks: reconciliation across core systems, IFRS 9 ECL recalculation, Islamic accounting entries, inter-branch reconciliation, manual adjustments"
- Source Data ADD: "GL and sub-ledger data from all core systems centralized in FSDM data warehouse"
- Outcome ADD: "Accelerated SBP regulatory filing, earlier availability of management information, reduced external audit timeline"

**Speaker Notes:**
```
PAKISTAN CLOSE PROCESS:
Typical Pakistan bank monthly close timeline:
Day 1-5: Data extraction from core systems, initial GL close
Day 5-10: Reconciliation (GL-to-source, inter-branch, nostro/vostro)
Day 10-15: IFRS 9 ECL recalculation, provision adjustments
Day 15-20: Inter-company eliminations, Islamic accounting entries
Day 20-25: Management review, adjustments
Day 25-30: Final close, reporting

Target:
Day 1-2: Automated data extraction and reconciliation
Day 2-3: Automated IFRS 9 ECL, provisions, Islamic entries
Day 3-4: Automated consolidation and elimination
Day 4-5: Management review and final close

Enabler: FSDM data warehouse with automated GL/sub-ledger feeds, rules-based accounting engine, automated reconciliation.

FSDM: CLS_PRCS (Close Process), GL_CLS (GL Close), ADJSTMNT (Adjustment), RCNCLTN (Reconciliation), RPT_PRD (Reporting Period)
```

---

#### Slide 12: Accelerated Financial Data Acquisition

**Pakistan enrichment:**
- Objective ADD: "Accelerate integration of financial data from 4-5 core banking systems into unified FSDM data warehouse. Current batch ETL runs 6-12 hours overnight."
- "Target: near-real-time financial data availability for treasury and liquidity management"
- Source Data ADD: "Core banking systems (CTL, Temenos, Oracle, Finacle), Islamic banking, cards, trade finance, treasury — all feeding FSDM warehouse"
- Outcome ADD: "Finance team access to T+0 data (vs. current T+1 or T+2), accelerated close, faster regulatory filing"

---

### SECTION 2: ENTERPRISE PERFORMANCE MANAGEMENT (8 use cases)

#### Slide 13: Revenue Analytics Optimisation

**Pakistan enrichment:**
- Objective ADD: "Decompose Pakistan bank revenue: NII (~70% of total — KIBOR spreads on advances and investments), fee income (~15% — trade finance, cards, transactions), FX gains (~8%), investment income (~7%)."
- "Analyze revenue drivers: volume (deposit/advance growth), rate (KIBOR spread management), mix (CASA vs. term, high-yield vs. standard)"
- Source Data ADD: "KIBOR rates, SBP policy rate, product-level interest rates, Islamic profit-sharing ratios, fee tariff schedules, transaction volumes"
- Outcome ADD: "Revenue attribution by customer, product, branch, segment, channel. Identify revenue leakage (waived fees, mispriced loans, dormant accounts)"

**Speaker Notes:**
```
PAKISTAN REVENUE ANALYTICS:
Revenue decomposition for a typical large Pakistan bank:
- NII on advances: KIBOR + 2-8% spread × advance portfolio
- NII on investments: PIB/T-Bill yield minus cost of funds × investment portfolio
- CASA benefit: Zero/low cost deposits deployed at KIBOR+ rates
- Fee income: Trade finance (LC/LG), card fees, transaction fees, account maintenance
- FX income: Remittance spread, trade FX, treasury trading
- Investment income: Dividends, capital gains on securities

Key analytics:
1. NII sensitivity: Impact of SBP rate change on NII (100bps = PKR 5-10B for large bank)
2. Fee leakage: How much fee income is waived by RMs for corporate clients?
3. CASA mix drift: Is CASA share growing or declining? (Each 1% shift = PKR 2-3B NII impact)
4. Product profitability: Which products truly contribute vs. cross-subsidize?

FSDM: RVNU (Revenue), NII (NII), FEE_INCM (Fee Income), FX_INCM (FX Income), INVST_INCM (Investment Income), PRDCT_RVNU (Product Revenue)
BVF Capability: EPM > Revenue Analytics (File 08, Slides 1-2)
```

---

#### Slide 14: HR Analytics Optimization

**Pakistan enrichment:**
- Objective ADD: "Pakistan banks employ 50,000-100,000 staff each (large banks). Optimize: employee productivity (revenue/employee, accounts/employee), attrition prediction, talent management, workforce planning."
- Source Data ADD: "HRIS data (SAP HR, Oracle HR, PeopleSoft), branch staffing data, performance appraisal data, training records, exit interview data, Glassdoor/LinkedIn reviews"
- Outcome ADD: "Reduce voluntary attrition (currently 10-15% at large banks), optimize branch staffing model, identify high-potential employees"
- Challenges ADD: "Multiple HRIS systems across group entities, sensitive data privacy concerns, labor law compliance"

**Speaker Notes:**
```
PAKISTAN BANKING HR:
- Top 5 banks each employ 15,000-25,000 staff
- Staff cost is 40-50% of operating expense — largest single cost line
- Branch staffing: average 8-15 staff per branch, varies by branch category
- Key metrics: Revenue per employee (PKR 10-25M), Cost per employee (PKR 3-8M), Accounts per employee
- Attrition: 10-15% voluntary — higher in IT and digital roles (poached by fintechs)
- Compensation: Annual increments 8-15%, performance bonuses 1-3 months

Analytics priorities:
1. Productivity benchmarking (branch by branch, department by department)
2. Attrition prediction (which employees are at risk of leaving?)
3. Staffing optimization (right-size branches based on transaction volumes)
4. Learning path analysis (which training programs improve performance?)

FSDM: EMPL (Employee), EMPL_PRFMNC (Employee Performance), CMPSTN (Compensation), ATTRTN (Attrition), STFNG (Staffing), TRNG (Training)
```

---

#### Slide 15: Activity Based Costing — CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Build ABC model for Pakistan multi-channel banking: calculate true cost per transaction by channel (branch PKR 150-300, ATM PKR 30-50, digital PKR 5-15, contact center PKR 80-150, agent PKR 20-40)."
- "ABC is prerequisite for customer profitability, product profitability, branch P&L, and digital migration business case."
- Source Data ADD: "Transaction volumes by channel from FSDM, staff time allocation studies, IT cost allocation, branch cost registers, call center ACD data"
- Outcome ADD: "Activity-based unit costs feeding Customer Profitability Engine. Digital migration ROI quantification."
- Challenges ADD: "No Pakistan bank has formal ABC — culture of formula-based/headcount-based allocation. Requires business buy-in for activity definitions."

**Speaker Notes:**
```
Refer to File 08 Prompt (6M) — Slides 5-6 Activity Based Costing section for full Pakistan ABC context.

Key point: ABC is the missing link in Pakistan banking profitability analysis. Without ABC, cost allocation is crude (headcount or revenue-based), which means:
- Branch profitability is distorted (high-headcount branches look expensive regardless of activity)
- Product profitability is misleading (cross-subsidies hidden)
- Customer profitability is incomplete (revenue known, true cost unknown)
- Channel migration business case cannot be quantified

UBL Context: FSDM already captures transaction volumes by customer, product, channel, branch — providing the activity driver data for ABC. The Customer Profitability Engine needs ABC-based cost allocation to complete the profitability P&L.

FSDM: ACTVTY (Activity), UNT_CST (Unit Cost), CST_DRVR (Cost Driver), CST_ALLCTN (Cost Allocation), CHNL_CST (Channel Cost)
BVF Capability: EPM > Activity Based Costing (File 08, Slides 5-6)
```

---

#### Slide 16: Risk Adjusted Return on Capital (RAROC) — CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Calculate RAROC at customer, product, branch, and segment level to optimize capital allocation per SBP ICAAP requirements."
- "RAROC = (Revenue - Costs - Expected Loss) / Economic Capital"
- "Pakistan-specific: SBP minimum CAR 11.5% + buffers = ~14-16% effective minimum. Banks need to identify which segments earn above cost of equity (~18-22% in Pakistan's high-rate environment)."
- Source Data ADD: "IFRS 9 ECL data (PD, LGD, EAD), RWA by customer/product, KIBOR-based FTP rates, ABC-based cost data, SBP capital requirements"
- Outcome ADD: "RAROC-based capital reallocation: shift RWA from low-RAROC segments (e.g., unsecured consumer) to high-RAROC (e.g., trade finance, cash management)"

**Speaker Notes:**
```
PAKISTAN RAROC:
RAROC is strategically important for Pakistan banks because:
1. SBP ICAAP requires risk-adjusted performance measurement
2. High cost of equity (~18-22%) means many business lines may be destroying shareholder value
3. Capital is scarce — SBP periodically increases minimum paid-up capital (currently PKR 10B)
4. RWA-heavy lending (unsecured consumer, SME) must earn enough to cover capital cost

RAROC FORMULA:
RAROC = (FTP-Adjusted NII + Fee Income - Operating Cost - Expected Loss) / Economic Capital

Where:
- FTP-Adjusted NII: From FTP engine (KIBOR yield-curve based)
- Operating Cost: From ABC model
- Expected Loss: IFRS 9 ECL (PD × LGD × EAD)
- Economic Capital: RWA × target capital ratio (14-16%)

RAROC BY SEGMENT (typical Pakistan bank):
- Corporate: 15-25% (high revenue, low RWA for rated corporates)
- Trade Finance: 25-35% (high fee income, moderate RWA)
- Retail Secured (home/auto): 12-18% (moderate NII, moderate RWA)
- Retail Unsecured (personal loan/cards): 10-20% (high NII, high RWA, high ECL)
- SME: 8-15% (high ECL, challenging)
- Treasury: 15-25% (government securities are low RWA)

If RAROC < Cost of Equity: segment is destroying shareholder value.

FSDM: RAROC (RAROC), ECL (ECL), RWA (RWA), ECON_CPTL (Economic Capital), CST_EQTY (Cost of Equity), EVA (Economic Value Added)
BVF Capability: EPM > Profitability Modelling (File 08, Slides 7-8)
```

---

#### Slide 17: Profitability Analytics — MOST CRITICAL

**Pakistan enrichment:**
- Objective ADD: "Deliver multi-dimensional profitability at Customer, Product, Branch, Segment, Channel, and Region levels — the core output of UBL's Customer Profitability Engine."
- "Full P&L: FTP-adjusted NII + Fee Income + Other Income - Direct Costs - ABC-allocated Costs - IFRS 9 Provision = Profit Before Tax - Capital Charge = Economic Profit (EVA)"
- Source Data ADD: "FSDM star schema: FACT_CUSTOMER_PROFITABILITY with 35+ measures, all customer/product/account/transaction/balance/rate/cost data at individual level"
- Outcome ADD: "Identify: top 2% customers generating ~20% revenue, bottom 20% destroying value, cross-subsidy flows between products and segments"

**Speaker Notes:**
```
Refer to File 08 Prompt (6M) — Slides 7-8 Profitability Modelling section for full Pakistan profitability P&L structure and UBL Customer Profitability Engine context.

This is THE strategic use case for Pakistan banking. No Pakistan bank (other than UBL's FSDM initiative) has comprehensive customer-level profitability.

Key insight: Without profitability analytics, Pakistan banks make critical decisions blind:
- Branch opening/closing based on deposits (not profit)
- Customer pricing based on size (not profitability)
- Product design based on volume (not margin)
- Capital allocation based on historical (not risk-adjusted return)

FSDM: PRFTBLTY (Profitability), CSTMR_PRFT (Customer Profit), PRDCT_PRFT (Product Profit), BRCH_PRFT (Branch Profit), EVA (Economic Value Added)
BVF Capability: EPM > Profitability Analytics and Optimisation (File 08, Slides 11-12)
```

---

#### Slide 18: Individual Loan Price Optimisation

**Pakistan enrichment:**
- Objective ADD: "Optimize lending rate at individual customer level: KIBOR + risk premium, where risk premium reflects ECIB score, customer relationship value, collateral, tenor, and competitive pricing."
- "Pakistan context: personal loans currently priced KIBOR + 5-8% flat regardless of customer risk — massive cross-subsidy between low-risk and high-risk borrowers."
- Source Data ADD: "ECIB credit bureau scores, customer profitability data, propensity models, KIBOR rates, competitor rate intelligence, collateral values"
- Outcome ADD: "Risk-based pricing: lower rates for low-risk customers (retain/win from competitors), higher rates for high-risk (compensate for expected loss). Target: 20-50bps NIM improvement."

**Speaker Notes:**
```
PAKISTAN LOAN PRICING:
Current state: Most Pakistan banks use standardized pricing tiers:
- Corporate: KIBOR + 1-3% (negotiated by RM)
- Commercial: KIBOR + 2-4% (semi-standardized)
- Consumer: KIBOR + 5-8% (standard product rate)

Problem: A customer with ECIB score 750 gets same rate as customer with score 550. The low-risk customer subsidizes the high-risk customer. Low-risk customers are easy targets for competitor poaching.

Optimal pricing approach:
1. Calculate expected loss per customer (from ECIB score + internal rating)
2. Calculate cost-to-serve (from ABC)
3. Calculate cost of funds (from FTP engine)
4. Calculate capital charge (from RAROC model)
5. Set minimum rate = cost of funds + operating cost + expected loss + capital charge + target margin
6. Adjust for: competitive rates, customer relationship value, cross-sell potential

Impact: Risk-based pricing can improve portfolio NIM by 20-50bps = PKR 5-15B additional revenue for large bank.

FSDM: LN_PRCNG (Loan Pricing), ECIB_SCR (ECIB Score), RSK_PREMM (Risk Premium), FTP_RT (FTP Rate), TRGT_MRGN (Target Margin)
```

---

#### Slide 19: Performance Management & KPI Factory

**Pakistan enrichment:**
- Objective ADD: "Build centralized KPI engine calculating 100+ banking KPIs from integrated FSDM data warehouse, cascading from bank level to business line to branch to individual RM."
- Source Data ADD: "All FSDM data: customer, product, account, transaction, GL, cost, provision, HR data"
- Outcome ADD: "Automated daily/weekly/monthly KPI dashboard, branch scorecard, RM performance card, SBP compliance KPIs"
- KPIs: "ROE, ROA, NIM, Cost-to-Income, NPL ratio, CASA ratio, CAR, ADR, products/customer, digital adoption rate, customer growth"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 15-16 for full Pakistan KPI framework with industry benchmarks.

FSDM: KPI (KPI), PRFMNC (Performance), SCRCRD (Scorecard), TRGTS (Targets), ACTLS (Actuals)
BVF Capability: EPM > Performance Management and KPIs (File 08, Slides 15-16)
```

---

#### Slide 20: Budget & Forecasting Process Improvement

**Pakistan enrichment:**
- Objective ADD: "Reduce Pakistan banking budget cycle from 3-4 months to 4-6 weeks. Introduce quarterly rolling forecasts. Enable scenario planning for KIBOR rate changes."
- Source Data ADD: "FSDM historical P&L data, KIBOR rate forecasts, deposit growth trends, advance pipeline, IFRS 9 ECL forecast scenarios, HR headcount plan, CAPEX plan"
- Outcome ADD: "Rolling forecast updated quarterly, budget-vs-actual automated variance analysis, what-if scenarios for rate/growth/NPL changes"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 19-20 for full Pakistan budget and forecasting context.

FSDM: BDGT (Budget), FRCST (Forecast), VRNS (Variance), SCNRO (Scenario), ASMPTN (Assumption)
BVF Capability: EPM > Financial Budgeting, Planning & Forecasting (File 08, Slides 19-20)
```

---

### SECTION 3: TREASURY INSIGHT & MANAGEMENT (5 use cases)

#### Slide 21: Cash Flow Optimization

**Pakistan enrichment:**
- Objective ADD: "Forecast PKR and FCY cashflows incorporating: deposit maturities, loan repayments, PIB/T-Bill maturities, SBP CRR/SLR requirements, RAAST real-time settlement impact, seasonal patterns (Eid, tax quarters, agricultural cycles)."
- Source Data ADD: "Deposit maturity profiles, loan repayment schedules, PIB/T-Bill coupon dates, RAAST daily volumes, SBP CRR/SLR requirements, tax payment calendar"
- Outcome ADD: "Daily cashflow forecast with 95% accuracy, intraday liquidity monitoring, optimized government securities maturity ladder"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 28-29 for full Pakistan cashflow context.
Key Pakistan cashflow events: deposit maturities (daily PKR billions), PIB coupons, RAAST settlement (real-time), NIFT cheque clearing, Eid cash demand spikes.

FSDM: CSHFLW (Cashflow), MTRTY (Maturity), STLMNT (Settlement), CRR (CRR), SLR (SLR)
BVF Capability: Treasury > Cashflow Generation (File 08, Slides 28-29)
```

---

#### Slide 22: Reserve Portfolio Optimization

**Pakistan enrichment:**
- Objective ADD: "Optimize PKR 10T+ government securities portfolio held by Pakistan banking sector. Maximize yield while meeting SBP SLR and LCR requirements."
- "Optimize mix: PIBs (3-30 year, higher yield, higher duration risk) vs. T-Bills (3-12 month, lower yield, lower risk) vs. Sukuk (Islamic HQLA)"
- Source Data ADD: "SBP auction results (PIB/T-Bill yields), portfolio holdings at individual security level, duration/convexity calculations, LCR/NSFR components"
- Outcome ADD: "Yield enhancement of 10-25bps on portfolio through optimized maturity structure, while maintaining LCR >100% and SLR compliance"

**Speaker Notes:**
```
PAKISTAN RESERVE PORTFOLIO:
Banking sector holds PKR 10T+ in government securities — this is the single largest asset class:
- PIBs: 3, 5, 10, 15, 20, 30 year tenors. Fixed rate. Yield 14-18% depending on tenor.
- T-Bills: 3, 6, 12 month. Yield 17-19% (close to policy rate).
- Sukuk: Islamic government securities (Ijara-based). Variable return.

Portfolio optimization challenge:
- Longer tenor = higher yield but more duration risk (when rates rise, prices fall significantly)
- Shorter tenor = lower yield but more flexibility and lower risk
- SLR requirement: Must hold minimum government securities as % of deposits
- LCR requirement: Government securities are HQLA Level 1 (0% haircut)

A 10bps improvement in portfolio yield = PKR 10B+ additional income for industry.

FSDM: RSV_PRTFL (Reserve Portfolio), SCRTY (Security), YLD (Yield), DRTN (Duration), LCR (LCR), SLR (SLR)
```

---

#### Slide 23: Asset & Liability Management — Treasury Ops

**Pakistan enrichment:**
- Objective ADD: "Manage repricing gap, duration risk, and NII sensitivity per SBP IRRBB guidelines. Model impact of SBP rate decisions on balance sheet."
- Source Data ADD: "Detailed balance sheet: advance repricing profiles (KIBOR-linked), deposit maturity profiles, PIB/T-Bill duration, FX position, Islamic asset/liability profiles"
- Outcome ADD: "Automated repricing gap report for SBP, NII sensitivity to +/-200bps rate shock, EVE sensitivity analysis"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 34-35 for full Pakistan ALM context including repricing mismatch, duration risk, Islamic ALM, and SBP requirements.

FSDM: ALM (ALM), RPRCE_GAP (Repricing Gap), DRTN (Duration), NII_SNSTVTY (NII Sensitivity), EVE (EVE)
BVF Capability: Treasury > Asset & Liability Management (File 08, Slides 34-35)
```

---

#### Slide 24: Liquidity Management — HIGH PRIORITY

**Pakistan enrichment:**
- Objective ADD: "Comply with SBP Basel III: LCR (min 100%), NSFR (min 100%), intraday liquidity monitoring. Optimize HQLA portfolio composition."
- "RAAST real-time settlement creates new intraday liquidity volatility — need real-time monitoring capability."
- Source Data ADD: "HQLA portfolio (PIBs, T-Bills, cash, SBP balance), deposit stability analysis, loan drawdown pipeline, RAAST/RTGS daily flows, SBP reporting templates"
- Outcome ADD: "Real-time liquidity dashboard, automated LCR/NSFR calculation, stress scenario analysis per SBP requirements"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 30-31 for full Pakistan liquidity framework including LCR/NSFR components, HQLA composition, and SBP requirements.

FSDM: LQDTY (Liquidity), LCR (LCR), NSFR (NSFR), HQLA (HQLA), STRSS_TST (Stress Test)
BVF Capability: Treasury > Liquidity Management (File 08, Slides 30-31)
```

---

#### Slide 25: Currency Hedge Analytics

**Pakistan enrichment:**
- Objective ADD: "Hedge PKR/USD, PKR/GBP, PKR/EUR, PKR/AED exposure from trade finance (imports ~$60B/year) and remittance operations ($30B+/year)."
- "SBP limits open FX positions. PKR has experienced significant devaluation episodes (2018, 2022-23) — effective hedging is critical."
- Source Data ADD: "SBP daily FX rates, forward rates, trade finance pipeline (LC/LG), remittance flow forecasts, interbank FX market data"
- Outcome ADD: "Optimized FX hedging strategy, reduced earnings volatility from PKR devaluation, automated SBP open position reporting"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 38-39 for full Pakistan FX & trading context.
Pakistan-specific: Limited derivatives market — hedging options are primarily spot/forward FX, some FX swaps. No liquid interest rate swap market.

FSDM: FX_HDG (FX Hedge), FX_PSITN (FX Position), FWRD_RT (Forward Rate), VaR (Value at Risk)
BVF Capability: Treasury > FX & Trading Book Management (File 08, Slides 38-39)
```

---

### SECTION 4: FINANCIAL REPORTING (7 use cases)

#### Slide 26: External Reporting Support

**Pakistan enrichment:**
- Objective ADD: "Support external reporting requirements: SBP statutory returns, SECP quarterly/annual IFRS statements, PSX disclosure requirements, external audit data requests, tax authority (FBR) reporting."
- Source Data ADD: "Integrated FSDM data warehouse: GL, sub-ledger, customer, product, transaction data with full audit trail"
- Outcome ADD: "Single source of truth for all external reporting — eliminate duplicate data preparation for different stakeholders"

---

#### Slide 27: Financial Reporting Efficiency and Effectiveness

**Pakistan enrichment:**
- Objective ADD: "Reduce financial reporting cycle time and manual effort. Pakistan banks currently spend 15-20 days per month on financial reporting preparation."
- Outcome ADD: "Automated monthly financial pack generation, reduced reporting cycle to <5 days, self-service BI for finance team"

---

#### Slide 28: Integrated Regulatory & Compliance Reporting — HIGH PRIORITY

**Pakistan enrichment:**
- Objective ADD: "Automate 30+ SBP statutory returns from single integrated data source. Include: WSP (weekly), MSA (monthly), QFS (quarterly), capital adequacy, LCR/NSFR, ECIB, STR/CTR."
- Source Data ADD: "FSDM data warehouse: all GL, customer, product, transaction, provision, capital, liquidity data"
- Outcome ADD: "Automated SBP return generation with data lineage, reduced regulatory filing errors, faster SBP query response"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 49-50 for full Pakistan regulatory reporting context with list of all SBP returns.

FSDM: RGLTY_RPT (Regulatory Report), SBP_RTRN (SBP Return), IFRS_DSCLSR (IFRS Disclosure), BSL_RPT (Basel Report)
BVF Capability: Financial Reporting > Regulatory & Compliance Reporting (File 08, Slides 49-50)
```

---

#### Slide 29: Sales Reporting & Analytics

**Pakistan enrichment:**
- Objective ADD: "Track banking product sales pipeline: accounts opened, loans originated, cards issued, insurance sold (bancassurance), investments sold, trade finance deals. By branch, RM, channel, segment."
- Source Data ADD: "Core banking new account data, loan origination system, card issuance data, insurance policy data, trade finance deal register"
- Outcome ADD: "RM-level sales scorecard, branch sales dashboard, campaign-to-sales attribution, sales pipeline forecasting"

---

#### Slide 30: Project Accounting — Cost Management

**Pakistan enrichment:**
- Objective ADD: "Track costs of major banking projects: digital transformation, core banking upgrade, branch renovation, ATM network expansion, data center build."
- "Pakistan banks are investing PKR 5-15B annually in technology transformation — project cost management is critical."
- Outcome ADD: "Project-level P&L, budget vs. actual tracking, IT project ROI measurement"

---

#### Slide 31: Internal — Exception Reporting

**Pakistan enrichment:**
- Objective ADD: "Automate exception detection for: SBP limit breaches (FX position, large exposure, single borrower), IFRS 9 stage migration triggers, budget variance thresholds, compliance SLA breaches, AML threshold alerts."
- Outcome ADD: "Real-time exception alerts with workflow-based resolution tracking, full audit trail for regulatory inspection"

---

#### Slide 32: Executive Information Hub

**Pakistan enrichment:**
- Objective ADD: "Build unified executive dashboard for bank CEO/CFO/CRO/COO with drill-down from bank-level KPIs to individual transaction detail."
- "Dashboard components: Financial performance (P&L, ROE, NIM), Balance sheet (deposits, advances, capital), Risk (NPL, ECL, CAR), Treasury (portfolio, liquidity, FX), Operations (branch, digital, customer growth), Islamic banking panel"
- Outcome ADD: "Replace monthly paper-based MIS pack (currently takes 2-3 weeks to prepare) with real-time self-service dashboard"

**Speaker Notes:**
```
See File 08 Prompt (6M) — Slides 57-58 for full Pakistan executive dashboard context.

FSDM: DSHBRD (Dashboard), KPI (KPI), EXCTVL_RPT (Executive Report), DRILL_DWN (Drill-Down)
BVF Capability: Financial Reporting > Executive Dashboards (File 08, Slides 57-58)
```

---

## TERADATA BRANDING REMOVAL — GLOBAL RULES

Apply to ALL 32 slides:

| Find | Replace |
|---|---|
| Owner names ("Lance Dacre", "Jay Humphries", "Bob Brady", "David Rosal", "Tom Langenbahn", "Kim Autrey", "Ross VanDooser", "Wayne Thompson", "Adrian Sharp", "Henry Kolisnik", "Shri Ranganathan", "James Hunt") | "Banking Industry Best Practice" or REMOVE field |
| "Teradata" | REMOVE or "Enterprise Analytics Platform" |
| Triangle color legend in Notes | Replace with Pakistan context + FSDM |
| "RACE-type engagement" in Notes | REMOVE |
| All References to specific non-Pakistan companies | REMOVE or generalize |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |

---

## CONTENT DENSITY RULES

Same as File 06. Use case slides are already dense (7 fields). Apply strict limits:

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

## FINAL OUTPUT STRUCTURE (35+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Use Case Portfolio Dashboard** | **NEW** |
| **2** | **Pakistan Finance Use Case Priorities** | **NEW** |
| 3 | SECTION: Finance & PM Use Cases | Updated divider |
| 4-14 | 11 Accounting Operations use cases | All enriched |
| 15-22 | 8 EPM use cases | All enriched |
| 23-27 | 5 Treasury use cases | All enriched |
| 28-34 | 7 Financial Reporting use cases | All enriched |
| **35** | **Implementation Roadmap** | **NEW** |

---

## VISUAL QA CHECKLIST

```
No text overflow in any use case field
All 7 fields visible on every use case slide
Font >= 10pt in all fields
No Teradata owner names visible
No Teradata triangle color legend in notes
No "RACE-type engagement" references
Pakistan context added to every use case
Speaker notes have FSDM entity references + cross-references to File 07/08 capabilities
3 new slides present
Footer correct, page numbers sequential
Consistent theme throughout all 35+ slides
```
