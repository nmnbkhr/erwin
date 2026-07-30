/**
 * EngagementSwitcher — the one place a client engagement is chosen or managed.
 *
 * Imported by all six module headers. It is deliberately ONE component with an
 * `accent` prop rather than six coloured copies: this repo already carries six
 * near-identical layout shells and three near-identical PDF generators, and a
 * seventh family of copies is exactly the pattern CLAUDE.md forbids extending.
 *
 * The accent is a lookup of complete Tailwind class strings, not an interpolated
 * `bg-${accent}-600`. Tailwind v4 scans source text for whole class names, so an
 * interpolated one is never generated and the control silently renders unstyled.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Briefcase, Check, ChevronDown, Copy, Download, Pencil, Plus, Trash2, Upload, X,
} from 'lucide-react'
import { useEngagement } from '../../engagement/context'
import { engagementLabel } from '../../engagement/migrate'

export type Accent = 'purple' | 'teal' | 'emerald' | 'amber' | 'indigo' | 'rose'

interface AccentClasses {
  /** Active row / primary button fill. */
  solid: string
  /** Selected row background + text. */
  soft: string
  text: string
  ring: string
}

const ACCENTS: Record<Accent, AccentClasses> = {
  purple: { solid: 'bg-purple-600 hover:bg-purple-700', soft: 'bg-purple-50 text-purple-700', text: 'text-purple-600', ring: 'focus:ring-purple-500' },
  teal: { solid: 'bg-teal-600 hover:bg-teal-700', soft: 'bg-teal-50 text-teal-700', text: 'text-teal-600', ring: 'focus:ring-teal-500' },
  emerald: { solid: 'bg-emerald-600 hover:bg-emerald-700', soft: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600', ring: 'focus:ring-emerald-500' },
  amber: { solid: 'bg-amber-600 hover:bg-amber-700', soft: 'bg-amber-50 text-amber-700', text: 'text-amber-600', ring: 'focus:ring-amber-500' },
  indigo: { solid: 'bg-indigo-600 hover:bg-indigo-700', soft: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-600', ring: 'focus:ring-indigo-500' },
  rose: { solid: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-50 text-rose-700', text: 'text-rose-600', ring: 'focus:ring-rose-500' },
}

/** "3 minutes ago" without pulling in a date library — none is installed. */
function relativeTime(iso: string): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const secs = Math.round((Date.now() - then) / 1000)
  if (secs < 45) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(then).toLocaleDateString()
}

type Mode =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'rename'; id: string }
  | { kind: 'delete'; id: string }

export default function EngagementSwitcher({ accent = 'purple' }: { accent?: Accent }) {
  const { engagements, active, create, rename, remove, setActive, duplicate, exportOne, importOne } = useEngagement()
  const c = ACCENTS[accent]

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setMode({ kind: 'list' })
    setDraft('')
    setError(null)
  }, [])

  // Click-outside and Escape. Registered only while open so six mounted copies
  // of this component do not each hold a permanent document listener.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const target = mode.kind === 'rename' || mode.kind === 'delete' ? engagements.find((e) => e.id === mode.id) : undefined

  const handleImport = async (file: File) => {
    setError(null)
    try {
      await importOne(file)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  // exportOne loads file-saver on demand, so it can fail on a flaky network or a
  // blocked download. Surfaced in the same error line as import rather than
  // becoming a silent unhandled rejection.
  const handleExport = async (id: string) => {
    setError(null)
    try {
      await exportOne(id)
    } catch (err) {
      console.error('[engagement] export failed', err)
      setError(err instanceof Error ? err.message : 'Export failed.')
    }
  }

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        onClick={() => (open ? close() : setOpen(true))}
        title="Active engagement"
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors max-w-[260px]"
      >
        <Briefcase size={14} className={c.text} />
        <span className={`truncate ${active ? 'font-medium text-slate-700' : 'text-slate-400 italic'}`}>
          {active ? engagementLabel(active) : 'No engagement'}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white border border-slate-200 rounded-xl shadow-xl z-[120] overflow-hidden">
          {/* ---- Delete: typed confirmation ---- */}
          {mode.kind === 'delete' && target && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Delete this engagement?</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every assessment, roadmap and answer saved under{' '}
                <span className="font-medium text-slate-700">{engagementLabel(target)}</span> is removed from this
                browser. There is no server copy. Type the name to confirm.
              </p>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={engagementLabel(target)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${c.ring}`}
              />
              <div className="flex gap-2">
                <button
                  disabled={draft.trim() !== engagementLabel(target)}
                  onClick={() => {
                    remove(target.id)
                    close()
                  }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setMode({ kind: 'list' })
                    setDraft('')
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ---- New / Rename ---- */}
          {(mode.kind === 'new' || mode.kind === 'rename') && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                {mode.kind === 'new' ? 'New engagement' : 'Rename engagement'}
              </p>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  if (mode.kind === 'new') create(draft)
                  else rename(mode.id, draft)
                  close()
                }}
                placeholder="e.g. United Bank Limited"
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${c.ring}`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (mode.kind === 'new') create(draft)
                    else rename(mode.id, draft)
                    close()
                  }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg text-white ${c.solid}`}
                >
                  {mode.kind === 'new' ? 'Create' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setMode({ kind: 'list' })
                    setDraft('')
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ---- List ---- */}
          {mode.kind === 'list' && (
            <>
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Engagements</span>
                <button onClick={close} className="text-slate-300 hover:text-slate-500">
                  <X size={14} />
                </button>
              </div>

              <ul className="max-h-64 overflow-y-auto py-1">
                {engagements.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    No engagements yet. Create one to keep each client's work apart.
                  </li>
                )}
                {engagements.map((e) => {
                  const isActive = active?.id === e.id
                  return (
                    <li key={e.id} className="px-1.5">
                      <div
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${isActive ? c.soft : 'hover:bg-slate-50'}`}
                      >
                        <button onClick={() => setActive(e.id)} className="flex-1 min-w-0 text-left">
                          <span className="flex items-center gap-1.5">
                            {isActive && <Check size={12} className="shrink-0" />}
                            <span className={`text-sm truncate ${isActive ? 'font-medium' : 'text-slate-700'}`}>
                              {engagementLabel(e)}
                            </span>
                          </span>
                          <span className="block text-xs text-slate-400">updated {relativeTime(e.updatedAt)}</span>
                        </button>
                        <span className="flex items-center gap-0.5 shrink-0">
                          <button
                            title="Rename"
                            onClick={() => {
                              setDraft(e.orgName)
                              setMode({ kind: 'rename', id: e.id })
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-white"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            title="Duplicate"
                            onClick={() => duplicate(e.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-white"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            title="Export"
                            onClick={() => void handleExport(e.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-white"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => {
                              setDraft('')
                              setMode({ kind: 'delete', id: e.id })
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white"
                          >
                            <Trash2 size={13} />
                          </button>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {error && <p className="px-4 py-2 text-xs text-red-600 border-t border-slate-100">{error}</p>}

              <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setDraft('')
                    setMode({ kind: 'new' })
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg text-white ${c.solid}`}
                >
                  <Plus size={14} /> New
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                >
                  <Upload size={14} /> Import
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = '' // allow re-importing the same file
                    if (file) void handleImport(file)
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
