import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { AssessmentAnswer } from '../types'

interface AssessmentState {
  answers: Record<string, AssessmentAnswer>
  currentCategory: number
  completed: boolean
}

type AssessmentAction =
  | { type: 'SET_ANSWER'; payload: AssessmentAnswer }
  | { type: 'SET_CATEGORY'; payload: number }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: AssessmentState }

const initialState: AssessmentState = {
  answers: {},
  currentCategory: 0,
  completed: false,
}

function reducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.questionId]: action.payload },
      }
    case 'SET_CATEGORY':
      return { ...state, currentCategory: action.payload }
    case 'COMPLETE':
      return { ...state, completed: true }
    case 'RESET':
      return initialState
    case 'LOAD':
      return action.payload
    default:
      return state
  }
}

const AssessmentContext = createContext<{
  state: AssessmentState
  dispatch: React.Dispatch<AssessmentAction>
} | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem('baiw-assessment')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed.answers === 'object') return parsed
      }
    } catch {
      localStorage.removeItem('baiw-assessment')
    }
    return initialState
  })

  useEffect(() => {
    localStorage.setItem('baiw-assessment', JSON.stringify(state))
  }, [state])

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider')
  return ctx
}
