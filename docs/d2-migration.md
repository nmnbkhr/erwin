# D2 — the three module report generators, onto the spine

**Closed 2026-07-31.** Six commits, five steps, one deliberate re-baseline.

## What it set out to do

`src/report/spine.ts` was extracted during Phase B for DGIW and used by DGIW's
seven generators only. The three module generators —
`utils/reportGenerator.ts`, `taiw/utils/tradeReportGenerator.ts`,
`haiw/utils/healthReportGenerator.ts` — were near-identical copies of each other,
~800 lines apiece, each re-deriving page chrome, pagination, filenames and dates
by hand. D2 moved their PDF and markdown deliverables onto the spine without
changing what a client reads, and proved it rather than asserting it.

Order was HAIW → TAIW → BAIW, one module per step, each with a written
page-by-page walk before the next began.

## What it found

The migration was the occasion; the findings were the value. **Four defect
classes, none of which anyone had reported, all found by measurement rather than
by reading the code.**

| | What | How it was found |
|---|---|---|
| **D-002** | TAIW's benchmark sentence drawn 166.64 pt **past the paper edge** — 37 of 155 characters invisible in every trade assessment ever exported | right-edge extent per page, in the golden baseline |
| **D-004** | jsPDF's `{ maxWidth }` computes a line split and then draws **only the first line**, discarding the rest silently. Three sentences lost from every HAIW PDF — and three instances sitting in `spine.ts` itself | text reassembly, comparing a page's runs before and after |
| **D-005** | `bullets()` and `keyValueBlock()` measured **before** setting the font size, so the first item of every list wrapped against the previous call's size. One AR-09 line was 3.78 pt off the sheet | the HAIW walk; it survived from Phase B to Phase D because items 2+ were fine |
| **D-006** | BAIW's roadmap phase boxes are laid out to 200 mm against a 195 mm content column | the BAIW walk; the one overflow the migration did **not** close |

D-004 is the instructive one. The register's own advice for fixing D-002 was
"pass `maxWidth`" — which would have traded a visible overflow for a silent
truncation. That advice was written before anyone measured what the option does.

Two things followed structurally rather than as one-off fixes:

- **`check-dgiw.mjs` grew a TEXT-MAXWIDTH class** that rejects the option
  outright across five declared report source locations, so D-004 cannot come
  back. `REPORT_SOURCE_LOCATIONS` also brought the three module generators inside
  ARTEFACT-IMPL and CSV-HEADER, which they had been outside of.
- **`MODULE_ARTEFACT_IDS`** froze nine `MR-<MODULE>-<KIND>` ids in the gate,
  deliberately disjoint from DGIW's `AR-` register, and `ReportMeta.coverTag`
  separated document identity from cover presentation so a module report can have
  an id for its filename and `/ID` seed without printing one that cites a
  catalogue it does not have.

## Where it ended up

**23 artefacts under golden coverage. `compare.mjs` exit 0. 21 of 23
byte-identical run to run** — the two that are not are the two gap CSVs, which
are not on the spine.

| | Before D2 | After |
|---|---|---|
| generators on the spine | 7 (DGIW) | 13 |
| `createReport` calls under the gate | 7 | 10 |
| declared report source locations | 2 | 5 |
| hand-placed `doc.text` calls in report code | ~212 | 122 |
| golden artefacts | 9 | 23 |
| byte-reproducible artefacts | 14 | 21 |

The report component call sites are now driven by a real browser —
`scripts/golden/clickthrough.mjs`, over CDP, with **no npm dependency**: Chrome
is on the machine and Node 22 has a global `WebSocket`. That closed the one
caveat carried honestly through all three migration steps.

## What remains open

**D-001 — fabricated per-capability scores. Blocked on a product decision.**
The two gap CSVs generate 112 and 96 capability rows by adding
`(Math.random() - 0.5) * 0.6` to a category score, and pages 13 of the BAIW and
TAIW PDFs synthesise twenty "capabilities" by concatenating category names and
offsetting the score by fixed amounts. Clients receive all four. This is the
largest open item in the register and it is **not a code defect** — deciding what
those pages should say instead is editorial, and the answer differs per module.
It is why the three gap CSVs are the only pre-spine code left; they move together
once it is decided. Migrating them first would change their bytes without
changing anything that matters.

**D-003 — HAIW's "largest estimated gaps" page reports twenty gaps of zero.**
Logged and live. It matches HACR categories against HCF themes, which never
match. Migrated verbatim, with a comment at the synthesis site, for the same
reason D-001's pages were.

**D-006 — BAIW's roadmap phase-box grid.** Logged and live, 0.57 pt past the
margin, nothing off the paper. Not a text defect and not something `text()` can
fix; the fix is `boxW = 53.33`, which moves twelve baselines on the page in two
modules and deserves its own before/after.

## The register, at close

| | Status |
|---|---|
| D-001 fabricated scores | **open — blocked on a product decision** |
| D-002 TAIW text past the paper edge | **fixed** (step 2) |
| D-003 HAIW twenty zero gaps | **open — logged and live** |
| D-004 `maxWidth` drops lines | **fixed** (step 1b) + gated by TEXT-MAXWIDTH |
| D-005 measure-before-set in the spine | **fixed** (step 1b) |
| D-006 BAIW phase-box grid | **open — logged and live** |

Two fixed outright, one fixed and permanently gated, two logged and live, one
waiting on a decision that is not an engineer's to make.

## What to read next

- [`known-defects.md`](known-defects.md) — the full register, with measurements.
- [`../baiw/scripts/golden/README.md`](../baiw/scripts/golden/README.md) — the
  harness, what it asserts, and the four things it does not cover.
- `CLAUDE.md`, "Text in a report must go through the spine" — the two rules that
  came out of D-004 and D-005, stated as rules rather than as history.
