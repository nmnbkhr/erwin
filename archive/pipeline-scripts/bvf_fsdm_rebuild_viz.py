#!/usr/bin/env python3
"""
Rebuild all BVF-FSDM visualizations as self-contained HTML.
No CDN dependencies - uses inline Canvas/SVG rendering.
"""

import csv
import json
import os
from collections import defaultdict

OUTPUT_DIR = "/mnt/e/erwin/bvf_fsdm_output"


def load_csv(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ═══════════════════════════════════════════════════════
# VIZ 1: DATA REUSE HEATMAP (Canvas-based, no CDN)
# ═══════════════════════════════════════════════════════

def generate_reuse_heatmap():
    print("Generating self-contained reuse heatmap...")

    matrix_data = load_csv("bvf_reuse_matrix.csv")
    labels = [row["Sub_Capability"] for row in matrix_data]
    themes = [row["Theme"] for row in matrix_data]

    z_data = []
    for row in matrix_data:
        z_row = []
        for label in labels:
            val = row.get(label, "")
            try:
                z_row.append(round(float(val), 3))
            except (ValueError, TypeError):
                z_row.append(0)
        z_data.append(z_row)

    # Theme boundaries
    boundaries = []
    current = None
    for i, t in enumerate(themes):
        if t != current:
            boundaries.append(i)
            current = t

    html = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>BVF Data Reuse Heatmap</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; }
  .container { max-width: 1500px; margin: 0 auto; background: white; border-radius: 10px;
               box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; }
  h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
  .legend-bar { display: flex; align-items: center; gap: 8px; margin: 12px 0; font-size: 12px; color: #555; }
  .gradient-bar { width: 200px; height: 14px; border-radius: 3px;
                  background: linear-gradient(to right, #8b0000, #cc2200, #e06000, #e8a000, #c8d820, #60b030, #1a8c1a); }
  .theme-legend { display: flex; gap: 16px; margin: 8px 0 16px; font-size: 12px; }
  .theme-legend span { padding: 3px 10px; border-radius: 4px; color: white; font-weight: 500; }
  .wrap { position: relative; overflow: auto; max-height: 85vh; }
  canvas { display: block; }
  #tooltip { position: fixed; background: rgba(20,20,40,0.95); color: #eee; padding: 10px 14px;
             border-radius: 6px; font-size: 12px; pointer-events: none; display: none;
             z-index: 999; max-width: 350px; line-height: 1.5; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  #tooltip b { color: #7cb5ec; }
  #tooltip .val { font-size: 18px; font-weight: bold; color: #fff; }
</style>
</head><body>
<div class="container">
  <h1>BVF Data Reuse Matrix &mdash; Heatmap</h1>
  <p class="subtitle">Cross-capability data reuse coefficients (0 = no overlap, 1 = identical data needs). Hover for details.</p>
  <div class="legend-bar">
    <span>0.0</span><div class="gradient-bar"></div><span>1.0</span>
    <span style="margin-left:12px;color:#999">Reuse Coefficient</span>
  </div>
  <div class="theme-legend">
    <span style="background:#1f77b4">Marketing &amp; CX (0-38)</span>
    <span style="background:#ff7f0e">Risk Management (39-80)</span>
    <span style="background:#2ca02c">Finance &amp; Performance (81-111)</span>
  </div>
  <div class="wrap">
    <canvas id="heatmap"></canvas>
  </div>
</div>
<div id="tooltip"></div>

<script>
const labels = LABELS_PLACEHOLDER;
const themes = THEMES_PLACEHOLDER;
const zData = ZDATA_PLACEHOLDER;
const boundaries = BOUNDS_PLACEHOLDER;
const n = labels.length;

const cellSize = 7;
const margin = { top: 180, left: 220, right: 30, bottom: 30 };
const w = margin.left + n * cellSize + margin.right;
const h = margin.top + n * cellSize + margin.bottom;

const canvas = document.getElementById('heatmap');
const dpr = window.devicePixelRatio || 1;
canvas.width = w * dpr;
canvas.height = h * dpr;
canvas.style.width = w + 'px';
canvas.style.height = h + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

// Color interpolation
function getColor(v) {
  const stops = [
    [0.0,  139,   0,   0],   // dark red
    [0.15, 204,  34,   0],   // red
    [0.3,  224,  96,   0],   // red-orange
    [0.45, 232, 160,   0],   // orange
    [0.55, 200, 216,  32],   // yellow-green
    [0.7,  120, 190,  40],   // light green
    [0.85,  50, 160,  30],   // green
    [1.0,   26, 140,  26]    // deep green
  ];
  v = Math.max(0, Math.min(1, v));
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i][0] && v <= stops[i+1][0]) {
      const t = (v - stops[i][0]) / (stops[i+1][0] - stops[i][0]);
      const r = Math.round(stops[i][1] + t * (stops[i+1][1] - stops[i][1]));
      const g = Math.round(stops[i][2] + t * (stops[i+1][2] - stops[i][2]));
      const b = Math.round(stops[i][3] + t * (stops[i+1][3] - stops[i][3]));
      return `rgb(${r},${g},${b})`;
    }
  }
  return 'rgb(8,48,107)';
}

// Draw heatmap cells
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    ctx.fillStyle = getColor(zData[i][j]);
    ctx.fillRect(margin.left + j * cellSize, margin.top + i * cellSize, cellSize, cellSize);
  }
}

// Theme boundary lines
const themeColors = ['#1f77b4', '#ff7f0e', '#2ca02c'];
ctx.lineWidth = 2;
for (let k = 1; k < boundaries.length; k++) {
  const b = boundaries[k];
  ctx.strokeStyle = themeColors[k] || '#e74c3c';
  ctx.setLineDash([4, 3]);
  // Vertical
  ctx.beginPath();
  ctx.moveTo(margin.left + b * cellSize, margin.top);
  ctx.lineTo(margin.left + b * cellSize, margin.top + n * cellSize);
  ctx.stroke();
  // Horizontal
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top + b * cellSize);
  ctx.lineTo(margin.left + n * cellSize, margin.top + b * cellSize);
  ctx.stroke();
}
ctx.setLineDash([]);

// Diagonal line
ctx.strokeStyle = 'rgba(255,255,255,0.3)';
ctx.lineWidth = 0.5;
ctx.beginPath();
ctx.moveTo(margin.left, margin.top);
ctx.lineTo(margin.left + n * cellSize, margin.top + n * cellSize);
ctx.stroke();

// Labels (every 3rd to avoid overlap)
ctx.fillStyle = '#333';
ctx.font = '8px Segoe UI, Arial';
ctx.textAlign = 'right';
for (let i = 0; i < n; i += 3) {
  const lbl = labels[i].length > 28 ? labels[i].substring(0, 26) + '..' : labels[i];
  ctx.fillText(lbl, margin.left - 4, margin.top + i * cellSize + cellSize);
}
ctx.save();
ctx.textAlign = 'left';
for (let j = 0; j < n; j += 3) {
  ctx.save();
  ctx.translate(margin.left + j * cellSize + cellSize / 2, margin.top - 4);
  ctx.rotate(-Math.PI / 3);
  const lbl = labels[j].length > 28 ? labels[j].substring(0, 26) + '..' : labels[j];
  ctx.fillText(lbl, 0, 0);
  ctx.restore();
}
ctx.restore();

// Tooltip
const tooltip = document.getElementById('tooltip');
canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor((x - margin.left) / cellSize);
  const row = Math.floor((y - margin.top) / cellSize);

  if (col >= 0 && col < n && row >= 0 && row < n) {
    const val = zData[row][col];
    tooltip.innerHTML = `<b>${labels[row]}</b><br>vs<br><b>${labels[col]}</b><br><br><span class="val">${val.toFixed(2)}</span> reuse coefficient`;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY - 10) + 'px';
  } else {
    tooltip.style.display = 'none';
  }
});
canvas.addEventListener('mouseleave', function() {
  tooltip.style.display = 'none';
});
</script>
</body></html>"""

    html = html.replace("LABELS_PLACEHOLDER", json.dumps(labels))
    html = html.replace("THEMES_PLACEHOLDER", json.dumps(themes))
    html = html.replace("ZDATA_PLACEHOLDER", json.dumps(z_data))
    html = html.replace("BOUNDS_PLACEHOLDER", json.dumps(boundaries))

    path = os.path.join(OUTPUT_DIR, "data_reuse_heatmap.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path} ({os.path.getsize(path):,} bytes)")


# ═══════════════════════════════════════════════════════
# VIZ 2: SANKEY DIAGRAM (Pure SVG, no CDN)
# ═══════════════════════════════════════════════════════

def generate_sankey():
    print("Generating self-contained Sankey diagram...")

    deps = load_csv("capability_fsdm_dependencies.csv")

    # Aggregate Theme -> Capability Group
    theme_cap = defaultdict(int)
    cap_sa = defaultdict(int)

    for row in deps:
        theme_cap[(row["Theme"], row["Capability"])] += 1
        cap_sa[(row["Capability"], row["FSDM_Subject_Area"])] += 1

    # Unique nodes
    themes_list = sorted(set(t for t, c in theme_cap))
    caps_list = sorted(set(c for t, c in theme_cap))
    sa_list = sorted(set(s for c, s in cap_sa))

    theme_colors = {
        "Marketing and Customer Experience": "#1f77b4",
        "Risk Management & Regulation": "#ff7f0e",
        "Finance & Peformance Management": "#2ca02c",
    }
    cap_color = "#9467bd"
    sa_color = "#d62728"

    # Layout: 3 columns
    col_x = [50, 450, 900]
    svg_w = 1200
    row_gap = [8, 5, 6]

    # Compute y positions
    def layout_nodes(items, x, gap, max_height=800):
        total = sum(items.values()) if isinstance(items, dict) else len(items)
        nodes = {}
        y = 40
        for name in items:
            val = items[name] if isinstance(items, dict) else 1
            h = max(18, val * 0.6)
            nodes[name] = {"x": x, "y": y, "h": h, "val": val}
            y += h + gap
        # Scale if needed
        if y > max_height:
            scale = max_height / y
            for n in nodes:
                nodes[n]["y"] *= scale
                nodes[n]["h"] *= scale
        return nodes

    theme_vals = {t: sum(v for (t2, c), v in theme_cap.items() if t2 == t) for t in themes_list}
    cap_vals = {c: sum(v for (t, c2), v in theme_cap.items() if c2 == c) for c in caps_list}
    sa_vals = {s: sum(v for (c, s2), v in cap_sa.items() if s2 == s) for s in sa_list}

    t_nodes = layout_nodes(theme_vals, col_x[0], row_gap[0])
    c_nodes = layout_nodes(cap_vals, col_x[1], row_gap[1])
    s_nodes = layout_nodes(sa_vals, col_x[2], row_gap[2])

    svg_h = max(
        max(n["y"] + n["h"] for n in t_nodes.values()),
        max(n["y"] + n["h"] for n in c_nodes.values()),
        max(n["y"] + n["h"] for n in s_nodes.values()),
    ) + 60

    bar_w = 18

    # Build SVG
    paths = []
    # Theme -> Capability links
    t_offsets = {t: 0 for t in themes_list}
    c_offsets_l = {c: 0 for c in caps_list}
    for (t, c), v in sorted(theme_cap.items(), key=lambda x: -x[1]):
        tn = t_nodes[t]
        cn = c_nodes[c]
        h = max(2, v * 0.4)
        sy = tn["y"] + t_offsets[t]
        ey = cn["y"] + c_offsets_l[c]
        t_offsets[t] += h
        c_offsets_l[c] += h
        color = theme_colors.get(t, "#999")
        sx = col_x[0] + bar_w
        ex = col_x[1]
        mx = (sx + ex) / 2
        paths.append(f'<path d="M{sx},{sy+h/2} C{mx},{sy+h/2} {mx},{ey+h/2} {ex},{ey+h/2}" '
                      f'stroke="{color}" stroke-opacity="0.35" stroke-width="{h}" fill="none"/>')

    # Capability -> Subject Area links
    c_offsets_r = {c: 0 for c in caps_list}
    s_offsets = {s: 0 for s in sa_list}
    for (c, s), v in sorted(cap_sa.items(), key=lambda x: -x[1]):
        cn = c_nodes[c]
        sn = s_nodes[s]
        h = max(1.5, v * 0.25)
        sy = cn["y"] + c_offsets_r[c]
        ey = sn["y"] + s_offsets[s]
        c_offsets_r[c] += h
        s_offsets[s] += h
        sx = col_x[1] + bar_w
        ex = col_x[2]
        mx = (sx + ex) / 2
        paths.append(f'<path d="M{sx},{sy+h/2} C{mx},{sy+h/2} {mx},{ey+h/2} {ex},{ey+h/2}" '
                      f'stroke="{cap_color}" stroke-opacity="0.2" stroke-width="{h}" fill="none"/>')

    # Node rects + labels
    rects = []
    for t, n in t_nodes.items():
        color = theme_colors.get(t, "#999")
        rects.append(f'<rect x="{n["x"]}" y="{n["y"]}" width="{bar_w}" height="{n["h"]}" fill="{color}" rx="3"/>')
        rects.append(f'<text x="{n["x"]-5}" y="{n["y"]+n["h"]/2+4}" text-anchor="end" font-size="10" fill="#333">{t[:35]}</text>')
    for c, n in c_nodes.items():
        rects.append(f'<rect x="{n["x"]}" y="{n["y"]}" width="{bar_w}" height="{n["h"]}" fill="{cap_color}" rx="3"/>')
        label = c[:30]
        rects.append(f'<text x="{n["x"]+bar_w+4}" y="{n["y"]+n["h"]/2+3}" font-size="8" fill="#555">{label}</text>')
    for s, n in s_nodes.items():
        rects.append(f'<rect x="{n["x"]}" y="{n["y"]}" width="{bar_w}" height="{n["h"]}" fill="{sa_color}" rx="3" opacity="0.8"/>')
        rects.append(f'<text x="{n["x"]+bar_w+4}" y="{n["y"]+n["h"]/2+3}" font-size="9" fill="#333">{s}</text>')

    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>BVF to FSDM Sankey</title>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; margin: 0; }}
  .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 10px;
               box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; }}
  h1 {{ color: #1a1a2e; font-size: 22px; margin-bottom: 4px; }}
  .subtitle {{ color: #666; font-size: 13px; margin-bottom: 8px; }}
  .cols {{ display: flex; justify-content: space-between; margin: 8px 0 12px; }}
  .col-label {{ font-size: 12px; font-weight: 600; color: #444; padding: 4px 12px; border-radius: 4px; }}
  svg {{ width: 100%; height: auto; }}
</style>
</head><body>
<div class="container">
  <h1>BVF-to-FSDM Sankey Diagram</h1>
  <p class="subtitle">Flow: Business Value Themes &rarr; Capability Groups &rarr; FSDM Subject Areas</p>
  <div class="cols">
    <span class="col-label" style="background:#e8f0fe">BVF Themes (3)</span>
    <span class="col-label" style="background:#f3e8ff">Capability Groups (12)</span>
    <span class="col-label" style="background:#fde8e8">FSDM Subject Areas ({len(sa_list)})</span>
  </div>
  <svg viewBox="0 0 {svg_w} {int(svg_h)}" xmlns="http://www.w3.org/2000/svg">
    {''.join(paths)}
    {''.join(rects)}
  </svg>
</div>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "bvf_fsdm_sankey.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path} ({os.path.getsize(path):,} bytes)")


# ═══════════════════════════════════════════════════════
# VIZ 3: PROFITABILITY DATA FLOW (Pure SVG)
# ═══════════════════════════════════════════════════════

def generate_data_flow():
    print("Generating self-contained data flow diagram...")

    layers = [
        {"title": "Source Systems", "color": "#1f77b4", "items": [
            "Core Banking (CTL)", "Credit Risk Engine", "Treasury / ALM",
            "General Ledger", "Channel Systems", "CRM / Party Master",
        ]},
        {"title": "FSDM Entities", "color": "#ff7f0e", "items": [
            "AGREEMENT_SUMMARY", "MONETARY_TRANSACTION",
            "AGREEMENT_RISK_METRIC", "INTEREST_RATE",
            "GL_MAIN_ACCOUNT", "CHANNEL_USAGE_METRIC",
            "PARTY", "INDIVIDUAL", "ORGANIZATION",
            "PRODUCT", "CURRENCY_EXCHANGE_RATE",
            "PARTY_CLASSIFICATION", "RISK_GRADE_VALUE",
        ]},
        {"title": "Star Schema", "color": "#2ca02c", "items": [
            "FACT_CUSTOMER_PROFITABILITY",
            "DIM_CUSTOMER", "DIM_PRODUCT", "DIM_BRANCH",
            "DIM_AGREEMENT", "DIM_TIME", "DIM_CHANNEL",
            "AGG_BRANCH_PROFITABILITY",
        ]},
        {"title": "Profitability Measures", "color": "#d62728", "items": [
            "Net Interest Income (NII)", "Fee & Commission Income",
            "Total Cost (ABC)", "Provision Expense (ECL)",
            "RAROC", "Cost-to-Income Ratio", "ROE", "NIM",
        ]},
    ]

    # Connections
    connections = [
        (0,0, 1,0), (0,0, 1,1),  # Core Banking -> AGREEMENT_SUMMARY, MONETARY_TXN
        (0,1, 1,2),               # Credit Risk -> AGREEMENT_RISK_METRIC
        (0,2, 1,3), (0,2, 1,10), # Treasury -> INTEREST_RATE, CURRENCY_EXCHANGE
        (0,3, 1,4),               # GL -> GL_MAIN_ACCOUNT
        (0,4, 1,5),               # Channel -> CHANNEL_USAGE
        (0,5, 1,6), (0,5, 1,7), (0,5, 1,11), # CRM -> PARTY, INDIVIDUAL, CLASSIFICATION
        (1,0, 2,0), (1,1, 2,0), (1,2, 2,0), (1,3, 2,0), (1,4, 2,0), (1,5, 2,0), # -> FACT
        (1,6, 2,1), (1,7, 2,1), (1,11, 2,1),  # -> DIM_CUSTOMER
        (1,9, 2,2),               # PRODUCT -> DIM_PRODUCT
        (1,8, 2,3),               # ORGANIZATION -> DIM_BRANCH
        (1,0, 2,4),               # AGREEMENT_SUMMARY -> DIM_AGREEMENT
        (2,0, 3,0), (2,0, 3,1), (2,0, 3,2), (2,0, 3,3), # FACT -> measures
        (2,0, 3,4), (2,0, 3,5), (2,0, 3,6), (2,0, 3,7),
    ]

    col_x = [30, 300, 620, 920]
    item_h = 32
    gap = 6
    svg_w = 1200
    bar_w = 14

    def get_y(layer_idx, item_idx):
        return 60 + item_idx * (item_h + gap)

    max_y = max(60 + len(l["items"]) * (item_h + gap) for l in layers) + 40

    svg_parts = []

    # Draw connections first (behind nodes)
    for (l1, i1, l2, i2) in connections:
        x1 = col_x[l1] + 200
        y1 = get_y(l1, i1) + item_h / 2
        x2 = col_x[l2]
        y2 = get_y(l2, i2) + item_h / 2
        mx = (x1 + x2) / 2
        c = layers[l1]["color"]
        svg_parts.append(f'<path d="M{x1},{y1} C{mx},{y1} {mx},{y2} {x2},{y2}" '
                          f'stroke="{c}" stroke-opacity="0.2" stroke-width="3" fill="none"/>')

    # Draw nodes
    for li, layer in enumerate(layers):
        # Column header
        svg_parts.append(f'<text x="{col_x[li]+100}" y="38" text-anchor="middle" '
                          f'font-size="13" font-weight="bold" fill="{layer["color"]}">{layer["title"]}</text>')
        for ii, item in enumerate(layer["items"]):
            y = get_y(li, ii)
            svg_parts.append(
                f'<rect x="{col_x[li]}" y="{y}" width="200" height="{item_h}" '
                f'fill="{layer["color"]}" fill-opacity="0.12" stroke="{layer["color"]}" '
                f'stroke-width="1.5" rx="5"/>'
                f'<text x="{col_x[li]+100}" y="{y+item_h/2+4}" text-anchor="middle" '
                f'font-size="9" fill="#333">{item}</text>'
            )

    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Profitability Data Flow</title>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; margin: 0; }}
  .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 10px;
               box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; }}
  h1 {{ color: #1a1a2e; font-size: 22px; margin-bottom: 4px; }}
  .subtitle {{ color: #666; font-size: 13px; margin-bottom: 16px; }}
  svg {{ width: 100%; height: auto; }}
</style>
</head><body>
<div class="container">
  <h1>Customer Profitability Engine &mdash; Data Flow</h1>
  <p class="subtitle">Source Systems &rarr; FSDM Entities &rarr; Star Schema Tables &rarr; Profitability Measures</p>
  <svg viewBox="0 0 {svg_w} {int(max_y)}" xmlns="http://www.w3.org/2000/svg">
    {''.join(svg_parts)}
  </svg>
</div>
</body></html>"""

    path = os.path.join(OUTPUT_DIR, "profitability_data_flow.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path} ({os.path.getsize(path):,} bytes)")


# ═══════════════════════════════════════════════════════
# VIZ 5: FSDM ENTITY COVERAGE HEATMAP (Binary 1/0)
# Entity rows x Capability columns, red/green
# ═══════════════════════════════════════════════════════

def generate_coverage_heatmap():
    """Binary heatmap: FSDM Entities (rows) x BVF Sub-Capabilities (columns). 1=used, 0=not."""
    print("Generating FSDM entity coverage heatmap...")

    deps = load_csv("capability_fsdm_dependencies.csv")

    # Build binary matrix: entity -> set of sub-capabilities
    entity_caps = defaultdict(set)
    cap_entities = defaultdict(set)
    cap_themes = {}

    all_caps_ordered = []
    seen_caps = set()

    for row in deps:
        sub_cap = row["Sub_Capability"]
        theme = row["Theme"]
        entities_str = row["FSDM_Entities"]
        if not entities_str or entities_str == "Not mapped":
            continue

        if sub_cap not in seen_caps:
            all_caps_ordered.append(sub_cap)
            seen_caps.add(sub_cap)
            cap_themes[sub_cap] = theme

        for ent in entities_str.split("; "):
            ent = ent.strip()
            if ent:
                entity_caps[ent].add(sub_cap)
                cap_entities[sub_cap].add(ent)

    # Sort entities by coverage count (most used first)
    entities_sorted = sorted(entity_caps.keys(), key=lambda e: -len(entity_caps[e]))

    # Filter: only entities used by 5+ capabilities (keeps it readable)
    entities_filtered = [e for e in entities_sorted if len(entity_caps[e]) >= 5]
    if len(entities_filtered) > 120:
        entities_filtered = entities_filtered[:120]

    n_ent = len(entities_filtered)
    n_cap = len(all_caps_ordered)

    # Build binary matrix
    z_data = []
    coverage_counts = []
    for ent in entities_filtered:
        row = []
        for cap in all_caps_ordered:
            row.append(1 if cap in entity_caps[ent] else 0)
        z_data.append(row)
        coverage_counts.append(len(entity_caps[ent]))

    # Capability coverage (how many entities each cap uses)
    cap_coverage = [len(cap_entities.get(c, set())) for c in all_caps_ordered]

    # Theme boundaries for capabilities
    theme_bounds = []
    current_theme = None
    for i, cap in enumerate(all_caps_ordered):
        t = cap_themes.get(cap, "")
        if t != current_theme:
            theme_bounds.append({"idx": i, "theme": t})
            current_theme = t

    # Theme color index for top bar
    theme_color_map = {
        "Marketing and Customer Experience": 0,
        "Risk Management & Regulation": 1,
        "Finance & Peformance Management": 2,
    }
    cap_theme_indices = [theme_color_map.get(cap_themes.get(c, ""), 3) for c in all_caps_ordered]

    html = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>FSDM Entity Coverage Matrix</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; }
  .container { max-width: 1600px; margin: 0 auto; background: white; border-radius: 10px;
               box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; }
  h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 10px; }
  .stats { display: flex; gap: 24px; margin: 10px 0; font-size: 13px; }
  .stat { background: #f8f9fa; padding: 8px 16px; border-radius: 6px; border-left: 4px solid; }
  .legend-row { display: flex; gap: 16px; align-items: center; margin: 10px 0 16px; font-size: 12px; }
  .legend-row .swatch { width: 18px; height: 14px; border-radius: 2px; display: inline-block; }
  .theme-legend { display: flex; gap: 14px; margin: 6px 0 12px; font-size: 11px; }
  .theme-legend span { padding: 2px 8px; border-radius: 3px; color: white; font-weight: 500; }
  .wrap { position: relative; overflow: auto; max-height: 82vh; border: 1px solid #e0e0e0; border-radius: 4px; }
  canvas { display: block; }
  #tooltip { position: fixed; background: rgba(20,20,40,0.95); color: #eee; padding: 10px 14px;
             border-radius: 6px; font-size: 12px; pointer-events: none; display: none;
             z-index: 999; max-width: 380px; line-height: 1.6; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  #tooltip b { color: #7cb5ec; }
  #tooltip .used { color: #2ecc71; font-weight: bold; font-size: 14px; }
  #tooltip .notused { color: #e74c3c; font-weight: bold; font-size: 14px; }
</style>
</head><body>
<div class="container">
  <h1>FSDM Entity &times; BVF Capability &mdash; Coverage Matrix</h1>
  <p class="subtitle">Binary mapping: green = entity is used by capability, red = not used. Sorted by total coverage (most-used entities at top).</p>
  <div class="stats">
    <div class="stat" style="border-color:#2ca02c">FSDM_ENTITIES entities (rows)</div>
    <div class="stat" style="border-color:#1f77b4">N_CAP capabilities (columns)</div>
    <div class="stat" style="border-color:#ff7f0e">TOTAL_ONES active mappings</div>
  </div>
  <div class="legend-row">
    <span><span class="swatch" style="background:#1a8c1a"></span> Used (1)</span>
    <span><span class="swatch" style="background:#8b0000"></span> Not used (0)</span>
    <span style="margin-left:20px; color:#999">| Right bar = entity coverage count | Bottom bar = capability entity count</span>
  </div>
  <div class="theme-legend">
    <span style="background:#1f77b4">Marketing &amp; CX</span>
    <span style="background:#ff7f0e">Risk Management</span>
    <span style="background:#2ca02c">Finance &amp; Performance</span>
  </div>
  <div class="wrap">
    <canvas id="coverage"></canvas>
  </div>
</div>
<div id="tooltip"></div>

<script>
const entities = ENTITIES_PLACEHOLDER;
const caps = CAPS_PLACEHOLDER;
const zData = ZDATA_PLACEHOLDER;
const coverageCounts = COVERAGE_COUNTS_PLACEHOLDER;
const capCoverage = CAP_COVERAGE_PLACEHOLDER;
const capThemeIdx = CAP_THEME_PLACEHOLDER;
const themeBounds = THEME_BOUNDS_PLACEHOLDER;

const nEnt = entities.length;
const nCap = caps.length;
const cellW = 7;
const cellH = 7;
const margin = { top: 200, left: 220, right: 90, bottom: 80 };
const w = margin.left + nCap * cellW + margin.right;
const h = margin.top + nEnt * cellH + margin.bottom;

const canvas = document.getElementById('coverage');
const dpr = window.devicePixelRatio || 1;
canvas.width = w * dpr;
canvas.height = h * dpr;
canvas.style.width = w + 'px';
canvas.style.height = h + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

const greenUsed = 'rgb(26,140,26)';
const redNotUsed = 'rgb(139,0,0)';
const bgZero = 'rgb(50,10,10)';

// Draw cells
for (let i = 0; i < nEnt; i++) {
  for (let j = 0; j < nCap; j++) {
    ctx.fillStyle = zData[i][j] === 1 ? greenUsed : bgZero;
    ctx.fillRect(margin.left + j * cellW, margin.top + i * cellH, cellW - 0.5, cellH - 0.5);
  }
}

// Theme color bar at top
const themeColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#999'];
for (let j = 0; j < nCap; j++) {
  ctx.fillStyle = themeColors[capThemeIdx[j]];
  ctx.fillRect(margin.left + j * cellW, margin.top - 12, cellW - 0.5, 10);
}

// Theme boundary lines
ctx.lineWidth = 1.5;
ctx.setLineDash([3, 3]);
for (let k = 1; k < themeBounds.length; k++) {
  const b = themeBounds[k].idx;
  ctx.strokeStyle = themeColors[k] || '#fff';
  ctx.beginPath();
  ctx.moveTo(margin.left + b * cellW, margin.top - 12);
  ctx.lineTo(margin.left + b * cellW, margin.top + nEnt * cellH);
  ctx.stroke();
}
ctx.setLineDash([]);

// Right side: coverage count bar chart
const maxCov = Math.max(...coverageCounts);
for (let i = 0; i < nEnt; i++) {
  const barW = (coverageCounts[i] / maxCov) * 60;
  const pct = coverageCounts[i] / nCap;
  // Color: red->green based on coverage %
  const r = Math.round(139 + (26 - 139) * pct);
  const g = Math.round(0 + 140 * pct);
  ctx.fillStyle = `rgb(${r},${g},0)`;
  ctx.fillRect(margin.left + nCap * cellW + 8, margin.top + i * cellH, barW, cellH - 0.5);
}
// Bar label
ctx.fillStyle = '#666';
ctx.font = '9px Segoe UI';
ctx.save();
ctx.translate(margin.left + nCap * cellW + 40, margin.top - 4);
ctx.rotate(-Math.PI / 6);
ctx.fillText('Coverage Count', 0, 0);
ctx.restore();

// Bottom: capability entity count bar chart
const maxCapCov = Math.max(...capCoverage);
for (let j = 0; j < nCap; j++) {
  const barH = (capCoverage[j] / maxCapCov) * 50;
  const pct = capCoverage[j] / nEnt;
  const r = Math.round(139 + (26 - 139) * Math.min(pct * 3, 1));
  const g = Math.round(0 + 140 * Math.min(pct * 3, 1));
  ctx.fillStyle = `rgb(${r},${g},0)`;
  ctx.fillRect(margin.left + j * cellW, margin.top + nEnt * cellH + 6, cellW - 0.5, barH);
}

// Row labels (entity names)
ctx.fillStyle = '#333';
ctx.font = '8px Segoe UI, Arial';
ctx.textAlign = 'right';
for (let i = 0; i < nEnt; i += 2) {
  const lbl = entities[i].length > 30 ? entities[i].substring(0, 28) + '..' : entities[i];
  ctx.fillText(lbl, margin.left - 4, margin.top + i * cellH + cellH);
}

// Column labels (capability names, rotated)
ctx.textAlign = 'left';
for (let j = 0; j < nCap; j += 3) {
  ctx.save();
  ctx.translate(margin.left + j * cellW + cellW / 2, margin.top - 16);
  ctx.rotate(-Math.PI / 3);
  const lbl = caps[j].length > 30 ? caps[j].substring(0, 28) + '..' : caps[j];
  ctx.fillStyle = themeColors[capThemeIdx[j]];
  ctx.fillText(lbl, 0, 0);
  ctx.restore();
}

// Tooltip
const tooltip = document.getElementById('tooltip');
canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor((x - margin.left) / cellW);
  const row = Math.floor((y - margin.top) / cellH);

  if (col >= 0 && col < nCap && row >= 0 && row < nEnt) {
    const val = zData[row][col];
    const statusHtml = val === 1
      ? '<span class="used">USED</span>'
      : '<span class="notused">NOT USED</span>';
    tooltip.innerHTML =
      '<b>' + entities[row] + '</b><br>' +
      '&times; ' + caps[col] + '<br><br>' +
      statusHtml + '<br><br>' +
      'Entity coverage: ' + coverageCounts[row] + '/' + nCap + ' capabilities<br>' +
      'Capability uses: ' + capCoverage[col] + ' entities';
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY - 10) + 'px';
  } else {
    tooltip.style.display = 'none';
  }
});
canvas.addEventListener('mouseleave', function() {
  tooltip.style.display = 'none';
});
</script>
</body></html>"""

    total_ones = sum(sum(r) for r in z_data)
    html = html.replace("ENTITIES_PLACEHOLDER", json.dumps(entities_filtered))
    html = html.replace("CAPS_PLACEHOLDER", json.dumps(all_caps_ordered))
    html = html.replace("ZDATA_PLACEHOLDER", json.dumps(z_data))
    html = html.replace("COVERAGE_COUNTS_PLACEHOLDER", json.dumps(coverage_counts))
    html = html.replace("CAP_COVERAGE_PLACEHOLDER", json.dumps(cap_coverage))
    html = html.replace("CAP_THEME_PLACEHOLDER", json.dumps(cap_theme_indices))
    html = html.replace("THEME_BOUNDS_PLACEHOLDER", json.dumps(theme_bounds))
    html = html.replace("FSDM_ENTITIES", str(n_ent))
    html = html.replace("N_CAP", str(n_cap))
    html = html.replace("TOTAL_ONES", str(total_ones))

    path = os.path.join(OUTPUT_DIR, "fsdm_entity_coverage.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {path} ({os.path.getsize(path):,} bytes)")
    print(f"     {n_ent} entities x {n_cap} capabilities, {total_ones} active cells")


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Rebuilding visualizations (self-contained, no CDN)...")
    print("=" * 50)
    generate_reuse_heatmap()
    generate_sankey()
    generate_data_flow()
    generate_coverage_heatmap()
    # ERD is already pure SVG/CSS - no rebuild needed
    print("\nDone! All visualizations are self-contained.")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith(".html"):
            sz = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f"  {f:45s} {sz:>10,} bytes")
