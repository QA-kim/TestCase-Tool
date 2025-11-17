import { useState } from 'react'
import { Shield, Mail, Info } from 'lucide-react'

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">시스템 정보 및 고객 지원</p>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">시스템 정보</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">애플리케이션 버전</p>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">마지막 업데이트</p>
              <p className="font-medium text-gray-900">2025-11-17</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">브라우저</p>
              <p className="font-medium text-gray-900 text-sm break-words">
                {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                 navigator.userAgent.includes('Firefox') ? 'Firefox' :
                 navigator.userAgent.includes('Safari') ? 'Safari' :
                 navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">플랫폼</p>
              <p className="font-medium text-gray-900">{navigator.platform}</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">서버 정보</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">백엔드 API</p>
            <p className="font-medium text-gray-900">https://testcase-tool.onrender.com</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">프론트엔드</p>
            <p className="font-medium text-gray-900">https://testcase-e27a4.web.app</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">데이터베이스</p>
            <p className="font-medium text-gray-900">Firebase Firestore</p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-primary-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">도움이 필요하신가요?</h3>
            <p className="text-sm text-gray-600 mb-3">
              문제가 발생하거나 문의사항이 있으시면 언제든지 연락주세요.
            </p>
            <a
              href="mailto:hli.kimdaeng@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              문의하기
            </a>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">추가 정보</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 계정 정보 변경은 "내 계정" 페이지에서 할 수 있습니다</p>
          <p>• 비밀번호 변경은 "내 계정" 페이지의 "보안" 섹션을 이용하세요</p>
          <p>• 역할 변경은 관리자만 가능합니다</p>
          <p>• 프로젝트 및 테스트 케이스 관리는 각 메뉴에서 할 수 있습니다</p>
        </div>
      </div>
    </div>
  )
}
