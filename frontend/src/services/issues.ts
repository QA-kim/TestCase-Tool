import api from '../lib/axios'

export type IssueStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
export type IssueType = 'bug' | 'improvement' | 'task'

export interface Issue {
  id: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  issue_type: IssueType
  project_id: string
  testcase_id?: string
  testrun_id?: string
  assigned_to?: string
  resolution?: string
  attachments?: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface IssueCreate {
  title: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  issue_type?: IssueType
  project_id: string
  testcase_id?: string
  testrun_id?: string
  assigned_to?: string
  resolution?: string
  attachments?: string[]
}

export interface IssueUpdate {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  issue_type?: IssueType
  testcase_id?: string
  testrun_id?: string
  assigned_to?: string
  resolution?: string
  attachments?: string[]
}

// Upload file to backend (Supabase Storage)
export const uploadAttachment = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/issues/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  // Backend now returns full Supabase Storage public URL
  // No need to convert - use directly
  return response.data.url
}

export const issuesApi = {
  // Get all issues
  list: async (projectId?: string, testrunId?: string, statusFilter?: IssueStatus, assignedTo?: string): Promise<Issue[]> => {
    const params: any = {}
    if (projectId) params.project_id = projectId
    if (testrunId) params.testrun_id = testrunId
    if (statusFilter) params.status_filter = statusFilter
    if (assignedTo) params.assigned_to = assignedTo
    const response = await api.get('/issues', { params })
    return response.data
  },

  // Get a specific issue
  get: async (issueId: string): Promise<Issue> => {
    const response = await api.get(`/issues/${issueId}`)
    return response.data
  },

  // Create a new issue
  create: async (issue: IssueCreate): Promise<Issue> => {
    const response = await api.post('/issues', issue)
    return response.data
  },

  // Update an issue
  update: async (issueId: string, issue: IssueUpdate): Promise<Issue> => {
    const response = await api.put(`/issues/${issueId}`, issue)
    return response.data
  },

  // Update issue status (for kanban drag and drop)
  updateStatus: async (issueId: string, status: IssueStatus): Promise<Issue> => {
    const response = await api.patch(`/issues/${issueId}/status?status=${status}`)
    return response.data
  },

  // Delete an issue
  delete: async (issueId: string): Promise<void> => {
    await api.delete(`/issues/${issueId}`)
  }
}
