import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit2, Trash2, X, Folder, Search, Filter, MoreVertical } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import ResizablePanel from '../components/ResizablePanel'

export default function Projects() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  const { data: testcases } = useQuery('testcases', async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  // Count test cases per project
  const getTestCaseCount = (projectId: string) => {
    if (!testcases) return 0
    return testcases.filter((tc: any) => tc.project_id === projectId).length
  }

  // Get daily test case trend for a project (last 7 days)
  const getTestCaseTrend = (projectId: string) => {
    if (!testcases) return []

    const projectTestCases = testcases.filter((tc: any) => tc.project_id === projectId)
    const days = 7
    const trend = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = projectTestCases.filter((tc: any) => {
        const createdAt = new Date(tc.created_at)
        return createdAt >= date && createdAt < nextDate
      }).length

      trend.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        count
      })
    }

    return trend
  }

  const createMutation = useMutation(
    (data: any) => api.post('/projects/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects')
        handleClose()
      },
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => api.put(`/projects/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects')
        handleClose()
      },
    }
  )

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/projects/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects')
        setSelectedProject(null)
      },
    }
  )

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({ name: '', description: '' })
  }

  const handleEdit = (project: any) => {
    setEditMode(true)
    setEditId(project.id)
    setFormData({ name: project.name, description: project.description || '' })
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

  const filteredProjects = projects?.filter((project: any) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ marginRight: selectedProject ? '0' : '0' }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">프로젝트</h1>
              <p className="text-sm text-gray-500 mt-1">전체 {filteredProjects?.length || 0}개의 프로젝트</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : filteredProjects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Folder className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">프로젝트가 없습니다</p>
              <p className="text-gray-400 text-sm mt-2">새 프로젝트를 생성하여 시작하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects?.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`bg-white border rounded-lg p-5 cursor-pointer transition-all hover:shadow-md ${
                    selectedProject?.id === project.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Folder className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">{project.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(project.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="relative group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(project)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3 h-3" />
                            수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(project.id)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {project.description || '설명이 없습니다.'}
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">테스트 케이스:</span>
                    <span className="text-sm font-semibold text-blue-600">{getTestCaseCount(project.id)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Project Details */}
      {selectedProject && (
        <ResizablePanel
          defaultWidth={384}
          minWidth={320}
          maxWidth={600}
          side="right"
          className="bg-white border-l border-gray-200 flex flex-col fixed right-0 top-16 bottom-0 shadow-lg"
        >
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  생성일: {new Date(selectedProject.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">설명</h3>
                <p className="text-sm text-gray-600">
                  {selectedProject.description || '설명이 없습니다.'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">프로젝트 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">테스트 케이스</span>
                    <span className="text-gray-900 font-semibold">
                      {getTestCaseCount(selectedProject.id)}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">생성일</span>
                    <span className="text-gray-900">
                      {new Date(selectedProject.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">수정일</span>
                    <span className="text-gray-900">
                      {new Date(selectedProject.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">테스트 케이스 추이 (최근 7일)</h3>
                <div className="space-y-2">
                  {getTestCaseTrend(selectedProject.id).map((item, index) => {
                    const maxCount = Math.max(...getTestCaseTrend(selectedProject.id).map(d => d.count), 1)
                    const barWidth = (item.count / maxCount) * 100

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 text-right">{item.date}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300 flex items-center justify-end pr-2"
                            style={{ width: `${barWidth}%` }}
                          >
                            {item.count > 0 && (
                              <span className="text-xs text-white font-medium">{item.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Actions */}
          {isAdmin && (
            <div className="border-t border-gray-200 p-4 flex gap-2">
              <button
                onClick={() => handleEdit(selectedProject)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={() => handleDelete(selectedProject.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </ResizablePanel>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editMode ? '프로젝트 수정' : '새 프로젝트'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 이름 *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="프로젝트 이름을 입력하세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      설명
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="프로젝트 설명을 입력하세요"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editMode ? '수정' : '생성'}
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
