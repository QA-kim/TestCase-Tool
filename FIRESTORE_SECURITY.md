# Firestore 보안 규칙 가이드

## 개요

이 프로젝트는 역할 기반 접근 제어(RBAC)를 사용하여 Firestore 데이터베이스를 보호합니다.

## 역할 및 권한

### 역할 정의

1. **admin** - 시스템 관리자
   - 모든 권한
   - 사용자 생성/수정/삭제
   - 역할 변경
   - 모든 데이터 관리

2. **qa_manager** - QA 매니저
   - 프로젝트 생성/수정/삭제
   - 테스트 케이스 관리
   - 테스트 실행 관리
   - 사용자 조회

3. **qa_engineer** - QA 엔지니어
   - 테스트 케이스 생성/수정
   - 테스트 실행 및 결과 입력
   - 모든 데이터 읽기

4. **developer** - 개발자
   - 모든 데이터 읽기
   - 댓글 작성 (향후 기능)
   - 테스트 결과 조회

5. **viewer** - 뷰어 (기본 역할)
   - 모든 데이터 읽기 전용
   - 수정/삭제 불가

## 컬렉션별 접근 규칙

### Users
- **읽기**: 본인 데이터만 / Admin은 전체
- **생성**: Admin만
- **수정**: 본인 프로필 (역할/활성화 제외) / Admin은 전체
- **삭제**: Admin만

### Projects
- **읽기**: 모든 인증 사용자
- **생성/수정/삭제**: Admin, QA Manager

### Folders
- **읽기**: 모든 인증 사용자
- **생성/수정/삭제**: Admin, QA Manager, QA Engineer

### TestCases
- **읽기**: 모든 인증 사용자
- **생성/수정**: Admin, QA Manager, QA Engineer
- **삭제**: Admin, QA Manager

### TestCase History
- **읽기**: 모든 인증 사용자
- **생성**: Admin, QA Manager, QA Engineer
- **수정/삭제**: 불가 (히스토리 보존)

### TestRuns
- **읽기**: 모든 인증 사용자
- **생성/수정**: Admin, QA Manager, QA Engineer
- **삭제**: Admin, QA Manager

### TestResults
- **읽기**: 모든 인증 사용자
- **생성/수정**: Admin, QA Manager, QA Engineer
- **삭제**: Admin, QA Manager

## 보안 규칙 배포

### Firebase CLI로 배포

```bash
# Firebase 로그인
firebase login

# 보안 규칙만 배포
firebase deploy --only firestore:rules

# 전체 배포 (hosting + rules)
firebase deploy
```

### Firebase Console에서 직접 설정

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택 (testcase-e27a4)
3. Firestore Database → 규칙 탭
4. `firestore.rules` 파일 내용 복사/붙여넣기
5. 게시 버튼 클릭

## 보안 강화 포인트

### 1. 인증 필수
- 모든 요청은 `request.auth != null` 검증
- 비인증 사용자는 어떤 데이터도 접근 불가

### 2. 역할 기반 제어
- 각 역할에 맞는 권한만 부여
- 사용자 역할은 Firestore에 저장된 데이터로 검증

### 3. 데이터 무결성
- 히스토리 데이터는 수정/삭제 불가
- 사용자는 본인의 역할을 변경할 수 없음

### 4. 최소 권한 원칙
- 기본적으로 모든 접근 거부
- 명시적으로 허용된 작업만 수행 가능

### 5. 세분화된 권한
- 읽기와 쓰기를 분리
- 생성, 수정, 삭제 권한을 개별적으로 제어

## 테스트 방법

### 1. Firebase Console에서 테스트

Firebase Console → Firestore Database → 규칙 탭 → 규칙 시뮬레이터

```javascript
// Viewer가 프로젝트 생성 시도 (실패해야 함)
get /databases/(default)/documents/projects/test123
auth: {uid: 'user123'}
database data: users/user123 {role: 'viewer'}
// 결과: Denied

// Admin이 프로젝트 생성 시도 (성공해야 함)
create /databases/(default)/documents/projects/test123
auth: {uid: 'admin123'}
database data: users/admin123 {role: 'admin'}
// 결과: Allowed
```

### 2. 실제 환경에서 테스트

```bash
# 각 역할의 계정으로 로그인하여 테스트
# 1. Viewer로 로그인 → 읽기만 가능
# 2. QA Engineer로 로그인 → 테스트 케이스 생성/수정 가능
# 3. QA Manager로 로그인 → 프로젝트 관리 가능
# 4. Admin으로 로그인 → 모든 기능 가능
```

## 주의사항

⚠️ **중요**:
- 보안 규칙 변경 후 반드시 테스트 필수
- 프로덕션 배포 전 시뮬레이터로 검증
- 백엔드 API도 동일한 권한 체크를 수행하므로 이중 보안

## 문제 해결

### "permission denied" 오류 발생 시

1. 사용자가 로그인되어 있는지 확인
2. 사용자의 역할이 올바른지 확인
3. Firestore 규칙이 최신 버전인지 확인
4. Firebase Console에서 규칙 시뮬레이터로 테스트

### 규칙 배포 실패 시

```bash
# 규칙 유효성 검사
firebase deploy --only firestore:rules --debug

# 오류 로그 확인
firebase deploy --only firestore:rules 2>&1 | tee deploy.log
```

## 참고 자료

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Role-based Access Control Guide](https://firebase.google.com/docs/firestore/security/rules-conditions)
