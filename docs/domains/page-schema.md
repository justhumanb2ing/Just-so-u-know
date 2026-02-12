# Page Schema

## 목적
공개 페이지 저장소(`public.page`)와 생성 함수(`create_page_for_user`)의 데이터 정합성을 보장한다.

## 핵심 파일
- `schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql`
- `schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql`
- `schema/migrations/20260210200000_rename_page_title_to_name.sql`
- `schema/migrations/20260212130000_create_page_item_schema.sql`
- `app/api/page/image/init-upload/route.ts`
- `app/api/page/image/complete-upload/route.ts`
- `app/api/page/image/delete/route.ts`
- `app/api/pages/[handle]/items/route.ts`
- `service/page/schema.ts`
- `service/page/items.ts`
- `components/public-page/editable-page-profile.tsx`

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
  - `order_key` 길이 제한: 1~64자
  - `lock_version`은 0 이상만 허용
  - `(page_id, order_key)` 유니크 제약
- 인덱스
  - `page_item_page_visible_order_idx(page_id, is_visible, order_key)`
  - `page_item_page_type_idx(page_id, type_code)`

## 함수/트리거
- `set_page_updated_at`: update 시 `updated_at` 자동 갱신
- `set_page_primary_default`: 기존 페이지가 있으면 `is_primary=false` 보정
- `create_page_for_user`: 입력 정규화, 예약어/길이 검증, advisory lock, 원자 삽입
- `create_memo_item_for_owned_page`: memo 생성 전용 RPC
  - 입력: `p_user_id`, `p_handle`, `p_content`
  - `handle + user_id`로 소유 페이지를 확인한 뒤 페이지 단위 advisory lock을 획득한다.
  - `p_content`의 줄바꿈(`\r`, `\n`)은 공백으로 정규화하고 trim 처리한다.
  - 정규화 결과가 빈 문자열이면 예외(`memo content is required`)를 발생시킨다.
  - 기존 마지막 `order_key`를 기준으로 12자리 증가 키를 생성해 항상 맨 뒤에 삽입한다.
  - `type_code='memo'`, `size_code='wide-short'`, `data={"content": ...}`로 저장한다.

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
- 현재 지원 타입: `memo`
- 요청 스키마:
  - `type`: `"memo"`
  - `data.content`: 문자열(서버에서 개행을 공백으로 정규화 후 trim)
- 처리 정책:
  - `handle`은 경로 파라미터를 저장 포맷(`@handle`)으로 정규화해 검증한다.
  - DB RPC(`create_memo_item_for_owned_page`)를 호출해 소유권 검증과 정렬 키 생성을 원자적으로 처리한다.
  - `memo`는 `size_code='wide-short'`로 고정한다.
- 응답:
  - 성공 시 `201 Created` + 생성된 아이템 1개 반환
  - 실패 시 `401/403/404/422/500` 상태 코드로 정규화된 에러를 반환한다.

## 페이지 접근 제어 동작
- 페이지가 비공개(`is_public=false`)이고 요청 사용자가 소유자가 아니면 `app/[handle]/error.tsx`를 렌더링한다.
- 페이지가 비공개여도 소유자는 조회 가능하다.
- 프로필 수정(`name`, `bio`)은 공개 여부와 무관하게 소유자에게만 허용한다.

## RLS 정책
- 현재 `public.page`는 RLS 비활성화 상태
- `public.item_type`, `public.item_size`, `public.page_item`도 동일하게 RLS 비활성화 상태
- 이유: Better Auth `user.id`(text) + Direct Postgres 연결 구조에서 `auth.uid()` 기반 정책을 신뢰하기 어려움
