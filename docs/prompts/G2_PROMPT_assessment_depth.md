# G2 — Assessment Depth: Tiers, Evidence, Target-State

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint until its
verification commands pass and their output has been shown. Do not batch checkpoints.

---

## Context

Repo `erwin`, app root `baiw/`. Branch from **`wip/phase-a`** (G1 is merged there:
intake under `src/dgiw/intake/`, ILLUSTRATIVE watermark + `mode` in the spine meta,
INTAKE-SCOPE/INTAKE-MODE gates, AR-08 charter).

The diagnostic machinery G2 extends — read all of it before writing anything:

- `src/dgiw/data/diagnostic.json` — 55 questions (33 `core`, 22 `banking` overlay),
  anchored 1–5 scale, weight 1–3, pillar ids `P\d{2}`.
- `src/dgiw/answers.ts` — `DIAGNOSTIC_ANSWERS_KEY`, `isAnswerMap`,
  `useDiagnosticAnswers()`.
- `src/dgiw/scoring.ts` — `applicableQuestions`, `scorePillars`, `overallScore`,
  `PillarState`, `PillarOutcome`, `RANK_MIN_CONFIDENCE`.
- `src/dgiw/components/Diagnostic.tsx` (537 lines) — the assessment page.
- `src/dgiw/projection.ts` + the four framework scorecards — downstream consumers.
- The AR-01 maturity diagnostic generator (`report/diagnosticReport.ts`) — NOTE:
  AR-01 is the diagnostic report in this register, not the charter (G1 lesson).

## Objective

Three additions, one principle. Additions: **(a)** three assessment tiers —
Quick / Standard / Deep Dive — as nested question subsets; **(b)** an optional
evidence note per answer, because a maturity score without evidence is an opinion;
**(c)** a target maturity level per pillar, because target − current is the single
gap function everything in G3+ derives from. Principle: **no manufactured
precision** — a Quick-tier score is directional, and every artifact that carries a
score must also carry the tier and coverage it was measured at.

## Non-negotiables

1. Tier nesting is an invariant, not a convention: every Quick question is a
   Standard question; every Standard question is a Deep Dive question. Switching
   tiers never hides an answered question's answer from scoring at a higher tier
   and never counts an answer from outside the active tier.
2. The layer axis (core/banking) and the tier axis are orthogonal. Do not merge,
   alias, or derive one from the other. `applicableQuestions` composes both.
3. Scoring semantics unchanged: `scorePillars` math is not edited — it receives a
   tier-filtered question set through the existing applicability path. Confidence /
   coverage reporting must reflect the smaller denominator honestly.
4. Stored-answer migration is lossless. Existing users have `{questionId: number}`
   maps under `DIAGNOSTIC_ANSWERS_KEY`. Follow the `src/engagement/migrate.ts`
   pattern; `isAnswerMap` learns both shapes; no stored answer is ever dropped.
5. Targets are per pillar, integer 1–5, captured only — G2 displays current vs
   target and persists it; the gap register/statements are G3's scope. Do not
   build G3 early.
6. Gates fail first; diffs walked; no raw localStorage; spine-only PDF text;
   defects observed but out of scope get filed, not fixed.

---

## Checkpoint 0 — Branch

```bash
cd baiw && git status                       # clean, on wip/phase-a with G1 merged
git checkout wip/phase-a && git pull
git checkout -b feat/g2-assessment-depth
npm run check && timeout 400 node scripts/check/selftest.mjs | tail -3
```

Record the green baseline (gate count, selftest rows/codes). STOP if not green.

## Checkpoint 1 — Tier gate BEFORE tier data

Write the gate first so it can be watched failing on real untagged data:

- In `scripts/check/modules/dgiw.mjs`, add `TIER-NESTING`:
  - every question has `tier` ∈ {quick, standard, deep};
  - nesting holds by construction: tier is the MINIMUM tier at which the question
    appears (a `quick` question is in all three sets; `deep` only in Deep Dive);
  - every pillar has ≥1 quick-tier question in the `core` layer — a pillar that
    Quick mode cannot see at all would silently report `not-assessed`;
  - tier does not correlate degenerately with layer: at least one `banking`
    question sits below `deep` (guards against "overlay = deep" laziness).

Run `npm run check` — show `TIER-NESTING` FAILING on the untagged dataset.

Then tag all 55 questions in `diagnostic.json`. Tagging judgment: quick = the
highest-signal question per pillar (usually weight 3); standard = the full core
chassis plus the decisive overlay questions; deep = everything. Aim for roughly
11–15 quick / 33–40 standard / 55 deep; exact counts are editorial, the gate's
structural rules are not. Re-run `npm run check` — show it passing.

## Checkpoint 2 — Answer schema and migration

- New stored shape per answer: `{ score: number, evidence?: string }`. Map-level
  version key or shape-sniffing per `migrate.ts` conventions — read that file and
  match its approach, don't invent a second migration idiom.
- `isAnswerMap` accepts legacy and new shapes; a read of a legacy map upgrades it
  in memory; first write persists the new shape.
- New persisted store `dgiw.targets` (via `usePersistedState`): `{ [pillarId]:
  1|2|3|4|5 }`. Validate pillar ids against `pillars.json` at the gate level
  (extend INTAKE-SCOPE's fixture pattern or add `TARGET-RANGE` — reuse the
  existing fixture file the INTAKE gates read; do not create a parallel fixture).
- Tier selection persists per engagement as `dgiw.tier` (default: standard).

Verification: `tsc -b` clean; a node assertion showing a legacy
`{Q1: 4}` map reads as `{Q1: {score: 4}}` losslessly. Show output.

## Checkpoint 3 — Diagnostic UI

`Diagnostic.tsx`:

- Tier selector (three options + one-line description of what each is for), wired
  to `dgiw.tier`. Question list filters to the active tier through
  `applicableQuestions` — the composition happens there, not in the component.
- Evidence: a collapsed text affordance per answered question ("Add evidence").
  Zero-friction skip; never required; visible indicator when present.
- Target-state: per-pillar row (use the existing pillar summary area if one
  exists — read the component first) with current score, target selector 1–5,
  and the raw delta shown as-is. No colour-coded judgment of deltas yet — G3.
- Coverage honesty in the UI: the pillar summary shows "n of m questions at this
  tier" so a Quick pass never looks like a full assessment.

Verification: `npm run dev` + extend `scripts/dgiw-design-clickthrough.mjs` (or a
sibling script `dgiw-diagnostic-clickthrough.mjs` reusing the same CDP client)
to: select Quick, answer a question with evidence, set a target, reload —
all three persist; switch engagement — all three empty; switch back — restored;
switch tier Quick→Deep — the Quick answer still visible and counted. Run it,
show PASS lines. Then `npm run check`.

## Checkpoint 4 — Report plumbing

Touch: AR-01 `diagnosticReport.ts`, the four framework scorecard generators, and
`spine.ts`/`provenance.ts` meta only if a field is genuinely needed:

- Every score-carrying artifact states the tier it was measured at and coverage
  (answered/applicable at that tier) — a visible line near the score, not a
  footnote. Provenance meta gains `assessmentTier` and coverage numbers; the /ID
  digest includes them (a Quick-tier PDF and a Deep-tier PDF must not share a
  fingerprint).
- AR-01 gains: evidence appendix (only questions that have evidence; omitted
  entirely when none — never a placeholder page) and a current-vs-target table
  per pillar where targets exist (omitted when none set).
- Framework scorecards: tier + coverage line only. Their math is untouched.

Verification: generate AR-01 at Quick with 2 evidence notes + 2 targets, and at
Deep with none; inspect both: tier line present in both, appendix and target
table present only in the first, no TBD/placeholder text. Two generations
byte-identical each. `npm run check`.

## Checkpoint 5 — Gates, selftest, close

- Selftest mutations: TIER-NESTING (≥3 rows: missing tier field, pillar with no
  quick question, degenerate overlay=deep), TARGET-RANGE (out-of-range value),
  answer-shape guard (malformed stored answer rejected not crashed), and a
  fingerprint row proving tier reaches the /ID digest.
- `timeout 400 node scripts/check/selftest.mjs | tail -3` — all rows trip.
- `npm run check`, `npm run build`, `npm run verify` (or verify:quick) — green.
- Re-baseline only what the tier/coverage meta legitimately moved; walk the
  baseline diff and say why each hash moved.

```bash
git add -A && git diff --cached --stat    # walk and classify every file
git commit -m "feat(dgiw): G2 assessment depth — Quick/Standard/Deep tiers (nested), per-answer evidence, per-pillar target-state; tier+coverage in provenance and /ID digest; TIER-NESTING and TARGET-RANGE gates"
git push -u origin feat/g2-assessment-depth
```

No merge. Final report format as G1's: built / edited / gates+evidence / not
verified / observed-not-fixed (with candidate D-numbers described, not fixed).
