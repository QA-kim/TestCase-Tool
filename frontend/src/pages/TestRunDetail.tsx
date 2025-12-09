import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Ban, Clock, History, User, ChevronDown, FileDown, AlertCircle, X } from 'lucide-react'
import api from '../lib/axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { issuesApi } from '../services/issues'

export default function TestRunDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedHistoryTestCase, setSelectedHistoryTestCase] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [selectedIssueTestCase, setSelectedIssueTestCase] = useState<any>(null)
  const [issueFormData, setIssueFormData] = useState({
    title: '',
    description: '',
    priority: 'high' as 'low' | 'medium' | 'high' | 'critical',
  })

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

  const createIssueMutation = useMutation(
    (data: any) => issuesApi.create(data),
    {
      onSuccess: () => {
        setIssueModalOpen(false)
        setIssueFormData({ title: '', description: '', priority: 'high' })
        alert('이슈가 생성되었습니다!')
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

  const handleCreateIssue = (testcase: any) => {
    setSelectedIssueTestCase(testcase)

    // 수행방법을 내용에 자동으로 포함
    const steps = testcase.steps || '수행방법이 명시되지 않았습니다.'

    setIssueFormData({
      title: testcase.title, // 테스트 케이스 제목을 그대로 사용
      description: `## 수행방법
${steps}

## 예상결과
${testcase.expected_result || '예상결과가 명시되지 않았습니다.'}

## 실패 원인
실패 원인을 분석하고 수정이 필요합니다.`,
      priority: 'high',
    })
    setIssueModalOpen(true)
  }

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault()
    createIssueMutation.mutate({
      ...issueFormData,
      project_id: testrun?.project_id,
      testcase_id: selectedIssueTestCase?.id,
      testrun_id: id, // 테스트 실행 ID 추가
      issue_type: 'bug',
    })
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

  const generatePDFReport = async () => {
    // Helper function to get Korean status label
    const getStatusLabelKo = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'passed': '통과',
        'failed': '실패',
        'blocked': '테스트불가',
        'skipped': '스킵',
        'untested': '미실행'
      }
      return statusMap[status] || status
    }

    // Create a temporary HTML element for the report
    const reportElement = document.createElement('div')
    reportElement.style.position = 'absolute'
    reportElement.style.left = '-9999px'
    reportElement.style.width = '210mm' // A4 width
    reportElement.style.padding = '20px'
    reportElement.style.backgroundColor = 'white'
    reportElement.style.fontFamily = 'Arial, sans-serif'

    // Build the HTML content
    reportElement.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0;">테스트 실행 결과 보고서</h1>
      </div>

      <div style="margin-bottom: 15px; font-size: 12px;">
        <p><strong>테스트 실행:</strong> ${testrun?.name || 'N/A'}</p>
        <p><strong>생성일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <p><strong>상태:</strong> ${testrun?.status || 'N/A'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">요약 통계</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>전체:</strong> ${totalCount}</td>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>진행률:</strong> ${progress}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>통과율:</strong> ${passRate}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>통과:</strong> ${passedCount}</td>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>실패:</strong> ${failedCount}</td>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f0f8ff;"><strong>테스트불가:</strong> ${blockedCount} | <strong>스킵:</strong> ${skippedCount}</td>
          </tr>
        </table>
      </div>

      <div>
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">테스트 케이스 결과</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #428bca; color: white;">
              <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">테스트 케이스</th>
              <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">수행방법</th>
              <th style="border: 1px solid #ddd; padding: 5px; text-align: center; width: 40px;">P</th>
              <th style="border: 1px solid #ddd; padding: 5px; text-align: center; width: 60px;">상태</th>
              <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">히스토리</th>
            </tr>
          </thead>
          <tbody>
            ${testRunTestCases.map((testcase: any, index: number) => {
              const result = results?.find((r: any) => r.test_case_id === testcase.id)
              const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'

              // Format history
              let historyText = '미실행'
              if (result && result.history && result.history.length > 0) {
                historyText = result.history.map((h: any) => {
                  const userName = getUserName(h.tester_id)
                  const date = new Date(h.tested_at).toLocaleDateString('ko-KR')
                  const status = getStatusLabelKo(h.status)
                  return `${date} ${userName} - ${status}${h.comment ? ': ' + h.comment : ''}`
                }).join('<br/>')
              }

              return `
                <tr style="background-color: ${bgColor};">
                  <td style="border: 1px solid #ddd; padding: 5px; max-width: 150px;">${testcase.title || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; max-width: 200px; font-size: 9px;">${testcase.steps || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${testcase.priority ? testcase.priority[0].toUpperCase() : '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${result ? getStatusLabelKo(result.status) : '미실행'}</td>
                  <td style="border: 1px solid #ddd; padding: 5px; font-size: 8px;">${historyText}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `

    document.body.appendChild(reportElement)

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Create PDF
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')

      // If content is taller than one page, scale it down to fit
      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight
        const scaledWidth = imgWidth * scaleFactor
        const scaledHeight = pageHeight
        const xOffset = (imgWidth - scaledWidth) / 2
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight)
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      }

      // Save PDF
      const fileName = `테스트보고서_${testrun?.name || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } finally {
      // Clean up
      document.body.removeChild(reportElement)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6">
      {/* Main Content */}
      <div className={`flex-1 ${selectedHistoryTestCase ? 'lg:max-w-[60%]' : 'max-w-full'} transition-all flex flex-col`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/testruns')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
              {testrun?.name}
            </h1>
            {getRunStatusBadge(testrun?.status)}
          </div>

          <button
            onClick={generatePDFReport}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm sm:text-base whitespace-nowrap"
          >
            <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">PDF 보고서 다운로드</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 flex-shrink-0">
        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">진행률</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">{progress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Pass Rate Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">통과율</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2 md:mb-3">{passRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
        </div>

        {/* Passed Card */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm border border-green-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">통과</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600">{passedCount}</div>
        </div>

        {/* Failed Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg shadow-sm border border-red-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">실패</div>
          <div className="text-2xl md:text-3xl font-bold text-red-600">{failedCount}</div>
        </div>

        {/* Blocked Card */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm border border-orange-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">테스트불가</div>
          <div className="text-2xl md:text-3xl font-bold text-orange-600">{blockedCount}</div>
        </div>

        {/* Skipped Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-sm border border-yellow-200 p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">스킵</div>
          <div className="text-2xl md:text-3xl font-bold text-yellow-600">{skippedCount}</div>
        </div>
        </div>

        {/* Test Cases Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 flex-1 flex flex-col min-h-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex-shrink-0">테스트 케이스 목록 ({testRunTestCases.length}개)</h2>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[25%]">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[20%]">수행방법</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[10%]">우선순위</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[15%]">테스트 결과</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[15%]">히스토리</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[15%]">액션</th>
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
                              <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-[120px] overflow-y-auto">
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'passed')}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  통과
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'failed')}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  실패
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'blocked')}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-700 hover:bg-orange-50 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                  테스트불가
                                </button>
                                <button
                                  onClick={() => handleStatusClick(testcase.id, 'skipped')}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
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
                        <td className="py-4 px-4">
                          {result?.status === 'failed' && (
                            <button
                              onClick={() => handleCreateIssue(testcase)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              이슈 생성
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

      {/* Issue Creation Modal */}
      {issueModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">테스트 실패 이슈 생성</h2>
              <button
                onClick={() => setIssueModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueFormData.title}
                    onChange={(e) => setIssueFormData({ ...issueFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={issueFormData.description}
                    onChange={(e) => setIssueFormData({ ...issueFormData, description: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    우선순위 *
                  </label>
                  <select
                    value={issueFormData.priority}
                    onChange={(e) =>
                      setIssueFormData({ ...issueFormData, priority: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createIssueMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createIssueMutation.isLoading ? '생성 중...' : '이슈 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
