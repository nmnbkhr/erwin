#!/usr/bin/env python3
"""Generate index.json for TAIW — metadata with actual counts"""
import json, os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')

def count_file(filename, key=None):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        return 0
    with open(path) as f:
        data = json.load(f)
    if isinstance(data, list):
        return len(data)
    if key:
        if isinstance(data.get(key), list):
            return len(data[key])
        if isinstance(data.get(key), dict):
            return len(data[key])
    return len(data) if isinstance(data, dict) else 0

# Count actual values from files
stats = {
    "dataElements": count_file('dataElements.json'),
    "classes": count_file('classes.json'),
    "domains": count_file('domains.json'),
    "informationPackages": count_file('informationPackages.json'),
    "codeLists": count_file('codeLists.json'),
    "capabilities": count_file('capabilities.json'),
    "dataRequirements": count_file('dataRequirements.json'),
    "mappings": count_file('mappings.json'),
    "reuseScores": count_file('reuseScores.json'),
}

# Special counting for nested structures
# dependencies.json is a dict of capability_id -> deps
deps_path = os.path.join(OUTPUT_DIR, 'dependencies.json')
if os.path.exists(deps_path):
    with open(deps_path) as f:
        deps = json.load(f)
    stats["dependencies"] = sum(d.get("elementCount", 0) for d in deps.values())
else:
    stats["dependencies"] = 0

# tacrQuestions
tacr_path = os.path.join(OUTPUT_DIR, 'tacrQuestions.json')
if os.path.exists(tacr_path):
    with open(tacr_path) as f:
        tacr = json.load(f)
    stats["tacrQuestions"] = tacr.get("totalQuestions", 0)
else:
    stats["tacrQuestions"] = 0

# starSchema
star_path = os.path.join(OUTPUT_DIR, 'starSchema.json')
if os.path.exists(star_path):
    with open(star_path) as f:
        star = json.load(f)
    tables = star.get("tables", [])
    views = star.get("views", [])
    stats["starSchemaTables"] = len(tables) + len(views)
else:
    stats["starSchemaTables"] = 0

# gapExtensions
gap_path = os.path.join(OUTPUT_DIR, 'gapExtensions.json')
if os.path.exists(gap_path):
    with open(gap_path) as f:
        gap = json.load(f)
    stats["gapTables"] = sum(m.get("tableCount", len(m.get("tables", []))) for m in gap.get("modules", []))
else:
    stats["gapTables"] = 0

index = {
    "app": "TAIW",
    "fullName": "Trade Analytics Intelligence Workbench",
    "version": "1.0.0",
    "dataModel": "WCO Data Model v4.2",
    "framework": "Trade Capability Framework (TCF) v1.0",
    "assessment": "Trade Analytics Capability Review (TACR) v1.0",
    "country": "Pakistan",
    "stats": stats,
    "generated": datetime.now().isoformat(),
    "generator": "scripts/taiw/gen_*.py"
}

with open(os.path.join(OUTPUT_DIR, 'index.json'), 'w') as f:
    json.dump(index, f, indent=2)

print("index.json generated:")
for k, v in stats.items():
    print(f"  {k}: {v}")
