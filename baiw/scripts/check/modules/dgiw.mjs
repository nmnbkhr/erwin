/**
 * DGIW — Data Governance. The module's dataset integrity rules.
 *
 * The workbench is eleven hand-authored JSON datasets that reference each other by
 * id and are sliced at runtime by a layer filter. TypeScript checks their shape;
 * nothing checked their *content*, and the defects that reached the UI were all
 * content defects — a rule pointing at a CDE that the layer filter had removed, a
 * blocking gate no flow ran, a pillar the diagnostic could score but no wave
 * addressed, an owner string that named two accountable people.
 *
 * Every check here was §1–§9 or §12–§17 of check-dgiw.mjs and is unchanged in
 * substance. Three things did change, all of them decided in D3 step 1:
 *
 *   - CROSSWALK-ORPHAN now FAILS on a pillar no framework maps. The unmapped list
 *     was computed and printed, and nothing more.
 *   - FRAMEWORK-COVERAGE now has a failure path at all. It was five lines of
 *     arithmetic feeding a printed table, documented in CLAUDE.md as one of "five
 *     check classes" that guard the crosswalk, and it could not fail.
 *   - CROSSWALK-DISTINCTNESS reports the projection load failure under its own
 *     name. One esbuild failure disabled two classes and only PROJECTION-INVARIANT
 *     said so; the other went silent behind `projection ? … : []`.
 */
import { unique, sorted, near, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'

const LAYERS = ['core', 'banking']
const DIMS = ['Completeness', 'Validity', 'Accuracy', 'Consistency', 'Uniqueness', 'Timeliness', 'Integrity']
const XW_LAYERS = ['core', 'banking', 'both']
const DISTINCTNESS_MIN = 0.15
const EPS = 1e-9

/** An entry tagged 'both' is visible everywhere; otherwise the usual layer rule. */
const xwShows = (filter, layer) => layer === 'both' || filter === 'all' || filter === layer

// ── 1. every layer-tagged record carries a valid layer ──────────────────────
const layerTags = {
  code: 'LAYER',
  run(ctx) {
    const { diag, om, cdes, rules, prog, plan, pos, ladder } = ctx.data
    const { fail } = ctx
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
    let examined = 0
    for (const [name, rows] of layered)
      for (const r of rows) {
        examined++
        if (!LAYERS.includes(r.layer)) fail(`${name} "${r.id ?? r.name}" has layer=${JSON.stringify(r.layer)}`)
      }
    for (const rung of ladder)
      for (const d of rung.deliverables) {
        examined++
        if (!LAYERS.includes(d.layer)) fail(`ladder rung ${rung.rung} deliverable "${d.name}" layer=${d.layer}`)
      }
    return { examined }
  },
}

// ── 2. ids are unique ───────────────────────────────────────────────────────
const uniqueIds = {
  code: 'UNIQUE',
  run(ctx) {
    const { pillars, diag, cdes, rules, prog, plan, om } = ctx.data
    const f = ctx.failAs
    let examined = 0
    examined += unique(f, 'UNIQUE', 'pillar', pillars.map((p) => p.id))
    examined += unique(f, 'UNIQUE', 'question', diag.questions.map((q) => q.id))
    examined += unique(f, 'UNIQUE', 'cde', cdes.map((c) => c.id))
    examined += unique(f, 'UNIQUE', 'dqRule', rules.map((r) => r.id))
    examined += unique(f, 'UNIQUE', 'checklist', prog.checklist.map((c) => c.id))
    examined += unique(f, 'UNIQUE', 'artefact', plan.artefactRegister.map((a) => a.id))
    examined += unique(f, 'UNIQUE', 'role', om.roles.map((r) => r.id))
    examined += unique(f, 'UNIQUE', 'gate', om.gates.map((g) => g.id))
    examined += unique(f, 'UNIQUE', 'wave', plan.waves.map((w) => w.id))
    examined += unique(f, 'UNIQUE', 'programStep', prog.flows.flatMap((fl) => fl.steps.map((s) => s.id)))
    examined += unique(f, 'UNIQUE', 'roleRegistry', (om.roleRegistry ?? []).map((r) => r.name))
    return { examined }
  },
}

// ── 3. foreign keys ─────────────────────────────────────────────────────────
const foreignKeys = {
  code: 'FK',
  run(ctx) {
    const { diag, prog, plan, rules } = ctx.data
    const { pillarIds, rungNums, cdeById } = ctx.state
    const { fail } = ctx
    let examined = 0
    for (const q of diag.questions) { examined++; if (!pillarIds.has(q.pillarId)) fail(`question ${q.id} -> pillar ${q.pillarId}`) }
    for (const c of prog.checklist) { examined++; if (!pillarIds.has(c.pillarId)) fail(`checklist ${c.id} -> pillar ${c.pillarId}`) }
    for (const w of plan.waves)
      for (const p of w.pillarIds) { examined++; if (!pillarIds.has(p)) fail(`wave ${w.id} -> pillar ${p}`) }
    for (const a of plan.artefactRegister) {
      examined += 2
      if (!pillarIds.has(a.pillarId)) fail(`artefact ${a.id} -> pillar ${a.pillarId}`)
      if (!rungNums.has(a.rung)) fail(`artefact ${a.id} -> ladder rung ${a.rung}`)
    }
    for (const r of rules) { examined++; if (!cdeById.has(r.cdeRef)) fail(`dqRule ${r.id} -> cde ${r.cdeRef}`) }
    return { examined }
  },
}

// ── 4. enums and shapes ─────────────────────────────────────────────────────
const enumsAndShapes = {
  code: 'ENUM',
  run(ctx) {
    const { rules, cdes, diag } = ctx.data
    const { fail, failAs } = ctx
    let examined = 0
    for (const r of rules) {
      examined++
      if (!DIMS.includes(r.dimension)) fail(`dqRule ${r.id} dimension "${r.dimension}"`)
      if (!['BLOCKER', 'HIGH', 'MEDIUM'].includes(r.severity)) fail(`dqRule ${r.id} severity "${r.severity}"`)
    }
    for (const c of cdes) {
      examined++
      if (!['CRITICAL', 'HIGH', 'MEDIUM'].includes(c.criticality)) fail(`cde ${c.id} criticality "${c.criticality}"`)
      for (const d of c.dqDimensions) if (!DIMS.includes(d)) fail(`cde ${c.id} dqDimension "${d}"`)
      if (!c.consumers?.length)
        failAs('SHAPE', `cde ${c.id} has no consumers — criticality is derived from consumption, so this is unfounded`)
    }
    for (const q of diag.questions) {
      examined++
      if (![1, 2, 3].includes(q.weight)) fail(`question ${q.id} weight ${q.weight}`)
      const lv = Object.keys(q.levelDescriptions).sort().join(',')
      if (lv !== '1,2,3,4,5') failAs('SHAPE', `question ${q.id} levelDescriptions keys = [${lv}], expected 1..5`)
    }
    return { examined }
  },
}

// ── 5. accountability resolves, and is singular ─────────────────────────────
// Every owner string must resolve to a governance archetype. Compound owners are
// rejected outright: two accountable parties is the same as none.
const accountability = {
  code: 'OWNER-UNRESOLVED',
  run(ctx) {
    const { cdes, prog, plan, om } = ctx.data
    const { registry, roleIds } = ctx.state
    const { fail, failAs } = ctx
    const ownerRefs = [
      ...cdes.map((c) => [`cde ${c.id}`, c, 'ownerRole']),
      ...prog.checklist.map((c) => [`checklist ${c.id}`, c, 'owner']),
      ...plan.artefactRegister.map((a) => [`artefact ${a.id}`, a, 'owner']),
      ...prog.flows.flatMap((f) => f.steps.map((s) => [`step ${s.id}`, s, 'owner'])),
    ]
    for (const [where, rec, field] of ownerRefs) {
      const o = rec[field]
      if (/ with | and |,|\//.test(o) && !registry.has(o))
        failAs('OWNER-COMPOUND', `${where} owner "${o}" names more than one accountable party`)
      const entry = registry.get(o)
      if (!entry) {
        fail(`${where} owner "${o}" is not in operatingModel.roleRegistry`)
      } else if (rec.layer === 'core' && entry.layer === 'banking') {
        failAs('OWNER-LAYER', `core record ${where} is owned by banking-only role "${o}" — unresolvable in a core-only engagement`)
      }
      for (const s of rec.support ?? [])
        if (!registry.has(s)) fail(`${where} support "${s}" is not in operatingModel.roleRegistry`)
    }
    for (const r of om.roleRegistry ?? [])
      if (!roleIds.has(r.archetype)) failAs('FK', `roleRegistry "${r.name}" -> archetype ${r.archetype} is not a role id`)
    return { examined: ownerRefs.length }
  },
}

// ── 6. gates are referential, and every gate is actually run ────────────────
const gates = {
  code: 'GATE',
  run(ctx) {
    const { prog, om } = ctx.data
    const { gateById } = ctx.state
    const { fail, failAs } = ctx
    const gateUse = new Map()
    for (const f of prog.flows) {
      if (!Array.isArray(f.gateIds)) { fail(`flow ${f.id} has no gateIds array`); continue }
      if (f.gateIds.length === 0) fail(`flow ${f.id} passes through no gate`)
      for (const g of f.gateIds) {
        if (!gateById.has(g)) failAs('FK', `flow ${f.id} -> gate ${g}`)
        gateUse.set(g, [...(gateUse.get(g) ?? []), f.id])
      }
    }
    for (const g of om.gates) {
      const used = gateUse.get(g.id)
      if (!used)
        failAs('GATE-ORPHAN', `gate ${g.id} "${g.name}"${g.blocking ? ' [BLOCKING]' : ''} is referenced by no flow — a control nobody runs`)
      else if (used.length > 1)
        failAs('GATE-DUP', `gate ${g.id} is claimed by flows ${used.join(', ')} — ownership of a gate must be singular`)
    }
    return { examined: prog.flows.length + om.gates.length }
  },
}

// ── 7. the wave graph ───────────────────────────────────────────────────────
const waveGraph = {
  code: 'WAVE',
  run(ctx) {
    const { plan } = ctx.data
    const { waveById } = ctx.state
    const { fail, failAs } = ctx
    for (const w of plan.waves) {
      if (!Array.isArray(w.dependsOn)) { fail(`wave ${w.id} has no dependsOn array`); continue }
      for (const d of w.dependsOn) {
        const dep = waveById.get(d)
        if (!dep) { failAs('FK', `wave ${w.id} dependsOn ${d}`); continue }
        if (dep.wave >= w.wave) failAs('WAVE-ORDER', `wave ${w.id} depends on ${d}, which is not scheduled earlier`)
        // The banking overlay is additive. A core wave that needs a banking wave means
        // a core-only engagement cannot execute the core plan.
        if (w.layer === 'core' && dep.layer === 'banking')
          failAs('WAVE-LAYER', `core wave ${w.id} depends on banking wave ${d} — breaks a core-only engagement`)
      }
    }
    // Cycle detection, in case dependsOn ever stops implying wave order.
    const state = new Map()
    const visit = (id, trail) => {
      if (state.get(id) === 'done') return
      if (state.get(id) === 'open') return failAs('WAVE-CYCLE', `dependency cycle: ${[...trail, id].join(' -> ')}`)
      state.set(id, 'open')
      for (const d of waveById.get(id)?.dependsOn ?? []) if (waveById.has(d)) visit(d, [...trail, id])
      state.set(id, 'done')
    }
    for (const w of plan.waves) visit(w.id, [])
    return { examined: plan.waves.length }
  },
}

// ── 8. layer coherence — nothing may dangle when the filter is applied ──────
const layerCoherence = {
  code: 'LAYER-COHERENCE',
  run(ctx) {
    const { rules, diag, plan } = ctx.data
    const { cdeById, pillarIds } = ctx.state
    const { fail, failAs } = ctx
    for (const r of rules)
      if (r.layer === 'core' && cdeById.get(r.cdeRef)?.layer === 'banking')
        fail(`core dqRule ${r.id} references banking-only CDE ${r.cdeRef} — orphaned in a core-only engagement`)

    for (const p of pillarIds) {
      const qs = diag.questions.filter((q) => q.pillarId === p)
      if (!qs.length) failAs('COVERAGE', `pillar ${p} has no diagnostic questions`)
      else if (!qs.some((q) => q.layer === 'core'))
        fail(`pillar ${p} has ${qs.length} questions, none 'core' — unassessable in a core-only engagement`)
    }

    // Every pillar the diagnostic can score must have a wave that addresses it, or the
    // derived roadmap — the diagnostic's headline output — renders an empty cell.
    // Core waves apply in every engagement; banking waves only when banking is in scope.
    for (const layer of LAYERS)
      for (const p of pillarIds) {
        if (!diag.questions.some((q) => q.pillarId === p && q.layer === layer)) continue
        const addressed = plan.waves.some((w) => w.pillarIds.includes(p) && (w.layer === 'core' || w.layer === layer))
        if (!addressed) failAs('ROADMAP', `pillar ${p} is scorable in ${layer} mode but no applicable wave addresses it`)
      }
    return { examined: rules.length + pillarIds.size * (1 + LAYERS.length) }
  },
}

// ── 9. the core chassis must not be hollow ──────────────────────────────────
// The module is sold as sector-neutral core plus banking overlay. A core-only
// engagement that opens the CDE register to four rows about governance metadata
// does not support that claim.
const coreChassis = {
  code: 'CORE-CHASSIS',
  run(ctx) {
    const { cdes, rules } = ctx.data
    const { fail } = ctx
    const coreCdes = cdes.filter((c) => c.layer === 'core')
    const coreDomains = new Set(coreCdes.map((c) => c.domain))
    if (coreCdes.length < 15) fail(`only ${coreCdes.length} core CDEs — a core-only engagement has no register to work from`)
    if (coreDomains.size < 6) fail(`core CDEs span only ${coreDomains.size} domains`)
    for (const c of coreCdes)
      if (!rules.some((r) => r.cdeRef === c.id && r.layer === 'core'))
        fail(`core CDE ${c.id} "${c.element}" has no core DQ rule — it cannot be measured`)
    return { examined: coreCdes.length }
  },
}

// ── 12. CROSSWALK-SHAPE ─────────────────────────────────────────────────────
// One assessment, four framework scorecards. The eleven pillars stay canonical;
// a framework is a different vocabulary and emphasis over the same evidence.
//
// NOTHING imports frameworks.json or crosswalk.json, so tsc never sees them and
// lint never sees them. These five classes are the entire guard, not defence in
// depth — which is why this one checks types and unknown keys rather than
// assuming the file is well formed.
const crosswalkShape = {
  code: 'CROSSWALK-SHAPE',
  run(ctx) {
    const { FRAMEWORKS, DIMENSIONS, ENTRIES, frameworkById, dimById } = ctx.state
    const { fail } = ctx
    // The shared assertions take an explicit code: `unique` emits UNIQUE wherever
    // it is called from, and shapeCheck/sorted emit whichever code the caller owns.
    const f = ctx.failAs

    shapeCheck(f, 'CROSSWALK-SHAPE', 'framework', FRAMEWORKS, {
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

    shapeCheck(f, 'CROSSWALK-SHAPE', 'dimension', DIMENSIONS, {
      id: idLike(/^DIM-\d{3}$/),
      frameworkId: idLike(/^FW-\d{2}$/),
      parentId: (v) => (v === null || /^DIM-\d{3}$/.test(String(v)) ? null : `must be null or a DIM-nnn id, got ${JSON.stringify(v)}`),
      code: str(),
      name: str(),
      weight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v}`),
      level: (v) => (v === 1 || v === 2 ? null : `must be 1 or 2, got ${JSON.stringify(v)}`),
    }, ['id', 'frameworkId', 'parentId', 'code', 'name', 'weight', 'level'])

    shapeCheck(f, 'CROSSWALK-SHAPE', 'crosswalkEntry', ENTRIES, {
      id: idLike(/^CW-\d{3}$/),
      dimensionId: idLike(/^DIM-\d{3}$/),
      pillarId: idLike(/^P\d{2}$/),
      coverageWeight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v} — a zero-weight mapping is a mapping that does nothing`),
      rationale: str(20),
      layer: oneOf(XW_LAYERS),
      questionIds: (v) => (Array.isArray(v) ? null : 'must be an array when present'),
    }, ['id', 'dimensionId', 'pillarId', 'coverageWeight', 'rationale', 'layer'])

    unique(f, 'UNIQUE', 'framework', FRAMEWORKS.map((x) => x.id))
    unique(f, 'UNIQUE', 'dimension', DIMENSIONS.map((d) => d.id))
    unique(f, 'UNIQUE', 'crosswalkEntry', ENTRIES.map((e) => e.id))

    for (const d of DIMENSIONS) {
      if (!frameworkById.has(d.frameworkId)) fail(`dimension ${d.id} -> framework ${d.frameworkId} does not exist`)
      if (d.parentId !== null) {
        const parent = dimById.get(d.parentId)
        if (!parent) fail(`dimension ${d.id} -> parent ${d.parentId} does not exist`)
        else if (parent.frameworkId !== d.frameworkId) fail(`dimension ${d.id} has a parent in a different framework`)
        else if (parent.level >= d.level) fail(`dimension ${d.id} (level ${d.level}) has parent ${d.parentId} at level ${parent.level}`)
      } else if (d.level !== 1) {
        fail(`dimension ${d.id} has no parent but is level ${d.level}`)
      }
    }

    sorted(f, 'CROSSWALK-SHAPE', 'frameworks', FRAMEWORKS.map((x) => x.id))
    sorted(f, 'CROSSWALK-SHAPE', 'dimensions', DIMENSIONS.map((d) => d.id))
    sorted(f, 'CROSSWALK-SHAPE', 'crosswalk entries', ENTRIES.map((e) => e.id))

    return { examined: FRAMEWORKS.length + DIMENSIONS.length + ENTRIES.length }
  },
}

// ── 13. CROSSWALK-WEIGHT ────────────────────────────────────────────────────
// coverageWeights per leaf dimension sum to 1.0 over the FULL entry set. A
// dimension summing to 0.7 silently under-scores; one summing to 1.3 silently
// inflates, and neither shows up as anything but a slightly odd number.
//
// Sibling `weight` is checked here too. It is not in the original spec, but
// without it effective leaf weights do not sum to 1.0 per framework, the induced
// pillar weight vector does not sum to 1.0, and CROSSWALK-DISTINCTNESS is
// comparing vectors of different total mass — the L1 threshold would then be
// measuring the authoring error rather than the frameworks.
const crosswalkWeight = {
  code: 'CROSSWALK-WEIGHT',
  run(ctx) {
    const { FRAMEWORKS, DIMENSIONS, leafDims, entriesByDim, hasChildren } = ctx.state
    const { fail } = ctx
    const retainedShare = {}

    for (const d of leafDims) {
      const es = entriesByDim.get(d.id) ?? []
      if (es.length === 0) continue // reported by CROSSWALK-ORPHAN
      const total = es.reduce((s, e) => s + (typeof e.coverageWeight === 'number' ? e.coverageWeight : 0), 0)
      if (!near(total, 1))
        fail(`leaf dimension ${d.id} (${d.code}) coverageWeights sum to ${total.toFixed(4)}, not 1.0 — the dimension would be ${total < 1 ? 'under-scored' : 'inflated'} by ${(Math.abs(1 - total) * 100).toFixed(1)}%`)

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
          fail(`leaf dimension ${d.id} (${d.code}) retains 0 weight under the ${layer} layer while its framework is otherwise in scope — every mapping it has is tagged for the other layer, which is an authoring gap, not a not-applicable`)
      }
    }

    // Dimension weights: siblings sum to 1.0 within each parent, and level-1
    // dimensions sum to 1.0 within each framework.
    for (const f of FRAMEWORKS) {
      const tops = DIMENSIONS.filter((d) => d.frameworkId === f.id && d.parentId === null)
      const total = tops.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
      if (tops.length && !near(total, 1))
        fail(`framework ${f.id} (${f.code}) level-1 dimension weights sum to ${total.toFixed(4)}, not 1.0 — its induced pillar weight vector would not sum to 1 and could not be compared with the others`)
    }
    for (const parentId of hasChildren) {
      const kids = DIMENSIONS.filter((d) => d.parentId === parentId)
      const total = kids.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
      if (!near(total, 1)) fail(`children of ${parentId} have weights summing to ${total.toFixed(4)}, not 1.0`)
    }

    return { examined: leafDims.length + FRAMEWORKS.length + hasChildren.size }
  },
}

// ── 14. CROSSWALK-ORPHAN ────────────────────────────────────────────────────
const crosswalkOrphan = {
  code: 'CROSSWALK-ORPHAN',
  run(ctx) {
    const { FRAMEWORKS, ENTRIES, dimById, hasChildren, leafDims, entriesByDim, pillarIds } = ctx.state
    const { fail } = ctx
    for (const e of ENTRIES) {
      const d = dimById.get(e.dimensionId)
      if (!d) fail(`entry ${e.id} -> dimension ${e.dimensionId} does not exist`)
      else if (hasChildren.has(d.id))
        fail(`entry ${e.id} maps ${d.id} (${d.code}), which has children — projection is leaf-only, and a parent counting a pillar its children also count double-counts the same evidence`)
      if (!pillarIds.has(e.pillarId)) fail(`entry ${e.id} -> pillar ${e.pillarId} does not exist`)
    }
    for (const d of leafDims)
      if (!(entriesByDim.get(d.id) ?? []).length)
        fail(`leaf dimension ${d.id} (${d.code}) has no mapping — it would render as an unexplained blank on the scorecard`)

    // The other direction, and until D3 it only printed. A pillar no framework maps
    // is scorable on the diagnostic and absent from all four scorecards, so a client
    // comparing them sees evidence that counts toward nothing. That is the same
    // defect as a leaf dimension with no mapping, read from the pillar side, and it
    // now fails like one. The summary line still names them.
    const unmappedPillars = [...pillarIds].filter((p) => !ENTRIES.some((e) => e.pillarId === p)).sort()
    for (const p of unmappedPillars)
      fail(`pillar ${p} is mapped by no crosswalk entry in any of the ${FRAMEWORKS.length} frameworks — it is scorable on the diagnostic and contributes to none of the four scorecards, so the evidence behind it counts toward nothing a client is shown`)

    return { examined: ENTRIES.length + leafDims.length + pillarIds.size, unmappedPillars }
  },
}

// ── 15. FRAMEWORK-COVERAGE ──────────────────────────────────────────────────
// How many pillars each framework reaches, per layer. This was informational and
// nothing more: five lines of arithmetic, a printed table, no failure path, and a
// line in CLAUDE.md calling it one of "five check classes" that guard the
// crosswalk. D3 gives it the one failure it always implied.
//
// The rule is CROSSWALK-WEIGHT's retained-share rule one level up. A framework
// that reaches pillars at 'all' but zero under a layer has every mapping tagged
// for the other layer — an engagement at that layer renders its scorecard blank
// with no stated reason, which is an authoring gap wearing a not-applicable
// costume. A framework reaching zero pillars everywhere is not this defect; it
// is CROSSWALK-ORPHAN's, per leaf dimension, and is left to it.
const frameworkCoverage = {
  code: 'FRAMEWORK-COVERAGE',
  run(ctx) {
    const { FRAMEWORKS, leafDims, entriesByDim, pillarIds } = ctx.state
    const { fail } = ctx
    const coverage = FRAMEWORKS.map((f) => {
      const leaves = leafDims.filter((d) => d.frameworkId === f.id)
      const per = {}
      for (const layer of ['core', 'banking', 'all']) {
        const ps = new Set()
        for (const d of leaves)
          for (const e of entriesByDim.get(d.id) ?? []) if (xwShows(layer, e.layer) && pillarIds.has(e.pillarId)) ps.add(e.pillarId)
        per[layer] = ps.size
      }
      return { f, leaves: leaves.length, entries: leaves.reduce((s, d) => s + (entriesByDim.get(d.id) ?? []).length, 0), per }
    })

    for (const c of coverage)
      for (const layer of ['core', 'banking'])
        if (c.per[layer] === 0 && c.per.all > 0)
          fail(`framework ${c.f.id} (${c.f.code}) covers 0 of ${pillarIds.size} pillars under the ${layer} layer while covering ${c.per.all} at 'all' — every mapping it has is tagged for the other layer, so an engagement at this layer would render its scorecard blank with no stated reason. Same authoring gap CROSSWALK-WEIGHT rejects per leaf dimension, read per framework.`)

    return { examined: coverage.length * 3, coverage }
  },
}

// ── 16. CROSSWALK-DISTINCTNESS ──────────────────────────────────────────────
// W_p = Σ_d (effectiveLeafWeight_d × coverageWeight_d,p), computed over the full
// entry set. Four frameworks whose induced vectors are nearly equal produce four
// nearly identical scorecards, which is the whole proposition failing silently —
// and it is visible from the crosswalk alone, with no answers, which is why this
// is a check rather than a report.
const crosswalkDistinctness = {
  code: 'CROSSWALK-DISTINCTNESS',
  run(ctx) {
    const { FRAMEWORKS, pillarIds } = ctx.state
    const { fail } = ctx

    // Under its own name. This used to be `projection ? … : []`, so an esbuild
    // failure disabled this class entirely while only PROJECTION-INVARIANT
    // reported it — one finding for two dead checks.
    if (!ctx.ts?.projection) {
      fail(`could not build or load projection.ts — the induced pillar weight vectors were NOT compared and this class did not run: ${ctx.tsLoadError ?? 'projection module unavailable'}`)
      return { examined: 0, l1Pairs: [] }
    }
    const { projection } = ctx.ts

    const inducedW = new Map(FRAMEWORKS.map((f) => [f.id, projection.inducedPillarWeights(f.id, 'all')]))
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
          fail(`${a.code} and ${b.code} have induced pillar weight vectors only ${l1.toFixed(3)} apart in L1, below the ${DISTINCTNESS_MIN} floor. Every framework score is a convex combination of the same 11 pillar scores, so two frameworks this close produce two scorecards a client cannot tell apart. The floor is not arbitrary: DGI and COBIT EDM are genuinely near-identical governance frameworks and a distance around 0.16 is expected and accepted — what this catches is a near-uniform crosswalk, where spread across all four collapses toward 0.02 and the four scorecards become one.`)
      }
    return { examined: l1Pairs.length, l1Pairs }
  },
}

// ── 17. PROJECTION-INVARIANT ────────────────────────────────────────────────
// Four properties that must hold for every profile. They are a BUILD GATE, not a
// one-time browser check: render code and new frameworks are both ways for the
// maths to drift without anyone noticing.
//
// Profiles are synthetic and fully deterministic — no user data, no clock, no
// network. The seeded one uses a fixed LCG over question ids in sorted order, so
// it is the same profile on every machine and every run.
const projectionInvariant = {
  code: 'PROJECTION-INVARIANT',
  run(ctx) {
    const { pillars, diag } = ctx.data
    const { fail } = ctx

    if (!ctx.ts?.projection || !ctx.ts?.scoring) {
      // Loudly, never silently. A skipped invariant check is worse than none,
      // because the build still says OK.
      fail(`could not build or load projection.ts — the invariants were NOT checked: ${ctx.tsLoadError ?? 'projection or scoring module unavailable'}`)
      return { examined: 0 }
    }
    const { projection, scoring } = ctx.ts

    const QIDS = [...diag.questions].map((q) => q.id).sort()
    const QBY = new Map(diag.questions.map((q) => [q.id, q]))
    const constantProfile = (v) => Object.fromEntries(QIDS.map((id) => [id, v]))
    const seededProfile = () => {
      // Numerical Recipes LCG. Not for randomness — for a fixed, spread-out profile
      // that nobody chose by hand and that is identical everywhere.
      let s = 12345
      const out = {}
      for (const id of QIDS) {
        s = (s * 1103515245 + 12345) % 2147483648
        out[id] = 1 + (s % 5)
      }
      return out
    }
    const withoutPillars = (base, skip) =>
      Object.fromEntries(Object.entries(base).filter(([id]) => !skip.includes(QBY.get(id)?.pillarId)))

    const SEEDED = seededProfile()
    const PROFILES = [
      { name: 'flat 3.0', layer: 'all', answers: constantProfile(3), flat: true },
      // The same flat profile under core, and it is NOT redundant. At layer 'all'
      // every weight set already sums to 1, so a flat profile returns 3.0 under a
      // wide class of weight bugs and I4 proves little. Under core the dimensions
      // carrying banking-only mappings retain less than 1 (DCAM7 at 0.75), so a
      // missing renormalisation shows up here and only here.
      { name: 'flat 3.0, core only', layer: 'core', answers: constantProfile(3), flat: true },
      { name: 'all 1', layer: 'all', answers: constantProfile(1) },
      { name: 'all 5', layer: 'all', answers: constantProfile(5) },
      { name: 'seeded', layer: 'all', answers: SEEDED },
      { name: 'seeded, P03/P07/P11 unanswered', layer: 'all', answers: withoutPillars(SEEDED, ['P03', 'P07', 'P11']) },
      { name: 'seeded, core only', layer: 'core', answers: SEEDED },
    ]

    let invariantsRun = 0
    for (const profile of PROFILES) {
      const { answers, layer } = profile
      const projections = projection.projectAll(answers, layer)

      // Independent pillar scores: scoring.ts called directly, not read back out
      // of the projection. This is what makes I1 and I3 mean anything.
      const independent = new Map(
        scoring.scorePillars(pillars, scoring.applicableQuestions(diag.questions, layer), answers).map((o) => [o.pillarId, o]),
      )

      for (const proj of projections) {
        const at = `${profile.name} / ${proj.code}`

        // I1 — DECOMPOSITION
        for (const dim of proj.dimensions) {
          if (!dim.isLeaf && dim.contributions.length > 0)
            fail(`I1 ${at}: parent ${dim.code} carries ${dim.contributions.length} pillar contributions — projection is leaf-only and a parent counting a pillar its children also count double-counts the evidence`)
          if (dim.state !== 'scored') {
            if (dim.score !== null)
              fail(`I1 ${at}: ${dim.code} is ${dim.state} but carries score ${dim.score} — an unmeasured dimension must be null, never a number`)
            continue
          }
          if (!dim.isLeaf) continue
          const total = dim.contributions.reduce((s, c) => s + c.contribution, 0)
          if (Math.abs(total - dim.score) > EPS)
            fail(`I1 ${at}: ${dim.code} contributions sum to ${total} but score is ${dim.score} (delta ${Math.abs(total - dim.score)})`)
          const wsum = dim.contributions.reduce((s, c) => s + c.weight, 0)
          if (Math.abs(wsum - 1) > EPS)
            fail(`I1 ${at}: ${dim.code} renormalised weights sum to ${wsum}, not 1 — w' must be renormalised over the SCORED pillars`)
          for (const c of dim.contributions) {
            const truth = independent.get(c.pillarId)
            if (!truth || truth.state !== 'scored')
              fail(`I1 ${at}: ${dim.code} contributes pillar ${c.pillarId}, which scoring.ts reports as ${truth?.state ?? 'absent'}`)
            else if (Math.abs(truth.score - c.pillarScore) > EPS)
              fail(`I1 ${at}: ${dim.code} used ${c.pillarScore} for ${c.pillarId} but scoring.ts computes ${truth.score} — a second scoring path or a cached value`)
          }
          if (dim.scoredShare > dim.retainedShare + EPS)
            fail(`I1 ${at}: ${dim.code} scoredShare ${dim.scoredShare} exceeds retainedShare ${dim.retainedShare} — more was measured than applies`)
        }

        // I2 — RECONCILIATION
        if (proj.state === 'scored') {
          const wsum = Object.values(proj.effectiveWeights).reduce((s, w) => s + w, 0)
          if (Math.abs(wsum - 1) > EPS)
            fail(`I2 ${at}: induced pillar weights sum to ${wsum}, not 1 — the weight basis is unnormalised, so the overall is not a weighted mean of anything`)
          let recon = 0
          for (const [pillarId, w] of Object.entries(proj.effectiveWeights)) {
            if (w === 0) continue
            const truth = independent.get(pillarId)
            if (!truth || truth.state !== 'scored') {
              fail(`I2 ${at}: pillar ${pillarId} carries weight ${w} but is ${truth?.state ?? 'absent'} — an unscored pillar must not enter the basis`)
              continue
            }
            recon += w * truth.score
          }
          if (Math.abs(recon - proj.overall) > EPS)
            fail(`I2 ${at}: overall is ${proj.overall} but Σ W_p·score(p) is ${recon} (delta ${Math.abs(recon - proj.overall)}) — the framework roll-up and the crosswalk disagree`)
        }
        invariantsRun++
      }

      // I3 — INTERSECTION AGREEMENT
      const seenBy = new Map()
      for (const proj of projections)
        for (const dim of proj.dimensions)
          for (const c of dim.contributions) {
            const row = seenBy.get(c.pillarId) ?? new Map()
            row.set(proj.code, [...(row.get(proj.code) ?? []), c.pillarScore])
            seenBy.set(c.pillarId, row)
          }
      for (const [pillarId, byFramework] of seenBy) {
        if (byFramework.size !== projections.length) continue // not in the intersection
        const values = [...byFramework.values()].flat()
        const spread = Math.max(...values) - Math.min(...values)
        if (spread > EPS)
          fail(`I3 ${profile.name}: pillar ${pillarId} is used with ${values.length} different values across the four frameworks, spread ${spread} — every projection must read the same score from scoring.ts`)
      }

      // I4 — FLAT PROFILE
      if (profile.flat) {
        const overalls = projections.map((p) => p.overall)
        for (const [i, o] of overalls.entries())
          if (o === null || Math.abs(o - 3) > EPS)
            fail(`I4 ${profile.name}: ${projections[i].code} overall is ${o}, not 3.0 — with every pillar at exactly 3.0 any convex combination is 3.0, so a deviation is a maths error and almost always an unnormalised weight basis`)
        const spread = Math.max(...overalls) - Math.min(...overalls)
        if (spread > EPS)
          fail(`I4 ${profile.name}: the four overalls spread by ${spread}, which must be 0 when every pillar scores identically`)
      }
    }

    // ── evidence for the summary, computed here because it needs the engine ──
    // Coverage gaps: which dimensions a framework simply does not speak to under a
    // layer, and which it speaks to but nobody measured. Two different findings and
    // both are honest differentiation — this is what a generic maturity model
    // cannot tell a client.
    // Both counts are taken against a FULLY ANSWERED profile on purpose: anything
    // still not-applicable or not-assessed there is a property of the crosswalk and
    // the layer, not of how much of the diagnostic somebody filled in. `partial` is
    // the number retaining less than all of their own definition — the DCAM7-at-0.75
    // case, which is the coverage gap actually worth showing a client.
    const fullyAnswered = constantProfile(3)
    const gaps = ctx.state.FRAMEWORKS.map((f) => ({
      code: f.code,
      cells: ['core', 'banking', 'all'].map((layer) => {
        const dims = projection.decompose(f.id, fullyAnswered, layer).filter((d) => d.isLeaf)
        const na = dims.filter((d) => d.state === 'not-applicable').length
        const unassessed = dims.filter((d) => d.state === 'not-assessed').length
        const partial = dims.filter((d) => d.state === 'scored' && d.retainedShare < 1 - 1e-9)
        const worst = partial.length ? Math.min(...partial.map((d) => d.retainedShare)) : 1
        return `${layer}: ${na} n/a, ${unassessed} unassessed, ${partial.length} partial${partial.length ? ` (min retained ${worst.toFixed(2)})` : ''}`
      }),
    }))

    // Rank divergence on the seeded profile. If the four worst-three lists are the
    // same, the scorecards differ only in arithmetic and not in what a consultant
    // actually presents — which is the granularity risk, visible at build time.
    const worst = projection.projectAll(SEEDED, 'all').map((p) => ({
      code: p.code,
      overall: p.overall,
      three: p.dimensions
        .filter((d) => d.isLeaf && d.state === 'scored')
        .sort((a, b) => a.score - b.score || (a.dimensionId < b.dimensionId ? -1 : 1))
        .slice(0, 3),
    }))

    return { examined: invariantsRun, profiles: PROFILES.length, gaps, worst }
  },
}

export default {
  id: 'dgiw',
  title: 'DGIW — Data Governance',
  dataDir: 'src/dgiw/data',
  datasets: {
    pillars: 'pillars.json',
    diag: 'diagnostic.json',
    ladder: 'ladder.json',
    om: 'operatingModel.json',
    cdes: 'cdeRegister.json',
    rules: 'dqRules.json',
    prog: 'programSetup.json',
    plan: 'implementationPlan.json',
    pos: 'positioning.json',
    fw: 'frameworks.json',
    xw: 'crosswalk.json',
  },
  reportSources: [{ rel: 'src/dgiw/report', kind: 'dir' }],

  /**
   * The catalogued artefact register ARTEFACT-IMPL validates ids against. DGIW is
   * the only module with one: this is a delivery catalogue of forty-eight
   * artefacts a consultant produces during an engagement, each citable by a
   * client who reads "AR-13" on a cover. See suite/artefact-impl.mjs for why a
   * module report is deliberately not one of these.
   */
  artefactRegister: (data) => data.plan.artefactRegister.map((a) => a.id),

  /**
   * Compiled and imported so the checks run the real engine rather than a copy.
   * scoring.ts is a separate entry point on purpose — invariant I1 compares the
   * pillar scores the projection USED against pillar scores from scoring.ts
   * called directly, and sharing one bundle would make that comparison circular.
   */
  tsModules: { projection: 'src/dgiw/projection.ts', scoring: 'src/dgiw/scoring.ts' },

  /** Derived indexes, built once. Pure — every failure path lives in a check. */
  prepare(data) {
    const { pillars, ladder, om, cdes, plan, fw, xw } = data
    const FRAMEWORKS = fw.frameworks ?? []
    const DIMENSIONS = fw.dimensions ?? []
    const ENTRIES = xw.entries ?? []
    const hasChildren = new Set(DIMENSIONS.map((d) => d.parentId).filter(Boolean))
    const entriesByDim = new Map()
    for (const e of ENTRIES) entriesByDim.set(e.dimensionId, [...(entriesByDim.get(e.dimensionId) ?? []), e])
    return {
      pillarIds: new Set(pillars.map((p) => p.id)),
      cdeById: new Map(cdes.map((c) => [c.id, c])),
      roleIds: new Set(om.roles.map((r) => r.id)),
      registry: new Map((om.roleRegistry ?? []).map((r) => [r.name, r])),
      gateById: new Map(om.gates.map((g) => [g.id, g])),
      waveById: new Map(plan.waves.map((w) => [w.id, w])),
      rungNums: new Set(ladder.map((r) => r.rung)),
      FRAMEWORKS,
      DIMENSIONS,
      ENTRIES,
      frameworkById: new Map(FRAMEWORKS.map((f) => [f.id, f])),
      dimById: new Map(DIMENSIONS.map((d) => [d.id, d])),
      hasChildren,
      leafDims: DIMENSIONS.filter((d) => !hasChildren.has(d.id)),
      entriesByDim,
    }
  },

  /**
   * Declared run order. This is the order findings print in, so it is output, not
   * an implementation detail. It is the source order of the sections it replaces:
   * §1–9, then the crosswalk five, then the projection invariants.
   */
  checks: [
    layerTags,
    uniqueIds,
    foreignKeys,
    enumsAndShapes,
    accountability,
    gates,
    waveGraph,
    layerCoherence,
    coreChassis,
    crosswalkShape,
    crosswalkWeight,
    crosswalkOrphan,
    frameworkCoverage,
    crosswalkDistinctness,
    projectionInvariant,
  ],

  summary(ctx) {
    const { pillars, diag, cdes, rules, prog, plan, om } = ctx.data
    const { FRAMEWORKS, DIMENSIONS, ENTRIES, leafDims, pillarIds } = ctx.state
    const r = ctx.results
    const n = (rows, l) => rows.filter((x) => x.layer === l).length
    const out = []

    out.push(`pillars ${pillars.length}  questions ${diag.questions.length} (core ${n(diag.questions, 'core')} / banking ${n(diag.questions, 'banking')})`)
    out.push(`CDEs ${cdes.length} (core ${n(cdes, 'core')} / banking ${n(cdes, 'banking')})  DQ rules ${rules.length} (core ${n(rules, 'core')} / banking ${n(rules, 'banking')})`)
    out.push(`flows ${prog.flows.length}  steps ${prog.flows.flatMap((f) => f.steps).length}  checklist ${prog.checklist.length}  gates ${om.gates.length}`)
    out.push(`waves ${plan.waves.length}  artefacts ${plan.artefactRegister.length}  roles ${om.roles.length}  registry ${(om.roleRegistry ?? []).length}`)

    const unmapped = r['CROSSWALK-ORPHAN']?.unmappedPillars ?? []
    out.push(
      `CROSSWALK ${FRAMEWORKS.length} frameworks  ${DIMENSIONS.length} dimensions (${leafDims.length} leaf)  ${ENTRIES.length} mappings` +
        `  ${unmapped.length === 0 ? 'every pillar mapped' : `UNMAPPED PILLARS: ${unmapped.join(', ')}`}`,
    )
    for (const c of r['FRAMEWORK-COVERAGE']?.coverage ?? [])
      out.push(
        `  ${c.f.code.padEnd(9)} ${String(c.leaves).padStart(2)} leaf dims, ${String(c.entries).padStart(3)} mappings` +
          `  pillars core ${c.per.core}/${pillarIds.size}  banking ${c.per.banking}/${pillarIds.size}  all ${c.per.all}/${pillarIds.size}` +
          `  (${Math.round((c.per.all / pillarIds.size) * 100)}% at 'all')  structure confidence: ${c.f.structureConfidence}`,
      )
    out.push(
      `  distinctness (L1, floor ${DISTINCTNESS_MIN}): ` +
        (r['CROSSWALK-DISTINCTNESS']?.l1Pairs ?? []).map((p) => `${p.a}/${p.b} ${p.l1.toFixed(3)}`).join('  '),
    )

    const pi = r['PROJECTION-INVARIANT']
    if (pi?.examined) {
      out.push(`PROJECTION-INVARIANT ${pi.examined} framework projections over ${pi.profiles} deterministic profiles (I1 decomposition, I2 reconciliation, I3 intersection, I4 flat)`)
      for (const g of pi.gaps) out.push(`  ${g.code.padEnd(9)} ${g.cells.join('  |  ')}`)
      const overalls = pi.worst.map((w) => w.overall)
      out.push(
        `  seeded profile overalls: ` +
          pi.worst.map((w) => `${w.code} ${w.overall.toFixed(3)}`).join('  ') +
          `   spread ${(Math.max(...overalls) - Math.min(...overalls)).toFixed(3)}`,
      )
      for (const w of pi.worst)
        out.push(`  ${w.code.padEnd(9)} worst three: ` + w.three.map((d) => `${d.code} ${d.score.toFixed(2)}`).join(', '))
      const signatures = new Set(pi.worst.map((w) => w.three.map((d) => d.code).join('|')))
      if (signatures.size === 1)
        out.push(`  NOTE: all four worst-three lists are identical on a non-flat profile — the four scorecards differ only in arithmetic, not in what a consultant would present.`)
    }
    return out
  },
}
