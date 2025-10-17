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
- **React 18** with TypeScript
- **Tailwind CSS v4** - 스타일링
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Vite** - 빌드 도구

### 배포 인프라
- **Render.com** - 백엔드 호스팅 (무료 플랜)
- **Firebase Hosting** - 프론트엔드 호스팅
- **Uvicorn** - ASGI 서버

## 📋 현재 구현 기능

### ✅ 완료된 기능
- **사용자 인증** - JWT 기반 회원가입/로그인
- **프로젝트 관리** - CRUD 작업
- **테스트 케이스 관리** - CRUD 작업 + 버전 히스토리
- **역할 기반 접근 제어** - Admin, QA Manager, QA Engineer, Developer, Viewer
- **TMS 스타일 UI** - 3단 레이아웃 (사이드바, 콘텐츠, 상세보기)

### 🔄 진행 중
- 테스트 실행 관리
- 대시보드 및 통계

### 📅 계획 중
- Jira 통합
- 고급 리포팅
- 이메일 알림
- 파일 첨부

## 🌐 배포된 서비스

- **프론트엔드**: https://testcase-e27a4.web.app
- **백엔드 API**: https://testcase-tool.onrender.com
- **API 문서**: https://testcase-tool.onrender.com/docs

### 🔑 테스트 계정
```
Email: admin@tcms.com
Password: admin123
```

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
TestCaseTool/
├── backend/                      # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/              # API 엔드포인트
│   │   │   ├── auth.py          # 인증 (회원가입/로그인)
│   │   │   ├── projects.py      # 프로젝트 관리
│   │   │   └── testcases.py     # 테스트 케이스 관리
│   │   ├── core/                # 핵심 설정
│   │   │   ├── config.py        # 환경 변수 설정
│   │   │   └── security.py      # JWT, 비밀번호 해싱
│   │   ├── db/                  # 데이터베이스
│   │   │   └── firestore.py     # Firestore 헬퍼 함수
│   │   ├── schemas/             # Pydantic 스키마
│   │   │   ├── user.py          # 사용자 + UserRole enum
│   │   │   ├── project.py       # 프로젝트
│   │   │   ├── testcase.py      # 테스트 케이스 + enums
│   │   │   └── testrun.py       # 테스트 실행 + enums
│   │   └── main.py              # FastAPI 애플리케이션
│   ├── firebase-service-account.json  # Firebase 인증 키
│   ├── create_admin.py          # 관리자 계정 생성 스크립트
│   └── requirements.txt         # Python 의존성
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/          # 재사용 컴포넌트
│   │   │   ├── Layout.tsx       # TMS 스타일 레이아웃
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/            # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   └── TestCases.tsx
│   │   ├── services/            # API 서비스
│   │   │   └── api.ts
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
│   ├── created_at: timestamp
│   └── updated_at: timestamp

projects/                        # 프로젝트
├── {projectId}/
│   ├── name: string
│   ├── description: string
│   ├── owner_id: string
│   ├── created_at: timestamp
│   └── updated_at: timestamp

testcases/                       # 테스트 케이스
├── {testcaseId}/
│   ├── project_id: string
│   ├── title: string
│   ├── description: string
│   ├── preconditions: string
│   ├── steps: string
│   ├── expected_result: string
│   ├── priority: string (low|medium|high|critical)
│   ├── test_type: string (functional|regression|smoke|integration|performance|security)
│   ├── tags: string
│   ├── folder_id: string?
│   ├── created_at: timestamp
│   └── updated_at: timestamp

testcase_history/                # 테스트 케이스 버전 히스토리
├── {historyId}/
│   ├── testcase_id: string
│   ├── version: number
│   ├── changed_by: string
│   ├── change_note: string
│   └── created_at: timestamp
```

## 🔑 기본 사용자 역할

- **Admin**: 전체 시스템 관리
- **QA Manager**: 프로젝트 관리, 테스트 계획
- **QA Engineer**: 테스트 케이스 작성 및 실행
- **Developer**: 읽기 및 코멘트
- **Viewer**: 읽기 전용

## 🔗 API 엔드포인트

상세한 API 문서는 https://testcase-tool.onrender.com/docs 에서 확인하세요.

### 인증 (`/api/v1/auth`)
- `POST /register` - 회원가입 (자동으로 viewer 역할 할당)
- `POST /login` - 로그인 (JWT 토큰 발급)
- `GET /me` - 현재 사용자 정보

### 프로젝트 (`/api/v1/projects`)
- `GET /` - 프로젝트 목록 조회
- `POST /` - 프로젝트 생성
- `GET /{project_id}` - 프로젝트 상세 조회
- `PUT /{project_id}` - 프로젝트 수정
- `DELETE /{project_id}` - 프로젝트 삭제

### 테스트 케이스 (`/api/v1/testcases`)
- `GET /` - 테스트 케이스 목록 조회 (프로젝트 필터링 가능)
- `POST /` - 테스트 케이스 생성
- `GET /{testcase_id}` - 테스트 케이스 상세 조회
- `PUT /{testcase_id}` - 테스트 케이스 수정 (자동 버전 히스토리 저장)
- `DELETE /{testcase_id}` - 테스트 케이스 삭제
- `GET /{testcase_id}/history` - 버전 히스토리 조회

## 💰 비용 분석 (현재 배포)

### 현재 구성 - **$0/월**
- ✅ Render.com (백엔드): **무료 플랜** - 750시간/월, 512MB RAM
- ✅ Firebase Firestore: **무료 플랜** - 1GB 저장소, 50K reads/day
- ✅ Firebase Hosting: **무료 플랜** - 10GB/월 전송량

### 예상 확장 비용
- Render.com Starter ($7/월): 항상 온라인, 512MB RAM
- Firestore Blaze (종량제): $0.18/GB/월
- 총 예상 비용: **$10-15/월** (중소규모 팀)
