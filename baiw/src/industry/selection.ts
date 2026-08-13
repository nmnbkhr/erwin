import { INDUSTRY_USE_CASES } from './registry'

/** Stored under the engagement namespace; order is registry order, not click order. */
export type UseCaseSelection = string[]

const IDS = new Set(INDUSTRY_USE_CASES.map((u) => u.id))

export function isUseCaseSelection(parsed: unknown): parsed is UseCaseSelection {
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) return false
  const ids = parsed as string[]
  return new Set(ids).size === ids.length && ids.every((id) => IDS.has(id))
}
/** Canonicalises writes and drops unknown ids; stored state can never depend on a missing case. */
export function canonicalSelection(ids: Iterable<string>): UseCaseSelection {
  const wanted = new Set(ids)
  return INDUSTRY_USE_CASES.map((u) => u.id).filter((id) => wanted.has(id))
}
