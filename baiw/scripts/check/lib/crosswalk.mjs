/**
 * The crosswalk check classes, as a factory — one implementation, N modules.
 *
 * On the `benchmark-rollup.mjs` / `category-universe.mjs` precedent: a module's
 * rule file declares what is true of ITS spine and gets the classes back. DGIW
 * projects onto eleven curated pillars, TAIW onto 35 TACR sections, HAIW will
 * project onto 80 HACR subcategories, and the arithmetic is identical in all
 * three. What differs is declared, never inferred.
 *
 * ─── WHAT MOVED, AND WHAT THAT COST ────────────────────────────────────────
 *
 * These five classes were DGIW's §12–§17 and are unchanged in substance. Two
 * things did change, both because a 35-section spine is not an 11-pillar one:
 *
 * 1. THE SPINE-SIDE ORPHAN RULE STOPPED BEING AN ASSERTION EVERYWHERE.
 *    DGIW fails when a pillar is mapped by no framework, and it is right to: the
 *    eleven pillars ARE a data-governance capability model, so a pillar nothing
 *    maps is scorable evidence contributing to no scorecard. TACR's 35 sections
 *    describe a customs administration, and most of it is not data management —
 *    Clearance Automation, Revenue Automation, Risk Models and Training are
 *    legitimately outside DMBOK, DCAM and COBIT. Seven of 35 are unmapped and
 *    every one is customs operations. So `spineCoverage` is declared per module:
 *    `assert` for a curated spine, `report` for a domain one, and `report`
 *    REQUIRES A REASON — the `mayBeEmpty` precedent, because a rule someone
 *    switched off should cost them a sentence.
 *
 * 2. A LEAF WITH NO MAPPING MOVED FROM CROSSWALK-ORPHAN TO FRAMEWORK-REACH.
 *    Under DGIW it was always a defect. Under TAIW it is sometimes a fact about
 *    the assessment — DMBOK's Document & Content Management has no home because
 *    TACR asks nothing about it — and the difference between the two has to be
 *    WRITTEN DOWN by a person, which is what an exception map with a mandatory
 *    reason forces. It is still a failure by default; what changed is that there
 *    is now a way to say why, and a stale one fails.
 *
 * ─── NOTES THAT SURVIVED THE MOVE ──────────────────────────────────────────
 *
 * PROJECTION IS LEAF-ONLY. A dimension with children carries no mappings; its
 * score rolls up inside the framework. COBIT's APO14 and its ten sub-practices
 * must never both count a spine node — that double-counts the same evidence.
 *
 * `coverageWeight` is the share of the DIMENSION that the SPINE NODE accounts
 * for, summing to 1.0 per leaf dimension. Under the other reading a dimension
 * score is not a weighted mean and the scorecards cannot be reconciled.
 */
import { unique, sorted, near, shapeCheck, str, num, idLike, oneOf } from './assert.mjs'

const EPS = 1e-9

/** Ascending, code-unit order. Never `localeCompare`. */
const byStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * @param cfg.label                  module label used in every message
 * @param cfg.frameworkIds           which frameworks this module crosswalks
 * @param cfg.entryIdPattern         e.g. /^CW-T-\d{3}$/ — namespaced per module
 * @param cfg.spineIdPattern         e.g. /^[a-z]+_[a-z]+$/
 * @param cfg.spineLabel             'pillar' | 'section' | 'subcategory'
 * @param cfg.spine                  (ctx) => [{ id, name }]
 * @param cfg.entries                (ctx) => the crosswalk entries AS THE FILE HAS THEM
 * @param cfg.spineIdField           the field naming the spine node in that file —
 *                                   'spineId' for a module authored after D5 stage C,
 *                                   'pillarId' for DGIW, whose 91 entries predate the
 *                                   generic engine and keep their own vocabulary
 * @param cfg.frameworkData          (ctx) => { frameworks, dimensions }
 * @param cfg.layers                 [] for a module with no layer concept
 * @param cfg.layerValues            allowed tag values, or null when layerless
 * @param cfg.layerShows             (filter, tag) => boolean; unused when layerless
 * @param cfg.distinctnessFloor      per module — 0.15 is not protective at every granularity
 * @param cfg.concentrationCeiling   max induced weight on one spine node
 * @param cfg.concentrationExceptions { [frameworkCode]: reason }
 * @param cfg.reachExceptions        { [dimensionCode]: reason }
 * @param cfg.spineCoverage          { mode: 'assert' } | { mode: 'report', reason }
 * @param cfg.induced                (ctx, frameworkId) => Record<spineId, number> | null
 */
export function makeCrosswalkChecks(cfg) {
  const {
    label,
    frameworkIds,
    entryIdPattern,
    spineIdPattern,
    spineLabel,
    layers = [],
    layerValues = null,
    layerShows = () => true,
    distinctnessFloor,
    concentrationCeiling,
    concentrationExceptions = {},
    reachExceptions = {},
    spineCoverage,
    induced,
    spineIdField = 'spineId',
  } = cfg

  if (spineCoverage.mode === 'report' && !String(spineCoverage.reason ?? '').trim())
    throw new Error(`${label}: spineCoverage 'report' without a reason — a rule switched off should cost a sentence`)

  /** Everything the classes share, derived once per run. */
  const derive = (ctx) => {
    const fw = cfg.frameworkData(ctx) ?? {}
    const all = fw.frameworks ?? []
    const FRAMEWORKS = all.filter((f) => frameworkIds.includes(f.id)).sort((a, b) => byStr(a.id, b.id))
    const DIMENSIONS = (fw.dimensions ?? []).filter((d) => frameworkIds.includes(d.frameworkId)).sort((a, b) => byStr(a.id, b.id))
    // RAW is what the file holds and what CROSSWALK-SHAPE validates, field names
    // and all. ENTRIES is the normalised view every other class computes over.
    // Validating the normalised copy would mean the shape check inspects
    // something no author ever wrote — and would miss a stray key in the file.
    const RAW = [...(cfg.entries(ctx) ?? [])].sort((a, b) => byStr(a.id, b.id))
    const ENTRIES = RAW.map((e) => (spineIdField === 'spineId' ? e : { ...e, spineId: e[spineIdField] }))
    const SPINE = [...(cfg.spine(ctx) ?? [])].sort((a, b) => byStr(a.id, b.id))
    const hasChildren = new Set(DIMENSIONS.map((d) => d.parentId).filter(Boolean))
    const leafDims = DIMENSIONS.filter((d) => !hasChildren.has(d.id))
    const entriesByDim = new Map()
    for (const e of ENTRIES) entriesByDim.set(e.dimensionId, [...(entriesByDim.get(e.dimensionId) ?? []), e])
    const effWeight = (d) => {
      const by = new Map(DIMENSIONS.map((x) => [x.id, x]))
      let w = 1
      let cur = d
      for (let g = 0; cur && g < 8; g++) { w *= cur.weight; cur = cur.parentId ? by.get(cur.parentId) : null }
      return w
    }
    return {
      FRAMEWORKS, DIMENSIONS, ENTRIES, RAW, SPINE, hasChildren, leafDims, entriesByDim, effWeight,
      spineIds: new Set(SPINE.map((s) => s.id)),
      dimById: new Map(DIMENSIONS.map((d) => [d.id, d])),
      dimByCode: new Map(DIMENSIONS.map((d) => [d.code, d])),
      frameworkById: new Map(FRAMEWORKS.map((f) => [f.id, f])),
    }
  }

  // ── SPINE-UNIVERSE ────────────────────────────────────────────────────────
  /**
   * The ids the crosswalk points at are exactly the ids the module's own data
   * yields. `CATEGORY-UNIVERSE` one level down.
   *
   * This is what stops a crosswalk pointing at a renamed section. Rename a TACR
   * section and its derived id changes; 73 mappings then silently address nothing,
   * every affected dimension goes `not-applicable`, and the scorecard renders with
   * blanks that look like scope decisions. Nothing else in the gate joins these two
   * files.
   */
  const spineUniverse = {
    code: 'SPINE-UNIVERSE',
    run(ctx) {
      const { fail } = ctx
      const { SPINE, ENTRIES, spineIds } = derive(ctx)
      if (SPINE.length === 0) { fail(`${label}: the module yielded no spine nodes, so there is nothing for a crosswalk to point at`); return { examined: 0 } }

      const dupes = SPINE.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i)
      for (const d of [...new Set(dupes)].sort())
        fail(`${label}: two spine nodes share the id ${JSON.stringify(d)} — mappings to it are ambiguous and its score would be whichever one the map wrote last`)

      const used = new Set(ENTRIES.map((e) => e.spineId))
      for (const id of [...used].sort())
        if (!spineIds.has(id))
          fail(
            `${label}: crosswalk maps ${JSON.stringify(id)}, which is not a ${spineLabel} the module's own data yields. ` +
              `Either the ${spineLabel} was renamed and the mappings were not, or the id was mistyped — both produce ` +
              `dimensions that render not-applicable with no stated reason.`,
          )
      return { examined: SPINE.length, mapped: used.size, unmapped: SPINE.filter((s) => !used.has(s.id)).map((s) => s.id) }
    },
  }

  // ── CROSSWALK-SHAPE ───────────────────────────────────────────────────────
  const crosswalkShape = {
    code: 'CROSSWALK-SHAPE',
    run(ctx) {
      const { fail, failAs: f } = ctx
      const { FRAMEWORKS, DIMENSIONS, ENTRIES, RAW, frameworkById, dimById } = derive(ctx)

      shapeCheck(f, 'CROSSWALK-SHAPE', `${label} framework`, FRAMEWORKS, {
        id: idLike(/^FW-\d{2}$/), code: str(), name: str(), publisher: str(), versionLabel: str(),
        scaleMin: num, scaleMax: num,
        structureConfidence: oneOf(['high', 'medium-high', 'medium', 'low']),
        structureNotes: str(20),
      }, ['id', 'code', 'name', 'publisher', 'versionLabel', 'scaleMin', 'scaleMax', 'structureConfidence', 'structureNotes'])

      shapeCheck(f, 'CROSSWALK-SHAPE', `${label} dimension`, DIMENSIONS, {
        id: idLike(/^DIM-\d{3}$/), frameworkId: idLike(/^FW-\d{2}$/),
        parentId: (v) => (v === null || /^DIM-\d{3}$/.test(String(v)) ? null : `must be null or a DIM-nnn id, got ${JSON.stringify(v)}`),
        code: str(), name: str(),
        weight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v}`),
        level: (v) => (v === 1 || v === 2 ? null : `must be 1 or 2, got ${JSON.stringify(v)}`),
      }, ['id', 'frameworkId', 'parentId', 'code', 'name', 'weight', 'level'])

      // `layer` is required only where the module HAS layers. TACR and HACR carry
      // no layer tag on any question, so demanding one on a mapping would be
      // inventing a scope the data does not have.
      const entrySpec = {
        id: idLike(entryIdPattern),
        dimensionId: idLike(/^DIM-\d{3}$/),
        [spineIdField]: idLike(spineIdPattern),
        coverageWeight: (v) => num(v) ?? (v > 0 && v <= 1 ? null : `must be in (0, 1], got ${v} — a zero-weight mapping is a mapping that does nothing`),
        rationale: str(20),
        questionIds: (v) => (Array.isArray(v) ? null : 'must be an array when present'),
      }
      const required = ['id', 'dimensionId', spineIdField, 'coverageWeight', 'rationale']
      if (layerValues) { entrySpec.layer = oneOf(layerValues); required.push('layer') }
      shapeCheck(f, 'CROSSWALK-SHAPE', `${label} crosswalk entry`, RAW, entrySpec, required)

      unique(f, 'CROSSWALK-SHAPE', `${label} crosswalk entry`, RAW.map((e) => e.id))

      for (const d of DIMENSIONS) {
        if (!frameworkById.has(d.frameworkId)) fail(`dimension ${d.id} -> framework ${d.frameworkId} is not in this module's declared framework set`)
        if (d.parentId !== null) {
          const parent = dimById.get(d.parentId)
          if (!parent) fail(`dimension ${d.id} -> parent ${d.parentId} does not exist`)
          else if (parent.frameworkId !== d.frameworkId) fail(`dimension ${d.id} has a parent in a different framework`)
          else if (parent.level >= d.level) fail(`dimension ${d.id} (level ${d.level}) has parent ${d.parentId} at level ${parent.level}`)
        } else if (d.level !== 1) {
          fail(`dimension ${d.id} has no parent but is level ${d.level}`)
        }
      }

      sorted(f, 'CROSSWALK-SHAPE', `${label} crosswalk entries`, RAW.map((e) => e.id))
      return { examined: FRAMEWORKS.length + DIMENSIONS.length + RAW.length }
    },
  }

  // ── CROSSWALK-WEIGHT ──────────────────────────────────────────────────────
  /**
   * coverageWeights sum to 1.0 per leaf dimension; sibling dimension weights sum
   * to 1.0 within each parent and within each framework.
   *
   * Without the second, effective leaf weights do not sum to 1.0, the induced
   * vector does not sum to 1.0, and CROSSWALK-DISTINCTNESS ends up comparing
   * vectors of different total mass — measuring the authoring error rather than
   * the frameworks.
   *
   * THE RETAINED-ZERO ASSERTION IS LAYER-DEPENDENT AND IS DECLARED, NOT SKIPPED.
   * With no layers, every mapping is always visible, so "retains zero under a
   * layer while its framework is otherwise in scope" cannot occur. The check
   * reports that it did not run rather than passing silently — a class that
   * quietly has nothing to assert on a module is how FRAMEWORK-COVERAGE spent a
   * phase being decoration.
   */
  const crosswalkWeight = {
    code: 'CROSSWALK-WEIGHT',
    run(ctx) {
      const { fail } = ctx
      const { FRAMEWORKS, DIMENSIONS, leafDims, entriesByDim, hasChildren } = derive(ctx)
      const retained = {}

      for (const d of leafDims) {
        const es = entriesByDim.get(d.id) ?? []
        if (es.length === 0) continue // FRAMEWORK-REACH's business
        const total = es.reduce((s, e) => s + (typeof e.coverageWeight === 'number' ? e.coverageWeight : 0), 0)
        if (!near(total, 1))
          fail(`leaf dimension ${d.id} (${d.code}) coverageWeights sum to ${total.toFixed(4)}, not 1.0 — the dimension would be ${total < 1 ? 'under-scored' : 'inflated'} by ${(Math.abs(1 - total) * 100).toFixed(1)}%`)
        retained[d.id] = {}
        for (const layer of layers) retained[d.id][layer] = es.filter((e) => layerShows(layer, e.layer)).reduce((s, e) => s + e.coverageWeight, 0)
      }

      // A dimension with no visible mapping under a layer where its framework is
      // otherwise in scope is an authoring gap dressed as a legitimate
      // not-applicable. Unreachable when `layers` is empty — see the header.
      let layerAssertions = 0
      for (const d of leafDims) {
        const share = retained[d.id]
        if (!share) continue
        for (const layer of layers) {
          if (layer === 'all') continue
          layerAssertions++
          const inScope = leafDims.some((o) => o.frameworkId === d.frameworkId && (retained[o.id]?.[layer] ?? 0) > 0)
          if (share[layer] === 0 && inScope)
            fail(`leaf dimension ${d.id} (${d.code}) retains 0 weight under the ${layer} layer while its framework is otherwise in scope — every mapping it has is tagged for the other layer, which is an authoring gap, not a not-applicable`)
        }
      }

      /*
       * THE PER-FRAMEWORK LAYER GAP. This was FRAMEWORK-COVERAGE's one failure
       * path and it is NOT implied by the per-leaf rule above — the selftest
       * proved that within minutes of the reclassification being written.
       *
       * The per-leaf rule is guarded on "while its framework is otherwise in
       * scope". If EVERY mapping a framework has is tagged for one layer, no leaf
       * of it retains anything under the other, `inScope` is false everywhere, and
       * the per-leaf rule stays silent on the worst version of the defect: a whole
       * scorecard rendering blank with no stated reason. One level up is a
       * different assertion, not a special case of the one below it.
       */
      for (const f of FRAMEWORKS) {
        const leaves = leafDims.filter((d) => d.frameworkId === f.id)
        const at = (layer) => leaves.reduce((n, d) => n + ((retained[d.id]?.[layer] ?? 0) > 0 ? 1 : 0), 0)
        const anywhere = leaves.reduce((n, d) => n + ((entriesByDim.get(d.id) ?? []).length > 0 ? 1 : 0), 0)
        for (const layer of layers) {
          if (layer === 'all') continue
          layerAssertions++
          if (anywhere > 0 && at(layer) === 0)
            fail(`framework ${f.id} (${f.code}) retains nothing under the ${layer} layer while mapping ${anywhere} leaf dimension(s) overall — every mapping it has is tagged for the other layer, so an engagement at this layer renders its scorecard blank with no stated reason`)
        }
      }

      for (const f of FRAMEWORKS) {
        const tops = DIMENSIONS.filter((d) => d.frameworkId === f.id && d.parentId === null)
        const total = tops.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
        if (tops.length && !near(total, 1))
          fail(`framework ${f.id} (${f.code}) level-1 dimension weights sum to ${total.toFixed(4)}, not 1.0 — its induced ${spineLabel} weight vector would not sum to 1 and could not be compared with the others`)
      }
      for (const parentId of hasChildren) {
        const kids = DIMENSIONS.filter((d) => d.parentId === parentId)
        const total = kids.reduce((s, d) => s + (typeof d.weight === 'number' ? d.weight : 0), 0)
        if (!near(total, 1)) fail(`children of ${parentId} have weights summing to ${total.toFixed(4)}, not 1.0`)
      }

      return { examined: leafDims.length + FRAMEWORKS.length + hasChildren.size, layerAssertions, layered: layers.length > 0 }
    },
  }

  // ── CROSSWALK-ORPHAN ──────────────────────────────────────────────────────
  const crosswalkOrphan = {
    code: 'CROSSWALK-ORPHAN',
    run(ctx) {
      const { fail } = ctx
      const { ENTRIES, SPINE, dimById, hasChildren, spineIds } = derive(ctx)
      for (const e of ENTRIES) {
        const d = dimById.get(e.dimensionId)
        if (!d) fail(`entry ${e.id} -> dimension ${e.dimensionId} is not a dimension of this module's frameworks`)
        else if (hasChildren.has(d.id))
          fail(`entry ${e.id} maps ${d.id} (${d.code}), which has children — projection is leaf-only, and a parent counting a ${spineLabel} its children also count double-counts the same evidence`)
        if (!spineIds.has(e.spineId)) fail(`entry ${e.id} -> ${spineLabel} ${e.spineId} does not exist`)
      }

      // The other direction. Asserted on a curated spine, reported on a domain
      // one — see this file's header for why that had to become a parameter.
      const mapped = new Set(ENTRIES.map((e) => e.spineId))
      const unmapped = SPINE.filter((s) => !mapped.has(s.id)).map((s) => s.id).sort()
      if (spineCoverage.mode === 'assert')
        for (const s of unmapped)
          fail(`${spineLabel} ${s} is mapped by no crosswalk entry in any of the ${frameworkIds.length} frameworks — it is scorable on the assessment and contributes to none of the scorecards, so the evidence behind it counts toward nothing a client is shown`)

      return { examined: ENTRIES.length + SPINE.length, unmapped, coverageMode: spineCoverage.mode }
    },
  }

  // ── FRAMEWORK-REACH ───────────────────────────────────────────────────────
  /**
   * A framework leaf with no mapping must be DECLARED, with a reason naming the
   * evidence gap.
   *
   * DMBOK's `DM07` Document & Content Management has no home in TACR: zero of 640
   * questions ask about document or content management. That is a real gap in the
   * assessment rather than an absence in the domain — customs runs on declarations
   * and certificates — and the honest response is to say so on the page, not to
   * force the dimension onto Clearance Automation and call it covered.
   *
   * The exception map is the `SLUG_EXCEPTIONS` shape: keyed by dimension code,
   * valued with a reason. A STALE ENTRY FAILS, so a dimension that later gains a
   * mapping cannot leave a permanent hole; an entry naming a code this module's
   * frameworks do not carry fails too, because it is either a typo or a leftover
   * from a framework that was dropped.
   *
   * RETAINED MASS PRINTS ON EVERY BUILD. "DGI reaches 59% of itself here" has to
   * be a number on stdout, not a paragraph in a report nobody re-reads.
   */
  const frameworkReach = {
    code: 'FRAMEWORK-REACH',
    run(ctx) {
      const { fail } = ctx
      const { FRAMEWORKS, leafDims, entriesByDim, effWeight, dimByCode } = derive(ctx)
      const declared = new Set(Object.keys(reachExceptions))

      for (const code of [...declared].sort()) {
        const d = dimByCode.get(code)
        if (!d) { fail(`FRAMEWORK-REACH declares an exception for ${JSON.stringify(code)}, which is not a dimension of this module's frameworks — a typo, or a leftover from a framework that was dropped`); continue }
        if (!String(reachExceptions[code] ?? '').trim())
          fail(`FRAMEWORK-REACH exception ${code} has no stated reason — an unmapped dimension is a claim about the assessment's coverage and someone should have to write it down`)
        if ((entriesByDim.get(d.id) ?? []).length > 0)
          fail(`FRAMEWORK-REACH exception ${code} is STALE: the dimension now has ${(entriesByDim.get(d.id) ?? []).length} mapping(s). Remove the exception — a fixed gap must not leave a permanent hole in the check.`)
      }

      const reach = []
      for (const f of FRAMEWORKS) {
        const leaves = leafDims.filter((d) => d.frameworkId === f.id)
        const homed = leaves.filter((d) => (entriesByDim.get(d.id) ?? []).length > 0)
        for (const d of leaves) {
          if (homed.includes(d)) continue
          if (declared.has(d.code)) continue
          fail(
            `leaf dimension ${d.id} (${d.code} — ${d.name}) has no mapping and no declared exception. It carries ` +
              `${(effWeight(d) * 100).toFixed(1)}% of ${f.code} and would render not-applicable on the scorecard with no stated reason. ` +
              `Either map it, or declare it in this module's FRAMEWORK-REACH exceptions with the evidence gap named.`,
          )
        }
        const mass = homed.reduce((s, d) => s + effWeight(d), 0)
        reach.push({ code: f.code, homed: homed.length, leaves: leaves.length, mass,
          gaps: leaves.filter((d) => !homed.includes(d)).map((d) => `${d.code} ${(effWeight(d) * 100).toFixed(0)}%`) })
      }
      return { examined: leafDims.length, reach }
    },
  }

  // ── CROSSWALK-CONCENTRATION ───────────────────────────────────────────────
  /**
   * No framework may put more than the declared ceiling of its induced weight on
   * ONE spine node.
   *
   * ITS OWN CLASS, NOT A CLAUSE OF FRAMEWORK-COVERAGE, because it is the defect
   * CROSSWALK-DISTINCTNESS structurally cannot see. At TACR's 8 categories all
   * three frameworks put 31–50% of their weight on the single 'Data Governance'
   * category — and every pairwise L1 still cleared the 0.15 floor, because the
   * REMAINING half spread differently. Distinctness measures how far apart two
   * vectors are; this measures whether either of them is really about one thing.
   *
   * THE CEILING IS PER MODULE, AND SETTING IT NEEDS BOTH HALVES OF THE ARGUMENT.
   *
   * Readability fixes an upper bound that does not scale: above roughly a third a
   * reader cannot distinguish the framework's view from one leaf's score, whether
   * the spine has 11 nodes or 80. That is why DGIW and TAIW share 35%.
   *
   * But a ceiling must also be REACHABLE by a plausible authoring error, or it is
   * decoration — the FRAMEWORK-COVERAGE lesson, and the same argument the
   * distinctness floor gets. At HAIW's 80 subcategories, three of the four
   * frameworks could not hit 35% without piling several leaves onto one node
   * (DMBOK2's heaviest leaf is 14% of the framework, DCAM's 15%, COBIT's APO14
   * sub-practices at most 7.7%), so HAIW declares 25% — 1.34× its observed maximum.
   * Read the module's own comment for the measurement behind its number.
   *
   * Exceptions are declared per framework code with a reason, and a stale one
   * fails. That is how a measured, accepted concentration stays visible instead of
   * becoming a raised ceiling that hides the next one.
   */
  const crosswalkConcentration = {
    code: 'CROSSWALK-CONCENTRATION',
    run(ctx) {
      const { fail } = ctx
      const { FRAMEWORKS } = derive(ctx)
      const declared = new Set(Object.keys(concentrationExceptions))
      const rows = []
      let examined = 0

      for (const f of FRAMEWORKS) {
        const w = induced(ctx, f.id)
        if (w === null || w === undefined) {
          fail(`could not compute induced ${spineLabel} weights for ${f.code} — the projection engine did not load, so this class did NOT run for it: ${ctx.tsLoadError ?? 'projection module unavailable'}`)
          continue
        }
        examined++
        const top = Object.entries(w).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
        if (top.length === 0) continue
        const [node, share] = top[0]
        rows.push({ code: f.code, node, share, reached: top.length })
        const exempt = declared.has(f.code)
        if (share > concentrationCeiling + EPS && !exempt)
          fail(
            `${f.code} puts ${(share * 100).toFixed(1)}% of its induced weight on the single ${spineLabel} ${node}, above the ` +
              `${(concentrationCeiling * 100).toFixed(0)}% ceiling. Its scorecard is then largely a restatement of that one score, ` +
              `which CROSSWALK-DISTINCTNESS cannot see — two vectors can be far apart and both be about one thing. Rebalance the ` +
              `crosswalk, choose a finer spine, or declare it with a reason.`,
          )
        if (exempt && share <= concentrationCeiling + EPS)
          fail(
            `CROSSWALK-CONCENTRATION exception ${f.code} is STALE: it now peaks at ${(share * 100).toFixed(1)}%, within the ` +
              `${(concentrationCeiling * 100).toFixed(0)}% ceiling. Remove it — an accepted concentration that has been fixed must ` +
              `not leave a permanent hole.`,
          )
      }
      for (const code of [...declared].sort()) {
        if (!FRAMEWORKS.some((f) => f.code === code))
          fail(`CROSSWALK-CONCENTRATION declares an exception for ${JSON.stringify(code)}, which is not a framework this module crosswalks`)
        else if (!String(concentrationExceptions[code] ?? '').trim())
          fail(`CROSSWALK-CONCENTRATION exception ${code} has no stated reason`)
      }
      return { examined, rows, ceiling: concentrationCeiling }
    },
  }

  // ── CROSSWALK-DISTINCTNESS ────────────────────────────────────────────────
  /**
   * Frameworks whose induced vectors are nearly equal produce nearly identical
   * scorecards — the whole proposition failing silently, visible from the
   * crosswalk alone with no answers.
   *
   * THE FLOOR IS PER MODULE. 0.15 was calibrated against 11 pillars; at 35
   * sections the observed minimum is 0.883, so 0.15 there would be a floor no
   * plausible authoring error could fall through. A floor that cannot fail is
   * decoration, which is the lesson FRAMEWORK-COVERAGE cost a phase to learn.
   */
  const crosswalkDistinctness = {
    code: 'CROSSWALK-DISTINCTNESS',
    run(ctx) {
      const { fail } = ctx
      const { FRAMEWORKS, SPINE } = derive(ctx)
      const vec = new Map()
      for (const f of FRAMEWORKS) {
        const w = induced(ctx, f.id)
        if (w === null || w === undefined) {
          fail(`could not compute induced ${spineLabel} weights — the vectors were NOT compared and this class did not run: ${ctx.tsLoadError ?? 'projection module unavailable'}`)
          return { examined: 0, l1Pairs: [] }
        }
        vec.set(f.id, w)
      }
      const order = SPINE.map((s) => s.id).sort(byStr)
      const l1Pairs = []
      for (let i = 0; i < FRAMEWORKS.length; i++)
        for (let k = i + 1; k < FRAMEWORKS.length; k++) {
          const a = FRAMEWORKS[i], b = FRAMEWORKS[k]
          const va = vec.get(a.id), vb = vec.get(b.id)
          const l1 = order.reduce((s, p) => s + Math.abs((va[p] ?? 0) - (vb[p] ?? 0)), 0)
          l1Pairs.push({ a: a.code, b: b.code, l1 })
          if (l1 < distinctnessFloor)
            fail(
              `${a.code} and ${b.code} have induced ${spineLabel} weight vectors only ${l1.toFixed(3)} apart in L1, below this ` +
                `module's ${distinctnessFloor} floor. Every framework score is a convex combination of the same ${SPINE.length} ` +
                `scores, so two this close produce two scorecards a client cannot tell apart.`,
            )
        }
      return { examined: l1Pairs.length, l1Pairs, floor: distinctnessFloor }
    },
  }

  return { spineUniverse, crosswalkShape, crosswalkWeight, crosswalkOrphan, frameworkReach, crosswalkConcentration, crosswalkDistinctness }
}

/** Summary lines a rule file can splice into its own block. */
export function crosswalkSummary(results, { label, spineLabel, spineTotal, spineLabelPlural }) {
  // 'section' -> 'sections', but 'subcategory' -> 'subcategories', not 'subcategorys'.
  const plural = spineLabelPlural ?? (spineLabel.endsWith('y') ? `${spineLabel.slice(0, -1)}ies` : `${spineLabel}s`)
  const su = results['SPINE-UNIVERSE'] ?? {}
  const or = results['CROSSWALK-ORPHAN'] ?? {}
  const fr = results['FRAMEWORK-REACH'] ?? {}
  const cc = results['CROSSWALK-CONCENTRATION'] ?? {}
  const cd = results['CROSSWALK-DISTINCTNESS'] ?? {}
  const out = []
  out.push(
    `CROSSWALK ${(fr.reach ?? []).length} frameworks over ${spineTotal ?? su.examined ?? 0} ${plural}` +
      ` — ${su.mapped ?? 0} mapped, ${(or.unmapped ?? []).length} unmapped (${or.coverageMode ?? '?'})`,
  )
  // Per-framework reach prints only where a framework does NOT reach all of
  // itself. Four lines saying "100.0%" is four lines a reader learns to skip, and
  // the whole value of this class is that the one line saying 94.0% stands out.
  const partial = (fr.reach ?? []).filter((r) => r.homed < r.leaves)
  if (partial.length === 0 && (fr.reach ?? []).length)
    out.push(`  reach: every leaf of all ${fr.reach.length} frameworks is mapped`)
  for (const r of partial)
    out.push(
      `  ${r.code.padEnd(10)} REACHES ${(r.mass * 100).toFixed(1)}% OF ITSELF — ${r.homed}/${r.leaves} leaves mapped` +
        (r.gaps.length ? `, declared gaps: ${r.gaps.join(', ')}` : ''),
    )
  if ((or.unmapped ?? []).length) out.push(`  unmapped ${plural}: ${or.unmapped.join(', ')}`)
  if (cc.rows?.length)
    out.push(`  concentration (ceiling ${(cc.ceiling * 100).toFixed(0)}%): ` + cc.rows.map((r) => `${r.code} ${(r.share * 100).toFixed(1)}% on ${r.node}`).join('  '))
  if (cd.l1Pairs?.length)
    out.push(`  distinctness (L1, floor ${cd.floor}): ` + cd.l1Pairs.map((p) => `${p.a}/${p.b} ${p.l1.toFixed(3)}`).join('  '))
  return out
}
