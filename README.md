This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Testing (Vitest)

이 프로젝트의 단위 테스트는 Next.js 공식 가이드의 Vitest 수동 설정을 기반으로 구성되어 있습니다.

```bash
bun run test
```

지속 실행(watch) 모드:

```bash
bun run test:watch
```

## Social Login Providers

Social 로그인 버튼 메타데이터(브랜드 컬러, 로그인 옵션명, 아이콘, 버튼 스타일)는 아래 파일에서 관리합니다.

- `components/auth/social-provider-options.tsx`
- `lib/auth/account-linking.ts`

새 provider를 추가할 때는 아래 순서로 관리합니다.

1. `lib/auth/account-linking.ts`의 `ACCOUNT_LINKING_TRUSTED_PROVIDERS`에 provider를 추가합니다.
2. `components/auth/social-provider-options.tsx`의 `SOCIAL_PROVIDER_OPTION_MAP`에 메타데이터를 추가합니다.

`SocialProvider` 타입과 `SOCIAL_PROVIDER_OPTIONS`는 `ACCOUNT_LINKING_TRUSTED_PROVIDERS`에서 파생되어 동기화됩니다.

## Account Linking

소셜 계정과 이메일 로그인 계정을 동일 이메일로 연결하려면 아래 설정을 사용합니다.

- `lib/auth/account-linking.ts`: `trustedProviders`와 이메일 일치 정책(`allowDifferentEmails: false`) 정의
- `lib/auth/auth.ts`: `account.accountLinking`에 위 설정 연결

현재 기본 신뢰 provider는 `email-password`, `google`, `kakao`, `github`, `naver`입니다.

## User Role Field

사용자 role 필드는 아래 설정으로 관리합니다.

- `lib/auth/additional-fields.ts`: `role` enum 값(`user`, `admin`)과 기본값(`user`) 정의
- `lib/auth/user-config.ts`: `user.additionalFields`/`user.deleteUser` 설정 구성
- `lib/auth/auth.ts`: `user` 옵션에 위 설정 연결

## Last Login Method Plugin

마지막 로그인 방식을 추적하기 위해 Better Auth `last-login-method` 플러그인을 적용했습니다.

- `lib/auth/auth.ts`: `lastLoginMethod()` 서버 플러그인 등록
- `lib/auth/auth-client.ts`: `lastLoginMethodClient()` 클라이언트 플러그인 등록
- `lib/auth/last-login-method.ts`: 서버/클라이언트 공통 `cookieName` 설정
- `components/auth/social-login-options.tsx`: 최근 로그인 방식 라벨/버튼 강조 UI 표시

## Database Schema (PostgreSQL)

DB 연결은 `lib/auth/kysely.ts`에서 `DIRECT_URL` 기반 `pg` Pool로 구성합니다.

## Route Access Control

인증/온보딩 접근 제어는 `proxy`(브라우저 페이지 라우트 선제 리다이렉트)와 각 페이지 secure 체크를 함께 사용합니다.

- `proxy.ts`: 브라우저 페이지 라우트에서 세션 상태를 확인해 리다이렉트
  - 비로그인 사용자는 `/onboarding` 접근 불가
  - 로그인 + `userMetadata.onboardingComplete === false` 사용자는 `/onboarding` 외 모든 페이지 접근 시 `/onboarding`으로 리다이렉트
  - 로그인 + 온보딩 완료 사용자는 `/sign-in` 접근 시 안전한 이전 경로(없으면 `/`)로 리다이렉트
- `app/(auth)/sign-in/page.tsx`: 로그인된 사용자는 `/` 또는 안전한 이전 경로로 리다이렉트
- `app/(auth)/onboarding/page.tsx`: 로그인 + `userMetadata.onboardingComplete === false`일 때만 접근 허용
- `lib/auth/route-access.ts`: 이전 경로 계산(동일 origin/루프 방지) 및 온보딩 완료 판별 유틸

## Home CTA Button

홈(`app/page.tsx`)의 CTA 버튼은 현재 세션 상태에 따라 동작이 달라집니다.

- 비로그인 상태: `Sign in` 버튼 노출(`/sign-in` 이동)
- 로그인 상태: `Sign out` 버튼 노출(서버 액션에서 `auth.api.signOut` 실행 후 `/` 리다이렉트)
- `Sign in` 렌더링은 Base UI `render` prop으로 `Link`를 조합하므로 `nativeButton={false}`를 명시

관련 구현 파일:

- `components/layout/cta-button.tsx`
- `components/layout/cta-button-state.ts`

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
