// TAIW Type Definitions — Trade Analytics Intelligence Workbench

export interface TaiwDomain {
  name: string
  slug: string
  count: number
  classCount: number
  description: string
  color: string
  icon: string
}

export interface TaiwClass {
  id: string
  name: string
  domain: string
  description: string
  elementCount: number
  parentClass: string | null
  childClasses: string[]
  stereotype: string
}

export interface TaiwElement {
  id: string
  name: string
  definition: string
  class: string
  domain: string
  dataType: string
  codeList: string | null
  informationPackages: string[]
  format: string
  unEdifactTag: string | null
}

export interface TaiwIP {
  id: string
  name: string
  type: 'BIP' | 'DIP'
  description: string
  classes: string[]
  elementCount: number
  pakRelevance: string
  webocMapping: string
}

export interface TaiwCodeList {
  id: string
  name: string
  source: string
  values: { code: string; description: string }[]
  pakMapping: string
}

export interface TaiwCapability {
  id: string
  theme: string
  group: string
  sub: string
  dataReqCount: number
  themeColor: string
  themeIndex: number
  groupIndex: number
  priority: string
}

export interface TaiwRequirement {
  id: string
  name: string
  wcoDomain: string
  capabilitiesUsing: number
  capabilities: string[]
  description: string
}

export interface TaiwMapping {
  capability: string
  element: string
  domain: string
  confidence: string
  notes: string
}

export interface TaiwDependency {
  elements: string[]
  domains: string[]
  dataRequirements: string[]
  elementCount: number
  domainCount: number
}

export interface TaiwReuseScore {
  element: string
  domain: string
  score: number
  tier: string
  capabilitiesSupported: number
}

export interface TaiwRelationship {
  parent: string
  child: string
  type: string
  cardinality: string
  parentDomain: string
  childDomain: string
}

export interface TacrQuestion {
  id: string
  text: string
  levels: Record<string, string>
}

export interface TacrSection {
  name: string
  questions: TacrQuestion[]
}

export interface TacrCategory {
  name: string
  sections: TacrSection[]
  questionCount: number
}

export interface TacrData {
  categories: TacrCategory[]
  totalQuestions: number
}

export interface TaiwStarSchemaColumn {
  name: string
  datatype: string
  isPK: boolean
  isFK: boolean
  fkTarget?: string
  description: string
  pakSpecific?: boolean
}

export interface TaiwStarSchemaTable {
  name: string
  type: string
  columns: TaiwStarSchemaColumn[]
  description: string
}

export interface TaiwStarSchemaView {
  name: string
  description: string
  sourceTables: string[]
}

export interface TaiwStarSchema {
  tables: TaiwStarSchemaTable[]
  views: TaiwStarSchemaView[]
}

export interface TaiwGapTable {
  name: string
  columns: { name: string; datatype: string; description: string; pakSpecific?: boolean }[]
  description: string
}

export interface TaiwGapModule {
  name: string
  id: string
  tables: TaiwGapTable[]
  tableCount: number
  connectsToStarSchema: string[]
  requiredCapabilities: string[]
}

export interface TaiwGapExtensions {
  modules: TaiwGapModule[]
}

export interface TaiwEnrichmentEntry {
  pakistanObjectives: string[]
  pakistanDataSources: string[]
  expectedOutcomes: string[]
  keyChallenges: string[]
  wcoElements: string[]
  implementationPhase: number
  investmentRange: string
  priority: string
}

export interface TaiwEnrichment {
  capabilities: Record<string, TaiwEnrichmentEntry>
  metadata: {
    capabilitiesEnriched: number
    totalCapabilities: number
    note: string
  }
}

export interface TaiwPakistanContext {
  institutions: Record<string, { name: string; role: string; system?: string; url?: string }>
  tradeStats: {
    totalExports: string
    totalImports: string
    tradeDeficit: string
    topExportSectors: { sector: string; value: string; share: string }[]
    topImportSectors: { sector: string; value: string; share: string }[]
    topPartners: { exports: string[]; imports: string[] }
    customsRevenue: string
    gdsProcessed: string
    activeTraders: string
    ports: string
  }
  gdTypes: { code: string; name: string; description: string }[]
  dutyStructure: { name: string; rates: string; authority: string }[]
  tradeAgreements: { code: string; name: string; since: string; coverage: string; partner: string; conditions?: string }[]
  cpec: {
    gwadar: { status: string; features: string; capacity: string }
    sezs: string[]
    ml1Railway: string
    digitalConnectivity: string
  }
  ports: { name: string; type: string; terminals?: string[]; share?: string; operator?: string; partner?: string }[]
  keyChallenges: { challenge: string; description: string; impact: string }[]
}

export interface TaiwIndex {
  app: string
  fullName: string
  version: string
  dataModel: string
  framework: string
  assessment: string
  country: string
  stats: Record<string, number>
  generated: string
  generator: string
}

export interface TaiwAssessmentAnswer {
  questionId: string
  currentState: number
  desiredState: number
}
