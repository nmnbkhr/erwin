/**
 * The CDE spine — the three joins Wave A's four register pivots share.
 *
 * ─── WHY THIS FILE EXISTS AT ALL ───────────────────────────────────────────
 *
 * AR-23, AR-20, AR-02 and AR-05 are four documents at four different grains —
 * element, reference-model entity, source system, consumption point — over ONE
 * dataset and the same three relations. Verifying those relations once is the
 * whole argument for building them together, so they read one implementation of
 * the join rather than four that can drift apart under a later edit.
 *
 * ─── THE RELATIONS, MEASURED AGAINST THE COUNTER HYPOTHESIS ────────────────
 *
 * `HCF-LINK` proved `capabilityLinks` complete on 720 of 720 HACR questions and
 * the relation was `'HCF-' + pad(((i + 1) % 108) + 1)` — a modulo counter. A
 * check that a foreign key resolves is not a check that the relation is real, so
 * each of these was measured for the shape a counter would leave behind. What
 * would make each one a counter is stated first, then what was found:
 *
 * `consumers` — a counter gives FIXED ARITY and reuses a small vocabulary on a
 *   stride, so `consumers[0][i] === vocab[(i + k) % V]` for some k.
 *   Found: arity 3/4/5 (32/40/4 elements) with NO period fitting anywhere in
 *   1..38; 234 distinct values over 276 links, of which **206 appear exactly
 *   once**; no strided offset fits the 69-value first-consumer vocabulary. A
 *   cycle reuses everything by construction — 206 single-use values is the
 *   opposite of one. Domain-coherent besides: customer elements feed eCIB, KYC
 *   and AML, loan elements feed ECL, IFRS 9 staging and repricing.
 *
 * `sourceSystem` — a counter assigns positionally, so each reference-model
 *   entity would carry exactly one system and the sequence would fit a period.
 *   Found: **11 of 53 entities are sourced by more than one system** — Agreement
 *   Balance by four (loans, accounts, cards, the IFRS 9 engine), Agreement
 *   Classification by four — and no period fits. The IRREGULARITY is the
 *   evidence, and it is the same irregularity a bank actually has.
 *
 * `ownerRole` — a counter would cycle the registry.
 *   Found: 19 distinct titles, **0 unresolved** through `roleRegistry`, no
 *   period. Note the archetype distribution is lopsided — 72 of 76 elements
 *   resolve to Data Owner — which is correct rather than suspicious: a CDE owner
 *   is a business department head by definition, and P01's own principle says
 *   accountability sits with the business. The documents print it rather than
 *   letting a reader expect variety and infer a bug.
 *
 * ─── WHAT IS NOT HERE ──────────────────────────────────────────────────────
 *
 * No system-to-system relation, no transformation hop, no column binding, no
 * designation. Those are AR-25, AR-24 and AR-14's withdrawn half, and the
 * register records each one as blocked or renamed with the apparent path that
 * does not hold. Nothing in this file may be composed into one.
 *
 * `cdeRegister.ts` predates this module and keeps its own copy of the layer
 * filter. It is deliberately NOT migrated here: it is a shipped generator with a
 * freshly walked baseline, the duplication is a two-line predicate, and moving
 * it would put a behaviour-preserving refactor of AR-13 inside a feature that is
 * about four other artefacts. Same reasoning as `QuickAssessment.tsx` not being
 * unified onto `maturity.ts`. It re-exports `UNRESOLVED_OWNER` from here so at
 * least the vocabulary has one definition.
 *
 * NO jsPDF IMPORT, DIRECT OR TRANSITIVE. Three of the four artefacts are CSV
 * primary and a CSV export must not pull the PDF engine — the rule `csv.ts`
 * states and the reason this module cannot simply import from `cdeRegister.ts`.
 */
import { layerShows } from '../layer'
import { archetypeOf } from '../roles'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import type { CriticalDataElement, DqRule, LayerFilter } from '../types'

const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]

/** Every element in the register, in scope or not. Denominators are printed. */
export const ALL_CDES = CDES.length

/**
 * Emitted instead of a blank when a free-text owner is not in the role registry.
 * A blank cell in a spreadsheet reads as "no owner" when the truth is "owner not
 * in the registry", and those are opposite statements.
 */
export const UNRESOLVED_OWNER = 'UNRESOLVED'

/** Elements the active layer puts in scope, in declared file order. */
export function cdesInScope(layer: LayerFilter): CriticalDataElement[] {
  return CDES.filter((c) => layerShows(layer, c.layer))
}

/**
 * Rules per element, counting only rules that are themselves in scope. A
 * core-only engagement should not be told an element carries fifteen rules when
 * twelve of them are banking rules it will never run.
 */
export function ruleCountByCde(layer: LayerFilter): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of RULES) if (layerShows(layer, r.layer)) counts.set(r.cdeRef, (counts.get(r.cdeRef) ?? 0) + 1)
  return counts
}

/** The governance archetype an owner title discharges, never a blank. */
export function ownerArchetype(c: CriticalDataElement): string {
  return archetypeOf(c.ownerRole) || UNRESOLVED_OWNER
}

/**
 * Group rows by a derived key, first-appearance order preserved.
 *
 * Deliberately NOT sorted here. Every caller sorts explicitly with `byStringKey`
 * before rendering, for the reason `cdeRegister.ts` gives: an order inherited
 * from the dataset is an accident a later edit can reverse silently, and an
 * order declared at the call site is a property of the document.
 */
export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const r of rows) out.set(key(r), [...(out.get(key(r)) ?? []), r])
  return out
}

/** Deterministic tally over an already-ordered row set, first-seen order. */
export function tally<T>(rows: T[], pick: (r: T) => string[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const r of rows) for (const k of pick(r)) counts.set(k, (counts.get(k) ?? 0) + 1)
  return [...counts.entries()]
}

/**
 * The scope line every one of these documents prints.
 *
 * "Scored N of M" is the rule one level up in `maturity.ts`, for the same
 * reason: 32 systems from a core-only engagement is not the same claim as 32
 * from the full register, and the number alone cannot tell them apart.
 */
export function scopeLine(layer: LayerFilter, inScope: number): string {
  return `${inScope} of ${ALL_CDES} governed elements in scope (${
    layer === 'all' ? 'core chassis + banking overlay' : `${layer} layer only`
  })`
}
