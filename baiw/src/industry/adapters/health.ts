import healthWorkbench from '../../haiw/data/workbench.json'
import type { IndustryUseCase } from '../types'

const SOURCE_DATASET = 'src/haiw/data/workbench.json'

export const healthUseCases: IndustryUseCase[] = healthWorkbench.useCases.map((u) => ({
  id: `haiw:${u.id}`,
  sourceId: u.id,
  sourceModule: 'haiw',
  sector: 'health',
  domain: 'healthcare-analytics',
  title: u.title,
  objective: u.objective,
  businessValue: u.businessValue,
  owner: u.owner,
  phase: u.phase,
  capabilityLabels: [...u.capabilities],
  modelRefs: u.dataEntities.map((reference) => ({ vocabulary: 'IMPLEMENTATION' as const, reference })),
  measures: [...u.measures],
  inputs: [],
  outputs: [],
  kpis: u.kpiTarget ? [u.kpiTarget] : [],
  dependencies: [],
  governance: { cdeRefs: [], dqRuleRefs: [], policyRefs: [] },
  sourceRoute: '/haiw/workbench',
  sourceDataset: SOURCE_DATASET,
}))
