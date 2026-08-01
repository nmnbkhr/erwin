/**
 * CSV-HEADER — headers must survive an unquoted header row.
 *
 * `utils/export.ts::downloadCSV` quotes every data field but emits the header
 * row as a bare `headers.join(',')`. Quoting it would change BAIW, TAIW and HAIW
 * output byte for byte, so the header row stays as it is and the constraint
 * lives here instead: a header containing a comma silently splits into two
 * columns and shifts every value after it by one; a quote or a newline corrupts
 * the file outright for a strict RFC 4180 reader. Today's headers are clean.
 * Nothing enforced that the next one would be.
 *
 * Duplicates are the same defect by a different route. `csv.ts::buildCsvRows`
 * keys each cell by header text into a plain object, so two columns sharing a
 * header are not two columns: the second assignment overwrites the first and the
 * register is delivered a column short, with no error anywhere. The type system
 * cannot see it — `CsvColumn<T>[]` constrains `key`, never `header`.
 *
 * The specs are read with the TypeScript compiler that already builds this repo
 * — no new dependency, no regex guessing at whether a `header:` is real code or
 * prose inside a doc comment, and the generators are never executed. A spec the
 * parser cannot resolve to a plain string literal FAILS: a gate that quietly
 * passes on the thing it could not read is worse than no gate.
 *
 * Limit worth knowing: a header inherited through an object spread
 * (`{ ...COMMON, key: 'x' }`) is not traced back to its source. Nothing does
 * that today, and the CsvColumn-declared-but-no-header check below fires if a
 * spec ever moves somewhere this walk cannot see.
 */
import { ts, parseFile, propName, enclosingSpec, brief } from '../lib/ts-ast.mjs'

const BAD_IN_HEADER = [
  [',', 'comma', 'splits into two columns'],
  ['"', 'double quote', 'corrupts the row'],
  ['\r', 'CR', 'terminates the header row early'],
  ['\n', 'LF', 'terminates the header row early'],
]

export default {
  code: 'CSV-HEADER',

  run(ctx) {
    const { root, fail, sources } = ctx
    const specFiles = []
    let headersChecked = 0

    for (const file of sources) {
      const { sf, text, rel, lineOf, at } = parseFile(root, file)
      let found = 0
      // The file that DEFINES CsvColumn references it without declaring any column,
      // and that is not the defect the guard below is looking for. Structural, not an
      // exemption list: you cannot import a type from the file that declares it.
      let declaresCsvColumn = false
      /** Spec array node → header text → the node that first claimed it. */
      const claimed = new Map()

      const visit = (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name.text === 'CsvColumn') declaresCsvColumn = true
        if (ts.isShorthandPropertyAssignment(node) && node.name.text === 'header') {
          found++
          fail(`${at(node)} header is a shorthand property — its value cannot be verified here`)
        } else if (ts.isPropertyAssignment(node) && propName(node.name) === 'header') {
          found++
          const init = node.initializer
          if (!ts.isStringLiteralLike(init)) {
            // Covers interpolated templates, calls, identifiers and conditionals.
            fail(`${at(node)} header is not a literal string (\`${brief(sf, init, 60)}\`) — its value cannot be verified here`)
          } else {
            // `.text` is the cooked value, so an escaped comma (',') is caught too.
            for (const [ch, label, effect] of BAD_IN_HEADER)
              if (init.text.includes(ch))
                fail(`${at(node)} header ${JSON.stringify(init.text)} contains a ${label} — the header row is written unquoted, so this ${effect}`)

            // Reported at the second occurrence, naming the first: that is the one a
            // reader has to go and look at to decide which of the two to rename.
            const spec = enclosingSpec(node) ?? sf
            const seen = claimed.get(spec) ?? new Map()
            claimed.set(spec, seen)
            const first = seen.get(init.text)
            if (first)
              fail(`${at(node)} header ${JSON.stringify(init.text)} duplicates the one at ${rel}:${lineOf(first)} in the same spec — buildCsvRows keys cells by header text, so the second column overwrites the first and the file is delivered a column short`)
            else seen.set(init.text, node)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)

      if (found === 0 && !declaresCsvColumn && /\bCsvColumn\b/.test(text))
        fail(`${rel} references CsvColumn but declares no header: property — the column spec has moved somewhere this check cannot see it`)
      if (found > 0) specFiles.push(rel)
      headersChecked += found
    }

    return { examined: headersChecked, specFiles }
  },
}
