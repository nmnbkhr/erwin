# G1 — Engagement-Driven Program Design

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint until its
verification commands pass and their output has been shown. Do not batch checkpoints.

---

## Context

Repo: `erwin` (app root `baiw/`, all paths below relative to `baiw/` unless noted).
Work branches from **`wip/phase-a`** — NOT master. The DGIW Waves A–D generators live
only on this branch; branching from master would orphan them.

What exists and must not be reinvented:

- Engagement identity: `src/engagement/` — `useEngagement()`, `usePersistedState`,
  `nsKey(base, engagementId)`, storage keys prefixed `wb.`. All new state MUST go
  through `usePersistedState` so it is namespaced per engagement. No raw
  `localStorage` calls anywhere in new code.
- DGIW module: `src/dgiw/` — pages in `components/`, routes in `index.tsx`,
  data in `data/`, generators in `report/` (24 AR generators), shared entry
  `report/useDeliverable.ts`.
- Report spine: `src/report/` — `spine.ts`, `provenance.ts`, `naming.ts`, `order.ts`.
  Every PDF save goes through the spine and carries provenance meta. `doc.text()`
  with `maxWidth` is banned (D-004); the TEXT-MAXWIDTH gate enforces this.
- Gates: `scripts/check/modules/dgiw.mjs` (module checks), `scripts/check/suite/`
  (suite-wide), `scripts/check/selftest.mjs` (mutation selftest — 95 mutations,
  59 codes on this branch). Every new check ships with selftest mutations and is
  demonstrated FAILING before it is trusted.
- Reference content: `src/dgiw/data/programSetup.json` — flows F1… with steps.
  This stays as reference/illustrative material. G1 does not delete it.

## Objective

DGIW's program-design stage becomes engagement-driven. A consultant fills an intake
for the active engagement; the charter (AR-01), council terms of reference, and
stakeholder RACI are generated FROM that intake. When no intake exists, generators
fall back to the reference content — but every page of such output is watermarked
ILLUSTRATIVE. Canned content presented as client-specific is a D-001-class defect.

## Non-negotiables

1. No fabricated specificity. Every client-specific string in a generated PDF must
   trace to an intake field or be absent. No invented names, dates, budgets, counts.
2. Fallback honesty. Reference-mode output carries an ILLUSTRATIVE watermark on every
   page and a provenance flag `mode: 'reference'`.
3. Spine only. All PDF text through spine helpers. No direct `doc.text` with
   `maxWidth`. All saves through the provenance-carrying exits.
4. Gates fail first. Each new check is shown tripping on a deliberate mutation before
   the checkpoint closes.
5. Diffs are walked. At each commit, list every changed file and classify the change.
   No inline opportunistic fixes to unrelated code — file them as defects instead.

---

## Checkpoint 0 — Branch

```bash
cd baiw && git status              # must be clean; stop if not
git checkout wip/phase-a && git pull
git checkout -b feat/g1-program-design
npm run check && npm run check:selftest   # record the green baseline
```

Show output. STOP if baseline is not green (except the known GEOMETRY-OVERFLOW
selftest row when `scripts/golden/raw/` is absent — note it and continue).

## Checkpoint 1 — Intake schema and state

Create `src/dgiw/intake/types.ts`:

- `ProgramIntake` with sections:
  - `org`: name, sector (enum: banking | trade | health | public | other), size band
  - `drivers`: regulatory (free list, e.g. SBP, BCBS 239), strategic (free list),
    primary driver (one of the above, referenced by index — no duplication)
  - `scope`: pillar ids in scope (subset of the 11 `P\d{2}` pillar ids from
    `data/pillars.json` — validate against it, never a second hardcoded list)
  - `sponsorship`: sponsor role title, council chair role title, cadence
    (enum: monthly | quarterly), escalation path (short text)
  - `raci`: rows of { activity, R, A, C, I } where R/A/C/I are role titles;
    seed activities from a small constant list, user-editable
  - `meta`: completedAt (ISO string | null), version literal `1`
- Every field optional except org.name. `intakeIsActionable(intake)` returns true
  only when org.name, ≥1 driver, and ≥1 in-scope pillar exist. This predicate is
  the ONLY thing that switches generators out of reference mode — one function,
  imported everywhere, never re-derived (same principle as `layerShows`).

Create `src/dgiw/intake/state.ts`: load/save via `usePersistedState` under base key
`dgiw.intake` (namespacing comes from the engagement layer — do not build your own).

Verification: `tsc -b` clean; a small node script or unit assertion showing
`intakeIsActionable` false for empty, true for minimal intake. Show output.

## Checkpoint 2 — Intake UI

New page `src/dgiw/components/ProgramDesign.tsx`, route `/design` in
`src/dgiw/index.tsx`, nav order: between Practice Overview and Diagnostic.

- Sections mirror the schema. Plain controlled inputs, existing `ui.tsx` primitives.
- Pillar scope selector renders from `data/pillars.json` — id + name, checkboxes.
- RACI editor: table with add/remove row. No drag-and-drop; keep it boring.
- A status banner: "Intake actionable — generators will produce client-specific
  output" vs "Intake incomplete — generators run in ILLUSTRATIVE reference mode",
  driven by `intakeIsActionable` (the imported one).
- No HTML `<form>` element; onClick/onChange handlers only.

Verification: `npm run dev`, visit `/dgiw/design` (adjust to actual mount path —
check how index.tsx is mounted), fill minimal intake, reload page, values persist,
switch engagement, values are empty for the other engagement, switch back, values
return. Describe what was observed. Then `npm run check`.

## Checkpoint 3 — Generator rewiring

Touch exactly three generators; walk their current code before editing:

1. `report/operatingModel.ts` (council ToR + RACI live here — confirm by reading;
   if council content actually lives elsewhere, STOP and report before editing).
2. The AR-01 charter generator (locate by grepping `AR-01` in `report/`).
3. `report/useDeliverable.ts` only if the shared entry needs the intake handle.

For each: accept the intake (plumbed from the page through existing call paths —
follow how other generators receive engagement state), and:

- Actionable intake → org name, drivers, scope pillars, sponsor/chair titles, RACI
  rows appear in the PDF; sections whose intake fields are empty are OMITTED, not
  filled with placeholders. Provenance meta gains `mode: 'engagement'`.
- Non-actionable → current reference behaviour, plus ILLUSTRATIVE watermark on every
  page (spine helper — add one if none exists, in `src/report/spine.ts`, so BAIW/
  TAIW/HAIW can reuse it later) and provenance `mode: 'reference'`.

Verification: generate all three PDFs twice (reference mode, then with the minimal
intake), open/inspect, confirm watermark presence/absence and that no placeholder
strings ("TBD", "Client", "XYZ") appear in engagement mode. `npm run check`.

## Checkpoint 4 — Gates

Add to `scripts/check/modules/dgiw.mjs`:

- `INTAKE-SCOPE` — every pillar id in a stored intake fixture exists in
  pillars.json (guard the validate-against-dataset promise).
- `INTAKE-MODE` — grep-level static check: the three touched generators import
  `intakeIsActionable` from `intake/types` and do not contain a second inline
  actionability predicate.
- Extend PROVENANCE-COVERAGE expectations if the new save paths need it (read
  `scripts/check/suite/provenance-coverage.mjs` first; do not guess its mechanics).

Add selftest mutations for each new code in `scripts/check/selftest.mjs` following
the existing mutation table pattern. Then:

```bash
npm run check:selftest    # new rows must TRIP
npm run check             # and the real tree must PASS
```

Show both outputs. A new code that never trips is decoration — checkpoint fails.

## Checkpoint 5 — Close

```bash
npm run build
npm run verify 2>/dev/null || npm run verify:quick
git add -A
git diff --cached --stat     # walk it: list every file, classify each change
git commit -m "feat(dgiw): G1 engagement-driven program design — intake, /design page, AR-01/ToR/RACI generation with reference-mode watermark, INTAKE gates"
git push -u origin feat/g1-program-design
```

Do NOT merge to wip/phase-a or master. Final report: files added/changed with one
line each, gate rows added, selftest counts before/after, any defects observed but
NOT fixed (file them with the next D-number in docs/known-defects.md format —
describe, do not fix).
