/**
 * CATEGORY-UNIVERSE — the list a module RENDERS must be the list its questions
 * declare, and there must be exactly one of it.
 *
 * ─── D-011, WHICH IS WHY THIS EXISTS ───────────────────────────────────────
 *
 * `pages/MaturityAssessment.tsx`, `utils/reportGenerator.ts` and
 * `components/dashboard/MaturityRadarCard.tsx` each carried their own nine-entry
 * `CATEGORIES` array. `bacrQuestions.json` holds eight categories and none of
 * them is `"Overall Assessment"`. Every live BAIW assessment therefore drew a
 * ninth radar axis pinned at 0, printed a ninth scorecard row, needed four
 * hardcoded benchmark fallbacks to service a category with no benchmark, and —
 * because `answeredCategories < totalCategories` was permanently 8 < 9 — stamped
 * **DRAFT on every complete report**.
 *
 * BENCHMARK-ROLLUP joins the benchmark file to the questions. This defect lived
 * one step away, in the list the UI and the report iterate, and nothing joined
 * that to anything.
 *
 * ─── TWO HALVES, AND THE SECOND IS THE ONE THAT MATTERS ────────────────────
 *
 * 1. SET EQUALITY. The declared list, as a set, equals the distinct categories in
 *    the question dataset. An extra entry is D-011. A missing entry is the same
 *    defect inverted — a category with questions that nothing renders — and would
 *    be even quieter, because a radar losing an axis looks like a radar.
 *
 * 2. SINGLE DECLARATION. More than one array literal under `src/` whose contents
 *    are exactly the module's category set FAILS, naming every file. **Three
 *    copies is how they diverged**, and the check that finds the fourth copy is
 *    worth more than the one that finds the wrong ninth entry — a fourth copy is
 *    how the wrong ninth entry comes back.
 *
 * ─── ORDER IS REPORTED, NEVER ASSERTED ─────────────────────────────────────
 *
 * A BACR question is `{ id, category, subcategory, text, weight }`: no ordinal,
 * no category id, no category table. The only order the dataset can express is
 * order of first appearance, which is NOT the order the radar, the eight
 * deep-dive pages, the scorecard and the benchmark table ship in. Asserting it
 * would invent an authority the data does not have and reorder four rendered
 * surfaces to match an accident of file generation. So the declared order is
 * PRINTED on every build — a reordering shows up in the build diff and a human
 * decides — and nothing here fails on it.
 *
 * ─── THE DECLARED LOCATION MUST RESOLVE ────────────────────────────────────
 *
 * `REPORT-SOURCES`'s rule, applied here: a declared file that is missing, or a
 * declared const that is not an array of string literals, is a FINDING rather
 * than a skip. A scan that quietly finds nothing to compare is indistinguishable
 * from a scan that passed, and this repo has shipped that shape thirteen times.
 *
 * NOTE — a gap, stated. The duplicate scan reads ARRAY literals only. An object
 * whose KEY set is the category set is the same copy in a different costume, and
 * `CapabilityNavigator.tsx`'s `CATEGORY_THEME_MAP` was exactly that until D-012
 * removed it. Widening to object keys is a small change and deliberately not made
 * here; it was not what the rule was specified to do.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parseFile, propName, tsFilesIn, ts } from './ts-ast.mjs'

/** Every string-literal array in one file, as `{ name, values, at }`. */
function stringArrayLiterals(root, file) {
  const { sf, at } = parseFile(root, file)
  const out = []
  const visit = (node) => {
    if (ts.isArrayLiteralExpression(node) && node.elements.length > 0) {
      const values = node.elements.map((e) => (ts.isStringLiteralLike(e) ? e.text : null))
      if (values.every((v) => v !== null)) {
        // `as const`, a variable name, or a property name — whichever is nearest,
        // purely so a finding can say WHICH literal.
        let named = null
        let p = node.parent
        for (let hops = 0; p && hops < 3; hops++, p = p.parent) {
          if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) { named = p.name.text; break }
          if (ts.isPropertyAssignment(p)) { named = propName(p.name); break }
        }
        out.push({ name: named, values, at: at(node) })
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sf, visit)
  return out
}

const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

/**
 * @param declaredIn  { rel, constName } — the ONE place the rendered list lives
 * @param categories  (ctx) => string[] — the module's categories, from its questions
 */
export const makeCategoryUniverse = ({
  code = 'CATEGORY-UNIVERSE',
  label,
  declaredIn,
  categories,
}) => ({
  code,
  run(ctx) {
    const { fail, root } = ctx

    const fromData = [...new Set(categories(ctx))].sort()
    if (fromData.length === 0) {
      fail(`${label}: the question dataset yielded no categories, so there is nothing to compare a rendered list against`)
      return { examined: 0 }
    }

    // ── the declared location ────────────────────────────────────────────
    const abs = path.join(root, declaredIn.rel)
    if (!fs.existsSync(abs)) {
      fail(
        `${label}: the declared category list ${declaredIn.rel} does not exist — either it moved, in which case this rule ` +
          `file is stale, or it was deleted; nothing is being compared against ${fromData.length} dataset categories either way`,
      )
      return { examined: 0 }
    }
    const declaredLiterals = stringArrayLiterals(root, abs).filter((l) => l.name === declaredIn.constName)
    if (declaredLiterals.length === 0) {
      fail(
        `${label}: ${declaredIn.rel} has no array-of-strings named ${declaredIn.constName} — it was renamed, computed or ` +
          `moved, and the set comparison below has nothing to read`,
      )
      return { examined: 0 }
    }
    const declared = declaredLiterals[0].values

    // ── half 1: set equality ─────────────────────────────────────────────
    const declaredSet = [...new Set(declared)].sort()
    if (declaredSet.length !== declared.length)
      fail(`${label}: ${declaredIn.constName} lists a category twice — ${declared.join(', ')}`)

    for (const extra of declaredSet.filter((c) => !fromData.includes(c)))
      fail(
        `${label}: ${declaredIn.constName} renders "${extra}", which no question in the dataset carries. ` +
          `It scores as an empty category on every surface that iterates this list, and keeps ` +
          `answeredCategories < totalCategories true forever. D-011.`,
      )
    for (const missing of fromData.filter((c) => !declaredSet.includes(c)))
      fail(
        `${label}: the dataset has category "${missing}" and ${declaredIn.constName} does not render it — ` +
          `its questions are answerable and its score appears nowhere`,
      )

    // ── half 2: single declaration ───────────────────────────────────────
    // Repo-wide by design. This one IS a scan: the thing being looked for is a
    // COPY, and a copy can be anywhere.
    const copies = []
    for (const file of tsFilesIn(path.join(root, 'src'))) {
      for (const lit of stringArrayLiterals(root, file)) {
        if (!sameSet([...new Set(lit.values)].sort(), fromData)) continue
        const rel = path.relative(root, file)
        if (rel === declaredIn.rel && lit.name === declaredIn.constName) continue
        copies.push(`${lit.at}${lit.name ? ` (${lit.name})` : ''}`)
      }
    }
    if (copies.length > 0)
      fail(
        `${label}: ${copies.length} further array literal${copies.length === 1 ? '' : 's'} under src/ hold${copies.length === 1 ? 's' : ''} ` +
          `exactly this category set — ${copies.join(', ')}. One declaration is ${declaredIn.rel}::${declaredIn.constName}; ` +
          `import it. Three hand-maintained copies is how they diverged into a ninth category (D-011).`,
      )

    return {
      examined: declared.length,
      dataset: fromData.length,
      // Order is recorded and printed, never asserted — see this file's header.
      order: declared,
      copies,
    }
  },
})

/** The summary line. Prints the ORDER, which is the thing not being asserted. */
export const categoryUniverseSummary = (res, label, indent = '') => {
  if (!res || !res.examined) return `${label} category universe NOT READ — see findings`
  return (
    `${label} ${res.examined} rendered categories = ${res.dataset} in the dataset, one declaration` +
    `\n${indent}  order (reported, not asserted): ${res.order.join(' · ')}`
  )
}
