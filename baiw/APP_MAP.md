# BAIW Suite — App Map (entry point → every route)

Single-page React app (Vite + React 19 + react-router-dom v7). One codebase hosts
four industry workbenches — **BAIW** (banking), **TAIW** (trade), **HAIW** (health),
**COE** (cash-optimization COE) — plus the **ALM/IRRBB** module and the customer-value suite.

Project root: `~/erwin/baiw` (`/home/smnb/erwin/baiw`, on ext4)  ·  Dev URL: **http://localhost:5174**

---

## How the app starts

The project lives on ext4, so `node_modules` runs natively — no symlink, no polling, no workarounds.

```bash
cd ~/erwin/baiw
npm run dev          # → http://localhost:5174   (or: ./dev.sh)

# stop it: Ctrl-C in that terminal
```

> Historical note: this project used to sit on `/mnt/e` (NTFS, mounted `noexec` with
> `fmask=133`), which blocked executables and dropped symlinks — so `node_modules` had
> to be relocated to ext4 and symlinked back. Moving the whole repo to `~/erwin` (ext4)
> removed all of that.

---

## Entry chain (the "whole path")

```
~/erwin/baiw/index.html            Vite HTML root — <div id="root">, loads /src/main.tsx
        │
        ▼
~/erwin/baiw/src/main.tsx          createRoot(#root).render(<App/>), imports ./index.css
        │
        ▼
~/erwin/baiw/src/App.tsx           <BrowserRouter> + <AssessmentProvider>; top-level route split
```

- Entry HTML: [index.html](index.html)
- Bootstrap: [src/main.tsx](src/main.tsx)
- Router root: [src/App.tsx](src/App.tsx)
- Global styles: [src/index.css](src/index.css)
- Vite config (port 5174, vendor chunks): [vite.config.ts](vite.config.ts)

---

## Top-level routes — [src/App.tsx](src/App.tsx)

| URL | Renders | File |
|-----|---------|------|
| `/` | Suite landing (no layout) | [src/components/SuiteLanding.tsx](src/components/SuiteLanding.tsx) |
| `/taiw/*` | TAIW router (own layout) | [src/taiw/index.tsx](src/taiw/index.tsx) |
| `/coe/*` | COE router (own layout) | [src/coe/index.tsx](src/coe/index.tsx) |
| `/haiw/*` | HAIW router (own layout) | [src/haiw/index.tsx](src/haiw/index.tsx) |
| `/alm/*` | ALM router (own layout) | [src/alm/index.tsx](src/alm/index.tsx) |
| `*` | **BAIW** app (shared `Layout`) | nested routes below |

Each `/module/*` branch has its own sidebar/layout; the catch-all `*` is BAIW, wrapped in
[src/components/layout/Layout.tsx](src/components/layout/Layout.tsx) (sidebar + header).

---

## BAIW routes (`*`, wrapped in `Layout`) — [src/App.tsx](src/App.tsx)

| URL | Page | File |
|-----|------|------|
| `/dashboard` | Dashboard | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) |
| `/model` | Model Explorer | [src/pages/ModelExplorer.tsx](src/pages/ModelExplorer.tsx) |
| `/capabilities` | Capability Navigator | [src/pages/CapabilityNavigator.tsx](src/pages/CapabilityNavigator.tsx) |
| `/graph` | Dependency Graph | [src/pages/DependencyGraph.tsx](src/pages/DependencyGraph.tsx) |
| `/maturity` | Maturity Assessment | [src/pages/MaturityAssessment.tsx](src/pages/MaturityAssessment.tsx) |
| `/profitability` | Profitability Engine | [src/pages/ProfitabilityEngine.tsx](src/pages/ProfitabilityEngine.tsx) |
| `/customer-profitability` | Customer Profitability | [src/pages/CustomerProfitability.tsx](src/pages/CustomerProfitability.tsx) |
| `/customer-value` | Consumer 360° Value | [src/pages/CustomerValue.tsx](src/pages/CustomerValue.tsx) |
| `/corporate-value` | Corporate 360° Value | [src/pages/CorporateValue.tsx](src/pages/CorporateValue.tsx) |
| `/customer-comparison` | Strategy Matrix | [src/pages/CustomerComparison.tsx](src/pages/CustomerComparison.tsx) |
| `/what-if` | What-If Lab | [src/pages/WhatIfLab.tsx](src/pages/WhatIfLab.tsx) |
| `/portfolio` | Portfolio Roll-Up | [src/pages/PortfolioRollup.tsx](src/pages/PortfolioRollup.tsx) |
| `/deck` | Use-Case Deck | [src/pages/UseCaseDeck.tsx](src/pages/UseCaseDeck.tsx) |
| `/roadmap` | Roadmap Builder | [src/pages/RoadmapBuilder.tsx](src/pages/RoadmapBuilder.tsx) |
| `/pakistan` | Pakistan Reference | [src/pages/PakistanReference.tsx](src/pages/PakistanReference.tsx) |
| `/cash-optimization` | Cash Optimization Engine | [src/components/CashOptimizationEngine.tsx](src/components/CashOptimizationEngine.tsx) |
| `*` (unmatched) | Not Found | [src/components/layout/NotFound.tsx](src/components/layout/NotFound.tsx) |

Sidebar nav: [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)

---

## ALM / IRRBB routes (`/alm/*`) — [src/alm/index.tsx](src/alm/index.tsx)

| URL | Page | File |
|-----|------|------|
| `/alm` | ALM Dashboard | [src/alm/components/AlmDashboard.tsx](src/alm/components/AlmDashboard.tsx) |
| `/alm/usecases` | Use-Case Explorer | [src/alm/components/UseCaseExplorer.tsx](src/alm/components/UseCaseExplorer.tsx) |
| `/alm/irrbb` | IRRBB Analysis | [src/alm/components/IrrbbAnalysis.tsx](src/alm/components/IrrbbAnalysis.tsx) |
| `/alm/liquidity` | Liquidity Analysis | [src/alm/components/LiquidityAnalysis.tsx](src/alm/components/LiquidityAnalysis.tsx) |
| `/alm/ftp` | FTP Decomposition | [src/alm/components/FtpDecomposition.tsx](src/alm/components/FtpDecomposition.tsx) |
| `/alm/data-coverage` | Data Coverage | [src/alm/components/DataCoverage.tsx](src/alm/components/DataCoverage.tsx) |

Layout: [src/alm/AlmLayout.tsx](src/alm/AlmLayout.tsx)  ·  Data: [src/alm/data/](src/alm/data/)

---

## TAIW routes (`/taiw/*`) — [src/taiw/index.tsx](src/taiw/index.tsx)

| URL | Page | File |
|-----|------|------|
| `/taiw` | TAIW Dashboard | [src/taiw/components/TaiwDashboard.tsx](src/taiw/components/TaiwDashboard.tsx) |
| `/taiw/model` | WCO Model Explorer | [src/taiw/components/WCOModelExplorer.tsx](src/taiw/components/WCOModelExplorer.tsx) |
| `/taiw/capabilities` | TCF Capability Navigator | [src/taiw/components/TCFCapabilityNavigator.tsx](src/taiw/components/TCFCapabilityNavigator.tsx) |
| `/taiw/graph` | Trade Dependency Graph | [src/taiw/components/TradeDependencyGraph.tsx](src/taiw/components/TradeDependencyGraph.tsx) |
| `/taiw/maturity` | Trade Maturity Assessment | [src/taiw/components/TradeMaturityAssessment.tsx](src/taiw/components/TradeMaturityAssessment.tsx) |
| `/taiw/analytics` | Trade Analytics Engine | [src/taiw/components/TradeAnalyticsEngine.tsx](src/taiw/components/TradeAnalyticsEngine.tsx) |
| `/taiw/roadmap` | Trade Roadmap Builder | [src/taiw/components/TradeRoadmapBuilder.tsx](src/taiw/components/TradeRoadmapBuilder.tsx) |
| `/taiw/pakistan` | Pakistan Trade Reference | [src/taiw/components/PakistanTradeReference.tsx](src/taiw/components/PakistanTradeReference.tsx) |

Layout: [src/taiw/components/TaiwLayout.tsx](src/taiw/components/TaiwLayout.tsx)

---

## HAIW routes (`/haiw/*`) — [src/haiw/index.tsx](src/haiw/index.tsx)

| URL | Page | File |
|-----|------|------|
| `/haiw` | HAIW Dashboard | [src/haiw/components/HaiwDashboard.tsx](src/haiw/components/HaiwDashboard.tsx) |
| `/haiw/model` | FHIR Resource Explorer | [src/haiw/components/FHIRResourceExplorer.tsx](src/haiw/components/FHIRResourceExplorer.tsx) |
| `/haiw/capabilities` | HCF Capability Navigator | [src/haiw/components/HCFCapabilityNavigator.tsx](src/haiw/components/HCFCapabilityNavigator.tsx) |
| `/haiw/graph` | Health Dependency Graph | [src/haiw/components/HealthDependencyGraph.tsx](src/haiw/components/HealthDependencyGraph.tsx) |
| `/haiw/maturity` | Health Maturity Assessment | [src/haiw/components/HealthMaturityAssessment.tsx](src/haiw/components/HealthMaturityAssessment.tsx) |
| `/haiw/analytics` | Health Analytics Engine | [src/haiw/components/HealthAnalyticsEngine.tsx](src/haiw/components/HealthAnalyticsEngine.tsx) |
| `/haiw/roadmap` | Health Roadmap Builder | [src/haiw/components/HealthRoadmapBuilder.tsx](src/haiw/components/HealthRoadmapBuilder.tsx) |
| `/haiw/pakistan` | Pakistan Health Reference | [src/haiw/components/PakistanHealthReference.tsx](src/haiw/components/PakistanHealthReference.tsx) |
| `/haiw/use-cases` | Healthcare Use Cases | [src/haiw/components/HealthcareUseCases.tsx](src/haiw/components/HealthcareUseCases.tsx) |

Layout: [src/haiw/components/HaiwLayout.tsx](src/haiw/components/HaiwLayout.tsx)

---

## COE routes (`/coe/*`) — [src/coe/index.tsx](src/coe/index.tsx)

| URL | Page | File |
|-----|------|------|
| `/coe` | COE Dashboard | [src/coe/components/CoeDashboard.tsx](src/coe/components/CoeDashboard.tsx) |
| `/coe/usecases` | Use-Case Explorer | [src/coe/components/UseCaseExplorer.tsx](src/coe/components/UseCaseExplorer.tsx) |
| `/coe/gametheory` | Game-Theory Map | [src/coe/components/GameTheoryMap.tsx](src/coe/components/GameTheoryMap.tsx) |
| `/coe/revenue` | Revenue Engine | [src/coe/components/RevenueEngine.tsx](src/coe/components/RevenueEngine.tsx) |
| `/coe/architecture` | System Architecture | [src/coe/components/SystemArchitecture.tsx](src/coe/components/SystemArchitecture.tsx) |
| `/coe/roadmap` | Implementation Roadmap | [src/coe/components/ImplementationRoadmap.tsx](src/coe/components/ImplementationRoadmap.tsx) |
| `/coe/data-coverage` | Data-Model Coverage | [src/coe/components/DataModelCoverage.tsx](src/coe/components/DataModelCoverage.tsx) |

---

## Shared building blocks

- Layout / chrome: [src/components/layout/](src/components/layout/) — `Layout`, `Sidebar`, `Header`, `PageSkeleton`, `ErrorBoundary`, `NotFound`, `CommandPalette`
- Customer-value engine (Py-parity): [src/utils/profitability.ts](src/utils/profitability.ts)
- Shared strategy card: [src/components/CustomerStrategy.tsx](src/components/CustomerStrategy.tsx)
- Global assessment state: [src/context/AssessmentContext.tsx](src/context/AssessmentContext.tsx)
- BAIW data (BVF): [src/data/](src/data/) — `capabilities.json`, `enrichment.json`, `dataRequirements.json`, `mappings.json`, `entities.json`, `consumers.json`, `corporates.json`, `customerProfitability.json`
</content>
