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
      // The only field capability scoring weights by. Out of range and the
      // weighted mean stops meaning anything; zero or negative and `aggregate`
      // falls back to an unweighted mean, which HAIW-WEIGHT forbids outright.
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
 */
const hacrCategoryMap = {
  code: 'HACR-CATEGORY-MAP',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const { fail } = ctx
    const seenCodes = new Set()
    for (const q of qs) {
      const code = String(q.id ?? '').split('-')[1]
      const fromCode = CODE_TO_CATEGORY[code]
      if (!fromCode) {
        fail(`question ${q.id} carries code "${code}", which selects no category — the report buckets by this code, so this question would be dropped from the PDF while the assessment screen still shows it`)
        continue
      }
      seenCodes.add(code)
      if (fromCode !== q.category)
        fail(`question ${q.id} has category "${q.category}" but its id code "${code}" selects "${fromCode}" — the assessment screen groups by the field and the report groups by the code, so this question is scored into two different categories`)
    }
    for (const [code, cat] of Object.entries(CODE_TO_CATEGORY))
      if (!seenCodes.has(code))
        fail(`no question carries the code "${code}" for category "${cat}" — the report would score it not-applicable while the category exists`)
    return { examined: qs.length, categories: seenCodes.size }
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
 * Every weight is strictly positive, so `aggregate`'s NaN guard stays unreachable.
 *
 * `aggregate()` falls back to an unweighted mean when the total weight is not
 * positive, because NaN on a client deliverable is worse than the wrong kind of
 * mean. That fallback is a last resort and must never be the thing that runs: a
 * silently unweighted capability score would disagree with the screen and nothing
 * would say so. The guard stays in the code; this asserts it is dead.
 */
const haiwWeight = {
  code: 'HAIW-WEIGHT',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const { fail } = ctx
    for (const q of qs)
      if (!(typeof q.weight === 'number' && q.weight > 0))
        fail(`question ${q.id} has weight ${JSON.stringify(q.weight)} — a non-positive weight sends aggregate() down its unweighted fallback, and a silently unweighted capability score is one that disagrees with the screen for no visible reason`)
    const weights = qs.map((q) => q.weight).filter((w) => typeof w === 'number')
    return {
      examined: qs.length,
      min: weights.length ? Math.min(...weights) : null,
      max: weights.length ? Math.max(...weights) : null,
    }
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
  checks: [hacrShape, hacrUnique, hacrCategoryMap, hcfShape, hcfLink, hcfFk, haiwWeight],

  summary(ctx) {
    const r = ctx.results
    const out = []
    const map = r['HACR-CATEGORY-MAP'] ?? {}
    const w = r['HAIW-WEIGHT'] ?? {}
    out.push(
      `HACR ${map.examined ?? 0} questions across ${map.categories ?? 0} categories` +
        (w.min !== null && w.min !== undefined ? `  weights ${w.min}–${w.max}` : ''),
    )
    const link = r['HCF-LINK'] ?? {}
    out.push(
      `HCF ${link.capabilities ?? 0} capabilities  ${link.examined ?? 0} capabilityLinks` +
        `  ${link.reached ?? 0} of ${link.capabilities ?? 0} reached by at least one question` +
        ` — the relation that lets only HAIW score a capability`,
    )
    out.push(`  HCF-FK ${(r['HCF-FK'] ?? {}).examined ?? 0} cross-file references resolved`)
    return out
  },
}
