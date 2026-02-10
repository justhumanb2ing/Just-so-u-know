# Account Linking

## 목적
같은 이메일로 가입된 소셜 계정/이메일 계정을 하나의 사용자로 안전하게 연결한다.

## 핵심 파일
- `lib/auth/account-linking.ts`
- `lib/auth/auth.ts`

## 현재 정책
- `trustedProviders`: `email-password`, `google`, `kakao`, `github`, `naver`
- `allowDifferentEmails: false` (이메일 불일치 연결 금지)

## 설계 결정
- 계정 연결 규칙은 `lib/auth/account-linking.ts`에서만 수정한다.
- `lib/auth/auth.ts`는 연결 정책을 등록하는 진입점 역할만 수행한다.

## 운영 체크
- 신규 provider 추가 시 trusted 목록에 포함하지 않으면 연결되지 않는다.
- 이메일 정규화/공급자별 이메일 제공 여부를 사전에 검토한다.
