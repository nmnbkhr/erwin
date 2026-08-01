/**
 * COE — Cash Optimization.
 *
 * Declares nothing: no datasets under gate, no report generator, no artefact ids.
 * That is legal, and it is the point of registering it anyway — the REGISTRY line
 * prints `coe 0` on every build, so "COE is not covered by the gate" is a stated
 * fact a reader sees rather than an absence they would have to notice.
 *
 * An empty module is not the same as a broken one. A module that declared a
 * dataDir or a reportSources entry that did not resolve would FAIL; declaring
 * nothing passes and says so.
 */
export default {
  id: 'coe',
  title: 'COE — Cash Optimization',
  checks: [],
}
