import { useState, useEffect } from 'react'
import { Target, Users, Database, Cpu, Map } from 'lucide-react'
import ExportMenu from '../components/layout/ExportMenu'
import PageSkeleton from '../components/layout/PageSkeleton'
import BusinessArchitecture from '../components/profitability/BusinessArchitecture'
import DataArchitecture from '../components/profitability/DataArchitecture'
import TechnologyArchitecture from '../components/profitability/TechnologyArchitecture'
import ProfitabilityUseCases from '../components/profitability/ProfitabilityUseCases'
import ProfitabilityRoadmap from '../components/profitability/ProfitabilityRoadmap'
import { loadProfitabilityWorkbench, convertUseCasesToCSV, roadmapToCSV, type WorkbenchData } from '../utils/profitabilityWorkbench'
import { downloadCSV, downloadJSON } from '../utils/export'

const TABS = [
  { id: 'business', label: 'Business Architecture', icon: Users },
  { id: 'data', label: 'Data Architecture', icon: Database },
  { id: 'technology', label: 'Technology Architecture', icon: Cpu },
  { id: 'usecases', label: 'Use-Case Explorer', icon: Target },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
]

export default function CustomerProfitabilityWorkbench() {
  const [activeTab, setActiveTab] = useState<'business' | 'data' | 'technology' | 'usecases' | 'roadmap'>('business')
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfitabilityWorkbench().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const handleExport = () => {
    if (!data) return
    if (activeTab === 'usecases') {
      downloadCSV(convertUseCasesToCSV(data.useCases), 'baiw-customer-profitability-use-cases')
    } else if (activeTab === 'roadmap') {
      downloadCSV(roadmapToCSV(data.roadmap.phases), 'baiw-customer-profitability-roadmap')
    } else {
      downloadJSON(data, 'baiw-customer-profitability-workbench')
    }
  }

  if (loading || !data) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-5" id="page-customer-profitability-workbench">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{data.subtitle}</p>
        </div>
        <ExportMenu options={[
          { label: 'Export current tab as CSV/JSON', onClick: handleExport },
        ]} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'business' && <BusinessArchitecture data={data.businessArchitecture} />}
      {activeTab === 'data' && <DataArchitecture data={data.dataArchitecture} />}
      {activeTab === 'technology' && <TechnologyArchitecture data={data.technologyArchitecture} />}
      {activeTab === 'usecases' && <ProfitabilityUseCases data={data.useCases} />}
      {activeTab === 'roadmap' && <ProfitabilityRoadmap data={data.roadmap} />}
    </div>
  )
}
