/**
 * HACR — the facts three surfaces share: the assessment screen, the PDF report
 * and the dashboard preview.
 *
 * WHY THIS FILE EXISTS
 *
 * `HACR_CATEGORIES` and `CODE_TO_CATEGORY` lived inside
 * `utils/healthReportGenerator.ts`, un-exported. That was fine while the report
 * was the only thing that needed them. D-013 needs them on the dashboard, and the
 * dashboard cannot import the generator: it is 1,400 lines and pulls jsPDF and the
 * whole spine into whatever chunk imports it. The two honest options were a second
 * copy of the list — which is exactly the shape `CATEGORY-UNIVERSE` exists to
 * reject, three copies being how BAIW's diverged into a ninth category — or one
 * declaration both import. This is the second, and it mirrors
 * `src/data/bacrCategories.ts`, which D-012 created for the same reason.
 *
 * `CATEGORY-UNIVERSE` declares this file as HACR's single location and asserts the
 * list against `hacrQuestions.json` on every build, so "these eight are the
 * categories" is a checked fact rather than a copied one.
 *
 * ATTRIBUTION WITHOUT THE QUESTION BANK. `hacrQuestions.json` is 1.18 MB. A
 * consumer that only needs to know which category an ANSWER belongs to does not
 * have to load it, because the id says so: `HACR-SL-001` carries `SL`.
 * `HACR-CATEGORY-MAP` asserts, for all 720 questions, that the code and the
 * question's own `category` field select the same category — so the screen's
 * partition (by field) and the report's (by code) are the same partition, and a
 * third consumer reading the code is reading the same thing they are.
 */
import { readNsRaw } from '../engagement/storage'
import { scoreCategories, type Applicable, type CategoryOutcome } from '../scoring/maturity'
import type { HaiwAssessmentAnswer as HacrAnswer } from './types'

/**
 * Where a client's answers are filed, before namespacing.
 *
 * ONE CONSTANT, NOT A STRING PER READER. D4's site 3 was a component reading the
 * bare `taiw_maturity` key that nothing had written since answers were filed per
 * engagement — a reader and a writer that disagreed about the name, held apart by
 * nothing. Both HAIW readers take the name from here, and both go through
 * `engagement/storage`'s namespacing rather than touching `localStorage`.
 */
export const HACR_ANSWERS_KEY = 'haiw_maturity_answers'

/** The eight, in the order every HAIW surface renders them. */
export const HACR_CATEGORIES = [
  'Strategy & Leadership',
  'Workforce & Skills',
  'Data Governance & Standards',
  'Infrastructure & Systems',
  'Analytics & Intelligence',
  'Integration & Interoperability',
  'Patient & Community Engagement',
  'Outcomes & Impact',
] as const

export type HacrCategoryName = (typeof HACR_CATEGORIES)[number]

/**
 * Questions per category. HACR is uniform at 90 × 8 = 720, and
 * `HACR-CATEGORY-MAP` fails the build if it stops being.
 *
 * It is asserted rather than assumed because a consumer that has the answers but
 * not the questions needs it to say how many questions a category HAS — which is
 * the only thing separating `not-assessed` ("nobody has answered these yet") from
 * `not-applicable` ("there is nothing here to answer"). Getting it wrong does not
 * move any mean, since `aggregate()` divides by the answered count; it misstates
 * the applicable count, and this repo's whole D-003 lesson is that an unmeasured
 * thing must be described exactly.
 */
export const HACR_QUESTIONS_PER_CATEGORY = 90

/** The id's middle code selects the category: `HACR-SL-001` → Strategy & Leadership. */
const CATEGORY_BY_CODE: Readonly<Record<string, HacrCategoryName>> = {
  SL: 'Strategy & Leadership',
  WS: 'Workforce & Skills',
  DG: 'Data Governance & Standards',
  IS: 'Infrastructure & Systems',
  AI: 'Analytics & Intelligence',
  II: 'Integration & Interoperability',
  PC: 'Patient & Community Engagement',
  OI: 'Outcomes & Impact',
}

/**
 * The category a question id names, or `null` when the id names none.
 *
 * `null` rather than a fallback category on purpose. An unattributable id is
 * dropped by every caller; guessing it into a bucket would put one category's
 * evidence under another's heading, which is the D-001 shape at question scale.
 */
export const hacrCategoryOf = (questionId: string): HacrCategoryName | null =>
  CATEGORY_BY_CODE[questionId.split('-')[1]] ?? null

/** The code → category table itself, for callers that hold codes rather than ids. */
export const HACR_CATEGORY_BY_CODE = CATEGORY_BY_CODE

// ── The dashboard radar's data ──────────────────────────────────────────────
/*
 * Lives here rather than in `components/HaiwDashboard.tsx` for two reasons, and
 * the second is the one that matters:
 *
 *   - `react-refresh/only-export-components` is right. A component file that also
 *     exports a function is a file two things import for two reasons.
 *   - IT CAN BE DRIVEN. No golden fixture reaches a React component — the harness
 *     renders PDFs — and D-012 and D-013 both lived on exactly that surface,
 *     unseen by every check in the repo for two phases. `npm run drive:dashboards`
 *     calls `hacrRadarState` with seeded answers and prints the outcome per
 *     category. That is the only evidence available that an unanswered category
 *     reads NOT ASSESSED rather than 2.
 */

/**
 * Bucket a client's answers by the category their question id names, and score.
 *
 * Each category is padded to `HACR_QUESTIONS_PER_CATEGORY`. That padding is what
 * keeps `not-assessed` distinct from `not-applicable`: a category nobody has
 * touched has 90 applicable questions and no answers, which is a different fact
 * from a category with no questions at all — the two states `dgiw/scoring.ts` says
 * must never collapse into each other. It moves no mean, because `aggregate()`
 * divides by the ANSWERED count.
 */
export function scoreHacrAnswers(answers: readonly HacrAnswer[]): CategoryOutcome[] {
  const byCategory = new Map<string, Applicable[]>(HACR_CATEGORIES.map((c) => [c, []]))
  for (const a of answers) {
    const cat = hacrCategoryOf(a.questionId)
    // An unattributable id is dropped rather than guessed into a bucket.
    if (cat) byCategory.get(cat)!.push({ weight: 1, answer: a })
  }
  return scoreCategories(
    HACR_CATEGORIES.map((name) => {
      const found = byCategory.get(name)!
      const unanswered = Math.max(0, HACR_QUESTIONS_PER_CATEGORY - found.length)
      return {
        name,
        entries: [...found, ...Array.from({ length: unanswered }, () => ({ weight: 1, answer: undefined }))],
      }
    }),
  )
}

/** The stored answers for one engagement, or none. Read-only; never writes. */
function readHacrAnswers(engagementId: string | null): HacrAnswer[] {
  if (engagementId === null) return []
  const raw = readNsRaw(HACR_ANSWERS_KEY, engagementId)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
    return Object.values(parsed as Record<string, HacrAnswer>).filter(
      (a) => a && typeof a.questionId === 'string' && typeof a.currentState === 'number',
    )
  } catch {
    // Corrupt value — the caller shows its empty state rather than throwing into
    // a render. This path is read-only; the assessment screen owns repairing it.
    return []
  }
}

/** Everything the dashboard radar draws, from an engagement id. */
export function hacrRadarState(engagementId: string | null): {
  answered: number
  outcomes: CategoryOutcome[]
} {
  const answers = readHacrAnswers(engagementId)
  return { answered: answers.length, outcomes: scoreHacrAnswers(answers) }
}
