export interface Stakeholder {
  role: string
  interest: string
  kpis: string[]
}

export interface ValueChainStep {
  step: number
  name: string
  description: string
  owner: string
  outputs: string[]
}

export interface BusinessCapability {
  id: string
  name: string
  description: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string
  phase: number
}

export interface ContextArea {
  area: string
  items: string[]
}

export interface FactTable {
  name: string
  grain: string
  measures: number
}

export interface DimensionTable {
  name: string
  purpose: string
  keyColumns: string[]
}

export interface AggregateTable {
  name: string
  grain: string
  measures: number
}

export interface StarSchema {
  summary: string
  facts: FactTable[]
  dimensions: DimensionTable[]
  aggregates: AggregateTable[]
}

export interface LineageItem {
  targetColumn: string
  transformation: string
  sourceEntities: string[]
  businessMeasure: string
}

export interface GapExtension {
  module: string
  tables: string[]
  purpose: string
}

export interface TechComponent {
  name: string
  feeds?: string
  frequency?: string
  owner?: string
  purpose?: string
}

export interface TechLayer {
  name: string
  type: string
  components: TechComponent[]
}

export interface TechStackItem {
  component: string
  tech: string
  rationale: string
}

export interface DataFlowStep {
  label: string
  desc: string
}

export interface UseCase {
  id: string
  title: string
  objective: string
  businessValue: string
  capabilities: string[]
  dataEntities: string[]
  measures: string[]
  phase: number
  owner: string
  kpiTarget: string
}

export interface RoadmapPhase {
  phase: number
  name: string
  timeline: string
  theme: string
  deliverables: string[]
  capabilities: string[]
  dataDependencies: string[]
  quickWins: string[]
  risks: string[]
  kpis: string[]
}

export interface WorkbenchData {
  title: string
  subtitle: string
  businessArchitecture: {
    stakeholders: Stakeholder[]
    valueChain: ValueChainStep[]
    capabilities: BusinessCapability[]
    context: ContextArea[]
  }
  dataArchitecture: {
    starSchema: StarSchema
    lineage: LineageItem[]
    gapExtensions: GapExtension[]
  }
  technologyArchitecture: {
    layers: TechLayer[]
    techStack: TechStackItem[]
    dataFlow?: DataFlowStep[]
  }
  useCases: UseCase[]
  roadmap: { phases: RoadmapPhase[] }
}

export type WorkbenchTab = 'business' | 'data' | 'technology' | 'usecases' | 'roadmap'
