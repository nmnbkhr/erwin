/**
 * Deterministic filenames and dates.
 *
 * Separate from spine.ts on purpose: both the PDF path and the CSV path need
 * these, and spine.ts statically imports jsPDF. Putting them here keeps a
 * CSV-only export from dragging the PDF engine into its chunk.
 *
 * Nothing here reads the clock. Every date comes from `ReportMeta.generatedAt`.
 */
import type { ReportMeta } from './types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Filename-safe slug. Empty or symbol-only names fall back rather than yielding "". */
export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unnamed'
  )
}

/** `YYYY-MM-DD` in UTC. */
export function isoDate(generatedAt: string): string {
  const d = new Date(generatedAt)
  if (Number.isNaN(d.getTime())) return '0000-00-00'
  return d.toISOString().slice(0, 10)
}

/**
 * Long-form cover date, built from UTC parts rather than
 * `toLocaleDateString`. The locale version is neither deterministic across
 * machines nor timezone-stable: an ISO instant near midnight renders as the
 * previous day west of UTC, so the cover and the filename would disagree.
 */
export function formatCoverDate(generatedAt: string): string {
  const d = new Date(generatedAt)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

/** `<artefact-id>_<org-slug>_<layer>_<YYYY-MM-DD>.<ext>` */
export function reportFilename(meta: ReportMeta, ext: 'pdf' | 'csv' | 'md'): string {
  return `${meta.artefactId}_${slugify(meta.orgName)}_${meta.layer}_${isoDate(meta.generatedAt)}.${ext}`
}
