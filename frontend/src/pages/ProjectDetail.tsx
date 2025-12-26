import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Edit2, Trash2, X } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [trendDays, setTrendDays] = useState(7)
  const queryClient = useQueryClient()

  const { data: project, isLoading } = useQuery(['project', id], async () => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  })

  const { data: testcases } = useQuery('testcases', async () => {
    const response = await api.get('/testcases')
    return response.data
  })

  const updateMutation = useMutation(
    (data: any) => api.put(`/projects/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id])
        queryClient.invalidateQueries('projects')
        handleClose()
      },
    }
  )

  const deleteMutation = useMutation(
    () => api.delete(`/projects/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects')
        navigate('/projects')
      },
    }
  )

  const handleClose = () => {
    setOpen(false)
    setFormData({ name: '', description: '' })
  }

  const handleEdit = () => {
    if (!project) return
    setFormData({ name: project.name, description: project.description || '' })
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  // Count test cases for this project
  const getTestCaseCount = () => {
    if (!testcases || !id) return 0
    return testcases.filter((tc: any) => tc.project_id === id).length
  }

  // Get daily test case trend with customizable days
  const getTestCaseTrend = (days: number) => {
    if (!testcases || !id) return []

    const projectTestCases = testcases.filter((tc: any) => tc.project_id === id)
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
        date: date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        fullDate: date,
        count
      })
    }

    return trend
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">프로젝트를 찾을 수 없습니다.</div>
      </div>
    )
  }

  const trendData = getTestCaseTrend(trendDays)
  const maxCount = Math.max(...trendData.map(d => d.count), 1)
  const chartHeight = 280
  const chartWidth = 700
  const padding = { top: 20, right: 30, bottom: 50, left: 50 }
  const graphWidth = chartWidth - padding.left - padding.right
  const graphHeight = chartHeight - padding.top - padding.bottom

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                생성일: {new Date(project.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-gray-50 p-6">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-3 gap-6">
          {/* Left Column - Description & Info */}
          <div className="space-y-4 overflow-hidden">
            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">설명</h3>
              <p className="text-sm text-gray-600 line-clamp-4">
                {project.description || '설명이 없습니다.'}
              </p>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">프로젝트 정보</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">테스트 케이스</p>
                  <p className="text-2xl font-bold text-blue-600">{getTestCaseCount()}개</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">생성일</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">수정일</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(project.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Test Case Trend Chart */}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">테스트 케이스 추이</h3>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value={7}>최근 7일</option>
                <option value={14}>최근 14일</option>
                <option value={30}>최근 30일</option>
                <option value={60}>최근 60일</option>
                <option value={90}>최근 90일</option>
              </select>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0">
              <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                {/* Y-axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
                  const y = padding.top + graphHeight * (1 - percent)
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 12}
                        y={y + 5}
                        textAnchor="end"
                        className="text-sm fill-gray-500"
                      >
                        {Math.round(maxCount * percent)}
                      </text>
                    </g>
                  )
                })}

                {/* Line path */}
                {trendData.length > 1 && (
                  <path
                    d={trendData.map((item, index) => {
                      const x = padding.left + (graphWidth / (trendData.length - 1)) * index
                      const y = padding.top + graphHeight - (item.count / maxCount) * graphHeight
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Area fill */}
                {trendData.length > 1 && (
                  <path
                    d={
                      trendData.map((item, index) => {
                        const x = padding.left + (graphWidth / (trendData.length - 1)) * index
                        const y = padding.top + graphHeight - (item.count / maxCount) * graphHeight
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ') +
                      ` L ${chartWidth - padding.right} ${padding.top + graphHeight}` +
                      ` L ${padding.left} ${padding.top + graphHeight} Z`
                    }
                    fill="url(#gradient)"
                    opacity="0.2"
                  />
                )}

                {/* Data points */}
                {trendData.map((item, index) => {
                  const x = padding.left + (trendData.length > 1 ? (graphWidth / (trendData.length - 1)) * index : graphWidth / 2)
                  const y = padding.top + graphHeight - (item.count / maxCount) * graphHeight

                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="hover:r-7 transition-all cursor-pointer"
                      />
                      <title>{`${item.date}: ${item.count}개`}</title>
                    </g>
                  )
                })}

                {/* X-axis labels */}
                {trendData.map((item, index) => {
                  const showLabel = trendDays <= 7 || index % Math.ceil(trendDays / 7) === 0 || index === trendData.length - 1
                  if (!showLabel) return null

                  const x = padding.left + (trendData.length > 1 ? (graphWidth / (trendData.length - 1)) * index : graphWidth / 2)
                  const y = chartHeight - padding.bottom + 25

                  return (
                    <text
                      key={index}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      className="text-sm fill-gray-600"
                    >
                      {item.date}
                    </text>
                  )
                })}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={handleClose}
            />
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">프로젝트 수정</h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    수정
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
