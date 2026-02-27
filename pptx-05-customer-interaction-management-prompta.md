# PROMPT 6J: File 05 — Customer Interaction Management

## Role

You are a senior digital banking strategist and presentation specialist. You are rebuilding BVF PowerPoint File 05, which covers all 15 Customer Interaction Management (CIM) capabilities — from Communication Targeting through Brand Analytics. You have deep expertise in Pakistan's multi-channel banking landscape, digital marketing in emerging markets, SBP consumer protection regulations, and omnichannel customer engagement.

---

## Source File

```
INPUT:  ./05_Customer_Interaction_Management.pptx  (30 slides — ALL have full content)
OUTPUT: ./pptout/05_Customer_Interaction_Management_UPDATED.pptx
```

## Content Status: ENRICHMENT-ONLY (Zero Placeholders)

All 30 slides contain complete Teradata BVF content — 15 capabilities × 2 slides each (Capability Detail + Maturity Table). NO empty slides.

**Work required:**
1. Add Pakistan banking/digital channel context to every capability
2. Add Global/Regional layering (South Asia, Middle East comparisons)
3. Update all "H1 2018" → 2025-2026
4. Update maturity assessments for Pakistan reality
5. Map FSDM entities to each capability
6. Fix content overflow in dense table cells
7. Move detailed content to speaker notes
8. Add 3 new supplementary slides (Dashboard, Pakistan Context, Roadmap)
9. Remove/replace all Teradata branding

---

## Reference Data — Read Before Starting

```
./OVERVIEW.md                                       # Pipeline context, BVF structure
./fsdm_output/fsdm_domain_classification.csv        # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json  # BVF→FSDM entity mappings
./bvf_output/bvf_analysis_report.json               # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json              # BACR questions
```

---

## EXISTING SLIDE STRUCTURE (30 Slides — 15 Capability Pairs)

Every capability follows the same 2-slide pattern: Detail Table + Maturity Table.

| Slide | Title | Type |
|-------|-------|------|
| 1 | Communication Targeting | Capability Detail |
| 2 | Communication Targeting | Maturity Table |
| 3 | Contact Optimization | Capability Detail |
| 4 | Contact Optimization | Maturity Table |
| 5 | Response Optimization | Capability Detail |
| 6 | Response Optimization | Maturity Table |
| 7 | Cross-Channel Customer Experience | Capability Detail |
| 8 | Cross-Channel Customer Experience | Maturity Table |
| 9 | Contextual Decisioning | Capability Detail |
| 10 | Contextual Decisioning | Maturity Table |
| 11 | Call/Contact Center Optimization | Capability Detail |
| 12 | Call/Contact Center Optimization | Maturity Table |
| 13 | Digital Optimization | Capability Detail |
| 14 | Digital Optimization | Maturity Table |
| 15 | Search Engine Optimization | Capability Detail |
| 16 | Search Engine Optimization | Maturity Table |
| 17 | Personalization | Capability Detail |
| 18 | Personalization | Maturity Table |
| 19 | Next Best Action Arbitration | Capability Detail |
| 20 | Next Best Action Arbitration | Maturity Table |
| 21 | Product Recommendation | Capability Detail |
| 22 | Product Recommendation | Maturity Table |
| 23 | Multi-Step Campaigns | Capability Detail |
| 24 | Multi-Step Campaigns | Maturity Table |
| 25 | Marketing Effectiveness | Capability Detail |
| 26 | Marketing Effectiveness | Maturity Table |
| 27 | Marketing Attribution | Capability Detail |
| 28 | Marketing Attribution | Maturity Table |
| 29 | Brand Analytics | Capability Detail |
| 30 | Brand Analytics | Maturity Table |

All slides: Current maturity = Developing, Desired = Innovating, Priority = High, Timeframe = "H1 2018" (needs update).

---

## NEW SLIDES TO ADD (3)

### NEW Slide A: Domain Dashboard (insert as slide 1)

**"Customer Interaction Management — At a Glance"**

| | Global | South Asia and ME | Pakistan |
|---|---|---|---|
| Marketing automation adoption | 75%+ of top banks | 30-40% | <15% |
| Real-time personalization | 50%+ of digital banks | 15-20% | <5% |
| Omnichannel campaign execution | 65% of mature banks | 25% | <10% |
| NBA (Next Best Action) deployed | 40% of top banks | 10% | <3% |
| Marketing attribution in place | 55% of top banks | 15% | <5% |
| Campaign ROI measurement | Standard practice | Emerging | Rare — most lack control groups |

Info bar:
```
BVF Sub-capabilities: 15 | FSDM Entities: ~100+ (Campaign, Channel, Interaction, Contact domains)
BACR Questions: ~80 | Maturity Focus: Developing → Innovating
```

### NEW Slide B: Pakistan Market Context (insert as slide 2)

**"Pakistan — Customer Interaction Landscape"**

Channel Reach and Effectiveness:
```
SMS:              95%+ reach (mobile penetration), 2-5% response rate, OVERUSED
Push Notification: 30% reach (app installed), 8-15% open rate, GROWING
WhatsApp Business: 20% reach, 40-60% open rate, EMERGING — highest engagement
Email:            15% reach (urban/corporate only), 5-10% open rate, LOW priority
In-App Messages:  25% reach, 15-25% engagement, HIGHEST conversion
Branch Face-to-Face: 100% for walk-ins, high conversion, HIGH cost
Contact Center:   Urdu/English bilingual, 1M+ calls/month (top-5 banks), CRITICAL for complaints
Agent Network:    500,000+ agents, rural reach, ESSENTIAL for financial inclusion
```

Key Challenges:
```
SMS FATIGUE: Customers receive 5-10 bank SMS daily — regulatory crackdown looming
NO CDP: <5% of banks have Customer Data Platform — interactions siloed by channel
BATCH-ONLY: Most campaigns run on monthly batch — no real-time personalization
NO ATTRIBUTION: Marketing spend not tracked to conversion — budget allocation is gut-feel
LANGUAGE: Must support Urdu, English, and increasingly Sindhi, Pashto, Punjabi
COMPLIANCE: SBP Consumer Protection requires opt-in for marketing + complaint response SLAs
```

### NEW Slide C: Implementation Roadmap (insert as second-to-last)

**"Customer Interaction Management — Implementation Roadmap"**

```
Phase 1: Foundation (0-6 months)
  Implement contact policy framework (prevent SMS fatigue)
  Build unified customer contact history across channels
  Launch WhatsApp Business channel for top 20% customers
  A/B testing framework for SMS and push notifications
  Investment: PKR 40-70M | Quick Win: 30% reduction in SMS opt-outs

Phase 2: Intelligence (6-18 months)
  Customer Data Platform (CDP) implementation
  Multi-step campaign automation (Ramadan, Eid, salary-day sequences)
  Personalization engine — segment-level then individual-level
  Call center optimization with customer 360 view for agents
  Investment: PKR 100-180M | Expected: 2x campaign response rates

Phase 3: Real-Time (18-36 months)
  Next Best Action engine across branch, mobile, contact center
  Real-time contextual decisioning (location, transaction, app behavior)
  Marketing attribution model (digital + branch + ATL integration)
  AI-powered product recommendation at every touchpoint
  Investment: PKR 150-280M | Expected: 3x marketing ROI, products/customer from 1.8 to 3.0+
```

---

## SLIDE-BY-SLIDE ENRICHMENT — ALL 15 CAPABILITIES

### SLIDES 1-2: Communication Targeting + Maturity

**Pakistan Context for Slide 1:**
- "Build targeting framework across Pakistan's unique channel mix: SMS (95% reach), push notification, WhatsApp Business, in-app, email, branch, contact center, agent network"
- "Create Urdu and English message variants for all targeted communications"
- "Define opt-in/opt-out rules per SBP Consumer Protection guidelines"
- "Build pre-approved target segments: salary account holders, RAAST-active, dormant, Islamic-preference, diaspora, youth (<30), HNW"
- "Leverage CNIC-based household targeting for family product bundles"

**Speaker Notes — Pakistan Targeting Channels:**
```
PAKISTAN CHANNEL TARGETING MATRIX:
| Segment | Primary Channel | Secondary | Tertiary |
|---------|----------------|-----------|----------|
| Youth (<30) | Push notification / In-app | WhatsApp | SMS |
| Mass Market | SMS | Agent outreach | Branch |
| Affluent | WhatsApp / RM call | In-app | Email |
| HNW/Private | RM personal call | WhatsApp | Branch invitation |
| Diaspora | Email / WhatsApp | In-app (RDA) | SMS |
| Rural/Agent | Agent network | SMS (USSD) | Branch |
| Islamic-pref | SMS (Urdu) | Branch (Islamic) | WhatsApp |
| Corporate | Email | RM call | Branch visit |

Key Pakistan regulations:
- SBP requires explicit opt-in for marketing communications
- PTA restricts bulk SMS sending — DND (Do Not Disturb) registry
- PEMRA governs above-the-line advertising content
- Data privacy considerations (no formal law yet, but SECP guidelines)

FSDM: CMPGN (Campaign), CMPGN_TRGTS (Campaign Targets), SGMNT (Segment), ELIG (Eligibility), CHNL (Channel), OPT_IN (Opt-In), CNTCT_PREF (Contact Preference)
```

---

### SLIDES 3-4: Contact Optimization + Maturity

**Pakistan Context:**
- "Solve Pakistan's SMS fatigue problem — customers receive 5-10 promotional SMS daily across banks"
- "Implement channel-specific contact frequency limits: SMS max 2/week, push max 3/week, WhatsApp max 1/week"
- "Apply longer suppression after customer complaint (SBP Consumer Protection requirement)"
- "Differentiate contact rules for Ramadan period (higher spiritual content tolerance, lower hard-sell)"
- "Coordinate outbound marketing with SBP-mandated service notifications (OTP, transaction alerts)"

**Speaker Notes:**
```
PAKISTAN CONTACT FATIGUE CRISIS:
Average Pakistan bank customer receives:
- 3-5 promotional SMS per day from their own bank
- 2-3 promotional SMS from other banks (data sharing via third parties)
- 5+ SMS from telcos, retailers, and service providers
Total: 10-15+ promotional SMS daily = severe fatigue

Result: <2% response rates on SMS (was 5-8% five years ago), rising opt-out rates, customer complaints to SBP.

Contact policy framework priorities for Pakistan:
1. FREQUENCY CAP: Max 2 promotional SMS per week per customer (not per campaign)
2. RECENCY RULE: Min 48-hour gap between promotional contacts to same customer
3. COMPLAINT SUPPRESSION: 30-day marketing blackout after any complaint
4. CHANNEL PREFERENCE: Respect stated preference (many customers prefer WhatsApp over SMS)
5. RAMADAN RULES: Adjust frequency and timing — no hard-sell during Sehri/Iftar, focus on Zakat/Islamic products
6. DO-NOT-DISTURB: Comply with PTA DND registry — auto-suppress registered numbers
7. TRANSACTIONAL vs. PROMOTIONAL: Never mix promotional content in transactional notifications (SBP regulation)

FSDM: CNTCT_PLCY (Contact Policy), CNTCT_FREQ (Contact Frequency), CNTCT_RCNCY (Contact Recency), SPRSN (Suppression), OPT_OUT (Opt-Out), CHNL_PREF (Channel Preference), CNTCT_HSTRY (Contact History)
```

---

### SLIDES 5-6: Response Optimization + Maturity

**Pakistan Context:**
- "Optimize response across mobile-first audience — 85% of digital banking interactions via smartphone"
- "Test Urdu vs. English vs. bilingual message variants — response rates differ 30%+ by language and segment"
- "Optimize timing: salary-day campaigns (1st-5th of month), Eid-season, Ramadan, and back-to-school (August)"
- "Measure response beyond click — track through to product purchase/activation, not just SMS delivery"
- "Build A/B testing culture — most Pakistan banks do zero controlled testing of marketing messages"

**Speaker Notes:**
```
PAKISTAN RESPONSE OPTIMIZATION:
Current state: Most Pakistan banks measure only "SMS delivered" and "call completed" — not actual response or conversion.

Optimization opportunities:
1. TIMING: Salary credit day (1st-5th) generates 3x response for lending products. Ramadan Zakat period generates 5x response for Islamic products. Friday afternoon generates lowest response (prayer time).
2. LANGUAGE: Urdu SMS generates 40% higher response in mass market segment; English better for urban affluent.
3. CHANNEL: WhatsApp generates 3-5x response vs. SMS for same offer (due to richer content + less fatigue).
4. OFFER TYPE: Cashback offers outperform interest rate offers 2:1 in Pakistan's price-sensitive market.
5. PERSONALIZATION: Using customer name + product they hold + specific benefit generates 2x vs. generic.

A/B testing framework needed:
- Test one variable at a time (channel, timing, language, offer, creative)
- Minimum 10K control group per test
- Measure through to activation, not just response
- 2-week measurement window minimum (Pakistani customers take longer to act)
- Document learnings in campaign knowledge base

FSDM: CMPGN_RSPNS (Campaign Response), CNVRSN (Conversion), A_B_TST (A/B Test), CMPGN_KPI (Campaign KPI), RSP_RT (Response Rate), CMPGN_RSLT (Campaign Result)
```

---

### SLIDES 7-8: Cross-Channel Customer Experience + Maturity

**Pakistan Context:**
- "Deliver seamless experience across Pakistan's 7+ customer channels: branch (16,000+), ATM (16,000+), mobile app, internet banking, contact center, USSD, agent network (500,000+)"
- "Enable branch-to-digital handoff: start application in branch, complete on mobile app"
- "Integrate RAAST/IBFT as interaction channels (not just payment rails — they generate customer events)"
- "Design for Pakistan's digital divide: full digital for urban youth, assisted digital for Tier 2/3, agent-led for rural"

**Speaker Notes:**
```
PAKISTAN CHANNEL ECOSYSTEM:
| Channel | Reach | Cost/Interaction | Trend |
|---------|-------|-----------------|-------|
| Branch (16,000+) | Universal | PKR 150-300 | Stable (declining share) |
| ATM (16,000+) | 60M+ cardholders | PKR 30-50 | Stable |
| Mobile App | 30M+ downloads | PKR 5-15 | Rapidly growing (40% YoY) |
| Internet Banking | 15M+ users | PKR 10-20 | Growing |
| Contact Center | Universal | PKR 80-150 per call | Stable |
| USSD | 100M+ mobile users | PKR 2-5 | Stable (feature phones) |
| Agent Network | 500,000+ agents | PKR 20-40 | Growing |
| WhatsApp Business | Emerging | PKR 3-8 | New — high potential |
| RAAST/IBFT | 50M+ monthly | PKR 2-5 | Explosive growth |

Cross-channel challenge: Most Pakistan banks have NO unified interaction history. A customer who calls the contact center about a failed mobile transaction is asked to repeat everything because the agent cannot see the mobile app session.

FSDM: CHNL (Channel), CHNL_INTN (Channel Interaction), CHNL_PRFNC (Channel Performance), CSTMR_CHNL_PREF (Customer Channel Preference), OMNI_CHNL (Omni-Channel), CHNL_INTGRTN (Channel Integration)
```

---

### SLIDES 9-10: Contextual Decisioning + Maturity

**Pakistan Context:**
- "Use RAAST/IBFT transaction context to trigger real-time offers (e.g., customer just received salary, offer personal loan within 1 hour)"
- "Leverage mobile app context: customer browsing home finance page, trigger RM callback or WhatsApp message"
- "Branch context: customer queuing for cash deposit, branch display shows relevant investment product"
- "Location-based: customer near branch triggers walk-in service notification, at shopping mall triggers POS cashback offer"
- "Islamic calendar context: Ramadan triggers Zakat calculator + Islamic investment offers"

**Speaker Notes:**
```
PAKISTAN CONTEXTUAL OPPORTUNITIES:
Real-time context signals available in Pakistan banking:
1. TRANSACTION: Salary credit, large deposit, large withdrawal, bill payment, international remittance
2. APP BEHAVIOR: Product page browse, calculator use, loan eligibility check, FD rate comparison
3. LOCATION: Branch proximity (GPS), merchant proximity, airport/travel detection
4. TIME: Salary day (1st-5th), bill payment day, Ramadan/Eid, weekend vs. weekday
5. LIFECYCLE: Just opened account, just activated card, just made first RAAST payment
6. RISK: Failed transaction, login from new device, suspected fraud alert

Current Pakistan reality: Almost zero contextual decisioning deployed. Offers are pre-generated in batch and pushed regardless of customer context. No bank is doing real-time NBA in Pakistan as of 2025.

FSDM: CNTXT (Context), DCSNNG (Decisioning), RL_TM_EVNT (Real-Time Event), OFFR_ARBTTN (Offer Arbitration), TRGR (Trigger), CNTXT_DCSNNG (Contextual Decisioning)
```

---

### SLIDES 11-12: Call/Contact Center Optimization + Maturity

**Pakistan Context:**
- "Optimize Urdu/English bilingual contact center operations (some banks add Sindhi, Pashto, Punjabi IVR)"
- "Provide agents with customer 360 view including recent RAAST/IBFT transactions, mobile app activity, branch visits"
- "Implement sentiment analysis on call recordings — detect frustrated customers in real-time and escalate"
- "Reduce average handle time by pre-loading customer context when CNIC/mobile number identified via IVR"
- "Route Islamic banking queries to Shariah-trained agents"

**Speaker Notes:**
```
PAKISTAN CONTACT CENTER LANDSCAPE:
Top-5 banks handle 1M+ calls/month each. Typical contact center:
- 200-500 agents per large bank
- IVR handles 40-60% of calls (balance inquiry, mini-statement, card block)
- Average handle time: 5-8 minutes (high — agents lack customer context)
- First call resolution: 60-70% (low — requires callback or branch visit)
- Languages: Urdu (70%), English (25%), Regional (5%)

Key optimization opportunities:
1. CUSTOMER 360 ON SCREEN: Show agent last 10 transactions, products held, pending complaints, segment, value tier, last campaign offered — saves 2-3 minutes per call
2. IVR PERSONALIZATION: Greet by name, offer top 3 likely reasons for call based on recent activity
3. SENTIMENT DETECTION: Real-time voice analysis to detect frustration, auto-escalate to supervisor
4. CROSS-SELL AT RESOLUTION: After resolving issue, agent can offer relevant product
5. COMPLAINT ROUTING: Auto-categorize per SBP Consumer Protection categories

FSDM: CNTCT_CNTR (Contact Center), IVR (Interactive Voice Response), AGNT (Agent), CLL (Call), CLL_RSLN (Call Resolution), SNTMNT (Sentiment), CMPLNT (Complaint), ESCLTN (Escalation)
```

---

### SLIDES 13-14: Digital Optimization + Maturity

**Pakistan Context:**
- "Optimize mobile banking app UX for Pakistan user patterns — 85% Android, low-bandwidth conditions"
- "Track and fix digital onboarding dropoff (40-60% at NADRA biometric step)"
- "A/B test Urdu vs. English app interface — significant impact on feature adoption"
- "Optimize RAAST/IBFT transfer flow (most-used feature — reduce taps from 5 to 3)"
- "Monitor internet banking for low-adoption features and redesign or remove"

**Speaker Notes:**
```
PAKISTAN DIGITAL BANKING METRICS:
Mobile App:
- Downloads: 30M+ across top-10 banks
- Monthly Active Users: ~40% of downloaders
- Top features: Balance check (80%), fund transfer (60%), bill payment (40%)
- Lowest adoption: Investment (5%), insurance (3%), loan application (2%)
- OS split: Android 85%, iOS 15%
- Key friction: NADRA biometric verification for high-value transactions

Optimization priorities:
1. SPEED: App load time <3 seconds on 3G (many users in low-bandwidth areas)
2. SIMPLICITY: Reduce steps for top 3 features (transfer, balance, bill pay)
3. LANGUAGE: Toggle between Urdu/English without app restart
4. BIOMETRIC: Fingerprint/face login for faster access
5. ONBOARDING: Fix NADRA biometric dropoff — offer alternatives (video KYC, branch fallback)

FSDM: DGTL_CHNL (Digital Channel), APP_EVNT (App Event), SSSN (Session), PG_VW (Page View), CLCK_STRM (Clickstream), FNNEL (Funnel), DRPFF (Dropoff)
```

---

### SLIDES 15-16: Search Engine Optimization + Maturity

**Pakistan Context:**
- "Optimize bank website for Urdu + English bilingual search — Google search in Pakistan is 60% English, 40% Urdu/Roman Urdu"
- "Focus on product search terms: 'bank account kholna', 'car loan Pakistan', 'savings account best rate Pakistan'"
- "Optimize mobile web experience — 85% of Pakistan internet access is mobile"
- "Target financial literacy searches — 'RAAST kya hai', 'Zakat calculator', 'SBP rate today'"

**Speaker Notes:**
```
PAKISTAN SEO CONTEXT:
Pakistan has 120M+ internet users (mobile-first). Banking product search volume growing 30% YoY.

Top banking search queries in Pakistan:
1. "Best savings account Pakistan" / "Best bank Pakistan"
2. "Car loan calculator" / "Home loan rate Pakistan"
3. "Online account opening Pakistan"
4. "RAAST payment" / "How to use RAAST"
5. "Zakat calculator" / "Islamic banking Pakistan"

SEO is immature in Pakistan banking — most bank websites have poor Urdu content, slow mobile load times, and thin product pages. First bank to invest captures organic acquisition at zero marginal cost.

FSDM: WB_SRCH (Web Search), SRCH_QRY (Search Query), LNDNG_PG (Landing Page), CNVRSN_RT (Conversion Rate), KYWD (Keyword)
```

---

### SLIDES 17-18: Personalization + Maturity

**Pakistan Context:**
- "Move from 'Dear Customer' SMS blasts to personalized offers based on individual behavior"
- "Personalize by Islamic preference — detected from transaction patterns (Zakat, Islamic FD, Shariah spending)"
- "Language personalization — Urdu for mass market, English for corporate/affluent, bilingual for hybrid"
- "Personalize based on life stage (youth/student, working professional, family, retired, diaspora)"
- "Personalize digital experience — show relevant products on mobile app home screen based on profile"

**Speaker Notes:**
```
PAKISTAN PERSONALIZATION MATURITY:
Current state: <5% of Pakistan bank communications are personalized beyond customer name.

Personalization ladder for Pakistan:
Level 1 (Current): Name + product held in SMS
Level 2 (Next): Segment-based offer (youth gets different offer than retiree)
Level 3 (Target): Behavioral — based on actual transaction patterns, channel usage, life events
Level 4 (Aspirational): Individual real-time — dynamic content based on context + history

Quick win variables:
- Salary amount tier determines lending offer amount
- Transaction patterns drive spending category offers
- Islamic product holding triggers Shariah-compliant alternatives
- RAAST usage frequency drives digital-first feature promotions
- Branch visit frequency drives digital migration nudges

FSDM: PRSNLZTN (Personalization), CSTMR_PRFL (Customer Profile), BHVR_SGM (Behavioral Segment), DYNMC_CNTNT (Dynamic Content), OFFR_PRSNLZTN (Offer Personalization)
```

---

### SLIDES 19-20: Next Best Action Arbitration + Maturity

**Pakistan Context:**
- "Build NBA engine that arbitrates across: cross-sell offers, retention interventions, service recommendations, risk alerts, compliance notifications"
- "NBA must consider Islamic preference — never recommend conventional interest-bearing product to Islamic-preference customer"
- "Prioritize based on: customer value, propensity, recency of last contact, channel context, urgency"
- "Deploy NBA at: branch counter (teller screen), mobile app (personalized home), contact center (agent screen), ATM (screen message)"

**Speaker Notes:**
```
PAKISTAN NBA FRAMEWORK:
1. RETAIN (highest priority): If churn risk > threshold, retention offer first
2. GROW (cross-sell): If eligible for next product in affinity chain, cross-sell offer
3. SERVE: If recent complaint or low satisfaction, service recovery action
4. MIGRATE: If branch-heavy, digital adoption nudge
5. COMPLY: If KYC expiring or CDD refresh needed, compliance notification

Pakistan-specific NBA rules:
- NEVER offer conventional lending to Islamic-preference customers
- ALWAYS check ECIB before lending offers
- RESPECT Ramadan timing — spiritual/charity offers preferred
- DIASPORA customers get Roshan Digital Account / NPC offers
- SALARY-DAY timing: Cross-sell within 24 hours of salary credit

Current state: NO Pakistan bank has deployed NBA. All interactions are product-push based on marketing calendar.

FSDM: NBA (Next Best Action), ARBTTN (Arbitration), OFFR_PRTY (Offer Priority), PRPNSTY (Propensity), CSTMR_VALU (Customer Value), DCSNNG_ENGN (Decisioning Engine)
```

---

### SLIDES 21-22: Product Recommendation + Maturity

**Pakistan Context:**
- "Recommend based on Pakistan product affinity chains: CASA to Debit Card to Credit Card to Personal Loan to Auto to Home Finance to Insurance to Investments"
- "Factor in Islamic product alternatives for every conventional recommendation"
- "Leverage transaction classification for relevant recommendations (frequent remitter gets forex card, travel insurance)"
- "Recommend government savings products (NSS, PIBs) for conservative/senior segments"

**Speaker Notes:**
```
PAKISTAN PRODUCT AFFINITY MAP:
1. CASA to Debit Card to ATM to Mobile App (universal starter)
2. Salary Account to Credit Card to Personal Loan (employed segment)
3. CASA to Fixed Deposit to Mutual Fund to PIB/T-Bill (savings-focused)
4. CASA to Islamic Savings to Diminishing Musharaka to Takaful (Islamic track)
5. Current Account to Trade Finance to LC/LG to Working Capital (business track)
6. Remittance to RDA to NPC to Property Investment (diaspora track)

FSDM: PRDCT_RCMNDTN (Product Recommendation), PRDCT_AFFNTY (Product Affinity), RCMNDTN_ENGN (Recommendation Engine), PRDCT (Product), PRDCT_BNDL (Product Bundle)
```

---

### SLIDES 23-24: Multi-Step Campaigns + Maturity

**Pakistan Context:**
- "Design Islamic-calendar-aware campaign sequences: Ramadan awareness, Zakat calculator, Islamic investment, Eid greeting, post-Ramadan financial planning"
- "Build salary-day sequence: Day 1 salary detected, Day 2 savings nudge, Day 7 investment offer, Day 14 lending offer, Day 28 balance reminder"
- "Onboarding sequence: Welcome, App download, First transaction, Card activation, Cross-sell, 90-day check-in"
- "Design sequences that work across SMS to WhatsApp to In-app to Branch handoff"

**Speaker Notes:**
```
PAKISTAN MULTI-STEP CAMPAIGN EXAMPLES:

SEQUENCE 1: Ramadan Campaign (30 days)
Day 1: Ramadan Mubarak + Zakat calculator link
Day 5: Islamic savings account offer
Day 15: Ramadan spending insights + cashback on groceries
Day 20: Eid shopping pre-approved credit card limit increase
Day 25: Zakat auto-deduction setup reminder
Eid: Eid Mubarak greeting + Eid-ul-Adha savings plan
Post-Eid: Financial health check + investment offer

SEQUENCE 2: Salary Day Campaign (monthly)
Day 0: Salary credited notification
Day 1: Auto-savings nudge (transfer 10% to savings)
Day 3: Bill payment reminders with auto-pay setup
Day 7: Investment opportunity (mutual fund SIP)
Day 14: Personal loan pre-approval (if eligible)
Day 28: Month-end balance summary + spending insights

SEQUENCE 3: New Customer Onboarding (90 days)
Day 0: Welcome + app download link
Day 1: Tutorial video (Urdu/English)
Day 3: First RAAST transfer incentive
Day 7: Debit card activation reminder
Day 14: Internet banking registration nudge
Day 30: First cross-sell (based on behavior so far)
Day 60: Satisfaction survey
Day 90: Loyalty program enrollment

FSDM: MLT_STP_CMPGN (Multi-Step Campaign), CMPGN_STP (Campaign Step), CMPGN_SQNC (Campaign Sequence), TRGR (Trigger), RSPNS (Response), STPNG_LGIC (Stepping Logic)
```

---

### SLIDES 25-26: Marketing Effectiveness + Maturity

**Pakistan Context:**
- "Implement control groups for ALL campaigns — currently rare in Pakistan banking"
- "Measure incremental value, not just response count — how much additional revenue vs. control?"
- "Track beyond 7-day window — Pakistan customers often take 14-30 days to act on financial product offers"
- "Compare channel effectiveness: cost-per-conversion across SMS, WhatsApp, in-app, branch, agent"
- "Build dashboard for CMO: campaign ROI, acquisition cost by channel, response rates by segment"

**Speaker Notes:**
```
PAKISTAN MARKETING EFFECTIVENESS GAP:
Most Pakistan banks cannot answer basic questions:
- "Which of our 50 campaigns last month generated the most revenue?" — Unknown
- "What is our cost per acquisition by channel?" — Estimated at best
- "Should we spend more on SMS or WhatsApp?" — No data to decide
- "Did the Ramadan campaign increase deposits?" — Anecdotal only

Minimum viable marketing effectiveness:
1. CONTROL GROUPS: 10% holdout on every campaign — no exceptions
2. RESPONSE TRACKING: Link campaign ID to product application to activation to 30-day usage
3. ROI CALCULATION: (Incremental revenue from campaign group minus control) / Campaign cost
4. CHANNEL COMPARISON: Same offer, same segment, different channel — A/B test
5. DASHBOARD: Weekly automated report to marketing leadership

FSDM: CMPGN_EFCTVNS (Campaign Effectiveness), ROI (Return on Investment), CNTRL_GRP (Control Group), INCRMNTL_VALU (Incremental Value), CMPGN_KPI (Campaign KPI)
```

---

### SLIDES 27-28: Marketing Attribution + Maturity

**Pakistan Context:**
- "Build attribution model spanning: above-the-line (TV, billboards, newspapers) + digital (search, social, app) + direct (SMS, WhatsApp, branch, agent) + earned (word-of-mouth, referral)"
- "Pakistan-specific: attribute remittance-driven account openings to diaspora word-of-mouth"
- "Track offline-to-online: billboard to Google search to website to app download to account opening"
- "Measure agent network effectiveness — which agents drive activations, not just account openings"

**Speaker Notes:**
```
PAKISTAN MARKETING MIX:
- TV advertising: 35% of bank marketing spend
- Billboards/outdoor: 20% of spend
- Newspaper/print: 15% of spend
- Digital: 15% of spend (growing fast)
- Direct (SMS, branch): 10% of spend
- Agent incentives: 5% of spend

First steps for Pakistan attribution:
- UTM tracking on all digital campaigns
- Unique promo codes per channel/campaign
- Ask "How did you hear about us?" at account opening
- RAAST referral tracking (refer a friend via RAAST)
- Build multi-touch model starting with digital channels only

FSDM: MKTG_ATRBTN (Marketing Attribution), TCHPNT (Touchpoint), CNVRSN_PTH (Conversion Path), CHNL_CNTRBN (Channel Contribution), ATRBTN_MDL (Attribution Model)
```

---

### SLIDES 29-30: Brand Analytics + Maturity

**Pakistan Context:**
- "Measure brand health against fintech challengers — SadaPay, NayaPay have stronger brand perception among millennials"
- "Track brand perception across: trust, digital innovation, service quality, Islamic credentials, accessibility"
- "Monitor social media brand mentions — Twitter/X, Facebook, Instagram, TikTok (growing bank presence)"
- "Measure brand impact of CSR activities — education, disaster relief, financial literacy"
- "Track employer brand strength — important for salary account acquisition"

**Speaker Notes:**
```
PAKISTAN BRAND LANDSCAPE:
| Bank Type | Trust | Innovation | Service | Islamic | Digital |
|-----------|-------|------------|---------|---------|---------|
| Big 5 (HBL, UBL, MCB, ABL, NBP) | High | Medium | Medium | Medium | Medium |
| Islamic (Meezan, BankIslami) | High | Medium | Medium | Very High | Medium |
| Fintech (SadaPay, NayaPay) | Medium | Very High | High | Low | Very High |
| Digital Banks (new licensees) | Low | High | Unknown | Varies | High |

Brand analytics priorities:
1. NPS TRACKING: Quarterly NPS by segment vs. fintech benchmarks
2. SOCIAL LISTENING: Monitor Urdu + English social media
3. APP STORE RATINGS: Track Google Play rating and reviews
4. EMPLOYER BRAND: Survey HR managers on preferred salary banking partner
5. ISLAMIC BRAND: Measure Shariah compliance perception

FSDM: BRND (Brand), BRND_HLTH (Brand Health), NPS (Net Promoter Score), BRND_PRCP (Brand Perception), SCIAL_MDIA (Social Media), SNTMNT (Sentiment)
```

---

## CONTENT DENSITY RULES

Same as Files 03-04. For EVERY capability table:

| Container | Max Content | Font Size |
|---|---|---|
| Table cell (Objectives) | 6 bullets, 15 words each | 10-11pt |
| Table cell (Data/Solution) | 6 bullets, 12 words each | 10-11pt |
| Table cell (Outcome) | 6 bullets, 15 words each | 10-11pt |
| Maturity cell | 3 sentences, 15 words each | 10-11pt |

Strategy: Condense on slide, full detail in speaker notes with Global/Regional/Pakistan/FSDM.

---

## TERADATA BRANDING REMOVAL

| Find | Replace |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" | "Enterprise Analytics Platform" |
| "Teradata Confidential" | [Theme footer] |
| #F58220 / #00539F | Theme colors |
| "H1 2018" | "H1 2025 — H2 2026" |
| "For use in Maturity Assessment & Roadmap Engagements" | REMOVE from slide face |
| "Photos can be any photo from the Marcom Central" | REMOVE |
| "smart" (leftover text at top of many capability slides) | REMOVE |

---

## FINAL OUTPUT SLIDE STRUCTURE (33+ slides)

| # | Slide | Status |
|---|-------|--------|
| **1** | **Domain Dashboard — At a Glance** | **NEW** |
| **2** | **Pakistan — Customer Interaction Landscape** | **NEW** |
| 3-4 | Communication Targeting + Maturity | Enriched |
| 5-6 | Contact Optimization + Maturity | Enriched |
| 7-8 | Response Optimization + Maturity | Enriched |
| 9-10 | Cross-Channel Customer Experience + Maturity | Enriched |
| 11-12 | Contextual Decisioning + Maturity | Enriched |
| 13-14 | Call/Contact Center Optimization + Maturity | Enriched |
| 15-16 | Digital Optimization + Maturity | Enriched |
| 17-18 | Search Engine Optimization + Maturity | Enriched |
| 19-20 | Personalization + Maturity | Enriched |
| 21-22 | Next Best Action Arbitration + Maturity | Enriched |
| 23-24 | Product Recommendation + Maturity | Enriched |
| 25-26 | Multi-Step Campaigns + Maturity | Enriched |
| 27-28 | Marketing Effectiveness + Maturity | Enriched |
| 29-30 | Marketing Attribution + Maturity | Enriched |
| 31-32 | Brand Analytics + Maturity | Enriched |
| **33** | **Implementation Roadmap** | **NEW** |

---

## VISUAL QA CHECKLIST

```bash
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide
```

```
No text overflow in ANY table cell
All cells have min 0.06" padding
Font >= 10pt everywhere
No Teradata branding (logo, orange, text, "H1 2018")
No leftover "smart" text at top of slides
Pakistan context on EVERY capability slide
Speaker notes with Global/Regional/Pakistan/FSDM for all 15 capabilities
3 new slides present (Dashboard, Pakistan Context, Roadmap)
Maturity tables updated for Pakistan
Footer correct, page numbers sequential
Consistent theme throughout
```
