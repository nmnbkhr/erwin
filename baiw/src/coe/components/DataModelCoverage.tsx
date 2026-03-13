import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, ChevronDown, ChevronUp, ExternalLink, Layers,
} from 'lucide-react'
import useCases from '../../data/coe/useCases.json'
import domains from '../../data/domains.json'

const colorMap: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  cyan: '#06b6d4', teal: '#14b8a6', rose: '#f43f5e', orange: '#f97316',
  pink: '#ec4899', indigo: '#6366f1',
}

// Map each COE Use Case → BAIW FSDM domains + key entities it requires
const ucDataModelMap: Record<string, {
  domains: { name: string; relevance: string; entities: string[] }[]
  starSchemaLinks: string[]
  profitabilityPLLines: number[]
  coverageScore: number
}> = {
  'UC-01': {
    domains: [
      { name: 'Agreement & Account', relevance: 'Deposit/loan balances drive vault demand forecasting', entities: ['Agreement', 'Deposit_Account', 'Loan_Account', 'Account_Balance'] },
      { name: 'Financial Transaction', relevance: 'Transaction history for LSTM time-series forecasting', entities: ['Financial_Transaction', 'Cash_Transaction', 'Payment', 'Transfer'] },
      { name: 'Channel Management', relevance: 'Branch-level channel data and ATM locations', entities: ['Branch', 'Channel', 'Service_Point'] },
      { name: 'Event Management', relevance: 'Islamic calendar, crop cycles, holidays for seasonality', entities: ['Calendar_Event', 'Business_Event', 'Holiday'] },
      { name: 'Location & Geography', relevance: 'Branch locations for regional demand patterns', entities: ['Address', 'Region', 'Branch_Location'] },
      { name: 'Human Resources', relevance: 'Branch manager data for CES KPI tracking', entities: ['Employee', 'Organization_Unit', 'Role'] },
    ],
    starSchemaLinks: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_BRANCH', 'DIM_TIME', 'DIM_AGREEMENT'],
    profitabilityPLLines: [4, 10, 11],
    coverageScore: 85,
  },
  'UC-02': {
    domains: [
      { name: 'Channel Management', relevance: 'ATM locations, cassette levels, uptime tracking', entities: ['ATM', 'Channel', 'Service_Point', 'Device_Status'] },
      { name: 'Financial Transaction', relevance: 'ATM withdrawal patterns for demand forecasting', entities: ['ATM_Transaction', 'Cash_Withdrawal', 'Cash_Deposit'] },
      { name: 'Event Management', relevance: 'Seasonal events affecting ATM demand', entities: ['Calendar_Event', 'Holiday', 'Business_Event'] },
      { name: 'Location & Geography', relevance: 'ATM location for demand segmentation', entities: ['Address', 'Region'] },
    ],
    starSchemaLinks: ['DIM_CHANNEL', 'DIM_TIME'],
    profitabilityPLLines: [10],
    coverageScore: 72,
  },
  'UC-03': {
    domains: [
      { name: 'Channel Management', relevance: 'Branch network for surplus/deficit matching', entities: ['Branch', 'Service_Point'] },
      { name: 'Location & Geography', relevance: 'Branch distances for netting/routing optimization', entities: ['Address', 'Region', 'Geographic_Area'] },
      { name: 'Financial Transaction', relevance: 'Cash movement records between branches', entities: ['Cash_Transaction', 'Transfer', 'Settlement'] },
      { name: 'Party Management', relevance: 'CIT provider contracts and relationships', entities: ['Organization', 'Agreement_Party_Role', 'Service_Provider'] },
    ],
    starSchemaLinks: ['DIM_BRANCH', 'DIM_CHANNEL'],
    profitabilityPLLines: [10, 11],
    coverageScore: 65,
  },
  'UC-04': {
    domains: [
      { name: 'Agreement & Account', relevance: 'Demand liabilities base for CRR calculation', entities: ['Deposit_Account', 'Account_Balance', 'Time_Deposit', 'Demand_Deposit'] },
      { name: 'Investment Management', relevance: 'Repo positions, T-bill holdings for deployment', entities: ['Security', 'Portfolio', 'Investment_Position', 'Repo_Agreement'] },
      { name: 'Risk Management', relevance: 'Regulatory compliance tracking', entities: ['Regulatory_Requirement', 'Compliance_Check', 'Risk_Assessment'] },
      { name: 'Reference Data', relevance: 'SBP policy rates, CRR rules', entities: ['Interest_Rate', 'Regulatory_Code', 'Currency'] },
    ],
    starSchemaLinks: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_AGREEMENT', 'DIM_TIME'],
    profitabilityPLLines: [1, 4, 15],
    coverageScore: 78,
  },
  'UC-05': {
    domains: [
      { name: 'Agreement & Account', relevance: 'Nostro account balances across currencies', entities: ['Correspondent_Account', 'Account_Balance', 'FX_Account'] },
      { name: 'Investment Management', relevance: 'FX positions, carry trade calculations', entities: ['FX_Deal', 'Currency_Position', 'Forward_Contract'] },
      { name: 'Party Management', relevance: 'Correspondent bank relationships', entities: ['Organization', 'Correspondent_Bank', 'Agreement_Party_Role'] },
      { name: 'Financial Transaction', relevance: 'Trade finance transactions, remittance flows', entities: ['FX_Transaction', 'LC_Transaction', 'Remittance'] },
      { name: 'Reference Data', relevance: 'Exchange rates, currency codes', entities: ['Currency', 'Exchange_Rate', 'Country_Code'] },
    ],
    starSchemaLinks: ['DIM_AGREEMENT', 'DIM_CUSTOMER'],
    profitabilityPLLines: [7],
    coverageScore: 70,
  },
  'UC-06': {
    domains: [
      { name: 'Agreement & Account', relevance: 'Vostro account balances and deposit stability', entities: ['Vostro_Account', 'Account_Balance', 'Deposit_Account'] },
      { name: 'Party Management', relevance: 'Foreign bank relationships and stability scoring', entities: ['Organization', 'Correspondent_Bank', 'Relationship'] },
      { name: 'Investment Management', relevance: 'Tenor extension deployment (T-bills, PIBs)', entities: ['Security', 'Investment_Position', 'Maturity_Band'] },
      { name: 'Risk Management', relevance: 'Liquidity-at-Risk modeling', entities: ['Liquidity_Risk', 'Risk_Assessment', 'Stress_Scenario'] },
    ],
    starSchemaLinks: ['DIM_CUSTOMER', 'DIM_AGREEMENT'],
    profitabilityPLLines: [1, 2],
    coverageScore: 62,
  },
  'UC-07': {
    domains: [
      { name: 'Channel Management', relevance: 'Branch denomination holdings per branch/ATM', entities: ['Branch', 'ATM', 'Cash_Inventory'] },
      { name: 'Reference Data', relevance: 'SBP currency management rules and penalties', entities: ['Currency', 'Denomination', 'Regulatory_Code'] },
      { name: 'Financial Transaction', relevance: 'Cash sorting, denomination demand patterns', entities: ['Cash_Transaction', 'Cash_Sorting'] },
      { name: 'Risk Management', relevance: 'SBP penalty tracking and compliance', entities: ['Compliance_Check', 'Penalty_Record'] },
    ],
    starSchemaLinks: ['DIM_BRANCH', 'DIM_TIME'],
    profitabilityPLLines: [10],
    coverageScore: 55,
  },
  'UC-08': {
    domains: [
      { name: 'Channel Management', relevance: 'Branch/ATM locations for route planning', entities: ['Branch', 'ATM', 'Service_Point'] },
      { name: 'Location & Geography', relevance: 'Geographic data for VRPTW optimization', entities: ['Address', 'Region', 'Geographic_Area', 'Route'] },
      { name: 'Party Management', relevance: 'CIT provider fleet and contract data', entities: ['Service_Provider', 'Vehicle', 'Contract'] },
      { name: 'Asset Management', relevance: 'CIT vehicle fleet, insurance tracking', entities: ['Physical_Asset', 'Insurance_Policy'] },
    ],
    starSchemaLinks: ['DIM_BRANCH', 'DIM_CHANNEL'],
    profitabilityPLLines: [10, 11],
    coverageScore: 58,
  },
  'UC-09': {
    domains: [
      { name: 'Party Management', relevance: 'Customer segmentation for incentive targeting', entities: ['Individual', 'Customer', 'Customer_Segment', 'Demographic'] },
      { name: 'Channel Management', relevance: 'Digital channel adoption tracking', entities: ['Channel', 'Digital_Channel', 'Mobile_Banking'] },
      { name: 'Campaign & Marketing', relevance: 'Incentive campaigns and offer management', entities: ['Campaign', 'Offer', 'Promotion', 'Incentive'] },
      { name: 'Financial Transaction', relevance: 'Transaction channel attribution', entities: ['Transaction', 'Payment', 'Digital_Transaction'] },
      { name: 'Web Analytics', relevance: 'Digital behavior tracking for MAB optimization', entities: ['Web_Session', 'Digital_Event', 'Channel_Usage'] },
    ],
    starSchemaLinks: ['DIM_CUSTOMER', 'DIM_CHANNEL', 'DIM_SEGMENT'],
    profitabilityPLLines: [6, 10],
    coverageScore: 75,
  },
  'UC-10': {
    domains: [
      { name: 'Agreement & Account', relevance: 'Full account/agreement data for P&L attribution', entities: ['Agreement', 'Account_Balance', 'Deposit_Account', 'Loan_Account'] },
      { name: 'Financial Transaction', relevance: 'All transaction data for cost allocation', entities: ['Financial_Transaction', 'Cash_Transaction', 'Fee_Transaction'] },
      { name: 'Channel Management', relevance: 'Branch-level profitability', entities: ['Branch', 'Channel'] },
      { name: 'Human Resources', relevance: 'Staff costs, branch manager KPIs', entities: ['Employee', 'Organization_Unit', 'Cost_Center'] },
      { name: 'Party Management', relevance: 'CIT contracts, vendor costs', entities: ['Service_Provider', 'Contract', 'Organization'] },
      { name: 'Risk Management', relevance: 'SBP penalty records for cost attribution', entities: ['Compliance_Check', 'Penalty_Record', 'Risk_Assessment'] },
    ],
    starSchemaLinks: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_CUSTOMER', 'DIM_BRANCH', 'DIM_PRODUCT', 'DIM_TIME', 'DIM_AGREEMENT', 'DIM_CHANNEL', 'DIM_SEGMENT'],
    profitabilityPLLines: [1, 2, 4, 6, 10, 11, 13, 15, 16],
    coverageScore: 95,
  },
}

const plLineLabels: Record<number, string> = {
  1: 'Gross Interest Income', 2: 'Interest Expense', 4: 'FTP Adjustment',
  6: 'Fee & Commission', 7: 'FX & Trading', 10: 'Direct Operating Costs',
  11: 'ABC Allocated Costs', 13: 'IFRS 9 ECL Provision', 15: 'Capital Charge (RWA×CoE)',
  16: 'Economic Profit (EVA)',
}

export default function DataModelCoverage() {
  const [expandedUC, setExpandedUC] = useState<string | null>('UC-01')
  const [viewMode, setViewMode] = useState<'usecases' | 'heatmap'>('usecases')

  // Aggregate domain usage across all UCs
  const domainUsage: Record<string, { count: number; ucs: string[] }> = {}
  Object.entries(ucDataModelMap).forEach(([ucId, data]) => {
    data.domains.forEach(d => {
      if (!domainUsage[d.name]) domainUsage[d.name] = { count: 0, ucs: [] }
      domainUsage[d.name].count++
      domainUsage[d.name].ucs.push(ucId)
    })
  })

  // Total entities referenced
  const totalEntities = new Set(
    Object.values(ucDataModelMap).flatMap(d => d.domains.flatMap(dm => dm.entities))
  ).size

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Database size={28} />
          <h1 className="text-3xl font-bold">FSDM Data Model Coverage</h1>
        </div>
        <p className="text-amber-100 text-lg mb-6">
          How COE use cases map to BAIW's Teradata FSDM v13 — entity reuse, domain coverage, and profitability engine integration
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">10</div>
            <div className="text-amber-200 text-xs">Use Cases Mapped</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">{Object.keys(domainUsage).length}</div>
            <div className="text-amber-200 text-xs">FSDM Domains Used</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">{totalEntities}+</div>
            <div className="text-amber-200 text-xs">Entities Referenced</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">16</div>
            <div className="text-amber-200 text-xs">P&L Lines Linked</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('usecases')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'usecases' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          By Use Case
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'heatmap' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Domain Heatmap
        </button>
      </div>

      {viewMode === 'usecases' && (
        <div className="space-y-3">
          {useCases.map(uc => {
            const mapping = ucDataModelMap[uc.id]
            if (!mapping) return null
            const isExpanded = expandedUC === uc.id
            return (
              <div key={uc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpandedUC(isExpanded ? null : uc.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold px-2 py-1 rounded text-white shrink-0" style={{ backgroundColor: colorMap[uc.color] }}>
                    {uc.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{uc.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{mapping.domains.length} domains</span>
                      <span className="text-xs text-slate-400">{mapping.domains.reduce((s, d) => s + d.entities.length, 0)} entities</span>
                      <span className="text-xs text-slate-400">{mapping.starSchemaLinks.length} star schema tables</span>
                    </div>
                  </div>
                  {/* Coverage Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${mapping.coverageScore}%`,
                          backgroundColor: mapping.coverageScore >= 80 ? '#22c55e' : mapping.coverageScore >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{mapping.coverageScore}%</span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 space-y-5">
                    {/* Domain → Entity mapping */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Database size={14} /> FSDM Domain Coverage
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mapping.domains.map(d => {
                          const domain = domains.find(dm => dm.name === d.name)
                          return (
                            <div key={d.name} className="rounded-lg border p-3" style={{ borderLeftWidth: 4, borderLeftColor: domain?.color || '#94a3b8' }}>
                              <div className="flex items-center justify-between mb-1">
                                <Link
                                  to={`/model?search=${encodeURIComponent(d.name)}`}
                                  className="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1"
                                >
                                  {d.name}
                                  <ExternalLink size={10} className="text-slate-400" />
                                </Link>
                                <span className="text-xs text-slate-400">{domain?.entityCount || 0} entities in FSDM</span>
                              </div>
                              <p className="text-xs text-slate-500 mb-2">{d.relevance}</p>
                              <div className="flex flex-wrap gap-1">
                                {d.entities.map(entity => (
                                  <Link
                                    key={entity}
                                    to={`/model?search=${encodeURIComponent(entity)}`}
                                    className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded font-mono hover:bg-blue-100 transition-colors"
                                  >
                                    {entity}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Star Schema Links */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers size={14} /> Profitability Star Schema Links
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mapping.starSchemaLinks.map(table => (
                          <Link
                            key={table}
                            to="/profitability"
                            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors hover:opacity-80 ${
                              table.startsWith('FACT') ? 'bg-amber-50 border-amber-300 text-amber-700' :
                              table.startsWith('DIM') ? 'bg-blue-50 border-blue-300 text-blue-700' :
                              'bg-slate-50 border-slate-300 text-slate-600'
                            }`}
                          >
                            {table}
                          </Link>
                        ))}
                      </div>

                      {/* P&L Line Links */}
                      {mapping.profitabilityPLLines.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-400 mb-2">Feeds into P&L Lines:</div>
                          <div className="flex flex-wrap gap-2">
                            {mapping.profitabilityPLLines.map(line => (
                              <Link
                                key={line}
                                to="/profitability"
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs hover:bg-amber-100 transition-colors"
                              >
                                <span className="text-amber-600 font-bold">L{line}</span>
                                <span className="text-amber-700">{plLineLabels[line] || `Line ${line}`}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'heatmap' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Domain × Use Case Heatmap</h3>
          <p className="text-sm text-slate-500 mb-4">
            Colored cells indicate domain usage. Click domain names to explore in BAIW Model Explorer.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-500 sticky left-0 bg-white min-w-[180px]">FSDM Domain</th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 w-16">Entities</th>
                {useCases.map(uc => (
                  <th key={uc.id} className="text-center py-2 px-1 w-12">
                    <span className="inline-block px-1.5 py-0.5 rounded text-white font-bold text-[10px]" style={{ backgroundColor: colorMap[uc.color] }}>
                      {uc.id.replace('UC-', '')}
                    </span>
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-slate-500 w-16">Reuse</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(domain => {
                const usage = domainUsage[domain.name]
                return (
                  <tr key={domain.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 sticky left-0 bg-white">
                      <Link
                        to={`/model?search=${encodeURIComponent(domain.name)}`}
                        className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: domain.color }} />
                        {domain.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{domain.entityCount}</td>
                    {useCases.map(uc => {
                      const mapping = ucDataModelMap[uc.id]
                      const domainMatch = mapping?.domains.find(d => d.name === domain.name)
                      return (
                        <td key={uc.id} className="py-2 px-1 text-center">
                          {domainMatch ? (
                            <div
                              className="w-6 h-6 rounded mx-auto flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ backgroundColor: colorMap[uc.color] }}
                              title={`${uc.id}: ${domainMatch.entities.length} entities — ${domainMatch.relevance}`}
                            >
                              {domainMatch.entities.length}
                            </div>
                          ) : (
                            <span className="text-slate-200">·</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="py-2 px-2 text-center">
                      {usage ? (
                        <span className={`font-bold ${usage.count >= 5 ? 'text-green-600' : usage.count >= 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {usage.count}
                        </span>
                      ) : (
                        <span className="text-slate-200">0</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span>Cell number = entities used from that domain</span>
            <span className="flex items-center gap-1">Reuse: <span className="font-bold text-green-600">5+</span> high <span className="font-bold text-amber-600">3-4</span> medium <span className="font-bold text-slate-400">1-2</span> low</span>
          </div>
        </div>
      )}

      {/* Domain Reuse Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Most Reused Domains</h3>
        <p className="text-sm text-slate-500 mb-4">FSDM domains ranked by how many COE use cases depend on them</p>
        <div className="space-y-3">
          {Object.entries(domainUsage)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, usage]) => {
              const domain = domains.find(d => d.name === name)
              return (
                <div key={name} className="flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <Link to={`/model?search=${encodeURIComponent(name)}`} className="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: domain?.color }} />
                      {name}
                    </Link>
                  </div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(usage.count / 10) * 100}%`,
                        backgroundColor: domain?.color || '#94a3b8',
                      }}
                    />
                  </div>
                  <div className="w-24 shrink-0 flex flex-wrap gap-0.5">
                    {usage.ucs.map(ucId => {
                      const uc = useCases.find(u => u.id === ucId)
                      return (
                        <span key={ucId} className="text-[9px] px-1 py-0.5 rounded text-white font-bold" style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}>
                          {ucId.replace('UC-', '')}
                        </span>
                      )
                    })}
                  </div>
                  <span className="text-sm font-bold text-slate-600 w-8 text-right">{usage.count}</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
