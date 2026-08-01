/**
 * BAIW — Banking Analytics.
 *
 * Declares its report source and its three artefact ids. No dataset rules yet;
 * D4 adds them, and `docs/known-defects.md` already names the first one — BAIW's
 * capability relations, where `capabilitiesUsing` disagrees with
 * `capabilities.length` and four requirement ids dangle. That guard has a home
 * now; it did not before.
 *
 * `-REGISTER`, not `-GAP`. BAIW's third deliverable was `MR-BAIW-GAP` until D-001
 * was resolved by REMOVAL: BACR categories and BVF capabilities are orthogonal
 * axes with no join in any dataset, so there is no per-capability gap to report
 * and the id says so rather than leaving a filename that promises one.
 */
export default {
  id: 'baiw',
  title: 'BAIW — Banking Analytics',
  reportSources: [{ rel: 'src/utils/reportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-BAIW-MATURITY', 'MR-BAIW-REGISTER', 'MR-BAIW-ROADMAP'],
  checks: [],
}
