/**
 * Declared-order comparators for report content.
 *
 * `byStringKey` lives in csv.ts because the two CSV generators already import it
 * and moving it would be a rewrite rather than an addition. These are its
 * numeric siblings, needed by the PDF generators, which order things by id
 * ordinal rather than by id text.
 *
 * The hazard they exist to remove: ids in this module are NOT zero-padded
 * uniformly. `CDE-001` and `DQ-001` are, so code-unit order is numeric order and
 * `byStringKey` is correct for them. `G1..G11`, `RO1..RO10`, `F1..F7` and
 * `W0..W6` are not — sorted as text, `G10` and `G11` land between `G1` and `G2`,
 * and a reader sees a gate sequence that is wrong in a way that looks deliberate.
 * Nothing in the type system distinguishes the two families, so the choice of
 * comparator is a per-call judgement and each call site states which it used.
 */

/** Ascending by a numeric field. NaN sorts last rather than poisoning the order. */
export function byNumber<T>(pick: (row: T) => number): (a: T, b: T) => number {
  return (a, b) => {
    const x = pick(a)
    const y = pick(b)
    if (Number.isNaN(x)) return Number.isNaN(y) ? 0 : 1
    if (Number.isNaN(y)) return -1
    return x - y
  }
}

/**
 * The digits in an id, as a number: `G10` → 10, `RO3` → 3, `F1-S2` → 12.
 *
 * The compound form is why this is only ever used on whole-record ids and never
 * on step ids — `F1-S2` collapsing to 12 would sort after `F1-S10` → 110. Step
 * order comes from the array the dataset declares them in.
 *
 * Returns NaN for an id with no digits, which `byNumber` sorts last instead of
 * silently treating as 0 and floating it to the top.
 */
export function idOrdinal(id: string): number {
  const digits = id.replace(/\D+/g, '')
  return digits === '' ? Number.NaN : Number(digits)
}
