# TCMS - 테스트 케이스 관리 시스템

TMS와 유사한 기능을 제공하는 현대적인 테스트 관리 플랫폼입니다.

## 🚀 기술 스택

### 백엔드
- **Python 3.13** with FastAPI 0.95.2
- **Firebase Firestore** - NoSQL 데이터베이스
- **Pydantic 1.10.18** - 데이터 검증
- **Python-Jose** - JWT 인증
- **Passlib** - 비밀번호 해싱 (pbkdf2_sha256)

### 프론트엔드
- **React 19** with TypeScript
- **Tailwind CSS v4** - 스타일링
- **React Router** - 라우팅
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **Vite** - 빌드 도구
- **Lucide React** - 아이콘

### 배포 인프라
- **Render.com** - 백엔드 호스팅 (무료 플랜)
- **Firebase Hosting** - 프론트엔드 호스팅
- **Uvicorn** - ASGI 서버

## 📋 구현 기능

### ✅ Phase 1 - 완료
- **사용자 인증 및 계정 관리**
  - JWT 기반 회원가입/로그인
  - 비밀번호 찾기/재설정
  - 계정 잠금 (5회 로그인 실패 시 30분)
  - 임시 비밀번호 발급 및 강제 변경
  - 내 계정 관리 (비밀번호 변경)

- **역할 기반 접근 제어 (RBAC)**
  - Admin - 전체 시스템 관리
  - QA Manager - 프로젝트 관리, 테스트 계획
  - QA Engineer - 테스트 케이스 작성 및 실행
  - Developer - 읽기 및 코멘트
  - Viewer - 읽기 전용 (신규 가입자 기본 역할)

- **프로젝트 관리**
  - CRUD 작업 (생성, 조회, 수정, 삭제)
  - 프로젝트 키 자동 생성
  - 프로젝트별 권한 관리

- **테스트 케이스 관리**
  - CRUD 작업
  - 버전 히스토리 자동 저장
  - 폴더 구조 지원
  - 우선순위 (Low, Medium, High, Critical)
  - 테스트 타입 (Functional, Regression, Smoke, Integration, Performance, Security)
  - 태그 기반 분류
  - Excel/PDF 내보내기

### ✅ Phase 2 - 완료
- **테스트 실행 관리**
  - 테스트 실행 생성 및 관리
  - 테스트 케이스 선택 (전체 선택/해제)
  - 상태 관리 (Planned, In Progress, Completed, Cancelled)
  - 테스트 결과 기록 (Passed, Failed, Blocked, Skipped)
  - 실행 히스토리 추적

- **대시보드 및 통계**
  - 프로젝트/테스트 케이스/테스트 실행 통계
  - 전체 통과율 및 추세
  - 우선순위별 분포
  - 자주 실패하는 테스트 케이스
  - 최근 활동 내역
  - 통과율 추세 차트

- **이슈 관리 (칸반 보드)**
  - 테스트 실행별 이슈 추적
  - 칸반 보드 UI (Todo, In Progress, In Review, Done)
  - 드래그 앤 드롭으로 상태 변경
  - 우선순위 및 이슈 타입 관리 (Bug, Improvement, Task)
  - 테스트 케이스/테스트 실행 연동
  - 담당자 지정

### 📅 Phase 3 - 계획 중
- Jira/GitHub 이슈 통합
- 이메일 알림
- 파일 첨부
- 테스트 자동화 프레임워크 연동

### 📅 Phase 4 - 미래 계획
- SSO/MFA 인증
- AI 기반 테스트 추천
- 성능 분석 대시보드
- 실시간 협업 기능

## 🌐 배포된 서비스

- **프론트엔드**: https://testcase-e27a4.web.app
- **백엔드 API**: https://testcase-tool.onrender.com
- **API 문서**: https://testcase-tool.onrender.com/docs

### 🔑 테스트 계정

관리자 계정으로 로그인하려면 `backend/create_admin.py` 스크립트를 실행하여 생성된 계정 정보를 사용하세요.

## 🛠️ 로컬 개발 환경 설정

### 필수 요구사항
- Python 3.13+
- Node.js 18+
- Firebase 프로젝트 (Firestore 활성화)

### 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집:
# - SECRET_KEY: JWT 토큰용 시크릿 키
# - FIREBASE_SERVICE_ACCOUNT_PATH: Firebase 서비스 계정 JSON 파일 경로

# Firebase 서비스 계정 키 다운로드
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# 다운로드한 파일을 backend/firebase-service-account.json으로 저장

# 관리자 계정 생성
python create_admin.py

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
# .env.local 파일 생성:
# VITE_API_URL=http://localhost:8000/api/v1

# 개발 서버 실행
npm run dev
```

서비스 접속:
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 📁 프로젝트 구조

```
TestCase-Tool/
├── backend/                      # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/              # API 엔드포인트
│   │   │   ├── auth.py          # 인증 (회원가입/로그인/비밀번호 재설정)
│   │   │   ├── users.py         # 사용자 관리
│   │   │   ├── projects.py      # 프로젝트 관리
│   │   │   ├── testcases.py     # 테스트 케이스 관리
│   │   │   ├── folders.py       # 폴더 관리
│   │   │   ├── testruns.py      # 테스트 실행 관리
│   │   │   ├── testresults.py   # 테스트 결과 관리
│   │   │   ├── issues.py        # 이슈 관리
│   │   │   └── statistics.py    # 통계 및 대시보드
│   │   ├── core/                # 핵심 설정
│   │   │   ├── config.py        # 환경 변수 설정
│   │   │   ├── security.py      # JWT, 비밀번호 해싱
│   │   │   └── permissions.py   # 권한 검증
│   │   ├── db/                  # 데이터베이스
│   │   │   └── firestore.py     # Firestore 헬퍼 클래스
│   │   ├── schemas/             # Pydantic 스키마
│   │   │   ├── user.py          # 사용자 + UserRole enum
│   │   │   ├── project.py       # 프로젝트
│   │   │   ├── testcase.py      # 테스트 케이스 + enums
│   │   │   ├── testrun.py       # 테스트 실행 + enums
│   │   │   └── issue.py         # 이슈 + enums
│   │   └── main.py              # FastAPI 애플리케이션
│   ├── firebase-service-account.json  # Firebase 인증 키
│   ├── create_admin.py          # 관리자 계정 생성 스크립트
│   └── requirements.txt         # Python 의존성
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/          # 재사용 컴포넌트
│   │   │   ├── Layout.tsx       # TMS 스타일 레이아웃
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ChangePasswordModal.tsx
│   │   ├── contexts/            # React Context
│   │   │   └── AuthContext.tsx  # 인증 상태 관리
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ForgotCredentials.tsx
│   │   │   ├── MyAccount.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── DashboardEnhanced.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── TestCases.tsx
│   │   │   ├── TestCaseDetail.tsx
│   │   │   ├── TestRuns.tsx
│   │   │   ├── TestRunDetail.tsx
│   │   │   └── IssueBoard.tsx
│   │   ├── services/            # API 서비스
│   │   │   ├── api.ts
│   │   │   └── issues.ts
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js       # Tailwind CSS v4 설정
├── claude/                      # PRD 문서
│   └── tcms-prd.md
├── render.yaml                  # Render.com 배포 설정
├── CLAUDE.md                    # Claude Code 가이드
└── README.md
```

## 🗄️ Firestore 데이터베이스 구조

### Collections
```
users/                           # 사용자
├── {userId}/
│   ├── email: string
│   ├── username: string
│   ├── full_name: string
│   ├── role: string (admin|qa_manager|qa_engineer|developer|viewer)
│   ├── hashed_password: string
│   ├── is_active: boolean
│   ├── is_temp_password: boolean
│   ├── is_locked: boolean
│   ├── failed_login_attempts: number
│   ├── locked_until: timestamp?
│   ├── created_at: timestamp
│   └── updated_at: timestamp

projects/                        # 프로젝트
├── {projectId}/
│   ├── name: string
│   ├── key: string
│   ├── description: string
│   ├── owner_id: string
│   ├── created_at: timestamp
│   └── updated_at: timestamp

folders/                         # 폴더
├── {folderId}/
│   ├── project_id: string
│   ├── name: string
│   ├── parent_folder_id: string?
│   ├── created_at: timestamp
│   └── updated_at: timestamp

testcases/                       # 테스트 케이스
├── {testcaseId}/
│   ├── project_id: string
│   ├── folder_id: string?
│   ├── title: string
│   ├── description: string
│   ├── preconditions: string
│   ├── steps: string
│   ├── expected_result: string
│   ├── priority: string (low|medium|high|critical)
│   ├── test_type: string (functional|regression|smoke|integration|performance|security)
│   ├── tags: string
│   ├── version: number
│   ├── created_by: string
│   ├── created_at: timestamp
│   └── updated_at: timestamp

testcase_history/                # 테스트 케이스 버전 히스토리
├── {historyId}/
│   ├── testcase_id: string
│   ├── version: number
│   ├── changed_by: string
│   ├── change_note: string
│   ├── snapshot: object
│   └── created_at: timestamp

testruns/                        # 테스트 실행
├── {testrunId}/
│   ├── project_id: string
│   ├── name: string
│   ├── description: string
│   ├── status: string (planned|in_progress|completed|cancelled|blocked)
│   ├── assignee_id: string?
│   ├── environment: string?
│   ├── milestone: string?
│   ├── test_case_ids: array<string>
│   ├── started_at: timestamp?
│   ├── completed_at: timestamp?
│   ├── created_at: timestamp
│   └── updated_at: timestamp

testresults/                     # 테스트 결과
├── {resultId}/
│   ├── test_run_id: string
│   ├── test_case_id: string
│   ├── tester_id: string
│   ├── status: string (untested|passed|failed|blocked|skipped)
│   ├── actual_result: string?
│   ├── comment: string?
│   ├── defect_url: string?
│   ├── execution_time: number?
│   ├── tested_at: timestamp?
│   ├── history: array<object>
│   ├── created_at: timestamp
│   └── updated_at: timestamp

issues/                          # 이슈
├── {issueId}/
│   ├── project_id: string
│   ├── testrun_id: string?
│   ├── testcase_id: string?
│   ├── title: string
│   ├── description: string?
│   ├── status: string (todo|in_progress|in_review|done)
│   ├── priority: string (low|medium|high|critical)
│   ├── issue_type: string (bug|improvement|task)
│   ├── assigned_to: string?
│   ├── created_by: string
│   ├── created_at: timestamp
│   └── updated_at: timestamp
```

## 🔑 기본 사용자 역할

- **Admin**: 전체 시스템 관리, 사용자 계정 잠금 해제
- **QA Manager**: 프로젝트 관리, 테스트 계획, 테스트 실행 생성
- **QA Engineer**: 테스트 케이스 작성 및 실행, 이슈 생성
- **Developer**: 읽기 및 코멘트, 테스트 결과 조회
- **Viewer**: 읽기 전용 (신규 가입 시 기본 역할)

## 🔗 주요 API 엔드포인트

상세한 API 문서는 https://testcase-tool.onrender.com/docs 에서 확인하세요.

### 인증 (`/api/v1/auth`)
- `POST /register` - 회원가입 (자동으로 viewer 역할 할당)
- `POST /login` - 로그인 (JWT 토큰 발급)
- `GET /me` - 현재 사용자 정보
- `POST /forgot-password` - 비밀번호 찾기 (임시 비밀번호 발급)
- `POST /change-password` - 비밀번호 변경

### 사용자 (`/api/v1/users`)
- `GET /` - 사용자 목록 조회
- `GET /{user_id}` - 사용자 상세 조회
- `POST /{user_id}/unlock` - 계정 잠금 해제 (admin only)

### 프로젝트 (`/api/v1/projects`)
- `GET /` - 프로젝트 목록 조회
- `POST /` - 프로젝트 생성
- `GET /{project_id}` - 프로젝트 상세 조회
- `PUT /{project_id}` - 프로젝트 수정
- `DELETE /{project_id}` - 프로젝트 삭제

### 테스트 케이스 (`/api/v1/testcases`)
- `GET /` - 테스트 케이스 목록 조회 (프로젝트/폴더 필터링)
- `POST /` - 테스트 케이스 생성
- `GET /{testcase_id}` - 테스트 케이스 상세 조회
- `PUT /{testcase_id}` - 테스트 케이스 수정 (자동 버전 히스토리)
- `DELETE /{testcase_id}` - 테스트 케이스 삭제
- `GET /{testcase_id}/history` - 버전 히스토리 조회
- `GET /export/excel` - Excel 내보내기
- `GET /export/pdf` - PDF 내보내기

### 테스트 실행 (`/api/v1/testruns`)
- `GET /` - 테스트 실행 목록 조회
- `POST /` - 테스트 실행 생성
- `GET /{testrun_id}` - 테스트 실행 상세 조회
- `PUT /{testrun_id}` - 테스트 실행 수정
- `DELETE /{testrun_id}` - 테스트 실행 삭제
- `GET /{testrun_id}/results` - 테스트 결과 조회

### 테스트 결과 (`/api/v1/testruns/results`)
- `POST /` - 테스트 결과 생성
- `PUT /{result_id}` - 테스트 결과 수정

### 이슈 (`/api/v1/issues`)
- `GET /` - 이슈 목록 조회 (프로젝트/테스트 실행 필터링)
- `POST /` - 이슈 생성
- `GET /{issue_id}` - 이슈 상세 조회
- `PUT /{issue_id}` - 이슈 수정
- `PATCH /{issue_id}/status` - 이슈 상태 변경 (칸반 보드용)
- `DELETE /{issue_id}` - 이슈 삭제

### 통계 (`/api/v1/statistics`)
- `GET /dashboard` - 대시보드 통합 통계
- `GET /trends` - 통과율 추세 데이터

## 💰 비용 분석 (현재 배포)

### 현재 구성 - **$0/월**
- ✅ Render.com (백엔드): **무료 플랜** - 750시간/월, 512MB RAM
- ✅ Firebase Firestore: **무료 플랜** - 1GB 저장소, 50K reads/day
- ✅ Firebase Hosting: **무료 플랜** - 10GB/월 전송량

### 예상 확장 비용
- Render.com Starter ($7/월): 항상 온라인, 512MB RAM
- Firestore Blaze (종량제): $0.18/GB/월
- 총 예상 비용: **$10-15/월** (중소규모 팀)

## 🎯 주요 기능

### 대시보드
- 프로젝트/테스트 케이스/테스트 실행 통계 카드
- 전체 통과율 및 실시간 업데이트
- 우선순위별 테스트 케이스 분포
- 자주 실패하는 테스트 케이스 목록
- 최근 활동 (프로젝트, 테스트 케이스, 테스트 실행)
- 30일간 통과율 추세 차트

### 테스트 실행
- 프로젝트별 테스트 케이스 선택
- 전체 선택/선택 해제 버튼
- 실시간 상태 변경 (드롭다운)
- 테스트 결과 기록 및 히스토리
- Excel/PDF 리포트 생성

### 이슈 관리
- 테스트 실행별 이슈 필터링
- 칸반 보드 UI (드래그 앤 드롭)
- 우선순위 및 타입별 색상 코딩
- 테스트 케이스/실행 연동
- 담당자 지정 및 추적

### 계정 보안
- 5회 로그인 실패 시 30분 계정 잠금
- 임시 비밀번호 발급 및 강제 변경
- 비밀번호 변경 기능
- Admin의 계정 잠금 해제 권한

## 📝 라이선스

Kimdaeng

## 👥 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!
