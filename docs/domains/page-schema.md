# Page Schema

## 목적
공개 페이지 저장소(`public.page`)와 생성 함수(`create_page_for_user`)의 데이터 정합성을 보장한다.

## 핵심 파일
- `schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql`
- `schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql`
- `schema/migrations/20260210200000_rename_page_title_to_name.sql`
- `schema/migrations/20260212130000_create_page_item_schema.sql`
- `schema/migrations/20260212173000_create_link_item_function.sql`
- `schema/migrations/20260212213000_add_page_social_items_unique_platform.sql`
- `schema/migrations/20260212223000_relax_page_social_platform_format_check.sql`
- `app/api/page/image/init-upload/route.ts`
- `app/api/page/image/complete-upload/route.ts`
- `app/api/page/image/delete/route.ts`
- `app/api/page/og/route.ts`
- `app/api/pages/[handle]/items/route.ts`
- `app/api/pages/[handle]/items/[itemId]/route.ts`
- `app/api/pages/[handle]/items/reorder/route.ts`
- `app/api/pages/[handle]/social-items/route.ts`
- `app/[handle]/page.tsx`
- `service/page/schema.ts`
- `service/page/items.ts`
- `service/page/social-items.ts`
- `service/page/og-crawl.ts`
- `hooks/use-page-item-composer.ts`
- `hooks/use-page-social-accounts.ts`
- `hooks/use-og-crawl.ts`
- `components/public-page/public-page-shell.tsx`
- `components/public-page/readonly-page-visitor-section.tsx`
- `components/public-page/readonly-page-item-section.tsx`
- `components/public-page/readonly-page-item-view.ts`
- `components/public-page/page-item-section.tsx`
- `components/public-page/page-item-composer-bar.tsx`
- `components/public-page/connected-social-items-model.ts`
- `components/public-page/connected-social-items.tsx`
- `components/public-page/editable-page-profile.tsx`
- `components/public-page/editable-social-accounts-section.tsx`

## 테이블 스키마
- 컬럼: `name`, `handle`, `bio`, `image`, `is_public`, `is_primary`, `created_at`, `updated_at`, `user_id`
- `name`, `bio`, `image`: `NULL` 허용
- `handle`: `^@[a-z0-9]{3,20}$` 제약
- `bio`: 최대 200자
- `is_public`: 기본값 `true`
- `is_primary`: 기본값 `true` (실제 값은 트리거/함수에서 조정)
- `user_id`: `public."user"(id)` 외래키

## 정합성 제약
- `handle` 유니크 인덱스
- 사용자별 `is_primary=true`는 1개만 허용(partial unique index)
- 예약어 체크(`page_handle_reserved_check`)

## 공개 페이지 렌더링 경계
- `app/[handle]/page.tsx`는 권한 판단 후 `소유자 편집 variant`와 `방문자 읽기 variant`를 명시적으로 분기한다.
- 읽기 전용 아이템 렌더링은 `components/public-page/readonly-page-item-section.tsx`에서 서버 컴포넌트로 처리한다.
- 편집 전용 DnD/상태 로직은 `components/public-page/page-item-section.tsx`의 클라이언트 트리에만 유지한다.
- 공통 외곽 레이아웃 클래스는 `components/public-page/public-page-shell.tsx`에서 공유한다.

## 아이템 스키마
- `public.item_type`
  - `code`(PK), `is_active`, `created_at`
  - 기본 시드: `memo`, `image`, `video`, `link`, `map`
- `public.item_size`
  - `code`(PK), `is_active`, `created_at`
  - 기본 시드: `wide-short`, `wide-tall`, `wide-full`
- `public.page_item`
  - 컬럼: `id`, `page_id`, `type_code`, `size_code`, `order_key`, `data`, `is_visible`, `lock_version`, `created_at`, `updated_at`
  - `page_id`는 `public.page(id)` FK(`on delete cascade`)
  - `type_code`는 `public.item_type(code)` FK
  - `size_code`는 `public.item_size(code)` FK
  - `data`는 `jsonb`이며 객체 형태만 허용(`jsonb_typeof(data) = 'object'`)
  - `order_key`는 양수 `integer`(1 이상)
  - `lock_version`은 0 이상만 허용
  - `(page_id, order_key)` 유니크 제약
- 인덱스
  - `page_item_page_visible_order_idx(page_id, is_visible, order_key)`
  - `page_item_page_type_idx(page_id, type_code)`

## 소셜 계정 스키마
- `public.page_social_items`
  - 컬럼: `id`, `page_id`, `platform`, `username`, `sort_order`, `is_visible`, `created_at`, `updated_at`
  - `page_id`는 `public.page(id)` FK(`on delete cascade`)
  - `platform`은 소문자 영문/숫자/밑줄, 길이 1~32의 소셜 플랫폼 코드 문자열
  - `username`은 플랫폼 식별자(username/channel ID)
- 정합성 제약
  - `(page_id, platform)` 유니크 인덱스(`page_social_items_page_platform_unique_idx`)

## 함수/트리거
- `set_page_updated_at`: update 시 `updated_at` 자동 갱신
- `set_page_primary_default`: 기존 페이지가 있으면 `is_primary=false` 보정
- `create_page_for_user`: 입력 정규화, 예약어/길이 검증, advisory lock, 원자 삽입
- `create_memo_item_for_owned_page`: memo 생성 전용 RPC
  - 입력: `p_user_id`, `p_handle`, `p_content`
  - `handle + user_id`로 소유 페이지를 확인한 뒤 페이지 단위 advisory lock을 획득한다.
  - `p_content`의 Windows 줄바꿈(`\r\n`, `\r`)은 `\n`으로 정규화한다.
  - trim 기준으로 빈 문자열이면 예외(`memo content is required`)를 발생시킨다.
  - 기존 마지막 `order_key`를 기준으로 정수 +1 키를 생성해 항상 맨 뒤에 삽입한다.
  - `type_code='memo'`, `size_code='wide-short'`, `data={"content": ...}`로 저장한다.
- `create_link_item_for_owned_page`: link 생성 전용 RPC
  - 입력: `p_user_id`, `p_handle`, `p_url`, `p_title`, `p_favicon`
  - `handle + user_id`로 소유 페이지를 확인한 뒤 페이지 단위 advisory lock을 획득한다.
  - `p_url`은 `http/https` 절대 URL만 허용하며 저장 기준 URL은 `data.url`이다.
  - `p_title`의 줄바꿈은 공백으로 정규화하고 trim 기준 빈 문자열이면 예외(`link title is required`)를 발생시킨다.
  - 기존 마지막 `order_key`를 기준으로 정수 +1 키를 생성해 항상 맨 뒤에 삽입한다.
  - `type_code='link'`, `size_code='wide-short'`, `data={"url","title","favicon"}`로 저장한다.

## 공개 페이지 프로필 수정 동작
- 수정 대상: `handle`, `name`, `bio`
- 소유권 검증: `handle + user_id` 조건으로 소유자만 update 허용
- 입력 정책:
  - `handle`: 소문자/숫자, 3~20자, 저장 시 `@` 접두 포함
  - `name`: nullable, 길이 제한 없음
  - `bio`: nullable, 최대 200자
  - `name`/`bio` 모두 줄바꿈 문자는 공백으로 정규화
- handle 변경 흐름:
  - 클라이언트에서 디바운스 중복 검증을 수행한다.
  - 제출 시 `verifiedHandle === handle` 조건을 강제한다.
  - 서버에서 중복 검증 후 `update public.page set handle = ... where handle = ... and user_id = ...`로 갱신한다.
- 저장 트리거:
  - 클라이언트 Enter 입력 시 즉시 저장
  - 입력 중 `400ms` 디바운스로 자동 저장
- 저장 성공 시 `set_page_updated_at` 트리거로 `updated_at`이 자동 갱신된다.
- 소유자 편집 화면 우하단에는 전역 저장 상태 인디케이터가 고정 표시된다.
- DB write 요청이 하나라도 진행 중이면 `Saving...`을 표시한다.
- 마지막 DB write가 성공으로 종료되면 `Saved!`를 표시하고 `2초` 후 자동으로 숨긴다.
- 마지막 DB write가 실패로 종료되면 `Save failed`를 표시하고 `2초` 후 자동으로 숨긴다.

## 공개 페이지 이미지 업로드 동작
- 버킷: `page-thumbnail`
- object key: `page/{userId}/{pageId}/profile.webp` (단일 이미지만 허용)
- 업로드 프로토콜: Supabase Storage S3 endpoint + AWS SDK presigned PUT
- 처리 순서:
  - `POST /api/page/image/init-upload`: 세션/소유권 검증 후 presigned URL 발급
  - 클라이언트가 presigned URL로 직접 PUT 업로드
  - `POST /api/page/image/complete-upload`: object 존재 확인 후 `page.image` 갱신
- `page.image`는 public URL로 저장하며 캐시 무효화를 위해 `?v=<timestamp>`를 포함한다.
- 삭제(`DELETE /api/page/image/delete`)는 `page.image = null`과 Storage object 삭제를 모두 시도한다.
- DB 반영은 성공했지만 Storage 삭제가 실패하면 partial success 응답을 반환해 UI에서 경고 toast를 띄운다.
- 업로드 전 클라이언트에서 `jpg/jpeg/png/webp`, 최대 `5MB`를 검증하고, `WebP(320x320, quality 0.85)`로 변환한다.

## 페이지 아이템 생성 API 동작
- 엔드포인트: `POST /api/pages/{handle}/items`
- 인증: Better Auth 세션 필수
- 현재 지원 타입: `memo`, `link`, `map`
- 요청 스키마:
  - `type: "memo"` + `data.content`: 문자열(서버에서 `\r\n`, `\r`을 `\n`으로 정규화, trim 기준 빈 문자열 거부)
  - `type: "link"` + `data.url`/`data.title`/`data.favicon?`
  - `link`의 `data.url`은 절대 URL이어야 하며 OG 응답의 `data.url`을 최종 저장 기준으로 사용한다.
  - `link`의 `data.title`은 단일 라인으로 정규화되고 trim 기준 빈 문자열을 거부한다.
  - `type: "map"` + `data.lat`/`data.lng`/`data.zoom`/`data.caption`/`data.googleMapUrl`
  - `map`의 `data.lat`/`data.lng`는 좌표 범위(`lat -90..90`, `lng -180..180`)를 검증한다.
  - `map`의 `data.googleMapUrl`은 `http/https` 절대 URL이어야 한다.
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - `memo` 생성은 DB RPC(`create_memo_item_for_owned_page`)로 처리한다.
  - `link` 생성은 DB RPC(`create_link_item_for_owned_page`)로 처리한다.
  - `map` 생성은 페이지 단위 advisory lock + `max(order_key)+1` 계산으로 새 `page_item`을 삽입한다.
  - 생성 시 기본 `size_code`는 `memo/link=wide-short`, `map=wide-full`이다.
- 응답:
  - 성공 시 `201 Created` + 생성된 아이템 1개 반환
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 페이지 아이템 삭제 API 동작
- 엔드포인트: `DELETE /api/pages/{handle}/items/{itemId}`
- 인증: Better Auth 세션 필수
- 접근 제어:
  - 페이지 소유자만 삭제 가능
  - 비소유자는 `403`을 반환한다.
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - `itemId`는 UUID 포맷으로 검증한다.
  - DB에서 `page.handle + page.user_id + page_item.id` 조건으로 매칭되는 1건을 물리 삭제한다.
- 응답:
  - 성공 시 `200 OK` + 삭제된 아이템 1개 반환
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 페이지 아이템 수정 API 동작
- 엔드포인트: `PATCH /api/pages/{handle}/items/{itemId}`
- 인증: Better Auth 세션 필수
- 접근 제어:
  - 페이지 소유자만 수정 가능
  - 비소유자는 `403`을 반환한다.
- 요청 스키마:
  - `type: "memo"` + `data.content`로 memo 본문 수정
  - `type: "link"` + `data.title`로 link title 수정
  - `type: "size"` + `data.sizeCode`(`wide-short | wide-tall | wide-full`)로 카드 크기 수정
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - `itemId`는 UUID 포맷으로 검증한다.
  - DB에서 `page.handle + page.user_id + page_item.id` 조건으로 매칭되는 1건만 갱신한다.
  - `sizeCode`는 `public.item_size(code)` FK 제약으로 정합성을 보장한다.
- 응답:
  - 성공 시 `200 OK` + 수정된 아이템 1개 반환
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 페이지 아이템 조회 API 동작
- 엔드포인트: `GET /api/pages/{handle}/items`
- 접근 제어:
  - 공개 페이지(`is_public=true`): 비로그인 포함 조회 가능
  - 비공개 페이지(`is_public=false`): 소유자만 조회 가능
- 조회 정책:
  - `page_item` + `page` 조인으로 handle 기준 아이템을 조회한다.
  - `is_visible=true` 조건의 아이템을 타입 구분 없이 모두 반환한다.
  - 정렬은 `order_key asc`를 사용한다.
- 응답:
  - 성공 시 `200 OK` + `items` 배열 반환
  - 실패 시 `403/404` 상태 코드로 권한/존재 오류를 반환한다.

## 페이지 아이템 정렬 API 동작
- 엔드포인트: `PATCH /api/pages/{handle}/items/reorder`
- 인증: Better Auth 세션 필수
- 접근 제어:
  - 페이지 소유자만 정렬 가능
  - 비소유자는 `403`을 반환한다.
- 요청 스키마:
  - `itemIds: string[]`(UUID 배열, 최소 1개, 중복 불가)
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - 요청 배열은 현재 페이지의 `is_visible=true` 아이템 집합과 정확히 일치해야 한다.
  - 정렬 저장 시 `order_key`는 항상 `1..N`으로 재번호화한다.
  - 업데이트는 트랜잭션 내부 2단계 갱신(임시 offset -> 최종 순서)으로 `(page_id, order_key)` 유니크 충돌을 회피한다.
- 응답:
  - 성공 시 `200 OK` + `status=success`
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 페이지 소셜 계정 저장 API 동작
- 엔드포인트: `POST /api/pages/{handle}/social-items`
- 인증: Better Auth 세션 필수
- 접근 제어:
  - 페이지 소유자만 저장 가능
  - 비소유자는 `403`을 반환한다.
- 요청 스키마:
  - `upserts: Array<{ platform, username }>`
  - `deletes: Array<{ platform }>`
  - 플랫폼별 식별자는 서버에서 정규화한다.
  - `upserts`에서 빈 식별자는 저장 대상에서 제외한다.
  - `upserts` 동일 플랫폼 중복 입력은 마지막 값으로 병합한다.
  - `deletes` 동일 플랫폼 중복 입력은 1회로 병합한다.
  - 같은 플랫폼이 `upserts`와 `deletes`에 동시에 포함되면 `upserts`를 우선한다.
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - 저장은 `(page_id, platform)` 유니크 제약 기반 upsert로 처리한다.
  - 삭제는 물리 삭제 대신 `is_visible=false` soft delete로 처리한다.
  - upsert 시 `is_visible=true`로 복구하며 `username`을 최신 값으로 갱신한다.
- 응답:
  - 성공 시 `200 OK` + upsert된 `items` 배열, soft delete된 `deletedPlatforms` 배열 반환
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 링크 OG 조회 API 동작
- 엔드포인트: `GET /api/page/og?url={absolute_url}`
- 처리 정책:
  - `url` 쿼리 파라미터가 없으면 `400`을 반환한다.
  - `url`에 `http://` 또는 `https://`가 없으면 서버에서 `https://`를 자동으로 앞에 붙여 처리한다.
  - 서버는 외부 크롤러 endpoint에 `url`, `mode=static`을 붙여 GET 요청한다.
  - 개발 모드(`NODE_ENV !== production`)에서는 `timings=1`을 추가한다.
  - 외부 응답은 직접 성공 형태(`{ ok: true, mode, data, ... }`)와 래핑 성공 형태(`{ ok: true, data: { ... } }`)를 모두 허용해 내부 `CrawlResult`로 정규화한다.
  - cache 메타의 `ageMs`는 캐시 히트에서만 제공될 수 있으므로 optional로 처리한다.
- 응답:
  - 성공 시 `200 OK` + `data`(`CrawlResponse`) 반환
  - 실패 시 외부 `status` 또는 `502` 상태 코드와 에러 메시지를 반환한다.

## 페이지 아이템 섹션 UI 동작
- 노출 대상: 페이지 소유자 편집 화면(`EditablePageProfile`)
- 사용자 흐름:
  - 최초 렌더 시 서버에서 조회한 전체 `page_item` 목록을 초기 상태로 주입한다.
  - `Add Item` 클릭 시 draft textarea를 즉시 생성하고 focus한다.
  - 입력 중 `800ms` 디바운스로 자동 저장을 시도한다.
  - `Enter` 입력은 저장 트리거가 아니라 줄바꿈으로 동작한다.
  - 텍스트 본문은 줄바꿈(`\n`)을 보존해 저장/표시한다.
  - 자동 저장 전에 내용을 모두 지워도 draft는 유지한다.
  - 저장된 아이템 카드 우상단에 hover 시 삭제 버튼이 노출된다.
  - 저장된 아이템 카드 좌상단에 hover 시 사이즈 버튼 그룹이 노출된다.
  - 삭제 버튼 클릭 시 목록에서 즉시 제거(낙관적 업데이트) 후 서버 물리 삭제를 요청한다.
  - 사이즈 버튼 클릭 시 목록에서 즉시 사이즈를 변경(낙관적 업데이트)하고 서버에 즉시 동기화한다.
  - 카드 전체를 드래그해 아이템 순서를 변경할 수 있다.
  - `input`/`textarea`/`a`/`button` 등 상호작용 요소에서 포인터 다운 시에는 드래그를 시작하지 않는다.
  - 드래그 중에는 아이템 위치가 실시간으로 재배치되고, over 대상 카드에는 inset-shadow 인디케이터가 표시된다.
  - 드래그 중 active 카드는 `floating-shadow`와 약간의 scale 확대로 떠 있는 상태로 렌더링된다.
  - 드래프트가 열려 있어도 저장된 아이템들만 정렬 대상으로 계산한다.
  - link 아이템의 hover 사이즈 버튼 그룹은 비활성화 상태로 렌더링된다.
  - link title은 소유자에게만 editable textarea로 노출되며 입력 중 `800ms` 디바운스로 자동 저장된다.
  - link title textarea에서 `Enter`는 줄바꿈 대신 즉시 저장 트리거로 동작한다.
  - link title이 비어있으면 저장 요청을 보내지 않는다.
- 저장 성공 시:
  - 생성된 아이템을 로컬 목록에 append해 즉시 화면에 반영한다.
  - 자동 저장 후에도 draft textarea는 유지되어 포커스를 잃지 않는다.
  - 아이템 삭제가 성공하면 제거 상태를 유지한다.
  - 아이템 정렬 저장 성공 시 마지막 동기화 순서를 최신 기준으로 갱신한다.
- 저장 실패 시:
  - draft를 유지하고 toast 에러를 표시한다.
  - 아이템 삭제 실패 시 제거했던 항목을 기존 `orderKey` 기준으로 복구하고 toast 에러를 표시한다.
  - 아이템 사이즈 변경 실패 시 마지막 서버 동기화 size로 롤백하고 toast 에러를 표시한다.
  - link title 저장 실패 시 기존 값은 유지하고 toast 에러를 표시한다.
  - 아이템 정렬 저장 실패 시 마지막 서버 동기화 순서로 즉시 롤백하고 `Failed to reorder item` toast를 표시한다.
- 아이템 카드 렌더링 제약:
  - draft/저장 상태 모두 카드 높이는 `h-16`으로 고정하고 overflow를 숨긴다.
  - draft textarea는 카드 내부 세로 중앙에 위치한다.
  - draft textarea 높이는 부모 컨테이너(`h-full`)에 맞춰 렌더링하며 컨테이너를 넘지 않는다.
  - 카드 높이를 초과하는 내용은 textarea 내부 스크롤로 확인한다.
  - 저장된 아이템 텍스트는 `line-clamp-2`로 요약 노출한다.
- link 아이템 렌더링 제약:
  - 부모 컨테이너 패딩은 `p-2`를 사용한다.
  - favicon은 `img` 태그로 `48x48` 크기로 렌더링한다.
  - favicon 클릭 시 외부 URL로 이동한다.
  - favicon이 없으면 `/no-favicon.png`를 사용한다.
  - title은 중앙 정렬로 렌더링한다.
- 저장된 아이템은 `sizeCode`를 기준으로 렌더링 크기를 결정한다.
- 저장 상태 인디케이터 집계 대상은 아이템 생성/수정/삭제/사이즈 변경/정렬 변경과 프로필 저장(name/bio, image complete/delete)을 모두 포함한다.

## 하단 고정 아이템 생성 바 동작
- 아이템 생성 UI는 `page-item-composer-bar`로 분리되어 화면 하단에 고정된다.
- 초안 편집 textarea는 바 내부가 아니라 아이템 목록 영역에 draft 카드로 렌더링된다.
- 생성 바에는 `Add Link` 트리거 버튼이 있으며, 클릭 시 popover 내부 입력창에서 Enter로 OG 조회를 트리거한다.
- OG 조회 실패 시 toast 에러를 표시한다.
- OG 조회 성공 후 link 생성까지 성공하면 링크 popover를 자동으로 닫고 입력값을 초기화한다.
- OG 응답에서 `data.url` 또는 `data.title`이 비어있으면 link 저장을 시도하지 않는다.
- link 생성 성공 시 생성된 아이템을 목록에 즉시 append한다.
- 향후 `image/video/link/map` 타입 생성 UI를 같은 생성 바에서 확장할 수 있도록 구성한다.

## 공개 페이지 아이템 표시 동작
- 방문자 화면에서도 서버에서 조회한 전체 타입 아이템 목록을 읽기 전용으로 렌더링한다.
- 비공개 페이지는 기존 접근 제어를 유지하며, 비소유자는 아이템을 포함한 페이지 전체를 볼 수 없다.

## 페이지 접근 제어 동작
- 페이지가 비공개(`is_public=false`)이고 요청 사용자가 소유자가 아니면 `app/[handle]/error.tsx`를 렌더링한다.
- 페이지가 비공개여도 소유자는 조회 가능하다.
- 프로필 수정(`name`, `bio`)은 공개 여부와 무관하게 소유자에게만 허용한다.

## RLS 정책
- 현재 `public.page`는 RLS 비활성화 상태
- `public.item_type`, `public.item_size`, `public.page_item`도 동일하게 RLS 비활성화 상태
- 이유: Better Auth `user.id`(text) + Direct Postgres 연결 구조에서 `auth.uid()` 기반 정책을 신뢰하기 어려움
