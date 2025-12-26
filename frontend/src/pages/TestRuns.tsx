import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit2, Trash2, X, Search, Filter } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

export default function TestRuns() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const _isAdmin = user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planned',
    environment: '',
    milestone: '',
    project_id: '',
    test_case_ids: [] as string[],
  })

  // Advanced filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEnvironment, setFilterEnvironment] = useState('')
  const [showFilters, setShowFilters] = useState(false)

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
    ({ id, data }: { id: string; data: any }) => api.put(`/testruns/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testruns')
        handleClose()
      },
    }
  )

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/testruns/${id}`),
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
      project_id: projects?.[0]?.id || '',
      test_case_ids: [],
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
      test_case_ids: testrun.test_case_ids || [],
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

  const handleDelete = (id: string) => {
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

  // Advanced filtering for test runs list
  const filteredTestruns = useMemo(() => {
    if (!testruns) return []

    return testruns.filter((testrun: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = testrun.name?.toLowerCase().includes(query)
        const matchesDescription = testrun.description?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription) return false
      }

      // Project filter
      if (filterProject && testrun.project_id !== filterProject) return false

      // Status filter
      if (filterStatus && testrun.status !== filterStatus) return false

      // Environment filter
      if (filterEnvironment && testrun.environment !== filterEnvironment) return false

      return true
    })
  }, [testruns, searchQuery, filterProject, filterStatus, filterEnvironment])

  // Get unique environments for filter dropdown
  const environments = useMemo(() => {
    if (!testruns) return []
    const envSet = new Set(testruns.map((tr: any) => tr.environment).filter(Boolean))
    return Array.from(envSet) as string[]
  }, [testruns])


  // Toggle test case selection
  const handleTestCaseToggle = (testcaseId: string) => {
    setFormData(prev => ({
      ...prev,
      test_case_ids: prev.test_case_ids.includes(testcaseId)
        ? prev.test_case_ids.filter(id => id !== testcaseId)
        : [...prev.test_case_ids, testcaseId]
    }))
  }

  // Select all test cases
  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      test_case_ids: filteredTestCases.map((tc: any) => tc.id)
    }))
  }

  // Deselect all test cases
  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      test_case_ids: []
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테스트 실행</h1>
          <p className="text-gray-600">
            전체 {testruns?.length || 0}개 중 {filteredTestruns?.length || 0}개 표시
          </p>
        </div>
        <button
          onClick={() => {
            // Reset form and set first project as default
            setFormData({
              name: '',
              description: '',
              status: 'planned',
              environment: '',
              milestone: '',
              project_id: projects?.[0]?.id || '',
              test_case_ids: [],
            })
            setOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">새 테스트 실행</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="테스트 실행 이름 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">필터</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트
                </label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">전체 프로젝트</option>
                  {projects?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">전체 상태</option>
                  <option value="planned">계획됨</option>
                  <option value="in_progress">진행 중</option>
                  <option value="completed">완료됨</option>
                  <option value="cancelled">취소됨</option>
                </select>
              </div>

              {/* Environment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  환경
                </label>
                <select
                  value={filterEnvironment}
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">전체 환경</option>
                  {environments.map((env: string) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || filterProject || filterStatus || filterEnvironment) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterProject('')
                    setFilterStatus('')
                    setFilterEnvironment('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  모든 필터 초기화
                </button>
              </div>
            )}
          </div>
        )}
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
              ) : filteredTestruns?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {testruns?.length === 0
                      ? '테스트 실행이 없습니다.'
                      : '검색 결과가 없습니다. 필터를 조정해보세요.'}
                  </td>
                </tr>
              ) : (
                filteredTestruns?.map((testrun: any) => (
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
                      {testrun.test_case_ids?.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {testrun.test_case_ids.length}개
                          </span>
                          {testcases && (
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {testrun.test_case_ids
                                .slice(0, 2)
                                .map((tcId: string) => testcases.find((tc: any) => tc.id === tcId)?.title)
                                .filter(Boolean)
                                .join(', ')}
                              {testrun.test_case_ids.length > 2 && ` 외 ${testrun.test_case_ids.length - 2}개`}
                            </span>
                          )}
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
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
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
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="px-6 py-4 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        테스트 실행 이름 *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="테스트 실행 이름을 입력하세요"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        상태 *
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="planned">계획됨</option>
                        <option value="in_progress">진행 중</option>
                        <option value="completed">완료됨</option>
                        <option value="cancelled">취소됨</option>
                      </select>
                    </div>

                    {/* Project */}
                    <div>
                      <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                        프로젝트 *
                      </label>
                      <select
                        id="project_id"
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value, test_case_ids: [] })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        required
                      >
                        {!formData.project_id && (
                          <option value="">프로젝트를 선택하세요</option>
                        )}
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

                    {/* Environment */}
                    <div>
                      <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
                        환경
                      </label>
                      <input
                        id="environment"
                        type="text"
                        value={formData.environment}
                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="예: Production, Staging"
                      />
                    </div>

                    {/* Milestone */}
                    <div>
                      <label htmlFor="milestone" className="block text-sm font-medium text-gray-700 mb-1">
                        마일스톤
                      </label>
                      <input
                        id="milestone"
                        type="text"
                        value={formData.milestone}
                        onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="예: v1.0.0, Sprint 5"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                        placeholder="테스트 실행 설명을 입력하세요"
                      />
                    </div>
                  </div>

                  {/* Right Column - Test Cases */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        테스트 케이스 선택
                        {formData.test_case_ids.length > 0 && (
                          <span className="ml-2 text-sm text-primary-600 font-semibold">
                            ({formData.test_case_ids.length}개 선택됨)
                          </span>
                        )}
                      </label>
                      {filteredTestCases.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            전체 선택
                          </button>
                          <span className="text-gray-400">|</span>
                          <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                          >
                            선택 해제
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="border border-gray-300 rounded-lg p-3 h-[calc(100%-2.5rem)] overflow-y-auto bg-gray-50">
                      {filteredTestCases.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          선택한 프로젝트에 테스트 케이스가 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {filteredTestCases.map((testcase: any) => (
                            <label
                              key={testcase.id}
                              className="flex items-start gap-2 p-2 rounded hover:bg-white transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.test_case_ids.includes(testcase.id)}
                                onChange={() => handleTestCaseToggle(testcase.id)}
                                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {testcase.title}
                                </p>
                                {testcase.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {testcase.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
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
