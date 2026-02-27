# BVF Profitability Capability Coverage Report
**Generated:** 2026-02-27 07:59
**Source:** BVF v1.2 + FSDM v16.00.00
**Target:** Pakistani Bank Customer Profitability Engine

## Executive Summary

This report maps each profitability-related BVF capability to:
1. Required data requirements from the BVF
2. FSDM entities that supply that data
3. Star schema tables/columns that implement it
4. Gap analysis: what's missing
5. Pakistan/UBL-specific considerations

---

## Activity Based Costing
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 61

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Business Process Definition | Not Covered | EVENT, PROCESS_EVENT | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Campaign Promotional Calendar | Campaign | CAMPAIGN, CAMPAIGN_WAVE, CAMPAIGN_SCHEDULE | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Research - Primary & Secondary | Cross Subject - Survey | SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_SURVEY_RESPONSE | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Economic Forecast Data | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Legal Actions | Party | PARTY_LEGAL_ACTION, LEGAL_ACTION, PARTY_LITIGATION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Gap Analysis

> FSDM lacks dedicated ABC/cost allocation entities. Need custom extension tables for cost drivers, activity pools, and allocation rules.

### Pakistan/UBL Considerations

> Include Pakistan-specific cost drivers: branch security costs (higher than global avg), cash handling costs (cash-heavy economy), regulatory compliance costs (SBP, FBR, SECP).

---

## Profitability Modelling
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 67

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Legal Actions | Party | PARTY_LEGAL_ACTION, LEGAL_ACTION, PARTY_LITIGATION | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Pakistan/UBL Considerations

> Must handle dual banking (conventional + Islamic) profitability. Islamic products use profit-sharing ratios instead of interest rates. WHT deduction impacts net customer profitability.

---

## Future / Lifetime Value
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 64

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Attribution Models - response | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, CAMPAIGN_RESPONSE | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Economic Forecast Data | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX | — |
| External Data - Competitor Product & Pricing | Party & Product | PRODUCT, MARKET_INDEX | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Predictive Models - attrition | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - price elasticity | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE | — |
| Predictive Models - propensity to buy | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Gap Analysis

> FSDM has no CLV/LTV calculation entities. Need extension for customer lifetime value models and discount rate assumptions.

---

## Profitability Analytics and Optimisation
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 78

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Attribution Models - response | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, CAMPAIGN_RESPONSE | — |
| Business Process Definition | Not Covered | EVENT, PROCESS_EVENT | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Attitudinal Data | Party | PARTY_PREFERENCE, PARTY_CLASSIFICATION, PARTY_SURVEY_RESPONSE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Research - Primary & Secondary | Cross Subject - Survey | SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_SURVEY_RESPONSE | — |
| Customer Satisfaction Measurement (E.g. NPS) | Party | PARTY_SURVEY_RESPONSE, SURVEY, SURVEY_QUESTION_RESPONSE | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Economic Forecast Data | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX | — |
| External Data - Competitor Product & Pricing | Party & Product | PRODUCT, MARKET_INDEX | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| HR Performance Data | Party | ASSOCIATE, ASSOCIATE_PERFORMANCE_REVIEW, ASSOCIATE_ASSIGNMENT | — |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Predictive Models - attrition | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - price elasticity | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE | — |
| Predictive Models - propensity to buy | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product NPV's | Product | PRODUCT, PRODUCT_VALUATION, AGREEMENT_SUMMARY | DIM_PRODUCT: Product_NPV_Amt |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Sales and Performance Forecasts, Targets & KP | Party | PERFORMANCE_METRIC, PERFORMANCE_TARGET, ORGANIZATION_PERFORMANCE | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

---

## Performance Management and KPIs
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 78

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Attribution Models - response | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, CAMPAIGN_RESPONSE | — |
| Business Process Definition | Not Covered | EVENT, PROCESS_EVENT | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Research - Primary & Secondary | Cross Subject - Survey | SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_SURVEY_RESPONSE | — |
| Customer Satisfaction Measurement (E.g. NPS) | Party | PARTY_SURVEY_RESPONSE, SURVEY, SURVEY_QUESTION_RESPONSE | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| External Data - Social Media Data | Party | SOCIAL_MEDIA_ACCOUNT, SOCIAL_MEDIA_TRANSFER, SOCIAL_MEDIA_POST | — |
| External Prospect Data / Lists | Party | PARTY, PROSPECT, PARTY_LIST, PARTY_LIST_MEMBERSHIP | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| HR Performance Data | Party | ASSOCIATE, ASSOCIATE_PERFORMANCE_REVIEW, ASSOCIATE_ASSIGNMENT | — |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Predictive Models - attrition | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - price elasticity | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE | — |
| Predictive Models - propensity to buy | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product NPV's | Product | PRODUCT, PRODUCT_VALUATION, AGREEMENT_SUMMARY | DIM_PRODUCT: Product_NPV_Amt |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Sales and Performance Forecasts, Targets & KP | Party | PERFORMANCE_METRIC, PERFORMANCE_TARGET, ORGANIZATION_PERFORMANCE | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Pakistan/UBL Considerations

> SBP monitors key ratios: CAR, NPL ratio, provision coverage, ROA, ROE, CIR. Quarterly CAMEL rating framework applies.

---

## Pricing Analysis & Optimisation
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 75

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Attribution Models - response | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, CAMPAIGN_RESPONSE | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Attitudinal Data | Party | PARTY_PREFERENCE, PARTY_CLASSIFICATION, PARTY_SURVEY_RESPONSE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Research - Primary & Secondary | Cross Subject - Survey | SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_SURVEY_RESPONSE | — |
| Customer Satisfaction Measurement (E.g. NPS) | Party | PARTY_SURVEY_RESPONSE, SURVEY, SURVEY_QUESTION_RESPONSE | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| External Data - Competitor Product & Pricing | Party & Product | PRODUCT, MARKET_INDEX | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| HR Performance Data | Party | ASSOCIATE, ASSOCIATE_PERFORMANCE_REVIEW, ASSOCIATE_ASSIGNMENT | — |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Predictive Models - attrition | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - price elasticity | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE | — |
| Predictive Models - propensity to buy | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product NPV's | Product | PRODUCT, PRODUCT_VALUATION, AGREEMENT_SUMMARY | DIM_PRODUCT: Product_NPV_Amt |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Sales and Performance Forecasts, Targets & KP | Party | PERFORMANCE_METRIC, PERFORMANCE_TARGET, ORGANIZATION_PERFORMANCE | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Gap Analysis

> FSDM covers basic product pricing but lacks price elasticity and optimization model entities.

### Pakistan/UBL Considerations

> SBP Policy Rate is the key benchmark. Spread caps may apply for certain sectors (agriculture, SME, housing). Minimum deposit rates mandated by SBP.

---

## Financial Budgeting, Planning & Forecasting
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 80

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Attribution Models - response | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, CAMPAIGN_RESPONSE | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Economic Forecast Data | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX | — |
| External Data - Competitor Product & Pricing | Party & Product | PRODUCT, MARKET_INDEX | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| External Economic Data (E.g. Property Prices, | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| HR Performance Data | Party | ASSOCIATE, ASSOCIATE_PERFORMANCE_REVIEW, ASSOCIATE_ASSIGNMENT | — |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Predictive Models - attrition | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - price elasticity | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE | — |
| Predictive Models - propensity to buy | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_MODEL_SCORE | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Product NPV's | Product | PRODUCT, PRODUCT_VALUATION, AGREEMENT_SUMMARY | DIM_PRODUCT: Product_NPV_Amt |
| Product Revenue, Cost & Margin | Product | PRODUCT, PRODUCT_PRICING, PRODUCT_COST, AGREEMENT_SUMMARY | DIM_PRODUCT: Standard_Cost_Amt, Standard_Revenue_Amt; FAC... |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Scenario & Stress Testing Results | Analytical Model | RISK_CALCULATION_SCENARIO, RISK_SCENARIO_RESULT, STRESS_TEST_RESULT | — |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Risk Weighted Assets & Capital Results | Agreement | AGREEMENT_RISK_METRIC, BANK_CAPITAL_SUMMARY, CAPITAL_REQUIREMENTS_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, RAR... |
| Sales and Performance Forecasts, Targets & KP | Party | PERFORMANCE_METRIC, PERFORMANCE_TARGET, ORGANIZATION_PERFORMANCE | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Gap Analysis

> FSDM has limited budget/forecast entities. Need custom BUDGET, FORECAST, and FINANCIAL_PLAN tables.

### Pakistan/UBL Considerations

> Pakistan fiscal year is July-June. Budget cycles align with SBP monetary policy announcements (6-8 per year).

---

## GL, AP, HR, Expense Analytics & Optimisation
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 6

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |

---

## Business Process Analytics & Optimisation
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Planning & Controlling
**Data Requirements Count:** 47

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Application Data (New Customer, New Product) | Agreement | APPLICATION, APPLICATION_STATUS, APPLICATION_PARTY_ROLE | — |
| Business Process Definition | Not Covered | EVENT, PROCESS_EVENT | — |
| Campaign History Data | Campaign | CAMPAIGN, CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, CAMPAIGN_WAVE | — |
| Campaign Production Costs | Campaign | CAMPAIGN, CAMPAIGN_COST, CAMPAIGN_BUDGET | — |
| Case History (Fraud, Money Laundering, Compla | Event | CASE, CASE_EVENT, CASE_PARTY_ROLE, FRAUD_CASE | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Closed Loop Outcomes / Channel Responses | Event | CAMPAIGN_RESPONSE, CAMPAIGN_OFFER_RESPONSE, DIRECT_CONTACT_EVENT | — |
| Complaint Data | Event | COMPLAINT, COMPLAINT_STATUS, COMPLAINT_RESOLUTION | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Illustrations | Agreement | DOCUMENT, PARTY_DOCUMENT | — |
| Customer Quotes | Agreement | APPLICATION, QUOTE, DOCUMENT | — |
| Customer Research - Primary & Secondary | Cross Subject - Survey | SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_SURVEY_RESPONSE | — |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Customer interview / fact find | Event or Cross Subject - Document | DOCUMENT, SURVEY, SURVEY_QUESTION_RESPONSE, PARTY_DOCUMENT | — |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Internal Process Activity Data | Event | EVENT, PROCESS_EVENT, OPERATIONAL_EVENT | — |
| Master & Reference Data - Campaign | Campaign | CAMPAIGN, CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_WAVE | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Master & Reference Data - staff / colleague | Party | INDIVIDUAL, ASSOCIATE, ASSOCIATE_ASSIGNMENT, INTERNAL_ORGANIZATION_UNIT | — |
| Non-Financial Transactions | Event | EVENT, NON_MONETARY_EVENT, DIRECT_CONTACT_EVENT | — |
| Offline Customer Interactions - Branch | Event | DIRECT_CONTACT_EVENT, BRANCH_VISIT_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - Call Centre | Event | DIRECT_CONTACT_EVENT, CALL_EVENT, CHANNEL_INSTANCE | — |
| Offline Customer Interactions - letters | Event | DIRECT_CONTACT_EVENT, CORRESPONDENCE_EVENT, DOCUMENT | — |
| Offline Customer Interactions - sms text | Event | DIRECT_CONTACT_EVENT, SMS_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions -  webchat (internal & ex | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions colleague intranet | Event | WEB_VISIT, WEB_PAGE_VIEW | — |
| Online Interactions customer digital banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, EXTENDED_SESSION_INFORMATION, ONLINE_APPLICATION_ACCESS | — |
| Online Interactions customer general banking  | Event | WEB_VISIT, WEB_PAGE_VIEW, ONLINE_INTERACTION_EVENT | — |
| Online Interactions email - customer & employ | Event | DIRECT_CONTACT_EVENT, EMAIL_EVENT, ELECTRONIC_ADDRESS | — |
| Online Interactions mobile app | Event | WEB_VISIT, WEB_PAGE_VIEW, MOBILE_APP_EVENT, CHANNEL_INSTANCE | — |
| Online Interactions off-site - ad server | Event | AD, AD_PLACEMENT, AD_IMPRESSION, AD_CAMPAIGN_OBJECTIVE | — |
| Online Interactions prospect / unidentified c | Event | WEB_VISIT, WEB_PAGE_VIEW, VISITOR_INTERACTION_EVENT | — |
| Operational metrics (E.g. Wait times, queue l | Internal Organisation | CHANNEL_USAGE_METRIC, OPERATIONAL_EVENT, SERVICE_LEVEL_METRIC | — |
| Profitability Results | Agreement | AGREEMENT_SUMMARY, AGREEMENT_PROFITABILITY, PRODUCT_PROFITABILITY | FACT_CUSTOMER_PROFITABILITY: Gross_Profit_Amt, Net_Profit... |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |
| System Log Files (E.g. Firewall, Webserver) | Not Covered | WEB_VISIT, SYSTEM_EVENT | — |

### Gap Analysis

> FSDM has minimal business process modeling. Need BPM integration or custom process event tables.

---

## Funds Transfer Pricing
**Theme:** Finance & Peformance Management
**Capability Group:** Treasury Mgmt & Insight
**Data Requirements Count:** 14

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |

### Pakistan/UBL Considerations

> Use KIBOR (Karachi Interbank Offered Rate) as benchmark instead of LIBOR. KIBOR tenors: O/N, 1W, 2W, 1M, 3M, 6M, 9M, 1Y. SBP publishes daily KIBOR rates.

---

## Asset & Liability Management
**Theme:** Finance & Peformance Management
**Capability Group:** Treasury Mgmt & Insight
**Data Requirements Count:** 34

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| Finance Systems - Budgets, Plans & Forecasts | Finance | GL_ACCOUNT, BUDGET, FORECAST, FINANCIAL_PLAN | AGG tables: Target vs Actual comparison views |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Legal Actions | Party | PARTY_LEGAL_ACTION, LEGAL_ACTION, PARTY_LITIGATION | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |

### Pakistan/UBL Considerations

> KIBOR-based ALM gap analysis. SBP requires regular ALM reporting. Currency risk management for PKR/USD/EUR/GBP/SAR positions.

---

## Capital Planning and Management
**Theme:** Finance & Peformance Management
**Capability Group:** Treasury Mgmt & Insight
**Data Requirements Count:** 32

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| Economic Forecast Data | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| External Economic Data (E.g. Property Prices, | Party | ECONOMIC_INDEX, ECONOMIC_INDEX_VALUE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Physical Asset Valuations | Party Asset | PARTY_ASSET_VALUATION, COLLATERAL_VALUATION, REAL_PROPERTY_VALUATION | — |
| Physical Assets | Party Asset | PARTY_ASSET, FIXED_ASSET, REAL_PROPERTY | — |
| Predictive Models - risk | Party or Agreement | ANALYTICAL_MODEL, MODEL_RUN, MODEL_SCORE, PARTY_LIABILITY_CREDIT_RATING | — |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Single Customer View (Master Record) | Party | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD... | DIM_CUSTOMER: All columns - core customer dimension |

### Pakistan/UBL Considerations

> Follow SBP's Basel III implementation timeline. MCR (Minimum Capital Requirement) currently PKR 10B for commercial banks. CAR minimum 11.5% (with CCB).

---

## Financial Accounting / Accounting Hub
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Accounting
**Data Requirements Count:** 40

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Physical Asset Valuations | Party Asset | PARTY_ASSET_VALUATION, COLLATERAL_VALUATION, REAL_PROPERTY_VALUATION | — |
| Physical Assets | Party Asset | PARTY_ASSET, FIXED_ASSET, REAL_PROPERTY | — |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |

### Pakistan/UBL Considerations

> Pakistan follows IFRS. SBP issues BSD circulars for banking-specific accounting. Chart of Accounts must align with SBP prescribed format.

---

## Functional Profit & Loss Statement (P&L)
**Theme:** Finance & Peformance Management
**Capability Group:** Financial Accounting
**Data Requirements Count:** 40

### Data Requirements & FSDM Mapping

| Data Requirement | FSDM Subject Area | FSDM Entities | Star Schema |
|-----------------|-------------------|---------------|-------------|
| Account / Policy / Service Detail | Agreement | AGREEMENT, LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT, INSURANCE_AGREEMENT... | DIM_AGREEMENT: Rate, tenor, terms columns |
| Account / Policy / Service Holdings | Agreement | AGREEMENT, PARTY_AGREEMENT_ROLE, AGREEMENT_PARTY_ROLE, AGREEMENT_RELATIONSHIP | DIM_AGREEMENT: Agreement_Type_Cd, Account_Status_Cd |
| Account Balances | Agreement | AGREEMENT_SUMMARY, BALANCE_SUMMARY, AGREEMENT_BALANCE | FACT_CUSTOMER_PROFITABILITY: Average_Balance_Amt, EOP_Bal... |
| Account Feature Usage | Agreement | AGREEMENT_FEATURE, FEATURE, DESCRIPTIVE_FEATURE | — |
| Account Fees, Commissions & Charges | Event | MONETARY_TRANSACTION, FEE_TRANSACTION, COMMISSION_TRANSACTION, AGREEMENT_FEE | FACT_CUSTOMER_PROFITABILITY: Fee_Income_Amt, Commission_I... |
| Account Limits | Cross Subject  -  Limits | AGREEMENT_LIMIT, LIMIT, PARTY_LIMIT | — |
| Account Maturity Dates & Repricing Schedules | Agreement | AGREEMENT, AGREEMENT_TERM, AGREEMENT_REPRICING_SCHEDULE | — |
| Account Repayment Schedules | Agreement | AGREEMENT_REPAYMENT_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Account Status (open closed active / domant / | Agreement | AGREEMENT, AGREEMENT_STATUS, AGREEMENT_STATUS_HISTORY | — |
| Account Terms & Conditions | Agreement | AGREEMENT, AGREEMENT_CONDITION, AGREEMENT_TERM | — |
| Amortisation Schedules | Agreement | AGREEMENT_AMORTIZATION_SCHEDULE, LOAN_TERM_AGREEMENT | — |
| Cashflow Projections | Agreement | AGREEMENT_CASHFLOW, CASHFLOW_SCHEDULE, AGREEMENT_SUMMARY | — |
| Claims | Event | CLAIM, CLAIM_STATUS, CLAIM_PARTY_ROLE, CLAIM_PAYMENT | — |
| Collateral Agreements | Agreement | COLLATERAL_AGREEMENT, COLLATERAL, COLLATERAL_VALUATION, PARTY_ASSET | DIM_AGREEMENT: Collateral_Ind, Collateral_Value_Amt, LTV_... |
| Coverage (insurance) | Agreement | INSURANCE_COVERAGE, INSURANCE_AGREEMENT, COVERAGE_TYPE | — |
| Customer Demographics | Party | INDIVIDUAL, PARTY_DEMOGRAPHIC, PARTY_CLASSIFICATION, PARTY_PREFERENCE | DIM_CUSTOMER: Gender_Cd, Age_Band_Cd, Occupation_Cd, Inco... |
| Customer Segments | Party | PARTY_CLASSIFICATION, PARTY_SEGMENT, PARTY_CLASSIFICATION_VALUE | DIM_CUSTOMER: Customer_Segment_Cd, Customer_SubSegment_Cd... |
| Defaults & Limit Breaches | Event | AGREEMENT_STATUS, DEFAULT_EVENT, LIMIT_BREACH_EVENT, AGREEMENT_RISK_METRIC | — |
| External Data - market interest rates | Product | INTEREST_RATE_INDEX, INTEREST_RATE, MARKET_INDEX, MARKET_INDEX_VALUE | — |
| External Data - market prices (E.g. equities, | Product | MARKET_INDEX, MARKET_INDEX_VALUE, INVESTMENT_PRODUCT, INVESTMENT_PRODUCT_PRICE | — |
| Finance Systems - ERP | Finance | GL_ACCOUNT, GL_MAIN_ACCOUNT, VENDOR, VENDOR_INVOICE | Indirect cost feeds for ABC allocation |
| Finance Systems - General Ledger | Finance |  | — |
| Financial Interbank Payments | Event | PAYMENT, INTERBANK_PAYMENT, FINANCIAL_TRANSACTION | — |
| Financial Transactions | Event | MONETARY_TRANSACTION, TRANSACTION_TYPE, FINANCIAL_TRANSACTION, PAYMENT | FACT_CUSTOMER_PROFITABILITY: Interest_Income_Amt, Fee_Inc... |
| Investment Value | Agreement | INVESTMENT_ACCOUNT, INVESTMENT_HOLDING, INVESTMENT_PRODUCT_PRICE | — |
| Mark to market valuations | Agreement | INVESTMENT_PRODUCT_PRICE, MARKET_INDEX_VALUE, AGREEMENT_VALUATION | — |
| Market / Trading Book Positions | Agreement | TRADE_ORDER, TRADE_EXECUTION, TRADING_POSITION | — |
| Master & Reference Data - Channel | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, CHANNEL_CLASSIFICATION | DIM_CHANNEL: All columns - channel dimension |
| Master & Reference Data - FTP rates | Product | INTEREST_RATE, INTEREST_RATE_INDEX, PRODUCT_INTEREST_RATE | DIM_PRODUCT: FTP_Rate_Pct; FACT: FTP_Rate_Pct, FTP_Credit... |
| Master & Reference Data - exchange rates | Product | CURRENCY, CURRENCY_EXCHANGE_RATE, CURRENCY_PAIR | — |
| Master & Reference Data - geography / locatio | Location | GEOGRAPHICAL_AREA, GEOGRAPHICAL_UNIT, SITE, POSTAL_ADDRESS | — |
| Master & Reference Data - merchant / transact | Event | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE | — |
| Master & Reference Data - organisation hierar | Internal Organisation | ORGANIZATION, INTERNAL_ORGANIZATION_UNIT, ORGANIZATION_UNIT_RELATIONSHIP, ORGANIZATION_BUSINESS_TYPE | DIM_BRANCH: All hierarchy columns; DIM_BUSINESS_SEGMENT |
| Master & Reference Data - product | Product |  | — |
| Physical Asset Valuations | Party Asset | PARTY_ASSET_VALUATION, COLLATERAL_VALUATION, REAL_PROPERTY_VALUATION | — |
| Physical Assets | Party Asset | PARTY_ASSET, FIXED_ASSET, REAL_PROPERTY | — |
| Provisions, Losses & Writeoffs | Party or Agreement | AGREEMENT_RISK_METRIC, PROVISION, WRITE_OFF, LOSS_EVENT | FACT_CUSTOMER_PROFITABILITY: Provision_Expense_Amt, Expec... |
| Risk Exposures | Agreement | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_RISK_SUMMARY | FACT_CUSTOMER_PROFITABILITY: Risk_Weighted_Asset_Amt, Eco... |
| Risk Segments, Cohorts & Groupings | Party or Agreement | PARTY_CLASSIFICATION, RISK_GRADE_VALUE, RISK_GRADE_SCHEME | — |
| Service Usage | Event | CHANNEL_USAGE_METRIC, SERVICE_USAGE_EVENT, CHANNEL_INSTANCE | — |

---

## Coverage Statistics

| Metric | Value |
|--------|-------|
| Profitability capabilities analyzed | 14 |
| Unique data requirements needed | 92 |
| Data requirements mapped to FSDM | 90 |
| Coverage percentage | 97% |
| High-confidence mappings | 56 |
| Medium/Low confidence (need review) | 34 |