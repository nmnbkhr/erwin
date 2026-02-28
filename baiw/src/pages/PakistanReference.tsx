import { useState, useEffect } from 'react'
import { loadPakistanContext } from '../utils/dataLoader'
import type { PakistanContext } from '../types'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadCSV } from '../utils/export'
import { ChevronDown, ChevronRight } from 'lucide-react'

type TabId = 'regulatory' | 'industry' | 'islamic' | 'payments' | 'sbpReturns' | 'ubl'

const tabs: { id: TabId; label: string }[] = [
  { id: 'regulatory', label: 'Regulatory Framework' },
  { id: 'industry', label: 'Industry Metrics' },
  { id: 'islamic', label: 'Islamic Banking' },
  { id: 'payments', label: 'Payment Ecosystem' },
  { id: 'sbpReturns', label: 'SBP Returns' },
  { id: 'ubl', label: 'UBL Context' },
]

// K1: SBP Statutory Returns
const SBP_RETURNS = [
  { code: 'WSP', name: 'Weekly Statement of Position', frequency: 'Weekly', description: 'Assets, liabilities, capital summary', fsdmEntities: ['Account_Balance', 'GL_Entry'], capabilities: ['Regulatory Reporting'] },
  { code: 'MSA', name: 'Monthly Statement of Affairs', frequency: 'Monthly', description: 'Detailed balance sheet with sector-wise breakdowns', fsdmEntities: ['Account_Balance', 'GL_Entry', 'Party'], capabilities: ['Regulatory Reporting', 'External Financial Reporting'] },
  { code: 'QFS', name: 'Quarterly Financial Statements', frequency: 'Quarterly', description: 'Full P&L + balance sheet per IFRS/SBP format', fsdmEntities: ['GL_Entry', 'Income_Classification'], capabilities: ['External Financial Reporting'] },
  { code: 'CAR', name: 'Capital Adequacy Return', frequency: 'Quarterly', description: 'CET1, Tier 1, Total capital ratios per Basel III', fsdmEntities: ['Capital_Adequacy', 'RWA_Calculation', 'Risk_Weight'], capabilities: ['RAROC Analytics', 'Basel III Reporting'] },
  { code: 'LCR', name: 'Liquidity Coverage Ratio', frequency: 'Daily', description: 'HQLA / net cash outflows (min 100%)', fsdmEntities: ['Account_Balance', 'Cash_Flow'], capabilities: ['Liquidity Risk Analytics'] },
  { code: 'NSFR', name: 'Net Stable Funding Ratio', frequency: 'Quarterly', description: 'Available stable funding / required stable funding', fsdmEntities: ['Account_Balance', 'Maturity_Band'], capabilities: ['Liquidity Risk Analytics'] },
  { code: 'ECIB', name: 'Enhanced Credit Information Bureau', frequency: 'Monthly', description: 'Borrower-level credit data submission to SBP', fsdmEntities: ['Agreement', 'Party', 'Risk_Assessment'], capabilities: ['Credit Risk Scoring', 'Regulatory Reporting'] },
  { code: 'STR', name: 'Suspicious Transaction Report', frequency: 'Event-driven', description: 'AML/CFT suspicious activity reporting', fsdmEntities: ['Transaction', 'Party', 'Alert'], capabilities: ['AML Analytics'] },
  { code: 'CTR', name: 'Currency Transaction Report', frequency: 'Event-driven', description: 'Cash transactions exceeding PKR 2M threshold', fsdmEntities: ['Transaction', 'Party'], capabilities: ['AML Analytics', 'KYC Analytics'] },
  { code: 'BPD', name: 'Branch Profile Data', frequency: 'Quarterly', description: 'Branch-level operational data & performance', fsdmEntities: ['Branch', 'Account_Balance'], capabilities: ['Performance Dashboard'] },
  { code: 'CPC', name: 'Consumer Protection Complaints', frequency: 'Quarterly', description: 'Customer complaint resolution tracking', fsdmEntities: ['Party', 'Complaint'], capabilities: ['Customer Profitability Analysis'] },
  { code: 'IBD', name: 'Islamic Banking Data', frequency: 'Monthly', description: 'Islamic assets, deposits, financing modes', fsdmEntities: ['Agreement', 'Product', 'Islamic_Mode'], capabilities: ['Regulatory Reporting'] },
  { code: 'IFRS9', name: 'IFRS 9 ECL Returns', frequency: 'Quarterly', description: 'Expected credit loss provisioning by stage', fsdmEntities: ['Risk_Assessment', 'PD_Model', 'LGD_Model'], capabilities: ['Credit Risk Scoring'] },
  { code: 'LR', name: 'Leverage Ratio', frequency: 'Quarterly', description: 'Tier 1 capital / total exposure (min 3%)', fsdmEntities: ['Capital_Adequacy', 'Account_Balance'], capabilities: ['Basel III Reporting'] },
]

export default function PakistanReference() {
  const [context, setContext] = useState<PakistanContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('regulatory')
  const [expandedReturnCode, setExpandedReturnCode] = useState<string | null>(null)

  useEffect(() => {
    loadPakistanContext().then((data) => {
      setContext(data)
      setLoading(false)
    })
  }, [])

  if (loading || !context) {
    return <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] animate-pulse" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON(context, 'baiw-pakistan-reference') },
          { label: 'Export as CSV', onClick: () => {
            const rows = [
              ...context.regulatoryFramework.sbpRates.map(r => ({ Section: 'SBP Rates', Item: r.name, Value: r.rate, Notes: '' })),
              ...context.regulatoryFramework.baselIII.map(r => ({ Section: 'Basel III', Item: r.metric, Value: r.requirement, Notes: '' })),
              ...context.regulatoryFramework.taxRates.map(r => ({ Section: 'Tax Rates', Item: r.type, Value: r.rate, Notes: r.notes })),
              ...context.industryMetrics.overview.map(r => ({ Section: 'Industry Metrics', Item: r.metric, Value: r.value, Notes: '' })),
              ...context.industryMetrics.ratios.map(r => ({ Section: 'Financial Ratios', Item: r.name, Value: r.value, Notes: '' })),
            ]
            downloadCSV(rows, 'baiw-pakistan-reference')
          }},
        ]} />
      </div>

      {activeTab === 'regulatory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">SBP Key Rates</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {context.regulatoryFramework.sbpRates.map((rate) => (
                <div key={rate.name} className="p-3 bg-emerald-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-emerald-800">{rate.rate}</p>
                  <p className="text-xs text-emerald-600">{rate.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Basel III Requirements</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Metric</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  {context.regulatoryFramework.baselIII.map((item) => (
                    <tr key={item.metric} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{item.metric}</td>
                      <td className="px-4 py-2 font-medium text-slate-800">{item.requirement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">IFRS 9 ECL Framework</h3>
            <div className="space-y-3">
              {context.regulatoryFramework.ifrs9.map((stage) => (
                <div key={stage.stage} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{stage.stage}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{stage.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{stage.criteria}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Tax Rates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Type</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Rate</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {context.regulatoryFramework.taxRates.map((tax) => (
                    <tr key={tax.type} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{tax.type}</td>
                      <td className="px-4 py-2 font-medium text-red-600">{tax.rate}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{tax.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'industry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Banking Sector Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {context.industryMetrics.overview.map((item) => (
                <div key={item.metric} className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-emerald-800">{item.value}</p>
                  <p className="text-xs text-emerald-600 mt-1">{item.metric}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Key Financial Ratios</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {context.industryMetrics.ratios.map((ratio) => (
                <div key={ratio.name} className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-lg font-bold text-slate-800">{ratio.value}</p>
                  <p className="text-xs text-slate-500">{ratio.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'islamic' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Islamic Banking Product Modes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-emerald-700">Mode</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-emerald-700">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-emerald-700">Use Case</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-emerald-700">FSDM Entity</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-emerald-700">P&L Treatment</th>
                </tr>
              </thead>
              <tbody>
                {context.islamicBanking.modes.map((mode) => (
                  <tr key={mode.name} className="border-t border-emerald-100">
                    <td className="px-4 py-3 font-medium text-emerald-800">{mode.name}</td>
                    <td className="px-4 py-3 text-slate-600">{mode.type}</td>
                    <td className="px-4 py-3 text-slate-600">{mode.useCase}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-mono">{mode.fsdmEntity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{mode.plTreatment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Payment Infrastructure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {context.paymentEcosystem.infrastructure.map((item) => (
                <div key={item.name} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-slate-800">{item.name}</h4>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{item.type}</span>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Fintech Ecosystem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {context.paymentEcosystem.fintechs.map((ft) => (
                <div key={ft.name} className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-emerald-800">{ft.name}</h4>
                    <span className="text-xs font-medium text-emerald-600">{ft.users}</span>
                  </div>
                  <p className="text-xs text-emerald-700">{ft.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* K1: SBP Statutory Returns */}
      {activeTab === 'sbpReturns' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">SBP Statutory Returns ({SBP_RETURNS.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Code</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Frequency</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Description</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {SBP_RETURNS.map((ret) => (
                  <>
                    <tr key={ret.code} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium text-emerald-700">{ret.code}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{ret.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          ret.frequency === 'Daily' ? 'bg-red-100 text-red-700' :
                          ret.frequency === 'Weekly' ? 'bg-orange-100 text-orange-700' :
                          ret.frequency === 'Monthly' ? 'bg-blue-100 text-blue-700' :
                          ret.frequency === 'Quarterly' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{ret.frequency}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ret.description}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedReturnCode(expandedReturnCode === ret.code ? null : ret.code)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedReturnCode === ret.code ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                    </tr>
                    {expandedReturnCode === ret.code && (
                      <tr key={`${ret.code}-detail`} className="bg-slate-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-slate-500 font-medium mb-1">FSDM Entities:</p>
                              <div className="flex flex-wrap gap-1">
                                {ret.fsdmEntities.map((e) => (
                                  <span key={e} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-mono">{e}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium mb-1">Related Capabilities:</p>
                              <div className="flex flex-wrap gap-1">
                                {ret.capabilities.map((c) => (
                                  <span key={c} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* K2: UBL Context */}
      {activeTab === 'ubl' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">UBL Data Warehouse Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Infrastructure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">FSDM Version:</span><span className="font-mono font-medium">v13.00.00</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Hardware:</span><span className="font-medium">Teradata IntelliFlex</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Previous:</span><span className="text-slate-400">TD 2850</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Core Banking Systems:</span><span className="font-medium">4-5 source systems incl. CTL</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Key Asset:</span><span className="font-medium text-emerald-700">Customer Profitability Engine</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Migration Path: v13 → v16</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-600">v13: 3,917 entities in ERwin model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">v16: 3,917 entities in XSD schema</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-600">Gap: ~200 new entities in v16 (estimate)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Star Schema: FACT_CUSTOMER_PROFITABILITY</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-700">35+</p>
                <p className="text-xs text-amber-600">Measures</p>
                <p className="text-xs text-slate-400 mt-1">NII, FTP, fees, ABC, ECL, EVA</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">7</p>
                <p className="text-xs text-blue-600">Dimensions</p>
                <p className="text-xs text-slate-400 mt-1">Customer, Product, Branch, etc.</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-700">2</p>
                <p className="text-xs text-emerald-600">Aggregates</p>
                <p className="text-xs text-slate-400 mt-1">Branch P&L, Segment P&L</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-violet-700">3</p>
                <p className="text-xs text-violet-600">Views</p>
                <p className="text-xs text-slate-400 mt-1">Customer P&L, Product P&L, Islamic</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Gap Extensions</h3>
            <div className="grid grid-cols-5 gap-3">
              {['ABC Costing', 'CLV Model', 'Budget Variance', 'BPM', 'Operational Metrics'].map((mod) => (
                <div key={mod} className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm font-medium text-slate-700">{mod}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">5 modules, 21 tables — extending FSDM for Pakistan-specific profitability analytics</p>
          </div>
        </div>
      )}
    </div>
  )
}
