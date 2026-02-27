# Prompt 6C: BVF PowerPoint Updater — 13_Risk_Management_Use_Cases.pptx

## Role

You are a senior banking risk analytics consultant with 20+ years implementing credit risk models (PD/LGD/EAD/ECL), market risk systems (VaR, Stressed VaR, Expected Shortfall), and operational risk frameworks across South Asian and Middle Eastern banks. You specialize in Teradata FSDM-based risk data warehouses, Basel III/IV regulatory compliance, IFRS 9 ECL engines, and SBP (State Bank of Pakistan) prudential regulations. You understand Pakistan's banking market: KIBOR-linked lending, ECIB credit bureau, CNIC-based customer identification, Islamic banking risk (Murabaha/Musharakah defaults), SBP sectoral exposure limits, and FATF grey-list remediation requirements.

---

## Objective

Fill ALL placeholder use case slides in `13_Risk_Management_Use_Cases.pptx`. This file has 24 slides — only 3 slides have real content (Slide 3: Geospatial Risk, Slide 15: Pre-Default Risk, Slide 16: Risk-Based Policy Pricing). The remaining 20 use case slides contain "Point 1" placeholders throughout. Each must be filled with deep, substantive, implementable banking risk analytics content contextualized for Pakistan.

```
INPUT:  ./pptout/13_Risk_Management_Use_Cases.pptx
OUTPUT: ./pptout/13_Risk_Management_Use_Cases_UPDATED.pptx
```

---

## Reference Data (Local Repo) — Read FIRST

```
./OVERVIEW.md                                           # Full project context  
./fsdm_output/fsdm_analysis_report.json                 # 3,917 FSDM entities, Risk domain 86 entities
./fsdm_output/fsdm_domain_classification.csv            # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json      # 360 BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json                   # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json                 # 793 BACR questions, Risk category
./erwin_parser_output/fsdm_entity_summary.csv            # UBL ERwin v13 entities
./bvf_fsdm_output/profitability_star_schema.sql          # Star schema (risk_cost_amt column)
./bvf_fsdm_output/fsdm_gap_extensions.sql               # 21 gap extension tables
```

---

## Technical Approach

Use PPTX editing workflow: `unpack.py` → Edit slide XML with Edit tool → `clean.py` → `pack.py`. Preserve ALL formatting, table structures, shapes, images. Only replace text content inside `<a:t>` tags. See Prompt 6 for full technical steps.

---

## USE CASE TEMPLATE (Each slide follows this structure)

Every use case slide has these fields. Fill ALL of them with 3-5 substantive bullet points each (not single "Point 1"):

```
[Category Header]        ← Keep existing (e.g., "Common Core for Risk Analytics")
[Use Case Title]         ← Keep existing title
Owner:                   ← Add "Risk Analytics Team" or specific role
Objective / Problem Statement  ← 3-4 sentences describing the business problem
Business Benefit               ← 3-4 quantified benefit statements
Source Data                    ← 4-6 specific data sources with FSDM entity references
Methodology / Analytic Technique ← 3-5 specific analytical methods
Expected Outcome               ← 3-4 concrete deliverables
Challenges                     ← 3-4 implementation challenges
POV Success Criteria           ← 3-4 measurable success metrics
```

---

## SLIDE-BY-SLIDE CONTENT

### Slide 2 — Credit Risk Modeling for "New to Lending" Customers
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Develop credit scoring models for customers with no prior lending history — 
the "thin file" or "new-to-credit" segment representing 70% of Pakistan's 
adult population (financial inclusion at ~30%). Traditional bureau-based 
scoring fails for individuals without ECIB history. Banks miss profitable 
lending opportunities in the unbanked/underbanked segment while competitors 
(JazzCash, SadaPay) advance digital lending without traditional credit data.

Business Benefit:
Expand addressable lending market by 40-60% through scoring of previously 
unscorable customers. Reduce reliance on collateral-based lending which 
limits SME and consumer credit growth. Target 15-20% reduction in early 
delinquency rates vs. judgmental underwriting for new-to-lending. Support 
SBP financial inclusion targets (50% by 2028) with data-driven credit access.

Source Data:
CNIC demographics and NADRA verification data. Mobile money transaction 
patterns (JazzCash/Easypaisa — velocity, regularity, average balance). 
Utility payment history (electricity, gas, telecom — regularity, amounts). 
RAAST/IBFT transaction frequency and network analysis. Employer/salary 
data from payroll accounts. Social/behavioral signals from digital banking 
app usage patterns. Agricultural land records for rural borrowers.

Methodology / Analytic Technique:
Alternative data scoring using gradient boosted trees (XGBoost/LightGBM) 
on non-traditional features. Network analysis of transaction graphs to 
infer creditworthiness from payment network position. Survival analysis 
for time-to-default modeling on thin-file segments. Transfer learning 
from existing customer behavioral models applied to new-to-lending. 
Psychometric scoring integration for micro-enterprise lending.

Expected Outcome:
Scorecard producing PD estimates for 80%+ of currently unscorable 
applicants. Risk grade assignment enabling automated decisioning for 
low-risk new-to-lending (target: 60% straight-through processing). 
Risk-based pricing recommendations adjusting KIBOR spread by predicted 
risk grade. Portfolio monitoring dashboard tracking new-to-lending 
vintage performance vs. established customer benchmarks.

Challenges:
Limited historical default data for alternative-data-scored segments 
makes model validation difficult. Regulatory acceptance of non-traditional 
data sources by SBP for provisioning purposes uncertain. Data quality and 
availability of utility/telecom data varies significantly across urban 
and rural settings. Model bias risk — ensuring financial inclusion goals 
don't create adverse selection.

POV Success Criteria:
Gini coefficient >0.35 on out-of-sample validation for new-to-lending 
scorecard. 90-day delinquency rate for scored new-to-lending within 
1.5x of established customer portfolio. Automated decisioning rate >50% 
for new-to-lending applications. Score-to-default correlation validated 
across 3+ vintages of origination.
```

### Slide 4 — Risk Model Lift
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Quantify the incremental predictive power gained from integrating 
additional data sources, advanced analytical techniques, or model 
enhancements into existing risk models. Pakistan's banks typically 
operate legacy scorecards built 5-7 years ago on limited feature sets. 
Measure whether investment in data warehouse integration (FSDM), 
alternative data, or advanced ML techniques delivers measurable 
improvement in risk discrimination and calibration accuracy.

Business Benefit:
Each 5-point improvement in Gini coefficient translates to 10-15bps 
reduction in expected losses for a typical PKR 200B consumer lending 
portfolio. Quantified business case for data and analytics investments 
(ROI justification for FSDM implementation). Reduced false positive 
rates in credit decisioning improve customer experience and reduce 
manual review costs. Better risk discrimination enables more granular 
pricing — capturing risk premium accurately rather than cross-subsidizing.

Source Data:
Existing model scores and feature data from current production scorecards. 
Enhanced feature sets from FSDM integration (full transaction history, 
multi-product behavioral data, channel interaction data). ECIB credit 
bureau data (current utilization, inquiries, delinquency history). 
Macroeconomic variables (KIBOR, CPI, unemployment proxy, PKR/USD). 
Model performance tracking data (vintage curves, gain charts, stability reports).

Methodology / Analytic Technique:
Gini coefficient and KS statistic comparison between existing and enhanced 
models. ROC-AUC analysis with confidence intervals using bootstrap resampling. 
Population Stability Index (PSI) measuring score distribution drift. 
Characteristic analysis comparing discriminatory power of individual 
features. Lift chart analysis at each decile measuring separation between 
good and bad populations. Brier score for calibration accuracy assessment.

Expected Outcome:
Quantified model lift report showing incremental Gini improvement from 
each data source addition. Feature importance ranking identifying highest-
value data elements for risk prediction. Cost-benefit analysis mapping 
data acquisition cost vs. expected loss reduction. Recommended model 
refresh cycle based on score degradation monitoring.

Challenges:
Through-the-door population shifts confound model comparison — must 
control for changes in applicant mix. Vintage maturity differences 
between old and new model periods. Regulatory model validation 
requirements (SBP expects independent validation). Resource constraints 
for parallel model execution during transition period.

POV Success Criteria:
Demonstrate minimum 3-point Gini improvement from FSDM data integration. 
Validate lift persistence across 6+ months of out-of-time data. Achieve 
PSI < 0.25 confirming score stability. Produce actionable roadmap for 
full production model replacement with quantified NPV of the switch.
```

### Slide 5 — Consequential Impact of Credit Default
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Assess the cascading economic impact when a borrower defaults — across 
the bank's portfolio (contagion through related parties, guarantors, 
group exposures), the borrower's supply chain (trade creditors, employees, 
dependent businesses), and systemic risk implications. In Pakistan's 
concentrated banking sector where top 20 groups represent 30%+ of system 
credit, understanding second-order default impacts is critical for portfolio 
management and SBP concentration risk compliance.

Business Benefit:
Proactive identification of correlated default risk reduces unexpected 
losses by 15-25% through early intervention on connected exposures. 
Enhanced compliance with SBP single-obligor (30% of capital) and group 
exposure limits (50% of capital). Improved IFRS 9 Stage 2 identification 
through network-based Significant Increase in Credit Risk (SICR) triggers. 
Better stress testing outcomes by modeling contagion effects.

Source Data:
FSDM Agreement, Party, and Relationship entities. Group exposure data 
and beneficial ownership structures. Guarantee and collateral cross-
linking data. Supply chain payment data (trade finance LC/collection). 
Sector concentration data (SBP sector classification codes). ECIB 
bureau data showing multi-bank exposures. Stock market data for 
listed group companies.

Methodology / Analytic Technique:
Graph analytics mapping borrower-guarantor-related party networks. 
Contagion simulation using Monte Carlo with correlated default 
probabilities. Supply chain network analysis using payment flow data. 
Stress testing with cascading default scenarios (largest obligor 
default, sector-wide stress). Copula models for joint default 
probability estimation.

Expected Outcome:
Network visualization of credit exposure interconnections with contagion 
risk scores. Portfolio-level impact assessment for top 50 obligor default 
scenarios. Early warning alerts when connected party risk exceeds 
thresholds. Enhanced IFRS 9 SICR detection through network deterioration 
signals. Regulatory concentration risk reporting with full group exposure 
transparency.

Challenges:
Beneficial ownership data is incomplete in Pakistan — shell companies 
and nominee directors obscure true group structures. Cross-bank exposure 
data limited to ECIB aggregates without granular detail. Supply chain 
relationships not systematically captured in bank systems. Computational 
complexity of network-based simulations on large portfolios.

POV Success Criteria:
Map 90%+ of top 100 obligor networks with connected party identification. 
Demonstrate contagion risk scoring correlated with observed default 
clustering in historical data. Produce SBP-compliant group exposure 
reports with automated beneficial ownership roll-up. Validate network 
SICR triggers against observed Stage 2/3 migrations.
```

### Slide 6 — Guarantee Analytics
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Analyze the effectiveness, coverage adequacy, and risk-reducing value of 
guarantee structures across the lending portfolio. Pakistan banks heavily 
rely on personal guarantees (particularly in SME and agricultural lending) 
and government guarantee schemes (SBP refinance, SMEDA guarantee, Kamyab 
Pakistan). Many guarantees are paper-only with no analysis of guarantor's 
actual capacity to pay. Banks need to quantify true Loss Given Default 
(LGD) reduction from guarantee coverage vs. uncollateralized exposure.

Business Benefit:
Accurate LGD estimates incorporating guarantee values reduce IFRS 9 ECL 
provisions by 10-20% for guaranteed portfolios. Identification of weak/
ineffective guarantees enables proactive guarantee refresh or additional 
collateral requests. Improved risk-based pricing reflecting true guarantee 
quality. Better utilization of government guarantee schemes (PKR 50B+ 
available through SBP refinance windows).

Source Data:
FSDM Collateral, Agreement, and Party entities. Guarantee contracts with 
terms, amounts, and expiry dates. Guarantor financial data (net worth, 
income, existing obligations). Government guarantee scheme utilization 
data. Historical recovery data from guarantee invocations. Legal enforceability 
assessment data by jurisdiction and guarantee type.

Methodology / Analytic Technique:
Guarantor creditworthiness scoring using adapted PD models. Guarantee 
haircut analysis based on historical recovery rates by guarantee type 
(personal, corporate, government, bank). Survival analysis on guarantee 
invocation timelines. Correlation analysis between borrower default and 
guarantor distress (wrong-way risk). Coverage gap analysis comparing 
guarantee amounts to exposure at default.

Expected Outcome:
Guarantee quality scorecard rating each guarantee from A (government/
bank-backed, high recovery) to D (personal guarantee, limited capacity). 
Portfolio-level guarantee coverage dashboard showing net uncovered exposure. 
LGD model enhancement incorporating guarantee quality grades. Automated 
alerts for expiring, deteriorating, or inadequate guarantee coverage. 
Optimized government guarantee scheme utilization recommendations.

Challenges:
Guarantor financial data is often outdated (annual statements vs. quarterly 
refresh needed). Legal enforceability varies significantly across Pakistani 
court jurisdictions. Personal guarantees from related parties offer limited 
diversification benefit. Double-counting risk when guarantor is also 
borrower in another facility. Government guarantee claim processes are 
slow (12-24 months) affecting recovery NPV.

POV Success Criteria:
Classify 90%+ of guarantee portfolio by quality grade. Demonstrate 
statistically significant LGD differentiation between guarantee quality 
grades (A-D). Identify PKR 5B+ in inadequately guaranteed exposure for 
remediation. Reduce IFRS 9 ECL for guaranteed portfolio by 10%+ through 
more accurate LGD modeling.
```

### Slide 7 — Underwriting for Risk
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Transform the credit underwriting process from judgmental, document-heavy 
manual assessment to data-driven, risk-scored automated decisioning. 
Pakistan's banks average 7-14 days for consumer loan decisioning and 
30-60 days for SME/commercial — compared to fintech competitors offering 
instant pre-approval. Underwriting quality is inconsistent across branches 
with limited post-disbursement feedback on underwriter accuracy.

Business Benefit:
Reduce time-to-decision from 7+ days to same-day for 60%+ of consumer 
applications through automated scoring. Improve underwriting consistency 
(eliminate branch/region variation in approval rates for same risk profile). 
Reduce underwriting cost by PKR 2,000-5,000 per application through 
straight-through processing. Lower early delinquency by 20-30% through 
data-driven override controls.

Source Data:
Application data (demographics, income, employment, existing obligations). 
ECIB credit bureau data (eCIB score, inquiry history, existing facilities). 
CNIC verification via NADRA. Bank's own customer behavioral data (account 
history, transaction patterns, deposit trends). Collateral valuation data. 
Digital channel data (application completion patterns, device fingerprint). 
SBP Prudential Regulation compliance parameters.

Methodology / Analytic Technique:
Application scorecard using logistic regression or gradient boosting on 
application + bureau features. Behavioral scorecard incorporating 12-month 
transaction velocity, deposit stability, and payment patterns. Policy rule 
engine enforcing SBP prudential limits (DTI ratios, maximum exposure, sector 
limits). Automated document verification using OCR and cross-matching. 
Champion-challenger framework for continuous model improvement.

Expected Outcome:
Unified underwriting platform with automated scoring, policy checks, and 
decision recommendations for consumer, SME, and mortgage products. 
Underwriter override dashboard with mandatory reason codes and post-outcome 
tracking. Real-time SBP compliance checking (sector limits, concentration, 
DTI). Queue-based workflow routing high-risk applications to senior 
underwriters while auto-approving low-risk with audit trail.

Challenges:
Organizational resistance from underwriters accustomed to judgmental 
authority. Data quality gaps in income verification (informal sector 
represents 40%+ of Pakistan's economy). Integration across multiple core 
banking systems for single customer view. SBP regulatory acceptance of 
automated decisioning for larger facilities.

POV Success Criteria:
Auto-decision rate >50% for consumer lending with default rate within 
10% of manually underwritten portfolio. Time-to-decision <24 hours for 
auto-eligible applications. Override rate <15% with documented override 
performance tracking. Underwriter productivity improvement of 40%+ 
(applications processed per underwriter per day).
```

### Slide 8 — Calculation and Management of Capital
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Build an integrated capital calculation engine computing regulatory capital 
(CET1, Tier 1, Total Capital) and economic capital across credit risk 
(Standardized/IRB), market risk (Standardized/IMA), and operational risk 
(BIA/TSA). Pakistan's SBP requires minimum CAR of 11.5% (including CCB 
2.5%) with D-SIB surcharge of 1-1.5% for systemically important banks. 
Capital planning must integrate with ICAAP submission and stress testing.

Business Benefit:
Optimize capital allocation across business lines based on risk-adjusted 
returns (RAROC). Reduce excess capital buffers through more accurate RWA 
calculation (typical Pakistani bank carries 200-400bps buffer above minimum). 
Support strategic decisions on portfolio mix, product pricing, and business 
expansion with capital efficiency lens. Timely and accurate ICAAP submission 
to SBP with scenario-based capital planning.

Source Data:
FSDM Agreement, Risk Rating, Collateral, and Finance entities. Individual 
facility data (exposure amounts, risk weights, maturity, collateral CRM). 
Market risk positions (trading book, banking book securities, FX open 
positions). Operational risk loss event data. Tier 1/Tier 2 capital 
instruments. Macroeconomic scenario data for stress testing. SBP 
regulatory parameters and conversion factors.

Methodology / Analytic Technique:
Basel III Standardized Approach RWA calculation by asset class. Credit 
risk mitigation (CRM) computation applying collateral haircuts. Market 
risk standardized measurement (interest rate, equity, FX, commodities). 
ICAAP stress testing with 3 macroeconomic scenarios (base, adverse, severe). 
Capital allocation using RAROC framework (economic capital at 99.9% VaR). 
Reverse stress testing to identify capital-breaking scenarios.

Expected Outcome:
Automated monthly CAR calculation with reconciliation to SBP returns. 
Business-line level capital allocation with RAROC rankings. ICAAP 
document with forward-looking capital projections under stress scenarios. 
Capital optimization recommendations identifying RWA reduction 
opportunities (collateral CRM optimization, exposure restructuring). 
Daily capital monitoring dashboard for Treasury/ALCO.

Challenges:
Multiple core systems require standardized exposure data extraction. 
Collateral revaluation frequency inadequate for accurate CRM calculations. 
IRB model parameters not yet approved by SBP for most Pakistani banks. 
Granular business-line P&L allocation needed for meaningful RAROC but 
transfer pricing accuracy is limited.

POV Success Criteria:
CAR calculation within 0.1% of SBP reconciled figure. RWA optimization 
identifying PKR 10B+ reduction opportunities through CRM improvements. 
RAROC rankings produced for all business lines and top 50 customer 
relationships. ICAAP stress testing completed within 2-week SBP timeline.
```

### Slide 9 — Analytics of A/B Testing
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Establish a rigorous champion-challenger testing framework for risk models, 
credit policies, collections strategies, and pricing decisions. Most 
Pakistani banks deploy risk models without systematic performance 
comparison — new models replace old models based on development-sample 
metrics alone, without controlled live testing. This creates model risk 
and prevents evidence-based policy optimization.

Business Benefit:
Quantified evidence for model promotion decisions — reducing model risk 
and regulatory challenge during SBP model validation reviews. 10-15% 
improvement in policy decisions (cut-offs, pricing, limits) through 
continuous optimization. Faster time-to-market for model enhancements 
with controlled risk exposure. Documentation trail satisfying IFRS 9 
model governance and SBP Guidelines on Risk Models requirements.

Source Data:
Production model scores and challenger model scores run in parallel. 
Application data, decisioning outcomes, and performance data (default, 
delinquency, loss). Policy parameters (cut-offs, overrides, exceptions). 
Random assignment flags for controlled experiments. Customer segment 
identifiers for stratified analysis.

Methodology / Analytic Technique:
Randomized controlled trial design with stratified sampling by risk segment. 
Statistical significance testing (chi-square, t-test) on key performance 
metrics. Sequential analysis for early stopping rules (detect winner sooner 
without full vintage maturity). Bayesian A/B testing for continuous 
probability estimation. Multi-armed bandit for simultaneous testing of 
3+ challenger strategies. Thompson sampling for optimal allocation across 
strategies during testing.

Expected Outcome:
Automated champion-challenger framework with random traffic allocation, 
parallel scoring, and statistical comparison dashboard. Real-time 
monitoring of challenger performance with early warning if challenger 
underperforms beyond acceptable tolerance. Formal model promotion 
workflow with statistical evidence package for SBP validation. Historical 
test results repository documenting all model changes and outcomes.

Challenges:
Vintage maturity requirements (12-18 months for credit risk) delay 
test conclusions. Small sample sizes in niche segments (agriculture, 
Islamic finance) reduce statistical power. Ethical concerns about 
randomly assigning customers to potentially inferior strategies. 
Organizational resistance when challenger results challenge established 
credit policies.

POV Success Criteria:
Framework operational with at least 2 concurrent champion-challenger 
tests running. Statistical significance achieved within 6 months for 
high-volume products (consumer lending, cards). Model promotion decision 
documented with p-value <0.05 on primary performance metric. SBP model 
validation team accepts A/B testing evidence for model change approval.
```

### Slide 10 — Risk Model Deployment and Operationalization
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Bridge the gap between risk model development (typically in R/Python/SAS) 
and production deployment in core banking and decision engines. Pakistani 
banks face 6-12 month lags between model completion and production 
implementation — during which time model performance degrades. Manual 
model recoding from analytical environments to production systems introduces 
"detuning" errors that compromise model integrity.

Business Benefit:
Reduce model deployment time from 6+ months to 4-6 weeks through automated 
model promotion pipelines. Eliminate recoding errors that typically reduce 
model Gini by 2-5 points during manual translation. Enable in-database 
scoring using Teradata's analytical functions — eliminating data extraction 
latency and improving scoring throughput from batch to near-real-time. 
Support SBP requirement for model implementation documentation.

Source Data:
Trained model objects (PMML/ONNX format). Feature engineering specifications 
and data transformation rules. Production data feeds from FSDM entities. 
Model monitoring metrics (score distributions, feature drift, performance 
degradation). Version control metadata for model lineage.

Methodology / Analytic Technique:
Model serialization and containerization (Docker/Kubernetes or Teradata 
in-database deployment). PMML/ONNX model interchange for platform-agnostic 
deployment. Feature store pattern ensuring consistent feature computation 
between development and production. Automated model monitoring with drift 
detection (PSI, CSI, feature distribution shifts). A/B routing for staged 
rollout of new models.

Expected Outcome:
End-to-end model deployment pipeline: Dev → Test → UAT → Production with 
automated validation at each gate. In-database scoring capability for 
batch and near-real-time use cases. Model monitoring dashboard with 
automated alerts on performance degradation. Model registry tracking 
all production models with version history, performance metrics, and 
validation documentation.

Challenges:
IT and risk analytics teams operate in silos with different tools, 
environments, and release cycles. Teradata in-database analytics 
requires SQL-based model implementation vs. native Python/R objects. 
Production data quality differs from development samples requiring 
robust error handling. SBP model validation requires comprehensive 
documentation of implementation process.

POV Success Criteria:
Deploy one risk model end-to-end in <6 weeks using the pipeline. 
Demonstrate <0.5 point Gini difference between development and 
production scoring. Automated model monitoring detecting performance 
degradation within 30 days. Full documentation package satisfying 
SBP model validation requirements.
```

### Slide 11 — Analytics for Risk/Reward Strategy Optimization
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Optimize the trade-off between risk appetite and revenue generation across 
lending products. Pakistani banks often apply uniform risk policies (flat 
cut-offs, standard pricing) that either over-accept risk in pursuit of 
growth or over-reject profitable customers due to conservative thresholds. 
Need analytical framework to find optimal decision boundaries that 
maximize risk-adjusted returns across customer segments and products.

Business Benefit:
5-10% improvement in portfolio RAROC through optimized cut-off strategies. 
Reduced adverse selection by aligning pricing with individual risk profiles 
(KIBOR + risk-adjusted spread). Improved acceptance rates for profitable 
segments while tightening for loss-making segments. Quantified risk appetite 
framework aligned with bank's strategic objectives and SBP capital targets.

Source Data:
Production scorecard outputs with decision outcomes. Through-the-door 
population data including rejects. Pricing data (KIBOR spread, fee income). 
Loss data by risk grade, vintage, and product. Revenue data by customer 
relationship. Capital consumption by facility. FTP rates from Treasury.

Methodology / Analytic Technique:
Profit-maximizing cut-off optimization using marginal PD × LGD × EAD vs. 
marginal revenue analysis. Reject inference techniques (parceling, bivariate 
probit) to estimate reject performance. Sensitivity analysis of acceptance 
rate vs. loss rate at different cut-offs. Dynamic strategy trees incorporating 
score, income, LTV, DTI, and segment. What-if simulation for portfolio 
composition under alternative strategies.

Expected Outcome:
Optimal cut-off recommendations by product and segment with expected P&L 
impact quantified. Risk-adjusted pricing grid mapping score ranges to 
KIBOR spreads. Strategy performance monitoring dashboard tracking 
acceptance rates, early delinquency, and portfolio-level RAROC by 
strategy cell. Automated strategy refresh recommendations when 
performance deviates from projections.

Challenges:
Reject inference inherently uncertain — no perfect data on rejected 
applicants' true performance. Revenue projections require reliable FTP 
rates and operating cost allocation (profitability engine dependency). 
Organizational alignment between risk (minimize losses) and business 
(maximize volume) on optimal trade-off point. Strategy changes require 
time to mature before impact is observable.

POV Success Criteria:
Demonstrate 3%+ RAROC improvement on pilot product through optimized 
strategy. Acceptance rate change translates to predicted volume/loss 
impact within 15% accuracy. Strategy monitoring dashboard live with 
monthly performance tracking. Business and risk functions aligned on 
risk appetite boundaries with documented tolerances.
```

### Slide 12 — Risk Model Lift (Duplicate — fill with differentiated content)
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Measure and enhance the predictive power of behavioral risk models used 
for portfolio monitoring and limit management. Unlike application 
scorecards (Slide 4), behavioral models leverage ongoing customer 
transaction data to detect deterioration in creditworthiness — essential 
for IFRS 9 Stage 2 identification where Significant Increase in Credit 
Risk (SICR) must be detected before default occurs.

Business Benefit:
Earlier detection of credit deterioration (30-90 days before traditional 
delinquency flags) enables proactive intervention — reducing Stage 3 
migration by 15-25%. More accurate IFRS 9 Stage 2 classification reduces 
ECL volatility and provision-to-loss ratio overstatement. Behavioral 
model lift directly improves limit management decisions — protecting the 
bank from excess exposure to deteriorating customers while maintaining 
limits for improving customers.

Source Data:
12-month transaction behavioral features from FSDM Event and Transaction 
entities. Account utilization patterns (balance trends, limit utilization 
velocity). Payment behavior (minimum vs. full payment ratio, payment timing 
drift). Cross-product behavioral signals (deposit drawdown, investment 
redemption as distress indicators). Digital channel engagement changes.

Methodology / Analytic Technique:
Rolling behavioral score recalibration with 12-month outcome windows. 
Time-series feature engineering (3/6/12-month trends in transaction 
velocity, balance volatility, utilization trajectory). SHAP analysis 
for model explainability — identifying which behavioral changes drive 
score movement. Survival analysis for time-to-Stage-3 prediction. 
Kalman filtering for dynamic score smoothing.

Expected Outcome:
Enhanced behavioral scorecard with minimum 5-point Gini improvement 
over existing model. Automated SICR trigger alerts flagging Stage 2 
candidates 60+ days before delinquency. Behavioral model lift report 
quantifying incremental value of each data domain (transactions, digital, 
cross-product). Production deployment recommendation with migration plan.

Challenges:
Behavioral data requires minimum 12-month history — new customers excluded. 
Product-specific behavior patterns require separate models (CASA, cards, 
lending, trade). IFRS 9 SICR threshold calibration is judgment-heavy — 
different thresholds produce materially different Stage 2 populations and 
ECL estimates. Model complexity vs. explainability trade-off for regulatory 
acceptance.

POV Success Criteria:
Behavioral Gini >0.50 on out-of-time validation. SICR detection preceding 
Stage 3 migration by average 60+ days. ECL accuracy improvement (actual 
vs. predicted loss ratio within 90-110%). SBP model validation acceptance 
of behavioral model for IFRS 9 staging.
```

### Slide 13 — Analytics for Risk Scenario and Stress Testing
**Category:** Common Core for Risk Analytics
```
Objective / Problem Statement:
Build comprehensive scenario analysis and stress testing capability 
meeting SBP's annual ICAAP stress testing requirements and Basel III 
Pillar 2 obligations. Pakistani banks must assess capital adequacy under 
macroeconomic stress scenarios including: PKR devaluation (30-40%), KIBOR 
spike (500bps+), GDP contraction (2-3%), real estate price correction 
(25-40%), and sectoral stress (textile, sugar, energy). Most banks 
perform stress testing as an annual compliance exercise using simple 
sensitivity analysis rather than integrated scenario-based modeling.

Business Benefit:
Proactive risk management identifying portfolio vulnerabilities before 
stress materializes. Regulatory compliance with SBP ICAAP and Basel III 
Pillar 2 stress testing requirements. Capital planning optimization 
— right-sizing buffers based on actual stress test outcomes rather than 
arbitrary add-ons. Strategic decision support for ALCO on portfolio 
rebalancing and concentration reduction.

Source Data:
Account-level exposure data from FSDM Agreement entities. Risk rating, 
collateral, and guarantee data. Macroeconomic time series (GDP, CPI, 
KIBOR, PKR/USD, real estate indices, sector-specific indicators). 
Historical loss data by risk grade, sector, and collateral type. Market 
risk position data (trading book, banking book). SBP stress testing 
parameters and scenario specifications.

Methodology / Analytic Technique:
Top-down macroeconomic scenario generation with 3 scenarios (baseline, 
adverse, severely adverse). Bottom-up PD/LGD stress models linking 
macro factors to risk parameters using satellite models (logistic 
regression, time-series). Portfolio-level credit loss simulation under 
stressed PD/LGD/EAD. Market risk stress testing using historical and 
hypothetical scenarios. Reverse stress testing identifying scenarios that 
breach minimum capital requirements. Monte Carlo simulation for joint 
probability estimation across risk types.

Expected Outcome:
ICAAP stress testing report with capital impact under 3 scenarios. 
Sector-level vulnerability analysis identifying concentrations most 
sensitive to macroeconomic stress. Reverse stress test results showing 
distance-to-breach for capital ratios. Management action triggers 
(early warning thresholds) linked to macroeconomic indicators. Dynamic 
stress testing capability enabling ad-hoc scenario analysis for emerging 
risks (e.g., commodity price shocks, sovereign downgrade scenarios).

Challenges:
Limited historical stress data for Pakistan — only 2-3 true stress 
episodes in last 20 years. Macro-to-risk-parameter linkages are 
structurally unstable in Pakistan's evolving economy. Cross-risk 
integration (credit + market + liquidity) requires comprehensive 
data and consistent scenarios. Computational intensity for account-level 
stress testing on PKR 2-3 trillion lending portfolios.

POV Success Criteria:
ICAAP stress test completed within SBP-mandated timeline with full 
documentation. Capital impact estimates validated against historical 
stress episodes (2008 GFC, 2018 currency crisis, 2022 political/
economic crisis). Reverse stress test identifies specific breaking 
scenarios with quantified probability. Stress testing infrastructure 
enables ad-hoc scenario analysis within 48 hours of request.
```

### Slide 14 — Analytics for Credit Risk Appetite
**Category:** Credit Risk
```
Objective / Problem Statement:
Define and operationalize credit risk appetite from Board-level strategic 
risk tolerance down to individual product, segment, and geographic lending 
limits. Pakistan's SBP requires formal Risk Appetite Statement (RAS) with 
quantitative metrics and cascading limits. Most Pakistani banks define 
appetite qualitatively with limited connection to daily origination and 
portfolio management decisions.

Business Benefit:
Disciplined credit growth aligned with capital capacity and strategic 
objectives. Real-time monitoring of risk appetite utilization prevents 
breach situations and reactive corrective actions. Enhanced Board governance 
with clear risk appetite KPIs and escalation triggers. Optimized capital 
deployment by directing origination to under-utilized segments while 
constraining over-concentrated segments.

Source Data:
FSDM Portfolio, Agreement, and Organization entities. Capital adequacy 
data (CET1, Tier 1, Total Capital ratios). Sector-wise exposure data 
(SBP sector codes). Geographic concentration data (province, city, rural/
urban). Risk grade distribution across portfolios. Loss experience data 
(provision charges, write-offs, recoveries). Economic capital model 
outputs. Peer benchmarking data from SBP Financial Stability Reports.

Methodology / Analytic Technique:
Top-down capital allocation based on target ROE and risk tolerance. 
Credit VaR (99.9%) calculation for economic capital by portfolio segment. 
Concentration risk measurement using Herfindahl-Hirschman Index (HHI) 
by sector, geography, and obligor. Limit utilization monitoring with 
traffic-light dashboard (Green/Amber/Red). Sensitivity analysis of 
appetite metrics to macroeconomic stress scenarios.

Expected Outcome:
Quantified Risk Appetite Statement with 15-20 metrics cascaded from 
Board-level to business-unit operating limits. Real-time dashboard 
showing appetite utilization by sector, geography, product, and risk 
grade. Automated escalation alerts when utilization exceeds warning 
thresholds (85% Yellow, 95% Red). Monthly appetite consumption report 
for Board Risk Committee.

Challenges:
Translating qualitative Board statements into quantitative operating 
limits. Historical data limitations for calibrating appetite metrics 
in Pakistan's volatile economic environment. Balancing growth mandates 
(SBP financial inclusion targets) with prudent risk appetite. Appetite 
setting for new products/segments with limited loss history.

POV Success Criteria:
RAS document with 15+ quantitative metrics approved by Board. Cascading 
limits operational across all business lines. Zero undetected appetite 
breaches (all breaches flagged within 24 hours). Monthly Board report 
produced within T+5 business days.
```

### Slide 17 — Real Estate Mortgage Pricing – Small Business
**Category:** Credit Risk
```
Objective / Problem Statement:
Develop risk-based pricing models for small business mortgage/property-
secured lending — a PKR 500B+ market segment where Pakistani banks 
currently apply flat pricing (KIBOR + 3-5%) without differentiation 
by risk profile, property type, location, or LTV ratio. Commercial 
property valuation in Pakistan is opaque (no standardized indices), 
making LTV-based pricing particularly challenging. Need analytics to 
price risk accurately while remaining competitive against informal 
lending sources.

Business Benefit:
15-25bps margin improvement through risk-differentiated pricing (charge 
more for higher risk, compete aggressively on low risk). Reduced adverse 
selection — flat pricing attracts higher-risk borrowers while losing 
low-risk to competitors. Portfolio-level loss reduction through better 
risk-price alignment. Expansion into under-served segments (smaller 
cities, commercial properties) with appropriately priced risk.

Source Data:
Property valuation data (forced-sale value, market value, location, type). 
Borrower financial data (business turnover, profitability, bank account 
conduct). ECIB credit bureau history. Historical default and recovery 
data by property type and location. SBP property market data and real 
estate indices. KIBOR term structure for FTP-based pricing floors. 
Competitor pricing surveys.

Methodology / Analytic Technique:
LTV-based pricing model incorporating property type risk adjustments. 
Hedonic property valuation model using location, size, type, and age 
features. Credit scoring for small business (turnover, years in business, 
account conduct). Expected loss pricing: KIBOR + FTP spread + expected 
loss spread + operating cost + target profit margin. Scenario analysis 
for property price correction (25-40% haircuts).

Expected Outcome:
Risk-based pricing grid: LTV buckets × risk grade × property type × 
location tier = recommended KIBOR spread. Automated pricing tool 
integrated with loan origination system. Property risk scoring model 
augmenting traditional valuation with location risk factors (market 
liquidity, price volatility, legal encumbrance risk). Portfolio monitoring 
dashboard tracking pricing adequacy vs. actual loss experience.

Challenges:
No standardized property price index in Pakistan — valuations are 
subjective and often inflated. Forced-sale recovery timelines average 
3-7 years in Pakistani courts, dramatically impacting recovery NPV. 
DC/FBR property valuation rates differ significantly from market values. 
Small business financial data quality is poor (informal accounting, 
cash-based businesses).

POV Success Criteria:
Pricing model deployed for pilot city (Karachi/Lahore) showing risk 
differentiation across LTV and risk grade buckets. Back-tested pricing 
adequacy: actual losses within ±20% of priced expected loss for 3+ 
vintages. Property risk scores showing statistically significant 
correlation with actual recovery outcomes.
```

### Slide 18 — Analytics for Credit Portfolio Management
**Category:** Credit Risk
```
Objective / Problem Statement:
Transform credit portfolio management from passive, deal-by-deal originate-
and-hold approach to active portfolio optimization managing concentrations, 
diversification, and risk-return trade-offs. Pakistan's banking sector 
has high concentration risk: top 20 groups = 30%+ of system credit, 
textile/sugar/energy sectors = 40%+ of industrial lending, government 
securities dominate banking book. Need analytics to actively manage 
portfolio composition within SBP concentration limits.

Business Benefit:
Optimized risk-return profile through deliberate portfolio composition 
management. Compliance with SBP single-obligor (30% equity) and group 
exposure limits (50% equity) through early warning systems. Reduced 
unexpected losses through diversification — sector/geographic 
concentration risk capital charge optimization. Better capital efficiency 
by directing origination toward high-RAROC segments.

Source Data:
Full portfolio data from FSDM Agreement, Party, Organization entities. 
Risk ratings, collateral, guarantees. Sector classification (SBP codes). 
Geographic distribution (province, city). Facility-level P&L data for 
RAROC. Capital consumption by facility. Market data for credit derivative 
pricing. SBP exposure limit parameters.

Methodology / Analytic Technique:
Credit portfolio model (CreditMetrics/CreditRisk+ approach) for portfolio-
level loss distribution. Marginal risk contribution analysis (each 
facility's contribution to portfolio VaR). Concentration risk measurement 
(HHI, Granularity Adjustment). Portfolio optimization using mean-variance 
framework adapted for credit (target RAROC maximization subject to capital 
constraints). Stress testing portfolio composition under sector-specific 
scenarios.

Expected Outcome:
Portfolio heat map showing concentration risk by sector, geography, obligor, 
and risk grade. Marginal capital contribution by business line enabling 
capital-efficient origination decisions. Automated concentration monitoring 
with SBP limit compliance dashboard. Portfolio optimization recommendations 
quantifying risk-return trade-offs of rebalancing strategies. Strategic 
origination guidance: "grow in segment X, maintain in Y, reduce in Z."

Challenges:
Credit portfolio models require default correlation estimates — limited 
empirical data in Pakistan. Active portfolio management tools (credit 
derivatives, securitization) are underdeveloped in Pakistan's capital 
markets. Organizational resistance from relationship managers whose 
clients may fall in "reduce" segments. Data quality for accurate 
sector/geographic classification across complex group structures.

POV Success Criteria:
Portfolio model operational with loss distribution by sector and risk 
grade. Concentration risk dashboard with automated SBP limit monitoring. 
RAROC-based origination guidance published monthly to all business lines. 
Portfolio VaR reduction of 5-10% through identified rebalancing 
opportunities.
```

### Slide 19 — Credit Risk Management Intelligence
**Category:** Credit Risk
```
Objective / Problem Statement:
Provide the Chief Risk Officer and Credit Committee with comprehensive 
credit risk intelligence — integrating portfolio analytics, market 
intelligence, peer benchmarking, and forward-looking risk indicators into 
a unified decision-support platform. Currently, Pakistani bank CROs rely 
on fragmented monthly reports from different departments, often 2-3 weeks 
old, with no integrated view of credit risk posture and trends.

Business Benefit:
Real-time credit risk visibility enabling proactive management rather 
than reactive response. Early identification of emerging risks through 
leading indicator monitoring. Enhanced Board reporting quality satisfying 
SBP corporate governance expectations. Competitive intelligence on peer 
banks' credit strategies informing strategic positioning. Reduced time 
from risk identification to management action.

Source Data:
Internal portfolio data (FSDM entities across all risk domains). SBP 
Financial Stability Reports and banking sector statistics. ECIB system-
level credit bureau trend data. Macroeconomic indicators (KIBOR, CPI, 
industrial production, trade data). Industry and sector analysis reports. 
Peer bank published results (PSX filings, annual reports). International 
credit risk intelligence (Moody's, S&P sovereign and banking reports).

Methodology / Analytic Technique:
Dashboard analytics with drill-through from enterprise to individual 
obligor. Trend analysis with statistical process control (detect 
meaningful shifts vs. noise). Peer benchmarking analysis on NPL ratios, 
provision coverage, sector exposures. Leading indicator monitoring using 
macro-credit linkage models. Heat maps for sector and geographic risk 
concentration. Text analytics on news/social media for early warning 
on key obligors.

Expected Outcome:
CRO dashboard with real-time portfolio risk metrics (NPL ratio, provision 
coverage, ECL by stage, risk grade migration, concentration metrics). 
Monthly Credit Risk Intelligence report combining internal analytics with 
external market intelligence. Early warning system with leading indicators 
(KIBOR trends, sector distress signals, obligor-specific alerts). Peer 
comparison benchmarks on 10+ key credit risk metrics. Ad-hoc analysis 
capability for emerging risk questions.

Challenges:
Data freshness — core banking systems provide daily data but analytical 
enrichment (scoring, staging) may lag. External data access and integration 
(SBP data, market data, news feeds). Defining meaningful leading indicators 
in Pakistan's volatile economic environment. Information overload risk — 
presenting too many metrics dilutes focus on truly important risk signals.

POV Success Criteria:
CRO dashboard operational with daily refresh. Monthly intelligence report 
produced within T+3 business days. Early warning system generating 
actionable alerts with <5% false positive rate. Board Risk Committee 
reporting quality rated "satisfactory" in SBP inspection.
```

### Slide 20 — Currency Hedge Analytics
**Category:** Market Risk
**Current:** Already has real content — ENHANCE with Pakistan context:
```
Add to Objective: In Pakistan context, PKR volatility (35% depreciation 
in 2022-23) makes FX hedging critical for banks with dollar-denominated 
liabilities (RDA deposits, foreign borrowings) and import-financing 
portfolios. SBP's FX Net Open Position limits require active management.

Add to Source Data: SBP FX position reporting data. KIBOR vs SOFR basis 
spread. RDA deposit maturity profile. Import LC pipeline data. NDF 
(Non-Deliverable Forward) market data for PKR hedging.

Update Success Criteria timeframes from generic to "2025-2026"
```

### Slide 21 — Liquidity and Market Risk Intra-Day Trend
**Category:** Market Risk
```
Objective / Problem Statement:
Monitor and analyze intra-day liquidity flows and market risk exposures 
to ensure compliance with SBP Liquidity Coverage Ratio (LCR ≥100%) and 
Net Stable Funding Ratio (NSFR ≥100%) requirements. Pakistan's payment 
system (PRISM RTGS, RAAST) processes PKR 10+ trillion daily — banks 
must manage intra-day liquidity positions to avoid settlement failures 
while minimizing idle cash buffers.

Business Benefit:
Prevent settlement failures (PKR 50M+ SBP penalty per incident). 
Optimize intra-day liquidity buffers — reducing idle cash earning zero 
vs. deployment in overnight money market (current KIBOR ~17.5%). Real-
time LCR monitoring preventing regulatory breach. Early detection of 
liquidity stress through intra-day flow pattern analysis.

Source Data:
PRISM RTGS settlement data (real-time). RAAST payment flows. Inter-bank 
money market transactions. SBP repo/reverse repo operations. CASA balance 
intra-day movements. Large deposit withdrawal alerts. Market risk position 
changes (trading book). SBP discount window utilization.

Methodology / Analytic Technique:
Intra-day cash flow forecasting using historical pattern analysis. 
Liquidity stress indicators (early redemption of term deposits, CASA 
drawdown velocity, inter-bank funding concentration). VaR recalculation 
on market risk positions as markets move. Intra-day LCR estimation using 
real-time balance data. Anomaly detection on payment flow patterns 
(sudden outflows, counterparty concentration).

Expected Outcome:
Real-time liquidity dashboard showing intra-day cash position, projected 
end-of-day position, and LCR estimate. Automated alerts for approaching 
liquidity thresholds. Market risk position monitoring with intra-day 
P&L and VaR updates. Historical intra-day pattern analysis for optimizing 
opening-of-day liquidity buffer. Integration with ALCO decision support.

Challenges:
Real-time data integration from PRISM, RAAST, core banking, and trading 
systems. Computational intensity of continuous LCR recalculation. Short 
history of real-time payment data (RAAST launched 2022). Intra-day 
forecasting accuracy depends on customer behavior modeling for large 
corporates and government payments.

POV Success Criteria:
Real-time liquidity dashboard operational with <5 minute data latency. 
Intra-day cash flow forecast accuracy within 10% by 11:00 AM. Zero 
PRISM settlement failures attributable to liquidity management. LCR 
maintained above 105% buffer at all intra-day measurement points.
```

### Slide 22 — Analytics for Market Risk Based Pricing
**Category:** Market Risk
```
Objective / Problem Statement:
Incorporate market risk considerations (interest rate risk, FX risk, 
liquidity risk) into product pricing for both banking book (loans, 
deposits) and trading book instruments. In Pakistan, where KIBOR volatility 
can swing 300-500bps within quarters and PKR/USD can move 10-15% in 
weeks, static pricing that ignores market risk exposes banks to significant 
margin compression and hidden option costs (prepayment risk, deposit 
early withdrawal).

Business Benefit:
Accurate transfer pricing reflecting true cost-of-funds including liquidity 
premium and term premium. Elimination of hidden subsidy to fixed-rate 
products from floating-rate funding. Risk-adjusted product profitability 
enabling informed product mix decisions. Competitive pricing that reflects 
actual risk cost rather than arbitrary market-matching.

Source Data:
KIBOR term structure (overnight to 5-year). SBP policy rate history and 
market expectations. FX forward curve (PKR/USD, PKR/EUR, PKR/GBP). 
Product-level cash flow projections. Behavioral optionality data 
(prepayment rates, deposit early withdrawal, drawdown patterns). 
Competitor pricing data. SBP monetary policy statements.

Methodology / Analytic Technique:
FTP (Funds Transfer Pricing) based on matched-maturity marginal cost-
of-funds. Option-adjusted pricing for products with embedded behavioral 
optionality (prepayable loans, callable deposits). Interest rate risk 
sensitivity analysis (Duration, PV01, key rate durations). Scenario-
based pricing analysis under different KIBOR paths. Economic Value of 
Equity (EVE) impact assessment of product pricing decisions.

Expected Outcome:
Market-risk-adjusted FTP rates published daily by Treasury. Product-level 
option-adjusted spread analysis showing true economic margin. Pricing 
tool for relationship managers incorporating market risk cost, credit 
risk cost, operating cost, and target margin. Sensitivity reports 
showing product P&L impact under KIBOR ±200bps scenarios.

Challenges:
KIBOR term structure illiquid beyond 1 year — limited market data for 
longer tenors. Behavioral optionality estimation requires product-
specific modeling (Pakistan-specific prepayment and withdrawal patterns 
differ from international benchmarks). FTP governance — ensuring Treasury 
pricing reflects market reality, not internal politics. Islamic product 
profit rate benchmarking against KIBOR-based conventional pricing.

POV Success Criteria:
FTP system operational with daily matched-maturity rates. Option-adjusted 
spread analysis available for top 5 product categories. Pricing tool 
deployed to 100+ relationship managers. Product profitability variance 
to market risk factors quantified and reported monthly.
```

### Slide 23 — Improving the Collections Experience
**Category:** Collections & Recoveries
```
Objective / Problem Statement:
Transform collections from an adversarial, compliance-driven process into 
a customer-centric engagement that maximizes recovery while preserving 
viable customer relationships. Pakistani banks lose 15-20% of delinquent 
customers permanently due to aggressive collection practices, even when 
the customer could have been rehabilitated. SBP's Fair Treatment of 
Consumers guidelines require dignified collection practices.

Business Benefit:
25-35% improvement in promise-to-pay conversion rates through personalized 
engagement strategies. 15-20% customer retention improvement for 
rehabilitated delinquent accounts. Reduced customer complaints and SBP 
regulatory intervention. Lower litigation costs through earlier voluntary 
settlement. Enhanced brand reputation in an increasingly competitive market.

Source Data:
Customer relationship data (full banking relationship value, tenure, 
products). Delinquency history and payment patterns. Collection activity 
logs (calls, messages, visits, outcomes). Customer contact preferences 
(time of day, channel, language). Behavioral data indicating financial 
distress level. Previous restructuring/rescheduling history. Collector 
performance data.

Methodology / Analytic Technique:
Customer-level collections strategy assignment using decision trees 
(segment by: distress severity × relationship value × willingness-to-pay 
score). Optimal contact time and channel prediction using historical 
response analysis. Collector-customer matching based on skill profiles. 
Sentiment analysis on customer interactions. Cure rate prediction models 
informing intervention intensity.

Expected Outcome:
Personalized collections journey for each delinquent customer based on 
risk-value segmentation. Optimized contact scheduling (right time, right 
channel, right collector). Customer-friendly restructuring offers 
generated based on affordability analysis. Collections dashboard tracking 
efficiency (contact rate, promise rate, kept-promise rate, cure rate) 
and customer experience metrics (complaint rate, SBP escalations).

Challenges:
Cultural sensitivity in Pakistan — collections practices must respect 
local customs, religious considerations, and family dynamics. Limited 
digital contact capabilities (SMS/email) for rural borrowers. Customer 
data quality — contact numbers frequently change. Regulatory requirements 
(SBP collection guidelines, consumer protection rules) constrain 
collection methods and timing.

POV Success Criteria:
Collections customer experience score (survey-based) improved by 20+ 
points. Promise-to-pay conversion rate improved by 25%+. Customer 
rehabilitation rate (cured to current within 6 months) improved by 15%+. 
Zero SBP enforcement actions related to collection practices.
```

### Slide 24 — Collections Analytics
**Category:** Collections & Recoveries
```
Objective / Problem Statement:
Build a comprehensive collections analytics platform that optimizes 
every aspect of the recovery process — from early delinquency intervention 
through write-off and post-write-off recovery. Pakistan's banking sector 
carries NPLs of PKR 900B+ (approximately 7-8% of advances), with recovery 
rates averaging 25-35% — significantly below potential. Analytics can 
improve recovery rates, reduce time-to-recovery, and lower collection 
costs per PKR recovered.

Business Benefit:
10-15% improvement in overall recovery rates (equivalent to PKR 20-30B 
additional recovery system-wide). Reduced time-to-recovery by 30-45 days 
through optimized prioritization and strategy. Operating cost reduction 
of 20-25% per collected PKR through automated queue management and 
strategy optimization. IFRS 9 ECL reduction through improved recovery 
rate assumptions in LGD models.

Source Data:
FSDM Agreement, Collateral, Event, and Party entities. Full delinquency 
bucket history (DPD 1-30, 31-60, 61-90, 90+, write-off). Collection 
activity data (calls, visits, legal notices, promises, payments). 
Collateral data (type, value, location, legal status). Court case 
tracking data (filing, hearing dates, decree status). External recovery 
agent performance data. Guarantor and related-party data.

Methodology / Analytic Technique:
Roll-rate modeling for delinquency transition prediction (current→30→60→
90→default). Collections scorecard for prioritization (probability of 
cure × amount at risk). Champion-challenger testing on collection 
strategies. Collateral recovery optimization using auction market data 
and forced-sale value modeling. Agent allocation optimization using 
performance scoring by agent × customer segment. Text analytics on 
collection notes for outcome pattern identification.

Expected Outcome:
Automated collections queue management with daily prioritized work lists. 
Predictive delinquency flow model forecasting next-month DPD migration. 
Strategy optimization dashboard with champion-challenger results. 
Collateral recovery tracking with expected vs. actual recovery analysis. 
Post-write-off recovery scoring identifying highest-potential accounts 
for continued pursuit. Comprehensive collections MIS for senior management 
and Board reporting.

Challenges:
Data quality — collections activity data poorly captured in many Pakistani 
banks (call outcomes, visit results logged inconsistently). Legal recovery 
timelines unpredictable in Pakistan's court system (3-7+ years for 
decree execution). NPL stock includes very old accounts with limited 
current data. Multiple recovery channels (internal team, external agents, 
legal) with fragmented tracking systems.

POV Success Criteria:
Collections scorecard Gini >0.40 for predicting 90-day cure probability. 
Queue management system reducing average collector idle time by 30%. 
Roll-rate model forecasting accuracy within ±10% of actual DPD migration. 
Recovery rate improvement of 5%+ on pilot portfolio within 12 months. 
Collections MIS automated with daily refresh.
```

---

## Global Updates Across All Slides

1. Replace all "Owner:" fields with appropriate roles: "Risk Analytics CoE", "Credit Risk Team", "Market Risk Team", "Collections & Recovery Team"
2. Add "RACE Relevant" indicator where appropriate (short-duration POV engagements)
3. Update any "H1 2018" references to "2025-2026"
4. Add FSDM entity references in Source Data sections where applicable

---

## Quality Assurance

After repacking, verify:
1. ZERO remaining "Point 1" placeholders — grep for "Point 1" must return nothing
2. All 7 fields populated in every use case slide (Objective through POV Success Criteria)
3. Pakistan-specific content present in every use case (PKR, KIBOR, SBP, ECIB, CNIC)
4. No formatting corruption — table structures, fonts, colors preserved
5. Visual QA using soffice + pdftoppm on all 24 slides
