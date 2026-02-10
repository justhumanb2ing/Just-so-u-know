# 변경 맥락

## 변경 요약
- `README.md`를 개발 환경/실행/검증 중심 문서로 축소하고, 도메인 설계 문서를 `docs/domains/*`로 분리했다.
- 온보딩 도메인 코드의 기준 경로를 `service/onboarding`로 통일하고 관련 참조를 정리했다.
- 온보딩/공개 페이지/라우트 접근 제어/DB 마이그레이션에 대한 운영 문서를 별도 파일로 구체화했다.
- 사용자/시스템 영향: 신규 참여자는 `README`로 환경을 빠르게 세팅하고, 도메인 규칙은 `docs`에서 목적별로 탐색 가능하다.

## 변경 파일(모듈별)
- root
  - `README.md`
  - `package.json`
  - `bun.lock`
- app
  - `app/(auth)/layout.tsx`
  - `app/(auth)/onboarding/actions.ts`
  - `app/(auth)/onboarding/page.tsx`
  - `app/(auth)/sign-in/page.tsx`
  - `app/[handle]/page.tsx`
  - `app/layout.tsx`
- components
  - `components/onboarding/handle-input-field.tsx`
  - `components/onboarding/onboarding-complete.tsx`
  - `components/onboarding/onboarding-form.tsx`
  - `components/onboarding/use-handle-availability.ts`
  - `components/ui/field.tsx`
  - `components/ui/tooltip.tsx`
- service
  - `service/onboarding/schema.ts`
  - `service/onboarding/service.ts`
  - `service/onboarding/public-page.ts`
  - `service/onboarding/reserved-handles.ts`
  - `service/onboarding/__tests__/schema.test.ts`
  - `service/onboarding/__tests__/reserved-handles.test.ts`
  - `service/onboarding/__tests__/public-page.test.ts`
- schema
  - `schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql`
  - `schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql`
- types
  - `types/supabase.ts`
- docs
  - `docs/README.md`
  - `docs/domains/social-login-providers.md`
  - `docs/domains/account-linking.md`
  - `docs/domains/user-role-field.md`
  - `docs/domains/last-login-method.md`
  - `docs/domains/page-schema.md`
  - `docs/domains/onboarding-flow.md`
  - `docs/domains/rpc-vs-edge-function.md`
  - `docs/domains/route-access-control.md`
  - `docs/domains/home-cta.md`
  - `docs/context/changes/onboarding-20260210.md`

## 핵심 설계 결정
- 환경 설정 문서(`README`)와 도메인 설계 문서(`docs`)를 분리해 온보딩 비용을 낮췄다.
- 온보딩 도메인 코드는 `service/onboarding`를 단일 진입점으로 유지한다.
- DB 정합성(핸들 규칙/기본 페이지/중복 방지)은 마이그레이션과 DB 함수에서 보장하고, 앱 레이어는 검증/오류 매핑/흐름 제어에 집중한다.

## 영향 범위
- 기능 영향
  - 온보딩 동작 자체보다 문서 구조와 참조 경로 명확화에 영향이 크다.
- 성능/안정성 영향
  - 런타임 성능 변화는 크지 않다.
  - 운영 문서 분리로 장애 대응 시 진입 문서 탐색성이 개선된다.
- 마이그레이션/운영 이슈
  - 마이그레이션 적용 순서(`20260210170000` -> `20260210190000`)를 지켜야 한다.
  - `service/onboarding` 경로를 기준으로 신규 코드가 작성되어야 한다.

## 후속 작업/리스크
- `components/ui/field.tsx`, `components/ui/tooltip.tsx`의 lint 오류는 별도 정리 필요.
- 문서가 코드와 어긋나지 않도록 온보딩/인증 정책 변경 시 `docs/domains/*`를 동기화해야 한다.
- `types/supabase.ts` 재생성 시 스키마 설명 문서와 불일치가 생기지 않도록 검토가 필요하다.
