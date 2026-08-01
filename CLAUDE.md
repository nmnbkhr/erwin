# erwin — Godaitec Workbench Suite

Six industry intelligence workbenches in one client-side React SPA.

## Ground truth — the prose docs are stale

`README.md` and `docs/PROGRESS.md` say React 18, Router v6, port 5173, eight
modules. All wrong. `APP_MAP.md` omits DGIW entirely. **Trust `App.tsx` and
`package-lock.json`, never the prose.**

React **19.2.4** · Router **7.13.1** · Vite **7.3.1** · TS **5.9.3** ·
Tailwind **4.2.1** · dev port **5174** · **six** modules.

## Architecture, stated plainly

**There is no backend.** No server, no database, no API, no authentication, no
network I/O — `fetch`/`axios`/`import.meta.env` appear nowhere in `src/`. Data is
~19 MB of hand-authored and script-generated JSON imported as ES modules and
bundled at build time. All mutable state is browser storage.

Do not add a backend, database, ORM, auth layer or API client without explicit
approval. If a task seems to require one, STOP and say so — there is almost
always a client-side answer, and the suite-level backend is a separate planned
project with its own reviewed schema.

## Modules

| Module | Route | Code | Data |
|---|---|---|---|
| BAIW — Banking Analytics | `*` (catch-all) | `src/pages/`, `src/components/` | `src/data/` |
| TAIW — Trade Analytics | `/taiw/*` | `src/taiw/` | `src/data/taiw/` |
| HAIW — Healthcare Analytics | `/haiw/*` | `src/haiw/` | `src/data/haiw/` |
| COE — Cash Optimization | `/coe/*` | `src/coe/` | `src/data/coe/` |
| ALM — Asset-Liability Mgmt | `/alm/*` | `src/alm/` | `src/alm/data/` |
| DGIW — Data Governance | `/dg/*` | `src/dgiw/` | `src/dgiw/data/` |

**Route ordering in `App.tsx` is load-bearing.** BAIW is `path="*"` and must stay
last. A route added after it is unreachable.

DGIW's directory is `dgiw` but its URL prefix is `/dg`. Known inconsistency —
do not "fix" it, the routes are live.

Dataset location is inconsistent: BAIW/TAIW/HAIW/COE under `src/data/<module>/`,
ALM/DGIW colocated at `src/<module>/data/`. Follow whichever the module already
uses.

## Hard rules

1. **`archive/` is never read by the app.** Verified by grep, recorded in
   `archive/README.md`. Do not import from it. Do not treat it as live.
2. **`check-dgiw.mjs` is the only quality gate in the repo.** Extend it, never
   bypass it. If you touch a DGIW dataset, `npm run check:dgiw` must still pass.
   Despite the name it is no longer DGIW-only: `REPORT_SOURCE_LOCATIONS` declares
   five locations — `src/report`, `src/dgiw/report` and the three module
   generators — and CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL all run over
   them. A declared location that goes missing is a finding, never a skip.
3. **`npm run build` and `./dev.sh build` are not equivalent.** Only the npm
   script runs the dataset gate. Always verify with `npm run build`.
4. **Zero tests exist.** No vitest, jest or playwright. If a task needs tests,
   propose the framework and wait for approval — do not install one unasked.
5. **`tsc -b` must pass.** `strict: true`. `noUnusedLocals` and
   `noUnusedParameters` are deliberately off — do not turn them on.
6. **Additive only.** Do not delete or rewrite an existing file. Extend it.
7. **Do not add a seventh copy of the layout shell.** See below.

## Known duplication — do not extend it

The dominant structural fact of this repo is copy-paste:

- **Six near-identical module layout shells**, ~120 lines each, differing only by
  colour and `navItems`. Anything new that belongs in a module header goes in
  **one shared component** imported by all six, not pasted a seventh time.
- **No pre-spine PDF report generator remains.** All three —
  `utils/reportGenerator.ts`, `taiw/utils/tradeReportGenerator.ts`,
  `haiw/utils/healthReportGenerator.ts` — are on `src/report/spine.ts` as of D2
  step 3. A fourth module's report starts from one of them, not from scratch.
  What each still keeps to itself, behind the public `doc` escape hatch, is its
  radar chart, score disc and coloured boxes; those own their overflow and must
  call `moveTo()` afterwards. BAIW's and TAIW's third CSV moved onto
  `src/report/csv.ts` when D-001 was closed; **HAIW's gap CSV is the last
  hand-rolled one** and is the next to migrate.
- **Two generations of workbench components** — `components/workbench/` is the
  shared data-driven one; `components/profitability/` is BAIW's unmigrated
  predecessor. Build against `components/workbench/`.
- **Two data-loader idioms** — `import.meta.glob` in BAIW,
  `/* @vite-ignore */` template-string imports in TAIW/HAIW. Prefer the BAIW
  form for new code.
- Dead weight: `src/data/taiw_backup_20260314/` (1.2 MB, imported by nothing) and
  six empty directories under `src/components/`. Leave them; don't add more.

## DGIW is the pattern to copy

It is the newest and most rigorously built module. It is the only one with a
dataset integrity gate, the only one with a documented layer model (`core` vs
`banking`, tagged on every record — `src/dgiw/layer.ts`), the only one with a
role registry resolving free-text owner strings to archetypes
(`src/dgiw/roles.ts`), and the only one whose source carries *why*-comments
explaining the defect that motivated the code. Match that standard. BAIW is the
pattern that accreted — do not use it as a model.

Note: "role" in `src/dgiw/roles.ts` is **domain content, not access control**. It
gates nothing. The `core`/`banking` layer filter is likewise a content
visibility concern with no security property.

## Report determinism

`src/report/` output must be **byte-identical across runs**. jsPDF injects two
sources of nondeterminism that a reader cannot see and a diff can:

- **Creation date** — pinned via `setCreationDate(meta.generatedAt)`.
- **Trailer `/ID`** — filled from `Math.random` unless set. Pinned via
  `setFileId(stableFileId(...))`, FNV-1a over
  `artefactId|engagementId|orgName|layer|generatedAt|contentDigest`.

Both live in the `ReportDoc` constructor, once. Symptom if either regresses: two
generations of the same report are identical for tens of thousands of bytes and
differ in one 16-byte run.

**`/ID` covers content, not just identity.** The digest is the last seed field
and comes from `contentKey()` in `spine.ts` — sorted, `U+0001`-joined, default
comparator so it is locale- and engine-independent. Each generator passes what it
actually renders as the second argument to `createReport`: AR-01 the rendered
answers, AR-13 the in-scope CDE ids, AR-27 the rule ids, AR-04 prefixed
`wave:`/`gate:` ids, AR-09 prefixed `activity:`/`role:` ids.

Identity alone was not enough: two AR-01 reports for one engagement on one day
with different answers are different documents, and `/ID` is the field a viewer
or DMS uses to decide that. Sharing one meant a revised report could be treated
as the copy already held and never refreshed. Determinism is unchanged — the
inputs now simply include the content.

A new generator that omits the digest gets identity-only behaviour and silently
reintroduces the bug. If a report's content can vary while its meta does not, it
must pass a content key. `check-dgiw.mjs` ARTEFACT-IMPL enforces that much: every
`createReport` call under `src/dgiw/report/` must pass a second argument, and it
may not be a string literal, `undefined`, or an expression with an empty literal
in any branch.

**ARTEFACT-IMPL verifies a content digest is SUPPLIED, not that it is DERIVED.**
`contentKey(['constant'])` passes the check and reintroduces the `/ID` bug. When
reviewing a new generator, read the digest expression and confirm it varies with
what the report renders — under the active layer, not the whole dataset.

`generatedAt` is truncated to the day **at the call site** — these are dated
deliverables. Do not pin it to a constant to make a test pass; two runs either
side of UTC midnight differing is correct behaviour, not a bug.

No `Math.random`, `Date.now` or bare `new Date()` anywhere under `src/report/`
or `src/dgiw/report/`. Dates are formatted from UTC parts, never
`toLocaleDateString` — the locale form is neither machine- nor timezone-stable,
and near midnight it disagrees with the filename.

## Text in a report must go through the spine

Two ways to lose text on a page, both silent, both found by measurement rather
than by reading the code. Neither is a style preference.

**Never `doc.text(s, x, y, { maxWidth: n })`.** It reads as "wrap this". jsPDF
computes the split and then draws **only the first line**; everything past the
break is discarded with no error and nothing visible except a sentence that
stops. Three sentences were lost from every HAIW PDF ever exported, and three
instances were sitting in `spine.ts` itself. `check-dgiw.mjs` **TEXT-MAXWIDTH**
now rejects the key outright across all five declared report source locations.
Wrap with `splitTextToSize` and emit one `doc.text` per line — which is what
`spine.ts::text()` does — or, where only one line fits, call
`spine.ts::fitOneLine`, which marks the cut with an ellipsis instead of hiding
it.

**Set the font size BEFORE you measure.** `splitTextToSize` measures at whatever
size the document is currently set to, so a split computed before `setFontSize`
wraps against the *previous* call's size. `bullets()` and `keyValueBlock()` did
this, so the first item of every list wrapped wrongly and the rest were fine —
which is exactly why it survived from Phase B to Phase D. Both directions hurt:
measuring at 18pt and drawing at 9pt breaks a line at half width; measuring at
8pt and drawing at 9pt ran the operating-model report **off the sheet**.

Do not assume the three pre-spine generators were the careful ones. BAIW and
TAIW passed no width at all and overflowed visibly (D-002); HAIW passed
`maxWidth` and truncated invisibly (D-004). Invisible is worse. The spine is the
floor, not any of them.

**Text is not the only thing that can overflow, and the text harness cannot see
the rest.** The page-15 roadmap boxes were laid out to 200 mm against a 195 mm
content column — the third *box* sat 14.17 pt past the margin before a glyph was
drawn. That is **D-006**, box geometry, not something `text()` can fix. Fixed in
all three modules: the grid derives from `r.contentWidth` and `phases.length`.

The lesson is the measurement, not the box. All three modules carried the
identical `boxW = 55`, but TAIW's and HAIW's titles are shorter, so **no glyph
overflowed and every text-based check called those pages clean** — two of the
three instances were invisible for the whole of D2, and their fixes are invisible
too (the walk reports nothing but `bytes +7`).
`scripts/golden/geometry.mjs` exists for this: it walks page content streams for
drawn *paths* rather than glyph runs. It is not wired into `compare.mjs` — run it
deliberately after any change to hand-placed boxes, grids or charts. Hand-placed
geometry must be derived from `r.contentWidth`, never from a literal that happens
to fit today.

## DGIW scoring

`src/dgiw/scoring.ts` is the single source of every diagnostic figure. Both
`Diagnostic.tsx` and every report generator call it. **A PDF that disagrees with
the screen is worse than no PDF.** `layerShows()` in `layer.ts` is likewise the
one scope predicate — never reimplement the core/banking filter locally.

Three pillar states, and they are distinct facts:

| State | Meaning |
|---|---|
| `scored` | applicable questions in this layer, at least one answered |
| `not-assessed` | applicable questions in this layer, **none** answered |
| `not-applicable` | **no** questions in this layer at all |

Neither of the latter two may render as `0` or enter any average, count or
rollup. The overall score's denominator is the scored count and must be stated
on the page — a bank reading 0 where the truth is "unmeasured" has a wrong
number, not a missing one.

Note: with the current dataset every pillar has both core and banking questions,
so `not-applicable` never occurs through the UI. The state is still computed and
reported explicitly ("Not applicable 0"). Do not delete the branch as dead code.

## HAIW scoring

**Every score in `src/haiw/` goes through `aggregate()` in
`utils/healthReportGenerator.ts`. Do not add a second path.** It returns the same
three states as DGIW — `scored` / `not-assessed` / `not-applicable` — as a
**discriminated union**, so `current`, `desired` and `gap` are unreachable until
`state === 'scored'`. That is deliberate: the `current: number` shape carrying
`0` for "unmeasured" is what produced D-003, twenty capabilities ranked at gap
0.0 on a page headed "largest gaps". A reviewer catching that is luck; the
compiler refusing it is not. Unscored items are excluded from a ranking, never
sorted to the end of it, and the denominator is printed on the page.

Page 13 of the PDF and `generateHealthGapCSV` both call `scoreCapabilities()`.
Before D-003 they each computed their own numbers and **disagreed about the same
capability on the same day**. One function, or the two deliverables drift again.

**Categories are an unweighted mean; capabilities are weight-weighted. The
difference is passed as an argument, not implemented twice** — `aggregate()`
takes a weight per entry, and category scoring passes `1`. Do not "tidy" this
into two functions, and do not make it uniform without deciding to:

`question.weight` is declared in `types.ts` and is read **only** by capability
scoring. Weighting the categories too moves every category's gap 1.3 → 1.4 and
desired 4.3 → 4.4, which moves the cover score, the radar, eight deep-dive pages
and the markdown — and puts the PDF at odds with the on-screen scorecard in
`HealthMaturityAssessment.tsx`, which takes a plain mean. **A PDF that disagrees
with the screen is worse than no PDF.** Making the module weighted throughout is
a content decision deserving its own change and its own before/after, not a
refactor done in passing.

`hacrQuestions.json` is 1.18 MB and already loaded by the assessment page, so the
report takes questions as a **parameter** typed
`Pick<HacrQuestion, 'id' | 'weight' | 'capabilityLinks'>` rather than importing
the dataset. Keep it that way: it is an honest contract about what is read, and
it keeps a second copy out of the report chunk.

## A capability score needs a link, not a heading

Every module has two vocabularies: an **assessment** axis (BACR / TACR / HACR
categories — a generic maturity dimension) and a **capability** axis (BVF 112,
TCF 100, HCF 108 — framework-specific business functions). They are
**orthogonal**. A capability's theme is not a narrower version of a category, and
projecting one onto the other is not a rounding error — it is a fabrication.

**Only HAIW can score a capability**, because only HACR's 720 questions carry
`capabilityLinks`. BACR's 804 and TACR's 640 do not. That is the whole
difference, and it is a data fact, not a wiring gap:

| Module | Link authored | Per-capability score |
|---|---|---|
| HAIW | `capabilityLinks` on 720 of 720 | **derived** — see D-003 |
| BAIW | none | **not emitted** — D-001, removed |
| TAIW | none | **not emitted** — D-001, removed |

BAIW and TAIW therefore ship a capability **register** (`MR-*-REGISTER`) —
authored attributes only — and their page 13 reports framework *coverage*. HAIW
ships a gap register (`MR-HAIW-GAP`) because there the word is true. **Do not
"fix" the asymmetry**; it records which module has the relation authored.

If a future module wants per-capability numbers, author the links. Do not carry a
category score onto a capability row, and do not rename the column to make it
defensible — a reader takes the number as the row's own no matter what the
heading says. This is the D-001 rule, and it cost four client-facing deliverables
to learn.

## Framework crosswalk

`frameworks.json` and `crosswalk.json` project one assessment onto four published
frameworks (DMBOK2, DCAM, DGI, COBIT 2019). Five check classes guard them —
CROSSWALK-SHAPE, -WEIGHT, -ORPHAN, -DISTINCTNESS and FRAMEWORK-COVERAGE.

**The 11 pillars are the canonical capability model.** Frameworks map *into*
them. Never add a second canonical layer — a bank with two maturity numbers to
reconcile has been given a problem, not an answer.

**PROJECTION IS LEAF-ONLY.** A dimension with children carries no crosswalk
entries; its score rolls up from its children *inside the framework*, never
across the pillar side. COBIT's `APO14` and its ten sub-practices must never both
count a pillar — that double-counts the same evidence and inflates the component
it appears in. Same for the three DGI groups. CROSSWALK-ORPHAN fails a mapping
attached to a parent.

**`coverageWeight` is the share of the DIMENSION that the PILLAR accounts for**,
summing to 1.0 per leaf dimension over the full entry set. It is *not* "how much
of the pillar this dimension covers" — under that reading a dimension score is
not a weighted mean and the four scorecards cannot be reconciled.

**Retained share.** An entry is `core`, `banking` or `both`. A dimension carrying
a banking-only entry retains less than 1.0 under a core-only engagement (DCAM7
retains 0.75). C2 renormalises the visible subset **and must print the retained
share**, exactly as `scoring.ts` prints `confidence` for a pillar. Retained share
is reported, not asserted — except that retaining *zero* under a layer whose
framework is otherwise in scope fails, because that is an authoring gap wearing a
not-applicable costume.

**Dimension `weight` is DGIW's editorial judgement, not published content.** None
of the four frameworks publishes weights for its own dimensions. The names and
codes are published structure and carry a `structureConfidence`; the numbers are
ours. DCAM's component wording and COBIT's APO14 sub-practice titles are the
weakest links and are flagged in `structureNotes`.

**Scales differ**: DCAM 1-6, COBIT 0-5, DGIW 1-5. `scaleMin`/`scaleMax` exist so
C2 rescales explicitly rather than printing a 1-5 score under a 0-5 heading.

## Marketing copy drifts from the datasets

`SuiteLanding.tsx` hardcodes dataset counts that are wrong — it claims 56 CDEs
and 81 DQ rules where the files hold 76 and 115, 793 BACR questions where there
are 804, 727 TAIW elements where there are 1,107. Nothing checks this. If you
change a dataset, update the card, and prefer deriving the number from the data
over retyping it.

## Repo hygiene

- Default branch is `master`. **There is no `main`** — the sole CI workflow
  triggers on `main` and therefore has never run.
- `.claude/settings.json` is checked in but gitignored, and its paths point at a
  stale `/mnt/e/erwin` checkout. The canonical repo is `~/erwin` on ext4.
- `git` history is 23 coarse commits over five months. It will not explain any
  individual decision. `archive/build-prompts/` is the closer design record.
- Never `pkill -f vite` or `pkill -f node`. Those patterns kill every project
  on the machine. Kill by port: `lsof -ti:5174 | xargs -r kill`.
- `npm run lint` has a standing baseline of 55 problems (46 errors, 9
  warnings), all pre-existing. Lint is not part of `npm run build`. Report the
  count; do not fix them as a side quest.
- Five components reassign an accumulator inside `.map()` during render
  (CustomerProfitability, CustomerValue, CorporateValue, PortfolioRollup,
  FtpDecomposition — all profitability waterfalls). Known, deferred. Fix with
  `reduce` when touched, not as a sweep.
