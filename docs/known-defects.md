# Known defects — logged, not fixed

Live defects found by measurement and deliberately left in place, so they survive
to whoever picks up the work that should fix them. Each entry names where it was
found, what it does to a client-facing artefact, and what a correct fix has to
establish first.

Adding an entry here is not a substitute for fixing it. It is a substitute for
*forgetting* it.

---

## D-001 — `Math.random()` in two CSV exports changes the answer between runs

**Status** — open. Found during Phase D1 characterisation, 2026-07-31. Logged,
not fixed: D1's job was to record what the output is today, and fixing this
changes it.

**Where**

- `baiw/src/utils/reportGenerator.ts:695` — `generateGapCSV`
- `baiw/src/taiw/utils/tradeReportGenerator.ts:721` — `generateTradeGapCSV`

Both compute a per-capability score as

```js
const variation = (Math.random() - 0.5) * 0.6
const current = Math.max(1, Math.min(5, score.current + variation))
```

**What it does**

Exporting the same assessment twice produces two different files. Measured over
two consecutive runs from byte-identical input:

| Export | Data rows | Rows differing | `Current Level` | `Gap` | `Priority` |
|---|---|---|---|---|---|
| `BAIW_Capability_Gap_Analysis.csv` | 112 | 95 | 95 rows | 95 rows | **46 rows** |
| `TAIW_Trade_Capability_Gap_Analysis.csv` | 96 | 75 | 72 rows | 72 rows | **28 rows** |

The `Priority` column is the one that matters. `priorityLabel()` thresholds the
perturbed value, so the label genuinely flips class — `Low` ↔ `Medium` ↔ `High`
↔ `Critical`. **Two exports of one assessment disagree about which capabilities
are Critical.** These are client deliverables, so this has presumably already
reached clients.

Every other column (`ID`, `Name`, `Theme`, `Group`, `Required Level`, the
dependency column), the row count and the header are stable.

**What a fix has to establish first**

Do not simply freeze the number. **Establish what the RNG was for.** The three
category-derived columns look like a placeholder for per-capability data that
was never wired up — the generator has category scores and invents capability
scores by jittering them. If that is what happened, the honest fix is to **stop
emitting those columns**, not to substitute a deterministic-but-still-fabricated
number. A stable fabrication is worse than an unstable one: it looks like a
measurement.

If per-capability scores are real and simply unplumbed, plumb them.

`HAIW`'s `generateHealthGapCSV` is the counter-example worth copying: it derives
its variation from `cap.id.charCodeAt(…)`, so it is deterministic — though it is
still a fabrication and the same question applies to it.

**Harness status** — `scripts/golden/` declares these three columns
**unassertable** and prints `SKIPPED` for them on every run. D2 could change
every number in them and the harness would not notice. See
`baiw/scripts/golden/README.md`.

---

## D-002 — TAIW's benchmark page draws text 166 pt past the edge of the paper

**Status** — open. Found during Phase D1 characterisation, 2026-07-31.

**Where** — `baiw/src/taiw/utils/tradeReportGenerator.ts:602`, page 16
("Benchmark Comparison") of `generateTradeMaturityPDF`:

```js
doc.text(`You are ${gapToRegional} levels behind regional leaders (${regional.examples}). Closing this gap requires 18–24 months.`, 15, y + 15)
```

No `maxWidth`, so jsPDF does not wrap it.

**What it does**

Measured against jsPDF's own Helvetica metrics on A4 (595.28 pt wide, 15 mm
margin at 552.76 pt):

| | right edge | verdict |
|---|---|---|
| TAIW page 16 | **761.92 pt** | **166.64 pt past the paper edge** — the sentence is truncated in every PDF shipped |
| BAIW page 15 | 553.30 pt | 0.54 pt past the margin, on paper |
| HAIW page 3 | 568.90 pt | 16.14 pt past the margin, on paper (a radar axis label) |

`regional.examples` is `"Singapore Customs, Korea Customs (KCS), Malaysia Royal
Customs (JKDM)"` — long enough that the line runs off the sheet. A reader sees
the sentence stop mid-word.

**What a fix looks like**

Pass `maxWidth: w - 30`, matching what the HAIW generator already does on its
equivalent line (`healthReportGenerator.ts:811`) and what `src/report/spine.ts`
does throughout. This is squarely in D2's path — it is one of the changes the
golden harness expects to see.

**Harness status** — `scripts/golden/` records right-edge extent **per page**, so
this shows up as a number moving from `166.64pt PAST THE PAPER EDGE` to inside
the margin, rather than needing someone to open the PDF and notice.
