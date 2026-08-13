import profitabilityWorkbench from '../../data/profitabilityWorkbench.json'
import type { IndustryUseCase } from '../types'

const SOURCE_DATASET = 'src/data/profitabilityWorkbench.json'

export const bankingAnalyticsUseCases: IndustryUseCase[] = profitabilityWorkbench.useCases.map((u) => ({
  id: `baiw:${u.id}`,
  sourceId: u.id,
  sourceModule: 'baiw',
  sector: 'banking',
  domain: 'banking-analytics',
  title: u.title,
  objective: u.objective,
  businessValue: u.businessValue,
  owner: u.owner,
  phase: u.phase,
  // These source records carry labels rather than BVF ids. Calling them labels
  // prevents a display string from masquerading as a governed foreign key.
  capabilityLabels: [...u.capabilities],
  modelRefs: u.dataEntities.map((reference) => ({ vocabulary: 'IMPLEMENTATION' as const, reference })),
  measures: [...u.measures],
  inputs: [],
  outputs: [],
  kpis: u.kpiTarget ? [u.kpiTarget] : [],
  dependencies: [],
  governance: { cdeRefs: [], dqRuleRefs: [], policyRefs: [] },
  sourceRoute: '/customer-profitability-workbench',
  sourceDataset: SOURCE_DATASET,
}))
