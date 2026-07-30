# erwin — Phase A: engagement identity

The blocking defect. Today every module writes to one fixed localStorage key, so
a second client's assessment silently overwrites the first. Five separate
free-text `orgName` useStates are never persisted at all. You cannot run UBL and
a second bank without losing one.

Entirely client-side. No backend. Roughly a day.

**Before pasting:** put `CLAUDE.md` at the repo root. Claude Code reads it every
session and it corrects the stale README that would otherwise mislead it.

**Session hygiene:** `/clear` first. One prompt. Stop at the verification step.
`git commit` on green.

---

## The prompt

```
Read CLAUDE.md first.

Goal: suite-wide engagement identity, so two clients' work cannot collide.
Client-side only. Do not add a backend, database, API or auth layer.

THE DEFECT
Every module persists to a single fixed localStorage key:
  baiw-assessment · baiw-roadmap · taiw_maturity · taiw_roadmap ·
  haiw_maturity_answers · haiw_roadmap_selections
Start a second engagement and the first is overwritten with no way to tell them
apart. Separately, five components hold the client's name in unpersisted
component state: ReportGenerator.tsx:21 (bankName), TradeReportGenerator.tsx:21,
HealthReportGenerator.tsx:14, QuickAssessment.tsx:30, dgiw/Diagnostic.tsx:51
(all orgName). Those five must read the active engagement instead.

BUILD — new shared module, suite-level not DGIW-only

src/engagement/types.ts
  export interface Engagement {
    id: string            // crypto.randomUUID()
    orgName: string
    createdAt: string     // ISO
    updatedAt: string
    layer?: 'core' | 'banking' | 'all'   // DGIW default for this engagement
    notes?: string
  }

src/engagement/storage.ts
  Two unnamespaced suite keys:
    wb.engagements       Engagement[]
    wb.engagement.active string | null
  And the namespacing primitive every module will use:
    export function nsKey(base: string, engagementId: string): string
      -> `${base}::${engagementId}`
  Wrap every localStorage read/write in try/catch. A quota error or a
  JSON.parse failure must degrade to empty state, never throw into a render.

src/engagement/migrate.ts
  Runs once on first load. THIS MUST NOT LOSE DATA — it is the whole risk of
  this change.
  If wb.engagements is absent AND any of the six legacy keys exists:
    1. create one Engagement named "Legacy engagement" (orgName '', a fixed
       sentinel id so the migration is idempotent)
    2. for each legacy key present, COPY its value to nsKey(base, legacyId)
    3. write wb.engagements and wb.engagement.active
    4. leave the original keys in place, untouched
  Do not delete the legacy keys in this phase. Removal is a later cleanup once
  the migration is proven in the browser. Log a one-line console summary of what
  was migrated.

src/engagement/EngagementContext.tsx
  EngagementProvider + useEngagement() exposing:
    engagements, active (Engagement | null), create(orgName), rename(id, name),
    remove(id), setActive(id), duplicate(id), exportOne(id), importOne(file)
  create() and setActive() update wb.engagement.active. Every mutation stamps
  updatedAt. remove() also deletes every nsKey(base, id) for the six bases.
  exportOne() produces a single JSON file: the Engagement plus every namespaced
  value found for it — download via the existing file-saver dependency.
  importOne() validates shape, assigns a fresh id, and writes the namespaced
  values under it.

src/engagement/usePersistedState.ts
  export function usePersistedState<T>(base: string, initial: T)
  Reads/writes nsKey(base, activeId). When active engagement changes it
  RE-READS for the new id rather than carrying stale state across. When there is
  no active engagement it behaves as plain useState with no persistence.
  This replaces the six ad-hoc localStorage call sites.

WIRE UP

1. App.tsx — wrap EngagementProvider OUTSIDE AssessmentProvider. Call the
   migration once before first paint. Do not disturb the existing route order:
   BAIW stays the path="*" catch-all and must remain last.

2. Replace the six ad-hoc persistence sites with usePersistedState, keeping the
   same base key strings:
     context/AssessmentContext.tsx        'baiw-assessment'
     hooks/useRoadmapState.ts             'baiw-roadmap'
     taiw/components/TradeMaturityAssessment.tsx   'taiw_maturity'
     taiw/components/TradeRoadmapBuilder.tsx       'taiw_roadmap'
     haiw/components/HealthMaturityAssessment.tsx  'haiw_maturity_answers'
     haiw/components/HealthRoadmapBuilder.tsx      'haiw_roadmap_selections'
   AssessmentContext currently persists whole reducer state on every change —
   preserve that behaviour exactly, only namespaced.

3. The five orgName/bankName useStates: read active.orgName as the value and
   call rename() on edit. Keep the input in place — it becomes the way you name
   the engagement — but it must no longer be component-local.

4. src/components/shared/EngagementSwitcher.tsx — ONE component, imported by all
   six module layouts. See CLAUDE.md: there are already six copy-pasted layout
   shells; do not paste a seventh variant of this. Dropdown listing engagements
   with orgName and relative updatedAt, plus New / Rename / Duplicate / Export /
   Import / Delete. Delete requires typed confirmation of the orgName. Accept a
   single `accent` prop for the module colour rather than hardcoding six copies.
   Add exactly one import and one element to each of:
     components/layout/Layout.tsx (or Header.tsx), taiw/components/TaiwLayout.tsx,
     haiw/components/HaiwLayout.tsx, coe/CoeLayout.tsx, alm/AlmLayout.tsx,
     dgiw/DgiwLayout.tsx

5. DGIW layer: today dgiw.layer is sessionStorage by deliberate design, so two
   engagements can be open in two tabs — the header comment in src/dgiw/layer.ts
   documents this. Engagement.layer now makes that redundant. Change LayerContext
   to initialise from active.layer and write back through rename-style update,
   and UPDATE THE HEADER COMMENT in layer.ts to record why the sessionStorage
   rationale no longer applies. Do not silently drop a documented decision.

CONSTRAINTS
- No new npm dependencies. file-saver and lucide-react are already present.
- Tailwind utility classes only; there is no component library in this repo.
- tsc -b must pass with strict: true.
- Do not touch any file under archive/.
- Do not modify any dataset JSON.

VERIFY — run these and paste the output. Do not proceed past this point.
  npm run build          # runs check-dgiw, then tsc -b, then vite build
  npm run lint

Then in the browser, confirm and report each:
  a  a repo with existing localStorage data shows "Legacy engagement" on first
     load with its answers intact
  b  creating a second engagement gives empty assessments; switching back
     restores the first's answers unchanged
  c  the org name in a generated PDF matches the active engagement
  d  export produces a JSON file; import into a fresh browser profile
     reconstructs the engagement
  e  deleting an engagement removes its namespaced keys and leaves others intact
  f  DGIW layer selection persists per engagement, not per tab
  g  the switcher renders in all six module headers

Stop. Report. Do not start Phase B.
```

---

## Why this ordering

Phase A is first because it is the only defect that makes the suite unusable for
a second client, and because everything after it depends on knowing which
engagement you're in.

**Phase B — DGIW artifact generation.** 46 artefacts are catalogued and none is
rendered. DGIW is the only module without a report generator, while BAIW, TAIW
and HAIW each have one — and those three are near-identical, so Phase B should
extract the shared spine rather than write a fourth clone. This is the phase that
produces what a client actually pays for.

**Phase C — framework projection.** DAMA-DMBOK, DCAM, DGI and COBIT crosswalks
over the existing 11 pillars and 55 questions, as new layer-tagged datasets plus
computation, with `check-dgiw.mjs` extended to assert crosswalk weight sums and
projection reconciliation. Pure client-side. This is the IP — one assessment,
four framework scorecards — and it's the reason a bank picks you over a Big 4
diagnostic.

**Phase D — backend.** Only when browser storage genuinely fails you: multi-user
on one engagement, an audit trail a regulator will accept, or datasets too large
to bundle. When that comes it is a *suite* project, not DGIW's, because all six
modules share the collision problem — and `canon_p0_schema_v4.sql` is already
the reviewed design for it. Shelve it, don't discard it.

One small thing worth folding into Phase B or C: extend `check-dgiw.mjs` to
assert that the counts hardcoded in `SuiteLanding.tsx` match the datasets. Four
of them are currently wrong, and nothing catches it.
