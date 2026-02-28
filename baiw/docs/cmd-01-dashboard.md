# Module 1 — Dashboard

> Route: `/` | Status: DONE | Lines: 259

## Files Created

```bash
# Components
src/components/dashboard/StatCard.tsx        # 22 lines
src/components/dashboard/DomainDonut.tsx      # 61 lines
src/components/dashboard/CapabilityBar.tsx    # 51 lines
src/components/dashboard/PakistanCard.tsx     # 29 lines
src/components/dashboard/TopReusedChart.tsx   # 36 lines

# Page
src/pages/Dashboard.tsx                       # 60 lines
```

## What It Renders

- **Stats ribbon** (top): 4 cards
  - 3,917 FSDM Entities (blue)
  - 112 BVF Capabilities (amber)
  - 793 BACR Questions (violet)
  - 16 FSDM Domains (emerald)

- **2×2 grid** (below):
  - Top-left: Donut chart — entities by domain (top 8 + Other)
  - Top-right: Horizontal bar chart — capabilities by theme (3 bars)
  - Bottom-left: Pakistan Banking Metrics card (PKR 35T, 33 banks, 16K branches, 17.5% rate, 47% CASA, 7.5% NPL)
  - Bottom-right: Top 10 Most Reused FSDM Entities bar chart

## Data Dependencies

```
domains.json        → DomainDonut (16 domains)
capabilities.json   → CapabilityBar (112 capabilities → 3 themes)
reuseScores.json    → TopReusedChart (top 10 by reuseCount)
```

## Cross-Navigation

| Click | Navigates To |
|-------|-------------|
| Domain slice in donut | `/model?domain=Party+Management` |
| Theme bar | `/capabilities?theme=Marketing+%26+Customer+Experience` |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/
# Verify: 4 stat cards, 4 chart panels, all data populated
```
