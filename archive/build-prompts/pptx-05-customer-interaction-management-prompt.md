# PROMPT 6J: File 05 — Customer Interaction Management

## Role

You are a senior banking marketing technology consultant and presentation specialist. You are rebuilding BVF PowerPoint File 05, which covers all 15 Customer Interaction Management (CIM) capabilities — from Communication Targeting through Brand Analytics. You have deep expertise in Pakistan's banking marketing landscape, digital channel ecosystem, SBP consumer protection regulations, and omni-channel customer engagement.

---

## Source File

```
INPUT:  ./05_Customer_Interaction_Management.pptx  (30 slides — ALL have full content)
OUTPUT: ./pptout/05_Customer_Interaction_Management_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 30 slides contain complete Teradata BVF content. 15 capabilities × 2 slides each (Capability Detail + Maturity Table).

**Work required:**
1. Add Pakistan banking context to every capability slide
2. Add Global/Regional layering
3. Update all "H1 2018" → 2025-2026
4. Update maturity assessments for Pakistan banking reality
5. Map FSDM entities to each capability
6. Fix content overflow in dense table slides
7. Move detailed content to speaker notes
8. Add 3 new supplementary slides
9. Remove/replace all Teradata branding

---

## Reference Data — Read Before Starting

```
./OVERVIEW.md                                       # Pipeline context
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM entity mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json              # BACR maturity questions
```

---

## EXISTING SLIDE STRUCTURE (30 Slides)

15 capabilities, each with Capability Detail (odd slide) + Maturity Table (even slide):

| Slides | Capability | Pakistan Focus Area |
|--------|-----------|-------------------|
| 1-2 | Communication Targeting | SMS/WhatsApp/push targeting in high-volume PK market |
| 3-4 | Contact Optimization | Managing SMS fatigue; SBP opt-in rules |
| 5-6 | Response Optimization | A/B testing across SMS, push, in-app; mobile-first response |
| 7-8 | Cross-Channel Customer Experience | Branch/ATM/mobile/USSD/agent/WhatsApp integration |
| 9-10 | Contextual Decisioning | Location, transaction context; branch-to-digital handoff |
| 11-12 | Call/Contact Center Optimization | Urdu/English bilingual; IVR, WhatsApp chat, complaint SLAs |
| 13-14 | Digital Optimization | Mobile app UX; internet banking; USSD for feature phones |
| 15-16 | Search Engine Optimization | Urdu + English search; Google.pk; Islamic banking keywords |
| 17-18 | Personalization | 1:1 vs segment SMS; Islamic calendar personalization |
| 19-20 | Next Best Action Arbitration | Real-time NBA at branch counter, in-app, contact center |
| 21-22 | Product Recommendation | Salary-triggered, life-stage, Islamic preference recs |
| 23-24 | Multi-Step Campaigns | Ramadan, Eid, Hajj seasonal sequences; onboarding drips |
| 25-26 | Marketing Effectiveness | Campaign ROI measurement; limited budgets |
| 27-28 | Marketing Attribution | Multi-channel attribution: branch + digital + agent + ATL |
| 29-30 | Brand Analytics | Brand strength vs fintech challengers; digital brand metrics |

All slides: Current maturity = **Developing**, Desired = **Innovating** (consistent across file)

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"Customer Interaction Management — At a Glance"**

| | 🌍 Global | 🌏 South Asia & ME | 🇵🇰 Pakistan |
|---|---|---|---|
| Marketing automation adoption | 75% of top banks | 35% | <15% |
| Real-time NBA capability | 55% of digital banks | 15% | <5% |
| Omni-channel orchestration | 60% | 20% | <10% |
| Avg campaign cycle time | 2-5 days | 1-3 weeks | 2-6 weeks |
| Primary outbound channel | Email + push | SMS + email | SMS (90%+) |
| Personalization level | 1:1 dynamic | Segment-based | Broadcast/mass |

Info bar:
```
BVF Sub-capabilities: 15 | FSDM Entities: ~100+ (Marketing, Channel, Interaction domains)
BACR Questions: ~85 | Maturity: Developing → Innovating
```

### NEW Slide B: Pakistan Market Context (insert as slide 2)

**"🇵🇰 Pakistan — Customer Interaction Landscape"**

Channel Reach & Effectiveness:
```
┌─────────────────────────────────────────────────────────────┐
│ Channel        │ Reach      │ Open Rate │ Cost/Contact │ Trend │
│ SMS            │ 98% mobile │ 15-25%   │ PKR 0.5-1    │ Flat  │
│ Push Notif.    │ 30% app    │ 5-12%    │ Free         │ ↑↑    │
│ WhatsApp Biz   │ 60% smart  │ 70-85%   │ PKR 2-5      │ ↑↑↑   │
│ Email          │ 15% active │ 3-8%     │ PKR 0.1      │ Flat  │
│ In-App Message │ 30% app    │ 20-40%   │ Free         │ ↑↑    │
│ Branch/RM Call │ 100%       │ N/A      │ PKR 100-500  │ ↓     │
│ IVR/Call Center│ 98% mobile │ N/A      │ PKR 50-100   │ Flat  │
│ Agent Network  │ Rural 80%  │ N/A      │ PKR 50-150   │ ↑     │
└─────────────────────────────────────────────────────────────┘
```

Key Constraints:
- SBP Consumer Protection: Opt-in required for marketing; complaint SLA mandated
- PTA Regulations: Bulk SMS requires licensed gateway; spam restrictions
- Language: Urdu primary (65%), English (30%), Regional (5%) — bilingual content required
- Digital Literacy: Tier 1 cities digital-first; Tier 3/rural SMS + agent dependent
- Marketing Budget: Pakistan banks spend 1-2% of revenue on marketing (vs. 3-5% global)

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Customer Interaction Management — Implementation Roadmap"**

```
Phase 1: Foundation (0-6 months)
  • Unified contact history across SMS, email, push, branch, call center
  • Basic contact policy (frequency caps, opt-in/out management)
  • SMS campaign platform upgrade with A/B testing capability
  • WhatsApp Business API integration for transactional messages
  Investment: PKR 40-80M | Quick Win: 30% reduction in contact fatigue complaints

Phase 2: Intelligence (6-18 months)
  • Customer Data Platform (CDP) integrating all interaction channels
  • Segment-based personalization engine (value tier × channel × product)
  • Multi-step campaign automation (onboarding, cross-sell, seasonal)
  • Contact center AI: sentiment analysis on call recordings
  Investment: PKR 100-200M | Expected: 2x campaign response rates

Phase 3: Real-Time (18-36 months)
  • Real-time Next Best Action across all channels
  • 1:1 personalization with ML-based recommendation engine
  • Contextual decisioning (in-branch, in-app, at-ATM)
  • Marketing attribution model (multi-touch, cross-channel)
  • Closed-loop marketing effectiveness measurement
  Investment: PKR 150-300M | Expected: 3x marketing ROI, 8-12% cross-sell response
```

---

## SLIDE-BY-SLIDE ENRICHMENT

### SLIDES 1-2: Communication Targeting

**Pakistan context to ADD on slide:**
- "Build reusable target segments for Pakistan's key customer dimensions: value tier, Islamic preference, channel preference (branch/digital/agent), geographic tier, life stage"
- "Integrate SBP opt-in/opt-out database for compliant targeting"
- "Create specialized segments for seasonal campaigns: Ramadan, Eid, Hajj, tax season, harvest season"
- "Leverage CNIC-based household targeting for family product bundles"

**Speaker Notes:**
```
GLOBAL: Marketing automation platforms (Salesforce, Adobe, Pega) enable real-time micro-segmentation with 1,000+ attributes. Leading banks target at individual level using ML propensity models.

REGIONAL:
- India: Banks use Aadhaar + UPI data for hyper-targeting. WhatsApp Business API widely adopted. RBI mandates opt-in but enforcement varies.
- Saudi: SAMA requires explicit consent. Banks use NID-linked data. Arabic + English bilingual targeting standard.
- UAE: High digital penetration enables email + push + in-app targeting. PDPL (Personal Data Protection Law 2021) constrains data usage.

PAKISTAN: Communication targeting is predominantly broadcast:
- 90%+ of bank marketing is untargeted bulk SMS via licensed gateways
- Very few banks have segment-based targeting — most campaigns go to entire customer base
- SBP Consumer Protection requires opt-in but enforcement is weak
- PTA restricts bulk SMS to licensed aggregators — adds cost and latency
- No bank in Pakistan has real-time micro-targeting capability
- WhatsApp Business emerging as high-engagement channel but limited bank adoption

Key opportunity: Pakistan's CNIC provides a unique targeting advantage — family/household targeting via CNIC prefix + address matching enables product bundle offers that generic targeting cannot achieve.

FSDM: SGMNT (Segment), TRGT (Target), CMPGN_TRGT (Campaign Target), AUDNC (Audience), CHNL_PREF (Channel Preference), OPT_IN (Opt-In), EXCL (Exclusion)
```

---

### SLIDES 3-4: Contact Optimization

**Pakistan context:**
- "Critical in Pakistan where customers receive 5-10 promotional SMS daily — severe contact fatigue"
- "Implement frequency caps: max 3 promotional SMS/week, max 1 outbound call/month per customer"
- "Respect Ramadan timing: no marketing calls during sehri/iftar windows"
- "Differentiate SBP-mandated communications (security alerts, OTP) from marketing contacts"
- "Agent network contacts must also be governed — prevent agent from over-soliciting financial inclusion customers"

**Speaker Notes:**
```
PAKISTAN CONTACT FATIGUE: Pakistan has one of the worst SMS spam environments globally:
- Average bank customer receives 5-10 promotional SMS daily from their own bank + competitors
- PTA has attempted regulation but enforcement is limited
- Customer backlash: many block bank SMS, missing critical security/OTP messages
- SBP Consumer Protection: increasing complaints about unsolicited marketing

Best practice for Pakistan banks:
1. Separate transactional (OTP, balance alert, transaction receipt) from promotional channels
2. Cap promotional SMS: max 3/week per customer, max 1 per product per month
3. Time-gate: no promotional messages before 9AM or after 9PM
4. Ramadan rules: no calls during sehri (3-5 AM) or iftar (6:30-7:30 PM)
5. Friday prayers: no outbound calls 12:30-2:30 PM on Fridays
6. Eid blackout: no promotional activity during Eid holidays (focus on greetings only)

FSDM: CNTCT_PLCY (Contact Policy), CNTCT_RL (Contact Rule), FRQNCY_CAP (Frequency Cap), RCNCY_RL (Recency Rule), CHNL_CNTRL (Channel Control), BLK_LST (Block List), SPRSN (Suppression)
```

---

### SLIDES 5-6: Response Optimization

**Pakistan context:**
- "Optimize for SMS response (primary channel): test message length, Urdu vs English, timing, CTA format"
- "A/B test WhatsApp rich media (images, buttons, carousels) vs. plain SMS"
- "Measure response by day-of-week and time-of-day (Pakistan patterns: highest engagement post-iftar during Ramadan, post-salary on 1st-5th of month)"
- "Track response-to-conversion funnel: SMS → app open → product page → application → approval"

**Speaker Notes:**
```
PAKISTAN RESPONSE PATTERNS:
- Highest SMS open rates: 10 AM-12 PM, 4 PM-6 PM, 9 PM-10 PM
- Best days: Tuesday-Thursday for product offers; Saturday for lifestyle/investment
- Salary trigger: 1st-5th of month — highest response to lending/investment offers
- Ramadan: Post-iftar (7:30-10 PM) is peak engagement window
- Eid: Gift-card and remittance promotions peak in the 5 days before Eid
- Language: Urdu SMS gets 15-20% higher response in Tier 2/3 cities; English preferred in Tier 1 professional segment

Current industry benchmarks (Pakistan banking):
- SMS response rate: 1-3% (vs. 5-10% global best practice)
- Push notification response: 3-8%
- WhatsApp response: 15-30% (highest performing channel)
- Email response: 0.5-2% (low email culture)
- In-app message conversion: 5-15% (small but engaged audience)

FSDM: CMPGN_RSPNS (Campaign Response), CNVRSN (Conversion), RSPNS_RT (Response Rate), AB_TST (A/B Test), CMPGN_KPI (Campaign KPI), CMPGN_MTRC (Campaign Metric)
```

---

### SLIDES 7-8: Cross-Channel Customer Experience

**Pakistan context:**
- "Integrate 7 customer channels: branch (16K+), ATM (16K+), mobile app, internet banking, USSD, contact center, agent network (500K+ agents)"
- "Enable branch-to-digital handoff: customer starts product application in branch, completes on mobile app"
- "USSD channel critical for feature phone users (30-40% of mobile users in rural Pakistan)"
- "Agent-to-bank handoff: financial inclusion customer opens account via agent, transitions to branch/digital banking"
- "WhatsApp as emerging channel — conversational banking for account inquiry, mini-statements, support"

**Speaker Notes:**
```
PAKISTAN CHANNEL LANDSCAPE (unique characteristics):
1. BRANCH (16,000+): Still dominant for relationship banking, complex products (home finance, trade), elderly customers, cash transactions
2. ATM (16,000+): Cash withdrawal primary use; balance inquiry; mini-statement. Limited marketing capability (some ATM screen ads)
3. MOBILE APP: Fastest growing — 30%+ of customers. Fund transfer (RAAST/IBFT), bill payment, balance. Push notification marketing
4. INTERNET BANKING: Corporate segment primary. Retail adoption lower than mobile
5. USSD: Critical for feature phones. JazzCash/Easypaisa primarily USSD-based. Simple menu-driven banking
6. CONTACT CENTER: Urdu/English bilingual. IVR for routine queries. Human agents for complaints, disputes. SBP mandates response SLAs
7. AGENT NETWORK: 500,000+ branchless banking agents. Primary financial inclusion channel. Cash-in/cash-out, utility payments, account opening

Cross-channel gaps in Pakistan:
- NO unified interaction view: branch system doesn't know about mobile app actions and vice versa
- NO consistent customer experience: branch RM has no visibility into customer's digital behavior
- NO channel handoff: product applications in branch cannot be resumed on mobile
- Customer data in SILOS: branch visits logged in CBS, mobile events in app backend, contact center in CRM, agent transactions in wallet system

FSDM: CHNL (Channel), CHNL_INTN (Channel Interaction), OMNI_CHNL (Omni-Channel), CHNL_SWTCH (Channel Switch), CSTMR_JRNY (Customer Journey), TCHPNT (Touchpoint)
```

---

### SLIDES 9-10: Contextual Decisioning

**Pakistan context:**
- "Branch context: when customer walks in, RM sees 360° view + recommended offer based on recent transactions"
- "ATM context: display relevant offer on ATM screen based on last transaction (e.g., salary credit → loan offer)"
- "Mobile app context: push offer triggered by in-app behavior (browsing investment page → mutual fund recommendation)"
- "RAAST/IBFT context: large transfer detected → instant follow-up (wealth management if inbound, retention if outbound)"
- "Location context: near merchant partner → instant cashback offer via push notification"

**Speaker Notes:**
```
PAKISTAN CONTEXTUAL OPPORTUNITIES:
1. SALARY CONTEXT: When salary credits on 1st-5th → within 2 hours, push pre-approved personal loan or credit card offer
2. RAMADAN CONTEXT: During Ramadan, shift all financial planning offers to post-iftar window, promote Zakat calculator, Islamic investment
3. REMITTANCE CONTEXT: When inbound RAAST/wire from Gulf → trigger Roshan Digital Account products, property investment offers
4. TRAVEL CONTEXT: International transaction detected → travel insurance, forex card, lounge access offer
5. BRANCH CONTEXT: Customer visits branch → RM tablet shows: recent app usage, last complaint, pending offers, recommended products
6. COMPLAINT CONTEXT: After complaint resolution, suppress marketing for 14 days, then send satisfaction survey + goodwill offer

Current state: <5% of Pakistan banks have ANY contextual decisioning capability. Most marketing is batch-driven, context-free SMS blasts.

FSDM: DCSNNG (Decisioning), CNTXT (Context), RL_TM_DCSNNG (Real-Time Decisioning), EVNT_TRGR (Event Trigger), OFFR_PRTZTN (Offer Prioritization), NBA (Next Best Action)
```

---

### SLIDES 11-12: Call/Contact Center Optimization

**Pakistan context:**
- "Optimize Urdu/English bilingual IVR — reduce menu depth from 5+ levels to 3 levels"
- "Deploy Urdu NLP for call transcription and sentiment analysis on recorded calls"
- "Integrate WhatsApp chatbot for Tier 1 queries: balance, mini-statement, branch locator, complaint status"
- "Comply with SBP complaint resolution SLAs: acknowledgment within 2 business days, resolution within 15 days"
- "Build call center cross-sell: equip agents with Next Best Offer based on customer profile during inbound calls"

**Speaker Notes:**
```
PAKISTAN CONTACT CENTER LANDSCAPE:
- Average Pakistan bank call center: 200-500 agents, handling 50,000-200,000 calls/month
- Urdu is primary language (65% of calls), English (30%), Regional (5% — Sindhi, Pashto, Punjabi)
- IVR completion rate: ~40% (low — too many menu levels, Urdu language quality poor)
- First call resolution: ~55-65% (vs. 75-85% global benchmark)
- Average handle time: 5-7 minutes (vs. 3-4 minute benchmark)
- SBP mandates: complaint acknowledgment within 2 business days, resolution within 15 business days

Key improvements for Pakistan banks:
1. URDU IVR REDESIGN: Simplify to 3-level menu, natural language Urdu prompts, voice biometric authentication
2. WHATSAPP DEFLECTION: Route simple queries to WhatsApp chatbot — reduce call volume by 20-30%
3. SENTIMENT ANALYSIS: Deploy Urdu NLP on call recordings to detect dissatisfaction patterns
4. AGENT ASSIST: Real-time screen pop with customer 360°, recent transactions, recommended offers
5. CALLBACK SCHEDULING: Instead of hold queues, offer scheduled callback — especially during peak post-salary period (1st-5th)

FSDM: CNTCT_CTR (Contact Center), IVR (Interactive Voice Response), AGNT (Agent), CALL (Call), CALL_LOG (Call Log), CMPLNT (Complaint), SNTMNT (Sentiment), RSLUTN (Resolution)
```

---

### SLIDES 13-14: Digital Optimization

**Pakistan context:**
- "Optimize mobile banking app UX for Pakistan's 3 user personas: Digital Native (18-30), Digital Adopter (30-50), Digital Hesitant (50+)"
- "Design for low-bandwidth environments — Tier 3/rural Pakistan has 3G/Edge connectivity"
- "USSD optimization for 30-40% of mobile users on feature phones — streamline menu flows"
- "Reduce mobile app session-to-conversion dropoff — current: 80%+ browsing but <5% complete a product application"
- "Urdu-first mobile UI with English toggle — current apps are English-only, alienating 65%+ of market"

**Speaker Notes:**
```
PAKISTAN DIGITAL BANKING UX CHALLENGES:
1. DEVICE FRAGMENTATION: Low-end Android devices dominate (Xiaomi, Samsung J-series, Infinix) — apps must work on 2GB RAM
2. CONNECTIVITY: 4G coverage ~60%, 3G ~25%, 2G ~15%. App must function on slow networks
3. LANGUAGE: Apps are predominantly English-only — excluding 65%+ of potential digital banking customers
4. DIGITAL LITERACY: First-time smartphone users in Tier 2/3 need simplified UI with visual guides
5. TRUST: Many users fear digital banking — prominent security messaging, transaction confirmations needed
6. COMPETITOR BENCHMARK: SadaPay/NayaPay apps are polished, fast, Urdu-supported — traditional bank apps feel dated

Optimization priorities:
- App size: <30MB (vs. current 60-100MB for many bank apps)
- Startup time: <3 seconds on mid-range device
- Key action completion: Transfer/bill payment in <5 taps
- Urdu language: Full Urdu UI (not just translated English)
- Offline capability: Show cached balance, recent transactions

FSDM: DGTL_CHNL (Digital Channel), MBL_APP (Mobile App), WEB_APP (Web Application), USSD (USSD Channel), UI_EVNT (UI Event), SSSN (Session), PG_VW (Page View), CLCKSTRM (Clickstream)
```

---

### SLIDES 15-16: Search Engine Optimization

**Pakistan context:**
- "Optimize for Google.pk search in both Urdu and English — Pakistan's bilingual search behavior"
- "Target high-intent banking keywords: 'best savings account Pakistan', 'Islamic bank account', 'personal loan interest rate', 'car leasing Pakistan'"
- "Build Urdu content SEO — growing Urdu internet usage but most banking content is English-only"
- "Optimize Google My Business for 16,000+ branch locations — critical for 'bank near me' searches"
- "Islamic banking keyword strategy: 'halal investment', 'Islamic car financing', 'Shariah compliant savings'"

**Speaker Notes:**
```
PAKISTAN SEO LANDSCAPE:
- Google dominates search (96% market share in Pakistan)
- Banking-related searches growing 30% YoY
- Top banking searches: "savings account interest rate Pakistan", "personal loan Pakistan", "Islamic bank Pakistan", "SBP prize bond result"
- Urdu search growing — Google supports Urdu search queries, but very few banks have Urdu-optimized web content
- Local SEO critical: "bank near me" and "[bank name] [city] branch" are high-volume queries

Pakistan-specific SEO opportunities:
1. ISLAMIC BANKING: "halal investment", "Islamic car financing", "Shariah-compliant savings" — high intent, low competition
2. FINANCIAL INCLUSION: "easy bank account", "mobile banking kaise kholein" (Urdu: how to open mobile banking)
3. REMITTANCE: "send money to Pakistan", "Pakistan remittance rates" — target diaspora
4. ROSHAN DIGITAL: "Roshan Digital Account", "NRP banking Pakistan" — overseas Pakistanis
5. SEASONAL: "Hajj savings plan", "Eid loans", "Ramadan banking offers" — calendar-driven SEO

FSDM: SRCH_ENGNR (Search Engine), KYWD (Keyword), WEB_PG (Web Page), CNTNT (Content), SRCH_RNKNG (Search Ranking), ORGNC_TRFC (Organic Traffic)
```

---

### SLIDES 17-18: Personalization

**Pakistan context:**
- "Move from broadcast SMS (current: same message to 10M+ customers) to segment-based (100s) to 1:1 (millions of unique messages)"
- "Personalize by Islamic preference: Shariah-compliant product recommendations for Islamic-preference customers"
- "Personalize by language: Urdu for mass market, English for corporate/HNW, bilingual for young professionals"
- "Personalize by life stage: student offers for 18-22, salary account for new professionals, home finance for 30-40"
- "Personalize greeting and content for Islamic calendar: Ramadan, Eid, Shab-e-Qadr, Hajj period"

**Speaker Notes:**
```
PAKISTAN PERSONALIZATION GAP:
Current state: 90%+ of Pakistan bank marketing is mass broadcast — identical SMS to entire customer base.
- Same credit card offer sent to salaried employees, students, and retirees
- No language personalization — all English, alienating Urdu-preferred customers
- No Islamic calendar awareness — marketing continues unchanged during Ramadan
- No value-tier differentiation — mass market customers get same message as HNW

Personalization opportunity layers:
Layer 1 (Basic): Name + product holding → "Dear [Name], upgrade your [Current Card] to Platinum"
Layer 2 (Segment): Value tier + channel pref → Different message for affluent (RM call) vs. mass (SMS)
Layer 3 (Behavioral): Recent actions → "We noticed you checked auto loans — here's a pre-approved offer"
Layer 4 (Contextual): Time + location + event → Post-salary, near partner merchant, during Ramadan
Layer 5 (Predictive): ML model → "Based on your profile, 85% likelihood of interest in mutual funds"

No Pakistan bank has reached Layer 3+. Top 5 banks are at Layer 1-2.

FSDM: PRSN (Personalization), PRSN_RL (Personalization Rule), CSTMR_PRFL (Customer Profile), SGMNT (Segment), CNTT_VRNT (Content Variant), DYNMC_CNTNT (Dynamic Content)
```

---

### SLIDES 19-20: Next Best Action Arbitration

**Pakistan context:**
- "Deploy NBA at 3 critical touchpoints: branch (RM tablet), mobile app (in-session), contact center (agent screen)"
- "Arbitrate across competing offers: retention vs. cross-sell vs. upsell vs. service recovery — prioritize by customer value and context"
- "Include Islamic product alternatives in every arbitration — always present Shariah-compliant option alongside conventional"
- "Factor in SBP regulatory constraints: cooling-off periods, product suitability requirements"
- "Real-time NBA for RAAST/IBFT triggers: instant personalized message within seconds of transaction"

**Speaker Notes:**
```
PAKISTAN NBA STATE:
No Pakistan bank currently has real-time NBA capability. Current state:
- Branch: RM relies on personal knowledge and monthly target sheets (no data-driven recommendations)
- Mobile app: Generic product banners, not personalized to individual customer
- Contact center: Agent has basic customer info but no recommended actions
- ATM: No personalized offers on ATM screen
- SMS: Batch campaigns, not triggered by individual events

NBA implementation for Pakistan banks:
1. DATA FOUNDATION: Unified customer 360° with product holdings, transactions, interactions, profitability
2. MODEL LAYER: Propensity models for each product (credit card, loan, insurance, investment), churn model, value model
3. ARBITRATION ENGINE: Prioritize offers based on: customer value × propensity × offer value × business priority × contact policy
4. DELIVERY: Real-time API serving recommendations to branch tablet, mobile app, contact center screen, ATM, SMS/push
5. FEEDBACK LOOP: Response data feeds back into models for continuous optimization

Expected impact for Pakistan banks:
- Branch cross-sell: from <5% to 15-20% response rate when RM has data-driven recommendation
- Contact center: from zero cross-sell to 5-8% conversion on inbound calls
- Mobile app: from <1% banner click to 5-10% personalized offer engagement

FSDM: NBA (Next Best Action), OFFR_ARBTTN (Offer Arbitration), PRPTY (Priority), PRPNSTY_MDL (Propensity Model), OFFR_DLVRY (Offer Delivery), OFFR_RSPNS (Offer Response), FDBCK (Feedback)
```

---

### SLIDES 21-22: Product Recommendation

**Pakistan context:**
- "Recommend based on product affinity pipeline: CASA → Debit Card → Credit Card → Personal Loan → Auto → Home → Insurance → Investment"
- "Include Islamic alternatives in every recommendation (conventional + Islamic option)"
- "Salary-triggered recommendations: detect salary credit → recommend lending/investment products within 24 hours"
- "Life-event recommendations: marriage → home finance; child → education savings; Hajj intent → Hajj savings plan + Takaful"
- "Diaspora recommendations: remittance pattern → Roshan Digital Account → Naya Pakistan Certificate → property investment"

**Speaker Notes:**
```
PAKISTAN PRODUCT RECOMMENDATION MATRIX:
Based on customer triggers and context:

| Trigger | Recommended Products |
|---------|---------------------|
| First salary credit | Credit card, personal loan pre-approval, auto finance pre-qual |
| Balance >PKR 500K | Priority banking, mutual funds, government securities |
| Balance >PKR 5M | Wealth management, private banking, Naya Pakistan Certificate |
| Marriage indicators | Home finance, life insurance, joint account, family Takaful |
| Child school fee payment | Education savings plan, child insurance, education loan |
| Hajj savings opened | Travel Takaful, forex card, Hajj package financing |
| International remittance | Roshan Digital Account, NPC, PKR fixed deposit, property funds |
| Business account active | Working capital, trade finance, business credit card, payroll |
| Islamic preference signal | Islamic CASA, Diminishing Musharaka, Ijarah, Sukuk, Takaful |
| First RAAST transaction | Digital banking features, QR payments, bill payment auto-debit |

FSDM: PRDCT_RCMND (Product Recommendation), PRDCT_AFFNTY (Product Affinity), RCMND_ENGN (Recommendation Engine), CSTMR_PRDCT (Customer Product), PRDCT_HLDNG (Product Holding), PRDCT_GAP (Product Gap)
```

---

### SLIDES 23-24: Multi-Step Campaigns

**Pakistan context:**
- "Design Ramadan multi-step: Day 1 Zakat calculator → Day 10 Islamic investment → Day 20 Sadaqah/charity → Day 27 Shab-e-Qadr special → Eid Mubarak greetings + Eid shopping offer"
- "90-day onboarding sequence: Welcome → First transaction → Card activation → App download → Cross-sell → Loyalty enrollment"
- "Salary account lifecycle: Welcome → First salary → Credit card offer → Personal loan → Auto finance → Investment"
- "Seasonal sequences: Tax season (Sep) → Year-end review (Dec) → New year financial planning (Jan)"
- "Win-back campaign: Dormancy detected → Re-engagement SMS → Branch RM call → Special reactivation offer → Final notice"

**Speaker Notes:**
```
PAKISTAN CALENDAR-DRIVEN CAMPAIGNS:
Pakistan's Islamic and cultural calendar creates natural multi-step campaign opportunities:

RAMADAN (30 days):
Step 1 (Day 1-5): Zakat calculator tool + Islamic investment awareness
Step 2 (Day 10-15): Pre-Eid shopping loan pre-approval + credit card limit increase
Step 3 (Day 20-25): Sadaqah donation facilitation + charity organization partnerships
Step 4 (Day 27): Shab-e-Qadr special — spiritual + financial reflection content
Step 5 (Eid Day): Eid Mubarak greeting (NO product push) + Eidi transfer feature highlight

EID-UL-ADHA:
Step 1 (30 days before): Qurbani savings plan + animal purchasing loan
Step 2 (15 days before): Hajj package financing for last-minute travelers
Step 3 (7 days before): Cash withdrawal convenience (extended ATM hours)
Step 4 (Eid Day): Eid greeting + remittance feature highlight

FISCAL YEAR END (June-July):
Step 1: Tax planning advisory + tax-saving investment options
Step 2: FBR tax filing assistance + bank statement generation
Step 3: Post-tax refund investment recommendation

FSDM: CMPGN (Campaign), MLTI_STP_CMPGN (Multi-Step Campaign), CMPGN_STP (Campaign Step), TRGR (Trigger), SQNC (Sequence), CMPGN_CLNDR (Campaign Calendar), DRIP (Drip Campaign)
```

---

### SLIDES 25-26: Marketing Effectiveness

**Pakistan context:**
- "Measure campaign ROI in PKR — critical given limited marketing budgets (1-2% of revenue)"
- "Track end-to-end: campaign cost (SMS/production/staff) → response → conversion → product revenue → customer LTV impact"
- "Compare channel effectiveness: SMS cost PKR 0.5-1/contact vs. WhatsApp PKR 2-5 vs. branch RM PKR 100-500"
- "Measure seasonal campaign lift: Ramadan campaigns, Eid promotions, salary-day triggers"
- "Dashboard for CMO: total campaigns, response rates, conversion, revenue generated, ROI by product/channel/segment"

**Speaker Notes:**
```
PAKISTAN MARKETING METRICS:
Current state: Most Pakistan banks measure only basic campaign metrics (sent count, response count). Very few measure end-to-end ROI or incremental revenue.

Key metrics Pakistan banks should track:
1. COST PER ACQUISITION (CPA): Total campaign cost ÷ new customers acquired — by channel
2. CAMPAIGN ROI: (Incremental revenue - campaign cost) ÷ campaign cost — target >5x
3. RESPONSE RATE: By channel (SMS: 1-3%, WhatsApp: 15-30%, Push: 3-8%)
4. CONVERSION RATE: Response to product activation — target >15% of responders
5. INCREMENTAL LIFT: Control group comparison — what revenue would have happened anyway?
6. CUSTOMER LIFETIME VALUE IMPACT: Did the campaign acquire/retain customers with higher future value?
7. CHANNEL COST EFFICIENCY: Revenue per PKR spent by channel
8. TIME-TO-MARKET: Campaign concept to deployment — target <5 days

Pakistan benchmark: Well-optimized bank campaigns should achieve 5-10x ROI; current industry average is 2-3x (often unmeasured).

FSDM: MKTG_EFFCTNSS (Marketing Effectiveness), CMPGN_ROI (Campaign ROI), CMPGN_KPI (Campaign KPI), CNVRSN_RT (Conversion Rate), CPA (Cost Per Acquisition), INCRMNTL_RVNU (Incremental Revenue)
```

---

### SLIDES 27-28: Marketing Attribution

**Pakistan context:**
- "Multi-touch attribution across Pakistan's unique channel mix: ATL (TV, radio, outdoor), BTL (branch, events), digital (SMS, push, email, social), and agent network"
- "Attribute salary account acquisition: employer tie-up vs. branch walk-in vs. digital campaign vs. agent referral"
- "Measure above-the-line brand impact on digital acquisition (TV ad → Google search → website → account opening)"
- "Track agent network contribution to financial inclusion acquisition (attribute to specific agent/location)"
- "Build attribution model linking branch RM activity to cross-sell conversion"

**Speaker Notes:**
```
PAKISTAN ATTRIBUTION CHALLENGES:
1. MULTI-CHANNEL: Customer may see TV ad, receive SMS, visit branch, then apply on mobile — which channel gets credit?
2. BRANCH ATTRIBUTION: RM claims credit for all branch-originated sales but was customer influenced by prior digital touchpoints?
3. AGENT ATTRIBUTION: Agent opens account but customer was already aware from SMS campaign — who gets credit?
4. LONG SALES CYCLES: Home finance journey is 3-6 months with 10+ touchpoints — last-click attribution is misleading
5. DATA GAPS: Branch visits aren't logged in marketing system, outdoor ad exposure can't be tracked, agent interactions poorly recorded

Pakistan attribution model design:
- First-touch (awareness): TV, outdoor, social media ad
- Mid-funnel (consideration): Website visit, branch inquiry, SMS click
- Last-touch (conversion): Application submission channel
- Weighted: Time-decay model giving more weight to touchpoints closer to conversion
- Algorithmic: ML-based multi-touch attribution (requires 12+ months of cross-channel data)

FSDM: ATRBTN (Attribution), MKTG_ATRBTN (Marketing Attribution), TCHPNT (Touchpoint), CNVRSN_PTH (Conversion Path), CHNL_CNTRBUTN (Channel Contribution), FRST_TCH (First Touch), LST_TCH (Last Touch)
```

---

### SLIDES 29-30: Brand Analytics

**Pakistan context:**
- "Measure brand strength against fintech challengers (SadaPay, NayaPay, Zindigi) in digital channels"
- "Track brand perception shift: traditional bank → innovative digital bank (critical for millennial acquisition)"
- "Monitor social media brand sentiment: Twitter/X, Facebook, Instagram, YouTube in Pakistan"
- "Measure brand impact of Islamic banking positioning — customers choosing bank based on Shariah perception"
- "Track employer brand strength (salary account decisions influenced by company perception of bank)"

**Speaker Notes:**
```
PAKISTAN BRAND LANDSCAPE:
Pakistan banking brands face an identity challenge:
1. TRADITIONAL BANKS: Strong in trust, stability, branch network — but perceived as slow, bureaucratic, not innovative
2. DIGITAL BANKS: Perceived as modern, fast, user-friendly — but questions about stability and deposit safety
3. ISLAMIC BANKS: Strong on values and Shariah compliance — but perceived as limited product range
4. FINTECHS: Strong on UX and innovation — but perceived as unregulated and risky for large amounts

Brand measurement for Pakistan banks:
- Brand awareness: Aided and unaided recall (TV/digital survey)
- Net Promoter Score: Customer willingness to recommend (quarterly survey)
- Social media sentiment: Real-time tracking on Pakistani social platforms
- App store ratings: Google Play ratings and review analysis
- Employee brand: Glassdoor/Rozee.pk ratings (impacts talent and salary account partnerships)
- Media coverage: Positive/negative/neutral banking media coverage in Dawn, Express, The News

Key brand metric: "Would you recommend this bank to a friend?" — Pakistan bank average NPS: 20-30. Fintech average: 55-70. Closing this gap requires brand + experience investment.

FSDM: BRND (Brand), BRND_ANLYTCS (Brand Analytics), BRND_SCNTMNT (Brand Sentiment), BRND_AWRNSS (Brand Awareness), NPS (Net Promoter Score), BRND_HLTH (Brand Health), CMPTTR_BRND (Competitor Brand)
```

---

## CONTENT DENSITY RULES

Same as Files 03-04. For every capability table:

| Container | Max Content | Font Size |
|---|---|---|
| Table cell (Business Objectives) | 6 bullets, 15 words each | 10-11pt |
| Table cell (Data & Solution) | 6 bullets, 12 words each | 10-11pt |
| Table cell (Outcome) | 6 bullets, 15 words each | 10-11pt |
| Maturity level cell | 3 sentences, 15 words each | 10-11pt |

**ON SLIDE:** 4-6 concise bullets including 1-2 Pakistan-specific per section.
**SPEAKER NOTES:** Full content + Global/Regional/Pakistan + FSDM entities.

---

## TERADATA BRANDING REMOVAL

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" (standalone) | "Enterprise Analytics Platform" |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |
| Teradata logo | Theme logo |
| "H1 2018" | "H1 2025 — H2 2026" |
| "For use in Maturity Assessment & Roadmap Engagements" | REMOVE from slide face |
| "Photos can be any photo from the Marcom Central" | REMOVE |
| "smart" (orphan text on some slides) | REMOVE |

---

## FINAL OUTPUT STRUCTURE (33+ slides)

| # | Slide | Status |
|---|-------|--------|
| **1** | **Domain Dashboard** | **NEW** |
| **2** | **🇵🇰 Pakistan Interaction Landscape** | **NEW** |
| 3-4 | Communication Targeting (Detail + Maturity) | Enriched |
| 5-6 | Contact Optimization | Enriched |
| 7-8 | Response Optimization | Enriched |
| 9-10 | Cross-Channel Customer Experience | Enriched |
| 11-12 | Contextual Decisioning | Enriched |
| 13-14 | Call/Contact Center Optimization | Enriched |
| 15-16 | Digital Optimization | Enriched |
| 17-18 | Search Engine Optimization | Enriched |
| 19-20 | Personalization | Enriched |
| 21-22 | Next Best Action Arbitration | Enriched |
| 23-24 | Product Recommendation | Enriched |
| 25-26 | Multi-Step Campaigns | Enriched |
| 27-28 | Marketing Effectiveness | Enriched |
| 29-30 | Marketing Attribution | Enriched |
| 31-32 | Brand Analytics | Enriched |
| **33** | **Implementation Roadmap** | **NEW** |

---

## VISUAL QA CHECKLIST

```bash
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide
```

```
□ No text overflow in ANY table cell
□ Font ≥ 10pt everywhere
□ No Teradata branding (logo, orange, "Teradata", "H1 2018", "smart" orphan text)
□ Pakistan context on EVERY capability slide
□ Speaker notes with Global/Regional/Pakistan/FSDM for all 15 capabilities
□ 3 new slides present
□ Updated maturity assessments
□ Consistent theme colors
□ Footer and page numbers correct
□ No placeholder text remnants
```
