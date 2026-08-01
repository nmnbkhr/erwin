/**
 * Generic row assertions, extracted so a second module's dataset rules start from
 * them instead of from a copy.
 *
 * Each takes `fail` explicitly rather than closing over a module-global one. The
 * code is a parameter too: `unique` emitted UNIQUE and `sorted`/`shapeCheck`
 * emitted CROSSWALK-SHAPE because that is where they happened to be written, not
 * because a sort violation is inherently a crosswalk defect. D4 will want
 * `sorted` under a TAIW code.
 */

/** Duplicate ids. Emits UNIQUE, which is what every existing call site expects. */
export const unique = (fail, name, ids) => {
  const seen = new Set()
  for (const i of ids) {
    if (seen.has(i)) fail('UNIQUE', `duplicate ${name} id "${i}"`)
    seen.add(i)
  }
  return ids.length
}

/**
 * Declared sort. Same discipline as the CSV registers: the order is a property
 * of the file, not of whatever the author happened to type.
 */
export const sorted = (fail, code, name, ids) => {
  for (let i = 1; i < ids.length; i++)
    if (!(ids[i - 1] < ids[i])) {
      fail(code, `${name} is not sorted by id: ${ids[i - 1]} precedes ${ids[i]}`)
      break
    }
  return ids.length
}

export const near = (a, b, eps = 0.001) => Math.abs(a - b) <= eps

/**
 * Row shape with an explicit allow-list.
 *
 * Unknown keys FAIL. A typo'd key reads as undefined, contributes zero weight,
 * and produces a scorecard that is quietly wrong rather than loudly broken —
 * the exact failure this module keeps finding.
 */
export const shapeCheck = (fail, code, label, rows, spec, required) => {
  const allowed = new Set(Object.keys(spec))
  for (const [i, row] of rows.entries()) {
    const where = `${label}[${i}]${row?.id ? ` (${row.id})` : ''}`
    if (typeof row !== 'object' || row === null) {
      fail(code, `${where} is not an object`)
      continue
    }
    for (const k of Object.keys(row))
      if (!allowed.has(k)) fail(code, `${where} has unknown field "${k}" — a typo'd key silently contributes nothing`)
    for (const [k, test] of Object.entries(spec)) {
      const present = row[k] !== undefined
      if (!present) {
        if (required.includes(k)) fail(code, `${where} is missing required field "${k}"`)
        continue
      }
      const problem = test(row[k])
      if (problem) fail(code, `${where} field "${k}" ${problem}`)
    }
  }
  return rows.length
}

export const str = (min = 1) => (v) =>
  typeof v !== 'string' ? `must be a string, got ${typeof v}` : v.trim().length < min ? `must be a non-empty string` : null
export const num = (v) => (typeof v !== 'number' || Number.isNaN(v) ? `must be a number, got ${JSON.stringify(v)}` : null)
export const idLike = (re) => (v) =>
  typeof v !== 'string' ? 'must be a string' : re.test(v) ? null : `does not match ${re} — ids are zero-padded fixed width so code-unit order is numeric order`
export const oneOf = (vals) => (v) => (vals.includes(v) ? null : `must be one of ${vals.join(', ')}, got ${JSON.stringify(v)}`)
