import { useState, useMemo, type ReactNode } from 'react'
import type { Layer, LayerFilter } from './types'
import { LayerCtx, LAYER_LABEL, layerShows, readStoredFilter, writeStoredFilter, type LayerContextValue } from './layer'
import { useEngagementOptional } from '../engagement/context'

export function LayerProvider({ children }: { children: ReactNode }) {
  const engagement = useEngagementOptional()
  const active = engagement?.active ?? null

  // Per-tab sessionStorage is now only the fallback for having no engagement at
  // all — see the header comment in layer.ts for why the original per-tab
  // rationale no longer applies. An engagement that has not chosen a layer shows
  // the combined view; it deliberately does NOT inherit whatever the previous
  // engagement was being viewed as, which would put one client's scope on
  // another client's screen.
  const [fallback, setFallback] = useState<LayerFilter>(readStoredFilter)
  const filter: LayerFilter = active ? (active.layer ?? 'all') : fallback

  const value = useMemo<LayerContextValue>(() => {
    const shows = (layer: Layer) => layerShows(filter, layer)
    return {
      filter,
      setFilter: (f: LayerFilter) => {
        // Written both places on purpose: the engagement is the source of truth,
        // the session copy is what a not-yet-named engagement inherits.
        writeStoredFilter(f)
        setFallback(f)
        if (active) engagement?.update(active.id, { layer: f })
      },
      shows,
      keep: (items) => items.filter((i) => shows(i.layer)),
    }
  }, [filter, active, engagement])

  return <LayerCtx.Provider value={value}>{children}</LayerCtx.Provider>
}

/** Small inline badge used wherever a record's layer needs to be visible. */
export function LayerBadge({ layer }: { layer: Layer }) {
  const styles =
    layer === 'banking'
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${styles}`}>
      {LAYER_LABEL[layer]}
    </span>
  )
}
