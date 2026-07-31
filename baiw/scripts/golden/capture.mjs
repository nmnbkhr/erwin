#!/usr/bin/env node
/**
 * Capture golden baselines for the three pre-spine report generators.
 *
 *   node scripts/golden/capture.mjs [--module baiw|taiw|haiw]
 *
 * Writes scripts/golden/baseline/<module>/<artefact>.json — committed, diffable,
 * reviewable in git, which raw PDFs are not. Also drops the raw artefacts in
 * scripts/golden/raw/ for eyeballing; that directory is gitignored.
 *
 * Run this BEFORE D2 to fix the current behaviour, and again AFTER D2 only when
 * you have reviewed compare.mjs's report and decided the new output is correct.
 * Re-capturing without reading the diff first defeats the entire exercise.
 *
 * This script is NOT part of `npm run build`, on purpose. It is a review tool.
 */

import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import {
  pinEnvironment, environmentStamp, environmentVars, parseArgs, createDriver, analyse,
  assertNonEmpty, stableStringify, stableJson, baselinePath, BASELINE_DIR, RAW_DIR,
  REGISTRY, MODULES,
} from './harness.mjs'

pinEnvironment()

const USAGE = `
capture.mjs — write golden baselines for the pre-spine report generators

  node scripts/golden/capture.mjs                    all three modules
  node scripts/golden/capture.mjs --module taiw      one module

Writes scripts/golden/baseline/<module>/<artefact>.json (commit these) and
scripts/golden/raw/<module>/<filename> (gitignored, for eyeballing).
`.trim()

const args = parseArgs(process.argv.slice(2))
if (args.help) { console.log(USAGE); process.exit(0) }

const env = environmentStamp()
console.log('golden capture')
console.log(`  node ${process.version}  TZ=${env.tz}  locale=${env.icuLocale}  icuTimeZone=${env.icuTimeZone}`)
console.log(`  env vars: ${stableJson(environmentVars())}`)
console.log(`  modules: ${args.modules.join(', ')}`)
console.log()

const driver = await createDriver(args.modules)
let written = 0

try {
  for (const module of args.modules) {
    const expected = REGISTRY[module].artefacts.length
    const artefacts = await driver.generate(module)
    if (artefacts.length !== expected) {
      throw new Error(`${module}: expected ${expected} artefacts, generated ${artefacts.length}`)
    }

    mkdirSync(path.join(BASELINE_DIR, module), { recursive: true })
    const rawDir = path.join(RAW_DIR, module)
    rmSync(rawDir, { recursive: true, force: true })
    mkdirSync(rawDir, { recursive: true })

    for (const artefact of artefacts) {
      const analysis = analyse(artefact, driver.ruler)
      // Refuse to write a baseline that would pass vacuously.
      assertNonEmpty(`${module}/${analysis.artefact}`, analysis)

      // capturedWith is the EFFECTIVE environment and IS compared.
      // capturedEnvVars is context for a human and is not.
      const record = { module, capturedWith: env, capturedEnvVars: environmentVars(), ...analysis }
      writeFileSync(baselinePath(module, analysis.artefact), stableStringify(record))
      writeFileSync(path.join(rawDir, artefact.filename), artefact.bytes)
      written++

      const detail = analysis.kind === 'pdf'
        ? `${analysis.pageCount} pages · ${analysis.glyphCount} glyphs · ${analysis.tableRowsTotal} table rows`
        : analysis.kind === 'csv'
          ? `${analysis.rowCount} rows × ${analysis.columnCount} cols${analysis.unassertable.length ? ` · ${analysis.unassertable.length} unassertable cols` : ''}`
          : `${analysis.lineCount} lines · ${analysis.headingCount} headings`
      console.log(`  ${module}/${analysis.artefact}`.padEnd(26) + `${analysis.generator}`.padEnd(30) + detail)
      console.log(' '.repeat(26) + `-> ${artefact.filename}`)
    }
  }

  // If a generator's import moved, the fixture's frozen dataset would silently
  // stop being used and the baseline would describe live src/data/ instead.
  driver.assertFixtureDataWasServed()

  const expectedTotal = args.modules.reduce((n, m) => n + REGISTRY[m].artefacts.length, 0)
  if (written === 0) throw new Error('capture produced zero artefacts')
  if (written !== expectedTotal) throw new Error(`wrote ${written} baselines, expected ${expectedTotal}`)

  console.log()
  console.log(`  ${written} baseline${written === 1 ? '' : 's'} written to ${path.relative(process.cwd(), BASELINE_DIR)}`)
  if (args.modules.length !== MODULES.length) {
    console.log(`  note: only ${args.modules.join(', ')} recaptured; other modules' baselines untouched`)
  }
} finally {
  await driver.close()
}
