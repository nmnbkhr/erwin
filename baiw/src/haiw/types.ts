// HAIW Type Definitions — Healthcare Analytics Intelligence Workbench

export interface HaiwFhirElement {
  name: string
  type: string
  description: string
  cardinality: string
  mustSupport: boolean
}

export interface HaiwFhirResource {
  id: string
  name: string
  category: string
  categoryId: number
  description: string
  purpose: string
  elements: HaiwFhirElement[]
  elementCount: number
  references: string[]
  referencedBy: string[]
  maturityLevel: number
  pakistanRelevance: string
  pakistanNotes: string
  hcdmSubjectArea: string
}

export interface HaiwResourceCategory {
  id: number
  name: string
  description: string
  resourceCount: number
  color: string
  icon: string
}

export interface HaiwHcdmSubjectArea {
  id: string
  name: string
  description: string
  estimatedEntities: number
  color: string
  fhirResources: string[]
  keyAnalytics: string[]
}

export interface HaiwPakistanEnrichment {
  institution: string
  system: string
  challenge: string
  opportunity: string
}

export interface HaiwCapability {
  id: string
  name: string
  theme: string
  themeId: number
  themeColor: string
  group: string
  groupId: string
  description: string
  fhirResources: string[]
  hcdmSubjectAreas: string[]
  maturityLevelRequired: number
  pakistanEnrichment: HaiwPakistanEnrichment
  relatedCapabilities: string[]
  businessQuestions: string[]
}

export interface HacrQuestion {
  id: string
  category: string
  categoryId: string
  subcategory: string
  question: string
  levelDescriptions: Record<string, string>
  weight: number
  capabilityLinks: string[]
  pakistanContext: string
}

export interface HacrSection {
  name: string
  questions: HacrQuestion[]
}

export interface HacrCategory {
  name: string
  categoryId: string
  sections: HacrSection[]
  questionCount: number
}

export interface HacrData {
  categories: HacrCategory[]
  totalQuestions: number
}

export interface HaiwStarSchemaColumn {
  name: string
  datatype: string
  isPK: boolean
  isFK: boolean
  fkTarget?: string
  description: string
  pakSpecific?: boolean
}

export interface HaiwStarSchemaTable {
  name: string
  type: string
  columns: HaiwStarSchemaColumn[]
  description: string
}

export interface HaiwStarSchemaView {
  name: string
  description: string
  sourceTables: string[]
}

export interface HaiwStarSchema {
  tables: HaiwStarSchemaTable[]
  views: HaiwStarSchemaView[]
}

export interface HaiwGapTable {
  name: string
  columns: { name: string; datatype: string; description: string; pakSpecific?: boolean }[]
  description: string
}

export interface HaiwGapModule {
  name: string
  id: string
  tables: HaiwGapTable[]
  tableCount: number
  connectsToStarSchema: string[]
  requiredCapabilities: string[]
}

export interface HaiwGapExtensions {
  modules: HaiwGapModule[]
}

export interface HaiwEnrichmentEntry {
  institution: string
  regulatoryBody: string
  relevantProgram: string
  challenge: string
  opportunity: string
  keyStatistics: string
}

export interface HaiwEnrichment {
  capabilities: Record<string, HaiwEnrichmentEntry>
}

export interface HaiwPakistanContext {
  institutions: { name: string; role: string; type: string }[]
  statistics: Record<string, string | number>
  facilityHierarchy: { level: string; name: string; count: number | string; description: string }[]
  priorityPrograms: { name: string; description: string; coverage: string; keyIndicator: string }[]
  codingStandards: { name: string; status: string; adoption: string }[]
  challenges: { challenge: string; description: string; impact: string }[]
}

export interface HaiwDependencyEntry {
  capabilityId: string
  capabilityName: string
  dependencies: { resourceId: string; resourceName: string; strength: string }[]
}

export interface HaiwIndex {
  module: string
  fullName: string
  version: string
  dataModel: string
  dataModelVersion: string
  analyticalOverlay: string
  capabilityFramework: string
  maturityAssessment: string
  resourceCount: number
  hcdmSubjectAreaCount: number
  capabilityCount: number
  maturityQuestionCount: number
  starSchemaTableCount: number
  gapExtensionTableCount: number
  countryContext: string
  themeColor: string
  generatedAt: string
}

export interface HaiwAssessmentAnswer {
  questionId: string
  currentState: number
  desiredState: number
}
