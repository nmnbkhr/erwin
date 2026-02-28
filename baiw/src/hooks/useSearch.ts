import { useState, useEffect, useMemo } from 'react'
import type { Entity, Capability } from '../types'
import { searchEntities, searchCapabilities } from '../utils/search'

export function useEntitySearch(entities: Entity[], initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)

  const results = useMemo(() => searchEntities(entities, query), [entities, query])

  return { query, setQuery, results }
}

export function useCapabilitySearch(capabilities: Capability[], initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)

  const results = useMemo(() => searchCapabilities(capabilities, query), [capabilities, query])

  return { query, setQuery, results }
}
