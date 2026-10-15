-- Несколько категорий у одного товара: связующая таблица «товар ↔ категория».
-- Колонка items.category_id пока остаётся (её читает старая версия сайта) и удаляется следующей миграцией.

create table public.item_categories (
  item_id uuid not null,
  category_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (item_id, category_id),
  -- и товар, и категория должны принадлежать тому же пользователю; удаление любого из них удаляет связь
  foreign key (item_id, user_id) references public.items (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);

create index item_categories_category_idx on public.item_categories (category_id, user_id);
create index item_categories_user_idx on public.item_categories (user_id);
create index item_categories_item_user_idx on public.item_categories (item_id, user_id);

alter table public.item_categories enable row level security;

create policy "own item categories" on public.item_categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- перенос текущих категорий
insert into public.item_categories (item_id, category_id, user_id)
select id, category_id, user_id from public.items where category_id is not null;
