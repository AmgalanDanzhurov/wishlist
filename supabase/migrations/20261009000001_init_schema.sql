-- My Wish: начальная схема.
-- Каждая строка принадлежит пользователю (user_id), RLS пускает только к своим строкам.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#5b4bdb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  url text,
  image_url text,
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'RUB' check (currency in ('RUB', 'USD', 'CNY')),
  category_id uuid,
  priority smallint not null default 2 check (priority between 1 and 3),
  target_date date,
  status text not null default 'wanted' check (status in ('wanted', 'bought')),
  bought_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  -- категория обязана принадлежать тому же пользователю; при её удалении товар остаётся без категории
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id)
);

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  currency text not null default 'RUB' check (currency in ('RUB', 'USD', 'CNY')),
  note text check (char_length(note) <= 200),
  item_id uuid,
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references public.items (id, user_id) on delete set null (item_id)
);

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  main_currency text not null default 'RUB' check (main_currency in ('RUB', 'USD', 'CNY')),
  updated_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id);
create index items_user_id_idx on public.items (user_id);
create index items_category_id_idx on public.items (category_id, user_id);
create index deposits_user_id_idx on public.deposits (user_id, created_at);
create index deposits_item_id_idx on public.deposits (item_id, user_id);

alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.deposits enable row level security;
alter table public.settings enable row level security;

create policy "own categories" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own items" on public.items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own deposits" on public.deposits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own settings" on public.settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
