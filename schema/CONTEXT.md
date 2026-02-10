# CONTEXT

## 이 모듈이 하는 일
- 데이터베이스 스키마/함수/정책의 기준 정의를 관리한다.

## 파일 구조와 역할
- `schema/migrations/20260210170000_create_page_table_and_onboarding_rpc.sql`: page 테이블/인덱스/트리거/RPC 함수 생성
- `schema/migrations/20260210190000_disable_page_rls_for_better_auth.sql`: page RLS 비활성화 및 정책 정리
- `schema/migrations/20260210200000_rename_page_title_to_name.sql`: page `title` 컬럼을 `name`으로 교체하고 RPC 함수 계약 갱신

## 핵심 설계 결정
- 정합성 규칙(handle 포맷/예약어/bio 길이/primary 유일성)을 DB 제약으로 강제한다.
- `create_page_for_user` 함수에서 동시성 락을 사용해 사용자별 페이지 생성 경쟁 조건을 줄인다.
- 현재 인증 구조에서는 RLS보다 서버 경계 + DB 제약 조합을 선택한다.

## 사용 패턴
- 마이그레이션은 파일명 타임스탬프 순서대로 적용한다.
- 앱 로직은 DB 함수 계약(입력/반환 컬럼)을 기준으로 동작한다.

## 확장 시 고려사항
- 스키마 변경 시 `types/supabase.ts` 재생성과 서비스 레이어 동기화가 필요하다.
- 제약 추가 전 기존 데이터 백필 전략을 검토한다.

## (선택) 보안 관련 사항
- RLS를 재도입하려면 인증 식별자 체계(text vs uuid) 정렬이 선행되어야 한다.
