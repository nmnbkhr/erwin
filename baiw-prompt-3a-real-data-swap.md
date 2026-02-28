# BAIW — Real Data Swap: prepare_data.py

## Context

BAIW app is built and running with sample/generated JSON data in `src/data/`. The actual data lives in the `nmnbkhr/erwin` repo with CSV, JSON, SQL, and XLSM files. Build a Python script that reads the real repo outputs and produces the exact same JSON schema the app expects, so the app switches from sample to real data with zero code changes.

---

## Task

Create `scripts/prepare_data.py` that:
1. Reads all source files from the repo
2. Converts each to the JSON schema that `src/data/*.json` currently uses
3. Writes output to `src/data/` (overwriting sample data)
4. Validates output matches expected counts
5. Generates a conversion report

---

## Source Files → Output Files Mapping

### 1. Entities (`fsdm_output/fsdm_entity_catalog.csv` → `src/data/entities.json`)

**Source CSV columns:** Entity name, Domain, Description (and possibly more — inspect headers dynamically)

**Output schema:**
```json
[
  {
    "id": "Party",
    "name": "Party",
    "domain": "Party Management",
    "description": "A person or organization that has...",
    "attributeCount": 15
  }
]
```

- `id`: entity name, sanitized (replace spaces with underscores)
- `attributeCount`: count from data dictionary CSV (see #3)
- Expected: ~3,917 entries
- Sort by domain, then alphabetically by name

### 2. Relationships (`fsdm_output/fsdm_relationships.csv` → `src/data/relationships.json`)

**Source CSV columns:** Parent entity, Child entity, Relationship type

**Output schema:**
```json
[
  {
    "parent": "Party",
    "child": "Individual",
    "type": "inheritance",
    "parentDomain": "Party Management",
    "childDomain": "Party Management"
  }
]
```

- Add `parentDomain` and `childDomain` by looking up entity→domain from entities data
- Expected: ~5,636 entries

### 3. Attributes (`fsdm_output/fsdm_data_dictionary.csv` → `src/data/attributes.json`)

**Source CSV columns:** Entity name, Attribute name, Data type, Nullable, Description

**Output schema:** Dictionary keyed by entity name for lazy loading:
```json
{
  "Party": [
    {"name": "Party_Id", "datatype": "INTEGER", "nullable": false, "description": "..."},
    {"name": "Party_Name", "datatype": "VARCHAR(200)", "nullable": true, "description": "..."}
  ],
  "Individual": [...]
}
```

- This file will be LARGE (~3-5MB). That's OK — it's lazy-loaded per entity.
- Expected: ~15,364 total attributes across all entities
- Also compute attributeCount per entity and merge into entities.json

### 4. Domains (`fsdm_output/fsdm_domain_map.json` → `src/data/domains.json`)

**Source:** JSON file mapping entity names to domain names.

**Output schema:**
```json
[
  {
    "name": "Party Management",
    "count": 622,
    "description": "Customer, organization, individual, roles, relationships, KYC",
    "entities": ["Party", "Individual", "Organization", "..."]
  }
]
```

- Aggregate entity counts per domain from the domain map
- Sort domains by count descending
- Generate descriptions from common entity name patterns in each domain
- Expected: 16 domains

### 5. Inheritance (`fsdm_output/fsdm_inheritance_tree.json` → `src/data/inheritance.json`)

**Source:** JSON with inheritance chain data.

**Output schema:**
```json
{
  "Individual": {
    "ancestors": ["Party"],
    "descendants": ["Individual_Name", "Individual_Citizenship"],
    "depth": 1
  },
  "Savings_Account": {
    "ancestors": ["Account", "Agreement"],
    "descendants": [],
    "depth": 2
  }
}
```

- Flatten inheritance trees into per-entity ancestor/descendant lists
- Expected: entities involved in ~839 inheritance chains

### 6. Capabilities (`bvf_fsdm_output/bvf_capability_summary.csv` → `src/data/capabilities.json`)

**Source CSV columns:** Theme, Capability_Group, Sub_Capability, Data_Req_Count

**Output schema:**
```json
[
  {
    "id": "profitability_modelling",
    "theme": "Finance & Performance Management",
    "group": "Enterprise Performance Management",
    "sub": "Profitability Modelling",
    "dataReqCount": 8,
    "themeColor": "amber"
  }
]
```

- `id`: slugified sub-capability name (lowercase, underscores)
- `themeColor`: "blue" for Marketing, "amber" for Finance, "green" for Product
- Expected: ~112 entries

### 7. Data Requirements (`bvf_fsdm_output/bvf_data_requirements.csv` → `src/data/dataRequirements.json`)

**Source CSV columns:** Data_Requirement, FSDM_Subject_Area, Capabilities_Using, Count

**Output schema:**
```json
[
  {
    "id": "customer_demographics",
    "name": "Customer Demographics",
    "fsdmSubjectArea": "Party Management",
    "capabilitiesUsing": 15,
    "capabilities": ["single_customer_view", "customer_segmentation", "..."]
  }
]
```

- Expected: ~113 entries

### 8. BVF→FSDM Mappings (`bvf_fsdm_output/bvf_to_fsdm_entity_mapping.csv` → `src/data/mappings.json`)

**Source CSV columns:** Data_Requirement, FSDM_Entity, Domain, Confidence, Notes

**Output schema:**
```json
[
  {
    "requirement": "Customer Demographics",
    "entity": "Individual",
    "domain": "Party Management",
    "confidence": "HIGH",
    "notes": "Core customer identity data"
  }
]
```

- Expected: ~360 entries

### 9. Dependencies (`bvf_fsdm_output/capability_fsdm_dependencies.csv` → `src/data/dependencies.json`)

**Source CSV columns:** Theme, Capability, Sub_Capability, Data_Requirement, FSDM_Subject_Area, FSDM_Entities

**Output schema:** Grouped by capability:
```json
{
  "profitability_modelling": {
    "entities": ["Party", "Agreement", "Account", "GL_Entry", "Product"],
    "domains": ["Party Management", "Agreement & Account", "General Ledger"],
    "dataRequirements": ["Customer Demographics", "Account Balances", "GL Data"],
    "entityCount": 15,
    "domainCount": 4
  }
}
```

- Group by Sub_Capability (slugified to match capabilities.json IDs)
- Deduplicate entities and domains per capability
- Expected: ~5,218 raw rows → ~112 grouped entries

### 10. Reuse Scores (`bvf_fsdm_output/fsdm_entity_reuse_scores.csv` → `src/data/reuseScores.json`)

**Source CSV columns:** FSDM_Entity, Subject_Area, Capabilities_Supported, Reuse_Score, Priority_Tier

**Output schema:**
```json
[
  {"entity": "Party", "domain": "Party Management", "score": 98, "tier": "P1", "capabilitiesSupported": 98},
  {"entity": "Individual", "domain": "Party Management", "score": 92, "tier": "P1", "capabilitiesSupported": 92}
]
```

- Sort by score descending
- Expected: ~219 entries (53 P1, rest P2/P3/P4)

### 11. Data Lineage (`bvf_fsdm_output/data_lineage.json` → `src/data/lineage.json`)

**Source:** JSON file — pass through with schema validation.

**Output schema:**
```json
[
  {
    "targetColumn": "net_interest_income",
    "targetTable": "FACT_CUSTOMER_PROFITABILITY",
    "calculation": "gross_interest_income - interest_expense",
    "sourceFsdmEntities": ["Interest_Accrual", "Interest_Expense"],
    "bvfDataRequirements": ["Interest Income Data", "Interest Expense Data"],
    "bvfCapabilities": ["profitability_modelling", "treasury_insight"]
  }
]
```

- Expected: ~23 entries

### 12. Star Schema (`bvf_fsdm_output/profitability_star_schema_enhanced.sql` → `src/data/starSchema.json`)

**Parse SQL DDL into JSON:**

```json
{
  "tables": [
    {
      "name": "FACT_CUSTOMER_PROFITABILITY",
      "type": "fact",
      "columns": [
        {"name": "customer_key", "datatype": "INTEGER", "isPK": false, "isFK": true, "fkTarget": "DIM_CUSTOMER"},
        {"name": "gross_interest_income", "datatype": "DECIMAL(18,2)", "isPK": false, "isFK": false},
        ...
      ],
      "description": "Central fact table for multi-dimensional profitability"
    },
    {
      "name": "DIM_CUSTOMER",
      "type": "dimension",
      "columns": [...],
      "description": "Customer dimension with SCD Type 2"
    }
  ],
  "views": [
    {"name": "VW_CUSTOMER_PL", "description": "Customer-level P&L statement", "sourceTables": ["FACT_CUSTOMER_PROFITABILITY", "DIM_CUSTOMER"]}
  ]
}
```

**SQL Parsing approach:**
- Read the `.sql` file line by line
- Detect `CREATE TABLE` or `CREATE VIEW` statements
- Extract table name, column definitions (name, datatype)
- Detect `PRIMARY KEY`, `FOREIGN KEY` constraints
- Classify as "fact", "dimension", "aggregate", or "view" based on naming convention (FACT_, DIM_, AGG_, VW_)

### 13. Gap Extensions (`bvf_fsdm_output/fsdm_gap_extensions.sql` → `src/data/gapExtensions.json`)

**Same SQL parsing approach as #12.**

```json
{
  "modules": [
    {
      "name": "Activity Based Costing",
      "id": "abc",
      "tables": [
        {"name": "COST_POOL", "columns": [...], "description": "..."},
        {"name": "ACTIVITY", "columns": [...], "description": "..."}
      ],
      "tableCount": 6,
      "connectsToStarSchema": ["FACT.abc_allocated_cost", "FACT.direct_cost"]
    }
  ]
}
```

**Module detection:** Parse SQL comments or group tables by naming prefix:
- COST_*, ACTIVITY* → ABC Costing
- CLV_*, CUSTOMER_LIFETIME* → Customer Lifetime Value
- BUDGET*, FORECAST*, KPI_TARGET → Budgets & Forecasts
- BUSINESS_PROCESS*, PROCESS_* → Business Process Management
- OPERATIONAL_METRIC*, CHANNEL_OPERATIONAL*, BRANCH_OPERATIONAL* → Operational Metrics

### 14. BACR Questions (`BACR_-_INTERVIEW_MASTER_-_DA004462.xlsm` → `src/data/bacrQuestions.json`)

**Source:** Excel workbook, "All Questions" sheet.

**Parsing logic:**
- Read "All Questions" sheet
- Skip header rows (rows 1-4 based on inspection: headers in row 2, subheaders in row 4)
- Find actual data rows where column A (Category) is non-empty and is one of: Business, Culture, Governance, Information, Applications, Systems, Agility, Outcomes
- Columns: A=Category, B=Section, C=Question text, E=Current State, F=Desired State, H=State Descriptors (for level 1)
- Read state descriptors from column H onwards (columns H through L or similar for levels 1-5)

**Output schema:**
```json
{
  "categories": [
    {
      "name": "Business",
      "sections": [
        {
          "name": "Strategy",
          "questions": [
            {
              "id": "bus_str_001",
              "text": "How do senior executives communicate the vision and goals?",
              "levels": {
                "1": "There is little or no communication of the analytics vision",
                "2": "Vision exists but communication is sporadic",
                "3": "Vision is documented and communicated regularly",
                "4": "Vision drives resource allocation and priorities",
                "5": "Vision is embedded in organizational culture"
              }
            }
          ]
        }
      ],
      "questionCount": 120
    }
  ],
  "totalQuestions": 793
}
```

- Generate `id` from category + section + sequential number
- Parse maturity level descriptions from columns H-L (if available)
- If level descriptions are not in the spreadsheet for a question, leave `levels` as `null`

### 15. Enrichment (`src/data/enrichment.json` — KEEP existing)

Do NOT overwrite enrichment.json — it was manually curated from 16 BVF prompts. Just validate it exists and matches expected structure.

### 16. Pakistan Context (`bvf_fsdm_output/pakistan_banking_context.md` → `src/data/pakistanContext.json`)

**Parse Markdown into structured JSON:**

```json
{
  "regulatory": {
    "sbpPolicyRate": "17.5%",
    "kibor": {"1M": "17.2%", "3M": "17.5%", "6M": "17.8%", "12M": "18.0%"},
    "baselIII": {"car": "11.5%", "lcr": "100%", "nsfr": "100%"},
    "taxRates": {"corporate": "39% + 10% super tax", "whtFilers": "15%", "whtNonFilers": "30%", "zakat": "2.5%"}
  },
  "industry": {
    "totalAssets": "PKR 35T+",
    "banks": 33,
    "islamicBanks": 5,
    "branches": "16,000+",
    "atms": "16,000+"
  },
  "islamicModes": [...],
  "paymentSystems": [...]
}
```

- Parse key-value pairs from markdown tables
- Extract structured sections
- If markdown parsing is complex, hardcode the known values (they change infrequently)

---

## Script Structure

```python
#!/usr/bin/env python3
"""
prepare_data.py — Convert nmnbkhr/erwin repo outputs to BAIW app JSON

Usage:
  python scripts/prepare_data.py --repo /path/to/erwin --output src/data/

Requires: pip install openpyxl pandas
"""

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

def parse_args():
    parser = argparse.ArgumentParser(description='Convert erwin repo data to BAIW JSON')
    parser.add_argument('--repo', required=True, help='Path to nmnbkhr/erwin repo root')
    parser.add_argument('--output', default='src/data/', help='Output directory for JSON files')
    parser.add_argument('--validate', action='store_true', help='Validate counts after conversion')
    parser.add_argument('--dry-run', action='store_true', help='Parse and validate without writing')
    return parser.parse_args()

def read_csv(filepath):
    """Read CSV, auto-detect delimiter, handle encoding issues."""
    ...

def parse_sql_ddl(filepath):
    """Parse CREATE TABLE/VIEW statements from SQL file into structured dicts."""
    ...

def parse_bacr_excel(filepath):
    """Parse BACR Excel workbook 'All Questions' sheet."""
    ...

def slugify(text):
    """Convert 'Profitability Modelling' → 'profitability_modelling'"""
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def main():
    args = parse_args()
    repo = Path(args.repo)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    
    report = {"files_converted": 0, "warnings": [], "counts": {}}
    
    # 1. Entities
    # 2. Relationships
    # 3. Attributes
    # 4. Domains
    # 5. Inheritance
    # 6. Capabilities
    # 7. Data Requirements
    # 8. Mappings
    # 9. Dependencies
    # 10. Reuse Scores
    # 11. Lineage
    # 12. Star Schema
    # 13. Gap Extensions
    # 14. BACR Questions
    # 15. Enrichment (validate only)
    # 16. Pakistan Context
    
    # Validate counts
    if args.validate:
        expected = {
            "entities": 3917, "relationships": 5636, "domains": 16,
            "capabilities": 112, "dataRequirements": 113, "mappings": 360,
            "reuseScores": 219, "lineage": 23
        }
        for key, expected_count in expected.items():
            actual = report["counts"].get(key, 0)
            status = "✅" if actual == expected_count else f"⚠️ (expected {expected_count})"
            print(f"  {key}: {actual} {status}")
    
    # Write report
    report_path = output / "conversion_report.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✅ Conversion complete: {report['files_converted']} files written to {output}")

if __name__ == '__main__':
    main()
```

## Error Handling

- If a source file doesn't exist, log warning and skip (don't crash)
- If CSV has unexpected columns, log warning with actual headers found
- If entity counts don't match expected, log warning but continue
- If SQL parsing fails on a line, skip that line and continue
- Always write a `conversion_report.json` with all warnings

## Dependencies

```
pip install openpyxl pandas
```

Only `openpyxl` is truly required (for BACR Excel). `pandas` is optional convenience — use stdlib `csv` module if preferred for simpler dependency.

## Validation

After running, the script should print:

```
BAIW Data Conversion Report
============================
entities.json:        3,917 entities ✅
relationships.json:   5,636 relationships ✅
attributes.json:      15,364 attributes across 3,917 entities ✅
domains.json:         16 domains ✅
inheritance.json:     839 chains ✅
capabilities.json:    112 sub-capabilities ✅
dataRequirements.json: 113 requirements ✅
mappings.json:        360 BVF→FSDM mappings ✅
dependencies.json:    5,218 dependencies (112 capabilities) ✅
reuseScores.json:     219 entities ✅
lineage.json:         23 entries ✅
starSchema.json:      11 tables (1 fact + 7 dim + 2 agg) + 3 views ✅
gapExtensions.json:   21 tables across 5 modules ✅
bacrQuestions.json:    793 questions across 9 categories ✅
enrichment.json:      EXISTS (not overwritten) ✅
pakistanContext.json:  Converted ✅

Total: 16 files, 0 warnings
```
