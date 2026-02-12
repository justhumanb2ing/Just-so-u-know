begin;

drop function if exists public.create_link_item_for_owned_page(text, text, text, text, text);

create or replace function public.create_link_item_for_owned_page(
  p_user_id text,
  p_handle text,
  p_url text,
  p_title text,
  p_favicon text default null
)
returns public.page_item
language plpgsql
as $$
declare
  v_normalized_handle text;
  v_normalized_url text;
  v_normalized_title text;
  v_normalized_favicon text;
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

  v_normalized_url := btrim(coalesce(p_url, ''));

  if v_normalized_url !~ '^https?://.+' then
    raise exception 'invalid link url' using errcode = 'P0001';
  end if;

  v_normalized_title := regexp_replace(coalesce(p_title, ''), E'\\r\\n?|\\n', ' ', 'g');
  v_normalized_title := btrim(v_normalized_title);

  if v_normalized_title = '' then
    raise exception 'link title is required' using errcode = 'P0001';
  end if;

  v_normalized_favicon := nullif(btrim(coalesce(p_favicon, '')), '');

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
    'link',
    'wide-short',
    v_next_order,
    jsonb_strip_nulls(
      jsonb_build_object(
        'url', v_normalized_url,
        'title', v_normalized_title,
        'favicon', v_normalized_favicon
      )
    )
  )
  returning * into v_created_item;

  return v_created_item;
end;
$$;

commit;
