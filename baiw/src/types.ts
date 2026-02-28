export interface Entity {
  id: string
  name: string
  domain: string
  description: string
  attributeCount: number
}

export interface EntityIndexEntry {
  id: string
  name: string
  domain: string
}

export interface Attribute {
  entityId: string
  entityName: string
  name: string
  dataType: string
  nullable: boolean
}

export interface Relationship {
  parentId: string
  parentName: string
  childId: string
  childName: string
  type: string
}

export interface Domain {
  id: string
  name: string
  description: string
  entityCount: number
  color: string
}

export interface Capability {
  id: string
  name: string
  themeId: string
  themeName: string
  groupId: string
  groupName: string
  description: string
  dataReqCount: number
  phase: number
}

export interface DataRequirement {
  id: string
  capabilityId: string
  description: string
  fsdmSubjectArea: string
  priority: string
}

export interface Dependency {
  capabilityId: string
  capabilityName: string
  entityId: string
  entityName: string
  domain: string
}

export interface ReuseScore {
  entityId: string
  entityName: string
  domain: string
  reuseCount: number
  tier: string
}

export interface ReusePair {
  cap1Id: string
  cap2Id: string
  similarity: number
}

export interface LineageEntry {
  id: string
  sourceEntity: string
  sourceColumn: string
  targetEntity: string
  targetColumn: string
  transformation: string
}

export interface TableColumn {
  name: string
  dataType: string
  description: string
  isPakistanSpecific?: boolean
}

export interface SchemaTable {
  name: string
  type: string
  columns: TableColumn[]
}

export interface StarSchema {
  factTable: SchemaTable
  dimensions: SchemaTable[]
  aggregates: SchemaTable[]
  views: SchemaTable[]
}

export interface GapModule {
  id: string
  name: string
  description: string
  tables: { name: string; columns: { name: string; dataType: string; description: string }[] }[]
}

export interface BacrQuestion {
  id: string
  category: string
  subcategory: string
  text: string
  weight: number
}

export interface AssessmentAnswer {
  questionId: string
  currentState: number
  desiredState: number
}

export interface InheritanceEntry {
  parentId: string
  parentName: string
  childId: string
  childName: string
  depth: number
}

export interface EnrichmentEntry {
  pakistanObjectives: string[]
  pakistanDataSources: string[]
  expectedOutcomes: string[]
  keyChallenges: string[]
  fsdmEntities: string[]
  implementationPhase: number
  investmentRange: string
  priority: string
}

export interface EnrichmentData {
  capabilities: Record<string, EnrichmentEntry>
  metadata: {
    source: string
    capabilitiesEnriched: number
    totalCapabilities: number
    note: string
  }
}

export interface PakistanContext {
  regulatoryFramework: {
    sbpRates: { name: string; rate: string }[]
    baselIII: { metric: string; requirement: string }[]
    ifrs9: { stage: string; description: string; criteria: string }[]
    taxRates: { type: string; rate: string; notes: string }[]
  }
  industryMetrics: {
    overview: { metric: string; value: string }[]
    ratios: { name: string; value: string }[]
  }
  islamicBanking: {
    modes: {
      name: string
      type: string
      useCase: string
      fsdmEntity: string
      plTreatment: string
    }[]
  }
  paymentEcosystem: {
    infrastructure: { name: string; type: string; description: string }[]
    fintechs: { name: string; users: string; description: string }[]
  }
}
