/**
 * EngagementProvider — owns the engagement registry and the active selection.
 *
 * The registry is the single writer of `wb.engagements` and
 * `wb.engagement.active`; module state is written by `usePersistedState` under
 * `nsKey(base, activeId)`. Deleting an engagement therefore has to reach across
 * that split and delete the namespaced values too, which is why PERSISTED_BASES
 * lives at suite level rather than inside each module.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Engagement, EngagementBundle } from './types'
import { engagementLabel } from './migrate'
import { EngagementCtx, type EngagementContextValue } from './context'
import {
  collectNs,
  copyAllNs,
  newEngagementId,
  nowIso,
  readActiveId,
  readEngagements,
  removeAllNs,
  restoreNs,
  writeActiveId,
  writeEngagements,
} from './storage'

/** Filename-safe slug of an engagement's display name. */
function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'engagement'
  )
}

export function EngagementProvider({ children }: { children: ReactNode }) {
  const [engagements, setEngagements] = useState<Engagement[]>(() => readEngagements())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const stored = readActiveId()
    if (stored === null) return null
    // A dangling active id (engagement deleted in another tab) must not leave
    // every module writing into a namespace with no owner.
    return readEngagements().some((e) => e.id === stored) ? stored : null
  })

  /** Single persistence point: every mutation goes through here. */
  const commit = useCallback((next: Engagement[]) => {
    writeEngagements(next)
    setEngagements(next)
  }, [])

  const create = useCallback(
    (orgName: string): Engagement => {
      const at = nowIso()
      const e: Engagement = { id: newEngagementId(), orgName: orgName.trim(), createdAt: at, updatedAt: at }
      commit([...readEngagements(), e])
      writeActiveId(e.id)
      setActiveId(e.id)
      return e
    },
    [commit],
  )

  const update = useCallback(
    (id: string, patch: Partial<Pick<Engagement, 'orgName' | 'layer' | 'notes'>>) => {
      commit(
        readEngagements().map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e)),
      )
    },
    [commit],
  )

  const rename = useCallback((id: string, orgName: string) => update(id, { orgName }), [update])

  const setActive = useCallback((id: string) => {
    writeActiveId(id)
    setActiveId(id)
  }, [])

  const remove = useCallback(
    (id: string) => {
      // Namespaced state first: if the registry write succeeded and this did not,
      // the orphaned keys would be unreachable and undeletable through the UI.
      removeAllNs(id)
      const next = readEngagements().filter((e) => e.id !== id)
      commit(next)
      if (activeId === id) {
        const fallback = next[0]?.id ?? null
        writeActiveId(fallback)
        setActiveId(fallback)
      }
    },
    [activeId, commit],
  )

  const duplicate = useCallback(
    (id: string): Engagement | null => {
      const source = readEngagements().find((e) => e.id === id)
      if (!source) return null
      const at = nowIso()
      const copy: Engagement = {
        ...source,
        id: newEngagementId(),
        orgName: `${engagementLabel(source)} (copy)`,
        createdAt: at,
        updatedAt: at,
      }
      copyAllNs(source.id, copy.id)
      commit([...readEngagements(), copy])
      return copy
    },
    [commit],
  )

  // Async so file-saver is pulled at click time rather than imported statically.
  // A static import here put file-saver in the entry chunk, and because rollup
  // folds it into `vendor-export`, the entry then depended on vendor-export and
  // every first paint fetched the PDF engine, whether or not the visitor ever
  // exported anything. Measured both ways before changing it.
  //
  // Rejections propagate to the caller by design — the switcher renders them in
  // its error line. Swallowing them here would make a failed export look like a
  // successful one that produced no file.
  const exportOne = useCallback(async (id: string) => {
    const source = readEngagements().find((e) => e.id === id)
    if (!source) return
    const { saveAs } = await import('file-saver')
    const bundle: EngagementBundle = {
      kind: 'godaitec.engagement',
      version: 1,
      exportedAt: nowIso(),
      engagement: source,
      data: collectNs(source.id),
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' })
    saveAs(blob, `engagement-${slug(engagementLabel(source))}-${bundle.exportedAt.slice(0, 10)}.json`)
  }, [])

  const importOne = useCallback(
    async (file: File): Promise<Engagement> => {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('That file is not valid JSON.')
      }
      const b = parsed as Partial<EngagementBundle>
      if (b?.kind !== 'godaitec.engagement' || typeof b.engagement !== 'object' || b.engagement === null) {
        throw new Error('That file is not an engagement export.')
      }
      const src = b.engagement as Partial<Engagement>
      if (typeof src.orgName !== 'string') throw new Error('The engagement in that file has no organisation name.')

      const at = nowIso()
      // Always a fresh id: importing a file that came from this same browser
      // must not silently overwrite the engagement it was exported from.
      const imported: Engagement = {
        id: newEngagementId(),
        orgName: src.orgName,
        createdAt: typeof src.createdAt === 'string' ? src.createdAt : at,
        updatedAt: at,
        ...(src.layer === 'core' || src.layer === 'banking' || src.layer === 'all' ? { layer: src.layer } : null),
        ...(typeof src.notes === 'string' ? { notes: src.notes } : null),
      }
      if (b.data && typeof b.data === 'object') restoreNs(imported.id, b.data as Record<string, unknown>)
      commit([...readEngagements(), imported])
      writeActiveId(imported.id)
      setActiveId(imported.id)
      return imported
    },
    [commit],
  )

  const active = useMemo(
    () => (activeId === null ? null : (engagements.find((e) => e.id === activeId) ?? null)),
    [engagements, activeId],
  )

  const value = useMemo<EngagementContextValue>(
    () => ({
      engagements,
      active,
      activeId: active?.id ?? null,
      create,
      rename,
      update,
      remove,
      setActive,
      duplicate,
      exportOne,
      importOne,
    }),
    [engagements, active, create, rename, update, remove, setActive, duplicate, exportOne, importOne],
  )

  return <EngagementCtx.Provider value={value}>{children}</EngagementCtx.Provider>
}
