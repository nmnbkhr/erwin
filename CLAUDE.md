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
2. **`scripts/check.mjs` is the suite's quality gate.** Extend it, never bypass
   it. `npm run check` runs it; `npm run build` runs it before `tsc -b`.
   `npm run check:dgiw` is the *same full run* under the old name, and
   `scripts/check-dgiw.mjs` is a three-line shim. The name was wrong for two
   phases — four of its classes read every module's report code — and survives
   only because six source files and three docs cite the path.
3. **The gate is a registry, not a file.** `scripts/check/modules/index.mjs` is
   an ordered array; each entry is a rule file declaring that module's `dataDir`,
   `datasets`, `reportSources`, `artefactIds` and `checks`. **Adding a module is
   one import and one array slot** — its report sources join REPORT-SOURCES, its
   artefact ids join ARTEFACT-IMPL *and widen the accepted `MR-` prefix, which is
   derived from the registry rather than written down*, its summary lines join
   the report. Nothing else has to be told.

   The array order is the printed order of findings and summary lines. Declared,
   never sorted or globbed.

   A module that declares nothing is legal — COE and ALM do, and the REGISTRY
   line still names them with `0`, so "not covered by the gate" is a stated fact
   rather than an absence you would have to notice. A module that declares a
   `dataDir`, a dataset or a `reportSources` entry that does **not resolve**
   fails. An empty registry fails, rather than printing `0 entries, 0 checks` and
   exiting green.
4. **A check that examined nothing fails.** Every check returns `{ examined }`;
   examining zero while reporting nothing is a **VACUOUS** failure. A green build
   over an empty set prints identically to a green build over a real one, and
   this repo has shipped that shape thirteen times. A check that legitimately
   runs over nothing declares `mayBeEmpty: '<reason>'` — the reason is mandatory,
   because if a check can run over nothing then someone should have to write down
   why. Nothing declares it today.
5. **`npm run check:selftest` demonstrates every finding code.** 54 mutations,
   48 codes, ~20 s. It copies `src/` and `scripts/` to a scratch root under
   `node_modules`, applies one mutation per code, asserts the code is reported
   *and* the tool exits non-zero, then restores and re-runs the control. **No
   tracked file is ever written.** Run it after touching the gate: a refactor
   that leaves a check passing because it stopped running is the failure mode it
   exists for, and inspection has missed that twelve times.
6. **`npm run build` and `./dev.sh build` are not equivalent.** Only the npm
   script runs the gate. Always verify with `npm run build`.
7. **There is no test framework.** No vitest, jest or playwright. The gate,
   `check:selftest` and `scripts/golden/` are harnesses, not tests, and none of
   them asserts application behaviour. If a task needs tests, propose the
   framework and wait for approval — do not install one unasked.
8. **`tsc -b` must pass.** `strict: true`. `noUnusedLocals` and
   `noUnusedParameters` are deliberately off — do not turn them on.
9. **Additive only.** Do not delete or rewrite an existing file. Extend it.
10. **Do not add a seventh copy of the layout shell.** See below.

### Three finding codes did not exist before D3

| Code | Before D3 |
|---|---|
| **FRAMEWORK-COVERAGE** | **no `fail()` anywhere in it** — five lines of arithmetic feeding a printed table, described *in this file* as one of five classes guarding the crosswalk, for an entire phase |
| **REGISTRY** | there was no registry; a gate whose declared inputs went missing had no way to say so |
| **VACUOUS** | nothing measured whether a check ran over anything at all |

**CROSSWALK-ORPHAN** also gained a failure it always implied: a pillar mapped by
no crosswalk entry in any framework. That list was computed, printed and nothing
more. Such a pillar is scorable on the diagnostic and contributes to none of the
four scorecards — the same defect as a leaf dimension with no mapping, read from
the pillar side.

And one silent defect was fixed rather than carried across: an esbuild failure
loading `projection.ts` disabled **two** classes while only PROJECTION-INVARIANT
said so, because CROSSWALK-DISTINCTNESS went quiet behind a `projection ? … : []`.
Both now report under their own names.

The lesson generalises past these four. **A class that cannot fail is
decoration**, and this document had been calling one a guard for a phase. That is
what `npm run check:selftest` is for: it does not check that the gate is right,
it checks that every code can still be reached.

## The declared report source set

Three classes — CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL — read source code
rather than data, and they read exactly what the registry declares. Five
locations from five rule files, resolving to 18 `.ts` files:

| Location | Declared by |
|---|---|
| `src/report` | `check/modules/_spine.mjs` |
| `src/utils/reportGenerator.ts` | `check/modules/baiw.mjs` |
| `src/taiw/utils/tradeReportGenerator.ts` | `check/modules/taiw.mjs` |
| `src/haiw/utils/healthReportGenerator.ts` | `check/modules/haiw.mjs` |
| `src/dgiw/report` | `check/modules/dgiw.mjs` |

**Declared, never globbed.** A glob over `src/` would sweep in every file that
happens to mention `header:` and turn CSV-HEADER into a repo-wide style rule it
was never designed to be. And a glob cannot tell "no generator here" from "the
directory moved": a declared location that resolves to nothing is a **finding**,
not a silent shrink of the set. `kind` is asserted too — a location that flips
between file and directory is a restructure the rule file has to be told about.

The REPORT-SOURCES line prints the file count on every build because those three
classes can only ever be as wide as it. **Watch that number.**

The spine is in the set because when it was added in D2, TEXT-MAXWIDTH found
three live instances inside `spine.ts` against zero in DGIW's generators. A gate
over the callers that skipped the shared code they all call would have reported
green while the worst instances sat in the one file every report goes through.

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
  call `moveTo()` afterwards. **No hand-rolled CSV remains either**: all three
  module CSVs are on `src/report/csv.ts` as of 2026-08-01 — BAIW's and TAIW's
  when D-001 was closed, HAIW's straight after. Every deliverable in the suite
  now goes through `spine.ts` or `csv.ts`.
- **Two generations of workbench components** — `components/workbench/` is the
  shared data-driven one; `components/profitability/` is BAIW's unmigrated
  predecessor. Build against `components/workbench/`.
- **Two data-loader idioms** — `import.meta.glob` in BAIW,
  `/* @vite-ignore */` template-string imports in TAIW/HAIW. Prefer the BAIW
  form for new code.
- Dead weight: `src/data/taiw_backup_20260314/` (1.2 MB, imported by nothing) and
  six empty directories under `src/components/`. Leave them; don't add more.

## DGIW is the pattern to copy

It is the newest and most rigorously built module: fifteen dataset checks in
`scripts/check/modules/dgiw.mjs`, a documented layer model (`core` vs `banking`,
tagged on every record — `src/dgiw/layer.ts`), a role registry resolving
free-text owner strings to archetypes (`src/dgiw/roles.ts`), and source that
carries *why*-comments explaining the defect that motivated the code. Match that
standard. BAIW is the pattern that accreted — do not use it as a model.

D4 filled two of the empty rule files. The gate now runs **35 checks across 7
registry entries** — suite 4, TAIW 9, HAIW 7, DGIW 15 — and the REGISTRY line
prints exactly that breakdown on every build:

```
REGISTRY 7 entries, 35 checks (suite 4, _spine 0, baiw 0, taiw 9, haiw 7, coe 0, alm 0, dgiw 15)
```

**Read that line rather than this paragraph.** It said 40 for the whole of D4 —
a number matching neither the three modules' 31 nor the 35 with the suite class
included. A hand-typed count in prose beside a computed one on stdout is the
prose losing, every time.

D-010 then gave BAIW its first: **`BENCHMARK-ROLLUP`**, in all three of
`baiw.mjs`, `taiw.mjs` and `haiw.mjs`. A rollup printed beside its own components
must equal them. Two of BAIW's three did not, one of them was read by page 16, and
a bank was told it was 0.4 levels behind its peers when its own numbers said 0.5.

The rule's whole value is *where it gets its category list*: from the module's
**question dataset**, never from "every other numeric key in the block". The
benchmark files carry an `Overall Assessment` key and both golden fixtures carried
an `Overall Assessment` *category* that no dataset contains — a rule reading the
block's own keys would have folded the rollup into its own mean and accepted the
phantom. It ships with two companions: every real category must have an entry in
every block (which is what makes `reportGenerator.ts`'s five hardcoded `1.86`
fallbacks provably dead rather than assumed dead), and HAIW's `DEFAULT_BENCHMARKS`
must keep **no** rollup key at all, because `healthReportGenerator.ts` averages
every value in a block and would fold one in.

Exception maps in both rule files, on the `SLUG_EXCEPTIONS` precedent, and both
ship **empty** — the honest state, since neither wrong value was ever sourced. A
stale exception fails, and so does one naming a block the file does not carry.

**COE and ALM still declare `checks: []`** — legal, and printed on the same line
so it stays a stated fact rather than an absence you would have to notice. BAIW's
capability relations are the next candidate; `docs/known-defects.md` names them.

Note what D4's rules are NOT. `TCF-COVERAGE` reports that `dataReqCount` matches
the observed requirement count for **2 of 100** capabilities and asserts nothing
about it, because the two fields were never counting the same thing. D-007 was
filed claiming they should match, and the "safe default" fix offered at the time
would have zeroed 97 capabilities and broken two live roadmap views. **Writing a
dataset check is easy; establishing that two fields mean the same thing before
comparing them is the work.**

`TCF-SLUG` carries exactly one declared exception —
`aeo_compliance_monitoring_aeo`, D-009 — named in `SLUG_EXCEPTIONS` with its
defect id, on the `mayBeEmpty` precedent: a rule with an exception should require
someone to write down which and why, in source. A stale exception, one that no
longer violates the rule, **fails** — otherwise a fixed defect leaves a permanent
hole in the check.

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
must pass a content key. **ARTEFACT-IMPL** enforces that much: every
`createReport` call **anywhere in the declared report source set** — five
locations, 18 files, not just `src/dgiw/report/` — must pass a second argument,
and it may not be a string literal, `undefined`, or an expression with an empty
literal in any branch. A `createReport` reached through anything but a named
import fails too: an unresolvable call is unverifiable, not acceptable.

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
instances were sitting in `spine.ts` itself. **TEXT-MAXWIDTH** rejects the key
outright across the whole declared report source set.
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
drawn *paths* rather than glyph runs. It is not wired into `compare.mjs` or into
`npm run build` — run it deliberately after any change to hand-placed boxes,
grids or charts. Hand-placed geometry must be derived from `r.contentWidth`,
never from a literal that happens to fit today.

It **reports** by default and that is deliberate: a full-bleed band is legitimate
cover chrome and only a human can say whether a given shape is meant to respect
the text margin. `--fail-on-overflow` makes it exit 1 instead, with full-bleed
bands still excluded. The flag exists so the tool can be *demonstrated* failing —
a reporter that always exits 0 is indistinguishable, from outside, from a
reporter that stopped running, which is precisely how two of D-006's three
instances stayed invisible for the whole of D2. `check:selftest`'s
GEOMETRY-OVERFLOW row widens one real drawn box in a copy of a captured PDF and
asserts both halves: that the overflow is counted, *and* that the full-bleed
bands are still ignored. That row needs `raw/` populated — run
`node scripts/golden/capture.mjs` first; it will tell you so rather than skip.

**`capture.mjs` will not overwrite a baseline without `--accept`.** The baseline
is the reviewable record of what the generators produce; overwriting it before
reading the difference is how a change stops being reviewable, and the old header
enforced that with nothing but the reader's attention. If a recapture would
change, add or orphan any baseline it prints exactly what would move, writes
nothing, and exits 1. `raw/` is refreshed either way, so the new output is on
disk to look at. The walk is still yours — `compare.mjs`, then `walk.mjs` on
whatever moved — but freezing an unwalked diff now takes a deliberate flag.

**`compare.mjs` classifies NEW and ORPHANED rather than throwing.** A missing
baseline used to abort the run at the first unseen artefact, hiding every later
diff until you captured — which pushed the operator toward `--accept` just to see
the report, routing around the safeguard above. Both are findings now; the run
completes and still exits non-zero, because an artefact nobody has a baseline for
has been verified exactly as much as one nobody ran.

### The fixture freeze has two directions

BAIW, TAIW and HAIW freeze a copy of every dataset they read into the fixture.
DGIW does not — it reads live data and records a `datasetFingerprint` per
baseline. That difference is deliberate and the reasons are in `harness.mjs`, but
until D-010 only one half of the trade was written down:

| | |
|---|---|
| a dataset edit misattributed to the generator | the freeze **prevents** this |
| a dataset edit invisible, the baseline describing output production no longer makes | the freeze **causes** this |

The second is not hypothetical. D-010 corrected
`benchmarks.json::regionalLeaders["Overall Assessment"]` from 3.18 to 3.3; page
16 of every BAIW report moved from "0.4 levels behind regional leaders" to 0.5;
and `compare.mjs` printed **`exit 0 — no actionable differences`**, because it
regenerated the page from the fixture's frozen 3.18. A client-facing sentence
changed and the golden record could not see it. The fabricated ninth category was
the same direction from inside the fixture rather than outside it.

**Every module now records a `datasets` fingerprint**, and the freeze stays. DGIW's
is over its live directory, unchanged. The other three fingerprint the **live**
files their fixture froze — declared by the `data` block's own keys, plus a
`dataSources` array for content frozen outside it (HAIW's `capabilities` and
`questions`). When the live file drifts from the frozen copy, `compare.mjs` says
so under `source datasets` while raw bytes read `stable`, which is exactly the
D-010 shape made visible. **A fixture that declares neither is a hard error**, not
a `null`: `datasets: null` was the whole blind spot, because `diffCommon`'s check
is guarded on the field being truthy.

Read the finding per module. For DGIW it *explains* the content changes below it.
For the other three it means the opposite — the frozen copy is stale and wants
refreshing, then a walk.

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

## Category scoring — TAIW and HAIW

**`src/scoring/maturity.ts` is the one implementation.** Both modules' assessment
screens and both report generators call it. It returns the same three states as
DGIW — `scored` / `not-assessed` / `not-applicable` — as a **discriminated
union**, so `current`, `desired` and `gap` are unreachable until
`state === 'scored'`. The `current: number` shape carrying `0` for "unmeasured"
is what produced D-003; a reviewer catching that is luck, the compiler refusing
it is not.

**This file previously said every HAIW score went through `aggregate()`. That was
false**, and the paragraph below it half-admitted so while framing it as
agreement. There were **four** implementations of the category mean and **three**
rules for rolling them up:

| | overall |
|---|---|
| `TradeMaturityAssessment.tsx` | ÷ ALL categories |
| `QuickAssessment.tsx` (shared with BAIW) | ÷ scored |
| `HealthMaturityAssessment.tsx` | ÷ scored |
| `healthReportGenerator.ts` | ÷ ALL categories |

Four of eight categories answered at 3.0 therefore printed **1.5 and 3.0 for the
same client on the same day** — TAIW's own quick and deep screens disagreeing
with each other, and HAIW's screen disagreeing with its PDF. `tradeReportGenerator.ts`
even carried a comment asserting the component averaged only the answered
categories; it did not.

**÷ SCORED is the rule.** An unmeasured thing leaves the numerator AND the
denominator. And the overall is built from the **unrounded** category means:
averaging the 1dp values shown in the table is the recomposition
`dgiw/scoring.ts` warns about.

**Print the denominator.** Every deliverable states `Scored N of M categories`,
because 3.0 from four of eight is not the same claim as 3.0 from eight and the
number alone cannot tell them apart. Fixing the arithmetic without printing the
coverage would leave a reader unable to distinguish a complete assessment from a
half-finished one — the D-003 lesson, one level up.

**`QuickAssessment.tsx` was already correct and stays as it is.** It is shared
with BAIW, it already divided by the scored count, and it is the one of the four
that needed nothing. Do not "unify" it onto `maturity.ts` as a tidying pass:
it scores a different unit — a short quick-scan question set, not the deep TACR
or HACR category tree — and moving it would change BAIW's screen in a change
whose whole value is that BAIW did not move.

**The fixtures could not see any of this.** Every golden fixture answered every
question, and at 8-of-8 all four rules coincide. `taiw.json::assessmentPartial`
and `haiw.json::answersPartial` are the first artefacts in the repo that exercise
an unanswered category — four of eight, with the fourth answered only halfway so
the within-category path is covered too. A change to category scoring that leaves
those two baselines unmoved has not been tested.

**And two of them carried a category that no dataset contains.** `baiw.json` and
`taiw.json` each seeded a ninth row, `"Overall Assessment"` at a perfect
5.0 / 5.0 / 0.0, against eight real BACR and eight real TACR categories. It was
averaged in as though measured — 27/9 = 3.0 on both covers where the eight
measured categories say 22/8 = 2.8 — so it inflated the headline and understated
every distance derived from it. Both are removed, each with its own walk.
**A fabricated row is invisible while every rule agrees**: at 9-of-9 the ÷scored
and ÷all rules coincide exactly as they do at 8-of-8, and it took printing the
denominator to make anyone count. Nothing in the gate checks a fixture against
its module's question dataset; that is the check this would have needed.

**HAIW's category buckets are built from the QUESTION UNIVERSE, not the answer
set.** `computeCategoryOutcomes` used to bucket `answers`, so a category nobody
had answered produced an empty list and `aggregate()` called it `not-applicable`
— the two states that "must never collapse into each other", collapsed inside the
function written to keep them apart. `HACR-CATEGORY-MAP` asserts the invariant
that makes the screen's partition and the report's the same partition.

Unscored items are excluded from a ranking, never sorted to the end of it.

Page 13 of the PDF and `generateHealthGapCSV` both call `scoreCapabilities()`.
Before D-003 they each computed their own numbers and **disagreed about the same
capability on the same day**. One function, or the two deliverables drift again.

**TACR carries none of the three fields HACR carries, and that is a data fact,
not an oversight to be corrected in code:**

| | `weight` | layer (`core`/`banking`) | `capabilityLinks` |
|---|---|---|---|
| HACR (720 questions) | 0.8–1.2 | — | on 720 of 720 |
| TACR (640 questions) | absent | absent | absent |

So **TAIW has no capability-level score and cannot have one** until the relation
is authored. This is the same statement as the D-001 table below, read from the
data side rather than the deliverable side: HAIW ships a gap register because
`capabilityLinks` exists, TAIW ships a capability register because it does not.
The layer row is the reason CLAUDE.md's "the core/banking layer is DGIW-only" is
true — it was confirmed against `tacrQuestions.json` in D4, not assumed.

**EVERYTHING IN THE SUITE IS UNWEIGHTED, AND THAT IS NOW A CHECKED FACT.**
`aggregate()` takes a weight per entry and every caller passes 1.

This paragraph used to say "categories are an unweighted mean; capabilities are
weight-weighted", and defended the asymmetry as HAIW's editorial judgement. The
asymmetry was real. **The judgement was not.** HACR's `weight` was

```
weight === W[(i + 1) % 5]   for all 720 questions in file order,
W = [0.8, 0.9, 1.0, 1.1, 1.2]
```

a repeating five-cycle over the file — a counter. `HAIW-WEIGHT` asserted
`weight > 0`, which is true of a counter, so nothing said anything for two
phases while every capability score was weighted by a sequence position. It was
not theoretical: flattening it moved **46 of 108 printed capability scores and
five priority bands** on the golden fixture, and **all 108 scores and nine
bands** on the partial one, with two capabilities entering page 13's top-20
ranking and two leaving. Page 13's caption said "Weight-weighted mean" and now
says "Unweighted mean", because the first was true of the code and false of the
data. D5 stage A; `docs/known-defects.md` D-015.

`HAIW-WEIGHT` now asserts **`=== 1`** — strictly stronger than `> 0`, so
`aggregate()`'s NaN fallback stays provably dead by a wider margin, and the
field cannot drift back without someone editing the rule file. TACR carries no
`weight` field at all, so the two modules now agree.

**The parameter stays and so does the rule about using it.** Weighting a module
genuinely moves every category's gap 1.3 → 1.4 and desired 4.3 → 4.4, which
moves the cover score, the radar, eight deep-dive pages and the markdown. The
screen moves with it, since D4 put both on the same function — that is the point
of one implementation — but **a PDF that disagrees with the screen is worse than
no PDF**, and the way to keep them agreeing is one primitive, not two careful
copies. It is a content decision deserving its own change and its own
before/after, not a refactor done in passing, and `HAIW-WEIGHT` now makes
starting it impossible to do quietly.

**The general lesson is about the assertion, not the weights.** `> 0` was a true
statement about a field whose values were meaningless. A check that constrains a
value's *range* says nothing about whether the value was *decided*. When a
number reaches a client, the check should pin what it is, not what it is not.

`hacrQuestions.json` is 1.18 MB and already loaded by the assessment page, so the
report takes questions as a **parameter** typed
`Pick<HacrQuestion, 'id' | 'weight' | 'capabilityLinks'>` rather than importing
the dataset. Keep it that way: it is an honest contract about what is read, and
it keeps a second copy out of the report chunk.

**`src/haiw/hacr.ts` is HACR's single declaration** — the eight categories, the
answers storage key, `HACR_QUESTIONS_PER_CATEGORY`, and `hacrCategoryOf()`. It is
what `src/data/bacrCategories.ts` is for BACR, and it exists for the same reason:
three surfaces need those facts and only one of them can afford to import a report
generator. `CATEGORY-UNIVERSE` names it as the declared location.

**A consumer that has the answers but not the questions can still attribute
them**, because the id carries the category: `HACR-SL-001` → `SL`.
`HACR-CATEGORY-MAP` asserts for all 720 that the id code and the `category` field
select the same category, which is what makes the dashboard's partition, the
screen's and the report's the same partition. It also asserts the **90 per
category** that a question-less consumer pads with to tell `not-assessed` from
`not-applicable` — the build prints `HACR 720 questions across 8 categories, 90
each`. Two branches, two selftest rows.

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

**D4 found a fifth instance, armed and waiting.** `TCFCapabilityNavigator.tsx`
put a "TACR" badge on every capability row, scored by keyword-matching the
capability's theme name onto a TACR category (`lower.includes('data') → 'data'`).
It never rendered — two independent bugs held it inert: it read the bare
`taiw_maturity` key, which nothing has written since answers were namespaced per
engagement, and it split ids on `-` where TACR ids contain none. **Fixing either
one alone would have started the fabrication**, in a component nobody would be
reviewing for D-001 at the time. Removed, not repaired: dead code that fabricates
on repair is the D-008 shape and is worse than code that is merely wrong.

Deriving the projection more carefully is not the fix. `TACR-CATEGORY-PREFIX`
gives the real question-prefix → category relation, and it still says nothing
about themes: TCF has 6, TACR has 8, and **no dataset joins them**. The badge
comes back when TACR questions carry `capabilityLinks`, and not before.

**When an input is unavailable, produce nothing and say so.** Never a
placeholder, never a neighbouring number, never a variation on one. D-001, D-003
and D-008 are the same defect three times — a plausible number substituted where
a real one was missing — and the third was the worst of them precisely because it
was **dead code that fabricated**: 132 rows built from category scores, reached
only when `capabilities.json` failed to load, so never exercised, never
baselined, and triggered exactly when the client could least tell.

**Variation is the tell.** `Math.random`, fixed −0.3/−0.5 offsets, `charCodeAt`,
`(ci % 5 - 2) * 0.15` — every instance added spread for no reason except to stop
one number reading as one number. Spread with no source is a disguise, not data.

**A "(placeholder)" caption is not a fix, and the caption is worth reading too.**
HAIW's dashboard radar drew `Math.floor(Math.random() * 2) + 2` under the subtitle
"Sample HACR category scores (placeholder)" — the most honest label any of these
five instances carried, and it changed nothing. The card was the same size, in the
same palette, with the same axis furniture as the three real charts beside it, and
a radar polygon reads as a measurement whatever the small print says. **The label
was also false**: not one of its eight axis names was an HACR category — exact
overlap with `hacrQuestions.json` was zero, four of the eight named nothing in the
module at all. `CATEGORY-UNIVERSE` could not see it, because its duplicate scan
looks for a set that *equals* a module's categories and a near-miss list is not a
copy. D-013 is fixed by wiring, not captioning: real answers, three states, the
coverage denominator on the card.

**The dashboards are the surface nothing verified.** `scripts/golden/` renders
PDFs; `scripts/check/` reads datasets and source text. Neither instantiates a
React component, so both maturity radars carried a fabrication for two phases and
every harness in the repo reported green. `npm run drive:dashboards`
(`scripts/dashboard-drive.mjs`) exists for that gap: it seeds answers, calls the
real exported scoring function and prints what each axis would draw. It asserts
nothing — a human reads the table, the same contract `geometry.mjs` ships under.
**Seed ONE category of eight.** At 8-of-8 the broken and the fixed code agree
exactly, which is why every golden fixture missed this class twice.

**A tool that destroys the record it exists to preserve, on the invocation most
likely to be an accident.** Three instances in this repo, one shape:

| Tool | The record | What it did |
|---|---|---|
| `clickthrough.mjs` | its own output dir | `rmSync` before it could run |
| `capture.mjs` | the golden baseline | overwrote it before anyone read the diff |
| `compare.mjs` | the rest of the diff | threw on the first NEW artefact |

Each destroyed exactly the thing a reviewer needed, and each did it on the most
ordinary act available — running the tool, re-capturing, adding a fixture.
`compare.mjs` was the instructive one: failing hardest on a normal act pushed
the operator toward `capture --accept` just to see the report, which is the
unwalked freeze `capture.mjs` had just been hardened against. **A tool that is
hostile to the normal case teaches people to route around its safeguards.**
All three now refuse, classify or continue instead. When adding a tool here, ask
what it deletes and whether the deletion happens before or after the human has
had a chance to look.

**A check that declares one code and emits another is invisible from the exit
code.** `TACR-UNIQUE` and `HACR-UNIQUE` both ran, both found their duplicate,
both failed the build — and both reported under `UNIQUE`, because the shared
`unique()` helper hardcoded it. From outside, a failing build looks the same
either way; the finding names a code no rule file mentions and nothing notices.
Inspection would not have caught it and did not. **Only a matrix asserting WHICH
code trips catches this**, which is the second thing `npm run check:selftest`
buys beyond "the check still runs": every `fail()` code must be reachable *from
the check that declares it*. Pass the code as a parameter to any shared
assertion helper — `unique`, `sorted`, `shapeCheck` — never hardcode one inside.

Concretely, for any generator: an empty result is a legitimate output.
`downloadCsv` returns `false` and writes no file on an empty set; propagate that
boolean and let the caller tell the user. A report page with nothing to show says
**why** it is empty, and distinguishes "the data failed to load" from "nothing has
been answered yet" — they produce the same zero rows and mean opposite things.
A silent no-op reads as a broken button and sends the user to retry rather than
to report the real fault.

## Framework crosswalk

`frameworks.json` and `crosswalk.json` project one assessment onto four published
frameworks (DMBOK2, DCAM, DGI, COBIT 2019). Five check classes guard them —
CROSSWALK-SHAPE, -WEIGHT, -ORPHAN, -DISTINCTNESS and FRAMEWORK-COVERAGE — though
FRAMEWORK-COVERAGE only became one of them in D3; before that it could not fail,
and this sentence claimed otherwise for a phase. See "Three finding codes did not
exist before D3" above. It now fails when a framework covers pillars at `'all'`
but zero under a layer: every mapping it has is tagged for the other layer, so an
engagement at that layer renders its scorecard blank with no stated reason. That
is the same authoring-gap-in-a-not-applicable-costume rule CROSSWALK-WEIGHT
applies per leaf dimension, read one level up.

**The 11 pillars are the canonical capability model.** Frameworks map *into*
them. Never add a second canonical layer — a bank with two maturity numbers to
reconcile has been given a problem, not an answer.

**CHECK A FRAMEWORK'S OWN AGGREGATION OPERATOR BEFORE AUTHORING A CROSSWALK.**
`projection.ts` computes a **convex combination** — a weighted mean of spine
scores. A framework whose own instrument is a weighted mean projects onto that
engine faithfully. One that is **gated, ordinal or cumulative does not, and no
amount of careful mapping fixes it**, because the disagreement is in the
operator rather than in the mapping.

HIMSS **EMRAM** is the worked example. It is cumulative stage gating, 0–7: an
organisation is at the highest stage for which *every* criterion of that stage
and all stages below it is satisfied. That is a `min` over gates. Run it through
a weighted mean and it yields **"stage 4.3" — a value EMRAM does not define**,
and a hospital reading it has been given a number its own accreditor will not
recognise. Same for **INFRAM**. The honest presentation is a different
instrument: a criteria checklist returning the highest fully-satisfied stage and
naming the first unmet criterion.

This is the D-001 rule at the level of the operator rather than the join. There
the question was whether the *relation* exists; here it is whether the
*arithmetic* means the same thing. Both fail the same way — a plausible number
under a heading that makes it look defensible.

Two more shapes that fail this test and are not crosswalk candidates:

- **A framework already authored inside the assessment.** TACR's
  `Strategy & Vision / WTO TFA Commitment` is 18 questions, one per TFA Article.
  The framework's vocabulary *is* the assessment, so a projection would restate
  the section against itself. It wants a direct report over that section.
- **A framework with no evidence behind it.** WCO SAFE and the Revised Kyoto
  Convention have exactly **one** TACR question each. You cannot score a
  framework from one question, however good the crosswalk is.

**PROJECTION IS LEAF-ONLY.** A dimension with children carries no crosswalk
entries; its score rolls up from its children *inside the framework*, never
across the pillar side. COBIT's `APO14` and its ten sub-practices must never both
count a pillar — that double-counts the same evidence and inflates the component
it appears in. Same for the three DGI groups. CROSSWALK-ORPHAN fails a mapping
attached to a parent, a leaf dimension with no mapping, and — since D3 — a pillar
no framework maps at all.

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
- `npm run lint` has a standing baseline of **53** problems (44 errors, 9
  warnings), all pre-existing. Lint is not part of `npm run build`. Report the
  count; do not fix them as a side quest. It was 55 until D-012: the two errors
  that cleared were **dead code servicing defects that were removed** — a
  `.filter()` whose body was `return true` and an unused `relevantCategories`
  built for the fabricated per-theme score. Neither was fixed as lint; both went
  with the defect. A baseline moving *down* is still a baseline moving, and
  saying which two and why is the difference between an improvement and drift.
- Five components reassign an accumulator inside `.map()` during render
  (CustomerProfitability, CustomerValue, CorporateValue, PortfolioRollup,
  FtpDecomposition — all profitability waterfalls). Known, deferred. Fix with
  `reduce` when touched, not as a sweep.
