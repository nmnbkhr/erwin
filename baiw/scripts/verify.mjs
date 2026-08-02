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
 *   npm run verify              # every step
 *   npm run verify --           # same; extra args are ignored
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
console.log('erwin closing verification — npm run verify')
console.log(`  root: ${ROOT}`)
console.log('  every child runs with cwd=baiw/, so this is safe to invoke from anywhere')

const before = baselineDigest()
console.log(`  golden baseline: ${before.count} files, ${before.digest.slice(0, 12)} — must be untouched at the end`)

const results = []
const outputs = new Map()
let failed = 0

for (const step of STEPS) {
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
  console.log('  Paste this output. A stage is not complete without it (CLAUDE.md, hard rule 11).')
} else {
  console.log(`  ${bad} step(s) failed. The stage is not complete.`)
}
process.exit(bad === 0 ? 0 : 1)
