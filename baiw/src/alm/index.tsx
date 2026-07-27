import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AlmLayout from './AlmLayout'
import PageSkeleton from '../components/layout/PageSkeleton'

const AlmDashboard = lazy(() => import('./components/AlmDashboard'))
const AlcoWorkbench = lazy(() => import('./components/AlcoWorkbench'))
const UseCaseExplorer = lazy(() => import('./components/UseCaseExplorer'))
const IrrbbAnalysis = lazy(() => import('./components/IrrbbAnalysis'))
const LiquidityAnalysis = lazy(() => import('./components/LiquidityAnalysis'))
const FtpDecomposition = lazy(() => import('./components/FtpDecomposition'))
const DataCoverage = lazy(() => import('./components/DataCoverage'))

export default function AlmRoutes() {
  return (
    <AlmLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<AlmDashboard />} />
          <Route path="/workbench" element={<AlcoWorkbench />} />
          <Route path="/usecases" element={<UseCaseExplorer />} />
          <Route path="/irrbb" element={<IrrbbAnalysis />} />
          <Route path="/liquidity" element={<LiquidityAnalysis />} />
          <Route path="/ftp" element={<FtpDecomposition />} />
          <Route path="/data-coverage" element={<DataCoverage />} />
        </Routes>
      </Suspense>
    </AlmLayout>
  )
}
