#!/usr/bin/env python3
"""Generate enrichment.json for TAIW — Pakistan trade context per capability."""
import json, os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Load all 100 capability IDs from capabilities.json
# ---------------------------------------------------------------------------
with open(os.path.join(OUTPUT_DIR, 'capabilities.json'), 'r') as f:
    capabilities = json.load(f)

cap_lookup = {c['id']: c for c in capabilities}

# ---------------------------------------------------------------------------
# 12 DETAILED enrichment entries
# ---------------------------------------------------------------------------
DETAILED = {
    # 1. declared_value_verification (1.1)
    "declared_value_verification": {
        "pakistanObjectives": [
            "Detect under-invoicing in imports through statistical and mirror-data analysis, targeting the $4.5B valuation gap with China",
            "Implement WTO Customs Valuation Agreement methods with FBR DG Valuation reference price database integration",
            "Build real-time declared value vs reference price comparison engine for high-risk commodities",
            "Achieve PKR 20-40B annual additional revenue recovery through improved valuation enforcement",
            "Strengthen customs-to-customs data exchange for transaction value verification with top 10 trading partners"
        ],
        "pakistanDataSources": [
            "WeBOC Goods Declaration value fields (FOB, CIF, insurance, freight)",
            "FBR DG Valuation reference prices and valuation rulings database",
            "Partner country mirror data (UN Comtrade, China Customs GACC)",
            "SBP foreign exchange remittance records for import payments",
            "FBR income tax and sales tax cross-referenced trader financials"
        ],
        "expectedOutcomes": [
            "PKR 20-40B annual revenue recovery from under-invoicing detection",
            "50% reduction in valuation disputes through evidence-based assessments",
            "Automated flagging of declarations deviating >15% from reference prices",
            "Real-time mirror data dashboard comparing Pakistan import values vs partner export values"
        ],
        "keyChallenges": [
            "Limited real-time access to partner country export data; mirror data typically 6-12 months delayed",
            "DG Valuation reference price database not fully digitized and lacks API access",
            "Resistance from trading community to enhanced valuation scrutiny affecting clearance times",
            "China trade data gap of $4.5B requires bilateral cooperation mechanisms"
        ],
        "wcoElements": [
            "Goods Declaration",
            "Customs Value Declaration",
            "Goods Item Value Amount",
            "Invoice",
            "Valuation Method Code",
            "Exchange Rate"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 40-80M",
        "priority": "CRITICAL"
    },
    # 2. hs_code_classification_engine (1.2)
    "hs_code_classification_engine": {
        "pakistanObjectives": [
            "Automate PCT (Pakistan Customs Tariff) alignment with HS2022 across 7,400+ national tariff lines",
            "Deploy NLP-assisted classification engine to detect misclassification and tariff evasion patterns",
            "Reduce classification disputes by providing binding tariff information within 48 hours",
            "Integrate SRO concession eligibility verification into the classification workflow",
            "Address revenue leakage from systematic misclassification across high-risk HS chapters"
        ],
        "pakistanDataSources": [
            "Pakistan Customs Tariff (PCT) — 7,400+ national tariff lines with duty rates",
            "WCO HS Nomenclature 2022 with Explanatory Notes",
            "Historical WeBOC classification data (5+ years of HS code usage patterns)",
            "FBR advance ruling decisions and classification opinions database",
            "WCO Classification Opinion database and HS Committee decisions"
        ],
        "expectedOutcomes": [
            "95% automated classification accuracy for routine commodity descriptions",
            "70% reduction in classification-related clearance delays",
            "Identification of PKR 5-10B annual revenue leakage from systematic misclassification",
            "Real-time misclassification alert system for high-risk HS chapters (27, 72, 84, 85)"
        ],
        "keyChallenges": [
            "PCT national subdivisions not always cleanly mappable to HS international codes",
            "Limited digitization of historical classification rulings and advance ruling decisions",
            "Frequent SRO changes affecting tariff rates require constant model retraining",
            "Commodity description quality in WeBOC declarations varies significantly"
        ],
        "wcoElements": [
            "Goods Item Commodity Code",
            "Customs Tariff Code",
            "Harmonized System Sub-heading Code",
            "Goods Description",
            "Additional Commodity Code"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 30-60M",
        "priority": "CRITICAL"
    },
    # 3. revenue_dashboarding (1.3)
    "revenue_dashboarding": {
        "pakistanObjectives": [
            "Provide real-time tracking of PKR ~1,100B annual customs revenue target (FY25) across all collectorates",
            "Break down daily collections by duty type: CD, RD, ST, WHT, FED with monthly trends",
            "Enable collectorate-level performance comparison against assigned revenue targets",
            "Integrate budget vs actual tracking with variance analysis and forecasting",
            "Support FBR Member Customs and Chairman with executive dashboards for policy impact analysis"
        ],
        "pakistanDataSources": [
            "WeBOC duty assessment and payment records (all 16 GD types)",
            "FBR ITAS (Inland Revenue) cross-reference for WHT and ST reconciliation",
            "SBP treasury receipts and e-payment confirmation data",
            "FBR budget allocation documents and collectorate-wise targets",
            "SRO concession utilization data and revenue forgone estimates"
        ],
        "expectedOutcomes": [
            "Real-time revenue dashboard refreshed every 15 minutes during working hours",
            "Automated daily collectorate performance reports eliminating manual compilation",
            "Early warning system for revenue shortfalls enabling mid-course policy corrections",
            "PKR 15-25B additional revenue identification through duty type leakage analysis"
        ],
        "keyChallenges": [
            "Multiple payment channels (e-payment, treasury challan, bank scroll) require reconciliation",
            "Collectorate-level data silos with inconsistent reporting formats",
            "Real-time data pipeline from WeBOC to analytics platform requires infrastructure investment",
            "CD/RD/ST/WHT/FED breakdown requires cross-system integration"
        ],
        "wcoElements": [
            "Duty Tax Fee Amount",
            "Duty Tax Fee Type Code",
            "Payment Amount",
            "Customs Office Code",
            "Assessment Notice"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 20-40M",
        "priority": "CRITICAL"
    },
    # 4. risk_profiling_engine (2.1)
    "risk_profiling_engine": {
        "pakistanObjectives": [
            "Enhance WeBOC selectivity with ML-based risk scoring replacing static green/yellow/red channel assignment",
            "Integrate NTC (National Targeting Centre) intelligence feeds into automated risk profiling",
            "Achieve 40%+ reduction in false positive selectivity rates while maintaining detection effectiveness",
            "Build multi-dimensional trader risk scoring combining trade, tax, origin, value, and route factors",
            "Enable dynamic risk threshold adjustment based on seasonal patterns and intelligence alerts"
        ],
        "pakistanDataSources": [
            "WeBOC selectivity module — current channel assignment rules and outcomes",
            "NTC intelligence reports and suspect trader/entity watchlists",
            "Historical examination outcomes (hit rates by risk rule, officer, collectorate)",
            "FBR cross-tax compliance data (income tax returns, sales tax filings)",
            "ANF, Maritime Security Agency, and law enforcement intelligence feeds"
        ],
        "expectedOutcomes": [
            "40%+ reduction in false positive rate (currently ~60% of red channel shipments yield no finding)",
            "Increase green channel throughput from 30% to 50% without compromising detection",
            "Risk score explainability reports for each flagged consignment supporting officer decisions",
            "Unified risk dashboard for NTC analysts with drill-down to individual GD level"
        ],
        "keyChallenges": [
            "Current WeBOC selectivity module has limited API extensibility for ML model integration",
            "Institutional resistance to reducing red channel percentage despite high false positive rates",
            "Intelligence data from law enforcement agencies not structured for automated ingestion",
            "40%+ false positive rate reduction requires extensive historical training data"
        ],
        "wcoElements": [
            "Risk Assessment",
            "Selectivity Criteria",
            "Examination Results",
            "Customs Office Code",
            "Declaration Type Code",
            "Risk Score"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 50-100M",
        "priority": "CRITICAL"
    },
    # 5. afghan_transit_trade_monitoring (2.2)
    "afghan_transit_trade_monitoring": {
        "pakistanObjectives": [
            "Deploy end-to-end ATTA cargo tracking from port to Torkham/Chaman border crossings",
            "Detect transit trade diversion into Pakistan domestic market causing PKR 100B+ annual revenue leakage",
            "Implement GPS tracking and biometric verification for transit vehicle operators",
            "Build predictive models for diversion-prone commodities (electronics, tyres, lubricants, tea)",
            "Enable real-time reconciliation of port exit records with border crossing entry confirmations"
        ],
        "pakistanDataSources": [
            "WeBOC transit GDs (TR type) with cargo manifest and vehicle details",
            "Torkham and Chaman border crossing records and exit confirmation logs",
            "GPS tracking data from transit vehicle transponders (where operational)",
            "Afghan Customs ASYCUDA++ import confirmation data (limited availability)",
            "Biometric verification records for transit vehicle operators"
        ],
        "expectedOutcomes": [
            "80% reduction in unverified transit cargo (currently ~25% of transit GDs lack exit confirmation)",
            "PKR 30-50B annual revenue recovery from identified diversion cases",
            "Average transit monitoring turnaround reduced from 45 days to real-time",
            "Automated alerts for transit vehicles deviating from prescribed routes"
        ],
        "keyChallenges": [
            "Afghan customs data sharing is intermittent and lacks electronic integration",
            "GPS tracking infrastructure coverage gaps on Balochistan transit routes",
            "Political sensitivity of transit trade enforcement affecting operational decisions",
            "PKR 100B+ loss estimation requires systematic diversion quantification methodology"
        ],
        "wcoElements": [
            "Transit Declaration",
            "Transport Equipment Identification",
            "Seal Number",
            "Customs Office of Transit",
            "Goods Location"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 30-60M",
        "priority": "CRITICAL"
    },
    # 6. clearance_time_analytics (3.1)
    "clearance_time_analytics": {
        "pakistanObjectives": [
            "Measure and report WTO TFA Article 7 compliant Time Release Study (TRS) clearance metrics across all ports",
            "Achieve 24-48hr average clearance target vs current 5-7 days for standard shipments",
            "Identify process bottlenecks across the clearance chain (assessment, examination, payment, release)",
            "Support PSW integration monitoring to measure single window impact on clearance times",
            "Enable green channel STP (Straight Through Processing) for compliant traders"
        ],
        "pakistanDataSources": [
            "WeBOC timestamp data — GD filing, assessment, examination, payment, release events",
            "PSW (Pakistan Single Window) event logs for inter-agency clearance steps",
            "Port terminal system timestamps for gate-in, gate-out, vessel berthing events",
            "Historical TRS study results (2018, 2020, 2022 studies)",
            "WTO TFA notification data and Pakistan's Category A/B/C commitments"
        ],
        "expectedOutcomes": [
            "Real-time clearance time dashboard with percentile distributions by port, channel, and commodity",
            "24-48hr green channel clearance achievement rate improving from 65% to 90%",
            "Automated bottleneck identification reducing average red channel clearance from 7 to 4 days",
            "Quarterly WTO TFA TRS-compliant reports generated automatically"
        ],
        "keyChallenges": [
            "Incomplete timestamp capture in WeBOC for all clearance process steps",
            "Current 5-7 days average clearance far exceeds WTO TFA benchmarks",
            "Inter-agency clearance steps (DRAP, PSQCA, AQIS) not fully integrated into PSW",
            "Varying definitions of 'clearance time' across collectorates creating comparison challenges"
        ],
        "wcoElements": [
            "Declaration Acceptance Date Time",
            "Goods Release Date Time",
            "Customs Office Code",
            "Channel Selection Code",
            "Examination Date Time"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 15-30M",
        "priority": "CRITICAL"
    },
    # 7. port_throughput_analytics (3.2)
    "port_throughput_analytics": {
        "pakistanObjectives": [
            "Monitor and benchmark throughput: Karachi 60%, Port Qasim 35%, Gwadar <1% of sea trade",
            "Analyze terminal-level performance (KICT, PICT, QICT, PIBT, FOTCO) for container handling efficiency",
            "Track container dwell time and terminal performance against international benchmarks",
            "Enable predictive congestion forecasting for proactive vessel and berth scheduling",
            "Support Gwadar port operationalization monitoring against CPEC Phase-II targets"
        ],
        "pakistanDataSources": [
            "KPT and Port Qasim Authority operational data (vessel movements, berth utilization)",
            "Terminal operator reports (KICT-Hutchison, PICT-ICTSI, QICT-DP World, PIBT, FOTCO)",
            "WeBOC port-wise GD volumes and container counts",
            "Gwadar Port Authority traffic data and free zone activity reports",
            "Pakistan Shipping Corporation vessel schedule and cargo manifest data"
        ],
        "expectedOutcomes": [
            "Unified port performance dashboard comparing all 3 seaports on 15+ KPIs",
            "Terminal benchmarking reports with international comparison (Singapore, Dubai, Colombo)",
            "Predictive congestion model with 72-hour advance warning for berth allocation",
            "CPEC cargo volume tracking and Gwadar utilization monitoring against targets"
        ],
        "keyChallenges": [
            "Terminal operators treat operational data as commercially sensitive — limited sharing",
            "No standardized port performance reporting framework across Pakistani ports",
            "Gwadar port data extremely limited due to low operational volume (<1%)",
            "Container dwell time data requires integration across multiple terminal systems"
        ],
        "wcoElements": [
            "Transport Means Identity",
            "Arrival Transport Means",
            "Port of Loading Code",
            "Port of Discharge Code",
            "Cargo Manifest",
            "Container Identification"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 20-40M",
        "priority": "CRITICAL"
    },
    # 8. trade_balance_dashboard (4.1)
    "trade_balance_dashboard": {
        "pakistanObjectives": [
            "Provide real-time monitoring of trade deficit: $32B exports vs $58B imports ($26B deficit)",
            "Track textile export dependency (54% of total exports) against diversification targets",
            "Monitor petroleum import dependency ($11.7B) and China concentration ($19.6B) for policy alerts",
            "Support Ministry of Commerce with partner analytics and export promotion data intelligence",
            "Enable FTA utilization analysis measuring preferential trade agreement impact on trade flows"
        ],
        "pakistanDataSources": [
            "PBS (Pakistan Bureau of Statistics) monthly trade statistics",
            "WeBOC export and import GD data aggregated by HS chapter, country, and port",
            "SBP balance of payments and foreign exchange reserve data",
            "UN Comtrade international trade statistics for mirror data comparison",
            "TDAP (Trade Development Authority of Pakistan) export facilitation data"
        ],
        "expectedOutcomes": [
            "Monthly trade balance dashboard published within 5 days of month-end (currently 45+ days)",
            "Export growth tracking against $35B target with commodity-wise contribution analysis",
            "Automated trade policy impact assessment for tariff changes and FTA negotiations",
            "Partner-wise trade concentration index monitoring with diversification recommendations"
        ],
        "keyChallenges": [
            "PBS publication lag of 45-60 days makes real-time monitoring impossible without WeBOC proxy",
            "Discrepancy between WeBOC-based estimates and final PBS statistics (~5-8% variance)",
            "Export data quality issues particularly for services trade and informal cross-border trade",
            "Textile dependency at 54% creates concentration risk for export earnings"
        ],
        "wcoElements": [
            "Export Declaration",
            "Goods Item Statistical Value",
            "Country of Destination Code",
            "Country of Origin Code",
            "Goods Item Commodity Code"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 15-30M",
        "priority": "CRITICAL"
    },
    # 9. trader_360_profile (5.1)
    "trader_360_profile": {
        "pakistanObjectives": [
            "Build comprehensive profiles for 50,000+ WeBOC-registered traders with NTN-based identity linkage",
            "Implement compliance scoring algorithm combining trade, tax, and regulatory data for each trader",
            "Enable related party detection and trader network analysis for risk assessment",
            "Support AEO program targeting by identifying high-potential compliant traders for enrollment",
            "Provide customs officers with one-click trader dossier during assessment and examination"
        ],
        "pakistanDataSources": [
            "WeBOC trader registration database and historical GD filing records",
            "FBR NTN (National Tax Number) master file with tax compliance status",
            "SECP company registration and directorship data for corporate traders",
            "Banking and financial data from SBP for trade finance verification",
            "Historical examination outcomes, penalties, and adjudication records per trader"
        ],
        "expectedOutcomes": [
            "360-degree trader profiles available for all 50,000+ active WeBOC users",
            "Automated compliance score updated monthly with transparent scoring methodology",
            "Trader segmentation into 5 risk tiers enabling differentiated facilitation strategies",
            "50% reduction in trader verification time during GD assessment process"
        ],
        "keyChallenges": [
            "NTN-based identity linkage incomplete — many traders use multiple NTNs or share NTNs",
            "Cross-database integration between WeBOC, ITAS, SECP requires complex ETL pipelines",
            "Data privacy and trader confidentiality concerns under Pakistan data protection framework",
            "Related party detection requires sophisticated network analysis algorithms"
        ],
        "wcoElements": [
            "Declarant Identification",
            "Importer Identification",
            "Exporter Identification",
            "Agent Identification",
            "Tax Identification Number",
            "Trader Status Code"
        ],
        "implementationPhase": 1,
        "investmentRange": "PKR 25-50M",
        "priority": "CRITICAL"
    },
    # 10. aeo_application_pipeline (5.2)
    "aeo_application_pipeline": {
        "pakistanObjectives": [
            "Scale Pakistan's AEO program from <50 certified operators to target 500+ within 3 years",
            "Streamline application tracking and processing from 6+ months average to 90-day target",
            "Implement Gold/Silver tier management framework with differentiated benefit packages",
            "Build MRA readiness with China, Turkey, and Korea AEO programs for mutual recognition",
            "Create AEO outreach dashboard identifying 5,000+ potential candidates from compliant trader pool"
        ],
        "pakistanDataSources": [
            "FBR AEO program application and certification records",
            "WeBOC trader compliance history for AEO eligibility assessment",
            "International AEO databases (WCO CENcomm, CTPAT, EU AEO) for MRA alignment",
            "Trader financial statements and audit reports submitted for AEO validation",
            "Benefit measurement data tracking facilitation outcomes for certified AEOs"
        ],
        "expectedOutcomes": [
            "AEO application pipeline dashboard with stage-wise tracking and SLA monitoring",
            "Automated pre-screening of trader eligibility reducing manual assessment workload by 60%",
            "Gold/Silver tier distribution analytics with benefit utilization tracking",
            "Quarterly AEO program growth report with sector-wise and region-wise analysis"
        ],
        "keyChallenges": [
            "Limited institutional capacity in AEO wing — fewer than 10 dedicated officers",
            "Traders perceive AEO benefits as insufficient compared to compliance costs",
            "MRA negotiations require standardized data exchange formats not yet implemented",
            "<50 AEOs vs 5,000+ potential indicates massive adoption gap"
        ],
        "wcoElements": [
            "Authorized Economic Operator Code",
            "Trader Status Code",
            "Compliance Assessment",
            "Certification Date",
            "Mutual Recognition Status"
        ],
        "implementationPhase": 2,
        "investmentRange": "PKR 15-30M",
        "priority": "CRITICAL"
    },
    # 11. wco_dm_conformity_assessment (6.2)
    "wco_dm_conformity_assessment": {
        "pakistanObjectives": [
            "Assess Pakistan's current WCO Data Model conformity — Pakistan has no published MIP",
            "Map WeBOC data elements to WCO DM v4.2 identifying gaps and alignment opportunities",
            "Develop Member Implementation Plan (MIP) for WCO submission",
            "Perform WCO DM v4.2 gap analysis with element coverage scoring across all information packages",
            "Support PSW data harmonization effort by providing WCO DM-aligned data dictionary"
        ],
        "pakistanDataSources": [
            "WeBOC database schema and data element dictionary",
            "WCO Data Model v4.2 specification and implementation guidelines",
            "PSW data element catalogue and mapping documentation",
            "Regional WCO DM implementation benchmarks (Korea, Japan, Australia MIPs)",
            "Pakistan Customs Act and SRO data requirement specifications"
        ],
        "expectedOutcomes": [
            "Complete WeBOC-to-WCO DM element mapping covering all 800+ WCO data elements",
            "Gap analysis report identifying missing, partial, and fully-aligned elements",
            "Draft MIP document ready for WCO submission within 12 months",
            "Conformity score dashboard tracking progress toward full WCO DM alignment"
        ],
        "keyChallenges": [
            "Pakistan has no published MIP — starting from baseline assessment",
            "WeBOC was designed before WCO DM v3 — fundamental schema differences exist",
            "No dedicated data governance team within FBR Customs for DM conformity work",
            "PSW parallel development may create conflicting data standards without coordination"
        ],
        "wcoElements": [
            "WCO Data Model Information Package",
            "Data Element",
            "Business Process Model",
            "Code List",
            "Class Diagram",
            "Cross Border Regulatory Agency"
        ],
        "implementationPhase": 2,
        "investmentRange": "PKR 10-20M",
        "priority": "CRITICAL"
    },
    # 12. trade_data_reconciliation (4.1)
    "trade_data_reconciliation": {
        "pakistanObjectives": [
            "Close the $6.5B data gap arising from only 7 of 16 GD types being included in PBS trade statistics",
            "Reconcile WeBOC transaction-level data with PBS published statistics to identify systemic discrepancies",
            "Implement mirror statistics comparison with top 10 trading partners to detect bilateral data anomalies",
            "Standardize trade statistics compilation methodology across all 16 GD types",
            "Support PBS statistics alignment with UN IMTS 2010 guidelines for international merchandise trade statistics"
        ],
        "pakistanDataSources": [
            "WeBOC transaction data across all 16 GD types (HC, WH, EX, TR, TS, IB, EB, TA, EFS, TI, RI, RE, SS, BD, ST, PB)",
            "PBS published monthly trade statistics and methodology documentation",
            "UN Comtrade mirror data for bilateral trade flow comparison",
            "SBP balance of payments trade data for cross-validation",
            "IMF DOTS (Direction of Trade Statistics) for additional reconciliation"
        ],
        "expectedOutcomes": [
            "Complete reconciliation framework covering all 16 GD types with adjustment methodology",
            "Monthly reconciliation report quantifying WeBOC vs PBS vs mirror data discrepancies",
            "Identification and resolution of $6.5B statistical gap with documented adjustment factors",
            "Automated mirror data anomaly detection for top 20 trading partners"
        ],
        "keyChallenges": [
            "PBS and FBR use different commodity classification and valuation methodologies",
            "9 GD types excluded from statistics lack standardized valuation for statistical inclusion",
            "$6.5B data gap discovery (7 of 16 GD types) requires systematic correction methodology",
            "Mirror statistics comparison complicated by re-exports, transit trade, and timing differences"
        ],
        "wcoElements": [
            "Statistical Value",
            "Declaration Type Code",
            "Goods Item Commodity Code",
            "Country of Origin Code",
            "Country of Destination Code"
        ],
        "implementationPhase": 2,
        "investmentRange": "PKR 20-40M",
        "priority": "CRITICAL"
    },
}

# ---------------------------------------------------------------------------
# WCO element pool for assigning to placeholder capabilities by theme
# ---------------------------------------------------------------------------
WCO_ELEMENTS_BY_THEME = {
    "Revenue & Duty Management": [
        "Duty Tax Fee Amount", "Duty Tax Fee Type Code", "Customs Value Declaration",
        "Goods Item Value Amount", "Payment Amount", "Customs Tariff Code",
        "Exchange Rate", "Valuation Method Code"
    ],
    "Risk Management & Compliance": [
        "Risk Assessment", "Selectivity Criteria", "Examination Results",
        "Declaration Type Code", "Seal Number", "Inspection Report",
        "Offence Report", "Penalty Decision"
    ],
    "Trade Facilitation & Operations": [
        "Declaration Acceptance Date Time", "Goods Release Date Time",
        "Channel Selection Code", "Customs Office Code",
        "Transport Equipment Identification", "Goods Location",
        "Transit Declaration", "Cargo Manifest"
    ],
    "Trade Intelligence & Analytics": [
        "Statistical Value", "Country of Origin Code", "Country of Destination Code",
        "Goods Item Commodity Code", "Export Declaration",
        "Transport Means Identity", "Consignment Weight", "Package Quantity"
    ],
    "Trader & Stakeholder Management": [
        "Declarant Identification", "Importer Identification",
        "Exporter Identification", "Agent Identification",
        "Tax Identification Number", "Trader Status Code",
        "Authorized Economic Operator Code", "Compliance Assessment"
    ],
    "Digital Customs & Modernization": [
        "Data Element", "WCO Data Model Information Package",
        "Code List", "Business Process Model",
        "Cross Border Regulatory Agency", "Class Diagram",
        "Electronic Document", "Digital Signature"
    ],
}

# Priority mapping by theme index
THEME_PRIORITY = {
    1: "HIGH",   # Revenue & Duty Management
    2: "HIGH",   # Risk Management & Compliance
    3: "MEDIUM", # Trade Facilitation & Operations
    4: "MEDIUM", # Trade Intelligence & Analytics
    5: "MEDIUM", # Trader & Stakeholder Management
    6: "MEDIUM", # Digital Customs & Modernization
}


def make_placeholder(cap_id, cap_info):
    """Generate placeholder enrichment for non-detailed capabilities."""
    cap_name = cap_info['sub']
    theme = cap_info['theme']
    theme_index = cap_info['themeIndex']

    # Pick 2-3 WCO elements based on theme
    pool = WCO_ELEMENTS_BY_THEME.get(theme, ["Data Element", "Goods Declaration", "Customs Office Code"])
    # Use a deterministic selection based on cap_id hash
    h = hash(cap_id)
    idx1 = abs(h) % len(pool)
    idx2 = abs(h + 1) % len(pool)
    idx3 = abs(h + 2) % len(pool)
    selected = list(dict.fromkeys([pool[idx1], pool[idx2], pool[idx3]]))  # deduplicated, ordered
    if len(selected) < 2:
        selected.append(pool[(idx3 + 3) % len(pool)])

    # Determine priority based on theme index
    priority = THEME_PRIORITY.get(theme_index, "MEDIUM")

    # Implementation phase: Theme 1-2 get phase 2, Theme 3-6 get phase 3
    phase = 2 if theme_index <= 2 else 3

    # Build area name from capability name
    area = cap_name.lower().replace("&", "and").strip()

    return {
        "pakistanObjectives": [
            f"Enhance {cap_name} for Pakistan customs modernization"
        ],
        "pakistanDataSources": [
            "WeBOC transaction data",
            "FBR operational databases"
        ],
        "expectedOutcomes": [
            f"Improved efficiency in {area}",
            "Better data-driven decision making"
        ],
        "keyChallenges": [
            "Legacy system integration",
            "Data quality gaps"
        ],
        "wcoElements": selected,
        "implementationPhase": phase,
        "investmentRange": "PKR 10-30M",
        "priority": priority,
    }


# ---------------------------------------------------------------------------
# Build output
# ---------------------------------------------------------------------------
enrichment_map = {}

detailed_count = 0
placeholder_count = 0

for cap in capabilities:
    cap_id = cap['id']
    if cap_id in DETAILED:
        enrichment_map[cap_id] = DETAILED[cap_id]
        detailed_count += 1
    else:
        enrichment_map[cap_id] = make_placeholder(cap_id, cap)
        placeholder_count += 1

output = {
    "capabilities": enrichment_map,
    "metadata": {
        "capabilitiesEnriched": detailed_count,
        "totalCapabilities": detailed_count + placeholder_count,
        "note": f"{detailed_count} capabilities have detailed Pakistan context. Remaining {placeholder_count} have placeholder enrichment."
    }
}

with open(os.path.join(OUTPUT_DIR, 'enrichment.json'), 'w') as f:
    json.dump(output, f, indent=2)

print(f"enrichment.json: {detailed_count + placeholder_count} capabilities ({detailed_count} detailed, {placeholder_count} placeholder)")
