/**
 * HAIW — Healthcare Analytics. Dataset rules.
 *
 * THIS FILE OPENED, FOR TWO PHASES, WITH A CLAIM THAT WAS FALSE.
 *
 * It said: "HAIW is the only module in the suite that can honestly score a
 * capability, because it is the only one whose questions carry `capabilityLinks`.
 * That is a data fact, and HCF-LINK is what turns it from an assumption into a
 * checked one: 720 of 720 questions linked, 108 of 108 capabilities reached."
 *
 * Every number in that sentence was correct. The conclusion was not.
 * `capabilityLinks[0] === 'HCF-' + pad(((i + 1) % 108) + 1)` in file order — a
 * modular counter — and a counter passes a foreign-key check MORE cleanly than a
 * real relation would: nothing dangles, every target is reached, the distribution is
 * perfectly even. HCF-LINK was not weak; it was answering a different question from
 * the one this comment used it to settle. D-016.
 *
 * D5 stage E2 withdrew the per-capability score, so all three modules now agree:
 * a capability score requires an AUTHORED link, and `MR-HAIW-GAP` became
 * `MR-HAIW-REGISTER`. Building the replacement register turned up two more positional
 * fields in `capabilities.json` — `maturityLevelRequired` and `relatedCapabilities`
 * — which nothing had ever measured, and which are withdrawn from the deliverables on
 * the same grounds. D-017.
 *
 * HCF-SYNTHETIC is the class that exists so none of this can be quietly re-earned:
 * it pins all three cycles and fails the day any is authored, and it asserts that
 * HAIW's generator reads none of them.
 *
 * HACR-CATEGORY-MAP is still the one to read first. The assessment screen groups
 * questions by their `category` field; the report groups them by the two-letter
 * code in the id. Nothing checked that those two partitions agree, and a renamed
 * category would have split HAIW's scoring in two without a single error.
 *
 * See CLAUDE.md, "A capability score needs a link, not a heading".
 */
import { unique, shapeCheck, str, num, idLike, oneOf } from '../lib/assert.mjs'
import { parseFile, propName, ts } from '../lib/ts-ast.mjs'
import { makeCategoryUniverse, categoryUniverseSummary } from '../lib/category-universe.mjs'
import { makeCrosswalkChecks, crosswalkSummary } from '../lib/crosswalk.mjs'

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
      /*
       * RANGE ONLY. Whether the value was DECIDED is HCF-SYNTHETIC's question, and
       * it is not: `[2, 3, 3, 1][i % 4]` for all 108 in file order (D-017).
       *
       * `1..5` was the `> 0` mistake exactly — true of a counter, and this one is a
       * counter. Left here as a shape assertion because that is all it ever was;
       * pinning the cycle belongs in a class whose name says it is about whether the
       * field means anything.
       */
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
 * REFERENTIAL INTEGRITY OF `capabilityLinks`. NOT evidence that the relation is real.
 *
 * ─── WHAT THIS CLASS CLAIMED, AND WHY THE CLAIM WAS WRONG ───────────────────
 *
 * It used to open "the relation that makes HAIW different from every other module",
 * and CLAUDE.md cited it as what turned HAIW's per-capability score from an
 * assumption into a checked fact: 720 of 720 questions linked, 108 of 108
 * capabilities reached, nothing dangling.
 *
 * Every one of those assertions passed. All of them still pass. And the relation was
 * a modular counter — `capabilityLinks[0] === 'HCF-' + pad(((i + 1) % 108) + 1)` for
 * all 720 in file order (D-016). **A COUNTER SATISFIES A FOREIGN-KEY CHECK BETTER
 * THAN A REAL RELATION WOULD**: it cannot dangle, it reaches every target exactly, and
 * it distributes perfectly evenly. The check was not weak, it was answering a
 * different question — D-015's lesson at the level of the join rather than the value.
 *
 * ─── SO WHAT IT ASSERTS NOW ─────────────────────────────────────────────────
 *
 * The same two directions, and nothing more, with the claim withdrawn. They are worth
 * keeping: they are cheap, and they are the first thing anyone authoring 720 real
 * links will want. What they establish is that the IDS LINE UP. Whether the links
 * mean anything is `HCF-SYNTHETIC`'s question, and today the answer is no.
 *
 *   link -> capability   a link to a missing id would be dropped by any consumer, so
 *                        the question would contribute to nothing.
 *   capability -> link   a capability no question reaches could never be scored.
 *
 * NEITHER DIRECTION GATES A DELIVERABLE ANY MORE. D5 stage E2 withdrew the
 * per-capability score, so nothing in HAIW's report set reads this field —
 * `HCF-SYNTHETIC` asserts that too, because an unread field that a future edit could
 * pick back up is exactly the D-008 shape. This class is dataset hygiene against the
 * day the links are authored, not a guard on output.
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
        fail(`capability ${c.id} "${c.name}" is linked from no HACR question — nothing could ever evidence it if the links were authored, and the register would have no way to distinguish that from a deliberate scope decision`)

    // The positional measurement moved to HCF-SYNTHETIC in D5 stage E2, where it is
    // ASSERTED rather than reported. It sat here as a comment-and-count while a
    // deliverable still rested on the field; now that nothing does, the thing worth
    // guarding is that it stays that way.
    return { examined, reached: reached.size, capabilities: caps.length }
  },
}

// ── HCF-SYNTHETIC ───────────────────────────────────────────────────────────
/**
 * THE THREE HCF FIELDS THAT ARE SEQUENCE POSITION, PINNED SO THEY CANNOT DRIFT
 * EITHER WAY.
 *
 * D5 stage E2 withdrew HAIW's per-capability score because `capabilityLinks` is a
 * counter (D-016). Building the replacement register turned up two more fields in
 * `capabilities.json` with the same property, and neither had ever been measured
 * (D-017):
 *
 *   capabilityLinks[0]      `HCF-` + pad(((i + 1) % 108) + 1)   720 of 720
 *   maturityLevelRequired   [2, 3, 3, 1][i % 4]                 108 of 108
 *   relatedCapabilities     [previous, next] in file order       108 of 108
 *
 * `maturityLevelRequired` is the instructive one. Its distribution is
 * {1: 27, 2: 27, 3: 54} — which reads like an authored profile weighted toward
 * level 3, and is 27 repetitions of one four-cycle. `HCF-SHAPE` asserted
 * `integer 1..5`, true of a counter, which is the `> 0` mistake with a range on it.
 * `relatedCapabilities` is why HCF-001 and HCF-108 list THEMSELVES: clamping at the
 * ends of a [previous, next] window.
 *
 * ─── WHY PINNED AND NOT MERELY REPORTED ─────────────────────────────────────
 *
 * `HCF-LINK` measured the link cycle and printed it for a phase, on the TCF-COVERAGE
 * precedent, because the two honest fixes led to opposite deliverables and neither
 * was that stage's to pick. That was right then. It is not right now: the decision
 * HAS been made — withdraw, one rule across the suite — and what needs guarding is
 * that the decision is not silently inherited by whoever authors these fields next.
 *
 * So this ASSERTS, in the shape `HAIW-WEIGHT` and `HACR-INSTRUMENT` ship in: **it
 * deliberately fails the day any of the three stops being positional.** On that day
 * the field has been authored, and the register and page 13 have to be revisited in
 * the same commit rather than continuing to omit a column that has become real. A
 * fixed defect must not leave a permanent hole.
 *
 * ─── AND THAT NOTHING SHIPS THEM ────────────────────────────────────────────
 *
 * The second branch reads HAIW's declared report source and fails if it references
 * any of the three. Removing the score was not enough on its own: an unreachable
 * branch that renders a number is a wrong number waiting for its caller to change,
 * which is exactly what D-008 was, and a type narrowing can be widened back in the
 * same commit that uses it. The check is over source text because that is the layer
 * `tsc` cannot speak to — `HacrQuestionLink` no longer carries `capabilityLinks`, but
 * `capabilities.json`'s own fields are typed and available.
 *
 * NOTE: the D5 crosswalk rests on none of this. It maps framework dimensions onto the
 * 80 HACR SUBCATEGORIES, an authored taxonomy, and reads no field named here.
 */
const PAD3 = (n) => `HCF-${String(n).padStart(3, '0')}`

/**
 * The three fields, their observed cycle, and the defect that recorded it.
 *
 * Declared as a table so the positional branch is ONE code path parameterised by
 * field rather than three near-copies — and so adding a fourth is a data edit. Each
 * predicate takes (record, index, all) and returns true when the value matches the
 * cycle it is pinned to.
 */
const POSITIONAL_FIELDS = Object.freeze([
  {
    field: 'capabilityLinks',
    dataset: 'hacr',
    cycle: "capabilityLinks[0] === 'HCF-' + pad(((i + 1) % 108) + 1)",
    defect: 'D-016',
    matches: (q, i, _all, caps) => (q.capabilityLinks ?? [])[0] === PAD3(((i + 1) % (caps.length || 1)) + 1),
  },
  {
    field: 'maturityLevelRequired',
    dataset: 'caps',
    cycle: 'maturityLevelRequired === [2, 3, 3, 1][i % 4]',
    defect: 'D-017',
    matches: (c, i) => c.maturityLevelRequired === [2, 3, 3, 1][i % 4],
  },
  {
    field: 'relatedCapabilities',
    dataset: 'caps',
    cycle: 'relatedCapabilities === [previous, next] in file order, clamped at both ends',
    defect: 'D-017',
    matches: (c, i, all) => {
      const at = (k) => all[Math.min(Math.max(k, 0), all.length - 1)]?.id
      const want = [at(i - 1), at(i + 1)]
      const got = c.relatedCapabilities ?? []
      return got.length === want.length && got.every((v, k) => v === want[k])
    },
  },
])

/** Fields no HAIW deliverable may read, because none of them means anything. */
const WITHDRAWN_FIELDS = Object.freeze(['capabilityLinks', 'maturityLevelRequired', 'relatedCapabilities'])

const hcfSynthetic = {
  code: 'HCF-SYNTHETIC',
  run(ctx) {
    const { fail, root, sources } = ctx
    const caps = ctx.data.caps ?? []
    let examined = 0

    for (const spec of POSITIONAL_FIELDS) {
      const records = ctx.data[spec.dataset] ?? []
      if (records.length === 0) {
        fail(`${spec.field} is pinned as positional (${spec.defect}) but its dataset "${spec.dataset}" is empty, so the pin verified nothing`)
        continue
      }
      let hits = 0
      for (const [i, rec] of records.entries()) {
        examined++
        if (spec.matches(rec, i, records, caps)) hits++
      }
      if (hits !== records.length)
        fail(
          `${spec.field} no longer matches ${spec.cycle} — ${hits} of ${records.length} records fit the cycle it was pinned to in ${spec.defect}. ` +
            `THIS IS EXPECTED TO FAIL THE DAY THE FIELD IS AUTHORED, and that day it stops being right to omit it: ` +
            `re-read docs/known-defects.md ${spec.defect}, then decide whether page 13 and MR-HAIW-REGISTER should now carry it. ` +
            `Do not simply widen this rule — the whole point is that the omission and the data are decided together.`,
        )
    }

    /*
     * The declared report source set, filtered to HAIW's own generator. Reading the
     * whole set would fail on DGIW's report code, which legitimately has fields of
     * its own; this class is about what HAIW ships.
     */
    const haiwSources = (sources ?? []).filter((f) => f.includes('healthReportGenerator'))
    if (haiwSources.length === 0) {
      fail(`no HAIW report source resolved from the declared set, so whether a withdrawn field reaches a deliverable is unverified — see REPORT-SOURCES`)
    }
    for (const file of haiwSources) {
      const { sf, rel } = parseFile(root, file)
      examined++
      for (const field of WITHDRAWN_FIELDS) {
        /*
         * Property ACCESS and destructuring, not any mention: every one of these
         * fields is discussed at length in that file's comments, and a rule that
         * failed on the word would make the explanation unwritable.
         */
        let used = false
        const visit = (node) => {
          if (ts.isPropertyAccessExpression(node) && node.name.text === field) used = true
          else if (ts.isBindingElement(node) && propName(node.propertyName ?? node.name) === field) used = true
          else if (ts.isPropertyAssignment(node) && propName(node.name) === field) used = true
          else if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression) && node.argumentExpression.text === field) used = true
          ts.forEachChild(node, visit)
        }
        visit(sf)
        if (used)
          fail(
            `${rel} reads capability field ${JSON.stringify(field)}, which D5 stage E2 withdrew as positional — ` +
              `a deliverable built on it would put a sequence artefact in front of a client under a heading that reads as a measurement. ` +
              `If the field has since been authored, HCF-SYNTHETIC's pin above will be failing too, and both change together.`,
          )
      }
    }

    return { examined, fields: POSITIONAL_FIELDS.length, sources: haiwSources.length }
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

// ── HACR-INSTRUMENT ─────────────────────────────────────────────────────────
/**
 * HACR'S 720 QUESTIONS ARE NINE TEMPLATE STEMS INSTANTIATED EIGHTY TIMES.
 *
 * Strip the subcategory name out of every `question` string and exactly NINE
 * distinct forms remain, each appearing 80 times. `levelDescriptions` and
 * `pakistanContext` are templated the same way. TACR, for comparison, has 640
 * individually authored question texts, all distinct.
 *
 * ─── WHY A CHECK, AND WHY IT ASSERTS RATHER THAN REPORTS ───────────────────
 *
 * The crosswalk projects four frameworks onto the 80 subcategories, and all four
 * reach 100% of themselves — where on TACR, DMBOK reached 94% and DGI 59%. THAT IS
 * NOT EVIDENCE OF DEPTH. It follows from the generation: uniform nine-question
 * coverage of an eighty-topic taxonomy leaves no framework leaf without a
 * plausible home. `retainedShare` cannot express it — a dimension can retain 1.0
 * on nine repetitions of one stem — and neither can FRAMEWORK-REACH, which counts
 * leaves rather than evidence.
 *
 * So the disclosure has to be a printed number, and the number has to be pinned.
 * This is `HAIW-WEIGHT`'s shape: the check states what the instrument IS, not what
 * it is not, and DELIBERATELY FAILS the day someone authors real questions —
 * because on that day the sentence beside every HAIW scorecard stops being true
 * and has to be rewritten in the same commit. A check that quietly accepted the
 * change would leave a disclosure on the page describing a bank that no longer
 * exists, which is the same failure as a caption reading "Weight-weighted mean"
 * over an unweighted number.
 *
 * The nine are declared in full rather than counted. `=== 9` is the `> 0` mistake:
 * true of the bank as it is, and true of nine completely different stems.
 */
const HACR_STEM_TOKEN = '<subcategory>'
const HACR_STEMS = Object.freeze([
  `how would you rate your organization's continuous improvement in ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's implementation maturity of ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's performance measurement of ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's process documentation for ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's resource allocation for ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's staff competency in ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's stakeholder engagement for ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's strategic planning for ${HACR_STEM_TOKEN}?`,
  `how would you rate your organization's technology support for ${HACR_STEM_TOKEN}?`,
])
const HACR_SUBCATEGORIES_PER_CATEGORY = 10

/** Mirrors `src/haiw/hacr.ts::hacrSlug`. See HACR-SUBCATEGORY-ID on why it is restated. */
const hacrSlug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const subIdOf = (q) => `${String(q.id ?? '').split('-')[1]?.toLowerCase()}_${hacrSlug(q.subcategory)}`

/** The question with its own subcategory name blanked out. What is left is the stem. */
const stemOf = (q) =>
  String(q.question ?? '')
    .toLowerCase()
    .split(String(q.subcategory ?? ' ').toLowerCase())
    .join(HACR_STEM_TOKEN)

const hacrInstrument = {
  code: 'HACR-INSTRUMENT',
  run(ctx) {
    const qs = ctx.data.hacr ?? []
    const { fail } = ctx
    const declared = new Set(HACR_STEMS)

    // A — THE STEM UNIVERSE. Exactly these nine forms and no others.
    const observed = new Map()
    for (const q of qs) {
      const s = stemOf(q)
      observed.set(s, (observed.get(s) ?? 0) + 1)
    }
    for (const s of [...observed.keys()].sort())
      if (!declared.has(s))
        fail(
          `HACR-INSTRUMENT: question stem ${JSON.stringify(s.slice(0, 70))} is not one of the ${HACR_STEMS.length} declared. ` +
            `The instrument disclosure printed beside every HAIW framework scorecard says the bank is nine templates over ` +
            `eighty subcategories, which is what makes 100% framework reach honest to report. Update HACR_STEMS and the ` +
            `disclosure in the same commit, or the page describes a question bank that no longer exists.`,
        )
    for (const s of HACR_STEMS)
      if (!observed.has(s))
        fail(`HACR-INSTRUMENT: declared stem ${JSON.stringify(s.slice(0, 70))} appears in no question — the declaration is stale`)

    // B — PER-SUBCATEGORY COVERAGE. Each of the nine, exactly once, in every one.
    const bySub = new Map()
    for (const q of qs) {
      const id = subIdOf(q)
      if (!bySub.has(id)) bySub.set(id, [])
      bySub.get(id).push(q)
    }
    for (const [id, group] of [...bySub].sort()) {
      const counts = new Map()
      for (const q of group) counts.set(stemOf(q), (counts.get(stemOf(q)) ?? 0) + 1)
      const missing = HACR_STEMS.filter((s) => !counts.has(s))
      const repeated = [...counts].filter(([, n]) => n > 1).map(([s, n]) => `${s.slice(0, 40)}…×${n}`)
      if (missing.length || repeated.length || group.length !== HACR_STEMS.length)
        fail(
          `HACR-INSTRUMENT: subcategory ${id} carries ${group.length} questions covering ${counts.size} of the ` +
            `${HACR_STEMS.length} stems` +
            (missing.length ? `, missing ${missing.length}` : '') +
            (repeated.length ? `, repeating ${repeated.join(', ')}` : '') +
            `. Every spine node must carry the same nine aspects: a projection weighting one subcategory's evidence the ` +
            `same as another's is only defensible while the two are measured identically.`,
        )
    }

    // C — TEN SUBCATEGORIES PER CATEGORY. What makes the spine 80 rather than 79.
    const perCategory = new Map()
    for (const [id] of bySub) {
      const code = id.split('_')[0]
      perCategory.set(code, (perCategory.get(code) ?? 0) + 1)
    }
    for (const [code, n] of [...perCategory].sort())
      if (n !== HACR_SUBCATEGORIES_PER_CATEGORY)
        fail(
          `HACR-INSTRUMENT: category code "${code.toUpperCase()}" holds ${n} subcategories, not ${HACR_SUBCATEGORIES_PER_CATEGORY}. ` +
            `The spine is 8 × ${HACR_SUBCATEGORIES_PER_CATEGORY}; an uneven category means one category's topics carry more ` +
            `crosswalk surface than another's for no reason a reader could see.`,
        )

    return {
      examined: qs.length,
      stems: observed.size,
      declaredStems: HACR_STEMS.length,
      subcategories: bySub.size,
      perSubcategory: HACR_STEMS.length,
      perCategory: HACR_SUBCATEGORIES_PER_CATEGORY,
    }
  },
}

// ── The framework crosswalk ─────────────────────────────────────────────────
/**
 * HAIW projects all FOUR frameworks onto its 80 HACR SUBCATEGORIES.
 *
 * FOUR, NOT TAIW'S THREE. DGI reaches 59% of itself on TACR — losing Decision
 * Rights, Accountabilities, the Data Governance Office and Data Stewards, which are
 * the four things DGI is — and 100% here, because HACR carries subcategories for
 * governance framework, stewardship, executive sponsorship and accountability.
 *
 * NOT the 8 categories: at that granularity "Data Governance & Standards" takes
 * 31–50% of every framework's weight, exactly as TACR's did, and every pairwise L1
 * still clears any floor. NOT the 108 HCF capabilities: see D-016 below, and
 * regardless, a capability spine would need the crosswalk authored against a
 * relation rather than against a topic taxonomy.
 *
 * The engine composition is NOT here. It is `src/haiw/projection.ts`, which the
 * report and any future scorecard will import, and this file drives that module
 * through `tsModules` rather than rebuilding it. TAIW's is still a rule-file
 * stand-in and moves in its own change; two copies is the drift these checks exist
 * to prevent.
 */
const HAIW_CROSSWALK_FRAMEWORKS = ['FW-01', 'FW-02', 'FW-03', 'FW-04']

const haiwSpine = (ctx) => ctx.ts?.projection?.hacrSpine(ctx.data.hacr ?? []) ?? []
const haiwOutcomes = (ctx, answers) => ctx.ts?.projection?.hacrSubcategoryOutcomes(ctx.data.hacr ?? [], answers) ?? null
const haiwEngine = (ctx) => (ctx.ts?.projection ? ctx.ts.projection.createHaiwProjection(ctx.data.hacr ?? []) : null)

/**
 * FRAMEWORK-REACH exceptions. EMPTY, and that is the MEASURED state: all 44 leaves
 * of all four frameworks carry at least one mapping.
 *
 * DM07 Document & Content Management — the one TAIW had to except, 0 of 640 TACR
 * questions — lands on `ii_document_exchange` here, because health runs on clinical
 * documents and HACR asks about them. The contrast is the point: an unmapped leaf
 * is a fact about the ASSESSMENT, not about the framework, and the two modules
 * disagree about DM07 for a reason a reader can check.
 *
 * See the note in `src/data/haiw/crosswalk.json` on why 100% reach across all four
 * is a property of the question bank's generation rather than evidence of depth,
 * and `HACR-INSTRUMENT` for the measurement behind that sentence.
 */
const HAIW_REACH_EXCEPTIONS = Object.freeze({})

/**
 * CROSSWALK-CONCENTRATION exceptions. EMPTY, and measured: DMBOK2 10.0%, DCAM 15.0%,
 * DGI 18.7%, COBIT2019 16.0% against a 25% ceiling.
 *
 * DGI'S 18.7% IS THE FINDING THIS MODULE EXISTS TO PRODUCE. On DGIW's eleven
 * pillars the same ten DGI leaves put 54.1% on P01 alone — a declared, stale-fails
 * exception over there. Here they spread across four subcategories. The framework
 * did not change and neither did its crosswalk's careful­ness; the SPINE did.
 */
const HAIW_CONCENTRATION_EXCEPTIONS = Object.freeze({})

const crosswalk = makeCrosswalkChecks({
  label: 'HAIW',
  frameworkIds: HAIW_CROSSWALK_FRAMEWORKS,
  entryIdPattern: /^CW-H-\d{3}$/,
  spineIdPattern: /^[a-z]{2}_[a-z0-9_]+$/,
  spineLabel: 'subcategory',
  spine: haiwSpine,
  entries: (ctx) => ctx.data.xw?.entries ?? [],
  frameworkData: (ctx) => ctx.shared('_spine').fw ?? {},
  // HACR carries no layer on any of its 720 questions — verified against the
  // dataset, not assumed. Declaring [] is what makes CROSSWALK-WEIGHT report that
  // its two retained-zero assertions did not run, rather than passing over nothing.
  layers: [],
  layerValues: null,
  /*
   * MEASURED, NOT COPIED FROM TAIW. Observed pairwise L1 at 80 subcategories is
   * 0.918–1.238; TAIW's at 35 sections was 0.883–1.035 against a 0.5 floor. 0.6
   * keeps the same protective ratio: roughly a third of the observed minimum could
   * be lost before this trips, which is a real authoring collapse rather than a
   * rounding drift. 0.15 — DGIW's, calibrated for 11 pillars — would be a floor
   * nothing here could fall through, and a floor that cannot fail is decoration.
   */
  distinctnessFloor: 0.6,
  /*
   * 25%, NOT TAIW'S 35%, AND THE FACTORY'S READABILITY ARGUMENT IS ONLY HALF OF IT.
   *
   * Above roughly a third a reader cannot tell the framework's view from one leaf's
   * score, and that is true at any spine size. But a ceiling also has to be
   * REACHABLE by a plausible authoring error, and at 80 nodes 35% is not: DMBOK2's
   * heaviest leaf carries 14% of the framework, DCAM's 15%, COBIT's APO14
   * sub-practices at most 7.7%, so three of the four frameworks would have to pile
   * several leaves onto one subcategory to get near it. Only DGI could — its G1
   * group is half the framework — which is exactly the shape that produced 54.1% on
   * DGIW's P01. 25% sits 1.34× above the observed maximum: protective for all four,
   * and it trips if governance is ever collapsed onto one node again.
   */
  concentrationCeiling: 0.25,
  concentrationExceptions: HAIW_CONCENTRATION_EXCEPTIONS,
  reachExceptions: HAIW_REACH_EXCEPTIONS,
  spineCoverage: {
    mode: 'report',
    /*
     * MEASURED, AND THE MEASUREMENT CONTRADICTED THE EXPECTATION. The premise going
     * in was that HACR is a data taxonomy throughout, so an unmapped subcategory
     * would be a real authoring gap rather than a domain mismatch. It is not.
     */
    reason:
      'Fourteen of HACR\'s 80 subcategories are reached by no data-management framework, and they are not an authoring ' +
      'gap: six of the ten Patient & Community Engagement subcategories (patient portals, mobile health, telehealth, ' +
      'shared decision making, social determinants, digital health equity), five of the ten Outcomes & Impact ones ' +
      '(patient experience, population health outcomes, research, health equity metrics, sustainability) and three ' +
      'workforce-culture ones (innovation culture, digital literacy, continuous learning). HACR IS NOT A DATA TAXONOMY ' +
      'THROUGHOUT — three of its eight categories describe health service delivery, which DMBOK, DCAM, DGI and COBIT do ' +
      'not speak to. TAIW reports for the same structural reason and a different domain one (customs operations); DGIW ' +
      'asserts, because its eleven pillars ARE the capability model and a pillar nothing maps really is evidence ' +
      'counting toward nothing.',
  },
  induced: (ctx, frameworkId) => haiwEngine(ctx)?.inducedSpineWeights(frameworkId) ?? null,
})

// ── PROJECTION-INVARIANT, HAIW ──────────────────────────────────────────────
/**
 * The same four properties DGIW and TAIW assert, over HACR's 80 subcategories and
 * through the REAL binding — `src/haiw/projection.ts`, not a reconstruction.
 *
 * That is the one structural difference from TAIW's version. TAIW's rule file
 * builds its own engine because no `src/taiw/projection.ts` exists yet, so its I1
 * comparison is against a composition the check itself wrote. Here the engine and
 * the independent outcomes both come out of the module a UI would import, so I1
 * compares what the projection USED against what production's own scoring function
 * computes — which is the comparison that means something.
 *
 * I4's second profile is the whole-subcategories-unanswered substitute, for the
 * reason TAIW needed one: HACR has no layers, so DGIW's `flat 3.0, core only`
 * profile degenerates and the renormalisation path would never be exercised.
 */
const EPS_H = 1e-9

const haiwProjectionInvariant = {
  code: 'PROJECTION-INVARIANT',
  run(ctx) {
    const { fail } = ctx
    const engine = haiwEngine(ctx)
    if (!engine) {
      fail(`could not build or load src/haiw/projection.ts — the invariants were NOT checked: ${ctx.tsLoadError ?? 'module unavailable'}`)
      return { examined: 0 }
    }
    const spine = engine ? haiwSpine(ctx) : []
    const allQ = (ctx.data.hacr ?? []).map((q) => q.id).sort()

    const constant = (v) => Object.fromEntries(allQ.map((id) => [id, { currentState: v, desiredState: 5 }]))
    // Deterministic, nobody-chose-it-by-hand, identical on every machine.
    const seeded = () => {
      let s = 20260802
      const out = {}
      for (const id of allQ) { s = (s * 1103515245 + 12345) % 2147483648; out[id] = { currentState: 1 + (s % 5), desiredState: 5 } }
      return out
    }
    const SEEDED = seeded()
    const byId = new Map((ctx.data.hacr ?? []).map((q) => [q.id, q]))
    const withoutSubcategories = (base, skip) =>
      Object.fromEntries(Object.entries(base).filter(([id]) => !skip.includes(subIdOf(byId.get(id) ?? { id, subcategory: '' }))))

    // Three subcategories carrying real crosswalk weight in all four frameworks,
    // so retained stays 1 while scored falls below it.
    const DROP = ['dg_data_quality_management', 'dg_data_governance_framework', 'dg_data_stewardship']

    const PROFILES = [
      { name: 'flat 3.0', answers: constant(3), flat: true },
      { name: 'all 1', answers: constant(1) },
      { name: 'all 5', answers: constant(5) },
      { name: 'seeded', answers: SEEDED },
      { name: `flat 3.0, ${DROP.join('/')} unanswered`, answers: withoutSubcategories(constant(3), DROP), flat: true },
      { name: `seeded, ${DROP.join('/')} unanswered`, answers: withoutSubcategories(SEEDED, DROP) },
    ]

    let invariantsRun = 0
    let renormalisationExercised = 0
    for (const profile of PROFILES) {
      const { answers } = profile
      const projections = engine.projectAll(answers)
      // Independently computed through production's own scoring, not read back out
      // of the projection. This is what makes I1 and I3 mean anything.
      const independent = new Map((haiwOutcomes(ctx, answers) ?? []).map((o) => [o.spineId, o]))

      for (const proj of projections) {
        const at = `${profile.name} / ${proj.code}`

        // I1 — DECOMPOSITION
        for (const dim of proj.dimensions) {
          if (!dim.isLeaf && dim.contributions.length > 0)
            fail(`I1 ${at}: parent ${dim.code} carries ${dim.contributions.length} subcategory contributions — projection is leaf-only`)
          if (dim.state !== 'scored') {
            if (dim.score !== null) fail(`I1 ${at}: ${dim.code} is ${dim.state} but carries score ${dim.score} — an unmeasured dimension must be null, never a number`)
            continue
          }
          if (!dim.isLeaf) continue
          const total = dim.contributions.reduce((s, c) => s + c.contribution, 0)
          if (Math.abs(total - dim.score) > EPS_H) fail(`I1 ${at}: ${dim.code} contributions sum to ${total} but score is ${dim.score}`)
          const wsum = dim.contributions.reduce((s, c) => s + c.weight, 0)
          if (Math.abs(wsum - 1) > EPS_H) fail(`I1 ${at}: ${dim.code} renormalised weights sum to ${wsum}, not 1`)
          for (const c of dim.contributions) {
            const truth = independent.get(c.spineId)
            if (!truth || truth.state !== 'scored') fail(`I1 ${at}: ${dim.code} contributes subcategory ${c.spineId}, which maturity.ts reports as ${truth?.state ?? 'absent'}`)
            else if (Math.abs(truth.score - c.spineScore) > EPS_H) fail(`I1 ${at}: ${dim.code} used ${c.spineScore} for ${c.spineId} but maturity.ts computes ${truth.score} — a second scoring path or a cached value`)
          }
          if (dim.scoredShare > dim.retainedShare + EPS_H) fail(`I1 ${at}: ${dim.code} scoredShare ${dim.scoredShare} exceeds retainedShare ${dim.retainedShare}`)
          if (dim.scoredShare < dim.retainedShare - EPS_H) renormalisationExercised++
        }

        // I2 — RECONCILIATION
        if (proj.state === 'scored') {
          const wsum = Object.values(proj.effectiveWeights).reduce((s, w) => s + w, 0)
          if (Math.abs(wsum - 1) > EPS_H) fail(`I2 ${at}: induced subcategory weights sum to ${wsum}, not 1 — the overall is not a weighted mean of anything`)
          let recon = 0
          for (const [spineId, w] of Object.entries(proj.effectiveWeights)) {
            if (w === 0) continue
            const truth = independent.get(spineId)
            if (!truth || truth.state !== 'scored') { fail(`I2 ${at}: subcategory ${spineId} carries weight ${w} but is ${truth?.state ?? 'absent'}`); continue }
            recon += w * truth.score
          }
          if (Math.abs(recon - proj.overall) > EPS_H) fail(`I2 ${at}: overall is ${proj.overall} but Σ W·score is ${recon} — the roll-up and the crosswalk disagree`)
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
        if (spread > EPS_H) fail(`I3 ${profile.name}: subcategory ${spineId} is used with ${values.length} different values across the frameworks, spread ${spread}`)
      }

      // I4 — FLAT PROFILE
      if (profile.flat) {
        const overalls = projections.map((p) => p.overall)
        for (const [i, o] of overalls.entries())
          if (o === null || Math.abs(o - 3) > EPS_H)
            fail(`I4 ${profile.name}: ${projections[i].code} overall is ${o}, not 3.0 — with every scored subcategory at exactly 3.0 any convex combination is 3.0, so a deviation is a maths error and almost always an unnormalised weight basis`)
        const spread = Math.max(...overalls) - Math.min(...overalls)
        if (spread > EPS_H) fail(`I4 ${profile.name}: the overalls spread by ${spread}, which must be 0 when every subcategory scores identically`)
      }
    }

    // The substitute profile has to actually exercise what the layer profile did.
    if (renormalisationExercised === 0)
      fail(
        `no profile produced scoredShare < retainedShare, so the renormalisation path was never exercised. DGIW gets this ` +
          `from its core-layer profile; HACR has no layers and relies on whole subcategories being unanswered instead. If ` +
          `the dropped subcategories stopped carrying crosswalk weight, this check quietly became weaker than DGIW's.`,
      )

    return { examined: invariantsRun, profiles: PROFILES.length, renormalisationExercised, spine: spine.length }
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
    xw: 'crosswalk.json',
  },

  /**
   * HAIW's own projection binding, and the shared category-scoring primitive.
   *
   * `projection.ts` is what the crosswalk classes and the invariants RUN — not a
   * reconstruction of it, which is what TAIW's rule file still has to do. It pulls
   * `frameworks/projection.ts`, `crosswalk.json` and `frameworks.json` in with it.
   * `maturity.ts` is a separate entry point on purpose: I1 compares the subcategory
   * scores the projection USED against scores computed from maturity.ts directly,
   * and sharing one bundle would make that comparison circular.
   */
  tsModules: { projection: 'src/haiw/projection.ts', maturity: 'src/scoring/maturity.ts' },
  /*
   * `src/haiw/report` joins the set in D5 stage E3 — see modules/taiw.mjs for the full
   * note on why declaring the directory is what makes the stage visible to the gate at
   * all. The generators are shared and declared by `_spine`; these are the bindings.
   */
  reportSources: [
    { rel: 'src/haiw/utils/healthReportGenerator.ts', kind: 'file' },
    { rel: 'src/haiw/report', kind: 'dir' },
  ],
  /*
   * PROVENANCE-COVERAGE, D5 stage F1 — see modules/dgiw.mjs for the full note.
   * HealthFrameworks.tsx and HealthReportGenerator.tsx are where `saveReport`
   * is actually called with the documents `src/haiw/report/*.ts` builds.
   */
  provenanceSources: [{ rel: 'src/haiw/components', kind: 'dir' }],
  /*
   * `MR-HAIW-GAP` -> `MR-HAIW-REGISTER`, D5 stage E2. The word "gap" was true of the
   * arithmetic and false of the data: the gap was computed from `capabilityLinks`,
   * which is a modular counter (D-016). All three modules now ship a register.
   *
   * `MR-HAIW-ALIGNMENT` and `MR-HAIW-SCORECARD` added in D5 stage E3 — `MR-` for the
   * reason modules/taiw.mjs records. ALIGNMENT produces FOUR documents where TAIW's
   * produces three, because DGI reaches 100% of itself on HACR and 59% on TACR; the
   * contrast is a finding and `HAIW_CAVEATS` states it on both deliverables.
   */
  artefactIds: [
    'MR-HAIW-MATURITY',
    'MR-HAIW-REGISTER',
    'MR-HAIW-ROADMAP',
    'MR-HAIW-ALIGNMENT',
    'MR-HAIW-SCORECARD',
  ],

  /** Declared run order — this is the order findings print in. */
  checks: [
    categoryUniverse,
    hacrShape,
    hacrUnique,
    hacrCategoryMap,
    hacrInstrument,
    hcfShape,
    hcfLink,
    hcfSynthetic,
    hcfFk,
    haiwWeight,
    // The crosswalk seven, in dependency order: the spine must resolve before a
    // mapping into it means anything, and the two vector classes need the engine.
    crosswalk.spineUniverse,
    crosswalk.crosswalkShape,
    crosswalk.crosswalkWeight,
    crosswalk.crosswalkOrphan,
    crosswalk.frameworkReach,
    crosswalk.crosswalkConcentration,
    crosswalk.crosswalkDistinctness,
    haiwProjectionInvariant,
    benchmarkRollup,
  ],

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
    const inst = r['HACR-INSTRUMENT'] ?? {}
    // THE INSTRUMENT DISCLOSURE, ON EVERY BUILD. All four frameworks reach 100% of
    // themselves on this spine; this line is why that is not evidence of depth.
    out.push(
      `  HACR-INSTRUMENT ${inst.subcategories ?? 0} subcategories × ${inst.perSubcategory ?? 0} questions` +
        `, built from ${inst.stems ?? 0} template stems over the whole bank` +
        ` — every subcategory measured identically, none more deeply than any other`,
    )
    const link = r['HCF-LINK'] ?? {}
    out.push(
      `HCF ${link.capabilities ?? 0} capabilities  ${link.examined ?? 0} capabilityLinks` +
        `  ${link.reached ?? 0} of ${link.capabilities ?? 0} reached by at least one question` +
        ` — the relation that lets only HAIW score a capability`,
    )
    // Printed, never asserted — the TCF-COVERAGE precedent. Fixing this changes
    // page 13, the gap CSV and five baselines, and the honest fix may be to stop
    // emitting a per-capability score at all. That is a content decision with its
    // own walk, not something to slip into a crosswalk stage; what belongs here is
    // that nobody can look at a HAIW build again without seeing it.
    if (link.positional)
      out.push(
        `  capabilityLinks is POSITIONAL: link[0] === HCF-(((i+1) mod ${link.capabilities}) + 1) for ` +
          `${link.positional} of ${link.examined} — a counter over file order, not an authored relation. D-016.`,
      )
    out.push(`  HCF-FK ${(r['HCF-FK'] ?? {}).examined ?? 0} cross-file references resolved`)
    out.push(`  ${categoryUniverseSummary(r['CATEGORY-UNIVERSE'], 'HACR', '    ')}`)
    const br = r['BENCHMARK-ROLLUP'] ?? {}
    out.push(
      `  DEFAULT_BENCHMARKS ${br.examined ?? 0} blocks over ${br.categories ?? 0} categories` +
        `${br.blocks?.length ? ` (${br.blocks.join(', ')})` : ''} — no "Overall Assessment" key, which regAvg depends on`,
    )
    for (const l of crosswalkSummary(r, { label: 'HAIW', spineLabel: 'subcategory', spineTotal: (r['SPINE-UNIVERSE'] ?? {}).examined })) out.push(`  ${l}`)
    const pi = r['PROJECTION-INVARIANT'] ?? {}
    out.push(
      `  PROJECTION-INVARIANT ${pi.examined ?? 0} framework projections over ${pi.profiles ?? 0} deterministic profiles ` +
        `(I1 decomposition, I2 reconciliation, I3 intersection, I4 flat) through src/haiw/projection.ts` +
        ` — renormalisation exercised ${pi.renormalisationExercised ?? 0} times`,
    )
    return out
  },
}
