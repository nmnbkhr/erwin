#!/usr/bin/env python3
"""Phase 2: Map BACR Outcomes -> BVF Capabilities"""

import json
import csv
import os
import difflib

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'
BVF_DIR = '/mnt/e/erwin/bvf_fsdm_output'

# Load BACR questions
with open(os.path.join(OUTPUT_DIR, 'bacr_all_questions.json')) as f:
    bacr_questions = json.load(f)

# Load BVF capabilities
bvf_capabilities = []
with open(os.path.join(BVF_DIR, 'bvf_capability_summary.csv')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        bvf_capabilities.append({
            'name': row['Sub_Capability'].strip(),
            'bvf_area': row['Theme'].strip(),
            'bvf_group': row['Capability_Group'].strip(),
            'data_req_count': int(row['Data_Requirements_Count'])
        })

print(f"Loaded {len(bvf_capabilities)} BVF capabilities")

# Filter Outcomes questions only
outcomes = [q for q in bacr_questions if q['category'] == 'Outcomes']
print(f"BACR Outcomes questions: {len(outcomes)}")

# ============================================================
# Direct name mapping table (from prompt specification)
# ============================================================
DIRECT_MAPPINGS = {
    'customer value and profitability': 'Customer Value',
    'customer segmentation': 'Customer Segmentation',
    'event analytics': 'Event Detection',
    'contact optimization': 'Scope of Contact',
    'response optimization': 'Omni Channel Campaign Management',
    'cross channel customer experience': 'Channel Coverage',
    'contextual decisioning': 'Contextual Decisioning',
    'next best action arbitration': 'Next Best Action Arbitration',
    'personalization': 'Personalisation',
    'multi-step campaigns': 'Multi-Step Dialogue',
    'campaign effectiveness': 'Campaign ROI Reporting by Channel',
    'marketing attribution': 'Marketing Attribution MI across all channels',
    'transaction classification': 'Transaction Classification',
    'profitability analytics and optimisation': 'Profitability Analytics and Optimisation',
    'activity-based costing': 'Activity Based Costing',
    'activity based costing': 'Activity Based Costing',
    'future / lifetime value': 'Future / Lifetime Value',
    'performance management and kpis': 'Performance Management and KPIs',
    'funds transfer pricing': 'Funds Transfer Pricing',
    'asset and liability management': 'Asset & Liability Management',
    'capital planning and management': 'Capital Planning and Management',
    'cashflow generation': 'Cashflow Generation',
    'liquidity management': 'Liquidity Management',
    'fx and trading book management': 'FX & Trading Book Management',
    'interest rate management': 'Interest Rate Management',
    'statutory financial reporting': 'Statutory Financial Reporting',
    'regulatory and compliance reporting': 'Regulatory & Compliance Reporting',
    'sales reporting': 'Sales Reporting',
    'performance reporting': 'Performance Reporting',
    'exception reporting': 'Exception Reporting',
    'executive dashboards': 'Executive Dashboards',
    'financial consolidation': 'Financial Consolidation',
    'functional profit and loss statement': 'Functional Profit & Loss Statement (P&L)',
    'financial budgetting, planning and forecasting': 'Financial Budgeting, Planning & Forecasting',
    'financial budgeting, planning and forecasting': 'Financial Budgeting, Planning & Forecasting',
    'fair value and hedge accounting': 'Fair Value & Hedge Accounting',
    'tax management and optimisation': 'Tax Management & Optimisation',
    'reconciliation, validation and adjustment': 'Reconciliation, Validation & Adjustments',
    'risk scenario and stress test': 'Risk Scenario & Stress Testing Results (Analytical Model)',
    'credit risk appetite': 'Risk Appetite',
    'risk-based pricing': 'Credit Risk Based Pricing Model',
    'risk based pricing': 'Credit Risk Based Pricing Model',
    'credit portfolio management': 'Active Portfolio Management',
    'collections and recoveries optimization': 'Collection Strategy Model',
    'risk propensity and modelling': 'Credit Risk Scoring (Underwriting Likelihood Model)',
    'risk severity modelling': 'Credit Risk Expected Loss Model',
    'capital calculation and management': 'Capital Management (Planning and Allocation)',
    'risk/reward strategy optimization': 'Strategy (Rules) Performance MI',
    'model performance reporting': 'Model Performance Analytics',
    'risk model champion analysis': 'A/B and Test and Learn Deployment',
    'business process analytics and optimisation': 'Business Process Analytics & Optimisation',
    'product recommendation': 'Personalisation',
    'customer satisfaction': 'NPS MI & Drill Down',
    'customer experience': 'Channel Support & Engagement',
    'customer journey': 'Single Interaction View of Customer',
    'customer churn': 'Attrition Root Cause Analysis MI',
    'customer retention': 'Attrition Root Cause Analysis MI',
    'cross-sell / up-sell': 'Lead & Contact Management',
    'search engine optimization': 'Direct Customer Access to Information Products',
    'digital optimisation': 'Real Time Omni-Channel  Integration',
    'manage product profitability': 'Profitability Modelling',
    'revenue analytics': 'Profitability Analytics and Optimisation',
    'sub-ledger accounting': 'Financial Accounting / Accounting Hub',
    'billing and collections': 'Collection Strategy Model',
    'procurement and payment': 'Business Process Analytics & Optimisation',
    'asset valuations': 'Fair Value & Hedge Accounting',
    'reserve analytics': 'Financial Accounting / Accounting Hub',
    'gl, ap, and hr expense analytics': 'GL, AP, HR, Expense Analytics & Optimisation',
    'revenue assurance': 'Profitability Analytics and Optimisation',
    'risk underwriting': 'Credit Risk Underwriting/Monitoring Strategy Model',
    'supplier performance management': 'Business Process Analytics & Optimisation',
    'spend analytics': 'Business Process Analytics & Optimisation',
    'inventory analytics': 'Business Process Analytics & Optimisation',
    'quality management': 'Business Process Analytics & Optimisation',
    'lease management': 'Fixed Assets Management',
    'single view of customer': 'Single Interaction View of Customer',
    'multi-dimensional customer view': 'Single Interaction View of Customer',
    'customer connection analytics': 'Customer Managed Relationships',
    'behaviour/preference analytics': 'Predictive Models',
    'customer life stage analytics': 'Predictive Models',
    'customer acquisition': 'Insight Led Customer Strategy',
    'customer onboarding': 'Insight Led Customer Strategy',
    'customer loyalty': 'Insight Led Customer Strategy',
    'customer re-engagement': 'Insight Led Customer Strategy',
    'call/contact center optimization': 'Channel Support & Engagement',
    'collusion and fixing': 'Fraud and Money Laundering Likelihood Model',
}

STOPWORDS = {'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'for', 'is', 'are',
             'that', 'which', 'with', 'on', 'at', 'by', 'from', 'as', 'it', 'its',
             'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
             'should', 'may', 'might', 'can', 'shall', 'not', 'no', 'your', 'their',
             'this', 'these', 'those', 'all', 'any', 'each', 'every', 'both', 'few',
             'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'so',
             'how', 'what', 'when', 'where', 'who', 'whom', 'why', 'if', 'then',
             'also', 'but', 'because', 'about', 'into', 'through', 'during', 'before',
             'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
             'again', 'further', 'once', 'here', 'there', 'just', 'only', 'own',
             'same', 'much', 'many', 'well', 'back', 'even', 'still', 'new'}

# BVF area to business function alignment
BVF_AREA_TO_FUNC = {
    'Marketing and Customer Experience': ['Customer', 'Marketing'],
    'Risk Management & Regulation': ['Risks and Threats', 'Financial'],
    'Finance & Peformance Management': ['Financial', 'Operations'],
}

def extract_question_short(q_text):
    """Extract the leading capability name from question text."""
    # Many questions start with the capability name followed by a comma or dash
    text = q_text.strip()
    # Remove leading articles
    for prefix in ['A ', 'An ', 'The ']:
        if text.startswith(prefix):
            text = text[len(prefix):]
    # Take text before first comma, dash or 'to' clause
    for sep in [',', ' - ', ' to ', ' that ', ' which ', ' analytics ']:
        idx = text.lower().find(sep)
        if 0 < idx < 60:
            return text[:idx].strip()
    # Fallback: first 60 chars
    return text[:60].strip()

def business_function_alignment(bacr_q, bvf_cap):
    """Score alignment between BACR business functions and BVF area."""
    q_funcs = set(bacr_q.get('applicable_bus_functions', []))
    cap_area = bvf_cap['bvf_area']
    expected_funcs = set(BVF_AREA_TO_FUNC.get(cap_area, []))
    if not expected_funcs or not q_funcs:
        return 0.0
    overlap = len(q_funcs & expected_funcs)
    return overlap / max(len(expected_funcs), 1)

def match_bacr_to_bvf(bacr_q, bvf_caps):
    """Match a BACR Outcome question to BVF capabilities."""
    q_text = bacr_q['question'].lower().strip()
    q_short = extract_question_short(bacr_q['question']).lower()

    # 1. Try direct mapping table first
    for key, bvf_name in DIRECT_MAPPINGS.items():
        if key in q_short or key in q_text[:len(key)+20]:
            for cap in bvf_caps:
                if cap['name'] == bvf_name:
                    return [{
                        'bvf_capability': cap['name'],
                        'bvf_area': cap['bvf_area'],
                        'bvf_group': cap['bvf_group'],
                        'match_score': 0.95,
                        'match_method': 'direct_mapping'
                    }]

    # 2. Fuzzy matching
    matches = []
    q_keywords = set(q_text.split()) - STOPWORDS

    for cap in bvf_caps:
        cap_name = cap['name'].lower()

        # Name similarity
        ratio = difflib.SequenceMatcher(None, q_short, cap_name).ratio()

        # Keyword overlap
        cap_keywords = set(cap_name.split()) - STOPWORDS
        if cap_keywords:
            keyword_overlap = len(q_keywords & cap_keywords) / len(cap_keywords)
        else:
            keyword_overlap = 0.0

        # Business function alignment
        func_score = business_function_alignment(bacr_q, cap)

        # Combined score
        score = (ratio * 0.4) + (keyword_overlap * 0.4) + (func_score * 0.2)

        if score > 0.3:
            matches.append({
                'bvf_capability': cap['name'],
                'bvf_area': cap['bvf_area'],
                'bvf_group': cap['bvf_group'],
                'match_score': round(score, 3),
                'match_method': 'name_similarity' if ratio > 0.5 else 'keyword_overlap'
            })

    return sorted(matches, key=lambda x: x['match_score'], reverse=True)[:3]

# Profitability-critical BVF capabilities
PROFITABILITY_CAPABILITIES = {
    'Transaction Classification', 'Customer Value', 'Profitability Modelling',
    'Profitability Analytics and Optimisation', 'Activity Based Costing',
    'Future / Lifetime Value', 'Performance Management and KPIs',
    'Funds Transfer Pricing', 'Asset & Liability Management',
    'Capital Planning and Management', 'Cashflow Generation', 'Liquidity Management',
    'FX & Trading Book Management', 'Interest Rate Management',
    'Financial Accounting / Accounting Hub', 'Financial Consolidation',
    'Functional Profit & Loss Statement (P&L)', 'Fair Value & Hedge Accounting',
    'Reconciliation, Validation & Adjustments', 'Tax Management & Optimisation',
    'Statutory Financial Reporting', 'Regulatory & Compliance Reporting',
    'Sales Reporting', 'Performance Reporting', 'Exception Reporting',
    'Executive Dashboards', 'Financial Budgeting, Planning & Forecasting',
    'GL, AP, HR, Expense Analytics & Optimisation',
    'Business Process Analytics & Optimisation', 'Pricing Analysis & Optimisation',
    'Credit Risk Based Pricing Model', 'Credit Risk Expected Loss Model',
    'Credit Risk Scoring (Underwriting Likelihood Model)',
    'Capital Management (Planning and Allocation)', 'Risk Appetite',
    'Active Portfolio Management', 'Collection Strategy Model',
    'Strategy (Rules) Performance MI', 'Model Performance Analytics',
    'A/B and Test and Learn Deployment',
    'Risk Scenario & Stress Testing Results (Analytical Model)',
}

# ============================================================
# Run matching
# ============================================================
print("\nMatching BACR Outcomes to BVF Capabilities...")
mapping_results = []
mapped_count = 0
unmapped_count = 0

for q in outcomes:
    matches = match_bacr_to_bvf(q, bvf_capabilities)
    q_short = extract_question_short(q['question'])

    if matches:
        mapped_count += 1
        best = matches[0]
        is_prof_critical = best['bvf_capability'] in PROFITABILITY_CAPABILITIES

        mapping_results.append({
            'bacr_question_id': q['id'],
            'bacr_category': q['category'],
            'bacr_section': q['section'],
            'bacr_question_short': q_short,
            'bacr_question_full': q['question'],
            'maturity_descriptors': q['maturity_descriptors'],
            'bvf_capability': best['bvf_capability'],
            'bvf_area': best['bvf_area'],
            'bvf_group': best['bvf_group'],
            'match_score': best['match_score'],
            'match_method': best['match_method'],
            'all_matches': matches,
            'is_profitability_critical': is_prof_critical,
            'business_functions': q['applicable_bus_functions'],
            'is_financial_industry': q['is_financial_industry'],
            'is_tba': q['is_tba']
        })
    else:
        unmapped_count += 1
        mapping_results.append({
            'bacr_question_id': q['id'],
            'bacr_category': q['category'],
            'bacr_section': q['section'],
            'bacr_question_short': q_short,
            'bacr_question_full': q['question'],
            'maturity_descriptors': q['maturity_descriptors'],
            'bvf_capability': 'BACR-only (no BVF match)',
            'bvf_area': '',
            'bvf_group': '',
            'match_score': 0.0,
            'match_method': 'none',
            'all_matches': [],
            'is_profitability_critical': False,
            'business_functions': q['applicable_bus_functions'],
            'is_financial_industry': q['is_financial_industry'],
            'is_tba': q['is_tba']
        })

print(f"  Mapped: {mapped_count}, Unmapped: {unmapped_count}")

# ============================================================
# Outputs
# ============================================================

# bacr_to_bvf_mapping.csv
print("Writing bacr_to_bvf_mapping.csv...")
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'BACR_Question_ID', 'BACR_Category', 'BACR_Section', 'BACR_Question_Short',
        'BVF_Capability', 'BVF_Area', 'BVF_Sub_Area', 'Match_Score', 'Match_Method',
        'Is_Profitability_Critical', 'Business_Functions'
    ])
    for r in mapping_results:
        writer.writerow([
            r['bacr_question_id'], r['bacr_category'], r['bacr_section'],
            r['bacr_question_short'], r['bvf_capability'], r['bvf_area'],
            r['bvf_group'], r['match_score'], r['match_method'],
            r['is_profitability_critical'],
            '; '.join(r['business_functions'])
        ])

# bacr_to_bvf_mapping.json
print("Writing bacr_to_bvf_mapping.json...")
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json'), 'w') as f:
    json.dump(mapping_results, f, indent=2)

# Summary
bvf_covered = set()
for r in mapping_results:
    if r['bvf_capability'] != 'BACR-only (no BVF match)':
        bvf_covered.add(r['bvf_capability'])

all_bvf = set(c['name'] for c in bvf_capabilities)
bvf_not_in_bacr = all_bvf - bvf_covered

prof_critical_mapped = sum(1 for r in mapping_results if r['is_profitability_critical'])

print(f"\n=== BACR -> BVF MAPPING COMPLETE ===")
print(f"Total Outcomes: {len(outcomes)}")
print(f"Mapped to BVF: {mapped_count}")
print(f"BACR-only (no match): {unmapped_count}")
print(f"BVF capabilities covered: {len(bvf_covered)} of {len(all_bvf)}")
print(f"BVF capabilities NOT in BACR: {len(bvf_not_in_bacr)}")
print(f"Profitability-critical mappings: {prof_critical_mapped}")
print(f"\nBVF not covered by BACR:")
for name in sorted(bvf_not_in_bacr):
    print(f"  - {name}")
