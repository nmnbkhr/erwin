#!/usr/bin/env python3
"""
FSDM Unified Visualizer — Generates a self-contained HTML app
for exploring both v13 (ERwin LDM) and v16 (XSD) parser outputs.

Output: /mnt/e/erwin/fsdm_output/fsdm_explorer.html
"""

import csv
import json
import gzip
import base64
import os
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────────────
V13_DIR = Path("/mnt/e/erwin/erwin_parser_output")
V16_DIR = Path("/mnt/e/erwin/fsdm_output")
OUTPUT_PATH = V16_DIR / "fsdm_explorer.html"

# ── Domain Colors (matching existing ERD) ─────────────────────────────────
DOMAIN_COLORS = {
    "Agreement/Account":     "#2196F3",
    "Asset Management":      "#009688",
    "Campaign/Marketing":    "#E91E63",
    "Channel Management":    "#00BCD4",
    "Claims Management":     "#795548",
    "Event Management":      "#607D8B",
    "Financial Transaction":  "#9C27B0",
    "Human Resources":       "#CDDC39",
    "Investment Management":  "#FF5722",
    "Location/Geography":    "#4CAF50",
    "Other":                 "#78909C",
    "Party Management":      "#FF9800",
    "Product Management":    "#3F51B5",
    "Reference Data":        "#8BC34A",
    "Risk Management":       "#F44336",
    "Web Analytics":         "#00E676",
}

PROFITABILITY_ENTITIES = {
    "AGREEMENT", "AGREEMENT_SUMMARY", "AGREEMENT_RISK_METRIC",
    "MONETARY_TRANSACTION", "PARTY", "INDIVIDUAL", "ORGANIZATION",
    "HOUSEHOLD", "PRODUCT", "PRODUCT_GROUP", "CHANNEL_INSTANCE",
    "CHANNEL_TYPE", "TIME_PERIOD_TYPE", "GEOGRAPHICAL_AREA",
    "ORGANIZATION_BUSINESS_TYPE", "GL_MAIN_ACCOUNT",
    "AGREEMENT_COST", "AGREEMENT_CURRENCY", "AGREEMENT_FINANCIAL_RULE",
    "CREDIT_RISK_SUMMARY", "BANK_CAPITAL_SUMMARY",
}

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# ── Data Loading ───────────────────────────────────────────────────────────

def read_csv(path, max_rows=None):
    rows = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if max_rows and i >= max_rows:
                break
            rows.append(dict(row))
    return rows

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_v13():
    log("Loading v13 data...")
    data = {}
    data["stats"] = load_json(V13_DIR / "fsdm_stats.json")
    data["entities"] = read_csv(V13_DIR / "fsdm_entity_summary.csv")
    data["attributes"] = read_csv(V13_DIR / "fsdm_data_dictionary.csv")
    data["relationships"] = read_csv(V13_DIR / "fsdm_relationships.csv")
    data["subject_areas"] = read_csv(V13_DIR / "fsdm_subject_areas.csv")
    log(f"  v13: {len(data['entities'])} entities, {len(data['attributes'])} attributes")
    return data

def load_v16():
    log("Loading v16 data...")
    data = {}
    data["stats"] = load_json(V16_DIR / "fsdm_stats.json")
    data["entities"] = read_csv(V16_DIR / "fsdm_entity_catalog.csv")
    data["attributes"] = read_csv(V16_DIR / "fsdm_data_dictionary.csv")
    data["relationships"] = read_csv(V16_DIR / "fsdm_relationships.csv")
    data["domain_map"] = load_json(V16_DIR / "fsdm_domain_map.json")
    data["inheritance"] = load_json(V16_DIR / "fsdm_inheritance_tree.json")
    data["profitability"] = read_csv(V16_DIR / "fsdm_profitability_mapping.csv")
    # Read profitability calc framework
    calc_path = V16_DIR / "profitability_calc_framework.md"
    data["calc_framework"] = calc_path.read_text(encoding="utf-8") if calc_path.exists() else ""
    # Read star schema SQL
    star_path = V16_DIR / "profitability_star_schema.sql"
    data["star_schema_sql"] = star_path.read_text(encoding="utf-8") if star_path.exists() else ""
    log(f"  v16: {len(data['entities'])} entities, {len(data['attributes'])} attributes, {len(data['relationships'])} relationships")
    return data

# ── Preprocessing ──────────────────────────────────────────────────────────

def preprocess_dashboard(v13, v16):
    """Build comparison stats for dashboard."""
    return {
        "v13": {
            "name": "FSDM v13.00 (ERwin LDM)",
            "entities": v13["stats"]["summary"]["total_entities"],
            "attributes": v13["stats"]["summary"]["total_attributes"],
            "relationships": v13["stats"]["summary"]["total_relationships"],
            "subject_areas": v13["stats"]["summary"]["total_subject_areas"],
            "avg_attrs": v13["stats"]["summary"]["avg_attributes_per_entity"],
        },
        "v16": {
            "name": "FSDM v16.00 (XSD Schema)",
            "entities": v16["stats"]["summary"]["total_entities"],
            "attributes": v16["stats"]["summary"]["total_attributes"],
            "relationships": v16["stats"]["summary"]["total_relationships"],
            "inheritance": v16["stats"]["summary"]["total_inheritance_chains"],
            "classwords": v16["stats"]["summary"]["classword_types"],
            "avg_attrs": v16["stats"]["summary"]["avg_attributes_per_entity"],
        },
        "v16_domains": v16["stats"].get("domain_breakdown", {}),
        "v13_subject_areas": v13["stats"].get("subject_area_breakdown", {}),
        "v16_hubs": v16["stats"].get("hub_entities", [])[:15],
        "v13_hubs": v13["stats"].get("hub_entities", [])[:15],
        "v16_top_attrs": v16["stats"].get("top_entities_by_attributes", [])[:15],
        "v13_top_attrs": v13["stats"].get("top_entities_by_attributes", [])[:15],
    }

def normalize_name(name):
    """Normalize entity name: spaces→underscores, strip, uppercase."""
    return name.strip().upper().replace(" ", "_")

def preprocess_entities(v13, v16):
    """Merge v13 and v16 entity data into unified list."""
    # Index v13 entities by NORMALIZED name (spaces→underscores)
    v13_idx = {}
    v13_raw_names = {}  # normalized → original raw name
    for e in v13["entities"]:
        raw = e.get("Entity", "").strip()
        if raw:
            norm = normalize_name(raw)
            v13_idx[norm] = e
            v13_raw_names[norm] = raw

    # Index v13 attributes by NORMALIZED entity name
    v13_attrs = defaultdict(list)
    for a in v13["attributes"]:
        raw = a.get("Entity", "").strip()
        if raw:
            norm = normalize_name(raw)
            v13_attrs[norm].append({
                "n": a.get("Attribute", ""),
                "pk": a.get("PK", ""),
                "fk": a.get("FK", ""),
                "d": (a.get("Description", "") or "")[:200],
            })

    # Index v16 attributes by entity (already uses underscores)
    v16_attrs = defaultdict(list)
    for a in v16["attributes"]:
        ent = a.get("Entity", "").strip()
        if ent:
            v16_attrs[ent].append({
                "n": a.get("Attribute", ""),
                "cw": a.get("Classword_Type", ""),
                "td": a.get("Teradata_Type", ""),
                "pk": a.get("PK", ""),
                "req": a.get("Required", ""),
                "d": (a.get("Description", "") or "")[:200],
            })

    # Build merged entity list — v16 entities as base
    merged = []
    seen_norm = set()
    for e in v16["entities"]:
        name = e.get("Entity", "").strip()
        if not name:
            continue
        norm = normalize_name(name)
        seen_norm.add(norm)
        v13e = v13_idx.get(norm, {})
        merged.append({
            "name": name,
            "domain": e.get("Domain", "Other"),
            "subject_area": v13e.get("Subject_Area", ""),
            "v16_attrs": int(e.get("Column_Count", 0) or 0),
            "v13_attrs": int(v13e.get("Column_Count", 0) or 0) if v13e else 0,
            "rels": int(e.get("Relationship_Count", 0) or 0),
            "parent": e.get("Parent_Entity", ""),
            "subtypes": int(e.get("Subtype_Count", 0) or 0),
            "desc": (e.get("Description", "") or "")[:300],
            "in_v13": norm in v13_idx,
            "in_v16": True,
            "profitability": name in PROFITABILITY_ENTITIES,
        })

    # Add v13-only entities (not in v16)
    for norm, e in v13_idx.items():
        if norm not in seen_norm:
            merged.append({
                "name": norm,  # Use normalized underscore form
                "domain": "",
                "subject_area": e.get("Subject_Area", ""),
                "v16_attrs": 0,
                "v13_attrs": int(e.get("Column_Count", 0) or 0),
                "rels": 0,
                "parent": "",
                "subtypes": 0,
                "desc": (e.get("Description", "") or "")[:300],
                "in_v13": True,
                "in_v16": False,
                "profitability": False,
            })

    merged.sort(key=lambda x: x["name"])
    return merged, dict(v16_attrs), dict(v13_attrs)

def preprocess_graph(v16):
    """Build vis.js graph data — top 500 most-connected entities."""
    # Count relationships per entity
    rel_count = defaultdict(int)
    for r in v16["relationships"]:
        p = r.get("Parent_Entity", "").strip()
        c = r.get("Child_Entity", "").strip()
        if p:
            rel_count[p] += 1
        if c:
            rel_count[c] += 1

    # Entity index for domain/attrs
    ent_idx = {}
    for e in v16["entities"]:
        name = e.get("Entity", "").strip()
        if name:
            ent_idx[name] = e

    # Get top 500 by relationship count
    top = sorted(rel_count.items(), key=lambda x: -x[1])[:500]
    top_set = set(n for n, _ in top)

    # Always include profitability entities
    for pe in PROFITABILITY_ENTITIES:
        if pe in ent_idx:
            top_set.add(pe)

    # Build nodes
    nodes = []
    for name in top_set:
        e = ent_idx.get(name, {})
        domain = e.get("Domain", "Other")
        color = DOMAIN_COLORS.get(domain, "#78909C")
        attrs = int(e.get("Column_Count", 0) or 0)
        is_prof = name in PROFITABILITY_ENTITIES
        nodes.append({
            "id": name,
            "label": name.replace("_", " "),
            "group": domain,
            "color": {"background": color, "border": "#FFD700" if is_prof else color},
            "borderWidth": 3 if is_prof else 1,
            "size": min(8 + rel_count.get(name, 0) * 0.5, 40),
            "title": f"<b>{name}</b><br>Domain: {domain}<br>Attrs: {attrs}<br>Rels: {rel_count.get(name,0)}",
        })

    # Build edges (only between included nodes)
    edges = []
    seen_edges = set()
    for r in v16["relationships"]:
        p = r.get("Parent_Entity", "").strip()
        c = r.get("Child_Entity", "").strip()
        # Strip role suffixes from child for matching
        c_base = c.split("_is_")[0] if "_is_" in c else c
        if p in top_set and c_base in top_set:
            key = f"{p}→{c_base}"
            if key not in seen_edges:
                seen_edges.add(key)
                rt = r.get("Relationship_Type", "association")
                edges.append({
                    "from": p,
                    "to": c_base,
                    "dashes": rt == "inheritance",
                    "color": {"color": "#FF9800" if rt == "inheritance" else "#555555"},
                    "arrows": "to",
                })

    return nodes, edges

def preprocess_inheritance(v16):
    """Get the inheritance tree data — already in JSON."""
    tree = v16["inheritance"]
    # The tree should be a list of root nodes with children
    if isinstance(tree, dict) and "trees" in tree:
        return tree["trees"]
    if isinstance(tree, list):
        return tree
    return [tree]

def compress_data(obj):
    """Compress JSON data with gzip + base64 for HTML embedding."""
    raw = json.dumps(obj, separators=(",", ":")).encode("utf-8")
    compressed = gzip.compress(raw, compresslevel=9)
    return base64.b64encode(compressed).decode("ascii")

# ── HTML Generation ────────────────────────────────────────────────────────

def generate_html(dashboard, entities, v16_attrs, v13_attrs, graph_nodes, graph_edges,
                  inheritance_trees, v16, domain_colors):
    """Generate the complete self-contained HTML app."""

    # Prepare embedded data
    log("Compressing data for embedding...")

    # Trim v16 attrs for data dict — keep all but truncate descriptions
    v16_dd = []
    for a in v16["attributes"]:
        v16_dd.append({
            "e": a.get("Entity", ""),
            "a": a.get("Attribute", ""),
            "cw": a.get("Classword_Type", ""),
            "td": a.get("Teradata_Type", ""),
            "pk": a.get("PK", ""),
            "req": a.get("Required", ""),
            "d": (a.get("Description", "") or "")[:250],
            "p": a.get("Parent_Entity", ""),
        })

    data_dashboard = compress_data(dashboard)
    data_entities = compress_data(entities)
    data_v16_attrs = compress_data(v16_attrs)
    data_v13_attrs = compress_data(v13_attrs)
    data_graph_nodes = compress_data(graph_nodes)
    data_graph_edges = compress_data(graph_edges)
    data_inheritance = compress_data(inheritance_trees)
    data_dd = compress_data(v16_dd)
    data_profitability = compress_data(v16["profitability"])
    data_domain_colors = json.dumps(domain_colors)

    # Escape the calc framework MD for embedding
    calc_md = v16.get("calc_framework", "").replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    star_sql = v16.get("star_schema_sql", "").replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

    log("Building HTML...")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FSDM Explorer — Teradata Financial Services Data Model</title>
<!-- CDN Libraries -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://unpkg.com/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/jquery.dataTables.min.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<style>
/* ── Reset & Base ─────────────────────────────────────────────── */
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#1a1a2e;color:#e0e0e0;overflow:hidden;height:100vh;display:flex}}
a{{color:#64B5F6;text-decoration:none}}
::-webkit-scrollbar{{width:8px;height:8px}}
::-webkit-scrollbar-track{{background:#1a1a2e}}
::-webkit-scrollbar-thumb{{background:#444;border-radius:4px}}
::-webkit-scrollbar-thumb:hover{{background:#666}}

/* ── Sidebar ──────────────────────────────────────────────────── */
.sidebar{{width:220px;background:#16213e;display:flex;flex-direction:column;flex-shrink:0;border-right:1px solid #0f3460}}
.sidebar-header{{padding:20px 16px;border-bottom:1px solid #0f3460}}
.sidebar-header h1{{font-size:16px;color:#64B5F6;font-weight:700;letter-spacing:0.5px}}
.sidebar-header .subtitle{{font-size:11px;color:#888;margin-top:4px}}
.nav{{flex:1;overflow-y:auto;padding:8px 0}}
.nav-item{{display:flex;align-items:center;padding:12px 16px;cursor:pointer;transition:all .15s;border-left:3px solid transparent;color:#aaa;font-size:13px;gap:10px}}
.nav-item:hover{{background:#1a2744;color:#e0e0e0}}
.nav-item.active{{background:#0f3460;color:#64B5F6;border-left-color:#64B5F6;font-weight:600}}
.nav-item .icon{{font-size:18px;width:24px;text-align:center}}
.nav-item .badge{{margin-left:auto;background:#0f3460;color:#64B5F6;font-size:10px;padding:2px 7px;border-radius:10px}}
.nav-item.active .badge{{background:#1a2744}}
.sidebar-footer{{padding:12px 16px;border-top:1px solid #0f3460;font-size:10px;color:#555}}

/* ── Main Content ─────────────────────────────────────────────── */
.main{{flex:1;display:flex;flex-direction:column;overflow:hidden}}
.tab-content{{flex:1;overflow-y:auto;padding:24px;display:none}}
.tab-content.active{{display:block}}

/* ── Cards & Panels ───────────────────────────────────────────── */
.card{{background:#16213e;border-radius:8px;padding:20px;margin-bottom:16px;border:1px solid #0f3460}}
.card h3{{color:#64B5F6;font-size:14px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px}}
.stats-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}}
.stat-card{{background:#1a2744;border-radius:8px;padding:16px;text-align:center;border:1px solid #0f3460;transition:transform .15s}}
.stat-card:hover{{transform:translateY(-2px)}}
.stat-card .value{{font-size:28px;font-weight:700;color:#64B5F6}}
.stat-card .label{{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}}
.stat-card.gold .value{{color:#FFD700}}
.stat-card.green .value{{color:#4CAF50}}

/* ── Version comparison ───────────────────────────────────────── */
.compare-grid{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
@media(max-width:900px){{.compare-grid{{grid-template-columns:1fr}}}}

/* ── Chart containers ─────────────────────────────────────────── */
.chart-row{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}}
.chart-box{{background:#16213e;border-radius:8px;padding:16px;border:1px solid #0f3460;position:relative}}
.chart-box canvas{{max-height:300px}}
.chart-box h4{{color:#ccc;font-size:12px;margin-bottom:10px;text-align:center}}

/* ── DataTable override for dark theme ────────────────────────── */
.dataTables_wrapper{{color:#ccc}}
.dataTables_wrapper .dataTables_filter input,.dataTables_wrapper .dataTables_length select{{background:#1a2744;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px;padding:4px 8px}}
table.dataTable{{border-collapse:collapse!important;width:100%!important}}
table.dataTable thead th{{background:#0f3460;color:#64B5F6;border-bottom:2px solid #1a2744;padding:10px 8px;font-size:12px;text-align:left}}
table.dataTable tbody td{{padding:8px;border-bottom:1px solid #1a2744;font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
table.dataTable tbody tr{{background:#16213e}}
table.dataTable tbody tr:hover{{background:#1a2744}}
table.dataTable tbody tr.shown{{background:#0f3460}}
.dataTables_wrapper .dataTables_paginate .paginate_button{{color:#888!important;background:transparent!important;border:1px solid #0f3460!important;border-radius:4px;margin:0 2px}}
.dataTables_wrapper .dataTables_paginate .paginate_button.current{{background:#0f3460!important;color:#64B5F6!important}}
.dataTables_wrapper .dataTables_paginate .paginate_button:hover{{background:#1a2744!important;color:#fff!important}}
.dataTables_wrapper .dataTables_info{{color:#888;font-size:12px}}
.dataTables_wrapper .dataTables_length{{color:#888;font-size:12px}}
.dataTables_wrapper .dataTables_filter{{color:#888;font-size:12px}}

/* ── Entity detail (expandable row) ───────────────────────────── */
.entity-detail{{padding:12px;background:#1a1a2e;border-radius:4px}}
.entity-detail h4{{color:#FFD700;margin-bottom:8px;font-size:13px}}
.attr-table{{width:100%;font-size:11px;border-collapse:collapse}}
.attr-table th{{background:#0f3460;padding:6px 8px;text-align:left;color:#64B5F6}}
.attr-table td{{padding:5px 8px;border-bottom:1px solid #16213e}}
.attr-table tr:hover{{background:#16213e}}
.pk-badge{{background:#FFD700;color:#000;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700}}
.fk-badge{{background:#FF9800;color:#000;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700}}
.cw-badge{{background:#2196F3;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px}}
.prof-badge{{background:#FFD700;color:#000;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700}}
.version-badge{{padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600}}
.v13-badge{{background:#4CAF50;color:#fff}}
.v16-badge{{background:#2196F3;color:#fff}}
.both-badge{{background:#9C27B0;color:#fff}}

/* ── ERD ──────────────────────────────────────────────────────── */
#erd-container{{width:100%;height:calc(100vh - 160px);border-radius:8px;border:1px solid #0f3460}}
.erd-controls{{display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap}}
.erd-controls select,.erd-controls input{{background:#1a2744;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px;padding:6px 10px;font-size:12px}}
.erd-controls input{{flex:1;min-width:200px}}
.erd-controls button{{background:#0f3460;color:#64B5F6;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:12px}}
.erd-controls button:hover{{background:#1a2744}}
.erd-legend{{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}}
.erd-legend-item{{display:flex;align-items:center;gap:4px;font-size:10px;color:#aaa}}
.erd-legend-dot{{width:10px;height:10px;border-radius:50%;display:inline-block}}
.erd-detail-panel{{position:absolute;right:10px;top:80px;width:340px;max-height:calc(100vh - 200px);overflow-y:auto;background:#16213e;border:1px solid #0f3460;border-radius:8px;padding:16px;display:none;z-index:100}}
.erd-detail-panel h4{{color:#FFD700;margin-bottom:8px}}
.erd-detail-panel .close-btn{{position:absolute;top:8px;right:12px;cursor:pointer;color:#888;font-size:18px}}

/* ── Inheritance Tree ─────────────────────────────────────────── */
#tree-container{{width:100%;height:calc(100vh - 160px);overflow:auto}}
#tree-svg{{min-width:1200px}}
.tree-controls{{display:flex;gap:8px;margin-bottom:10px;align-items:center}}
.tree-controls select{{background:#1a2744;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px;padding:6px 10px;font-size:12px}}
.tree-node circle{{cursor:pointer;stroke-width:2px}}
.tree-node text{{font-size:11px;fill:#e0e0e0}}
.tree-link{{fill:none;stroke:#444;stroke-width:1.5px}}

/* ── Domain Browser ───────────────────────────────────────────── */
.domain-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}}
.domain-card{{background:#16213e;border-radius:8px;padding:16px;border:1px solid #0f3460;cursor:pointer;transition:all .15s}}
.domain-card:hover{{transform:translateY(-2px);border-color:#64B5F6}}
.domain-card.expanded{{grid-column:1/-1}}
.domain-card h4{{display:flex;align-items:center;gap:8px;margin-bottom:8px}}
.domain-card h4 .dot{{width:12px;height:12px;border-radius:50%}}
.domain-card .count{{font-size:24px;font-weight:700;color:#64B5F6}}
.domain-card .entities-label{{font-size:11px;color:#888}}
.domain-entity-list{{margin-top:10px;max-height:400px;overflow-y:auto;font-size:12px}}
.domain-entity-list table{{width:100%;border-collapse:collapse}}
.domain-entity-list th{{background:#0f3460;padding:6px 8px;text-align:left;color:#64B5F6;font-size:11px}}
.domain-entity-list td{{padding:4px 8px;border-bottom:1px solid #1a2744}}

/* ── Profitability ────────────────────────────────────────────── */
.star-schema{{position:relative;width:100%;min-height:500px;margin:20px 0}}
.schema-table{{position:absolute;background:#16213e;border:2px solid #0f3460;border-radius:8px;padding:12px;cursor:pointer;transition:all .15s;min-width:160px}}
.schema-table:hover{{border-color:#64B5F6;transform:scale(1.02)}}
.schema-table.fact{{border-color:#FFD700;background:#1a2744}}
.schema-table h5{{font-size:12px;margin-bottom:6px;text-align:center}}
.schema-table.fact h5{{color:#FFD700}}
.schema-table.dim h5{{color:#64B5F6}}
.schema-table ul{{list-style:none;font-size:10px;color:#aaa}}
.schema-table ul li{{padding:2px 0}}
.schema-table ul li.pk{{color:#FFD700;font-weight:600}}
.schema-table ul li.measure{{color:#4CAF50}}
.schema-detail{{background:#16213e;border:1px solid #0f3460;border-radius:8px;padding:16px;margin-top:12px;display:none}}
.calc-framework{{background:#1a2744;border-radius:8px;padding:16px;font-family:'Courier New',monospace;font-size:12px;white-space:pre-wrap;line-height:1.6;max-height:500px;overflow-y:auto}}
.prof-section{{margin-bottom:16px}}

/* ── Loading ──────────────────────────────────────────────────── */
.loading{{display:flex;align-items:center;justify-content:center;height:200px;color:#888}}
.loading::after{{content:'';width:24px;height:24px;border:3px solid #0f3460;border-top:3px solid #64B5F6;border-radius:50%;animation:spin 1s linear infinite;margin-left:10px}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}

/* ── Filters ──────────────────────────────────────────────────── */
.filter-bar{{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}}
.filter-bar select,.filter-bar input{{background:#1a2744;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px;padding:6px 10px;font-size:12px}}
.filter-bar label{{font-size:11px;color:#888}}
</style>
</head>
<body>

<!-- ── Sidebar ──────────────────────────────────────────────────── -->
<nav class="sidebar">
  <div class="sidebar-header">
    <h1>FSDM Explorer</h1>
    <div class="subtitle">Teradata Financial Services<br>Data Model</div>
  </div>
  <div class="nav">
    <div class="nav-item active" onclick="switchTab('dashboard')" id="nav-dashboard">
      <span class="icon">&#9635;</span> Dashboard
    </div>
    <div class="nav-item" onclick="switchTab('entities')" id="nav-entities">
      <span class="icon">&#9776;</span> Entity Explorer
      <span class="badge" id="entity-count-badge"></span>
    </div>
    <div class="nav-item" onclick="switchTab('erd')" id="nav-erd">
      <span class="icon">&#9678;</span> ERD Network
    </div>
    <div class="nav-item" onclick="switchTab('tree')" id="nav-tree">
      <span class="icon">&#9700;</span> Inheritance Tree
      <span class="badge" id="tree-count-badge"></span>
    </div>
    <div class="nav-item" onclick="switchTab('domains')" id="nav-domains">
      <span class="icon">&#9641;</span> Domain Browser
    </div>
    <div class="nav-item" onclick="switchTab('profitability')" id="nav-profitability">
      <span class="icon">&#9733;</span> Profitability
    </div>
    <div class="nav-item" onclick="switchTab('datadict')" id="nav-datadict">
      <span class="icon">&#9881;</span> Data Dictionary
      <span class="badge" id="dd-count-badge"></span>
    </div>
  </div>
  <div class="sidebar-footer">
    Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}<br>
    v13 ERwin LDM + v16 XSD
  </div>
</nav>

<!-- ── Main Content ─────────────────────────────────────────────── -->
<div class="main">

<!-- TAB: Dashboard -->
<div class="tab-content active" id="tab-dashboard">
  <div class="card">
    <h3>Model Comparison — v13 vs v16</h3>
    <div class="compare-grid" id="compare-stats"></div>
  </div>
  <div class="chart-row">
    <div class="chart-box"><h4>v16 Domains (Entity Distribution)</h4><canvas id="chart-domains"></canvas></div>
    <div class="chart-box"><h4>v13 Subject Areas (Entity Distribution)</h4><canvas id="chart-subjects"></canvas></div>
  </div>
  <div class="chart-row">
    <div class="chart-box"><h4>v16 Hub Entities (Most Connected)</h4><canvas id="chart-v16-hubs"></canvas></div>
    <div class="chart-box"><h4>v16 Top Entities by Attribute Count</h4><canvas id="chart-v16-attrs"></canvas></div>
  </div>
</div>

<!-- TAB: Entity Explorer -->
<div class="tab-content" id="tab-entities">
  <div class="card">
    <h3>Entity Explorer</h3>
    <div class="filter-bar">
      <label>Domain:</label>
      <select id="filter-domain" onchange="filterEntities()"><option value="">All Domains</option></select>
      <label>Version:</label>
      <select id="filter-version" onchange="filterEntities()">
        <option value="">Both</option><option value="both">In Both v13 &amp; v16</option>
        <option value="v16only">v16 Only</option><option value="v13only">v13 Only</option>
      </select>
      <label><input type="checkbox" id="filter-prof" onchange="filterEntities()"> Profitability Entities</label>
    </div>
    <table id="entity-table" class="display" style="width:100%">
      <thead><tr>
        <th></th><th>Entity</th><th>Domain</th><th>Subject Area</th>
        <th>v16 Attrs</th><th>v13 Attrs</th><th>Rels</th><th>Parent</th><th>Version</th>
      </tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<!-- TAB: ERD Network -->
<div class="tab-content" id="tab-erd" style="padding:12px;position:relative">
  <div class="erd-controls">
    <select id="erd-domain-filter" onchange="filterERD()"><option value="">All Domains</option></select>
    <input type="text" id="erd-search" placeholder="Search entity..." onkeyup="searchERD(event)">
    <button onclick="resetERD()">Reset View</button>
    <button onclick="togglePhysics()">Toggle Physics</button>
    <label style="font-size:12px;color:#888"><input type="checkbox" id="erd-inh-toggle" checked onchange="toggleInheritance()"> Inheritance</label>
  </div>
  <div class="erd-legend" id="erd-legend"></div>
  <div id="erd-container"></div>
  <div class="erd-detail-panel" id="erd-detail">
    <span class="close-btn" onclick="document.getElementById('erd-detail').style.display='none'">&times;</span>
    <div id="erd-detail-content"></div>
  </div>
</div>

<!-- TAB: Inheritance Tree -->
<div class="tab-content" id="tab-tree">
  <div class="card" style="padding:12px">
    <div class="tree-controls">
      <label style="color:#888;font-size:12px">Root Entity:</label>
      <select id="tree-root-select" onchange="renderTree()"></select>
      <button onclick="expandAll()" style="background:#0f3460;color:#64B5F6;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:12px">Expand All</button>
      <button onclick="collapseAll()" style="background:#0f3460;color:#64B5F6;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:12px">Collapse All</button>
    </div>
    <div id="tree-container"></div>
  </div>
</div>

<!-- TAB: Domain Browser -->
<div class="tab-content" id="tab-domains">
  <div class="card"><h3>FSDM v16 Domains (16)</h3>
    <div class="domain-grid" id="v16-domain-grid"></div>
  </div>
  <div class="card"><h3>FSDM v13 Subject Areas (26)</h3>
    <div class="domain-grid" id="v13-subject-grid"></div>
  </div>
</div>

<!-- TAB: Profitability -->
<div class="tab-content" id="tab-profitability">
  <div class="card">
    <h3>Banking Customer Profitability — Star Schema</h3>
    <div class="star-schema" id="star-schema-container"></div>
  </div>
  <div class="prof-section">
    <div class="card">
      <h3>FSDM-to-Profitability Mapping</h3>
      <table id="prof-mapping-table" class="display" style="width:100%">
        <thead><tr><th>Measure</th><th>FSDM Entity</th><th>FSDM Attribute</th><th>Calculation</th><th>Notes</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
  <div class="prof-section">
    <div class="card">
      <h3>Calculation Framework</h3>
      <div class="calc-framework" id="calc-framework-content"></div>
    </div>
  </div>
</div>

<!-- TAB: Data Dictionary -->
<div class="tab-content" id="tab-datadict">
  <div class="card">
    <h3>Data Dictionary — All Attributes (v16)</h3>
    <div class="filter-bar">
      <label>Classword:</label>
      <select id="dd-cw-filter" onchange="filterDD()"><option value="">All Classwords</option></select>
      <label><input type="checkbox" id="dd-pk-filter" onchange="filterDD()"> PK Only</label>
    </div>
    <table id="dd-table" class="display" style="width:100%">
      <thead><tr>
        <th>Entity</th><th>Attribute</th><th>Classword</th><th>Teradata Type</th><th>PK</th><th>Req</th><th>Description</th>
      </tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>

</div><!-- /main -->

<!-- ── Embedded Compressed Data ──────────────────────────────────── -->
<script>
// Decompress gzip+base64 data
async function decompress(b64) {{
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks = [];
  while (true) {{
    const {{done, value}} = await reader.read();
    if (done) break;
    chunks.push(value);
  }}
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {{
    result.set(chunk, offset);
    offset += chunk.length;
  }}
  return JSON.parse(new TextDecoder().decode(result));
}}

const DATA = {{
  dashboard: "{data_dashboard}",
  entities: "{data_entities}",
  v16Attrs: "{data_v16_attrs}",
  v13Attrs: "{data_v13_attrs}",
  graphNodes: "{data_graph_nodes}",
  graphEdges: "{data_graph_edges}",
  inheritance: "{data_inheritance}",
  dataDict: "{data_dd}",
  profitability: "{data_profitability}",
}};

const DOMAIN_COLORS = {data_domain_colors};

const CALC_FRAMEWORK = `{calc_md}`;
const STAR_SCHEMA_SQL = `{star_sql}`;

// ── Global State ──────────────────────────────────────────────
let db = {{}};
let erdNetwork = null;
let erdAllNodes = null;
let erdAllEdges = null;
let entityTable = null;
let ddTable = null;
let physicsEnabled = true;

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(tabId) {{
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.getElementById('nav-' + tabId).classList.add('active');
  // Lazy init
  if (tabId === 'erd' && !erdNetwork) initERD();
  if (tabId === 'tree' && !document.getElementById('tree-svg')) initTree();
  if (tabId === 'datadict' && !ddTable) initDataDict();
  if (tabId === 'profitability' && !document.getElementById('star-rendered')) initProfitability();
  if (tabId === 'entities' && !entityTable) initEntityExplorer();
}}

// ── Dashboard ─────────────────────────────────────────────────
function initDashboard() {{
  const d = db.dashboard;
  const v13 = d.v13, v16 = d.v16;

  // Comparison stats
  const metrics = [
    ['Entities', v13.entities, v16.entities, ''],
    ['Attributes', v13.attributes, v16.attributes, ''],
    ['Relationships', v13.relationships, v16.relationships, ''],
    ['Avg Attrs/Entity', v13.avg_attrs, v16.avg_attrs, ''],
    ['Subject Areas', v13.subject_areas, '-', 'gold'],
    ['Domains', '-', '16', 'gold'],
    ['Inheritance Chains', '-', v16.inheritance, 'green'],
    ['Classword Types', '-', v16.classwords, 'green'],
  ];

  let html = `<div style="grid-column:1/-1"><div class="stats-grid">`;
  metrics.forEach(([label, val13, val16, cls]) => {{
    const v13s = typeof val13 === 'number' ? val13.toLocaleString() : val13;
    const v16s = typeof val16 === 'number' ? val16.toLocaleString() : val16;
    html += `<div class="stat-card ${{cls}}">
      <div class="value">${{v16s}}</div>
      <div class="label">${{label}}</div>
      <div style="font-size:10px;color:#666;margin-top:4px">v13: ${{v13s}}</div>
    </div>`;
  }});
  html += `</div></div>`;
  document.getElementById('compare-stats').innerHTML = html;

  // Domain donut chart
  const domainLabels = Object.keys(d.v16_domains);
  const domainValues = Object.values(d.v16_domains);
  const domainColorsArr = domainLabels.map(l => DOMAIN_COLORS[l] || '#78909C');
  new Chart(document.getElementById('chart-domains'), {{
    type: 'doughnut',
    data: {{ labels: domainLabels, datasets: [{{ data: domainValues, backgroundColor: domainColorsArr, borderWidth: 0 }}] }},
    options: {{ responsive: true, plugins: {{ legend: {{ position: 'right', labels: {{ color: '#ccc', font: {{ size: 10 }} }} }} }} }}
  }});

  // Subject area donut
  const saLabels = Object.keys(d.v13_subject_areas);
  const saValues = Object.values(d.v13_subject_areas);
  const saPalette = ['#2196F3','#FF9800','#4CAF50','#E91E63','#9C27B0','#00BCD4','#FF5722','#795548','#607D8B','#CDDC39','#3F51B5','#009688','#F44336','#8BC34A','#00E676','#FF6F00','#AD1457','#1565C0','#2E7D32','#6A1B9A','#00838F','#BF360C','#33691E','#4527A0','#004D40','#E65100'];
  new Chart(document.getElementById('chart-subjects'), {{
    type: 'doughnut',
    data: {{ labels: saLabels, datasets: [{{ data: saValues, backgroundColor: saPalette, borderWidth: 0 }}] }},
    options: {{ responsive: true, plugins: {{ legend: {{ position: 'right', labels: {{ color: '#ccc', font: {{ size: 9 }} }} }} }} }}
  }});

  // Hub entities bar chart
  if (d.v16_hubs && d.v16_hubs.length) {{
    const hubLabels = d.v16_hubs.map(h => h.entity.replace(/_/g,' '));
    const hubValues = d.v16_hubs.map(h => h.relationships);
    new Chart(document.getElementById('chart-v16-hubs'), {{
      type: 'bar',
      data: {{ labels: hubLabels, datasets: [{{ label: 'Relationships', data: hubValues, backgroundColor: '#2196F3', borderRadius: 4 }}] }},
      options: {{ indexAxis: 'y', responsive: true, plugins: {{ legend: {{ display: false }} }}, scales: {{ x: {{ ticks: {{ color: '#888' }}, grid: {{ color: '#1a2744' }} }}, y: {{ ticks: {{ color: '#ccc', font: {{ size: 10 }} }}, grid: {{ display: false }} }} }} }}
    }});
  }}

  // Top attrs bar chart
  if (d.v16_top_attrs && d.v16_top_attrs.length) {{
    const attrLabels = d.v16_top_attrs.map(h => (h.entity || '').replace(/_/g,' '));
    const attrValues = d.v16_top_attrs.map(h => h.attributes || h.attribute_count || 0);
    new Chart(document.getElementById('chart-v16-attrs'), {{
      type: 'bar',
      data: {{ labels: attrLabels, datasets: [{{ label: 'Attributes', data: attrValues, backgroundColor: '#FF9800', borderRadius: 4 }}] }},
      options: {{ indexAxis: 'y', responsive: true, plugins: {{ legend: {{ display: false }} }}, scales: {{ x: {{ ticks: {{ color: '#888' }}, grid: {{ color: '#1a2744' }} }}, y: {{ ticks: {{ color: '#ccc', font: {{ size: 10 }} }}, grid: {{ display: false }} }} }} }}
    }});
  }}
}}

// ── Entity Explorer ───────────────────────────────────────────
function initEntityExplorer() {{
  const ents = db.entities;
  document.getElementById('entity-count-badge').textContent = ents.length;

  // Populate domain filter
  const domains = [...new Set(ents.map(e => e.domain).filter(Boolean))].sort();
  const domSel = document.getElementById('filter-domain');
  domains.forEach(d => {{ const o = document.createElement('option'); o.value = d; o.textContent = d; domSel.appendChild(o); }});

  // Build DataTable
  const tableData = ents.map(e => {{
    const vBadge = e.in_v13 && e.in_v16 ? '<span class="version-badge both-badge">Both</span>'
      : e.in_v16 ? '<span class="version-badge v16-badge">v16</span>'
      : '<span class="version-badge v13-badge">v13</span>';
    const profBadge = e.profitability ? ' <span class="prof-badge">PROFIT</span>' : '';
    return [
      '<span class="dt-expand" style="cursor:pointer;color:#64B5F6;font-size:16px">&#9654;</span>',
      e.name.replace(/_/g, ' ') + profBadge,
      e.domain || '-',
      e.subject_area || '-',
      e.v16_attrs,
      e.v13_attrs,
      e.rels,
      e.parent ? e.parent.replace(/_/g, ' ') : '-',
      vBadge,
      // Hidden columns for filtering
      e.name, e.domain, e.in_v13 ? '1' : '0', e.in_v16 ? '1' : '0', e.profitability ? '1' : '0'
    ];
  }});

  entityTable = $('#entity-table').DataTable({{
    data: tableData,
    columns: [
      {{ title: '', orderable: false, width: '20px' }},
      {{ title: 'Entity' }},
      {{ title: 'Domain' }},
      {{ title: 'Subject Area' }},
      {{ title: 'v16 Attrs', className: 'dt-right' }},
      {{ title: 'v13 Attrs', className: 'dt-right' }},
      {{ title: 'Rels', className: 'dt-right' }},
      {{ title: 'Parent' }},
      {{ title: 'Version' }},
      {{ visible: false }}, {{ visible: false }}, {{ visible: false }}, {{ visible: false }}, {{ visible: false }}
    ],
    pageLength: 25,
    order: [[6, 'desc']],
    deferRender: true,
  }});

  // Row expand handler
  $('#entity-table tbody').on('click', 'td:first-child', function() {{
    const tr = $(this).closest('tr');
    const row = entityTable.row(tr);
    if (row.child.isShown()) {{
      row.child.hide();
      tr.removeClass('shown');
      $(this).find('.dt-expand').html('&#9654;');
    }} else {{
      const data = row.data();
      const entityName = data[9]; // hidden raw name
      row.child(buildEntityDetail(entityName)).show();
      tr.addClass('shown');
      $(this).find('.dt-expand').html('&#9660;');
    }}
  }});
}}

function buildEntityDetail(entityName) {{
  let html = '<div class="entity-detail">';

  // v16 attributes
  const v16a = db.v16Attrs[entityName] || [];
  if (v16a.length) {{
    html += '<h4>v16 Attributes (' + v16a.length + ')</h4>';
    html += '<table class="attr-table"><thead><tr><th>Attribute</th><th>Classword</th><th>Teradata Type</th><th>PK</th><th>Req</th><th>Description</th></tr></thead><tbody>';
    v16a.forEach(a => {{
      const pkBadge = a.pk === 'Y' ? '<span class="pk-badge">PK</span>' : '';
      const cwBadge = a.cw ? '<span class="cw-badge">' + a.cw.replace('Classword_','') + '</span>' : '';
      html += `<tr><td>${{a.n}}</td><td>${{cwBadge}}</td><td>${{a.td}}</td><td>${{pkBadge}}</td><td>${{a.req}}</td><td>${{a.d || '-'}}</td></tr>`;
    }});
    html += '</tbody></table>';
  }}

  // v13 attributes
  const v13a = db.v13Attrs[entityName] || [];
  if (v13a.length) {{
    html += '<h4 style="margin-top:12px">v13 Attributes (' + v13a.length + ')</h4>';
    html += '<table class="attr-table"><thead><tr><th>Attribute</th><th>PK</th><th>FK</th><th>Description</th></tr></thead><tbody>';
    v13a.forEach(a => {{
      const pkBadge = a.pk === 'Y' ? '<span class="pk-badge">PK</span>' : '';
      const fkBadge = a.fk === 'Y' ? '<span class="fk-badge">FK</span>' : '';
      html += `<tr><td>${{a.n}}</td><td>${{pkBadge}}</td><td>${{fkBadge}}</td><td>${{a.d || '-'}}</td></tr>`;
    }});
    html += '</tbody></table>';
  }}

  if (!v16a.length && !v13a.length) html += '<p style="color:#888">No attributes found.</p>';
  html += '</div>';
  return html;
}}

function filterEntities() {{
  if (!entityTable) return;
  const domain = document.getElementById('filter-domain').value;
  const version = document.getElementById('filter-version').value;
  const prof = document.getElementById('filter-prof').checked;

  entityTable.column(10).search(domain);

  if (version === 'both') entityTable.column(11).search('1').column(12).search('1');
  else if (version === 'v16only') entityTable.column(11).search('0').column(12).search('1');
  else if (version === 'v13only') entityTable.column(11).search('1').column(12).search('0');
  else entityTable.column(11).search('').column(12).search('');

  entityTable.column(13).search(prof ? '1' : '');
  entityTable.draw();
}}

// ── ERD Network ───────────────────────────────────────────────
function initERD() {{
  const nodes = db.graphNodes;
  const edges = db.graphEdges;

  // Legend
  let legendHtml = '';
  Object.entries(DOMAIN_COLORS).forEach(([d, c]) => {{
    legendHtml += `<span class="erd-legend-item"><span class="erd-legend-dot" style="background:${{c}}"></span>${{d}}</span>`;
  }});
  legendHtml += '<span class="erd-legend-item"><span class="erd-legend-dot" style="background:#FFD700"></span>Profitability</span>';
  document.getElementById('erd-legend').innerHTML = legendHtml;

  // Populate domain filter
  const domSel = document.getElementById('erd-domain-filter');
  Object.keys(DOMAIN_COLORS).sort().forEach(d => {{
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    domSel.appendChild(o);
  }});

  erdAllNodes = new vis.DataSet(nodes);
  erdAllEdges = new vis.DataSet(edges);

  const container = document.getElementById('erd-container');
  erdNetwork = new vis.Network(container, {{ nodes: erdAllNodes, edges: erdAllEdges }}, {{
    physics: {{
      barnesHut: {{ gravitationalConstant: -3000, springLength: 150, springConstant: 0.02 }},
      stabilization: {{ iterations: 200 }}
    }},
    nodes: {{
      shape: 'dot',
      font: {{ size: 10, color: '#e0e0e0', face: 'Segoe UI' }},
    }},
    edges: {{
      smooth: {{ type: 'continuous' }},
      width: 0.5,
      arrows: {{ to: {{ scaleFactor: 0.4 }} }},
    }},
    interaction: {{ hover: true, tooltipDelay: 100, zoomView: true }},
  }});

  erdNetwork.on('click', function(params) {{
    if (params.nodes.length > 0) {{
      showERDDetail(params.nodes[0]);
    }}
  }});
}}

function showERDDetail(nodeId) {{
  const panel = document.getElementById('erd-detail');
  const content = document.getElementById('erd-detail-content');
  const attrs = db.v16Attrs[nodeId] || [];
  const entity = db.entities.find(e => e.name === nodeId) || {{}};

  let html = `<h4>${{nodeId.replace(/_/g,' ')}}</h4>`;
  html += `<p style="font-size:11px;color:#888">${{entity.domain || ''}} | ${{entity.rels || 0}} relationships</p>`;
  if (entity.parent) html += `<p style="font-size:11px;color:#FF9800">Inherits from: ${{entity.parent.replace(/_/g,' ')}}</p>`;
  if (entity.desc) html += `<p style="font-size:11px;color:#aaa;margin:6px 0">${{entity.desc}}</p>`;

  if (attrs.length) {{
    html += '<table class="attr-table" style="margin-top:8px"><thead><tr><th>Attribute</th><th>Type</th><th></th></tr></thead><tbody>';
    attrs.forEach(a => {{
      const pk = a.pk === 'Y' ? '<span class="pk-badge">PK</span>' : '';
      html += `<tr><td>${{a.n}}</td><td style="font-size:10px;color:#888">${{a.td}}</td><td>${{pk}}</td></tr>`;
    }});
    html += '</tbody></table>';
  }}
  content.innerHTML = html;
  panel.style.display = 'block';
}}

function filterERD() {{
  const domain = document.getElementById('erd-domain-filter').value;
  if (!erdAllNodes) return;
  const allNodes = erdAllNodes.get();
  const updates = allNodes.map(n => ({{
    id: n.id,
    hidden: domain && n.group !== domain
  }}));
  erdAllNodes.update(updates);
}}

function searchERD(e) {{
  if (e.key !== 'Enter') return;
  const q = document.getElementById('erd-search').value.toUpperCase().replace(/ /g, '_');
  if (!erdNetwork || !q) return;
  const allNodes = erdAllNodes.get();
  const match = allNodes.find(n => n.id.includes(q));
  if (match) {{
    erdNetwork.selectNodes([match.id]);
    erdNetwork.focus(match.id, {{ scale: 1.5, animation: true }});
    showERDDetail(match.id);
  }}
}}

function resetERD() {{
  if (!erdNetwork) return;
  document.getElementById('erd-domain-filter').value = '';
  document.getElementById('erd-search').value = '';
  const allNodes = erdAllNodes.get();
  erdAllNodes.update(allNodes.map(n => ({{ id: n.id, hidden: false }})));
  erdNetwork.fit({{ animation: true }});
}}

function togglePhysics() {{
  physicsEnabled = !physicsEnabled;
  if (erdNetwork) erdNetwork.setOptions({{ physics: {{ enabled: physicsEnabled }} }});
}}

function toggleInheritance() {{
  const show = document.getElementById('erd-inh-toggle').checked;
  if (!erdAllEdges) return;
  const allEdges = erdAllEdges.get();
  erdAllEdges.update(allEdges.filter(e => e.dashes).map(e => ({{ id: e.id, hidden: !show }})));
}}

// ── Inheritance Tree ──────────────────────────────────────────
let treeData = null;
let treeSvg = null;

function initTree() {{
  treeData = db.inheritance;
  if (!treeData || !treeData.length) return;

  // Sort by descendant count
  const sorted = [...treeData].sort((a, b) => countDescendants(b) - countDescendants(a));

  const sel = document.getElementById('tree-root-select');
  sel.innerHTML = '';
  sorted.forEach((t, i) => {{
    const name = t.name || t.entity || 'Unknown';
    const cnt = countDescendants(t);
    const o = document.createElement('option');
    o.value = i; o.textContent = name.replace(/_/g, ' ') + ' (' + cnt + ' subtypes)';
    sel.appendChild(o);
  }});
  document.getElementById('tree-count-badge').textContent = treeData.length + ' trees';
  renderTree();
}}

function countDescendants(node) {{
  if (!node.children || !node.children.length) return 0;
  return node.children.length + node.children.reduce((s, c) => s + countDescendants(c), 0);
}}

function renderTree() {{
  const sel = document.getElementById('tree-root-select');
  const idx = parseInt(sel.value) || 0;
  const sorted = [...treeData].sort((a, b) => countDescendants(b) - countDescendants(a));
  const root = sorted[idx];
  if (!root) return;

  const container = document.getElementById('tree-container');
  container.innerHTML = '';

  const margin = {{ top: 30, right: 120, bottom: 30, left: 120 }};
  const width = Math.max(container.clientWidth, 1200);
  const totalNodes = countDescendants(root) + 1;
  const height = Math.max(totalNodes * 28, 400);

  const svg = d3.select(container).append('svg')
    .attr('id', 'tree-svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${{margin.left}},${{margin.top}})`);

  const treeLayout = d3.tree().size([height, width - margin.left - margin.right]);
  const hierarchy = d3.hierarchy(root, d => d.children);
  treeLayout(hierarchy);

  // Links
  g.selectAll('.tree-link')
    .data(hierarchy.links())
    .join('path')
    .attr('class', 'tree-link')
    .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

  // Nodes
  const node = g.selectAll('.tree-node')
    .data(hierarchy.descendants())
    .join('g')
    .attr('class', 'tree-node')
    .attr('transform', d => `translate(${{d.y}},${{d.x}})`);

  // Lookup entity domain
  const entMap = {{}};
  db.entities.forEach(e => {{ entMap[e.name] = e; }});

  node.append('circle')
    .attr('r', 5)
    .attr('fill', d => {{
      const ent = entMap[d.data.name || d.data.entity] || {{}};
      return DOMAIN_COLORS[ent.domain] || '#64B5F6';
    }})
    .attr('stroke', d => {{
      const name = d.data.name || d.data.entity || '';
      return name in (window._profEntities || {{}}) ? '#FFD700' : '#1a1a2e';
    }});

  node.append('text')
    .attr('dy', '0.35em')
    .attr('x', d => d.children ? -10 : 10)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => (d.data.name || d.data.entity || '').replace(/_/g, ' '));

  treeSvg = svg;
}}

function expandAll() {{ renderTree(); }}
function collapseAll() {{
  const sel = document.getElementById('tree-root-select');
  const idx = parseInt(sel.value) || 0;
  const sorted = [...treeData].sort((a, b) => countDescendants(b) - countDescendants(a));
  const root = sorted[idx];
  if (!root) return;
  // Render with only first level
  const collapsed = {{ ...root, children: (root.children || []).map(c => ({{ name: c.name || c.entity, children: [] }})) }};
  const container = document.getElementById('tree-container');
  container.innerHTML = '';
  // Simple re-render with collapsed data
  const origChildren = root.children;
  root.children = collapsed.children;
  renderTree();
  root.children = origChildren;
}}

// ── Domain Browser ────────────────────────────────────────────
function initDomainBrowser() {{
  const dash = db.dashboard;

  // v16 domains
  const v16Grid = document.getElementById('v16-domain-grid');
  const domainMap = {{}};
  db.entities.forEach(e => {{
    if (e.domain && e.in_v16) {{
      if (!domainMap[e.domain]) domainMap[e.domain] = [];
      domainMap[e.domain].push(e);
    }}
  }});

  Object.entries(dash.v16_domains).sort((a,b) => b[1] - a[1]).forEach(([domain, count]) => {{
    const color = DOMAIN_COLORS[domain] || '#78909C';
    const ents = (domainMap[domain] || []).sort((a,b) => b.v16_attrs - a.v16_attrs);
    const top5 = ents.slice(0, 5).map(e => e.name.replace(/_/g, ' ')).join(', ');

    const card = document.createElement('div');
    card.className = 'domain-card';
    card.innerHTML = `
      <h4><span class="dot" style="background:${{color}}"></span><span style="color:${{color}}">${{domain}}</span></h4>
      <div class="count">${{count}}</div>
      <div class="entities-label">entities</div>
      <div style="font-size:10px;color:#666;margin-top:6px">${{top5}}</div>
      <div class="domain-entity-list" style="display:none"></div>
    `;
    card.onclick = function() {{
      const list = this.querySelector('.domain-entity-list');
      if (list.style.display === 'none') {{
        this.classList.add('expanded');
        let thtml = '<table><thead><tr><th>Entity</th><th>Attrs</th><th>Rels</th><th>Parent</th></tr></thead><tbody>';
        ents.forEach(e => {{
          thtml += `<tr><td>${{e.name.replace(/_/g,' ')}}</td><td>${{e.v16_attrs}}</td><td>${{e.rels}}</td><td>${{e.parent ? e.parent.replace(/_/g,' ') : '-'}}</td></tr>`;
        }});
        thtml += '</tbody></table>';
        list.innerHTML = thtml;
        list.style.display = 'block';
      }} else {{
        this.classList.remove('expanded');
        list.style.display = 'none';
      }}
    }};
    v16Grid.appendChild(card);
  }});

  // v13 subject areas
  const v13Grid = document.getElementById('v13-subject-grid');
  Object.entries(dash.v13_subject_areas).sort((a,b) => b[1] - a[1]).forEach(([sa, count]) => {{
    const card = document.createElement('div');
    card.className = 'domain-card';
    card.innerHTML = `
      <h4><span class="dot" style="background:#607D8B"></span><span style="color:#aaa">${{sa}}</span></h4>
      <div class="count">${{count}}</div>
      <div class="entities-label">entities</div>
    `;
    v13Grid.appendChild(card);
  }});
}}

// ── Profitability ─────────────────────────────────────────────
function initProfitability() {{
  const container = document.getElementById('star-schema-container');

  // Star schema visual layout
  const tables = [
    {{ name: 'FACT_CUSTOMER\\nPROFITABILITY', type: 'fact', x: 50, y: 35,
      cols: ['Customer_SK (FK)', 'Product_SK (FK)', 'Branch_SK (FK)', 'Segment_SK (FK)', 'Channel_SK (FK)',
             'Time_SK (FK)', 'Geography_SK (FK)', '---',
             'Interest_Income_Amt', 'Fee_Income_Amt', 'FTP_Amt', 'Direct_Cost_Amt',
             'Indirect_Cost_Amt', 'Provision_Cost_Amt', 'RWA_Amt', 'Net_Profit_Amt', 'RAROC_Pct'] }},
    {{ name: 'DIM_CUSTOMER', type: 'dim', x: 5, y: 5, cols: ['Customer_SK (PK)', 'Customer_Id', 'Customer_Name', 'Customer_Type_Cd', 'Segment_Cd'] }},
    {{ name: 'DIM_PRODUCT', type: 'dim', x: 35, y: 5, cols: ['Product_SK (PK)', 'Product_Id', 'Product_Name', 'Product_Type_Cd', 'Product_Line'] }},
    {{ name: 'DIM_BRANCH', type: 'dim', x: 65, y: 5, cols: ['Branch_SK (PK)', 'Branch_Id', 'Branch_Name', 'Region_Cd', 'City_Name'] }},
    {{ name: 'DIM_SEGMENT', type: 'dim', x: 5, y: 72, cols: ['Segment_SK (PK)', 'Segment_Id', 'Segment_Name', 'Segment_Type'] }},
    {{ name: 'DIM_CHANNEL', type: 'dim', x: 35, y: 72, cols: ['Channel_SK (PK)', 'Channel_Id', 'Channel_Name', 'Channel_Type'] }},
    {{ name: 'DIM_TIME', type: 'dim', x: 65, y: 72, cols: ['Time_SK (PK)', 'Calendar_Dt', 'Month', 'Quarter', 'Year'] }},
    {{ name: 'DIM_GEOGRAPHY', type: 'dim', x: 85, y: 35, cols: ['Geography_SK (PK)', 'Area_Name', 'Country', 'Region'] }},
  ];

  container.style.height = '560px';
  let html = '';
  tables.forEach(t => {{
    const cls = t.type === 'fact' ? 'fact' : 'dim';
    const colsHtml = t.cols.map(c => {{
      if (c === '---') return '<li style="border-top:1px solid #0f3460;margin:4px 0"></li>';
      if (c.includes('PK')) return `<li class="pk">${{c}}</li>`;
      if (c.includes('FK')) return `<li style="color:#FF9800">${{c}}</li>`;
      if (c.includes('Amt') || c.includes('Pct')) return `<li class="measure">${{c}}</li>`;
      return `<li>${{c}}</li>`;
    }}).join('');
    html += `<div class="schema-table ${{cls}}" style="left:${{t.x}}%;top:${{t.y}}%">
      <h5>${{t.name.replace(/\\n/g,'<br>')}}</h5>
      <ul>${{colsHtml}}</ul>
    </div>`;
  }});
  container.innerHTML = html;

  // Draw connector lines with SVG
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none';
  container.appendChild(svgEl);

  // Mark as rendered
  const marker = document.createElement('div');
  marker.id = 'star-rendered';
  marker.style.display = 'none';
  container.appendChild(marker);

  // Profitability mapping table
  const profData = db.profitability;
  if (profData && profData.length) {{
    const tData = profData.map(p => [
      p.Profitability_Measure || p.profitability_measure || '',
      p.FSDM_Entity || p.fsdm_entity || '',
      p.FSDM_Attribute || p.fsdm_attribute || '',
      p.Calculation || p.calculation || '',
      p.Notes || p.notes || ''
    ]);
    $('#prof-mapping-table').DataTable({{
      data: tData,
      pageLength: 50,
      ordering: false,
    }});
  }}

  // Calc framework
  document.getElementById('calc-framework-content').textContent = CALC_FRAMEWORK;
}}

// ── Data Dictionary ───────────────────────────────────────────
function initDataDict() {{
  const dd = db.dataDict;
  document.getElementById('dd-count-badge').textContent = dd.length.toLocaleString();

  // Classword filter
  const classwords = [...new Set(dd.map(a => a.cw).filter(Boolean))].sort();
  const cwSel = document.getElementById('dd-cw-filter');
  classwords.forEach(c => {{ const o = document.createElement('option'); o.value = c; o.textContent = c.replace('Classword_',''); cwSel.appendChild(o); }});

  const tData = dd.map(a => [a.e, a.a, a.cw ? a.cw.replace('Classword_','') : '', a.td, a.pk === 'Y' ? '<span class="pk-badge">PK</span>' : '', a.req, a.d, a.cw]);

  ddTable = $('#dd-table').DataTable({{
    data: tData,
    columns: [
      {{ title: 'Entity' }},
      {{ title: 'Attribute' }},
      {{ title: 'Classword' }},
      {{ title: 'Teradata Type' }},
      {{ title: 'PK', className: 'dt-center' }},
      {{ title: 'Req' }},
      {{ title: 'Description' }},
      {{ visible: false }} // raw classword for filtering
    ],
    pageLength: 50,
    deferRender: true,
  }});
}}

function filterDD() {{
  if (!ddTable) return;
  const cw = document.getElementById('dd-cw-filter').value;
  const pkOnly = document.getElementById('dd-pk-filter').checked;
  ddTable.column(7).search(cw);
  ddTable.column(4).search(pkOnly ? 'PK' : '');
  ddTable.draw();
}}

// ── Init ──────────────────────────────────────────────────────
window._profEntities = {{}};
{json.dumps(list(PROFITABILITY_ENTITIES))}.forEach(e => window._profEntities[e] = true);

async function init() {{
  console.log('FSDM Explorer: loading data...');

  // Decompress all data in parallel
  const [dashboard, entities, v16Attrs, v13Attrs, graphNodes, graphEdges, inheritance, dataDict, profitability] = await Promise.all([
    decompress(DATA.dashboard),
    decompress(DATA.entities),
    decompress(DATA.v16Attrs),
    decompress(DATA.v13Attrs),
    decompress(DATA.graphNodes),
    decompress(DATA.graphEdges),
    decompress(DATA.inheritance),
    decompress(DATA.dataDict),
    decompress(DATA.profitability),
  ]);

  db = {{ dashboard, entities, v16Attrs, v13Attrs, graphNodes, graphEdges, inheritance, dataDict, profitability }};
  console.log('FSDM Explorer: data loaded, initializing...');

  initDashboard();
  initDomainBrowser();

  console.log('FSDM Explorer: ready!');
}}

init();
</script>
</body>
</html>"""

    return html

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    log("=" * 70)
    log("FSDM Unified Visualizer v1.0")
    log("=" * 70)

    v13 = load_v13()
    v16 = load_v16()

    log("Preprocessing data...")
    dashboard = preprocess_dashboard(v13, v16)
    entities, v16_attrs, v13_attrs = preprocess_entities(v13, v16)
    log(f"  Merged entities: {len(entities)}")

    graph_nodes, graph_edges = preprocess_graph(v16)
    log(f"  ERD graph: {len(graph_nodes)} nodes, {len(graph_edges)} edges")

    inheritance_trees = preprocess_inheritance(v16)
    log(f"  Inheritance trees: {len(inheritance_trees)} root hierarchies")

    html = generate_html(dashboard, entities, v16_attrs, v13_attrs,
                         graph_nodes, graph_edges, inheritance_trees,
                         v16, DOMAIN_COLORS)

    os.makedirs(OUTPUT_PATH.parent, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    log(f"Written: {OUTPUT_PATH} ({size_mb:.1f} MB)")
    log("=" * 70)
    log("DONE! Open the HTML file in your browser.")
    log("=" * 70)

if __name__ == "__main__":
    main()
