/**
 * Assessment snapshots — frozen, labelled captures of the diagnostic state.
 * Pure: no React, no storage, no clock. G6.
 *
 * ═══ A SNAPSHOT IS FROZEN ══════════════════════════════════════════════════
 *
 * The workbench learns time here, and the first rule of a time series is that
 * its points do not move. `captureSnapshot` takes a DEEP COPY of the answers,
 * targets, tier and layer — never a reference — and `Object.freeze`s every
 * level of it, so a later edit on the Diagnostic page can neither reach a
 * snapshot through a shared object nor mutate one directly. The SNAPSHOT-FROZEN
 * gate captures from a live map, mutates the live map, and asserts the
 * snapshot is structurally unchanged: a copy-by-reference implementation
 * fails the build.
 *
 * The store is APPEND-ONLY in tracking/log.ts's idiom: `appendSnapshot` is the
 * one legal mutation, and this module deliberately exports NO function that
 * can return a list with fewer or altered entries — the same no-edit-path
 * contract STATUS-LOG asserts against the tracking module, held here by the
 * same gate. This is the second audit-trail seed beside the status log, and
 * its shape (flat JSON records, one per capture) is meant to survive a future
 * backend migration unchanged.
 *
 * ─── WHAT IS CAPTURED, AND WHY THE LAYER IS IN IT ──────────────────────────
 *
 * answers (normalised to the G2 rich shape — a legacy map and its lossless
 * lift are the SAME state and must digest identically), targets, tier, AND
 * the layer filter. The layer is captured because it is an input to every
 * score: `scorePillars` over the same answers under 'core' and under 'all'
 * are different numbers, so a snapshot that omitted the layer would not be a
 * reproducible record of what was measured — the delta engine would have to
 * borrow TODAY'S filter, and a delta that changes when a view toggle moves is
 * noise wearing a trend costume (non-negotiable 2, read one axis further).
 *
 * ─── THE DIGEST IS THE /ID IDIOM, NOT A SECOND HASH ────────────────────────
 *
 * `snapshotDigest` folds the captured content through `contentKey` and
 * `stableFileId` — the exact functions the report spine seeds a PDF trailer
 * /ID from (imported from report/digest.ts, jsPDF-free on purpose). Two
 * captures of identical state carry identical digests whatever their labels;
 * one answer moved is a different digest. Every delta claim downstream cites
 * these digests, so a reader can name exactly which two frozen states
 * produced a number.
 *
 * The clock stays OUT of this file (the gate runs it deterministically);
 * trajectory/state.ts stamps `capturedAt` at the moment a person acts — the
 * one place a real timestamp is the honest value, tracking/state.ts's rule.
 */
import { contentKey, stableFileId } from '../../report/digest'
import { normaliseAnswers, type AnswerMap, type StoredAnswerMap } from '../answerShape'
import { isTargetMap, type TargetMap } from '../assessmentState'
import { isTier, type AssessmentTier } from '../tier'
import type { LayerFilter } from '../types'

export interface AssessmentSnapshot {
  /** Derived from capturedAt + digest — unique per capture, no randomness. */
  id: string
  /** The consultant's own name for the capture. Never empty — see captureSnapshot. */
  label: string
  /** ISO 8601, stamped by the state hook when the person captured. */
  capturedAt: string
  /** The tier the assessment was AT when captured. Deltas require it equal. */
  tier: AssessmentTier
  /** The layer filter in force at capture — an input to every score. */
  layer: LayerFilter
  /** Deep-frozen copy, normalised to the G2 rich shape. */
  answers: AnswerMap
  /** Deep-frozen copy. */
  targets: TargetMap
  /** stableFileId over the captured content. Label and time deliberately excluded. */
  digest: string
}

/** What a capture reads from the live stores. */
export interface LiveAssessmentState {
  answers: StoredAnswerMap
  targets: TargetMap
  tier: AssessmentTier
  layer: LayerFilter
}

/* ── internals ─────────────────────────────────────────────────────────── */

/** Structural copy through JSON — every stored shape here is JSON by construction. */
const deepCopy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

const deepFreeze = <T>(v: T): T => {
  if (v !== null && typeof v === 'object') {
    for (const k of Object.keys(v as object)) deepFreeze((v as Record<string, unknown>)[k])
    Object.freeze(v)
  }
  return v
}

const LAYERS: readonly string[] = ['all', 'core', 'banking']

/* ── the digest ────────────────────────────────────────────────────────── */

/**
 * The digest of a snapshot's CONTENT — tier, layer, every answer with its
 * evidence, every target. Label and capturedAt are identity, not content:
 * two captures of an unchanged assessment must collide here, because "nothing
 * moved" is exactly what an identical digest states.
 */
export function snapshotDigest(
  answers: AnswerMap,
  targets: TargetMap,
  tier: AssessmentTier,
  layer: LayerFilter,
): string {
  return stableFileId(
    contentKey([
      `tier:${tier}`,
      `layer:${layer}`,
      ...Object.entries(answers).map(
        ([id, a]) => `a:${id}=${a.score}:${a.evidence ?? ''}`,
      ),
      ...Object.entries(targets).map(([id, t]) => `t:${id}=${t}`),
    ]),
  )
}

/* ── capture — the only constructor ────────────────────────────────────── */

/**
 * A frozen snapshot of the live state. Capture is DELIBERATE: it takes a
 * label, and an empty one is rejected here rather than in the UI, so no call
 * path can file an unnamed point into the record (the UI may default-suggest
 * "Baseline"; it may not pass '').
 */
export function captureSnapshot(
  live: LiveAssessmentState,
  label: string,
  capturedAt: string,
): AssessmentSnapshot {
  const trimmed = label.trim()
  if (trimmed.length === 0) {
    throw new Error('A snapshot needs a label — an unnamed point cannot be cited by any delta.')
  }
  const answers = deepCopy(normaliseAnswers(live.answers))
  const targets = deepCopy(live.targets)
  const digest = snapshotDigest(answers, targets, live.tier, live.layer)
  return deepFreeze({
    id: `snap-${capturedAt}-${digest.slice(0, 8)}`,
    label: trimmed,
    capturedAt,
    tier: live.tier,
    layer: live.layer,
    answers,
    targets,
    digest,
  })
}

/* ── append — the ONLY way a list changes ──────────────────────────────── */

/**
 * A new list with the snapshot appended. The input list is untouched, so a
 * caller holding the old value holds the old record — appendTransition's
 * contract, applied to the second audit-trail seed.
 */
export function appendSnapshot(
  list: AssessmentSnapshot[],
  snapshot: AssessmentSnapshot,
): AssessmentSnapshot[] {
  return [...list, snapshot]
}

/* ── reads ─────────────────────────────────────────────────────────────── */

/** True when two snapshots may be compared at all — same tier AND same layer. */
export function snapshotsComparable(a: AssessmentSnapshot, b: AssessmentSnapshot): boolean {
  return a.tier === b.tier && a.layer === b.layer
}

/**
 * Every comparable ordered pair [earlier, later], most recent pair first —
 * so a UI wanting "the two most recent comparable snapshots" reads pairs[0].
 * Capture order breaks capturedAt ties (two captures can share a timestamp
 * only in a seeded fixture, but a total order must not depend on luck).
 */
export function comparableSnapshotPairs(
  list: AssessmentSnapshot[],
): [AssessmentSnapshot, AssessmentSnapshot][] {
  const ordered = [...list].sort(
    (x, y) => (x.capturedAt < y.capturedAt ? -1 : x.capturedAt > y.capturedAt ? 1 : list.indexOf(x) - list.indexOf(y)),
  )
  const pairs: [AssessmentSnapshot, AssessmentSnapshot][] = []
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      if (snapshotsComparable(ordered[i], ordered[j])) pairs.push([ordered[i], ordered[j]])
    }
  }
  // Most recent LATER snapshot first; among those, most recent earlier one.
  return pairs.sort(
    (p, q) =>
      (q[1].capturedAt < p[1].capturedAt ? -1 : q[1].capturedAt > p[1].capturedAt ? 1 : 0) ||
      (q[0].capturedAt < p[0].capturedAt ? -1 : q[0].capturedAt > p[0].capturedAt ? 1 : 0),
  )
}

/* ── shape guard, for usePersistedState ────────────────────────────────── */

const isRichAnswerMap = (v: unknown): boolean => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  return Object.values(v as Record<string, unknown>).every((a) => {
    if (typeof a !== 'object' || a === null) return false
    const s = (a as { score?: unknown }).score
    return typeof s === 'number' && Number.isInteger(s) && s >= 1 && s <= 5
  })
}

const isSnapshot = (v: unknown): boolean => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const s = v as Record<string, unknown>
  return (
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.label === 'string' && s.label.trim().length > 0 &&
    typeof s.capturedAt === 'string' && s.capturedAt.length > 0 &&
    isTier(s.tier) &&
    typeof s.layer === 'string' && LAYERS.includes(s.layer) &&
    isRichAnswerMap(s.answers) &&
    isTargetMap(s.targets) &&
    typeof s.digest === 'string' && /^[0-9A-F]{32}$/.test(s.digest as string)
  )
}

/** A stored value that fails this is ignored, never crashed on. */
export function isSnapshotList(parsed: unknown): boolean {
  return Array.isArray(parsed) && parsed.every(isSnapshot)
}
