-- ================================================================
-- CUSTOMER PROFITABILITY ENGINE - Enhanced Star Schema
-- ================================================================
-- Source: Teradata FSDM v16.00.00 + Banking BVF v1.2
-- Target: Pakistani Bank (UBL-style) Customer Profitability
-- Generated: 2026-02-27 07:59
--
-- Dimensions: Customer, Product, Branch, Business Segment,
--             Channel, Time, Agreement, Geography
-- Facts: Customer Profitability (monthly grain)
-- ================================================================

-- ==============================================
-- FACT TABLE: Customer Profitability
-- BVF Capabilities: Profitability Modelling, Activity Based Costing,
--   Funds Transfer Pricing, Performance Management and KPIs
-- FSDM Sources: AGREEMENT_SUMMARY, MONETARY_TRANSACTION,
--   AGREEMENT_RISK_METRIC, GL_MAIN_ACCOUNT
-- ==============================================
CREATE MULTISET TABLE FACT_CUSTOMER_PROFITABILITY, FALLBACK, NO JOURNAL
(
    -- Dimension Keys
    Customer_Party_Id       BIGINT          NOT NULL,   -- FK -> DIM_CUSTOMER (FSDM: PARTY.Party_Id)
    Agreement_Id            BIGINT          NOT NULL,   -- FK -> DIM_AGREEMENT (FSDM: AGREEMENT.Agreement_Id)
    Product_Id              BIGINT          NOT NULL,   -- FK -> DIM_PRODUCT (FSDM: PRODUCT.Product_Id)
    Branch_Org_Id           BIGINT          NOT NULL,   -- FK -> DIM_BRANCH (FSDM: ORGANIZATION.Organization_Party_Id)
    Business_Segment_Cd     VARCHAR(50),                -- FK -> DIM_BUSINESS_SEGMENT
    Channel_Instance_Id     BIGINT,                     -- FK -> DIM_CHANNEL (FSDM: CHANNEL_INSTANCE)
    Time_Period_Key         DATE            NOT NULL,   -- FK -> DIM_TIME (FSDM: TIME_PERIOD_TYPE)
    Geography_Area_Id       BIGINT,                     -- FK -> DIM_GEOGRAPHY (FSDM: GEOGRAPHICAL_AREA)
    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR', -- FSDM: CURRENCY

    -- ── Revenue Measures ──────────────────────────────────────
    -- BVF: "Financial Transactions", "Account Fees, Commissions & Charges"
    -- FSDM: AGREEMENT_SUMMARY, MONETARY_TRANSACTION
    Interest_Income_Amt     DECIMAL(18,2),  -- Markup earned (Islamic: Profit earned)
    Interest_Expense_Amt    DECIMAL(18,2),  -- Markup paid (Islamic: Profit paid)
    Fee_Income_Amt          DECIMAL(18,2),  -- Account fees and charges
    Commission_Income_Amt   DECIMAL(18,2),  -- Commission income (LC, guarantees)
    FX_Income_Amt           DECIMAL(18,2),  -- Foreign exchange gain/loss
    Other_Income_Amt        DECIMAL(18,2),  -- Miscellaneous income
    Total_Revenue_Amt       DECIMAL(18,2),  -- = Sum of all income components

    -- ── Funds Transfer Pricing ────────────────────────────────
    -- BVF: "Funds Transfer Pricing", "Master & Reference Data - FTP rates"
    -- FSDM: INTEREST_RATE, INTEREST_RATE_INDEX, AGREEMENT_SUMMARY
    FTP_Rate_Pct            DECIMAL(10,6),  -- FTP rate applied (KIBOR-based)
    FTP_Credit_Amt          DECIMAL(18,2),  -- FTP credit (deposit side)
    FTP_Debit_Amt           DECIMAL(18,2),  -- FTP charge (lending side)
    Net_Interest_Income_Amt DECIMAL(18,2),  -- = Interest_Income - Interest_Expense - FTP net

    -- ── Cost Measures ─────────────────────────────────────────
    -- BVF: "Activity Based Costing" capability
    -- FSDM: GL_MAIN_ACCOUNT (allocated costs)
    Direct_Cost_Amt         DECIMAL(18,2),  -- Direct transaction costs
    Transaction_Cost_Amt    DECIMAL(18,2),  -- Per-transaction processing cost
    Servicing_Cost_Amt      DECIMAL(18,2),  -- Account servicing cost
    Channel_Cost_Amt        DECIMAL(18,2),  -- Channel delivery cost
    Allocated_Overhead_Amt  DECIMAL(18,2),  -- Overhead allocation (ABC method)
    Total_Cost_Amt          DECIMAL(18,2),  -- = Sum of all cost components

    -- ── Risk & Provisions ─────────────────────────────────────
    -- BVF: "Risk Exposures", "Provisions, Losses & Writeoffs"
    -- FSDM: AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY
    Provision_Expense_Amt   DECIMAL(18,2),  -- ECL provision (IFRS 9 Stage 1/2/3)
    Expected_Loss_Amt       DECIMAL(18,2),  -- PD x LGD x EAD
    Risk_Weighted_Asset_Amt DECIMAL(18,2),  -- Basel III RWA
    Economic_Capital_Amt    DECIMAL(18,2),  -- Internal capital model
    IFRS9_Stage_Cd          VARCHAR(10),    -- Stage 1/2/3 classification

    -- ── Profitability Results ─────────────────────────────────
    -- BVF: "Profitability Results", "Profitability Analytics and Optimisation"
    -- Calculated/derived measures
    Gross_Profit_Amt        DECIMAL(18,2),  -- = Revenue - Cost
    Net_Profit_Amt          DECIMAL(18,2),  -- = Gross Profit - Provisions
    Pre_Tax_Profit_Amt      DECIMAL(18,2),  -- Before withholding tax
    RAROC_Pct               DECIMAL(10,6),  -- = Net Profit / Economic Capital
    Cost_To_Income_Ratio    DECIMAL(10,6),  -- = Total Cost / Total Revenue
    ROE_Pct                 DECIMAL(10,6),  -- = Net Profit / Allocated Equity
    Net_Interest_Margin_Pct DECIMAL(10,6),  -- = NII / Avg Balance

    -- ── Balance Measures ──────────────────────────────────────
    -- BVF: "Account Balances"
    -- FSDM: AGREEMENT_SUMMARY, BALANCE_SUMMARY
    Average_Balance_Amt     DECIMAL(18,2),  -- Period average balance
    EOP_Balance_Amt         DECIMAL(18,2),  -- End-of-period balance
    Original_Amount_Amt     DECIMAL(18,2),  -- Original sanctioned/deposit amount

    -- ── Pakistan-Specific ─────────────────────────────────────
    WHT_Amount_Amt          DECIMAL(18,2),  -- Withholding tax on profit
    Zakat_Deduction_Amt     DECIMAL(18,2),  -- Zakat deduction (Islamic obligation)
    Is_Islamic_Ind          CHAR(1),        -- Y/N: Islamic banking product

    -- ── Metadata ──────────────────────────────────────────────
    Calculation_Method_Cd   VARCHAR(20),    -- ACTUAL / ALLOCATED / ESTIMATED
    Data_Source_Cd          VARCHAR(50),    -- Source system identifier
    ETL_Batch_Id            BIGINT,
    ETL_Load_Dttm           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
)
PRIMARY INDEX (Customer_Party_Id, Time_Period_Key)
PARTITION BY RANGE_N(Time_Period_Key BETWEEN DATE '2020-01-01' AND DATE '2030-12-31' EACH INTERVAL '1' MONTH);

-- ==============================================
-- DIM: Customer (BVF: "Single Customer View")
-- FSDM: PARTY -> INDIVIDUAL / ORGANIZATION
-- ==============================================
CREATE MULTISET TABLE DIM_CUSTOMER, FALLBACK, NO JOURNAL
(
    Customer_Party_Id       BIGINT          NOT NULL,
    Customer_Type_Cd        VARCHAR(20),    -- Individual / Organization / Household
    Customer_Name           VARCHAR(200),
    Customer_Name_Urdu      VARCHAR(200),   -- Urdu name for Pakistan

    -- Segmentation (BVF: "Customer Segments")
    Customer_Segment_Cd     VARCHAR(50),    -- Retail/Corporate/SME/Agriculture/Micro
    Customer_SubSegment_Cd  VARCHAR(50),    -- Sub-segment classification
    Risk_Segment_Cd         VARCHAR(50),    -- BVF: "Risk Segments, Cohorts & Groupings"
    Profitability_Tier_Cd   VARCHAR(20),    -- Platinum/Gold/Silver/Bronze/Dormant
    Value_Band_Cd           VARCHAR(20),    -- High/Medium/Low value

    -- Individual attributes (FSDM: INDIVIDUAL)
    Gender_Cd               VARCHAR(10),
    Date_Of_Birth           DATE,
    Age_Band_Cd             VARCHAR(20),
    Marital_Status_Cd       VARCHAR(20),
    Occupation_Cd           VARCHAR(50),
    Income_Band_Cd          VARCHAR(20),
    Education_Level_Cd      VARCHAR(50),
    CNIC_Number             VARCHAR(15),    -- Pakistan National ID

    -- Organization attributes (FSDM: ORGANIZATION)
    Industry_Cd             VARCHAR(50),
    Business_Size_Cd        VARCHAR(20),    -- Large/Medium/Small/Micro
    Annual_Turnover_Band_Cd VARCHAR(20),
    NTN_Number              VARCHAR(20),    -- National Tax Number (Pakistan)

    -- Relationship
    Relationship_Start_Dt   DATE,
    Relationship_Tenure_Months INTEGER,
    Total_Products_Count    INTEGER,        -- Cross-sell depth
    Primary_Branch_Org_Id   BIGINT,         -- Home branch

    -- KYC / Compliance (BVF: "KYC Data")
    KYC_Status_Cd           VARCHAR(20),    -- Complete / Pending / Expired
    KYC_Last_Review_Dt      DATE,
    AML_Risk_Rating_Cd      VARCHAR(20),    -- High / Medium / Low
    PEP_Indicator           CHAR(1),        -- Politically Exposed Person

    -- Geography (FSDM: GEOGRAPHICAL_AREA)
    City_Cd                 VARCHAR(50),
    District_Cd             VARCHAR(50),
    Province_Cd             VARCHAR(50),    -- Punjab/Sindh/KPK/Balochistan/GB/AJK/ICT
    Country_Cd              VARCHAR(10)     DEFAULT 'PK',

    -- SCD Type 2
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE,
    Is_Current_Ind          CHAR(1)         DEFAULT 'Y'
)
UNIQUE PRIMARY INDEX (Customer_Party_Id);

-- ==============================================
-- DIM: Product (BVF: "Master & Reference Data - product")
-- FSDM: PRODUCT hierarchy
-- ==============================================
CREATE MULTISET TABLE DIM_PRODUCT, FALLBACK, NO JOURNAL
(
    Product_Id              BIGINT          NOT NULL,
    Product_Name            VARCHAR(100),
    Product_Type_Cd         VARCHAR(50),    -- Deposit/Loan/Card/Insurance/Investment/Trade Finance
    Product_SubType_Cd      VARCHAR(50),    -- Current/Savings/Fixed/Running Finance/etc.
    Product_Category_Cd     VARCHAR(50),
    Product_Family_Cd       VARCHAR(50),
    Asset_Liability_Cd      VARCHAR(10),    -- Asset / Liability / Off-Balance-Sheet
    Is_Financial_Product    CHAR(1),

    -- Pakistani Product Types
    Is_Islamic_Product      CHAR(1),        -- Shariah-compliant product
    Islamic_Mode_Cd         VARCHAR(50),    -- Murabaha/Musharakah/Ijarah/Diminishing Musharakah
    SBP_Product_Code        VARCHAR(20),    -- State Bank classification code

    -- Pricing (BVF: "Product Revenue, Cost & Margin", "FTP Rates")
    FTP_Rate_Pct            DECIMAL(10,6),  -- Funds Transfer Price rate
    Benchmark_Rate_Cd       VARCHAR(20),    -- KIBOR-3M / KIBOR-6M / Fixed
    Spread_Bps              DECIMAL(10,2),  -- Spread over benchmark (basis points)
    Standard_Fee_Amt        DECIMAL(18,2),
    Standard_Cost_Amt       DECIMAL(18,2),  -- BVF: "Product Revenue, Cost & Margin"
    Standard_Revenue_Amt    DECIMAL(18,2),
    Product_NPV_Amt         DECIMAL(18,2),  -- BVF: "Product NPV's"

    Product_Start_Dt        DATE,
    Product_End_Dt          DATE
)
UNIQUE PRIMARY INDEX (Product_Id);

-- ==============================================
-- DIM: Branch (BVF: "Master & Reference Data - organisation hierarchy")
-- FSDM: ORGANIZATION -> INTERNAL_ORGANIZATION_UNIT
-- ==============================================
CREATE MULTISET TABLE DIM_BRANCH, FALLBACK, NO JOURNAL
(
    Branch_Org_Id           BIGINT          NOT NULL,
    Branch_Name             VARCHAR(100),
    Branch_Code             VARCHAR(20),
    Branch_Type_Cd          VARCHAR(50),    -- Full Branch / Sub-Branch / Islamic Branch / Booth / Digital
    SBP_Branch_Code         VARCHAR(20),    -- SBP-assigned branch code

    -- Hierarchy (BVF: "Master & Reference Data - organisation hierarchy")
    Region_Name             VARCHAR(100),   -- Regional office
    Zone_Name               VARCHAR(100),   -- Zone/Area office
    Area_Name               VARCHAR(100),
    Group_Name              VARCHAR(100),   -- Group head office

    -- Location
    City_Name               VARCHAR(100),
    District_Name           VARCHAR(100),
    Province_Cd             VARCHAR(50),    -- Punjab/Sindh/KPK/Balochistan/GB/AJK/ICT
    Country_Cd              VARCHAR(10)     DEFAULT 'PK',
    Latitude_Val            DECIMAL(10,6),
    Longitude_Val           DECIMAL(10,6),

    -- Operations
    Branch_Open_Dt          DATE,
    Branch_Manager_Party_Id BIGINT,
    Employee_Count          INTEGER,

    -- Costing (for ABC allocation)
    Cost_Center_Cd          VARCHAR(20),
    Overhead_Pool_Cd        VARCHAR(20),
    Monthly_Operating_Cost  DECIMAL(18,2),

    -- Classification
    Is_Islamic_Branch       CHAR(1),        -- Islamic banking branch
    Is_Digital_Branch       CHAR(1),        -- Branchless/digital
    Rural_Urban_Cd          VARCHAR(10)     -- Rural / Urban / Semi-Urban
)
UNIQUE PRIMARY INDEX (Branch_Org_Id);

-- ==============================================
-- DIM: Business Segment
-- FSDM: ORGANIZATION_BUSINESS_TYPE
-- ==============================================
CREATE MULTISET TABLE DIM_BUSINESS_SEGMENT, FALLBACK, NO JOURNAL
(
    Business_Segment_Cd     VARCHAR(50)     NOT NULL,
    Segment_Name            VARCHAR(100),
    Segment_Group_Cd        VARCHAR(50),

    -- Pakistani banking segments
    -- Retail Banking, Corporate Banking, Commercial Banking,
    -- SME Banking, Agriculture Finance, Islamic Banking,
    -- Microfinance, Treasury, Trade Finance
    Segment_Head_Party_Id   BIGINT,
    Capital_Allocation_Pct  DECIMAL(7,4),
    Target_ROE_Pct          DECIMAL(7,4),
    Target_CIR_Pct          DECIMAL(7,4),
    SBP_Sector_Code         VARCHAR(20)     -- SBP sector classification
)
UNIQUE PRIMARY INDEX (Business_Segment_Cd);

-- ==============================================
-- DIM: Channel (BVF: "Master & Reference Data - Channel")
-- FSDM: CHANNEL_TYPE / CHANNEL_INSTANCE
-- ==============================================
CREATE MULTISET TABLE DIM_CHANNEL, FALLBACK, NO JOURNAL
(
    Channel_Instance_Id     BIGINT          NOT NULL,
    Channel_Type_Cd         VARCHAR(50),
    Channel_Name            VARCHAR(100),
    -- Branch, ATM, Internet Banking, Mobile App, SMS Banking,
    -- Call Center, POS, Agent Banking (branchless),
    -- JazzCash/Easypaisa integration, RAAST (instant payment)
    Channel_Cost_Per_Txn    DECIMAL(18,2),
    Is_Digital_Channel      CHAR(1),
    Is_Branchless_Channel   CHAR(1),        -- Pakistan branchless banking
    Channel_Status_Cd       VARCHAR(20)
)
UNIQUE PRIMARY INDEX (Channel_Instance_Id);

-- ==============================================
-- DIM: Time Period
-- FSDM: TIME_PERIOD_TYPE
-- ==============================================
CREATE MULTISET TABLE DIM_TIME, FALLBACK, NO JOURNAL
(
    Time_Period_Key         DATE            NOT NULL,
    Calendar_Year           INTEGER,
    Calendar_Quarter        INTEGER,
    Calendar_Month          INTEGER,
    Calendar_Week           INTEGER,
    Calendar_Day            INTEGER,
    Day_Of_Week             INTEGER,
    Month_Name              VARCHAR(20),

    -- Pakistan fiscal year (July-June)
    Fiscal_Year             INTEGER,        -- e.g., FY2024 = Jul 2023 - Jun 2024
    Fiscal_Quarter          INTEGER,
    Fiscal_Month            INTEGER,        -- 1=July, 12=June

    -- Banking calendar
    Is_Business_Day         CHAR(1),
    Is_Friday               CHAR(1),        -- Pakistan weekly holiday
    Is_SBP_Reporting_Dt     CHAR(1),        -- State Bank of Pakistan reporting date
    Is_Month_End            CHAR(1),
    Is_Quarter_End          CHAR(1),
    Is_Year_End             CHAR(1),
    Is_Eid_Holiday          CHAR(1),        -- Eid-ul-Fitr / Eid-ul-Adha
    Is_National_Holiday     CHAR(1)
)
UNIQUE PRIMARY INDEX (Time_Period_Key);

-- ==============================================
-- DIM: Agreement/Account Detail
-- FSDM: AGREEMENT + subtypes
-- ==============================================
CREATE MULTISET TABLE DIM_AGREEMENT, FALLBACK, NO JOURNAL
(
    Agreement_Id            BIGINT          NOT NULL,
    Agreement_Type_Cd       VARCHAR(50),    -- Loan/Deposit/Card/Insurance/Investment
    Agreement_Subtype_Cd    VARCHAR(50),    -- Running Finance/Term Loan/Current Account/etc.
    Agreement_Name          VARCHAR(100),
    Host_System_Cd          VARCHAR(20),    -- Source core banking system
    Host_Agreement_Num      VARCHAR(50),    -- Core banking account number

    -- Status (BVF: "Account Status")
    Account_Status_Cd       VARCHAR(20),    -- Active/Dormant/Inactive/Closed
    Agreement_Open_Dt       DATE,
    Agreement_Close_Dt      DATE,
    Last_Activity_Dt        DATE,

    -- Terms (BVF: "Account Terms & Conditions", "Account Maturity Dates")
    Maturity_Dt             DATE,
    Next_Repricing_Dt       DATE,
    Interest_Rate_Pct       DECIMAL(10,6),
    Rate_Type_Cd            VARCHAR(20),    -- Fixed / Floating / Islamic Profit Rate
    Benchmark_Cd            VARCHAR(20),    -- KIBOR-3M/6M/1Y
    Tenure_Months           INTEGER,

    -- Classification
    Asset_Liability_Cd      VARCHAR(10),    -- Asset / Liability / Off-BS
    Product_Id              BIGINT,
    Customer_Party_Id       BIGINT,
    Branch_Org_Id           BIGINT,
    Business_Segment_Cd     VARCHAR(50),

    -- Risk (BVF: "Risk Exposures")
    Risk_Grade_Cd           VARCHAR(20),    -- SBP classification (1-9)
    SBP_Classification_Cd   VARCHAR(50),    -- Normal/OAEM/Substandard/Doubtful/Loss
    IFRS9_Stage_Cd          VARCHAR(10),

    -- Collateral (BVF: "Collateral Agreements")
    Collateral_Ind          CHAR(1),
    Collateral_Value_Amt    DECIMAL(18,2),
    Collateral_Type_Cd      VARCHAR(50),
    LTV_Ratio_Pct           DECIMAL(10,4),

    -- Islamic Banking
    Is_Islamic_Ind          CHAR(1),
    Islamic_Mode_Cd         VARCHAR(50)     -- Murabaha/Musharakah/Ijarah/Salam
)
UNIQUE PRIMARY INDEX (Agreement_Id);

-- ==============================================
-- DIM: Geography
-- FSDM: GEOGRAPHICAL_AREA
-- ==============================================
CREATE MULTISET TABLE DIM_GEOGRAPHY, FALLBACK, NO JOURNAL
(
    Geography_Area_Id       BIGINT          NOT NULL,
    Country_Cd              VARCHAR(10),
    Country_Name            VARCHAR(100),
    Province_Cd             VARCHAR(50),
    Province_Name           VARCHAR(100),
    Division_Name           VARCHAR(100),
    District_Name           VARCHAR(100),
    Tehsil_Name             VARCHAR(100),
    City_Name               VARCHAR(100),
    Area_Type_Cd            VARCHAR(20),    -- Metro / Urban / Semi-Urban / Rural
    SBP_Region_Cd           VARCHAR(20)     -- SBP geographic classification
)
UNIQUE PRIMARY INDEX (Geography_Area_Id);

-- ==============================================
-- AGGREGATE TABLE: Branch Profitability
-- Monthly branch-level rollup
-- ==============================================
CREATE MULTISET TABLE AGG_BRANCH_PROFITABILITY, FALLBACK, NO JOURNAL
(
    Branch_Org_Id           BIGINT          NOT NULL,
    Business_Segment_Cd     VARCHAR(50),
    Time_Period_Key         DATE            NOT NULL,

    -- Aggregated measures
    Customer_Count          INTEGER,
    Agreement_Count         INTEGER,
    Total_Revenue_Amt       DECIMAL(18,2),
    Total_NII_Amt           DECIMAL(18,2),
    Total_Fee_Income_Amt    DECIMAL(18,2),
    Total_Cost_Amt          DECIMAL(18,2),
    Total_Provision_Amt     DECIMAL(18,2),
    Net_Profit_Amt          DECIMAL(18,2),
    Total_Balance_Amt       DECIMAL(18,2),
    Total_RWA_Amt           DECIMAL(18,2),
    Avg_RAROC_Pct           DECIMAL(10,6),
    Cost_To_Income_Pct      DECIMAL(10,6)
)
PRIMARY INDEX (Branch_Org_Id, Time_Period_Key);

-- ==============================================
-- AGGREGATE TABLE: Segment Profitability
-- Monthly segment-level rollup
-- ==============================================
CREATE MULTISET TABLE AGG_SEGMENT_PROFITABILITY, FALLBACK, NO JOURNAL
(
    Business_Segment_Cd     VARCHAR(50)     NOT NULL,
    Product_Type_Cd         VARCHAR(50),
    Time_Period_Key         DATE            NOT NULL,

    Customer_Count          INTEGER,
    Agreement_Count         INTEGER,
    Total_Revenue_Amt       DECIMAL(18,2),
    Total_NII_Amt           DECIMAL(18,2),
    Total_Fee_Income_Amt    DECIMAL(18,2),
    Total_Cost_Amt          DECIMAL(18,2),
    Total_Provision_Amt     DECIMAL(18,2),
    Net_Profit_Amt          DECIMAL(18,2),
    Total_Balance_Amt       DECIMAL(18,2),
    Total_RWA_Amt           DECIMAL(18,2),
    Avg_RAROC_Pct           DECIMAL(10,6),
    ROE_Pct                 DECIMAL(10,6)
)
PRIMARY INDEX (Business_Segment_Cd, Time_Period_Key);

-- ==============================================
-- VIEWS: Profitability Calculation
-- ==============================================

-- Customer Profitability Summary View
REPLACE VIEW VW_CUSTOMER_PROFITABILITY_SUMMARY AS
SELECT
    c.Customer_Party_Id,
    c.Customer_Name,
    c.Customer_Segment_Cd,
    c.Profitability_Tier_Cd,
    f.Time_Period_Key,
    SUM(f.Total_Revenue_Amt)        AS Total_Revenue,
    SUM(f.Net_Interest_Income_Amt)  AS Total_NII,
    SUM(f.Fee_Income_Amt + f.Commission_Income_Amt) AS Total_Non_Interest_Income,
    SUM(f.Total_Cost_Amt)           AS Total_Cost,
    SUM(f.Provision_Expense_Amt)    AS Total_Provisions,
    SUM(f.Net_Profit_Amt)           AS Net_Profit,
    CASE WHEN SUM(f.Economic_Capital_Amt) > 0
         THEN SUM(f.Net_Profit_Amt) / SUM(f.Economic_Capital_Amt)
         ELSE 0 END                 AS RAROC,
    CASE WHEN SUM(f.Total_Revenue_Amt) > 0
         THEN SUM(f.Total_Cost_Amt) / SUM(f.Total_Revenue_Amt)
         ELSE 0 END                 AS Cost_To_Income_Ratio
FROM FACT_CUSTOMER_PROFITABILITY f
JOIN DIM_CUSTOMER c ON f.Customer_Party_Id = c.Customer_Party_Id
                    AND c.Is_Current_Ind = 'Y'
GROUP BY 1, 2, 3, 4, 5;

-- Product Profitability View
REPLACE VIEW VW_PRODUCT_PROFITABILITY AS
SELECT
    p.Product_Id,
    p.Product_Name,
    p.Product_Type_Cd,
    p.Asset_Liability_Cd,
    p.Is_Islamic_Product,
    f.Time_Period_Key,
    COUNT(DISTINCT f.Customer_Party_Id) AS Customer_Count,
    COUNT(DISTINCT f.Agreement_Id)      AS Account_Count,
    SUM(f.Average_Balance_Amt)          AS Total_Balance,
    SUM(f.Total_Revenue_Amt)            AS Total_Revenue,
    SUM(f.Net_Interest_Income_Amt)      AS Total_NII,
    SUM(f.Total_Cost_Amt)               AS Total_Cost,
    SUM(f.Net_Profit_Amt)               AS Net_Profit,
    CASE WHEN SUM(f.Average_Balance_Amt) > 0
         THEN SUM(f.Net_Interest_Income_Amt) / SUM(f.Average_Balance_Amt) * 100
         ELSE 0 END                     AS NIM_Pct
FROM FACT_CUSTOMER_PROFITABILITY f
JOIN DIM_PRODUCT p ON f.Product_Id = p.Product_Id
GROUP BY 1, 2, 3, 4, 5, 6;

-- Islamic vs Conventional Comparison View
REPLACE VIEW VW_ISLAMIC_VS_CONVENTIONAL AS
SELECT
    f.Time_Period_Key,
    f.Is_Islamic_Ind,
    CASE f.Is_Islamic_Ind WHEN 'Y' THEN 'Islamic Banking'
                          ELSE 'Conventional Banking' END AS Banking_Type,
    COUNT(DISTINCT f.Customer_Party_Id)     AS Customer_Count,
    SUM(f.Average_Balance_Amt)              AS Total_Balance,
    SUM(f.Total_Revenue_Amt)                AS Total_Revenue,
    SUM(f.Net_Profit_Amt)                   AS Net_Profit,
    CASE WHEN SUM(f.Total_Revenue_Amt) > 0
         THEN SUM(f.Total_Cost_Amt) / SUM(f.Total_Revenue_Amt)
         ELSE 0 END                         AS Cost_To_Income_Ratio
FROM FACT_CUSTOMER_PROFITABILITY f
GROUP BY 1, 2, 3;
