with ranked_page_social_items as (
  select
    id,
    row_number() over (
      partition by page_id, platform
      order by updated_at desc, created_at desc, id desc
    ) as rank
  from public.page_social_items
)
delete from public.page_social_items
using ranked_page_social_items
where public.page_social_items.id = ranked_page_social_items.id
  and ranked_page_social_items.rank > 1;

create unique index if not exists page_social_items_page_platform_unique_idx
  on public.page_social_items (page_id, platform);
