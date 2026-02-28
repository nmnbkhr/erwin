import type { Entity, EntityIndexEntry, Capability, Domain, BacrQuestion } from '../types'

export function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (lower.includes(q)) return true
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

function relevanceScore(text: string, query: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (lower === q) return 100
  if (lower.startsWith(q)) return 80
  if (lower.includes(q)) return 60
  return 30
}

export function searchEntities(entities: Entity[], query: string): Entity[] {
  if (!query.trim()) return entities
  return entities.filter(
    (e) =>
      fuzzyMatch(e.name, query) ||
      fuzzyMatch(e.domain, query) ||
      fuzzyMatch(e.description, query)
  )
}

export function searchEntityIndex(entries: EntityIndexEntry[], query: string): EntityIndexEntry[] {
  if (!query.trim()) return entries
  return entries.filter(
    (e) => fuzzyMatch(e.name, query) || fuzzyMatch(e.domain, query)
  )
}

export function searchCapabilities(capabilities: Capability[], query: string): Capability[] {
  if (!query.trim()) return capabilities
  return capabilities.filter(
    (c) =>
      fuzzyMatch(c.name, query) ||
      fuzzyMatch(c.groupName, query) ||
      fuzzyMatch(c.themeName, query) ||
      fuzzyMatch(c.description, query)
  )
}

export interface GlobalSearchResult {
  type: 'entity' | 'capability' | 'domain' | 'bacr'
  id: string
  name: string
  detail: string
  score: number
}

export function globalSearchLight(
  query: string,
  entityIndex: EntityIndexEntry[],
  capabilities: Capability[],
  domains: Domain[],
  bacrQuestions: BacrQuestion[],
): GlobalSearchResult[] {
  if (!query.trim() || query.length < 2) return []
  const q = query.trim()
  const results: GlobalSearchResult[] = []

  const matchedEntities = entityIndex
    .filter((e) => fuzzyMatch(e.name, q) || fuzzyMatch(e.domain, q))
    .map((e) => ({ type: 'entity' as const, id: String(e.id), name: e.name, detail: e.domain, score: relevanceScore(e.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  results.push(...matchedEntities)

  const matchedCaps = capabilities
    .filter((c) => fuzzyMatch(c.name, q) || fuzzyMatch(c.groupName, q) || fuzzyMatch(c.themeName, q))
    .map((c) => ({ type: 'capability' as const, id: String(c.id), name: c.name, detail: `${c.themeName} > ${c.groupName}`, score: relevanceScore(c.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  results.push(...matchedCaps)

  const matchedDomains = domains
    .filter((d) => fuzzyMatch(d.name, q))
    .map((d) => ({ type: 'domain' as const, id: d.id, name: d.name, detail: `${d.entityCount} entities`, score: relevanceScore(d.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  results.push(...matchedDomains)

  const categories = [...new Set(bacrQuestions.map((bq) => bq.category))]
  const matchedBacr = categories
    .filter((cat) => fuzzyMatch(cat, q))
    .map((cat) => ({ type: 'bacr' as const, id: cat, name: cat, detail: `${bacrQuestions.filter((bq) => bq.category === cat).length} questions`, score: relevanceScore(cat, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  results.push(...matchedBacr)

  return results
}

export function globalSearch(
  query: string,
  entities: Entity[],
  capabilities: Capability[],
  domains: Domain[],
  bacrQuestions: BacrQuestion[],
): GlobalSearchResult[] {
  if (!query.trim() || query.length < 2) return []
  const q = query.trim()
  const results: GlobalSearchResult[] = []

  const matchedEntities = entities
    .filter((e) => fuzzyMatch(e.name, q) || fuzzyMatch(e.domain, q))
    .map((e) => ({ type: 'entity' as const, id: String(e.id), name: e.name, detail: e.domain, score: relevanceScore(e.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  results.push(...matchedEntities)

  const matchedCaps = capabilities
    .filter((c) => fuzzyMatch(c.name, q) || fuzzyMatch(c.groupName, q) || fuzzyMatch(c.themeName, q))
    .map((c) => ({ type: 'capability' as const, id: String(c.id), name: c.name, detail: `${c.themeName} > ${c.groupName}`, score: relevanceScore(c.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  results.push(...matchedCaps)

  const matchedDomains = domains
    .filter((d) => fuzzyMatch(d.name, q))
    .map((d) => ({ type: 'domain' as const, id: d.id, name: d.name, detail: `${d.entityCount} entities`, score: relevanceScore(d.name, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  results.push(...matchedDomains)

  const categories = [...new Set(bacrQuestions.map((bq) => bq.category))]
  const matchedBacr = categories
    .filter((cat) => fuzzyMatch(cat, q))
    .map((cat) => ({ type: 'bacr' as const, id: cat, name: cat, detail: `${bacrQuestions.filter((bq) => bq.category === cat).length} questions`, score: relevanceScore(cat, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  results.push(...matchedBacr)

  return results
}
