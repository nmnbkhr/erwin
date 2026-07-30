# Prompt 6F: BVF PowerPoint Updater — 16_Regulatory_Compliance.pptx

## Role

You are a senior banking regulatory compliance consultant with deep expertise in SBP (State Bank of Pakistan) prudential regulations, Basel III/IV implementation, IFRS 9/16/17 accounting standards, AML/CFT (FATF/APG compliance), Pakistan's financial regulatory landscape (SECP, FBR, FMU, PTA), consumer protection regulations, and Teradata FSDM-based regulatory data warehouses. You specialize in building integrated regulatory compliance analytics platforms for Pakistani commercial banks.

---

## Objective

Fill ALL placeholder content in `16_Regulatory_Compliance.pptx`. This file has 45 slides — approximately 20 contain placeholders ("Point 1", "Space", "Description", "Header", "Question 1/2/3"). The AML, Capital Management, BCBS 239, CCAR, Solvency II, Volcker, Sarbanes-Oxley, IFRS 15, and Communications Compliance slides have real content but need Pakistan contextualization. Consumer Protection section is almost entirely placeholder.

```
INPUT:  ./pptout/16_Regulatory_Compliance.pptx
OUTPUT: ./pptout/16_Regulatory_Compliance_UPDATED.pptx
```

---

## Reference Data (Local Repo) — Read FIRST

```
./OVERVIEW.md                                           
./fsdm_output/fsdm_analysis_report.json                 # 3,917 FSDM entities, Compliance domain
./bvf_fsdm_output/bvf_fsdm_integration_report.json      # 360 BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json                   # 12 Legal & Regulatory sub-capabilities
./bacr_output/bacr_analysis_report.json                 
```

---

## Technical Approach

PPTX editing workflow: unpack → Edit slide XML → clean → repack. Replace ONLY text in `<a:t>` tags. Preserve all formatting.

---

## PLACEHOLDER SLIDES TO FILL

### Slide 7 — "Are You Able To…" (Regulatory Compliance)
**Current:** "Question 1 / Question 2 / Question 3"
**Fill with:**
```
Are You Able To…

Can you produce all 200+ monthly, quarterly, and annual SBP regulatory 
returns — from prudential classification (CL-1/CL-2), capital adequacy 
(CAR), foreign exchange position, IFRS 9 ECL staging, to AML/CFT STR 
reporting — from a single integrated data source with full audit trail 
and reconciliation to General Ledger within T+5 business days?

Can you demonstrate to FATF/APG evaluators that your AML/CFT transaction 
monitoring covers 100% of customer transactions across all channels (branch, 
ATM, IBFT, RAAST, mobile wallets, trade finance, remittances) with 
risk-based alert thresholds, sanctions screening, and automated STR 
generation — all compliant with SBP AML/CFT Guidelines 2020?

Can you perform Basel III stress testing under SBP-specified macroeconomic 
scenarios (PKR devaluation, KIBOR spike, GDP contraction, sectoral stress) 
computing capital adequacy impact at individual facility level with full 
data lineage from source transaction to capital ratio — and complete this 
within the 2-week ICAAP submission timeline?
```

### Slide 11 — "Finance and Accounting - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Building an integrated regulatory compliance data infrastructure that 
serves multiple regulators (SBP, SECP, FBR, FATF, PTA) from a single 
source of truth — eliminating the 40-60 separate regulatory data 
extraction processes that most Pakistani banks maintain, each with 
different data definitions, reconciliation issues, and manual interventions.

Regulatory Volume and Velocity
Pakistani banks submit 200+ regulatory returns to SBP alone — monthly 
prudential returns (CL-1, CL-2, CL-3), quarterly capital adequacy reports, 
annual ICAAP submissions, ongoing AML/CFT STRs/CTRs, FATF-mandated 
compliance reporting, and ad-hoc regulatory requests. Each return has 
different granularity, classification, and timing requirements. Manual 
preparation consumes 100+ FTE-equivalent effort annually at large banks.

Data Quality and Reconciliation
Regulatory returns must reconcile to audited financial statements and 
General Ledger — yet most returns are prepared from separate data 
extracts with manual adjustments. Reconciliation breaks between credit 
classification returns and financial reporting are a top SBP inspection 
finding. IFRS 9 stage classification must be consistent across all returns.

Evolving Regulatory Landscape
Pakistan's regulatory environment is rapidly intensifying: Basel III 
capital requirements increasing (minimum CAR to 12.5% by 2026 including 
D-SIB buffer), IFRS 9 ECL provisioning fully effective, FATF compliance 
requirements continuing post-grey-list exit, SBP digital banking 
regulations expanding, and new ESG/climate risk disclosure emerging.

Cross-Regulatory Consistency
Same underlying data must satisfy multiple regulators with different 
classification rules. A single customer exposure appears in credit 
classification returns, capital adequacy reports, AML monitoring, tax 
reporting, and financial statements — each with different aggregation 
and classification requirements but needing to reconcile.
```

### Slides 16-17 — "Financial Reporting Regulation"
**Slide 16:**
```
Business Objectives:
Automate financial regulatory reporting covering SBP prudential returns, 
SECP annual filing requirements, FBR tax compliance, and international 
standards (IFRS 9, IFRS 16, IFRS 17). Build a single regulatory data 
warehouse serving all financial reporting obligations with consistent 
data definitions, automated calculations, and full audit trail. Reduce 
reporting cycle from T+15 to T+5 business days while improving accuracy.

Data & Solution:
Data: General Ledger transaction data. Sub-ledger details (lending, 
deposits, treasury, trade finance). Customer classification and risk 
rating data. IFRS 9 ECL staging and provision data. Capital adequacy 
components (RWA by asset class, capital instruments). Foreign exchange 
position data. Sector and geographic classification codes (SBP standard). 
Organizational hierarchy (business units, branches, profit centers). 
FSDM Finance domain entities (300+ entities covering GL, sub-ledger, 
regulatory).
Analytics: Automated regulatory return generation with validation rules. 
Reconciliation analytics (GL ↔ sub-ledger ↔ regulatory return). Data 
quality monitoring with automated exception detection. Trend analysis 
on regulatory metrics (CAR trajectory, NPL trend, provision coverage). 
Regulatory deadline monitoring and workflow management.

Outcome:
Automated generation of top 50 SBP regulatory returns from integrated 
data warehouse. Full reconciliation trail from source transaction through 
GL to regulatory line item. Regulatory calendar with workflow management 
and deadline tracking. Data quality dashboard showing completeness, 
accuracy, and timeliness metrics. Regulatory trend analysis for proactive 
management of key ratios.
```

**Slide 17 maturity (fill "Space"):**
```
Leading: Fully automated regulatory reporting from integrated data warehouse. 
Real-time regulatory position monitoring. Automated reconciliation with 
exception-only manual intervention. Proactive regulatory risk indicators 
alerting management to approaching threshold breaches. Regulatory sandbox 
for impact analysis of new regulations before effective date.

Innovating: Most regulatory returns automated with T+5 delivery. Automated 
reconciliation covering major returns. Regulatory data quality metrics 
tracked and managed. Regulatory change management process identifies new 
requirements and maps to data/system changes. Quarterly regulatory 
position trend analysis for Board.

Practicing: Major regulatory returns semi-automated (automated data 
extraction, manual formatting and validation). Reconciliation performed 
manually but systematically. Regulatory deadline tracking in place. 
Data quality issues identified during preparation and corrected. 
T+10-15 delivery cycle.

Developing: Regulatory returns prepared from multiple data extracts with 
significant manual intervention. Limited reconciliation — breaks identified 
during audit rather than proactively. Deadline pressure causes quality 
trade-offs. Multiple spreadsheets and manual processes. T+15-20 delivery.

Emerging: Regulatory reporting entirely manual. Multiple teams prepare 
overlapping returns from different data sources. No systematic reconciliation. 
Frequent SBP findings on data quality and timeliness. Regulatory compliance 
is reactive — preparing returns on deadline rather than maintaining 
continuous regulatory position visibility.
```

### Slides 18-19 — "Disclosure"
**Slide 18:**
```
Business Objectives:
Automate regulatory and public disclosure requirements — including Pillar 3 
(Basel III market discipline disclosure), annual report disclosures (IFRS 7 
financial instrument disclosures, IFRS 9 credit risk disclosures), SBP 
quarterly disclosure requirements, and PSX listing compliance. Build 
consistent disclosure data pipeline ensuring public disclosures reconcile 
precisely to regulatory returns and financial statements.

Data & Solution:
Data: Capital adequacy components for Pillar 3 templates. Risk exposure 
data by asset class, geography, sector, maturity. IFRS 9 stage migration 
data and ECL movement analysis. Credit quality data (risk grade 
distribution, impairment, write-offs). Market risk position data (VaR, 
stressed VaR). Remuneration data for senior management. Counterparty 
credit risk data. Securitization exposure data.
Analytics: Automated Pillar 3 template population from regulatory data 
warehouse. Year-on-year comparison and movement analysis. Narrative 
generation support for qualitative disclosures. Cross-validation between 
Pillar 3, financial statements, and regulatory returns. Peer benchmarking 
on disclosure quality and completeness.

Outcome:
Automated Pillar 3 disclosure templates (quantitative sections) produced 
quarterly. IFRS 7/9 disclosure tables generated from same data source as 
financial statements. Disclosure calendar with workflow management. Cross-
validation report showing consistency between disclosure, regulatory returns, 
and financial statements. Disclosure quality benchmarking against peer banks.
```

**Slide 19 maturity (fill "Space"):**
```
Leading: Fully automated quantitative disclosures from integrated data 
warehouse. AI-assisted qualitative narrative generation. Real-time 
disclosure position monitoring. Automated cross-validation across all 
public and regulatory disclosures. Disclosure quality exceeds peer 
benchmarks and satisfies analyst/investor expectations.

Innovating: Most quantitative disclosures automated. Cross-validation 
between disclosures and financial statements systematic. Disclosure 
templates updated within 30 days of new regulatory requirements. 
Qualitative disclosures drafted by subject matter experts with data 
support from analytics platform.

Practicing: Key Pillar 3 quantitative tables semi-automated. IFRS 
disclosure tables prepared with some manual compilation. Basic cross-
validation performed. Disclosure updates for regulatory changes handled 
within reporting cycle. Annual report disclosures meet minimum requirements.

Developing: Disclosure preparation largely manual using spreadsheet 
extracts. Limited cross-validation — inconsistencies identified by 
auditors. Pillar 3 templates populated manually from regulatory returns. 
Disclosure updates reactive — scrambling when new requirements emerge.

Emerging: Disclosure treated as annual/quarterly compliance exercise with 
no ongoing data pipeline. Manual compilation from multiple sources. No 
cross-validation. Minimal Pillar 3 disclosure — meeting letter rather 
than spirit of requirements. SBP/auditor findings on disclosure gaps.
```

### Slide 20 — "Consumer Protection" intro
**Current:** "Revenue Integrity is defined as / Point 1/2/3" (clearly wrong content)
**Fill with:**
```
Consumer Protection

Consumer protection in banking encompasses the regulatory framework and 
analytical capabilities ensuring fair treatment of customers — covering 
transparent product disclosure, fair pricing, responsible lending, data 
privacy, complaint resolution, and protection against discriminatory or 
predatory practices.

Why is it important?

SBP's Fair Treatment of Consumers framework mandates that banks treat 
customers fairly throughout the product lifecycle — from marketing and 
sales through servicing and complaint resolution. Compliance requires 
systematic monitoring of customer outcomes across all products and channels.

Pakistan's banking sector serves 60M+ account holders including 
vulnerable populations (low-income, elderly, digitally illiterate) who 
require additional protections. Financial inclusion goals must be 
balanced with responsible lending and transparent pricing to prevent 
predatory outcomes.

Regulatory penalties for consumer protection violations are increasing — 
SBP has imposed significant fines for misleading advertising, unfair 
contract terms, and poor complaint handling. Reputational damage from 
publicized consumer protection failures impacts customer acquisition 
and retention in an increasingly competitive market.
```

### Slide 21 — "Consumer Protection - What are the challenges?"
**Current:** "Description / Point 1" placeholders
**Fill with:**
```
Overall challenge:
Building systematic, data-driven consumer protection monitoring that 
demonstrates fair customer outcomes across all products, channels, and 
customer segments — moving beyond reactive complaint handling to proactive 
identification and remediation of customer harm.

Product Complexity
Pakistan's banking products have complex fee structures, embedded charges 
(insurance, maintenance fees, SMS charges), and variable pricing (KIBOR-
linked) that customers often don't fully understand. Ensuring transparent 
disclosure and monitoring actual customer charges vs. disclosed terms 
requires comprehensive transaction analytics.

Digital Channel Risks
Digital products (mobile wallets, branchless banking, digital lending) 
serve customers with limited financial literacy. Terms and conditions 
presented on small screens are often not read. Digital lending at high 
APRs (30-40%) to low-income customers raises responsible lending concerns.

Complaint Management
SBP requires banks to resolve complaints within specified timeframes and 
report statistics to the Banking Mohtasib. Most banks treat complaint 
management as an operational function without analytics — missing systemic 
issues affecting thousands of customers that generate only dozens of 
formal complaints.

Data Privacy
Pakistan's emerging data protection regulations (Personal Data Protection 
Bill) and SBP guidelines on customer data handling require banks to 
monitor data access, consent management, and third-party data sharing. 
Analytics infrastructure must support privacy compliance while enabling 
customer-level analysis.
```

### Slides 22-23 — "Truth-in-Advertising"
**Slide 22:**
```
Business Objectives:
Monitor marketing and advertising content across all channels (print, 
digital, social media, branch collateral, SMS/email campaigns) to ensure 
compliance with SBP Fair Treatment guidelines, SECP advertising regulations, 
and PBA Code of Conduct. Detect misleading claims, hidden charges, 
unrealistic return promises, and non-compliant product representations 
before they reach customers or regulators.

Data & Solution:
Data: Marketing campaign content and creative materials. Product terms 
and conditions (actual vs. advertised). Customer complaint data tagged 
to marketing campaigns. Social media monitoring data (customer feedback 
on advertising claims). Pricing and fee data (verifying advertised rates 
match actual charges). Competitor advertising data for benchmarking.
Analytics: NLP-based analysis of marketing content for compliance red 
flags. Automated comparison of advertised terms vs. actual product terms. 
Customer outcome monitoring — do customers receive what was advertised. 
Complaint root cause analysis linking complaints to specific marketing 
campaigns. Social media sentiment analysis on product advertising.

Outcome:
Pre-publication compliance checking tool for marketing content. Post-
campaign monitoring dashboard tracking customer outcomes vs. advertising 
claims. Complaint trend analysis identifying advertising-related customer 
dissatisfaction. Regulatory compliance report for SBP advertising 
guidelines. Marketing effectiveness analysis integrated with compliance 
monitoring.
```

**Slide 23 maturity (fill "Space"):**
```
Leading: AI-powered pre-publication compliance screening of all marketing 
content. Real-time social media monitoring for advertising compliance issues. 
Automated customer outcome verification comparing received vs. advertised 
terms. Proactive compliance embedded in marketing content creation workflow.

Innovating: Pre-publication compliance review for major campaigns. Post-
campaign monitoring of customer outcomes systematic. Social media monitoring 
for brand and compliance issues operational. Complaint-to-campaign linkage 
automated.

Practicing: Compliance review of marketing content manual but systematic 
(review panel for major campaigns). Basic post-campaign monitoring through 
complaint analysis. Social media monitored periodically. Advertising 
guidelines documented and communicated to marketing teams.

Developing: Marketing compliance review ad-hoc and inconsistent. 
Post-campaign monitoring reactive (only when complaints received). 
No social media monitoring for compliance. Advertising guidelines 
exist but not systematically enforced.

Emerging: No formal marketing compliance monitoring. Advertising content 
not reviewed for regulatory compliance. Customer complaints about 
misleading advertising handled case-by-case without systemic analysis. 
SBP findings on advertising compliance are frequent.
```

### Slides 24-25 — "Predatory Practices"
**Slide 24:**
```
Business Objectives:
Detect and prevent predatory lending and pricing practices — including 
excessive interest rates targeting vulnerable borrowers, aggressive 
upselling of insurance/credit protection products, hidden fees, 
unauthorized automatic renewals, and lending to customers beyond their 
repayment capacity. Ensure compliance with SBP's responsible lending 
guidelines and consumer protection framework.

Data & Solution:
Data: Loan pricing data (APR, fees, charges) by customer segment. Customer 
income and debt-service capacity data. Product bundling and cross-sell data 
(insurance attachment to lending). Customer complaint data related to 
unfair charges. Account-level fee revenue analysis. Payment difficulty 
indicators (minimum payments, partial payments, restructuring requests). 
DTI (Debt-to-Income) ratios at origination and current.
Analytics: Customer outcome monitoring — identifying segments with 
disproportionate delinquency, complaint rates, or fee burden. Pricing 
fairness analysis comparing effective APR across customer demographics. 
Insurance attachment rate analysis by channel and sales person (detecting 
pressure selling). DTI monitoring for evidence of over-indebtedness. 
Fee burden analysis as percentage of customer income/balance.

Outcome:
Predatory practice monitoring dashboard covering pricing fairness, 
responsible lending metrics, and product suitability indicators. 
Automated alerts when customer segments show adverse outcome patterns 
(high delinquency in new digital lending, excessive fee income from 
low-balance accounts). SBP compliance report on responsible lending 
practices. Product suitability assessment framework ensuring products 
match customer needs and capacity.
```

**Slide 25 maturity (fill "Space"):**
```
Leading: Comprehensive real-time monitoring of customer outcomes across 
all products and segments. AI-driven product suitability assessment at 
origination. Automated detection of emerging predatory patterns before 
harm materializes. Customer outcome metrics integrated into product 
development and pricing governance.

Innovating: Systematic monitoring of customer outcomes by segment. Product 
suitability frameworks operational for major product lines. Pricing 
fairness analytics conducted quarterly. Insurance attachment monitoring 
with branch-level reporting. Responsible lending metrics tracked and 
reported to Board.

Practicing: Annual review of customer outcome metrics. Basic monitoring 
of complaint trends by product. DTI limits enforced at origination but 
not monitored ongoing. Insurance attachment guidelines documented. Fee 
revenue analysis by customer segment conducted periodically.

Developing: Responsible lending guidelines documented but not systematically 
monitored. Complaint-driven analysis of potential predatory practices. 
Limited customer outcome analytics. Insurance selling practices monitored 
through mystery shopping rather than data analytics.

Emerging: No systematic monitoring of predatory practices. Compliance 
reliance on policy documents rather than outcome monitoring. Customer 
harm identified only through complaints or regulatory examination. No 
pricing fairness analytics. No product suitability assessment framework.
```

### Slides 26-27 — "Privacy Protections"
**Slide 26:**
```
Business Objectives:
Build a comprehensive data privacy compliance framework meeting SBP 
customer data protection guidelines, emerging Pakistan Personal Data 
Protection legislation, and international standards (GDPR principles 
where applicable for international customers). Monitor data access, 
consent management, data sharing with third parties, and customer 
data rights (access, correction, deletion) across all systems.

Data & Solution:
Data: Customer consent records (what data, what purpose, what duration). 
Data access logs across all systems (who accessed what customer data, when, 
why). Third-party data sharing records (what data shared, with whom, under 
what agreement). Data breach incident records. Customer data rights 
requests (access, correction, deletion). Data retention compliance records.
Analytics: Data access pattern monitoring for unauthorized or unusual 
access. Consent coverage analysis (customers without valid consent for 
data processing). Data sharing compliance monitoring (ensuring third-party 
agreements cover shared data). Privacy impact assessment analytics for 
new products and systems. Customer data inventory mapping (what data, 
where stored, how protected, how long retained).

Outcome:
Privacy compliance dashboard showing consent coverage, data access 
compliance, and third-party sharing compliance. Automated alerts for 
unusual data access patterns. Customer data rights request tracking and 
response monitoring. Privacy impact assessment tool for new product and 
system launches. Data retention monitoring ensuring compliance with 
SBP data retention requirements and customer deletion requests.
```

**Slide 27 maturity (fill "Space"):**
```
Leading: Comprehensive data privacy platform with real-time access 
monitoring, automated consent management, and privacy-by-design 
embedded in all systems. Customer-facing data portal for self-service 
privacy management. AI-powered privacy risk detection. Full compliance 
with Pakistan Personal Data Protection Act.

Innovating: Systematic consent management with automated tracking. Data 
access monitoring operational across major systems. Third-party data 
sharing governed by privacy assessments. Privacy impact assessments 
integrated into product development. Customer data rights fulfilled 
within regulatory timeframes.

Practicing: Consent collection process documented and implemented. Basic 
data access logging in place. Third-party agreements include data 
protection clauses. Privacy impact assessments performed for major new 
products. Customer data requests handled manually but within timelines.

Developing: Consent collection inconsistent across channels and products. 
Data access logging limited to critical systems. Third-party data sharing 
not comprehensively tracked. Privacy impact assessments ad-hoc. Customer 
data rights requests handled case-by-case without established process.

Emerging: No formal data privacy compliance framework. Consent management 
absent or minimal. Data access not monitored. Third-party data sharing 
ungoverned. No privacy impact assessment process. Customer data rights 
not systematically addressed. Significant regulatory risk exposure.
```

### Slides 28-29 — "Do-Not-Solicit"
**Slide 28:**
```
Business Objectives:
Implement comprehensive Do-Not-Solicit (DNS) and communication preference 
management ensuring customers are not contacted through unwanted channels 
or for unwanted products. Comply with SBP Fair Treatment guidelines 
requiring respect for customer contact preferences, PTA regulations on 
unsolicited commercial communications, and emerging digital privacy 
standards.

Data & Solution:
Data: Customer communication preference records (opt-in/opt-out by channel 
and product). Campaign contact lists and execution records. Customer 
complaint data related to unwanted solicitation. PTA Do-Not-Call registry 
data. Regulatory correspondence on communication violations. Third-party 
marketing partner contact records.
Analytics: Real-time preference checking against all outbound communication 
triggers. Compliance monitoring — detecting contacts made to opted-out 
customers. Campaign execution audit comparing contact lists to preference 
records. Complaint root cause analysis for communication-related complaints. 
Opt-out rate trend analysis by channel and product.

Outcome:
Centralized communication preference management system integrated with 
all marketing and communication platforms. Real-time preference checking 
preventing non-compliant contacts. Communication compliance audit trail 
for SBP and PTA regulatory inquiries. Customer preference analytics 
informing communication strategy optimization. Zero non-compliant 
solicitation contacts (target).
```

**Slide 29 maturity (fill "Space"):**
```
Leading: Real-time communication preference enforcement across all channels 
with zero non-compliant contacts. Customer self-service preference management 
portal. AI-optimized contact strategies respecting preferences while 
maximizing engagement. Full compliance with PTA and SBP communication 
regulations.

Innovating: Centralized preference management operational across major 
channels. Real-time preference checking for outbound campaigns. Compliance 
monitoring automated with exception reporting. Customer preference 
analytics informing channel strategy.

Practicing: Communication preferences recorded and maintained. Manual 
preference checking for major campaigns. Periodic compliance audits. 
Customer complaints about unwanted contacts tracked and resolved. PTA 
Do-Not-Call registry compliance verified before campaigns.

Developing: Basic opt-out tracking in place but not comprehensively 
enforced. Preference management varies by channel. Campaign compliance 
checking inconsistent. Complaint-driven identification of preference 
violations.

Emerging: No formal communication preference management. Opt-out requests 
handled ad-hoc. No centralized preference database. Frequent customer 
complaints about unwanted solicitation. PTA compliance at risk.
```

---

## Enhancement Guidelines for Existing Content Slides

For slides with real Teradata content (AML, Capital Management, BCBS 239, CCAR, Solvency II, Volcker, Sarbanes-Oxley, IFRS 15, Communications Compliance), enhance with:

### Pakistan-Specific Regulatory Context
- Replace US-centric references with Pakistan equivalents:
  - CCAR → SBP ICAAP and stress testing requirements
  - Dodd-Frank → SBP Banking Companies Ordinance 1962 and Prudential Regulations
  - FATCA → Pakistan AEOI/CRS compliance
  - Solvency II → SECP Insurance Rules (for bancassurance context)
  - Volcker Rule → SBP restrictions on proprietary trading (Section 23 BCO)
  - Sarbanes-Oxley → Pakistan Companies Act 2017 corporate governance requirements
  - HIPAA → SBP customer data protection guidelines
  - FINRA → SECP securities regulations and PSX listing rules
  - Federal Reserve → State Bank of Pakistan

### Specific SBP Regulations to Reference
- SBP Prudential Regulations for Corporate/Commercial Banking (PR-1 to PR-14)
- SBP Prudential Regulations for Consumer Banking
- SBP Risk Management Guidelines for Commercial Banks
- SBP AML/CFT Guidelines 2020 (updated)
- SBP IFRS 9 Implementation Guidelines
- SBP Basel III Capital Adequacy Framework
- SBP IT Security Guidelines
- SBP Digital Banking Regulations 2022

### Pakistan Financial Market Data Points
- Banking sector assets: PKR 32T+ (2024)
- Number of scheduled banks: 33 (5 public, 22 private, 4 foreign, 2 specialized)
- Number of Islamic banking institutions: 5 full-fledged + 17 with Islamic branches
- Financial inclusion: 30% (target 50% by NFIS 2028)
- SBP policy rate: 17.5% (as of early 2025, subject to change)
- KIBOR 6-month: ~17.8% (reference rate for lending)
- NPL ratio: ~7.5% (system-wide)
- CAR: ~17% average (well above 11.5% minimum)
- Active mobile wallet accounts: 100M+
- RAAST monthly volume: PKR 1.5T+
- SBP's Financial Stability Report key findings

### Update Timeframes
- Replace all "H1 2018" with "2025-2026"
- Replace "2012" date examples with "2024-2025"

---

## Use Cases Section (Slides 31-45)

### Already-Complete Use Cases — Enhance with Pakistan Context:
- Slide 31 (AML/KYC): Add SBP FMU reporting, FATF Mutual Evaluation findings, CNIC/NADRA verification, RAAST/IBFT monitoring
- Slide 32 (BCBS 239): Add SBP BCBS 239 compliance circular references, Pakistan banking data infrastructure context
- Slide 34 (CCAR): Reframe as SBP ICAAP stress testing, Pakistan macroeconomic scenarios
- Slide 36 (Solvency II): Reframe for SECP Insurance Rules, Pakistan bancassurance context
- Slide 37-38 (IFRS 15): Add Pakistan telecom/banking context for revenue recognition
- Slide 39 (Volcker): Reframe for SBP proprietary trading restrictions
- Slide 40 (Sarbanes-Oxley): Reframe for Pakistan Companies Act 2017 requirements
- Slide 42 (Communications Compliance): Add SBP/PTA Pakistan communication regulations

### Placeholder Use Cases — Fill Completely:
**Slide 33 — Basel II:** Fill with Pakistan Basel II→III transition context, SBP implementation timeline, Standardized vs IRB approach status for Pakistani banks.
**Slide 35 — IFRS 9:** Critical for Pakistan — fill with complete IFRS 9 ECL use case covering Stage 1/2/3 classification, SICR criteria, forward-looking PD/LGD models, macro-economic scenario weighting, SBP IFRS 9 guidelines compliance.
**Slide 41 — Regulatory Disclosure Efficiency:** Fill with Pakistan regulatory disclosure automation, Pillar 3, annual report, SBP return automation.
**Slide 43 — Predatory Practices for Credit:** Fill with Pakistan responsible lending context, SBP consumer lending regulations, micro-finance interest rate caps.
**Slide 44 — Privacy Protection Insights on HIPAA:** Reframe entirely for Pakistan — replace HIPAA with SBP customer data protection guidelines and Pakistan Personal Data Protection Bill.
**Slide 45 — Do-Not-Solicit Compliance Insights:** Fill with Pakistan PTA communication regulations, SBP Fair Treatment guidelines, mobile marketing compliance.

---

## Quality Assurance

After repacking, verify:
1. ZERO remaining "Point 1", "Space", "Description", "#", "Header", "Question" placeholders
2. All maturity statements populated with substantive descriptions
3. Pakistan-specific regulatory references in every slide
4. US-centric references reframed for Pakistan context
5. All "H1 2018" updated to "2025-2026"
6. No formatting corruption
7. Visual QA on all 45 slides
