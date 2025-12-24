# Render.com 설정 가이드 - Supabase 마이그레이션

이 가이드는 Supabase로 마이그레이션한 후 Render.com 환경 변수를 설정하는 방법을 설명합니다.

## 사전 준비사항

Render.com을 설정하기 전에 다음을 완료해야 합니다:

1. ✅ Supabase 프로젝트 생성
2. ✅ 데이터베이스 스키마 실행 (`supabase_schema.sql`)
3. ✅ `issue-attachments` 스토리지 버킷 생성
4. ✅ Supabase 인증 정보 준비

## 1단계: Supabase 인증 정보 가져오기

Supabase 프로젝트 대시보드에서:

### 1.1 프로젝트 URL 및 API 키

1. **Settings** → **API** 메뉴로 이동
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role** 키 (백엔드용 비밀 키)

### 1.2 데이터베이스 연결 (선택사항)

1. **Settings** → **Database** 메뉴로 이동
2. **Connection string** → **URI** 복사 (직접 데이터베이스 접근이 필요한 경우)

## 2단계: Render.com 환경 변수 설정

### 2.1 Render.com 대시보드 접속

1. https://dashboard.render.com 접속
2. **testcase-tool** 웹 서비스 선택
3. 왼쪽 사이드바에서 **Environment** 클릭

### 2.2 새 환경 변수 추가

**Add Environment Variable** 버튼을 클릭하고 다음을 추가:

#### 필수 Supabase 변수

| 키 | 값 | 비고 |
|-----|-------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | service_role 키 (anon 키 아님!) |

#### 유지해야 할 기존 변수

**다음 변수들은 삭제하지 마세요:**

| 키 | 용도 |
|-----|---------|
| `SECRET_KEY` | JWT 토큰 서명 |
| 기타 커스텀 변수들 | |

### 2.3 Firebase 변수 제거

**다음 환경 변수들을 삭제하세요** (더 이상 필요 없음):

- ❌ `FIREBASE_PROJECT_ID`
- ❌ `FIREBASE_PRIVATE_KEY_ID`
- ❌ `FIREBASE_PRIVATE_KEY`
- ❌ `FIREBASE_CLIENT_EMAIL`
- ❌ `FIREBASE_CLIENT_ID`
- ❌ `FIREBASE_CLIENT_X509_CERT_URL`

### 2.4 최종 환경 변수 목록

설정 완료 후 다음 변수들이 있어야 합니다:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SECRET_KEY=your-jwt-secret-key
```

## 3단계: Render.com에 배포

### 3.1 배포 트리거

환경 변수 추가 후 Render.com이 자동으로 재배포합니다.

**또는 수동으로 배포 트리거:**

1. **Manual Deploy** 탭으로 이동
2. **Deploy latest commit** 클릭

### 3.2 배포 모니터링

1. **Logs** 탭으로 이동
2. 성공적인 시작 메시지 확인
3. 다음과 같은 로그 확인:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:10000
   ```

### 3.3 배포 검증

다음 엔드포인트들을 확인하세요:

1. **Health Check**: `https://testcase-tool.onrender.com/docs`
2. **로그인**: 프론트엔드에서 로그인 시도
3. **파일 업로드**: 첨부파일이 있는 이슈 생성

## 4단계: 문제 해결

### 오류: "relation does not exist"

**원인**: Supabase에 데이터베이스 스키마가 적용되지 않음

**해결방법**:
1. Supabase SQL Editor로 이동
2. `supabase_schema.sql` 내용 실행
3. Render.com 재배포

### 오류: "Invalid API key"

**원인**: 잘못된 Supabase 키 사용

**해결방법**:
1. **service_role** 키를 사용하는지 확인 (anon 키 아님!)
2. Render.com에서 `SUPABASE_SERVICE_KEY` 업데이트
3. 재배포

### 오류: "Bucket not found"

**원인**: 스토리지 버킷이 생성되지 않음

**해결방법**:
1. Supabase Storage로 이동
2. `issue-attachments` 버킷 생성
3. 버킷을 **Public**으로 설정
4. 파일 업로드 다시 테스트

### 콜드 스타트가 느림

**이것은 정상입니다** - Render.com 무료 티어의 특성:
- 15분 비활성 후 첫 요청은 약 30초 소요
- 이후 요청은 빠름
- **Supabase 문제가 아님** - Render.com의 동작 방식

## 5단계: 마이그레이션 성공 확인

### 5.1 인증 테스트

```bash
curl -X POST https://testcase-tool.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=yourpassword"
```

JWT 토큰이 반환되어야 합니다.

### 5.2 데이터베이스 연결 테스트

```bash
curl https://testcase-tool.onrender.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

프로젝트 목록이 반환되어야 합니다 (프로젝트가 없으면 빈 배열).

### 5.3 파일 업로드 테스트

1. 프론트엔드 로그인: https://testcase-e27a4.web.app
2. 새 이슈 생성
3. 스크린샷 업로드
4. 이슈 상세에서 이미지가 표시되는지 확인

**예상 동작:**
- 파일이 Supabase Storage에 업로드됨
- 다음과 같은 URL 반환: `https://xxxxx.supabase.co/storage/v1/object/public/issue-attachments/...`
- 이미지가 Supabase CDN에서 직접 로드됨

## 마이그레이션 후 아키텍처

```
┌─────────────────┐
│ Firebase Hosting│ (프론트엔드 - 변경 없음)
│  testcase-e27a4 │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Render.com     │ (백엔드 API - 변경 없음)
│  FastAPI        │
└────────┬────────┘
         │ Supabase Client
         ▼
┌─────────────────┐
│    Supabase     │ (데이터베이스 + 스토리지 - 신규)
│  - PostgreSQL   │
│  - Storage      │
└─────────────────┘
```

## 달성된 이점

✅ **영구 파일 스토리지** - 더 이상 임시 /tmp 파일 없음
✅ **PostgreSQL 데이터베이스** - Firestore NoSQL보다 강력함
✅ **향상된 쿼리** - SQL 조인, 복잡한 필터링
✅ **여전히 $0/월** - 모두 무료 티어 사용
✅ **코드 재작성 불필요** - FastAPI는 변경 없음

## 다음 단계

마이그레이션 성공 후:

1. ✅ 모든 기능을 철저히 테스트
2. ✅ Render.com 로그에서 오류 모니터링
3. ✅ Supabase 대시보드에서 사용량 확인
4. 📝 API URL이 변경되면 프론트엔드 업데이트
5. 🎉 영구 파일 스토리지를 즐기세요!

## 롤백 계획

문제가 발생한 경우:

### 빠른 롤백

```bash
git checkout main
git push -f origin main
```

이렇게 하면 Firestore 기반 코드로 되돌아갑니다.

### Render.com 롤백

1. Render.com 대시보드로 이동
2. **Settings** → **Build & Deploy**
3. 이전 배포 찾기
4. **Redeploy** 클릭

## 지원

문제가 있는 경우:

1. Render.com 로그 확인
2. Supabase 로그 확인 (Dashboard → Logs)
3. `SUPABASE_MIGRATION.md` 검토
4. 오류 세부 정보와 함께 GitHub 이슈 생성
