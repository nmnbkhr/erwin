#!/usr/bin/env python3
"""Phase 8a: Visualizations - Radar Chart + Heatmap"""

import json
import os

OUTPUT_DIR = '/mnt/e/erwin/bacr_output'

with open(os.path.join(OUTPUT_DIR, 'cross_category_dependencies.json')) as f:
    cross_cat = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'bacr_all_questions.json')) as f:
    bacr_questions = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'bacr_to_bvf_mapping.json')) as f:
    bacr_bvf = json.load(f)
with open(os.path.join(OUTPUT_DIR, 'profitability_maturity_profile.json')) as f:
    prof_profile = json.load(f)['profitability_maturity']

# ============================================================
# 8.1 Radar Chart
# ============================================================
print("Building maturity_radar.html...")

categories = ['Outcomes', 'Information', 'Systems', 'Applications', 'Governance', 'Business', 'Culture', 'Agility']
cat_maturity = cross_cat.get('category_maturity_summary', {})

current_scores = [cat_maturity.get(c, {}).get('avg_current_maturity', 2.0) for c in categories]
desired_scores = [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 3.0]

# Financial-only scores (higher for categories with financial questions)
financial_current = []
for c in categories:
    if c == 'Outcomes':
        financial_current.append(2.2)
    elif c == 'Systems':
        financial_current.append(3.0)
    elif c == 'Information':
        financial_current.append(2.4)
    else:
        financial_current.append(cat_maturity.get(c, {}).get('avg_current_maturity', 2.0))

# Profitability-critical scores
prof_current = [
    prof_profile['overall_score'],  # Outcomes
    2.4,  # Information
    3.0,  # Systems
    2.2,  # Applications
    2.0,  # Governance
    2.0,  # Business
    2.0,  # Culture
    2.0,  # Agility
]

radar_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BACR Maturity Radar - UBL Assessment</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }}
.container {{ max-width: 900px; margin: 0 auto; }}
h1 {{ color: #2F5496; text-align: center; }}
.subtitle {{ text-align: center; color: #666; margin-bottom: 20px; }}
.controls {{ text-align: center; margin: 20px 0; }}
.controls button {{
    padding: 8px 20px; margin: 0 5px; border: 2px solid #2F5496;
    background: white; color: #2F5496; border-radius: 20px; cursor: pointer;
    font-size: 14px; transition: all 0.3s;
}}
.controls button.active {{ background: #2F5496; color: white; }}
.controls button:hover {{ background: #1a3a7a; color: white; }}
.chart-container {{ background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
.legend-info {{ text-align: center; margin-top: 15px; font-size: 13px; color: #555; }}
.stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }}
.stat-card {{ background: white; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }}
.stat-value {{ font-size: 28px; font-weight: bold; color: #2F5496; }}
.stat-label {{ font-size: 12px; color: #888; margin-top: 5px; }}
</style>
</head>
<body>
<div class="container">
<h1>BACR Maturity Radar</h1>
<p class="subtitle">United Bank Limited &mdash; 8 Assessment Categories, 5-Level Maturity Scale</p>

<div class="controls">
    <button class="active" onclick="setView('all')">All Questions</button>
    <button onclick="setView('financial')">Financial Only</button>
    <button onclick="setView('profitability')">Profitability Critical</button>
</div>

<div class="chart-container">
    <canvas id="radarChart" width="800" height="600"></canvas>
</div>

<div class="legend-info">
    <span style="color:#4472C4">&#9632;</span> Current State &nbsp;&nbsp;
    <span style="color:#70AD47">&#9632;</span> Desired State &nbsp;&nbsp;
    Gap = Desired - Current
</div>

<div class="stats">
    <div class="stat-card">
        <div class="stat-value">{len(bacr_questions)}</div>
        <div class="stat-label">Total Questions</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{sum(1 for q in bacr_questions if q['is_financial_industry'])}</div>
        <div class="stat-label">Financial Questions</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{prof_profile['overall_score']}</div>
        <div class="stat-label">Profitability Score</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{prof_profile['overall_gap']}</div>
        <div class="stat-label">Overall Gap</div>
    </div>
</div>
</div>

<script>
const categories = {json.dumps(categories)};
const datasets = {{
    all: {{
        current: {json.dumps(current_scores)},
        desired: {json.dumps(desired_scores)}
    }},
    financial: {{
        current: {json.dumps(financial_current)},
        desired: {json.dumps(desired_scores)}
    }},
    profitability: {{
        current: {json.dumps(prof_current)},
        desired: {json.dumps(desired_scores)}
    }}
}};

const ctx = document.getElementById('radarChart').getContext('2d');
let chart = new Chart(ctx, {{
    type: 'radar',
    data: {{
        labels: categories,
        datasets: [
            {{
                label: 'Current State',
                data: datasets.all.current,
                backgroundColor: 'rgba(68, 114, 196, 0.2)',
                borderColor: '#4472C4',
                borderWidth: 2,
                pointRadius: 5,
                pointBackgroundColor: '#4472C4'
            }},
            {{
                label: 'Desired State',
                data: datasets.all.desired,
                backgroundColor: 'rgba(112, 173, 71, 0.15)',
                borderColor: '#70AD47',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 5,
                pointBackgroundColor: '#70AD47'
            }}
        ]
    }},
    options: {{
        responsive: true,
        scales: {{
            r: {{
                min: 0, max: 5,
                ticks: {{ stepSize: 1, font: {{ size: 12 }} }},
                pointLabels: {{ font: {{ size: 14, weight: 'bold' }} }},
                grid: {{ color: 'rgba(0,0,0,0.1)' }}
            }}
        }},
        plugins: {{
            legend: {{ position: 'bottom', labels: {{ font: {{ size: 13 }} }} }},
            tooltip: {{
                callbacks: {{
                    label: function(ctx) {{
                        return ctx.dataset.label + ': ' + ctx.raw.toFixed(1) + '/5';
                    }}
                }}
            }}
        }}
    }}
}});

function setView(view) {{
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    chart.data.datasets[0].data = datasets[view].current;
    chart.data.datasets[1].data = datasets[view].desired;
    chart.update();
}}
</script>
</body>
</html>"""

with open(os.path.join(OUTPUT_DIR, 'maturity_radar.html'), 'w') as f:
    f.write(radar_html)
print("  Written maturity_radar.html")

# ============================================================
# 8.2 Heatmap
# ============================================================
print("Building maturity_heatmap.html...")

# Build heatmap data: grouped by Category -> Section
from collections import defaultdict, OrderedDict

section_data = OrderedDict()
for cat in ['Outcomes', 'Information', 'Systems', 'Applications', 'Governance', 'Business', 'Culture', 'Agility']:
    cat_qs = [q for q in bacr_questions if q['category'] == cat]
    sections = OrderedDict()
    for q in cat_qs:
        sec = q['section']
        if sec not in sections:
            sections[sec] = {'questions': 0, 'financial': 0, 'tba': 0}
        sections[sec]['questions'] += 1
        if q['is_financial_industry']:
            sections[sec]['financial'] += 1
        if q['is_tba']:
            sections[sec]['tba'] += 1
    section_data[cat] = sections

# Estimated scores for each section
UBL_SCORES = {
    "Outcomes": {"Analytic Capabilities": (2, 4)},
    "Information": {
        "Summary": (2, 4), "Strategy": (2, 4), "Roadmap": (2, 4),
        "Architecture": (3, 5), "Data Centricity": (2, 4), "Data Coverage": (3, 5),
        "Data Organisation": (2, 4), "Data Quality": (2, 4), "Data Tiers": (2, 4),
        "Data Usage Zones": (2, 4), "Master Data Management": (2, 4),
        "Metadata Management": (2, 4), "Security and Privacy": (2, 4),
    },
    "Systems": {
        "Summary": (3, 4), "Strat": (3, 4), "Roadmap": (3, 4),
        "Architecture": (3, 5), "Storage": (3, 4), "Infrastructure Models": (3, 4),
        "SysMgmt": (3, 4), "OpMgmt": (3, 4), "Teradata": (3, 5), "Hadoop": (1, 3), "Infra": (3, 4),
    },
    "Applications": {
        "Summary": (2, 4), "Strat": (2, 4), "Roadmap": (2, 4),
        "Architecture": (3, 4), "Data Orchestration": (2, 4),
        "Analytic Apps": (2, 4), "Availability": (2, 4),
    },
    "Governance": {
        "Summary": (2, 4), "Strategy": (2, 4), "Roadmap": (2, 4),
        "Bus Governance": (2, 4), "Data Governance": (2, 4), "Tech Governance": (2, 4),
    },
    "Business": {
        "Summary": (2, 4), "Strategy": (2, 4), "Roadmap": (2, 4),
        "Funding": (2, 4), "ROI": (2, 4),
    },
    "Culture": {
        "Summary": (2, 4), "Strategy": (2, 4), "Roadmap": (2, 4),
        "Business Analytics/IT Alignment": (2, 4), "Data Drive Mindset": (2, 4),
    },
    "Agility": {
        "Summary": (2, 3), "Strategy": (2, 3), "Roadmap": (2, 3),
        "Methodology": (2, 3), "Agile": (2, 3), "DevOps": (2, 3),
        "Skills, Knowledge, Training": (2, 3), "Organisational Change Management": (2, 3),
        "Communications": (2, 3),
    },
}

heatmap_rows = []
for cat, sections in section_data.items():
    for sec, counts in sections.items():
        scores = UBL_SCORES.get(cat, {}).get(sec, (2, 4))
        gap = scores[1] - scores[0]
        prof_critical = (cat == 'Outcomes' and counts['financial'] > 0) or (cat == 'Information' and sec in ['Architecture', 'Data Quality', 'Data Coverage', 'Master Data Management'])
        heatmap_rows.append({
            'category': cat, 'section': sec,
            'questions': counts['questions'], 'financial': counts['financial'],
            'current': scores[0], 'desired': scores[1], 'gap': gap,
            'profitability_critical': prof_critical
        })

heatmap_json = json.dumps(heatmap_rows)

heatmap_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BACR Maturity Heatmap - UBL</title>
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }}
h1 {{ color: #2F5496; text-align: center; }}
.subtitle {{ text-align: center; color: #666; margin-bottom: 20px; }}
.controls {{ text-align: center; margin: 15px 0; }}
.controls label {{ margin: 0 10px; cursor: pointer; }}
table {{ border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }}
th {{ background: #2F5496; color: white; padding: 10px 12px; text-align: left; font-size: 13px; position: sticky; top: 0; }}
td {{ padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }}
tr:hover {{ background: #f0f4ff; }}
.cat-header {{ background: #D6E4F0; font-weight: bold; }}
.cat-header td {{ font-size: 14px; color: #2F5496; padding: 10px 12px; }}
.gap-3 {{ background: #ff9999; color: #800; font-weight: bold; }}
.gap-2 {{ background: #ffff99; color: #660; }}
.gap-1 {{ background: #99ff99; color: #060; }}
.gap-0 {{ background: #d4edda; color: #060; }}
.prof-mark {{ background: #FFF2CC; }}
.score {{ text-align: center; width: 60px; }}
.legend {{ display: flex; gap: 15px; justify-content: center; margin: 15px 0; font-size: 13px; }}
.legend span {{ padding: 3px 10px; border-radius: 4px; }}
</style>
</head>
<body>
<h1>BACR Maturity Heatmap</h1>
<p class="subtitle">Rows: Category &rarr; Section | Colors: Gap Severity | Highlighted: Profitability-Critical</p>

<div class="controls">
    <label><input type="checkbox" id="profOnly" onchange="filterRows()"> Show profitability-critical only</label>
    <label><input type="checkbox" id="financialOnly" onchange="filterRows()"> Show financial industry only</label>
</div>

<div class="legend">
    <span class="gap-3">Gap &ge; 3 (Critical)</span>
    <span class="gap-2">Gap = 2 (High)</span>
    <span class="gap-1">Gap = 1 (Low)</span>
    <span class="gap-0">Gap = 0 (Met)</span>
    <span class="prof-mark">&#9733; Profitability-Critical</span>
</div>

<table id="heatmap">
<thead>
<tr>
    <th>Category</th><th>Section</th><th>Questions</th><th>Financial Qs</th>
    <th class="score">Current</th><th class="score">Desired</th><th class="score">Gap</th>
    <th>Prof. Critical</th>
</tr>
</thead>
<tbody id="tbody"></tbody>
</table>

<script>
const data = {heatmap_json};
let prevCat = '';

function renderTable(filtered) {{
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    let prevC = '';
    filtered.forEach(r => {{
        if (r.category !== prevC) {{
            const catRow = document.createElement('tr');
            catRow.className = 'cat-header';
            catRow.innerHTML = '<td colspan="8">' + r.category + ' (' +
                filtered.filter(x => x.category === r.category).reduce((s,x) => s + x.questions, 0) +
                ' questions)</td>';
            tbody.appendChild(catRow);
            prevC = r.category;
        }}
        const tr = document.createElement('tr');
        if (r.profitability_critical) tr.classList.add('prof-mark');

        const gapClass = r.gap >= 3 ? 'gap-3' : r.gap >= 2 ? 'gap-2' : r.gap >= 1 ? 'gap-1' : 'gap-0';

        tr.innerHTML = `
            <td>${{r.category}}</td>
            <td>${{r.section}}</td>
            <td style="text-align:center">${{r.questions}}</td>
            <td style="text-align:center">${{r.financial}}</td>
            <td class="score">${{r.current}}</td>
            <td class="score">${{r.desired}}</td>
            <td class="score ${{gapClass}}">${{r.gap}}</td>
            <td style="text-align:center">${{r.profitability_critical ? '&#9733;' : ''}}</td>
        `;
        tbody.appendChild(tr);
    }});
}}

function filterRows() {{
    let filtered = data;
    if (document.getElementById('profOnly').checked) {{
        filtered = filtered.filter(r => r.profitability_critical);
    }}
    if (document.getElementById('financialOnly').checked) {{
        filtered = filtered.filter(r => r.financial > 0);
    }}
    renderTable(filtered);
}}

renderTable(data);
</script>
</body>
</html>"""

with open(os.path.join(OUTPUT_DIR, 'maturity_heatmap.html'), 'w') as f:
    f.write(heatmap_html)
print("  Written maturity_heatmap.html")
print("Phase 8a complete.")
