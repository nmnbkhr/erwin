# PROMPT 6L: File 07 — Finance & Performance Management: Accounting Operations

## Role

You are a senior banking CFO advisory consultant and presentation specialist. You are rebuilding BVF PowerPoint File 07, which covers the Finance & Performance Management overview and the Accounting Operations & Close capabilities. You have deep expertise in Pakistan banking finance operations, SBP regulatory reporting, IFRS 9/IFRS 17 implementation, Islamic accounting (AAOIFI standards), and enterprise data warehousing for finance functions. You understand UBL's FSDM-based data warehouse architecture and its Customer Profitability Engine.

---

## Source File

```
INPUT:  ./07_Finance_PM_Accounting_Operations.pptx  (46 slides)
OUTPUT: ./pptout/07_Finance_PM_Accounting_Operations_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 46 slides have full Teradata BVF content. Structure: FPM domain overview (15 slides) + Accounting Operations capabilities with maturity tables (26 slides) + EPM introduction (5 slides).

**Work required:**
1. Add Pakistan banking finance context to every capability
2. Add SBP regulatory requirements, IFRS 9, Islamic accounting (AAOIFI) context
3. Update maturity assessments for Pakistan banking reality
4. Map FSDM entities (Financial Instrument, Accounting, Party, Product domains)
5. Fix overflow, move detail to speaker notes
6. Add 3 new supplementary slides
7. Remove/replace all Teradata branding

---

## Reference Data

```
./OVERVIEW.md                                       # FSDM domains, BVF structure
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
```

---

## EXISTING SLIDE STRUCTURE (46 Slides)

### Part A: Finance & Performance Management Overview (Slides 1-15)

| Slide | Title | Type |
|-------|-------|------|
| 1 | FPM — Domain Overview (4 sub-domains) | Navigation / Overview |
| 2 | FPM — Accounting Operations Capabilities (11 listed) | Navigation |
| 3 | FPM — EPM Capabilities (11 listed) | Navigation |
| 4 | FPM — Treasury Capabilities (7 listed) | Navigation |
| 5 | FPM — Financial Reporting Capabilities (6 listed) | Navigation |
| 6 | Finance BVF — Use Cases (1 of 3) | Use Case Map |
| 7 | Finance BVF — Use Cases (2 of 3) | Use Case Map |
| 8 | Finance BVF — Use Cases (3 of 3) | Use Case Map |
| 9 | FPM — Why Important | Context |
| 10 | FPM — Challenges | Context |
| 11 | FPM — Challenges (cont.) | Context |
| 12 | FPM — "Are You Able To..." | Assessment Questions |
| 13 | FPM — How (Capabilities) | Solution Approach |
| 14 | FPM — Value Proposition | Business Value |
| 15 | FPM — Value (cont.) | Business Value |

### Part B: Section Divider (Slide 16)

| 16 | "Finance and Performance Management Capabilities" | Section Divider |

### Part C: Accounting Operations & Close (Slides 17-41)

Overview slides (17-21) + 10 capability pairs (22-41):

| Slide | Title | Type |
|-------|-------|------|
| 17 | Accounting Ops — Why Important | Context |
| 18 | Accounting Ops — Challenges | Context |
| 19 | Accounting Ops — "Are You Able To..." | Assessment |
| 20 | Accounting Ops — How (Capabilities) | Solution |
| 21 | Accounting Ops — Value | Business Value |
| 22 | Billing & Collections | Capability Detail |
| 23 | Billing & Collections | Maturity Table |
| 24 | Procurement & Payment | Capability Detail |
| 25 | Procurement & Payment | Maturity Table |
| 26 | Sub-ledger Accounting | Capability Detail |
| 27 | Sub-ledger Accounting | Maturity Table |
| 28 | Fair Value & Hedge Accounting | Capability Detail |
| 29 | Fair Value & Hedge Accounting | Maturity Table |
| 30 | Asset Valuations | Capability Detail |
| 31 | Asset Valuations | Maturity Table |
| 32 | Reserve Analytics | Capability Detail |
| 33 | Reserve Analytics | Maturity Table |
| 34 | Tax Management & Optimisation | Capability Detail |
| 35 | Tax Management & Optimisation | Maturity Table |
| 36 | Reconciliation, Validation & Adjustments | Capability Detail |
| 37 | Reconciliation, Validation & Adjustments | Maturity Table |
| 38 | Financial Consolidation | Capability Detail |
| 39 | Financial Consolidation | Maturity Table |
| 40 | Functional Profit & Loss Statement | Capability Detail |
| 41 | Functional P&L Statement | Maturity Table |

### Part D: EPM Introduction (Slides 42-46)

| 42 | EPM — Why Important | Context |
| 43 | EPM — Challenges | Context |
| 44 | EPM — "Are You Able To..." | Assessment |
| 45 | EPM — How (Capabilities) | Solution |
| 46 | EPM — Value | Business Value |

> **Note:** EPM capability DETAILS (Revenue Analytics, ABC, Profitability, etc.) are in File 08. This file has only the EPM introduction.

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"Finance & Performance Management — At a Glance"**

| | Global | South Asia & ME | Pakistan |
|---|---|---|---|
| Monthly close cycle | 3-5 days | 7-15 days | 15-30 days |
| Financial consolidation automation | 80%+ at top banks | 40-50% | <25% |
| Activity-based costing adoption | 60% of large banks | 20-30% | <10% |
| IFRS 9 ECL automation | 70%+ in EU/UK banks | 30-40% | 20-30% (SBP mandate) |
| FTP engine deployed | 80% of large banks | 40-50% | ~30% (KIBOR-based) |
| Branch-level P&L | Standard practice | Emerging | Rare (<15% of banks) |
| Islamic accounting (AAOIFI) | N/A | Required for Islamic banks | Dual IFRS + AAOIFI for Islamic windows |

Info bar:
```
BVF Sub-capabilities: 11 Accounting Ops + 11 EPM + 7 Treasury + 6 Reporting = 35
FSDM Entities: ~200+ (Financial Instrument, Accounting, Party, Product, GL, Cost Center)
BACR Questions: ~150 | Maturity Focus: Developing → Innovating
```

### NEW Slide B: Pakistan Context (insert as slide 2)

**"Pakistan Banking — Finance & Performance Management Landscape"**

```
REGULATORY FRAMEWORK:
  SBP:       Statutory returns (weekly, monthly, quarterly, annual)
  IFRS 9:    ECL provisioning mandate (implemented 2018, ongoing refinement)
  IFRS 17:   Insurance contract accounting (effective 2025 for Takaful/insurance)
  AAOIFI:    Accounting standards for Islamic banking operations
  Basel III:  Capital adequacy, liquidity ratios (LCR, NSFR)
  FBR:       Tax compliance (WHT on deposits, advance tax, super tax on banks)

KEY CHALLENGES:
  4-5 core banking systems per bank — fragmented GL/sub-ledger data
  Islamic banking windows require parallel accounting (IFRS + AAOIFI)
  Monthly close takes 15-30 days (vs. 3-5 day global benchmark)
  Branch-level P&L not available at most banks (16,000+ branches)
  FTP engines use simplified KIBOR spreads, not yield-curve based
  Tax complexity: WHT on profit, advance tax, super tax (2022), minimum tax
  ECIB credit bureau data integration for IFRS 9 ECL calculations

PAKISTAN BANKING FINANCE METRICS:
  Banking sector assets:    PKR 35T+ (~$125B)
  Total deposits:           PKR 25T+ (~$90B)
  Total advances:           PKR 13T+ (~$47B)
  Industry NPLs:            ~7.5% (PKR 900B+)
  CASA ratio:               ~47% of total deposits
  Number of banks:          33 scheduled + 5 full Islamic + 11 microfinance
  SBP policy rate:          17.5% (as of reference period)
  Withholding tax on profit: 15% (filers) / 30% (non-filers)
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Finance & Performance Management — Implementation Roadmap"**

```
Phase 1: Accounting Foundation (0-6 months)
  Unified chart of accounts across all core banking systems
  Sub-ledger integration for top 3 product systems (CASA, lending, cards)
  IFRS 9 ECL data pipeline automation
  Automated GL-to-sub-ledger reconciliation
  Investment: PKR 50-100M | Quick Win: Close cycle from 30 to 15 days

Phase 2: Performance Analytics (6-18 months)
  Funds Transfer Pricing engine (KIBOR yield-curve based)
  Activity-based costing framework (branch, digital, ATM, agent channels)
  Branch-level P&L for all 16,000+ branches
  Customer profitability engine (building on UBL FSDM foundation)
  Investment: PKR 120-250M | Expected: Identify PKR 5B+ in cost optimization

Phase 3: Enterprise Finance Intelligence (18-36 months)
  Real-time financial consolidation across all entities
  Islamic accounting hub (dual IFRS + AAOIFI)
  Predictive budgeting and rolling forecasts
  Executive finance dashboard with drill-down to transaction level
  Investment: PKR 200-400M | Expected: Close in <5 days, 360-degree profitability view
```

---

## SLIDE-BY-SLIDE ENRICHMENT

### PART A: FPM OVERVIEW (Slides 1-15)

#### Slides 1-5: Navigation/Overview Slides

**Enrich each overview slide with Pakistan context note:**
- Slide 1: Add subtitle: "Aligned to SBP regulatory requirements, IFRS 9/IFRS 17, Basel III, and AAOIFI Islamic accounting standards"
- Slides 2-5: Add Pakistan-relevant sub-bullet under each capability listing where applicable

#### Slides 6-8: Use Case Maps

- Remove Teradata triangle color legend from notes
- Add Pakistan priority indicator to each use case name

#### Slides 9-15: Why Important / Challenges / Assessment / Value

**Slide 9 (Why Important) — Add:**
- "Pakistan banks face dual accounting challenge: conventional IFRS plus AAOIFI for Islamic banking windows/subsidiaries"
- "SBP requires 30+ statutory returns at varying frequencies — data integration is critical"
- "IFRS 9 ECL provisioning requires granular loan-level data across all core banking systems"

**Slide 10-11 (Challenges) — Add Pakistan-specific challenges:**
- "4-5 core banking systems (CTL, Temenos, Oracle, Finacle, Symbols) with incompatible chart of accounts"
- "Islamic banking windows require parallel GL entries under both IFRS and AAOIFI"
- "FBR tax complexity: withholding tax on bank profits (15%/30%), super tax on banks (10%), advance tax on transactions, minimum tax"
- "Monthly close takes 15-30 days due to manual reconciliation across fragmented systems"
- "Branch-level P&L not feasible without integrated sub-ledger data"

**Slide 12 (Are You Able To...) — Add Pakistan questions:**
- "Can you produce branch-level P&L for all 16,000+ branches?"
- "Can you calculate customer profitability across conventional AND Islamic product lines?"
- "Can you automate SBP statutory returns from a single data source?"
- "Can you produce IFRS 9 ECL reports with full drill-down to individual loan data?"
- "Can you calculate FTP using KIBOR yield curve rather than flat spreads?"

**Slides 13-15 (How/Value) — Add:**
- "FSDM-based data warehouse provides the integrated financial data foundation required for all downstream finance analytics"
- "Pakistan context: UBL's Customer Profitability Engine demonstrates how FSDM star schema enables PKR-denominated profitability across all product lines"

**Speaker Notes for Overview section:**
```
PAKISTAN FINANCE REGULATORY LANDSCAPE:

SBP STATUTORY RETURNS (key ones):
- Weekly Statement of Position (WSP)
- Monthly Statement of Affairs (MSA)
- Quarterly Financial Statements (QFS)
- Annual Audited Financial Statements
- IFRS 9 ECL quarterly reports
- Basel III Capital Adequacy (CAR) quarterly
- Liquidity Coverage Ratio (LCR) monthly
- Net Stable Funding Ratio (NSFR) quarterly
- Large Exposure Framework (LEF) quarterly
- Foreign Currency Exposure limits (daily monitoring)

IFRS 9 IN PAKISTAN:
- SBP mandated IFRS 9 adoption effective January 1, 2018
- ECL calculation requires probability of default (PD), loss given default (LGD), exposure at default (EAD) at individual loan level
- Data challenge: PD models require 5+ years of historical default data — many Pakistan banks lack this granularity
- Stage classification (1/2/3) requires monitoring of Significant Increase in Credit Risk (SICR) — SBP provides guidance criteria

ISLAMIC ACCOUNTING:
- Islamic banks follow AAOIFI Financial Accounting Standards (FAS)
- Key differences: no interest income/expense (replaced by profit/loss sharing), no conventional derivatives
- Islamic windows in conventional banks maintain parallel books
- Shariah board audit adds additional reporting layer
- Key AAOIFI standards: FAS 1 (General Presentation), FAS 4 (Musharaka), FAS 28 (Murabaha)

FSDM: GL_ACCT (General Ledger Account), GL_BLNC (GL Balance), ACCTNG_EVNT (Accounting Event), FIN_INSTRMT (Financial Instrument), CST_CNTR (Cost Center), PRDCT (Product), PRTY (Party), ORGN_UNT (Organization Unit)
```

---

### PART C: ACCOUNTING OPERATIONS & CLOSE

#### Slides 17-21: Accounting Ops Overview

**Slide 17 (Why Important) — Add:**
- "Pakistan banking: quality of financial close is under SBP scrutiny — banks with delayed or restated financials face regulatory action"
- "IFRS 9 implementation has made the close process more complex — ECL recalculation required at each reporting date"

**Slide 18 (Challenges) — Add:**
- "4-5 core banking systems with different chart of accounts — manual mapping and reconciliation"
- "Islamic banking window sub-ledger creates additional reconciliation layer"
- "SBP requires increasing granularity in regulatory returns — summary-level GL data is insufficient"
- "External auditors (Big 4 in Pakistan) require detailed drill-down capability"

**Slide 19-21 (Assessment/How/Value) — Add Pakistan assessment questions and value propositions**

---

#### SLIDES 22-23: Billing & Collections + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Reduce NPL ratio from 7.5% industry average through early collection intervention"
- "Optimize collection strategies by customer segment: mass (automated SMS), affluent (RM call), corporate (legal)"
- "Integrate ECIB credit bureau data for collection prioritization"
- Data ADD: "ECIB credit bureau scores, SBP classification data (OAEM/Substandard/Doubtful/Loss), court decree data for legal recovery, restructured loan tracking"
- Outcome ADD: "Reduce days past due (DPD) migration, improve recovery rates on classified assets, automate ECIB reporting"
- Challenges ADD: "Court system delays (3-7 years for loan recovery through legal channels), NAB/banking court jurisdiction issues"

**Speaker Notes:**
```
PAKISTAN COLLECTIONS CONTEXT:
NPL landscape: PKR 900B+ in non-performing loans across industry (~7.5% ratio).
SBP classification: Current → OAEM (90 days) → Substandard (180 days) → Doubtful (1 year) → Loss (5 years)
Provisioning: General 1-2% + Specific (25%-100% depending on classification)
Recovery channels: Call center, field recovery, legal (banking courts), write-off + recovery agents
Challenge: Pakistan's legal system averages 3-7 years for loan recovery — incentivizes early analytical intervention

FSDM: AR_BLNC (Accounts Receivable Balance), INVCE (Invoice), PMT (Payment), CLLCTN (Collection), DPD (Days Past Due), NPL (Non-Performing Loan), CLSFCTN (Classification), PRVSN (Provision)
```

---

#### SLIDES 24-25: Procurement & Payment + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Centralize procurement analytics across all bank entities (conventional + Islamic subsidiaries + insurance/Takaful + brokerage)"
- "Comply with FBR WHT requirements on vendor payments (variable rates by vendor type and filer status)"
- Data ADD: "FBR filer/non-filer status of vendors (determines WHT rate), NTN (National Tax Number), vendor banking details for RAAST payments"
- Outcome ADD: "Automated FBR WHT calculation and reporting, vendor performance analytics, procurement consolidation across group entities"

**Speaker Notes:**
```
PAKISTAN PROCUREMENT CONTEXT:
Pakistan banks are significant purchasers: IT infrastructure, branch construction/maintenance, security, stationery, marketing services, consulting, audit fees.

Tax complexity: Every vendor payment requires WHT deduction at source. Rates vary:
- Services: 8% (filer) / 16% (non-filer)
- Supplies: 4% (filer) / 8% (non-filer)
- Contracts: 7% (filer) / 14% (non-filer)
FBR filer status must be verified for each payment — active taxpayer list (ATL) changes monthly.

FSDM: VNDR (Vendor), PO (Purchase Order), INVCE (Invoice), PMT (Payment), WHT (Withholding Tax), AP_BLNC (Accounts Payable Balance)
```

---

#### SLIDES 26-27: Sub-ledger Accounting + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Generate sub-ledger accounting entries from 4-5 core banking systems into unified FSDM-based data warehouse"
- "Support dual accounting: IFRS entries for conventional products + AAOIFI entries for Islamic products from same operational transactions"
- "Maintain detailed sub-ledger for IFRS 9 ECL calculations at individual loan level"
- Data ADD: "Core banking transaction data (CTL, Temenos, Oracle, Finacle), Islamic banking sub-system data, card system data (Visa/MC), trade finance system data"
- Outcome ADD: "Single source of truth for all financial reporting — SBP returns, IFRS 9, management reporting, audit trail"

**Speaker Notes:**
```
PAKISTAN SUB-LEDGER CONTEXT:
Pakistan banks typically operate "thick" GLs because sub-ledger data is not centralized:
- Core banking system generates summary GL postings (not transaction-level)
- Cards system posts net settlements to GL
- Islamic banking window posts separately
- Trade finance posts separately
- Investment/treasury system posts separately

Result: GL has 50,000+ accounts but limited drill-down to transaction detail.

FSDM solution: Create sub-ledger accounting hub that:
1. Captures individual transaction-level accounting entries from each source
2. Applies consistent chart of accounts mapping
3. Generates dual IFRS/AAOIFI entries for Islamic transactions
4. Aggregates to GL postings with full lineage
5. Enables drill-down from any GL balance to individual transactions

This is foundational for: IFRS 9 ECL, customer profitability, branch P&L, regulatory reporting.

FSDM: ACCTNG_EVNT (Accounting Event), SUB_LDGR (Sub-Ledger), GL_PSTNG (GL Posting), COA (Chart of Accounts), FIN_INSTRMT (Financial Instrument), ACCTNG_RULE (Accounting Rule)
```

---

#### SLIDES 28-29: Fair Value & Hedge Accounting + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Manage fair value accounting for Pakistan government securities portfolio (PIBs, T-Bills, Sukuk, Ijara) per SBP classification (HTM/AFS/HFT)"
- "Hedge FX exposure — Pakistan banks hold significant USD, GBP, EUR positions for trade finance and remittance operations"
- "Comply with IFRS 9 hedge effectiveness requirements — SBP expects robust documentation"
- Data ADD: "SBP government securities rates (PKR-denominated PIBs, T-Bills), KIBOR rates, FX rates (SBP daily fixing), Islamic Sukuk valuations"

**Speaker Notes:**
```
PAKISTAN FAIR VALUE CONTEXT:
Government securities portfolio: Pakistan banks hold PKR 10T+ in government securities (PIBs, T-Bills, Sukuk).
SBP classification impacts P&L: HTM (amortized cost) vs. AFS (OCI) vs. HFT (P&L). Reclassification under IFRS 9 created significant one-time impacts.

FX hedging: Banks hedge trade finance, remittance (USD 30B+/year), and treasury positions. SBP limits open FX positions.

Islamic securities: Sukuk (Islamic bonds) require fair valuation under both IFRS and AAOIFI — different measurement approaches.

FSDM: FV_ADJSTMNT (Fair Value Adjustment), HDG (Hedge), HDG_EFCTVNS (Hedge Effectiveness), SCRTY (Security), SCRTY_VLTN (Security Valuation), FX_PSITN (FX Position)
```

---

#### SLIDES 30-31: Asset Valuations + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Value bank's physical assets: 16,000+ branch properties, ATM network (16,000+), IT infrastructure, vehicle fleet"
- "IFRS 9 asset impairment assessment for investment portfolio"
- "Comply with SBP Fixed Asset regulations (revaluation surplus treatment)"
- Data ADD: "Branch property valuations (updated per SBP requirements), IT asset register, investment portfolio market values, collateral valuations for secured lending"

**Speaker Notes:**
```
PAKISTAN: Bank asset valuations are SBP-regulated. Revaluation surplus on branch properties creates regulatory capital (Tier 2) but must be discounted per SBP capital adequacy rules.

Key valuation areas:
1. Branch properties (16,000+ — significant book value, revaluation every 3-5 years per SBP)
2. Government securities portfolio (daily mark-to-market for AFS/HFT)
3. Lending portfolio (IFRS 9 ECL — collective and individual impairment)
4. Foreclosed collateral (Qarz-e-Hasna for Islamic, foreclosed properties)
5. Equity investments (banking subsidiaries, associates, strategic holdings)

FSDM: ASST (Asset), ASST_VLTN (Asset Valuation), IMPRM (Impairment), RVAL (Revaluation), CLLTRL (Collateral), CLLTRL_VLTN (Collateral Valuation)
```

---

#### SLIDES 32-33: Reserve Analytics + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Calculate IFRS 9 Expected Credit Loss (ECL) reserves at individual loan level"
- "Maintain general provisions (1-2% per SBP) plus specific provisions (25-100%) on classified assets"
- "Islamic banking: provisioning for Diminishing Musharaka, Ijarah, Murabaha under both IFRS 9 and AAOIFI FAS 30"
- Data ADD: "ECIB credit bureau data for PD estimation, historical default and recovery data (5+ years), collateral values, restructured loan data, customer financial statements"

**Speaker Notes:**
```
PAKISTAN RESERVE/PROVISIONING FRAMEWORK:
SBP requires BOTH general and specific provisioning:
- General: 1% on consumer, 1.5% on SME, 2% on small enterprise, plus IFRS 9 Stage 1/2 ECL
- Specific: 25% (Substandard), 50% (Doubtful), 100% (Loss) — reduced by collateral
- IFRS 9 ECL: PD × LGD × EAD for each loan, with forward-looking macroeconomic scenarios
- SBP allows "regulatory overlay" where SBP provisioning exceeds IFRS 9 ECL

Pakistan-specific challenge: Historical PD data is limited (many banks have <5 years of granular default data). SBP provides sector-level PD benchmarks as fallback.

UBL Context: FSDM star schema supports ECL calculation with FACT_LOAN_PROVISION containing PD, LGD, EAD, Stage, and ECL amount at individual loan level.

FSDM: RSRV (Reserve), ECL (Expected Credit Loss), PD (Probability of Default), LGD (Loss Given Default), EAD (Exposure at Default), PRVSN (Provision), STG (Stage), CLSFCTN (Classification)
```

---

#### SLIDES 34-35: Tax Management & Optimisation + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Manage Pakistan's complex banking tax regime: corporate tax (39% for banks), super tax (10%), WHT on deposits (15%/30%), advance tax, minimum tax"
- "Automate FBR withholding tax calculation on customer deposits and vendor payments"
- "Track tax credits, brought-forward losses, and tax planning for group entities"
- Data ADD: "FBR Active Taxpayer List (ATL), customer CNIC/NTN for filer status, deposit profit payment data, vendor payment records, tax credit certificates"

**Speaker Notes:**
```
PAKISTAN BANKING TAX FRAMEWORK:
Banks face the highest effective tax rate in Pakistan:
- Corporate tax: 39% (banks — higher than standard 29%)
- Super tax: 10% on banks (introduced 2022)
- Effective rate: ~49% before other taxes
- WHT on deposit profit: 15% (ATL filers) / 30% (non-filers) — bank acts as collection agent
- Advance tax: Banks deduct advance tax on cash withdrawals >PKR 50K/day (non-filers)
- Minimum tax: Applies if normal tax is below threshold

Automation opportunity:
- Customer filer/non-filer status changes monthly — FBR ATL lookup must be automated
- WHT calculation on millions of deposit profit payments — currently semi-manual at many banks
- Tax provisioning for quarterly/annual filing requires consolidated data from all entities

FSDM: TAX (Tax), WHT (Withholding Tax), TAX_CLCTN (Tax Calculation), TAX_CRDT (Tax Credit), TAX_OBLGTN (Tax Obligation), FLR_STS (Filer Status)
```

---

#### SLIDES 36-37: Reconciliation, Validation & Adjustments + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Automate reconciliation between 4-5 core banking systems and centralized data warehouse — currently 40%+ of finance team time spent on manual reconciliation"
- "GL-to-sub-ledger reconciliation for SBP reporting accuracy"
- "Automated nostro/vostro reconciliation for correspondent banking"
- Data ADD: "GL balances from multiple ERPs/core systems, RAAST settlement data, 1Link switch data, card network settlement (Visa/MC), SBP clearing house data"

**Speaker Notes:**
```
PAKISTAN RECONCILIATION CHALLENGE:
Pakistan banks spend enormous effort on reconciliation because:
1. Multiple core systems post to GL independently — totals must be reconciled daily
2. Payment system settlements (RAAST, 1Link, SWIFT) must match internal records
3. Card network settlements (Visa, Mastercard) reconcile against card system and GL
4. SBP clearing house (NIFT) cheque settlements must be reconciled
5. Nostro/vostro accounts with correspondent banks must be reconciled daily
6. Inter-branch transactions must be reconciled (Head Office vs. branches)

Estimated: Finance teams at Pakistan banks spend 40-50% of time on reconciliation activities that could be automated.

FSDM: RCNCLTN (Reconciliation), ADJSTMNT (Adjustment), VLDTN (Validation), GL_BLNC (GL Balance), STLMNT (Settlement), NSTRO (Nostro), VSTRO (Vostro)
```

---

#### SLIDES 38-39: Financial Consolidation + Maturity

**Pakistan enrichment:**
- Objectives ADD: "Consolidate across banking group entities: conventional bank + Islamic banking window/subsidiary + insurance/Takaful + brokerage + asset management + modaraba"
- "Eliminate inter-company transactions between group entities"
- "Produce consolidated SBP returns and consolidated IFRS financial statements"
- Data ADD: "GL data from all group entities (often different ERP/core systems), Islamic banking separate books, subsidiary financial data, inter-company transaction register"

**Speaker Notes:**
```
PAKISTAN CONSOLIDATION CONTEXT:
Typical Pakistan banking group consolidation scope:
- Parent bank (conventional) — e.g., CTL core banking
- Islamic banking subsidiary or window — separate books (IFRS + AAOIFI)
- Insurance/Takaful subsidiary
- Asset management company (mutual funds)
- Brokerage subsidiary
- Modaraba company (if applicable)
- Leasing company (if applicable)
- Microfinance subsidiary (if applicable)

Each may have different ERP, different chart of accounts, different fiscal year end (though SBP requires December 31 for banks).

SBP requires BOTH solo and consolidated regulatory returns.
SECP requires consolidated IFRS financial statements for listed banking groups.

FSDM: CNSLDTN (Consolidation), LGL_ENTTY (Legal Entity), IC_TXN (Inter-Company Transaction), ELMNTN (Elimination), GRP_ENTTY (Group Entity), CNSLDTD_GL (Consolidated GL)
```

---

#### SLIDES 40-41: Functional Profit & Loss Statement + Maturity

**Pakistan enrichment — CRITICAL FOR UBL CONTEXT:**
- Objectives ADD: "Deliver branch-level P&L for all 16,000+ branches across Pakistan"
- "Customer-level profitability P&L (building on UBL's Customer Profitability Engine)"
- "Product-level P&L across conventional and Islamic product lines"
- "Business segment P&L per SBP/IFRS 8 requirements: Corporate, Commercial, Retail, Treasury, Islamic, Digital"
- Data ADD: "FSDM star schema: FACT_CUSTOMER_PROFITABILITY (35+ measures), activity-based costing allocations, FTP rates, direct and allocated costs"

**Speaker Notes:**
```
PAKISTAN FUNCTIONAL P&L CONTEXT:
This is the MOST CRITICAL capability for Pakistan banks and directly relates to UBL's Customer Profitability Engine:

P&L DIMENSIONS REQUIRED:
1. BRANCH P&L: Revenue, cost, and profit for each of 16,000+ branches
2. CUSTOMER P&L: Individual customer profitability across all products held
3. PRODUCT P&L: Profitability by product (CASA, Term Deposit, Personal Loan, Credit Card, etc.)
4. SEGMENT P&L: Business segments per IFRS 8 (Corporate, Commercial, Retail, Treasury, Islamic)
5. CHANNEL P&L: Cost-to-serve by channel (branch, ATM, digital, contact center)
6. REGION P&L: Geographic profitability (province, city, area)

P&L COMPONENTS:
- NET INTEREST INCOME: Actual interest earned/paid, adjusted for FTP (Funds Transfer Pricing)
- NON-INTEREST INCOME: Fees, commissions, FX gains, dividend income
- DIRECT COSTS: Salary, rent, depreciation directly attributable
- ALLOCATED COSTS: IT, head office, shared services allocated via activity-based costing
- PROVISION CHARGE: IFRS 9 ECL provision allocated to customer/product/branch
- TAX: Proportional tax allocation

ISLAMIC P&L: Different line items — "profit earned on financing" not "interest income", "return on deposits" not "interest expense". Mudaraba profit-sharing ratios replace interest rates.

UBL CONTEXT: The Customer Profitability Engine built on FSDM star schema is the foundation. FACT_CUSTOMER_PROFITABILITY contains 35+ measures including FTP-adjusted NII, fee income, direct costs, allocated costs, provision charge, and net profit — all at individual customer level, aggregatable to any dimension.

FSDM: PL_STMNT (P&L Statement), RVNU (Revenue), EXPNS (Expense), NII (Net Interest Income), FEE_INCM (Fee Income), FTP (Funds Transfer Pricing), CST_ALLCTN (Cost Allocation), PRFT (Profit), BRCH (Branch), SGMNT (Segment)
```

---

### PART D: EPM INTRODUCTION (Slides 42-46)

**Slides 42-46 — Add Pakistan context:**

- "EPM in Pakistan banking must cover both conventional financial metrics AND Islamic banking performance indicators"
- "SBP increasingly demands forward-looking analytics (stress testing, scenario analysis) — not just backward-looking reporting"
- "Pakistan banking KPIs: ROE (target >20%), ROA (target >1.5%), NIM (spread), Cost-to-Income (target <50%), NPL ratio, CASA ratio, CAR (min 11.5%)"
- "Budget and planning cycles in Pakistan banks are manual (3-4 months) — target: automated rolling forecasts"

**Speaker Notes:**
```
PAKISTAN BANKING KPIs (industry benchmarks):
- Return on Equity (ROE): 20-30% (top banks), 10-15% (mid-tier)
- Return on Assets (ROA): 1.0-2.0%
- Net Interest Margin (NIM): 3-5%
- Cost-to-Income: 45-65% (range across banks)
- NPL Ratio: 5-10% (varies by bank)
- CASA Ratio: 40-55%
- Capital Adequacy Ratio (CAR): Min 11.5% (SBP), top banks 15-20%
- Advances-to-Deposits Ratio (ADR): 45-55% (low — banks invest heavily in government securities)
- Liquidity Coverage Ratio (LCR): Min 100% (SBP Basel III requirement)

EPM capabilities in File 08 will detail: Revenue Analytics, ABC, Profitability Modeling, FTP, Pricing, Performance Management, Budget & Forecasting.

FSDM: KPI (Key Performance Indicator), PRFMNC (Performance), BDGT (Budget), FRCST (Forecast), TRGTS (Targets), VRNS (Variance)
```

---

## TERADATA BRANDING REMOVAL

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" | "Enterprise Analytics Platform" |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |
| "H1 2018" | "H1 2025 — H2 2026" |
| "For use in Maturity Assessment & Roadmap Engagements" | REMOVE from slide face |
| Triangle color legend in notes | Replace with Pakistan context + FSDM |

## CONTENT DENSITY RULES

Same as Files 03-06. Condense on slide, full detail in speaker notes.

## FINAL OUTPUT (49+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Domain Dashboard** | **NEW** |
| **2** | **Pakistan Finance Landscape** | **NEW** |
| 3-17 | FPM Overview (15 slides) | Enriched |
| 18 | Section Divider | Updated |
| 19-23 | Accounting Ops Overview | Enriched |
| 24-43 | 10 Accounting Capabilities (pairs) | All enriched |
| 44-48 | EPM Introduction | Enriched |
| **49** | **Implementation Roadmap** | **NEW** |

## VISUAL QA CHECKLIST

```
No overflow in any table cell
Font >= 10pt everywhere
No Teradata branding
Pakistan context on every capability slide
Speaker notes with SBP/IFRS 9/AAOIFI/FSDM context
3 new slides present
Maturity tables updated
Islamic accounting context included where relevant
```
