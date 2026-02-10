begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page'
      and column_name = 'title'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page'
      and column_name = 'name'
  ) then
    alter table public.page
      rename column title to name;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page'
      and column_name = 'name'
  ) then
    raise exception 'public.page.name column is required';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page'
      and column_name = 'title'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page'
      and column_name = 'name'
  ) then
    execute 'update public.page set name = coalesce(name, title)';
    execute 'alter table public.page drop column title';
  end if;
end;
$$;

drop function if exists public.create_page_for_user(text, text, text, text, text, boolean);

create function public.create_page_for_user(
  p_user_id text,
  p_handle text,
  p_name text default null,
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
    name,
    handle,
    bio,
    image,
    is_public,
    is_primary
  ) values (
    p_user_id,
    nullif(btrim(p_name), ''),
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

commit;
