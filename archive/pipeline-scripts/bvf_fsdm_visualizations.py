#!/usr/bin/env python3
"""
BVF-FSDM Visualizations
========================
Generates interactive HTML visualizations for the BVF-FSDM integration.

Outputs:
  - bvf_fsdm_sankey.html      (BVF Themes -> Capabilities -> Data Reqs -> FSDM Subject Areas)
  - profitability_data_flow.html (Source -> FSDM -> Star Schema -> Measures)
  - data_reuse_heatmap.html    (Capability x Capability reuse matrix)
  - profitability_erd.html     (Star schema ERD)
"""

import csv
import json
import os
from collections import defaultdict

BASE_DIR = "/mnt/e/erwin"
OUTPUT_DIR = os.path.join(BASE_DIR, "bvf_fsdm_output")


def load_csv(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ══════════════════════════════════════════════════════════════════════════
# VIZ 1: SANKEY DIAGRAM - BVF to FSDM Flow
# ══════════════════════════════════════════════════════════════════════════

def generate_sankey():
    """Interactive Sankey: Themes -> Capability Groups -> Data Requirements -> FSDM Subject Areas"""
    print("Generating Sankey diagram...")

    deps = load_csv("capability_fsdm_dependencies.csv")

    # Collect nodes and links
    nodes = []
    node_idx = {}
    links = []

    def get_node(name, group=""):
        key = f"{group}:{name}" if group else name
        if key not in node_idx:
            node_idx[key] = len(nodes)
            nodes.append({"name": name, "group": group})
        return node_idx[key]

    # Aggregate flows
    theme_to_cap = defaultdict(int)
    cap_to_dr = defaultdict(int)
    dr_to_sa = defaultdict(int)

    for row in deps:
        theme = row["Theme"]
        cap = row["Capability"]
        dr = row["Data_Requirement"]
        sa = row["FSDM_Subject_Area"]

        theme_to_cap[(theme, cap)] += 1
        cap_to_dr[(cap, dr)] += 1
        dr_to_sa[(dr, sa)] += 1

    # Build nodes with group prefixes to avoid collisions
    for (theme, cap), val in theme_to_cap.items():
        src = get_node(theme, "theme")
        tgt = get_node(cap, "capability")
        links.append({"source": src, "target": tgt, "value": val})

    for (cap, dr), val in cap_to_dr.items():
        src = get_node(cap, "capability")
        tgt = get_node(dr, "datareq")
        links.append({"source": src, "target": tgt, "value": val})

    for (dr, sa), val in dr_to_sa.items():
        src = get_node(dr, "datareq")
        tgt = get_node(sa, "subjectarea")
        links.append({"source": src, "target": tgt, "value": val})

    # Color scheme
    theme_colors = {
        "Marketing and Customer Experience": "rgba(31,119,180,0.6)",
        "Risk Management & Regulation": "rgba(255,127,14,0.6)",
        "Finance & Peformance Management": "rgba(44,160,44,0.6)",
    }

    node_colors = []
    for n in nodes:
        if n["group"] == "theme":
            node_colors.append(theme_colors.get(n["name"], "rgba(127,127,127,0.6)"))
        elif n["group"] == "capability":
            node_colors.append("rgba(148,103,189,0.6)")
        elif n["group"] == "datareq":
            node_colors.append("rgba(214,39,40,0.4)")
        else:
            node_colors.append("rgba(44,160,44,0.7)")

    link_colors = []
    for lk in links:
        src_group = nodes[lk["source"]]["group"]
        if src_group == "theme":
            src_name = nodes[lk["source"]]["name"]
            link_colors.append(theme_colors.get(src_name, "rgba(200,200,200,0.3)"))
        else:
            link_colors.append("rgba(200,200,200,0.2)")

    html = f"""<!DOCTYPE html>
<html><head>
<title>BVF to FSDM Sankey Diagram</title>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
  .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; }}
  h1 {{ color: #333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }}
  .legend {{ display: flex; gap: 20px; margin: 10px 0; flex-wrap: wrap; }}
  .legend-item {{ display: flex; align-items: center; gap: 6px; font-size: 13px; }}
  .legend-color {{ width: 16px; height: 16px; border-radius: 3px; }}
</style>
</head><body>
<div class="container">
<h1>BVF-to-FSDM Sankey Diagram</h1>
<p>Flow: <b>BVF Themes</b> &rarr; <b>Capability Groups</b> &rarr; <b>Data Requirements</b> &rarr; <b>FSDM Subject Areas</b></p>
<div class="legend">
  <div class="legend-item"><div class="legend-color" style="background:rgba(31,119,180,0.8)"></div>Marketing & CX</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(255,127,14,0.8)"></div>Risk Management</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(44,160,44,0.8)"></div>Finance & Performance</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(148,103,189,0.8)"></div>Capability Groups</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(214,39,40,0.6)"></div>Data Requirements</div>
</div>
<div id="sankey" style="width:100%;height:900px;"></div>
</div>
<script>
var data = {{
  type: "sankey",
  orientation: "h",
  node: {{
    pad: 15,
    thickness: 20,
    line: {{ color: "black", width: 0.5 }},
    label: {json.dumps([n["name"] for n in nodes])},
    color: {json.dumps(node_colors)}
  }},
  link: {{
    source: {json.dumps([l["source"] for l in links])},
    target: {json.dumps([l["target"] for l in links])},
    value: {json.dumps([l["value"] for l in links])},
    color: {json.dumps(link_colors)}
  }}
}};
Plotly.newPlot('sankey', [data], {{
  title: "",
  font: {{ size: 11 }},
  margin: {{ l: 10, r: 10, t: 10, b: 10 }}
}});
</script>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "bvf_fsdm_sankey.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path}")


# ══════════════════════════════════════════════════════════════════════════
# VIZ 2: PROFITABILITY DATA FLOW
# ══════════════════════════════════════════════════════════════════════════

def generate_data_flow():
    """Interactive diagram: Source Systems -> FSDM Entities -> Star Schema -> Measures"""
    print("Generating profitability data flow...")

    with open(os.path.join(OUTPUT_DIR, "data_lineage.json"), "r") as f:
        lineage = json.load(f)

    nodes = []
    node_idx = {}
    links = []

    def get_node(name, group):
        key = f"{group}:{name}"
        if key not in node_idx:
            node_idx[key] = len(nodes)
            nodes.append({"name": name, "group": group})
        return node_idx[key]

    # Source systems (layer 0)
    sources = {
        "Core Banking (CTL)": ["AGREEMENT_SUMMARY", "MONETARY_TRANSACTION", "FEE_TRANSACTION"],
        "Credit Risk Engine": ["AGREEMENT_RISK_METRIC", "PARTY_LIABILITY_CREDIT_RATING", "BANK_CAPITAL_SUMMARY"],
        "Treasury / ALM": ["INTEREST_RATE", "INTEREST_RATE_INDEX", "CURRENCY_EXCHANGE_RATE"],
        "General Ledger": ["GL_MAIN_ACCOUNT"],
        "Channel Systems": ["CHANNEL_USAGE_METRIC", "CHANNEL_INSTANCE"],
        "CRM / Party Master": ["PARTY_CLASSIFICATION", "PARTY_CLASSIFICATION_VALUE", "RISK_GRADE_VALUE"],
        "Customer Master": ["PARTY", "INDIVIDUAL", "ORGANIZATION"],
        "Product Master": ["PRODUCT", "PRODUCT_GROUP"],
    }

    # Star schema tables (layer 2)
    star_tables = {
        "FACT_CUSTOMER_PROFITABILITY": [
            "Interest_Income", "Fee_Income", "NII", "FTP",
            "Direct_Cost", "Provisions", "RAROC", "ROE", "CIR"
        ],
        "DIM_CUSTOMER": ["Segment", "Demographics", "Risk_Grade"],
        "DIM_PRODUCT": ["Product_Type", "FTP_Rate", "NPV"],
        "DIM_BRANCH": ["Hierarchy", "Cost_Center"],
        "DIM_AGREEMENT": ["Status", "Terms", "Risk_Class"],
    }

    # Build flow: Source -> FSDM entities
    for src, entities in sources.items():
        src_idx = get_node(src, "source")
        for ent in entities:
            ent_idx = get_node(ent, "fsdm")
            links.append({"source": src_idx, "target": ent_idx, "value": 3})

    # Build flow: FSDM entities -> Star schema
    fsdm_to_star = {
        "AGREEMENT_SUMMARY": "FACT_CUSTOMER_PROFITABILITY",
        "MONETARY_TRANSACTION": "FACT_CUSTOMER_PROFITABILITY",
        "FEE_TRANSACTION": "FACT_CUSTOMER_PROFITABILITY",
        "AGREEMENT_RISK_METRIC": "FACT_CUSTOMER_PROFITABILITY",
        "PARTY_LIABILITY_CREDIT_RATING": "FACT_CUSTOMER_PROFITABILITY",
        "BANK_CAPITAL_SUMMARY": "FACT_CUSTOMER_PROFITABILITY",
        "INTEREST_RATE": "FACT_CUSTOMER_PROFITABILITY",
        "INTEREST_RATE_INDEX": "FACT_CUSTOMER_PROFITABILITY",
        "CURRENCY_EXCHANGE_RATE": "FACT_CUSTOMER_PROFITABILITY",
        "GL_MAIN_ACCOUNT": "FACT_CUSTOMER_PROFITABILITY",
        "CHANNEL_USAGE_METRIC": "FACT_CUSTOMER_PROFITABILITY",
        "CHANNEL_INSTANCE": "DIM_BRANCH",
        "PARTY_CLASSIFICATION": "DIM_CUSTOMER",
        "PARTY_CLASSIFICATION_VALUE": "DIM_CUSTOMER",
        "RISK_GRADE_VALUE": "DIM_CUSTOMER",
        "PARTY": "DIM_CUSTOMER",
        "INDIVIDUAL": "DIM_CUSTOMER",
        "ORGANIZATION": "DIM_BRANCH",
        "PRODUCT": "DIM_PRODUCT",
        "PRODUCT_GROUP": "DIM_PRODUCT",
    }

    for ent, star_tbl in fsdm_to_star.items():
        ent_key = f"fsdm:{ent}"
        if ent_key in node_idx:
            ent_idx = node_idx[ent_key]
            tbl_idx = get_node(star_tbl, "star")
            links.append({"source": ent_idx, "target": tbl_idx, "value": 2})

    # Star schema -> Measures
    measures = {
        "FACT_CUSTOMER_PROFITABILITY": [
            "Net Interest Income (NII)",
            "Fee & Commission Income",
            "Total Cost (ABC)",
            "Provision Expense (ECL)",
            "RAROC",
            "Cost-to-Income Ratio",
        ],
        "DIM_CUSTOMER": ["Customer Segmentation", "Risk Profile"],
        "DIM_PRODUCT": ["Product P&L", "FTP Analysis"],
        "DIM_BRANCH": ["Branch Profitability"],
    }

    for star_tbl, measure_list in measures.items():
        star_key = f"star:{star_tbl}"
        if star_key in node_idx:
            star_idx = node_idx[star_key]
            for m in measure_list:
                m_idx = get_node(m, "measure")
                links.append({"source": star_idx, "target": m_idx, "value": 2})

    # Colors by group
    group_colors = {
        "source": "rgba(31,119,180,0.7)",
        "fsdm": "rgba(255,127,14,0.7)",
        "star": "rgba(44,160,44,0.7)",
        "measure": "rgba(214,39,40,0.7)",
    }

    node_colors = [group_colors.get(n["group"], "#999") for n in nodes]
    link_colors = ["rgba(180,180,180,0.3)" for _ in links]

    html = f"""<!DOCTYPE html>
<html><head>
<title>Profitability Data Flow</title>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
  .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; }}
  h1 {{ color: #333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }}
  .legend {{ display: flex; gap: 20px; margin: 10px 0; }}
  .legend-item {{ display: flex; align-items: center; gap: 6px; font-size: 13px; }}
  .legend-color {{ width: 16px; height: 16px; border-radius: 3px; }}
</style>
</head><body>
<div class="container">
<h1>Customer Profitability Engine - Data Flow</h1>
<p>Flow: <b>Source Systems</b> &rarr; <b>FSDM Entities</b> &rarr; <b>Star Schema</b> &rarr; <b>Profitability Measures</b></p>
<div class="legend">
  <div class="legend-item"><div class="legend-color" style="background:rgba(31,119,180,0.9)"></div>Source Systems</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(255,127,14,0.9)"></div>FSDM Entities</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(44,160,44,0.9)"></div>Star Schema Tables</div>
  <div class="legend-item"><div class="legend-color" style="background:rgba(214,39,40,0.9)"></div>Profitability Measures</div>
</div>
<div id="flow" style="width:100%;height:800px;"></div>
</div>
<script>
var data = {{
  type: "sankey",
  orientation: "h",
  node: {{
    pad: 15,
    thickness: 20,
    line: {{ color: "black", width: 0.5 }},
    label: {json.dumps([n["name"] for n in nodes])},
    color: {json.dumps(node_colors)}
  }},
  link: {{
    source: {json.dumps([l["source"] for l in links])},
    target: {json.dumps([l["target"] for l in links])},
    value: {json.dumps([l["value"] for l in links])},
    color: {json.dumps(link_colors)}
  }}
}};
Plotly.newPlot('flow', [data], {{
  font: {{ size: 11 }},
  margin: {{ l: 10, r: 10, t: 10, b: 10 }}
}});
</script>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "profitability_data_flow.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path}")


# ══════════════════════════════════════════════════════════════════════════
# VIZ 3: DATA REUSE HEATMAP
# ══════════════════════════════════════════════════════════════════════════

def generate_reuse_heatmap():
    """Interactive heatmap of the BVF Data Reuse Matrix (112 x 112)."""
    print("Generating reuse heatmap...")

    matrix_data = load_csv("bvf_reuse_matrix.csv")

    labels = [row["Sub_Capability"] for row in matrix_data]
    themes = [row["Theme"] for row in matrix_data]

    # Build numeric matrix
    z_data = []
    for row in matrix_data:
        z_row = []
        for label in labels:
            val = row.get(label, "")
            try:
                z_row.append(float(val))
            except (ValueError, TypeError):
                z_row.append(0)
        z_data.append(z_row)

    # Truncate labels for display
    short_labels = [l[:30] + "..." if len(l) > 30 else l for l in labels]

    # Theme boundaries for annotations
    theme_boundaries = []
    current_theme = None
    for i, t in enumerate(themes):
        if t != current_theme:
            theme_boundaries.append({"idx": i, "theme": t})
            current_theme = t

    html = f"""<!DOCTYPE html>
<html><head>
<title>BVF Data Reuse Heatmap</title>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
  .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; }}
  h1 {{ color: #333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }}
  p {{ color: #666; }}
</style>
</head><body>
<div class="container">
<h1>BVF Data Reuse Matrix - Heatmap</h1>
<p>Cross-capability data reuse coefficients (0 = no overlap, 1 = identical data needs).
Higher values indicate capabilities that share more data requirements.</p>
<div id="heatmap" style="width:100%;height:1000px;"></div>
</div>
<script>
var data = [{{
  z: {json.dumps(z_data)},
  x: {json.dumps(short_labels)},
  y: {json.dumps(short_labels)},
  type: 'heatmap',
  colorscale: [
    [0, '#f7fbff'],
    [0.2, '#c6dbef'],
    [0.4, '#6baed6'],
    [0.6, '#2171b5'],
    [0.8, '#08519c'],
    [1, '#08306b']
  ],
  hovertemplate: '<b>%{{x}}</b><br>vs<br><b>%{{y}}</b><br>Reuse: %{{z:.2f}}<extra></extra>',
  colorbar: {{ title: 'Reuse<br>Coefficient', titleside: 'right' }}
}}];

var shapes = [
  // Theme boundary lines
""" + ",\n  ".join([
        f"""{{ type: 'line', x0: {b['idx']}-0.5, x1: {b['idx']}-0.5, y0: -0.5, y1: {len(labels)-1}+0.5, line: {{ color: 'red', width: 1.5, dash: 'dot' }} }},
  {{ type: 'line', x0: -0.5, x1: {len(labels)-1}+0.5, y0: {b['idx']}-0.5, y1: {b['idx']}-0.5, line: {{ color: 'red', width: 1.5, dash: 'dot' }} }}"""
        for b in theme_boundaries[1:]  # skip first boundary at 0
    ]) + """
];

var annotations = [
""" + ",\n  ".join([
        f"""{{ x: {b['idx'] + 5}, y: -3, text: '{b['theme'][:30]}', showarrow: false, font: {{ size: 10, color: 'red' }} }}"""
        for b in theme_boundaries
    ]) + """
];

Plotly.newPlot('heatmap', data, {{
  margin: {{ l: 200, r: 50, t: 30, b: 200 }},
  xaxis: {{ tickangle: -45, tickfont: {{ size: 8 }}, showgrid: false }},
  yaxis: {{ tickfont: {{ size: 8 }}, showgrid: false, autorange: 'reversed' }},
  shapes: shapes,
  annotations: annotations
}});
</script>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "data_reuse_heatmap.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path}")


# ══════════════════════════════════════════════════════════════════════════
# VIZ 4: PROFITABILITY ERD
# ══════════════════════════════════════════════════════════════════════════

def generate_profitability_erd():
    """Interactive star schema ERD with FSDM source annotations."""
    print("Generating profitability ERD...")

    html = """<!DOCTYPE html>
<html><head>
<title>Profitability Star Schema ERD</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: #e0e0e0; }
  .container { max-width: 1400px; margin: 0 auto; }
  h1 { color: #e0e0e0; border-bottom: 2px solid #16213e; padding-bottom: 10px; text-align: center; }
  .subtitle { text-align: center; color: #888; margin-bottom: 30px; }
  svg { width: 100%; height: 800px; }
  .table-box { cursor: pointer; }
  .table-box rect { rx: 6; ry: 6; stroke-width: 2; transition: all 0.3s; }
  .table-box:hover rect { filter: brightness(1.2); stroke-width: 3; }
  .table-header { font-weight: bold; font-size: 13px; fill: white; }
  .table-col { font-size: 10px; fill: #ccc; }
  .table-col-key { font-size: 10px; fill: #ffcc00; }
  .fsdm-note { font-size: 9px; fill: #888; font-style: italic; }
  .rel-line { stroke: #4a6fa5; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
  .rel-label { font-size: 9px; fill: #888; }
  .legend-box { fill: #16213e; stroke: #333; rx: 6; }
</style>
</head><body>
<div class="container">
<h1>Customer Profitability Star Schema ERD</h1>
<p class="subtitle">FSDM v16.00.00 + BVF v1.2 | Pakistani Bank Implementation</p>

<svg viewBox="0 0 1400 850" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#4a6fa5"/>
    </marker>
  </defs>

  <!-- FACT TABLE (center) -->
  <g class="table-box" transform="translate(440, 180)">
    <rect width="520" height="420" fill="#0d2137" stroke="#e74c3c" />
    <rect width="520" height="28" fill="#c0392b" />
    <text x="260" y="19" text-anchor="middle" class="table-header">FACT_CUSTOMER_PROFITABILITY</text>

    <text x="10" y="48" class="table-col-key">PK Customer_Party_Id  BIGINT</text>
    <text x="10" y="62" class="table-col-key">PK Agreement_Id  BIGINT</text>
    <text x="10" y="76" class="table-col-key">PK Product_Id  BIGINT</text>
    <text x="10" y="90" class="table-col-key">FK Branch_Org_Id, Business_Segment_Cd, Channel_Instance_Id</text>
    <text x="10" y="104" class="table-col-key">PK Time_Period_Key  DATE</text>

    <line x1="10" y1="112" x2="510" y2="112" stroke="#555" stroke-width="0.5"/>
    <text x="10" y="127" class="table-col">-- Revenue (BVF: Financial Transactions, Fees)</text>
    <text x="10" y="141" class="table-col">Interest_Income_Amt, Interest_Expense_Amt</text>
    <text x="10" y="155" class="table-col">Fee_Income_Amt, Commission_Income_Amt, FX_Income_Amt</text>
    <text x="10" y="169" class="table-col">Total_Revenue_Amt</text>

    <text x="10" y="188" class="table-col">-- FTP (BVF: Funds Transfer Pricing)</text>
    <text x="10" y="202" class="table-col">FTP_Rate_Pct, FTP_Credit_Amt, FTP_Debit_Amt</text>
    <text x="10" y="216" class="table-col">Net_Interest_Income_Amt</text>

    <text x="10" y="235" class="table-col">-- Costs (BVF: Activity Based Costing)</text>
    <text x="10" y="249" class="table-col">Direct_Cost_Amt, Transaction_Cost_Amt, Servicing_Cost_Amt</text>
    <text x="10" y="263" class="table-col">Channel_Cost_Amt, Allocated_Overhead_Amt, Total_Cost_Amt</text>

    <text x="10" y="282" class="table-col">-- Risk (BVF: Risk Exposures, Provisions)</text>
    <text x="10" y="296" class="table-col">Provision_Expense_Amt, Expected_Loss_Amt</text>
    <text x="10" y="310" class="table-col">Risk_Weighted_Asset_Amt, Economic_Capital_Amt</text>

    <text x="10" y="329" class="table-col">-- Profitability Results (BVF: Profitability)</text>
    <text x="10" y="343" class="table-col">Gross_Profit_Amt, Net_Profit_Amt, Pre_Tax_Profit_Amt</text>
    <text x="10" y="357" class="table-col">RAROC_Pct, Cost_To_Income_Ratio, ROE_Pct, NIM_Pct</text>

    <text x="10" y="376" class="table-col">-- Balances &amp; Pakistan-specific</text>
    <text x="10" y="390" class="table-col">Average_Balance_Amt, EOP_Balance_Amt</text>
    <text x="10" y="404" class="table-col">WHT_Amount_Amt, Zakat_Deduction_Amt, Is_Islamic_Ind</text>

    <text x="340" y="48" class="fsdm-note">FSDM: AGREEMENT_SUMMARY</text>
    <text x="340" y="62" class="fsdm-note">FSDM: AGREEMENT</text>
    <text x="340" y="76" class="fsdm-note">FSDM: PRODUCT</text>
    <text x="340" y="90" class="fsdm-note">FSDM: ORGANIZATION</text>
  </g>

  <!-- DIM_CUSTOMER (top-left) -->
  <g class="table-box" transform="translate(20, 20)">
    <rect width="340" height="210" fill="#0d2137" stroke="#3498db" />
    <rect width="340" height="28" fill="#2980b9" />
    <text x="170" y="19" text-anchor="middle" class="table-header">DIM_CUSTOMER</text>
    <text x="10" y="48" class="table-col-key">PK Customer_Party_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Customer_Type_Cd, Customer_Name</text>
    <text x="10" y="80" class="table-col">Customer_Segment_Cd, Profitability_Tier_Cd</text>
    <text x="10" y="95" class="table-col">Risk_Segment_Cd, Value_Band_Cd</text>
    <text x="10" y="110" class="table-col">Gender_Cd, Age_Band_Cd, Income_Band_Cd</text>
    <text x="10" y="125" class="table-col">CNIC_Number (Pakistan ID)</text>
    <text x="10" y="140" class="table-col">KYC_Status_Cd, AML_Risk_Rating_Cd</text>
    <text x="10" y="155" class="table-col">City_Cd, Province_Cd, Country_Cd</text>
    <text x="10" y="173" class="fsdm-note">FSDM: PARTY, INDIVIDUAL, ORGANIZATION</text>
    <text x="10" y="186" class="fsdm-note">PARTY_CLASSIFICATION, PARTY_IDENTIFICATION</text>
    <text x="10" y="199" class="fsdm-note">BVF: Single Customer View, KYC Data</text>
  </g>

  <!-- DIM_PRODUCT (top-right) -->
  <g class="table-box" transform="translate(1040, 20)">
    <rect width="340" height="200" fill="#0d2137" stroke="#2ecc71" />
    <rect width="340" height="28" fill="#27ae60" />
    <text x="170" y="19" text-anchor="middle" class="table-header">DIM_PRODUCT</text>
    <text x="10" y="48" class="table-col-key">PK Product_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Product_Name, Product_Type_Cd</text>
    <text x="10" y="80" class="table-col">Asset_Liability_Cd, Is_Islamic_Product</text>
    <text x="10" y="95" class="table-col">Islamic_Mode_Cd, SBP_Product_Code</text>
    <text x="10" y="110" class="table-col">FTP_Rate_Pct, Benchmark_Rate_Cd</text>
    <text x="10" y="125" class="table-col">Standard_Cost_Amt, Standard_Revenue_Amt</text>
    <text x="10" y="140" class="table-col">Product_NPV_Amt</text>
    <text x="10" y="160" class="fsdm-note">FSDM: PRODUCT, PRODUCT_GROUP</text>
    <text x="10" y="173" class="fsdm-note">INTEREST_RATE, PRODUCT_PRICING</text>
    <text x="10" y="186" class="fsdm-note">BVF: Product Revenue/Cost, FTP Rates</text>
  </g>

  <!-- DIM_BRANCH (bottom-left) -->
  <g class="table-box" transform="translate(20, 330)">
    <rect width="340" height="190" fill="#0d2137" stroke="#e67e22" />
    <rect width="340" height="28" fill="#d35400" />
    <text x="170" y="19" text-anchor="middle" class="table-header">DIM_BRANCH</text>
    <text x="10" y="48" class="table-col-key">PK Branch_Org_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Branch_Name, Branch_Code, Branch_Type_Cd</text>
    <text x="10" y="80" class="table-col">Region_Name, Zone_Name, Area_Name</text>
    <text x="10" y="95" class="table-col">City_Name, Province_Cd</text>
    <text x="10" y="110" class="table-col">Cost_Center_Cd, Monthly_Operating_Cost</text>
    <text x="10" y="125" class="table-col">Is_Islamic_Branch, Rural_Urban_Cd</text>
    <text x="10" y="145" class="fsdm-note">FSDM: ORGANIZATION, INTERNAL_ORGANIZATION_UNIT</text>
    <text x="10" y="158" class="fsdm-note">ORGANIZATION_UNIT_RELATIONSHIP</text>
    <text x="10" y="171" class="fsdm-note">BVF: Organisation Hierarchy</text>
  </g>

  <!-- DIM_TIME (bottom-right) -->
  <g class="table-box" transform="translate(1040, 310)">
    <rect width="340" height="180" fill="#0d2137" stroke="#9b59b6" />
    <rect width="340" height="28" fill="#8e44ad" />
    <text x="170" y="19" text-anchor="middle" class="table-header">DIM_TIME</text>
    <text x="10" y="48" class="table-col-key">PK Time_Period_Key  DATE</text>
    <text x="10" y="65" class="table-col">Calendar_Year, Calendar_Quarter, Calendar_Month</text>
    <text x="10" y="80" class="table-col">Fiscal_Year (Jul-Jun), Fiscal_Quarter</text>
    <text x="10" y="95" class="table-col">Is_Business_Day, Is_Friday</text>
    <text x="10" y="110" class="table-col">Is_SBP_Reporting_Dt</text>
    <text x="10" y="125" class="table-col">Is_Eid_Holiday, Is_National_Holiday</text>
    <text x="10" y="145" class="fsdm-note">FSDM: TIME_PERIOD_TYPE</text>
    <text x="10" y="158" class="fsdm-note">Pakistan: Fiscal Year Jul-Jun, Friday holiday</text>
  </g>

  <!-- DIM_BUSINESS_SEGMENT (bottom-center-left) -->
  <g class="table-box" transform="translate(20, 580)">
    <rect width="320" height="140" fill="#0d2137" stroke="#1abc9c" />
    <rect width="320" height="28" fill="#16a085" />
    <text x="160" y="19" text-anchor="middle" class="table-header">DIM_BUSINESS_SEGMENT</text>
    <text x="10" y="48" class="table-col-key">PK Business_Segment_Cd  VARCHAR</text>
    <text x="10" y="65" class="table-col">Segment_Name, Segment_Group_Cd</text>
    <text x="10" y="80" class="table-col">Capital_Allocation_Pct, Target_ROE_Pct</text>
    <text x="10" y="95" class="table-col">SBP_Sector_Code</text>
    <text x="10" y="115" class="fsdm-note">FSDM: ORGANIZATION_BUSINESS_TYPE</text>
    <text x="10" y="128" class="fsdm-note">Retail/Corp/SME/Agri/Islamic/Treasury</text>
  </g>

  <!-- DIM_CHANNEL (bottom-center) -->
  <g class="table-box" transform="translate(400, 650)">
    <rect width="300" height="130" fill="#0d2137" stroke="#f39c12" />
    <rect width="300" height="28" fill="#f39c12" />
    <text x="150" y="19" text-anchor="middle" class="table-header">DIM_CHANNEL</text>
    <text x="10" y="48" class="table-col-key">PK Channel_Instance_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Channel_Type_Cd, Channel_Name</text>
    <text x="10" y="80" class="table-col">Channel_Cost_Per_Txn</text>
    <text x="10" y="95" class="table-col">Is_Digital_Channel, Is_Branchless</text>
    <text x="10" y="115" class="fsdm-note">FSDM: CHANNEL_TYPE, CHANNEL_INSTANCE</text>
  </g>

  <!-- DIM_AGREEMENT (bottom-right area) -->
  <g class="table-box" transform="translate(760, 560)">
    <rect width="340" height="200" fill="#0d2137" stroke="#e74c3c" />
    <rect width="340" height="28" fill="#c0392b" />
    <text x="170" y="19" text-anchor="middle" class="table-header">DIM_AGREEMENT</text>
    <text x="10" y="48" class="table-col-key">PK Agreement_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Agreement_Type_Cd, Account_Status_Cd</text>
    <text x="10" y="80" class="table-col">Maturity_Dt, Interest_Rate_Pct, Rate_Type_Cd</text>
    <text x="10" y="95" class="table-col">Benchmark_Cd (KIBOR), Tenure_Months</text>
    <text x="10" y="110" class="table-col">Risk_Grade_Cd, SBP_Classification_Cd</text>
    <text x="10" y="125" class="table-col">IFRS9_Stage_Cd</text>
    <text x="10" y="140" class="table-col">Collateral_Ind, LTV_Ratio_Pct</text>
    <text x="10" y="155" class="table-col">Is_Islamic_Ind, Islamic_Mode_Cd</text>
    <text x="10" y="175" class="fsdm-note">FSDM: AGREEMENT + subtypes</text>
    <text x="10" y="188" class="fsdm-note">LOAN_TERM_AGREEMENT, DEPOSIT_AGREEMENT</text>
  </g>

  <!-- DIM_GEOGRAPHY -->
  <g class="table-box" transform="translate(1120, 540)">
    <rect width="260" height="130" fill="#0d2137" stroke="#95a5a6" />
    <rect width="260" height="28" fill="#7f8c8d" />
    <text x="130" y="19" text-anchor="middle" class="table-header">DIM_GEOGRAPHY</text>
    <text x="10" y="48" class="table-col-key">PK Geography_Area_Id  BIGINT</text>
    <text x="10" y="65" class="table-col">Province, District, City</text>
    <text x="10" y="80" class="table-col">Area_Type_Cd (Metro/Urban/Rural)</text>
    <text x="10" y="95" class="table-col">SBP_Region_Cd</text>
    <text x="10" y="115" class="fsdm-note">FSDM: GEOGRAPHICAL_AREA</text>
  </g>

  <!-- RELATIONSHIP LINES -->
  <!-- Customer -> Fact -->
  <line x1="360" y1="130" x2="440" y2="250" class="rel-line"/>
  <text x="380" y="180" class="rel-label">Customer_Party_Id</text>

  <!-- Product -> Fact -->
  <line x1="1040" y1="130" x2="960" y2="250" class="rel-line"/>
  <text x="990" y="180" class="rel-label">Product_Id</text>

  <!-- Branch -> Fact -->
  <line x1="360" y1="430" x2="440" y2="400" class="rel-line"/>
  <text x="380" y="425" class="rel-label">Branch_Org_Id</text>

  <!-- Time -> Fact -->
  <line x1="1040" y1="410" x2="960" y2="400" class="rel-line"/>
  <text x="990" y="420" class="rel-label">Time_Period_Key</text>

  <!-- Segment -> Fact -->
  <line x1="340" y1="640" x2="440" y2="550" class="rel-line"/>
  <text x="370" y="590" class="rel-label">Business_Segment_Cd</text>

  <!-- Channel -> Fact -->
  <line x1="550" y1="650" x2="650" y2="600" class="rel-line"/>
  <text x="580" y="635" class="rel-label">Channel_Instance_Id</text>

  <!-- Agreement -> Fact -->
  <line x1="800" y1="560" x2="760" y2="550" class="rel-line"/>
  <text x="760" y="565" class="rel-label">Agreement_Id</text>

  <!-- Geography -> Fact -->
  <line x1="1120" y1="580" x2="960" y2="520" class="rel-line"/>
  <text x="1040" y="540" class="rel-label">Geography_Area_Id</text>

  <!-- Legend -->
  <rect x="20" y="760" width="350" height="70" class="legend-box" rx="6"/>
  <text x="30" y="780" fill="#e0e0e0" font-size="12" font-weight="bold">Legend</text>
  <rect x="30" y="790" width="12" height="12" fill="#2980b9"/>
  <text x="48" y="801" fill="#ccc" font-size="10">Dimension Table</text>
  <rect x="150" y="790" width="12" height="12" fill="#c0392b"/>
  <text x="168" y="801" fill="#ccc" font-size="10">Fact Table</text>
  <line x1="270" y1="796" x2="300" y2="796" class="rel-line"/>
  <text x="305" y="801" fill="#ccc" font-size="10">FK Relationship</text>
  <text x="30" y="820" fill="#888" font-size="9" font-style="italic">FSDM source entities shown in italic below each table</text>
</svg>
</div>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "profitability_erd.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path}")


# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════

def main():
    print("Generating BVF-FSDM Visualizations...")
    print("=" * 50)

    generate_sankey()
    generate_data_flow()
    generate_reuse_heatmap()
    generate_profitability_erd()

    print("\n" + "=" * 50)
    print("All visualizations generated!")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith(".html"):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f"  {f:45s} {size:>10,} bytes")


if __name__ == "__main__":
    main()
