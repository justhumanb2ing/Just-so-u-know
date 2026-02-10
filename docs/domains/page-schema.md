# Page Schema

## 목적
공개 페이지 저장소(`public.page`)와 생성 함수(`create_page_for_user`)의 데이터 정합성을 보장한다.

## 핵심 파일
- `schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql`
- `schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql`

## 테이블 스키마
- 컬럼: `title`, `handle`, `bio`, `image`, `is_public`, `is_primary`, `created_at`, `updated_at`, `user_id`
- `title`, `bio`, `image`: `NULL` 허용
- `handle`: `^@[a-z0-9]{3,20}$` 제약
- `bio`: 최대 200자
- `is_public`: 기본값 `true`
- `is_primary`: 기본값 `true` (실제 값은 트리거/함수에서 조정)
- `user_id`: `public."user"(id)` 외래키

## 정합성 제약
- `handle` 유니크 인덱스
- 사용자별 `is_primary=true`는 1개만 허용(partial unique index)
- 예약어 체크(`page_handle_reserved_check`)

## 함수/트리거
- `set_page_updated_at`: update 시 `updated_at` 자동 갱신
- `set_page_primary_default`: 기존 페이지가 있으면 `is_primary=false` 보정
- `create_page_for_user`: 입력 정규화, 예약어/길이 검증, advisory lock, 원자 삽입

## RLS 정책
- 현재 `public.page`는 RLS 비활성화 상태
- 이유: Better Auth `user.id`(text) + Direct Postgres 연결 구조에서 `auth.uid()` 기반 정책을 신뢰하기 어려움
