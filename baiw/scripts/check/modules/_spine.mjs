/**
 * The shared report spine — src/report/, which belongs to no module.
 *
 * Registered as an entry in its own right because it is a real owner of report
 * source: every generator in the suite goes through it. It was added to the
 * declared source set in D2 step 2, when TEXT-MAXWIDTH found THREE live
 * instances in here — the cover title, the cover subtitle and the page header —
 * against zero in DGIW's generators. A gate over the callers that skipped the
 * shared code they all call would have reported green while the worst instances
 * sat in the one file every report goes through.
 *
 * It declares no datasets and no checks of its own. That is legal and visible:
 * the REGISTRY line prints `_spine 0` on every build, so "the spine has no rules"
 * stays a stated fact rather than an unrecorded one.
 */
export default {
  id: '_spine',
  title: 'shared report spine',
  reportSources: [{ rel: 'src/report', kind: 'dir' }],
  checks: [],
}
