# G6 — Snapshots, Deltas, Trajectory

Claude Code build prompt. Checkpoint-gated: do not proceed past a checkpoint
until its verification commands pass and their output has been shown. Do not
batch checkpoints. Preconditions are CHECKS with decision rules, not
assumptions. This stage closes the G-series.

---

## Context

Repo `erwin`, app root `baiw/`. `wip/phase-a` believed at 5d4fd92 (G1–G5.1);
CP0 verifies.

What G6 stands on — read all of it before writing anything:

- `src/dgiw/answers.ts` — namespaced answers; note its header's PERSISTED_BASES
  reference. Find PERSISTED_BASES, read the export/import mechanism, and
  understand what joining it means BEFORE designing snapshot storage. A
  snapshot base that is not listed there silently fails to survive an
  engagement export — that would be a defect shipped on day one.
- `src/dgiw/tracking/` — the append-only idiom G6's snapshot store follows.
- `src/dgiw/scoring.ts` — `scorePillars` runs on any answer map; snapshots
  feed it frozen maps. Math untouched.
- `src/dgiw/report/councilPack.ts` — note its absent-section idiom ("absent
  because its input is, not because it was skipped") — the trend section uses
  exactly that pattern.
- G2 tier machinery; G5 Refusal class; the register conventions (AR-57
  precedent for the stop condition).
- DGIW has NO chart precedent — the trajectory visual is its first.

## Objective

The workbench learns time. A consultant deliberately captures a labeled
snapshot of the assessment state; a pure delta engine compares snapshots under
strict comparability rules; a trajectory surface shows movement; the council
pack earns its trend section; and a delta report artefact makes re-assessment
a deliverable. Plus the CDP screenshot rider that ends the visual blind spot.

## Non-negotiables

1. **A snapshot is frozen.** Captured content: deep-frozen copies of answers,
   targets, tier, plus {id, label, capturedAt, digest}. After capture, changes
   to live state MUST NOT alter any snapshot (prove it). The store is
   append-only in the tracking idiom; the app offers no edit and no delete —
   this is the second audit-trail seed alongside the status log, and its
   shape should survive a future backend migration unchanged.
2. **Deltas only between comparable things.** A pillar delta exists only when
   BOTH snapshots have that pillar 'scored' AND both snapshots were captured
   at the SAME tier. Cross-tier pairs are not compared — they are listed as
   not-comparable with the reason (coverage differs by construction; a Quick
   score moving against a Deep score is noise wearing a trend costume).
   Pillars scored in one but not the other appear as exclusions with reasons,
   never as zero-deltas. Overall movement is computed only across the pillars
   comparable in both.
3. **Every delta claim cites its two digests.** Screen and PDF: a delta line
   carries both snapshot labels, dates, and digests. Reproducibility means a
   reader can name exactly which two frozen states produced the number.
4. **Drawn honesty.** The trajectory chart plots captured points joined by
   straight segments only — no smoothing, no interpolation, no extrapolation,
   no trend line. Axes labeled with real values; points labeled with snapshot
   labels; a single-snapshot pillar draws a point, not a line. Same rules in
   the PDF rendering.
5. **Trend is earned.** The council pack's trend section appears only when ≥2
   same-tier snapshots exist at or before the period end; otherwise the
   absent-section idiom states why. Still zero forecast language — movement
   is reported as past fact ("P05 moved 2.1 -> 2.8 between <label> and
   <label>"), never as direction promised.
6. Gates fail first; ASCII PDF prose; spine-only text; no raw localStorage;
   register/scoring/projection/slices math untouched; observations filed,
   not fixed.

---

## Checkpoint 0 — Preconditions, branch

```bash
cd baiw && git status                        # clean; STOP if not
git checkout wip/phase-a && git pull
git log --oneline -2                         # expect 5d4fd92 G5.1 at tip;
                                             # absent → STOP and report
git checkout -b feat/g6-trajectory
npm run check | tail -3                      # green; record count (expect 38)
```

Admin: this prompt joins docs/prompts/.

## Checkpoint 1 — Snapshot store, frozen and proven

`src/dgiw/trajectory/snapshots.ts` (+ `state.ts` hook):

- `AssessmentSnapshot` per non-negotiable 1; digest via the repo's stable
  digest utility (find what provenance/fingerprinting already uses — do not
  introduce a second hashing idiom).
- Base key `dgiw.snapshots`, registered in PERSISTED_BASES (show the diff
  line). Pure helpers: `captureSnapshot(live) -> snapshot`,
  `comparableSnapshotPairs(list)`, plus whatever the delta engine needs.
- Capture is deliberate: takes a label; empty labels rejected at the helper
  level (the UI can default-suggest "Baseline" for the first).

Verification: tsx script — capture from a seeded live state; mutate the live
maps; assert the snapshot's answers/targets/tier unchanged (structural
freeze, not reference luck); digest stable across two captures of identical
state, different across a one-answer change. Show output.

## Checkpoint 2 — Delta engine, pure and tested

`src/dgiw/trajectory/deltas.ts`:

- `snapshotDeltas(a, b)` implementing non-negotiable 2: per-pillar
  {pillarId, from, to, delta}, exclusions [{pillarId, reasons}], overall
  {from, to, delta, pillarCount} over the comparable set, tier (shared),
  citations {aDigest, bDigest, aLabel, bLabel, aAt, bAt}.
- Cross-tier input: returns a not-comparable result carrying both tiers and
  the rule's statement — it does NOT throw (a UI showing "these two cannot be
  compared and here is why" is the honest surface; only generators refuse).
- Exported B_-style invariants: B_SAME_TIER, B_SCORED_BOTH, B_NO_FORECAST.

Verification: tsx script — same-tier pair with one pillar scored both sides,
one scored in only one (delta present for the first; exclusion with reason
for the second); cross-tier pair → not-comparable with both tiers named;
overall computed only over comparable pillars (assert the count). Show
output.

## Checkpoint 3 — UI: capture, trajectory, screenshots

1. Capture control on `Diagnostic.tsx` (label input + capture button, list of
   existing snapshots with dates and digests, no delete affordance).
2. New page `src/dgiw/components/Trajectory.tsx`, route `/trajectory` after
   `/gaps`: snapshot pair selector (defaulting to the two most recent
   comparable), delta table with citations, exclusions listed, the first
   DGIW chart per non-negotiable 4 (inline SVG; per-pillar small multiples or
   a single multi-line chart — pick ONE based on legibility at 11 pillars and
   say why in a comment), not-comparable state rendered with the rule.
3. **Screenshot rider:** the CDP clickthrough scripts gain
   Page.captureScreenshot at named waypoints (each new G6 surface plus one
   per existing G-series surface), written to `scripts/screenshots/`
   (gitignored — add the entry). The final report lists the files produced so
   a human can review layout at last.

Verification: extended clickthrough — capture two snapshots at Standard tier
(answers changed between), Trajectory shows deltas with digests; capture one
at Quick, select it against a Standard one → not-comparable rendered;
engagement isolation holds; console clean; screenshots present on disk (list
them). Show PASS lines. `npm run check`.

## Checkpoint 4 — Generators

1. **Delta report artefact** `report/deltaReport.ts` — next id per register
   conventions; STOP condition: if any catalogued row already matches a
   re-assessment/delta deliverable, fire the question before minting (AR-57
   precedent). Content: the delta table with citations, exclusions with
   reasons, the chart drawn under non-negotiable 4's rules in jsPDF, the
   same-tier rule stated once. Refuses (typed Refusal) without two comparable
   snapshots. Tier+coverage+both digests in meta and /ID digest.
2. **Council pack trend section** per non-negotiable 5 — pack digest gains
   the snapshot digests it cites so a pack before and after a new snapshot
   cannot collide.

Verification: seeded two comparable snapshots → both PDFs generated and
inspected: citations present, exclusions phrased with reasons, zero matches
of /forecast|on.track|predict|project(ed|ion)|extrapolat/i in extracted text,
straight-segment chart only (no bezier/curve operators in the content
stream — assert), byte-identical regenerate, digest moves when a third
snapshot enters the cited pair. Refusal cases typed. `npm run check`.

## Checkpoint 5 — Gates, selftest, close

New codes, compiled-module style, isolated selftest rows shown tripping:

- `SNAPSHOT-FROZEN` — capture, mutate live, assert snapshot unchanged; a
  copy-by-reference implementation must trip.
- `DELTA-PAIR` — cross-tier pair yielding pillar deltas trips; scored-one-
  side yielding a delta trips; exclusion-without-reason trips.
- `DELTA-CITE` — generated delta output lacking either digest trips (real
  PDF, all string forms — the D-018/D-019 reader lessons apply).
- `TREND-EARNED` — pack over <2 comparable snapshots containing a trend
  section trips; over 2, missing it trips (both directions, PACK-PERIOD
  style, and a fixture that stops seeding both cases fails as VACUOUS).
- `CHART-HONEST` — curve/smoothing operators in the chart region trip;
  a point drawn at a value no snapshot contains trips.
- Extend TIER-DIGEST to the delta report.

```bash
npm run check | tail -3
timeout 400 node scripts/check/selftest.mjs | tail -3
npm run build && npm run verify
```

Baseline walk: delta report NEW, pack moves (trend + digest), AR-09/AR-54
catalogue counts if a register row was added — attribute everything.

```bash
git add -A && git diff --cached --stat       # walk and classify every file
git commit -m "feat(dgiw): G6 trajectory — frozen labeled snapshots (append-only, export-surviving); same-tier scored-both delta engine with digest citations; /trajectory + first DGIW chart (straight segments only); delta report artefact; council pack earned trend; CDP screenshot rider; SNAPSHOT/DELTA/TREND/CHART gates"
git push -u origin feat/g6-trajectory
```

No merge. Final report as G1–G5: built / edited / gates+evidence / not
verified / observed-not-fixed. Close with the series ledger restated: what
remains open anywhere (expected: only D-009, D-014, D-016, D-017 remainder —
all pre-G, all outside DGIW) so the G-series ends with its books balanced.
