# Prompt 5: FSDM Banking Intelligence Platform — Comprehensive Integration Application

## Overview

Build a comprehensive, interactive web application that integrates **all outputs from Prompts 1-4** into a single **Banking Intelligence Platform** for enterprise data warehouse planning and profitability engine design. The app serves as the definitive planning and analysis tool for implementing Teradata FSDM at a bank (specifically UBL — United Bank Limited, Pakistan).

## Architecture

**Stack:**
```
FastAPI (Python backend)
├── Static file serving for React frontend
├── REST API endpoints for data queries
├── JSON/CSV data loading from Prompt 1-4 outputs
└── Dynamic calculations (maturity scoring, priority re-ranking)

React Frontend (single-page app)
├── Dashboard (landing page)
├── FSDM Explorer (data model browser)
├── BVF Capability Map (business value framework)
├── BACR Maturity Assessment (interactive scoring)
├── Profitability Engine Designer (star schema + lineage)
├── Implementation Planner (roadmap + priority)
└── Settings & Configuration
```

**File structure:**
```
/mnt/e/erwin/banking_intelligence_app/
├── app.py                    # FastAPI backend
├── data_loader.py            # Load all Prompt 1-4 outputs
├── calculators.py            # Priority scoring, maturity calculations
├── requirements.txt
├── static/
│   ├── index.html            # Main HTML shell
│   ├── app.jsx               # React application (compiled via CDN)
│   ├── styles.css            # Global styles
│   └── assets/               # Icons, images
├── data/                     # Symlinks or copies of Prompt 1-4 outputs
│   ├── fsdm/                 # From Prompt 1 & 2
│   ├── bvf/                  # From Prompt 3
│   └── bacr/                 # From Prompt 4
└── README.md
```

## Input Data Sources

Load all these files at application startup. If any file is missing, the app should gracefully degrade (show "Not yet generated — run Prompt N" message for that section).

### From Prompt 1 (ERwin Parser) — `/mnt/e/erwin/erwin_parser_output/`
```
fsdm_data_dictionary.csv       # UBL's actual FSDM v13 entities & columns
fsdm_ddl_teradata.sql          # Teradata DDL
fsdm_relationships.csv         # Entity relationships
fsdm_subject_areas.csv         # Subject area groupings
fsdm_entity_summary.csv        # Entity metadata
fsdm_stats.json                # Summary statistics
fsdm_report.md                 # Analysis report
```

### From Prompt 2 (XSD Analyzer) — `/mnt/e/erwin/fsdm_output/`
```
fsdm_entity_catalog.csv        # Full FSDM v16 entity catalog (3,933 entities)
fsdm_data_dictionary.csv       # All 15,430 attributes
fsdm_relationships.csv         # 5,656 relationships
fsdm_domain_map.json           # 12 domain classifications
fsdm_inheritance_tree.json     # 844 inheritance chains
profitability_star_schema.sql  # Star schema DDL
profitability_calc_framework.md # Calculation methodology
```

### From Prompt 3 (BVF Mapper) — `/mnt/e/erwin/bvf_output/`
```
bvf_parsed_capabilities.json        # 112 capabilities
bvf_parsed_data_requirements.json   # 113 data requirements
bvf_reuse_matrix.json               # Capability reuse coefficients
bvf_to_fsdm_entity_map.csv          # Data req → FSDM entity mapping
bvf_to_fsdm_entity_map.json         # Same in JSON
capability_entity_dependencies.csv  # Capability → entity footprint
capability_entity_summary.csv       # Summary per capability
profitability_bvf_lineage.csv       # Star schema ← FSDM ← BVF lineage
bvf_implementation_priority.csv     # Ranked priorities
profitability_data_coverage.json    # Coverage analysis
bvf_statistics.json                 # Summary stats
```

### From Prompt 4 (BACR Assessment) — `/mnt/e/erwin/bacr_output/`
```
bacr_all_questions.json              # 793 questions
bacr_all_questions.csv               # Flat CSV
bacr_category_summary.json           # Category stats
bacr_to_bvf_mapping.csv              # BACR → BVF mapping
bacr_to_bvf_mapping.json             # Same in JSON
bacr_information_to_fsdm.csv         # BACR → FSDM mapping
enhanced_implementation_priority.csv # Maturity-enhanced priorities
maturity_gap_analysis.csv            # Gap per capability
profitability_maturity_profile.json  # Profitability maturity
profitability_implementation_sequence.csv
cross_category_dependencies.json
bacr_statistics.json
```

### Source Files (for reference/re-parsing)
```
/mnt/e/erwin/tds.xsd                                              # FSDM v16 XSD
/mnt/e/erwin/Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm  # BVF
/mnt/e/erwin/BACR_-_INTERVIEW_MASTER_-_DA004462.xlsm              # BACR
/mnt/e/erwin/Teradata Financial Services Data Model 13.00.00 2 UBL.erwin  # ERwin
```

---

## Backend: FastAPI (app.py)

### API Endpoints

```python
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import data_loader
import calculators

app = FastAPI(title="FSDM Banking Intelligence Platform", version="1.0")

# --- FSDM Model Endpoints ---

@app.get("/api/fsdm/entities")
async def get_entities(
    domain: str = None,        # Filter by domain
    search: str = None,        # Search by name
    limit: int = 100,
    offset: int = 0
):
    """List FSDM entities with optional filtering."""

@app.get("/api/fsdm/entities/{entity_name}")
async def get_entity_detail(entity_name: str):
    """Full entity detail: attributes, relationships, inheritance, domain."""

@app.get("/api/fsdm/entities/{entity_name}/relationships")
async def get_entity_relationships(entity_name: str, depth: int = 1):
    """Get relationship graph for an entity (configurable depth)."""

@app.get("/api/fsdm/domains")
async def get_domains():
    """List all 12 FSDM domains with entity counts."""

@app.get("/api/fsdm/domains/{domain_name}")
async def get_domain_detail(domain_name: str):
    """All entities in a domain with relationships."""

@app.get("/api/fsdm/inheritance/{entity_name}")
async def get_inheritance_tree(entity_name: str):
    """Supertype/subtype hierarchy for an entity."""

@app.get("/api/fsdm/hub-entities")
async def get_hub_entities(top_n: int = 20):
    """Most connected entities (PARTY, AGREEMENT, etc.)."""

@app.get("/api/fsdm/search")
async def search_fsdm(q: str, include_attributes: bool = False):
    """Full-text search across entities and attributes."""

@app.get("/api/fsdm/stats")
async def get_fsdm_stats():
    """Summary statistics: entity/attribute/relationship counts, domain distribution."""

# --- BVF Endpoints ---

@app.get("/api/bvf/capabilities")
async def get_capabilities(
    area: str = None,
    sub_area: str = None,
    profitability_critical: bool = None
):
    """List BVF capabilities with filtering."""

@app.get("/api/bvf/capabilities/{capability_name}")
async def get_capability_detail(capability_name: str):
    """Capability detail: data requirements, FSDM entities, maturity, reuse."""

@app.get("/api/bvf/data-requirements")
async def get_data_requirements(
    subject_area: str = None,
    min_capability_count: int = None
):
    """List BVF data requirements with filtering."""

@app.get("/api/bvf/data-requirements/{req_name}")
async def get_data_requirement_detail(req_name: str):
    """Data requirement detail: capabilities, FSDM entities, priority score."""

@app.get("/api/bvf/reuse-matrix")
async def get_reuse_matrix(threshold: float = 0.5):
    """Capability reuse coefficients above threshold."""

@app.get("/api/bvf/areas")
async def get_bvf_areas():
    """BVF area → sub-area → capability hierarchy."""

@app.get("/api/bvf/fsdm-mapping")
async def get_bvf_fsdm_mapping(
    data_req: str = None,
    fsdm_entity: str = None,
    confidence: str = None
):
    """BVF data requirement → FSDM entity mappings."""

@app.get("/api/bvf/stats")
async def get_bvf_stats():
    """BVF summary statistics."""

# --- BACR Maturity Endpoints ---

@app.get("/api/bacr/questions")
async def get_bacr_questions(
    category: str = None,
    section: str = None,
    business_function: str = None,
    industry: str = "Financial",
    role: str = None,
    profitability_critical: bool = None
):
    """List BACR questions with rich filtering."""

@app.get("/api/bacr/questions/{question_id}")
async def get_bacr_question_detail(question_id: int):
    """Full question with maturity descriptors and mappings."""

@app.get("/api/bacr/categories")
async def get_bacr_categories():
    """Category → section hierarchy with question counts."""

@app.post("/api/bacr/assessment")
async def save_assessment(assessment: dict):
    """Save maturity assessment scores."""

@app.get("/api/bacr/assessment")
async def get_assessment():
    """Get current assessment scores (or defaults)."""

@app.put("/api/bacr/assessment/{question_id}")
async def update_assessment_score(question_id: int, current: int, desired: int):
    """Update individual question score."""

@app.get("/api/bacr/maturity-summary")
async def get_maturity_summary():
    """Category-level maturity averages and gaps."""

@app.get("/api/bacr/stats")
async def get_bacr_stats():
    """BACR summary statistics."""

# --- Profitability Engine Endpoints ---

@app.get("/api/profitability/star-schema")
async def get_star_schema():
    """Star schema structure: fact + dimensions with columns."""

@app.get("/api/profitability/lineage")
async def get_profitability_lineage(measure: str = None):
    """Full lineage: Star Schema ← FSDM ← BVF ← BACR for each measure."""

@app.get("/api/profitability/coverage")
async def get_coverage():
    """Data coverage analysis for star schema."""

@app.get("/api/profitability/maturity")
async def get_profitability_maturity():
    """Profitability maturity profile (revenue/cost/risk/treasury/reporting)."""

@app.get("/api/profitability/calculation-framework")
async def get_calc_framework():
    """Profitability calculation methodology."""

# --- Implementation Planning Endpoints ---

@app.get("/api/implementation/priority")
async def get_implementation_priority(
    tier: int = None,
    recalculate: bool = False
):
    """Ranked data requirement priorities (optionally recalculate with current maturity scores)."""

@app.get("/api/implementation/roadmap")
async def get_implementation_roadmap():
    """4-phase implementation roadmap with dependencies."""

@app.get("/api/implementation/phases/{phase_id}")
async def get_phase_detail(phase_id: int):
    """Phase detail: capabilities, entities, prerequisites, effort."""

@app.post("/api/implementation/recalculate")
async def recalculate_priorities(maturity_overrides: dict = None):
    """Recalculate implementation priorities with updated maturity scores."""

@app.get("/api/implementation/impact-analysis")
async def get_impact_analysis(data_requirements: list = Query(None)):
    """Show what capabilities/measures are enabled by implementing specific data reqs."""

# --- Cross-System Endpoints ---

@app.get("/api/search")
async def global_search(q: str):
    """Search across FSDM entities, BVF capabilities, BACR questions, data requirements."""

@app.get("/api/traceability/{entity_type}/{entity_id}")
async def get_traceability(entity_type: str, entity_id: str):
    """Full traceability chain for any entity: BACR ↔ BVF ↔ FSDM ↔ Star Schema."""

@app.get("/api/dashboard")
async def get_dashboard():
    """Aggregated dashboard data for landing page."""

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")
```

### Data Loader (data_loader.py)

```python
"""
Load all Prompt 1-4 outputs into memory at startup.
Gracefully handle missing files.
Build cross-references between datasets.
"""

import json, csv, os
from pathlib import Path

class DataStore:
    def __init__(self, base_path="/mnt/e/erwin"):
        self.base = Path(base_path)
        self.fsdm_v13 = {}   # Prompt 1 outputs
        self.fsdm_v16 = {}   # Prompt 2 outputs
        self.bvf = {}        # Prompt 3 outputs
        self.bacr = {}       # Prompt 4 outputs
        self.cross_refs = {} # Built cross-references
        self.loaded = {}     # Track what's loaded
        
    def load_all(self):
        self._load_fsdm_v13()
        self._load_fsdm_v16()
        self._load_bvf()
        self._load_bacr()
        self._build_cross_references()
        self._log_load_status()
    
    def _load_safe(self, path, loader):
        """Load a file safely, returning None if not found."""
        try:
            if path.exists():
                return loader(path)
        except Exception as e:
            print(f"Warning: Failed to load {path}: {e}")
        return None
    
    def _build_cross_references(self):
        """Build lookup indexes across all datasets."""
        # Entity → capabilities that use it
        # Capability → BACR questions that assess it
        # Data requirement → implementation priority
        # Star schema measure → full lineage chain
        pass

store = DataStore()
```

---

## Frontend: React Application

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  FSDM Banking Intelligence Platform              🔍 Search     │
├──────┬──────────────────────────────────────────────────────────┤
│ NAV  │                                                          │
│      │  📊 Dashboard                                            │
│  🏠  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  📋  │  │ 3,933   │ │  112    │ │  793    │ │ ★ Star  │      │
│  🏗️  │  │Entities │ │Capabil. │ │Questions│ │ Schema  │      │
│  📊  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  🎯  │                                                          │
│  🗺️  │  [Maturity Radar]    [Priority Chart]   [Coverage]      │
│  ⚙️  │                                                          │
└──────┴──────────────────────────────────────────────────────────┘
```

### Page 1: Dashboard (Landing Page)

**Top KPI Cards (4 cards):**
- FSDM Model: 3,933 entities / 15,430 attributes / 5,656 relationships
- BVF Coverage: 112 capabilities / 113 data requirements / mapping completeness %
- BACR Assessment: 793 questions / overall maturity score / profitability readiness %
- Star Schema: X measures / Y% data coverage / Z capabilities enabled

**Row 1: Maturity Overview**
- Left: Radar chart — 8 BACR categories (current vs. desired)
- Right: Profitability readiness gauge — 5 components (Revenue, Cost, Risk, Treasury, Reporting)

**Row 2: Implementation Status**
- Left: Horizontal bar chart — Top 20 data requirements by priority score, color-coded by tier
- Right: Implementation roadmap mini-timeline — 4 phases with progress indicators

**Row 3: Key Relationships**
- Left: Mini Sankey — BVF Areas → FSDM Domains (flow width = entity count)
- Right: Quick stats table — most connected entities, highest-reuse capabilities, biggest maturity gaps

### Page 2: FSDM Explorer

**Layout: Split panel**

**Left panel: Entity browser**
- Tree view: FSDM Domain → Entity Group → Entity
- Toggle: v13 (UBL actual) vs. v16 (full model)
- Search/filter bar
- Entity count badges per domain
- Color-coding by domain

**Right panel: Entity detail** (when entity selected)
- **Header**: Entity name, domain, parent entity (inheritance), column count, relationship count
- **Tab 1 - Attributes**: Table of all columns with Classword type, Teradata type, nullable, description
- **Tab 2 - Relationships**: Visual diagram showing parent/child entities (use vis.js or d3 force graph, max 2 hops)
- **Tab 3 - Inheritance**: Tree showing supertype → subtype hierarchy (collapsible)
- **Tab 4 - BVF Mapping**: Which BVF data requirements map to this entity, which capabilities depend on it
- **Tab 5 - Profitability**: If this entity feeds the star schema, show which measures it contributes to
- **Tab 6 - Maturity**: BACR questions that assess readiness for this entity's data

**Bottom panel: ERD Viewer**
- Interactive network graph of entities in selected domain
- Node size = column count, edge = relationship
- Click node to select entity in detail panel
- Domain selector tabs across top
- Zoom, pan, filter controls

### Page 3: BVF Capability Map

**Layout: Three-level hierarchy view**

**Level 1: BVF Areas** (3 tiles)
- Marketing & Customer Experience (40 capabilities)
- Risk Management & Regulation (42 capabilities)
- Finance & Performance Management (31 capabilities)

**Level 2: Sub-Areas** (12 groups, shown when area expanded)
- Each sub-area card shows: capability count, avg reuse score, profitability-critical count

**Level 3: Capability Detail** (when capability selected)
- **Info Panel**:
  - Capability name, area, sub-area
  - Profitability-critical badge
  - Data requirement count
  - FSDM entity footprint count
  - Maturity scores (current/desired/gap) from BACR
  - Average reuse coefficient
  
- **Data Requirements Tab**: List of data requirements this capability needs
  - Each item shows: FSDM subject area, FSDM entity count, implementation tier
  - Highlight inputs vs. outputs
  
- **FSDM Entity Footprint Tab**: All FSDM entities required by this capability
  - Grouped by domain
  - Show match confidence (HIGH/MEDIUM/LOW)
  
- **Reuse Analysis Tab**: 
  - Bar chart: Top 10 capabilities with highest data overlap
  - Overlap percentage and shared data requirements
  
- **Maturity Assessment Tab**:
  - BACR questions that assess this capability
  - Current/desired scores with maturity level descriptors
  - Gap analysis

**Special View: Capability × Data Requirement Heatmap**
- Toggle button to show the full 112 × 113 matrix
- Color: Blue = input, Green = output, Red = profitability-critical
- Sortable by area, reuse score, profitability impact

### Page 4: BACR Maturity Assessment

**Layout: Interactive assessment tool**

**Assessment Configuration Bar:**
- Bank name (default: UBL)
- Industry filter: Financial (locked for banking context)
- Review type dropdown: Data Warehouse Maturity Review / Big Data / AI & ML / Custom
- Role filter: Multi-select for applicable roles
- Business function filter: Multi-select
- Save/Load assessment buttons

**Question Browser (left 60%):**
- Accordion by Category → Section
- Each question card shows:
  - Question text
  - Two sliders: Current State (1-5), Desired State (1-5)
  - Gap badge (desired - current) with color coding
  - Maturity level descriptors (expand to show all 5 levels)
  - Linked BVF capability (clickable link)
  - Business function tags
  - Role tags
  
- Bulk actions:
  - "Set all to estimated defaults" button
  - "Reset category" button
  - "Mark all as assessed" button

**Analysis Panel (right 40%):**
- **Live Maturity Summary**: Updates as scores change
  - Category averages (bar chart)
  - Overall maturity score (gauge)
  - Profitability readiness score
  
- **Gap Analysis**:
  - Top 10 biggest gaps (sorted)
  - Category with worst gap
  - Quick wins (gap=1 with high priority)
  
- **Profitability Impact**:
  - Which profitability measures are impacted by current gaps
  - Star schema coverage at current maturity level

**Export Options:**
- Export assessment as Excel
- Export gap analysis as PDF
- Print assessment summary

### Page 5: Profitability Engine Designer

**Layout: Multi-panel profitability workspace**

**Panel 1: Star Schema Visual (top)**
- Interactive star schema diagram
- Central fact table (FACT_CUSTOMER_PROFITABILITY) surrounded by 7 dimension tables
- Click any table to see columns, source FSDM entities, source BVF data requirements
- Color-code columns by coverage status: Green (full), Yellow (partial), Red (gap)
- Animated data flow lines showing lineage paths

**Panel 2: Measure Detail (middle left)**
When a measure is selected in the star schema:
- **Full Lineage Chain**:
  ```
  Star Schema Column
    ← FSDM Entities (with attributes)
      ← BVF Data Requirements
        ← BVF Capabilities
          ← BACR Maturity Score
  ```
- Coverage status
- Current maturity level
- Implementation tier
- Dependencies on other measures

**Panel 3: Calculation Framework (middle right)**
- Visual representation of profitability calculation:
  ```
  Interest Income (NII)
    = Interest Earned - Interest Paid
    → Fund Transfer Pricing adjustment
  + Fee Income
  + Other Non-Interest Income
  = Total Revenue
  - Direct Costs (Activity-Based Costing)
  - Allocated Costs (overhead allocation)
  - Provision Expense (expected credit losses)
  = Net Profit
  → RAROC = Net Profit / Economic Capital
  → Cost-to-Income = Costs / Revenue
  ```
- Each component clickable → shows source entities, data requirements, maturity

**Panel 4: Coverage Dashboard (bottom)**
- Progress bar: X of Y measures fully covered
- Pie chart: Coverage status distribution
- Table: All measures with coverage status, source count, maturity gap
- "What-if" analysis: "If I implement Tier 1 data requirements, what measures become available?"

### Page 6: Implementation Planner

**Layout: Interactive planning workspace**

**View 1: Priority Ranking Table** (default)
- Sortable, filterable table of all 113 data requirements
- Columns: Rank, Name, FSDM Subject Area, BVF Priority Score, Maturity Gap, Enhanced Priority, Tier, FSDM Entity Count, Capabilities Unlocked, Profitability Measures
- Color bands by tier (Tier 1 = Green, Tier 2 = Blue, Tier 3 = Yellow, Tier 4 = Gray)
- Click row to see full detail panel

**View 2: Roadmap Timeline**
- Gantt-style horizontal timeline
- 4 phases with estimated durations
- Each phase shows:
  - Data requirements included
  - FSDM entities deployed
  - Capabilities unlocked
  - Profitability measures enabled
- Dependencies shown as arrows between phases
- Cumulative progress chart below timeline

**View 3: Impact Simulator**
- Interactive tool: "What happens if I implement X?"
- Left panel: Checklist of data requirements (grouped by tier)
- Right panel: Live updating charts:
  - Capability unlock percentage
  - Profitability measure coverage
  - Maturity improvement projection
  - Entity deployment count
- Preset buttons: "Tier 1 only", "Tier 1+2", "Profitability critical only", "All"

**View 4: Dependency Graph**
- Network graph showing implementation dependencies
- Nodes = data requirements
- Edges = dependencies (data requirement A must be before B)
- Size = priority score
- Color = tier
- Clustered by FSDM subject area

### Page 7: Settings & Configuration

- Data source paths configuration
- Maturity score defaults (editable)
- Priority weight adjustments (recalculates on save)
- Export all data as ZIP
- Application info and prompt version tracking

---

## Frontend Technical Requirements

### React Component Architecture

```jsx
// Main App
App
├── Navigation (sidebar)
├── SearchBar (global search)
├── Routes
│   ├── DashboardPage
│   │   ├── KPICards
│   │   ├── MaturityRadar (Recharts RadarChart)
│   │   ├── ProfitabilityGauges (5 gauge components)
│   │   ├── PriorityBarChart (Recharts BarChart)
│   │   └── SankeyMini (D3 Sankey)
│   │
│   ├── FSDMExplorerPage
│   │   ├── EntityTree (collapsible tree browser)
│   │   ├── EntityDetail
│   │   │   ├── AttributeTable
│   │   │   ├── RelationshipGraph (vis.js)
│   │   │   ├── InheritanceTree
│   │   │   ├── BVFMappingPanel
│   │   │   ├── ProfitabilityPanel
│   │   │   └── MaturityPanel
│   │   └── ERDViewer (D3 force graph)
│   │
│   ├── BVFCapabilityPage
│   │   ├── AreaCards
│   │   ├── SubAreaGroups
│   │   ├── CapabilityDetail
│   │   │   ├── DataRequirementsList
│   │   │   ├── EntityFootprint
│   │   │   ├── ReuseAnalysis (Recharts)
│   │   │   └── MaturityPanel
│   │   └── HeatmapView (custom Canvas component)
│   │
│   ├── BACRAssessmentPage
│   │   ├── AssessmentConfig
│   │   ├── QuestionBrowser
│   │   │   ├── CategoryAccordion
│   │   │   ├── QuestionCard (with sliders)
│   │   │   └── MaturityDescriptors
│   │   └── AnalysisPanel
│   │       ├── MaturitySummaryChart
│   │       ├── GapAnalysis
│   │       └── ProfitabilityImpact
│   │
│   ├── ProfitabilityDesignerPage
│   │   ├── StarSchemaVisual (D3/SVG interactive)
│   │   ├── MeasureDetail
│   │   ├── LineageChain
│   │   ├── CalcFrameworkVisual
│   │   └── CoverageDashboard
│   │
│   ├── ImplementationPlannerPage
│   │   ├── PriorityTable (sortable/filterable)
│   │   ├── RoadmapTimeline (D3 Gantt)
│   │   ├── ImpactSimulator
│   │   └── DependencyGraph (D3 force)
│   │
│   └── SettingsPage
```

### Libraries (all via CDN)
```html
<!-- React -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>

<!-- Charts -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/recharts/2.10.3/Recharts.min.js"></script>

<!-- D3 (for ERD, Sankey, Gantt, force graphs) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>

<!-- vis.js (for network graphs) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.6/dist/vis-network.min.js"></script>

<!-- Tailwind CSS -->
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

<!-- Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

### Color Palette (Banking/Financial theme)

```css
:root {
    /* Primary */
    --primary-900: #0D1B2A;    /* Deep navy (sidebar, headers) */
    --primary-700: #1B3A5C;    /* Dark blue */
    --primary-500: #2E6B9E;    /* Medium blue (links, accents) */
    --primary-300: #6BA3D6;    /* Light blue */
    --primary-100: #E8F0F8;    /* Very light blue (backgrounds) */
    
    /* FSDM Domain Colors */
    --domain-party: #3B82F6;       /* Blue */
    --domain-agreement: #10B981;   /* Green */
    --domain-product: #F59E0B;     /* Amber */
    --domain-event: #EF4444;       /* Red */
    --domain-channel: #8B5CF6;     /* Purple */
    --domain-finance: #06B6D4;     /* Cyan */
    --domain-risk: #F97316;        /* Orange */
    --domain-location: #84CC16;    /* Lime */
    --domain-campaign: #EC4899;    /* Pink */
    --domain-asset: #14B8A6;       /* Teal */
    --domain-org: #6366F1;         /* Indigo */
    --domain-model: #A855F7;       /* Violet */
    
    /* BVF Area Colors */
    --bvf-marketing: #3B82F6;      /* Blue */
    --bvf-risk: #EF4444;           /* Red */
    --bvf-finance: #10B981;        /* Green */
    
    /* Maturity Colors */
    --maturity-1: #EF4444;   /* Emerging - Red */
    --maturity-2: #F97316;   /* Developing - Orange */
    --maturity-3: #F59E0B;   /* Practicing - Amber */
    --maturity-4: #84CC16;   /* Innovating - Lime */
    --maturity-5: #10B981;   /* Leading - Green */
    
    /* Implementation Tiers */
    --tier-1: #10B981;   /* Must Have - Green */
    --tier-2: #3B82F6;   /* Should Have - Blue */
    --tier-3: #F59E0B;   /* Nice to Have - Amber */
    --tier-4: #9CA3AF;   /* Future - Gray */
    
    /* Coverage Status */
    --coverage-full: #10B981;
    --coverage-partial: #F59E0B;
    --coverage-gap: #EF4444;
}
```

---

## Backend Technical Implementation

### requirements.txt
```
fastapi==0.104.1
uvicorn==0.24.0
openpyxl==3.1.2
lxml==4.9.3
pandas==2.1.4
networkx==3.2.1
python-multipart==0.0.6
```

### Data Loader Pattern

```python
# data_loader.py
import json, csv, os
from pathlib import Path

def load_csv_safe(filepath):
    """Load CSV, return empty list if file doesn't exist."""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def load_json_safe(filepath):
    """Load JSON, return None if file doesn't exist."""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

class DataStore:
    """Singleton data store loaded at startup."""
    
    def __init__(self):
        self.data = {}
        self.status = {}
    
    def load_all(self, base_path="/mnt/e/erwin"):
        prompts = {
            "prompt1": {
                "path": f"{base_path}/erwin_parser_output",
                "files": {
                    "entities": ("fsdm_entity_summary.csv", load_csv_safe),
                    "dictionary": ("fsdm_data_dictionary.csv", load_csv_safe),
                    "relationships": ("fsdm_relationships.csv", load_csv_safe),
                    "subject_areas": ("fsdm_subject_areas.csv", load_csv_safe),
                    "stats": ("fsdm_stats.json", load_json_safe),
                }
            },
            "prompt2": {
                "path": f"{base_path}/fsdm_output",
                "files": {
                    "entity_catalog": ("fsdm_entity_catalog.csv", load_csv_safe),
                    "data_dictionary": ("fsdm_data_dictionary.csv", load_csv_safe),
                    "relationships": ("fsdm_relationships.csv", load_csv_safe),
                    "domain_map": ("fsdm_domain_map.json", load_json_safe),
                    "inheritance_tree": ("fsdm_inheritance_tree.json", load_json_safe),
                    "star_schema": ("profitability_star_schema.sql", lambda p: open(p).read() if os.path.exists(p) else None),
                    "calc_framework": ("profitability_calc_framework.md", lambda p: open(p).read() if os.path.exists(p) else None),
                }
            },
            "prompt3": {
                "path": f"{base_path}/bvf_output",
                "files": {
                    "capabilities": ("bvf_parsed_capabilities.json", load_json_safe),
                    "data_requirements": ("bvf_parsed_data_requirements.json", load_json_safe),
                    "reuse_matrix": ("bvf_reuse_matrix.json", load_json_safe),
                    "entity_map": ("bvf_to_fsdm_entity_map.json", load_json_safe),
                    "entity_dependencies": ("capability_entity_dependencies.csv", load_csv_safe),
                    "priority": ("bvf_implementation_priority.csv", load_csv_safe),
                    "lineage": ("profitability_bvf_lineage.csv", load_csv_safe),
                    "coverage": ("profitability_data_coverage.json", load_json_safe),
                    "stats": ("bvf_statistics.json", load_json_safe),
                }
            },
            "prompt4": {
                "path": f"{base_path}/bacr_output",
                "files": {
                    "questions": ("bacr_all_questions.json", load_json_safe),
                    "category_summary": ("bacr_category_summary.json", load_json_safe),
                    "bvf_mapping": ("bacr_to_bvf_mapping.json", load_json_safe),
                    "fsdm_mapping": ("bacr_information_to_fsdm.json", load_json_safe),
                    "enhanced_priority": ("enhanced_implementation_priority.csv", load_csv_safe),
                    "maturity_gap": ("maturity_gap_analysis.csv", load_csv_safe),
                    "profitability_maturity": ("profitability_maturity_profile.json", load_json_safe),
                    "implementation_sequence": ("profitability_implementation_sequence.csv", load_csv_safe),
                    "cross_deps": ("cross_category_dependencies.json", load_json_safe),
                    "stats": ("bacr_statistics.json", load_json_safe),
                }
            }
        }
        
        for prompt_name, config in prompts.items():
            self.data[prompt_name] = {}
            self.status[prompt_name] = {"loaded": 0, "missing": 0, "files": {}}
            
            for key, (filename, loader) in config["files"].items():
                filepath = f"{config['path']}/{filename}"
                result = loader(filepath)
                self.data[prompt_name][key] = result
                
                if result is not None:
                    self.status[prompt_name]["loaded"] += 1
                    self.status[prompt_name]["files"][key] = "loaded"
                else:
                    self.status[prompt_name]["missing"] += 1
                    self.status[prompt_name]["files"][key] = "missing"
        
        self._build_indexes()
    
    def _build_indexes(self):
        """Build cross-reference indexes for fast lookups."""
        self.indexes = {
            "entity_by_name": {},
            "entity_by_domain": {},
            "capability_by_name": {},
            "data_req_by_name": {},
            "question_by_id": {},
            "entity_to_capabilities": {},
            "capability_to_questions": {},
        }
        # ... populate indexes from loaded data

# Singleton
store = DataStore()
```

---

## Execution

### Step 1: Generate all prerequisite data

```bash
cd /mnt/e/erwin
conda activate erwin

# Run prompts in order (each one builds on previous)
claude < erwin-parser-prompt.md           # Prompt 1: ERwin → parsed outputs
claude < fsdm-xsd-analyzer-prompt.md      # Prompt 2: XSD → FSDM + star schema
claude < bvf-fsdm-profitability-mapper-prompt.md  # Prompt 3: BVF → FSDM mapping
claude < bacr-maturity-assessment-prompt.md       # Prompt 4: BACR → maturity
```

### Step 2: Build and run the application

```bash
claude < banking-intelligence-app-prompt.md  # Prompt 5: Build the app

# Or manually:
cd /mnt/e/erwin/banking_intelligence_app
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Open browser: `http://localhost:8000`

### Graceful Degradation

The app must work even if only some prompts have been run. For each page:

| Page | Minimum Data Required |
|---|---|
| Dashboard | Any one prompt output |
| FSDM Explorer | Prompt 2 outputs |
| BVF Capability Map | Prompt 3 outputs |
| BACR Assessment | Prompt 4 outputs (or parse XLSM directly) |
| Profitability Designer | Prompt 2 + 3 outputs |
| Implementation Planner | Prompt 3 + 4 outputs |

If data is missing, show a helpful banner: "Run Prompt N to populate this section" with the command to run.

### Direct Source Parsing Fallback

If Prompt 1-4 outputs don't exist, the app can parse the source files directly:
- Parse `tds.xsd` for FSDM entities (using lxml iterparse)
- Parse `Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm` for BVF data
- Parse `BACR_-_INTERVIEW_MASTER_-_DA004462.xlsm` for BACR questions
- Generate mappings and calculations on-the-fly

This fallback is slower but ensures the app works immediately after setup.

---

## Summary

This application ties together:

| Dimension | Source | Count | Purpose |
|---|---|---|---|
| **Data Model** | FSDM XSD + ERwin | 3,933 entities, 15,430 attributes | Physical data architecture |
| **Business Capabilities** | BVF XLSM | 112 capabilities, 113 data requirements | What business needs from data |
| **Maturity Assessment** | BACR XLSM | 793 questions, 5-level scale | Where the bank stands today |
| **Profitability Engine** | Star Schema + Calc Framework | 10 measures, 7 dimensions | Target analytical outcome |
| **Implementation Plan** | Enhanced Priority + Roadmap | 4 phases, tiered priorities | How to get there |

The key value is **traceability** — any user can start from any point and trace through the entire chain:
- "Which FSDM entities do I need for FTP?" → Star Schema → FSDM → BVF → BACR maturity
- "What does improving Customer Segmentation maturity unlock?" → BACR → BVF → FSDM entities → Star schema measures
- "Which data requirements give me the most bang for buck?" → Priority ranking with maturity gap adjustment
