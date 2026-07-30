import { createContext, useContext, useCallback, type ReactNode } from 'react'
import type { AssessmentAnswer } from '../types'
import { usePersistedState } from '../engagement/usePersistedState'

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

/** The guard the ad-hoc loader applied inline, kept verbatim. */
function isAssessmentState(parsed: unknown): boolean {
  return !!parsed && typeof (parsed as AssessmentState).answers === 'object'
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  // Same contract as before — the whole reducer state is written on every
  // change — but filed under the active engagement instead of one fixed key.
  // The reducer is applied through the setter so `dispatch` keeps its semantics.
  const [state, setState] = usePersistedState<AssessmentState>('baiw-assessment', initialState, isAssessmentState)

  const dispatch = useCallback<React.Dispatch<AssessmentAction>>(
    (action) => setState((prev) => reducer(prev, action)),
    [setState],
  )

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
