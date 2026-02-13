# Route Access Control

## 목적
로그인 상태와 온보딩 완료 상태에 따라 접근 가능한 라우트를 강제한다.

## 핵심 파일
- `proxy.ts`
- `lib/auth/route-access.ts`
- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/onboarding/page.tsx`
- `app/me/page.tsx`

## 정책
- 비로그인 사용자는 `/onboarding` 접근 불가
- 로그인 + 온보딩 미완료 사용자는 `/onboarding`만 접근 가능
- 로그인 + 온보딩 완료 사용자는 `/sign-in` 접근 불가

## 구현 포인트
- `proxy.ts`에서 브라우저 페이지 라우트 선제 리다이렉트
- 페이지 컴포넌트에서도 세션/완료 상태를 재검증
- `returnTo` 쿼리와 referer 기반 return path 모두 동일한 내부 경로/루프 방지 규칙 적용
- `/me`는 CTA 전용 서버 라우트로, 로그인/온보딩/primary 페이지 리다이렉트를 최종 결정한다.
- 소셜 로그인 시 `callbackURL`은 `/sign-in` 진입 시점의 return path(`returnTo` 우선, referer fallback)를 사용한다.

## 운영 체크
- 리다이렉트 루프를 막기 위해 `/sign-in`, `/onboarding`은 return path 후보에서 제외한다.
- return path 후보는 반드시 slash(`/`)로 시작하는 내부 경로만 허용한다.
- 온보딩 판별은 `userMetadata.onboardingComplete === true`만 완료로 간주한다.
