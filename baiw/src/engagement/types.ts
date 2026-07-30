/**
 * Engagement identity — the suite-level answer to "whose work is this?".
 *
 * Before this module every workbench wrote to one fixed localStorage key
 * (`baiw-assessment`, `taiw_maturity`, …). Starting a second client's assessment
 * silently overwrote the first, and nothing recorded which client the surviving
 * answers belonged to. The client's name existed only as unpersisted component
 * state inside five report generators, so it vanished on navigation and could
 * not disagree with the stored answers because it was never stored beside them.
 *
 * An Engagement is that missing identity: one record per body of work, and a
 * namespace (`<base>::<engagement id>`) under which every module's state is
 * filed. It is a client-side content boundary, not a security boundary — there
 * is no server, no auth, and nothing here gates access to anything.
 */

export interface Engagement {
  /** crypto.randomUUID(), or a fallback of the same shape — see newEngagementId(). */
  id: string
  /** The client organisation. May be empty; use engagementLabel() for display. */
  orgName: string
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. Stamped by every mutation. */
  updatedAt: string
  /**
   * DGIW layer filter for this engagement. Structurally identical to DGIW's
   * `LayerFilter`, spelled out here so the suite-level module does not depend on
   * a module-level one.
   */
  layer?: 'core' | 'banking' | 'all'
  notes?: string
}

/**
 * Every base key a module persists under. The suite owns this list because
 * remove(), duplicate() and exportOne() must act on all of them — a base that is
 * added to a module but not added here leaks across engagement deletion.
 */
export const PERSISTED_BASES = [
  'baiw-assessment',
  'baiw-roadmap',
  'taiw_maturity',
  'taiw_roadmap',
  'haiw_maturity_answers',
  'haiw_roadmap_selections',
  // Never a legacy key: DGIW's diagnostic answers were component state and were
  // thrown away on every reload, so migrateLegacyStorage simply never finds one.
  // It belongs here for the other three things this list drives — duplicate,
  // export and delete. An engagement bundle that omitted the diagnostic would be
  // the same silent data loss the namespacing was built to end.
  'dgiw-diagnostic-answers',
] as const

export type PersistedBase = (typeof PERSISTED_BASES)[number]

/** Shape of the file written by exportOne() and accepted by importOne(). */
export interface EngagementBundle {
  kind: 'godaitec.engagement'
  version: 1
  exportedAt: string
  engagement: Engagement
  /** base key → the parsed value stored for this engagement under that base. */
  data: Record<string, unknown>
}
