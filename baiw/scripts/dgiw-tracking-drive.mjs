#!/usr/bin/env node
/**
 * Drive the REAL compiled tracking primitives and assert G5's append-only
 * contract — checkpoint 2's verification, committed because harnesses built
 * in a scratchpad have been lost to wipes before.
 *
 *   node scripts/dgiw-tracking-drive.mjs
 *
 * What it asserts, per G5 non-negotiables 1-2:
 *
 *  - transitions APPEND: a regression (delivered -> in-progress) keeps both
 *    entries; nothing is edited or deleted; the input log is untouched
 *  - currentState reads the LAST entry, and an artefact with no history is
 *    null — "not tracked", never a defaulted 'planned'
 *  - the period filter honours its boundaries inclusively, and an empty
 *    boundary is unbounded on that side
 *  - malformed stored shapes are REJECTED by the guards, not crashed on
 *  - the module exports no function that can rewrite history
 *  - every authored KPI id in the plan is unique (the KPI-ID gate holds this
 *    on every build; shown here against the live dataset)
 *
 * Compiles src/ through the same esbuild loader the gate uses. NOT a gate.
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
  log: 'src/dgiw/tracking/log.ts',
})
if (error) {
  console.error(`esbuild load failed: ${error}`)
  process.exit(1)
}
const m = modules.log
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dgiw/data/implementationPlan.json'), 'utf8'))

console.log('\nTracking drive — the real compiled tracking/log.ts\n')

console.log('— append-only: a regression keeps both entries')
const t1 = { to: 'delivered', at: '2026-08-01T10:00:00.000Z' }
const t2 = { to: 'in-progress', at: '2026-08-03T09:00:00.000Z', note: 'client rejected the draft' }
const log0 = {}
const log1 = m.appendTransition(log0, 'AR-13', t1)
const log2 = m.appendTransition(log1, 'AR-13', t2)
check(log2['AR-13'].length === 2, 'the regression is a SECOND entry, not a correction', log2['AR-13'].map((x) => x.to).join(' -> '))
check(log2['AR-13'][0].to === 'delivered' && log2['AR-13'][0].at === t1.at, 'the first entry survives verbatim')
check(log2['AR-13'][1].note === 'client rejected the draft', 'the regression carries its note')
check(Object.keys(log0).length === 0 && log1['AR-13'].length === 1, 'the input logs are untouched — a caller holding the old value holds the old record')

console.log('— currentState reads the last entry; no history is null, never planned')
check(m.currentState(log2, 'AR-13') === 'in-progress', 'currentState is the LAST transition')
check(m.currentState(log2, 'AR-27') === null, 'an untracked artefact is null — "not tracked" is a fact, not a default')

console.log('— state counts carry their denominator')
const sc = m.stateCounts(log2, ['AR-13', 'AR-27', 'AR-23'])
check(sc.counts['in-progress'] === 1 && sc.tracked === 1 && sc.untracked === 2,
  'counts + tracked + untracked partition the id list', JSON.stringify(sc.counts))

console.log('— the period filter honours boundaries, inclusive both ends')
const period = { label: 'August cycle 1', from: '2026-08-01', to: '2026-08-03' }
const log3 = m.appendTransition(log2, 'AR-23', { to: 'planned', at: '2026-07-31T23:59:59.000Z' })
const log4 = m.appendTransition(log3, 'AR-23', { to: 'in-progress', at: '2026-08-04T00:00:01.000Z' })
const inP = m.transitionsInPeriod(log4, period)
check(inP.length === 2 && inP.every((x) => x.artefactId === 'AR-13'),
  'boundary entries either side are excluded; the two in-period transitions survive', `${inP.length} in period`)
check(m.inPeriod('2026-08-01T00:00:00.000Z', period) && m.inPeriod('2026-08-03T23:00:00.000Z', period),
  'both boundary DATES are inclusive')
check(m.inPeriod('2026-01-01T00:00:00.000Z', { label: 'open', from: '', to: '' }),
  'an empty boundary is unbounded on that side')
const captures = [
  { kpiId: 'K-W0-01', value: '58 of 76', capturedAt: '2026-08-02T12:00:00.000Z', source: 'CDE register v3' },
  { kpiId: 'K-W0-02', value: '71%', capturedAt: '2026-08-09T12:00:00.000Z', source: 'steward letters' },
]
check(m.capturesInPeriod(captures, period).length === 1, 'KPI captures filter by the same period rule')

console.log('— malformed stored shapes are rejected, not crashed on')
check(m.isStatusLog({}) && m.isStatusLog(log4), 'the real shapes validate')
check(!m.isStatusLog({ 'AR-13': [{ to: 'done', at: 'x' }] }), 'an unknown state is rejected')
check(!m.isStatusLog({ 'AR-13': { to: 'planned', at: 'x' } }), 'a non-array history is rejected')
check(!m.isStatusLog(null) && !m.isStatusLog([1]), 'null and arrays are rejected')
check(m.isKpiLog([]) && m.isKpiLog(captures), 'the real capture shapes validate')
check(!m.isKpiLog([{ kpiId: 'K-W0-01', value: 3, capturedAt: 'x', source: 's' }]),
  'a numeric value is rejected — captured means a string a person typed')
check(!m.isKpiLog([{ kpiId: '', value: '3', capturedAt: 'x', source: 's' }]), 'an empty kpiId is rejected')
check(m.isReportingPeriod(period) && !m.isReportingPeriod({ label: 'x' }), 'the period guard holds')

console.log('— no rewrite path exists in the module surface')
const mutators = Object.keys(m).filter((k) => typeof m[k] === 'function' && /edit|remove|delete|update|rewrite|clear|set[A-Z]/.test(k))
check(mutators.length === 0, 'no exported function names an edit path', mutators.join(', ') || 'appends and reads only')

console.log('— authored KPI ids: unique across the plan (KPI-ID gates this)')
const ids = PLAN.waves.flatMap((w) => w.kpis.map((k) => k.id))
check(ids.length === new Set(ids).size && ids.every((id) => /^K-W\d-\d\d$/.test(id)),
  `${ids.length} KPI ids, all unique, all K-W#-## shaped`)

console.log(failures === 0 ? '\n  OK — append-only, last-entry reads, period boundaries and the guards hold on the real module' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
