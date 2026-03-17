import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FileHeart, Target, ArrowRight, ClipboardList } from 'lucide-react'
import { loadFhirResources, loadCapabilities, loadHacrQuestions } from '../data'
import type { HaiwFhirResource, HaiwCapability } from '../types'
import type { HacrCategory } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

type Result = { type: string; label: string; sub: string; path: string }

export default function HaiwCommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [resources, setResources] = useState<HaiwFhirResource[]>([])
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [hacrCategories, setHacrCategories] = useState<HacrCategory[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open && !loaded) {
      Promise.all([loadFhirResources(), loadCapabilities(), loadHacrQuestions()]).then(([r, c, h]) => {
        setResources(r)
        setCapabilities(c)
        setHacrCategories(h.categories)
        setLoaded(true)
      })
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelected(0)
    }
  }, [open, loaded])

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) {
      return [
        { type: 'nav', label: 'Dashboard', sub: 'HAIW home', path: '/haiw' },
        { type: 'nav', label: 'FHIR Model', sub: 'Browse FHIR R5 resources', path: '/haiw/model' },
        { type: 'nav', label: 'Capabilities', sub: 'Healthcare Capability Framework', path: '/haiw/capabilities' },
        { type: 'nav', label: 'Dependencies', sub: 'Resource dependency graph', path: '/haiw/graph' },
        { type: 'nav', label: 'Maturity Assessment', sub: 'Start HACR assessment', path: '/haiw/maturity' },
        { type: 'nav', label: 'Analytics', sub: 'Star schemas & analytics layer', path: '/haiw/analytics' },
        { type: 'nav', label: 'Roadmap', sub: 'Implementation roadmap builder', path: '/haiw/roadmap' },
        { type: 'nav', label: 'Pakistan Health', sub: 'Pakistan healthcare context', path: '/haiw/pakistan' },
        { type: 'nav', label: 'Use Cases', sub: 'Healthcare analytics use cases', path: '/haiw/use-cases' },
        { type: 'nav', label: 'Switch to BAIW', sub: 'Banking Analytics', path: '/dashboard' },
        { type: 'nav', label: 'Switch to TAIW', sub: 'Trade Analytics', path: '/taiw' },
      ]
    }
    const q = query.toLowerCase()
    const out: Result[] = []

    for (const res of resources) {
      if (out.length >= 20) break
      if (res.name.toLowerCase().includes(q) || res.category.toLowerCase().includes(q)) {
        out.push({ type: 'resource', label: res.name, sub: res.category, path: '/haiw/model' })
      }
    }
    for (const cap of capabilities) {
      if (out.length >= 30) break
      if (cap.name.toLowerCase().includes(q) || cap.theme.toLowerCase().includes(q)) {
        out.push({ type: 'capability', label: cap.name, sub: `${cap.theme} > ${cap.group}`, path: '/haiw/capabilities' })
      }
    }
    for (const cat of hacrCategories) {
      if (out.length >= 35) break
      if (cat.name.toLowerCase().includes(q)) {
        out.push({ type: 'hacr', label: cat.name, sub: `${cat.questionCount} questions`, path: '/haiw/maturity' })
      }
    }
    return out
  }, [query, resources, capabilities, hacrCategories])

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
            placeholder="Search FHIR resources, capabilities, navigate..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.label}-${i}`}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors ${i === selected ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { navigate(r.path); onClose() }}
              onMouseEnter={() => setSelected(i)}
            >
              {r.type === 'resource' ? <FileHeart size={16} /> : r.type === 'capability' ? <Target size={16} /> : r.type === 'hacr' ? <ClipboardList size={16} /> : <ArrowRight size={16} />}
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
