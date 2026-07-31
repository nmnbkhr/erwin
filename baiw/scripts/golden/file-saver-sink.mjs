/**
 * Stand-in for `file-saver` inside the harness's Vite SSR run.
 *
 * The real package reaches for `document`, `URL.createObjectURL` and a click on
 * a synthetic anchor. None of that exists in Node, and none of it is what we
 * want anyway — we want the payload. `createDriver()` aliases `file-saver` to
 * this module, so `generateGapCSV`/`generateRoadmapMarkdown` hand their Blob
 * here instead of triggering a download.
 *
 * The three PDF generators do not come through here: they call `doc.save()`,
 * which the driver patches on `jsPDF.API` directly.
 */

/** Filled by the generator under test, drained by createDriver().generate(). */
export const SINK = []

export function saveAs(blob, filename) {
  SINK.push({ filename, blob })
}

export default saveAs
