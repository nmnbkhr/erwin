import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AssessmentProvider } from './context/AssessmentContext'
import Layout from './components/layout/Layout'
import PageSkeleton from './components/layout/PageSkeleton'
import ErrorBoundary from './components/layout/ErrorBoundary'
import NotFound from './components/layout/NotFound'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ModelExplorer = lazy(() => import('./pages/ModelExplorer'))
const CapabilityNavigator = lazy(() => import('./pages/CapabilityNavigator'))
const DependencyGraph = lazy(() => import('./pages/DependencyGraph'))
const MaturityAssessment = lazy(() => import('./pages/MaturityAssessment'))
const ProfitabilityEngine = lazy(() => import('./pages/ProfitabilityEngine'))
const CustomerProfitability = lazy(() => import('./pages/CustomerProfitability'))
const CustomerProfitabilityWorkbench = lazy(() => import('./pages/CustomerProfitabilityWorkbench'))
const CustomerValue = lazy(() => import('./pages/CustomerValue'))
const CorporateValue = lazy(() => import('./pages/CorporateValue'))
const CustomerComparison = lazy(() => import('./pages/CustomerComparison'))
const WhatIfLab = lazy(() => import('./pages/WhatIfLab'))
const PortfolioRollup = lazy(() => import('./pages/PortfolioRollup'))
const UseCaseDeck = lazy(() => import('./pages/UseCaseDeck'))
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'))
const PakistanReference = lazy(() => import('./pages/PakistanReference'))
const CashOptimizationEngine = lazy(() => import('./components/CashOptimizationEngine'))
const ArchitectureCockpit = lazy(() => import('./pages/ArchitectureCockpit'))

const SuiteLanding = lazy(() => import('./components/SuiteLanding'))
const TaiwRoutes = lazy(() => import('./taiw'))
const CoeRoutes = lazy(() => import('./coe'))
const HaiwRoutes = lazy(() => import('./haiw'))
const AlmRoutes = lazy(() => import('./alm'))

function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <Routes>
          {/* Suite Landing — no layout wrapper */}
          <Route path="/" element={
            <ErrorBoundary moduleName="Suite">
              <Suspense fallback={<PageSkeleton />}>
                <SuiteLanding />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* TAIW routes — separate layout */}
          <Route path="/taiw/*" element={
            <ErrorBoundary moduleName="TAIW">
              <Suspense fallback={<PageSkeleton />}>
                <TaiwRoutes />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* COE routes — separate layout */}
          <Route path="/coe/*" element={
            <ErrorBoundary moduleName="COE">
              <Suspense fallback={<PageSkeleton />}>
                <CoeRoutes />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* HAIW routes — separate layout */}
          <Route path="/haiw/*" element={
            <ErrorBoundary moduleName="HAIW">
              <Suspense fallback={<PageSkeleton />}>
                <HaiwRoutes />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* ALM routes — separate layout */}
          <Route path="/alm/*" element={
            <ErrorBoundary moduleName="ALM">
              <Suspense fallback={<PageSkeleton />}>
                <AlmRoutes />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* BAIW routes — existing layout */}
          <Route path="*" element={
            <Layout>
              <ErrorBoundary moduleName="BAIW">
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/model" element={<ModelExplorer />} />
                    <Route path="/capabilities" element={<CapabilityNavigator />} />
                    <Route path="/graph" element={<DependencyGraph />} />
                    <Route path="/maturity" element={<MaturityAssessment />} />
                    <Route path="/profitability" element={<ProfitabilityEngine />} />
                    <Route path="/customer-profitability" element={<CustomerProfitability />} />
                    <Route path="/customer-profitability-workbench" element={<CustomerProfitabilityWorkbench />} />
                    <Route path="/customer-value" element={<CustomerValue />} />
                    <Route path="/corporate-value" element={<CorporateValue />} />
                    <Route path="/customer-comparison" element={<CustomerComparison />} />
                    <Route path="/what-if" element={<WhatIfLab />} />
                    <Route path="/portfolio" element={<PortfolioRollup />} />
                    <Route path="/deck" element={<UseCaseDeck />} />
                    <Route path="/roadmap" element={<RoadmapBuilder />} />
                    <Route path="/pakistan" element={<PakistanReference />} />
                    <Route path="/cash-optimization" element={<CashOptimizationEngine />} />
                    <Route path="/architecture" element={<ArchitectureCockpit />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Layout>
          } />
        </Routes>
      </AssessmentProvider>
    </BrowserRouter>
  )
}

export default App
