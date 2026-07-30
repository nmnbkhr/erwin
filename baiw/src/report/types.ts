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
  /** Artefact id from artefacts.json. Appears on the cover and in the filename. */
  artefactId: string
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
