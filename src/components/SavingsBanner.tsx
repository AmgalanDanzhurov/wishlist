import { formatMoney, type RatesState } from '../lib/currency'
import type { Currency } from '../types'
import { PlusIcon } from './icons'

interface Props {
  savings: number
  wishedTotal: number
  affordableCount: number
  wantedCount: number
  currency: Currency
  rates: RatesState
  /** Выбранная категория: суммы на плашке считаются только по ней. null — все желания. */
  categoryName: string | null
  onDeposit: () => void
  onHistory: () => void
}

export function SavingsBanner(props: Props) {
  const { savings, wishedTotal, affordableCount, wantedCount, currency, rates, categoryName, onDeposit, onHistory } = props
  const progress = wishedTotal > 0 ? Math.min(1, Math.max(0, savings / wishedTotal)) : 0
  const left = Math.max(0, wishedTotal - savings)
  const scope = categoryName ? `категории «${categoryName}»` : 'всех желаний'

  return (
    <section className="banner" aria-label="Накопления">
      <div className="banner__main">
        <div className="banner__label">
          Осталось накопить
          {categoryName && <span className="banner__scope">{categoryName}</span>}
        </div>
        <div className="banner__amount">{formatMoney(left, currency)}</div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="banner__caption">
          {wishedTotal > 0 && left === 0
            ? `Накоплений хватает на все ${categoryName ? 'желания категории' : 'желания'} 🎉`
            : `Собрано ${Math.round(progress * 100)}% от суммы ${scope}`}
        </div>
        <div className="banner__actions">
          <button className="banner__btn banner__btn--primary" onClick={onDeposit}>
            <PlusIcon />
            Пополнить
          </button>
          <button className="banner__btn" onClick={onHistory}>
            История
          </button>
        </div>
      </div>

      <dl className="banner__stats">
        <div>
          <dt>Накоплено</dt>
          <dd>{formatMoney(savings, currency)}</dd>
        </div>
        <div>
          <dt>{categoryName ? 'Желания категории' : 'Всего желаний'}</dt>
          <dd>{formatMoney(wishedTotal, currency)}</dd>
        </div>
        <div>
          <dt>Можно купить сейчас</dt>
          <dd>
            {affordableCount} <span className="muted">из {wantedCount}</span>
          </dd>
        </div>
      </dl>

      <div className="banner__rates">
        {rates.live ? 'Курс' : 'Примерный курс'}: 1 $ = {rates.rates.RUB.toFixed(2)} ₽ · 1 ¥ ={' '}
        {(rates.rates.RUB / rates.rates.CNY).toFixed(2)} ₽
      </div>
    </section>
  )
}
