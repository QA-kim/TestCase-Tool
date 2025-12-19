import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus, X, Bug, Lightbulb, ListTodo, Filter, Search,
  ChevronDown, FileText, User, Calendar, Edit2,
  LayoutList, LayoutGrid, Clock, AlertCircle
} from 'lucide-react'
import { issuesApi, Issue, IssueStatus, IssuePriority, IssueType } from '../services/issues'
import api from '../lib/axios'

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bgColor: string }> = {
  todo: { label: 'To Do', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_review: { label: 'In Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  done: { label: 'Done', color: 'text-green-700', bgColor: 'bg-green-100' },
}

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; bgColor: string }> = {
  low: { label: '낮음', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: '중간', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: '높음', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { label: '긴급', color: 'text-red-600', bgColor: 'bg-red-100' },
}

const TYPE_CONFIG: Record<IssueType, { label: string; icon: any; color: string }> = {
  bug: { label: '버그', icon: Bug, color: 'text-red-600' },
  improvement: { label: '개선', icon: Lightbulb, color: 'text-yellow-600' },
  task: { label: '작업', icon: ListTodo, color: 'text-blue-600' },
}

type ViewMode = 'list' | 'kanban'

export default function IssueTracker() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'all'>('all')
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterTestrun, setFilterTestrun] = useState<string>('all')

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as IssuePriority,
    issue_type: 'bug' as IssueType,
    testcase_id: '',
    selected_testrun_id: '',
    assigned_to: '',
  })

  // Fetch data
  const { data: issues, isLoading } = useQuery('all-issues', () => issuesApi.list())
  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })
  const { data: testruns } = useQuery('testruns', async () => {
    const response = await api.get('/testruns/')
    return response.data
  })
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users/')
    return response.data
  })

  // Create mutation
  const createMutation = useMutation(
    (data: any) => {
      const testrun = testruns?.find((tr: any) => tr.id === data.selected_testrun_id)
      if (!testrun) throw new Error('테스트 실행을 선택해주세요')

      return issuesApi.create({
        title: data.title,
        description: data.description,
        priority: data.priority,
        issue_type: data.issue_type,
        testcase_id: data.testcase_id,
        project_id: testrun.project_id,
        testrun_id: data.selected_testrun_id,
        assigned_to: data.assigned_to || undefined,
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('all-issues')
        handleCloseCreateModal()
      },
    }
  )

  // Update mutation
  const updateMutation = useMutation(
    (data: { id: string; updates: Partial<Issue> }) => issuesApi.update(data.id, data.updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('all-issues')
        handleCloseEditModal()
      },
    }
  )

  // Update status mutation (for kanban drag-drop)
  const updateStatusMutation = useMutation(
    ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      issuesApi.updateStatus(issueId, status),
    {
      onSuccess: () => queryClient.invalidateQueries('all-issues'),
    }
  )

  // Filter issues
  const filteredIssues = issues?.filter((issue) => {
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false
    if (filterPriority !== 'all' && issue.priority !== filterPriority) return false
    if (filterType !== 'all' && issue.issue_type !== filterType) return false
    if (filterProject !== 'all' && issue.project_id !== filterProject) return false
    if (filterTestrun !== 'all' && issue.testrun_id !== filterTestrun) return false
    return true
  }) || []

  // Handlers
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      issue_type: 'bug',
      testcase_id: '',
      selected_testrun_id: '',
      assigned_to: '',
    })
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedIssue(null)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssue) return

    updateMutation.mutate({
      id: selectedIssue.id,
      updates: {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        issue_type: formData.issue_type,
        assigned_to: formData.assigned_to || undefined,
      },
    })
  }

  const handleEditClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setFormData({
      title: issue.title,
      description: issue.description || '',
      priority: issue.priority,
      issue_type: issue.issue_type,
      testcase_id: issue.testcase_id || '',
      selected_testrun_id: issue.testrun_id || '',
      assigned_to: issue.assigned_to || '',
    })
    setEditModalOpen(true)
  }

  const handleDragStart = (issue: Issue) => {
    setDraggedIssue(issue)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: IssueStatus) => {
    if (draggedIssue && draggedIssue.status !== status) {
      updateStatusMutation.mutate({ issueId: draggedIssue.id, status })
    }
    setDraggedIssue(null)
  }

  const getIssuesByStatus = (status: IssueStatus) => {
    return filteredIssues.filter((issue) => issue.status === status)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">이슈 트래커</h1>
            <p className="text-sm text-gray-500 mt-1">
              전체 {filteredIssues.length}개의 이슈 {issues && filteredIssues.length !== issues.length && `(${issues.length}개 중)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                리스트
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                칸반
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              새 이슈
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이슈 검색..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as IssueStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">모든 상태</option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as IssuePriority | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">모든 우선순위</option>
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as IssueType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">모든 유형</option>
            {Object.entries(TYPE_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">모든 프로젝트</option>
            {projects?.map((project: any) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          {/* Testrun Filter */}
          <select
            value={filterTestrun}
            onChange={(e) => setFilterTestrun(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">모든 테스트 실행</option>
            {testruns?.map((testrun: any) => (
              <option key={testrun.id} value={testrun.id}>{testrun.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : viewMode === 'list' ? (
          <ListView issues={filteredIssues} onEditClick={handleEditClick} />
        ) : (
          <KanbanView
            issues={filteredIssues}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditClick={handleEditClick}
          />
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <IssueFormModal
          title="새 이슈 생성"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateSubmit}
          onClose={handleCloseCreateModal}
          isLoading={createMutation.isLoading}
          testruns={testruns}
          users={users}
          mode="create"
        />
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedIssue && (
        <IssueFormModal
          title="이슈 수정"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditSubmit}
          onClose={handleCloseEditModal}
          isLoading={updateMutation.isLoading}
          testruns={testruns}
          users={users}
          mode="edit"
        />
      )}
    </div>
  )
}

// List View Component
function ListView({ issues, onEditClick }: { issues: Issue[]; onEditClick: (issue: Issue) => void }) {
  const navigate = useNavigate()
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users/')
    return response.data
  })

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이슈
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>이슈가 없습니다</p>
                </td>
              </tr>
            ) : (
              issues.map((issue) => {
                const TypeIcon = TYPE_CONFIG[issue.issue_type].icon
                const assignedUser = users?.find((u: any) => u.id === issue.assigned_to)

                return (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="flex items-start gap-3 text-left hover:text-blue-600 transition-colors"
                      >
                        <TypeIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${TYPE_CONFIG[issue.issue_type].color}`} />
                        <div>
                          <div className="font-medium text-gray-900">{issue.title}</div>
                          {issue.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {issue.description}
                            </div>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[issue.status].bgColor} ${STATUS_CONFIG[issue.status].color}`}>
                        {STATUS_CONFIG[issue.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[issue.priority].bgColor} ${PRIORITY_CONFIG[issue.priority].color}`}>
                        {PRIORITY_CONFIG[issue.priority].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {assignedUser.full_name[0]}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{assignedUser.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">미할당</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(issue.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onEditClick(issue)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Kanban View Component
function KanbanView({
  issues,
  onDragStart,
  onDragOver,
  onDrop,
  onEditClick,
}: {
  issues: Issue[]
  onDragStart: (issue: Issue) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (status: IssueStatus) => void
  onEditClick: (issue: Issue) => void
}) {
  const getIssuesByStatus = (status: IssueStatus) => {
    return issues.filter((issue) => issue.status === status)
  }

  return (
    <div className="p-6 h-full">
      <div className="flex gap-4 h-full overflow-x-auto">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const columnIssues = getIssuesByStatus(status as IssueStatus)
          return (
            <div
              key={status}
              className="w-80 flex-shrink-0 flex flex-col"
              onDragOver={onDragOver}
              onDrop={() => onDrop(status as IssueStatus)}
            >
              {/* Column Header */}
              <div className={`${config.bgColor} rounded-t-lg px-4 py-3 border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
                  <span className="text-sm text-gray-600 bg-white px-2 py-0.5 rounded">
                    {columnIssues.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-white rounded-b-lg p-4 space-y-3 overflow-y-auto border border-t-0 border-gray-200">
                {columnIssues.map((issue) => (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    onDragStart={() => onDragStart(issue)}
                    onEditClick={() => onEditClick(issue)}
                  />
                ))}
                {columnIssues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-sm">이슈 없음</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Kanban Card Component
function KanbanCard({
  issue,
  onDragStart,
  onEditClick,
}: {
  issue: Issue
  onDragStart: () => void
  onEditClick: () => void
}) {
  const TypeIcon = TYPE_CONFIG[issue.issue_type].icon
  const { data: assignedUser } = useQuery(
    ['user', issue.assigned_to],
    async () => {
      if (!issue.assigned_to) return null
      const response = await api.get(`/users/${issue.assigned_to}`)
      return response.data
    },
    { enabled: !!issue.assigned_to }
  )

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1 ${TYPE_CONFIG[issue.issue_type].color}`}>
          <TypeIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{TYPE_CONFIG[issue.issue_type].label}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditClick()
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{issue.title}</h4>

      {issue.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{issue.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${PRIORITY_CONFIG[issue.priority].bgColor} ${PRIORITY_CONFIG[issue.priority].color}`}>
          {PRIORITY_CONFIG[issue.priority].label}
        </span>

        {assignedUser && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-700">
                {assignedUser.full_name[0]}
              </span>
            </div>
            <span className="text-xs text-gray-600">{assignedUser.full_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Issue Form Modal Component
function IssueFormModal({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isLoading,
  testruns,
  users,
  mode,
}: {
  title: string
  formData: any
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  isLoading: boolean
  testruns: any[]
  users: any[]
  mode: 'create' | 'edit'
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  테스트 실행 *
                </label>
                <select
                  required
                  value={formData.selected_testrun_id}
                  onChange={(e) => setFormData({ ...formData, selected_testrun_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">테스트 실행을 선택하세요</option>
                  {testruns?.map((testrun: any) => (
                    <option key={testrun.id} value={testrun.id}>
                      {testrun.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="이슈 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="이슈 설명을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우선순위 *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => setFormData({ ...formData, issue_type: e.target.value as IssueType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">담당자 선택 (선택사항)</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (mode === 'create' ? '생성 중...' : '수정 중...') : (mode === 'create' ? '생성' : '수정')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
