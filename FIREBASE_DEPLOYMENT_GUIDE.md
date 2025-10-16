# 🔥 Firebase 완전 무료 배포 가이드

## 📋 개요

이 가이드는 Firebase Firestore와 Render.com을 사용하여 완전 무료로 TCMS를 배포하는 방법을 설명합니다.

**비용**: 완전 무료 (Firebase 무료 한도, Render.com 무료 티어 사용)

## 🚀 배포 단계

### 1️⃣ Firebase 프로젝트 설정

#### Firebase Console에서 Firestore 활성화

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `testcase-e27a4`
3. 왼쪽 메뉴에서 **Build** > **Firestore Database** 클릭
4. **Create database** 클릭
5. **Start in test mode** 선택 (나중에 보안 규칙 설정)
6. 지역 선택: `asia-northeast3` (서울)
7. **Enable** 클릭

#### Firebase Admin SDK 키 생성

1. Firebase Console에서 **Project Settings** (톱니바퀴 아이콘)
2. **Service accounts** 탭 클릭
3. **Generate new private key** 클릭
4. JSON 파일 다운로드
5. 파일명을 `firebase-service-account.json`으로 변경
6. `backend/` 폴더에 복사

#### Firestore 보안 규칙 설정

Firebase Console > Firestore Database > Rules 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - 인증된 사용자만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }

    // Test cases collection
    match /testcases/{testcaseId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }

    // Test case history
    match /testcase_history/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### 2️⃣ 백엔드 로컬 테스트

#### 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

#### 환경 변수 설정

`.env` 파일 생성:

```bash
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=true
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

#### Firestore 버전으로 실행

```bash
uvicorn app.main:app --reload --port 8000
```

#### 테스트

브라우저에서 http://localhost:8000/docs 접속하여 API 문서 확인

### 3️⃣ Render.com에 백엔드 배포

#### Render.com 계정 생성

1. [Render.com](https://render.com/) 접속
2. GitHub 계정으로 가입
3. 무료 플랜 선택

#### GitHub Repository 준비

```bash
cd ..
git init
git add .
git commit -m "Initial commit with Firestore"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

#### Render.com에서 Web Service 생성

1. Render Dashboard에서 **New +** > **Web Service** 클릭
2. GitHub repository 연결
3. 다음 설정 입력:

**Basic 정보**:
- Name: `tcms-backend`
- Region: `Singapore` (가장 가까운 무료 지역)
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Python 3`

**Build 설정**:
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**환경 변수** (Environment Variables 섹션에 추가):

```
SECRET_KEY=your-secret-key-change-this-min-32-characters-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=false

# Firebase 환경 변수 (JSON 파일 내용을 각각 입력)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=testcase-e27a4
FIREBASE_PRIVATE_KEY_ID=<your-private-key-id>
FIREBASE_PRIVATE_KEY=<your-private-key>
FIREBASE_CLIENT_EMAIL=<your-client-email>
FIREBASE_CLIENT_ID=<your-client-id>
FIREBASE_CLIENT_CERT_URL=<your-client-cert-url>
```

**Firebase 환경 변수 설정 방법**:
`firebase-service-account.json` 파일을 열어서 각 값을 복사:
- `FIREBASE_PRIVATE_KEY`: JSON의 `private_key` 값 (개행문자 `\n` 그대로 유지)
- `FIREBASE_PROJECT_ID`: JSON의 `project_id` 값
- 등등...

4. **Create Web Service** 클릭

#### 배포 완료

배포가 완료되면 URL을 받게 됩니다:
- 예: `https://tcms-backend.onrender.com`

### 4️⃣ 프론트엔드 배포

#### 백엔드 URL 설정

`frontend/.env.production` 파일 수정:

```bash
VITE_API_URL=https://tcms-backend.onrender.com/api/v1
```

#### 빌드

```bash
cd frontend
npm run build
```

#### Firebase Hosting에 배포

```bash
cd ..
firebase login
firebase deploy --only hosting
```

배포 완료 후 URL:
- `https://testcase-e27a4.web.app`
- `https://testcase-e27a4.firebaseapp.com`

### 5️⃣ 초기 데이터 생성

#### 관리자 계정 생성

```bash
curl -X POST "https://tcms-backend.onrender.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tcms.com",
    "password": "admin123",
    "full_name": "Administrator"
  }'
```

#### Firestore에서 권한 변경

1. Firebase Console > Firestore Database
2. `users` 컬렉션 찾기
3. 생성된 사용자 문서 열기
4. `role` 필드를 `viewer`에서 `admin`으로 변경

## 💰 예상 비용

### Firebase (완전 무료)
- **Firestore 무료 한도**:
  - 저장: 1GB
  - 읽기: 50,000/일
  - 쓰기: 20,000/일
  - 삭제: 20,000/일

- **Firebase Hosting**:
  - 저장: 10GB
  - 전송: 360MB/월 (이후 $0.15/GB)

### Render.com (무료 티어)
- **Web Service**:
  - 750시간/월 무료
  - 512MB RAM
  - 비활성 15분 후 sleep (재활성화 시간: ~30초)
  - 월 100GB 대역폭

**총 예상 비용**: **$0 (완전 무료)**

## 🔧 트러블슈팅

### Render.com 서비스가 sleep 상태

- 15분 동안 요청이 없으면 자동 sleep
- 첫 요청 시 ~30초 대기 후 활성화
- 해결: 무료 티어의 정상 동작

### CORS 에러

- 백엔드 CORS 설정 확인
- `allow_origins=["*"]`가 설정되어 있는지 확인

### Firebase 인증 에러

- 환경 변수가 올바르게 설정되었는지 확인
- `FIREBASE_PRIVATE_KEY`의 `\n` 개행문자가 유지되는지 확인

### Firestore 연결 실패

- Firebase Console에서 Firestore가 활성화되어 있는지 확인
- 서비스 계정 키가 올바른지 확인

## 📊 모니터링

### Render.com 로그 확인

Render Dashboard > Service > Logs 탭에서 실시간 로그 확인

### Firebase 사용량 확인

Firebase Console > Usage and billing에서 Firestore 사용량 확인

## 🎉 완료!

이제 다음 URL에서 서비스를 이용할 수 있습니다:

- **프론트엔드**: https://testcase-e27a4.web.app
- **백엔드 API**: https://tcms-backend.onrender.com
- **API 문서**: https://tcms-backend.onrender.com/docs

## 📝 주의사항

1. **Render.com 무료 티어 제한**:
   - 월 750시간 제한 (31일 기준 744시간)
   - 한 달 내내 실행 가능하지만 여러 서비스 사용 시 주의

2. **Firestore 무료 한도**:
   - 일일 50K 읽기는 소규모 팀에 충분
   - 한도 초과 시 추가 요금 발생 가능 (Console에서 알림 설정 권장)

3. **데이터 백업**:
   - Firestore는 자동 백업 미제공 (유료 플랜)
   - 중요한 데이터는 정기적으로 수동 백업 권장
