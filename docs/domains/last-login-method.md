# Last Login Method

## 목적
사용자의 최근 로그인 수단을 기록하고 로그인 UI에서 재사용한다.

## 핵심 파일
- `lib/auth/auth.ts`
- `lib/auth/auth-client.ts`
- `lib/auth/last-login-method.ts`
- `components/auth/social-login-options.tsx`

## 구조
- 서버: `lastLoginMethod()` 플러그인 등록
- 클라이언트: `lastLoginMethodClient()` 플러그인 등록
- 공통: 쿠키 이름 상수 단일 관리

## 사용 패턴
- UI는 최근 로그인 수단을 우선 강조한다.
- 서버/클라이언트 모두 동일 옵션을 사용해 불일치를 방지한다.

## 운영 체크
- 쿠키 이름 변경 시 서버/클라이언트/테스트를 동시에 반영한다.
