// HAIW Data Layer — Central imports from src/data/haiw/

import type {
  HaiwFhirResource, HaiwResourceCategory, HaiwHcdmSubjectArea,
  HaiwCapability, HacrData, HaiwStarSchema,
  HaiwGapExtensions, HaiwEnrichment, HaiwPakistanContext,
  HaiwDependencyEntry, HaiwIndex
} from '../types'

const cache = new Map<string, unknown>()

async function load<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const mod = await import(/* @vite-ignore */ `../../data/haiw/${path}`)
  const data = mod.default as T
  cache.set(path, data)
  return data
}

export const loadFhirResources = () => load<HaiwFhirResource[]>('fhirResources.json')
export const loadResourceCategories = () => load<HaiwResourceCategory[]>('resourceCategories.json')
export const loadHcdmSubjectAreas = () => load<HaiwHcdmSubjectArea[]>('hcdmSubjectAreas.json')
export const loadCapabilities = () => load<HaiwCapability[]>('capabilities.json')
export const loadHacrQuestions = () => load<HacrData>('hacrQuestions.json')
export const loadStarSchema = () => load<HaiwStarSchema>('starSchema.json')
export const loadGapExtensions = () => load<HaiwGapExtensions>('gapExtensions.json')
export const loadEnrichment = () => load<HaiwEnrichment>('enrichment.json')
export const loadPakistanContext = () => load<HaiwPakistanContext>('pakistanContext.json')
export const loadDependencies = () => load<Record<string, HaiwDependencyEntry>>('dependencies.json')
export const loadIndex = () => load<HaiwIndex>('index.json')
