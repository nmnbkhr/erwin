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
const fw = j('frameworks.json')
const xw = j('crosswalk.json')

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
//
// The second half of this section enforces the content digest. `createReport`'s
// second argument is optional and defaults to '', which is the pre-existing
// identity-only behaviour — so a generator that forgets it compiles, runs, and
// silently reintroduces the defect the digest was added to fix: two reports with
// different content sharing a trailer /ID, which a viewer or a DMS reads as "same
// document, already have it". Nothing about that is visible on the page.
//
// Until now the rule lived only in CLAUDE.md. Phase C adds four more generators,
// which is exactly when a written-down rule stops being followed.
//
// A generator with genuinely nothing to digest is meant to FAIL here and be
// discussed. There is no exemption list on purpose: an exemption is how the
// default silently comes back.
const registeredArtefacts = new Set(plan.artefactRegister.map((a) => a.id))
const implementedArtefacts = new Map() // id → files that declare it
let digestsChecked = 0

/** True if an empty string literal appears anywhere in this expression. */
const hidesEmptyLiteral = (node) => {
  let found = false
  const scan = (x) => {
    if (ts.isStringLiteralLike(x) && x.text === '') found = true
    ts.forEachChild(x, scan)
  }
  scan(node)
  return found
}

for (const file of reportSources) {
  const rel = path.relative(SRC_ROOT, file)
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const at = (node) => `${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`

  // Resolve the local name, so `import { createReport as mk }` is still checked
  // rather than quietly falling outside the walk.
  let createReportName = null
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue
    const named = st.importClause?.namedBindings
    if (!named || !ts.isNamedImports(named)) continue
    for (const el of named.elements)
      if ((el.propertyName ?? el.name).text === 'createReport') createReportName = el.name.text
  }
  // Referenced some other way — a namespace import, a re-export, a dynamic call.
  // That is unresolvable here, so it fails rather than passing by not being seen.
  if (createReportName === null && /\bcreateReport\b/.test(text))
    fail('ARTEFACT-IMPL', `${rel} references createReport but not through a named import — this check cannot resolve the call, so the content digest cannot be verified`)

  const visit = (node) => {
    if (
      createReportName !== null &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === createReportName
    ) {
      digestsChecked++
      const arg = node.arguments[1]
      if (!arg) {
        fail('ARTEFACT-IMPL', `${at(node)} createReport is called with no content digest — the second argument defaults to '' and the report's /ID would then ignore what it renders`)
      } else if (ts.isStringLiteralLike(arg) && arg.text === '') {
        fail('ARTEFACT-IMPL', `${at(node)} createReport is passed an empty string literal as the content digest, which is exactly the default it is meant to replace`)
      } else if (ts.isStringLiteralLike(arg)) {
        // Not the empty case, but the same defect: a constant cannot vary with
        // content, so every revision of the document keeps one /ID.
        fail('ARTEFACT-IMPL', `${at(node)} createReport is passed the constant digest ${JSON.stringify(arg.text)} — a literal cannot vary with the document's content, so every revision would share one /ID`)
      } else if (arg.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(arg) && arg.text === 'undefined')) {
        fail('ARTEFACT-IMPL', `${at(node)} createReport is passed ${arg.getText(sf)} as the content digest, which is the same as omitting it`)
      } else if (hidesEmptyLiteral(arg)) {
        fail('ARTEFACT-IMPL', `${at(node)} the content digest expression contains an empty string literal — one branch of it would produce identity-only behaviour`)
      }
    }
    // `export const X_ARTEFACT_ID = 'AR-04'` — the declared naming convention.
    else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /ARTEFACT_ID$/.test(node.name.text)) {
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

// ── 12-16. Framework crosswalk ──────────────────────────────────────────
// One assessment, four framework scorecards. The eleven pillars stay canonical;
// a framework is a different vocabulary and emphasis over the same evidence.
//
// In C1 NOTHING imports frameworks.json or crosswalk.json, so tsc never sees
// them and lint never sees them. These five classes are the entire guard, not
// defence in depth — which is why CROSSWALK-SHAPE checks types and unknown keys
// rather than assuming the file is well formed.
const XW_LAYERS = ['core', 'banking', 'both']
const FRAMEWORKS = fw.frameworks ?? []
const DIMENSIONS = fw.dimensions ?? []
const ENTRIES = xw.entries ?? []

const frameworkById = new Map(FRAMEWORKS.map((f) => [f.id, f]))
const dimById = new Map(DIMENSIONS.map((d) => [d.id, d]))
const hasChildren = new Set(DIMENSIONS.map((d) => d.parentId).filter(Boolean))
const leafDims = DIMENSIONS.filter((d) => !hasChildren.has(d.id))
const entriesByDim = new Map()
for (const e of ENTRIES) entriesByDim.set(e.dimensionId, [...(entriesByDim.get(e.dimensionId) ?? []), e])

/** An entry tagged 'both' is visible everywhere; otherwise the usual layer rule. */
const xwShows = (filter, layer) => layer === 'both' || filter === 'all' || filter === layer

/** Effective leaf weight: the product of `weight` down the parent chain. */
const effectiveWeight = (dim) => {
  let w = 1
  let cur = dim
  for (let guard = 0; cur && guard < 8; guard++) {
    w *= typeof cur.weight === 'number' ? cur.weight : 0
    cur = cur.parentId ? dimById.get(cur.parentId) : null
  }
  return w
}

// ── 12. CROSSWALK-SHAPE ─────────────────────────────────────────────────
// Unknown keys FAIL. A typo'd key reads as undefined, contributes zero weight,
// and produces a scorecard that is quietly wrong rather than loudly broken —
// the exact failure this module keeps finding.
const shapeCheck = (label, rows, spec, required) => {
  const allowed = new Set(Object.keys(spec))
  for (const [i, row] of rows.entries()) {
    const where = `${label}[${i}]${row?.id ? ` (${row.id})` : ''}`
    if (typeof row !== 'object' || row === null) {
      fail('CROSSWALK-SHAPE', `${where} is not an object`)
      continue
    }
    for (const k of Object.keys(row))
      if (!allowed.has(k)) fail('CROSSWALK-SHAPE', `${where} has unknown field "${k}" — a typo'd key silently contributes nothing`)
    for (const [k, test] of Object.entries(spec)) {
      const present = row[k] !== undefined
      if (!present) {
        if (required.includes(k)) fail('CROSSWALK-SHAPE', `${where} is missing required field "${k}"`)
        continue
      }
      const problem = test(row[k])
      if (problem) fail('CROSSWALK-SHAPE', `${where} field "${k}" ${problem}`)
    }
  }
}

const str = (min = 1) => (v) => (typeof v !== 'string' ? `must be a string, got ${typeof v}` : v.trim().length < min ? `must be a non-empty string` : null)
const num = (v) => (typeof v !== 'number' || Number.isNaN(v) ? `must be a number, got ${JSON.stringify(v)}` : null)
const idLike = (re) => (v) => (typeof v !== 'string' ? 'must be a string' : re.test(v) ? null : `does not match ${re} — ids are zero-padded fixed width so code-unit order is numeric order`)
const oneOf = (vals) => (v) => (vals.includes(v) ? null : `must be one of ${vals.join(', ')}, got ${JSON.stringify(v)}`)

shapeCheck('framework', FRAMEWORKS, {
  id: idLike(/^FW-\d{2}$/),
  code: str(),
  name: str(),
  publisher: str(),
  versionLabel: str(),
  scaleMin: num,
  scaleMax: num,
  structureConfidence: oneOf(['high', 'medium-high', 'medium', 'low']),
  structureNotes: str(20),
}, ['id', 'code', 'name', 'publisher', 'versionLabel', 'scaleMin', 'scaleMax', 'structureConfidence', 'structureNotes'])

shapeCheck('dimension', DIMENSIONS, {
  id: idLike(/^DIM-\d{3}$/),
  frameworkId: idLike(/^FW-\d{2}$/),
  parentId: (v) => (v === null || /^DIM-\d{3}$/.test(String(v)) ? null : `must be null or a DIM-nnn id, got ${JSON.stringify(v)}`),
  code: str(),
  name: str(),
  weight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v}`),
  level: (v) => (v === 1 || v === 2 ? null : `must be 1 or 2, got ${JSON.stringify(v)}`),
}, ['id', 'frameworkId', 'parentId', 'code', 'name', 'weight', 'level'])

shapeCheck('crosswalkEntry', ENTRIES, {
  id: idLike(/^CW-\d{3}$/),
  dimensionId: idLike(/^DIM-\d{3}$/),
  pillarId: idLike(/^P\d{2}$/),
  coverageWeight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v} — a zero-weight mapping is a mapping that does nothing`),
  rationale: str(20),
  layer: oneOf(XW_LAYERS),
  questionIds: (v) => (Array.isArray(v) ? null : 'must be an array when present'),
}, ['id', 'dimensionId', 'pillarId', 'coverageWeight', 'rationale', 'layer'])

unique('framework', FRAMEWORKS.map((f) => f.id))
unique('dimension', DIMENSIONS.map((d) => d.id))
unique('crosswalkEntry', ENTRIES.map((e) => e.id))

for (const d of DIMENSIONS) {
  if (!frameworkById.has(d.frameworkId)) fail('CROSSWALK-SHAPE', `dimension ${d.id} -> framework ${d.frameworkId} does not exist`)
  if (d.parentId !== null) {
    const parent = dimById.get(d.parentId)
    if (!parent) fail('CROSSWALK-SHAPE', `dimension ${d.id} -> parent ${d.parentId} does not exist`)
    else if (parent.frameworkId !== d.frameworkId) fail('CROSSWALK-SHAPE', `dimension ${d.id} has a parent in a different framework`)
    else if (parent.level >= d.level) fail('CROSSWALK-SHAPE', `dimension ${d.id} (level ${d.level}) has parent ${d.parentId} at level ${parent.level}`)
  } else if (d.level !== 1) {
    fail('CROSSWALK-SHAPE', `dimension ${d.id} has no parent but is level ${d.level}`)
  }
}

// Declared sort. Same discipline as the CSV registers: the order is a property
// of the file, not of whatever the author happened to type.
const sorted = (name, ids) => {
  for (let i = 1; i < ids.length; i++)
    if (!(ids[i - 1] < ids[i])) {
      fail('CROSSWALK-SHAPE', `${name} is not sorted by id: ${ids[i - 1]} precedes ${ids[i]}`)
      break
    }
}
sorted('frameworks', FRAMEWORKS.map((f) => f.id))
sorted('dimensions', DIMENSIONS.map((d) => d.id))
sorted('crosswalk entries', ENTRIES.map((e) => e.id))

// ── 13. CROSSWALK-WEIGHT ────────────────────────────────────────────────
// coverageWeights per leaf dimension sum to 1.0 over the FULL entry set. A
// dimension summing to 0.7 silently under-scores; one summing to 1.3 silently
// inflates, and neither shows up as anything but a slightly odd number.
//
// Sibling `weight` is checked here too. It is not in the original spec, but
// without it effective leaf weights do not sum to 1.0 per framework, the induced
// pillar weight vector does not sum to 1.0, and CROSSWALK-DISTINCTNESS is
// comparing vectors of different total mass — the L1 threshold would then be
// measuring the authoring error rather than the frameworks.
const near = (a, b, eps = 0.001) => Math.abs(a - b) <= eps
const retainedShare = {}

for (const d of leafDims) {
  const es = entriesByDim.get(d.id) ?? []
  if (es.length === 0) continue // reported by CROSSWALK-ORPHAN
  const total = es.reduce((s, e) => s + (typeof e.coverageWeight === 'number' ? e.coverageWeight : 0), 0)
  if (!near(total, 1))
    fail('CROSSWALK-WEIGHT', `leaf dimension ${d.id} (${d.code}) coverageWeights sum to ${total.toFixed(4)}, not 1.0 — the dimension would be ${total < 1 ? 'under-scored' : 'inflated'} by ${(Math.abs(1 - total) * 100).toFixed(1)}%`)

  retainedShare[d.id] = {}
  for (const layer of ['core', 'banking', 'all'])
    retainedShare[d.id][layer] = es.filter((e) => xwShows(layer, e.layer)).reduce((s, e) => s + e.coverageWeight, 0)
}

// A dimension with no visible mapping under a layer where its framework is
// otherwise in scope is an authoring gap dressed as a legitimate not-applicable.
for (const d of leafDims) {
  const share = retainedShare[d.id]
  if (!share) continue
  for (const layer of ['core', 'banking']) {
    const frameworkInScope = leafDims.some((o) => o.frameworkId === d.frameworkId && (retainedShare[o.id]?.[layer] ?? 0) > 0)
    if (share[layer] === 0 && frameworkInScope)
      fail('CROSSWALK-WEIGHT', `leaf dimension ${d.id} (${d.code}) retains 0 weight under the ${layer} layer while its framework is otherwise in scope — every mapping it has is tagged for the other layer, which is an authoring gap, not a not-applicable`)
  }
}

// Dimension weights: siblings sum to 1.0 within each parent, and level-1
// dimensions sum to 1.0 within each framework.
for (const f of FRAMEWORKS) {
  const tops = DIMENSIONS.filter((d) => d.frameworkId === f.id && d.parentId === null)
  const total = tops.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
  if (tops.length && !near(total, 1))
    fail('CROSSWALK-WEIGHT', `framework ${f.id} (${f.code}) level-1 dimension weights sum to ${total.toFixed(4)}, not 1.0 — its induced pillar weight vector would not sum to 1 and could not be compared with the others`)
}
for (const parentId of hasChildren) {
  const kids = DIMENSIONS.filter((d) => d.parentId === parentId)
  const total = kids.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
  if (!near(total, 1))
    fail('CROSSWALK-WEIGHT', `children of ${parentId} have weights summing to ${total.toFixed(4)}, not 1.0`)
}

// ── 14. CROSSWALK-ORPHAN ────────────────────────────────────────────────
for (const e of ENTRIES) {
  const d = dimById.get(e.dimensionId)
  if (!d) fail('CROSSWALK-ORPHAN', `entry ${e.id} -> dimension ${e.dimensionId} does not exist`)
  else if (hasChildren.has(d.id))
    fail('CROSSWALK-ORPHAN', `entry ${e.id} maps ${d.id} (${d.code}), which has children — projection is leaf-only, and a parent counting a pillar its children also count double-counts the same evidence`)
  if (!pillarIds.has(e.pillarId)) fail('CROSSWALK-ORPHAN', `entry ${e.id} -> pillar ${e.pillarId} does not exist`)
}
for (const d of leafDims)
  if (!(entriesByDim.get(d.id) ?? []).length)
    fail('CROSSWALK-ORPHAN', `leaf dimension ${d.id} (${d.code}) has no mapping — it would render as an unexplained blank on the scorecard`)

const unmappedPillars = [...pillarIds].filter((p) => !ENTRIES.some((e) => e.pillarId === p)).sort()

// ── 15. FRAMEWORK-COVERAGE (informational) ──────────────────────────────
const coverage = FRAMEWORKS.map((f) => {
  const leaves = leafDims.filter((d) => d.frameworkId === f.id)
  const per = {}
  for (const layer of ['core', 'banking', 'all']) {
    const ps = new Set()
    for (const d of leaves)
      for (const e of entriesByDim.get(d.id) ?? [])
        if (xwShows(layer, e.layer) && pillarIds.has(e.pillarId)) ps.add(e.pillarId)
    per[layer] = ps.size
  }
  return { f, leaves: leaves.length, entries: leaves.reduce((s, d) => s + (entriesByDim.get(d.id) ?? []).length, 0), per }
})

// ── 16. CROSSWALK-DISTINCTNESS ──────────────────────────────────────────
// W_p = Σ_d (effectiveLeafWeight_d × coverageWeight_d,p), computed over the full
// entry set. Four frameworks whose induced vectors are nearly equal produce four
// nearly identical scorecards, which is the whole proposition failing silently —
// and it is visible from the crosswalk alone, with no answers, which is why this
// is a check rather than a report.
const DISTINCTNESS_MIN = 0.15
const inducedW = new Map()
for (const f of FRAMEWORKS) {
  const v = Object.fromEntries([...pillarIds].map((p) => [p, 0]))
  for (const d of leafDims.filter((x) => x.frameworkId === f.id)) {
    const ew = effectiveWeight(d)
    for (const e of entriesByDim.get(d.id) ?? [])
      if (v[e.pillarId] !== undefined) v[e.pillarId] += ew * e.coverageWeight
  }
  inducedW.set(f.id, v)
}
const pillarOrder = [...pillarIds].sort()
const l1Pairs = []
for (let i = 0; i < FRAMEWORKS.length; i++)
  for (let k = i + 1; k < FRAMEWORKS.length; k++) {
    const a = FRAMEWORKS[i]
    const b = FRAMEWORKS[k]
    const va = inducedW.get(a.id)
    const vb = inducedW.get(b.id)
    const l1 = pillarOrder.reduce((s, p) => s + Math.abs(va[p] - vb[p]), 0)
    l1Pairs.push({ a: a.code, b: b.code, l1 })
    if (l1 < DISTINCTNESS_MIN)
      fail('CROSSWALK-DISTINCTNESS', `${a.code} and ${b.code} have induced pillar weight vectors only ${l1.toFixed(3)} apart in L1, below the ${DISTINCTNESS_MIN} floor. Every framework score is a convex combination of the same 11 pillar scores, so two frameworks this close produce two scorecards a client cannot tell apart. The floor is not arbitrary: DGI and COBIT EDM are genuinely near-identical governance frameworks and a distance around 0.16 is expected and accepted — what this catches is a near-uniform crosswalk, where spread across all four collapses toward 0.02 and the four scorecards become one.`)
  }

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
console.log(
  `  CROSSWALK ${FRAMEWORKS.length} frameworks  ${DIMENSIONS.length} dimensions (${leafDims.length} leaf)  ${ENTRIES.length} mappings` +
    `  ${unmappedPillars.length === 0 ? 'every pillar mapped' : `UNMAPPED PILLARS: ${unmappedPillars.join(', ')}`}`,
)
for (const c of coverage)
  console.log(
    `    ${c.f.code.padEnd(9)} ${String(c.leaves).padStart(2)} leaf dims, ${String(c.entries).padStart(3)} mappings` +
      `  pillars core ${c.per.core}/${pillarIds.size}  banking ${c.per.banking}/${pillarIds.size}  all ${c.per.all}/${pillarIds.size}` +
      `  (${Math.round((c.per.all / pillarIds.size) * 100)}% at 'all')  structure confidence: ${c.f.structureConfidence}`,
  )
console.log(
  `    distinctness (L1, floor ${DISTINCTNESS_MIN}): ` +
    l1Pairs.map((p) => `${p.a}/${p.b} ${p.l1.toFixed(3)}`).join('  '),
)

// The Phase B scoreboard. Informational: it is printed on every build so the gap
// between what the register catalogues and what the workbench can actually
// produce stays visible instead of being rediscovered.
const implFails = fails.filter((f) => f.startsWith('ARTEFACT-IMPL')).length
const covered = [...implementedArtefacts.keys()].sort()
console.log(
  `  ARTEFACT-IMPL ${covered.length} of ${plan.artefactRegister.length} catalogued artefacts have a generator` +
    ` (${covered.join(', ') || 'none'}); ${digestsChecked} createReport call${digestsChecked === 1 ? '' : 's'} checked for a content digest` +
    `${implFails ? ` — ${implFails} REJECTED, see below` : ''}`,
)

if (fails.length) {
  console.error(`\n${fails.length} problem${fails.length > 1 ? 's' : ''}:`)
  for (const f of fails) console.error('  ' + f)
  process.exit(1)
}
console.log('\n  OK — all checks passed')
