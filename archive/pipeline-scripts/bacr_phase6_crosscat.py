#!/usr/bin/env python3
"""Phase 6: Cross-Category Analysis"""

import json
import os
from collections import defaultdict

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'

# Load data
with open(os.path.join(OUTPUT_DIR, 'bacr_all_questions.json')) as f:
    bacr_questions = json.load(f)

with open(os.path.join(OUTPUT_DIR, 'bacr_category_summary.json')) as f:
    cat_summary = json.load(f)

# UBL estimated defaults by category/section
UBL_DEFAULTS = {
    "Information": {
        "Architecture": {"current": 3, "desired": 5},
        "Master Data Management": {"current": 2, "desired": 4},
        "Data Quality": {"current": 2, "desired": 4},
        "Data Coverage": {"current": 3, "desired": 5},
        "Data Centricity": {"current": 2, "desired": 4},
        "Data Organisation": {"current": 2, "desired": 4},
        "Data Tiers": {"current": 2, "desired": 4},
        "Data Usage Zones": {"current": 2, "desired": 4},
        "Security and Privacy": {"current": 2, "desired": 4},
        "Metadata Management": {"current": 2, "desired": 4},
        "Summary": {"current": 2, "desired": 4},
        "Strategy": {"current": 2, "desired": 4},
        "Roadmap": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Systems": {
        "Architecture": {"current": 3, "desired": 5},
        "Teradata": {"current": 3, "desired": 5},
        "Storage": {"current": 3, "desired": 4},
        "Infrastructure Models": {"current": 3, "desired": 4},
        "Hadoop": {"current": 1, "desired": 3},
        "_default": {"current": 3, "desired": 4}
    },
    "Governance": {
        "Data Governance": {"current": 2, "desired": 4},
        "Bus Governance": {"current": 2, "desired": 4},
        "Tech Governance": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Outcomes": {
        "Analytic Capabilities": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Applications": {
        "Architecture": {"current": 3, "desired": 4},
        "Data Orchestration": {"current": 2, "desired": 4},
        "Analytic Apps": {"current": 2, "desired": 4},
        "_default": {"current": 2, "desired": 4}
    },
    "Business": {
        "_default": {"current": 2, "desired": 4}
    },
    "Culture": {
        "_default": {"current": 2, "desired": 4}
    },
    "Agility": {
        "_default": {"current": 2, "desired": 3}
    }
}

def get_score(category, section):
    cat_d = UBL_DEFAULTS.get(category, UBL_DEFAULTS.get("_default", {"_default": {"current": 2, "desired": 4}}))
    if section in cat_d:
        return cat_d[section]
    return cat_d.get("_default", {"current": 2, "desired": 4})

# ============================================================
# Build cross-category dependency analysis
# ============================================================
print("Building cross-category dependency analysis...")

# Critical sections for profitability by category
PROFITABILITY_CRITICAL_SECTIONS = {
    "Information": ["Architecture", "Master Data Management", "Data Quality", "Data Coverage", "Data Centricity"],
    "Systems": ["Architecture", "Teradata", "Infrastructure Models", "Storage"],
    "Governance": ["Data Governance", "Bus Governance", "Tech Governance"],
    "Outcomes": ["Analytic Capabilities"],
    "Applications": ["Architecture", "Data Orchestration", "Analytic Apps"],
}

dependency_chain = {}

for category in ["Information", "Systems", "Governance", "Outcomes", "Applications"]:
    critical_sections = PROFITABILITY_CRITICAL_SECTIONS.get(category, [])

    # Get questions in critical sections
    cat_questions = [q for q in bacr_questions if q['category'] == category]
    critical_questions = [q for q in cat_questions if q['section'] in critical_sections]

    # Calculate avg maturity
    scores = []
    blocking_gaps = []
    for q in critical_questions:
        s = get_score(category, q['section'])
        gap = s['desired'] - s['current']
        scores.append(s['current'])
        if gap >= 2:
            blocking_gaps.append(f"{q['section']}: gap={gap} ({s['current']}→{s['desired']})")

    avg_maturity = sum(scores) / len(scores) if scores else 0

    label_map = {
        "Information": "data_readiness",
        "Systems": "technology_readiness",
        "Governance": "governance_readiness",
        "Outcomes": "capability_maturity",
        "Applications": "application_readiness"
    }

    dependency_chain[label_map[category]] = {
        "category": category,
        "critical_sections": critical_sections,
        "question_count": len(critical_questions),
        "total_category_questions": len(cat_questions),
        "avg_maturity": round(avg_maturity, 2),
        "blocking_gaps": list(set(blocking_gaps))[:10]
    }

# Add filter info for Outcomes
dependency_chain["capability_maturity"]["filter"] = "Financial business function"
financial_outcomes = [q for q in bacr_questions
                      if q['category'] == 'Outcomes' and q['is_financial_industry']]
dependency_chain["capability_maturity"]["financial_question_count"] = len(financial_outcomes)

# Build category interdependency matrix
interdependency_matrix = {
    "Information → Outcomes": {
        "description": "Information maturity gates what data is available, determining which FSDM entities can be populated",
        "strength": "Critical",
        "profitability_impact": "Without data readiness (Information ≥3), profitability calculations lack source data"
    },
    "Systems → Information": {
        "description": "Systems maturity determines if Teradata/FSDM can handle the data volume and processing workload",
        "strength": "Critical",
        "profitability_impact": "Without adequate systems (Systems ≥3), FSDM deployment and star schema processing is constrained"
    },
    "Governance → Information": {
        "description": "Governance ensures data quality and consistency for profitability calculations",
        "strength": "High",
        "profitability_impact": "Without governance (Governance ≥3), profitability numbers are unreliable"
    },
    "Outcomes → Business": {
        "description": "Outcomes (Financial function) measures profitability capability maturity and drives business value",
        "strength": "High",
        "profitability_impact": "Outcomes maturity determines which profitability measures are producible"
    },
    "Applications → Outcomes": {
        "description": "Applications determines how profitability results are consumed (dashboards, reports, APIs)",
        "strength": "Medium",
        "profitability_impact": "Without applications maturity, profitability insights don't reach decision-makers"
    },
    "Culture → Governance": {
        "description": "Data-driven culture supports governance adoption and data quality ownership",
        "strength": "Medium",
        "profitability_impact": "Cultural resistance undermines data governance initiatives"
    },
    "Agility → Systems": {
        "description": "Agile practices enable faster iteration on systems and data architecture",
        "strength": "Low",
        "profitability_impact": "Agility affects speed of profitability engine evolution, not core functionality"
    }
}

# ============================================================
# Output
# ============================================================
output = {
    "profitability_dependency_chain": dependency_chain,
    "interdependency_matrix": interdependency_matrix,
    "category_maturity_summary": {}
}

# Per-category summary
for cat_name in sorted(set(q['category'] for q in bacr_questions)):
    cat_qs = [q for q in bacr_questions if q['category'] == cat_name]
    sections = defaultdict(int)
    for q in cat_qs:
        sections[q['section']] += 1

    section_scores = {}
    for sec in sections:
        s = get_score(cat_name, sec)
        section_scores[sec] = {
            "question_count": sections[sec],
            "current_maturity": s['current'],
            "desired_maturity": s['desired'],
            "gap": s['desired'] - s['current']
        }

    all_scores = [get_score(cat_name, sec)['current'] for sec in sections]
    avg = sum(all_scores) / len(all_scores) if all_scores else 0

    output["category_maturity_summary"][cat_name] = {
        "total_questions": len(cat_qs),
        "avg_current_maturity": round(avg, 2),
        "sections": section_scores
    }

print("Writing cross_category_dependencies.json...")
with open(os.path.join(OUTPUT_DIR, 'cross_category_dependencies.json'), 'w') as f:
    json.dump(output, f, indent=2)

print(f"\n=== CROSS-CATEGORY ANALYSIS COMPLETE ===")
print(f"\nProfitability Dependency Chain:")
for key, data in dependency_chain.items():
    print(f"  {key} ({data['category']}): avg_maturity={data['avg_maturity']}, questions={data['question_count']}, blocking_gaps={len(data['blocking_gaps'])}")

print(f"\nCategory Maturity Summary:")
for cat, data in sorted(output['category_maturity_summary'].items()):
    print(f"  {cat}: {data['total_questions']} questions, avg_maturity={data['avg_current_maturity']}")
