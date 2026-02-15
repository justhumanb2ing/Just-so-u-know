# CONTEXT

## 이 모듈이 하는 일
- 페이지 도메인의 아이템/소셜 계정 입력 검증, 경로 핸들 정규화, 생성/수정/조회 로직을 제공한다.

## 파일 구조와 역할
- `service/page/schema.ts`: 페이지 handle 정규화와 아이템/소셜 계정 입력 검증
- `service/page/items.ts`: 페이지 아이템 생성/수정/조회 DB 호출 로직
- `service/page/social-items.ts`: 페이지 소셜 계정 조회/일괄 저장/soft delete DB 호출 로직
- `service/page/og-crawl.ts`: 외부 OG 크롤러 endpoint 호출/응답 정규화
- `service/page/__tests__/schema.test.ts`: 페이지 아이템/소셜 계정 입력 검증 테스트
- `service/page/__tests__/og-crawl.test.ts`: OG 크롤러 URL 구성/응답 정규화 테스트
- `service/page/__tests__/social-items.test.ts`: 소셜 계정 정렬/핸들 입력 처리 테스트

## 핵심 설계 결정
- `/api/pages/{handle}/items` 요청은 페이지 도메인 스키마에서 검증한다.
- memo 생성은 DB 함수(`create_memo_item_for_owned_page`)로 위임해 정합성과 동시성을 DB에서 보장한다.
- map 생성은 페이지 단위 advisory lock 후 `max(order_key)+1`로 삽입해 순서 키 충돌을 회피하고, `size_code`를 `page_item_size` enum으로 저장한다.
- memo 수정은 `page + page_item` 조인 조건(`handle + user_id + item_id + memo 타입`)으로 소유권과 타입을 함께 검증한다.
- map 수정은 `page + page_item` 조인 조건(`handle + user_id + item_id + map 타입`)으로 소유권과 타입을 함께 검증한다.
- 페이지 아이템 조회는 `page_item` + `page` 조인으로 handle 기준 조회하고, `is_visible=true` 조건의 모든 타입 아이템을 노출한다.
- 페이지 소셜 계정 조회는 `page_social_items` + `page` 조인으로 handle 기준 조회하고, `is_visible=true` 조건만 노출한다.
- 페이지 소셜 계정 저장은 `(page_id, platform)` 유니크 제약 기반 upsert로 처리해 플랫폼당 1개 레코드를 유지한다.
- 페이지 소셜 계정 삭제는 물리 삭제 대신 `is_visible=false` soft delete로 처리한다.
- 소셜 계정 배치 입력은 플랫폼별 식별자를 정규화하고, 빈 식별자는 제외한다.
- OG 조회는 외부 crawl endpoint를 `mode=static`으로 호출하고, 개발 환경에서만 timings 메타를 요청한다.

## 사용 패턴
- API 라우트는 인증/HTTP 에러 매핑을 담당하고, 비즈니스 로직은 `service/page/*`에 위임한다.
- path handle은 항상 `@handle` 저장 포맷으로 정규화 후 처리한다.
- 공개 페이지 서버 컴포넌트는 `findVisiblePageItemsByPathHandle`로 전체 아이템을 조회하고, 클라이언트 섹션에서 타입별 표시를 분기한다.
- 공개 페이지 서버 컴포넌트는 소유자 편집 시 `findVisiblePageSocialItemsByPathHandle`로 소셜 계정 초기값을 추가 조회한다.
- 소셜 계정 저장 API(`POST /api/pages/{handle}/social-items`)는 `upserts + deletes`를 배치로 처리한다.
