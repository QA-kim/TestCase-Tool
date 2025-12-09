import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, X, Bug, Lightbulb, ListTodo, AlertCircle, Circle, FileText } from 'lucide-react'
import { issuesApi, Issue, IssueStatus, IssuePriority, IssueType } from '../services/issues'
import api from '../lib/axios'

const STATUS_COLUMNS: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'in_review', label: 'In Review', color: 'bg-yellow-100' },
  { id: 'done', label: 'Done', color: 'bg-green-100' },
]

const PRIORITY_CONFIG = {
  low: { label: '낮음', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: '중간', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: '높음', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { label: '긴급', color: 'text-red-600', bgColor: 'bg-red-100' }, // 기존 이슈 호환성
}

const TYPE_CONFIG = {
  bug: { label: '버그', icon: Bug, color: 'text-red-600' },
  improvement: { label: '개선', icon: Lightbulb, color: 'text-yellow-600' },
  task: { label: '작업', icon: ListTodo, color: 'text-blue-600' },
}

export default function IssueBoard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('projectId')
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as IssuePriority,
    issue_type: 'bug' as IssueType,
    testcase_id: '',
  })

  // Fetch all projects
  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  // Fetch project details
  const { data: project } = useQuery(
    ['project', projectId],
    async () => {
      if (!projectId) return null
      const response = await api.get(`/projects/${projectId}`)
      return response.data
    },
    { enabled: !!projectId }
  )

  // Fetch issues (fetch all if no projectId)
  const { data: issues, isLoading } = useQuery(
    ['issues', projectId],
    () => issuesApi.list(projectId || undefined)
  )

  // Create mutation
  const createMutation = useMutation(
    (data: any) => issuesApi.create({ ...data, project_id: projectId! }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issues', projectId])
        handleClose()
      },
    }
  )

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      issuesApi.updateStatus(issueId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issues', projectId])
      },
    }
  )

  const handleClose = () => {
    setOpen(false)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      issue_type: 'bug',
      testcase_id: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
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
    return issues?.filter((issue) => issue.status === status) || []
  }

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setDetailModalOpen(true)
  }

  const handleDetailModalClose = () => {
    setDetailModalOpen(false)
    setSelectedIssue(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">이슈 보드</h1>
            <p className="text-sm text-gray-500 mt-1">
              전체 {issues?.length || 0}개의 이슈
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={!projectId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            새 이슈
          </button>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">프로젝트:</label>
          <select
            value={projectId || ''}
            onChange={(e) => {
              if (e.target.value) {
                navigate(`/issues?projectId=${e.target.value}`)
              } else {
                navigate('/issues')
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">전체 프로젝트</option>
            {projects?.map((proj: any) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gray-50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {STATUS_COLUMNS.map((column) => {
              const columnIssues = getIssuesByStatus(column.id)
              return (
                <div
                  key={column.id}
                  className="flex-1 min-w-[300px] flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {/* Column Header */}
                  <div className={`${column.color} rounded-t-lg px-4 py-3 border-b border-gray-200`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{column.label}</h3>
                      <span className="text-sm text-gray-600 bg-white px-2 py-0.5 rounded">
                        {columnIssues.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 bg-white rounded-b-lg p-4 space-y-3 overflow-y-auto border border-t-0 border-gray-200">
                    {columnIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onDragStart={() => handleDragStart(issue)}
                        onClick={() => handleIssueClick(issue)}
                      />
                    ))}
                    {columnIssues.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Circle className="w-12 h-12 mb-2" />
                        <p className="text-sm">이슈 없음</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">새 이슈 생성</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위 *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as IssuePriority })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="low">낮음</option>
                      <option value="medium">중간</option>
                      <option value="high">높음</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유형 *
                    </label>
                    <select
                      value={formData.issue_type}
                      onChange={(e) =>
                        setFormData({ ...formData, issue_type: e.target.value as IssueType })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isLoading ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {detailModalOpen && selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={handleDetailModalClose}
        />
      )}
    </div>
  )
}

// Issue Card Component
function IssueCard({
  issue,
  onDragStart,
  onClick
}: {
  issue: Issue
  onDragStart: () => void
  onClick: () => void
}) {
  const TypeIcon = TYPE_CONFIG[issue.issue_type].icon
  const priorityConfig = PRIORITY_CONFIG[issue.priority]
  const typeConfig = TYPE_CONFIG[issue.issue_type]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Type and Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1 ${typeConfig.color}`}>
          <TypeIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{typeConfig.label}</span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}
        >
          {priorityConfig.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{issue.title}</h4>

      {/* Description */}
      {issue.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>ID: {issue.id.slice(0, 8)}</span>
        {issue.testcase_id && <span>테스트 케이스 연결됨</span>}
      </div>
    </div>
  )
}

// Issue Detail Modal Component
function IssueDetailModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const TypeIcon = TYPE_CONFIG[issue.issue_type].icon
  const priorityConfig = PRIORITY_CONFIG[issue.priority]
  const typeConfig = TYPE_CONFIG[issue.issue_type]
  const statusConfig = STATUS_COLUMNS.find(col => col.id === issue.status)

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
          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">이슈 ID</label>
              <span className="text-sm text-gray-700 font-mono">{issue.id}</span>
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

          {/* Test Case Link */}
          {issue.testcase_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연결된 테스트 케이스</label>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                {testCase ? (
                  <span className="text-gray-900 font-medium">{testCase.title}</span>
                ) : (
                  <span className="text-gray-500">로딩 중...</span>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
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
            </div>
            <div className="mt-2">
              <span className="text-gray-500 text-sm">작성자:</span>
              <span className="ml-2 text-gray-900 text-sm font-mono">{issue.created_by}</span>
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
