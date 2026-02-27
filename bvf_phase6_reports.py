#!/usr/bin/env python3
"""Phase 6: Summary Reports"""

import json
import csv
import os
from datetime import datetime

OUTPUT_DIR = "/mnt/e/erwin/bvf_output"


def load_all():
    data = {}
    for name, fname in [
        ("capabilities", "bvf_parsed_capabilities.json"),
        ("data_requirements", "bvf_parsed_data_requirements.json"),
        ("reuse_matrix", "bvf_reuse_matrix.json"),
        ("entity_map", "bvf_to_fsdm_entity_map.json"),
        ("coverage", "profitability_data_coverage.json"),
    ]:
        with open(os.path.join(OUTPUT_DIR, fname)) as f:
            data[name] = json.load(f)

    for name, fname in [
        ("priority", "bvf_implementation_priority.csv"),
        ("cap_summary", "capability_entity_summary.csv"),
        ("lineage", "profitability_bvf_lineage.csv"),
        ("entity_map_csv", "bvf_to_fsdm_entity_map.csv"),
    ]:
        with open(os.path.join(OUTPUT_DIR, fname)) as f:
            data[name] = list(csv.DictReader(f))

    return data


def build_statistics(data):
    """6.2: bvf_statistics.json"""
    caps = data["capabilities"]
    drs = data["data_requirements"]
    reuse = data["reuse_matrix"]
    entity_map = data["entity_map"]
    priority = data["priority"]
    coverage = data["coverage"]

    total_mappings = sum(c["data_req_count"] for c in caps)

    # Reuse analysis
    all_coeffs = []
    max_pair = ("", "", 0)
    for c1, partners in reuse.items():
        for c2, coeff in partners.items():
            all_coeffs.append(coeff)
            if coeff > max_pair[2] and c1 != c2:
                max_pair = (c1, c2, coeff)

    avg_reuse = sum(all_coeffs) / len(all_coeffs) if all_coeffs else 0

    # Most reused data req
    most_reused_dr = max(drs, key=lambda d: d["capability_count"])

    # FSDM coverage
    drs_with_match = sum(1 for d in drs if entity_map.get(d["name"], {}).get("entity_count", 0) > 0)
    total_entities_mapped = len(set(row["FSDM_Entity"] for row in data["entity_map_csv"]))

    # Entities by domain
    domain_counts = {}
    for row in data["entity_map_csv"]:
        # Get domain from entity info
        pass
    # Use entity_map JSON
    sa_counts = {}
    for dr_name, info in entity_map.items():
        sa = info.get("fsdm_subject_area", "Unknown")
        for ent in info.get("entities", []):
            domain = ent.get("domain", "Unknown")
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
        sa_counts[sa] = sa_counts.get(sa, 0) + len(info.get("entities", []))

    # Profitability
    profit_keywords = ["profitability", "p&l", "accounting hub", "costing", "transfer pricing",
                       "capital", "pricing analysis", "asset & liability", "customer value",
                       "lifetime value", "segmentation", "performance management"]
    profit_caps = [c for c in caps if any(kw in c["name"].lower() for kw in profit_keywords)]
    profit_drs = set()
    for c in profit_caps:
        profit_drs.update(c["data_requirements"] + c["output_data"])

    # Tier 1 stats
    tier1 = [r for r in priority if "Tier 1" in r.get("Implementation_Tier", "")]
    tier1_entities = sum(int(r.get("FSDM_Entity_Count", 0)) for r in tier1)

    # Top 20 capability coverage
    top20_drs = {r["BVF_Data_Requirement"] for r in tier1}
    top20_caps = set()
    for c in caps:
        for dr in c["data_requirements"] + c["output_data"]:
            if dr in top20_drs:
                top20_caps.add(c["name"])
                break

    # Capability clusters (rough: group by >0.5 average reuse)
    clusters = 0
    visited = set()
    for c1 in reuse:
        if c1 in visited:
            continue
        cluster = {c1}
        stack = [c1]
        while stack:
            curr = stack.pop()
            visited.add(curr)
            for c2, coeff in reuse.get(curr, {}).items():
                if coeff > 0.5 and c2 not in visited:
                    cluster.add(c2)
                    stack.append(c2)
        if len(cluster) > 1:
            clusters += 1

    stats = {
        "bvf_summary": {
            "total_capabilities": len(caps),
            "total_data_requirements": len(drs),
            "bvf_areas": 3,
            "sub_areas": len(set(c["sub_area"] for c in caps if c["sub_area"])),
            "total_mappings": total_mappings,
            "avg_data_reqs_per_capability": round(total_mappings / len(caps), 2),
            "avg_capabilities_per_data_req": round(total_mappings / len(drs), 2)
        },
        "fsdm_coverage": {
            "data_reqs_with_fsdm_match": drs_with_match,
            "data_reqs_without_match": len(drs) - drs_with_match,
            "total_fsdm_entities_mapped": total_entities_mapped,
            "entities_by_domain": dict(sorted(domain_counts.items(), key=lambda x: -x[1])[:15]),
            "coverage_by_subject_area": dict(sorted(sa_counts.items(), key=lambda x: -x[1]))
        },
        "profitability": {
            "profitability_critical_capabilities": len(profit_caps),
            "profitability_data_requirements": len(profit_drs),
            "star_schema_coverage_pct": coverage["coverage_summary"]["coverage_pct"],
            "tier1_entity_count": tier1_entities,
            "tier1_capability_unlock_count": len(top20_caps),
            "top20_data_reqs_capability_coverage_pct": round(len(top20_caps) / len(caps) * 100, 1)
        },
        "reuse_analysis": {
            "avg_reuse_coefficient": round(avg_reuse, 4),
            "max_reuse_pair": list(max_pair),
            "capability_clusters": clusters,
            "most_reused_data_req": most_reused_dr["name"],
            "most_reused_data_req_capability_count": most_reused_dr["capability_count"]
        }
    }

    path = os.path.join(OUTPUT_DIR, "bvf_statistics.json")
    with open(path, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"  [17] Saved: {path}")
    return stats


def build_report(data, stats):
    """6.1: bvf_fsdm_mapping_report.md"""
    caps = data["capabilities"]
    drs = data["data_requirements"]
    entity_map = data["entity_map"]
    priority = data["priority"]
    coverage = data["coverage"]

    # BVF area breakdown
    areas = {}
    for c in caps:
        area = c["bvf_area"] or "Unknown"
        sub = c["sub_area"] or "Unknown"
        if area not in areas:
            areas[area] = {}
        if sub not in areas[area]:
            areas[area][sub] = []
        areas[area][sub].append(c["name"])

    report = f"""# BVF → FSDM Mapping Report
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

## 1. Executive Summary

This report documents the mapping between **Teradata's Banking Business Value Framework (BVF)** and the **Financial Services Data Model (FSDM)** v16.00, with a focus on profitability engine readiness.

| Metric | Value |
|---|---|
| BVF Capabilities | {stats['bvf_summary']['total_capabilities']} |
| BVF Data Requirements | {stats['bvf_summary']['total_data_requirements']} |
| Capability→Data Mappings | {stats['bvf_summary']['total_mappings']} |
| FSDM Entities Mapped | {stats['fsdm_coverage']['total_fsdm_entities_mapped']} |
| Data Reqs with FSDM Match | {stats['fsdm_coverage']['data_reqs_with_fsdm_match']}/{stats['bvf_summary']['total_data_requirements']} |
| Profitability-Critical Capabilities | {stats['profitability']['profitability_critical_capabilities']} |
| Star Schema Coverage | {stats['profitability']['star_schema_coverage_pct']}% |

**Key Finding:** Implementing the top 20 data requirements (Tier 1) enables **{stats['profitability']['top20_data_reqs_capability_coverage_pct']}%** of all capabilities ({stats['profitability']['tier1_capability_unlock_count']}/{stats['bvf_summary']['total_capabilities']}).

---

## 2. BVF Structure Overview

The Banking BVF organizes **{stats['bvf_summary']['total_capabilities']} capabilities** across **3 areas** and **{stats['bvf_summary']['sub_areas']} sub-areas**, consuming/producing **{stats['bvf_summary']['total_data_requirements']} data requirements**.

"""
    for area, subs in areas.items():
        total = sum(len(v) for v in subs.values())
        report += f"### {area} ({total} capabilities)\n\n"
        for sub, cap_list in subs.items():
            report += f"- **{sub}** ({len(cap_list)} capabilities): {', '.join(cap_list[:5])}"
            if len(cap_list) > 5:
                report += f" +{len(cap_list)-5} more"
            report += "\n"
        report += "\n"

    report += f"""---

## 3. FSDM Coverage Analysis

### 3.1 Coverage Summary

| Metric | Count |
|---|---|
| Data Reqs with FSDM Entity Match | {stats['fsdm_coverage']['data_reqs_with_fsdm_match']} |
| Data Reqs without Match | {stats['fsdm_coverage']['data_reqs_without_match']} |
| Total Unique FSDM Entities Mapped | {stats['fsdm_coverage']['total_fsdm_entities_mapped']} |

### 3.2 Coverage by FSDM Domain

| Domain | Entities Mapped |
|---|---|
"""
    for domain, count in sorted(stats["fsdm_coverage"]["entities_by_domain"].items(), key=lambda x: -x[1]):
        report += f"| {domain} | {count} |\n"

    report += f"""
### 3.3 Coverage by BVF Subject Area

| Subject Area | Entity Mappings |
|---|---|
"""
    for sa, count in sorted(stats["fsdm_coverage"]["coverage_by_subject_area"].items(), key=lambda x: -x[1]):
        report += f"| {sa} | {count} |\n"

    report += f"""
---

## 4. Profitability Engine Readiness

### 4.1 Star Schema Coverage

| Metric | Value |
|---|---|
| Total Star Schema Measures | {coverage['coverage_summary']['total_measures']} |
| Fully Covered | {coverage['coverage_summary']['fully_covered']} |
| Partially Covered | {coverage['coverage_summary']['partially_covered']} |
| Gaps | {coverage['coverage_summary']['gaps']} |
| Coverage Rate | {coverage['coverage_summary']['coverage_pct']}% |

### 4.2 Critical Path

The profitability engine requires these data flows:

| Star Schema Column | Key Source Data Requirements |
|---|---|
"""
    for table_name, table_info in coverage["star_schema_tables"].items():
        if table_info["type"] == "FACT":
            for col_name, col_info in table_info["columns"].items():
                drs_list = ", ".join(col_info.get("bvf_data_requirements", [])[:3])
                report += f"| {table_name}.{col_name} | {drs_list} |\n"

    report += f"""
---

## 5. Data Reuse Analysis

| Metric | Value |
|---|---|
| Average Reuse Coefficient | {stats['reuse_analysis']['avg_reuse_coefficient']} |
| Highest Reuse Pair | {stats['reuse_analysis']['max_reuse_pair'][0]} ↔ {stats['reuse_analysis']['max_reuse_pair'][1]} ({stats['reuse_analysis']['max_reuse_pair'][2]}) |
| Capability Clusters (>0.5) | {stats['reuse_analysis']['capability_clusters']} |
| Most-Reused Data Requirement | {stats['reuse_analysis']['most_reused_data_req']} ({stats['reuse_analysis']['most_reused_data_req_capability_count']} capabilities) |

### ROI Argument

Implementing the **top 20 data requirements** (Tier 1) will:
- Enable **{stats['profitability']['tier1_capability_unlock_count']}** of {stats['bvf_summary']['total_capabilities']} capabilities ({stats['profitability']['top20_data_reqs_capability_coverage_pct']}%)
- Cover **{stats['profitability']['tier1_entity_count']}** FSDM entities
- Achieve **{stats['profitability']['star_schema_coverage_pct']}%** star schema coverage

---

## 6. Implementation Roadmap

### Tier Summary

| Tier | Data Reqs | Description |
|---|---|---|
| Tier 1 (Must Have) | 20 | Essential for profitability engine |
| Tier 2 (Should Have) | 30 | Enhance profitability + enable risk/marketing |
| Tier 3 (Nice to Have) | 30 | Full BVF coverage |
| Tier 4 (Future) | {len(priority) - 80} | Specialized capabilities |

### Tier 1 — Top 20 Priority Data Requirements

| Rank | Data Requirement | Score | Profit Caps | Subject Area |
|---|---|---|---|---|
"""
    for row in priority[:20]:
        report += f"| {row['Rank']} | {row['BVF_Data_Requirement']} | {row['Priority_Score']} | {row['Profitability_Cap_Count']} | {row['FSDM_Subject_Area']} |\n"

    report += f"""
---

## 7. Appendices

### A. Output Files

| # | File | Description |
|---|---|---|
| 1 | bvf_parsed_capabilities.json | {stats['bvf_summary']['total_capabilities']} capabilities with data req mappings |
| 2 | bvf_parsed_data_requirements.json | {stats['bvf_summary']['total_data_requirements']} data reqs with capability mappings |
| 3 | bvf_reuse_matrix.json | Capability-to-capability reuse coefficients |
| 4 | bvf_to_fsdm_entity_map.csv | BVF data req → FSDM entity mapping |
| 5 | bvf_to_fsdm_entity_map.json | Same mapping in structured JSON |
| 6 | capability_entity_dependencies.csv | Each capability's FSDM entity footprint |
| 7 | capability_entity_summary.csv | Capability summary with entity counts |
| 8 | profitability_bvf_lineage.csv | Star schema ← FSDM ← BVF lineage |
| 9 | bvf_implementation_priority.csv | Ranked data reqs with implementation tiers |
| 10 | profitability_data_coverage.json | Star schema coverage analysis |
| 11 | bvf_capability_heatmap.html | Interactive capability × data heatmap |
| 12 | bvf_fsdm_sankey.html | BVF → FSDM Sankey flow diagram |
| 13 | profitability_lineage.html | Profitability measure lineage visual |
| 14 | bvf_reuse_network.html | Capability reuse network graph |
| 15 | implementation_roadmap.html | Tiered implementation roadmap |
| 16 | bvf_fsdm_mapping_report.md | This report |
| 17 | bvf_statistics.json | Summary statistics |
"""

    path = os.path.join(OUTPUT_DIR, "bvf_fsdm_mapping_report.md")
    with open(path, "w") as f:
        f.write(report)
    print(f"  [16] Saved: {path}")


def main():
    print("=" * 70)
    print("Phase 6: Summary Reports")
    print("=" * 70)

    data = load_all()

    print("\n--- Building statistics ---")
    stats = build_statistics(data)

    print("--- Building mapping report ---")
    build_report(data, stats)

    print("\n  Key Statistics:")
    print(f"    Capabilities: {stats['bvf_summary']['total_capabilities']}")
    print(f"    Data Requirements: {stats['bvf_summary']['total_data_requirements']}")
    print(f"    Total Mappings: {stats['bvf_summary']['total_mappings']}")
    print(f"    FSDM Entities Mapped: {stats['fsdm_coverage']['total_fsdm_entities_mapped']}")
    print(f"    Star Schema Coverage: {stats['profitability']['star_schema_coverage_pct']}%")
    print(f"    Top 20 DR → {stats['profitability']['top20_data_reqs_capability_coverage_pct']}% capability coverage")

    print("\nPhase 6 complete!")


if __name__ == "__main__":
    main()
