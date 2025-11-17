import { useState } from 'react'
import {
  Bell,
  Globe,
  Moon,
  Monitor,
  Save,
  Palette,
  Languages,
  Clock,
  Database,
  Shield,
  Mail
} from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    // 알림 설정
    emailNotifications: true,
    pushNotifications: false,
    testRunNotifications: true,
    projectUpdates: true,

    // 테마 설정
    theme: 'light', // light, dark, auto

    // 언어 설정
    language: 'ko', // ko, en

    // 표시 설정
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY-MM-DD',

    // 대시보드 설정
    defaultView: 'dashboard',
    itemsPerPage: 20,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: API 호출하여 설정 저장
    console.log('Saving settings:', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">애플리케이션 환경을 설정하세요</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="font-medium">저장</span>
        </button>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Save className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-900">설정이 저장되었습니다</p>
            <p className="text-sm text-green-700">변경사항이 적용되었습니다</p>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">이메일 알림</p>
              <p className="text-sm text-gray-600">중요한 업데이트를 이메일로 받습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">푸시 알림</p>
              <p className="text-sm text-gray-600">브라우저 푸시 알림을 받습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">테스트 실행 알림</p>
              <p className="text-sm text-gray-600">테스트 실행 완료 시 알림을 받습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.testRunNotifications}
                onChange={(e) => setSettings({ ...settings, testRunNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">프로젝트 업데이트</p>
              <p className="text-sm text-gray-600">프로젝트 변경사항 알림을 받습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.projectUpdates}
                onChange={(e) => setSettings({ ...settings, projectUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">외관</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Moon className="w-4 h-4" />
              테마
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  settings.theme === 'light'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Monitor className="w-6 h-6 text-gray-700" />
                <span className="text-sm font-medium">라이트</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  settings.theme === 'dark'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className="w-6 h-6 text-gray-700" />
                <span className="text-sm font-medium">다크</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'auto' })}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  settings.theme === 'auto'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className="w-6 h-6 text-gray-700" />
                <span className="text-sm font-medium">자동</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Languages className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">언어 및 지역</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4" />
              언어
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              시간대
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="Asia/Seoul">서울 (UTC+9)</option>
              <option value="UTC">UTC (UTC+0)</option>
              <option value="America/New_York">뉴욕 (UTC-5)</option>
              <option value="Europe/London">런던 (UTC+0)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              날짜 형식
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="YYYY-MM-DD">2025-11-14</option>
              <option value="MM/DD/YYYY">11/14/2025</option>
              <option value="DD/MM/YYYY">14/11/2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">대시보드 설정</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Monitor className="w-4 h-4" />
              기본 화면
            </label>
            <select
              value={settings.defaultView}
              onChange={(e) => setSettings({ ...settings, defaultView: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="dashboard">대시보드</option>
              <option value="projects">프로젝트</option>
              <option value="testcases">테스트 케이스</option>
              <option value="testruns">테스트 실행</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Database className="w-4 h-4" />
              페이지당 항목 수
            </label>
            <select
              value={settings.itemsPerPage}
              onChange={(e) => setSettings({ ...settings, itemsPerPage: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">시스템 정보</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">버전</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-600">마지막 업데이트</p>
            <p className="font-medium text-gray-900">2025-11-14</p>
          </div>
          <div>
            <p className="text-gray-600">브라우저</p>
            <p className="font-medium text-gray-900">{navigator.userAgent.split(' ').pop()}</p>
          </div>
          <div>
            <p className="text-gray-600">플랫폼</p>
            <p className="font-medium text-gray-900">{navigator.platform}</p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">도움이 필요하신가요?</h3>
            <p className="text-sm text-gray-600 mb-3">
              문제가 발생하거나 문의사항이 있으시면 언제든지 연락주세요.
            </p>
            <a
              href="mailto:support@tcms.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              문의하기
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
