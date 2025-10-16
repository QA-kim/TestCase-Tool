import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus, Edit2, Trash2, X, Search, ChevronDown, ChevronRight,
  Folder, FolderOpen, FileText, ArrowUp, ArrowDown, Circle, MoreVertical
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

export default function TestCases() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preconditions: '',
    steps: '',
    expected_result: '',
    priority: 'medium',
    test_type: 'functional',
    project_id: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  const { data: testcases, isLoading } = useQuery('testcases', async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  const createMutation = useMutation(
    (data: any) => api.post('/testcases/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        handleClose()
      },
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => api.put(`/testcases/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        handleClose()
        if (selectedTestCase?.id === editId) {
          const updatedTestCase = { ...selectedTestCase, ...formData }
          setSelectedTestCase(updatedTestCase)
        }
      },
    }
  )

  const deleteMutation = useMutation(
    (testcaseId: number) => api.delete(`/testcases/${testcaseId}`),
    {
      onSuccess: (_data, testcaseId) => {
        queryClient.invalidateQueries('testcases')
        if (selectedTestCase?.id === testcaseId) {
          setSelectedTestCase(null)
        }
      },
    }
  )

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({
      title: '',
      description: '',
      preconditions: '',
      steps: '',
      expected_result: '',
      priority: 'medium',
      test_type: 'functional',
      project_id: selectedProjectId || projects?.[0]?.id || 1,
    })
    setErrors({})
  }

  const handleEdit = (testcase: any) => {
    setEditMode(true)
    setEditId(testcase.id)
    setFormData({
      title: testcase.title,
      description: testcase.description || '',
      preconditions: testcase.preconditions || '',
      steps: testcase.steps || '',
      expected_result: testcase.expected_result || '',
      priority: testcase.priority,
      test_type: testcase.test_type,
      project_id: testcase.project_id,
    })
    setErrors({})
    setOpen(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요'
    }
    if (!formData.project_id) {
      newErrors.project_id = '프로젝트를 선택해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-blue-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <ArrowUp className="w-3 h-3" />
      case 'low':
        return <ArrowDown className="w-3 h-3" />
      default:
        return <Circle className="w-3 h-3 fill-current" />
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: '긴급',
      high: '높음',
      medium: '보통',
      low: '낮음',
    }
    return labels[priority] || priority
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      functional: '기능',
      regression: '회귀',
      smoke: '스모크',
      performance: '성능',
      security: '보안',
    }
    return labels[type] || type
  }

  const filteredTestCases = useMemo(() => {
    if (!testcases) return []
    return testcases.filter((testcase: any) => {
      const matchesProject = !selectedProjectId || testcase.project_id === selectedProjectId
      const matchesSearch = testcase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           testcase.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = priorityFilter === 'all' || testcase.priority === priorityFilter
      const matchesType = typeFilter === 'all' || testcase.test_type === typeFilter
      return matchesProject && matchesSearch && matchesPriority && matchesType
    })
  }, [testcases, selectedProjectId, searchQuery, priorityFilter, typeFilter])

  const selectedProject = useMemo(() => {
    return projects?.find((p: any) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Project Tree */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">프로젝트</h2>
        </div>

        {/* Project Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {projects?.map((project: any) => {
            const projectTestCases = testcases?.filter((tc: any) => tc.project_id === project.id) || []
            const isExpanded = expandedProjects.has(project.id)
            const isSelected = selectedProjectId === project.id

            return (
              <div key={project.id} className="mb-1">
                {/* Project Item */}
                <div
                  onClick={() => {
                    setSelectedProjectId(project.id)
                    toggleProject(project.id)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleProject(project.id)
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4" />
                  ) : (
                    <Folder className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium flex-1 truncate">{project.name}</span>
                  <span className="text-xs text-gray-500">{projectTestCases.length}</span>
                </div>

                {/* Test Cases under Project */}
                {isExpanded && projectTestCases.length > 0 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {projectTestCases.map((tc: any) => (
                      <div
                        key={tc.id}
                        onClick={() => setSelectedTestCase(tc)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                          selectedTestCase?.id === tc.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate flex-1">{tc.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content - Test Cases List */}
      <div className={`flex-1 flex flex-col ${selectedTestCase ? 'mr-96' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">테스트 케이스</h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProject ? (
                  <>
                    <span className="font-medium">{selectedProject.name}</span> - {filteredTestCases.length}개
                  </>
                ) : (
                  '프로젝트를 선택하세요'
                )}
              </p>
            </div>
            {isAdmin && selectedProjectId && (
              <button
                onClick={() => {
                  setFormData({ ...formData, project_id: selectedProjectId })
                  setOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                새 테스트 케이스
              </button>
            )}
          </div>

          {/* Search and Filters */}
          {selectedProjectId && (
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="테스트 케이스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <option value="all">전체 우선순위</option>
                <option value="critical">긴급</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <option value="all">전체 유형</option>
                <option value="functional">기능</option>
                <option value="regression">회귀</option>
                <option value="smoke">스모크</option>
                <option value="performance">성능</option>
                <option value="security">보안</option>
              </select>
            </div>
          )}
        </div>

        {/* Test Cases Table */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selectedProjectId ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">프로젝트를 선택하세요</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              로딩 중...
            </div>
          ) : filteredTestCases.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">테스트 케이스가 없습니다</p>
              </div>
            </div>
          ) : (
            <div className="bg-white">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      테스트 케이스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">
                      유형
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-20">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTestCases.map((testcase: any) => (
                    <tr
                      key={testcase.id}
                      onClick={() => setSelectedTestCase(testcase)}
                      className={`cursor-pointer transition-colors ${
                        selectedTestCase?.id === testcase.id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{testcase.title}</div>
                            {testcase.description && (
                              <div className="text-sm text-gray-500 truncate mt-0.5">
                                {testcase.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${getPriorityColor(testcase.priority)}`}>
                          {getPriorityIcon(testcase.priority)}
                          {getPriorityLabel(testcase.priority)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {getTypeLabel(testcase.test_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <div className="relative group inline-block">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => handleEdit(testcase)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3" />
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(testcase.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Test Case Details */}
      {selectedTestCase && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col fixed right-0 top-16 bottom-0 shadow-lg">
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedTestCase.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`flex items-center gap-1 text-sm font-medium ${getPriorityColor(selectedTestCase.priority)}`}>
                    {getPriorityIcon(selectedTestCase.priority)}
                    {getPriorityLabel(selectedTestCase.priority)}
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{getTypeLabel(selectedTestCase.test_type)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTestCase(null)}
                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {selectedTestCase.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">설명</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTestCase.description}</p>
                </div>
              )}

              {selectedTestCase.preconditions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">사전 조건</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTestCase.preconditions}</p>
                </div>
              )}

              {selectedTestCase.steps && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">테스트 단계</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTestCase.steps}</p>
                </div>
              )}

              {selectedTestCase.expected_result && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">예상 결과</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTestCase.expected_result}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">생성일</span>
                    <span className="text-gray-900">
                      {new Date(selectedTestCase.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">수정일</span>
                    <span className="text-gray-900">
                      {new Date(selectedTestCase.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Actions */}
          {isAdmin && (
            <div className="border-t border-gray-200 p-4 flex gap-2">
              <button
                onClick={() => handleEdit(selectedTestCase)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={() => handleDelete(selectedTestCase.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={handleClose} />
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editMode ? '테스트 케이스 수정' : '새 테스트 케이스'}
                </h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      제목 *
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      autoFocus
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="테스트 케이스 제목"
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">우선순위 *</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                        <option value="critical">긴급</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
                      <select
                        value={formData.test_type}
                        onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="functional">기능</option>
                        <option value="regression">회귀</option>
                        <option value="smoke">스모크</option>
                        <option value="performance">성능</option>
                        <option value="security">보안</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="테스트 케이스 설명"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사전 조건</label>
                    <textarea
                      rows={2}
                      value={formData.preconditions}
                      onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="테스트 실행 전 필요한 조건"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">테스트 단계</label>
                    <textarea
                      rows={3}
                      value={formData.steps}
                      onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="테스트 실행 단계"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">예상 결과</label>
                    <textarea
                      rows={2}
                      value={formData.expected_result}
                      onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="예상되는 결과"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isLoading || updateMutation.isLoading ? '처리 중...' : editMode ? '수정' : '생성'}
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
