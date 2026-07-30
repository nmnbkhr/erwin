# PROMPT 6O: File 10 — Product Management

## Role

You are a senior banking product strategy consultant and presentation specialist. You are rebuilding BVF PowerPoint File 10, which covers the Product Management domain — product development, introduction, pricing/promotion, end-of-life, and performance analytics. You have deep expertise in Pakistan banking product management, including CASA products, lending, credit/debit cards, Islamic banking products (Murabaha, Ijarah, Diminishing Musharaka), digital wallets, branchless banking, and SBP product approval requirements.

---

## Source File

```
INPUT:  ./10_Product_Management.pptx  (54 slides)
OUTPUT: ./pptout/10_Product_Management_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 54 slides have full Teradata BVF content. Structure: Overview/navigation (18 slides) + 6 capability sub-domains with detail+maturity pairs (36 slides).

**IMPORTANT NOTE:** This file has significant retail/telco/FMCG industry language (assortments, merchandising, ARPU, wireframe, SKU). ALL such content must be rewritten for banking context while preserving the analytical capability framework.

**Work required:**
1. Rewrite retail/telco content as banking product management
2. Add Pakistan banking product context (CASA, lending, cards, Islamic products, digital banking)
3. Add SBP product approval and regulatory context
4. Map FSDM entities to each capability
5. Fix overflow, move detail to speaker notes
6. Add 3 new supplementary slides
7. Remove/replace all Teradata branding

---

## EXISTING SLIDE STRUCTURE (54 Slides)

### Part A: Overview & Navigation (Slides 1-18)

| Slide | Title | Type |
|-------|-------|------|
| 1 | Product Management — Navigation | Navigation |
| 2 | Product Management — Functional Insights | Navigation (6 areas) |
| 3 | Product Management — Capabilities (page 1) | Navigation |
| 4 | Product Management — Capabilities (page 2) | Navigation |
| 5 | Product Management BVF (1 of 2) | Use Case Map |
| 6 | Product Management BVF (2 of 2) | Use Case Map |
| 7 | (Blank/spacer) | Spacer |
| 8 | Products/Services Vary by Industry | Context |
| 9 | Examples: What Is a Product or Service? | Context |
| 10 | Product Management — Why Important | Context |
| 11 | Product Management — How (Capabilities) | Solution |
| 12 | Product Management — Solutions | Solution |
| 13 | Product Management — Interesting Facts | Context |
| 14 | Product Management for Retail | Context |
| 15 | Product Management — Are You Able To... | Assessment |
| 16 | Product Management — Business Challenges | Challenges |
| 17 | Value of Product Management | Business Value |
| 18 | Functional Insights and Capabilities | Section Divider |

### Part B: Product Development (Slides 19-26)

| 19 | Product Development — Why Important | Context |
| 20 | Product Development — How | Solution |
| 21 | Research New Product Development Opportunities | Capability Detail |
| 22 | Research New Product Development Opportunities | Maturity Table |
| 23 | Predict Business Impact (Discovery) | Capability Detail |
| 24 | Predict Business Impact (Discovery) | Maturity Table |
| 25 | Develop and Test Product Prototypes | Capability Detail |
| 26 | Develop and Test Product Prototypes | Maturity Table |

### Part C: Product Introduction (Slides 27-32)

| 27 | Product Introduction — Why Important | Context |
| 28 | Product Introduction — How | Solution |
| 29 | Plan Product Investments / Go-To-Market | Capability Detail |
| 30 | Plan Product Investments / Go-To-Market | Maturity Table |
| 31 | Improve Product Onboarding | Capability Detail |
| 32 | Improve Product Onboarding | Maturity Table |

### Part D: Price and Promotion (Slides 33-38)

| 33 | Price and Promotion — Why Important | Context |
| 34 | Price and Promotion — How | Solution |
| 35 | Analyze Competitive Pricing | Capability Detail |
| 36 | Analyze Competitive Pricing | Maturity Table |
| 37 | Manage Dynamic Pricing | Capability Detail |
| 38 | Manage Dynamic Pricing | Maturity Table |

### Part E: Product End-of-Life (Slides 39-42)

| 39 | Product End-of-Life — Why Important | Context |
| 40 | Product End-of-Life — How | Solution |
| 41 | Determine Product Migration | Capability Detail |
| 42 | Determine Product Migration | Maturity Table |

### Part F: Product Performance (Slides 43-54)

| 43 | Product Performance — Why Important | Context |
| 44 | Product Performance — How | Solution |
| 45 | Analyze Cross Channel Performance | Capability Detail |
| 46 | Analyze Cross Channel Performance | Maturity Table |
| 47 | Compare to Product Benchmarks | Capability Detail |
| 48 | Compare to Product Benchmarks | Maturity Table |
| 49 | Manage Product Profitability | Capability Detail |
| 50 | Manage Product Profitability | Maturity Table |
| 51 | Produce Behavioral Segmentations | Capability Detail |
| 52 | Produce Behavioral Segmentations | Maturity Table |
| 53 | Predict Product/Service Retention | Capability Detail |
| 54 | Predict Product/Service Retention | Maturity Table |

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"Product Management — At a Glance"**

| | Global | South Asia & ME | Pakistan |
|---|---|---|---|
| Products per customer | 4-6 at top banks | 2-3 | 1.8 (massive opportunity) |
| Product profitability analytics | 70%+ of large banks | 30-40% | <15% |
| Dynamic pricing capability | 50%+ at digital banks | 15-25% | <10% |
| Product A/B testing | Standard at digital banks | 15-20% | <5% |
| Product lifecycle analytics | 60% of large banks | 25-30% | <15% |
| Islamic product suite | N/A (where applicable) | Growing | Required (25%+ of deposits) |
| Digital product launch speed | 2-4 weeks | 4-8 weeks | 8-16 weeks (SBP approval + IT) |

Info bar:
```
BVF Sub-capabilities: 12 across 6 sub-domains
FSDM Entities: Product, Agreement, Party, Transaction, Channel, Pricing
BACR Questions: ~60 | Maturity Focus: Developing → Innovating
Pakistan Banking Products: CASA (Current/Savings), Term Deposits, Personal Loans, Home Finance,
Auto Finance, Credit Cards, Debit Cards, Trade Finance (LC/LG/SBLC), Islamic Products
(Murabaha, Ijarah, Diminishing Musharaka, Musharaka, Wakalah, Takaful)
```

### NEW Slide B: Pakistan Context (insert as slide 2)

**"Pakistan Banking — Product Management Landscape"**

```
PRODUCT PORTFOLIO (typical large Pakistan bank):
  DEPOSIT PRODUCTS:
    Current Account (zero interest, CASA), Savings Account (SBP min rate ~11-13%),
    Fixed Deposit (3M-5Y, negotiated rates), Foreign Currency Account (FCY deposits),
    Roshan Digital Account (overseas Pakistanis), Basic Banking Account (financial inclusion),
    Islamic: Mudaraba Savings, Mudaraba Term Deposit, Wakalah Pool

  LENDING PRODUCTS:
    Corporate: Working capital, term finance, project finance, trade finance (LC/LG/SBLC)
    Consumer: Personal loan, home finance, auto finance, credit card revolving
    SME: SME running finance, SME term finance
    Agriculture: Crop finance, livestock, dairy
    Islamic: Murabaha, Ijarah (auto/home), Diminishing Musharaka, Musharaka, Running Musharaka

  CARD PRODUCTS:
    Debit: Visa/MC classic, gold, platinum (30M+ cards)
    Credit: Visa/MC classic, gold, platinum, signature (3M+ cards)
    Prepaid: Travel, remittance, payroll

  DIGITAL PRODUCTS:
    Mobile banking app, Internet banking, RAAST P2P/P2M, QR payments,
    Digital wallet (JazzCash, Easypaisa partner), Agent banking (branchless)

KEY CHALLENGES:
  Products per customer: 1.8 (vs. 4-6 global benchmark)
  SBP product approval: New products require SBP NOC — adds 4-8 weeks to launch
  Islamic product complexity: Shariah board approval + SBP approval = dual gate
  Pricing rigidity: Deposit rates constrained by SBP minimum rate, lending by KIBOR
  Cross-sell: <5% response rate on product campaigns
  Product cannibalization: Digital products cannibalizing branch products (intended but unmanaged)
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Product Management — Implementation Roadmap"**

```
Phase 1: Product Intelligence Foundation (0-6 months)
  Product profitability analytics (from FSDM Customer Profitability Engine)
  Product performance dashboard (sales, balances, revenue, cost by product)
  Cross-channel product sales tracking
  Product benchmark analysis (vs. industry averages from SBP data)
  Investment: PKR 40-80M | Quick Win: Identify bottom 10% unprofitable products

Phase 2: Product Optimization (6-18 months)
  Competitive pricing analytics (deposit rates, lending spreads, card fees)
  Product onboarding journey optimization (reduce digital dropoff from 40-60% to <20%)
  Cross-sell propensity models by product affinity
  Islamic product performance parity analysis (Islamic vs. conventional)
  Product behavioral segmentation (usage patterns → right product fit)
  Investment: PKR 80-150M | Expected: Increase products/customer from 1.8 to 2.5

Phase 3: Advanced Product Management (18-36 months)
  Dynamic pricing engine (risk-adjusted lending, competitive deposit pricing)
  A/B testing framework for product features and pricing
  Product lifecycle management (launch → growth → maturity → sunset)
  Predictive product retention (which customers will close which products?)
  Real-time product recommendations integrated with all channels
  Investment: PKR 120-250M | Expected: 15-25% improvement in product revenue per customer
```

---

## INDUSTRY LANGUAGE TRANSLATION

This file has significant retail/telco/FMCG language. Apply these translations THROUGHOUT:

| Retail/Telco Term | Pakistan Banking Translation |
|---|---|
| SKU / Item / Merchandise | Banking product (CASA, term deposit, personal loan, credit card, etc.) |
| Assortment / Product mix | Product portfolio / product suite |
| Store / Branch / POS | Branch, ATM, mobile app, internet banking, agent network |
| ARPU | Revenue per customer / products per customer |
| Shelf space / adjacencies | Cross-sell placement / NBA positioning |
| Basket size / UPT | Products per customer / share of wallet |
| Markdown / clearance | Product sunset / rate adjustment / fee waiver |
| Inventory / stock | Product capacity / lending limits / card issuance pipeline |
| Supplier / vendor | Product manufacturer / card network (Visa/MC) / technology provider |
| Consumer / shopper | Customer / account holder / cardholder |
| Wireframe / wire line | Mobile banking / internet banking / digital channels |
| Content viewership | Mobile app usage / internet banking sessions |
| ARPU / churn (telco) | Revenue per customer / product closure rate |

---

## SLIDE-BY-SLIDE ENRICHMENT

### PART A: OVERVIEW (Slides 1-18)

#### Slides 1-6: Navigation & Use Case Maps
- Update all navigation to banking product language
- Add Pakistan product categories in navigation bullets

#### Slides 7-9: Context / What Is a Product
- **REWRITE Slide 8-9 for banking:** Replace retail/telco examples with Pakistan banking products
- "In banking, a 'product' encompasses: deposit accounts (CASA, term deposits), lending facilities (personal loans, home finance, corporate working capital), cards (debit, credit, prepaid), trade finance instruments (LC, LG, SBLC), treasury products (government securities, FX), digital services (mobile banking, QR payments, RAAST), and Islamic equivalents (Murabaha, Ijarah, Diminishing Musharaka)"

#### Slides 10-17: Why/How/Assessment/Challenges/Value

**Slide 10 (Why Important) — Rewrite for banking:**
- "Product management is the engine of banking revenue — every PKR of income comes from a product"
- "Pakistan banks average 1.8 products per customer vs. 4-6 globally — massive cross-sell opportunity"
- "Islamic product innovation is critical — 25%+ of deposits are now in Islamic products, growing 20%+ annually"
- "Digital product adoption determines competitive survival against fintechs (JazzCash 50M+, Easypaisa 40M+ users)"

**Slide 15 (Are You Able To) — Rewrite for banking:**
- "Can you calculate true profitability for each product in your portfolio?"
- "Can you track product performance across all channels (branch, ATM, digital, agent)?"
- "Can you identify which products drive cross-sell and which cannibalize?"
- "Can you optimize deposit pricing (rate) vs. volume trade-off analytically?"
- "Can you measure product onboarding success rate by channel?"
- "Can you predict which products a customer is likely to close next?"
- "Can you launch a new product variant in under 4 weeks?"

**Slide 16 (Challenges) — Add Pakistan challenges:**
- "SBP product approval process adds 4-8 weeks to launch timeline"
- "Islamic products require dual approval: Shariah board + SBP"
- "4-5 core banking systems make product configuration inconsistent"
- "Pricing constrained: deposit floor rate (SBP), lending ceiling (KIBOR + risk), card rates (SBP caps under discussion)"
- "Product data fragmented across core banking, cards, trade finance, Islamic sub-systems"

**Slides 10-17 Speaker Notes — Add:**
```
PAKISTAN BANKING PRODUCT LANDSCAPE:
Revenue by product category (typical large bank):
- CASA (Current + Savings): 30-40% of NII (low/zero cost deposits deployed at KIBOR)
- Term Deposits: 15-20% of NII (spread between FD rate and deployment rate)
- Corporate Lending: 20-25% of total income (NII + trade finance fees)
- Consumer Lending: 10-15% of total income (personal loans, cards, home/auto finance)
- Cards: 8-12% of total income (interchange, interest on revolving, annual fees)
- Trade Finance: 8-12% of total income (LC/LG commissions — high-margin)
- Treasury/Investment: 10-15% of total income (government securities yield)
- Other: Remittance commissions, FX, miscellaneous fees

Product growth areas:
1. Digital products (mobile banking, QR payments, RAAST — fastest growing)
2. Islamic products (Murabaha, Ijarah — 20%+ annual growth)
3. Roshan Digital Account (overseas Pakistanis — $7B+ since 2020)
4. SME lending (SBP priority — concessional refinance schemes)
5. Agricultural lending (SBP targets — mandatory lending to agriculture sector)

FSDM: PRDCT (Product), PRDCT_TYP (Product Type), AGRMNT (Agreement), PRDCT_FTRE (Product Feature), PRDCT_PRCNG (Product Pricing), PRDCT_PRFMNC (Product Performance)
```

---

### PART B: PRODUCT DEVELOPMENT (Slides 19-26)

#### Slides 19-20: Context

**Rewrite for banking:**
- "Product development in banking means: designing new deposit variants, structuring new lending products, creating card propositions, launching digital services, and innovating Islamic products"
- "Pakistan context: SBP encourages financial inclusion products (Basic Banking Account, Asaan Mobile Account, digital lending), Islamic product innovation, and green banking products"

#### Slides 21-22: Research New Product Development + Maturity

**Pakistan enrichment:**
- Objective ADD: "Research unmet needs in Pakistan's 220M population — only 30% banked, 60% have mobile phones. Products for financially excluded (basic accounts, micro-savings, nano-lending)."
- "Analyze RAAST transaction patterns to identify product opportunities (P2P senders → savings product, frequent billers → auto-debit product)"
- Source Data ADD: "FSDM customer/transaction data, mobile app usage analytics, RAAST transaction patterns, SBP financial inclusion survey data, competitor product monitoring, social media sentiment"
- Outcome ADD: "Data-driven product pipeline aligned with market need, SBP financial inclusion targets, and Islamic product gaps"

**Speaker Notes:**
```
PAKISTAN PRODUCT DEVELOPMENT:
Key product development opportunities:
1. DIGITAL-FIRST PRODUCTS: Account opening via mobile (NADRA biometric), instant nano-lending (PKR 5K-50K via app)
2. ISLAMIC PRODUCTS: Islamic credit card (commodity Murabaha-based), Islamic home finance (Diminishing Musharaka), Islamic digital savings
3. FINANCIAL INCLUSION: Asaan Mobile Account (simplified KYC), agent banking products, micro-insurance (Takaful)
4. ROSHAN DIGITAL: Products for overseas Pakistanis — Naya Pakistan Certificate, Roshan Apna Ghar (home finance)
5. GREEN BANKING: SBP green taxonomy — green lending products, green deposits (linked to ESG projects)
6. SME PRODUCTS: SBP refinance schemes for SME (concessional rates), supply chain finance, digital SME onboarding

SBP product approval process:
1. Internal product committee approval
2. Shariah board approval (if Islamic)
3. SBP NOC submission (product details, pricing, risk assessment)
4. SBP review and queries (4-8 weeks)
5. SBP approval / conditions
6. Core banking configuration
7. Marketing and launch

FSDM: PRDCT_DVLPMNT (Product Development), MKT_RSRCH (Market Research), CSTMR_ND (Customer Need), PRDCT_PPLN (Product Pipeline)
```

---

#### Slides 23-24: Predict Business Impact (Discovery) + Maturity

**Rewrite telco language as banking:**
- "Predict impact of new product launch on: existing product balances (cannibalization), channel capacity (branch/call center load), revenue (NII + fees), operational risk, and customer experience"
- "Pakistan example: launching a digital-only savings account — will it cannibalize branch savings? What's the expected adoption curve? Impact on call center?"
- Source Data ADD: "Historical product launch data (past 5 years), similar product performance at competitors, customer segment adoption patterns from FSDM"

---

#### Slides 25-26: Develop and Test Product Prototypes + Maturity

**COMPLETE REWRITE — currently telco-focused (viewership, wireframe, ARPU):**
- Objective: "Test product features, pricing, and packaging through A/B testing and pilot programs before full-scale launch"
- "Pakistan banking: pilot new products in select branches/regions before national rollout. Test pricing variants (rate sensitivity), feature variants (minimum balance, fee structure), and channel variants (branch-only vs. digital)"
- Data: "FSDM transaction data for pilot vs. control groups, mobile app engagement data, branch sales data, customer feedback, call center queries"
- Methodology: "A/B testing for digital products, regional pilot for branch products, champion/challenger for pricing, focus groups for product design"
- Outcome: "Evidence-based product launch decisions, optimized product features and pricing before full investment"

**Maturity table — REWRITE all 5 levels for banking context** replacing telco/wireless references.

---

### PART C: PRODUCT INTRODUCTION (Slides 27-32)

#### Slides 29-30: Plan Product Investments / Go-To-Market + Maturity

**Pakistan enrichment:**
- "Plan GTM for Pakistan banking: branch staff training (16,000+ branches), core banking system configuration (4-5 systems), SBP reporting setup, marketing collateral (Urdu + English), Islamic Shariah compliance documentation"
- "Forecast resource requirements: call center staffing for inquiries, branch teller training, digital UX readiness, card production pipeline"
- Source Data ADD: "Historical product launch data, branch capacity data, call center staffing model, digital channel capacity, card production lead times"

---

#### Slides 31-32: Improve Product Onboarding + Maturity

**Pakistan enrichment — CRITICAL:**
- "Pakistan digital onboarding has 40-60% dropoff rate at NADRA biometric verification step"
- "Optimize product onboarding journey: account opening (current 7-14 days → target <1 day), loan origination (21-45 days → <7 days), card issuance (14-30 days → <5 days)"
- "Track onboarding funnel: application start → document submission → NADRA verification → KYC completion → account activation → first transaction"
- Source Data ADD: "Digital onboarding funnel data, NADRA verification success/failure rates, document upload completion, first transaction timing, call center queries during onboarding"

**Speaker Notes:**
```
PAKISTAN PRODUCT ONBOARDING:
Current onboarding timelines (average):
- Current account: 3-7 days (branch), 1-3 days (digital — if NADRA works)
- Savings account: Same as current
- Personal loan: 7-21 days (documentation + credit check + approval)
- Home finance: 30-90 days (property valuation + legal + SBP guidelines)
- Credit card: 7-14 days (ECIB check + card production + courier)
- Digital onboarding: 10-30 minutes (if NADRA biometric succeeds on first attempt)

Key dropout points:
1. NADRA biometric verification failure (30-40% first-attempt failure rate)
2. Document upload issues (photo quality, format)
3. Minimum balance requirement confusion
4. Waiting for physical card/cheque book delivery
5. First transaction complexity

FSDM: ONBRDNG (Onboarding), ONBRDNG_JRNY (Onboarding Journey), DRPOFF (Dropoff), ACTVTN (Activation), FRST_TXN (First Transaction)
```

---

### PART D: PRICE AND PROMOTION (Slides 33-38)

#### Slides 35-36: Analyze Competitive Pricing + Maturity

**Pakistan enrichment:**
- "Monitor competitive pricing across Pakistan banking: deposit rates (SBP publishes rate data), lending rates (KIBOR + spreads), card fees (annual, late payment, FX markup), trade finance pricing (LC commission rates), digital transaction fees (RAAST/IBFT charges)"
- "Pakistan-specific: SBP minimum deposit rate creates floor. KIBOR creates lending benchmark. Competition is on spread, fees, and service quality."
- Source Data ADD: "SBP published rate data, competitor rate sheets (publicly available), KIBOR curves, card fee comparison, customer rate sensitivity data from FSDM"

---

#### Slides 37-38: Manage Dynamic Pricing + Maturity

**Pakistan enrichment:**
- "Dynamic pricing in Pakistan banking: adjust deposit rates for large depositors (relationship pricing), risk-based lending (KIBOR + variable risk premium based on ECIB/internal rating), promotional card rates (balance transfer offers, spend-based fee waivers)"
- "Constraints: SBP minimum deposit rate, SBP maximum markup on credit cards (under discussion), KIBOR-linked lending floors"
- Outcome ADD: "Optimize NII by dynamically adjusting deposit gathering cost vs. lending margin, retain large depositors through competitive pricing while protecting margin"

---

### PART E: PRODUCT END-OF-LIFE (Slides 39-42)

#### Slides 41-42: Determine Product Migration + Maturity

**Pakistan enrichment:**
- "Product migration in Pakistan banking: sunset legacy products (old savings schemes, discontinued FD tenors), migrate customers from conventional to Islamic products (growing demand), consolidate product variants across merged entities"
- "Pakistan context: Bank mergers create product rationalization need — merged bank may have 200+ product variants that need consolidation to 50-80"
- "Regulatory sunset: SBP discontinued products (e.g., old foreign currency schemes) require customer migration"
- Source Data ADD: "Product-level balance and customer data from FSDM, customer communication preference, channel usage, product switching history"
- Outcome ADD: "Smooth migration preserving customer relationships, minimal attrition during sunset, optimized product portfolio"

**Speaker Notes:**
```
PAKISTAN PRODUCT LIFECYCLE:
Product sunset scenarios in Pakistan banking:
1. LEGACY PRODUCTS: Old savings schemes with rates no longer competitive — migrate to current products
2. POST-MERGER RATIONALIZATION: Two banks merge, combined 300+ product variants → rationalize to 80-100
3. REGULATORY CHANGE: SBP changes product rules (e.g., PLS savings rate structure) — migrate affected customers
4. CONVENTIONAL → ISLAMIC: Growing demand for Islamic products — proactive migration of willing customers
5. BRANCH → DIGITAL: Sunset branch-only products, launch digital equivalents
6. CARD PRODUCT UPGRADE: Migrate classic cardholders to gold/platinum based on usage patterns

Key risk: Product sunset can trigger customer attrition if poorly managed. Must offer equivalent/better alternative and communicate proactively.

FSDM: PRDCT_LFCYCL (Product Lifecycle), PRDCT_SNST (Product Sunset), PRDCT_MGRTN (Product Migration), CSTMR_MGRTN (Customer Migration)
```

---

### PART F: PRODUCT PERFORMANCE (Slides 43-54)

#### Slides 45-46: Analyze Cross Channel Performance + Maturity

**Pakistan enrichment:**
- "Track product sales and usage across all Pakistan banking channels: branch (16,000+), ATM (16,000+), mobile app, internet banking, USSD, call center, agent network (branchless banking), RAAST"
- "Key insight: Which products sell best on which channels? Personal loans sell 80% via branch but digital origination growing. CASA opens increasingly digital. Cards are branch-initiated but digitally activated."
- Source Data ADD: "FSDM transaction data by channel, product sales by channel, mobile app product funnel data, branch sales register, agent banking transaction data"

---

#### Slides 47-48: Compare to Product Benchmarks + Maturity

**Pakistan enrichment:**
- "Benchmark Pakistan banking products against: SBP published industry data (deposit rates, advance rates, NIM), peer group performance (top 5/10 banks), international benchmarks (Gulf banks, SE Asian banks)"
- "Key product benchmarks: CASA ratio (industry ~47%), card activation rate, loan-to-deposit ratio, fee income per product, digital adoption rate"
- Source Data ADD: "SBP statistical bulletins, annual reports of peer banks, industry surveys (PBA), FSDM internal product performance data"

---

#### Slides 49-50: Manage Product Profitability + Maturity — CRITICAL

**Pakistan enrichment:**
- "Calculate true profitability for every product: FTP-adjusted NII + fee income - direct costs - ABC-allocated costs - IFRS 9 provision = product profit"
- "Cross-reference with File 08-09 Profitability Analytics — product profitability is one dimension of the multi-dimensional profitability model"
- "Pakistan insight: Some 'popular' products may be unprofitable (e.g., basic savings accounts with PKR 100 minimum balance, free debit cards). Analytics identifies cross-subsidy flows."
- Source Data ADD: "FSDM Customer Profitability Engine output aggregated to product level, FTP rates by product, ABC unit costs by product"

**Speaker Notes:**
```
PAKISTAN PRODUCT PROFITABILITY:
Typical profitability profile:
| Product | Revenue | Cost | Profit | Notes |
|---|---|---|---|---|
| Corporate working capital | High NII + fees | Low per-unit | Very profitable | Relationship-based |
| Trade finance (LC/LG) | High fee income | Moderate | Highly profitable | Pakistan's #1 fee source |
| Term deposits (large) | Negative NII (high rate) | Low | Negative | Cost of funds — needed for growth |
| CASA | High NII (low cost) | Moderate | Very profitable | Foundation of banking profit |
| Personal loans | High NII | Moderate | Profitable (if NPL controlled) | ECIB scoring critical |
| Credit cards | Interchange + interest | High (fraud, rewards) | Mixed | Top 20% customers profitable |
| Basic savings | Minimal NII | High (branch service) | Unprofitable | Financial inclusion mandate |
| Home finance | Moderate NII | High (origination) | Break-even → profitable | Long tenure needed |
| Digital products | Fee income | Very low | Highly profitable per transaction | Scale is key |

Key insight: Product profitability varies enormously. Without analytics, banks cross-subsidize unknowingly.

FSDM: PRDCT_PRFTBLTY (Product Profitability), PRDCT_RVNU (Product Revenue), PRDCT_CST (Product Cost), FTP (FTP by Product)
BVF Reference: File 08 EPM > Profitability Modelling, File 09 > Profitability Analytics
```

---

#### Slides 51-52: Produce Behavioral Segmentations + Maturity

**Pakistan enrichment:**
- "Segment banking customers by product usage behavior: heavy transactors (high RAAST/ATM usage), savers (FD-focused, low transaction), borrowers (multiple lending products), digital-first (mobile app primary), branch-loyal (branch-only), dormant (no activity 90+ days)"
- "Islamic preference segmentation: customers who only use Islamic products vs. mixed vs. conventional-only"
- Source Data ADD: "FSDM transaction data, product holding data, channel usage data, Islamic/conventional preference flag, mobile app engagement metrics"

---

#### Slides 53-54: Predict Product/Service Retention + Maturity

**Pakistan enrichment:**
- "Predict which products each customer is likely to close: FD non-renewal (rate shopping), CASA closure (salary switch), card cancellation (dormancy), loan prepayment (refinancing)"
- "Pakistan-specific: salary account switching is highest product-level churn risk. When employer switches bank, entire product bundle is at risk."
- Source Data ADD: "FSDM: product tenure, balance trend, transaction frequency change, salary credit continuity, competitor rate data, customer life event indicators"
- Outcome ADD: "Product retention alerts 30 days before closure, targeted retention offers by product type"

---

## TERADATA BRANDING REMOVAL

Apply standard removal to all 54 slides. Additionally:

| Find | Replace |
|---|---|
| All retail/telco owner names (Tidell, Kong, Axon, Erdelyi, etc.) | REMOVE |
| "Marcom Central" photo references | REMOVE |
| All telco-specific maturity text | REWRITE for banking |
| EKN Research retail stats | Replace with Pakistan banking stats |
| "Teradata" in data/solution sections | "Enterprise Analytics Platform" or "Data Warehouse" |
| "H1 2018" | "H1 2025 — H2 2026" |

## CONTENT DENSITY RULES

Same as all previous files. Capability detail slides have Business Objectives + Data/Solution + Outcome tables — condense on slide, full detail in speaker notes.

## FINAL OUTPUT (57+ slides)

| # | Content | Status |
|---|---------|--------|
| **1** | **Domain Dashboard** | **NEW** |
| **2** | **Pakistan Product Management Context** | **NEW** |
| 3-20 | Overview & Navigation (18 slides) | Enriched + banking language |
| 21-28 | Product Development (8 slides) | Enriched + telco→banking rewrite |
| 29-34 | Product Introduction (6 slides) | Enriched |
| 35-40 | Price and Promotion (6 slides) | Enriched |
| 41-44 | Product End-of-Life (4 slides) | Enriched |
| 45-56 | Product Performance (12 slides) | Enriched |
| **57** | **Implementation Roadmap** | **NEW** |

## VISUAL QA CHECKLIST

```
No retail/telco/FMCG language remaining — ALL rewritten for banking
No text overflow
Font >= 10pt everywhere
No Teradata branding
Pakistan banking product context on every capability slide
Speaker notes with SBP/FSDM/Islamic product context
3 new slides present
Maturity tables rewritten where needed (especially Product Prototypes)
Islamic product context included throughout
```
