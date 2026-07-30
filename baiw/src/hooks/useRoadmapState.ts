import { useCallback, useMemo } from 'react'
import { usePersistedState } from '../engagement/usePersistedState'

/**
 * Roadmap selection state.
 *
 * Was a fixed `baiw-roadmap` localStorage key with a 500ms debounced write; it
 * is now filed under the active engagement by `usePersistedState`. The debounce
 * is gone with the hand-rolled write — the persisted payload is a short array of
 * ids and the hook already skips writes when the serialised value is unchanged,
 * so the timer bought nothing once the write moved behind that check.
 *
 * The public shape (`Set<string>` in, `Set<string>` out) is unchanged so every
 * call site in RoadmapBuilder keeps working.
 */
const STORAGE_KEY = 'baiw-roadmap'

interface RoadmapState {
  selectedCapabilities: string[]
  lastUpdated: string
}

const defaultState: RoadmapState = {
  selectedCapabilities: [],
  lastUpdated: '',
}

function isRoadmapState(parsed: unknown): boolean {
  return !!parsed && Array.isArray((parsed as RoadmapState).selectedCapabilities)
}

export function useRoadmapState() {
  const [state, setState] = usePersistedState<RoadmapState>(STORAGE_KEY, defaultState, isRoadmapState)

  const selectedCaps = useMemo(() => new Set(state.selectedCapabilities), [state.selectedCapabilities])

  const setSelectedCaps = useCallback(
    (next: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      setState((prev) => {
        const prevSet = new Set(prev.selectedCapabilities)
        const nextSet = typeof next === 'function' ? next(prevSet) : next
        return { selectedCapabilities: [...nextSet], lastUpdated: new Date().toISOString() }
      })
    },
    [setState],
  )

  const resetRoadmap = useCallback(() => setState(defaultState), [setState])

  return { selectedCaps, setSelectedCaps, resetRoadmap, lastUpdated: state.lastUpdated }
}
