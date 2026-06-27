import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/app-layout'
import { ErrorBoundary } from './components/ui/error-boundary'
import { FullScreenLoader } from './components/ui/full-screen-loader'

const ConfigPage = lazy(() => import('./pages/config-page').then((m) => ({ default: m.ConfigPage })))
const DashboardPage = lazy(() => import('./pages/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const FinancePage = lazy(() => import('./pages/finance-page').then((m) => ({ default: m.FinancePage })))
const InvestmentsPage = lazy(() => import('./pages/investments-page').then((m) => ({ default: m.InvestmentsPage })))
const ProjectsPage = lazy(() => import('./pages/projects-page').then((m) => ({ default: m.ProjectsPage })))
const TimerPage = lazy(() => import('./pages/timer-page').then((m) => ({ default: m.TimerPage })))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader label="A carregar página..." />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard/*" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/projetos/*" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="/financas/*" element={<ErrorBoundary><FinancePage /></ErrorBoundary>} />
            <Route path="/investimentos/*" element={<ErrorBoundary><InvestmentsPage /></ErrorBoundary>} />
            <Route path="/timer/*" element={<ErrorBoundary><TimerPage /></ErrorBoundary>} />
            <Route path="/config" element={<ErrorBoundary><ConfigPage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate replace to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
