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
import zlib from 'node:zlib'
import { unique, sorted, near, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'
import { makeCrosswalkChecks, crosswalkSummary } from '../lib/crosswalk.mjs'
import { ts, parseFile } from '../lib/ts-ast.mjs'
/*
 * The policy set (AR-11). FOUR EXTENSIONS ARE LIVE AND TWO CLASSES ARE NOT.
 *
 * `policies.json` does not exist yet, so each of these contributes zero rows —
 * which costs nothing, because the four classes they join each examine hundreds
 * of other rows and cannot go VACUOUS on that account. The day the dataset is
 * declared they cover it with no further edit here.
 *
 * `policyEnforcement` and `policyAuthored` are deliberately absent from `checks`
 * below, and `policySummary` prints that fact on every build rather than leaving
 * it to be noticed. The header of lib/policies.mjs is the argument and names the
 * three lines that wire them on.
 */
import {
  policyLayeredRows,
  policyUnique,
  policyForeignKeys,
  policyOwnerRefs,
  policySummary,
} from '../lib/policies.mjs'

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
      // The policy set joins the declared layered-rows list. Zero rows until
      // policies.json is declared; see the import header.
      policyLayeredRows(ctx),
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
    examined += unique(f, 'UNIQUE', 'principle', om.principles.map((p) => p.id))
    // The code is a PARAMETER all the way down — lib/policies.mjs never names one.
    examined += policyUnique(f, 'UNIQUE', ctx)
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
    // policy -> pillar, policy -> principle. Zero rows until policies.json exists.
    examined += policyForeignKeys(ctx, fail)
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
      // A policy owner resolves through roleRegistry like every other owner, and
      // is singular for the same reason: two accountable parties is the same as
      // none, and a policy is the artefact where that matters most.
      ...policyOwnerRefs(ctx),
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

/*
 * ── G5: THE PLACEMENT GATE ──────────────────────────────────────────────────
 *
 * Artefact-to-wave placement is AUTHORED, complete and single. G4 measured
 * the only relation that existed — exact name identity between a register
 * row's `artefact` and a wave's free-text deliverable string, 1 of 35 — and
 * G5 replaced it with `wave.artefactIds`, authored per wave from the wave's
 * own deliverables/objectives prose, plus a top-level `unplacedArtefactIds`
 * carrying a written reason for everything no wave delivers (diagnostic-rung
 * artefacts that precede W0, recurring run-phase outputs, withdrawn shapes).
 *
 * The invariant is EXACTLY ONE: every register id appears in one wave's
 * artefactIds or in the unplaced list — never neither (a silently
 * unscheduled artefact), never both, never twice (a plan that delivers one
 * document in two waves is two claims). Dangling ids fail in both
 * directions, and an unplaced entry with no reason fails because unplaced is
 * a decision, and a decision has to be written down — the mayBeEmpty rule
 * applied to a scheduling judgement.
 */
const placement = {
  code: 'PLACEMENT',
  run(ctx) {
    const { plan } = ctx.data
    const { fail } = ctx
    let examined = 0
    const registerIds = new Set(plan.artefactRegister.map((a) => a.id))
    const seen = new Map()

    for (const w of plan.waves ?? []) {
      if (!Array.isArray(w.artefactIds)) {
        fail(`wave ${w.id} declares no artefactIds — placement is authored per wave, and a wave without the key is a wave whose deliverables are attached to nothing`)
        continue
      }
      for (const id of w.artefactIds) {
        examined++
        if (!registerIds.has(id))
          fail(`wave ${w.id} places ${id}, which the register does not catalogue — a dangling placement schedules a document that does not exist`)
        if (seen.has(id))
          fail(`${id} is placed twice (${seen.get(id)} and wave ${w.id}) — one artefact delivered by two waves is two claims about one document`)
        seen.set(id, `wave ${w.id}`)
      }
    }

    if (!Array.isArray(plan.unplacedArtefactIds)) {
      fail(`unplacedArtefactIds is not declared — "no wave delivers this" is a decision per artefact, and without the list an id missing from every wave is indistinguishable from an id nobody thought about`)
    } else {
      for (const u of plan.unplacedArtefactIds) {
        examined++
        if (!u || typeof u.id !== 'string' || typeof u.reason !== 'string' || u.reason.trim() === '') {
          fail(`unplaced entry ${JSON.stringify(u).slice(0, 60)} carries no reason — unplaced is a decision, and the reason is the decision written down`)
          continue
        }
        if (!registerIds.has(u.id))
          fail(`unplacedArtefactIds names ${u.id}, which the register does not catalogue — a reasoned exclusion of nothing`)
        if (seen.has(u.id))
          fail(`${u.id} is both ${seen.get(u.id)} and unplaced — exactly one of the two, or the plan holds two contradictory claims about where it is delivered`)
        seen.set(u.id, 'unplaced')
      }
    }

    for (const id of registerIds) {
      examined++
      if (!seen.has(id))
        fail(`${id} appears in no wave's artefactIds and not in unplacedArtefactIds — every register id is placed exactly once or unplaced with a written reason; silence is the one state the key exists to forbid`)
    }

    return {
      examined,
      placed: [...seen.values()].filter((v) => v !== 'unplaced').length,
      unplaced: [...seen.values()].filter((v) => v === 'unplaced').length,
    }
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
        // The message names the disposition and points at the note. It does NOT
        // paraphrase why: this used to read "withdrawn because the data cannot
        // support it", which was true of AR-32/34/37 and false of AR-10, which
        // was withdrawn as a duplicate of a document that already ships. A
        // finding that guesses the reason sends the reader to the wrong fix, and
        // the reason is written down one field away.
        fail(`${rel} declares a generator for artefact ${id}, which the register marks ${ev} rather than derived — read builtFrom.note on ${id} for why. Building it anyway is the D-001 shape: a plausible document under a catalogued heading. Change the register entry and say why in its note, in the same commit, or do not write the generator`)
    }

    return {
      examined: reg.length,
      counts,
      implemented: [...implemented.keys()].sort(),
      blockedOn: [...blockedOn.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1)),
    }
  },
}

/**
 * GENERATOR-SET — the app's own list of built artefacts must equal the real one.
 *
 * ─── WHY A LIST EXISTS AT ALL ──────────────────────────────────────────────
 *
 * NO DATASET RECORDS WHICH ARTEFACTS HAVE A GENERATOR. The gate knows, because
 * ARTEFACT-EVIDENCE scans `src/dgiw/report/` for `*_ARTEFACT_ID` declarations —
 * but that is a source scan, and `report/programmeGap.ts` runs in a browser and
 * cannot do one. AR-54's whole subject is which pillars have nothing this
 * workbench can produce, so it needs that set at runtime and the only way to
 * have it is to declare it.
 *
 * A DECLARATION BESIDE A COMPUTED TRUTH IS THIS REPO'S MOST REPEATED DEFECT.
 * `SuiteLanding.tsx` claims 56 CDEs against 76 and 81 DQ rules against 115;
 * CLAUDE.md carried `REGISTRY 40` for a whole phase and `15, 11 built` for two
 * waves after it stopped being eleven; `Deliverables.tsx`'s own header said
 * "five" while SPECS held seven. Every one was a hand-typed number beside a
 * computed one, and the prose lost every time. Shipping a fourteenth on a
 * client-facing cover page, where the number IS the finding, is not acceptable.
 *
 * ─── SO THE LIST FAILS THE BUILD WHEN IT DRIFTS ────────────────────────────
 *
 * Both directions, and they are different defects:
 *
 *   declared, not scanned   AR-54 would count a pillar as served by a generator
 *                           that does not exist — a pillar wrongly reported as
 *                           covered, which is the exact failure the artefact is
 *                           written to prevent, inside the artefact itself
 *   scanned, not declared   a new generator lands and the gap report keeps
 *                           calling its pillar unserved — the quieter direction,
 *                           and the one nobody would notice
 *
 * This scans independently rather than reading ARTEFACT-EVIDENCE's result. The
 * two classes ask different questions and a shared assertion helper hardcoding
 * one code is precisely the defect `unique()` shipped — CLAUDE.md records it.
 *
 * ─── WHAT IT CANNOT SEE ────────────────────────────────────────────────────
 *
 * That the id in the list is the id the generator actually renders under.
 * ARTEFACT-IMPL owns that. This asserts set equality between two lists of
 * strings, which is all "is the count on the cover the real count" needs.
 */
const GENERATOR_SET_DECL = {
  rel: 'src/dgiw/report/programmeGap.ts',
  name: 'IMPLEMENTED_ARTEFACT_IDS',
}

const generatorSet = {
  code: 'GENERATOR-SET',
  run(ctx) {
    const { fail, root, sources } = ctx
    const catalogued = new Set((ctx.data.plan.artefactRegister ?? []).map((a) => a.id))

    /*
     * The scanned truth: every `*_ARTEFACT_ID = 'AR-nn'` in the declared report
     * source set, FILTERED TO CATALOGUED IDS. Same declaration ARTEFACT-EVIDENCE
     * reads and the same filter it applies.
     *
     * `ctx.sources` is the whole SUITE's report source set, not this module's —
     * it resolves the eight declared locations across five rule files. Without
     * the filter this class demanded that DGIW's list name TAIW's and HAIW's
     * thirteen `MR-*` module reports, which are not catalogued artefacts and
     * belong to no pillar. Caught by running it; the finding named all thirteen.
     */
    const scanned = new Set()
    for (const file of sources) {
      const { sf } = parseFile(root, file)
      const visit = (node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /ARTEFACT_ID$/.test(node.name.text)) {
          const init = node.initializer
          if (init && ts.isStringLiteralLike(init) && catalogued.has(init.text)) scanned.add(init.text)
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    const declFile = path.join(root, GENERATOR_SET_DECL.rel)
    if (!fs.existsSync(declFile)) {
      fail(`${GENERATOR_SET_DECL.rel} does not resolve, so ${GENERATOR_SET_DECL.name} cannot be read — AR-54 renders a built/not-built column from that list and a missing declaration would silently make every pillar read as unserved`)
      return { examined: 0 }
    }

    const { sf } = parseFile(root, declFile)
    let declared = null
    const visit = (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === GENERATOR_SET_DECL.name
      ) {
        // `as const` wraps the array literal in an assertion expression.
        let init = node.initializer
        while (init && (ts.isAsExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression
        if (init && ts.isArrayLiteralExpression(init)) {
          const values = init.elements.map((e) => (ts.isStringLiteralLike(e) ? e.text : null))
          if (values.every((v) => v !== null)) declared = new Set(values)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)

    if (!declared) {
      fail(`${GENERATOR_SET_DECL.rel} does not export ${GENERATOR_SET_DECL.name} as an array of string literals — an unreadable declaration is not the same as an empty one, and this class refuses to pass over something it could not parse`)
      return { examined: 0 }
    }

    const missing = [...scanned].filter((id) => !declared.has(id)).sort()
    const extra = [...declared].filter((id) => !scanned.has(id)).sort()

    if (missing.length)
      fail(`${GENERATOR_SET_DECL.name} in ${GENERATOR_SET_DECL.rel} omits ${missing.join(', ')} — a generator exists for ${missing.length === 1 ? 'it' : 'those'} and AR-54 would report their pillar as having nothing this workbench can produce. Add the id to the array in the same commit as the generator`)
    if (extra.length)
      fail(`${GENERATOR_SET_DECL.name} in ${GENERATOR_SET_DECL.rel} names ${extra.join(', ')}, which no file in the declared report source set declares a generator for — AR-54 would print a built count that includes a document nobody can produce, which is the defect the artefact exists to report`)

    return { examined: declared.size, declared: [...declared].sort(), scanned: [...scanned].sort() }
  },
}

/*
 * ── G2: THE TIER GATE ───────────────────────────────────────────────────────
 *
 * The diagnostic gains three nested assessment tiers — quick ⊂ standard ⊂ deep.
 * A question's `tier` is the MINIMUM tier at which it appears, and the
 * composition happens in ONE place: `scoring.applicableQuestions(questions,
 * layer, tier)`. The failure modes this class exists for are all silent:
 *
 *   - an untagged question falls out of every tier comparison and simply stops
 *     being asked (the shape this gate was watched FAILING on, before the
 *     dataset was tagged — 55 findings, one per question);
 *   - a pillar with no quick-tier core question reports `not-assessed` under
 *     Quick mode forever, and nothing on screen says the mode is why;
 *   - "overlay = deep" laziness: if every banking question is deep, the tier
 *     axis silently aliases the layer axis and Standard mode can never see the
 *     overlay at all. The two axes are orthogonal by declaration.
 *
 * The nesting itself is asserted COMPUTATIONALLY, not read off the data: the
 * real compiled `scoring.applicableQuestions` (ctx.ts, the same esbuild module
 * PROJECTION-INVARIANT runs) is called per tier per layer and each set must be
 * a superset of the one below it. A check that trusted the tier field's
 * semantics without running the function would pass over a broken comparator.
 */
const TIERS = ['quick', 'standard', 'deep']

const tierNesting = {
  code: 'TIER-NESTING',
  run(ctx) {
    const { diag, pillars } = ctx.data
    const { fail } = ctx
    let examined = 0

    // Branch 1 — every question carries a valid tier.
    let untagged = 0
    for (const q of diag.questions) {
      examined++
      if (!TIERS.includes(q.tier)) {
        untagged++
        fail(`question ${q.id} has tier=${JSON.stringify(q.tier)} — expected one of ${TIERS.join(', ')}; an untagged question falls out of every tier comparison and silently stops being asked`)
      }
    }
    // The remaining branches would fire once per question on an untagged
    // dataset and bury the real finding; one clear message per question above
    // is the honest report of that state.
    if (untagged > 0) return { examined }

    // Branch 2 — every pillar has at least one quick-tier question in the core
    // layer. Quick mode composes with a core-only engagement, and a pillar
    // invisible to that combination reports not-assessed with nothing saying why.
    for (const p of pillars) {
      examined++
      const qs = diag.questions.filter((q) => q.pillarId === p.id)
      if (!qs.some((q) => q.tier === 'quick' && q.layer === 'core'))
        fail(`pillar ${p.id} has no quick-tier core question — a Quick pass under any layer would report it not-assessed forever, and the tier would be the reason without ever being named`)
    }

    // Branch 3 — the tier axis must not degenerate into the layer axis.
    examined++
    if (!diag.questions.some((q) => q.layer === 'banking' && q.tier !== 'deep'))
      fail(`every banking question is deep-tier — the tier axis has collapsed into the layer axis, and Standard mode can never see the overlay. The two axes are declared orthogonal; keep at least one banking question below deep`)

    // Branch 4 — nesting holds through the REAL composition function, per layer.
    if (!ctx.ts?.scoring?.applicableQuestions) {
      fail(`could not load scoring.ts to verify tier composition — the nesting invariant was NOT checked`)
      return { examined }
    }
    const aq = ctx.ts.scoring.applicableQuestions
    /*
     * The probe is BEHAVIOURAL, not an arity check — `Function.length` does
     * not count a defaulted parameter, so a `tier = 'deep'` third argument is
     * invisible to it (measured: it read 2 with the parameter present).
     * Instead the expected membership of every tier set is computed here from
     * the tier field's declared semantics (minimum tier), and the function's
     * actual output must equal it in BOTH directions per layer. A function
     * that ignores its tier argument returns the deep set for quick and fails
     * the first comparison; one that widens instead of narrowing fails the
     * second.
     */
    const order = Object.fromEntries(TIERS.map((t, i) => [t, i]))
    for (const layer of ['all', 'core', 'banking']) {
      const layerSet = new Set(aq(diag.questions, layer).map((q) => q.id))
      for (const t of TIERS) {
        examined++
        const got = new Set(aq(diag.questions, layer, t).map((q) => q.id))
        const expected = new Set(
          diag.questions.filter((q) => layerSet.has(q.id) && order[q.tier] <= order[t]).map((q) => q.id),
        )
        for (const id of expected)
          if (!got.has(id))
            fail(`under layer=${layer} tier=${t}: question ${id} (tier ${diag.questions.find((q) => q.id === id).tier}) is missing from the composed set — an answer to it would vanish from scoring, which is the nesting invariant, not a convention`)
        for (const id of got)
          if (!expected.has(id))
            fail(`under layer=${layer} tier=${t}: question ${id} appears in the composed set but its tier says it should not — an answer from outside the active tier would be counted`)
      }
      // Deep is the identity: the tier axis may narrow the layer set, never widen it.
      examined++
      const deep = new Set(aq(diag.questions, layer, 'deep').map((q) => q.id))
      if (deep.size !== layerSet.size)
        fail(`under layer=${layer} the deep tier sees ${deep.size} questions but the layer alone sees ${layerSet.size} — deep must be the identity, or "full assessment" quietly stops meaning full`)
    }

    const counts = Object.fromEntries(TIERS.map((t) => [t, diag.questions.filter((q) => q.tier === t).length]))
    return { examined, counts }
  },
}

/*
 * ── G2: THE TIER-DIGEST GATE ────────────────────────────────────────────────
 *
 * A Quick-tier PDF and a Deep-tier PDF of the same answers are different
 * documents and must never share a trailer /ID — otherwise a DMS holding the
 * Deep report treats the directional Quick pass as the copy it already has,
 * which is the exact revision-swallowing defect the content digest exists to
 * prevent. ARTEFACT-IMPL proves a digest is SUPPLIED; nothing proved the tier
 * is IN it. Grep-level on INTAKE-MODE's precedent: each score-carrying
 * generator must fold a `tier:` and a `coverage:` part into its digest.
 */
const TIER_DIGEST_GENERATORS = [
  'src/dgiw/report/diagnosticReport.ts',
  'src/dgiw/report/multiFrameworkScorecard.ts',
  'src/dgiw/report/frameworkAlignment.ts',
  // G3: AR-06 joined the tier-carrying set (the flag G2 closed), and the gap
  // register is tier-scoped by definition.
  'src/dgiw/report/aiReadiness.ts',
  'src/dgiw/report/gapStatements.ts',
  // G4: the per-pillar plan derives from the tier-scoped register. AR-04 is
  // deliberately NOT here: its tier joins the digest only when the gap-driven
  // view renders (`gap-view:` parts), and this class's contract is
  // unconditional — listing it would either fail a correct generator or force
  // a tier part into reference documents that apply no tier.
  'src/dgiw/report/pillarPlans.ts',
  // G5: the steering pack's maturity line is tier-scoped by definition.
  'src/dgiw/report/councilPack.ts',
]

const tierDigest = {
  code: 'TIER-DIGEST',
  run(ctx) {
    const { fail, root } = ctx
    let examined = 0
    for (const rel of TIER_DIGEST_GENERATORS) {
      const abs = path.join(root, rel)
      if (!fs.existsSync(abs)) {
        fail(`${rel} does not resolve — a score-carrying generator this class is declared over has moved, and the declaration has to move with it`)
        continue
      }
      examined++
      const src = fs.readFileSync(abs, 'utf8')
      if (!src.includes('`tier:${'))
        fail(`${rel} does not fold the assessment tier into its content digest — a Quick-tier PDF and a Deep-tier PDF could share an /ID, and a reader's DMS would treat the directional pass as the full report it already holds`)
      if (!src.includes('`coverage:${'))
        fail(`${rel} does not fold its coverage into the content digest — the same tier at different coverage is a different document, and /ID must say so`)
    }
    return { examined }
  },
}

/*
 * ── G2: THE ANSWER-SHAPE AND TARGET GATES ───────────────────────────────────
 *
 * ANSWER-SHAPE runs the REAL compiled answerShape.ts (ctx.ts.answers — the
 * PROJECTION-INVARIANT precedent) against both stored shapes and the
 * malformed ones, on every build. The migration promise it pins: a legacy
 * `{id: 4}` map normalises to `{id: {score: 4}}` LOSSLESSLY, evidence
 * survives verbatim, and a malformed value rejects the whole map rather than
 * crashing or half-loading. A guard like this decays silently — someone
 * loosens the validator to accept a new shape and the range check goes with
 * it — and no browser session would ever notice.
 *
 * TARGET-RANGE holds `dgiw.targets`' promise the way INTAKE-SCOPE holds the
 * intake's: against the one stored fixture the gate can read (the `targets`
 * key in scripts/golden/fixtures/dgiw.json — the same fixture, not a parallel
 * one). Every key must be a pillar in pillars.json, every value an integer
 * 1..5 — target − current is the single gap function everything in G3+
 * derives from, and a target of 0, 3.5 or P99 poisons it at the source.
 */
const answerShapeGuard = {
  code: 'ANSWER-SHAPE',
  run(ctx) {
    const { fail } = ctx
    if (!ctx.ts?.answers) {
      fail(`could not build or load answerShape.ts — the stored-answer guard was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const { isAnswerMap, normaliseAnswers, answerScores } = ctx.ts.answers
    let examined = 0
    const accept = (label, v) => {
      examined++
      if (!isAnswerMap(v)) fail(`isAnswerMap rejects ${label} — a stored map in that shape would be silently discarded and a consultant's assessment would open empty`)
    }
    const reject = (label, v) => {
      examined++
      if (isAnswerMap(v)) fail(`isAnswerMap ACCEPTS ${label} — that value would flow into the weighted mean and produce a maturity no scale explains`)
    }
    accept('a legacy numeric map', { 'DG-P01-01': 4 })
    accept('a G2 object map', { 'DG-P01-01': { score: 4 } })
    accept('a G2 map with evidence', { 'DG-P01-01': { score: 4, evidence: 'Charter sighted, signed 2025-11.' } })
    accept('a MIXED map (legacy + G2, mid-migration)', { a: 4, b: { score: 2, evidence: 'x' } })
    accept('an empty map', {})
    reject('a score of 0', { a: 0 })
    reject('a score of 7', { a: 7 })
    reject('a fractional score', { a: 3.5 })
    reject('a string score', { a: { score: '4' } })
    reject('a non-string evidence', { a: { score: 4, evidence: 5 } })
    reject('an array', ['x'])
    reject('null', null)

    // The migration itself: lossless in both directions that matter.
    examined++
    const up = normaliseAnswers({ Q1: 4 })
    if (!(up && typeof up.Q1 === 'object' && up.Q1.score === 4 && !('evidence' in up.Q1)))
      fail(`normaliseAnswers({Q1: 4}) produced ${JSON.stringify(up)} — a legacy answer must lift to {score: 4}, nothing more and nothing less; this is the lossless-migration promise`)
    examined++
    const keep = normaliseAnswers({ Q1: { score: 2, evidence: '  verbatim, untrimmed  ' } })
    if (keep?.Q1?.evidence !== '  verbatim, untrimmed  ')
      fail(`normaliseAnswers rewrote an evidence note (${JSON.stringify(keep?.Q1)}) — normalisation runs on every read, so any lossy step compounds`)
    examined++
    const scores = answerScores(normaliseAnswers({ a: 4, b: { score: 1 } }))
    if (scores.a !== 4 || scores.b !== 1)
      fail(`answerScores round-trip failed (${JSON.stringify(scores)}) — scoring.ts consumes this view and its math is deliberately untouched by G2`)
    return { examined }
  },
}

const targetRange = {
  code: 'TARGET-RANGE',
  run(ctx) {
    const { fail, root } = ctx
    const { pillarIds } = ctx.state
    const abs = path.join(root, INTAKE_FIXTURE_REL)
    if (!fs.existsSync(abs)) return { examined: 0, mayBeEmpty: 'INTAKE-SCOPE already fails on the missing fixture; failing twice would report one defect under two codes' }
    let fixture
    try {
      fixture = JSON.parse(fs.readFileSync(abs, 'utf8'))
    } catch {
      return { examined: 0, mayBeEmpty: 'INTAKE-SCOPE already fails on the unparseable fixture' }
    }
    const targets = fixture.targets
    if (!targets || typeof targets !== 'object' || Array.isArray(targets) || Object.keys(targets).length === 0) {
      fail(`${INTAKE_FIXTURE_REL} stores no targets — the target-table golden entry would silently render nothing, and a baseline that lost a section without anyone deciding so is the check-that-stopped-running shape`)
      return { examined: 0 }
    }
    let examined = 0
    for (const [pid, v] of Object.entries(targets)) {
      examined++
      if (!pillarIds.has(pid))
        fail(`fixture target names pillar ${pid}, which pillars.json does not contain — targets are per pillar, validated against the dataset, never a second list`)
      if (!(typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5))
        fail(`fixture target for ${pid} is ${JSON.stringify(v)} — a target is an integer 1..5; anything else poisons target − current, the one gap function G3 derives from`)
    }
    return { examined }
  },
}

/*
 * ── G3: THE GAP GATES ───────────────────────────────────────────────────────
 *
 * `gapRegister()` in src/dgiw/gap/register.ts is the single source of every
 * gap claim — the /gaps page, AR-55, AR-54's maturity section and AR-47's
 * projected-target column all consume it. Four promises hold that design
 * together, and each is asserted against the REAL compiled module (the
 * PROJECTION-INVARIANT precedent), over the one stored fixture the gate can
 * read — the same scripts/golden/fixtures/dgiw.json the intake gates use, no
 * parallel fixture:
 *
 *   GAP-PAIR      no GapEntry without BOTH measurements. Asserted three ways:
 *                 every fixture entry's pillar has a target and is scored at
 *                 the fixture tier (scored recomputed from scoring.ts directly
 *                 — the I1 idiom, so the comparison is not circular); the
 *                 entries and exclusions partition the pillar set exactly; and
 *                 two mutation probes run the register against degraded input
 *                 (a removed target, a de-answered pillar) and require the
 *                 entry to vanish INTO an exclusion naming the reason.
 *
 *   GAP-PRIORITY  no unexplained ranks. Every entry's printed inputs must
 *                 reproduce its score under the MODULE'S OWN exported
 *                 constants (never re-declared here — a gate carrying its own
 *                 copy of the formula would assert its copy), the band must
 *                 follow from the score, and all four bands must be reachable
 *                 on the fixture — a band no fixture reaches is a claim no
 *                 baseline has ever rendered.
 *
 *   GAP-DRIVER    driver alignment is DECLARED, never inferred. The fixture's
 *                 driverPillars ids must exist in pillars.json; no source
 *                 under src/dgiw/gap/ may fuzzy-match driver text against
 *                 pillar names (grep-level, INTAKE-MODE's precedent); and a
 *                 mapping pointing at a pillar the dataset dropped must
 *                 contribute NOTHING, asserted by running the register with a
 *                 stale-id intake.
 *
 *   GAP-REFUSAL   the gap-statement generator REFUSES rather than fabricating.
 *                 `gapStatementsRefusal` must refuse a non-actionable intake
 *                 and an empty register, pass when both measurements exist,
 *                 and `buildGapStatementsPdf` must throw the SAME message the
 *                 predicate returns — an empty PDF where a refusal was
 *                 required is the D-013 shape with a page count.
 */
const readGapFixture = (root) => {
  const abs = path.join(root, INTAKE_FIXTURE_REL)
  if (!fs.existsSync(abs)) return null
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'))
  } catch {
    return null
  }
}

const GAP_FIXTURE_UNAVAILABLE =
  'INTAKE-SCOPE already fails on a missing or unparseable fixture; failing twice would report one defect under two codes'

const gapPair = {
  code: 'GAP-PAIR',
  run(ctx) {
    const { fail, root } = ctx
    const { pillarIds } = ctx.state
    const { diag, pillars } = ctx.data
    if (!ctx.ts?.gap || !ctx.ts?.scoring) {
      fail(`could not build or load gap/register.ts or scoring.ts — the two-measurement pairing rule was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = readGapFixture(root)
    if (!f) return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { gapRegister, gapExclusions } = ctx.ts.gap
    const { applicableQuestions, scorePillars } = ctx.ts.scoring
    let examined = 0

    // The scored set, recomputed from scoring.ts DIRECTLY — comparing the
    // register against its own internals would be circular (the I1 idiom).
    const numeric = Object.fromEntries(
      Object.entries(f.answers ?? {}).map(([id, v]) => [id, typeof v === 'number' ? v : v?.score]),
    )
    const questions = applicableQuestions(diag.questions, f.layer, f.tier)
    const scored = new Set(
      scorePillars(pillars, questions, numeric)
        .filter((o) => o.state === 'scored')
        .map((o) => o.pillarId),
    )

    const entries = gapRegister(f.answers, f.targets, f.tier, f.layer, f.intake)
    const exclusions = gapExclusions(f.answers, f.targets, f.tier, f.layer)

    // Branch 1 — every entry rests on BOTH measurements.
    for (const e of entries) {
      examined++
      if ((f.targets ?? {})[e.pillarId] === undefined)
        fail(`gapRegister emitted an entry for ${e.pillarId} with NO TARGET set — a gap is two measurements, and this one has one. A default or assumed target is a fabrication with a delta`)
      if (!scored.has(e.pillarId))
        fail(`gapRegister emitted an entry for ${e.pillarId}, which is NOT SCORED at the ${f.tier} tier — its "current" is a number scoring.ts never produced`)
      if (typeof e.current !== 'number' || Number.isNaN(e.current))
        fail(`entry ${e.pillarId} carries current=${JSON.stringify(e.current)} — not a measurement`)
    }

    // Branch 2 — entries and exclusions PARTITION the pillar set: every pillar
    // appears exactly once, so an excluded pillar is visible, never silent.
    examined++
    const seen = [...entries.map((e) => e.pillarId), ...exclusions.map((x) => x.pillarId)]
    if (new Set(seen).size !== seen.length)
      fail(`a pillar appears in both the register and the exclusion list — the two are one partition computed by one pass, and an overlap means the pairing rule forked`)
    for (const pid of pillarIds) {
      if (!seen.includes(pid))
        fail(`pillar ${pid} appears in neither the register nor the exclusion list — exclusion must be visible, and a pillar that simply vanishes is the silent-drop this class exists for`)
    }

    // Branch 3 — the mutation probes: degrade one measurement, require the
    // entry to become an exclusion NAMING the missing half.
    const victim = entries[0]?.pillarId
    if (victim) {
      examined++
      const withoutTarget = { ...f.targets }
      delete withoutTarget[victim]
      const e2 = gapRegister(f.answers, withoutTarget, f.tier, f.layer, f.intake)
      const x2 = gapExclusions(f.answers, withoutTarget, f.tier, f.layer)
      if (e2.some((e) => e.pillarId === victim))
        fail(`with ${victim}'s target removed the register STILL emits its entry — a missing target must remove the gap, never default it`)
      const reason = x2.find((x) => x.pillarId === victim)
      if (!reason || !reason.reasons.some((r) => r.includes('no target set')))
        fail(`with ${victim}'s target removed its exclusion does not say 'no target set' — the reason is the honesty; an unexplained absence reads as a check that did not run`)

      examined++
      const victimQuestions = new Set(diag.questions.filter((q) => q.pillarId === victim).map((q) => q.id))
      const withoutAnswers = Object.fromEntries(
        Object.entries(f.answers ?? {}).filter(([id]) => !victimQuestions.has(id)),
      )
      const e3 = gapRegister(withoutAnswers, f.targets, f.tier, f.layer, f.intake)
      const x3 = gapExclusions(withoutAnswers, f.targets, f.tier, f.layer)
      if (e3.some((e) => e.pillarId === victim))
        fail(`with ${victim}'s answers removed the register STILL emits its entry — an unscored pillar has no current, and a current from nowhere is the D-001 shape`)
      const reason3 = x3.find((x) => x.pillarId === victim)
      if (!reason3 || !reason3.reasons.some((r) => r.includes('not assessed')))
        fail(`with ${victim}'s answers removed its exclusion does not say 'not assessed' — unmeasured and untargeted are different missing halves and the reason must name which`)
    }

    return { examined, entries: entries.length, exclusions: exclusions.length }
  },
}

const gapPriority = {
  code: 'GAP-PRIORITY',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.gap) {
      fail(`could not build or load gap/register.ts — the priority formula was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = readGapFixture(root)
    if (!f) return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { gapRegister, GAIN_DECISIVENESS, GAIN_DRIVER, CRITICAL_MIN, HIGH_MIN } = ctx.ts.gap
    let examined = 0

    // The constants come FROM the module. A gate re-declaring 3.0 and 1.5
    // would go on asserting its own copy after someone moved the real ones.
    for (const [name, v] of [
      ['GAIN_DECISIVENESS', GAIN_DECISIVENESS],
      ['GAIN_DRIVER', GAIN_DRIVER],
      ['CRITICAL_MIN', CRITICAL_MIN],
      ['HIGH_MIN', HIGH_MIN],
    ]) {
      examined++
      if (typeof v !== 'number' || Number.isNaN(v))
        fail(`gap/register.ts no longer exports ${name} as a number — the formula's constants must be readable from the module, or every consumer states a formula nobody can verify`)
    }

    const entries = gapRegister(f.answers, f.targets, f.tier, f.layer, f.intake)
    const bands = new Set()
    for (const e of entries) {
      bands.add(e.priority.band)
      // Branch 1 — the score reproduces from the entry's OWN printed inputs.
      examined++
      const i = e.priority.inputs
      const recomputed = i.gapSize * (1 + GAIN_DECISIVENESS * i.decisiveness + GAIN_DRIVER * i.driverAlignment)
      if (Math.abs(recomputed - e.priority.score) > 1e-9)
        fail(`entry ${e.pillarId}: score ${e.priority.score} does not reproduce from its printed inputs (${recomputed}) — the PDF states this formula, so an entry it cannot explain is an unexplained rank`)
      // Branch 2 — the band follows from the score and the constants.
      examined++
      const expected = e.gap <= 0 ? 'met' : e.priority.score >= CRITICAL_MIN ? 'critical' : e.priority.score >= HIGH_MIN ? 'high' : 'moderate'
      if (e.priority.band !== expected)
        fail(`entry ${e.pillarId}: band '${e.priority.band}' but gap ${e.gap} and score ${e.priority.score} derive '${expected}' under the module's own thresholds — a band that does not follow from the stated inputs is a judgement wearing a formula's clothes`)
    }

    // Branch 3 — every band is reachable on the fixture, so every band's
    // rendering has a baseline that has actually shown it.
    for (const band of ['critical', 'high', 'moderate', 'met']) {
      examined++
      if (!bands.has(band))
        fail(`band '${band}' is unreachable on the golden fixture — a priority band no fixture reaches has never been rendered by any baseline, and the first client to reach it gets the untested branch`)
    }

    return { examined, bands: entries.map((e) => `${e.priority.band} ${e.pillarId}`) }
  },
}

const GAP_SRC_DIR = 'src/dgiw/gap'
/** Textual shapes of name-matching inference. Grep-level, INTAKE-MODE's precedent. */
const GAP_INFERENCE_PATTERNS = [
  [/toLowerCase\(\)\s*\.\s*includes\(/, 'lowercased substring matching'],
  [/levenshtein/i, 'edit-distance matching'],
  [/similarity/i, 'similarity scoring'],
  [/fuzzy/i, 'fuzzy matching'],
]

const gapDriver = {
  code: 'GAP-DRIVER',
  run(ctx) {
    const { fail, root } = ctx
    const { pillarIds } = ctx.state
    const f = readGapFixture(root)
    let examined = 0

    // Branch 1 — the fixture's declared mapping is valid against pillars.json.
    if (f) {
      const dp = f.intake?.drivers?.driverPillars
      if (!dp || typeof dp !== 'object' || Object.keys(dp).length === 0) {
        fail(`${INTAKE_FIXTURE_REL} intake maps no driver to any pillar — the driver-alignment input would be 0 in every baseline and its rendering untested; map at least one driver`)
      } else {
        for (const [key, ids] of Object.entries(dp)) {
          examined++
          if (!/^(regulatory|strategic):\d+$/.test(key))
            fail(`driverPillars key ${JSON.stringify(key)} is not a driver reference (list:index) — the mapping references the driver lists the way PrimaryDriverRef does, never a copy of the text`)
          if (!Array.isArray(ids) || ids.length === 0)
            fail(`driverPillars[${key}] is ${JSON.stringify(ids)} — an empty mapping is not a mapping; remove the key`)
          for (const id of Array.isArray(ids) ? ids : [])
            if (!pillarIds.has(id))
              fail(`driverPillars[${key}] names pillar ${id}, which pillars.json does not contain — the mapping is validated against the dataset, never a second list`)
        }
      }
    }

    // Branch 2 — no inference anywhere under src/dgiw/gap/. The mapping is a
    // consultant's declaration; code that guesses it from wording would put a
    // priority on a pillar nobody chose.
    const dir = path.join(root, GAP_SRC_DIR)
    if (!fs.existsSync(dir)) {
      fail(`${GAP_SRC_DIR}/ does not resolve — the gap engine this class is declared over has moved, and the declaration has to move with it`)
      return { examined }
    }
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.ts')).sort()) {
      examined++
      const src = fs.readFileSync(path.join(dir, name), 'utf8')
      for (const [pattern, label] of GAP_INFERENCE_PATTERNS)
        if (pattern.test(src))
          fail(`${GAP_SRC_DIR}/${name} contains ${label} (${pattern}) — driver-to-pillar alignment is DECLARED on the intake, never inferred from a driver's wording; a guessed alignment is a priority nobody chose`)
    }

    // Branch 3 — a stale mapped id contributes NOTHING, asserted by running
    // the real register with one driver remapped to a pillar the dataset does
    // not contain. "Nothing" includes the DENOMINATOR: the stale driver must
    // vanish from the mapped-driver count, not sit in it diluting the others —
    // so the surviving driver's pillar must read alignment 1.0 exactly.
    if (f && ctx.ts?.gap) {
      examined++
      const staleIntake = JSON.parse(JSON.stringify(f.intake ?? {}))
      staleIntake.drivers = {
        ...(staleIntake.drivers ?? {}),
        driverPillars: { 'regulatory:0': ['P99'], 'strategic:0': ['P06'] },
      }
      const entries = ctx.ts.gap.gapRegister(f.answers, f.targets, f.tier, f.layer, staleIntake)
      for (const e of entries)
        if (e.priority.inputs.driverIds.includes('regulatory:0'))
          fail(`entry ${e.pillarId} is aligned by the driver whose only mapped pillar is P99 — a stale id must contribute nothing, or a renamed pillar silently keeps steering priorities`)
      const p06 = entries.find((e) => e.pillarId === 'P06')
      if (p06 && p06.priority.inputs.driverAlignment !== 1)
        fail(`with one valid mapped driver (naming P06) and one stale one, P06 reads driverAlignment ${p06.priority.inputs.driverAlignment} instead of 1.0 — the stale driver is diluting the denominator, which is a contribution`)
    }

    return { examined }
  },
}

const gapRefusal = {
  code: 'GAP-REFUSAL',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.gapStatements) {
      fail(`could not build or load report/gapStatements.ts — the refusal contract was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const { gapStatementsRefusal, buildGapStatementsPdf } = ctx.ts.gapStatements
    const f = readGapFixture(root)
    let examined = 0

    // Branch 1 — a non-actionable intake refuses EVEN WITH entries present,
    // so this probe isolates the intake half of the contract.
    examined++
    const noIntake = gapStatementsRefusal(null, [{ pillarId: 'P01' }])
    if (typeof noIntake !== 'string' || noIntake.length === 0)
      fail(`gapStatementsRefusal(null, [entry]) returned ${JSON.stringify(noIntake)} — with no actionable intake the generator must refuse; an ILLUSTRATIVE gap register is a contradiction, because there is no reference mode for measurements`)

    // Branch 2 — an actionable intake with an EMPTY register still refuses.
    if (f?.intake) {
      examined++
      const emptyRegister = gapStatementsRefusal(f.intake, [])
      if (typeof emptyRegister !== 'string' || emptyRegister.length === 0)
        fail(`gapStatementsRefusal(intake, []) returned ${JSON.stringify(emptyRegister)} — an empty register must refuse, not render a document that documents nothing`)

      // Branch 3 — both measurements present passes, or the button is dead.
      examined++
      if (gapStatementsRefusal(f.intake, [{ pillarId: 'P01' }]) !== null)
        fail(`gapStatementsRefusal refuses an actionable intake WITH entries — the refusal has over-rotated into a generator that can never run`)
    }

    // Branch 4 — the BUILDER enforces the predicate: same refusal, thrown.
    examined++
    const meta = {
      orgName: 'refusal-probe', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z',
      layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-55',
    }
    let threw = null
    try {
      buildGapStatementsPdf({ meta, answers: {}, targets: {}, tier: 'deep', intake: null })
    } catch (err) {
      threw = String(err?.message ?? err)
    }
    if (threw === null)
      fail(`buildGapStatementsPdf produced a document where a refusal was required — the predicate and the builder have forked, and a surface calling the builder directly ships the empty register the predicate exists to stop`)
    else if (threw !== noIntake)
      fail(`buildGapStatementsPdf threw a DIFFERENT message than gapStatementsRefusal returns (${JSON.stringify(threw.slice(0, 60))}) — one predicate decides the refusal; two texts drifting apart is two predicates`)

    return { examined }
  },
}

/*
 * ── G4: THE PLAN GATES ──────────────────────────────────────────────────────
 *
 * `planSlices()` in src/dgiw/plan/slices.ts composes the gap register into
 * per-pillar plans, and AR-56 renders them. Four promises, each asserted
 * against the REAL compiled modules over the same stored fixture:
 *
 *   SLICE-SOURCE  slices are PASS-THROUGH: every slice carries its GapEntry
 *                 by reference (identity, not field equality), in register
 *                 order, one per in-scope entry — and a post-hoc mutation of
 *                 an entry is visible through the slice, which is the proof
 *                 there is no private copy re-deriving gap facts.
 *
 *   SLICE-DEPS    the sequence honours dependsOn. Three ways: no edge in the
 *                 real plan points forward in any slice's sequence; a plan
 *                 with a deliberately REVERSED edge (W2 before W1) resequences
 *                 accordingly; and a shuffled wave array changes nothing.
 *
 *   PLAN-EFFORT   the real AR-56 OUTPUT carries no invented effort. The PDF
 *                 is built and its text extracted (every parenthesised string
 *                 literal in every inflated content stream — the D-018 lesson
 *                 says match ALL operator forms, so this takes the literals
 *                 regardless of operator); after stripping the module's own
 *                 declared statements (which NAME the forbidden units to
 *                 disclaim them), any person-day/FTE/currency match trips.
 *                 And a document printing any week window without the
 *                 assumptions block trips — a duration without its
 *                 disclaimer is a schedule nobody committed to.
 *
 *   PLAN-REFUSAL  AR-56 refuses rather than illustrating: the predicate
 *                 refuses a non-actionable intake and a zero-slice plan,
 *                 passes when there is something true to render, and the
 *                 builder throws the predicate's own message.
 */
const gapFixtureState = (root) => {
  const f = readGapFixture(root)
  if (!f) return null
  return { answers: f.answers, targets: f.targets, tier: f.tier, layer: f.layer, intake: f.intake }
}

const sliceSource = {
  code: 'SLICE-SOURCE',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.gap || !ctx.ts?.slices) {
      fail(`could not build or load gap/register.ts or plan/slices.ts — the pass-through rule was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = gapFixtureState(root)
    if (!f) return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { gapRegister } = ctx.ts.gap
    const { planSlices } = ctx.ts.slices
    const plan = JSON.parse(fs.readFileSync(path.join(root, 'src/dgiw/data/implementationPlan.json'), 'utf8'))
    let examined = 0

    const entries = gapRegister(f.answers, f.targets, f.tier, f.layer, f.intake)
    const slices = planSlices(entries, f.intake, plan, f.layer)
    const byPillar = new Map(entries.map((e) => [e.pillarId, e]))

    // Branch 1 — identity, order, completeness.
    let last = -1
    for (const s of slices) {
      examined++
      if (s.entry !== byPillar.get(s.pillarId))
        fail(`slice ${s.pillarId} carries an entry that is NOT the register's own object — a copy is a fork, and a fork is where a slice starts disagreeing with the /gaps screen`)
      const pos = entries.indexOf(byPillar.get(s.pillarId))
      if (pos < last)
        fail(`slice ${s.pillarId} is out of register order — the register ranks by priority and slices must not re-rank`)
      last = pos
    }

    // Branch 2 — a post-hoc mutation is visible through the slice.
    if (entries.length > 0 && slices.length > 0) {
      examined++
      const victim = slices[0].entry
      const original = victim.priority.band
      victim.priority.band = '__selftest__'
      if (slices[0].entry.priority.band !== '__selftest__')
        fail(`mutating a register entry post-hoc is NOT visible through its slice — the slice holds a private copy, which is re-derivation wearing a cache's clothes`)
      victim.priority.band = original
    }

    return { examined, slices: slices.length, entries: entries.length }
  },
}

const sliceDeps = {
  code: 'SLICE-DEPS',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.gap || !ctx.ts?.slices) {
      fail(`could not build or load the plan modules — the dependency rule was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = gapFixtureState(root)
    if (!f) return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { gapRegister } = ctx.ts.gap
    const { planSlices, waveSequence } = ctx.ts.slices
    const plan = JSON.parse(fs.readFileSync(path.join(root, 'src/dgiw/data/implementationPlan.json'), 'utf8'))
    let examined = 0

    const entries = gapRegister(f.answers, f.targets, f.tier, f.layer, f.intake)

    // Branch 1 — no dependsOn edge points forward in any slice sequence.
    const slices = planSlices(entries, f.intake, plan, f.layer)
    const waveById = new Map(plan.waves.map((w) => [w.id, w]))
    for (const s of slices) {
      examined++
      const pos = Object.fromEntries(s.sequence.map((id, i) => [id, i]))
      for (const id of s.sequence)
        for (const dep of waveById.get(id)?.dependsOn ?? [])
          if (pos[dep] !== undefined && pos[dep] > pos[id])
            fail(`slice ${s.pillarId}: sequence places ${dep} AFTER ${id}, which depends on it — priority may never reorder across a dependency edge (B_STRUCTURE_OVER_PRIORITY)`)
    }

    // Branch 2 — a REVERSED edge resequences. W1 currently precedes W2; a
    // plan where W2 is W1's prerequisite must put W2 first, whatever the
    // ordinals say. This is what proves the sequence reads dependsOn rather
    // than echoing the ordinal order that happens to satisfy it.
    examined++
    const mutated = JSON.parse(JSON.stringify(plan))
    for (const w of mutated.waves) {
      if (w.id === 'W1') w.dependsOn = ['W0', 'W2']
      if (w.id === 'W2') w.dependsOn = []
    }
    const seq = waveSequence(mutated.waves)
    if (seq.indexOf('W2') > seq.indexOf('W1'))
      fail(`with W2 declared W1's prerequisite the sequence still runs ${seq.join(' -> ')} — the composition is echoing wave ordinals, not reading dependsOn, and a re-scoped plan would sequence wrongly`)

    // Branch 3 — a shuffled wave array changes nothing.
    examined++
    const shuffled = { ...plan, waves: [...plan.waves].reverse() }
    const a = JSON.stringify(planSlices(entries, f.intake, plan, f.layer).map((s) => s.sequence))
    const b = JSON.stringify(planSlices(entries, f.intake, shuffled, f.layer).map((s) => s.sequence))
    if (a !== b)
      fail(`reversing the wave ARRAY changed slice sequences — the order is leaking from file order rather than from dependsOn and the declared ordinals`)

    return { examined }
  },
}

/** Every parenthesised string literal in every (inflated) content stream. */
const pdfTextOf = (doc) => {
  const bytes = Buffer.from(doc.output('arraybuffer'))
  const chunks = []
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
    try {
      chunks.push(zlib.inflateSync(raw).toString('latin1'))
    } catch {
      chunks.push(raw.toString('latin1'))
    }
    idx = e + 9
  }
  const literals = []
  for (const c of chunks)
    for (const m of c.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)) literals.push(m[1])
  return literals.map((l) => l.replace(/\\([()\\])/g, '$1')).join(' ')
}

const EFFORT_PATTERN = /\d+\s*(person-|man-|p)?days?\b|FTE|PKR|USD|\$\s*\d/i

const planEffort = {
  code: 'PLAN-EFFORT',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.pillarPlans || !ctx.ts?.slices) {
      fail(`could not build or load report/pillarPlans.ts — the no-invented-effort rule was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = gapFixtureState(root)
    if (!f) return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { buildPillarPlansPdf } = ctx.ts.pillarPlans
    const { B_NO_EFFORT, B_STRUCTURE_OVER_PRIORITY, B_THIN_IS_INFORMATION, PLAN_ASSUMPTIONS } = ctx.ts.slices
    let examined = 0

    const meta = {
      orgName: 'gate-probe', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z',
      layer: f.layer, accent: [0, 0, 0], isDraft: false, artefactId: 'AR-56', mode: 'engagement',
    }
    let doc
    try {
      doc = buildPillarPlansPdf({ meta, answers: f.answers, targets: f.targets, tier: f.tier, intake: f.intake })
    } catch (err) {
      fail(`buildPillarPlansPdf threw on the fixture state (${String(err?.message ?? err).slice(0, 80)}) — the output could not be scanned, so the no-invented-effort rule was NOT checked`)
      return { examined: 0 }
    }

    // WinAnsi bytes (the em-dash is 0x97) come out of the latin1 decode as
    // control characters, while the module constants hold real Unicode — so
    // both sides are flattened to ASCII before any comparison. Every pattern
    // this check matches is ASCII, so nothing the check is FOR is lost.
    const norm = (x) => x.replace(/[^\x20-\x7e]+/g, ' ').replace(/\s+/g, ' ')
    const fullText = norm(pdfTextOf(doc))

    // Branch 1 — no effort figure outside the declared statements, which
    // name the forbidden units in order to disclaim them.
    examined++
    let scan = fullText
    for (const c of [B_NO_EFFORT, B_STRUCTURE_OVER_PRIORITY, B_THIN_IS_INFORMATION, ...PLAN_ASSUMPTIONS])
      scan = scan.split(norm(c)).join(' ')
    const hit = scan.match(EFFORT_PATTERN)
    if (hit)
      fail(`the rendered plan carries an effort-shaped string outside the declared statements: "...${scan.slice(Math.max(0, hit.index - 30), hit.index + 40)}..." — no dataset holds effort, so any such figure was fabricated`)

    // Branch 2 — a week window without the assumptions block is a schedule
    // nobody committed to. The probe fragment is the block's own first line.
    examined++
    const printsWeeks = /Weeks\s*\d/.test(fullText)
    const hasAssumptions = fullText.includes(norm(PLAN_ASSUMPTIONS[0]))
    if (printsWeeks && !hasAssumptions)
      fail(`the plan prints week windows but the assumptions block is absent — a duration without its disclaimer reads as a calendar commitment, and the windows are the reference plan's, not this engagement's`)

    return { examined }
  },
}

const planRefusal = {
  code: 'PLAN-REFUSAL',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.pillarPlans) {
      fail(`could not build or load report/pillarPlans.ts — the refusal contract was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const { pillarPlansRefusal, buildPillarPlansPdf } = ctx.ts.pillarPlans
    const f = gapFixtureState(root)
    let examined = 0

    // Branch 1 — no actionable intake refuses, even with entries and slices.
    examined++
    const noIntake = pillarPlansRefusal(null, [{ pillarId: 'P01' }], [{ pillarId: 'P01' }])
    if (typeof noIntake !== 'string' || noIntake.length === 0)
      fail(`pillarPlansRefusal(null, [entry], [slice]) returned ${JSON.stringify(noIntake)} — a plan derived from measurements has no reference mode, and no intake means no engagement to plan for`)

    if (f?.intake) {
      // Branch 2 — measured pillars but ZERO slices refuses: a plan of
      // nothing would document nothing.
      examined++
      const zeroSlices = pillarPlansRefusal(f.intake, [{ pillarId: 'P01' }], [])
      if (typeof zeroSlices !== 'string' || zeroSlices.length === 0)
        fail(`pillarPlansRefusal(intake, [entry], []) returned ${JSON.stringify(zeroSlices)} — every measured pillar sitting outside the scope must refuse, not render an empty plan`)

      // Branch 3 — something true to render passes, or the button is dead.
      examined++
      if (pillarPlansRefusal(f.intake, [{ pillarId: 'P01' }], [{ pillarId: 'P01' }]) !== null)
        fail(`pillarPlansRefusal refuses an actionable intake with entries AND slices — the refusal has over-rotated into a generator that can never run`)
    }

    // Branch 4 — the builder enforces the predicate: same message, thrown.
    examined++
    const meta = {
      orgName: 'refusal-probe', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z',
      layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-56',
    }
    let threw = null
    try {
      buildPillarPlansPdf({ meta, answers: {}, targets: {}, tier: 'deep', intake: null })
    } catch (err) {
      threw = String(err?.message ?? err)
    }
    if (threw === null)
      fail(`buildPillarPlansPdf produced a document where a refusal was required — the predicate and the builder have forked`)
    else if (threw !== pillarPlansRefusal(null, [], []))
      fail(`buildPillarPlansPdf threw a DIFFERENT message than pillarPlansRefusal returns (${JSON.stringify(threw.slice(0, 60))}) — one predicate decides the refusal; two texts drifting apart is two predicates`)

    return { examined }
  },
}

/*
 * ── G5: THE TRACKING GATES ──────────────────────────────────────────────────
 *
 * Delivery tracking is engagement state: an append-only status log, captured
 * KPI entries, and a period-scoped steering pack (AR-57) composed only from
 * what was recorded. Four promises, each with a class because each decays
 * silently:
 *
 *   KPI-ID          every wave KPI id is unique across the plan and every
 *                   stored capture references an id that exists — a capture
 *                   against a renamed id is a measurement filed under
 *                   nothing. The one stored capture log the gate can read is
 *                   the golden fixture's (INTAKE-SCOPE's precedent).
 *
 *   STATUS-LOG      the compiled tracking module keeps history: an append
 *                   leaves every prior entry byte-identical and the input
 *                   object untouched, no exported function names an edit
 *                   path, malformed stored shapes are rejected, and an
 *                   untracked artefact reads null — never a defaulted state.
 *
 *   PACK-PERIOD     the real AR-57 output contains its period and nothing
 *                   outside it: the fixture seeds entries on BOTH sides of
 *                   the boundary, the pack is built and its text extracted,
 *                   and every out-of-period value must be absent while every
 *                   in-period one is present. A fixture that stops seeding
 *                   both sides fails too — a filter demonstrated against
 *                   nothing is the VACUOUS shape.
 *
 *   REFUSAL-CHANNEL D-020's fix, held: all three engagement-only builders
 *                   throw the typed Refusal (name + discriminant, checked
 *                   across the bundle boundary), and useDeliverable's
 *                   refusal branch carries no console.error while the
 *                   real-failure branch keeps its one.
 */
const kpiId = {
  code: 'KPI-ID',
  run(ctx) {
    const { fail, root } = ctx
    const { plan } = ctx.data
    let examined = 0
    const ids = new Map()
    for (const w of plan.waves ?? []) {
      for (const k of w.kpis ?? []) {
        examined++
        if (!k || typeof k.id !== 'string' || !/^K-W\d+-\d{2}$/.test(k.id))
          fail(`wave ${w.id} carries a KPI without a well-formed id (${JSON.stringify(k?.id)}) — capture entries key on these`)
        else if (ids.has(k.id))
          fail(`KPI id ${k.id} appears in both ${ids.get(k.id)} and ${w.id} — a capture against it is a measurement of two different things`)
        else ids.set(k.id, w.id)
        if (!k || typeof k.text !== 'string' || k.text.trim() === '')
          fail(`wave ${w.id} KPI ${k?.id ?? '?'} has no coverage phrase — an id with no meaning attached`)
      }
    }
    const abs = path.join(root, INTAKE_FIXTURE_REL)
    if (!fs.existsSync(abs)) {
      fail(`${INTAKE_FIXTURE_REL} does not resolve — the stored capture log is the one this gate can read, and without it the capture-references-an-id promise is unchecked`)
      return { examined, ids: ids.size }
    }
    const fixture = JSON.parse(fs.readFileSync(abs, 'utf8'))
    if (!Array.isArray(fixture.kpi) || fixture.kpi.length === 0) {
      fail(`${INTAKE_FIXTURE_REL} stores no KPI captures — the council-pack baseline would freeze a document whose KPI section was never exercised`)
      return { examined, ids: ids.size }
    }
    for (const c of fixture.kpi) {
      examined++
      if (!ids.has(c.kpiId))
        fail(`fixture capture references KPI ${c.kpiId}, which no wave declares — a renamed id stranded a recorded measurement, or the fixture went stale`)
    }
    return { examined, ids: ids.size, captures: fixture.kpi.length }
  },
}

const statusLogGuard = {
  code: 'STATUS-LOG',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.tracking) {
      fail(`could not build or load tracking/log.ts — the append-only contract was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const m = ctx.ts.tracking
    let examined = 0

    // Branch 1 — an append keeps history: the regression is a second entry,
    // the first survives verbatim, and the INPUT log is untouched.
    examined++
    const t1 = { to: 'delivered', at: '2026-01-01T00:00:00.000Z' }
    const log1 = m.appendTransition({}, 'AR-13', t1)
    const log2 = m.appendTransition(log1, 'AR-13', { to: 'in-progress', at: '2026-01-02T00:00:00.000Z', note: 'x' })
    if (!(log2['AR-13']?.length === 2 && log2['AR-13'][0].to === 'delivered' && log2['AR-13'][0].at === t1.at))
      fail(`appendTransition rewrote history — a regression must be a SECOND entry beside a verbatim first, and this log is the audit trail the backend trigger names`)
    if (log1['AR-13']?.length !== 1)
      fail(`appendTransition mutated its INPUT log — a caller holding the old value no longer holds the old record`)

    // Branch 2 — the module surface offers no rewrite. An edit path that
    // exists will eventually be called; the contract is its ABSENCE.
    examined++
    const editPaths = Object.keys(m).filter(
      (k) => typeof m[k] === 'function' && /edit|remove|delete|update|rewrite|clear/i.test(k),
    )
    if (editPaths.length > 0)
      fail(`tracking/log.ts exports ${editPaths.join(', ')} — an append-only log with an edit path is append-only in name, and the name is what an auditor is told`)

    // Branch 3 — malformed stored shapes are rejected, not crashed on or
    // half-loaded; and the fixture's own stored log passes the guard.
    examined++
    if (m.isStatusLog({ 'AR-13': [{ to: 'done', at: 'x' }] }) || m.isStatusLog({ 'AR-13': { to: 'planned', at: 'x' } }) || m.isStatusLog(null))
      fail(`isStatusLog accepts a malformed log — a corrupt stored value would flow into the council pack as delivery fact`)
    if (!m.isStatusLog(log2))
      fail(`isStatusLog rejects a log its own appendTransition built — every legitimately stored value would be silently discarded`)
    const abs = path.join(root, INTAKE_FIXTURE_REL)
    if (fs.existsSync(abs)) {
      const fixture = JSON.parse(fs.readFileSync(abs, 'utf8'))
      examined++
      if (!fixture.status || !m.isStatusLog(fixture.status))
        fail(`the golden fixture stores no valid status log — the council-pack baseline would freeze a document whose status section was never exercised`)
    }

    // Branch 4 — no history is null, never a defaulted state.
    examined++
    if (m.currentState({}, 'AR-01') !== null)
      fail(`currentState invents a state for an untracked artefact — "not tracked" is a fact, and a defaulted 'planned' is a record nobody made`)

    return { examined }
  },
}

const packPeriod = {
  code: 'PACK-PERIOD',
  run(ctx) {
    const { fail, root } = ctx
    if (!ctx.ts?.councilPack || !ctx.ts?.tracking) {
      fail(`could not build or load report/councilPack.ts — the period-scope rule was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const f = gapFixtureState(root)
    const fixture = fs.existsSync(path.join(root, INTAKE_FIXTURE_REL))
      ? JSON.parse(fs.readFileSync(path.join(root, INTAKE_FIXTURE_REL), 'utf8'))
      : null
    if (!f || !fixture?.status || !fixture?.kpi || !fixture?.period)
      return { examined: 0, mayBeEmpty: GAP_FIXTURE_UNAVAILABLE }
    const { buildCouncilPackPdf } = ctx.ts.councilPack
    const { transitionsInPeriod, capturesInPeriod } = ctx.ts.tracking
    let examined = 0

    // The fixture must seed BOTH sides of the boundary, or the filter is
    // demonstrated against nothing.
    examined++
    const allTransitions = Object.entries(fixture.status).flatMap(([artefactId, ts_]) => ts_.map((t) => ({ artefactId, transition: t })))
    const inT = transitionsInPeriod(fixture.status, fixture.period)
    const outT = allTransitions.filter((x) => !inT.some((y) => y.artefactId === x.artefactId && y.transition.at === x.transition.at))
    const inC = capturesInPeriod(fixture.kpi, fixture.period)
    const outC = fixture.kpi.filter((c) => !inC.includes(c))
    if (inT.length === 0 || outT.length === 0 || inC.length === 0 || outC.length === 0)
      fail(`the fixture no longer seeds both sides of the period boundary (transitions in/out ${inT.length}/${outT.length}, captures in/out ${inC.length}/${outC.length}) — the period filter would be demonstrated against nothing, the VACUOUS shape`)

    const meta = {
      orgName: 'gate-probe', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z',
      layer: f.layer, accent: [0, 0, 0], isDraft: false, artefactId: 'AR-57', mode: 'engagement',
    }
    let doc
    try {
      doc = buildCouncilPackPdf({
        meta, answers: f.answers, targets: f.targets, tier: f.tier, intake: f.intake,
        statusLog: fixture.status, kpiLog: fixture.kpi, period: fixture.period,
      })
    } catch (err) {
      fail(`buildCouncilPackPdf threw on the fixture state (${String(err?.message ?? err).slice(0, 80)}) — the output could not be scanned, so the period rule was NOT checked`)
      return { examined }
    }
    const norm = (x) => x.replace(/[^\x20-\x7e]+/g, ' ').replace(/\s+/g, ' ')
    const text = norm(pdfTextOf(doc))

    // Branch 2 — every in-period record is present.
    examined++
    for (const c of inC)
      if (!text.includes(norm(c.value)))
        fail(`in-period capture ${c.kpiId} = ${JSON.stringify(c.value)} is absent from the rendered pack — the period's record is the document's whole claim`)
    for (const x of inT)
      if (x.transition.note && !text.includes(norm(x.transition.note)))
        fail(`in-period transition note ${JSON.stringify(x.transition.note)} is absent — a regression's note is the part a council needs`)

    // Branch 3 — no out-of-period record leaks in.
    examined++
    for (const c of outC)
      if (text.includes(norm(c.value)))
        fail(`OUT-of-period capture ${c.kpiId} = ${JSON.stringify(c.value)} appears in the pack — the document claims a period and rendered outside it`)
    for (const x of outT)
      if (text.includes(x.transition.at.slice(0, 10)))
        fail(`OUT-of-period transition date ${x.transition.at.slice(0, 10)} appears in the pack's tables — the period filter is not filtering`)

    return { examined, inT: inT.length, outT: outT.length, inC: inC.length, outC: outC.length }
  },
}

const REFUSAL_HOOK_REL = 'src/dgiw/report/useDeliverable.ts'
const REFUSING_BUILDERS = [
  ['gapStatements', 'buildGapStatementsPdf', (m) => m.buildGapStatementsPdf({
    meta: { orgName: 'x', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z', layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-55' },
    answers: {}, targets: {}, tier: 'deep', intake: null,
  })],
  ['pillarPlans', 'buildPillarPlansPdf', (m) => m.buildPillarPlansPdf({
    meta: { orgName: 'x', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z', layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-56' },
    answers: {}, targets: {}, tier: 'deep', intake: null,
  })],
  ['councilPack', 'buildCouncilPackPdf', (m) => m.buildCouncilPackPdf({
    meta: { orgName: 'x', engagementId: '', generatedAt: '2026-01-01T00:00:00.000Z', layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-57' },
    answers: {}, targets: {}, tier: 'deep', intake: null, statusLog: {}, kpiLog: [], period: { label: '', from: '', to: '' },
  })],
]

const refusalChannel = {
  code: 'REFUSAL-CHANNEL',
  run(ctx) {
    const { fail, root } = ctx
    let examined = 0

    // Branch 1 — every engagement-only builder refuses through the TYPED
    // class. Checked by discriminant (name + refusal marker), because the
    // gate's bundle is not the app's bundle and instanceof is false across
    // that boundary — the exact hazard isRefusal itself is written for.
    for (const [modName, exportName, invoke] of REFUSING_BUILDERS) {
      examined++
      if (!ctx.ts?.[modName]) {
        fail(`could not build or load the ${modName} module — ${exportName}'s refusal channel was NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
        continue
      }
      let err = null
      try {
        invoke(ctx.ts[modName])
      } catch (e) {
        err = e
      }
      if (err === null)
        fail(`${exportName} produced a document where a refusal was required — the refusal contract has forked from the predicate`)
      else if (err.name !== 'Refusal' || err.refusal !== true)
        fail(`${exportName} refused through a bare ${err.name ?? typeof err} — a designed refusal travelling the error channel is D-020, and useDeliverable would console.error working behaviour`)
    }

    // Branch 2 — the refusal branch in useDeliverable is console-silent, and
    // the real-failure branch keeps its console.error. Source-level, because
    // the hook cannot run outside React: the isRefusal(...) block up to the
    // else must not name console.error; the remainder of the catch must.
    examined++
    const abs = path.join(root, REFUSAL_HOOK_REL)
    if (!fs.existsSync(abs)) {
      fail(`${REFUSAL_HOOK_REL} does not resolve — the refusal branch this class is declared over has moved, and the declaration has to move with it`)
      return { examined }
    }
    const src = fs.readFileSync(abs, 'utf8')
    if (!src.includes("from './refusal'") || !src.includes('isRefusal('))
      fail(`${REFUSAL_HOOK_REL} does not branch on isRefusal — every refusal would travel the error channel again, which is D-020 reopened`)
    const branch = src.match(/if\s*\(isRefusal\(err\)\)\s*\{([\s\S]*?)\}\s*else\s*\{([\s\S]*?)\}/)
    if (!branch) {
      fail(`${REFUSAL_HOOK_REL} has no isRefusal/else split in its catch — the two channels have been refolded into one`)
    } else {
      // Comments are stripped before the scan: the refusal branch's own
      // comment legitimately NAMES console.error in order to forbid it —
      // the PLAN-EFFORT disclaimer-stripping rule, one level down.
      const code = (s) => s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
      if (/console\.(error|warn)/.test(code(branch[1])))
        fail(`${REFUSAL_HOOK_REL}'s REFUSAL branch calls console.${code(branch[1]).match(/console\.(error|warn)/)[1]} — a designed refusal must print nothing; the click-throughs' console-clean assertion depends on it`)
      if (!/console\.error/.test(code(branch[2])))
        fail(`${REFUSAL_HOOK_REL}'s real-failure branch lost its console.error — a REAL fault must keep the error channel; silence there hides genuine breakage`)
    }

    return { examined }
  },
}

/*
 * ── G1: THE INTAKE GATES ────────────────────────────────────────────────────
 *
 * The program-design stage generates the charter (AR-08) and the operating
 * model's council/RACI sections (AR-09) from a per-engagement intake, falling
 * back to ILLUSTRATIVE reference output when none is actionable. Two promises
 * hold that design together, and each gets a class because each can decay
 * silently:
 *
 *   INTAKE-SCOPE  the intake validates pillar scope against pillars.json,
 *                 never a second hardcoded list. The one stored intake the
 *                 gate can read is the golden fixture's (`intake` in
 *                 scripts/golden/fixtures/dgiw.json — the same object the
 *                 harness drives the engagement-mode baselines with), so a
 *                 fixture pillar id the dataset does not carry means either a
 *                 renamed pillar or a fixture nobody updated, and both are
 *                 findings. A fixture with no intake at all fails too: the
 *                 engagement-mode golden entries would silently render
 *                 reference mode, and a baseline that quietly changed modes is
 *                 the check-that-stopped-running shape.
 *
 *   INTAKE-MODE   `intakeIsActionable` is the ONLY reference/engagement
 *                 switch — one function in intake/types.ts, imported by both
 *                 generators, never re-derived. A second inline predicate is
 *                 how one surface watermarks a document another presents as
 *                 client-specific. Grep-level by design: it asserts the import
 *                 exists and that no local declaration re-derives the idea
 *                 (any function/variable whose name contains "actionable").
 */
const INTAKE_FIXTURE_REL = 'scripts/golden/fixtures/dgiw.json'
const INTAKE_PREDICATE = 'intakeIsActionable'
const INTAKE_MODE_GENERATORS = ['src/dgiw/report/charter.ts', 'src/dgiw/report/operatingModel.ts']

const intakeScope = {
  code: 'INTAKE-SCOPE',
  run(ctx) {
    const { fail, root } = ctx
    const { pillarIds } = ctx.state
    const abs = path.join(root, INTAKE_FIXTURE_REL)
    if (!fs.existsSync(abs)) {
      fail(`${INTAKE_FIXTURE_REL} does not resolve — the stored intake fixture is the one intake this gate can read, and without it the validate-against-pillars promise is unchecked`)
      return { examined: 0 }
    }
    let fixture
    try {
      fixture = JSON.parse(fs.readFileSync(abs, 'utf8'))
    } catch (err) {
      fail(`${INTAKE_FIXTURE_REL} is not valid JSON (${err.message}) — an unreadable fixture is not the same as a passing one`)
      return { examined: 0 }
    }
    const intake = fixture.intake
    if (!intake || typeof intake !== 'object') {
      fail(`${INTAKE_FIXTURE_REL} stores no intake — the engagement-mode golden entries would silently render reference mode, and a baseline that changed modes without anyone deciding so is the failure this class exists for`)
      return { examined: 0 }
    }
    const ids = intake.scope?.pillarIds
    if (!Array.isArray(ids) || ids.length === 0) {
      fail(`${INTAKE_FIXTURE_REL} intake declares no scope.pillarIds — an intake with no scope is not actionable, so the fixture would exercise nothing the engagement mode renders`)
      return { examined: 0 }
    }
    let examined = 0
    for (const id of ids) {
      examined++
      if (!pillarIds.has(id))
        fail(`intake fixture scope names pillar ${id}, which pillars.json does not contain — scope is validated against the dataset, never a second list, and a fixture id the dataset dropped is a renamed pillar or a stale fixture`)
    }
    return { examined, ids: [...ids] }
  },
}

const intakeMode = {
  code: 'INTAKE-MODE',
  run(ctx) {
    const { fail, root } = ctx
    let examined = 0
    for (const rel of INTAKE_MODE_GENERATORS) {
      const abs = path.join(root, rel)
      if (!fs.existsSync(abs)) {
        fail(`${rel} does not resolve — an intake-driven generator this class is declared over has moved, and the declaration has to move with it`)
        continue
      }
      examined++
      const { sf } = parseFile(root, abs)
      let importsPredicate = false
      const localPredicates = []
      const visit = (node) => {
        if (ts.isImportDeclaration(node) && /intake\/types['"]$/.test(node.moduleSpecifier.getText(sf))) {
          const named = node.importClause?.namedBindings
          if (named && ts.isNamedImports(named))
            for (const el of named.elements)
              if ((el.propertyName ?? el.name).text === INTAKE_PREDICATE) importsPredicate = true
        }
        if (
          (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) &&
          node.name &&
          ts.isIdentifier(node.name) &&
          /actionable/i.test(node.name.text)
        )
          localPredicates.push(node.name.text)
        ts.forEachChild(node, visit)
      }
      visit(sf)
      if (!importsPredicate)
        fail(`${rel} does not import ${INTAKE_PREDICATE} from intake/types — the reference/engagement switch must be the one shared predicate, and a generator deciding the mode any other way can disagree with the page that generated it`)
      for (const name of localPredicates)
        fail(`${rel} declares ${name} — a second inline actionability predicate. One function decides the mode (intake/types.${INTAKE_PREDICATE}); two copies drifting apart is how one surface watermarks a document another presents as client-specific`)
    }
    return { examined }
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
  tsModules: {
    projection: 'src/dgiw/projection.ts',
    scoring: 'src/dgiw/scoring.ts',
    // G2: the stored-answer guard, run rather than read — ANSWER-SHAPE's engine.
    answers: 'src/dgiw/answerShape.ts',
    // G3: the single gap function and the refusing generator — GAP-PAIR,
    // GAP-PRIORITY and GAP-DRIVER run the first; GAP-REFUSAL calls the second.
    gap: 'src/dgiw/gap/register.ts',
    gapStatements: 'src/dgiw/report/gapStatements.ts',
    // G4: the plan composition and the refusing generator — SLICE-* run the
    // first; PLAN-EFFORT and PLAN-REFUSAL call the second's real builder.
    slices: 'src/dgiw/plan/slices.ts',
    pillarPlans: 'src/dgiw/report/pillarPlans.ts',
    // G5: the append-only tracking primitives and the steering pack —
    // STATUS-LOG and PACK-PERIOD run them; REFUSAL-CHANNEL throws all three
    // refusing builders and reads the class off the error.
    tracking: 'src/dgiw/tracking/log.ts',
    councilPack: 'src/dgiw/report/councilPack.ts',
  },

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
    placement,
    layerCoherence,
    coreChassis,
    artefactEvidence,
    generatorSet,
    tierNesting,
    tierDigest,
    answerShapeGuard,
    targetRange,
    gapPair,
    gapPriority,
    gapDriver,
    gapRefusal,
    sliceSource,
    sliceDeps,
    planEffort,
    planRefusal,
    kpiId,
    statusLogGuard,
    packPeriod,
    refusalChannel,
    intakeScope,
    intakeMode,
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

    // Printed because AR-54 renders a built/not-built column from a DECLARED
    // list and this repo's most repeated defect is a hand-typed count beside a
    // computed one. The two numbers here are the same number by assertion; the
    // line exists so a reader can see that they are.
    const gs = r['GENERATOR-SET']
    if (gs?.declared) {
      out.push(
        `GENERATOR-SET ${gs.declared.length} declared in ${GENERATOR_SET_DECL.rel.split('/').pop()}` +
          ` = ${gs.scanned.length} scanned from the report sources — AR-54's built column, asserted rather than trusted`,
      )
    }

    // G2: the tier shape, printed from the check's own counts — never retyped.
    const tn = r['TIER-NESTING']
    if (tn?.counts) {
      const c = tn.counts
      out.push(
        `TIER quick ${c.quick} ⊂ standard ${c.quick + c.standard} ⊂ deep ${c.quick + c.standard + c.deep} — ` +
          `nesting asserted through scoring.applicableQuestions per layer; tier+coverage in every score-carrying digest (TIER-DIGEST)`,
      )
    }

    // G3: the register the gates ran, printed from the checks' own results —
    // which pillar reached which band is the fact GAP-PRIORITY rests on.
    const gp = r['GAP-PAIR']
    const gb = r['GAP-PRIORITY']
    if (gp?.entries !== undefined && gb?.bands) {
      out.push(
        `GAP register ${gp.entries} entries (${gb.bands.join(', ')}) · ${gp.exclusions} exclusions — ` +
          `pairing, formula and bands asserted through the compiled gap/register.ts; refusal through gapStatements.ts (GAP-REFUSAL)`,
      )
    }

    // G4: what the plan gates ran, printed from the checks' own results.
    const ss = r['SLICE-SOURCE']
    if (ss?.slices !== undefined) {
      out.push(
        `PLAN ${ss.slices} slice${ss.slices === 1 ? '' : 's'} from ${ss.entries} register entr${ss.entries === 1 ? 'y' : 'ies'} — ` +
          `pass-through and dependsOn asserted through the compiled plan/slices.ts; ` +
          `no invented effort and the refusal asserted through the real AR-56 output (PLAN-EFFORT, PLAN-REFUSAL)`,
      )
    }

    // G5: the tracking gates, printed from the checks' own results.
    const ki = r['KPI-ID']
    const pp2 = r['PACK-PERIOD']
    if (ki?.ids !== undefined) {
      out.push(
        `TRACKING ${ki.ids} KPI ids unique, ${ki.captures ?? 0} fixture captures resolve (KPI-ID) · ` +
          `status log append-only through the compiled module (STATUS-LOG) · ` +
          (pp2?.inT !== undefined
            ? `pack scoped to its period over ${pp2.inT}+${pp2.inC} in / ${pp2.outT}+${pp2.outC} out (PACK-PERIOD) · `
            : '') +
          `refusals typed, refusal branch console-silent (REFUSAL-CHANNEL)`,
      )
    }

    // G5: the authored placement, printed from the check's own counts.
    const pl = r['PLACEMENT']
    if (pl?.placed !== undefined) {
      out.push(
        `PLACEMENT ${pl.placed} artefacts placed across ${plan.waves.length} waves, ${pl.unplaced} unplaced with written reasons — ` +
          `every register id exactly once, both dangling directions asserted`,
      )
    }

    // G1: what the intake gates actually examined, printed rather than implied.
    const is = r['INTAKE-SCOPE']
    if (is?.ids)
      out.push(
        `INTAKE fixture scope ${is.ids.join(', ')} — validated against pillars.json; ` +
          `${INTAKE_PREDICATE} imported by ${INTAKE_MODE_GENERATORS.map((p) => p.split('/').pop()).join(' + ')}, no second predicate`,
      )

    // Printed in BOTH states. A gate that is not running is a fact to be stated,
    // not an absence a reader has to notice — the REGISTRY line's discipline.
    for (const l of policySummary(ctx)) out.push(l)

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
