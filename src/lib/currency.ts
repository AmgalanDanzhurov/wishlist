import type { Currency } from '../types'

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
}

export const CURRENCY_NAME: Record<Currency, string> = {
  RUB: 'Рубль',
  USD: 'Доллар',
  CNY: 'Юань',
}

/** Сколько единиц валюты стоит 1 USD. */
export type Rates = Record<Currency, number>

/** Примерные курсы на случай, если API недоступен. */
export const FALLBACK_RATES: Rates = { USD: 1, RUB: 82, CNY: 7.1 }

export function convert(amount: number, from: Currency, to: Currency, rates: Rates): number {
  if (from === to) return amount
  return (amount / rates[from]) * rates[to]
}

export function formatMoney(amount: number, currency: Currency, exact = false): string {
  const fractionDigits = exact && !Number.isInteger(amount) ? 2 : 0
  const number = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
  return `${number} ${CURRENCY_SYMBOL[currency]}`
}

const RATES_CACHE_KEY = 'mywish:rates'
const RATES_TTL_MS = 24 * 60 * 60 * 1000

export interface RatesState {
  rates: Rates
  updatedAt: number | null
  live: boolean
}

interface RatesCache {
  rates: Rates
  updatedAt: number
}

function readCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY)
    return raw ? (JSON.parse(raw) as RatesCache) : null
  } catch {
    return null
  }
}

function writeCache(cache: RatesCache) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // хранилище недоступно — просто не кешируем
  }
}

/** Курсы обновляются не чаще раза в сутки, между запусками лежат в localStorage. */
export async function loadRates(): Promise<RatesState> {
  const cached = readCache()
  if (cached && Date.now() - cached.updatedAt < RATES_TTL_MS) {
    return { ...cached, live: true }
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const json = await res.json()
    if (json.result !== 'success') throw new Error('rates api error')
    const fresh: RatesCache = {
      rates: { USD: 1, RUB: json.rates.RUB, CNY: json.rates.CNY },
      updatedAt: Date.now(),
    }
    writeCache(fresh)
    return { ...fresh, live: true }
  } catch {
    if (cached) return { ...cached, live: false }
    return { rates: FALLBACK_RATES, updatedAt: null, live: false }
  }
}
