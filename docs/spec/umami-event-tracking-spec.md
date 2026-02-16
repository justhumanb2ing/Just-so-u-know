# Umami 이벤트 트래킹 명세서 (Public Page + Signup Funnel)

## 배경

- 현재 서비스는 `/[handle]` 공개 페이지를 중심으로 유입이 발생하며, handle 값은 변경될 수 있다.
- handle 기반 URL만으로 페이지뷰를 집계하면 동일 엔티티(page)가 여러 URL로 분산되어 성과 분석이 왜곡될 수 있다.
- 서비스 개선을 위해 방문, 핵심 버튼 클릭, 회원가입 전환, 기능 사용량을 일관된 기준으로 측정해야 한다.

## 목표 (goal)

- `/[handle]`에서는 Umami pageview 자동 추적을 차단하고, `page_id` 기반 이벤트로 방문 지표를 안정적으로 측정한다.
- 비 `/[handle]` 라우트는 수동 pageview 트래킹으로 일관되게 집계한다.
- 방문자 여정 기준 핵심 퍼널을 정의하고 회원가입 전환율을 계산 가능하게 한다.
- 버튼/기능 이벤트를 최소 집합으로 설계해 과측정 없이 의사결정 가능한 지표를 확보한다.

## 안해야 하는 것 (non-goal)

- 모든 UI 인터랙션을 이벤트로 수집하지 않는다.
- 개인 식별 가능 정보(PII: email, phone, raw name)를 이벤트 payload에 저장하지 않는다.
- 초기 단계에서 복잡한 멀티 퍼널/코호트 모델을 한 번에 도입하지 않는다.

## 사용자 스토리 (플로우)

- 방문자(비로그인)는 `/[handle]` 페이지에 진입해 프로필을 조회하고 `Sign In` CTA를 누른다.
- 방문자는 `/sign-in`에서 소셜 로그인 버튼을 선택하고 인증을 시작한다.
- 신규 사용자는 `/onboarding`에서 handle 생성을 완료하고 자신의 공개 페이지로 이동한다.
- 운영자는 `page_id` 단위로 방문/전환 성과를 확인하고, 어떤 유입 소스/CTA가 전환에 기여했는지 판단한다.
- edge case: handle 변경 전/후에도 동일한 `page_id` 성과가 하나의 엔티티로 이어져야 한다.

## 요구사항

- 추적 전략
  - Umami Tracker는 전역에 1회 로드한다.
  - Umami Tracker 설정은 `data-auto-track="false"`로 고정한다.
  - `/[handle]`은 URL(handle) 기반 pageview를 수집하지 않는다.
  - `/[handle]` 전용 페이지뷰 이벤트 `profile_view`를 커스텀 이벤트로 수집하고, `page_id`를 필수 속성으로 넣는다.
  - 비 `/[handle]` 라우트는 라우트 트래커에서 `umami.track()`를 수동 호출해 pageview를 수집한다.
- 이벤트 네이밍 규칙
  - 형식: `<domain>_<action>` (예: `profile_view`, `auth_signin_click`)
  - 동일 의미 이벤트는 화면/컴포넌트가 달라도 같은 이벤트명을 재사용한다.
- 이벤트 카디널리티 규칙
  - 이벤트당 property는 3~5개 이내를 권장한다.
  - free-text 입력값은 저장하지 않는다.
  - enum 성격 값(예: `provider`, `placement`, `source`)을 우선 사용한다.
- 회원가입 전환 정의
  - `signup_start`: `/[handle]`에서 인증 시작 의도를 보인 시점
  - `signup_complete`: 온보딩 완료(`submitOnboardingAction` success) 시점
  - 기본 전환율: `signup_complete / profile_view(unique visitors)`
- 퍼널 정의
  - Step 1: `profile_view`
  - Step 2: `auth_signin_click`
  - Step 3: `auth_social_login_click`
  - Step 4: `signup_complete`
- 컴포넌트 분리 및 파일 구조(권장)
  - `service/analytics/schema.ts`: 이벤트명/속성 타입, 공통 property 스키마
  - `service/analytics/tracker.ts`: `trackEvent`, `trackProfileView`, `identifySession` wrapper
  - `components/analytics/route-tracker.tsx`: 라우트 기반 페이지뷰 트리거 전용 클라이언트 컴포넌트
  - `components/public-page/*`: `/[handle]` 뷰/CTA 이벤트 트리거 연결
  - `components/auth/*`, `components/onboarding/*`: 인증/온보딩 이벤트 트리거 연결

### 이벤트 목록 (v1)

| Event name | Trigger | Required properties | Optional properties | 목적 |
| --- | --- | --- | --- | --- |
| `profile_view` | `/[handle]` 방문자 화면 진입 시 1회 | `page_id`, `is_owner`, `is_public` | `entry_path`, `referrer_type` | handle 변경과 무관한 page 단위 방문 측정 |
| `auth_signin_click` | `/[handle]`의 `Sign In` 클릭 | `page_id`, `placement` | `return_to` | 공개 페이지에서 인증 의도 측정 |
| `auth_mypage_click` | 로그인 사용자가 `My Page` 클릭 | `page_id`, `placement` | 없음 | 방문자/소유자 동선 분리 |
| `auth_social_login_click` | `/sign-in`에서 provider 버튼 클릭 | `provider`, `callback_path` | `entry_source` | provider별 인증 시작량 측정 |
| `signup_start` | 소셜 로그인 요청 직전 | `source`, `provider` | `page_id` | 가입 퍼널 시작점 통일 |
| `signup_complete` | 온보딩 완료(`submitOnboardingAction` success) 시 | `user_id`, `created_page_id` | `provider`, `source` | 최종 가입 전환 측정 |
| `onboarding_handle_submit` | 온보딩 handle 제출 시도 | `attempt_result`(`success`/`error`) | `error_code` | 온보딩 이탈 원인 파악 |
| `feature_use` | 핵심 기능 버튼 클릭/실행 성공 | `feature_name`, `actor_type` | `page_id`, `context` | 가입 이후 기능 사용량 측정 |

## 비기능 요구사항

- 성능
  - 트래킹 호출은 사용자 상호작용을 블로킹하지 않아야 한다.
  - 동일 화면에서 중복 이벤트가 발생하지 않도록 idempotent guard를 둔다.
- 보안/프라이버시
  - payload에 PII를 금지한다.
  - 내부 식별자인 `user_id`는 허용하되, email/phone/name 등 직접 식별 정보는 금지한다.
- 데이터 품질
  - 이벤트 payload는 `schema.ts`를 통해 런타임 검증한다.
  - 필수 property 누락 시 이벤트를 드롭하고 개발 환경에서 경고 로그를 남긴다.
- 운영
  - 이벤트 스키마 버전 필드 `schema_version`(`v1`)를 공통 속성으로 포함한다.
  - 이벤트 추가/변경 시 본 문서와 README analytics 섹션을 동기화한다.

## API/데이터 스키마

- Tracker API (client wrapper)
  - `trackEvent(name: EventName, data: EventPayload): void`
  - `trackProfileView(input: { pageId: string; isOwner: boolean; isPublic: boolean; entryPath?: string }): void`
  - `identifySession(input: { distinctId?: string; userId?: string; role?: "guest" | "member" }): void`
- Umami 연동 규약
  - pageview: 전역 자동 추적은 비활성화하고, 비 `/[handle]` 라우트에서만 `umami.track()`를 수동 호출한다.
  - `/[handle]`: pageview는 전송하지 않고 `profile_view` 이벤트를 source of truth로 사용한다.
  - event: `umami.track(eventName, payload)`
  - session identify: `umami.identify(uniqueId, data)` (PII 금지)
- Payload schema (요약)
  - 공통: `schema_version`, `source`, `timestamp_client?`
  - `profile_view`: `page_id`, `is_owner`, `is_public`, `entry_path?`, `referrer_type?`
  - `signup_complete`: `user_id`, `created_page_id`, `provider?`, `source`
- 리포트 계산식
  - `profile_to_signup_cr = unique(signup_complete) / unique(profile_view)`
  - `signin_click_through_rate = unique(auth_signin_click) / unique(profile_view)`
  - `provider_share(provider) = count(auth_social_login_click where provider=x) / count(auth_social_login_click)`
- 상태 코드/실패 처리
  - tracker 전송 실패는 사용자 플로우를 실패 처리하지 않는다 (fire-and-forget).
  - 개발 환경에서만 콘솔 경고를 남기고, 프로덕션에서는 조용히 실패한다.
