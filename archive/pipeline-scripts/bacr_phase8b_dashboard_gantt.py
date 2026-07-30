#!/usr/bin/env python3
"""Phase 8b: Visualizations - Profitability Dashboard + Implementation Gantt"""

import json
import os

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'

with open(os.path.join(OUTPUT_DIR, 'profitability_maturity_profile.json')) as f:
    prof_profile = json.load(f)['profitability_maturity']
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json')) as f:
    bacr_bvf = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'enhanced_implementation_priority.csv')) as f:
    import csv
    priority_rows = list(csv.DictReader(f))

# ============================================================
# 8.3 Profitability Maturity Dashboard
# ============================================================
print("Building profitability_maturity_dashboard.html...")

# Component data for gauges
components = prof_profile['components']
comp_names = []
comp_current = []
comp_target = []
comp_gaps = []
for k, v in components.items():
    comp_names.append(v['label'])
    comp_current.append(v['current_avg'])
    comp_target.append(v['target_avg'])
    comp_gaps.append(v['gap'])

# Critical gaps for bar chart
critical_gaps = prof_profile['critical_gaps']
gap_names = [g['capability'][:30] for g in critical_gaps]
gap_values = [g['gap'] for g in critical_gaps]
gap_components = [g['profitability_component'] for g in critical_gaps]

# Implementation phases for timeline
phases = prof_profile['implementation_sequence']

# Top priority capabilities
top_priority = priority_rows[:20]
prio_names = [r['Capability'][:35] for r in top_priority]
prio_scores = [float(r['Enhanced_Priority_Score']) for r in top_priority]
prio_colors = []
for r in top_priority:
    if r['Is_Profitability_Critical'] == 'True':
        prio_colors.append('#C00000')
    elif 'Tier 1' in r['Implementation_Tier']:
        prio_colors.append('#ED7D31')
    else:
        prio_colors.append('#4472C4')

dashboard_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Profitability Maturity Dashboard - UBL</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
* {{ box-sizing: border-box; }}
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }}
h1 {{ color: #2F5496; text-align: center; margin-bottom: 5px; }}
.subtitle {{ text-align: center; color: #666; margin-bottom: 25px; }}
.grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; }}
.card {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
.card h2 {{ color: #2F5496; font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #D6E4F0; padding-bottom: 8px; }}
.full-width {{ grid-column: 1 / -1; }}
.gauge-grid {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }}
.gauge {{ text-align: center; }}
.gauge-value {{ font-size: 32px; font-weight: bold; }}
.gauge-label {{ font-size: 11px; color: #666; margin-top: 4px; }}
.gauge-bar {{ height: 8px; border-radius: 4px; background: #eee; margin: 8px 10px; position: relative; }}
.gauge-fill {{ height: 100%; border-radius: 4px; position: absolute; left: 0; top: 0; }}
.overall-score {{ text-align: center; padding: 20px; }}
.overall-score .big {{ font-size: 48px; font-weight: bold; color: #2F5496; }}
.overall-score .target {{ font-size: 18px; color: #70AD47; }}
.overall-score .gap {{ font-size: 16px; color: #C00000; margin-top: 5px; }}
.phase-timeline {{ display: flex; gap: 0; margin-top: 15px; }}
.phase-box {{ flex: 1; padding: 12px; text-align: center; color: white; position: relative; }}
.phase-box h3 {{ margin: 0 0 5px 0; font-size: 13px; }}
.phase-box p {{ margin: 2px 0; font-size: 11px; opacity: 0.9; }}
.phase-box .effort {{ font-weight: bold; font-size: 12px; }}
.p1 {{ background: #4472C4; border-radius: 8px 0 0 8px; }}
.p2 {{ background: #ED7D31; }}
.p3 {{ background: #A5A5A5; }}
.p4 {{ background: #FFC000; border-radius: 0 8px 8px 0; color: #333; }}
.arrow {{ position: absolute; right: -10px; top: 50%; transform: translateY(-50%); z-index: 1;
         width: 0; height: 0; border-top: 12px solid transparent; border-bottom: 12px solid transparent; }}
.p1 .arrow {{ border-left: 10px solid #4472C4; }}
.p2 .arrow {{ border-left: 10px solid #ED7D31; }}
.p3 .arrow {{ border-left: 10px solid #A5A5A5; }}
.legend {{ display: flex; gap: 15px; justify-content: center; margin-top: 10px; font-size: 12px; }}
.legend-dot {{ display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }}
</style>
</head>
<body>
<h1>Profitability Engine Maturity Dashboard</h1>
<p class="subtitle">United Bank Limited &mdash; BACR Assessment × BVF × FSDM Integration</p>

<div class="grid">

<!-- Overall Score -->
<div class="card">
    <h2>Overall Profitability Maturity</h2>
    <div class="overall-score">
        <div class="big">{prof_profile['overall_score']}<span style="font-size:24px;color:#888">/5</span></div>
        <div class="target">Target: {prof_profile['overall_target']}/5</div>
        <div class="gap">Gap: {prof_profile['overall_gap']}</div>
    </div>
</div>

<!-- Component Gauges -->
<div class="card">
    <h2>Component Maturity Scores</h2>
    <div class="gauge-grid">
"""

gauge_colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5']
for i, (name, current, target, gap) in enumerate(zip(comp_names, comp_current, comp_target, comp_gaps)):
    color = gauge_colors[i % len(gauge_colors)]
    pct = (current / 5.0) * 100
    dashboard_html += f"""
        <div class="gauge">
            <div class="gauge-value" style="color:{color}">{current}</div>
            <div class="gauge-bar">
                <div class="gauge-fill" style="width:{pct}%;background:{color}"></div>
            </div>
            <div class="gauge-label">{name}<br>Gap: {gap}</div>
        </div>
    """

dashboard_html += """
    </div>
</div>

<!-- Capability Gaps Bar Chart -->
<div class="card">
    <h2>Top Capability Gaps (by Profitability Impact)</h2>
    <canvas id="gapChart" height="250"></canvas>
</div>

<!-- Priority Bar Chart -->
<div class="card">
    <h2>Top 20 Implementation Priorities</h2>
    <canvas id="priorityChart" height="250"></canvas>
    <div class="legend">
        <span><span class="legend-dot" style="background:#C00000"></span>Profitability Critical</span>
        <span><span class="legend-dot" style="background:#ED7D31"></span>Tier 1</span>
        <span><span class="legend-dot" style="background:#4472C4"></span>Other</span>
    </div>
</div>

<!-- Implementation Timeline -->
<div class="card full-width">
    <h2>Implementation Phases - Profitability Engine Build</h2>
    <div class="phase-timeline">
"""

phase_classes = ['p1', 'p2', 'p3', 'p4']
for i, p in enumerate(phases):
    cls = phase_classes[i] if i < len(phase_classes) else 'p4'
    caps = '<br>'.join(f"• {c[:40]}" for c in p['capabilities'][:4])
    arrow = '<div class="arrow"></div>' if i < len(phases) - 1 else ''
    dashboard_html += f"""
        <div class="phase-box {cls}">
            <h3>Phase {p['phase']}: {p['name']}</h3>
            <p style="font-size:10px;text-align:left">{caps}</p>
            <p class="effort">Effort: {p['estimated_effort']}</p>
            <p>Enables: {p['enables'][:60]}</p>
            {arrow}
        </div>
    """

dashboard_html += f"""
    </div>
</div>

<!-- Sankey-style flow (simplified) -->
<div class="card full-width">
    <h2>Data Flow: BACR Questions &rarr; BVF Capabilities &rarr; Profitability Measures</h2>
    <canvas id="flowChart" height="200"></canvas>
</div>

</div>

<script>
// Gap chart
new Chart(document.getElementById('gapChart'), {{
    type: 'bar',
    data: {{
        labels: {json.dumps(gap_names)},
        datasets: [{{
            label: 'Maturity Gap',
            data: {json.dumps(gap_values)},
            backgroundColor: {json.dumps(gap_values)}.map(v => v >= 3 ? '#C00000' : v >= 2 ? '#ED7D31' : '#FFC000'),
            borderRadius: 4
        }}]
    }},
    options: {{
        indexAxis: 'y',
        responsive: true,
        plugins: {{ legend: {{ display: false }} }},
        scales: {{ x: {{ min: 0, max: 4, title: {{ display: true, text: 'Gap (Desired - Current)' }} }} }}
    }}
}});

// Priority chart
new Chart(document.getElementById('priorityChart'), {{
    type: 'bar',
    data: {{
        labels: {json.dumps(prio_names)},
        datasets: [{{
            label: 'Enhanced Priority Score',
            data: {json.dumps(prio_scores)},
            backgroundColor: {json.dumps(prio_colors)},
            borderRadius: 4
        }}]
    }},
    options: {{
        indexAxis: 'y',
        responsive: true,
        plugins: {{ legend: {{ display: false }} }},
        scales: {{ x: {{ title: {{ display: true, text: 'Enhanced Priority Score' }} }} }}
    }}
}});

// Flow chart (simplified stacked bar)
const flowData = {{
    'Revenue': {{ bacr: 15, bvf: 5, measures: 4 }},
    'Cost': {{ bacr: 12, bvf: 4, measures: 3 }},
    'Risk-Adjusted': {{ bacr: 18, bvf: 7, measures: 5 }},
    'Treasury': {{ bacr: 14, bvf: 7, measures: 4 }},
    'Reporting': {{ bacr: 16, bvf: 7, measures: 5 }}
}};
const flowLabels = Object.keys(flowData);
new Chart(document.getElementById('flowChart'), {{
    type: 'bar',
    data: {{
        labels: flowLabels,
        datasets: [
            {{ label: 'BACR Questions', data: flowLabels.map(k => flowData[k].bacr), backgroundColor: '#4472C4' }},
            {{ label: 'BVF Capabilities', data: flowLabels.map(k => flowData[k].bvf), backgroundColor: '#ED7D31' }},
            {{ label: 'Star Schema Measures', data: flowLabels.map(k => flowData[k].measures), backgroundColor: '#70AD47' }}
        ]
    }},
    options: {{
        responsive: true,
        plugins: {{ legend: {{ position: 'bottom' }} }},
        scales: {{ y: {{ title: {{ display: true, text: 'Count' }} }} }}
    }}
}});
</script>
</body>
</html>"""

with open(os.path.join(OUTPUT_DIR, 'profitability_maturity_dashboard.html'), 'w') as f:
    f.write(dashboard_html)
print("  Written profitability_maturity_dashboard.html")

# ============================================================
# 8.4 Implementation Gantt Chart
# ============================================================
print("Building implementation_gantt.html...")

gantt_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Implementation Gantt - Profitability Engine</title>
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }}
h1 {{ color: #2F5496; text-align: center; }}
.subtitle {{ text-align: center; color: #666; margin-bottom: 25px; }}
.gantt-container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px;
    padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
.gantt {{ width: 100%; }}
.gantt-header {{ display: grid; grid-template-columns: 250px 1fr; border-bottom: 2px solid #2F5496; padding-bottom: 10px; margin-bottom: 10px; }}
.gantt-header .timeline {{ display: grid; grid-template-columns: repeat(4, 1fr); }}
.gantt-header .timeline div {{ text-align: center; font-size: 12px; color: #666; font-weight: bold; }}
.gantt-row {{ display: grid; grid-template-columns: 250px 1fr; margin: 8px 0; min-height: 60px; }}
.gantt-label {{ padding: 8px; font-size: 13px; }}
.gantt-label h3 {{ margin: 0 0 4px 0; font-size: 14px; color: #2F5496; }}
.gantt-label p {{ margin: 0; font-size: 11px; color: #666; }}
.gantt-bars {{ position: relative; display: grid; grid-template-columns: repeat(48, 1fr); gap: 0; }}
.gantt-bar {{ border-radius: 4px; color: white; font-size: 10px; padding: 4px 8px;
    display: flex; align-items: center; min-height: 32px; position: relative; }}
.gantt-bar .cap {{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; }}
.phase-color-1 {{ background: #4472C4; }}
.phase-color-2 {{ background: #ED7D31; }}
.phase-color-3 {{ background: #A5A5A5; }}
.phase-color-4 {{ background: #FFC000; color: #333; }}
.dependency-arrow {{ position: absolute; top: 50%; right: -8px; width: 0; height: 0;
    border-top: 6px solid transparent; border-bottom: 6px solid transparent; }}
.quarter-line {{ position: absolute; top: 0; bottom: 0; border-left: 1px dashed #ddd; }}
.milestone {{ position: absolute; top: -8px; right: -4px; width: 8px; height: 8px;
    background: #70AD47; border-radius: 50%; border: 2px solid white; }}
.measures-row {{ margin-top: 5px; }}
.measure-tag {{ display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 2px 8px;
    border-radius: 10px; font-size: 10px; margin: 2px; }}
.cumulative {{ max-width: 1200px; margin: 20px auto; background: white; border-radius: 12px;
    padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
.cumulative h2 {{ color: #2F5496; font-size: 16px; }}
</style>
</head>
<body>
<h1>Profitability Engine Implementation Gantt</h1>
<p class="subtitle">4-Phase Implementation with Maturity Progression and Capability Unlocks</p>

<div class="gantt-container">

<div class="gantt-header">
    <div style="font-weight:bold; color:#2F5496;">Phase / Capability</div>
    <div class="timeline">
        <div>Q1-Q2 (Foundation)</div>
        <div>Q3-Q4 (Core)</div>
        <div>Y2 H1 (Risk-Adjusted)</div>
        <div>Y2 H2 (Advanced)</div>
    </div>
</div>
"""

# Phase definitions with timeline positions
phase_configs = [
    {"phase": 1, "name": "Foundation", "start": 1, "span": 12, "color": "1",
     "capabilities": ["Single Customer View (Party Hub)", "Account Holdings (Agreement Hub)", "Financial Transactions (Event Hub)"],
     "measures": ["Basic customer profitability", "Account-level revenue"]},
    {"phase": 2, "name": "Core Profitability", "start": 10, "span": 14, "color": "2",
     "capabilities": ["Funds Transfer Pricing Engine", "Activity-Based Costing", "Balance & Fee Tracking", "Product Master Enhancement"],
     "measures": ["NII calculation", "Direct cost allocation", "Basic P&L by customer"]},
    {"phase": 3, "name": "Risk-Adjusted", "start": 22, "span": 14, "color": "3",
     "capabilities": ["PD/LGD Model Integration", "Risk-Based Pricing", "Economic Capital Allocation", "Provision Modelling"],
     "measures": ["RAROC", "Risk-adjusted profitability", "Economic capital by customer"]},
    {"phase": 4, "name": "Advanced Analytics", "start": 34, "span": 14, "color": "4",
     "capabilities": ["Profitability Optimization", "Lifetime Value Models", "Dynamic Pricing", "Executive Dashboards"],
     "measures": ["Predictive profitability", "LTV models", "Real-time dashboards"]},
]

for pc in phase_configs:
    # Phase header row
    gantt_html += f"""
    <div class="gantt-row">
        <div class="gantt-label">
            <h3>Phase {pc['phase']}: {pc['name']}</h3>
            <p>Effort: {'L' if pc['phase'] == 1 else 'XL'}</p>
        </div>
        <div class="gantt-bars">
            <div class="gantt-bar phase-color-{pc['color']}"
                 style="grid-column: {pc['start']} / span {pc['span']};">
                <span class="cap">{pc['name']}</span>
                <div class="milestone"></div>
            </div>
    """
    # Quarter lines
    for q in [12, 24, 36]:
        gantt_html += f'<div class="quarter-line" style="left:{q/48*100}%"></div>'
    gantt_html += "</div></div>"

    # Capability sub-rows
    cap_duration = max(pc['span'] // len(pc['capabilities']), 3)
    for i, cap in enumerate(pc['capabilities']):
        cap_start = pc['start'] + i * (cap_duration - 1)
        gantt_html += f"""
        <div class="gantt-row" style="min-height:30px;">
            <div class="gantt-label" style="padding-left:20px;">
                <p style="color:#333; font-size:12px;">&#8226; {cap}</p>
            </div>
            <div class="gantt-bars">
                <div class="gantt-bar phase-color-{pc['color']}" style="grid-column: {cap_start} / span {cap_duration}; opacity: 0.7; min-height: 22px;">
                    <span class="cap" style="font-size:9px">{cap[:25]}</span>
                </div>
            </div>
        </div>
        """

    # Measures enabled
    gantt_html += '<div class="gantt-row measures-row" style="min-height:30px;"><div class="gantt-label" style="padding-left:20px;">'
    for m in pc['measures']:
        gantt_html += f'<span class="measure-tag">{m}</span> '
    gantt_html += '</div><div></div></div>'

gantt_html += """
</div>

<div class="cumulative">
<h2>Cumulative Profitability Measures by Phase</h2>
<table style="width:100%; border-collapse:collapse; font-size:13px;">
<tr style="background:#2F5496; color:white;">
    <th style="padding:8px; text-align:left;">Phase</th>
    <th style="padding:8px; text-align:left;">New Measures Enabled</th>
    <th style="padding:8px; text-align:center;">Cumulative Total</th>
    <th style="padding:8px; text-align:left;">Maturity Level</th>
</tr>
<tr style="background:#E8F0FE;">
    <td style="padding:8px;">Phase 1: Foundation</td>
    <td style="padding:8px;">Account balance, transaction count, basic revenue</td>
    <td style="padding:8px; text-align:center;">3</td>
    <td style="padding:8px;">1 &rarr; 2</td>
</tr>
<tr>
    <td style="padding:8px;">Phase 2: Core Profitability</td>
    <td style="padding:8px;">NII, FTP credit/charge, direct costs, fee income, basic P&L</td>
    <td style="padding:8px; text-align:center;">8</td>
    <td style="padding:8px;">2 &rarr; 3</td>
</tr>
<tr style="background:#E8F0FE;">
    <td style="padding:8px;">Phase 3: Risk-Adjusted</td>
    <td style="padding:8px;">PD, LGD, EL, economic capital, RAROC, provisions</td>
    <td style="padding:8px; text-align:center;">14</td>
    <td style="padding:8px;">3 &rarr; 4</td>
</tr>
<tr>
    <td style="padding:8px;">Phase 4: Advanced Analytics</td>
    <td style="padding:8px;">LTV, predictive profitability, dynamic pricing, optimization</td>
    <td style="padding:8px; text-align:center;">18</td>
    <td style="padding:8px;">4 &rarr; 5</td>
</tr>
</table>
</div>

</body>
</html>"""

with open(os.path.join(OUTPUT_DIR, 'implementation_gantt.html'), 'w') as f:
    f.write(gantt_html)
print("  Written implementation_gantt.html")

print("\n=== PHASE 8 VISUALIZATIONS COMPLETE ===")
print("  maturity_radar.html")
print("  maturity_heatmap.html")
print("  profitability_maturity_dashboard.html")
print("  implementation_gantt.html")
