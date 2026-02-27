# Prompt 6: BVF PowerPoint Updater — 01_Introduction_Industry_Challenges.pptx

## Role

You are a senior banking analytics consultant with 20+ years of experience in Financial Services Data Warehousing (Teradata FSDM), Enterprise Data Strategy, and Pakistan banking regulation. You are updating Teradata's Banking Business Value Framework (BVF) v1.0 presentation deck with modern, substantive, Pakistan-contextualized banking content.

---

## Objective

Read, update, and enhance the existing PowerPoint file `01_Introduction_Industry_Challenges.pptx` from the local `pptout/` folder. Preserve the original Teradata template design, layout, fonts, colors, and shapes — but replace and enrich ALL text content with deep, authoritative banking and financial services content reflecting 2024-2025 industry reality, with special emphasis on Pakistan/South Asia banking context.

---

## Source File

```
INPUT:  ./pptout/01_Introduction_Industry_Challenges.pptx
OUTPUT: ./pptout/01_Introduction_Industry_Challenges_UPDATED.pptx
```

---

## Reference Data (Local Repo)

Before updating slides, read and absorb context from these local files. These contain the actual FSDM model analysis, BVF capability mappings, profitability engine design, and BACR maturity assessment from a real Pakistani bank (UBL-style):

```
# Project overview - read FIRST for full context
./OVERVIEW.md

# BVF capability structure (112 sub-capabilities, 6 business functions)
./bvf_output/bvf_analysis_report.json
./bvf_fsdm_output/bvf_fsdm_integration_report.json

# FSDM model analysis (3,917 entities across 16 domains)
./fsdm_output/fsdm_analysis_report.json
./fsdm_output/fsdm_domain_classification.csv

# UBL ERwin v13 model (actual bank implementation)
./erwin_parser_output/fsdm_entity_summary.csv
./erwin_parser_output/fsdm_data_dictionary.csv

# Profitability Star Schema (fact + dimensions + gap extensions)
./bvf_fsdm_output/profitability_star_schema.sql
./bvf_fsdm_output/fsdm_gap_extensions.sql

# BACR Maturity Assessment (793 questions, 8 categories)
./bacr_output/bacr_analysis_report.json
```

---

## Technical Approach

Use the PPTX editing workflow — do NOT recreate from scratch:

```bash
# Step 1: Analyze existing slides
python scripts/thumbnail.py ./pptout/01_Introduction_Industry_Challenges.pptx
python -m markitdown ./pptout/01_Introduction_Industry_Challenges.pptx

# Step 2: Unpack
python scripts/office/unpack.py ./pptout/01_Introduction_Industry_Challenges.pptx unpacked_01/

# Step 3: Edit slide XML content (use Edit tool, NOT sed/python)
# Edit each slide{N}.xml in unpacked_01/ppt/slides/

# Step 4: Clean orphaned refs
python scripts/clean.py unpacked_01/

# Step 5: Repack
python scripts/office/pack.py unpacked_01/ ./pptout/01_Introduction_Industry_Challenges_UPDATED.pptx --original ./pptout/01_Introduction_Industry_Challenges.pptx

# Step 6: Visual QA
python scripts/office/soffice.py --headless --convert-to pdf ./pptout/01_Introduction_Industry_Challenges_UPDATED.pptx
pdftoppm -jpeg -r 150 01_Introduction_Industry_Challenges_UPDATED.pdf qa_slide
# Then visually inspect each qa_slide-*.jpg
```

**CRITICAL RULES:**
- Use the Edit tool for ALL text changes, never sed or Python string replacements
- Preserve ALL `<a:rPr>` formatting attributes (font sizes, colors, bold, etc.)
- Preserve ALL shape positions, dimensions, and layout structure
- Only modify `<a:t>` text content inside existing `<a:r>` runs
- If adding bullet points, use proper `<a:p>` paragraphs — never concatenate
- Use `&#x201C;` and `&#x201D;` for smart quotes in XML
- Bold headers with `b="1"` on `<a:rPr>`

---

## Slide-by-Slide Content Update Instructions

### Slide 1 — Title Slide
**Current:** "Teradata Business Value Framework / Finance Industry / V1.0"
**Update to:**
```
Banking Analytics & Data Strategy
Business Value Framework for Financial Services
Powered by Teradata FSDM — Pakistan Banking Edition
```

### Slide 2 — Internal Notice (DELETE or replace)
**Current:** Internal instructions about incomplete BVF areas
**Action:** Replace with an Executive Summary slide:
```
Title: Executive Summary — Why This Matters

Text:
Pakistan's banking sector manages PKR 32+ trillion in assets across 30+ commercial banks, 
5 Islamic banks, and 11 microfinance banks. Yet most banks operate at BACR maturity 
Level 2 (Developing) across data analytics capabilities.

This framework maps 112 analytical capabilities across 6 business functions to Teradata's 
Financial Services Data Model (FSDM) with 3,917 entities — providing a concrete 
implementation roadmap from data to decision.

Key numbers:
• 360 BVF-to-FSDM entity mappings validated
• 16 FSDM data domains covering full banking value chain
• 11-table profitability star schema (1 fact + 7 dims + 2 aggs + 1 bridge)
• 21 gap extension tables for Pakistan-specific requirements
• 793 BACR assessment questions across 8 maturity categories
```

### Slide 3 — IP Warning (DELETE or replace)
**Current:** Intellectual Property warning
**Action:** Replace with a Table of Contents / Agenda slide:
```
Title: Framework Coverage

1. Industry Challenges — Digital disruption, regulation, fintech competition
2. Marketing & Customer Experience — 4 capability groups, 40+ use cases
3. Finance & Performance Management — Profitability, Treasury, FTP, Reporting
4. Risk Management & Mitigation — Credit, Market, Operational, Collections
5. Security & Fraud — Cyber, Employee Fraud, Customer Fraud, AML integration
6. Legal & Regulatory Compliance — SBP, Basel III, IFRS 9, AML/CFT
7. Product Management — Development, Pricing, Performance, End-of-Life
8. Analytic Infrastructure — FSDM data model, Star Schema, Gap Extensions
```

### Slide 4 — Financial Services Challenges
**Current:** Generic challenges (Digitalisation, Macroeconomic, Regulation, Technology)
**Update with Pakistan-specific 2024-2025 content:**
```
Title: Pakistan Banking Sector — Converging Challenges

Digitalisation & Digital Payments Revolution
- RAAST P2P/P2M processed PKR 9.8 trillion in FY2024
- JazzCash + Easypaisa: 100M+ mobile wallets 
- Roshan Digital Accounts (RDA): $7.5B+ inflows from diaspora
- SBP mandating open banking APIs by 2025

Macroeconomic Pressures  
- Policy rate peaked at 22% (Jun 2023), now at 17.5% — KIBOR volatility
- PKR depreciation: 280→ 278/USD with managed float regime
- Sovereign debt restructuring and IMF Stand-By Arrangement
- Inflation moderating from 38% peak to 12% — NIM compression ahead

Regulatory Tsunami
- IFRS 9 ECL provisioning (Stage 1/2/3) fully enforced since Jan 2024
- Basel III Capital Conservation Buffer at 2.5%
- SBP AML/CFT regulations aligned with FATF grey list remediation
- Minimum capital requirement raised to PKR 20 billion by Dec 2026

Technology Debt & Legacy Burden
- 60%+ banks still on monolithic core banking (CTL, Temenos, Oracle FLEXCUBE)
- Average bank runs 4-5 separate core systems without unified data layer
- Manual reconciliation consuming 30%+ of operations FTEs
- Siloed data across cards, lending, treasury, and trade finance
```

### Slide 5 — Pressures Are Mounting
**Current:** Generic "Deliver Growth with More Efficient Processes"
**Update with quantified Pakistan banking metrics:**
```
Title: Mounting Pressures on Pakistan's Banking Sector

GROWTH IMPERATIVES
- Financial inclusion at 30% (SBP target: 50% by 2028)
- SME lending < 8% of total advances — massive untapped market
- Agriculture credit disbursement gap: PKR 300B+ shortfall
- Digital-only banking licenses (5 awarded by SBP) creating new competition
- Cross-sell ratios averaging 1.3 products/customer vs. 4.5 in mature markets

COST PRESSURES  
- Cost-to-income ratios averaging 55-65% (target: <45%)
- Branch network costs PKR 50-80M/branch/year — digital channels at 1/10th
- Regulatory compliance consuming 15-20% of technology budgets
- Manual processes in trade finance costing $150-200 per transaction

BUSINESS MANAGEMENT COMPLEXITY
- Average bank has 200+ regulatory reports due monthly/quarterly
- IFRS 9 requires forward-looking ECL models with 3 macroeconomic scenarios
- FTP accuracy critical with KIBOR at 17.5% — 10bps error = PKR billions
- Customer profitability invisible: 80% of profit from 20% of customers, 
  but banks cannot identify which 20%
```

### Slide 6 — Threats Are Advancing
**Current:** Generic fintech logos and threats
**Update text (preserve image shapes if possible):**
```
Title: New Entrants Reshaping Pakistan's Financial Landscape

DIGITAL DISRUPTORS
- SadaPay, NayaPay: Zero-fee accounts capturing Gen-Z (8M+ users combined)
- Finja: Digital lending with instant credit scoring
- Tag CBS: Cloud-native Islamic banking platform
- Bykea/Daraz: Super-app financial services embedding

TELECOM-LED BANKING
- JazzCash (Mobilink Microfinance Bank): 40M+ wallets
- Easypaisa (Telenor Microfinance Bank): 30M+ wallets  
- Both now offering savings, insurance, and micro-lending

REGIONAL & GLOBAL THREATS
- India's UPI success creating pressure for RAAST acceleration
- Chinese fintech (Ant Group, WeBank) eyeing CPEC corridor banking
- Crypto/stablecoin adoption in Pakistan (despite regulatory ambiguity)
- Open Banking APIs enabling aggregator models that unbundle bank relationships

THE STAKES: Banks that cannot provide a unified, data-driven customer 
experience will lose their most profitable customers to digital-first 
competitors who can.
```

### Slide 7 — Change at 2 Speeds
**Current:** Generic disruption vs transformation
**Update:**
```
Title: Two Speeds of Transformation in Banking

SPEED 1: DISRUPTIVE (6-18 months)
- Launch real-time personalization engine using customer 360° view
- Deploy AI-driven credit scoring for unbanked segments
- Enable instant cross-border remittances via RAAST + RDA integration  
- Implement dynamic pricing using customer profitability analytics
- Real-time fraud detection with graph analytics and ML models

SPEED 2: TRANSFORMATIONAL (18-36 months)
- Build enterprise data warehouse on FSDM with 3,917 standardized entities
- Implement Activity-Based Costing across all products and channels
- Deploy IFRS 9 compliant Expected Credit Loss engine
- Create unified Funds Transfer Pricing (FTP) based on KIBOR term structure
- Establish customer profitability measurement at individual account level
- Migrate from batch to real-time event processing for customer interactions
```

### Slide 8 — Challenges Forcing Re-invention
**Current:** Generic grow/reduce/improve
**Update with data-driven framing:**
```
Title: Data-Driven Re-invention — The Only Path Forward

GROW THROUGH CUSTOMER INTELLIGENCE
- Build Multi-Dimensional Customer View integrating all touchpoints
  (FSDM entities: INDVDL, ACCT, CNTCT, EVNT across 16 domains)
- Identify actual customer needs through transaction classification, 
  journey analytics, and behavioral segmentation
- Optimize offers using profitability-aware Next Best Action engines
- Target the right moment via event-driven marketing (FSDM Event domain: 38 entities)

REDUCE COSTS THROUGH ANALYTICS AUTOMATION
- Replace manual reconciliation with automated matching engines
- Reduce regulatory reporting from weeks to hours via integrated data layer
- Automate sub-ledger accounting and financial consolidation
- Deploy straight-through-processing for trade finance and payments

IMPROVE MANAGEMENT THROUGH TRANSPARENCY
- FACT_CUSTOMER_PROFITABILITY: Revenue - Direct Cost - Allocated Cost - Risk Cost
- 7-dimensional analysis: Customer × Product × Channel × Branch × Time × Segment × Business
- Real-time KPI dashboards replacing monthly batch reports
- Funds Transfer Pricing providing true cost-of-funds at account level
```

### Slide 9 — Analytics Critical Role
**Current:** Generic BBVA quote about data-driven banking
**Update the quote and supporting text:**
```
Title: Analytics — The Core Competitive Advantage

Quote: "The future of banking belongs to institutions that can transform data 
into decisions at the speed of customer expectation. In Pakistan, where 70% 
of adults remain unbanked, the opportunity for data-driven financial inclusion 
is unprecedented."

Supporting context:
- Global analytics spending in banking: $25B+ annually (growing 15% CAGR)
- Pakistan banking analytics maturity: Level 2.1 average (BACR assessment)
- Banks with mature analytics programs achieve 2.5x higher ROE
- FSDM provides the canonical data foundation — 3,917 entities covering 
  every banking data domain from Customer to Risk to Product to Finance
- BVF maps 112 analytical capabilities to concrete data requirements
- The gap between data-rich and data-poor banks will define the next decade
```

### Slide 10 — BVF Framework (6 Business Functions)
**Current:** Shows 6 business functions as boxes
**Update text labels with counts and FSDM backing:**
```
Title: Banking Business Value Framework — 6 Functions, 112 Capabilities

Marketing & Customer Experience (40 capabilities)
→ FSDM: Customer, Event, Product, Channel domains (420+ entities)

Risk Management & Mitigation (18 capabilities)  
→ FSDM: Risk, Agreement, Collateral domains (280+ entities)

Legal & Regulatory Compliance (12 capabilities)
→ FSDM: Document, Regulatory, Classification domains (180+ entities)

Security & Fraud (14 capabilities)
→ FSDM: Event, Party, Transaction domains (200+ entities)

Finance & Performance Management (26 capabilities)
→ FSDM: Finance, Account, General Ledger domains (350+ entities)

Product Management (12 capabilities)
→ FSDM: Product, Arrangement, Pricing domains (190+ entities)

Analytic Infrastructure: Teradata FSDM v16 | 16 Domains | 3,917 Entities
```

### Slide 11 — BVF with Infrastructure Layers
**Current:** Shows Data Lake → Structured Data → Analytics → Decisioning layers
**Update layer descriptions:**
```
Analytic Infrastructure layers:

Data Lake for Landing, Storage & Archive
→ Raw ingestion from 4-5 core banking systems (CTL, Cards, Treasury, Trade, Islamic)
→ Multi-structured data: transactions, documents, digital interactions, social, IoT

Structured Data for Integration & Reuse  
→ FSDM v16: 3,917 entities in 3NF with Teradata-optimized DDL
→ Star Schema: FACT_CUSTOMER_PROFITABILITY + 7 dimensions + 2 aggregates
→ Gap Extensions: 21 tables for Pakistan-specific requirements (KIBOR, WHT, Zakat, Islamic)

Analytical Tools for Discovery & Creation of Insight
→ Profitability Engine: Revenue - Cost - Risk at customer/product/channel/branch level  
→ ML Models: Credit scoring, churn prediction, NBA, fraud detection
→ BACR Maturity Framework: 793 assessment questions across 8 categories

Decisioning & Delivery of Insight to Channels
→ Real-time customer offers via branch, mobile, ATM, call center
→ Automated regulatory reporting to SBP
→ Executive dashboards with drill-through to transaction level
```

### Slide 12 — BVF with Data Sources
**Current:** Shows data sources feeding into the framework
**Update data source descriptions:**
```
Data Sources (Pakistan Banking Context):

360° Customer View
→ CNIC-linked identity across all accounts and relationships

Demographics & Preferences  
→ NADRA data, geo-location, channel preferences, language (Urdu/English/Regional)

Account, Policy & Service Details
→ CASA, Term Deposits, Loans, Cards, Islamic Products (Murabaha/Musharakah/Ijarah)

Balances & Interest Rates
→ Real-time balances, KIBOR-linked pricing, profit rates for Islamic accounts

Transactions & Interactions
→ IBFT, RAAST, ATM, POS, mobile banking, branch visits, call center

Limits, Collateral, Provisions
→ Credit limits, property/gold collateral, IFRS 9 ECL stages (1/2/3)

General Ledger & ERP
→ Chart of accounts, cost centers, branch P&L, departmental allocations

Multi-structured Data
→ Scanned documents (CNIC, utility bills), digital signatures, biometric data

Master & Reference Data
→ SBP bank codes, SWIFT/BIC, branch registry, product catalog, KIBOR term structure
```

---

## Speaker Notes

For each slide, add substantive speaker notes (in `notesSlide{N}.xml`) containing:
- 2-3 talking points expanding on the slide content
- A relevant Pakistan banking statistic or regulation reference
- Connection to FSDM entities or BVF capabilities where applicable

---

## Quality Assurance

After repacking, perform:
1. `python -m markitdown` on the output to verify all text was updated
2. Visual QA using `soffice` + `pdftoppm` conversion — inspect every slide image
3. Verify no placeholder text remains ("V1.0", "Point 1", "lorem", etc.)
4. Confirm all formatting preserved (fonts, colors, sizes, shapes)
5. Check speaker notes are populated

---

## Important Constraints

- **DO NOT** change any visual design elements (backgrounds, shapes, colors, images)  
- **DO NOT** add or remove slides — only update content within existing slide structure
- **DO NOT** change font families or sizes unless absolutely necessary for fit
- **PRESERVE** all Teradata branding elements and logos
- **USE** Pakistan-specific data, regulations, and terminology throughout
- **REFERENCE** FSDM entity names and BVF capability names from the local data files
- All PKR amounts should use Pakistani conventions (PKR, crore/billion as appropriate)
- Islamic banking terminology must be accurate (Murabaha, Musharakah, Ijarah, Sukuk, etc.)
- SBP regulation references should be current (2024-2025)
