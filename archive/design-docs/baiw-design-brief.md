# BAIW — Application Design Brief

## The Insight

Your `nmnbkhr/erwin` repo has produced an extraordinary knowledge base:

| Asset | Size | What It Contains |
|-------|------|-----------------|
| FSDM v16 XSD Analysis | 3,917 entities, 15,364 attributes, 5,636 relationships | The complete canonical banking data model |
| BVF Integration | 112 capabilities, 360 entity mappings, 5,218 dependencies | What data you need for each banking capability |
| Star Schema | 1 fact + 7 dims + 2 aggs + 3 views | Customer profitability engine DDL |
| Gap Extensions | 21 tables across 5 modules | ABC, CLV, Budget, BPM, Ops Metrics |
| BACR Questions | 793 across 9 categories | Analytics maturity assessment toolkit |
| Pakistan Context | SBP, KIBOR, IFRS 9, Islamic banking, tax | Full Pakistan banking localization |
| 16 BVF Prompts | 10,454 lines of enriched domain knowledge | Pakistan-enriched use cases, FSDM mappings, roadmaps |

**The problem:** This knowledge is scattered across CSVs, JSONs, SQLs, HTMLs, and Markdown files. A consultant needs to open multiple files to answer basic questions.

**The solution:** BAIW unifies everything into one navigable, searchable, interactive application.

---

## Who Uses It

| User | Primary Need | Key Modules |
|------|-------------|-------------|
| **Banking CIO/CTO** | "Show me the roadmap and investment" | Dashboard, Roadmap Builder |
| **CFO** | "How does the profitability engine work?" | Profitability Engine, P&L Builder |
| **Data Architect** | "Which entities for customer analytics?" | Model Explorer, Dependency Graph |
| **Management Consultant** | "Assess maturity, build business case" | Maturity Assessment, Roadmap |
| **Teradata/FSDM Implementer** | "Map capabilities to data model" | Capability Navigator, Model Explorer |
| **Project Manager** | "What's Phase 1 scope?" | Roadmap Builder, Dependency Graph |

---

## The 8 Modules — What Each Answers

```
┌─────────────────────────────────────────────────────────────┐
│  1. DASHBOARD                                               │
│  "Give me the 30-second overview"                           │
│  → Key stats, domain distribution, capability coverage      │
├─────────────────────────────────────────────────────────────┤
│  2. FSDM MODEL EXPLORER                                    │
│  "Show me entity X — its attributes, relationships, usage"  │
│  → Browse 3,917 entities across 16 domains                  │
├─────────────────────────────────────────────────────────────┤
│  3. BVF CAPABILITY NAVIGATOR                                │
│  "What data do I need for Profitability Analytics?"          │
│  → 112 capabilities with data requirements + FSDM mapping   │
├─────────────────────────────────────────────────────────────┤
│  4. DEPENDENCY GRAPH                                        │
│  "Show me how capabilities connect to data domains"          │
│  → Interactive force-directed network visualization          │
├─────────────────────────────────────────────────────────────┤
│  5. MATURITY ASSESSMENT                                     │
│  "Where are we today vs. where we need to be?"              │
│  → 793-question BACR wizard with radar chart output          │
├─────────────────────────────────────────────────────────────┤
│  6. PROFITABILITY ENGINE                                    │
│  "Show me the star schema and P&L structure"                 │
│  → Interactive ERD + 16-line P&L waterfall + gap modules     │
├─────────────────────────────────────────────────────────────┤
│  7. ROADMAP BUILDER                                         │
│  "Build me a 3-phase plan with investment estimates"         │
│  → Capability picker + Gantt timeline + investment calc      │
├─────────────────────────────────────────────────────────────┤
│  8. PAKISTAN BANKING REFERENCE                               │
│  "What are the SBP/KIBOR/Islamic/tax specifics?"             │
│  → Regulatory, industry metrics, Islamic modes, payments     │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────────────────┐
│  nmnbkhr/erwin REPO      │
│                          │
│  erwin_parser_output/    │──┐
│  fsdm_output/            │──┤  prepare_data.py
│  bvf_fsdm_output/        │──┤  (or generate_sample_data.py)
│  BACR Excel              │──┤
│  16 BVF Prompts          │──┘
└──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│  src/data/ (JSON)        │
│                          │
│  entities.json     3,917 │
│  relationships.json 5,636│
│  capabilities.json   112 │
│  dependencies.json 5,218 │
│  reuseScores.json    219 │
│  starSchema.json      11 │
│  gapExtensions.json   21 │
│  bacrQuestions.json   793 │
│  pakistanContext.json     │
│  enrichment.json          │
└──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│  React App (BAIW)        │
│                          │
│  8 Modules               │
│  Cross-linked navigation │
│  Global search           │
│  localStorage persist    │
│  PDF/JSON export         │
└──────────────────────────┘
```

---

## Competitive Positioning

| Feature | Spreadsheets | PowerPoint | BAIW |
|---------|-------------|------------|------|
| Browse 3,917 entities | ❌ Scroll forever | ❌ Static slides | ✅ Search + filter + drill |
| Find entity→capability links | ❌ Manual cross-ref | ❌ Text references | ✅ Click-through navigation |
| Maturity assessment | ❌ Paper-based | ❌ Static maturity tables | ✅ Interactive wizard + radar |
| Build roadmap | ❌ Manual | ❌ Template slides | ✅ Capability picker + auto-phase |
| Pakistan context | ❌ Separate doc | ❌ Speaker notes | ✅ Integrated throughout |
| Star schema exploration | ❌ Read SQL file | ❌ ERD image | ✅ Interactive ERD + click columns |

---

## Implementation: Two Paths

### Path A: Sample Data (Demo-ready in <1 day)
- `generate_sample_data.py` creates realistic JSON with exact counts
- App works immediately with meaningful banking domain content
- Perfect for demos, investor pitches, consulting conversations

### Path B: Real Data (Production-ready in 1-2 days)
- `prepare_data.py` reads actual repo CSV/JSON files
- Converts to same JSON schema as sample data
- Swaps in — app immediately shows real FSDM/BVF data
- Can run against ANY FSDM version or BVF version

---

## Business Value

**For UBL / Pakistan Bank Engagements:**
- Replaces 16 PowerPoint decks (500+ slides) with one interactive app
- Assessment that took 2-3 weeks of interviews → guided wizard in hours
- Roadmap that took consulting team weeks to build → auto-generated in minutes
- FSDM entity research that took days of reading docs → instant search

**For Consulting Practice:**
- Reusable across engagements (swap data, keep structure)
- Impressive client-facing tool (vs. spreadsheets)
- Captures institutional knowledge (Pakistan banking context baked in)
- Can evolve into SaaS product for banking consulting

**Estimated Development:** 
- MVP (8 modules with sample data): 3-5 Claude Code sessions
- Production (with real repo data): +1-2 sessions for prepare_data.py
- Polish (animations, PDF export, mobile): +2-3 sessions
