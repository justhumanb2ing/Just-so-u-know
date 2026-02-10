# User Role Field

## 목적
권한 구분을 위한 사용자 role 필드의 스키마와 기본값을 고정한다.

## 핵심 파일
- `lib/auth/additional-fields.ts`
- `lib/auth/user-config.ts`
- `lib/auth/auth.ts`

## 현재 정책
- role enum: `user`, `admin`
- 기본값: `user`

## 설계 결정
- role 정의와 기본값은 `additional-fields`에서만 관리한다.
- `user-config`는 auth 라이브러리 옵션 조립 전용으로 유지한다.

## 확장 시 주의사항
- role 값 추가 시 enum/권한 분기/관리자 화면 접근 정책을 함께 갱신한다.
- 하위 호환을 위해 기존 role 값 제거는 신중히 수행한다.
