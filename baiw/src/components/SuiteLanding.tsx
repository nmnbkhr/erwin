import { useNavigate } from 'react-router-dom'
import { Building2, Globe, Banknote, ArrowRight, Zap } from 'lucide-react'

export default function SuiteLanding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics Intelligence Suite</h1>
        <p className="text-gray-400 text-lg">Enterprise Data Model Workbench Platform</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* BAIW Card */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group relative bg-gray-900 rounded-2xl p-8 text-left border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(147,51,234,0.15)]"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <Building2 size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">BAIW</h2>
                <p className="text-sm text-purple-400">Banking Analytics Intelligence Workbench</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Teradata FSDM v13 — 3,917 entities, 16 domains</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>BVF Framework — 112 capabilities</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>BACR Assessment — 793 questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>SBP, KIBOR, Islamic Banking</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-medium">
              Enter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        {/* TAIW Card */}
        <button
          onClick={() => navigate('/taiw')}
          className="group relative bg-gray-900 rounded-2xl p-8 text-left border border-gray-800 hover:border-teal-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(20,184,166,0.15)]"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-600/20 flex items-center justify-center">
                <Globe size={24} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">TAIW</h2>
                <p className="text-sm text-teal-400">Trade Analytics Intelligence Workbench</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>WCO Data Model v4.2 — 727 elements, 14 domains</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>TCF Framework — 100 capabilities</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>TACR Assessment — 640+ questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>FBR, WeBOC, CPEC, GSP+</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-teal-400 group-hover:text-teal-300 font-medium">
              Enter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        {/* COE Card */}
        <button
          onClick={() => navigate('/coe')}
          className="group relative bg-gray-900 rounded-2xl p-8 text-left border border-gray-800 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Banknote size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">COE</h2>
                <p className="text-sm text-amber-400">Cash Optimization Engine</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>10 Use Cases — PKR 7.8–12.7B Impact</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Game-Theoretic & Predictive Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>4-Phase Roadmap — 24 Months</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>SBP CRR, Vault, ATM, CIT, Nostro</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-amber-400 group-hover:text-amber-300 font-medium">
              Enter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>

      {/* Quick Scan Callout */}
      <div className="mt-10 max-w-2xl w-full">
        <div className="relative bg-gradient-to-r from-purple-900/50 to-teal-900/50 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap size={18} className="text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">New</span>
              <h3 className="text-white font-semibold">Free 10-Minute Quick Maturity Scan</h3>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            24 CTO-answerable questions. Get a 3-page PDF with your maturity radar, strengths, and gaps — instantly.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/maturity')}
              className="px-5 py-2.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Building2 size={14} /> Banking Quick Scan
            </button>
            <button
              onClick={() => navigate('/taiw/maturity')}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Globe size={14} /> Trade Quick Scan
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-600">
        Built for Pakistan | Powered by Claude Code
      </div>
    </div>
  )
}
