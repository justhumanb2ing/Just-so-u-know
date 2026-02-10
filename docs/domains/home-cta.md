# Home CTA

## 목적
홈 화면 CTA를 세션 상태에 따라 일관되게 제공한다.

## 핵심 파일
- `components/layout/cta-button.tsx`
- `components/layout/cta-button-state.ts`

## 동작
- 비로그인: `Sign in` 버튼 노출
- 로그인: `Sign out` 버튼 노출

## 구현 규칙
- `Sign in`은 링크 렌더링이므로 Base UI 버튼에서 `nativeButton={false}`를 명시한다.
- 로그아웃은 서버 액션(`auth.api.signOut`) 이후 안전한 경로로 리다이렉트한다.

## 운영 체크
- 세션 판별 로직 변경 시 CTA 상태 테스트를 함께 갱신한다.
