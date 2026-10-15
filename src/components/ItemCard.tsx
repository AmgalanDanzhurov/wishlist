import { useState, type CSSProperties, type ReactNode } from 'react'
import { datePlan, priceIn } from '../lib/calc'
import { formatMoney, type Rates } from '../lib/currency'
import type { Category, Currency, Item } from '../types'
import { CalendarIcon, CheckIcon, EditIcon, ExternalIcon, ImageIcon, UndoIcon } from './icons'

interface Props {
  item: Item
  categories: Category[]
  savings: number
  mainCurrency: Currency
  rates: Rates
  onEdit: () => void
  onBuy: () => void
  onRestore: () => void
  /** ручка перетаскивания — передаётся только в режиме «Свой порядок» */
  dragHandle?: ReactNode
}

const PRIORITY_LABEL = { 1: 'Высокий', 2: 'Средний', 3: 'Низкий' } as const

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

export function ItemCard(props: Props) {
  const { item, categories, savings, mainCurrency, rates, onEdit, onBuy, onRestore, dragHandle } = props
  // запоминаем, какой именно адрес не загрузился, чтобы после правки ссылки попробовать снова
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const imageFailed = failedImage === item.image_url
  const bought = item.status === 'bought'
  const price = priceIn(item, mainCurrency, rates)
  const missing = Math.max(0, price - savings)
  const affordable = missing === 0
  const progress = price > 0 ? Math.min(1, Math.max(0, savings / price)) : 1
  const plan = datePlan(item, savings, mainCurrency, rates)

  return (
    <article className={`card ${bought ? 'card--bought' : ''}`}>
      <div className="card__media">
        {item.image_url && !imageFailed ? (
          <img src={item.image_url} alt="" loading="lazy" onError={() => setFailedImage(item.image_url)} />
        ) : (
          <div className="card__placeholder">
            <ImageIcon />
          </div>
        )}
        {bought ? (
          <span className="priority priority--bought">
            <CheckIcon /> Куплено
          </span>
        ) : (
          <span className={`priority priority--${item.priority}`} title={`Приоритет: ${PRIORITY_LABEL[item.priority]}`}>
            {PRIORITY_LABEL[item.priority]}
          </span>
        )}
        {dragHandle}
        <button className="card__edit" onClick={onEdit} aria-label={`Редактировать ${item.title}`} title="Редактировать">
          <EditIcon />
        </button>
      </div>

      <div className="card__body">
        {categories.length > 0 && (
          <div className="tags">
            {categories.map((c) => (
              <span key={c.id} className="tag" style={{ '--chip': c.color } as CSSProperties}>
                {c.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="card__title">{item.title}</h3>

        <div className="card__price">
          <span>{formatMoney(item.price, item.currency, true)}</span>
          {item.currency !== mainCurrency && <span className="muted">≈ {formatMoney(price, mainCurrency)}</span>}
        </div>

        {bought ? (
          item.bought_at && <div className="muted card__bought-at">Куплено {dateFormat.format(new Date(item.bought_at))}</div>
        ) : (
          <>
            <div className={`afford ${affordable ? 'afford--ok' : ''}`}>
              <div className="progress progress--sm">
                <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <span>{affordable ? 'Хватает накоплений' : `Не хватает ${formatMoney(missing, mainCurrency)}`}</span>
            </div>

            {plan && item.target_date && (
              <div className={`goal ${plan.overdue ? 'goal--overdue' : ''}`}>
                <CalendarIcon />
                <span>
                  К {dateFormat.format(new Date(item.target_date))}
                  {!affordable && !plan.overdue && <> · {formatMoney(plan.perMonth, mainCurrency)}/мес</>}
                  {plan.overdue && !affordable && <> · срок прошёл</>}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card__footer">
        {item.url && (
          <a
            className="card__link card__link--store"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть в магазине"
            title="Открыть в магазине"
          >
            <span className="card__link-text">В магазин</span> <ExternalIcon />
          </a>
        )}
        {bought ? (
          <button className="card__link" onClick={onRestore}>
            <UndoIcon /> Вернуть
          </button>
        ) : (
          <button className="card__link card__link--buy" onClick={onBuy}>
            <CheckIcon /> Куплено
          </button>
        )}
      </div>
    </article>
  )
}
