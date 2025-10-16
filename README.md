# TCMS - 테스트 케이스 관리 시스템

TestRail과 유사한 기능을 제공하는 현대적인 테스트 관리 플랫폼입니다.

## 🚀 기술 스택

### 백엔드
- **Python 3.11+** with FastAPI
- **PostgreSQL 14+** - 주 데이터베이스
- **Redis 7+** - 캐싱
- **SQLAlchemy** - ORM
- **Pydantic** - 데이터 검증

### 프론트엔드
- **React 18** with TypeScript
- **Material-UI** - UI 컴포넌트
- **React Router** - 라우팅
- **React Query** - 데이터 페칭
- **Axios** - HTTP 클라이언트
- **Vite** - 빌드 도구

### 인프라
- **Docker** & **Docker Compose**
- **Uvicorn** - ASGI 서버

## 📋 주요 기능 (MVP)

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 프로젝트 관리 (CRUD)
- ✅ 테스트 케이스 관리
  - 계층적 폴더 구조
  - 우선순위 및 타입 분류
  - 태그 시스템
- ✅ 테스트 실행 관리
  - 테스트 실행 계획
  - 결과 기록
  - 상태 추적
- ✅ 역할 기반 접근 제어 (RBAC)

## 🛠️ 설치 및 실행

### Docker Compose 사용 (권장)

```bash
# 환경 변수 파일 생성
cd backend
cp .env.example .env
cd ..

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스 접속:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 수동 설치

#### 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL 등을 설정

# 데이터베이스 실행 (PostgreSQL, Redis 필요)
# 예: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=tcms_password postgres:14

# 서버 실행
python run.py
```

#### 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📁 프로젝트 구조

```
TestCaseTool/
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── api/           # API 엔드포인트
│   │   │   └── v1/
│   │   │       ├── auth.py        # 인증
│   │   │       ├── projects.py    # 프로젝트
│   │   │       ├── testcases.py   # 테스트 케이스
│   │   │       └── testruns.py    # 테스트 실행
│   │   ├── core/          # 설정 및 보안
│   │   ├── db/            # 데이터베이스
│   │   ├── models/        # SQLAlchemy 모델
│   │   ├── schemas/       # Pydantic 스키마
│   │   └── main.py        # 애플리케이션 진입점
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 컴포넌트
│   │   ├── contexts/      # React Context
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── claude/                # PRD 문서
├── docker-compose.yml
├── CLAUDE.md             # Claude Code 가이드
└── README.md
```

## 🔑 기본 사용자 역할

- **Admin**: 전체 시스템 관리
- **QA Manager**: 프로젝트 관리, 테스트 계획
- **QA Engineer**: 테스트 케이스 작성 및 실행
- **Developer**: 읽기 및 코멘트
- **Viewer**: 읽기 전용

## 🔗 API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인

### 프로젝트
- `GET /api/v1/projects/` - 프로젝트 목록
- `POST /api/v1/projects/` - 프로젝트 생성
- `GET /api/v1/projects/{id}` - 프로젝트 조회
- `PUT /api/v1/projects/{id}` - 프로젝트 수정
- `DELETE /api/v1/projects/{id}` - 프로젝트 삭제

### 테스트 케이스
- `GET /api/v1/testcases/` - 테스트 케이스 목록
- `POST /api/v1/testcases/` - 테스트 케이스 생성
- `GET /api/v1/testcases/{id}` - 테스트 케이스 조회
- `PUT /api/v1/testcases/{id}` - 테스트 케이스 수정
- `DELETE /api/v1/testcases/{id}` - 테스트 케이스 삭제

### 테스트 실행
- `GET /api/v1/testruns/` - 테스트 실행 목록
- `POST /api/v1/testruns/` - 테스트 실행 생성
- `GET /api/v1/testruns/{id}` - 테스트 실행 조회
- `PUT /api/v1/testruns/{id}` - 테스트 실행 수정
- `GET /api/v1/testruns/{id}/results` - 테스트 결과 목록
- `PUT /api/v1/testruns/results/{id}` - 테스트 결과 수정

## 🧪 테스트

```bash
cd backend
pytest
```

## 📝 다음 단계 (Phase 2)

- [ ] Jira 통합
- [ ] 고급 보고서 및 대시보드
- [ ] 테스트 계획 관리
- [ ] 이메일 알림
- [ ] 파일 첨부 기능

## 📄 라이선스

MIT

## 👥 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요.

## 📞 문의

- 제품 관리팀: product@tcms.com
- 기술 지원: support@tcms.com
