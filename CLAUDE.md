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

Eleven rules, two kinds. Six apply to every change, wherever it lands. Four
apply only when the change touches the gate itself — skip that block if yours
doesn't. The eleventh, closing a stage, is conditional the same way and is
below both.

### Always

1. **`archive/` is never read by the app.** Verified by grep, recorded in
   `archive/README.md`. Do not import from it. Do not treat it as live.
6. **`npm run build` and `./dev.sh build` are not equivalent.** Only the npm
   script runs the gate. Always verify with `npm run build`.
8. **`tsc -b` must pass.** `strict: true`. `noUnusedLocals` and
   `noUnusedParameters` are deliberately off — do not turn them on.
9. **Additive only.** Do not delete or rewrite an existing file. Extend it.
10. **Do not add a seventh copy of the layout shell.** See below.
7. **There is no test framework.** No vitest, jest or playwright. The gate,
   `check:selftest` and `scripts/golden/` are harnesses, not tests, and none of
   them asserts application behaviour. If a task needs tests, propose the
   framework and wait for approval — do not install one unasked.

### When you touch the gate

"Touching the gate" means editing `scripts/check.mjs`, anything under
`scripts/check/`, or a rule file it declares. Changing a route, a component,
`navItems`, or a doc is not this — skip to "Closing a stage" below.

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
5. **`npm run check:selftest` demonstrates every finding code.** 79 mutations,
   54 codes, ~30 s. It copies `src/` and `scripts/` to a scratch root under
   `node_modules`, applies one mutation per code, asserts the code is reported
   *and* the tool exits non-zero, then restores and re-runs the control. **No
   tracked file is ever written.** Run it after touching the gate: a refactor
   that leaves a check passing because it stopped running is the failure mode it
   exists for, and inspection has missed that twelve times.

### Closing a stage

11. **A stage is not complete until the right verify command exits 0 and its
    output is pasted.** `npm run build` is **not** sufficient and never was: it
    runs `check.mjs`, `tsc -b` and `vite build`, and skips lint,
    `check:selftest`, `compare`, `geometry` and `drive:dashboards`. **A defect
    has surfaced in every one of those.** Which command is required is
    conditional:

    ```
    npm run verify         required — the change moves a baseline, touches a
                            generator, a dataset, or a rule file
    npm run verify:quick   sufficient otherwise — routes, components, navItems,
                            docs
    ```

    **`verify:quick` ships.** `npm run verify:quick` from `baiw/`, or from the
    repo root through the passthrough. It is `scripts/verify.mjs --quick`: one
    file, one sequence, one summary format, so the two targets cannot drift into
    two tools. **17.7 s against 81.8 s, and 176 lines against 3,842.**

    The design is measured, and it is not "check, tsc, lint, one compare": of
    `npm run verify`'s run, `check:selftest` alone is **64 s of ~82 s — 78%**;
    everything else together is 18 s, and the three golden steps (`compare` ×2,
    `geometry`, `drive:dashboards`) are 2.8 s of that. Cutting geometry, drive
    and a `compare` run to build "quick" would save ~3% of the runtime and lose
    the only steps that read generated output — for almost nothing, since the
    entire saving is in one step. So `verify:quick` is `npm run verify` **minus
    `check:selftest` alone** (7 of 8 steps, both `compare` runs kept), and it
    must **refuse — exit non-zero, not warn** — when `git status --porcelain`
    reports any change under `scripts/`, or when that cannot be established.

    **State the risk: a gate people route around is worse than a slower one
    they run.** `check:selftest` is the only step that proves a finding code is
    reachable *from the check that declares it*, not merely that the check
    runs. Both of its real catches in this repo's history were edits under
    `scripts/`: a shared `unique()` helper hardcoding one code so two different
    rules failed under a name neither declared, and a refactor that dropped a
    real assertion while moving it between check classes. `verify:quick` cannot
    see either shape — that is exactly the step it skips. Choosing it is a
    claim that the change did not touch the gate, and the refusal condition
    checks that claim structurally instead of trusting memory. If `scripts/` is
    dirty, `verify:quick` was the wrong choice and `npm run verify` is
    required. See "Closing verification" below.

    **The realistic comparison is not quick-versus-full.** It is
    quick-versus-`build`, because `npm run build` is what a hurry already reaches
    for, and quick strictly dominates it for about seven more seconds:

    | | steps | skips | wall |
    |---|---:|---|---:|
    | `npm run build` | 3 | lint, selftest, compare ×2, geometry, drive — **a defect has surfaced in every one** | ~11 s |
    | **`npm run verify:quick`** | **7** | selftest only, **under a refusal** | **17.7 s** |
    | `npm run verify` | 8 | — | 81.8 s |

    Refusing costs nothing and happens before any step runs: the git query is the
    first thing the target does, so a wrong choice is rejected instantly rather
    than 18 s in. It exits **2**, distinct from 1 (a step failed), so "you used
    the wrong target" and "the tree is broken" are not the same signal. It
    refuses just as hard when the condition **cannot be evaluated** — not a git
    worktree, `git status` failed — because a safety condition that degrades to
    "probably fine" is the VACUOUS shape one level up.

    Quick's summary prints the skipped step **inside the matrix** as `SKIP`, not
    above it and not as a footnote, so a column of `PASS` cannot read as
    eight-for-eight; it prints what that step alone proves, the refusal condition
    it ran under, the full WHAT THIS DOES NOT COVER block, and closes on **THIS
    IS NOT A STAGE-CLOSING RUN**.

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

## Closing verification

`npm run verify` (`scripts/verify.mjs`, **81.8 s measured**). One command, one exit
code, eight steps in this order — `npm run verify:quick` is the same file and the
same sequence minus step four, under the refusal in hard rule 11:

```
check → tsc -b --force → lint (asserted) → check:selftest → compare
      → geometry --fail-on-overflow → compare again → drive:dashboards
```

**Defects here have surfaced rounds after work was declared complete, and the
reason was always the same: the closing check was remembered rather than
structural.** That is what this replaces. Hard rule 11 is the contract; this
section is what the tool does that running the steps by hand does not.

- **`tsc -b --force`, not `tsc -b`.** An incremental no-op off `.tsbuildinfo` is a
  check that stopped running. A closing gate must not depend on a cache.
- **Lint is ASSERTED, not run.** `eslint` exits 1 at the standing baseline of 53,
  so the exit code says nothing; the **count** is the signal, and a change in
  *either* direction fails. A baseline moving down is still a baseline moving —
  name which problems cleared and why, then move `LINT_BASELINE` in
  `scripts/verify.mjs` in the same commit. (D-012's two were dead code servicing
  removed defects; that is what an accounted-for drop looks like.) The command is
  read out of `package.json` so it cannot drift from `npm run lint`.
- **`compare` runs TWICE and the two outputs must be byte-identical.** A second
  run catches what one does not: `/ID` non-determinism, a baseline churning
  against itself, a comparison reading a stale artefact. `src/report/` asserts
  determinism internally and nothing verified it from outside until now.
- **No baseline may be written.** Every file under `scripts/golden/baseline` is
  hashed before the first step and after the last, and a rewrite fails the run
  by name. Verification that quietly re-freezes its own record is worse than
  none — three tools in this repo have shipped that shape.
- **It is cwd-independent.** Every path resolves from the script and every child
  runs with `cwd: baiw/`.

All three of the novel gates have been **demonstrated failing**, because a gate
that cannot fail is decoration: a moved lint baseline, a non-reproducible second
run, and a step that writes a baseline (against a throwaway directory — the
tracked record was not touched).

### The closing checklist — every item is something that actually went wrong

- **Run from `baiw/`.** `npm run build` succeeds from the repo root while
  `compare.mjs` and `geometry.mjs` silently target the wrong path and report on
  nothing. `npm run verify` is immune by construction and there is a root
  passthrough, but every other command is not.
- **Never read `scripts/golden/raw/` to verify a change.** It is scratch and
  gitignored. It goes stale the moment a generator moves, and reading it compares
  old against old.
- **`compare`, then walk, then `capture --accept`.** Capturing first freezes an
  unwalked baseline. `capture.mjs` refuses without the flag now, but the *order*
  is still yours: read the diff, walk whatever moved, then accept.
- **A second run catches what one does not.** Built into `verify` for `compare`;
  keep the habit for anything else you run by hand.
- **`git status` must be confined to the stage's declared scope.** Anything
  outside it is **reported, not folded in** — a fix riding on an unrelated change
  is a fix nobody reviewed.
- **State plainly what the harness CANNOT see.** `verify` prints this itself and
  the report must repeat it. Nothing here renders a React component or clicks
  anything; `drive:dashboards` calls the real exported scoring functions and
  **prints a table a human still has to read**. **Zero baseline movement is not
  evidence for a component, a fallback branch or a dashboard** — both maturity
  radars carried a fabrication for two phases while every harness reported green.
  `compare` also regenerates BAIW/TAIW/HAIW from **frozen fixtures**, so a live
  dataset drift appears under `source datasets` and never in the raw bytes.

### `drive:dashboards` is in `verify`, and the reason it was not is worth recording

The standing assumption was that it needs a dev server. **It does not, and never
did.** It builds an in-process module runner —
`createServer({ appType: 'custom', server: { middlewareMode: true } })` — binds
**no port**, and closes it in a `finally`. Verified: nothing listens on 5174 while
it runs. So it cannot fail the way `clickthrough.mjs` failed, which was the only
reason to keep it out that mattered.

It is the **one step in `verify` that executes application source**, which is
exactly the surface D-012 and D-013 lived on. It reports rather than asserts, by
design. What `verify` gates is that it **ran**: a run that drives zero category
rows fails, because a reporter that always exits 0 is indistinguishable from
outside from a reporter that stopped running.

**It also printed 3,736 lines of nothing — 49% of everything `verify` emitted.**
Vite's dep scanner starts in the background, `finally { vite.close() }` closes the
server before it finishes, and every module it was mid-resolve on throws
"The server is being restarted or closed" as a full esbuild-formatted error block
naming a file the script never asked for. It named `src/alm/` and
`QuickAssessment.tsx` while driving two radars, and it was identical at HEAD, so
it predated everything that appeared in it.

The fix is `optimizeDeps: { noDiscovery: true, include: [] }` — **the option
`scripts/golden/harness.mjs` has always carried, for the reason its comment already
gave**: SSR never touches the pre-bundle, so discovery crawls the whole app for
nothing and then complains when the server closes. **Nothing is filtered.** The
crawl is not started, so the output is not suppressed — it is not produced. A
stderr filter would have been wrong twice: it would hide a real vite error the day
one appears, and it would leave the race in place for the next tool that closes
this server. `verify` now prints 3,842 lines where it printed 7,606.

## The declared report source set

Three classes — CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL — read source code
rather than data, and they read exactly what the registry declares. **Eight
locations from five rule files, resolving to 27 `.ts` files** as of D5 stage E3:

| Location | Declared by |
|---|---|
| `src/report` | `check/modules/_spine.mjs` |
| `src/frameworks/report` | `check/modules/_spine.mjs` |
| `src/utils/reportGenerator.ts` | `check/modules/baiw.mjs` |
| `src/taiw/utils/tradeReportGenerator.ts` | `check/modules/taiw.mjs` |
| `src/taiw/report` | `check/modules/taiw.mjs` |
| `src/haiw/utils/healthReportGenerator.ts` | `check/modules/haiw.mjs` |
| `src/haiw/report` | `check/modules/haiw.mjs` |
| `src/dgiw/report` | `check/modules/dgiw.mjs` |

The three new ones arrived with the projection deliverables, and declaring them
was the FIRST step of that stage rather than the last. Until they landed the
gate read 18 files from 5 locations and the two newest generators in the suite —
the two most likely to forget a content digest, being written from scratch — had
no digest rule applied to them at all. Everything else in E3 was invisible to
`check.mjs` until this list moved.

`tsModules` is the separate mechanism for source a check must *run* rather than
read: `src/dgiw/projection.ts` + `scoring.ts`, `src/haiw/projection.ts` +
`src/scoring/maturity.ts`, and TAIW's two. An entry point that fails to build
disables every class bound to it, so each of those classes reports under **its own
name** — CLAUDE.md records the version that shipped, where an esbuild failure
silenced CROSSWALK-DISTINCTNESS behind a `projection ? … : []` while only
PROJECTION-INVARIANT said so.

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

D4 filled two of the empty rule files; D5 added the crosswalk factory to TAIW and
HAIW. The REGISTRY line prints the breakdown on every build:

```
REGISTRY 7 entries, 61 checks (suite 4, _spine 0, baiw 3, taiw 19, haiw 18, coe 0, alm 0, dgiw 17)
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

**A subcategory id is DERIVED, never authored and never positional.**
`hacrSubcategoryIdOf('HACR-DG-190', 'Data Quality Management')` →
`dg_data_quality_management`. A hand-authored registry would be a second copy of a
list the dataset already holds — `CATEGORY-UNIVERSE`'s shape one level down — and
slicing every nine questions in file order would be D-012's shape, right until
someone inserts a question and every subsequent mapping silently moves onto the
wrong topic. `SPINE-UNIVERSE` asserts the derived set against the crosswalk on
every build.

### HACR is nine template stems, and that has to be on the page

Strip the subcategory name out of every `question` and **exactly nine distinct
forms remain**, each appearing 80 times: strategic planning · resource allocation ·
implementation maturity · staff competency · technology support · process
documentation · performance measurement · continuous improvement · stakeholder
engagement. `levelDescriptions` and `pakistanContext` are templated identically —
nine forms across all 720. TACR, for contrast, has **640 individually authored
question texts, all distinct**.

That is why **all four frameworks reach 100% of themselves on HACR** where DMBOK
reached 94% and DGI 59% on TACR. **It is a property of how the bank was generated,
not evidence of depth.** `retainedShare` cannot say so — a dimension can retain 1.0
on nine repetitions of one stem — and neither can FRAMEWORK-REACH, which counts
leaves rather than evidence. So `HACR-INSTRUMENT` measures it and the build prints
it:

```
HACR-INSTRUMENT 80 subcategories × 9 questions, built from 9 template stems over the whole bank
  — every subcategory measured identically, none more deeply than any other
```

**Any HAIW deliverable that renders a framework scorecard must carry that
sentence beside it.** The nine are declared in full in the rule file rather than
counted, because `=== 9` is the `> 0` mistake: true of this bank and equally true
of nine completely different stems. The check **deliberately fails the day someone
authors real questions**, because on that day the disclosure stops being true and
has to be rewritten in the same commit — `HAIW-WEIGHT`'s shape exactly.

Three branches, three selftest rows, **and each row isolates one branch**. The
obvious mutation — reword one question — trips all three and proves nothing about
which assertion caught it. Rewording *all eighty* instances of one stem leaves the
bank uniform and moves only the stem universe; moving one question to a sibling
subcategory (rewriting its text so the stem still resolves) moves only per-node
coverage; moving a whole subcategory between categories moves only the
ten-per-category count. That is the `unique()`/`UNIQUE` lesson applied inside a
single class.

## A capability score needs a link, not a heading

Every module has two vocabularies: an **assessment** axis (BACR / TACR / HACR
categories — a generic maturity dimension) and a **capability** axis (BVF 112,
TCF 100, HCF 108 — framework-specific business functions). They are
**orthogonal**. A capability's theme is not a narrower version of a category, and
projecting one onto the other is not a rounding error — it is a fabrication.

**HAIW alone EMITS a capability score, and D-016 says its relation is a counter.**
Read both rows of this table; the second one is new and it undercuts the first:

| Module | Link present | Per-capability score |
|---|---|---|
| HAIW | `capabilityLinks` on 720 of 720 — **but positional, D-016** | **derived** — see D-003 |
| BAIW | none | **not emitted** — D-001, removed |
| TAIW | none | **not emitted** — D-001, removed |

This file said, for two phases, that the difference was *authoring*. The field is
present; what is absent is that it means anything.
`capabilityLinks[0] === 'HCF-' + pad(((i + 1) % 108) + 1)` for **720 of 720** in
file order — the same `(i + 1) % N` idiom as D-015's weight five-cycle, one field
over, and the cycle strides across every category boundary so each capability is
evidenced by questions from six or seven of the eight HACR categories. A
capability score is therefore a sample of the whole assessment rather than of
itself.

`HCF-LINK` could not see it: it asserts that every link resolves and every
capability is reached, and **a counter satisfies both better than a real relation
would**. A check that a foreign key resolves is not a check that the relation is
real — D-015's lesson at the level of the join rather than the value.

It is **measured and printed on every build, not asserted**, because the two
honest fixes lead to opposite deliverables — author 720 links, or withdraw the
per-capability score as D-001 did for BAIW and TAIW — and both move page 13, the
gap CSV and five baselines. `docs/known-defects.md` D-016. **The D5 framework
crosswalks rest on none of this**: they map onto HACR's 80 subcategories, an
authored taxonomy, and read `capabilityLinks` nowhere.

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

**`src/frameworks/` is suite-level. Each module owns its own crosswalk and its own
spine.** `frameworks.json` holds the published structure of DMBOK2, DCAM, DGI and
COBIT 2019 — 48 dimensions, 44 leaf — and no module reference at all. Three
modules project onto it:

| Module | Spine | Frameworks | Entries | `spineCoverage` | Page | Artefacts |
|---|---|---|---|---|---|---|
| DGIW | 11 curated pillars | all four | 91 `CW-D-` | **assert** | `/dg/frameworks` | AR-47, AR-48 |
| TAIW | 35 TACR sections | DMBOK2, DCAM, COBIT (**not DGI** — 59% reach) | 73 `CW-T-` | report | `/taiw/frameworks` | `MR-TAIW-ALIGNMENT`, `-SCORECARD` |
| HAIW | 80 HACR subcategories | all four (DGI reaches 100%) | 168 `CW-H-` | report | `/haiw/frameworks` | `MR-HAIW-ALIGNMENT`, `-SCORECARD` |

**The two documents and the page are ONE implementation each, parameterised.**
`src/frameworks/report/projectionReports.ts` is the alignment pack and the
scorecard; `src/frameworks/FrameworkScorecardPage.tsx` is the page; both take the
same `ProjectionReportModule` descriptor, so a module cannot show three
frameworks on screen and four on paper. `src/frameworks/notes.ts` holds the
statements that are true of every module and each module's
`report/frameworkNotes.ts` holds its own findings.

**DGIW's three are deliberately NOT migrated onto them.** Its entries carry a
`layer` and a `pillarId` neither other module has, and moving it would put
fourteen DGIW baseline diffs inside a TAIW/HAIW feature. It is the one remaining
duplicate and it is recorded in `notes.ts` rather than left to be discovered.

**`retainedShare` behaves differently without a layer, and both surfaces say so.**
On TACR and HACR a leaf retains 1.0 or 0.0 and nothing between — measured, not
assumed: `partly-RETAINED` is 0 for every framework on both modules, full and
partial. A FRAMEWORK's retained share still varies (DMBOK2 retains 94% on TACR
because DM07 is unreachable), and the share that moves per leaf is `scoredShare`.
`RETAINED_IS_STRUCTURAL` in `notes.ts` is that paragraph, and the "only partly in
scope" table renders its empty case with the reason rather than being omitted —
a section that vanishes reads as a check that was not run.

Entry ids are namespaced per module because per-file uniqueness fails the moment a
suite-level alignment artefact aggregates them. Framework and dimension ids
(`FW-01`, `DIM-001`) are global and are never renumbered.

**Seven check classes guard them, from one factory** — `scripts/check/lib/
crosswalk.mjs`. SPINE-UNIVERSE, CROSSWALK-SHAPE, -WEIGHT, -ORPHAN, FRAMEWORK-REACH,
-CONCENTRATION and -DISTINCTNESS, plus PROJECTION-INVARIANT per module.
**FRAMEWORK-COVERAGE no longer exists.** It could not fail at all before D3, and
its one D3 failure path — a framework retaining nothing under a layer — does not
exist on a layerless module, so D5 stage C reclassified it rather than shipping it
inert on TAIW: the layer assertion moved into CROSSWALK-WEIGHT, its coverage table
into the summary lines, and the thing it never checked became
CROSSWALK-CONCENTRATION. The selftest caught the first attempt dropping a real
assertion in the move — see CROSSWALK-WEIGHT's two layer rules below.

**Three parameters are per module and every one of them was MEASURED, not copied.**
Copying a neighbour's number is how a guard becomes decoration:

| | DGIW (11) | TAIW (35) | HAIW (80) |
|---|---|---|---|
| `distinctnessFloor` | 0.15 | 0.5 | 0.6 |
| observed min L1 | 0.514 | 0.883 | 0.918 |
| `concentrationCeiling` | 0.35 | 0.35 | **0.25** |
| observed max | **0.541 (DGI, declared)** | 0.172 | 0.187 |

Readability fixes an upper bound that does not scale — above roughly a third a
reader cannot tell a framework's view from one leaf's score. But a ceiling must
also be *reachable by a plausible authoring error*, and at 80 nodes 35% is not:
three of the four frameworks would have to pile several leaves onto one
subcategory to approach it. Hence HAIW's 25%.

**The 11 pillars are DGIW's canonical capability model.** Frameworks map *into*
them. Never add a second canonical layer within a module — a bank with two
maturity numbers to reconcile has been given a problem, not an answer.

**CONCENTRATION IS A PROPERTY OF THE SPINE, NOT OF THE FRAMEWORK, AND THERE IS NOW
A CONTROL FOR THAT.** DGI puts **54.1%** of its induced weight on DGIW's P01 — a
declared, stale-fails exception, and the only one in the suite. The same ten DGI
leaves on HACR's 80 subcategories peak at **18.7%**. Same framework, same dimension
weights, same authoring standard. DGI's leaves want four distinct homes; DGIW
offers one pillar for all four and HACR offers four, so they pile up in one place
and not the other. `docs/dgi-p01-concentration.md` argued the 54% was a true
property of DGI; it is a true property of the *pair*.

**CROSSWALK-DISTINCTNESS AND -CONCENTRATION ANSWER DIFFERENT QUESTIONS.**
Distinctness measures how far apart two induced vectors are; concentration
measures whether either of them is really about one thing. At TACR's 8 categories
all three frameworks put 31–50% of their weight on the single 'Data Governance'
category and **every pairwise L1 still cleared the floor**, because the remaining
half spread differently. That measurement is why concentration is its own class.

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
it appears in. Same for the three DGI groups.

**THE TWO ORPHAN DIRECTIONS ARE NOT THE SAME RULE, and D5 split them.** A mapping
attached to a parent, and a mapping pointing at a spine node that does not exist,
are always defects — CROSSWALK-ORPHAN. The other two are per module:

- **A leaf dimension with no mapping** moved to **FRAMEWORK-REACH**. It is a
  failure by default, and a declared exception with a *named evidence gap* is the
  only way to say otherwise; a stale one fails, and one naming a code the module
  does not carry fails. TAIW has exactly one (DM07 Document & Content Management —
  0 of 640 TACR questions). **HAIW has none: DM07 lands on `ii_document_exchange`,
  because health runs on clinical documents.** Whether a leaf is reachable is a
  fact about the *assessment*, not about the framework, and two modules disagreeing
  about DM07 for a checkable reason is the class working.
- **A spine node no framework maps** is `spineCoverage`. DGIW asserts — its eleven
  pillars ARE the capability model, so a pillar nothing maps is scorable evidence
  counting toward nothing. TAIW and HAIW report, and **`report` requires a written
  reason** on the `mayBeEmpty` precedent. TACR's 7 of 35 are customs operations;
  HACR's 14 of 80 are patient engagement, care outcomes and workforce culture.

**HACR IS NOT A DATA TAXONOMY THROUGHOUT — that was expected going into D5 stage D
and the measurement said otherwise.** Three of its eight categories describe health
service delivery. Six of the ten Patient & Community Engagement subcategories and
five of the ten Outcomes & Impact ones are reached by no data-management framework,
and that is the domain, not an authoring gap. Do not carry one module's
`spineCoverage` setting to the next on the strength of the taxonomy's *name*.

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
