#!/usr/bin/env node
/**
 * DGIW dataset integrity check.
 *
 * The workbench is nine hand-authored JSON datasets that reference each other by
 * id and are sliced at runtime by a layer filter. TypeScript checks their shape;
 * nothing checked their *content*, and the defects that reached the UI were all
 * content defects — a rule pointing at a CDE that the layer filter had removed, a
 * blocking gate no flow ran, a pillar the diagnostic could score but no wave
 * addressed, an owner string that named two accountable people.
 *
 * Run with `npm run check:dgiw`. Wired into `npm run build`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const D = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dgiw', 'data')
const j = (f) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'))

const pillars = j('pillars.json')
const diag = j('diagnostic.json')
const ladder = j('ladder.json')
const om = j('operatingModel.json')
const cdes = j('cdeRegister.json')
const rules = j('dqRules.json')
const prog = j('programSetup.json')
const plan = j('implementationPlan.json')
const pos = j('positioning.json')

const fails = []
const fail = (code, msg) => fails.push(`${code}: ${msg}`)

const LAYERS = ['core', 'banking']
const pillarIds = new Set(pillars.map((p) => p.id))
const cdeById = new Map(cdes.map((c) => [c.id, c]))
const roleIds = new Set(om.roles.map((r) => r.id))
const registry = new Map((om.roleRegistry ?? []).map((r) => [r.name, r]))
const gateById = new Map(om.gates.map((g) => [g.id, g]))
const waveById = new Map(plan.waves.map((w) => [w.id, w]))
const rungNums = new Set(ladder.map((r) => r.rung))
const DIMS = ['Completeness', 'Validity', 'Accuracy', 'Consistency', 'Uniqueness', 'Timeliness', 'Integrity']

// ── 1. every layer-tagged record carries a valid layer ──────────────────
const layered = [
  ['diagnostic.questions', diag.questions],
  ['operatingModel.roles', om.roles],
  ['operatingModel.roleRegistry', om.roleRegistry ?? []],
  ['cdeRegister', cdes],
  ['dqRules', rules],
  ['programSetup.checklist', prog.checklist],
  ['plan.waves', plan.waves],
  ['plan.artefactRegister', plan.artefactRegister],
  ['positioning.wedges', pos.wedges],
  ['positioning.accelerators', pos.accelerators],
  ...prog.flows.map((f) => [`flow ${f.id}.steps`, f.steps]),
]
for (const [name, rows] of layered)
  for (const r of rows)
    if (!LAYERS.includes(r.layer)) fail('LAYER', `${name} "${r.id ?? r.name}" has layer=${JSON.stringify(r.layer)}`)
for (const rung of ladder)
  for (const d of rung.deliverables)
    if (!LAYERS.includes(d.layer)) fail('LAYER', `ladder rung ${rung.rung} deliverable "${d.name}" layer=${d.layer}`)

// ── 2. ids are unique ───────────────────────────────────────────────────
const unique = (name, ids) => {
  const seen = new Set()
  for (const i of ids) {
    if (seen.has(i)) fail('UNIQUE', `duplicate ${name} id "${i}"`)
    seen.add(i)
  }
}
unique('pillar', pillars.map((p) => p.id))
unique('question', diag.questions.map((q) => q.id))
unique('cde', cdes.map((c) => c.id))
unique('dqRule', rules.map((r) => r.id))
unique('checklist', prog.checklist.map((c) => c.id))
unique('artefact', plan.artefactRegister.map((a) => a.id))
unique('role', om.roles.map((r) => r.id))
unique('gate', om.gates.map((g) => g.id))
unique('wave', plan.waves.map((w) => w.id))
unique('programStep', prog.flows.flatMap((f) => f.steps.map((s) => s.id)))
unique('roleRegistry', (om.roleRegistry ?? []).map((r) => r.name))

// ── 3. foreign keys ─────────────────────────────────────────────────────
for (const q of diag.questions) if (!pillarIds.has(q.pillarId)) fail('FK', `question ${q.id} -> pillar ${q.pillarId}`)
for (const c of prog.checklist) if (!pillarIds.has(c.pillarId)) fail('FK', `checklist ${c.id} -> pillar ${c.pillarId}`)
for (const w of plan.waves) for (const p of w.pillarIds) if (!pillarIds.has(p)) fail('FK', `wave ${w.id} -> pillar ${p}`)
for (const a of plan.artefactRegister) {
  if (!pillarIds.has(a.pillarId)) fail('FK', `artefact ${a.id} -> pillar ${a.pillarId}`)
  if (!rungNums.has(a.rung)) fail('FK', `artefact ${a.id} -> ladder rung ${a.rung}`)
}
for (const r of rules) if (!cdeById.has(r.cdeRef)) fail('FK', `dqRule ${r.id} -> cde ${r.cdeRef}`)

// ── 4. enums and shapes ─────────────────────────────────────────────────
for (const r of rules) {
  if (!DIMS.includes(r.dimension)) fail('ENUM', `dqRule ${r.id} dimension "${r.dimension}"`)
  if (!['BLOCKER', 'HIGH', 'MEDIUM'].includes(r.severity)) fail('ENUM', `dqRule ${r.id} severity "${r.severity}"`)
}
for (const c of cdes) {
  if (!['CRITICAL', 'HIGH', 'MEDIUM'].includes(c.criticality)) fail('ENUM', `cde ${c.id} criticality "${c.criticality}"`)
  for (const d of c.dqDimensions) if (!DIMS.includes(d)) fail('ENUM', `cde ${c.id} dqDimension "${d}"`)
  if (!c.consumers?.length) fail('SHAPE', `cde ${c.id} has no consumers — criticality is derived from consumption, so this is unfounded`)
}
for (const q of diag.questions) {
  if (![1, 2, 3].includes(q.weight)) fail('ENUM', `question ${q.id} weight ${q.weight}`)
  const lv = Object.keys(q.levelDescriptions).sort().join(',')
  if (lv !== '1,2,3,4,5') fail('SHAPE', `question ${q.id} levelDescriptions keys = [${lv}], expected 1..5`)
}

// ── 5. accountability resolves, and is singular ─────────────────────────
// Every owner string must resolve to a governance archetype. Compound owners are
// rejected outright: two accountable parties is the same as none.
const ownerRefs = [
  ...cdes.map((c) => [`cde ${c.id}`, c, 'ownerRole']),
  ...prog.checklist.map((c) => [`checklist ${c.id}`, c, 'owner']),
  ...plan.artefactRegister.map((a) => [`artefact ${a.id}`, a, 'owner']),
  ...prog.flows.flatMap((f) => f.steps.map((s) => [`step ${s.id}`, s, 'owner'])),
]
for (const [where, rec, field] of ownerRefs) {
  const o = rec[field]
  if (/ with | and |,|\//.test(o) && !registry.has(o))
    fail('OWNER-COMPOUND', `${where} owner "${o}" names more than one accountable party`)
  const entry = registry.get(o)
  if (!entry) {
    fail('OWNER-UNRESOLVED', `${where} owner "${o}" is not in operatingModel.roleRegistry`)
  } else if (rec.layer === 'core' && entry.layer === 'banking') {
    fail('OWNER-LAYER', `core record ${where} is owned by banking-only role "${o}" — unresolvable in a core-only engagement`)
  }
  for (const s of rec.support ?? [])
    if (!registry.has(s)) fail('OWNER-UNRESOLVED', `${where} support "${s}" is not in operatingModel.roleRegistry`)
}
for (const r of om.roleRegistry ?? [])
  if (!roleIds.has(r.archetype)) fail('FK', `roleRegistry "${r.name}" -> archetype ${r.archetype} is not a role id`)

// ── 6. gates are referential, and every gate is actually run ────────────
const gateUse = new Map()
for (const f of prog.flows) {
  if (!Array.isArray(f.gateIds)) { fail('GATE', `flow ${f.id} has no gateIds array`); continue }
  if (f.gateIds.length === 0) fail('GATE', `flow ${f.id} passes through no gate`)
  for (const g of f.gateIds) {
    if (!gateById.has(g)) fail('FK', `flow ${f.id} -> gate ${g}`)
    gateUse.set(g, [...(gateUse.get(g) ?? []), f.id])
  }
}
for (const g of om.gates) {
  const used = gateUse.get(g.id)
  if (!used) fail('GATE-ORPHAN', `gate ${g.id} "${g.name}"${g.blocking ? ' [BLOCKING]' : ''} is referenced by no flow — a control nobody runs`)
  else if (used.length > 1) fail('GATE-DUP', `gate ${g.id} is claimed by flows ${used.join(', ')} — ownership of a gate must be singular`)
}

// ── 7. the wave graph ───────────────────────────────────────────────────
for (const w of plan.waves) {
  if (!Array.isArray(w.dependsOn)) { fail('WAVE', `wave ${w.id} has no dependsOn array`); continue }
  for (const d of w.dependsOn) {
    const dep = waveById.get(d)
    if (!dep) { fail('FK', `wave ${w.id} dependsOn ${d}`); continue }
    if (dep.wave >= w.wave) fail('WAVE-ORDER', `wave ${w.id} depends on ${d}, which is not scheduled earlier`)
    // The banking overlay is additive. A core wave that needs a banking wave means
    // a core-only engagement cannot execute the core plan.
    if (w.layer === 'core' && dep.layer === 'banking')
      fail('WAVE-LAYER', `core wave ${w.id} depends on banking wave ${d} — breaks a core-only engagement`)
  }
}
// Cycle detection, in case dependsOn ever stops implying wave order.
{
  const state = new Map()
  const visit = (id, trail) => {
    if (state.get(id) === 'done') return
    if (state.get(id) === 'open') return fail('WAVE-CYCLE', `dependency cycle: ${[...trail, id].join(' -> ')}`)
    state.set(id, 'open')
    for (const d of waveById.get(id)?.dependsOn ?? []) if (waveById.has(d)) visit(d, [...trail, id])
    state.set(id, 'done')
  }
  for (const w of plan.waves) visit(w.id, [])
}

// ── 8. layer coherence — nothing may dangle when the filter is applied ──
for (const r of rules)
  if (r.layer === 'core' && cdeById.get(r.cdeRef)?.layer === 'banking')
    fail('LAYER-COHERENCE', `core dqRule ${r.id} references banking-only CDE ${r.cdeRef} — orphaned in a core-only engagement`)

for (const p of pillarIds) {
  const qs = diag.questions.filter((q) => q.pillarId === p)
  if (!qs.length) fail('COVERAGE', `pillar ${p} has no diagnostic questions`)
  else if (!qs.some((q) => q.layer === 'core'))
    fail('LAYER-COHERENCE', `pillar ${p} has ${qs.length} questions, none 'core' — unassessable in a core-only engagement`)
}

// Every pillar the diagnostic can score must have a wave that addresses it, or the
// derived roadmap — the diagnostic's headline output — renders an empty cell.
// Core waves apply in every engagement; banking waves only when banking is in scope.
for (const layer of LAYERS)
  for (const p of pillarIds) {
    if (!diag.questions.some((q) => q.pillarId === p && q.layer === layer)) continue
    const addressed = plan.waves.some((w) => w.pillarIds.includes(p) && (w.layer === 'core' || w.layer === layer))
    if (!addressed) fail('ROADMAP', `pillar ${p} is scorable in ${layer} mode but no applicable wave addresses it`)
  }

// ── 9. the core chassis must not be hollow ──────────────────────────────
// The module is sold as sector-neutral core plus banking overlay. A core-only
// engagement that opens the CDE register to four rows about governance metadata
// does not support that claim.
const coreCdes = cdes.filter((c) => c.layer === 'core')
const coreDomains = new Set(coreCdes.map((c) => c.domain))
if (coreCdes.length < 15) fail('CORE-CHASSIS', `only ${coreCdes.length} core CDEs — a core-only engagement has no register to work from`)
if (coreDomains.size < 6) fail('CORE-CHASSIS', `core CDEs span only ${coreDomains.size} domains`)
for (const c of coreCdes)
  if (!rules.some((r) => r.cdeRef === c.id && r.layer === 'core'))
    fail('CORE-CHASSIS', `core CDE ${c.id} "${c.element}" has no core DQ rule — it cannot be measured`)

// ── report ──────────────────────────────────────────────────────────────
const n = (rows, l) => rows.filter((r) => r.layer === l).length
console.log('DGIW dataset check')
console.log(`  pillars ${pillars.length}  questions ${diag.questions.length} (core ${n(diag.questions, 'core')} / banking ${n(diag.questions, 'banking')})`)
console.log(`  CDEs ${cdes.length} (core ${n(cdes, 'core')} / banking ${n(cdes, 'banking')})  DQ rules ${rules.length} (core ${n(rules, 'core')} / banking ${n(rules, 'banking')})`)
console.log(`  flows ${prog.flows.length}  steps ${prog.flows.flatMap((f) => f.steps).length}  checklist ${prog.checklist.length}  gates ${om.gates.length}`)
console.log(`  waves ${plan.waves.length}  artefacts ${plan.artefactRegister.length}  roles ${om.roles.length}  registry ${(om.roleRegistry ?? []).length}`)

if (fails.length) {
  console.error(`\n${fails.length} problem${fails.length > 1 ? 's' : ''}:`)
  for (const f of fails) console.error('  ' + f)
  process.exit(1)
}
console.log('\n  OK — all checks passed')
