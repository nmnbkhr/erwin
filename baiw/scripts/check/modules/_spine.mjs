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
 * It declares no checks of its own. That is legal and visible: the REGISTRY line
 * prints `_spine 0` on every build, so "the spine has no rules" stays a stated
 * fact rather than an unrecorded one.
 *
 * ─── IT NOW OWNS A DATASET, AND THAT IS NEW ────────────────────────────────
 *
 * `frameworks.json` — the published structure of DMBOK2, DCAM, DGI and COBIT 2019
 * — moved here from `src/dgiw/data/` in D5 stage B. Data governance is horizontal:
 * a trade authority needs DMBOK as much as a bank does, so the framework
 * DEFINITIONS are suite-level while each module's CROSSWALK into its own spine
 * stays with the module. `crosswalk.json` holds all 91 pillar references and did
 * not move; `frameworks.json` holds none and never did.
 *
 * This entry is the right owner because the alternative is worse: leaving it under
 * `src/dgiw/` would make TAIW and HAIW read a file from a module they have nothing
 * to do with, and the first person to delete DGIW would take DMBOK with it.
 *
 * DGIW's five crosswalk classes read it through `ctx.shared('_spine').fw` rather
 * than `ctx.data.fw`. See check.mjs's two-pass note for why loading is unfiltered.
 *
 * It carries a `summary` so the block PRINTS. Without one, an entry with zero
 * checks is skipped in the report, and "the suite owns four framework definitions"
 * would be a fact with no line of output behind it.
 */
export default {
  id: '_spine',
  title: 'shared report spine',
  dataDir: 'src/frameworks/data',
  datasets: { fw: 'frameworks.json' },
  /*
   * TWO LOCATIONS AS OF D5 STAGE E3.
   *
   * `src/frameworks/report` holds `projectionReports.ts` — the framework alignment
   * pack and the multi-framework scorecard, parameterised, shared by TAIW and HAIW
   * rather than copied into each. It belongs to this entry for the same reason
   * `frameworks.json` does: it is suite-level code owned by no module, and leaving
   * it undeclared would mean the two generators MOST likely to forget a content
   * digest were the two ARTEFACT-IMPL could not see. They call `createReport`
   * twice; before E3 declared this, the digest rule applied to neither.
   *
   * The precedent is D2's, and it is exactly this shape: adding `src/report` to the
   * set found THREE live TEXT-MAXWIDTH instances inside `spine.ts` against zero in
   * DGIW's generators. Shared code that every caller runs through is where the worst
   * instances sit, and it is the last place a per-module scope would look.
   */
  reportSources: [
    { rel: 'src/report', kind: 'dir' },
    { rel: 'src/frameworks/report', kind: 'dir' },
  ],
  checks: [],

  summary(ctx) {
    const fw = ctx.data.fw ?? {}
    const frameworks = fw.frameworks ?? []
    const dims = fw.dimensions ?? []
    const kids = new Set(dims.map((d) => d.parentId).filter(Boolean))
    return [
      `FRAMEWORKS ${frameworks.length} published (${frameworks.map((f) => f.code).join(', ') || 'none'})` +
        `, ${dims.length} dimensions, ${dims.filter((d) => !kids.has(d.id)).length} leaf` +
        ` — suite-level, crosswalked per module`,
    ]
  },
}
