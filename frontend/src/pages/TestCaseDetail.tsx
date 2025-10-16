import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Edit2, Trash2, Copy } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

export default function TestCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data: testcase, isLoading } = useQuery(['testcase', id], async () => {
    const response = await api.get(`/testcases/${id}`)
    return response.data
  })

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/testcases/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        navigate('/testcases')
      },
    }
  )

  const duplicateMutation = useMutation(
    (data: any) => api.post('/testcases/', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testcases')
        navigate('/testcases')
      },
    }
  )

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(Number(id))
    }
  }

  const handleDuplicate = () => {
    if (testcase) {
      const duplicateData = {
        ...testcase,
        title: `${testcase.title} (복사본)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
      }
      duplicateMutation.mutate(duplicateData)
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!testcase) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-gray-500">테스트 케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/testcases')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex-grow">
          {testcase.title}
        </h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              복제
            </button>
            <button
              onClick={() => navigate('/testcases')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content - 8 columns */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Description */}
          {testcase.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">설명</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {testcase.description}
              </p>
            </div>
          )}

          {/* Preconditions */}
          {testcase.preconditions && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                사전 조건
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {testcase.preconditions}
              </p>
            </div>
          )}

          {/* Test Steps */}
          {testcase.steps && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                테스트 단계
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {testcase.steps}
              </p>
            </div>
          )}

          {/* Expected Result */}
          {testcase.expected_result && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                예상 결과
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {testcase.expected_result}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - 4 columns */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">속성</h2>
            <hr className="mb-4 border-gray-200" />

            <div className="space-y-4">
              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  우선순위
                </label>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border ${getPriorityBadgeClass(
                      testcase.priority
                    )}`}
                  >
                    {getPriorityLabel(testcase.priority)}
                  </span>
                </div>
              </div>

              {/* Test Type */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  테스트 유형
                </label>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white">
                    {testcase.test_type}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {testcase.tags && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    태그
                  </label>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                      {testcase.tags}
                    </span>
                  </div>
                </div>
              )}

              <hr className="border-gray-200" />

              {/* Created Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  생성일
                </label>
                <p className="mt-1.5 text-sm text-gray-900">
                  {new Date(testcase.created_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Updated Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  수정일
                </label>
                <p className="mt-1.5 text-sm text-gray-900">
                  {new Date(testcase.updated_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
