#!/usr/bin/env node
/**
 * Drive the REAL compiled plan slices against hand-built assessment state and
 * assert G4's composition rules — checkpoint 1's verification, committed
 * because harnesses built in a scratchpad have been lost to wipes before.
 *
 *   node scripts/dgiw-plan-slices-drive.mjs
 *
 * What it asserts, per G4 non-negotiables 1-4:
 *
 *  - an in-scope pillar with a GapEntry → one slice; an entry-bearing pillar
 *    OUTSIDE the intake scope → no slice, and a visible exclusion with reason
 *  - the sequence honours dependsOn even when the wave list arrives shuffled
 *  - P09's slice is thin (1 catalogued deliverable) and flagged as such
 *  - the GapEntry rides by reference — a post-hoc mutation is visible through
 *    the slice, proving pass-through rather than re-derivation
 *  - no slice field carries invented effort (person-days, FTE, currency)
 *  - deliverables unmapped to any wave carry waveId null and are LISTED
 *
 * Compiles src/ through the same esbuild loader the gate uses. NOT a gate:
 * the SLICE-* classes in check/modules/dgiw.mjs hold these rules on every
 * build; this script is the human-readable drive.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadTsModules } from './check/lib/esbuild-load.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}

const { modules, error } = await loadTsModules(ROOT, ROOT, {
  slices: 'src/dgiw/plan/slices.ts',
  gap: 'src/dgiw/gap/register.ts',
  intake: 'src/dgiw/intake/types.ts',
})
if (error) {
  console.error(`esbuild load failed: ${error}`)
  process.exit(1)
}
const { planSlices, sliceExclusions, waveSequence, PLAN_ASSUMPTIONS } = modules.slices
const { gapRegister } = modules.gap
const { emptyIntake } = modules.intake
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dgiw/data/implementationPlan.json'), 'utf8'))

/* Hand-built state, quick tier, core layer: P01, P02 and P09 scored with
 * targets, so all three carry GapEntries. The intake scopes P01 + P09 only —
 * P02's entry must become an exclusion, not a slice. */
const answers = { 'DG-P01-01': 2, 'DG-P02-02': 2, 'DG-P09-01': 3 }
const targets = { P01: 4, P02: 4, P09: 4 }
const intake = (() => {
  const it = emptyIntake()
  it.org.name = 'Drive Bank'
  it.drivers.regulatory = ['BCBS 239']
  it.scope.pillarIds = ['P01', 'P09']
  return it
})()

console.log('\nPlan slices drive — the real compiled module over hand-built state\n')

const entries = gapRegister(answers, targets, 'quick', 'core', intake)
check(entries.length === 3, 'seed: three pillars carry gap entries', entries.map((e) => e.pillarId).join(', '))

console.log('— scope: a slice needs an in-scope pillar with an entry')
const slices = planSlices(entries, intake, PLAN, 'core')
const exclusions = sliceExclusions(entries, intake, PLAN, 'core')
check(slices.length === 2 && slices.some((s) => s.pillarId === 'P01') && slices.some((s) => s.pillarId === 'P09'),
  'P01 and P09 (in scope, entry-bearing) each got a slice', slices.map((s) => s.pillarId).join(', '))
const p02x = exclusions.find((x) => x.pillarId === 'P02')
check(Boolean(p02x) && p02x.reasons.some((r) => r.includes('pillar scope')),
  "P02's entry is excluded VISIBLY, naming the intake scope", p02x ? p02x.reasons[0].slice(0, 60) : 'missing')
const noIntakeSlices = planSlices(entries, null, PLAN, 'core')
const noIntakeExcl = sliceExclusions(entries, null, PLAN, 'core')
check(noIntakeSlices.length === 0 && noIntakeExcl.length === 3 && noIntakeExcl.every((x) => x.reasons.some((r) => r.includes('no actionable intake'))),
  'no actionable intake → zero slices, every entry excluded with the reason')

console.log('— sequence: dependsOn survives a shuffled wave list')
const p01 = slices.find((s) => s.pillarId === 'P01')
const shuffled = { ...PLAN, waves: [...PLAN.waves].reverse() }
const p01Shuffled = planSlices(entries, intake, shuffled, 'core').find((s) => s.pillarId === 'P01')
check(JSON.stringify(p01.sequence) === JSON.stringify(p01Shuffled.sequence),
  'the slice sequence is identical under a reversed wave array', p01.sequence.join(' -> '))
const fullSeq = waveSequence(shuffled.waves)
const pos = Object.fromEntries(fullSeq.map((id, i) => [id, i]))
const depViolations = shuffled.waves.flatMap((w) => (w.dependsOn ?? []).filter((d) => pos[d] > pos[w.id]).map((d) => `${d} after ${w.id}`))
check(depViolations.length === 0, 'every dependsOn edge points backwards in the sequence', fullSeq.join(' -> '))

console.log('— thinness is information')
const p09 = slices.find((s) => s.pillarId === 'P09')
check(p09.deliverables.length === 1 && p09.thin === true,
  "P09's register carries one deliverable and the slice is flagged thin",
  p09.deliverables.map((d) => d.artefactId).join(', '))
check(p01.thin === false, "P01's slice (many deliverables) is not flagged", `${p01.deliverables.length} deliverables`)

console.log('— pass-through, not re-derivation')
check(p01.entry === entries.find((e) => e.pillarId === 'P01'), 'the GapEntry rides by reference (===)')
const mutated = entries.find((e) => e.pillarId === 'P01')
mutated.priority.band = 'moderate'
check(p01.entry.priority.band === 'moderate', 'a post-hoc entry mutation is visible through the slice — no private copy')
mutated.priority.band = 'critical'

console.log('— wave placement is the exact-name key, nulls listed')
const placed = slices.flatMap((s) => s.deliverables).filter((d) => d.waveId !== null)
const unplaced = slices.flatMap((s) => s.deliverables).filter((d) => d.waveId === null)
check(unplaced.length > 0, 'unmapped deliverables are listed with waveId null, not dropped', `${unplaced.length} null, ${placed.length} placed`)
for (const d of placed) {
  const wave = PLAN.waves.find((w) => w.id === d.waveId)
  check(Boolean(wave) && wave.deliverables.includes(d.artefact), `placed ${d.artefactId} matches a wave deliverable string EXACTLY (${d.waveId})`)
}

console.log('— no invented effort anywhere in a slice')
const EFFORT = /\d+\s*(person-|man-|p)?days?\b|FTE|PKR|USD|\$\s*\d/i
const offending = []
const scan = (v, at) => {
  if (typeof v === 'string' && EFFORT.test(v)) offending.push(`${at}: ${v.slice(0, 50)}`)
  else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${at}[${i}]`))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${at}.${k}`)
}
slices.forEach((s, i) => scan(s, `slice[${i}]`))
check(offending.length === 0, 'no day/FTE/currency string in any slice field', offending.join('; '))
check(slices.every((s) => s.assumptions === PLAN_ASSUMPTIONS), 'every slice carries THE shared assumptions block (===)')

console.log('— determinism')
const again = planSlices(gapRegister(answers, targets, 'quick', 'core', intake), intake, PLAN, 'core')
check(JSON.stringify(again) === JSON.stringify(planSlices(gapRegister(answers, targets, 'quick', 'core', intake), intake, PLAN, 'core')),
  'two runs over the same state are identical')

console.log(failures === 0 ? '\n  OK — scope, sequence, thinness and pass-through hold on the real module' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
