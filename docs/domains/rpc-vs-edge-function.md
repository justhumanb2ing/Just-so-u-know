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
