import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Database, Layers, Globe, ClipboardCheck } from 'lucide-react'
import { globalSearchLight, type GlobalSearchResult } from '../../utils/search'
import { loadEntityIndex, loadCapabilities, loadDomains, loadBacrQuestions } from '../../utils/dataLoader'
import type { EntityIndexEntry, Capability, Domain, BacrQuestion } from '../../types'

const TYPE_ICONS = {
  entity: Database,
  capability: Layers,
  domain: Globe,
  bacr: ClipboardCheck,
}

const TYPE_LABELS: Record<string, string> = {
  entity: 'Entities',
  capability: 'Capabilities',
  domain: 'Domains',
  bacr: 'BACR Categories',
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [data, setData] = useState<{
    entityIndex: EntityIndexEntry[]
    capabilities: Capability[]
    domains: Domain[]
    bacrQuestions: BacrQuestion[]
  } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      Promise.all([loadEntityIndex(), loadCapabilities(), loadDomains(), loadBacrQuestions()]).then(
        ([entityIndex, capabilities, domains, bacrQuestions]) => {
          setData({ entityIndex, capabilities, domains, bacrQuestions })
        }
      )
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!data || !query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const r = globalSearchLight(query, data.entityIndex, data.capabilities, data.domains, data.bacrQuestions)
      setResults(r)
      setSelectedIndex(0)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, data])

  const navigateToResult = useCallback(
    (result: GlobalSearchResult) => {
      onClose()
      switch (result.type) {
        case 'entity':
          navigate(`/model?search=${encodeURIComponent(result.name)}`)
          break
        case 'capability':
          navigate(`/capabilities?cap=${encodeURIComponent(result.id)}`)
          break
        case 'domain':
          navigate(`/model?domain=${encodeURIComponent(result.name)}`)
          break
        case 'bacr':
          navigate('/maturity')
          break
      }
    },
    [navigate, onClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigateToResult(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  const grouped: Record<string, GlobalSearchResult[]> = {}
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  })

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entities, capabilities, domains..."
            className="flex-1 text-sm outline-none placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto py-2">
            {(['entity', 'capability', 'domain', 'bacr'] as const).map((type) => {
              const items = grouped[type]
              if (!items || items.length === 0) return null
              const Icon = TYPE_ICONS[type]
              return (
                <div key={type}>
                  <div className="px-4 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {TYPE_LABELS[type]}
                  </div>
                  {items.map((result) => {
                    const thisIndex = flatIndex++
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => navigateToResult(result)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${
                          thisIndex === selectedIndex
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={14} className={thisIndex === selectedIndex ? 'text-blue-500' : 'text-slate-400'} />
                        <span className="flex-1 truncate font-medium">{result.name}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[180px]">{result.detail}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No results found for "{query}"
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center text-xs text-slate-400">
            Type at least 2 characters to search across entities, capabilities, domains, and BACR categories
          </div>
        )}
      </div>
    </div>
  )
}
