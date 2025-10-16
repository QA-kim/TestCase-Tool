# TCMS 로컬 실행 가이드

## ✅ 현재 상태

- **백엔드**: ✅ 실행 중 (http://localhost:8000)
- **프론트엔드**: ⏳ 설정 필요
- **데이터베이스**: ✅ SQLite (backend/tcms.db)

## 🚀 프론트엔드 실행하기

### 새 터미널을 열고 다음 명령어를 실행하세요:

```bash
# 1. frontend 디렉토리로 이동
cd frontend

# 2. NPM 패키지 설치 (최초 1회만)
npm install

# 3. 개발 서버 실행
npm run dev
```

설치 시간: 약 2-5분 소요

## 📍 접속 주소

설치가 완료되면:

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 👤 첫 사용자 생성

### 방법 1: API 문서 사용 (권장)

1. http://localhost:8000/docs 접속
2. `POST /api/v1/auth/register` 클릭
3. "Try it out" 클릭
4. 다음 JSON 입력:
   ```json
   {
     "email": "admin@tcms.com",
     "username": "admin",
     "password": "admin123",
     "full_name": "관리자",
     "role": "admin"
   }
   ```
5. "Execute" 클릭

### 방법 2: curl 사용

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tcms.com",
    "username": "admin",
    "password": "admin123",
    "full_name": "관리자",
    "role": "admin"
  }'
```

## 🔐 로그인

프론트엔드(http://localhost:3000)에서:
- **사용자명**: admin
- **비밀번호**: admin123

## 🛑 서버 중지

### 백엔드 중지:
- 백엔드 터미널에서 `Ctrl+C`

### 프론트엔드 중지:
- 프론트엔드 터미널에서 `Ctrl+C`

## 💾 데이터베이스

- **위치**: `backend/tcms.db` (SQLite 파일)
- PostgreSQL 불필요 - SQLite로 간편하게 시작!
- 데이터 초기화: `backend/tcms.db` 파일 삭제 후 서버 재시작

## 📚 추가 문서

- [SETUP_LOCAL.md](SETUP_LOCAL.md) - 상세 설정 가이드
- [README.md](README.md) - 프로젝트 전체 문서
- [CLAUDE.md](CLAUDE.md) - 아키텍처 가이드

## ⚠️ 문제 해결

### 포트가 이미 사용 중인 경우

**백엔드 포트 8000 충돌:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**프론트엔드 포트 3000 충돌:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### NPM 설치 오류

```bash
# 캐시 정리 후 재설치
npm cache clean --force
npm install
```

## 🎉 다음 단계

1. 사용자 생성 및 로그인
2. 프로젝트 생성
3. 테스트 케이스 작성
4. 테스트 실행 계획

모든 기능은 직관적인 UI로 제공됩니다!
