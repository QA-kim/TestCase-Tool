import { useState } from 'react'
import { useQuery } from 'react-query'
import {
  FileText,
  Download,
  BarChart,
  PieChart,
  TrendingUp,
  Filter,
  Calendar,
} from 'lucide-react'
import api from '../lib/axios'

type ReportType = 'overview' | 'project' | 'testrun' | 'trend'
type TimeRange = 'week' | 'month' | 'quarter' | 'year'

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [selectedProject, setSelectedProject] = useState<string>('')

  // 프로젝트 목록 조회
  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  // 전체 통계 조회
  const { data: overallStats } = useQuery('overall-stats', async () => {
    const response = await api.get('/statistics/overall')
    return response.data
  })

  // 프로젝트별 통계 조회
  const { data: projectStats } = useQuery(
    ['project-stats', selectedProject],
    async () => {
      if (!selectedProject) return null
      const response = await api.get(`/statistics/projects/${selectedProject}`)
      return response.data
    },
    { enabled: !!selectedProject }
  )

  // 추세 데이터 조회
  const { data: trendData } = useQuery(
    ['trend-data', timeRange, selectedProject],
    async () => {
      const response = await api.get('/statistics/trends', {
        params: {
          period: timeRange,
          project_id: selectedProject || undefined,
        },
      })
      return response.data
    }
  )

  const handleExportOverall = async () => {
    try {
      const response = await api.get('/exports/statistics/csv', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `statistics_overall_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export:', error)
      alert('CSV 내보내기에 실패했습니다.')
    }
  }

  const handleExportProject = async () => {
    if (!selectedProject) {
      alert('프로젝트를 선택해주세요.')
      return
    }

    try {
      const response = await api.get('/exports/testresults/csv', {
        params: { project_id: selectedProject },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `testresults_project_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export:', error)
      alert('CSV 내보내기에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">보고서</h1>
        <p className="text-gray-600">상세한 테스트 분석 및 보고서를 확인하세요</p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">보고서 유형:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 'overview', label: '전체 개요', icon: BarChart },
            { value: 'project', label: '프로젝트별', icon: PieChart },
            { value: 'testrun', label: '테스트 실행별', icon: FileText },
            { value: 'trend', label: '추세 분석', icon: TrendingUp },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setReportType(type.value as ReportType)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                reportType === type.value
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <type.icon className="w-5 h-5" />
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4" />
              기간 선택
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
              <option value="quarter">최근 90일</option>
              <option value="year">최근 1년</option>
            </select>
          </div>

          {/* Project Filter */}
          {(reportType === 'project' || reportType === 'trend') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FileText className="w-4 h-4" />
                프로젝트 선택
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">전체 프로젝트</option>
                {projects?.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && overallStats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">전체 개요</h2>
            <button
              onClick={handleExportOverall}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">전체 프로젝트</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.total_projects}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">전체 테스트 케이스</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.total_testcases}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">전체 테스트 실행</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.total_testruns}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">전체 통과율</p>
              <p className="text-3xl font-bold text-green-600">{overallStats.overall_pass_rate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">우선순위별 테스트 케이스 분포</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(overallStats.priority_distribution || {}).map(([priority, count]) => (
                <div key={priority} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{priority}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test Type Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">테스트 타입별 분포</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(overallStats.test_type_distribution || {}).map(([type, count]) => (
                <div key={type} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Report */}
      {reportType === 'project' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">프로젝트별 보고서</h2>
            {selectedProject && (
              <button
                onClick={handleExportProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV 내보내기
              </button>
            )}
          </div>

          {!selectedProject ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">프로젝트를 선택하여 상세 보고서를 확인하세요</p>
            </div>
          ) : projectStats ? (
            <div className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">테스트 케이스</p>
                  <p className="text-3xl font-bold text-gray-900">{projectStats.total_testcases}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">테스트 실행</p>
                  <p className="text-3xl font-bold text-gray-900">{projectStats.total_testruns}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">전체 결과</p>
                  <p className="text-3xl font-bold text-gray-900">{projectStats.total_results}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">통과율</p>
                  <p className="text-3xl font-bold text-green-600">{projectStats.pass_rate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Results Breakdown */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">테스트 결과 상세</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">{projectStats.passed_count}</p>
                    <p className="text-sm text-green-600 mt-1">통과</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-700">{projectStats.failed_count}</p>
                    <p className="text-sm text-red-600 mt-1">실패</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-700">{projectStats.blocked_count}</p>
                    <p className="text-sm text-yellow-600 mt-1">차단됨</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-gray-700">{projectStats.skipped_count}</p>
                    <p className="text-sm text-gray-600 mt-1">스킵</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">로딩 중...</p>
            </div>
          )}
        </div>
      )}

      {/* Trend Report */}
      {reportType === 'trend' && trendData && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">추세 분석</h2>

          {trendData.data && trendData.data.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">통과율 추세 ({trendData.period})</h3>
              <div className="space-y-4">
                {trendData.data.map((item: any) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-32">{item.date}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className={`h-6 rounded-full transition-all ${
                            item.pass_rate >= 80
                              ? 'bg-green-500'
                              : item.pass_rate >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${item.pass_rate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {item.pass_rate.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 w-40 text-right">
                      통과: {item.passed} / 전체: {item.total_tests}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">선택한 기간에 대한 데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
