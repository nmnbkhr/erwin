import type {
  Entity, Attribute, Relationship, Domain, Capability,
  DataRequirement, Dependency, ReuseScore, ReusePair,
  LineageEntry, StarSchema, GapModule, BacrQuestion,
  PakistanContext, InheritanceEntry, EnrichmentData,
  EntityIndexEntry
} from '../types'

// Generic cache
const cache = new Map<string, unknown>()

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T
  const data = await loader()
  cache.set(key, data)
  return data
}

// --- Domain-specific loaders (lazy, per-domain chunks) ---

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const domainEntityModules = import.meta.glob<{ default: Entity[] }>('../data/entities/*.json')
const domainAttrModules = import.meta.glob<{ default: Attribute[] }>('../data/attributes/*.json')
const domainRelModules = import.meta.glob<{ default: Relationship[] }>('../data/relationships/*.json')

export async function loadDomainEntities(domainName: string): Promise<Entity[]> {
  const slug = slugify(domainName)
  return cached(`entities:${slug}`, async () => {
    const path = `../data/entities/${slug}.json`
    const loader = domainEntityModules[path]
    if (!loader) return []
    const mod = await loader()
    return mod.default
  })
}

export async function loadDomainAttributes(domainName: string): Promise<Attribute[]> {
  const slug = slugify(domainName)
  return cached(`attributes:${slug}`, async () => {
    const path = `../data/attributes/${slug}.json`
    const loader = domainAttrModules[path]
    if (!loader) return []
    const mod = await loader()
    return mod.default
  })
}

export async function loadDomainRelationships(domainName: string): Promise<Relationship[]> {
  const slug = slugify(domainName)
  return cached(`relationships:${slug}`, async () => {
    const path = `../data/relationships/${slug}.json`
    const loader = domainRelModules[path]
    if (!loader) return []
    const mod = await loader()
    return mod.default
  })
}

export function prefetchDomain(domainName: string): void {
  loadDomainEntities(domainName).catch(() => {})
  loadDomainAttributes(domainName).catch(() => {})
  loadDomainRelationships(domainName).catch(() => {})
}

// --- Entity search index (lightweight ~50KB) ---

export async function loadEntityIndex(): Promise<EntityIndexEntry[]> {
  return cached('entityIndex', async () => {
    const data = await import('../data/entityIndex.json')
    return data.default as unknown as EntityIndexEntry[]
  })
}

// --- Full-file loaders (for pages that need all data) ---

export async function loadEntities(): Promise<Entity[]> {
  return cached('entities', async () => {
    const data = await import('../data/entities.json')
    return data.default as unknown as Entity[]
  })
}

export async function loadAttributes(): Promise<Attribute[]> {
  return cached('attributes', async () => {
    const data = await import('../data/attributes.json')
    return data.default as unknown as Attribute[]
  })
}

export async function loadRelationships(): Promise<Relationship[]> {
  return cached('relationships', async () => {
    const data = await import('../data/relationships.json')
    return data.default as unknown as Relationship[]
  })
}

export async function loadDomains(): Promise<Domain[]> {
  return cached('domains', async () => {
    const data = await import('../data/domains.json')
    return data.default as unknown as Domain[]
  })
}

export async function loadCapabilities(): Promise<Capability[]> {
  return cached('capabilities', async () => {
    const data = await import('../data/capabilities.json')
    return data.default as unknown as Capability[]
  })
}

export async function loadDataRequirements(): Promise<DataRequirement[]> {
  return cached('dataRequirements', async () => {
    const data = await import('../data/dataRequirements.json')
    return data.default as unknown as DataRequirement[]
  })
}

export async function loadDependencies(): Promise<Dependency[]> {
  return cached('dependencies', async () => {
    const data = await import('../data/dependencies.json')
    return data.default as unknown as Dependency[]
  })
}

export async function loadReuseScores(): Promise<ReuseScore[]> {
  return cached('reuseScores', async () => {
    const data = await import('../data/reuseScores.json')
    return data.default as unknown as ReuseScore[]
  })
}

export async function loadReuseMatrix(): Promise<ReusePair[]> {
  return cached('reuseMatrix', async () => {
    const data = await import('../data/reuseMatrix.json')
    return data.default as unknown as ReusePair[]
  })
}

export async function loadLineage(): Promise<LineageEntry[]> {
  return cached('lineage', async () => {
    const data = await import('../data/lineage.json')
    return data.default as unknown as LineageEntry[]
  })
}

export async function loadStarSchema(): Promise<StarSchema> {
  return cached('starSchema', async () => {
    const data = await import('../data/starSchema.json')
    return data.default as unknown as StarSchema
  })
}

export async function loadGapExtensions(): Promise<GapModule[]> {
  return cached('gapExtensions', async () => {
    const data = await import('../data/gapExtensions.json')
    return data.default as unknown as GapModule[]
  })
}

export async function loadBacrQuestions(): Promise<BacrQuestion[]> {
  return cached('bacrQuestions', async () => {
    const data = await import('../data/bacrQuestions.json')
    return data.default as unknown as BacrQuestion[]
  })
}

export async function loadPakistanContext(): Promise<PakistanContext> {
  return cached('pakistanContext', async () => {
    const data = await import('../data/pakistanContext.json')
    return data.default as unknown as PakistanContext
  })
}

export async function loadInheritanceTree(): Promise<InheritanceEntry[]> {
  return cached('inheritanceTree', async () => {
    const data = await import('../data/inheritanceTree.json')
    return data.default as unknown as InheritanceEntry[]
  })
}

export async function loadEnrichment(): Promise<EnrichmentData> {
  return cached('enrichment', async () => {
    const data = await import('../data/enrichment.json')
    return data.default as unknown as EnrichmentData
  })
}
