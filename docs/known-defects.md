# Known defects — the register

Defects found by measurement, each recording where it was found, what it did to a
client-facing artefact, and what the fix was — or, while it is still open, what a
correct fix has to establish first.

Entries are **kept after they are fixed**. The diagnosis is the durable part: it
is what stops the same mistake being made again, and twice now an entry's stated
remedy has turned out to be wrong while its measurement stayed right (D-002
recommended the option that causes D-004; D-001 recommended carrying a category
score onto a capability row, which the fix deliberately did not do). Adding an
entry here is not a substitute for fixing it — it is a substitute for
*forgetting* it.

| | Defect | Status |
|---|---|---|
| D-001 | fabricated per-capability scores in four deliverables | **fixed** 2026-08-01 — by removal |
| D-002 | TAIW text 166 pt past the paper edge | **fixed** — D2 step 2 |
| D-003 | HAIW's twenty zero gaps | **fixed** 2026-08-01 — by derivation |
| D-004 | jsPDF `maxWidth` drops every line after the first | **fixed** + gated by TEXT-MAXWIDTH |
| D-005 | spine wrapped the first list item at the wrong width | **fixed** — D2 step 2 |
| D-006 | roadmap phase boxes 5 mm past the content column | **fixed** 2026-08-01 — all three modules |
| D-007 | four dangling capability ids in TAIW's `dataRequirements.json` | **fixed** 2026-08-01 — two of the four original items **withdrawn**, one narrowed |
| D-008 | HAIW invented 132 rows when the capability dataset failed to load | **fixed** 2026-08-01 — by removal |
| D-009 | `aeo_compliance_monitoring_aeo` carries its suffix twice | **open** — dataset-level, not client-visible |
| D-018 | the golden harness read only the first line of every wrapped table cell | **fixed** 2026-08-04 + gated by TEXT-INTEGRITY — no generator was at fault |
| D-019 | a '→' in AR-54's prose shipped as mojibake, and the harness measured its UTF-16 lines at double width | **fixed** 2026-08-04 + capture now refuses UTF-16 text runs |

**Three of these are one defect wearing three costumes.** D-001, D-003 and D-008
are all *a plausible number substituted where a real one was unavailable*:

| | What was missing | What was substituted |
|---|---|---|
| D-001 | any BACR→BVF / TACR→TCF link | a category score, jittered, on 112 + 96 invented capability rows |
| D-003 | a working lookup (the `find` never matched) | a constant 1.0/1.0/0.0 on twenty rows headed "largest gaps" |
| D-008 | `capabilities.json` itself, at runtime | 108 CSV rows + 24 PDF rows built from category scores |

The remedies differ because the *data* differs, not because of taste: HAIW had
`capabilityLinks` authored, so D-003 was fixed by **deriving**; BAIW and TAIW had
no such relation and D-001 was fixed by **removing**; D-008's input was missing
at runtime and no derivation is possible, so it too was **removed**.

The rule this yields, worth more than any of the three instances: **when the
input is unavailable, produce nothing and say so.** Never a placeholder, never a
neighbouring number, never a variation on one. Variation is the tell — every one
of these three added spread (`Math.random`, fixed offsets, `charCodeAt`,
`(ci % 5 - 2) * 0.15`) for no reason except to stop one number reading as one
number.

---

## D-001 — fabricated per-capability scores in four client deliverables

**Status** — FIXED 2026-08-01 **by removal**, in BAIW and TAIW. HAIW's variant
was fixed separately and differently, by derivation — see D-003. Found during
Phase D1 characterisation, 2026-07-31; scope widened the same day during Phase D2
Step 0. Held open through D2 because the resolution was a product decision, not
an engineering one, and it differed per module.

**This shipped to clients.** These were the export buttons on the maturity pages
of three live workbenches. Every assessment run through them produced a
deliverable containing invented capability scores, and the PDF is the document a
client is most likely to circulate.

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

Resolutions differ per module, and the same change was not right for all three:

- **BAIW / TAIW** — stop emitting `Current Level`, `Gap` and `Priority`, from
  both the CSV and page 13.
- **HAIW** — derive it. The links exist on all 720 questions.

## What the fix was — removal, not repair

**The two axes do not meet.** BACR's eight categories are a generic maturity
dimension. BVF's 112 capabilities are FSDM-specific banking functions. A
capability's `themeName` is not a narrower version of a BACR category — they are
orthogonal, and **the relation is absent from the data rather than merely
unwired**. TACR/TCF is the same shape. So there was nothing to repair: no join to
fix, no lookup to add, no heading that would make the number true. The columns
had to go.

**One earlier recommendation in this entry was overruled, deliberately.** The
list above ended "…plus the *category* score under a heading that says category".
That was rejected on the decision that carried the fix: a category score printed
on a capability row is read as the capability's score no matter what the heading
says, and the register would have re-imported the confusion it was removing. No
category score appears in either deliverable. It is on the radar, the scorecard
and the eight deep dives, against categories, where the axis is right. (D-002
carried a similarly stale recommendation — "pass `maxWidth`" — which would have
caused D-004. An entry's diagnosis outlives its proposed fix.)

**The CSVs are now capability registers.** Real rows, authored attributes only:

| | BAIW | TAIW |
|---|---|---|
| artefact id | `MR-BAIW-REGISTER` (was `MR-BAIW-GAP`) | `MR-TAIW-REGISTER` (was `MR-TAIW-GAP`) |
| rows | 112 real BVF capabilities | 100 real TCF capabilities (was **96** synthesised) |
| columns | 9 → 8 | 9 → 7 |
| dropped | `Current Level`, `Required Level`, `Gap`, `Priority` | same |
| kept, real | ID, Name, Theme, Group, Phase, declared data requirements, FSDM subject areas, Description | ID, Name, TCF Theme, Group, authored Framework Priority, declared data requirements, WCO DM domains |

The ids were renamed rather than left saying GAP over content that is not one.
HAIW keeps `MR-HAIW-GAP`: since D-003 its gap column is computed from real
`capabilityLinks`, so there the word is accurate. **The asymmetry records which
module has the relation authored.**

TAIW's `Priority` is not the removed one. The old column thresholded a jittered
category score; the new one is the dataset's own per-capability field — framework
editorial judgement, fixed for every client — and the header says
"Framework Priority (authored)" so the two cannot be confused.

Both CSVs are on `src/report/csv.ts` (BOM, CRLF, every field quoted). The old
BAIW code interpolated unquoted, so a capability name containing a comma
corrupted the row.

**Page 13 reports the framework instead of scoring it.** "Top 20 … with largest
estimated gaps" had no top 20 left once the fabricated gaps went, so both pages
became capability *coverage*: one row per group, with the delivery phase spread
(BAIW) or the authored priority mix (TAIW), and a count of how many capabilities
have a data dependency recorded. Every number is a fact about the framework, none
is a fact about the client, and the caption says so.

**The absence is now visible rather than papered over.** Both pages print the
dependency-coverage number instead of the four hardcoded strings that used to
fill that column — BAIW **15 of 112** capabilities have an FSDM subject area
recorded, TAIW **91 of 100** have a WCO DM domain. The 97 and the 9 get an empty
cell in the register. Empty is the truth.

**The path to a real per-capability score is authoring `capabilityLinks`** on
BACR's 804 and TACR's 640 questions, which is exactly what HAIW has and what
makes its gap column legitimate. **Not scheduled.** It is recorded here because
that is the point of removal: the gap in the authoring is now something a reader
can see, rather than something a jittered number was hiding.

## What removing the RNG unblocked

`Math.random` left the report code entirely with this change. Consequences,
measured:

| | before | after |
|---|---|---|
| unassertable column sets | 2 (3 columns each) | **0** |
| `compare.mjs` SKIPPED findings | 4 | **0** |
| artefacts asserting raw bytes | 21 of 23 | **23 of 23** |
| raw artefacts byte-identical over two runs | 33 of 35 | **35 of 35** |

**All 23 golden artefacts are now byte-reproducible, and two consecutive captures
of the whole suite are byte-identical — the first time in this project.**

**Harness status** — the `unassertable` declarations are **gone, not relaxed**:
the three columns they named no longer exist. Both entries now carry
`assertRawBytes: true`. The registry ids stay `gap-csv` while the artefact ids
became `MR-*-REGISTER`, so the committed baselines keep their identity and the
diff reads as a change rather than a deletion plus an addition.

Note what this closes, in the entry's own terms: the section above argues that
deterministic fabrication is *more* dangerous than nondeterministic fabrication,
because a stable wrong number acquires a baseline and a review process defending
it. Page 13 was exactly that — twenty fabricated rows asserted by
`normalisedTextSha256` on every run. Removing them is the only move that does not
leave the harness guarding a fiction.

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
label was fixed in step 1, and BAIW page 15 is D-006, fixed 2026-08-01.

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

## D-006 — the roadmap phase boxes are laid out 5 mm past the content margin, in all three modules

**Status** — FIXED, all three modules, 2026-08-01. BAIW and TAIW first, HAIW
immediately after once `geometry.mjs` proved it carried the same grid. Found
during Phase D2 step 3 (BAIW's spine migration), 2026-07-31, and deliberately not
fixed there: a geometry change, not a migration, and the migration's value was
that nothing else moved.

**Three modules, one defect, one visible symptom.** BAIW, TAIW and HAIW each had
the identical `boxW = 55` grid and the identical 14.17 pt overflow. Only BAIW's
longer title — "Phase 3: Advanced Analytics" — pushed a glyph past the margin, so
only BAIW was ever reported. The other two were found by measurement, not by
reading the code, and neither of their fixes is visible to any text-based check.

**Where** — `baiw/src/utils/reportGenerator.ts`, page 15 ("Roadmap Summary") of
`generateMaturityPDF`, and the same grid copied into
`taiw/utils/tradeReportGenerator.ts` and
`haiw/utils/healthReportGenerator.ts`:

```js
const boxW = 55
const x = MARGIN + i * (boxW + 10)      // 15, 80, 145 → third box ends at 200 mm
```

**What it did**

Three 55 mm boxes with two 10 mm gaps span 15–200 mm. The content column ends at
195 mm. The third box was **14.17 pt (5 mm) over the margin before a glyph was
drawn**:

| | width | centre | right edge | verdict |
|---|---|---|---|---|
| box 1 "Phase 1: Quick Wins" | 32.60 mm | 42.5 mm | 166.67 pt | inside |
| box 2 "Phase 2: Core Build" | 31.15 mm | 107.5 mm | 348.87 pt | inside |
| box 3 "Phase 3: Advanced Analytics" | 45.40 mm | 172.5 mm | **553.33 pt** | **0.57 pt past the 15 mm margin** |
| **box 3, the filled rectangle itself** | 55.00 mm | 172.5 mm | **566.93 pt** | **14.17 pt past the margin** |

That last row is the defect and the first three rows are its shadow. The original
entry recorded 0.57 pt, which is how far the *title* leaked; the **box** was 25×
further over. Nothing was off the paper and nothing was truncated.

**Why the spine could not fix it** — not a wrapping defect. Routing the title
through `spine.ts::text()` would left-align it out of its box. Wrapping it to the
box width still permits 200 mm, because the box is what breaks the margin.
Wrapping to the available half — the treatment the three radar charts got,
`min(x - MARGIN, pageWidth - MARGIN - x)` — gives 45.00 mm against a 45.40 mm
title, so it would have folded onto two lines inside a box sized for one.

**What the fix was**

The grid is now **derived from the content column** instead of guessed:

```js
const boxGap = 10
const boxW = (r.contentWidth - (phases.length - 1) * boxGap) / phases.length
const x = MARGIN + i * (boxW + boxGap)
```

53.33 mm is the value, not the code. Writing `boxW = 53.33` would have been the
same defect with a better number — it breaks again on a fourth phase, a different
gap or a non-A4 sheet. `phases.length` rather than `3` for the same reason.
Measured after in **all three modules**: boxes 53.33 mm each, grid
15.00 → **195.00 mm exactly**, and **zero paths past the content column across all
23 golden artefacts**.

Twelve text baselines and three filled rectangles moved per module. Page 15's text
**reassembles character-identical** in every module — 17 runs before and after in
BAIW and TAIW, 23 in HAIW (its page carries a `keyValueBlock` too), no title
folded at the narrower width, which was the risk worth checking. HAIW's
whole-document normalised text hash is unchanged: `f8c22550514b` before and
after.

**TAIW and HAIW are the instructive half.** Their boxes were 14.17 pt over too,
but their titles are short ("Phase 3: Advanced"), so **no glyph ever overflowed**
and every text-based check reported the page clean. Their right-edge extent is
552.76 pt before the fix and 552.76 pt after; the golden walk cannot see either
fix at all, and reports nothing but `bytes +7`. Only BAIW's longer title made the
shared defect visible, in one of the three modules that carried it — which is the
whole argument for measuring geometry rather than reading it.

**Harness status** — this is why `scripts/golden/geometry.mjs` now exists. The
text harness reads glyph runs; it structurally cannot see a box, so it could
never have caught the TAIW or HAIW instances — and in fact did not, for the whole
of D2. `geometry.mjs` walks the same page streams for **drawn paths** —
`m`/`l`/`c`/`re` — and reports every path whose extent passes the content column,
classifying deliberate full-bleed bands separately so they cannot mask a real one.
It reports rather than fails, because only a human can say whether a given shape
is meant to respect the text margin.

```
$ node scripts/golden/geometry.mjs
  baiw page 15   f  x 145.00..200.00mm  right 566.93pt  14.17pt PAST the margin
  taiw page 15   f  x 145.00..200.00mm  right 566.93pt  14.17pt PAST the margin
  haiw page 15   f  x 145.00..200.00mm  right 566.93pt  14.17pt PAST the margin
  3 path(s) past the content column, 15 full-bleed band(s) ignored     [before]

  0 path(s) past the content column, 15 full-bleed band(s) ignored     [after]
```

It found all three instances on its first run, including the two nothing else
could see. Run over all 23 artefacts it now reports **zero** paths past the
content column. All fourteen DGIW artefacts were clean throughout.

It is **not** wired into `compare.mjs` and nothing asserts it on every capture —
run it deliberately after any change to hand-placed boxes, grids or charts.

---

## D-007 — four dangling capability ids in TAIW's `dataRequirements.json`

**Status** — FIXED 2026-08-01. Filed 2026-08-01 with four items; **two were
withdrawn on investigation as my own framing error, one was narrowed, and one was
real and is fixed.** Found while closing D-001, by building the capability
registers out of the real relations for the first time.

The entry is kept in its corrected form rather than quietly amended, because the
withdrawn half is the more useful record: it is an instance of *measuring two
fields against each other without first establishing that they count the same
thing*, and the false alarm it produced very nearly caused a destructive "fix".

### FIXED — four referenced ids do not exist

`src/data/taiw/dataRequirements.json` links requirement → capabilities. Four of
the ids it named matched no row in `capabilities.json`:

| Referenced (wrong) | Canonical | refs |
|---|---|---|
| `trader_communication_outreach` | `trader_communication_and_outreach` | 2 |
| `warehouse_bonded_area_utilization` | `warehouse_and_bonded_area_utilization` | 5 |
| `sanctions_embargo_screening` | `sanctions_and_embargo_screening` | 2 |
| `refund_drawback_management` | `refund_and_drawback_management` | 2 |

Four ids, **11 references**. The inversion in `tradeReportGenerator.ts` dropped
them silently, so four real capabilities showed no WCO DM domain.

**`capabilities.json` is canonical**, on three independent grounds:

- TCF ids are `slug(sub)` with `&` expanded to `_and_`. That rule holds for
  **99 of 100** capabilities. The four short forms *drop* the `&` instead of
  expanding it, so they violate the derivation the other 99 obey.
- The long form appears in four files — `capabilities.json`, `enrichment.json`,
  `mappings.json`, `dependencies.json`. The short form appears in one.
- Both forms show the same split in `src/data/taiw_backup_20260314/`, so it
  predates March 2026. It is a transcription that dropped `&` rather than a
  rename applied to one file and not the other, which is what the original entry
  guessed.

**Fixed** by correcting the 11 references. TAIW WCO coverage **91 → 95 of 100**;
zero dangling references remain. Four cells in `MR-TAIW-REGISTER` went from empty
to populated, and page 13 of the TAIW PDF moved with them (four group rows +1
each, caption `91 of 100` → `95 of 100`, `remaining 9` → `remaining 5`).

### WITHDRAWN — `dataReqCount` is not stale, and must not be recomputed

The original entry said `dataReqCount` "is not the number of data requirements",
declaring 52 where `dataRequirements.json` holds 22, disagreeing in 111 of 112.
Every one of those numbers is correct and the conclusion drawn from them was
wrong: **the two fields were never counting the same thing.**

The design record in `archive/build-prompts/` names two different source CSVs:

```
bvf_capability_summary.csv   -> capabilities.json     (theme, group, sub, dataReqCount)
bvf_data_requirements.csv    -> dataRequirements.json (113 data requirements)
```

And the arithmetic settles which one `dataReqCount` came from:

```
sum(dataReqCount) over 112 BAIW capabilities        = 5218
capability_fsdm_dependencies.csv, per design record = 5218
```

Exact. `dataReqCount` counts **FSDM entity dependencies**. TAIW's field of the
same name is the same misnomer: it tracks `elements.length` in
`dependencies.json` exactly for **71 of 100** capabilities, summing 700 to 689.

**Recompute was offered as the safe default. It is not safe.** Rebuilding the
field from `dataRequirements.json` would give:

| | now | recomputed | capabilities reading 0 |
|---|---|---|---|
| BAIW | 5218 | 142 | 0 → **97** |
| TAIW | 700 | 315 | 0 → 9 |

It would replace an authoritative framework figure with "how many requirement
rows we happen to have authored so far", and two live UIs sum it for display —
`RoadmapBuilder.tsx:122` and `TradeRoadmapBuilder.tsx:228`, both rendering a
per-phase "Data Requirements: N". BAIW's roadmap would show near-zero. **Do not
recompute it from `dataRequirements.json`.**

### WITHDRAWN — `capabilitiesUsing` is not a mismatch either

The original entry recorded that `capabilitiesUsing` disagrees with
`capabilities.length` in **114 of 114** rows — every single one, which should
have been the tell. The design record shows the spec for that array literally
contained an ellipsis:

```json
"capabilitiesUsing": 15,
"capabilities": ["trader_360_profile", "trader_segmentation", "risk_profiling_engine", ...]
```

`capabilitiesUsing` is the true count from the source CSV's `Count` column;
`capabilities` was always an abbreviated sample. Same declared-vs-enumerated
split as `dataReqCount`, by design. A naming problem at most.

### NARROWED — a real sub-1% drift, against a different file

`dataReqCount` *has* drifted from `dependencies.json`, the sibling it actually
derives from — not from `dataRequirements.json`, which was the wrong comparand:

| | exact per-capability match | totals |
|---|---|---|
| BAIW | 9 of 112 | 5218 vs 5259 distinct (capability, entity) pairs |
| TAIW | 71 of 100 | 700 vs 689 elements |

Sub-1% in aggregate, off-by-small per row. Recomputing **against
`dependencies.json`** would be defensible. **Not scheduled** — nothing reads the
two as reconciled, and the headers now say which is which.

### The real defect on the reporting side — a header that invited the comparison

Both registers printed the field under **"Data Requirements (declared)"**. That
header is what produced this entire investigation: it names a different dataset
from the one the number comes from, so the only natural check is the one that
gives a false positive in 111 of 112 rows.

Renamed to what the number counts:

| Module | was | now |
|---|---|---|
| BAIW | `Data Requirements (declared)` | `FSDM Entity Dependencies` |
| TAIW | `Data Requirements (declared)` | `WCO Data Elements` |

The `(linked)` columns beside them are accurate and unchanged — they are derived
from `dataRequirements.json` and are a *name list*, not a count. Different grain,
different source, and now visibly so.

**The generalisable part:** a field name is not a specification. `dataReqCount`
sat next to `dataRequirements.json` for five months and every reader who put them
side by side would have drawn the same wrong conclusion. Before recording that
two fields disagree, establish that they were ever meant to agree — and prefer
the arithmetic to the naming, because 5218 matching 5218 exactly is evidence and
"they both say requirements" is not.

**Harness status** — the id fix was visible to it and the withdrawn items were
not, which is the honest summary. `compare.mjs` compares output to output, so a
dataset that disagrees with itself produces perfectly reproducible output;
`check-dgiw.mjs` is the tool with the right shape for a referential-integrity
guard on BAIW's and TAIW's capability relations, and remains the natural home for
one. Such a guard would have caught the four dangling ids on the day they
appeared. It would **not** have caught either withdrawn item, because neither was
a defect.

---

## D-008 — HAIW invented 132 rows when the capability dataset failed to load

**Status** — FIXED 2026-08-01, by removal. Found the same day, immediately after
migrating HAIW's CSV onto `src/report/csv.ts`, by reading the branch that
migration was not allowed to touch.

**Where** — `baiw/src/haiw/utils/healthReportGenerator.ts`, two fallbacks reached
on the same condition, `capabilities.length === 0`:

- `buildGapRows` — **108 CSV rows**, named `${cat} — ${group}` from fourteen
  hardcoded group names, each carrying a HACR category score offset by
  `(ci % 5 - 2) * 0.15`, with FHIR resources from a hardcoded per-category map.
- `buildCapabilityGaps` — **24 PDF rows** for page 13, named `${cat} Strategy` /
  `Analytics` / `Automation`, offset by 0, −0.3 and −0.5.

**What it did**

None of the 132 rows was an HCF capability. Every number on them was one of eight
category scores wearing a disguise.

The PDF half told a second lie on top of the first. It returned
`scored: 24, notAssessed: 0, notApplicable: 0`, so the caption printed
**"Scored 24 of 24 capabilities · not assessed 0 · not applicable 0"** over rows
that had never been measured at all — the exact census machinery added in D-003
to prevent this, reporting a fabrication as fully assessed.

**Why it was worse than D-001, despite never having run**

`loadCapabilities()` rejects nowhere in any fixture or UI path, so this was **dead
code that fabricates** — the worst available combination:

- **Never exercised**, so never reviewed and never in a baseline. The golden
  harness has 23 artefacts and not one covers it.
- **Reached exactly when the client's data is missing** — the one moment a reader
  has no way to sanity-check what they are holding.
- **Indistinguishable from real output.** 108 rows with plausible names, a spread
  of scores and a Priority column is what success looks like.

The trigger path made it silent end to end:
`loadCapabilities().catch(() => setCapabilities([]))` in
`HealthMaturityAssessment.tsx` swallowed the rejection into an empty array, and
`[]` is also what "still loading" looks like. A fetch failure became a
deliverable with no error anywhere in between.

**What the fix was**

Both fallbacks deleted. No substitute:

- `buildGapRows` returns `[]`. `downloadCsv` already returns `false` on an empty
  set and writes no file, and `generateHealthGapCSV` now propagates that boolean
  so the caller can act on it.
- `buildCapabilityGaps` returns an empty report carrying a new
  **`datasetAvailable: false`**. That flag exists because zero rows has two
  causes — a failed load and an unanswered assessment — and they mean opposite
  things. Page 13 renders no table and states which one it is. The rest of the
  eighteen pages are category-based and unaffected.
- `HealthMaturityAssessment` tracks the rejection instead of erasing it, logs it,
  and passes `capabilitiesFailed` down.
- `HealthReportGenerator` shows a red panel **before** the buttons, disables the
  CSV button, replaces the hardcoded "108 capability scores" caption with a count
  derived from the data, and surfaces any generation failure in an
  `role="alert"` box. The `handleGenerate` try/finally also gained a `catch`: a
  throw previously vanished, leaving the spinner to stop with no file and no
  explanation.

Measured after, with the dataset withheld:

```
CSV  generateHealthGapCSV(...) -> false, 0 files written
PDF  1 file, 18 pages, page 13 reads:
     "The HCF capability dataset could not be loaded, so no capability could be
      scored for this report. This page is empty for that reason and for no other
      — it is not a finding about the assessment. Category maturity elsewhere in
      this report is unaffected."
     synthesised names present: false
```

The normal path did not move: all three HAIW artefacts byte-identical, all 23
baselines unchanged, `compare.mjs` exit 0 with 23 raw-byte checks.

**The audit this prompted**

BAIW, TAIW and DGIW were swept for the same shape — a fallback that substitutes
rather than fails. **Nothing else of this class was found.** DGIW's many
`if (x.length === 0)` branches are the opposite pattern: they exist to *report*
the empty case in prose. BAIW's and TAIW's post-D-001 coverage counts likewise
report what is missing.

Two lesser things surfaced and are left alone deliberately:

- **`1.86` in `reportGenerator.ts`**, five times, as
  `typeof pkVal === 'number' ? pkVal : 1.86` — a hardcoded Pakistan banking
  average substituted for a missing benchmark. Same class, but **unreachable
  today**: all eight BAIW categories have a numeric benchmark in
  `benchmarks.json`. It would fire silently if a category were ever removed. One
  number, not 132 rows.
- **`scores.find(...) || { current: 0 }`** in all three generators.
  `computeCategoryScores` always returns every category, so the miss is
  structurally impossible; the default is defensive and dead. Worth knowing it
  would render as `0.0` rather than as "unmeasured" if it ever fired.

**Harness status** — invisible to it, and it is worth being precise about why.
`compare.mjs` asserts 23 artefacts byte-for-byte, but every one is generated from
a **complete** fixture. There is no fixture for a failed load, so no golden
artefact exercises either fallback. This is the same blind spot the README lists
for the `DRAFT` watermark: the harness proves the happy path is stable and says
nothing about the others. Finding D-008 took reading the branch, not running it.

---

## D-009 — `aeo_compliance_monitoring_aeo` carries its suffix twice

**Status** — open, dataset-level, **not client-visible**. Split out of D-007 on
2026-08-01, when establishing that `capabilities.json` is the canonical side of
the TCF id rule made this the one id that still breaks it.

**Where** — `src/data/taiw/capabilities.json`.

TCF ids are `slug(sub)` with `&` expanded to `_and_`. Having corrected the four
dangling references in D-007, the rule now holds for **99 of 100** capabilities.
The exception is `aeo_compliance_monitoring_aeo`, whose `sub` does not carry a
trailing "AEO" — the domain suffix looks to have been applied twice by whatever
generated the ids.

**Why it is not fixed with D-007, despite being one line of the same rule**

D-007's fix corrected *references* in an annotating file. Nothing pointed at the
short forms except `dataRequirements.json`, so the blast radius was 11 string
literals in one file and the canonical side was untouched.

This one is the reverse. The id is **defined** in `capabilities.json` and
referenced from `enrichment.json`, `mappings.json`, `dependencies.json` and
`dataRequirements.json`. Renaming it means editing the definition and four
referencing files together, and any file missed reintroduces exactly the dangling
reference D-007 just removed. It is a different-sized change and deserves its own
before/after.

**Cost of leaving it** — cosmetic only. The id is internally consistent: every
file spells it the same way, so nothing dangles and no lookup fails. It is ugly,
not wrong. The one live risk is that someone applies the slug rule mechanically
to "fix" the definition without sweeping the four referencing files.

**Harness status** — invisible, and would stay invisible after a fix, since ids
are keys rather than rendered content. A referential-integrity check in
`check-dgiw.mjs` — the guard D-007 argues for — would not flag this either: the
graph is intact. What would catch it is a check that asserts `id === slug(sub)`
across TCF, which is the same check that would have caught D-007's four before
they were authored.

---

## D-010 — BAIW's benchmark rollup disagrees with its own components

**Status** — **fixed in the dataset on 2026-08-02**, client-visible, and
**invisible to the golden harness by design**. See "Harness status" below, which
is the more interesting half of this entry.

**Where** — `src/data/benchmarks.json`, the `Overall Assessment` key of
`regionalLeaders` and `globalBest`.

Each of the three benchmark blocks carries eight per-category values and an
`Overall Assessment` rollup. Two of the three rollups did not equal the mean of
the eight numbers sitting three lines above them:

| block | stated | mean of its own 8 | |
|---|---|---|---|
| `pakistanBankingAverage` | 1.86 | 1.8625 | reconciles |
| `regionalLeaders` | **3.18** | 3.3 | **−0.12** |
| `globalBest` | **4.13** | 4.25 | **−0.12** |

The identical −0.12 on two of three looked systematic, which is why this was
investigated rather than recomputed on sight — `dataReqCount` under D-007 looked
like a defect and turned out to be counting a different thing, and the "safe
default" fix would have zeroed 97 capabilities.

**Why it is a typed number and not an independent source**

- **Git**: `baiw/src/data/benchmarks.json` has exactly one commit (`fb021e7`) and
  has never been modified. There is no in-repo history in which the components
  moved and the rollup did not.
- **The design record has both drafts, and they agree on the components.**
  `archive/build-prompts/v3-prompts-with-git.md` specifies the file verbatim with
  today's eight values *plus* `"overall": 1.86 / 3.18 / 4.13`. The later
  `corrected-architecture-report-generation-prompts.md` specifies **the same eight
  values and no `overall` key at all**. The components were never revised; the
  rollups were typed once, and two were wrong on the day they were written.
- **No derivation reproduces either number.** Mean 3.30 / 4.25, median 3.30 /
  4.25, geometric 3.285 / 4.242, harmonic 3.270 / 4.234, trimmed 3.30 / 4.267 —
  every central tendency of the components lands *above* the stated value. The
  implied divisors differ (8.30 vs 8.23), so no shared divisor explains both, and
  no weight vector proportional to any block in the file does either. Subsets of
  the eight that happen to average to 3.18 or 4.13 exist but share no index set
  between the two blocks — coincidence, not a rule.
- **The file's own convention is "rollup = mean of components"**, demonstrated by
  the sibling block that reconciles exactly.
- **The suite convention agrees.** `src/data/taiw/benchmarks.json` carries three
  rollups and all three are exact 2dp means (1.5625→1.56, 3.425→3.43,
  4.3125→4.31). HAIW's `DEFAULT_BENCHMARKS` carries no rollup key at all.
- Nothing marks it as independently sourced: no URL, no methodology note, no
  citation. The `examples` strings are illustrative peer names, not a source.

**Why TAIW's three reconcile and BAIW's did not.** TAIW's live file was authored
independently of the v3 prompt and after its components settled — the prompt's
`regionalLeaders` (4.0, 3.8, 3.5, 3.9, 4.2, 4.0, 3.7, 3.5) is not what shipped
(3.6, 3.3, 3.1, 3.5, 3.7, 3.8, 3.4, 3.0), and the prompt has neither a
`wcoTargets` block nor a rollup. Whoever wrote TAIW's file computed all three.
BAIW's was transcribed from v3 with the rollup carried along unchecked.

**The −0.12 itself is unexplained.** `sum − 8 × stated` is exactly 0.96 for both
blocks. That is recorded rather than explained: nothing in this repo produces it,
and inventing a story for it would be the same move as inventing the number.

**What it cost** — `reportGenerator.ts:715` reads
`regionalLeaders['Overall Assessment']` for page 16's "You are N levels behind
regional leaders. Closing this gap requires an estimated 18–24 months." Against a
2.8 cover score that printed **0.4** where the components say **0.5**. One line,
on a page whose whole purpose is a comparison against peers, understating the
distance in the bank's favour. `globalBest['Overall Assessment']` is read
**nowhere** and was wrong for free.

**Fix** — `regionalLeaders` 3.18 → 3.3, `globalBest` 4.13 → 4.25.
`pakistanBankingAverage` 1.86 is untouched and correct.

**Left alone, deliberately** — `reportGenerator.ts:715` carries
`: 3.18` as the fallback when the key is absent or non-numeric. It is now a stale
duplicate of a corrected value, and it is the same class as the five hardcoded
`1.86` fallbacks D-008 lists: unreachable while the key exists, wrong if it ever
fires. Source is out of scope for a dataset fix; it wants the same sweep those
five do.

**Harness status — the golden record cannot see this, and that is by design.**
`scripts/golden/fixtures/baiw.json` freezes a byte-identical copy of
`benchmarks.json` in its `data` block, so `compare.mjs` regenerates page 16 from
the **old 3.18** and reports `exit 0 — no actionable differences`. The freeze
exists for a good reason — CLAUDE.md: "a dataset edit must not read as a
generator regression" — but it cuts both ways: a dataset *correction* is equally
invisible, and nothing anywhere says so. DGIW is the counter-example: it reads
live data and records a `datasetFingerprint` in every baseline, so the same edit
would have surfaced as its own `source datasets` finding. BAIW, TAIW and HAIW
record `datasets: null` and that check never fires for them.

So the baseline now describes a document production no longer generates — the
same defect class as the fabricated ninth category, arriving from the opposite
direction. Updating the fixture's frozen copy is a content change to four
baselines and wants its own walk, exactly as the two ninth-category removals did.

---

## D-011 — a ninth BACR category that no question dataset contains

**Status** — **fixed 2026-08-02**, client-visible, and **invisible to the golden
harness for the opposite reason to D-010**. See "Harness status".

**Where** — `src/pages/MaturityAssessment.tsx`, `src/utils/reportGenerator.ts`
and `src/components/dashboard/MaturityRadarCard.tsx`, each carrying its own
nine-entry `CATEGORIES` list. `bacrQuestions.json` holds 804 questions across
**eight** categories and none of them is `"Overall Assessment"`.

Three hand-maintained copies of one list is how they diverged, and the ninth
entry is what they diverged into. On every live BAIW assessment it produced:

- a **ninth radar axis** pinned at 0, drawn like a measurement;
- a **ninth scorecard row** — `Overall Assessment | 0.0 | 0.0 | 0.0 | Not
  Assessed | -1.9`, where the last column is the phantom's zero compared against
  a benchmark it has no business having;
- **four reachable hardcoded fallbacks** — `typeof pkVal === 'number' ? pkVal :
  1.86` at the two radar lookups, the key-findings line and the scorecard row —
  which existed only because a category with no questions has no benchmark;
- and `isDraft = answeredCategories < totalCategories`, which is **8 < 9**, so
  **every complete BAIW report was stamped DRAFT**, permanently. The ninth
  category can never be answered, so the condition can never clear.

The fixture reproduced this faithfully until the golden record was corrected
two changes earlier; that fix corrected the record, this one corrects the thing
being recorded.

**Fix** — one declaration, `src/data/bacrCategories.ts`, imported by all three.

**Why declared rather than derived, which would be better.** A BACR question is
`{ id, category, subcategory, text, weight }`: no ordinal, no category id, no
category table. The only derivable order is order of first appearance —
`Business, Information, Applications, Systems, Agility, Culture, Governance,
Outcomes` — which is **not** the shipped order of the radar, the eight deep-dive
pages, the scorecard or the benchmark table. Deriving would silently reorder four
rendered surfaces to match an accident of how the file was generated. A runtime
derivation would also drag the 188 kB question bank into the dashboard card,
which lazy-loads it today precisely to avoid that. So the ORDER is declared once
and the SET is the gate's job — see "The check this wants" below.

**Two off-by-ones that existed only to route around the phantom**, and are the
trap for anyone who shortens the list without reading its consumers:
`for (let ci = 0; ci < CATEGORIES.length - 1; ci++)` for the deep dives, and
`CATEGORIES.slice(0, 8)` for the benchmark table. Cut the list to eight and leave
the `- 1` and the report loses a deep-dive page. Both now read the length.

**The seven fallbacks are gone, not left unreachable.** Four were reachable (see
above); three — the deep-dive `pkScore` and the page-16 table's `'1.9'`/`'3.2'`/
`'4.1'` — were already dead behind the `slice`/`- 1`. All seven are replaced by
one `benchmarkFor()` helper with a single cast, because `BENCHMARK-ROLLUP` now
asserts every real category has a numeric entry in every benchmark block. **An
unreachable branch that renders a number is a wrong number waiting for its caller
to change** — which is exactly what the four reachable ones were.

**`regionalLeaders["Overall Assessment"]` is derived, and the rollup keys are
gone.** Page 16's peer distance read that key with `: 3.18` behind it — a stale
duplicate of the value D-010 had just corrected. It is now the mean of the same
eight numbers the table above it prints: the same 3.3, and it cannot drift from
its components again. All three phantom rollup keys have left
`src/data/benchmarks.json`, which supersedes D-010's dataset edit — the two
corrected values went with the keys that held them. BAIW now has HAIW's shape,
and `BENCHMARK-ROLLUP` stays green because it treats an absent rollup as
legitimate by design.

**TAIW has the same constant and it is inert; HAIW is clean.**
`tradeReportGenerator.ts` still declares nine `CATEGORIES` against eight TACR
categories, but `TradeMaturityAssessment.tsx` derives its categories from
`tacrQuestions.json` and passes only scored ones — so the ninth reaches no
rendered surface. It is dead weight in a constant plus one
`regional['Overall Assessment']` read, and it carries the same `- 1` / `slice(0, 8)`
trap. HAIW's `HACR_CATEGORIES` is eight and correct. Left alone here; TAIW's is a
one-file change with no output movement and wants its own.

**Harness status — nothing moved, and that is the proof rather than a gap.** All
three BAIW artefacts report `raw bytes stable`: page count, glyphs, runs, table
rows and bytes all held, every right-edge extent held, zero runs past margin. The
fixture supplies eight scored categories, so it was already exercising the
post-fix caller, and every generator change here is behaviour-preserving **for an
eight-category caller**. The three baselines moved in `datasets` only — the
fingerprint D-010 added, doing its job.

The consequence is that the **production** change is not measurable by this
harness: no fixture supplies nine categories, and after this fix none can. The
per-surface effect is enumerated above from the code paths. The one production
effect with no coverage at all is the DRAFT watermark, which the README already
lists as a blind spot — it was on for every complete BAIW report and is now off,
and no golden artefact renders it either way.

**Two things this turned up, neither fixed here**

- `MaturityRadarCard.tsx` does not score by category. It slices
  `Object.values(answers)` positionally into `CATEGORIES.length` equal blocks and
  averages each, which aligns with the real categories only while the user
  answered every question in presentation order and never revisited. Skip a
  category, answer out of order or stop halfway and every axis is labelled with
  someone else's questions. Going from nine slices to eight removes a
  permanently-empty axis and leaves the rest exactly where it was.
- `CapabilityNavigator.tsx::getMaturityScore` builds `relevantCategories` from a
  `CATEGORY_THEME_MAP` and then **never uses it** — it returns the mean of *every*
  answer, rendered per BVF theme as that theme's maturity. Every theme therefore
  shows the same number. That is D-001's shape with the map as decoration, and it
  is live on the capability navigator.

**The check this wants** — nothing joins a module's *rendered* category set to its
question dataset. `BENCHMARK-ROLLUP` joins the benchmark file to the questions;
this defect lived one step away, in the list the UI and the report iterate. See
the proposal filed with D-011 in the phase notes.

---

## D-012 — two BAIW surfaces scoring things they cannot score

Two defects, one prompt, both **fixed 2026-08-02**, both **live on screen and
unreachable by any fixture**. Neither is a report, so no golden artefact renders
either; see "Harness status".

### D-012a — `MaturityRadarCard` scored by position, not by category

**Where** — `src/components/dashboard/MaturityRadarCard.tsx`.

`radarData` sliced `Object.values(answers)` into `CATEGORIES.length` equal
positional blocks and averaged each one. The axis labelled "Governance" showed
the mean of whichever answers happened to land in the third slice. It also
carried a dead `catAnswers` filter whose body was `return true`.
`getAssessmentProgress` had the same shape: `Math.floor(answered / 8)` counts any
eight answers as "a category assessed".

That aligns with the real categories only while the user answers every question
in presentation order and never revisits. **Driven directly** through Vite SSR
against the real exported function:

```
Agility only, answered at 2 (8 answers)
  OLD  Business=2  Culture=2  Governance=2  Information=2
       Applications=2  Systems=2  Agility=2  Outcomes=2
  NEW  Business=NOT ASSESSED  …  Agility=2.0  …  Outcomes=NOT ASSESSED
       Scored 1 of 8 categories · not assessed 7.
```

Eight questions answered in ONE category put a score on ALL EIGHT axes. With
`perCat = ceil(8/8) = 1` every category received a one-element slice of the
Agility answers. A client looking at that dashboard saw seven categories they had
never been asked about, each carrying a number.

**Fix** — attribute each answer by its question id through `bacrCategoryOf`, then
score through `src/scoring/maturity.ts` — the same primitive TAIW and HAIW use,
not a fourth path. Three states apply: an untouched category is NOT ASSESSED and
plots **no vertex** (`null`, which recharts leaves blank), never a zero on the
innermost ring. The coverage statement prints under the chart, because a shape
drawn from one of eight categories is not the claim a shape drawn from eight
makes.

**The 188 kB constraint does not block it, and that was worth checking before
changing the loading behaviour.** Category attribution needs the question →
category relation, and BACR ids encode it: `business_summary_001`. All 804 ids
match `<prefix>_<rest>`, the eight prefixes map one-to-one onto the eight
categories, and no prefix serves two. So the card still does not import
`bacrQuestions.json` and the dashboard chunk is unchanged. That relation is now a
load-bearing assumption, so `BACR-CATEGORY-PREFIX` asserts it on every build —
an unchecked assumption is how the card came to score by position in the first
place.

### D-012b — `CapabilityNavigator` showed every BVF theme the same number

**Where** — `src/pages/CapabilityNavigator.tsx`.

`getMaturityScore(themeName)` built a `relevantCategories` list from a
hand-written `CATEGORY_THEME_MAP` and then **never used it**. What it returned was
`allAnswers.reduce(...) / allAnswers.length` — the mean of every answer in the
assessment — rendered beside a capability as "Maturity: N/5" for its theme. All
three BVF themes therefore displayed the identical number, and the map that was
supposed to make them differ was decoration.

**Removed, not repaired, and the map went with it.** BACR's 804 questions carry no
capability link and no theme link — D-001's data fact, the same one that makes
BAIW ship a capability REGISTER rather than a gap register. There is no honest
per-theme maturity to compute. `CATEGORY_THEME_MAP` is a keyword bridge of exactly
the kind TAIW's TCF navigator badge was removed for in D4, and leaving it behind
is how this one gets armed the same way: someone notices `relevantCategories` is
unused and "corrects" it into the average.

Replaced by what the dataset authors — capabilities per theme, how many have an
FSDM subject area, phase distribution — with a line saying plainly that maturity
is measured against BACR categories, which no dataset joins to a BVF theme.

### Harness status — the harness cannot see either, and zero movement is not evidence

Neither surface is a report. `compare.mjs` exits 0 over 27 unchanged artefacts and
that says **nothing** about these two, because no fixture reaches a React
component. Reporting it as confirmation would be the vacuous pass this repo keeps
finding.

Verified instead by reading the call paths and by **driving the real exported
function** under Vite SSR with a `localStorage` shim — the table above is that
run's output, not a hand-computed illustration. D-012b has no exported entry
point to drive; it was verified by reading, and its replacement renders only
counted dataset facts.

### TAIW and HAIW

- TAIW's `TCFCapabilityNavigator` carried the same badge and it was removed in D4.
- HAIW's `HCFCapabilityNavigator` filters on `maturityLevelRequired`, an authored
  per-capability field that `HCF-SHAPE` validates. Not derived from an assessment.
  Clean.
- TAIW's dashboard gauge reads the active engagement and returns `null` when
  nothing is answered — fixed in D4.
- **HAIW's dashboard radar was a third costume of the same problem — see D-013,
  fixed.** It was worse than first logged: the scores were random *and* not one of
  the eight labels was an HACR category.

---

## D-013 — HAIW's dashboard radar is `Math.random()` over labels that are not HACR categories

**Status** — **FIXED**. Wired to the real answers. Found while checking whether
TAIW and HAIW carried D-012's shape.

**Where** — `src/haiw/components/HaiwDashboard.tsx`:

```js
const radarLabels = [
  'Data Governance', 'Clinical Analytics', 'Population Health',
  'Financial Analytics', 'Operational Analytics', 'Research & Innovation',
  'Infrastructure', 'Interoperability',
]

const radarData = radarLabels.map(label => ({
  category: label,
  score: Math.floor(Math.random() * 2) + 2,
  fullMark: 5,
}))
```

### Two defects, not one

**1. The scores were random.** Fresh 2s and 3s on every module load, drawn at the
same size, in the same palette, with the same axis furniture as the three real
charts beside it. CLAUDE.md: "**Variation is the tell.** `Math.random`, fixed
−0.3/−0.5 offsets, `charCodeAt` … spread with no source is a disguise, not data."
Two people looking at the same screen saw different shapes and a screenshot was
unreproducible.

**2. NOT ONE OF THE EIGHT LABELS WAS AN HACR CATEGORY.** This was missed when the
defect was first logged — the entry above said "eight HACR category labels", and
it was wrong. Exact overlap with the eight distinct `category` values in
`hacrQuestions.json` is **zero**.

> **Correction, D5 stage A.** The table below originally said four of the eight
> labels "correspond to nothing in the module at all". That is false, and the
> truth is more interesting. `Clinical Analytics`, `Financial Analytics`,
> `Operational Analytics` and `Research & Innovation` are **exact HACR
> subcategory names**, and `Population Health` is one word off
> `Population Health Analytics`. HACR is 8 categories × 10 subcategories; the
> card mixed the subcategory level with truncated category names — **one level
> down, not invented**. Everything else in this entry stands: the labels are
> still not the category set, the scores were still random, and the fix is
> unchanged. What changes is the diagnosis of how it got written: someone reached
> into the taxonomy at the wrong depth, rather than making names up.

| on the card | in HACR |
|---|---|
| Data Governance | Data Governance **& Standards** |
| Infrastructure | Infrastructure **& Systems** |
| Interoperability | **Integration &** Interoperability |
| Operational Analytics | *(a subcategory of Analytics & Intelligence, not a category)* |
| Clinical Analytics | *(a subcategory of Analytics & Intelligence)* |
| Financial Analytics | *(a subcategory of Analytics & Intelligence)* |
| Population Health | *(near-miss for the subcategory Population Health Analytics)* |
| Research & Innovation | *(a subcategory of Outcomes & Impact)* |
| — | Strategy & Leadership |
| — | Workforce & Skills |
| — | Analytics & Intelligence |
| — | Patient & Community Engagement |
| — | Outcomes & Impact |

Four of the eight name nothing in the module at all. A reader comparing the card
to the assessment screen would have found eight different axis names with no way
to reconcile them, under a caption asserting they were HACR categories.

`CATEGORY-UNIVERSE` did not catch this and could not: its duplicate scan looks for
an array literal whose set **equals** the module's category set, and this one
overlapped it by nothing. A near-miss list is not a copy.

### The subtitle was not a fix

"Sample HACR category scores (placeholder)" is more honest than BAIW's unlabelled
positional slicing, and it is still not enough. A radar polygon drawn with the
authority of the measurements next to it reads as a measurement whatever the small
print says — and the small print was itself false, since these were not HACR
categories.

### The fix — wired, not removed

HAIW is the module where the honest version is cheap, and both preconditions hold:

- **Answers are reachable.** `HealthMaturityAssessment.tsx` files them under
  `haiw_maturity_answers` through `usePersistedState`, which namespaces per active
  engagement via `writeNsRaw`; `EngagementProvider` wraps every route in
  `App.tsx:45`, `/haiw/*` included. The card reads the same key through the same
  `engagement/storage` primitive. It is **not** D4's site 3 — that read a bare
  `taiw_maturity` key nothing had written since namespacing. The key is now one
  exported constant, `HACR_ANSWERS_KEY`, so reader and writer cannot drift.
- **The 1.18 MB question bank is not needed.** Attribution comes from the answer
  id — `HACR-SL-001` — and `HACR-CATEGORY-MAP` asserts for all 720 questions that
  the id code and the `category` field select the same category. The built
  `HaiwDashboard` chunk references neither `hacrQuestions` nor jsPDF.

Scored through `src/scoring/maturity.ts::scoreCategories`, the same primitive as
the assessment screen, the PDF, TAIW and BAIW. Three states: an untouched category
is `not-assessed`, plots `null` rather than a vertex on the innermost ring, and the
coverage statement prints under the chart.

### One declaration moved

`HACR_CATEGORIES` and the id-code table lived un-exported inside
`healthReportGenerator.ts`. The dashboard cannot import that module — 1,400 lines,
jsPDF and the whole spine — and retyping the eight names would have been the
fourth-copy shape `CATEGORY-UNIVERSE` exists to reject. They moved to
`src/haiw/hacr.ts`; the generator imports them; `haiw.mjs`'s `declaredIn` follows.
Verified live at the new location by planting a duplicate and watching
`CATEGORY-UNIVERSE` name it.

### One assumption became a checked fact

`HACR_QUESTIONS_PER_CATEGORY = 90`. The card holds the answers but not the
questions, so it pads each category to that count to state how many questions the
category **has** — the only thing separating `not-assessed` from `not-applicable`.
It moves no mean, since `aggregate()` divides by the answered count. A constant
nothing checks is how a dashboard came to score by position for two phases, so
`HACR-CATEGORY-MAP` now fails if any category stops holding 90, with its own
selftest row. The build prints `HACR 720 questions across 8 categories, 90 each`.

### Harness status — no fixture reaches this, and zero baseline movement is not evidence

`compare.mjs` reports 27 artefacts unchanged. That confirms the generator did not
move when its constants were re-homed. It says **nothing** about the card: the
golden harness renders PDFs, and no fixture instantiates a React component.

`scripts/dashboard-drive.mjs` (`npm run drive:dashboards`) is the evidence, and it
now exists precisely because this class of defect has been invisible twice. It
seeds answers, calls the real exported `hacrRadarState`, and prints what each axis
would draw. The seeded case is **one category of eight** — at 8-of-8 the broken and
the fixed code agree exactly, which is why every fixture missed this twice:

```
  engagement "drive-engagement" → answered 10

    Strategy & Leadership              NOT ASSESSED
    Workforce & Skills                 2.0
    Data Governance & Standards        NOT ASSESSED
    Infrastructure & Systems           NOT ASSESSED
    Analytics & Intelligence           NOT ASSESSED
    Integration & Interoperability     NOT ASSESSED
    Patient & Community Engagement     NOT ASSESSED
    Outcomes & Impact                  NOT ASSESSED

  coverage line under the chart: Scored 1 of 8 categories · not assessed 7.
  axes plotted: 1 of 8 — the other 7 plot null, not 0
```

---

## D-014 — TAIW's trade-balance sparkline is hand-typed and does not reconcile with the figure above it

**Status** — open, **not fixed**. Found sweeping the other five dashboards for
D-013's shape.

**Where** — `src/taiw/components/TaiwDashboard.tsx:36`, `MONTHLY_TRADE`: twelve
months of `{ exports, imports }`, hand-typed, commented in source as
`/* TD1: Static monthly trade data for sparkline */` — a note the reader never
sees. It feeds the "Trade Balance Trend" card.

The card's headline reads **$26.27B Current Deficit**, which is real: it comes from
`pakistanContext.json::statistics.tradeDeficit`. The twelve months plotted beneath
it sum to **$58.20B imports − $32.10B exports = $26.10B**. Two numbers on one card,
17 basis points apart, one sourced and one invented to look like it.

**Why this is a different, smaller defect than D-013.** It is macro country
context, not a client measurement; the axis labels are months, so nothing is being
attributed to a category or a capability that does not carry it; and it is stable
rather than random, so two viewers see the same chart. What it shares is the
shape: **hand-authored numbers rendered with the authority of derived ones, with
the disclaimer in a source comment.**

**The fix is a content decision**, which is why it is logged rather than done:
either author a monthly series into `pakistanContext.json` beside the deficit it
must reconcile with, or drop the chart. Deriving twelve months from one annual
figure would be fabrication with extra steps.

**Swept and clean:** BAIW's `Dashboard.tsx` (every tile from `loadDomains` /
`loadCapabilities` / `loadReuseScores`, plus the radar fixed in D-012), COE's
`CoeDashboard` (`revenueModel.leverBreakdown`, `cashMetrics`), ALM's `AlmDashboard`
(`balanceSheet`, `repricingGap`, `liquidity` — every KPI summed from positions),
DGIW's `PracticeOverview` (six datasets). No `Math.random` remains anywhere in
`src/` outside `engagement/storage.ts`'s id generator, where it is correct.

BAIW's profitability pages carry customer names suffixed `(illustrative)` and a
`POP` population map labelled "Illustrative representative segment populations".
Those are **authored dataset content, disclosed on screen** where the reader sees
it — the opposite of this defect, and not a finding.

---

## D-015 — HACR's question `weight` was a counter, and it reached the client

**Status** — **FIXED**. Flattened to 1; `HAIW-WEIGHT` now asserts it. D5 stage A.
Found while reading the datasets for the D5 design report, not by any check.

**Where** — `src/data/haiw/hacrQuestions.json`, all 720 questions:

```
weight === W[(i + 1) % 5]   for ALL 720 questions in file order,
W = [0.8, 0.9, 1.0, 1.1, 1.2]
```

Exactly 144 questions at each of the five values. It is a repeating five-cycle
over the file — a sequence position, not a judgement about which questions matter
more. The whole dataset is generated the same way: 720 questions are **nine
aspect stems × eighty subcategory labels**, `levelDescriptions` and
`pakistanContext` are one template each with the label substituted in. The weight
is the same kind of artefact.

### What it was believed to be

Three places asserted it was a decision:

| | said |
|---|---|
| `CLAUDE.md` | "Categories are an unweighted mean; capabilities are weight-weighted … for HAIW it is a choice" |
| `src/scoring/maturity.ts` | "HACR questions carry `weight` 0.8–1.2 and TACR questions carry none" |
| `healthReportGenerator.ts` | "EQUAL WEIGHTS HERE, WEIGHTED FOR CAPABILITIES, AND THAT IS A DELIBERATE SPLIT" |

And page 13 told the client so in as many words: **"Weight-weighted mean of the
answered HACR questions linked to each capability."**

### Why the check did not catch it

`HAIW-WEIGHT` asserted `weight > 0`, so that `aggregate()`'s unweighted fallback —
the NaN guard — stayed provably dead. That assertion was **true of a counter**. A
check that constrains a value's *range* says nothing about whether the value was
*decided*, and `> 0` is the widest possible constraint short of none.

### What it did to the numbers

Not academic. The design report estimated the effect at 0.033, which was the
deviation of each capability's **mean weight** from 1.0 — the wrong quantity. The
score deviation is larger, because the answered subset's weights do not average
to 1 when only part of an assessment is filled in:

| | full fixture (720/720 answered) | partial fixture (315/720) |
|---|---|---|
| unrounded means moved | **108 of 108** | **108 of 108** |
| printed 1dp values moved | **46 of 108** | **108 of 108** |
| max abs delta on a mean | 0.0885 | **0.2143** |
| priority bands moved | 5 | 9 |
| page 13 top-20: entered / left | HCF-028, HCF-037 / HCF-079, HCF-094 | HCF-012, HCF-027 / HCF-031, HCF-043 |

**The partial profile is the worse one, and that is the pattern.** A half-finished
assessment is exactly where a spurious weighting bites hardest, and it is exactly
the profile no fixture exercised before D4 added `answersPartial`.

### The fix

- All 720 weights → `1`. Value-only edit, verified: every record identical apart
  from `weight`, 1296 insertions / 1296 deletions across the live file and the
  frozen fixture copy.
- `HAIW-WEIGHT` asserts **`=== 1`**, strictly stronger than `> 0`. It will fail
  the day someone authors real weights — which is correct, because that moves
  every capability score and needs its own walk.
- The build prints `unweighted (every weight 1)` rather than `weights 0.8–1.2`.
  A range on stdout is what a five-cycle looked like for two phases.
- Page 13's caption now reads **"Unweighted mean"**. A caption claiming a
  weighting the numbers do not have invites a reader to ask which questions
  counted more, and the honest answer was "whichever the counter landed on".

### Also found, not fixed — two `priorityLabel` functions disagree

| | Critical | High | Medium |
|---|---|---|---|
| `healthReportGenerator.ts:151` | `gap > 2` | `> 1.5` | `> 1` |
| `HealthMaturityAssessment.tsx:59` | `gap >= 2.5` | `>= 1.5` | `>= 0.5` |

Two functions of the same name, over the same 1–5 gap scale, with different
thresholds. They label different units today — the screen labels the overall
category gap, the report labels a capability — but a client reading both sees one
word for two rules: a gap of 2.2 is "Critical" in the PDF and "High" on screen; a
gap of 0.8 is "Low" in the PDF and "Medium" on screen. Out of scope for stage A,
which was the weight counter. Logged so it is not rediscovered.

---

## D-016 — HACR's `capabilityLinks` is a counter, and it is the only thing HAIW's capability register rests on

**Found:** 2026-08-02, D5 stage D, while measuring HACR's question bank for the
framework crosswalk. **Status: OPEN — measured, reported on every build, not
fixed.** The fix is a content decision and is set out at the bottom.

### What it is

```
capabilityLinks[0] === 'HCF-' + pad(((i + 1) mod 108) + 1)   for 720 of 720
                                                              questions in file order
```

Verified exhaustively, zero exceptions. Every question carries exactly one link.
It is the same `(i + 1) % N` idiom as D-015's weight five-cycle — same generator,
same author, one field over.

### Why it is worse than D-015

D-015's counter *perturbed* capability scores. This one **is** the capability
score. It is also the relation `CLAUDE.md` cites, in as many words, as the reason
HAIW alone may ship a gap register while BAIW and TAIW ship coverage registers:

> **Only HAIW can score a capability**, because only HACR's 720 questions carry
> `capabilityLinks`.

The field is present. What is absent is that it means anything.

### What it does to the numbers

The cycle has period 108 over 720 questions in category order, so it strides
across every category boundary:

| | |
|---|---|
| capabilities reached | 108 of 108 |
| questions per capability | 6 or 7 |
| **HACR categories each capability draws from** | **6 or 7 of the 8** |

So a capability score is a stratified sample of the **whole assessment**, not of
that capability. `HCF-041 Clinical Decision Support` is scored from questions
about strategy, workforce, governance, infrastructure, analytics, interoperability
and outcomes in roughly equal measure — which is a description of the
organisation, not of clinical decision support. Every capability converges toward
the same number for the same reason, and the spread between them is the phase of
the counter.

This is the D-001 family: **a plausible number under a heading that makes it look
defensible.** It differs from D-001, D-003 and D-008 in one way only — the
fabrication is in the *dataset* rather than in the code, so every code review of
`scoreCapabilities()` was reviewing correct arithmetic over invented evidence.

### Why the check did not catch it

`HCF-LINK` asserts both directions of referential integrity: every link resolves
to a capability, and every capability is reached. **A counter satisfies both
perfectly** — better than a real relation would, since a real one would leave some
capabilities thinly evidenced and some questions linking to two.

That is D-015's lesson restated: `HCF-LINK` constrains the link's *shape* and says
nothing about whether the link was *decided*. A check that a foreign key resolves
is not a check that the relation is real.

### What is reported now, and why not asserted

`HCF-LINK` measures the counter and the build prints it on every run:

```
capabilityLinks is POSITIONAL: link[0] === HCF-(((i+1) mod 108) + 1) for 720 of 720
  — a counter over file order, not an authored relation. D-016.
```

Reported, not asserted — the `TCF-COVERAGE` precedent. An assertion here fails the
build over a defect the current stage cannot honestly fix, and "fix" has two
candidate meanings that lead to opposite deliverables:

1. **Author the links.** 720 question→capability decisions against HCF's 108. Real
   work, and the only route that keeps `MR-HAIW-GAP` meaning what its name says.
2. **Withdraw the per-capability score.** HAIW joins BAIW and TAIW: a capability
   **register** of authored attributes, page 13 reporting framework *coverage*, and
   `CLAUDE.md`'s three-module table collapses to "no module can score a
   capability". This is the D-001 remedy applied consistently, and it is what
   D-001 chose for BAIW and TAIW when *their* relation turned out not to exist.

Either moves page 13's twenty rows, the gap CSV and five golden baselines. Both
are content decisions with their own walk.

**When it is fixed, the reported line becomes an assertion that the links are NOT
positional** — the same upgrade `HAIW-WEIGHT` got from `> 0` to `=== 1`.

### What does NOT rest on it

The D5 stage D framework crosswalk. It maps framework dimensions onto HACR's **80
subcategories** — an authored topic taxonomy — and reads `capabilityLinks`
nowhere. The four framework scorecards inherit nothing from this.

### The general rule this earns

**A generated dataset should be assumed generated until a field is shown to have
been decided.** Three fields of `hacrQuestions.json` are now known to be
mechanical: `question`, `levelDescriptions` and `pakistanContext` are nine
templates over the subcategory name (`HACR-INSTRUMENT`), `weight` was a five-cycle
(D-015), and `capabilityLinks` is a 108-cycle (this). The fields that survive
scrutiny are `id`, `category`, `categoryId` and `subcategory` — the taxonomy. That
is the honest boundary of what HACR measures, and it is why the crosswalk was
authored against the taxonomy and against nothing else.

### RESOLVED — 2026-08-02, D5 stage E2: withdrawn

**Option 2 was taken.** HAIW's per-capability score is gone, and all three modules
now hold one rule: **a capability score requires an AUTHORED link.**

What shipped:

| | before | after |
|---|---|---|
| artefact id | `MR-HAIW-GAP` | `MR-HAIW-REGISTER` |
| PDF page 13 | Capability Gap Matrix — top 20 by gap | HCF Capability Coverage — 16 group rows |
| CSV | 9 cols incl. Current / Target / Gap / Priority | 7 cols, authored attributes only |
| export | `generateHealthGapCSV(answers, caps, questions, meta)` | `generateHealthCapabilityRegisterCSV(caps, meta)` |
| `HacrQuestionLink` | `Pick<…,'id'\|'weight'\|'capabilityLinks'>` | `Pick<…,'id'\|'weight'>` |

`scoreCapabilities`, `buildCapabilityGaps`, `CapabilityScore`, `CapabilityGap`,
`CapabilityGapReport` and `TOP_CAPABILITY_GAPS` are **removed, not left
unreachable** — an unreachable branch that renders a number is a wrong number
waiting for its caller to change, which is what D-008 was.

`aggregate()` stays. It is the category engine `scoreCategories` calls; only its
capability caller went.

**`HCF-LINK` keeps its two assertions and loses its claim.** Every link resolving
and every capability being reached are still worth knowing — they are the first
thing anyone authoring 720 real links will want — but they establish that the ids
line up and nothing more. A counter satisfies a foreign-key check *better* than a
real relation would: nothing dangles, every target is reached, the distribution is
perfectly even. The positional measurement moved to **`HCF-SYNTHETIC`**, where it is
**asserted** rather than reported, because the content decision this defect was
waiting on has now been made and what needs guarding is that it is not silently
inherited.

### Authoring 720 real links is the UNLOCK, not the plan

Recorded deliberately, because the gap being visible in a file is not a reason to
close it. HAIW is the one module where the work is tractable — HACR's 80
subcategories and HCF's 108 capabilities are both authored taxonomies over the same
domain, so a subcategory-to-capability mapping is a reviewable authoring task rather
than a research project, and it is the same shape as the D5 crosswalk entries that
already exist. TAIW cannot: TACR carries no `capabilityLinks` field at all.

**It should be driven by a client asking for capability-level maturity**, and it
brings back page 13's ranking, the gap columns and `MR-HAIW-GAP` with it. Until then
the register is the honest deliverable, and `HCF-SYNTHETIC` will fail the build on
the first authored link so that the decision is retaken rather than assumed.

---

## D-017 — two more HCF capability fields are positional, and one of them reads as a client requirement

**Found:** 2026-08-02, D5 stage E2, while choosing which attributes the replacement
capability register should carry. **Status: RESOLVED same stage — both withdrawn from
every deliverable and pinned by `HCF-SYNTHETIC`.**

### What it is

Two fields of `src/data/haiw/capabilities.json`, neither previously measured:

```
maturityLevelRequired === [2, 3, 3, 1][i % 4]              for 108 of 108, file order
relatedCapabilities  === [previous, next] in file order    for 108 of 108, clamped
```

`maturityLevelRequired` is the dangerous one. Its distribution is

```
level 1: 27    level 2: 27    level 3: 54
```

which reads like an authored profile weighted toward level 3, and is 27 repetitions
of one four-cycle. Levels 4 and 5 never occur. `relatedCapabilities` is why
**HCF-001 and HCF-108 list themselves** — clamping at the ends of a two-wide window.

### Why it was not caught

`HCF-SHAPE` asserted `maturityLevelRequired` is an `integer 1..5`. True of a
counter. **This is D-015's `weight > 0` with a range on it** — a check that
constrains a value's range says nothing about whether the value was *decided*.
`relatedCapabilities` was checked by `HCF-FK` for referential integrity, which a
neighbour list satisfies perfectly.

Both were about to be carried into the replacement register: the stage brief named
`maturityLevelRequired` among the "real attributes" and its distribution as one of
two honest candidates for page 13. It was neither.

### Why a heading cannot rescue them

TAIW's register does carry a fixed dataset field — `Framework Priority (authored)` —
and that precedent looked like it covered these two. It does not. TCF's priority is
**editorial judgement that happens to be client-independent**; these are **sequence
position**. That is exactly the distinction D-015 turned on, and CLAUDE.md is
explicit: *do not rename the column to make it defensible — a reader takes the
number as the row's own no matter what the heading says.* A client sorting a
spreadsheet by "Maturity Level Required" would be planning against `i % 4`.

### The fix

Neither field appears on page 13 or in `MR-HAIW-REGISTER`. Page 13 carries the
attributes that survived measurement — 105 distinct FHIR resource triples across 108
capabilities with only one shared between two groups, and 70 distinct HCDM
subject-area sets, both group-coherent — as **distinct counts per group**, because
every capability names exactly three FHIR resources so a linked/unlinked column
would read `N/N` for all sixteen groups.

`HCF-SYNTHETIC` pins all three cycles — these two and D-016's links — and **fails
the day any of them stops being positional**, because on that day the field has been
authored and omitting it stops being correct. `HAIW-WEIGHT`'s and
`HACR-INSTRUMENT`'s shape exactly. Two selftest rows, one per branch.

### The general rule this earns

**A generated dataset should be assumed generated until a field is shown to have
been decided** — D-016 earned that rule for `hacrQuestions.json`; this extends it to
`capabilities.json`, which had never been examined the same way. Of its fourteen
fields, four are now known mechanical (`maturityLevelRequired`,
`relatedCapabilities`, and `description`/`businessQuestions` are templated on the
capability name). The taxonomy — `id`, `name`, `theme`, `group` — and the two data
linkages survive. **Measure the field before you ship the column**, and measure it
even when the stage brief already calls it real.

---

## D-018 — the golden harness read only the first line of every wrapped table cell

**Found:** 2026-08-04, investigating a reported third text-loss mechanism —
autotable cell clipping in `spine.ts::table()`, said to have truncated 44 of 52
checklist items and 27 of 52 artefact names in AR-09's PDF. **Status: RESOLVED
same stage — the extractor fixed, and `TEXT-INTEGRITY` added as the guard.**

### The reported defect does not exist. The guard that would have told you so did not either.

The investigation was set up to confirm autotable clipping and measure its blast
radius. The measurement said something else, and it is worth recording in that
order because the wrong conclusion was one step away and every existing signal
pointed at it.

`docs/`'s worked example was CL-20. Its checklist item reads *"Every CDE has a
named owner and steward; unassigned elements logged as open risks"*, and the
phrase `as open risks` could not be found anywhere in the 21 pages of AR-09. That
is true of the harness. It is not true of the PDF:

```
$ pdftotext -layout operating-model-pdf.pdf om.txt
$ grep -n "unassigned elements logged" om.txt
789:   unassigned elements logged as open risks        open risk log
```

Every glyph is on the page. The content stream says so directly:

```
BT
/F1 7 Tf
8.05 TL
87.20 691.50 Td
(Every CDE has a named owner and steward;) Tj
T* (unassigned elements logged as open risks) Tj
ET
```

### The mechanism

`scripts/golden/harness.mjs::readTextRuns` matched a text-showing operator only
when the string literal began the stream line:

```js
if ((t = /^(\((?:\\[\s\S]|[^\\()])*\))\s*Tj$/.exec(line))) { emit(...) }
```

That is correct for `doc.text(string, x, y)`, which is what `spine.ts::text()`,
`bullets()`, `keyValueBlock()` and `sectionHeading()` all emit — one call per
line, so one `Td` per line, so one literal at the start of its own line. It is
wrong for `doc.text(arrayOfLines, x, y)`, which is what **jspdf-autotable calls
once per wrapped cell**: one `Td`, then every subsequent line as `T*` followed by
the literal **on the same stream line**. Two operator forms appear in these
documents and the reader knew one:

| form | count in AR-09 | read |
|---|---:|---|
| `(S) Tj` | 1,284 | yes |
| `T* (S) Tj` | 171 | **no** |

So the harness saw the first line of every wrapped cell and none of the rest, in
all four modules, for as long as the reader has existed.

### What that cost

`glyphs`, `textRuns`, `widestText`, `rightEdgePt` and `normalisedTextSha256` were
all computed over a subset of the page. Measured across the full capture, after
the fix:

```
19 of 54 artefacts moved · glyphs 249,044 -> 273,980 · 24,936 glyphs reappeared
9.1% of the suite's text was invisible to its own golden record
raw bytes: stable on all 54 · page count: unchanged · right-edge extent: unchanged
```

The three worst are HAIW's framework alignment packs at +3,335, +3,167 and
+3,044 glyphs each. **`rawBytesSha256` did not move on a single artefact**, which
is the proof that nothing was wrong with any generator: the bytes were always
right and only the reading of them was short.

`tableRows` also rose on two artefacts (AR-09 140 → 164, AR-02 39 → 45). That
proxy counts baselines carrying ≥3 distinct x positions; continuation lines sit
on their own baselines, so seeing them makes more rows visible. The proxy is
behaving as its comment says it does — it is not a table parse.

### Why every existing guard was blind, including the ones written for this

This is the third text-loss symptom in the register and the first where the text
was not actually lost. All four signals agreed, and all four were wrong for
different reasons:

| | why it said nothing |
|---|---|
| `TEXT-MAXWIDTH` | greps for a `maxWidth` key. `table()` sets no such key — D-004's mechanism, not this one |
| `geometry.mjs` | looks for drawn paths PAST the margin. A cell that stops short is inside the margin, and so is a cell that does not |
| the golden baselines | hash whatever the extractor produced. A reader that drops 9.1% of the text hashes that consistently, forever |
| the extractor itself | not a guard at all, which is exactly why nothing was watching it |

**A guard is only as wide as its reader.** Two of the three golden classes —
glyph count and text hash — are functions of `readTextRuns`, so a gap there is a
gap in everything downstream of it, silently and in the safe-looking direction.
`geometry.mjs` was built precisely because "the text harness cannot see the rest"
and it reads *paths*; nothing was ever built on the premise that the text harness
could not see the text.

### The observation that looked like proof and was not

The strongest evidence for the clipping hypothesis was that the symptom got
BETTER with more text: a longer draft moved the count from 44 truncated items to
32. That reads as decisive — a text-losing defect that improves under longer
input cannot be found by reading the code, and it is exactly what column-width-
from-longest-cell would produce.

It is exactly what the extractor bug produces too. Column width comes from the
longest cell in the same table, so a longer draft widens the column, so **fewer
cells wrap onto a second line** — and only a cell that wraps has a continuation
line for the reader to drop. Same input, same direction, same magnitude, opposite
cause. A behavioural signature can be consistent with two mechanisms, and the one
that has to be ruled out is the one in the instrument.

### The fix

`readTextRuns` now tracks the text-line state the `T*` operator depends on —
`TL` leading, and the x of the last positioning operator — and handles `T*` both
standing alone and carrying its literal. Position is tracked rather than guessed
because `right` feeds `pastMarginPt`: a run placed at an invented x would swap a
blind spot for a false reading, which is worse.

`TD`'s leading side effect is handled in the same branch. jsPDF emits `TL` + `Td`
so that path is defensive rather than observed, and it is written down as such.

### The guard: `TEXT-INTEGRITY`, and why it is written against the symptom

Three mechanisms have now produced one symptom, and every guard in this repo was
written against a **mechanism** — which is why each was blind to the next:

```
D-004  doc.text(s, x, y, { maxWidth })    TEXT-MAXWIDTH  greps the key
D-005  splitTextToSize before setFontSize  (none)        fixed, never guarded
D-018  the reader itself                   (none)        this
```

`scripts/golden/text-integrity.mjs` compares the **input** to the **output** and
names neither mechanism. The input side is the generator's own row data, recorded
by `scripts/golden/autotable-recorder.mjs` — a shim aliased over the bare
`jspdf-autotable` specifier, on the `file-saver` sink's precedent, so **no
application source changes at all**. `src/report/spine.ts` is the suite's only
runtime importer of that package, so one alias covers every table every generator
in every module draws. The output side is the glyphs `analysePdf` already reads.

```
documents 40   tables 279   cells 9,236   cells losing text 0
```

It would have caught all three of the mechanisms above, and it does not have to
be told what the fourth will be.

**The assertion is glyphs in order, with whitespace removed on both sides**, and
that specific shape was arrived at by three false positives, each of which is a
real property of correct output:

| what a naive comparison called LOST | what it actually was |
|---|---|
| 593 cells across 18 documents | the extractor bug itself — the finding above |
| 16 header cells in AR-02 | `dataLandscape.ts:164` injects `&\n`, and a 13 mm column breaks `Payments` mid-word into `Paymen`/`ts` |
| CW-H-063 in HAIW's DCAM pack | autotable split the row across a page break; the cell's second line opens page 7 under the repeated header |

Only the first was a defect. **A guard that fails on correct output is a guard
people turn off**, so the two legitimate discontinuities are declared in the
source with the measurement that found them, rather than absorbed by loosening
the test until it went quiet. The cost is stated too: a lost *space* is invisible
to a glyph-sequence check. That is the right trade — the symptom with three
instances is dropped glyphs.

### What it does not cover

Table cells only. `text()`, `bullets()`, `keyValueBlock()` and `sectionHeading()`
are not recorded, because the recorder sits on the autoTable import rather than
on jsPDF. Widening it is strictly additive to the same comparison and is not done
here: D-018 is a table defect, and a guard shipped wider than it was demonstrated
is the `FRAMEWORK-COVERAGE` shape — a class that cannot fail over most of its
declared scope.

It asserts **presence, not placement**. A cell whose text appears somewhere in
the document passes even if it was drawn in the wrong column. That floor is
deliberate: losing text is the symptom with three instances, and a check that
also asserted position would fail on every legitimate reflow.

### The rule this earns

**Rule out the instrument before you accept the finding.** Three independent
signals — a missing phrase, a plausible mechanism in a library known to clip, and
a behavioural signature that got better with more text — all pointed at
`spine.ts::table()`, and one `pdftotext` run pointed somewhere else. The check
running, the check finding, and the check *reading the whole artefact* are three
separate facts; this repo had already learned the first two.

And the narrower one, for anything that parses a content stream: **enumerate the
operator forms present before trusting a reader that matches one.** The count is
two here, it took one `sed` to establish, and the second form carried 9.1% of the
suite's text.


## D-019 — a `→` in AR-54's prose shipped as mojibake, and the instrument that could have said so was busy reporting a different, false finding

**Found:** 2026-08-04, walking the G1 diff. **Status: RESOLVED same stage — the
character replaced, the extractor taught the second string encoding, and
`assertNonEmpty` now refuses to record a document carrying one.**

### Two findings in one measurement, one true and one false

`walk.mjs` reported two text runs on AR-54 pages 2 and 8 with a right edge of
**1130.53 pt on a 595.28 pt sheet** — text past the paper edge, unchanged
before→after, so pre-existing. That finding is FALSE, and D-018's closing rule
("rule out the instrument before you accept the finding") is the only reason it
was not filed as a layout defect: no `Tm` in the whole document carries a
translation past 560 pt, so nothing was ever drawn there.

The true finding was underneath. The runs are the two lines of
`programmeGap.ts::B_NO_WAVE_ROW` containing `→` (U+2192). Helvetica's WinAnsi
encoding has no U+2192, so jsPDF silently emits any line containing one as a
**UTF-16BE string** — `(\x00a\x00r\x00t...)` — and, because a standard-14 font
carries no `/ToUnicode` and no usable two-byte `/Encoding`, every viewer decodes
those byte pairs as WinAnsi:

```
$ pdftotext AR-54_fixture-bank-limited_all_2026-07-31.pdf - | grep Composing
... Composing artefact !' pillar !' wave would place AR-09, a rung-2
```

**"artefact !' pillar !' wave", on pages 2 and 8 of every AR-54 ever exported,
in both layer variants.** The character does not survive the font; the string
must not contain it.

### Why every existing guard missed it

| guard | why it was blind |
|---|---|
| `TEXT-MAXWIDTH` | greps for a key, not an encoding |
| `text-integrity` | covers table cells only, and says so — this is paragraph prose |
| `nonWinAnsiFonts` (baseline field) | checks the FONTS a run selects, not the characters in the string |
| `geometry.mjs` | drawn paths; no path moved |
| golden `rawBytesSha256` | stable — the mojibake was faithfully reproduced every run |

The one instrument that flagged anything was `readTextRuns`, **by accident and
with the wrong finding**: it assumed every string literal is single-byte
WinAnsi, counted each BYTE of the UTF-16 runs as a glyph, and estimated the
lines at double width — which is the 1130.53 pt. D-018's narrower rule, one
level down: it enumerated the operator forms and not the **encoding** forms.
Two appear in these documents; the reader knew one.

### The fix, in three parts

1. **Content** — `B_NO_WAVE_ROW` uses ASCII `->`, with a comment saying why.
   Comments and markdown generators may use `→` freely (six arrows in the two
   roadmap markdown templates are untouched — UTF-8 text files render them
   correctly); a string a PDF generator renders may not.
2. **Instrument** — `unescapePdfString` detects UTF-16BE (even length + a NUL
   byte, which no WinAnsi string jsPDF emits can contain) and decodes it, so
   glyph counts, widths and `rightEdgePt` are measured over characters, not
   bytes. AR-54 page 2's right edge reads 552.76 pt again.
3. **Guard** — every page report records `utf16Runs`, the document records
   `utf16RunCount`, and `assertNonEmpty` FAILS on a non-zero count, so a
   mojibake document can be neither captured nor `--accept`ed into the golden
   record. Demonstrated failing before trusted: an arrow reintroduced in a
   throwaway edit produced `Error: dgiw/programme-gap-pdf: 2 UTF-16 text
   run(s) — a non-WinAnsi character reached a PDF string and renders as
   mojibake in every viewer`, and the edit was reverted.

### What the guard does not cover

It runs where PDFs are analysed — capture, walk, and baseline read-back — not
in `npm run check`, so the first signal for a new instance arrives at the
golden gate rather than the dataset gate. A static check over report-source
string literals was considered and rejected: the same files legitimately hold
markdown template strings full of Unicode, and a rule that needed a
per-file exception list to avoid false positives would go stale the first time
a generator moved. The refusal at the record is the honest floor: nothing
mojibake can become a baseline.

### The rule this earns

**A character set is part of the contract with the font.** The suite renders
with the standard 14 fonts; their ceiling is WinAnsi, and any character above
it does not degrade gracefully — it takes its whole line into an encoding no
viewer can read. When prose wants an arrow, write `->`.

## D-020 — a designed refusal and a real failure share one channel, and the console-clean assertion cannot tell them apart

**Found:** 2026-08-05, filed at G4 checkpoint 0 from a G3-close observation.
**Status: RESOLVED 2026-08-05, G5 checkpoint 1.** The refusal is now TYPED:
`src/dgiw/report/refusal.ts` declares a `Refusal` error class (name +
`refusal: true` discriminant, so the check survives the gate's separate
esbuild bundle where `instanceof` would not), AR-55, AR-56 and the G5 council
pack throw it, and `useDeliverable.ts::run()` branches on `isRefusal`: tone
'info', **no `console.error`** — the error path is untouched for real faults.
GAP-REFUSAL's and PLAN-REFUSAL's contract holds unchanged (the builder still
throws the predicate's own message; `Refusal extends Error`), and the new
REFUSAL-CHANNEL gate asserts both halves: every engagement-only builder
throws the class rather than a bare `Error`, and the refusal branch carries
no console output. The click-through now drives the refusing Deliverables
button with the console-clean assertion intact — and the assertion was shown
FAILING under a temporary revert of the branch, then restored, because a
guard that has never failed is decoration. The section below is the entry as
filed, kept for the history.

### What it is

AR-55 (`gapStatements.ts`) refuses by design: `buildGapStatementsPdf` throws
the refusal message when the intake is not actionable or the register is
empty, and that throw is the contract GAP-REFUSAL asserts. On the /gaps page
the refusal never reaches the throw — `GapRegister.tsx::generatePdf` calls
`gapStatementsRefusal` first and returns the message as an info notice. On
the Deliverables page it does reach it: `useDeliverable.ts::run()` catches
the throw, surfaces the message correctly in the page banner — and also
prints it through `console.error('[dgiw] deliverable generation failed', err)`,
the same line every REAL generation failure goes through.

Two consequences, one worse than the other:

- The committed CDP click-throughs assert a clean browser console. A script
  that drives the Deliverables AR-55 button in a refusing state would fail
  its console-clean assertion on behaviour that is working as designed — so
  either nobody ever drives that path (the current state), or someone adds a
  filter for the message text, which is a filter that hides a real error the
  day one carries similar wording.
- A consultant with the console open reads "deliverable generation failed"
  for an outcome the page itself describes as expected. The channel says
  failure; the banner says by-design. Two surfaces, two verdicts, one event.

### The shape it belongs to

The check running, the check finding, and the check reporting what it found
are three separate facts — this file's recurring lesson, here applied to an
error channel: the REPORT is wrong even though the behaviour and the message
are right. A refusal is a legitimate outcome, not an exception; squeezing it
through the exception channel makes it indistinguishable from the failures
that channel exists for.

### The fix when taken (not in G4)

`run()` needs a second refusal-shaped path — a typed refusal (subclass or a
sentinel the task returns, as the CSV path already returns `false` → notice)
so designed refusals surface as notices without touching `console.error`, and
generators keep throwing plain `Error` for real faults. The AR-55 precheck on
/gaps is the pattern: ask the predicate before building. Whichever shape,
GAP-REFUSAL's contract (builder throws the predicate's message) must keep
holding for direct callers, and the click-throughs can then drive the
refusing Deliverables button with the console-clean assertion intact.
