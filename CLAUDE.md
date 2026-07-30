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
