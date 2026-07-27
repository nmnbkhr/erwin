import type { WorkbenchData, WorkbenchTab } from './types'

export interface WorkbenchTabConfig {
  id: WorkbenchTab
  label: string
}

export interface WorkbenchExportConfig {
  useCases: (useCases: WorkbenchData['useCases']) => Record<string, unknown>[]
  roadmap: (phases: WorkbenchData['roadmap']['phases']) => Record<string, unknown>[]
}

export function convertUseCasesToCSV(useCases: WorkbenchData['useCases']): Record<string, unknown>[] {
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

export function convertRoadmapToCSV(phases: WorkbenchData['roadmap']['phases']): Record<string, unknown>[] {
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
