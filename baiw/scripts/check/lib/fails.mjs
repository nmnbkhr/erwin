/**
 * The finding collector.
 *
 * Was a module-global `fails` array of pre-formatted strings, with counts
 * re-derived by `fails.filter(f => f.startsWith('CSV-HEADER')).length`. Prefix
 * matching worked only because no code was a prefix of another; `CROSSWALK-SHAPE`
 * and a future `CROSSWALK-SHAPE-STRICT` would have silently counted together.
 * Rows are structured now and matched by exact code.
 *
 * Insertion order is the printed order and is therefore observable output. The
 * run order that produces it is declared in scripts/check.mjs and in each module's
 * `checks` array — never emergent from import order.
 */
export class Fails {
  #rows = []

  /** @param {string} code @param {string} msg */
  add(code, msg) {
    this.#rows.push({ code, msg })
  }

  /** A `fail(code, msg)` bound to this collector, for passing into checks. */
  bind() {
    return (code, msg) => this.add(code, msg)
  }

  /** A `fail(msg)` with the code fixed — what a single-code check receives. */
  bindTo(code) {
    return (msg) => this.add(code, msg)
  }

  /** Exact-code count. Drives the "— N REJECTED, see below" summary suffix. */
  countOf(code) {
    return this.#rows.filter((r) => r.code === code).length
  }

  get length() {
    return this.#rows.length
  }

  /** Total so far — the runner brackets each check with this to attribute emissions. */
  mark() {
    return this.#rows.length
  }

  all() {
    return [...this.#rows]
  }

  /** The one printed form: two-space indent, `CODE: message`. */
  lines() {
    return this.#rows.map((r) => `${r.code}: ${r.msg}`)
  }
}
