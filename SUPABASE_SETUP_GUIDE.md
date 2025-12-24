# Supabase 마이그레이션 완료 가이드

현재 상태: 백엔드 코드는 Supabase로 마이그레이션되었지만, Supabase 데이터베이스 설정이 필요합니다.

## 현재 진행 상황

✅ **완료된 작업:**
- 백엔드 코드의 모든 import를 `app.db.supabase`로 변경
- Supabase Storage를 사용한 파일 업로드 코드 작성
- 프론트엔드에서 Supabase URL 처리 지원
- Render.com 환경변수 설정 (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)

❌ **남은 작업:**
- Supabase 데이터베이스 스키마 실행
- Supabase Storage 버킷 생성

---

## 1단계: Supabase SQL 스키마 실행

### 1.1 Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 로그인
3. 프로젝트 선택 (testcase-tool 또는 생성한 프로젝트)

### 1.2 SQL Editor 열기
1. 왼쪽 사이드바에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭

### 1.3 SQL 스키마 복사 및 실행

아래 파일의 **전체 내용**을 복사하세요:
```
backend/supabase_schema.sql
```

SQL Editor에 붙여넣기하고 **"Run"** 버튼 클릭

### 1.4 실행 확인

성공 메시지가 표시되어야 합니다:
```
Success. No rows returned
```

**중요:** 에러가 발생하면:
- 에러 메시지를 확인
- 이미 테이블이 존재한다는 에러는 무시 가능 (이미 실행했던 경우)
- 권한 에러가 발생하면 service_role 키를 사용하는지 확인

### 1.5 테이블 생성 확인

1. 왼쪽 사이드바에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ users
   - ✅ projects
   - ✅ folders
   - ✅ testcases
   - ✅ testcase_history
   - ✅ testruns
   - ✅ testrun_testcases
   - ✅ testresults
   - ✅ testresult_history
   - ✅ issues

---

## 2단계: Supabase Storage 버킷 생성

### 2.1 Storage 페이지 열기
1. 왼쪽 사이드바에서 **"Storage"** 클릭
2. **"Create a new bucket"** 클릭

### 2.2 버킷 생성
다음 설정으로 버킷 생성:
- **Name:** `issue-attachments`
- **Public bucket:** ✅ **체크** (반드시!)
- **File size limit:** 기본값 (50MB)
- **Allowed MIME types:** 비워두기 (모든 파일 타입 허용)

**"Create bucket"** 클릭

### 2.3 버킷 공개 설정 확인

버킷이 생성된 후:
1. `issue-attachments` 버킷 클릭
2. 오른쪽 상단의 설정 아이콘 클릭
3. **"Public bucket"** 옵션이 **ON**인지 확인

**중요:** Public이 아니면 파일 URL이 작동하지 않습니다!

---

## 3단계: Render.com 재배포

### 3.1 환경변수 확인
Render.com 대시보드에서 다음 환경변수가 설정되어 있는지 확인:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SECRET_KEY=your-jwt-secret-key
```

**주의:** `SUPABASE_SERVICE_KEY`는 **service_role** 키여야 합니다 (anon 키 아님!)

### 3.2 수동 재배포

Render.com에서:
1. **testcase-tool** 웹 서비스 선택
2. **"Manual Deploy"** 탭 클릭
3. **"Deploy latest commit"** 클릭

### 3.3 배포 로그 확인

**Logs** 탭에서 다음 메시지 확인:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

에러가 없어야 합니다!

---

## 4단계: 관리자 계정 생성

Supabase에 admin 사용자가 없으므로 생성해야 합니다.

### 옵션 A: Supabase 대시보드에서 직접 생성 (권장)

1. Supabase **Table Editor** → **users** 테이블 선택
2. **"Insert row"** 클릭
3. 다음 값 입력:

```
id: (자동 생성됨 - 비워두기)
email: admin@tcms.com
username: admin
password_hash: pbkdf2:sha256:260000$SALT$HASH (아래 참조)
full_name: Administrator
role: admin
is_active: true
failed_login_attempts: 0
locked_until: (비워두기)
must_change_password: false
created_at: (자동)
updated_at: (자동)
```

**비밀번호 해시 생성:**

로컬에서 Python 실행:
```bash
cd backend
python -c "from passlib.hash import pbkdf2_sha256; print(pbkdf2_sha256.hash('admin123'))"
```

출력된 해시를 `password_hash` 필드에 붙여넣기

### 옵션 B: 로컬에서 스크립트 실행 (환경변수 필요)

로컬 `.env` 파일 생성:
```bash
# backend/.env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SECRET_KEY=your-jwt-secret
```

스크립트 실행:
```bash
cd backend
python create_admin.py
```

---

## 5단계: 테스트

### 5.1 로그인 테스트

프론트엔드 접속: https://testcase-e27a4.web.app

로그인:
- Email: `admin@tcms.com`
- Password: `admin123` (또는 설정한 비밀번호)

### 5.2 프로젝트 생성 테스트

1. 프로젝트 페이지에서 **"새 프로젝트"** 클릭
2. 프로젝트 정보 입력 후 생성
3. 생성된 프로젝트가 목록에 표시되는지 확인

### 5.3 파일 업로드 테스트

1. 테스트 실행 후 실패한 테스트에서 이슈 생성
2. 스크린샷 첨부
3. 이슈 상세 페이지에서 이미지가 표시되는지 확인

**예상 URL 형식:**
```
https://xxxxx.supabase.co/storage/v1/object/public/issue-attachments/...
```

---

## 6단계: 기존 데이터 마이그레이션 (선택사항)

Firestore에 기존 데이터가 있고 보존하고 싶다면 데이터 마이그레이션이 필요합니다.

### 6.1 데이터 확인

Firebase Console에서 기존 데이터 확인:
- users 컬렉션
- projects 컬렉션
- testcases 컬렉션
- 기타 컬렉션

### 6.2 마이그레이션 스크립트 실행 (필요시 작성 가능)

데이터가 많지 않다면 수동으로 재생성하는 것이 더 빠를 수 있습니다.

**참고:**
- 기존 첨부파일은 /tmp에 저장되어 이미 사라졌을 가능성이 높음
- 사용자는 다시 생성 필요
- 프로젝트와 테스트 케이스는 다시 생성하거나 마이그레이션 스크립트 필요

---

## 트러블슈팅

### 에러: "relation does not exist"

**원인:** 데이터베이스 스키마가 실행되지 않음

**해결:**
1. 1단계로 돌아가서 `supabase_schema.sql` 실행
2. Table Editor에서 테이블 생성 확인

### 에러: "Bucket not found"

**원인:** Storage 버킷이 생성되지 않음

**해결:**
1. 2단계로 돌아가서 `issue-attachments` 버킷 생성
2. Public 설정 확인

### 에러: "Invalid API key"

**원인:** 잘못된 Supabase 키 사용

**해결:**
1. Supabase Dashboard → Settings → API
2. **service_role** 키 복사 (anon 키 아님!)
3. Render.com에서 `SUPABASE_SERVICE_KEY` 업데이트
4. 재배포

### 로그인 실패: "User not found"

**원인:** admin 계정이 Supabase에 생성되지 않음

**해결:**
1. 4단계로 돌아가서 admin 계정 생성
2. 비밀번호 해시가 올바른지 확인

### 파일 업로드 실패: "Storage error"

**원인:** 버킷이 Public이 아님

**해결:**
1. Supabase Storage → `issue-attachments` 버킷
2. Settings → Public bucket ON으로 설정

---

## 완료 체크리스트

모든 단계를 완료했는지 확인:

- [ ] Supabase SQL 스키마 실행 (`supabase_schema.sql`)
- [ ] Table Editor에서 10개 테이블 확인
- [ ] Storage 버킷 `issue-attachments` 생성 (Public)
- [ ] Render.com 환경변수 설정 확인
- [ ] Render.com 재배포 완료
- [ ] 관리자 계정 생성 (admin@tcms.com)
- [ ] 로그인 테스트 성공
- [ ] 프로젝트 생성 테스트 성공
- [ ] 파일 업로드 테스트 성공

---

## 다음 단계

마이그레이션 완료 후:

1. ✅ Firebase Firestore는 더 이상 사용하지 않음 (비활성화 가능)
2. ✅ 모든 데이터는 Supabase PostgreSQL에 저장됨
3. ✅ 파일은 Supabase Storage에 영구 저장됨
4. ✅ 여전히 $0/월 비용 (Supabase 무료 티어)

---

## 지원

문제가 발생하면:
1. Render.com 로그 확인
2. Supabase Dashboard → Logs 확인
3. 이 가이드의 트러블슈팅 섹션 참조
4. GitHub 이슈 생성 (에러 메시지 포함)
