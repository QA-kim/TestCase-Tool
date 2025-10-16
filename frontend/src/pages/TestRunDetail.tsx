import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Edit2 } from 'lucide-react'
import api from '../lib/axios'

export default function TestRunDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [resultDialog, setResultDialog] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [resultData, setResultData] = useState({
    status: 'passed',
    comment: '',
  })

  const { data: testrun, isLoading } = useQuery(['testrun', id], async () => {
    const response = await api.get(`/testruns/${id}`)
    return response.data
  })

  const { data: results } = useQuery(['testrun-results', id], async () => {
    const response = await api.get(`/testruns/${id}/results`)
    return response.data
  })

  const saveResultMutation = useMutation(
    (data: any) => api.post(`/testresults/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['testrun-results', id])
        handleCloseDialog()
      },
    }
  )

  const updateResultMutation = useMutation(
    ({ resultId, data }: { resultId: number; data: any }) =>
      api.put(`/testresults/${resultId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['testrun-results', id])
        handleCloseDialog()
      },
    }
  )

  const handleCloseDialog = () => {
    setResultDialog(false)
    setSelectedTestCase(null)
    setResultData({ status: 'passed', comment: '' })
  }

  const handleOpenDialog = (testcase: any, existingResult?: any) => {
    setSelectedTestCase(testcase)
    if (existingResult) {
      setResultData({
        status: existingResult.status,
        comment: existingResult.comment || '',
      })
    } else {
      setResultData({ status: 'passed', comment: '' })
    }
    setResultDialog(true)
  }

  const handleSaveResult = () => {
    const existingResult = results?.find(
      (r: any) => r.testcase_id === selectedTestCase.id
    )

    if (existingResult) {
      updateResultMutation.mutate({
        resultId: existingResult.id,
        data: {
          ...resultData,
          testrun_id: Number(id),
          testcase_id: selectedTestCase.id,
        },
      })
    } else {
      saveResultMutation.mutate({
        ...resultData,
        testrun_id: Number(id),
        testcase_id: selectedTestCase.id,
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'skipped':
        return <MinusCircle className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      passed: { label: '통과', className: 'bg-green-100 text-green-800 border-green-300' },
      failed: { label: '실패', className: 'bg-red-100 text-red-800 border-red-300' },
      skipped: { label: '스킵', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    }
    const config = statusMap[status as keyof typeof statusMap]
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: { className: 'bg-red-100 text-red-800 border-red-300' },
      medium: { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      low: { className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const config = priorityMap[priority?.toLowerCase() as keyof typeof priorityMap] || priorityMap.medium
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {priority}
      </span>
    )
  }

  const getRunStatusBadge = (status: string) => {
    const statusMap = {
      completed: { className: 'bg-green-100 text-green-800 border-green-300' },
      in_progress: { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      planned: { className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.planned
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        {status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="h-1 w-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    )
  }

  const testcases = testrun?.testcases || []
  const passedCount = results?.filter((r: any) => r.status === 'passed').length || 0
  const failedCount = results?.filter((r: any) => r.status === 'failed').length || 0
  const skippedCount = results?.filter((r: any) => r.status === 'skipped').length || 0
  const totalCount = testcases.length
  const testedCount = results?.length || 0
  const progress = totalCount > 0 ? Math.round((testedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/testruns')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {testrun?.name}
        </h1>
        {getRunStatusBadge(testrun?.status)}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">진행률</div>
          <div className="text-3xl font-bold text-gray-900 mb-3">{progress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Passed Card */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm border border-green-200 p-6">
          <div className="text-sm text-gray-500 mb-2">통과</div>
          <div className="text-3xl font-bold text-green-600">{passedCount}</div>
        </div>

        {/* Failed Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-sm text-gray-500 mb-2">실패</div>
          <div className="text-3xl font-bold text-red-600">{failedCount}</div>
        </div>

        {/* Skipped Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-sm border border-yellow-200 p-6">
          <div className="text-sm text-gray-500 mb-2">스킵</div>
          <div className="text-3xl font-bold text-yellow-600">{skippedCount}</div>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">테스트 케이스 목록</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">제목</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">우선순위</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">상태</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">코멘트</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody>
              {testcases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    테스트 케이스가 없습니다.
                  </td>
                </tr>
              ) : (
                testcases.map((testcase: any) => {
                  const result = results?.find(
                    (r: any) => r.testcase_id === testcase.id
                  )
                  return (
                    <tr
                      key={testcase.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-gray-900">{testcase.title}</td>
                      <td className="py-4 px-4 text-sm">
                        {getPriorityBadge(testcase.priority)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {result ? (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            {getStatusBadge(result.status)}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-300">
                            미실행
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {result?.comment ? (
                          <div className="max-w-xs truncate" title={result.comment}>
                            {result.comment}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-right">
                        <button
                          onClick={() => handleOpenDialog(testcase, result)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            result
                              ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                          {result ? '수정' : '결과 입력'}
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

      {/* Result Entry Modal */}
      {resultDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">테스트 결과 입력</h3>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4 text-sm text-gray-600">
                {selectedTestCase?.title}
              </div>

              {/* Status Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  결과
                </label>
                <select
                  value={resultData.status}
                  onChange={(e) => setResultData({ ...resultData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="passed">✅ 통과</option>
                  <option value="failed">❌ 실패</option>
                  <option value="skipped">⏭️ 스킵</option>
                </select>
              </div>

              {/* Comment Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  코멘트
                </label>
                <textarea
                  value={resultData.comment}
                  onChange={(e) => setResultData({ ...resultData, comment: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="테스트 결과에 대한 상세 설명을 입력하세요..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveResult}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
