import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Globe, Target, ArrowRight } from 'lucide-react'
import { loadElements, loadCapabilities } from '../data'
import type { TaiwElement, TaiwCapability } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

type Result = { type: string; label: string; sub: string; path: string }

export default function TaiwCommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [elements, setElements] = useState<TaiwElement[]>([])
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      Promise.all([loadElements(), loadCapabilities()]).then(([e, c]) => {
        setElements(e)
        setCapabilities(c)
      })
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelected(0)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) {
      return [
        { type: 'nav', label: 'Dashboard', sub: 'TAIW home', path: '/taiw' },
        { type: 'nav', label: 'WCO Model', sub: 'Browse data elements', path: '/taiw/model' },
        { type: 'nav', label: 'Capabilities', sub: 'Trade Capability Framework', path: '/taiw/capabilities' },
        { type: 'nav', label: 'Maturity Assessment', sub: 'Start TACR', path: '/taiw/maturity' },
        { type: 'nav', label: 'Switch to BAIW', sub: 'Banking Analytics', path: '/dashboard' },
      ]
    }
    const q = query.toLowerCase()
    const out: Result[] = []

    for (const el of elements) {
      if (out.length >= 20) break
      if (el.name.toLowerCase().includes(q) || el.domain.toLowerCase().includes(q)) {
        out.push({ type: 'element', label: el.name, sub: `${el.domain} > ${el.class}`, path: '/taiw/model' })
      }
    }
    for (const cap of capabilities) {
      if (out.length >= 30) break
      if (cap.sub.toLowerCase().includes(q) || cap.theme.toLowerCase().includes(q) || cap.group.toLowerCase().includes(q)) {
        out.push({ type: 'capability', label: cap.sub, sub: `${cap.theme} > ${cap.group}`, path: '/taiw/capabilities' })
      }
    }
    return out
  }, [query, elements, capabilities])

  useEffect(() => { setSelected(0) }, [results])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[selected]) { navigate(results[selected].path); onClose() }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search elements, capabilities, navigate..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.label}-${i}`}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors ${i === selected ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { navigate(r.path); onClose() }}
              onMouseEnter={() => setSelected(i)}
            >
              {r.type === 'element' ? <Globe size={16} /> : r.type === 'capability' ? <Target size={16} /> : <ArrowRight size={16} />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.label}</div>
                <div className="text-xs text-slate-400 truncate">{r.sub}</div>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{r.type}</span>
            </button>
          ))}
          {results.length === 0 && <div className="px-4 py-6 text-sm text-slate-400 text-center">No results found</div>}
        </div>
      </div>
    </div>
  )
}
