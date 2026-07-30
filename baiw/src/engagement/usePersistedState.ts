/**
 * usePersistedState — useState, filed under the active engagement.
 *
 * Replaces six hand-rolled `localStorage.getItem/setItem` pairs, each of which
 * wrote to one fixed key and so let a second client's answers overwrite the
 * first's.
 *
 * The subtle part is switching engagements. The obvious implementation — re-read
 * in an effect on activeId change — writes the *previous* engagement's state
 * into the *new* engagement's namespace, because the persist effect runs in the
 * same commit as the re-read effect and still closes over the old value. So the
 * value is re-read during render instead, using React's documented
 * "adjust state when a prop changes" pattern, and the id the value belongs to is
 * carried inside the state itself. The persist effect can then only ever write a
 * value to the namespace it was read from.
 */
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useEngagementOptional } from './context'
import { readNsRaw, writeNsRaw } from './storage'

interface Entry<T> {
  /** The engagement `value` was read from. null when no engagement is active. */
  id: string | null
  value: T
}

function readEntry<T>(base: string, id: string | null, initial: T, validate?: (parsed: unknown) => boolean): Entry<T> {
  if (id === null) return { id, value: initial }
  const raw = readNsRaw(base, id)
  if (raw === null) return { id, value: initial }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) return { id, value: initial }
    return { id, value: parsed as T }
  } catch {
    // Corrupt value — fall back to the initial state rather than throwing into a
    // render. The bad string is left on disk; the next write replaces it.
    return { id, value: initial }
  }
}

/**
 * @param base     the module's storage key, unchanged from before namespacing
 * @param initial  value used when nothing is stored for the active engagement
 * @param validate optional shape guard; a stored value that fails it is ignored
 *                 (preserves the per-call-site guards the ad-hoc loaders had)
 */
export function usePersistedState<T>(
  base: string,
  initial: T,
  validate?: (parsed: unknown) => boolean,
): [T, Dispatch<SetStateAction<T>>] {
  const engagement = useEngagementOptional()
  const activeId = engagement?.activeId ?? null

  const [entry, setEntry] = useState<Entry<T>>(() => readEntry(base, activeId, initial, validate))

  if (entry.id !== activeId) {
    // Engagement changed under us — discard this engagement's value and read the
    // new one now, before anything renders with the wrong client's answers.
    setEntry(readEntry(base, activeId, initial, validate))
  }

  useEffect(() => {
    if (entry.id === null) return // no engagement: behaves as plain useState
    let raw: string
    try {
      raw = JSON.stringify(entry.value)
    } catch {
      return // non-serialisable value — nothing sensible to persist
    }
    // The write on mount and on engagement switch re-writes a value identical to
    // the one just read. Harmless, and cheaper than the bookkeeping needed to
    // suppress it — these payloads are a few KB of answers at most.
    writeNsRaw(base, entry.id, raw)
  }, [base, entry])

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setEntry((prev) => ({
      ...prev,
      value: typeof action === 'function' ? (action as (p: T) => T)(prev.value) : action,
    }))
  }, [])

  return [entry.value, setValue]
}
