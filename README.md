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
- `SUPABASE_S3_ENDPOINT`
- `SUPABASE_S3_REGION`
- `SUPABASE_S3_BUCKET` (예: `page-thumbnail`)
- `SUPABASE_S3_ACCESS_KEY_ID`
- `SUPABASE_S3_SECRET_ACCESS_KEY`

### 실행
```bash
bun dev
```

### 랜딩 CTA 라우팅
- 홈 CTA는 정적 링크(`/me`)로 동작한다.
- `/me` 서버 라우트가 인증 상태를 확인해 아래로 리다이렉트한다.
- 비로그인: `/sign-in`
- 로그인 + 온보딩 미완료: `/onboarding`
- 로그인 + 온보딩 완료: `/{primary handle}`
- 현재 라우트 URL 복사용 훅 `hooks/use-copy-current-route-url.ts`를 제공한다.
- URL 복사 훅은 아직 UI 액션에 연결하지 않았다.

### 공개 페이지 프로필 편집
- 소유자는 `/{handle}` 페이지에서 `name`, `bio`를 직접 수정할 수 있다.
- 소유자는 동일 화면에서 handle도 변경할 수 있다.
- 페이지가 비공개여도 소유자는 프로필을 편집할 수 있다.
- Enter 입력 시 즉시 저장되고, 입력 중에도 `400ms` 디바운스로 자동 저장된다.
- `bio`는 최대 200자이며 줄바꿈은 저장되지 않는다.
- `page_item` 데이터는 서버에서 조회해 초기 렌더 시 즉시 표시된다.
- handle 입력 UI는 온보딩/핸들 변경에서 공통 컴포넌트를 사용한다.
- handle 제출 에러가 발생하면 제출 버튼 영역이 에러 메시지로 대체되고, 입력값이 바뀌면 버튼이 다시 노출된다.
- 소셜 플랫폼 메타데이터(브랜드 색상, URL 템플릿)는 `constants/social-platforms.ts`에서 중앙 관리한다.
- `buildSocialProfileUrl(platform, username)`으로 `도메인/username` 형태의 링크를 일관되게 생성할 수 있다.
- 프로필 이미지 업로드는 파일 선택 즉시 시작된다.
- 업로드 전 클라이언트에서 `jpg/jpeg/png/webp`, 최대 `5MB` 검증을 수행한다.
- 업로드 전 이미지를 `WebP(320x320, quality 0.85)`로 압축한다.
- Storage 버킷은 `page-thumbnail`, object key는 `page/{userId}/{pageId}/profile.webp`를 사용한다.
- 업로드는 `init-upload → presigned PUT → complete-upload` 순서로 처리되며, `page.image`에는 public URL(`?v=` 캐시 버전 포함)이 저장된다.
- 삭제는 즉시 실행되며 `page.image = null`과 Storage object 삭제를 모두 시도한다.
- DB 반영은 성공했지만 Storage 정리가 실패한 경우 partial failure toast를 표시한다.
- 비공개 페이지는 소유자만 접근할 수 있으며, 비소유자 접근 시 라우트 세그먼트 `error.tsx`가 렌더링된다.
- 방문자 화면도 저장된 전체 타입 아이템 목록을 읽기 전용으로 확인할 수 있다.
- 소유자 화면의 아이템 생성 입력은 하단 고정 컴포넌트(`page-item-composer-bar`)로 분리되어 동작한다.

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
