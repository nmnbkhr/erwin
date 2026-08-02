import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

/*
 * ── D-012: THIS CARD NOW SCORES BY CATEGORY ────────────────────────────────
 *
 * It did not before. `radarData` sliced `Object.values(answers)` into
 * `CATEGORIES.length` equal positional blocks and averaged each one, so an axis
 * labelled "Governance" showed the mean of whichever answers happened to sit in
 * the third slice. That lines up with the real categories only while the user
 * answered every question in presentation order and never revisited. Skip a
 * category, answer out of order or stop halfway and every axis on the dashboard
 * carries someone else's questions — silently, and looking exactly as right as a
 * correct one. `getAssessmentProgress` had the same shape: `floor(answered / 8)`
 * counts eight answers as "a category", wherever they came from.
 *
 * Both now attribute each answer by its question id, through `bacrCategoryOf`,
 * and both score through `src/scoring/maturity.ts` — the same primitive TAIW and
 * HAIW use, rather than a fourth path. Three states apply here as everywhere: an
 * untouched category is NOT ASSESSED and plots no vertex, never a zero.
 *
 * THE 188 kB CONSTRAINT DOES NOT BLOCK THIS. Category attribution needs the
 * question -> category relation, and BACR ids encode it: `business_summary_001`.
 * So the card still does not import `bacrQuestions.json`, and the dashboard chunk
 * is unchanged. `BACR-CATEGORY-PREFIX` asserts the relation on every build, so
 * this is a checked property of the data rather than an assumption made here.
 */
import { BACR_CATEGORIES as CATEGORIES, QUESTIONS_PER_CATEGORY, bacrCategoryOf } from '../../data/bacrCategories'
import { scoreCategories, coverageStatement, type Applicable, type CategoryOutcome } from '../../scoring/maturity'

interface AssessmentState {
  answers: Record<string, { questionId: string; currentState: number; desiredState: number }>
  currentCategory: number
  completed: boolean
}

function getAssessmentData(): AssessmentState | null {
  try {
    const saved = localStorage.getItem('baiw-assessment')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed.answers === 'object' && Object.keys(parsed.answers).length > 0) {
        return parsed
      }
    }
  } catch { /* ignore */ }
  return null
}

/**
 * Bucket the stored answers by the category their question id names, and score.
 *
 * Each category is padded to `QUESTIONS_PER_CATEGORY` with unanswered slots. That
 * padding is what keeps `not-assessed` distinct from `not-applicable`: a category
 * nobody has touched has applicable questions and no answers, which is a
 * different fact from a category with no questions at all — the two states
 * `dgiw/scoring.ts` says must never collapse into each other. It does not move
 * any mean, because `aggregate()` divides by the ANSWERED count.
 */
function scoreStoredAssessment(data: AssessmentState | null): CategoryOutcome[] {
  const byCategory = new Map<string, Applicable[]>(CATEGORIES.map((c) => [c, []]))
  for (const a of Object.values(data?.answers ?? {})) {
    const cat = bacrCategoryOf(a.questionId)
    // An unattributable id is dropped rather than guessed into a bucket.
    if (cat) byCategory.get(cat)!.push({ weight: 1, answer: a })
  }
  return scoreCategories(
    CATEGORIES.map((name) => {
      const found = byCategory.get(name)!
      const unanswered = Math.max(0, QUESTIONS_PER_CATEGORY - found.length)
      return { name, entries: [...found, ...Array.from({ length: unanswered }, () => ({ weight: 1, answer: undefined }))] }
    }),
  )
}

export function getAssessmentProgress(): { categoriesAssessed: number; total: number } {
  const outcomes = scoreStoredAssessment(getAssessmentData())
  return {
    // Categories with at least one answer — not `floor(answers / 8)`, which
    // counted eight answers to one category as eight categories assessed.
    categoriesAssessed: outcomes.filter((o) => o.agg.state === 'scored').length,
    total: CATEGORIES.length,
  }
}

export default function MaturityRadarCard() {
  const navigate = useNavigate()
  const data = useMemo(() => getAssessmentData(), [])

  const outcomes = useMemo(() => scoreStoredAssessment(data), [data])
  const coverage = useMemo(() => coverageStatement(outcomes), [outcomes])

  const radarData = useMemo(
    () =>
      outcomes.map((o) => ({
        category: o.name.length > 10 ? o.name.slice(0, 8) + '..' : o.name,
        // `null`, not 0. Recharts leaves an unmeasured axis without a vertex;
        // a 0 would draw one on the innermost ring and read as "this is weak"
        // where the truth is "nobody has told us about this yet".
        score: o.agg.state === 'scored' ? o.agg.current : null,
      })),
    [outcomes],
  )

  if (!data || Object.keys(data.answers).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
        <h3 className="text-base font-semibold text-slate-700 mb-3">Analytics Maturity Snapshot</h3>
        <p className="text-sm text-slate-400 mb-4 text-center">
          Complete the maturity assessment to see your analytics maturity radar here.
        </p>
        <button
          onClick={() => navigate('/maturity')}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Maturity Assessment →
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-slate-700">Analytics Maturity Snapshot</h3>
        <button
          onClick={() => navigate('/maturity')}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View Full Results →
        </button>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
          <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
      {/* The denominator, on the card. A shape drawn from three of eight
          categories is not the same claim as one drawn from eight, and the
          polygon alone cannot tell them apart — the D-003 lesson, on a
          dashboard tile. */}
      <p className="text-xs text-slate-400 text-center">{coverage}</p>
    </div>
  )
}
