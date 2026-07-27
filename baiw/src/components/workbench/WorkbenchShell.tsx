import { useState } from 'react'
import { Users, Database, Cpu, Map, Target } from 'lucide-react'
import ExportMenu from '../layout/ExportMenu'
import PageSkeleton from '../layout/PageSkeleton'
import BusinessArchitecture from './BusinessArchitecture'
import DataArchitecture from './DataArchitecture'
import TechnologyArchitecture from './TechnologyArchitecture'
import UseCaseExplorer from './UseCaseExplorer'
import Roadmap from './Roadmap'
import { convertUseCasesToCSV, convertRoadmapToCSV } from './utils'
import { downloadCSV, downloadJSON } from '../../utils/export'
import type { WorkbenchData, WorkbenchTab } from './types'

const TABS = [
  { id: 'business' as WorkbenchTab, label: 'Business Architecture', icon: Users },
  { id: 'data' as WorkbenchTab, label: 'Data Architecture', icon: Database },
  { id: 'technology' as WorkbenchTab, label: 'Technology Architecture', icon: Cpu },
  { id: 'usecases' as WorkbenchTab, label: 'Use-Case Explorer', icon: Target },
  { id: 'roadmap' as WorkbenchTab, label: 'Roadmap', icon: Map },
]

interface Props {
  data: WorkbenchData
  exportFileName?: string
}

export default function WorkbenchShell({ data, exportFileName = 'workbench-export' }: Props) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('business')

  const handleExport = () => {
    if (activeTab === 'usecases') {
      downloadCSV(convertUseCasesToCSV(data.useCases), `${exportFileName}-use-cases`)
    } else if (activeTab === 'roadmap') {
      downloadCSV(convertRoadmapToCSV(data.roadmap.phases), `${exportFileName}-roadmap`)
    } else {
      downloadJSON(data, exportFileName)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{data.subtitle}</p>
        </div>
        <ExportMenu options={[
          { label: 'Export current tab as CSV/JSON', onClick: handleExport },
        ]} />
      </div>

      <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'business' && <BusinessArchitecture data={data.businessArchitecture} />}
      {activeTab === 'data' && <DataArchitecture data={data.dataArchitecture} />}
      {activeTab === 'technology' && <TechnologyArchitecture data={data.technologyArchitecture} />}
      {activeTab === 'usecases' && <UseCaseExplorer data={data.useCases} />}
      {activeTab === 'roadmap' && <Roadmap data={data.roadmap} />}
    </div>
  )
}

export { PageSkeleton }
