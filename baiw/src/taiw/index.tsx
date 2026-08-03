import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import TaiwLayout from './components/TaiwLayout'
import PageSkeleton from '../components/layout/PageSkeleton'

const TaiwDashboard = lazy(() => import('./components/TaiwDashboard'))
const TradeWorkbench = lazy(() => import('./components/TradeWorkbench'))
const WCOModelExplorer = lazy(() => import('./components/WCOModelExplorer'))
const TCFCapabilityNavigator = lazy(() => import('./components/TCFCapabilityNavigator'))
const TradeDependencyGraph = lazy(() => import('./components/TradeDependencyGraph'))
const TradeMaturityAssessment = lazy(() => import('./components/TradeMaturityAssessment'))
// Lazy like every other route: this page's deliverable buttons reach jsPDF, and a
// static import here would pull the PDF engine into the module's entry chunk.
const TradeFrameworks = lazy(() => import('./components/TradeFrameworks'))
const TradeAnalyticsEngine = lazy(() => import('./components/TradeAnalyticsEngine'))
const TradeRoadmapBuilder = lazy(() => import('./components/TradeRoadmapBuilder'))
const PakistanTradeReference = lazy(() => import('./components/PakistanTradeReference'))

export default function TaiwRoutes() {
  return (
    <TaiwLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<TaiwDashboard />} />
          <Route path="/workbench" element={<TradeWorkbench />} />
          <Route path="/model" element={<WCOModelExplorer />} />
          <Route path="/capabilities" element={<TCFCapabilityNavigator />} />
          <Route path="/graph" element={<TradeDependencyGraph />} />
          <Route path="/maturity" element={<TradeMaturityAssessment />} />
          <Route path="/frameworks" element={<TradeFrameworks />} />
          <Route path="/analytics" element={<TradeAnalyticsEngine />} />
          <Route path="/roadmap" element={<TradeRoadmapBuilder />} />
          <Route path="/pakistan" element={<PakistanTradeReference />} />
        </Routes>
      </Suspense>
    </TaiwLayout>
  )
}
