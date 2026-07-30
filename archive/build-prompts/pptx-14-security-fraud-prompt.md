# Prompt 6D: BVF PowerPoint Updater — 14_Security_Fraud_Overview.pptx

## Role

You are a senior banking fraud analytics and cybersecurity consultant with deep expertise in AML/CFT transaction monitoring, real-time fraud detection systems, identity verification (CNIC/NADRA), card fraud analytics, digital banking security, and Pakistan's regulatory landscape (SBP AML/CFT Guidelines, FATF Mutual Evaluation, PTA cybersecurity regulations). You specialize in Teradata-based fraud data warehouses, network/graph analytics for fraud ring detection, and FSDM entity-based fraud pattern analysis.

---

## Objective

Fill ALL placeholder content in `14_Security_Fraud_Overview.pptx`. This file has 60 slides — approximately 20 contain placeholders ("Point 1", "Space", "Description", "Header", "#"). The remaining have real Teradata content that should be enhanced with Pakistan banking context.

```
INPUT:  ./pptout/14_Security_Fraud_Overview.pptx
OUTPUT: ./pptout/14_Security_Fraud_Overview_UPDATED.pptx
```

---

## Reference Data (Local Repo) — Read FIRST

```
./OVERVIEW.md                                           # Full project context
./fsdm_output/fsdm_analysis_report.json                 # 3,917 FSDM entities
./bvf_fsdm_output/bvf_fsdm_integration_report.json      # 360 BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json                   # 112 BVF sub-capabilities (14 Security & Fraud)
./bacr_output/bacr_analysis_report.json                 # 793 BACR questions
```

---

## Technical Approach

PPTX editing workflow: unpack → Edit slide XML → clean → repack. Preserve ALL formatting. Only replace text in `<a:t>` tags. See Prompt 6 for full workflow.

---

## PLACEHOLDER SLIDES TO FILL

### Slide 11 — "Are You Able To…" (Security & Fraud)
**Current:** "How quickly can you detect… / How do you know what you are getting in your inventory? / Question 3"
**Replace with:**
```
Are You Able To…

How quickly can you detect and block a fraudulent transaction in real-time — 
from card-present POS/ATM fraud to digital channel takeover via JazzCash/
Easypaisa/RAAST — before funds leave the bank, with sub-second decisioning 
across 50M+ daily transactions?

Can you perform entity resolution linking a single fraudster operating across 
multiple CNIC identities, accounts, and channels — using graph analytics to 
uncover fraud rings, money mule networks, and synthetic identity clusters 
that traditional rule-based systems miss?

Can you quantify your total fraud exposure in real-time across all channels 
(branch, ATM, POS, digital, RAAST, IBFT, international remittances) and 
demonstrate to SBP and FATF evaluators that your detection capabilities 
meet international standards for AML/CFT compliance?
```

### Slide 15 — "Common Core for Fraud Analytics - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Building an enterprise-wide fraud analytics capability that detects 
increasingly sophisticated fraud patterns across physical and digital 
channels in real-time, while minimizing false positives that degrade 
customer experience and waste investigator capacity.

Evolving Fraud Landscape
Pakistan's rapid digital payment growth (RAAST PKR 9.8T+ in 2024, JazzCash 
40M+ wallets, Easypaisa 30M+ wallets) has created new fraud vectors — 
SIM-swap fraud, social engineering via WhatsApp/SMS, QR code manipulation, 
and authorized push payment fraud. Traditional rule-based systems cannot 
keep pace with evolving modus operandi.

Data Silos Across Channels
Fraud data sits in separate systems — card fraud in switch/processor, 
digital fraud in app servers, branch fraud in core banking, AML alerts 
in compliance systems. Without a unified fraud data warehouse (FSDM 
provides 200+ Security domain entities), cross-channel fraud patterns 
go undetected. A fraudster blocked on cards simply moves to digital channels.

False Positive Burden
Industry false positive rates for fraud alerts average 95-98% — meaning 
investigators spend most of their time clearing legitimate transactions. 
At UBL's transaction volumes, even 1% false positive rate generates 
thousands of daily alerts. Advanced analytics (ML models, network analysis) 
can reduce false positives by 50-70% while improving detection rates.

FATF/APG Compliance Pressure
Pakistan's FATF grey-listing (2018-2022) and ongoing APG scrutiny require 
banks to demonstrate sophisticated AML/CFT detection capabilities. SBP's 
AML/CFT Guidelines mandate automated transaction monitoring, sanctions 
screening, and suspicious transaction reporting (STRs) — all requiring 
robust analytical infrastructure beyond simple rule engines.
```

### Slides 16-17 — "Real-Time Threat Detection and Mitigation"
**Slide 16 (Business Objectives + Data/Outcome):**
```
Business Objectives:
Detect and respond to fraud threats within milliseconds of transaction 
initiation — blocking fraudulent transactions before funds transfer while 
allowing legitimate transactions to proceed without friction. Cover all 
payment channels: ATM, POS, e-commerce, IBFT, RAAST, international 
remittances, mobile wallet, and branch. Achieve detection rates >80% 
for known fraud patterns while maintaining false positive rates <2%.

Data & Solution:
Data: Real-time transaction stream (50M+ daily across all channels). 
Customer behavioral profiles (spending patterns, geographic patterns, 
time-of-day patterns, device fingerprints). Merchant risk profiles. 
Sanctions and watchlist data (OFAC, UN, SBP list). Historical fraud 
cases with confirmed labels. Device and session data (IP, geolocation, 
browser fingerprint). CNIC/biometric verification data from NADRA.
Analytics: Real-time scoring engine using gradient-boosted ensemble 
models. Velocity checks (transaction frequency, amount acceleration). 
Geospatial anomaly detection (impossible travel, unusual location). 
Network analytics for fraud ring detection. Behavioral profiling with 
dynamic threshold adjustment. Sanctions screening with fuzzy name matching.

Outcome:
Sub-second fraud scoring on 100% of transactions across all channels. 
Real-time block/allow/review decisioning with configurable risk thresholds. 
Automated case creation for review queue with risk-ranked prioritization. 
50-70% reduction in false positive rates vs. rule-based systems. Real-time 
fraud dashboard showing threat levels, blocked transactions, and detection 
rates by channel and fraud type.
```

**Slide 17 (Maturity levels — fill "Space" placeholders):**
```
Leading: Fully automated real-time fraud detection across all channels using 
AI/ML models with continuous learning. Sub-100ms response time. Models 
self-adapt to new fraud patterns within hours. Integrated across fraud, AML, 
and cyber security with unified threat intelligence. Behavioral biometrics 
(keystroke, swipe patterns) augment transaction-level detection.

Innovating: ML-based fraud scoring operational on primary channels with 
model refresh quarterly. Near-real-time detection (<5 seconds) on digital 
channels. Network analytics identify fraud rings. Integration between 
fraud and AML systems for shared intelligence. False positive rate <5%.

Practicing: Rule-based detection with periodic ML model augmentation. 
Batch-based detection for some channels, real-time for cards. Separate 
fraud systems per channel with manual cross-referencing. Monthly model 
performance review. False positive rate 10-20%.

Developing: Primarily rule-based detection focused on card fraud. Digital 
channels monitored reactively (post-incident analysis). No ML models in 
production. Alert investigation is manual with no prioritization. Limited 
cross-channel visibility.

Emerging: Fraud detection relies on customer complaints and manual 
reconciliation. No automated monitoring. Reactive investigation only. 
No systematic fraud analytics capability. Basic velocity rules on 
ATM/POS only.
```

### Slides 18-19 — "Fraud Risk Assessment"
**Slide 18:**
```
Business Objectives:
Establish a comprehensive fraud risk assessment framework that identifies, 
measures, and monitors fraud exposure across all products, channels, and 
customer segments. Enable proactive fraud prevention by understanding 
vulnerability patterns before losses occur. Support SBP's requirement for 
annual fraud risk assessments and FATF's recommendation for risk-based 
approach to financial crime prevention.

Data & Solution:
Data: Historical fraud loss data by type, channel, product, and segment. 
Transaction volumes and patterns by channel. Customer complaint data. 
Internal audit findings on control weaknesses. Industry fraud benchmark 
data (SBP fraud statistics, PBA reports). Control effectiveness assessments. 
New product/channel risk assessments. Third-party vendor risk data.
Analytics: Fraud risk scoring by product-channel combination using 
historical loss rates and control assessments. Heat map generation 
for residual fraud risk after controls. Trend analysis on fraud patterns 
and emerging threats. Benchmarking against industry loss rates. Monte 
Carlo simulation for potential fraud loss scenarios.

Outcome:
Annual fraud risk assessment report with quantified residual risk by 
product, channel, and fraud type. Fraud risk heat map showing highest-
vulnerability areas for focused investment. Control gap analysis with 
prioritized remediation recommendations. Emerging threat intelligence 
report covering new fraud vectors relevant to Pakistan's market. 
Board-level fraud risk dashboard for Audit Committee reporting.
```

**Slide 19 maturity (fill "Space"):**
```
Leading: Continuous, automated fraud risk assessment integrated into 
business operations. Risk scores updated in real-time as new data arrives. 
Predictive models anticipate emerging fraud threats before losses materialize. 
Risk appetite for fraud fully quantified and cascaded to business units.

Innovating: Quarterly fraud risk assessments using statistical methods. 
Cross-channel risk correlation analysis. Emerging threat monitoring from 
industry and international sources. Fraud risk integrated into product 
development lifecycle (risk assessment for new products/channels).

Practicing: Annual fraud risk assessment covering major products and 
channels. Risk scoring based on historical loss data. Control effectiveness 
testing integrated into assessment. Basic benchmarking against industry 
data. Results inform annual fraud prevention budget.

Developing: Ad-hoc fraud risk assessments driven by incidents or audit 
findings. Qualitative risk assessment without statistical rigor. Limited 
cross-channel view. Assessment focused on known fraud types with minimal 
emerging threat analysis.

Emerging: No formal fraud risk assessment process. Fraud risk perceived 
as operational issue, not strategic risk. Reactive approach — assessments 
conducted only after significant losses. No fraud risk metrics or KPIs.
```

### Slides 20-21 — "Fraud Incident Management"
**Slide 20:**
```
Business Objectives:
Streamline the end-to-end fraud incident management lifecycle — from 
detection/alert through investigation, resolution, recovery, and 
regulatory reporting. Ensure all fraud incidents are captured, classified, 
investigated within SLA, and reported to SBP/FIA as required. Build a 
fraud knowledge base that improves detection over time through feedback 
loops from confirmed fraud cases.

Data & Solution:
Data: Alert and case management data (alerts generated, cases opened, 
investigation outcomes). Transaction data related to fraud incidents. 
Customer communication logs during investigation. Evidence documentation 
(CCTV footage, digital forensics, customer statements). Recovery actions 
and outcomes. Regulatory reporting submissions (STRs, CTRs to FMU).
Analytics: Case prioritization scoring based on fraud amount, customer 
impact, and investigation complexity. SLA monitoring and escalation 
automation. Root cause analysis of fraud incidents by type and channel. 
Recovery probability scoring for loss recovery prioritization. Trend 
analytics on incident volumes, types, and resolution times.

Outcome:
Unified fraud case management platform tracking all incidents from alert 
to closure. Automated SLA monitoring with escalation workflows. SBP/FMU 
regulatory report generation (STRs, CTRs) with complete audit trail. 
Fraud loss database meeting SBP operational risk loss event requirements. 
Management dashboard showing incident volumes, investigation throughput, 
recovery rates, and regulatory compliance metrics.
```

**Slide 21 maturity (fill "Space"):**
```
Leading: Fully automated incident management with AI-assisted investigation 
workflows. Real-time case routing to specialist investigators. Automated 
evidence gathering and documentation. Direct SBP/FMU electronic submission. 
Machine learning from resolved cases continuously improves detection models.

Innovating: Automated alert-to-case conversion with intelligent deduplication. 
Investigation playbooks by fraud type guide investigators. Semi-automated 
regulatory reporting. Case outcome feedback loop to detection models quarterly. 
Average case resolution within 5 business days.

Practicing: Structured case management system with defined workflows. Manual 
case assignment with basic prioritization. Monthly fraud reporting to 
management. Regulatory reports generated with manual data compilation. Average 
case resolution within 15 business days.

Developing: Spreadsheet or email-based case tracking. Ad-hoc investigation 
processes varying by investigator. Limited case documentation. Regulatory 
reporting is manual and time-consuming. No systematic feedback from 
investigation outcomes to detection systems.

Emerging: No formal incident management process. Fraud cases handled 
reactively with no tracking system. Investigation outcomes not documented 
systematically. Regulatory reporting at risk of non-compliance. No 
organizational learning from fraud incidents.
```

### Slides 22-23 — "Fraud Investigations and Forensics"
**Slide 22:**
```
Business Objectives:
Equip fraud investigation teams with advanced analytics tools for rapid, 
thorough investigations — reducing average investigation time from weeks 
to days while improving evidence quality for law enforcement referrals 
and recovery actions. Enable investigators to trace complex fraud schemes 
across multiple accounts, entities, and channels using entity resolution 
and link analysis.

Data & Solution:
Data: Full transaction history across all channels for suspect entities. 
Account opening documentation and KYC records. CNIC verification audit 
trail (NADRA checks). Communication records (call logs, email, SMS where 
legally available). CCTV and branch surveillance data. Digital forensics 
data (device logs, IP addresses, session recordings). Third-party data 
(credit bureau, ECIB, commercial registries).
Analytics: Entity resolution linking related accounts through shared 
attributes (phone, address, CNIC, device, beneficiary). Graph analytics 
visualizing transaction networks and fund flows. Timeline analysis 
reconstructing fraud event sequences (nPath). Text analytics on 
investigation notes and customer communications. Geospatial analysis 
mapping physical locations to transaction patterns. Digital forensics 
for device and session analysis.

Outcome:
Investigation workbench providing 360-degree view of suspect entities 
with linked accounts and transaction history. Visual network maps showing 
fund flows and entity relationships. Automated evidence package generation 
for FIA/law enforcement referral. Investigation timeline reconstruction 
with chronological event mapping. Case documentation templates meeting 
legal and regulatory evidence standards.
```

**Slide 23 maturity (fill "Space"):**
```
Leading: AI-assisted investigation with automated evidence gathering, network 
visualization, and report generation. Investigators guided by ML-identified 
patterns. Real-time access to all data sources from single interface. Average 
investigation completed in 2-3 days with prosecution-ready evidence packages.

Innovating: Graph analytics and entity resolution tools available to 
investigators. Automated data extraction from multiple source systems. 
Investigation templates and playbooks by fraud type. Digital forensics 
capability for cyber fraud cases. Cross-channel investigation capability.

Practicing: Investigation tools provide access to transaction data with 
basic search and filter. Manual data extraction from different systems 
required. Some visualization tools available for fund flow tracing. 
Investigation reports standardized but manually compiled.

Developing: Investigators rely on manual data pulls from individual systems. 
Limited analytical tools — primarily spreadsheet-based analysis. No entity 
resolution or link analysis capability. Investigation quality depends 
heavily on individual investigator experience and effort.

Emerging: Investigations conducted without analytical tools. Data gathered 
manually through ad-hoc requests to operations teams. No systematic 
evidence management. Investigation outcomes poorly documented. Limited 
referrals to law enforcement due to weak evidence packages.
```

### Slides 24-25 — "Fraud Loss Recovery"
**Slide 24:**
```
Business Objectives:
Maximize recovery of fraud losses through systematic identification of 
recovery avenues — chargeback processes, insurance claims, legal recovery, 
asset seizure, and cross-institution recovery via SBP dispute mechanisms. 
Pakistan banks recover only 15-25% of fraud losses due to fragmented 
recovery processes and delayed action. Analytics-driven recovery 
prioritization can increase recovery rates by 30-50%.

Data & Solution:
Data: Confirmed fraud case data (amount, type, channel, perpetrator if 
known). Chargeback eligibility data (scheme rules, timeframes). Insurance 
policy coverage and claims history. Legal case data (FIR status, court 
proceedings). Asset/account data of identified perpetrators. Cross-bank 
recovery coordination data (SBP mediation cases).
Analytics: Recovery probability scoring by fraud type and recovery avenue. 
Chargeback optimization (maximize recoveries within scheme timeframes). 
Cost-benefit analysis of legal recovery vs. write-off. Network analysis 
identifying recoverable assets of fraud ring participants. Time-value 
analysis of recovery — NPV of delayed recovery vs. immediate settlement.

Outcome:
Automated recovery workflow triggered upon fraud confirmation — parallel 
initiation of all applicable recovery avenues. Recovery dashboard tracking 
amounts by avenue (chargeback, insurance, legal, direct). Recovery 
probability scoring guiding resource allocation to highest-recovery cases. 
SBP dispute mechanism utilization optimization. Fraud loss and recovery 
reporting meeting SBP operational risk data requirements.
```

**Slide 25 maturity (fill "Space"):**
```
Leading: Automated multi-channel recovery initiation within 24 hours of 
fraud confirmation. ML-based recovery probability scoring drives resource 
allocation. Cross-institution recovery facilitated through automated SBP 
dispute mechanisms. Recovery rates exceed 50% of detected fraud losses.

Innovating: Structured recovery process with prioritization based on 
recovery probability. Chargeback processes optimized within scheme timeframes. 
Insurance claims systematically filed. Legal recovery tracked with 
cost-benefit analysis. Recovery rates 35-50%.

Practicing: Recovery processes defined but manual. Chargeback management 
in place for card fraud. Insurance claims filed for eligible losses. 
Legal recovery pursued for material cases. Recovery tracking exists but 
not optimized. Recovery rates 20-35%.

Developing: Recovery efforts are reactive and inconsistent. Chargebacks 
filed for obvious cases only. Insurance coverage underutilized. Legal 
recovery sporadic. No systematic tracking of recovery outcomes or 
recovery rate metrics.

Emerging: No systematic fraud loss recovery process. Losses absorbed 
without recovery effort except for very large cases. No chargeback 
optimization. Insurance claims not systematically filed. Fraud losses 
treated as cost of doing business.
```

### Slide 28 — "Employee Fraud" intro
**Current:** "Description / Point 1/2/3" placeholders
**Fill with:**
```
Employee Fraud

Internal fraud by bank employees — including unauthorized transactions, 
embezzlement, collusion with external fraudsters, document manipulation, 
and misuse of privileged system access — poses unique risks due to 
insiders' knowledge of controls and trusted access to systems and data.

Why is it important?

Employee fraud causes disproportionate damage in Pakistan's banking sector 
where branch operations remain heavily manual. SBP inspection reports 
consistently cite internal fraud as a top operational risk concern, with 
average internal fraud losses of PKR 500M-1B annually for large banks.

Insider knowledge of control gaps, override procedures, and customer 
data makes internal fraud harder to detect and potentially larger in 
magnitude than external fraud. A single insider can cause losses exceeding 
PKR 100M before detection.

Reputational damage from publicized employee fraud cases erodes customer 
trust and regulatory confidence. SBP requires banks to report all internal 
fraud cases and maintain zero-tolerance policies with consequences including 
blacklisting through Pakistan Banks Association (PBA).
```

### Slide 29 — "Employee Fraud - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Detecting fraudulent behavior by trusted insiders who understand and can 
circumvent established controls — requiring behavioral analytics that 
identify anomalous patterns without generating excessive false positives 
that undermine employee trust and morale.

Privileged Access Exploitation
Branch managers, operations officers, and IT administrators have 
legitimate access to sensitive systems and data. Traditional access 
controls cannot distinguish between legitimate and fraudulent use of 
authorized privileges. Behavioral analytics must establish baselines 
and detect deviations.

Collusion Detection
Employee fraud often involves collusion — between employees, or between 
employees and external parties (customers, vendors). Collusion is 
inherently harder to detect because transactions appear individually 
legitimate but are collectively fraudulent. Graph analytics needed to 
identify suspicious relationship patterns.

Cultural and Organizational Barriers
Reporting suspected colleagues faces cultural resistance in Pakistan's 
relationship-oriented workplace. Whistleblower protections are limited. 
Senior management fraud is particularly difficult to detect due to 
override authority and organizational hierarchy.

Manual-Heavy Operations
Pakistan's banking sector still relies on paper-based processes, manual 
vouchers, and physical document handling in many branches — creating 
opportunities for document fraud, unauthorized transactions, and cash 
pilferage that purely digital monitoring cannot detect.
```

### Slides 38-39 — "Internal Theft, Shrinkage, Embezzlement"
**Slide 38:**
```
Business Objectives:
Detect and prevent internal theft, cash shortages, and embezzlement across 
the branch network — covering cash vault discrepancies, unauthorized inter-
branch transfers, fictitious account transactions, dormant account 
exploitation, and misappropriation of customer funds. Enable continuous 
monitoring rather than periodic audit-based detection. Support SBP 
requirement for operational loss event reporting.

Data & Solution:
Data: Branch-level cash vault data (opening/closing balances, cash movement). 
Teller transaction logs with biometric authentication. Inter-branch transfer 
records. Dormant/unclaimed account activity. GL posting data and reconciliation 
exceptions. Employee access logs (system logins, after-hours access). Expense 
claims and procurement data. Customer complaint data (missing deposits, 
unauthorized debits). Physical security data (vault access logs, CCTV).
Analytics: Statistical anomaly detection on cash position trends by branch. 
Benford's Law analysis on transaction amounts. Pattern detection on GL 
posting exceptions and reconciliation breaks. Employee behavioral profiling 
(transaction volumes, timing, overrides vs. peer baseline). Network analysis 
linking employee transactions to related-party accounts. Dormant account 
activation monitoring with employee correlation.

Outcome:
Automated daily monitoring of all branch cash positions with anomaly 
alerting. Employee behavioral risk scores updated monthly identifying 
highest-risk individuals for enhanced monitoring. Dormant account activation 
alerts with mandatory independent verification. GL reconciliation exception 
dashboard with aging and risk categorization. Internal fraud case management 
integrated with HR disciplinary and legal processes.
```

**Slide 39 maturity (fill "Space"):**
```
Leading: AI-driven continuous monitoring of all employee activities with 
behavioral risk scoring. Automated correlation of cash movements, transactions, 
and access patterns. Real-time alerts for anomalous behavior with investigation 
workflow triggers. Predictive models identify high-risk employees before 
losses occur. Integrated with whistleblower and ethics reporting systems.

Innovating: Automated daily monitoring of cash positions, GL exceptions, and 
employee transaction patterns. Statistical anomaly detection operational across 
branch network. Dormant account monitoring automated. Quarterly behavioral 
risk scoring of all employees in sensitive positions.

Practicing: Periodic automated checks on cash positions and reconciliation 
exceptions. Branch audit analytics supplementing physical audits. Employee 
access reviews conducted semi-annually. Dormant account monitoring manual 
but systematic. Internal fraud reporting structure in place.

Developing: Detection relies primarily on periodic branch audits and customer 
complaints. Limited automated monitoring. Cash shortage investigations are 
reactive. Employee screening limited to hiring stage with no ongoing monitoring. 
Internal fraud reporting informal.

Emerging: No systematic internal theft monitoring. Detection depends entirely 
on annual branch audits, customer complaints, or whistleblower reports. 
Cash shortages investigated ad-hoc. No employee behavioral analytics. 
Internal fraud treated as isolated incidents rather than systemic risk.
```

### Slide 40 — "Customer Fraud" intro (v2 — first intro is placeholder)
**Current:** "Description / Point 1/2/3" placeholders
**Fill with:**
```
Customer Fraud

External fraud perpetrated by customers or third parties targeting the 
bank's products, services, and customers — including application fraud 
(false identity/income), transaction fraud (unauthorized card/digital 
payments), identity theft, account takeover, and organized fraud rings.

Why is it important?

Customer fraud losses in Pakistan's banking sector exceed PKR 5B+ annually 
and are growing rapidly with digital channel adoption. Card fraud, SIM-swap 
attacks, social engineering, and authorized push payment fraud are the 
fastest-growing categories.

Digital payment channels (RAAST, IBFT, mobile wallets) process PKR 15T+ 
annually with real-time settlement — fraudulent transactions are 
irrecoverable within seconds, unlike traditional branch transactions 
where reversal windows exist.

FATF compliance requirements mandate robust customer fraud detection 
as part of the broader financial crime prevention framework. Banks failing 
to demonstrate adequate fraud detection capabilities face regulatory 
sanctions and potential correspondent banking relationship impacts.
```

### Slide 43 — "Customer Fraud - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Detecting fraudulent customer activity across rapidly multiplying digital 
channels while maintaining frictionless customer experience — balancing 
security with usability in a market where 100M+ mobile wallet users 
expect instant transactions.

Speed vs. Security Trade-off
Real-time payment systems (RAAST, IBFT) complete settlement in seconds — 
fraud detection must operate within this window without adding customer-
perceptible latency. Each millisecond of additional processing risks 
customer abandonment in competitive digital payments market.

Evolving Attack Vectors
Fraud techniques evolve continuously: SIM-swap fraud bypasses SMS OTP, 
deepfake voice/video defeats biometric verification, social engineering 
targets bank employees and customers simultaneously, and authorized 
push payment fraud exploits customer trust rather than system 
vulnerabilities.

Identity Verification Gaps
Despite CNIC-based KYC, Pakistan's identity infrastructure has gaps: 
deceased CNIC exploitation, NADRA database errors, synthetic identity 
construction using partial real data, and weak beneficial ownership 
verification for business accounts.

Cross-Channel Complexity
Customers interact through 8+ channels (branch, ATM, POS, internet 
banking, mobile app, RAAST, IBFT, call center) — fraud prevention 
must monitor all channels coherently while fraudsters exploit the 
weakest link.
```

### Slide 54 — "Information and Cyber Security - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Protecting the bank's digital infrastructure, customer data, and financial 
assets against increasingly sophisticated cyber threats — from nation-state 
actors and organized cybercrime groups to insider threats and supply chain 
compromises — while supporting rapid digital transformation.

Expanding Attack Surface
Digital banking adoption (internet banking, mobile apps, API integrations, 
cloud services) exponentially expands the attack surface. Each new digital 
product or partner integration creates potential vulnerabilities. Pakistan 
banks reported 3x increase in cyber incidents between 2020-2024.

Talent Shortage
Pakistan has fewer than 5,000 qualified cybersecurity professionals for 
an economy with 35+ banks, hundreds of financial institutions, and 
critical national infrastructure. Banks compete with global employers 
for limited talent. In-house SOC capabilities are immature at most banks.

Third-Party Risk
Banks increasingly rely on third-party vendors (cloud providers, fintech 
partners, payment processors, ATM network operators) who may have weaker 
security postures. Supply chain attacks targeting bank vendors can bypass 
the bank's own defenses.

Regulatory Pressure
SBP's IT Security Guidelines, PTA cybersecurity regulations, and 
international standards (PCI-DSS for card data) impose compliance 
requirements. Data localization mandates require Pakistan-based 
infrastructure, limiting options for global cybersecurity services.
```

### Slides 57-58 — "Governance" (Information and Cyber Security)
**Slide 57:**
```
Business Objectives:
Establish a comprehensive information security governance framework 
aligned with SBP IT Security Guidelines, ISO 27001, and NIST Cybersecurity 
Framework. Define clear roles, responsibilities, policies, and metrics 
for cybersecurity across the organization. Enable Board-level oversight 
of cyber risk as a strategic business risk.

Data & Solution:
Data: Security policy compliance status across business units. Vulnerability 
assessment and penetration testing results. Security incident logs and 
response metrics. Employee security awareness training completion rates. 
Third-party vendor security assessment scores. Regulatory compliance 
status (SBP IT Security, PCI-DSS, data protection). Security investment 
and budget utilization data.
Analytics: Security posture scoring combining multiple governance 
indicators. Compliance gap analysis against SBP/ISO/NIST frameworks. 
Risk-based prioritization of security investments. Trend analysis on 
security incidents, vulnerabilities, and compliance metrics. Benchmarking 
against financial sector peers and international standards. KRI monitoring 
for governance effectiveness.

Outcome:
Information security governance dashboard for Board/Audit Committee 
with overall security posture score. Automated compliance monitoring 
against SBP IT Security Guidelines with gap alerts. Risk-based security 
investment recommendations with cost-benefit quantification. Vendor risk 
management dashboard showing third-party security posture. Employee 
security awareness metrics and training effectiveness tracking.
```

**Slide 58 maturity (fill "Space"):**
```
Leading: Fully integrated security governance with real-time posture 
monitoring, automated compliance checking, and risk-based investment 
optimization. Cyber risk quantified in financial terms for Board reporting. 
Zero-trust architecture fully implemented. Security embedded in all 
business processes and product development.

Innovating: Comprehensive governance framework aligned to ISO 27001 and 
SBP guidelines. Regular Board reporting on cyber posture. Vendor risk 
management program operational. Security metrics drive investment decisions. 
Annual third-party assessment confirms effectiveness.

Practicing: Documented security policies covering major risk areas. Periodic 
compliance assessments against SBP requirements. Board receives annual 
cybersecurity report. Basic vendor security assessments for critical vendors. 
Incident response plan documented and tested.

Developing: Security policies exist but inconsistently applied. Compliance 
checking manual and periodic. Board awareness of cyber risk limited. Vendor 
security assessments ad-hoc. Incident response plan documented but 
untested. Security governance reporting fragmented.

Emerging: Minimal formal security governance. Policies outdated or absent. 
No systematic compliance monitoring. Board not regularly briefed on cyber 
risk. No vendor security program. Incident response capabilities 
improvised. Security treated as IT department responsibility only.
```

---

## Enhancement Guidelines for ALL Existing Slides

For slides with real content, enhance with:
- Pakistan-specific fraud statistics and examples
- CNIC/NADRA identity verification references
- RAAST/IBFT/JazzCash/Easypaisa channel-specific fraud scenarios
- SBP AML/CFT Guidelines and FATF compliance references
- PCI-DSS compliance for card fraud
- SBP IT Security Guidelines for cyber security
- PKR denomination for all financial figures
- FSDM entity references (INDVDL, EVNT, CNTCT for fraud detection)
- Update "H1 2018" timeframes to "2025-2026"

---

## Quality Assurance

After repacking, verify:
1. ZERO remaining "Point 1", "Space", "Description", "#", "Header" placeholders
2. All maturity level cells populated with 2-3 sentence substantive descriptions
3. Pakistan-specific references in every placeholder slide
4. No formatting corruption
5. Visual QA on all 60 slides
