import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Plus, Edit2, Trash2, X, Search, ChevronDown, ChevronRight,
  Folder, FolderOpen, FileText, ArrowUp, ArrowDown, Circle, MoreVertical,
  Download, Upload, AlertCircle, CheckCircle, FolderPlus, Move
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { foldersApi, Folder as FolderType } from '../services/folders'

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
    folder_id: undefined as string | undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<{success: boolean, imported_count: number, errors: string[]} | null>(null)
  const [showImportResult, setShowImportResult] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Folder states
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [openFolderModal, setOpenFolderModal] = useState(false)
  const [editFolderMode, setEditFolderMode] = useState(false)
  const [editFolderId, setEditFolderId] = useState<string | null>(null)
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    parent_id: undefined as string | undefined,
  })
  const [folderErrors, setFolderErrors] = useState<Record<string, string>>({})

  // Multi-select states
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveToFolderId, setMoveToFolderId] = useState<string | undefined>(undefined)

  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  const { data: testcases, isLoading } = useQuery('testcases', async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  // Fetch folders for selected project
  const { data: folders } = useQuery(
    ['folders', selectedProjectId],
    async () => {
      if (!selectedProjectId) return []
      return await foldersApi.list(String(selectedProjectId))
    },
    {
      enabled: !!selectedProjectId,
    }
  )

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

  // Folder mutations
  const createFolderMutation = useMutation(
    (data: any) => foldersApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['folders', selectedProjectId])
        handleCloseFolderModal()
      },
    }
  )

  const updateFolderMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => foldersApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['folders', selectedProjectId])
        handleCloseFolderModal()
      },
    }
  )

  const deleteFolderMutation = useMutation(
    (folderId: string) => foldersApi.delete(folderId),
    {
      onSuccess: (_data, deletedFolderId) => {
        queryClient.invalidateQueries(['folders', selectedProjectId])
        if (selectedFolderId === deletedFolderId) {
          setSelectedFolderId(null)
        }
      },
    }
  )

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => api.delete(`/testcases/${id}`)))
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        setSelectedTestCaseIds(new Set())
        setShowBulkActions(false)
        setSelectedTestCase(null)
      },
    }
  )

  // Bulk move mutation
  const bulkMoveMutation = useMutation(
    async ({ ids, folderId }: { ids: string[]; folderId?: string }) => {
      await Promise.all(ids.map(id => api.put(`/testcases/${id}`, { folder_id: folderId })))
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        setSelectedTestCaseIds(new Set())
        setShowBulkActions(false)
        setShowMoveModal(false)
      },
    }
  )

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/testcases/template/download', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'testcase_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Template download failed:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/testcases/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setImportResult(response.data)
      setShowImportResult(true)
      queryClient.invalidateQueries('testcases')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        imported_count: 0,
        errors: [error.response?.data?.detail || 'Import failed'],
      })
      setShowImportResult(true)
    }
  }

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
      folder_id: selectedFolderId || undefined,
    })
    setErrors({})
  }

  const handleCloseFolderModal = () => {
    setOpenFolderModal(false)
    setEditFolderMode(false)
    setEditFolderId(null)
    setFolderFormData({
      name: '',
      description: '',
      parent_id: undefined,
    })
    setFolderErrors({})
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
      folder_id: testcase.folder_id,
    })
    setErrors({})
    setOpen(true)
  }

  const handleEditFolder = (folder: FolderType) => {
    setEditFolderMode(true)
    setEditFolderId(folder.id)
    setFolderFormData({
      name: folder.name,
      description: folder.description || '',
      parent_id: folder.parent_id,
    })
    setFolderErrors({})
    setOpenFolderModal(true)
  }

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('정말 삭제하시겠습니까? 하위 폴더와 테스트 케이스도 영향을 받을 수 있습니다.')) {
      deleteFolderMutation.mutate(folderId)
    }
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

  const validateFolderForm = () => {
    const newErrors: Record<string, string> = {}
    if (!folderFormData.name.trim()) {
      newErrors.name = '폴더 이름을 입력해주세요'
    }
    setFolderErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateFolderForm()) return

    const data = {
      ...folderFormData,
      project_id: String(selectedProjectId),
    }

    if (editFolderMode && editFolderId) {
      updateFolderMutation.mutate({ id: editFolderId, data: folderFormData })
    } else {
      createFolderMutation.mutate(data)
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
      const matchesFolder = selectedFolderId === null || testcase.folder_id === selectedFolderId
      const matchesSearch = testcase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           testcase.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = priorityFilter === 'all' || testcase.priority === priorityFilter
      const matchesType = typeFilter === 'all' || testcase.test_type === typeFilter
      return matchesProject && matchesFolder && matchesSearch && matchesPriority && matchesType
    })
  }, [testcases, selectedProjectId, selectedFolderId, searchQuery, priorityFilter, typeFilter])

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

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // Multi-select handlers
  const handleSelectTestCase = (testcaseId: string) => {
    const newSelected = new Set(selectedTestCaseIds)
    if (newSelected.has(testcaseId)) {
      newSelected.delete(testcaseId)
    } else {
      newSelected.add(testcaseId)
    }
    setSelectedTestCaseIds(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = () => {
    if (selectedTestCaseIds.size === filteredTestCases.length) {
      setSelectedTestCaseIds(new Set<string>())
      setShowBulkActions(false)
    } else {
      const allIds = new Set<string>(filteredTestCases.map((tc: any) => String(tc.id)))
      setSelectedTestCaseIds(allIds)
      setShowBulkActions(true)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`선택한 ${selectedTestCaseIds.size}개의 테스트 케이스를 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedTestCaseIds))
    }
  }

  const handleBulkMove = () => {
    setShowMoveModal(true)
  }

  const confirmBulkMove = () => {
    bulkMoveMutation.mutate({
      ids: Array.from(selectedTestCaseIds),
      folderId: moveToFolderId
    })
  }

  // Organize folders into tree structure
  const folderTree = useMemo(() => {
    if (!folders) return []
    const rootFolders = folders.filter((f: FolderType) => !f.parent_id)
    const buildTree = (parentId?: string): FolderType[] => {
      return folders
        .filter((f: FolderType) => f.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
    }
    return rootFolders.sort((a, b) => a.name.localeCompare(b.name))
  }, [folders])

  const getChildFolders = (parentId: string) => {
    if (!folders) return []
    return folders
      .filter((f: FolderType) => f.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const getTestCaseCountForFolder = (folderId: string): number => {
    if (!testcases) return 0
    return testcases.filter((tc: any) => tc.folder_id === folderId).length
  }

  // Recursive folder rendering component
  const FolderTreeItem = ({ folder, level = 0 }: { folder: FolderType; level?: number }) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const childFolders = getChildFolders(folder.id)
    const testCaseCount = getTestCaseCountForFolder(folder.id)

    return (
      <div>
        <div
          onClick={() => {
            setSelectedFolderId(folder.id)
            if (childFolders.length > 0) {
              toggleFolder(folder.id)
            }
          }}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {childFolders.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4"></span>
          )}
          {isExpanded && childFolders.length > 0 ? (
            <FolderOpen className="w-3.5 h-3.5" />
          ) : (
            <Folder className="w-3.5 h-3.5" />
          )}
          <span className="text-sm flex-1 truncate">{folder.name}</span>
          <span className="text-xs text-gray-500">{testCaseCount}</span>
          {isAdmin && (
            <div className="relative group inline-block" onClick={(e) => e.stopPropagation()}>
              <button className="p-0.5 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              <div className="absolute left-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleEditFolder(folder)}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  수정
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
        {isExpanded && childFolders.map((child) => (
          <FolderTreeItem key={child.id} folder={child} level={level + 1} />
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Project and Folder Tree */}
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
                    setSelectedFolderId(null)
                    toggleProject(project.id)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected && selectedFolderId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
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

                {/* Folders under Project */}
                {isExpanded && (
                  <div className="mt-1">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setFolderFormData({ name: '', description: '', parent_id: undefined })
                          setOpenFolderModal(true)
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 ml-6 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>폴더 추가</span>
                      </button>
                    )}
                    {folderTree.map((folder) => (
                      <FolderTreeItem key={folder.id} folder={folder} />
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
            {isAdmin && (
              <div className="flex items-center gap-3">
                {showBulkActions ? (
                  <>
                    <span className="text-sm text-gray-600">
                      {selectedTestCaseIds.size}개 선택됨
                    </span>
                    <button
                      onClick={handleBulkMove}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Move className="w-4 h-4" />
                      폴더 이동
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTestCaseIds(new Set())
                        setShowBulkActions(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Excel 템플릿
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Excel Import
                    </button>
                    {selectedProjectId && (
                      <button
                        onClick={() => {
                          setFormData({ ...formData, project_id: selectedProjectId, folder_id: selectedFolderId || undefined })
                          setOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        새 테스트 케이스
                      </button>
                    )}
                  </>
                )}
              </div>
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
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-16">
                        <input
                          type="checkbox"
                          checked={filteredTestCases.length > 0 && selectedTestCaseIds.size === filteredTestCases.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      테스트 케이스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">
                      유형
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-20">
                        작업
                      </th>
                    )}
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
                      {isAdmin && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTestCaseIds.has(String(testcase.id))}
                            onChange={() => handleSelectTestCase(String(testcase.id))}
                            className="rounded border-gray-300 cursor-pointer"
                          />
                        </td>
                      )}
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
                      {isAdmin && (
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                        </td>
                      )}
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

                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">폴더</label>
                      <select
                        value={formData.folder_id || ''}
                        onChange={(e) => setFormData({ ...formData, folder_id: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">폴더 없음</option>
                        {folders?.map((folder: FolderType) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
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

      {/* Import Result Modal */}
      {showImportResult && importResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowImportResult(false)} />
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${importResult.success ? 'bg-green-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                    {importResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Excel Import 결과
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>성공:</strong> {importResult.imported_count}개 항목 가져오기 완료
                      </p>
                      {importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-700 mb-2">오류:</p>
                          <div className="bg-red-50 rounded-md p-3 max-h-60 overflow-y-auto">
                            <ul className="list-disc list-inside space-y-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-700">{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowImportResult(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {openFolderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={handleCloseFolderModal} />
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editFolderMode ? '폴더 수정' : '새 폴더'}
                </h3>
                <button onClick={handleCloseFolderModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFolderSubmit}>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-1">
                      폴더 이름 *
                    </label>
                    <input
                      id="folder-name"
                      type="text"
                      required
                      autoFocus
                      value={folderFormData.name}
                      onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                      className={`w-full px-3 py-2 border ${folderErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="폴더 이름"
                    />
                    {folderErrors.name && <p className="mt-1 text-xs text-red-600">{folderErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상위 폴더</label>
                    <select
                      value={folderFormData.parent_id || ''}
                      onChange={(e) => setFolderFormData({ ...folderFormData, parent_id: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">없음 (최상위)</option>
                      {folders?.filter((f: FolderType) => !editFolderMode || f.id !== editFolderId).map((folder: FolderType) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      rows={2}
                      value={folderFormData.description}
                      onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="폴더 설명"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseFolderModal}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createFolderMutation.isLoading || updateFolderMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createFolderMutation.isLoading || updateFolderMutation.isLoading ? '처리 중...' : editFolderMode ? '수정' : '생성'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowMoveModal(false)} />
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  폴더 이동
                </h3>
                <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-4">
                  {selectedTestCaseIds.size}개의 테스트 케이스를 이동할 폴더를 선택하세요.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대상 폴더</label>
                  <select
                    value={moveToFolderId || ''}
                    onChange={(e) => setMoveToFolderId(e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">폴더 없음</option>
                    {folders?.map((folder: FolderType) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmBulkMove}
                  disabled={bulkMoveMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {bulkMoveMutation.isLoading ? '이동 중...' : '이동'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
