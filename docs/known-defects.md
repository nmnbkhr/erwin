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

**Status** — FIXED in Phase D2 step 2, 2026-07-31, when TAIW moved onto the
spine. Found during Phase D1 characterisation the same day. The sentence now
wraps to two runs, both inside the margin, and reassembles character-identical to
the original — 37 of its 155 characters had been off the sheet. Kept here because
the measurement below is the reference case for the class.

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

**What the fix was**

`spine.ts::text()`, which splits unconditionally and emits one `doc.text` per
line. NOT `maxWidth: w - 30`, which is what this entry originally recommended and
what HAIW's equivalent line already did — that option computes the split and then
draws only the first line, so it would have traded a visible overflow for a
silent truncation. See D-004, which is that mistake, found two steps later.

The BAIW and HAIW rows above are separate defects, not the same one: HAIW's radar
label was fixed in step 1, and BAIW page 15 is D-006 and is still open.

**Harness status** — `scripts/golden/` records right-edge extent **per page**, so
this shows up as a number moving from `166.64pt PAST THE PAPER EDGE` to inside
the margin, rather than needing someone to open the PDF and notice.

---

## D-003 — HAIW's "largest estimated gaps" page reports twenty gaps of zero

**Status** — FIXED 2026-08-01, as its own change after D2 closed. Found
2026-07-31 during Phase D2 Step 0 while widening D-001, and migrated verbatim
through step 1 so the migration diff stayed readable. Distinct from D-001: that
one is about fabricated numbers, this one was a plain bug that made the page
report nothing at all.

**Where** — `baiw/src/haiw/utils/healthReportGenerator.ts:636`, page 13 of
`generateHealthMaturityPDF`:

```js
const catScore = scores.find(s => s.category === cap.theme) || { current: 0, gap: 0 }
```

`scores` is keyed by the eight **HACR categories** — `Strategy & Leadership`,
`Workforce & Skills`, `Data Governance & Standards`, … `Outcomes & Impact`.
`cap.theme` is one of the six **HCF themes** — `Patient Intelligence &
Experience`, `Clinical Analytics & Quality`, … `Digital Health & Data
Governance`. The two vocabularies are disjoint. **`find` never matched**, so
`catScore` was always the `{ current: 0, gap: 0 }` fallback.

**What it did**

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
category scores"** reported twenty capabilities with no gap, at the lowest
maturity level, all Low priority — regardless of what the client answered. The
sort is `by gap descending` over 108 equal values, so the "top 20" was simply the
first twenty rows of `capabilities.json` in file order.

This is client-facing and shipped.

**The bridge was considered and rejected**

The file already carried a bridge — `THEME_TO_CATEGORY`, mapping each HCF theme
to one HACR category — and `generateHealthGapCSV` already used it. Routing page
13 through it is a two-line change and was the obvious fix. It was measured
first, and the measurement killed it:

| | bridged | computed |
|---|---|---|
| distinct gap values across 108 capabilities | **at most 5** | **13** |
| HACR categories able to affect the page | **5 of 8** | **8 of 8** |
| what the ranking actually orders | theme, then file order | capability |

Six themes collapse onto five categories — `Outcomes & Impact` is the target of
two — leaving **`Strategy & Leadership`, `Workforce & Skills` and
`Integration & Interoperability` with no route to the page at all**. A client
could move every question in those three and page 13 would not change. And
because `gap` came from the category and only `current` was jittered, every
capability sharing a theme carried the identical gap, so the "top 20 by gap" was
theme order wearing a capability's name. That is a plausible lie replacing a
visible one, and plausible is the harder of the two to ever find again.

**What the fix was**

Computed from `capabilityLinks` instead — the weight-weighted mean of the
answered HACR questions linked to each capability. The authoring supports it with
nothing left over: **720 of 720 questions carry links, all 108 capabilities are
covered, 6–7 questions each**. There was no gap to work around.

On the fixture the page now spans **13 distinct gap values** (2.1 … 0.7) and 7
distinct current values, its top 20 spans **6 of 6 themes** and its linked
questions **8 of 8 HACR categories** — none unreachable. Priority across all 108
went from `Low 108` to `High 39 · Low 36 · Medium 31 · Critical 2`.

**The CSV and the PDF had been printing different numbers for the same
capability on the same day.** The CSV used the bridge plus a `charCodeAt` jitter
of `× 0.08`; page 13 used the failed `find` plus the same jitter at `× 0.1`. Two
deliverables, one engagement, one capability, two answers. Both now call one
`scoreCapabilities()`, so they agree by construction rather than by review.

**Three states, enforced by the type system**

`aggregate()` returns a discriminated union — `scored` | `not-assessed` |
`not-applicable` — so `current`, `desired` and `gap` are **unreachable until
`state === 'scored'`**. The `current: number` shape carrying `0` for "unmeasured"
is exactly what produced this defect; the compiler now refuses to write it.
Unscored capabilities are excluded from the ranking, not sorted to the polite end
of it, so an unanswered assessment renders an empty table rather than twenty rows
at gap 0.0. The caption states the denominator, as the DGIW diagnostic does:

```
Weight-weighted mean of the answered HACR questions linked to each capability.
Scored 108 of 108 capabilities · not assessed 0 · not applicable 0.
Showing the top 20 by gap, ties broken by capability id.
```

Zero not-applicable is asserted rather than assumed — all three branches were
driven and render: `only one category answered → 90 / 18 / 0`, `no answers →
0 / 108 / 0`, `no question bank → 0 / 0 / 108`.

**Blast radius** — page 13 was the only page that moved: +58 glyphs, +1 run (the
caption wrapping to a second line), 18 pages and 61 table rows held, every right
edge unchanged. The CSV moved on values only — 108 rows × 9 columns and its
header unchanged.

**Harness status** — was fully baselined and asserted, exactly as described in
D-001's inversion, so the fix reported as a `CHANGED` finding rather than needing
anyone to open the PDF. Re-baselined 2026-08-01: `haiw/maturity-pdf` and
`haiw/gap-csv` rewritten, `haiw/roadmap-md` byte-identical, BAIW ×3, TAIW ×3 and
DGIW ×14 untouched. `haiw/gap-csv` asserts raw bytes — it never had a
`Math.random` and is the harness's determinism control.

---

## D-004 — jsPDF's `maxWidth` text option drops every line after the first

**Status** — the two HAIW instances are fixed by the D2 step 1 migration. The
jsPDF behaviour behind them is unchanged and will do the same to the next caller,
which is why this is written down rather than closed.

**Where it bit** — `baiw/src/haiw/utils/healthReportGenerator.ts`, pre-migration:

```js
doc.text(`Level: ${levelLabel(x)} — ${levelDescription(x)}`, 15, 48, { maxWidth: w - 30 })
```

**What it does**

`doc.text(s, x, y, { maxWidth })` looks like wrapping. It is not. Measured
directly against `splitTextToSize` on the same string, font size and width:

```
splitTextToSize(180)           -> 2 lines: [".. documented and", "repeatable."]
doc.text(.., { maxWidth: 180 })-> 1 text run drawn
```

The overflow is computed and then never emitted. Nothing errors, nothing is
clipped at a visible edge, and the page looks deliberate — the sentence simply
stops.

Two client-facing sentences were lost in every HAIW PDF ever exported, both
captured verbatim in the D1 golden baseline
(`scripts/golden/baseline/haiw/maturity-pdf.json`):

| Page | Shipped text | Missing |
|---|---|---|
| 2 | "… healthcare analytics capabilities are documented and" | "repeatable." |
| 2 | "… (closes 1.3-level gap in Strategy &" | "Leadership)" |
| 16 | "… Closing this gap requires an estimated 24–36" | "months." |

**Why it was missed**

`CLAUDE.md` records the opposite belief — "of the three existing generators only
HAIW passes maxWidth, so BAIW and TAIW run long strings off the page edge" —
which reads as HAIW being the careful one. It was the careful one in a way that
loses text instead of showing it. BAIW and TAIW pass `maxWidth` **nowhere**
(grep: zero occurrences in either file), so they overflow visibly (D-002) rather
than truncating silently. Between the two failure modes, HAIW's was the harder to
notice.

**What the fix was**

`src/report/spine.ts::text()` calls `splitTextToSize` itself and emits one
`doc.text` per line. Migrating HAIW onto it recovered all three sentences —
visible in the golden diff as +22 glyphs on page 2 and +7 on page 16, which is
the recovered text, not new content.

**Standing hazard — now gated.** `{ maxWidth }` must not appear in report code.
`check-dgiw.mjs` **TEXT-MAXWIDTH** rejects the key across all five declared
report source locations, names the file and line, and fails rather than skips on
an options bag it cannot read (a spread, or an identifier where a literal should
be). `src/report` was added to `REPORT_SOURCE_LOCATIONS` for this check and
immediately found three more instances — see below.

**Three more instances, in the spine itself** — found D2 step 2, fixed:
`spine.ts` cover title, cover subtitle and page header chrome all used
`{ maxWidth }`. None of them truncated for any artefact shipping today (every
title, subtitle and header fitted — verified by sweeping all 23 golden artefacts
for the ellipsis), but they were three loaded guns in the one file every report
in the suite passes through. All three now call `spine.ts::fitOneLine`, which
keeps the single line and appends `…` when it has to cut, so the reader can tell
a truncation from a full stop.

---

## D-005 — the spine wrapped the first item of every list at the wrong width

**Status** — fixed in D2 step 2. Present in every DGIW deliverable since Phase B.

**Where** — `baiw/src/report/spine.ts`, `bullets()` and `keyValueBlock()`:

```js
const lines = this.doc.splitTextToSize(item, width)   // measured HERE
lines.forEach((line, i) => {
  this.doc.setFontSize(size)                          // set only HERE
  ...
})
```

**What it does**

`splitTextToSize` measures at whatever font size the document is currently set
to. Splitting before `setFontSize` therefore wraps against the **previous
call's** size. Items two onward came out right, because by then the loop had set
it — which is precisely why it survived four phases: one odd line break at the
top of a list reads as the author's own.

Demonstrated with the same string twice in one `bullets()` call, straight after
an 18 pt page title:

```
"This assessment uses the Healthcare Capability Framework"
"(HCF) — 108 analytics capabilities across 8 themes"
"This assessment uses the Healthcare Capability Framework (HCF) — 108 analytics capabilities across 8 themes"
```

**Both directions are wrong, and one of them is not cosmetic**

| Measured at | Drawn at | Effect |
|---|---|---|
| 18 pt (a page title) | 9 pt | breaks at ~half width — a short line, ugly, harmless |
| 8 pt (a caption or a preceding small paragraph) | 9 pt | line ~12% too wide — **runs past the margin, and off the sheet** |

The second case was live. `operatingModel.ts:315` calls
`keyValueBlock` once per principle inside a loop, so every pair is a "first
pair", and the preceding call is an 8 pt paragraph. Page 2 of AR-09 carried **six
runs past the 15 mm margin, two of them 3.78 pt past the paper edge** — clipped
by the sheet, invisible to a reader:

```
"Start at the regulatory return line or board KPI, trace lineage back to source, and every element on that path"
```

Page 3 carried one run 36.13 pt past the margin. Both pages now sit inside it.

**Blast radius** — ~30 call sites across all seven DGIW generators. Seven of the
fourteen golden artefacts changed; the other seven had first items that happened
to fit at both sizes. Nothing outside text geometry moved: no page count, no
table row count, no filename, no font. HAIW's two instances (introduced in D2
step 1 and reported at the time rather than worked around) corrected with it.

**Why it is not a style nit** — the fix is a two-line reorder, but it moved the
byte-level identity of half the DGIW deliverable set. That is the measure of how
long a silent layout bug can live in shared code with no test around it.

---

## D-006 — BAIW's roadmap phase boxes are laid out 5 mm past the content margin

**Status** — open. Found during Phase D2 step 3 (BAIW's spine migration),
2026-07-31. Deliberately not fixed there: it is a geometry change, not a
migration, and the migration's value is that nothing else moved.

**Where** — `baiw/src/utils/reportGenerator.ts`, page 15 ("Roadmap Summary") of
`generateMaturityPDF`, and the same grid copied into
`taiw/utils/tradeReportGenerator.ts`:

```js
const boxW = 55
const x = MARGIN + i * (boxW + 10)      // 15, 80, 145 → third box ends at 200 mm
```

**What it does**

Three 55 mm boxes with two 10 mm gaps span 15–200 mm. The content column ends at
195 mm. The third box is 5 mm over the margin before a glyph is drawn:

| | width | centre | right edge | verdict |
|---|---|---|---|---|
| box 1 "Phase 1: Quick Wins" | 32.60 mm | 42.5 mm | 166.67 pt | inside |
| box 2 "Phase 2: Core Build" | 31.15 mm | 107.5 mm | 348.87 pt | inside |
| box 3 "Phase 3: Advanced Analytics" | 45.40 mm | 172.5 mm | **553.33 pt** | **0.57 pt past the 15 mm margin** |

Nothing is off the paper and nothing is truncated — the whole title renders, 42
pt inside the sheet edge. It is the smallest overflow in the suite, and it is
recorded because it is the only one the spine migration did **not** close.

**Why the spine does not fix it** — this is not a wrapping defect. Routing the
title through `spine.ts::text()` would left-align it out of its box. Wrapping it
to the box width still permits 200 mm, because the box is what breaks the margin.
Wrapping it to the available half — the treatment the three radar charts got,
`min(x - MARGIN, pageWidth - MARGIN - x)` — gives 45.00 mm against a 45.40 mm
title, so it would fold onto two lines inside a box sized for one, 10 mm above
"Months 19–36".

**What a fix looks like** — narrow the boxes to `(contentWidth - 2 * gap) / 3` =
53.33 mm, which brings the grid to exactly 195 mm. That moves all twelve text
baselines on the page and changes three filled rectangles, in both BAIW and TAIW.
Worth doing on its own, with its own before/after.

**Harness status** — `scripts/golden/walk.mjs` reports it every run:
`page 15 … 553.33 -> 553.33  pastMargin 0.57 -> 0.57  runs>margin 1 -> 1`, with
the widest run named. It cannot be closed silently and it cannot be forgotten.
