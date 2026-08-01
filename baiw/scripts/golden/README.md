# Golden-output harness — every report the suite can produce

Capture-and-compare over **23 artefacts** from four modules. D2 is complete: all
three module generators are now on `src/report/spine.ts`, alongside DGIW's seven.

| Module | Generator file | PDF | CSV | Markdown |
|---|---|---|---|---|
| BAIW | `src/utils/reportGenerator.ts` | `generateMaturityPDF` ✅ spine | `generateGapCSV` ⛔ pre-spine | `generateRoadmapMarkdown` ✅ spine |
| TAIW | `src/taiw/utils/tradeReportGenerator.ts` | `generateTradeMaturityPDF` ✅ | `generateTradeGapCSV` ⛔ | `generateTradeRoadmapMarkdown` ✅ |
| HAIW | `src/haiw/utils/healthReportGenerator.ts` | `generateHealthMaturityPDF` ✅ | `generateHealthGapCSV` ⛔ | `generateHealthRoadmapMarkdown` ✅ |
| DGIW | seven files under `src/dgiw/report/` | 12 PDFs ✅ | 2 CSVs ✅ | — |

The three gap CSVs are the only pre-spine code left. They are blocked on **D-001**
and move together when it is decided.

It exists for one job: **there are zero tests in this repo, and `check-dgiw.mjs`
is a static dataset gate that knows nothing about rendered output.** This is the
only thing that can tell you a report changed.

## The three tools

| Script | Question it answers |
|---|---|
| `compare.mjs` | *Did anything change?* Classified findings, exit 1 on any. |
| `walk.mjs` | *Does every glyph that moved have a named reason?* Per-page reconciliation. |
| `clickthrough.mjs` | *Does the button in the browser actually produce that file?* Real Chrome. |

`capture.mjs` writes the baselines the first two read.

## Read this before you use it

**Whether a clean diff is good depends on what you changed.**

For a **generator migration**, a clean diff means the migration did nothing. D2
was supposed to change output — real wrapping through `spine.ts::text()`, real
page counts replacing the hardcoded `totalPages = 18`, and new filenames from
`reportFilename()`. If `compare.mjs` had printed "no actionable differences"
mid-migration, the first hypothesis would have been that the migration did not
run, not that it was perfectly behaviour-preserving.

D2 is now complete and the baselines are re-captured, so a clean diff **is** the
expected result from here on.

For a **shared-infrastructure change** — a `src/report/spine.ts` edit intended to
be behaviour-preserving — a clean diff is the entire goal. That is what the DGIW
baselines exist for.

The deliverable is **a reviewable diff**, not a pass/fail verdict. Every finding
is classified so you can tell a fix from a regression:

| Class | Meaning |
|---|---|
| `FAIL` | the harness's own control broke — trust the harness less, not the generator |
| `CHANGED` | a real difference. Read it and decide. |
| `EXPECTED` | a difference D2 is known to cause (filenames). Not red. |
| `SKIPPED` | a field declared unassertable. Never silently ignored. |
| `INFO` | clock-derived values that move on their own. |

Exit code is 1 when anything is `FAIL` or `CHANGED`, 0 otherwise. **This is not
wired into `npm run build`** and must not be. It is run deliberately, before and
after D2.

## Usage

```sh
node scripts/golden/capture.mjs                  # all four modules
node scripts/golden/capture.mjs --module taiw    # one module
node scripts/golden/compare.mjs
node scripts/golden/compare.mjs --module haiw
node scripts/golden/walk.mjs --module baiw       # page-by-page reconciliation
node scripts/golden/clickthrough.mjs             # needs `npm run dev` on 5174
```

All work from `baiw/` or from the repo root (`node baiw/scripts/golden/…`) —
paths resolve from the script, not the working directory.

Workflow:

1. **Before you change anything** — `compare.mjs`, confirm exit 0. A dirty
   starting point makes every later finding ambiguous.
2. **After the change** — `compare.mjs`, then `walk.mjs --module <mod>` on
   anything that moved. Decide, finding by finding, whether each change is
   intended. For a call-site or engagement change, `clickthrough.mjs`.
3. **Accept** — `capture.mjs`, and commit the baseline churn *in its own commit*
   so the review is a readable diff rather than noise inside the change.

D2 followed exactly this, once per module, with a written walk each time.

## Layout

```
scripts/golden/
  harness.mjs           shared core: driver, analysis, normalisation
  capture.mjs           writes baselines
  compare.mjs           recaptures and diffs
  walk.mjs              per-page reconciliation of one module's diff
  clickthrough.mjs      drives real Chrome through the three report components
  cdp.mjs               ~80-line DevTools Protocol client, no npm dependency
  file-saver-sink.mjs   stands in for file-saver under SSR
  dom-sink.mjs          the minimum DOM downloadCSV() needs
  fixtures/*.json       the frozen inputs — committed
  baseline/<mod>/*.json the golden records — committed, diffable
  raw/                  actual PDF/CSV/MD output — gitignored, for eyeballing
```

`harness.mjs` exists so capture and compare cannot drift apart. A compare that
analysed differently from the capture it is diffing would be worse than no
harness — and this repo's documented failure mode is copy-paste.

## How it drives the generators

Vite's programmatic SSR (`createServer` + `ssrLoadModule`), not CDP and not a
browser. No new npm dependency: Vite is already here.

- `file-saver` is aliased to `file-saver-sink.mjs`, which keeps the Blob.
- `jsPDF.API.save` is patched to hand back `output('arraybuffer')`.
  `saveReport()` in `src/report/spine.ts` also ends at `doc.save()`, so the same
  hook captures **post-D2** output. That is the one thing that lets these
  baselines outlive the migration they exist to review.
- `resolve.conditions` is forced to `browser`. The app ships
  `jspdf.es.min.js`; the `node` condition resolves `jspdf.node.min.js`, a
  different bundle no user ever renders — and CJS, which Vite's SSR inliner
  cannot evaluate at all.

## Fixtures are frozen, including datasets

`fixtures/{baiw,taiw,haiw}.json` hold complete assessments with every question
answered and deterministic seeded values.

They also embed **everything the generators read from `src/data/` at generate
time**, so a dataset edit cannot read as a generator regression:

| Fixture | Frozen data |
|---|---|
| `baiw.json` | `src/data/benchmarks.json` (module-level import) |
| `taiw.json` | `src/data/taiw/benchmarks.json` (module-level import) |
| `haiw.json` | all 108 records of `src/data/haiw/capabilities.json` (passed as an argument), plus all 720 answers keyed to `hacrQuestions.json` |

The two `benchmarks.json` are `import`ed, not passed in, so `harness.mjs`
installs a small Vite plugin that redirects those specifiers to the fixture's
frozen copy. **The plugin asserts it fired.** If a D2 refactor moves an import
and the plugin stops matching, capture throws rather than quietly going back to
reading live `src/data/` — that is precisely the vacuous pass this project has
been bitten by four times.

Seeding rules, so the fixtures can be re-derived:

- **BAIW / TAIW** — for category *i*: `current = 1 + (i % 9) × 0.5` (sweeps
  1.0 → 5.0, exercising every `levelLabel` and every `colorForScore` band);
  `desired = min(5, current + [0.5, 1.2, 1.8, 2.5][i % 4])` (exercises every
  `priorityLabel` class). `overallScore` is the mean of `current`, 1 d.p.
- **HAIW** — all 720 HACR questions answered in dataset order, for question *k*:
  `currentState = 1 + (k % 5)`, `desiredState = min(5, currentState + 1 + (k % 3))`.
  `benchmarks` is `null`, so the generator uses its own `DEFAULT_BENCHMARKS` —
  exactly what `HealthReportGenerator.tsx` passes.

`engagementId`, `generatedAt` and `layer` are now set in all three fixtures. They
were `null`/absent before D2, because none of the pre-spine generators accepted
one — they called `new Date()` directly and the harness could only normalise the
result to a `⟨DATE⟩` token. The six migrated artefacts take a `ReportMeta`, so a
fixed `generatedAt` is what makes them byte-reproducible. **The three gap CSVs
read none of the three fields**, which is checked rather than assumed: their
baselines did not move when the fields were added.

## The environment is pinned, not documented

`TZ=UTC` and the ICU locale `en-US`, set by `pinEnvironment()` at the top of both
scripts and recorded in every baseline under `capturedWith`.

This is not belt-and-braces. Measured on these generators: `TZ=Pacific/Kiritimati`
rolls the PDF cover date to the next day (changing the extracted-text hash) and
`LC_ALL=de_DE` turns the markdown date line from `7/31/2026` into `31.7.2026`. An
unpinned harness would fail on a colleague's laptop for no reason anyone could
act on.

`process.env.TZ = 'UTC'` takes effect immediately. `process.env.LC_ALL` does
**not** — ICU resolves the default locale once, at process start. So if the
locale is wrong, the script re-executes itself once with the right environment.
`capturedEnvVars` records the raw `LANG`/`LC_ALL` for context but is never
compared: whether a re-exec was needed differs per machine and changes no byte
of output.

## What each baseline records

**PDFs** — page count, extracted text per page (draw order), table row counts
per page, glyph count, **right-edge extent per page**, and a sha256 of the
normalised extracted text.

Right-edge extent is per page on purpose: a regression on page 3 must not be
masked by an improvement on page 16. Each page records `rightEdgePt`,
`pastMarginPt`, `pastPaperPt`, `runsPastMargin`, `runsPastPaper` and the string
that produced the extent, so a `maxWidth` fix reads as a number rather than
needing an eyeball. Rotated runs (the 45° `DRAFT` watermark) are excluded from
the extent — a rotated string has no meaningful right edge — and counted
separately as `rotatedRuns`.

**CSVs** — row count, column count, header row, first and last three data rows
verbatim, and a sha256 over the assertable columns only.

**Markdown** — line count, heading list, sha256 of the normalised text.

### A baseline records only reproducible facts

Three captures in a row must produce byte-identical baseline files, and they do.
That requirement changed two things from the obvious design, and both are
deviations worth knowing about:

- **`rawBytesSha256` is `null` unless the registry sets `assertRawBytes`.** jsPDF
  re-rolls the trailer `/ID` from `Math.random` unless it is pinned, so for a
  pre-spine PDF a byte hash was a different number every run; storing it churned
  three baseline files on every capture for a value that could never be asserted.
  The *reason* goes under `notReproducible` in its place.

  **This is now conservative rather than necessary for the six migrated
  artefacts.** `ReportDoc` pins `/CreationDate` and `/ID` from `meta.generatedAt`,
  and a two-run sweep confirms all six are byte-identical. They still carry
  `rawBytesAsserted: false`, so 15 of 23 assert raw bytes where 21 could. Turning
  the other six on is one `assertRawBytes: true` per registry entry — see
  "Determinism, measured".
- **For `baiw/gap-csv` and `taiw/gap-csv`, the sample rows are masked in the
  unassertable columns, and `bytes` / `fullTextSha256` / `rawBytesSha256` are
  `null`.** Everything downstream of an RNG column is also RNG: the row text,
  the file length and both whole-file hashes. Every other cell of every sample
  row is untouched, so `sampleRowsMasked: true` costs you three cells out of
  nine and buys a file that does not rewrite itself.

  If you want the genuinely verbatim bytes, they are in `raw/` after every
  capture. That is the right home for nondeterministic output — a gitignored
  scratch dir, not a committed golden file.

`haiw/gap-csv` has no unassertable columns, so its sample rows are fully
verbatim and its hashes are real. See "The control", below.

### How the PDF is read, with no PDF library

jsPDF writes **uncompressed** content streams — there is no `/FlateDecode`
anywhere in its output — so every text run's string, position, font and size is
directly recoverable from `BT /F1 9 Tf … x y Td (string) Tj ET`. Page order comes
from the `/Pages` tree's `/Kids`, not from stream order. Widths come from jsPDF's
own standard-14 metrics via a scratch document. No `pdf.js`, no `pdf-parse`, no
new dependency.

Two things this parser has to get right, and does:

- **WinAnsi decoding.** Every font jsPDF emits declares `/WinAnsiEncoding`,
  where `0x80–0x9F` holds the typographic punctuation these reports are full of.
  Decoded as Latin-1 they become invisible C1 control characters. This was
  caught when a captured page read `Closing this gap requires 1824 months`
  instead of `18–24 months`.
- **`tableRows` is a proxy, and is defined against the artefact rather than
  against `jspdf-autotable`**: a shared baseline (same `y`) carrying **three or
  more distinct `x`** positions. Page chrome puts exactly two runs on a shared
  baseline (header left/right, footer left/right), so `>= 3` excludes it while
  every real table row — the narrowest here has four columns — is counted.
  `multiColumnBaselines` (`>= 2`) is recorded alongside it. Defining it against
  the PDF rather than against the table library is what keeps it meaningful if
  D2 changes how tables are drawn.

## Normalisation — what is neutralised, and why

Each of these is normalised in `harness.mjs` with a comment naming it:

| What | Why |
|---|---|
| PDF `/CreationDate` (23 bytes) and trailer `/ID` (77 bytes) | jsPDF fills them from the wall clock and `Math.random`. Excluded **by hashing the extracted text rather than the bytes**, which also survives D2 shifting every byte offset. |
| PDF cover date → `⟨DATE⟩` | `new Date().toLocaleDateString('en-US', …)`. Raw value recorded under `clockDerived.renderedDates`. |
| Markdown line 2 date → `⟨DATE⟩` | bare `toLocaleDateString()`. Raw value recorded under `clockDerived.dateLineRaw`. |
| ISO date inside filenames → `⟨DATE⟩` | post-D2 `reportFilename()` embeds `YYYY-MM-DD`. |

Raw clock values are **reported as `INFO`, never as failures** — they move on
their own each day. The one long-form date pattern matches both the pre-D2
`toLocaleDateString('en-US', …)` output and the post-D2 `formatCoverDate()`
output, so it keeps working across the migration.

## Unassertable — declared, not ignored

`baiw/gap-csv` and `taiw/gap-csv` columns **`Current Level`, `Gap`, `Priority`**
are not compared. They come from `Math.random()` in `generateGapCSV` and
`generateTradeGapCSV`.

The reason string names the **function**, not a line number. It used to say
`reportGenerator.ts:695`, which the D2 migration silently invalidated twice —
the string is copied verbatim into the committed baseline, so a rotted line
reference is a rotted golden file.

`compare.mjs` prints them every run as
`SKIPPED (nondeterministic — Math.random in generateGapCSV (reportGenerator.ts))`.

**State it plainly: a change to every number in those three columns would go
unnoticed by this harness.** That is the honest position given the RNG, and
fixing the RNG is D-001's job, not D2's. See
[`docs/known-defects.md`](../../../docs/known-defects.md).

The `assertableSha256` masks those columns with a token rather than dropping
them, so column positions stay stable in the digest and *adding* a column is
still visible.

## The control

`haiw/gap-csv` reads no clock and uses no RNG — its variation comes from
`cap.id.charCodeAt(…)`. Its bytes were identical across four TZ/locale
environments during characterisation. It is therefore the only artefact
baselined on **raw bytes** as well as normalised text.

**If `haiw/gap-csv` ever reports a raw-bytes diff on an untouched generator, the
harness is wrong, not the generator.** Debug the harness first.

## DGIW coverage — a stronger assertion than the other three

The six module reports are baselined on *extracted text*; DGIW's fourteen on
**raw bytes**. That difference is historical — it dates from when the module
generators re-rolled the trailer `/ID` from `Math.random` on every call, which
they no longer do.

They can be, because `ReportDoc`'s constructor pins both sources of drift from
`meta.generatedAt` — `setCreationDate` and a FNV-1a `setFileId` over the
document's identity plus its content digest. The fixture supplies a fixed
`generatedAt`, so every DGIW artefact is byte-reproducible. `rawBytesAsserted` is
`true` on all fourteen.

That is the point of covering DGIW at all: it makes "this spine change altered
nothing" **provable** rather than asserted. Seven generators shipping to clients
depended on `src/report/` with no coverage whatsoever, which meant any edit for a
new caller was unverifiable for the existing ones.

What the fourteen are:

| Artefacts | Why |
|---|---|
| AR-01 diagnostic × **3 layers** (`all`, `core`, `banking`) | `layer` filters `applicableQuestions()`, so these are materially different documents — 55 / 33 / 22 questions. They are also the only place `LAYER_LABEL`'s three strings are rendered. |
| AR-13 CDE register, PDF + CSV | |
| AR-27 DQ rule spec, PDF + CSV | |
| AR-04 roadmap, AR-09 operating model, AR-48 multi-framework scorecard | |
| AR-47 framework alignment × **4 frameworks** | One artefact id, four documents. The crosswalk is recent work; a projection silently changing under a spine edit is exactly what this is for. |

Each registry entry mirrors its component call site line for line — including
`saveReport(...)` and `reportFilename(...)` — rather than paraphrasing it, so the
harness exercises the real save path.

### DGIW reads live datasets, and that is recorded

The pre-spine fixtures freeze their datasets so a dataset edit cannot read as a
generator regression. DGIW cannot: its seven generators import a dozen JSON files
between them, and freezing ~2 MB into a fixture would mean the baseline stopped
describing the module in production.

So `datasetFingerprint()` records a sha over every file in `src/dgiw/data/` in
each DGIW baseline. If a dataset changed between capture and compare, compare
reports it as **its own finding** rather than leaving a spine edit holding the
blame for the content changes underneath it.

### The CSV path runs for real

DGIW's CSVs go through `report/csv.ts::downloadCsv` → `utils/export.ts::downloadCSV`,
which needs `URL.createObjectURL` and an anchor to click. `dom-sink.mjs` supplies
the minimum for that and takes the Blob at `click()`. The alternative —
reimplementing CSV assembly in the harness — would have meant the baseline
described the harness's idea of a CSV. The BOM, the CRLF terminator and the
quote-every-field rule all live inside `downloadCSV`, and those are precisely the
bytes worth asserting.

## `walk.mjs` — reconciling a diff instead of detecting one

```sh
node scripts/golden/walk.mjs --module baiw
```

`compare.mjs` tells you `glyphCount 13133 -> 13042`. That is the right shape for
"did anything change" and the wrong shape for reviewing a migration, where the
question is *does every glyph that moved have a named reason?* Reconciling a
whole-document delta against eighteen pages of text arrays by eye is how a real
regression hides inside an expected one.

`walk.mjs` prints per-page glyph and run deltas **that must sum to the document
totals** — an unreconciled remainder is the finding — plus every right-edge
extent that moved with the widest run either side, overflow counts before and
after, an ellipsis sweep, and a **reassembly check**: concatenate a page's
content runs, normalise whitespace, and the result must be character-identical
before and after unless text was genuinely added or removed.

That last check is the one that matters. It is what separates "the line
rewrapped" from "the line lost its tail" — D-004 was invisible to every geometry
metric and showed up only there. Page chrome is stripped first, positionally,
because the spine legitimately moves the footer runs to the end of each page.

It reads baselines and writes nothing. Not a gate; it has no opinion about
whether a named change is acceptable.

## `clickthrough.mjs` — the component call site, for real

```sh
npm run dev &                          # port 5174
node scripts/golden/clickthrough.mjs
```

Everything above drives the generator **module**, with a `ReportMeta` the harness
builds. That leaves the one path D2 actually changed at the call site uncovered:
`useReportMeta()` is a React hook reading `useEngagementOptional()` and
`useOrgName()`, and handing a `metaFor(artefactId)` to a click handler. Three
migrations shipped with an honest "I could not drive a browser" caveat against
exactly that.

No dependency was needed after all. Chrome is on the machine and Node 22 ships a
global `WebSocket`, which is the whole surface CDP requires — `cdp.mjs` is ~80
lines and nothing is added to `package.json`, so CLAUDE.md hard rule 4 is intact.

It runs **3 modules × {PDF, markdown} × {engagement, none}** = 12 downloads, and
per file asserts: a file downloads and completes non-empty; the filename matches
`reportFilename()`'s pattern including the `MR-` id, org slug, layer and today's
UTC date; the PDF parses and its **cover carries the engagement's org name**; the
cover does **not** print the artefact id (`coverTag` is `''`); the page chrome
carries the org name; the markdown title and long-form date line agree. The
browser console must stay clean throughout.

Both engagement states are exercised because they take different branches:
with none, `engagementId` falls back to `''` and `orgName` to the profile's
`orgFallback`, which changes both the filename slug and the `/ID` seed.

Answers are entered through the **real controls** — 48 BAIW sliders, 108 TAIW
radios, 540 HAIW sliders — using React's own value setter, because assigning
`.value` directly is invisible to synthetic `onChange` and the report panel would
never appear.

Not a gate: it needs a dev server and a browser, and a check that cannot run
everywhere must not be able to block a build.

## Determinism, measured

Two full captures, byte-compared, all 23:

| | Result |
|---|---|
| **21 of 23** | byte-identical run to run |
| `baiw/gap-csv`, `taiw/gap-csv` | **differ** — `Math.random()`, D-001 |

Every artefact on the spine is reproducible. The two that are not are the two
that are not on it.

`rawBytesAsserted` is `true` on **15** of the 23 — `haiw/gap-csv` (the control)
and all fourteen DGIW artefacts. The six migrated module reports are provably
reproducible but still baselined on extracted text only; the gap is a leftover
from when they could not be, not a property of them now.

## What this does not cover

Four things, stated so nobody has to discover them:

1. **The two RNG column sets.** `Current Level`, `Gap` and `Priority` in
   `baiw/gap-csv` and `taiw/gap-csv` — six column-artefact pairs, unassertable
   until D-001 is resolved. Declared, printed every run, never silently ignored.
2. **The `DRAFT` watermark path.** Every fixture answers every question, so
   `isDraft` is `false` everywhere — in all three module fixtures **and** in
   DGIW's. Nothing draws the watermark, in any of the 23. A change to it would go
   unseen. `clickthrough.mjs` does not close this either: it answers every
   visible question too.
3. **Visual appearance.** Colour, fill, stroke and line work are not captured —
   text, geometry and structure are. The D2 walks caught head-fill and font-size
   changes by *reading the diff*, not by measuring them. `walk.mjs` cannot see
   them either.
4. **DGIW's component call sites.** `clickthrough.mjs` covers BAIW's, TAIW's and
   HAIW's report panels end to end. DGIW's five — `Deliverables.tsx`,
   `Diagnostic.tsx`, `CdeRegister.tsx`, `DqRuleLibrary.tsx`, `Frameworks.tsx` —
   are still driven module-directly, with each registry entry mirroring its call
   site line for line rather than being clicked.

Also worth knowing, though not a gap so much as a limit: **page count is a weak
signal.** All six module PDFs are exactly 18 pages under these fixtures, so it
only moves if a fixture provokes an `autoTable` overflow.
