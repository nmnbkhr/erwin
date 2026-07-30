#!/usr/bin/env python3
"""Phase 3: Capability Data Dependency Graph"""

import json
import csv
import os

OUTPUT_DIR = "/mnt/e/erwin/bvf_output"

# Profitability-critical capabilities
PROFITABILITY_CRITICAL = {
    # Finance & Performance Management
    "Accounting Hub", "Functional P&L", "Activity Based Costing",
    "Profitability Modelling", "Profitability Analytics and Optimisation",
    "Performance Management and KPIs", "Pricing Analysis & Optimisation",
    "Funds Transfer Pricing", "Asset & Liability Management",
    "Capital Planning and Management",
    # Risk (profit-impacting)
    "Capital Management (Planning and Allocation)", "Capital Consumption",
    "Risk Weighted Assets and Regulatory Capital", "Credit Risk Based Pricing Model",
    # Marketing (revenue-driving)
    "Customer Value", "Customer Segmentation", "Future / Lifetime Value"
}


def fuzzy_match_profitability(cap_name):
    """Check if capability is profitability-critical using fuzzy matching."""
    name_lower = cap_name.lower()
    for pc in PROFITABILITY_CRITICAL:
        if pc.lower() in name_lower or name_lower in pc.lower():
            return True
    # Additional keyword matching
    profit_keywords = ["profitability", "p&l", "profit & loss", "accounting hub",
                       "activity based costing", "funds transfer pricing", "ftp",
                       "capital planning", "capital management", "capital consumption",
                       "risk weighted asset", "rwa", "pricing analysis",
                       "asset & liability", "alm", "customer value", "lifetime value",
                       "customer segmentation", "performance management"]
    for kw in profit_keywords:
        if kw in name_lower:
            return True
    return False


def main():
    print("=" * 70)
    print("Phase 3: Capability Data Dependency Graph")
    print("=" * 70)

    # Load Phase 1 outputs
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_capabilities.json")) as f:
        capabilities = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_reuse_matrix.json")) as f:
        reuse_matrix = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_to_fsdm_entity_map.json")) as f:
        entity_map = json.load(f)

    print(f"  Loaded {len(capabilities)} capabilities")
    print(f"  Loaded entity mappings for {len(entity_map)} data requirements")

    # Build capability → entity dependency set
    all_deps = []
    cap_summaries = []

    profitability_count = 0
    for cap in capabilities:
        cap_name = cap["name"]
        is_profit_critical = fuzzy_match_profitability(cap_name)
        if is_profit_critical:
            profitability_count += 1

        all_data_reqs = cap["data_requirements"] + cap["output_data"]
        entity_set = set()
        total_attrs = 0

        for dr_name in all_data_reqs:
            if dr_name in entity_map:
                for ent in entity_map[dr_name]["entities"]:
                    entity_name = ent["entity"]
                    if entity_name not in entity_set:
                        entity_set.add(entity_name)
                        total_attrs += ent.get("column_count", 0)

                    all_deps.append({
                        "BVF_Area": cap["bvf_area"],
                        "Sub_Area": cap["sub_area"],
                        "Capability": cap_name,
                        "FSDM_Entity": entity_name,
                        "Is_Profitability_Critical": "Y" if is_profit_critical else "N",
                        "Data_Requirement_Source": dr_name
                    })

        # Calculate average reuse score
        reuse_scores = []
        if cap_name in reuse_matrix:
            reuse_scores = list(reuse_matrix[cap_name].values())
        avg_reuse = sum(reuse_scores) / len(reuse_scores) if reuse_scores else 0.0

        cap_summaries.append({
            "Capability": cap_name,
            "BVF_Area": cap["bvf_area"],
            "Sub_Area": cap["sub_area"],
            "Total_Data_Requirements": len(all_data_reqs),
            "Total_FSDM_Entities": len(entity_set),
            "Total_Attributes": total_attrs,
            "Profitability_Critical": "Y" if is_profit_critical else "N",
            "Data_Reuse_Score_Avg": round(avg_reuse, 4)
        })

    print(f"\n  Profitability-critical capabilities: {profitability_count}")
    print(f"  Total dependency rows: {len(all_deps)}")

    # Save capability_entity_dependencies.csv
    dep_path = os.path.join(OUTPUT_DIR, "capability_entity_dependencies.csv")
    with open(dep_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["BVF_Area", "Sub_Area", "Capability",
                                                "FSDM_Entity", "Is_Profitability_Critical",
                                                "Data_Requirement_Source"])
        writer.writeheader()
        writer.writerows(all_deps)
    print(f"\n  [6] Saved: {dep_path} ({len(all_deps)} rows)")

    # Save capability_entity_summary.csv
    sum_path = os.path.join(OUTPUT_DIR, "capability_entity_summary.csv")
    with open(sum_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Capability", "BVF_Area", "Sub_Area",
                                                "Total_Data_Requirements", "Total_FSDM_Entities",
                                                "Total_Attributes", "Profitability_Critical",
                                                "Data_Reuse_Score_Avg"])
        writer.writeheader()
        writer.writerows(cap_summaries)
    print(f"  [7] Saved: {sum_path} ({len(cap_summaries)} rows)")

    print("\nPhase 3 complete!")


if __name__ == "__main__":
    main()
