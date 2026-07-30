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
 * The visibility rule itself, with no React attached.
 *
 * LayerProvider builds its `shows` from this, and so does anything that has to
 * apply the same filter outside a component — a report generator runs from a
 * click handler, not from a hook, and a second copy of this predicate is exactly
 * how a PDF ends up disagreeing with the screen about what is in scope.
 */
export function layerShows(filter: LayerFilter, layer: Layer): boolean {
  return filter === 'all' || filter === layer
}

/**
 * The selected layer survives a reload.
 *
 * It was component state, so refreshing the page — or opening any DGIW route
 * directly — silently reverted a core-only engagement to the combined view. The
 * scope of an engagement is not a transient UI preference, and a consultant
 * demonstrating "this is the sector-neutral chassis" should not have it swapped
 * out from under them by a refresh.
 *
 * SUPERSEDED (suite-level engagement identity). The original rationale for
 * sessionStorage rather than localStorage was "per-tab, so two engagements can
 * be open at once" — with no engagement record to hang the choice on, a browser
 * tab was the only thing that could stand in for one. There is now a real
 * `Engagement`, and it carries `layer` directly, so the layer follows the
 * engagement rather than the tab: switching engagement in one tab switches the
 * layer with it, which is what the two-tab trick was approximating.
 *
 * These functions are kept as the fallback for the one case the engagement
 * record cannot cover — no engagement created yet. Whenever there is an active
 * engagement, LayerProvider uses `active.layer` and ignores the session copy.
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
