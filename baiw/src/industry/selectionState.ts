import type { Dispatch, SetStateAction } from 'react'
import { usePersistedState } from '../engagement/usePersistedState'
import { isUseCaseSelection, type UseCaseSelection } from './selection'

/** Registered in engagement/PERSISTED_BASES so lifecycle operations cannot omit it. */
export const USE_CASE_SELECTION_BASE = 'dgiw.use-cases'

export function useUseCaseSelection(): [UseCaseSelection, Dispatch<SetStateAction<UseCaseSelection>>] {
  return usePersistedState<UseCaseSelection>(USE_CASE_SELECTION_BASE, [], isUseCaseSelection)
}
