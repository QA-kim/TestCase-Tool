import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Shield, Calendar, Edit2, Save, X } from 'lucide-react'
import ChangePasswordModal from '../components/ChangePasswordModal'

export default function MyAccount() {
  const { user } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'viewer',
  })

  const isAdmin = user?.role === 'admin'

  const handleSave = () => {
    // TODO: API 호출하여 사용자 정보 업데이트
    console.log('Saving user data:', formData)
    setEditMode(false)
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      role: user?.role || 'viewer',
    })
    setEditMode(false)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '관리자',
      qa_manager: 'QA 매니저',
      qa_engineer: 'QA 엔지니어',
      developer: '개발자',
      viewer: '뷰어',
    }
    return labels[role] || role
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 계정</h1>
          <p className="text-gray-600">계정 정보를 확인하고 관리하세요</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span className="font-medium">정보 수정</span>
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-24"></div>
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            <div className="w-24 h-24 bg-gray-600 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || user?.username}</h2>
              <p className="text-gray-600">@{user?.username}</p>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                {getRoleLabel(user?.role || 'viewer')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h3>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              이름
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="이름을 입력하세요"
              />
            ) : (
              <p className="text-gray-900 px-3 py-2">{user?.full_name || '-'}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              이메일
            </label>
            <p className="text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1 ml-3">이메일은 변경할 수 없습니다</p>
          </div>

          {/* Username (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              사용자명
            </label>
            <p className="text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">{user?.username}</p>
            <p className="text-xs text-gray-500 mt-1 ml-3">사용자명은 변경할 수 없습니다</p>
          </div>

          {/* Role (Admin can edit) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4" />
              역할
            </label>
            {editMode && isAdmin ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="admin">관리자</option>
                <option value="qa_manager">QA 매니저</option>
                <option value="qa_engineer">QA 엔지니어</option>
                <option value="developer">개발자</option>
                <option value="viewer">뷰어</option>
              </select>
            ) : (
              <>
                <p className="text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">
                  {getRoleLabel(user?.role || 'viewer')}
                </p>
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-1 ml-3">역할은 관리자만 변경할 수 있습니다</p>
                )}
              </>
            )}
          </div>

          {/* Created At */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              가입일
            </label>
            <p className="text-gray-900 px-3 py-2">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : '-'}
            </p>
          </div>
        </div>

        {/* Edit Mode Buttons */}
        {editMode && (
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              취소
            </button>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">보안</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">비밀번호</p>
              <p className="text-sm text-gray-600">비밀번호를 변경하여 계정을 안전하게 보호하세요</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isMandatory={false}
      />
    </div>
  )
}
