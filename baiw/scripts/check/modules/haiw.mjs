/**
 * HAIW — Healthcare Analytics.
 *
 * Declares its report source and its three artefact ids. No dataset rules yet;
 * D5 adds them.
 *
 * `MR-HAIW-GAP` keeps the word the other two modules gave up. Since D-003 HAIW's
 * gap column is computed from real `capabilityLinks` on all 720 HACR questions,
 * so there the word is accurate. The asymmetry records which module has the
 * relation authored and must not be "fixed".
 */
export default {
  id: 'haiw',
  title: 'HAIW — Healthcare Analytics',
  reportSources: [{ rel: 'src/haiw/utils/healthReportGenerator.ts', kind: 'file' }],
  artefactIds: ['MR-HAIW-MATURITY', 'MR-HAIW-GAP', 'MR-HAIW-ROADMAP'],
  checks: [],
}
