# Social Login Providers

## 목적
소셜 로그인 버튼의 표시 정보와 실제 계정 연결 허용 provider를 일관되게 관리한다.

## 핵심 파일
- `components/auth/social-provider-options.tsx`
- `lib/auth/account-linking.ts`

## 규칙
- `ACCOUNT_LINKING_TRUSTED_PROVIDERS`를 단일 기준으로 사용한다.
- `SOCIAL_PROVIDER_OPTION_MAP`에는 UI 메타데이터(라벨, 아이콘, 스타일)를 정의한다.
- `SocialProvider` 타입과 `SOCIAL_PROVIDER_OPTIONS`는 trusted providers로부터 파생되어야 한다.

## 신규 provider 추가 절차
1. `lib/auth/account-linking.ts`에 provider를 추가한다.
2. `components/auth/social-provider-options.tsx`에 버튼 메타데이터를 추가한다.
3. 로그인 버튼 노출/정렬/강조 상태를 확인한다.
4. 기존 provider 회귀를 확인한다.

## 운영 체크
- 계정 연결 정책과 UI 노출 목록이 불일치하지 않는지 확인한다.
- provider 키 누락 시 런타임 실패가 발생하므로 배포 전 환경 변수를 점검한다.
