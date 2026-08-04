# G4 — Per-Pillar Implementation Plans

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint until
its verification commands pass and their output has been shown. Do not batch
checkpoints. Preconditions are CHECKS with decision rules, not assumptions.

---

## Context

Repo `erwin`, app root `baiw/`. G1–G3 believed merged to `wip/phase-a`; CP0
verifies.

What G4 stands on — read all of it before writing anything:

- `src/dgiw/gap/register.ts` — `gapRegister` / `gapExclusions` / priority bands.
  The ONLY source of gap claims. G4 adds no second gap computation.
- `src/dgiw/data/implementationPlan.json` — 7 waves (W0…) with `pillarIds`,
  `dependsOn`, `weeks`, `objectives`, `deliverables`, `exitCriteria`, `kpis`,
  `layer`; `artefactRegister` 55 rows {id, artefact, pillarId, rung, owner,
  format, layer, builtFrom}; `first90Days`.
- `src/dgiw/report/roadmap.ts` — AR-04, `RoadmapInput`, `buildWaveScopes` /
  `buildGateScopes`, `ScopeState` ('in-scope'|'out-of-scope'|'unattached').
  Read how scope already flows before adding anything.
- `src/dgiw/components/ImplementationPlan.tsx` and `Diagnostic.tsx:124`
  (`derivedRoadmap` — tier-blind top-5; G4 REPLACES it).
- AR-55 `gapStatements.ts` — the refusal pattern (one predicate, UI shows,
  builder throws). Per-pillar plans are measurements-derived and reuse it.
- `report/programmeGap.ts` `B_*` invariant style — the new module's invariants
  are written the same way so gates can import them.

## Objective

One pure composition turns the gap register into plans:

    planSlices(entries, intake, plan, layer) -> PillarPlanSlice[]

Per in-scope pillar with a GapEntry: its gaps -> initiatives -> mapped artefact
deliverables -> wave placement -> dependencies. Consumed by: a per-pillar
implementation-plan generator (new artefact), AR-04's engagement-mode
composition, the ImplementationPlan page, and Diagnostic's replaced
derivedRoadmap. The master roadmap becomes a composition of slices, not a
hand-authored parallel claim.

## Non-negotiables

1. **No invented effort.** No person-days, FTEs, costs, or dates anywhere in G4
   output. Durations shown are the waves' own week windows, verbatim. Any
   duration-shaped statement in a generated PDF sits under a visible
   "Assumptions" block that states: windows come from the reference wave plan;
   calendar mapping and staffing are engagement decisions not made here.
2. **No invented initiatives.** Initiative lines derive ONLY from structural
   data: (a) the pillar's undelivered artefactRegister rows, (b) the pillar's
   intersection with wave objectives/deliverables, (c) the GapEntry's numbers.
   No generated prose describing what the client "should" do beyond what the
   register and waves already say. If a pillar's register rows are thin (P09
   has 1), the slice is thin — thinness is information, not a gap to pad.
3. **Structure beats priority.** Sequencing respects `dependsOn` absolutely;
   priority reorders only within what dependencies allow. A critical-band gap
   in a late wave stays in its wave — the slice SAYS the dependency holds it,
   it does not jump the queue.
4. **Single-source discipline.** Slices consume `gapRegister` output as passed
   in; no re-derivation of gap, band, or priority anywhere in `plan/`.
   Layer/tier/scope filtering through the existing predicates
   (`layerShows`-family, `intakeIsActionable`, tier machinery) — zero new
   parallel filters.
5. **Refusal over illustration.** The per-pillar plan artefact is
   engagement-only: AR-55's refusal pattern (shared predicate; UI shows;
   builder throws). AR-04 keeps its reference mode + ILLUSTRATIVE watermark;
   its slice-driven section appears only in engagement mode.
6. Gates fail first; ASCII PDF prose (D-019); spine-only text; no raw
   localStorage; scoring/projection/register math untouched; out-of-scope
   observations filed, not fixed.

---

## Checkpoint 0 — Preconditions, admin, branch

```bash
cd baiw && git status                          # clean; STOP if not
git checkout wip/phase-a && git pull
git log --grep "G3 gap engine" --oneline       # decision rule below
```

Decision rule: G3 present → proceed. Absent → STOP and report (offer the G3
fast-forward as at G3's CP0; do not silently branch from feat/g3-gap-engine).

```bash
git checkout -b feat/g4-pillar-plans
```

Admin, in this branch as agreed at G3 close:
- `git mv`/copy the three prompt files from repo root into `docs/prompts/`
  (G1, G2, G3; add G4's own file when it lands there too if present).
- Ensure `.claude-history` is in `.gitignore` and NOT committed.
- File the G3-observed refusal-channel issue as the next D-number in
  `docs/known-defects.md` (Deliverables' AR-55 button surfaces designed
  refusals through `console.error`, indistinguishable from real failures to
  the console-clean assertion). Describe; do not fix in this stage.

```bash
npm run check | tail -3                        # green baseline; record count
```

## Checkpoint 1 — Slices, pure and tested

`src/dgiw/plan/slices.ts` (new dir):

- `PillarPlanSlice`: pillarId, pillarName, entry (the GapEntry, by reference),
  deliverables: [{artefactId, artefact, rung, format, owner, builtFrom,
  waveId | null}], waves: [{waveId, name, weeks, why: 'pillar-listed',
  heldBy: string[] /* unmet dependsOn chain ids */}], sequence: ordered
  waveIds honouring dependsOn, thin: boolean (deliverable count <= 2),
  assumptions: string[] (the standard block, exported as a named constant so
  the gate and the PDF share one text).
- `planSlices(entries, intake, plan, layer)` pure; unmapped-to-any-wave
  register rows appear with `waveId: null` and are listed, not dropped.
- Exported `B_*`-style invariant statements mirroring programmeGap.ts
  conventions: B_NO_EFFORT, B_STRUCTURE_OVER_PRIORITY, B_THIN_IS_INFORMATION.
- `plan/state.ts` — thin hook wiring live stores once (gap/state.ts pattern).

Verification: tsx script with a seeded register (reuse the gap fixture
approach): in-scope pillar with entry → slice; out-of-scope pillar with entry →
no slice (and a visible exclusion via a `sliceExclusions` counterpart);
dependsOn ordering asserted against a deliberately shuffled wave list; P09
slice is thin and flagged; no digit-bearing "day"/"FTE" strings in any slice
field (assert programmatically). Show output.

## Checkpoint 2 — UI

1. `ImplementationPlan.tsx`: keep the reference wave view; add an engagement
   view (auto when `intakeIsActionable` and register non-empty): per-pillar
   cards from `planSlices` — deliverables with wave placement, held-by
   dependencies, thin flag, assumptions block, sequence strip. Banner logic as
   ProgramDesign's.
2. `Diagnostic.tsx`: REPLACE `derivedRoadmap` with a consumer of
   `gapRegister` + `planSlices` (top-band entries), adding tier + coverage
   columns to close the G3 flag. The JSON export's roadmap rows carry tier and
   coverage fields; CSV likewise if a roadmap CSV exists (check first).

Verification: extend/sibling the CDP clickthrough: seed intake + answers +
targets; ImplementationPlan shows slice cards only for in-scope entry-bearing
pillars; exclusions listed; Diagnostic roadmap rows show tier column; switch
engagement → reference view returns. Show PASS lines. `npm run check`.

## Checkpoint 3 — Generators

1. **New per-pillar implementation plan artefact** `report/pillarPlans.ts`:
   claim the next id per register conventions (AR-55 precedent — read the
   register row format and disposition-note style first; if anything catalogued
   already matches "implementation plan per pillar", STOP and report before
   creating a new id). One PDF, one section per slice: gap line (from the
   entry, with tier + coverage), deliverable table, wave sequence with held-by
   notes, thin-slice statement where applicable, the shared assumptions block
   once per document (not per section). Refusal pattern for non-actionable /
   empty register. Tier + coverage in meta and /ID digest.
2. **AR-04 composition**: engagement mode gains a "Gap-driven view" section
   composing slice sequences into the wave chart it already draws — the same
   waves annotated with which in-scope pillars' gaps each wave carries and
   their bands. Reference mode byte-identical to pre-G4 except any shared-code
   incidentals — the baseline walk must attribute every moved byte.
3. Registry/dispositions: implementationPlan.json artefactRegister gains the
   new row; programmeGap.ts IMPLEMENTED_ARTEFACT_IDS updated (its B_*
   invariants untouched — if one conflicts, STOP and report).

Verification: generate the pillar-plan PDF from seeded state: sections match
slice count exactly; assumptions block present exactly once; zero "day"/"FTE"/
currency strings; regenerate → byte-identical; digest moves when a target
changes. AR-04 reference mode: digest unchanged from pre-G4 capture OR every
moved byte attributed in writing. `npm run check`.

## Checkpoint 4 — Gates and selftest

New codes in `dgiw.mjs`, each running the compiled modules, each with isolated
selftest rows shown tripping:

- `SLICE-SOURCE` — slices contain no gap/band/priority values that differ from
  the register entries passed in (mutate an entry post-hoc; slice must reflect
  it, proving pass-through not re-derivation).
- `SLICE-DEPS` — a shuffled/mutated dependsOn produces resequencing; a
  sequence violating dependsOn trips.
- `PLAN-EFFORT` — runs the real generator output text: any /\d+\s*(person-|man-|
  p)?days?|FTE|PKR|USD/ match outside the assumptions block trips; also trips
  if the assumptions block is absent while any `weeks` string is printed.
- `PLAN-REFUSAL` — pillarPlans refuses on empty register / non-actionable
  intake (call, expect throw).
- Extend TIER-DIGEST to the new artefact.

```bash
npm run check | tail -3
timeout 400 node scripts/check/selftest.mjs | tail -3
```

## Checkpoint 5 — Close

```bash
npm run build && npm run verify
```

Baseline walk: expect the new artefact's NEW baseline, AR-04 engagement-mode
moves, Diagnostic export shape moves; anything else attributed or investigated
before commit.

```bash
git add -A && git diff --cached --stat         # walk and classify every file
git commit -m "feat(dgiw): G4 per-pillar implementation plans — planSlices composition; pillar-plan artefact (engagement-only, no invented effort); AR-04 gap-driven view; derivedRoadmap replaced tier-aware; docs/prompts; SLICE-*/PLAN-* gates"
git push -u origin feat/g4-pillar-plans
```

No merge. Final report as G1–G3: built / edited / gates+evidence / not
verified / observed-not-fixed with candidate D-numbers described, not fixed.
