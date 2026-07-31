# Known defects — logged, not fixed

Live defects found by measurement and deliberately left in place, so they survive
to whoever picks up the work that should fix them. Each entry names where it was
found, what it does to a client-facing artefact, and what a correct fix has to
establish first.

Adding an entry here is not a substitute for fixing it. It is a substitute for
*forgetting* it.

---

## D-001 — fabricated per-capability scores in four client deliverables

**Status** — open. Found during Phase D1 characterisation, 2026-07-31; scope
widened 2026-07-31 during Phase D2 Step 0. Logged, not fixed: D1's job was to
record what the output is today, and fixing this changes it.

**This has shipped to clients.** These are the export buttons on the maturity
pages of three live workbenches. Every assessment run through them has produced
a deliverable containing invented capability scores, and the PDF is the document
a client is most likely to circulate.

**Where — the CSVs (nondeterministic)**

- `baiw/src/utils/reportGenerator.ts:695` — `generateGapCSV`
- `baiw/src/taiw/utils/tradeReportGenerator.ts:721` — `generateTradeGapCSV`

Both compute a per-capability score as

```js
const variation = (Math.random() - 0.5) * 0.6
const current = Math.max(1, Math.min(5, score.current + variation))
```

**Where — page 13 of the PDFs (deterministic, and worse: see the inversion below)**

- `baiw/src/utils/reportGenerator.ts:443-450` — "Capability Gap Matrix", page 13
- `baiw/src/taiw/utils/tradeReportGenerator.ts:450-458` — "TCF Capability Gap Matrix", page 13

Both synthesise the same fabricated capabilities from the same eight category
scores, and make the identical claim to the same client in the more prominent
document. The names are string-concatenated, not looked up:

```js
{ name: `${cat} Strategy & Planning`,   currentLevel: score.current },
{ name: `${cat} Analytics & Reporting`, currentLevel: Math.max(1, score.current - 0.3) },
{ name: `${cat} Process Automation`,    currentLevel: Math.max(1, score.current - 0.5) },
```

Captured from the current golden baseline, BAIW page 13 row 1 reads:

```
1 | Information Process Automation | Information | 2.0 | 5.0 | 3.0 | Critical
```

There is no BVF capability called "Information Process Automation". The page is
headed "Top 20 BVF capabilities with largest estimated gaps" and the client is
being told which of them are Critical.

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
are Critical.**

Every other column (`ID`, `Name`, `Theme`, `Group`, `Required Level`, the
dependency column), the row count and the header are stable.

**The inversion — the deterministic half is the more dangerous half**

Page 13 uses no RNG. `score.current - 0.3` and `- 0.5` are fixed offsets, so the
page is perfectly reproducible. That is not a mitigation. It is the reason the
page is the worse problem:

- The **golden harness will baseline page 13 and assert it forever.** All twenty
  rows of `pages[12].text` are captured in
  `baiw/scripts/golden/baseline/<mod>/maturity-pdf.json` and covered by
  `normalisedTextSha256`. From D2 onward, any change to those fabricated names
  or numbers reports as a `CHANGED` finding to be justified — the harness will
  actively defend the fabrication.
- The **CSV escaped that only because of the RNG.** `Math.random` is the sole
  reason those three columns were declared unassertable and print `SKIPPED` on
  every compare run. The defect is visible precisely because it is unstable.

So: **under golden-mastering, deterministic fabrication is more dangerous than
nondeterministic fabrication, not less.** A stable wrong number acquires a
baseline, a hash and a review process defending it. An unstable one keeps
announcing itself. Freezing the RNG without deciding whether the columns should
exist would move the CSVs into the same trap the PDFs are already in.

**The HAIW variant — real names, fabricated scores, and the only derivable case**

`baiw/src/haiw/utils/healthReportGenerator.ts:939` — `generateHealthGapCSV` — is
usually cited as the good one because it is deterministic. It is a different
shape of the same defect:

- All **720** HACR questions carry `capabilityLinks` (`["HCF-002"]`), so HAIW is
  **the only one of the three where a genuine per-capability score is
  derivable** from the assessment.
- The generator ignores them. It jitters the category score by
  `(cap.id.charCodeAt(cap.id.length - 1) % 10 - 5) * 0.08` instead.
- Because it uses the real `capabilities.json`, the output attaches **real HCF
  capability names to fabricated scores**. That is arguably the worst of the
  three: the realism of the name lends credibility to the number beside it.

BAIW and TAIW have no such link. 804 BACR questions carry only
`id, category, subcategory, text, weight`; `taiw/tacrQuestions.json` is eight
category objects with no flat question list. For those two a per-capability
score is not unplumbed — **it is not computable from the assessment as designed.**

**What a fix has to establish first**

Do not simply freeze the number. **Establish what the RNG was for.** The three
category-derived columns look like a placeholder for per-capability data that
was never wired up — the generator has category scores and invents capability
scores by jittering them. If that is what happened, the honest fix is to **stop
emitting those columns**, not to substitute a deterministic-but-still-fabricated
number. A stable fabrication is worse than an unstable one: it looks like a
measurement.

The design record is explicit about what was asked for.
`archive/build-prompts/v3-prompts-with-git.md:424`:

> **`generateGapCSV(assessmentData)`** — Generates a CSV file with:
> — **Row per BVF capability (112 rows)**
> — Columns: ID, Name, Theme, Group, Current Level, Required Level, Gap, Priority, FSDM Dependencies

`src/data/capabilities.json` holds those 112 real BVF capabilities, with real
names, themes, groups and descriptions, and it is **already loaded by the app**
at `src/utils/dataLoader.ts:109` for the Capability Navigator. The generator
emits 112 rows and none of them are those 112. The row count was matched to the
spec; the content was invented.

So the RNG was never a placeholder for missing data. Set `variation` to zero and
all fourteen rows in a category carry an identical score, because there is only
one number available — the category score. Fourteen identical rows, eight times
over, is visibly not a capability assessment. **The jitter's only function is to
make 112 copies of eight numbers read as 112 measurements.** It is a disguise,
not scaffolding.

Resolutions differ per module, and the same change is not right for all three:

- **BAIW / TAIW** — stop emitting `Current Level`, `Gap` and `Priority`, from
  both the CSV and page 13. Emit the real 112 / 100 capabilities with the
  columns that are real (`ID`, `Name`, `Theme`, `Group`, `dataReqCount`,
  `phase`, dependencies) plus the *category* score under a heading that says
  category. "These are the capabilities in a theme you scored 2.1" is
  defensible. "This capability scores 2.3" is not.
- **HAIW** — derive it. The links exist on all 720 questions.

**Harness status** — `scripts/golden/` declares the three CSV columns
**unassertable** and prints `SKIPPED` for them on every run; D2 could change
every number in them and the harness would not notice. Page 13 of all three PDFs
is the opposite: fully baselined and asserted. See
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

---

## D-003 — HAIW's "largest estimated gaps" page reports twenty gaps of zero

**Status** — open. Found 2026-07-31 during Phase D2 Step 0, while widening
D-001. Distinct from D-001: that one is about fabricated numbers, this one is a
plain bug that makes the page report nothing at all.

**Where** — `baiw/src/haiw/utils/healthReportGenerator.ts:636`, page 13 of
`generateHealthMaturityPDF`:

```js
const catScore = scores.find(s => s.category === cap.theme) || { current: 0, gap: 0 }
```

`scores` is keyed by the eight **HACR categories** — `Strategy & Leadership`,
`Workforce & Skills`, `Data Governance & Standards`, … `Outcomes & Impact`.
`cap.theme` is one of the six **HCF themes** — `Patient Intelligence &
Experience`, `Clinical Analytics & Quality`, … `Digital Health & Data
Governance`. The two vocabularies are disjoint. **`find` never matches**, so
`catScore` is always the `{ current: 0, gap: 0 }` fallback.

The file already contains the bridge that fixes this — `THEME_TO_CATEGORY`, at
line 46 — and uses it in `generateHealthGapCSV` at line 951. Page 13 does not.

**What it does**

With `catScore.current = 0` and `catScore.gap = 0`, and a variation bounded at
±0.5, `current` clamps to `1`, `required` equals `current`, and `gap` is `0` for
every one of the 108 capabilities. Captured from the golden baseline —
`haiw/maturity-pdf.json`, `pages[12]`, all twenty rows:

```
 1 | Patient Master Index Management            | Patient Intelligence & Experience | 1.0 | 1.0 | 0.0 | Low
 2 | Patient Demographics Profiling             | Patient Intelligence & Experience | 1.0 | 1.0 | 0.0 | Low
 3 | Patient Identity Matching & Deduplication  | Patient Intelligence & Experience | 1.0 | 1.0 | 0.0 | Low
 …
distinct Gap values:      ["0.0"]
distinct Priority values: ["Low"]
```

A page titled **"Top 20 HCF capabilities with largest estimated gaps based on
category scores"** reports twenty capabilities with no gap, at the lowest
maturity level, all Low priority — regardless of what the client answered. The
sort is `by gap descending` over 108 equal values, so the "top 20" is simply the
first twenty rows of `capabilities.json` in file order.

This is client-facing and has shipped.

**Interaction with D2** — HAIW migrates first. Migrating this page faithfully
preserves a page that says nothing; fixing it during the migration is a
behaviour change outside the migration's remit and would confound the golden
diff. The intended handling is to **migrate faithfully and leave the defect
standing**, so the diff stays readable, and to fix it as its own change with its
own review. Flag it if that is the wrong call.

**Harness status** — fully baselined and asserted, exactly as described in
D-001's inversion. The twenty zero-gap rows are covered by
`normalisedTextSha256`, so correcting the bug will report as a `CHANGED`
finding.
