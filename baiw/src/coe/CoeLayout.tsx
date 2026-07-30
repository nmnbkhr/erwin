import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Banknote, Swords, TrendingUp,
  Cpu, Map, Database, ChevronLeft, ChevronRight, Search,
  ArrowLeft, Home,
} from 'lucide-react'
import EngagementSwitcher from '../components/shared/EngagementSwitcher'

const navItems = [
  { path: '/coe', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/coe/usecases', label: 'Use Cases', icon: Banknote },
  { path: '/coe/gametheory', label: 'Game Theory', icon: Swords },
  { path: '/coe/revenue', label: 'Revenue Engine', icon: TrendingUp },
  { path: '/coe/architecture', label: 'Architecture', icon: Cpu },
  { path: '/coe/roadmap', label: 'Roadmap', icon: Map },
  { path: '/coe/data-coverage', label: 'FSDM Coverage', icon: Database },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function CoeLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const isCoe = location.pathname.startsWith('/coe')

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isCoe) {
      e.preventDefault()
      setSearchOpen(prev => !prev)
    }
  }, [isCoe])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-[260px]'}`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-700">
          {!collapsed && (
            <div>
              <span className="text-xl font-bold tracking-wide text-amber-400">COE</span>
              <span className="text-xs text-slate-400 ml-2">Cash Optimization</span>
            </div>
          )}
          {collapsed && <span className="text-xl font-bold text-amber-400 mx-auto">C</span>}
        </div>

        {/* Module Switcher */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <Link to="/" className="text-center text-xs py-1.5 px-2 rounded-md transition-colors text-slate-400 hover:text-white" title="Suite Home">
              <Home size={14} className="mx-auto" />
            </Link>
            <Link to="/dashboard" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              BAIW
            </Link>
            <Link to="/taiw" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              TAIW
            </Link>
            <Link to="/coe" className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${isCoe ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              COE
            </Link>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/coe'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700/60 text-amber-400 border-l-3 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <>
            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 mx-2 mb-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
              <ArrowLeft size={16} />
              Back to BAIW
            </Link>
            <Link to="/" className="flex items-center gap-2 px-4 py-2 mx-2 mb-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
              <Home size={16} />
              Suite Home
            </Link>
          </>
        )}

        {!collapsed && (
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
            COE v1.0 | 10 Use Cases | PKR 7.8–12.7B
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-[260px]'}`}>
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <span className="text-lg font-semibold text-slate-700">
            Cash Optimization Engine
          </span>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-md mx-auto flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-colors"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search use cases, techniques...</span>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-white text-slate-400 rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>
          <EngagementSwitcher accent="amber" />
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* Simple search modal */}
      {searchOpen && <CoeSearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}

function CoeSearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const location = useLocation()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const items = [
    { label: 'Dashboard', path: '/coe', keywords: 'overview stats impact' },
    { label: 'Use Cases', path: '/coe/usecases', keywords: 'vault atm crr nostro vostro denomination cit digital attribution' },
    { label: 'Game Theory', path: '/coe/gametheory', keywords: 'nash stackelberg auction cooperative mechanism' },
    { label: 'Revenue Engine', path: '/coe/revenue', keywords: 'calculator simulator float cost savings' },
    { label: 'Architecture', path: '/coe/architecture', keywords: 'system layers technology stack' },
    { label: 'Roadmap', path: '/coe/roadmap', keywords: 'phases timeline milestones implementation' },
  ]

  const filtered = query
    ? items.filter(i => `${i.label} ${i.keywords}`.toLowerCase().includes(query.toLowerCase()))
    : items

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search COE pages..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 text-slate-400 rounded border border-slate-200">Esc</kbd>
        </div>
        <ul className="py-2 max-h-64 overflow-y-auto">
          {filtered.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors ${
                  location.pathname === item.path ? 'text-amber-600 font-medium' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400 text-center">No results found</li>
          )}
        </ul>
      </div>
    </div>
  )
}
