/**
 * HAIW's framework caveats — the ones that are about HACR rather than about method.
 *
 * There is exactly one that matters and it is the instrument disclosure. All four
 * frameworks reach 100% of themselves on HACR's eighty subcategories, where DMBOK2
 * reached 94% and DGI 59% on TACR. That is the most impressive number either HAIW
 * deliverable carries and the one most needing qualification, because **it is a property
 * of how the bank was generated, not evidence of depth**: strip the subcategory name out
 * of every one of the 720 questions and exactly nine distinct forms remain, each
 * appearing eighty times.
 *
 * `HACR-INSTRUMENT` in `scripts/check/modules/haiw.mjs` measures this on every build and
 * declares the nine stems in full rather than counting them — `=== 9` would be the `> 0`
 * mistake, true of this bank and equally true of nine completely different stems. It
 * deliberately FAILS the day someone authors real questions, because on that day this
 * paragraph stops being true and has to be rewritten in the same commit.
 *
 * CLAUDE.md's instruction is unconditional: "Any HAIW deliverable that renders a
 * framework scorecard must carry that sentence beside it." This file is how the page and
 * both PDFs carry the same one.
 */
import { HACR_QUESTIONS_PER_SUBCATEGORY, HACR_SUBCATEGORIES_PER_CATEGORY } from '../hacr'

export const HAIW_MODULE_LABEL = 'HAIW'

export const HAIW_SPINE_LABEL = 'HACR subcategory'
export const HAIW_SPINE_LABEL_PLURAL = 'HACR subcategories'

/**
 * The instrument disclosure, rendered under the scorecard title in the same weight as
 * the coverage denominator — never as a footnote.
 *
 * Built from `hacr.ts`'s own constants so the shape of the bank and the sentence
 * describing it cannot disagree. `HACR-CATEGORY-MAP` asserts both numbers.
 */
export const HACR_INSTRUMENT_DISCLOSURE =
  `READ THE 100% FIGURES AGAINST THIS. HACR is 80 subcategories × ` +
  `${HACR_QUESTIONS_PER_SUBCATEGORY} questions, ${HACR_SUBCATEGORIES_PER_CATEGORY} subcategories ` +
  `per category, built from NINE TEMPLATE STEMS applied uniformly across the whole bank — ` +
  `strategic planning, resource allocation, implementation maturity, staff competency, technology ` +
  `support, process documentation, performance measurement, continuous improvement and ` +
  `stakeholder engagement. Every subcategory is therefore measured identically and none more ` +
  `deeply than any other. A framework reaching 100% of itself here is a statement about the ` +
  `CROSSWALK's completeness, not about the depth of evidence behind any dimension.`

export const HAIW_CAVEATS: readonly string[] = [
  HACR_INSTRUMENT_DISCLOSURE,
  'ALL FOUR FRAMEWORKS ARE OFFERED, AND THE CONTRAST IS THE FINDING. DGI reaches 100% of itself ' +
    'on HACR and 59% on TAIW’s TACR, so TAIW does not offer it at all. Same framework, same ' +
    'dimension weights, same authoring standard — what differs is whether the assessment behind ' +
    'the spine asks anything that could evidence decision rights, accountabilities and ' +
    'stewardship. Reach is a property of the PAIR, never of the framework alone.',
  'NO CAPABILITY-LEVEL SCORE IS DERIVED FROM THIS. HACR’s 720 `capabilityLinks` are a modulo ' +
    'counter (D-016), so HAIW withdrew its per-capability score in D5 stage E2 and ships an HCF ' +
    'capability register instead. Nothing on this document is projected onto the 108 HCF ' +
    'capabilities; the spine is the 80 subcategories, which are an authored taxonomy.',
]

/**
 * WHY the fourteen unmapped subcategories are a finding rather than an authoring gap.
 *
 * The list is computed from the crosswalk by the generator. This is what no dataset can
 * say — and it was the expectation D5 stage D went in with that the measurement
 * overturned: HACR was assumed to be a data taxonomy throughout, and three of its eight
 * categories turned out to describe health service delivery.
 */
export const HAIW_UNMAPPED_NOTE =
  'These are health service delivery rather than data management: patient portals, telehealth, ' +
  'shared decision making, health equity, population outcomes and workforce learning culture. ' +
  'HACR was expected to be a data taxonomy throughout and the measurement said otherwise — three ' +
  'of its eight categories describe how care is delivered, not how data is governed. No published ' +
  'data-management framework defines them and none should. They are measured, they carry a ' +
  'maturity score, and they appear in the HAIW maturity report; they contribute to no framework ' +
  'scorecard because the frameworks are silent about them.'
