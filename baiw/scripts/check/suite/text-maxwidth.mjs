/**
 * TEXT-MAXWIDTH — jsPDF's maxWidth option loses text.
 *
 * `doc.text(s, x, y, { maxWidth: n })` reads as "wrap this". It is not. jsPDF
 * computes the split and then emits ONLY THE FIRST LINE; everything past the
 * break is discarded with no error, no clipping and nothing visible on the page
 * except a sentence that stops. Measured directly:
 *
 *     splitTextToSize(180)              -> 2 lines
 *     doc.text(.., { maxWidth: 180 })   -> 1 text run drawn
 *
 * Three sentences were lost from every HAIW PDF ever exported, and three more
 * instances were sitting in src/report/spine.ts — the file every report in the
 * suite goes through. See docs/known-defects.md D-004.
 *
 * The rule is therefore absolute: the key does not appear in report code. Wrap
 * with splitTextToSize and emit one text() per line, or, where only one line
 * fits, call spine.ts::fitOneLine so the cut is marked rather than silent.
 *
 * Deliberately callee-agnostic. Matching only `doc.text(...)` would miss an
 * alias, a bound method or a helper that forwards its options, and in this
 * codebase `maxWidth` has exactly one meaning. An unresolvable options bag — a
 * spread, or an identifier where a literal should be — FAILS rather than being
 * skipped, on the same principle as CSV-HEADER: a check that quietly passes on
 * what it could not read is worse than no check.
 */
import { ts, parseFile, propName, isTextCall, enclosingCall, brief } from '../lib/ts-ast.mjs'

export default {
  code: 'TEXT-MAXWIDTH',

  run(ctx) {
    const { root, fail, sources } = ctx
    let textCalls = 0

    for (const file of sources) {
      const { sf, at } = parseFile(root, file)

      const visit = (node) => {
        if (isTextCall(node)) {
          textCalls++
          // jsPDF's signature is text(text, x, y, options). A bag this walk cannot
          // read is a bag that could carry maxWidth.
          const bag = node.arguments[3]
          if (bag && !ts.isObjectLiteralExpression(bag)) {
            fail(`${at(node)} the options argument to ${node.expression.getText(sf)}() is \`${brief(sf, bag, 40)}\`, not an object literal — this check cannot see whether it carries maxWidth`)
          } else if (bag && bag.properties.some((p) => ts.isSpreadAssignment(p))) {
            fail(`${at(node)} the options argument to ${node.expression.getText(sf)}() spreads another object — this check cannot see whether it carries maxWidth`)
          }
        }
        const isMaxWidthKey =
          (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && propName(node.name) === 'maxWidth'
        if (isMaxWidthKey) {
          const call = enclosingCall(node)
          const where = call ? `${call.expression.getText(sf).replace(/\s+/g, ' ')}()` : 'an options object'
          fail(`${at(node)} ${where} is passed maxWidth — jsPDF computes the line split and then draws only the FIRST line, so every line after the break is silently discarded. Split with splitTextToSize and emit one text() per line, or use spine.ts::fitOneLine where only one line fits.`)
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    return { examined: textCalls }
  },
}
