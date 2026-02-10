# Home CTA

## 목적
홈 화면 CTA를 정적으로 유지하면서 인증 상태별 올바른 목적지로 이동시킨다.

## 핵심 파일
- `components/layout/cta-button.tsx`
- `app/me/page.tsx`

## 동작
- 홈 CTA는 항상 `/me` 링크 버튼을 노출한다.
- 비로그인 사용자가 `/me`에 접근하면 `/sign-in`으로 이동한다.
- 로그인 + 온보딩 완료 사용자가 `/me`에 접근하면 자신의 primary 페이지(`/{handle}`)로 이동한다.
- 로그인 + 온보딩 미완료 사용자가 `/me`에 접근하면 `/onboarding`으로 이동한다.

## 구현 규칙
- `cta-button`은 인증 조회를 수행하지 않는 정적 링크 컴포넌트로 유지한다.
- 인증/리다이렉트 분기는 `/me` 서버 페이지에서 처리한다.
- 랜딩 페이지(`app/page.tsx`)는 `dynamic = "force-static"`으로 고정한다.
- `/me`는 인증 리다이렉트 전용 동적 라우트이므로 CTA 링크는 `prefetch={false}`로 유지해 선행 인증 요청을 방지한다.

## 운영 체크
- `/me` 이동 정책 변경 시 `lib/auth/__tests__/route-access.test.ts`의 `resolveMeRedirectPath` 테스트를 함께 갱신한다.
