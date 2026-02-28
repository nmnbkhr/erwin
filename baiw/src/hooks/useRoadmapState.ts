import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'baiw-roadmap'

interface RoadmapState {
  selectedCapabilities: string[]
  lastUpdated: string
}

const defaultState: RoadmapState = {
  selectedCapabilities: [],
  lastUpdated: '',
}

function loadState(): RoadmapState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && Array.isArray(parsed.selectedCapabilities)) {
        return parsed as RoadmapState
      }
    }
  } catch {
    // corrupt data — reset
    localStorage.removeItem(STORAGE_KEY)
  }
  return defaultState
}

export function useRoadmapState() {
  const [selectedCaps, setSelectedCaps] = useState<Set<string>>(() => {
    const state = loadState()
    return new Set(state.selectedCapabilities)
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const state: RoadmapState = {
        selectedCapabilities: [...selectedCaps],
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [selectedCaps])

  const resetRoadmap = useCallback(() => {
    setSelectedCaps(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const lastUpdated = loadState().lastUpdated

  return { selectedCaps, setSelectedCaps, resetRoadmap, lastUpdated }
}
