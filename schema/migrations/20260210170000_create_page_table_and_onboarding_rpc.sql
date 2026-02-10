create extension if not exists pgcrypto;

create table if not exists public.page (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  title text null,
  handle text not null,
  bio text null,
  image text null,
  is_public boolean not null default true,
  is_primary boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_handle_format_check check (handle ~ '^@[a-z0-9]{3,20}$'),
  constraint page_handle_reserved_check check (
    substring(handle from 2) <> all (
      array[
        'about','admin','api','app','auth','billing','blog','contact','dashboard','docs','explore','help',
        'home','index','login','logout','me','new','onboarding','page','pages','pricing','privacy','root',
        'search','settings','signin','signup','static','support','terms','user','users','www'
      ]
    )
  ),
  constraint page_bio_length_check check (bio is null or char_length(bio) <= 200)
);

create unique index if not exists page_handle_unique_idx on public.page (handle);
create unique index if not exists page_primary_per_user_unique_idx on public.page (user_id) where is_primary;
create index if not exists page_user_id_idx on public.page (user_id);

create or replace function public.set_page_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_page_primary_default()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary is distinct from true then
    return new;
  end if;

  if exists (select 1 from public.page where user_id = new.user_id) then
    new.is_primary := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_page_set_updated_at on public.page;
create trigger trg_page_set_updated_at
before update on public.page
for each row
execute function public.set_page_updated_at();

drop trigger if exists trg_page_set_primary_default on public.page;
create trigger trg_page_set_primary_default
before insert on public.page
for each row
execute function public.set_page_primary_default();

create or replace function public.create_page_for_user(
  p_user_id text,
  p_handle text,
  p_title text default null,
  p_bio text default null,
  p_image text default null,
  p_is_public boolean default true
)
returns public.page
language plpgsql
as $$
declare
  v_normalized_handle text;
  v_has_existing_page boolean;
  v_page public.page;
begin
  if p_user_id is null or btrim(p_user_id) = '' then
    raise exception 'user id is required' using errcode = 'P0001';
  end if;

  v_normalized_handle := lower(btrim(p_handle));

  if v_normalized_handle !~ '^@[a-z0-9]{3,20}$' then
    raise exception 'invalid handle format' using errcode = 'P0001';
  end if;

  if substring(v_normalized_handle from 2) = any (
    array[
      'about','admin','api','app','auth','billing','blog','contact','dashboard','docs','explore','help',
      'home','index','login','logout','me','new','onboarding','page','pages','pricing','privacy','root',
      'search','settings','signin','signup','static','support','terms','user','users','www'
    ]
  ) then
    raise exception 'reserved handle' using errcode = 'P0001';
  end if;

  if p_bio is not null and char_length(btrim(p_bio)) > 200 then
    raise exception 'bio is too long' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id));

  select exists(select 1 from public.page where user_id = p_user_id) into v_has_existing_page;

  insert into public.page (
    user_id,
    title,
    handle,
    bio,
    image,
    is_public,
    is_primary
  ) values (
    p_user_id,
    nullif(btrim(p_title), ''),
    v_normalized_handle,
    nullif(btrim(p_bio), ''),
    nullif(btrim(p_image), ''),
    coalesce(p_is_public, true),
    not v_has_existing_page
  )
  returning * into v_page;

  return v_page;
end;
$$;

-- NOTE:
-- 현재 앱은 Better Auth 사용자 ID(text)를 사용하고, 서버에서 Postgres 직접 연결(DIRECT_URL)로 접근한다.
-- 이 구조에서는 auth.uid() 기반 Supabase RLS 정책이 사용자 식별과 일치하지 않으며,
-- postgres/superuser 연결 시 정책 자체가 우회될 수 있다.
-- 잘못된 보안 가정을 방지하기 위해 page 테이블의 RLS는 비활성화한다.
alter table public.page disable row level security;

drop policy if exists page_insert_own on public.page;
drop policy if exists page_select_own on public.page;
drop policy if exists page_update_own on public.page;
drop policy if exists page_delete_own on public.page;
