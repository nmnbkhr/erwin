/**
 * TAIW — Trade Analytics.
 *
 * Declares its report source and its three artefact ids. No dataset rules yet;
 * D4 adds them. `docs/known-defects.md` records the first candidates: four
 * requirement ids in the WCO dataset that dangle across an `_and_` rename, and
 * `capabilitiesUsing` disagreeing with `capabilities.length` in 114 of 114 rows.
 *
 * `-REGISTER`, not `-GAP`, for the same reason as BAIW — see modules/baiw.mjs.
 */
export default {
  id: 'taiw',
  title: 'TAIW — Trade Analytics',
  reportSources: [{ rel: 'src/taiw/utils/tradeReportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-TAIW-MATURITY', 'MR-TAIW-REGISTER', 'MR-TAIW-ROADMAP'],
  checks: [],
}
