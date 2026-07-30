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
- **Three near-identical PDF report generators** (`utils/reportGenerator.ts`,
  `taiw/utils/tradeReportGenerator.ts`, `haiw/utils/healthReportGenerator.ts`).
  A fourth should extract the shared spine, not clone the file.
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
