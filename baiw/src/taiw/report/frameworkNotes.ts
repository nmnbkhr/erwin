/**
 * TAIW's framework caveats — the ones that are about TACR rather than about method.
 *
 * `src/frameworks/notes.ts` holds what every module says: the weights are ours, the
 * scale is not rescaled, the two shares answer different questions. This file holds
 * what only TACR can say, and both statements here are MEASURED findings rather than
 * editorial hedges:
 *
 *   DGI  is not offered at all, because it reaches 59% of itself on TACR.
 *   DM07 is not applicable, because 0 of 640 questions touch document management.
 *
 * They live here, imported by the page and by both generators, for the reason
 * `src/dgiw/report/frameworkNotes.ts` gives: these are exactly the statements that go
 * stale silently. Someone tightens the DGI sentence on the screen, the PDF keeps the
 * old wording, and a client holds two documents making different claims about one
 * dataset.
 *
 * The numbers are NOT retyped here. `TAIW_UNREACHED_FRAMEWORK` and
 * `TAIW_NOT_APPLICABLE_DIMENSIONS` are declared in `src/taiw/projection.ts` beside the
 * framework filter they justify, and `scripts/check/modules/taiw.mjs` fails if either
 * stops being true — a declared exception that no longer applies is a permanent hole in
 * the check, not a harmless leftover.
 */
import { TAIW_NOT_APPLICABLE_DIMENSIONS, TAIW_UNREACHED_FRAMEWORK } from '../projection'

/** `TAIW` — appears in the scale caveat, which names the module whose 1-5 scale it is. */
export const TAIW_MODULE_LABEL = 'TAIW'

/** What a TACR spine node IS. Rendered as a column heading, so it has to read as a noun. */
export const TAIW_SPINE_LABEL = 'TACR section'
export const TAIW_SPINE_LABEL_PLURAL = 'TACR sections'

/**
 * The two findings, in full, on the page and on every generated document.
 *
 * Rendered as bullets rather than a footnote deliberately. A reader who takes the four
 * overall figures at face value and discovers the DGI omission afterwards has been
 * misled by placement, whatever the small print said.
 */
export const TAIW_CAVEATS: readonly string[] = [
  `DGI IS NOT OFFERED. ${TAIW_UNREACHED_FRAMEWORK.why} The four dimensions it loses are ` +
    `${TAIW_UNREACHED_FRAMEWORK.lost.join(', ')} — which is close to a definition of what DGI is. ` +
    `This is a finding about TACR, not a defect in DGI: the same ten DGI leaves reach 100% of ` +
    `themselves on HAIW's HACR subcategories.`,
  `DM07 IS NOT APPLICABLE. ${TAIW_NOT_APPLICABLE_DIMENSIONS.DM07}`,
  'THREE FRAMEWORKS, NOT FOUR. Every figure on this document is a projection of ONE TACR ' +
    'assessment onto DMBOK2, DCAM and COBIT 2019. Nothing here is a second opinion; the ' +
    'frameworks cannot corroborate one another because they are reading the same answers.',
]

/**
 * WHY the seven unmapped sections are a finding rather than an authoring gap.
 *
 * The list itself is computed from the crosswalk by the generator — see
 * `unmappedSpineNodes`. This is what no dataset can say: that the seven are a customs
 * administration's own subject matter, and a data-management framework being silent
 * about revenue automation is that framework's scope, not a hole in the mapping.
 */
export const TAIW_UNMAPPED_NOTE =
  'These are customs operations rather than data management: TFA commitments, clearance and ' +
  'revenue automation, risk models, compliance rates and officer training. No published ' +
  'data-management framework defines them, and mapping them onto one anyway would be a mapping ' +
  'nobody could defend in a room. They are measured, they carry a maturity score, and they appear ' +
  'in the TAIW maturity report — they are simply outside what DMBOK2, DCAM and COBIT 2019 are ' +
  'about. WTO TFA Commitment is the clearest case: it is eighteen questions, one per TFA Article, ' +
  'so the framework’s vocabulary IS the assessment and a projection would restate it against itself.'
