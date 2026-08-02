/**
 * HAIW — Healthcare Analytics. Dataset rules.
 *
 * HAIW is the only module in the suite that can honestly score a capability,
 * because it is the only one whose questions carry `capabilityLinks`. That is a
 * data fact, and HCF-LINK is what turns it from an assumption into a checked one:
 * 720 of 720 questions linked, 108 of 108 capabilities reached. Everything the
 * gap register and page 13 claim rests on it, and before D4 nothing verified it.
 *
 * HACR-CATEGORY-MAP is the one to read first. The assessment screen groups
 * questions by their `category` field; the report groups them by the two-letter
 * code in the id. Nothing checked that those two partitions agree, and a renamed
 * category would have split HAIW's scoring in two without a single error.
 *
 * `MR-HAIW-GAP` keeps the word the other two modules gave up. See CLAUDE.md, "A
 * capability score needs a link, not a heading".
 */
import { unique, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'
import { parseFile, propName, ts } from '../lib/ts-ast.mjs'
import { makeCategoryUniverse, categoryUniverseSummary } from '../lib/category-universe.mjs'

/**
 * The eight HACR categories and the id code that selects each, mirrored from
 * `healthReportGenerator.ts`'s `CODE_TO_CATEGORY`.
 *
 * Restated here on purpose. The gate cannot import TypeScript without compiling
 * it, and compiling a 1400-line report module to read one constant would make the
 * check depend on the thing it checks. HACR-CATEGORY-MAP asserts this table
 * against the DATASET, so a drift between this file and the generator's copy
 * surfaces as a failure the moment either stops matching the data.
 */
const CODE_TO_CATEGORY = Object.freeze({
  SL: 'Strategy & Leadership',
  WS: 'Workforce & Skills',
  DG: 'Data Governance & Standards',
  IS: 'Infrastructure & Systems',
  AI: 'Analytics & Intelligence',
  II: 'Integration & Interoperability',
  PC: 'Patient & Community Engagement',
  OI: 'Outcomes & Impact',
})

// ── HACR-SHAPE ──────────────────────────────────────────────────────────────
const hacrShape = {
  code: 'HACR-SHAPE',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const f = ctx.failAs
    const { fail } = ctx
    if (!Array.isArray(qs)) { fail('hacrQuestions.json is not an array'); return { examined: 0 } }

    shapeCheck(f, 'HACR-SHAPE', 'question', qs, {
      id: idLike(/^HACR-[A-Z]{2}-\d{3}$/),
      category: oneOf(Object.values(CODE_TO_CATEGORY)),
      categoryId: idLike(/^CAT-[A-Z]{2}$/),
      subcategory: str(),
      question: str(10),
      levelDescriptions: (v) => (v && typeof v === 'object' ? null : 'must be an object'),
      // Shape only: a number in a sane range. HAIW-WEIGHT owns the semantics and
      // asserts `=== 1` — HACR is unweighted. Two codes on purpose: this one says
      // "the field is a usable number", that one says "and it is the value the
      // module decided on". Loosening either without the other is the gap the
      // five-cycle lived in.
      weight: (v) => num(v) ?? (v > 0 && v <= 2 ? null : `must be in (0, 2], got ${v}`),
      capabilityLinks: (v) => (Array.isArray(v) && v.length > 0 ? null : 'must be a non-empty array — a question linking to nothing cannot score any capability'),
      pakistanContext: (v) => (typeof v === 'string' || v === null || v === undefined ? null : 'must be a string when present'),
    }, ['id', 'category', 'categoryId', 'subcategory', 'question', 'levelDescriptions', 'weight', 'capabilityLinks'])

    for (const q of qs) {
      const lv = Object.keys(q.levelDescriptions ?? {}).sort().join(',')
      if (lv !== '1,2,3,4,5')
        fail(`question ${q.id} levelDescriptions keys = [${lv}], expected 1..5`)
    }
    return { examined: qs.length }
  },
}

// ── HACR-UNIQUE ─────────────────────────────────────────────────────────────
const hacrUnique = {
  code: 'HACR-UNIQUE',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    // Answers are one flat map keyed by question id. A duplicate is two questions
    // sharing one answer, in both directions, with nothing to show for it.
    return { examined: unique(ctx.failAs, 'HACR-UNIQUE', 'HACR question', qs.map((q) => q.id)) }
  },
}

// ── HACR-CATEGORY-MAP ───────────────────────────────────────────────────────
/**
 * The id code and the `category` field must agree, for every question.
 *
 * THIS IS THE INVARIANT HAIW'S SCORING RESTS ON AND NOTHING CHECKED IT.
 * `HealthMaturityAssessment.tsx` buckets questions by `q.category` (via
 * `loadHacrQuestions`, which groups on that field). `healthReportGenerator.ts`
 * buckets them by `CODE_TO_CATEGORY[id.split('-')[1]]`. Those two partitions are
 * only the same partition because the data happens to make them so.
 *
 * Also asserts the two directions of completeness: every code has questions, and
 * every category is reachable from some code. A category with no code is
 * unreachable from the report; a code with no category silently drops its
 * questions out of the report's buckets while the screen still shows them.
 *
 * AND, since D-013, UNIFORMITY. HACR is 90 questions per category, 720 in all.
 * `HaiwDashboard.tsx` holds the client's answers but not the questions — it must
 * not pull 1.18 MB onto a landing page — so it pads each category to
 * `HACR_QUESTIONS_PER_CATEGORY` to say how many questions that category HAS. That
 * count is the only thing separating `not-assessed` from `not-applicable`. It
 * moves no mean, since `aggregate()` divides by the answered count; it is the
 * applicable figure the card reports, and a constant nothing checks is how a
 * dashboard came to score by position for two phases.
 */
const HACR_QUESTIONS_PER_CATEGORY = 90

const hacrCategoryMap = {
  code: 'HACR-CATEGORY-MAP',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const { fail } = ctx
    const seenCodes = new Set()
    const perCategory = new Map()
    for (const q of qs) {
      const code = String(q.id ?? '').split('-')[1]
      const fromCode = CODE_TO_CATEGORY[code]
      if (!fromCode) {
        fail(`question ${q.id} carries code "${code}", which selects no category — the report buckets by this code, so this question would be dropped from the PDF while the assessment screen still shows it`)
        continue
      }
      seenCodes.add(code)
      perCategory.set(fromCode, (perCategory.get(fromCode) ?? 0) + 1)
      if (fromCode !== q.category)
        fail(`question ${q.id} has category "${q.category}" but its id code "${code}" selects "${fromCode}" — the assessment screen groups by the field and the report groups by the code, so this question is scored into two different categories`)
    }
    for (const [code, cat] of Object.entries(CODE_TO_CATEGORY))
      if (!seenCodes.has(code))
        fail(`no question carries the code "${code}" for category "${cat}" — the report would score it not-applicable while the category exists`)

    for (const [cat, n] of [...perCategory].sort())
      if (n !== HACR_QUESTIONS_PER_CATEGORY)
        fail(
          `category "${cat}" holds ${n} questions, not ${HACR_QUESTIONS_PER_CATEGORY}. ` +
            `src/haiw/hacr.ts::HACR_QUESTIONS_PER_CATEGORY is what HaiwDashboard.tsx pads with to state how many ` +
            `questions a category has, having the answers but not the question bank — so it would report the wrong ` +
            `applicable count for this category. Derive the count or update the constant, in the same commit. D-013.`,
        )

    return { examined: qs.length, categories: seenCodes.size, perCategory: HACR_QUESTIONS_PER_CATEGORY }
  },
}

// ── HCF-SHAPE ───────────────────────────────────────────────────────────────
const hcfShape = {
  code: 'HCF-SHAPE',
  run(ctx) {
    const caps = ctx.data.caps ?? []
    const f = ctx.failAs
    shapeCheck(f, 'HCF-SHAPE', 'capability', caps, {
      id: idLike(/^HCF-\d{3}$/),
      name: str(),
      theme: str(),
      themeId: str(),
      themeColor: str(),
      group: str(),
      groupId: str(),
      description: str(10),
      fhirResources: (v) => (Array.isArray(v) ? null : 'must be an array'),
      hcdmSubjectAreas: (v) => (Array.isArray(v) ? null : 'must be an array'),
      maturityLevelRequired: (v) => num(v) ?? (Number.isInteger(v) && v >= 1 && v <= 5 ? null : `must be an integer 1..5, got ${v}`),
      pakistanEnrichment: () => null,
      relatedCapabilities: (v) => (Array.isArray(v) ? null : 'must be an array'),
      businessQuestions: (v) => (Array.isArray(v) ? null : 'must be an array'),
    }, ['id', 'name', 'theme', 'group', 'description', 'fhirResources', 'hcdmSubjectAreas', 'maturityLevelRequired'])
    unique(f, 'HCF-SHAPE', 'HCF capability', caps.map((c) => c.id))
    return { examined: caps.length }
  },
}

// ── HCF-LINK ────────────────────────────────────────────────────────────────
/**
 * The relation that makes HAIW different from every other module.
 *
 * Only HACR carries `capabilityLinks`, which is why only HAIW derives a
 * per-capability score and why BAIW's and TAIW's registers report framework
 * coverage instead. Two directions, and both matter:
 *
 *   link -> capability   a link to a missing id is DROPPED by `scoreCapabilities`
 *                        ("the dataset is the authority on what exists"), so the
 *                        question quietly scores nothing at all.
 *   capability -> link   a capability no question reaches comes back
 *                        `not-applicable`, is excluded from the gap ranking, and
 *                        appears in the CSV as a row with no number. That is
 *                        honest output for a genuine gap and an authoring hole
 *                        wearing a not-applicable costume when it is not — the
 *                        same argument CROSSWALK-ORPHAN makes for a leaf
 *                        dimension with no mapping, so it fails the same way.
 */
const hcfLink = {
  code: 'HCF-LINK',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const caps = ctx.data.caps ?? []
    const { fail } = ctx
    const ids = new Set(caps.map((c) => c.id))
    const reached = new Set()
    let examined = 0
    for (const q of qs)
      for (const link of q.capabilityLinks ?? []) {
        examined++
        if (!ids.has(link))
          fail(`question ${q.id} links to capability ${JSON.stringify(link)}, which is not in capabilities.json — scoreCapabilities drops the link, so this question contributes to nothing`)
        else reached.add(link)
      }
    for (const c of caps)
      if (!reached.has(c.id))
        fail(`capability ${c.id} "${c.name}" is linked from no HACR question — it can never be scored, and page 13 and the gap CSV would both report it not-applicable with no way to tell that from a deliberate scope decision`)
    return { examined, reached: reached.size, capabilities: caps.length }
  },
}

// ── HCF-FK ──────────────────────────────────────────────────────────────────
const hcfFk = {
  code: 'HCF-FK',
  run(ctx) {
    const caps = ctx.data.caps ?? []
    const { fail } = ctx
    const capIds = new Set(caps.map((c) => c.id))
    const fhirNames = new Set((ctx.data.fhir ?? []).map((r) => r.name))
    const saIds = new Set((ctx.data.subjectAreas ?? []).map((s) => s.id))
    let examined = 0
    const check = (where, value, set, what) => {
      examined++
      if (!set.has(value)) fail(`${where} references ${what} ${JSON.stringify(value)}, which does not exist`)
    }
    for (const c of caps) {
      for (const r of c.relatedCapabilities ?? []) check(`capability ${c.id} relatedCapabilities`, r, capIds, 'capability')
      for (const r of c.fhirResources ?? []) check(`capability ${c.id} fhirResources`, r, fhirNames, 'FHIR resource')
      for (const s of c.hcdmSubjectAreas ?? []) check(`capability ${c.id} hcdmSubjectAreas`, s, saIds, 'HCDM subject area')
    }
    for (const sa of ctx.data.subjectAreas ?? [])
      for (const r of sa.fhirResources ?? []) check(`subject area ${sa.id} fhirResources`, r, fhirNames, 'FHIR resource')
    return { examined }
  },
}

// ── HAIW-WEIGHT ─────────────────────────────────────────────────────────────
/**
 * HACR IS UNWEIGHTED. Every question weighs exactly 1.
 *
 * ─── WHAT THIS ASSERTED BEFORE, AND WHY IT WAS NOT ENOUGH ──────────────────
 *
 * It asserted `weight > 0`, so that `aggregate()`'s unweighted fallback — the one
 * guarding against NaN on a client deliverable — stayed provably dead. That was
 * true and it was not the interesting property. It passed happily on:
 *
 *     weight === W[(i + 1) % 5]   for ALL 720 questions in file order,
 *     W = [0.8, 0.9, 1.0, 1.1, 1.2]
 *
 * A repeating five-cycle over the file. Not editorial judgement, not domain
 * weighting — a counter, and `> 0` cannot tell the two apart. It reached the
 * client: on the golden fixture it moved 46 of 108 printed capability scores and
 * five priority bands; on the partial fixture, all 108 scores and nine bands. Two
 * capabilities entered page 13's top-20 ranking and two left it, on both profiles.
 * See docs/known-defects.md D-015.
 *
 * ─── WHAT IT ASSERTS NOW ───────────────────────────────────────────────────
 *
 * `weight === 1`, which is STRICTLY STRONGER than `> 0` — so the NaN guard is
 * still provably unreachable, by a wider margin than before — and which additional-
 * ly makes "HACR is unweighted" a checked fact rather than a state of the file.
 *
 * This deliberately fails the day someone authors real weights. That is the point:
 * weighting HACR moves every capability score and every priority band, so it is a
 * content decision with its own walk, and the rule file has to be edited in the
 * same commit that starts it. A check that quietly accepted the change would let
 * the numbers move with nothing said — which is exactly how the counter survived.
 *
 * TACR carries no `weight` field at all, so the two modules now agree: category
 * scoring passes 1 in both, and for HAIW that is now true of capability scoring
 * too. See CLAUDE.md, "Category scoring — TAIW and HAIW".
 */
const HACR_WEIGHT = 1

const haiwWeight = {
  code: 'HAIW-WEIGHT',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const { fail } = ctx
    for (const q of qs)
      if (q.weight !== HACR_WEIGHT)
        fail(
          `question ${q.id} has weight ${JSON.stringify(q.weight)}, not ${HACR_WEIGHT}. HACR is unweighted by decision — ` +
            `the field was a repeating 5-cycle (D-015) and flattening it moved 46 of 108 printed capability scores. ` +
            `A weight that is not 1 is either that counter reinstated or real weighting begun, and the second needs ` +
            `authoring, a walk and this rule changed in the same commit.`,
        )
    const weights = qs.map((q) => q.weight).filter((w) => typeof w === 'number')
    return {
      examined: qs.length,
      min: weights.length ? Math.min(...weights) : null,
      max: weights.length ? Math.max(...weights) : null,
    }
  },
}

/*
 * ── BENCHMARK-ROLLUP, HAIW's half ───────────────────────────────────────────
 *
 * HAIW's benchmarks are not a dataset. They are `DEFAULT_BENCHMARKS`, a literal
 * in `healthReportGenerator.ts`, and the fixture passes `benchmarks: null` so the
 * generator falls back to them — exactly as `HealthReportGenerator.tsx` does.
 *
 * HAIW is the module that got this right: three blocks, eight categories each, and
 * NO `Overall Assessment` key. This check asserts the absence stays, and it is not
 * pedantry. `healthReportGenerator.ts` computes
 *
 *     const regAvg = Object.values(bm.regionalLeaders).reduce(...) / Object.values(...).length
 *
 * — the mean of EVERY value in the block. That is correct only while no rollup
 * exists. The day someone adds one for symmetry with BAIW and TAIW, that line
 * averages the rollup in with its own components and the number silently drifts
 * toward it. This is the same class as D-010 read from the other end: there the
 * rollup disagreed with its components, here it would corrupt them.
 *
 * The companion assertion runs too — all eight HACR categories present in every
 * block — which is what makes `bm.regionalLeaders[cat] ?? 3.0` provably dead.
 *
 * Read through the DECLARED report source set, not a hardcoded path. If
 * REPORT-SOURCES ever stops resolving this generator, this check says so under
 * its own name rather than passing over a file it never opened.
 */
const HAIW_ROLLUP_KEY = 'Overall Assessment'
const HAIW_BENCHMARKS_CONST = 'DEFAULT_BENCHMARKS'

const categoryUniverse = makeCategoryUniverse({
  label: 'HACR',
  // HAIW's rendered list. It was declared inside healthReportGenerator.ts until
  // D-013 gave the dashboard a real radar: the dashboard cannot import a 1,400-line
  // jsPDF module for eight strings, and retyping them would have been the fourth
  // copy this rule exists to reject. Now one file, three importers.
  // HAIW is the module that never carried a phantom entry — the rule is here so
  // that stays a checked fact rather than an observed one.
  declaredIn: { rel: 'src/haiw/hacr.ts', constName: 'HACR_CATEGORIES' },
  categories: (ctx) => (ctx.data.hacr ?? []).map((q) => q.category).filter((c) => typeof c === 'string'),
})

const benchmarkRollup = {
  code: 'BENCHMARK-ROLLUP',
  run(ctx) {
    const { fail, root } = ctx
    const abs = (ctx.sources ?? []).find((f) => f.endsWith('haiw/utils/healthReportGenerator.ts'))
    if (!abs) {
      fail(`healthReportGenerator.ts is not in the declared report source set, so ${HAIW_BENCHMARKS_CONST} was never read`)
      return { examined: 0 }
    }

    const { sf, at } = parseFile(root, abs)
    let literal = null
    let decl = null
    const visit = (node) => {
      if (
        literal === null &&
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === HAIW_BENCHMARKS_CONST &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        literal = node.initializer
        decl = node
      }
      ts.forEachChild(node, visit)
    }
    ts.forEachChild(sf, visit)

    if (literal === null) {
      fail(`${HAIW_BENCHMARKS_CONST} is not an object literal in healthReportGenerator.ts — it moved or was renamed, and this check is reading nothing`)
      return { examined: 0 }
    }

    const cats = Object.values(CODE_TO_CATEGORY)
    const blocks = []
    for (const prop of literal.properties) {
      if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue
      const name = propName(prop.name)
      if (name === null) continue
      const keys = prop.initializer.properties
        .map((p) => (ts.isPropertyAssignment(p) ? propName(p.name) : null))
        .filter((k) => k !== null)
      blocks.push({ name, keys })

      if (keys.includes(HAIW_ROLLUP_KEY))
        fail(
          `${at(prop)}: ${HAIW_BENCHMARKS_CONST}.${name} carries a "${HAIW_ROLLUP_KEY}" key. ` +
            `healthReportGenerator.ts averages EVERY value in a benchmark block to get regAvg, so a rollup here is folded in ` +
            `with its own components and drags the mean toward itself. HAIW is the module without this key; keep it that way, ` +
            `or change regAvg to exclude it in the same commit. D-010.`,
        )

      for (const cat of cats)
        if (!keys.includes(cat))
          fail(
            `${at(prop)}: ${HAIW_BENCHMARKS_CONST}.${name} has no entry for HACR category "${cat}" — ` +
              `the generator falls back to a hardcoded constant, so the client is benchmarked against a number that is not about them`,
          )
    }

    if (blocks.length === 0) {
      fail(`${at(decl)}: ${HAIW_BENCHMARKS_CONST} carries no object-literal blocks — nothing was checked`)
      return { examined: 0 }
    }
    return { examined: blocks.length, categories: cats.length, blocks: blocks.map((b) => b.name) }
  },
}

export default {
  id: 'haiw',
  title: 'HAIW — Healthcare Analytics',
  dataDir: 'src/data/haiw',
  datasets: {
    hacr: 'hacrQuestions.json',
    caps: 'capabilities.json',
    fhir: 'fhirResources.json',
    subjectAreas: 'hcdmSubjectAreas.json',
  },
  reportSources: [{ rel: 'src/haiw/utils/healthReportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-HAIW-MATURITY', 'MR-HAIW-GAP', 'MR-HAIW-ROADMAP'],

  /** Declared run order — this is the order findings print in. */
  checks: [categoryUniverse, hacrShape, hacrUnique, hacrCategoryMap, hcfShape, hcfLink, hcfFk, haiwWeight, benchmarkRollup],

  summary(ctx) {
    const r = ctx.results
    const out = []
    const map = r['HACR-CATEGORY-MAP'] ?? {}
    const w = r['HAIW-WEIGHT'] ?? {}
    out.push(
      `HACR ${map.examined ?? 0} questions across ${map.categories ?? 0} categories` +
        (map.perCategory ? `, ${map.perCategory} each` : '') +
        // Printed as a range on purpose. "unweighted (1–1)" reads as a fact;
        // "0.8–1.2" is what a five-cycle looked like on stdout for two phases
        // while everybody read it as editorial judgement.
        (w.min !== null && w.min !== undefined
          ? w.min === w.max && w.min === 1
            ? '  unweighted (every weight 1)'
            : `  weights ${w.min}–${w.max}`
          : ''),
    )
    const link = r['HCF-LINK'] ?? {}
    out.push(
      `HCF ${link.capabilities ?? 0} capabilities  ${link.examined ?? 0} capabilityLinks` +
        `  ${link.reached ?? 0} of ${link.capabilities ?? 0} reached by at least one question` +
        ` — the relation that lets only HAIW score a capability`,
    )
    out.push(`  HCF-FK ${(r['HCF-FK'] ?? {}).examined ?? 0} cross-file references resolved`)
    out.push(`  ${categoryUniverseSummary(r['CATEGORY-UNIVERSE'], 'HACR', '    ')}`)
    const br = r['BENCHMARK-ROLLUP'] ?? {}
    out.push(
      `  DEFAULT_BENCHMARKS ${br.examined ?? 0} blocks over ${br.categories ?? 0} categories` +
        `${br.blocks?.length ? ` (${br.blocks.join(', ')})` : ''} — no "Overall Assessment" key, which regAvg depends on`,
    )
    return out
  },
}
