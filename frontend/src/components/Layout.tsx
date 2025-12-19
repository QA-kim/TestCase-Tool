import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Home,
  FolderOpen,
  FileText,
  Play,
  BarChart3,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Shield,
  Kanban,
  ListChecks
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ChangePasswordModal from './ChangePasswordModal'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout: authLogout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // 화면 크기에 따라 sidebar 자동 조절
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user?.is_temp_password) {
      setShowPasswordModal(true)
    }
  }, [user])

  const handleLogout = () => {
    authLogout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  const menuItems = [
    { text: '대시보드', icon: Home, path: '/' },
    { text: '프로젝트', icon: FolderOpen, path: '/projects' },
    { text: '테스트 케이스', icon: FileText, path: '/testcases' },
    { text: '테스트 실행', icon: Play, path: '/testruns' },
    { text: '이슈 관리', icon: Kanban, path: '/issues' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
        md:relative fixed inset-y-0 left-0 z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <span className="font-bold text-gray-900 text-lg">TMS</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto">
              T
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <li key={item.text}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${
                        active
                          ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-500 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                    {sidebarOpen && <span className="text-sm">{item.text}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {sidebarOpen && <span className="text-sm">축소</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">
              {menuItems.find(item => isActive(item.path))?.text || 'TMS'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-medium">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {user?.role === 'admin' ? '관리자' : '뷰어'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      내 계정
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      설정
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isMandatory={user?.is_temp_password || false}
      />
    </div>
  )
}
