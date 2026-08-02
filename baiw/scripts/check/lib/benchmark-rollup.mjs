/**
 * BENCHMARK-ROLLUP — a rollup sitting beside its own components must equal them.
 *
 * ─── D-010, WHICH IS WHY THIS EXISTS ───────────────────────────────────────
 *
 * `src/data/benchmarks.json` carries three benchmark blocks, each holding eight
 * per-category numbers and an `Overall Assessment` rollup. Two of the three
 * rollups did not equal the mean of the eight numbers three lines above them:
 *
 *   pakistanBankingAverage  1.86  vs  1.8625   reconciles
 *   regionalLeaders         3.18  vs  3.3      -0.12
 *   globalBest              4.13  vs  4.25     -0.12
 *
 * `reportGenerator.ts` reads the first of those for page 16's "You are N levels
 * behind regional leaders", so a bank read 0.4 where its own components said
 * 0.5 — the distance understated, on the one page whose entire purpose is a
 * comparison against peers. TAIW's three all reconcile; the defect was one
 * module's, born in a build prompt and never checked against the numbers beside
 * it. See docs/known-defects.md D-010.
 *
 * ─── THE JOIN IS THE POINT ─────────────────────────────────────────────────
 *
 * "Real category" means PRESENT IN THE MODULE'S QUESTION DATASET, not "every
 * other numeric key in the block". That distinction is the whole check.
 *
 * Averaging every numeric key would have folded `Overall Assessment` into its own
 * mean, and — worse — would have accepted a category that exists nowhere. Both
 * golden fixtures carried a ninth category, `"Overall Assessment"` at a perfect
 * 5.0, that no question dataset contains; it was averaged in as though measured
 * and put 27/9 = 3.0 on two covers where the measured eight say 22/8 = 2.8. The
 * benchmark files carry the same phantom key. A rule that derives its category
 * set from the questions cannot be fooled by either, because the questions are
 * the only place a category is real.
 *
 * ─── TWO ASSERTIONS, AND WHY THE SECOND IS HERE ────────────────────────────
 *
 * 1. ROLLUP. If a block carries the rollup key, it must equal the 2dp mean of
 *    that block's real categories, or be declared in `exceptions`.
 *
 * 2. COMPANION — every real category has a numeric entry in every block. This is
 *    what makes `reportGenerator.ts`'s five `typeof pkVal === 'number' ? pkVal :
 *    1.86` fallbacks PROVABLY dead rather than assumed dead. docs/known-defects.md
 *    lists them under D-008 as "unreachable today", which was true and was
 *    checked by nobody; a category quietly dropped from a block would have
 *    benchmarked a client against a hardcoded constant that is not about them.
 *
 * NOTE for TAIW: `TAIW-BENCHMARK-KEYS` predates this and asserts the companion
 * for TACR already, plus it reports non-category numeric keys. Both will fire on
 * a missing TAIW category. That duplication is stated rather than removed —
 * CLAUDE.md rule 9 is additive-only, and the older check also carries the
 * `extras` report this one does not.
 *
 * ─── THE EXCEPTION MAP ─────────────────────────────────────────────────────
 *
 * A rollup genuinely taken from an outside source is legitimate and must not be
 * forced to equal a mean. It is declared as data with a reason NAMING THE SOURCE,
 * on the `SLUG_EXCEPTIONS` / `mayBeEmpty` precedent: a rule with an exception
 * should require someone to write down which and why, in source.
 *
 * A STALE exception — one whose block now reconciles — FAILS, so a corrected
 * value cannot leave a permanent hole in the check.
 *
 * Both maps ship EMPTY after D-010. That is the honest state: no BAIW or TAIW
 * rollup is independently sourced today, and none carries a citation, a URL or a
 * methodology note anywhere in the repo.
 */

/** The precision every rollup in the suite is authored at. `1.8625` -> `1.86`. */
const round2 = (n) => Number(n.toFixed(2))

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Build the check for one module.
 *
 * @param dataKey     key in `ctx.data` holding the parsed benchmarks file
 * @param fileLabel   how the file is named in a finding
 * @param categories  (ctx) => string[] — the module's REAL categories, read from
 *                    its question dataset. Never the benchmark file's own keys.
 * @param exceptions  block name -> reason naming the source. Ships frozen.
 */
export const makeBenchmarkRollup = ({
  code = 'BENCHMARK-ROLLUP',
  dataKey,
  fileLabel,
  categories,
  rollupKey = 'Overall Assessment',
  exceptions = {},
  assertCompanion = true,
}) => ({
  code,
  run(ctx) {
    const { fail } = ctx
    const file = ctx.data[dataKey]
    if (!isPlainObject(file)) {
      fail(`${fileLabel} is not an object — nothing to check`)
      return { examined: 0, blocks: [], exceptions: [] }
    }

    const cats = [...new Set(categories(ctx))].sort()
    if (cats.length === 0) {
      // Not a skip. An empty category set would make every mean vacuous and every
      // companion assertion pass over nothing, which is exactly the shape
      // `examined: 0` exists to catch — but it would still report blocks, so say
      // it here where the reason is knowable.
      fail(`the question dataset yielded no categories, so every rollup would be compared against an empty mean`)
      return { examined: 0, blocks: [], exceptions: [] }
    }

    // A benchmark block is a top-level object carrying at least one REAL category
    // with a numeric value. `maturityLevelDescriptions` is excluded by that test
    // rather than by name, so a fourth benchmark block joins automatically and a
    // renamed one does not silently drop out.
    const blocks = Object.keys(file).filter(
      (k) => isPlainObject(file[k]) && cats.some((c) => typeof file[k][c] === 'number'),
    )
    if (blocks.length === 0) {
      fail(`${fileLabel} has no block carrying a numeric entry for any real category — either the file restructured or the category set is wrong`)
      return { examined: 0, blocks: [], exceptions: [] }
    }

    const seenExceptions = new Set()
    const reported = []

    for (const name of blocks) {
      const block = file[name]

      if (assertCompanion) {
        for (const cat of cats) {
          if (typeof block[cat] !== 'number')
            fail(
              `${fileLabel}.${name} has no numeric entry for category "${cat}" — the report falls back to a hardcoded constant, ` +
                `so the client is benchmarked against a number that is not about them`,
            )
        }
      }

      const present = cats.filter((c) => typeof block[c] === 'number')
      if (present.length === 0) continue
      const mean = round2(present.reduce((s, c) => s + block[c], 0) / present.length)

      const stated = block[rollupKey]
      if (stated === undefined) {
        // Absence is legitimate — HAIW's DEFAULT_BENCHMARKS carries no rollup at
        // all, and that is the safest shape. Recorded, not failed.
        reported.push({ block: name, stated: null, mean, state: 'absent' })
        continue
      }
      if (typeof stated !== 'number') {
        fail(`${fileLabel}.${name}["${rollupKey}"] is ${JSON.stringify(stated)}, not a number`)
        reported.push({ block: name, stated: null, mean, state: 'not-a-number' })
        continue
      }

      const why = exceptions[name]
      if (why !== undefined) {
        seenExceptions.add(name)
        if (stated === mean) {
          fail(
            `${fileLabel}.${name} is declared an exception ("${why}") but its rollup ${stated} now EQUALS the mean of its ` +
              `${present.length} categories — a stale exception leaves a permanent hole in this check; remove the entry`,
          )
          reported.push({ block: name, stated, mean, state: 'stale-exception' })
        } else {
          reported.push({ block: name, stated, mean, state: 'declared', why })
        }
        continue
      }

      if (stated !== mean) {
        fail(
          `${fileLabel}.${name}["${rollupKey}"] is ${stated} but the mean of its ${present.length} categories is ${mean} ` +
            `(off by ${round2(stated - mean)}). A rollup printed beside its own components must equal them, or be declared ` +
            `in this rule file's exception map with a reason naming its source. D-010.`,
        )
        reported.push({ block: name, stated, mean, state: 'mismatch' })
        continue
      }
      reported.push({ block: name, stated, mean, state: 'reconciles' })
    }

    /*
     * An exception the rule never consulted reads as coverage and is not — as
     * stale as one whose block reconciles. There are two ways to get here and
     * they are DIFFERENT FACTS, so they say different things.
     *
     * Conflating them was caught by `check:selftest`, and only by it: when
     * D-011 removed BAIW's rollup keys, the stale-exception mutation kept
     * reporting TRIPPED while silently exercising the unknown-block branch
     * instead — one code, two branches, a matrix that only asserts the code. The
     * message it printed ("does not carry as a benchmark block") was also just
     * wrong: `globalBest` is very much a benchmark block; it has no rollup.
     */
    const blockNames = new Set(blocks)
    for (const name of Object.keys(exceptions)) {
      if (seenExceptions.has(name)) continue
      if (blockNames.has(name))
        fail(
          `the exception map declares block "${name}" ("${exceptions[name]}"), but that block carries no "${rollupKey}" ` +
            `key — there is no rollup for the exception to excuse`,
        )
      else fail(`the exception map names block "${name}", which ${fileLabel} does not carry as a benchmark block`)
    }

    return { examined: blocks.length, categories: cats.length, blocks: reported, exceptions: [...seenExceptions].sort() }
  },
})

/** One summary line per module, so the reconciliation is visible on every build. */
export const rollupSummary = (res, label) => {
  const blocks = res?.blocks ?? []
  if (blocks.length === 0) return `${label} 0 benchmark blocks`
  const part = blocks.map((b) => {
    if (b.state === 'absent') return `${b.block} no rollup`
    if (b.state === 'declared') return `${b.block} ${b.stated} DECLARED (mean ${b.mean})`
    return `${b.block} ${b.stated}`
  })
  return `${label} ${blocks.length} blocks over ${res.categories} categories — ${part.join(', ')}`
}
