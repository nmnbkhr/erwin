import { useState, useEffect } from 'react'
import type { Capability, DataRequirement, Dependency, ReusePair } from '../types'
import { loadCapabilities, loadDataRequirements, loadDependencies, loadReuseMatrix } from '../utils/dataLoader'

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCapabilities().then((data) => {
      setCapabilities(data)
      setLoading(false)
    })
  }, [])

  return { capabilities, loading }
}

export function useDataRequirements(capabilityId?: string) {
  const [requirements, setRequirements] = useState<DataRequirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDataRequirements().then((data) => {
      setRequirements(capabilityId ? data.filter((r) => r.capabilityId === capabilityId) : data)
      setLoading(false)
    })
  }, [capabilityId])

  return { requirements, loading }
}

export function useDependencies(capabilityId?: string, entityId?: string) {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDependencies().then((data) => {
      let filtered = data
      if (capabilityId) filtered = filtered.filter((d) => d.capabilityId === capabilityId)
      if (entityId) filtered = filtered.filter((d) => d.entityId === entityId)
      setDependencies(filtered)
      setLoading(false)
    })
  }, [capabilityId, entityId])

  return { dependencies, loading }
}

export function useReuseMatrix(capabilityId?: string) {
  const [pairs, setPairs] = useState<ReusePair[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReuseMatrix().then((data) => {
      setPairs(
        capabilityId
          ? data.filter((p) => p.cap1Id === capabilityId || p.cap2Id === capabilityId)
          : data
      )
      setLoading(false)
    })
  }, [capabilityId])

  return { pairs, loading }
}
