/**
 * Shared markdown export — the third of three exits a deliverable can reach the
 * user through, after the PDF spine (`spine.ts::saveReport`) and the CSV
 * builder (`csv.ts::downloadCsv`).
 *
 * Mirrors csv.ts's own reasoning: no jsPDF import, direct or transitive, so a
 * markdown-only caller does not pull the PDF engine into its chunk.
 *
 * Before this file existed, BAIW's, TAIW's and HAIW's roadmap generators each
 * hand-rolled `new Blob([md], { type: 'text/markdown;charset=utf-8' });
 * saveAs(blob, filename)` — three copies of four lines, and three places a
 * provenance record could be forgotten independently. One function now, and
 * `PROVENANCE-COVERAGE` asserts every call supplies a `ReportMeta`.
 */
import { saveAs } from 'file-saver'
import type { ReportMeta } from './types'
import { recordProvenance } from './provenance'

/**
 * Download a markdown string, then — if `meta` is supplied — record its
 * provenance. `meta` is optional so this signature is source-compatible with
 * every call site that predates the recorder; PROVENANCE-COVERAGE is what
 * turns "optional" into "supplied everywhere it matters".
 */
export function saveMarkdown(content: string, filename: string, meta?: ReportMeta): void {
  const name = filename.endsWith('.md') ? filename : `${filename}.md`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, name)
  if (meta) recordProvenance('md', meta, name, null)
}
