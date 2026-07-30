# Prompt 6B: BVF PowerPoint Updater — 12_Risk_Management.pptx

## Role

You are a senior banking risk management consultant with deep expertise in Basel III/IV, IFRS 9, SBP (State Bank of Pakistan) prudential regulations, credit risk modeling (PD/LGD/EAD), market risk (VaR/ES), operational risk (AMA/BIA), and Teradata FSDM. You are filling placeholder content in Teradata's Banking BVF Risk Management presentation with authoritative, Pakistan-contextualized banking risk content.

---

## Objective

Read and update `12_Risk_Management.pptx` from `./pptout/`. This file has 60 slides — most capability slides have REAL content, but specific slides contain placeholders ("Point 1", "Description", "Space", "#", "Question 1/2/3") that must be filled with deep, substantive risk management content.

```
INPUT:  ./pptout/12_Risk_Management.pptx
OUTPUT: ./pptout/12_Risk_Management_UPDATED.pptx
```

---

## Reference Data (Local Repo)

```
./OVERVIEW.md                                          # Full project context
./fsdm_output/fsdm_analysis_report.json                # 3,917 entities, Risk domain details
./fsdm_output/fsdm_domain_classification.csv           # Entity-to-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json     # 360 BVF-FSDM mappings
./bvf_output/bvf_analysis_report.json                  # 112 BVF capabilities
./bacr_output/bacr_analysis_report.json                # 793 BACR questions (risk categories)
./erwin_parser_output/fsdm_entity_summary.csv           # UBL v13 entities
./bvf_fsdm_output/profitability_star_schema.sql         # Star schema with risk cost column
```

---

## Technical Approach

Use PPTX editing workflow (unpack → edit XML → repack). See Prompt 6 for full technical steps. Use Edit tool for ALL text changes. Preserve all formatting, shapes, images, layout.

---

## PLACEHOLDER SLIDES TO FILL (Slide-by-Slide)

### Slide 10 — "Are You Able To…" (Risk Management)
**Current:** "Question 1 / Question 2 / Question 3"
**Fill with:**
```
Are You Able To…

Can you calculate Probability of Default (PD), Loss Given Default (LGD), and 
Exposure at Default (EAD) at individual account level across all lending products, 
and aggregate these for IFRS 9 Expected Credit Loss staging (Stage 1/2/3)?

Can you perform real-time stress testing under SBP-mandated macroeconomic scenarios 
(GDP contraction, PKR devaluation, KIBOR spike) and produce Basel III capital 
adequacy impact within 24 hours?

Can you provide a unified risk dashboard integrating credit risk, market risk, 
operational risk, and liquidity risk — with drill-through from portfolio-level 
concentrations to individual obligor exposures?
```

### Slide 14 — "Common Core for Risk Analytics - What are the challenges?"
**Current:** "Overall challenge: Description" + "Influence 1-4: Point 1"
**Fill with:**
```
Overall challenge:
Establishing a unified, enterprise-wide risk analytics infrastructure that serves 
Credit Risk, Market Risk, Operational Risk, Fraud, and Regulatory Compliance from 
a common data foundation — eliminating silos, duplication, and inconsistency.

Data Fragmentation
Pakistan's banks typically operate 4-5 core systems (CTL for retail, separate systems 
for cards, treasury, trade finance, Islamic banking) with no unified risk data layer. 
Risk analysts spend 60-70% of time on data gathering and reconciliation rather than 
analysis. FSDM addresses this with 280+ Risk domain entities in a canonical model.

Regulatory Acceleration
SBP has mandated IFRS 9 ECL compliance, Basel III capital buffers (CCB 2.5%, 
D-SIB surcharge 1-1.5%), and FATF-aligned AML/CFT requirements. Each regulation 
demands granular, reconcilable data — impossible with siloed infrastructure.

Model Risk & Governance
Banks struggle with model validation, back-testing, and champion-challenger 
frameworks. Most Pakistani banks operate at BACR maturity Level 2 (Developing) 
for risk model governance — judgmental decisions dominate over data-driven models.

Technology Debt
Legacy batch processing (T+1 or T+2 data) prevents real-time risk monitoring. 
Market risk requires intra-day VaR calculations, credit risk needs event-driven 
early warning, and AML needs real-time transaction screening — all impossible 
with overnight batch architectures.
```

### Slides 43-44 — "New Business Market Intelligence and Reporting"
**Current:** Slide 43 = "Header / Point 1" placeholders; Slide 44 = "Space" maturity placeholders
**Fill Slide 43:**
```
Business Objectives:
Provide comprehensive market intelligence on credit markets, lending volumes, 
sector concentrations, and competitive positioning to support strategic credit 
origination decisions. Monitor new business pipeline quality metrics including 
approval rates, decline reasons, time-to-decision, and post-disbursement 
early delinquency indicators. Enable portfolio-level views of new origination 
by product, segment, geography, and risk grade.

Data & Solution:
Data: Application pipeline data, credit bureau scores (ECIB/DataCheck), 
disbursement data, early delinquency flags, SBP sectoral exposure reports, 
competitor rate benchmarks, macroeconomic indicators (KIBOR, CPI, GDP growth)
Analytics: Trend analysis on approval/decline rates by segment, vintage 
analysis on new originations, geographic concentration heat maps, sector 
exposure monitoring vs. SBP prudential limits, competitor benchmarking 
on pricing spreads

Outcome:
Real-time new business dashboard with pipeline quality metrics across all 
lending products (consumer, SME, corporate, agriculture, Islamic). 
Early warning indicators on origination quality degradation. Sector 
concentration alerts against SBP single-obligor and group exposure limits. 
Competitive intelligence on market share trends by product and geography.
```

**Fill Slide 44 (Maturity levels):**
```
Leading: Fully automated new business intelligence platform with real-time 
pipeline monitoring, AI-driven origination quality scoring, and integrated 
market intelligence feeds. Predictive models forecast origination volumes 
and quality metrics. Seamless integration with pricing, profitability, 
and capital allocation decisions.

Innovating: Automated daily reporting on new business metrics with trend 
analysis. Integration of external market data (credit bureau trends, SBP 
sectoral reports). Portfolio-level vintage analysis on new originations 
updated weekly. Risk-adjusted pricing benchmarks available at origination.

Practicing: Monthly new business reporting with basic trend analysis. 
Manual integration of credit bureau and market data. Vintage analysis 
performed quarterly. Geographic and sectoral concentration monitored 
at portfolio level.

Developing: Ad-hoc reporting on new business volumes. No systematic 
vintage analysis or pipeline quality monitoring. Market intelligence 
gathered manually from public sources. Limited connection between 
origination data and portfolio risk metrics.

Emerging: New business reporting limited to volume and value totals. 
No quality metrics, no vintage tracking, no market intelligence 
integration. Post-disbursement monitoring is separate from origination 
analytics.
```

### Slides 51-55 — OPERATIONAL RISK (Entirely placeholder)

**Slide 51 — "Operational Risk" intro:**
**Current:** "### (empty Why is it important)" 
**Fill with:**
```
Operational Risk

Operational risk is defined as the risk of loss resulting from inadequate or 
failed internal processes, people, systems, or from external events. This 
includes legal risk but excludes strategic and reputational risk.

Why is it important?

SBP requires all Pakistani banks to maintain capital for operational risk 
under Basel III — currently using Basic Indicator Approach (BIA) or 
Standardized Approach (TSA), with larger banks expected to adopt Advanced 
Measurement Approach (AMA).

Operational losses in Pakistan banking include: IT system failures (average 
3-4 major incidents per bank annually), fraud losses (internal and external), 
processing errors in trade finance and remittances, regulatory penalties for 
AML/CFT non-compliance, and business continuity disruptions.

The SBP's Risk Management Guidelines require banks to maintain comprehensive 
operational risk management frameworks, loss event databases, Key Risk 
Indicators (KRIs), and Risk & Control Self-Assessments (RCSAs). Banks with 
assets exceeding PKR 500 billion must report operational risk events quarterly.
```

**Slide 52 — "Operational Risk How - Capabilities":**
**Current:** "## (empty)"
**Fill with:**
```
How - Capabilities

Build and maintain a comprehensive operational loss event database capturing 
all loss events with Basel event type classification (7 categories: Internal 
Fraud, External Fraud, Employment Practices, Clients/Products, Physical Assets, 
Business Disruption, Execution/Delivery/Process Management).

Implement Key Risk Indicators (KRIs) with automated threshold monitoring — 
covering system availability, transaction error rates, staff turnover in 
critical roles, pending regulatory findings, audit observations aging.

Deploy Risk & Control Self-Assessment (RCSA) framework across all business 
units with scoring methodology and remediation tracking.

Perform scenario analysis for low-frequency/high-severity operational risk 
events using Monte Carlo simulation and expert elicitation.

Calculate operational risk capital using approved methodology (BIA/TSA/AMA) 
with clear data lineage from loss events to capital charge.

Automate operational risk reporting to Board Risk Committee, SBP, and 
business unit management with drill-down from enterprise to process level.
```

**Slide 53 — "Operational Risk What are the challenges?":**
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Building a data-driven operational risk management framework that moves beyond 
compliance-driven loss event collection toward predictive risk prevention 
and proactive control optimization.

Data Collection Quality
Most Pakistani banks have incomplete operational loss databases — capturing 
only material losses above PKR 1M threshold. Near-misses and boundary events 
are poorly recorded. External loss data is expensive and not Pakistan-specific.
Without comprehensive loss data, capital calculations under AMA are unreliable.

Cross-Functional Integration
Operational risk data spans every department — IT, HR, operations, compliance, 
legal, branch network. No single system captures all relevant risk events. 
Integration requires organizational change, not just technology.

Quantification Challenges
Unlike credit and market risk, operational risk lacks established statistical 
distributions. Fat-tailed loss distributions make VaR-based capital calculations 
unreliable. SBP has been cautious about approving AMA approaches, keeping most 
banks on simpler BIA/TSA methods.

Emerging Risks
Cyber risk, digital channel fraud, third-party vendor risk (especially for 
cloud and fintech partnerships), and IT change management risk are growing 
rapidly but poorly captured in traditional operational risk frameworks.
```

**Slide 54 — "Operational Risk Management" Business Objectives:**
**Current:** "#" placeholders for everything
**Fill with:**
```
Business Objectives:
Establish an enterprise-wide operational risk management capability that 
identifies, assesses, monitors, and mitigates operational risks across all 
business lines and support functions. Enable data-driven decision making 
for control investments and process improvements. Meet SBP operational 
risk capital requirements under Basel III framework. Build forward-looking 
risk indicators that predict control failures before losses materialize.

Data & Solution:
Data: Internal loss event database (Basel 7 event types), Key Risk 
Indicators from all business units, RCSA scores and action items, 
audit findings and remediation status, IT incident logs, customer 
complaints, regulatory correspondence, staff attrition and training 
records, insurance claims data
Analytics: Loss distribution modeling (frequency × severity), Monte 
Carlo simulation for scenario analysis, KRI threshold optimization 
using control chart theory, text mining of incident reports for root 
cause patterns, correlation analysis between KRIs and actual losses, 
network analysis for interconnected risk propagation

Outcome:
Comprehensive operational risk dashboard with real-time KRI monitoring 
and automated alert escalation. Actuarial-quality loss distribution 
models supporting AMA capital calculation. Predictive indicators 
providing early warning of control degradation. Quantified business 
cases for control investments based on expected loss reduction. 
Automated regulatory reporting to SBP with full audit trail.
```

**Slide 55 — "Operational Risk Management" Maturity:**
**Current:** Empty maturity statements (cells exist but blank)
**Fill with:**
```
Leading: Fully integrated operational risk analytics platform with real-time 
KRI monitoring, AI-driven incident classification, automated root cause 
analysis, and predictive control effectiveness scoring. AMA-approved capital 
model with real-time capital allocation. Operational risk fully integrated 
into business decision-making and product approval processes.

Innovating: Comprehensive loss event database with automated classification. 
Advanced scenario analysis using Monte Carlo simulation. KRIs integrated 
with business process monitoring tools. RCSA process largely automated 
with dynamic risk scoring. Operational risk capital calculated using 
internal models alongside regulatory approaches.

Practicing: Structured loss event collection with Basel event type taxonomy. 
Standard set of KRIs monitored monthly. RCSA conducted annually across 
major business units. Basic scenario analysis for material risks. Capital 
calculated using TSA with internal validation.

Developing: Loss event collection in place but inconsistent across business 
units. Limited KRIs focused on IT and processing errors. RCSA process 
paper-based and infrequent. Capital calculated using BIA. Operational risk 
function exists but lacks analytical depth and organizational influence.

Emerging: Minimal operational loss tracking. No formal KRI framework. 
Risk assessments performed ad-hoc after incidents. No scenario analysis. 
Capital calculated using BIA with no internal modeling. Operational risk 
perceived as compliance exercise, not management tool.
```

### Slide 58 — "Collections & Recoveries What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Optimizing the collections process to maximize recovery while minimizing 
operational costs and maintaining customer relationships — balancing 
regulatory requirements (SBP forced sale and write-off timelines) with 
commercial recovery optimization.

Segmentation & Prioritization
Most Pakistani banks use flat dunning cycles without risk-based 
prioritization. High-value, low-risk delinquents receive same treatment 
as high-risk, low-balance accounts — wasting collector capacity and 
damaging customer relationships unnecessarily.

Data Integration
Collections data is often disconnected from origination and behavioral 
data. Collectors lack visibility into customer's full relationship 
(deposits, investments, insurance) that could inform engagement strategy. 
CNIC-based customer unification across products is incomplete.

IFRS 9 Interaction
Stage 3 (credit-impaired) classification triggers specific IFRS 9 
accounting treatment. Collections outcomes directly impact ECL provisions, 
requiring tight integration between collections systems and finance 
provisioning engines. Recovery cash flows must be discounted at original 
effective interest rate.

Regulatory Timelines
SBP Prudential Regulations mandate specific classification timelines 
(OAEM → Substandard → Doubtful → Loss) and forced sale timelines for 
collateral. Non-compliance carries heavy provisioning penalties. Analytics 
needed to optimize recovery within these regulatory windows.
```

---

## Enhancement Guidelines for ALL Existing Content Slides

For slides with real content (15-42, 45-50, 56-60), enhance with:
- Pakistan-specific regulatory references (SBP, SECP, FATF, APG)
- KIBOR term structure references in FTP and pricing contexts
- IFRS 9 Stage 1/2/3 classification where credit risk is discussed
- Basel III CET1, Tier 1, Total Capital ratios (SBP minimums: 6%, 7.5%, 10.5%)
- Pakistan credit bureau references (ECIB - eCIB system, DataCheck)
- PKR denomination and Pakistani accounting conventions
- Islamic banking risk considerations (Murabaha default = different from conventional)
- Update "H1 2018" timeframes to "2025-2026" in all maturity assessment slides

---

## Speaker Notes

Add speaker notes to all placeholder slides with:
- Pakistan regulatory reference (specific SBP circular/regulation number where applicable)
- Connection to FSDM entities (Risk domain: 86 entities, Agreement domain for collateral)
- BACR assessment context (risk management maturity typical Level 2 for Pakistan banks)

---

## Quality Assurance

After repacking, verify:
1. All "Point 1", "Space", "#", "Description", "Question 1/2/3" placeholders eliminated
2. All maturity statements populated with substantive 2-3 sentence descriptions
3. No formatting corruption — fonts, colors, table structures preserved
4. All timeframes updated from "H1 2018" to "2025-2026"
