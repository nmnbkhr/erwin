import { useState, useEffect } from 'react'
import {
  Building2, Hospital, Users, Heart, Shield, Activity,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, MinusCircle,
  Stethoscope, Baby, Syringe, Bug, Pill, FlaskConical,
  Apple, UserCheck, HeartPulse, Globe, Layers, ChevronRight,
  MapPin, Banknote, FileCode2, BarChart3,
} from 'lucide-react'
import { loadPakistanContext } from '../data'
import type { HaiwPakistanContext } from '../types'

/* ─── Sehat Sahulat hardcoded data ─── */
const sehatSahulat = {
  coverage: '164 million',
  annualLimit: 'PKR 1,000,000',
  familyLimit: 'per family per year',
  tiers: [
    { name: 'Tier-I', description: 'Secondary care hospitals', beds: '25-50 beds' },
    { name: 'Tier-II', description: 'Tertiary care hospitals', beds: '50-200 beds' },
    { name: 'Tier-III', description: 'Specialized/teaching hospitals', beds: '200+ beds' },
  ],
  claimCategories: [
    { name: 'Surgical', description: 'All major and minor surgical procedures', icon: Stethoscope },
    { name: 'Medical', description: 'In-patient medical treatments and diagnostics', icon: HeartPulse },
    { name: 'Maternity', description: 'Normal delivery, C-section, complications', icon: Baby },
    { name: 'Diagnostics', description: 'Lab tests, imaging, pathology', icon: FlaskConical },
  ],
  provinceWise: [
    { province: 'Punjab', beneficiaries: '60M', color: 'bg-emerald-500' },
    { province: 'Sindh', beneficiaries: '35M', color: 'bg-emerald-400' },
    { province: 'KPK', beneficiaries: '30M', color: 'bg-teal-500' },
    { province: 'Balochistan', beneficiaries: '12M', color: 'bg-teal-400' },
    { province: 'ICT', beneficiaries: '5M', color: 'bg-emerald-300' },
    { province: 'AJK/GB', beneficiaries: '22M', color: 'bg-teal-300' },
  ],
}

/* ─── Program Icons ─── */
const programIcons: Record<string, typeof Heart> = {
  EPI: Syringe,
  MNCH: Baby,
  'TB-DOTS': Bug,
  Malaria: Bug,
  Polio: Syringe,
  HIV: Shield,
  Hepatitis: Pill,
  Nutrition: Apple,
  LHW: UserCheck,
  NCD: HeartPulse,
}

/* ─── Stat categories ─── */
const statCategories = [
  {
    title: 'Demographics',
    color: 'emerald',
    keys: [
      { key: 'population', label: 'Population', icon: Users },
      { key: 'lifeExpectancy', label: 'Life Expectancy (years)', icon: Heart },
      { key: 'infantMortality', label: 'Infant Mortality (per 1000)', icon: Baby },
      { key: 'maternalMortality', label: 'Maternal Mortality (per 100k)', icon: Activity },
    ],
  },
  {
    title: 'Infrastructure',
    color: 'teal',
    keys: [
      { key: 'hospitals', label: 'Hospitals', icon: Hospital },
      { key: 'bhus', label: 'Basic Health Units', icon: Building2 },
      { key: 'rhcs', label: 'Rural Health Centres', icon: MapPin },
      { key: 'hospitalBeds', label: 'Hospital Beds', icon: Hospital },
    ],
  },
  {
    title: 'Workforce',
    color: 'emerald',
    keys: [
      { key: 'doctors', label: 'Registered Doctors', icon: Stethoscope },
      { key: 'ladyHealthWorkers', label: 'Lady Health Workers', icon: UserCheck },
    ],
  },
  {
    title: 'Coverage & Finance',
    color: 'teal',
    keys: [
      { key: 'healthExpenditure', label: 'Health Expenditure', icon: TrendingUp },
      { key: 'outOfPocket', label: 'Out-of-Pocket Spending', icon: Banknote },
      { key: 'sehatSahulatCoverage', label: 'Sehat Sahulat Coverage', icon: Shield },
    ],
  },
]

/* ─── Coding status icon helper ─── */
function statusIcon(status: string) {
  const lower = status.toLowerCase()
  if (lower.includes('fully') || lower.includes('adopted')) return <CheckCircle2 size={16} className="text-emerald-400" />
  if (lower.includes('partial')) return <MinusCircle size={16} className="text-amber-400" />
  return <XCircle size={16} className="text-red-400" />
}

/* ─── Facility pyramid colors ─── */
const pyramidColors = [
  'from-emerald-600 to-emerald-500',
  'from-emerald-500 to-teal-500',
  'from-teal-500 to-teal-400',
  'from-teal-400 to-emerald-400',
  'from-emerald-400 to-emerald-300',
  'from-emerald-300 to-teal-300',
]

/* ─── Main Component ─── */
export default function PakistanHealthReference() {
  const [ctx, setCtx] = useState<HaiwPakistanContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadPakistanContext()
      .then(data => { if (!cancelled) setCtx(data) })
      .catch(err => console.error('Failed to load Pakistan context', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Loading Pakistan Health Reference data...</p>
      </div>
    )
  }

  if (!ctx) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Failed to load Pakistan context data.</p>
      </div>
    )
  }

  /* Group institutions by type */
  const institutionGroups = new Map<string, typeof ctx.institutions>()
  for (const inst of ctx.institutions) {
    const group = institutionGroups.get(inst.type) || []
    group.push(inst)
    institutionGroups.set(inst.type, group)
  }

  const typeBadgeColor: Record<string, string> = {
    Federal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Provincial: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    Regulatory: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  return (
    <div className="space-y-8">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-8 text-white shadow-lg">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={28} />
            <h1 className="text-3xl font-bold tracking-tight">Pakistan Health Reference</h1>
          </div>
          <p className="text-emerald-100 text-lg max-w-3xl">
            Comprehensive reference of Pakistan's healthcare system, institutional framework,
            facility hierarchy, priority programs, and coding standards adoption.
          </p>
        </div>
      </section>

      {/* ─── 1. Institutional Framework ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <Building2 size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Institutional Framework</h2>
        </div>

        <div className="space-y-6">
          {Array.from(institutionGroups.entries()).map(([type, institutions]) => (
            <div key={type}>
              <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers size={14} className="text-emerald-400/70" />
                {type} Institutions
                <span className="text-slate-500 text-xs font-normal normal-case">({institutions.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {institutions.map(inst => (
                  <div
                    key={inst.name}
                    className="bg-slate-700/40 border border-slate-600/30 rounded-lg p-4 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-white font-semibold text-sm">{inst.name}</h4>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${typeBadgeColor[inst.type] || 'bg-slate-600/20 text-slate-400 border-slate-500/30'}`}>
                        {inst.type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{inst.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. Facility Hierarchy ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <Hospital size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Facility Hierarchy</h2>
        </div>

        <div className="flex flex-col items-center gap-2 max-w-3xl mx-auto">
          {ctx.facilityHierarchy.map((facility, idx) => {
            const widthPercent = 40 + ((idx / Math.max(ctx.facilityHierarchy.length - 1, 1)) * 55)
            return (
              <div key={facility.level} className="w-full flex flex-col items-center">
                {idx > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400/60 my-1">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                )}
                <div
                  className={`bg-gradient-to-r ${pyramidColors[idx % pyramidColors.length]} rounded-lg p-4 text-center shadow-md border border-white/10`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div>
                      <span className="text-white font-bold text-lg block">{facility.name}</span>
                      <span className="text-white/80 text-xs">{facility.level}</span>
                    </div>
                    <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {String(facility.count)}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs mt-2 leading-relaxed">{facility.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
          <span>Tertiary</span>
          <div className="w-32 h-1 bg-gradient-to-r from-emerald-600 to-emerald-300 rounded-full" />
          <span>Primary / Community</span>
        </div>
      </section>

      {/* ─── 3. Sehat Sahulat Programme ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Sehat Sahulat Programme</h2>
          <span className="text-emerald-400/80 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Universal Health Coverage
          </span>
        </div>

        {/* Coverage headline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl p-5 text-center shadow-lg">
            <Users size={28} className="text-white/80 mx-auto mb-2" />
            <span className="text-3xl font-bold text-white block">{sehatSahulat.coverage}</span>
            <span className="text-emerald-100 text-sm">Beneficiaries Covered</span>
          </div>
          <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-xl p-5 text-center shadow-lg">
            <Banknote size={28} className="text-white/80 mx-auto mb-2" />
            <span className="text-3xl font-bold text-white block">{sehatSahulat.annualLimit}</span>
            <span className="text-teal-100 text-sm">{sehatSahulat.familyLimit}</span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl p-5 text-center shadow-lg">
            <Hospital size={28} className="text-white/80 mx-auto mb-2" />
            <span className="text-3xl font-bold text-white block">3 Tiers</span>
            <span className="text-emerald-100 text-sm">Hospital Empanelment Levels</span>
          </div>
        </div>

        {/* Hospital Tiers */}
        <div className="mb-6">
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">Hospital Empanelment Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sehatSahulat.tiers.map(tier => (
              <div key={tier.name} className="bg-slate-700/40 border border-slate-600/30 rounded-lg p-4">
                <span className="text-emerald-400 font-bold text-sm">{tier.name}</span>
                <p className="text-white text-sm mt-1">{tier.description}</p>
                <p className="text-slate-400 text-xs mt-1">{tier.beds}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Categories */}
        <div className="mb-6">
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">Claim Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sehatSahulat.claimCategories.map(cat => (
              <div key={cat.name} className="bg-slate-700/40 border border-slate-600/30 rounded-lg p-4 text-center hover:border-emerald-500/30 transition-colors">
                <cat.icon size={24} className="text-emerald-400 mx-auto mb-2" />
                <span className="text-white font-semibold text-sm block">{cat.name}</span>
                <p className="text-slate-400 text-xs mt-1">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Province-wise Coverage */}
        <div>
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">Province-wise Coverage</h3>
          <div className="space-y-2">
            {sehatSahulat.provinceWise.map(prov => {
              const numericValue = parseFloat(prov.beneficiaries)
              const maxValue = 60
              const barWidth = (numericValue / maxValue) * 100
              return (
                <div key={prov.province} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm w-28 shrink-0">{prov.province}</span>
                  <div className="flex-1 bg-slate-700/30 rounded-full h-6 overflow-hidden">
                    <div
                      className={`${prov.color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-white text-xs font-semibold">{prov.beneficiaries}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. Priority Programs ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Priority Health Programs</h2>
          <span className="text-slate-400 text-sm">({ctx.priorityPrograms.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {ctx.priorityPrograms.map(prog => {
            const Icon = programIcons[prog.name] || Heart
            return (
              <div
                key={prog.name}
                className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-400/40 hover:shadow-emerald-500/5 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <h4 className="text-white font-bold text-sm">{prog.name}</h4>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mb-3">{prog.description}</p>
                <div className="space-y-2 border-t border-slate-600/30 pt-3">
                  <div>
                    <span className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Coverage</span>
                    <p className="text-slate-300 text-xs">{prog.coverage}</p>
                  </div>
                  <div>
                    <span className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Key Indicator</span>
                    <p className="text-slate-300 text-xs">{prog.keyIndicator}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── 5. Health Statistics ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Health Statistics</h2>
        </div>

        <div className="space-y-6">
          {statCategories.map(cat => (
            <div key={cat.title}>
              <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cat.color === 'emerald' ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                {cat.title}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cat.keys.map(({ key, label, icon: Icon }) => {
                  const value = ctx.statistics[key]
                  if (value === undefined) return null
                  return (
                    <div
                      key={key}
                      className={`bg-slate-700/40 border rounded-lg p-4 text-center ${
                        cat.color === 'emerald'
                          ? 'border-emerald-500/20 hover:border-emerald-500/40'
                          : 'border-teal-500/20 hover:border-teal-500/40'
                      } transition-colors`}
                    >
                      <Icon size={20} className={`mx-auto mb-2 ${cat.color === 'emerald' ? 'text-emerald-400' : 'text-teal-400'}`} />
                      <span className="text-white text-xl font-bold block">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </span>
                      <span className="text-slate-400 text-xs mt-1 block leading-tight">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. Coding Standards ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <FileCode2 size={22} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-xl">Coding Standards Adoption</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-slate-400 text-xs uppercase tracking-wider font-medium pb-3 pr-4">Standard</th>
                <th className="text-slate-400 text-xs uppercase tracking-wider font-medium pb-3 pr-4">Status</th>
                <th className="text-slate-400 text-xs uppercase tracking-wider font-medium pb-3">Adoption Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {ctx.codingStandards.map(std => (
                <tr key={std.name} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="text-white font-semibold text-sm">{std.name}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {statusIcon(std.status)}
                      <span className="text-slate-300 text-sm">{std.status}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-slate-400 text-sm">{std.adoption}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 7. Challenges ─── */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle size={22} className="text-amber-400" />
          <h2 className="text-white font-semibold text-xl">Key Challenges</h2>
          <span className="text-slate-400 text-sm">({ctx.challenges.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ctx.challenges.map(ch => (
            <div
              key={ch.challenge}
              className="bg-slate-700/40 border border-slate-600/30 rounded-lg p-5 hover:border-amber-500/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={16} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1">{ch.challenge}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">{ch.description}</p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                    <span className="text-red-400/80 text-[10px] uppercase tracking-wider font-medium">Impact</span>
                    <p className="text-red-300/90 text-xs mt-0.5">{ch.impact}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
