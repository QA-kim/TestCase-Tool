# 🎯 Firebase 완전 무료 배포 완료!

## ✅ 완료된 작업

### 1. **백엔드 Firestore 마이그레이션**
- ✅ `firebase-admin` 패키지 추가
- ✅ Firestore 데이터베이스 헬퍼 생성 (`app/db/firestore.py`)
- ✅ Auth API Firestore 버전 생성 (`app/api/v1/auth_firestore.py`)
- ✅ Projects API Firestore 버전 생성 (`app/api/v1/projects_firestore.py`)
- ✅ TestCases API Firestore 버전 생성 (`app/api/v1/testcases_firestore.py`)
- ✅ Firestore용 메인 앱 생성 (`app/main_firestore.py`)
- ✅ 보안 모듈에 Firestore 사용자 인증 추가

### 2. **데이터베이스 구조**

```
Firestore Collections:
├── users/              # 사용자 정보
├── projects/           # 프로젝트
├── testcases/          # 테스트 케이스
├── testcase_history/   # 테스트 케이스 히스토리
├── testruns/           # 테스트 실행
└── testresults/        # 테스트 결과
```

### 3. **문서 및 가이드**
- ✅ `FIREBASE_DEPLOYMENT_GUIDE.md` - 상세 배포 가이드

## 🚀 다음 단계 (수동 실행 필요)

### **1단계: Firebase 콘솔 설정**

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 `testcase-e27a4` 선택
3. **Firestore Database** 생성:
   - Build > Firestore Database
   - **Create database**
   - **Start in test mode**
   - 지역: **asia-northeast3** (서울)

4. **Firebase Admin SDK 키 다운로드**:
   - Project Settings > Service accounts
   - **Generate new private key**
   - 파일을 `backend/firebase-service-account.json`으로 저장

### **2단계: 로컬 테스트 (선택사항)**

```bash
# 백엔드 디렉토리로 이동
cd backend

# .env 파일 생성
echo "SECRET_KEY=your-secret-key-min-32-characters-long" > .env
echo "FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json" >> .env

# Firestore 버전 실행
uvicorn app.main_firestore:app --reload --port 8000

# 테스트: http://localhost:8000/docs
```

### **3단계: GitHub Repository 생성**

```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Firebase Firestore migration"

# GitHub에 repository 생성 후
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### **4단계: Render.com 배포**

1. [Render.com](https://render.com/) 가입
2. **New + > Web Service**
3. GitHub repository 연결
4. 다음 설정:

**Basic**:
- Name: `tcms-backend`
- Region: `Singapore`
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Python 3`

**Build**:
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main_firestore:app --host 0.0.0.0 --port $PORT`

**Environment Variables** (`firebase-service-account.json` 파일 내용 참조):
```
SECRET_KEY=your-secret-key-min-32-characters
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=testcase-e27a4
FIREBASE_PRIVATE_KEY_ID=<복사>
FIREBASE_PRIVATE_KEY=<복사>
FIREBASE_CLIENT_EMAIL=<복사>
FIREBASE_CLIENT_ID=<복사>
FIREBASE_CLIENT_CERT_URL=<복사>
```

5. **Create Web Service** 클릭

배포 완료 후 URL 확인 (예: `https://tcms-backend.onrender.com`)

### **5단계: 프론트엔드 업데이트 및 배포**

```bash
# 백엔드 URL 설정
echo "VITE_API_URL=https://tcms-backend.onrender.com/api/v1" > frontend/.env.production

# 빌드
cd frontend
npm run build

# Firebase에 배포
cd ..
firebase login
firebase deploy --only hosting
```

배포 URL: `https://testcase-e27a4.web.app`

### **6단계: 초기 데이터 설정**

```bash
# 관리자 계정 생성
curl -X POST "https://tcms-backend.onrender.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tcms.com",
    "password": "admin123",
    "full_name": "Administrator"
  }'
```

**권한 변경**:
1. Firebase Console > Firestore Database
2. `users` 컬렉션에서 생성된 사용자 찾기
3. `role` 필드를 `viewer` → `admin`으로 변경

## 💰 예상 비용: **완전 무료**

| 서비스 | 무료 한도 | 월 예상 비용 |
|--------|-----------|--------------|
| **Firebase Firestore** | 읽기 50K, 쓰기 20K/일 | $0 |
| **Firebase Hosting** | 10GB + 360MB 전송 | $0 |
| **Render.com** | 750시간/월, 512MB RAM | $0 |
| **총합** | | **$0** |

## 📚 주요 파일

| 파일 | 설명 |
|------|------|
| `backend/requirements.txt` | Firebase Admin SDK 포함 |
| `backend/app/db/firestore.py` | Firestore 헬퍼 함수 |
| `backend/app/api/v1/*_firestore.py` | Firestore API 엔드포인트 |
| `backend/app/main_firestore.py` | Firestore 메인 앱 |
| `FIREBASE_DEPLOYMENT_GUIDE.md` | 상세 배포 가이드 |

## 🔧 기술 스택

**프론트엔드**:
- React 18 + TypeScript
- Tailwind CSS v4
- React Query
- Firebase Hosting

**백엔드**:
- FastAPI
- Firebase Firestore (NoSQL)
- JWT 인증
- Render.com 호스팅

## ⚠️ 주의사항

1. **Firebase 서비스 계정 키**:
   - `firebase-service-account.json` 파일은 절대 Git에 커밋하지 마세요
   - 이미 `.gitignore`에 추가되어 있습니다

2. **Render.com 무료 티어**:
   - 15분 비활성 시 sleep 모드
   - 첫 요청 시 ~30초 소요 (정상 동작)

3. **Firestore 무료 한도**:
   - 일일 50K 읽기, 20K 쓰기
   - 소규모 팀에 충분하지만 한도 초과 주의

## 📖 참고 문서

- [Firebase 배포 가이드](./FIREBASE_DEPLOYMENT_GUIDE.md) - 상세 배포 절차
- [Firebase Console](https://console.firebase.google.com/)
- [Render.com Docs](https://render.com/docs)

## 🎉 완료 후 확인

배포 완료 후 다음 URL에서 접속:

- **프론트엔드**: https://testcase-e27a4.web.app
- **백엔드 API**: https://tcms-backend.onrender.com
- **API 문서**: https://tcms-backend.onrender.com/docs

## ❓ 문제 해결

상세한 트러블슈팅은 `FIREBASE_DEPLOYMENT_GUIDE.md`의 "🔧 트러블슈팅" 섹션을 참조하세요.

---

**만든 날짜**: 2025년 1월
**버전**: 1.0.0 (Firebase Firestore)
