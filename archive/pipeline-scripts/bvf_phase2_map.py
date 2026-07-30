#!/usr/bin/env python3
"""Phase 2: Map BVF Data Requirements → FSDM Entities"""

import json
import csv
import os
import re

OUTPUT_DIR = "/mnt/e/erwin/bvf_output"
FSDM_DIR = "/mnt/e/erwin/fsdm_output"

# ── Hardcoded mapping rules from the prompt ──────────────────────────────
# Each BVF Data Requirement → list of primary FSDM entity name patterns
MAPPING_RULES = {
    # Party Subject Area (18)
    "Single Customer View (Master Record)": ["PARTY", "INDIVIDUAL", "ORGANIZATION", "HOUSEHOLD", "PARTY_IDENTIFICATION", "PARTY_RELATIONSHIP"],
    "KYC Data": ["PARTY_IDENTIFICATION", "PARTY_DOCUMENT", "PARTY_COMPLIANCE", "PARTY_RELATIONSHIP"],
    "Customer Demographics": ["INDIVIDUAL", "ORGANIZATION", "GEOGRAPHICAL_AREA"],
    "Customer Attitudinal Data": ["PARTY_PREFERENCE", "PARTY_SURVEY", "PARTY_SATISFACTION"],
    "Customer Segments": ["PARTY_CLASSIFICATION", "PARTY_SEGMENT", "MARKET_SEGMENT"],
    "Customer Contact Preferences": ["PARTY_CONTACT", "CONTACT_POINT", "ELECTRONIC_ADDRESS", "POSTAL_ADDRESS", "LOCATOR"],
    "Customer Marketing Preferences": ["PARTY_MARKETING", "PARTY_CONSENT", "MARKETING_PROGRAM"],
    "Customer Satisfaction Measurement (E.g. NPS)": ["PARTY_SATISFACTION", "SURVEY", "SURVEY_RESPONSE"],
    "Economic Forecast Data": ["ECONOMIC_INDEX", "ECONOMIC_INDICATOR", "MARKET_INDEX"],
    "Legal Actions": ["LEGAL_ACTION", "LEGAL_PROCEEDING", "PARTY_LEGAL"],
    "External Prospect Data": ["PROSPECT", "EXTERNAL_DATA", "LEAD"],
    "External Data - Social Media": ["SOCIAL_MEDIA", "WEB_PAGE_VIEW", "WEB_VISIT"],
    "External Data - Bureau data": ["CREDIT_BUREAU", "AGENCY_CREDIT", "CREDIT_SCORE", "CREDIT_REPORT"],
    "External Data - Credit Rating": ["CREDIT_RATING", "EXTERNAL_CREDIT", "RATING_AGENCY"],
    "External Economic Data": ["ECONOMIC_INDEX", "PROPERTY_VALUATION", "MARKET_INDEX"],
    "Master & Ref Data - staff": ["INDIVIDUAL", "ORGANIZATION_UNIT", "EMPLOYEE"],
    "Sales Forecasts & KPIs": ["PERFORMANCE_MEASURE", "TARGET", "KEY_PERFORMANCE"],
    "HR Performance Data": ["EMPLOYEE", "PERFORMANCE", "HUMAN_RESOURCE", "INDIVIDUAL", "GRIEVANCE_PROCEDURE"],

    # Location Subject Area (2)
    "Customer Core Contact Details": ["CONTACT_POINT", "POSTAL_ADDRESS", "ELECTRONIC_ADDRESS", "TELEPHONE_NUMBER", "LOCATOR"],
    "Master & Ref Data - geography / location": ["GEOGRAPHICAL_AREA", "COUNTRY", "REGION", "CITY", "POSTAL_CODE", "SITE", "LOCATOR"],

    # Product Subject Area (7)
    "Master & Ref Data - product": ["PRODUCT", "PRODUCT_TYPE", "PRODUCT_FEATURE", "PRODUCT_CATEGORY", "PRODUCT_GROUP"],
    "Master & Ref Data - FTP rates": ["FUND_TRANSFER_PRICE", "INTEREST_RATE", "RATE_STRUCTURE"],
    "Master & Ref Data - exchange rates": ["CURRENCY", "EXCHANGE_RATE", "CURRENCY_CONVERSION"],
    "Product Revenue, Cost & Margin": ["PRODUCT_PROFITABILITY", "PRODUCT_COST", "PRODUCT_REVENUE", "AGREEMENT_COST"],
    "Product NPV's": ["PRODUCT_VALUATION", "NET_PRESENT_VALUE", "CASHFLOW", "AGREEMENT_SUMMARY", "AGREEMENT_COST"],
    "External Data - market rates": ["INTEREST_RATE", "MARKET_INDEX", "BENCHMARK_RATE"],
    "External Data - market prices": ["MARKET_PRICE", "SECURITY_PRICE", "COMMODITY_PRICE", "INVESTMENT_PRODUCT"],

    # Party & Product
    "Customer Product Revenue, Cost & Margin": ["AGREEMENT_COST", "AGREEMENT_SUMMARY", "PARTY_AGREEMENT", "PRODUCT_PROFITABILITY"],

    # Agreement Subject Area (21)
    "Account Holdings": ["AGREEMENT", "FINANCIAL_AGREEMENT", "INSURANCE_AGREEMENT", "PARTY_AGREEMENT_ROLE"],
    "Account Detail": ["AGREEMENT", "AGREEMENT_FEATURE", "AGREEMENT_CONDITION", "AGREEMENT_DETAIL"],
    "Account Status": ["AGREEMENT_STATUS", "AGREEMENT_LIFECYCLE", "AGREEMENT_EVENT"],
    "Terms & Conditions": ["AGREEMENT_TERM", "AGREEMENT_CONDITION", "INTEREST_RATE_STRUCTURE"],
    "Feature Usage": ["AGREEMENT_FEATURE", "FEATURE_UTILIZATION", "AGREEMENT_ACCESS"],
    "Application Data": ["APPLICATION", "AGREEMENT_APPLICATION", "CREDIT_APPLICATION"],
    "Coverage (insurance)": ["COVERAGE", "INSURANCE_COVERAGE", "COVERAGE_AMOUNT", "AGREEMENT_COVERAGE"],
    "Account Balances": ["AGREEMENT_BALANCE", "AGREEMENT_SUMMARY", "ACCOUNT_METRIC", "LEDGER_BALANCE"],
    "Investment Value": ["INVESTMENT_POSITION", "PORTFOLIO_VALUATION", "ASSET_VALUATION", "INVESTMENT_PRODUCT"],
    "Trading Book Positions": ["TRADING_POSITION", "MARKET_POSITION", "TRADE_ORDER", "TRADE_EXECUTION"],
    "Mark to Market": ["MARKET_VALUATION", "FAIR_VALUE", "INVESTMENT_PRODUCT"],
    "Cashflow Projections": ["CASHFLOW_PROJECTION", "CASHFLOW", "EXPECTED_CASHFLOW"],
    "Maturity & Repricing": ["AGREEMENT_MATURITY", "REPRICING", "MATURITY_PROFILE", "LOAN_TERM"],
    "Repayment Schedules": ["REPAYMENT_SCHEDULE", "AMORTIZATION", "PAYMENT_SCHEDULE"],
    "Amortisation Schedules": ["AMORTIZATION_SCHEDULE", "DEPRECIATION_SCHEDULE"],
    "Collateral": ["COLLATERAL", "COLLATERAL_ITEM", "SECURITY_AGREEMENT", "AGREEMENT_COLLATERAL"],
    "Risk Exposures": ["AGREEMENT_RISK_METRIC", "RISK_EXPOSURE", "CREDIT_EXPOSURE", "CREDIT_RISK"],
    "RWA & Capital": ["RISK_WEIGHTED", "CAPITAL_REQUIREMENT", "REGULATORY_CAPITAL", "BANK_CAPITAL"],
    "Profitability Results": ["AGREEMENT_PROFITABILITY", "CUSTOMER_PROFITABILITY", "AGREEMENT_COST"],
    "Provisions, Losses & Writeoffs": ["PROVISION", "LOSS", "WRITEOFF", "AGREEMENT_LOSS", "EXPECTED_LOSS"],
    "Limits": ["LIMIT", "CREDIT_LIMIT", "AGREEMENT_LIMIT", "ACCESS_DEVICE_LIMIT"],

    # Party or Agreement (8)
    "Ratings/Scores (Internal & External)": ["CREDIT_SCORE", "RISK_GRADE", "RATING", "CREDIT_RATING", "RISK_GRADE_VALUE"],
    "Risk Events": ["RISK_EVENT", "DEFAULT_EVENT", "LOSS_EVENT", "FRAUD_EVENT"],
    "Risk Metrics": ["RISK_METRIC", "AGREEMENT_RISK_METRIC", "CREDIT_RISK_SUMMARY", "RISK_EXPOSURE"],
    "Risk Weighted Assets & Capital Results": ["RISK_WEIGHTED", "CAPITAL_REQUIREMENT", "BANK_CAPITAL_SUMMARY"],
    "Stress Test Results": ["STRESS_TEST", "SCENARIO", "STRESS_TEST_RESULT", "RISK_CALCULATION"],
    "Pricing": ["PRICING", "INTEREST_RATE", "FEE_STRUCTURE", "AGREEMENT_RATE"],
    "Collections / Workouts": ["COLLECTION", "WORKOUT", "RECOVERY", "AGREEMENT_COLLECTION"],
    "Expected Loss / PD / LGD / EAD": ["EXPECTED_LOSS", "PROBABILITY_DEFAULT", "LOSS_GIVEN_DEFAULT", "CREDIT_RISK_SUMMARY"],

    # Event Subject Area (25)
    "Financial Transactions": ["MONETARY_TRANSACTION", "FINANCIAL_TRANSACTION", "PAYMENT", "TRANSACTION"],
    "Account Fees, Commissions & Charges": ["FEE", "COMMISSION", "CHARGE", "SERVICE_FEE"],
    "Interbank Payments": ["INTERBANK_PAYMENT", "CLEARING", "SETTLEMENT", "PAYMENT"],
    "Non-Financial Transactions": ["NON_MONETARY", "SERVICE_EVENT", "ADMINISTRATIVE_EVENT"],
    "Service Usage": ["SERVICE_USAGE", "CHANNEL_USAGE", "SERVICE_EVENT"],
    "Complaint Data": ["COMPLAINT", "GRIEVANCE", "PARTY_GRIEVANCE", "LABOR_GRIEVANCE"],
    "Offline Interactions (Branch/Call/Letters/SMS)": ["INTERACTION", "BRANCH_INTERACTION", "CALL_CENTER", "CORRESPONDENCE", "DIRECT_CONTACT"],
    "Online Interactions (all channels)": ["WEB_SESSION", "WEB_PAGE_VIEW", "WEB_VISIT", "DIGITAL_INTERACTION", "EMAIL"],
    "Case History": ["CASE", "FRAUD_CASE", "AML_CASE", "COMPLAINT_CASE", "INVESTIGATION"],
    "Claims": ["CLAIM", "INSURANCE_CLAIM", "CLAIM_EVENT", "HEALTH_CLAIM"],
    "Defaults & Limit Breaches": ["DEFAULT_EVENT", "LIMIT_BREACH", "DELINQUENCY"],
    "Closed Loop Outcomes": ["CAMPAIGN_RESPONSE", "CHANNEL_RESPONSE", "OUTCOME_EVENT", "RESPONSE"],
    "Corporate Actions": ["CORPORATE_ACTION", "DIVIDEND_EVENT"],
    "Internal Process Activity": ["PROCESS_EVENT", "WORKFLOW", "BUSINESS_PROCESS"],
    "Master & Ref Data - merchant": ["MERCHANT", "MERCHANT_CATEGORY", "TRANSACTION_TYPE"],
    "Direct Debit Mandates": ["DIRECT_DEBIT", "MANDATE", "STANDING_ORDER"],
    "Standing Orders": ["STANDING_ORDER", "RECURRING_PAYMENT", "SCHEDULED_PAYMENT"],
    "Securities Trading": ["TRADE_ORDER", "TRADE_EXECUTION", "SECURITY_TRADE"],
    "FX Trading": ["FOREIGN_EXCHANGE", "FX_TRADE", "CURRENCY_TRADE", "EXCHANGE_RATE"],
    "ATM Transactions": ["ATM", "ACCESS_DEVICE_EVENT", "CASH_WITHDRAWAL"],
    "SWIFT Messages": ["SWIFT_MESSAGE", "INTERBANK_MESSAGE", "PAYMENT_MESSAGE"],
    "Card Transactions": ["CARD_TRANSACTION", "ACCESS_DEVICE_EVENT", "CREDIT_CARD", "DEBIT_CARD"],
    "Suspense Items": ["SUSPENSE", "UNMATCHED_TRANSACTION"],
    "Credit Authorisations": ["CREDIT_AUTHORIZATION", "AUTHORIZATION", "ACCESS_DEVICE_EVENT"],
    "Events / Activities": ["EVENT", "ACTIVITY", "BUSINESS_EVENT"],

    # Event or Cross Subject - Document
    "Documents": ["DOCUMENT", "STRUCTURED_DOCUMENT", "IMAGE_DOCUMENT"],

    # Party Asset (2)
    "Physical Assets": ["PARTY_ASSET", "REAL_ESTATE", "VEHICLE", "FIXED_ASSET"],
    "Physical Asset Valuations": ["ASSET_VALUATION", "PROPERTY_VALUATION", "PARTY_ASSET"],

    # Internal Organisation (2)
    "Master & Ref Data - organisation hierarchy": ["ORGANIZATION_UNIT", "ORGANIZATION_STRUCTURE", "REPORTING_LINE", "ORGANIZATION"],
    "Operational Metrics": ["OPERATIONAL_METRIC", "SERVICE_LEVEL", "PERFORMANCE_MEASURE"],

    # Campaign (6)
    "Offer Catalogue": ["OFFER", "OFFER_COMPONENT", "PROMOTION"],
    "Campaign Data": ["CAMPAIGN", "MARKETING_CAMPAIGN", "CAMPAIGN_WAVE", "CAMPAIGN_CELL"],
    "Closed Loop Data (Responses)": ["CAMPAIGN_RESPONSE", "RESPONSE", "CHANNEL_RESPONSE"],
    "Propensity Scores": ["PROPENSITY", "MODEL_SCORE", "ANALYTICAL_MODEL"],
    "Champion / Challenger Results": ["CHAMPION_CHALLENGER", "TEST_RESULT", "CAMPAIGN_TEST"],
    "Suppression Lists": ["SUPPRESSION_LIST", "DO_NOT_CONTACT", "MARKETING_EXCLUSION"],

    # Channel (1)
    "Master & Ref Data - Channel": ["CHANNEL_TYPE", "CHANNEL_INSTANCE", "SERVICE_CHANNEL"],

    # Finance (3)
    "Finance Systems - General Ledger": ["GENERAL_LEDGER", "GL_ACCOUNT", "GL_TRANSACTION", "LEDGER"],
    "Finance Systems - ERP": ["ERP", "EXPENSE", "COST_CENTER", "VENDOR"],
    "Budgets & Forecasts": ["BUDGET", "FORECAST", "PLAN", "FINANCIAL_PLAN"],

    # Analytical Model (2)
    "Model Metadata": ["ANALYTICAL_MODEL", "MODEL_VERSION", "MODEL_METRIC", "MODEL_RUN"],
    "Risk Scenario Results": ["STRESS_TEST", "SCENARIO", "STRESS_TEST_RESULT", "RISK_CALCULATION_SCENARIO"],

    # Cross Subject
    "Watch Lists": ["WATCH_LIST", "SANCTION_LIST", "WATCH_LIST_ENTRY"],
    "Compliance Approvals": ["COMPLIANCE", "REGULATORY_APPROVAL", "APPROVAL"],
    "Surveys": ["SURVEY", "SURVEY_RESPONSE", "QUESTIONNAIRE"],
    "Images / Multi-media Objects": ["IMAGE", "MULTIMEDIA", "DOCUMENT_IMAGE"],
    "Video": ["VIDEO", "MULTIMEDIA", "MEDIA_CONTENT"],

    # Not Covered
    "IT Systems Activity Logs": ["SYSTEM_LOG", "AUDIT_LOG", "ACCESS_LOG"],
    "Cloud / SaaS Application Data": ["CLOUD", "SAAS", "EXTERNAL_APPLICATION"],
    "Third Party Service Data": ["THIRD_PARTY", "EXTERNAL_SERVICE", "SERVICE_PROVIDER"],
}


def load_fsdm_entities():
    """Load entity catalog from Prompt 2 output."""
    entities = {}
    with open(os.path.join(FSDM_DIR, "fsdm_entity_catalog.csv"), "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["Entity"]
            entities[name] = {
                "domain": row["Domain"],
                "column_count": int(row["Column_Count"]) if row["Column_Count"] else 0,
                "relationship_count": int(row["Relationship_Count"]) if row["Relationship_Count"] else 0,
                "parent_entity": row.get("Parent_Entity", ""),
                "subtype_count": int(row["Subtype_Count"]) if row.get("Subtype_Count") else 0,
                "description": row.get("Description", "")
            }
    return entities


def load_fsdm_domain_map():
    """Load domain map."""
    with open(os.path.join(FSDM_DIR, "fsdm_domain_map.json"), "r") as f:
        data = json.load(f)
    return data.get("domains", data)


def load_fsdm_relationships():
    """Load relationships."""
    rels = {}
    with open(os.path.join(FSDM_DIR, "fsdm_relationships.csv"), "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parent = row["Parent_Entity"]
            child = row["Child_Entity"]
            if parent not in rels:
                rels[parent] = []
            rels[parent].append(child)
    return rels


def load_fsdm_inheritance():
    """Load inheritance tree and build flat parent->children map."""
    with open(os.path.join(FSDM_DIR, "fsdm_inheritance_tree.json"), "r") as f:
        tree = json.load(f)

    inheritance = {}
    def walk(nodes, parent=None):
        for node in nodes:
            name = node["name"]
            children = [c["name"] for c in node.get("children", [])]
            if children:
                inheritance[name] = children
            walk(node.get("children", []), name)
    walk(tree)
    return inheritance


def match_entities(dr_name, patterns, all_entities, domain_map, relationships, inheritance):
    """Match a BVF data requirement to FSDM entities."""
    matches = []
    matched_names = set()

    # 1. Pattern-based matching (HIGH confidence)
    for pattern in patterns:
        pattern_upper = pattern.upper()
        for entity_name, info in all_entities.items():
            if entity_name in matched_names:
                continue
            if pattern_upper == entity_name:
                matches.append({
                    "entity": entity_name,
                    "confidence": "HIGH",
                    "method": "exact_match",
                    "domain": info["domain"],
                    "column_count": info["column_count"],
                    "relationship_count": info["relationship_count"]
                })
                matched_names.add(entity_name)
            elif pattern_upper in entity_name or entity_name.startswith(pattern_upper):
                matches.append({
                    "entity": entity_name,
                    "confidence": "HIGH",
                    "method": "pattern_match",
                    "domain": info["domain"],
                    "column_count": info["column_count"],
                    "relationship_count": info["relationship_count"]
                })
                matched_names.add(entity_name)

    # 2. Keyword extraction from DR name (MEDIUM confidence)
    keywords = re.findall(r'[A-Za-z]+', dr_name.upper())
    keywords = [k for k in keywords if len(k) > 3 and k not in ("DATA", "MASTER", "EXTERNAL", "INTERNAL", "SYSTEMS")]
    for entity_name, info in all_entities.items():
        if entity_name in matched_names:
            continue
        entity_words = entity_name.split("_")
        overlap = sum(1 for kw in keywords if any(kw in ew or ew in kw for ew in entity_words))
        if overlap >= 2:
            matches.append({
                "entity": entity_name,
                "confidence": "MEDIUM",
                "method": "keyword_match",
                "domain": info["domain"],
                "column_count": info["column_count"],
                "relationship_count": info["relationship_count"]
            })
            matched_names.add(entity_name)

    # 3. Inheritance expansion (add subtypes of matched entities)
    subtypes_to_add = []
    for m in matches:
        entity = m["entity"]
        if entity in inheritance:
            for child in inheritance[entity]:
                if child not in matched_names:
                    info = all_entities.get(child, {})
                    subtypes_to_add.append({
                        "entity": child,
                        "confidence": "MEDIUM",
                        "method": "inheritance_subtype",
                        "domain": info.get("domain", ""),
                        "column_count": info.get("column_count", 0),
                        "relationship_count": info.get("relationship_count", 0)
                    })
                    matched_names.add(child)
    matches.extend(subtypes_to_add)

    # Limit to top 30 most relevant (sort by confidence then relationship count)
    conf_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    matches.sort(key=lambda x: (conf_order.get(x["confidence"], 9), -x["relationship_count"]))
    return matches[:30]


def main():
    print("=" * 70)
    print("Phase 2: Map BVF Data Requirements → FSDM Entities")
    print("=" * 70)

    # Load BVF data requirements
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_data_requirements.json"), "r") as f:
        data_requirements = json.load(f)

    # Load FSDM data
    print("\nLoading FSDM outputs...")
    entities = load_fsdm_entities()
    print(f"  Entities: {len(entities)}")
    domain_map = load_fsdm_domain_map()
    print(f"  Domains: {len(domain_map)}")
    relationships = load_fsdm_relationships()
    print(f"  Relationship parents: {len(relationships)}")
    inheritance = load_fsdm_inheritance()
    print(f"  Inheritance roots: {len(inheritance)}")

    # Map each data requirement
    print(f"\nMapping {len(data_requirements)} data requirements to FSDM entities...")
    all_mappings = []
    mapping_json = {}
    total_entities_mapped = 0

    for i, dr in enumerate(data_requirements):
        dr_name = dr["name"]
        patterns = MAPPING_RULES.get(dr_name, [])

        # If no explicit rule, try keyword extraction
        if not patterns:
            keywords = re.findall(r'[A-Za-z]+', dr_name)
            patterns = [kw.upper() for kw in keywords if len(kw) > 3]

        matches = match_entities(dr_name, patterns, entities, domain_map, relationships, inheritance)

        for m in matches:
            all_mappings.append({
                "BVF_Data_Requirement": dr_name,
                "FSDM_Subject_Area": dr["fsdm_subject_area"],
                "FSDM_Entity": m["entity"],
                "Match_Confidence": m["confidence"],
                "Match_Method": m["method"],
                "Entity_Column_Count": m["column_count"],
                "Entity_Relationship_Count": m["relationship_count"]
            })

        mapping_json[dr_name] = {
            "fsdm_subject_area": dr["fsdm_subject_area"],
            "entities": matches,
            "entity_count": len(matches),
            "capabilities": dr["capabilities"],
            "output_of": dr["output_of"]
        }

        total_entities_mapped += len(matches)
        if (i + 1) % 20 == 0:
            print(f"  Mapped {i+1}/{len(data_requirements)} data requirements...")

    # Summary
    print(f"\n  Total data requirement → entity mappings: {len(all_mappings)}")
    print(f"  Avg entities per data requirement: {total_entities_mapped / len(data_requirements):.1f}")

    conf_counts = {}
    for m in all_mappings:
        c = m["Match_Confidence"]
        conf_counts[c] = conf_counts.get(c, 0) + 1
    print(f"  Confidence: {conf_counts}")

    no_match = [dr["name"] for dr in data_requirements if dr["name"] not in mapping_json or mapping_json[dr["name"]]["entity_count"] == 0]
    if no_match:
        print(f"  Data requirements with NO match: {len(no_match)}")
        for nm in no_match:
            print(f"    - {nm}")

    # Save CSV
    csv_path = os.path.join(OUTPUT_DIR, "bvf_to_fsdm_entity_map.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["BVF_Data_Requirement", "FSDM_Subject_Area", "FSDM_Entity",
                                                "Match_Confidence", "Match_Method", "Entity_Column_Count",
                                                "Entity_Relationship_Count"])
        writer.writeheader()
        writer.writerows(all_mappings)
    print(f"\n  [4] Saved: {csv_path} ({len(all_mappings)} rows)")

    # Save JSON
    json_path = os.path.join(OUTPUT_DIR, "bvf_to_fsdm_entity_map.json")
    with open(json_path, "w") as f:
        json.dump(mapping_json, f, indent=2)
    print(f"  [5] Saved: {json_path}")

    print("\nPhase 2 complete!")


if __name__ == "__main__":
    main()
