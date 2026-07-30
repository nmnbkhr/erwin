# Claude Code Prompt 2: FSDM XSD Analyzer + Profitability Engine Foundation

## Context
We have the **Teradata FSDM v16.00.00 XSD schema** file that defines the complete Financial Services Data Model. This file has already been analyzed and contains:
- **3,933 entities** with 15,430 attributes
- **5,656 relationships** with 844 inheritance chains
- **22 Classword data types**
- Core hub entities: PARTY (289 rels), CURRENCY (205), AGREEMENT (90), PRODUCT (85)

The file is located at: `/mnt/e/erwin/tds.xsd`

## Objective
Parse the XSD completely and build the foundation for a **Banking Customer Profitability Engine** with:
- **Customer** as the prime dimension
- **Branch**, **Business Segment**, and **Product** as secondary dimensions
- Profitability calculated at Customer, Branch, and Business Segment levels

## Task 1: Full XSD Parser
Build a Python parser that extracts everything from the XSD:

### 1.1 Entity Extraction
```python
# For each xs:complexType, extract:
- Logical name (from @name, strip leading underscores)
- Description (from xs:annotation/xs:documentation)
- Parent entity (from xs:extension @base — inheritance)
- All attributes: name, type (Classword), required/optional
- All child elements (relationships to other entities)
- Identify PK columns (use="required")
```

### 1.2 Relationship Mapping
```python
# For each xs:element within a complexType:
- Parent entity (the complexType containing the element)
- Child entity (the element's @ref or @type)
- Cardinality (from minOccurs/maxOccurs)
- Build full relationship graph
```

### 1.3 Inheritance Tree
```python
# Build complete supertype/subtype hierarchy:
- PARTY → INDIVIDUAL, ORGANIZATION, HOUSEHOLD
- AGREEMENT → FINANCIAL_AGREEMENT, INSURANCE_AGREEMENT, etc.
- EVENT → AGREEMENT_EVENT, PARTY_EVENT, etc.
- Track all 844 inheritance chains
```

### 1.4 Classword Type Mapping to Teradata DDL Types
```
Classword_Identifier  → INTEGER / BIGINT
Classword_Code        → VARCHAR(20)
Classword_Name        → VARCHAR(100)
Classword_Description → VARCHAR(500)
Classword_Text        → VARCHAR(2000) / CLOB
Classword_Amount      → DECIMAL(18,2)
Classword_Rate        → DECIMAL(10,6)
Classword_Percent     → DECIMAL(7,4)
Classword_Quantity    → DECIMAL(18,4)
Classword_Count       → INTEGER
Classword_Number      → VARCHAR(50)
Classword_Indicator   → CHAR(1)
Classword_Date        → DATE
Classword_Datetime    → TIMESTAMP
Classword_Time        → TIME
Classword_Measure     → DECIMAL(18,4)
Classword_Value       → DECIMAL(18,4)
Classword_Blob        → BLOB
Classword_Clob        → CLOB
Classword_Geospatial  → ST_GEOMETRY
Classword_Period_Date → PERIOD(DATE)
Classword_Period_Datetime → PERIOD(TIMESTAMP)
```

## Task 2: Generate Outputs

### 2.1 Data Dictionary
**`output/fsdm_data_dictionary.csv`**
Columns: Entity | Attribute | Classword_Type | Teradata_Type | PK | Required | Description | Parent_Entity (inheritance)

### 2.2 Teradata DDL
**`output/fsdm_ddl_teradata.sql`**
- CREATE TABLE statements with proper Teradata types
- PRIMARY INDEX on PK columns
- FOREIGN KEY constraints from relationships
- Comments from XSD documentation
- Group by domain area

### 2.3 Relationship Catalog
**`output/fsdm_relationships.csv`**
Columns: Parent_Entity | Child_Entity | Cardinality | FK_Columns | Relationship_Type (inheritance/association)

### 2.4 Entity Catalog
**`output/fsdm_entity_catalog.csv`**
Columns: Entity | Domain | Column_Count | Relationship_Count | Parent_Entity | Subtype_Count | Description

### 2.5 Inheritance Tree
**`output/fsdm_inheritance_tree.json`**
Full nested JSON tree of all supertype/subtype hierarchies

### 2.6 Domain Classification
**`output/fsdm_domain_map.json`**
Classify all 3,933 entities into FSDM domains:
- Party Management (Customer, Individual, Organization, Household)
- Agreement/Account (Deposits, Loans, Insurance, Investment)
- Product Management (Product catalog, features, pricing)
- Financial Transaction (Monetary transactions, GL entries)
- Risk Management (Basel II/III, credit risk, market risk)
- Channel Management (ATM, Branch, Online, Call Center)
- Campaign/Marketing (Campaigns, offers, interactions)
- Asset Management (Fixed assets, investments)
- Claims Management (Insurance claims, health claims)
- Human Resources (Associates, payroll, benefits)
- Web Analytics (Visits, page views, sessions)
- Reference Data (Currency, Geography, Time, UoM)

## Task 3: Profitability Engine Entity Mapping

### 3.1 Identify Profitability-Critical Entities
Map the FSDM entities needed for a Customer Profitability Engine:

**Revenue Entities:**
- AGREEMENT + subtypes (loans, deposits, cards, insurance)
- AGREEMENT_SUMMARY (period-end balances)
- MONETARY_TRANSACTION (fee income, interest)
- PRODUCT pricing entities

**Cost Entities:**
- AGREEMENT_RISK_METRIC (provision costs, risk-weighted assets)
- GL entities (cost allocation)
- CHANNEL usage (servicing costs)

**Dimension Entities:**
- PARTY → INDIVIDUAL / ORGANIZATION (Customer dimension)
- PRODUCT hierarchy (Product dimension)
- ORGANIZATION → internal org units (Branch/Business Segment dimension)
- TIME_PERIOD_TYPE (Time dimension)
- GEOGRAPHICAL_AREA (Geography dimension)

### 3.2 Generate Profitability Star Schema
**`output/profitability_star_schema.sql`**

Design a star/snowflake schema for profitability analysis:

```
FACT_CUSTOMER_PROFITABILITY
├── DIM_CUSTOMER (from PARTY/INDIVIDUAL/ORGANIZATION)
├── DIM_PRODUCT (from PRODUCT hierarchy)
├── DIM_BRANCH (from internal ORGANIZATION)
├── DIM_BUSINESS_SEGMENT (from ORGANIZATION_BUSINESS_TYPE)
├── DIM_CHANNEL (from CHANNEL_TYPE/CHANNEL_INSTANCE)
├── DIM_TIME (from TIME_PERIOD_TYPE)
└── DIM_GEOGRAPHY (from GEOGRAPHICAL_AREA)

Measures:
- Interest_Income_Amt
- Fee_Income_Amt
- Total_Revenue_Amt
- Fund_Transfer_Pricing_Amt (FTP)
- Direct_Cost_Amt
- Indirect_Cost_Amt (allocated)
- Provision_Cost_Amt
- Risk_Weighted_Asset_Amt
- Net_Profit_Amt
- Return_On_Equity_Pct
- Cost_To_Income_Ratio_Pct
```

### 3.3 Profitability Calculation Framework
**`output/profitability_calc_framework.md`**

Document the calculation methodology:
1. **Net Interest Income** = Interest Earned - Interest Paid (using FTP)
2. **Non-Interest Income** = Fees + Commissions + FX gains
3. **Total Revenue** = NII + Non-Interest Income
4. **Direct Costs** = Transaction costs + Servicing costs
5. **Allocated Costs** = Overhead allocation (by branch, segment)
6. **Provision Expense** = Expected credit losses
7. **Net Profit** = Revenue - Costs - Provisions
8. **RAROC** = Net Profit / Economic Capital

### 3.4 FSDM-to-Profitability Mapping
**`output/fsdm_profitability_mapping.csv`**

Map each profitability measure to its source FSDM entities:
| Profitability_Measure | FSDM_Entity | FSDM_Attribute | Calculation | Notes |
|---|---|---|---|---|

## Task 4: Visualization

### 4.1 Interactive ERD
**`output/fsdm_erd_interactive.html`**
- D3.js or vis.js network graph
- Color-coded by domain
- Click to expand entity details
- Filter by domain area
- Highlight profitability-critical entities in gold

### 4.2 Mermaid ERDs by Domain
**`output/mermaid/`** folder with one `.mermaid` file per domain

### 4.3 Profitability Model ERD
**`output/profitability_erd.html`**
- Visual star schema diagram
- Fact table in center, dimensions around it
- Show FSDM source entity mapping

## Technical Requirements
- Python 3.x with `lxml` (iterparse for memory efficiency)
- Use `/mnt/e/erwin/tds.xsd` as input
- Output all files to `/mnt/e/erwin/fsdm_output/`
- Add progress bars (3,933 entities to process)
- Handle XML namespaces properly
- Memory-efficient: use iterparse, don't load full DOM

## Execution Order
1. First examine XSD structure (read first 200 lines to confirm schema)
2. Build parser for entities, attributes, relationships
3. Generate data dictionary and catalogs (CSVs)
4. Generate Teradata DDL
5. Classify entities into domains
6. Map profitability entities
7. Generate star schema DDL
8. Create visualizations
9. Generate summary report

## Output Structure
```
/mnt/e/erwin/fsdm_output/
├── fsdm_data_dictionary.csv
├── fsdm_ddl_teradata.sql
├── fsdm_relationships.csv
├── fsdm_entity_catalog.csv
├── fsdm_inheritance_tree.json
├── fsdm_domain_map.json
├── fsdm_profitability_mapping.csv
├── profitability_star_schema.sql
├── profitability_calc_framework.md
├── fsdm_erd_interactive.html
├── profitability_erd.html
├── fsdm_summary_report.md
├── fsdm_stats.json
└── mermaid/
    ├── party_domain.mermaid
    ├── agreement_domain.mermaid
    ├── product_domain.mermaid
    └── ... (one per domain)
```
