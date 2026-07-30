/**
 * Typed CSV builder.
 *
 * Escaping is NOT reimplemented here — `utils/export.ts::downloadCSV` already
 * quotes every field and doubles embedded quotes correctly, which is more than
 * two of the three existing hand-rolled CSV generators do (BAIW's
 * `generateGapCSV` interpolates unquoted, so a capability name containing a
 * comma corrupts the row).
 *
 * What this adds is an explicit ordered column spec. `downloadCSV` derives its
 * header row from `Object.keys(rows[0])`, so column order and header text are
 * whatever the first object happened to be built with; a caller that assembles
 * rows in a loop has no way to rename a column or guarantee its position.
 *
 * No jsPDF import, direct or transitive — a CSV export must not pull the PDF
 * engine into its chunk.
 */
import { downloadCSV } from '../utils/export'

export interface CsvColumn<T> {
  /** Property read from the row when `format` is absent. */
  key: keyof T & string
  /** Header text, and the object key handed to downloadCSV. */
  header: string
  /** Derive the cell from the whole row — joins, lookups, rounding. */
  format?: (row: T) => string | number
}

/**
 * Project rows through the column spec, in spec order.
 *
 * One caveat inherited from JavaScript rather than from downloadCSV: object keys
 * that look like array indices ("0", "1") are enumerated before string keys, so
 * a purely numeric header would jump to the front. Headers here are human column
 * titles, so this never bites — but do not use a bare number as a header.
 */
export function buildCsvRows<T>(rows: T[], columns: CsvColumn<T>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const col of columns) {
      const value = col.format ? col.format(row) : row[col.key]
      // null/undefined become empty, never the string "undefined".
      out[col.header] = value === null || value === undefined ? '' : value
    }
    return out
  })
}

/**
 * Build and download in one step.
 *
 * Returns false when there was nothing to write — `downloadCSV` returns early on
 * an empty array, producing no file and no error, and a layer filter that
 * excludes every row is a real case (a core-only engagement asking for a
 * banking-only register). The caller is expected to tell the user rather than
 * leave a button that silently does nothing.
 */
export function downloadCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string): boolean {
  if (rows.length === 0) return false
  downloadCSV(buildCsvRows(rows, columns), filename)
  return true
}
