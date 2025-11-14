import { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  FileText,
  Play,
  CheckCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import api from '../lib/axios'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  trend?: string
  onClick?: () => void
}

function StatCard({ title, value, icon: Icon, color, trend, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  )
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year'

export default function DashboardEnhanced() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  // 대시보드 통합 통계 조회
  const { data: dashboardStats, isLoading } = useQuery(
    ['dashboard-stats', timeRange],
    async () => {
      const response = await api.get('/statistics/dashboard', {
        params: {
          days: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365,
        },
      })
      return response.data
    }
  )

  // 추세 데이터 조회
  const { data: trendData } = useQuery(['trend-stats', timeRange], async () => {
    const response = await api.get('/statistics/trends', {
      params: { period: timeRange },
    })
    return response.data
  })

  const overall = dashboardStats?.overall
  const recentProjects = dashboardStats?.recent_projects || []
  const recentTestcases = dashboardStats?.recent_testcases || []
  const recentTestruns = dashboardStats?.recent_testruns || []
  const topFailedTestcases = dashboardStats?.top_failed_testcases || []


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-blue-100 text-blue-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'planned':
        return 'bg-gray-100 text-gray-700'
      case 'blocked':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">프로젝트 현황 및 테스트 통계를 확인하세요</p>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">기간 선택:</span>
          <div className="flex gap-2">
            {[
              { value: 'week', label: '최근 7일' },
              { value: 'month', label: '최근 30일' },
              { value: 'quarter', label: '최근 90일' },
              { value: 'year', label: '최근 1년' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="프로젝트"
          value={overall?.total_projects || 0}
          icon={FolderOpen}
          color="bg-primary-500"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title="테스트 케이스"
          value={overall?.total_testcases || 0}
          icon={FileText}
          color="bg-purple-500"
          onClick={() => navigate('/testcases')}
        />
        <StatCard
          title="테스트 실행"
          value={overall?.total_testruns || 0}
          icon={Play}
          color="bg-orange-500"
          onClick={() => navigate('/testruns')}
        />
        <StatCard
          title="전체 통과율"
          value={`${overall?.overall_pass_rate?.toFixed(1) || 0}%`}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Active/Completed Test Runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">실행 상태</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{overall?.active_testruns || 0}</p>
              <p className="text-sm text-blue-600 mt-1">진행 중</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{overall?.completed_testruns || 0}</p>
              <p className="text-sm text-green-600 mt-1">완료</p>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">우선순위별 분포</h3>
          <div className="space-y-3">
            {Object.entries(overall?.priority_distribution || {}).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                  {priority}
                </span>
                <span className="text-sm font-semibold text-gray-700">{count as number}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Failed Test Cases */}
      {topFailedTestcases.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">자주 실패하는 테스트 케이스</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topFailedTestcases.map((testcase: any) => (
              <div
                key={testcase.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/testcases/${testcase.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{testcase.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(testcase.priority)}`}>
                        {testcase.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-red-600">{testcase.failure_count}</p>
                    <p className="text-xs text-gray-500">실패 횟수</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">최근 프로젝트</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentProjects.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">아직 프로젝트가 없습니다.</div>
            ) : (
              recentProjects.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => navigate('/projects')}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{project.key}</p>
                    </div>
                    <FolderOpen className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Test Cases */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">최근 테스트 케이스</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTestcases.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">아직 테스트 케이스가 없습니다.</div>
            ) : (
              recentTestcases.map((testcase: any) => (
                <div
                  key={testcase.id}
                  onClick={() => navigate(`/testcases/${testcase.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{testcase.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(testcase.priority)}`}>
                          {testcase.priority}
                        </span>
                      </div>
                    </div>
                    <FileText className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Test Runs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">최근 테스트 실행</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTestruns.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">아직 테스트 실행이 없습니다.</div>
            ) : (
              recentTestruns.map((testrun: any) => (
                <div
                  key={testrun.testrun_id}
                  onClick={() => navigate(`/testruns/${testrun.testrun_id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{testrun.testrun_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(testrun.status)}`}>
                          {testrun.status}
                        </span>
                        <span className="text-xs text-gray-500">통과율: {testrun.pass_rate?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Play className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      {trendData && trendData.data && trendData.data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">통과율 추세</h3>
          <div className="space-y-4">
            {trendData.data.slice(-10).map((item: any) => (
              <div key={item.date} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">{item.date}</span>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        item.pass_rate >= 80 ? 'bg-green-500' : item.pass_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.pass_rate}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">{item.pass_rate.toFixed(1)}%</span>
                <span className="text-xs text-gray-500 w-32 text-right">
                  {item.passed}/{item.total_tests} 통과
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
