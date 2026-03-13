import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AssessmentProvider } from './context/AssessmentContext'
import Layout from './components/layout/Layout'
import PageSkeleton from './components/layout/PageSkeleton'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ModelExplorer = lazy(() => import('./pages/ModelExplorer'))
const CapabilityNavigator = lazy(() => import('./pages/CapabilityNavigator'))
const DependencyGraph = lazy(() => import('./pages/DependencyGraph'))
const MaturityAssessment = lazy(() => import('./pages/MaturityAssessment'))
const ProfitabilityEngine = lazy(() => import('./pages/ProfitabilityEngine'))
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'))
const PakistanReference = lazy(() => import('./pages/PakistanReference'))

const SuiteLanding = lazy(() => import('./components/SuiteLanding'))
const TaiwRoutes = lazy(() => import('./taiw'))
const CoeRoutes = lazy(() => import('./coe'))

function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <Routes>
          {/* Suite Landing — no layout wrapper */}
          <Route path="/" element={
            <Suspense fallback={<PageSkeleton />}>
              <SuiteLanding />
            </Suspense>
          } />

          {/* TAIW routes — separate layout */}
          <Route path="/taiw/*" element={
            <Suspense fallback={<PageSkeleton />}>
              <TaiwRoutes />
            </Suspense>
          } />

          {/* COE routes — separate layout */}
          <Route path="/coe/*" element={
            <Suspense fallback={<PageSkeleton />}>
              <CoeRoutes />
            </Suspense>
          } />

          {/* BAIW routes — existing layout */}
          <Route path="*" element={
            <Layout>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/model" element={<ModelExplorer />} />
                  <Route path="/capabilities" element={<CapabilityNavigator />} />
                  <Route path="/graph" element={<DependencyGraph />} />
                  <Route path="/maturity" element={<MaturityAssessment />} />
                  <Route path="/profitability" element={<ProfitabilityEngine />} />
                  <Route path="/roadmap" element={<RoadmapBuilder />} />
                  <Route path="/pakistan" element={<PakistanReference />} />
                </Routes>
              </Suspense>
            </Layout>
          } />
        </Routes>
      </AssessmentProvider>
    </BrowserRouter>
  )
}

export default App
