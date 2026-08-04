/**
 * The refusal channel — D-020's fix, at the root.
 *
 * A designed refusal and a real failure used to share one channel: AR-55 and
 * AR-56 throw their refusal message by design (the GAP-REFUSAL / PLAN-REFUSAL
 * contract — the builder must enforce its own predicate for direct callers),
 * and `useDeliverable.ts::run()` caught that throw on the same line as every
 * real generation failure — `console.error('[dgiw] deliverable generation
 * failed', ...)`, tone 'error'. The channel said failure; the page said
 * by-design. Two surfaces, two verdicts, one event — and the committed
 * click-throughs' console-clean assertion could not drive a refusing button
 * at all without either failing on working behaviour or filtering by message
 * text, which hides a real error the day one carries similar wording.
 *
 * So a refusal is TYPED. Builders that refuse throw `Refusal`; everything
 * else keeps throwing plain `Error`. `run()` branches on `isRefusal`: a
 * refusal surfaces as tone 'info' with no console output, a real failure
 * keeps the error path exactly as it was. The REFUSAL-CHANNEL gate holds
 * both halves — every engagement-only builder throws this class, and the
 * refusal branch in useDeliverable carries no console.error.
 *
 * `isRefusal` deliberately checks the discriminants rather than using
 * `instanceof`: the gate compiles these modules into a separate esbuild
 * bundle, where a class identity comparison is false for the same class —
 * the name and the `refusal` marker survive any bundle boundary.
 */

export class Refusal extends Error {
  /** Discriminant that survives bundling, minification and serialisation. */
  readonly refusal = true as const

  constructor(message: string) {
    super(message)
    this.name = 'Refusal'
  }
}

/** True for a designed refusal from any bundle; false for every real fault. */
export function isRefusal(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'Refusal' || (err as { refusal?: unknown }).refusal === true)
  )
}
