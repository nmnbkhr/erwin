import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import DgiwLayout from './DgiwLayout'
import { LayerProvider } from './LayerContext'
import PageSkeleton from '../components/layout/PageSkeleton'

const PracticeOverview = lazy(() => import('./components/PracticeOverview'))
const Diagnostic = lazy(() => import('./components/Diagnostic'))
const ServiceLadder = lazy(() => import('./components/ServiceLadder'))
const OperatingModel = lazy(() => import('./components/OperatingModel'))
const CdeRegister = lazy(() => import('./components/CdeRegister'))
const DqRuleLibrary = lazy(() => import('./components/DqRuleLibrary'))
const ProgramSetup = lazy(() => import('./components/ProgramSetup'))
const ImplementationPlan = lazy(() => import('./components/ImplementationPlan'))
const OnePager = lazy(() => import('./components/OnePager'))

export default function DgiwRoutes() {
  return (
    <LayerProvider>
      <DgiwLayout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<PracticeOverview />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/ladder" element={<ServiceLadder />} />
            <Route path="/operating-model" element={<OperatingModel />} />
            <Route path="/cde" element={<CdeRegister />} />
            <Route path="/rules" element={<DqRuleLibrary />} />
            <Route path="/program" element={<ProgramSetup />} />
            <Route path="/plan" element={<ImplementationPlan />} />
            <Route path="/one-pager" element={<OnePager />} />
          </Routes>
        </Suspense>
      </DgiwLayout>
    </LayerProvider>
  )
}
