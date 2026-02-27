# FSDM v16.00.00 Analysis Report
**Generated:** 2026-02-27 07:35:07
**Source:** Teradata Financial Services Data Model v16.00.00 (XSD Schema)

## Executive Summary

| Metric | Count |
|--------|-------|
| Entities | 3,917 |
| Attributes | 15,364 |
| Relationships | 5,636 |
| Inheritance Chains | 839 |
| Classword Types | 22 |
| Avg Attrs/Entity | 3.9 |

## Classword Type Mapping

| Classword | Teradata Type |
|-----------|--------------|
| Classword_Amount | DECIMAL(18,4) |
| Classword_Blob | BLOB |
| Classword_Clob | CLOB |
| Classword_Code | VARCHAR(50) |
| Classword_Count | INTEGER |
| Classword_Date | DATE |
| Classword_Datetime | TIMESTAMP |
| Classword_Description | VARCHAR(500) |
| Classword_Geospatial | ST_GEOMETRY |
| Classword_Identifier | BIGINT |
| Classword_Indicator | CHAR(1) |
| Classword_Measure | DECIMAL(18,4) |
| Classword_Name | VARCHAR(100) |
| Classword_Number | VARCHAR(50) |
| Classword_Percent | DECIMAL(7,4) |
| Classword_Period_Date | PERIOD(DATE) |
| Classword_Period_Datetime | PERIOD(TIMESTAMP) |
| Classword_Quantity | DECIMAL(18,4) |
| Classword_Rate | DECIMAL(10,6) |
| Classword_Text | VARCHAR(2000) |
| Classword_Time | TIME |
| Classword_Value | DECIMAL(18,4) |

## Domain Classification

| Domain | Entity Count |
|--------|-------------|
| Other | 1,197 |
| Party Management | 622 |
| Agreement/Account | 506 |
| Campaign/Marketing | 230 |
| Product Management | 209 |
| Investment Management | 191 |
| Channel Management | 165 |
| Claims Management | 156 |
| Financial Transaction | 141 |
| Risk Management | 133 |
| Event Management | 109 |
| Web Analytics | 77 |
| Asset Management | 71 |
| Reference Data | 39 |
| Human Resources | 36 |
| Location/Geography | 35 |

## Hub Entities (Most Connected)

| Entity | Relationships |
|--------|--------------|
| PARTY | 299 |
| CURRENCY | 206 |
| UNIT_OF_MEASURE | 172 |
| TIME_PERIOD_TYPE | 108 |
| AGREEMENT | 102 |
| PRODUCT | 88 |
| FEATURE | 71 |
| RISK_CALCULATION_SCENARIO | 50 |
| ORGANIZATION | 47 |
| PARTY_ASSET | 46 |
| SITE | 45 |
| LOCATOR | 44 |
| CLAIM | 43 |
| PRODUCT_GROUP | 43 |
| EVENT | 42 |
| RISK_GRADE_VALUE | 40 |
| GEOGRAPHICAL_AREA | 36 |
| DOCUMENT | 35 |
| OPPORTUNITY | 34 |
| RISK_GRADE_SCHEME | 34 |

## Major Inheritance Hierarchies

| Root Entity | Descendants |
|------------|------------|
| AGREEMENT | 102 |
| EVENT | 83 |
| PRODUCT | 78 |
| GL_MAIN_ACCOUNT | 75 |
| LOCATOR | 40 |
| PARTY | 27 |
| ASSOCIATE_PAYROLL_TRANSACTION | 26 |
| VISITOR_INTERACTION_EVENT | 25 |
| DOCUMENT | 21 |
| CHANNEL_INSTANCE | 15 |
| FEATURE | 15 |
| PARTY_ASSET | 14 |
| CHANNEL_TYPE | 13 |
| AD_PLACEMENT | 12 |
| ORGANIZATION_BUSINESS_TYPE | 11 |

## Profitability Engine

The profitability star schema has been generated with:
- **FACT_CUSTOMER_PROFITABILITY** - Monthly customer-level P&L
- **FACT_AGREEMENT_PROFITABILITY** - Account-level profitability
- **FACT_BRANCH_PROFITABILITY** - Branch-level aggregation
- **7 Dimension tables** (Customer, Product, Branch, Segment, Channel, Time, Geography)
- **Key measures:** NII, FTP, Fees, Costs, Provisions, RAROC, ROE, CIR

See `profitability_star_schema.sql` and `profitability_calc_framework.md` for details.