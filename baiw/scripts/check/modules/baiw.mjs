/**
 * BAIW — Banking Analytics.
 *
 * Declares its report source, its three artefact ids, and — as of D-010 — its
 * first dataset rule. It printed `baiw 0` on the REGISTRY line for two phases,
 * which was legal and stated, and is no longer true.
 *
 * BENCHMARK-ROLLUP is here because BAIW is where the defect was. `benchmarks.json`
 * carried `regionalLeaders["Overall Assessment"] = 3.18` beside eight components
 * averaging 3.3, and `globalBest = 4.13` beside eight averaging 4.25 — both off by
 * exactly -0.12, both typed once into a build prompt and never checked against the
 * numbers three lines above them. The first is read by page 16 and understated a
 * bank's distance from its peers. See docs/known-defects.md D-010 and the long
 * note in check/lib/benchmark-rollup.mjs.
 *
 * The category set comes from `bacrQuestions.json`, never from the benchmark
 * file's own keys. Those keys include `Overall Assessment` — the same phantom
 * category both golden fixtures carried — and a rule that averaged "every other
 * numeric key" would have folded the rollup into its own mean.
 *
 * STILL NOT COVERED, and named so it stays a stated absence rather than one you
 * would have to notice: BAIW's capability relations, where `capabilitiesUsing`
 * disagrees with `capabilities.length` and four requirement ids dangle.
 * `docs/known-defects.md` describes them.
 *
 * `-REGISTER`, not `-GAP`. BAIW's third deliverable was `MR-BAIW-GAP` until D-001
 * was resolved by REMOVAL: BACR categories and BVF capabilities are orthogonal
 * axes with no join in any dataset, so there is no per-capability gap to report
 * and the id says so rather than leaving a filename that promises one.
 */
import { makeBenchmarkRollup, rollupSummary } from '../lib/benchmark-rollup.mjs'
import { makeCategoryUniverse, categoryUniverseSummary } from '../lib/category-universe.mjs'

const bacrCategories = (ctx) => (ctx.data.bacr ?? []).map((q) => q.category).filter((c) => typeof c === 'string')

/**
 * Rollups taken from an outside source rather than from the components beside
 * them. Block name -> a reason NAMING the source.
 *
 * EMPTY, and that is D-010's finding rather than an oversight. Neither mismatched
 * value carried a URL, a methodology note or a citation anywhere in the repo; the
 * archive holds the build prompt that typed them, next to the same eight
 * components the file has today. They were wrong, not sourced.
 *
 * A stale entry here — one whose block now reconciles — FAILS. So does one naming
 * a block the file does not carry. Either way a corrected number cannot leave a
 * permanent hole behind it.
 */
const ROLLUP_EXCEPTIONS = Object.freeze({})

const benchmarkRollup = makeBenchmarkRollup({
  dataKey: 'benchmarks',
  fileLabel: 'benchmarks.json',
  // THE JOIN. bacrQuestions.json is a flat array of 804 questions carrying a
  // `category` string; its eight distinct values are the only real categories
  // BAIW has. `Overall Assessment` is not among them, which is precisely why it
  // must not enter a mean.
  categories: bacrCategories,
  exceptions: ROLLUP_EXCEPTIONS,
})

const categoryUniverse = makeCategoryUniverse({
  label: 'BACR',
  declaredIn: { rel: 'src/data/bacrCategories.ts', constName: 'BACR_CATEGORIES' },
  categories: bacrCategories,
})

/**
 * BACR-CATEGORY-PREFIX — the id segment before the first underscore names the
 * category, one-to-one.
 *
 * TAIW's `TACR-CATEGORY-PREFIX` is the same rule. This one exists because D-012
 * made `MaturityRadarCard` depend on it: the card must attribute an answer to a
 * category and must not import the 188 kB question bank to do it, so it reads the
 * id prefix. That turns a property of the data into a load-bearing assumption,
 * and an assumption the gate does not check is how the card scored by position
 * for two phases in the first place.
 *
 * The table is mirrored from `src/data/bacrCategories.ts` and asserted against the
 * dataset, so a drift between the two surfaces here rather than on the dashboard.
 */
const ID_PREFIX_TO_CATEGORY = Object.freeze({
  business: 'Business',
  culture: 'Culture',
  governance: 'Governance',
  information: 'Information',
  applications: 'Applications',
  systems: 'Systems',
  agility: 'Agility',
  outcomes: 'Outcomes',
})

const categoryPrefix = {
  code: 'BACR-CATEGORY-PREFIX',
  run(ctx) {
    const qs = ctx.data.bacr ?? []
    const { fail } = ctx
    const observed = new Map()
    let examined = 0
    for (const q of qs) {
      if (typeof q.id !== 'string' || !/^[a-z0-9]+_/.test(q.id)) {
        fail(`question ${JSON.stringify(q.id)} does not match <prefix>_<rest> — the prefix is what attributes it to a category`)
        continue
      }
      examined++
      const p = q.id.split('_')[0]
      if (!observed.has(p)) observed.set(p, new Set())
      observed.get(p).add(q.category)
    }
    for (const [p, cats] of [...observed].sort()) {
      if (cats.size > 1)
        fail(`id prefix "${p}" serves ${cats.size} categories (${[...cats].sort().join(', ')}) — attribution by prefix would be a guess`)
      const expected = ID_PREFIX_TO_CATEGORY[p]
      if (expected === undefined) fail(`id prefix "${p}" is in the dataset and not in bacrCategories.ts's table — the card cannot attribute its questions`)
      else if (!cats.has(expected)) fail(`id prefix "${p}" maps to ${JSON.stringify(expected)} in bacrCategories.ts but to ${[...cats].join(', ')} in the dataset`)
    }
    for (const p of Object.keys(ID_PREFIX_TO_CATEGORY))
      if (!observed.has(p)) fail(`bacrCategories.ts declares id prefix "${p}", which no question carries — a stale entry in the attribution table`)
    return { examined, prefixes: [...observed].map(([p, c]) => [p, [...c][0]]).sort() }
  },
}

export default {
  id: 'baiw',
  title: 'BAIW — Banking Analytics',
  dataDir: 'src/data',
  datasets: {
    bacr: 'bacrQuestions.json',
    benchmarks: 'benchmarks.json',
  },
  reportSources: [{ rel: 'src/utils/reportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-BAIW-MATURITY', 'MR-BAIW-REGISTER', 'MR-BAIW-ROADMAP'],

  /** Declared run order — this is the order findings print in. */
  checks: [categoryUniverse, categoryPrefix, benchmarkRollup],

  summary(ctx) {
    const r = ctx.results
    const pref = r['BACR-CATEGORY-PREFIX']?.prefixes ?? []
    return [
      categoryUniverseSummary(r['CATEGORY-UNIVERSE'], 'BACR', '  '),
      `  id prefixes: ${pref.map(([p, c]) => `${p}=${c}`).join('  ')}`,
      `  ${rollupSummary(r['BENCHMARK-ROLLUP'], 'benchmarks')}`,
    ]
  },
}
