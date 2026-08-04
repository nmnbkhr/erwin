#!/usr/bin/env node
/**
 * Drive the REAL compiled gap register against hand-built assessment state and
 * assert G3's pairing and priority rules — checkpoint 1's verification, kept
 * as a committed script because harnesses built in a scratchpad have been
 * lost to wipes before.
 *
 *   node scripts/dgiw-gap-register-drive.mjs
 *
 * What it asserts, per G3 non-negotiable 1 and 2:
 *
 *  - a pillar with BOTH measurements (scored at tier + target) → one GapEntry
 *  - a pillar missing its target → NO entry, listed in exclusions with the reason
 *  - a pillar not assessed at the active tier → NO entry, exclusion names the tier
 *  - a met/exceeded target → an entry with band 'met', never filtered out
 *  - a mapped driver → driverAlignment > 0 with the driver's key in driverIds;
 *    with no mapped driver → 0. Mapping is declared, never inferred.
 *  - the priority score reproduces from the entry's own printed inputs and the
 *    module's exported constants — no unexplained ranks.
 *
 * Compiles src/ through the same esbuild loader the gate uses, so what runs
 * here is what ships. NOT a gate: the GAP-* classes in check/modules/dgiw.mjs
 * hold these rules on every build; this script is the human-readable drive.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadTsModules } from './check/lib/esbuild-load.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}

const { modules, error } = await loadTsModules(ROOT, ROOT, {
  register: 'src/dgiw/gap/register.ts',
  intake: 'src/dgiw/intake/types.ts',
})
if (error) {
  console.error(`esbuild load failed: ${error}`)
  process.exit(1)
}
const { gapRegister, gapExclusions, GAIN_DECISIVENESS, GAIN_DRIVER, CRITICAL_MIN, HIGH_MIN } =
  modules.register
const { emptyIntake, driverKey } = modules.intake

/* Hand-built state, quick tier, core layer. Quick questions are one per
 * pillar (DG-P01-01, DG-P02-02, DG-P05-01 ...), so one answer scores a
 * pillar completely at this tier. */
const answers = {
  'DG-P01-01': { score: 2, evidence: 'Charter draft sighted.' }, // P01 scored 2
  'DG-P02-02': { score: 4 },                                     // P02 scored 4
  // P05 deliberately unanswered: applicable at quick, not assessed
}
const targets = { P01: 4, P02: 3, P05: 3 } // P03..P11 (bar P05): no target
const intakeMapped = (() => {
  const it = emptyIntake()
  it.org.name = 'Drive Bank'
  it.drivers.regulatory = ['BCBS 239', 'Unmapped driver']
  it.drivers.driverPillars = { [driverKey('regulatory', 0)]: ['P01'] }
  it.scope.pillarIds = ['P01']
  return it
})()

console.log('\nGap register drive — the real compiled module over hand-built state\n')

console.log('— pairing: an entry needs BOTH measurements')
const entries = gapRegister(answers, targets, 'quick', 'core', intakeMapped)
const exclusions = gapExclusions(answers, targets, 'quick', 'core')
const byId = Object.fromEntries(entries.map((e) => [e.pillarId, e]))

check(Boolean(byId.P01), 'P01 (scored 2, target 4) produced an entry')
check(Boolean(byId.P02), 'P02 (scored 4, target 3) produced an entry')
check(entries.length === 2, 'exactly two entries — nothing else has both measurements', `got ${entries.length}`)
const p3 = exclusions.find((x) => x.pillarId === 'P03')
check(Boolean(p3) && p3.reasons.some((r) => r.includes('no target set')), 'P03 (answered nothing, no target) excluded, reason names the missing target')
const p5 = exclusions.find((x) => x.pillarId === 'P05')
check(
  Boolean(p5) && p5.reasons.some((r) => r.includes('not assessed') && r.includes('Quick')),
  'P05 (target set, unanswered) excluded, reason names the tier',
  p5 ? `reasons: ${JSON.stringify(p5.reasons)}` : 'P05 missing from exclusions',
)
check(exclusions.length === 9, 'the other nine pillars are all listed, none silently dropped', `got ${exclusions.length}`)

console.log('— a met target is a finding, not a filtered row')
check(byId.P02.gap < 0, "P02's gap is negative (target 3, current 4)", `gap ${byId.P02.gap}`)
check(byId.P02.priority.band === 'met', "P02's band is 'met'", byId.P02.priority.band)
check(byId.P02.priority.score === 0, 'a met target carries priority score 0', String(byId.P02.priority.score))

console.log('— priority: derived, stated, reproducible')
const p1 = byId.P01
check(p1.gap === 2 && p1.priority.inputs.gapSize === 2, 'P01 gap = 4 - 2 = 2', `gap ${p1.gap}`)
check(
  p1.priority.inputs.driverAlignment === 1 && p1.priority.inputs.driverIds.includes('regulatory:0'),
  'the mapped driver aligns P01 (1 of 1 mapped drivers), named by key',
  JSON.stringify(p1.priority.inputs.driverIds),
)
check(p1.priority.inputs.decisiveness > 0 && p1.priority.inputs.decisiveness <= 1, 'decisiveness in (0,1]', String(p1.priority.inputs.decisiveness))
const recomputed =
  p1.priority.inputs.gapSize *
  (1 + GAIN_DECISIVENESS * p1.priority.inputs.decisiveness + GAIN_DRIVER * p1.priority.inputs.driverAlignment)
check(Math.abs(recomputed - p1.priority.score) < 1e-12, 'score reproduces from printed inputs + exported constants', `${p1.priority.score}`)
check(p1.priority.score >= CRITICAL_MIN && p1.priority.band === 'critical', 'two-level gap, aligned and decisive → critical', `${p1.priority.score.toFixed(3)} >= ${CRITICAL_MIN}`)
check(p1.evidencePresent === true && byId.P02.evidencePresent === false, 'evidencePresent reflects the answers, per pillar')
check(p1.frameworkRefs.length > 0 && p1.frameworkRefs.every((r) => r.frameworkId && r.dimensionId && r.coverageWeight > 0), 'framework refs carry the crosswalk projection', `${p1.frameworkRefs.length} refs`)

console.log('— unmapped drivers contribute nothing')
const noMap = gapRegister(answers, targets, 'quick', 'core', null)
const p1NoMap = noMap.find((e) => e.pillarId === 'P01')
check(p1NoMap.priority.inputs.driverAlignment === 0 && p1NoMap.priority.inputs.driverIds.length === 0, 'no intake → driverAlignment 0, no driver ids')
const intakeUnmapped = (() => {
  const it = emptyIntake()
  it.drivers.regulatory = ['A driver whose text mentions Governance & Operating Model']
  return it
})()
const p1Text = gapRegister(answers, targets, 'quick', 'core', intakeUnmapped).find((e) => e.pillarId === 'P01')
check(p1Text.priority.inputs.driverAlignment === 0, 'a driver NAMING a pillar in its text, unmapped, still contributes nothing — no inference')
check(p1NoMap.priority.band === 'high' && p1NoMap.priority.score >= HIGH_MIN && p1NoMap.priority.score < CRITICAL_MIN, 'without alignment the same gap bands high, not critical', `${p1NoMap.priority.score.toFixed(3)}`)

console.log('— bands: moderate reachable too')
const small = gapRegister({ 'DG-P09-01': { score: 3 } }, { P09: 4 }, 'quick', 'core', null)
const p9 = small.find((e) => e.pillarId === 'P09')
check(Boolean(p9) && p9.priority.band === 'moderate', 'one-level gap, no alignment, thin decisiveness → moderate', p9 ? `${p9.priority.score.toFixed(3)} < ${HIGH_MIN}` : 'missing')

console.log('— determinism')
const again = gapRegister(answers, targets, 'quick', 'core', intakeMapped)
check(JSON.stringify(again) === JSON.stringify(entries), 'two runs over the same state are identical')

console.log(failures === 0 ? '\n  OK — pairing, priority and exclusion rules hold on the real module' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
