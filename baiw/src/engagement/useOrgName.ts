/**
 * useOrgName — the client's name, read from and written to the active engagement.
 *
 * Five report generators each held this in a `useState('')` that was never
 * persisted and never shared: two of them open side by side could disagree about
 * who the client was, and neither agreed with the answers saved in localStorage.
 * The input stays exactly where it is — it is now how an engagement gets named.
 *
 * With no active engagement it degrades to plain component state, so a report
 * form still works on a browser that has never created one.
 */
import { useState } from 'react'
import { useEngagementOptional } from './context'

export function useOrgName(): [string, (value: string) => void] {
  const ctx = useEngagementOptional()
  // Declared unconditionally — it is the fallback store, used only when there is
  // no engagement to write to.
  const [local, setLocal] = useState('')

  const active = ctx?.active ?? null
  if (!ctx || !active) return [local, setLocal]

  return [active.orgName, (value: string) => ctx.rename(active.id, value)]
}
