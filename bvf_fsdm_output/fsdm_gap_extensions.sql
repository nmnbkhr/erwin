-- ================================================================
-- FSDM v16.00.00 GAP EXTENSION TABLES
-- ================================================================
-- Purpose: Extend FSDM to cover 5 BVF capability gaps identified
--          in the BVF-FSDM integration analysis
-- Convention: All tables use FSDM naming patterns (UPPER_SNAKE_CASE),
--             classword data types, and FK patterns
-- Target: Teradata (Pakistani bank / UBL)
-- ================================================================
--
-- GAP 1: Activity Based Costing (ABC)
-- GAP 2: Customer Lifetime Value (CLV)
-- GAP 3: Budgets, Plans & Forecasts
-- GAP 4: Business Process Management (BPM)
-- GAP 5: Operational Metrics
--
-- These extension tables integrate with existing FSDM entities:
--   FSDM: GL_MAIN_ACCOUNT, COA_CODE_SEGMENT, FINANCIAL_PLAN,
--          CHANNEL_USAGE_TYPE, AGREEMENT, PARTY, PRODUCT,
--          ORGANIZATION, CHANNEL_INSTANCE, EVENT
-- ================================================================


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GAP 1: ACTIVITY BASED COSTING (ABC)                       ║
-- ║  BVF Capability: "Activity Based Costing"                  ║
-- ║  Extends: GL_MAIN_ACCOUNT, ORGANIZATION, AGREEMENT         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1.1 Cost Pool: logical grouping of costs for allocation
--     e.g. "Branch Operations", "IT Infrastructure", "Compliance"
CREATE MULTISET TABLE COST_POOL, FALLBACK, NO JOURNAL
(
    Cost_Pool_Id            BIGINT          NOT NULL,       -- PK, Classword_Identifier
    Cost_Pool_Name          VARCHAR(100),                   -- Classword_Name
    Cost_Pool_Description   VARCHAR(500),                   -- Classword_Description
    Cost_Pool_Type_Cd       VARCHAR(50),                    -- Direct / Indirect / Overhead
    Cost_Category_Cd        VARCHAR(50),                    -- Personnel / Technology / Premises / Other
    Parent_Cost_Pool_Id     BIGINT,                         -- FK self: hierarchy
    GL_Main_Account_Id      BIGINT,                         -- FK -> GL_MAIN_ACCOUNT
    Organization_Party_Id   BIGINT,                         -- FK -> ORGANIZATION (cost center owner)
    Effective_From_Dt       DATE,                           -- Classword_Date
    Effective_To_Dt         DATE,                           -- Classword_Date
    Is_Active_Ind           CHAR(1)         DEFAULT 'Y'     -- Classword_Indicator
)
UNIQUE PRIMARY INDEX (Cost_Pool_Id);

-- 1.2 Activity: unit of work that consumes resources
--     e.g. "Process Loan Application", "Handle Branch Transaction", "Run KYC Check"
CREATE MULTISET TABLE ACTIVITY, FALLBACK, NO JOURNAL
(
    Activity_Id             BIGINT          NOT NULL,       -- PK
    Activity_Name           VARCHAR(100),
    Activity_Description    VARCHAR(500),
    Activity_Type_Cd        VARCHAR(50),                    -- Transaction / Servicing / Overhead / Compliance
    Cost_Pool_Id            BIGINT,                         -- FK -> COST_POOL
    Channel_Type_Cd         VARCHAR(50),                    -- FK -> CHANNEL_TYPE (if channel-specific)
    Product_Type_Cd         VARCHAR(50),                    -- FK -> PRODUCT (if product-specific)
    Is_Customer_Facing_Ind  CHAR(1),                        -- Y/N: directly customer-facing
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE
)
UNIQUE PRIMARY INDEX (Activity_Id);

-- 1.3 Cost Driver: basis for allocating costs to activities/customers
--     e.g. "Transaction Count", "Account Count", "Branch Sq Footage", "FTE Hours"
CREATE MULTISET TABLE COST_DRIVER, FALLBACK, NO JOURNAL
(
    Cost_Driver_Id          BIGINT          NOT NULL,       -- PK
    Cost_Driver_Name        VARCHAR(100),
    Cost_Driver_Description VARCHAR(500),
    Cost_Driver_Type_Cd     VARCHAR(50),                    -- Volume / Duration / Headcount / Area / Revenue
    Unit_Of_Measure_Cd      VARCHAR(50),                    -- FK -> UNIT_OF_MEASURE
    Cost_Pool_Id            BIGINT,                         -- FK -> COST_POOL
    Activity_Id             BIGINT,                         -- FK -> ACTIVITY
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE
)
UNIQUE PRIMARY INDEX (Cost_Driver_Id);

-- 1.4 Cost Allocation Rule: how costs flow from pools to customers/products
CREATE MULTISET TABLE COST_ALLOCATION_RULE, FALLBACK, NO JOURNAL
(
    Allocation_Rule_Id      BIGINT          NOT NULL,       -- PK
    Allocation_Rule_Name    VARCHAR(100),
    Cost_Pool_Id            BIGINT          NOT NULL,       -- FK -> COST_POOL (source)
    Cost_Driver_Id          BIGINT          NOT NULL,       -- FK -> COST_DRIVER (basis)
    Target_Level_Cd         VARCHAR(50),                    -- CUSTOMER / PRODUCT / BRANCH / AGREEMENT
    Allocation_Method_Cd    VARCHAR(50),                    -- PROPORTIONAL / EQUAL / WEIGHTED / DIRECT
    Allocation_Weight_Pct   DECIMAL(7,4),                   -- Classword_Percent
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE
)
UNIQUE PRIMARY INDEX (Allocation_Rule_Id);

-- 1.5 Cost Allocation Result: actual allocated costs per period
--     This feeds into FACT_CUSTOMER_PROFITABILITY
CREATE MULTISET TABLE COST_ALLOCATION_RESULT, FALLBACK, NO JOURNAL
(
    Allocation_Result_Id    BIGINT          NOT NULL,       -- PK
    Allocation_Rule_Id      BIGINT          NOT NULL,       -- FK -> COST_ALLOCATION_RULE
    Cost_Pool_Id            BIGINT          NOT NULL,       -- FK -> COST_POOL
    Activity_Id             BIGINT,                         -- FK -> ACTIVITY
    Time_Period_Key         DATE            NOT NULL,       -- Period of allocation
    -- Target dimensions (one populated based on Target_Level_Cd)
    Customer_Party_Id       BIGINT,                         -- FK -> PARTY
    Product_Id              BIGINT,                         -- FK -> PRODUCT
    Branch_Org_Id           BIGINT,                         -- FK -> ORGANIZATION
    Agreement_Id            BIGINT,                         -- FK -> AGREEMENT
    -- Measures
    Cost_Driver_Quantity    DECIMAL(18,4),                  -- Driver volume consumed
    Total_Pool_Cost_Amt     DECIMAL(18,2),                  -- Total cost in pool for period
    Allocated_Cost_Amt      DECIMAL(18,2),                  -- Cost allocated to this target
    Unit_Cost_Rate_Amt      DECIMAL(18,6),                  -- Cost per driver unit
    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR'
)
PRIMARY INDEX (Customer_Party_Id, Time_Period_Key)
PARTITION BY RANGE_N(Time_Period_Key BETWEEN DATE '2020-01-01' AND DATE '2030-12-31' EACH INTERVAL '1' MONTH);

-- 1.6 Activity Rate: unit cost per activity (updated periodically)
CREATE MULTISET TABLE ACTIVITY_RATE, FALLBACK, NO JOURNAL
(
    Activity_Rate_Id        BIGINT          NOT NULL,       -- PK
    Activity_Id             BIGINT          NOT NULL,       -- FK -> ACTIVITY
    Channel_Instance_Id     BIGINT,                         -- FK -> CHANNEL_INSTANCE
    Unit_Cost_Amt           DECIMAL(18,4),                  -- Classword_Amount: cost per activity unit
    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR',
    Effective_From_Dt       DATE            NOT NULL,
    Effective_To_Dt         DATE,
    Source_Cd               VARCHAR(50)                     -- ACTUAL / STANDARD / BUDGETED
)
UNIQUE PRIMARY INDEX (Activity_Rate_Id);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GAP 2: CUSTOMER LIFETIME VALUE (CLV)                      ║
-- ║  BVF Capability: "Future / Lifetime Value"                 ║
-- ║  Extends: PARTY, AGREEMENT, ANALYTICAL_MODEL               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 2.1 CLV Model Definition
CREATE MULTISET TABLE CLV_MODEL, FALLBACK, NO JOURNAL
(
    CLV_Model_Id            BIGINT          NOT NULL,       -- PK
    CLV_Model_Name          VARCHAR(100),
    CLV_Model_Description   VARCHAR(500),
    Model_Type_Cd           VARCHAR(50),                    -- HISTORICAL / PREDICTIVE / HYBRID
    Analytical_Model_Id     BIGINT,                         -- FK -> ANALYTICAL_MODEL (FSDM)
    -- Model parameters
    Discount_Rate_Pct       DECIMAL(10,6),                  -- Classword_Rate
    Projection_Horizon_Months INTEGER,                      -- e.g. 60 (5 years)
    Attrition_Model_Id      BIGINT,                         -- FK -> ANALYTICAL_MODEL (churn model)
    Revenue_Growth_Rate_Pct DECIMAL(10,6),
    Cost_Inflation_Rate_Pct DECIMAL(10,6),
    -- Metadata
    Version_Num             VARCHAR(20),
    Approved_By_Party_Id    BIGINT,                         -- FK -> PARTY (model governance)
    Approved_Dt             DATE,
    Status_Cd               VARCHAR(20),                    -- DRAFT / APPROVED / RETIRED
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE
)
UNIQUE PRIMARY INDEX (CLV_Model_Id);

-- 2.2 Customer Lifetime Value Score: per-customer CLV results
CREATE MULTISET TABLE CUSTOMER_LIFETIME_VALUE, FALLBACK, NO JOURNAL
(
    Customer_LTV_Id         BIGINT          NOT NULL,       -- PK
    Customer_Party_Id       BIGINT          NOT NULL,       -- FK -> PARTY
    CLV_Model_Id            BIGINT          NOT NULL,       -- FK -> CLV_MODEL
    Calculation_Dt          DATE            NOT NULL,       -- When calculated

    -- Historical value (backward-looking)
    Historical_Revenue_Amt  DECIMAL(18,2),                  -- Total revenue earned to date
    Historical_Cost_Amt     DECIMAL(18,2),                  -- Total cost to serve to date
    Historical_Profit_Amt   DECIMAL(18,2),                  -- Revenue - Cost to date
    Tenure_Months           INTEGER,                        -- Months as customer

    -- Predicted future value (forward-looking)
    Predicted_Revenue_Amt   DECIMAL(18,2),                  -- Future revenue (discounted)
    Predicted_Cost_Amt      DECIMAL(18,2),                  -- Future cost (discounted)
    Predicted_Profit_Amt    DECIMAL(18,2),                  -- Future net profit (discounted)
    Retention_Probability_Pct DECIMAL(7,4),                 -- Probability of staying

    -- Composite CLV
    Total_CLV_Amt           DECIMAL(18,2),                  -- Historical + Predicted
    CLV_Percentile_Pct      DECIMAL(7,4),                   -- Rank vs population
    CLV_Tier_Cd             VARCHAR(20),                    -- Platinum / Gold / Silver / Bronze / Negative
    CLV_Trend_Cd            VARCHAR(20),                    -- GROWING / STABLE / DECLINING

    -- Decomposition by product
    Deposit_CLV_Amt         DECIMAL(18,2),
    Lending_CLV_Amt         DECIMAL(18,2),
    Fee_CLV_Amt             DECIMAL(18,2),
    FX_CLV_Amt              DECIMAL(18,2),

    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR'
)
PRIMARY INDEX (Customer_Party_Id)
PARTITION BY RANGE_N(Calculation_Dt BETWEEN DATE '2020-01-01' AND DATE '2030-12-31' EACH INTERVAL '1' MONTH);

-- 2.3 CLV Scenario: what-if analysis for CLV
CREATE MULTISET TABLE CLV_SCENARIO, FALLBACK, NO JOURNAL
(
    CLV_Scenario_Id         BIGINT          NOT NULL,       -- PK
    CLV_Model_Id            BIGINT          NOT NULL,       -- FK -> CLV_MODEL
    Scenario_Name           VARCHAR(100),
    Scenario_Type_Cd        VARCHAR(50),                    -- BASE / OPTIMISTIC / PESSIMISTIC / CROSS_SELL
    -- Overrides
    Discount_Rate_Override_Pct DECIMAL(10,6),
    Attrition_Rate_Override_Pct DECIMAL(10,6),
    Revenue_Growth_Override_Pct DECIMAL(10,6),
    Description             VARCHAR(500),
    Created_Dt              DATE
)
UNIQUE PRIMARY INDEX (CLV_Scenario_Id);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GAP 3: BUDGETS, PLANS & FORECASTS                         ║
-- ║  BVF Capability: "Financial Budgeting, Planning"           ║
-- ║  Extends: FINANCIAL_PLAN (already in FSDM), GL_MAIN_ACCOUNT║
-- ╚══════════════════════════════════════════════════════════════╝
-- Note: FSDM already has FINANCIAL_PLAN (8 cols, 6 rels) and
--       FINANCIAL_PLAN_BALANCE. We extend with budget-specific
--       entities and actual-vs-plan comparison support.

-- 3.1 Budget: annual/quarterly budget envelope
CREATE MULTISET TABLE BUDGET, FALLBACK, NO JOURNAL
(
    Budget_Id               BIGINT          NOT NULL,       -- PK
    Budget_Name             VARCHAR(100),
    Budget_Description      VARCHAR(500),
    Budget_Type_Cd          VARCHAR(50),                    -- ANNUAL / QUARTERLY / ROLLING / ZERO_BASED
    Financial_Plan_Id       BIGINT,                         -- FK -> FINANCIAL_PLAN (FSDM)
    Fiscal_Year             INTEGER,                        -- Pakistan FY (Jul-Jun)
    Fiscal_Quarter          INTEGER,                        -- NULL for annual budgets
    Organization_Party_Id   BIGINT,                         -- FK -> ORGANIZATION (budget owner)
    Business_Segment_Cd     VARCHAR(50),                    -- FK -> DIM_BUSINESS_SEGMENT
    Status_Cd               VARCHAR(20),                    -- DRAFT / SUBMITTED / APPROVED / LOCKED
    Approved_By_Party_Id    BIGINT,                         -- FK -> PARTY
    Approved_Dt             DATE,
    Version_Num             INTEGER         DEFAULT 1,
    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR'
)
UNIQUE PRIMARY INDEX (Budget_Id);

-- 3.2 Budget Line Item: individual budget entries
CREATE MULTISET TABLE BUDGET_LINE_ITEM, FALLBACK, NO JOURNAL
(
    Budget_Line_Id          BIGINT          NOT NULL,       -- PK
    Budget_Id               BIGINT          NOT NULL,       -- FK -> BUDGET
    GL_Main_Account_Id      BIGINT,                         -- FK -> GL_MAIN_ACCOUNT
    COA_Code_Id             BIGINT,                         -- FK -> CHART_OF_ACCOUNTS_CODE
    Cost_Pool_Id            BIGINT,                         -- FK -> COST_POOL (Gap 1 link)
    Time_Period_Key         DATE            NOT NULL,       -- Monthly granularity
    -- Amounts
    Budget_Amt              DECIMAL(18,2),                  -- Budgeted amount
    Revised_Budget_Amt      DECIMAL(18,2),                  -- After mid-year revision
    Forecast_Amt            DECIMAL(18,2),                  -- Latest forecast
    Actual_Amt              DECIMAL(18,2),                  -- Actual (populated post-period)
    -- Variance
    Budget_Variance_Amt     DECIMAL(18,2),                  -- Actual - Budget
    Budget_Variance_Pct     DECIMAL(7,4),                   -- (Actual - Budget) / Budget
    Forecast_Variance_Amt   DECIMAL(18,2),                  -- Actual - Forecast
    -- Classification
    Line_Type_Cd            VARCHAR(50),                    -- REVENUE / EXPENSE / CAPITAL / PROVISION
    Product_Type_Cd         VARCHAR(50),                    -- FK -> PRODUCT.Product_Type_Cd
    Currency_Cd             VARCHAR(3)      DEFAULT 'PKR'
)
PRIMARY INDEX (Budget_Id, Time_Period_Key)
PARTITION BY RANGE_N(Time_Period_Key BETWEEN DATE '2020-01-01' AND DATE '2030-12-31' EACH INTERVAL '1' MONTH);

-- 3.3 Forecast Version: rolling forecast snapshots
CREATE MULTISET TABLE FORECAST_VERSION, FALLBACK, NO JOURNAL
(
    Forecast_Version_Id     BIGINT          NOT NULL,       -- PK
    Budget_Id               BIGINT          NOT NULL,       -- FK -> BUDGET (parent budget)
    Forecast_Name           VARCHAR(100),
    Forecast_As_Of_Dt       DATE            NOT NULL,       -- When forecast was created
    Forecast_Type_Cd        VARCHAR(50),                    -- MONTHLY_ROLLING / QUARTERLY / ANNUAL
    Months_Actual           INTEGER,                        -- Months of actual data included
    Months_Forecast         INTEGER,                        -- Months of projected data
    Status_Cd               VARCHAR(20),
    Created_By_Party_Id     BIGINT
)
UNIQUE PRIMARY INDEX (Forecast_Version_Id);

-- 3.4 KPI Target: performance targets linked to budgets
CREATE MULTISET TABLE KPI_TARGET, FALLBACK, NO JOURNAL
(
    KPI_Target_Id           BIGINT          NOT NULL,       -- PK
    KPI_Name                VARCHAR(100),                   -- e.g. "RAROC", "CIR", "NIM", "NPL Ratio"
    KPI_Description         VARCHAR(500),
    KPI_Category_Cd         VARCHAR(50),                    -- PROFITABILITY / EFFICIENCY / RISK / GROWTH
    Budget_Id               BIGINT,                         -- FK -> BUDGET
    Organization_Party_Id   BIGINT,                         -- FK -> ORGANIZATION
    Business_Segment_Cd     VARCHAR(50),
    Time_Period_Key         DATE            NOT NULL,
    -- Values
    Target_Value            DECIMAL(18,6),                  -- Target KPI value
    Stretch_Target_Value    DECIMAL(18,6),                  -- Aspirational target
    Actual_Value            DECIMAL(18,6),                  -- Actual (populated post-period)
    Prior_Year_Value        DECIMAL(18,6),                  -- YoY comparison
    -- RAG status
    RAG_Status_Cd           VARCHAR(10),                    -- RED / AMBER / GREEN
    Unit_Cd                 VARCHAR(20)                     -- PCT / AMT / RATIO / COUNT
)
PRIMARY INDEX (KPI_Target_Id);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GAP 4: BUSINESS PROCESS MANAGEMENT (BPM)                  ║
-- ║  BVF Capability: "Business Process Analytics"              ║
-- ║  Extends: EVENT                                            ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 4.1 Business Process Definition
CREATE MULTISET TABLE BUSINESS_PROCESS, FALLBACK, NO JOURNAL
(
    Business_Process_Id     BIGINT          NOT NULL,       -- PK
    Process_Name            VARCHAR(100),
    Process_Description     VARCHAR(500),
    Process_Category_Cd     VARCHAR(50),                    -- ORIGINATION / SERVICING / COLLECTIONS / COMPLIANCE / OPERATIONS
    Parent_Process_Id       BIGINT,                         -- FK self: subprocess hierarchy
    Process_Owner_Party_Id  BIGINT,                         -- FK -> PARTY (process owner)
    Organization_Party_Id   BIGINT,                         -- FK -> ORGANIZATION
    SLA_Target_Duration_Minutes INTEGER,                    -- Target end-to-end time
    Expected_Cost_Amt       DECIMAL(18,2),                  -- Standard cost per execution
    Is_Automated_Ind        CHAR(1),                        -- Y/N: fully automated
    Status_Cd               VARCHAR(20),                    -- ACTIVE / DRAFT / RETIRED
    Version_Num             INTEGER         DEFAULT 1,
    Effective_From_Dt       DATE,
    Effective_To_Dt         DATE
)
UNIQUE PRIMARY INDEX (Business_Process_Id);

-- 4.2 Process Step: individual steps within a process
CREATE MULTISET TABLE PROCESS_STEP, FALLBACK, NO JOURNAL
(
    Process_Step_Id         BIGINT          NOT NULL,       -- PK
    Business_Process_Id     BIGINT          NOT NULL,       -- FK -> BUSINESS_PROCESS
    Step_Name               VARCHAR(100),
    Step_Description        VARCHAR(500),
    Step_Sequence_Num       INTEGER,                        -- Order within process
    Step_Type_Cd            VARCHAR(50),                    -- MANUAL / AUTOMATED / DECISION / WAIT / APPROVAL
    Responsible_Role_Cd     VARCHAR(50),                    -- Role that executes step
    Expected_Duration_Minutes INTEGER,                      -- SLA for this step
    Is_Optional_Ind         CHAR(1),
    Next_Step_Id_Success    BIGINT,                         -- FK self: success path
    Next_Step_Id_Failure    BIGINT                          -- FK self: failure/exception path
)
UNIQUE PRIMARY INDEX (Process_Step_Id);

-- 4.3 Process Instance: actual execution of a process
CREATE MULTISET TABLE PROCESS_INSTANCE, FALLBACK, NO JOURNAL
(
    Process_Instance_Id     BIGINT          NOT NULL,       -- PK
    Business_Process_Id     BIGINT          NOT NULL,       -- FK -> BUSINESS_PROCESS
    Event_Id                BIGINT,                         -- FK -> EVENT (FSDM link)
    -- Context
    Customer_Party_Id       BIGINT,                         -- FK -> PARTY
    Agreement_Id            BIGINT,                         -- FK -> AGREEMENT
    Application_Id          BIGINT,                         -- FK -> APPLICATION
    Branch_Org_Id           BIGINT,                         -- FK -> ORGANIZATION
    -- Timing
    Start_Dttm              TIMESTAMP,
    End_Dttm                TIMESTAMP,
    Duration_Minutes        INTEGER,                        -- Actual duration
    -- Outcome
    Status_Cd               VARCHAR(20),                    -- IN_PROGRESS / COMPLETED / FAILED / CANCELLED
    Outcome_Cd              VARCHAR(50),                    -- APPROVED / DECLINED / REFERRED / TIMEOUT
    SLA_Met_Ind             CHAR(1),                        -- Y/N: completed within SLA
    -- Cost
    Actual_Cost_Amt         DECIMAL(18,2),
    Steps_Completed_Count   INTEGER,
    Rework_Count            INTEGER                         -- Number of rework loops
)
PRIMARY INDEX (Process_Instance_Id)
PARTITION BY RANGE_N(Start_Dttm BETWEEN TIMESTAMP '2020-01-01 00:00:00' AND TIMESTAMP '2030-12-31 23:59:59' EACH INTERVAL '1' MONTH);

-- 4.4 Process Step Instance: actual execution of each step
CREATE MULTISET TABLE PROCESS_STEP_INSTANCE, FALLBACK, NO JOURNAL
(
    Step_Instance_Id        BIGINT          NOT NULL,       -- PK
    Process_Instance_Id     BIGINT          NOT NULL,       -- FK -> PROCESS_INSTANCE
    Process_Step_Id         BIGINT          NOT NULL,       -- FK -> PROCESS_STEP
    Executed_By_Party_Id    BIGINT,                         -- FK -> PARTY (who did it)
    Channel_Instance_Id     BIGINT,                         -- FK -> CHANNEL_INSTANCE
    Start_Dttm              TIMESTAMP,
    End_Dttm                TIMESTAMP,
    Duration_Minutes        INTEGER,
    Queue_Wait_Minutes      INTEGER,                        -- Time waiting in queue
    Status_Cd               VARCHAR(20),                    -- COMPLETED / SKIPPED / FAILED / IN_PROGRESS
    Is_Rework_Ind           CHAR(1),                        -- Y = this is a rework attempt
    Notes_Txt               VARCHAR(2000)
)
PRIMARY INDEX (Process_Instance_Id, Step_Instance_Id);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GAP 5: OPERATIONAL METRICS                                ║
-- ║  BVF Capability: "Operational metrics"                     ║
-- ║  Extends: CHANNEL_INSTANCE, ORGANIZATION, EVENT            ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 5.1 Operational Metric Type: catalogue of operational KPIs
CREATE MULTISET TABLE OPERATIONAL_METRIC_TYPE, FALLBACK, NO JOURNAL
(
    Metric_Type_Id          BIGINT          NOT NULL,       -- PK
    Metric_Name             VARCHAR(100),
    Metric_Description      VARCHAR(500),
    Metric_Category_Cd      VARCHAR(50),                    -- SERVICE_LEVEL / THROUGHPUT / QUALITY / COST / UTILIZATION
    Unit_Of_Measure_Cd      VARCHAR(50),                    -- FK -> UNIT_OF_MEASURE
    Aggregation_Method_Cd   VARCHAR(20),                    -- AVG / SUM / MAX / MIN / COUNT / P95
    Target_Direction_Cd     VARCHAR(10),                    -- HIGHER_BETTER / LOWER_BETTER
    SLA_Threshold_Value     DECIMAL(18,4),                  -- SLA target value
    Warning_Threshold_Value DECIMAL(18,4),                  -- Amber threshold
    Is_SBP_Reportable_Ind   CHAR(1)                         -- Y = included in SBP reporting
)
UNIQUE PRIMARY INDEX (Metric_Type_Id);

-- 5.2 Operational Metric Value: time-series of operational measurements
CREATE MULTISET TABLE OPERATIONAL_METRIC_VALUE, FALLBACK, NO JOURNAL
(
    Metric_Value_Id         BIGINT          NOT NULL,       -- PK
    Metric_Type_Id          BIGINT          NOT NULL,       -- FK -> OPERATIONAL_METRIC_TYPE
    -- Dimensions
    Time_Period_Key         DATE            NOT NULL,
    Granularity_Cd          VARCHAR(20),                    -- HOURLY / DAILY / WEEKLY / MONTHLY
    Organization_Party_Id   BIGINT,                         -- FK -> ORGANIZATION (branch)
    Channel_Instance_Id     BIGINT,                         -- FK -> CHANNEL_INSTANCE
    Business_Process_Id     BIGINT,                         -- FK -> BUSINESS_PROCESS (Gap 4 link)
    -- Measures
    Metric_Value            DECIMAL(18,4),                  -- Actual measured value
    Target_Value            DECIMAL(18,4),                  -- Target for this period
    Prior_Period_Value      DECIMAL(18,4),                  -- Previous period value
    -- Derived
    SLA_Met_Ind             CHAR(1),                        -- Y/N: met SLA threshold
    RAG_Status_Cd           VARCHAR(10),                    -- RED / AMBER / GREEN
    Variance_Pct            DECIMAL(7,4)                    -- (Actual - Target) / Target
)
PRIMARY INDEX (Metric_Type_Id, Time_Period_Key)
PARTITION BY RANGE_N(Time_Period_Key BETWEEN DATE '2020-01-01' AND DATE '2030-12-31' EACH INTERVAL '1' MONTH);

-- 5.3 Channel Operational Metric: channel-specific performance metrics
--     (extends FSDM CHANNEL_USAGE_TYPE with actual values)
CREATE MULTISET TABLE CHANNEL_OPERATIONAL_METRIC, FALLBACK, NO JOURNAL
(
    Channel_Metric_Id       BIGINT          NOT NULL,       -- PK
    Channel_Instance_Id     BIGINT          NOT NULL,       -- FK -> CHANNEL_INSTANCE
    Time_Period_Key         DATE            NOT NULL,
    -- Queue / Wait metrics
    Avg_Wait_Time_Minutes   DECIMAL(10,2),
    Max_Wait_Time_Minutes   DECIMAL(10,2),
    P95_Wait_Time_Minutes   DECIMAL(10,2),
    Avg_Queue_Length_Count  DECIMAL(10,2),
    Max_Queue_Length_Count  INTEGER,
    -- Throughput
    Transaction_Count       INTEGER,
    Unique_Customer_Count   INTEGER,
    Avg_Handle_Time_Minutes DECIMAL(10,2),
    -- Availability
    Uptime_Pct              DECIMAL(7,4),                   -- % time channel was available
    Downtime_Minutes        INTEGER,
    -- Capacity
    Utilization_Pct         DECIMAL(7,4),                   -- % of capacity used
    Staff_Count             INTEGER,                        -- (for branches/call centers)
    -- Cost
    Cost_Per_Transaction_Amt DECIMAL(18,4),
    Total_Operating_Cost_Amt DECIMAL(18,2)
)
PRIMARY INDEX (Channel_Instance_Id, Time_Period_Key);

-- 5.4 Branch Operational Metric: branch-specific daily metrics
CREATE MULTISET TABLE BRANCH_OPERATIONAL_METRIC, FALLBACK, NO JOURNAL
(
    Branch_Metric_Id        BIGINT          NOT NULL,       -- PK
    Branch_Org_Id           BIGINT          NOT NULL,       -- FK -> ORGANIZATION
    Time_Period_Key         DATE            NOT NULL,
    -- Footfall
    Customer_Visit_Count    INTEGER,
    New_Account_Open_Count  INTEGER,
    Account_Close_Count     INTEGER,
    -- Transactions
    Cash_Transaction_Count  INTEGER,
    Non_Cash_Transaction_Count INTEGER,
    Total_Cash_Handled_Amt  DECIMAL(18,2),
    -- Service levels
    Avg_Service_Time_Minutes DECIMAL(10,2),
    Avg_Wait_Time_Minutes   DECIMAL(10,2),
    Customer_Complaint_Count INTEGER,
    -- Staff
    Staff_Present_Count     INTEGER,
    Staff_Absent_Count      INTEGER,
    Overtime_Hours           DECIMAL(10,2),
    -- Security (Pakistan-specific: cash-heavy operations)
    Cash_Vault_Balance_Amt  DECIMAL(18,2),
    Cash_In_Transit_Amt     DECIMAL(18,2)
)
PRIMARY INDEX (Branch_Org_Id, Time_Period_Key);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  INTEGRATION VIEWS: Link extensions to Star Schema          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- View: ABC costs feeding into profitability fact
REPLACE VIEW VW_ABC_COST_BY_CUSTOMER AS
SELECT
    r.Customer_Party_Id,
    r.Time_Period_Key,
    p.Cost_Pool_Type_Cd,
    a.Activity_Type_Cd,
    SUM(r.Allocated_Cost_Amt) AS Allocated_Cost
FROM COST_ALLOCATION_RESULT r
JOIN COST_POOL p ON r.Cost_Pool_Id = p.Cost_Pool_Id
LEFT JOIN ACTIVITY a ON r.Activity_Id = a.Activity_Id
WHERE r.Customer_Party_Id IS NOT NULL
GROUP BY 1, 2, 3, 4;

-- View: CLV summary for customer dimension enrichment
REPLACE VIEW VW_CUSTOMER_CLV_LATEST AS
SELECT
    v.Customer_Party_Id,
    v.Total_CLV_Amt,
    v.CLV_Tier_Cd,
    v.CLV_Trend_Cd,
    v.Retention_Probability_Pct,
    v.Predicted_Revenue_Amt,
    v.Deposit_CLV_Amt,
    v.Lending_CLV_Amt,
    v.Calculation_Dt
FROM CUSTOMER_LIFETIME_VALUE v
QUALIFY ROW_NUMBER() OVER (PARTITION BY v.Customer_Party_Id ORDER BY v.Calculation_Dt DESC) = 1;

-- View: Budget vs Actual variance analysis
REPLACE VIEW VW_BUDGET_VS_ACTUAL AS
SELECT
    b.Budget_Name,
    b.Fiscal_Year,
    b.Business_Segment_Cd,
    li.Time_Period_Key,
    li.Line_Type_Cd,
    SUM(li.Budget_Amt)              AS Total_Budget,
    SUM(li.Actual_Amt)              AS Total_Actual,
    SUM(li.Budget_Variance_Amt)     AS Total_Variance,
    CASE WHEN SUM(li.Budget_Amt) <> 0
         THEN SUM(li.Budget_Variance_Amt) / SUM(li.Budget_Amt) * 100
         ELSE 0 END                 AS Variance_Pct
FROM BUDGET_LINE_ITEM li
JOIN BUDGET b ON li.Budget_Id = b.Budget_Id
GROUP BY 1, 2, 3, 4, 5;

-- View: Process efficiency for cost attribution
REPLACE VIEW VW_PROCESS_EFFICIENCY AS
SELECT
    bp.Process_Name,
    bp.Process_Category_Cd,
    pi.Branch_Org_Id,
    TRUNC(pi.Start_Dttm, 'MON')    AS Month_Key,
    COUNT(*)                         AS Execution_Count,
    AVG(pi.Duration_Minutes)         AS Avg_Duration,
    SUM(CASE WHEN pi.SLA_Met_Ind = 'Y' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS SLA_Met_Pct,
    AVG(pi.Actual_Cost_Amt)          AS Avg_Cost,
    AVG(pi.Rework_Count)             AS Avg_Rework
FROM PROCESS_INSTANCE pi
JOIN BUSINESS_PROCESS bp ON pi.Business_Process_Id = bp.Business_Process_Id
WHERE pi.Status_Cd = 'COMPLETED'
GROUP BY 1, 2, 3, 4;

-- View: Operational dashboard metrics
REPLACE VIEW VW_OPERATIONAL_DASHBOARD AS
SELECT
    mt.Metric_Name,
    mt.Metric_Category_Cd,
    mv.Time_Period_Key,
    mv.Organization_Party_Id,
    mv.Metric_Value,
    mv.Target_Value,
    mv.RAG_Status_Cd,
    mv.Variance_Pct
FROM OPERATIONAL_METRIC_VALUE mv
JOIN OPERATIONAL_METRIC_TYPE mt ON mv.Metric_Type_Id = mt.Metric_Type_Id;
