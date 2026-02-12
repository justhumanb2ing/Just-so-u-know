# CONTEXT

## 이 모듈이 하는 일
- 페이지 도메인의 아이템 입력 검증, 경로 핸들 정규화, 아이템 생성 로직을 제공한다.

## 파일 구조와 역할
- `service/page/schema.ts`: 페이지 handle 정규화와 아이템 생성 입력 검증
- `service/page/items.ts`: 페이지 아이템 DB 호출 로직
- `service/page/__tests__/schema.test.ts`: 페이지 아이템 입력 검증 테스트

## 핵심 설계 결정
- `/api/pages/{handle}/items` 요청은 페이지 도메인 스키마에서 검증한다.
- memo 생성은 DB 함수(`create_memo_item_for_owned_page`)로 위임해 정합성과 동시성을 DB에서 보장한다.

## 사용 패턴
- API 라우트는 인증/HTTP 에러 매핑을 담당하고, 비즈니스 로직은 `service/page/*`에 위임한다.
- path handle은 항상 `@handle` 저장 포맷으로 정규화 후 처리한다.
