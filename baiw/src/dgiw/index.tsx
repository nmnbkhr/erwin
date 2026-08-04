import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import DgiwLayout from './DgiwLayout'
import { LayerProvider } from './LayerContext'
import PageSkeleton from '../components/layout/PageSkeleton'

const PracticeOverview = lazy(() => import('./components/PracticeOverview'))
const ProgramDesign = lazy(() => import('./components/ProgramDesign'))
const Diagnostic = lazy(() => import('./components/Diagnostic'))
const GapRegister = lazy(() => import('./components/GapRegister'))
const Trajectory = lazy(() => import('./components/Trajectory'))
const ServiceLadder = lazy(() => import('./components/ServiceLadder'))
const OperatingModel = lazy(() => import('./components/OperatingModel'))
const CdeRegister = lazy(() => import('./components/CdeRegister'))
const DqRuleLibrary = lazy(() => import('./components/DqRuleLibrary'))
const ProgramSetup = lazy(() => import('./components/ProgramSetup'))
const ImplementationPlan = lazy(() => import('./components/ImplementationPlan'))
const OnePager = lazy(() => import('./components/OnePager'))
const Deliverables = lazy(() => import('./components/Deliverables'))
const Frameworks = lazy(() => import('./components/Frameworks'))

export default function DgiwRoutes() {
  return (
    <LayerProvider>
      <DgiwLayout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<PracticeOverview />} />
            <Route path="/design" element={<ProgramDesign />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/gaps" element={<GapRegister />} />
            <Route path="/trajectory" element={<Trajectory />} />
            <Route path="/ladder" element={<ServiceLadder />} />
            <Route path="/operating-model" element={<OperatingModel />} />
            <Route path="/cde" element={<CdeRegister />} />
            <Route path="/rules" element={<DqRuleLibrary />} />
            <Route path="/program" element={<ProgramSetup />} />
            <Route path="/plan" element={<ImplementationPlan />} />
            <Route path="/one-pager" element={<OnePager />} />
            <Route path="/deliverables" element={<Deliverables />} />
            <Route path="/frameworks" element={<Frameworks />} />
          </Routes>
        </Suspense>
      </DgiwLayout>
    </LayerProvider>
  )
}
