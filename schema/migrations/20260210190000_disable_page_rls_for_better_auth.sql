-- Better Auth + direct Postgres 연결 구조에서는 auth.uid() 기반 RLS가 실효적으로 강제되지 않는다.
-- 기존 정책이 존재할 수 있으므로 안전하게 비활성화/정리한다.

alter table if exists public.page disable row level security;

drop policy if exists page_insert_own on public.page;
drop policy if exists page_select_own on public.page;
drop policy if exists page_update_own on public.page;
drop policy if exists page_delete_own on public.page;
