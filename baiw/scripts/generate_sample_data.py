#!/usr/bin/env python3
"""
Generate realistic banking data model JSON files for the BAIW application.
Produces all output files in src/data/.

Usage:
    python3 scripts/generate_sample_data.py
"""

import json
import os
import random
import math
from pathlib import Path

random.seed(42)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"


def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def write_json(filename: str, data):
    path = DATA_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Wrote {path}  ({_size_label(path)})")


def _size_label(path: Path) -> str:
    sz = path.stat().st_size
    if sz < 1024:
        return f"{sz} B"
    if sz < 1024 * 1024:
        return f"{sz / 1024:.1f} KB"
    return f"{sz / (1024 * 1024):.1f} MB"


# ===================================================================
# 1. DOMAINS
# ===================================================================
DOMAIN_DEFS = [
    ("Party Management", 622, "#4E79A7",
     "Entities representing parties, individuals, organizations, and their roles, relationships, and contact information."),
    ("Agreement & Account", 506, "#F28E2B",
     "Entities covering agreements, accounts, terms, conditions, and contractual arrangements between parties."),
    ("Classification & Reference", 543, "#E15759",
     "Reference data entities including codes, classifications, taxonomies, and standardized lookup values."),
    ("Product Management", 209, "#76B7B2",
     "Entities describing banking products, services, features, pricing, and product lifecycle management."),
    ("Financial Instrument", 187, "#59A14F",
     "Entities representing securities, derivatives, fixed income instruments, and other financial assets."),
    ("Transaction", 156, "#EDC948",
     "Entities covering financial transactions, payments, transfers, and settlement processing."),
    ("Location & Geography", 143, "#B07AA1",
     "Entities for addresses, regions, countries, branches, and geographic hierarchies."),
    ("Market Data", 128, "#FF9DA7",
     "Entities for market prices, rates, indices, benchmarks, and trading data."),
    ("General Ledger", 115, "#9C755F",
     "Entities representing chart of accounts, journal entries, ledger balances, and accounting structures."),
    ("Risk Management", 98, "#BAB0AC",
     "Entities for credit risk, market risk, operational risk, and risk assessment frameworks."),
    ("Regulatory & Compliance", 87, "#D37295",
     "Entities covering regulatory reporting, compliance rules, AML/KYC, and supervisory requirements."),
    ("Channel", 76, "#FABFD2",
     "Entities representing distribution channels including branch, digital, ATM, and contact center."),
    ("Event & Calendar", 65, "#B6992D",
     "Entities for business events, calendars, schedules, holidays, and temporal reference data."),
    ("Campaign & Marketing", 42, "#499894",
     "Entities for marketing campaigns, offers, promotions, and customer engagement programs."),
    ("Document & Content", 38, "#86BCB6",
     "Entities for documents, templates, correspondence, and content management."),
    ("Other", 902, "#A0CBE8",
     "Cross-cutting and miscellaneous entities spanning multiple subject areas."),
]

# ===================================================================
# 2. ENTITY NAME TEMPLATES PER DOMAIN
# ===================================================================

DOMAIN_ENTITY_BASES = {
    "Party Management": [
        "Party", "Individual", "Organization", "Organization_Unit",
        "Party_Role", "Party_Relationship", "Party_Contact_Method",
        "Party_Identification", "Party_Address", "Party_Preference",
        "Party_Classification", "Party_Group", "Party_Consent",
        "Individual_Name", "Individual_Demographics",
        "Organization_Structure", "Party_Tax_Registration",
        "Party_Risk_Rating", "Party_Lifecycle_Status", "Party_Segment",
        "Party_Household", "Party_Employment", "Party_Education",
        "Party_Income_Source", "Party_Financial_Summary",
        "Party_Beneficial_Owner", "Party_Power_Of_Attorney",
        "Party_KYC_Record", "Party_Screening_Result", "Party_Alert",
    ],
    "Agreement & Account": [
        "Agreement", "Account", "Agreement_Term", "Agreement_Condition",
        "Account_Balance", "Account_Hold", "Account_Restriction",
        "Agreement_Party_Role", "Agreement_Collateral", "Account_Interest_Rate",
        "Agreement_Fee_Schedule", "Account_Standing_Instruction",
        "Agreement_Amendment", "Account_Signatory", "Agreement_Covenant",
        "Agreement_Schedule", "Account_Mandate", "Agreement_Renewal",
        "Account_Dormancy", "Agreement_Limit", "Account_Sweeping_Rule",
        "Agreement_Guarantee", "Account_Nominee", "Agreement_Waiver",
        "Account_Currency", "Agreement_Event", "Account_Statement",
        "Account_Tier", "Agreement_Document",
    ],
    "Classification & Reference": [
        "Classification_Scheme", "Classification_Value",
        "Reference_Code", "Reference_Type", "Country_Code",
        "Currency", "Language_Code", "Industry_Classification",
        "Occupation_Code", "Status_Type", "Relationship_Type",
        "Contact_Method_Type", "Address_Type", "Document_Type",
        "Fee_Type", "Transaction_Type", "Risk_Category",
        "Regulatory_Code", "Business_Day_Convention",
        "Day_Count_Fraction", "Settlement_Method",
        "Interest_Rate_Type", "Frequency_Type", "Priority_Code",
        "Severity_Code", "Rating_Scale", "Taxonomy_Node",
        "Standard_Code_Set", "Enumeration_Value",
    ],
    "Product Management": [
        "Product", "Product_Feature", "Product_Pricing",
        "Product_Eligibility", "Product_Bundle", "Product_Channel",
        "Product_Lifecycle", "Product_Term", "Product_Rate",
        "Product_Fee", "Product_Limit", "Product_Document",
        "Product_Approval", "Product_Variant", "Product_Category",
        "Product_Hierarchy", "Product_Cross_Sell", "Product_Restriction",
        "Product_Suitability", "Product_Benchmark",
    ],
    "Financial Instrument": [
        "Financial_Instrument", "Security", "Bond", "Equity",
        "Derivative", "Option_Contract", "Futures_Contract",
        "Swap_Agreement", "Foreign_Exchange_Contract",
        "Structured_Product", "Fund", "Fund_Share_Class",
        "Instrument_Price", "Instrument_Rating", "Instrument_Issuer",
        "Instrument_Coupon", "Instrument_Cash_Flow",
        "Instrument_Valuation", "Instrument_Classification",
        "Instrument_Listing", "Instrument_Identifier",
    ],
    "Transaction": [
        "Transaction", "Payment", "Transfer", "Direct_Debit",
        "Standing_Order", "Wire_Transfer", "ACH_Transaction",
        "Card_Transaction", "ATM_Transaction", "POS_Transaction",
        "Transaction_Reversal", "Transaction_Fee", "Transaction_Limit",
        "Batch_Transaction", "Transaction_Authorization",
        "Settlement", "Clearing_Record", "Netting_Set",
        "Payment_Instruction", "Remittance_Information",
    ],
    "Location & Geography": [
        "Address", "Country", "Region", "City", "Branch",
        "Branch_Department", "ATM_Location", "Postal_Code",
        "Geographic_Area", "Time_Zone", "Branch_Operating_Hours",
        "Branch_Service", "Location_Hierarchy", "Electoral_District",
        "Economic_Zone", "Trade_Zone", "Branch_Performance_Zone",
        "Territory", "District",
    ],
    "Market Data": [
        "Market_Rate", "Exchange_Rate", "Interest_Rate_Index",
        "Benchmark_Rate", "Market_Index", "Index_Constituent",
        "Price_Quote", "Yield_Curve", "Yield_Curve_Point",
        "Volatility_Surface", "Credit_Spread", "Market_Data_Source",
        "Market_Calendar", "Trading_Session", "Market_Snapshot",
        "Rate_Fixing", "Reference_Rate", "Commodity_Price",
    ],
    "General Ledger": [
        "GL_Account", "Chart_Of_Accounts", "Journal_Entry",
        "Journal_Entry_Line", "Ledger_Balance", "Cost_Center",
        "Profit_Center", "GL_Hierarchy", "GL_Period",
        "Inter_Company_Entry", "Sub_Ledger", "GL_Mapping_Rule",
        "Accounting_Policy", "Trial_Balance", "GL_Reconciliation",
        "Budget_Line", "Accrual_Entry", "GL_Allocation_Rule",
    ],
    "Risk Management": [
        "Risk_Assessment", "Credit_Risk_Score", "Credit_Rating",
        "Probability_Of_Default", "Loss_Given_Default",
        "Exposure_At_Default", "Risk_Limit", "Risk_Exception",
        "Risk_Mitigation", "Collateral", "Collateral_Valuation",
        "Stress_Test_Scenario", "Stress_Test_Result",
        "Risk_Appetite_Statement", "Risk_Indicator",
        "Operational_Risk_Event", "Risk_Control",
    ],
    "Regulatory & Compliance": [
        "Regulatory_Report", "Regulatory_Requirement",
        "Compliance_Rule", "AML_Alert", "AML_Case",
        "KYC_Review", "Suspicious_Activity_Report",
        "Sanctions_Screening", "Regulatory_Capital",
        "Capital_Adequacy_Ratio", "Liquidity_Coverage_Ratio",
        "FATCA_Classification", "CRS_Classification",
        "Regulatory_Filing", "Compliance_Attestation",
        "Regulatory_Penalty", "Audit_Finding",
    ],
    "Channel": [
        "Channel", "Digital_Channel", "Branch_Channel",
        "ATM_Channel", "Contact_Center", "Channel_Session",
        "Channel_Interaction", "Channel_Availability",
        "Channel_Service_Mapping", "Mobile_App_Session",
        "Online_Banking_Session", "IVR_Session",
        "Channel_Performance", "Channel_Incident",
        "Channel_Capacity", "API_Gateway_Log",
    ],
    "Event & Calendar": [
        "Business_Event", "Calendar", "Business_Day",
        "Holiday", "Schedule", "Event_Type",
        "Event_Notification", "Event_Subscription",
        "Reminder", "Milestone", "Event_Log",
        "Processing_Window", "Batch_Schedule",
        "Event_Correlation", "Event_Trigger",
    ],
    "Campaign & Marketing": [
        "Campaign", "Marketing_Offer", "Promotion",
        "Lead", "Lead_Score", "Campaign_Response",
        "Campaign_Channel", "Target_Audience",
        "Offer_Eligibility", "Campaign_Budget",
        "Campaign_Performance", "Next_Best_Action",
        "Propensity_Model", "Campaign_Wave",
        "Marketing_Consent",
    ],
    "Document & Content": [
        "Document", "Document_Template", "Correspondence",
        "Document_Version", "Document_Category",
        "Content_Block", "Document_Signature",
        "Document_Archive", "Document_Metadata",
        "Statement_Template", "Disclosure_Document",
        "Terms_And_Conditions_Document", "Report_Template",
    ],
    "Other": [
        "Audit_Trail", "System_Parameter", "Batch_Job",
        "Notification", "User_Preference", "Data_Quality_Rule",
        "Data_Lineage_Record", "Metadata_Registry",
        "Integration_Message", "Workflow", "Workflow_Step",
        "Approval_Process", "SLA_Definition", "SLA_Measurement",
        "Fee_Calculation", "Tax_Rule", "Tax_Jurisdiction",
        "Insurance_Policy", "Insurance_Claim", "Loyalty_Program",
        "Loyalty_Points", "Reward", "Dispute", "Dispute_Resolution",
        "Service_Request", "Case_Management", "Alert_Rule",
        "Threshold", "Limit_Structure", "Delegation_Of_Authority",
    ],
}

ENTITY_SUFFIXES = [
    "", "_Type", "_Status", "_History", "_Detail", "_Summary",
    "_Attribute", "_Extension", "_Link", "_Mapping", "_Rule",
    "_Override", "_Snapshot", "_Archive", "_Audit", "_Config",
    "_Parameter", "_Schedule", "_Validation", "_Exception",
    "_Metric", "_KPI", "_Threshold", "_Alert_Config",
    "_Notification_Rule", "_Access_Control", "_Workflow_Step",
    "_Approval", "_Review", "_Assessment",
]


def _generate_entity_names(domain_name: str, count: int) -> list:
    """Generate *count* unique realistic entity names for a domain."""
    bases = DOMAIN_ENTITY_BASES.get(domain_name, DOMAIN_ENTITY_BASES["Other"])
    names: list[str] = []
    seen: set[str] = set()

    # First pass: plain base names
    for b in bases:
        if len(names) >= count:
            break
        if b not in seen:
            seen.add(b)
            names.append(b)

    # Second pass: base + suffix combinations
    for suffix in ENTITY_SUFFIXES:
        if len(names) >= count:
            break
        for b in bases:
            if len(names) >= count:
                break
            candidate = b + suffix if suffix else b
            if candidate not in seen:
                seen.add(candidate)
                names.append(candidate)

    # Third pass: numbered variants if still short
    idx = 2
    while len(names) < count:
        for b in bases:
            if len(names) >= count:
                break
            candidate = f"{b}_V{idx}"
            if candidate not in seen:
                seen.add(candidate)
                names.append(candidate)
        idx += 1

    return names[:count]


# ===================================================================
# Attribute name pools
# ===================================================================
COMMON_ATTR_NAMES = [
    "effective_date", "expiry_date", "status_code", "description",
    "created_by", "created_timestamp", "updated_by", "updated_timestamp",
    "source_system_code", "record_version",
]

DOMAIN_ATTR_POOLS = {
    "Party Management": [
        "party_id", "party_name", "party_type_code", "date_of_birth",
        "gender_code", "nationality_code", "tax_id_number",
        "registration_number", "legal_name", "trading_name",
        "incorporation_date", "industry_code", "employee_count",
        "annual_revenue", "risk_rating_code", "segment_code",
        "primary_contact_id", "preferred_language", "consent_flag",
        "kyc_status_code", "pep_flag", "sanctions_flag",
        "relationship_manager_id", "customer_since_date",
        "household_id", "education_level_code", "marital_status_code",
        "employment_status_code", "income_amount", "income_currency_code",
    ],
    "Agreement & Account": [
        "agreement_id", "account_id", "account_number", "agreement_type_code",
        "account_type_code", "opening_date", "closing_date",
        "current_balance", "available_balance", "ledger_balance",
        "overdraft_limit", "interest_rate", "interest_method_code",
        "maturity_date", "term_months", "collateral_value",
        "guarantee_amount", "currency_code", "branch_code",
        "primary_holder_id", "joint_holder_flag", "dormancy_date",
        "sweep_target_account", "mandate_type_code", "signatory_level",
        "fee_waiver_flag", "statement_frequency_code",
    ],
    "Classification & Reference": [
        "code_value", "code_description", "code_set_id", "parent_code",
        "sort_order", "is_active_flag", "valid_from_date", "valid_to_date",
        "iso_code", "standard_name", "category_code", "subcategory_code",
        "mapping_key", "external_code", "regulatory_code",
        "display_name", "abbreviation",
    ],
    "Product Management": [
        "product_id", "product_name", "product_code", "product_type_code",
        "category_code", "launch_date", "withdrawal_date",
        "min_balance", "max_balance", "base_rate", "margin_rate",
        "fee_amount", "fee_frequency_code", "eligibility_criteria",
        "channel_availability_code", "suitability_level",
        "regulatory_approval_date", "product_risk_rating",
    ],
    "Financial Instrument": [
        "instrument_id", "isin_code", "cusip_code", "sedol_code",
        "ticker_symbol", "instrument_name", "instrument_type_code",
        "issue_date", "maturity_date", "face_value", "coupon_rate",
        "coupon_frequency_code", "day_count_convention",
        "issuer_id", "listing_exchange_code", "trading_currency_code",
        "settlement_days", "accrued_interest", "clean_price",
        "dirty_price", "yield_to_maturity",
    ],
    "Transaction": [
        "transaction_id", "transaction_date", "value_date",
        "posting_date", "transaction_amount", "transaction_currency_code",
        "debit_credit_indicator", "transaction_type_code",
        "originator_account_id", "beneficiary_account_id",
        "payment_reference", "remittance_info", "channel_code",
        "authorization_code", "reversal_flag", "batch_id",
        "settlement_date", "fee_amount", "exchange_rate",
        "narrative", "end_to_end_id",
    ],
    "Location & Geography": [
        "address_id", "address_line_1", "address_line_2", "city_name",
        "state_province_code", "postal_code", "country_code",
        "latitude", "longitude", "branch_code", "branch_name",
        "region_code", "region_name", "time_zone_code",
        "opening_time", "closing_time", "atm_id",
    ],
    "Market Data": [
        "rate_id", "rate_date", "rate_value", "rate_source_code",
        "index_name", "index_value", "currency_pair",
        "bid_price", "ask_price", "mid_price", "close_price",
        "volume", "tenor_code", "yield_value", "spread_value",
        "volatility", "fixing_time", "data_provider_code",
    ],
    "General Ledger": [
        "gl_account_id", "gl_account_number", "gl_account_name",
        "account_category_code", "normal_balance_indicator",
        "journal_entry_id", "entry_date", "posting_period",
        "debit_amount", "credit_amount", "balance_amount",
        "cost_center_code", "profit_center_code", "company_code",
        "intercompany_flag", "sub_ledger_type_code",
        "reconciliation_status", "budget_amount",
    ],
    "Risk Management": [
        "risk_id", "risk_type_code", "risk_score", "risk_rating_code",
        "probability_of_default", "loss_given_default",
        "exposure_at_default", "expected_loss", "unexpected_loss",
        "risk_weight", "collateral_id", "collateral_type_code",
        "collateral_value", "valuation_date", "haircut_pct",
        "stress_scenario_id", "scenario_name", "impact_amount",
    ],
    "Regulatory & Compliance": [
        "report_id", "report_type_code", "reporting_period",
        "submission_date", "submission_status_code", "regulator_code",
        "rule_id", "rule_description", "alert_id", "alert_status_code",
        "case_id", "case_status_code", "sar_id", "filing_date",
        "capital_amount", "capital_ratio", "tier1_capital",
        "tier2_capital", "rwa_amount",
    ],
    "Channel": [
        "channel_id", "channel_name", "channel_type_code",
        "session_id", "session_start_time", "session_end_time",
        "interaction_id", "interaction_type_code", "device_type_code",
        "ip_address", "user_agent", "transaction_count",
        "availability_pct", "response_time_ms",
    ],
    "Event & Calendar": [
        "event_id", "event_type_code", "event_date", "event_time",
        "calendar_id", "calendar_name", "is_business_day_flag",
        "holiday_name", "schedule_id", "frequency_code",
        "next_occurrence_date", "notification_channel_code",
    ],
    "Campaign & Marketing": [
        "campaign_id", "campaign_name", "campaign_type_code",
        "start_date", "end_date", "budget_amount", "spend_amount",
        "target_audience_size", "response_count", "conversion_count",
        "offer_id", "offer_name", "discount_pct", "propensity_score",
        "lead_id", "lead_status_code", "lead_score",
    ],
    "Document & Content": [
        "document_id", "document_name", "document_type_code",
        "template_id", "version_number", "content_hash",
        "file_size_bytes", "mime_type", "author_id",
        "approval_status_code", "archive_date", "retention_period_days",
    ],
    "Other": [
        "record_id", "object_type_code", "object_id", "action_code",
        "action_timestamp", "actor_id", "parameter_name",
        "parameter_value", "job_id", "job_name", "job_status_code",
        "start_timestamp", "end_timestamp", "error_message",
        "workflow_id", "step_name", "step_sequence", "assignee_id",
        "priority_code", "due_date", "resolution_date",
        "sla_target_minutes", "sla_actual_minutes", "breach_flag",
        "rule_expression", "threshold_value", "metric_value",
    ],
}

DATA_TYPES = ["VARCHAR", "NUMBER", "DATE", "TIMESTAMP", "CHAR", "DECIMAL"]
DATA_TYPE_WEIGHTS = [35, 25, 15, 10, 5, 10]


# ===================================================================
# 3. CAPABILITIES
# ===================================================================

CAPABILITY_STRUCTURE = {
    "Marketing & Customer Experience": {
        "Customer Information & Insight Analytics": [
            "Single Customer View", "Customer 360 Analytics",
            "Customer Segmentation", "Behavioral Analytics",
            "Customer Risk Profiling", "Wallet Share Analysis",
            "Customer Demographics Analytics", "Household Analytics",
            "Relationship Mapping", "Customer Journey Analytics",
            "Digital Footprint Analytics", "Engagement Scoring",
        ],
        "Customer Lifecycle Management": [
            "Customer Onboarding Analytics", "Customer Retention Analysis",
            "Churn Prediction", "Win-Back Campaign Analytics",
            "Customer Migration Tracking", "Dormancy Detection",
            "Reactivation Analytics", "Cross-Sell Propensity",
            "Up-Sell Propensity", "Lifetime Value Estimation",
        ],
        "Customer Interaction Management": [
            "Omnichannel Interaction Tracking", "Next Best Action Engine",
            "Complaint Analytics", "Service Quality Monitoring",
            "Contact Center Analytics", "Digital Engagement Analytics",
            "Real-Time Offer Management", "Feedback Sentiment Analysis",
            "Interaction History Consolidation",
        ],
        "Marketing & CX Use Cases": [
            "Campaign Performance Analytics", "Marketing ROI Measurement",
            "Lead Scoring & Prioritization", "A/B Test Analytics",
            "Offer Conversion Analysis", "Customer Satisfaction Index",
            "Net Promoter Score Tracking", "Loyalty Program Analytics",
            "Referral Program Analytics", "Social Media Sentiment Analytics",
            "Customer Effort Score",
        ],
    },
    "Finance & Performance Management": {
        "Accounting Operations & Close": [
            "Subledger Reconciliation", "Intercompany Elimination",
            "Accrual Management", "Period-End Close Automation",
            "Journal Entry Analytics", "Trial Balance Validation",
            "GL Account Variance Analysis", "Suspense Account Monitoring",
            "Revaluation Processing", "Multi-GAAP Reporting",
        ],
        "Enterprise Performance Management": [
            "Profitability Analytics", "Funds Transfer Pricing",
            "Activity-Based Costing", "Economic Value Added Analysis",
            "Budget vs Actual Variance", "Rolling Forecast Analytics",
            "Strategic Planning KPIs", "Balanced Scorecard",
        ],
        "Treasury Insight & Management": [
            "Liquidity Forecasting", "Cash Position Management",
            "ALM Gap Analysis", "Interest Rate Risk Analytics",
            "Investment Portfolio Analytics",
        ],
        "Financial Reporting": [
            "IFRS 9 Reporting", "Regulatory Capital Reporting",
            "Basel III Compliance Analytics", "Financial Statement Analytics",
            "Segment Reporting", "Tax Provision Analytics",
            "Consolidation Analytics",
        ],
        "Finance Use Cases": [
            "Revenue Recognition Analytics", "Cost Allocation Analysis",
            "Branch Profitability", "Product Profitability",
            "Customer Profitability", "Relationship Profitability",
            "Fee Income Analytics", "Net Interest Margin Analytics",
            "Operating Expense Analysis", "RAROC Analytics",
            "Shareholder Value Analytics", "Dividend Analytics",
        ],
    },
    "Product Management": {
        "Product Development": [
            "Product Ideation Analytics", "Market Gap Analysis",
            "Competitive Benchmarking", "Feature Prioritization",
            "Product Pricing Optimization", "Product Launch Readiness",
            "Time-to-Market Analytics", "Product Compliance Review",
            "Islamic Product Structuring",
        ],
        "Product Performance": [
            "Product Revenue Analytics", "Product Penetration Analysis",
            "Product Lifecycle Analytics", "Portfolio Composition Analysis",
            "Product Mix Optimization", "Cross-Product Cannibalization",
            "Product Attrition Analytics", "Deposit Stability Analysis",
            "Loan Book Quality Analysis", "Fee-Based Product Analytics",
        ],
        "Product Use Cases": [
            "Current Account Analytics", "Savings Product Analytics",
            "Term Deposit Analytics", "Consumer Lending Analytics",
            "Mortgage Analytics", "Credit Card Analytics",
            "Trade Finance Analytics", "Islamic Banking Product Analytics",
            "Wealth Management Analytics",
        ],
    },
}


# ===================================================================
# 4. BACR QUESTIONS
# ===================================================================

BACR_CATEGORIES = {
    "Business": {
        "count": 120,
        "subcategories": [
            "Strategy Alignment", "Business Case Development",
            "Stakeholder Engagement", "Value Realization",
            "Executive Sponsorship", "Business Requirements",
            "Use Case Prioritization", "ROI Measurement",
        ],
        "templates": [
            "How effectively does the organization align analytics initiatives with {topic}?",
            "To what extent are {topic} clearly defined and documented?",
            "How mature is the organization's approach to {topic}?",
            "Rate the organization's capability in {topic}.",
            "How well does the organization measure the impact of {topic}?",
            "To what degree are {topic} integrated into decision-making processes?",
            "How effectively are {topic} communicated across the organization?",
            "Rate the maturity of {topic} within the banking analytics context.",
        ],
        "topics": [
            "strategic business objectives", "data-driven decision making",
            "analytics value chain", "customer-centric business models",
            "competitive intelligence", "market opportunity analysis",
            "digital transformation goals", "revenue growth targets",
            "cost optimization objectives", "risk appetite frameworks",
            "operational efficiency targets", "innovation roadmaps",
            "partnership strategies", "regulatory strategy alignment",
            "shareholder value creation", "ESG integration targets",
        ],
    },
    "Culture": {
        "count": 80,
        "subcategories": [
            "Data Literacy", "Analytics Adoption",
            "Change Management", "Innovation Mindset",
            "Collaboration", "Continuous Learning",
        ],
        "templates": [
            "How well does the organization foster a culture of {topic}?",
            "To what extent do employees demonstrate competency in {topic}?",
            "How effectively does leadership promote {topic}?",
            "Rate the organization's maturity in embedding {topic} into daily operations.",
            "How well are {topic} skills distributed across business units?",
            "To what degree does the organization invest in {topic} training?",
        ],
        "topics": [
            "data-driven decision making", "analytical thinking",
            "experimentation and testing", "evidence-based management",
            "cross-functional collaboration", "knowledge sharing",
            "data storytelling", "self-service analytics adoption",
            "continuous improvement", "innovation and creativity",
            "risk-aware analytics usage", "ethical data use",
            "customer empathy through data", "digital fluency",
        ],
    },
    "Governance": {
        "count": 95,
        "subcategories": [
            "Data Governance Framework", "Data Quality Management",
            "Metadata Management", "Data Stewardship",
            "Policy & Standards", "Privacy & Security",
            "Regulatory Compliance",
        ],
        "templates": [
            "How mature is the organization's {topic} framework?",
            "To what extent are {topic} policies documented and enforced?",
            "How effectively does the organization manage {topic}?",
            "Rate the organization's capability in {topic} governance.",
            "How well are {topic} roles and responsibilities defined?",
            "To what degree are {topic} processes automated?",
            "How effectively does the organization measure {topic} outcomes?",
        ],
        "topics": [
            "data ownership and stewardship", "data quality rules and monitoring",
            "master data management", "reference data management",
            "data lineage and traceability", "data cataloging",
            "data access control", "data privacy compliance",
            "data retention and archival", "metadata standardization",
            "data sharing agreements", "cross-border data governance",
            "model governance and validation", "analytics output governance",
        ],
    },
    "Information": {
        "count": 110,
        "subcategories": [
            "Data Architecture", "Data Integration",
            "Data Quality", "Master Data",
            "Reference Data", "Data Modeling",
            "Data Lifecycle Management", "Data Sourcing",
        ],
        "templates": [
            "How well does the organization manage {topic}?",
            "To what extent is {topic} standardized across the enterprise?",
            "How mature is the organization's approach to {topic}?",
            "Rate the effectiveness of {topic} processes.",
            "How well does {topic} support analytical use cases?",
            "To what degree is {topic} aligned with industry standards?",
            "How effectively does the organization ensure {topic} accuracy?",
            "Rate the completeness of {topic} coverage.",
        ],
        "topics": [
            "customer data integration", "product data management",
            "transaction data completeness", "financial data accuracy",
            "risk data aggregation", "regulatory data quality",
            "real-time data availability", "historical data depth",
            "unstructured data management", "external data sourcing",
            "data warehouse architecture", "data lake implementation",
            "API-based data access", "data virtualization",
            "golden source identification", "data profiling and cleansing",
        ],
    },
    "Applications": {
        "count": 90,
        "subcategories": [
            "Analytics Platforms", "BI & Reporting",
            "Advanced Analytics", "Self-Service Analytics",
            "Data Visualization", "Machine Learning Ops",
        ],
        "templates": [
            "How effectively does the organization leverage {topic}?",
            "To what extent are {topic} capabilities deployed enterprise-wide?",
            "How mature is the organization's {topic} toolset?",
            "Rate the adoption level of {topic} across business functions.",
            "How well does {topic} integrate with existing systems?",
            "To what degree does {topic} meet business user needs?",
        ],
        "topics": [
            "enterprise BI platform", "self-service analytics tools",
            "predictive analytics capabilities", "prescriptive analytics",
            "natural language query interfaces", "embedded analytics",
            "real-time dashboarding", "mobile analytics",
            "collaborative analytics workspaces", "automated reporting",
            "data visualization best practices", "ML model deployment",
            "AI-powered insights", "robotic process automation",
            "cloud analytics platforms", "analytics sandboxes",
        ],
    },
    "Systems": {
        "count": 85,
        "subcategories": [
            "Infrastructure", "Data Platforms",
            "Integration Architecture", "Cloud Strategy",
            "Performance & Scalability", "Security Architecture",
        ],
        "templates": [
            "How mature is the organization's {topic} infrastructure?",
            "To what extent does {topic} support analytics workloads?",
            "How effectively is {topic} managed and maintained?",
            "Rate the scalability of {topic} for growing data volumes.",
            "How well does {topic} meet performance requirements?",
            "To what degree is {topic} aligned with cloud strategy?",
        ],
        "topics": [
            "data warehouse platform", "big data infrastructure",
            "real-time streaming architecture", "ETL/ELT processing",
            "data integration middleware", "API management platform",
            "cloud data platform", "hybrid cloud architecture",
            "disaster recovery for analytics", "data backup and archival",
            "network bandwidth for data transfers", "compute resource management",
            "storage tiering strategy", "DevOps for analytics",
            "containerization of analytics workloads",
        ],
    },
    "Agility": {
        "count": 70,
        "subcategories": [
            "Agile Analytics Delivery", "Time to Insight",
            "Adaptability", "Innovation Speed",
            "Change Responsiveness",
        ],
        "templates": [
            "How effectively does the organization deliver {topic}?",
            "To what extent can the organization adapt {topic} to changing needs?",
            "How mature is the organization's agile approach to {topic}?",
            "Rate the speed at which {topic} can be delivered.",
            "How well does the organization respond to {topic} changes?",
        ],
        "topics": [
            "new analytics use cases", "data product development",
            "regulatory reporting changes", "market condition adaptations",
            "technology platform changes", "business model pivots",
            "competitive response analytics", "crisis management analytics",
            "rapid prototyping of insights", "iterative model development",
            "feedback-driven improvement", "cross-functional sprint delivery",
            "analytics backlog management", "continuous deployment of models",
        ],
    },
    "Outcomes": {
        "count": 75,
        "subcategories": [
            "Business Value Delivery", "Operational Impact",
            "Customer Impact", "Risk Reduction",
            "Financial Impact", "Strategic Impact",
        ],
        "templates": [
            "How effectively does analytics drive {topic}?",
            "To what extent has analytics contributed to {topic}?",
            "How well does the organization measure {topic} from analytics?",
            "Rate the realized impact of analytics on {topic}.",
            "How clearly are {topic} outcomes attributed to analytics initiatives?",
            "To what degree has {topic} improved through analytics adoption?",
        ],
        "topics": [
            "revenue growth", "cost reduction", "customer acquisition",
            "customer retention improvement", "risk mitigation",
            "regulatory compliance efficiency", "operational efficiency",
            "fraud detection improvement", "credit loss reduction",
            "cross-sell revenue uplift", "process automation savings",
            "decision-making speed", "market share growth",
        ],
    },
    "Overall Assessment": {
        "count": 68,
        "subcategories": [
            "Maturity Assessment", "Gap Analysis",
            "Roadmap Planning", "Benchmark Comparison",
            "Capability Prioritization",
        ],
        "templates": [
            "How would you rate the overall maturity of {topic}?",
            "To what extent does the organization have a clear roadmap for {topic}?",
            "How well does the organization benchmark against peers in {topic}?",
            "Rate the organization's readiness to advance in {topic}.",
            "How effectively does the organization prioritize {topic} investments?",
        ],
        "topics": [
            "enterprise analytics maturity", "data management capabilities",
            "technology infrastructure readiness", "organizational readiness",
            "talent and skills availability", "governance framework completeness",
            "business alignment of analytics", "innovation capability",
            "cultural readiness for data-driven operations",
            "vendor and partner ecosystem maturity",
            "competitive positioning through analytics",
            "future-state analytics architecture",
            "analytics operating model", "funding and investment model",
        ],
    },
}


# ===================================================================
# Star Schema definitions
# ===================================================================

STAR_SCHEMA_DEF = {
    "factTable": {
        "name": "FACT_CUSTOMER_PROFITABILITY",
        "type": "fact",
        "columns": [
            ("customer_key", "NUMBER", "Surrogate key to DIM_CUSTOMER", False),
            ("product_key", "NUMBER", "Surrogate key to DIM_PRODUCT", False),
            ("branch_key", "NUMBER", "Surrogate key to DIM_BRANCH", False),
            ("segment_key", "NUMBER", "Surrogate key to DIM_BUSINESS_SEGMENT", False),
            ("channel_key", "NUMBER", "Surrogate key to DIM_CHANNEL", False),
            ("time_key", "NUMBER", "Surrogate key to DIM_TIME", False),
            ("agreement_key", "NUMBER", "Surrogate key to DIM_AGREEMENT", False),
            ("interest_income", "DECIMAL(18,2)", "Gross interest income earned", False),
            ("interest_expense", "DECIMAL(18,2)", "Interest expense on funding", False),
            ("net_interest_income", "DECIMAL(18,2)", "Net interest income after FTP", False),
            ("fee_income", "DECIMAL(18,2)", "Fee and commission income", False),
            ("fee_expense", "DECIMAL(18,2)", "Fee and commission expense", False),
            ("fx_income", "DECIMAL(18,2)", "Foreign exchange trading income", False),
            ("trading_income", "DECIMAL(18,2)", "Trading and investment income", False),
            ("other_operating_income", "DECIMAL(18,2)", "Other non-interest income", False),
            ("total_revenue", "DECIMAL(18,2)", "Total revenue", False),
            ("provision_charge", "DECIMAL(18,2)", "Provision for credit losses", False),
            ("direct_cost", "DECIMAL(18,2)", "Direct operating costs", False),
            ("indirect_cost", "DECIMAL(18,2)", "Allocated indirect costs", False),
            ("abc_cost", "DECIMAL(18,2)", "Activity-based cost allocation", False),
            ("total_cost", "DECIMAL(18,2)", "Total cost including provisions", False),
            ("pre_tax_profit", "DECIMAL(18,2)", "Pre-tax profit", False),
            ("tax_amount", "DECIMAL(18,2)", "Tax charge", False),
            ("net_profit", "DECIMAL(18,2)", "Net profit after tax", False),
            ("economic_capital", "DECIMAL(18,2)", "Economic capital consumed", False),
            ("regulatory_capital", "DECIMAL(18,2)", "Regulatory capital requirement", False),
            ("risk_weighted_assets", "DECIMAL(18,2)", "Risk-weighted asset amount", False),
            ("raroc", "DECIMAL(8,4)", "Risk-adjusted return on capital", False),
            ("eva", "DECIMAL(18,2)", "Economic value added", False),
            ("ftp_rate", "DECIMAL(8,6)", "Funds transfer pricing rate", False),
            ("ftp_charge", "DECIMAL(18,2)", "FTP charge amount", False),
            ("average_balance", "DECIMAL(18,2)", "Average balance for period", False),
            ("eop_balance", "DECIMAL(18,2)", "End of period balance", False),
            ("transaction_count", "NUMBER", "Number of transactions", False),
            ("digital_transaction_count", "NUMBER", "Number of digital transactions", False),
            ("branch_visit_count", "NUMBER", "Number of branch visits", False),
            ("product_holding_count", "NUMBER", "Number of products held", False),
            ("days_past_due", "NUMBER", "Days past due for credit", False),
            ("ltv_ratio", "DECIMAL(8,4)", "Loan-to-value ratio", False),
            ("islamic_profit_share", "DECIMAL(18,2)", "Islamic banking profit share amount", True),
            ("murabaha_margin", "DECIMAL(8,4)", "Murabaha profit margin rate", True),
            ("sukuk_income", "DECIMAL(18,2)", "Income from Sukuk instruments", True),
        ],
    },
    "dimensions": [
        {
            "name": "DIM_CUSTOMER",
            "type": "dimension",
            "columns": [
                ("customer_key", "NUMBER", "Surrogate key", False),
                ("customer_id", "VARCHAR(20)", "Natural key", False),
                ("customer_name", "VARCHAR(200)", "Full customer name", False),
                ("customer_type_code", "CHAR(1)", "I=Individual, O=Organization", False),
                ("segment_code", "VARCHAR(10)", "Customer segment", False),
                ("sub_segment_code", "VARCHAR(10)", "Customer sub-segment", False),
                ("risk_rating", "VARCHAR(5)", "Customer risk rating", False),
                ("kyc_status", "VARCHAR(20)", "KYC verification status", False),
                ("onboarding_date", "DATE", "Customer onboarding date", False),
                ("relationship_manager_id", "VARCHAR(20)", "Assigned RM identifier", False),
                ("nationality_code", "CHAR(3)", "ISO country code of nationality", False),
                ("residence_country_code", "CHAR(3)", "Country of residence", False),
                ("is_pep_flag", "CHAR(1)", "Politically exposed person flag", False),
                ("is_staff_flag", "CHAR(1)", "Bank staff indicator", False),
                ("household_id", "VARCHAR(20)", "Household grouping identifier", False),
                ("clv_score", "DECIMAL(10,2)", "Customer lifetime value score", False),
                ("nps_score", "NUMBER", "Net promoter score", False),
                ("digital_adoption_score", "DECIMAL(5,2)", "Digital channel adoption score", False),
                ("is_islamic_customer", "CHAR(1)", "Islamic banking customer flag", True),
                ("zakat_eligible_flag", "CHAR(1)", "Eligible for Zakat calculation", True),
            ],
        },
        {
            "name": "DIM_PRODUCT",
            "type": "dimension",
            "columns": [
                ("product_key", "NUMBER", "Surrogate key", False),
                ("product_id", "VARCHAR(20)", "Natural key", False),
                ("product_name", "VARCHAR(200)", "Product name", False),
                ("product_type_code", "VARCHAR(10)", "Product type", False),
                ("product_category", "VARCHAR(50)", "Product category", False),
                ("product_family", "VARCHAR(50)", "Product family grouping", False),
                ("is_islamic_product", "CHAR(1)", "Islamic product flag", True),
                ("islamic_mode", "VARCHAR(50)", "Islamic finance mode", True),
                ("launch_date", "DATE", "Product launch date", False),
                ("status_code", "VARCHAR(10)", "Active/Inactive/Withdrawn", False),
                ("base_currency", "CHAR(3)", "Product base currency", False),
                ("min_balance", "DECIMAL(18,2)", "Minimum balance requirement", False),
                ("risk_weight_pct", "DECIMAL(5,2)", "Regulatory risk weight", False),
            ],
        },
        {
            "name": "DIM_BRANCH",
            "type": "dimension",
            "columns": [
                ("branch_key", "NUMBER", "Surrogate key", False),
                ("branch_code", "VARCHAR(10)", "Branch code", False),
                ("branch_name", "VARCHAR(200)", "Branch name", False),
                ("branch_type_code", "VARCHAR(10)", "Branch type", False),
                ("region_code", "VARCHAR(10)", "Region code", False),
                ("region_name", "VARCHAR(100)", "Region name", False),
                ("city_name", "VARCHAR(100)", "City name", False),
                ("country_code", "CHAR(3)", "Country code", False),
                ("opening_date", "DATE", "Branch opening date", False),
                ("manager_id", "VARCHAR(20)", "Branch manager ID", False),
                ("is_islamic_branch", "CHAR(1)", "Islamic banking branch flag", True),
                ("branch_tier", "VARCHAR(5)", "Branch tier classification", False),
                ("employee_count", "NUMBER", "Number of employees", False),
            ],
        },
        {
            "name": "DIM_BUSINESS_SEGMENT",
            "type": "dimension",
            "columns": [
                ("segment_key", "NUMBER", "Surrogate key", False),
                ("segment_code", "VARCHAR(10)", "Segment code", False),
                ("segment_name", "VARCHAR(100)", "Segment name", False),
                ("sub_segment_code", "VARCHAR(10)", "Sub-segment code", False),
                ("sub_segment_name", "VARCHAR(100)", "Sub-segment name", False),
                ("business_line", "VARCHAR(50)", "Business line", False),
                ("reporting_unit", "VARCHAR(50)", "Reporting unit", False),
                ("is_islamic_segment", "CHAR(1)", "Islamic banking segment flag", True),
            ],
        },
        {
            "name": "DIM_CHANNEL",
            "type": "dimension",
            "columns": [
                ("channel_key", "NUMBER", "Surrogate key", False),
                ("channel_code", "VARCHAR(10)", "Channel code", False),
                ("channel_name", "VARCHAR(100)", "Channel name", False),
                ("channel_type", "VARCHAR(20)", "Channel type", False),
                ("is_digital_flag", "CHAR(1)", "Digital channel flag", False),
                ("parent_channel_code", "VARCHAR(10)", "Parent channel for hierarchy", False),
                ("launch_date", "DATE", "Channel launch date", False),
                ("status_code", "VARCHAR(10)", "Channel status", False),
            ],
        },
        {
            "name": "DIM_TIME",
            "type": "dimension",
            "columns": [
                ("time_key", "NUMBER", "Surrogate key (YYYYMMDD)", False),
                ("calendar_date", "DATE", "Calendar date", False),
                ("day_of_week", "NUMBER", "Day of week (1-7)", False),
                ("day_name", "VARCHAR(10)", "Day name", False),
                ("month_number", "NUMBER", "Month number", False),
                ("month_name", "VARCHAR(15)", "Month name", False),
                ("quarter_number", "NUMBER", "Quarter number", False),
                ("quarter_name", "VARCHAR(5)", "Quarter name (Q1-Q4)", False),
                ("year_number", "NUMBER", "Calendar year", False),
                ("fiscal_year", "NUMBER", "Fiscal year", False),
                ("fiscal_quarter", "NUMBER", "Fiscal quarter", False),
                ("is_business_day", "CHAR(1)", "Business day flag", False),
                ("is_month_end", "CHAR(1)", "Month end flag", False),
                ("is_quarter_end", "CHAR(1)", "Quarter end flag", False),
                ("is_year_end", "CHAR(1)", "Year end flag", False),
                ("hijri_date", "VARCHAR(10)", "Hijri calendar date", True),
                ("hijri_month", "VARCHAR(30)", "Hijri month name", True),
            ],
        },
        {
            "name": "DIM_AGREEMENT",
            "type": "dimension",
            "columns": [
                ("agreement_key", "NUMBER", "Surrogate key", False),
                ("agreement_id", "VARCHAR(20)", "Agreement identifier", False),
                ("agreement_type_code", "VARCHAR(10)", "Agreement type", False),
                ("agreement_status", "VARCHAR(20)", "Agreement status", False),
                ("effective_date", "DATE", "Agreement start date", False),
                ("maturity_date", "DATE", "Agreement maturity date", False),
                ("original_term_months", "NUMBER", "Original term in months", False),
                ("remaining_term_months", "NUMBER", "Remaining term in months", False),
                ("interest_rate_type", "VARCHAR(10)", "Fixed/Variable/Islamic", False),
                ("contracted_rate", "DECIMAL(8,6)", "Contracted interest/profit rate", False),
                ("is_islamic_contract", "CHAR(1)", "Islamic contract flag", True),
                ("islamic_contract_type", "VARCHAR(30)", "Murabaha/Ijara/Musharaka etc", True),
            ],
        },
    ],
    "aggregates": [
        {
            "name": "AGG_BRANCH_PROFITABILITY",
            "type": "aggregate",
            "columns": [
                ("branch_key", "NUMBER", "Branch dimension key", False),
                ("time_key", "NUMBER", "Time dimension key (monthly)", False),
                ("total_customers", "NUMBER", "Total active customers", False),
                ("total_accounts", "NUMBER", "Total active accounts", False),
                ("total_revenue", "DECIMAL(18,2)", "Total branch revenue", False),
                ("total_cost", "DECIMAL(18,2)", "Total branch cost", False),
                ("net_profit", "DECIMAL(18,2)", "Branch net profit", False),
                ("cost_to_income_ratio", "DECIMAL(5,4)", "Cost to income ratio", False),
                ("avg_revenue_per_customer", "DECIMAL(18,2)", "Average revenue per customer", False),
                ("total_rwa", "DECIMAL(18,2)", "Total risk-weighted assets", False),
                ("branch_raroc", "DECIMAL(8,4)", "Branch-level RAROC", False),
                ("islamic_revenue_share", "DECIMAL(5,4)", "Islamic revenue as % of total", True),
            ],
        },
        {
            "name": "AGG_SEGMENT_PROFITABILITY",
            "type": "aggregate",
            "columns": [
                ("segment_key", "NUMBER", "Segment dimension key", False),
                ("product_key", "NUMBER", "Product dimension key", False),
                ("time_key", "NUMBER", "Time dimension key (monthly)", False),
                ("customer_count", "NUMBER", "Number of customers", False),
                ("total_balance", "DECIMAL(18,2)", "Total balances", False),
                ("total_revenue", "DECIMAL(18,2)", "Segment revenue", False),
                ("total_cost", "DECIMAL(18,2)", "Segment cost", False),
                ("net_profit", "DECIMAL(18,2)", "Segment net profit", False),
                ("nim_pct", "DECIMAL(5,4)", "Net interest margin %", False),
                ("segment_raroc", "DECIMAL(8,4)", "Segment-level RAROC", False),
            ],
        },
    ],
    "views": [
        {
            "name": "VW_CUSTOMER_PL",
            "type": "view",
            "columns": [
                ("customer_id", "VARCHAR(20)", "Customer identifier", False),
                ("customer_name", "VARCHAR(200)", "Customer name", False),
                ("segment_name", "VARCHAR(100)", "Segment name", False),
                ("total_revenue", "DECIMAL(18,2)", "Total customer revenue", False),
                ("net_interest_income", "DECIMAL(18,2)", "Net interest income", False),
                ("fee_income", "DECIMAL(18,2)", "Fee income", False),
                ("total_cost", "DECIMAL(18,2)", "Total allocated cost", False),
                ("net_profit", "DECIMAL(18,2)", "Customer net profit", False),
                ("raroc", "DECIMAL(8,4)", "Customer RAROC", False),
                ("product_count", "NUMBER", "Products held", False),
                ("relationship_tenure_months", "NUMBER", "Tenure in months", False),
            ],
        },
        {
            "name": "VW_PRODUCT_PL",
            "type": "view",
            "columns": [
                ("product_name", "VARCHAR(200)", "Product name", False),
                ("product_category", "VARCHAR(50)", "Product category", False),
                ("customer_count", "NUMBER", "Number of customers", False),
                ("total_balance", "DECIMAL(18,2)", "Total balances", False),
                ("total_revenue", "DECIMAL(18,2)", "Product revenue", False),
                ("total_cost", "DECIMAL(18,2)", "Product cost", False),
                ("net_profit", "DECIMAL(18,2)", "Product net profit", False),
                ("margin_pct", "DECIMAL(5,4)", "Profit margin %", False),
                ("market_share_pct", "DECIMAL(5,2)", "Estimated market share %", False),
            ],
        },
        {
            "name": "VW_ISLAMIC_VS_CONVENTIONAL",
            "type": "view",
            "columns": [
                ("banking_mode", "VARCHAR(20)", "Islamic or Conventional", True),
                ("segment_name", "VARCHAR(100)", "Business segment", False),
                ("customer_count", "NUMBER", "Number of customers", False),
                ("total_assets", "DECIMAL(18,2)", "Total assets", False),
                ("total_deposits", "DECIMAL(18,2)", "Total deposits", False),
                ("total_financing", "DECIMAL(18,2)", "Total financing/lending", False),
                ("total_revenue", "DECIMAL(18,2)", "Total revenue", False),
                ("net_profit", "DECIMAL(18,2)", "Net profit", False),
                ("cost_to_income", "DECIMAL(5,4)", "Cost to income ratio", False),
                ("asset_quality_ratio", "DECIMAL(5,4)", "NPL/NPF ratio", False),
                ("capital_adequacy_ratio", "DECIMAL(5,4)", "CAR", False),
            ],
        },
    ],
}


# ===================================================================
# Gap extensions definition
# ===================================================================

GAP_MODULES = [
    {
        "id": "GAP1",
        "name": "Activity Based Costing",
        "description": "Extensions for activity-based cost allocation, resource drivers, and cost pool management for accurate product and customer profitability analysis.",
        "tables": [
            {
                "name": "GAP_ABC_ACTIVITY",
                "columns": [
                    ("activity_id", "VARCHAR(20)", "Unique activity identifier"),
                    ("activity_name", "VARCHAR(200)", "Name of the activity"),
                    ("activity_type_code", "VARCHAR(10)", "Activity type classification"),
                    ("cost_pool_id", "VARCHAR(20)", "Associated cost pool"),
                    ("unit_cost", "DECIMAL(18,6)", "Cost per unit of activity"),
                    ("cost_driver_code", "VARCHAR(20)", "Primary cost driver"),
                    ("department_code", "VARCHAR(10)", "Owning department"),
                    ("effective_date", "DATE", "Effective from date"),
                    ("status_code", "VARCHAR(10)", "Active/Inactive status"),
                ],
            },
            {
                "name": "GAP_ABC_COST_POOL",
                "columns": [
                    ("cost_pool_id", "VARCHAR(20)", "Unique cost pool identifier"),
                    ("cost_pool_name", "VARCHAR(200)", "Cost pool description"),
                    ("cost_pool_type", "VARCHAR(20)", "Direct/Indirect/Overhead"),
                    ("total_amount", "DECIMAL(18,2)", "Total pool amount"),
                    ("allocation_method", "VARCHAR(20)", "Allocation methodology"),
                    ("gl_account_id", "VARCHAR(20)", "Linked GL account"),
                    ("period_code", "VARCHAR(10)", "Accounting period"),
                ],
            },
            {
                "name": "GAP_ABC_COST_DRIVER",
                "columns": [
                    ("driver_id", "VARCHAR(20)", "Cost driver identifier"),
                    ("driver_name", "VARCHAR(200)", "Cost driver description"),
                    ("driver_type", "VARCHAR(20)", "Volume/Duration/Intensity"),
                    ("unit_of_measure", "VARCHAR(20)", "Unit of measure"),
                    ("source_system", "VARCHAR(50)", "Source system for driver data"),
                ],
            },
            {
                "name": "GAP_ABC_ALLOCATION",
                "columns": [
                    ("allocation_id", "VARCHAR(20)", "Allocation record identifier"),
                    ("cost_pool_id", "VARCHAR(20)", "Source cost pool"),
                    ("target_type", "VARCHAR(20)", "Product/Customer/Channel"),
                    ("target_id", "VARCHAR(20)", "Target entity identifier"),
                    ("allocated_amount", "DECIMAL(18,2)", "Allocated cost amount"),
                    ("driver_volume", "DECIMAL(18,4)", "Driver volume used"),
                    ("allocation_date", "DATE", "Allocation processing date"),
                    ("period_code", "VARCHAR(10)", "Accounting period"),
                ],
            },
            {
                "name": "GAP_ABC_PRODUCT_COST",
                "columns": [
                    ("product_id", "VARCHAR(20)", "Product identifier"),
                    ("period_code", "VARCHAR(10)", "Accounting period"),
                    ("direct_cost", "DECIMAL(18,2)", "Direct costs allocated"),
                    ("indirect_cost", "DECIMAL(18,2)", "Indirect costs allocated"),
                    ("overhead_cost", "DECIMAL(18,2)", "Overhead costs allocated"),
                    ("total_abc_cost", "DECIMAL(18,2)", "Total ABC cost"),
                    ("unit_cost", "DECIMAL(18,6)", "Cost per product unit"),
                    ("customer_count", "NUMBER", "Number of customers using product"),
                ],
            },
            {
                "name": "GAP_ABC_CUSTOMER_COST",
                "columns": [
                    ("customer_id", "VARCHAR(20)", "Customer identifier"),
                    ("period_code", "VARCHAR(10)", "Accounting period"),
                    ("servicing_cost", "DECIMAL(18,2)", "Customer servicing cost"),
                    ("transaction_cost", "DECIMAL(18,2)", "Transaction processing cost"),
                    ("channel_cost", "DECIMAL(18,2)", "Channel usage cost"),
                    ("compliance_cost", "DECIMAL(18,2)", "Compliance-related cost"),
                    ("total_abc_cost", "DECIMAL(18,2)", "Total customer ABC cost"),
                    ("activity_count", "NUMBER", "Number of activities consumed"),
                ],
            },
        ],
    },
    {
        "id": "GAP2",
        "name": "Customer Lifetime Value",
        "description": "Extensions for calculating and tracking customer lifetime value, including predictive models, revenue forecasting, and retention economics.",
        "tables": [
            {
                "name": "GAP_CLV_SCORE",
                "columns": [
                    ("customer_id", "VARCHAR(20)", "Customer identifier"),
                    ("calculation_date", "DATE", "CLV calculation date"),
                    ("clv_amount", "DECIMAL(18,2)", "Predicted lifetime value"),
                    ("clv_percentile", "NUMBER", "CLV percentile rank"),
                    ("expected_tenure_months", "NUMBER", "Expected remaining tenure"),
                    ("churn_probability", "DECIMAL(5,4)", "Probability of churn"),
                    ("revenue_forecast_12m", "DECIMAL(18,2)", "12-month revenue forecast"),
                    ("model_version", "VARCHAR(20)", "CLV model version used"),
                    ("confidence_score", "DECIMAL(5,4)", "Model confidence score"),
                ],
            },
            {
                "name": "GAP_CLV_REVENUE_STREAM",
                "columns": [
                    ("customer_id", "VARCHAR(20)", "Customer identifier"),
                    ("revenue_type_code", "VARCHAR(20)", "NII/Fee/FX/Trading/Other"),
                    ("period_code", "VARCHAR(10)", "Accounting period"),
                    ("actual_amount", "DECIMAL(18,2)", "Actual revenue amount"),
                    ("forecast_amount", "DECIMAL(18,2)", "Forecasted revenue"),
                    ("variance_amount", "DECIMAL(18,2)", "Forecast variance"),
                    ("growth_rate", "DECIMAL(8,4)", "Period-over-period growth rate"),
                ],
            },
            {
                "name": "GAP_CLV_COHORT",
                "columns": [
                    ("cohort_id", "VARCHAR(20)", "Cohort identifier"),
                    ("cohort_type", "VARCHAR(20)", "Vintage/Segment/Product"),
                    ("cohort_start_date", "DATE", "Cohort start date"),
                    ("initial_customer_count", "NUMBER", "Starting customer count"),
                    ("current_customer_count", "NUMBER", "Current customer count"),
                    ("avg_clv", "DECIMAL(18,2)", "Average CLV of cohort"),
                    ("retention_rate", "DECIMAL(5,4)", "Cohort retention rate"),
                    ("avg_product_holding", "DECIMAL(5,2)", "Avg products per customer"),
                ],
            },
        ],
    },
    {
        "id": "GAP3",
        "name": "Budgets & Forecasts",
        "description": "Extensions for multi-dimensional budgeting, rolling forecasts, variance analysis, and financial planning across organizational hierarchies.",
        "tables": [
            {
                "name": "GAP_BUDGET_HEADER",
                "columns": [
                    ("budget_id", "VARCHAR(20)", "Budget identifier"),
                    ("budget_name", "VARCHAR(200)", "Budget description"),
                    ("budget_type_code", "VARCHAR(10)", "Annual/Quarterly/Rolling"),
                    ("fiscal_year", "NUMBER", "Fiscal year"),
                    ("version_number", "NUMBER", "Budget version"),
                    ("status_code", "VARCHAR(10)", "Draft/Approved/Final"),
                    ("approved_by", "VARCHAR(50)", "Approver identifier"),
                    ("approval_date", "DATE", "Approval date"),
                ],
            },
            {
                "name": "GAP_BUDGET_LINE",
                "columns": [
                    ("budget_id", "VARCHAR(20)", "Budget identifier"),
                    ("line_id", "VARCHAR(20)", "Budget line identifier"),
                    ("gl_account_id", "VARCHAR(20)", "GL account"),
                    ("cost_center_code", "VARCHAR(10)", "Cost center"),
                    ("period_code", "VARCHAR(10)", "Budget period"),
                    ("budget_amount", "DECIMAL(18,2)", "Budgeted amount"),
                    ("forecast_amount", "DECIMAL(18,2)", "Latest forecast amount"),
                    ("actual_amount", "DECIMAL(18,2)", "Actual amount"),
                    ("variance_amount", "DECIMAL(18,2)", "Variance to budget"),
                    ("variance_pct", "DECIMAL(8,4)", "Variance percentage"),
                ],
            },
            {
                "name": "GAP_FORECAST_SCENARIO",
                "columns": [
                    ("scenario_id", "VARCHAR(20)", "Scenario identifier"),
                    ("scenario_name", "VARCHAR(200)", "Scenario description"),
                    ("scenario_type", "VARCHAR(20)", "Base/Optimistic/Pessimistic/Stress"),
                    ("probability_weight", "DECIMAL(5,4)", "Probability weighting"),
                    ("created_date", "DATE", "Scenario creation date"),
                    ("assumptions", "VARCHAR(2000)", "Key scenario assumptions"),
                ],
            },
            {
                "name": "GAP_ROLLING_FORECAST",
                "columns": [
                    ("forecast_id", "VARCHAR(20)", "Forecast identifier"),
                    ("scenario_id", "VARCHAR(20)", "Linked scenario"),
                    ("gl_account_id", "VARCHAR(20)", "GL account"),
                    ("cost_center_code", "VARCHAR(10)", "Cost center"),
                    ("forecast_period", "VARCHAR(10)", "Forecast period"),
                    ("forecast_amount", "DECIMAL(18,2)", "Forecasted amount"),
                    ("confidence_level", "DECIMAL(5,4)", "Forecast confidence"),
                    ("forecast_date", "DATE", "Date forecast was generated"),
                    ("model_code", "VARCHAR(20)", "Forecasting model used"),
                ],
            },
        ],
    },
    {
        "id": "GAP4",
        "name": "Business Process Management",
        "description": "Extensions for modeling, measuring, and optimizing banking business processes including SLA tracking, bottleneck analysis, and process mining.",
        "tables": [
            {
                "name": "GAP_BPM_PROCESS",
                "columns": [
                    ("process_id", "VARCHAR(20)", "Process identifier"),
                    ("process_name", "VARCHAR(200)", "Process name"),
                    ("process_category", "VARCHAR(50)", "Process category"),
                    ("owner_id", "VARCHAR(20)", "Process owner"),
                    ("sla_target_minutes", "NUMBER", "SLA target duration"),
                    ("automation_pct", "DECIMAL(5,2)", "Automation percentage"),
                    ("is_customer_facing", "CHAR(1)", "Customer-facing flag"),
                    ("regulatory_flag", "CHAR(1)", "Regulatory process flag"),
                ],
            },
            {
                "name": "GAP_BPM_PROCESS_INSTANCE",
                "columns": [
                    ("instance_id", "VARCHAR(20)", "Process instance identifier"),
                    ("process_id", "VARCHAR(20)", "Process definition"),
                    ("start_timestamp", "TIMESTAMP", "Instance start time"),
                    ("end_timestamp", "TIMESTAMP", "Instance end time"),
                    ("duration_minutes", "NUMBER", "Total duration"),
                    ("status_code", "VARCHAR(10)", "Completed/Failed/In-Progress"),
                    ("initiated_by", "VARCHAR(20)", "Initiator identifier"),
                    ("channel_code", "VARCHAR(10)", "Originating channel"),
                    ("sla_breach_flag", "CHAR(1)", "SLA breach indicator"),
                    ("exception_count", "NUMBER", "Number of exceptions"),
                ],
            },
            {
                "name": "GAP_BPM_STEP_LOG",
                "columns": [
                    ("log_id", "VARCHAR(20)", "Step log identifier"),
                    ("instance_id", "VARCHAR(20)", "Process instance"),
                    ("step_name", "VARCHAR(100)", "Process step name"),
                    ("step_sequence", "NUMBER", "Step sequence number"),
                    ("step_start", "TIMESTAMP", "Step start timestamp"),
                    ("step_end", "TIMESTAMP", "Step end timestamp"),
                    ("step_duration_minutes", "NUMBER", "Step duration"),
                    ("performed_by", "VARCHAR(20)", "Performer identifier"),
                    ("is_automated", "CHAR(1)", "Automated step flag"),
                    ("outcome_code", "VARCHAR(10)", "Step outcome"),
                ],
            },
            {
                "name": "GAP_BPM_BOTTLENECK",
                "columns": [
                    ("analysis_id", "VARCHAR(20)", "Analysis identifier"),
                    ("process_id", "VARCHAR(20)", "Process identifier"),
                    ("step_name", "VARCHAR(100)", "Bottleneck step"),
                    ("analysis_period", "VARCHAR(10)", "Analysis period"),
                    ("avg_wait_minutes", "DECIMAL(10,2)", "Average wait time"),
                    ("avg_processing_minutes", "DECIMAL(10,2)", "Average processing time"),
                    ("volume_count", "NUMBER", "Instance volume"),
                    ("sla_breach_rate", "DECIMAL(5,4)", "SLA breach rate"),
                    ("recommendation", "VARCHAR(500)", "Improvement recommendation"),
                ],
            },
        ],
    },
    {
        "id": "GAP5",
        "name": "Operational Metrics",
        "description": "Extensions for capturing, storing, and analyzing operational KPIs, service levels, and efficiency metrics across banking operations.",
        "tables": [
            {
                "name": "GAP_OPS_METRIC_DEF",
                "columns": [
                    ("metric_id", "VARCHAR(20)", "Metric identifier"),
                    ("metric_name", "VARCHAR(200)", "Metric name"),
                    ("metric_category", "VARCHAR(50)", "Category classification"),
                    ("unit_of_measure", "VARCHAR(20)", "Unit of measure"),
                    ("target_value", "DECIMAL(18,4)", "Target threshold"),
                    ("warning_threshold", "DECIMAL(18,4)", "Warning threshold"),
                    ("critical_threshold", "DECIMAL(18,4)", "Critical threshold"),
                    ("direction", "VARCHAR(10)", "Higher-Better/Lower-Better"),
                    ("frequency_code", "VARCHAR(10)", "Measurement frequency"),
                ],
            },
            {
                "name": "GAP_OPS_METRIC_VALUE",
                "columns": [
                    ("metric_id", "VARCHAR(20)", "Metric identifier"),
                    ("measurement_date", "DATE", "Measurement date"),
                    ("dimension_code", "VARCHAR(20)", "Branch/Channel/Product"),
                    ("dimension_value", "VARCHAR(20)", "Dimension value"),
                    ("metric_value", "DECIMAL(18,4)", "Measured value"),
                    ("target_value", "DECIMAL(18,4)", "Target for period"),
                    ("variance_pct", "DECIMAL(8,4)", "Variance to target"),
                    ("trend_indicator", "CHAR(1)", "U=Up, D=Down, S=Stable"),
                ],
            },
            {
                "name": "GAP_OPS_SLA_TRACKING",
                "columns": [
                    ("sla_id", "VARCHAR(20)", "SLA identifier"),
                    ("service_name", "VARCHAR(200)", "Service name"),
                    ("sla_type", "VARCHAR(20)", "Response/Resolution/Availability"),
                    ("target_value", "DECIMAL(10,2)", "SLA target"),
                    ("actual_value", "DECIMAL(10,2)", "Actual performance"),
                    ("measurement_period", "VARCHAR(10)", "Measurement period"),
                    ("breach_count", "NUMBER", "Number of breaches"),
                    ("total_instances", "NUMBER", "Total instances measured"),
                    ("compliance_pct", "DECIMAL(5,4)", "SLA compliance rate"),
                ],
            },
            {
                "name": "GAP_OPS_EFFICIENCY",
                "columns": [
                    ("efficiency_id", "VARCHAR(20)", "Record identifier"),
                    ("department_code", "VARCHAR(10)", "Department code"),
                    ("process_id", "VARCHAR(20)", "Process identifier"),
                    ("period_code", "VARCHAR(10)", "Measurement period"),
                    ("fte_count", "DECIMAL(8,2)", "FTE count"),
                    ("volume_processed", "NUMBER", "Volume processed"),
                    ("cost_per_unit", "DECIMAL(18,6)", "Cost per unit processed"),
                    ("automation_rate", "DECIMAL(5,4)", "Automation rate"),
                    ("error_rate", "DECIMAL(5,4)", "Error/rework rate"),
                    ("straight_through_rate", "DECIMAL(5,4)", "STP rate"),
                ],
            },
        ],
    },
]

# ===================================================================
# Pakistan context definition
# ===================================================================

PAKISTAN_CONTEXT = {
    "regulatoryFramework": {
        "centralBank": "State Bank of Pakistan (SBP)",
        "bankingLicenseTypes": [
            "Commercial Bank", "Microfinance Bank", "Development Finance Institution",
            "Islamic Bank (Full)", "Islamic Banking Window",
        ],
        "keyRegulations": [
            {"code": "BPRD", "name": "Banking Policy & Regulations Department Circulars",
             "description": "Core banking regulatory framework issued by SBP"},
            {"code": "BSD", "name": "Banking Supervision Department Guidelines",
             "description": "Prudential supervision and compliance requirements"},
            {"code": "EPD", "name": "Exchange Policy Department Circulars",
             "description": "Foreign exchange regulations and controls"},
            {"code": "IBD", "name": "Islamic Banking Department Circulars",
             "description": "Shariah compliance framework and Islamic banking standards"},
            {"code": "PSD", "name": "Payment Systems Department",
             "description": "Payment system regulations including RTGS, PRISM, and retail payments"},
            {"code": "AML_CFT", "name": "Anti-Money Laundering & Counter Financing of Terrorism",
             "description": "AML/CFT regulations aligned with FATF recommendations"},
        ],
        "reportingRequirements": [
            "Daily Statement of Affairs (DSA)",
            "Weekly Statement of Position",
            "Monthly BPRD Returns",
            "Quarterly BSD Returns",
            "Semi-Annual Islamic Banking Bulletin Data",
            "Annual Financial Statements (IFRS/IAS compliant)",
            "Basel III Capital Adequacy Reports",
            "Liquidity Coverage Ratio (LCR) Reports",
            "Net Stable Funding Ratio (NSFR) Reports",
            "Large Exposure Reports",
            "FATCA/CRS Reports",
        ],
        "capitalRequirements": {
            "minimumPaidUpCapital": "PKR 10 Billion (commercial banks)",
            "minimumCARatio": "11.5% (including CCB of 2.5%)",
            "tier1Minimum": "6.0%",
            "cet1Minimum": "4.5%",
            "leverageRatio": "3.0% minimum",
        },
    },
    "industryMetrics": {
        "totalBanks": 33,
        "islamicBanks": 5,
        "islamicBankingWindows": 17,
        "totalBranches": 16200,
        "islamicBankingBranches": 4100,
        "totalAssetsPKRTrillions": 32.5,
        "islamicBankingSharePct": 20.4,
        "depositsPKRTrillions": 24.8,
        "advancesPKRTrillions": 12.3,
        "averageCARPct": 17.2,
        "averageROAPct": 1.3,
        "averageROEPct": 22.5,
        "nplRatioPct": 7.4,
        "costToIncomeRatioPct": 52.3,
    },
    "islamicBankingModes": [
        {"mode": "Murabaha", "description": "Cost-plus sale financing",
         "typicalUse": "Trade finance, auto financing, consumer goods"},
        {"mode": "Ijara", "description": "Lease-based financing",
         "typicalUse": "Equipment leasing, property financing"},
        {"mode": "Musharaka", "description": "Partnership-based financing",
         "typicalUse": "Home financing, project financing, working capital"},
        {"mode": "Diminishing Musharaka", "description": "Declining partnership with gradual ownership transfer",
         "typicalUse": "Home financing, property acquisition"},
        {"mode": "Mudaraba", "description": "Profit-sharing investment partnership",
         "typicalUse": "Deposit accounts, investment accounts"},
        {"mode": "Istisna", "description": "Manufacturing/construction financing",
         "typicalUse": "Construction financing, manufacturing orders"},
        {"mode": "Salam", "description": "Advance payment for future delivery",
         "typicalUse": "Agricultural financing, commodity financing"},
        {"mode": "Wakalah", "description": "Agency-based arrangement",
         "typicalUse": "Investment management, treasury placements"},
        {"mode": "Sukuk", "description": "Islamic bonds/certificates",
         "typicalUse": "Capital market instruments, government securities"},
        {"mode": "Takaful", "description": "Islamic insurance",
         "typicalUse": "Life and general insurance coverage"},
    ],
    "paymentEcosystem": {
        "rtgsSystem": "PRISM (Pakistan Real-Time Interbank Settlement Mechanism)",
        "retailPayments": [
            {"name": "1LINK", "type": "ATM/POS Switch", "description": "National interbank ATM and POS switching network"},
            {"name": "NIFT", "type": "Clearing House", "description": "National Institutional Facilitation Technologies - cheque clearing"},
            {"name": "Raast", "type": "Instant Payment System", "description": "SBP's instant payment system for person-to-person transfers"},
            {"name": "IBFT", "type": "Interbank Fund Transfer", "description": "Interbank fund transfer via internet/mobile banking"},
        ],
        "digitalBankingPenetration": {
            "internetBankingUsers": "12.5 million",
            "mobileBankingUsers": "18.2 million",
            "eCommerceTransactions": "PKR 180 billion annually",
            "mobileWalletAccounts": "55 million",
            "brachlessBankingAgents": 540000,
        },
        "currencyCode": "PKR",
        "currencyName": "Pakistan Rupee",
    },
}

# ===================================================================
# Lineage definitions
# ===================================================================

LINEAGE_ENTRIES = [
    ("Party", "party_id", "DIM_CUSTOMER", "customer_id", "DIRECT_MAP"),
    ("Individual", "full_name", "DIM_CUSTOMER", "customer_name", "CONCAT(first_name, ' ', last_name)"),
    ("Party_Segment", "segment_code", "DIM_CUSTOMER", "segment_code", "LOOKUP(segment_mapping)"),
    ("Party_Risk_Rating", "risk_rating_code", "DIM_CUSTOMER", "risk_rating", "DECODE(risk_scale)"),
    ("Product", "product_id", "DIM_PRODUCT", "product_id", "DIRECT_MAP"),
    ("Product", "product_name", "DIM_PRODUCT", "product_name", "DIRECT_MAP"),
    ("Product_Category", "category_code", "DIM_PRODUCT", "product_category", "LOOKUP(category_ref)"),
    ("Branch", "branch_code", "DIM_BRANCH", "branch_code", "DIRECT_MAP"),
    ("Branch", "branch_name", "DIM_BRANCH", "branch_name", "DIRECT_MAP"),
    ("Region", "region_code", "DIM_BRANCH", "region_code", "DIRECT_MAP"),
    ("Agreement", "agreement_id", "DIM_AGREEMENT", "agreement_id", "DIRECT_MAP"),
    ("Agreement_Term", "maturity_date", "DIM_AGREEMENT", "maturity_date", "DIRECT_MAP"),
    ("Account_Balance", "current_balance", "FACT_CUSTOMER_PROFITABILITY", "eop_balance", "SUM(balances) as of period end"),
    ("Transaction", "transaction_amount", "FACT_CUSTOMER_PROFITABILITY", "total_revenue", "SUM(credit_transactions) by customer"),
    ("GL_Account", "balance_amount", "FACT_CUSTOMER_PROFITABILITY", "net_interest_income", "FTP_CALC(balance, rate, tenor)"),
    ("Fee_Calculation", "fee_amount", "FACT_CUSTOMER_PROFITABILITY", "fee_income", "SUM(fees) by customer by period"),
    ("Cost_Center", "cost_amount", "FACT_CUSTOMER_PROFITABILITY", "direct_cost", "ABC_ALLOCATE(cost_pool, driver)"),
    ("Risk_Assessment", "risk_weight", "FACT_CUSTOMER_PROFITABILITY", "risk_weighted_assets", "CALC(exposure * risk_weight)"),
    ("Risk_Assessment", "expected_loss", "FACT_CUSTOMER_PROFITABILITY", "provision_charge", "ECL_CALC(PD, LGD, EAD)"),
    ("Channel_Session", "session_count", "FACT_CUSTOMER_PROFITABILITY", "digital_transaction_count", "COUNT(digital_sessions) by customer"),
    ("Party_KYC_Record", "kyc_status_code", "DIM_CUSTOMER", "kyc_status", "LATEST_STATUS(kyc_reviews)"),
    ("Collateral_Valuation", "valuation_amount", "FACT_CUSTOMER_PROFITABILITY", "ltv_ratio", "CALC(outstanding / collateral_value)"),
    ("Calendar", "business_day_flag", "DIM_TIME", "is_business_day", "DIRECT_MAP"),
]


# ===================================================================
# GENERATION FUNCTIONS
# ===================================================================

def generate_domains():
    """Generate domains.json"""
    domains = []
    for i, (name, entity_count, color, desc) in enumerate(DOMAIN_DEFS, start=1):
        domains.append({
            "id": i,
            "name": name,
            "description": desc,
            "entityCount": entity_count,
            "color": color,
        })
    write_json("domains.json", domains)
    return domains


def generate_entities(domains):
    """Generate entities.json — 3917 entities across 16 domains."""
    entities = []
    entity_id = 1
    domain_entity_map = {}  # domain_name -> list of (id, name)

    for d in domains:
        dname = d["name"]
        count = d["entityCount"]
        names = _generate_entity_names(dname, count)
        domain_entity_map[dname] = []
        for name in names:
            attr_count = random.randint(3, 6)
            entities.append({
                "id": entity_id,
                "name": name,
                "domain": dname,
                "description": f"{name.replace('_', ' ')} entity within the {dname} subject area.",
                "attributeCount": attr_count,
            })
            domain_entity_map[dname].append((entity_id, name))
            entity_id += 1

    assert len(entities) == 3917, f"Expected 3917 entities, got {len(entities)}"
    write_json("entities.json", entities)
    return entities, domain_entity_map


def generate_attributes(entities):
    """Generate attributes.json — targeting 15364 attributes total."""
    target_total = 15364
    # First pass: use each entity's attributeCount
    attrs = []
    total_from_entities = sum(e["attributeCount"] for e in entities)

    # We need to adjust attribute counts to hit 15364
    # Average per entity ~ 3.92
    # We'll generate per entity and then add/trim to hit target
    for e in entities:
        domain = e["domain"]
        pool = DOMAIN_ATTR_POOLS.get(domain, DOMAIN_ATTR_POOLS["Other"])
        n = e["attributeCount"]
        chosen = []
        available = list(COMMON_ATTR_NAMES) + list(pool)
        random.shuffle(available)
        for a in available:
            if len(chosen) >= n:
                break
            if a not in chosen:
                chosen.append(a)
        # Pad if needed
        while len(chosen) < n:
            chosen.append(f"attribute_{len(chosen)+1}")

        for aname in chosen:
            dt = random.choices(DATA_TYPES, weights=DATA_TYPE_WEIGHTS, k=1)[0]
            nullable = random.random() > 0.3
            attrs.append({
                "entityId": e["id"],
                "entityName": e["name"],
                "name": aname,
                "dataType": dt,
                "nullable": nullable,
            })

    # Adjust to hit exactly 15364
    current = len(attrs)
    if current < target_total:
        # Add more attributes to random entities
        diff = target_total - current
        ent_sample = random.choices(entities, k=diff)
        for e in ent_sample:
            domain = e["domain"]
            pool = DOMAIN_ATTR_POOLS.get(domain, DOMAIN_ATTR_POOLS["Other"])
            aname = random.choice(pool + COMMON_ATTR_NAMES)
            dt = random.choices(DATA_TYPES, weights=DATA_TYPE_WEIGHTS, k=1)[0]
            attrs.append({
                "entityId": e["id"],
                "entityName": e["name"],
                "name": f"{aname}_ext",
                "dataType": dt,
                "nullable": random.random() > 0.3,
            })
    elif current > target_total:
        attrs = attrs[:target_total]

    assert len(attrs) == target_total, f"Expected {target_total} attrs, got {len(attrs)}"
    write_json("attributes.json", attrs)
    return attrs


def generate_relationships(entities):
    """Generate relationships.json — 5636 parent-child relationships."""
    target = 5636
    rel_types = ["contains", "references", "inherits", "associates"]
    rel_type_weights = [30, 40, 15, 15]
    rels = []
    seen = set()

    # Build domain groups for more realistic relationships
    domain_groups = {}
    for e in entities:
        domain_groups.setdefault(e["domain"], []).append(e)

    # Intra-domain relationships (70%)
    intra_target = int(target * 0.7)
    attempts = 0
    while len(rels) < intra_target and attempts < intra_target * 5:
        attempts += 1
        domain = random.choice(list(domain_groups.keys()))
        group = domain_groups[domain]
        if len(group) < 2:
            continue
        parent, child = random.sample(group, 2)
        key = (parent["id"], child["id"])
        if key in seen or key == (child["id"], parent["id"]):
            continue
        seen.add(key)
        rt = random.choices(rel_types, weights=rel_type_weights, k=1)[0]
        rels.append({
            "parentId": parent["id"],
            "parentName": parent["name"],
            "childId": child["id"],
            "childName": child["name"],
            "type": rt,
        })

    # Cross-domain relationships (30%)
    attempts = 0
    while len(rels) < target and attempts < target * 5:
        attempts += 1
        d1, d2 = random.sample(list(domain_groups.keys()), 2)
        parent = random.choice(domain_groups[d1])
        child = random.choice(domain_groups[d2])
        key = (parent["id"], child["id"])
        if key in seen:
            continue
        seen.add(key)
        rt = random.choices(rel_types, weights=rel_type_weights, k=1)[0]
        rels.append({
            "parentId": parent["id"],
            "parentName": parent["name"],
            "childId": child["id"],
            "childName": child["name"],
            "type": rt,
        })

    rels = rels[:target]
    assert len(rels) == target, f"Expected {target} rels, got {len(rels)}"
    write_json("relationships.json", rels)
    return rels


def generate_capabilities():
    """Generate capabilities.json — 112 sub-capabilities."""
    caps = []
    cap_id = 1
    theme_id = 1
    group_id = 1
    phases = ["Phase 1", "Phase 2", "Phase 3"]

    for theme_name, groups in CAPABILITY_STRUCTURE.items():
        current_theme_id = theme_id
        for group_name, sub_caps in groups.items():
            current_group_id = group_id
            for sc_name in sub_caps:
                caps.append({
                    "id": cap_id,
                    "name": sc_name,
                    "themeId": current_theme_id,
                    "themeName": theme_name,
                    "groupId": current_group_id,
                    "groupName": group_name,
                    "description": f"{sc_name} — analytics capability supporting {group_name.lower()} within {theme_name.lower()}.",
                    "dataReqCount": random.randint(1, 3),
                    "phase": random.choice(phases),
                })
                cap_id += 1
            group_id += 1
        theme_id += 1

    assert len(caps) == 112, f"Expected 112 capabilities, got {len(caps)}"
    write_json("capabilities.json", caps)
    return caps


def generate_data_requirements(capabilities):
    """Generate dataRequirements.json — 113 data requirements."""
    target = 113
    reqs = []
    req_id = 1

    subject_areas = [
        "Customer Data", "Product Data", "Transaction Data",
        "Financial Data", "Risk Data", "Channel Data",
        "Regulatory Data", "Market Data", "Reference Data",
        "Agreement Data", "Location Data", "Event Data",
    ]
    priorities = ["Critical", "High", "Medium", "Low"]
    priority_weights = [20, 35, 30, 15]

    desc_templates = [
        "Requires consolidated {sa} for {cap} analytics",
        "Needs integrated {sa} to support {cap} reporting",
        "Depends on high-quality {sa} for accurate {cap}",
        "Leverages {sa} to enable {cap} insights",
        "Utilizes {sa} as foundation for {cap} analysis",
    ]

    # Distribute requirements across capabilities
    cap_ids = [c["id"] for c in capabilities]
    # Each capability gets at least 1 requirement
    for c in capabilities:
        sa = random.choice(subject_areas)
        tmpl = random.choice(desc_templates)
        desc = tmpl.format(sa=sa, cap=c["name"])
        reqs.append({
            "id": req_id,
            "capabilityId": c["id"],
            "description": desc,
            "fsdmSubjectArea": sa,
            "priority": random.choices(priorities, weights=priority_weights, k=1)[0],
        })
        req_id += 1
        if len(reqs) >= target:
            break

    # Add remaining to reach 113
    while len(reqs) < target:
        c = random.choice(capabilities)
        sa = random.choice(subject_areas)
        tmpl = random.choice(desc_templates)
        desc = tmpl.format(sa=sa, cap=c["name"])
        reqs.append({
            "id": req_id,
            "capabilityId": c["id"],
            "description": desc,
            "fsdmSubjectArea": sa,
            "priority": random.choices(priorities, weights=priority_weights, k=1)[0],
        })
        req_id += 1

    reqs = reqs[:target]
    assert len(reqs) == target, f"Expected {target} reqs, got {len(reqs)}"
    write_json("dataRequirements.json", reqs)
    return reqs


def generate_dependencies(capabilities, entities, domain_entity_map):
    """Generate dependencies.json — 5218 capability-entity dependencies."""
    target = 5218
    deps = []
    seen = set()

    # Each capability depends on ~46 entities on average
    for cap in capabilities:
        # Pick entities weighted toward relevant domains
        theme = cap["themeName"]
        # Map themes to likely domains
        if "Marketing" in theme or "Customer" in theme:
            likely_domains = ["Party Management", "Campaign & Marketing",
                              "Channel", "Agreement & Account", "Classification & Reference"]
        elif "Finance" in theme:
            likely_domains = ["General Ledger", "Agreement & Account",
                              "Transaction", "Risk Management", "Product Management"]
        else:
            likely_domains = ["Product Management", "Agreement & Account",
                              "Financial Instrument", "Market Data", "Transaction"]

        # Always include some cross-domain
        all_domains = list(domain_entity_map.keys())
        n_deps = random.randint(30, 65)

        for _ in range(n_deps):
            if len(deps) >= target:
                break
            # 70% from likely domains, 30% from any
            if random.random() < 0.7 and likely_domains:
                domain = random.choice(likely_domains)
            else:
                domain = random.choice(all_domains)

            if domain not in domain_entity_map or not domain_entity_map[domain]:
                continue
            eid, ename = random.choice(domain_entity_map[domain])
            key = (cap["id"], eid)
            if key in seen:
                continue
            seen.add(key)
            deps.append({
                "capabilityId": cap["id"],
                "capabilityName": cap["name"],
                "entityId": eid,
                "entityName": ename,
                "domain": domain,
            })
        if len(deps) >= target:
            break

    # Fill remaining if needed
    attempts = 0
    while len(deps) < target and attempts < target * 3:
        attempts += 1
        cap = random.choice(capabilities)
        domain = random.choice(list(domain_entity_map.keys()))
        if not domain_entity_map[domain]:
            continue
        eid, ename = random.choice(domain_entity_map[domain])
        key = (cap["id"], eid)
        if key in seen:
            continue
        seen.add(key)
        deps.append({
            "capabilityId": cap["id"],
            "capabilityName": cap["name"],
            "entityId": eid,
            "entityName": ename,
            "domain": domain,
        })

    deps = deps[:target]
    assert len(deps) == target, f"Expected {target} deps, got {len(deps)}"
    write_json("dependencies.json", deps)
    return deps


def generate_reuse_scores(entities, domain_entity_map):
    """Generate reuseScores.json — 219 entities with reuse tiers."""
    # Top 10 are fixed
    top10 = [
        ("Party", 98), ("Individual", 87), ("Organization_Unit", 82),
        ("Agreement", 76), ("Account", 71), ("Transaction", 65),
        ("Product", 58), ("GL_Account", 52), ("Risk_Assessment", 47),
        ("Payment", 43),
    ]

    # Build entity name -> id map
    name_to_entity = {}
    for e in entities:
        name_to_entity[e["name"]] = e

    scores = []

    # Add top 10
    for name, reuse in top10:
        e = name_to_entity.get(name)
        if e:
            scores.append({
                "entityId": e["id"],
                "entityName": e["name"],
                "domain": e["domain"],
                "reuseCount": reuse,
                "tier": "P1",
            })

    # P1: 53 total, need 43 more with reuse 20+
    p1_remaining = 53 - len(scores)
    # P2: 56 with reuse 10-19
    # P3: 58 with reuse 5-9
    # P4: 52 with reuse 1-4

    used_ids = {s["entityId"] for s in scores}

    # Candidate entities from important domains
    important_entities = []
    for e in entities:
        if e["id"] not in used_ids:
            important_entities.append(e)

    random.shuffle(important_entities)

    # P1 remaining
    for i in range(min(p1_remaining, len(important_entities))):
        e = important_entities[i]
        scores.append({
            "entityId": e["id"],
            "entityName": e["name"],
            "domain": e["domain"],
            "reuseCount": random.randint(20, 40),
            "tier": "P1",
        })
    used_count = p1_remaining

    # P2
    for i in range(used_count, min(used_count + 56, len(important_entities))):
        e = important_entities[i]
        scores.append({
            "entityId": e["id"],
            "entityName": e["name"],
            "domain": e["domain"],
            "reuseCount": random.randint(10, 19),
            "tier": "P2",
        })
    used_count += 56

    # P3
    for i in range(used_count, min(used_count + 58, len(important_entities))):
        e = important_entities[i]
        scores.append({
            "entityId": e["id"],
            "entityName": e["name"],
            "domain": e["domain"],
            "reuseCount": random.randint(5, 9),
            "tier": "P3",
        })
    used_count += 58

    # P4
    for i in range(used_count, min(used_count + 52, len(important_entities))):
        e = important_entities[i]
        scores.append({
            "entityId": e["id"],
            "entityName": e["name"],
            "domain": e["domain"],
            "reuseCount": random.randint(1, 4),
            "tier": "P4",
        })

    scores = scores[:219]
    assert len(scores) == 219, f"Expected 219 reuse scores, got {len(scores)}"
    write_json("reuseScores.json", scores)
    return scores


def generate_reuse_matrix(capabilities):
    """Generate reuseMatrix.json — ~500 pairs with similarity."""
    target_pairs = 500
    pairs = []
    seen = set()
    cap_ids = [c["id"] for c in capabilities]

    attempts = 0
    while len(pairs) < target_pairs and attempts < target_pairs * 5:
        attempts += 1
        c1, c2 = random.sample(cap_ids, 2)
        if c1 > c2:
            c1, c2 = c2, c1
        key = (c1, c2)
        if key in seen:
            continue
        seen.add(key)
        similarity = round(random.uniform(0.1, 0.9), 3)
        pairs.append({
            "cap1Id": c1,
            "cap2Id": c2,
            "similarity": similarity,
        })

    pairs = pairs[:target_pairs]
    write_json("reuseMatrix.json", pairs)
    return pairs


def generate_lineage():
    """Generate lineage.json — 23 entries."""
    lineage = []
    for i, (src_entity, src_col, tgt_entity, tgt_col, transform) in enumerate(LINEAGE_ENTRIES, 1):
        lineage.append({
            "id": i,
            "sourceEntity": src_entity,
            "sourceColumn": src_col,
            "targetEntity": tgt_entity,
            "targetColumn": tgt_col,
            "transformation": transform,
        })
    assert len(lineage) == 23, f"Expected 23 lineage entries, got {len(lineage)}"
    write_json("lineage.json", lineage)
    return lineage


def generate_star_schema():
    """Generate starSchema.json."""
    def _build_columns(col_defs):
        return [
            {
                "name": c[0],
                "dataType": c[1],
                "description": c[2],
                "isPakistanSpecific": c[3],
            }
            for c in col_defs
        ]

    schema = {
        "factTable": {
            "name": STAR_SCHEMA_DEF["factTable"]["name"],
            "type": STAR_SCHEMA_DEF["factTable"]["type"],
            "columns": _build_columns(STAR_SCHEMA_DEF["factTable"]["columns"]),
        },
        "dimensions": [],
        "aggregates": [],
        "views": [],
    }

    for dim in STAR_SCHEMA_DEF["dimensions"]:
        schema["dimensions"].append({
            "name": dim["name"],
            "type": dim["type"],
            "columns": _build_columns(dim["columns"]),
        })

    for agg in STAR_SCHEMA_DEF["aggregates"]:
        schema["aggregates"].append({
            "name": agg["name"],
            "type": agg["type"],
            "columns": _build_columns(agg["columns"]),
        })

    for view in STAR_SCHEMA_DEF["views"]:
        schema["views"].append({
            "name": view["name"],
            "type": view["type"],
            "columns": _build_columns(view["columns"]),
        })

    write_json("starSchema.json", schema)
    return schema


def generate_gap_extensions():
    """Generate gapExtensions.json — 5 modules, 21 tables."""
    modules = []
    for gap in GAP_MODULES:
        tables = []
        for t in gap["tables"]:
            cols = [{"name": c[0], "dataType": c[1], "description": c[2]} for c in t["columns"]]
            tables.append({"name": t["name"], "columns": cols})
        modules.append({
            "id": gap["id"],
            "name": gap["name"],
            "description": gap["description"],
            "tables": tables,
        })
    # Verify 21 tables total
    total_tables = sum(len(m["tables"]) for m in modules)
    assert total_tables == 21, f"Expected 21 gap tables, got {total_tables}"
    write_json("gapExtensions.json", modules)
    return modules


def generate_bacr_questions():
    """Generate bacrQuestions.json — 793 questions across 9 categories."""
    target = 793
    questions = []
    q_id = 1

    for cat_name, cat_def in BACR_CATEGORIES.items():
        count = cat_def["count"]
        subcats = cat_def["subcategories"]
        templates = cat_def["templates"]
        topics = cat_def["topics"]

        for i in range(count):
            subcat = subcats[i % len(subcats)]
            tmpl = templates[i % len(templates)]
            topic = topics[i % len(topics)]
            text = tmpl.format(topic=topic)
            # Vary the text slightly for uniqueness
            if i >= len(topics):
                # Add qualifiers for repeat cycles
                qualifiers = [
                    "within the retail banking division",
                    "across corporate banking operations",
                    "for Islamic banking segments",
                    "in treasury and capital markets",
                    "across risk management functions",
                    "within operations and technology",
                    "for regulatory reporting purposes",
                    "in the context of digital transformation",
                    "across the enterprise data platform",
                    "within customer-facing channels",
                ]
                qualifier = qualifiers[(i // len(topics)) % len(qualifiers)]
                text = text.rstrip("?.,") + f" {qualifier}?"

            weight = round(random.uniform(0.5, 1.5), 2)
            questions.append({
                "id": q_id,
                "category": cat_name,
                "subcategory": subcat,
                "text": text,
                "weight": weight,
            })
            q_id += 1

    questions = questions[:target]
    assert len(questions) == target, f"Expected {target} BACR questions, got {len(questions)}"
    write_json("bacrQuestions.json", questions)
    return questions


def generate_pakistan_context():
    """Generate pakistanContext.json."""
    write_json("pakistanContext.json", PAKISTAN_CONTEXT)
    return PAKISTAN_CONTEXT


def generate_inheritance_tree(entities):
    """Generate inheritanceTree.json — 839 inheritance chains."""
    target = 839
    chains = []
    seen = set()

    # Build name -> entity mapping
    name_to_entity = {}
    for e in entities:
        name_to_entity[e["name"]] = e

    # Find natural inheritance patterns (entities sharing base names)
    domain_groups = {}
    for e in entities:
        domain_groups.setdefault(e["domain"], []).append(e)

    # Generate inheritance from entities with suffix patterns
    for domain, group in domain_groups.items():
        # Sort by name length (shorter = more likely parent)
        sorted_group = sorted(group, key=lambda x: len(x["name"]))
        for i, parent in enumerate(sorted_group):
            if len(chains) >= target:
                break
            pname = parent["name"]
            # Find children whose names start with parent's name
            for child in sorted_group[i + 1:]:
                if len(chains) >= target:
                    break
                cname = child["name"]
                if cname.startswith(pname + "_") and cname != pname:
                    key = (parent["id"], child["id"])
                    if key not in seen:
                        seen.add(key)
                        # Depth based on underscores difference
                        depth = cname.count("_") - pname.count("_")
                        if depth < 1:
                            depth = 1
                        if depth > 4:
                            depth = 4
                        chains.append({
                            "parentId": parent["id"],
                            "parentName": parent["name"],
                            "childId": child["id"],
                            "childName": child["name"],
                            "depth": depth,
                        })

    # Fill remaining with random inheritance links
    all_entities = list(entities)
    attempts = 0
    while len(chains) < target and attempts < target * 5:
        attempts += 1
        parent = random.choice(all_entities)
        child = random.choice(all_entities)
        if parent["id"] == child["id"]:
            continue
        key = (parent["id"], child["id"])
        if key in seen:
            continue
        # Prefer same domain
        if parent["domain"] != child["domain"] and random.random() < 0.6:
            continue
        seen.add(key)
        chains.append({
            "parentId": parent["id"],
            "parentName": parent["name"],
            "childId": child["id"],
            "childName": child["name"],
            "depth": random.randint(1, 3),
        })

    chains = chains[:target]
    assert len(chains) == target, f"Expected {target} inheritance chains, got {len(chains)}"
    write_json("inheritanceTree.json", chains)
    return chains


# ===================================================================
# MAIN
# ===================================================================

def main():
    print("=" * 60)
    print("BAIW Sample Data Generator")
    print("=" * 60)
    print()

    ensure_dirs()
    print(f"Output directory: {DATA_DIR}")
    print()

    # 1. Domains
    print("[1/15] Generating domains...")
    domains = generate_domains()

    # 2. Entities
    print("[2/15] Generating entities (3,917)...")
    entities, domain_entity_map = generate_entities(domains)

    # 3. Attributes
    print("[3/15] Generating attributes (15,364)...")
    attributes = generate_attributes(entities)

    # 4. Relationships
    print("[4/15] Generating relationships (5,636)...")
    relationships = generate_relationships(entities)

    # 5. Capabilities
    print("[5/15] Generating capabilities (112)...")
    capabilities = generate_capabilities()

    # 6. Data requirements
    print("[6/15] Generating data requirements (113)...")
    data_reqs = generate_data_requirements(capabilities)

    # 7. Dependencies
    print("[7/15] Generating dependencies (5,218)...")
    dependencies = generate_dependencies(capabilities, entities, domain_entity_map)

    # 8. Reuse scores
    print("[8/15] Generating reuse scores (219)...")
    reuse_scores = generate_reuse_scores(entities, domain_entity_map)

    # 9. Reuse matrix
    print("[9/15] Generating reuse matrix (~500 pairs)...")
    reuse_matrix = generate_reuse_matrix(capabilities)

    # 10. Lineage
    print("[10/15] Generating lineage (23)...")
    lineage = generate_lineage()

    # 11. Star schema
    print("[11/15] Generating star schema...")
    star_schema = generate_star_schema()

    # 12. Gap extensions
    print("[12/15] Generating gap extensions (5 modules, 21 tables)...")
    gap_extensions = generate_gap_extensions()

    # 13. BACR questions
    print("[13/15] Generating BACR questions (793)...")
    bacr_questions = generate_bacr_questions()

    # 14. Pakistan context
    print("[14/15] Generating Pakistan context...")
    pakistan_context = generate_pakistan_context()

    # 15. Inheritance tree
    print("[15/15] Generating inheritance tree (839)...")
    inheritance_tree = generate_inheritance_tree(entities)

    print()
    print("=" * 60)
    print("Generation complete! Summary:")
    print("=" * 60)
    print(f"  domains.json          : {len(domains)} domains")
    print(f"  entities.json         : {len(entities)} entities")
    print(f"  attributes.json       : {len(attributes)} attributes")
    print(f"  relationships.json    : {len(relationships)} relationships")
    print(f"  capabilities.json     : {len(capabilities)} capabilities")
    print(f"  dataRequirements.json : {len(data_reqs)} requirements")
    print(f"  dependencies.json     : {len(dependencies)} dependencies")
    print(f"  reuseScores.json      : {len(reuse_scores)} scored entities")
    print(f"  reuseMatrix.json      : {len(reuse_matrix)} similarity pairs")
    print(f"  lineage.json          : {len(lineage)} lineage entries")
    print(f"  starSchema.json       : 1 fact + {len(star_schema['dimensions'])} dims + {len(star_schema['aggregates'])} aggs + {len(star_schema['views'])} views")
    print(f"  gapExtensions.json    : {len(gap_extensions)} modules, {sum(len(m['tables']) for m in gap_extensions)} tables")
    print(f"  bacrQuestions.json    : {len(bacr_questions)} questions")
    print(f"  pakistanContext.json  : regulatory + industry + Islamic + payments")
    print(f"  inheritanceTree.json  : {len(inheritance_tree)} chains")
    print()
    print("All files written to:", DATA_DIR)


if __name__ == "__main__":
    main()
