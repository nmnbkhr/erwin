#!/usr/bin/env python3
"""
gen_dependencies.py - Generate dependencies.json for all 100 capabilities.

Loads capabilities.json and dataElements.json, then builds element dependencies
(3-12 per capability) with domains, data requirements, and counts.
Existing mappings.json entries are used as seeds; additional relevant elements
are added from the full data-element catalogue to reach the 3-12 range.
"""

import json
import os
import random

random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')


def load_json(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ── Keyword/theme -> relevant element names (partial matches are fine) ───────
# These map capability themes/keywords to element name substrings so we can
# intelligently pick relevant elements from the catalogue.
KEYWORD_ELEMENT_MAP = {
    # Valuation / Financial
    "value": ["Value declared for customs", "Customs value", "Transaction value",
              "Invoice amount", "Exchange rate", "Currency code",
              "Customs value method code", "Valuation method code",
              "Statistical value", "Insurance cost", "Freight cost amount",
              "Adjustment amount", "Deductive value amount"],
    "pricing": ["Transaction value", "Customs value", "Adjustment amount",
                "Price influence indicator", "Valuation adjustment code",
                "Related party transaction indicator", "Royalty amount",
                "Licence fee amount"],
    "duty": ["Duty/tax/fee amount", "Duty/tax/fee type code", "Duty/tax/fee rate",
             "Total taxes paid amount", "Customs value", "Statutory duty rate",
             "Applied duty rate", "Anti-dumping duty indicator",
             "Countervailing duty indicator", "Preference code"],
    "revenue": ["Duty/tax/fee amount", "Total taxes paid amount", "Payment method code",
                "Currency code for duties", "Customs value",
                "Revenue collection date", "Payment reference number",
                "Receipt number", "Duty/tax/fee rate"],
    "exchange": ["Exchange rate", "Currency code", "Currency code for duties",
                 "Invoice amount", "Customs value", "Value declared for customs",
                 "Statistical value"],
    "payment": ["Payment method code", "Payment reference number", "Receipt number",
                "Total taxes paid amount", "Guarantee type code",
                "Guarantee reference number", "Guarantee amount",
                "Deferred payment indicator"],

    # Classification
    "classification": ["Commodity code (HS)", "Commodity classification code (HS6)",
                       "National tariff line code", "Additional tariff code",
                       "HS version year", "HS chapter description",
                       "HS heading description", "HS subheading description",
                       "Commodity classification type", "Commodity code type"],
    "tariff": ["National tariff line code", "Statutory duty rate", "Applied duty rate",
               "Additional tariff code", "Tariff quantity",
               "Commodity code (HS)", "Preference code"],
    "sro": ["SRO applicable code", "SRO reference number", "SRO benefit amount",
            "SRO expiry date", "Preference code", "Applied duty rate",
            "Commodity code (HS)"],
    "fta": ["FTA agreement code", "FTA preference rate", "Preference code",
            "Preferential origin country", "Certificate of origin number",
            "Origin criterion code", "Regional value content percentage",
            "Cumulation type code"],
    "drawback": ["Refund amount", "Refund reference", "Duty drawback rate",
                 "Export declaration reference", "Commodity code (HS)",
                 "Duty/tax/fee amount", "Original import declaration ref"],

    # Risk & Compliance
    "risk": ["Risk score value", "Risk assessment indicator", "Risk rule identifier",
             "Risk category code", "Selectivity channel code",
             "Intelligence reference", "Commodity code (HS)",
             "Party identifier", "Country of origin code"],
    "selectivity": ["Selectivity channel code", "Selectivity channel assigned",
                    "Risk assessment indicator", "Risk score value",
                    "Examination type code", "Risk rule identifier"],
    "examination": ["Examination type code", "Examination result code",
                    "Examination location code", "Examination officer code",
                    "Examination date", "Examination start time",
                    "Seal number (control)", "Seal condition code (control)"],
    "smuggling": ["Intelligence reference", "Seizure reference number",
                  "Seizure date", "Seized goods description",
                  "Risk score value", "Container identification",
                  "Seal number", "Seal number (control)"],
    "intelligence": ["Intelligence reference", "Risk score value",
                     "Risk category code", "Risk rule identifier",
                     "Seizure reference number"],
    "compliance": ["Compliance rate score", "Compliance history indicator",
                   "AEO authorization number", "AEO tier level",
                   "Penalty code", "Decision code", "Audit finding code"],
    "audit": ["Audit finding code", "Audit recommendation", "Post clearance audit date",
              "Post clearance audit reference", "Compliance rate score",
              "Amendment reason code", "Decision code"],
    "fraud": ["Document reference number", "Document status code",
              "Certificate number", "Forgery indicator",
              "Risk assessment indicator", "Intelligence reference",
              "Seal condition code (control)"],
    "sanction": ["Sanctions list match indicator", "Embargo indicator",
                 "Party identifier", "Party name", "Country code",
                 "Risk assessment indicator"],
    "money_laundering": ["Related party transaction indicator",
                         "Transaction value", "Party identifier",
                         "Beneficial owner name", "Beneficial owner nationality",
                         "Country code", "Intelligence reference"],

    # Trade Facilitation
    "clearance": ["Acceptance date and time", "Release date and time",
                  "Clearance decision date", "Date of declaration",
                  "Customs office of declaration", "Selectivity channel code",
                  "Type of declaration"],
    "green_channel": ["Selectivity channel code", "Selectivity channel assigned",
                      "AEO authorization number", "AEO tier level",
                      "Risk score value", "Compliance rate score"],
    "pre_arrival": ["Pre-arrival declaration indicator", "Estimated arrival date",
                    "Manifest reference number", "Carrier assigned identifier",
                    "Voyage/flight number", "Date of declaration"],
    "single_window": ["PSW reference number", "PSW agency response code",
                      "PSW submission timestamp", "Licence number",
                      "Certificate number", "Permit number"],
    "queue": ["Queue assignment code", "Queue priority level",
              "Processing start time", "Processing end time",
              "Customs office of declaration", "Officer assignment code"],
    "sla": ["Acceptance date and time", "Release date and time",
            "Clearance decision date", "Processing start time",
            "Processing end time", "SLA target hours"],

    # Port / Logistics
    "port": ["Port of discharge UN/LOCODE", "Port of discharge name",
             "First port of entry UN/LOCODE", "First port of entry name",
             "Exit port UN/LOCODE", "Terminal code",
             "Container identification", "Container dwell time hours"],
    "container": ["Container identification", "Container size and type code",
                  "Seal number", "Container status code",
                  "Equipment identification number", "Container dwell time hours",
                  "Terminal code"],
    "terminal": ["Terminal code", "Terminal operator name",
                 "Berth number", "Port of discharge UN/LOCODE",
                 "Container identification", "Container dwell time hours"],
    "warehouse": ["Warehouse identifier", "Warehouse type code",
                  "Bonded warehouse type", "Storage period days",
                  "Warehouse entry number", "Warehouse stock quantity",
                  "Warehouse stock value", "Warehouse licence number"],
    "free_zone": ["Free zone identifier", "Free zone operator code",
                  "Free zone activity type", "Free zone entry date",
                  "Free zone exit date", "Warehouse stock quantity"],
    "dry_port": ["Dry port code", "Dry port name",
                 "Container identification", "Transit start date",
                 "Transit end date", "Mode of transport at border"],
    "transit": ["Transit start date", "Transit end date", "Transit route code",
                "Transit guarantee reference", "Destination customs office",
                "Seal number", "Container identification",
                "Afghan transit trade indicator"],
    "afghan": ["Afghan transit trade indicator", "Transit route code",
               "Destination customs office", "Seal number",
               "Container identification", "Border crossing point code",
               "Transit guarantee reference"],
    "cpec": ["CPEC route indicator", "CPEC project code",
             "Container identification", "Mode of transport at border",
             "Route & itinerary description", "Country code"],

    # Trade Statistics
    "trade_balance": ["Statistical value", "Commodity code (HS)",
                      "Country of origin code", "Country code",
                      "Net mass", "Gross mass", "Trade movement type",
                      "Type of declaration"],
    "commodity_flow": ["Commodity code (HS)", "Statistical value",
                       "Net mass", "Gross mass", "Country of origin code",
                       "Port of discharge UN/LOCODE", "Trade movement type"],
    "partner": ["Country code", "Country of origin code",
                "Preferential origin country", "Party identifier",
                "Statistical value", "Trade movement type"],
    "export": ["Type of declaration", "Commodity code (HS)",
               "Statistical value", "Country code", "Net mass",
               "Export declaration reference"],
    "import": ["Type of declaration", "Commodity code (HS)",
               "Country of origin code", "Statistical value",
               "Customs value", "Net mass"],
    "seasonal": ["Date of declaration", "Commodity code (HS)",
                 "Statistical value", "Net mass", "Country of origin code"],
    "reconciliation": ["Identification of declaration", "Statistical value",
                       "Customs value", "Invoice amount",
                       "Commodity code (HS)", "Trade movement type"],

    # Supply Chain
    "shipment": ["Consignment identification", "Carrier assigned identifier",
                 "Manifest reference number", "Bill of lading number",
                 "Container identification", "Estimated arrival date",
                 "Actual arrival date"],
    "carrier": ["Carrier assigned identifier", "Transport means identification",
                "Transport means nationality", "Voyage/flight number",
                "Vessel IMO number", "Carrier performance score"],
    "route": ["Route & itinerary description", "Transit route code",
              "Mode of transport at border", "Inland mode of transport",
              "Port of discharge UN/LOCODE", "Country code"],
    "lead_time": ["Acceptance date and time", "Release date and time",
                  "Estimated arrival date", "Actual arrival date",
                  "Transit start date", "Transit end date"],
    "forecasting": ["Statistical value", "Net mass", "Commodity code (HS)",
                    "Date of declaration", "Country of origin code",
                    "Trade movement type"],
    "prediction": ["Commodity code (HS)", "Statistical value",
                   "Unit price", "Country of origin code",
                   "Date of declaration", "Exchange rate"],
    "early_warning": ["Risk score value", "Intelligence reference",
                      "Exchange rate", "Commodity code (HS)",
                      "Statistical value", "Date of declaration"],

    # Trader
    "trader": ["Party identifier", "Party name", "TIN/NTN number",
               "AEO authorization number", "AEO tier level",
               "Party function code", "Communication number",
               "Compliance rate score"],
    "onboarding": ["Party identifier", "TIN/NTN number", "Party name",
                   "Registration number", "Date of declaration",
                   "Type of declaration"],
    "segmentation": ["Party identifier", "TIN/NTN number",
                     "AEO tier level", "Compliance rate score",
                     "Statistical value", "Trade movement type"],
    "dormant": ["Party identifier", "TIN/NTN number",
                "Date of declaration", "Last declaration date",
                "Compliance rate score"],
    "related_party": ["Related party transaction indicator",
                      "Party identifier", "Beneficial owner name",
                      "Beneficial owner nationality", "Party function code",
                      "TIN/NTN number"],
    "communication": ["Communication number", "Contact person name",
                      "Party identifier", "Party name", "TIN/NTN number",
                      "Email address"],

    # AEO
    "aeo": ["AEO authorization number", "AEO tier level",
            "AEO last review date", "AEO programme type",
            "TIN/NTN number", "Party identifier",
            "Compliance rate score", "AEO mutual recognition country"],
    "mutual_recognition": ["AEO mutual recognition country",
                           "Trader mutual recognition ID",
                           "AEO authorization number", "AEO tier level",
                           "Country code"],

    # IT Systems
    "weboc": ["WeBOC GD number", "WeBOC module code",
              "Identification of declaration", "Date of declaration",
              "Acceptance date and time", "Type of declaration"],
    "gd": ["WeBOC GD number", "Identification of declaration",
            "Date of declaration", "Type of declaration",
            "Acceptance date and time", "Total gross mass",
            "Total packages quantity", "Number of items"],
    "psw": ["PSW reference number", "PSW agency response code",
            "PSW submission timestamp", "Certificate number",
            "Licence number", "Permit number"],
    "electronic_payment": ["Payment method code", "Payment reference number",
                           "Receipt number", "Total taxes paid amount",
                           "E-payment channel code", "E-payment timestamp"],
    "mobile": ["Mobile submission indicator", "API channel code",
               "Identification of declaration", "Date of declaration",
               "Party identifier"],
    "modernization": ["WeBOC module code", "API channel code",
                      "PSW reference number", "E-payment channel code",
                      "WCO DM element reference"],

    # Data Governance
    "wco_dm": ["WCO DM element reference", "WCO DM class code",
               "WCO DM mapping status", "Data quality score",
               "Commodity code (HS)", "Type of declaration"],
    "data_quality": ["Data quality score", "Data quality rule ID",
                     "Data completeness percentage", "Data accuracy score",
                     "WCO DM element reference"],
    "master_data": ["Commodity code (HS)", "Country code",
                    "Port of discharge UN/LOCODE", "Party identifier",
                    "Currency code", "WCO DM element reference"],
    "lineage": ["Data lineage source system", "Data lineage timestamp",
                "Identification of declaration", "WeBOC GD number",
                "Data quality score"],
    "code_list": ["Code list identifier", "Code list version",
                  "Code list effective date", "WCO DM element reference",
                  "Commodity classification type"],
    "data_sharing": ["Data sharing agreement ID", "Data sharing partner",
                     "Party identifier", "Country code",
                     "WCO DM element reference"],

    # E-Commerce
    "ecommerce": ["De minimis value", "E-commerce indicator",
                  "Platform identifier", "Buyer/seller marketplace ID",
                  "Order number", "Courier tracking number",
                  "Postal item number", "Simplified declaration indicator (e-comm)"],
}

# ── Capability -> primary keywords for element selection ─────────────────────
# Each capability maps to 1-3 keyword groups from KEYWORD_ELEMENT_MAP above.
CAPABILITY_KEYWORDS = {
    "declared_value_verification": ["value", "duty"],
    "transfer_pricing_detection": ["pricing", "value"],
    "transaction_value_database": ["value", "classification"],
    "valuation_method_selection": ["value", "pricing"],
    "exchange_rate_impact_analysis": ["exchange", "value"],
    "retrospective_valuation_audit": ["value", "audit"],
    "advance_ruling_compliance": ["classification", "compliance"],
    "value_trend_analytics": ["value", "forecasting"],
    "hs_code_classification_engine": ["classification", "tariff"],
    "tariff_schedule_management": ["tariff", "classification"],
    "sro_concession_tracking": ["sro", "duty"],
    "fta_preference_management": ["fta", "classification"],
    "duty_drawback_analytics": ["drawback", "duty"],
    "regulatory_duty_impact": ["duty", "tariff"],
    "revenue_dashboarding": ["revenue", "duty"],
    "revenue_forecasting": ["revenue", "forecasting"],
    "leakage_detection": ["revenue", "risk"],
    "refund_and_drawback_management": ["drawback", "payment"],
    "duty_differential_analysis": ["duty", "tariff"],
    "budget_vs_actual_tracking": ["revenue", "payment"],
    "risk_profiling_engine": ["risk", "trader"],
    "selectivity_channel_assignment": ["selectivity", "risk"],
    "trader_risk_scoring": ["risk", "trader"],
    "commodity_risk_matrix": ["risk", "classification"],
    "intelligence_led_targeting": ["intelligence", "risk"],
    "post_clearance_audit_selection": ["audit", "risk"],
    "ml_risk_models": ["risk", "forecasting"],
    "risk_rule_management": ["risk", "selectivity"],
    "smuggling_pattern_detection": ["smuggling", "intelligence"],
    "afghan_transit_trade_monitoring": ["afghan", "transit"],
    "trade_based_money_laundering": ["money_laundering", "risk"],
    "controlled_delivery_tracking": ["smuggling", "shipment"],
    "border_intelligence_analytics": ["intelligence", "smuggling"],
    "sanctions_and_embargo_screening": ["sanction", "risk"],
    "post_clearance_audit_analytics": ["audit", "compliance"],
    "self_assessment_verification": ["compliance", "audit"],
    "aeo_compliance_monitoring": ["aeo", "compliance"],
    "trader_compliance_scorecard": ["compliance", "trader"],
    "document_fraud_detection": ["fraud", "compliance"],
    "regulatory_compliance_reporting": ["compliance", "duty"],
    "clearance_time_analytics": ["clearance", "sla"],
    "bottleneck_identification": ["clearance", "queue"],
    "green_channel_optimization": ["green_channel", "selectivity"],
    "pre_arrival_processing": ["pre_arrival", "clearance"],
    "single_window_integration": ["single_window", "psw"],
    "24_7_clearance_analytics": ["clearance", "queue"],
    "queue_management": ["queue", "clearance"],
    "sla_tracking": ["sla", "clearance"],
    "port_throughput_analytics": ["port", "terminal"],
    "container_dwell_time": ["container", "port"],
    "terminal_performance_benchmarking": ["terminal", "port"],
    "warehouse_and_bonded_area_utilization": ["warehouse", "port"],
    "free_zone_performance": ["free_zone", "warehouse"],
    "dry_port_operations": ["dry_port", "transit"],
    "afghan_transit_trade_analytics": ["afghan", "transit"],
    "cpec_route_analytics": ["cpec", "route"],
    "transshipment_hub_performance": ["port", "container"],
    "tir_convention_compliance": ["transit", "compliance"],
    "trade_balance_dashboard": ["trade_balance", "commodity_flow"],
    "commodity_flow_analysis": ["commodity_flow", "classification"],
    "trading_partner_analytics": ["partner", "trade_balance"],
    "export_diversification_metrics": ["export", "trade_balance"],
    "import_dependency_analysis": ["import", "trade_balance"],
    "trade_data_reconciliation": ["reconciliation", "trade_balance"],
    "revenue_per_unit": ["revenue", "classification"],
    "seasonal_trade_patterns": ["seasonal", "commodity_flow"],
    "end_to_end_shipment_tracking": ["shipment", "carrier"],
    "carrier_performance_analytics": ["carrier", "route"],
    "route_optimization": ["route", "carrier"],
    "container_tracking_integration": ["container", "shipment"],
    "vendor_supplier_risk_mapping": ["trader", "risk"],
    "lead_time_analytics": ["lead_time", "shipment"],
    "trade_volume_forecasting": ["forecasting", "trade_balance"],
    "price_prediction_models": ["prediction", "value"],
    "demand_supply_gap_analysis": ["forecasting", "commodity_flow"],
    "early_warning_system": ["early_warning", "risk"],
    "trader_360_profile": ["trader", "aeo"],
    "new_trader_onboarding_analytics": ["onboarding", "trader"],
    "trader_segmentation": ["segmentation", "trader"],
    "dormant_inactive_trader_detection": ["dormant", "trader"],
    "related_party_network_analysis": ["related_party", "trader"],
    "trader_communication_and_outreach": ["communication", "trader"],
    "aeo_application_pipeline": ["aeo", "compliance"],
    "aeo_benefit_measurement": ["aeo", "green_channel"],
    "aeo_compliance_monitoring_aeo": ["aeo", "compliance"],
    "aeo_mutual_recognition": ["mutual_recognition", "aeo"],
    "aeo_tier_analytics": ["aeo", "segmentation"],
    "aeo_program_roi": ["aeo", "revenue"],
    "weboc_system_performance": ["weboc", "gd"],
    "gd_processing_analytics": ["gd", "clearance"],
    "psw_integration_dashboard": ["psw", "single_window"],
    "electronic_payment_analytics": ["electronic_payment", "payment"],
    "mobile_api_channel_adoption": ["mobile", "weboc"],
    "system_modernization_roadmap": ["modernization", "weboc"],
    "wco_dm_conformity_assessment": ["wco_dm", "data_quality"],
    "data_quality_scorecarding": ["data_quality", "master_data"],
    "master_data_management": ["master_data", "code_list"],
    "data_lineage_and_audit_trail": ["lineage", "data_quality"],
    "code_list_harmonization": ["code_list", "wco_dm"],
    "data_sharing_framework": ["data_sharing", "wco_dm"],
}

# ── Domain -> relevant data requirements mapping ─────────────────────────────
DOMAIN_TO_DATA_REQS = {
    "Declaration": [
        "GD Header Data", "GD Line Items", "Clearance Timestamps",
        "Procedure Codes", "Amendment History", "Cancellation Data",
        "Trade Volume Statistics", "Clearance Time Metrics",
    ],
    "Financial": [
        "Customs Valuation Data", "Duty Assessment Data", "Tax Calculation Details",
        "Payment Data", "Exchange Rate Data", "SRO Concession Data",
        "Guarantee & Bond Data", "Reference Price Database", "Revenue Collection Figures",
        "Refund & Drawback Data", "Trade Finance Instruments",
    ],
    "Goods": [
        "HS Classification Data", "Goods Description", "Quantity & Weight Data",
        "Packaging Details", "Goods Item Valuation", "Brand & Model Data",
        "Dangerous Goods Data", "Mirror Trade Statistics", "International Commodity Prices",
    ],
    "Party": [
        "Trader Identity & Registration", "Party Roles & Functions",
        "Agent & Broker Details", "AEO Authorization Data",
        "Beneficial Ownership", "Trader Financial Profile",
        "Trader Contact & Communication", "Vendor & Supplier Data",
        "Customs Staffing Data",
    ],
    "Transport": [
        "Vessel/Flight Details", "Container Tracking Data", "Seal Data",
        "Route & Itinerary Data", "Multi-Modal Transport Data",
        "Vehicle & Driver Data", "Terminal Operations Data",
        "Carrier Performance Metrics", "CPEC Trade Data",
        "Logistics Lead Time Data",
    ],
    "Location": [
        "Port & Terminal Data", "Warehouse Inventory Data",
        "Free Zone Activity Data", "Dry Port Operations Data",
        "Customs Office Data", "Border Crossing Data",
        "Geographic & Mapping Data",
    ],
    "Classification": [
        "HS Classification Data", "Tariff Schedule Data",
        "HS Nomenclature Updates", "SRO Register",
        "Quota Allocation Data", "Trade Restrictions Data",
        "Regulatory Change Data", "WCO DM Mapping Data", "Master Data Quality",
    ],
    "Risk & Control": [
        "Risk Score Data", "Selectivity Results", "Examination Outcomes",
        "Intelligence Feeds", "Seizure & Violation Data",
        "Post-Clearance Audit Data", "Compliance Rate Data",
        "Non-Intrusive Inspection Data", "Anti-Smuggling Intelligence",
        "Trade-Based Money Laundering Data",
    ],
    "Document": [
        "Supporting Document Data", "Certificate Data",
        "Licences & Permits Data", "Commercial Invoice Data",
        "PSW Integration Metrics",
    ],
    "Origin": [
        "Certificate of Origin Data", "Preferential Treatment Data",
        "Rules of Origin Compliance", "Cumulation Data",
        "FTA Utilization Data",
    ],
    "Consignment": [
        "Manifest/IGM Data", "Bill of Lading Data",
        "Consolidation Data", "Transit Movement Data",
        "Afghan Transit Trade Data",
    ],
    "Warehouse": [
        "Warehouse Operations Data", "Inward Processing Data",
        "Free Zone Operations", "Temporary Storage Data",
    ],
    "E-Commerce": [
        "E-Commerce Transaction Data", "Postal & Courier Data",
        "De Minimis Threshold Data",
    ],
    "Response": [
        "Customs Decision Data", "Penalty & Adjudication Data",
        "Query & Response Data", "Auction & Confiscation Data",
        "Trader Feedback & Complaints",
    ],
}

# ── Capability-specific data requirement overrides ───────────────────────────
CAPABILITY_REQ_OVERRIDES = {
    "declared_value_verification": ["Customs Valuation Data", "HS Classification Data", "Commercial Invoice Data", "Reference Price Database"],
    "transfer_pricing_detection": ["Customs Valuation Data", "Beneficial Ownership", "Commercial Invoice Data"],
    "hs_code_classification_engine": ["HS Classification Data", "Tariff Schedule Data", "Goods Description", "HS Nomenclature Updates"],
    "risk_profiling_engine": ["Risk Score Data", "Selectivity Results", "Trader Identity & Registration", "GD Header Data"],
    "smuggling_pattern_detection": ["Anti-Smuggling Intelligence", "Seizure & Violation Data", "Intelligence Feeds", "Seal Data"],
    "revenue_dashboarding": ["Revenue Collection Figures", "Duty Assessment Data", "Tax Calculation Details", "Payment Data"],
    "clearance_time_analytics": ["Clearance Timestamps", "Clearance Time Metrics", "GD Header Data", "Customs Office Data"],
    "trade_balance_dashboard": ["Trade Volume Statistics", "HS Classification Data", "Export Performance Data"],
    "trader_360_profile": ["Trader Identity & Registration", "AEO Authorization Data", "Trader Financial Profile", "Party Roles & Functions"],
    "port_throughput_analytics": ["Port & Terminal Data", "Terminal Operations Data", "Container Tracking Data", "Manifest/IGM Data"],
    "wco_dm_conformity_assessment": ["WCO DM Mapping Data", "Master Data Quality", "Data Quality Metrics"],
    "aeo_application_pipeline": ["AEO Authorization Data", "Trader Identity & Registration", "Compliance Rate Data"],
    "trade_volume_forecasting": ["Trade Volume Statistics", "Historical Trade Trends", "Predictive Analytics Inputs"],
    "end_to_end_shipment_tracking": ["Manifest/IGM Data", "Bill of Lading Data", "Container Tracking Data", "Logistics Lead Time Data"],
    "post_clearance_audit_analytics": ["Post-Clearance Audit Data", "Examination Outcomes", "GD Header Data", "Amendment History"],
    "afghan_transit_trade_analytics": ["Afghan Transit Trade Data", "Transit Movement Data", "Border Crossing Data", "Route & Itinerary Data"],
    "fta_preference_management": ["FTA Utilization Data", "Certificate of Origin Data", "Preferential Treatment Data", "Rules of Origin Compliance"],
    "weboc_system_performance": ["WeBOC System Metrics", "GD Header Data", "EDI Message Data", "Automation Level Metrics"],
    "data_quality_scorecarding": ["Data Quality Metrics", "Master Data Quality", "GD Header Data"],
    "sanctions_and_embargo_screening": ["Intelligence Feeds", "Trade Restrictions Data", "Risk Score Data"],
    "trade_based_money_laundering": ["Trade-Based Money Laundering Data", "Intelligence Feeds", "Beneficial Ownership"],
    "electronic_payment_analytics": ["E-Payment Transaction Data", "Payment Data", "Revenue Collection Figures"],
    "container_dwell_time": ["Container Tracking Data", "Terminal Operations Data", "Port & Terminal Data"],
    "free_zone_performance": ["Free Zone Activity Data", "Warehouse Inventory Data", "Free Zone Operations"],
    "aeo_mutual_recognition": ["AEO Authorization Data", "FTA Utilization Data", "Compliance Rate Data"],
    "document_fraud_detection": ["Supporting Document Data", "Certificate Data", "Intelligence Feeds"],
    "leakage_detection": ["Revenue Collection Figures", "Risk Score Data", "Examination Outcomes", "Duty Assessment Data"],
}


def main():
    capabilities = load_json('capabilities.json')
    all_elements = load_json('dataElements.json')
    mappings = load_json('mappings.json')
    data_requirements = load_json('dataRequirements.json')

    # Build lookup structures
    elem_name_to_domain = {el['name']: el['domain'] for el in all_elements}
    all_elem_names = set(elem_name_to_domain.keys())
    req_name_set = set(r['name'] for r in data_requirements)

    # Index existing mappings by capability
    cap_mappings = {}
    for m in mappings:
        cap_mappings.setdefault(m['capability'], []).append(m)

    # Build capability -> requirement links from dataRequirements.json
    cap_to_reqs_from_file = {}
    for dr in data_requirements:
        for cap_id in dr.get('capabilities', []):
            cap_to_reqs_from_file.setdefault(cap_id, set()).add(dr['name'])

    dependencies = {}

    for cap in capabilities:
        cap_id = cap['id']

        # Start with elements from existing mappings
        elements_set = set()
        for m in cap_mappings.get(cap_id, []):
            if m['element'] in all_elem_names:
                elements_set.add(m['element'])

        # Expand using keyword-based element selection
        keywords = CAPABILITY_KEYWORDS.get(cap_id, [])
        candidate_pool = []
        for kw in keywords:
            for ename in KEYWORD_ELEMENT_MAP.get(kw, []):
                if ename in all_elem_names and ename not in elements_set:
                    candidate_pool.append(ename)

        # Determine target count (3-12)
        # Base on the capability's dataReqCount as a rough guide
        data_req_count = cap.get('dataReqCount', 5)
        if cap.get('priority') == 'CRITICAL':
            target = min(12, max(8, data_req_count))
        elif cap.get('priority') == 'HIGH':
            target = min(10, max(6, data_req_count))
        else:
            target = min(8, max(3, data_req_count - 1))

        # Add from candidate pool (deduplicated, ordered by appearance)
        seen = set()
        unique_candidates = []
        for c in candidate_pool:
            if c not in seen:
                seen.add(c)
                unique_candidates.append(c)

        need = target - len(elements_set)
        if need > 0 and unique_candidates:
            # Take up to 'need' from unique candidates
            to_add = unique_candidates[:need]
            elements_set.update(to_add)

        # If still below 3, add some generic high-value elements
        if len(elements_set) < 3:
            fallbacks = [
                "Commodity code (HS)", "Party identifier",
                "Date of declaration", "Identification of declaration",
                "Type of declaration", "Country of origin code",
            ]
            for fb in fallbacks:
                if fb in all_elem_names and fb not in elements_set:
                    elements_set.add(fb)
                    if len(elements_set) >= 3:
                        break

        elements = sorted(elements_set)

        # Derive domains from elements
        domains = sorted(set(elem_name_to_domain.get(e, "Unknown") for e in elements))

        # Determine data requirements
        data_reqs = set()

        # From domain-based mapping
        for domain in domains:
            domain_reqs = DOMAIN_TO_DATA_REQS.get(domain, [])
            for req_name in domain_reqs[:3]:
                if req_name in req_name_set:
                    data_reqs.add(req_name)

        # From capability-specific overrides
        if cap_id in CAPABILITY_REQ_OVERRIDES:
            for req_name in CAPABILITY_REQ_OVERRIDES[cap_id]:
                if req_name in req_name_set:
                    data_reqs.add(req_name)

        # From dataRequirements.json capability references
        for rname in cap_to_reqs_from_file.get(cap_id, set()):
            data_reqs.add(rname)

        sorted_reqs = sorted(data_reqs)

        dependencies[cap_id] = {
            "elements": elements,
            "domains": domains,
            "dataRequirements": sorted_reqs,
            "elementCount": len(elements),
            "domainCount": len(domains),
        }

    # Write output
    output_path = os.path.join(OUTPUT_DIR, 'dependencies.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dependencies, f, indent=2, ensure_ascii=False)

    print(f"Generated dependencies for {len(dependencies)} capabilities")
    print(f"Output: {os.path.abspath(output_path)}")

    # Summary stats
    total_elements = sum(d['elementCount'] for d in dependencies.values())
    avg_elements = total_elements / len(dependencies) if dependencies else 0
    min_el = min(d['elementCount'] for d in dependencies.values())
    max_el = max(d['elementCount'] for d in dependencies.values())
    print(f"Element count range: {min_el} - {max_el} (avg {avg_elements:.1f})")

    total_reqs = sum(len(d['dataRequirements']) for d in dependencies.values())
    avg_reqs = total_reqs / len(dependencies) if dependencies else 0
    print(f"Average data requirements per capability: {avg_reqs:.1f}")

    all_domains = set()
    for d in dependencies.values():
        all_domains.update(d['domains'])
    print(f"Total unique domains referenced: {len(all_domains)}")

    # Element count distribution
    counts = [d['elementCount'] for d in dependencies.values()]
    buckets = {}
    for c in counts:
        bucket = f"{c} elements"
        buckets[bucket] = buckets.get(bucket, 0) + 1
    print("Element count distribution:")
    for k in sorted(buckets.keys()):
        print(f"  {k}: {buckets[k]} capabilities")


if __name__ == '__main__':
    main()
