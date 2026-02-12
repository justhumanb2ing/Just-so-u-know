alter table public.page_social_items
drop constraint if exists page_social_items_platform_format_check;

alter table public.page_social_items
add constraint page_social_items_platform_format_check
check (
  platform = lower(btrim(platform))
  and platform ~ '^[a-z0-9_]{1,32}$'
);
