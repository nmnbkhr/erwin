#!/usr/bin/env python3
"""Phase 4: Profitability Engine Enhancement"""

import json
import csv
import os

OUTPUT_DIR = "/mnt/e/erwin/bvf_output"

# Star schema table → column → source mapping (from prompt section 4.2)
STAR_SCHEMA_LINEAGE = {
    "FACT_CUSTOMER_PROFITABILITY": {
        "type": "FACT",
        "columns": {
            "Interest_Income_Amt": {
                "fsdm_entities": ["MONETARY_TRANSACTION", "AGREEMENT_SUMMARY"],
                "bvf_data_requirements": ["Financial Transactions", "Account Balances"],
                "bvf_capabilities": ["Accounting Hub", "Functional P&L", "Profitability Modelling"]
            },
            "Interest_Expense_Amt": {
                "fsdm_entities": ["MONETARY_TRANSACTION", "AGREEMENT_SUMMARY"],
                "bvf_data_requirements": ["Financial Transactions", "Account Balances"],
                "bvf_capabilities": ["Accounting Hub", "Functional P&L"]
            },
            "Net_Interest_Income_Amt": {
                "fsdm_entities": ["AGREEMENT_SUMMARY"],
                "bvf_data_requirements": ["Account Balances"],
                "bvf_capabilities": ["Functional P&L", "Profitability Modelling"]
            },
            "FTP_Credit_Amt": {
                "fsdm_entities": ["FUND_TRANSFER_PRICING"],
                "bvf_data_requirements": ["Master & Ref Data - FTP rates"],
                "bvf_capabilities": ["Funds Transfer Pricing"]
            },
            "FTP_Charge_Amt": {
                "fsdm_entities": ["FUND_TRANSFER_PRICING"],
                "bvf_data_requirements": ["Master & Ref Data - FTP rates"],
                "bvf_capabilities": ["Funds Transfer Pricing"]
            },
            "Net_FTP_Amt": {
                "fsdm_entities": ["FUND_TRANSFER_PRICING"],
                "bvf_data_requirements": ["Master & Ref Data - FTP rates"],
                "bvf_capabilities": ["Funds Transfer Pricing", "Profitability Modelling"]
            },
            "Fee_Income_Amt": {
                "fsdm_entities": ["FEE_TRANSACTION", "SERVICE_FEE"],
                "bvf_data_requirements": ["Account Fees, Commissions & Charges"],
                "bvf_capabilities": ["Accounting Hub", "Functional P&L"]
            },
            "Commission_Income_Amt": {
                "fsdm_entities": ["FEE_TRANSACTION"],
                "bvf_data_requirements": ["Account Fees, Commissions & Charges"],
                "bvf_capabilities": ["Accounting Hub", "Functional P&L"]
            },
            "FX_Gain_Loss_Amt": {
                "fsdm_entities": ["EXCHANGE_RATE_HISTORY", "CURRENCY"],
                "bvf_data_requirements": ["Master & Ref Data - exchange rates", "FX Trading"],
                "bvf_capabilities": ["Accounting Hub"]
            },
            "Other_Income_Amt": {
                "fsdm_entities": ["MONETARY_TRANSACTION"],
                "bvf_data_requirements": ["Financial Transactions"],
                "bvf_capabilities": ["Accounting Hub"]
            },
            "Total_Revenue_Amt": {
                "fsdm_entities": ["AGREEMENT_SUMMARY"],
                "bvf_data_requirements": ["Account Balances", "Financial Transactions"],
                "bvf_capabilities": ["Functional P&L", "Profitability Modelling"]
            },
            "Direct_Cost_Amt": {
                "fsdm_entities": ["GL_TRANSACTION", "CHANNEL_USAGE_EVENT"],
                "bvf_data_requirements": ["Finance Systems - General Ledger", "Service Usage"],
                "bvf_capabilities": ["Activity Based Costing"]
            },
            "Channel_Cost_Amt": {
                "fsdm_entities": ["CHANNEL_TYPE", "CHANNEL_INSTANCE"],
                "bvf_data_requirements": ["Master & Ref Data - Channel", "Service Usage"],
                "bvf_capabilities": ["Activity Based Costing"]
            },
            "Operations_Cost_Amt": {
                "fsdm_entities": ["COST_CENTER", "GL_TRANSACTION"],
                "bvf_data_requirements": ["Finance Systems - ERP", "Finance Systems - General Ledger"],
                "bvf_capabilities": ["Activity Based Costing"]
            },
            "Indirect_Cost_Amt": {
                "fsdm_entities": ["COST_CENTER", "ORGANIZATION_UNIT"],
                "bvf_data_requirements": ["Finance Systems - ERP", "Master & Ref Data - organisation hierarchy"],
                "bvf_capabilities": ["Activity Based Costing"]
            },
            "Total_Cost_Amt": {
                "fsdm_entities": ["GL_TRANSACTION"],
                "bvf_data_requirements": ["Finance Systems - General Ledger"],
                "bvf_capabilities": ["Functional P&L", "Activity Based Costing"]
            },
            "Provision_Expense_Amt": {
                "fsdm_entities": ["AGREEMENT_RISK_METRIC", "CREDIT_RISK_SUMMARY"],
                "bvf_data_requirements": ["Provisions, Losses & Writeoffs", "Risk Exposures"],
                "bvf_capabilities": ["Credit Risk Expected Loss Model"]
            },
            "Risk_Weighted_Asset_Amt": {
                "fsdm_entities": ["RISK_WEIGHTED_ASSET", "BANK_CAPITAL_SUMMARY"],
                "bvf_data_requirements": ["RWA & Capital", "Risk Weighted Assets & Capital Results"],
                "bvf_capabilities": ["Risk Weighted Assets and Regulatory Capital"]
            },
            "Economic_Capital_Amt": {
                "fsdm_entities": ["BANK_CAPITAL_SUMMARY", "CAPITAL_REQUIREMENTS_SUMMARY"],
                "bvf_data_requirements": ["RWA & Capital"],
                "bvf_capabilities": ["Capital Planning and Management", "Capital Consumption"]
            },
            "Expected_Loss_Amt": {
                "fsdm_entities": ["CREDIT_RISK_SUMMARY", "AGREEMENT_RISK_METRIC"],
                "bvf_data_requirements": ["Expected Loss / PD / LGD / EAD", "Risk Exposures"],
                "bvf_capabilities": ["Credit Risk Expected Loss Model"]
            },
            "Net_Profit_Amt": {
                "fsdm_entities": [],
                "bvf_data_requirements": ["Profitability Results"],
                "bvf_capabilities": ["Functional P&L", "Profitability Modelling"]
            },
            "RAROC_Pct": {
                "fsdm_entities": [],
                "bvf_data_requirements": ["Profitability Results", "RWA & Capital"],
                "bvf_capabilities": ["Profitability Analytics and Optimisation", "Capital Planning and Management"]
            },
            "Return_On_Equity_Pct": {
                "fsdm_entities": [],
                "bvf_data_requirements": ["Profitability Results"],
                "bvf_capabilities": ["Profitability Analytics and Optimisation"]
            },
            "Cost_To_Income_Ratio_Pct": {
                "fsdm_entities": [],
                "bvf_data_requirements": ["Profitability Results"],
                "bvf_capabilities": ["Performance Management and KPIs"]
            },
            "Economic_Profit_Amt": {
                "fsdm_entities": [],
                "bvf_data_requirements": ["Profitability Results", "RWA & Capital"],
                "bvf_capabilities": ["Profitability Modelling"]
            },
            "Avg_Balance_Amt": {
                "fsdm_entities": ["AGREEMENT_SUMMARY", "ACCOUNT_METRIC"],
                "bvf_data_requirements": ["Account Balances"],
                "bvf_capabilities": ["Profitability Modelling"]
            },
            "Transaction_Count": {
                "fsdm_entities": ["MONETARY_TRANSACTION"],
                "bvf_data_requirements": ["Financial Transactions"],
                "bvf_capabilities": ["Activity Based Costing"]
            },
            "Product_Count": {
                "fsdm_entities": ["AGREEMENT", "PARTY_AGREEMENT_ROLE"],
                "bvf_data_requirements": ["Account Holdings"],
                "bvf_capabilities": ["Customer Value"]
            }
        }
    },
    "DIM_CUSTOMER": {
        "type": "DIM",
        "columns": {
            "Customer_Id": {"fsdm_entities": ["PARTY"], "bvf_data_requirements": ["Single Customer View (Master Record)"], "bvf_capabilities": ["Single Customer View (Risk)"]},
            "Customer_Name": {"fsdm_entities": ["PARTY"], "bvf_data_requirements": ["Single Customer View (Master Record)"], "bvf_capabilities": ["Single Customer View (Risk)"]},
            "Customer_Type_Cd": {"fsdm_entities": ["INDIVIDUAL", "ORGANIZATION"], "bvf_data_requirements": ["Customer Demographics"], "bvf_capabilities": ["Customer Segmentation"]},
            "Customer_Segment_Cd": {"fsdm_entities": ["PARTY_CLASSIFICATION"], "bvf_data_requirements": ["Customer Segments"], "bvf_capabilities": ["Customer Segmentation"]},
            "Risk_Rating_Cd": {"fsdm_entities": ["RISK_GRADE_VALUE"], "bvf_data_requirements": ["Ratings/Scores (Internal & External)"], "bvf_capabilities": ["Credit Risk Based Pricing Model"]}
        }
    },
    "DIM_PRODUCT": {
        "type": "DIM",
        "columns": {
            "Product_Id": {"fsdm_entities": ["PRODUCT"], "bvf_data_requirements": ["Master & Ref Data - product"], "bvf_capabilities": ["Pricing Analysis & Optimisation"]},
            "Product_Name": {"fsdm_entities": ["PRODUCT"], "bvf_data_requirements": ["Master & Ref Data - product"], "bvf_capabilities": ["Pricing Analysis & Optimisation"]},
            "Product_Type_Cd": {"fsdm_entities": ["PRODUCT_TYPE"], "bvf_data_requirements": ["Master & Ref Data - product"], "bvf_capabilities": ["Pricing Analysis & Optimisation"]},
            "Interest_Rate_Type": {"fsdm_entities": ["INTEREST_RATE"], "bvf_data_requirements": ["Master & Ref Data - FTP rates"], "bvf_capabilities": ["Funds Transfer Pricing"]}
        }
    },
    "DIM_BRANCH": {
        "type": "DIM",
        "columns": {
            "Branch_Id": {"fsdm_entities": ["ORGANIZATION_UNIT"], "bvf_data_requirements": ["Master & Ref Data - organisation hierarchy"], "bvf_capabilities": ["Performance Management and KPIs"]},
            "Branch_Name": {"fsdm_entities": ["ORGANIZATION_UNIT"], "bvf_data_requirements": ["Master & Ref Data - organisation hierarchy"], "bvf_capabilities": ["Performance Management and KPIs"]},
            "Region_Cd": {"fsdm_entities": ["GEOGRAPHICAL_AREA"], "bvf_data_requirements": ["Master & Ref Data - geography / location"], "bvf_capabilities": ["Performance Management and KPIs"]}
        }
    },
    "DIM_BUSINESS_SEGMENT": {
        "type": "DIM",
        "columns": {
            "Segment_Cd": {"fsdm_entities": ["ORGANIZATION_BUSINESS_TYPE"], "bvf_data_requirements": ["Master & Ref Data - organisation hierarchy"], "bvf_capabilities": ["Profitability Analytics and Optimisation"]},
            "Segment_Name": {"fsdm_entities": ["ORGANIZATION_BUSINESS_TYPE"], "bvf_data_requirements": ["Master & Ref Data - organisation hierarchy"], "bvf_capabilities": ["Profitability Analytics and Optimisation"]}
        }
    },
    "DIM_CHANNEL": {
        "type": "DIM",
        "columns": {
            "Channel_Type_Cd": {"fsdm_entities": ["CHANNEL_TYPE"], "bvf_data_requirements": ["Master & Ref Data - Channel"], "bvf_capabilities": ["Activity Based Costing"]},
            "Channel_Name": {"fsdm_entities": ["CHANNEL_INSTANCE"], "bvf_data_requirements": ["Master & Ref Data - Channel"], "bvf_capabilities": ["Activity Based Costing"]},
            "Channel_Cost_Rate": {"fsdm_entities": ["CHANNEL_TYPE"], "bvf_data_requirements": ["Master & Ref Data - Channel"], "bvf_capabilities": ["Activity Based Costing"]}
        }
    },
    "DIM_TIME": {
        "type": "DIM",
        "columns": {
            "Calendar_Dt": {"fsdm_entities": ["TIME_PERIOD_TYPE"], "bvf_data_requirements": [], "bvf_capabilities": []},
        }
    },
    "DIM_GEOGRAPHY": {
        "type": "DIM",
        "columns": {
            "Country_Cd": {"fsdm_entities": ["GEOGRAPHICAL_AREA"], "bvf_data_requirements": ["Master & Ref Data - geography / location"], "bvf_capabilities": []},
            "Region_Name": {"fsdm_entities": ["GEOGRAPHICAL_AREA"], "bvf_data_requirements": ["Master & Ref Data - geography / location"], "bvf_capabilities": []},
            "City_Name": {"fsdm_entities": ["GEOGRAPHICAL_AREA", "SITE"], "bvf_data_requirements": ["Master & Ref Data - geography / location"], "bvf_capabilities": []}
        }
    }
}


def main():
    print("=" * 70)
    print("Phase 4: Profitability Engine Enhancement")
    print("=" * 70)

    # Load BVF data
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_capabilities.json")) as f:
        capabilities = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_data_requirements.json")) as f:
        data_requirements = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_reuse_matrix.json")) as f:
        reuse_matrix = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_to_fsdm_entity_map.json")) as f:
        entity_map = json.load(f)

    # Build lookup: data_req_name → set of capabilities using it
    dr_to_caps = {}
    for dr in data_requirements:
        dr_to_caps[dr["name"]] = set(dr["capabilities"] + dr["output_of"])

    # Identify profitability-critical capabilities
    profit_keywords = ["profitability", "p&l", "profit & loss", "accounting hub",
                       "activity based costing", "funds transfer pricing",
                       "capital planning", "capital management", "capital consumption",
                       "risk weighted asset", "pricing analysis",
                       "asset & liability", "customer value", "lifetime value",
                       "customer segmentation", "performance management"]

    def is_profit_critical(cap_name):
        name_lower = cap_name.lower()
        return any(kw in name_lower for kw in profit_keywords)

    profit_caps = {c["name"] for c in capabilities if is_profit_critical(c["name"])}
    print(f"\n  Profitability-critical capabilities: {len(profit_caps)}")

    # 4.1 Build profitability_bvf_lineage.csv
    print("\n--- Building profitability lineage ---")
    lineage_rows = []
    for table_name, table_info in STAR_SCHEMA_LINEAGE.items():
        for col_name, col_info in table_info["columns"].items():
            for i, entity in enumerate(col_info["fsdm_entities"] or [""]):
                for j, dr in enumerate(col_info["bvf_data_requirements"] or [""]):
                    caps = col_info.get("bvf_capabilities", [])
                    caps_str = "; ".join(caps) if caps else ""

                    # Determine coverage
                    if entity and dr:
                        coverage = "FULL"
                    elif entity or dr:
                        coverage = "PARTIAL"
                    else:
                        coverage = "GAP"

                    lineage_rows.append({
                        "Star_Schema_Table": table_name,
                        "Table_Type": table_info["type"],
                        "Column_Name": col_name,
                        "Source_FSDM_Entity": entity,
                        "Source_BVF_Data_Requirement": dr,
                        "Source_BVF_Capabilities": caps_str,
                        "Coverage_Status": coverage
                    })

    lineage_path = os.path.join(OUTPUT_DIR, "profitability_bvf_lineage.csv")
    with open(lineage_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Star_Schema_Table", "Table_Type", "Column_Name",
                                                "Source_FSDM_Entity", "Source_BVF_Data_Requirement",
                                                "Source_BVF_Capabilities", "Coverage_Status"])
        writer.writeheader()
        writer.writerows(lineage_rows)
    print(f"  [8] Saved: {lineage_path} ({len(lineage_rows)} rows)")

    # 4.3 Implementation Priority Matrix
    print("\n--- Building implementation priority matrix ---")

    # Collect all BVF data requirements used in star schema
    star_schema_drs = set()
    for table_info in STAR_SCHEMA_LINEAGE.values():
        for col_info in table_info["columns"].values():
            for dr in col_info.get("bvf_data_requirements", []):
                if dr:
                    star_schema_drs.add(dr)

    priority_rows = []
    for dr in data_requirements:
        dr_name = dr["name"]
        all_caps = set(dr["capabilities"] + dr["output_of"])

        # Profitability capability count
        profit_cap_count = len(all_caps & profit_caps)
        total_cap_count = len(all_caps)

        # Average reuse coefficient
        reuse_scores = []
        for cap_name in all_caps:
            if cap_name in reuse_matrix:
                reuse_scores.extend(reuse_matrix[cap_name].values())
        avg_reuse = sum(reuse_scores) / len(reuse_scores) if reuse_scores else 0.0

        # Star schema coverage
        star_coverage = 1 if dr_name in star_schema_drs else 0

        # Entity count
        entity_count = entity_map.get(dr_name, {}).get("entity_count", 0)

        # Priority score
        priority_score = (
            profit_cap_count * 3.0 +
            total_cap_count * 0.5 +
            avg_reuse * 2.0 +
            star_coverage * 4.0
        )

        priority_rows.append({
            "BVF_Data_Requirement": dr_name,
            "FSDM_Subject_Area": dr["fsdm_subject_area"],
            "Priority_Score": round(priority_score, 2),
            "Profitability_Cap_Count": profit_cap_count,
            "Total_Cap_Count": total_cap_count,
            "Avg_Reuse_Coeff": round(avg_reuse, 4),
            "Star_Schema_Coverage": star_coverage,
            "FSDM_Entity_Count": entity_count
        })

    # Sort by priority score descending
    priority_rows.sort(key=lambda x: -x["Priority_Score"])

    # Assign tiers and ranks
    for i, row in enumerate(priority_rows):
        row["Rank"] = i + 1
        if i < 20:
            row["Implementation_Tier"] = "Tier 1 (Must Have)"
        elif i < 50:
            row["Implementation_Tier"] = "Tier 2 (Should Have)"
        elif i < 80:
            row["Implementation_Tier"] = "Tier 3 (Nice to Have)"
        else:
            row["Implementation_Tier"] = "Tier 4 (Future)"

    priority_path = os.path.join(OUTPUT_DIR, "bvf_implementation_priority.csv")
    with open(priority_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Rank", "BVF_Data_Requirement", "FSDM_Subject_Area",
                                                "Priority_Score", "Profitability_Cap_Count",
                                                "Total_Cap_Count", "Avg_Reuse_Coeff",
                                                "Star_Schema_Coverage", "FSDM_Entity_Count",
                                                "Implementation_Tier"])
        writer.writeheader()
        writer.writerows(priority_rows)
    print(f"  [9] Saved: {priority_path} ({len(priority_rows)} rows)")

    # Print top 20
    print("\n  Top 20 Priority Data Requirements (Tier 1):")
    for row in priority_rows[:20]:
        print(f"    #{row['Rank']:2d} | {row['BVF_Data_Requirement'][:45]:<45} | Score: {row['Priority_Score']:6.1f} | Profit Caps: {row['Profitability_Cap_Count']}")

    # 4.5 Profitability Data Coverage JSON
    print("\n--- Building profitability data coverage ---")
    coverage_data = {"star_schema_tables": {}, "coverage_summary": {}}
    total_measures = 0
    fully_covered = 0
    partially_covered = 0
    gaps = 0

    for table_name, table_info in STAR_SCHEMA_LINEAGE.items():
        table_data = {"type": table_info["type"], "columns": {}}
        for col_name, col_info in table_info["columns"].items():
            total_measures += 1
            has_entity = bool(col_info["fsdm_entities"])
            has_dr = bool(col_info["bvf_data_requirements"])
            has_cap = bool(col_info.get("bvf_capabilities"))

            if has_entity and has_dr and has_cap:
                status = "FULL"
                fully_covered += 1
            elif has_entity or has_dr:
                status = "PARTIAL"
                partially_covered += 1
            else:
                status = "GAP"
                gaps += 1

            # Determine tier from priority
            col_tier = 4
            for dr in col_info.get("bvf_data_requirements", []):
                for pr in priority_rows:
                    if pr["BVF_Data_Requirement"] == dr:
                        tier_num = int(pr["Implementation_Tier"].split(" ")[1])
                        col_tier = min(col_tier, tier_num)

            table_data["columns"][col_name] = {
                "fsdm_entities": col_info["fsdm_entities"],
                "bvf_data_requirements": col_info["bvf_data_requirements"],
                "bvf_capabilities": col_info.get("bvf_capabilities", []),
                "coverage_status": status,
                "implementation_tier": col_tier
            }
        coverage_data["star_schema_tables"][table_name] = table_data

    coverage_data["coverage_summary"] = {
        "total_measures": total_measures,
        "fully_covered": fully_covered,
        "partially_covered": partially_covered,
        "gaps": gaps,
        "coverage_pct": round(fully_covered / total_measures * 100, 1) if total_measures else 0
    }

    coverage_path = os.path.join(OUTPUT_DIR, "profitability_data_coverage.json")
    with open(coverage_path, "w") as f:
        json.dump(coverage_data, f, indent=2)
    print(f"  [10] Saved: {coverage_path}")
    print(f"    Coverage: {fully_covered} FULL / {partially_covered} PARTIAL / {gaps} GAP out of {total_measures} measures")

    print("\nPhase 4 complete!")


if __name__ == "__main__":
    main()
