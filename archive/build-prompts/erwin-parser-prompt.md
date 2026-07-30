# Claude Code Prompt: ERwin FSDM Parser

## Context
I have an ERwin Data Model file (~80MB XML-based) for **Teradata Financial Services Data Model (FSDM) v13.00.00** used at United Bank Limited (UBL). The file is located at:

```
/mnt/e/erwin/Teradata Financial Services Data Model 13.00.00 2 UBL.erwin
```

This is an enterprise banking data warehouse model that integrates multiple core banking systems (CTL, etc.) on Teradata platform.

## Task
Build a Python-based ERwin parser tool that:

### Phase 1: Parse & Extract
1. **Read the .erwin file** (it's XML internally, likely using ERwin's XML schema)
2. **Extract all entities/tables** with:
   - Entity name (logical & physical)
   - Subject area / grouping
   - Entity type (fact, dimension, bridge, etc. if available)
3. **Extract all attributes/columns** with:
   - Attribute name (logical & physical)
   - Data type & length
   - Nullable flag
   - Default values
   - Comments/descriptions
4. **Extract all relationships** with:
   - Parent entity → Child entity
   - Cardinality (1:1, 1:M, M:M)
   - Foreign key columns
   - Relationship name
5. **Extract primary keys and indexes**
6. **Extract subject areas** and which entities belong to each

### Phase 2: Generate Outputs
Create the following output files:

1. **`fsdm_data_dictionary.csv`** — Full catalog: Entity | Attribute | DataType | PK | FK | Nullable | Description
2. **`fsdm_ddl_teradata.sql`** — Teradata-compatible CREATE TABLE statements with PRIMARY INDEX, column definitions, and FOREIGN KEY constraints
3. **`fsdm_relationships.csv`** — Parent | Child | Cardinality | FK Columns | Relationship Name
4. **`fsdm_subject_areas.csv`** — Subject Area | Entity List
5. **`fsdm_entity_summary.csv`** — Entity | Column Count | Subject Area | PK Columns | Description
6. **`fsdm_erd_mermaid.md`** — Mermaid.js ERD diagrams grouped by subject area (for visualization)
7. **`fsdm_stats.json`** — Summary statistics: total entities, attributes, relationships, subject areas

### Phase 3: Analysis & Reporting
1. Generate a **summary report** (`fsdm_report.md`) with:
   - Total entities, attributes, relationships
   - Breakdown by subject area
   - Key fact tables and their dimensions
   - Hub entities (most relationships)
   - Orphan entities (no relationships)
2. Identify **FSDM-specific structures**:
   - Customer dimension tables
   - Account/Product hierarchies
   - Transaction/Balance fact tables
   - Party/Organization structures
   - Reference/Lookup tables

## Technical Requirements
- Use Python 3.x with standard library (`xml.etree.ElementTree` or `lxml` for large files)
- Use `lxml` with iterparse for memory efficiency (80MB file)
- Handle ERwin XML namespaces properly
- Create a `/output` folder for all generated files
- Add progress indicators (file is large)
- Handle encoding issues gracefully
- Make the parser reusable (config-driven paths)

## ERwin XML Structure Hints
ERwin files typically have these XML elements (may vary by version):
- `<Entity>` — Table definitions
- `<Attribute>` — Column definitions  
- `<Relationship>` — FK relationships
- `<Subject_Area>` — Groupings
- `<Key_Group>` — Primary/alternate keys
- Look for `Physical_Name` vs `Name` attributes for logical/physical names

**IMPORTANT:** Start by examining the XML structure first (read first 500 lines) to understand the exact schema before building the parser. The ERwin XML format can vary between versions.

## Output Location
Save all outputs to: `/mnt/e/erwin/erwin_parser_output/`

## Bonus (if time permits)
- Generate a **NetworkX graph** of entity relationships and export as `.graphml`
- Create an **interactive HTML** visualization of the ERD using D3.js or vis.js
- Export to **Excel workbook** with separate sheets per subject area
