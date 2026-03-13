import { useState, useMemo } from 'react'
import {
  Banknote, TrendingUp, Calculator, Building2, Truck,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import revenueModel from '../../data/coe/revenueModel.json'
import cashMetrics from '../../data/coe/cashMetrics.json'
import branchTypology from '../../data/coe/branchTypology.json'

function formatPKR(val: number): string {
  if (Math.abs(val) >= 1e9) return `PKR ${(val / 1e9).toFixed(2)}B`
  if (Math.abs(val) >= 1e6) return `PKR ${(val / 1e6).toFixed(1)}M`
  if (Math.abs(val) >= 1e3) return `PKR ${(val / 1e3).toFixed(0)}K`
  return `PKR ${val.toFixed(0)}`
}

function formatPKRShort(val: number): string {
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}B`
  return `${val}M`
}

const tierYields: Record<number, { label: string; rate: number }> = {
  1: { label: 'Overnight Repo (10.5%)', rate: 0.105 },
  2: { label: 'T-Bills (11.5%)', rate: 0.115 },
  3: { label: 'Lending (18%)', rate: 0.18 },
  4: { label: 'FX Carry USD (4.5%)', rate: 0.045 },
}

const branchDefaults: Record<string, { vault: number; daily: number; idle: number }> = {
  'Cash-Surplus': { vault: 50, daily: 140, idle: 55 },
  'Cash-Deficit': { vault: 30, daily: 85, idle: 25 },
  'Balanced': { vault: 35, daily: 55, idle: 35 },
  'Seasonal': { vault: 40, daily: 60, idle: 45 },
  'Hub/CPC': { vault: 200, daily: 1000, idle: 20 },
}

export default function RevenueEngine() {
  // Float calculator state
  const [freedCash, setFreedCash] = useState(30)
  const [selectedTier, setSelectedTier] = useState(1)
  const [holdingDays, setHoldingDays] = useState(365)

  // Branch simulator state
  const [branchType, setBranchType] = useState('Cash-Surplus')
  const [vaultCash, setVaultCash] = useState(50)
  const [dailyVol, setDailyVol] = useState(140)
  const [policyRate, setPolicyRate] = useState(11)

  // CRR state
  const [crrDays, setCrrDays] = useState([6, 6, 6, 6, 6, 6, 6])

  // Float calculator results
  const floatResult = useMemo(() => {
    const rate = tierYields[selectedTier].rate
    const annualRevenue = freedCash * 1e9 * rate
    const periodRevenue = annualRevenue * (holdingDays / 365)
    const dailyRevenue = annualRevenue / 365
    return { annualRevenue, periodRevenue, dailyRevenue }
  }, [freedCash, selectedTier, holdingDays])

  // Branch simulator results
  const branchResult = useMemo(() => {
    const defaults = branchDefaults[branchType]
    const idlePct = defaults.idle / 100
    const idleCash = vaultCash * idlePct
    const optimalVault = vaultCash * (1 - idlePct * 0.6)
    const ces = 1 - (idleCash / vaultCash)
    const optimizedCes = 1 - ((idleCash * 0.4) / optimalVault)
    const opportunityCost = idleCash * 1e6 * (policyRate / 100)
    const annualSavings = idleCash * 0.6 * 1e6 * (policyRate / 100)
    const freedForRepo = idleCash * 0.6
    const dailyRepoIncome = freedForRepo * 1e6 * (policyRate / 100) / 365
    return { idleCash, optimalVault, ces, optimizedCes, opportunityCost, annualSavings, freedForRepo, dailyRepoIncome }
  }, [branchType, vaultCash, policyRate])

  // CRR results
  const crrResult = useMemo(() => {
    const avg = crrDays.reduce((s, v) => s + v, 0) / 7
    const valid = crrDays.every(d => d >= 4) && avg >= 6
    const liabilityBase = 2500 // PKR Billion (approx)
    const freedPerDay = crrDays.map(d => Math.max(0, 6 - d) * liabilityBase * 10) // PKR Millions
    const totalFreed = freedPerDay.reduce((s, v) => s + v, 0)
    const weeklyRepo = totalFreed * (policyRate / 100) / 52
    return { avg, valid, freedPerDay, totalFreed, weeklyRepo }
  }, [crrDays, policyRate])

  // Update branch defaults when type changes
  const handleBranchTypeChange = (type: string) => {
    setBranchType(type)
    const d = branchDefaults[type]
    setVaultCash(d.vault)
    setDailyVol(d.daily)
  }

  // Cost reduction waterfall data
  const waterfallData = revenueModel.costReduction.map(c => ({
    name: c.category,
    current: c.currentCostMax,
    saving: c.savingMax,
    remaining: c.currentCostMax - c.savingMax,
  }))

  const dayLabels = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Revenue Engine</h1>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-5xl font-bold">PKR 7.8B – 12.7B</span>
          <span className="text-amber-200 text-lg">Annual Impact</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {revenueModel.leverBreakdown.map(l => (
            <div key={l.lever} className="bg-white/15 backdrop-blur rounded-lg p-3">
              <div className="text-xs text-amber-200 mb-1">{l.lever}</div>
              <div className="text-sm font-bold">PKR {formatPKRShort(l.savingMin)}–{formatPKRShort(l.savingMax)}</div>
              <div className="h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full"
                  style={{ width: `${(l.savingMax / 7000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Float Revenue Calculator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Float Revenue Calculator</h2>
        <p className="text-sm text-slate-500 mb-6">Estimate returns from deploying freed cash into different instruments</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Freed Cash Amount</span>
                <span className="text-amber-600 font-bold">PKR {freedCash}B</span>
              </label>
              <input
                type="range" min={1} max={50} value={freedCash}
                onChange={e => setFreedCash(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>PKR 1B</span><span>PKR 50B</span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Deployment Tier</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(tierYields).map(([tier, { label }]) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(Number(tier))}
                    className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                      selectedTier === Number(tier)
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="font-medium">Tier {tier}</div>
                    <div className="text-xs opacity-75">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Holding Period</span>
                <span className="text-amber-600 font-bold">{holdingDays} days</span>
              </label>
              <input
                type="range" min={1} max={365} value={holdingDays}
                onChange={e => setHoldingDays(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
              <div className="text-sm text-amber-700 mb-1">Period Revenue ({holdingDays} days)</div>
              <div className="text-3xl font-bold text-amber-700">{formatPKR(floatResult.periodRevenue)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Annual Revenue</div>
                <div className="text-lg font-bold text-slate-700">{formatPKR(floatResult.annualRevenue)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Daily Revenue</div>
                <div className="text-lg font-bold text-slate-700">{formatPKR(floatResult.dailyRevenue)}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 mb-1">
                <Calculator size={14} className="text-amber-500" />
                <span className="font-medium">Equivalence</span>
              </div>
              <p>This equals ~{Math.round(floatResult.annualRevenue / 3e6)} branch managers' annual salaries or ~{Math.round(floatResult.annualRevenue / 8e6)} new ATM installations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Reduction Waterfall */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Cost Reduction Waterfall</h2>
        <p className="text-sm text-slate-500 mb-4">Current costs vs. savings potential (PKR Millions)</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number, name: string) => [`PKR ${v}M`, name === 'saving' ? 'Savings' : name === 'remaining' ? 'Remaining Cost' : 'Current Cost']} />
            <Bar dataKey="remaining" stackId="a" fill="#94a3b8" name="remaining" />
            <Bar dataKey="saving" stackId="a" fill="#22c55e" name="saving" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-2 text-xs text-slate-500 justify-center">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22c55e]" /> Savings</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#94a3b8]" /> Remaining Cost</span>
          <span className="font-medium text-green-600">
            Total Savings: PKR {revenueModel.costReduction.reduce((s, c) => s + c.savingMax, 0).toLocaleString()}M
          </span>
        </div>
      </div>

      {/* Branch Cash Simulator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Branch Cash Simulator</h2>
        <p className="text-sm text-slate-500 mb-6">Model optimization impact for a single branch</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Branch Type</label>
              <select
                value={branchType}
                onChange={e => handleBranchTypeChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none"
              >
                {branchTypology.map(bt => (
                  <option key={bt.type} value={bt.type}>{bt.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Current Vault Cash</span>
                <span className="text-amber-600">PKR {vaultCash}M</span>
              </label>
              <input type="range" min={5} max={300} value={vaultCash} onChange={e => setVaultCash(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Daily Transaction Vol</span>
                <span className="text-amber-600">PKR {dailyVol}M</span>
              </label>
              <input type="range" min={10} max={2000} value={dailyVol} onChange={e => setDailyVol(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>SBP Policy Rate</span>
                <span className="text-amber-600">{policyRate}%</span>
              </label>
              <input type="range" min={5} max={20} step={0.5} value={policyRate} onChange={e => setPolicyRate(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
          </div>

          {/* Before / After */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current State</h3>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Vault Cash</span>
                <span className="font-bold text-red-600">PKR {vaultCash}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Idle Cash</span>
                <span className="font-bold text-red-600">PKR {branchResult.idleCash.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cash Efficiency</span>
                <span className="font-bold text-red-600">{(branchResult.ces * 100).toFixed(0)}%</span>
              </div>
              {/* CES Gauge */}
              <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${branchResult.ces * 100}%` }} />
              </div>
              <div className="text-xs text-red-500">
                Opportunity Cost: {formatPKR(branchResult.opportunityCost)}/yr
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Optimized State</h3>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Vault Cash</span>
                <span className="font-bold text-green-600">PKR {branchResult.optimalVault.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Freed for Repo</span>
                <span className="font-bold text-green-600">PKR {branchResult.freedForRepo.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cash Efficiency</span>
                <span className="font-bold text-green-600">{(branchResult.optimizedCes * 100).toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(branchResult.optimizedCes * 100, 100)}%` }} />
              </div>
              <div className="text-xs text-green-600">
                Annual Savings: {formatPKR(branchResult.annualSavings)} | Daily Repo: {formatPKR(branchResult.dailyRepoIncome)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRR Band Optimizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">CRR Band Optimizer</h2>
        <p className="text-sm text-slate-500 mb-4">
          Drag daily CRR levels between 4% floor and ceiling. Weekly average must be &ge; 6%.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-end gap-3 h-64">
              {crrDays.map((val, i) => {
                const pct = ((val - 2) / 8) * 100
                const isLow = val < 4
                const color = !crrResult.valid ? 'bg-red-400' : val <= 4.5 ? 'bg-amber-400' : 'bg-green-400'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-sm font-bold text-slate-700">{val.toFixed(1)}%</div>
                    <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
                      {/* 4% floor line */}
                      <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-300" style={{ bottom: `${((4 - 2) / 8) * 100}%` }} />
                      {/* 6% avg line */}
                      <div className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300" style={{ bottom: `${((6 - 2) / 8) * 100}%` }} />
                      {/* Bar */}
                      <div className={`absolute bottom-0 left-1 right-1 rounded-t-md ${color} transition-all`} style={{ height: `${pct}%` }} />
                    </div>
                    <input
                      type="range" min={4} max={10} step={0.1} value={val}
                      onChange={e => {
                        const next = [...crrDays]
                        next[i] = Number(e.target.value)
                        setCrrDays(next)
                      }}
                      className="w-full accent-amber-500 -rotate-0"
                      style={{ writingMode: 'horizontal-tb' }}
                    />
                    <div className="text-xs text-slate-500 font-medium">{dayLabels[i]}</div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-dashed border-red-300" /> 4% daily minimum</span>
              <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-dashed border-blue-300" /> 6% weekly average</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-xl p-4 border ${crrResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-sm font-medium mb-2">{crrResult.valid ? 'Compliant' : 'Violation!'}</div>
              <div className="flex justify-between text-sm mb-1">
                <span>Weekly Average</span>
                <span className="font-bold">{crrResult.avg.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Required</span>
                <span className="font-bold">&ge; 6.00%</span>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="text-sm font-medium text-amber-700 mb-2">Freed Liquidity</div>
              <div className="text-2xl font-bold text-amber-700">PKR {crrResult.totalFreed.toLocaleString()}M</div>
              <div className="text-xs text-amber-600 mt-1">Weekly repo income: {formatPKR(crrResult.weeklyRepo * 1e6)}</div>
            </div>
            <button
              onClick={() => setCrrDays([4.0, 4.0, 4.5, 7.5, 8.0, 9.0, 9.0])}
              className="w-full text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg py-2 transition-colors font-medium"
            >
              Load Optimized Zigzag
            </button>
            <button
              onClick={() => setCrrDays([6, 6, 6, 6, 6, 6, 6])}
              className="w-full text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 transition-colors"
            >
              Reset to Flat 6%
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
