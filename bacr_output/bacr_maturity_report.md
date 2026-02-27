# BACR Maturity Assessment Report
## United Bank Limited — Profitability Engine Integration

---

## 1. Executive Summary

This report analyzes Teradata's **Business & Analytics Capability Review (BACR)** framework
comprising **771 questions** across **8 categories**,
mapped to the **Banking Business Value Framework (BVF)** and **Financial Services Data Model (FSDM)**.

### Key Findings

- **191** questions are relevant to the Financial industry
- **197** Outcome questions mapped to **77** BVF capabilities
- **127** questions are profitability-critical
- Overall profitability maturity: **2.1/5** (target: 4.17/5, gap: 2.07)
- **4 implementation phases** defined to build the profitability engine

## 2. BACR Structure

The BACR framework assesses organizational maturity across 8 categories using a 5-level scale:

| Level | Name | Description |
|---|---|---|
| 1 | Emerging | Initial/ad-hoc capabilities |
| 2 | Developing | Basic processes established |
| 3 | Practicing | Consistent enterprise practices |
| 4 | Innovating | Optimized and data-driven |
| 5 | Leading | Industry-leading capabilities |

### Categories

| Category | Questions | Financial Qs | Sections |
|---|---|---|---|
| Outcomes | 220 | 191 | Analytic Capabilities |
| Information | 102 | 0 | Architecture, Data Centricity, Data Coverage, Data Organisation, Data Quality (+8 more) |
| Systems | 100 | 0 | Architecture, Hadoop, Infra, Infrastructure Models, OpMgmt (+6 more) |
| Applications | 54 | 0 | Analytic Apps, Architecture, Availability, Data Orchestration, Roadmap (+2 more) |
| Governance | 37 | 0 | Bus Governance, Data Governance, Roadmap, Strategy, Summary (+1 more) |
| Business | 42 | 0 | Funding, ROI, Roadmap, Strategy, Summary |
| Culture | 30 | 0 | Business Analytics/IT Alignment, Data Drive Mindset, Roadmap, Strategy, Summary |
| Agility | 186 | 0 | Agile, Communications, DevOps, Methodology, Organisational Change Management (+4 more) |

## 3. BACR → BVF Capability Mapping

The 220 BACR Outcome questions were matched to 112 BVF capabilities using:
- **Direct name mapping** (known correspondences)
- **Fuzzy string matching** (SequenceMatcher, threshold > 0.3)
- **Business function alignment** scoring

**Results:** 197 mapped, 23 BACR-only (no BVF equivalent)

### Top Profitability-Critical Mappings

| BACR Question | BVF Capability | BVF Area | Score |
|---|---|---|---|
| solid understanding of customer value and profitab | Customer Value | Marketing and Customer Experience | 0.95 |
| Manage Product Profitability | Profitability Modelling | Finance & Peformance Management | 0.95 |
| Billing and Collections analysis | Collection Strategy Model | Risk Management & Regulation | 0.95 |
| Procurement and Payment analysis | Business Process Analytics & Optimisation | Finance & Peformance Management | 0.95 |
| Sub-ledger accounting analyis | Financial Accounting / Accounting Hub | Finance & Peformance Management | 0.95 |
| Fair Value and Hedge Accounting | Fair Value & Hedge Accounting | Finance & Peformance Management | 0.95 |
| Asset Valuations | Fair Value & Hedge Accounting | Finance & Peformance Management | 0.95 |
| Reserve Analytics | Financial Accounting / Accounting Hub | Finance & Peformance Management | 0.95 |
| Tax Management and Optimisation | Tax Management & Optimisation | Finance & Peformance Management | 0.95 |
| Reconciliation | Reconciliation, Validation & Adjustments | Finance & Peformance Management | 0.95 |
| Financial Consolidation | Financial Consolidation | Finance & Peformance Management | 0.95 |
| Functional Profit and Loss Statement | Functional Profit & Loss Statement (P&L) | Finance & Peformance Management | 0.95 |
| Revenue Analytics | Profitability Analytics and Optimisation | Finance & Peformance Management | 0.95 |
| GL | GL, AP, HR, Expense Analytics & Optimisation | Finance & Peformance Management | 0.95 |
| Activity-Based Costing | Activity Based Costing | Finance & Peformance Management | 0.95 |
| Future / Lifetime Value | Future / Lifetime Value | Finance & Peformance Management | 0.95 |
| Profitability Analytics and Optimisation | Profitability Analytics and Optimisation | Finance & Peformance Management | 0.95 |
| Performance Management and KPIs | Performance Management and KPIs | Finance & Peformance Management | 0.95 |
| Inventory Analytics | Business Process Analytics & Optimisation | Finance & Peformance Management | 0.95 |
| Financial Budgetting | Financial Budgeting, Planning & Forecasting | Finance & Peformance Management | 0.95 |

## 4. BACR Information → FSDM Data Domain Mapping

The 102 Information category questions assess data management maturity
and map to FSDM domains as follows:

| Information Section | Questions | FSDM Domains | Profitability Impact |
|---|---|---|---|
| Architecture | 6 | Agreement, Channel, Event, Location | Architecture maturity determines if FSDM can be deployed as  |
| Data Centricity | 2 | Agreement, Party | Customer-centric data design enables customer-level profitab |
| Data Coverage | 10 | Agreement, Event, Party, Product | Gaps in data coverage = gaps in profitability measures |
| Data Organisation | 8 | Agreement, Event, Location, Party | Logical data organization affects query performance for prof |
| Data Quality | 5 | Agreement, Event, Party | Data quality directly affects profitability calculation accu |
| Data Tiers | 3 | Agreement, Event, Party, Product | Data tiering affects historical profitability trend availabi |
| Data Usage Zones | 2 | Agreement, Event, Party, Product | Analytics sandboxes enable profitability model development |
| Master Data Management | 19 | Agreement, Location, Party, Product | MDM maturity determines quality of dimension data in profita |
| Metadata Management | 15 | Agreement, Event, Location, Party | Metadata enables profitability data lineage and audit trail |
| Roadmap | 1 | Agreement, Event, Location, Party | Implementation planning enables phased profitability build-o |
| Security and Privacy | 23 | Party | Privacy constraints may limit customer-level profitability g |
| Strategy | 2 | Agreement, Event, Location, Party | Data strategy maturity determines long-term profitability en |
| Summary | 6 | Agreement, Event, Location, Party | Overall data accessibility determines profitability data ava |

## 5. Profitability Maturity Profile

**Overall Score: 2.1/5** (Target: 4.17/5)

### Component Maturity

| Component | Current | Target | Gap | Capabilities |
|---|---|---|---|---|
| Revenue Maturity | 2.6 | 4.6 | 2.0 | 5 |
| Cost Maturity | 2.0 | 4.0 | 2.0 | 4 |
| Risk-Adjusted Return Maturity | 2.0 | 4.0 | 2.0 | 7 |
| Treasury/Pricing Maturity | 2.0 | 4.14 | 2.14 | 7 |
| Reporting Maturity | 2.0 | 4.14 | 2.14 | 7 |

### Critical Gaps

**1. Funds Transfer Pricing** — Gap: 3 (2→5)
   - Component: Treasury/Pricing Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.ftp_charge, ftp_credit, net_interest_margin
   - FSDM Entities: AGREEMENT, INTEREST_RATE, PRODUCT

**2. Functional Profit & Loss Statement (P&L)** — Gap: 3 (2→5)
   - Component: Reporting Maturity
   - Star Schema Impact: Core output - functional P&L by customer/product/channel
   - FSDM Entities: PARTY, PRODUCT, INTERNAL_ORGANIZATION, AGREEMENT

**3. Transaction Classification** — Gap: 2 (3→5)
   - Component: Revenue Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.interest_income, fee_income
   - FSDM Entities: FINANCIAL_TRANSACTION, ACCOUNT, PRODUCT

**4. Customer Value** — Gap: 2 (3→5)
   - Component: Revenue Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.total_revenue
   - FSDM Entities: PARTY, INDIVIDUAL, AGREEMENT

**5. Profitability Modelling** — Gap: 2 (3→5)
   - Component: Revenue Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY - all revenue measures
   - FSDM Entities: AGREEMENT, PRODUCT, FINANCIAL_TRANSACTION

**6. Sales Reporting** — Gap: 2 (2→4)
   - Component: Revenue Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.fee_income, commission_income
   - FSDM Entities: AGREEMENT, PRODUCT, EVENT

**7. Pricing Analysis & Optimisation** — Gap: 2 (2→4)
   - Component: Revenue Maturity
   - Star Schema Impact: DIM_PRODUCT.pricing attributes
   - FSDM Entities: PRODUCT, PRODUCT_FEATURE, INTEREST_RATE

**8. Activity Based Costing** — Gap: 2 (2→4)
   - Component: Cost Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.direct_cost, indirect_cost_allocation
   - FSDM Entities: INTERNAL_ORGANIZATION, EVENT, AGREEMENT

**9. GL, AP, HR, Expense Analytics & Optimisation** — Gap: 2 (2→4)
   - Component: Cost Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.overhead_allocation
   - FSDM Entities: INTERNAL_ORGANIZATION, GL_ACCOUNT

**10. Business Process Analytics & Optimisation** — Gap: 2 (2→4)
   - Component: Cost Maturity
   - Star Schema Impact: FACT_CUSTOMER_PROFITABILITY.operational_cost
   - FSDM Entities: EVENT, INTERNAL_ORGANIZATION

## 6. Gap Analysis

### Quick Wins (Current ≥ 3, Gap ≤ 2)

- **Profitability Analytics and Optimisation**: Current=3, Gap=2, Priority Score=21.06
- **Profitability Modelling**: Current=3, Gap=2, Priority Score=18.09
- **Customer Value**: Current=3, Gap=2, Priority Score=7.02
- **Transaction Classification**: Current=3, Gap=2, Priority Score=1.35

### Biggest Gaps (Gap ≥ 3)

- **Funds Transfer Pricing**: 2→5 (gap=3)
  - Critical gap: Immediate focus needed for Funds Transfer Pricing
  - Establish foundational data sourcing and integration
- **Functional Profit & Loss Statement (P&L)**: 2→5 (gap=3)
  - Critical gap: Immediate focus needed for Functional Profit & Loss Statement (P&L)
  - Establish foundational data sourcing and integration

## 7. Implementation Roadmap

### Phase 1: Foundation (Maturity 1→2)

**Effort:** L | **Prerequisites:** None

**Capabilities:**
- Single Interaction View of Customer
- Transaction Classification
- Customer Value

**Enables:** Basic customer profitability at account level

**Key FSDM Entities:** PARTY, INDIVIDUAL, ORGANIZATION, AGREEMENT, ACCOUNT, FINANCIAL_TRANSACTION, PRODUCT, INTERNAL_ORGANIZATION

### Phase 2: Core Profitability (Maturity 2→3)

**Effort:** XL | **Prerequisites:** 1

**Capabilities:**
- Funds Transfer Pricing
- Activity Based Costing
- Profitability Modelling
- Financial Accounting / Accounting Hub
- Sales Reporting

**Enables:** NII calculation, direct cost allocation, basic P&L by customer

**Key FSDM Entities:** INTEREST_RATE, BALANCE, GL_ACCOUNT, PRODUCT_FEATURE, INTERNAL_ORGANIZATION, EVENT

### Phase 3: Risk-Adjusted (Maturity 3→4)

**Effort:** XL | **Prerequisites:** 1, 2

**Capabilities:**
- Credit Risk Scoring (Underwriting Likelihood Model)
- Credit Risk Expected Loss Model
- Credit Risk Based Pricing Model
- Capital Management (Planning and Allocation)
- Risk Appetite

**Enables:** RAROC, risk-adjusted profitability, economic capital allocation

**Key FSDM Entities:** ANALYTICAL_MODEL, RISK_EXPOSURE, COLLATERAL, PROVISION, WRITE_OFF

### Phase 4: Advanced Analytics (Maturity 4→5)

**Effort:** XL | **Prerequisites:** 1, 2, 3

**Capabilities:**
- Profitability Analytics and Optimisation
- Future / Lifetime Value
- Customer Segmentation
- Performance Management and KPIs
- Executive Dashboards
- Functional Profit & Loss Statement (P&L)

**Enables:** Predictive profitability, LTV models, dynamic pricing, real-time dashboards

**Key FSDM Entities:** All entities - full star schema deployment

## 8. Cross-Category Dependencies

The profitability engine depends on maturity across multiple BACR categories:

```
Information (Data) → Outcomes (Capabilities) → Business (Value)
     ↑                      ↑                        ↑
 Governance ←─── Systems (Technology) ──→ Applications
     ↑                      ↑
  Culture ←──────── Agility
```

| Readiness Area | Category | Avg Maturity | Questions | Blocking Gaps |
|---|---|---|---|---|
| Data Readiness | Information | 2.38 | 42 | 5 |
| Technology Readiness | Systems | 3.0 | 44 | 2 |
| Governance Readiness | Governance | 2.0 | 28 | 3 |
| Capability Maturity | Outcomes | 2.0 | 220 | 1 |
| Application Readiness | Applications | 2.22 | 27 | 2 |

## 9. UBL-Specific Recommendations

Based on UBL's known context (Teradata DW, FSDM v13, existing Customer Profitability Engine):

### Immediate Priorities
1. **Funds Transfer Pricing** (gap=3): Deploy FTP rate curve management with matched-maturity methodology
2. **Functional P&L** (gap=3): Build multi-dimensional P&L by customer/product/channel/branch
3. **Activity-Based Costing**: Develop cost allocation models using existing FSDM organization hierarchy

### Leverage Existing Strengths
- FSDM v13 deployment provides strong data architecture foundation (Information Architecture: 3/5)
- Existing profitability engine can be extended rather than rebuilt
- Teradata infrastructure maturity (Systems: 3/5) supports processing requirements

### Address Gaps
- **Data Governance** (2/5): Establish data quality KPIs for profitability-critical entities
- **Master Data Management** (2/5): Strengthen customer and product master data for reliable profitability
- **Risk Models** (2/5): Integrate PD/LGD models for RAROC-based profitability

---

*Generated from BACR Interview Master (DA004462) integrated with BVF Data Mappings and FSDM Schema*