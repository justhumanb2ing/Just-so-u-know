# 변경 맥락

## 변경 요약
- 공개 페이지(`/{handle}`)에서 소유자가 `name`, `bio`를 직접 수정할 수 있는 인라인 편집 기능을 추가했다.
- Enter 입력 시 즉시 저장되고, 입력 중에는 `400ms` 디바운스로 자동 저장된다.
- 줄바꿈은 UI/서버 검증에서 모두 차단해 단일 라인 텍스트로 저장되도록 통일했다.

## 변경 파일
- `app/[handle]/page.tsx`
- `app/[handle]/actions.ts`
- `components/public-page/editable-page-profile.tsx`
- `service/onboarding/public-page.ts`
- `service/onboarding/schema.ts`
- `service/onboarding/__tests__/schema.test.ts`
- `docs/domains/page-schema.md`
- `README.md`

## 핵심 설계 결정
- 소유권 검증은 서버 액션에서 세션 사용자 ID와 페이지 `user_id`를 함께 확인해 강제한다.
- 저장 입력은 zod 스키마에서 정규화/검증하고, DB update는 서비스 계층으로 위임한다.
- 공개 페이지 조회와 편집 권한을 분리해 비소유자는 기존 read-only 렌더링을 유지한다.
