import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { convert, formatMoney, type Rates } from '../lib/currency'
import type { Currency, Deposit } from '../types'
import { TrashIcon } from './icons'
import { Modal } from './Modal'

interface Props {
  deposits: Deposit[]
  mainCurrency: Currency
  rates: Rates
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

interface Point {
  day: string
  total: number
}

const dayKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fullDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

/** Сумма накоплений на конец каждого дня, в котором были операции. */
function buildSeries(deposits: Deposit[], main: Currency, rates: Rates): Point[] {
  const sorted = [...deposits].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const points: Point[] = []
  let total = 0
  for (const d of sorted) {
    total += convert(d.amount, d.currency, main, rates)
    const day = dayKey(d.created_at)
    const last = points[points.length - 1]
    if (last?.day === day) last.total = total
    else points.push({ day, total })
  }
  return points
}

function ChartTooltip({ active, payload, currency }: { active?: boolean; payload?: { payload: Point }[]; currency: Currency }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="chart-tip">
      <div className="muted">{fullDate.format(new Date(p.day))}</div>
      <b>{formatMoney(p.total, currency)}</b>
    </div>
  )
}

export function DepositHistory({ deposits, mainCurrency, rates, onDelete, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const series = buildSeries(deposits, mainCurrency, rates)
  const newestFirst = [...deposits].sort((a, b) => b.created_at.localeCompare(a.created_at))

  async function remove(d: Deposit) {
    if (!confirm(`Удалить запись «${formatMoney(d.amount, d.currency, true)}»?`)) return
    try {
      await onDelete(d.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить')
    }
  }

  return (
    <Modal title="История накоплений" onClose={onClose}>
      {series.length >= 2 ? (
        <figure className="chart" aria-label="График накоплений">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="chart__fill-top" />
                  <stop offset="100%" className="chart__fill-bottom" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(d: string) => shortDate.format(new Date(d))}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                
              />
              <YAxis
                tickFormatter={(v: number) => compact.format(v)}
                tickLine={false}
                axisLine={false}
                width={44}
                
              />
              <Tooltip content={<ChartTooltip currency={mainCurrency} />} cursor={{ className: 'chart__cursor' }} />
              <Area
                type="monotone"
                dataKey="total"
                className="chart__area"
                strokeWidth={2}
                fill="url(#savingsFill)"
                activeDot={{ r: 5, className: 'chart__dot' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <figcaption className="muted">Сумма накоплений в {mainCurrency === 'RUB' ? 'рублях' : mainCurrency === 'USD' ? 'долларах' : 'юанях'} по текущему курсу</figcaption>
        </figure>
      ) : (
        <p className="muted">График появится, когда будет хотя бы два дня с пополнениями.</p>
      )}

      {error && <p className="form__error">{error}</p>}

      {newestFirst.length > 0 ? (
        <ul className="history">
          {newestFirst.map((d) => (
            <li key={d.id} className="history__row">
              <div className="history__info">
                <span className="history__note">{d.note || (d.amount > 0 ? 'Пополнение' : 'Снятие')}</span>
                <span className="muted history__date">{fullDate.format(new Date(d.created_at))}</span>
              </div>
              <div className="history__amount">
                <span className={d.amount > 0 ? 'history__plus' : 'history__minus'}>
                  {d.amount > 0 ? '+' : '−'}
                  {formatMoney(Math.abs(d.amount), d.currency, true)}
                </span>
                {d.currency !== mainCurrency && (
                  <span className="muted history__converted">
                    ≈ {formatMoney(Math.abs(convert(d.amount, d.currency, mainCurrency, rates)), mainCurrency)}
                  </span>
                )}
              </div>
              <button className="icon-btn icon-btn--flat" onClick={() => remove(d)} aria-label="Удалить запись">
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Пополнений пока не было.</p>
      )}
    </Modal>
  )
}
