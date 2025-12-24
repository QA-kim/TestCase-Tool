import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, X, Bug, Lightbulb, ListTodo, AlertCircle, Circle, FileText, Upload, Paperclip, Edit3, Save } from 'lucide-react'
import { issuesApi, Issue, IssueStatus, IssuePriority, IssueType, uploadAttachment } from '../services/issues'
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
  const testrunId = searchParams.get('testrunId')
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
    selected_testrun_id: '',
    assigned_to: '',
  })
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)
  const [resolvingIssue, setResolvingIssue] = useState<Issue | null>(null)
  const [resolution, setResolution] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Fetch issues
  const { data: issues, isLoading } = useQuery(
    ['issues', testrunId],
    () => issuesApi.list(undefined, testrunId || undefined)
  )

  // Fetch test runs
  const { data: testruns } = useQuery('testruns', async () => {
    const response = await api.get('/testruns/')
    return response.data
  })

  // Fetch users for assignee selection
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users/')
    return response.data
  })

  // Create mutation
  const createMutation = useMutation(
    async (data: any) => {
      // Get project_id from selected testrun
      const selectedTestrunId = data.selected_testrun_id
      const testrun = testruns?.find((tr: any) => tr.id === selectedTestrunId)

      if (!testrun) {
        throw new Error('테스트 실행을 선택해주세요')
      }

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
        testrun_id: selectedTestrunId,
        assigned_to: data.assigned_to || undefined,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issues', testrunId])
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
        queryClient.invalidateQueries(['issues', testrunId])
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
      // Done 상태로 변경 시 해결 방법 입력 모달 표시
      if (status === 'done') {
        setResolvingIssue(draggedIssue)
        setResolutionModalOpen(true)
        setDraggedIssue(null)
      } else {
        updateStatusMutation.mutate({ issueId: draggedIssue.id, status })
        setDraggedIssue(null)
      }
    } else {
      setDraggedIssue(null)
    }
  }

  const handleResolveIssue = () => {
    if (!resolvingIssue) return

    issuesApi.update(resolvingIssue.id, {
      status: 'done',
      resolution: resolution.trim() || undefined
    }).then(() => {
      queryClient.invalidateQueries(['issues', testrunId])
      setResolutionModalOpen(false)
      setResolvingIssue(null)
      setResolution('')
    })
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            새 이슈
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">테스트 실행:</label>
            <select
              value={testrunId || ''}
              onChange={(e) => {
                const params = new URLSearchParams()
                if (e.target.value) params.set('testrunId', e.target.value)
                navigate(`/issues${params.toString() ? `?${params.toString()}` : ''}`)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">전체 테스트 실행</option>
              {testruns?.map((testrun: any) => (
                <option key={testrun.id} value={testrun.id}>
                  {testrun.name}
                </option>
              ))}
            </select>
          </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
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

                {/* File Attachments */}
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
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 text-gray-600">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">이미지 파일 선택</span>
                      </div>
                    </label>

                    {attachments.length > 0 && (
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
                              onClick={() => handleRemoveAttachment(index)}
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
                  disabled={createMutation.isLoading || uploadingFiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploadingFiles ? '파일 업로드 중...' : createMutation.isLoading ? '생성 중...' : '생성'}
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

      {/* Resolution Modal */}
      {resolutionModalOpen && resolvingIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">이슈 해결</h2>
              <button
                onClick={() => {
                  setResolutionModalOpen(false)
                  setResolvingIssue(null)
                  setResolution('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">{resolvingIssue.title}</h3>
                <p className="text-sm text-gray-500">이 이슈를 완료 상태로 변경합니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  해결 방법 (선택사항)
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="이슈를 어떻게 해결했는지 설명해주세요..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setResolutionModalOpen(false)
                  setResolvingIssue(null)
                  setResolution('')
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleResolveIssue}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                완료로 표시
              </button>
            </div>
          </div>
        </div>
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

  // Fetch creator details
  const { data: creator } = useQuery(
    ['user', issue.created_by],
    async () => {
      const response = await api.get(`/users/${issue.created_by}`)
      return response.data
    },
    { enabled: !!issue.created_by }
  )

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
      <h4 className="font-medium text-gray-900 mb-3 line-clamp-2">{issue.title}</h4>

      {/* Metadata */}
      <div className="space-y-1 text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <span className="font-medium">작성자:</span>
          <span>{creator?.full_name || '로딩 중...'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">생성일:</span>
          <span>{new Date(issue.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">수정일:</span>
          <span>{new Date(issue.updated_at).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      {/* Footer */}
      {issue.testcase_id && (
        <div className="text-xs text-blue-600 flex items-center gap-1 pt-2 border-t border-gray-100">
          <FileText className="w-3 h-3" />
          <span>테스트 케이스 연결됨</span>
        </div>
      )}
    </div>
  )
}

// Issue Detail Modal Component
function IssueDetailModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: issue.title,
    description: issue.description || '',
    priority: issue.priority,
    issue_type: issue.issue_type,
    assigned_to: issue.assigned_to || '',
  })
  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

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

  // Fetch users for assignee selection
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users/')
    return response.data
  })

  // Update mutation
  const updateMutation = useMutation(
    async (data: any) => {
      // Upload new attachments if any
      let newAttachmentUrls: string[] = []
      if (newAttachments.length > 0) {
        setUploadingFiles(true)
        try {
          newAttachmentUrls = await Promise.all(
            newAttachments.map(file => uploadAttachment(file))
          )
        } finally {
          setUploadingFiles(false)
        }
      }

      // Merge existing and new attachments
      const allAttachments = [
        ...(issue.attachments || []),
        ...newAttachmentUrls
      ]

      return issuesApi.update(issue.id, {
        ...data,
        attachments: allAttachments.length > 0 ? allAttachments : undefined
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issues'])
        setIsEditing(false)
        setNewAttachments([])
        alert('이슈가 수정되었습니다!')
      },
    }
  )

  const handleSave = () => {
    updateMutation.mutate(editFormData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditFormData({
      title: issue.title,
      description: issue.description || '',
      priority: issue.priority,
      issue_type: issue.issue_type,
      assigned_to: issue.assigned_to || '',
    })
    setNewAttachments([])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? '이슈 수정' : '이슈 상세'}
          </h2>
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
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            ) : (
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{issue.title}</h3>
            )}
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
              {isEditing ? (
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as IssuePriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                  <option value="critical">긴급</option>
                </select>
              ) : (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-md ${priorityConfig.bgColor}`}>
                  <span className={`text-sm font-medium ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">유형</label>
              {isEditing ? (
                <select
                  value={editFormData.issue_type}
                  onChange={(e) => setEditFormData({ ...editFormData, issue_type: e.target.value as IssueType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                  <span className={`text-sm font-medium ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
            {isEditing ? (
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="이슈 설명을 입력하세요"
              />
            ) : issue.description ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {issue.description}
                </pre>
              </div>
            ) : (
              <div className="text-sm text-gray-500">설명 없음</div>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
            {isEditing ? (
              <select
                value={editFormData.assigned_to}
                onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">담당자 선택 (선택사항)</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            ) : issue.assigned_to && assignee ? (
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
              <div className="text-sm text-gray-500">담당자 없음</div>
            )}
          </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>

            {/* Existing Attachments */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {issue.attachments.map((url, index) => {
                  // Skip old backend relative URLs that no longer work
                  const isOldBackendUrl = url.startsWith('/api/v1/issues/attachments/')
                  if (isOldBackendUrl) {
                    return (
                      <div
                        key={index}
                        className="relative rounded-lg border border-gray-300 bg-gray-50 p-4 flex items-center justify-center"
                      >
                        <div className="text-center text-gray-500">
                          <p className="text-sm">이전 첨부파일</p>
                          <p className="text-xs mt-1">(더 이상 사용할 수 없음)</p>
                        </div>
                      </div>
                    )
                  }

                  return (
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
                  )
                })}
              </div>
            )}

            {/* New Attachments Section (when editing) */}
            {isEditing && (
              <div className="space-y-2">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files)
                        setNewAttachments(prev => [...prev, ...files])
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">새 이미지 파일 추가</span>
                  </div>
                </label>

                {newAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">추가할 파일:</p>
                    {newAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-md border border-blue-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 transition-colors ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isEditing && (!issue.attachments || issue.attachments.length === 0) && (
              <div className="text-sm text-gray-500">첨부파일 없음</div>
            )}
          </div>

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
              {creator ? (
                <span className="ml-2 text-gray-900 text-sm font-medium">{creator.full_name}</span>
              ) : (
                <span className="ml-2 text-gray-500 text-sm">로딩 중...</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              수정
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isLoading || uploadingFiles}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {uploadingFiles ? '파일 업로드 중...' : updateMutation.isLoading ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
