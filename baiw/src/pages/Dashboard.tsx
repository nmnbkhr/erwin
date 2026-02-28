import { useState, useEffect } from 'react'
import { Database, Layers, ClipboardCheck, Globe, Target, Map as MapIcon } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import DomainDonut from '../components/dashboard/DomainDonut'
import CapabilityBar from '../components/dashboard/CapabilityBar'
import PakistanCard from '../components/dashboard/PakistanCard'
import TopReusedChart from '../components/dashboard/TopReusedChart'
import MaturityRadarCard, { getAssessmentProgress } from '../components/dashboard/MaturityRadarCard'
import QuickNavGrid from '../components/dashboard/QuickNavGrid'
import ExportMenu from '../components/layout/ExportMenu'
import { loadDomains, loadCapabilities } from '../utils/dataLoader'
import { downloadJSON, downloadPDF } from '../utils/export'
import type { Domain, Capability } from '../types'

function getRoadmapCount(): number {
  try {
    const saved = localStorage.getItem('baiw-roadmap')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && Array.isArray(parsed.selectedCapabilities)) {
        return parsed.selectedCapabilities.length
      }
    }
  } catch { /* ignore */ }
  return 0
}

export default function Dashboard() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadDomains(), loadCapabilities()]).then(([d, c]) => {
      setDomains(d)
      setCapabilities(c)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-80 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalEntities = domains.reduce((sum, d) => sum + d.entityCount, 0)
  const { categoriesAssessed, total: totalCategories } = getAssessmentProgress()
  const roadmapCount = getRoadmapCount()

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON({ totalEntities, domains: domains.length, capabilities: capabilities.length, bacrQuestions: 793, domainData: domains, capabilityData: capabilities }, 'baiw-dashboard') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-dashboard', 'baiw-dashboard', 'BAIW Dashboard') },
        ]} />
      </div>
      <div id="page-dashboard">
        {/* D2: Quick Navigation Grid */}
        <QuickNavGrid />

        {/* D3: Stats Bar with Dynamic Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
          <StatCard label="FSDM Entities" value={totalEntities} icon={Database} color="bg-blue-600" />
          <StatCard label="BVF Capabilities" value={capabilities.length} icon={Layers} color="bg-amber-500" />
          <StatCard label="BACR Questions" value={793} icon={ClipboardCheck} color="bg-violet-500" />
          <StatCard label="FSDM Domains" value={domains.length} icon={Globe} color="bg-emerald-600" />
          <StatCard
            label="Assessment Progress"
            value={categoriesAssessed > 0 ? `${categoriesAssessed}/${totalCategories} assessed` : 'Not started'}
            icon={Target}
            color="bg-rose-500"
          />
          <StatCard
            label="Roadmap"
            value={roadmapCount > 0 ? `${roadmapCount} capabilities` : 'No roadmap'}
            icon={MapIcon}
            color="bg-cyan-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DomainDonut domains={domains} />
          <CapabilityBar capabilities={capabilities} />
          <PakistanCard />
          {/* D1: Maturity Radar Card */}
          <MaturityRadarCard />
          <TopReusedChart />
        </div>
      </div>
    </div>
  )
}
