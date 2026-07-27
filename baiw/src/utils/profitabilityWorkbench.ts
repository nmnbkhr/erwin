export interface WorkbenchData {
  title: string
  subtitle: string
  businessArchitecture: {
    stakeholders: Stakeholder[]
    valueChain: ValueChainStep[]
    capabilities: BusinessCapability[]
    pakistanContext: PakistanContextArea[]
  }
  dataArchitecture: {
    starSchema: StarSchemaSummary
    lineage: LineageItem[]
    gapExtensions: GapExtension[]
  }
  technologyArchitecture: {
    layers: TechLayer[]
    techStack: TechStackItem[]
  }
  useCases: UseCase[]
  roadmap: { phases: RoadmapPhase[] }
}

interface Stakeholder {
  role: string
  interest: string
  kpis: string[]
}

interface ValueChainStep {
  step: number
  name: string
  description: string
  owner: string
  outputs: string[]
}

interface BusinessCapability {
  id: string
  name: string
  description: string
  priority: string
  phase: number
}

interface PakistanContextArea {
  area: string
  items: string[]
}

interface StarSchemaSummary {
  summary: string
  facts: { name: string; grain: string; measures: number }[]
  dimensions: { name: string; purpose: string; keyColumns: string[] }[]
  aggregates: { name: string; grain: string; measures: number }[]
}

interface LineageItem {
  targetColumn: string
  transformation: string
  sourceEntities: string[]
  businessMeasure: string
}

interface GapExtension {
  module: string
  tables: string[]
  purpose: string
}

interface TechLayer {
  name: string
  type: string
  components: TechComponent[]
}

interface TechComponent {
  name: string
  feeds?: string
  frequency?: string
  owner?: string
  purpose?: string
}

interface TechStackItem {
  component: string
  tech: string
  rationale: string
}

interface UseCase {
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

interface RoadmapPhase {
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

export async function loadProfitabilityWorkbench(): Promise<WorkbenchData> {
  const data = await import('../data/profitabilityWorkbench.json')
  return data.default as unknown as WorkbenchData
}

export function convertUseCasesToCSV(useCases: UseCase[]): Record<string, unknown>[] {
  return useCases.map((uc) => ({
    ID: uc.id,
    Title: uc.title,
    Objective: uc.objective,
    BusinessValue: uc.businessValue,
    Capabilities: uc.capabilities.join('; '),
    DataEntities: uc.dataEntities.join('; '),
    Measures: uc.measures.join('; '),
    Phase: uc.phase,
    Owner: uc.owner,
    KpiTarget: uc.kpiTarget,
  }))
}

export function roadmapToCSV(phases: RoadmapPhase[]): Record<string, unknown>[] {
  return phases.flatMap((p) =>
    p.deliverables.map((d, i) => ({
      Phase: `${p.phase} - ${p.name}`,
      Timeline: p.timeline,
      Theme: p.theme,
      Deliverable: d,
      Capabilities: i === 0 ? p.capabilities.join('; ') : '',
      DataDependencies: i === 0 ? p.dataDependencies.join('; ') : '',
      QuickWins: i === 0 ? p.quickWins.join('; ') : '',
      Risks: i === 0 ? p.risks.join('; ') : '',
      KPIs: i === 0 ? p.kpis.join('; ') : '',
    }))
  )
}

