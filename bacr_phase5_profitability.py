#!/usr/bin/env python3
"""Phase 5: Profitability Engine Maturity Assessment"""

import json
import csv
import os

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'

# Load BACR-to-BVF mapping
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json')) as f:
    bacr_bvf = json.load(f)

# ============================================================
# Profitability component definitions
# ============================================================
PROFITABILITY_COMPONENTS = {
    "revenue": {
        "label": "Revenue Maturity",
        "capabilities": {
            "Transaction Classification": {"current": 3, "desired": 5,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.interest_income, fee_income",
                "fsdm_entities": ["FINANCIAL_TRANSACTION", "ACCOUNT", "PRODUCT"]},
            "Customer Value": {"current": 3, "desired": 5,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.total_revenue",
                "fsdm_entities": ["PARTY", "INDIVIDUAL", "AGREEMENT"]},
            "Profitability Modelling": {"current": 3, "desired": 5,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY - all revenue measures",
                "fsdm_entities": ["AGREEMENT", "PRODUCT", "FINANCIAL_TRANSACTION"]},
            "Sales Reporting": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.fee_income, commission_income",
                "fsdm_entities": ["AGREEMENT", "PRODUCT", "EVENT"]},
            "Pricing Analysis & Optimisation": {"current": 2, "desired": 4,
                "star_schema_impact": "DIM_PRODUCT.pricing attributes",
                "fsdm_entities": ["PRODUCT", "PRODUCT_FEATURE", "INTEREST_RATE"]},
        }
    },
    "cost": {
        "label": "Cost Maturity",
        "capabilities": {
            "Activity Based Costing": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.direct_cost, indirect_cost_allocation",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "EVENT", "AGREEMENT"]},
            "GL, AP, HR, Expense Analytics & Optimisation": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.overhead_allocation",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "GL_ACCOUNT"]},
            "Business Process Analytics & Optimisation": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.operational_cost",
                "fsdm_entities": ["EVENT", "INTERNAL_ORGANIZATION"]},
            "Financial Accounting / Accounting Hub": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY - cost classification",
                "fsdm_entities": ["GL_ACCOUNT", "FINANCIAL_TRANSACTION"]},
        }
    },
    "risk_adjusted_return": {
        "label": "Risk-Adjusted Return Maturity",
        "capabilities": {
            "Credit Risk Scoring (Underwriting Likelihood Model)": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.probability_of_default",
                "fsdm_entities": ["PARTY", "AGREEMENT", "ANALYTICAL_MODEL"]},
            "Credit Risk Expected Loss Model": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.expected_loss, loss_given_default",
                "fsdm_entities": ["PARTY", "AGREEMENT", "COLLATERAL"]},
            "Capital Management (Planning and Allocation)": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.economic_capital, regulatory_capital",
                "fsdm_entities": ["AGREEMENT", "RISK_EXPOSURE"]},
            "Credit Risk Based Pricing Model": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.raroc",
                "fsdm_entities": ["AGREEMENT", "PRODUCT", "ANALYTICAL_MODEL"]},
            "Active Portfolio Management": {"current": 2, "desired": 4,
                "star_schema_impact": "Portfolio-level risk-return optimization",
                "fsdm_entities": ["AGREEMENT", "PARTY", "RISK_EXPOSURE"]},
            "Risk Appetite": {"current": 2, "desired": 4,
                "star_schema_impact": "Risk limit framework for profitability targets",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "RISK_EXPOSURE"]},
            "Risk Scenario & Stress Testing Results (Analytical Model)": {"current": 2, "desired": 4,
                "star_schema_impact": "Stress-tested profitability scenarios",
                "fsdm_entities": ["ANALYTICAL_MODEL", "AGREEMENT", "PARTY"]},
        }
    },
    "treasury_pricing": {
        "label": "Treasury/Pricing Maturity",
        "capabilities": {
            "Funds Transfer Pricing": {"current": 2, "desired": 5,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.ftp_charge, ftp_credit, net_interest_margin",
                "fsdm_entities": ["AGREEMENT", "INTEREST_RATE", "PRODUCT"]},
            "Asset & Liability Management": {"current": 2, "desired": 4,
                "star_schema_impact": "Balance sheet management for NII sensitivity",
                "fsdm_entities": ["AGREEMENT", "BALANCE", "INTEREST_RATE"]},
            "Capital Planning and Management": {"current": 2, "desired": 4,
                "star_schema_impact": "Capital allocation to business lines",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "AGREEMENT"]},
            "Cashflow Generation": {"current": 2, "desired": 4,
                "star_schema_impact": "FACT_CUSTOMER_PROFITABILITY.cashflow_projection",
                "fsdm_entities": ["AGREEMENT", "FINANCIAL_TRANSACTION", "EVENT"]},
            "Liquidity Management": {"current": 2, "desired": 4,
                "star_schema_impact": "Liquidity cost allocation to products",
                "fsdm_entities": ["AGREEMENT", "BALANCE", "FINANCIAL_TRANSACTION"]},
            "FX & Trading Book Management": {"current": 2, "desired": 4,
                "star_schema_impact": "FX impact on cross-currency profitability",
                "fsdm_entities": ["CURRENCY", "EXCHANGE_RATE", "AGREEMENT"]},
            "Interest Rate Management": {"current": 2, "desired": 4,
                "star_schema_impact": "NII sensitivity and repricing impact",
                "fsdm_entities": ["INTEREST_RATE", "AGREEMENT", "PRODUCT"]},
        }
    },
    "reporting": {
        "label": "Reporting Maturity",
        "capabilities": {
            "Functional Profit & Loss Statement (P&L)": {"current": 2, "desired": 5,
                "star_schema_impact": "Core output - functional P&L by customer/product/channel",
                "fsdm_entities": ["PARTY", "PRODUCT", "INTERNAL_ORGANIZATION", "AGREEMENT"]},
            "Financial Consolidation": {"current": 2, "desired": 4,
                "star_schema_impact": "Group-level consolidated profitability",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "GL_ACCOUNT"]},
            "Statutory Financial Reporting": {"current": 2, "desired": 4,
                "star_schema_impact": "Regulatory financial statement production",
                "fsdm_entities": ["GL_ACCOUNT", "INTERNAL_ORGANIZATION"]},
            "Performance Management and KPIs": {"current": 2, "desired": 4,
                "star_schema_impact": "KPI dashboards driven by profitability measures",
                "fsdm_entities": ["All dimensions"]},
            "Executive Dashboards": {"current": 2, "desired": 4,
                "star_schema_impact": "C-suite profitability visibility",
                "fsdm_entities": ["All fact/dimension tables"]},
            "Performance Reporting": {"current": 2, "desired": 4,
                "star_schema_impact": "Branch/product/segment performance from profitability cube",
                "fsdm_entities": ["INTERNAL_ORGANIZATION", "PRODUCT", "PARTY"]},
            "Exception Reporting": {"current": 2, "desired": 4,
                "star_schema_impact": "Profitability anomaly detection and alerts",
                "fsdm_entities": ["All fact tables"]},
        }
    }
}

# ============================================================
# Match BACR questions to profitability capabilities
# ============================================================
def _get_recommendations(cap_name, gap):
    recs = []
    if gap >= 3:
        recs.append(f"Critical gap: Immediate focus needed for {cap_name}")
        recs.append("Establish foundational data sourcing and integration")
    if gap >= 2:
        recs.append(f"Build dedicated data pipeline for {cap_name}")
        recs.append("Implement automated quality checks")
    if 'FTP' in cap_name or 'Funds Transfer' in cap_name:
        recs.append("Deploy FTP rate curve management and matched-maturity methodology")
    if 'Risk' in cap_name or 'Credit' in cap_name:
        recs.append("Integrate risk models with profitability engine for RAROC calculation")
    if 'P&L' in cap_name or 'Profit' in cap_name:
        recs.append("Build functional P&L dimensions: customer, product, channel, branch")
    return recs

print("Building profitability maturity profile...")

# Index BACR-BVF mappings by capability
bvf_to_bacr = {}
for r in bacr_bvf:
    cap = r['bvf_capability']
    if cap not in bvf_to_bacr:
        bvf_to_bacr[cap] = []
    bvf_to_bacr[cap].append(r)

profile = {
    "overall_score": 0.0,
    "overall_target": 0.0,
    "overall_gap": 0.0,
    "components": {},
    "critical_gaps": [],
    "implementation_sequence": []
}

all_current = []
all_target = []

for comp_key, comp_def in PROFITABILITY_COMPONENTS.items():
    comp_current = []
    comp_target = []
    comp_questions = []

    for cap_name, cap_scores in comp_def['capabilities'].items():
        bacr_matches = bvf_to_bacr.get(cap_name, [])
        gap = cap_scores['desired'] - cap_scores['current']

        q_entry = {
            'bvf_capability': cap_name,
            'current': cap_scores['current'],
            'desired': cap_scores['desired'],
            'gap': gap,
            'star_schema_impact': cap_scores['star_schema_impact'],
            'fsdm_entities': cap_scores['fsdm_entities'],
            'bacr_question_ids': [m['bacr_question_id'] for m in bacr_matches],
            'bacr_question_count': len(bacr_matches)
        }
        comp_questions.append(q_entry)
        comp_current.append(cap_scores['current'])
        comp_target.append(cap_scores['desired'])

        # Track critical gaps
        if gap >= 2:
            profile['critical_gaps'].append({
                'capability': cap_name,
                'current': cap_scores['current'],
                'desired': cap_scores['desired'],
                'gap': gap,
                'profitability_component': comp_def['label'],
                'star_schema_measures_affected': [cap_scores['star_schema_impact']],
                'fsdm_entities_required': cap_scores['fsdm_entities'],
                'recommended_actions': _get_recommendations(cap_name, gap)
            })

    avg_current = sum(comp_current) / len(comp_current) if comp_current else 0
    avg_target = sum(comp_target) / len(comp_target) if comp_target else 0

    profile['components'][comp_key] = {
        'label': comp_def['label'],
        'current_avg': round(avg_current, 2),
        'target_avg': round(avg_target, 2),
        'gap': round(avg_target - avg_current, 2),
        'capability_count': len(comp_def['capabilities']),
        'questions': comp_questions
    }

    all_current.extend(comp_current)
    all_target.extend(comp_target)

profile['overall_score'] = round(sum(all_current) / len(all_current), 2) if all_current else 0
profile['overall_target'] = round(sum(all_target) / len(all_target), 2) if all_target else 0
profile['overall_gap'] = round(profile['overall_target'] - profile['overall_score'], 2)

# Sort critical gaps by gap size
profile['critical_gaps'].sort(key=lambda x: x['gap'], reverse=True)
profile['critical_gaps'] = profile['critical_gaps'][:10]

# ============================================================
# Implementation Sequence
# ============================================================
IMPLEMENTATION_PHASES = [
    {
        "phase": 1,
        "name": "Foundation (Maturity 1→2)",
        "capabilities": [
            "Single Interaction View of Customer",
            "Transaction Classification",
            "Customer Value",
        ],
        "description": "Party hub, Agreement hub, Financial Transactions, Product Master, Org Hierarchy",
        "enables": "Basic customer profitability at account level",
        "fsdm_entities": ["PARTY", "INDIVIDUAL", "ORGANIZATION", "AGREEMENT", "ACCOUNT",
                          "FINANCIAL_TRANSACTION", "PRODUCT", "INTERNAL_ORGANIZATION"],
        "estimated_effort": "L",
        "prerequisites": []
    },
    {
        "phase": 2,
        "name": "Core Profitability (Maturity 2→3)",
        "capabilities": [
            "Funds Transfer Pricing",
            "Activity Based Costing",
            "Profitability Modelling",
            "Financial Accounting / Accounting Hub",
            "Sales Reporting",
        ],
        "description": "FTP engine, ABC allocation, balance summaries, fee tracking",
        "enables": "NII calculation, direct cost allocation, basic P&L by customer",
        "fsdm_entities": ["INTEREST_RATE", "BALANCE", "GL_ACCOUNT", "PRODUCT_FEATURE",
                          "INTERNAL_ORGANIZATION", "EVENT"],
        "estimated_effort": "XL",
        "prerequisites": [1]
    },
    {
        "phase": 3,
        "name": "Risk-Adjusted (Maturity 3→4)",
        "capabilities": [
            "Credit Risk Scoring (Underwriting Likelihood Model)",
            "Credit Risk Expected Loss Model",
            "Credit Risk Based Pricing Model",
            "Capital Management (Planning and Allocation)",
            "Risk Appetite",
        ],
        "description": "PD/LGD models, risk-based pricing, economic capital allocation, provisions",
        "enables": "RAROC, risk-adjusted profitability, economic capital allocation",
        "fsdm_entities": ["ANALYTICAL_MODEL", "RISK_EXPOSURE", "COLLATERAL",
                          "PROVISION", "WRITE_OFF"],
        "estimated_effort": "XL",
        "prerequisites": [1, 2]
    },
    {
        "phase": 4,
        "name": "Advanced Analytics (Maturity 4→5)",
        "capabilities": [
            "Profitability Analytics and Optimisation",
            "Future / Lifetime Value",
            "Customer Segmentation",
            "Performance Management and KPIs",
            "Executive Dashboards",
            "Functional Profit & Loss Statement (P&L)",
        ],
        "description": "Predictive profitability, LTV models, dynamic pricing, real-time dashboards",
        "enables": "Predictive profitability, LTV models, dynamic pricing, real-time dashboards",
        "fsdm_entities": ["All entities - full star schema deployment"],
        "estimated_effort": "XL",
        "prerequisites": [1, 2, 3]
    }
]

for phase_def in IMPLEMENTATION_PHASES:
    # Find maturity scores for phase capabilities
    phase_caps = []
    for cap_name in phase_def['capabilities']:
        score = None
        for comp_key, comp_def in PROFITABILITY_COMPONENTS.items():
            if cap_name in comp_def['capabilities']:
                score = comp_def['capabilities'][cap_name]
                break
        if not score:
            score = {"current": 2, "desired": 4}

        phase_caps.append(cap_name)

    # Count BVF data requirements
    bvf_dr_count = 0
    for cap_name in phase_caps:
        from collections import defaultdict
        cap_info_file = os.path.join('/mnt/e/erwin/bvf_fsdm_output', 'bvf_capability_summary.csv')
        import csv as csv_mod
        with open(cap_info_file) as cf:
            for row in csv_mod.DictReader(cf):
                if row['Sub_Capability'].strip() == cap_name:
                    bvf_dr_count += int(row['Data_Requirements_Count'])

    profile['implementation_sequence'].append({
        'phase': phase_def['phase'],
        'name': phase_def['name'],
        'capabilities': phase_def['capabilities'],
        'capability_count': len(phase_def['capabilities']),
        'description': phase_def['description'],
        'enables': phase_def['enables'],
        'fsdm_entities': phase_def['fsdm_entities'],
        'fsdm_entity_count': len(phase_def['fsdm_entities']),
        'bvf_data_requirements': bvf_dr_count,
        'prerequisite_phases': phase_def['prerequisites'],
        'estimated_effort': phase_def['estimated_effort']
    })

def _get_recommendations(cap_name, gap):
    recs = []
    if gap >= 3:
        recs.append(f"Critical gap: Immediate focus needed for {cap_name}")
        recs.append("Establish foundational data sourcing and integration")
    if gap >= 2:
        recs.append(f"Build dedicated data pipeline for {cap_name}")
        recs.append("Implement automated quality checks")
    if 'FTP' in cap_name or 'Funds Transfer' in cap_name:
        recs.append("Deploy FTP rate curve management and matched-maturity methodology")
    if 'Risk' in cap_name or 'Credit' in cap_name:
        recs.append("Integrate risk models with profitability engine for RAROC calculation")
    if 'P&L' in cap_name or 'Profit' in cap_name:
        recs.append("Build functional P&L dimensions: customer, product, channel, branch")
    return recs

# Rebuild critical gaps with recommendations (fix forward reference)
for gap_entry in profile['critical_gaps']:
    gap_entry['recommended_actions'] = _get_recommendations(gap_entry['capability'], gap_entry['gap'])

# ============================================================
# Outputs
# ============================================================

# profitability_maturity_profile.json
print("Writing profitability_maturity_profile.json...")
with open(os.path.join(OUTPUT_DIR, 'profitability_maturity_profile.json'), 'w') as f:
    json.dump({"profitability_maturity": profile}, f, indent=2)

# profitability_implementation_sequence.csv
print("Writing profitability_implementation_sequence.csv...")
with open(os.path.join(OUTPUT_DIR, 'profitability_implementation_sequence.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'Phase', 'Phase_Name', 'Capabilities', 'Capability_Count',
        'Description', 'Enables', 'FSDM_Entity_Count',
        'BVF_Data_Requirements', 'Prerequisites', 'Effort_Estimate'
    ])
    for p in profile['implementation_sequence']:
        writer.writerow([
            p['phase'], p['name'], '; '.join(p['capabilities']),
            p['capability_count'], p['description'], p['enables'],
            p['fsdm_entity_count'], p['bvf_data_requirements'],
            '; '.join(str(x) for x in p['prerequisite_phases']),
            p['estimated_effort']
        ])

# Summary
print(f"\n=== PROFITABILITY MATURITY PROFILE COMPLETE ===")
print(f"Overall current maturity: {profile['overall_score']}")
print(f"Overall target maturity: {profile['overall_target']}")
print(f"Overall gap: {profile['overall_gap']}")
print(f"\nComponent scores:")
for comp_key, comp_data in profile['components'].items():
    print(f"  {comp_data['label']}: current={comp_data['current_avg']}, target={comp_data['target_avg']}, gap={comp_data['gap']}")
print(f"\nTop critical gaps:")
for g in profile['critical_gaps'][:5]:
    print(f"  {g['capability']}: {g['current']}→{g['desired']} (gap={g['gap']}, component={g['profitability_component']})")
print(f"\nImplementation phases:")
for p in profile['implementation_sequence']:
    print(f"  Phase {p['phase']}: {p['name']} - {p['capability_count']} capabilities, effort={p['estimated_effort']}")
