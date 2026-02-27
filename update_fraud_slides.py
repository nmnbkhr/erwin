#!/usr/bin/env python3
"""
Update 15_Security_Fraud_Use_Cases.pptx — all 40 placeholder slides.
Preserves XML formatting, only replaces text in <a:t> tags.
"""

import xml.etree.ElementTree as ET
import copy
import os

ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
ET.register_namespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main')
ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

BASE_DIR = '/mnt/e/erwin/unpacked_15/ppt/slides'

# Slide N -> slide{533+N}.xml
def xml_file(slide_num):
    return os.path.join(BASE_DIR, f'slide{533 + slide_num}.xml')

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}

# ─────────────────────────────────────────────────────────
# SECTION 1: COMMON CORE FOR FRAUD ANALYTICS (Slides 2-11)
# ─────────────────────────────────────────────────────────

CONTENT = {}

CONTENT[2] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Deploy sub-second fraud scoring across all payment channels (ATM, POS, IBFT, RAAST, e-commerce, mobile wallets) processing 50M+ daily transactions',
        'Detect emerging fraud patterns including SIM-swap, authorized push payment, and QR code manipulation attacks targeting Pakistan\u2019s digital payments ecosystem',
        'Current rule-based systems generate 95%+ false positives, overwhelming investigation teams and blocking legitimate customer transactions',
        'Enable real-time fraud decisioning that meets SBP monitoring requirements for digital payment channels',
    ],
    'Business Benefit': [
        'Prevent PKR 2-3B annual fraud losses through real-time blocking at point of transaction',
        'Reduce false positive rates from 95%+ (rule-based) to <10% (ML-based), freeing investigator capacity',
        'Improve customer experience by eliminating unnecessary transaction blocks on legitimate activity',
        'Meet SBP real-time monitoring requirements for RAAST, IBFT, and mobile wallet channels',
    ],
    'Source Data': [
        'Real-time transaction feeds from switch/processor, core banking, RAAST, IBFT gateway (FSDM: EVNT, TRXN entities)',
        'Customer behavioral profiles (12-month spending patterns, geographic patterns, device fingerprints)',
        'Merchant risk profiles and MCC-level fraud rate data',
        'Global fraud pattern feeds and consortium data; CNIC/biometric verification audit trail',
    ],
    'Methodology / Analytic Technique': [
        'Gradient-boosted ensemble models (XGBoost/LightGBM) scoring every transaction in real time',
        'Velocity anomaly detection (spending acceleration, frequency spikes, amount distribution shifts)',
        'Geospatial impossibility checks (ATM in Karachi, POS in Lahore within 30 minutes)',
        'Device fingerprint matching and session analytics for digital channels',
        'Adaptive threshold optimization using reinforcement learning to balance detection vs. false positives',
    ],
    'Expected Outcome': [
        'Real-time fraud score on 100% of transactions within 100ms latency',
        'Automated block/allow/review decisioning with configurable thresholds by channel and product',
        '80%+ fraud detection rate with <2% false positive rate across all channels',
        'Reduced average fraud detection time from days to seconds with automated alerting',
    ],
    'Challenges': [
        'Processing latency constraints for real-time scoring at 50M+ daily transaction volumes',
        'Integration across 5+ payment channels with different data formats and latency profiles',
        'Model drift as fraud patterns evolve rapidly \u2014 requiring continuous retraining infrastructure',
        'Balancing security with customer experience in Pakistan\u2019s competitive digital payments market',
    ],
    'POV Success Criteria': [
        'Deploy real-time scoring on IBFT/RAAST channel within 3 months of POV start',
        'Demonstrate 50%+ improvement in fraud detection rate vs. existing rule-based system',
        'False positive rate <5% on pilot channel verified through investigation outcomes',
        'Sub-200ms scoring latency verified under peak load conditions',
    ],
}

CONTENT[3] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Build automated fraud risk scoring for every customer, account, and transaction establishing a continuous fraud risk posture view',
        'Move from reactive fraud detection (finding fraud after it happens) to proactive risk management identifying high-risk entities before fraud occurs',
        'Current systems lack unified customer-level risk assessment \u2014 each channel monitors independently without cross-product view',
    ],
    'Business Benefit': [
        '30% reduction in fraud losses through proactive risk-based monitoring and early intervention',
        'Resource optimization \u2014 focus investigator capacity on highest-risk entities rather than random sampling',
        'Regulatory compliance with SBP risk-based approach to fraud prevention and FATF requirements',
        'Risk-tiered customer monitoring reducing operational costs while improving coverage',
    ],
    'Source Data': [
        'Customer KYC data (CNIC, income, employment, business type) from FSDM Party entities',
        'Transaction behavioral data (12-month patterns across all channels) from FSDM TRXN entities',
        'Account opening patterns, velocity, and channel usage; ECIB credit bureau data',
        'Digital footprint data (IP, device, location); Historical fraud case data with confirmed outcomes',
        'Sanctions and watchlist data (SBP, OFAC, UN); PEP screening results',
    ],
    'Methodology / Analytic Technique': [
        'Customer-level fraud propensity scoring using supervised learning on historical fraud labels',
        'Risk factor decomposition identifying highest-contributing features per customer',
        'Peer group analysis comparing customer behavior to segment norms (by product, geography, income)',
        'Time-series anomaly detection for behavioral drift indicating potential compromise or fraud preparation',
        'Bayesian network modeling for causal fraud risk factor analysis',
    ],
    'Expected Outcome': [
        'Fraud risk score for every customer updated monthly with real-time trigger-based recalculation',
        'Risk-tiered monitoring strategy (high-risk: real-time, medium: daily batch, low: monthly review)',
        'Fraud risk heat map by product, channel, and geographic region for management reporting',
        'Risk-based KYC refresh triggering enhanced due diligence for deteriorating risk scores',
    ],
    'Challenges': [
        'Label scarcity \u2014 confirmed fraud cases represent <0.1% of transactions creating severe class imbalance',
        'Distinguishing genuine behavioral change (marriage, job change) from fraud indicators',
        'Model fairness \u2014 avoiding discrimination against specific demographics or geographies',
        'Data freshness requirements for accurate real-time risk scoring across multiple source systems',
    ],
    'POV Success Criteria': [
        'Fraud risk scores rank-order validated with 90%+ of confirmed frauds in top 2 risk deciles',
        'Risk-based monitoring demonstrates catching 20%+ more fraud than uniform monitoring approach',
        'Score stability (PSI <0.25) over 6-month validation period',
        'Risk-tiered monitoring reduces alert volume by 40% while maintaining detection rate',
    ],
}

CONTENT[4] = {
    'owner': 'Fraud Operations',
    'Objective / Problem Statement': [
        'Automate the fraud case management lifecycle \u2014 from alert generation through investigation, resolution, recovery, and STR regulatory reporting to FMU',
        'Reduce average case resolution time from 15+ days to <5 days while improving investigation quality',
        'Current manual processes cause SBP STR filing deadline violations and fragmented evidence documentation',
        'Enable end-to-end case tracking with full audit trail for regulatory examination',
    ],
    'Business Benefit': [
        '60% reduction in average case resolution time through automated workflows',
        '40% improvement in investigator productivity through automated evidence gathering and pre-population',
        '100% compliance with SBP 7-day STR filing timeline requirement',
        'Reduced fraud losses through faster blocking of confirmed fraud patterns and account restrictions',
    ],
    'Source Data': [
        'Fraud alerts from detection systems (rule engine + ML models) across all channels',
        'Transaction data for suspect accounts from FSDM TRXN and EVNT entities',
        'Customer communication logs, case investigation notes, and evidence documents',
        'Resolution outcomes and recovery data; SBP/FMU regulatory reporting templates',
        'Investigator workload and performance data for capacity management',
    ],
    'Methodology / Analytic Technique': [
        'Intelligent alert-to-case conversion with automated deduplication and consolidation of related alerts',
        'ML-based case prioritization scoring (fraud probability \u00d7 amount \u00d7 customer impact)',
        'Automated evidence package assembly from multiple source systems (core banking, cards, digital)',
        'NLP-based extraction of investigation findings from case notes for pattern identification',
        'SLA monitoring with automated escalation workflows and supervisor notifications',
    ],
    'Expected Outcome': [
        'Unified case management platform with automated evidence gathering across all product systems',
        'Investigator dashboard with prioritized work queue ranked by urgency and fraud probability',
        'One-click STR generation pre-populated with case data for FMU submission',
        'Case outcome analytics feeding back to detection models for continuous improvement',
    ],
    'Challenges': [
        'Integration across fragmented systems (card processor, core banking, digital, AML) for evidence gathering',
        'Investigator adoption of new platform vs. familiar manual processes requires change management',
        'STR quality requirements \u2014 automated generation must meet SBP/FMU content standards',
        'Case backlog migration and parallel operation during platform transition',
    ],
    'POV Success Criteria': [
        'Case resolution time reduced to <5 business days for 80%+ of cases',
        'STR filing within SBP 7-day requirement for 100% of reportable cases',
        'Investigator handles 30%+ more cases per month with automated evidence gathering',
        'Case outcome feedback to detection models within 24 hours of resolution',
    ],
}

CONTENT[5] = {
    'owner': 'Fraud Investigation Unit',
    'Objective / Problem Statement': [
        'Provide investigators with advanced analytics for complex fraud cases \u2014 entity resolution across identities, fund flow tracing, network visualization, and digital forensics',
        'Enable prosecution-quality evidence packages for FIA/police/court submissions',
        'Current investigations are manual, taking 45+ days for complex cases with limited ability to trace fund flows across accounts',
    ],
    'Business Benefit': [
        '50% reduction in average complex investigation time (from 45 to 22 days)',
        '3x improvement in fraud ring identification \u2014 uncovering previously unknown connected participants',
        'Higher prosecution success rates through analytics-derived evidence quality',
        'Recovery of PKR 500M+ additional fraud proceeds through faster asset identification and tracing',
    ],
    'Source Data': [
        'Full transaction history across all channels and products (FSDM TRXN, EVNT entities)',
        'Account opening documentation and KYC records; CNIC verification audit trails via NADRA',
        'Digital forensics data (IP logs, device fingerprints, session recordings)',
        'Third-party data (ECIB, SECP corporate registry, property records)',
        'Cross-bank transaction data via SBP mediation for multi-institution fraud cases',
    ],
    'Methodology / Analytic Technique': [
        'Entity resolution using probabilistic matching across shared attributes (phone, address, CNIC, device ID, beneficiary patterns)',
        'Graph analytics for fraud network visualization using Teradata graph functions',
        'nPath temporal pattern analysis reconstructing fraud event sequences',
        'Text analytics on investigation notes and customer communications',
        'Fund flow tracing with multi-hop transaction tracking across accounts and institutions',
    ],
    'Expected Outcome': [
        'Investigation workbench with entity resolution dashboard linking suspected identities',
        'Network visualization of connected accounts, entities, and transaction flows',
        'Automated fund flow maps showing money movement through mule accounts',
        'Timeline reconstruction of fraud events for court presentation',
        'Evidence package generator producing FIA/police/court-ready documentation',
    ],
    'Challenges': [
        'Entity resolution accuracy \u2014 false links derail investigations while missed links leave ring participants undetected',
        'Cross-institutional data access limitations (no real-time inter-bank query capability in Pakistan)',
        'Legal admissibility of analytics-derived evidence in Pakistani courts requires careful documentation',
        'Digital forensics capability gaps for sophisticated cyber fraud requiring specialized expertise',
    ],
    'POV Success Criteria': [
        'Entity resolution identifies 30%+ previously unknown linked accounts in pilot investigations',
        'Investigation time for complex cases reduced by 40%+ using analytics workbench',
        'Evidence package accepted by FIA in 90%+ of referred cases',
        'At least 2 fraud rings uncovered through network analytics during pilot period',
    ],
}

CONTENT[6] = {
    'owner': 'Fraud Recovery Team',
    'Objective / Problem Statement': [
        'Maximize fraud loss recovery by identifying all available recovery avenues, prioritizing by probability, and executing within optimal timeframes',
        'Quantify unrecovered fraud exposure to support insurance and provisioning decisions',
        'Current recovery rates of 15-25% are well below achievable target of 40%+ with optimized processes',
        'Chargeback filing deadlines (45-120 days) frequently missed due to slow investigation cycles',
    ],
    'Business Benefit': [
        'PKR 500M-1B additional annual recovery through optimized recovery processes and avenue selection',
        'Reduced fraud provision charges through higher recovery rate assumptions in loss models',
        'Insurance claim optimization \u2014 ensure all eligible losses are claimed within policy terms',
        'Better management reporting on net fraud exposure (gross losses less recoveries) for Board Risk Committee',
    ],
    'Source Data': [
        'Confirmed fraud case data with loss amounts, fraud type, and perpetrator information',
        'Chargeback eligibility data (card scheme rules, filing deadlines per scheme)',
        'Insurance policy terms and coverage limits; Legal case status and recovery judgment data',
        'Perpetrator asset/account data from investigation findings',
        'Recovery cost data (legal fees, agent commissions) for NPV-based prioritization',
    ],
    'Methodology / Analytic Technique': [
        'Recovery probability scoring by case type (card chargeback: 60-80%, legal: 10-30%, insurance: 50-70%)',
        'Optimal recovery avenue selection algorithm maximizing expected recovery minus cost',
        'Chargeback deadline monitoring with automated filing triggers before scheme cutoff dates',
        'Legal recovery NPV analysis incorporating Pakistan court timeline expectations (3-7 years)',
        'Asset tracing using entity resolution and transaction flow analysis to locate perpetrator assets',
    ],
    'Expected Outcome': [
        'Automated recovery workflow initiated within 24 hours of fraud confirmation',
        'Recovery probability scores guiding resource allocation across avenue types',
        'Chargeback filing rate >95% for eligible transactions within scheme deadlines',
        'Recovery tracking dashboard showing amounts by avenue, stage, and expected timeline',
    ],
    'Challenges': [
        'Pakistan court system timelines make legal recovery NPV low for amounts under PKR 5M',
        'Chargeback schemes have strict time limits (45-120 days) missed when investigation is slow',
        'Cross-bank recovery coordination lacking \u2014 no formal inter-bank fraud recovery mechanism',
        'Perpetrator assets often dissipated or hidden before recovery action can be executed',
    ],
    'POV Success Criteria': [
        'Recovery rate improved by 10+ percentage points on pilot portfolio',
        'Chargeback filing rate >95% within scheme deadlines for eligible transactions',
        'Insurance claim filing for 100% of eligible losses within policy notification periods',
        'Net fraud loss (after recoveries) reduced by PKR 200M+ annually on pilot portfolio',
    ],
}

CONTENT[7] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect organized fraud rings by analyzing transaction networks, shared attributes, and behavioral patterns indicating coordinated fraudulent activity',
        'Uncover money mule networks, synthetic identity clusters, and collusion schemes invisible to individual transaction monitoring',
        'Fraud rings cause 40-60% of total fraud losses despite being <5% of fraud cases \u2014 individual monitoring cannot detect coordinated activity',
    ],
    'Business Benefit': [
        'Identification of fraud rings causing 40-60% of total losses \u2014 highest-impact fraud prevention capability',
        'Proactive shutdown of mule account networks before they execute major fraud or money laundering operations',
        'Enhanced FATF/SBP compliance demonstrating network-level AML/CFT analytical capability',
        'Prevention of cascading losses when fraud ring operates across multiple products and channels',
    ],
    'Source Data': [
        'Transaction network data (sender-receiver pairs across IBFT, RAAST, internal transfers)',
        'Account opening data (shared phone numbers, addresses, devices, CNICs)',
        'Behavioral similarity data (similar transaction patterns, timing, amounts) from FSDM TRXN entities',
        'ECIB data showing shared credit relationships across institutions',
        'Beneficiary pattern analysis across full customer base',
    ],
    'Methodology / Analytic Technique': [
        'Graph construction from transaction and attribute-sharing relationships across all channels',
        'Community detection algorithms (Louvain, Label Propagation) identifying suspicious clusters',
        'Centrality analysis identifying ring leaders/coordinators within detected networks',
        'Temporal pattern analysis detecting coordinated transaction timing across network members',
        'Anomaly detection on network metrics (unusual graph density, rapid network growth, star patterns)',
    ],
    'Expected Outcome': [
        'Automated fraud network detection running weekly on full customer base with alert generation',
        'Network visualization dashboards for investigators showing cluster topology and key nodes',
        'Risk scoring at network level (entire cluster scored, not just individual accounts)',
        'Automated alerts when new accounts join known suspicious networks; Mule account identification for preemptive blocking',
    ],
    'Challenges': [
        'Computational complexity of graph analytics on millions of nodes and billions of edges',
        'Defining meaningful network boundaries \u2014 avoiding overly large or fragmented clusters',
        'Distinguishing fraud networks from legitimate business clusters (e.g., supply chains)',
        'False positive networks based on coincidental attribute sharing (same employer, same neighborhood)',
    ],
    'POV Success Criteria': [
        'Identify minimum 10 fraud networks containing at least one known confirmed fraud case',
        'Network analysis identifies 3+ previously unknown participants per known fraud case',
        'Mule account identification accuracy >70% confirmed through investigation',
        'Monthly network detection runtime <24 hours on full customer base',
    ],
}

CONTENT[8] = {
    'owner': 'Enterprise Risk Analytics',
    'Objective / Problem Statement': [
        'Assess fraud and credit risk from hidden connections between consumers, businesses, and transaction counterparties',
        'In Pakistan\u2019s relationship-driven economy, undisclosed business connections, family networks, and political relationships create fraud vulnerabilities invisible to account-level analysis',
        'SBP requires identification and reporting of related-party transactions \u2014 current systems detect only formally disclosed relationships',
    ],
    'Business Benefit': [
        'Identification of undisclosed related-party transactions supporting SBP compliance requirements',
        'Detection of round-tripping and circular trading schemes in trade finance (PKR 500B+ portfolio)',
        'Enhanced customer due diligence through relationship-aware KYC across consumer and business entities',
        'Credit risk improvement through identification of correlated exposure in connected entities',
    ],
    'Source Data': [
        'Transaction flow data (payments, transfers, trade finance) from FSDM TRXN entities',
        'Customer KYC data including beneficial ownership declarations',
        'SECP corporate registry data (directors, shareholders); CNIC-linked family relationships',
        'Property record cross-references; Business supply chain payment patterns',
        'ECIB multi-bank exposure data for cross-institutional relationship detection',
    ],
    'Methodology / Analytic Technique': [
        'Bipartite graph analysis linking consumers and businesses through transaction flows',
        'Beneficial ownership resolution through SECP and NADRA data integration',
        'Family network inference from shared addresses, CNIC family sequences, guarantor relationships',
        'Supply chain network construction from trade finance and payment data',
        'Anomaly detection on network-level transaction patterns (circular flows, unusual volumes, timing coordination)',
    ],
    'Expected Outcome': [
        'Entity relationship map covering top 1,000 business customers with full network visualization',
        'Undisclosed related-party identification for SBP regulatory reporting',
        'Circular transaction detection alerts for trade finance operations',
        'Network-adjusted credit risk scores incorporating connected-party default correlation',
    ],
    'Challenges': [
        'Beneficial ownership opacity in Pakistan \u2014 nominee directors and shell companies are widespread',
        'Family relationship inference from CNIC sequences is approximate, not definitive',
        'Data quality and completeness of SECP corporate registry for unlisted companies',
        'Legal privacy constraints on relationship mapping; Computational scale across millions of entities',
    ],
    'POV Success Criteria': [
        'Map networks for top 500 business customers identifying average 3+ undisclosed connections per entity',
        'Detect minimum 5 circular transaction patterns in trade finance portfolio',
        'Identify 10+ undisclosed related-party relationships requiring SBP reporting',
        'Network-adjusted credit risk scores show improved default prediction (AUC improvement >2%)',
    ],
}

CONTENT[9] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Dramatically reduce false positive rates where 95-98% of fraud alerts are legitimate transactions flagged incorrectly',
        'Wasted investigator time on false positives degrades fraud detection capacity and customer experience through unnecessary blocks',
        'Current rule-based systems lack customer-level context \u2014 flagging transactions unusual for the population but normal for the specific customer',
    ],
    'Business Benefit': [
        '50-70% reduction in false positive alerts freeing investigator capacity for genuine fraud cases',
        'Customer experience improvement \u2014 fewer legitimate transactions blocked or delayed',
        'Cost savings of PKR 100-200M annually through reduced manual investigation workload',
        'Improved detection effectiveness as investigators focus on genuinely suspicious activity',
    ],
    'Source Data': [
        'Historical fraud alert data with investigation outcomes (true positive vs. false positive labels)',
        'Transaction features at time of alert (amount, merchant, channel, time, location)',
        'Customer behavioral context at alert time (is this normal for THIS customer?)',
        'Alert rule or model score that triggered the alert; Investigation resolution notes',
        'Customer complaint data related to false blocks and transaction declines',
    ],
    'Methodology / Analytic Technique': [
        'Meta-model trained on historical alert outcomes to predict alert validity (true positive probability)',
        'Feature engineering combining transaction-level and customer-level behavioral context',
        'Bayesian updating of alert probability as additional information arrives post-alert',
        'Explainable AI providing investigators with reason codes for each alert disposition recommendation',
        'Active learning with investigator feedback loop for continuous model improvement',
    ],
    'Expected Outcome': [
        'Alert scoring system predicting true positive probability for each generated alert',
        'Auto-disposition of low-probability alerts with full audit trail for regulatory review',
        'Investigator dashboard showing alerts ranked by true positive probability and potential loss',
        'Monthly false positive rate reporting by detection rule/model for tuning optimization',
    ],
    'Challenges': [
        'Asymmetric cost of errors \u2014 missing true fraud costs far more than investigating a false positive',
        'Shifting class balance as fraud prevention improves (proportionally less true fraud in alert pool)',
        'Investigator trust in automated disposition \u2014 resistance to auto-clearing alerts without human review',
        'SBP regulatory expectation for human review of certain alert categories',
    ],
    'POV Success Criteria': [
        'False positive rate reduced by 50%+ on pilot detection rules without increasing false negative rate',
        'Investigator alert queue reduced by 40%+ through automated low-confidence alert disposition',
        'Auto-disposition accuracy >99% verified through random sampling audit',
        'Customer complaint rate for false blocks reduced by 30%+',
    ],
}

CONTENT[10] = {
    'owner': 'Fraud Operations',
    'Objective / Problem Statement': [
        'Automate fraud flagging \u2014 systematically identifying and flagging high-risk transactions, accounts, and entities for enhanced monitoring',
        'Replace manual flag-setting with data-driven, consistent automated flagging covering all channels and products',
        'Current manual flagging covers <10% of transaction volume with inconsistent criteria across branches',
    ],
    'Business Benefit': [
        '100% transaction coverage for fraud surveillance vs. <10% under manual flagging processes',
        'Consistent application of SBP-defined red flag indicators across all channels and branches',
        'Reduced time-to-flag from days to real-time, enabling immediate intervention',
        'Complete audit trail for SBP/FATF compliance demonstrating systematic fraud surveillance',
    ],
    'Source Data': [
        'Real-time transaction data across all channels (ATM, POS, IBFT, RAAST, digital banking)',
        'Customer risk profiles and behavioral baselines from FSDM Party and EVNT entities',
        'Watchlist and sanctions data (SBP, OFAC, UN); SBP AML/CFT red flag typology indicators',
        'Historical fraud pattern libraries; Merchant and counterparty risk data',
    ],
    'Methodology / Analytic Technique': [
        'Rule engine implementing all SBP-defined red flag indicators (structuring, rapid movement, unusual patterns)',
        'ML-based anomaly scoring supplementing rule-based flags for novel fraud patterns',
        'Velocity-based flags detecting sudden increases in transaction frequency or amounts',
        'Geographic risk flags for transactions with FATF high-risk jurisdictions',
        'Automated flag escalation based on severity scoring (information, review, investigation, block)',
    ],
    'Expected Outcome': [
        'Automated fraud flagging across 100% of transactions with flag reason codes for each alert',
        'Tiered flag system (information, review, investigation, block) with automated escalation workflows',
        'Real-time flag dashboard showing volumes by type, channel, and severity for operations management',
        'Flag effectiveness reporting measuring conversion rate (flags to confirmed fraud) for optimization',
    ],
    'Challenges': [
        'Flag volume management \u2014 automated flagging can generate overwhelming volumes without careful calibration',
        'Rule maintenance burden as SBP adds new typology indicators (quarterly updates)',
        'Coordination between fraud flags and AML flags to avoid duplication and conflicting actions',
        'System performance impact of real-time flagging across all transactions at peak volumes',
    ],
    'POV Success Criteria': [
        'Automated flagging operational across all payment channels within POV timeline',
        'Flag-to-fraud conversion rate >5% vs. <1% for current manual flagging process',
        'Zero SBP-defined red flag indicators missed by automated system (100% typology coverage)',
        'Flag processing latency <500ms for real-time transaction channels',
    ],
}

CONTENT[11] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Discover sequential event patterns that lead to fraud \u2014 the characteristic paths preceding different fraud types',
        'Enable predictive fraud prevention by detecting early stages of fraud sequences before the actual fraudulent transaction',
        'Move from detecting fraud at point of loss to intercepting fraud during preparation phase',
    ],
    'Business Benefit': [
        'Early intervention prevents fraud losses rather than detecting fraud post-occurrence \u2014 10x ROI improvement',
        'Understanding fraud paths enables targeted control placement at critical sequence points',
        'Training content for fraud awareness programs based on real path analysis from Pakistani banking data',
        'Identification of new fraud methods through novel path pattern discovery',
    ],
    'Source Data': [
        'Temporal event sequences for confirmed fraud cases (account opening \u2192 transactions \u2192 balance patterns \u2192 fraud)',
        'Customer interaction event logs (branch visits, call center, digital sessions)',
        'Account change events (address, phone, beneficiary additions) from FSDM EVNT entities',
        'Authentication events (login patterns, OTP usage, biometric checks)',
        'Product change events (limit increases, new product applications near fraud event)',
    ],
    'Methodology / Analytic Technique': [
        'nPath analysis discovering frequent event sequences preceding confirmed fraud in Teradata',
        'Sequence mining algorithms (PrefixSpan, SPADE) for statistically significant pattern discovery',
        'Survival analysis measuring time-to-fraud from each event in the identified sequence',
        'Markov chain models for transition probability estimation between events in fraud paths',
        'Anomaly detection flagging customers currently exhibiting early-stage fraud path patterns',
    ],
    'Expected Outcome': [
        'Fraud path library cataloging typical sequences for each fraud type (identity fraud: ~5 events over 14 days; account takeover: ~3 events in 48 hours)',
        'Early warning system flagging customers currently on identified fraud paths before loss occurs',
        'Control gap identification \u2014 points in fraud paths where intervention is most effective and cost-efficient',
        'Fraud path visualization for investigator training and staff awareness programs',
    ],
    'Challenges': [
        'Path analysis requires sufficient confirmed fraud cases to identify statistically significant patterns',
        'Fraud paths evolve as fraudsters adapt to newly implemented controls',
        'Distinguishing genuine customer behavior changes (job change, marriage) from early fraud indicators',
        'Computational complexity of temporal pattern mining across millions of accounts and event histories',
    ],
    'POV Success Criteria': [
        'Identify characteristic fraud paths for top 5 fraud types with statistical significance (p<0.05)',
        'Early warning system detects 30%+ of future fraud cases at early path stages before loss',
        'At least 2 control gap recommendations derived from path analysis implemented',
        'Fraud path library used for investigator training with positive effectiveness feedback',
    ],
}

# ─────────────────────────────────────────────────────────
# SECTION 2: EMPLOYEE FRAUD (Slides 12-24)
# ─────────────────────────────────────────────────────────

CONTENT[12] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Detect fraudulent activity by bancassurance and insurance broker partners including commission manipulation, phantom policies, and premium misappropriation',
        'Pakistan\u2019s bancassurance market (PKR 50B+ premiums through banks) creates agency risks with commission-based incentive structures',
        'Unauthorized policy issuance and customer data misuse by brokers erodes customer trust and exposes banks to SECP regulatory action',
    ],
    'Business Benefit': [
        'Reduction of PKR 200-500M annual losses from broker fraud across the bancassurance channel',
        'Protection of customer trust \u2014 prevent phantom products and mis-selling through systematic monitoring',
        'SBP/SECP compliance with distribution channel governance and customer protection requirements',
        'Stronger broker relationship management through performance transparency and data-driven oversight',
    ],
    'Source Data': [
        'Policy issuance data (product, premium, customer, broker); Commission payment data by broker',
        'Customer complaint and early cancellation data correlated with broker identity',
        'Broker activity patterns (volumes, timing, product mix) compared to peer group norms',
        'Customer verification data (did customer authorize the policy); Premium collection and remittance records',
    ],
    'Methodology / Analytic Technique': [
        'Broker behavioral profiling scoring against peer norms for volume, cancellation rate, complaint rate',
        'Anomaly detection on commission patterns (unusual spikes, policy churning for commission generation)',
        'Customer verification sampling through outbound calls confirming policy awareness and authorization',
        'Network analysis linking brokers to suspicious customer clusters',
        'Cancellation pattern analysis (high early-cancellation rate indicating mis-selling or phantom policies)',
    ],
    'Expected Outcome': [
        'Broker risk scorecard updated monthly with automated alerts for anomalous activity patterns',
        'Customer verification program with risk-based sampling strategy targeting high-risk brokers',
        'Broker performance dashboard for channel management with drill-through to individual broker activity',
        'Regulatory reporting on distribution channel conduct for SBP/SECP submissions',
    ],
    'Challenges': [
        'Broker resistance to monitoring perceived as distrust \u2014 may impact recruitment and retention',
        'Complex commission structures (upfront, trail, bonus) make anomaly detection algorithmically challenging',
        'Volume variations between brokers driven by legitimate factors (geography, specialization, client base)',
        'Limited data integration between bank and insurance company core systems',
    ],
    'POV Success Criteria': [
        'Broker risk scores rank-order validated (highest-risk brokers have 3x+ complaint/cancellation rates)',
        'Identify minimum 5 brokers with suspicious patterns requiring investigation in pilot',
        'Customer verification confirms 95%+ of sampled policies are legitimately authorized',
        'Commission leakage detection identifies PKR 50M+ in suspicious or anomalous payments',
    ],
}

CONTENT[13] = {
    'owner': 'Compliance & Fraud',
    'Objective / Problem Statement': [
        'Detect undisclosed or prohibited commission arrangements where employees/agents receive payments outside authorized compensation',
        'Covers kickbacks from vendors in procurement, undisclosed referral fees, and quid pro quo arrangements compromising bank interests',
        'Pakistan\u2019s business culture of informal relationships creates elevated risk of undisclosed financial arrangements',
    ],
    'Business Benefit': [
        'Protection against conflicts of interest compromising lending, procurement, and vendor selection decisions',
        'Regulatory compliance with SBP conflict of interest and related-party transaction rules',
        'Deterrence effect \u2014 systematic monitoring discourages corrupt practices bank-wide',
        'Recovery of inappropriate payments and contract renegotiation based on identified conflicts',
    ],
    'Source Data': [
        'Employee financial data (bank account transactions, declared assets and liabilities)',
        'Vendor payment data and contract terms; Employee-vendor relationship records',
        'Procurement decision logs, approvals, and bid comparison data',
        'Loan approval data correlated with employee-customer relationships',
        'Expense reports and reimbursement claims; Gift and hospitality declarations',
    ],
    'Methodology / Analytic Technique': [
        'Benford\u2019s Law analysis on vendor payment amounts detecting fabricated invoices',
        'Employee lifestyle analysis (spending patterns inconsistent with declared salary and assets)',
        'Vendor concentration analysis \u2014 identifying employees consistently directing business to specific vendors',
        'Procurement price benchmarking (above-market prices for preferred vendors)',
        'Network analysis linking employee personal accounts to vendor payment flows through intermediaries',
    ],
    'Expected Outcome': [
        'Automated monitoring of high-risk employee categories (procurement, lending, vendor management)',
        'Vendor payment anomaly alerts with supporting evidence for compliance investigation',
        'Employee-vendor relationship mapping updated quarterly with new connection detection',
        'Annual employee financial disclosure verification analytics cross-checking declared vs. detected',
    ],
    'Challenges': [
        'Privacy concerns around employee financial monitoring require careful legal framework',
        'Cultural sensitivity \u2014 false accusations damage morale, relationships, and retention',
        'Indirect commission arrangements designed to evade detection through family members or intermediaries',
        'Limited data access to employee personal banking at other banks',
    ],
    'POV Success Criteria': [
        'Identify minimum 3 anomalous employee-vendor relationships in pilot analysis requiring investigation',
        'Vendor payment anomaly detection generates actionable alerts with <30% false positive rate',
        'Employee financial disclosure cross-checks identify material inconsistencies',
        'Deterrence effect measurable through employee awareness and compliance survey results',
    ],
}

CONTENT[14] = {
    'owner': 'Internal Audit Analytics',
    'Objective / Problem Statement': [
        'Build comprehensive internal fraud detection covering unauthorized transactions, fictitious entries, override abuse, dormant account exploitation, and cash pilferage',
        'Provide continuous monitoring supplementing periodic physical audits across Pakistan\u2019s 1,000+ branch network',
        'Current annual audit cycle means average 18-month detection lag for internal fraud \u2014 losses compound before discovery',
    ],
    'Business Benefit': [
        'Early detection reducing average internal fraud loss from PKR 10-50M per incident to <PKR 5M through faster identification',
        'Shift from annual audit detection (18-month lag) to continuous monitoring (detection within 30 days)',
        'Reduced audit costs through analytics-directed audit sampling \u2014 focus on highest-risk branches',
        'Deterrence effect from visible continuous monitoring capabilities across all branches',
    ],
    'Source Data': [
        'Employee transaction logs (volumes, amounts, timing, overrides) from core banking system',
        'System access logs (login times, unusual access patterns, after-hours activity)',
        'GL posting data and reconciliation exceptions; Cash vault data (shortages, excesses, adjustments)',
        'Dormant account activity correlated with employee access logs',
        'Customer complaint data (missing deposits, unauthorized debits) correlated with branch employees',
    ],
    'Methodology / Analytic Technique': [
        'Employee behavioral baseline modeling (normal transaction patterns by role and branch size)',
        'Anomaly detection scoring employees against role-based peer groups',
        'Override frequency analysis \u2014 employees using override authority disproportionately to peer group',
        'Dormant account monitoring with employee access correlation for unauthorized activation',
        'Maker-checker violation detection; After-hours system access analysis; Cash position control charts',
    ],
    'Expected Outcome': [
        'Monthly employee risk scores for all operational staff across 1,000+ branches',
        'Automated alerts for high-severity anomalies triggering immediate investigation',
        'Branch risk ranking informing internal audit planning priorities',
        'Continuous monitoring dashboard for Audit Committee with quarterly threat reports',
    ],
    'Challenges': [
        'Establishing accurate behavioral baselines across diverse branch sizes, roles, and geographies',
        'Minimizing false positives to maintain employee trust and avoid investigation fatigue',
        'Integration across multiple operational systems for comprehensive monitoring coverage',
        'Monitoring coverage for manual/paper-based processes not captured in digital logs',
    ],
    'POV Success Criteria': [
        'Employee risk scoring operational across all branches with monthly refresh cycle',
        'Detection of minimum 3 genuine anomalies in pilot phase requiring investigation',
        'False alarm rate <20% for high-severity alerts verified through investigation outcomes',
        'Branch risk ranking correlated with subsequent physical audit findings (validation)',
    ],
}

CONTENT[15] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Detect loyalty program fraud including points manipulation, unauthorized redemptions, phantom accounts for points accumulation, and employee-assisted loyalty abuse',
        'Pakistan banking loyalty programs (UBL Rewards, HBL Konnect, MCB Rewards) represent PKR 5-10B in annual loyalty value \u2014 vulnerable to systematic exploitation',
        'Points-based programs are particularly vulnerable to velocity attacks and synthetic account accumulation schemes',
    ],
    'Business Benefit': [
        'Prevention of PKR 200-500M annual loyalty fraud losses through systematic monitoring',
        'Protection of program economics \u2014 preventing point inflation that devalues legitimate customer rewards',
        'Compliance with program terms and conditions through automated enforcement',
        'Customer trust preservation \u2014 ensuring reward program integrity and fair treatment',
    ],
    'Source Data': [
        'Loyalty transaction logs (earn, burn, transfer, expiry) across all program channels',
        'Redemption patterns by customer, merchant, and product category',
        'Account creation velocity and customer verification data (CNIC linkage)',
        'Employee access logs for loyalty management systems; Customer complaint data',
    ],
    'Methodology / Analytic Technique': [
        'Velocity analysis on points earning (abnormal accumulation rates vs. peer group spending)',
        'Redemption pattern anomaly detection (bulk redemptions, unusual merchant concentration)',
        'Phantom account detection through CNIC clustering, shared devices, and IP analysis',
        'Employee-customer collusion detection through access pattern correlation with redemption events',
        'Network analysis linking loyalty accounts through shared attributes',
    ],
    'Expected Outcome': [
        'Automated loyalty fraud monitoring system with real-time alerts on suspicious activity',
        'Phantom account identification for program cleanup and cost recovery',
        'Employee loyalty access audit reports highlighting unusual interaction patterns',
        'Monthly loyalty fraud loss report for program management and finance',
    ],
    'Challenges': [
        'Defining normal vs. abnormal loyalty behavior \u2014 high-value customers legitimately earn rapidly',
        'Multiple loyalty programs across products with different rules and redemption channels',
        'Promotional campaigns creating temporary earn-rate spikes that look like anomalies',
        'Limited unique identification for loyalty members without mandatory CNIC linkage',
    ],
    'POV Success Criteria': [
        'Identify minimum 100 phantom or synthetic loyalty accounts in pilot analysis',
        'Loyalty fraud detection rate >80% on known historical fraud cases (back-testing)',
        'Points manipulation alerts with <25% false positive rate',
        'Quantify PKR 50M+ in loyalty value at risk from identified fraud patterns',
    ],
}

CONTENT[16] = {
    'owner': 'Compliance & Fraud',
    'Objective / Problem Statement': [
        'Detect employees trading on material non-public information (MNPI) obtained through their banking roles',
        'Bank employees in credit, treasury, M&A advisory, and corporate banking access price-sensitive information about listed companies',
        'SBP and SECP securities regulations prohibit insider trading \u2014 banks must demonstrate surveillance capabilities',
    ],
    'Business Benefit': [
        'Regulatory compliance with SECP insider trading regulations and SBP employee conduct requirements',
        'Protection of bank reputation \u2014 insider trading cases cause significant reputational damage',
        'Deterrence effect through visible monitoring of employee trading activities',
        'Early detection preventing regulatory enforcement actions and potential criminal prosecution',
    ],
    'Source Data': [
        'Employee trading records (personal brokerage account declarations per SBP policy)',
        'Employee access logs for price-sensitive information systems (credit files, treasury positions, M&A deals)',
        'PSX stock price and volume data for traded securities',
        'Communication metadata (email timestamps, phone records \u2014 not content) around trading events',
        'Corporate action and announcement data for companies where bank holds MNPI',
    ],
    'Methodology / Analytic Technique': [
        'Temporal correlation of employee trades with information access events (trade within 48 hours of accessing corporate file)',
        'Abnormal return analysis on employee-traded securities vs. market benchmark',
        'Trading pattern analysis detecting unusual trading volumes, timing, or position sizing',
        'Restricted list monitoring \u2014 automated blocking of trades in securities where bank is advisor',
        'Communication pattern analysis around trading events detecting unusual contact patterns',
    ],
    'Expected Outcome': [
        'Automated insider trading surveillance system monitoring all declared employee brokerage accounts',
        'Real-time restricted list enforcement preventing trades in covered securities',
        'Alert dashboard showing potential MNPI trading correlations for compliance investigation',
        'Quarterly compliance report for SBP/SECP demonstrating active surveillance program',
    ],
    'Challenges': [
        'Employee trading through undeclared accounts or family member accounts evading direct monitoring',
        'Distinguishing legitimate trading based on public information from MNPI-informed trading',
        'Data access to employee brokerage accounts \u2014 relies on employee declarations and broker cooperation',
        'Cultural sensitivity around perceived employee surveillance and privacy concerns',
    ],
    'POV Success Criteria': [
        'Insider trading surveillance operational across all employee categories with MNPI access',
        'Identify minimum 5 instances of suspicious temporal correlation in pilot period',
        'Restricted list violation rate reduced to zero through automated blocking',
        'Compliance reporting accepted by SBP/SECP as demonstrating adequate surveillance',
    ],
}

CONTENT[17] = {
    'owner': 'Fraud Investigation Unit',
    'Objective / Problem Statement': [
        'Detect forged and manipulated documents in loan applications \u2014 fake salary slips, fraudulent CNIC copies, manipulated financial statements, and fabricated employment letters',
        'Document fraud is the largest loan application fraud category in Pakistan, estimated at 3-5% of consumer lending applications',
        'Manual document verification is inconsistent across branches and unable to detect sophisticated forgeries',
    ],
    'Business Benefit': [
        'Prevention of PKR 5-10B in annual credit losses from document-fraud-originated loans',
        'Reduced manual verification costs through automated document authentication',
        'Improved underwriting quality through consistent document integrity checking across all channels',
        'Regulatory compliance with SBP KYC documentation requirements and NADRA verification mandates',
    ],
    'Source Data': [
        'Scanned loan application documents (salary slips, CNIC copies, bank statements, employer letters)',
        'NADRA CNIC verification API responses; Employer database for employment verification',
        'Historical document fraud cases with confirmed forgery methods and document types',
        'Document metadata (creation date, modification date, software used) from digital submissions',
    ],
    'Methodology / Analytic Technique': [
        'OCR-based document analysis extracting structured data from scanned documents',
        'Cross-matching extracted data with employer databases and NADRA verification results',
        'Document manipulation detection using image forensics (pixel analysis, font inconsistency, metadata anomalies)',
        'Pattern detection on document anomalies (round-number salaries, templates shared across applications)',
        'Employer verification scoring \u2014 flagging unverifiable employers and address inconsistencies',
    ],
    'Expected Outcome': [
        'Automated document verification scoring for every loan application with fraud probability',
        'Flagged documents routed to fraud verification team with specific anomaly descriptions',
        'Document fraud pattern library maintained and updated from confirmed fraud cases',
        'Integration with loan origination system for pre-disbursement verification checkpoint',
    ],
    'Challenges': [
        'Document quality varies significantly \u2014 poor scans, handwritten documents, non-standard formats',
        'Pakistan\u2019s informal sector (40%+ of economy) lacks standardized documentation formats',
        'NADRA API availability and response times for real-time verification during application processing',
        'Sophisticated forgeries using real employer letterheads and matching verification phone numbers',
    ],
    'POV Success Criteria': [
        'Document fraud detection rate >70% on known historical fraud cases (back-testing)',
        'False positive rate <10% for document verification flags',
        'NADRA verification integrated with <5 second response time in application workflow',
        'Quantify PKR 500M+ in prevented fraud losses through pre-disbursement detection',
    ],
}

CONTENT[18] = {
    'owner': 'Internal Audit Analytics',
    'Objective / Problem Statement': [
        'Detect employee fraud in marketing budget allocation \u2014 fictitious vendor invoices, inflated campaign costs, unauthorized promotional spending, and ghost marketing events',
        'Marketing budgets of PKR 1-3B annually at major Pakistani banks are vulnerable to procurement fraud and spend manipulation',
        'Limited financial controls on marketing expenditure create opportunities for invoice fraud and vendor collusion',
    ],
    'Business Benefit': [
        'Recovery of PKR 100-300M annually in fraudulent or inflated marketing expenditure',
        'Marketing ROI improvement through elimination of phantom campaigns and vendor overcharging',
        'Stronger vendor governance and procurement integrity for marketing services',
        'Compliance with internal financial controls and SBP operational risk management guidelines',
    ],
    'Source Data': [
        'Marketing vendor payments and invoice data from accounts payable system',
        'Campaign performance data (reach, engagement, conversions) correlated with spend',
        'Procurement approvals and vendor selection documentation',
        'Vendor master data (registration details, ownership, banking information)',
        'Employee authorization records for marketing expenditure approvals',
    ],
    'Methodology / Analytic Technique': [
        'Benford\u2019s Law analysis on marketing invoice amounts detecting fabricated invoices',
        'Duplicate invoice detection across vendor submissions using fuzzy matching',
        'Vendor concentration analysis \u2014 disproportionate spend to specific vendors by specific employees',
        'Campaign ROI outlier analysis \u2014 campaigns with high spend but zero or minimal measurable impact',
        'Price benchmarking against market rates for common marketing services (printing, media buying, events)',
    ],
    'Expected Outcome': [
        'Automated marketing spend anomaly detection with monthly alert generation',
        'Vendor risk scoring for marketing suppliers based on historical payment patterns',
        'Campaign spend-to-performance dashboard identifying low-ROI expenditure for review',
        'Procurement integrity reports for marketing department heads and audit committee',
    ],
    'Challenges': [
        'Marketing spend is inherently variable \u2014 legitimate campaigns vary widely in cost and approach',
        'Measuring marketing ROI accurately to distinguish wasted spend from fraudulent spend',
        'Vendor fragmentation \u2014 hundreds of small marketing vendors with limited financial visibility',
        'Employee resistance to spend monitoring perceived as micromanagement of marketing creativity',
    ],
    'POV Success Criteria': [
        'Identify minimum 10 anomalous marketing expenditure patterns in pilot analysis',
        'Duplicate invoice detection recovery of PKR 10M+ in overpayments',
        'Vendor concentration alerts identify 3+ potentially compromised vendor relationships',
        'Marketing spend anomaly false positive rate <25% verified through investigation',
    ],
}

CONTENT[19] = {
    'owner': 'Internal Audit Analytics',
    'Objective / Problem Statement': [
        'Deploy analytics-driven continuous process auditing identifying control violations, process deviations, and procedural non-compliance creating fraud opportunities',
        'Cover all SBP operational process requirements through automated monitoring of branch and back-office operations',
        'Traditional periodic audits miss control violations that occur between audit cycles \u2014 continuous monitoring closes this gap',
    ],
    'Business Benefit': [
        'Real-time identification of control violations before they lead to fraud losses',
        'Reduced audit cycle time and cost through analytics-directed sampling vs. full branch audit',
        'Compliance with SBP operational risk management guidelines and internal control requirements',
        'Deterrent effect \u2014 staff awareness of continuous monitoring improves process adherence',
    ],
    'Source Data': [
        'Core banking transaction logs with process workflow data (maker, checker, approver)',
        'System access logs and user privilege data; Dual control violation records',
        'Branch operations data (cash handling, vault access, document processing)',
        'Process exception and override logs; Customer complaint data linked to process failures',
    ],
    'Methodology / Analytic Technique': [
        'Process mining on transaction workflows identifying deviations from defined standard processes',
        'Control violation detection (segregation of duties breaches, dual control bypasses, unauthorized overrides)',
        'Statistical process control on branch operation metrics (cash variance, reconciliation exceptions)',
        'Sequence analysis on operational workflows detecting process step omissions',
        'Risk-based audit planning using analytics to prioritize branches and processes for physical audit',
    ],
    'Expected Outcome': [
        'Continuous monitoring dashboard covering all critical banking processes across 1,000+ branches',
        'Automated control violation alerts with severity classification and escalation workflows',
        'Branch process compliance scorecard supporting risk-based audit planning',
        'Quarterly process health report for Audit Committee and SBP regulatory submissions',
    ],
    'Challenges': [
        'Process definitions vary across branches \u2014 inconsistent standard operating procedures',
        'Legacy systems with limited process audit trail capability require workaround data capture',
        'False positives from legitimate process exceptions that are properly authorized',
        'Maintaining monitoring rules as processes change through system upgrades and policy updates',
    ],
    'POV Success Criteria': [
        'Continuous monitoring covers top 10 highest-risk processes across pilot branches',
        'Control violation detection rate >90% on known test scenarios',
        'Analytics-directed audit finds 2x more issues per audit hour than random sampling',
        'Process compliance scores improve by 15%+ at pilot branches within 6 months',
    ],
}

CONTENT[20] = {
    'owner': 'Information Security',
    'Objective / Problem Statement': [
        'Build comprehensive insider threat program combining system access analytics, behavioral monitoring, and data loss prevention capabilities',
        'Insider threats account for 30-40% of data breaches in banking \u2014 both malicious and negligent actors',
        'SBP IT Security Guidelines mandate insider threat detection capabilities for all scheduled banks',
    ],
    'Business Benefit': [
        'Early detection of insider threats before data breach or financial loss occurs',
        'Compliance with SBP IT Security Guidelines and PCI-DSS requirements for access monitoring',
        'Reduction of data breach risk \u2014 average cost of banking data breach is PKR 500M+ including regulatory penalties',
        'Deterrent effect through visible insider threat monitoring capabilities',
    ],
    'Source Data': [
        'System access logs (VPN, core banking, CRM, treasury, email) with user authentication records',
        'Data access patterns (file access, database queries, report downloads, screen captures)',
        'Network traffic analysis (data transfers, USB device usage, cloud storage access)',
        'HR data (performance reviews, disciplinary actions, resignation notices, access privilege changes)',
        'Email metadata and DLP alert logs for outbound data transmission monitoring',
    ],
    'Methodology / Analytic Technique': [
        'User and Entity Behavior Analytics (UEBA) establishing behavioral baselines per employee role',
        'Anomaly detection on system access patterns (unusual hours, unusual systems, unusual data volumes)',
        'Peer group analysis comparing individual access patterns to role-based peer norms',
        'Risk scoring combining access anomalies with HR risk indicators (resignation, poor review, disciplinary)',
        'Data exfiltration detection through network traffic analysis and DLP integration',
    ],
    'Expected Outcome': [
        'Insider threat risk scores for all employees with access to sensitive systems updated weekly',
        'Automated alerts for high-risk behavioral anomalies requiring immediate security response',
        'Data access monitoring dashboard for Information Security and CISO reporting',
        'Integration with HR processes (joining, leaving, role change) for access lifecycle management',
    ],
    'Challenges': [
        'Employee privacy concerns and labor law considerations for behavioral monitoring in Pakistan',
        'High-privilege users (DBAs, system admins) have legitimately broad access making anomaly detection difficult',
        'Alert fatigue from high false positive rates in behavioral analytics',
        'Integration across dozens of systems with different logging formats and retention policies',
    ],
    'POV Success Criteria': [
        'UEBA operational across top 10 critical systems with behavioral baseline established',
        'Insider threat risk scores demonstrate correlation with known past security incidents',
        'Detection of minimum 5 genuinely anomalous access patterns in pilot period',
        'SBP IT Security audit confirms insider threat monitoring meets guideline requirements',
    ],
}

CONTENT[21] = {
    'owner': 'Internal Audit Analytics',
    'Objective / Problem Statement': [
        'Detect fraudulent time recording and expense claims by bank employees \u2014 phantom overtime, inflated travel claims, duplicate expense submissions, and personal expense pass-through',
        'Large branch networks with manual expense processes create opportunities for systematic small-value fraud that aggregates to significant losses',
        'Annual expense and overtime budgets of PKR 2-5B at major Pakistani banks lack systematic analytics monitoring',
    ],
    'Business Benefit': [
        'Recovery of PKR 50-200M annually in fraudulent or inflated expense and overtime claims',
        'Reduced manual audit effort through automated anomaly detection and risk-based sampling',
        'Improved employee compliance with expense policies through systematic monitoring visibility',
        'Better budgeting and cost control through accurate expense pattern analytics',
    ],
    'Source Data': [
        'HR/payroll systems (attendance, overtime records, leave data)',
        'Expense management system (claims, receipts, approvals, reimbursements)',
        'Travel booking data (tickets, hotels, car rentals) from travel management system',
        'Building access records (badge swipe data) for attendance verification',
        'Manager approval logs and delegation of authority records',
    ],
    'Methodology / Analytic Technique': [
        'Duplicate detection across expense submissions (same amount, same date, same merchant across claims)',
        'Benford\u2019s Law analysis on expense amounts detecting round-number fabrication',
        'Attendance anomaly detection (overtime claimed vs. building access records)',
        'Travel expense verification (claimed routes vs. actual booking data, per diem vs. receipts)',
        'Peer group analysis comparing expense patterns to similar roles and locations',
    ],
    'Expected Outcome': [
        'Automated expense fraud monitoring with monthly anomaly reports for department heads',
        'Duplicate expense detection system integrated with expense management workflow',
        'Overtime verification dashboard cross-referencing payroll with physical access records',
        'Annual expense analytics report for Finance and Audit Committee',
    ],
    'Challenges': [
        'Manual expense processes at many branches \u2014 paper-based claims with limited digital audit trail',
        'Building access data not available at all branches; some lack electronic access control',
        'Expense policy variations across employee grades and locations complicating norm definition',
        'Employee relations sensitivity around expense monitoring perceived as distrust',
    ],
    'POV Success Criteria': [
        'Duplicate expense detection identifies PKR 10M+ in duplicate or overlapping claims',
        'Overtime verification flags minimum 50 cases of discrepancy between claimed and access records',
        'Travel expense anomaly rate <15% false positive on investigation verification',
        'Overall expense fraud/waste identified at 2-5% of total expense budget in pilot departments',
    ],
}

CONTENT[22] = {
    'owner': 'HR Analytics & Fraud',
    'Objective / Problem Statement': [
        'Detect fraudulent workers\u2019 compensation and medical claims \u2014 inflated injury claims, prolonged absence fraud, collusion with medical providers, and phantom disability claims',
        'Pakistan labor law provides mandatory compensation for workplace injuries; fraudulent claims cost banking sector PKR 500M+ annually',
        'Limited analytics on medical and compensation claims creates opportunity for systematic abuse',
    ],
    'Business Benefit': [
        'Reduction of PKR 100-200M annually in fraudulent or inflated compensation claims',
        'Faster legitimate claim processing by automating routine verification checks',
        'Improved employee health and safety management through claim pattern analytics',
        'Compliance with Pakistan labor law requirements while preventing abuse',
    ],
    'Source Data': [
        'HR case management data (injury reports, compensation claims, disability assessments)',
        'Medical claims data (hospital, doctor, treatment type, amount, frequency)',
        'Attendance records and leave data correlated with claim periods',
        'Medical provider data (facility details, claim patterns per provider)',
        'Historical claim outcomes and investigation results for model training',
    ],
    'Methodology / Analytic Technique': [
        'Claim pattern analysis detecting anomalous frequency, duration, or amount vs. peer group',
        'Medical provider network analysis identifying providers with abnormal claim volumes or patterns',
        'Duration analysis comparing claimed recovery periods to medical benchmarks by injury type',
        'Duplicate and overlapping claim detection across compensation and medical insurance programs',
        'Return-to-work prediction modeling identifying claims with unusually extended absence periods',
    ],
    'Expected Outcome': [
        'Automated claim fraud scoring prioritizing suspicious claims for investigation',
        'Medical provider risk scoring identifying potentially colluding healthcare facilities',
        'Claim duration benchmarking reports comparing actual vs. expected recovery timelines',
        'Quarterly compensation fraud report for HR and Finance leadership',
    ],
    'Challenges': [
        'Sensitivity around medical data privacy and employee health information protection',
        'Medical claim complexity \u2014 legitimate variations in recovery time and treatment needs',
        'Limited medical benchmarking data for Pakistan-specific injury recovery expectations',
        'Labor union and employee relations considerations when investigating compensation claims',
    ],
    'POV Success Criteria': [
        'Claim fraud scoring identifies minimum 10 suspicious claims in pilot requiring investigation',
        'Medical provider analysis flags 3+ providers with statistically anomalous claim patterns',
        'False positive rate <30% on fraud-flagged claims verified through investigation',
        'Claim processing time for legitimate claims reduced by 20% through automated verification',
    ],
}

CONTENT[23] = {
    'owner': 'Information Security',
    'Objective / Problem Statement': [
        'Detect unauthorized data extraction by employees \u2014 customer data theft, competitive intelligence leakage, and regulatory data breaches through digital and physical channels',
        'Banking data (customer PII, account details, transaction records) commands premium prices in Pakistan\u2019s data black market',
        'SBP data protection requirements and upcoming Personal Data Protection Bill mandate data loss prevention capabilities',
    ],
    'Business Benefit': [
        'Prevention of customer data breaches that carry PKR 100-500M+ in regulatory penalties and reputational damage',
        'Compliance with SBP data protection requirements and PCI-DSS for card data environments',
        'Protection of competitive intelligence (customer lists, pricing strategies, product plans)',
        'Deterrent effect through visible DLP capabilities reducing insider data theft attempts',
    ],
    'Source Data': [
        'Email logs and attachment analysis (outbound emails with customer data patterns)',
        'File transfer logs (FTP, cloud storage uploads, network shares)',
        'USB device usage and removable media access logs',
        'Printer and document output logs; Screen capture and screenshot detection',
        'Database query logs monitoring bulk data extraction attempts',
    ],
    'Methodology / Analytic Technique': [
        'Data Loss Prevention (DLP) content inspection on all outbound channels (email, web, USB, print)',
        'User behavioral analytics on data access volume anomalies (bulk downloads, unusual query patterns)',
        'Content classification and sensitivity labeling for automated protection policy enforcement',
        'Exfiltration pattern detection (small incremental transfers evading single-event thresholds)',
        'Correlation analysis between data access and employee risk indicators (resignation, termination notice)',
    ],
    'Expected Outcome': [
        'DLP monitoring across email, web, USB, and print channels with automated blocking of sensitive data',
        'Data access anomaly alerts for security operations team investigation',
        'Monthly data protection compliance report for CISO and Board Risk Committee',
        'Integration with employee lifecycle management (enhanced monitoring during notice period)',
    ],
    'Challenges': [
        'Legitimate business data sharing (customer reports, regulatory submissions) must not be blocked',
        'Encrypted channels and personal devices complicate comprehensive monitoring',
        'Data classification at scale \u2014 classifying millions of files and database records across systems',
        'Balancing security monitoring with employee privacy and operational efficiency',
    ],
    'POV Success Criteria': [
        'DLP operational on email and USB channels covering 80%+ of data exfiltration risk vectors',
        'Detection of minimum 5 data protection policy violations in pilot period',
        'False positive rate <20% for DLP alerts after initial tuning period',
        'Zero customer data breaches during POV period attributable to insider exfiltration',
    ],
}

CONTENT[24] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Develop leading indicators predicting employee fraud before losses occur \u2014 combining financial stress indicators, behavioral changes, and organizational risk factors',
        'Move from detective controls (finding fraud after the fact) to predictive prevention (identifying high-risk employees proactively)',
        'Research shows 80% of employee fraud perpetrators exhibit warning signs 6-12 months before committing fraud',
    ],
    'Business Benefit': [
        'Prevention of employee fraud losses through early intervention rather than post-loss detection',
        'Targeted controls and enhanced monitoring for highest-risk employee segments',
        'Reduced average employee fraud loss per incident through earlier detection',
        'HR integration enabling supportive intervention for employees showing financial stress indicators',
    ],
    'Source Data': [
        'Employee HR data (tenure, performance reviews, compensation, promotion history)',
        'Employee transaction patterns (salary account conduct, personal loan status, credit card behavior)',
        'System access patterns and working hour anomalies',
        'Organizational risk factors (branch size, control environment assessment, manager span)',
        'Historical employee fraud cases with pre-fraud indicator data for supervised learning',
    ],
    'Methodology / Analytic Technique': [
        'Predictive model combining HR risk factors with behavioral indicators for fraud propensity scoring',
        'Financial stress detection (salary-to-debt ratio, account overdraft frequency, declined transactions)',
        'Behavioral change detection (shift in work patterns, overtime changes, access pattern anomalies)',
        'Organizational risk factor analysis (branches with weak controls, understaffed, high turnover)',
        'Survival analysis modeling time-to-fraud from onset of risk indicator patterns',
    ],
    'Expected Outcome': [
        'Employee fraud propensity score updated quarterly for all operational staff',
        'Early warning alerts triggered by combinations of risk factors exceeding threshold',
        'HR intervention workflow for employees showing financial stress (employee assistance program referral)',
        'Organizational risk heat map identifying branches and departments with elevated fraud vulnerability',
    ],
    'Challenges': [
        'Ethical considerations around predictive scoring of employees \u2014 risk of discrimination and presumption',
        'Very low base rate of employee fraud (0.1-0.5% of staff) makes prediction statistically challenging',
        'Employee privacy rights and labor law protections limit monitoring scope',
        'Ensuring supportive intervention rather than punitive response to risk indicators',
    ],
    'POV Success Criteria': [
        'Predictive model validated against historical cases \u2014 80%+ of past fraud cases scored in top risk decile',
        'Financial stress indicators correlated with subsequent control violations in pilot data',
        'Organizational risk scores validated against audit findings and historical fraud incidence',
        'HR accepts and implements supportive intervention workflow for employee assistance referrals',
    ],
}

# ─────────────────────────────────────────────────────────
# SECTION 3: CUSTOMER FRAUD (Slides 25-36)
# ─────────────────────────────────────────────────────────

CONTENT[25] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect compromised ATM and POS devices skimming card data across Pakistan\u2019s 16,000+ ATM network and 100,000+ POS terminals',
        'Skimming attacks remain the #1 card fraud vector in Pakistan \u2014 organized gangs target specific geographic clusters',
        'Current detection relies on customer complaints rather than proactive device compromise identification',
    ],
    'Business Benefit': [
        'Prevention of PKR 500M-1B annual card fraud losses from skimming through early device identification',
        'Reduced card reissuance costs (PKR 500-1,000 per card) by identifying compromised devices before mass data theft',
        'Customer trust protection through proactive notification rather than post-fraud discovery',
        'Compliance with PCI-DSS device integrity monitoring requirements',
    ],
    'Source Data': [
        'Transaction data by device ID (ATM terminal ID, POS merchant ID) with geographic location',
        'Card fraud reports correlated with last-used device/merchant',
        'Device maintenance and inspection records; Terminal software version data',
        'Geographic clustering of fraud cases; Common Point of Purchase (CPP) analysis data',
    ],
    'Methodology / Analytic Technique': [
        'Common Point of Purchase (CPP) analysis identifying devices where multiple fraud victims transacted',
        'Geographic clustering of fraud reports to identify compromised device locations',
        'Temporal analysis of fraud emergence patterns post-device interaction',
        'Device risk scoring based on historical CPP frequency and geographic risk factors',
        'Anomaly detection on transaction patterns at device level (unusual decline rates, timing patterns)',
    ],
    'Expected Outcome': [
        'Automated CPP analysis identifying potentially compromised devices within 48 hours of first fraud report',
        'Proactive card blocking for cards transacted at identified compromised devices',
        'Device risk dashboard for ATM/POS management with geographic heat map',
        'Integration with device maintenance workflow for priority inspection of flagged terminals',
    ],
    'Challenges': [
        'Large device network (100,000+ terminals) requires efficient scanning algorithms',
        'False CPP identification can trigger unnecessary card replacements and customer disruption',
        'Skimming detection speed vs. fraud report lag \u2014 victims may not report for days or weeks',
        'ATM maintenance and device inspection logistics across Pakistan\u2019s geographic spread',
    ],
    'POV Success Criteria': [
        'CPP analysis identifies compromised devices within 72 hours (vs. current 2-4 weeks)',
        'Proactive card blocking prevents 50%+ of losses from identified device compromises',
        'False CPP identification rate <10% verified through device inspection outcomes',
        'Card reissuance costs reduced by PKR 100M+ through targeted vs. mass replacement',
    ],
}

CONTENT[26] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Detect fraudulent loan applications using false identity, inflated income, synthetic identities, or stolen CNICs',
        'Consumer lending exposure of PKR 200B+ is vulnerable to application fraud estimated at 3-5% of applications',
        'CNIC/NADRA verification gaps and informal sector income documentation make Pakistan particularly vulnerable',
    ],
    'Business Benefit': [
        'Prevention of PKR 5-10B annual credit losses from fraudulently originated loans',
        'Reduced first-payment default (FPD) rate \u2014 a key indicator of application fraud',
        'Improved underwriting quality through automated fraud screening pre-disbursement',
        'Compliance with SBP KYC/CDD requirements for loan origination',
    ],
    'Source Data': [
        'Loan application data (demographics, income, employment, purpose)',
        'CNIC verification via NADRA API; ECIB credit bureau data (existing facilities, inquiries, defaults)',
        'Historical application fraud cases with confirmed fraud indicators',
        'Digital application metadata (device fingerprint, IP, application completion time)',
        'Employer verification databases; Address verification data',
    ],
    'Methodology / Analytic Technique': [
        'Application fraud scorecard using supervised learning on historical fraud labels',
        'Identity verification scoring combining NADRA match confidence, photo match, and biometric verification',
        'Income verification analytics \u2014 cross-checking declared income with account transaction patterns',
        'Duplicate application detection across branches and channels using fuzzy CNIC matching',
        'Velocity analysis on applications (same CNIC, phone, device, employer across multiple applications)',
    ],
    'Expected Outcome': [
        'Pre-disbursement fraud score for every loan application with automated flag/hold decisions',
        'Identity verification dashboard showing NADRA match results and anomaly flags',
        'First-payment default prediction model identifying highest-risk originations',
        'Application fraud reporting for management with fraud rate by channel, product, and branch',
    ],
    'Challenges': [
        'Informal sector income verification \u2014 40%+ of Pakistan\u2019s economy lacks formal documentation',
        'NADRA API availability and response time constraints during peak application processing',
        'Sophisticated synthetic identity fraud using real CNIC numbers with altered demographic data',
        'Balancing fraud prevention with financial inclusion \u2014 overly strict checks exclude legitimate borrowers',
    ],
    'POV Success Criteria': [
        'Application fraud detection rate >60% on known historical fraud cases (back-testing)',
        'First-payment default rate reduced by 20%+ for scored applications vs. unscored control group',
        'False positive rate <8% for fraud flags verified through investigation',
        'NADRA verification integrated with <5 second response in application workflow',
    ],
}

CONTENT[27] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Real-time card fraud detection across POS, ATM, e-commerce, and contactless channels for Pakistan\u2019s 50M+ debit/credit cards',
        'Card fraud types include chip-and-PIN fallback exploitation, card-not-present (CNP) fraud, cross-border fraud, and contactless tap fraud',
        'E-commerce fraud growing 40%+ annually as Pakistan\u2019s digital commerce expands rapidly',
    ],
    'Business Benefit': [
        'Prevention of PKR 1-2B annual card fraud losses through real-time ML-based detection',
        'Reduced false decline rate improving customer experience and merchant acceptance',
        'Compliance with international card scheme (Visa, Mastercard) fraud monitoring requirements',
        'Competitive advantage in card issuance through superior fraud protection reputation',
    ],
    'Source Data': [
        'Real-time card authorization data (amount, merchant, MCC, location, channel, device)',
        'Cardholder behavioral profiles (spending patterns, merchant preferences, geographic norms)',
        'Merchant risk profiles (MCC fraud rates, geographic risk, chargeback history)',
        'Card scheme fraud intelligence feeds; Cross-border transaction risk data',
    ],
    'Methodology / Analytic Technique': [
        'Real-time fraud scoring using gradient-boosted models on every card authorization',
        'Cardholder behavioral profiling with dynamic baseline updates',
        'E-commerce risk scoring incorporating device fingerprint, IP geolocation, and 3DS data',
        'Cross-border transaction risk assessment using country risk scoring',
        'Contactless fraud detection using tap frequency and amount pattern analysis',
    ],
    'Expected Outcome': [
        'Real-time fraud score on 100% of card authorizations within 50ms response requirement',
        'Channel-specific detection strategies optimized for POS, ATM, e-commerce, and contactless',
        'Automated block/allow/step-up-authentication decisioning by risk score tier',
        'Card fraud dashboard with real-time monitoring and daily trend analysis',
    ],
    'Challenges': [
        'Sub-50ms latency requirement for card authorization response leaves minimal scoring time',
        'Card-not-present fraud lacks physical verification cues available in card-present transactions',
        'Cross-border transactions have limited data (foreign merchant details often incomplete)',
        'Balancing fraud prevention with customer convenience \u2014 excessive blocks cause card abandonment',
    ],
    'POV Success Criteria': [
        'Card fraud detection rate >85% with false positive rate <3% on pilot card portfolio',
        'Scoring latency <50ms meeting card scheme authorization response requirements',
        'E-commerce fraud detection rate >70% (historically hardest channel)',
        'False decline rate reduced by 30%+ vs. existing rule-based system',
    ],
}

CONTENT[28] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect IBFT/RAAST digital payment fraud \u2014 authorized push payment (APP) scams, QR code manipulation, and social engineering via WhatsApp/phone for payment authorization',
        'Digital payment fraud is Pakistan\u2019s fastest-growing fraud category with RAAST P2P/P2M volumes exceeding PKR 9.8 trillion in FY2024',
        'APP fraud is uniquely challenging because the customer authorizes the payment themselves under fraudulent pretenses',
    ],
    'Business Benefit': [
        'Prevention of PKR 500M-1B in digital payment fraud losses growing at 40%+ annually',
        'Customer trust in digital payment channels \u2014 critical for SBP\u2019s digital payments growth objectives',
        'Reduced customer complaint volumes and dispute resolution costs',
        'Compliance with SBP consumer protection requirements for digital payment channels',
    ],
    'Source Data': [
        'IBFT/RAAST transaction data (sender, receiver, amount, timing, frequency)',
        'Customer behavioral baselines for digital payment patterns',
        'Beneficiary relationship data (new vs. established recipients)',
        'Device and session data (mobile app, USSD, internet banking, third-party app)',
        'Customer complaint and dispute data for digital payment fraud labeling',
    ],
    'Methodology / Analytic Technique': [
        'Beneficiary risk scoring (new beneficiary + high amount + unusual timing = elevated risk)',
        'Social engineering detection through transaction velocity and amount escalation patterns',
        'QR code transaction anomaly detection (merchant verification, dynamic QR integrity checking)',
        'APP fraud pattern detection using temporal analysis of pre-payment communication and transaction behavior',
        'Mule account detection on receiving side (accounts receiving from many first-time senders)',
    ],
    'Expected Outcome': [
        'Real-time risk scoring on all IBFT/RAAST transactions with intervention for high-risk payments',
        'Customer confirmation flow (cooling-off delay, warning messages) for high-risk payment patterns',
        'Mule account identification on receiving side for proactive account restriction',
        'Digital payment fraud dashboard with trend analysis by fraud type and channel',
    ],
    'Challenges': [
        'APP fraud is customer-authorized \u2014 traditional fraud detection based on unauthorized activity does not apply',
        'Customer friction from intervention (confirmation delays) impacts digital payment adoption',
        'Real-time scoring across RAAST instant payment infrastructure with near-zero latency tolerance',
        'Rapidly evolving social engineering tactics (WhatsApp impersonation, fake bank calls, prize scams)',
    ],
    'POV Success Criteria': [
        'Digital payment fraud detection rate >50% for APP fraud (most challenging category)',
        'Mule account identification accuracy >60% confirmed through investigation',
        'Customer intervention (warning/delay) prevents 30%+ of high-risk payment completions',
        'Zero increase in legitimate transaction abandonment rate despite new controls',
    ],
}

CONTENT[29] = {
    'owner': 'Internal Audit Analytics',
    'Objective / Problem Statement': [
        'Detect vendor fraud in bank procurement \u2014 inflated invoices, phantom vendors, bid rigging, and duplicate payments',
        'Annual procurement budgets of PKR 5-10B at major Pakistani banks have limited analytics monitoring',
        'Vendor fraud can involve collusion between bank employees and external vendors making detection complex',
    ],
    'Business Benefit': [
        'Recovery of PKR 200-500M annually in fraudulent or inflated vendor payments',
        'Procurement integrity improvement through systematic monitoring and vendor risk assessment',
        'Compliance with SBP operational risk management guidelines for third-party management',
        'Better vendor negotiation through comprehensive spend analytics and price benchmarking',
    ],
    'Source Data': [
        'Accounts payable data (vendor invoices, payment amounts, payment timing)',
        'Vendor master data (registration details, ownership, banking information, tax ID)',
        'Purchase order and contract data; Procurement approval workflows and bid documentation',
        'Employee-vendor interaction data; Market price benchmarking data for common goods/services',
    ],
    'Methodology / Analytic Technique': [
        'Benford\u2019s Law analysis on invoice amounts detecting fabricated round-number invoices',
        'Duplicate payment detection (same invoice number, same amount, different dates)',
        'Phantom vendor identification (vendors with employee-linked addresses, phone numbers, or bank accounts)',
        'Bid rigging detection (suspicious bid clustering, rotating winners, bid amounts just below thresholds)',
        'Price benchmarking analysis identifying above-market payments for standard goods and services',
    ],
    'Expected Outcome': [
        'Automated vendor fraud monitoring with monthly anomaly reports for procurement leadership',
        'Vendor risk scoring based on payment pattern analytics and relationship analysis',
        'Duplicate payment detection integrated with accounts payable workflow for prevention',
        'Procurement integrity dashboard for Audit Committee reporting',
    ],
    'Challenges': [
        'Large vendor base (5,000-10,000 active vendors) with diverse payment patterns',
        'Legitimate price variations across geographies and contract terms complicate benchmarking',
        'Phantom vendors using real addresses and bank accounts of uninvolved third parties',
        'Employee-vendor collusion designed to evade standard procurement controls',
    ],
    'POV Success Criteria': [
        'Duplicate payment detection identifies PKR 20M+ in confirmed duplicate or overpayments',
        'Phantom vendor screening flags minimum 10 vendors requiring investigation',
        'Bid rigging analysis identifies 3+ suspicious procurement patterns',
        'Vendor fraud detection false positive rate <25% verified through investigation',
    ],
}

CONTENT[30] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect synthetic identities constructed from combinations of real and fake CNIC data to open fraudulent accounts and obtain credit',
        'Pakistan\u2019s CNIC system provides a foundational identity layer but gaps in real-time verification enable synthetic identity creation',
        'Synthetic identity fraud is the fastest-growing identity fraud type globally \u2014 Pakistan\u2019s 230M CNICs create a large attack surface',
    ],
    'Business Benefit': [
        'Prevention of PKR 2-5B in synthetic identity fraud losses across consumer and SME lending',
        'Reduced credit losses from accounts that never intended to repay (bust-out fraud)',
        'Enhanced CNIC-based identity verification strengthening the entire customer onboarding process',
        'ECIB data quality improvement by identifying and purging synthetic identity credit files',
    ],
    'Source Data': [
        'Customer CNIC data and NADRA verification responses (match scores, photo verification status)',
        'Account opening data (velocity of new accounts, channel, referring source)',
        'ECIB credit bureau data (thin file indicators, inquiry patterns, credit building behavior)',
        'Shared attribute analysis (phone numbers, addresses, devices, beneficiaries across accounts)',
        'Digital footprint data (IP addresses, device fingerprints, application behavioral data)',
    ],
    'Methodology / Analytic Technique': [
        'CNIC digit analysis for structural anomalies (invalid region codes, impossible issue dates)',
        'Synthetic identity scoring combining NADRA verification confidence with behavioral indicators',
        'Credit building pattern detection (gradual limit increases, minimal usage, sudden max utilization \u2014 bust-out pattern)',
        'Cluster analysis identifying groups of accounts with shared synthetic identity attributes',
        'Multi-bank synthetic identity detection using ECIB inquiry and facility pattern analysis',
    ],
    'Expected Outcome': [
        'Synthetic identity risk score for every new account application at onboarding',
        'Post-onboarding monitoring for synthetic identity behavioral patterns (credit building phase)',
        'Bust-out prediction model identifying accounts approaching fraud execution phase',
        'Cluster identification of related synthetic identities for network-level investigation',
    ],
    'Challenges': [
        'Synthetic identities are designed to look legitimate \u2014 they pass individual verification checks',
        'Long fraud lifecycle (12-24 months of credit building before bust-out) delays feedback for model training',
        'NADRA verification API does not return detailed match reasons, limiting diagnostic capability',
        'Distinguishing synthetic identities from thin-file legitimate customers (new to banking)',
    ],
    'POV Success Criteria': [
        'Synthetic identity scoring identifies 50%+ of known synthetic fraud cases in back-testing',
        'Bust-out prediction model provides 60+ day advance warning before max utilization event',
        'Cluster analysis identifies minimum 3 synthetic identity groups in pilot portfolio',
        'False positive rate <5% for synthetic identity flags at onboarding (critical for inclusion)',
    ],
}

CONTENT[31] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect unauthorized account access through stolen credentials, SIM-swap attacks, social engineering, and session hijacking',
        'Pakistan\u2019s heavy reliance on SMS OTP for authentication creates significant SIM-swap vulnerability',
        'Account takeover (ATO) fraud is growing 50%+ annually as digital banking adoption accelerates',
    ],
    'Business Benefit': [
        'Prevention of PKR 500M-1B in account takeover fraud losses annually',
        'Customer trust preservation in digital banking channels critical for SBP digitization goals',
        'Reduced customer complaint volumes and dispute resolution costs from ATO incidents',
        'Compliance with SBP digital banking security guidelines for customer authentication',
    ],
    'Source Data': [
        'Authentication logs (login success/failure, OTP delivery and usage, biometric checks)',
        'Device fingerprint data and session analytics (IP, browser, app version, screen resolution)',
        'Contact change requests (phone number, email, address) preceding suspicious activity',
        'Transaction patterns post-authentication for behavioral continuity verification',
        'Telecom SIM-swap event data (where available through carrier partnerships)',
    ],
    'Methodology / Analytic Technique': [
        'Device fingerprint matching detecting logins from unrecognized devices',
        'Behavioral biometrics (typing patterns, navigation behavior) for continuous authentication',
        'SIM-swap detection through OTP delivery pattern analysis and telecom data integration',
        'Session anomaly detection (geographic impossibility, concurrent sessions, unusual timing)',
        'Contact change velocity analysis (phone change + password reset + high-value transfer = ATO pattern)',
    ],
    'Expected Outcome': [
        'Real-time ATO risk scoring on every digital banking session with step-up authentication triggers',
        'SIM-swap detection capability blocking fraudulent OTP-authenticated transactions',
        'Device trust management with customer-enrolled trusted devices for reduced friction',
        'ATO incident response automation (immediate account freeze, customer notification, investigation)',
    ],
    'Challenges': [
        'SIM-swap detection requires telecom carrier data sharing \u2014 limited partnerships in Pakistan currently',
        'Behavioral biometrics deployment on mobile devices requires app-level integration',
        'Legitimate device changes (new phone) must not lock out genuine customers',
        'Sophisticated ATO attacks that gradually establish new device trust over time',
    ],
    'POV Success Criteria': [
        'ATO detection rate >70% for known account takeover incidents in pilot channel',
        'SIM-swap detection identifies 80%+ of SIM-swap events within 30 minutes',
        'False positive rate <5% for ATO alerts (critical for digital banking experience)',
        'Average ATO detection time reduced from days to minutes',
    ],
}

CONTENT[32] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Build comprehensive identity fraud analytics covering CNIC fraud, deceased identity usage, identity theft through document forgery, and impersonation',
        'NADRA integration for real-time CNIC verification and biometric matching is critical but not universally implemented',
        'Identity fraud underpins most other fraud types \u2014 effective identity verification is the foundation of fraud prevention',
    ],
    'Business Benefit': [
        'Prevention of PKR 3-5B in identity-fraud-originated financial losses across all products',
        'Strengthened KYC/CDD compliance meeting SBP and FATF requirements for identity verification',
        'Reduced account opening fraud through enhanced identity verification at onboarding',
        'Protection of deceased customers\u2019 accounts from exploitation by unauthorized parties',
    ],
    'Source Data': [
        'Customer CNIC data with NADRA biometric verification results',
        'NADRA death registry for deceased identity detection',
        'Account opening photographs and biometric data; Document image analysis data',
        'Cross-customer identity attribute sharing analysis (shared phone, address, device, biometric)',
        'Historical identity fraud cases with confirmed fraud methods for model training',
    ],
    'Methodology / Analytic Technique': [
        'NADRA real-time CNIC verification with biometric matching at account opening',
        'Deceased identity detection through NADRA death registry cross-matching on existing portfolio',
        'Facial recognition comparison between account opening photo and CNIC photo',
        'Identity attribute clustering detecting individuals using multiple CNICs or shared CNIC attributes',
        'Document forensic analysis for CNIC copy manipulation detection',
    ],
    'Expected Outcome': [
        'Real-time identity verification scoring at every customer touchpoint (onboarding, significant transactions)',
        'Deceased account monitoring with automated alerts and account restriction workflow',
        'Identity fraud risk dashboard showing fraud rates by channel, product, and verification method',
        'Enhanced CDD reports with identity verification confidence scores',
    ],
    'Challenges': [
        'NADRA API availability and cost \u2014 real-time biometric verification at scale is expensive',
        'Photo quality issues for facial recognition (low-resolution scans, old CNIC photos)',
        'Privacy considerations for biometric data storage and processing',
        'Rural and underbanked populations with limited digital identity verification infrastructure',
    ],
    'POV Success Criteria': [
        'Identity fraud detection rate >80% on known historical identity fraud cases',
        'Deceased identity detection covers 100% of existing customer portfolio within POV period',
        'NADRA biometric verification integrated at all account opening channels',
        'Identity fraud losses reduced by 30%+ on pilot product portfolio',
    ],
}

CONTENT[33] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect internet banking fraud including phishing, man-in-the-browser attacks, credential stuffing, and session hijacking',
        'Pakistan\u2019s internet banking users growing at 30%+ annually \u2014 fraud attacks growing in parallel',
        'Current detection relies on static rules that miss sophisticated multi-stage attack patterns',
    ],
    'Business Benefit': [
        'Prevention of PKR 300-500M annual internet banking fraud losses',
        'Customer confidence in internet banking channel supporting SBP digital adoption targets',
        'Reduced customer complaint and dispute resolution costs from online fraud incidents',
        'Compliance with SBP digital banking security guidelines and PCI-DSS requirements',
    ],
    'Source Data': [
        'Web session logs (login attempts, navigation patterns, page dwell times, form interactions)',
        'Transaction patterns during internet banking sessions',
        'Device fingerprint and browser configuration data; IP geolocation and reputation data',
        'Phishing intelligence feeds and known malicious domain/IP lists',
        'Customer behavioral baselines for internet banking interaction patterns',
    ],
    'Methodology / Analytic Technique': [
        'Session risk scoring combining device, location, behavior, and transaction anomaly signals',
        'Credential stuffing detection through login attempt velocity and failure pattern analysis',
        'Man-in-the-browser detection through page manipulation indicators and session integrity checks',
        'Phishing detection through outbound link monitoring and customer-reported URL analysis',
        'Behavioral biometrics during session (mouse movement, typing patterns, navigation speed)',
    ],
    'Expected Outcome': [
        'Real-time session risk scoring with adaptive authentication (step-up for high-risk sessions)',
        'Credential stuffing attack detection and automated IP blocking',
        'Phishing campaign detection and customer notification system',
        'Internet banking fraud dashboard with attack type classification and trend analysis',
    ],
    'Challenges': [
        'VPN and proxy usage by legitimate customers complicates IP-based risk assessment',
        'Mobile browser diversity and limited fingerprinting capability on mobile web',
        'Encryption of session data limiting visibility into some attack vectors',
        'Customer friction from frequent step-up authentication reducing channel adoption',
    ],
    'POV Success Criteria': [
        'Internet banking fraud detection rate >75% on known fraud incidents',
        'Credential stuffing attacks blocked within 5 minutes of detection',
        'False positive rate <3% for session risk alerts to maintain customer experience',
        'Phishing campaign detection and customer notification within 4 hours of identification',
    ],
}

CONTENT[34] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Detect mobile banking and wallet fraud \u2014 malware, fake apps, screen overlay attacks, OTP interception, and SIM-swap exploitation',
        'JazzCash, Easypaisa, and bank mobile apps collectively handle PKR 5+ trillion in annual transactions',
        'Mobile-specific attack vectors (app-level malware, accessibility abuse, screen overlays) require specialized detection',
    ],
    'Business Benefit': [
        'Prevention of PKR 500M-1B in mobile banking fraud losses across bank apps and wallet partners',
        'Customer trust in mobile banking channels \u2014 critical for Pakistan\u2019s financial inclusion strategy',
        'Reduced fraud-related customer churn from mobile banking channels',
        'Compliance with SBP mobile banking security framework requirements',
    ],
    'Source Data': [
        'Mobile app telemetry (device integrity, rooted/jailbroken status, app version, OS version)',
        'Transaction data from mobile banking sessions with device context',
        'App behavioral data (screen interaction patterns, biometric usage, session duration)',
        'Malware intelligence feeds and known malicious app signatures',
        'SIM status data and device change events from telecom partnerships',
    ],
    'Methodology / Analytic Technique': [
        'Device integrity checking (root detection, emulator detection, app tampering detection)',
        'Behavioral biometrics on mobile (touch patterns, swipe dynamics, gyroscope data)',
        'Overlay attack detection through app focus monitoring and screen stack analysis',
        'OTP interception detection through delivery-to-usage time analysis and SIM validation',
        'Mobile malware indicator detection through app permission analysis and behavioral anomalies',
    ],
    'Expected Outcome': [
        'Real-time device and session risk scoring for every mobile banking interaction',
        'Malware-compromised device detection with customer notification and security guidance',
        'SIM-swap protection for mobile banking authentication flows',
        'Mobile fraud dashboard with attack vector classification and device vulnerability reporting',
    ],
    'Challenges': [
        'Android device fragmentation in Pakistan \u2014 many low-cost devices with outdated OS and limited security',
        'App-level security controls limited by mobile OS restrictions (especially iOS)',
        'USSD-based mobile banking (feature phones) has extremely limited fraud detection capability',
        'Telecom carrier cooperation for SIM-swap data varies across Pakistan\u2019s mobile operators',
    ],
    'POV Success Criteria': [
        'Mobile fraud detection rate >65% on known mobile-specific fraud incidents',
        'Device integrity checking blocks compromised devices from high-risk transactions',
        'Behavioral biometrics reduces false positive rate by 30% vs. device-only signals',
        'SIM-swap detection coverage >80% through telecom carrier data integration',
    ],
}

CONTENT[35] = {
    'owner': 'Fraud Risk Management',
    'Objective / Problem Statement': [
        'Detect auto insurance claim fraud in bancassurance \u2014 staged accidents, inflated repair costs, phantom claims, and serial claimants',
        'Pakistan motor insurance (bancassurance channel) represents PKR 20B+ in annual premiums with estimated 10-15% fraudulent claim rate',
        'Limited analytics on claim patterns creates opportunity for systematic abuse by organized fraud rings',
    ],
    'Business Benefit': [
        'Reduction of PKR 2-3B annually in fraudulent auto insurance claims processed through bank channels',
        'Improved claims processing speed for legitimate claims through automated fraud screening',
        'Strengthened bancassurance partner relationships through improved claim fraud management',
        'Reduced insurance premium costs passed through to bank customers',
    ],
    'Source Data': [
        'Insurance claim data (vehicle details, accident description, repair estimate, claimant history)',
        'Repair shop network data (claim volumes, average repair costs, geographic patterns)',
        'Claimant history data (prior claims frequency, types, amounts across policies)',
        'Vehicle registration and valuation data; Police report and accident investigation data',
        'Third-party claim patterns for staged multi-party accident detection',
    ],
    'Methodology / Analytic Technique': [
        'Claim scoring model combining claim characteristics with claimant and repair shop risk factors',
        'Repair shop network analysis identifying shops with abnormally high fraud-indicative patterns',
        'Serial claimant detection across policies, products, and insurance partners',
        'Staged accident detection through multi-party claim correlation and timeline analysis',
        'Repair cost benchmarking against market rates by vehicle type and damage description',
    ],
    'Expected Outcome': [
        'Automated claim fraud scoring at point of claim filing for investigation prioritization',
        'Repair shop risk ratings driving audit and investigation targeting',
        'Serial claimant database shared across bancassurance insurance partners',
        'Claims fraud dashboard with fraud rate trends by vehicle type, region, and repair network',
    ],
    'Challenges': [
        'Limited standardized data from insurance company claim systems into bank analytics platform',
        'Repair cost benchmarking difficult due to lack of standardized pricing in Pakistan auto repair market',
        'Claim investigation resources limited \u2014 field investigation infrastructure underdeveloped',
        'Multi-insurer coordination for serial claimant detection requires industry data sharing',
    ],
    'POV Success Criteria': [
        'Claim fraud scoring identifies 60%+ of known fraudulent claims in back-testing',
        'Repair shop analysis flags minimum 10 high-risk shops for investigation',
        'Serial claimant detection identifies 20+ multi-claim individuals across portfolio',
        'Fraud savings of PKR 200M+ estimated from identified fraudulent claims in pilot',
    ],
}

CONTENT[36] = {
    'owner': 'Fraud Analytics CoE',
    'Objective / Problem Statement': [
        'Use NLP/text analytics on insurance claim documents to detect fraudulent narratives \u2014 inconsistencies, exaggeration patterns, and suspicious language',
        'Claim descriptions, adjuster notes, and medical reports contain textual fraud indicators that structured data analysis misses',
        'Pakistan\u2019s bilingual (Urdu/English) documentation requires specialized NLP capabilities',
    ],
    'Business Benefit': [
        'Detection of 15-25% additional fraudulent claims missed by structured data analysis alone',
        'Faster claims triage through automated document screening and risk flagging',
        'Reduced adjuster investigation time through pre-analyzed claim narrative summaries',
        'Improved audit trail through documented textual analysis supporting claim denial decisions',
    ],
    'Source Data': [
        'Claim narrative descriptions (free text from claimant, agent, and adjuster)',
        'Medical reports and doctor notes for personal injury claims',
        'Adjuster investigation reports and field notes',
        'Historical claim text data labeled with fraud outcomes for model training',
        'Claim document metadata (creation timing, authorship, document templates)',
    ],
    'Methodology / Analytic Technique': [
        'NLP-based sentiment and deception detection on claim narratives (vague language, excessive detail, inconsistencies)',
        'Named entity recognition for identifying key claim elements (people, places, dates, amounts)',
        'Text similarity analysis detecting templated or copied claim descriptions across different claimants',
        'Bilingual NLP processing for Urdu and English claim documents',
        'Medical terminology analysis identifying exaggerated or inconsistent injury descriptions',
    ],
    'Expected Outcome': [
        'Automated claim text analysis producing fraud risk indicators for each textual document',
        'Inconsistency detection flagging contradictions between claim narrative and structured data',
        'Template detection identifying suspiciously similar claim descriptions across different claimants',
        'Adjuster-facing report summarizing textual red flags for investigation focus',
    ],
    'Challenges': [
        'Urdu NLP capabilities less mature than English \u2014 requires custom model training for banking/insurance domain',
        'Handwritten Urdu documents require specialized OCR before NLP analysis',
        'Claim narrative style varies widely \u2014 defining "suspicious" language requires careful calibration',
        'Ensuring NLP-based flags are defensible in claim denial decisions and potential legal challenges',
    ],
    'POV Success Criteria': [
        'Text analytics identifies fraud indicators in 15%+ of claims that structured data analysis rated low-risk',
        'Template detection identifies minimum 5 clusters of suspiciously similar claim narratives',
        'Urdu NLP processing accuracy >80% for key entity extraction from claim documents',
        'Adjuster feedback confirms text analysis flags are actionable in 70%+ of cases',
    ],
}

# ─────────────────────────────────────────────────────────
# SECTION 4: INFORMATION AND CYBER SECURITY (Slides 37-41)
# ─────────────────────────────────────────────────────────

CONTENT[37] = {
    'owner': 'Information Security',
    'Objective / Problem Statement': [
        'Detect data exfiltration through network channels \u2014 unauthorized data transfers, encrypted tunnel abuse, DNS tunneling, and steganography',
        'Banking data breaches carry PKR 500M+ costs including SBP regulatory penalties, customer notification, and reputational damage',
        'SBP data classification requirements mandate DLP capabilities for all classification levels',
    ],
    'Business Benefit': [
        'Prevention of data breaches through network exfiltration \u2014 the most common APT exfiltration method',
        'Compliance with SBP data protection requirements and PCI-DSS network monitoring mandates',
        'Integration of DLP with SIEM for comprehensive security event correlation',
        'Reduced breach detection time from industry average 200+ days to <30 days',
    ],
    'Source Data': [
        'Network traffic flow data (NetFlow/sFlow) from perimeter and internal network segments',
        'DNS query logs for tunneling and covert channel detection',
        'Proxy and web gateway logs for outbound data transfer monitoring',
        'SIEM event data for security alert correlation; DLP content inspection logs',
    ],
    'Methodology / Analytic Technique': [
        'Network traffic baseline modeling with anomaly detection for unusual data volumes and destinations',
        'DNS tunneling detection through query frequency, payload size, and entropy analysis',
        'Encrypted traffic analysis using flow metadata (packet sizes, timing, destination reputation)',
        'Data volume profiling per user/system detecting unusual outbound data transfers',
        'SIEM correlation rules linking network anomalies with access events and threat intelligence',
    ],
    'Expected Outcome': [
        'Network-based DLP monitoring covering all egress points with automated alerting',
        'DNS tunneling detection capability with automated blocking for confirmed tunnels',
        'Encrypted channel analysis identifying suspicious outbound connections to unrecognized endpoints',
        'SOC dashboard integrating network DLP alerts with broader security event context',
    ],
    'Challenges': [
        'Encrypted traffic (80%+ of outbound) limits content inspection capability requiring metadata analysis',
        'High network traffic volumes (terabytes daily) require efficient analysis at wire speed',
        'Legitimate cloud service usage (O365, AWS, Google) complicates outbound data transfer monitoring',
        'False positive management for network alerts in high-traffic banking environments',
    ],
    'POV Success Criteria': [
        'Network DLP monitoring operational on all internet egress points',
        'DNS tunneling detection identifies 90%+ of test tunneling scenarios',
        'Encrypted traffic anomaly detection generates actionable alerts with <20% false positive rate',
        'Mean time to detect data exfiltration <24 hours in simulated red team scenarios',
    ],
}

CONTENT[38] = {
    'owner': 'Information Security',
    'Objective / Problem Statement': [
        'Continuous vulnerability assessment and risk-based remediation across the bank\u2019s IT infrastructure',
        'Pakistani banks operate 5,000-20,000 IT assets with hundreds of new vulnerabilities disclosed monthly',
        'PCI-DSS compliance for card data environments requires quarterly vulnerability assessments and prompt remediation',
    ],
    'Business Benefit': [
        'Reduced cyber attack surface through prioritized vulnerability remediation',
        'PCI-DSS compliance maintaining card scheme certification (Visa, Mastercard)',
        'Compliance with SBP IT Security Guidelines vulnerability management requirements',
        'Risk-based resource allocation focusing remediation on exploitable critical vulnerabilities',
    ],
    'Source Data': [
        'Vulnerability scan data (Qualys, Nessus, Rapid7) covering network, application, and database layers',
        'Asset inventory data (criticality, owner, network zone, data classification)',
        'Threat intelligence feeds (CVSS scores, exploitability, active exploitation in the wild)',
        'Patch management data (available patches, deployment status, failed deployments)',
        'Penetration test results and red team findings',
    ],
    'Methodology / Analytic Technique': [
        'Risk-based vulnerability prioritization combining CVSS score, asset criticality, and exploitability',
        'Vulnerability aging analysis tracking remediation timelines against SLA targets',
        'Attack surface analysis mapping exploitable vulnerability chains to critical assets',
        'Remediation efficiency metrics tracking patch deployment rates by team and technology',
        'Threat intelligence correlation identifying vulnerabilities being actively exploited against banking sector',
    ],
    'Expected Outcome': [
        'Risk-prioritized vulnerability remediation queue updated weekly for each technology team',
        'Vulnerability posture dashboard showing risk reduction progress over time',
        'PCI-DSS quarterly scan compliance reporting with gap identification and remediation tracking',
        'Executive risk report showing cyber risk posture for Board Risk Committee',
    ],
    'Challenges': [
        'Legacy systems that cannot be patched without business disruption (core banking, ATM network)',
        'Vulnerability scan coverage gaps in segmented network zones and cloud environments',
        'Remediation capacity constraints \u2014 IT teams balance security patches with business change delivery',
        'False positive vulnerabilities in scans requiring verification before remediation effort',
    ],
    'POV Success Criteria': [
        'Risk-based prioritization demonstrates 80%+ of remediation effort focused on critical/exploitable vulnerabilities',
        'Average remediation time for critical vulnerabilities reduced by 30%+',
        'PCI-DSS quarterly scan pass rate >95% across card data environment',
        'Vulnerability posture score improved by 20%+ over POV period',
    ],
}

CONTENT[39] = {
    'owner': 'Information Security',
    'Objective / Problem Statement': [
        'Detect compromised employee and customer credentials through dark web monitoring, credential stuffing detection, and password spray identification',
        'Banking credentials command premium prices on dark web marketplaces \u2014 PKR 5,000-50,000 per account depending on balance',
        'Credential reuse across personal and corporate accounts means a breach at any service can compromise bank access',
    ],
    'Business Benefit': [
        'Prevention of credential-based account compromise \u2014 the most common initial access vector for cyber attacks',
        'Customer protection through proactive notification of compromised credentials before exploitation',
        'Reduced successful phishing impact through early detection and forced credential rotation',
        'Compliance with SBP requirements for authentication security monitoring',
    ],
    'Source Data': [
        'Dark web monitoring feeds (credential dumps, paste sites, underground forums)',
        'Authentication logs (login success/failure patterns, source IP, timing)',
        'Identity management system data (password age, MFA enrollment, access privileges)',
        'Threat intelligence on credential-targeting campaigns against banking sector',
        'Customer email domain registration data for typo-squatting detection',
    ],
    'Methodology / Analytic Technique': [
        'Dark web credential matching against bank customer and employee identity databases',
        'Credential stuffing attack detection through login velocity, failure rates, and source IP analysis',
        'Password spray detection identifying slow-rate attacks across many accounts from distributed sources',
        'Compromised credential prioritization by account privilege level and data access scope',
        'Phishing campaign detection through authentication anomaly patterns post-phishing email delivery',
    ],
    'Expected Outcome': [
        'Automated dark web credential monitoring with immediate alert on bank credential detection',
        'Forced password reset workflow for confirmed compromised credentials',
        'Credential stuffing attack detection and automated IP blocking within 5 minutes',
        'Monthly credential risk report for CISO showing compromise trends and remediation metrics',
    ],
    'Challenges': [
        'Dark web monitoring coverage \u2014 not all credential dumps are publicly accessible',
        'Customer credential matching requires careful handling of sensitive authentication data',
        'Credential stuffing attacks increasingly use residential proxy networks evading IP-based detection',
        'Password reset fatigue \u2014 frequent forced resets degrade user experience without improving security',
    ],
    'POV Success Criteria': [
        'Dark web monitoring identifies compromised credentials for bank employees/customers within 48 hours of dump',
        'Credential stuffing attacks detected and blocked within 5 minutes of onset',
        'Password spray detection identifies slow-rate attacks with <10% false positive rate',
        'Zero successful account compromises using credentials detected in dark web monitoring feeds',
    ],
}

CONTENT[40] = {
    'owner': 'Security Operations Center',
    'Objective / Problem Statement': [
        'Deploy network traffic analysis for threat detection integrating IDS/IPS analytics, encrypted traffic analysis, and lateral movement detection',
        'SOC teams need analytics to identify advanced threats that evade signature-based detection',
        'SBP network security requirements mandate packet-level monitoring capabilities for critical banking infrastructure',
    ],
    'Business Benefit': [
        'Detection of advanced persistent threats (APTs) that bypass traditional perimeter defenses',
        'Reduced dwell time (time from breach to detection) from 200+ days to <30 days',
        'Compliance with SBP network security requirements and PCI-DSS network monitoring mandates',
        'SOC analyst productivity improvement through automated traffic analysis and alert prioritization',
    ],
    'Source Data': [
        'Network packet capture data from TAPs and SPANs at critical network segments',
        'IDS/IPS alert data (Snort, Suricata) with signature match details',
        'NetFlow/sFlow data from routers and switches for traffic pattern analysis',
        'DNS query logs and HTTP/HTTPS metadata; Threat intelligence feeds (IOCs, TTPs)',
    ],
    'Methodology / Analytic Technique': [
        'Network traffic baseline modeling with anomaly detection for unusual communication patterns',
        'Lateral movement detection through internal traffic analysis (east-west traffic anomalies)',
        'Encrypted traffic analysis using JA3/JA3S fingerprinting and flow metadata analysis',
        'Beaconing detection identifying command-and-control communication patterns',
        'Protocol anomaly detection for covert channels and tunneling within legitimate protocols',
    ],
    'Expected Outcome': [
        'Network threat detection platform providing real-time visibility across all network segments',
        'Lateral movement alerts identifying potential breach propagation within internal network',
        'C2 beacon detection for early identification of compromised endpoints',
        'SOC integration dashboard correlating network indicators with endpoint and application events',
    ],
    'Challenges': [
        'Packet capture volume at banking network speeds requires significant storage and processing',
        'Encrypted traffic (TLS 1.3) limits deep packet inspection capability',
        'Network segmentation in banking creates blind spots between security zones',
        'Alert volume from network monitoring requires sophisticated correlation to reduce noise',
    ],
    'POV Success Criteria': [
        'Network monitoring covers 80%+ of critical network segments including DMZ and server zones',
        'Lateral movement detection identifies test scenarios within 30 minutes',
        'C2 beaconing detection rate >90% for known C2 framework signatures',
        'SOC analyst investigation time reduced by 40% through automated network context enrichment',
    ],
}

CONTENT[41] = {
    'owner': 'CISO Office',
    'Objective / Problem Statement': [
        'Build comprehensive cybersecurity analytics program integrating SIEM, threat hunting, incident response, and threat intelligence capabilities',
        'Pakistan\u2019s banking sector faces increasing cyber threats including state-sponsored attacks, ransomware, and supply chain compromise',
        'SBP IT Security Guidelines mandate security operations and analytics capabilities for all scheduled banks',
    ],
    'Business Benefit': [
        'Unified security visibility across all IT assets, applications, and network infrastructure',
        'Reduced mean time to detect (MTTD) and respond (MTTR) to cyber incidents',
        'Compliance with SBP IT Security Guidelines, PCI-DSS, and SWIFT CSP requirements',
        'Proactive threat hunting identifying advanced threats before they cause damage or data breach',
    ],
    'Source Data': [
        'SIEM event data aggregated from 50+ security and infrastructure sources',
        'Endpoint detection and response (EDR) telemetry from workstations and servers',
        'Cloud security logs (if applicable) from Azure/AWS/GCP deployments',
        'Threat intelligence feeds (commercial, CERT, sector-specific ISAC, SBP advisories)',
        'Vulnerability scan data and penetration test findings',
    ],
    'Methodology / Analytic Technique': [
        'SIEM correlation rules mapped to MITRE ATT&CK framework for comprehensive threat coverage',
        'Threat hunting playbooks based on banking-sector TTPs (tactics, techniques, procedures)',
        'Incident response automation (SOAR) for common incident types reducing manual response steps',
        'Threat intelligence platform (TIP) integrating multiple feeds with automated IOC matching',
        'Security metrics and KPI dashboard for CISO and Board Risk Committee reporting',
    ],
    'Expected Outcome': [
        'Operational SOC with 24/7 monitoring, detection, and response capability',
        'MITRE ATT&CK coverage assessment showing detection capability across threat techniques',
        'Automated incident response for common scenarios (phishing, malware, account compromise)',
        'Monthly cyber threat intelligence report contextualizing global threats to Pakistan banking',
    ],
    'Challenges': [
        'SIEM deployment across diverse banking IT environment (legacy + modern + cloud)',
        'Skilled SOC analyst shortage in Pakistan\u2019s cybersecurity talent market',
        'Alert volume management \u2014 typical banking SIEM generates 10,000+ events/day requiring triage',
        'Keeping threat detection current as attacker TTPs evolve faster than detection rules',
    ],
    'POV Success Criteria': [
        'SIEM operational with 50+ log sources integrated and MITRE ATT&CK coverage >60%',
        'Mean time to detect (MTTD) <4 hours for simulated attack scenarios',
        'Incident response automation handles 50%+ of common incident types without manual intervention',
        'SBP IT Security audit confirms cybersecurity analytics meets guideline requirements',
    ],
}


# ─────────────────────────────────────────────────────────
# UPDATE ENGINE (same as risk slides script)
# ─────────────────────────────────────────────────────────

def find_shape_by_header(root, header_text, ns):
    for sp in root.findall('.//p:sp', ns):
        txBody = sp.find('.//p:txBody', ns)
        if txBody is None:
            continue
        for t in txBody.findall('.//a:t', ns):
            if t.text and header_text in t.text:
                return sp, txBody
    return None, None


def find_bullet_paragraph(txBody, ns):
    paras = txBody.findall('a:p', ns)
    for i, p in enumerate(paras):
        for t in p.findall('.//a:t', ns):
            if t.text and 'Point 1' in t.text:
                return i, p
    return None, None


def create_bullet_paragraph(template_para, text, ns):
    new_para = copy.deepcopy(template_para)
    for r in new_para.findall('a:r', ns):
        t_elem = r.find('a:t', ns)
        if t_elem is not None:
            t_elem.text = text
            return new_para
    return new_para


def update_owner_field(root, owner_text, ns):
    for sp in root.findall('.//p:sp', ns):
        txBody = sp.find('.//p:txBody', ns)
        if txBody is None:
            continue
        for t in txBody.findall('.//a:t', ns):
            if t.text and 'Owner:' in t.text:
                t.text = f'Owner:   {owner_text}'
                return True
    return False


def update_slide(slide_num, content):
    filepath = xml_file(slide_num)
    if not os.path.exists(filepath):
        print(f'  ERROR: {filepath} not found!')
        return False

    tree = ET.parse(filepath)
    root = tree.getroot()

    if 'owner' in content:
        if update_owner_field(root, content['owner'], NS):
            pass  # silently succeed
        else:
            print(f'  WARNING: Could not find Owner field')

    fields_updated = 0
    for field_name, bullets in content.items():
        if field_name == 'owner':
            continue

        sp, txBody = find_shape_by_header(root, field_name, NS)
        if txBody is None:
            print(f'  WARNING: Could not find "{field_name}"')
            continue

        bullet_idx, bullet_para = find_bullet_paragraph(txBody, NS)
        if bullet_para is None:
            print(f'  WARNING: No "Point 1" in "{field_name}"')
            continue

        paras = list(txBody.findall('a:p', NS))
        new_bullet_paras = [create_bullet_paragraph(bullet_para, t, NS) for t in bullets]

        for p in paras[bullet_idx:]:
            txBody.remove(p)
        for new_para in new_bullet_paras:
            txBody.append(new_para)

        fields_updated += 1

    tree.write(filepath, xml_declaration=True, encoding='UTF-8')
    return fields_updated


def main():
    print("=" * 60)
    print("Updating Security & Fraud Use Cases — 40 slides")
    print("=" * 60)

    success = 0
    fail = 0

    for slide_num in sorted(CONTENT.keys()):
        fields = update_slide(slide_num, CONTENT[slide_num])
        if fields and fields > 0:
            print(f'Slide {slide_num:2d} (slide{533+slide_num}.xml): {fields} fields updated')
            success += 1
        else:
            print(f'Slide {slide_num:2d}: FAILED')
            fail += 1

    print(f'\n{"=" * 60}')
    print(f'Results: {success} slides OK, {fail} failed')
    print(f'{"=" * 60}')


if __name__ == '__main__':
    main()
