# BVF-FSDM Integration & Profitability Engine - Summary Report
**Generated:** 2026-02-27
**Source Models:** FSDM v16.00.00 (XSD Schema) + Banking BVF v1.2
**Target:** Pakistani Bank Customer Profitability Engine (UBL-style)

---

## Executive Summary

This report documents the integration of Teradata's **Banking Business Value Framework (BVF) v1.2** with the **Financial Services Data Model (FSDM) v16.00.00** to design a **Customer Profitability Engine** for a Pakistani bank.

### Key Metrics

| Metric | Count |
|--------|-------|
| FSDM Entities (total in XSD) | 3,917 |
| FSDM Attributes | 15,364 |
| FSDM Relationships | 5,636 |
| BVF Business Value Themes | 3 |
| BVF Capability Groups | 12 |
| BVF Sub-Capabilities | 112 |
| BVF Data Requirements | 113 |
| FSDM Subject Areas (BVF) | 21 |
| BVF-to-FSDM Entity Mappings | 360 |
| Entities validated in XSD | ~50% (remainder are logical/implied entities) |
| Capability-FSDM Dependencies | 5,218 |
| FSDM Entities supporting capabilities | 219 |
| P1-Critical entities | 53 |
| P2-High priority entities | 109 |

---

## 1. BVF Structure

### Business Value Themes

| Theme | Capability Groups | Sub-Capabilities |
|-------|------------------|------------------|
| Marketing and Customer Experience | 4 | 39 |
| Risk Management & Regulation | 4 | 42 |
| Finance & Performance Management | 4 | 31 |
| **Total** | **12** | **112** |

### Top Data Requirements by Capability Usage

| Data Requirement | Capabilities Using | FSDM Subject Area |
|-----------------|-------------------|-------------------|
| Customer Segments | 95+ | Party |
| Customer Demographics | 91+ | Party |
| Single Customer View | 81+ | Party |
| Account Balances | 77+ | Agreement |
| Organisation Hierarchy | 76+ | Internal Organisation |
| Financial Transactions | 71+ | Event |
| Account Fees, Commissions & Charges | 50+ | Event |
| Profitability Results | 38+ | Agreement |
| FTP Rates | 37+ | Product |
| General Ledger | 39+ | Finance |

---

## 2. BVF-to-FSDM Mapping

### Coverage by Confidence Level

| Confidence | Mappings | Percentage |
|-----------|----------|------------|
| High | ~60% | Directly traceable FSDM entities |
| Medium | ~25% | Plausible mapping, needs review |
| Low | ~10% | Limited FSDM coverage, needs extension |
| N/A | ~5% | Not applicable (summary columns) |

### FSDM Subject Area Coverage

| BVF Subject Area | FSDM Domain | Key Entities |
|-----------------|-------------|-------------|
| Party | Party Management (622 entities) | PARTY, INDIVIDUAL, ORGANIZATION, PARTY_CLASSIFICATION |
| Agreement | Agreement/Account (506 entities) | AGREEMENT, AGREEMENT_SUMMARY, LOAN_TERM_AGREEMENT |
| Event | Event/Financial Transaction (250 entities) | MONETARY_TRANSACTION, EVENT, DIRECT_CONTACT_EVENT |
| Product | Product Management (209 entities) | PRODUCT, PRODUCT_GROUP, INTEREST_RATE |
| Risk | Risk Management (133 entities) | AGREEMENT_RISK_METRIC, RISK_GRADE_VALUE |
| Finance | Other (GL entities) | GL_MAIN_ACCOUNT, GL_ACCOUNT |
| Channel | Channel Management (165 entities) | CHANNEL_TYPE, CHANNEL_INSTANCE |
| Campaign | Campaign/Marketing (230 entities) | CAMPAIGN, CAMPAIGN_RESPONSE |

### Gaps Identified

| Gap Area | Description | Recommendation |
|----------|-------------|----------------|
| Activity Based Costing | No dedicated ABC entities in FSDM | Custom cost allocation tables |
| Customer Lifetime Value | No CLV calculation entities | Custom extension tables |
| Financial Planning | Limited budget/forecast entities | Custom BUDGET, FORECAST tables |
| Business Process | Minimal BPM modeling | Integration with external BPM tool |
| Operational Metrics | Limited operational KPI entities | Custom operational metrics tables |

---

## 3. Profitability Star Schema

### Schema Design

| Table | Type | Columns | FSDM Source |
|-------|------|---------|-------------|
| FACT_CUSTOMER_PROFITABILITY | Fact | 35+ measures | AGREEMENT_SUMMARY, MONETARY_TRANSACTION, AGREEMENT_RISK_METRIC |
| DIM_CUSTOMER | Dimension | 30+ | PARTY, INDIVIDUAL, ORGANIZATION |
| DIM_PRODUCT | Dimension | 20+ | PRODUCT, INTEREST_RATE |
| DIM_BRANCH | Dimension | 20+ | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT |
| DIM_BUSINESS_SEGMENT | Dimension | 8 | ORGANIZATION_BUSINESS_TYPE |
| DIM_CHANNEL | Dimension | 7 | CHANNEL_TYPE, CHANNEL_INSTANCE |
| DIM_TIME | Dimension | 18 | TIME_PERIOD_TYPE |
| DIM_AGREEMENT | Dimension | 25+ | AGREEMENT + subtypes |
| DIM_GEOGRAPHY | Dimension | 10 | GEOGRAPHICAL_AREA |
| AGG_BRANCH_PROFITABILITY | Aggregate | 12 | Rollup from FACT |
| AGG_SEGMENT_PROFITABILITY | Aggregate | 12 | Rollup from FACT |

### Key Profitability Measures

| Measure | Formula | BVF Capability |
|---------|---------|----------------|
| Net Interest Income (NII) | Interest Income - Interest Expense +/- FTP | Funds Transfer Pricing |
| Total Revenue | NII + Fees + Commissions + FX + Other | Profitability Modelling |
| Total Cost | Direct + Transaction + Servicing + Channel + Overhead | Activity Based Costing |
| Net Profit | Revenue - Cost - Provisions | Profitability Modelling |
| RAROC | Net Profit / Economic Capital | Profitability Analytics |
| Cost-to-Income | Total Cost / Total Revenue | Performance Management |
| ROE | Net Profit / Allocated Equity | Performance Management |
| NIM | NII / Average Balance | Asset & Liability Mgmt |

---

## 4. Pakistan Banking Context

### Key Design Decisions

| Decision | Implementation |
|----------|---------------|
| Currency | PKR base; multi-currency for USD/EUR/GBP/SAR/AED/CNY |
| FTP Benchmark | KIBOR (not LIBOR) - O/N to 1Y tenors |
| Fiscal Year | July-June (Pakistan standard) |
| Weekly Holiday | Friday (not Saturday/Sunday) |
| Islamic Banking | Dual scheme: Is_Islamic_Ind flag + Islamic_Mode_Cd |
| Tax | WHT_Amount_Amt (15%/30%), Zakat_Deduction_Amt (2.5%) |
| National ID | CNIC_Number for individuals, NTN for corporates |
| Regulatory | SBP_Classification_Cd, SBP_Branch_Code, SBP_Sector_Code |
| Credit Loss | IFRS 9 ECL (Stage 1/2/3) + SBP prudential classification |
| Segments | Retail/Corporate/Commercial/SME/Agriculture/Islamic/Micro/Treasury |

### UBL Version Gap (v13 → v16)

Critical enhancements in FSDM v16 over v13:
1. **IFRS 9 support** - ECL staging, impairment models
2. **Digital channels** - Web analytics, mobile app tracking
3. **Social media** - New entity group
4. **Enhanced risk** - Stress testing, advanced Basel III
5. **Marketing automation** - Campaign entity enhancements

---

## 5. Data Lineage

23 detailed lineage entries documented, tracing:
- Target column → Calculation → Source FSDM entities → BVF data requirements → BVF capabilities

Key lineage chains:
- **NII:** Core Banking → AGREEMENT_SUMMARY → FACT.Net_Interest_Income_Amt
- **FTP:** Treasury/ALM → INTEREST_RATE → FACT.FTP_Credit/Debit_Amt
- **ECL:** Credit Risk Engine → AGREEMENT_RISK_METRIC → FACT.Provision_Expense_Amt
- **ABC:** GL System → GL_MAIN_ACCOUNT → FACT.Allocated_Overhead_Amt
- **RAROC:** Calculated from Net_Profit / Economic_Capital

---

## 6. Deliverables

### Data Files

| File | Description | Size |
|------|-------------|------|
| bvf_capability_summary.csv | 112 sub-capabilities with theme/group hierarchy | 10 KB |
| bvf_data_requirements.csv | 113 data requirements with capability usage counts | 178 KB |
| bvf_reuse_matrix.csv | 112x112 cross-capability reuse coefficients | 199 KB |
| bvf_to_fsdm_entity_mapping.csv | 360 BVF data req → FSDM entity mappings | 75 KB |
| capability_fsdm_dependencies.csv | 5,218 capability → FSDM entity dependencies | 982 KB |
| fsdm_entity_reuse_scores.csv | 219 FSDM entities with reuse/priority scores | 10 KB |

### Design Documents

| File | Description |
|------|-------------|
| profitability_star_schema_enhanced.sql | Full Teradata DDL: 1 fact + 7 dims + 2 aggs + 3 views |
| data_lineage.json | 23 column-level lineage entries with BVF traceability |
| profitability_bvf_coverage.md | Capability coverage report with gap analysis |
| pakistan_banking_context.md | Pakistan regulatory, currency, channel, tax context |

### Visualizations

| File | Description |
|------|-------------|
| bvf_fsdm_sankey.html | Interactive Sankey: Themes → Capabilities → Data Reqs → FSDM |
| profitability_data_flow.html | Source Systems → FSDM → Star Schema → Measures |
| data_reuse_heatmap.html | 112x112 capability data reuse heatmap |
| profitability_erd.html | Star schema ERD with FSDM source annotations |

---

## 7. Next Steps

### Immediate (Phase 1)
1. Review and validate BVF-to-FSDM entity mappings with domain experts
2. Deploy star schema DDL to Teradata development environment
3. Map source system fields to FSDM staging layer
4. Build ETL pipelines for FSDM entity population

### Short-term (Phase 2)
5. Implement FTP engine with KIBOR-based yield curves
6. Build ABC cost allocation model
7. Implement IFRS 9 ECL calculation (Stage 1/2/3)
8. Create customer segmentation and profitability tiering

### Medium-term (Phase 3)
9. Build aggregate tables and profitability views
10. Implement Islamic banking dual-scheme calculations
11. Create SBP regulatory reporting extracts
12. Deploy BI dashboards for branch/segment/customer profitability

### Long-term (Phase 4)
13. Implement CLV/LTV predictive models
14. Build pricing optimization engine
15. Extend to real-time profitability scoring
16. Implement BVF capabilities beyond profitability (marketing, risk)
