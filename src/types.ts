export type Currency = 'RUB' | 'USD' | 'CNY'

export const CURRENCIES: Currency[] = ['RUB', 'USD', 'CNY']

/** 1 — высокий, 2 — средний, 3 — низкий */
export type Priority = 1 | 2 | 3

export type ItemStatus = 'wanted' | 'bought'

export interface Category {
  id: string
  name: string
  color: string
}

export interface Item {
  id: string
  title: string
  url: string | null
  image_url: string | null
  price: number
  currency: Currency
  /** категории товара (связующая таблица item_categories) */
  category_ids: string[]
  priority: Priority
  target_date: string | null
  status: ItemStatus
  bought_at: string | null
  /** ручной порядок (перетаскивание); меньше — выше */
  position: number
  created_at: string
}

/** Пополнение накоплений. Отрицательная сумма — списание (например, покупка). */
export interface Deposit {
  id: string
  amount: number
  currency: Currency
  note: string | null
  item_id: string | null
  created_at: string
}

export type SortKey = 'manual' | 'priority' | 'price-asc' | 'price-desc' | 'target-date' | 'newest'
