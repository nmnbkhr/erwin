#!/usr/bin/env python3
"""Phase 4: Build Maturity-Informed Implementation Priority"""

import json
import csv
import os
from collections import defaultdict

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'
BVF_DIR = '/mnt/e/erwin/bvf_fsdm_output'

# Load BACR-to-BVF mapping
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json')) as f:
    bacr_bvf = json.load(f)

# Load BVF-to-FSDM entity mapping
bvf_fsdm = defaultdict(list)
with open(os.path.join(BVF_DIR, 'bvf_to_fsdm_entity_mapping.csv')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        bvf_fsdm[row['Data_Requirement'].strip()].append({
            'entity': row['FSDM_Entity'].strip(),
            'subject_area': row['FSDM_Subject_Area'].strip(),
        })

# Load BVF capability summary for data req counts
bvf_caps = {}
with open(os.path.join(BVF_DIR, 'bvf_capability_summary.csv')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        bvf_caps[row['Sub_Capability'].strip()] = {
            'theme': row['Theme'].strip(),
            'group': row['Capability_Group'].strip(),
            'data_req_count': int(row['Data_Requirements_Count'])
        }

# ============================================================
# UBL Estimated Default Maturity Scores
# ============================================================
UBL_ESTIMATED_DEFAULTS = {
    "Outcomes": {
        "Customer Value": {"current": 3, "desired": 5},
        "Customer Segmentation": {"current": 2, "desired": 4},
        "Transaction Classification": {"current": 3, "desired": 5},
        "Profitability Analytics and Optimisation": {"current": 3, "desired": 5},
        "Activity Based Costing": {"current": 2, "desired": 4},
        "Future / Lifetime Value": {"current": 2, "desired": 4},
        "Performance Management and KPIs": {"current": 2, "desired": 4},
        "Funds Transfer Pricing": {"current": 2, "desired": 5},
        "Asset & Liability Management": {"current": 2, "desired": 4},
        "Capital Planning and Management": {"current": 2, "desired": 4},
        "Cashflow Generation": {"current": 2, "desired": 4},
        "Liquidity Management": {"current": 2, "desired": 4},
        "FX & Trading Book Management": {"current": 2, "desired": 4},
        "Interest Rate Management": {"current": 2, "desired": 4},
        "Statutory Financial Reporting": {"current": 2, "desired": 4},
        "Regulatory & Compliance Reporting": {"current": 2, "desired": 4},
        "Sales Reporting": {"current": 2, "desired": 4},
        "Performance Reporting": {"current": 2, "desired": 4},
        "Exception Reporting": {"current": 2, "desired": 4},
        "Executive Dashboards": {"current": 2, "desired": 4},
        "Financial Consolidation": {"current": 2, "desired": 4},
        "Functional Profit & Loss Statement (P&L)": {"current": 2, "desired": 5},
        "Financial Budgeting, Planning & Forecasting": {"current": 2, "desired": 4},
        "Fair Value & Hedge Accounting": {"current": 2, "desired": 4},
        "Tax Management & Optimisation": {"current": 2, "desired": 4},
        "Reconciliation, Validation & Adjustments": {"current": 2, "desired": 4},
        "Credit Risk Based Pricing Model": {"current": 2, "desired": 4},
        "Credit Risk Expected Loss Model": {"current": 2, "desired": 4},
        "Credit Risk Scoring (Underwriting Likelihood Model)": {"current": 2, "desired": 4},
        "Capital Management (Planning and Allocation)": {"current": 2, "desired": 4},
        "Risk Appetite": {"current": 2, "desired": 4},
        "Active Portfolio Management": {"current": 2, "desired": 4},
        "Collection Strategy Model": {"current": 2, "desired": 4},
        "Strategy (Rules) Performance MI": {"current": 2, "desired": 4},
        "Model Performance Analytics": {"current": 2, "desired": 4},
        "Profitability Modelling": {"current": 3, "desired": 5},
        "Financial Accounting / Accounting Hub": {"current": 2, "desired": 4},
        "Single Interaction View of Customer": {"current": 3, "desired": 5},
        "Predictive Models": {"current": 2, "desired": 4},
        "Insight Led Customer Strategy": {"current": 2, "desired": 4},
        "GL, AP, HR, Expense Analytics & Optimisation": {"current": 2, "desired": 4},
        "Business Process Analytics & Optimisation": {"current": 2, "desired": 4},
        "Pricing Analysis & Optimisation": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Information": {
        "Architecture": {"current": 3, "desired": 5},
        "Master Data Management": {"current": 2, "desired": 4},
        "Data Quality": {"current": 2, "desired": 4},
        "Data Coverage": {"current": 3, "desired": 5},
        "Data Centricity": {"current": 2, "desired": 4},
        "Security and Privacy": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Systems": {
        "_default": {"current": 3, "desired": 4}
    },
    "Governance": {
        "_default": {"current": 2, "desired": 4}
    },
    "_default": {"current": 2, "desired": 4}
}

def get_maturity_score(capability_name, category="Outcomes"):
    """Get estimated maturity score for a capability."""
    cat_defaults = UBL_ESTIMATED_DEFAULTS.get(category, UBL_ESTIMATED_DEFAULTS['_default'])
    if isinstance(cat_defaults, dict) and capability_name in cat_defaults:
        return cat_defaults[capability_name]
    if isinstance(cat_defaults, dict) and '_default' in cat_defaults:
        return cat_defaults['_default']
    return UBL_ESTIMATED_DEFAULTS['_default']

# ============================================================
# Build maturity gap analysis
# ============================================================
print("Building maturity gap analysis...")

# Group BACR questions by BVF capability
cap_questions = defaultdict(list)
for r in bacr_bvf:
    cap = r['bvf_capability']
    if cap != 'BACR-only (no BVF match)':
        cap_questions[cap].append(r)

maturity_gaps = []
for cap_name, questions in cap_questions.items():
    score = get_maturity_score(cap_name)
    cap_info = bvf_caps.get(cap_name, {})

    # Count FSDM entities via data requirements
    fsdm_entities = set()
    for dr_name, entities in bvf_fsdm.items():
        for e in entities:
            fsdm_entities.add(e['entity'])

    gap = score['desired'] - score['current']
    is_prof_critical = any(q['is_profitability_critical'] for q in questions)

    for q in questions:
        maturity_gaps.append({
            'bvf_capability': cap_name,
            'bvf_area': cap_info.get('theme', q.get('bvf_area', '')),
            'bacr_question_id': q['bacr_question_id'],
            'current_state': score['current'],
            'desired_state': score['desired'],
            'maturity_gap': gap,
            'is_profitability_critical': is_prof_critical,
            'fsdm_entity_count': cap_info.get('data_req_count', 0),
            'priority_tier': 'Tier 1' if gap >= 3 and is_prof_critical else
                           'Tier 2' if gap >= 2 and is_prof_critical else
                           'Tier 3' if gap >= 2 else 'Tier 4'
        })

# ============================================================
# Enhanced implementation priority
# ============================================================
print("Calculating enhanced implementation priority...")

def assign_tier(score):
    if score >= 8:
        return 'Tier 1 - Critical'
    elif score >= 5:
        return 'Tier 2 - High'
    elif score >= 3:
        return 'Tier 3 - Medium'
    return 'Tier 4 - Low'

# Build per-capability priority
cap_priorities = []
for cap_name, questions in cap_questions.items():
    score = get_maturity_score(cap_name)
    gap = score['desired'] - score['current']
    cap_info = bvf_caps.get(cap_name, {})
    is_prof_critical = any(q['is_profitability_critical'] for q in questions)

    # Base BVF score (data req count as proxy for complexity/value)
    bvf_score = min(cap_info.get('data_req_count', 10) / 10.0, 10.0)

    # Maturity gap factor
    maturity_gap_factor = gap / 4.0

    # Readiness factor
    if score['current'] >= 3:
        readiness_factor = 1.2
    elif score['current'] <= 1:
        readiness_factor = 0.8
    else:
        readiness_factor = 1.0

    # Profitability boost
    prof_boost = 1.5 if is_prof_critical else 1.0

    enhanced_score = bvf_score * (1.0 + maturity_gap_factor) * readiness_factor * prof_boost

    # Get FSDM subject areas
    fsdm_areas = set()
    for q in questions:
        area = q.get('bvf_area', '')
        if area:
            fsdm_areas.add(area)

    cap_priorities.append({
        'rank': 0,
        'capability': cap_name,
        'bvf_area': cap_info.get('theme', ''),
        'bvf_group': cap_info.get('group', ''),
        'bvf_priority_score': round(bvf_score, 2),
        'current_maturity': score['current'],
        'target_maturity': score['desired'],
        'maturity_gap': gap,
        'readiness_factor': readiness_factor,
        'enhanced_priority_score': round(enhanced_score, 2),
        'implementation_tier': assign_tier(enhanced_score),
        'is_profitability_critical': is_prof_critical,
        'bacr_question_count': len(questions),
        'data_req_count': cap_info.get('data_req_count', 0),
    })

# Sort by enhanced score descending
cap_priorities.sort(key=lambda x: x['enhanced_priority_score'], reverse=True)
for i, p in enumerate(cap_priorities):
    p['rank'] = i + 1

# ============================================================
# Outputs
# ============================================================

# enhanced_implementation_priority.csv
print("Writing enhanced_implementation_priority.csv...")
with open(os.path.join(OUTPUT_DIR, 'enhanced_implementation_priority.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'Rank', 'Capability', 'BVF_Area', 'BVF_Group',
        'BVF_Priority_Score', 'Current_Maturity', 'Target_Maturity',
        'Maturity_Gap', 'Readiness_Factor', 'Enhanced_Priority_Score',
        'Implementation_Tier', 'Is_Profitability_Critical',
        'BACR_Question_Count', 'Data_Requirements_Count'
    ])
    for p in cap_priorities:
        writer.writerow([
            p['rank'], p['capability'], p['bvf_area'], p['bvf_group'],
            p['bvf_priority_score'], p['current_maturity'], p['target_maturity'],
            p['maturity_gap'], p['readiness_factor'], p['enhanced_priority_score'],
            p['implementation_tier'], p['is_profitability_critical'],
            p['bacr_question_count'], p['data_req_count']
        ])

# maturity_gap_analysis.csv
print("Writing maturity_gap_analysis.csv...")
with open(os.path.join(OUTPUT_DIR, 'maturity_gap_analysis.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'BVF_Capability', 'BVF_Area', 'BACR_Question_ID',
        'Current_State', 'Desired_State', 'Maturity_Gap',
        'Is_Profitability_Critical', 'FSDM_Entity_Count', 'Priority_Tier'
    ])
    for g in maturity_gaps:
        writer.writerow([
            g['bvf_capability'], g['bvf_area'], g['bacr_question_id'],
            g['current_state'], g['desired_state'], g['maturity_gap'],
            g['is_profitability_critical'], g['fsdm_entity_count'], g['priority_tier']
        ])

# Print summary
print(f"\n=== MATURITY-INFORMED PRIORITY COMPLETE ===")
print(f"Capabilities prioritized: {len(cap_priorities)}")
tier_counts = defaultdict(int)
for p in cap_priorities:
    tier_counts[p['implementation_tier']] += 1
for tier in sorted(tier_counts.keys()):
    print(f"  {tier}: {tier_counts[tier]} capabilities")

print(f"\nTop 15 by enhanced priority:")
for p in cap_priorities[:15]:
    print(f"  #{p['rank']} {p['capability']}: score={p['enhanced_priority_score']}, gap={p['maturity_gap']}, prof={p['is_profitability_critical']}")
