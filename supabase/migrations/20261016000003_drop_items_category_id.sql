-- Вторая половина перехода на несколько категорий: новая версия сайта задеплоена и колонку не использует.
-- Сначала досинхронизируем связи (если старая версия успела что-то поменять), потом удаляем колонку.

insert into public.item_categories (item_id, category_id, user_id)
select id, category_id, user_id from public.items where category_id is not null
on conflict do nothing;

alter table public.items drop column category_id;
