/**
 * Program intake — the engagement's own answers to "what is this programme?".
 *
 * G1: DGIW's program-design artefacts (the AR-08 charter, and the council /
 * RACI sections of AR-09) are generated FROM this intake when it is actionable,
 * and fall back to reference content — watermarked ILLUSTRATIVE on every page —
 * when it is not. Canned content presented as client-specific is the D-001
 * shape, and this module is the boundary that prevents it: every
 * client-specific string in a generated document traces to a field here, or is
 * absent.
 *
 * TWO RULES THIS FILE ENFORCES BY CONSTRUCTION
 *
 *  - Pillar scope is validated against `data/pillars.json`, never against a
 *    second hardcoded list. `PILLAR_IDS` below is derived from the dataset at
 *    module load; a hand-typed copy is the SuiteLanding defect one level down.
 *    The INTAKE-SCOPE gate holds the same promise for the stored fixture.
 *  - `intakeIsActionable` is the ONLY thing that switches a generator out of
 *    reference mode. One function, imported everywhere, never re-derived — the
 *    `layerShows` principle. The INTAKE-MODE gate asserts the generators
 *    import it and carry no inline second predicate.
 */
import pillars from '../data/pillars.json'

export const SECTORS = ['banking', 'trade', 'health', 'public', 'other'] as const
export type Sector = (typeof SECTORS)[number]

export const SIZE_BANDS = ['under-500', '500-2000', '2000-10000', 'over-10000'] as const
export type SizeBand = (typeof SIZE_BANDS)[number]

export const CADENCES = ['monthly', 'quarterly'] as const
export type Cadence = (typeof CADENCES)[number]

/**
 * The primary driver is a REFERENCE into one of the two driver lists, not a
 * copy of the string — a duplicated string could be edited in one place and
 * not the other, and then the charter's headline driver would be a value the
 * driver list no longer contains.
 */
export interface PrimaryDriverRef {
  list: 'regulatory' | 'strategic'
  index: number
}

export interface IntakeRaciRow {
  activity: string
  R: string
  A: string
  C: string
  I: string
}

export interface ProgramIntake {
  org: {
    /** The only mandatory field. Everything else may be absent. */
    name: string
    sector: Sector | null
    sizeBand: SizeBand | null
  }
  drivers: {
    regulatory: string[]
    strategic: string[]
    primary: PrimaryDriverRef | null
    /**
     * G3: driver → pillar ids, filled BY THE CONSULTANT on /dg/design and
     * validated against pillars.json — never inferred by matching driver text
     * against pillar names. Keys are `driverKey(list, index)` — a reference
     * into the two lists on the PrimaryDriverRef precedent, remapped on row
     * removal exactly as `primary` is. Optional: intakes stored before G3
     * lack it, and every reader treats absence as `{}` (the answerShape
     * migration idiom — lossless, no version bump, first write persists it).
     */
    driverPillars?: Record<string, string[]>
  }
  scope: {
    /** Subset of the pillar ids in data/pillars.json — see `validScopeIds`. */
    pillarIds: string[]
  }
  sponsorship: {
    sponsorTitle: string
    chairTitle: string
    cadence: Cadence | null
    escalationPath: string
  }
  raci: IntakeRaciRow[]
  meta: {
    completedAt: string | null
    version: 1
  }
}

/** The pillar id universe, derived from the dataset — never a second list. */
export const PILLAR_IDS: readonly string[] = pillars.map((p) => p.id)
const PILLAR_ID_SET = new Set(PILLAR_IDS)

/** Pillar name lookup for rendering scope sections. */
export const PILLAR_NAMES: ReadonlyMap<string, string> = new Map(pillars.map((p) => [p.id, p.name]))

/** Short pillar labels, for compact controls like the driver-pillar chips. */
export const PILLAR_SHORTS: ReadonlyMap<string, string> = new Map(pillars.map((p) => [p.id, p.short]))

/**
 * The ids in an intake's scope that exist in pillars.json. Anything else is
 * ignored everywhere — a stored id the dataset no longer carries must not make
 * an intake actionable, and must never render as a scope pillar.
 */
export function validScopeIds(intake: ProgramIntake): string[] {
  return intake.scope.pillarIds.filter((id) => PILLAR_ID_SET.has(id))
}

/** Driver strings with the blanks removed — a row added and left empty is not a driver. */
export function namedDrivers(intake: ProgramIntake): { regulatory: string[]; strategic: string[] } {
  const clean = (xs: string[]) => xs.map((x) => x.trim()).filter((x) => x.length > 0)
  return { regulatory: clean(intake.drivers.regulatory), strategic: clean(intake.drivers.strategic) }
}

/** The primary driver's text, or null when the reference is unset or dangling. */
export function primaryDriverText(intake: ProgramIntake): string | null {
  const ref = intake.drivers.primary
  if (!ref) return null
  const text = intake.drivers[ref.list][ref.index]
  return text && text.trim().length > 0 ? text.trim() : null
}

/**
 * THE mode switch. True only when the intake names the organisation, at least
 * one driver, and at least one in-scope pillar that exists in pillars.json.
 *
 * This is the single predicate that moves a generator from ILLUSTRATIVE
 * reference mode to engagement mode. Import it; never re-derive it — two
 * copies drifting apart would let one surface watermark a document another
 * surface presented as client-specific, which is worse than either alone.
 */
export function intakeIsActionable(intake: ProgramIntake): boolean {
  const d = namedDrivers(intake)
  return (
    intake.org.name.trim().length > 0 &&
    d.regulatory.length + d.strategic.length >= 1 &&
    validScopeIds(intake).length >= 1
  )
}

/** Storage key for a driver's pillar mapping — a reference, never the text. */
export function driverKey(list: 'regulatory' | 'strategic', index: number): string {
  return `${list}:${index}`
}

export interface MappedDriver {
  key: string
  list: 'regulatory' | 'strategic'
  index: number
  text: string
  /** Only ids that exist in pillars.json — a stale id contributes nothing. */
  pillarIds: string[]
}

/**
 * The drivers that count toward gap priority: NAMED (non-blank text) and
 * MAPPED to at least one pillar id that exists in pillars.json. A blank row,
 * an unmapped driver, or a mapping whose every id is stale contributes
 * nothing — absence is absence, exactly as `namedDrivers` treats blanks.
 */
export function mappedDrivers(intake: ProgramIntake): MappedDriver[] {
  const mapping = intake.drivers.driverPillars ?? {}
  const out: MappedDriver[] = []
  for (const list of ['regulatory', 'strategic'] as const) {
    intake.drivers[list].forEach((text, index) => {
      if (text.trim().length === 0) return
      const pillarIds = (mapping[driverKey(list, index)] ?? []).filter((id) => PILLAR_ID_SET.has(id))
      if (pillarIds.length === 0) return
      out.push({ key: driverKey(list, index), list, index, text: text.trim(), pillarIds })
    })
  }
  return out
}

/**
 * Seed activities for the RACI editor. A STARTING POINT for the consultant to
 * edit, not reference content a generator may render on its own: a row whose
 * cells were never filled in never reaches a document (the generators drop
 * rows with no assignment), so these strings cannot masquerade as
 * client-specific decisions.
 */
export const SEED_RACI_ACTIVITIES: readonly string[] = [
  'Approve data policies and standards',
  'Approve changes to the CDE register',
  'Arbitrate contested definitions',
  'Approve and review policy exceptions',
  'Prioritise data quality remediation',
]

export function emptyIntake(): ProgramIntake {
  return {
    org: { name: '', sector: null, sizeBand: null },
    drivers: { regulatory: [], strategic: [], primary: null, driverPillars: {} },
    scope: { pillarIds: [] },
    sponsorship: { sponsorTitle: '', chairTitle: '', cadence: null, escalationPath: '' },
    raci: SEED_RACI_ACTIVITIES.map((activity) => ({ activity, R: '', A: '', C: '', I: '' })),
    meta: { completedAt: null, version: 1 },
  }
}

/**
 * Shape guard for `usePersistedState` — a stored value that fails it is
 * ignored rather than crashing a render. Checks structure, not content:
 * content rules (a dangling pillar id, a blank driver) degrade through the
 * helpers above instead of invalidating the whole intake.
 */
export function isProgramIntake(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null) return false
  const p = parsed as Record<string, unknown>
  const org = p.org as Record<string, unknown> | undefined
  const drivers = p.drivers as Record<string, unknown> | undefined
  const scope = p.scope as Record<string, unknown> | undefined
  const sponsorship = p.sponsorship as Record<string, unknown> | undefined
  const meta = p.meta as Record<string, unknown> | undefined
  // driverPillars is optional (pre-G3 intakes lack it) but when present it
  // must be a record of arrays — a malformed mapping is a malformed intake.
  const dp = drivers?.driverPillars
  const driverPillarsOk =
    dp === undefined ||
    (typeof dp === 'object' &&
      dp !== null &&
      !Array.isArray(dp) &&
      Object.values(dp as Record<string, unknown>).every((v) => Array.isArray(v)))
  return (
    typeof org?.name === 'string' &&
    Array.isArray(drivers?.regulatory) &&
    Array.isArray(drivers?.strategic) &&
    driverPillarsOk &&
    Array.isArray(scope?.pillarIds) &&
    typeof sponsorship?.sponsorTitle === 'string' &&
    Array.isArray(p.raci) &&
    meta?.version === 1
  )
}
