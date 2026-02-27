#!/usr/bin/env python3
"""Phase 3: Map BACR Information -> FSDM Data Domains"""

import json
import csv
import os

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'
BVF_DIR = '/mnt/e/erwin/bvf_fsdm_output'
FSDM_DIR = '/mnt/e/erwin/fsdm_output'

# Load BACR questions
with open(os.path.join(OUTPUT_DIR, 'bacr_all_questions.json')) as f:
    bacr_questions = json.load(f)

# Load FSDM domain map
with open(os.path.join(FSDM_DIR, 'fsdm_domain_map.json')) as f:
    fsdm_domain_map = json.load(f)

# Load BVF-to-FSDM entity mapping
bvf_fsdm_entities = {}
with open(os.path.join(BVF_DIR, 'bvf_to_fsdm_entity_mapping.csv')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        dr = row['Data_Requirement'].strip()
        if dr not in bvf_fsdm_entities:
            bvf_fsdm_entities[dr] = []
        bvf_fsdm_entities[dr].append({
            'subject_area': row['FSDM_Subject_Area'].strip(),
            'entity': row['FSDM_Entity'].strip(),
            'domain': row.get('FSDM_Domain', '').strip(),
            'confidence': row.get('Mapping_Confidence', '').strip()
        })

# Get unique FSDM domains
fsdm_domains = set()
for entities in bvf_fsdm_entities.values():
    for e in entities:
        if e['domain']:
            fsdm_domains.add(e['domain'])
        if e['subject_area']:
            fsdm_domains.add(e['subject_area'])

print(f"FSDM domains found: {sorted(fsdm_domains)}")

# Filter Information category questions
info_questions = [q for q in bacr_questions if q['category'] == 'Information']
print(f"Information category questions: {len(info_questions)}")

# ============================================================
# Information section -> FSDM domain mapping
# ============================================================
INFORMATION_TO_FSDM = {
    "Summary": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location"],
        "key_entities": ["PARTY", "AGREEMENT", "EVENT", "PRODUCT", "GEOGRAPHICAL_AREA"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Customer Demographics",
        ],
        "profitability_impact": "Overall data accessibility determines profitability data availability",
        "maturity_required": 2
    },
    "Strategy": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location"],
        "key_entities": ["All domains"],
        "bvf_data_requirements": [],
        "profitability_impact": "Data strategy maturity determines long-term profitability engine evolution",
        "maturity_required": 2
    },
    "Roadmap": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location"],
        "key_entities": ["All domains"],
        "bvf_data_requirements": [],
        "profitability_impact": "Implementation planning enables phased profitability build-out",
        "maturity_required": 2
    },
    "Architecture": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location", "Channel"],
        "key_entities": ["All 3933 entities - architecture assessment"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Master & Reference Data - product",
            "Master & Reference Data - geography / location",
        ],
        "profitability_impact": "Architecture maturity determines if FSDM can be deployed as integrated model vs siloed",
        "maturity_required": 3
    },
    "Data Centricity": {
        "primary_fsdm_domains": ["Party", "Agreement"],
        "key_entities": ["PARTY", "INDIVIDUAL", "ORGANIZATION", "AGREEMENT", "INVOLVED_PARTY"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Customer Demographics",
            "KYC Data",
        ],
        "profitability_impact": "Customer-centric data design enables customer-level profitability",
        "maturity_required": 3
    },
    "Data Coverage": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product"],
        "key_entities": ["PARTY", "AGREEMENT", "EVENT", "PRODUCT", "FINANCIAL_TRANSACTION"],
        "bvf_data_requirements": [
            "Transaction Data",
            "Account Balances & Summaries",
            "Product Pricing - Interest Rates",
            "Product Pricing - Fee Rates",
        ],
        "profitability_impact": "Gaps in data coverage = gaps in profitability measures",
        "maturity_required": 3
    },
    "Data Organisation": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location"],
        "key_entities": ["All domains - logical organization"],
        "bvf_data_requirements": [],
        "profitability_impact": "Logical data organization affects query performance for profitability calculations",
        "maturity_required": 2
    },
    "Data Quality": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event"],
        "key_entities": ["PARTY", "AGREEMENT", "EVENT", "FINANCIAL_TRANSACTION", "PRODUCT"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Transaction Data",
            "Account Balances & Summaries",
        ],
        "profitability_impact": "Data quality directly affects profitability calculation accuracy",
        "maturity_required": 3
    },
    "Data Tiers": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product"],
        "key_entities": ["All domains - tiering assessment"],
        "bvf_data_requirements": [],
        "profitability_impact": "Data tiering affects historical profitability trend availability",
        "maturity_required": 2
    },
    "Data Usage Zones": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product"],
        "key_entities": ["All domains - zone classification"],
        "bvf_data_requirements": [],
        "profitability_impact": "Analytics sandboxes enable profitability model development",
        "maturity_required": 2
    },
    "Master Data Management": {
        "primary_fsdm_domains": ["Party", "Product", "Location", "Agreement"],
        "key_entities": ["PARTY", "INDIVIDUAL", "ORGANIZATION", "PRODUCT", "GEOGRAPHICAL_AREA", "CURRENCY"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Master & Reference Data - product",
            "Master & Reference Data - geography / location",
            "Master & Reference Data - staff / colleague",
            "Master & Reference Data - Channel",
            "Master & Reference Data - Campaign",
            "Master & Reference Data - FTP rates",
            "Master & Reference Data - exchange rates",
            "Master & Reference Data - merchant / transaction",
            "Master & Reference Data - organisation hierarchy",
            "Master & Reference Data - Risk Policy Rules",
        ],
        "profitability_impact": "MDM maturity determines quality of dimension data in profitability star schema",
        "maturity_required": 3
    },
    "Metadata Management": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product", "Location"],
        "key_entities": ["All domains - metadata catalog"],
        "bvf_data_requirements": [],
        "profitability_impact": "Metadata enables profitability data lineage and audit trail",
        "maturity_required": 2
    },
    "Security and Privacy": {
        "primary_fsdm_domains": ["Party"],
        "key_entities": ["PARTY", "INDIVIDUAL", "PARTY_IDENTIFICATION", "CONTACT_POINT"],
        "bvf_data_requirements": [
            "KYC Data",
            "Customer Demographics",
        ],
        "profitability_impact": "Privacy constraints may limit customer-level profitability granularity",
        "maturity_required": 2
    },
}

# ============================================================
# Build mapping
# ============================================================
print("\nMapping Information questions to FSDM domains...")
info_fsdm_mappings = []

for q in info_questions:
    section = q['section']
    fsdm_info = INFORMATION_TO_FSDM.get(section, {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product"],
        "key_entities": ["General"],
        "bvf_data_requirements": [],
        "profitability_impact": "General data management maturity",
        "maturity_required": 2
    })

    info_fsdm_mappings.append({
        'bacr_question_id': q['id'],
        'bacr_section': section,
        'question_short': q['question'][:100],
        'question_full': q['question'],
        'maturity_descriptors': q['maturity_descriptors'],
        'fsdm_domains': fsdm_info['primary_fsdm_domains'],
        'fsdm_key_entities': fsdm_info['key_entities'],
        'bvf_data_requirements': fsdm_info['bvf_data_requirements'],
        'profitability_impact': fsdm_info['profitability_impact'],
        'maturity_level_required_for_profitability': fsdm_info['maturity_required'],
        'is_tba': q['is_tba']
    })

# ============================================================
# Outputs
# ============================================================

# bacr_information_to_fsdm.csv
print("Writing bacr_information_to_fsdm.csv...")
with open(os.path.join(OUTPUT_DIR, 'bacr_information_to_fsdm.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'BACR_Question_ID', 'BACR_Section', 'Question_Short', 'FSDM_Domains',
        'FSDM_Key_Entities', 'BVF_Data_Requirements', 'Profitability_Impact',
        'Maturity_Level_Required_For_Profitability'
    ])
    for m in info_fsdm_mappings:
        writer.writerow([
            m['bacr_question_id'], m['bacr_section'], m['question_short'],
            '; '.join(m['fsdm_domains']),
            '; '.join(m['fsdm_key_entities']),
            '; '.join(m['bvf_data_requirements']),
            m['profitability_impact'],
            m['maturity_level_required_for_profitability']
        ])

# bacr_information_to_fsdm.json
print("Writing bacr_information_to_fsdm.json...")
with open(os.path.join(OUTPUT_DIR, 'bacr_information_to_fsdm.json'), 'w') as f:
    json.dump(info_fsdm_mappings, f, indent=2)

# Summary
from collections import Counter
section_counts = Counter(m['bacr_section'] for m in info_fsdm_mappings)
print(f"\n=== BACR INFORMATION -> FSDM MAPPING COMPLETE ===")
print(f"Total Information questions mapped: {len(info_fsdm_mappings)}")
print(f"\nBy section:")
for sec, count in sorted(section_counts.items()):
    fsdm = INFORMATION_TO_FSDM.get(sec, {})
    domains = fsdm.get('primary_fsdm_domains', [])
    print(f"  {sec}: {count} questions -> {', '.join(domains[:4])}")
