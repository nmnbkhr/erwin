/**
 * The live wiring for the gap register — the ONLY file that joins the four
 * stores to `gapRegister()`. The register itself is pure (no hooks, no
 * storage); this hook exists so the /gaps page, the Deliverables card and any
 * future consumer read the SAME answers, targets, tier, layer and intake —
 * a document that disagrees with the screen is worse than no document, and
 * two wirings drifting apart is how that happens.
 */
import { useMemo } from 'react'
import { useDiagnosticAnswers } from '../answers'
import { useAssessmentTier, useDiagnosticTargets } from '../assessmentState'
import { useLayer } from '../layer'
import { useProgramIntake } from '../intake/state'
import { gapExclusions, gapRegister, type GapEntry, type GapExclusion } from './register'
import type { AssessmentTier } from '../tier'
import type { LayerFilter } from '../types'

export interface LiveGapRegister {
  entries: GapEntry[]
  exclusions: GapExclusion[]
  tier: AssessmentTier
  layer: LayerFilter
}

export function useGapRegister(): LiveGapRegister {
  const [answers] = useDiagnosticAnswers()
  const [targets] = useDiagnosticTargets()
  const [tier] = useAssessmentTier()
  const { filter } = useLayer()
  const [intake] = useProgramIntake()

  return useMemo(
    () => ({
      entries: gapRegister(answers, targets, tier, filter, intake),
      exclusions: gapExclusions(answers, targets, tier, filter),
      tier,
      layer: filter,
    }),
    [answers, targets, tier, filter, intake],
  )
}
