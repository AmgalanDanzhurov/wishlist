# My Wish

Список желаний с накоплениями: товары с картинками, ценами и ссылками, плашка с текущими накоплениями,
история пополнений с графиком, цели по дате и архив купленного. Данные синхронизируются между устройствами через Supabase.

**Стек:** React + TypeScript + Vite, Supabase (Postgres, вход по почте, RLS), Recharts.

## Запуск локально

```bash
npm install
cp .env.example .env.local   # и вписать адрес проекта и publishable key из Supabase
npm run dev                  # http://localhost:5173
```

## Структура

| Путь | Что там |
|---|---|
| `src/components/` | экраны и окна: главный экран, карточка, формы, история |
| `src/hooks/useWishData.ts` | загрузка и сохранение данных в Supabase |
| `src/lib/calc.ts` | расчёты: накопления, сортировка, сколько откладывать в месяц |
| `src/lib/currency.ts` | валюты (₽, $, ¥), курсы и форматирование |
| `supabase/migrations/` | SQL-схема базы и правила доступа |

## База данных

Таблицы `categories`, `items`, `deposits`, `settings`. Каждая строка принадлежит пользователю,
политики RLS пускают только к своим строкам. Накопления — сумма всех записей в `deposits`
(покупка записывается отрицательной суммой со ссылкой на товар).

## Деплой (Vercel)

1. `npx vercel login`
2. `npx vercel --prod` — при первом запуске CLI спросит настройки проекта (подходят значения по умолчанию).
3. В настройках проекта на Vercel добавить переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. В Supabase → Authentication → URL Configuration добавить адрес сайта на Vercel в Site URL и Redirect URLs.
