import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Database,
  Layers,
  Network,
  ClipboardCheck,
  DollarSign,
  Map,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/model', label: 'Model Explorer', icon: Database },
  { path: '/capabilities', label: 'Capabilities', icon: Layers },
  { path: '/graph', label: 'Dependency Graph', icon: Network },
  { path: '/maturity', label: 'Maturity Assessment', icon: ClipboardCheck },
  { path: '/profitability', label: 'Profitability Engine', icon: DollarSign },
  { path: '/roadmap', label: 'Roadmap Builder', icon: Map },
  { path: '/pakistan', label: 'Pakistan Reference', icon: Landmark },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

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

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
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
