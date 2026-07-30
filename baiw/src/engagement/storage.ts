/**
 * Storage primitives for engagement identity.
 *
 * Two unnamespaced suite keys hold the registry itself; everything a module
 * persists is filed under `nsKey(base, engagementId)`. Nothing in here throws:
 * localStorage raises on quota exhaustion and is entirely absent in some private
 * modes, and every one of these functions is reachable from a render path. A
 * storage failure must degrade to empty state, never take the page down.
 */
import type { Engagement } from './types'
import { PERSISTED_BASES } from './types'

export const KEY_ENGAGEMENTS = 'wb.engagements'
export const KEY_ACTIVE = 'wb.engagement.active'

/**
 * The namespacing primitive. `::` is used because no legacy base key contains
 * it, so a namespaced key can never collide with an un-migrated one.
 */
export function nsKey(base: string, engagementId: string): string {
  return `${base}::${engagementId}`
}

/* ---------------------------------------------------------------- */
/*  Raw, never-throwing localStorage access                          */
/* ---------------------------------------------------------------- */

export function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // Quota exceeded, or storage disabled. The in-memory state stays correct for
    // this session; only durability is lost.
    return false
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* non-fatal */
  }
}

/* ---------------------------------------------------------------- */
/*  The engagement registry                                          */
/* ---------------------------------------------------------------- */

function isEngagement(v: unknown): v is Engagement {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Partial<Engagement>
  return (
    typeof e.id === 'string' &&
    e.id.length > 0 &&
    typeof e.orgName === 'string' &&
    typeof e.createdAt === 'string' &&
    typeof e.updatedAt === 'string' &&
    (e.layer === undefined || e.layer === 'core' || e.layer === 'banking' || e.layer === 'all') &&
    (e.notes === undefined || typeof e.notes === 'string')
  )
}

export function readEngagements(): Engagement[] {
  const raw = safeGet(KEY_ENGAGEMENTS)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Drop malformed rows rather than the whole registry: one corrupt record
    // should not cost the user every other engagement they have.
    return parsed.filter(isEngagement)
  } catch {
    return []
  }
}

export function engagementsExist(): boolean {
  return safeGet(KEY_ENGAGEMENTS) !== null
}

export function writeEngagements(list: Engagement[]): void {
  safeSet(KEY_ENGAGEMENTS, JSON.stringify(list))
}

export function readActiveId(): string | null {
  const v = safeGet(KEY_ACTIVE)
  return v === null || v === '' ? null : v
}

export function writeActiveId(id: string | null): void {
  if (id === null) safeRemove(KEY_ACTIVE)
  else safeSet(KEY_ACTIVE, id)
}

/* ---------------------------------------------------------------- */
/*  Namespaced module state                                          */
/* ---------------------------------------------------------------- */

export function readNsRaw(base: string, engagementId: string): string | null {
  return safeGet(nsKey(base, engagementId))
}

export function writeNsRaw(base: string, engagementId: string, raw: string): void {
  safeSet(nsKey(base, engagementId), raw)
}

export function removeNs(base: string, engagementId: string): void {
  safeRemove(nsKey(base, engagementId))
}

/** Delete every namespaced value belonging to one engagement. */
export function removeAllNs(engagementId: string): void {
  for (const base of PERSISTED_BASES) removeNs(base, engagementId)
}

/** Copy every namespaced value from one engagement to another. */
export function copyAllNs(fromId: string, toId: string): void {
  for (const base of PERSISTED_BASES) {
    const raw = readNsRaw(base, fromId)
    if (raw !== null) writeNsRaw(base, toId, raw)
  }
}

/** base → parsed value, for every base that has a value stored for this engagement. */
export function collectNs(engagementId: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const base of PERSISTED_BASES) {
    const raw = readNsRaw(base, engagementId)
    if (raw === null) continue
    try {
      out[base] = JSON.parse(raw)
    } catch {
      /* skip a value we cannot parse rather than aborting the whole export */
    }
  }
  return out
}

/** Write a `base → value` map under one engagement. Unknown bases are ignored. */
export function restoreNs(engagementId: string, data: Record<string, unknown>): void {
  for (const base of PERSISTED_BASES) {
    if (!(base in data)) continue
    try {
      writeNsRaw(base, engagementId, JSON.stringify(data[base]))
    } catch {
      /* value contains a cycle or a BigInt — skip it, keep the rest */
    }
  }
}

/* ---------------------------------------------------------------- */
/*  Identity helpers                                                 */
/* ---------------------------------------------------------------- */

/**
 * crypto.randomUUID() is only defined in a secure context. Serving the built app
 * over plain http on a LAN address is a real deployment for a consulting demo,
 * and an id generator that throws there would break engagement creation
 * entirely, so fall back to a same-shaped v4 string.
 */
export function newEngagementId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-'
    else if (i === 14) out += '4'
    else if (i === 19) out += hex[(Math.floor(Math.random() * 16) & 0x3) | 0x8]
    else out += hex[Math.floor(Math.random() * 16)]
  }
  return out
}

export function nowIso(): string {
  return new Date().toISOString()
}
