# CONTEXT

## 이 모듈이 하는 일
- 인증/온보딩/공통 UI 컴포넌트를 제공하고, 화면 상태를 표현한다.

## 파일 구조와 역할
- `components/onboarding/*`: 온보딩 입력, 상태 표시, 완료 화면
- `components/auth/*`: 로그인/로그아웃/계정 관련 UI
- `components/public-page/*`: 공개 페이지 소유자 편집 UI
- `components/ui/*`: 재사용 가능한 베이스 UI 컴포넌트

## 핵심 설계 결정
- 온보딩 입력 상태는 `use-handle-availability` 훅으로 분리해 폼 컴포넌트 책임을 축소한다.
- 입력 필드 렌더링은 합성 컴포넌트(`handle-input-field`)로 분리한다.
- 공개 페이지 인증 CTA는 `public-page-auth-action`(Sign in/My Page)와 `public-page-sign-out-action`(Sign out)으로 책임을 분리하고, 각각 분기 함수를 통해 노출 조건을 계산한다.
- 공개 페이지 아이템 UI는 `page-item-section`과 `page-item-composer-bar`로 분리해 목록 렌더링과 생성 바 책임을 분리한다.
- 하단 생성 바는 아이템 draft 생성과 링크 OG 조회 액션을 함께 제공하되, 링크 입력은 `Add Link` popover 내부에서 처리한다.
- 하단 생성 바의 `Image&Video` 액션은 파일 선택 후 `init-upload → presigned PUT → complete-upload` 업로드 플로우를 거쳐 image/video 아이템 생성을 트리거한다.
- 하단 생성 바는 `useIsMobile`(뷰포트) + `useIsMobileWebRuntime`(User Agent) 조건을 합쳐 모바일 환경에서는 렌더링하지 않는다.
- 소유자 편집 화면 상단 handle 텍스트도 동일하게 `useIsMobile` + `useIsMobileWebRuntime` 조건에서 렌더링 자체를 생략한다.
- 방문자 읽기 화면은 `readonly-page-visitor-section`에서 동일한 handle 스타일을 재사용하며, 서버 모바일 UA 조건(`shouldHideHandle`)과 반응형 클래스(`hidden md:block`)를 함께 적용해 모바일 기기/모바일 뷰포트에서 모두 숨긴다.
- 아이템 본문 렌더링은 `page-item-renderers`의 타입별 렌더러 맵(`memo/link/map/image/video/default`)으로 합성한다.
- video 아이템은 `preload=\"metadata\" playsInline muted loop autoPlay` 속성으로 렌더링한다.
- 아이템 draft 편집 입력은 하단 바가 아니라 아이템 목록 영역의 draft 카드에서 처리하며, draft 카드에서 즉시 삭제할 수 있다.
- 링크 생성 중 draft 카드는 `Skeleton` 기반(link 아이콘/타이틀 자리)으로 표시하고, OG 추출/커밋 실패 시 즉시 제거한다.
- map 아이템은 카드 내부에서 `map.tsx` 기반 지도를 렌더링하고, 캡션/구글맵 링크/편집 다이얼로그 트리거를 오버레이로 표시한다.
- `page-item-location-dialog`는 `next/dynamic`으로 lazy import해 초기 번들에서 분리한다.

## 사용 패턴
- 컴포넌트는 가능한 표현과 이벤트 전달에 집중하고, 도메인 검증은 서비스/액션에 위임한다.
- 상태 아이콘/메시지 렌더링은 명시적 status 값으로 분기한다.
- 인라인 편집 컴포넌트는 저장 트리거(디바운스)만 담당하고, 권한 검증은 서버 액션에서 수행한다.
- 소셜 아이콘 액션 버튼은 `animate-ui`의 `Tooltip` 조합(`Tooltip`/`TooltipTrigger`/`TooltipPanel`)으로 라벨을 노출한다.
- 페이지 편집 플로팅 툴바의 계정 액션은 오동작 방지를 위해 `account` 트리거 → Popover 내부 `Sign out`/`Delete account` 버튼의 2단계 액션으로 처리한다.
- 계정 액션 버튼 스타일 분기는 화면 전용 래퍼(`onboarding-account-actions`, `page-owner-account-actions`)에서 담당하고, `SignOutButton`/`DeleteAccountButton`은 기본 동작 컴포넌트로 유지한다.
- 아이템 목록/읽기 전용/편집 variant는 명시적 컴포넌트로 분리해 boolean prop 조합을 피한다.

## 확장 시 고려사항
- UI 문구는 영어 유지 규칙을 따른다.
- 신규 컴포넌트 추가 시 기존 `ui` 컴포넌트와 디자인 토큰을 우선 재사용한다.

## (선택) 성능 고려사항
- 불필요한 재렌더를 줄이기 위해 입력 상태 계산 로직은 훅 내부로 캡슐화한다.
