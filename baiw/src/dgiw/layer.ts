/**
 * Layer filter primitives.
 *
 * Split from LayerContext.tsx so that file exports only components — the hook and
 * the label map are plain values and belong outside the Fast Refresh boundary.
 */
import { createContext, useContext } from 'react'
import type { Layer, LayerFilter } from './types'

export interface LayerContextValue {
  filter: LayerFilter
  setFilter: (f: LayerFilter) => void
  /** True when an item tagged with `layer` should be visible under the current filter. */
  shows: (layer: Layer) => boolean
  /** Convenience filter for any array of layer-tagged records. */
  keep: <T extends { layer: Layer }>(items: T[]) => T[]
}

export const LayerCtx = createContext<LayerContextValue | null>(null)

export function useLayer() {
  const ctx = useContext(LayerCtx)
  if (!ctx) throw new Error('useLayer must be used inside a LayerProvider')
  return ctx
}

export const LAYER_LABEL: Record<Layer, string> = {
  core: 'Core',
  banking: 'Banking',
}

/**
 * The selected layer survives a reload.
 *
 * It was component state, so refreshing the page — or opening any DGIW route
 * directly — silently reverted a core-only engagement to the combined view. The
 * scope of an engagement is not a transient UI preference, and a consultant
 * demonstrating "this is the sector-neutral chassis" should not have it swapped
 * out from under them by a refresh. Per-tab, so two engagements can be open at once.
 */
const KEY = 'dgiw.layer'

export function readStoredFilter(): LayerFilter {
  try {
    const v = sessionStorage.getItem(KEY)
    return v === 'core' || v === 'banking' || v === 'all' ? v : 'all'
  } catch {
    return 'all' // private mode / storage disabled — degrade to the default, never throw
  }
}

export function writeStoredFilter(f: LayerFilter): void {
  try {
    sessionStorage.setItem(KEY, f)
  } catch {
    /* non-fatal */
  }
}
