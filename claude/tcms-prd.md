# 테스트 케이스 관리 소프트웨어 - 제품 요구사항 문서 (PRD)

## 🎯 현재 구현 상태 (2025년 1월)

### ✅ 구현 완료 기능 (MVP - Phase 1)
1. **사용자 인증 시스템**
   - JWT 기반 회원가입/로그인
   - 비밀번호 해싱 (pbkdf2_sha256)
   - 5단계 역할 기반 접근 제어 (Admin, QA Manager, QA Engineer, Developer, Viewer)

2. **프로젝트 관리**
   - CRUD 작업 (생성, 조회, 수정, 삭제)
   - 프로젝트 소유자 추적

3. **테스트 케이스 관리**
   - 기본 CRUD 작업
   - 버전 히스토리 자동 저장
   - 우선순위 관리 (Low, Medium, High, Critical)
   - 테스트 타입 분류 (Functional, Regression, Smoke, Integration, Performance, Security)
   - 프로젝트별 필터링

4. **UI/UX**
   - TMS 스타일 3단 레이아웃
   - Tailwind CSS v4 기반 모던 디자인
   - 반응형 웹 디자인

### 🚀 배포 현황
- **프론트엔드**: https://testcase-e27a4.web.app (Firebase Hosting)
- **백엔드**: https://testcase-tool.onrender.com (Render.com)
- **데이터베이스**: Firebase Firestore
- **운영 비용**: $0/월 (무료 플랜 사용)

### 📊 PRD 대비 구현률

| 분야 | PRD 계획 | 현재 구현 | 구현률 | 상태 |
|------|----------|-----------|--------|------|
| 테스트 케이스 CRUD | ✅ | ✅ | 100% | 완료 |
| 버전 관리 | ✅ | ✅ | 100% | 완료 |
| 사용자 인증 | ✅ | ✅ | 100% | 완료 |
| RBAC | ✅ | ✅ | 100% | 완료 |
| 프로젝트 관리 | ✅ | ✅ | 100% | 완료 |
| 리치 텍스트 에디터 | ✅ | ❌ | 0% | 계획 중 |
| 파일 첨부 | ✅ | ❌ | 0% | 계획 중 |
| 테스트 실행 관리 | ✅ | 🔄 | 30% | 진행 중 |
| 대시보드/리포팅 | ✅ | ❌ | 0% | 계획 중 |
| Jira 통합 | ✅ | ❌ | 0% | Phase 2 |
| 이메일 알림 | ✅ | ❌ | 0% | Phase 2 |

### 🛠️ 기술 스택 (실제 구현)
- **백엔드**: Python 3.13 + FastAPI 0.95.2 + Firebase Firestore
- **프론트엔드**: React 18 + TypeScript + Tailwind CSS v4
- **인증**: JWT + pbkdf2_sha256
- **호스팅**: Render.com (백엔드) + Firebase Hosting (프론트엔드)

---

## 1. 제품 개요

### 1.1 제품명
**TCMS (Test Case Management Software)**

### 1.2 제품 설명
테스트 케이스를 효율적으로 작성, 수정, 관리할 수 있는 전문 소프트웨어로, QA 팀과 개발팀이 체계적으로 테스트를 관리하고 품질을 보증할 수 있도록 지원하는 도구입니다.

### 1.3 목표
- 테스트 케이스의 중앙 집중식 관리
- 테스트 작성 및 수정 프로세스 간소화
- 테스트 재사용성 향상
- 팀 간 협업 강화
- 테스트 품질 및 일관성 보장

### 1.4 대상 사용자
- **주 사용자**: QA 엔지니어, 테스트 엔지니어
- **부 사용자**: 개발자, 프로젝트 매니저, 제품 오너
- **조직 규모**: 스타트업부터 대기업까지
- **산업 분야**: 모든 소프트웨어 개발 조직

## 2. 핵심 기능 요구사항

### 2.1 테스트 케이스 작성 기능

#### 2.1.1 테스트 케이스 에디터
```
필수 기능:
- 리치 텍스트 에디터 (WYSIWYG)
- 마크다운 지원
- 코드 블록 및 구문 강조
- 테이블 삽입 및 편집
- 이미지/파일 첨부 (드래그 앤 드롭)
- 자동 저장 (30초마다)
- 실행 취소/다시 실행 (Ctrl+Z/Ctrl+Y)
```

#### 2.1.2 테스트 케이스 구조
```
기본 필드:
- ID (자동 생성, TC-YYYY-0001 형식)
- 제목 (필수, 최대 200자)
- 설명 (선택)
- 전제 조건 (Pre-conditions)
- 테스트 단계 (Test Steps)
  - 단계 번호 (자동)
  - 실행 내용
  - 예상 결과
  - 첨부 파일
- 사후 조건 (Post-conditions)
- 우선순위 (P0-P4)
- 상태 (초안/검토중/승인/폐기)
```

#### 2.1.3 테스트 케이스 템플릿
```
제공 템플릿:
- 기능 테스트 템플릿
- API 테스트 템플릿
- UI 테스트 템플릿
- 성능 테스트 템플릿
- 보안 테스트 템플릿
- 사용자 정의 템플릿 생성
```

### 2.2 테스트 케이스 수정 기능

#### 2.2.1 버전 관리
```
버전 기능:
- 모든 수정 사항 자동 버전 생성
- 버전 비교 (Diff View)
- 버전 복원
- 변경 이유 기록
- 수정자 및 수정 시간 추적
```

#### 2.2.2 대량 편집
```
대량 편집 옵션:
- 다중 선택 후 일괄 수정
- 우선순위 일괄 변경
- 담당자 일괄 할당
- 태그 일괄 추가/제거
- 상태 일괄 변경
```

#### 2.2.3 검토 및 승인
```
워크플로우:
1. 초안 작성 → 2. 검토 요청 → 3. 피드백 → 4. 수정 → 5. 승인
- 검토자 지정
- 코멘트 및 피드백
- 승인/반려 처리
- 이메일 알림
```

### 2.3 테스트 케이스 관리 기능

#### 2.3.1 폴더 구조 관리
```
계층 구조:
프로젝트
└── 모듈
    └── 기능
        └── 하위 기능
            └── 테스트 케이스

- 무제한 깊이 지원
- 드래그 앤 드롭으로 이동
- 폴더별 권한 설정
- 폴더 템플릿
```

#### 2.3.2 분류 및 태그
```
분류 체계:
- 테스트 유형: 기능/비기능/회귀/스모크/샌리티
- 실행 방법: 수동/자동/반자동
- 테스트 레벨: 단위/통합/시스템/인수
- 커스텀 태그 (무제한)
- 색상 코딩
```

#### 2.3.3 검색 및 필터
```
검색 기능:
- 전체 텍스트 검색
- 고급 필터
  - ID, 제목, 설명
  - 작성자, 수정자
  - 날짜 범위
  - 우선순위
  - 상태
  - 태그
- 검색 결과 저장
- 검색 히스토리
```

#### 2.3.4 테스트 케이스 관계
```
관계 설정:
- 선행/후행 관계
- 의존성 설정
- 관련 요구사항 연결
- 관련 버그 연결
- 테스트 스위트 구성
```

### 2.4 가져오기/내보내기

#### 2.4.1 가져오기 형식
```
지원 형식:
- Excel (.xlsx, .xls)
- CSV
- XML
- JSON
- TestRail 백업
- HP ALM 내보내기
```

#### 2.4.2 내보내기 형식
```
내보내기 옵션:
- PDF (보고서 형식)
- Excel (편집 가능)
- CSV (데이터 이동)
- HTML (웹 공유)
- Markdown (문서화)
- JSON/XML (시스템 연동)
```

### 2.5 협업 기능

#### 2.5.1 실시간 협업
```
협업 도구:
- 동시 편집 잠금
- 실시간 변경 알림
- 현재 편집자 표시
- 충돌 방지 메커니즘
```

#### 2.5.2 코멘트 시스템
```
코멘트 기능:
- 테스트 케이스별 코멘트
- 특정 단계 코멘트
- @멘션 기능
- 코멘트 스레드
- 첨부 파일
- 이모지 반응
```

#### 2.5.3 공유 및 권한
```
공유 옵션:
- 읽기 전용 링크
- 편집 가능 링크
- 만료 기간 설정
- 비밀번호 보호
- 접근 로그
```

## 3. 사용자 인터페이스 요구사항

### 3.1 대시보드
```
대시보드 위젯:
- 최근 작업한 테스트 케이스
- 내가 작성한 테스트 케이스
- 검토 대기 중인 항목
- 팀 활동 피드
- 통계 요약
  - 총 테스트 케이스 수
  - 상태별 분포
  - 우선순위별 분포
```

### 3.2 테스트 케이스 목록 뷰
```
목록 표시:
- 테이블 뷰 (기본)
- 카드 뷰
- 트리 뷰
- 칸반 보드 뷰

컬럼 커스터마이징:
- 표시할 컬럼 선택
- 컬럼 순서 변경
- 컬럼 너비 조정
- 정렬 기능
```

### 3.3 테스트 케이스 상세 뷰
```
레이아웃:
- 좌측: 네비게이션 트리
- 중앙: 테스트 케이스 내용
- 우측: 속성 패널
  - 메타데이터
  - 히스토리
  - 코멘트
  - 첨부 파일
```

### 3.4 단축키
```
필수 단축키:
- Ctrl+N: 새 테스트 케이스
- Ctrl+S: 저장
- Ctrl+E: 편집 모드
- Ctrl+F: 검색
- Ctrl+D: 복제
- Ctrl+/: 단축키 도움말
- ESC: 취소/닫기
```

## 4. 기술 요구사항

### 4.1 클라이언트 (웹 애플리케이션)
```
프론트엔드 스택:
- Framework: React 18+ 또는 Vue 3+
- Language: TypeScript
- UI Library: Ant Design 또는 Material-UI
- State Management: Redux Toolkit 또는 Pinia
- Editor: TinyMCE 또는 Quill
- Build Tool: Vite
```

### 4.2 서버 (백엔드)
```
백엔드 스택:
- Runtime: Node.js 18+ LTS
- Framework: NestJS 또는 Express + TypeScript
- API: RESTful + GraphQL (선택적)
- Authentication: JWT + OAuth 2.0
- Validation: Joi 또는 class-validator
```

### 4.3 데이터베이스
```
데이터 저장소:
- Primary DB: PostgreSQL 14+
  - 테스트 케이스 데이터
  - 사용자 정보
  - 프로젝트 구조
- Cache: Redis 7+
  - 세션 관리
  - 실시간 데이터
- File Storage: MinIO 또는 AWS S3
  - 첨부 파일
  - 이미지
```

### 4.4 배포 및 인프라
```
배포 옵션:
1. 클라우드 (SaaS)
   - AWS/Azure/GCP
   - Docker + Kubernetes
   - Auto-scaling

2. 온프레미스
   - Docker Compose
   - 단일 서버 설치 패키지
   - 기업 내부망 지원
```

## 5. 비기능 요구사항

### 5.1 성능
```
성능 목표:
- 페이지 로드: < 2초
- 검색 응답: < 1초
- 자동 저장: < 500ms
- 동시 사용자: 1,000+
- 테스트 케이스: 100,000+/프로젝트
- 첨부 파일: 최대 50MB/파일
```

### 5.2 보안
```
보안 요구사항:
- HTTPS 필수
- 데이터 암호화 (AES-256)
- 비밀번호 정책
  - 최소 8자
  - 대소문자, 숫자, 특수문자
- 2단계 인증 (2FA)
- 세션 타임아웃 (30분)
- SQL Injection 방지
- XSS 방지
- CSRF 보호
```

### 5.3 가용성
```
가용성 목표:
- SLA: 99.9% (연간)
- 백업: 일일 자동 백업
- 복구: RTO < 4시간, RPO < 1시간
- 장애 조치: 자동 failover
```

### 5.4 사용성
```
사용성 기준:
- 직관적 UI (교육 없이 사용 가능)
- 반응형 디자인 (모바일 지원)
- 다국어 지원 (한국어, 영어, 일본어)
- 접근성 (WCAG 2.1 Level AA)
- 브라우저 지원
  - Chrome (최신 2개 버전)
  - Firefox (최신 2개 버전)
  - Safari (최신 2개 버전)
  - Edge (최신 2개 버전)
```

## 6. 통합 요구사항

### 6.1 이슈 트래킹 시스템
```
지원 도구:
- Jira
  - 이슈 연동
  - 테스트 결과 동기화
  - 양방향 링크
- GitHub Issues
- GitLab Issues
- Azure DevOps
```

### 6.2 CI/CD 도구
```
통합 지원:
- Jenkins
  - 테스트 실행 트리거
  - 결과 리포팅
- GitLab CI
- GitHub Actions
- TeamCity
```

### 6.3 커뮤니케이션 도구
```
알림 연동:
- Slack
  - 테스트 케이스 업데이트
  - 검토 요청
  - 승인 알림
- Microsoft Teams
- Email (SMTP)
- Webhook (커스텀)
```

### 6.4 API
```
API 제공:
- RESTful API
  - 모든 CRUD 작업
  - 벌크 작업
  - 검색 및 필터
- API 문서 (Swagger/OpenAPI)
- Rate Limiting (1000 req/hour)
- API Key 인증
```

## 7. 데이터 모델

### 7.1 주요 엔티티
```sql
-- 테스트 케이스 테이블
TestCase {
  id: UUID
  project_id: UUID
  folder_id: UUID
  title: VARCHAR(200)
  description: TEXT
  preconditions: TEXT
  postconditions: TEXT
  priority: ENUM(P0,P1,P2,P3,P4)
  status: ENUM(Draft,Review,Approved,Deprecated)
  type: ENUM(Functional,NonFunctional,Regression,Smoke,Sanity)
  execution_type: ENUM(Manual,Automated,SemiAutomated)
  created_by: UUID
  created_at: TIMESTAMP
  updated_by: UUID
  updated_at: TIMESTAMP
  version: INTEGER
}

-- 테스트 단계 테이블
TestStep {
  id: UUID
  test_case_id: UUID
  step_number: INTEGER
  action: TEXT
  expected_result: TEXT
  attachments: JSON
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- 폴더 구조 테이블
Folder {
  id: UUID
  project_id: UUID
  parent_id: UUID (nullable)
  name: VARCHAR(100)
  description: TEXT
  path: VARCHAR(500)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- 프로젝트 테이블
Project {
  id: UUID
  name: VARCHAR(100)
  description: TEXT
  settings: JSON
  created_by: UUID
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- 사용자 테이블
User {
  id: UUID
  email: VARCHAR(255)
  name: VARCHAR(100)
  role: ENUM(Admin,Manager,Tester,Viewer)
  password_hash: VARCHAR(255)
  last_login: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- 코멘트 테이블
Comment {
  id: UUID
  test_case_id: UUID
  user_id: UUID
  content: TEXT
  attachments: JSON
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- 버전 히스토리 테이블
TestCaseHistory {
  id: UUID
  test_case_id: UUID
  version: INTEGER
  changes: JSON
  changed_by: UUID
  change_reason: TEXT
  created_at: TIMESTAMP
}
```

## 8. 화면 흐름

### 8.1 주요 화면 구성
```
1. 로그인/회원가입
   ↓
2. 프로젝트 선택
   ↓
3. 메인 대시보드
   ├── 4. 테스트 케이스 목록
   │   ├── 5. 테스트 케이스 생성
   │   ├── 6. 테스트 케이스 상세
   │   │   ├── 7. 편집 모드
   │   │   └── 8. 버전 히스토리
   │   └── 9. 대량 작업
   ├── 10. 폴더 관리
   ├── 11. 검색/필터
   ├── 12. 가져오기/내보내기
   └── 13. 설정
       ├── 프로젝트 설정
       ├── 사용자 관리
       └── 통합 설정
```

## 9. 개발 로드맵

### Phase 1: 핵심 기능 (Month 1-2)
```
주요 개발 항목:
✓ 기본 CRUD 기능
  - 테스트 케이스 생성
  - 테스트 케이스 조회
  - 테스트 케이스 수정
  - 테스트 케이스 삭제
✓ 폴더 구조 관리
✓ 기본 검색 기능
✓ 사용자 인증
```

### Phase 2: 관리 기능 (Month 3-4)
```
주요 개발 항목:
✓ 버전 관리 시스템
✓ 검토 및 승인 워크플로우
✓ 고급 검색 및 필터
✓ 태그 및 분류 시스템
✓ 대량 편집 기능
```

### Phase 3: 협업 기능 (Month 5-6)
```
주요 개발 항목:
✓ 코멘트 시스템
✓ 실시간 알림
✓ 공유 기능
✓ 권한 관리 고도화
✓ 활동 로그
```

### Phase 4: 통합 및 확장 (Month 7-8)
```
주요 개발 항목:
✓ Jira 통합
✓ CI/CD 통합
✓ API 개발
✓ 가져오기/내보내기 고도화
✓ 리포팅 기능
```

### Phase 5: 최적화 및 고급 기능 (Month 9-10)
```
주요 개발 항목:
✓ 성능 최적화
✓ 모바일 최적화
✓ 테스트 케이스 템플릿 마켓
✓ AI 기반 추천 (선택)
✓ 플러그인 시스템 (선택)
```

## 10. 예상 리소스

### 10.1 개발팀 구성
```
필수 인력:
- 프론트엔드 개발자: 2명
- 백엔드 개발자: 2명
- QA 엔지니어: 1명
- UI/UX 디자이너: 1명
- 프로덕트 매니저: 1명
- DevOps 엔지니어: 1명 (파트타임)

총 8명 (7.5 FTE)
```

### 10.2 개발 환경
```
필요 도구:
- 개발 서버: 2대 (개발, 스테이징)
- 클라우드 크레딧: 월 $500
- 개발 도구 라이선스
  - IDE (JetBrains/VS Code)
  - 디자인 도구 (Figma)
  - 프로젝트 관리 (Jira/Notion)
- SSL 인증서
- 도메인
```

## 11. 성공 지표

### 11.1 단기 목표 (6개월)
```
측정 지표:
- MVP 출시 완료
- 베타 사용자 50명 확보
- 핵심 기능 완성도 100%
- 버그 수준: Critical 0, Major < 5
- 사용자 피드백 점수: 4.0/5.0
```

### 11.2 장기 목표 (1년)
```
측정 지표:
- 활성 사용자: 500+
- 유료 고객: 10+ 기업
- 월간 활성 테스트 케이스: 10,000+
- 시스템 안정성: 99.9%
- NPS 점수: 50+
```

## 12. 위험 요소 및 대응 방안

### 12.1 기술적 위험
```
위험 요소:
1. 확장성 문제
   - 대응: 초기부터 확장 가능한 아키텍처 설계
   
2. 데이터 마이그레이션
   - 대응: 강력한 가져오기/내보내기 도구 개발
   
3. 성능 저하
   - 대응: 캐싱 전략, 데이터베이스 최적화
```

### 12.2 비즈니스 위험
```
위험 요소:
1. 경쟁 제품 (TestRail, Zephyr)
   - 대응: 차별화된 UX, 경쟁력 있는 가격
   
2. 사용자 채택률 저조
   - 대응: 무료 체험, 온보딩 프로그램
   
3. 요구사항 변경
   - 대응: 애자일 개발, 빠른 피드백 사이클
```

## 13. 부록

### 13.1 용어집
```
- Test Case: 특정 시나리오를 검증하기 위한 단계별 절차
- Test Suite: 관련된 테스트 케이스들의 모음
- Test Step: 테스트 케이스의 개별 실행 단계
- Precondition: 테스트 실행 전 필요한 조건
- Expected Result: 테스트 단계의 예상 결과
- Priority: 테스트 케이스의 중요도 (P0-P4)
- Regression Test: 기존 기능 정상 동작 확인 테스트
- Smoke Test: 핵심 기능 기본 동작 확인 테스트
```

### 13.2 참고 자료
```
- IEEE 829-2008 (Software Test Documentation)
- ISO/IEC/IEEE 29119 (Software Testing)
- ISTQB Glossary
- TestRail Documentation
- Jira REST API Documentation
```

### 13.3 변경 이력
```
버전 | 날짜 | 변경 내용 | 작성자
-----|------|-----------|--------
1.0  | 2024-01-15 | 초기 작성 | PM Team
1.1  | 2024-01-20 | 기술 스택 확정 | Dev Team
1.2  | 2024-01-25 | UI/UX 요구사항 추가 | Design Team
```

---

**문서 정보**
- 문서명: 테스트 케이스 관리 소프트웨어 PRD
- 버전: 1.2
- 작성일: 2024-01-15
- 최종 수정일: 2024-01-25
- 상태: 검토 완료
- 담당자: Product Manager

**연락처**
- 제품 문의: product@tcms.com
- 기술 문의: tech@tcms.com
- 일반 문의: info@tcms.com