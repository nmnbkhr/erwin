// HAIW Data Layer — Central imports from src/data/haiw/

import type {
  HaiwFhirResource, HaiwResourceCategory, HaiwHcdmSubjectArea,
  HaiwCapability, HacrData, HacrCategory, HacrQuestion, HaiwStarSchema,
  HaiwStarSchemaColumn, HaiwGapExtensions, HaiwEnrichment, HaiwPakistanContext,
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
// hacrQuestions.json ships as a flat question list; group it into
// categories → sections so consumers get the HacrData shape.
export const loadHacrQuestions = async (): Promise<HacrData> => {
  const raw = await load<HacrQuestion[] | HacrData>('hacrQuestions.json')
  if (!Array.isArray(raw)) return raw

  const categories: HacrCategory[] = []
  const catByName = new Map<string, HacrCategory>()
  for (const q of raw) {
    let cat = catByName.get(q.category)
    if (!cat) {
      cat = { name: q.category, categoryId: q.categoryId, sections: [], questionCount: 0 }
      catByName.set(q.category, cat)
      categories.push(cat)
    }
    let section = cat.sections.find(s => s.name === q.subcategory)
    if (!section) {
      section = { name: q.subcategory, questions: [] }
      cat.sections.push(section)
    }
    section.questions.push(q)
    cat.questionCount++
  }
  return { categories, totalQuestions: raw.length }
}
// ── Star schema / gap extension adapters ──
// The generated JSON uses a different shape than the UI types
// (factTable/dimensions/aggregates vs a flat typed table list, bare FK
// strings, no PK/pakSpecific flags), so derive the typed shape here.

const PAK_COLUMN = /cnic|nadra|sehat|province|district|tehsil|lhw|urdu/i

const keyToDim = (key: string) => `DIM_${key.replace(/^dim_/, '').replace(/_key$/, '').toUpperCase()}`

interface RawStarSchema {
  factTable: {
    name: string
    description: string
    measures: { name: string; type: string; aggregation: string; description: string }[]
    foreignKeys: string[]
  }
  dimensions: { name: string; description: string; columns: { name: string; type: string; description: string }[] }[]
  aggregates: { name: string; description: string; grainKeys: string[]; measures: string[] }[]
  views: { name: string; description: string; joins: string[] }[]
}

const fkColumn = (key: string): HaiwStarSchemaColumn => ({
  name: key,
  datatype: 'INTEGER',
  isPK: false,
  isFK: true,
  fkTarget: `${keyToDim(key)}.${key.replace(/^dim_/, '')}`,
  description: `Foreign key to ${keyToDim(key)}`,
})

export const loadStarSchema = async (): Promise<HaiwStarSchema> => {
  const raw = await load<RawStarSchema | HaiwStarSchema>('starSchema.json')
  if ('tables' in raw) return raw

  return {
    tables: [
      {
        name: raw.factTable.name,
        type: 'fact',
        description: raw.factTable.description,
        columns: [
          ...raw.factTable.foreignKeys.map(fkColumn),
          ...raw.factTable.measures.map(m => ({
            name: m.name,
            datatype: m.type,
            isPK: false,
            isFK: false,
            description: `${m.aggregation} — ${m.description}`,
          })),
        ],
      },
      ...raw.dimensions.map(d => ({
        name: d.name,
        type: 'dimension',
        description: d.description,
        columns: d.columns.map((c, i) => ({
          name: c.name,
          datatype: c.type,
          isPK: i === 0 && /_key$/.test(c.name),
          isFK: false,
          description: c.description,
          pakSpecific: PAK_COLUMN.test(c.name),
        })),
      })),
      ...raw.aggregates.map(a => ({
        name: a.name,
        type: 'aggregate',
        description: a.description,
        columns: [
          ...a.grainKeys.map(fkColumn),
          ...a.measures.map(m => ({
            name: m,
            datatype: 'DECIMAL(15,2)',
            isPK: false,
            isFK: false,
            description: 'Pre-aggregated measure',
          })),
        ],
      })),
    ],
    views: raw.views.map(v => ({ name: v.name, description: v.description, sourceTables: v.joins })),
  }
}

interface RawGapModule {
  module: string
  description: string
  tables: {
    name: string
    description: string
    columns: { name: string; type: string; pk?: boolean }[]
  }[]
}

export const loadGapExtensions = async (): Promise<HaiwGapExtensions> => {
  const raw = await load<RawGapModule[] | HaiwGapExtensions>('gapExtensions.json')
  if (!Array.isArray(raw)) return raw

  const schema = await loadStarSchema()
  const dimNames = new Set(schema.tables.filter(t => t.type === 'dimension').map(t => t.name))

  return {
    modules: raw.map((m, i) => ({
      name: m.module,
      id: `EXT-${String(i + 1).padStart(2, '0')}`,
      tables: m.tables.map(t => ({
        name: t.name,
        description: t.description,
        columns: t.columns.map(c => ({
          name: c.name,
          datatype: c.type,
          description: c.pk ? 'Primary key' : '',
          pakSpecific: PAK_COLUMN.test(c.name),
        })),
      })),
      tableCount: m.tables.length,
      connectsToStarSchema: [...new Set(
        m.tables.flatMap(t => t.columns.map(c => c.name))
          .filter(n => /_key$/.test(n))
          .map(keyToDim)
          .filter(n => dimNames.has(n)),
      )],
      requiredCapabilities: [],
    })),
  }
}
export const loadEnrichment = () => load<HaiwEnrichment>('enrichment.json')
export const loadPakistanContext = () => load<HaiwPakistanContext>('pakistanContext.json')
export const loadDependencies = () => load<Record<string, HaiwDependencyEntry>>('dependencies.json')
export const loadIndex = () => load<HaiwIndex>('index.json')
