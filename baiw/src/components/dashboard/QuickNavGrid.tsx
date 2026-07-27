import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Database, Layers, Network,
  ClipboardCheck, DollarSign, Map, Landmark, Banknote, Workflow,
  BarChart3, PieChart,
} from 'lucide-react'

const modules = [
  { path: '/architecture', label: 'Architecture', desc: 'Unified BVF + FSDM + BACR cockpit', icon: Workflow, color: 'text-purple-600' },
  { path: '/customer-profitability-workbench', label: 'CP Workbench', desc: 'TOGAF business-to-tech blueprint', icon: BarChart3, color: 'text-indigo-600' },
  { path: '/model', label: 'Data Model', desc: 'Explore FSDM entities & domains', icon: Database, color: 'text-blue-600' },
  { path: '/capabilities', label: 'Capabilities', desc: 'Browse BVF analytics capabilities', icon: Layers, color: 'text-amber-600' },
  { path: '/graph', label: 'Dependencies', desc: 'Capability-entity dependency graph', icon: Network, color: 'text-teal-600' },
  { path: '/maturity', label: 'Maturity', desc: 'BACR maturity assessment tool', icon: ClipboardCheck, color: 'text-violet-600' },
  { path: '/profitability', label: 'Profitability', desc: 'Star schema & P&L waterfall', icon: DollarSign, color: 'text-emerald-600' },
  { path: '/customer-profitability', label: 'Customer P&L', desc: 'Customer EVA / RAROC dashboard', icon: PieChart, color: 'text-rose-600' },
  { path: '/roadmap', label: 'Roadmap', desc: 'Build implementation roadmap', icon: Map, color: 'text-orange-600' },
  { path: '/pakistan', label: 'Pakistan', desc: 'SBP regulatory & Islamic banking', icon: Landmark, color: 'text-cyan-600' },
  { path: '/cash-optimization', label: 'Cash Optimization', desc: '10 Use Cases \u2022 PKR 7.8\u201312.7B Impact', icon: Banknote, color: 'text-amber-600' },
  { path: '/', label: 'Dashboard', desc: 'Overview stats & charts', icon: LayoutDashboard, color: 'text-sky-600' },
]

export default function QuickNavGrid() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {modules.map((m) => (
        <button
          key={m.path}
          onClick={() => navigate(m.path)}
          className="bg-white rounded-lg p-4 hover:shadow-md cursor-pointer transition text-left"
        >
          <m.icon size={20} className={`${m.color} mb-2`} />
          <p className="text-sm font-medium text-slate-700">{m.label}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-tight">{m.desc}</p>
        </button>
      ))}
    </div>
  )
}
