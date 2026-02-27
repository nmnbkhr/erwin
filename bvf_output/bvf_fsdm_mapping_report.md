# BVF → FSDM Mapping Report
**Generated:** 2026-02-27 08:39

---

## 1. Executive Summary

This report documents the mapping between **Teradata's Banking Business Value Framework (BVF)** and the **Financial Services Data Model (FSDM)** v16.00, with a focus on profitability engine readiness.

| Metric | Value |
|---|---|
| BVF Capabilities | 112 |
| BVF Data Requirements | 113 |
| Capability→Data Mappings | 5267 |
| FSDM Entities Mapped | 1197 |
| Data Reqs with FSDM Match | 113/113 |
| Profitability-Critical Capabilities | 18 |
| Star Schema Coverage | 81.6% |

**Key Finding:** Implementing the top 20 data requirements (Tier 1) enables **97.3%** of all capabilities (109/112).

---

## 2. BVF Structure Overview

The Banking BVF organizes **112 capabilities** across **3 areas** and **12 sub-areas**, consuming/producing **113 data requirements**.

### Marketing and Customer Experience (39 capabilities)

- **Customer Insight** (10 capabilities): Transaction Classification, Predictive Models, Event Detection, Customer Value, Customer, Product & Channel  insight +5 more
- **Define & Deploy Business Rules** (9 capabilities): Scope of Contact, Customer Contact Policy, Campaign Business Cases, Omni Channel Campaign Management, Creation & Management of Offers and Content +4 more
- **Delivery of Insight to Channels** (10 capabilities): Channel Coverage, Real Time Omni-Channel  Integration, Next Best Action Arbitration, Contextual Decisioning, Recycle Unused Leads into alternative channels +5 more
- **Reporting & Continuous Improvement** (10 capabilities): Campaign ROI Reporting by Channel, Lead/Sales Funnel Analytics  & Reporting, Marketing Attribution MI across all channels, Marketing Asset Evaluation, Earned, Paid & Owned media analysis +5 more

### Risk Management & Regulation (42 capabilities)

- **Risk Insight** (9 capabilities): Application and New Business Written, Single Customer View from a Risk Perspective, Policy, Forensics and Underwriter Rules, Can’t Pay, Won’t Pay and Collusion, Roll and Rehabilitation Rates +4 more
- **Modelling and Predictiions** (18 capabilities): Credit Risk Scoring (Underwriting Likelihood Model), Credit Risk Expected Loss Model, Credit Risk Underwriting/Monitoring Strategy Model, Credit Risk Capital, CVaR Modelling, Credit Risk Based Pricing Model +13 more
- **Execution & Delivery** (9 capabilities): Business Rules Directory, Regulatory Threshold Calculation, Risk Based Price Calculation, Active Portfolio Management, Dynamic Datastore +4 more
- **Reporting & BI** (6 capabilities): New Business MI & Reporting, Model Performance Analytics, Portfolio MI & Portfolio Performance Analytics, Collections MI, Regulatory Reporting and Information Sharing +1 more

### Finance & Peformance Management (31 capabilities)

- **Financial Accounting** (8 capabilities): Financial Accounting / Accounting Hub, Financial Consolidation, Functional Profit & Loss Statement (P&L), Fair Value & Hedge Accounting, Reconciliation, Validation & Adjustments +3 more
- **Financial Planning & Controlling** (9 capabilities): Activity Based Costing, Profitability Modelling, Future / Lifetime Value, Profitability Analytics and Optimisation, Performance Management and KPIs +4 more
- **Treasury Mgmt & Insight** (7 capabilities): Funds Transfer Pricing, Asset & Liability Management, Capital Planning and Management, Cashflow Generation, Liquidity Management +2 more
- **MIS & Reporting** (7 capabilities): Statutory Financial Reporting, Regulatory & Compliance Reporting, Sales Reporting, Performance Reporting, Exception Reporting +2 more

---

## 3. FSDM Coverage Analysis

### 3.1 Coverage Summary

| Metric | Count |
|---|---|
| Data Reqs with FSDM Entity Match | 113 |
| Data Reqs without Match | 0 |
| Total Unique FSDM Entities Mapped | 1197 |

### 3.2 Coverage by FSDM Domain

| Domain | Entities Mapped |
|---|---|
| Other | 898 |
| Party Management | 657 |
| Agreement/Account | 373 |
| Channel Management | 251 |
| Risk Management | 160 |
| Campaign/Marketing | 154 |
| Claims Management | 150 |
| Investment Management | 147 |
| Product Management | 133 |
| Financial Transaction | 93 |
| Reference Data | 42 |
| Asset Management | 33 |
| Event Management | 21 |
| Web Analytics | 21 |
| Human Resources | 8 |

### 3.3 Coverage by BVF Subject Area

| Subject Area | Entity Mappings |
|---|---|
| Event | 700 |
| Agreement | 585 |
| Party | 473 |
| Party or Agreement | 210 |
| Campaign | 180 |
| Product | 177 |
| Cross Subject - Document | 150 |
| Not Covered | 90 |
| Finance | 80 |
| Location | 60 |
| Party Asset | 60 |
| Analytical Model | 60 |
| Cross Subject - Multi-media object | 60 |
| Internal Organisation | 57 |
| Party & Product | 30 |
| Cross Subject  -  Limits | 30 |
| Event or Cross Subject - Document | 30 |
| Channel | 30 |
| Cross Subject - Survey | 30 |
| Cross Subject - Watch List | 30 |
| Cross Subject | 21 |

---

## 4. Profitability Engine Readiness

### 4.1 Star Schema Coverage

| Metric | Value |
|---|---|
| Total Star Schema Measures | 49 |
| Fully Covered | 40 |
| Partially Covered | 9 |
| Gaps | 0 |
| Coverage Rate | 81.6% |

### 4.2 Critical Path

The profitability engine requires these data flows:

| Star Schema Column | Key Source Data Requirements |
|---|---|
| FACT_CUSTOMER_PROFITABILITY.Interest_Income_Amt | Financial Transactions, Account Balances |
| FACT_CUSTOMER_PROFITABILITY.Interest_Expense_Amt | Financial Transactions, Account Balances |
| FACT_CUSTOMER_PROFITABILITY.Net_Interest_Income_Amt | Account Balances |
| FACT_CUSTOMER_PROFITABILITY.FTP_Credit_Amt | Master & Ref Data - FTP rates |
| FACT_CUSTOMER_PROFITABILITY.FTP_Charge_Amt | Master & Ref Data - FTP rates |
| FACT_CUSTOMER_PROFITABILITY.Net_FTP_Amt | Master & Ref Data - FTP rates |
| FACT_CUSTOMER_PROFITABILITY.Fee_Income_Amt | Account Fees, Commissions & Charges |
| FACT_CUSTOMER_PROFITABILITY.Commission_Income_Amt | Account Fees, Commissions & Charges |
| FACT_CUSTOMER_PROFITABILITY.FX_Gain_Loss_Amt | Master & Ref Data - exchange rates, FX Trading |
| FACT_CUSTOMER_PROFITABILITY.Other_Income_Amt | Financial Transactions |
| FACT_CUSTOMER_PROFITABILITY.Total_Revenue_Amt | Account Balances, Financial Transactions |
| FACT_CUSTOMER_PROFITABILITY.Direct_Cost_Amt | Finance Systems - General Ledger, Service Usage |
| FACT_CUSTOMER_PROFITABILITY.Channel_Cost_Amt | Master & Ref Data - Channel, Service Usage |
| FACT_CUSTOMER_PROFITABILITY.Operations_Cost_Amt | Finance Systems - ERP, Finance Systems - General Ledger |
| FACT_CUSTOMER_PROFITABILITY.Indirect_Cost_Amt | Finance Systems - ERP, Master & Ref Data - organisation hierarchy |
| FACT_CUSTOMER_PROFITABILITY.Total_Cost_Amt | Finance Systems - General Ledger |
| FACT_CUSTOMER_PROFITABILITY.Provision_Expense_Amt | Provisions, Losses & Writeoffs, Risk Exposures |
| FACT_CUSTOMER_PROFITABILITY.Risk_Weighted_Asset_Amt | RWA & Capital, Risk Weighted Assets & Capital Results |
| FACT_CUSTOMER_PROFITABILITY.Economic_Capital_Amt | RWA & Capital |
| FACT_CUSTOMER_PROFITABILITY.Expected_Loss_Amt | Expected Loss / PD / LGD / EAD, Risk Exposures |
| FACT_CUSTOMER_PROFITABILITY.Net_Profit_Amt | Profitability Results |
| FACT_CUSTOMER_PROFITABILITY.RAROC_Pct | Profitability Results, RWA & Capital |
| FACT_CUSTOMER_PROFITABILITY.Return_On_Equity_Pct | Profitability Results |
| FACT_CUSTOMER_PROFITABILITY.Cost_To_Income_Ratio_Pct | Profitability Results |
| FACT_CUSTOMER_PROFITABILITY.Economic_Profit_Amt | Profitability Results, RWA & Capital |
| FACT_CUSTOMER_PROFITABILITY.Avg_Balance_Amt | Account Balances |
| FACT_CUSTOMER_PROFITABILITY.Transaction_Count | Financial Transactions |
| FACT_CUSTOMER_PROFITABILITY.Product_Count | Account Holdings |

---

## 5. Data Reuse Analysis

| Metric | Value |
|---|---|
| Average Reuse Coefficient | 0.5038 |
| Highest Reuse Pair | Transaction Classification ↔ Big Data Analytics (1.0) |
| Capability Clusters (>0.5) | 5 |
| Most-Reused Data Requirement | Customer Segments (96 capabilities) |

### ROI Argument

Implementing the **top 20 data requirements** (Tier 1) will:
- Enable **109** of 112 capabilities (97.3%)
- Cover **583** FSDM entities
- Achieve **81.6%** star schema coverage

---

## 6. Implementation Roadmap

### Tier Summary

| Tier | Data Reqs | Description |
|---|---|---|
| Tier 1 (Must Have) | 20 | Essential for profitability engine |
| Tier 2 (Should Have) | 30 | Enhance profitability + enable risk/marketing |
| Tier 3 (Nice to Have) | 30 | Full BVF coverage |
| Tier 4 (Future) | 33 | Specialized capabilities |

### Tier 1 — Top 20 Priority Data Requirements

| Rank | Data Requirement | Score | Profit Caps | Subject Area |
|---|---|---|---|---|
| 1 | Customer Segments | 101.0 | 16 | Party |
| 2 | Account Status (open closed active / domant /inactive / closure reason ) | 92.51 | 16 | Agreement |
| 3 | Customer Demographics | 92.5 | 14 | Party |
| 4 | Account / Policy / Service Detail | 90.02 | 16 | Agreement |
| 5 | Master & Reference Data - product | 89.02 | 16 | Product |
| 6 | Account / Policy / Service Holdings | 89.01 | 15 | Agreement |
| 7 | Account Balances | 88.52 | 15 | Agreement |
| 8 | Account Maturity Dates & Repricing Schedules | 86.01 | 16 | Agreement |
| 9 | Master & Reference Data - organisation hierarchy | 84.0 | 15 | Internal Organisation |
| 10 | Provisions, Losses & Writeoffs | 82.0 | 14 | Party or Agreement |
| 11 | Single Customer View (Master Record) | 81.49 | 12 | Party |
| 12 | Defaults & Limit Breaches | 81.0 | 15 | Event |
| 13 | Account Repayment Schedules | 79.51 | 15 | Agreement |
| 14 | Master & Reference Data - geography / location | 77.52 | 13 | Location |
| 15 | Risk Exposures | 74.51 | 12 | Agreement |
| 16 | Financial Transactions | 73.49 | 11 | Event |
| 17 | Risk Segments, Cohorts & Groupings | 72.5 | 13 | Party or Agreement |
| 18 | Claims | 71.98 | 13 | Event |
| 19 | Account Limits | 70.01 | 12 | Cross Subject  -  Limits |
| 20 | Market / Trading Book Positions | 68.01 | 12 | Agreement |

---

## 7. Appendices

### A. Output Files

| # | File | Description |
|---|---|---|
| 1 | bvf_parsed_capabilities.json | 112 capabilities with data req mappings |
| 2 | bvf_parsed_data_requirements.json | 113 data reqs with capability mappings |
| 3 | bvf_reuse_matrix.json | Capability-to-capability reuse coefficients |
| 4 | bvf_to_fsdm_entity_map.csv | BVF data req → FSDM entity mapping |
| 5 | bvf_to_fsdm_entity_map.json | Same mapping in structured JSON |
| 6 | capability_entity_dependencies.csv | Each capability's FSDM entity footprint |
| 7 | capability_entity_summary.csv | Capability summary with entity counts |
| 8 | profitability_bvf_lineage.csv | Star schema ← FSDM ← BVF lineage |
| 9 | bvf_implementation_priority.csv | Ranked data reqs with implementation tiers |
| 10 | profitability_data_coverage.json | Star schema coverage analysis |
| 11 | bvf_capability_heatmap.html | Interactive capability × data heatmap |
| 12 | bvf_fsdm_sankey.html | BVF → FSDM Sankey flow diagram |
| 13 | profitability_lineage.html | Profitability measure lineage visual |
| 14 | bvf_reuse_network.html | Capability reuse network graph |
| 15 | implementation_roadmap.html | Tiered implementation roadmap |
| 16 | bvf_fsdm_mapping_report.md | This report |
| 17 | bvf_statistics.json | Summary statistics |
