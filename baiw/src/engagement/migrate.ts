/**
 * One-time migration of pre-engagement localStorage into the first engagement.
 *
 * THIS MUST NOT LOSE DATA. A consultant may have a part-finished assessment in
 * this browser that exists nowhere else — there is no server and no backup. So
 * the migration only ever COPIES: the six legacy keys are read and written to
 * their namespaced equivalents and then left exactly where they are. Removal is
 * a later cleanup, once the copy is proven in a real browser; until then a bug
 * here costs nothing because the originals are still on disk.
 *
 * It is idempotent by two independent guards: it refuses to run once
 * `wb.engagements` exists, and the engagement it creates has a fixed sentinel id
 * rather than a fresh UUID, so a second run could only ever overwrite itself.
 */
import type { Engagement } from './types'
import { PERSISTED_BASES } from './types'
import {
  engagementsExist,
  nowIso,
  readNsRaw,
  safeGet,
  writeActiveId,
  writeEngagements,
  writeNsRaw,
} from './storage'

/**
 * Fixed id for the migrated engagement. A random one would make the migration
 * non-idempotent the moment the `wb.engagements` guard were ever bypassed.
 */
export const LEGACY_ENGAGEMENT_ID = '00000000-0000-4000-8000-000000000000'

/**
 * The migrated engagement carries no orgName because nothing in the pre-
 * engagement app ever stored one — the five report generators held it in
 * component state and threw it away. `engagementLabel()` is what renders it as
 * "Legacy engagement"; the moment the user types a client name into any report
 * form, rename() replaces that label with the real one.
 */
export const LEGACY_ENGAGEMENT_LABEL = 'Legacy engagement'

/** Runs at most once per page load, regardless of how many times it is called. */
let ran = false

export function migrateLegacyStorage(): void {
  if (ran) return
  ran = true

  // Already migrated (or the user started fresh under the new scheme).
  if (engagementsExist()) return

  const present = PERSISTED_BASES.filter((base) => safeGet(base) !== null)
  if (present.length === 0) return

  const at = nowIso()
  const legacy: Engagement = {
    id: LEGACY_ENGAGEMENT_ID,
    orgName: '',
    createdAt: at,
    updatedAt: at,
    notes: 'Created automatically from data saved before engagements existed.',
  }

  const copied: string[] = []
  for (const base of present) {
    const raw = safeGet(base)
    if (raw === null) continue
    // Never clobber a namespaced value that somehow already exists.
    if (readNsRaw(base, LEGACY_ENGAGEMENT_ID) !== null) continue
    writeNsRaw(base, LEGACY_ENGAGEMENT_ID, raw)
    copied.push(base)
  }

  writeEngagements([legacy])
  writeActiveId(LEGACY_ENGAGEMENT_ID)

  console.info(
    `[engagement] migrated ${copied.length} legacy key(s) into "${LEGACY_ENGAGEMENT_LABEL}": ` +
      `${copied.join(', ') || 'none'} — originals left in place`,
  )
}

/** Display name for an engagement. Empty orgName is normal, not an error state. */
export function engagementLabel(e: Engagement | null | undefined): string {
  if (!e) return 'No engagement'
  const name = e.orgName.trim()
  if (name) return name
  return e.id === LEGACY_ENGAGEMENT_ID ? LEGACY_ENGAGEMENT_LABEL : 'Untitled engagement'
}
