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
