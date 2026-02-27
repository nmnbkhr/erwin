# Teradata FSDM Analysis Report
**Generated:** 2026-02-27 07:25:46
**Model:** Teradata Financial Services Data Model v13.00.00
**Source:** ERwin Data Modeler 9.5 (GDM Binary Format - Logical Data Model)

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Entities | 3,271 |
| Total Attributes | 9,379 |
| Total Relationships | 219 |
| Subject Areas | 26 |
| Avg Attributes/Entity | 2.9 |
| Orphan Entities | 2971 |

## Subject Area Breakdown

| Subject Area | Entity Count |
|-------------|-------------|
| Foundation - Party | 380 |
| Unassigned | 357 |
| Foundation - Finance | 356 |
| Foundation - Event | 354 |
| Foundation - Campaign | 266 |
| Foundation - Agreement | 252 |
| Banking - Agreement | 240 |
| Foundation | 174 |
| Investment - Product | 129 |
| Foundation - Product | 127 |
| Foundation - Channel | 122 |
| Investment - Agreement | 121 |
| Foundation - Location | 117 |
| Foundation - Party Asset | 109 |
| Investment - Event | 52 |
| Foundation - Internal Organization | 25 |
| Banking - Party Asset | 21 |
| Investment - Party | 20 |
| Banking - Party | 14 |
| Banking - Product | 11 |
| Banking - Finance | 7 |
| Banking - Internal Organization | 6 |
| Banking - Event | 5 |
| Banking | 3 |
| Banking - Channel | 2 |
| Banking - Campaign | 1 |

## Top 20 Entities by Attribute Count

| Entity | Attributes | Subject Area |
|--------|-----------|-------------|
| INCOME STATEMENT GL MAIN ACCOUNT | 548 | Foundation - Finance |
| SETTLEMENT ACCOUNT DETAILS | 78 |  |
| AGREEMENT CHANNEL TYPE | 69 | Foundation - Agreement |
| REINSURED RISK | 55 |  |
| SURVEY RESOLUTION TYPE | 53 | Foundation |
| AGREEMENT RISK HISTORY | 50 | Banking - Agreement |
| AGREEMENT SUMMARY | 41 | Foundation - Agreement |
| PARTY AGREEMENT METRIC | 40 | Foundation - Agreement |
| INTEREST RATE QUOTATION | 32 | Investment - Product |
| STREET ADDRESS DETAIL | 27 | Foundation - Location |
| WEB PAGE VIEW | 27 | Foundation - Event |
| EXPOSURE AGREEMENT ASSET VALUE | 25 | Banking - Agreement |
| LOAN TERM AGREEMENT | 24 | Banking - Agreement |
| SECURITIZATION EXPOSURE | 23 | Banking - Agreement |
| WEB VISIT | 22 | Foundation - Event |
| SECURITIZATION POOL RISK | 22 | Banking - Agreement |
| REPURCHASE AGREEMENT | 22 | Investment - Agreement |
| PARTY LIABILITY CREDIT RATING | 21 | Foundation - Party Asset |
| ASSUMPTION SET | 21 | Foundation |
| CREDIT AGREEMENT | 20 | Banking - Agreement |

## Hub Entities (Most Relationships)

| Entity | Relationships | As Parent | As Child |
|--------|--------------|-----------|----------|
| HR POSITION SITE REASON | 50 | 50 | 0 |
| OPPORTUNITY STATUS TYPE | 15 | 15 | 0 |
| AGREEMENT FEATURE RELATED | 10 | 10 | 0 |
| BANK CAPITAL SUMMARY | 5 | 5 | 0 |
| PRODUCT GROUP METRIC | 4 | 4 | 0 |
| AGREEMENT PARTY FEATURE | 4 | 4 | 0 |
| AGREEMENT IDENTIFICATION | 4 | 2 | 2 |
| CHANNEL CHANNEL CLASS XREF | 4 | 2 | 2 |
| MARKET QUOTATION METRIC TYPE | 3 | 2 | 1 |
| INVESTMENT PRODUCT GROUP RISK FACTOR | 3 | 3 | 0 |
| MARKET QUOTATION METRIC | 3 | 1 | 2 |
| AGREEMENT ASSET | 3 | 3 | 0 |
| AGREEMENT METRIC PROJECTION | 3 | 3 | 0 |
| BASEL DEFAULT STATUS PARAMETER | 3 | 3 | 0 |
| INTEREST RATE BANKING BOOK SUMMARY | 3 | 0 | 3 |
| INCIDENT PERIL TYPE | 3 | 2 | 1 |
| PARTY CLASS VALUE | 3 | 3 | 0 |
| TASK ADJUSTMENT | 3 | 0 | 3 |
| VISITOR | 3 | 2 | 1 |
| FUTURES AGREEMENT | 2 | 2 | 0 |

## FSDM-Specific Structures

### Customer/Party Dimension
Count: 348

- AD ORDER PARTY (0 attributes)
- AD ORDER PARTY ROLE (2 attributes)
- AGREEMENT INSURED PARTY (2 attributes)
- AGREEMENT PARTY FEATURE (3 attributes)
- AGREEMENT PARTY FEATURE RELATED (1 attributes)
- AGREEMENT PARTY TEXT (3 attributes)
- ALERT SETUP NOTIFICATION PARTY (7 attributes)
- ASSOCIATE ORGANIZATION POSITION (6 attributes)
- BASEL ORGANIZATION TYPE (2 attributes)
- CAMPAIGN CELL PARTY (1 attributes)
- CAMPAIGN PARTY (2 attributes)
- CAMPAIGN PARTY ROLE (2 attributes)
- CASE PARTY (0 attributes)
- CASE PARTY ROLE TYPE (2 attributes)
- CLAIM SUBMITTING PARTY (1 attributes)
- CLAIM SUBSCRIBING PARTY (1 attributes)
- CLAIM THIRD PARTY (1 attributes)
- CREDIT REPORTING PARTY SUBTYPE (2 attributes)
- CUSTOMER ADDRESS (0 attributes)
- CUSTOMER AGREEMENT AS COLLATERAL AGREEMENT (0 attributes)
- CUSTOMER LINK TO ADDRESS (0 attributes)
- CUSTOMER LOCATION TYPE (2 attributes)
- CUSTOMER NAME (2 attributes)
- CUSTOMER PORTFOLIO EVENT (0 attributes)
- CUSTOMER ROLE (0 attributes)
- CUSTOMER TONE TYPE (2 attributes)
- CUSTOMER TRANSACTION FRAUD (0 attributes)
- EVENT PARTY (2 attributes)
- EVENT PARTY ROLE (2 attributes)
- EVENT PARTY TEXT SECTION (0 attributes)
- ... and 318 more

### Account/Agreement
Count: 406

- ACCOUNT (7 attributes)
- ACCOUNT INVOLVEMENT SUBTYPE (2 attributes)
- ACCOUNT METRIC (6 attributes)
- ACCOUNT METRIC TYPE (2 attributes)
- ACCOUNT PURPOSE SUBTYPE (2 attributes)
- ACCOUNT RENEWAL (4 attributes)
- ACCOUNT TYPE (2 attributes)
- ACCOUNTING CALENDAR TYPE (0 attributes)
- ACCOUNTING CURRENCY (4 attributes)
- ACCOUNTING TYPE (2 attributes)
- ACCOUNTS PAYABLE (0 attributes)
- ACCOUNTS RECEIVABLE (0 attributes)
- ACCRUED LIABILITY ACCOUNT (0 attributes)
- AFFILIATE PRODUCT AGREEMENT (0 attributes)
- AGENT BROKER AGREEMENT DETAIL (2 attributes)
- AGREEMENT (15 attributes)
- AGREEMENT ABUSE (5 attributes)
- AGREEMENT ACCESS DEVICE (3 attributes)
- AGREEMENT ACCESS DEVICE FEATURE (2 attributes)
- AGREEMENT ACCESS DEVICE TYPE (2 attributes)
- AGREEMENT AGREEMENT CLASS XREF (2 attributes)
- AGREEMENT AGREEMENT GROUP (3 attributes)
- AGREEMENT AGREEMENT GROUP SUBTYPE (2 attributes)
- AGREEMENT APPLICATION (3 attributes)
- AGREEMENT APPLICATION ROLE (4 attributes)
- AGREEMENT ASSET (2 attributes)
- AGREEMENT BALANCE TYPE METRIC (14 attributes)
- AGREEMENT CHANNEL (4 attributes)
- AGREEMENT CHANNEL ROLE TYPE (2 attributes)
- AGREEMENT CHANNEL TYPE (69 attributes)
- ... and 376 more

### Product
Count: 172

- AFFILIATE PRODUCT AGREEMENT (0 attributes)
- AGREEMENT PRODUCT (3 attributes)
- AGREEMENT PRODUCT FEATURE (16 attributes)
- AGREEMENT PRODUCT FEATURE RELATED (5 attributes)
- AGREEMENT PRODUCT ROLE TYPE (3 attributes)
- APPLICATION PRODUCT (0 attributes)
- ASSET BACKED SECURITY PRODUCT (1 attributes)
- BANKING PRODUCT (0 attributes)
- BANKING PRODUCT TYPE (2 attributes)
- BARRIER OPTION PRODUCT (2 attributes)
- CAMPAIGN PRODUCT (0 attributes)
- CAMPAIGN PRODUCT ROLE (2 attributes)
- CREDIT DERIVATIVE PRODUCT (0 attributes)
- CURRENCY PRODUCT (1 attributes)
- CURRENCY PRODUCT PAIR (0 attributes)
- CUSIP PRODUCT IDENTIFIER (0 attributes)
- EVENT PRODUCT (0 attributes)
- EVENT PRODUCT IDENTIFICATION (0 attributes)
- EVENT PRODUCT ROLE (2 attributes)
- EXCHANGE LISTED PRODUCT RELATED (1 attributes)
- EXCHANGE PRODUCT (4 attributes)
- FINANCIAL PRODUCT (0 attributes)
- FUTURES CONTRACT PRODUCT (9 attributes)
- GL NONSERVICE PRODUCT TYPE (0 attributes)
- GL PRODUCT SEGMENT (0 attributes)
- GL PRODUCT SEGMENT SUBJECT AREA (0 attributes)
- GL REPORTING NONSERVICE PRODUCT (0 attributes)
- GL REPORTING PRODUCT (2 attributes)
- GL REPORTING SERVICE PRODUCT (0 attributes)
- GL SERVICE PRODUCT TYPE (0 attributes)
- ... and 142 more

### Transaction/Event
Count: 249

- ACCESS DEVICE ACTIVATE EVENT (0 attributes)
- ACCESS DEVICE EVENT (3 attributes)
- ACCIDENT EVENT (1 attributes)
- AD EVENT (1 attributes)
- AD EVENT TYPE (2 attributes)
- AD ORDER EVENT (0 attributes)
- AGREEMENT COVERAGE EVENT (4 attributes)
- AGREEMENT COVERAGE EVENT BASE TYPE (3 attributes)
- AGREEMENT COVERAGE EVENT CATEGORY (3 attributes)
- AGREEMENT COVERAGE EVENT TYPE (3 attributes)
- AGREEMENT EVENT (1 attributes)
- AGREEMENT EVENT TYPE (2 attributes)
- AGREEMENT GROUP EVENT (1 attributes)
- AGREEMENT PAYMENT OPTION (3 attributes)
- AGREEMENT PORTFOLIO EVENT (0 attributes)
- ALERT EVENT (6 attributes)
- ALERT EVENT CATEGORY (2 attributes)
- ALERT EVENT SUBTYPE (2 attributes)
- ALERT EVENT WEIGHTING (2 attributes)
- AP INVOICE LINE PAYMENT (0 attributes)
- APPLICATION EVENT (0 attributes)
- APPLICATION WEB EVENT (1 attributes)
- ASSOCIATE PAYROLL TRANSACTION (12 attributes)
- AUDIO PLAY EVENT (11 attributes)
- BACK OFFICE EVENT (1 attributes)
- BANK EVENT (1 attributes)
- BANK TRANSFER EVENT TYPE (2 attributes)
- BOFD CHECK EVENT (0 attributes)
- BOND PAYMENT SCHEDULE (8 attributes)
- CALL CENTER CONTACT EVENT (2 attributes)
- ... and 219 more

### Balance/Metric
Count: 136

- ACCOUNT METRIC (6 attributes)
- ACCOUNT METRIC TYPE (2 attributes)
- AGREEMENT BALANCE TYPE METRIC (14 attributes)
- AGREEMENT CREDIT RISK TYPE METRIC (8 attributes)
- AGREEMENT FEATURE METRIC (8 attributes)
- AGREEMENT FEATURE METRIC TYPE (2 attributes)
- AGREEMENT GROUP BALANCE (4 attributes)
- AGREEMENT GROUP METRIC (6 attributes)
- AGREEMENT GROUP METRIC TYPE (2 attributes)
- AGREEMENT GROUP RELATED METRIC (1 attributes)
- AGREEMENT GROUP RISK TYPE METRIC (5 attributes)
- AGREEMENT METRIC (8 attributes)
- AGREEMENT METRIC PROJECTION (7 attributes)
- AGREEMENT METRIC TYPE (4 attributes)
- AGREEMENT RISK METRIC INTERNAL INVESTMENT (3 attributes)
- AGREEMENT RISK METRIC OFF BALANCE SHEET (4 attributes)
- AGREEMENT RISK METRIC OTC DERIVATIVE (1 attributes)
- AGREEMENT RISK METRIC PURCHASED RECEIVABLE (2 attributes)
- AGREEMENT RISK METRIC SECURITIZATION (7 attributes)
- AGREEMENT STATEMENT LINE METRIC (3 attributes)
- AGREEMENT STATEMENT METRIC (3 attributes)
- APPLICATION METRIC (5 attributes)
- APPLICATION METRIC TYPE (2 attributes)
- BALANCE CATEGORY TYPE (2 attributes)
- BALANCE CATEGORY USE TYPE (2 attributes)
- BALANCE RATE TYPE (2 attributes)
- BALANCE SHEET GL MAIN ACCOUNT (1 attributes)
- BALANCE SHEET GL MAIN ACCOUNT TYPE (4 attributes)
- BALANCE SHEET TYPE (2 attributes)
- BUSINESS LINE LOSS TYPE MEASURE (0 attributes)
- ... and 106 more

### Reference/Lookup
Count: 1154

- ACCESS DEVICE METHOD TYPE (2 attributes)
- ACCESS DEVICE PIN REASON TYPE (2 attributes)
- ACCESS DEVICE REASON TYPE (2 attributes)
- ACCESS DEVICE RELATED TYPE (1 attributes)
- ACCESS DEVICE STATUS (2 attributes)
- ACCESS DEVICE STATUS TYPE (2 attributes)
- ACCESS DEVICE SUBTYPE (2 attributes)
- ACCESS DEVICE VERIFY TYPE (2 attributes)
- ACCESS MEDIUM TYPE (2 attributes)
- ACCIDENT TYPE (4 attributes)
- ACCOUNT INVOLVEMENT SUBTYPE (2 attributes)
- ACCOUNT METRIC TYPE (2 attributes)
- ACCOUNT PURPOSE SUBTYPE (2 attributes)
- ACCOUNT TYPE (2 attributes)
- ACCOUNTING CALENDAR TYPE (0 attributes)
- ACCOUNTING TYPE (2 attributes)
- AD DELIVERY TYPE (2 attributes)
- AD EVENT TYPE (2 attributes)
- AD ORDER DELIVERY SUBTYPE (2 attributes)
- AD ORDER MAKE GOOD REASON TYPE (2 attributes)
- AD ORDER MAKE GOOD SUBTYPE (2 attributes)
- AD ORDER ONLINE SUBTYPE (2 attributes)
- AD ORDER STATUS (2 attributes)
- AD ORDER STATUS TYPE (2 attributes)
- AD ORDER TRADITIONAL SUBTYPE (2 attributes)
- AD ORDER TYPE (2 attributes)
- AD PLACEMENT SUBTYPE (2 attributes)
- AD STATUS (3 attributes)
- AD STATUS TYPE (2 attributes)
- AD SUBCATEGORY (2 attributes)
- ... and 1124 more

### Location/Geography
Count: 30

- ADDRESS (2 attributes)
- ADDRESS DELIVERY STATUS (1 attributes)
- ADDRESS SUBTYPE (4 attributes)
- BROWSER GEOGRAPHIC ADDRESS INFORMATION (0 attributes)
- BUSINESS IDENTIFIER ADDRESS (0 attributes)
- COUNTRY (1 attributes)
- COUNTRY GROUP (1 attributes)
- CUSTOMER ADDRESS (0 attributes)
- CUSTOMER LINK TO ADDRESS (0 attributes)
- CUSTOMER LOCATION TYPE (2 attributes)
- ELECTRONIC ADDRESS (3 attributes)
- ELECTRONIC ADDRESS SUBTYPE (2 attributes)
- GEOGRAPHY RISK GRADE (3 attributes)
- INTERNET PROTOCOL ADDRESS (4 attributes)
- INTERNET PROTOCOL ADDRESS GEOGRAPHICAL MAP (5 attributes)
- INVESTMENT AGREEMENT ALLOCATION (3 attributes)
- OVERSEAS MILITARY ADDRESS (3 attributes)
- PARCEL ADDRESS (7 attributes)
- PARTY ADDRESS (3 attributes)
- PORTFOLIO INVESTMENT ALLOCATION (3 attributes)
- POST OFFICE BOX ADDRESS (3 attributes)
- POSTAL CODE (2 attributes)
- POSTAL CODE JAPAN (1 attributes)
- REGION (1 attributes)
- ROUTING TRANSIT NUMBER ADDRESS (0 attributes)
- STREET ADDRESS (4 attributes)
- STREET ADDRESS DETAIL (27 attributes)
- STREET ADDRESS JAPAN (5 attributes)
- STREET ADDRESS LINE (2 attributes)
- WEB SERVER INTERNET PROTOCOL ADDRESS (2 attributes)

### Channel
Count: 79

- AGREEMENT CHANNEL (4 attributes)
- AGREEMENT CHANNEL ROLE TYPE (2 attributes)
- AGREEMENT CHANNEL TYPE (69 attributes)
- ATM CHANNEL INSTANCE (1 attributes)
- ATM CHANNEL TYPE (0 attributes)
- BILLBOARD CHANNEL INSTANCE (1 attributes)
- CALL CENTER CHANNEL TYPE (0 attributes)
- CALL CENTER TERMINAL CHANNEL INSTANCE (1 attributes)
- CAMPAIGN CHANNEL TYPE MULTIMEDIA OBJECT (0 attributes)
- CAMPAIGN CHANNEL TYPE XREF (0 attributes)
- CELL TARGET CHANNEL INSTANCE (3 attributes)
- CHANNEL CAPACITY (3 attributes)
- CHANNEL CHANNEL CLASS XREF (6 attributes)
- CHANNEL CLASS SCHEME TYPE (10 attributes)
- CHANNEL CLASS VALUE (15 attributes)
- CHANNEL COST (4 attributes)
- CHANNEL DEMOGRAPHIC (4 attributes)
- CHANNEL EVENT (4 attributes)
- CHANNEL EVENT REASON TYPE (2 attributes)
- CHANNEL FEATURE (11 attributes)
- CHANNEL INSTANCE (5 attributes)
- CHANNEL INSTANCE LOCATOR (2 attributes)
- CHANNEL INSTANCE LOCATOR REASON (2 attributes)
- CHANNEL INSTANCE RELATED (0 attributes)
- CHANNEL INSTANCE RELATED REASON (0 attributes)
- CHANNEL INSTANCE SITE XREF (2 attributes)
- CHANNEL INSTANCE SUBTYPE (4 attributes)
- CHANNEL NETWORK (0 attributes)
- CHANNEL OPERATING HOURS (1 attributes)
- CHANNEL PROCESSING TYPE (2 attributes)
- ... and 49 more

### Campaign/Promotion
Count: 163

- AD CONTACT XREF (1 attributes)
- AD DELIVERY TYPE (2 attributes)
- AD EVENT (1 attributes)
- AD EVENT TYPE (2 attributes)
- AD GROUP CAMPAIGN XREF (1 attributes)
- AD IMPRESSION SUMMARY (4 attributes)
- AD NETWORK (3 attributes)
- AD NETWORK WEB SITE (0 attributes)
- AD OBJECT (0 attributes)
- AD OFFER (0 attributes)
- AD ORDER (11 attributes)
- AD ORDER BROADCAST MEDIUM (0 attributes)
- AD ORDER COMMISSION (3 attributes)
- AD ORDER DELIVERY SUBTYPE (2 attributes)
- AD ORDER DISPLAY TIME (0 attributes)
- AD ORDER EVENT (0 attributes)
- AD ORDER EXPENSE FORECAST (3 attributes)
- AD ORDER INTERACTIVE DEVICE MEDIUM (0 attributes)
- AD ORDER MAKE GOOD (2 attributes)
- AD ORDER MAKE GOOD PLACEMENT (0 attributes)
- AD ORDER MAKE GOOD REASON TYPE (2 attributes)
- AD ORDER MAKE GOOD REFUND (5 attributes)
- AD ORDER MAKE GOOD SUBTYPE (2 attributes)
- AD ORDER ONLINE (9 attributes)
- AD ORDER ONLINE SUBTYPE (2 attributes)
- AD ORDER OUTDOOR MEDIUM (0 attributes)
- AD ORDER PARTY (0 attributes)
- AD ORDER PARTY ROLE (2 attributes)
- AD ORDER PRINT MEDIUM (2 attributes)
- AD ORDER STATUS (2 attributes)
- ... and 133 more

### Insurance/Claim
Count: 184

- AGREEMENT CLAIM (3 attributes)
- AGREEMENT CLAIM RELATIONSHIP TYPE (3 attributes)
- AGREEMENT COVERAGE EVENT (4 attributes)
- AGREEMENT COVERAGE EVENT BASE TYPE (3 attributes)
- AGREEMENT COVERAGE EVENT CATEGORY (3 attributes)
- AGREEMENT COVERAGE EVENT TYPE (3 attributes)
- AGREEMENT INSURANCE RISK CATEGORY (3 attributes)
- APPLICATION INSURANCE RISK CATEGORY (3 attributes)
- ASSET INSURANCE HISTORY TYPE (2 attributes)
- ASSET INSURANCE RISK CATEGORY (0 attributes)
- ASSET INSURANCE RISK FACTOR (2 attributes)
- AVAILABLE COVERAGES (0 attributes)
- BEFORE TAX MEDICAL INSURANCE (0 attributes)
- CLAIM (5 attributes)
- CLAIM ADJUDICATION (3 attributes)
- CLAIM ADJUDICATION AMOUNT (2 attributes)
- CLAIM AMOUNT (4 attributes)
- CLAIM AMOUNT TYPE (3 attributes)
- CLAIM ASSET (4 attributes)
- CLAIM ASSET RELATIONSHIP TYPE (2 attributes)
- CLAIM AUTHORIZATION (11 attributes)
- CLAIM AUTHORIZATION AMOUNT (2 attributes)
- CLAIM AUTHORIZATION AMOUNT TYPE (3 attributes)
- CLAIM AUTHORIZATION DIAGNOSIS CODE (1 attributes)
- CLAIM AUTHORIZATION END REASON TYPE (3 attributes)
- CLAIM AUTHORIZATION EVENT (1 attributes)
- CLAIM AUTHORIZATION EVENT ROLE (3 attributes)
- CLAIM AUTHORIZATION FEATURE (4 attributes)
- CLAIM AUTHORIZATION RELATED (3 attributes)
- CLAIM AUTHORIZATION RELATIONSHIP TYPE (3 attributes)
- ... and 154 more

### Investment
Count: 176

- AD ORDER MAKE GOOD REFUND (5 attributes)
- AGENT COMMISSION OPTION TYPE (3 attributes)
- AGREEMENT FUNDING SOURCE (1 attributes)
- AGREEMENT PAYMENT OPTION (3 attributes)
- AGREEMENT RISK METRIC INTERNAL INVESTMENT (3 attributes)
- AMERICAN EXERCISE OPTION (0 attributes)
- APPLICATION INVESTMENT DETAIL (4 attributes)
- ASIAN OPTION (11 attributes)
- ASIAN OPTION TYPE (3 attributes)
- ASSET BACKED SECURITY PRINCIPAL (0 attributes)
- ASSET BACKED SECURITY PRODUCT (1 attributes)
- ASSET BACKED SECURITY TYPE (2 attributes)
- AVERAGE PRICE OPTION (0 attributes)
- AVERAGE STRIKE OPTION (0 attributes)
- BARRIER OPTION AGREEMENT (4 attributes)
- BARRIER OPTION PRODUCT (2 attributes)
- BARRIER OPTION TYPE (2 attributes)
- BASEL EQUITY RISK WEIGHT PARAMETER (5 attributes)
- BENEFIT PLAN OPTION (11 attributes)
- BENEFIT PLAN OPTION ELIGIBILITY (8 attributes)
- BENEFIT PLAN OPTION POSITION (9 attributes)
- BENEFIT PLAN OPTION STATUS TYPE (4 attributes)
- BENEFIT PLAN OPTION SUBTYPE (4 attributes)
- BERMUDA EXERCISE OPTION (0 attributes)
- BEST OF OPTION (0 attributes)
- BINARY OPTION (0 attributes)
- BOND AMORTIZATION SCHEDULE (4 attributes)
- BOND CALL SCHEDULE (4 attributes)
- BOND CALL TYPE (2 attributes)
- BOND CONVERSION SCHEDULE (4 attributes)
- ... and 146 more

### Risk/Basel
Count: 188

- AGREEMENT CLASS RISK GRADE (5 attributes)
- AGREEMENT COLLATERAL ITEM (2 attributes)
- AGREEMENT CREDIT RISK TYPE METRIC (8 attributes)
- AGREEMENT GROUP RISK (15 attributes)
- AGREEMENT GROUP RISK GRADE (4 attributes)
- AGREEMENT GROUP RISK TYPE METRIC (5 attributes)
- AGREEMENT INSURANCE RISK CATEGORY (3 attributes)
- AGREEMENT MARKET RISK FACTOR (5 attributes)
- AGREEMENT MARKET RISK TYPE (8 attributes)
- AGREEMENT RISK GRADE (4 attributes)
- AGREEMENT RISK GRADE RELATED (4 attributes)
- AGREEMENT RISK HISTORY (50 attributes)
- AGREEMENT RISK METRIC INTERNAL INVESTMENT (3 attributes)
- AGREEMENT RISK METRIC OFF BALANCE SHEET (4 attributes)
- AGREEMENT RISK METRIC OTC DERIVATIVE (1 attributes)
- AGREEMENT RISK METRIC PURCHASED RECEIVABLE (2 attributes)
- AGREEMENT RISK METRIC SECURITIZATION (7 attributes)
- ANALYTICAL MODEL RISK FACTOR (2 attributes)
- ANALYTICAL MODEL RISK FACTOR ROLE (11 attributes)
- ANALYTICAL MODEL TO RISK GRADE (2 attributes)
- APPLICATION COLLATERAL ASSET (2 attributes)
- APPLICATION INSURANCE RISK CATEGORY (3 attributes)
- ASSET CLASS MATURITY RISK GRADE (3 attributes)
- ASSET COLLATERAL ITEM (2 attributes)
- ASSET COLLATERAL ROLE TYPE (2 attributes)
- ASSET INSURANCE RISK CATEGORY (0 attributes)
- ASSET INSURANCE RISK FACTOR (2 attributes)
- ASSET RISK GRADE (3 attributes)
- ASSET RISK GRADE RELATED (3 attributes)
- BANK ACTUAL RISK LOSS (10 attributes)
- ... and 158 more

## Orphan Entities (No Detected Relationships)
Count: 2971

- ACCESS DEVICE
- ACCESS DEVICE ACTIVATE EVENT
- ACCESS DEVICE DESCRIPTIVE FEATURE
- ACCESS DEVICE EVENT
- ACCESS DEVICE FEATURE
- ACCESS DEVICE LIMIT
- ACCESS DEVICE METHOD TYPE
- ACCESS DEVICE PIN
- ACCESS DEVICE PIN REASON TYPE
- ACCESS DEVICE REASON TYPE
- ACCESS DEVICE RELATED
- ACCESS DEVICE RELATED TYPE
- ACCESS DEVICE STATUS
- ACCESS DEVICE STATUS TYPE
- ACCESS DEVICE SUBTYPE
- ACCESS DEVICE VERIFY TYPE
- ACCESS MEDIUM TYPE
- ACCIDENT EVENT
- ACCIDENT TYPE
- ACCOUNT INVOLVEMENT SUBTYPE
- ACCOUNT METRIC
- ACCOUNT METRIC TYPE
- ACCOUNT PURPOSE SUBTYPE
- ACCOUNT RENEWAL
- ACCOUNT TYPE
- ACCOUNTING CALENDAR TYPE
- ACCOUNTING CURRENCY
- ACCOUNTING TYPE
- ACCOUNTS PAYABLE
- ACCOUNTS RECEIVABLE
- ACCRUED LIABILITY ACCOUNT
- ACTIVITY ACTIVITY GROUP
- ACTIVITY GROUP
- AD CONTACT XREF
- AD DELIVERY TYPE
- AD EVENT
- AD EVENT TYPE
- AD GROUP CAMPAIGN XREF
- AD IMPRESSION SUMMARY
- AD NETWORK
- AD NETWORK WEB SITE
- AD OBJECT
- AD OFFER
- AD ORDER BROADCAST MEDIUM
- AD ORDER COMMISSION
- AD ORDER DELIVERY SUBTYPE
- AD ORDER DISPLAY TIME
- AD ORDER EVENT
- AD ORDER EXPENSE FORECAST
- AD ORDER INTERACTIVE DEVICE MEDIUM
- ... and 2921 more
