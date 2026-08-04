/**
 * The live wiring for plan slices — the ONLY file that joins the stores to
 * `planSlices()`, on gap/state.ts's pattern. The composition itself is pure;
 * this hook exists so the ImplementationPlan page, the Diagnostic roadmap and
 * the Deliverables card read the SAME slices from the SAME register — a plan
 * that disagrees with the gap screen it derives from is the failure
 * `scoring.ts` exists to prevent, two layers up.
 */
import { useMemo } from 'react'
import { useGapRegister } from '../gap/state'
import { useProgramIntake } from '../intake/state'
import {
  planSlices,
  sliceExclusions,
  type PillarPlanSlice,
  type SliceExclusion,
} from './slices'
import implementationPlan from '../data/implementationPlan.json'
import type { AssessmentTier } from '../tier'
import type { ImplementationPlanData, LayerFilter } from '../types'
import type { ProgramIntake } from '../intake/types'

const PLAN = implementationPlan as ImplementationPlanData

export interface LivePlanSlices {
  slices: PillarPlanSlice[]
  exclusions: SliceExclusion[]
  tier: AssessmentTier
  layer: LayerFilter
  intake: ProgramIntake
}

export function usePlanSlices(): LivePlanSlices {
  const { entries, tier, layer } = useGapRegister()
  const [intake] = useProgramIntake()

  return useMemo(
    () => ({
      slices: planSlices(entries, intake, PLAN, layer),
      exclusions: sliceExclusions(entries, intake, PLAN, layer),
      tier,
      layer,
      intake,
    }),
    [entries, intake, tier, layer],
  )
}
