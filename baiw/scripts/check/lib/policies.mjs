/**
 * DGIW — the policy set (AR-11). Schema, two check classes, and the row lists the
 * four existing row-level classes need.
 *
 * ─── READ THIS FIRST: TWO OF THE CLASSES HERE DO NOT RUN ───────────────────
 *
 * `src/dgiw/data/policies.json` DOES NOT EXIST. AR-11 is `authored` in the
 * register and stays there — one policy is not the artefact, and flipping it to
 * `derived` would let ARTEFACT-EVIDENCE permit a generator over a set nobody has
 * written.
 *
 * So this file ships in two halves, and the halves have different statuses:
 *
 *   LIVE   `policyLayeredRows`, `policyIds`, `policyForeignKeys`,
 *          `policyOwnerRefs`, `policySummary` — imported by modules/dgiw.mjs and
 *          called on every build. They contribute ZERO rows today, which costs
 *          nothing because LAYER, UNIQUE, FK and OWNER-UNRESOLVED each examine
 *          hundreds of other rows and cannot go VACUOUS on that account. The day
 *          `policies.json` is declared they cover it with no further edit, which
 *          is the whole point: the remaining policies arrive as CONTENT, not as
 *          four more schema decisions.
 *
 *   INERT  `policyEnforcement` and `policyAuthored` are NOT in dgiw.mjs's
 *          `checks` array. A class that examines nothing and reports nothing is a
 *          VACUOUS failure, and the escape hatch — `mayBeEmpty: '<reason>'` —
 *          would be spent on the two classes whose entire subject is whether the
 *          set is real. Nothing in this repo declares `mayBeEmpty` today and
 *          these are the wrong two to be first.
 *
 * WIRING, when the policies land. Three lines in `modules/dgiw.mjs`:
 *
 *   1. `datasets:` gains        policies: 'policies.json',
 *   2. `checks:` gains          policyEnforcement, policyAuthored,
 *   3. the import at the top gains those two names.
 *
 * And in `check/selftest.mjs`, spread `POLICY_SELFTEST_ROWS` into `MUTATIONS`.
 * The eight rows are declared at the bottom of this file, in that array's exact
 * shape, so wiring them is one spread rather than eight new mutations written
 * from memory a phase later.
 *
 * THE INERT STATE IS PRINTED, NOT LEFT TO BE NOTICED. `policySummary()` emits a
 * POLICY-SET line on every build saying the dataset is absent and naming the two
 * classes that are therefore not running. That is the REGISTRY line's discipline
 * — "not covered by the gate" as a stated fact rather than an absence you would
 * have to spot — applied one level down.
 *
 * A note on the risk this does NOT carry. Dead code that fabricates on repair is
 * the D-008 shape and is worse than code that is merely wrong; that is why
 * `TCFCapabilityNavigator.tsx` was removed rather than fixed. These are CHECKS.
 * The failure direction of a check that starts running is a build that fails
 * loudly, never a number that reaches a client. Wiring these on cannot fabricate
 * anything; at worst it rejects a policy set someone has to look at.
 */
import { unique } from './assert.mjs'

/** Zero-padded fixed width, so code-unit order is numeric order. */
export const POLICY_ID = /^POL-\d{2}$/

/** The closed vocabulary. Mirrors `EnforcementKind` in src/dgiw/types.ts. */
export const ENFORCEMENT_KINDS = ['dqRule', 'gate', 'activity', 'external']

/**
 * WHAT EACH KIND'S `ref` IS RESOLVED AGAINST — one namespace per kind, declared.
 *
 * The alternative, and the reason this table exists rather than a union: the id
 * namespaces in this module OVERLAP. `W1` is a wave in `implementationPlan.json`
 * and a wedge in `positioning.json`; `G7` is a gate and nothing else, but only by
 * luck. A check of the form "does this ref appear anywhere in the module" would
 * accept `{ kind: 'dqRule', ref: 'W1' }` on the strength of a wedge, and the
 * enforcement point would name something that cannot enforce anything.
 *
 * `activity` resolves against PROGRAM STEP ids (`F4-S3`), not against
 * `operatingModel.raci[].activity`. The RACI rows carry no id — they are free
 * text — so nothing could reference one even if it wanted to, and AR-12's
 * register note already names a step (`F4-S3`) and a gate (`G7`) as the two
 * things the policy-to-enforcement-point mapping would join.
 *
 * `external` deliberately has NO namespace. It is a control outside this
 * workbench and resolving it is not possible here; it carries a mandatory `note`
 * instead, which is branch four.
 */
const REF_NAMESPACES = Object.freeze({
  dqRule: {
    label: 'a dqRules.json rule id',
    ids: (ctx) => new Set(rowsOf(ctx.data.rules).map((r) => r.id)),
  },
  gate: {
    label: 'an operatingModel.gates id',
    ids: (ctx) => new Set((ctx.data.om?.gates ?? []).map((g) => g.id)),
  },
  activity: {
    label: 'a programSetup flow step id',
    ids: (ctx) => new Set((ctx.data.prog?.flows ?? []).flatMap((f) => f.steps.map((s) => s.id))),
  },
  external: null,
})

/** A dataset that may be a bare array or an object wrapping one. */
const rowsOf = (v) => (Array.isArray(v) ? v : Array.isArray(v?.policies) ? v.policies : Array.isArray(v?.rules) ? v.rules : [])

/**
 * The policy rows, or `[]` when the dataset is not declared.
 *
 * The two states are DIFFERENT and only one of them is silent. Undeclared is the
 * state today and is reported by `policySummary`. Declared-but-unreadable throws,
 * which `check.mjs`'s runner catches and reports under the calling check's own
 * code as "the check threw ... this is unchecked, not passing" — loud, and
 * attributed. A declared dataset that quietly degraded to zero rows is the silent
 * shrink `REPORT-SOURCES` and `REGISTRY` both exist to refuse.
 */
export const policyRows = (ctx) => {
  const raw = ctx.data.policies
  if (raw === undefined) return []
  const rows = rowsOf(raw)
  if (!Array.isArray(rows) || (rows.length === 0 && !Array.isArray(raw) && !Array.isArray(raw?.policies)))
    throw new Error(
      'policies.json is declared but carries neither a top-level array nor a `policies` array — ' +
        'an unreadable dataset is not an empty one, and passing over it would be indistinguishable from passing over a real set',
    )
  return rows
}

/** True when `policies.json` is a declared dataset, whatever it contains. */
export const policySetDeclared = (ctx) => ctx.data.policies !== undefined

/* ── the four row-level extensions ──────────────────────────────────────────
 *
 * Each is one spread at a declared point in modules/dgiw.mjs. They are here
 * rather than inline there so that the policy schema — what carries a layer, what
 * is unique, what points where, who owns one — is stated in ONE place and read
 * from it, which is the same reason `hacr.ts` exists on the application side.
 */

/** LAYER — joins the declared layered-rows list. */
export const policyLayeredRows = (ctx) => ['policies', policyRows(ctx)]

/** UNIQUE — the code is a PARAMETER, never hardcoded here. See assert.mjs. */
export const policyUnique = (fail, code, ctx) => unique(fail, code, 'policy', policyRows(ctx).map((p) => p.id))

/**
 * FK — `pillarId` into `pillars.json`, `principleRef` into the seven principles.
 *
 * `principleRef` is why `operatingModel.principles` gained PR1..PR7. The seven
 * were positional before D6: citing one meant citing its index, which moves the
 * day an eighth is written between two existing ones, and every policy that cited
 * the old index would then discharge a different principle without changing.
 */
export const policyForeignKeys = (ctx, fail) => {
  const rows = policyRows(ctx)
  const { pillarIds } = ctx.state
  const principleIds = new Set((ctx.data.om?.principles ?? []).map((p) => p.id))
  for (const p of rows) {
    if (!pillarIds.has(p.pillarId)) fail(`policy ${p.id} -> pillar ${p.pillarId}`)
    if (!principleIds.has(p.principleRef))
      fail(`policy ${p.id} -> principle ${p.principleRef} is not one of operatingModel.principles (${[...principleIds].join(', ') || 'none carry an id'})`)
  }
  return rows.length * 2
}

/** OWNER-UNRESOLVED / OWNER-COMPOUND — the same `[where, record, field]` triple. */
export const policyOwnerRefs = (ctx) => policyRows(ctx).map((p) => [`policy ${p.id}`, p, 'owner'])

/* ── POLICY-ENFORCEMENT ─────────────────────────────────────────────────────
 *
 * FIVE BRANCHES, AND THE FIFTH IS THE ONE THAT REFUSES TO ASSERT.
 *
 * PR5 "Enforcement over publication" says a policy naming no enforcement point is
 * not adopted, and it is tempting to make that a build failure. It must not be.
 * Gate G7 "Enforcement point identified per policy" is `blocking: false`, and its
 * authored test reads: "Policies with no enforcement point are FLAGGED AT
 * COUNCIL." A class that failed the build on an empty `enforcedBy` would assert
 * something the operating model explicitly permits, and the gate and the gate's
 * own guard would then disagree about the same policy on the same day.
 *
 * So an ABSENT `enforcedBy` fails — the field is not optional, and a policy that
 * never had one cannot be flagged at a council that reads the field — while an
 * EMPTY one is a STATE. It is counted, printed with its denominator, and left
 * alone. That is the `not-assessed` / `not-applicable` distinction one level out:
 * "no enforcement point has been chosen yet" and "the field was forgotten" look
 * identical in a length check and mean opposite things.
 *
 * ─── WHAT THIS CLASS CANNOT SEE, AND IT IS PRINTED BESIDE THE COUNT ────────
 *
 * A ref that resolves is not a relation that is real. `HCF-LINK` asserted that
 * every `capabilityLinks` entry resolved and that every capability was reached,
 * and D-016 found the field was `'HCF-' + pad(((i + 1) % 108) + 1)` — a counter,
 * which satisfies a resolution check BETTER than a considered mapping would,
 * because a counter never points at anything missing. The same trap is one field
 * over here: twelve policies each pointing at `DQ-001`..`DQ-012` in file order
 * would pass every branch below. That sentence goes on the summary line rather
 * than into a comment nobody reads, for the same reason HACR-INSTRUMENT's
 * disclosure does.
 */
export const policyEnforcement = {
  code: 'POLICY-ENFORCEMENT',
  run(ctx) {
    const { fail } = ctx
    const rows = policyRows(ctx)
    const namespaces = Object.fromEntries(
      Object.entries(REF_NAMESPACES).map(([k, v]) => [k, v ? v.ids(ctx) : null]),
    )
    let examined = 0
    const unenforced = []
    const byKind = Object.fromEntries(ENFORCEMENT_KINDS.map((k) => [k, 0]))

    for (const p of rows) {
      examined++

      // BRANCH 1 — the field is not optional.
      if (!Array.isArray(p.enforcedBy)) {
        fail(
          `policy ${p.id} "${p.title}" declares no enforcedBy array (got ${JSON.stringify(p.enforcedBy)}) — ` +
            `PR5 makes an enforcement point the condition of adoption and G7 flags the ones that have none at council. ` +
            `An ABSENT field cannot be flagged: it is indistinguishable from a policy nobody has considered yet. ` +
            `Declare \`enforcedBy: []\` to state that none has been chosen — that is a legitimate state and this class counts it`,
        )
        continue
      }
      if (p.enforcedBy.length === 0) {
        unenforced.push(p.id)
        continue
      }

      for (const [i, e] of p.enforcedBy.entries()) {
        examined++
        const where = `policy ${p.id} enforcedBy[${i}]`

        // BRANCH 2 — the kind is from the closed set.
        if (!ENFORCEMENT_KINDS.includes(e?.kind)) {
          fail(`${where} has kind ${JSON.stringify(e?.kind)} — expected one of ${ENFORCEMENT_KINDS.join(', ')}`)
          continue
        }
        byKind[e.kind]++

        // BRANCH 4 — external resolves against nothing, so the note is the evidence.
        if (e.kind === 'external') {
          if (typeof e.note !== 'string' || e.note.trim() === '')
            fail(
              `${where} is external and carries no note — an external enforcement point resolves against no dataset in this repo, ` +
                `so the note is the ONLY evidence that it exists. Without it the entry asserts that the policy is enforced somewhere ` +
                `and gives a reader nothing to check`,
            )
          continue
        }

        // BRANCH 3 — the ref resolves THROUGH its kind.
        const ids = namespaces[e.kind]
        if (typeof e.ref !== 'string' || !ids.has(e.ref)) {
          // Name the namespace it DOES resolve in, when there is one. "G7 is not a
          // dqRule id, it is a gate id" sends the reader to the kind; a bare "does
          // not resolve" sends them to the ref, which is the wrong half.
          const elsewhere = ENFORCEMENT_KINDS.filter((k) => namespaces[k]?.has(e.ref))
          fail(
            `${where} declares kind ${e.kind} and ref ${JSON.stringify(e.ref)}, which is not ${REF_NAMESPACES[e.kind].label}` +
              (elsewhere.length
                ? ` — it IS ${elsewhere.map((k) => REF_NAMESPACES[k].label).join(' and ')}, so the kind is wrong rather than the ref`
                : ` and resolves under no other kind either`) +
              `. A ref is resolved through its kind and never against a union of every id in the module: the namespaces overlap ` +
              `(W1 is both a wave and a positioning wedge), so a bare id is not a reference to anything in particular`,
          )
        }
      }
    }

    return { examined, policies: rows.length, unenforced, byKind }
  },
}

/* ── POLICY-AUTHORED ────────────────────────────────────────────────────────
 *
 * THREE BRANCHES OVER THE STATEMENT TEXT, AND A REPORTED FOURTH THING.
 *
 * ─── WHAT THIS IS FOR, STATED HONESTLY ─────────────────────────────────────
 *
 * It cannot tell authored from generated. Twelve well-varied generated policies
 * pass every branch below, and that is not a defect in the thresholds — it is
 * what a static text statistic can do. What it CAN tell is stem-collapsed from
 * not: whether the set is N restatements of one template with the subject swapped,
 * which is what HACR turned out to be (720 questions, nine stems) and what nobody
 * measured for two phases because `retainedShare` and FRAMEWORK-REACH both count
 * leaves rather than evidence.
 *
 * These go to a bank's legal head. The gate is not the reviewer here; a human is.
 *
 * ─── THE THRESHOLDS ARE DECLARED FROM A MEASUREMENT, NOT COMPUTED ──────────
 *
 * Measured over every comparable authored prose corpus in DGIW, plus HACR as the
 * known-templated control (`open%` = share of distinct first-four-word openings,
 * `lenCV` = coefficient of variation of character length, `stem%` = share still
 * distinct once each item's own label words are struck out of its body):
 *
 *   corpus                                 n   open%   lenCV   stem%
 *   operatingModel.principles.statement    7   100.0   0.124   100.0
 *   operatingModel.principles.rationale    7   100.0   0.267   100.0
 *   operatingModel.gates.test             11   100.0   0.196   100.0
 *   operatingModel.roles.failureMode      10   100.0   0.083   100.0
 *   pillars.buyerPain                     11   100.0   0.082   100.0
 *   pillars.description                   11   100.0   0.089   100.0
 *   dqRules.remediation                  115    96.5   0.129    99.1
 *   programSetup.checklist.item           52   100.0   0.167   100.0
 *   plan.waves.exitCriteria                7   100.0   0.142   100.0
 *   ladder.purpose                         4   100.0   0.195   100.0
 *   positioning.wedges.pain                6   100.0   0.056   100.0
 *   positioning.failureModes.symptom       7   100.0   0.087   100.0
 *   ── CONTROL ─────────────────────────────────────────────────────────────
 *   HACR questions                       720     0.1   0.064     2.1
 *
 * The floors below are set from the two `principles` rows specifically, because a
 * policy set is the same UNIT as a principle set: eight to twelve short authored
 * governance statements, each with a title. They are not a general law about
 * authored prose and this file will not pretend otherwise — three of the corpora
 * above sit below the length-CV floor, and `positioning.wedges.pain` at 0.056 is
 * LOWER than the templated HACR control at 0.064. Copying a neighbour's number is
 * how a guard becomes decoration, which is the crosswalk parameters' lesson; so
 * is copying a number across a corpus it was not measured on.
 *
 * READ THE THREE AS UNEQUAL. `stem%` is the load-bearing one: 100.0 against 2.1
 * is a 47-fold separation and it is the measurement that names the defect.
 * `open%` is a weaker version of the same idea. `lenCV` is the WEAKEST — the
 * control is not even the minimum — and it is kept because a set generated from
 * one template is uniform in length in a way the other two can miss when the
 * template has a long variable slot. Do not present it as the signal.
 */

/** Share of DISTINCT first-four-word openings. Observed 100.0% on both principle corpora. */
const DISTINCT_OPENING_FLOOR = 0.97

/**
 * Coefficient of variation of statement length. Observed 0.124 (statements) and
 * 0.267 (rationales); the floor sits just under the lower of the two.
 */
const LENGTH_CV_FLOOR = 0.12

/**
 * Share still distinct after each policy's own title words are struck from its
 * statement. Observed 100.0% on every authored corpus, 2.1% on HACR.
 *
 * 1.0 is the only defensible floor: anything less accepts that two policies in a
 * set of twelve say the same thing once you remove what they are about, which is
 * the whole defect.
 */
const STEM_REDUCTION_FLOOR = 1.0

/**
 * Below this, the LENGTH-CV branch reports instead of asserting, and SAYS SO.
 *
 * A coefficient of variation over three items is noise, and over one it is
 * exactly 0 — so a class that asserted it unconditionally would reject the first
 * policy ever written, on the day it was written, for being alone. The other two
 * branches are pairwise rather than distributional and hold from n = 2.
 *
 * A branch that does not run must say that it did not. `CROSSWALK-WEIGHT` reports
 * when its layer list is empty on a layerless module for the same reason: a
 * silently skipped assertion and a passing one print identically.
 */
const CV_MIN_N = 4

const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)

export const policyAuthored = {
  code: 'POLICY-AUTHORED',
  run(ctx) {
    const { fail, failAs } = ctx
    const rows = policyRows(ctx)

    /*
     * The instrument's precondition, and it reports under SHAPE rather than under
     * this class's own code. A missing statement is a shape defect that
     * `enumsAndShapes` already owns the vocabulary for, and folding it in here
     * would give POLICY-AUTHORED a fourth fail() path that no selftest row
     * isolates — the branch-masking shape D5 stage H found in selftest.mjs itself.
     */
    const usable = []
    for (const p of rows) {
      if (typeof p.statement !== 'string' || p.statement.trim() === '' || typeof p.title !== 'string')
        failAs('SHAPE', `policy ${p.id} has no usable title/statement pair, so its authoring cannot be measured at all`)
      else usable.push(p)
    }
    if (usable.length === 0) return { examined: rows.length, measured: 0 }

    const statements = usable.map((p) => p.statement)

    // BRANCH 1 — distinct openings.
    const openings = statements.map((s) => words(s).slice(0, 4).join(' '))
    const openingShare = new Set(openings).size / openings.length
    if (openingShare < DISTINCT_OPENING_FLOOR) {
      const dupes = openings.filter((o, i) => openings.indexOf(o) !== i)
      fail(
        `${(openingShare * 100).toFixed(1)}% of policy statements open with a distinct first four words, below the declared floor of ` +
          `${(DISTINCT_OPENING_FLOOR * 100).toFixed(0)}% — repeated openings such as ${[...new Set(dupes)].slice(0, 3).map((d) => JSON.stringify(d)).join(', ')} ` +
          `are the first thing a set restated from one template shows. Measured 100.0% on operatingModel.principles`,
      )
    }

    // BRANCH 2 — length spread. Distributional, so it needs a population.
    const mean = statements.reduce((s, t) => s + t.length, 0) / statements.length
    const cv = Math.sqrt(statements.reduce((s, t) => s + (t.length - mean) ** 2, 0) / statements.length) / mean
    const cvAsserted = usable.length >= CV_MIN_N
    if (cvAsserted && cv < LENGTH_CV_FLOOR) {
      fail(
        `policy statement length has a coefficient of variation of ${cv.toFixed(3)}, below the declared floor of ${LENGTH_CV_FLOOR} — ` +
          `statements of near-identical length are what one template with a swapped subject produces. ` +
          `Measured 0.124 on operatingModel.principles.statement, 0.267 on the rationales. ` +
          `This is the WEAKEST of the three branches — positioning.wedges.pain is authored and sits at 0.056 — so read it beside the stem reduction, not instead of it`,
      )
    }

    // BRANCH 3 — stem reduction. The load-bearing one.
    const stems = usable.map((p) => {
      const kill = new Set(words(p.title))
      return words(p.statement).filter((w) => !kill.has(w)).join(' ')
    })
    const stemShare = new Set(stems).size / stems.length
    if (stemShare < STEM_REDUCTION_FLOOR) {
      const collapsed = stems.filter((s, i) => stems.indexOf(s) !== i)
      fail(
        `${(stemShare * 100).toFixed(1)}% of policy statements remain distinct once each policy's own title words are struck out, ` +
          `below the declared floor of ${(STEM_REDUCTION_FLOOR * 100).toFixed(0)}% — ${new Set(collapsed).size} statement(s) collapse onto a sibling, ` +
          `which means the set says one thing about several subjects rather than several things. This is HACR's defect exactly: strip the ` +
          `subcategory name out of 720 questions and nine forms remain (2.1%), and nothing in the gate could see it for two phases. ` +
          `Measured 100.0% on every authored corpus in this module`,
      )
    }

    /*
     * REPORTED, NEVER FAILED — how the policies distribute over principles and
     * pillars, as a raw vector.
     *
     * Lumpiness is the signature of a set written by walking a list rather than by
     * answering "what does this bank need governed": twelve policies spread 1-1-1
     * across twelve principles reads very differently from ten on one principle
     * and one each on two others. `programSetup.checklist` per pillar already
     * reads [1,2,2,3,4,5,5,6,8,16] and that is a HEALTHY authored set — the shape
     * follows the work, not the taxonomy.
     *
     * Which is exactly why this cannot be a failure. A set that happens to be even
     * is possible, and forbidding it would be fitting the rule to the sample —
     * `HAIW-WEIGHT`'s `> 0` mistake in the other direction.
     */
    const vector = (key) => {
      const m = new Map()
      for (const p of rows) m.set(p[key], (m.get(p[key]) ?? 0) + 1)
      return [...m.values()].sort((a, b) => a - b)
    }

    return {
      examined: rows.length,
      measured: usable.length,
      openingShare,
      cv,
      cvAsserted,
      stemShare,
      perPrinciple: vector('principleRef'),
      perPillar: vector('pillarId'),
    }
  },
}

/* ── the summary lines ──────────────────────────────────────────────────────
 *
 * Called by modules/dgiw.mjs on every build, in BOTH states. The undeclared state
 * prints too: a gate that is not running is a fact that has to be stated, not an
 * absence someone has to notice — REGISTRY prints `coe 0, alm 0` for the same
 * reason.
 */
export const policySummary = (ctx) => {
  if (!policySetDeclared(ctx))
    return [
      `POLICY-SET not declared — src/dgiw/data/policies.json does not exist, so DGIW carries no policy set and AR-11 stays \`authored\``,
      `  LAYER, UNIQUE, FK and OWNER-UNRESOLVED carry the policy extension and examined 0 policies. POLICY-ENFORCEMENT and`,
      `  POLICY-AUTHORED are written in check/lib/policies.mjs and are deliberately NOT in the checks array: a class over an`,
      `  empty set is VACUOUS, and mayBeEmpty would be spent on the two classes whose subject is whether the set is real.`,
      `  Wiring is three lines and they are named in that file's header.`,
    ]

  const rows = policyRows(ctx)
  const pe = ctx.results['POLICY-ENFORCEMENT']
  const pa = ctx.results['POLICY-AUTHORED']
  const out = [`POLICY-SET ${rows.length} policies (core ${rows.filter((p) => p.layer === 'core').length} / banking ${rows.filter((p) => p.layer === 'banking').length})`]

  if (pe) {
    const kinds = Object.entries(pe.byKind).map(([k, n]) => `${k} ${n}`).join(', ')
    out.push(
      `  POLICY-ENFORCEMENT ${pe.policies - pe.unenforced.length} of ${pe.policies} policies name an enforcement point (${kinds})` +
        `${pe.unenforced.length ? `; ${pe.unenforced.join(', ')} name none — G7 is blocking:false and flags those at council, so this is REPORTED, not failed` : ''}`,
    )
    out.push(
      `    a ref that RESOLVES is not a relation that is REAL — a counter would satisfy this class better than a considered mapping,` +
        ` because a counter never points at anything missing. That is D-016 one field over; read the mapping, do not trust the count`,
    )
  }

  if (pa?.measured) {
    out.push(
      `  POLICY-AUTHORED openings ${(pa.openingShare * 100).toFixed(1)}% distinct (floor ${(DISTINCT_OPENING_FLOOR * 100).toFixed(0)}%)` +
        `  length CV ${pa.cv.toFixed(3)} (floor ${LENGTH_CV_FLOOR}${pa.cvAsserted ? '' : `, NOT ASSERTED — n=${pa.measured} is below ${CV_MIN_N}`})` +
        `  stem reduction ${(pa.stemShare * 100).toFixed(1)}% (floor ${(STEM_REDUCTION_FLOOR * 100).toFixed(0)}%)`,
    )
    out.push(
      `    per principle ${JSON.stringify(pa.perPrinciple)}  per pillar ${JSON.stringify(pa.perPillar)}` +
        ` — REPORTED, never failed. checklist per pillar already reads [1,2,2,3,4,5,5,6,8,16] and that is a healthy authored set:` +
        ` the shape follows the work, not the taxonomy. A set that happens to be even is possible`,
    )
    out.push(
      `    this class cannot tell authored from generated — twelve well-varied generated policies pass every branch.` +
        ` It tells stem-collapsed from not. These go to a bank's legal head; the reviewer is a human`,
    )
  }
  return out
}

/* ── selftest rows ──────────────────────────────────────────────────────────
 *
 * EIGHT ROWS, EACH ISOLATING ONE BRANCH. Not runnable until the two classes are
 * in dgiw.mjs's `checks` array and `policies.json` exists — spread this into
 * `MUTATIONS` in check/selftest.mjs in the same commit that wires them.
 *
 * The isolation matters more than the count. Corrupting one policy record trips
 * three of these at once and proves nothing about which assertion caught it —
 * that is `HACR-INSTRUMENT`'s lesson inside a single class, and D5 stage H found
 * the same shape in selftest's own verdict, where 35 of 93 rows shared a code
 * with a sibling and a dead one exited 0 behind it. Every row below targets a
 * branch no other row reaches.
 *
 * Note what is NOT here: a row for the G7 branch. It reports and never fails, so
 * there is no code to trip. A mutation that emptied every `enforcedBy` would
 * produce a green build and a changed summary line, which is the correct
 * behaviour and is not something this harness can assert. `drive:dashboards` and
 * `geometry.mjs` ship under the same contract — a human reads the line.
 */
export const POLICY_SELFTEST_ROWS = [
  {
    code: 'POLICY-ENFORCEMENT',
    what: 'a policy with no enforcedBy field at all — absent, not empty',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => { delete (d.policies ?? d)[0].enforcedBy }),
  },
  {
    code: 'POLICY-ENFORCEMENT',
    what: 'an enforcement point with a kind outside the closed set',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => { (d.policies ?? d)[0].enforcedBy[0].kind = 'training' }),
  },
  {
    code: 'POLICY-ENFORCEMENT',
    what: 'a ref that resolves in another namespace but not through its own kind — the W1 shape',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => {
      const e = (d.policies ?? d)[0].enforcedBy[0]
      e.kind = 'dqRule'
      e.ref = 'G7' // a real gate id, and not a rule id
    }),
  },
  {
    code: 'POLICY-ENFORCEMENT',
    what: 'an external enforcement point carrying no note — the only evidence it has',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => {
      (d.policies ?? d)[0].enforcedBy[0] = { kind: 'external', ref: 'DLP suite', note: '' }
    }),
  },
  {
    code: 'POLICY-AUTHORED',
    what: 'two statements sharing their first four words — openings only',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => {
      const rows = d.policies ?? d
      const head = rows[0].statement.split(/\s+/).slice(0, 4).join(' ')
      const tail = rows[1].statement.split(/\s+/).slice(4).join(' ')
      // Keeps length and stem distinct: only the opening collides.
      rows[1].statement = `${head} ${tail}`
    }),
  },
  {
    code: 'POLICY-AUTHORED',
    what: 'every statement padded to one length — length CV only',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => {
      const rows = d.policies ?? d
      const width = Math.max(...rows.map((p) => p.statement.length)) + 8
      // Pad with the policy's own id so openings and stems both stay distinct.
      for (const p of rows) p.statement = p.statement.padEnd(width, ` ${p.id}`)
    }),
  },
  {
    code: 'POLICY-AUTHORED',
    what: 'two statements identical once their own titles are struck out — stem reduction only',
    touches: ['src/dgiw/data/policies.json'],
    /*
     * ISOLATION IS THE WHOLE POINT OF THIS ROW AND THE FIRST VERSION DID NOT HAVE
     * IT. `rows[1].statement = rows[0].statement.replace(title0, title1)` looks
     * like a stem collision and is an OPENING collision: the title is not at the
     * head of the statement, so both statements still begin with the same four
     * words and branch 1 fires first. The row reported TRIPPED under
     * POLICY-AUTHORED — its own code, shared with two siblings — while the branch
     * it exists for was never reached. Caught by reading the finding text rather
     * than the code, which is precisely what D5 stage H found selftest's verdict
     * could not do.
     *
     * The construction below gives each statement its OWN title at the head, so
     * the openings differ, and repeats one title so the lengths differ. Both
     * bodies are the same words drawn from a THIRD policy's statement with every
     * word either title would strike removed — so after stem reduction the two
     * collapse onto each other and nothing else moves. No new prose: the body is
     * text already in the file.
     */
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => {
      const rows = d.policies ?? d
      const w = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
      const kill = new Set([...w(rows[0].title), ...w(rows[1].title)])
      const body = w(rows[2].statement).filter((x) => !kill.has(x)).join(' ')
      rows[0].statement = `${rows[0].title} ${body}`
      rows[1].statement = `${rows[1].title} ${rows[1].title} ${body}`
    }),
  },
  {
    code: 'SHAPE',
    what: 'a policy with no statement, so its authoring cannot be measured at all',
    touches: ['src/dgiw/data/policies.json'],
    apply: (h) => h.json('src/dgiw/data/policies.json', (d) => { (d.policies ?? d)[0].statement = '' }),
  },
]
