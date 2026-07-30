# Banking Customer Profitability Calculation Framework
**Source Model:** Teradata FSDM v16.00.00
**Generated:** 2026-02-27 07:35:06

## 1. Revenue Components

### 1.1 Net Interest Income (NII)
```
NII = Interest_Income - Interest_Expense
    = (Loan_Interest + Investment_Income) - (Deposit_Interest + Borrowing_Cost)
```
**FSDM Sources:**
- `AGREEMENT_SUMMARY.Interest_Income_Amt` - Interest earned on loans/investments
- `AGREEMENT_SUMMARY.Interest_Expense_Amt` - Interest paid on deposits/borrowings
- `AGREEMENT_FINANCIAL_RULE` - Interest rate terms per agreement

### 1.2 Fund Transfer Pricing (FTP)
```
Net_FTP = FTP_Credit - FTP_Charge
FTP_Credit = Deposit_Balance * FTP_Rate(maturity_matched)
FTP_Charge = Loan_Balance * FTP_Rate(maturity_matched)
```
**Purpose:** Allocates the net interest margin between deposit-gathering and lending activities.

### 1.3 Non-Interest Income
```
Non_Interest_Income = Fee_Income + Commission_Income + FX_Income + Other_Income
```
**FSDM Sources:**
- `MONETARY_TRANSACTION` (filtered by transaction type = fee/commission)
- `AGREEMENT_COST` (fee structures per agreement)
- `AGREEMENT_CURRENCY` (FX gains/losses)

### 1.4 Total Revenue
```
Total_Revenue = NII + Non_Interest_Income
              = Net_FTP + Fee_Income + Commission_Income + FX_Income + Other_Income
```

## 2. Cost Components

### 2.1 Direct Costs
```
Direct_Cost = Transaction_Processing_Cost + Servicing_Cost
```
**FSDM Sources:**
- `CHANNEL_USAGE_METRIC` - Cost per transaction by channel type
- `AGREEMENT_COST` - Direct costs allocated to agreements

### 2.2 Indirect Costs (Activity-Based Costing)
```
Indirect_Cost = SUM(Activity_Cost * Activity_Volume / Total_Activity_Volume)
```
**Allocation Methods:**
- **By Customer:** Overhead allocated by customer relationship value
- **By Branch:** Rent, utilities, staff costs allocated to branch
- **By Segment:** Shared services allocated by segment revenue share

**FSDM Sources:**
- `GL_MAIN_ACCOUNT` - General ledger cost accounts
- `ORGANIZATION` - Cost center hierarchy
- `EXPENSE_ACCOUNT` - Expense categorization

### 2.3 Total Costs
```
Total_Cost = Direct_Cost + Indirect_Cost + Channel_Cost
```

## 3. Risk & Provisions

### 3.1 Expected Credit Loss (ECL) / Provision
```
ECL = PD * LGD * EAD
    PD  = Probability of Default (from credit models)
    LGD = Loss Given Default (recovery rate adjusted)
    EAD = Exposure at Default (outstanding + committed undrawn)
```
**FSDM Sources:**
- `PARTY_LIABILITY_CREDIT_RATING` - PD by obligor
- `AGREEMENT_RISK_METRIC` - EAD, LGD per agreement
- `COLLATERAL_ITEM_VALUE` - Collateral reducing LGD
- `EXPOSURE_AGREEMENT_RISK_MITIGANT` - Risk mitigation

### 3.2 Risk-Weighted Assets (RWA)
```
RWA = EAD * Risk_Weight(asset_class, credit_rating)
```
**FSDM Sources:**
- `AGREEMENT_RISK_METRIC.Risk_Weighted_Asset_Amt`
- `BASEL_DEFAULT_STATUS_PARAMETER` - Basel risk weights

### 3.3 Economic Capital
```
Economic_Capital = RWA * Capital_Ratio (typically 8-12%)
Capital_Charge = Economic_Capital * Cost_Of_Equity
```

## 4. Profitability Metrics

### 4.1 Net Profit
```
Net_Profit = Total_Revenue - Total_Cost - Provision_Expense
```

### 4.2 RAROC (Risk-Adjusted Return on Capital)
```
RAROC = (Total_Revenue - Total_Cost - Expected_Loss) / Economic_Capital
```
**Target:** RAROC > Cost of Equity (typically 12-15%)

### 4.3 Cost-to-Income Ratio
```
CIR = Total_Cost / Total_Revenue
```
**Benchmark:** Best-in-class banks: 40-50%, Average: 55-65%

### 4.4 Return on Equity (ROE)
```
ROE = Net_Profit / Equity_Allocated
```

### 4.5 Economic Profit (EP)
```
EP = Net_Profit - (Economic_Capital * Cost_of_Equity)
```
**Positive EP** = Value creation above risk-adjusted cost of capital.

## 5. Profitability by Dimension

### 5.1 Customer Level
- Full P&L per customer across all products
- Customer Lifetime Value (CLV) projection
- Cross-sell/up-sell opportunity scoring

### 5.2 Branch Level
- Branch P&L including allocated overhead
- Revenue per customer per branch
- Branch efficiency metrics

### 5.3 Business Segment Level
- Segment contribution margin
- Segment-level RAROC
- Product mix analysis per segment

### 5.4 Product Level
- Product margin analysis
- Product profitability trends
- Pricing optimization inputs
