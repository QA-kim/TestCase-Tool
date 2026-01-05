# 🔒 보안 설정 가이드

## ⚠️ 긴급 조치 완료 사항

이 저장소는 다음 보안 조치가 완료되었습니다:
- ✅ Git 히스토리에서 민감 정보 영구 삭제 (`frontend/.env.production`, `backend/serviceAccountKey.json`)
- ✅ `.gitignore` 업데이트 (모든 `.env` 파일 제외)
- ✅ 강력한 JWT Secret Key 생성

## 🚨 즉시 수행해야 할 작업

### 1. Supabase Service Role Key 재발급 (최우선)

**현재 노출된 키는 즉시 무효화해야 합니다!**

1. Supabase 대시보드 접속: https://app.supabase.com
2. 프로젝트 선택
3. Settings > API로 이동
4. Service Role Key 섹션에서 **"Reset service_role secret"** 클릭
5. 새로 생성된 키를 안전하게 복사

### 2. 환경 변수 업데이트

#### Backend (.env 파일 생성)

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열고 다음 값을 입력:

```bash
# 강력한 JWT Secret (아래 생성된 키 사용)
SECRET_KEY=b82fac2adbbdb19e6ddf427b5b4ddac31c13d191f5185eca16203d905af9a763

# Supabase (새로 재발급받은 키 사용)
SUPABASE_URL=https://eclniwdhzpkzhbcrncvc.supabase.co
SUPABASE_SERVICE_KEY=<새로_재발급받은_Service_Role_Key>
```

#### Frontend (.env.production 파일 생성)

```bash
cd frontend
cp .env.example .env.production
```

`.env.production` 파일을 열고 다음 값을 입력:

```bash
VITE_API_URL=https://testcase-tool.onrender.com/api/v1
```

### 3. Render.com 환경 변수 업데이트

1. https://dashboard.render.com 접속
2. `testcase-tool` 서비스 선택
3. Environment 탭 클릭
4. 다음 환경 변수 업데이트:
   - `SECRET_KEY`: `b82fac2adbbdb19e6ddf427b5b4ddac31c13d191f5185eca16203d905af9a763`
   - `SUPABASE_SERVICE_KEY`: `<새로_재발급받은_키>`
5. Save Changes 클릭 (자동 재배포됨)

### 4. 모든 사용자 세션 무효화

JWT Secret Key가 변경되었으므로 모든 사용자는 재로그인해야 합니다.
- 사용자들에게 공지: "보안 강화를 위해 모든 사용자는 재로그인이 필요합니다"

### 5. Git 히스토리 강제 푸시

**주의**: 이 작업은 협업자들에게 사전 공지가 필요합니다!

```bash
# 현재 변경사항 커밋
git add .gitignore backend/.env.example frontend/.env.example SECURITY_SETUP.md
git commit -m "security: Update .gitignore and add .env.example templates"

# 강제 푸시 (히스토리가 변경되었으므로 필수)
git push origin main --force
```

**협업자들을 위한 안내**:
```bash
# 다른 개발자들은 다음 명령어로 업데이트:
git fetch origin
git reset --hard origin/main
```

## 📋 환경 변수 체크리스트

### Backend 환경 변수
- [ ] `SECRET_KEY` - 64자 hex 문자열 (openssl rand -hex 32)
- [ ] `SUPABASE_URL` - Supabase 프로젝트 URL
- [ ] `SUPABASE_SERVICE_KEY` - **새로 재발급받은** Service Role Key

### Frontend 환경 변수
- [ ] `VITE_API_URL` - 백엔드 API URL

### Render.com 환경 변수
- [ ] `SECRET_KEY` 업데이트 완료
- [ ] `SUPABASE_URL` 확인
- [ ] `SUPABASE_SERVICE_KEY` **새 키로 업데이트 완료**

## 🔐 장기 보안 권장사항

### 1. 정기 키 로테이션
- JWT Secret: 분기별 1회
- Supabase Service Key: 반기별 1회

### 2. Supabase RLS (Row Level Security) 강화
```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE testcases ENABLE ROW LEVEL SECURITY;
-- (모든 테이블에 적용)
```

### 3. IP 화이트리스트 (선택사항)
- Supabase 대시보드에서 Render.com 서버 IP만 허용
- Settings > Database > Network Restrictions

### 4. Git Pre-commit Hook 설정
```bash
# .git/hooks/pre-commit 파일 생성
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Check for .env files being committed
if git diff --cached --name-only | grep -E '\.env$|\.env\.|serviceAccountKey'; then
    echo "ERROR: Attempting to commit sensitive .env or key files!"
    echo "Files detected:"
    git diff --cached --name-only | grep -E '\.env$|\.env\.|serviceAccountKey'
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

### 5. GitHub Secret Scanning 활성화
1. GitHub 저장소 > Settings > Code security and analysis
2. "Secret scanning" 활성화
3. "Push protection" 활성화

## 🆘 보안 사고 발생 시

키가 노출된 경우:
1. 즉시 해당 키 무효화/재발급
2. 모든 배포 환경의 환경 변수 업데이트
3. 접근 로그 확인 (Supabase Dashboard > Logs)
4. 비정상 활동 모니터링
5. 필요시 모든 사용자 비밀번호 재설정 요청

## 📞 문의

보안 관련 문의: kdy@example.com
