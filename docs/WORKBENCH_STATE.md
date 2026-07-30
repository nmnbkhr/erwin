# WORKBENCH_STATE

Factual inventory of the `erwin` repo as it exists on disk. Read-only audit, no
changes made outside this file. Compiled 2026-07-30 against commit `33e0870`.

**Headline finding, stated once so nothing below is misread:** this repo is a
**single client-side React SPA with no backend, no server, no database, no API
and no authentication of any kind.** Sections 4 (Database), 6 (Identity/Tenancy),
7 (Audit) and 12 (Client/Engagement model) are all NOT PRESENT. All data is
hand-authored or script-generated JSON compiled into the JS bundle at build time.

---

## 1. IDENTITY

| Field | Value |
|---|---|
| Repo name | `erwin` (root `package.json` name: `erwin-workspace`) |
| Git remote | `git@github.com:nmnbkhr/erwin.git` (origin, fetch+push) |
| Current branch | `feat/dgiw-data-governance-workbench` |
| Default/main branch | `master` |
| Commit count (HEAD) | 23 |
| First commit | `b7184da` — 2026-02-27 08:23:33 +0500 — "Initial commit: Banking data model tools, prompts, and outputs" |
| Last commit | `33e0870` — 2026-07-30 16:36:20 +0500 — "fix: correct React errors and a data-contract bug across BAIW/TAIW/HAIW/COE" |
| Working tree | clean |
| Repo size | 842 MB total on disk (293 MB `.git`, ~549 MB working files incl. gitignored source documents) |

Top-level tree, depth 2 (excluding `node_modules`, `.venv`, `__pycache__`, `dist`, `build`, `.git`):

```
.
├── package.json          # root launcher only — delegates every script to baiw/
├── dev.sh                # root launcher — execs baiw/dev.sh
├── .gitignore
├── .claude/              # settings.json, settings.local.json (gitignored)
├── baiw/                 # THE APPLICATION — everything that runs is here
│   ├── package.json, package-lock.json
│   ├── index.html, vite.config.ts
│   ├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
│   ├── eslint.config.js
│   ├── vercel.json, netlify.toml, .vercelignore
│   ├── dev.sh
│   ├── README.md, APP_MAP.md
│   ├── .github/workflows/deploy.yml
│   ├── public/           # favicon.svg, godaitec-logo-white.png, _redirects, robots.txt, vite.svg
│   ├── docs/             # 11 markdown files (cmd-00..08, PROGRESS.md, wco-dm-audit-report.md)
│   ├── scripts/          # 5 python generators, check-dgiw.mjs, split-data.mjs, deploy.sh, taiw/
│   └── src/              # all application code
├── data-sources/         # inputs to the python data generators (not read by the app at runtime)
│   ├── bacr_output/, bvf_fsdm_output/, fsdm_output/
│   └── BACR - INTERVIEW MASTER - DA004462.xlsm
└── archive/              # explicitly non-running material; see archive/README.md
    ├── build-prompts/ (43 files)   design-docs/ (8)   misc/ (4)
    ├── pipeline-scripts/ (37)      pipeline-output/ (26)
    ├── pptx-authoring/ (15,440 files)  prototypes/ (2)  source-documents/ (18)
```

`archive/README.md` states — and documents having grepped to verify — that nothing
in `archive/` is read by the build, dev server or deploy.

---

## 2. STACK

**There is no backend.** No Python web framework, no ORM, no migration tool, no
database driver, no `pyproject.toml`, no `requirements.txt`, no `environment.yml`.
The 60 `.py` files in the repo are offline data-generation and document-authoring
scripts (5 in `baiw/scripts/`, 18 in `baiw/scripts/taiw/`, 37 in
`archive/pipeline-scripts/`); none is imported by the app.

Frontend, from `baiw/package.json` with versions **resolved from
`package-lock.json`** (lockfileVersion 3):

| Concern | Package | Declared range | Resolved/installed |
|---|---|---|---|
| Framework | `react` / `react-dom` | `^19.2.0` | **19.2.4** |
| Routing | `react-router-dom` | `^7.13.1` | **7.13.1** |
| Build tool | `vite` | `^7.3.1` | **7.3.1** |
| Vite React plugin | `@vitejs/plugin-react` | `^5.1.1` | — |
| Language | `typescript` | `~5.9.3` | **5.9.3** |
| Styling | `tailwindcss` + `@tailwindcss/vite` | `^4.2.1` | **4.2.1** |
| Charts | `recharts` | `^3.7.0` | **3.7.0** |
| Graph | `d3` | `^7.9.0` | **7.9.0** |
| Icons | `lucide-react` | `^0.575.0` | **0.575.0** |
| PDF | `jspdf` / `jspdf-autotable` | `^4.2.0` / `^5.0.7` | **4.2.0** / **5.0.7** |
| Raster capture | `html2canvas` | `^1.4.1` | **1.4.1** |
| File download | `file-saver` | `^2.0.5` | **2.0.5** |
| Lint | `eslint` + `typescript-eslint` | `^9.39.1` / `^8.48.0` | eslint **9.39.3** |

Package manager: **npm** (`package-lock.json`, lockfileVersion 3). Local toolchain
observed: node **v22.22.2**, npm **10.9.7**. CI pins node **20**.

Python version: NOT PRESENT — no version is declared anywhere. The scripts are
invoked as bare `python3` from `baiw/dev.sh`.

---

## 3. RUNTIME TOPOLOGY

- Docker / docker-compose: **NOT PRESENT** — no `Dockerfile`, no compose file anywhere.
- Makefile / justfile: **NOT PRESENT**.
- Everything runs **natively**. There is exactly one process: the Vite dev server
  (or a static file host serving `dist/`).

npm scripts — root `package.json` (every one is a `cd baiw && …` passthrough):

| Target | Purpose |
|---|---|
| `dev` / `start` | Start the Vite dev server |
| `build` | Production build |
| `preview` | Serve the built output |
| `lint` | Run ESLint |
| `check:dgiw` | Run the DGIW dataset integrity check |

npm scripts — `baiw/package.json`:

| Target | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Dev server on **port 5174** (set in `vite.config.ts`) |
| `build` | `node scripts/check-dgiw.mjs && tsc -b && vite build` | Dataset gate → typecheck → bundle |
| `lint` | `eslint .` | Lint (not wired into `build`) |
| `preview` | `vite preview` | Serve `dist/` |
| `deploy` | `vercel --prod` | Vercel production deploy |
| `deploy:preview` | `vercel` | Vercel preview deploy |
| `check:dgiw` | `node scripts/check-dgiw.mjs` | DGIW dataset integrity check standalone |

Shell entrypoints:

- `dev.sh` (root) — `cd baiw && exec ./dev.sh "$@"`.
- `baiw/dev.sh` — modes `dev` (npx vite, port 5174), `build` (`tsc -b && vite build`),
  `preview` (port 4173), `data` (runs `python3 scripts/prepare_data.py --repo ../data-sources --output src/data/`).
  Note: `dev.sh build` **skips** the `check-dgiw` gate that `npm run build` runs.
- `baiw/scripts/deploy.sh` — present, not audited in depth.

Build output: `dist/`. Vite manual chunks: `vendor-react`, `vendor-charts`,
`vendor-export`; `chunkSizeWarningLimit: 800`.

Hosting config exists for **both** Vercel (`vercel.json`) and Netlify
(`netlify.toml` + `public/_redirects`) — both configure SPA rewrite-to-index,
immutable asset caching, 1h JSON caching, and the headers `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 4. DATABASE

**NOT PRESENT.**

This is not "unreachable" — it does not exist. Verified by exhaustive search:

- No `.env`, `.env.example`, or any `DATABASE_URL` / connection-string variant anywhere in the repo.
- No `alembic.ini`, no `migrations/` directory, no ORM, no database driver in any manifest.
- No `docker-compose.yml` defining a database service.
- No `.sql` file that the application reads. Five `.sql` files exist
  (`data-sources/fsdm_output/fsdm_ddl_teradata.sql`,
  `data-sources/fsdm_output/profitability_star_schema.sql`,
  `data-sources/bvf_fsdm_output/fsdm_gap_extensions.sql`,
  `data-sources/bvf_fsdm_output/profitability_star_schema_enhanced.sql`,
  `archive/pipeline-output/erwin_parser_output/fsdm_ddl_teradata.sql`) — these are
  **generated Teradata DDL artefacts of the analysis pipeline**, offline outputs
  describing a hypothetical target warehouse. Nothing in the app reads them and no
  process applies them.
- No network I/O of any kind: `grep -rn "fetch(\|axios\|XMLHttpRequest\|import.meta.env" src` returns **zero matches**.

Consequently: no schemas, no tables, no enum types, no RLS, no policies, no
functions, no roles. Nothing to derive from ORM models either, because there are
no ORM models.

**What stands in for a database:** 153 JSON files (~19 MB under `baiw/src/data`,
plus 288 KB `src/dgiw/data`, 80 KB `src/alm/data`) imported as ES modules and
bundled at build time. They are loaded lazily and memoised in an in-memory
`Map` cache (`src/utils/dataLoader.ts`, `src/taiw/data/index.ts`,
`src/haiw/data/index.ts`).

Largest datasets: `data/dependencies.json` 2.9 MB, `data/attributes.json` 2.4 MB,
`data/entities.json` 1.2 MB, `data/haiw/hacrQuestions.json` 1.2 MB,
`data/relationships.json` 0.9 MB.

**All user-mutable state lives in browser storage.** Complete key inventory:

| Key | Store | Written by |
|---|---|---|
| `baiw-assessment` | localStorage | [AssessmentContext.tsx](baiw/src/context/AssessmentContext.tsx) (whole reducer state, on every change) |
| `baiw-roadmap` | localStorage | [useRoadmapState.ts](baiw/src/hooks/useRoadmapState.ts) |
| `taiw_maturity` | localStorage | [TradeMaturityAssessment.tsx](baiw/src/taiw/components/TradeMaturityAssessment.tsx) |
| `taiw_roadmap` | localStorage | [TradeRoadmapBuilder.tsx](baiw/src/taiw/components/TradeRoadmapBuilder.tsx) |
| `haiw_maturity_answers` | localStorage | [HealthMaturityAssessment.tsx](baiw/src/haiw/components/HealthMaturityAssessment.tsx) |
| `haiw_roadmap_selections` | localStorage | [HealthRoadmapBuilder.tsx](baiw/src/haiw/components/HealthRoadmapBuilder.tsx) |
| `dgiw.layer` | **sessionStorage** | [layer.ts](baiw/src/dgiw/layer.ts) — per-tab by deliberate design, documented in the file |

COE and ALM persist nothing.

---

## 5. MIGRATIONS

**NOT PRESENT.** No migration tool, no config, no version table, no revisions.
Nothing was run and nothing could be.

The nearest analogue is a **dataset integrity gate**, not a migration system:
[baiw/scripts/check-dgiw.mjs](baiw/scripts/check-dgiw.mjs) (12.6 KB, plain Node,
zero dependencies), wired into `npm run build`. It validates the nine DGIW JSON
datasets for referential integrity and semantic coherence. Failure classes it
emits: `LAYER`, `UNIQUE`, `FK`, `ENUM`, `SHAPE`, `OWNER-COMPOUND`,
`OWNER-UNRESOLVED`, `OWNER-LAYER`, `GATE`, `GATE-ORPHAN`, `GATE-DUP`, `WAVE`,
`WAVE-ORDER`, `WAVE-LAYER`, `WAVE-CYCLE`, `LAYER-COHERENCE`, `COVERAGE`,
`ROADMAP`, `CORE-CHASSIS`.

Verified by running it (read-only, touches nothing):

```
DGIW dataset check
  pillars 11  questions 55 (core 33 / banking 22)
  CDEs 76 (core 24 / banking 52)  DQ rules 115 (core 40 / banking 75)
  flows 7  steps 35  checklist 52  gates 11
  waves 7  artefacts 46  roles 10  registry 32
  OK — all checks passed
```

**This mechanism exists for DGIW only.** No equivalent gate covers the BAIW, TAIW,
HAIW, COE or ALM datasets.

---

## 6. IDENTITY, TENANCY AND AUTHORISATION

**NOT PRESENT — all three.**

- Authentication: **NOT PRESENT.** No login, no session, no JWT, no OAuth, no SSO,
  no auth library in any manifest. Every route is unconditionally public. There is
  no server to authenticate against.
- Tokens / sessions: **NOT PRESENT.**
- Tenant scoping: **NOT PRESENT** in every form — no application WHERE clauses
  (no queries), no RLS, no per-tenant schemas, no per-tenant databases.
- Roles / permissions as an authorisation mechanism: **NOT PRESENT.** No guard,
  decorator, middleware or dependency exists to quote.

The word "role" does appear in the codebase, but it is **domain content, not access
control**: `src/dgiw/roles.ts` maps job-title strings from the DGIW datasets onto
ten governance archetypes defined in `operatingModel.json`, so that a RACI can be
answered mechanically. It gates nothing.

The nearest thing to a per-user boundary is the two-value **layer filter** in DGIW
(`core` | `banking`, plus `all`) — [src/dgiw/layer.ts](baiw/src/dgiw/layer.ts) and
[src/dgiw/LayerContext.tsx](baiw/src/dgiw/LayerContext.tsx). It is a content
visibility filter over layer-tagged records (`shows(layer)`, `keep(items)`),
persisted in sessionStorage so two engagements can be open in two tabs. It is a
presentation concern with no security property.

---

## 7. AUDIT AND HISTORY

**NOT PRESENT.** No audit log, no event log, no change tracking, no soft-delete,
no `created_at`/`updated_at` convention, no append-only anything. There is no
persistence layer for such records to live in.

State handling is last-write-wins overwrite of a localStorage key. `RESET` in
[AssessmentContext.tsx](baiw/src/context/AssessmentContext.tsx) discards state
irrecoverably; `TradeMaturityAssessment`, `HealthMaturityAssessment` and
`useRoadmapState` each call `localStorage.removeItem` outright.

---

## 8. MODULE ARCHITECTURE

There **is** a module concept. It is a **convention, not a registry** — six
verticals, each a directory under `src/` (except BAIW), each with its own layout,
own sidebar, own colour, own datasets, mounted by a hand-written `<Route>` in
`App.tsx`. There is no plugin system, no manifest, no dynamic discovery.

### The six modules

| Module | One-line purpose | Code | Data | Route prefix | Routes | Layout / nav declaration | Colour |
|---|---|---|---|---|---|---|---|
| **BAIW** — Banking Analytics | Model-driven banking intelligence on the Teradata FSDM + BVF capability framework | `src/pages/`, `src/components/`, `src/hooks/`, `src/context/`, `src/utils/` (67 files, 13,527 LOC) | `src/data/*.json` + `src/data/{entities,attributes,relationships}/` | `*` (catch-all) | **18** | [Layout.tsx](baiw/src/components/layout/Layout.tsx) + [Sidebar.tsx](baiw/src/components/layout/Sidebar.tsx) `navItems` L26 | purple/blue |
| **TAIW** — Trade Analytics | Cross-border trade intelligence on the WCO Data Model v4.2 | `src/taiw/` (13 tsx, 5 ts, 7,435 LOC) | `src/data/taiw/` (20 files, 2.1 MB) | `/taiw/*` | **9** | [TaiwLayout.tsx](baiw/src/taiw/components/TaiwLayout.tsx) `navItems` L10 | teal |
| **HAIW** — Healthcare Analytics | FHIR R5-native healthcare intelligence | `src/haiw/` (14 tsx, 4 ts, 7,301 LOC) | `src/data/haiw/` (13 files, 1.9 MB) | `/haiw/*` | **10** | [HaiwLayout.tsx](baiw/src/haiw/components/HaiwLayout.tsx) `navItems` L10 | emerald |
| **COE** — Cash Optimization | Currency operations engine for vault / ATM / CIT networks | `src/coe/` (9 tsx, 2,743 LOC) | `src/data/coe/` (9 files, 64 KB) | `/coe/*` | **7** | [CoeLayout.tsx](baiw/src/coe/CoeLayout.tsx) `navItems` L9 | amber |
| **ALM** — Asset-Liability Mgmt | Treasury ALM, IRRBB, FTP, structural liquidity | `src/alm/` (9 tsx, 1 ts, 1,094 LOC) | `src/alm/data/` (9 files, 80 KB) — **colocated, unlike the above** | `/alm/*` | **7** | [AlmLayout.tsx](baiw/src/alm/AlmLayout.tsx) `navItems` L8 | indigo |
| **DGIW** — Data Governance | Governance practice: diagnostic → managed service, core chassis + banking overlay | `src/dgiw/` (13 tsx, 3 ts, 3,092 LOC) | `src/dgiw/data/` (9 files, 288 KB) — **colocated** | `/dg/*` | **9** | [DgiwLayout.tsx](baiw/src/dgiw/DgiwLayout.tsx) `navItems` L24 | rose |

Plus the suite landing at `/` ([SuiteLanding.tsx](baiw/src/components/SuiteLanding.tsx),
325 lines, no layout wrapper). Total: **61 routes** + one `NotFound` catch-all.

Note the route prefix inconsistency: DGIW's directory is `dgiw` but its URL prefix
is `/dg`. Every other module's prefix matches its directory name.

### The mechanism — how a new module is added

Three hand-edits, no registry. From [src/App.tsx](baiw/src/App.tsx):

```tsx
// 1. lazy-import the module router alongside the other five
const DgiwRoutes = lazy(() => import('./dgiw'))

// 2. mount it above the BAIW catch-all, wrapped in ErrorBoundary + Suspense
<Route path="/dg/*" element={
  <ErrorBoundary moduleName="DGIW">
    <Suspense fallback={<PageSkeleton />}>
      <DgiwRoutes />
    </Suspense>
  </ErrorBoundary>
} />
```

**Ordering is load-bearing**: BAIW is the `path="*"` catch-all and must remain last;
a new module route placed after it is unreachable.

The module's own `index.tsx` is a self-contained sub-router that supplies its own
layout (`src/<mod>/index.tsx`, all six follow the identical shape — lazy imports,
own `<Layout>`, `<Suspense fallback={<PageSkeleton />}>`, flat `<Routes>`):

```tsx
export default function DgiwRoutes() {
  return (
    <LayerProvider>          {/* module-specific providers go here */}
      <DgiwLayout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<PracticeOverview />} />
            …
          </Routes>
        </Suspense>
      </DgiwLayout>
    </LayerProvider>
  )
}
```

3. Add a card to the `modules: Module[]` array in
[SuiteLanding.tsx](baiw/src/components/SuiteLanding.tsx) L36 — `key`, `path`, `icon`,
`name`, `tagline`, `description`, `features[]`, and a hand-written `classes` object
of ~6 Tailwind class strings encoding the module's colour.

**There is no shared nav registry.** Each module hardcodes its own `navItems` array
and its own `ScrollToTop`, collapse state, and Ctrl-K handler — the same ~120 lines
of layout scaffolding are copy-pasted six times with the colour swapped.

### The one genuinely shared module chassis

[src/components/workbench/](baiw/src/components/workbench/) — a data-driven TOGAF
workbench. `WorkbenchShell.tsx` takes a single `WorkbenchData` object and renders
five tabs (Business Architecture, Data Architecture, Technology Architecture,
Use-Case Explorer, Roadmap) plus CSV/JSON export. The contract is
[workbench/types.ts](baiw/src/components/workbench/types.ts) — `WorkbenchData` with
`businessArchitecture{stakeholders,valueChain,capabilities,context}`,
`dataArchitecture{starSchema,lineage,gapExtensions}`,
`technologyArchitecture{layers,techStack,dataFlow?}`, `useCases[]`,
`roadmap{phases[]}`. Consumed by TAIW `/taiw/workbench`, HAIW `/haiw/workbench`,
ALM `/alm/workbench` via a per-module `workbench.json`.

Caveat: `src/components/profitability/` contains an **older near-duplicate** of
four of those five components (`BusinessArchitecture`, `DataArchitecture`,
`TechnologyArchitecture`, plus `ProfitabilityRoadmap`/`ProfitabilityUseCases`) —
BAIW's own workbench page predates the shared one and was not migrated.

---

## 9. SHARED SERVICES ALREADY BUILT

| Service | State |
|---|---|
| File/object storage | **NOT PRESENT** |
| Document rendering (docx/pptx/xlsx) | **NOT PRESENT in the app.** Offline only: `archive/pipeline-scripts/*.py` author PowerPoint via python-pptx; `scripts/prepare_data.py` reads `.xlsm` via openpyxl. Neither runs at request time. |
| PDF generation | **PRESENT** — `jspdf` + `jspdf-autotable`. `downloadPDF(elementId,…)` in [utils/export.ts](baiw/src/utils/export.ts) (html2canvas raster → jsPDF); `generateMaturityPDF` in [utils/reportGenerator.ts](baiw/src/utils/reportGenerator.ts) (668+ lines, vector); `generateQuickPDF` in [utils/quickPdfGenerator.ts](baiw/src/utils/quickPdfGenerator.ts); per-module twins `taiw/utils/tradeReportGenerator.ts`, `haiw/utils/healthReportGenerator.ts`. Libraries are dynamically imported so they stay out of the main chunk. |
| Export | **PRESENT** — `downloadJSON`, `downloadCSV`, `downloadPDF` in [utils/export.ts](baiw/src/utils/export.ts); `generateGapCSV`, `generateRoadmapMarkdown` in `reportGenerator.ts`; `ExportMenu` component in `components/layout/`. |
| Charting | **PRESENT** — `recharts` in 28 files (pie/bar/radar/line); `d3` in exactly **1** file (the force-directed dependency graph). |
| Background jobs / scheduling | **NOT PRESENT** |
| Caching | **PRESENT, in-memory only** — a `Map`-backed `cached()` memoiser per data layer: [utils/dataLoader.ts](baiw/src/utils/dataLoader.ts), `taiw/data/index.ts`, `haiw/data/index.ts`. Plus HTTP cache headers in `vercel.json`/`netlify.toml`. Lost on reload. |
| Email / notifications | **NOT PRESENT** |
| LLM or model client | **NOT PRESENT** — no `anthropic`, `openai` or any model SDK; zero outbound requests. |
| Search | **PRESENT, client-side** — [utils/search.ts](baiw/src/utils/search.ts) + `globalSearchLight`, surfaced through [CommandPalette.tsx](baiw/src/components/layout/CommandPalette.tsx) (Ctrl-K, debounced, over a ~300 KB `entityIndex.json` plus capabilities/domains/BACR). **BAIW only** — TAIW/HAIW/COE layouts have `searchOpen` state and a Ctrl-K handler but mount no palette; ALM and DGIW have neither. |
| Feature flags | **NOT PRESENT** |
| Settings / config service | **NOT PRESENT** — no runtime config, no env vars consumed (`import.meta.env` never referenced). |
| RBAC UI | **NOT PRESENT** |
| Admin panel | **NOT PRESENT** |

Also present and shared: `ErrorBoundary` (per-module, takes `moduleName`),
`PageSkeleton` (Suspense fallback), `NotFound`.

---

## 10. FRONTEND

**Route structure** — 61 routes. `App.tsx` splits on prefix: `/` → SuiteLanding
(bare), `/taiw/*` `/coe/*` `/haiw/*` `/alm/*` `/dg/*` → module sub-routers (each
brings its own layout), `*` → BAIW wrapped in the shared `Layout`. Every branch is
`lazy()` + `<Suspense>` + `<ErrorBoundary moduleName="…">`.

BAIW routes (18): `/dashboard` `/model` `/capabilities` `/graph` `/maturity`
`/profitability` `/customer-profitability` `/customer-profitability-workbench`
`/customer-value` `/corporate-value` `/customer-comparison` `/what-if` `/portfolio`
`/deck` `/roadmap` `/pakistan` `/cash-optimization` `/architecture`.

**Navigation shell** — six independent copies. Each module layout declares a
top-level `const navItems = [{ path, label, icon }]` (line numbers in §8) and
renders it through `NavLink` with a module-coloured active state. Each also renders
a "module switcher" pill row — **and these are inconsistent**: BAIW's Sidebar
switcher lists only Home/BAIW/TAIW/HAIW (no COE, ALM or DGIW); `Header.tsx` links
only to TAIW. `Sidebar.tsx`'s `isBaiw` check tests only `/taiw` and `/haiw`.

**Component library / design system** — **NOT PRESENT** as a package. No shadcn,
Radix, MUI, Headless UI or local `ui/` primitives directory. Every component is
hand-written Tailwind utility classes. `lucide-react` supplies icons. The only
reusable primitives are the workbench chassis (§8), `components/dashboard/*`
(StatCard, DomainDonut, CapabilityBar, MaturityRadarCard, PakistanCard,
QuickNavGrid, TopReusedChart) and `components/layout/*`.

**Theming** — Tailwind v4, configured entirely inside
[src/index.css](baiw/src/index.css) (44 lines, the only CSS file in the repo). The
`@theme` block redefines **the type scale only** — `--text-xs` through `--text-6xl`
and their line-heights, each lifted 1–2px above Tailwind defaults, with a comment
explaining this raises legibility suite-wide without touching call sites. There are
**no colour tokens, no spacing tokens, no semantic variables**. Module colour is
raw Tailwind class strings duplicated at every call site. There is **no dark mode**
(the suite landing is hardcoded dark, every module shell is hardcoded light).

**State management** — React only. One global provider, `AssessmentProvider`
(`useReducer` + localStorage rehydration/persistence,
[context/AssessmentContext.tsx](baiw/src/context/AssessmentContext.tsx)), wrapping
the whole app but consumed by BAIW alone. DGIW adds `LayerProvider` scoped to
`/dg/*`. Everything else is component-local `useState` plus four custom hooks
(`useCapabilities`, `useEntities`, `useRoadmapState`, `useSearch`). No Redux,
Zustand, Jotai, React Query or SWR.

**API client pattern** — **NOT PRESENT.** There is no API. The equivalent is the
async data-loader module (`utils/dataLoader.ts` and per-module twins): typed
`load*()` functions wrapping `import()` of a JSON file through a `Map` cache.
BAIW additionally uses `import.meta.glob` for per-domain chunked loading of
`data/entities/*.json`, `data/attributes/*.json`, `data/relationships/*.json`,
keyed by a `slugify(domainName)` of the domain name, with a `prefetchDomain()`
helper. TAIW/HAIW use a `/* @vite-ignore */` dynamic-import-by-template-string
variant instead — the two patterns are not unified.

---

## 11. TESTING AND QUALITY

**Test framework: NOT PRESENT. Test file count: 0.** No vitest, jest, playwright,
cypress or testing-library in any manifest; no `*.test.*`, `*.spec.*`, `__tests__/`
or `tests/` anywhere in the repo. **Nothing is covered by tests, in any area.**

**Coverage: NOT PRESENT** — not measured, never recorded.

**Linting** — ESLint 9 flat config, [eslint.config.js](baiw/eslint.config.js):
`js.configs.recommended`, `tseslint.configs.recommended`,
`reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`; ignores `dist`.
No Prettier. No pre-commit hook, no husky, no lint-staged. `npm run lint` is **not**
part of `npm run build`.

**Type checking** — TypeScript 5.9.3, project references
(`tsconfig.app.json` + `tsconfig.node.json`). `strict: true`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`,
`verbatimModuleSyntax`, `erasableSyntaxOnly`, `resolveJsonModule`. Deliberately
relaxed: **`noUnusedLocals: false`, `noUnusedParameters: false`**. `tsc -b` runs in
`npm run build`.

**Dataset checking** — `check-dgiw.mjs` (§5). DGIW only.

**CI** — [baiw/.github/workflows/deploy.yml](baiw/.github/workflows/deploy.yml),
named "Deploy BAIW". Steps: checkout → node 20 + npm cache → `npm ci` →
`npx tsc --noEmit` → `npm run build` → print bundle sizes. No lint step, no test
step. The deploy step is **commented out** pending a `VERCEL_TOKEN` secret.

**The workflow triggers on `push`/`pull_request` to branch `main`. No `main` branch
exists** — the default branch is `master`. As configured, this workflow has never
run and cannot run. UNVERIFIED — I did not query GitHub Actions run history to
confirm zero executions; the conclusion is from the branch list alone.

---

## 12. CLIENT / ENGAGEMENT MODEL

**NOT PRESENT.** There is no entity representing a client organisation, and none
representing a body of work for one. No table (there are no tables), no TypeScript
interface, no JSON record, no identifier. Nothing is shared across modules and no
module has its own.

What exists instead, and should not be mistaken for it:

1. **A free-text org name, per report, held only in component state.** Five
   independent `useState('')` declarations, never persisted, never shared, lost on
   navigation: `ReportGenerator.tsx:21` (`bankName`), `TradeReportGenerator.tsx:21`,
   `HealthReportGenerator.tsx:14`, `QuickAssessment.tsx:30`, `Diagnostic.tsx:51`
   (all `orgName`). Each is passed straight into a PDF generator as a title string.
   Two consecutive assessments overwrite each other's answers under the same
   localStorage key with no way to tell them apart.

2. **The word "engagement" as documentation prose**, in `dgiw/types.ts:9`,
   `dgiw/layer.ts:36-37`, `dgiw/roles.ts:5`, `dgiw/components/Diagnostic.tsx:144`,
   `dgiw/components/OnePager.tsx:99`. It denotes a *mode of running the DGIW layer
   filter* ("a core-only engagement", "a banking engagement") — not a stored object.

3. **Synthetic customer records as analytics fixtures**, not clients of the
   platform: `data/consumers.json` (3 records) and `data/corporates.json` (3), each
   keyed `id, unit, customer, archetype, costs, poolCurve, strategy, assumptions,
   products, summary, waterfall`; `data/customerProfitability.json` (an aggregate
   object with `topCustomers`/`bottomCustomers`). These are demo data for the
   customer-value pages.

---

## 13. CONVENTIONS IN FORCE

**No `CLAUDE.md` exists anywhere in the repo.** No `CONTRIBUTING`, no `ADR`
directory, no `docs/adr/`. There was no repo-root `docs/` directory before this
file — the only prior docs directory is `baiw/docs/`.

Documents that do constrain or describe:

- [baiw/README.md](baiw/README.md) — quick start, module table, tech stack. **Stale**
  (see §15).
- [baiw/APP_MAP.md](baiw/APP_MAP.md) (167 lines) — entry chain and the full route
  table, file-linked. The most useful orientation document. **Stale** (see §15).
- [baiw/docs/PROGRESS.md](baiw/docs/PROGRESS.md) — a per-module build record of what
  each of the original 8 BAIW modules contains.
- `baiw/docs/cmd-00-setup.md` … `cmd-08-pakistan-reference.md` — the original
  per-module build briefs.
- [archive/README.md](archive/README.md) — states the invariant that nothing under
  `archive/` is read by the app, and records that this was grep-verified rather
  than assumed.
- `.gitignore` (root) — excludes `*.erwin`, `*.xlsm`, `*.pptx`, `*.pdf`, `*.xsd`
  unanchored, with one negated exception for `archive/pptx-authoring/pptout/*.pptx`;
  also ignores `.claude/`.

**Naming conventions visible in the code** (observed, nowhere written down):

- Module code lives at `src/<module>/` with `index.tsx` as the route entry and
  `<Module>Layout.tsx` as the shell. BAIW is the exception — it has no directory of
  its own and occupies `src/pages/` + `src/components/`.
- Components `PascalCase.tsx`; utils/hooks/types `camelCase.ts`; hooks `use*`.
- Datasets `camelCase.json`.
- Dataset location is **inconsistent**: BAIW/TAIW/HAIW/COE datasets sit under
  `src/data/<module>/`; ALM and DGIW colocate theirs at `src/<module>/data/`.
- Types: one `types.ts` per module (`src/types.ts`, `src/taiw/types.ts`,
  `src/haiw/types.ts`, `src/dgiw/types.ts`, `src/components/workbench/types.ts`).
  COE and ALM have none.
- IDs in datasets are **short opaque strings** (`c.id`, `q.id`, `r.id`, `g.id`,
  `w.id`) — never numeric, never UUID.
- Enums are string literal unions in TS and bare strings in JSON, validated only in
  DGIW: criticality `CRITICAL|HIGH|MEDIUM`, DQ severity `BLOCKER|HIGH|MEDIUM`, DQ
  dimensions `Completeness|Validity|Accuracy|Consistency|Uniqueness|Timeliness|Integrity`,
  weight `1|2|3`, layer `core|banking`.
- **No timestamp convention, no id-type convention, no soft-delete convention, no
  schema/table-name convention** — there is nothing for them to apply to.
- Comment style, notable: DGIW files (`layer.ts`, `roles.ts`, `types.ts`,
  `check-dgiw.mjs`) carry long *why*-oriented header comments explaining the defect
  or decision that motivated the code. This style is confined to DGIW; the rest of
  the codebase is sparsely commented.

---

## 14. OPEN WORK

**TODO / FIXME / HACK / XXX markers: zero.** `grep -rn "TODO\|FIXME\|HACK\|XXX"`
across `src/` and `scripts/` returns no matches.

Docs describing planned-but-unbuilt work:

- `baiw/.github/workflows/deploy.yml` — the Vercel deploy step is commented out,
  awaiting `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets.
- `archive/build-prompts/` (43 files) and `archive/design-docs/` (8) — the prompt
  and design corpus the app was generated from. Includes
  `DPS_MARKET_WATCH_POLLER_PROMPT.md` (a "DPS Market Watch Poller" that has **no
  corresponding code** — it was untracked at the repo root at the start of this
  session and has since been committed into `archive/build-prompts/`),
  `suite-output-strategy-customer-deliverables.md`,
  `baiw-fix-audit-gaps-prompt.md`, `taiw-master-execution-guide.md`.
- `baiw/docs/wco-dm-audit-report.md` (10.8 KB) — a TAIW data audit.

Branches, newest commit first:

| Branch | Last commit | Subject |
|---|---|---|
| `feat/dgiw-data-governance-workbench` **(current, local only)** | 2026-07-30 | fix: correct React errors and a data-contract bug across BAIW/TAIW/HAIW/COE |
| `master` (local) | 2026-07-27 | feat: add ALM, TAIW, HAIW deep TOGAF workbenches + shared workbench components |
| `origin/master` | 2026-07-27 | chore: run from repo root + ext4-native dev (drop NTFS workarounds) |
| `feature/quick-assessment` (local only) | 2026-03-14 | Add Quick Assessment mode (24 Qs, 10 min) |
| `feature/taiw-reports` (local only) | 2026-03-14 | Add TAIW report generator |
| `feature/baiw-reports` / `origin/…` | 2026-03-14 | feat(baiw): PDF/CSV/Markdown report generation |
| `feature/taiw-wco-dm-enrichment` / `origin/…` | 2026-03-14 | feat(taiw): enrich WCO DM data from real v4.2.0 source |
| `feature/coe-use-case` / `origin/…` | 2026-03-14 | feat(baiw): Cash Optimization Engine as Page 9 |

Local `master` is **two commits ahead** of `origin/master`; the current branch is
local-only and unpushed. Four March feature branches remain unmerged.

---

## 15. FACTS I SHOULD KNOW BUT WASN'T ASKED

1. **The two orientation documents are stale and will mislead you.**
   `README.md` says "React 18", "React Router v6", port **5173**, and lists 8
   modules — all wrong. `docs/PROGRESS.md` repeats "React 18 / Router v6".
   `APP_MAP.md` is closer but says "four industry workbenches … plus the
   ALM/IRRBB module", omitting DGIW entirely, and its top-level route table has no
   `/dg/*` row. Ground truth: React **19.2.4**, Router **7.13.1**, port **5174**,
   **six** modules. Trust `App.tsx` and `package-lock.json`, not the prose.

2. **The suite landing quotes dataset numbers that contradict the datasets.**
   Its DGIW card claims "56 Pre-mapped CDEs · 81 DQ Rules"; the actual files hold
   **76 CDEs and 115 DQ rules**. Its BAIW card claims "793 questions";
   `bacrQuestions.json` holds **804**. Its TAIW card claims "727 elements";
   `taiw/dataElements.json` holds **1,107** (the `index.json` stats agree at 1,107).
   Verified counts: FSDM entities 3,917 · BVF capabilities 112 · domains 16 ·
   BACR 804 · WCO elements 1,107 / capabilities 100 / TACR 640 · FHIR resources 157 /
   HCF capabilities 108 / HACR 720 · COE use cases 10 · ALM use cases 8 ·
   DGIW pillars 11 / questions 55 / CDEs 76 / DQ rules 115. The marketing copy is
   hand-maintained and drifts; nothing checks it.

3. **CI is inert.** The one workflow fires only on `main`, and there is no `main`.

4. **`npm run build` and `./dev.sh build` are not equivalent.** The first runs
   `check-dgiw` then `tsc -b` then `vite build`; the second runs only
   `npx tsc -b && npx vite build`. Building through `dev.sh` silently skips the
   only dataset validation in the repo.

5. **`git status` was clean but the tree had changed under this session.** The
   snapshot taken at session start showed HEAD at `17f94a8` with
   `DPS_MARKET_WATCH_POLLER_PROMPT.md` untracked at the root; by the time I read
   the repo, HEAD was `33e0870` and that file had been moved into
   `archive/build-prompts/` and committed. Nothing in this document was written
   from the stale snapshot, but be aware the repo moved recently.

6. **`.claude/settings.json` is checked into the working tree but gitignored**, and
   its contents point at a **different, stale checkout**: seven allow-rules and one
   `additionalDirectories` entry reference `/mnt/e/erwin/...`, plus a `Read` rule for
   `/home/adnoman/projects/wco_data_model/...`. The canonical repo is `~/erwin`
   (ext4); `APP_MAP.md` and both `dev.sh` files document the move off `/mnt/e` NTFS.
   Those settings paths no longer resolve.

7. **`src/data/taiw_backup_20260314/` is a live 17-file, ~1.2 MB copy of the TAIW
   datasets that nothing imports** (grep for `taiw_backup` in `src/` returns
   nothing). It is dead weight inside the source tree, not in `archive/`.

8. **Six empty component directories exist**: `src/components/{capabilities, graph,
   maturity, model, pakistan, roadmap}/`. They imply an intended per-page component
   split that was never carried out — those pages are single large files under
   `src/pages/`.

9. **Duplication is the dominant structural fact.** Six copy-pasted layout shells
   (~120 lines each, differing by colour and `navItems`); three near-identical PDF
   report generators (`reportGenerator.ts`, `taiw/utils/tradeReportGenerator.ts`,
   `haiw/utils/healthReportGenerator.ts`); two parallel data-loader idioms
   (`import.meta.glob` in BAIW vs `/* @vite-ignore */` template-string imports in
   TAIW/HAIW); two generations of workbench components (`components/workbench/` vs
   `components/profitability/`). A seventh module added by convention inherits all
   of this.

10. **The whole ~19 MB of JSON is bundled into the client.** Chunked lazily by
    domain, but every byte is a static asset shipped to the browser. There is no
    server-side filtering and no pagination; a dataset that grows has no place to
    grow into.

11. **DGIW is visibly the newest and most rigorously built module** — it is the only
    one with a dataset integrity gate, the only one with a documented layer model
    (`core` vs `banking`, tagged on every record), the only one with a role registry
    resolving free-text owner strings to archetypes, and the only one whose source
    carries *why*-comments. If a new module is being planned, DGIW is the pattern to
    copy; BAIW is the pattern that accreted.

12. **The Ctrl-K search is half-wired.** TAIW, HAIW and COE layouts all declare
    `const [searchOpen, setSearchOpen] = useState(false)` and register a Ctrl-K
    keydown listener, but never render a `CommandPalette`. The keystroke is captured
    and `preventDefault()`ed, so the browser default is suppressed and nothing opens.

13. **`git` history is short and coarse** — 23 commits over five months, several of
    them adding an entire module at once ("feat: add ALM, TAIW, HAIW deep TOGAF
    workbenches"). History will not help you understand why any individual decision
    was made; the `archive/build-prompts/` corpus is closer to a design record.
