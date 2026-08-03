/**
 * The caveats that must travel with every framework figure, in the words every
 * surface uses.
 *
 * ─── WHY THIS IS SUITE-LEVEL AND PARAMETERISED ─────────────────────────────
 *
 * `src/dgiw/report/frameworkNotes.ts` is the precedent and states the reason: these
 * are exactly the statements that go stale silently. Someone edits the DCAM note on
 * the screen, the PDF keeps the old wording, and a client ends up holding two
 * documents making different claims about one dataset.
 *
 * D5 stage E3 adds the same surfaces to TAIW and HAIW, which would have made three
 * copies of statements that are not module-specific at all — "the weights are ours"
 * is true of every module, and a third copy is a third thing to forget. So the
 * module-invariant statements live here, built from parameters where a module differs
 * (its framework count, its spine's unit, its scale).
 *
 * Each module still owns a `report/frameworkNotes.ts` for what IS module-specific:
 * TAIW's absent DGI and DM07, HAIW's HACR-INSTRUMENT disclosure. This file holds
 * only what would otherwise be retyped.
 *
 * DGIW's copy is deliberately NOT refactored onto this. That module is not in this
 * stage's scope, and a DGIW report source moving would put a DGIW baseline diff
 * inside a TAIW/HAIW change — a fix nobody reviewed riding on a feature. It is the
 * one remaining duplicate and it is recorded here rather than left to be noticed.
 */
import type { Framework } from './types'

/** 1-5, the scale every module in this suite scores on. */
export const LEVEL_LABEL: Record<number, string> = {
  1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimising',
}

/** Never a bare digit for an unmeasured thing. */
export const levelLabelFor = (score: number | null): string =>
  score === null ? '—' : (LEVEL_LABEL[Math.round(score)] ?? '—')

const COUNT_WORD: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three', 4: 'four' }

/**
 * The headline every page and every document must carry.
 *
 * A client shown N numbers assumes N independent measurements. They are not: they are
 * ONE measurement in N vocabularies, and the overalls landing close together is the
 * correct result rather than a defect in the method. Stated before any table a reader
 * might quote, because a reader who works this out for themselves has already decided
 * the numbers are suspect.
 */
export const oneAssessment = (frameworkCount: number, spineCount: number, spineLabelPlural: string): string => {
  const n = COUNT_WORD[frameworkCount] ?? String(frameworkCount)
  return (
    `One assessment, ${n} vocabularies. These are not ${n} independent measurements — they are one ` +
    `evidence base expressed in ${n} published frameworks. The ${n} overall figures landing close ` +
    `together is the CORRECT result: the same answers, projected through the same ${spineCount} ` +
    `${spineLabelPlural}. What differs between them is emphasis and structure, which is what makes ` +
    `each one legible to a different audience.`
  )
}

/**
 * The weighting caveat. Non-negotiable on any surface showing a score: a reader who
 * assumes DAMA published these weights is being misled by omission.
 */
export const WEIGHTS_ARE_OURS =
  'Framework names, codes and dimension structures are PUBLISHED content. The relative WEIGHTS ' +
  'applied to those dimensions are Godaitec editorial judgement — none of these frameworks ' +
  'publishes weightings for its own dimensions. The weights are the first thing to challenge in ' +
  'review, and changing them changes every figure derived from them.'

/**
 * Scores are on the module's own 1-5 scale, not each framework's own.
 *
 * `scaleMin`/`scaleMax` are recorded in frameworks.json and no rescaling is
 * implemented, so a DCAM reader seeing 3.2 would otherwise reasonably assume DCAM's
 * six-point scale.
 */
export const scaleCaveat = (moduleLabel: string): string =>
  `All figures are on the ${moduleLabel} 1-5 maturity scale. They are NOT rescaled to each ` +
  `framework’s own scale — DCAM scores 1-6 and COBIT 2019 uses capability levels 0-5. A DCAM ` +
  `component shown here as 3.2 is 3.2 out of 5, not out of 6.`

/**
 * The two shares, stated once, in the words both surfaces use.
 *
 * They are never combined into one "coverage" number, and this paragraph is why: a
 * single figure would hide whichever of the two is worse.
 */
export const SHARES_EXPLAINED =
  'RETAINED SHARE is how much of the framework’s own definition of a dimension is in scope for ' +
  'this assessment. SCORED SHARE is how much of what is in scope was actually measured. They ' +
  'answer different questions and are never combined: a dimension can be fully retained and ' +
  'barely scored, or the reverse, and a single "coverage" number would hide whichever is worse.'

/**
 * WHY RETAINED SHARE BEHAVES DIFFERENTLY ON A MODULE WITH NO LAYER.
 *
 * DGIW's `retainedShare` varies continuously because its crosswalk entries carry a
 * `core`/`banking` tag and a core-only engagement drops the banking ones (DCAM7 retains
 * 0.75). TACR and HACR carry no layer field on any of their 640 / 720 questions, so a
 * LEAF retains either 1.0 (mapped) or 0.0 (unmapped, and therefore NOT APPLICABLE) and
 * nothing in between.
 *
 * It is still a separate column, and the column is still worth reading: a FRAMEWORK's
 * retained share is the weighted mean over its leaves, so it falls below 100% exactly
 * when one of them is unreachable. Stating this rather than letting a reader infer
 * "always 100%" is the point — a column that can only take two values at one level and
 * many at another is easy to misread as broken.
 */
export const RETAINED_IS_STRUCTURAL =
  'RETAINED SHARE here is structural, not scope-driven. This assessment has no core/banking ' +
  'split, so a leaf dimension is either fully mapped (100% retained) or mapped by nothing at all ' +
  '(0%, and reported as NOT APPLICABLE rather than scored). A framework’s own retained share ' +
  'falls below 100% precisely when one of its leaves is unreachable from this assessment. Where ' +
  'the two shares diverge on a leaf, the cause is always what has been ANSWERED, never what is in ' +
  'scope.'

/** Three states, and none of them may render as 0. */
export const THREE_STATES =
  'A dimension is SCORED, NOT ASSESSED or NOT APPLICABLE, and the last two never render as 0. ' +
  '"Not assessed" means the framework defines it, it is in scope, and nobody has answered the ' +
  'questions behind it yet. "Not applicable" means this assessment asks nothing that could ' +
  'evidence it. A zero would read as "measured, and bad" for both.'

/**
 * Per-framework confidence line, built from the dataset rather than retyped.
 * Anything below 'high' is stated as a qualification, never as settled fact.
 */
export function confidenceLine(f: Framework): string {
  const lead =
    f.structureConfidence === 'high'
      ? 'Published structure, high confidence.'
      : `Published structure recorded at ${f.structureConfidence.toUpperCase()} confidence — verify before relying on it in an audit context.`
  return `${f.code} (${f.versionLabel}) — ${lead}`
}

/** The suite-level structural qualifications C1 marked medium. Named, not averaged away. */
export const STRUCTURE_CAVEATS: string[] = [
  'DCAM is modelled at v2.2. Its capability and sub-capability levels beneath each component are ' +
    'deliberately NOT authored: they were not recalled reliably enough to put in front of an ' +
    'auditor, and an absent level is recoverable where an invented one is not. DCAM v3.0 ' +
    'reorganised the model and is not what is represented here.',
  'COBIT 2019 APO14 sub-practice titles have been checked against a public COBIT 2019 reference ' +
    'and corrected where they differed. They have NOT been checked against the ISACA publication ' +
    'itself, which is the only source an audit function should accept — treat them as verified ' +
    'secondhand, not as quoted. The five EDM governance objectives are high confidence.',
]
