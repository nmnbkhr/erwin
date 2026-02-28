# Module 4 — Dependency Graph

> Route: `/graph` | Status: DONE | Lines: 317

## Files Created

```bash
src/pages/DependencyGraph.tsx    # 317 lines (self-contained, uses D3.js)
```

## What It Renders

Full-viewport interactive force-directed network visualization:

- **Nodes:**
  - 12 BVF Capability Groups (large circles, colored by theme)
  - 16 FSDM Domains (medium circles, distinct colors)

- **Edges:**
  - Lines connecting capability groups to domains they depend on
  - Thickness proportional to dependency count (more deps = thicker line)

- **Controls panel** (top-left overlay):
  - Filter by theme (3 checkboxes: Marketing, Finance, Product)
  - Show/hide labels toggle
  - Highlight P1 entities toggle
  - Legend: capability vs domain nodes

- **Interactions:**
  - Hover node → tooltip (name, type, connection count)
  - Click domain node → navigates to Model Explorer (filtered by domain)
  - Click capability node → navigates to Capability Navigator (filtered by theme)
  - Drag nodes to reposition
  - Scroll to zoom, pan canvas

## Data Dependencies

```
capabilities.json   → 112 capabilities (grouped into 12 groups + 3 themes)
dependencies.json   → 5,218 cap→entity deps (build group→domain edge weights)
domains.json        → 16 domains (node data)
```

## D3 Force Simulation Config

```
forceLink     → distance: 120
forceManyBody → strength: -300
forceCenter   → center of SVG
forceCollide  → radius + 5px padding
zoom          → scaleExtent: [0.3, 3]
```

## Cross-Navigation

| Click | Navigates To |
|-------|-------------|
| Domain node | `/model?domain={domainName}` |
| Capability group node | `/capabilities?theme={themeName}` |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/graph
# Verify: nodes render with correct colors, edges connect them
# Verify: toggle theme filters — nodes appear/disappear
# Verify: drag nodes, zoom in/out, hover for tooltips
# Verify: click nodes navigate to correct modules
```
