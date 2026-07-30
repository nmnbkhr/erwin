#!/usr/bin/env python3
"""Phase 7b: Generate Markdown Report + Statistics JSON"""

import json
import os
from collections import defaultdict

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'

# Load all data
with open(os.path.join(OUTPUT_DIR, 'bacr_all_questions.json')) as f:
    bacr_questions = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'bacr_category_summary.json')) as f:
    cat_summary = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json')) as f:
    bacr_bvf = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'bacr_information_to_fsdm.json')) as f:
    info_fsdm = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'profitability_maturity_profile.json')) as f:
    prof_profile = json.load(f)['profitability_maturity']
with open(os.path.join(OUTPUT_DIR, 'cross_category_dependencies.json')) as f:
    cross_cat = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'enhanced_implementation_priority.csv')) as f:
    import csv
    priority_rows = list(csv.DictReader(f))

# ============================================================
# Statistics JSON
# ============================================================
print("Building bacr_statistics.json...")

mapped_to_bvf = sum(1 for r in bacr_bvf if r['bvf_capability'] != 'BACR-only (no BVF match)')
unmapped = sum(1 for r in bacr_bvf if r['bvf_capability'] == 'BACR-only (no BVF match)')
bvf_covered = len(set(r['bvf_capability'] for r in bacr_bvf if r['bvf_capability'] != 'BACR-only (no BVF match)'))

# Count by business function
bf_counts = defaultdict(int)
for q in bacr_questions:
    for bf in q['applicable_bus_functions']:
        bf_counts[bf] += 1

# Count by review type
rt_counts = defaultdict(int)
for q in bacr_questions:
    for rt in q['review_types']:
        rt_counts[rt] += 1

# FSDM domains covered
fsdm_domains = set()
for m in info_fsdm:
    for d in m['fsdm_domains']:
        fsdm_domains.add(d)

stats = {
    "bacr_summary": {
        "total_questions": len(bacr_questions),
        "categories": len(cat_summary['categories']),
        "financial_industry_questions": sum(1 for q in bacr_questions if q['is_financial_industry']),
        "tba_questions": sum(1 for q in bacr_questions if q['is_tba']),
        "questions_by_category": {cat: data['question_count'] for cat, data in cat_summary['categories'].items()},
        "questions_by_business_function": dict(bf_counts),
        "questions_by_review_type": dict(rt_counts)
    },
    "bvf_mapping": {
        "bacr_outcomes_mapped_to_bvf": mapped_to_bvf,
        "bacr_outcomes_unmapped": unmapped,
        "bvf_capabilities_covered": bvf_covered,
        "bvf_capabilities_not_in_bacr": 112 - bvf_covered,
        "profitability_critical_mappings": sum(1 for r in bacr_bvf if r['is_profitability_critical'])
    },
    "fsdm_mapping": {
        "bacr_info_questions_mapped": len(info_fsdm),
        "fsdm_domains_covered": len(fsdm_domains),
        "fsdm_domains": sorted(fsdm_domains)
    },
    "profitability": {
        "profitability_questions_count": sum(1 for r in bacr_bvf if r['is_profitability_critical']),
        "avg_current_maturity": prof_profile['overall_score'],
        "avg_desired_maturity": prof_profile['overall_target'],
        "avg_gap": prof_profile['overall_gap'],
        "implementation_phases": len(prof_profile['implementation_sequence']),
        "component_scores": {k: {"current": v['current_avg'], "target": v['target_avg'], "gap": v['gap']}
                            for k, v in prof_profile['components'].items()},
        "critical_gap_count": len(prof_profile['critical_gaps'])
    },
    "priority": {
        "tier1_critical": sum(1 for r in priority_rows if 'Tier 1' in r.get('Implementation_Tier', '')),
        "tier2_high": sum(1 for r in priority_rows if 'Tier 2' in r.get('Implementation_Tier', '')),
        "tier3_medium": sum(1 for r in priority_rows if 'Tier 3' in r.get('Implementation_Tier', '')),
        "tier4_low": sum(1 for r in priority_rows if 'Tier 4' in r.get('Implementation_Tier', '')),
    }
}

with open(os.path.join(OUTPUT_DIR, 'bacr_statistics.json'), 'w') as f:
    json.dump(stats, f, indent=2)
print("  Written bacr_statistics.json")

# ============================================================
# Markdown Report
# ============================================================
print("Building bacr_maturity_report.md...")

# Helper
def table_row(cells):
    return '| ' + ' | '.join(str(c) for c in cells) + ' |'

report = []
report.append("# BACR Maturity Assessment Report")
report.append("## United Bank Limited — Profitability Engine Integration")
report.append("")
report.append("---")
report.append("")

# 1. Executive Summary
report.append("## 1. Executive Summary")
report.append("")
report.append(f"This report analyzes Teradata's **Business & Analytics Capability Review (BACR)** framework")
report.append(f"comprising **{stats['bacr_summary']['total_questions']} questions** across **{stats['bacr_summary']['categories']} categories**,")
report.append(f"mapped to the **Banking Business Value Framework (BVF)** and **Financial Services Data Model (FSDM)**.")
report.append("")
report.append("### Key Findings")
report.append("")
report.append(f"- **{stats['bacr_summary']['financial_industry_questions']}** questions are relevant to the Financial industry")
report.append(f"- **{stats['bvf_mapping']['bacr_outcomes_mapped_to_bvf']}** Outcome questions mapped to **{stats['bvf_mapping']['bvf_capabilities_covered']}** BVF capabilities")
report.append(f"- **{stats['bvf_mapping']['profitability_critical_mappings']}** questions are profitability-critical")
report.append(f"- Overall profitability maturity: **{prof_profile['overall_score']}/5** (target: {prof_profile['overall_target']}/5, gap: {prof_profile['overall_gap']})")
report.append(f"- **4 implementation phases** defined to build the profitability engine")
report.append("")

# 2. BACR Structure
report.append("## 2. BACR Structure")
report.append("")
report.append("The BACR framework assesses organizational maturity across 8 categories using a 5-level scale:")
report.append("")
report.append("| Level | Name | Description |")
report.append("|---|---|---|")
report.append("| 1 | Emerging | Initial/ad-hoc capabilities |")
report.append("| 2 | Developing | Basic processes established |")
report.append("| 3 | Practicing | Consistent enterprise practices |")
report.append("| 4 | Innovating | Optimized and data-driven |")
report.append("| 5 | Leading | Industry-leading capabilities |")
report.append("")

report.append("### Categories")
report.append("")
report.append("| Category | Questions | Financial Qs | Sections |")
report.append("|---|---|---|---|")
for cat_name in ['Outcomes', 'Information', 'Systems', 'Applications', 'Governance', 'Business', 'Culture', 'Agility']:
    data = cat_summary['categories'].get(cat_name, {})
    sections = ', '.join(data.get('sections', [])[:5])
    if len(data.get('sections', [])) > 5:
        sections += f" (+{len(data['sections'])-5} more)"
    report.append(f"| {cat_name} | {data.get('question_count', 0)} | {data.get('financial_question_count', 0)} | {sections} |")
report.append("")

# 3. BACR → BVF Mapping
report.append("## 3. BACR → BVF Capability Mapping")
report.append("")
report.append(f"The 220 BACR Outcome questions were matched to 112 BVF capabilities using:")
report.append("- **Direct name mapping** (known correspondences)")
report.append("- **Fuzzy string matching** (SequenceMatcher, threshold > 0.3)")
report.append("- **Business function alignment** scoring")
report.append("")
report.append(f"**Results:** {mapped_to_bvf} mapped, {unmapped} BACR-only (no BVF equivalent)")
report.append("")

report.append("### Top Profitability-Critical Mappings")
report.append("")
report.append("| BACR Question | BVF Capability | BVF Area | Score |")
report.append("|---|---|---|---|")
prof_mappings = sorted([r for r in bacr_bvf if r['is_profitability_critical']],
                       key=lambda x: x['match_score'], reverse=True)
for r in prof_mappings[:20]:
    report.append(f"| {r['bacr_question_short'][:50]} | {r['bvf_capability'][:50]} | {r['bvf_area'][:40]} | {r['match_score']} |")
report.append("")

# 4. BACR → FSDM Mapping
report.append("## 4. BACR Information → FSDM Data Domain Mapping")
report.append("")
report.append(f"The {len(info_fsdm)} Information category questions assess data management maturity")
report.append("and map to FSDM domains as follows:")
report.append("")
report.append("| Information Section | Questions | FSDM Domains | Profitability Impact |")
report.append("|---|---|---|---|")
from collections import Counter
sec_counts = Counter(m['bacr_section'] for m in info_fsdm)
sec_domains = defaultdict(set)
sec_impact = {}
for m in info_fsdm:
    for d in m['fsdm_domains']:
        sec_domains[m['bacr_section']].add(d)
    sec_impact[m['bacr_section']] = m['profitability_impact'][:60]
for sec in sorted(sec_counts.keys()):
    domains = ', '.join(sorted(sec_domains[sec])[:4])
    report.append(f"| {sec} | {sec_counts[sec]} | {domains} | {sec_impact[sec]} |")
report.append("")

# 5. Profitability Maturity Profile
report.append("## 5. Profitability Maturity Profile")
report.append("")
report.append(f"**Overall Score: {prof_profile['overall_score']}/5** (Target: {prof_profile['overall_target']}/5)")
report.append("")
report.append("### Component Maturity")
report.append("")
report.append("| Component | Current | Target | Gap | Capabilities |")
report.append("|---|---|---|---|---|")
for comp_key, comp_data in prof_profile['components'].items():
    report.append(f"| {comp_data['label']} | {comp_data['current_avg']} | {comp_data['target_avg']} | {comp_data['gap']} | {comp_data['capability_count']} |")
report.append("")

report.append("### Critical Gaps")
report.append("")
for i, g in enumerate(prof_profile['critical_gaps'][:10]):
    report.append(f"**{i+1}. {g['capability']}** — Gap: {g['gap']} ({g['current']}→{g['desired']})")
    report.append(f"   - Component: {g['profitability_component']}")
    report.append(f"   - Star Schema Impact: {g['star_schema_measures_affected'][0][:80]}")
    report.append(f"   - FSDM Entities: {', '.join(g['fsdm_entities_required'][:5])}")
    report.append("")

# 6. Gap Analysis
report.append("## 6. Gap Analysis")
report.append("")
report.append("### Quick Wins (Current ≥ 3, Gap ≤ 2)")
report.append("")
quick_wins = [r for r in priority_rows if float(r.get('Current_Maturity', 0)) >= 3
              and r.get('Is_Profitability_Critical', '') == 'True']
for qw in quick_wins[:10]:
    report.append(f"- **{qw['Capability']}**: Current={qw['Current_Maturity']}, Gap={qw['Maturity_Gap']}, Priority Score={qw['Enhanced_Priority_Score']}")
report.append("")

report.append("### Biggest Gaps (Gap ≥ 3)")
report.append("")
big_gaps = [g for g in prof_profile['critical_gaps'] if g['gap'] >= 3]
if big_gaps:
    for g in big_gaps:
        report.append(f"- **{g['capability']}**: {g['current']}→{g['desired']} (gap={g['gap']})")
        for action in g.get('recommended_actions', [])[:2]:
            report.append(f"  - {action}")
else:
    report.append("- No gaps ≥ 3 identified (most capabilities at 2→4 range)")
report.append("")

# 7. Implementation Roadmap
report.append("## 7. Implementation Roadmap")
report.append("")
for p in prof_profile['implementation_sequence']:
    report.append(f"### Phase {p['phase']}: {p['name']}")
    report.append("")
    report.append(f"**Effort:** {p['estimated_effort']} | **Prerequisites:** {', '.join(str(x) for x in p['prerequisite_phases']) or 'None'}")
    report.append("")
    report.append("**Capabilities:**")
    for cap in p['capabilities']:
        report.append(f"- {cap}")
    report.append("")
    report.append(f"**Enables:** {p['enables']}")
    report.append("")
    report.append(f"**Key FSDM Entities:** {', '.join(p['fsdm_entities'][:8])}")
    report.append("")

# 8. Cross-Category Dependencies
report.append("## 8. Cross-Category Dependencies")
report.append("")
report.append("The profitability engine depends on maturity across multiple BACR categories:")
report.append("")
report.append("```")
report.append("Information (Data) → Outcomes (Capabilities) → Business (Value)")
report.append("     ↑                      ↑                        ↑")
report.append(" Governance ←─── Systems (Technology) ──→ Applications")
report.append("     ↑                      ↑")
report.append("  Culture ←──────── Agility")
report.append("```")
report.append("")

dep_chain = cross_cat.get('profitability_dependency_chain', {})
report.append("| Readiness Area | Category | Avg Maturity | Questions | Blocking Gaps |")
report.append("|---|---|---|---|---|")
for key in ['data_readiness', 'technology_readiness', 'governance_readiness', 'capability_maturity', 'application_readiness']:
    d = dep_chain.get(key, {})
    report.append(f"| {key.replace('_', ' ').title()} | {d.get('category', '')} | {d.get('avg_maturity', 0)} | {d.get('question_count', 0)} | {len(d.get('blocking_gaps', []))} |")
report.append("")

# 9. UBL-Specific Recommendations
report.append("## 9. UBL-Specific Recommendations")
report.append("")
report.append("Based on UBL's known context (Teradata DW, FSDM v13, existing Customer Profitability Engine):")
report.append("")
report.append("### Immediate Priorities")
report.append("1. **Funds Transfer Pricing** (gap=3): Deploy FTP rate curve management with matched-maturity methodology")
report.append("2. **Functional P&L** (gap=3): Build multi-dimensional P&L by customer/product/channel/branch")
report.append("3. **Activity-Based Costing**: Develop cost allocation models using existing FSDM organization hierarchy")
report.append("")
report.append("### Leverage Existing Strengths")
report.append("- FSDM v13 deployment provides strong data architecture foundation (Information Architecture: 3/5)")
report.append("- Existing profitability engine can be extended rather than rebuilt")
report.append("- Teradata infrastructure maturity (Systems: 3/5) supports processing requirements")
report.append("")
report.append("### Address Gaps")
report.append("- **Data Governance** (2/5): Establish data quality KPIs for profitability-critical entities")
report.append("- **Master Data Management** (2/5): Strengthen customer and product master data for reliable profitability")
report.append("- **Risk Models** (2/5): Integrate PD/LGD models for RAROC-based profitability")
report.append("")
report.append("---")
report.append("")
report.append("*Generated from BACR Interview Master (DA004462) integrated with BVF Data Mappings and FSDM Schema*")

# Write report
report_text = '\n'.join(report)
with open(os.path.join(OUTPUT_DIR, 'bacr_maturity_report.md'), 'w') as f:
    f.write(report_text)
print(f"  Written bacr_maturity_report.md ({len(report)} lines)")

print(f"\n=== PHASE 7 REPORTS COMPLETE ===")
print(f"  bacr_statistics.json")
print(f"  bacr_maturity_report.md")
print(f"  bacr_assessment_template.xlsx (from Phase 7a)")
