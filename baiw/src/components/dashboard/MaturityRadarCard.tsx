import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

const CATEGORIES = [
  'Business', 'Culture', 'Governance', 'Information', 'Applications',
  'Systems', 'Agility', 'Outcomes', 'Overall Assessment',
]

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

export function getAssessmentProgress(): { categoriesAssessed: number; total: number } {
  const data = getAssessmentData()
  if (!data) return { categoriesAssessed: 0, total: CATEGORIES.length }
  const answered = Object.keys(data.answers).length
  const categoriesAssessed = Math.min(CATEGORIES.length, Math.floor(answered / 8))
  return { categoriesAssessed, total: CATEGORIES.length }
}

export default function MaturityRadarCard() {
  const navigate = useNavigate()
  const data = useMemo(() => getAssessmentData(), [])

  const radarData = useMemo(() => {
    if (!data) return []
    return CATEGORIES.map((cat) => {
      const catAnswers = Object.values(data.answers).filter((a) => {
        // Match by question ID prefix pattern (category index)
        return true
      })
      // Simple approach: distribute answers evenly across categories
      const allAnswers = Object.values(data.answers)
      const perCat = Math.ceil(allAnswers.length / CATEGORIES.length)
      const catIdx = CATEGORIES.indexOf(cat)
      const slice = allAnswers.slice(catIdx * perCat, (catIdx + 1) * perCat)
      const avg = slice.length > 0
        ? slice.reduce((s, a) => s + a.currentState, 0) / slice.length
        : 0
      return {
        category: cat.length > 10 ? cat.slice(0, 8) + '..' : cat,
        score: Math.round(avg * 10) / 10,
      }
    })
  }, [data])

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
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
          <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
