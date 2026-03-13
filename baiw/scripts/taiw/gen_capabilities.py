#!/usr/bin/env python3
"""Generate capabilities.json for TAIW — 96 TCF sub-capabilities"""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Theme definitions: (name, color, themeIndex)
THEMES = [
    ("Revenue & Duty Management", "amber", 1),
    ("Risk Management & Compliance", "red", 2),
    ("Trade Facilitation & Operations", "blue", 3),
    ("Trade Intelligence & Analytics", "violet", 4),
    ("Trader & Stakeholder Management", "emerald", 5),
    ("Digital Customs & Modernization", "indigo", 6),
]

# Capability definitions structured as:
# { themeIndex: [ (groupName, groupIndex, [ (capName, dataReqCount, priority), ... ]), ... ] }
CAP_DEFS = {
    1: [
        ("Customs Valuation Analytics", 1, [
            ("Declared Value Verification", 10, "CRITICAL"),
            ("Transfer Pricing Detection", 8, "HIGH"),
            ("Transaction Value Database", 7, "HIGH"),
            ("Valuation Method Selection", 6, "HIGH"),
            ("Exchange Rate Impact Analysis", 5, "MEDIUM"),
            ("Retrospective Valuation Audit", 7, "HIGH"),
            ("Advance Ruling Compliance", 6, "MEDIUM"),
            ("Value Trend Analytics", 5, "HIGH"),
        ]),
        ("Tariff & Classification Management", 2, [
            ("HS Code Classification Engine", 9, "CRITICAL"),
            ("Tariff Schedule Management", 7, "HIGH"),
            ("SRO Concession Tracking", 8, "HIGH"),
            ("FTA Preference Management", 7, "HIGH"),
            ("Duty Drawback Analytics", 6, "MEDIUM"),
            ("Regulatory Duty Impact", 5, "HIGH"),
        ]),
        ("Revenue Collection & Forecasting", 3, [
            ("Revenue Dashboarding", 10, "CRITICAL"),
            ("Revenue Forecasting", 9, "HIGH"),
            ("Leakage Detection", 8, "HIGH"),
            ("Refund & Drawback Management", 7, "HIGH"),
            ("Duty Differential Analysis", 6, "MEDIUM"),
            ("Budget vs Actual Tracking", 5, "HIGH"),
        ]),
    ],
    2: [
        ("Risk-Based Selectivity", 1, [
            ("Risk Profiling Engine", 12, "CRITICAL"),
            ("Selectivity Channel Assignment", 9, "HIGH"),
            ("Trader Risk Scoring", 10, "HIGH"),
            ("Commodity Risk Matrix", 8, "HIGH"),
            ("Intelligence-Led Targeting", 7, "HIGH"),
            ("Post-Clearance Audit Selection", 6, "MEDIUM"),
            ("ML Risk Models", 8, "HIGH"),
            ("Risk Rule Management", 7, "HIGH"),
        ]),
        ("Anti-Smuggling & Enforcement", 2, [
            ("Smuggling Pattern Detection", 10, "CRITICAL"),
            ("Afghan Transit Trade Monitoring", 9, "HIGH"),
            ("Trade-Based Money Laundering", 8, "HIGH"),
            ("Controlled Delivery Tracking", 6, "MEDIUM"),
            ("Border Intelligence Analytics", 7, "HIGH"),
            ("Sanctions & Embargo Screening", 8, "HIGH"),
        ]),
        ("Compliance & Audit", 3, [
            ("Post-Clearance Audit Analytics", 9, "CRITICAL"),
            ("Self-Assessment Verification", 7, "HIGH"),
            ("AEO Compliance Monitoring", 8, "HIGH"),
            ("Trader Compliance Scorecard", 6, "HIGH"),
            ("Document Fraud Detection", 7, "HIGH"),
            ("Regulatory Compliance Reporting", 5, "MEDIUM"),
        ]),
    ],
    3: [
        ("Clearance Process Optimization", 1, [
            ("Clearance Time Analytics", 10, "CRITICAL"),
            ("Bottleneck Identification", 8, "HIGH"),
            ("Green Channel Optimization", 7, "HIGH"),
            ("Pre-Arrival Processing", 9, "HIGH"),
            ("Single Window Integration", 8, "HIGH"),
            ("24/7 Clearance Analytics", 5, "MEDIUM"),
            ("Queue Management", 6, "HIGH"),
            ("SLA Tracking", 5, "HIGH"),
        ]),
        ("Port & Terminal Operations", 2, [
            ("Port Throughput Analytics", 9, "CRITICAL"),
            ("Container Dwell Time", 7, "HIGH"),
            ("Terminal Performance Benchmarking", 6, "HIGH"),
            ("Warehouse & Bonded Area Utilization", 8, "HIGH"),
            ("Free Zone Performance", 5, "MEDIUM"),
            ("Dry Port Operations", 6, "HIGH"),
        ]),
        ("Transit & Transshipment", 3, [
            ("Afghan Transit Trade Analytics", 8, "CRITICAL"),
            ("CPEC Route Analytics", 7, "HIGH"),
            ("Transshipment Hub Performance", 6, "HIGH"),
            ("TIR Convention Compliance", 5, "MEDIUM"),
        ]),
    ],
    4: [
        ("Trade Statistics & Reporting", 1, [
            ("Trade Balance Dashboard", 10, "CRITICAL"),
            ("Commodity Flow Analysis", 8, "HIGH"),
            ("Trading Partner Analytics", 7, "HIGH"),
            ("Export Diversification Metrics", 6, "HIGH"),
            ("Import Dependency Analysis", 7, "HIGH"),
            ("Trade Data Reconciliation", 5, "MEDIUM"),
            ("Revenue Per Unit", 4, "MEDIUM"),
            ("Seasonal Trade Patterns", 5, "HIGH"),
        ]),
        ("Supply Chain Visibility", 2, [
            ("End-to-End Shipment Tracking", 9, "CRITICAL"),
            ("Carrier Performance Analytics", 7, "HIGH"),
            ("Route Optimization", 6, "HIGH"),
            ("Container Tracking Integration", 8, "HIGH"),
            ("Vendor/Supplier Risk Mapping", 7, "HIGH"),
            ("Lead Time Analytics", 5, "MEDIUM"),
        ]),
        ("Predictive Trade Analytics", 3, [
            ("Trade Volume Forecasting", 8, "CRITICAL"),
            ("Price Prediction Models", 7, "HIGH"),
            ("Demand-Supply Gap Analysis", 6, "HIGH"),
            ("Early Warning System", 5, "HIGH"),
        ]),
    ],
    5: [
        ("Trader Intelligence", 1, [
            ("Trader 360 Profile", 11, "CRITICAL"),
            ("New Trader Onboarding Analytics", 7, "HIGH"),
            ("Trader Segmentation", 6, "HIGH"),
            ("Dormant/Inactive Trader Detection", 5, "MEDIUM"),
            ("Related Party Network Analysis", 8, "HIGH"),
            ("Trader Communication & Outreach", 4, "MEDIUM"),
        ]),
        ("AEO Program", 2, [
            ("AEO Application Pipeline", 7, "CRITICAL"),
            ("AEO Benefit Measurement", 6, "HIGH"),
            ("AEO Compliance Monitoring", 8, "HIGH"),
            ("AEO Mutual Recognition", 5, "MEDIUM"),
            ("AEO Tier Analytics", 6, "HIGH"),
            ("AEO Program ROI", 5, "HIGH"),
        ]),
    ],
    6: [
        ("WeBOC & PSW Analytics", 1, [
            ("WeBOC System Performance", 9, "CRITICAL"),
            ("GD Processing Analytics", 8, "HIGH"),
            ("PSW Integration Dashboard", 7, "HIGH"),
            ("Electronic Payment Analytics", 6, "HIGH"),
            ("Mobile/API Channel Adoption", 5, "MEDIUM"),
            ("System Modernization Roadmap", 4, "MEDIUM"),
        ]),
        ("Data Quality & Governance", 2, [
            ("WCO DM Conformity Assessment", 8, "CRITICAL"),
            ("Data Quality Scorecarding", 7, "HIGH"),
            ("Master Data Management", 9, "HIGH"),
            ("Data Lineage & Audit Trail", 6, "HIGH"),
            ("Code List Harmonization", 5, "MEDIUM"),
            ("Data Sharing Framework", 5, "HIGH"),
        ]),
    ],
}


def to_snake_case(name):
    """Convert a capability name to snake_case id."""
    result = name.lower()
    result = result.replace("&", "and")
    result = result.replace("/", "_")
    result = result.replace("-", "_")
    result = result.replace(",", "")
    result = result.replace("(", "")
    result = result.replace(")", "")
    # Collapse multiple spaces, then replace space with underscore
    result = "_".join(result.split())
    return result


capabilities = []
seen_ids = set()

for theme_name, theme_color, theme_index in THEMES:
    groups = CAP_DEFS[theme_index]
    for group_name, group_index, caps in groups:
        for cap_name, data_req_count, priority in caps:
            cap_id = to_snake_case(cap_name)
            # Disambiguate duplicate IDs by appending group context
            if cap_id in seen_ids:
                cap_id = cap_id + "_" + to_snake_case(group_name).split("_")[0]
            seen_ids.add(cap_id)
            capabilities.append({
                "id": cap_id,
                "theme": theme_name,
                "group": group_name,
                "sub": cap_name,
                "dataReqCount": data_req_count,
                "themeColor": theme_color,
                "themeIndex": theme_index,
                "groupIndex": group_index,
                "priority": priority,
            })

with open(os.path.join(OUTPUT_DIR, 'capabilities.json'), 'w') as f:
    json.dump(capabilities, f, indent=2)

# Summary statistics
theme_counts = {}
for cap in capabilities:
    t = cap["theme"]
    theme_counts[t] = theme_counts.get(t, 0) + 1

print(f"capabilities.json: {len(capabilities)} TCF sub-capabilities")
for theme_name, _, _ in THEMES:
    print(f"  {theme_name}: {theme_counts[theme_name]}")
