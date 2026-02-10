# RPC vs Edge Function

## 결론
현재 온보딩 페이지 생성 로직은 Edge Function보다 Postgres 함수(RPC)가 적합하다.

## 현재 선택
- SQL 함수: `public.create_page_for_user`
- 호출 위치: `service/onboarding/service.ts`

## 선택 이유
- 단일 DB 트랜잭션으로 원자성 보장
- `pg_advisory_xact_lock` 기반 동시성 제어 가능
- `is_primary` 결정/예약어/제약을 DB 레벨에서 일관되게 유지
- Next.js 서버 액션에서 DB 직접 호출 시 네트워크 홉 최소화

## Edge Function이 유리한 경우
- 외부 API 오케스트레이션이 핵심일 때
- 장시간 작업/비동기 후처리가 클 때
- DB 외부 보안 경계가 필요한 로직일 때

## 운영 기준
- DB 내부 정합성 중심 로직은 RPC 우선
- 외부 시스템 연동 중심 로직은 Edge Function 검토

## 페이지 이미지 업로드 적용 기준
- 현재 페이지 이미지 업로드는 Edge Function/RPC 대신 Next.js Route Handler를 사용한다.
- 이유:
  - Better Auth 세션 검증과 페이지 소유권 검증을 기존 서버 컨텍스트에서 재사용 가능
  - 파일 본문은 presigned URL로 Storage에 직접 업로드해 서버 부하 최소화
  - complete/delete 단계에서 DB 업데이트와 partial failure 응답을 앱 레이어에서 일관되게 처리 가능
