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
  onDeposit: () => void
  onHistory: () => void
}

export function SavingsBanner(props: Props) {
  const { savings, wishedTotal, affordableCount, wantedCount, currency, rates, onDeposit, onHistory } = props
  const progress = wishedTotal > 0 ? Math.min(1, Math.max(0, savings / wishedTotal)) : 0
  const left = Math.max(0, wishedTotal - savings)

  return (
    <section className="banner" aria-label="Накопления">
      <div className="banner__main">
        <div className="banner__label">Накоплено</div>
        <div className="banner__amount">{formatMoney(savings, currency)}</div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="banner__caption">
          {Math.round(progress * 100)}% от суммы всех желаний
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
          <dt>Всего желаний</dt>
          <dd>{formatMoney(wishedTotal, currency)}</dd>
        </div>
        <div>
          <dt>Осталось накопить</dt>
          <dd>{formatMoney(left, currency)}</dd>
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
