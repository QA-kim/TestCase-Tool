import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus, X, Bug, Lightbulb, ListTodo, Filter, Search,
  ChevronDown, FileText, User, Calendar, Edit2,
  LayoutList, LayoutGrid, Clock, AlertCircle, Upload, Paperclip,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { issuesApi, Issue, IssueStatus, IssuePriority, IssueType, uploadAttachment } from '../services/issues'
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
  const [searchParams, setSearchParams] = useSearchParams()

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'all'>('all')
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterTestrun, setFilterTestrun] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
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
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Fetch data
  const { data: issues, isLoading } = useQuery('all-issues', () => issuesApi.list())
  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects')
    return response.data
  })
  const { data: testruns } = useQuery('testruns', async () => {
    const response = await api.get('/testruns')
    return response.data
  })
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users')
    return response.data
  })

  // Handle deep link from email notification
  useEffect(() => {
    const detailId = searchParams.get('detail')
    if (detailId && issues && !isLoading) {
      const issue = issues.find((i: Issue) => i.id === detailId)
      if (issue) {
        setSelectedIssue(issue)
        setDetailModalOpen(true)
        // Clear the query param after opening the modal
        setSearchParams({})
      }
    }
  }, [searchParams, issues, isLoading, setSearchParams])

  // Create mutation
  const createMutation = useMutation(
    async (data: any) => {
      const testrun = testruns?.find((tr: any) => tr.id === data.selected_testrun_id)
      if (!testrun) throw new Error('테스트 실행을 선택해주세요')

      // Upload attachments if any
      let attachmentUrls: string[] = []
      if (attachments.length > 0) {
        setUploadingFiles(true)
        try {
          attachmentUrls = await Promise.all(
            attachments.map(file => uploadAttachment(file))
          )
        } finally {
          setUploadingFiles(false)
        }
      }

      return issuesApi.create({
        title: data.title,
        description: data.description,
        priority: data.priority,
        issue_type: data.issue_type,
        testcase_id: data.testcase_id,
        project_id: testrun.project_id,
        testrun_id: data.selected_testrun_id,
        assigned_to: data.assigned_to || undefined,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
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

  // Filter and sort issues
  const filteredIssues = (issues?.filter((issue) => {
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false
    if (filterPriority !== 'all' && issue.priority !== filterPriority) return false
    if (filterType !== 'all' && issue.issue_type !== filterType) return false
    if (filterProject !== 'all' && issue.project_id !== filterProject) return false
    if (filterTestrun !== 'all' && issue.testrun_id !== filterTestrun) return false
    return true
  }) || []).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

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
    setAttachments([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
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

            {/* Sort Button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              title={sortOrder === 'desc' ? '생성일자 내림차순' : '생성일자 오름차순'}
            >
              {sortOrder === 'desc' ? (
                <>
                  <ArrowDown className="w-4 h-4" />
                  최신순
                </>
              ) : (
                <>
                  <ArrowUp className="w-4 h-4" />
                  오래된순
                </>
              )}
            </button>

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
          <ListView
            issues={filteredIssues}
            onEditClick={handleEditClick}
            onIssueClick={(issue) => {
              setSelectedIssue(issue)
              setDetailModalOpen(true)
            }}
            onStatusChange={(issueId, status) => {
              updateStatusMutation.mutate({ issueId, status })
            }}
          />
        ) : (
          <KanbanView
            issues={filteredIssues}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditClick={handleEditClick}
            onIssueClick={(issue) => {
              setSelectedIssue(issue)
              setDetailModalOpen(true)
            }}
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
          uploadingFiles={uploadingFiles}
          attachments={attachments}
          onFileChange={handleFileChange}
          onRemoveAttachment={handleRemoveAttachment}
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

      {/* Detail Modal */}
      {detailModalOpen && selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedIssue(null)
          }}
        />
      )}
    </div>
  )
}

// List View Component
function ListView({
  issues,
  onEditClick,
  onIssueClick,
  onStatusChange
}: {
  issues: Issue[];
  onEditClick: (issue: Issue) => void;
  onIssueClick: (issue: Issue) => void;
  onStatusChange: (issueId: string, status: IssueStatus) => void;
}) {
  const navigate = useNavigate()
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users')
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                해결일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                        onClick={() => onIssueClick(issue)}
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
                      <select
                        value={issue.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as IssueStatus
                          if (newStatus !== issue.status) {
                            onStatusChange(issue.id, newStatus)
                          }
                        }}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0 ${STATUS_CONFIG[issue.status].bgColor} ${STATUS_CONFIG[issue.status].color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
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
                    <td className="px-6 py-4 text-sm">
                      {issue.resolved_at ? (
                        <span className="text-green-600 font-medium">
                          {new Date(issue.resolved_at).toLocaleDateString('ko-KR')}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">미해결</span>
                      )}
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
  onIssueClick,
}: {
  issues: Issue[]
  onDragStart: (issue: Issue) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (status: IssueStatus) => void
  onEditClick: (issue: Issue) => void
  onIssueClick: (issue: Issue) => void
}) {
  const getIssuesByStatus = (status: IssueStatus) => {
    return issues.filter((issue) => issue.status === status)
  }

  return (
    <div className="p-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const columnIssues = getIssuesByStatus(status as IssueStatus)
          return (
            <div
              key={status}
              className="flex flex-col"
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
                    onIssueClick={() => onIssueClick(issue)}
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
  onIssueClick,
}: {
  issue: Issue
  onDragStart: () => void
  onEditClick: () => void
  onIssueClick: () => void
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

  const isDragging = useRef(false)
  const dragStartTime = useRef(0)

  const handleDragStart = (e: React.DragEvent) => {
    isDragging.current = true
    dragStartTime.current = Date.now()
    onDragStart()
  }

  const handleDragEnd = () => {
    const dragDuration = Date.now() - dragStartTime.current
    
    // 드래그가 매우 짧은 경우(실수로 드래그 된 클릭) 클릭으로 처리
    if (dragDuration < 200) {
      onIssueClick()
    }
    
    // 드래그 종료 후 잠시동안 클릭 이벤트 차단
    setTimeout(() => {
      isDragging.current = false
    }, 100)
  }

  const handleClick = () => {
    // 드래그 중이거나 드래그 직후라면 클릭 무시
    if (isDragging.current) {
      return
    }
    onIssueClick()
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
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
  uploadingFiles,
  attachments,
  onFileChange,
  onRemoveAttachment,
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
  uploadingFiles?: boolean
  attachments?: File[]
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAttachment?: (index: number) => void
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

            {/* File Attachments - only for create mode */}
            {mode === 'create' && onFileChange && onRemoveAttachment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  첨부파일 (스크린샷)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 text-gray-600">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">이미지 파일 선택</span>
                    </div>
                  </label>

                  {attachments && attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-200"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveAttachment(index)}
                            className="text-red-500 hover:text-red-700 transition-colors ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              disabled={isLoading || uploadingFiles}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploadingFiles ? '파일 업로드 중...' : isLoading ? (mode === 'create' ? '생성 중...' : '수정 중...') : (mode === 'create' ? '생성' : '수정')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function IssueDetailModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const navigate = useNavigate()
  const TypeIcon = TYPE_CONFIG[issue.issue_type].icon
  const priorityConfig = PRIORITY_CONFIG[issue.priority]
  const typeConfig = TYPE_CONFIG[issue.issue_type]
  const statusConfig = STATUS_CONFIG[issue.status]

  // Fetch test case details if testcase_id exists
  const { data: testCase } = useQuery(
    ['testcase', issue.testcase_id],
    async () => {
      if (!issue.testcase_id) return null
      const response = await api.get(`/testcases/${issue.testcase_id}`)
      return response.data
    },
    { enabled: !!issue.testcase_id }
  )

  // Fetch creator details
  const { data: creator } = useQuery(
    ['user', issue.created_by],
    async () => {
      const response = await api.get(`/users/${issue.created_by}`)
      return response.data
    },
    { enabled: !!issue.created_by }
  )

  // Fetch assignee details
  const { data: assignee } = useQuery(
    ['user', issue.assigned_to],
    async () => {
      if (!issue.assigned_to) return null
      const response = await api.get(`/users/${issue.assigned_to}`)
      return response.data
    },
    { enabled: !!issue.assigned_to }
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">이슈 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{issue.title}</h3>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-md ${statusConfig?.color}`}>
                <span className="text-sm font-medium text-gray-900">{statusConfig?.label}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">우선순위</label>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-md ${priorityConfig.bgColor}`}>
                <span className={`text-sm font-medium ${priorityConfig.color}`}>
                  {priorityConfig.label}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">유형</label>
              <div className="flex items-center gap-2">
                <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                <span className={`text-sm font-medium ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {issue.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {issue.description}
                </pre>
              </div>
            </div>
          )}

          {/* Assigned To */}
          {issue.assigned_to && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
              {assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {assignee.full_name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{assignee.full_name}</div>
                    <div className="text-xs text-gray-500">{assignee.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">로딩 중...</div>
              )}
            </div>
          )}

          {/* Test Case Link */}
          {issue.testcase_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연결된 테스트 케이스</label>
              {testCase ? (
                <button
                  onClick={() => navigate(`/testcases/${issue.testcase_id}`)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{testCase.title}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>로딩 중...</span>
                </div>
              )}
            </div>
          )}

          {/* Resolution */}
          {issue.resolution && issue.status === 'done' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">해결 방법</label>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {issue.resolution}
                </pre>
              </div>
            </div>
          )}

          {/* Attachments */}
          {issue.attachments && issue.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>
              <div className="grid grid-cols-2 gap-3">
                {issue.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        크게 보기
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">생성일:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(issue.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">수정일:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(issue.updated_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">해결일:</span>
                <span className="ml-2 text-gray-900">
                  {issue.resolved_at ? (
                    <span className="text-green-700 font-semibold">
                      {new Date(issue.resolved_at).toLocaleString('ko-KR')}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">미해결</span>
                  )}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 text-sm">작성자:</span>
              {creator ? (
                <span className="ml-2 text-gray-900 text-sm font-medium">{creator.full_name}</span>
              ) : (
                <span className="ml-2 text-gray-500 text-sm">로딩 중...</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
