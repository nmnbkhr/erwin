# FSDM & BVF Integration Project - Overview

## What This Project Does

This project reverse-engineers and integrates two Teradata banking assets to build a **Customer Profitability Engine** for a Pakistani bank (UBL-style):

1. **FSDM v16.00.00** (Financial Services Data Model) - Teradata's canonical banking data model with 3,917 entities
2. **Banking BVF v1.2** (Business Value Framework) - Maps 112 banking capabilities to data requirements

The pipeline works in 3 phases:

```
Phase 1: Parse source files (ERWIN model + XSD schema + BVF Excel)
Phase 2: Analyze FSDM structure (entities, relationships, domains, inheritance)
Phase 3: Integrate BVF with FSDM -> Profitability Star Schema + Gap Extensions
```

---

## How It Works

### Phase 1 - ERWIN Model Parsing

**Script:** `erwin_parser.py` (1,018 lines)
**Input:** `Teradata Financial Services Data Model 13.00.00 2 UBL - LDM 1.erwin` (133 MB)
**Output:** `erwin_parser_output/`

Parses the binary ERWIN file (UBL's v13 model) to extract entities, attributes, relationships, and subject areas. Produces a data dictionary, DDL, and entity summary.

### Phase 2 - XSD Schema Analysis

**Script:** `fsdm_xsd_analyzer.py` (1,674 lines)
**Input:** `tds.xsd` (9 MB, 152K lines)
**Output:** `fsdm_output/`

Memory-efficient streaming parser for the FSDM v16 XSD schema. Extracts all 3,917 entities, classifies them into 16 domains, maps 5,636 relationships, builds inheritance trees, and generates Teradata DDL with proper classword data types.

### Phase 3 - BVF-FSDM Integration & Profitability Engine

**Script:** `bvf_fsdm_integration.py` (2,402 lines)
**Input:** `Banking Business Value Framework Data Mappings 1.2.xlsm` + Phase 2 outputs
**Output:** `bvf_fsdm_output/`

The core integration engine that:
- Parses all 6 BVF Excel sheets (capabilities, data requirements, reuse matrix)
- Maps 113 BVF data requirements to specific FSDM entities (360 mappings)
- Builds a 5,218-row capability-to-FSDM dependency graph
- Generates an enhanced Teradata star schema (1 fact + 7 dims + 2 aggs + 3 views)
- Creates column-level data lineage with BVF traceability
- Documents Pakistan banking context (KIBOR, SBP, WHT, Zakat, Islamic banking)
- Identifies 5 gap areas where FSDM needs extension

### Visualizations

**Script:** `bvf_fsdm_rebuild_viz.py` (812 lines)
**Output:** 6 self-contained HTML files (no CDN dependencies)

All visualizations use pure Canvas/SVG rendering - they work offline without internet access.

### Gap Extensions

**Output:** `fsdm_gap_extensions.sql` (584 lines)

21 new Teradata tables + 6 views that extend FSDM to cover the 5 identified capability gaps: Activity Based Costing, Customer Lifetime Value, Budgets & Forecasts, Business Process Management, and Operational Metrics.

---

## File Structure

```
/mnt/e/erwin/
│
├── OVERVIEW.md                          <- This file
│
├── ── INPUT FILES ──────────────────────────────────────────
│
├── tds.xsd                              [9 MB] FSDM v16.00.00 XSD schema (3,917 entities)
├── Banking Business Value Framework     [348 KB] BVF v1.2 Excel workbook (6 sheets)
│   Data Mappings 1.2.xlsm
├── Teradata Financial Services Data     [133 MB] UBL's ERWIN model (v13.00.00)
│   Model 13.00.00 2 UBL - LDM 1.erwin
│
├── ── PROMPT FILES ─────────────────────────────────────────
│
├── erwin-parser-prompt.md               Prompt for Phase 1 (ERWIN parsing)
├── fsdm-xsd-analyzer-prompt.md          Prompt for Phase 2 (XSD analysis)
├── bvf-fsdm-integration-prompt.md       Prompt for Phase 3 (BVF-FSDM integration)
│
├── ── PYTHON SCRIPTS ───────────────────────────────────────
│
├── erwin_parser.py                      [1,018 lines] Phase 1: ERWIN binary parser
├── fsdm_xsd_analyzer.py                 [1,674 lines] Phase 2: XSD streaming parser
├── bvf_fsdm_integration.py              [2,402 lines] Phase 3: BVF-FSDM integration engine
├── bvf_fsdm_rebuild_viz.py              [812 lines]   Visualization generator (Canvas/SVG)
├── bvf_fsdm_visualizations.py           [505 lines]   Original viz (Plotly CDN - superseded)
│
├── ── PHASE 1 OUTPUT ───────────────────────────────────────
│
├── erwin_parser_output/                 [4 MB] ERWIN v13 model analysis
│   ├── fsdm_data_dictionary.csv         [1.7 MB] Full attribute-level data dictionary
│   ├── fsdm_ddl_teradata.sql            [1.4 MB] Teradata CREATE TABLE DDL
│   ├── fsdm_entity_summary.csv          [811 KB] Entity summary with column counts
│   ├── fsdm_erd_mermaid.md              [98 KB]  Mermaid ERD diagrams
│   ├── fsdm_relationships.csv           [29 KB]  Entity relationships
│   ├── fsdm_report.md                   [20 KB]  Analysis report
│   ├── fsdm_stats.json                  [8 KB]   Statistics
│   └── fsdm_subject_areas.csv           [75 KB]  Subject area classification
│
├── ── PHASE 2 OUTPUT ───────────────────────────────────────
│
├── fsdm_output/                         [11 MB] FSDM v16 XSD analysis
│   ├── fsdm_entity_catalog.csv          [952 KB] 3,917 entities with domain, description
│   ├── fsdm_relationships.csv           [377 KB] 5,636 parent-child relationships
│   ├── fsdm_data_dictionary.csv         [3.4 MB] 15,364 attributes with classword types
│   ├── fsdm_ddl_teradata.sql            [2.8 MB] Full Teradata DDL (all entities)
│   ├── fsdm_domain_map.json             [123 KB] Entity-to-domain classification
│   ├── fsdm_inheritance_tree.json       [88 KB]  Inheritance hierarchies (839 chains)
│   ├── fsdm_stats.json                  [6 KB]   Model statistics
│   ├── fsdm_summary_report.md           [3 KB]   Executive summary
│   ├── fsdm_profitability_mapping.csv   [3 KB]   Initial profitability entity mapping
│   ├── fsdm_erd_interactive.html        [370 KB] Interactive ERD (domain-based)
│   ├── fsdm_explorer.html               [2.1 MB] Full model explorer UI
│   ├── profitability_star_schema.sql    [10 KB]  Initial star schema
│   ├── profitability_erd.html           [4 KB]   Initial profitability ERD
│   ├── profitability_calc_framework.md  [4 KB]   Calculation methodology
│   └── mermaid/                         [16 files] Per-domain Mermaid ERD diagrams
│       ├── party_management.mermaid     [48 KB]  622 entities
│       ├── agreement_account.mermaid    [41 KB]  506 entities
│       ├── product_management.mermaid   [22 KB]  209 entities
│       ├── ... (13 more domain files)
│       └── other.mermaid                [57 KB]  1,197 uncategorized entities
│
├── ── PHASE 3 OUTPUT (BVF-FSDM Integration) ───────────────
│
└── bvf_fsdm_output/                     [1.9 MB] BVF-FSDM integration results
    │
    ├── ── DATA FILES (CSV) ─────────────────────────────────
    │
    ├── bvf_capability_summary.csv       [11 KB]  112 sub-capabilities
    │                                              Theme | Capability_Group | Sub_Capability | Data_Req_Count
    │
    ├── bvf_data_requirements.csv        [174 KB] 113 data requirements
    │                                              Data_Requirement | FSDM_Subject_Area | Capabilities_Using | Count
    │
    ├── bvf_reuse_matrix.csv             [195 KB] 112x112 cross-capability reuse coefficients
    │                                              Theme | Capability | Sub_Capability | [112 coefficient columns]
    │
    ├── bvf_to_fsdm_entity_mapping.csv   [74 KB]  360 BVF data requirement -> FSDM entity mappings
    │                                              Data_Requirement | FSDM_Subject_Area | FSDM_Entity |
    │                                              Entity_Description | Entity_In_XSD | Domain | Confidence | Notes
    │
    ├── capability_fsdm_dependencies.csv [959 KB] 5,218 capability-to-FSDM entity dependencies
    │                                              Theme | Capability | Sub_Capability |
    │                                              Data_Requirement | FSDM_Subject_Area | FSDM_Entities
    │
    ├── fsdm_entity_reuse_scores.csv     [11 KB]  219 FSDM entities ranked by reuse
    │                                              FSDM_Entity | Subject_Area | Capabilities_Supported |
    │                                              Reuse_Score | Priority_Tier (P1/P2/P3/P4)
    │
    ├── ── STAR SCHEMA DDL ──────────────────────────────────
    │
    ├── profitability_star_schema_enhanced.sql  [23 KB]  Teradata DDL (501 lines)
    │                                              FACT_CUSTOMER_PROFITABILITY (35+ measures)
    │                                              DIM_CUSTOMER (30+ cols, SCD Type 2)
    │                                              DIM_PRODUCT (20+ cols, Islamic modes)
    │                                              DIM_BRANCH (20+ cols, SBP codes)
    │                                              DIM_BUSINESS_SEGMENT
    │                                              DIM_CHANNEL (branchless banking)
    │                                              DIM_TIME (Pakistan fiscal year Jul-Jun)
    │                                              DIM_AGREEMENT (IFRS9, SBP classification)
    │                                              DIM_GEOGRAPHY (Pakistan provinces)
    │                                              AGG_BRANCH_PROFITABILITY
    │                                              AGG_SEGMENT_PROFITABILITY
    │                                              3 analytical views (Customer P&L, Product P&L, Islamic vs Conv.)
    │
    ├── ── GAP EXTENSIONS DDL ───────────────────────────────
    │
    ├── fsdm_gap_extensions.sql          [32 KB]  21 new tables + 6 views (584 lines)
    │                                              GAP 1: ABC Costing (6 tables)
    │                                                COST_POOL, ACTIVITY, COST_DRIVER,
    │                                                COST_ALLOCATION_RULE, COST_ALLOCATION_RESULT, ACTIVITY_RATE
    │                                              GAP 2: Customer Lifetime Value (3 tables)
    │                                                CLV_MODEL, CUSTOMER_LIFETIME_VALUE, CLV_SCENARIO
    │                                              GAP 3: Budgets & Forecasts (4 tables)
    │                                                BUDGET, BUDGET_LINE_ITEM, FORECAST_VERSION, KPI_TARGET
    │                                              GAP 4: Business Process Mgmt (4 tables)
    │                                                BUSINESS_PROCESS, PROCESS_STEP,
    │                                                PROCESS_INSTANCE, PROCESS_STEP_INSTANCE
    │                                              GAP 5: Operational Metrics (4 tables)
    │                                                OPERATIONAL_METRIC_TYPE, OPERATIONAL_METRIC_VALUE,
    │                                                CHANNEL_OPERATIONAL_METRIC, BRANCH_OPERATIONAL_METRIC
    │
    ├── ── DATA LINEAGE ─────────────────────────────────────
    │
    ├── data_lineage.json                [13 KB]  23 column-level lineage entries
    │                                              target_column -> calculation -> source_fsdm_entities ->
    │                                              bvf_data_requirements -> bvf_capabilities
    │
    ├── ── REPORTS (Markdown) ───────────────────────────────
    │
    ├── profitability_bvf_coverage.md    [96 KB]  BVF capability coverage report
    │                                              14 profitability capabilities analyzed
    │                                              Per-capability: data reqs, FSDM entities, star schema mapping
    │                                              Gap analysis and Pakistan/UBL considerations
    │
    ├── pakistan_banking_context.md       [10 KB]  Pakistan banking implementation guide
    │                                              SBP regulatory framework, Basel III
    │                                              KIBOR FTP benchmarks, currency (PKR)
    │                                              Islamic banking modes (Murabaha, Ijarah, etc.)
    │                                              Tax: WHT (15%/30%), Zakat (2.5%)
    │                                              Channels: JazzCash, Easypaisa, RAAST
    │                                              UBL-specific: v13->v16 gap analysis
    │
    ├── summary_report.md                [10 KB]  Executive summary of all deliverables
    │
    ├── ── VISUALIZATIONS (Self-contained HTML) ─────────────
    │
    ├── bvf_fsdm_sankey.html             [46 KB]  Sankey diagram (pure SVG)
    │                                              BVF Themes -> Capability Groups -> FSDM Subject Areas
    │                                              Color-coded by theme (blue/orange/green)
    │
    ├── data_reuse_heatmap.html          [99 KB]  Reuse coefficient heatmap (Canvas)
    │                                              112x112 capability matrix
    │                                              Red (0.0) -> Orange (0.5) -> Green (1.0)
    │                                              Hover tooltip with capability names + score
    │
    ├── fsdm_entity_coverage.html        [55 KB]  Binary coverage matrix (Canvas)
    │                                              FSDM entities (rows) x BVF capabilities (cols)
    │                                              Green = used (1), Dark red = not used (0)
    │                                              Side bars showing coverage counts
    │
    ├── profitability_data_flow.html     [13 KB]  Data flow diagram (SVG)
    │                                              Source Systems -> FSDM Entities ->
    │                                              Star Schema -> Profitability Measures
    │
    ├── profitability_erd.html           [14 KB]  Star schema ERD (SVG, dark theme)
    │                                              All 8 tables with columns and FSDM source annotations
    │                                              FK relationship lines
    │
    └── fsdm_gap_extensions_erd.html     [19 KB]  Gap extension architecture (SVG, dark theme)
                                                   5 gap modules with tables listed
                                                   Integration arrows to existing FSDM + star schema
                                                   Cross-gap dependency lines
```

---

## Key Numbers

| Metric | Value |
|--------|-------|
| FSDM Entities (v16 XSD) | 3,917 |
| FSDM Attributes | 15,364 |
| FSDM Relationships | 5,636 |
| FSDM Inheritance Chains | 839 |
| FSDM Classword Types | 22 |
| FSDM Domains | 16 |
| BVF Business Value Themes | 3 |
| BVF Capability Groups | 12 |
| BVF Sub-Capabilities | 112 |
| BVF Data Requirements | 113 |
| BVF FSDM Subject Areas | 21 |
| BVF-to-FSDM Entity Mappings | 360 |
| Capability-FSDM Dependencies | 5,218 |
| FSDM Entities in Reuse Scoring | 219 |
| P1-Critical Entities (70+ caps) | 53 |
| Star Schema Tables | 11 (1 fact + 7 dim + 2 agg + 1 geo) |
| Star Schema Views | 3 |
| Gap Extension Tables | 21 |
| Gap Extension Views | 6 |
| Data Lineage Entries | 23 |
| Total Python Lines | ~5,400 |
| Total SQL Lines | ~1,085 |
| Total Output Files | 18 |

---

## How to Run

```bash
# Phase 1: Parse ERWIN model (only needed if erwin_parser_output/ is missing)
python3 erwin_parser.py

# Phase 2: Analyze XSD schema (only needed if fsdm_output/ is missing)
python3 fsdm_xsd_analyzer.py

# Phase 3: Run BVF-FSDM integration (requires Phase 2 outputs)
python3 bvf_fsdm_integration.py

# Generate visualizations (requires Phase 3 outputs)
python3 bvf_fsdm_rebuild_viz.py
```

### Dependencies

```
Python 3.x
lxml        # XSD parsing
openpyxl    # Excel parsing
pandas      # Data manipulation (optional)
```

---

## Architecture Flow

```
┌─────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ ERWIN Model (v13)   │    │  XSD Schema (v16)    │    │  BVF Excel (v1.2)    │
│ 133 MB binary       │    │  9 MB, 152K lines    │    │  6 sheets, 348 KB    │
└────────┬────────────┘    └──────────┬───────────┘    └──────────┬───────────┘
         │                            │                            │
    erwin_parser.py             fsdm_xsd_analyzer.py          bvf_fsdm_integration.py
         │                            │                            │
         v                            v                            v
┌─────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ erwin_parser_output/ │    │  fsdm_output/        │───>│  bvf_fsdm_output/    │
│ - Data dictionary    │    │  - Entity catalog    │    │  - BVF-FSDM mapping  │
│ - DDL                │    │  - Relationships     │    │  - Star schema DDL   │
│ - Relationships      │    │  - Domain map        │    │  - Gap extensions    │
│ - Subject areas      │    │  - Inheritance tree  │    │  - Data lineage      │
│                      │    │  - DDL               │    │  - Visualizations    │
│                      │    │  - Interactive ERD   │    │  - Pakistan context  │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
                                                               │
                                                          bvf_fsdm_rebuild_viz.py
                                                               │
                                                               v
                                                        6 Interactive HTML
                                                        visualizations
```

---

## Pakistan Banking Customizations

The star schema and extensions include Pakistan-specific design decisions:

| Decision | Implementation |
|----------|---------------|
| Currency | PKR base, multi-currency (USD/EUR/GBP/SAR/AED/CNY) |
| FTP Benchmark | KIBOR (not LIBOR) - O/N to 1Y tenors |
| Fiscal Year | July-June (not calendar year) |
| Weekly Holiday | Friday (not Saturday) |
| Islamic Banking | `Is_Islamic_Ind` flag + `Islamic_Mode_Cd` (Murabaha/Musharakah/Ijarah) |
| Tax | `WHT_Amount_Amt` (15%/30%), `Zakat_Deduction_Amt` (2.5%) |
| National ID | `CNIC_Number` for individuals, `NTN_Number` for corporates |
| Regulatory | `SBP_Classification_Cd`, `SBP_Branch_Code`, `SBP_Sector_Code` |
| Credit Loss | IFRS 9 ECL (Stage 1/2/3) + SBP prudential classification (1-9) |
| Segments | Retail/Corporate/Commercial/SME/Agriculture/Islamic/Micro/Treasury |
| Channels | Branch/ATM/Mobile/Internet + JazzCash/Easypaisa/RAAST |
