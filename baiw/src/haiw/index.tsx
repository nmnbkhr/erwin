import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HaiwLayout from './components/HaiwLayout'
import PageSkeleton from '../components/layout/PageSkeleton'

const HaiwDashboard = lazy(() => import('./components/HaiwDashboard'))
const HealthWorkbench = lazy(() => import('./components/HealthWorkbench'))
const FHIRResourceExplorer = lazy(() => import('./components/FHIRResourceExplorer'))
const HCFCapabilityNavigator = lazy(() => import('./components/HCFCapabilityNavigator'))
const HealthDependencyGraph = lazy(() => import('./components/HealthDependencyGraph'))
const HealthMaturityAssessment = lazy(() => import('./components/HealthMaturityAssessment'))
const HealthAnalyticsEngine = lazy(() => import('./components/HealthAnalyticsEngine'))
const HealthRoadmapBuilder = lazy(() => import('./components/HealthRoadmapBuilder'))
const PakistanHealthReference = lazy(() => import('./components/PakistanHealthReference'))
const HealthcareUseCases = lazy(() => import('./components/HealthcareUseCases'))

export default function HaiwRoutes() {
  return (
    <HaiwLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<HaiwDashboard />} />
          <Route path="/workbench" element={<HealthWorkbench />} />
          <Route path="/model" element={<FHIRResourceExplorer />} />
          <Route path="/capabilities" element={<HCFCapabilityNavigator />} />
          <Route path="/graph" element={<HealthDependencyGraph />} />
          <Route path="/maturity" element={<HealthMaturityAssessment />} />
          <Route path="/analytics" element={<HealthAnalyticsEngine />} />
          <Route path="/roadmap" element={<HealthRoadmapBuilder />} />
          <Route path="/pakistan" element={<PakistanHealthReference />} />
          <Route path="/use-cases" element={<HealthcareUseCases />} />
        </Routes>
      </Suspense>
    </HaiwLayout>
  )
}
