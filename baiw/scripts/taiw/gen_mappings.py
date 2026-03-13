#!/usr/bin/env python3
"""
gen_mappings.py - Generate mappings.json (~400 TCF capability -> WCO DM element mappings)

Loads capabilities.json and dataElements.json from src/data/taiw/ and produces
a mapping array where each capability is mapped to 3-8 data elements with
confidence levels and domain assignments.
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


def build_element_index(elements):
    """Build lookup structures for elements by domain and name."""
    by_domain = {}
    by_name = {}
    for el in elements:
        domain = el['domain']
        by_domain.setdefault(domain, []).append(el)
        by_name[el['name']] = el
    return by_domain, by_name


# ── High-reuse elements: these appear in many mappings ──────────────────────
HIGH_REUSE_ELEMENTS = [
    "Commodity code (HS)",
    "Party identifier",
    "Country of origin code",
    "Value declared for customs",
    "Customs value",
    "Type of declaration",
    "Identification of declaration",
    "Date of declaration",
    "Party name",
    "Duty/tax/fee amount",
    "Duty/tax/fee type code",
    "Net mass",
    "Gross mass",
    "Goods description",
    "Statistical value",
    "Country code",
    "Currency code",
    "Transport means identification",
    "Container identification",
    "Selectivity channel code",
    "Risk score value",
    "TIN/NTN number",
    "AEO authorization number",
    "Customs office of declaration",
    "Exchange rate",
    "Payment method code",
    "Valuation method code",
    "Previous document reference",
]


# ── Theme/group -> relevant domains mapping ─────────────────────────────────
THEME_DOMAIN_AFFINITY = {
    "Revenue & Duty Management": {
        "primary": ["Financial", "Declaration", "Goods", "Classification"],
        "secondary": ["Party", "Origin", "Response"],
    },
    "Risk Management & Compliance": {
        "primary": ["Risk & Control", "Declaration", "Party", "Goods"],
        "secondary": ["Transport", "Consignment", "Document", "Financial"],
    },
    "Trade Facilitation & Operations": {
        "primary": ["Declaration", "Transport", "Location", "Consignment"],
        "secondary": ["Goods", "Warehouse", "Party", "Response"],
    },
    "Trade Intelligence & Analytics": {
        "primary": ["Declaration", "Goods", "Transport", "Consignment"],
        "secondary": ["Financial", "Party", "Location", "Origin"],
    },
    "Trader & Stakeholder Management": {
        "primary": ["Party", "Declaration", "Financial", "Risk & Control"],
        "secondary": ["Document", "Response", "Goods", "Origin"],
    },
    "Digital Customs & Modernization": {
        "primary": ["Declaration", "Document", "Classification", "Response"],
        "secondary": ["Financial", "Party", "Goods", "E-Commerce"],
    },
}


# ── Group-level keyword hints for element selection ─────────────────────────
GROUP_KEYWORDS = {
    "Customs Valuation Analytics": [
        "value", "customs value", "valuation", "invoice", "price", "cost",
        "freight", "insurance", "exchange rate", "currency", "transaction",
        "adjustment", "duty", "deduction",
    ],
    "Tariff & Classification Management": [
        "commodity", "hs", "tariff", "classification", "code", "duty rate",
        "preference", "concession", "sro", "anti-dumping", "quota",
        "nomenclature", "heading", "subheading",
    ],
    "Revenue Collection & Forecasting": [
        "duty", "tax", "fee", "revenue", "payment", "amount", "rate",
        "collection", "total", "budget", "statistical", "customs value",
    ],
    "Risk-Based Selectivity": [
        "risk", "selectivity", "channel", "score", "rule", "profile",
        "examination", "intelligence", "alert", "category", "indicator",
        "ml", "model", "pattern",
    ],
    "Anti-Smuggling & Enforcement": [
        "seal", "intelligence", "seizure", "examination", "smuggling",
        "vehicle", "driver", "route", "sanction", "embargo", "watch",
        "alert", "penalty", "violation", "transit",
    ],
    "Compliance & Audit": [
        "audit", "compliance", "examination", "penalty", "violation",
        "amendment", "document", "certificate", "fraud", "verification",
        "self-assessment", "aeo", "scorecard",
    ],
    "Clearance Process Optimization": [
        "clearance", "time", "date", "queue", "processing", "sla",
        "bottleneck", "pre-arrival", "single window", "declaration",
        "acceptance", "release", "registration",
    ],
    "Port & Terminal Operations": [
        "port", "terminal", "container", "dwell", "warehouse", "berth",
        "throughput", "handling", "yard", "free zone", "storage",
    ],
    "Transit & Transshipment": [
        "transit", "route", "seal", "guarantee", "border", "cpec",
        "afghan", "tir", "transshipment", "crossing", "convoy",
    ],
    "Trade Statistics & Reporting": [
        "statistical", "trade", "commodity", "country", "volume",
        "balance", "export", "import", "partner", "flow", "seasonal",
        "revenue", "unit",
    ],
    "Supply Chain Visibility": [
        "transport", "container", "carrier", "shipment", "tracking",
        "route", "vessel", "flight", "lead time", "supplier", "vendor",
    ],
    "Predictive Trade Analytics": [
        "forecast", "prediction", "trend", "volume", "price", "pattern",
        "seasonal", "historical", "demand", "supply", "warning",
    ],
    "Trader Intelligence": [
        "party", "trader", "tin", "ntn", "aeo", "segmentation",
        "dormant", "inactive", "network", "communication", "contact",
        "registration", "licence",
    ],
    "AEO Program": [
        "aeo", "authorization", "compliance", "benefit", "tier",
        "mutual recognition", "programme", "accreditation", "facility",
    ],
    "WeBOC & PSW Analytics": [
        "system", "weboc", "psw", "electronic", "payment", "api",
        "mobile", "channel", "processing", "gd", "declaration",
    ],
    "Data Quality & Governance": [
        "quality", "data", "code list", "lineage", "audit trail",
        "master data", "harmonization", "governance", "wco", "dm",
        "conformity", "mapping", "standard",
    ],
}


# ── Sub-capability level keyword overrides for precise matching ─────────────
SUB_KEYWORDS = {
    "declared_value_verification": ["value declared", "customs value", "valuation method", "invoice", "transaction value", "price", "adjustment"],
    "transfer_pricing_detection": ["related party", "transfer price", "transaction value", "party identifier", "invoice", "valuation"],
    "transaction_value_database": ["transaction value", "customs value", "commodity", "origin", "statistical", "unit price"],
    "valuation_method_selection": ["valuation method", "customs value", "transaction value", "deductive", "computed"],
    "exchange_rate_impact_analysis": ["exchange rate", "currency", "rate date", "conversion"],
    "retrospective_valuation_audit": ["audit", "valuation", "customs value", "amendment", "retrospective", "adjustment"],
    "advance_ruling_compliance": ["advance ruling", "classification", "valuation", "origin", "ruling", "binding"],
    "value_trend_analytics": ["value", "trend", "statistical", "price", "commodity", "period"],
    "hs_code_classification_engine": ["commodity code", "hs", "classification", "tariff", "heading", "subheading", "description"],
    "tariff_schedule_management": ["tariff", "duty rate", "schedule", "statutory", "applied", "preference"],
    "sro_concession_tracking": ["sro", "concession", "exemption", "concessionary", "notification"],
    "fta_preference_management": ["fta", "preference", "origin", "certificate", "cumulation", "agreement"],
    "duty_drawback_analytics": ["drawback", "refund", "re-export", "inward processing", "duty paid"],
    "regulatory_duty_impact": ["regulatory duty", "additional customs", "rate", "impact", "sro"],
    "revenue_dashboarding": ["revenue", "duty", "tax", "collection", "payment", "total", "amount"],
    "revenue_forecasting": ["revenue", "forecast", "trend", "budget", "projection", "duty"],
    "leakage_detection": ["leakage", "under-invoicing", "misclassification", "concession abuse", "duty gap"],
    "refund_and_drawback_management": ["refund", "drawback", "claim", "reimbursement", "overpayment"],
    "duty_differential_analysis": ["duty differential", "rate comparison", "effective rate", "tariff line"],
    "budget_vs_actual_tracking": ["budget", "actual", "variance", "collection", "target"],
    "risk_profiling_engine": ["risk", "profile", "score", "indicator", "rule", "selectivity", "alert"],
    "selectivity_channel_assignment": ["selectivity", "channel", "green", "yellow", "red", "assignment"],
    "trader_risk_scoring": ["trader", "risk score", "compliance", "history", "tin", "profile"],
    "commodity_risk_matrix": ["commodity", "risk", "matrix", "hs", "category", "profile"],
    "intelligence_led_targeting": ["intelligence", "targeting", "alert", "watch list", "bulletin"],
    "post_clearance_audit_selection": ["post clearance", "audit", "selection", "criteria", "sample"],
    "ml_risk_models": ["ml", "model", "risk", "score", "pattern", "algorithm", "feature"],
    "risk_rule_management": ["risk rule", "rule", "management", "threshold", "trigger", "effectiveness"],
    "smuggling_pattern_detection": ["smuggling", "pattern", "seizure", "concealment", "modus operandi", "detection"],
    "afghan_transit_trade_monitoring": ["afghan", "transit", "atta", "seal", "route", "monitoring", "vehicle"],
    "trade_based_money_laundering": ["money laundering", "tbml", "over-invoicing", "under-invoicing", "shell", "suspicious"],
    "controlled_delivery_tracking": ["controlled delivery", "tracking", "operation", "intelligence", "surveillance"],
    "border_intelligence_analytics": ["border", "intelligence", "crossing", "alert", "watch", "checkpoint"],
    "sanctions_and_embargo_screening": ["sanction", "embargo", "screening", "restricted", "denied", "dual-use"],
    "post_clearance_audit_analytics": ["post clearance", "audit", "finding", "recovery", "discrepancy"],
    "self_assessment_verification": ["self-assessment", "verification", "declaration", "compliance", "correction"],
    "aeo_compliance_monitoring": ["aeo", "compliance", "monitoring", "score", "tier", "authorization"],
    "trader_compliance_scorecard": ["compliance", "scorecard", "trader", "violation", "penalty", "rating"],
    "document_fraud_detection": ["document", "fraud", "forgery", "certificate", "verification", "authenticity"],
    "regulatory_compliance_reporting": ["regulatory", "compliance", "reporting", "requirement", "regulation"],
    "clearance_time_analytics": ["clearance time", "processing", "release", "acceptance", "lodgement", "time"],
    "bottleneck_identification": ["bottleneck", "delay", "queue", "waiting", "processing step", "officer"],
    "green_channel_optimization": ["green channel", "low risk", "auto-release", "fast track", "optimization"],
    "pre_arrival_processing": ["pre-arrival", "advance", "manifest", "prior", "early submission"],
    "single_window_integration": ["single window", "psw", "integration", "oga", "licence", "permit"],
    "24_7_clearance_analytics": ["24/7", "shift", "overnight", "extended hours", "weekend"],
    "queue_management": ["queue", "waiting", "allocation", "priority", "workload", "officer"],
    "sla_tracking": ["sla", "service level", "target time", "compliance", "benchmark"],
    "port_throughput_analytics": ["port", "throughput", "volume", "terminal", "vessel", "handling"],
    "container_dwell_time": ["container", "dwell", "time", "yard", "storage", "pickup"],
    "terminal_performance_benchmarking": ["terminal", "benchmark", "performance", "handling", "turnaround"],
    "warehouse_and_bonded_area_utilization": ["warehouse", "bonded", "utilization", "stock", "storage", "inventory"],
    "free_zone_performance": ["free zone", "sez", "performance", "production", "investment"],
    "dry_port_operations": ["dry port", "inland", "nlc", "intermodal", "container depot"],
    "afghan_transit_trade_analytics": ["afghan", "transit", "atta", "route", "border", "crossing"],
    "cpec_route_analytics": ["cpec", "route", "gwadar", "corridor", "china", "sez"],
    "transshipment_hub_performance": ["transshipment", "hub", "transfer", "relay", "feeder"],
    "tir_convention_compliance": ["tir", "carnet", "convention", "transit", "seal", "guarantee"],
    "trade_balance_dashboard": ["trade balance", "import", "export", "surplus", "deficit", "volume"],
    "commodity_flow_analysis": ["commodity", "flow", "trade", "hs", "sector", "volume"],
    "trading_partner_analytics": ["trading partner", "country", "bilateral", "partner", "origin"],
    "export_diversification_metrics": ["export", "diversification", "sector", "destination", "concentration"],
    "import_dependency_analysis": ["import", "dependency", "essential", "energy", "concentration"],
    "trade_data_reconciliation": ["reconciliation", "mirror", "discrepancy", "partner", "gap"],
    "revenue_per_unit": ["revenue per unit", "unit value", "duty per kg", "effective rate"],
    "seasonal_trade_patterns": ["seasonal", "pattern", "monthly", "quarterly", "trend", "cyclical"],
    "end_to_end_shipment_tracking": ["shipment", "tracking", "transport", "bl", "manifest", "container"],
    "carrier_performance_analytics": ["carrier", "performance", "on-time", "vessel", "flight", "reliability"],
    "route_optimization": ["route", "optimization", "transit time", "distance", "cost", "mode"],
    "container_tracking_integration": ["container", "tracking", "status", "location", "event", "gps"],
    "vendor_supplier_risk_mapping": ["vendor", "supplier", "risk", "foreign", "party", "network"],
    "lead_time_analytics": ["lead time", "transit time", "delivery", "port-to-port", "door-to-door"],
    "trade_volume_forecasting": ["trade volume", "forecast", "prediction", "trend", "projection"],
    "price_prediction_models": ["price", "prediction", "model", "commodity", "trend", "forecast"],
    "demand_supply_gap_analysis": ["demand", "supply", "gap", "shortage", "surplus", "analysis"],
    "early_warning_system": ["early warning", "alert", "indicator", "threshold", "anomaly"],
    "trader_360_profile": ["trader", "party", "profile", "tin", "ntn", "history", "registration", "aeo"],
    "new_trader_onboarding_analytics": ["new trader", "onboarding", "registration", "first", "licence"],
    "trader_segmentation": ["segmentation", "segment", "category", "tier", "volume", "classification"],
    "dormant_inactive_trader_detection": ["dormant", "inactive", "last transaction", "detection"],
    "related_party_network_analysis": ["related party", "network", "beneficial owner", "connected", "group"],
    "trader_communication_and_outreach": ["communication", "outreach", "contact", "notification", "email"],
    "aeo_application_pipeline": ["aeo", "application", "pipeline", "certification", "processing"],
    "aeo_benefit_measurement": ["aeo", "benefit", "measurement", "saving", "fast track"],
    "aeo_mutual_recognition": ["aeo", "mutual recognition", "bilateral", "partner", "accreditation"],
    "aeo_tier_analytics": ["aeo", "tier", "analytics", "level", "upgrade", "downgrade"],
    "aeo_program_roi": ["aeo", "roi", "return", "investment", "cost-benefit", "programme"],
    "weboc_system_performance": ["weboc", "system", "uptime", "response time", "transaction", "error"],
    "gd_processing_analytics": ["gd", "processing", "declaration", "assessment", "step", "duration"],
    "psw_integration_dashboard": ["psw", "integration", "oga", "clearance", "single window"],
    "electronic_payment_analytics": ["electronic payment", "e-payment", "bank", "online", "transaction"],
    "mobile_api_channel_adoption": ["mobile", "api", "channel", "adoption", "digital", "submission"],
    "system_modernization_roadmap": ["modernization", "roadmap", "legacy", "upgrade", "digital"],
    "wco_dm_conformity_assessment": ["wco dm", "conformity", "standard", "mapping", "gap", "data model"],
    "data_quality_scorecarding": ["data quality", "score", "completeness", "accuracy", "validity"],
    "master_data_management": ["master data", "reference", "code list", "harmonization", "governance"],
    "data_lineage_and_audit_trail": ["lineage", "audit trail", "provenance", "change log", "history"],
    "code_list_harmonization": ["code list", "harmonization", "standard", "mapping", "iso"],
    "data_sharing_framework": ["data sharing", "framework", "interoperability", "api", "exchange"],
}


def score_element_for_capability(element, capability, group_kw, sub_kw):
    """Score how relevant an element is to a capability based on keyword matching."""
    name_lower = element['name'].lower()
    defn_lower = (element.get('definition') or '').lower()
    text = name_lower + ' ' + defn_lower

    score = 0

    # Sub-capability keywords (most specific, highest weight)
    for kw in sub_kw:
        if kw.lower() in text:
            score += 5

    # Group-level keywords
    for kw in group_kw:
        if kw.lower() in text:
            score += 2

    return score


def assign_confidence(score, is_high_reuse, domain_is_primary, rank_in_cap, total_in_cap):
    """Determine confidence level based on relevance score, rank, and total.

    Uses rank within the capability's selected elements (0-based) and
    total element count to distribute confidence:
    - Top ~40% of elements for a capability: HIGH (if element directly supports)
    - Middle ~35%: MEDIUM (supporting elements)
    - Bottom ~25%: LOW (peripheral)

    Targets roughly: 45% HIGH, 35% MEDIUM, 20% LOW across all mappings.
    """
    # Calculate position ratio (0.0 = top, 1.0 = bottom)
    position_ratio = rank_in_cap / max(1, total_in_cap - 1) if total_in_cap > 1 else 0.0

    if position_ratio <= 0.35:
        # Top portion - HIGH if score is decent
        if score >= 6 or is_high_reuse:
            return "HIGH"
        else:
            return "MEDIUM"
    elif position_ratio <= 0.70:
        # Middle portion - MEDIUM, upgrade to HIGH only for exceptional matches
        if score >= 12 and domain_is_primary and is_high_reuse:
            return "HIGH"
        elif score >= 4:
            return "MEDIUM"
        else:
            return "LOW"
    else:
        # Bottom portion - mostly LOW, MEDIUM only for exceptional matches
        if score >= 12 and domain_is_primary:
            return "MEDIUM"
        else:
            return "LOW"


def generate_note(element_name, capability_sub, confidence):
    """Generate a concise note explaining the mapping rationale."""
    el_short = element_name.split('(')[0].strip().lower()
    cap_short = capability_sub.lower()

    if confidence == "HIGH":
        templates = [
            f"Core element for {cap_short}",
            f"Primary data point for {cap_short}",
            f"Essential for {cap_short} processing",
            f"Directly required by {cap_short}",
            f"Key input for {cap_short} analysis",
        ]
    elif confidence == "MEDIUM":
        templates = [
            f"Supporting element for {cap_short}",
            f"Supplementary data for {cap_short}",
            f"Enhances {cap_short} accuracy",
            f"Used in {cap_short} validation",
            f"Referenced during {cap_short}",
        ]
    else:
        templates = [
            f"Peripheral context for {cap_short}",
            f"Optional enrichment for {cap_short}",
            f"Background data for {cap_short}",
            f"Contextual reference for {cap_short}",
        ]

    return random.choice(templates)


def main():
    capabilities = load_json('capabilities.json')
    elements = load_json('dataElements.json')

    by_domain, by_name = build_element_index(elements)

    # Build a set for quick high-reuse lookup
    high_reuse_set = set(HIGH_REUSE_ELEMENTS)

    all_mappings = []

    for cap in capabilities:
        cap_id = cap['id']
        theme = cap['theme']
        group = cap['group']
        sub = cap['sub']

        # Get domain affinity for this theme
        affinity = THEME_DOMAIN_AFFINITY.get(theme, {
            "primary": ["Declaration", "Goods"],
            "secondary": ["Financial", "Party"],
        })
        primary_domains = affinity['primary']
        secondary_domains = affinity['secondary']

        # Get keyword lists
        group_kw = GROUP_KEYWORDS.get(group, [])
        sub_kw = SUB_KEYWORDS.get(cap_id, group_kw[:5])

        # Score all elements for this capability
        scored = []
        for el in elements:
            s = score_element_for_capability(el, cap, group_kw, sub_kw)
            is_primary = el['domain'] in primary_domains
            is_secondary = el['domain'] in secondary_domains

            # Boost primary domain elements
            if is_primary:
                s += 3
            elif is_secondary:
                s += 1

            # Boost high-reuse elements slightly
            if el['name'] in high_reuse_set:
                s += 2

            scored.append((s, el))

        # Sort by score descending
        scored.sort(key=lambda x: (-x[0], x[1]['id']))

        # Determine how many elements to map (3-8 based on dataReqCount)
        # Tuned to produce ~400 total across 96-100 capabilities (avg ~4)
        req_count = cap.get('dataReqCount', 5)
        if req_count >= 10:
            target = random.randint(5, 8)
        elif req_count >= 8:
            target = random.randint(4, 6)
        elif req_count >= 6:
            target = random.randint(3, 5)
        else:
            target = random.randint(3, 4)

        # Select top elements, ensuring domain diversity
        selected = []
        selected_domains = set()
        selected_names = set()

        for s, el in scored:
            if len(selected) >= target:
                break
            if el['name'] in selected_names:
                continue

            # After we have 3 from same domain, skip to get diversity
            domain_count = sum(1 for _, e in selected if e['domain'] == el['domain'])
            if domain_count >= 3 and len(selected) < target - 1:
                continue

            selected.append((s, el))
            selected_domains.add(el['domain'])
            selected_names.add(el['name'])

        # If we didn't reach target, fill from remaining high-score elements
        if len(selected) < target:
            for s, el in scored:
                if len(selected) >= target:
                    break
                if el['name'] not in selected_names:
                    selected.append((s, el))
                    selected_names.add(el['name'])

        # Create mapping entries
        for rank, (s, el) in enumerate(selected):
            is_primary = el['domain'] in primary_domains
            is_hr = el['name'] in high_reuse_set
            confidence = assign_confidence(s, is_hr, is_primary, rank, len(selected))
            note = generate_note(el['name'], sub, confidence)

            all_mappings.append({
                "capability": cap_id,
                "element": el['name'],
                "domain": el['domain'],
                "confidence": confidence,
                "notes": note,
            })

    # Write output
    output_path = os.path.join(OUTPUT_DIR, 'mappings.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_mappings, f, indent=2, ensure_ascii=False)

    # Summary
    print(f"Generated {len(all_mappings)} mappings for {len(capabilities)} capabilities")
    print(f"Output: {os.path.abspath(output_path)}")

    # Stats
    conf_counts = {}
    for m in all_mappings:
        conf_counts[m['confidence']] = conf_counts.get(m['confidence'], 0) + 1
    print(f"Confidence distribution: {conf_counts}")

    # Element reuse stats
    el_counts = {}
    for m in all_mappings:
        el_counts[m['element']] = el_counts.get(m['element'], 0) + 1
    top_reused = sorted(el_counts.items(), key=lambda x: -x[1])[:10]
    print(f"Top 10 most reused elements:")
    for name, count in top_reused:
        print(f"  {name}: {count} capabilities")


if __name__ == '__main__':
    main()
