#!/usr/bin/env node
/**
 * G6 verification driver — the snapshot store's freeze contract and the delta
 * engine's comparability rules, demonstrated against the REAL compiled
 * modules rather than a description of them.
 *
 *   node scripts/trajectory-drive.mjs
 *
 * In dashboard-drive.mjs's style: committed, runnable by hand, exit 1 on any
 * failed assertion. It compiles src/dgiw/trajectory/*.ts with the same
 * esbuild-load the gate uses, so what runs here is what ships. The
 * SNAPSHOT-FROZEN / DELTA-* gates hold the same facts on every build; this
 * driver is the checkpoint-level demonstration with its output shown, and it
 * stays useful the day someone wants to watch the contract rather than trust
 * the gate's one-line verdict.
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
  snapshots: 'src/dgiw/trajectory/snapshots.ts',
  engagement: 'src/engagement/types.ts',
})
if (!modules) {
  console.error(`could not compile the trajectory modules: ${error}`)
  process.exit(1)
}
const S = modules.snapshots

// The delta engine is CP2's module — loaded separately so the CP1 proofs can
// run (and be shown) before it exists, without pretending it was checked.
const deltasLoad = await loadTsModules(ROOT, ROOT, { deltas: 'src/dgiw/trajectory/deltas.ts' })
if (deltasLoad.modules) modules.deltas = deltasLoad.modules.deltas

/* ── CP1: the snapshot store ──────────────────────────────────────────── */

console.log('\n— CP1: a snapshot is frozen, deliberate, and digest-stable\n')

// A seeded live state, in the LEGACY numeric shape on purpose: capture must
// normalise, so a legacy map and its rich lift digest identically.
const live = {
  answers: { 'DG-P01-01': 4, 'DG-P02-01': { score: 2, evidence: 'Charter sighted.' } },
  targets: { P01: 4, P02: 3 },
  tier: 'standard',
  layer: 'all',
}

const snap = S.captureSnapshot(live, 'Baseline', '2026-08-05T10:00:00.000Z')
const frozenRecord = JSON.stringify(snap)

// Mutate the live maps every way a page could: replace a score, add an
// answer, edit evidence through the nested object, move a target.
live.answers['DG-P01-01'] = 1
live.answers['DG-P03-02'] = 5
live.answers['DG-P02-01'].evidence = 'REWRITTEN'
live.answers['DG-P02-01'].score = 5
live.targets.P01 = 1
delete live.targets.P02

check(JSON.stringify(snap) === frozenRecord, 'mutating the live maps left the snapshot byte-identical (structural freeze, not reference luck)')
check(Object.isFrozen(snap) && Object.isFrozen(snap.answers) && Object.isFrozen(snap.answers['DG-P02-01']) && Object.isFrozen(snap.targets), 'every level of the snapshot is Object.frozen')
check(snap.answers['DG-P01-01'].score === 4 && snap.answers['DG-P02-01'].evidence === 'Charter sighted.', 'captured values are the values at capture time')

const liveA = { answers: { Q1: 4 }, targets: { P01: 3 }, tier: 'quick', layer: 'all' }
const liveB = { answers: { Q1: { score: 4 } }, targets: { P01: 3 }, tier: 'quick', layer: 'all' }
const s1 = S.captureSnapshot(liveA, 'first', '2026-08-01T00:00:00.000Z')
const s2 = S.captureSnapshot(liveB, 'second, later, different label', '2026-08-02T00:00:00.000Z')
check(s1.digest === s2.digest, 'two captures of identical state share a digest (legacy and rich shapes included)', s1.digest)
const s3 = S.captureSnapshot({ ...liveA, answers: { Q1: 3 } }, 'one answer moved', '2026-08-03T00:00:00.000Z')
check(s3.digest !== s1.digest, 'one changed answer changes the digest', `${s1.digest.slice(0, 8)}… -> ${s3.digest.slice(0, 8)}…`)
check(s1.id !== s2.id, 'ids are unique per capture even when digests collide by design')

let emptyRejected = false
try { S.captureSnapshot(liveA, '   ', '2026-08-04T00:00:00.000Z') } catch { emptyRejected = true }
check(emptyRejected, 'an empty (whitespace) label is rejected at the helper level')

const list0 = []
const list1 = S.appendSnapshot(list0, s1)
const list2 = S.appendSnapshot(list1, s2)
check(list0.length === 0 && list1.length === 1 && list2.length === 2, 'appendSnapshot never mutates its input list')
const editPaths = Object.keys(S).filter((k) => typeof S[k] === 'function' && /edit|remove|delete|update|rewrite|clear|set/i.test(k))
check(editPaths.length === 0, 'the module exports no edit/delete path — append-only in fact, not in name', editPaths.join(', '))

check(modules.engagement.PERSISTED_BASES.includes('dgiw.snapshots'), "PERSISTED_BASES includes 'dgiw.snapshots' — snapshots survive engagement export/duplicate")
for (const base of ['dgiw.intake', 'dgiw.tier', 'dgiw.targets', 'dgiw.status', 'dgiw.kpi', 'dgiw.period']) {
  check(modules.engagement.PERSISTED_BASES.includes(base), `PERSISTED_BASES includes '${base}' (D-022 closure rides with CP1)`)
}

check(S.isSnapshotList(JSON.parse(JSON.stringify(list2))), 'a stored list round-trips the shape guard')
check(!S.isSnapshotList([{ ...JSON.parse(JSON.stringify(s1)), digest: 'nope' }]), 'a malformed digest fails the shape guard')
check(!S.isSnapshotList([{ ...JSON.parse(JSON.stringify(s1)), label: ' ' }]), 'a blank label fails the shape guard')

/* ── CP2: the delta engine ────────────────────────────────────────────── */

const D = modules.deltas
if (D && D.snapshotDeltas) {
  console.log('\n— CP2: deltas only between comparable things, every claim cited\n')

  // Real question ids at the quick tier, so scorePillars actually scores:
  // DG-P01-01 and DG-P02-01 are quick-tier core questions (the golden
  // fixture's own anchors). P01 is scored in both snapshots; P02 only in the
  // second — a delta for the first, an exclusion for the second.
  const capture = (answers, tier, at, label) =>
    S.captureSnapshot({ answers, targets: {}, tier, layer: 'all' }, label, at)

  const a = capture({ 'DG-P01-01': 2 }, 'standard', '2026-08-01T00:00:00.000Z', 'wave 1 baseline')
  const b = capture({ 'DG-P01-01': 4, 'DG-P02-01': 3 }, 'standard', '2026-08-15T00:00:00.000Z', 'wave 1 close')
  const q = capture({ 'DG-P01-01': 5 }, 'quick', '2026-08-20T00:00:00.000Z', 'quick pulse')

  const r = D.snapshotDeltas(a, b)
  check(r.comparable === true, 'same-tier same-layer pair is comparable')
  const p01 = r.deltas.find((d) => d.pillarId === 'P01')
  check(Boolean(p01) && p01.from === 2 && p01.to === 4 && p01.delta === 2, 'P01 scored both sides yields {from 2, to 4, delta +2}')
  check(!r.deltas.some((d) => d.pillarId === 'P02'), 'P02 (scored one side only) yields NO delta row')
  const p02x = r.exclusions.find((x) => x.pillarId === 'P02')
  check(Boolean(p02x) && p02x.reasons.length > 0 && p02x.reasons.every((t) => t.length > 0), 'P02 appears as an exclusion with a written reason', p02x?.reasons[0])
  check(r.exclusions.every((x) => x.reasons.length > 0), 'every exclusion carries a reason — never a silent drop')
  check(r.overall !== null && r.overall.pillarCount === r.deltas.length && r.deltas.length === 1, `overall is computed over exactly the comparable pillars (pillarCount ${r.overall?.pillarCount})`)
  check(
    r.citations.aDigest === a.digest && r.citations.bDigest === b.digest &&
    r.citations.aLabel === a.label && r.citations.bLabel === b.label &&
    r.citations.aAt === a.capturedAt && r.citations.bAt === b.capturedAt,
    'the result cites both snapshots: labels, dates, digests',
  )

  const cross = D.snapshotDeltas(b, q)
  check(cross.comparable === false, 'a cross-tier pair returns not-comparable — it does not throw')
  check(cross.aTier === 'standard' && cross.bTier === 'quick', 'both tiers are named in the not-comparable result')
  check(typeof cross.rule === 'string' && cross.rule.length > 0, 'the rule\'s own statement travels with the refusal to compare', cross.rule.slice(0, 60) + '…')
  check(!('deltas' in cross && Array.isArray(cross.deltas) && cross.deltas.length), 'a not-comparable result carries no pillar deltas')

  check(
    typeof D.B_SAME_TIER === 'string' && typeof D.B_SCORED_BOTH === 'string' && typeof D.B_NO_FORECAST === 'string' &&
    [D.B_SAME_TIER, D.B_SCORED_BOTH, D.B_NO_FORECAST].every((s) => s.length > 40),
    'B_SAME_TIER / B_SCORED_BOTH / B_NO_FORECAST invariants are exported statements',
  )
  check(!/forecast|on.track|predict|project(ed|ion)|extrapolat/i.test(D.B_SAME_TIER + D.B_SCORED_BOTH), 'the comparability invariants promise no forward-looking language')

  const pairs = S.comparableSnapshotPairs([a, q, b])
  check(pairs.length === 1 && pairs[0][0].id === a.id && pairs[0][1].id === b.id, 'comparableSnapshotPairs finds exactly the standard-tier pair, chronological within the pair')
} else {
  console.log('\n— CP2 modules not built yet (deltas.ts absent) — CP1 run only\n')
}

/* ── CP4: the generators, driven over the golden fixture ──────────────── */

const genLoad = await loadTsModules(ROOT, ROOT, {
  deltaReport: 'src/dgiw/report/deltaReport.ts',
  councilPack: 'src/dgiw/report/councilPack.ts',
})
if (genLoad.modules) {
  console.log('\n— CP4: the delta report and the earned trend, against the real fixture\n')
  const fs = await import('node:fs')
  const zlib = await import('node:zlib')
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/golden/fixtures/dgiw.json'), 'utf8'))
  const { buildDeltaReportPdf, deltaReportRefusal } = genLoad.modules.deltaReport
  const { buildCouncilPackPdf } = genLoad.modules.councilPack

  /** Content streams of a jsPDF doc, inflated where needed. */
  const streamsOf = (doc) => {
    const bytes = Buffer.from(doc.output('arraybuffer'))
    const out = []
    let idx = 0
    for (;;) {
      const s = bytes.indexOf('stream', idx)
      if (s === -1) break
      let start = s + 6
      if (bytes[start] === 0x0d) start++
      if (bytes[start] === 0x0a) start++
      const e = bytes.indexOf('endstream', start)
      if (e === -1) break
      const raw = bytes.subarray(start, e)
      try { out.push(zlib.inflateSync(raw).toString('latin1')) } catch { out.push(raw.toString('latin1')) }
      idx = e + 9
    }
    return out
  }
  /** Every parenthesised string literal — the D-018 lesson: ALL of them. */
  const textOf = (doc) => {
    const literals = []
    for (const c of streamsOf(doc))
      for (const m of c.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)) literals.push(m[1])
    return literals.map((l) => l.replace(/\\([()\\])/g, '$1')).join(' ')
  }
  /** Path operators with string literals stripped first — the D-019 lesson:
   *  know which encoding you are reading before you count what is in it. */
  const curveOpsOf = (doc) => {
    let n = 0
    for (const c of streamsOf(doc)) {
      const noStrings = c.replace(/\((?:[^()\\]|\\.)*\)/g, '()')
      n += (noStrings.match(/(?:^|[\s)])(c|v|y)[\s]/g) ?? []).length
    }
    return n
  }

  const meta = (artefactId) => ({
    orgName: fixture.orgName, engagementId: fixture.engagementId,
    generatedAt: fixture.generatedAt, layer: fixture.layer,
    accent: fixture.accent, isDraft: false, artefactId, mode: 'engagement',
  })
  const FORECAST = /forecast|on.track|predict|project(ed|ion)|extrapolat/i

  // AR-58 over the fixture: default pair is quick "Wave 1 close" -> "September pulse".
  const delta = buildDeltaReportPdf({ meta: meta('AR-58'), snapshots: fixture.snapshots })
  const deltaText = textOf(delta)
  const snapByLabel = Object.fromEntries(fixture.snapshots.map((s) => [s.label, s]))
  check(deltaText.includes(snapByLabel['Wave 1 close'].digest) && deltaText.includes(snapByLabel['September pulse'].digest),
    'AR-58 cites BOTH snapshot digests in its rendered text')
  check(deltaText.includes('Why excluded') && /not scored in the earlier snapshot/.test(deltaText),
    'AR-58 phrases exclusions with reasons (P04 scored one side only)')
  check(!FORECAST.test(deltaText), 'AR-58 text has ZERO forward-looking vocabulary matches')
  check(curveOpsOf(delta) === 0, 'AR-58 content streams carry NO curve operators — straight segments only')
  check(/moved 2\.00 -> 3\.00|moved 4\.00 -> 5\.00/.test(deltaText), 'movement is stated as past fact with both values')

  // Byte-identical regenerate.
  const delta2 = buildDeltaReportPdf({ meta: meta('AR-58'), snapshots: fixture.snapshots })
  check(Buffer.compare(Buffer.from(delta.output('arraybuffer')), Buffer.from(delta2.output('arraybuffer'))) === 0,
    'two AR-58 generations are byte-identical')

  // A third snapshot entering the cited pair moves the /ID.
  const without = fixture.snapshots.filter((s) => s.label !== 'September pulse')
  const deltaB = buildDeltaReportPdf({ meta: meta('AR-58'), snapshots: without })
  check(delta.getFileId() !== deltaB.getFileId(),
    'the /ID moves when a different snapshot enters the cited pair', `${delta.getFileId().slice(0, 8)}… vs ${deltaB.getFileId().slice(0, 8)}…`)

  // Refusals, typed.
  for (const [label, snaps] of [
    ['no snapshots', []],
    ['one snapshot', [fixture.snapshots[0]]],
    ['no comparable pair', [fixture.snapshots[0], fixture.snapshots[2]]],
  ]) {
    let err = null
    try { buildDeltaReportPdf({ meta: meta('AR-58'), snapshots: snaps }) } catch (e) { err = e }
    check(err !== null && err.name === 'Refusal' && err.refusal === true, `AR-58 refuses (typed Refusal) with ${label}`)
  }

  // AR-57: trend earned by the fixture's in-period quick pair, absent otherwise.
  const packInput = {
    meta: meta('AR-57'), answers: fixture.answers, targets: fixture.targets, tier: fixture.tier,
    intake: fixture.intake, statusLog: fixture.status, kpiLog: fixture.kpi, period: fixture.period,
  }
  const packWith = buildCouncilPackPdf({ ...packInput, snapshots: fixture.snapshots })
  const packText = textOf(packWith)
  check(packText.includes('Maturity movement'), 'the pack renders the trend section over the fixture snapshots')
  check(packText.includes(snapByLabel['Baseline'].digest) && packText.includes(snapByLabel['Wave 1 close'].digest),
    'the pack cites the IN-PERIOD pair (Baseline -> Wave 1 close), digests included')
  check(!packText.includes(snapByLabel['September pulse'].digest),
    'the post-period capture is NOT cited — the at-or-before-period-end boundary holds')
  check(/moved 2\.00 -> 4\.00 between/.test(packText), 'pillar movement is stated as past fact ("P01 ... moved 2.00 -> 4.00 between ...")')
  check(!FORECAST.test(packText), 'the pack text has ZERO forward-looking vocabulary matches')

  const packWithout = buildCouncilPackPdf({ ...packInput, snapshots: [] })
  const packWithoutText = textOf(packWithout)
  check(packWithoutText.includes('absent because its input is'),
    'with no snapshots the trend section is ABSENT with the reason, in the absent-section idiom')
  check(packWith.getFileId() !== packWithout.getFileId(),
    'the pack /ID moves when the cited snapshot pair changes')
  const packPair2 = buildCouncilPackPdf({ ...packInput, snapshots: fixture.snapshots.filter((s) => s.label !== 'Baseline') })
  check(packWith.getFileId() !== packPair2.getFileId(),
    'the pack /ID moves when a different snapshot enters the cited pair')
} else {
  console.log(`\n— CP4 modules not built (${genLoad.error}) — earlier sections only\n`)
  failures++
}

console.log(failures === 0 ? '\n  OK — every trajectory contract demonstrated against the compiled modules' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
