import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Ban, Clock, History, User, ChevronDown } from 'lucide-react'
import api from '../lib/axios'

export default function TestRunDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedHistoryTestCase, setSelectedHistoryTestCase] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.relative')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  const { data: testrun, isLoading } = useQuery(['testrun', id], async () => {
    const response = await api.get(`/testruns/${id}`)
    return response.data
  })

  const { data: testcases } = useQuery(['testcases'], async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  const { data: results } = useQuery(['testrun-results', id], async () => {
    const response = await api.get(`/testruns/${id}/results`)
    return response.data
  })

  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users/')
    return response.data
  })

  const createResultMutation = useMutation(
    (data: any) => api.post(`/testresults/`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['testrun-results', id])
      },
    }
  )

  const updateResultMutation = useMutation(
    ({ resultId, data }: { resultId: string; data: any }) =>
      api.put(`/testresults/${resultId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['testrun-results', id])
      },
    }
  )

  const handleStatusClick = (testcaseId: string, status: string) => {
    const existingResult = results?.find((r: any) => r.test_case_id === testcaseId)

    const data = {
      test_run_id: id,
      test_case_id: testcaseId,
      status,
      comment: '',
    }

    if (existingResult) {
      updateResultMutation.mutate({ resultId: existingResult.id, data })
    } else {
      createResultMutation.mutate(data)
    }

    setOpenDropdown(null)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed':
        return '통과'
      case 'failed':
        return '실패'
      case 'blocked':
        return '테스트불가'
      case 'skipped':
        return '스킵'
      default:
        return '미실행'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-300'
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-300'
      case 'blocked':
        return 'text-orange-700 bg-orange-50 border-orange-300'
      case 'skipped':
        return 'text-yellow-700 bg-yellow-50 border-yellow-300'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'skipped':
        return <MinusCircle className="w-4 h-4" />
      case 'blocked':
        return <Ban className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
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

  // Get test cases for this test run by filtering with test_case_ids
  const testRunTestCases = testrun?.test_case_ids?.map((tcId: string) => {
    const foundTestCase = testcases?.find((tc: any) => tc.id === tcId)
    return foundTestCase
  }).filter(Boolean) || []

  const passedCount = results?.filter((r: any) => r.status === 'passed').length || 0
  const failedCount = results?.filter((r: any) => r.status === 'failed').length || 0
  const skippedCount = results?.filter((r: any) => r.status === 'skipped').length || 0
  const blockedCount = results?.filter((r: any) => r.status === 'blocked').length || 0
  const totalCount = testRunTestCases.length
  const testedCount = results?.length || 0
  const progress = totalCount > 0 ? Math.round((testedCount / totalCount) * 100) : 0
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

  const selectedResult = selectedHistoryTestCase
    ? results?.find((r: any) => r.test_case_id === selectedHistoryTestCase)
    : null

  const selectedTestCase = selectedHistoryTestCase
    ? testRunTestCases.find((tc: any) => tc.id === selectedHistoryTestCase)
    : null

  const getUserName = (userId: string) => {
    const user = users?.find((u: any) => u.id === userId)
    return user ? user.full_name || user.username : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex gap-6">
      {/* Main Content */}
      <div className={`flex-1 ${selectedHistoryTestCase ? 'max-w-[60%]' : 'max-w-full'} transition-all`}>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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

        {/* Pass Rate Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">통과율</div>
          <div className="text-3xl font-bold text-green-600 mb-3">{passRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${passRate}%` }}
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

        {/* Blocked Card */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="text-sm text-gray-500 mb-2">테스트불가</div>
          <div className="text-3xl font-bold text-orange-600">{blockedCount}</div>
        </div>

        {/* Skipped Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-sm border border-yellow-200 p-6">
          <div className="text-sm text-gray-500 mb-2">스킵</div>
          <div className="text-3xl font-bold text-yellow-600">{skippedCount}</div>
        </div>
        </div>

        {/* Test Cases Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">테스트 케이스 목록 ({testRunTestCases.length}개)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[30%]">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[25%]">수행방법</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[10%]">우선순위</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[20%]">테스트 결과</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[15%]">히스토리</th>
                </tr>
              </thead>
              <tbody>
                {testRunTestCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      테스트 케이스가 없습니다.
                    </td>
                  </tr>
                ) : (
                  testRunTestCases.map((testcase: any) => {
                    const result = results?.find((r: any) => r.test_case_id === testcase.id)
                    const isSelected = selectedHistoryTestCase === testcase.id

                    return (
                      <tr
                        key={testcase.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{testcase.title}</div>
                          {testcase.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{testcase.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {testcase.steps ? (
                            <div className="text-xs text-gray-600 max-w-xs line-clamp-3">{testcase.steps}</div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            testcase.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
                            testcase.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {testcase.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === testcase.id ? null : testcase.id)}
                              disabled={createResultMutation.isLoading || updateResultMutation.isLoading}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                getStatusColor(result?.status || 'untested')
                              } hover:opacity-80 disabled:opacity-50`}
                            >
                              <span className="flex items-center gap-2">
                                {getStatusIcon(result?.status || 'untested')}
                                {getStatusLabel(result?.status || 'untested')}
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === testcase.id ? 'rotate-180' : ''}`} />
                            </button>

                            {openDropdown === testcase.id && (
                              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-48 overflow-y-auto">
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'passed')}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  통과
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'failed')}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  실패
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'blocked')}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                  테스트불가
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'skipped')}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
                                >
                                  <MinusCircle className="w-4 h-4" />
                                  스킵
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {result?.history && result.history.length > 0 && (
                            <button
                              onClick={() => setSelectedHistoryTestCase(isSelected ? null : testcase.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              <History className="w-3.5 h-3.5" />
                              History
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Panel - History */}
      {selectedHistoryTestCase && selectedResult && (
        <div className="w-[40%] bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-h-screen overflow-y-auto sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">상태 변경 히스토리</h2>
            <button
              onClick={() => setSelectedHistoryTestCase(null)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {selectedTestCase && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedTestCase.title}</h3>
              {selectedTestCase.description && (
                <p className="text-sm text-gray-600">{selectedTestCase.description}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {selectedResult.history?.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`flex items-center gap-2 font-medium ${
                    item.status === 'passed' ? 'text-green-700' :
                    item.status === 'failed' ? 'text-red-700' :
                    item.status === 'blocked' ? 'text-orange-700' :
                    item.status === 'skipped' ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {getStatusIcon(item.status)}
                    {item.status === 'passed' ? '통과' :
                     item.status === 'failed' ? '실패' :
                     item.status === 'blocked' ? '테스트불가' :
                     item.status === 'skipped' ? '스킵' : item.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {item.tester_id && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{getUserName(item.tester_id)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(item.tested_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>

                  {item.comment && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-gray-700">{item.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
