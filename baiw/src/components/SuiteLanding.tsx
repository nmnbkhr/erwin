import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Globe,
  Banknote,
  Heart,
  Scale,
  ArrowRight,
  Zap,
  Database,
  Layers,
  ClipboardCheck,
  Boxes,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Module {
  key: string
  path: string
  icon: LucideIcon
  name: string
  tagline: string
  description: string
  features: string[]
  classes: {
    card: string
    iconTile: string
    icon: string
    tagline: string
    dot: string
    enter: string
  }
}

const modules: Module[] = [
  {
    key: 'baiw',
    path: '/dashboard',
    icon: Building2,
    name: 'BAIW',
    tagline: 'Banking Analytics',
    description: 'Model-driven banking intelligence for Pakistani financial institutions.',
    features: [
      'Teradata FSDM v13 — 3,917 entities, 16 domains',
      'BVF Framework — 112 capabilities',
      'BACR Assessment — 793 questions',
      'SBP, KIBOR, Islamic Banking',
    ],
    classes: {
      card: 'hover:border-purple-500/60 hover:shadow-[0_0_50px_rgba(147,51,234,0.18)]',
      iconTile: 'bg-purple-600/20 ring-1 ring-purple-500/30',
      icon: 'text-purple-400',
      tagline: 'text-purple-400',
      dot: 'bg-purple-500',
      enter: 'text-purple-400 group-hover:text-purple-300',
    },
  },
  {
    key: 'taiw',
    path: '/taiw',
    icon: Globe,
    name: 'TAIW',
    tagline: 'Trade Analytics',
    description: 'Cross-border trade intelligence built on the WCO data model.',
    features: [
      'WCO Data Model v4.2 — 727 elements, 14 domains',
      'TCF Framework — 100 capabilities',
      'TACR Assessment — 640+ questions',
      'FBR, WeBOC, CPEC, GSP+',
    ],
    classes: {
      card: 'hover:border-teal-500/60 hover:shadow-[0_0_50px_rgba(20,184,166,0.18)]',
      iconTile: 'bg-teal-600/20 ring-1 ring-teal-500/30',
      icon: 'text-teal-400',
      tagline: 'text-teal-400',
      dot: 'bg-teal-500',
      enter: 'text-teal-400 group-hover:text-teal-300',
    },
  },
  {
    key: 'haiw',
    path: '/haiw',
    icon: Heart,
    name: 'HAIW',
    tagline: 'Healthcare Analytics',
    description: 'FHIR-native healthcare intelligence for providers and payers.',
    features: [
      'HL7 FHIR R5 — 157 resources, 12 categories',
      'HCF Framework — 108 capabilities',
      'HACR Assessment — 720+ questions',
      'Sehat Sahulat, NADRA, FHIR, HCDM',
    ],
    classes: {
      card: 'hover:border-emerald-500/60 hover:shadow-[0_0_50px_rgba(16,185,129,0.18)]',
      iconTile: 'bg-emerald-600/20 ring-1 ring-emerald-500/30',
      icon: 'text-emerald-400',
      tagline: 'text-emerald-400',
      dot: 'bg-emerald-500',
      enter: 'text-emerald-400 group-hover:text-emerald-300',
    },
  },
  {
    key: 'coe',
    path: '/coe',
    icon: Banknote,
    name: 'COE',
    tagline: 'Cash Optimization',
    description: 'Currency operations engine for vault, ATM and CIT networks.',
    features: [
      '10 Use Cases — PKR 7.8–12.7B Impact',
      'Game-Theoretic & Predictive Analytics',
      '4-Phase Roadmap — 24 Months',
      'SBP CRR, Vault, ATM, CIT, Nostro',
    ],
    classes: {
      card: 'hover:border-amber-500/60 hover:shadow-[0_0_50px_rgba(245,158,11,0.18)]',
      iconTile: 'bg-amber-600/20 ring-1 ring-amber-500/30',
      icon: 'text-amber-400',
      tagline: 'text-amber-400',
      dot: 'bg-amber-500',
      enter: 'text-amber-400 group-hover:text-amber-300',
    },
  },
  {
    key: 'alm',
    path: '/alm',
    icon: Scale,
    name: 'ALM',
    tagline: 'Asset-Liability Mgmt',
    description: 'Treasury ALM, IRRBB, Funds Transfer Pricing and structural liquidity on the FIS ALM engine feed.',
    features: [
      '8 Use Cases — ALM · FTP · IRRBB · IFRS 9',
      'Sierra + Symbols/CBS → FIS ALM PDM (260 attrs)',
      'Repricing gap, EVE/NII, LCR & NSFR',
      'KIBOR FTP curve, HTM/AFS/HFT, ECL',
    ],
    classes: {
      card: 'hover:border-indigo-500/60 hover:shadow-[0_0_50px_rgba(99,102,241,0.18)]',
      iconTile: 'bg-indigo-600/20 ring-1 ring-indigo-500/30',
      icon: 'text-indigo-400',
      tagline: 'text-indigo-400',
      dot: 'bg-indigo-500',
      enter: 'text-indigo-400 group-hover:text-indigo-300',
    },
  },
]

const suiteStats = [
  { icon: Database, value: '4,800+', label: 'Model entities & resources' },
  { icon: Layers, value: '320', label: 'Business capabilities' },
  { icon: ClipboardCheck, value: '2,150+', label: 'Assessment questions' },
  { icon: Boxes, value: '4', label: 'Industry workbenches' },
]

export default function SuiteLanding() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px]" />
      </div>

      <div className="relative flex flex-col items-center px-6 py-16 lg:py-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mb-12">
          <span className="inline-block mb-5 px-4 py-1.5 rounded-full border border-gray-700 bg-gray-900/80 text-sm font-medium text-gray-300 tracking-wide">
            Enterprise Data-Model Workbench Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5">
            Analytics Intelligence{' '}
            <span className="bg-gradient-to-r from-purple-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Suite
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            Industry data models, capability frameworks and maturity assessments —
            unified in one workbench for banking, trade, healthcare and cash operations.
          </p>
        </div>

        {/* Suite stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-14">
          {suiteStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-5"
            >
              <stat.icon size={20} className="text-gray-500 mb-2" />
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-gray-400 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full">
          {modules.map((mod) => (
            <button
              key={mod.key}
              onClick={() => navigate(mod.path)}
              className={`group relative flex flex-col bg-gray-900/80 rounded-2xl p-7 text-left border border-gray-800 transition-all duration-300 hover:-translate-y-1 ${mod.classes.card}`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${mod.classes.iconTile}`}>
                  <mod.icon size={28} className={mod.classes.icon} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">{mod.name}</h2>
                  <p className={`text-base font-medium ${mod.classes.tagline}`}>{mod.tagline}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-5">{mod.description}</p>

              <ul className="space-y-3 mb-7">
                {mod.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300 leading-snug">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${mod.classes.dot}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`mt-auto flex items-center gap-2 text-base font-semibold ${mod.classes.enter}`}>
                Enter Workbench
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Quick Scan callout */}
        <div className="mt-12 max-w-5xl w-full">
          <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-r from-purple-950/70 via-gray-900 to-teal-950/70 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30 flex items-center justify-center">
                    <Zap size={20} className="text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                    Free · 10 minutes
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quick Maturity Scan</h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  24 CTO-answerable questions. Get a 3-page PDF with your maturity radar,
                  strengths and gaps — instantly, no signup required.
                </p>
              </div>
              <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
                <button
                  onClick={() => navigate('/maturity')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white text-base font-medium rounded-lg hover:bg-purple-500 transition-colors"
                >
                  <Building2 size={18} /> Banking Scan
                </button>
                <button
                  onClick={() => navigate('/taiw/maturity')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white text-base font-medium rounded-lg hover:bg-teal-500 transition-colors"
                >
                  <Globe size={18} /> Trade Scan
                </button>
                <button
                  onClick={() => navigate('/haiw/maturity')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white text-base font-medium rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  <Heart size={18} /> Healthcare Scan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href="https://godai.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity"
          >
            <span className="text-sm text-gray-400">Powered by</span>
            <img src="/godaitec-logo-white.png" alt="GODAITEC" className="h-7 w-auto" />
          </a>
          <span className="text-sm text-gray-500">Built for Pakistan · godai.tech</span>
        </div>
      </div>
    </div>
  )
}
