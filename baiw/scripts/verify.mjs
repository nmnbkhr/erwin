#!/usr/bin/env node
/**
 * verify.mjs — the closing gate. `npm run verify`.
 *
 * ─── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * Defects have surfaced rounds after work was declared complete, and every time
 * the reason was the same: the closing check was REMEMBERED rather than
 * STRUCTURAL. `npm run build` is not it. It runs `check.mjs`, `tsc -b` and
 * `vite build`, and skips lint, the selftest, the golden comparison, the geometry
 * audit and the dashboard drive. A defect has surfaced in every one of those.
 *
 * So this is one command with one exit code, and the rule in CLAUDE.md is that a
 * stage is not complete until it exits 0 and its output is pasted.
 *
 * ─── FOUR THINGS IT DOES THAT RUNNING THE STEPS BY HAND DOES NOT ───────────
 *
 * 1. CWD-INDEPENDENT. Every path resolves from this file, and every child runs
 *    with `cwd: baiw/`. `npm run build` succeeds from the repo root while
 *    `compare.mjs` and `geometry.mjs` silently target the wrong directory and
 *    report on nothing — a green run over an empty set, which is the exact shape
 *    the VACUOUS rule exists for, one level up.
 *
 * 2. LINT IS ASSERTED, NOT RUN. `eslint` exits 1 at the standing baseline of 53,
 *    so an exit code says nothing here; the COUNT is the signal. A change in
 *    either direction fails, because a baseline moving DOWN is still a baseline
 *    moving and saying which problems cleared and why is the difference between
 *    an improvement and drift (see CLAUDE.md, repo hygiene — that is how D-012's
 *    two dead-code errors were accounted for). The command itself is read out of
 *    package.json rather than restated, so this cannot drift from `npm run lint`.
 *
 * 3. COMPARE RUNS TWICE AND THE TWO OUTPUTS MUST BE IDENTICAL. A second run
 *    catches what one does not: `/ID` non-determinism, a baseline that churns
 *    against itself, a comparison reading a stale artefact. Determinism is a
 *    property this repo asserts in `src/report/` and has never verified from
 *    outside.
 *
 * 4. NO BASELINE MAY BE WRITTEN. Every file under `scripts/golden/baseline` is
 *    hashed before the first step and after the last. Verification that quietly
 *    re-freezes the record it is verifying against is worse than no verification,
 *    and this repo has shipped that shape three times (clickthrough, capture,
 *    compare — CLAUDE.md, "a tool that destroys the record it exists to
 *    preserve"). `raw/` is deliberately NOT guarded: it is scratch, it is
 *    gitignored, and capture rewrites it on purpose.
 *
 * ─── WHAT IT STILL CANNOT SEE ──────────────────────────────────────────────
 *
 * Say this out loud in the report; do not let a green matrix imply it. Nothing
 * here renders a React component or clicks anything. `drive:dashboards` is the
 * closest, and it prints a table for a human rather than asserting a value.
 * ZERO BASELINE MOVEMENT IS NOT EVIDENCE for a component, a fallback branch or a
 * dashboard.
 *
 * ─── TWO TARGETS, AND WHY THE SECOND ONE REFUSES ───────────────────────────
 *
 * `verify:quick` is the same sequence minus ONE step: `check:selftest`, which is
 * 64 s of the 82 s — 78% of the run, in a single step. Everything else together
 * is 18 s, and the three cheap golden steps are 2.8 s of it, so there is nothing
 * else worth cutting: dropping `compare`/`geometry`/`drive` would save 3% and
 * lose the only steps that read generated output.
 *
 * THE OBJECTION IS REAL AND SO IS THE ANSWER. A second target invites routing
 * around the first. But the target people already route to is `npm run build`,
 * which skips FIVE steps — lint, selftest, compare, geometry, drive — and a
 * defect has surfaced in every one. `verify:quick` skips one, under a refusal.
 * The choice is not quick-versus-full; it is quick-versus-build, and quick
 * strictly dominates for about seven more seconds:
 *
 *     npm run build     3 steps   skips lint, selftest, compare x2, geometry, drive
 *     verify:quick      7 steps   skips selftest, and REFUSES when that matters
 *     npm run verify    8 steps   the stage-closing run — CLAUDE.md hard rule 11
 *
 * THE REFUSAL IS THE WHOLE SAFETY PROPERTY, so it is structural rather than
 * remembered — which is the thing this file was written to fix in the first
 * place. `check:selftest` is the only step that answers "is every finding code
 * still reachable FROM THE CHECK THAT DECLARES IT", and both of its real catches
 * were edits under `scripts/`: the shared `unique()` helper hardcoding the
 * `UNIQUE` code so `TACR-UNIQUE` and `HACR-UNIQUE` failed builds under a code no
 * rule file declares, and D5 stage C's first attempt at moving
 * FRAMEWORK-COVERAGE's layer assertion into CROSSWALK-WEIGHT, which dropped a
 * real assertion in the move. Inspection missed the first and would have missed
 * the second.
 *
 * So `verify:quick` exits 2 — not a warning, a refusal — when `git status
 * --porcelain` reports any change under `scripts/`. It also refuses when it
 * CANNOT establish that, because a safety condition that silently degrades to
 * "probably fine" is the VACUOUS shape one level up.
 *
 *   npm run verify              # every step — the stage-closing run
 *   npm run verify:quick        # minus check:selftest; refuses if scripts/ moved
 *   npm run verify --           # same as verify; extra args are ignored
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = path.join(ROOT, 'scripts', 'golden', 'baseline')

/**
 * The standing lint baseline. 53 = 44 errors + 9 warnings, all pre-existing.
 *
 * Declared here so a change costs an edit to this file and a sentence in the
 * report — the `SLUG_EXCEPTIONS` / `mayBeEmpty` precedent. It was 55 until D-012.
 */
const LINT_BASELINE = 53

const P = (...xs) => path.join(ROOT, ...xs)
const rule = (c = '─') => console.log(c.repeat(78))

/** `--quick` skips exactly the steps carrying a `skippedByQuick` reason. */
const QUICK = process.argv.slice(2).includes('--quick')
const TARGET = QUICK ? 'npm run verify:quick' : 'npm run verify'

/**
 * The tree `--quick` may not be used on, and the exact question asked of git.
 *
 * `scripts/` whole, not `scripts/check/` alone. Both of selftest's real catches
 * were in `scripts/check/`, but the selftest COPIES `scripts` wholesale and its
 * geometry row drives `scripts/golden/geometry.mjs` — so narrowing the condition
 * to the directory where the two known catches happened would be fitting the rule
 * to the sample. The broad condition is also the one nobody has to think about,
 * which is the point of making it structural.
 *
 * Editing this file therefore makes `--quick` refuse. That is correct, and it is
 * the cheapest possible demonstration that the refusal works.
 *
 * ─── TWO THINGS IT DOES NOT CATCH, MEASURED, NOT ASSUMED ───────────────────
 *
 * 1. `touch scripts/golden/geometry.mjs` alone does NOT refuse — exit 0. git
 *    reports CONTENT, not mtime, and that is the right signal: a file whose
 *    timestamp moved and whose bytes did not has not changed the gate. Written
 *    down because "touch a file and watch it refuse" is the obvious way to test
 *    this and it does not work.
 *
 * 2. A COMMITTED change under `scripts/` does not refuse, because the working
 *    tree is clean again. Someone can edit a rule file, commit, and then run
 *    `--quick` legitimately without `check:selftest` ever having seen it.
 *
 * The second is a real hole and it is left open deliberately. Closing it needs a
 * baseline to compare commits against — a merge-base, a tag, a recorded
 * last-full-verify SHA — and every one of those is a new mechanism carrying a
 * judgement that can be silently wrong, which is this repo's worst failure class.
 * The condition as specified is crude and cannot be subtly wrong. **If you commit
 * a gate change, run `npm run verify` — the refusal will not remind you.**
 */
function scriptsChanged() {
  const gitRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT, encoding: 'utf8' })
  if (gitRoot.status !== 0) return { known: false, why: 'git rev-parse --show-toplevel failed — this is not a git worktree' }
  const top = gitRoot.stdout.trim()

  /*
   * `-z`: NUL-separated and NEVER quoted. Porcelain v1 quotes and backslash-escapes
   * any path with a space or a non-ASCII byte, and this repo already contains one
   * (`e/CANON_PHASE_PLAN (1).md`) — a parser that unquoted wrongly would silently
   * stop matching, which is a refusal that quietly stops refusing.
   */
  const st = spawnSync('git', ['status', '--porcelain', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  if (st.status !== 0) return { known: false, why: `git status --porcelain -z exited ${st.status}` }

  // Repo-relative, so `baiw/scripts` from the repo root, `scripts` from inside it.
  const rel = path.relative(top, P('scripts')).split(path.sep).join('/')
  const under = (p) => p === rel || p.startsWith(`${rel}/`)

  const fields = st.stdout.split('\0').filter((f) => f !== '')
  const hits = []
  for (let i = 0; i < fields.length; i++) {
    const xy = fields[i].slice(0, 2)
    const p = fields[i].slice(3)
    // R and C carry the ORIGINAL path as the next field. Both sides are a change.
    if (/[RC]/.test(xy)) {
      const from = fields[++i] ?? ''
      if (under(from)) hits.push(`${xy} ${from} -> ${p}`)
      else if (under(p)) hits.push(`${xy} ${from} -> ${p}`)
      continue
    }
    if (under(p)) hits.push(`${xy} ${p}`)
  }
  return { known: true, hits }
}

/** Every file under baseline/, hashed by relative path. Sorted, code-unit order. */
function baselineDigest() {
  const files = []
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = path.join(dir, e.name)
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(abs, r)
      else files.push([r, createHash('sha256').update(fs.readFileSync(abs)).digest('hex')])
    }
  }
  if (fs.existsSync(BASELINE)) walk(BASELINE, '')
  const h = createHash('sha256')
  for (const [r, d] of files) h.update(`${r}${d}`)
  return { count: files.length, digest: h.digest('hex'), files: new Map(files) }
}

/** Run one child, streaming nothing — output is printed by the caller, in order. */
function run(argv) {
  const r = spawnSync(argv[0], argv.slice(1), {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
  })
  if (r.error) return { code: -1, out: `${r.error.message}\n` }
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

/** `npm run lint`'s actual command, read from package.json so it cannot drift. */
function lintArgv() {
  const pkg = JSON.parse(fs.readFileSync(P('package.json'), 'utf8'))
  const declared = pkg.scripts?.lint
  if (!declared) throw new Error('package.json declares no "lint" script — verify cannot assert a baseline for a command that does not exist')
  const [bin, ...rest] = declared.split(/\s+/)
  const local = P('node_modules', '.bin', bin)
  return [fs.existsSync(local) ? local : bin, ...rest]
}

/**
 * THE ORDER IS LOAD-BEARING and it is cheapest-and-most-diagnostic first.
 *
 * `check` before `tsc` because a dataset finding names the file and the record;
 * a type error at the same moment is noise on top of it. `check:selftest` after
 * both because it copies `src/` and `scripts/` and re-runs the gate 79 times —
 * no point paying 30 s to discover what `check` says in 2. The golden steps last
 * because they are the ones that read the reviewable record.
 */
const STEPS = [
  {
    name: 'check',
    what: 'the suite gate over the real tree — 61 checks, 7 registry entries',
    argv: [process.execPath, P('scripts', 'check.mjs')],
    gate: (r) => (r.code === 0 ? null : `exited ${r.code}`),
  },
  {
    name: 'tsc -b --force',
    what: 'a full typecheck, NOT an incremental one — a cached no-op is a check that stopped running',
    argv: [P('node_modules', '.bin', 'tsc'), '-b', '--force'],
    gate: (r) => (r.code === 0 ? null : `exited ${r.code}`),
  },
  {
    name: 'lint',
    what: `eslint, asserted against the standing baseline of ${LINT_BASELINE}`,
    argv: lintArgv(),
    /*
     * The exit code is NOT the signal — eslint exits 1 whenever any error exists,
     * and 44 of the baseline's 53 are errors. The count is the signal, in both
     * directions.
     */
    gate: (r) => {
      const m = /(\d+)\s+problems?\s*\((\d+)\s+errors?,\s*(\d+)\s+warnings?\)/.exec(r.out)
      if (!m) {
        if (r.code === 0 && /^\s*$/.test(r.out))
          return `reported no problems at all, against a baseline of ${LINT_BASELINE}. Either every pre-existing problem was fixed — which is a finding worth naming one by one — or eslint linted nothing.`
        return `output carried no "N problems (E errors, W warnings)" line, so the baseline could not be asserted and this step verified nothing`
      }
      const [, total, errors, warnings] = m.map(Number)
      if (total !== LINT_BASELINE)
        return (
          `${total} problems (${errors} errors, ${warnings} warnings) against a baseline of ${LINT_BASELINE}. ` +
          `A baseline moving DOWN is still a baseline moving: say which problems cleared and why, then update ` +
          `LINT_BASELINE in scripts/verify.mjs in the same commit.`
        )
      return null
    },
    summarise: (r) => (/(\d+)\s+problems?\s*\([^)]*\)/.exec(r.out)?.[0] ?? '').trim(),
  },
  {
    name: 'check:selftest',
    what: 'every finding code tripped on a copy — no tracked file is written',
    argv: [process.execPath, P('scripts', 'check', 'selftest.mjs')],
    /*
     * THE ONLY STEP `--quick` SKIPS, and the reason is mandatory in source rather
     * than in a doc — the `mayBeEmpty` / `SLUG_EXCEPTIONS` precedent. A step that
     * can be skipped should require someone to write down what is lost.
     *
     * What is lost is specific: this is the only step that proves a finding code
     * is reachable FROM THE CHECK THAT DECLARES IT, rather than merely that the
     * check ran. Nothing else here can see a shared assertion helper hardcoding
     * one code, or a refactor dropping a real assertion while moving it between
     * classes. Both have happened, both under `scripts/`, which is why the
     * refusal is keyed to that directory.
     */
    skippedByQuick:
      'the only step that proves a finding code is reachable from the check that DECLARES it — ' +
      'not merely that the check ran. Its two real catches were a shared helper hardcoding one code, ' +
      'and a refactor dropping an assertion while moving it between classes; both were edits under scripts/.',
    gate: (r) => (r.code === 0 ? null : `exited ${r.code}`),
    summarise: (r) => (/(\d+) of (\d+) mutations tripped their target/.exec(r.out)?.[0] ?? '') +
      ' · ' + (/(\d+) of (\d+) distinct codes demonstrated/.exec(r.out)?.[0] ?? ''),
  },
  {
    name: 'compare',
    what: 'every artefact regenerated and diffed against the golden baseline',
    argv: [process.execPath, P('scripts', 'golden', 'compare.mjs')],
    gate: (r) => (r.code === 0 ? null : `exited ${r.code} — there are actionable differences, or a NEW/ORPHANED artefact`),
    summarise: (r) => (/(\d+) artefact\(s\) compared[^\n]*/.exec(r.out)?.[0] ?? '').trim(),
  },
  {
    name: 'geometry --fail-on-overflow',
    what: 'drawn PATHS past the content column — what the text harness structurally cannot see (D-006)',
    argv: [process.execPath, P('scripts', 'golden', 'geometry.mjs'), '--fail-on-overflow'],
    gate: (r) => (r.code === 0 ? null : `exited ${r.code}`),
    summarise: (r) => (/\d+ path\(s\) past the content column[^\n]*/.exec(r.out)?.[0] ?? '').trim(),
  },
  {
    name: 'compare (second run)',
    what: 'byte-identical to the first — /ID non-determinism, self-churning baselines, stale comparisons',
    argv: [process.execPath, P('scripts', 'golden', 'compare.mjs')],
    /*
     * The gate is set below, after the first compare has run, so it can close over
     * that output. Two green runs that disagree is the failure this step exists
     * for and it is invisible from either run alone.
     */
    gate: null,
    reproducibilityOf: 'compare',
  },
  {
    name: 'drive:dashboards',
    /*
     * IT IS IN VERIFY, AND THE REASON IT WAS THOUGHT NOT TO BE IS WORTH RECORDING.
     *
     * The standing assumption was that it needs a dev server. It does not, and
     * never did: `createServer({ appType: 'custom', server: { middlewareMode:
     * true } })` builds an in-process module runner, binds NO port, and is closed
     * in a `finally`. Verified — nothing listens on 5174 while it runs. So it
     * cannot fail the way `clickthrough.mjs` failed, which is the reason to keep
     * it out that actually mattered.
     *
     * It is the ONLY step in this file that executes application source. Both
     * maturity radars carried a fabrication for two phases while every other
     * harness here reported green, because none of them runs a React component.
     *
     * It REPORTS rather than asserts, on purpose — a human reads the table, the
     * same contract `geometry.mjs` ships under. What is gated is that it RAN: a
     * reporter that always exits 0 is indistinguishable, from outside, from a
     * reporter that stopped running.
     */
    what: 'the two dashboard radars, driven through the real exported scoring — the surface no fixture reaches',
    argv: [process.execPath, P('scripts', 'dashboard-drive.mjs')],
    gate: (r) => {
      if (r.code !== 0) return `exited ${r.code}`
      const scored = (r.out.match(/^\s+\S.*\s(?:NOT ASSESSED|NOT APPLICABLE|\d\.\d)\s*$/gm) ?? []).length
      if (scored === 0)
        return 'drove no category rows — it reports rather than asserts, so a run that produced nothing looks exactly like a clean one'
      return null
    },
    summarise: (r) => (/categoriesAssessed \d+ of \d+/.exec(r.out)?.[0] ?? 'drove the radars'),
  },
]

// ── run ─────────────────────────────────────────────────────────────────────
console.log(`erwin closing verification — ${TARGET}`)
console.log(`  root: ${ROOT}`)
console.log('  every child runs with cwd=baiw/, so this is safe to invoke from anywhere')

const skipped = QUICK ? STEPS.filter((s) => s.skippedByQuick) : []
const selected = STEPS.filter((s) => !(QUICK && s.skippedByQuick))

/*
 * THE REFUSAL, BEFORE ANY WORK. Exit 2, distinct from 1 (a step failed), so a
 * caller can tell "you used the wrong target" from "the tree is broken".
 *
 * It runs first because refusing should be instant — a refusal that costs 18 s is
 * one people learn to skip past. And it refuses on `known: false` as loudly as on
 * a hit: a safety condition that degrades to "probably fine" when it cannot be
 * evaluated is the VACUOUS shape one level up, and this repo has shipped that
 * thirteen times.
 */
if (QUICK) {
  const st = scriptsChanged()
  if (!st.known || st.hits.length > 0) {
    console.log('')
    rule('━')
    console.log('REFUSED — verify:quick is the wrong target for this change')
    rule('━')
    if (!st.known) {
      console.log(`  Could not establish whether scripts/ has changed: ${st.why}`)
      console.log('  The refusal condition IS the safety property of this target, so a condition that')
      console.log('  cannot be evaluated is a refusal, not a pass.')
    } else {
      console.log(`  ${st.hits.length} change(s) under scripts/:`)
      for (const h of st.hits) console.log(`    ${h}`)
      console.log('')
      for (const s of skipped) console.log(`  verify:quick skips ${s.name} — ${s.skippedByQuick}`)
      console.log('')
      console.log('  Choosing verify:quick is a claim that the change did not touch the gate.')
      console.log('  git says otherwise, so the claim is false and the skipped step is exactly the')
      console.log('  one that would have covered it.')
    }
    console.log('')
    console.log('  Run:  npm run verify')
    process.exit(2)
  }
  console.log('  scripts/ is clean — verify:quick is a legitimate target for this change')
}

const before = baselineDigest()
console.log(`  golden baseline: ${before.count} files, ${before.digest.slice(0, 12)} — must be untouched at the end`)

const results = []
const outputs = new Map()
let failed = 0

for (const step of selected) {
  console.log('')
  rule('━')
  console.log(`▶ ${step.name}`)
  console.log(`  ${step.what}`)
  rule('━')
  const r = run(step.argv)
  process.stdout.write(r.out.endsWith('\n') || r.out === '' ? r.out : `${r.out}\n`)
  outputs.set(step.name, r.out)

  let problem = step.gate ? step.gate(r) : null
  if (!problem && step.reproducibilityOf) {
    if (r.code !== 0) problem = `exited ${r.code}`
    else if (outputs.get(step.reproducibilityOf) !== r.out)
      problem =
        `output differs from the first \`${step.reproducibilityOf}\` run over an unchanged tree. Two green runs that ` +
        `disagree is non-determinism — check /ID and creation-date pinning in src/report/, and whether a baseline is ` +
        `churning against itself.`
  }
  if (problem) failed++
  results.push({ name: step.name, ok: !problem, problem, note: problem ?? (step.summarise?.(r) || 'ok') })
}

// ── the baseline must not have moved ────────────────────────────────────────
const after = baselineDigest()
const baselineMoved = []
if (after.digest !== before.digest) {
  for (const [rel, d] of after.files) if (before.files.get(rel) !== d) baselineMoved.push(before.files.has(rel) ? `changed ${rel}` : `added ${rel}`)
  for (const rel of before.files.keys()) if (!after.files.has(rel)) baselineMoved.push(`removed ${rel}`)
}

console.log('')
rule('━')
console.log('verify summary')
rule('━')
const W = Math.max(...results.map((r) => r.name.length), 'golden baseline'.length) + 2
for (const r of results) console.log(`  ${(r.ok ? 'PASS' : 'FAIL').padEnd(6)} ${r.name.padEnd(W)} ${r.note}`)
console.log(
  `  ${(baselineMoved.length === 0 ? 'PASS' : 'FAIL').padEnd(6)} ${'golden baseline'.padEnd(W)}` +
    (baselineMoved.length === 0
      ? `${before.count} files unchanged (${before.digest.slice(0, 12)}) — verification wrote nothing`
      : `${baselineMoved.length} file(s) rewritten BY THE VERIFICATION ITSELF`),
)
for (const m of baselineMoved) console.log(`           ${m}`)

/*
 * The skipped step is printed IN THE SUMMARY MATRIX, not above it and not in a
 * footnote. A reader scanning a column of PASS has to meet the one thing that did
 * not run in the same column, or the matrix reads as eight-for-eight.
 */
for (const s of skipped) {
  console.log(`  ${'SKIP'.padEnd(6)} ${s.name.padEnd(W)} not run by verify:quick`)
  console.log(`           ${s.skippedByQuick}`)
  console.log('           REFUSAL: this target exits 2 if `git status --porcelain` reports any change')
  console.log('           under scripts/, or if that cannot be established — so it cannot be the wrong')
  console.log('           tool for the change class the skipped step covers. scripts/ was clean.')
}

console.log('')
console.log('  WHAT THIS DOES NOT COVER — state it in the report, do not let a green matrix imply it:')
console.log('    · no React component is rendered and nothing is clicked; drive:dashboards calls exported')
console.log('      scoring functions and PRINTS — a human still has to read that table')
console.log('    · zero baseline movement is not evidence for a component, a fallback branch or a dashboard')
console.log('    · compare regenerates from FROZEN fixtures for BAIW/TAIW/HAIW; a live-dataset drift shows')
console.log('      up under `source datasets`, never in the raw bytes')
console.log('    · scripts/golden/raw/ is scratch. Never read it to verify a change — it goes stale the')
console.log('      moment a generator moves and will compare old against old')

const bad = failed + (baselineMoved.length ? 1 : 0)
console.log('')
if (bad === 0) {
  console.log(`  OK — ${results.length} steps passed, golden baseline untouched.`)
  if (QUICK) {
    /*
     * Said plainly, at the end, where the reader stops. Hard rule 11 is
     * conditional — quick is sufficient for routes, components, navItems and docs
     * — but "sufficient for this change" and "the stage-closing run" are different
     * claims, and only the second one is what `npm run verify` makes.
     */
    console.log(`  ${STEPS.length - selected.length} step skipped: ${skipped.map((s) => s.name).join(', ')}.`)
    console.log('')
    console.log('  THIS IS NOT A STAGE-CLOSING RUN.')
    console.log('  Sufficient for routes, components, navItems and docs (CLAUDE.md, hard rule 11).')
    console.log('  If the change moves a baseline or touches a generator, a dataset or a rule file,')
    console.log('  `npm run verify` is required and this output does not substitute for it.')
  } else {
    console.log('  Paste this output. A stage is not complete without it (CLAUDE.md, hard rule 11).')
  }
} else {
  console.log(`  ${bad} step(s) failed. The stage is not complete.`)
}
process.exit(bad === 0 ? 0 : 1)
