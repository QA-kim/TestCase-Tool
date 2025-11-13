import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, User } from 'lucide-react'
import api from '../lib/axios'

type TabType = 'email' | 'password'

export default function ForgotCredentials() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('email')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [foundEmails, setFoundEmails] = useState<string[]>([])

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setFoundEmails([])

    try {
      const response = await api.post('/auth/find-email', { full_name: fullName })
      setFoundEmails(response.data.emails)
      setSuccess(`${response.data.count}개의 계정을 찾았습니다`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '계정을 찾을 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestTempPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post('/auth/reset-password-request', { email })
      setSuccess(response.data.message)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '비밀번호 재설정 요청에 실패했습니다'

      // Show specific error for email not found (404)
      if (err.response?.status === 404) {
        setError('해당 이메일로 등록된 계정을 찾을 수 없습니다.\n입력하신 이메일 주소를 다시 확인해주세요.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setError('')
    setSuccess('')
    setFoundEmails([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TMS</h1>
            <p className="text-gray-600">계정 찾기</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setActiveTab('email')
                resetForm()
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              이메일 찾기
            </button>
            <button
              onClick={() => {
                setActiveTab('password')
                resetForm()
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyRound className="w-4 h-4 inline mr-2" />
              비밀번호 찾기
            </button>
          </div>

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div>
              <form onSubmit={handleFindEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="등록 시 입력한 이름을 입력하세요"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && foundEmails.length > 0 && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <p className="font-medium mb-3">{success}</p>
                    <div className="space-y-2">
                      {foundEmails.map((email, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-green-300">
                          <p className="text-gray-900 font-mono text-sm">{email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? '처리 중...' : '이메일 찾기'}
                </button>

                {foundEmails.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    로그인 하러 가기
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <form onSubmit={handleRequestTempPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="등록된 이메일을 입력하세요"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <p className="font-medium">{success}</p>
                    <p className="text-sm mt-2">이메일을 확인해주세요.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? '처리 중...' : '임시 비밀번호 받기'}
                </button>

                {success && (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    로그인 하러 가기
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          © 2025 TMS. All rights reserved.
        </p>
      </div>
    </div>
  )
}
