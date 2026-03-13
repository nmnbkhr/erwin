// TAIW Data Layer — Central imports from src/data/taiw/

import type {
  TaiwDomain, TaiwClass, TaiwElement, TaiwIP, TaiwCodeList,
  TaiwCapability, TaiwRequirement, TaiwMapping, TaiwDependency,
  TaiwReuseScore, TaiwRelationship, TacrData, TaiwStarSchema,
  TaiwGapExtensions, TaiwEnrichment, TaiwPakistanContext, TaiwIndex
} from '../types'

const cache = new Map<string, unknown>()

async function load<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const mod = await import(/* @vite-ignore */ `../../data/taiw/${path}`)
  const data = mod.default as T
  cache.set(path, data)
  return data
}

export const loadDomains = () => load<TaiwDomain[]>('domains.json')
export const loadClasses = () => load<TaiwClass[]>('classes.json')
export const loadElements = () => load<TaiwElement[]>('dataElements.json')
export const loadIPs = () => load<TaiwIP[]>('informationPackages.json')
export const loadCodeLists = () => load<TaiwCodeList[]>('codeLists.json')
export const loadCapabilities = () => load<TaiwCapability[]>('capabilities.json')
export const loadRequirements = () => load<TaiwRequirement[]>('dataRequirements.json')
export const loadMappings = () => load<TaiwMapping[]>('mappings.json')
export const loadDependencies = () => load<Record<string, TaiwDependency>>('dependencies.json')
export const loadReuseScores = () => load<TaiwReuseScore[]>('reuseScores.json')
export const loadRelationships = () => load<TaiwRelationship[]>('relationships.json')
export const loadTacrQuestions = () => load<TacrData>('tacrQuestions.json')
export const loadStarSchema = () => load<TaiwStarSchema>('starSchema.json')
export const loadGapExtensions = () => load<TaiwGapExtensions>('gapExtensions.json')
export const loadEnrichment = () => load<TaiwEnrichment>('enrichment.json')
export const loadPakistanContext = () => load<TaiwPakistanContext>('pakistanContext.json')
export const loadIndex = () => load<TaiwIndex>('index.json')
