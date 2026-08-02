/**
 * TAIW — Trade Analytics. Dataset rules.
 *
 * D3 created the empty rule file; D4 fills it. The rules are not invented: seven
 * of the nine are the checks a real defect asked for.
 *
 *   TCF-FK      D-007. Four ids in dataRequirements.json matched no capability
 *               and `wcoDomainsByCapability`'s inversion dropped them silently,
 *               costing four real capabilities their entire WCO DM cell. Eleven
 *               references, in a delivered register, invisible to every harness
 *               in the repo because a dataset that disagrees with itself produces
 *               perfectly reproducible output.
 *   TCF-SLUG    D-009 names this check by name as the one that would have caught
 *               D-007's four BEFORE they were authored.
 *   TCF-COVERAGE  the withdrawn half of D-007, deliberately NOT an equality
 *               assertion. See its note.
 *
 * `-REGISTER`, not `-GAP`: TACR's 640 questions carry no `capabilityLinks`, so
 * there is no per-capability gap to report. D-001, closed by removal.
 */
import { unique, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'
import { makeBenchmarkRollup, rollupSummary } from '../lib/benchmark-rollup.mjs'
import { makeCategoryUniverse, categoryUniverseSummary } from '../lib/category-universe.mjs'
import { makeCrosswalkChecks, crosswalkSummary } from '../lib/crosswalk.mjs'

/**
 * The TCF id derivation: lowercase the `sub`, expand `&` to `and`, and collapse
 * everything else to single underscores.
 *
 * Not a guess. It is the rule 99 of 100 capabilities obey, and D-007 established
 * `capabilities.json` as canonical on three independent grounds — the derivation,
 * the four-files-to-one spelling split, and the March backup showing both forms.
 */
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/**
 * The one id that breaks the slug rule, and why it is named here rather than
 * quietly tolerated.
 *
 * D-009: `aeo_compliance_monitoring_aeo` carries its domain suffix twice. It is
 * DEFINED in capabilities.json and referenced from four other files, so renaming
 * it means editing five files together and any one missed reintroduces exactly
 * the dangling reference D-007 removed. It is internally consistent — every file
 * spells it the same way — so it is ugly, not wrong.
 *
 * Declared as data, with its defect id, on the `mayBeEmpty` precedent: a rule
 * with an exception should require someone to write down WHICH and WHY, in
 * source. The rule stays live for the other 99 and for anything authored later,
 * which is the whole point given D-007's four came from breaking this same rule.
 *
 * An entry here that no longer violates the rule FAILS — otherwise a fixed defect
 * leaves a permanent hole in the check.
 */
const SLUG_EXCEPTIONS = Object.freeze({
  aeo_compliance_monitoring_aeo: 'D-009 — suffix applied twice; the id is defined in capabilities.json and referenced from four other files, so the rename is a five-file change with its own before/after',
})

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

// ── TACR-SHAPE ──────────────────────────────────────────────────────────────
const tacrShape = {
  code: 'TACR-SHAPE',
  run(ctx) {
    const { tacr } = ctx.data
    const { fail } = ctx
    const cats = tacr.categories ?? []
    if (cats.length === 0) fail('tacrQuestions.json declares no categories')

    let examined = 0
    for (const [ci, cat] of cats.entries()) {
      if (typeof cat.name !== 'string' || !cat.name.trim()) fail(`category[${ci}] has no name`)
      if (!Array.isArray(cat.sections) || cat.sections.length === 0)
        fail(`category "${cat.name}" has no sections — it would render as an empty axis on the radar and score as not-applicable`)
      for (const [si, sec] of (cat.sections ?? []).entries()) {
        if (typeof sec.name !== 'string' || !sec.name.trim()) fail(`category "${cat.name}" section[${si}] has no name`)
        if (!Array.isArray(sec.questions) || sec.questions.length === 0)
          fail(`category "${cat.name}" section "${sec.name}" has no questions`)
        for (const q of sec.questions ?? []) {
          examined++
          if (typeof q.id !== 'string' || !/^[a-z0-9]+_[a-z0-9_]+$/.test(q.id))
            fail(`question ${JSON.stringify(q.id)} does not match <prefix>_<rest> — TACR-CATEGORY-PREFIX reads the segment before the first underscore`)
          if (typeof q.text !== 'string' || q.text.trim().length < 10)
            fail(`question ${q.id} has no usable text`)
          const lv = Object.keys(q.levels ?? {}).sort().join(',')
          if (lv !== '1,2,3,4,5')
            fail(`question ${q.id} levels keys = [${lv}], expected 1..5 — the assessment renders one radio per level`)
          for (const [k, v] of Object.entries(q.levels ?? {}))
            if (typeof v !== 'string' || !v.trim()) fail(`question ${q.id} level ${k} has no description`)
        }
      }
    }
    // The header count is what the progress bar divides by. A stale one is a
    // percentage that never reaches 100.
    if (typeof tacr.totalQuestions !== 'number' || tacr.totalQuestions !== examined)
      fail(`totalQuestions is ${JSON.stringify(tacr.totalQuestions)} but the file holds ${examined} questions — the assessment's progress bar divides by the declared number`)
    return { examined, categories: cats.length }
  },
}

// ── TACR-UNIQUE ─────────────────────────────────────────────────────────────
const tacrUnique = {
  code: 'TACR-UNIQUE',
  run(ctx) {
    const cats = ctx.data.tacr.categories ?? []
    const f = ctx.failAs
    let examined = 0
    examined += unique(f, 'TACR-UNIQUE', 'TACR category', cats.map((c) => c.name))
    for (const cat of cats) examined += unique(f, 'TACR-UNIQUE', `section in "${cat.name}"`, (cat.sections ?? []).map((s) => s.name))
    // Answers are stored in one flat map keyed by question id, so a duplicate id
    // is two questions sharing one answer — silently, in both directions.
    examined += unique(f, 'TACR-UNIQUE', 'TACR question', cats.flatMap((c) => (c.sections ?? []).flatMap((s) => (s.questions ?? []).map((q) => q.id))))
    return { examined }
  },
}

// ── TACR-CATEGORY-PREFIX ────────────────────────────────────────────────────
/**
 * Every question id's prefix maps to exactly one category, and every category to
 * exactly one prefix.
 *
 * This is a real relation that nothing declared and one component guessed. The
 * navigator's removed maturity badge split ids on `-` (TACR ids contain none) and
 * matched prefixes against invented names like 'strategy' and 'infrastructure'.
 * The actual mapping is not guessable — "Information & Integration" is `inf` and
 * "Infrastructure" is `is`, which is the opposite of what a reader would assume.
 */
const tacrCategoryPrefix = {
  code: 'TACR-CATEGORY-PREFIX',
  run(ctx) {
    const cats = ctx.data.tacr.categories ?? []
    const { fail } = ctx
    const prefixToCat = new Map()
    let examined = 0
    for (const cat of cats) {
      const prefixes = new Set()
      for (const s of cat.sections ?? [])
        for (const q of s.questions ?? []) {
          examined++
          prefixes.add(String(q.id).split('_')[0])
        }
      if (prefixes.size === 0) continue
      if (prefixes.size > 1)
        fail(`category "${cat.name}" mixes ${prefixes.size} id prefixes (${[...prefixes].sort().join(', ')}) — a category cannot be recovered from a question id`)
      for (const p of prefixes) {
        const owner = prefixToCat.get(p)
        if (owner && owner !== cat.name)
          fail(`id prefix "${p}" is used by both "${owner}" and "${cat.name}" — the same prefix cannot select two categories`)
        prefixToCat.set(p, cat.name)
      }
    }
    return { examined, prefixes: [...prefixToCat.entries()].sort() }
  },
}

// ── TCF-SHAPE ───────────────────────────────────────────────────────────────
const tcfShape = {
  code: 'TCF-SHAPE',
  run(ctx) {
    const caps = ctx.data.caps ?? []
    const f = ctx.failAs
    shapeCheck(f, 'TCF-SHAPE', 'capability', caps, {
      id: idLike(/^[a-z0-9][a-z0-9_]*$/),
      theme: str(),
      group: str(),
      sub: str(),
      dataReqCount: (v) => num(v) ?? (Number.isInteger(v) && v >= 0 ? null : `must be a non-negative integer, got ${v}`),
      themeColor: str(),
      themeIndex: (v) => num(v) ?? (Number.isInteger(v) && v >= 0 ? null : `must be a non-negative integer, got ${v}`),
      groupIndex: (v) => num(v) ?? (Number.isInteger(v) && v >= 0 ? null : `must be a non-negative integer, got ${v}`),
      priority: oneOf(PRIORITIES),
    }, ['id', 'theme', 'group', 'sub', 'dataReqCount', 'themeColor', 'themeIndex', 'groupIndex', 'priority'])
    unique(f, 'TCF-SHAPE', 'TCF capability', caps.map((c) => c.id))

    /*
     * CONTIGUITY, not sort order.
     *
     * The first version of this asserted capabilities were id-sorted within a
     * group. They are not, they never claimed to be, and the check failed on live
     * data the moment it ran — an ordering invented for the check rather than read
     * off the data. That is the D-007 withdrawn-half mistake in miniature.
     *
     * What `groupCoverage()` actually relies on is stated in its own comment:
     * "Dataset order keeps each theme's groups contiguous; alphabetical would
     * interleave the six themes." So contiguity is the property, and a theme
     * resuming after another theme's block is what breaks page 13's rollup.
     */
    const contiguity = (label, key) => {
      const seen = new Set()
      let last = null
      for (const c of caps) {
        const v = key(c)
        if (v === last) continue
        if (seen.has(v))
          ctx.fail(`${label} "${v}" resumes after another ${label}'s block — page 13 rolls capabilities up by walking this file in order, and a split block is counted as two`)
        seen.add(v)
        last = v
      }
    }
    contiguity('theme', (c) => c.theme)
    contiguity('group', (c) => c.group)
    return { examined: caps.length }
  },
}

// ── TCF-SLUG ────────────────────────────────────────────────────────────────
const tcfSlug = {
  code: 'TCF-SLUG',
  run(ctx) {
    const caps = ctx.data.caps ?? []
    const { fail } = ctx
    const seen = new Set()
    for (const c of caps) {
      const want = slug(c.sub ?? '')
      if (c.id === want) continue
      const why = SLUG_EXCEPTIONS[c.id]
      if (why) { seen.add(c.id); continue }
      fail(`capability id ${JSON.stringify(c.id)} is not slug(sub) — "${c.sub}" derives ${JSON.stringify(want)}. TCF ids are slug(sub) with & expanded to _and_; the four references D-007 fixed all broke this same rule by dropping the & instead. If this is deliberate, add it to SLUG_EXCEPTIONS with its defect id`)
    }
    // A stale exception is a hole in the rule that nothing would ever close.
    for (const id of Object.keys(SLUG_EXCEPTIONS))
      if (!seen.has(id))
        fail(`SLUG_EXCEPTIONS names ${JSON.stringify(id)}, which is not a capability that violates the slug rule — remove the exception, the defect it records is fixed or the id is gone`)
    return { examined: caps.length, exceptions: [...seen].sort() }
  },
}

// ── TCF-THEME-CONSISTENT ────────────────────────────────────────────────────
const tcfThemeConsistent = {
  code: 'TCF-THEME-CONSISTENT',
  run(ctx) {
    const caps = ctx.data.caps ?? []
    const { fail } = ctx
    const idx = new Map()
    const col = new Map()
    const grpIdx = new Map()
    const grpTheme = new Map()
    for (const c of caps) {
      if (idx.has(c.theme) && idx.get(c.theme) !== c.themeIndex)
        fail(`theme "${c.theme}" carries themeIndex ${idx.get(c.theme)} and ${c.themeIndex} — the navigator orders themes by it, so two values split one theme in the sidebar`)
      idx.set(c.theme, c.themeIndex)
      if (col.has(c.theme) && col.get(c.theme) !== c.themeColor)
        fail(`theme "${c.theme}" carries themeColor "${col.get(c.theme)}" and "${c.themeColor}" — one theme, two colours on the same page`)
      col.set(c.theme, c.themeColor)
      if (grpIdx.has(c.group) && grpIdx.get(c.group) !== c.groupIndex)
        fail(`group "${c.group}" carries groupIndex ${grpIdx.get(c.group)} and ${c.groupIndex}`)
      grpIdx.set(c.group, c.groupIndex)
      if (grpTheme.has(c.group) && grpTheme.get(c.group) !== c.theme)
        fail(`group "${c.group}" appears under themes "${grpTheme.get(c.group)}" and "${c.theme}" — page 13 rolls capabilities up by group and would count it twice`)
      grpTheme.set(c.group, c.theme)
    }
    return { examined: caps.length, themes: idx.size, groups: grpIdx.size }
  },
}

// ── TCF-FK ──────────────────────────────────────────────────────────────────
/**
 * Every capability id referenced anywhere resolves. THE D-007 GUARD.
 *
 * Fields are named rather than string-walked. A walk that treats any
 * underscore-shaped string as a capability id would miss a reference in a field
 * it did not expect and, worse, would go quiet the day one of these files gains a
 * field of free text.
 */
const tcfFk = {
  code: 'TCF-FK',
  run(ctx) {
    const { caps, dataReq, deps, enrichment, mappings } = ctx.data
    const { fail } = ctx
    const ids = new Set((caps ?? []).map((c) => c.id))
    let examined = 0
    const check = (where, id) => {
      examined++
      if (!ids.has(id))
        fail(`${where} references capability ${JSON.stringify(id)}, which is not in capabilities.json — a dangling id costs a real capability its whole cell and nothing renders an error`)
    }
    for (const req of dataReq ?? [])
      for (const id of req.capabilities ?? []) check(`dataRequirements ${req.id}`, id)
    for (const id of Object.keys(deps ?? {})) check('dependencies', id)
    for (const id of Object.keys(enrichment?.capabilities ?? {})) check('enrichment.capabilities', id)
    for (const [i, m] of (mappings ?? []).entries())
      if (m?.capability) check(`mappings[${i}]`, m.capability)
    return { examined }
  },
}

// ── TCF-COVERAGE ────────────────────────────────────────────────────────────
/**
 * WCO DM coverage, REPORTED, and the one comparison this must never make.
 *
 * `dataReqCount` agrees with the observed requirement count for 2 of 100
 * capabilities, and that is CORRECT: the two fields were never counting the same
 * thing. They come from different source CSVs — `bvf_capability_summary.csv` and
 * `bvf_data_requirements.csv`. D-007 was filed asserting they should match, and
 * the "safe default" fix offered at the time — recompute `dataReqCount` — would
 * have put 97 capabilities at zero and broken two live roadmap views.
 *
 * So both numbers are printed and neither is asserted against the other. What
 * fails is total collapse: zero capabilities with any requirement means the
 * relation is gone, which is a different fact from a low count.
 */
const tcfCoverage = {
  code: 'TCF-COVERAGE',
  run(ctx) {
    const { caps, dataReq } = ctx.data
    const { fail } = ctx
    const linked = new Set()
    for (const req of dataReq ?? []) for (const id of req.capabilities ?? []) linked.add(id)
    const covered = (caps ?? []).filter((c) => linked.has(c.id)).length
    if ((caps ?? []).length > 0 && covered === 0)
      fail(`no capability has a single data requirement — the WCO DM relation has gone entirely, and page 13 would report 0 of ${caps.length} coverage with no error anywhere`)
    const agreeing = (caps ?? []).filter((c) => {
      let n = 0
      for (const req of dataReq ?? []) if ((req.capabilities ?? []).includes(c.id)) n++
      return n === c.dataReqCount
    }).length
    return { examined: (caps ?? []).length, covered, agreeing, requirements: (dataReq ?? []).length }
  },
}

// ── TAIW-BENCHMARK-KEYS ─────────────────────────────────────────────────────
/**
 * Every TACR category has a benchmark in all three blocks.
 *
 * The PDF falls back to a hardcoded 1.56 / 3.4 / 4.3 for a missing key, so a
 * renamed category silently benchmarks the client against a constant. Extras are
 * reported rather than failed: 'Overall Assessment' is a rollup key with no
 * questions behind it, read by the benchmark page's summary line.
 */
const benchmarkKeys = {
  code: 'TAIW-BENCHMARK-KEYS',
  run(ctx) {
    const { tacr, benchmarks } = ctx.data
    const { fail } = ctx
    const cats = (tacr.categories ?? []).map((c) => c.name)
    const blocks = ['pakistanCustomsAverage', 'regionalLeaders', 'wcoTargets']
    const extras = new Set()
    let examined = 0
    for (const b of blocks) {
      const block = benchmarks?.[b]
      if (!block || typeof block !== 'object') { fail(`benchmarks.json has no ${b} block`); continue }
      const numeric = Object.keys(block).filter((k) => typeof block[k] === 'number')
      for (const cat of cats) {
        examined++
        if (!numeric.includes(cat))
          fail(`benchmarks.${b} has no numeric entry for TACR category "${cat}" — the report falls back to a hardcoded constant, so the client is benchmarked against a number that is not about them`)
      }
      for (const k of numeric) if (!cats.includes(k)) extras.add(`${b}.${k}`)
    }
    return { examined, extras: [...extras].sort() }
  },
}

/**
 * TAIW's rollup exceptions. EMPTY, and unlike BAIW's this file never needed one:
 * all three of TAIW's rollups already reconcile to 2dp (1.5625->1.56,
 * 3.425->3.43, 4.3125->4.31).
 *
 * D-010's investigation established why the two files differ. TAIW's was authored
 * independently of the v3 build prompt and after its components settled — the
 * prompt's `regionalLeaders` is not what shipped, and it has neither a
 * `wcoTargets` block nor a rollup — so whoever wrote it computed all three. BAIW's
 * was transcribed from that prompt with the rollup carried along unchecked.
 *
 * The rule is here anyway. "It happens to be right today" is what was true of
 * BAIW's `pakistanBankingAverage`, one key away from the two that were not.
 */
const ROLLUP_EXCEPTIONS = Object.freeze({})

const tacrCategories = (ctx) => (ctx.data.tacr?.categories ?? []).map((c) => c.name).filter((n) => typeof n === 'string')

/*
 * TAIW's rendered list lives in the generator rather than in a data module — its
 * screen derives categories from the dataset directly, so the generator's copy is
 * the only declared one. Same rule, different home.
 */
const categoryUniverse = makeCategoryUniverse({
  label: 'TACR',
  declaredIn: { rel: 'src/taiw/utils/tradeReportGenerator.ts', constName: 'CATEGORIES' },
  categories: tacrCategories,
})

const benchmarkRollup = makeBenchmarkRollup({
  dataKey: 'benchmarks',
  fileLabel: 'benchmarks.json',
  // THE JOIN — the authored category list, not the benchmark file's own keys,
  // which include the phantom `Overall Assessment`.
  categories: tacrCategories,
  exceptions: ROLLUP_EXCEPTIONS,
})


// ══════════════════════════════════════════════════════════════════════════
// D5 STAGE C — THE FRAMEWORK CROSSWALK
// ══════════════════════════════════════════════════════════════════════════
/**
 * TAIW projects DMBOK2, DCAM and COBIT 2019 onto its 35 TACR SECTIONS.
 *
 * NOT the 8 categories: at that granularity all three frameworks put 31-50% of
 * their weight on the single 'Data Governance' category, and every pairwise L1
 * still cleared 0.15 — so distinctness passed and told nobody. CROSSWALK-
 * CONCENTRATION exists because of that measurement.
 *
 * NOT DGI: it reaches 59% of itself here, losing Decision Rights,
 * Accountabilities, the Data Governance Office and Data Stewards. It is absent
 * from `CROSSWALK_FRAMEWORKS` rather than present-and-broken, and this comment is
 * the record of why.
 *
 * NOT the 100 TCF capabilities: TACR carries no `capabilityLinks` at all — the
 * union of every key on all 640 questions is `id, levels, text` — so a capability
 * spine would have to be invented, which is D-001.
 */
const CROSSWALK_FRAMEWORKS = ['FW-01', 'FW-02', 'FW-04']

/** `<category>_<section>` — measured 1:1 with all 35 sections, zero ambiguous. */
const sectionIdOf = (questionId) => String(questionId).split('_').slice(0, 2).join('_')

/** The 35 sections, in dataset order, as spine nodes. */
const tacrSpine = (ctx) => {
  const out = []
  for (const c of (ctx.data.tacr?.categories ?? []))
    for (const sec of (c.sections ?? [])) {
      const first = sec.questions?.[0]
      if (!first) continue
      out.push({ id: sectionIdOf(first.id), name: `${c.name} / ${sec.name}` })
    }
  return out
}

/**
 * Section-grouped applicables for an answer map, through the REAL primitive.
 *
 * `scoreCategories` from `src/scoring/maturity.ts` — the same function the
 * assessment screen and the report call. The engine is handed the outcomes; it
 * never derives one. That is the D-003 rule as a function signature, and it is
 * the whole reason the projection engine takes `outcomes` as a parameter.
 *
 * STAND-IN, AND SAID SO. Production has no `src/taiw/projection.ts` yet — this
 * stage is datasets and checks only. When the UI lands and that binding is
 * written, THIS COMPOSITION MOVES INTO IT and the rule file loads it the way
 * dgiw.mjs loads DGIW's. Two copies of it would be exactly the drift this file
 * spends nine other checks preventing.
 */
const tacrOutcomes = (ctx, answers) => {
  const { maturity } = ctx.ts ?? {}
  if (!maturity) return null
  const groups = []
  for (const c of (ctx.data.tacr?.categories ?? []))
    for (const sec of (c.sections ?? [])) {
      const qs = sec.questions ?? []
      if (qs.length === 0) continue
      groups.push({
        name: sectionIdOf(qs[0].id),
        entries: qs.map((q) => ({ weight: 1, answer: answers[q.id] })),
      })
    }
  return maturity.scoreCategories(groups).map((o) => ({
    spineId: o.name,
    state: o.agg.state,
    score: o.agg.state === 'scored' ? o.agg.currentRaw : null,
  }))
}

/** An engine bound to this module's data, or null when the TS load failed. */
const tacrEngine = (ctx) => {
  const { frameworks: fwmod, maturity } = ctx.ts ?? {}
  if (!fwmod || !maturity) return null
  const fw = ctx.shared('_spine').fw ?? {}
  return fwmod.createProjectionEngine({
    frameworks: (fw.frameworks ?? []).filter((f) => CROSSWALK_FRAMEWORKS.includes(f.id)),
    dimensions: (fw.dimensions ?? []).filter((d) => CROSSWALK_FRAMEWORKS.includes(d.frameworkId)),
    mappings: ctx.data.xw?.entries ?? [],
    spine: tacrSpine(ctx),
    outcomes: (answers) => tacrOutcomes(ctx, answers) ?? [],
  })
}

/**
 * FRAMEWORK-REACH exceptions: a framework leaf TACR cannot evidence.
 *
 * Keyed by dimension code, valued with the evidence gap. A stale entry fails.
 */
const REACH_EXCEPTIONS = Object.freeze({
  DM07:
    'Document & Content Management. 0 of 640 TACR questions mention document management or content management. ' +
    'Customs runs on declarations, manifests and certificates, so this is a real gap in the ASSESSMENT rather than ' +
    'an absence in the domain — and forcing it onto Clearance Automation would be a mapping nobody could defend.',
})

/**
 * CROSSWALK-CONCENTRATION exceptions. EMPTY, and that is the measured state:
 * the three frameworks peak at 15.5%, 15.0% and 17.2% of induced weight on one
 * section, against a 35% ceiling. Section granularity is what bought that.
 */
const CONCENTRATION_EXCEPTIONS = Object.freeze({})

const crosswalk = makeCrosswalkChecks({
  label: 'TAIW',
  frameworkIds: CROSSWALK_FRAMEWORKS,
  entryIdPattern: /^CW-T-\d{3}$/,
  spineIdPattern: /^[a-z]+_[a-z]+$/,
  spineLabel: 'section',
  spine: tacrSpine,
  entries: (ctx) => ctx.data.xw?.entries ?? [],
  frameworkData: (ctx) => ctx.shared('_spine').fw ?? {},
  // TACR carries no layer on any of its 640 questions — verified against the
  // dataset, not assumed. Declaring [] is what makes CROSSWALK-WEIGHT report that
  // its retained-zero assertion did not run, rather than passing over nothing.
  layers: [],
  layerValues: null,
  // Measured 0.883 - 1.035 at 35 sections. 0.15 was calibrated for 11 pillars and
  // here would be a floor nothing could fall through, which is decoration.
  distinctnessFloor: 0.5,
  concentrationCeiling: 0.35,
  concentrationExceptions: CONCENTRATION_EXCEPTIONS,
  reachExceptions: REACH_EXCEPTIONS,
  spineCoverage: {
    mode: 'report',
    reason:
      'TACR describes a customs administration, not a data-management capability model. Seven of its 35 sections are ' +
      'reached by no data-management framework — WTO TFA Commitment, Training, Risk Models, Automation, Clearance ' +
      'Automation, Revenue Automation and Compliance Rates — and every one of them is customs operations. Asserting ' +
      "coverage here would force mappings nobody could defend. DGIW asserts it, because its eleven pillars ARE the " +
      'capability model and a pillar nothing maps really is evidence counting toward nothing.',
  },
  induced: (ctx, frameworkId) => tacrEngine(ctx)?.inducedSpineWeights(frameworkId) ?? null,
})

// ── PROJECTION-INVARIANT, TAIW ────────────────────────────────────────────
/**
 * The same four properties DGIW asserts, over TAIW's spine.
 *
 * I4's SECOND PROFILE IS DIFFERENT AND HAD TO BE. DGIW runs the flat profile
 * twice, once under `core`, because at layer 'all' every weight set already sums
 * to 1 and a flat profile returns 3.0 under a wide class of weight bugs — only a
 * layer that makes dimensions retain less than 1 exercises the renormalisation.
 * TACR has no layers, so that profile degenerates. The substitute is WHOLE
 * SECTIONS UNANSWERED: unscored sections drop out, the remaining weights
 * renormalise, `scoredShare < retainedShare`, and a missing renormalisation shows
 * up exactly where the layer profile used to catch it.
 */
const projectionInvariant = {
  code: 'PROJECTION-INVARIANT',
  run(ctx) {
    const { fail } = ctx
    const engine = tacrEngine(ctx)
    if (!engine) {
      fail(`could not build or load the projection engine or src/scoring/maturity.ts — the invariants were NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const spine = tacrSpine(ctx)
    const allQ = []
    for (const c of (ctx.data.tacr?.categories ?? []))
      for (const sec of (c.sections ?? [])) for (const q of (sec.questions ?? [])) allQ.push(q.id)
    allQ.sort()

    const constant = (v) => Object.fromEntries(allQ.map((id) => [id, { currentState: v, desiredState: 5 }]))
    // Deterministic, nobody-chose-it-by-hand, identical on every machine.
    const seeded = () => {
      let s = 12345
      const out = {}
      for (const id of allQ) { s = (s * 1103515245 + 12345) % 2147483648; out[id] = { currentState: 1 + (s % 5), desiredState: 5 } }
      return out
    }
    const SEEDED = seeded()
    const withoutSections = (base, skip) =>
      Object.fromEntries(Object.entries(base).filter(([id]) => !skip.includes(sectionIdOf(id))))

    const PROFILES = [
      { name: 'flat 3.0', answers: constant(3), flat: true },
      { name: 'all 1', answers: constant(1) },
      { name: 'all 5', answers: constant(5) },
      { name: 'seeded', answers: SEEDED },
      // The substitute for DGIW's `flat 3.0, core only`. Three sections carrying
      // real crosswalk weight, so retained stays 1 while scored falls below it.
      { name: 'flat 3.0, dg_dql/inf_dwh/is_drb unanswered', answers: withoutSections(constant(3), ['dg_dql', 'inf_dwh', 'is_drb']), flat: true },
      { name: 'seeded, dg_dql/inf_dwh/is_drb unanswered', answers: withoutSections(SEEDED, ['dg_dql', 'inf_dwh', 'is_drb']) },
    ]

    let invariantsRun = 0
    let renormalisationExercised = 0
    for (const profile of PROFILES) {
      const { answers } = profile
      const projections = engine.projectAll(answers)
      // Independently computed, not read back out of the projection. This is what
      // makes I1 and I3 mean anything.
      const independent = new Map((tacrOutcomes(ctx, answers) ?? []).map((o) => [o.spineId, o]))

      for (const proj of projections) {
        const at = `${profile.name} / ${proj.code}`

        // I1 — DECOMPOSITION
        for (const dim of proj.dimensions) {
          if (!dim.isLeaf && dim.contributions.length > 0)
            fail(`I1 ${at}: parent ${dim.code} carries ${dim.contributions.length} section contributions — projection is leaf-only`)
          if (dim.state !== 'scored') {
            if (dim.score !== null) fail(`I1 ${at}: ${dim.code} is ${dim.state} but carries score ${dim.score} — an unmeasured dimension must be null, never a number`)
            continue
          }
          if (!dim.isLeaf) continue
          const total = dim.contributions.reduce((s, c) => s + c.contribution, 0)
          if (Math.abs(total - dim.score) > EPS_T) fail(`I1 ${at}: ${dim.code} contributions sum to ${total} but score is ${dim.score}`)
          const wsum = dim.contributions.reduce((s, c) => s + c.weight, 0)
          if (Math.abs(wsum - 1) > EPS_T) fail(`I1 ${at}: ${dim.code} renormalised weights sum to ${wsum}, not 1`)
          for (const c of dim.contributions) {
            const truth = independent.get(c.spineId)
            if (!truth || truth.state !== 'scored') fail(`I1 ${at}: ${dim.code} contributes section ${c.spineId}, which maturity.ts reports as ${truth?.state ?? 'absent'}`)
            else if (Math.abs(truth.score - c.spineScore) > EPS_T) fail(`I1 ${at}: ${dim.code} used ${c.spineScore} for ${c.spineId} but maturity.ts computes ${truth.score} — a second scoring path or a cached value`)
          }
          if (dim.scoredShare > dim.retainedShare + EPS_T) fail(`I1 ${at}: ${dim.code} scoredShare ${dim.scoredShare} exceeds retainedShare ${dim.retainedShare}`)
          if (dim.scoredShare < dim.retainedShare - EPS_T) renormalisationExercised++
        }

        // I2 — RECONCILIATION
        if (proj.state === 'scored') {
          const wsum = Object.values(proj.effectiveWeights).reduce((s, w) => s + w, 0)
          if (Math.abs(wsum - 1) > EPS_T) fail(`I2 ${at}: induced section weights sum to ${wsum}, not 1 — the overall is not a weighted mean of anything`)
          let recon = 0
          for (const [spineId, w] of Object.entries(proj.effectiveWeights)) {
            if (w === 0) continue
            const truth = independent.get(spineId)
            if (!truth || truth.state !== 'scored') { fail(`I2 ${at}: section ${spineId} carries weight ${w} but is ${truth?.state ?? 'absent'}`); continue }
            recon += w * truth.score
          }
          if (Math.abs(recon - proj.overall) > EPS_T) fail(`I2 ${at}: overall is ${proj.overall} but Σ W·score is ${recon} — the roll-up and the crosswalk disagree`)
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
      for (const [spineId, byFramework] of seenBy) {
        if (byFramework.size !== projections.length) continue
        const values = [...byFramework.values()].flat()
        const spread = Math.max(...values) - Math.min(...values)
        if (spread > EPS_T) fail(`I3 ${profile.name}: section ${spineId} is used with ${values.length} different values across the frameworks, spread ${spread}`)
      }

      // I4 — FLAT PROFILE
      if (profile.flat) {
        const overalls = projections.map((p) => p.overall)
        for (const [i, o] of overalls.entries())
          if (o === null || Math.abs(o - 3) > EPS_T)
            fail(`I4 ${profile.name}: ${projections[i].code} overall is ${o}, not 3.0 — with every scored section at exactly 3.0 any convex combination is 3.0, so a deviation is a maths error and almost always an unnormalised weight basis`)
        const spread = Math.max(...overalls) - Math.min(...overalls)
        if (spread > EPS_T) fail(`I4 ${profile.name}: the overalls spread by ${spread}, which must be 0 when every section scores identically`)
      }
    }

    // The substitute profile has to actually exercise what the layer profile did.
    // A profile that renormalises nothing is a profile that proves nothing.
    if (renormalisationExercised === 0)
      fail(
        `no profile produced scoredShare < retainedShare, so the renormalisation path was never exercised. DGIW gets this ` +
          `from its core-layer profile; TACR has no layers and relies on whole sections being unanswered instead. If the ` +
          `unanswered sections stopped carrying crosswalk weight, this check quietly became weaker than DGIW's.`,
      )

    return { examined: invariantsRun, profiles: PROFILES.length, renormalisationExercised }
  },
}
const EPS_T = 1e-9

export default {
  id: 'taiw',
  title: 'TAIW — Trade Analytics',
  dataDir: 'src/data/taiw',
  datasets: {
    tacr: 'tacrQuestions.json',
    caps: 'capabilities.json',
    dataReq: 'dataRequirements.json',
    deps: 'dependencies.json',
    enrichment: 'enrichment.json',
    mappings: 'mappings.json',
    benchmarks: 'benchmarks.json',
    xw: 'crosswalk.json',
  },

  /**
   * The shared engine and the shared category-scoring primitive, compiled and
   * imported so the checks run the REAL code rather than a copy. `maturity.ts` is
   * a separate entry point on purpose: I1 compares the section scores the
   * projection USED against section scores computed from maturity.ts directly, and
   * sharing one bundle would make that comparison circular.
   */
  tsModules: { frameworks: 'src/frameworks/projection.ts', maturity: 'src/scoring/maturity.ts' },
  reportSources: [{ rel: 'src/taiw/utils/tradeReportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-TAIW-MATURITY', 'MR-TAIW-REGISTER', 'MR-TAIW-ROADMAP'],

  /** Declared run order — this is the order findings print in. */
  checks: [
    categoryUniverse,
    tacrShape,
    tacrUnique,
    tacrCategoryPrefix,
    tcfShape,
    tcfSlug,
    tcfThemeConsistent,
    tcfFk,
    tcfCoverage,
    benchmarkKeys,
    // The crosswalk seven, in dependency order: the spine must resolve before a
    // mapping into it means anything, and the two vector classes need the engine.
    crosswalk.spineUniverse,
    crosswalk.crosswalkShape,
    crosswalk.crosswalkWeight,
    crosswalk.crosswalkOrphan,
    crosswalk.frameworkReach,
    crosswalk.crosswalkConcentration,
    crosswalk.crosswalkDistinctness,
    projectionInvariant,
    // After TAIW-BENCHMARK-KEYS, which asserts the same companion condition for
    // TACR and additionally reports non-category numeric keys. Both fire on a
    // missing category; that duplication is stated rather than removed, per
    // CLAUDE.md rule 9. See the note in check/lib/benchmark-rollup.mjs.
    benchmarkRollup,
  ],

  summary(ctx) {
    const r = ctx.results
    const out = []
    const shape = r['TACR-SHAPE'] ?? {}
    out.push(`TACR ${shape.examined ?? 0} questions across ${shape.categories ?? 0} categories`)
    const pref = r['TACR-CATEGORY-PREFIX']?.prefixes ?? []
    if (pref.length) out.push(`  id prefixes: ${pref.map(([p, c]) => `${p}=${c}`).join('  ')}`)
    const tc = r['TCF-THEME-CONSISTENT'] ?? {}
    const cov = r['TCF-COVERAGE'] ?? {}
    out.push(
      `TCF ${tc.examined ?? 0} capabilities in ${tc.groups ?? 0} groups across ${tc.themes ?? 0} themes` +
        `  ${cov.covered ?? 0} with >=1 of ${cov.requirements ?? 0} data requirements`,
    )
    // Printed, never asserted. See tcfCoverage's note: these two fields count
    // different things, and the "obvious" fix for the disagreement was destructive.
    out.push(`  dataReqCount matches the observed requirement count for ${cov.agreeing ?? 0} of ${cov.examined ?? 0} — expected, they count different things (D-007, withdrawn half)`)
    const slugRes = r['TCF-SLUG'] ?? {}
    out.push(
      `  TCF-SLUG ${slugRes.examined ?? 0} ids checked against slug(sub)` +
        (slugRes.exceptions?.length
          ? ` — ${slugRes.exceptions.length} declared exception${slugRes.exceptions.length === 1 ? '' : 's'}: ${slugRes.exceptions.join(', ')} (see SLUG_EXCEPTIONS)`
          : ' — no exceptions'),
    )
    const extras = r['TAIW-BENCHMARK-KEYS']?.extras ?? []
    if (extras.length) out.push(`  benchmark keys with no TACR category: ${extras.join(', ')}`)
    out.push(`  ${rollupSummary(r['BENCHMARK-ROLLUP'], 'TACR benchmarks')}`)
    out.push(`  ${categoryUniverseSummary(r['CATEGORY-UNIVERSE'], 'TACR', '    ')}`)
    for (const l of crosswalkSummary(r, { label: 'TAIW', spineLabel: 'section', spineTotal: (r['SPINE-UNIVERSE'] ?? {}).examined })) out.push(`  ${l}`)
    const pi = r['PROJECTION-INVARIANT'] ?? {}
    out.push(`  PROJECTION-INVARIANT ${pi.examined ?? 0} framework projections over ${pi.profiles ?? 0} deterministic profiles (I1 decomposition, I2 reconciliation, I3 intersection, I4 flat) — renormalisation exercised ${pi.renormalisationExercised ?? 0} times`)
    return out
  },
}
