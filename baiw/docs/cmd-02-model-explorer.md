# Module 2 — FSDM Model Explorer

> Route: `/model` | Status: DONE | Lines: 325

## Files Created

```bash
src/pages/ModelExplorer.tsx    # 325 lines (self-contained, no sub-components)
```

## What It Renders

Three-panel layout (full viewport height):

- **Left panel (280px)** — Domain tree
  - 16 collapsible domains
  - Color dot per domain
  - Entity count badge
  - First 50 entities per domain, "Load more" button
  - Click entity → loads detail in center panel

- **Center panel (flex)** — Entity detail card
  - Entity name (large, monospace)
  - Domain badge (colored)
  - Reuse tier badge (P1=red, P2=orange, P3=yellow, P4=gray)
  - Description text
  - Attributes table (name, dataType, nullable) — up to 50 rows
  - Relationships section: parent pills + child pills (clickable → navigate to that entity)

- **Right panel (260px)** — Used By Capabilities
  - Lists BVF capabilities that depend on selected entity
  - Click → navigates to Capability Navigator

- **Top** — Search bar with fuzzy matching across entity name, domain, description

## Data Dependencies

```
entities.json       → 3,917 entities (domain tree + detail)
attributes.json     → 15,364 attributes (filtered by entityId)
relationships.json  → 5,636 parent→child relationships (filtered by entityId)
domains.json        → 16 domains (tree structure)
dependencies.json   → 5,218 cap→entity deps (right panel: filtered by entityId)
reuseScores.json    → 219 reuse scores (tier badge)
```

## URL Parameters

| Param | Effect |
|-------|--------|
| `?search=Party` | Pre-fills search bar, filters entities |
| `?domain=Transaction` | Expands and filters to that domain |

## Cross-Navigation

| Click | Navigates To |
|-------|-------------|
| "Used By" capability | `/capabilities?cap={capId}` |
| Parent/child pill | Same page (selects different entity) |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/model
# Verify: expand domain, click entity, see attributes + relationships
# Verify: search works, "Used By" panel populates
# Verify: click domain from Dashboard donut arrives here filtered
```
