import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import CoeLayout from './CoeLayout'
import PageSkeleton from '../components/layout/PageSkeleton'

const CoeDashboard = lazy(() => import('./components/CoeDashboard'))
const UseCaseExplorer = lazy(() => import('./components/UseCaseExplorer'))
const GameTheoryMap = lazy(() => import('./components/GameTheoryMap'))
const RevenueEngine = lazy(() => import('./components/RevenueEngine'))
const SystemArchitecture = lazy(() => import('./components/SystemArchitecture'))
const ImplementationRoadmap = lazy(() => import('./components/ImplementationRoadmap'))
const DataModelCoverage = lazy(() => import('./components/DataModelCoverage'))

export default function CoeRoutes() {
  return (
    <CoeLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<CoeDashboard />} />
          <Route path="/usecases" element={<UseCaseExplorer />} />
          <Route path="/gametheory" element={<GameTheoryMap />} />
          <Route path="/revenue" element={<RevenueEngine />} />
          <Route path="/architecture" element={<SystemArchitecture />} />
          <Route path="/roadmap" element={<ImplementationRoadmap />} />
          <Route path="/data-coverage" element={<DataModelCoverage />} />
        </Routes>
      </Suspense>
    </CoeLayout>
  )
}
