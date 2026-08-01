/**
 * TypeScript AST helpers, and one parse per file instead of three.
 *
 * CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL each called `ts.createSourceFile`
 * on the same eighteen files — fifty-four parses of eighteen files. They are
 * cached here now. The cache is keyed by absolute path and is per-process, so a
 * selftest run against a mutated copy under a different --root cannot read a
 * stale tree from the real one.
 *
 * `typescript` is already a devDependency — it is what `tsc -b` runs. Used here
 * only as a parser: no program, no type checker, and the generators are never
 * executed.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export { ts }

const cache = new Map()

/**
 * Parse once, hand out `{ sf, text, rel, at, lineOf }`.
 *
 * `setParentNodes = true` is load-bearing: `enclosingSpec` and `enclosingCall`
 * both walk `.parent` links that only exist when it is set.
 */
export const parseFile = (root, file) => {
  const hit = cache.get(file)
  if (hit) return hit
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const rel = path.relative(root, file)
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  const parsed = { sf, text, rel, lineOf, at: (node) => `${rel}:${lineOf(node)}` }
  cache.set(file, parsed)
  return parsed
}

/**
 * Sorted at every level: readdirSync returns directory order, which differs
 * between filesystems, so without this the reported spec-file list and the order
 * findings appear in are properties of the disk rather than of the repo.
 */
export const tsFilesIn = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
        .flatMap((e) => {
          const p = path.join(dir, e.name)
          return e.isDirectory() ? tsFilesIn(p) : /\.tsx?$/.test(e.name) ? [p] : []
        })
    : []

/** Property name as written, for identifiers, string keys and `['header']`. */
export const propName = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text
  return null
}

/**
 * Nearest enclosing array literal — the scope a duplicate is judged within.
 *
 * Per spec array, not per file: two generators in one file may legitimately each
 * declare a "CDE ID" column, and only a collision inside one spec collapses a
 * column.
 */
export const enclosingSpec = (node) => {
  for (let p = node.parent; p; p = p.parent) if (ts.isArrayLiteralExpression(p)) return p
  return null
}

/** Nearest enclosing call, for naming what the offending option belongs to. */
export const enclosingCall = (node) => {
  for (let p = node.parent; p; p = p.parent) if (ts.isCallExpression(p)) return p
  return null
}

/** `x.text(...)` / `x.y.text(...)`. */
export const isTextCall = (node) =>
  ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'text'

/** True if an empty string literal appears anywhere in this expression. */
export const hidesEmptyLiteral = (node) => {
  let found = false
  const scan = (x) => {
    if (ts.isStringLiteralLike(x) && x.text === '') found = true
    ts.forEachChild(x, scan)
  }
  scan(node)
  return found
}

/** One-line rendering of a node, for quoting it back in a finding. */
export const brief = (sf, node, max) => node.getText(sf).replace(/\s+/g, ' ').slice(0, max)
