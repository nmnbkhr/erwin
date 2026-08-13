import tradeWorkbench from '../../taiw/data/workbench.json'
import type { IndustryUseCase } from '../types'

const SOURCE_DATASET = 'src/taiw/data/workbench.json'

export const tradeUseCases: IndustryUseCase[] = tradeWorkbench.useCases.map((u) => ({
  id: `taiw:${u.id}`,
  sourceId: u.id,
  sourceModule: 'taiw',
  sector: 'trade',
  domain: 'trade-analytics',
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
  sourceRoute: '/taiw/workbench',
  sourceDataset: SOURCE_DATASET,
}))
