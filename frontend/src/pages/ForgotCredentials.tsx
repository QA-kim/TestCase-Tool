import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowLeft, KeyRound, User } from 'lucide-react'
import api from '../lib/axios'

type TabType = 'username' | 'password'

export default function ForgotCredentials() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('username')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'email' | 'token' | 'result'>('email')
  const [foundUsername, setFoundUsername] = useState('')
  const [tokenSent, setTokenSent] = useState(false)

  const handleFindUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post('/auth/find-username', { email })
      setFoundUsername(response.data.username)
      setSuccess(`아이디를 찾았습니다: ${response.data.username}`)
      setStep('result')
    } catch (err: any) {
      setError(err.response?.data?.detail || '아이디를 찾을 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post('/auth/reset-password-request', { email })
      setSuccess('재설정 코드가 생성되었습니다. 아래에 입력해주세요.')
      setTokenSent(true)
      setResetToken(response.data.token) // Auto-fill for testing (remove in production)
      setStep('token')
    } catch (err: any) {
      setError(err.response?.data?.detail || '비밀번호 재설정 요청에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/auth/reset-password', {
        token: resetToken,
        new_password: newPassword
      })
      setSuccess('비밀번호가 성공적으로 재설정되었습니다')
      setStep('result')
    } catch (err: any) {
      setError(err.response?.data?.detail || '비밀번호 재설정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setStep('email')
    setFoundUsername('')
    setTokenSent(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TMS</h1>
            <p className="text-gray-600">계정 정보 찾기</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setActiveTab('username')
                resetForm()
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'username'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              아이디 찾기
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

          {/* Username Tab */}
          {activeTab === 'username' && (
            <div>
              {step === 'email' && (
                <form onSubmit={handleFindUsername} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="등록된 이메일을 입력하세요"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? '처리 중...' : '아이디 찾기'}
                  </button>
                </form>
              )}

              {step === 'result' && success && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <p className="font-medium mb-2">아이디를 찾았습니다</p>
                    <p className="text-2xl font-bold">{foundUsername}</p>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    로그인 하러 가기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              {step === 'email' && (
                <form onSubmit={handleRequestResetToken} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="등록된 이메일을 입력하세요"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? '처리 중...' : '재설정 코드 받기'}
                  </button>
                </form>
              )}

              {step === 'token' && tokenSent && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                      {success}
                      <p className="mt-2 text-xs text-gray-600">
                        (테스트 모드: 코드가 자동으로 입력되었습니다)
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      재설정 코드 (6자리)
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="최소 8자 이상"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? '처리 중...' : '비밀번호 재설정'}
                  </button>
                </form>
              )}

              {step === 'result' && success && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <p className="font-medium">{success}</p>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    로그인 하러 가기
                  </button>
                </div>
              )}
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
