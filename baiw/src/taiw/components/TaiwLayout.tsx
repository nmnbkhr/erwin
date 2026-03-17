import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Globe, Target, Share2,
  BarChart3, TrendingUp, Map, Flag,
  ChevronLeft, ChevronRight, Search, ArrowLeft, Home,
} from 'lucide-react'
import TaiwCommandPalette from './TaiwCommandPalette'

const navItems = [
  { path: '/taiw', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/taiw/model', label: 'WCO Model', icon: Globe },
  { path: '/taiw/capabilities', label: 'Capabilities', icon: Target },
  { path: '/taiw/graph', label: 'Dependencies', icon: Share2 },
  { path: '/taiw/maturity', label: 'Maturity', icon: BarChart3 },
  { path: '/taiw/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/taiw/roadmap', label: 'Roadmap', icon: Map },
  { path: '/taiw/pakistan', label: 'Pakistan Trade', icon: Flag },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function TaiwLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const isTaiw = location.pathname.startsWith('/taiw')

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen(prev => !prev)
    }
  }, [])

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
              <span className="text-xl font-bold tracking-wide text-teal-400">TAIW</span>
              <span className="text-xs text-slate-400 ml-2">Trade Analytics</span>
            </div>
          )}
          {collapsed && <span className="text-xl font-bold text-teal-400 mx-auto">T</span>}
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
            <Link to="/taiw" className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${isTaiw ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              TAIW
            </Link>
            <Link to="/haiw" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              HAIW
            </Link>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/taiw'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700/60 text-teal-400 border-l-3 border-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Back to BAIW link */}
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
            WCO DM v4.2 | TCF v1.0 | TACR v1.0
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
            Trade Analytics Intelligence Workbench
          </span>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-md mx-auto flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-colors"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search elements, capabilities...</span>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-white text-slate-400 rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>
        </header>

        <main className="p-6">{children}</main>
      </div>

      <TaiwCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
