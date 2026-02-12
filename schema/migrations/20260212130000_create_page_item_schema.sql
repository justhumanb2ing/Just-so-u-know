begin;

create table if not exists public.item_type (
  code text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.item_type (code, is_active)
values
  ('memo', true),
  ('image', true),
  ('video', true),
  ('link', true),
  ('map', true)
on conflict (code) do nothing;

create table if not exists public.item_size (
  code text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.item_size (code, is_active)
values
  ('wide-short', true),
  ('wide-tall', true),
  ('wide-full', true)
on conflict (code) do nothing;

create table if not exists public.page_item (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.page(id) on delete cascade,
  type_code text not null references public.item_type(code),
  size_code text not null references public.item_size(code),
  order_key integer not null,
  data jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  lock_version integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_item_order_key_positive_check check (order_key > 0),
  constraint page_item_data_object_check check (jsonb_typeof(data) = 'object'),
  constraint page_item_lock_version_nonnegative_check check (lock_version >= 0),
  constraint page_item_page_id_order_key_unique unique (page_id, order_key)
);

alter table public.page_item
  drop constraint if exists page_item_order_key_length_check;

alter table public.page_item
  alter column order_key type integer
  using order_key::integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'page_item_order_key_positive_check'
      and conrelid = 'public.page_item'::regclass
  ) then
    alter table public.page_item
      add constraint page_item_order_key_positive_check check (order_key > 0);
  end if;
end
$$;

create index if not exists page_item_page_visible_order_idx
  on public.page_item (page_id, is_visible, order_key);

create index if not exists page_item_page_type_idx
  on public.page_item (page_id, type_code);

drop function if exists public.create_memo_item_for_owned_page(text, text, text);

create or replace function public.create_memo_item_for_owned_page(
  p_user_id text,
  p_handle text,
  p_content text
)
returns public.page_item
language plpgsql
as $$
declare
  v_normalized_handle text;
  v_normalized_content text;
  v_page_id uuid;
  v_last_order_key integer;
  v_next_order integer;
  v_created_item public.page_item;
begin
  if p_user_id is null or btrim(p_user_id) = '' then
    raise exception 'user id is required' using errcode = 'P0001';
  end if;

  v_normalized_handle := lower(btrim(p_handle));

  if v_normalized_handle !~ '^@[a-z0-9]{3,20}$' then
    raise exception 'invalid handle format' using errcode = 'P0001';
  end if;

  v_normalized_content := regexp_replace(coalesce(p_content, ''), E'\\r\\n?', E'\n', 'g');

  if btrim(v_normalized_content) = '' then
    raise exception 'memo content is required' using errcode = 'P0001';
  end if;

  select id
  into v_page_id
  from public.page
  where user_id = p_user_id
    and handle = v_normalized_handle
  limit 1;

  if v_page_id is null then
    raise exception 'page not found or permission denied' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_page_id::text));

  select order_key
  into v_last_order_key
  from public.page_item
  where page_id = v_page_id
  order by order_key desc
  limit 1;

  if v_last_order_key is null then
    v_next_order := 1;
  else
    v_next_order := v_last_order_key + 1;
  end if;

  if v_next_order > 2147483647 then
    raise exception 'order key overflow' using errcode = 'P0001';
  end if;

  insert into public.page_item (
    page_id,
    type_code,
    size_code,
    order_key,
    data
  ) values (
    v_page_id,
    'memo',
    'wide-short',
    v_next_order,
    jsonb_build_object('content', v_normalized_content)
  )
  returning * into v_created_item;

  return v_created_item;
end;
$$;

create or replace function public.set_page_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_page_item_set_updated_at on public.page_item;
create trigger trg_page_item_set_updated_at
before update on public.page_item
for each row
execute function public.set_page_item_updated_at();

-- NOTE:
-- 현재 앱은 Direct Postgres 연결 구조를 사용하므로, page와 동일한 정책으로 RLS를 비활성화한다.
alter table public.item_type disable row level security;
alter table public.item_size disable row level security;
alter table public.page_item disable row level security;

commit;
