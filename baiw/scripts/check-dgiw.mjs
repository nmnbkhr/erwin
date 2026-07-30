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
 * Section 10 is the exception to "dataset": it checks the CSV column specs in
 * src/dgiw/report/, because the constraint it enforces cannot be expressed in
 * the type system and its failure mode — a header that splits a delivered
 * spreadsheet into the wrong columns — is the same kind of silent content defect
 * as the rest of this file.
 *
 * Run with `npm run check:dgiw`. Wired into `npm run build`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Already a devDependency — it is what `tsc -b` runs. Used here only as a
// parser, for the CSV header check in section 10.
import ts from 'typescript'

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

// ── 10. CSV headers must survive an unquoted header row ─────────────────
// `utils/export.ts::downloadCSV` quotes every data field but emits the header
// row as a bare `headers.join(',')`. Quoting it would change BAIW, TAIW and HAIW
// output byte for byte, so the header row stays as it is and the constraint
// lives here instead: a header containing a comma silently splits into two
// columns and shifts every value after it by one; a quote or a newline corrupts
// the file outright for a strict RFC 4180 reader. Today's headers are clean.
// Nothing enforced that the next one would be.
//
// Duplicates are the same defect by a different route. `csv.ts::buildCsvRows`
// keys each cell by header text into a plain object, so two columns sharing a
// header are not two columns: the second assignment overwrites the first and the
// register is delivered a column short, with no error anywhere. The type system
// cannot see it — `CsvColumn<T>[]` constrains `key`, never `header`.
//
// The specs are read with the TypeScript compiler that already builds this repo
// — no new dependency, no regex guessing at whether a `header:` is real code or
// prose inside a doc comment, and the generators are never executed. A spec the
// parser cannot resolve to a plain string literal FAILS: a gate that quietly
// passes on the thing it could not read is worse than no gate.
//
// Limit worth knowing: a header inherited through an object spread
// (`{ ...COMMON, key: 'x' }`) is not traced back to its source. Nothing does
// that today, and the CsvColumn-declared-but-no-header check below fires if a
// spec ever moves somewhere this walk cannot see.
const REPORT_DIR = path.join(D, '..', 'report')
const SRC_ROOT = path.join(D, '..', '..', '..')
const BAD_IN_HEADER = [
  [',', 'comma', 'splits into two columns'],
  ['"', 'double quote', 'corrupts the row'],
  ['\r', 'CR', 'terminates the header row early'],
  ['\n', 'LF', 'terminates the header row early'],
]

/**
 * Nearest enclosing array literal — the scope a duplicate is judged within.
 *
 * Per spec array, not per file: two generators in one file may legitimately each
 * declare a "CDE ID" column, and only a collision inside one spec collapses a
 * column. `parent` links exist because createSourceFile is called with
 * setParentNodes = true.
 */
const enclosingSpec = (node) => {
  for (let p = node.parent; p; p = p.parent) if (ts.isArrayLiteralExpression(p)) return p
  return null
}

/** Property name as written, for identifiers, string keys and `['header']`. */
const propName = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text
  return null
}

const specFiles = []
let headersChecked = 0

const tsFilesIn = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name)
        return e.isDirectory() ? tsFilesIn(p) : /\.tsx?$/.test(e.name) ? [p] : []
      })
    : []

const reportSources = tsFilesIn(REPORT_DIR)
if (reportSources.length === 0)
  fail('CSV-HEADER', `no .ts sources found under ${path.relative(SRC_ROOT, REPORT_DIR)} — the check is looking in the wrong place`)

for (const file of reportSources) {
  const rel = path.relative(SRC_ROOT, file)
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  const at = (node) => `${rel}:${lineOf(node)}`
  let found = 0
  /** Spec array node → header text → the node that first claimed it. */
  const claimed = new Map()

  const visit = (node) => {
    if (ts.isShorthandPropertyAssignment(node) && node.name.text === 'header') {
      found++
      fail('CSV-HEADER', `${at(node)} header is a shorthand property — its value cannot be verified here`)
    } else if (ts.isPropertyAssignment(node) && propName(node.name) === 'header') {
      found++
      const init = node.initializer
      if (!ts.isStringLiteralLike(init)) {
        // Covers interpolated templates, calls, identifiers and conditionals.
        fail('CSV-HEADER', `${at(node)} header is not a literal string (\`${init.getText(sf).replace(/\s+/g, ' ').slice(0, 60)}\`) — its value cannot be verified here`)
      } else {
        // `.text` is the cooked value, so an escaped comma (',') is caught too.
        for (const [ch, label, effect] of BAD_IN_HEADER)
          if (init.text.includes(ch))
            fail('CSV-HEADER', `${at(node)} header ${JSON.stringify(init.text)} contains a ${label} — the header row is written unquoted, so this ${effect}`)

        // Reported at the second occurrence, naming the first: that is the one a
        // reader has to go and look at to decide which of the two to rename.
        const spec = enclosingSpec(node) ?? sf
        const seen = claimed.get(spec) ?? new Map()
        claimed.set(spec, seen)
        const first = seen.get(init.text)
        if (first)
          fail('CSV-HEADER', `${at(node)} header ${JSON.stringify(init.text)} duplicates the one at ${rel}:${lineOf(first)} in the same spec — buildCsvRows keys cells by header text, so the second column overwrites the first and the file is delivered a column short`)
        else seen.set(init.text, node)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (found === 0 && /\bCsvColumn\b/.test(text))
    fail('CSV-HEADER', `${rel} references CsvColumn but declares no header: property — the column spec has moved somewhere this check cannot see it`)
  if (found > 0) specFiles.push(rel)
  headersChecked += found
}

// ── 11. every generated artefact id exists in the register ──────────────
// Each generator names the artefact it produces in a `*_ARTEFACT_ID` constant,
// and that id ends up on the PDF cover and in the filename. An id that is not in
// implementationPlan.json's artefactRegister is a deliverable claiming to be a
// catalogue item that does not exist — the client reads "AR-31" on a cover, goes
// looking for AR-31 in the register, and finds nothing.
//
// Same static approach as section 10, and the same refusal to guess: an id that
// is not a plain string literal FAILS rather than being skipped. Interpolating
// the id would defeat the check entirely, and there is no reason to.
//
// The coverage number below is informational, never a failure. Phase B built
// five of the forty-six; a check that failed on the other forty-one would be
// demanding that the whole register be automated, which is not the intent —
// most of these artefacts are produced by hand during delivery.
const registeredArtefacts = new Set(plan.artefactRegister.map((a) => a.id))
const implementedArtefacts = new Map() // id → files that declare it

for (const file of reportSources) {
  const rel = path.relative(SRC_ROOT, file)
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const at = (node) => `${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`

  const visit = (node) => {
    // `export const X_ARTEFACT_ID = 'AR-04'` — the declared naming convention.
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /ARTEFACT_ID$/.test(node.name.text)) {
      const init = node.initializer
      if (!init || !ts.isStringLiteralLike(init)) {
        fail('ARTEFACT-IMPL', `${at(node)} ${node.name.text} is not a literal string — the artefact id cannot be verified here`)
      } else if (!registeredArtefacts.has(init.text)) {
        fail('ARTEFACT-IMPL', `${at(node)} ${node.name.text} = ${JSON.stringify(init.text)} is not in implementationPlan.json artefactRegister — the cover would cite a catalogue entry that does not exist`)
      } else {
        implementedArtefacts.set(init.text, [...(implementedArtefacts.get(init.text) ?? []), rel])
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

for (const [id, files] of implementedArtefacts)
  if (files.length > 1)
    fail('ARTEFACT-IMPL', `artefact ${id} is claimed by ${files.join(' and ')} — two generators producing one catalogue id would overwrite each other's file`)

// ── report ──────────────────────────────────────────────────────────────
const n = (rows, l) => rows.filter((r) => r.layer === l).length
console.log('DGIW dataset check')
console.log(`  pillars ${pillars.length}  questions ${diag.questions.length} (core ${n(diag.questions, 'core')} / banking ${n(diag.questions, 'banking')})`)
console.log(`  CDEs ${cdes.length} (core ${n(cdes, 'core')} / banking ${n(cdes, 'banking')})  DQ rules ${rules.length} (core ${n(rules, 'core')} / banking ${n(rules, 'banking')})`)
console.log(`  flows ${prog.flows.length}  steps ${prog.flows.flatMap((f) => f.steps).length}  checklist ${prog.checklist.length}  gates ${om.gates.length}`)
console.log(`  waves ${plan.waves.length}  artefacts ${plan.artefactRegister.length}  roles ${om.roles.length}  registry ${(om.roleRegistry ?? []).length}`)
// The verdict is conditional on purpose: a summary line that reads "no comma"
// while the problem list below it names one is how a reader learns to skim past
// this output.
const headerFails = fails.filter((f) => f.startsWith('CSV-HEADER')).length
console.log(
  `  CSV-HEADER ${headersChecked} header${headersChecked === 1 ? '' : 's'} across ${specFiles.length} spec file${specFiles.length === 1 ? '' : 's'}` +
    ` (${specFiles.join(', ') || 'none'}) — ${headerFails ? `${headerFails} REJECTED, see below` : 'no comma, quote, CR, LF or duplicate'}`,
)
// The Phase B scoreboard. Informational: it is printed on every build so the gap
// between what the register catalogues and what the workbench can actually
// produce stays visible instead of being rediscovered.
const implFails = fails.filter((f) => f.startsWith('ARTEFACT-IMPL')).length
const covered = [...implementedArtefacts.keys()].sort()
console.log(
  `  ARTEFACT-IMPL ${covered.length} of ${plan.artefactRegister.length} catalogued artefacts have a generator` +
    ` (${covered.join(', ') || 'none'})${implFails ? ` — ${implFails} REJECTED, see below` : ''}`,
)

if (fails.length) {
  console.error(`\n${fails.length} problem${fails.length > 1 ? 's' : ''}:`)
  for (const f of fails) console.error('  ' + f)
  process.exit(1)
}
console.log('\n  OK — all checks passed')
