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

### 로컬 폰트
- 로컬 sans 폰트는 `public/font/*.woff2`를 사용한다.
- Next.js 폰트 설정은 `config/font.ts`에서 중앙 관리한다.

### 랜딩 CTA 라우팅
- 홈 CTA는 정적 링크(`/me`)로 동작한다.
- `/me` 서버 라우트가 인증 상태를 확인해 아래로 리다이렉트한다.
- 비로그인: `/sign-in`
- 로그인 + 온보딩 미완료: `/onboarding`
- 로그인 + 온보딩 완료: `/{primary handle}`
- `/sign-in`은 `returnTo` 쿼리(`"/sign-in?returnTo=/{handle}"`)를 지원하며, 로그인 성공 시 해당 경로로 복귀한다.
- `returnTo`가 없으면 동일 origin referer를 return path 후보로 사용한다.
- 현재 라우트 URL 복사용 훅 `hooks/use-copy-current-route-url.ts`를 제공한다.
- URL 복사 훅은 아직 UI 액션에 연결하지 않았다.

### 공개 페이지 프로필 편집
- 소유자는 `/{handle}` 페이지에서 `name`, `bio`를 직접 수정할 수 있다.
- 소유자는 동일 화면에서 handle도 변경할 수 있다.
- 페이지 공개 여부(`is_public`) 토글은 서버 액션까지 연결되어 있으며, UI 연결은 아직 하지 않았다.
- 페이지가 비공개여도 소유자는 프로필을 편집할 수 있다.
- Enter 입력 시 즉시 저장되고, 입력 중에도 `400ms` 디바운스로 자동 저장된다.
- 소유자 편집 화면 우하단에는 전역 저장 상태 인디케이터가 고정 표시된다.
- DB write 요청이 1개 이상 in-flight이면 `LoaderIcon + Saving...`이 표시된다.
- 마지막 DB write가 성공으로 완료되면 `Saved!`가 표시되고 `2초` 후 자동으로 사라진다.
- 마지막 DB write가 실패로 완료되면 `Save failed`가 표시되고 `2초` 후 자동으로 사라진다.
- 저장 상태 집계 대상은 프로필 name/bio 자동 저장, 이미지 업로드 완료/삭제, 아이템 생성/수정/삭제/사이즈 변경/정렬 변경을 모두 포함한다.
- `bio`는 최대 200자이며 줄바꿈은 저장되지 않는다.
- `page_item` 데이터는 서버에서 조회해 초기 렌더 시 즉시 표시된다.
- handle 입력 UI는 온보딩/핸들 변경에서 공통 컴포넌트를 사용한다.
- handle 제출 에러가 발생하면 제출 버튼 영역이 에러 메시지로 대체되고, 입력값이 바뀌면 버튼이 다시 노출된다.
- 소셜 플랫폼 메타데이터(브랜드 색상, URL 템플릿)는 `constants/social-platforms.ts`에서 중앙 관리한다.
- 치지직(`chzzk`)은 username이 아닌 `channel ID`를 식별자로 사용한다.
- `buildSocialProfileUrl(platform, identifier)`로 플랫폼별 식별자(username/channel ID) 기반 링크를 일관되게 생성할 수 있다.
- 프로필 이미지 업로드는 파일 선택 즉시 시작된다.
- 업로드 전 클라이언트에서 `jpg/jpeg/png/webp`, 최대 `5MB` 검증을 수행한다.
- 업로드 전 이미지를 `WebP(320x320, quality 0.85)`로 압축한다.
- Storage 버킷은 `page-thumbnail`, object key는 `page/{userId}/{pageId}/profile.webp`를 사용한다.
- 업로드는 `init-upload → presigned PUT → complete-upload` 순서로 처리되며, `page.image`에는 public URL(`?v=` 캐시 버전 포함)이 저장된다.
- 삭제는 즉시 실행되며 `page.image = null`과 Storage object 삭제를 모두 시도한다.
- DB 반영은 성공했지만 Storage 정리가 실패한 경우 partial failure toast를 표시한다.
- 비공개 페이지는 소유자만 접근할 수 있으며, 비소유자 접근 시 라우트 세그먼트 `error.tsx`가 렌더링된다.
- 방문자 화면도 저장된 전체 타입 아이템 목록을 읽기 전용으로 확인할 수 있다.
- 비로그인 방문자가 `/{handle}`에 접근하면 데스크톱 뷰포트에서 좌하단 고정 `Sign in` 버튼이 노출된다. (모바일 기기/모바일 뷰포트 숨김)
- 로그아웃 성공 시 루트(`/`)로 이동하지 않고 현재 URL을 유지한 채 페이지를 갱신한다.
- 소유자 화면의 아이템 생성 입력은 하단 고정 컴포넌트(`page-item-composer-bar`)로 분리되어 동작한다.
- 소유자 화면 하단 바의 `Add Link` 팝오버에서 링크 URL을 입력해 `GET /api/page/og`로 OG를 조회할 수 있다. (`http/https` 미입력 시 `https://` 자동 보정)
- OG 조회 성공 시 `data.url`/`data.title`/`data.favicon`을 기준으로 `link` 아이템이 즉시 생성되며, 생성 성공 시 팝오버 닫힘 + 입력 초기화가 수행된다.
- OG 응답의 `title` 또는 `data.url`이 비어있으면 링크 아이템 저장을 시도하지 않는다.
- OG 조회 실패 시 에러 toast를 표시한다.
- `memo` 아이템은 카드 본문에서 `textarea`로 직접 수정되며, 비소유자는 동일 UI를 비활성화 상태로만 확인할 수 있다.
- `link` 아이템은 favicon(`48x48`)과 title만 렌더링한다. favicon 클릭 시 외부 링크로 이동하며, favicon이 없으면 `/no-favicon.png`를 사용한다.
- 소유자는 `link` 아이템 title을 `textarea`로 수정할 수 있고, `800ms` 디바운스로 자동 저장된다.
- 소유자 `link` title textarea에서 Enter는 줄바꿈이 아닌 즉시 저장 트리거로 동작한다.
- 소유자 화면의 아이템 카드 우상단에는 hover 시에만 삭제 버튼이 노출되며, 클릭하면 아이템이 DB에서 물리 삭제된다.
- 소유자 화면의 아이템 카드 hover 액션에 사이즈 버튼 그룹(`wide-short`, `wide-tall`, `wide-full`)이 노출된다.
- 사이즈 버튼 그룹 컨테이너는 `bg-foreground`이며, 현재 선택된 옵션은 `bg-background text-foreground` 상태로 표시된다.
- 사이즈 옵션 클릭 시 카드 높이가 즉시 변경되고, `PATCH /api/pages/{handle}/items/{itemId}` 요청으로 DB `size_code`가 즉시 반영된다.
- `link` 아이템의 hover 사이즈 버튼은 비활성화 상태로 렌더링된다.
- `memo` 수정 반영은 생성과 동일하게 `800ms` 디바운스로 자동 저장된다.
- 소유자 화면에서 카드 전체를 드래그해 아이템 순서를 변경할 수 있다. 단, `input`/`textarea`/`a`/`button` 등 상호작용 요소에서는 드래그가 시작되지 않는다.
- 드래그 중에는 다른 아이템이 즉시 밀려나며 로컬 순서가 실시간 갱신된다.
- 아이템 정렬 저장 요청은 `PATCH /api/pages/{handle}/items/reorder`로 전체 `itemIds` 배열을 전송한다.
- 정렬 저장 시 `order_key`는 항상 `1..N`으로 재번호화된다.
- 정렬 저장 실패 시 마지막 동기화 순서로 즉시 롤백하고 `Failed to reorder item` toast를 표시한다.
- 소유자 편집 화면의 소셜 계정 섹션은 `page_social_items`를 서버에서 조회해 플랫폼별 username 초기값을 채운다.
- 소셜 플랫폼 입력에서 Enter/Get은 DB 저장이 아니라 해당 플랫폼의 "선택 완료" 상태만 확정한다.
- 소셜 계정 DB 저장은 `Add Selected Platforms` 버튼 클릭 시 확정된 플랫폼만 일괄 요청으로 처리한다.
- 확정된 플랫폼 중 식별자가 빈 값이면 저장 대상에서 제외한다.
- 기존 저장 플랫폼을 `x`로 편집 상태로 전환한 뒤 입력을 비우면 삭제 대기 상태(`Will be removed on save`)로 표시된다.
- 삭제 대기 상태는 `Add Selected Platforms` 배치 저장 시 `is_visible=false`로 반영된다.
- 소셜 계정 저장 API는 `(page_id, platform)` 유니크 제약을 기준으로 upsert 처리한다.
- 연결된 소셜 계정은 공개/소유자 화면 모두에서 아이콘 링크로 렌더링되며, 클릭 시 `profileUrlTemplate` 기반 외부 프로필로 이동한다.
- 소유자 편집 화면 콘텐츠는 `프로필 -> 소셜 -> 아이템` 순서로 위에서 아래로 순차 등장한다.
- 프로필/소셜/아이템 섹션은 `opacity + Y축 이동` 모션으로 진입한다.
- 방문자 읽기 화면도 동일한 `프로필 -> 소셜 -> 아이템` 순서의 섹션 진입 모션을 재사용한다.
- 소유자 화면에서 새 아이템(`memo`/`link` 등) 생성 시 카드가 작은 scale에서 커지며 등장한다.
- 소유자 화면에서 드래프트 아이템을 열 때도 동일한 아이템 진입 모션이 적용된다.
- 드래프트가 저장되어 실제 아이템으로 치환되는 프레임에서는 중복 시각 효과를 막기 위해 실아이템 진입 모션을 생략한다.
- 소유자 화면 하단의 `page-item-composer-bar`는 `EditablePageOwnerSection`의 섹션 진입 모션이 모두 끝난 뒤, 화면 아래 바깥에서 위로 올라오며 진입한다.
- `prefers-reduced-motion` 환경에서는 위 모션을 비활성화해 즉시 렌더링한다.

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
psql "$DIRECT_URL" -f schema/migrations/20260212130000_create_page_item_schema.sql
psql "$DIRECT_URL" -f schema/migrations/20260212173000_create_link_item_function.sql
psql "$DIRECT_URL" -f schema/migrations/20260212213000_add_page_social_items_unique_platform.sql
psql "$DIRECT_URL" -f schema/migrations/20260212223000_relax_page_social_platform_format_check.sql
```

## 문서
도메인/설계 문서는 `docs`에서 관리한다.

- `docs/README.md`
