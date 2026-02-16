# service-versioning

## 목적
서비스 버전과 릴리즈 이력을 단일 규칙으로 관리해, 배포 시점 기준으로 `/changelog`와 코드 기준 버전이 항상 일치하도록 유지한다.

## 현재 설정 (2026-02-16)
- 버전 정책: [Semantic Versioning 2.0.0](https://semver.org/)
- 현재 서비스 버전: `0.1.0`
- 단일 소스: `package.json`의 `version`
- changelog 날짜 기준: 배포일(`releasedAt`)
- pre-release 정책: `-alpha`, `-beta`, `-rc` 태그 허용(필요 시), 정식 배포 이력은 배포 완료 버전만 `/changelog`에 기록

## 구현 파일
- `service/versioning/policy.ts`
- `service/versioning/changelog-schema.ts`
- `service/versioning/changelog.ts`
- `changelog/0.1.0.mdx`
- `app/changelog/page.tsx`
- `mdx-components.tsx`
- `next.config.ts`

## changelog 메타데이터 계약
- 필수
  - `version`: SemVer 문자열
  - `releasedAt`: `YYYY-MM-DD` (배포일)
  - `type`: `major | minor | patch | pre-release`
  - `summary`: 버전 요약 문장
  - `highlights`: 1개 이상 주요 변경 사항
- 비사용
  - `Release notes` 본문 렌더링은 사용하지 않는다.

## 버전 업그레이드 작업 가이드
1. `package.json`의 `version`을 SemVer 규칙에 맞게 올린다.
2. `changelog/{version}.mdx`를 `changelog/TEMPLATE.mdx` 기반으로 생성한다.
3. `service/versioning/changelog.ts`에 새 MDX 엔트리를 등록한다.
4. `/changelog` 페이지에서 `버전명`, `업데이트 날짜(배포일)`, `주요 변경 사항`이 정상 노출되는지 확인한다.
5. 아래 검증 커맨드를 실행한다.
   - `bun run test`
   - `bun run lint`
   - `bun run build`

## 공식 문서 근거
- Next.js MDX 가이드: [How to use Markdown and MDX in Next.js](https://nextjs.org/docs/app/guides/mdx)
- Next.js App Router + MDX 컴포넌트 파일 컨벤션: [mdx-components.tsx](https://nextjs.org/docs/app/api-reference/file-conventions/mdx-components)
- 버전 정책: [Semantic Versioning 2.0.0](https://semver.org/)
