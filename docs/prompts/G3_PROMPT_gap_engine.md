# G3 — The Gap Engine

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint until
its verification commands pass and their output has been shown. Do not batch
checkpoints. Preconditions are CHECKS with decision rules, not assumptions.

---

## Context

Repo `erwin`, app root `baiw/`. G1 and G2 are believed merged to `wip/phase-a`;
Checkpoint 0 verifies rather than assumes.

What G3 stands on — read all of it before writing anything:

- `src/dgiw/assessmentState.ts` — `dgiw.targets` (per-pillar 1–5), `dgiw.tier`.
- `src/dgiw/answerShape.ts` — `normaliseAnswers`, `answerScores`, `answerEvidence`.
- `src/dgiw/scoring.ts` — `scorePillars`, `PillarOutcome`, `PillarState`,
  `RANK_MIN_CONFIDENCE`; tier-aware via `applicableQuestions`.
- `src/dgiw/projection.ts` — `projectAll`, `decompose`, `inducedPillarWeights`;
  `data/crosswalk.json` — `coverageWeight` = share-of-this-dimension (read the
  `_note`; do not re-derive semantics).
- `src/dgiw/intake/` — `ProgramIntake` (drivers with primary-by-reference, scope
  pillars), `intakeIsActionable`.
- `report/aiReadiness.ts` (AR-06) — the existing gap-statement SHAPE: subject
  pillar + dependency pillars + level thresholds. Currently tier-blind (flagged
  at G2 close) — G3 fixes that here.
- `report/programmeGap.ts` (AR-54) — programme-level gap vs the artefact
  register; heavily invariant-commented (`B_*` exports feed gates). Read the
  comments; they are load-bearing.
- Diagnostic page CSV/JSON exports — tier-filtered but missing a tier column
  (flagged at G2 close; two-line rider here).

## Objective

One pure function of assessment state becomes the source of every gap claim:

    gapRegister(answers, targets, tier, layer, intake) -> GapEntry[]

Consumed by: a new Gap Register page, a new per-pillar gap statement generator
(AR-06 generalised), the four framework scorecards (gap columns), and AR-54's
maturity dimension. Nothing downstream computes target − current itself, ever —
the register is to gaps what `layerShows` is to layers and `intakeIsActionable`
is to modes.

## Non-negotiables

1. **A gap requires two measurements.** A pillar with no target set, or with
   `PillarState` ≠ 'scored' at the active tier, produces NO GapEntry — never a
   zero, never a default target, never an assumed current. Absence is absence.
2. **Priority is derived, stated, and reproducible.** Priority = f(gap size,
   pillar decisiveness, driver alignment). Driver alignment comes from a new
   explicit `driverPillars` mapping in the intake types (regulatory driver →
   pillar ids), filled by the consultant — NEVER inferred by string-matching
   driver names against pillar names. Unmapped drivers contribute nothing. The
   PDF states the formula and each entry's inputs; no unexplained ranks.
3. **Tier honesty inherited.** Every gap artifact carries `assessmentTier` +
   coverage in meta and /ID digest (G2 machinery — reuse, don't duplicate).
   AR-06 joins the tier-carrying set as part of this stage.
4. **Crosswalk references are projections, not new claims.** A GapEntry's
   framework references list the dimensions that map to the pillar (via the
   existing engine), with `coverageWeight` shown under its documented
   share-of-dimension semantics. No invented "framework gap scores".
5. **Scoring and projection math untouched.** `scorePillars`, `projectAll`,
   crosswalk data: read-only this stage.
6. Gates fail first; single-predicate discipline; spine-only text; ASCII in PDF
   prose (D-019); no raw localStorage; observed-out-of-scope → filed, not fixed.

---

## Checkpoint 0 — Verify preconditions, then branch

```bash
cd baiw && git status                      # must be clean; STOP if not
git checkout wip/phase-a && git pull
git log --oneline -6
```

Decision rule: if `wip/phase-a` contains G2 (`903d16a` or its rebased
equivalent — verify by `git log --grep "G2 assessment depth" --oneline`), branch
from `wip/phase-a`. If it does not, STOP and report; do not silently branch
from `feat/g2-assessment-depth`.

```bash
git checkout -b feat/g3-gap-engine
npm run check | tail -3                    # green baseline; record gate count
```

## Checkpoint 1 — The register, pure and tested

`src/dgiw/gap/register.ts` (new dir `src/dgiw/gap/`):

- `GapEntry`: pillarId, current (number, from `PillarOutcome`), target (1–5),
  gap (target − current; may be ≤ 0 — a met/exceeded target is reported as
  such, not filtered), tier, coverage {answered, applicable}, priority
  {score, band: 'critical'|'high'|'moderate'|'met', inputs: {gapSize,
  decisiveness, driverAlignment, driverIds}}, frameworkRefs: [{frameworkId,
  dimensionId, coverageWeight}], evidencePresent (boolean per pillar — any
  answered question in the pillar carries evidence).
- Priority formula: implement as named constants with a doc comment deriving
  the bands; bands must be reachable (a selftest row later proves each band
  occurs under some fixture).
- Pure function: no hooks, no storage reads — callers pass state in. A thin
  `useGapRegister()` in `src/dgiw/gap/state.ts` wires the live stores.
- `driverPillars` added to `ProgramIntake` (`intake/types.ts`): per driver, an
  array of pillar ids validated against `pillars.json` (extend the existing
  INTAKE-SCOPE fixture — no parallel fixture). ProgramDesign.tsx gains the
  mapping control inside the drivers section. Bump/migrate intake shape per the
  established migration idiom.

Verification: a node script (tsx, absolute imports) driving `gapRegister` with
a hand-built fixture: pillar with both measurements → entry; pillar missing
target → absent; pillar not-assessed at tier → absent; negative gap → present
with band 'met'; driver mapped → driverAlignment > 0, unmapped → 0. Show output.

## Checkpoint 2 — Gap Register page

`src/dgiw/components/GapRegister.tsx`, route `/gaps` between Diagnostic and
Service Ladder:

- Table from `useGapRegister()`: pillar, current, target, gap, priority band
  with its three inputs visible (expandable row or inline — consultant must be
  able to answer "why is this critical?" from the screen), framework refs,
  evidence indicator. Sort by priority score.
- Empty-state honesty: pillars excluded for missing measurements are LISTED
  under the table with the reason ("no target set" / "not assessed at Quick
  tier") — exclusion is visible, not silent.
- CSV export of the register through the shared CSV path, tier column included.
  Same stage: add the missing tier column to the Diagnostic page's existing
  CSV/JSON exports (the G2 rider).

Verification: extend the diagnostic clickthrough (or sibling script): set two
targets, answer at Quick, open /gaps — two rows plus exclusion list; set a
target with no answers — appears in exclusions not table; CSV downloads with
tier column. Show PASS lines. `npm run check`.

## Checkpoint 3 — Generators

1. **New: per-pillar gap statement (one PDF, all pillars with entries).**
   `report/gapStatements.ts`, new artefact id — check `implementationPlan.json`'s
   register for the correct AR id to claim, or add a new register row following
   the register's own conventions (read how AR-54's `IMPLEMENTED_ARTEFACT_IDS`
   and the disposition notes work FIRST; G1's AR-08 re-disposition is the
   precedent). Each pillar section: current/target/gap, priority with stated
   inputs, framework refs table, evidence appendix lines where present,
   AR-06-style dependency framing where the crosswalk shows the pillar's induced
   weight concentrated elsewhere. Engagement-mode only artifact: with
   `intakeIsActionable` false OR zero GapEntries, the generator refuses with a
   clear UI message — an ILLUSTRATIVE gap register is a contradiction; there is
   no reference mode for measurements.
2. **AR-06 joins tier honesty.** `aiReadiness.ts`: accepts tier-filtered
   answers, carries `assessmentTier`/coverage in meta + digest, tier line beside
   its scores. Its P11-specific logic and level thresholds untouched.
3. **Framework scorecards:** per-dimension rows gain a projected-target and gap
   column ONLY for dimensions where every contributing pillar (per
   `inducedPillarWeights`) has a target; otherwise the cell is em-dash-empty
   with a footnote line explaining the rule once. No partial-target arithmetic.
4. **AR-54:** add a maturity-gap section sourced from the register (top-band
   entries), clearly separated from its artefact-register dimension. Its `B_*`
   invariants untouched; if any invariant conflicts, STOP and report.

Verification: generate the gap statement PDF from clickthrough-seeded state and
inspect: formula stated, no placeholder strings, exclusions absent (not padded);
regenerate → byte-identical; digest differs between a two-target and
three-target state. AR-06 before/after digest differs (tier now in digest —
expected baseline move). `npm run check`.

## Checkpoint 4 — Gates and selftest

New codes in `dgiw.mjs` (+ selftest rows, each branch isolated, shown tripping):

- `GAP-PAIR` — no GapEntry without both measurements: run the real register
  against mutated fixtures (missing target present in output → trip).
- `GAP-PRIORITY` — every band reachable across the fixture set; formula
  constants referenced from the module, not re-declared in the gate.
- `GAP-DRIVER` — driverPillars ids ⊂ pillars.json; string-similarity inference
  absent (grep-level: no fuzzy/includes matching between driver names and
  pillar names in `src/dgiw/gap/`).
- `GAP-REFUSAL` — the gap-statement generator refuses on empty register /
  non-actionable intake (call it, expect refusal, not an empty PDF).
- Extend TIER-DIGEST's expectations to AR-06 and the new generator.

```bash
npm run check | tail -3
timeout 400 node scripts/check/selftest.mjs | tail -3
```

All new rows trip; real tree green.

## Checkpoint 5 — Close

```bash
npm run build && npm run verify            # or verify:quick if verify is the long path
```

Re-baseline: expect AR-06 (tier line + digest), scorecards (gap columns where
fixture targets allow), AR-54 (new section), one NEW baseline for the gap
statement. Walk the baseline diff; any OTHER artifact moving bytes is a finding
to explain before committing.

```bash
git add -A && git diff --cached --stat     # walk and classify every file
git commit -m "feat(dgiw): G3 gap engine — gapRegister as the single gap function; /gaps page; gap-statement generator (engagement-only, refuses without measurements); AR-06 tier honesty; scorecard gap columns; AR-54 maturity section; GAP-* gates"
git push -u origin feat/g3-gap-engine
```

No merge. Final report as G1/G2: built / edited / gates+evidence / not verified /
observed-not-fixed with candidate D-numbers described, not fixed.
