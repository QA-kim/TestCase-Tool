import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

export default function TestRuns() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const _isAdmin = user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planned',
    environment: '',
    milestone: '',
    project_id: 1,
    testcase_ids: [] as number[],
  })
  const queryClient = useQueryClient()

  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  const { data: testcases } = useQuery('testcases', async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  const { data: testruns, isLoading } = useQuery('testruns', async () => {
    const response = await api.get('/testruns/')
    return response.data
  })

  const createMutation = useMutation(
    (data: any) => api.post('/testruns/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testruns')
        handleClose()
      },
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => api.put(`/testruns/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testruns')
        handleClose()
      },
    }
  )

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/testruns/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testruns')
      },
    }
  )

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({
      name: '',
      description: '',
      status: 'planned',
      environment: '',
      milestone: '',
      project_id: projects?.[0]?.id || 1,
      testcase_ids: [],
    })
  }

  const handleEdit = (testrun: any) => {
    setEditMode(true)
    setEditId(testrun.id)
    setFormData({
      name: testrun.name,
      description: testrun.description || '',
      status: testrun.status,
      environment: testrun.environment || '',
      milestone: testrun.milestone || '',
      project_id: testrun.project_id,
      testcase_ids: testrun.testcase_ids || [],
    })
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editMode && editId) {
      updateMutation.mutate({ id: editId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: '계획됨',
      in_progress: '진행 중',
      completed: '완료됨',
      cancelled: '취소됨',
    }
    return labels[status] || status
  }

  // Filter test cases by selected project
  const filteredTestCases = useMemo(() => {
    if (!testcases) return []
    return testcases.filter((tc: any) => tc.project_id === formData.project_id)
  }, [testcases, formData.project_id])

  // Toggle test case selection
  const handleTestCaseToggle = (testcaseId: number) => {
    setFormData(prev => ({
      ...prev,
      testcase_ids: prev.testcase_ids.includes(testcaseId)
        ? prev.testcase_ids.filter(id => id !== testcaseId)
        : [...prev.testcase_ids, testcaseId]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테스트 실행</h1>
          <p className="text-gray-600">전체 {testruns?.length || 0}개의 테스트 실행</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">새 테스트 실행</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  테스트 케이스
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  환경
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  마일스톤
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : testruns?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    테스트 실행이 없습니다.
                  </td>
                </tr>
              ) : (
                testruns?.map((testrun: any) => (
                  <tr
                    key={testrun.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/testruns/${testrun.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{testrun.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(testrun.status)}`}>
                        {getStatusLabel(testrun.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {testrun.testcases?.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            {testrun.testcases.length}개
                          </span>
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            {testrun.testcases.slice(0, 2).map((tc: any) => tc.title).join(', ')}
                            {testrun.testcases.length > 2 && ` 외 ${testrun.testcases.length - 2}개`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {testrun.environment || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {testrun.milestone || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(testrun.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(testrun)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(testrun.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editMode ? '테스트 실행 수정' : '새 테스트 실행'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      테스트 실행 이름 *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="테스트 실행 이름을 입력하세요"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      설명
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="테스트 실행 설명을 입력하세요"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      상태 *
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="planned">계획됨</option>
                      <option value="in_progress">진행 중</option>
                      <option value="completed">완료됨</option>
                      <option value="cancelled">취소됨</option>
                    </select>
                  </div>

                  {/* Environment and Milestone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Environment */}
                    <div>
                      <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
                        환경
                      </label>
                      <input
                        id="environment"
                        type="text"
                        value={formData.environment}
                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="예: Production, Staging"
                      />
                    </div>

                    {/* Milestone */}
                    <div>
                      <label htmlFor="milestone" className="block text-sm font-medium text-gray-700 mb-2">
                        마일스톤
                      </label>
                      <input
                        id="milestone"
                        type="text"
                        value={formData.milestone}
                        onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="예: v1.0.0, Sprint 5"
                      />
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 *
                    </label>
                    <select
                      id="project_id"
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value), testcase_ids: [] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    >
                      {projects?.length === 0 ? (
                        <option value="">프로젝트가 없습니다</option>
                      ) : (
                        projects?.map((project: any) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Test Cases */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      테스트 케이스 선택
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                      {filteredTestCases.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          선택한 프로젝트에 테스트 케이스가 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredTestCases.map((testcase: any) => (
                            <label
                              key={testcase.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.testcase_ids.includes(testcase.id)}
                                onChange={() => handleTestCaseToggle(testcase.id)}
                                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {testcase.title}
                                </p>
                                {testcase.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {testcase.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.testcase_ids.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        {formData.testcase_ids.length}개의 테스트 케이스가 선택되었습니다
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isLoading || updateMutation.isLoading
                      ? '처리 중...'
                      : editMode
                      ? '수정'
                      : '생성'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
