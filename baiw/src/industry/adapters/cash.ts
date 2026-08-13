import cashData from '../../data/coe/useCases.json'
import type { IndustryUseCase } from '../types'

const SOURCE_DATASET = 'src/data/coe/useCases.json'

export const cashUseCases: IndustryUseCase[] = cashData.map((u) => ({
  id: `coe:${u.id}`,
  sourceId: u.id,
  sourceModule: 'coe',
  sector: 'banking',
  domain: 'cash-operations',
  title: u.name,
  objective: u.objective,
  businessValue: u.revenueImpact?.mechanism ?? null,
  owner: null,
  phase: u.phase,
  capabilityLabels: [],
  modelRefs: [],
  measures: [],
  inputs: [...u.inputs],
  outputs: [...u.outputs],
  kpis: [],
  dependencies: [...u.dependencies],
  governance: { cdeRefs: [], dqRuleRefs: [], policyRefs: [] },
  sourceRoute: '/coe',
  sourceDataset: SOURCE_DATASET,
}))
