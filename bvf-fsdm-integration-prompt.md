# Claude Code Prompt 3: Banking BVF-to-FSDM Integration & Profitability Engine

## Context
We have two key Teradata assets:

### Asset 1: FSDM v16.00.00 XSD Schema
- **Location:** `/mnt/e/erwin/tds.xsd`
- **Content:** 3,933 entities, 15,430 attributes, 5,656 relationships
- **Hub entities:** PARTY (289 rels), CURRENCY (205), AGREEMENT (90), PRODUCT (85)
- **22 Classword data types**

### Asset 2: Banking Business Value Framework (BVF) Data Mappings v1.2
- **Location:** `/mnt/e/erwin/Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm`
- **Content:** 6 sheets mapping banking capabilities to FSDM data requirements
- **3 Business Value Themes:** Marketing & CX, Risk Management & Regulation, Finance & Performance
- **12 Capability Groups** with **112 sub-capabilities**
- **115 Data Requirements** mapped to **22 FSDM Subject Areas**

### Purpose
Build a **Customer Profitability Engine** for a Pakistani bank (like UBL) using:
- **Customer** as the prime dimension
- **Branch**, **Business Segment**, **Product** as secondary dimensions
- FSDM as the canonical data model
- BVF as the business requirements framework

## Task 1: Parse Both Files

### 1.1 Parse XSD (from Prompt 2 output or re-parse)
Extract all entities, attributes, relationships, inheritance from `tds.xsd`

### 1.2 Parse BVF Excel
From `Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm`, extract:

**Sheet: "Banking BVF Capability to Data"**
- Row 3: FSDM Subject Areas (22 areas)
- Row 4: Data Requirements (115 requirements)  
- Rows 5+: Capability-to-Data mapping (1 = required)
- Columns A-C: Theme > Capability > Sub-Capability

**Sheet: "Banking BVF Data Reuse Analysis"**  
- Data reuse scores and override capability

**Sheet: "Banking BVF Data Reuse Matrix"**
- Cross-capability similarity matrix (reuse coefficients 0-1)

**Sheet: "Banking BVF Data to Capability"**
- Reverse mapping: Data Requirement → which capabilities need it

## Task 2: Build BVF-FSDM Linkage

### 2.1 Map Data Requirements to FSDM Entities
Create a mapping table that links each of the 115 BVF Data Requirements to specific FSDM entities:

```
BVF Data Requirement              | FSDM Subject Area | FSDM Entities
---------------------------------|-------------------|------------------------------------------
Single Customer View             | Party             | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD
KYC Data                         | Party             | PARTY_IDENTIFICATION, PARTY_CLASSIFICATION
Customer Demographics            | Party             | INDIVIDUAL, PARTY_DEMOGRAPHIC
Account Balances                 | Agreement         | AGREEMENT_SUMMARY, BALANCE_SUMMARY
Financial Transactions           | Event             | MONETARY_TRANSACTION, TRANSACTION_TYPE
Profitability Results            | Agreement         | AGREEMENT_SUMMARY (derived measures)
FTP Rates                        | Product           | PRODUCT_RATE, INTEREST_RATE
Product Revenue, Cost & Margin   | Product           | PRODUCT, PRODUCT_PRICING
Risk Exposures                   | Agreement         | AGREEMENT_RISK_METRIC, RISK_EXPOSURE
General Ledger                   | Finance           | GL_ACCOUNT, GL_MAIN_ACCOUNT, COA_*
Organisation Hierarchy           | Internal Org      | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT
```

**Output:** `output/bvf_to_fsdm_entity_mapping.csv`
Columns: Data_Requirement | FSDM_Subject_Area | FSDM_Entity | FSDM_Entity_Description | Mapping_Confidence | Notes

### 2.2 Capability Data Dependency Graph
For each of the 112 sub-capabilities, list the FSDM entities required:

**Output:** `output/capability_fsdm_dependencies.csv`
Columns: Theme | Capability | Sub_Capability | Data_Requirement | FSDM_Subject_Area | FSDM_Entities

### 2.3 FSDM Entity Reuse Heatmap
Calculate how many capabilities each FSDM entity supports:

**Output:** `output/fsdm_entity_reuse_scores.csv`
Columns: FSDM_Entity | Subject_Area | Capabilities_Supported | Reuse_Score | Priority_Tier

## Task 3: Profitability Engine Design

### 3.1 Profitability-Specific BVF Capabilities
These BVF sub-capabilities directly drive profitability:

**Finance & Performance Management:**
- Activity Based Costing
- Profitability Modelling
- Future / Lifetime Value
- Profitability Analytics and Optimisation
- Performance Management and KPIs
- Pricing Analysis & Optimisation
- Financial Budgeting, Planning & Forecasting
- Funds Transfer Pricing
- GL, AP, HR, Expense Analytics & Optimisation

**From the BVF, these data requirements are needed for profitability:**
- Product Revenue, Cost & Margin (33 caps)
- Profitability Results (38 caps)
- FTP Rates (37 caps)
- Product NPVs (31 caps)
- Financial Transactions (71 caps)
- Account Fees, Commissions & Charges (50 caps)
- Account Balances (77 caps)
- General Ledger (39 caps)
- Finance Systems - ERP (36 caps)
- Finance Systems - Budgets, Plans & Forecasts (23 caps)
- Organisation Hierarchy (76 caps)
- Customer Segments (95 caps)
- Customer Demographics (91 caps)
- Single Customer View (81 caps)

### 3.2 Profitability Star Schema (Enhanced with BVF)

**Output:** `output/profitability_star_schema_enhanced.sql`

```sql
-- ==============================================
-- FACT TABLE: Customer Profitability
-- Source: BVF "Profitability Modelling" capability
-- ==============================================
CREATE TABLE FACT_CUSTOMER_PROFITABILITY (
    -- Keys
    Customer_Party_Id       INTEGER NOT NULL,    -- FSDM: PARTY.Party_Id
    Agreement_Id            INTEGER NOT NULL,    -- FSDM: AGREEMENT.Agreement_Id
    Product_Id              INTEGER NOT NULL,    -- FSDM: PRODUCT.Product_Id
    Branch_Org_Id           INTEGER NOT NULL,    -- FSDM: ORGANIZATION.Organization_Party_Id
    Business_Segment_Cd     VARCHAR(20),         -- FSDM: ORGANIZATION_BUSINESS_TYPE
    Channel_Instance_Id     INTEGER,             -- FSDM: CHANNEL_INSTANCE
    Time_Period_Key         DATE NOT NULL,       -- FSDM: TIME_PERIOD_TYPE
    Geography_Area_Id       INTEGER,             -- FSDM: GEOGRAPHICAL_AREA
    
    -- Revenue Measures (BVF: "Financial Transactions", "Account Fees")
    Interest_Income_Amt     DECIMAL(18,2),
    Fee_Income_Amt          DECIMAL(18,2),
    Commission_Income_Amt   DECIMAL(18,2),
    FX_Income_Amt           DECIMAL(18,2),
    Other_Income_Amt        DECIMAL(18,2),
    Total_Revenue_Amt       DECIMAL(18,2),       -- Computed
    
    -- FTP (BVF: "FTP Rates", "Funds Transfer Pricing" capability)
    FTP_Credit_Amt          DECIMAL(18,2),
    FTP_Debit_Amt           DECIMAL(18,2),
    Net_Interest_Income_Amt DECIMAL(18,2),       -- Interest - FTP
    
    -- Cost Measures (BVF: "Activity Based Costing" capability)
    Direct_Cost_Amt         DECIMAL(18,2),
    Transaction_Cost_Amt    DECIMAL(18,2),
    Servicing_Cost_Amt      DECIMAL(18,2),
    Channel_Cost_Amt        DECIMAL(18,2),
    Allocated_Overhead_Amt  DECIMAL(18,2),
    Total_Cost_Amt          DECIMAL(18,2),       -- Computed
    
    -- Risk & Provisions (BVF: "Risk Exposures", "Provisions, Losses")
    Provision_Expense_Amt   DECIMAL(18,2),
    Expected_Loss_Amt       DECIMAL(18,2),
    Risk_Weighted_Asset_Amt DECIMAL(18,2),
    Economic_Capital_Amt    DECIMAL(18,2),
    
    -- Profitability Results (BVF: "Profitability Results")
    Gross_Profit_Amt        DECIMAL(18,2),       -- Revenue - Cost
    Net_Profit_Amt          DECIMAL(18,2),       -- Gross - Provisions
    RAROC_Pct               DECIMAL(10,6),       -- Net Profit / Economic Capital
    Cost_To_Income_Ratio    DECIMAL(10,6),       -- Cost / Revenue
    ROE_Pct                 DECIMAL(10,6),
    
    -- Balance Measures (BVF: "Account Balances")
    Average_Balance_Amt     DECIMAL(18,2),
    EOP_Balance_Amt         DECIMAL(18,2),
    
    -- Metadata
    Calculation_Method_Cd   VARCHAR(20),
    Data_Source_Cd          VARCHAR(20),
    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Customer_Party_Id, Time_Period_Key);

-- ==============================================
-- DIM: Customer (BVF: "Single Customer View")
-- Source FSDM: PARTY → INDIVIDUAL / ORGANIZATION
-- ==============================================
CREATE TABLE DIM_CUSTOMER (
    Customer_Party_Id       INTEGER NOT NULL,
    Customer_Type_Cd        VARCHAR(20),         -- Individual / Organization
    Customer_Name           VARCHAR(200),
    Customer_Segment_Cd     VARCHAR(20),         -- BVF: "Customer Segments"
    Customer_SubSegment_Cd  VARCHAR(20),
    Risk_Segment_Cd         VARCHAR(20),         -- BVF: "Risk Segments"
    Profitability_Tier_Cd   VARCHAR(20),
    Relationship_Start_Dt   DATE,
    KYC_Status_Cd           VARCHAR(20),         -- BVF: "KYC Data"
    -- Individual attributes
    Gender_Cd               VARCHAR(10),
    Age_Band_Cd             VARCHAR(20),
    Occupation_Cd           VARCHAR(50),
    Income_Band_Cd          VARCHAR(20),
    -- Organization attributes
    Industry_Cd             VARCHAR(50),
    Business_Size_Cd        VARCHAR(20),
    Annual_Turnover_Band_Cd VARCHAR(20),
    -- Geography
    Home_Branch_Org_Id      INTEGER,
    City_Cd                 VARCHAR(50),
    Province_Cd             VARCHAR(50),
    Country_Cd              VARCHAR(10)
)
PRIMARY INDEX (Customer_Party_Id);

-- ==============================================
-- DIM: Product (BVF: "Master & Reference Data - product")
-- Source FSDM: PRODUCT hierarchy
-- ==============================================
CREATE TABLE DIM_PRODUCT (
    Product_Id              INTEGER NOT NULL,
    Product_Name            VARCHAR(100),
    Product_Type_Cd         VARCHAR(50),         -- Deposit/Loan/Card/Insurance/Investment
    Product_SubType_Cd      VARCHAR(50),
    Product_Category_Cd     VARCHAR(50),
    Product_Family_Cd       VARCHAR(50),
    Asset_Liability_Cd      VARCHAR(10),         -- Asset / Liability
    Is_Financial_Product    CHAR(1),
    FTP_Rate_Pct            DECIMAL(10,6),       -- BVF: "FTP Rates"
    Standard_Cost_Amt       DECIMAL(18,2),       -- BVF: "Product Revenue, Cost & Margin"
    Standard_Revenue_Amt    DECIMAL(18,2),
    Product_NPV_Amt         DECIMAL(18,2),       -- BVF: "Product NPVs"
    Product_Start_Dt        DATE,
    Product_End_Dt          DATE
)
PRIMARY INDEX (Product_Id);

-- ==============================================
-- DIM: Branch (BVF: "Master & Reference Data - organisation hierarchy")
-- Source FSDM: ORGANIZATION → Internal Organization
-- ==============================================
CREATE TABLE DIM_BRANCH (
    Branch_Org_Id           INTEGER NOT NULL,
    Branch_Name             VARCHAR(100),
    Branch_Code             VARCHAR(20),
    Branch_Type_Cd          VARCHAR(50),
    Region_Name             VARCHAR(100),
    Zone_Name               VARCHAR(100),
    Area_Name               VARCHAR(100),
    City_Name               VARCHAR(100),
    Province_Cd             VARCHAR(50),
    Country_Cd              VARCHAR(10),
    Branch_Open_Dt          DATE,
    Branch_Manager_Party_Id INTEGER,
    -- Cost center info for allocation
    Cost_Center_Cd          VARCHAR(20),
    Overhead_Pool_Cd        VARCHAR(20)
)
PRIMARY INDEX (Branch_Org_Id);

-- ==============================================
-- DIM: Business Segment
-- Source FSDM: ORGANIZATION_BUSINESS_TYPE
-- ==============================================
CREATE TABLE DIM_BUSINESS_SEGMENT (
    Business_Segment_Cd     VARCHAR(20) NOT NULL,
    Segment_Name            VARCHAR(100),
    Segment_Group_Cd        VARCHAR(50),
    -- Pakistani banking segments
    -- Retail Banking, Corporate Banking, Commercial Banking,
    -- Treasury, Islamic Banking, Microfinance, Agriculture
    Segment_Head_Party_Id   INTEGER,
    Capital_Allocation_Pct  DECIMAL(7,4),
    Target_ROE_Pct          DECIMAL(7,4)
)
PRIMARY INDEX (Business_Segment_Cd);

-- ==============================================
-- DIM: Channel (BVF: "Master & Reference Data - Channel")
-- Source FSDM: CHANNEL_TYPE / CHANNEL_INSTANCE
-- ==============================================
CREATE TABLE DIM_CHANNEL (
    Channel_Instance_Id     INTEGER NOT NULL,
    Channel_Type_Cd         VARCHAR(50),
    Channel_Name            VARCHAR(100),
    -- Branch, ATM, Online Banking, Mobile App, 
    -- Call Center, POS, Agent Banking
    Channel_Cost_Per_Txn    DECIMAL(18,2),
    Is_Digital_Channel      CHAR(1)
)
PRIMARY INDEX (Channel_Instance_Id);

-- ==============================================
-- DIM: Time Period
-- Source FSDM: TIME_PERIOD_TYPE
-- ==============================================
CREATE TABLE DIM_TIME (
    Time_Period_Key         DATE NOT NULL,
    Calendar_Year           INTEGER,
    Calendar_Quarter        INTEGER,
    Calendar_Month          INTEGER,
    Calendar_Week           INTEGER,
    Day_Of_Week             INTEGER,
    Fiscal_Year             INTEGER,
    Fiscal_Quarter          INTEGER,
    Fiscal_Month            INTEGER,
    Is_Business_Day         CHAR(1),
    Is_SBP_Reporting_Dt     CHAR(1),  -- State Bank of Pakistan
    Is_Month_End            CHAR(1)
)
PRIMARY INDEX (Time_Period_Key);

-- ==============================================
-- DIM: Agreement/Account Detail
-- Source FSDM: AGREEMENT + subtypes
-- ==============================================
CREATE TABLE DIM_AGREEMENT (
    Agreement_Id            INTEGER NOT NULL,
    Agreement_Subtype_Cd    VARCHAR(50),
    Agreement_Name          VARCHAR(100),
    Host_Agreement_Num      VARCHAR(50),
    Account_Status_Cd       VARCHAR(20),          -- BVF: "Account Status"
    Agreement_Open_Dt       DATE,
    Agreement_Close_Dt      DATE,
    Maturity_Dt             DATE,                  -- BVF: "Account Maturity Dates"
    Next_Repricing_Dt       DATE,
    Interest_Rate_Pct       DECIMAL(10,6),
    Asset_Liability_Cd      VARCHAR(10),
    Product_Id              INTEGER,
    Customer_Party_Id       INTEGER,
    Branch_Org_Id           INTEGER,
    Business_Segment_Cd     VARCHAR(20),
    Collateral_Ind          CHAR(1),               -- BVF: "Collateral Agreements"
    Collateral_Value_Amt    DECIMAL(18,2)
)
PRIMARY INDEX (Agreement_Id);
```

### 3.3 BVF Capability Coverage Report

**Output:** `output/profitability_bvf_coverage.md`

For each profitability-related BVF capability, document:
1. Which data requirements are needed
2. Which FSDM entities supply that data
3. Which star schema tables/columns map to it
4. Gap analysis: what's missing from FSDM vs what's needed
5. UBL/Pakistan-specific considerations (SBP reporting, PKR, KIBOR)

### 3.4 Data Lineage Map

**Output:** `output/data_lineage.json`

```json
{
  "lineage": [
    {
      "target_column": "FACT_CUSTOMER_PROFITABILITY.Net_Interest_Income_Amt",
      "calculation": "Interest_Income_Amt - FTP_Debit_Amt + FTP_Credit_Amt",
      "source_fsdm_entities": ["AGREEMENT_SUMMARY", "MONETARY_TRANSACTION"],
      "bvf_data_requirements": ["Financial Transactions", "FTP Rates", "Account Balances"],
      "bvf_capabilities": ["Funds Transfer Pricing", "Profitability Modelling"]
    }
  ]
}
```

## Task 4: Pakistani Banking Context

### 4.1 Pakistan-Specific Enhancements
Add context for Pakistani banking:

- **Regulatory:** SBP (State Bank of Pakistan) reporting requirements
- **Currency:** PKR as base currency, multi-currency for forex
- **Rate benchmarks:** KIBOR instead of LIBOR for FTP
- **Segments:** Retail, Corporate, Commercial, SME, Agriculture, Islamic Banking, Microfinance
- **Channels:** Branch, ATM, Internet Banking, Mobile (JazzCash, Easypaisa integration), Branchless Banking agents
- **Tax:** Withholding tax on profit, Zakat deductions
- **Islamic Banking:** Profit-sharing instead of interest (Murabaha, Musharakah, Ijarah)

**Output:** `output/pakistan_banking_context.md`

### 4.2 UBL-Specific Mapping Notes
Document known UBL context:
- Core banking systems: CTL and others
- Previous Teradata platform: 680 SMP → TD 2850 → IntelliFlex
- Known FSDM version at UBL: v13.00.00 (vs this v16.00.00)
- Version gap analysis: what's new in v16 vs v13

## Task 5: Visualizations

### 5.1 BVF-to-FSDM Sankey Diagram
**Output:** `output/bvf_fsdm_sankey.html`
Interactive Sankey: BVF Themes → Capabilities → Data Requirements → FSDM Subject Areas

### 5.2 Profitability Data Flow
**Output:** `output/profitability_data_flow.html`  
Interactive diagram showing: Source Systems → FSDM Entities → Star Schema → Profitability Measures

### 5.3 Data Reuse Heatmap
**Output:** `output/data_reuse_heatmap.html`
Interactive heatmap of the BVF Data Reuse Matrix (112 x 112 capabilities)

### 5.4 Entity Relationship Diagram
**Output:** `output/profitability_erd.html`
Star schema ERD with FSDM source entity annotations

## Technical Requirements
- Python 3.x with: `lxml`, `openpyxl`, `json`, `csv`
- Input files:
  - `/mnt/e/erwin/tds.xsd`
  - `/mnt/e/erwin/Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm`
- Output: `/mnt/e/erwin/bvf_fsdm_output/`
- Memory-efficient parsing for the 152K-line XSD
- Progress indicators for long operations

## Output Structure
```
/mnt/e/erwin/bvf_fsdm_output/
├── bvf_to_fsdm_entity_mapping.csv
├── capability_fsdm_dependencies.csv
├── fsdm_entity_reuse_scores.csv
├── profitability_star_schema_enhanced.sql
├── profitability_bvf_coverage.md
├── data_lineage.json
├── pakistan_banking_context.md
├── bvf_capability_summary.csv
├── bvf_data_requirements.csv
├── bvf_reuse_matrix.csv
├── bvf_fsdm_sankey.html
├── profitability_data_flow.html
├── data_reuse_heatmap.html
├── profitability_erd.html
└── summary_report.md
```

## Execution Priority
1. Parse BVF Excel (all 6 sheets) → export clean CSVs
2. Parse XSD entities relevant to profitability
3. Build BVF-to-FSDM entity mapping
4. Generate enhanced star schema DDL
5. Create data lineage
6. Add Pakistan banking context
7. Generate visualizations
8. Summary report
