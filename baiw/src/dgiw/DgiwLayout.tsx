import { type ReactNode, useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardCheck, Layers, Users, Database, ShieldCheck,
  ListChecks, CalendarRange, Megaphone, ChevronLeft, ChevronRight, ArrowLeft, Home,
} from 'lucide-react'
import { useLayer } from './layer'
import type { LayerFilter } from './types'
import pillars from './data/pillars.json'
import diagnostic from './data/diagnostic.json'
import cdeRegister from './data/cdeRegister.json'
import dqRules from './data/dqRules.json'

// Counted from the datasets, not typed into the footer. The hardcoded figures had
// already drifted — they still read 56 CDEs and 81 rules after the core spine
// took those to 76 and 115.
const INVENTORY = [
  `${pillars.length} Pillars`,
  `${diagnostic.questions.length} Questions`,
  `${cdeRegister.length} CDEs`,
  `${dqRules.length} Rules`,
].join(' · ')

const navItems = [
  { path: '/dg', label: 'Practice Overview', icon: LayoutDashboard },
  { path: '/dg/diagnostic', label: 'Diagnostic Instrument', icon: ClipboardCheck },
  { path: '/dg/ladder', label: 'Service Offering', icon: Layers },
  { path: '/dg/operating-model', label: 'Operating Model', icon: Users },
  { path: '/dg/cde', label: 'CDE Register', icon: Database },
  { path: '/dg/rules', label: 'DQ Rule Library', icon: ShieldCheck },
  { path: '/dg/program', label: 'Program Setup', icon: ListChecks },
  { path: '/dg/plan', label: 'Implementation Plan', icon: CalendarRange },
  { path: '/dg/one-pager', label: 'Sales One-Pager', icon: Megaphone },
]

const LAYER_OPTIONS: { value: LayerFilter; label: string; hint: string }[] = [
  { value: 'all', label: 'Both', hint: 'Horizontal chassis plus the banking overlay' },
  { value: 'core', label: 'Core', hint: 'Sector-neutral methodology only' },
  { value: 'banking', label: 'Banking', hint: 'Banking overlay only' },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function DgiwLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { filter, setFilter } = useLayer()
  const location = useLocation()
  const isDg = location.pathname.startsWith('/dg')

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-[260px]'}`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-700">
          {!collapsed ? (
            <div>
              <span className="text-xl font-bold tracking-wide text-rose-400">DGIW</span>
              <span className="text-xs text-slate-400 ml-2">Data Governance</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-rose-400 mx-auto">D</span>
          )}
        </div>

        {/* Module switcher */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <Link to="/" className="text-center text-xs py-1.5 px-2 rounded-md transition-colors text-slate-400 hover:text-white" title="Suite Home">
              <Home size={14} className="mx-auto" />
            </Link>
            <Link to="/dashboard" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              BAIW
            </Link>
            <Link to="/alm" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              ALM
            </Link>
            <Link to="/dg" className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${isDg ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              DG
            </Link>
          </div>
        </div>

        {/* Layer toggle — the horizontal chassis / banking overlay switch */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">Layer</p>
            <div className="flex bg-slate-800 rounded-lg p-1">
              {LAYER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  title={opt.hint}
                  className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${
                    filter === opt.value ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dg'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700/60 text-rose-400 border-l-3 border-rose-400'
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
            <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
              DGIW v1.0 | {INVENTORY}
            </div>
          </>
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
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <span className="text-lg font-semibold text-slate-700">
            Data Governance Practice &mdash; Diagnostic to Managed Service
          </span>
          <span className="ml-auto text-xs text-slate-400">
            {filter === 'all' && 'Core chassis + banking overlay'}
            {filter === 'core' && 'Core chassis — sector-neutral'}
            {filter === 'banking' && 'Banking overlay only'}
          </span>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
