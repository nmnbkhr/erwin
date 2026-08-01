#!/usr/bin/env node
/**
 * Capture golden baselines for the suite's report generators.
 *
 *   node scripts/golden/capture.mjs [--module baiw|taiw|haiw|dgiw] [--accept]
 *
 * Writes scripts/golden/baseline/<module>/<artefact>.json — committed, diffable,
 * reviewable in git, which raw PDFs are not. Also drops the raw artefacts in
 * scripts/golden/raw/ for eyeballing; that directory is gitignored.
 *
 * ─── --accept, AND WHY IT IS REQUIRED ──────────────────────────────────────
 *
 * The reviewable record is the baseline. Overwriting it is how a change stops
 * being reviewable — the diff a walk was supposed to read is gone, replaced by
 * the thing it was supposed to be read against, and nothing anywhere says it
 * happened. The old header said "re-capturing without reading the diff first
 * defeats the entire exercise", which was true and was enforced by nothing but
 * the reader's attention. It got away from a careful operator on 2026-08-01, and
 * only an md5 snapshot taken beforehand showed that nothing had in fact moved.
 *
 * So the tool refuses instead. If a recapture would CHANGE, ADD or ORPHAN any
 * baseline, capture prints exactly what would move, writes NO baseline, and
 * exits 1. Passing --accept writes them. The walk is still the human's job; what
 * changed is that freezing an unwalked diff now takes a deliberate flag.
 *
 * NEW and ORPHANED are gated alongside CHANGED, not waved through. A renamed
 * generator shows up as one of each, and that pair is exactly the case where a
 * silent write loses the only record of what the old output was.
 *
 * raw/ is refreshed either way. It is gitignored and regenerable, and having it
 * hold the NEW output while baseline/ still holds the old is precisely the state
 * a walk wants. compare.mjs regenerates rather than reading raw/, so a refused
 * capture leaves it able to show you the same diff again.
 *
 * This script is NOT part of `npm run build`, on purpose. It is a review tool.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  pinEnvironment, environmentStamp, environmentVars, parseArgs, createDriver, analyse,
  assertNonEmpty, stableStringify, stableJson, baselinePath, BASELINE_DIR, RAW_DIR,
  REGISTRY, MODULES, datasetFingerprint,
} from './harness.mjs'

pinEnvironment()

const USAGE = `
capture.mjs — write golden baselines for the suite's report generators

  node scripts/golden/capture.mjs                    all modules (dry run)
  node scripts/golden/capture.mjs --module taiw      one module
  node scripts/golden/capture.mjs --accept           write the baselines

Writes scripts/golden/baseline/<module>/<artefact>.json (commit these) and
scripts/golden/raw/<module>/<filename> (gitignored, for eyeballing).

WITHOUT --accept this is a dry run for the baselines: if any would change, be
added or be orphaned, it names them and exits 1 without writing. Read the
difference with compare.mjs and walk.mjs first — that is what the baselines are
for. raw/ is refreshed either way.
`.trim()

// `--accept` is local to this script; strip it before the shared parser, which
// throws on arguments it does not know rather than ignoring them.
const argv = process.argv.slice(2)
let accept = false
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--accept') { accept = true; argv.splice(i, 1); i-- }
}
const args = parseArgs(argv)
if (args.help) { console.log(USAGE); process.exit(0) }

const env = environmentStamp()
console.log('golden capture')
console.log(`  node ${process.version}  TZ=${env.tz}  locale=${env.icuLocale}  icuTimeZone=${env.icuTimeZone}`)
console.log(`  env vars: ${stableJson(environmentVars())}`)
console.log(`  modules: ${args.modules.join(', ')}`)
console.log()

/**
 * Which top-level fields of a baseline record moved, for the refusal report.
 *
 * Shallow on purpose. The point is to tell you WHAT to go and walk — a page
 * count, a glyph count, a content hash — not to reproduce compare.mjs, which
 * exists to classify the difference properly and is the next thing to run.
 */
const fieldDiff = (before, after) => {
  let a, b
  try { a = JSON.parse(before); b = JSON.parse(after) } catch { return ['(baseline is not readable as JSON)'] }
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  const out = []
  for (const k of keys) {
    const av = JSON.stringify(a[k])
    const bv = JSON.stringify(b[k])
    if (av === bv) continue
    const brief = (v) => (v === undefined ? '(absent)' : v.length > 42 ? `${v.slice(0, 42)}…` : v)
    out.push(`${k}: ${brief(av)} -> ${brief(bv)}`)
  }
  return out
}

const driver = await createDriver(args.modules)
/** Everything a write would produce, collected before any baseline is touched. */
const planned = []

try {
  for (const module of args.modules) {
    const expected = REGISTRY[module].artefacts.length
    const artefacts = await driver.generate(module)
    if (artefacts.length !== expected) {
      throw new Error(`${module}: expected ${expected} artefacts, generated ${artefacts.length}`)
    }

    const rawDir = path.join(RAW_DIR, module)
    rmSync(rawDir, { recursive: true, force: true })
    mkdirSync(rawDir, { recursive: true })

    for (const artefact of artefacts) {
      const analysis = analyse(artefact, driver.ruler)
      // Refuse to write a baseline that would pass vacuously.
      assertNonEmpty(`${module}/${analysis.artefact}`, analysis)

      // capturedWith is the EFFECTIVE environment and IS compared.
      // capturedEnvVars is context for a human and is not.
      const record = {
        module,
        capturedWith: env,
        capturedEnvVars: environmentVars(),
        // DGIW reads live datasets — see datasetFingerprint's comment. null for
        // the modules whose fixtures freeze their data.
        datasets: module === 'dgiw' ? datasetFingerprint('src/dgiw/data') : null,
        ...analysis,
      }
      const target = baselinePath(module, analysis.artefact)
      const json = stableStringify(record)
      const existing = existsSync(target) ? readFileSync(target, 'utf8') : null
      planned.push({
        module,
        artefact: analysis.artefact,
        target,
        json,
        status: existing === null ? 'NEW' : existing === json ? 'UNCHANGED' : 'CHANGED',
        diff: existing === null ? [] : existing === json ? [] : fieldDiff(existing, json),
      })

      // raw/ is gitignored and regenerable, so it is always refreshed: a refused
      // capture should still leave the new output on disk to look at.
      writeFileSync(path.join(rawDir, artefact.filename), artefact.bytes)

      const detail = analysis.kind === 'pdf'
        ? `${analysis.pageCount} pages · ${analysis.glyphCount} glyphs · ${analysis.tableRowsTotal} table rows`
        : analysis.kind === 'csv'
          ? `${analysis.rowCount} rows × ${analysis.columnCount} cols${analysis.unassertable.length ? ` · ${analysis.unassertable.length} unassertable cols` : ''}`
          : `${analysis.lineCount} lines · ${analysis.headingCount} headings`
      console.log(`  ${module}/${analysis.artefact}`.padEnd(38) + `${analysis.generator}`.padEnd(32) + detail)
      console.log(' '.repeat(38) + `-> ${artefact.filename}`)
    }
  }

  // If a generator's import moved, the fixture's frozen dataset would silently
  // stop being used and the baseline would describe live src/data/ instead.
  driver.assertFixtureDataWasServed()

  const expectedTotal = args.modules.reduce((n, m) => n + REGISTRY[m].artefacts.length, 0)
  if (planned.length === 0) throw new Error('capture produced zero artefacts')
  if (planned.length !== expectedTotal) throw new Error(`prepared ${planned.length} baselines, expected ${expectedTotal}`)
} finally {
  await driver.close()
}

// A baseline on disk that this run produced nothing for. Renaming a generator
// shows up as one ORPHANED plus one NEW, which is exactly the pair a silent
// write would destroy the record of.
const orphaned = []
for (const module of args.modules) {
  const dir = path.join(BASELINE_DIR, module)
  if (!existsSync(dir)) continue
  const produced = new Set(planned.filter((p) => p.module === module).map((p) => path.basename(p.target)))
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort())
    if (!produced.has(f)) orphaned.push(`${module}/${f.replace(/\.json$/, '')}`)
}

const changed = planned.filter((p) => p.status === 'CHANGED')
const added = planned.filter((p) => p.status === 'NEW')
const moving = changed.length + added.length + orphaned.length

console.log()
console.log(
  `  ${planned.length} artefact${planned.length === 1 ? '' : 's'} captured` +
    ` — ${planned.length - changed.length - added.length} unchanged, ${changed.length} changed, ${added.length} new, ${orphaned.length} orphaned`,
)

if (moving === 0) {
  console.log(`  every baseline in ${path.relative(process.cwd(), BASELINE_DIR)} already matches; nothing written`)
  if (args.modules.length !== MODULES.length)
    console.log(`  note: only ${args.modules.join(', ')} captured; other modules' baselines untouched`)
  process.exit(0)
}

for (const p of changed) {
  console.log(`\n  CHANGED  ${p.module}/${p.artefact}`)
  for (const d of p.diff.slice(0, 8)) console.log(`             ${d}`)
  if (p.diff.length > 8) console.log(`             … and ${p.diff.length - 8} more field(s)`)
}
for (const p of added) console.log(`\n  NEW      ${p.module}/${p.artefact}  (no baseline on disk)`)
for (const o of orphaned) console.log(`\n  ORPHANED ${o}  (baseline on disk, this run produced no such artefact)`)

if (!accept) {
  console.error(
    `\n  REFUSED — ${moving} baseline${moving === 1 ? '' : 's'} would move and nothing was written.\n` +
    `  The baseline is the reviewable record of what these generators produce. Overwriting\n` +
    `  it before reading the difference is how a change stops being reviewable.\n\n` +
    `    node scripts/golden/compare.mjs                 classify what moved\n` +
    `    node scripts/golden/walk.mjs --module <mod>      reconcile it page by page\n` +
    `    node scripts/golden/capture.mjs --accept         freeze it, once you have decided\n\n` +
    `  raw/ has been refreshed, so the new output is on disk to look at.`,
  )
  process.exit(1)
}

mkdirSync(BASELINE_DIR, { recursive: true })
for (const module of args.modules) mkdirSync(path.join(BASELINE_DIR, module), { recursive: true })
// Only what actually moved: rewriting identical files churns mtimes for nothing.
for (const p of [...changed, ...added]) writeFileSync(p.target, p.json)

console.log(`\n  --accept: ${changed.length + added.length} baseline${changed.length + added.length === 1 ? '' : 's'} written to ${path.relative(process.cwd(), BASELINE_DIR)}`)
if (orphaned.length)
  console.log(`  ${orphaned.length} orphaned baseline${orphaned.length === 1 ? '' : 's'} left in place — delete deliberately, they are the only record of a generator that stopped producing`)
if (args.modules.length !== MODULES.length)
  console.log(`  note: only ${args.modules.join(', ')} captured; other modules' baselines untouched`)
