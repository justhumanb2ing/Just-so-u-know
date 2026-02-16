# 변경 맥락

## 변경 요약
- `/changelog` 출력 형식을 `버전명/배포일/요약/주요 변경 사항` 중심으로 고정했다.
- `Release notes` 섹션 렌더링을 제거하고, changelog MDX는 메타데이터 기반으로만 관리하도록 단순화했다.
- changelog 스키마에서 `type`, `summary`를 필수화해 표시 일관성을 강화했다.

## 변경 파일
- `app/changelog/page.tsx`
- `changelog/0.1.0.mdx`
- `changelog/TEMPLATE.mdx`
- `service/versioning/changelog-schema.ts`
- `service/versioning/changelog.ts`
- `service/versioning/__tests__/changelog-schema.test.ts`
- `docs/domains/service-versioning.md`

## 핵심 설계 결정
- changelog 엔트리는 본문 markdown 없이 metadata만으로 렌더링한다.
- 릴리즈 타입(`major|minor|patch|pre-release`)과 요약 문장을 모든 버전에 필수로 요구한다.
- 배포일(`releasedAt`) + SemVer precedence를 함께 사용해 목록 정렬을 유지한다.
