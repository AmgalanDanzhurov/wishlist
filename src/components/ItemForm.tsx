import { useState, type FormEvent } from 'react'
import type { ItemInput } from '../hooks/useWishData'
import { CURRENCY_SYMBOL } from '../lib/currency'
import { CURRENCIES, type Category, type Currency, type Item, type Priority } from '../types'
import { ImageIcon } from './icons'
import { Modal } from './Modal'

interface Props {
  item: Item | null
  categories: Category[]
  onSave: (input: ItemInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 1, label: 'Высокий' },
  { value: 2, label: 'Средний' },
  { value: 3, label: 'Низкий' },
]

/** Добавляет https://, если ссылку вставили без протокола. */
function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function parsePrice(value: string): number | null {
  const n = Number(value.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

export function ItemForm({ item, categories, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? 'RUB')
  const [categoryId, setCategoryId] = useState(item?.category_id ?? '')
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 2)
  const [targetDate, setTargetDate] = useState(item?.target_date ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  const preview = normalizeUrl(imageUrl)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const parsedPrice = parsePrice(price)
    if (parsedPrice === null) {
      setError('Цена должна быть числом, например 12990 или 129,99')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave(
        {
          title: title.trim(),
          url: normalizeUrl(url),
          image_url: preview,
          price: parsedPrice,
          currency,
          category_id: categoryId || null,
          priority,
          target_date: targetDate || null,
        },
        item?.id,
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
      setBusy(false)
    }
  }

  async function remove() {
    if (!item || !confirm(`Удалить «${item.title}»?`)) return
    setBusy(true)
    try {
      await onDelete(item.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить')
      setBusy(false)
    }
  }

  return (
    <Modal title={item ? 'Редактировать желание' : 'Новое желание'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Название</span>
          <input
            className="input"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, наушники"
            autoFocus
          />
        </label>

        <div className="field">
          <span>Цена</span>
          <div className="price-input">
            <input
              className="input"
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              aria-label="Цена"
            />
            <div className="segmented" role="radiogroup" aria-label="Валюта">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  role="radio"
                  aria-checked={c === currency}
                  className={c === currency ? 'is-active' : ''}
                  onClick={() => setCurrency(c)}
                >
                  {CURRENCY_SYMBOL[c]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="field">
          <span>Ссылка на товар</span>
          <input
            className="input"
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>

        <div className="field">
          <span>Картинка</span>
          <div className="image-input">
            <div className="image-input__preview">
              {preview && !previewFailed ? (
                <img src={preview} alt="" onError={() => setPreviewFailed(true)} />
              ) : (
                <ImageIcon />
              )}
            </div>
            <div className="image-input__field">
              <input
                className="input"
                type="text"
                inputMode="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setPreviewFailed(false)
                }}
                placeholder="Ссылка на картинку"
                aria-label="Ссылка на картинку"
              />
              <small className="muted">
                {previewFailed ? 'Картинка не открылась — проверь ссылку' : 'На странице товара: правый клик по фото → «Копировать адрес картинки»'}
              </small>
            </div>
          </div>
        </div>

        <div className="form__row">
          <label className="field">
            <span>Категория</span>
            <select className="select select--full" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Купить к дате</span>
            <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </label>
        </div>

        <div className="field">
          <span>Приоритет</span>
          <div className="segmented segmented--full" role="radiogroup" aria-label="Приоритет">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p.value}
                role="radio"
                aria-checked={p.value === priority}
                className={p.value === priority ? 'is-active' : ''}
                onClick={() => setPriority(p.value)}
              >
                <span className={`dot dot--${p.value}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form__error">{error}</p>}

        <div className="form__actions">
          {item && (
            <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>
              Удалить
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Сохраняем…' : item ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
