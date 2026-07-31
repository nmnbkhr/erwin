/**
 * The caveats that must travel with every framework figure.
 *
 * One copy, imported by the page and by both generators. These are exactly the
 * statements that go stale silently: someone edits the DCAM note on the screen,
 * the PDF keeps the old wording, and a bank ends up holding two documents that
 * make different claims about the same dataset.
 *
 * Everything here is sourced from `frameworks.json`'s own `structureConfidence`
 * and `structureNotes` where it can be, rather than retyped — the one thing that
 * cannot drift is a value read from the file it describes.
 */
import frameworksData from '../data/frameworks.json'
import type { Framework, FrameworksData } from '../types'

const FW = frameworksData as unknown as FrameworksData

/** Frameworks in id order. */
export const FRAMEWORKS: Framework[] = [...FW.frameworks].sort((a, b) => (a.id < b.id ? -1 : 1))

/**
 * The headline the page and both reports must carry.
 *
 * A client shown four numbers assumes four independent measurements. They are
 * not: they are one measurement in four vocabularies, and four overalls landing
 * close together is the correct result rather than a defect in the method.
 */
export const ONE_ASSESSMENT =
  'One assessment, four vocabularies. These are not four independent measurements — they are ' +
  'one evidence base expressed in four published frameworks. The four overall figures landing ' +
  'close together is the correct result: the same answers, projected through the same eleven ' +
  'capability pillars. What differs between them is emphasis and structure, which is what makes ' +
  'each one legible to a different audience.'

/**
 * The weighting caveat. Non-negotiable on any page or document showing a score:
 * a reader who assumes DAMA published these weights is being misled by omission.
 */
export const WEIGHTS_ARE_OURS =
  'Framework names, codes and dimension structures are published content. The relative WEIGHTS ' +
  'applied to those dimensions are Godaitec editorial judgement — none of these four frameworks ' +
  'publishes weightings for its own dimensions. The weights are the first thing to challenge in ' +
  'review, and changing them changes every figure derived from them.'

/**
 * Scores are on DGIW's 1-5 scale, not each framework's own.
 *
 * `scaleMin`/`scaleMax` are recorded in frameworks.json but no rescaling is
 * implemented, so a DCAM reader seeing 3.2 would otherwise reasonably assume
 * DCAM's six-point scale.
 */
export const SCALE_CAVEAT =
  'All figures are on the DGIW 1-5 maturity scale. They are NOT rescaled to each framework’s own ' +
  'scale — DCAM scores 1-6 and COBIT 2019 uses capability levels 0-5. A DCAM component shown here ' +
  'as 3.2 is 3.2 out of 5, not out of 6.'

/** The two shares, stated once, in the words both surfaces use. */
export const SHARES_EXPLAINED =
  'Retained share is how much of the framework’s own definition of a dimension is in scope under ' +
  'this engagement’s layer. Scored share is how much of what is in scope was actually measured. ' +
  'They answer different questions and are never combined: a dimension can be fully retained and ' +
  'barely scored, or the reverse, and a single "coverage" number would hide whichever is worse.'

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

/** The specific things C1 marked medium. Named individually, not averaged away. */
export const STRUCTURE_CAVEATS: string[] = [
  'DCAM is modelled at v2.2. Its capability and sub-capability levels beneath each component are ' +
    'deliberately NOT authored: they were not recalled reliably enough to put in front of an ' +
    'auditor, and an absent level is recoverable where an invented one is not. DCAM v3.0 ' +
    'reorganised the model and is not what is represented here.',
  'COBIT 2019 APO14 sub-practice titles have been checked against a public COBIT 2019 reference ' +
    'and corrected where they differed. They have NOT been checked against the ISACA publication ' +
    'itself, which is the only source an audit function should accept — treat them as verified ' +
    'secondhand, not as quoted. The five EDM governance objectives are high confidence.',
  'The three DGI groupings used as parents are how the published DGI diagram arranges the ten ' +
    'components; treating that arrangement as a formal level is a modelling choice, not published ' +
    'hierarchy.',
]
