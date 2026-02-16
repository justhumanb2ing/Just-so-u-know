# CONTEXT

## 이 모듈이 하는 일
- 온보딩/페이지 도메인의 검증/조회/트랜잭션 로직을 제공한다.

## 파일 구조와 역할
- `service/onboarding/schema.ts`: zod 기반 입력/저장 포맷 검증
- `service/onboarding/service.ts`: 중복 검사, 페이지 생성, 온보딩 완료 처리
- `service/onboarding/public-page.ts`: 공개 페이지 조회/정규화/소유자 프로필 수정/공개 여부 토글
- `service/onboarding/reserved-handles.ts`: 예약어 목록
- `service/onboarding/__tests__/*`: 도메인 단위 테스트
- `service/page/schema.ts`: 페이지 아이템 입력 검증과 path handle 정규화
- `service/page/items.ts`: 페이지 아이템 DB 호출 로직
- `service/page/__tests__/*`: 페이지 도메인 단위 테스트
- `service/versioning/*`: 서비스 버전 정책, changelog 메타데이터 검증/정렬

## 핵심 설계 결정
- handle 정책은 `schema.ts`를 단일 소스로 사용한다.
- 페이지 생성 + `userMetadata.onboardingComplete` 갱신은 하나의 DB 트랜잭션에서 처리한다.
- DB 에러 코드를 도메인 에러로 변환해 UI 메시지 안정성을 확보한다.

## 사용 패턴
- `app` 계층은 서비스 함수만 호출하고, SQL 세부사항은 서비스 내부에 고정한다.
- 저장 handle은 항상 `@` 접두를 붙인 값을 사용한다.
- 공개 페이지 수정은 반드시 `handle + user_id` 조건으로 소유권을 확인해 update한다.
- 공개 여부 토글은 `is_public = not is_public` 단일 update로 처리해 선조회 없이 원자적으로 반영한다.

## 확장 시 고려사항
- 동시성/정합성 규칙 변경 시 마이그레이션과 서비스 코드를 함께 수정한다.
- 신규 입력 필드 추가 시 zod 스키마와 DB 함수 파라미터를 동시에 업데이트한다.

## (선택) 성능 고려사항
- 공개 페이지 조회는 React `cache()`로 요청 내 중복 조회를 줄인다.

## (선택) 보안 관련 사항
- 서비스 함수는 세션 검증을 가정하지 않으므로 호출부(server action/page)에서 인증 확인이 필수다.
