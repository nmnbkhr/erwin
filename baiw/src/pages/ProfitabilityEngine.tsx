import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStarSchema, loadGapExtensions } from '../utils/dataLoader'
import type { StarSchema, GapModule, SchemaTable } from '../types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'

const PL_LINES = [
  { num: 1, label: 'Gross Interest Income', type: 'revenue', entities: ['Agreement', 'Interest_Rate', 'Deposit_Account', 'Loan_Account'], formula: 'SUM(outstanding_balance × applicable_rate × days/365)', note: 'Includes KIBOR-based and fixed-rate products', relatedCaps: ['Revenue Analytics', 'Loan Pricing Analytics'] },
  { num: 2, label: '- Interest Expense', type: 'cost', entities: ['Deposit_Account', 'Savings_Account', 'Term_Deposit'], formula: 'SUM(deposit_balance × deposit_rate × days/365)', note: 'Minimum 14.5% on savings per SBP directive', relatedCaps: ['Customer Profitability Analysis'] },
  { num: 3, label: '= Net Interest Income (NII)', type: 'subtotal', entities: [], formula: 'Line 1 - Line 2', note: 'Banking sector NIM averages ~3.5%', relatedCaps: [] },
  { num: 4, label: '+/- FTP Adjustment', type: 'adjustment', entities: ['FTP_Rate', 'FTP_Curve', 'Maturity_Band'], formula: 'FTP Revenue − FTP Charge = (Loan Balance × Pool Rate) − (Deposit Balance × Pool Rate)', note: 'FTP based on KIBOR yield curve (O/N to 1Y tenors). SBP minimum savings rate creates FTP floor for deposits. Islamic products use Islamic FTP curve (no KIBOR). FTP methodology is single most impactful decision for profitability accuracy.', relatedCaps: ['Funds Transfer Pricing', 'Profitability Modelling'] },
  { num: 5, label: '= FTP-Adjusted NII', type: 'subtotal', entities: [], formula: 'Line 3 + Line 4', note: '', relatedCaps: [] },
  { num: 6, label: '+ Fee & Commission Income', type: 'revenue', entities: ['Fee_Schedule', 'Transaction', 'Service_Charge'], formula: 'SUM(fee_amount) by product/service', note: 'LC/LG fees, ATM charges, RAAST fees. Trade finance fees significant for commercial banks.', relatedCaps: ['Revenue Analytics', 'Customer Profitability Analysis'] },
  { num: 7, label: '+ FX & Trading Income', type: 'revenue', entities: ['FX_Rate', 'FX_Transaction', 'Treasury_Deal'], formula: 'SUM(realized_pnl + unrealized_pnl)', note: 'PKR/USD and cross-currency positions. SBP controls FX market access.', relatedCaps: ['Revenue Analytics'] },
  { num: 8, label: '+ Other Income', type: 'revenue', entities: ['Income_Classification', 'Misc_Income'], formula: 'SUM(other_income_amount)', note: 'Dividend income, rental income, recoveries from written-off accounts', relatedCaps: [] },
  { num: 9, label: '= Total Income', type: 'subtotal_blue', entities: [], formula: 'Line 5 + Line 6 + Line 7 + Line 8', note: '', relatedCaps: [] },
  { num: 10, label: '- Direct Operating Costs', type: 'cost', entities: ['Cost_Center', 'Expense', 'Employee_Cost'], formula: 'SUM(direct_cost) by branch/product', note: 'Staff costs, occupancy, technology direct costs. Average CTI ~45% for Pakistan banks.', relatedCaps: ['Activity-Based Costing'] },
  { num: 11, label: '- ABC Allocated Costs', type: 'cost', entities: ['Activity', 'Cost_Pool', 'Cost_Driver'], formula: 'SUM(activity_rate × driver_quantity)', note: 'Activity-Based Costing allocation from Gap Module 1. No Pakistan bank has formal ABC — this is key differentiator.', relatedCaps: ['Activity-Based Costing', 'Customer Profitability Analysis'] },
  { num: 12, label: '= Operating Profit', type: 'subtotal', entities: [], formula: 'Line 9 - Line 10 - Line 11', note: 'Cost-to-income target: <45%', relatedCaps: [] },
  { num: 13, label: '- IFRS 9 ECL Provision', type: 'cost', entities: ['Risk_Assessment', 'PD_Model', 'LGD_Model', 'EAD_Estimate'], formula: 'SUM(PD × LGD × EAD) by IFRS 9 stage', note: 'Stage 1: 12-month ECL; Stage 2/3: Lifetime ECL. SBP classifies OAEM/SS/D/L. Dual classification (SBP + IFRS 9) required.', relatedCaps: ['Credit Risk Scoring', 'RAROC Analytics'] },
  { num: 14, label: '= Profit Before Capital', type: 'subtotal', entities: [], formula: 'Line 12 - Line 13', note: '', relatedCaps: [] },
  { num: 15, label: '- Capital Charge (RWA×CoE)', type: 'cost', entities: ['RWA_Calculation', 'Capital_Adequacy', 'Risk_Weight'], formula: 'RWA × Cost_of_Equity (SBP CAR ≥ 11.5%)', note: 'Basel III with Pakistan-specific risk weights. CoE ~18-22% in Pakistan high-rate environment.', relatedCaps: ['RAROC Analytics', 'Regulatory Reporting'] },
  { num: 16, label: '= Economic Profit (EVA)', type: 'final', entities: [], formula: 'Line 14 - Line 15', note: 'RAROC = Operating Profit / RWA. Key metric for capital allocation.', relatedCaps: ['Customer Profitability Analysis', 'RAROC Analytics'] },
]

const TYPE_STYLES: Record<string, string> = {
  revenue: 'text-green-700 bg-green-50',
  cost: 'text-red-700 bg-red-50',
  subtotal: 'text-slate-800 bg-slate-50 font-bold',
  subtotal_blue: 'text-blue-800 bg-blue-50 font-bold',
  adjustment: 'text-amber-700 bg-amber-50',
  final: 'text-amber-900 bg-amber-100 font-bold text-lg',
}

const TABLE_COLORS: Record<string, string> = {
  fact: 'border-amber-400 bg-amber-50',
  dimension: 'border-blue-400 bg-blue-50',
  aggregate: 'border-emerald-400 bg-emerald-50',
  view: 'border-violet-400 bg-violet-50',
}

// P1: Pakistan-specific dimension columns
const PAKISTAN_DIMENSION_COLUMNS: Record<string, string[]> = {
  'DIM_CUSTOMER': ['cnic_number', 'ntn_number', 'is_islamic_customer', 'zakat_exempt_flag'],
  'DIM_PRODUCT': ['islamic_mode_cd', 'sbp_product_code', 'shariah_compliant_flag'],
  'DIM_BRANCH': ['sbp_branch_code', 'is_islamic_branch', 'province_code'],
  'DIM_TIME': ['pakistan_fiscal_year', 'islamic_month', 'weekly_holiday_friday'],
  'DIM_AGREEMENT': ['ifrs9_stage', 'sbp_classification_cd', 'collateral_type_sbp'],
  'DIM_SEGMENT': ['sbp_sector_code', 'sme_definition_sbp'],
  'DIM_CHANNEL': ['raast_enabled', 'branchless_agent_flag'],
}

// P3: Gap module to star schema connections
const GAP_STAR_CONNECTIONS: Record<string, { factColumns: string[]; capabilities: string[] }> = {
  'ABC Costing': {
    factColumns: ['abc_allocated_cost ← COST_ALLOCATION', 'direct_cost ← ACTIVITY_RATE', 'cost_per_unit ← COST_POOL'],
    capabilities: ['Activity-Based Costing', 'Customer Profitability Analysis', 'Channel Cost Analysis'],
  },
  'CLV Model': {
    factColumns: ['customer_lifetime_value ← CLV_SCORE', 'predicted_revenue ← CLV_REVENUE_FORECAST'],
    capabilities: ['Customer Lifetime Value', 'Customer Profitability Analysis'],
  },
  'Budget Variance': {
    factColumns: ['budget_amount ← BUDGET_LINE', 'variance_pct ← BUDGET_VS_ACTUAL'],
    capabilities: ['Budget vs Actual Analysis', 'Performance Dashboard'],
  },
  'Operational Metrics': {
    factColumns: ['cycle_time ← PROCESS_METRIC', 'sla_met_flag ← SLA_THRESHOLD'],
    capabilities: ['Close Process Management', 'Reconciliation Automation'],
  },
  'BPM': {
    factColumns: ['process_cost ← PROCESS_STEP', 'automation_rate ← PROCESS_METRIC'],
    capabilities: ['Close Process Management', 'Reconciliation Automation'],
  },
}

// P4: Views data
const VIEWS = [
  { name: 'VW_CUSTOMER_PL', description: 'Customer-level P&L statement — aggregates fact by customer', sources: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_CUSTOMER', 'DIM_PRODUCT'], keyColumns: ['customer_id', 'total_nii', 'total_fees', 'abc_cost', 'ecl_provision', 'eva', 'raroc'] },
  { name: 'VW_PRODUCT_PL', description: 'Product-level P&L — aggregates fact by product type', sources: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_PRODUCT', 'DIM_SEGMENT'], keyColumns: ['product_type', 'product_nii', 'product_fees', 'product_cost', 'product_eva'] },
  { name: 'VW_ISLAMIC_VS_CONVENTIONAL', description: 'Comparison view splitting all metrics by islamic_flag', sources: ['FACT_CUSTOMER_PROFITABILITY', 'DIM_PRODUCT', 'DIM_CUSTOMER'], keyColumns: ['is_islamic', 'total_revenue', 'total_cost', 'total_provision', 'total_eva', 'customer_count'] },
]

export default function ProfitabilityEngine() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'schema' | 'dimensions' | 'pl' | 'gaps'>('schema')
  const [starSchema, setStarSchema] = useState<StarSchema | null>(null)
  const [gapModules, setGapModules] = useState<GapModule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [expandedPL, setExpandedPL] = useState<number | null>(null)
  const [expandedGap, setExpandedGap] = useState<string | null>(null)
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadStarSchema(), loadGapExtensions()]).then(([ss, ge]) => {
      setStarSchema(ss)
      setGapModules(ge)
      setLoading(false)
    })
  }, [])

  if (loading || !starSchema) {
    return <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] animate-pulse" />
  }

  const allTables: SchemaTable[] = [
    starSchema.factTable,
    ...starSchema.dimensions,
    ...starSchema.aggregates,
    ...starSchema.views,
  ]

  const tabs = [
    { id: 'schema' as const, label: 'Star Schema' },
    { id: 'dimensions' as const, label: 'Dimensions' },
    { id: 'pl' as const, label: 'P&L Builder' },
    { id: 'gaps' as const, label: 'Gap Extensions' },
  ]

  return (
    <div className="space-y-4">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">Profitability Engine</h1>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON({ starSchema, gapModules, plLines: PL_LINES }, 'baiw-profitability') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-profitability', 'baiw-profitability', 'BAIW Profitability Engine') },
        ]} />
      </div>

      <div id="page-profitability">
      {activeTab === 'schema' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-6">Profitability Star Schema ERD</h3>

          <div className="relative mb-8">
            <svg viewBox="0 0 800 500" className="w-full max-w-4xl mx-auto">
              <rect x="280" y="180" width="240" height="80" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
              <text x="400" y="210" textAnchor="middle" className="text-sm font-bold" fill="#92400E">FACT_CUSTOMER</text>
              <text x="400" y="230" textAnchor="middle" className="text-sm font-bold" fill="#92400E">_PROFITABILITY</text>
              <text x="400" y="250" textAnchor="middle" className="text-xs" fill="#B45309">35+ measures</text>
              {[
                { name: 'DIM_CUSTOMER', x: 80, y: 30 },
                { name: 'DIM_PRODUCT', x: 320, y: 30 },
                { name: 'DIM_BRANCH', x: 560, y: 30 },
                { name: 'DIM_TIME', x: 80, y: 380 },
                { name: 'DIM_AGREEMENT', x: 320, y: 380 },
                { name: 'DIM_CHANNEL', x: 560, y: 380 },
                { name: 'DIM_SEGMENT', x: 660, y: 200 },
              ].map((dim) => (
                <g key={dim.name}>
                  <line x1={dim.x + 80} y1={dim.y + (dim.y < 200 ? 40 : 0)} x2={400} y2={dim.y < 200 ? 180 : 260} stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4" />
                  <rect x={dim.x} y={dim.y} width="160" height="40" rx="6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
                  <text x={dim.x + 80} y={dim.y + 24} textAnchor="middle" className="text-xs font-medium" fill="#1E40AF">{dim.name}</text>
                </g>
              ))}
              {[
                { name: 'AGG_BRANCH', x: 30, y: 200 },
                { name: 'AGG_SEGMENT', x: 30, y: 260 },
              ].map((agg) => (
                <g key={agg.name}>
                  <line x1={agg.x + 100} y1={agg.y + 20} x2={280} y2={220} stroke="#6EE7B7" strokeWidth="1.5" strokeDasharray="4" />
                  <rect x={agg.x} y={agg.y} width="140" height="36" rx="6" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" />
                  <text x={agg.x + 70} y={agg.y + 22} textAnchor="middle" className="text-xs font-medium" fill="#065F46">{agg.name}</text>
                </g>
              ))}
            </svg>
          </div>

          {/* Table Details */}
          <div className="space-y-3">
            {allTables.map((table) => {
              const isExpanded = expandedTable === table.name
              const colorClass = TABLE_COLORS[table.type] || 'border-slate-300 bg-slate-50'
              return (
                <div key={table.name} className={`border-l-4 rounded-lg ${colorClass}`}>
                  <button onClick={() => setExpandedTable(isExpanded ? null : table.name)} className="w-full flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-mono text-sm font-medium">{table.name}</span>
                      <span className="text-xs text-slate-500 uppercase">{table.type}</span>
                    </div>
                    <span className="text-xs text-slate-400">{table.columns.length} columns</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="py-1 pr-4">Column</th>
                            <th className="py-1 pr-4">Type</th>
                            <th className="py-1">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-t border-slate-200/50">
                              <td className={`py-1.5 pr-4 font-mono ${col.isPakistanSpecific ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}>
                                {col.name}
                                {col.isPakistanSpecific && <span className="ml-1 text-emerald-500">*</span>}
                              </td>
                              <td className="py-1.5 pr-4 text-slate-500">{col.dataType}</td>
                              <td className="py-1.5 text-slate-500">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-emerald-600 mt-2">* Pakistan-specific columns</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* P4: Views Section */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Analytical Views</h4>
            <div className="space-y-3">
              {VIEWS.map((v) => (
                <div key={v.name} className="border-l-4 border-violet-400 bg-violet-50 rounded-lg p-4">
                  <h5 className="font-mono text-sm font-medium text-violet-800">{v.name}</h5>
                  <p className="text-xs text-violet-600 mt-1">{v.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500">Sources:</span>
                    {v.sources.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 text-xs bg-violet-100 text-violet-700 rounded font-mono">{s}</span>
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500">Key columns:</span>
                    {v.keyColumns.map((c) => (
                      <span key={c} className="text-xs text-slate-600 font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* P1: Dimension Explorer Tab */}
      {activeTab === 'dimensions' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-6">Dimension Explorer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starSchema.dimensions.map((dim) => {
              const isExpanded = expandedDim === dim.name
              const pkCols = PAKISTAN_DIMENSION_COLUMNS[dim.name] || []
              return (
                <div key={dim.name} className="border border-blue-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : dim.name)}
                    className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-sm font-semibold text-blue-800">{dim.name}</h4>
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded">{dim.columns.length} cols</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dim.columns.slice(0, 5).map((col) => (
                        <span key={col.name} className="text-xs text-slate-600 font-mono">{col.name}</span>
                      ))}
                      {dim.columns.length > 5 && <span className="text-xs text-slate-400">+{dim.columns.length - 5}</span>}
                    </div>
                    {pkCols.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pkCols.map((c) => (
                          <span key={c} className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded font-mono">
                            🇵🇰 {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 border-t border-blue-200">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="py-1">Column</th>
                            <th className="py-1">Type</th>
                            <th className="py-1">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dim.columns.map((col) => {
                            const isPk = pkCols.includes(col.name)
                            return (
                              <tr key={col.name} className="border-t border-slate-100">
                                <td className={`py-1 font-mono ${isPk ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}>
                                  {isPk && '🇵🇰 '}{col.name}
                                </td>
                                <td className="py-1 text-slate-500">{col.dataType}</td>
                                <td className="py-1 text-slate-500">{col.description}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* P2: P&L Builder with expanded detail */}
      {activeTab === 'pl' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-6">15-Line Customer Profitability Waterfall</h3>
          <div className="space-y-2">
            {PL_LINES.map((line) => {
              const isExpanded = expandedPL === line.num
              return (
                <div key={line.num} className="rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedPL(isExpanded ? null : line.num)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${TYPE_STYLES[line.type]}`}
                  >
                    <span className="text-xs text-slate-400 w-6">{line.num}.</span>
                    <span className="flex-1 text-sm">{line.label}</span>
                    {line.entities.length > 0 && (
                      isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    )}
                  </button>
                  {isExpanded && line.entities.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Formula</p>
                        <p className="text-xs text-slate-600 font-mono bg-white px-2 py-1 rounded border">{line.formula}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">FSDM Entities</p>
                        <div className="flex flex-wrap gap-1">
                          {line.entities.map((e) => (
                            <button
                              key={e}
                              onClick={() => navigate(`/model?search=${encodeURIComponent(e)}`)}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-mono hover:bg-blue-200"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                      {line.note && (
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Pakistan Context</p>
                          <p className="text-xs text-emerald-700">{line.note}</p>
                        </div>
                      )}
                      {line.relatedCaps.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Related Capabilities</p>
                          <div className="flex flex-wrap gap-1">
                            {line.relatedCaps.map((c) => (
                              <button
                                key={c}
                                onClick={() => navigate(`/capabilities?theme=${encodeURIComponent('Finance & Peformance Management')}`)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                → {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* P3: Gap Extensions with connections */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {gapModules.map((mod) => {
            const isExpanded = expandedGap === mod.id
            const connections = GAP_STAR_CONNECTIONS[mod.name]
            return (
              <div key={mod.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => setExpandedGap(isExpanded ? null : mod.id)} className="w-full flex items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div className="text-left">
                      <h4 className="text-sm font-semibold text-slate-800">{mod.name}</h4>
                      <p className="text-xs text-slate-500">{mod.description}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{mod.tables.length} tables</span>
                </button>
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    {/* P3: Connects To section */}
                    {connections && (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h5 className="text-xs font-semibold text-amber-800 mb-2">Feeds into Star Schema:</h5>
                        <div className="space-y-1">
                          {connections.factColumns.map((fc) => (
                            <p key={fc} className="text-xs text-amber-700 font-mono">FACT.{fc}</p>
                          ))}
                        </div>
                        <h5 className="text-xs font-semibold text-amber-800 mt-3 mb-1">Required for Capabilities:</h5>
                        <div className="flex flex-wrap gap-1">
                          {connections.capabilities.map((c) => (
                            <button
                              key={c}
                              onClick={() => navigate(`/capabilities?theme=${encodeURIComponent('Finance & Peformance Management')}`)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              → {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {mod.tables.map((table) => (
                      <div key={table.name} className="border border-slate-200 rounded-lg p-4">
                        <h5 className="font-mono text-sm font-medium text-slate-700 mb-2">{table.name}</h5>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          {table.columns.map((col) => (
                            <div key={col.name} className="flex items-center gap-1">
                              <span className="font-mono text-slate-600">{col.name}</span>
                              <span className="text-slate-400">({col.dataType})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
