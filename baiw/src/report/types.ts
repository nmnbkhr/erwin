/**
 * Shared report contracts.
 *
 * Deliberately free of any runtime dependency — `csv.ts` imports from here and
 * must never pull jsPDF into its module graph, because a CSV-only export path
 * has no business loading a 588 kB PDF engine.
 */
import type { Styles } from 'jspdf-autotable'

/** jsPDF takes colours as 0-255 triples, not hex. */
export type RGB = readonly [number, number, number]

/**
 * Everything a deliverable needs to know about the engagement it belongs to.
 *
 * `generatedAt` is supplied by the caller rather than read from the clock inside
 * the report code. Two runs against the same engagement and the same layer must
 * produce byte-identical output, which is impossible if the document stamps its
 * own timestamp — and it also makes the PDF's own CreationDate reproducible,
 * since the spine feeds this value to `setCreationDate`.
 */
export interface ReportMeta {
  orgName: string
  engagementId: string
  /** ISO 8601. The single source of the cover date, the filename date and the PDF CreationDate. */
  generatedAt: string
  layer: 'core' | 'banking' | 'all'
  accent: RGB
  /** Renders the DRAFT watermark. These are paid deliverables; a final must be clean. */
  isDraft: boolean
  /**
   * The document's identity: the filename and the /ID seed, both of which need
   * it and neither of which tolerates it being blank.
   *
   * It also feeds the default cover line, but only as a default — see
   * `coverTag`, which is how a module with no artefact register keeps the id for
   * identity without printing it and citing a catalogue that does not exist.
   *
   * DGIW ids come from implementationPlan.json's artefactRegister; module report
   * ids from MODULE_ARTEFACT_IDS in check-dgiw.mjs. The gate accepts an id from
   * either and nothing else.
   */
  artefactId: string
  /**
   * Product name in the page chrome ("Powered by …") and the PDF's Creator.
   *
   * Defaults to `'DGIW'`, which is what every existing artefact rendered when
   * this was a hardcoded string. It is a field because the spine is about to
   * carry BAIW, TAIW and HAIW reports, and seventeen pages reading "Powered by
   * DGIW" on a healthcare maturity assessment is wrong in a way no reader could
   * explain.
   */
  poweredBy?: string
  /**
   * What this document covers, for the cover line and the PDF's Subject.
   *
   * Defaults to DGIW's layer sentence — "Core chassis + banking overlay" and its
   * two siblings. Those describe a data-governance chassis and are false on any
   * other module's report, so a caller outside DGIW supplies its own.
   */
  scopeLabel?: string
  /**
   * How the document's client-specific content was sourced — G1.
   *
   *  - `'engagement'` — built from the engagement's own intake; every
   *    client-specific string traces to an intake field.
   *  - `'reference'`  — built from reference/illustrative content because no
   *    actionable intake exists. Such a document must carry the ILLUSTRATIVE
   *    watermark (see `watermark`), and its provenance record carries the flag
   *    so the audit trail can tell the two apart.
   *  - absent — the artefact predates the distinction or does not have a
   *    reference fallback; provenance records `null`.
   *
   * Set by the caller from `intakeIsActionable` (src/dgiw/intake/types.ts) —
   * the one predicate, imported, never re-derived.
   */
  mode?: 'engagement' | 'reference'
  /**
   * G2: the assessment tier a score-carrying artefact was measured at, and its
   * coverage (answered / applicable AT THAT TIER). A Quick-tier score is
   * directional, and the principle is no manufactured precision: any document
   * that prints a maturity figure must say what tier produced it and how much
   * of that tier was answered — near the score, not in a footnote. Both feed
   * the provenance record, and the generators fold both into the /ID digest,
   * so a Quick PDF and a Deep PDF can never share a fingerprint. Absent on
   * artefacts that carry no assessment score.
   */
  assessmentTier?: 'quick' | 'standard' | 'deep'
  assessmentCoverage?: { answered: number; applicable: number }
  /**
   * Full-page diagonal watermark text, drawn on every page like the DRAFT
   * mark. `isDraft` keeps its existing behaviour untouched; this field exists
   * so reference-mode output can say ILLUSTRATIVE on every page (G1's
   * fallback-honesty rule), and so BAIW/TAIW/HAIW can reuse the same helper
   * later. When both are set, this text wins — one watermark per page.
   */
  watermark?: string
  /**
   * The small line under the cover date, overridden outright.
   *
   *  - `undefined` — the default: artefact id and scope label, joined by ` · `.
   *  - `''`        — no line at all.
   *  - any string  — rendered verbatim.
   *
   * This exists because presentation and identity were the same field and should
   * not have been. `artefactId` has three jobs — the filename, the /ID seed and
   * the cover — and the module reports need the first two while wanting nothing
   * to do with the third: printing `MR-BAIW-MATURITY` on a cover invites a reader
   * to look it up in an artefact register that BAIW does not have. Blanking the
   * id to clear the cover would have taken the filename and the /ID with it, so
   * the cover gets its own field instead and the id keeps its two real jobs.
   *
   * Only the cover. `scopeLabel` still supplies the PDF's Subject, which is
   * metadata rather than presentation and is worth keeping even when the cover
   * says nothing.
   */
  coverTag?: string
}

/** One table, in the spine's vocabulary rather than autoTable's. */
export interface TableSpec {
  head: string[]
  rows: (string | number)[][]
  /** Column index → autoTable style. Only halign/cellWidth are used in practice. */
  columnStyles?: Record<string, Partial<Styles>>
  headFontSize?: number
  bodyFontSize?: number
  /** Override the cursor; defaults to wherever the document currently is. */
  startY?: number
  /** Raw autoTable cell hook, for conditional colouring of a value column. */
  didParseCell?: (data: {
    section: 'head' | 'body' | 'foot'
    column: { index: number }
    row: { index: number }
    cell: { raw: unknown; styles: Partial<Styles> }
  }) => void
  /** Millimetres of whitespace left below the table. */
  gapAfter?: number
}

/** A declarative block: heading, prose, bullets, then an optional table. */
export interface SectionSpec {
  heading: string
  /** Small grey line under the heading explaining what the reader is looking at. */
  caption?: string
  paragraphs?: string[]
  bullets?: string[]
  table?: TableSpec
  /** Start this section on a fresh page. */
  newPage?: boolean
}

/** Per-call text overrides. Width is never a caller concern — see spine.text(). */
export interface TextOptions {
  size?: number
  color?: RGB
  /** Extra left indent in millimetres, on top of MARGIN. */
  indent?: number
  gapAfter?: number
}
