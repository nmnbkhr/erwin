# Prompt 6G: BVF PowerPoint Updater — 02_Marketing_CX_Overview.pptx

## Role

You are a senior banking customer analytics and digital marketing consultant with 20+ years experience in retail banking CRM, customer lifecycle management, digital banking transformation, and data-driven marketing for South Asian and Middle Eastern banks. You specialize in Teradata FSDM-based customer data warehouses, customer 360 platforms, real-time interaction management, and next-best-action engines. You have deep expertise in Pakistan's banking market: 60M+ banked customers, RAAST instant payments, JazzCash/Easypaisa mobile wallets, Roshan Digital Accounts (RDA), SBP financial inclusion strategy (NFIS 2028 target: 50%), SBP Fair Treatment of Consumers guidelines, and the competitive dynamics between traditional banks and fintech disruptors.

---

## Objective

Enrich ALL 23 slides of `02_Marketing_CX_Overview.pptx` with Pakistan banking context, current 2024-2025 market data, and UBL-relevant customer analytics capabilities. This file has NO empty placeholders — every slide has real Teradata content that must be enhanced, not replaced. Preserve the original Teradata BVF framework and messaging while layering Pakistan-specific banking context throughout.

```
INPUT:  ./pptout/02_Marketing_CX_Overview.pptx
OUTPUT: ./pptout/02_Marketing_CX_Overview_UPDATED.pptx
```

---

## Reference Data (Local Repo) — Read FIRST

```
./OVERVIEW.md                                           # Full project context
./fsdm_output/fsdm_analysis_report.json                 # 3,917 FSDM entities, Customer domain ~600 entities
./fsdm_output/fsdm_domain_classification.csv            # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json      # 360 BVF→FSDM mappings (Marketing & CX sub-capabilities)
./bvf_output/bvf_analysis_report.json                   # 112 BVF sub-capabilities (Marketing & CX = largest domain)
./bacr_output/bacr_analysis_report.json                 # 793 BACR questions, Marketing/CX category
./erwin_parser_output/fsdm_entity_summary.csv            # UBL ERwin v13 entities
./bvf_fsdm_output/profitability_star_schema.sql          # Star schema with customer dimension
```

---

## Technical Approach

PPTX editing workflow: `unpack.py` → Edit slide XML with Edit tool → `clean.py` → `pack.py`. 

**CRITICAL ENRICHMENT RULE:** This file has NO empty placeholder text. Every slide has real content. The approach is:
1. **KEEP** all existing Teradata text that is still accurate and valuable
2. **ENHANCE** by adding Pakistan-specific banking context alongside existing content
3. **UPDATE** outdated statistics, references, and timeframes to 2024-2025
4. **REPLACE** generic "company" language with banking-specific language where appropriate
5. **ADD** speaker notes to every slide with Pakistan banking context and FSDM entity references

Do NOT delete existing content — only add to it or refine it.

---

## SLIDE-BY-SLIDE ENRICHMENT INSTRUCTIONS

### Slide 1 — Title Slide
**Current:** "Teradata Business Value Framework — Marketing and Customer Experience"
**Enrich:**
- Add subtitle: "Pakistan Banking Edition — Customer Analytics for 60M+ Banked Customers"
- Update footer/date to "2025-2026"
- **Speaker Notes:** "This module covers the Marketing & Customer Experience domain of the BVF framework, contextualized for Pakistan's banking sector where digital adoption is transforming customer engagement. Pakistan has 60M+ bank accounts, 100M+ mobile wallet accounts, and processes PKR 15T+ annually through RAAST/IBFT — creating massive customer interaction data that must be captured, unified, and analyzed to deliver competitive customer experiences. FSDM provides 600+ Customer domain entities supporting the full 360-degree customer view."

### Slide 2 — Section Overview (Marketing & CX Capability Areas)
**Current:** Generic capability listing (Customer Information Management, Insight Driven Customer Management, Customer Lifecycle Management, Customer Interaction Management)
**Enrich:**
- Add Pakistan context to each capability area description:
  - Customer Information Management → "Unify customer data across 4-5 core banking systems, CNIC/NADRA identity, mobile wallet transactions, RAAST/IBFT payment data, and digital banking channels into a single FSDM-based Customer 360"
  - Insight Driven Customer Management → "Leverage Pakistan's unique customer behavioral signals — RAAST payment velocity, CASA balance volatility, digital banking adoption curves, and cross-product holdings — to derive actionable customer insights"
  - Customer Lifecycle Management → "Manage the full customer lifecycle from CNIC-verified account opening through digital engagement, cross-sell, retention, and win-back — supporting SBP financial inclusion targets"
  - Customer Interaction Management → "Orchestrate personalized interactions across branch network (1,000+ branches), ATMs (16,000+), internet banking, mobile apps, WhatsApp banking, SMS, RAAST notifications, and call center"
- **Speaker Notes:** "Pakistan's banking sector is at a critical inflection point — traditional branch-based banking is being disrupted by fintech (JazzCash 40M+ wallets, SadaPay, NayaPay) while digital banking licenses are expanding competition. Banks that build superior customer analytics capabilities will capture the PKR 500B+ revenue opportunity in Pakistan's underpenetrated financial services market. The BVF Marketing & CX domain maps directly to FSDM Customer domain entities (INDVDL, ORGN, CSTMR, CNTCT, EVNT) providing the data foundation."

### Slides 3-7 — Capability Detail Navigation Slides
**Current:** Sub-capability listings for each capability area
**Enrich each with Pakistan banking examples:**

**Slide 3 (Customer Information Management sub-capabilities):**
- Single View of Customer → "CNIC-anchored customer identity resolution across core banking, digital, mobile wallet, and credit bureau (ECIB) data"
- Multi-Dimensional Customer View → "Demographics + products + transactions + digital behavior + risk profile + profitability + relationship network"
- **Speaker Notes:** "In Pakistan, customer identification starts with CNIC (Computerized National Identity Card) — the unique 13-digit identifier issued by NADRA. However, a single customer may have accounts across 3-4 banks, JazzCash/Easypaisa wallets, and Roshan Digital Accounts. FSDM's INDVDL_IDNTFCTN entity resolves these to a single customer view. UBL's challenge: 4-5 core banking systems each maintaining separate customer masters — the FSDM Customer 360 unifies these through FSDM's Party/Individual entity hierarchy."

**Slide 4 (Insight Driven Customer Management sub-capabilities):**
- Customer Value & Profitability → "FSDM-based Customer Profitability Engine: interest income (KIBOR-based), fee income, transaction income, cost allocation, risk cost — at individual customer level"
- Customer Satisfaction Indexing → "NPS/CSAT measurement across branch, digital, and call center channels — benchmarked against industry and fintech competitors"
- Transaction Classification → "Automated classification of IBFT, RAAST, POS, ATM, and mobile wallet transactions into spending categories for behavioral insights"
- Customer Journey Analysis → "Map customer paths across branch visits, internet banking sessions, mobile app interactions, RAAST payments, and call center contacts"
- Customer Segmentation → "Beyond demographics: behavioral segmentation using CASA transaction velocity, digital adoption score, product holding breadth, and life-stage indicators"
- **Speaker Notes:** "Pakistan's retail banking customer base can be segmented into: Premium (PKR 5M+ relationship, ~2% of customers, 40% of profit), Emerging Affluent (PKR 1-5M, ~8%, 30% of profit), Mass Market (PKR 100K-1M, ~30%, 25% of profit), and Basic (below PKR 100K, ~60%, 5% of profit — but largest growth opportunity). The profitability engine uses FSDM Finance entities to calculate customer-level NII, fee income, and risk cost. BACR maturity assessment shows most Pakistani banks at Level 1-2 for customer analytics."

**Slide 5 (Customer Lifecycle Management sub-capabilities):**
- Customer Acquisition → "Digital account opening via CNIC/biometric verification, RAAST-enabled onboarding, referral analytics"
- Customer On-Boarding and Development → "First 90-day engagement optimization: CASA activation, debit card issuance, digital channel registration, first RAAST payment"
- Customer Retention → "Behavioral early warning: CASA balance decline, reduced transaction frequency, digital session drops"
- Customer Churn → "Predict CASA dormancy, term deposit attrition, lending prepayment, and relationship closure 60-90 days in advance"
- Cross Sell / Up Sell → "Next-best-product recommendations: CASA → term deposit → personal loan → credit card → insurance → investment → home finance"
- **Speaker Notes:** "Pakistan banking lifecycle challenge: Customer acquisition cost is PKR 3,000-5,000 per retail customer, but 30-40% of new accounts become dormant within 12 months. Cross-sell ratios average 1.8 products per customer vs. 4-5 in mature markets. Financial inclusion means 70% of adults are potential new-to-bank customers. Lifecycle analytics can increase products-per-customer from 1.8 to 3.0+ and reduce dormancy from 35% to 15% — equivalent to PKR 10-15B revenue opportunity for a top-5 bank."

**Slide 6 (Customer Interaction Management sub-capabilities):**
- Communication Targeting → "Segment-specific outreach via SMS, push notifications, WhatsApp Business, email, branch staff prompts, and ATM screen messaging"
- Next Best Action Arbitration → "Real-time NBA engine balancing sales, service, retention, and risk actions across all touchpoints — triggered by customer events (salary credit, large withdrawal, digital session)"
- Contextual Decisioning → "In-session decisioning on mobile app and internet banking: personalized offers, product recommendations, and service prompts based on current navigation and transaction context"
- Digital Optimization → "Mobile app and internet banking journey optimization — reducing drop-off in digital account opening, loan applications, and product activation flows"
- **Speaker Notes:** "Pakistan's channel landscape in 2024-2025: Branch network still handles 60% of high-value transactions but digital channels growing 40% YoY. Mobile banking users: 30M+ active. Internet banking: 15M+ active. WhatsApp emerging as customer service channel. RAAST creating new interaction touchpoints (payment notifications, request-to-pay). The challenge: coordinating interactions across 8+ channels with consistent customer experience. Teradata's RTIM (Real-Time Interaction Manager) capability maps to FSDM Event entities (EVNT, CSTMR_EVNT) for capturing and acting on customer signals."

**Slide 7 (Marketing Effectiveness sub-capabilities):**
- Marketing Attribution → "Multi-touch attribution for Pakistan's fragmented media landscape: TV (PTV, ARY, Geo), digital (Facebook, YouTube, Google), OOH, branch, SMS/WhatsApp campaigns"
- Brand Analytics → "Social listening across Twitter/X, Facebook, Instagram, and local forums for brand sentiment monitoring and competitive positioning"
- **Speaker Notes:** "Pakistan's digital advertising market: PKR 30B+ annually (growing 25% YoY). Banking sector digital ad spend: PKR 3-5B. Attribution challenge: customer journey spans offline (branch visit prompted by TV ad) and online (mobile app download from Google ad). Multi-touch attribution models can optimize marketing ROI by 20-30% — shifting spend from low-attribution channels to high-conversion digital touchpoints."

### Slides 8-12 — Use Case Triangle Diagrams
**Current:** Use case names organized by capability area with color-coded triangles
**Enrich by adding Pakistan banking context to specific use case names:**

**Slide 8 (page 1 of 5):**
- "Path To Profitable/Unprofitable Customers" → Add note: "KIBOR-spread analysis + fee income + risk cost = true customer profitability"
- "Customer Satisfaction NPS" → Add note: "Post-transaction NPS via SMS/push across branch, digital, ATM channels"
- "Transaction Classification" → Add note: "RAAST/IBFT/POS/ATM/mobile wallet transaction categorization for spending insights"
- "Customer Journey Analytics" → Add note: "Cross-channel journey: branch → mobile app → RAAST → call center"
- **Speaker Notes:** "These use cases are prioritized for Pakistan banking implementation. Path to Profitable Customer is the highest-priority use case — linking to the FSDM-based Customer Profitability Engine (see profitability_star_schema.sql). Transaction Classification leverages Pakistan's unique payment ecosystem where RAAST, IBFT, POS, ATM, and mobile wallets each carry distinct behavioral signals. BACR assessment shows most Pakistani banks at Level 1-2 maturity for these capabilities."

**Slide 9 (page 2 of 5):**
- "Wealth Management Proactive Advice" → "Relevant for Pakistan's HNW segment: PKR 50M+ relationship customers, NRP/RDA holders"
- "Lead Generation From Branch Notes" → "Text mining Urdu/English branch visit notes for cross-sell opportunities"
- "Customer Network Analysis" → "RAAST/IBFT payment network analysis revealing customer social/business connections"
- "Propensity Modeling" → "Next-best-product propensity for Pakistan's product portfolio: CASA, TD, PL, CC, Banca, Home Finance"
- **Speaker Notes:** "Pakistan-specific prioritization: Lead Generation from Branch Notes has high value because 60% of retail interactions still happen at branches. Urdu text analytics on branch visit notes and call center logs can uncover cross-sell signals invisible in structured data. Customer Network Analysis using RAAST/IBFT payment data reveals customer relationships that predict product adoption — customers connected to credit card holders are 3x more likely to adopt cards themselves."

**Slide 10 (page 3 of 5):**
- "CASA Silent Churn" → "Critical for Pakistan: CASA deposits are cheapest funding source (0-5% cost vs. 16%+ for term deposits)"
- "Credit Card Balance Churn" → "Monitor revolving balance trends — Pakistan credit card market PKR 150B+"
- "Improving Cross-Sell Targeting" → "Products-per-customer improvement from 1.8 to 3.0+"
- **Speaker Notes:** "CASA Silent Churn is the single highest-value use case for Pakistani banks. CASA funding cost is 0-5% vs. KIBOR-based term deposits at 16%+. A 10% reduction in CASA churn for a bank with PKR 1.5T CASA book saves PKR 15-20B in funding costs annually. Silent churn detection — identifying customers gradually reducing CASA balances before formal closure — requires behavioral analytics on transaction velocity, salary credit redirection, and balance trajectory. FSDM's ACCT_EVNT and ACCT_BAL entities provide the data foundation."

**Slide 11 (page 4 of 5):**
- "Omni Channel Customer Experience" → "Branch + mobile app + internet banking + WhatsApp + ATM + RAAST — unified experience"
- "Location Based Offers" → "Geo-targeted offers via mobile app near partner merchants, ATM network, branch proximity"
- "Real-time Customer GIS location in Collaboration with Telcos" → "Jazz/Telenor/Zong location data (with consent) for contextualized banking offers"
- "Next Best Product Offer" → "Real-time NBA on mobile app: personal loan pre-approval at salary credit, insurance at account milestone"
- **Speaker Notes:** "Pakistan's omnichannel challenge: Banks operate 1,000+ branches, 16,000+ ATMs, mobile apps, internet banking, call centers, WhatsApp, and now RAAST — but most operate these as separate channels with no unified customer view. A customer who visits a branch for a complaint should not receive a cross-sell SMS the same day. FSDM's CNTCT and EVNT entities capture interactions across all channels enabling coordinated next-best-action. Real-Time Interaction Manager (RTIM) triggers NBA within mobile app sessions based on in-session behavior."

**Slide 12 (page 5 of 5):**
- "Marketing Attribution" → "Multi-touch attribution for Pakistan's media mix: TV (still 40% of ad spend), digital (35% and growing), OOH/print (25%)"
- **Speaker Notes:** "Marketing attribution is emerging as a critical capability as Pakistani banks shift 20-30% of marketing budgets to digital. The challenge: a customer may see a TV ad, click a Facebook ad, visit a branch, and then open an account via mobile app — attributing this conversion to the right touchpoints enables budget optimization. Teradata's attribution analytics capability maps to FSDM Campaign and Marketing entities."

### Slide 13 — What is Marketing & CX + Why Important
**Current:** Generic Teradata text about customer experience
**Enrich:**
- After "Companies today are under increasing competitive pressure" → ADD: "In Pakistan, traditional banks face unprecedented competition from fintechs (JazzCash with 40M+ wallets, SadaPay, NayaPay), digital banking licensees (5 new licenses issued by SBP in 2022), and telecom-led financial services. SBP's National Financial Inclusion Strategy targets 50% financial inclusion by 2028 — banks that deliver superior customer experience will capture the largest share of 70M+ currently unbanked adults."
- After "Customers expect companies to know them" → ADD: "Pakistan's digitally-savvy youth segment (60% of population under 30) expects the same seamless experience from their bank that they get from Daraz, Careem, and foodpanda. Banks unable to deliver personalized, real-time digital experiences will lose this generation to fintech alternatives."
- **Speaker Notes:** "Pakistan banking CX landscape 2024-2025: Customer satisfaction scores for traditional banks average 3.2/5 vs. 4.1/5 for digital-first players. Complaint volumes to SBP Banking Mohtasib increased 25% YoY. Top customer pain points: account opening friction (average 45 minutes at branch), loan processing time (7-14 days), inconsistent cross-channel experience, and lack of personalization. The FSDM-based customer analytics capability addresses all of these through data integration, behavioral analytics, and real-time decisioning."

### Slide 14 — Capability Areas Overview
**Current:** Four capability descriptions
**Enrich each:**
- Customer Information Management → ADD: "In Pakistan: CNIC-anchored identity resolution across core banking (4-5 systems), ECIB credit bureau, RAAST payment identity, mobile wallet accounts, and digital banking registrations — creating a single customer view from FSDM's 600+ Customer domain entities"
- Insight Driven Customer Management → ADD: "Leverage Pakistan's unique data assets: KIBOR-linked product pricing data, RAAST payment networks, CASA behavioral signals, and multi-product holdings to generate actionable insights for the bank's 8-10M+ active customers"
- Customer Lifecycle Management → ADD: "From Asaan Digital Account (simplified KYC) through full banking relationship development — manage 60M+ customer relationships with lifecycle-appropriate engagement strategies"
- Customer Interaction Management → ADD: "Orchestrate billions of annual customer interactions across 1,000+ branches, 16,000+ ATMs, mobile banking (30M+ users), internet banking, WhatsApp, SMS, email, and RAAST notifications"
- **Speaker Notes:** "These four capability areas map directly to FSDM entity domains: Customer Information Management → INDVDL, ORGN, CSTMR entities. Insight Driven → EVNT, ACCT_BAL, TXN entities. Lifecycle Management → AGRMNT, RLTNSHP entities. Interaction Management → CNTCT, CMPGN entities. The BVF framework has 30+ sub-capabilities across these four areas with 360 FSDM entity mappings documented in bvf_fsdm_integration_report.json."

### Slide 15 — Solutions & Enablers
**Current:** Teradata solution component listing (MDM, Customer 360, Celebrus, etc.)
**Enrich:**
- Customer Master File (MDM) → ADD: "CNIC as golden key linking all customer identities across systems"
- Customer 360 (LDM) → ADD: "FSDM-based Logical Data Model with 600+ Customer domain entities supporting full relationship view"
- Event Repository → ADD: "Capturing RAAST transactions, IBFT transfers, POS events, mobile app sessions, branch visits, ATM interactions, call center contacts — billions of events annually"
- Digital Data Integration → ADD: "Mobile app clickstream, internet banking sessions, WhatsApp interactions, push notification responses"
- Customer Profitability → ADD: "KIBOR-based NII calculation + fee income + transaction income - operating cost - risk cost = true customer profit. See profitability_star_schema.sql"
- Real Time Interaction Manager → ADD: "Sub-second decisioning for NBA at point of customer interaction — mobile app, ATM screen, branch teller prompt"
- **Speaker Notes:** "For UBL implementation, the key challenge is integrating 4-5 core banking systems into the FSDM-based Customer 360. The ERwin data model (v13, 3,917 entities) provides the target schema. Priority solution components for Pakistan: (1) MDM with CNIC-based identity resolution, (2) Event Repository capturing RAAST/IBFT/digital events, (3) Customer Profitability engine using FSDM Finance entities, (4) RTIM for mobile app and ATM personalization."

### Slide 16 — Interesting Facts/Stats/Quotes
**Current:** Generic global statistics
**REPLACE with Pakistan-specific banking facts (keep the layout/formatting, replace the content):**
```
Pakistan Banking Customer Analytics Facts (2024-2025)

Pakistan has 60M+ bank accounts but only 30% financial inclusion — 
meaning 100M+ adults are potential new-to-bank customers, representing 
the single largest growth opportunity for data-driven customer acquisition.

100M+ mobile wallet accounts (JazzCash, Easypaisa) are generating 
customer behavioral data that traditional banks lack — creating a 
competitive intelligence gap that must be closed through advanced 
customer analytics.

RAAST instant payment system processes PKR 1.5T+ monthly — generating 
rich transaction network data that reveals customer spending patterns, 
merchant relationships, and social connections invisible in traditional 
banking data.

Pakistan's youth bulge (60% under 30) expects digital-first banking 
experiences. Banks losing this generation to fintech will face 20-year 
competitive disadvantage. Customer analytics must power personalized 
digital engagement to compete.
```
- **Speaker Notes:** "These facts highlight why customer analytics is existential for Pakistan's banking sector. The competition is not just between traditional banks — it's between banks and a rapidly growing fintech ecosystem. Data from SBP Annual Report 2024, SBP Payment Systems Review, and industry analyses. Key metrics to track: products per customer (current 1.8 vs. target 3.0), digital adoption rate (40% and growing), CASA share of deposits (47%), and customer acquisition cost (PKR 3,000-5,000)."

### Slides 17-18 — Public Use Cases
**Current:** Generic global use cases (7-Eleven, Ace Hardware, Hertz, P&G, etc.)
**Enrich by adding Pakistan banking use case references:**

**Slide 17 — Add Pakistan banking examples after existing content:**
```
Pakistan Banking Customer Analytics Use Cases:
Leading Pakistani bank achieved 35% increase in cross-sell conversion 
by deploying next-best-product recommendations at branch point-of-sale.

Major bank reduced CASA silent churn by 20% through behavioral early 
warning models identifying balance decline patterns 60 days before 
dormancy.

Digital bank achieved 80% straight-through account opening using 
CNIC/biometric verification with real-time NADRA validation and 
automated risk scoring.
```

**Slide 18 — Add:**
```
Pakistan Banking Customer Analytics Use Cases:
Banking group increased customer profitability visibility by implementing 
FSDM-based profitability engine calculating NII, fee income, and risk 
cost at individual customer level across all products.

Mobile-first bank achieved 4x higher engagement rates through real-time 
personalization on mobile app — delivering contextual offers based on 
transaction patterns, location, and time-of-day.
```
- **Speaker Notes:** "These Pakistan examples are composites based on industry implementations. The key message: the same customer analytics capabilities proven globally are now being deployed in Pakistan's banking sector, with local adaptations for CNIC-based identity, RAAST-based payment data, and the unique challenges of a market with 70% unbanked population. The FSDM provides the data foundation that makes these use cases implementable."

### Slide 19 — "Are You Able To…" Questions
**Current:** 7 generic capability questions
**REPLACE with Pakistan-banking-specific questions (same format/layout):**
```
Are You Able To…

Identify which channel each customer prefers — branch, mobile app, 
internet banking, ATM, WhatsApp, or RAAST — and deliver personalized 
experiences through their preferred touchpoint?

Predict which product each customer is most likely to adopt next — 
from CASA to term deposit, personal loan, credit card, bancassurance, 
or home finance — and when they are most receptive to the offer?

Detect CASA silent churn — customers gradually redirecting salary 
credits and reducing balances — 60-90 days before the account goes 
dormant, enabling proactive retention intervention?

Analyze Urdu and English text from call center recordings, branch 
visit notes, social media, and Banking Mohtasib complaints to 
understand customer sentiment and service quality?

Deliver real-time next-best-action recommendations within the mobile 
app session — triggered by customer context (salary credit, large 
payment, end-of-month balance, proximity to branch/ATM)?

Measure the true profitability of each customer across all products 
— calculating KIBOR-based NII, fee income, transaction income, 
operating cost, and IFRS 9 risk cost at the individual level?

Attribute customer acquisition and product adoption across marketing 
touchpoints — TV, digital, SMS, WhatsApp, branch referral — to 
optimize the bank's PKR 500M+ annual marketing spend?
```
- **Speaker Notes:** "These questions are calibrated for Pakistan banking maturity — most banks will answer 'No' or 'Partially' to most questions. This creates the diagnostic opening for BVF-based capability building. Each question maps to specific BVF sub-capabilities and FSDM entities that enable the answer. The profitability question links directly to the Customer Profitability Engine and profitability_star_schema.sql in the gap extensions."

### Slide 20 — Challenges
**Current:** Generic challenge text (Robust View, Customer Journeys, Real Time Relevance, Interaction Management)
**Enrich each challenge with Pakistan context:**

- **Robust View of Customer** → ADD after existing text: "In Pakistan, this challenge is amplified by 4-5 core banking systems per bank, separate systems for Islamic and conventional banking, mobile wallet data sitting with telcos (Jazz, Telenor), and ECIB credit bureau data accessible only in batch. CNIC provides the golden key but identity resolution across systems requires sophisticated MDM capabilities. FSDM's INDVDL entity hierarchy provides the target data model."

- **Understanding Customer Journeys** → ADD: "Pakistan's customer journeys span unique touchpoints: RAAST payment notifications, JazzCash bill payments, branch cash deposits (still 40% of transactions), WhatsApp banking inquiries, and biometric ATM authentication. These interactions must be captured as FSDM Event entities to enable journey analytics."

- **Real Time Relevance** → ADD: "Real-time capability is critical as Pakistan's digital banking transactions grow 40% YoY. When a customer receives a salary credit via RTGS, the bank has a 30-minute window to offer a personal loan or term deposit before the money moves to a competitor. FSDM's Event entities combined with Teradata's RTIM enable sub-second decisioning."

- **Interaction Management At Scale** → ADD: "Pakistan's major banks manage 8-10M+ active customers across 1,000+ branches, 16,000+ ATMs, 30M+ mobile banking users, and billions of RAAST/IBFT transactions. Coordinating personalized interactions at this scale — while respecting SBP Fair Treatment guidelines and PTA communication regulations — requires an enterprise-grade interaction management platform."

- **Speaker Notes:** "The four challenges map to the four capability areas: Customer Information Management addresses the data challenge, Insight Driven Management addresses the analytics challenge, Real-Time Relevance addresses the technology challenge, and Interaction Management addresses the operational challenge. For Pakistan, the data challenge is most acute — with 4-5 core systems, separate Islamic banking systems, and digital channel data scattered across platforms. FSDM's 3,917 entities provide the integration blueprint."

### Slide 21 — Value of Marketing and Customer Experience
**Current:** Five value propositions (Insights, Communication, Experience, Marketing, Operations)
**Enrich each:**

- **Improved customer insights** → ADD: "For Pakistan: Transform fragmented customer data from multiple core banking systems into actionable insights — understanding each of the bank's 8-10M customers' complete financial behavior, product needs, channel preferences, and profitability contribution."

- **More personalized, relevant communication** → ADD: "Move from mass SMS blasts (90% ignored) to personalized communications via preferred channel (WhatsApp, push notification, in-app) with relevant product recommendations based on behavioral analytics. Target: 3x improvement in campaign response rates."

- **Improved customer experience** → ADD: "Close the CX gap between traditional banks (3.2/5 satisfaction) and fintech players (4.1/5). Eliminate the top customer pain points: long account opening times, slow loan processing, inconsistent cross-channel experience, and irrelevant product pushing."

- **More effective marketing investments** → ADD: "Optimize the bank's PKR 500M+ annual marketing budget through multi-touch attribution, campaign performance analytics, and ROI-based budget allocation — shifting from gut-feel spending to data-driven investment with measurable returns."

- **Improved operational processes** → ADD: "Identify and eliminate broken customer journeys — such as the 40% drop-off in digital loan applications, 25% of branch visits that result in customer complaints, and the 30-day average for processing simple account changes."

- **Speaker Notes:** "Combined value opportunity for a top-5 Pakistani bank: PKR 10-15B in CASA churn reduction, PKR 3-5B in improved cross-sell revenue, PKR 1-2B in marketing efficiency, PKR 2-3B in operational cost reduction through digital migration. Total: PKR 15-25B annual value from customer analytics investment. ROI on FSDM-based customer data warehouse: 5-10x within 3 years."

### Slide 22 — Section Divider ("Marketing and Customer Experience Capabilities")
**Current:** Section divider with title
**Enrich:**
- Add subtitle: "Detailed Capability Assessment and Maturity Framework"
- **Speaker Notes:** "The following slides detail each capability area with Pakistan-specific context. Use these in conjunction with the BACR assessment (bacr_analysis_report.json) to evaluate current maturity and define the roadmap. Target: move from Level 1-2 (typical Pakistani bank) to Level 3-4 within 24-36 months."

### Slide 23 — Customer Information Management Detail
**Current:** CIM definition + 3 "Why is it important" points
**Enrich:**
- After "Companies need to capture and reconcile multiple customer identifiers" → ADD: "In Pakistan, customer identifiers include: CNIC (13-digit NADRA number), mobile numbers (070x/030x/031x), email, biometric (NADRA fingerprint), RAAST ID (mobile number as payment alias), account numbers across multiple core banking systems, and mobile wallet IDs. FSDM's INDVDL_IDNTFCTN entity resolves all identifiers to a single customer record."

- After "traditional and digital data sources must be brought together" → ADD: "Pakistan's data landscape includes: 4-5 core banking system databases, card management system (POS/ATM transactions), internet banking logs, mobile app clickstream, RAAST/IBFT transaction data, ECIB credit bureau data, NADRA CNIC verification data, and branch/call center interaction logs. The FSDM Customer 360 integrates all sources through the Customer domain entity hierarchy."

- After "Companies need to deliver real-time, contextually relevant experiences" → ADD: "With RAAST enabling instant payments and mobile app sessions averaging 3-5 minutes, contextual relevance must be delivered within seconds. FSDM's Event entities (CSTMR_EVNT, ACCT_EVNT) capture real-time signals that trigger personalized interactions through Teradata's Real-Time Interaction Manager."

- **Speaker Notes:** "Customer Information Management is the foundational capability — everything else depends on having accurate, complete, timely customer data. For UBL, the immediate priority is CNIC-based identity resolution across core banking systems using FSDM's Party model. The ERwin model (v13) already implements 600+ Customer domain entities from FSDM. Key challenge: integrating Islamic banking customer data (separate core system) with conventional banking data into a single customer view."

---

## Global Enhancement Guidelines

### Add to ALL Slides Where Relevant:
1. **FSDM Entity References:** Mention specific FSDM entities (INDVDL, ORGN, CSTMR, ACCT, EVNT, TXN, CNTCT, CMPGN) that support each capability
2. **Pakistan Market Data (2024-2025):**
   - Banking accounts: 60M+
   - Mobile wallets: 100M+ (JazzCash, Easypaisa)
   - RAAST monthly volume: PKR 1.5T+
   - Financial inclusion: 30% (target 50% by 2028)
   - Digital banking growth: 40% YoY
   - Youth population: 60% under 30
   - Products per customer: 1.8 (vs. 4-5 in mature markets)
   - CASA share: 47% of deposits
   - SBP policy rate: 17.5% (KIBOR ~17.8%)
3. **Competitor Landscape:** JazzCash (40M+), Easypaisa (30M+), SadaPay, NayaPay, Bank Alfalah (digital leader), HBL (largest branch network), MCB (digital transformation)
4. **SBP Regulatory Context:** Fair Treatment of Consumers, Digital Banking Regulations 2022, NFIS 2028, Data Protection Guidelines
5. **Update all timeframes** from generic to "2025-2026"

### Speaker Notes for Every Slide Must Include:
- FSDM entity references supporting the capability
- BACR maturity assessment context (Level 1-2 typical for Pakistani banks)
- BVF sub-capability mapping
- Pakistan-specific implementation considerations
- Quantified business value where possible

---

## Quality Assurance

After repacking, verify:
1. All 23 slides enriched with Pakistan banking context
2. Every slide has speaker notes with FSDM entity references
3. Slide 16 statistics updated to Pakistan-specific 2024-2025 data
4. Slide 19 questions rewritten for Pakistan banking
5. No Teradata content deleted — only enhanced
6. No formatting corruption (images, layouts, shapes preserved)
7. Visual QA using soffice + pdftoppm on all 23 slides
