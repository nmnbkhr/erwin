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
  },
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
    return out
  },
}
