/**
 * Intake persistence — one hook, on the engagement layer's own primitive.
 *
 * `usePersistedState` namespaces the value under the active engagement and
 * carries the corrupt-value degrade; nothing here re-implements either. The
 * base key is the only fact this file adds, and it lives here — not in the
 * page — because the page and the Deliverables card both need the same intake
 * and two call sites typing the same string is how a namespace forks.
 */
import type { Dispatch, SetStateAction } from 'react'
import { usePersistedState } from '../../engagement/usePersistedState'
import { emptyIntake, isProgramIntake, type ProgramIntake } from './types'

export const INTAKE_BASE = 'dgiw.intake'

export function useProgramIntake(): [ProgramIntake, Dispatch<SetStateAction<ProgramIntake>>] {
  return usePersistedState<ProgramIntake>(INTAKE_BASE, emptyIntake(), isProgramIntake)
}
