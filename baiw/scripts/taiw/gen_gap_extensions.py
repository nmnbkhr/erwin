#!/usr/bin/env python3
"""
gen_gap_extensions.py - Generate gapExtensions.json

Creates 5 gap extension modules with 5 tables each (25 total) covering
Pakistan-specific customs analytics domains that extend the WCO DM star schema:

  1. AEO Analytics         - AEO programme management for FBR/Pakistan Customs
  2. Rules of Origin & FTA - CPFTA-II, SAFTA, GSP+, D-8 PTA coverage
  3. Valuation Intelligence - DG Valuation, WTO methods, under-invoicing detection
  4. Risk Scoring Engine   - NTC targeting, green/yellow/red channel selectivity
  5. E-Commerce & De Minimis - Courier, postal, online marketplace clearance

Each table has 8-12 columns with proper datatypes, descriptions, and
pakSpecific flags where relevant.
"""

import json
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')


# ── Module 1: AEO Analytics ─────────────────────────────────────────────────
AEO_MODULE = {
    "name": "AEO Analytics",
    "id": "aeo",
    "tables": [
        {
            "name": "AEO_APPLICATION",
            "columns": [
                {"name": "application_id", "datatype": "INT", "description": "Application tracking ID"},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN (National Tax Number)", "pakSpecific": True},
                {"name": "trader_name", "datatype": "VARCHAR(200)", "description": "Legal name of applying trader"},
                {"name": "aeo_tier_requested", "datatype": "VARCHAR(10)", "description": "Tier applied for (Tier-I, Tier-II, Tier-III)", "pakSpecific": True},
                {"name": "application_date", "datatype": "DATE", "description": "Date application was submitted"},
                {"name": "current_status", "datatype": "VARCHAR(30)", "description": "Pipeline status (Submitted, Under Review, Site Visit, Approved, Rejected)"},
                {"name": "assigned_officer", "datatype": "VARCHAR(100)", "description": "FBR officer assigned for evaluation", "pakSpecific": True},
                {"name": "weboc_reg_number", "datatype": "VARCHAR(30)", "description": "WeBOC registration number of trader", "pakSpecific": True},
                {"name": "annual_import_value_usd", "datatype": "DECIMAL(15,2)", "description": "Annual import volume used for tier qualification"},
                {"name": "compliance_score", "datatype": "DECIMAL(5,2)", "description": "Pre-application compliance score (0-100)"},
                {"name": "decision_date", "datatype": "DATE", "description": "Date final decision was issued"},
                {"name": "rejection_reason", "datatype": "VARCHAR(500)", "description": "Reason text if application was rejected"},
            ],
            "description": "Track AEO applications through the approval pipeline"
        },
        {
            "name": "AEO_AUDIT_TRAIL",
            "columns": [
                {"name": "audit_id", "datatype": "INT", "description": "Audit trail record ID"},
                {"name": "application_id", "datatype": "INT", "description": "FK to AEO_APPLICATION"},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN", "pakSpecific": True},
                {"name": "audit_type", "datatype": "VARCHAR(30)", "description": "Type: Initial, Periodic, Triggered, Revalidation"},
                {"name": "audit_date", "datatype": "DATE", "description": "Date audit was conducted"},
                {"name": "auditor_code", "datatype": "VARCHAR(20)", "description": "FBR auditor employee code", "pakSpecific": True},
                {"name": "site_visit_location", "datatype": "VARCHAR(200)", "description": "Physical site visited during audit"},
                {"name": "finding_summary", "datatype": "VARCHAR(1000)", "description": "Summary of audit findings"},
                {"name": "compliance_gap_count", "datatype": "INT", "description": "Number of compliance gaps identified"},
                {"name": "corrective_action_deadline", "datatype": "DATE", "description": "Deadline for corrective actions"},
                {"name": "result", "datatype": "VARCHAR(20)", "description": "Audit result: Pass, Conditional, Fail"},
            ],
            "description": "Record all audit activities for AEO-certified traders"
        },
        {
            "name": "AEO_BENEFIT_TRACKING",
            "columns": [
                {"name": "benefit_id", "datatype": "INT", "description": "Benefit record ID"},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN", "pakSpecific": True},
                {"name": "aeo_tier", "datatype": "VARCHAR(10)", "description": "Current AEO tier level", "pakSpecific": True},
                {"name": "benefit_type", "datatype": "VARCHAR(50)", "description": "Benefit category: Reduced Examination, Priority Clearance, Deferred Duty, Reduced Bank Guarantee"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number where benefit applied", "pakSpecific": True},
                {"name": "benefit_date", "datatype": "DATE", "description": "Date benefit was utilized"},
                {"name": "time_saved_hours", "datatype": "DECIMAL(6,2)", "description": "Estimated clearance time saved in hours"},
                {"name": "cost_saved_pkr", "datatype": "DECIMAL(15,2)", "description": "Estimated cost saving in PKR", "pakSpecific": True},
                {"name": "examination_waived", "datatype": "BIT", "description": "Whether physical examination was waived"},
                {"name": "green_channel_used", "datatype": "BIT", "description": "Whether green channel was assigned"},
            ],
            "description": "Quantify tangible benefits received by AEO traders per GD"
        },
        {
            "name": "AEO_COMPLIANCE_SCORE",
            "columns": [
                {"name": "score_id", "datatype": "INT", "description": "Score record ID"},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN", "pakSpecific": True},
                {"name": "score_date", "datatype": "DATE", "description": "Date score was calculated"},
                {"name": "overall_score", "datatype": "DECIMAL(5,2)", "description": "Composite compliance score (0-100)"},
                {"name": "valuation_score", "datatype": "DECIMAL(5,2)", "description": "Valuation accuracy sub-score"},
                {"name": "classification_score", "datatype": "DECIMAL(5,2)", "description": "HS classification accuracy sub-score"},
                {"name": "documentation_score", "datatype": "DECIMAL(5,2)", "description": "Document completeness sub-score"},
                {"name": "payment_timeliness_score", "datatype": "DECIMAL(5,2)", "description": "Duty payment timeliness sub-score"},
                {"name": "violation_count_12m", "datatype": "INT", "description": "Violations in trailing 12 months"},
                {"name": "gds_assessed_12m", "datatype": "INT", "description": "Total GDs assessed in trailing 12 months"},
                {"name": "tier_recommendation", "datatype": "VARCHAR(20)", "description": "Recommended tier based on score: Upgrade, Maintain, Downgrade"},
            ],
            "description": "Monthly compliance scoring for AEO tier maintenance and promotion"
        },
        {
            "name": "AEO_MUTUAL_RECOGNITION",
            "columns": [
                {"name": "mr_id", "datatype": "INT", "description": "Mutual recognition record ID"},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Pakistan trader NTN", "pakSpecific": True},
                {"name": "partner_country_code", "datatype": "CHAR(2)", "description": "ISO country code of MRA partner"},
                {"name": "partner_aeo_number", "datatype": "VARCHAR(50)", "description": "AEO number in partner country system"},
                {"name": "mra_agreement_ref", "datatype": "VARCHAR(30)", "description": "Reference to the MRA agreement"},
                {"name": "recognition_start_date", "datatype": "DATE", "description": "Date mutual recognition became effective"},
                {"name": "recognition_end_date", "datatype": "DATE", "description": "Expiry date of mutual recognition"},
                {"name": "benefits_received_abroad", "datatype": "VARCHAR(500)", "description": "Description of benefits in partner country"},
                {"name": "validation_status", "datatype": "VARCHAR(20)", "description": "Status: Active, Suspended, Expired, Under Review"},
                {"name": "last_data_exchange_date", "datatype": "DATE", "description": "Last date compliance data was exchanged"},
            ],
            "description": "Track Pakistan AEO mutual recognition agreements with partner customs administrations"
        },
    ],
    "tableCount": 5,
    "connectsToStarSchema": [
        "FACT_TRADE_TRANSACTION.aeo_status",
        "DIM_TRADER.aeo_tier",
        "DIM_TRADER.ntn_number",
        "AGG_QUARTERLY_COMPLIANCE.compliance_rate"
    ],
    "requiredCapabilities": [
        "aeo_application_pipeline",
        "aeo_benefit_measurement",
        "aeo_compliance_monitoring",
        "aeo_mutual_recognition",
        "aeo_tier_analytics",
        "aeo_program_roi"
    ]
}

# ── Module 2: Rules of Origin & FTA ─────────────────────────────────────────
ORIGIN_FTA_MODULE = {
    "name": "Rules of Origin & FTA",
    "id": "origin_fta",
    "tables": [
        {
            "name": "FTA_AGREEMENT",
            "columns": [
                {"name": "agreement_id", "datatype": "INT", "description": "Agreement record ID"},
                {"name": "agreement_code", "datatype": "VARCHAR(20)", "description": "Short code (CPFTA-II, SAFTA, GSP_PLUS, D8_PTA, APTA, ECO_TPS)", "pakSpecific": True},
                {"name": "agreement_name", "datatype": "VARCHAR(200)", "description": "Full name of the trade agreement"},
                {"name": "partner_country_codes", "datatype": "VARCHAR(500)", "description": "Comma-separated ISO codes of partner countries"},
                {"name": "effective_date", "datatype": "DATE", "description": "Date the agreement entered into force"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Scheduled expiry or review date"},
                {"name": "concession_lines_count", "datatype": "INT", "description": "Number of HS lines with preferential rates"},
                {"name": "pakistan_avg_margin_pct", "datatype": "DECIMAL(5,2)", "description": "Average preference margin for Pakistan exports", "pakSpecific": True},
                {"name": "administering_body", "datatype": "VARCHAR(100)", "description": "FBR / Commerce Division responsible entity", "pakSpecific": True},
                {"name": "status", "datatype": "VARCHAR(20)", "description": "Status: Active, Suspended, Under Negotiation, Expired"},
            ],
            "description": "Master record of all FTAs and PTAs applicable to Pakistan trade"
        },
        {
            "name": "ORIGIN_CERTIFICATE",
            "columns": [
                {"name": "certificate_id", "datatype": "INT", "description": "Certificate record ID"},
                {"name": "certificate_number", "datatype": "VARCHAR(50)", "description": "Certificate of origin reference number"},
                {"name": "agreement_id", "datatype": "INT", "description": "FK to FTA_AGREEMENT"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number", "pakSpecific": True},
                {"name": "exporter_country", "datatype": "CHAR(2)", "description": "Country of the exporter"},
                {"name": "issuing_authority", "datatype": "VARCHAR(100)", "description": "Authority that issued the certificate"},
                {"name": "issue_date", "datatype": "DATE", "description": "Date of certificate issuance"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Certificate validity expiry date"},
                {"name": "hs_codes_covered", "datatype": "VARCHAR(1000)", "description": "HS codes listed on the certificate"},
                {"name": "verification_status", "datatype": "VARCHAR(20)", "description": "Status: Accepted, Rejected, Pending Verification, Referred to Origin"},
                {"name": "verification_request_date", "datatype": "DATE", "description": "Date verification was requested from issuing country"},
                {"name": "ntn_importer", "datatype": "VARCHAR(20)", "description": "NTN of the Pakistani importer", "pakSpecific": True},
            ],
            "description": "Track certificates of origin submitted for preferential duty treatment"
        },
        {
            "name": "PREFERENCE_UTILIZATION",
            "columns": [
                {"name": "utilization_id", "datatype": "INT", "description": "Utilization record ID"},
                {"name": "agreement_id", "datatype": "INT", "description": "FK to FTA_AGREEMENT"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS tariff line"},
                {"name": "period_year", "datatype": "INT", "description": "Fiscal year (July-June)", "pakSpecific": True},
                {"name": "period_quarter", "datatype": "TINYINT", "description": "Quarter within fiscal year"},
                {"name": "eligible_import_value_usd", "datatype": "DECIMAL(15,2)", "description": "Total value eligible for preference"},
                {"name": "claimed_import_value_usd", "datatype": "DECIMAL(15,2)", "description": "Total value where preference was claimed"},
                {"name": "utilization_rate_pct", "datatype": "DECIMAL(5,2)", "description": "Percentage of eligible value actually claimed"},
                {"name": "duty_saved_pkr", "datatype": "DECIMAL(15,2)", "description": "Duty saved through preference in PKR", "pakSpecific": True},
                {"name": "rejection_count", "datatype": "INT", "description": "Number of preference claims rejected"},
                {"name": "top_importer_ntn", "datatype": "VARCHAR(20)", "description": "NTN of largest preference user for this line", "pakSpecific": True},
            ],
            "description": "Measure FTA preference utilization rates by agreement, HS code, and period"
        },
        {
            "name": "ROO_COMPLIANCE_CHECK",
            "columns": [
                {"name": "check_id", "datatype": "INT", "description": "Compliance check record ID"},
                {"name": "certificate_id", "datatype": "INT", "description": "FK to ORIGIN_CERTIFICATE"},
                {"name": "roo_criterion", "datatype": "VARCHAR(30)", "description": "Rule applied: WO, RVC, CTC, SP (Wholly Obtained, Regional Value Content, Change in Tariff Classification, Specific Process)"},
                {"name": "rvc_threshold_pct", "datatype": "DECIMAL(5,2)", "description": "Required regional value content percentage"},
                {"name": "rvc_actual_pct", "datatype": "DECIMAL(5,2)", "description": "Actual regional value content declared"},
                {"name": "ctc_level", "datatype": "VARCHAR(20)", "description": "CTC level required: Chapter, Heading, Subheading"},
                {"name": "de_minimis_applicable", "datatype": "BIT", "description": "Whether de minimis tolerance applies"},
                {"name": "check_result", "datatype": "VARCHAR(20)", "description": "Result: Compliant, Non-Compliant, Inconclusive"},
                {"name": "checked_by_officer", "datatype": "VARCHAR(20)", "description": "FBR officer code who performed check", "pakSpecific": True},
                {"name": "check_date", "datatype": "DATE", "description": "Date the compliance check was performed"},
            ],
            "description": "Detailed rules-of-origin compliance verification per certificate"
        },
        {
            "name": "CUMULATION_TRACKING",
            "columns": [
                {"name": "cumulation_id", "datatype": "INT", "description": "Cumulation record ID"},
                {"name": "certificate_id", "datatype": "INT", "description": "FK to ORIGIN_CERTIFICATE"},
                {"name": "agreement_id", "datatype": "INT", "description": "FK to FTA_AGREEMENT"},
                {"name": "cumulation_type", "datatype": "VARCHAR(20)", "description": "Type: Bilateral, Diagonal, Full, Cross"},
                {"name": "partner_country_code", "datatype": "CHAR(2)", "description": "Country contributing cumulated materials"},
                {"name": "material_hs_code", "datatype": "VARCHAR(12)", "description": "HS code of cumulated input material"},
                {"name": "material_value_usd", "datatype": "DECIMAL(15,2)", "description": "Value of materials from cumulation partner"},
                {"name": "total_product_value_usd", "datatype": "DECIMAL(15,2)", "description": "Total value of the finished product"},
                {"name": "cumulation_pct", "datatype": "DECIMAL(5,2)", "description": "Percentage of value from cumulation partner"},
                {"name": "safta_cumulation_flag", "datatype": "BIT", "description": "Whether SAFTA cumulation rules apply", "pakSpecific": True},
                {"name": "cpfta_cumulation_flag", "datatype": "BIT", "description": "Whether CPFTA-II cumulation rules apply", "pakSpecific": True},
            ],
            "description": "Track cumulation of origin across FTA partners for compound products"
        },
    ],
    "tableCount": 5,
    "connectsToStarSchema": [
        "FACT_TRADE_TRANSACTION.preference_code",
        "DIM_COUNTRY.fta_partner_flag",
        "DIM_COMMODITY.preferential_rate",
        "DIM_COMMODITY.mfn_rate"
    ],
    "requiredCapabilities": [
        "fta_preference_management",
        "advance_ruling_compliance",
        "duty_differential_analysis",
        "trade_balance_dashboard",
        "export_diversification_metrics"
    ]
}

# ── Module 3: Valuation Intelligence ────────────────────────────────────────
VALUATION_MODULE = {
    "name": "Valuation Intelligence",
    "id": "valuation",
    "tables": [
        {
            "name": "REFERENCE_PRICE_DB",
            "columns": [
                {"name": "ref_price_id", "datatype": "INT", "description": "Reference price record ID"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS tariff line for the commodity"},
                {"name": "origin_country", "datatype": "CHAR(2)", "description": "Country of origin"},
                {"name": "dg_valuation_ruling", "datatype": "VARCHAR(30)", "description": "DG Valuation ruling reference number", "pakSpecific": True},
                {"name": "reference_price_usd", "datatype": "DECIMAL(15,4)", "description": "DG Valuation reference price per unit in USD", "pakSpecific": True},
                {"name": "unit_of_measure", "datatype": "VARCHAR(10)", "description": "Unit: KG, MT, PCS, LTR, SQM"},
                {"name": "effective_date", "datatype": "DATE", "description": "Date this reference price becomes effective"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Date this reference price expires"},
                {"name": "wto_method", "datatype": "VARCHAR(30)", "description": "WTO valuation method (1-6): Transaction Value, Identical Goods, Similar Goods, Deductive, Computed, Fallback"},
                {"name": "source", "datatype": "VARCHAR(50)", "description": "Data source: DG Valuation, Import Data, International Market, Mirror Stats"},
                {"name": "last_updated", "datatype": "DATETIME", "description": "Timestamp of last price update"},
                {"name": "confidence_level", "datatype": "VARCHAR(10)", "description": "Price confidence: High, Medium, Low"},
            ],
            "description": "Maintain reference prices by HS code and origin for DG Valuation rulings and automated alerts"
        },
        {
            "name": "VALUATION_ALERT",
            "columns": [
                {"name": "alert_id", "datatype": "INT", "description": "Alert record ID"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number that triggered the alert", "pakSpecific": True},
                {"name": "gd_line_item", "datatype": "INT", "description": "Line item number within the GD"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS code of the item"},
                {"name": "declared_value_usd", "datatype": "DECIMAL(15,4)", "description": "Value declared by the trader per unit"},
                {"name": "reference_value_usd", "datatype": "DECIMAL(15,4)", "description": "DG Valuation reference price per unit"},
                {"name": "deviation_pct", "datatype": "DECIMAL(7,2)", "description": "Percentage deviation from reference price"},
                {"name": "alert_type", "datatype": "VARCHAR(30)", "description": "Type: Under-Invoicing, Over-Invoicing, Misclassification, Related Party"},
                {"name": "ntn_importer", "datatype": "VARCHAR(20)", "description": "NTN of the importing trader", "pakSpecific": True},
                {"name": "action_taken", "datatype": "VARCHAR(30)", "description": "Action: Auto-Assessed, Referred to DG Val, Manual Review, Released"},
                {"name": "alert_date", "datatype": "DATE", "description": "Date the alert was generated"},
            ],
            "description": "Real-time valuation alerts when declared values deviate from DG Valuation reference prices"
        },
        {
            "name": "MIRROR_STATS_COMPARISON",
            "columns": [
                {"name": "mirror_id", "datatype": "INT", "description": "Mirror comparison record ID"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS code compared"},
                {"name": "partner_country", "datatype": "CHAR(2)", "description": "Trading partner country code"},
                {"name": "period_year", "datatype": "INT", "description": "Calendar year of comparison"},
                {"name": "period_month", "datatype": "TINYINT", "description": "Month of comparison"},
                {"name": "pakistan_import_value_usd", "datatype": "DECIMAL(15,2)", "description": "Value reported by Pakistan Customs", "pakSpecific": True},
                {"name": "partner_export_value_usd", "datatype": "DECIMAL(15,2)", "description": "Value reported by partner country"},
                {"name": "gap_value_usd", "datatype": "DECIMAL(15,2)", "description": "Absolute difference between mirror values"},
                {"name": "gap_pct", "datatype": "DECIMAL(7,2)", "description": "Percentage gap (potential under-invoicing indicator)"},
                {"name": "data_source", "datatype": "VARCHAR(50)", "description": "Source: UN Comtrade, IMF DOTS, Partner Customs Direct"},
                {"name": "risk_flag", "datatype": "BIT", "description": "Flagged if gap exceeds threshold (e.g. 20%)"},
            ],
            "description": "Compare Pakistan import values against partner country export values to detect trade mis-invoicing"
        },
        {
            "name": "TRANSFER_PRICING_FLAG",
            "columns": [
                {"name": "flag_id", "datatype": "INT", "description": "Transfer pricing flag record ID"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number", "pakSpecific": True},
                {"name": "ntn_importer", "datatype": "VARCHAR(20)", "description": "NTN of the importing party", "pakSpecific": True},
                {"name": "ntn_exporter_related", "datatype": "VARCHAR(20)", "description": "NTN of related exporter if any", "pakSpecific": True},
                {"name": "relationship_type", "datatype": "VARCHAR(30)", "description": "Relationship: Parent-Subsidiary, Associate, Branch, Common Control"},
                {"name": "declared_value_usd", "datatype": "DECIMAL(15,4)", "description": "Declared transaction value per unit"},
                {"name": "arms_length_value_usd", "datatype": "DECIMAL(15,4)", "description": "Estimated arm's-length value per unit"},
                {"name": "deviation_pct", "datatype": "DECIMAL(7,2)", "description": "Deviation from arm's-length price"},
                {"name": "flag_reason", "datatype": "VARCHAR(200)", "description": "Reason for flagging: Price below reference, Related party, Royalty included, etc."},
                {"name": "wto_article_applied", "datatype": "VARCHAR(20)", "description": "WTO Valuation Agreement article applied (Art 1-8)"},
                {"name": "resolution_status", "datatype": "VARCHAR(20)", "description": "Status: Open, Under Review, Adjusted, Cleared"},
                {"name": "duty_impact_pkr", "datatype": "DECIMAL(15,2)", "description": "Estimated duty impact if adjusted in PKR", "pakSpecific": True},
            ],
            "description": "Flag and track potential transfer pricing issues in related-party transactions"
        },
        {
            "name": "VALUE_TREND_ANALYSIS",
            "columns": [
                {"name": "trend_id", "datatype": "INT", "description": "Trend record ID"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS tariff line"},
                {"name": "origin_country", "datatype": "CHAR(2)", "description": "Country of origin"},
                {"name": "period_year", "datatype": "INT", "description": "Year of the trend period"},
                {"name": "period_quarter", "datatype": "TINYINT", "description": "Quarter of the trend period"},
                {"name": "avg_declared_value_usd", "datatype": "DECIMAL(15,4)", "description": "Average declared value per unit"},
                {"name": "median_declared_value_usd", "datatype": "DECIMAL(15,4)", "description": "Median declared value per unit"},
                {"name": "std_dev_value", "datatype": "DECIMAL(15,4)", "description": "Standard deviation of declared values"},
                {"name": "gd_count", "datatype": "INT", "description": "Number of GDs in this period for this HS/origin"},
                {"name": "trend_direction", "datatype": "VARCHAR(10)", "description": "Trend: Rising, Falling, Stable, Volatile"},
                {"name": "intl_price_benchmark_usd", "datatype": "DECIMAL(15,4)", "description": "International benchmark price for comparison"},
                {"name": "anomaly_flag", "datatype": "BIT", "description": "Flagged if trend deviates from international benchmarks"},
            ],
            "description": "Track value trends over time by HS code and origin for proactive risk assessment"
        },
    ],
    "tableCount": 5,
    "connectsToStarSchema": [
        "FACT_TRADE_TRANSACTION.customs_value",
        "FACT_TRADE_TRANSACTION.statistical_value",
        "DIM_COMMODITY.hs_code",
        "DIM_COUNTRY.country_code",
        "AGG_MONTHLY_TRADE.avg_unit_value"
    ],
    "requiredCapabilities": [
        "declared_value_verification",
        "transfer_pricing_detection",
        "transaction_value_database",
        "valuation_method_selection",
        "value_trend_analytics",
        "leakage_detection"
    ]
}

# ── Module 4: Risk Scoring Engine ───────────────────────────────────────────
RISK_ENGINE_MODULE = {
    "name": "Risk Scoring Engine",
    "id": "risk_engine",
    "tables": [
        {
            "name": "RISK_RULE",
            "columns": [
                {"name": "rule_id", "datatype": "INT", "description": "Risk rule identifier"},
                {"name": "rule_name", "datatype": "VARCHAR(200)", "description": "Descriptive name of the risk rule"},
                {"name": "rule_category", "datatype": "VARCHAR(30)", "description": "Category: Valuation, Classification, Origin, Trader, Documentary, Intelligence"},
                {"name": "rule_expression", "datatype": "VARCHAR(2000)", "description": "Logical expression / pseudo-code for rule evaluation"},
                {"name": "weight", "datatype": "DECIMAL(5,2)", "description": "Weight factor for composite scoring (0-100)"},
                {"name": "channel_impact", "datatype": "VARCHAR(20)", "description": "Channel outcome if triggered: Green, Yellow, Red", "pakSpecific": True},
                {"name": "ntc_origin", "datatype": "BIT", "description": "Whether rule originated from National Targeting Centre", "pakSpecific": True},
                {"name": "effective_date", "datatype": "DATE", "description": "Date rule became active"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Date rule expires (null = indefinite)"},
                {"name": "created_by", "datatype": "VARCHAR(50)", "description": "Officer or system that created the rule"},
                {"name": "last_triggered_date", "datatype": "DATE", "description": "Most recent date this rule fired"},
                {"name": "hit_rate_pct", "datatype": "DECIMAL(5,2)", "description": "Percentage of GDs where this rule triggers"},
            ],
            "description": "Define and manage risk assessment rules used by the selectivity engine"
        },
        {
            "name": "RISK_SCORE_HISTORY",
            "columns": [
                {"name": "score_history_id", "datatype": "INT", "description": "Score history record ID"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number", "pakSpecific": True},
                {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN", "pakSpecific": True},
                {"name": "score_date", "datatype": "DATETIME", "description": "Timestamp when score was calculated"},
                {"name": "composite_score", "datatype": "DECIMAL(5,2)", "description": "Overall risk score (0-100)"},
                {"name": "valuation_risk_score", "datatype": "DECIMAL(5,2)", "description": "Valuation risk component"},
                {"name": "classification_risk_score", "datatype": "DECIMAL(5,2)", "description": "Classification risk component"},
                {"name": "trader_risk_score", "datatype": "DECIMAL(5,2)", "description": "Trader history risk component"},
                {"name": "origin_risk_score", "datatype": "DECIMAL(5,2)", "description": "Origin / preference risk component"},
                {"name": "rules_triggered_count", "datatype": "INT", "description": "Number of risk rules that fired"},
                {"name": "rules_triggered_ids", "datatype": "VARCHAR(500)", "description": "Comma-separated rule IDs that fired"},
                {"name": "channel_assigned", "datatype": "VARCHAR(10)", "description": "Channel: Green, Yellow, Red", "pakSpecific": True},
            ],
            "description": "Historical record of risk scores computed for each GD at selectivity time"
        },
        {
            "name": "SELECTIVITY_RESULT",
            "columns": [
                {"name": "selectivity_id", "datatype": "INT", "description": "Selectivity result record ID"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number", "pakSpecific": True},
                {"name": "channel_assigned", "datatype": "VARCHAR(10)", "description": "Channel: Green, Yellow, Red", "pakSpecific": True},
                {"name": "assignment_method", "datatype": "VARCHAR(30)", "description": "Method: Rule-Based, Random, Intelligence, Manual Override, AEO Auto-Green"},
                {"name": "assignment_timestamp", "datatype": "DATETIME", "description": "Exact time channel was assigned"},
                {"name": "override_by", "datatype": "VARCHAR(50)", "description": "Officer code if manually overridden"},
                {"name": "override_reason", "datatype": "VARCHAR(500)", "description": "Reason for manual override"},
                {"name": "customs_station_code", "datatype": "VARCHAR(10)", "description": "Station where selectivity ran", "pakSpecific": True},
                {"name": "gd_type", "datatype": "VARCHAR(10)", "description": "GD type: Import, Export, Transit", "pakSpecific": True},
                {"name": "random_selection_pct", "datatype": "DECIMAL(5,2)", "description": "Random sampling percentage applied"},
            ],
            "description": "Record channel assignment results from the selectivity engine for every GD"
        },
        {
            "name": "EXAMINATION_OUTCOME",
            "columns": [
                {"name": "outcome_id", "datatype": "INT", "description": "Examination outcome record ID"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number", "pakSpecific": True},
                {"name": "selectivity_id", "datatype": "INT", "description": "FK to SELECTIVITY_RESULT"},
                {"name": "examination_type", "datatype": "VARCHAR(30)", "description": "Type: Documentary, Physical, Scanner, Lab Test"},
                {"name": "examining_officer", "datatype": "VARCHAR(50)", "description": "FBR officer who conducted examination", "pakSpecific": True},
                {"name": "examination_date", "datatype": "DATE", "description": "Date examination was conducted"},
                {"name": "start_time", "datatype": "DATETIME", "description": "Examination start timestamp"},
                {"name": "end_time", "datatype": "DATETIME", "description": "Examination end timestamp"},
                {"name": "discrepancy_found", "datatype": "BIT", "description": "Whether any discrepancy was found"},
                {"name": "discrepancy_type", "datatype": "VARCHAR(50)", "description": "Type: Valuation, Classification, Quantity, Origin, Prohibited Goods, None"},
                {"name": "additional_duty_pkr", "datatype": "DECIMAL(15,2)", "description": "Additional duty assessed due to discrepancy in PKR", "pakSpecific": True},
                {"name": "outcome_code", "datatype": "VARCHAR(20)", "description": "Outcome: Released, Duty Adjusted, Seized, Referred, Confiscated"},
            ],
            "description": "Record examination findings and outcomes to measure selectivity effectiveness"
        },
        {
            "name": "INTELLIGENCE_FEED",
            "columns": [
                {"name": "feed_id", "datatype": "INT", "description": "Intelligence feed record ID"},
                {"name": "feed_source", "datatype": "VARCHAR(50)", "description": "Source: NTC, WCO CEN, Interpol, FIA, ANF, ISI, Partner Customs", "pakSpecific": True},
                {"name": "feed_type", "datatype": "VARCHAR(30)", "description": "Type: Alert, Profile, Commodity Watch, Route Watch, Entity Watch"},
                {"name": "subject_description", "datatype": "VARCHAR(1000)", "description": "Description of the intelligence subject"},
                {"name": "target_ntn", "datatype": "VARCHAR(20)", "description": "Target trader NTN if applicable", "pakSpecific": True},
                {"name": "target_hs_codes", "datatype": "VARCHAR(500)", "description": "Target HS codes if applicable"},
                {"name": "target_countries", "datatype": "VARCHAR(200)", "description": "Target origin/transit countries"},
                {"name": "threat_level", "datatype": "VARCHAR(10)", "description": "Level: Critical, High, Medium, Low"},
                {"name": "received_date", "datatype": "DATE", "description": "Date intelligence was received"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Date intelligence expires"},
                {"name": "linked_rule_ids", "datatype": "VARCHAR(200)", "description": "Risk rule IDs created from this intelligence"},
                {"name": "action_status", "datatype": "VARCHAR(20)", "description": "Status: Active, Actioned, Expired, Archived"},
            ],
            "description": "Ingest and manage intelligence feeds from national and international sources for risk targeting"
        },
    ],
    "tableCount": 5,
    "connectsToStarSchema": [
        "FACT_TRADE_TRANSACTION.risk_score",
        "FACT_TRADE_TRANSACTION.selectivity_channel",
        "FACT_TRADE_TRANSACTION.examination_result",
        "DIM_TRADER.risk_tier",
        "AGG_QUARTERLY_COMPLIANCE.examination_rate"
    ],
    "requiredCapabilities": [
        "risk_profiling_engine",
        "selectivity_channel_assignment",
        "trader_risk_scoring",
        "intelligence_led_targeting",
        "risk_rule_management",
        "ml_risk_models"
    ]
}

# ── Module 5: E-Commerce & De Minimis ───────────────────────────────────────
ECOMMERCE_MODULE = {
    "name": "E-Commerce & De Minimis",
    "id": "ecommerce",
    "tables": [
        {
            "name": "ECOMMERCE_SHIPMENT",
            "columns": [
                {"name": "shipment_id", "datatype": "INT", "description": "E-commerce shipment record ID"},
                {"name": "tracking_number", "datatype": "VARCHAR(50)", "description": "Courier or postal tracking number"},
                {"name": "platform_id", "datatype": "INT", "description": "FK to PLATFORM_REGISTRY"},
                {"name": "gd_number", "datatype": "VARCHAR(30)", "description": "WeBOC GD number if formal clearance", "pakSpecific": True},
                {"name": "consignee_cnic", "datatype": "VARCHAR(15)", "description": "Pakistani consignee CNIC number", "pakSpecific": True},
                {"name": "declared_value_pkr", "datatype": "DECIMAL(15,2)", "description": "Declared value in PKR", "pakSpecific": True},
                {"name": "declared_value_usd", "datatype": "DECIMAL(15,2)", "description": "Declared value in USD"},
                {"name": "weight_kg", "datatype": "DECIMAL(10,3)", "description": "Shipment weight in kilograms"},
                {"name": "hs_code", "datatype": "VARCHAR(12)", "description": "HS code of contents"},
                {"name": "clearance_type", "datatype": "VARCHAR(20)", "description": "Type: Simplified, Formal GD, De Minimis Exempt, Postal"},
                {"name": "arrival_date", "datatype": "DATE", "description": "Date shipment arrived in Pakistan"},
                {"name": "release_date", "datatype": "DATE", "description": "Date shipment was released to consignee"},
            ],
            "description": "Track individual e-commerce shipments through customs clearance"
        },
        {
            "name": "PLATFORM_REGISTRY",
            "columns": [
                {"name": "platform_id", "datatype": "INT", "description": "Platform registry ID"},
                {"name": "platform_name", "datatype": "VARCHAR(100)", "description": "Name of the online marketplace (e.g. Daraz, AliExpress, Amazon)"},
                {"name": "platform_url", "datatype": "VARCHAR(500)", "description": "Primary URL of the platform"},
                {"name": "registration_number", "datatype": "VARCHAR(50)", "description": "FBR registration number for the platform", "pakSpecific": True},
                {"name": "country_of_incorporation", "datatype": "CHAR(2)", "description": "Country where platform is incorporated"},
                {"name": "pakistan_representative_ntn", "datatype": "VARCHAR(20)", "description": "NTN of Pakistan-based representative or fiscal agent", "pakSpecific": True},
                {"name": "avg_monthly_shipments_pk", "datatype": "INT", "description": "Average monthly shipments to Pakistan", "pakSpecific": True},
                {"name": "compliance_status", "datatype": "VARCHAR(20)", "description": "Status: Registered, Non-Compliant, Blocked, Under Review"},
                {"name": "registration_date", "datatype": "DATE", "description": "Date platform was registered with FBR"},
                {"name": "last_audit_date", "datatype": "DATE", "description": "Date of last compliance audit"},
            ],
            "description": "Registry of e-commerce platforms operating in the Pakistan market"
        },
        {
            "name": "DEMINIMIS_THRESHOLD",
            "columns": [
                {"name": "threshold_id", "datatype": "INT", "description": "Threshold record ID"},
                {"name": "effective_date", "datatype": "DATE", "description": "Date threshold became effective"},
                {"name": "expiry_date", "datatype": "DATE", "description": "Date threshold expires"},
                {"name": "threshold_value_pkr", "datatype": "DECIMAL(15,2)", "description": "De minimis threshold in PKR", "pakSpecific": True},
                {"name": "threshold_value_usd", "datatype": "DECIMAL(15,2)", "description": "De minimis threshold in USD equivalent"},
                {"name": "applies_to", "datatype": "VARCHAR(30)", "description": "Scope: All, Courier, Postal, Gift, Sample"},
                {"name": "excluded_hs_codes", "datatype": "VARCHAR(2000)", "description": "HS codes excluded from de minimis (tobacco, alcohol, etc.)"},
                {"name": "sro_reference", "datatype": "VARCHAR(50)", "description": "SRO that established this threshold", "pakSpecific": True},
                {"name": "duty_treatment", "datatype": "VARCHAR(50)", "description": "Treatment: Full Exemption, Reduced Rate, Standard Rate Above Threshold"},
                {"name": "annual_limit_per_cnic", "datatype": "INT", "description": "Maximum de minimis shipments per CNIC per year", "pakSpecific": True},
            ],
            "description": "Manage de minimis thresholds and exemption rules for low-value imports"
        },
        {
            "name": "SIMPLIFIED_CLEARANCE",
            "columns": [
                {"name": "clearance_id", "datatype": "INT", "description": "Simplified clearance record ID"},
                {"name": "shipment_id", "datatype": "INT", "description": "FK to ECOMMERCE_SHIPMENT"},
                {"name": "clearance_mode", "datatype": "VARCHAR(20)", "description": "Mode: Automated, Semi-Auto, Manual, Referred"},
                {"name": "courier_company", "datatype": "VARCHAR(100)", "description": "Courier company name (TCS, DHL, FedEx, Pakistan Post, etc.)"},
                {"name": "courier_licence_number", "datatype": "VARCHAR(30)", "description": "Courier customs licence number", "pakSpecific": True},
                {"name": "manifest_number", "datatype": "VARCHAR(30)", "description": "Courier manifest number"},
                {"name": "duty_assessed_pkr", "datatype": "DECIMAL(15,2)", "description": "Total duty assessed in PKR", "pakSpecific": True},
                {"name": "processing_time_minutes", "datatype": "INT", "description": "Time from submission to release in minutes"},
                {"name": "risk_flag", "datatype": "BIT", "description": "Whether risk engine flagged the shipment"},
                {"name": "customs_station_code", "datatype": "VARCHAR(10)", "description": "Station handling clearance (KAPE, LHRE, ISBE)", "pakSpecific": True},
                {"name": "release_timestamp", "datatype": "DATETIME", "description": "Exact timestamp of release"},
            ],
            "description": "Track simplified clearance processing for courier and postal shipments"
        },
        {
            "name": "RETURN_GOODS_TRACKING",
            "columns": [
                {"name": "return_id", "datatype": "INT", "description": "Return goods record ID"},
                {"name": "original_shipment_id", "datatype": "INT", "description": "FK to original ECOMMERCE_SHIPMENT"},
                {"name": "return_tracking_number", "datatype": "VARCHAR(50)", "description": "Tracking number for the return shipment"},
                {"name": "return_reason", "datatype": "VARCHAR(30)", "description": "Reason: Defective, Wrong Item, Size Issue, Not As Described, Buyer Remorse"},
                {"name": "return_date", "datatype": "DATE", "description": "Date return was initiated"},
                {"name": "original_duty_paid_pkr", "datatype": "DECIMAL(15,2)", "description": "Duty originally paid on import in PKR", "pakSpecific": True},
                {"name": "refund_eligible", "datatype": "BIT", "description": "Whether duty refund is eligible"},
                {"name": "refund_amount_pkr", "datatype": "DECIMAL(15,2)", "description": "Refund amount in PKR if eligible", "pakSpecific": True},
                {"name": "refund_status", "datatype": "VARCHAR(20)", "description": "Status: Pending, Approved, Paid, Rejected"},
                {"name": "consignee_cnic", "datatype": "VARCHAR(15)", "description": "CNIC of the returning consignee", "pakSpecific": True},
                {"name": "platform_return_ref", "datatype": "VARCHAR(50)", "description": "Platform-issued return reference number"},
            ],
            "description": "Track returned e-commerce goods and associated duty refund processing"
        },
    ],
    "tableCount": 5,
    "connectsToStarSchema": [
        "FACT_TRADE_TRANSACTION.ecommerce_flag",
        "FACT_TRADE_TRANSACTION.clearance_type",
        "DIM_TRADER.platform_registered",
        "AGG_DAILY_REVENUE.ecommerce_duty_collected"
    ],
    "requiredCapabilities": [
        "clearance_time_analytics",
        "pre_arrival_processing",
        "revenue_dashboarding",
        "leakage_detection",
        "green_channel_optimization"
    ]
}


def main():
    modules = [
        AEO_MODULE,
        ORIGIN_FTA_MODULE,
        VALUATION_MODULE,
        RISK_ENGINE_MODULE,
        ECOMMERCE_MODULE,
    ]

    output = {"modules": modules}

    # Validate structure
    total_tables = 0
    total_columns = 0
    total_pak_specific = 0

    for mod in modules:
        print(f"\n=== {mod['name']} (id: {mod['id']}) ===")
        print(f"  Tables: {mod['tableCount']}")
        print(f"  Star schema connections: {len(mod['connectsToStarSchema'])}")
        print(f"  Required capabilities: {len(mod['requiredCapabilities'])}")

        for table in mod['tables']:
            col_count = len(table['columns'])
            pak_cols = sum(1 for c in table['columns'] if c.get('pakSpecific', False))
            total_tables += 1
            total_columns += col_count
            total_pak_specific += pak_cols
            print(f"    {table['name']}: {col_count} columns ({pak_cols} Pakistan-specific)")

    print(f"\n{'='*60}")
    print(f"TOTALS:")
    print(f"  Modules: {len(modules)}")
    print(f"  Tables: {total_tables}")
    print(f"  Columns: {total_columns}")
    print(f"  Pakistan-specific columns: {total_pak_specific}")
    print(f"  Avg columns per table: {total_columns / total_tables:.1f}")

    # Write output
    output_path = os.path.join(OUTPUT_DIR, 'gapExtensions.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nOutput: {os.path.abspath(output_path)}")


if __name__ == '__main__':
    main()
