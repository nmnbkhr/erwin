import { Link } from 'react-router-dom'
import {
  Banknote, Building2, Truck, Shield, Globe, Cpu,
  BarChart3, Target, Users, Calculator, TrendingUp,
  Map, Swords, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import useCases from '../../data/coe/useCases.json'
import cashMetrics from '../../data/coe/cashMetrics.json'
import revenueModel from '../../data/coe/revenueModel.json'
import branchTypology from '../../data/coe/branchTypology.json'
import roadmap from '../../data/coe/implementationRoadmap.json'

const colorMap: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  cyan: '#06b6d4', teal: '#14b8a6', rose: '#f43f5e', orange: '#f97316',
  pink: '#ec4899', indigo: '#6366f1',
}

const phaseColors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b']

const branchIcons: Record<string, typeof Building2> = {
  'Cash-Surplus': TrendingUp,
  'Cash-Deficit': BarChart3,
  'Balanced': Target,
  'Seasonal': Globe,
  'Hub/CPC': Cpu,
}

function formatPKR(val: number) {
  if (val >= 1000) return `PKR ${(val / 1000).toFixed(1)}B`
  return `PKR ${val}M`
}

export default function CoeDashboard() {
  const leverData = revenueModel.leverBreakdown.map(l => ({
    name: l.lever.replace(' Optimization', '').replace(' Reduction', ''),
    min: l.savingMin,
    max: l.savingMax - l.savingMin,
  }))

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Cash Optimization Engine</h1>
        <p className="text-amber-100 text-lg mb-8">
          Game-Theoretic & Predictive Analytics Framework for Pakistan Commercial Banking
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Use Cases', value: `${useCases.length}`, icon: Banknote },
            { label: 'Annual Impact', value: `PKR ${(cashMetrics.annualImpactMin/1000).toFixed(1)}–${(cashMetrics.annualImpactMax/1000).toFixed(1)}B`, icon: TrendingUp },
            { label: 'Branches', value: `${cashMetrics.branches.toLocaleString()}+`, icon: Building2 },
            { label: 'ATMs', value: `${cashMetrics.atms.toLocaleString()}+`, icon: Calculator },
            { label: 'Game Models', value: '10', icon: Swords },
            { label: 'Roadmap', value: '4 Phases (24mo)', icon: Map },
          ].map(stat => (
            <div key={stat.label} className="bg-white/15 backdrop-blur rounded-xl p-4">
              <stat.icon size={20} className="text-amber-200 mb-2" />
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-amber-200 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Waterfall + Phase Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Waterfall Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Impact by Optimization Lever</h2>
          <p className="text-sm text-slate-500 mb-4">Min–Max annual savings (PKR Millions)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leverData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  [`PKR ${value}M`, name === 'min' ? 'Minimum' : 'Additional Upside']
                }
              />
              <Bar dataKey="min" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="min" />
              <Bar dataKey="max" stackId="a" fill="#fdba74" radius={[0, 4, 4, 0]} name="max" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Use Case Phase Timeline</h2>
          <p className="text-sm text-slate-500 mb-4">10 use cases across 4 implementation phases</p>
          <div className="space-y-3">
            {roadmap.map((phase, pi) => (
              <div key={phase.phaseNumber} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: phaseColors[pi] }}
                >
                  {phase.phaseNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{phase.name}</span>
                    <span className="text-xs text-slate-400">Mo {phase.months}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.useCases.map(ucId => {
                      const uc = useCases.find(u => u.id === ucId)
                      return (
                        <span
                          key={ucId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}
                          title={uc?.name}
                        >
                          {ucId}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Typology Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Branch Typology Profiles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {branchTypology.map(bt => {
            const Icon = branchIcons[bt.type] || Building2
            return (
              <div key={bt.type} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Icon size={16} className="text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{bt.type}</span>
                </div>
                <div className="text-xs text-slate-500 mb-3 line-clamp-2">{bt.cashProfile.split('.')[0]}.</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Vol</span>
                    <span className="font-medium text-slate-600">PKR {bt.avgDailyVolumePKR.min}–{bt.avgDailyVolumePKR.max}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Idle Cash</span>
                    <span className="font-medium text-slate-600">{bt.vaultIdlePct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Nav + Float Tiers + Pakistan Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Nav Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Explore</h2>
          <div className="space-y-2">
            {[
              { label: 'Use Case Explorer', path: '/coe/usecases', icon: Banknote, count: `${useCases.length} use cases` },
              { label: 'Game Theory Map', path: '/coe/gametheory', icon: Swords, count: '10 game models' },
              { label: 'Revenue Engine', path: '/coe/revenue', icon: TrendingUp, count: '6 optimization levers' },
              { label: 'System Architecture', path: '/coe/architecture', icon: Cpu, count: '4 layers, 8 sources' },
              { label: 'Implementation Roadmap', path: '/coe/roadmap', icon: Map, count: `${roadmap.length} phases, 24 months` },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <item.icon size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.count}</div>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Float Revenue Tiers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Float Revenue Tiers</h2>
          <div className="space-y-4">
            {revenueModel.floatRevenueTiers.map(tier => {
              const yieldVal = typeof tier.yield === 'number' ? `${tier.yield}%` : tier.yield
              const barWidth = typeof tier.yield === 'number' ? tier.yield * 4.5 : 45
              return (
                <div key={tier.tier}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">Tier {tier.tier}: {tier.name}</span>
                    <span className="text-amber-600 font-semibold">{yieldVal}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>{tier.risk}</span>
                    <span>{tier.liquidity}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pakistan Cash Landscape */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Pakistan Cash Landscape</h2>
          <div className="space-y-4">
            {[
              { label: 'Cash-to-GDP Ratio', value: '12–14%', desc: 'Among highest in the region' },
              { label: 'SBP Policy Rate', value: `${cashMetrics.sbpPolicyRate}%`, desc: 'Current benchmark rate' },
              { label: 'CRR Band', value: '4–6%', desc: 'Daily min 4%, weekly avg 6%' },
              { label: 'CDM Mandate', value: '25% by 2028', desc: 'SBP cash deposit machine target' },
              { label: 'Avg Vault Idle Cash', value: `PKR ${cashMetrics.avgVaultIdleCash}M`, desc: 'Per branch average' },
              { label: 'ROA Improvement', value: cashMetrics.roaImprovement, desc: 'Potential from optimization' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <div className="text-sm font-bold text-amber-600">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
