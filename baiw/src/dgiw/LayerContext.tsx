import { useState, useMemo, type ReactNode } from 'react'
import type { Layer, LayerFilter } from './types'
import { LayerCtx, LAYER_LABEL, readStoredFilter, writeStoredFilter, type LayerContextValue } from './layer'

export function LayerProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<LayerFilter>(readStoredFilter)

  const value = useMemo<LayerContextValue>(() => {
    const shows = (layer: Layer) => filter === 'all' || filter === layer
    return {
      filter,
      setFilter: (f: LayerFilter) => {
        writeStoredFilter(f)
        setFilterState(f)
      },
      shows,
      keep: (items) => items.filter((i) => shows(i.layer)),
    }
  }, [filter])

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
