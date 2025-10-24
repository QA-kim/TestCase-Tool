import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotCredentials from './pages/ForgotCredentials'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TestCases from './pages/TestCases'
import TestCaseDetail from './pages/TestCaseDetail'
import TestRuns from './pages/TestRuns'
import TestRunDetail from './pages/TestRunDetail'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
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
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="testcases" element={<TestCases />} />
          <Route path="testcases/:id" element={<TestCaseDetail />} />
          <Route path="testruns" element={<TestRuns />} />
          <Route path="testruns/:id" element={<TestRunDetail />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
