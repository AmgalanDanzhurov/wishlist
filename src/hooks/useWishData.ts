import { useCallback, useEffect, useState } from 'react'
import { demoCategories, demoDeposits, demoItems } from '../data/demo'
import { supabase } from '../lib/supabase'
import type { Category, Currency, Deposit, Item } from '../types'

export interface WishData {
  categories: Category[]
  items: Item[]
  deposits: Deposit[]
  mainCurrency: Currency
}

export type ItemInput = Pick<
  Item,
  'title' | 'url' | 'image_url' | 'price' | 'currency' | 'category_id' | 'priority' | 'target_date'
>

export type CategoryInput = Pick<Category, 'name' | 'color'>

export type DepositInput = Pick<Deposit, 'amount' | 'currency' | 'note'> & { created_at?: string }

// numeric из Postgres на всякий случай приводим к числу
const toItem = (row: Item): Item => ({ ...row, price: Number(row.price) })
const toDeposit = (row: Deposit): Deposit => ({ ...row, amount: Number(row.amount) })

export function useWishData(userId: string) {
  const [data, setData] = useState<WishData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [categories, items, deposits, settings] = await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('items').select('*').order('created_at'),
      supabase.from('deposits').select('*').order('created_at'),
      supabase.from('settings').select('main_currency').maybeSingle(),
    ])
    const err = categories.error ?? items.error ?? deposits.error ?? settings.error
    if (err) {
      setError(err.message)
      return
    }
    setError(null)
    setData({
      categories: categories.data ?? [],
      items: (items.data ?? []).map(toItem),
      deposits: (deposits.data ?? []).map(toDeposit),
      mainCurrency: (settings.data?.main_currency as Currency | undefined) ?? 'RUB',
    })
  }, [])

  useEffect(() => {
    reload()
    // данные могли поменяться на другом устройстве — перечитываем, когда вкладка снова активна
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload, userId])

  const setMainCurrency = useCallback(
    async (currency: Currency) => {
      setData((d) => (d ? { ...d, mainCurrency: currency } : d))
      const { error } = await supabase
        .from('settings')
        .upsert({ user_id: userId, main_currency: currency, updated_at: new Date().toISOString() })
      if (error) setError(error.message)
    },
    [userId],
  )

  /** Заполняет пустой список примерами, чтобы было на что посмотреть. */
  const seedDemo = useCallback(async () => {
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .insert(demoCategories.map(({ name, color }) => ({ name, color })))
      .select()
    if (catErr) return setError(catErr.message)

    const categoryIdByName = new Map(cats.map((c: Category) => [c.name, c.id]))
    const demoCategoryName = new Map(demoCategories.map((c) => [c.id, c.name]))
    const { error: itemErr } = await supabase.from('items').insert(
      demoItems.map(({ title, url, image_url, price, currency, category_id, priority, target_date }) => ({
        title,
        url,
        image_url,
        price,
        currency,
        priority,
        target_date,
        category_id: category_id ? categoryIdByName.get(demoCategoryName.get(category_id)!) : null,
      })),
    )
    if (itemErr) return setError(itemErr.message)

    const { error: depErr } = await supabase
      .from('deposits')
      .insert(demoDeposits.map(({ amount, currency, note, created_at }) => ({ amount, currency, note, created_at })))
    if (depErr) return setError(depErr.message)

    await reload()
  }, [reload])

  // Мутации ниже бросают ошибку — её показывает форма, из которой их вызвали.

  const saveItem = useCallback(async (input: ItemInput, id?: string) => {
    const query = id ? supabase.from('items').update(input).eq('id', id) : supabase.from('items').insert(input)
    const { data: row, error } = await query.select().single()
    if (error) throw error
    const item = toItem(row)
    setData((d) => d && { ...d, items: id ? d.items.map((i) => (i.id === id ? item : i)) : [...d.items, item] })
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    setData((d) => d && { ...d, items: d.items.filter((i) => i.id !== id) })
  }, [])

  const saveCategory = useCallback(async (input: CategoryInput, id?: string) => {
    const query = id
      ? supabase.from('categories').update(input).eq('id', id)
      : supabase.from('categories').insert(input)
    const { data: row, error } = await query.select().single()
    if (error) throw error
    setData(
      (d) =>
        d && {
          ...d,
          categories: id ? d.categories.map((c) => (c.id === id ? row : c)) : [...d.categories, row],
        },
    )
    return row as Category
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    // в базе category_id у товаров обнуляется сам (on delete set null)
    setData(
      (d) =>
        d && {
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          items: d.items.map((i) => (i.category_id === id ? { ...i, category_id: null } : i)),
        },
    )
  }, [])

  const addDeposit = useCallback(async (input: DepositInput) => {
    const { data: row, error } = await supabase.from('deposits').insert(input).select().single()
    if (error) throw error
    setData((d) => d && { ...d, deposits: [...d.deposits, toDeposit(row)] })
  }, [])

  const deleteDeposit = useCallback(async (id: string) => {
    const { error } = await supabase.from('deposits').delete().eq('id', id)
    if (error) throw error
    setData((d) => d && { ...d, deposits: d.deposits.filter((x) => x.id !== id) })
  }, [])

  /** Отмечает товар купленным и, если нужно, списывает потраченное из накоплений. */
  const markBought = useCallback(async (item: Item, spent: { amount: number; currency: Currency } | null) => {
    const { data: row, error } = await supabase
      .from('items')
      .update({ status: 'bought', bought_at: new Date().toISOString() })
      .eq('id', item.id)
      .select()
      .single()
    if (error) throw error
    let deposit: Deposit | null = null
    if (spent && spent.amount > 0) {
      const res = await supabase
        .from('deposits')
        .insert({ amount: -spent.amount, currency: spent.currency, note: `Покупка: ${item.title}`.slice(0, 200), item_id: item.id })
        .select()
        .single()
      if (res.error) throw res.error
      deposit = toDeposit(res.data)
    }
    setData(
      (d) =>
        d && {
          ...d,
          items: d.items.map((i) => (i.id === item.id ? toItem(row) : i)),
          deposits: deposit ? [...d.deposits, deposit] : d.deposits,
        },
    )
  }, [])

  /** Возвращает товар в список желаний и отменяет списание за его покупку. */
  const restoreItem = useCallback(async (item: Item) => {
    const { data: row, error } = await supabase
      .from('items')
      .update({ status: 'wanted', bought_at: null })
      .eq('id', item.id)
      .select()
      .single()
    if (error) throw error
    const del = await supabase.from('deposits').delete().eq('item_id', item.id).lt('amount', 0)
    if (del.error) throw del.error
    setData(
      (d) =>
        d && {
          ...d,
          items: d.items.map((i) => (i.id === item.id ? toItem(row) : i)),
          deposits: d.deposits.filter((x) => !(x.item_id === item.id && x.amount < 0)),
        },
    )
  }, [])

  return {
    data,
    markBought,
    restoreItem,
    addDeposit,
    deleteDeposit,
    error,
    reload,
    setMainCurrency,
    seedDemo,
    saveItem,
    deleteItem,
    saveCategory,
    deleteCategory,
  }
}
