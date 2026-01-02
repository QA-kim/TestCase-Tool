import { useState } from 'react'
import { Shield, Mail, Info, User, Bell, Moon, Sun, Save, Key, Database, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'system'>('profile')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [issueNotifications, setIssueNotifications] = useState(true)
  const [testRunNotifications, setTestRunNotifications] = useState(true)

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [language, setLanguage] = useState('ko')

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  })

  const handleSaveNotifications = () => {
    // TODO: Save notification settings to backend
    alert('알림 설정이 저장되었습니다.')
  }

  const handleSaveAppearance = () => {
    // TODO: Save appearance settings to backend
    alert('화면 설정이 저장되었습니다.')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">사용자 설정 및 시스템 정보</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            프로필
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            알림
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            화면
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Info className="w-4 h-4" />
            시스템
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">프로필 정보</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.role === 'admin' ? '관리자' : '뷰어'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">역할 변경은 관리자에게 문의하세요</p>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => alert('프로필 변경 기능은 "내 계정" 페이지에서 이용하세요')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  프로필 저장
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">보안</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">비밀번호 변경 및 보안 설정은 "내 계정" 페이지에서 관리할 수 있습니다.</p>
              <button
                onClick={() => window.location.href = '/account'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                내 계정으로 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">이메일 알림</p>
                <p className="text-sm text-gray-500">중요한 업데이트를 이메일로 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">이슈 알림</p>
                <p className="text-sm text-gray-500">이슈가 할당되거나 업데이트될 때 알림을 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={issueNotifications}
                  onChange={(e) => setIssueNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">테스트 실행 알림</p>
                <p className="text-sm text-gray-500">테스트 실행이 완료되면 알림을 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={testRunNotifications}
                  onChange={(e) => setTestRunNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={handleSaveNotifications}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                알림 설정 저장
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>참고:</strong> 이메일 알림 기능은 현재 개발 중입니다. 설정은 저장되지만 실제 알림은 발송되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sun className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">화면 설정</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">테마</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className="w-6 h-6 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">라이트</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className="w-6 h-6 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">다크</span>
                </button>
                <button
                  onClick={() => setTheme('auto')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                    theme === 'auto'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-1">
                    <Sun className="w-3 h-6 text-gray-700" />
                    <Moon className="w-3 h-6 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">자동</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">시스템 설정에 따라 자동으로 테마가 변경됩니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">언어 변경 기능은 현재 개발 중입니다</p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={handleSaveAppearance}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                화면 설정 저장
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>참고:</strong> 다크 모드 및 다국어 기능은 현재 개발 중입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">시스템 정보</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">애플리케이션 버전</p>
                  <p className="font-medium text-gray-900">1.0.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">마지막 업데이트</p>
                  <p className="font-medium text-gray-900">2026-01-02</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">브라우저</p>
                  <p className="font-medium text-gray-900 text-sm break-words">
                    {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                     navigator.userAgent.includes('Firefox') ? 'Firefox' :
                     navigator.userAgent.includes('Safari') ? 'Safari' :
                     navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">플랫폼</p>
                  <p className="font-medium text-gray-900">{navigator.platform}</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">서버 정보</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">백엔드 API</p>
                <p className="font-medium text-gray-900 text-sm break-all">https://testcase-tool.onrender.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">프론트엔드</p>
                <p className="font-medium text-gray-900 text-sm break-all">https://testcase-e27a4.web.app</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">데이터베이스</p>
                <p className="font-medium text-gray-900">Supabase (PostgreSQL)</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">도움이 필요하신가요?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  문제가 발생하거나 문의사항이 있으시면 언제든지 연락주세요.
                </p>
                <a
                  href="mailto:hli.kimdaeng@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  문의하기
                </a>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">추가 정보</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 계정 정보 변경은 "내 계정" 페이지에서 할 수 있습니다</p>
              <p>• 비밀번호 변경은 "내 계정" 페이지의 "보안" 섹션을 이용하세요</p>
              <p>• 역할 변경은 관리자만 가능합니다</p>
              <p>• 프로젝트 및 테스트 케이스 관리는 각 메뉴에서 할 수 있습니다</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
