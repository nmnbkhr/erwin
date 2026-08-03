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
import fs from 'node:fs'
import path from 'node:path'
import { unique, sorted, near, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'
import { makeCrosswalkChecks, crosswalkSummary } from '../lib/crosswalk.mjs'
import { ts, parseFile } from '../lib/ts-ast.mjs'

const LAYERS = ['core', 'banking']
const DIMS = ['Completeness', 'Validity', 'Accuracy', 'Consistency', 'Uniqueness', 'Timeliness', 'Integrity']
const XW_LAYERS = ['core', 'banking', 'both']

/**
 * The id shape of THIS module's spine. A parameter as of D5 stage B, because the
 * crosswalk classes are about to be shared: DGIW's spine is eleven pillars
 * (`P01`), TAIW's will be 35 TACR sections and HAIW's 80 HACR subcategories, and
 * `^P\d{2}$` is true of exactly one of the three. Declared beside the layer
 * vocabulary, which is the other thing only the owning module knows.
 */
const SPINE_ID = { pattern: /^P\d{2}$/, label: 'pillar' }
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

// ── 10. a catalogued artefact must say what it would be built from ─────────
/**
 * ARTEFACT-EVIDENCE — the register catalogues a shape; this is what stands behind it.
 *
 * ─── THE DEFECT ────────────────────────────────────────────────────────────
 *
 * ARTEFACT-IMPL validates that a generator's id is IN the register. It says
 * nothing about whether the register entry describes a document the data can
 * actually produce. So an id in `artefactRegister` is a standing invitation:
 * forty-eight named shapes with an owner and a format, seven of them built, and
 * nothing recording which of the other forty-one are reachable.
 *
 * That is not hypothetical here. `report/frameworkAlignment.ts` records that the
 * framework alignment pack shipped against AR-46 "Examination and audit evidence
 * pack" because it "matched the SHAPE and nothing else", and had to be moved to a
 * new AR-47. D5 stage G then measured all forty-one and found EIGHT that could be
 * built only by synthesising a relation no dataset carries — a system-of-record
 * designation inferred from an absence of competing rows, a column binding
 * regexed out of DQ rule expressions, an end-to-end lineage graph with two
 * authored endpoints and invented hops. Every one of them would have passed
 * ARTEFACT-IMPL, CSV-HEADER, TEXT-MAXWIDTH and the golden baselines, because each
 * of those checks a property of the OUTPUT and none of them checks the input.
 *
 * ─── WHAT THIS CLASS ASSERTS, AND THE ONE THAT MATTERS ─────────────────────
 *
 * Four of the five branches are shape: an evidence value from the closed set, a
 * mandatory `note`, `datasets` that resolve, `blockedOn` ids that are catalogued.
 * They are worth having and they are not the point.
 *
 * The fifth is: A GENERATOR MAY ONLY EXIST FOR A `derived` ENTRY. Writing one for
 * an entry marked authored, observed, blocked or withdrawn fails the build, by
 * name, at the point the generator declares its id. That is what turns the
 * disposition from a comment into a refusal — someone reversing it has to edit
 * the register and say why in the note, in the same commit, which is the
 * `HAIW-WEIGHT` and `SLUG_EXCEPTIONS` shape.
 *
 * The reverse does NOT fail. Seventeen entries are `derived` and seven have a
 * generator; the other ten are the roadmap, and failing on them would be
 * demanding the whole register be automated at once. The pair is printed instead.
 *
 * ─── WHAT IT CANNOT SEE ────────────────────────────────────────────────────
 *
 * `datasets` is a DECLARATION, not a derivation. For the ten derived entries with
 * no generator there is nothing to compare it against, which is exactly why it is
 * written down. For the seven that are built, this class checks that the declared
 * paths exist — it does NOT check them against what the generator imports;
 * FINGERPRINT-COVERAGE owns the import graph and a mismatch between the two would
 * be reported by neither today.
 *
 * And it cannot judge a note. `contentKey(['constant'])` passes ARTEFACT-IMPL for
 * the same reason: a static check verifies that a claim was SUPPLIED, never that
 * it is true. Read the note when reviewing a new entry.
 */
const ARTEFACT_EVIDENCE = ['derived', 'authored', 'observed', 'blocked', 'withdrawn']

const artefactEvidence = {
  code: 'ARTEFACT-EVIDENCE',
  run(ctx) {
    const { plan } = ctx.data
    const { fail, root, sources } = ctx
    const reg = plan.artefactRegister ?? []
    const byId = new Map(reg.map((a) => [a.id, a]))

    /*
     * The catalogued ids a generator claims. This reads the same declaration
     * ARTEFACT-IMPL reads — `export const X_ARTEFACT_ID = 'AR-nn'` — and reads it
     * again rather than sharing a helper, because the two classes ask different
     * questions of it and a shared assertion helper that hardcoded one code is
     * precisely the defect `unique()` shipped. A non-literal initialiser is
     * ARTEFACT-IMPL's finding to make, not this one's; it is skipped here rather
     * than reported twice under two codes.
     */
    const implemented = new Map()
    for (const file of sources) {
      const { sf, rel } = parseFile(root, file)
      const visit = (node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /ARTEFACT_ID$/.test(node.name.text)) {
          const init = node.initializer
          if (init && ts.isStringLiteralLike(init) && byId.has(init.text)) implemented.set(init.text, rel)
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    const counts = Object.fromEntries(ARTEFACT_EVIDENCE.map((e) => [e, 0]))
    const blockedOn = new Map()

    for (const a of reg) {
      const bf = a.builtFrom
      if (!bf || typeof bf !== 'object') {
        fail(`artefact ${a.id} "${a.artefact}" declares no builtFrom — the register would catalogue a shape with nothing recording what the document rests on, which is how AR-46 acquired a generator for a different artefact`)
        continue
      }
      if (!ARTEFACT_EVIDENCE.includes(bf.evidence)) {
        fail(`artefact ${a.id} builtFrom.evidence = ${JSON.stringify(bf.evidence)} — expected one of ${ARTEFACT_EVIDENCE.join(', ')}`)
        continue
      }
      counts[bf.evidence]++
      if (typeof bf.note !== 'string' || bf.note.trim() === '')
        fail(`artefact ${a.id} (${bf.evidence}) has no builtFrom.note — the note carries the relation, or the apparent path that does not hold, and an entry nobody had to explain is the state this field was added to end`)

      const datasets = bf.datasets ?? []
      const blocks = bf.blockedOn ?? []

      if (bf.evidence === 'derived') {
        if (datasets.length === 0)
          fail(`artefact ${a.id} is marked derived and names no dataset — "a generator can build it" with nothing to build it from is the claim this field exists to stop`)
        for (const rel of datasets)
          if (!fs.existsSync(path.join(root, 'src', rel)))
            fail(`artefact ${a.id} declares dataset src/${rel}, which does not resolve — a declared input that went missing is a finding, not a silently narrower claim`)
      } else if (datasets.length > 0) {
        fail(`artefact ${a.id} is marked ${bf.evidence} but declares datasets — naming inputs on an entry no generator may be written for is the invitation this class removes`)
      }

      if (bf.evidence === 'blocked') {
        if (blocks.length === 0)
          fail(`artefact ${a.id} is marked blocked and names nothing it is blocked on — "blocked" with no blocker cannot be cleared, or checked`)
        for (const id of blocks) {
          if (id === a.id) fail(`artefact ${a.id} is blocked on itself`)
          else if (!byId.has(id)) fail(`artefact ${a.id} is blocked on ${id}, which is not in this register`)
          else if (byId.get(id).builtFrom?.evidence === 'withdrawn')
            fail(`artefact ${a.id} is blocked on ${id}, which is withdrawn — a dead end wearing a roadmap's costume`)
          blockedOn.set(id, [...(blockedOn.get(id) ?? []), a.id])
        }
      } else if (blocks.length > 0) {
        fail(`artefact ${a.id} is marked ${bf.evidence} but declares blockedOn — only a blocked entry has a blocker`)
      }
    }

    // THE ONE THAT MATTERS. Direction is deliberate: derived-without-a-generator
    // is the roadmap and is printed, generator-without-derived is a refusal.
    for (const [id, rel] of implemented) {
      const ev = byId.get(id).builtFrom?.evidence
      if (ev && ev !== 'derived')
        fail(`${rel} declares a generator for artefact ${id}, which the register marks ${ev} — ${ev === 'withdrawn' ? 'the register withdrew this shape because the data cannot support it' : 'the register says this document cannot be built from the datasets yet'}. Building it anyway is the D-001 shape: a plausible document under a catalogued heading. Change the register entry and say why in its note, or do not write the generator`)
    }

    return {
      examined: reg.length,
      counts,
      implemented: [...implemented.keys()].sort(),
      blockedOn: [...blockedOn.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1)),
    }
  },
}

// ── 12-16. THE CROSSWALK CLASSES, FROM THE SHARED FACTORY ──────────────────
/**
 * Five inline classes became seven from `lib/crosswalk.mjs` in D5 stage C, when
 * TAIW became the second module to project frameworks onto a spine. Unchanged in
 * substance — the arithmetic is identical and DGIW's fourteen golden artefacts
 * are byte-identical through the move. What changed is where it lives and what is
 * DECLARED rather than assumed.
 *
 * ─── FRAMEWORK-COVERAGE IS GONE, RECLASSIFIED, NOT DELETED ─────────────────
 *
 * Its only failure path was the layer gap: a framework covering pillars at 'all'
 * but zero under a layer. TAIW has no layers, so on that module the class could
 * not fail at all — a class that cannot fail is decoration, which is exactly what
 * FRAMEWORK-COVERAGE was for a whole phase before D3 gave it that one path.
 * Rather than ship it twice, once armed and once inert, its two halves went where
 * each belongs:
 *
 *   the layer gap        -> CROSSWALK-WEIGHT, which already owns the identical
 *                           rule per leaf dimension and now runs it per layer
 *                           from a declared list. On a layerless module the list
 *                           is empty and the check REPORTS that the assertion did
 *                           not run.
 *   the coverage table   -> the summary lines, where it always actually lived.
 *
 * And the thing it never checked became `CROSSWALK-CONCENTRATION`, its own class:
 * how much of a framework's weight lands on ONE spine node. See below.
 *
 * ─── WHAT DGIW DECLARES THAT TAIW DOES NOT ─────────────────────────────────
 *
 * `spineCoverage: assert`. A pillar mapped by no framework FAILS here and is
 * merely reported for TAIW, and the difference is real rather than a relaxation:
 * the eleven pillars ARE DGIW's data-governance capability model, so a pillar
 * nothing maps is scorable evidence contributing to no scorecard. TACR's 35
 * sections describe a customs administration and seven of them are legitimately
 * outside DMBOK, DCAM and COBIT.
 */
/**
 * CROSSWALK-CONCENTRATION exceptions, keyed by framework code.
 *
 * ONE ENTRY, AND IT IS A REAL FINDING RATHER THAN A CONVENIENCE. Nobody had ever
 * measured where DGIW's four frameworks sit on this axis; the class was written
 * for TAIW and run here on the same ceiling deliberately. DMBOK2 peaks at 15.0%,
 * COBIT at 22.5%, DCAM at 23.0% — and DGI at 54.1% on P01 alone, with the next
 * pillar at 16.5%.
 *
 * That is not an authoring error to be tuned away. DGI IS a governance framework:
 * nine of its ten leaves are about rules, decision rights, accountabilities and
 * the governance office, and P01 Governance & Operating Model is where all of
 * that belongs. The honest consequence is that DGIW's DGI scorecard is more than
 * half a restatement of one pillar's score, and a reader should be told so rather
 * than have the ceiling raised until nothing shows.
 *
 * Recorded here, printed on every build, and a STALE entry fails — so if DGI's
 * crosswalk is ever rebalanced, this exception cannot outlive the concentration
 * it documents.
 */
const CONCENTRATION_EXCEPTIONS = Object.freeze({
  DGI:
    'DGI induces 54.1% of its weight onto P01 Governance & Operating Model (next pillar 16.5%). Not an authoring ' +
    'error: nine of DGI\'s ten leaves are rules, decision rights, accountabilities and the governance office, and P01 ' +
    'is where those belong. Accepted and DISCLOSED — the DGI scorecard is largely a restatement of P01 and the ' +
    'alignment pack should say so. Measured D5 stage C; nothing had measured it before.',
})

const crosswalk = makeCrosswalkChecks({
  label: 'DGIW',
  frameworkIds: ['FW-01', 'FW-02', 'FW-03', 'FW-04'],
  entryIdPattern: /^CW-D-\d{3}$/,
  spineIdPattern: SPINE_ID.pattern,
  spineLabel: SPINE_ID.label,
  spine: (ctx) => (ctx.data.pillars ?? []).map((p) => ({ id: p.id, name: p.name })),
  entries: (ctx) => ctx.data.xw?.entries ?? [],
  // DGIW's 91 entries predate the generic engine and keep their own word. The
  // factory validates the file's own field name and normalises internally, so
  // CROSSWALK-SHAPE inspects what an author actually wrote — the same split
  // src/dgiw/projection.ts makes at runtime.
  spineIdField: 'pillarId',
  frameworkData: (ctx) => ctx.shared('_spine').fw ?? {},
  layers: ['core', 'banking'],
  layerValues: XW_LAYERS,
  layerShows: xwShows,
  // Calibrated against eleven pillars. DGI and COBIT EDM are genuinely
  // near-identical governance frameworks and ~0.16 is expected and accepted; what
  // this catches is a near-uniform crosswalk, where spread across all four
  // collapses toward 0.02 and the four scorecards become one.
  distinctnessFloor: 0.15,
  concentrationCeiling: 0.35,
  concentrationExceptions: CONCENTRATION_EXCEPTIONS,
  // Empty, and measured: all 44 leaves carry at least one mapping.
  reachExceptions: Object.freeze({}),
  spineCoverage: { mode: 'assert' },
  induced: (ctx, frameworkId) => ctx.ts?.projection?.inducedPillarWeights(frameworkId, 'all') ?? null,
})


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
            const truth = independent.get(c.spineId)
            if (!truth || truth.state !== 'scored')
              fail(`I1 ${at}: ${dim.code} contributes pillar ${c.spineId}, which scoring.ts reports as ${truth?.state ?? 'absent'}`)
            else if (Math.abs(truth.score - c.spineScore) > EPS)
              fail(`I1 ${at}: ${dim.code} used ${c.spineScore} for ${c.spineId} but scoring.ts computes ${truth.score} — a second scoring path or a cached value`)
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
            const row = seenBy.get(c.spineId) ?? new Map()
            row.set(proj.code, [...(row.get(proj.code) ?? []), c.spineScore])
            seenBy.set(c.spineId, row)
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
    // `frameworks.json` is NOT here. It moved to src/frameworks/data/ in D5 stage
    // B and is declared by `_spine`, because DMBOK2, DCAM and COBIT are shared
    // with TAIW and HAIW. `crosswalk.json` stays: it holds all 91 pillar
    // references and is DGIW's alone.
    xw: 'crosswalk.json',
  },
  reportSources: [{ rel: 'src/dgiw/report', kind: 'dir' }],
  /*
   * PROVENANCE-COVERAGE, D5 stage F1. `src/dgiw/report/*.ts` BUILDS a document
   * and returns it; every `saveReport`/`downloadCsv` CALL that actually hands
   * one to the user lives in the component that imports the builder —
   * CdeRegister.tsx, Deliverables.tsx, Diagnostic.tsx, DqRuleLibrary.tsx,
   * Frameworks.tsx — which `reportSources` above does not cover and was never
   * meant to: CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL have no business
   * reading component JSX. A second, narrower declared set, read only by
   * PROVENANCE-COVERAGE, is deliberately not folded into `reportSources` —
   * doing that would widen every other class's scope by the same directory for
   * a concern only one of them has.
   */
  provenanceSources: [{ rel: 'src/dgiw/components', kind: 'dir' }],

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

  /**
   * Derived indexes, built once. Pure — every failure path lives in a check.
   *
   * `shared` is how the framework definitions arrive now that they belong to the
   * suite rather than to this module. Reading them through the registry rather
   * than re-importing the file keeps ONE loader and one REGISTRY finding if the
   * path ever breaks — the same reason `dataDir` exists.
   */
  prepare(data, shared) {
    const { pillars, ladder, om, cdes, plan, xw } = data
    const fw = shared('_spine').fw ?? {}
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
    artefactEvidence,
    crosswalk.spineUniverse,
    crosswalk.crosswalkShape,
    crosswalk.crosswalkWeight,
    crosswalk.crosswalkOrphan,
    crosswalk.frameworkReach,
    crosswalk.crosswalkConcentration,
    crosswalk.crosswalkDistinctness,
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

    // The delivery scoreboard, honestly denominated. ARTEFACT-IMPL prints "N of
    // 48 catalogued artefacts have a generator" and 48 is the catalogue size, not
    // the buildable set — three of those are withdrawn shapes the data cannot
    // support and eighteen more wait on content nobody has written. Printed here
    // so that fraction is readable rather than flattering.
    const ae = r['ARTEFACT-EVIDENCE']
    if (ae?.counts) {
      const c = ae.counts
      const live = plan.artefactRegister.length - c.withdrawn
      out.push(
        `ARTEFACT-EVIDENCE ${plan.artefactRegister.length} catalogued, ${live} live` +
          `  derived ${c.derived} (${ae.implemented.length} with a generator: ${ae.implemented.join(', ')})` +
          `  authored ${c.authored}  observed ${c.observed}  blocked ${c.blocked}  withdrawn ${c.withdrawn}`,
      )
      out.push(
        `  blocked on: ${ae.blockedOn.map(([id, on]) => `${id} <- ${on.join(', ')}`).join('  ') || 'nothing'}` +
          ` — a generator may only be written for a derived entry, and that is asserted rather than asked for`,
      )
    }

    const unmapped = r['CROSSWALK-ORPHAN']?.unmapped ?? []
    out.push(
      `CROSSWALK ${FRAMEWORKS.length} frameworks  ${DIMENSIONS.length} dimensions (${leafDims.length} leaf)  ${ENTRIES.length} mappings` +
        `  ${unmapped.length === 0 ? 'every pillar mapped' : `UNMAPPED PILLARS: ${unmapped.join(', ')}`}`,
    )
    // The structure-confidence column is DGIW's own: the dimension NAMES are
    // published content and carry a confidence mark, the weights beside them are
    // ours. FRAMEWORK-COVERAGE printed it; that class is gone, the line is not.
    for (const f of FRAMEWORKS) {
      const leaves = leafDims.filter((d) => d.frameworkId === f.id)
      const es = leaves.reduce((n, d) => n + ENTRIES.filter((e) => e.dimensionId === d.id).length, 0)
      const reached = new Set(ENTRIES.filter((e) => leaves.some((d) => d.id === e.dimensionId)).map((e) => e.pillarId))
      out.push(
        `  ${f.code.padEnd(9)} ${String(leaves.length).padStart(2)} leaf dims, ${String(es).padStart(3)} mappings` +
          `  ${reached.size}/${pillarIds.size} pillars reached  structure confidence: ${f.structureConfidence}`,
      )
    }
    for (const l of crosswalkSummary(r, { label: 'DGIW', spineLabel: 'pillar', spineTotal: pillarIds.size }).slice(1)) out.push(l)

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
