# Route URL Copy

## 목적
현재 라우트의 절대 URL을 클라이언트에서 안전하게 계산하고 복사 동작을 재사용 가능한 훅으로 분리한다.

## 핵심 파일
- `hooks/use-copy-current-route-url.ts`
- `hooks/__tests__/use-copy-current-route-url.test.ts`

## 동작
- `usePathname`, `useSearchParams`, `window.location.hash`를 조합해 현재 절대 URL을 계산한다.
- 클립보드 API(`navigator.clipboard.writeText`)로 URL 복사를 시도한다.
- 복사 성공/실패/미지원 케이스를 toast로 구분 안내한다.

## 구현 규칙
- 훅은 `copyCurrentRouteUrl(): Promise<boolean>`을 반환해 호출자가 성공/실패를 분기할 수 있어야 한다.
- 훅 내부에서 URL 정규화 로직은 `buildAbsoluteRouteUrl`로 분리해 단위 테스트 가능해야 한다.
- 현재 변경에서는 UI 컴포넌트에 훅을 연결하지 않는다.
