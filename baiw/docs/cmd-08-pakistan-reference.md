# Module 8 — Pakistan Banking Reference

> Route: `/pakistan` | Status: DONE | Lines: 228

## Files Created

```bash
src/pages/PakistanReference.tsx    # 228 lines (self-contained, 4 tabs)
```

## What It Renders

Four tabs:

### Regulatory Framework Tab

- **SBP Key Rates** — grid cards:
  - Policy Rate, KIBOR 3M, KIBOR 6M, KIBOR 12M, Minimum Savings Rate, etc.

- **Basel III Requirements** — table:
  - CAR (≥11.5%), Tier 1 (≥9%), CET1 (≥6.5%)
  - LCR (≥100%), NSFR (≥100%)
  - Leverage Ratio (≥3%)

- **IFRS 9 ECL Framework** — 3 stage cards:
  - Stage 1: 12-month ECL (performing, no SICR)
  - Stage 2: Lifetime ECL (significant increase in credit risk)
  - Stage 3: Lifetime ECL (credit-impaired, NPL)

- **Tax Rates** — table:
  - Corporate tax (39% + 10% super tax)
  - WHT on dividends (15% filer / 30% non-filer)
  - Zakat (2.5% on deposits)

### Industry Metrics Tab

- **Banking Sector Overview** — metric cards:
  - 33 banks, 5 Islamic banks, PKR 35T total assets
  - 16,000+ branches, 16,000+ ATMs
  - 20.4% Islamic banking share

- **Key Financial Ratios** — bordered cards:
  - NIM ~3.5%, Cost-to-Income ~45%, NPL 7.5%
  - CASA 47%, ADR ~52%, ROE ~25%

### Islamic Banking Tab

- **Product Modes Table** — 10 Islamic banking modes:

| Mode | Type | Use Case | FSDM Entity | P&L Treatment |
|------|------|----------|-------------|---------------|
| Murabaha | Cost-plus sale | Consumer/trade finance | Islamic_Agreement | Deferred profit |
| Ijarah | Lease | Vehicle/equipment | Lease_Agreement | Rental income |
| Diminishing Musharaka | Partnership | Home financing | Partnership_Agreement | Profit share |
| Musharaka | Joint venture | Corporate | Partnership_Agreement | Profit/loss share |
| Wakalah | Agency | Investment deposits | Investment_Agreement | Agency fee |
| Salam | Forward sale | Agriculture | Commodity_Agreement | Delivery profit |
| Istisna | Manufacturing | Construction | Construction_Agreement | Progress billing |
| ...and more | | | | |

### Payment Ecosystem Tab

- **Payment Infrastructure** — 2-column cards:
  - PRISM (RTGS), Raast (instant payments), 1LINK (ATM/POS switch), NIFT (cheque clearing)

- **Fintech Ecosystem** — 2-column cards:
  - JazzCash (50M+ users), Easypaisa (40M+), SadaPay, NayaPay

## Data Dependencies

```
pakistanContext.json → regulatory framework, industry metrics, Islamic modes, payments
```

## Pakistan Context JSON Structure

```json
{
  "regulatoryFramework": {
    "sbpRates": [...],
    "baselIII": [...],
    "ifrs9": [...],
    "taxRates": [...]
  },
  "industryMetrics": {
    "overview": [...],
    "ratios": [...]
  },
  "islamicBanking": {
    "modes": [...]
  },
  "paymentEcosystem": {
    "infrastructure": [...],
    "fintechs": [...]
  }
}
```

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/pakistan
# Verify: Regulatory tab — SBP rates render, Basel III table, IFRS 9 stages, tax rates
# Verify: Industry tab — sector overview cards, financial ratios
# Verify: Islamic Banking tab — modes table with entity mappings
# Verify: Payments tab — infrastructure + fintech cards
```
