# PROMPT 6M: File 08 — Finance: EPM, Treasury Insight & Financial Reporting

## Role

You are a senior banking CFO advisory consultant and presentation specialist. You are rebuilding BVF PowerPoint File 08, which covers the three remaining Finance sub-domains: Enterprise Performance Management (11 capabilities), Treasury Insight & Management (7 capabilities), and Financial Reporting (6 capabilities). You have deep expertise in Pakistan banking profitability analytics, SBP treasury regulations, KIBOR/FTP mechanics, Islamic profit-sharing economics, Basel III liquidity/capital requirements, and SBP statutory reporting. You understand UBL's FSDM-based Customer Profitability Engine.

---

## Source File

```
INPUT:  ./08_Finance_EPM_Treasury_Reporting.pptx  (58 slides)
OUTPUT: ./pptout/08_Finance_EPM_Treasury_Reporting_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 58 slides have full Teradata BVF content — 24 capability pairs (detail + maturity) plus overview/intro slides for each sub-domain. NO empty slides.

**Work required:**
1. Add Pakistan banking finance context (SBP, KIBOR, IFRS 9, AAOIFI, Basel III)
2. Add UBL Customer Profitability Engine context for profitability capabilities
3. Update maturity assessments for Pakistan reality
4. Map FSDM entities to each capability
5. Fix overflow, move detail to speaker notes
6. Add 3 new supplementary slides
7. Remove/replace all Teradata branding

---

## EXISTING SLIDE STRUCTURE (58 Slides)

### Sub-Domain 1: Enterprise Performance Management (Slides 1-22)

| Slide | Title | Type |
|-------|-------|------|
| 1 | Revenue Analytics | Capability Detail |
| 2 | Revenue Analytics | Maturity Table |
| 3 | GL, AP, HR, Expense Analytics & Optimisation | Capability Detail |
| 4 | GL, AP, HR, Expense Analytics & Optimisation | Maturity Table |
| 5 | Activity Based Costing | Capability Detail |
| 6 | Activity Based Costing | Maturity Table |
| 7 | Profitability Modelling | Capability Detail |
| 8 | Profitability Modelling | Maturity Table |
| 9 | Future / Lifetime Value | Capability Detail |
| 10 | Future / Lifetime Value | Maturity Table |
| 11 | Profitability Analytics and Optimisation | Capability Detail |
| 12 | Profitability Analytics and Optimisation | Maturity Table |
| 13 | Pricing Analysis & Optimisation | Capability Detail |
| 14 | Pricing Analysis & Optimisation | Maturity Table |
| 15 | Performance Management and KPIs | Capability Detail |
| 16 | Performance Management and KPIs | Maturity Table |
| 17 | Inventory Analytics | Capability Detail |
| 18 | Inventory Analytics | Maturity Table |
| 19 | Financial Budgeting, Planning & Forecasting | Capability Detail |
| 20 | Financial Budgeting, Planning & Forecasting | Maturity Table |
| 21 | Business Process Analytics & Optimisation | Capability Detail |
| 22 | Business Process Analytics & Optimisation | Maturity Table |

### Sub-Domain 2: Treasury Insight & Management (Slides 23-41)

| Slide | Title | Type |
|-------|-------|------|
| 23 | TREASURY MANAGEMENT | Section Title |
| 24 | Treasury Management — Challenges | Context |
| 25 | Treasury Management — Assessment | Context |
| 26 | Treasury Management — How | Context |
| 27 | Value of Treasury Management | Context |
| 28 | Cashflow Generation | Capability Detail |
| 29 | Cashflow Generation | Maturity Table |
| 30 | Liquidity Management | Capability Detail |
| 31 | Liquidity Management | Maturity Table |
| 32 | Capital Planning and Management | Capability Detail |
| 33 | Capital Planning and Management | Maturity Table |
| 34 | Asset & Liability Management | Capability Detail |
| 35 | Asset & Liability Management | Maturity Table |
| 36 | Funds Transfer Pricing | Capability Detail |
| 37 | Funds Transfer Pricing | Maturity Table |
| 38 | FX & Trading Book Management | Capability Detail |
| 39 | FX & Trading Book Management | Maturity Table |
| 40 | Interest (Risk) Rate Management | Capability Detail |
| 41 | Interest (Risk) Rate Management | Maturity Table |

### Sub-Domain 3: Financial Reporting (Slides 42-58)

| Slide | Title | Type |
|-------|-------|------|
| 42 | Financial Reporting | Section Overview |
| 43 | Financial Reporting — Challenges | Context |
| 44 | Financial Reporting — Assessment | Context |
| 45 | Financial Reporting — How | Context |
| 46 | Value of Financial Reporting | Context |
| 47 | Statutory Financial Reporting | Capability Detail |
| 48 | Statutory Financial Reporting | Maturity Table |
| 49 | Regulatory & Compliance Reporting | Capability Detail |
| 50 | Regulatory & Compliance Reporting | Maturity Table |
| 51 | Sales Reporting | Capability Detail |
| 52 | Sales Reporting | Maturity Table |
| 53 | Performance Reporting | Capability Detail |
| 54 | Performance Reporting | Maturity Table |
| 55 | Exception Reporting | Capability Detail |
| 56 | Exception Reporting | Maturity Table |
| 57 | Executive Dashboards | Capability Detail |
| 58 | Executive Dashboards | Maturity Table |

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"EPM, Treasury & Reporting — At a Glance"**

| | Global | South Asia & ME | Pakistan |
|---|---|---|---|
| Customer-level profitability | 70%+ of top banks | 30-40% | <15% (UBL is pioneer) |
| FTP engine (yield-curve) | 80% of large banks | 40-50% | ~30% (most use flat KIBOR) |
| Activity-based costing | 60% of large banks | 20-30% | <10% |
| Real-time treasury dashboard | 65% of large banks | 25-35% | <15% |
| ALM automation | 75% in EU/UK | 35-45% | 25-35% |
| Automated SBP statutory returns | N/A | N/A | <20% of banks |
| Executive dashboard (self-service) | Standard practice | 30-40% | <20% |

Info bar:
```
BVF Sub-capabilities: 11 EPM + 7 Treasury + 6 Reporting = 24
FSDM Entities: ~250+ (Financial Instrument, GL, Product, Party, Market Data, Regulatory)
BACR Questions: ~120 | Maturity Focus: Developing -> Innovating
```

### NEW Slide B: Pakistan Context (insert as slide 2)

**"Pakistan Banking — EPM, Treasury & Reporting Landscape"**

```
ENTERPRISE PERFORMANCE MANAGEMENT:
  Customer profitability: <15% of banks can calculate (UBL FSDM-based engine is industry-leading)
  Activity-based costing: <10% have formal ABC — cost allocation is formula-based or headcount-based
  Branch P&L: Not available at most banks — branches measured on deposits and advances only
  Pricing: Largely SBP rate-driven (KIBOR + spread) — limited analytical pricing optimization
  Budget cycle: 3-4 months manual process — no rolling forecasts

TREASURY INSIGHT & MANAGEMENT:
  SBP policy rate: 17.5% (reference period) — high rate environment drives treasury focus
  Government securities: PKR 10T+ held by banking sector (PIBs, T-Bills, Sukuk, Ijara)
  ADR constraint: SBP minimum ADR targets push banks to lend, reducing treasury portfolio flexibility
  FTP: Most banks use simplified KIBOR flat rate — few use yield-curve based matched-maturity FTP
  Liquidity: SBP LCR/NSFR requirements (Basel III) — RAAST real-time payments impact intraday liquidity
  Islamic treasury: Sukuk, Islamic interbank (IIBR), Bai Muajjal, Wakalah — parallel treasury desk

FINANCIAL REPORTING:
  SBP returns: 30+ statutory returns (weekly, monthly, quarterly, annual) — largely manual
  IFRS 9: ECL reporting mandated — data quality challenges remain
  Audit: Big 4 (Deloitte, EY, KPMG, PwC) + local firms — increasing granularity demands
  SECP: Listed bank quarterly/annual IFRS financial statements
  PSX: Stock exchange disclosure requirements for 15+ listed banks
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"EPM, Treasury & Reporting — Implementation Roadmap"**

```
Phase 1: Profitability Foundation (0-6 months)
  FTP engine implementation (KIBOR yield-curve based, matched-maturity)
  Activity-based costing framework (branch, ATM, digital, agent channels)
  Revenue analytics — NII and fee income decomposition by customer/product
  Automate top 5 SBP statutory returns from data warehouse
  Investment: PKR 80-150M | Quick Win: Branch-level NII visibility

Phase 2: Performance Intelligence (6-18 months)
  Customer profitability engine (extend UBL FSDM model across all dimensions)
  Branch P&L for all branches (NII, fees, costs, provisions, profit)
  Treasury dashboard (real-time portfolio, yield curve, liquidity position)
  ALM automation (repricing gap, duration analysis, stress scenarios)
  Automated budget vs. actual variance reporting
  Investment: PKR 150-300M | Expected: Identify PKR 10B+ in profitability optimization

Phase 3: Predictive Finance (18-36 months)
  Pricing optimization engine (KIBOR-based with risk-adjusted returns)
  Predictive budgeting and rolling forecasts (monthly refresh)
  Real-time liquidity management (RAAST/RTGS impact modeling)
  Islamic treasury analytics (Sukuk yield, profit-sharing optimization)
  Executive self-service dashboard with full drill-down
  Investment: PKR 200-400M | Expected: 15-25% improvement in capital allocation efficiency
```

---

## SLIDE-BY-SLIDE ENRICHMENT

### SUB-DOMAIN 1: ENTERPRISE PERFORMANCE MANAGEMENT (24 capabilities)

#### SLIDES 1-2: Revenue Analytics + Maturity

**Pakistan enrichment:**
- "Decompose Pakistan bank revenue into: Net Interest Income (NII — ~70% of total), fee and commission income (~15%), FX gains (~8%), dividend/investment income (~7%)"
- "Separate conventional revenue (interest-based) from Islamic revenue (profit-sharing, Murabaha margin, Ijarah rental) for banks with Islamic windows"
- "Analyze NII drivers: volume (deposit/advance growth), rate (KIBOR spread management), mix (CASA vs. term deposits)"
- "Track fee income by type: account maintenance, ATM/POS, RAAST/IBFT charges, LC/LG commissions, locker fees, remittance commissions"
- Data ADD: "KIBOR rates (1M, 3M, 6M, 12M), SBP policy rate changes, product-level interest rates, Islamic profit-sharing ratios, fee tariff schedules"

**Speaker Notes:**
```
PAKISTAN REVENUE STRUCTURE (typical large bank):
- Net Interest Income: 65-75% of total revenue
  - Spread on advances (KIBOR + 2-5% depending on risk)
  - Spread on investments (PIB yield minus deposit cost)
  - CASA benefit (zero/low cost deposits deployed at KIBOR+)
- Fee & Commission: 12-18%
  - Trade finance (LC, LG, SBLC) — major for corporate banks
  - Card fees (annual, interchange, late payment)
  - Transaction fees (RAAST/IBFT — under margin pressure)
  - Account maintenance and service charges
- FX Income: 5-10% (volatile, depends on PKR movement)
- Investment Income: 3-8% (dividends, capital gains on securities)

ISLAMIC REVENUE (different line items):
- Profit on financing (replaces interest on advances)
- Return on investments (replaces interest on investments)
- Ijarah rental income (operating/finance lease equivalent)
- Murabaha margin (cost-plus financing)
- Fee income (similar to conventional)
- NO interest income line permitted

FSDM: RVNU (Revenue), NII (Net Interest Income), FEE_INCM (Fee Income), FX_INCM (FX Income), INVST_INCM (Investment Income), PRDCT_RVNU (Product Revenue), CSTMR_RVNU (Customer Revenue)
```

---

#### SLIDES 3-4: GL, AP, HR, Expense Analytics & Optimisation + Maturity

**Pakistan enrichment:**
- "Analyze Pakistan bank cost structure: staff costs (40-50% of operating expense), occupancy (15-20%), IT (10-15%), depreciation (5-10%), other admin (15-25%)"
- "HR analytics: 50,000-100,000 employees at large banks — productivity metrics per employee, per branch"
- "AP analytics: vendor consolidation across 16,000+ branches, FBR WHT compliance on all vendor payments"
- "Track cost-to-income ratio (industry range 45-65%) — key SBP and analyst benchmark"

**Speaker Notes:**
```
PAKISTAN BANKING COST STRUCTURE:
| Cost Category | % of OpEx | Pakistan Context |
|---|---|---|
| Staff costs | 40-50% | 50-100K employees at large banks, annual increments 8-15% |
| Occupancy/rent | 15-20% | 16,000+ branches, rents rising in urban areas |
| IT & technology | 10-15% | Growing — digital transformation investments |
| Depreciation | 5-10% | Branch furniture, ATMs, IT equipment |
| Admin & other | 15-25% | Security (significant in Pakistan), stationery, travel, marketing |

Key expense analytics for Pakistan:
1. BRANCH COST: Per-branch operating cost (rent + staff + utilities + security) — varies 3-5x between metro and rural
2. CHANNEL COST: Cost per transaction by channel (branch PKR 150-300, ATM PKR 30-50, digital PKR 5-15)
3. HR PRODUCTIVITY: Revenue per employee, accounts per employee, advances per RM
4. VENDOR ANALYTICS: Procurement consolidation, FBR WHT tracking, vendor performance

FSDM: EXPNS (Expense), GL_ACCT (GL Account), CST_CNTR (Cost Center), EMPL (Employee), VNDR (Vendor), AP (Accounts Payable), OPEX (Operating Expense)
```

---

#### SLIDES 5-6: Activity Based Costing + Maturity — CRITICAL

**Pakistan enrichment:**
- "Build ABC model for Pakistan multi-channel banking: branch transaction cost, ATM cost, mobile app cost, internet banking cost, contact center cost, agent network cost"
- "Calculate true cost-to-serve per customer — most Pakistan banks allocate costs by headcount or formula, not activity"
- "ABC is prerequisite for: customer profitability, product profitability, channel migration business case, branch rationalization"
- Data ADD: "Transaction volumes by channel from FSDM, staff time studies (branch, ops center), IT infrastructure costs allocated by usage, branch-level cost data"

**Speaker Notes:**
```
PAKISTAN ABC CONTEXT:
Almost no Pakistan bank has formal Activity Based Costing. Costs are allocated using:
- Headcount ratios (most common — crude)
- Revenue splits (circular — uses output to allocate input)
- Flat formulas (e.g., 10% of total cost to each business line)

Why ABC matters for Pakistan banking:
1. BRANCH vs. DIGITAL: Branch transaction costs PKR 150-300 vs. digital PKR 5-15 — but without ABC this isn't quantified
2. CUSTOMER PROFITABILITY: Cannot calculate without knowing cost-to-serve
3. PRODUCT PROFITABILITY: Cross-subsidies between products are hidden
4. CHANNEL MIGRATION: Cannot build business case for digital migration without ABC baseline
5. BRANCH RATIONALIZATION: Cannot identify unprofitable branches without activity-based cost allocation

ABC implementation approach for Pakistan:
- Phase 1: Define 20-30 key activities (account opening, cash deposit, fund transfer, loan origination, card issuance, complaint resolution)
- Phase 2: Map activities to resources (staff time, IT cost, premises)
- Phase 3: Calculate unit costs per activity per channel
- Phase 4: Allocate to customers based on actual activity volumes from FSDM

UBL Context: FSDM captures transaction volumes by customer, product, channel, and branch — providing the activity driver data needed for ABC. The Customer Profitability Engine can consume ABC unit costs to calculate accurate cost-to-serve.

FSDM: ACTVTY (Activity), ACTVTY_CST (Activity Cost), CST_DRVR (Cost Driver), CST_ALLCTN (Cost Allocation), UNT_CST (Unit Cost), CHNL_CST (Channel Cost)
```

---

#### SLIDES 7-8: Profitability Modelling + Maturity — MOST CRITICAL

**Pakistan enrichment:**
- "Build multi-dimensional profitability model delivering full P&L at: Customer, Product, Branch, Segment, Channel, Region levels"
- "Profitability model must handle BOTH conventional (interest-based) and Islamic (profit-sharing) economics in single framework"
- "Components: FTP-adjusted NII + fee income - direct costs - ABC-allocated costs - IFRS 9 provision charge - capital charge = economic profit"
- "This is the CORE of UBL's Customer Profitability Engine on FSDM star schema"
- Data ADD: "FSDM star schema: all customer, product, account, transaction, balance, rate, cost, and provision data integrated at individual customer level"

**Speaker Notes:**
```
PAKISTAN PROFITABILITY MODELLING — UBL CONTEXT:
This is the most strategically important capability for Pakistan banks and UBL's core competitive advantage through the FSDM-based Customer Profitability Engine.

PROFITABILITY P&L STRUCTURE:
Line 1: GROSS INTEREST INCOME (actual interest earned on advances, investments)
Line 2: - INTEREST EXPENSE (actual interest paid on deposits)
Line 3: = NET INTEREST INCOME (NII)
Line 4: +/- FTP ADJUSTMENT (matched-maturity funds transfer pricing)
Line 5: = FTP-ADJUSTED NII
Line 6: + FEE & COMMISSION INCOME
Line 7: + OTHER INCOME (FX, trading, dividends)
Line 8: = TOTAL INCOME
Line 9: - DIRECT COSTS (attributable to entity)
Line 10: - ALLOCATED COSTS (ABC-based allocation)
Line 11: = OPERATING PROFIT
Line 12: - PROVISION CHARGE (IFRS 9 ECL)
Line 13: = PROFIT BEFORE TAX
Line 14: - CAPITAL CHARGE (cost of equity allocated)
Line 15: = ECONOMIC PROFIT / EVA

DIMENSIONS (each line calculated at):
- CUSTOMER: Individual customer profitability (60M+ customers)
- PRODUCT: Each product type (CASA, term deposit, personal loan, credit card, etc.)
- BRANCH: Each of 16,000+ branches
- SEGMENT: Corporate, Commercial, Retail, Treasury, Islamic, Digital
- CHANNEL: Branch, ATM, Digital, Contact Center, Agent
- REGION: Province, City, Area

ISLAMIC PROFITABILITY:
Different line items but same structure:
- "Profit on financing" replaces "interest on advances"
- "Return to depositors" replaces "interest on deposits"
- FTP equivalent uses Islamic interbank rate or Mudaraba sharing ratio
- Takaful provisions replace conventional insurance provisions

FSDM: PRFTBLTY (Profitability), CSTMR_PRFT (Customer Profit), PRDCT_PRFT (Product Profit), BRCH_PRFT (Branch Profit), FTP (Funds Transfer Pricing), NII (Net Interest Income), FEE_INCM (Fee Income), CST_ALLCTN (Cost Allocation), ECL (Expected Credit Loss), EVA (Economic Value Added)
```

---

#### SLIDES 9-10: Future / Lifetime Value + Maturity

**Pakistan enrichment:**
- "Calculate Customer Lifetime Value (CLTV) incorporating: current profitability, residual value of existing products, expected future product adoption, expected retention probability"
- "Pakistan-specific: CLTV must factor in high attrition risk from fintech competition and salary account switching"
- "CLTV informs: retention spend allocation, acquisition targeting (acquire customers with high predicted LTV), pricing decisions"

**Speaker Notes:**
```
PAKISTAN CLTV COMPONENTS:
1. CURRENT PROFITABILITY: From Customer Profitability Engine (FTP-adjusted NII + fees - costs - provisions)
2. RESIDUAL VALUE: Expected remaining revenue from existing products (e.g., remaining loan tenure, FD maturity schedule)
3. FUTURE VALUE: Expected value from products customer is likely to adopt (propensity models)
4. RETENTION PROBABILITY: Likelihood of remaining active (1 - churn probability)

CLTV = Sum over time periods of: (Current Profit + Residual + Future Value) * Retention Prob * Discount Factor

Pakistan challenges:
- Short product tenures (most deposits are 1-3 year FDs, personal loans 1-5 years)
- High churn risk (fintech competition, salary account switching, rate shopping)
- Limited historical data for predictive models at most banks
- Islamic products have different tenure/profit profiles

FSDM: CLTV (Customer Lifetime Value), CRNT_PRFT (Current Profitability), RSDL_VALU (Residual Value), FTR_VALU (Future Value), RTNTN_PROB (Retention Probability), PRPNSTY (Propensity)
```

---

#### SLIDES 11-12: Profitability Analytics and Optimisation + Maturity

**Pakistan enrichment:**
- "Analyze profitability drivers and identify optimization opportunities across customer, product, branch, and channel dimensions"
- "Key Pakistan optimization levers: CASA mix improvement (reduce cost of funds), digital migration (reduce cost-to-serve), cross-sell (increase revenue per customer), pricing optimization (risk-adjusted spreads)"
- "Target: move bottom 20% of unprofitable customers to breakeven through product/channel migration or repricing"

**Speaker Notes:**
```
PAKISTAN PROFITABILITY OPTIMIZATION OPPORTUNITIES:
1. CASA MIX: Every 1% shift from term deposits to CASA saves ~PKR 2-3B in cost of funds for large bank
2. DIGITAL MIGRATION: Moving 10% of branch transactions to digital saves PKR 1-2B annually
3. CROSS-SELL: Increasing products/customer from 1.8 to 2.5 increases revenue 25-35%
4. PRICING: Risk-adjusted pricing on personal loans can improve NIM by 20-50bps
5. BRANCH RATIONALIZATION: Bottom 10% of branches may be unprofitable — merge or convert to digital-assisted

FSDM: PRFT_DRVR (Profitability Driver), PRFT_OPTMZTN (Profit Optimization), SCNRO (Scenario), WHT_IF (What-If Analysis), CST_BNFT (Cost Benefit)
```

---

#### SLIDES 13-14: Pricing Analysis & Optimisation + Maturity

**Pakistan enrichment:**
- "Pakistan lending pricing: KIBOR + risk premium (2-8% depending on segment and risk rating)"
- "Deposit pricing: SBP minimum deposit rate (currently linked to policy rate) + competition-driven premium for large deposits"
- "Islamic pricing: Murabaha margin, Ijarah rental rate, Musharaka sharing ratio — must be competitive with conventional while Shariah-compliant"
- "Pricing optimization must consider: ECIB credit score, customer relationship value, product bundling discounts, competitive rates"

**Speaker Notes:**
```
PAKISTAN PRICING FRAMEWORK:
LENDING:
- Corporate: KIBOR + 1-3% (relationship-based, negotiated)
- Commercial: KIBOR + 2-4% (semi-standardized)
- SME: KIBOR + 4-6% (higher risk premium)
- Consumer: KIBOR + 5-8% (personal loans, auto)
- Credit cards: 3.5% per month (annual ~42%) — SBP cap discussions ongoing
- Microfinance: Higher rates, SBP allows flexible pricing

DEPOSITS:
- Current accounts: Zero interest (100% margin for bank)
- Savings: SBP minimum rate (linked to policy rate, currently ~11-13%)
- Fixed deposits: Negotiated — large deposits get KIBOR-linked rates
- Islamic deposits: Weightage-based profit sharing — actual return depends on bank performance

PRICING ANALYTICS NEEDED:
1. Price elasticity: How much volume changes with 25bps rate change
2. Competitive positioning: Where are we vs. top 5 competitors by product
3. Risk-adjusted return: Does the rate cover cost of funds + operating cost + expected loss + capital charge?
4. Customer-level pricing: Should high-value customers get preferential rates?

FSDM: PRCNG (Pricing), INT_RT (Interest Rate), SPRD (Spread), KIBOR (KIBOR Rate), MRGN (Margin), PRCNG_MDL (Pricing Model), RT_ELSTCTY (Rate Elasticity)
```

---

#### SLIDES 15-16: Performance Management and KPIs + Maturity

**Pakistan enrichment:**
- "Define Pakistan banking KPI framework: ROE (target >20%), ROA (>1.5%), NIM, Cost-to-Income (<50%), NPL ratio, CASA ratio, CAR (>11.5%), ADR"
- "Cascade KPIs from bank level to business line to branch to individual RM — currently most banks only track top-level KPIs"
- "Include Islamic banking KPIs: profit-sharing ratio competitiveness, Islamic asset quality, Shariah compliance score"

**Speaker Notes:**
```
PAKISTAN BANKING KPI FRAMEWORK:
| KPI | Formula | Industry Benchmark | Target |
|---|---|---|---|
| ROE | Net Profit / Equity | 20-30% (top banks) | >20% |
| ROA | Net Profit / Total Assets | 1.0-2.0% | >1.5% |
| NIM | (Interest Income - Interest Expense) / Earning Assets | 3-5% | >4% |
| Cost-to-Income | OpEx / Total Income | 45-65% | <50% |
| NPL Ratio | NPLs / Gross Advances | 5-10% | <7% |
| CASA Ratio | CASA / Total Deposits | 40-55% | >50% |
| CAR | Capital / RWA | 13-20% | >15% |
| ADR | Advances / Deposits | 45-55% | SBP targets vary |
| Fee Ratio | Fee Income / Total Income | 12-18% | >15% |
| Products/Customer | Total products / Active customers | 1.8 | >2.5 |

FSDM: KPI (Key Performance Indicator), PRFMNC (Performance), TRGTS (Target), ACTLS (Actuals), VRNS (Variance), SCRCRD (Scorecard)
```

---

#### SLIDES 17-18: Inventory Analytics + Maturity

**Pakistan enrichment:**
- "Adapt for banking: 'Inventory' means physical stock managed by banks — cheque books, debit/credit cards (unissued), ATM cash, branch cash, stationery, IT equipment"
- "ATM cash optimization: PKR 500B+ held across 16,000+ ATMs — optimize replenishment to reduce idle cash while avoiding stockouts"
- "Card inventory: manage production, distribution, and activation pipeline for 30M+ debit cards and 3M+ credit cards"

**Speaker Notes:**
```
PAKISTAN BANKING INVENTORY:
1. ATM CASH: PKR 500B+ across 16,000 ATMs. Optimization can free PKR 50-100B in working capital.
2. BRANCH CASH: Daily cash requirements vary by branch location, day of week, month-end, Eid season
3. CARD STOCK: Unissued debit/credit cards, PIN mailers, welcome kits
4. CHEQUE BOOKS: Still significant in Pakistan — production, distribution, clearing
5. STATIONERY: Branch forms, deposit slips, loan documentation
6. IT EQUIPMENT: ATMs, POS terminals, branch hardware, data center equipment

FSDM: INVNTRY (Inventory), CSH_MGMT (Cash Management), ATM_RPLNSH (ATM Replenishment), CRD_INVNTRY (Card Inventory)
```

---

#### SLIDES 19-20: Financial Budgeting, Planning & Forecasting + Maturity

**Pakistan enrichment:**
- "Pakistan bank budget cycle: 3-4 months (Sep-Dec for Jan-Dec fiscal year) — target: reduce to 4-6 weeks with rolling forecasts"
- "Budget must separately plan conventional and Islamic business lines"
- "Forecasting challenge: SBP policy rate changes (can shift 200-300bps in single meeting) dramatically impact NII forecast"
- "Rolling forecast: update quarterly with KIBOR outlook, deposit growth, advance growth, provision assumptions"

**Speaker Notes:**
```
PAKISTAN BUDGET & PLANNING:
Current state at most Pakistan banks:
- Budget cycle: 3-4 months (starts Sep, finalized Dec)
- Process: Branch-level targets set by head office, negotiated with regions
- Tools: Excel-based (90%+ of banks), limited use of dedicated EPM tools
- Granularity: Business line level, some branch-level deposit/advance targets
- Frequency: Annual budget with mid-year review (no rolling forecast)

Target state:
- Budget cycle: 4-6 weeks with automated bottom-up data
- Rolling forecast: Monthly or quarterly refresh
- Scenario planning: What-if on KIBOR changes, deposit growth, NPL scenarios
- Branch-level: Full P&L budget for each branch
- Automated variance analysis: Budget vs. actual with drill-down

Key variables in Pakistan banking budget:
1. SBP policy rate (drives NII — 200bps change = PKR 5-10B NII impact for large bank)
2. Deposit growth (8-15% YoY)
3. Advance growth (10-20% YoY, depends on SBP ADR guidance)
4. IFRS 9 provision charge (volatile — depends on macro scenarios)
5. Operating expenses (inflation 15-25% drives salary and occupancy increases)

FSDM: BDGT (Budget), FRCST (Forecast), PLNNG (Planning), VRNS (Variance), SCNRO (Scenario), ASMPTN (Assumption)
```

---

#### SLIDES 21-22: Business Process Analytics & Optimisation + Maturity

**Pakistan enrichment:**
- "Optimize end-to-end banking processes: account opening (7-14 days to <1 day), loan origination (21-45 days to <7 days), complaint resolution (30 days to <7 days)"
- "Process mining on core banking system logs to identify bottlenecks"
- "SBP Consumer Protection SLAs drive complaint process optimization"

---

### SUB-DOMAIN 2: TREASURY INSIGHT & MANAGEMENT

#### Slides 23-27: Treasury Overview

**Enrichment for overview slides:**

**Slide 23-24 (Title/Challenges) — Add:**
- "Pakistan bank treasury manages PKR 10T+ in government securities, FX positions, money market instruments, and derivatives"
- "SBP constraints: Open FX position limits, SLR requirements, CRR requirements, interbank exposure limits"
- "Islamic treasury: parallel desk managing Sukuk, Islamic interbank (Bai Muajjal, Wakalah), and Shariah-compliant investments"

**Slide 25-26 (Assessment/How) — Add Pakistan questions:**
- "Can you calculate intraday liquidity position incorporating RAAST real-time settlement impact?"
- "Can you produce matched-maturity FTP rates using KIBOR yield curve?"
- "Can you run ALM stress scenarios per SBP ICAAP requirements?"

---

#### SLIDES 28-29: Cashflow Generation + Maturity

**Pakistan enrichment:**
- "Forecast PKR and FCY cashflows for: deposit maturities, loan repayments, government security maturities, SBP CRR/SLR requirements, dividend payments, tax payments"
- "Incorporate RAAST real-time payment impact on intraday cashflow — RAAST is settlement-final, immediately impacting position"
- "Model seasonal cashflows: Eid spending spikes, Ramadan charity outflows, June/December tax payment quarters, agricultural credit cycles"

**Speaker Notes:**
```
PAKISTAN CASHFLOW MANAGEMENT:
Critical cashflow events for Pakistan banks:
1. DEPOSIT MATURITIES: PKR billions in FDs mature daily — renewal rate tracking essential
2. GOVERNMENT SECURITIES: PIB coupon dates, T-Bill maturity, Sukuk periodic distributions
3. SBP REQUIREMENTS: CRR (5% of demand + time deposits in cash with SBP), SLR (varying requirements)
4. RAAST: Real-time settlement creates intraday liquidity volatility — PKR 50B+ daily volume
5. NIFT/CLEARING: Cheque clearing settlement (still significant in Pakistan)
6. TAX PAYMENTS: Quarterly advance tax, annual final tax — large outflows on due dates
7. SEASONAL: Eid cash demand (branches need 2-3x normal cash), agricultural disbursement/repayment cycles

FSDM: CSHFLW (Cashflow), CSHFLW_FRCST (Cashflow Forecast), MTRTY (Maturity), RPLMT (Repayment), STLMNT (Settlement), CRR (Cash Reserve Ratio), SLR (Statutory Liquidity Ratio)
```

---

#### SLIDES 30-31: Liquidity Management + Maturity

**Pakistan enrichment:**
- "Comply with SBP Basel III liquidity requirements: LCR (min 100%), NSFR (min 100%), intraday liquidity monitoring"
- "Manage HQLA (High Quality Liquid Assets): PIBs, T-Bills, SBP repo facility, cash with SBP"
- "RAAST real-time settlement changes liquidity dynamics — need intraday monitoring capability"
- "Stress testing: SBP requires bank-specific and system-wide liquidity stress scenarios"

**Speaker Notes:**
```
PAKISTAN LIQUIDITY FRAMEWORK:
SBP Basel III liquidity requirements:
- LCR: Min 100% — HQLA / Net cash outflows over 30 days. Pakistan banks generally well above (130-200%) due to heavy government securities holdings.
- NSFR: Min 100% — Available stable funding / Required stable funding
- Intraday liquidity: SBP monitoring of real-time settlement positions (RTGS + RAAST)

HQLA composition for Pakistan banks:
- Level 1: Cash + SBP balances + PIBs + T-Bills (0% haircut)
- Level 2A: Rated corporate bonds (15% haircut) — limited market in Pakistan
- Level 2B: Lower-rated securities (50% haircut) — very limited

Challenge: Pakistan banks have high LCR (150%+) but this is driven by heavy government securities investment, not genuine liquidity management capability.

FSDM: LQDTY (Liquidity), LCR (Liquidity Coverage Ratio), NSFR (Net Stable Funding Ratio), HQLA (High Quality Liquid Assets), CSHFLW_STRSS (Cashflow Stress), INTRA_DAY (Intraday Liquidity)
```

---

#### SLIDES 32-33: Capital Planning and Management + Maturity

**Pakistan enrichment:**
- "Comply with SBP minimum CAR: 11.5% total (8.5% Tier 1, including 6% CET1) + capital conservation buffer 2.5% = effectively 14%"
- "ICAAP (Internal Capital Adequacy Assessment Process): SBP requires annual submission with stress testing"
- "Capital allocation to business lines for RAROC (Risk-Adjusted Return on Capital) calculation"
- "Pakistan-specific: SBP minimum paid-up capital requirements periodically increased — last increase to PKR 10B"

**Speaker Notes:**
```
PAKISTAN CAPITAL FRAMEWORK:
SBP Basel III capital requirements:
- CET1: Minimum 6.0%
- Tier 1: Minimum 8.5%
- Total CAR: Minimum 11.5%
- Capital Conservation Buffer: 2.5%
- D-SIB surcharge: Additional 1-2% for systemically important banks
- Effective minimum for large banks: 14-16%

ICAAP requirements:
- Annual submission to SBP
- Stress scenarios: GDP decline, PKR depreciation, interest rate shock, credit quality deterioration
- Must demonstrate capital adequacy under stress for 3-year forward period
- Internal capital allocation to business lines based on RWA consumption

Capital planning analytics needed:
1. RWA optimization: Where can RWA be reduced without revenue impact?
2. Capital allocation: Which business lines earn above cost of capital?
3. RAROC: Risk-Adjusted Return on Capital at customer/product/segment level
4. Dividend planning: SBP requires approval for dividends if CAR is marginal
5. Growth planning: Capital needed to support target asset growth

FSDM: CPTL (Capital), CAR (Capital Adequacy Ratio), RWA (Risk Weighted Assets), RAROC (Risk-Adjusted Return on Capital), CET1 (Common Equity Tier 1), ICAAP (Internal Capital Adequacy Assessment Process)
```

---

#### SLIDES 34-35: Asset & Liability Management + Maturity

**Pakistan enrichment:**
- "Manage interest rate risk in banking book per SBP guidelines (based on Basel IRRBB)"
- "Repricing gap analysis: Pakistan banks have significant repricing mismatch — floating rate advances (KIBOR-linked) vs. fixed rate deposits (3M-1Y FDs)"
- "Duration analysis for government securities portfolio (PKR 10T+ — duration risk is major exposure)"
- "Islamic ALM: Mudaraba deposits have variable profit sharing — different risk profile than fixed-rate conventional deposits"

**Speaker Notes:**
```
PAKISTAN ALM CONTEXT:
Typical Pakistan bank balance sheet structure:
ASSETS: Government securities 40-50%, Advances 40-50%, Cash/SBP balances 5-10%
LIABILITIES: Deposits 80-85% (CASA 47%, Term 53%), Borrowings 5-10%, Equity 8-12%

ALM challenges:
1. REPRICING MISMATCH: Advances are KIBOR-linked (reprice with each rate change) but deposits are fixed for 3-12 months. When SBP cuts rate, NII benefits temporarily as advances reprice down slower than deposit repricing.
2. DURATION RISK: PKR 10T+ in PIBs (3-30 year tenor) creates significant duration exposure. A 100bps rate increase can reduce AFS portfolio value by 2-5%.
3. ISLAMIC ALM: Islamic deposits share profits (variable) while Islamic financing is often fixed-margin — different risk dynamics.
4. FX MISMATCH: USD deposits vs. PKR assets (or vice versa) creates FX-ALM risk.

SBP requirements:
- Quarterly repricing gap report submission
- IRRBB stress testing per SBP guidelines
- Earnings sensitivity (NII impact of +/-200bps rate shock)
- Economic value sensitivity (EVE impact)

FSDM: ALM (Asset Liability Management), RPRCE_GAP (Repricing Gap), DRTN (Duration), IRRBB (Interest Rate Risk Banking Book), EVE (Economic Value of Equity), NII_SNSTVTY (NII Sensitivity)
```

---

#### SLIDES 36-37: Funds Transfer Pricing + Maturity — CRITICAL FOR PROFITABILITY

**Pakistan enrichment:**
- "Implement matched-maturity FTP using KIBOR yield curve (1M, 3M, 6M, 12M KIBOR plus interpolation)"
- "FTP is the foundation for customer and product profitability — without FTP, NII cannot be accurately attributed to products/customers"
- "Current Pakistan reality: Most banks use single-rate FTP (KIBOR 6M flat rate) — significantly distorts profitability"
- "Islamic FTP: Use Islamic interbank rate or internal benchmark based on Mudaraba pool return"

**Speaker Notes:**
```
PAKISTAN FTP CONTEXT:
FTP is the SINGLE MOST IMPACTFUL capability for Pakistan bank profitability analysis.

Current state: Most Pakistan banks use simplified FTP:
- Single KIBOR rate (6M or 12M) applied to all products
- No matched-maturity — a 5-year PIB gets same FTP as 3-month T-Bill
- CASA gets full KIBOR benefit — overstates deposit-gathering branch profitability
- Result: profitability numbers are misleading, cannot make informed decisions

Target state: Matched-Maturity FTP:
- Each product/contract gets FTP rate based on its specific maturity/repricing profile
- KIBOR yield curve interpolation for exact tenor matching
- CASA modeled with behavioral maturity (e.g., 70% core CASA treated as 1-3 year, 30% volatile treated as overnight)
- Credit spread separated from funding spread for true risk pricing

Impact of getting FTP right:
- Branch A that gathers low-cost CASA but deploys into short-term lending: TRUE profitability revealed (may be lower than thought if CASA behavioral maturity is long)
- Branch B that raises expensive term deposits but originates long-term home loans: TRUE profitability revealed (may be higher than thought due to positive maturity transformation)
- Product-level: Credit cards (short-term revolving) vs. home finance (long-term fixed) have very different FTP-adjusted margins

UBL FSDM Context: The Customer Profitability Engine uses FTP-adjusted NII as the core revenue component. FSDM star schema stores FTP rate at account level, enabling accurate multi-dimensional profitability.

FSDM: FTP (Funds Transfer Pricing), FTP_RT (FTP Rate), KIBOR (KIBOR Rate), YLD_CRV (Yield Curve), MTCHD_MTRTY (Matched Maturity), BHVRL_MTRTY (Behavioral Maturity), CSA_MDL (CASA Model)
```

---

#### SLIDES 38-39: FX & Trading Book Management + Maturity

**Pakistan enrichment:**
- "Manage PKR/USD, PKR/GBP, PKR/EUR, PKR/AED positions for trade finance and remittance operations"
- "SBP limits open FX positions — banks must monitor continuously"
- "Remittance flows: USD 30B+/year inward (major FX supply), trade flows drive FX demand"
- "Trading book: government securities trading, FX derivatives (limited market in Pakistan), money market"

**Speaker Notes:**
```
PAKISTAN FX & TRADING:
FX exposure sources:
- Trade finance: LC/LG in USD, EUR, GBP, CNY — Pakistan's annual imports ~$60B
- Remittances: $30B+/year inward (Gulf, UK, US) — banks earn FX spread
- Treasury trading: Proprietary FX positions within SBP limits
- Customer FX: Forward contracts, FX deposits

SBP open position limit: Net open position must not exceed prescribed % of capital.
PKR volatility: Significant devaluation episodes (2018, 2022-23) — FX risk management critical.

Trading book:
- Government securities trading (PIBs, T-Bills) — major revenue source
- Money market: Call money, repo/reverse repo, T-Bill discounting
- Limited derivatives market in Pakistan (no liquid interest rate swap market)

FSDM: FX_PSITN (FX Position), TRDNG_BK (Trading Book), SCRTY_TRDNG (Security Trading), FX_RT (FX Rate), DRV (Derivative), MNY_MKT (Money Market)
```

---

#### SLIDES 40-41: Interest (Risk) Rate Management + Maturity

**Pakistan enrichment:**
- "Manage interest rate risk in a high-rate environment (SBP policy rate 17.5%) with significant rate volatility"
- "SBP Monetary Policy Committee meets 6-8 times/year — each decision can move rates 100-300bps"
- "Model NII sensitivity to rate changes: +/-100bps, +/-200bps scenarios per SBP IRRBB requirements"
- "Islamic rate risk: Mudaraba deposits and Musharaka financing have variable profit-sharing — different rate risk profile"

**Speaker Notes:**
```
PAKISTAN INTEREST RATE ENVIRONMENT:
- SBP policy rate: 17.5% (reference period) — among highest globally
- KIBOR 6M: ~18% (closely tracks policy rate)
- Rate volatility: SBP changed rate by 1500bps+ in 2022-2023 cycle
- Impact: 100bps change in rates = PKR 5-10B NII impact for large bank

Rate risk management:
1. REPRICING RISK: Mismatch between asset and liability repricing dates
2. YIELD CURVE RISK: Non-parallel shifts in KIBOR curve
3. BASIS RISK: KIBOR vs. deposit rate — not perfectly correlated
4. OPTIONALITY: Prepayment of loans, early withdrawal of FDs

FSDM: INT_RT_RSK (Interest Rate Risk), IRRBB (IRRBB), NII_SNSTVTY (NII Sensitivity), EVE_SNSTVTY (EVE Sensitivity), RT_SHCK (Rate Shock), GAP (Gap Analysis)
```

---

### SUB-DOMAIN 3: FINANCIAL REPORTING

#### Slides 42-46: Reporting Overview

**Enrichment:**
- "Pakistan banks produce 30+ SBP statutory returns — largely manual process consuming significant finance team bandwidth"
- "IFRS 9 has added ECL reporting requirements — quarterly Note 10 disclosure with Stage 1/2/3 movement analysis"
- "SECP requires quarterly and annual consolidated IFRS financial statements for listed banking groups"
- "PSX (Pakistan Stock Exchange) requires timely disclosure for 15+ listed bank stocks"
- "External auditors increasingly demand granular data access — data warehouse enables faster audit process"

---

#### SLIDES 47-48: Statutory Financial Reporting + Maturity

**Pakistan enrichment:**
- "Produce IFRS-compliant quarterly and annual financial statements per SBP/SECP/IFRS requirements"
- "Generate balance sheet, P&L, cashflow statement, statement of changes in equity, and all IFRS notes from integrated data warehouse"
- "Dual reporting for Islamic banking: IFRS financial statements + AAOIFI-compliant supplementary disclosures"
- Data ADD: "FSDM: all GL, sub-ledger, customer, product, transaction data at granular level with full audit trail"

---

#### SLIDES 49-50: Regulatory & Compliance Reporting + Maturity

**Pakistan enrichment:**
- "Automate SBP statutory returns: WSP (weekly), MSA (monthly), QFS (quarterly), annual audited"
- "IFRS 9 ECL reporting: Stage movement analysis, sector-wise provision, forward-looking macroeconomic scenarios"
- "Basel III reports: Capital adequacy (CAR), LCR, NSFR, leverage ratio, large exposure framework"
- "AML/CFT: STR filing data, CTR reporting, sanctions screening results"
- "SBP green banking: Environmental lending disclosures (emerging requirement)"

**Speaker Notes:**
```
KEY SBP STATUTORY RETURNS:
| Return | Frequency | Content |
|---|---|---|
| WSP | Weekly | Statement of Position (assets, liabilities, equity) |
| MSA | Monthly | Statement of Affairs (detailed balance sheet) |
| QFS | Quarterly | Condensed IFRS financial statements |
| Annual | Annual | Audited financial statements + regulatory returns |
| Capital Adequacy | Quarterly | CAR, RWA by category, capital composition |
| LCR/NSFR | Monthly/Quarterly | Liquidity ratios per Basel III |
| LEF | Quarterly | Large Exposure Framework |
| ECIB | Monthly | Credit bureau reporting — individual loan level |
| STR | As needed | Suspicious Transaction Reports (AML/CFT) |
| CTR | Monthly | Currency Transaction Reports |

Current state: Most returns are prepared manually from GL extracts + Excel.
Target state: All returns generated automatically from FSDM-based data warehouse with audit trail.

FSDM: RGLTY_RPT (Regulatory Report), SBP_RTRN (SBP Return), IFRS_DSCLSR (IFRS Disclosure), BSL_RPT (Basel Report), ECL_RPT (ECL Report), AML_RPT (AML Report)
```

---

#### SLIDES 51-52: Sales Reporting + Maturity

**Pakistan enrichment:**
- "Track banking product sales: new accounts opened, loans originated, cards issued, insurance sold (bancassurance), investments sold, trade finance volumes"
- "Sales by channel: branch, digital, agent, RM direct, employer partnership"
- "Sales against targets: branch-level and RM-level target tracking is manual at most banks"

---

#### SLIDES 53-54: Performance Reporting + Maturity

**Pakistan enrichment:**
- "Bank-wide performance scorecard: financial KPIs (ROE, ROA, NIM, C/I ratio, NPL) + operational KPIs (customer count, products/customer, digital adoption, SBP compliance)"
- "Business line performance: Corporate, Commercial, Retail, Treasury, Islamic — each with specific KPI set"
- "Branch scorecard: deposits, advances, CASA ratio, fee income, cost-to-income, customer count, digital migration"

---

#### SLIDES 55-56: Exception Reporting + Maturity

**Pakistan enrichment:**
- "Automate exception detection for: SBP limit breaches (FX position, large exposure), IFRS 9 stage migration triggers, AML threshold alerts, budget variance thresholds"
- "Workflow-based exception handling with SBP reporting timelines"

---

#### SLIDES 57-58: Executive Dashboards + Maturity

**Pakistan enrichment:**
- "Build CEO/CFO dashboard with drill-down: bank P&L -> business line -> region -> branch -> customer"
- "Real-time treasury position: government securities portfolio, FX position, money market, liquidity ratios"
- "Risk dashboard: NPL trends, IFRS 9 ECL movement, capital adequacy, top 20 exposures"
- "Include Islamic banking performance panel for banks with Islamic windows"

**Speaker Notes:**
```
PAKISTAN EXECUTIVE DASHBOARD COMPONENTS:
1. FINANCIAL PERFORMANCE: P&L (MTD/QTD/YTD), ROE, ROA, NIM, budget vs. actual
2. BALANCE SHEET: Deposits, advances, investments, capital position
3. PROFITABILITY: Top/bottom branches, top/bottom products, customer profitability distribution
4. RISK: NPL ratio, ECL coverage, stage migration, top 10 exposures
5. TREASURY: Government securities portfolio (duration, yield), FX position, LCR/NSFR
6. OPERATIONS: Branch productivity, digital adoption rate, customer growth
7. REGULATORY: SBP return status, CAR, compliance metrics
8. ISLAMIC: Islamic banking assets, financing portfolio, deposit pool return

Current state: Most Pakistan bank CEOs receive monthly paper-based MIS pack prepared over 2-3 weeks.
Target state: Real-time self-service dashboard with drill-down to transaction level.

FSDM: DSHBRD (Dashboard), KPI (KPI), PRFMNC_RPT (Performance Report), EXCTVL_RPT (Executive Report), DRILL_DWN (Drill-Down), VSULZTN (Visualization)
```

---

## TERADATA BRANDING REMOVAL

Apply standard removal rules to all 58 slides (same as Files 03-07).

## CONTENT DENSITY RULES

Same as all previous files. Condense on slide, full detail in speaker notes.

## FINAL OUTPUT (61+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Domain Dashboard** | **NEW** |
| **2** | **Pakistan EPM/Treasury/Reporting Context** | **NEW** |
| 3-24 | EPM — 11 capabilities (22 slides) | Enriched |
| 25-43 | Treasury — overview + 7 capabilities (19 slides) | Enriched |
| 44-60 | Reporting — overview + 6 capabilities (17 slides) | Enriched |
| **61** | **Implementation Roadmap** | **NEW** |

## VISUAL QA CHECKLIST

```
No text overflow in any table cell
Font >= 10pt everywhere
No Teradata branding
Pakistan context on every capability slide
Speaker notes with SBP/KIBOR/IFRS 9/AAOIFI/Basel III/FSDM references
UBL Profitability Engine context on profitability-related slides
3 new slides present
Maturity tables updated for Pakistan
Islamic banking context included where relevant
All H1 2018 updated to H1 2025 — H2 2026
```
