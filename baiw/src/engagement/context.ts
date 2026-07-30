/**
 * Engagement context object and hooks.
 *
 * Split from EngagementContext.tsx for the same reason `dgiw/layer.ts` is split
 * from `dgiw/LayerContext.tsx`: a file that exports both components and plain
 * values falls outside the Fast Refresh boundary and forces a full reload on
 * every edit. The provider lives next door; everything non-component lives here.
 */
import { createContext, useContext } from 'react'
import type { Engagement } from './types'

export interface EngagementContextValue {
  engagements: Engagement[]
  /** The engagement all module state is currently filed under, or null. */
  active: Engagement | null
  /** Convenience: `active?.id ?? null`. The namespace every module reads with. */
  activeId: string | null
  create: (orgName: string) => Engagement
  rename: (id: string, orgName: string) => void
  /** Patch any user-editable field. rename() is this, narrowed. */
  update: (id: string, patch: Partial<Pick<Engagement, 'orgName' | 'layer' | 'notes'>>) => void
  remove: (id: string) => void
  setActive: (id: string) => void
  duplicate: (id: string) => Engagement | null
  /**
   * Async because file-saver is loaded on demand. Typed as Promise so a caller
   * cannot accidentally fire-and-forget it: declaring it `=> void` over an async
   * implementation turns a failed `import()` or a blocked download into an
   * unhandled rejection with nothing shown to the user.
   */
  exportOne: (id: string) => Promise<void>
  importOne: (file: File) => Promise<Engagement>
}

export const EngagementCtx = createContext<EngagementContextValue | null>(null)

export function useEngagement(): EngagementContextValue {
  const ctx = useContext(EngagementCtx)
  if (!ctx) throw new Error('useEngagement must be used inside an EngagementProvider')
  return ctx
}

/**
 * Non-throwing variant. `usePersistedState` is the only intended caller: it must
 * work as plain useState when no provider is mounted, so that a component can be
 * rendered in isolation without dragging the whole suite context in.
 */
export function useEngagementOptional(): EngagementContextValue | null {
  return useContext(EngagementCtx)
}
