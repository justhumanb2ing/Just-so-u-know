begin;

insert into public.item_type (code, is_active)
values ('section', true)
on conflict (code) do update
set is_active = excluded.is_active;

commit;
