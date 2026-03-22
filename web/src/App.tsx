import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import { FullScreenLoader } from './components/full-screen-loader'
import { ProtectedRoute, PublicOnlyRoute } from './components/route-guards'
import { AuthProvider } from './contexts/auth-context'
import { useAuth } from './hooks/use-auth'
import { ConfigPage } from './pages/config-page'
import { DashboardPage } from './pages/dashboard-page'
import { FinancePage } from './pages/finance-page'
import { InvestmentsPage } from './pages/investments-page'
import { LoginPage } from './pages/login-page'
import { ProjectsPage } from './pages/projects-page'
import { TimerPage } from './pages/timer-page'

function AppRoutes() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <FullScreenLoader label="A validar sessão..." />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projetos" element={<ProjectsPage />} />
        <Route path="/financas" element={<FinancePage />} />
        <Route path="/investimentos" element={<InvestmentsPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
