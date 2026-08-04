/**
 * Diagnostic answer shapes — pure, no React.
 *
 * G2 extends a stored answer from a bare `4` to `{ score: 4, evidence?: "…" }`,
 * because a maturity score without evidence is an opinion. Two shapes are
 * therefore live in storage at once and BOTH must stay readable forever:
 * existing engagements hold `{questionId: number}` maps under
 * `DIAGNOSTIC_ANSWERS_KEY`, there is no server and no backup, and the
 * migrate.ts contract applies one level down — a migration only ever upgrades,
 * never drops. The two shapes are disjoint (a number is never an object), so
 * shape-sniffing needs no version key: `normaliseAnswers` lifts a legacy
 * number to `{ score }` in memory, losslessly, and the first write persists
 * the new shape. The ANSWER-SHAPE gate runs these functions — this exact
 * compiled module — against both shapes and the malformed ones on every build.
 *
 * No React in this file on purpose: the gate compiles it as a tsModule, and
 * the report generators need `answerScores` outside a component. The hook
 * stays in answers.ts.
 */

export interface DiagnosticAnswer {
  /** 1..5 on the anchored scale. */
  score: number
  /** Optional free-text evidence note. Never required; absent ≠ empty string. */
  evidence?: string
}

/** What may be IN storage: legacy bare scores and G2 objects, freely mixed. */
export type StoredAnswerValue = number | DiagnosticAnswer
export type StoredAnswerMap = Record<string, StoredAnswerValue>
/** What the app works with after normalisation. */
export type AnswerMap = Record<string, DiagnosticAnswer>

const validScore = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5

const validValue = (v: unknown): boolean => {
  if (validScore(v)) return true // legacy shape
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const a = v as Record<string, unknown>
  return validScore(a.score) && (a.evidence === undefined || typeof a.evidence === 'string')
}

/**
 * Rejects the whole map if any value is malformed rather than dropping the bad
 * entry — the pre-G2 contract, unchanged: an out-of-range score would flow
 * straight into the weighted mean and produce a maturity no scale explains,
 * and a partially-dropped map would silently understate coverage.
 */
export function isAnswerMap(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
  return Object.values(parsed as Record<string, unknown>).every(validValue)
}

/**
 * Lift a stored map to the G2 shape, losslessly. A legacy `4` becomes
 * `{ score: 4 }`; an object passes through verbatim — evidence text is never
 * trimmed, rewritten or dropped here, because this function runs on every
 * read and any lossy step would compound.
 */
export function normaliseAnswers(stored: StoredAnswerMap): AnswerMap {
  const out: AnswerMap = {}
  for (const [id, v] of Object.entries(stored)) out[id] = typeof v === 'number' ? { score: v } : v
  return out
}

/**
 * The numeric view scoring.ts consumes. scorePillars/overallScore keep their
 * pre-G2 signature and math (non-negotiable): they take `{questionId: score}`
 * and iterate the QUESTION list, so an answer outside the applicable set is
 * never counted regardless of what this map carries.
 */
export function answerScores(answers: AnswerMap): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, a] of Object.entries(answers)) out[id] = a.score
  return out
}

/** Only the non-empty evidence notes — what the AR-01 appendix renders. */
export function answerEvidence(answers: AnswerMap): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [id, a] of Object.entries(answers))
    if (typeof a.evidence === 'string' && a.evidence.trim().length > 0) out[id] = a.evidence
  return out
}
