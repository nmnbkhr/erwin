-- ========================================================================
-- Banking Customer Profitability Star Schema
-- Source: Teradata FSDM v16.00.00
-- Generated: 2026-02-27 07:35:06
-- ========================================================================

-- ────────────────────────────────────────────────────────────────────────
-- DIMENSION TABLES
-- ────────────────────────────────────────────────────────────────────────

-- DIM_CUSTOMER: Customer dimension from PARTY/INDIVIDUAL/ORGANIZATION
CREATE TABLE DIM_CUSTOMER (
    Customer_SK         BIGINT NOT NULL,     -- Surrogate key
    Customer_Id         BIGINT NOT NULL,     -- FSDM Party_Id
    Customer_Name       VARCHAR(200),
    Customer_Type_Cd    VARCHAR(50),         -- INDIVIDUAL/ORGANIZATION/HOUSEHOLD
    Customer_Segment_Cd VARCHAR(50),         -- From PARTY_CLASSIFICATION
    Customer_Status_Cd  VARCHAR(50),
    Customer_Start_Dt   DATE,
    Customer_End_Dt     DATE,
    Birth_Dt            DATE,                -- For INDIVIDUAL
    Gender_Cd           VARCHAR(10),
    Employer_Name       VARCHAR(200),
    Industry_Cd         VARCHAR(50),         -- For ORGANIZATION
    Annual_Revenue_Amt  DECIMAL(18,2),
    Relationship_Start_Dt DATE,
    Risk_Rating_Cd      VARCHAR(20),
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'  -- SCD Type 2
)
PRIMARY INDEX (Customer_SK);

-- DIM_PRODUCT: Product dimension from PRODUCT hierarchy
CREATE TABLE DIM_PRODUCT (
    Product_SK          BIGINT NOT NULL,
    Product_Id          BIGINT NOT NULL,     -- FSDM Product_Id
    Product_Name        VARCHAR(200),
    Product_Type_Cd     VARCHAR(50),         -- Deposit/Loan/Card/Insurance/Investment
    Product_Category_Cd VARCHAR(50),
    Product_Line_Cd     VARCHAR(50),
    Interest_Rate_Type  VARCHAR(20),         -- Fixed/Variable
    Currency_Cd         VARCHAR(10),
    Product_Start_Dt    DATE,
    Product_End_Dt      DATE,
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'
)
PRIMARY INDEX (Product_SK);

-- DIM_BRANCH: Branch dimension from internal ORGANIZATION
CREATE TABLE DIM_BRANCH (
    Branch_SK           BIGINT NOT NULL,
    Branch_Id           BIGINT NOT NULL,     -- FSDM Organization_Party_Id
    Branch_Name         VARCHAR(200),
    Branch_Type_Cd      VARCHAR(50),
    Region_Cd           VARCHAR(50),
    District_Cd         VARCHAR(50),
    City_Name           VARCHAR(100),
    Country_Cd          VARCHAR(10),
    Branch_Open_Dt      DATE,
    Branch_Close_Dt     DATE,
    Employee_Count      INTEGER,
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'
)
PRIMARY INDEX (Branch_SK);

-- DIM_BUSINESS_SEGMENT: Business segment from ORGANIZATION_BUSINESS_TYPE
CREATE TABLE DIM_BUSINESS_SEGMENT (
    Segment_SK          BIGINT NOT NULL,
    Segment_Cd          VARCHAR(50) NOT NULL,
    Segment_Name        VARCHAR(200),
    Segment_Desc        VARCHAR(500),
    Parent_Segment_Cd   VARCHAR(50),
    Segment_Level       INTEGER,
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Segment_SK);

-- DIM_CHANNEL: Channel dimension from CHANNEL_TYPE
CREATE TABLE DIM_CHANNEL (
    Channel_SK          BIGINT NOT NULL,
    Channel_Type_Cd     VARCHAR(50) NOT NULL,
    Channel_Name        VARCHAR(200),
    Channel_Category    VARCHAR(50),         -- Digital/Physical/Voice
    Channel_Cost_Rate   DECIMAL(10,4),       -- Cost per transaction
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Channel_SK);

-- DIM_TIME: Time dimension from TIME_PERIOD_TYPE
CREATE TABLE DIM_TIME (
    Time_SK             BIGINT NOT NULL,
    Calendar_Dt         DATE NOT NULL,
    Day_Of_Week         INTEGER,
    Week_Of_Year        INTEGER,
    Month_Num           INTEGER,
    Month_Name          VARCHAR(20),
    Quarter_Num         INTEGER,
    Quarter_Name        VARCHAR(10),
    Year_Num            INTEGER,
    Fiscal_Year         INTEGER,
    Fiscal_Quarter      INTEGER,
    Is_Business_Day     CHAR(1),
    Is_Month_End        CHAR(1),
    Is_Quarter_End      CHAR(1),
    Is_Year_End         CHAR(1)
)
PRIMARY INDEX (Time_SK);

-- DIM_GEOGRAPHY: Geography dimension from GEOGRAPHICAL_AREA
CREATE TABLE DIM_GEOGRAPHY (
    Geography_SK        BIGINT NOT NULL,
    Geography_Cd        VARCHAR(50) NOT NULL,
    Country_Cd          VARCHAR(10),
    Country_Name        VARCHAR(100),
    Region_Name         VARCHAR(100),
    Province_Name       VARCHAR(100),
    City_Name           VARCHAR(100),
    Postal_Cd           VARCHAR(20),
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Geography_SK);

-- ────────────────────────────────────────────────────────────────────────
-- FACT TABLES
-- ────────────────────────────────────────────────────────────────────────

-- FACT_CUSTOMER_PROFITABILITY: Monthly customer-level profitability
CREATE TABLE FACT_CUSTOMER_PROFITABILITY (
    Customer_SK             BIGINT NOT NULL,
    Product_SK              BIGINT NOT NULL,
    Branch_SK               BIGINT NOT NULL,
    Segment_SK              BIGINT NOT NULL,
    Channel_SK              BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,
    Geography_SK            BIGINT NOT NULL,
    Agreement_Id            BIGINT,           -- Source FSDM agreement

    -- Revenue Measures
    Interest_Income_Amt     DECIMAL(18,2),    -- Gross interest earned
    Interest_Expense_Amt    DECIMAL(18,2),    -- Interest paid to customer
    Net_Interest_Income_Amt DECIMAL(18,2),    -- NII = Earned - Paid
    FTP_Credit_Amt          DECIMAL(18,2),    -- Fund Transfer Pricing credit
    FTP_Charge_Amt          DECIMAL(18,2),    -- Fund Transfer Pricing charge
    Net_FTP_Amt             DECIMAL(18,2),    -- Net FTP (NII proxy)
    Fee_Income_Amt          DECIMAL(18,2),    -- Fee and service charges
    Commission_Income_Amt   DECIMAL(18,2),    -- Commissions earned
    FX_Gain_Loss_Amt        DECIMAL(18,2),    -- Foreign exchange gains/losses
    Other_Income_Amt        DECIMAL(18,2),    -- Other non-interest income
    Total_Revenue_Amt       DECIMAL(18,2),    -- Total revenue

    -- Cost Measures
    Direct_Cost_Amt         DECIMAL(18,2),    -- Direct transaction costs
    Channel_Cost_Amt        DECIMAL(18,2),    -- Channel servicing costs
    Operations_Cost_Amt     DECIMAL(18,2),    -- Operations/processing costs
    Indirect_Cost_Amt       DECIMAL(18,2),    -- Allocated overhead
    Total_Cost_Amt          DECIMAL(18,2),    -- Total costs

    -- Risk/Provision Measures
    Provision_Expense_Amt   DECIMAL(18,2),    -- Expected credit losses (ECL)
    Risk_Weighted_Asset_Amt DECIMAL(18,2),    -- Basel RWA
    Economic_Capital_Amt    DECIMAL(18,2),    -- Economic capital allocated
    Expected_Loss_Amt       DECIMAL(18,2),    -- PD * LGD * EAD

    -- Profitability Measures
    Net_Profit_Amt          DECIMAL(18,2),    -- Revenue - Costs - Provisions
    RAROC_Pct               DECIMAL(7,4),     -- Risk-Adjusted Return on Capital
    Return_On_Equity_Pct    DECIMAL(7,4),     -- Net Profit / Equity
    Cost_To_Income_Ratio_Pct DECIMAL(7,4),    -- Costs / Revenue
    Economic_Profit_Amt     DECIMAL(18,2),    -- Net Profit - Capital Charge

    -- Volume Measures
    Avg_Balance_Amt         DECIMAL(18,2),    -- Average period balance
    Transaction_Count       INTEGER,          -- Number of transactions
    Product_Count           INTEGER,          -- Products held

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Customer_SK, Time_SK);

-- FACT_AGREEMENT_PROFITABILITY: Agreement/account-level profitability
CREATE TABLE FACT_AGREEMENT_PROFITABILITY (
    Agreement_Id            BIGINT NOT NULL,
    Customer_SK             BIGINT NOT NULL,
    Product_SK              BIGINT NOT NULL,
    Branch_SK               BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,

    -- Balance Measures
    Outstanding_Balance_Amt DECIMAL(18,2),
    Avg_Daily_Balance_Amt   DECIMAL(18,2),
    Committed_Amount_Amt    DECIMAL(18,2),
    Utilized_Amount_Amt     DECIMAL(18,2),

    -- Revenue
    Interest_Income_Amt     DECIMAL(18,2),
    Fee_Income_Amt          DECIMAL(18,2),
    Total_Revenue_Amt       DECIMAL(18,2),
    Net_FTP_Amt             DECIMAL(18,2),

    -- Costs & Risk
    Direct_Cost_Amt         DECIMAL(18,2),
    Provision_Amt           DECIMAL(18,2),
    Risk_Weighted_Asset_Amt DECIMAL(18,2),

    -- Profitability
    Net_Profit_Amt          DECIMAL(18,2),
    RAROC_Pct               DECIMAL(7,4),

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Agreement_Id, Time_SK);

-- FACT_BRANCH_PROFITABILITY: Branch-level aggregated profitability
CREATE TABLE FACT_BRANCH_PROFITABILITY (
    Branch_SK               BIGINT NOT NULL,
    Segment_SK              BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,

    Customer_Count          INTEGER,
    Agreement_Count         INTEGER,
    Total_Balance_Amt       DECIMAL(18,2),
    Total_Revenue_Amt       DECIMAL(18,2),
    Total_Cost_Amt          DECIMAL(18,2),
    Net_Profit_Amt          DECIMAL(18,2),
    Cost_To_Income_Ratio_Pct DECIMAL(7,4),
    RAROC_Pct               DECIMAL(7,4),
    Revenue_Per_Customer_Amt DECIMAL(18,2),
    Profit_Per_Customer_Amt DECIMAL(18,2),

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Branch_SK, Time_SK);
