# Module 3 — BVF Capability Navigator

> Route: `/capabilities` | Status: DONE | Lines: 331

## Files Created

```bash
src/pages/CapabilityNavigator.tsx    # 331 lines (self-contained)
```

## What It Renders

Three-panel layout (full viewport height):

- **Left panel (300px)** — BVF Hierarchy Tree
  - 3 themes (color-coded accordion): blue=Marketing, amber=Finance, green=Product
  - 12 groups (nested accordion with sub-cap count)
  - 112 sub-capabilities (click to load detail)

- **Center panel (flex)** — Capability Detail
  - Breadcrumb: Theme > Group > Sub-Capability
  - Description text
  - Phase badge (Phase 1/2/3 with timeline)
  - **Data Requirements** section: numbered list from dataRequirements.json
  - **Required FSDM Entities** section: chip/pill list with domain colors (clickable → Model Explorer)
  - **Pakistan Banking Context** section: 4 subsections (Objectives, Data Sources, Expected Outcomes, Key Challenges)
  - **Implementation** section: Phase, estimated investment (PKR), quick wins flag

- **Right panel (250px)** — Related Capabilities
  - Top 5 most similar from reuse matrix
  - Similarity percentage
  - Click → navigates to that capability

## Data Dependencies

```
capabilities.json       → 112 capabilities (hierarchy tree + detail)
dataRequirements.json   → 113 requirements (filtered by capabilityId)
dependencies.json       → 5,218 cap→entity deps (FSDM entity chips)
reuseMatrix.json        → 500 similarity pairs (related capabilities)
```

## URL Parameters

| Param | Effect |
|-------|--------|
| `?theme=Marketing+%26+Customer+Experience` | Expands that theme in tree |
| `?cap={capId}` | Selects and shows that capability's detail |

## Cross-Navigation

| Click | Navigates To |
|-------|-------------|
| FSDM entity chip | `/model?search={entityName}` |
| Related capability | Same page (selects different capability) |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/capabilities
# Verify: expand theme → group → click sub-capability
# Verify: data requirements list, FSDM entity chips, related capabilities
# Verify: entity chips navigate to Model Explorer
# Verify: click capability bar from Dashboard arrives here filtered
```
