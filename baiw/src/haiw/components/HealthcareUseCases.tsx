import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, ShieldCheck, Heart, Building2, Pill,
  Timer, MapPin, Laptop, Sparkles, Flag, ArrowRight,
  Lightbulb, Target, Layers, BarChart3,
} from 'lucide-react'
import { loadCapabilities, loadFhirResources } from '../data'
import type { HaiwCapability, HaiwFhirResource } from '../types'

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type UseCaseType = 'public-health' | 'clinical' | 'financial' | 'operational' | 'digital'

interface UseCase {
  id: string
  title: string
  type: UseCaseType
  icon: typeof Activity
  capabilities: string[]
  fhir: string[]
  pakistanContext: string
  impact: string
  objective: string
}

/* ================================================================== */
/*  Static data                                                        */
/* ================================================================== */

const TYPE_COLORS: Record<UseCaseType, { bg: string; border: string; badge: string; text: string; label: string }> = {
  'public-health': { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', text: 'text-teal-700', label: 'Public Health' },
  clinical:        { bg: 'bg-red-50',  border: 'border-red-200',  badge: 'bg-red-100 text-red-700',   text: 'text-red-700',  label: 'Clinical' },
  financial:       { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700', label: 'Financial' },
  operational:     { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700', label: 'Operational' },
  digital:         { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-700', label: 'Digital' },
}

const USE_CASES: UseCase[] = [
  {
    id: 'UC-H1',
    title: 'Disease Surveillance & Outbreak Detection',
    type: 'public-health',
    icon: Activity,
    capabilities: ['HCF-087', 'HCF-089', 'HCF-090', 'HCF-091'],
    fhir: ['Condition', 'Observation', 'Location', 'Encounter', 'MeasureReport'],
    pakistanContext: 'NIH disease reporting, polio surveillance, dengue tracking',
    impact: 'Early outbreak detection saves 48-72 hours response time',
    objective: 'Real-time syndromic surveillance using FHIR-based condition and observation data to detect disease outbreaks across Pakistan\'s facility network',
  },
  {
    id: 'UC-H2',
    title: 'Maternal & Child Health Analytics',
    type: 'clinical',
    icon: Heart,
    capabilities: ['HCF-086', 'HCF-085', 'HCF-084'],
    fhir: ['Patient', 'Encounter', 'Observation', 'Immunization', 'Procedure'],
    pakistanContext: 'MNCH program, LHW visits, EPI coverage tracking',
    impact: 'Reduce MMR by identifying high-risk pregnancies, track immunization dropout',
    objective: 'Integrate MNCH registration, delivery, immunization, and growth monitoring data to improve maternal and child health outcomes',
  },
  {
    id: 'UC-H3',
    title: 'Sehat Sahulat Claims Intelligence',
    type: 'financial',
    icon: ShieldCheck,
    capabilities: ['HCF-057', 'HCF-058', 'HCF-059', 'HCF-060'],
    fhir: ['Coverage', 'Claim', 'ClaimResponse', 'ExplanationOfBenefit', 'Patient'],
    pakistanContext: 'SSP fraud detection, hospital empanelment analytics, benefit utilization',
    impact: 'Detect PKR 5-10B in fraudulent/waste claims annually',
    objective: 'Apply claims analytics to Sehat Sahulat Program data to detect fraud, waste, and abuse while optimizing benefit utilization',
  },
  {
    id: 'UC-H4',
    title: 'Hospital Performance Scorecard',
    type: 'operational',
    icon: Building2,
    capabilities: ['HCF-029', 'HCF-030', 'HCF-031', 'HCF-032'],
    fhir: ['MeasureReport', 'Encounter', 'Observation', 'Procedure', 'AdverseEvent'],
    pakistanContext: 'DHQ/THQ performance benchmarking, PHCIP accreditation readiness',
    impact: 'Identify bottom-decile facilities for targeted intervention',
    objective: 'Build standardized performance scorecards for Pakistan\'s public hospitals using quality measures, patient outcomes, and operational KPIs',
  },
  {
    id: 'UC-H5',
    title: 'Drug Utilization & Antimicrobial Stewardship',
    type: 'clinical',
    icon: Pill,
    capabilities: ['HCF-069', 'HCF-070', 'HCF-071', 'HCF-072'],
    fhir: ['MedicationRequest', 'MedicationDispense', 'MedicationAdministration', 'Observation'],
    pakistanContext: 'DRAP compliance, essential medicine stockout, AMR crisis',
    impact: 'Reduce inappropriate antibiotic use by 30-40%',
    objective: 'Monitor drug prescribing patterns, formulary compliance, and antimicrobial stewardship metrics to combat Pakistan\'s antimicrobial resistance crisis',
  },
  {
    id: 'UC-H6',
    title: 'Patient Flow & ED Optimization',
    type: 'operational',
    icon: Timer,
    capabilities: ['HCF-061', 'HCF-062', 'HCF-063', 'HCF-064'],
    fhir: ['Encounter', 'Location', 'Practitioner', 'ServiceRequest', 'Appointment'],
    pakistanContext: 'Teaching hospital ED overcrowding, bed management',
    impact: 'Reduce ED wait times by 40%, improve bed turnover by 25%',
    objective: 'Optimize patient flow through emergency departments and inpatient wards using real-time encounter and location data',
  },
  {
    id: 'UC-H7',
    title: 'Population Health Equity Mapping',
    type: 'public-health',
    icon: MapPin,
    capabilities: ['HCF-081', 'HCF-082', 'HCF-083', 'HCF-084'],
    fhir: ['Patient', 'Observation', 'Condition', 'Location', 'MeasureReport'],
    pakistanContext: 'District-level health disparity analysis, urban vs. rural gaps',
    impact: 'Target health spending to 50 most underserved districts',
    objective: 'Map population health indicators at district level to identify and address health inequities across Pakistan\'s 154 districts',
  },
  {
    id: 'UC-H8',
    title: 'Digital Health Maturity Assessment',
    type: 'digital',
    icon: Laptop,
    capabilities: ['HCF-097', 'HCF-098', 'HCF-103', 'HCF-108'],
    fhir: ['CapabilityStatement', 'ImplementationGuide', 'AuditEvent', 'OperationDefinition'],
    pakistanContext: 'HMIS data quality, FHIR readiness, HIE preparation',
    impact: 'Roadmap to Level 4 digital maturity in 3-5 years',
    objective: 'Assess and track digital health maturity of healthcare organizations using standardized frameworks aligned with WHO Digital Health Assessment toolkit',
  },
]

/* ================================================================== */
/*  UseCaseCard                                                        */
/* ================================================================== */

function UseCaseCard({
  uc,
  capMap,
  resMap,
}: {
  uc: UseCase
  capMap: Map<string, HaiwCapability>
  resMap: Map<string, HaiwFhirResource>
}) {
  const navigate = useNavigate()
  const colors = TYPE_COLORS[uc.type]
  const Icon = uc.icon

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.badge}`}>
              <Icon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{uc.id}</span>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{uc.title}</h3>
            </div>
          </div>
          <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${colors.badge}`}>
            {colors.label}
          </span>
        </div>
      </div>

      {/* Objective */}
      <div className="px-5 pb-3">
        <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
          <Target size={14} className="shrink-0 mt-0.5 text-slate-400" />
          <p>{uc.objective}</p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Layers size={12} className="text-emerald-500" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">HCF Capabilities</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {uc.capabilities.map((capId) => {
            const cap = capMap.get(capId)
            return (
              <button
                key={capId}
                onClick={() => navigate('/haiw/capabilities', { state: { highlight: capId } })}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer"
                title={cap?.name ?? capId}
              >
                {capId}
              </button>
            )
          })}
        </div>
      </div>

      {/* FHIR Resources */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={12} className="text-blue-500" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">FHIR Resources</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {uc.fhir.map((resName) => (
            <button
              key={resName}
              onClick={() => navigate('/haiw/model', { state: { highlight: resName } })}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
            >
              {resName}
            </button>
          ))}
        </div>
      </div>

      {/* Pakistan Context */}
      <div className="px-5 pb-2">
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Flag size={12} className="shrink-0 mt-0.5 text-emerald-500" />
          <span>{uc.pakistanContext}</span>
        </div>
      </div>

      {/* Impact */}
      <div className="px-5 pb-5 pt-1">
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-100/70 border border-emerald-200">
          <Lightbulb size={14} className="shrink-0 mt-0.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-800">{uc.impact}</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function HealthcareUseCases() {
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [fhirResources, setFhirResources] = useState<HaiwFhirResource[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<UseCaseType | 'all'>('all')

  useEffect(() => {
    Promise.all([loadCapabilities(), loadFhirResources()])
      .then(([caps, res]) => {
        setCapabilities(caps)
        setFhirResources(res)
      })
      .finally(() => setLoading(false))
  }, [])

  const capMap = useMemo(() => {
    const m = new Map<string, HaiwCapability>()
    capabilities.forEach((c) => m.set(c.id, c))
    return m
  }, [capabilities])

  const resMap = useMemo(() => {
    const m = new Map<string, HaiwFhirResource>()
    fhirResources.forEach((r) => m.set(r.name, r))
    return m
  }, [fhirResources])

  // Stats
  const allCapIds = useMemo(() => new Set(USE_CASES.flatMap((uc) => uc.capabilities)), [])
  const allFhirNames = useMemo(() => new Set(USE_CASES.flatMap((uc) => uc.fhir)), [])

  const filtered = filterType === 'all' ? USE_CASES : USE_CASES.filter((uc) => uc.type === filterType)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 size={24} />
              Healthcare Analytics Use Cases
            </h1>
            <p className="mt-1 text-emerald-100 text-sm max-w-xl">
              Real-world healthcare analytics scenarios mapped to HCF capabilities and FHIR R4 resources,
              contextualized for Pakistan's health system.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/15 rounded-lg px-4 py-2 backdrop-blur">
              <div className="text-2xl font-bold">{USE_CASES.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-100">Use Cases</div>
            </div>
            <div className="bg-white/15 rounded-lg px-4 py-2 backdrop-blur">
              <div className="text-2xl font-bold">{allCapIds.size}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-100">Capabilities</div>
            </div>
            <div className="bg-white/15 rounded-lg px-4 py-2 backdrop-blur">
              <div className="text-2xl font-bold">{allFhirNames.size}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-100">FHIR Resources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            filterType === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({USE_CASES.length})
        </button>
        {(Object.keys(TYPE_COLORS) as UseCaseType[]).map((t) => {
          const count = USE_CASES.filter((uc) => uc.type === t).length
          if (count === 0) return null
          const c = TYPE_COLORS[t]
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterType === t ? `${c.badge} ring-2 ring-offset-1 ring-current` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((uc) => (
          <UseCaseCard key={uc.id} uc={uc} capMap={capMap} resMap={resMap} />
        ))}
      </div>
    </div>
  )
}
