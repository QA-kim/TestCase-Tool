# 로컬 환경 설정 가이드

이 가이드는 Docker 없이 로컬 환경에서 TCMS를 실행하는 방법을 안내합니다.

## 1. 사전 요구사항

### 필수 설치
- **Python 3.11+**: [python.org](https://www.python.org/downloads/)
- **Node.js 20+**: [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+**: [postgresql.org](https://www.postgresql.org/download/)

### 선택 설치
- **Redis 7+**: [redis.io](https://redis.io/download/) (캐싱용, 선택사항)

## 2. PostgreSQL 데이터베이스 설정

### Windows에서 PostgreSQL 설치 후:

1. **PostgreSQL 서비스 시작**
   - 서비스 앱에서 'postgresql-x64-14' 서비스 시작
   - 또는 시작 메뉴에서 "SQL Shell (psql)" 실행

2. **데이터베이스 생성**
   ```sql
   -- psql에 postgres 사용자로 접속 후 실행
   CREATE DATABASE tcms_db;
   CREATE USER tcms_user WITH PASSWORD 'tcms_password';
   GRANT ALL PRIVILEGES ON DATABASE tcms_db TO tcms_user;

   -- PostgreSQL 15+ 에서는 추가로 실행
   \c tcms_db
   GRANT ALL ON SCHEMA public TO tcms_user;
   ```

3. **연결 확인**
   ```bash
   psql -U tcms_user -d tcms_db -h localhost
   ```

## 3. 백엔드 설정 및 실행

### 3-1. 환경 설정

```bash
# backend 디렉토리로 이동
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows (CMD):
venv\Scripts\activate.bat
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Git Bash/WSL:
source venv/Scripts/activate
```

### 3-2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3-3. 환경변수 설정

```bash
# .env 파일 생성
copy .env.example .env  # Windows
# 또는
cp .env.example .env    # Git Bash/WSL
```

`.env` 파일 내용 확인 및 수정:
```env
DATABASE_URL=postgresql://tcms_user:tcms_password@localhost:5432/tcms_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_NAME=TCMS
DEBUG=True
```

**주의**: Redis가 없는 경우 백엔드 코드에서 Redis 관련 부분 제거 필요

### 3-4. 백엔드 서버 실행

```bash
# run.py 실행
python run.py

# 또는 직접 uvicorn 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버 실행 확인:
- API 문서: http://localhost:8000/docs
- 기본 엔드포인트: http://localhost:8000/

## 4. 프론트엔드 설정 및 실행

### 4-1. 의존성 설치

**새 터미널을 열고:**

```bash
# frontend 디렉토리로 이동
cd frontend

# NPM 패키지 설치
npm install
```

### 4-2. 개발 서버 실행

```bash
npm run dev
```

프론트엔드 접속: http://localhost:3000

## 5. 첫 사용자 생성

### 5-1. API를 통한 회원가입

브라우저에서 http://localhost:8000/docs 접속 후:

1. `POST /api/v1/auth/register` 엔드포인트 선택
2. "Try it out" 클릭
3. 다음 JSON 입력:
   ```json
   {
     "email": "admin@tcms.com",
     "username": "admin",
     "password": "admin123",
     "full_name": "관리자",
     "role": "admin"
   }
   ```
4. "Execute" 클릭

### 5-2. 로그인

프론트엔드(http://localhost:3000)에서:
- 사용자명: `admin`
- 비밀번호: `admin123`

## 6. 문제 해결

### PostgreSQL 연결 오류
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```
**해결방법**:
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 DATABASE_URL이 올바른지 확인
- 방화벽에서 포트 5432 허용 확인

### Python 가상환경 활성화 오류 (PowerShell)
```
cannot be loaded because running scripts is disabled on this system
```
**해결방법**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### NPM 설치 오류
**해결방법**:
```bash
# npm 캐시 정리
npm cache clean --force
npm install
```

### 포트 이미 사용 중
**백엔드 (8000) 또는 프론트엔드 (3000) 포트가 사용 중인 경우**:

Windows에서 프로세스 종료:
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID <PID> /F
```

## 7. 개발 워크플로우

1. **백엔드 개발**
   - 코드 수정 시 자동 리로드 (uvicorn --reload)
   - API 테스트: http://localhost:8000/docs

2. **프론트엔드 개발**
   - 코드 수정 시 자동 리로드 (Vite HMR)
   - 브라우저: http://localhost:3000

3. **데이터베이스 변경**
   - 모델 수정 후 서버 재시작하면 SQLAlchemy가 자동으로 테이블 생성
   - 프로덕션에서는 Alembic migration 사용 권장

## 8. 다음 단계

- [README.md](README.md) - 전체 프로젝트 문서
- [CLAUDE.md](CLAUDE.md) - 프로젝트 아키텍처 가이드
- API 문서: http://localhost:8000/docs
