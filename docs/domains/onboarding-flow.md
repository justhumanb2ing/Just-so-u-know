# Onboarding Flow

## 목적
핸들 생성부터 페이지 생성/온보딩 완료 처리까지의 전체 흐름을 정의한다.

## 핵심 파일
- `components/onboarding/onboarding-form.tsx`
- `components/onboarding/handle-form.tsx`
- `components/onboarding/handle-input-field.tsx`
- `components/onboarding/use-handle-availability.ts`
- `app/(auth)/onboarding/actions.ts`
- `app/[handle]/actions.ts`
- `service/onboarding/schema.ts`
- `service/onboarding/service.ts`
- `service/onboarding/public-page.ts`
- `app/[handle]/page.tsx`

## 동작 순서
1. 사용자가 handle 입력
2. 클라이언트 훅에서 정규화/디바운스 검증 호출
3. 서버 액션에서 세션 확인 후 handle 중복검사
4. 제출 시 zod로 `handle`, `verifiedHandle`, `name`, `bio`, `image` 검증
5. 서버에서 중복 재검증 후 트랜잭션으로 페이지 생성 + `onboardingComplete=true` 반영
6. 완료 컴포넌트에서 공개 페이지 경로로 이동

## 입력 정책
- handle: 소문자/숫자만, 길이 3~20
- 저장 handle: 항상 `@` 접두 포함
- bio: 최대 200자
- name/bio/image: nullable

## 설계 결정
- 클라이언트의 사전 검증 결과는 UX 목적이며, 서버에서 반드시 재검증한다.
- 페이지 생성과 메타데이터 갱신은 단일 트랜잭션으로 처리한다.
- 핸들 입력 폼은 온보딩 생성/페이지 핸들 변경에서 공통 컴포넌트로 재사용한다.
- 제출 에러는 버튼 영역을 대체해 노출하고, 사용자가 입력을 수정하면 버튼 영역을 다시 복원한다.

## 운영 체크
- `verifiedHandle !== handle`이면 제출 거부해야 한다.
- handle 유니크 실패는 DB 에러 코드를 사용자 메시지로 매핑한다.
