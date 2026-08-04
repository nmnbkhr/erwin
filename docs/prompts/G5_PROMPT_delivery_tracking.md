# G5 — Delivery Tracking, KPI Capture, Council Pack

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint
until its verification commands pass and their output has been shown. Do not
batch checkpoints. Preconditions are CHECKS with decision rules, not
assumptions.

---

## Context

Repo `erwin`, app root `baiw/`. G1–G4 believed merged to `wip/phase-a`; CP0
verifies.

What G5 stands on — read all of it before writing anything:

- `report/useDeliverable.ts` — the shared run path; line ~71 is D-020's site
  (designed refusals travel `console.error` + tone 'error', indistinguishable
  from real failures).
- `data/implementationPlan.json` — waves with `kpis: string[]` (coverage
  phrases, no ids, no measurements anywhere); `artefactRegister` rows whose
  `builtFrom` dispositions are evidence-typed objects with load-bearing notes.
  Dispositions describe HOW an artefact is built — G5's status describes WHERE
  it stands in THIS engagement. Orthogonal. G5 never edits a disposition
  except where explicitly instructed below.
- `plan/slices.ts` — wave placement currently name-matched (1/35 hits; G4
  finding). G5 replaces it with authored placement.
- `report/programmeGap.ts` (AR-54) — its artefact-register dimension will
  read engagement statuses; `B_*` invariants untouched.
- AR-55/AR-56 refusal pattern; `gap/register.ts`; G2 tier machinery.

## Objective

The workbench learns to run an engagement, not just design one: per-engagement
deliverable lifecycle states on the artefact register, authored wave↔artefact
placement, KPI capture (recorded measurements, never computed), and a council
pack generator — the recurring steering artifact composed ONLY from what the
engagement has actually recorded. Plus D-020 fixed at its root.

## Non-negotiables

1. **Captured, not computed.** No KPI value is ever derived by the tool. An
   entry exists only when a person records {value, capturedAt, source}. The
   council pack prints captured entries and says "no measurement recorded"
   where none exists — never a placeholder, never a computed stand-in.
2. **Status is an append-only history.** `dgiw.status` per engagement:
   per artefactId, an append-only transition log [{to, at, note?}]; current
   state = last entry. States: planned | in-progress | delivered | accepted.
   Any transition is legal (regression included) but every transition is a
   new log entry — nothing is edited or deleted. This log is the audit-trail
   seed the backend trigger condition names; treat its shape accordingly.
3. **Placement is authored, complete, and single.** Each wave gains
   `artefactIds: string[]` in implementationPlan.json; a top-level
   `unplacedArtefactIds: [{id, reason}]` covers the rest. Every register id
   appears in EXACTLY one wave or the unplaced list; no dangling ids either
   direction. Authoring judgment: place by the wave's deliverables/objectives
   prose and the pillar's wave membership; when genuinely ambiguous, unplaced
   with the reason — do not force-place. `plan/slices.ts` switches to the
   authored key; the name-matching path is DELETED, not kept as fallback.
4. **Refusals are not errors (D-020).** A `Refusal` error class (or discriminant)
   thrown by builders; `useDeliverable` catches it distinctly: tone 'info',
   no `console.error`. Real failures keep the error path. AR-55, AR-56 and the
   new council pack all throw it. The clickthrough console-clean assertion
   must now FAIL on a `console.error` refusal — prove by temporary revert.
5. **The council pack claims only its period.** Inputs: engagement state as of
   generation (register statuses, captured KPIs, gap register, slice
   sequence) plus a consultant-chosen period label. It contains: maturity
   line (tier + coverage), top-band gaps, status summary with per-state
   counts AND the transition log entries in the period, KPI entries in the
   period, thin/held-by notes from slices. No trend arithmetic, no forecast,
   no "on track" judgments — G6 owns deltas; a pack with one period has no
   trend to claim.
6. Gates fail first; ASCII PDF prose; spine-only text; no raw localStorage;
   single-predicate discipline; register/scoring/projection math untouched;
   out-of-scope observations filed, not fixed.

## KPI identity

Wave KPI strings gain ids: each kpi becomes {id: 'K-W1-01' style, text} in
implementationPlan.json. Capture entries key by kpi id. Gate holds id
uniqueness and that every capture references an existing id. Renderers that
today read `kpis` as strings are updated in the same commit (grep for every
consumer FIRST; list them in the report).

---

## Checkpoint 0 — Preconditions, branch

```bash
cd baiw && git status                       # clean; STOP if not
git checkout wip/phase-a && git pull
git log --grep "G4 per-pillar" --oneline    # present → proceed; absent → STOP,
                                            # offer the fast-forward, await approval
git checkout -b feat/g5-delivery-tracking
npm run check | tail -3                     # green; record count
```

## Checkpoint 1 — D-020 fix + authored placement

1. Refusal class in a shared location (`src/dgiw/report/refusal.ts` or
   similar); AR-55/AR-56 builders throw it; `useDeliverable` branches on it
   (tone 'info', no console.error). Update D-020 in known-defects.md to
   RESOLVED with the mechanism, preserving the entry history style.
2. Author `artefactIds` on all 7 waves + `unplacedArtefactIds` with reasons;
   write the `PLACEMENT` gate FIRST and show it failing on the pre-authoring
   dataset (55 unplaced ids), then author, then green. Switch slices.ts to
   the authored key; delete name-matching.
3. Walk which AR-04/AR-47/AR-54 outputs move (placement now real) — attribute
   every moved byte at re-baseline in CP5.

Verification: `npm run check` green incl. PLACEMENT; slices drive script
updated — placements now largely non-null; clickthrough refusal case shows
tone 'info' and a clean console; temporary revert shows the console assertion
failing (then restore). Show outputs.

## Checkpoint 2 — Status + KPI state

- `src/dgiw/tracking/state.ts` — `dgiw.status` (append-only per rule 2) and
  `dgiw.kpi` (append-only capture entries {kpiId, value: string, capturedAt,
  source}) via `usePersistedState`; pure helpers in `tracking/log.ts`
  (currentState, entriesInPeriod, stateCounts) — pure, tsx-testable.
- KPI ids authored per the KPI identity section; consumers updated.

Verification: tsx script: transitions append (a regression keeps both
entries); currentState reads the last; period filter honours boundaries;
malformed stored shapes rejected not crashed. Show output.

## Checkpoint 3 — UI

- `Deliverables.tsx`: per-artefact status control (current state + transition
  with optional note), state counts strip, disposition display untouched and
  visually distinct from status (two different facts, two different columns).
- `ImplementationPlan.tsx` slice cards: deliverable rows show current status;
  wave rows show KPI entries with a capture affordance (value, source; date
  auto). Reference tabs untouched.

Verification: clickthrough — set statuses incl. one regression with note,
capture two KPI entries, reload persists, engagement B empty, back restored;
console clean. Show PASS lines. `npm run check`.

## Checkpoint 4 — Council pack generator

`report/councilPack.ts`, next id per register conventions (check the register
FIRST; if a catalogued row already matches a periodic steering pack, STOP and
report). Content per non-negotiable 5; period label from a small control on
the Deliverables page (persisted per engagement); refusal (the new class) when
intake non-actionable OR nothing measured AND nothing tracked. Tier+coverage
in meta and /ID digest; digest includes the period label and the count of log
entries so two packs over different states cannot collide.

Verification: seeded state → generate; inspect: per-state counts match the
seeded log; regression transition visible with its note; KPI section shows
the two entries with sources; "no measurement recorded" lines where none;
zero forecast/trend language (grep the extracted text for
/on.track|trend|forecast|trajectory/i → zero matches); regenerate →
byte-identical; digest moves after one more transition. `npm run check`.

## Checkpoint 5 — Gates, selftest, close

New codes, compiled-module style, isolated selftest rows shown tripping:

- `PLACEMENT` (CP1) — exactly-one placement, no dangling ids both directions.
- `KPI-ID` — id uniqueness; every capture references an existing id.
- `STATUS-LOG` — append-only holds: the tracking module exposes no mutation
  that rewrites history (run the real module: attempt an edit path, assert
  absence); malformed log rejected.
- `PACK-PERIOD` — council pack contains no out-of-period log/KPI entries
  (seed entries either side of the boundary; generate; assert).
- `REFUSAL-CHANNEL` — all three engagement-only builders throw the Refusal
  class (not bare Error); useDeliverable's refusal branch has no console.error.
- Extend TIER-DIGEST to the pack.

```bash
npm run check | tail -3
timeout 400 node scripts/check/selftest.mjs | tail -3
npm run build && npm run verify
```

Baseline walk: PLACEMENT moves (AR-04/AR-47/AR-54 wave content), pack NEW,
KPI id shape moves; attribute everything else before commit.

```bash
git add -A && git diff --cached --stat      # walk and classify every file
git commit -m "feat(dgiw): G5 delivery tracking — append-only status log; authored wave placement (name-matching deleted); KPI capture (recorded, never computed); council pack (period-scoped, refuses); D-020 resolved via Refusal channel; PLACEMENT/KPI-ID/STATUS-LOG/PACK-PERIOD/REFUSAL-CHANNEL gates"
git push -u origin feat/g5-delivery-tracking
```

No merge. Final report as G1–G4: built / edited / gates+evidence / not
verified / observed-not-fixed with candidate D-numbers described, not fixed.
One specific report item: the register's 'observed'-evidence disposition notes
that say no capture surface exists — state whether the KPI/status surfaces now
genuinely cover any of them; if yes, propose (do not perform) the
re-disposition with its reason in the note style the register uses.
