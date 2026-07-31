# Golden-output harness — the three pre-spine report generators

A capture-and-compare harness over the nine artefacts produced by the three
report generators that have **not** yet been migrated onto `src/report/`:

| Module | Generator file | PDF | CSV | Markdown |
|---|---|---|---|---|
| BAIW | `src/utils/reportGenerator.ts` | `generateMaturityPDF` | `generateGapCSV` | `generateRoadmapMarkdown` |
| TAIW | `src/taiw/utils/tradeReportGenerator.ts` | `generateTradeMaturityPDF` | `generateTradeGapCSV` | `generateTradeRoadmapMarkdown` |
| HAIW | `src/haiw/utils/healthReportGenerator.ts` | `generateHealthMaturityPDF` | `generateHealthGapCSV` | `generateHealthRoadmapMarkdown` |

Since D2 step 0a it also covers **DGIW's seven generators**, which are already on
the spine — fourteen artefacts under `baseline/dgiw/`. See "DGIW coverage" below;
they are asserted far more strictly than the three above.

It exists for one job: **D2 migrates these three onto `src/report/`, and this is
the only safety net in the repo.** There are zero tests. `check-dgiw.mjs` is a
dataset gate and knows nothing about these generators.

## Read this before you use it

**Whether a clean diff is good depends on what you changed.**

For a **generator migration**, a clean diff means the migration did nothing. D2
is supposed to change output — pagination, `maxWidth` wrapping that stops text running off the
page edge, real page counts replacing the hardcoded `totalPages = 18`, and new
filenames from `reportFilename()`. If `compare.mjs` prints "no actionable
differences" after D2, the first hypothesis is that D2 did not run, not that it
was perfectly behaviour-preserving.

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
node scripts/golden/capture.mjs                  # all three modules
node scripts/golden/capture.mjs --module taiw    # one module
node scripts/golden/compare.mjs
node scripts/golden/compare.mjs --module haiw
```

Both work from `baiw/` or from the repo root (`node baiw/scripts/golden/…`) —
paths resolve from the script, not the working directory.

Workflow:

1. **Before D2** — `capture.mjs`, commit `baseline/`. (Already done.)
2. **After D2** — `compare.mjs`. Read the report. Decide, finding by finding,
   whether each change is the intended fix.
3. **Accept** — `capture.mjs` again, and commit the baseline churn *in its own
   commit* so the review is a readable diff rather than noise inside the
   migration.

## Layout

```
scripts/golden/
  harness.mjs           shared core: driver, analysis, normalisation
  capture.mjs           writes baselines
  compare.mjs           recaptures and diffs
  file-saver-sink.mjs   stands in for file-saver under SSR
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

`generatedAt` is `null` in all three: **none of the nine generators accepts
one.** They call `new Date()` directly. See normalisation, below.

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

- **PDF `rawBytesSha256` is `null`.** jsPDF re-rolls the trailer `/ID` from
  `Math.random` on every call, so a byte hash is a different number every run.
  Storing it churned three of the nine baseline files on every capture, for a
  value that can never be asserted. The *reason* is recorded under
  `notReproducible` in its place.
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
are not compared. They come from `Math.random()` at
`src/utils/reportGenerator.ts:695` and
`src/taiw/utils/tradeReportGenerator.ts:721`.

`compare.mjs` prints them every run as
`SKIPPED (nondeterministic — Math.random at reportGenerator.ts:695)`.

**State it plainly: D2 could change every number in those three columns and this
harness would not notice.** That is the honest position given the RNG, and
fixing the RNG is a D2 decision, not a D1 one. See
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

The three pre-spine generators are baselined on *extracted text*, because jsPDF
re-rolls the trailer `/ID` from `Math.random` on every call. DGIW's are baselined
on **raw bytes**.

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

## What this does not cover

Worth knowing before you rely on it:

- **The `DRAFT` path.** All fixtures answer every question, so `isDraft` is
  `false` and the watermark is never drawn. A D2 change to the watermark would
  go unseen.
- **The three columns above**, per the RNG.
- **Page count as a signal.** All three PDFs are exactly 18 pages under these
  fixtures, so the hardcoded `totalPages = 18` is currently *correct* and every
  `Page N of 18` footer agrees with reality. The page-count assertion will not
  move at D2 unless a fixture provokes an `autoTable` overflow.
- **Visual appearance.** Colour, fill, stroke and line work are not captured.
  Text, geometry and structure are.
- **The React components** that call these generators. The harness drives the
  generator functions directly, matching the call sites in
  `ReportGenerator.tsx`, `TradeReportGenerator.tsx`,
  `HealthReportGenerator.tsx`, and for DGIW `Deliverables.tsx`, `Diagnostic.tsx`,
  `CdeRegister.tsx`, `DqRuleLibrary.tsx` and `Frameworks.tsx`.
- **DGIW under a draft engagement.** `isDraft` is `false` in the fixture, so the
  spine's watermark path is uncovered for DGIW too — the same hole the three
  pre-spine modules have.
