import almData from '../../alm/data/useCases.json'
import type { IndustryUseCase } from '../types'

const SOURCE_DATASET = 'src/alm/data/useCases.json'

export const almUseCases: IndustryUseCase[] = almData.map((u) => ({
  id: `alm:${u.id}`,
  sourceId: u.id,
  sourceModule: 'alm',
  sector: 'banking',
  domain: 'treasury-alm',
  title: u.name,
  objective: u.objective,
  businessValue: null,
  owner: null,
  phase: u.phase,
  capabilityLabels: [],
  // ALM is the one source in this first registry that explicitly names FSDM
  // entities. Other modules' star-schema table names stay IMPLEMENTATION refs.
  modelRefs: u.fsdmEntities.map((reference) => ({ vocabulary: 'FSDM' as const, reference })),
  measures: [],
  inputs: [...u.inputs],
  outputs: [...u.outputs],
  kpis: [],
  dependencies: [...u.dependencies],
  governance: { cdeRefs: [], dqRuleRefs: [], policyRefs: [] },
  sourceRoute: '/alm',
  sourceDataset: SOURCE_DATASET,
}))
