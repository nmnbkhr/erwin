# TAIW WCO Data Model Enrichment — Claude Code Prompt

## Paste this ENTIRE prompt into Claude Code

```
You have access to a real WCO Data Model v4.2.0 application at:
/home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0

And the TAIW module of the Analytics Intelligence Suite (BAIW app) which currently uses generated/synthetic WCO DM data.

## PHASE 1: SCAN & UNDERSTAND THE REAL WCO DM PROJECT

First, explore the WCO DM project thoroughly before making any changes:

### Step 1: Map the project structure
```bash
find /home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0 -type f | head -200
```
List all folders and files. Identify:
- What framework is it built with? (React, Vue, plain HTML, Python, etc.)
- Where is the data stored? (JSON files, database, hardcoded, API?)
- What does the UI look like? (components, pages, routes)

### Step 2: Find the actual WCO DM data
Search for JSON, CSV, or data files containing WCO elements:
```bash
find /home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0 -name "*.json" -o -name "*.csv" -o -name "*.xlsx" -o -name "*.ts" -o -name "*.js" | grep -i "data\|model\|element\|domain\|class"
```

Read each data file and document what it contains:
- **Data Elements**: How many? What fields per element? (ID, name, definition, format, class, domain)
- **Classes**: How many? What hierarchy? (e.g., Declaration, Consignment, GoodsItem, Party, Transport)
- **Domains**: How many? Names? (e.g., Customs, Transport, Trade, Party, Location)
- **Relationships**: Are class-to-class relationships defined?
- **Information Packages (DIPs/BIPs)**: Are these included?
- **Code Lists**: Are WCO code lists included?
- **Mappings**: Any mappings to national systems, EDIFACT, XML schemas?

### Step 3: Extract the actual data structure
For each data file found, show:
- File path
- Record count
- First 3 records (full content)
- Schema/fields
- Any IDs, codes, or identifiers used

### Step 4: Check for capabilities or use cases
Does the WCO DM app have:
- Any capability framework or analytics mapping?
- Any maturity assessment?
- Any Pakistan-specific context?
- Any gap analysis features?
- Any relationship to TCF (Trade Capability Framework)?

### Step 5: Compare with current TAIW data
The TAIW module currently has synthetic data in the Analytics Intelligence Suite.
Find the TAIW data files:
```bash
find /path/to/baiw-project/src/data/taiw/ -name "*.json" 2>/dev/null
# Also check src/data/taiw/ or wherever TAIW data lives
```

Compare:
- How many WCO elements does the real project have vs TAIW's synthetic data?
- Are the element IDs, names, and structures compatible?
- What's in the real project that's MISSING from TAIW?
- What's in TAIW that doesn't exist in the real project?

## PHASE 2: REPORT FINDINGS

After scanning everything, produce a DETAILED REPORT as a markdown file saved to the BAIW project:

Save to: [BAIW_PROJECT_ROOT]/docs/wco-dm-audit-report.md

The report should contain:

### 1. WCO DM v4.2 Project Summary
- Framework & tech stack
- File count and structure
- Data file locations

### 2. Data Inventory
| Data Type | Source File | Record Count | Key Fields | Example Record |
|-----------|------------|-------------|-----------|----------------|
| Elements  | path/to/file | 727 | id, name, definition, class, domain, format | {...} |
| Classes   | path/to/file | ~130 | id, name, domain, parent, attributes | {...} |
| Domains   | path/to/file | 14 | id, name, description, classCount | {...} |
| etc.      | | | | |

### 3. Gap Analysis: Real WCO DM vs Current TAIW Data
| Aspect | Real WCO DM Project | Current TAIW (Synthetic) | Gap |
|--------|--------------------|-----------------------|-----|
| Elements | [actual count] | 727 (generated) | Are IDs matching? |
| Classes | [actual count] | ~130 (generated) | Structure differences? |
| Domains | [actual count] | 14 (generated) | Names matching? |
| Relationships | [present/absent] | ~300 (generated) | Real vs synthetic? |
| Information Packages | [present/absent] | 23 (generated) | Which DIPs exist? |
| Code Lists | [present/absent] | 50 (generated) | Coverage? |
| Pakistan Context | [present/absent] | Yes (WeBOC, PSW, etc.) | Already in TAIW |

### 4. Enrichment Opportunities
List specific things from the real WCO DM project that should be added to TAIW:
- More accurate element definitions?
- Real class hierarchies?
- Actual DIP structures?
- Real code list values?
- Proper UML relationships?

### 5. Recommended Actions
Prioritized list of what to do:
1. [Highest value enrichment]
2. [Second priority]
3. ...

## PHASE 3: ENRICH TAIW DATA (only after Phase 2 report is reviewed)

DO NOT start Phase 3 automatically. After saving the report, STOP and show me the findings.
Say: "Audit complete. Report saved to docs/wco-dm-audit-report.md. Here are the key findings: [summary]. Shall I proceed with enriching TAIW data?"

If I confirm, then:

### Enrichment Tasks (execute only on confirmation):

#### Task A: Replace synthetic elements with real data
If the real WCO DM project has actual element definitions:
- Read all elements from the real project
- Map them to TAIW's expected JSON structure
- Replace src/data/taiw/dataElements.json (or equivalent) with real data
- Preserve any TAIW-specific fields (capability mappings, Pakistan enrichment) — merge, don't overwrite

#### Task B: Replace synthetic classes with real hierarchy
If the real project has class/relationship data:
- Extract real class hierarchy
- Update src/data/taiw/classes.json with accurate parent-child relationships
- Update domain assignments if they differ

#### Task C: Update domain structure
If the real project has different domain names/counts:
- Align TAIW's domains.json with the real WCO DM structure
- Update any UI that references domain names

#### Task D: Add real Information Packages
If the real project has DIP/BIP data:
- Extract and add to TAIW data
- Map to TCF capabilities where applicable

#### Task E: Add real code lists
If the real project has WCO code list values:
- Add actual codes (country codes, currency codes, HS codes, transport mode codes, etc.)
- Replace any synthetic code list data

#### Task F: Preserve TAIW's unique additions
These exist ONLY in TAIW (not in the WCO DM project) and MUST be preserved:
- TCF capabilities (96 capabilities — our creation)
- TACR maturity questions (640+ questions — our creation)
- Pakistan context (WeBOC, PSW, FBR, CPEC — our creation)
- Star schema (FACT_TRADE_TRANSACTION — our creation)
- Gap extensions (AEO, Origin, Valuation, Risk, E-Commerce — our creation)
- Capability-to-element mappings (our creation)
- Enrichment data (Pakistan per-capability context — our creation)

The real WCO DM replaces the DATA MODEL layer. Our TAIW additions (capabilities, maturity, Pakistan, star schema) sit ON TOP and must not be touched.

#### Task G: Verify after enrichment
After replacing data:
```bash
cd [BAIW_PROJECT_ROOT]
npm run dev
```
- Navigate to /taiw/model → verify elements load correctly
- Navigate to /taiw/capabilities → verify capability-to-element links still work
- Navigate to /taiw/graph → verify dependency graph renders
- Navigate to /taiw → verify dashboard stats are correct
- Check browser console for any errors

## CRITICAL RULES

1. PHASE 1 and 2 are READ-ONLY — scan and report, change nothing
2. PHASE 3 only runs after I confirm the audit findings
3. NEVER delete TAIW's capability framework, maturity questions, Pakistan context, star schema, or gap extensions
4. Only REPLACE the WCO DM data layer (elements, classes, domains, relationships, DIPs, code lists)
5. MERGE strategy: if a TAIW JSON file has both WCO DM fields AND TAIW-specific fields (like capabilityLinks), keep the TAIW fields and update only the WCO DM fields
6. Create backups before any replacement:
   ```bash
   cp -r src/data/taiw/ src/data/taiw_backup_$(date +%Y%m%d)/
   ```
7. All paths in the WCO DM source project are READ-ONLY — never modify that project
8. After enrichment, total element count should match the real WCO DM (727 or whatever the actual count is)
9. If the real WCO DM project uses different IDs/naming conventions than TAIW, create a mapping table and transform

## GIT — After enrichment is verified:

git checkout -b feature/taiw-wco-dm-enrichment
git add -A
git commit -m "feat(taiw): enrich WCO DM data from real v4.2.0 source project

- Scanned /home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0
- Replaced synthetic WCO DM elements with real v4.2.0 data
- [list specific files replaced/updated]
- Preserved all TAIW-specific additions: TCF capabilities, TACR questions,
  Pakistan context, star schema, gap extensions
- Audit report: docs/wco-dm-audit-report.md
- Backup: src/data/taiw_backup_YYYYMMDD/"
git push -u origin feature/taiw-wco-dm-enrichment
git checkout master
git merge feature/taiw-wco-dm-enrichment
git push origin master
```

---

## What This Prompt Does (Summary)

```
Phase 1: SCAN (read-only)
  └── Explore /home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0
  └── Find all data files (JSON, CSV, etc.)
  └── Document: elements, classes, domains, DIPs, code lists, relationships

Phase 2: REPORT
  └── Save audit report to docs/wco-dm-audit-report.md
  └── Gap analysis: real WCO DM vs current TAIW synthetic data
  └── STOP and ask for confirmation

Phase 3: ENRICH (only after confirmation)
  └── Backup current TAIW data
  └── Replace WCO DM layer with real data
  └── Preserve all TAIW additions (capabilities, maturity, Pakistan, star schema)
  └── Verify app still works
  └── Git commit and push
```
