import type { Currency, Deposit, Item, SortKey } from '../types'
import { convert, type Rates } from './currency'

export function totalSavings(deposits: Deposit[], main: Currency, rates: Rates): number {
  return deposits.reduce((sum, d) => sum + convert(d.amount, d.currency, main, rates), 0)
}

export function priceIn(item: Item, main: Currency, rates: Rates): number {
  return convert(item.price, item.currency, main, rates)
}

/** Сколько полных (с округлением вверх) месяцев осталось до даты; минимум 1. */
export function monthsUntil(date: string, now = new Date()): number {
  const target = new Date(date)
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth()) +
    (target.getDate() > now.getDate() ? 1 : 0)
  return Math.max(1, months)
}

export interface DatePlan {
  overdue: boolean
  months: number
  perMonth: number
}

/** Сколько откладывать в месяц, чтобы к дате цели хватило на товар. */
export function datePlan(item: Item, savings: number, main: Currency, rates: Rates): DatePlan | null {
  if (!item.target_date) return null
  const missing = Math.max(0, priceIn(item, main, rates) - savings)
  const overdue = new Date(item.target_date) < new Date(new Date().toDateString())
  const months = monthsUntil(item.target_date)
  return { overdue, months, perMonth: missing / months }
}

export function sortItems(items: Item[], key: SortKey, main: Currency, rates: Rates): Item[] {
  const sorted = [...items]
  const price = (i: Item) => priceIn(i, main, rates)
  switch (key) {
    case 'priority':
      return sorted.sort((a, b) => a.priority - b.priority || price(a) - price(b))
    case 'price-asc':
      return sorted.sort((a, b) => price(a) - price(b))
    case 'price-desc':
      return sorted.sort((a, b) => price(b) - price(a))
    case 'target-date':
      return sorted.sort((a, b) => {
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return a.target_date.localeCompare(b.target_date)
      })
    case 'newest':
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}
