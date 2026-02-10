# tsuki

## 개발 환경

### 필수 요구사항
- `bun` (패키지 매니저/스크립트 실행)
- PostgreSQL 접근 가능한 `DIRECT_URL`

### 의존성 설치
```bash
bun install
```

### 환경 변수
아래 키를 `.env` 또는 `.env.local`에 설정한다.

- `DIRECT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

### 실행
```bash
bun dev
```

### 공개 페이지 프로필 편집
- 소유자는 `/{handle}` 페이지에서 `name`, `bio`를 직접 수정할 수 있다.
- Enter 입력 시 즉시 저장되고, 입력 중에도 `400ms` 디바운스로 자동 저장된다.
- `bio`는 최대 200자이며 줄바꿈은 저장되지 않는다.

### 검증 커맨드
```bash
bun run test
bun run lint
bun run build
```

### 데이터베이스 마이그레이션
```bash
psql "$DIRECT_URL" -f schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql
psql "$DIRECT_URL" -f schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql
psql "$DIRECT_URL" -f schema/migrations/20260210200000_rename_page_title_to_name.sql
```

## 문서
도메인/설계 문서는 `docs`에서 관리한다.

- `docs/README.md`
