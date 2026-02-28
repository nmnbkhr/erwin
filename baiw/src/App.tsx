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

function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <Layout>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
      </AssessmentProvider>
    </BrowserRouter>
  )
}

export default App
