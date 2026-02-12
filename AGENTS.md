# AGENTS.md

이 저장소에서 작업하는 에이전트/개발자는 아래 규칙을 따른다.

## 기본 작업 원칙

- 패키지 매니저는 `bun`을 사용한다.
- 모든 응답/커뮤니케이션은 한국어로 작성한다.
- 구현 및 변경은 작게 쪼개고, 동작 검증 가능한 단위로 커밋한다.
- 구현 완료 전 반드시 빌드/테스트/린트 등 검증 커맨드를 실행해 결과를 확인한다.
- 근거 없는 추정 구현 대신 공식 문서와 현재 코드베이스 컨텍스트를 우선한다.
- 공식 문서는 반드시 context7 mcp를 사용해서 읽는다.
- 개발은 `동작 가능 상태 확보 > 핵심 기능 구현 > 문서화/고도화` 순서로 진행한다.
- 중요한 로직에는 JSDOC을 한국어로 반드시 적용한다.

## 스킬 사용 규칙 (필수)

### 기능 구현 및 리팩토링

기능 구현/수정/리팩토링 시에는 아래 두 스킬을 항상 함께 사용한다.

- [$vercel-composition-patterns](/Users/zentechie/.agents/skills/vercel-composition-patterns/SKILL.md)
- [$vercel-react-best-practices](/Users/zentechie/.agents/skills/vercel-react-best-practices/SKILL.md)
- skill path: `/Users/zentechie/.agents/skills/vercel-composition-patterns/SKILL.md`
- skill path: `/Users/zentechie/.agents/skills/vercel-react-best-practices/SKILL.md`

참고용 수동 확인 명령:

```bash
cat /Users/zentechie/.agents/skills/vercel-composition-patterns/SKILL.md
cat /Users/zentechie/.agents/skills/vercel-react-best-practices/SKILL.md
```

### UI 작업

- 화면에 표시될 텍스트는 모두 영어로 작업한다.
- UI 컴포넌트는 `shadcn/ui`를 직접 설치해 사용한다. (base-ui 기반)
```bash
bunx --bun shadcn@latest add component-name
```

## 테스트 규칙 (필수)

- 코드 변경 시 테스트 작성을 기본 원칙으로 한다.
- 컴포넌트 테스트와 페이지 테스트는 기본 의무 대상에서 제외한다.
- 테스트 파일의 위치는 테스트 파일을 생성하려는 파일과 같은 레벨에 `__tests__` 폴더 내부이다.
- `__tests__` 폴더가 없다면 생성한다.
- 신규 기능 추가 시 단위 테스트를 최소 1개 이상 작성한다.
- 버그 수정 시 회귀 방지 테스트를 반드시 추가한다.
- 결제/정합성/동시성 관련 기능은 동시 요청 시나리오 테스트를 별도로 작성한다.
- 테스트 코드는 AAA(Arrange-Act-Assert) 구조를 강제한다.

## 문서 동기화 규칙

- 코드 변경 시 관련 문서를 함께 동기화한다.
- 최소 동기화 대상: `README`, 아키텍처/규약 문서, API/동작 변경 문서.
- 구현 내용과 문서 내용이 불일치하면 문서를 즉시 최신화한다.

## 도메인 폴더 배치 규칙 (필수)

- 폴더 선택 기준은 "화면/사용자 여정(step)"이 아니라 "도메인 책임과 불변식"으로 결정한다.
- 같은 엔티티와 동일한 불변식(권한, 정합성, 상태 전이)을 공유하는 로직은 하나의 도메인 폴더에 모은다.
- 기존 폴더에 코드를 추가할 때는 아래 3가지를 모두 만족해야 한다.
  - 동일한 핵심 엔티티를 다룬다.
  - 동일한 권한 규칙/정합성 규칙을 따른다.
  - 동일한 변경 이유(배포 시 함께 바뀌는 경향)를 가진다.
- 위 3가지 중 하나라도 다르면 새 도메인 폴더(`service/<domain>/*`, 필요 시 `components/<domain>/*`)를 만든다.
- API 라우트도 같은 기준을 적용해 URL/핸들러/서비스 계층의 도메인 경계를 일치시킨다.
- 임시로 "가까운 기존 폴더"에 넣는 것을 금지한다. 먼저 도메인 경계를 정한 뒤 파일 위치를 결정한다.
- 도메인이 애매하면 구현 전에 `docs/domains/*.md`에 아래를 3~5줄로 먼저 작성한다.
  - 엔티티
  - 핵심 유스케이스
  - 권한/정합성 규칙
  - 제외 범위(이 도메인이 다루지 않는 것)
- 리뷰/수정 시에는 "기능 동작"과 별개로 "도메인 폴더 위치의 타당성"을 반드시 확인한다.

## 커밋 메시지 규칙

- 커밋 메시지 형식은 `prefix(domain): 작업 내용`으로 고정한다.
- 하단에 불릿 리스트로 상세 변경 사항을 작성한다.
- `prefix` 예시: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- `domain` 예시: `auth`, `billing`, `analysis`, `infra`, `docs`, `api`

예시:

```text
feat(api): Swagger 문서 엔드포인트 추가
- /api-docs UI 경로 추가
- /api-docs/openapi.json 스펙 문서 추가
```
