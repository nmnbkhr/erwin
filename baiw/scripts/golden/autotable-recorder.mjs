/**
 * Recording shim for `jspdf-autotable`.
 *
 * `src/report/spine.ts` is the ONE runtime importer of `jspdf-autotable` in the
 * suite — the three pre-spine generators went through `spine.ts::table()` in D2
 * step 3 — so aliasing the bare specifier to this file puts a recorder in front
 * of every table every generator in every module draws, with no change to
 * application source at all. Same mechanism, and the same reason, as the
 * `file-saver` -> `file-saver-sink.mjs` alias `createDriver` already installs.
 *
 * What it records is the INPUT SIDE: the exact strings a cell was GIVEN, before
 * jspdf-autotable decides what fits. `text-integrity.mjs` compares those against
 * the glyphs that reached the content stream. That comparison is the D-018 guard,
 * and it is written against the SYMPTOM (text handed to the renderer did not come
 * out) rather than against any one mechanism, because three separate mechanisms
 * have now produced this one symptom and each existing guard was written against
 * a mechanism:
 *
 *   D-004  doc.text(s, x, y, { maxWidth })   TEXT-MAXWIDTH  — greps for the key
 *   D-005  measure before setFontSize        (none)         — fixed, unguarded
 *   D-018  autotable cell clipping           (none)         — this file
 *
 * The real module is imported by absolute path so the alias — which matches the
 * bare specifier exactly — does not catch this file's own import and recurse.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
// The package's `exports` map does not expose ./package.json, so the dist file
// is addressed directly from node_modules rather than resolved through it. Same
// build the app loads: `createDriver` sets noExternal for jspdf-autotable, so
// SSR evaluates this ESM bundle in both paths.
const REAL = path.join(HERE, '../../node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs')
const real = await import(REAL)

/**
 * Every table drawn since the last `takeTableLedger()`, in draw order.
 *
 * Global rather than per-driver because the alias resolves to one module
 * instance for the whole SSR graph; the driver takes and clears it per artefact.
 */
const ledger = []

/** Cells the way autoTable accepts them: string, number, or `{ content }`. */
function cellText(cell) {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'object') return cellText(cell.content)
  return String(cell)
}

const rowCells = row => (Array.isArray(row) ? row.map(cellText) : Object.values(row ?? {}).map(cellText))

function autoTable(doc, options) {
  ledger.push({
    page: doc.getCurrentPageInfo?.().pageNumber ?? null,
    head: (options.head ?? []).map(rowCells),
    body: (options.body ?? []).map(rowCells),
    columnStyles: options.columnStyles ?? null,
    bodyFontSize: options.bodyStyles?.fontSize ?? null,
  })
  return real.autoTable(doc, options)
}

/** Drain the ledger. The caller owns the array; the shim keeps nothing. */
export function takeTableLedger() {
  return ledger.splice(0, ledger.length)
}

export default autoTable
export const {
  Cell, CellHookData, Column, HookData, Row, Table, __createTable, __drawTable, applyPlugin,
} = real
export { autoTable }
