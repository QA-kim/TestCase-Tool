import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Home,
  FolderOpen,
  FileText,
  Play,
  LogOut,
  Plus,
  User,
  Settings,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout: authLogout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <span className="font-bold text-gray-900 text-lg">TestRail</span>
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find(item => isActive(item.path))?.text || 'TestRail'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Button - Only for Admin */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setAddMenuOpen(!addMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">추가</span>
                </button>

              {/* Add Dropdown */}
              {addMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAddMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        navigate('/projects')
                        setAddMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FolderOpen className="w-4 h-4" />
                      새 프로젝트
                    </button>
                    <button
                      onClick={() => {
                        navigate('/testcases')
                        setAddMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4" />
                      새 테스트 케이스
                    </button>
                    <button
                      onClick={() => {
                        navigate('/testruns')
                        setAddMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Play className="w-4 h-4" />
                      새 테스트 실행
                    </button>
                  </div>
                </>
              )}
              </div>
            )}

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
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      내 계정
                    </button>
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      설정
                    </button>
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
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
