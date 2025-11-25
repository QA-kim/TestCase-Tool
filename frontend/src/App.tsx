import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotCredentials from './pages/ForgotCredentials'
import DashboardEnhanced from './pages/DashboardEnhanced'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TestCases from './pages/TestCases'
import TestCaseDetail from './pages/TestCaseDetail'
import TestRuns from './pages/TestRuns'
import TestRunDetail from './pages/TestRunDetail'
import MyAccount from './pages/MyAccount'
import Settings from './pages/Settings'
import ErrorModal from './components/ErrorModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  const [permissionError, setPermissionError] = useState<string>('')
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  useEffect(() => {
    // Listen for permission errors from axios interceptor
    const handlePermissionError = (event: Event) => {
      const customEvent = event as CustomEvent
      setPermissionError(customEvent.detail.message)
      setShowPermissionModal(true)
    }

    window.addEventListener('permissionError', handlePermissionError)

    return () => {
      window.removeEventListener('permissionError', handlePermissionError)
    }
  }, [])

  const closePermissionModal = () => {
    setShowPermissionModal(false)
    setPermissionError('')
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotCredentials />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardEnhanced />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="testcases" element={<TestCases />} />
            <Route path="testcases/:id" element={<TestCaseDetail />} />
            <Route path="testruns" element={<TestRuns />} />
            <Route path="testruns/:id" element={<TestRunDetail />} />
            <Route path="account" element={<MyAccount />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>

        {/* Global Permission Error Modal */}
        <ErrorModal
          isOpen={showPermissionModal}
          onClose={closePermissionModal}
          title="권한 없음"
          message={permissionError}
        />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
