-- Ручной порядок карточек (перетаскивание).
-- Дробные значения: при переносе карточки ей ставится середина между соседями — меняется одна строка.

alter table public.items add column position double precision;

-- текущий порядок — по дате добавления, отдельно у каждого пользователя
update public.items i
set position = n.rn
from (
  select id, row_number() over (partition by user_id order by created_at) as rn
  from public.items
) n
where n.id = i.id;

alter table public.items alter column position set not null;

-- Новый товар без явной позиции встаёт в конец списка своего владельца.

create or replace function public.items_set_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.position is null then
    select coalesce(max(position), 0) + 1 into new.position
    from public.items
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger items_set_position
  before insert on public.items
  for each row execute function public.items_set_position();
