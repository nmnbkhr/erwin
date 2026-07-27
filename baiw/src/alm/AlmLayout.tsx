import { type ReactNode, useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Layers, Activity, Droplets, Scale, Database, BarChart3,
  ChevronLeft, ChevronRight, ArrowLeft, Home,
} from 'lucide-react'

const navItems = [
  { path: '/alm', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alm/workbench', label: 'ALCO Workbench', icon: BarChart3 },
  { path: '/alm/usecases', label: 'Use Cases', icon: Layers },
  { path: '/alm/irrbb', label: 'IRRBB & Repricing', icon: Activity },
  { path: '/alm/liquidity', label: 'Liquidity (LCR/NSFR)', icon: Droplets },
  { path: '/alm/ftp', label: 'FTP Engine', icon: Scale },
  { path: '/alm/data-coverage', label: 'Instrument Feed', icon: Database },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AlmLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const isAlm = location.pathname.startsWith('/alm')

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-[260px]'}`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-700">
          {!collapsed && (
            <div>
              <span className="text-xl font-bold tracking-wide text-indigo-400">ALM</span>
              <span className="text-xs text-slate-400 ml-2">Asset-Liability Mgmt</span>
            </div>
          )}
          {collapsed && <span className="text-xl font-bold text-indigo-400 mx-auto">A</span>}
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
            <Link to="/coe" className="flex-1 text-center text-xs py-1.5 rounded-md transition-colors text-slate-400 hover:text-white">
              COE
            </Link>
            <Link to="/alm" className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${isAlm ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              ALM
            </Link>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/alm'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700/60 text-indigo-400 border-l-3 border-indigo-400'
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
            ALM v1.0 | 8 Use Cases | FIS ALM · FTP · IRRBB
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
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <span className="text-lg font-semibold text-slate-700">
            Asset-Liability Management &amp; FTP Engine
          </span>
          <span className="ml-auto text-xs text-slate-400">
            UBL · Sierra + Symbols/CBS → FIS ALM PDM → FSDM
          </span>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
