import { Users, ArrowRight, MapPin, Landmark, Briefcase, Scale, PieChart, Building2, TrendingUp, Shield } from 'lucide-react'
import type { WorkbenchData } from '../../utils/profitabilityWorkbench'

interface Props {
  data: WorkbenchData['businessArchitecture']
}

const STAKEHOLDER_ICONS: Record<string, typeof Users> = {
  'CFO / Finance PM': PieChart,
  'CRO / Risk': Shield,
  'ALCO / Treasury': Scale,
  'CMO / Customer': Users,
  'Branch Network': Building2,
  'Product Management': Briefcase,
}

const PAKISTAN_ICONS: Record<string, typeof Landmark> = {
  Regulatory: Landmark,
  Tax: Scale,
  Islamic: MapPin,
  FTP: TrendingUp,
}

export default function BusinessArchitecture({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Stakeholders */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Stakeholders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.stakeholders.map((s) => {
            const Icon = STAKEHOLDER_ICONS[s.role] || Users
            return (
              <div key={s.role} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon size={16} className="text-blue-600" />
                  </div>
                  <span className="font-semibold text-sm text-slate-800">{s.role}</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{s.interest}</p>
                <div className="flex flex-wrap gap-1">
                  {s.kpis.map((kpi) => (
                    <span key={kpi} className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{kpi}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Value Chain */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Customer Profitability Value Chain</h2>
        <div className="space-y-3">
          {data.valueChain.map((step, idx) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{step.step}</div>
                {idx < data.valueChain.length - 1 && <div className="w-0.5 h-full bg-blue-200 my-1" />}
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-800">{step.name}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{step.owner}</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{step.description}</p>
                <div className="text-[10px] text-slate-500">
                  <span className="font-medium">Outputs:</span>{' '}
                  {step.outputs.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Business Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.capabilities.map((cap) => (
            <div key={cap.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-slate-800">{cap.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    cap.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    cap.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{cap.priority}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Phase {cap.phase}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pakistan Context */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Pakistan-Specific Context</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.pakistanContext.map((ctx) => {
            const Icon = PAKISTAN_ICONS[ctx.area] || MapPin
            return (
              <div key={ctx.area} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-emerald-600" />
                  <span className="font-semibold text-sm text-slate-800">{ctx.area}</span>
                </div>
                <ul className="space-y-1">
                  {ctx.items.map((item) => (
                    <li key={item} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <ArrowRight size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
