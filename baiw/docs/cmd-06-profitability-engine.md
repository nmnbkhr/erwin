# Module 6 — Profitability Engine

> Route: `/profitability` | Status: DONE | Lines: 284

## Files Created

```bash
src/pages/ProfitabilityEngine.tsx    # 284 lines (self-contained, 3 tabs)
```

## What It Renders

Three tabs:

### Star Schema Tab

- **SVG ERD visualization:**
  - FACT_CUSTOMER_PROFITABILITY at center (gold background, 42 columns)
  - 7 DIM tables arranged around it (blue backgrounds)
  - 2 AGG tables on left (green backgrounds)
  - FK relationship lines (dashed) connecting them

- **Expandable table details** (below ERD):
  - Click any table → shows column list (name, dataType, description)
  - Pakistan-specific columns highlighted with emerald color + asterisk
  - Color-coded borders: gold=fact, blue=dimension, green=aggregate, violet=view

- **Tables:**
  - FACT_CUSTOMER_PROFITABILITY (42 cols, 35+ measures)
  - DIM_CUSTOMER, DIM_PRODUCT, DIM_BRANCH, DIM_BUSINESS_SEGMENT, DIM_CHANNEL, DIM_TIME, DIM_AGREEMENT
  - AGG_BRANCH_PROFITABILITY, AGG_SEGMENT_PROFITABILITY
  - VW_CUSTOMER_PL, VW_PRODUCT_PL, VW_ISLAMIC_VS_CONVENTIONAL

### P&L Builder Tab

- **16-line profitability waterfall:**

```
 1. Gross Interest Income         [Revenue — green]
 2. - Interest Expense            [Cost — red]
 3. = Net Interest Income (NII)   [Subtotal — bold]
 4. +/- FTP Adjustment            [Adjustment — amber]
 5. = FTP-Adjusted NII            [Subtotal — bold]
 6. + Fee & Commission Income     [Revenue — green]
 7. + FX & Trading Income         [Revenue — green]
 8. + Other Income                [Revenue — green]
 9. = Total Income                [Subtotal — bold blue]
10. - Direct Operating Costs      [Cost — red]
11. - ABC Allocated Costs         [Cost — red]
12. = Operating Profit            [Subtotal — bold]
13. - IFRS 9 ECL Provision        [Cost — red]
14. = Profit Before Capital       [Subtotal — bold]
15. - Capital Charge (RWA×CoE)    [Cost — red]
16. = Economic Profit (EVA)       [Final — bold gold]
```

- Click any line → expands to show:
  - Source FSDM entities (chips)
  - Calculation formula (monospace)
  - Pakistan context notes (KIBOR, SBP, IFRS 9 stages, etc.)

### Gap Extensions Tab

- **5 module cards:**
  1. Activity Based Costing (6 tables)
  2. Customer Lifetime Value (3 tables)
  3. Budgets & Forecasts (4 tables)
  4. Business Process Management (4 tables)
  5. Operational Metrics (4 tables)

- Click to expand → table list with columns and descriptions

## Data Dependencies

```
starSchema.json      → 1 fact + 7 dims + 2 aggs + 3 views (table details)
gapExtensions.json   → 5 modules, 21 tables (gap tab)
```

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/profitability
# Verify: Star Schema tab — SVG ERD renders, click tables to expand columns
# Verify: Pakistan-specific columns highlighted (sbp_*, islamic_*, kibor_*, cnic_*)
# Verify: P&L Builder — 16 lines with correct colors, click to expand details
# Verify: Gap Extensions — 5 modules expand with tables
```
