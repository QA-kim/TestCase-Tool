import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Shield, Calendar, Edit2, Save, X, Users, Trash2, Bell } from 'lucide-react'
import ChangePasswordModal from '../components/ChangePasswordModal'
import api from '../lib/axios'

interface UserData {
  id: string
  email: string
  username: string
  full_name?: string
  role: string
  created_at?: string
  is_temp_password?: boolean
}

interface NotificationSettings {
  email_notifications: boolean
  notify_issue_assigned: boolean
  notify_issue_updated: boolean
  notify_testrun_completed: boolean
  notify_testrun_assigned: boolean
}

export default function MyAccount() {
  const { user } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'viewer',
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    notify_issue_assigned: true,
    notify_issue_updated: true,
    notify_testrun_completed: true,
    notify_testrun_assigned: true,
  })
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Admin user management
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingUserRole, setEditingUserRole] = useState<string>('')

  const isAdmin = user?.role === 'admin'

  // Fetch notification settings
  useEffect(() => {
    if (user?.id) {
      fetchNotificationSettings()
    }
  }, [user?.id])

  // Fetch all users if admin
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
    }
  }, [isAdmin])

  const fetchNotificationSettings = async () => {
    try {
      setLoadingNotifications(true)
      const response = await api.get(`/users/${user?.id}/notifications`)
      setNotificationSettings(response.data)
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true)
      await api.put(`/users/${user?.id}/notifications`, notificationSettings)
      alert('알림 설정이 저장되었습니다')
    } catch (error: any) {
      console.error('Failed to save notification settings:', error)
      alert(error.response?.data?.detail || '알림 설정 저장에 실패했습니다')
    } finally {
      setSavingNotifications(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.get('/auth/users')
      setAllUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

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

  const handleEditUserRole = (userId: string, currentRole: string) => {
    setEditingUserId(userId)
    setEditingUserRole(currentRole)
  }

  const handleSaveUserRole = async (userId: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: editingUserRole })
      // Refresh user list
      await fetchAllUsers()
      setEditingUserId(null)
      setEditingUserRole('')
    } catch (error: any) {
      console.error('Failed to update user role:', error)
      alert(error.response?.data?.detail || '역할 변경에 실패했습니다')
    }
  }

  const handleCancelEditUserRole = () => {
    setEditingUserId(null)
    setEditingUserRole('')
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === user?.id.toString()) {
      alert('자신의 계정은 삭제할 수 없습니다')
      return
    }

    if (!window.confirm(`정말로 "${userEmail}" 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      // Refresh user list
      await fetchAllUsers()
      alert('계정이 삭제되었습니다')
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.detail || '계정 삭제에 실패했습니다')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '관리자',
      viewer: '뷰어',
    }
    return labels[role] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[role] || colors.viewer
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? '사용자 관리' : '내 계정'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? '모든 사용자 계정을 관리하세요' : '계정 정보를 확인하고 관리하세요'}
          </p>
        </div>
        {!editMode && !isAdmin && user?.role !== 'viewer' && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span className="font-medium">정보 수정</span>
          </button>
        )}
      </div>

      {/* My Profile Card (Always show for everyone) */}
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role || 'viewer')}`}>
                {getRoleLabel(user?.role || 'viewer')}
              </span>
            </div>
          </div>
        </div>
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

      {/* Notification Settings Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
        </div>

        {loadingNotifications ? (
          <div className="py-8 text-center text-gray-500">
            로딩 중...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Master notification toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">이메일 알림</p>
                <p className="text-sm text-gray-600">모든 이메일 알림을 활성화/비활성화합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.email_notifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    email_notifications: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Individual notification preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">이슈 할당 알림</p>
                  <p className="text-sm text-gray-600">이슈가 나에게 할당되었을 때 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_issue_assigned}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      notify_issue_assigned: e.target.checked
                    })}
                    disabled={!notificationSettings.email_notifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">이슈 업데이트 알림</p>
                  <p className="text-sm text-gray-600">할당된 이슈가 업데이트되었을 때 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_issue_updated}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      notify_issue_updated: e.target.checked
                    })}
                    disabled={!notificationSettings.email_notifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">테스트 실행 완료 알림</p>
                  <p className="text-sm text-gray-600">테스트 실행이 완료되었을 때 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_testrun_completed}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      notify_testrun_completed: e.target.checked
                    })}
                    disabled={!notificationSettings.email_notifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">테스트 실행 할당 알림</p>
                  <p className="text-sm text-gray-600">테스트 실행이 나에게 할당되었을 때 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_testrun_assigned}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      notify_testrun_assigned: e.target.checked
                    })}
                    disabled={!notificationSettings.email_notifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNotifications ? '저장 중...' : '알림 설정 저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin: User Management Section */}
      {isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900">사용자 목록</h3>
              <span className="text-sm text-gray-500">({allUsers.length}명)</span>
            </div>
          </div>

          {loadingUsers ? (
            <div className="px-6 py-12 text-center text-gray-500">
              로딩 중...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이메일</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">역할</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">가입일</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                            {userData.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{userData.full_name || userData.username}</p>
                            <p className="text-sm text-gray-500">@{userData.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{userData.email}</td>
                      <td className="px-6 py-4">
                        {editingUserId === userData.id ? (
                          <select
                            value={editingUserRole}
                            onChange={(e) => setEditingUserRole(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          >
                            <option value="admin">관리자</option>
                            <option value="viewer">뷰어</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userData.role)}`}>
                            {getRoleLabel(userData.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {userData.created_at ? new Date(userData.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {editingUserId === userData.id ? (
                            <>
                              <button
                                onClick={() => handleSaveUserRole(userData.id)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="저장"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditUserRole}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="취소"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUserRole(userData.id, userData.role)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={userData.id === user?.id.toString()}
                                title="역할 수정"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(userData.id, userData.email)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={userData.id === user?.id.toString()}
                                title={userData.id === user?.id.toString() ? "자신의 계정은 삭제할 수 없습니다" : "계정 삭제"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isMandatory={false}
      />
    </div>
  )
}
