import { useState, useEffect } from 'react'
import type { Entity, Attribute, Relationship, Domain } from '../types'
import { loadEntities, loadAttributes, loadRelationships, loadDomains } from '../utils/dataLoader'

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntities().then((data) => {
      setEntities(data)
      setLoading(false)
    })
  }, [])

  return { entities, loading }
}

export function useAttributes(entityId?: string) {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttributes().then((data) => {
      setAttributes(entityId ? data.filter((a) => a.entityId === entityId) : data)
      setLoading(false)
    })
  }, [entityId])

  return { attributes, loading }
}

export function useRelationships(entityId?: string) {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRelationships().then((data) => {
      setRelationships(
        entityId
          ? data.filter((r) => r.parentId === entityId || r.childId === entityId)
          : data
      )
      setLoading(false)
    })
  }, [entityId])

  return { relationships, loading }
}

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDomains().then((data) => {
      setDomains(data)
      setLoading(false)
    })
  }, [])

  return { domains, loading }
}
