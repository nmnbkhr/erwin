# Module 7 — Roadmap Builder

> Route: `/roadmap` | Status: DONE | Lines: 287

## Files Created

```bash
src/pages/RoadmapBuilder.tsx    # 287 lines (self-contained)
```

## What It Renders

Two-column layout:

### Left Column — Capability Picker

- **Quick Templates** (5 pre-built):

| Template | Capabilities | Description |
|----------|-------------|-------------|
| Quick Wins | 6 | Foundation capabilities achievable in Phase 1 |
| Profitability Engine | 8 | Comprehensive profitability analytics |
| Regulatory Compliance | 6 | Regulatory and compliance capabilities |
| Digital Transformation | 7 | Digital channel analytics |
| Full BVF | 112 | All capabilities |

- **Multi-select checkboxes:**
  - Organized by group (12 groups, collapsible)
  - Shows selected count per group
  - Clear all button
  - Running count: `Selected X/112`

### Right Column — Generated Roadmap

- **3-Phase Gantt-style Timeline:**

| Phase | Timeline | Type | Color |
|-------|----------|------|-------|
| Phase 1 | 0-6 months | Foundation | Green |
| Phase 2 | 6-18 months | Optimization | Blue |
| Phase 3 | 18-36 months | Advanced Analytics | Purple |

- Each phase card shows:
  - Capability count + PKR investment estimate
  - FSDM entity count + data requirement count
  - Capability name chips

- **Investment Summary:**
  - Total PKR investment range (scales with selection)
  - Capabilities selected count
  - FSDM entities required count
  - Expected ROI metrics

## Data Dependencies

```
capabilities.json   → 112 capabilities (picker + phase assignment)
dependencies.json   → 5,218 cap→entity deps (entity count per phase)
```

## Template Capability Mappings

```
Quick Wins:
  Customer Profitability, Reconciliation, Close Process,
  Regulatory Reporting, KPI Factory, Liquidity

Profitability Engine:
  Profitability, ABC, RAROC, FTP, Revenue Analytics,
  Loan Pricing, Performance Mgmt, Budget

Regulatory Compliance:
  Regulatory Reporting, External Reporting, Exception Reporting,
  AML, KYC, Basel Reporting

Digital Transformation:
  Omni-channel, Digital Onboarding, Card Spend, Mobile Analytics,
  Campaign Management, NBA/NBO, A/B Testing
```

## Investment Scale

| Selected | Estimated PKR |
|----------|--------------|
| 0 | PKR 0 |
| 1-10 | PKR 200-500M |
| 11-30 | PKR 500M-1.5B |
| 31-60 | PKR 1.5-3B |
| 61+ | PKR 3-5B |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/roadmap
# Verify: click "Quick Wins" template → 6 caps selected, 3-phase timeline renders
# Verify: manually check/uncheck capabilities, timeline updates
# Verify: investment summary changes with selection
# Verify: "Full BVF" selects all 112, "Clear" deselects all
```
