# CONTEXT

## 이 모듈이 하는 일
- 서비스 버저닝 정책(SemVer)과 changelog 엔트리 정합성을 단일 규칙으로 관리한다.

## 파일 구조와 역할
- `service/versioning/policy.ts`: 버전 규칙, 현재 서비스 버전, SemVer 비교 유틸
- `service/versioning/changelog-schema.ts`: changelog 메타데이터 스키마 검증/정렬
- `service/versioning/changelog.ts`: MDX changelog 엔트리 등록/노출
- `service/versioning/__tests__/*`: 버전 정책 및 changelog 단위 테스트

## 핵심 설계 결정
- 현재 서비스 버전의 단일 소스는 `package.json`의 `version` 필드다.
- changelog 날짜 기준은 배포일(`releasedAt`)로 고정한다.
- `/changelog` 노출 데이터는 MDX metadata를 zod로 검증한 뒤 사용한다.

## 사용 패턴
- 새 버전 배포 시 `changelog/{version}.mdx`를 추가하고 `service/versioning/changelog.ts`에 등록한다.
- changelog metadata는 `version`, `releasedAt`, `highlights`를 필수로 유지한다.

## 확장 시 고려사항
- pre-release(`-alpha`, `-rc`)를 운영할 때도 SemVer precedence를 그대로 사용한다.
- 엔트리 수가 증가하면 자동 로더(코드젠) 도입을 검토한다.
