import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  FileText,
  Play,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'
import api from '../lib/axios'

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  trend?: string
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
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
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}
          style={{ boxShadow: `0 4px 14px ${color.replace('bg-', 'rgba(')}20)` }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/projects/')
    return response.data
  })

  const { data: testcases } = useQuery('testcases', async () => {
    const response = await api.get('/testcases/')
    return response.data
  })

  const { data: testruns } = useQuery('testruns', async () => {
    const response = await api.get('/testruns/')
    return response.data
  })

  const { data: allResults } = useQuery('all-results', async () => {
    const response = await api.get('/testresults/')
    return response.data
  })

  const projectCount = projects?.length || 0
  const testcaseCount = testcases?.length || 0
  const testrunCount = testruns?.length || 0

  const passedCount = allResults?.filter((r: any) => r.status === 'passed').length || 0
  const failedCount = allResults?.filter((r: any) => r.status === 'failed').length || 0
  const totalResults = allResults?.length || 0
  const passRate = totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0

  const recentProjects = projects?.slice(0, 5) || []
  const recentTestCases = testcases?.slice(0, 5) || []
  const recentTestRuns = testruns?.slice(0, 5) || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'planned': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">프로젝트 현황 및 테스트 통계를 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="프로젝트"
          value={projectCount}
          icon={FolderOpen}
          color="bg-primary-500"
          trend="+12% 이번 달"
        />
        <StatCard
          title="테스트 케이스"
          value={testcaseCount}
          icon={FileText}
          color="bg-purple-500"
          trend="+8% 이번 주"
        />
        <StatCard
          title="테스트 실행"
          value={testrunCount}
          icon={Play}
          color="bg-orange-500"
        />
        <StatCard
          title="통과율"
          value={passRate}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">최근 프로젝트</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentProjects.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 프로젝트가 없습니다.
              </div>
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
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(project.created_at).toLocaleDateString('ko-KR')}
                      </p>
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
            {recentTestCases.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 테스트 케이스가 없습니다.
              </div>
            ) : (
              recentTestCases.map((testcase: any) => (
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
            {recentTestRuns.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 테스트 실행이 없습니다.
              </div>
            ) : (
              recentTestRuns.map((testrun: any) => (
                <div
                  key={testrun.id}
                  onClick={() => navigate(`/testruns/${testrun.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{testrun.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(testrun.status)}`}>
                          {testrun.status}
                        </span>
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

      {/* Test Results Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">테스트 결과 통계</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              전체 테스트 결과: {totalResults}개 (통과: {passedCount}, 실패: {failedCount})
            </span>
            <span className="font-semibold text-green-600">통과율: {passRate}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${passRate}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{passedCount}</p>
              <p className="text-sm text-green-600 mt-1">통과</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{failedCount}</p>
              <p className="text-sm text-red-600 mt-1">실패</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">
                {allResults?.filter((r: any) => r.status === 'skipped').length || 0}
              </p>
              <p className="text-sm text-yellow-600 mt-1">스킵</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
