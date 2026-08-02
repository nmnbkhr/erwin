#!/usr/bin/env node
/**
 * The suite quality gate.
 *
 * This was `check-dgiw.mjs`, and the name stopped being true some time in Phase
 * D. Four of its classes — REPORT-SOURCES, CSV-HEADER, TEXT-MAXWIDTH and
 * ARTEFACT-IMPL — read the report code of every module in the suite, and the
 * three module generators most likely to forget a content digest were being
 * governed by a file whose name said it had nothing to do with them.
 *
 * Structure:
 *
 *   check.mjs                 this file — registry, run order, report, exit
 *   check/modules/index.mjs   THE REGISTRY: an ordered list of rule files
 *   check/modules/<id>.mjs    one module's datasets, report sources, artefact
 *                             ids and checks
 *   check/suite/*.mjs         the four classes that read every module's code
 *   check/lib/*.mjs           collector, assertions, AST helpers, esbuild loader
 *   check/selftest.mjs        fault injection: every code, tripped on a copy
 *
 * Run with `npm run check`. `npm run check:dgiw` is the same full run under the
 * old name. Wired into `npm run build`.
 *
 * ─── THREE THINGS THIS FILE EXISTS TO PREVENT ──────────────────────────────
 *
 * 1. A CHECK THAT STOPPED RUNNING. Every check returns how many units it
 *    examined, and examining zero while reporting nothing FAILS as VACUOUS. A
 *    green build over an empty set is the failure mode this repo has shipped
 *    thirteen times, and it is invisible in every other respect: the class line
 *    still prints, the verdict still reads clean. A check that legitimately runs
 *    over nothing declares `mayBeEmpty` with a stated reason.
 *
 * 2. A MODULE THAT DROPPED OUT. The REGISTRY line prints every registered module
 *    and its check count on every build, so a module that quietly went to zero is
 *    visible rather than absent. An empty registry, or one whose import failed,
 *    FAILS — it would otherwise print `0 entries, 0 checks` and exit 0.
 *
 * 3. A SCOPE THAT NARROWED. REPORT-SOURCES resolves the declared source set and
 *    fails on every path where a location contributes nothing. The three classes
 *    that read source are only ever as wide as that number, which is why it is
 *    printed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Fails } from './check/lib/fails.mjs'
import { loadDatasets } from './check/lib/json.mjs'
import { loadTsModules } from './check/lib/esbuild-load.mjs'

import reportSourcesCheck from './check/suite/report-sources.mjs'
import csvHeaderCheck from './check/suite/csv-header.mjs'
import textMaxWidthCheck from './check/suite/text-maxwidth.mjs'
import artefactImplCheck from './check/suite/artefact-impl.mjs'
import fingerprintCoverageCheck from './check/suite/fingerprint-coverage.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
/** The real repo. esbuild output must land under its node_modules — see esbuild-load.mjs. */
const REPO = path.resolve(HERE, '..')

/**
 * Declared run order for the suite classes. REPORT-SOURCES is first by
 * dependency, not by taste: the other three read the file set it resolves.
 */
const SUITE_CHECKS = [reportSourcesCheck, csvHeaderCheck, textMaxWidthCheck, artefactImplCheck, fingerprintCoverageCheck]

// ── arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
let root = REPO
let onlyModule = null
const take = (i) => argv[i + 1]

for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--help' || a === '-h') {
    console.log(`Usage: node scripts/check.mjs [--root <dir>] [--module <id>]

  --root <dir>    directory containing src/ to check. Defaults to the repo.
                  Used by check/selftest.mjs to run against a mutated copy;
                  no tracked file is ever written by this script.
  --module <id>   run only one registry entry. Narrows which CHECKS run, never
                  which datasets are read — an entry's datasets can be shared.
                  AN ITERATION AID, NOT A GATE:
                  it narrows the declared source set too, so it checks strictly
                  less than \`npm run check\`. Unknown ids fail.`)
    process.exit(0)
  } else if (a === '--root') { root = path.resolve(take(i)); i++ }
  else if (a.startsWith('--root=')) root = path.resolve(a.slice(7))
  else if (a === '--module') { onlyModule = take(i); i++ }
  else if (a.startsWith('--module=')) onlyModule = a.slice(9)
  else {
    console.error(`check.mjs: unknown argument ${JSON.stringify(a)}. Try --help.`)
    process.exit(2)
  }
}
if (!fs.existsSync(path.join(root, 'src'))) {
  console.error(`check.mjs: --root ${root} contains no src/ — nothing to check.`)
  process.exit(2)
}

const fails = new Fails()
const rawFail = fails.bind()

// ── the registry ────────────────────────────────────────────────────────────
// An import failure here is fatal and must say so. A registry that failed to load
// would otherwise leave `modules` empty, print `0 entries, 0 checks`, run the four
// suite classes over an empty source set and exit 0 — a completely green build
// that checked nothing at all.
let registry
try {
  registry = (await import('./check/modules/index.mjs')).default
} catch (err) {
  console.error('erwin suite check\n')
  console.error('1 problem:')
  console.error(`  REGISTRY: check/modules/index.mjs could not be imported, so NO check ran: ${err?.message ?? err}`)
  process.exit(1)
}

if (!Array.isArray(registry) || registry.length === 0) {
  rawFail('REGISTRY', `check/modules/index.mjs exports ${Array.isArray(registry) ? 'an empty array' : typeof registry} — with no registry entries every suite class would pass over an empty set and the build would report green having checked nothing`)
  registry = []
}

const seenIds = new Set()
for (const [i, mod] of registry.entries()) {
  if (!mod || typeof mod.id !== 'string' || !mod.id)
    rawFail('REGISTRY', `registry entry ${i} has no id — it cannot be named in a finding or filtered on`)
  else if (seenIds.has(mod.id)) rawFail('REGISTRY', `two registry entries share the id ${JSON.stringify(mod.id)}`)
  else seenIds.add(mod.id)
  if (mod && !Array.isArray(mod.checks))
    rawFail('REGISTRY', `registry entry ${mod?.id ?? i} has no checks array — declare \`checks: []\` to state that it has none`)
}

let modules = registry.filter((m) => m && typeof m.id === 'string' && Array.isArray(m.checks))
if (onlyModule !== null) {
  if (!modules.some((m) => m.id === onlyModule)) {
    console.error(`check.mjs: --module ${JSON.stringify(onlyModule)} is not a registered module. Registered: ${modules.map((m) => m.id).join(', ')}`)
    process.exit(2)
  }
  modules = modules.filter((m) => m.id === onlyModule)
}

// ── datasets, and the two artefact id namespaces ────────────────────────────
//
// TWO PASSES, AND DATASETS LOAD FOR EVERY REGISTRY ENTRY — including ones
// `--module` excluded from running.
//
// D5 stage B made a dataset SHARED for the first time: `frameworks.json` moved to
// `src/frameworks/data/` and is declared by `_spine`, because DMBOK2, DCAM and
// COBIT belong to the suite rather than to DGIW. DGIW's crosswalk classes read it
// through `ctx.shared`. Two consequences, both handled here rather than left to
// luck:
//
//   - LOADING IS UNFILTERED. `--module dgiw` narrows which CHECKS run, never
//     which inputs are read. If it narrowed inputs, DGIW's crosswalk classes
//     would find `_spine`'s dataset missing and throw, and a filtered run would
//     fail for a reason that has nothing to do with the module.
//   - PREPARE RUNS IN ITS OWN PASS. A single loop would make one entry's access
//     to another's data depend on registry order, which is declared for the
//     printed order of findings and was never meant to carry a load dependency.
const perModule = new Map()
const loadable = registry.filter((m) => m && typeof m.id === 'string' && Array.isArray(m.checks))
for (const mod of loadable) {
  const { data, files } = loadDatasets(root, mod, rawFail)
  perModule.set(mod.id, { mod, data, state: {}, files, results: {}, ran: [] })
}

/** Another entry's datasets, by registry id. `{}` if it declares none. */
const sharedData = (id) => perModule.get(id)?.data ?? {}

for (const mod of loadable) {
  if (!mod.prepare) continue
  const entry = perModule.get(mod.id)
  try {
    entry.state = mod.prepare(entry.data, sharedData) ?? {}
  } catch (err) {
    // Every check in this module will now throw and report under its own code,
    // which is the outcome we want: attributable, and loud.
    rawFail('REGISTRY', `module ${mod.id} could not derive its indexes from its datasets: ${err?.message ?? err}`)
  }
}

/** id -> the module whose register catalogues it. */
const artefactRegister = new Map()
/** id -> the module whose rule file declares it. */
const moduleArtefactIds = new Map()
for (const mod of modules) {
  const entry = perModule.get(mod.id)
  if (mod.artefactRegister) {
    try {
      for (const id of mod.artefactRegister(entry.data) ?? []) artefactRegister.set(id, mod.id)
    } catch (err) {
      rawFail('REGISTRY', `module ${mod.id} declares an artefactRegister that could not be read: ${err?.message ?? err}`)
    }
  }
  for (const id of mod.artefactIds ?? []) {
    if (moduleArtefactIds.has(id))
      rawFail('REGISTRY', `artefact id ${JSON.stringify(id)} is declared by both modules/${moduleArtefactIds.get(id)}.mjs and modules/${mod.id}.mjs`)
    else moduleArtefactIds.set(id, mod.id)
  }
}

// ── compile what the module rule files ask for ──────────────────────────────
// A failure is recorded, not thrown, and every class that depends on the load
// reports it under its OWN name. One esbuild failure used to disable two DGIW
// classes while only PROJECTION-INVARIANT said so.
for (const mod of modules) {
  const entry = perModule.get(mod.id)
  const specs = mod.tsModules ?? {}
  if (Object.keys(specs).length === 0) continue
  const { modules: loaded, error } = await loadTsModules(REPO, root, specs)
  entry.ts = loaded
  entry.tsLoadError = error
}

// ── the runner ──────────────────────────────────────────────────────────────
const runCheck = (check, ctx, owner) => {
  const code = check.code ?? '(unnamed)'
  ctx.fail = fails.bindTo(code)
  ctx.failAs = rawFail
  const before = fails.mark()
  let res = {}
  try {
    res = check.run(ctx) ?? {}
  } catch (err) {
    const trace = String(err?.stack ?? err).split('\n').slice(0, 3).map((s) => s.trim()).join(' | ')
    fails.add(code, `the check threw while running over ${owner} and produced no verdict — this is unchecked, not passing: ${trace}`)
  }
  const emitted = fails.mark() - before
  const examined = res.examined

  // The anti-vacuity rule. A check that examined nothing and said nothing is
  // indistinguishable, in every printed line, from one that examined everything
  // and found it clean.
  if (typeof examined !== 'number' || !Number.isFinite(examined)) {
    fails.add('VACUOUS', `${code} (${owner}) returned no examined count — the runner cannot tell whether it ran over anything, so it cannot be trusted to have run`)
  } else if (examined === 0 && emitted === 0) {
    if (check.mayBeEmpty === undefined)
      fails.add('VACUOUS', `${code} (${owner}) examined 0 units and reported nothing — a check passing over an empty set prints exactly like one passing over a real set. Either its input moved, or it genuinely may run over nothing, in which case declare \`mayBeEmpty: '<reason>'\` on the check`)
    else if (typeof check.mayBeEmpty !== 'string' || check.mayBeEmpty.trim() === '')
      fails.add('VACUOUS', `${code} (${owner}) declares mayBeEmpty without a stated reason — if a check can legitimately run over nothing, someone should have to write down why`)
  }

  ctx.results[code] = res
  return { code, examined, emitted }
}

// ── suite classes ───────────────────────────────────────────────────────────
const suiteCtx = {
  root,
  modules,
  artefactRegister,
  moduleArtefactIds,
  results: {},
  ran: [],
  sources: [],
  sourceLocations: [],
}
for (const check of SUITE_CHECKS) suiteCtx.ran.push(runCheck(check, suiteCtx, 'suite'))

// ── module classes, in registration order ───────────────────────────────────
for (const mod of modules) {
  const entry = perModule.get(mod.id)
  const ctx = {
    root,
    module: mod,
    data: entry.data,
    /** Another registry entry's datasets, by id — see the two-pass note above. */
    shared: sharedData,
    state: entry.state,
    ts: entry.ts,
    tsLoadError: entry.tsLoadError,
    sources: suiteCtx.sources,
    results: entry.results,
  }
  for (const check of mod.checks) entry.ran.push(runCheck(check, ctx, `modules/${mod.id}.mjs`))
  entry.ctx = ctx
}

// ── report ──────────────────────────────────────────────────────────────────
// The verdict on each class line is conditional on purpose: a summary line that
// reads "no comma" while the problem list below it names one is how a reader
// learns to skim past this output.
const log = (s = '') => console.log(s)
const rejected = (code) => {
  const n = fails.countOf(code)
  return n ? ` — ${n} REJECTED, see below` : ''
}
const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

log('erwin suite check')
if (onlyModule !== null)
  log(`  FILTER --module ${onlyModule} — ${registry.length - 1} of ${registry.length} registry ${plural(registry.length, 'entry', 'entries')} excluded, and the declared source set with them. This run checks strictly less than \`npm run check\`.`)

// Printed on every build so a module that quietly went to zero checks is visible
// rather than absent. This is the line that makes "it stopped running" a thing
// you can see.
const totalChecks = modules.reduce((s, m) => s + m.checks.length, 0) + SUITE_CHECKS.length
log(
  `  REGISTRY ${modules.length} ${plural(modules.length, 'entry', 'entries')}, ${totalChecks} checks` +
    ` (suite ${SUITE_CHECKS.length}, ${modules.map((m) => `${m.id} ${m.checks.length}`).join(', ')})${rejected('REGISTRY')}`,
)

const rs = suiteCtx.results['REPORT-SOURCES'] ?? {}
log(
  `  REPORT-SOURCES ${suiteCtx.sources.length} ${plural(suiteCtx.sources.length, 'file')} from ${rs.locations ?? 0} declared ${plural(rs.locations ?? 0, 'location')}` +
    ` (${suiteCtx.sourceLocations.map((l) => l.rel).join(', ') || 'none'})${fails.countOf('REPORT-SOURCES') ? ` — ${fails.countOf('REPORT-SOURCES')} UNRESOLVED, see below` : ''}`,
)

const tm = suiteCtx.results['TEXT-MAXWIDTH'] ?? {}
log(
  `  TEXT-MAXWIDTH ${tm.examined ?? 0} text() ${plural(tm.examined ?? 0, 'call')} across ${suiteCtx.sources.length} report ${plural(suiteCtx.sources.length, 'source')}` +
    ` — ${fails.countOf('TEXT-MAXWIDTH') ? `${fails.countOf('TEXT-MAXWIDTH')} REJECTED, see below` : 'no maxWidth option, which discards every line after the first'}`,
)

const ch = suiteCtx.results['CSV-HEADER'] ?? {}
const specFiles = ch.specFiles ?? []
log(
  `  CSV-HEADER ${ch.examined ?? 0} ${plural(ch.examined ?? 0, 'header')} across ${specFiles.length} spec ${plural(specFiles.length, 'file')}` +
    ` (${specFiles.join(', ') || 'none'}) — ${fails.countOf('CSV-HEADER') ? `${fails.countOf('CSV-HEADER')} REJECTED, see below` : 'no comma, quote, CR, LF or duplicate'}`,
)

// The Phase B scoreboard. Informational: printed on every build so the gap
// between what a register catalogues and what the workbench can actually produce
// stays visible instead of being rediscovered.
const ai = suiteCtx.results['ARTEFACT-IMPL'] ?? {}
const covered = ai.covered ?? []
const moduleCovered = ai.moduleCovered ?? []
log(
  `  ARTEFACT-IMPL ${covered.length} of ${artefactRegister.size} catalogued artefacts have a generator` +
    ` (${covered.join(', ') || 'none'}); ${ai.examined ?? 0} createReport ${plural(ai.examined ?? 0, 'call')} checked for a content digest` +
    `${rejected('ARTEFACT-IMPL')}`,
)
// Separate line, and separate from the "of 48" denominator on purpose: module
// reports are not catalogue entries, so folding them into that fraction would
// make the delivery scoreboard read higher than it is.
log(`    module reports ${moduleCovered.length} of ${moduleArtefactIds.size} declared ids claimed (${moduleCovered.join(', ') || 'none'})`)

// Printed on every build for the same reason REPORT-SOURCES prints its file count:
// this class can only ever be as wide as the generator set it walks, and the
// per-module `read/declared` pair is the number that says whether a dataset edit
// would be visible to that module's baselines at all. WATCH THE `read` NUMBERS —
// one falling to 0 means the traversal stopped reaching a module's data.
const fp = suiteCtx.results['FINGERPRINT-COVERAGE'] ?? {}
const fpMods = fp.perModule ?? []
log(
  `  FINGERPRINT-COVERAGE ${fp.examined ?? 0} dataset ${plural(fp.examined ?? 0, 'import')} reached transitively from the declared generators` +
    ` across ${fpMods.length} fingerprinted ${plural(fpMods.length, 'module')}` +
    ` (${fpMods.map((m) => `${m.id} ${m.imported} read/${m.declared} declared`).join(', ') || 'none'})` +
    `${fails.countOf('FINGERPRINT-COVERAGE') ? ` — ${fails.countOf('FINGERPRINT-COVERAGE')} UNDECLARED OR UNRESOLVABLE, see below` : ', every one declared'}`,
)
// Reported, never failed: over-declaring hashes a file nobody reads, which cannot
// hide a change. Under-declaring is the D-010 defect. Printed so the asymmetry
// stays a stated fact rather than an absence you would have to notice.
const over = fpMods.filter((m) => (m.overDeclared ?? []).length > 0)
log(
  `    declared but read by no generator: ${over.length ? over.map((m) => `${m.id} ${m.overDeclared.length}`).join(', ') : 'none'}` +
    ` — safe by design (parameterised content, a directory hash, a pre-emptive declaration); under-declaring is what fails`,
)

for (const mod of modules) {
  const entry = perModule.get(mod.id)
  // A module with nothing declared gets no block. It is not thereby invisible —
  // the REGISTRY line above names it with its check count, which is the whole
  // point of registering an empty module. A block per empty module would be six
  // lines saying what one line already said.
  if (mod.checks.length === 0 && !mod.summary) continue
  log(`\n  ${mod.id} — ${mod.title ?? mod.id}`)
  let lines = []
  if (mod.summary) {
    try {
      lines = mod.summary(entry.ctx) ?? []
    } catch (err) {
      rawFail('REGISTRY', `module ${mod.id} summary could not be rendered: ${err?.message ?? err}`)
    }
  }
  for (const l of lines) log(`    ${l}`)
  const empties = entry.ran.filter((r) => r.examined === 0)
  log(
    `    ${entry.ran.length} checks run over ${entry.files} ${plural(entry.files, 'dataset')}` +
      (empties.length ? ` — ${empties.length} EXAMINED NOTHING (${empties.map((e) => e.code).join(', ')})` : ', every one over a non-empty set'),
  )
}

if (fails.length) {
  console.error(`\n${fails.length} ${plural(fails.length, 'problem')}:`)
  for (const l of fails.lines()) console.error('  ' + l)
  process.exit(1)
}
log('\n  OK — all checks passed')
