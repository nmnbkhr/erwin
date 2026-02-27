#!/usr/bin/env python3
"""Phase 5: Visualizations - generates 5 HTML files"""

import json
import csv
import os

OUTPUT_DIR = "/mnt/e/erwin/bvf_output"


def load_data():
    """Load all Phase 1-4 outputs."""
    data = {}
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_capabilities.json")) as f:
        data["capabilities"] = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_parsed_data_requirements.json")) as f:
        data["data_requirements"] = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_reuse_matrix.json")) as f:
        data["reuse_matrix"] = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_to_fsdm_entity_map.json")) as f:
        data["entity_map"] = json.load(f)
    with open(os.path.join(OUTPUT_DIR, "bvf_implementation_priority.csv")) as f:
        data["priority"] = list(csv.DictReader(f))
    with open(os.path.join(OUTPUT_DIR, "profitability_data_coverage.json")) as f:
        data["coverage"] = json.load(f)

    # Load capability summary
    with open(os.path.join(OUTPUT_DIR, "capability_entity_summary.csv")) as f:
        data["cap_summary"] = list(csv.DictReader(f))

    return data


def build_heatmap(data):
    """5.1: Interactive capability × data requirement heatmap."""
    caps = data["capabilities"]
    drs = data["data_requirements"]

    # Build matrix
    cap_names = [c["name"] for c in caps]
    dr_names = [d["name"] for d in drs]

    # Build area groupings for capabilities
    cap_groups = {}
    for c in caps:
        area = c["bvf_area"] or "Unknown"
        sub = c["sub_area"] or "Unknown"
        key = f"{area} / {sub}"
        if key not in cap_groups:
            cap_groups[key] = []
        cap_groups[key].append(c["name"])

    # Build subject area groupings for data reqs
    dr_groups = {}
    for d in drs:
        sa = d["fsdm_subject_area"] or "Unknown"
        if sa not in dr_groups:
            dr_groups[sa] = []
        dr_groups[sa].append(d["name"])

    # Build mapping matrix
    cap_dr_map = {}
    for c in caps:
        cap_dr_map[c["name"]] = {
            "reqs": set(c["data_requirements"]),
            "outputs": set(c["output_data"]),
            "is_profit": any(kw in c["name"].lower() for kw in ["profitability", "p&l", "accounting hub", "costing", "transfer pricing", "capital", "pricing analysis", "asset & liability", "customer value", "lifetime value", "segmentation", "performance management"])
        }

    # Create cell data for JavaScript
    cells = []
    for ci, cn in enumerate(cap_names):
        for di, dn in enumerate(dr_names):
            if dn in cap_dr_map[cn]["reqs"]:
                typ = 2 if cap_dr_map[cn]["is_profit"] else 1
                cells.append([ci, di, typ])
            elif dn in cap_dr_map[cn]["outputs"]:
                cells.append([ci, di, 3])

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BVF Capability × Data Requirement Heatmap</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0e1a; color: #e0e0e0; }}
.header {{ background: linear-gradient(135deg, #1a1f3a, #0d1117); padding: 20px 30px; border-bottom: 1px solid #2a3050; }}
.header h1 {{ font-size: 22px; color: #58a6ff; }}
.header p {{ font-size: 13px; color: #8b949e; margin-top: 4px; }}
.controls {{ padding: 12px 30px; background: #111827; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; border-bottom: 1px solid #1e2740; }}
.controls label {{ font-size: 12px; color: #8b949e; }}
.controls select {{ background: #1a2332; color: #e0e0e0; border: 1px solid #2a3050; padding: 4px 8px; border-radius: 4px; font-size: 12px; }}
.legend {{ display: flex; gap: 20px; margin-left: auto; font-size: 12px; }}
.legend span {{ display: flex; align-items: center; gap: 4px; }}
.legend .swatch {{ width: 14px; height: 14px; border-radius: 2px; }}
.container {{ padding: 20px; overflow: auto; height: calc(100vh - 140px); }}
canvas {{ cursor: crosshair; }}
.tooltip {{ position: fixed; background: #1a2332; border: 1px solid #2a3050; border-radius: 6px; padding: 10px 14px; font-size: 12px; pointer-events: none; z-index: 100; display: none; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }}
.tooltip .cap {{ color: #58a6ff; font-weight: 600; }}
.tooltip .dr {{ color: #7ee787; }}
.tooltip .ent {{ color: #d2a8ff; font-size: 11px; }}
</style></head><body>
<div class="header">
<h1>BVF Capability × Data Requirement Heatmap</h1>
<p>{len(cap_names)} Capabilities × {len(dr_names)} Data Requirements | {len(cells)} mappings</p>
</div>
<div class="controls">
<div><label>BVF Area</label><br><select id="areaFilter"><option value="">All Areas</option></select></div>
<div><label>Subject Area</label><br><select id="saFilter"><option value="">All Subject Areas</option></select></div>
<div><label>Filter</label><br><select id="profitFilter"><option value="">All</option><option value="profit">Profitability-Critical Only</option></select></div>
<div class="legend">
<span><div class="swatch" style="background:#2563eb"></div> Standard</span>
<span><div class="swatch" style="background:#dc2626"></div> Profitability-Critical</span>
<span><div class="swatch" style="background:#16a34a"></div> OUTPUT</span>
</div>
</div>
<div class="container"><canvas id="heatmap"></canvas></div>
<div class="tooltip" id="tooltip"></div>
<script>
const capNames = {json.dumps(cap_names)};
const drNames = {json.dumps(dr_names)};
const cells = {json.dumps(cells)};
const capGroups = {json.dumps(cap_groups)};
const drGroups = {json.dumps(dr_groups)};
const entityMap = {json.dumps({dr["name"]: [e["entity"] for e in data["entity_map"].get(dr["name"], {}).get("entities", [])[:5]] for dr in drs})};

// Populate filters
const areaFilter = document.getElementById('areaFilter');
Object.keys(capGroups).forEach(k => {{ const o = document.createElement('option'); o.value = k; o.textContent = k; areaFilter.appendChild(o); }});
const saFilter = document.getElementById('saFilter');
Object.keys(drGroups).forEach(k => {{ const o = document.createElement('option'); o.value = k; o.textContent = k; saFilter.appendChild(o); }});

const canvas = document.getElementById('heatmap');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const cellSize = 6;
const marginLeft = 10;
const marginTop = 10;

let visibleCaps = [...Array(capNames.length).keys()];
let visibleDrs = [...Array(drNames.length).keys()];

function render() {{
    const w = marginLeft + visibleDrs.length * cellSize + 20;
    const h = marginTop + visibleCaps.length * cellSize + 20;
    canvas.width = Math.max(w, 800);
    canvas.height = Math.max(h, 400);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const capSet = new Set(visibleCaps);
    const drSet = new Set(visibleDrs);
    const capIdx = {{}};
    visibleCaps.forEach((c, i) => capIdx[c] = i);
    const drIdx = {{}};
    visibleDrs.forEach((d, i) => drIdx[d] = i);

    const colors = ['', '#2563eb', '#dc2626', '#16a34a'];
    cells.forEach(([ci, di, typ]) => {{
        if (!capSet.has(ci) || !drSet.has(di)) return;
        const x = marginLeft + drIdx[di] * cellSize;
        const y = marginTop + capIdx[ci] * cellSize;
        ctx.fillStyle = colors[typ];
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
    }});
}}

function applyFilters() {{
    const area = areaFilter.value;
    const sa = saFilter.value;
    const profitOnly = document.getElementById('profitFilter').value === 'profit';

    if (area) {{
        const grouped = capGroups[area] || [];
        visibleCaps = capNames.map((n, i) => grouped.includes(n) ? i : -1).filter(i => i >= 0);
    }} else {{
        visibleCaps = [...Array(capNames.length).keys()];
    }}
    if (profitOnly) {{
        visibleCaps = visibleCaps.filter(i => cells.some(c => c[0] === i && c[2] === 2));
    }}
    if (sa) {{
        const grouped = drGroups[sa] || [];
        visibleDrs = drNames.map((n, i) => grouped.includes(n) ? i : -1).filter(i => i >= 0);
    }} else {{
        visibleDrs = [...Array(drNames.length).keys()];
    }}
    render();
}}

areaFilter.onchange = saFilter.onchange = document.getElementById('profitFilter').onchange = applyFilters;

canvas.onmousemove = (e) => {{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const di = Math.floor((x - marginLeft) / cellSize);
    const ci = Math.floor((y - marginTop) / cellSize);
    if (di >= 0 && di < visibleDrs.length && ci >= 0 && ci < visibleCaps.length) {{
        const capI = visibleCaps[ci];
        const drI = visibleDrs[di];
        const cn = capNames[capI];
        const dn = drNames[drI];
        const ents = entityMap[dn] || [];
        tooltip.innerHTML = `<div class="cap">${{cn}}</div><div class="dr">${{dn}}</div><div class="ent">FSDM: ${{ents.join(', ')}}</div>`;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    }} else {{
        tooltip.style.display = 'none';
    }}
}};
canvas.onmouseleave = () => tooltip.style.display = 'none';
render();
</script></body></html>"""

    path = os.path.join(OUTPUT_DIR, "bvf_capability_heatmap.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"  [11] Saved: {path}")


def build_sankey(data):
    """5.2: BVF → FSDM Sankey diagram."""
    caps = data["capabilities"]
    drs = data["data_requirements"]
    entity_map = data["entity_map"]

    # Build nodes and links
    nodes = []
    node_idx = {}
    links = []

    def add_node(name, group):
        if name not in node_idx:
            node_idx[name] = len(nodes)
            nodes.append({"name": name, "group": group})
        return node_idx[name]

    # Level 1: BVF Areas
    areas = {}
    for c in caps:
        area = c["bvf_area"] or "Unknown"
        sub = c["sub_area"] or "Unknown"
        if area not in areas:
            areas[area] = {}
        if sub not in areas[area]:
            areas[area][sub] = []
        areas[area][sub].append(c)

    area_colors = {
        "Marketing and Customer Experience": "#2563eb",
        "Risk Management & Regulation": "#dc2626",
        "Finance & Peformance Management": "#16a34a"
    }

    # Build links: Area → Sub-area → Data Requirement → FSDM Subject Area
    link_map = {}
    for area, subs in areas.items():
        area_idx = add_node(area, "area")
        for sub, sub_caps in subs.items():
            sub_idx = add_node(f"{sub} ({area[:3]})", "sub_area")
            link_key = (area_idx, sub_idx)
            link_map[link_key] = link_map.get(link_key, 0) + len(sub_caps)

            for c in sub_caps:
                for dr_name in c["data_requirements"] + c["output_data"]:
                    dr_idx = add_node(dr_name, "data_req")
                    lk2 = (sub_idx, dr_idx)
                    link_map[lk2] = link_map.get(lk2, 0) + 1

                    # DR → FSDM Subject Area
                    for d in drs:
                        if d["name"] == dr_name and d["fsdm_subject_area"]:
                            sa_idx = add_node(d["fsdm_subject_area"], "fsdm_sa")
                            lk3 = (dr_idx, sa_idx)
                            link_map[lk3] = link_map.get(lk3, 0) + 1
                            break

    links = [{"source": s, "target": t, "value": max(v, 1)} for (s, t), v in link_map.items()]

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BVF → FSDM Sankey Flow</title>
<style>
body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0e1a; color: #e0e0e0; margin: 0; }}
.header {{ background: linear-gradient(135deg, #1a1f3a, #0d1117); padding: 20px 30px; border-bottom: 1px solid #2a3050; }}
.header h1 {{ font-size: 22px; color: #58a6ff; }}
.header p {{ font-size: 13px; color: #8b949e; margin-top: 4px; }}
svg {{ width: 100%; height: calc(100vh - 80px); }}
.node rect {{ cursor: pointer; }}
.node text {{ font-size: 10px; fill: #e0e0e0; }}
.link {{ fill: none; stroke-opacity: 0.25; }}
.link:hover {{ stroke-opacity: 0.55; }}
</style>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js"></script>
</head><body>
<div class="header">
<h1>BVF → FSDM Sankey Flow Diagram</h1>
<p>BVF Areas → Sub-areas → Data Requirements → FSDM Subject Areas</p>
</div>
<svg id="sankey"></svg>
<script>
const nodesData = {json.dumps(nodes)};
const linksData = {json.dumps(links)};
const areaColors = {json.dumps(area_colors)};

const svg = d3.select('#sankey');
const width = window.innerWidth;
const height = window.innerHeight - 80;
svg.attr('viewBox', `0 0 ${{width}} ${{height}}`);

const sankey = d3.sankey()
    .nodeWidth(18)
    .nodePadding(4)
    .extent([[20, 20], [width - 20, height - 20]]);

const graph = sankey({{
    nodes: nodesData.map(d => ({{...d}})),
    links: linksData.map(d => ({{...d}}))
}});

const groupColors = {{area: '#58a6ff', sub_area: '#7ee787', data_req: '#d2a8ff', fsdm_sa: '#f0883e'}};

svg.append('g').selectAll('.link')
    .data(graph.links).join('path')
    .attr('class', 'link')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke', d => groupColors[d.source.group] || '#555')
    .attr('stroke-width', d => Math.max(1, d.width));

const node = svg.append('g').selectAll('.node')
    .data(graph.nodes).join('g')
    .attr('class', 'node');

node.append('rect')
    .attr('x', d => d.x0).attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => Math.max(1, d.y1 - d.y0))
    .attr('fill', d => groupColors[d.group] || '#555');

node.append('text')
    .attr('x', d => d.x0 < width / 2 ? d.x1 + 4 : d.x0 - 4)
    .attr('y', d => (d.y0 + d.y1) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
    .text(d => d.name.length > 35 ? d.name.slice(0, 32) + '...' : d.name)
    .style('font-size', '9px');
</script></body></html>"""

    path = os.path.join(OUTPUT_DIR, "bvf_fsdm_sankey.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"  [12] Saved: {path}")


def build_profitability_lineage(data):
    """5.3: Profitability lineage diagram."""
    coverage = data["coverage"]

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Profitability Measure Lineage</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0e1a; color: #e0e0e0; }}
.header {{ background: linear-gradient(135deg, #1a1f3a, #0d1117); padding: 20px 30px; border-bottom: 1px solid #2a3050; }}
.header h1 {{ font-size: 22px; color: #58a6ff; }}
.header p {{ font-size: 13px; color: #8b949e; margin-top: 4px; }}
.content {{ padding: 20px 30px; display: flex; flex-wrap: wrap; gap: 16px; }}
.table-card {{ background: #111827; border: 1px solid #1e2740; border-radius: 8px; padding: 16px; flex: 1; min-width: 350px; max-width: 600px; }}
.table-card h2 {{ font-size: 16px; color: #58a6ff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }}
.table-card h2 .badge {{ background: #1e3a5f; color: #58a6ff; font-size: 11px; padding: 2px 8px; border-radius: 10px; }}
.measure {{ padding: 8px 12px; margin: 4px 0; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background 0.2s; }}
.measure:hover {{ background: #1a2332; }}
.measure .name {{ font-weight: 600; color: #e0e0e0; }}
.measure .detail {{ margin-top: 4px; color: #8b949e; font-size: 11px; }}
.measure .entities {{ color: #d2a8ff; }}
.measure .drs {{ color: #7ee787; }}
.measure .caps {{ color: #f0883e; }}
.status-FULL {{ border-left: 3px solid #16a34a; }}
.status-PARTIAL {{ border-left: 3px solid #f59e0b; }}
.status-GAP {{ border-left: 3px solid #dc2626; }}
.summary {{ background: #111827; border: 1px solid #1e2740; border-radius: 8px; padding: 20px; width: 100%; display: flex; gap: 30px; justify-content: center; margin-bottom: 10px; }}
.stat {{ text-align: center; }}
.stat .val {{ font-size: 32px; font-weight: 700; color: #58a6ff; }}
.stat .lbl {{ font-size: 12px; color: #8b949e; }}
</style></head><body>
<div class="header">
<h1>Profitability Measure Data Lineage</h1>
<p>Star Schema ← FSDM Entities ← BVF Data Requirements ← BVF Capabilities</p>
</div>
<div class="content">
<div class="summary">
<div class="stat"><div class="val">{coverage['coverage_summary']['total_measures']}</div><div class="lbl">Total Measures</div></div>
<div class="stat"><div class="val" style="color:#16a34a">{coverage['coverage_summary']['fully_covered']}</div><div class="lbl">Fully Covered</div></div>
<div class="stat"><div class="val" style="color:#f59e0b">{coverage['coverage_summary']['partially_covered']}</div><div class="lbl">Partially Covered</div></div>
<div class="stat"><div class="val" style="color:#dc2626">{coverage['coverage_summary']['gaps']}</div><div class="lbl">Gaps</div></div>
<div class="stat"><div class="val">{coverage['coverage_summary']['coverage_pct']}%</div><div class="lbl">Coverage Rate</div></div>
</div>
"""

    for table_name, table_info in coverage["star_schema_tables"].items():
        badge_color = "#2563eb" if table_info["type"] == "FACT" else "#7c3aed"
        html += f"""<div class="table-card">
<h2>{table_name} <span class="badge" style="background:{badge_color}30;color:{badge_color}">{table_info['type']}</span></h2>
"""
        for col_name, col_info in table_info["columns"].items():
            status = col_info["coverage_status"]
            ents = ", ".join(col_info["fsdm_entities"]) if col_info["fsdm_entities"] else "—"
            dr_list = ", ".join(col_info["bvf_data_requirements"]) if col_info["bvf_data_requirements"] else "—"
            cap_list = ", ".join(col_info["bvf_capabilities"]) if col_info["bvf_capabilities"] else "—"
            html += f"""<div class="measure status-{status}">
<div class="name">{col_name} <span style="font-size:10px;color:#555">Tier {col_info['implementation_tier']}</span></div>
<div class="detail">
<div class="entities">FSDM: {ents}</div>
<div class="drs">Data Reqs: {dr_list}</div>
<div class="caps">Capabilities: {cap_list}</div>
</div></div>
"""
        html += "</div>\n"

    html += "</div></body></html>"

    path = os.path.join(OUTPUT_DIR, "profitability_lineage.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"  [13] Saved: {path}")


def build_reuse_network(data):
    """5.4: Capability reuse network graph."""
    reuse = data["reuse_matrix"]
    caps = data["capabilities"]

    # Build nodes and edges
    nodes = []
    cap_info = {}
    for c in caps:
        cap_info[c["name"]] = {
            "area": c["bvf_area"],
            "dr_count": c["data_req_count"],
            "is_profit": any(kw in c["name"].lower() for kw in ["profitability", "p&l", "accounting hub", "costing", "transfer pricing", "capital", "pricing analysis", "asset & liability", "customer value", "lifetime value", "segmentation", "performance management"])
        }

    area_colors = {
        "Marketing and Customer Experience": "#2563eb",
        "Risk Management & Regulation": "#dc2626",
        "Finance & Peformance Management": "#16a34a"
    }

    for i, c in enumerate(caps):
        info = cap_info.get(c["name"], {})
        nodes.append({
            "id": i,
            "name": c["name"],
            "area": c["bvf_area"],
            "color": area_colors.get(c["bvf_area"], "#666"),
            "size": max(3, info.get("dr_count", 5) / 3),
            "profit": info.get("is_profit", False)
        })

    cap_name_to_idx = {c["name"]: i for i, c in enumerate(caps)}
    edges = []
    for cap_name, partners in reuse.items():
        if cap_name not in cap_name_to_idx:
            continue
        src = cap_name_to_idx[cap_name]
        for partner, coeff in partners.items():
            if partner not in cap_name_to_idx:
                continue
            tgt = cap_name_to_idx[partner]
            if src < tgt and coeff > 0.3:
                edges.append({"source": src, "target": tgt, "value": round(coeff, 3)})

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Capability Reuse Network</title>
<style>
body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0e1a; color: #e0e0e0; margin: 0; }}
.header {{ background: linear-gradient(135deg, #1a1f3a, #0d1117); padding: 20px 30px; border-bottom: 1px solid #2a3050; }}
.header h1 {{ font-size: 22px; color: #58a6ff; }}
.header p {{ font-size: 13px; color: #8b949e; margin-top: 4px; }}
.controls {{ padding: 10px 30px; background: #111827; border-bottom: 1px solid #1e2740; display: flex; align-items: center; gap: 16px; font-size: 12px; }}
.controls input {{ width: 150px; }}
.legend {{ display: flex; gap: 16px; margin-left: auto; }}
.legend span {{ display: flex; align-items: center; gap: 4px; }}
.legend .dot {{ width: 12px; height: 12px; border-radius: 50%; }}
svg {{ width: 100%; height: calc(100vh - 120px); }}
.tooltip {{ position: fixed; background: #1a2332; border: 1px solid #2a3050; border-radius: 6px; padding: 10px; font-size: 12px; pointer-events: none; z-index: 100; display: none; }}
</style>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head><body>
<div class="header">
<h1>Capability Data Reuse Network</h1>
<p>{len(nodes)} capabilities | {len(edges)} connections (reuse > 0.3)</p>
</div>
<div class="controls">
<label>Reuse Threshold:</label>
<input type="range" id="threshold" min="10" max="90" value="30">
<span id="threshVal">0.30</span>
<div class="legend">
<span><div class="dot" style="background:#2563eb"></div> Marketing</span>
<span><div class="dot" style="background:#dc2626"></div> Risk</span>
<span><div class="dot" style="background:#16a34a"></div> Finance</span>
<span><div class="dot" style="background:transparent;border:2px solid #f59e0b;width:10px;height:10px"></div> Profitability-Critical</span>
</div>
</div>
<svg id="network"></svg>
<div class="tooltip" id="tooltip"></div>
<script>
const nodes = {json.dumps(nodes)};
const allEdges = {json.dumps(edges)};
let threshold = 0.3;

const svg = d3.select('#network');
const width = window.innerWidth;
const height = window.innerHeight - 120;
svg.attr('viewBox', `0 0 ${{width}} ${{height}}`);

const linkGroup = svg.append('g');
const nodeGroup = svg.append('g');
const tooltip = document.getElementById('tooltip');

const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink().id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-60))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.size + 2));

function update() {{
    const edges = allEdges.filter(e => e.value >= threshold);
    simulation.force('link').links(edges);

    const link = linkGroup.selectAll('line').data(edges, d => d.source.id + '-' + d.target.id);
    link.exit().remove();
    const linkEnter = link.enter().append('line')
        .attr('stroke', '#333').attr('stroke-width', d => d.value * 2).attr('stroke-opacity', 0.4);

    const node = nodeGroup.selectAll('circle').data(nodes, d => d.id);
    node.exit().remove();
    const nodeEnter = node.enter().append('circle')
        .attr('r', d => d.size)
        .attr('fill', d => d.color)
        .attr('stroke', d => d.profit ? '#f59e0b' : 'none')
        .attr('stroke-width', d => d.profit ? 2 : 0)
        .call(d3.drag().on('start', dragstart).on('drag', dragged).on('end', dragend))
        .on('mouseover', (e, d) => {{
            tooltip.innerHTML = `<strong style="color:${{d.color}}">${{d.name}}</strong><br>Area: ${{d.area}}<br>Data Reqs: ${{Math.round(d.size * 3)}}${{d.profit ? '<br><span style="color:#f59e0b">Profitability-Critical</span>' : ''}}`;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top = (e.clientY + 12) + 'px';
        }})
        .on('mouseout', () => tooltip.style.display = 'none');

    simulation.alpha(0.3).restart();
    simulation.on('tick', () => {{
        linkGroup.selectAll('line')
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeGroup.selectAll('circle')
            .attr('cx', d => d.x = Math.max(10, Math.min(width - 10, d.x)))
            .attr('cy', d => d.y = Math.max(10, Math.min(height - 10, d.y)));
    }});
}}

function dragstart(e, d) {{ if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }}
function dragged(e, d) {{ d.fx = e.x; d.fy = e.y; }}
function dragend(e, d) {{ if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }}

document.getElementById('threshold').oninput = function() {{
    threshold = this.value / 100;
    document.getElementById('threshVal').textContent = threshold.toFixed(2);
    update();
}};

update();
</script></body></html>"""

    path = os.path.join(OUTPUT_DIR, "bvf_reuse_network.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"  [14] Saved: {path}")


def build_implementation_roadmap(data):
    """5.5: Implementation roadmap."""
    priority = data["priority"]
    caps = data["capabilities"]
    entity_map = data["entity_map"]

    # Group by tier
    tiers = {"Tier 1 (Must Have)": [], "Tier 2 (Should Have)": [], "Tier 3 (Nice to Have)": [], "Tier 4 (Future)": []}
    for row in priority:
        tier = row["Implementation_Tier"]
        tiers.setdefault(tier, []).append(row)

    # Calculate cumulative stats
    all_caps_set = set()
    cum_caps = []
    cum_entities = []
    total_ent = 0
    for tier_name in ["Tier 1 (Must Have)", "Tier 2 (Should Have)", "Tier 3 (Nice to Have)", "Tier 4 (Future)"]:
        for row in tiers.get(tier_name, []):
            dr_name = row["BVF_Data_Requirement"]
            for c in caps:
                if dr_name in c["data_requirements"] or dr_name in c["output_data"]:
                    all_caps_set.add(c["name"])
            total_ent += int(row.get("FSDM_Entity_Count", 0))
        cum_caps.append(len(all_caps_set))
        cum_entities.append(total_ent)

    tier_colors = ["#2563eb", "#7c3aed", "#f59e0b", "#6b7280"]
    tier_labels = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Implementation Roadmap</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0e1a; color: #e0e0e0; }}
.header {{ background: linear-gradient(135deg, #1a1f3a, #0d1117); padding: 20px 30px; border-bottom: 1px solid #2a3050; }}
.header h1 {{ font-size: 22px; color: #58a6ff; }}
.header p {{ font-size: 13px; color: #8b949e; margin-top: 4px; }}
.content {{ padding: 20px 30px; }}
.summary-bar {{ display: flex; gap: 4px; margin-bottom: 20px; height: 40px; border-radius: 6px; overflow: hidden; }}
.summary-bar div {{ display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }}
.cum-chart {{ display: flex; gap: 30px; margin-bottom: 20px; }}
.cum-card {{ background: #111827; border: 1px solid #1e2740; border-radius: 8px; padding: 16px; flex: 1; text-align: center; }}
.cum-card .val {{ font-size: 28px; font-weight: 700; color: #58a6ff; }}
.cum-card .lbl {{ font-size: 12px; color: #8b949e; }}
.cum-card .bar {{ height: 6px; border-radius: 3px; background: #1e2740; margin-top: 8px; }}
.cum-card .bar-fill {{ height: 100%; border-radius: 3px; transition: width 0.5s; }}
.tier {{ background: #111827; border: 1px solid #1e2740; border-radius: 8px; padding: 16px; margin-bottom: 16px; }}
.tier h2 {{ font-size: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }}
.tier h2 .badge {{ font-size: 11px; padding: 2px 10px; border-radius: 10px; }}
.tier-items {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }}
.tier-item {{ padding: 8px 12px; background: #0d1117; border-radius: 4px; font-size: 12px; display: flex; justify-content: space-between; }}
.tier-item .score {{ color: #8b949e; }}
</style></head><body>
<div class="header">
<h1>BVF Implementation Roadmap</h1>
<p>113 Data Requirements across 4 implementation tiers | Prioritized for Profitability Engine</p>
</div>
<div class="content">
<div class="summary-bar">"""

    total = len(priority)
    for i, (tier_name, items) in enumerate(tiers.items()):
        pct = len(items) / total * 100
        html += f'<div style="background:{tier_colors[i]};width:{pct}%">{tier_labels[i]}: {len(items)}</div>'

    html += """</div><div class="cum-chart">"""
    for i, (tier_name, cum_c, cum_e) in enumerate(zip(["Tier 1", "Tier 2", "Tier 3", "Tier 4"], cum_caps, cum_entities)):
        cap_pct = round(cum_c / 112 * 100)
        html += f"""<div class="cum-card">
<div class="val">{cum_c}</div>
<div class="lbl">Capabilities Enabled after {tier_name}</div>
<div class="bar"><div class="bar-fill" style="width:{cap_pct}%;background:{tier_colors[i]}"></div></div>
<div class="lbl" style="margin-top:4px">{cap_pct}% of 112 | {cum_e} entities</div>
</div>"""

    html += "</div>"

    for i, (tier_name, items) in enumerate(tiers.items()):
        html += f"""<div class="tier">
<h2><span class="badge" style="background:{tier_colors[i]}30;color:{tier_colors[i]}">{tier_name}</span> {len(items)} data requirements</h2>
<div class="tier-items">"""
        for item in items:
            html += f"""<div class="tier-item"><span>{item['BVF_Data_Requirement']}</span><span class="score">Score: {item['Priority_Score']}</span></div>"""
        html += "</div></div>"

    html += "</div></body></html>"

    path = os.path.join(OUTPUT_DIR, "implementation_roadmap.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"  [15] Saved: {path}")


def main():
    print("=" * 70)
    print("Phase 5: Visualizations")
    print("=" * 70)

    data = load_data()

    print("\n--- Building heatmap ---")
    build_heatmap(data)

    print("--- Building Sankey ---")
    build_sankey(data)

    print("--- Building profitability lineage ---")
    build_profitability_lineage(data)

    print("--- Building reuse network ---")
    build_reuse_network(data)

    print("--- Building implementation roadmap ---")
    build_implementation_roadmap(data)

    print("\nPhase 5 complete!")


if __name__ == "__main__":
    main()
