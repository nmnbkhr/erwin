import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Database,
  Layers,
  Network,
  ClipboardCheck,
  DollarSign,
  PieChart,
  Gem,
  Building2,
  GitCompareArrows,
  SlidersHorizontal,
  Presentation,
  Map,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Home,
  Banknote,
  Workflow,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/model', label: 'Model Explorer', icon: Database },
  { path: '/capabilities', label: 'Capabilities', icon: Layers },
  { path: '/graph', label: 'Dependency Graph', icon: Network },
  { path: '/maturity', label: 'Maturity Assessment', icon: ClipboardCheck },
  { path: '/profitability', label: 'Profitability Engine', icon: DollarSign },
  { path: '/customer-profitability', label: 'Customer Profitability', icon: PieChart },
  { path: '/customer-profitability-workbench', label: 'CP Workbench', icon: BarChart3 },
  { path: '/customer-value', label: 'Consumer 360° Value', icon: Gem },
  { path: '/corporate-value', label: 'Corporate 360° Value', icon: Building2 },
  { path: '/customer-comparison', label: 'Strategy Matrix', icon: GitCompareArrows },
  { path: '/what-if', label: 'What-If Lab', icon: SlidersHorizontal },
  { path: '/portfolio', label: 'Portfolio Roll-Up', icon: Layers },
  { path: '/deck', label: 'Use-Case Deck', icon: Presentation },
  { path: '/roadmap', label: 'Roadmap Builder', icon: Map },
  { path: '/pakistan', label: 'Pakistan Reference', icon: Landmark },
  { path: '/cash-optimization', label: 'Cash Optimization', icon: Banknote },
  { path: '/architecture', label: 'Architecture Cockpit', icon: Workflow },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const isBaiw = !location.pathname.startsWith('/taiw') && !location.pathname.startsWith('/haiw')

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      <div className="h-14 flex items-center px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="text-xl font-bold tracking-wide text-blue-400">BAIW</span>
        )}
        {collapsed && (
          <span className="text-xl font-bold text-blue-400 mx-auto">B</span>
        )}
      </div>

      {/* Module Switcher */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <Link to="/" className="text-center text-sm py-2 px-2 rounded-md transition-colors text-slate-400 hover:text-white" title="Suite Home">
              <Home size={16} className="mx-auto" />
            </Link>
            <Link to="/dashboard" className={`flex-1 text-center text-sm font-medium py-2 rounded-md transition-colors ${isBaiw ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              BAIW
            </Link>
            <Link to="/taiw" className="flex-1 text-center text-sm font-medium py-2 rounded-md transition-colors text-slate-400 hover:text-white">
              TAIW
            </Link>
            <Link to="/haiw" className="flex-1 text-center text-sm font-medium py-2 rounded-md transition-colors text-slate-400 hover:text-white">
              HAIW
            </Link>
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-700/60 text-blue-400 border-l-3 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  )
}
