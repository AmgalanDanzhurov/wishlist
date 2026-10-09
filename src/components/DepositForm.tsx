import { useState, type FormEvent } from 'react'
import type { DepositInput } from '../hooks/useWishData'
import { CURRENCY_SYMBOL } from '../lib/currency'
import { CURRENCIES, type Currency } from '../types'
import { Modal } from './Modal'

interface Props {
  defaultCurrency: Currency
  onSave: (input: DepositInput) => Promise<void>
  onClose: () => void
}

function today(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function DepositForm({ defaultCurrency, onSave, onClose }: Props) {
  const [kind, setKind] = useState<'in' | 'out'>('in')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = Number(amount.replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setError('Введи сумму больше нуля')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        amount: Math.round(n * 100) / 100 * (kind === 'out' ? -1 : 1),
        currency,
        note: note.trim() || null,
        // сегодняшняя запись — с текущим временем, задним числом — полдень выбранного дня
        created_at: date === today() ? undefined : new Date(`${date}T12:00:00`).toISOString(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
      setBusy(false)
    }
  }

  return (
    <Modal title={kind === 'in' ? 'Пополнить накопления' : 'Снять с накоплений'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="segmented segmented--full" role="radiogroup" aria-label="Тип операции">
          <button type="button" role="radio" aria-checked={kind === 'in'} className={kind === 'in' ? 'is-active' : ''} onClick={() => setKind('in')}>
            + Пополнение
          </button>
          <button type="button" role="radio" aria-checked={kind === 'out'} className={kind === 'out' ? 'is-active' : ''} onClick={() => setKind('out')}>
            − Снятие
          </button>
        </div>

        <div className="field">
          <span>Сумма</span>
          <div className="price-input">
            <input
              className="input"
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-label="Сумма"
              autoFocus
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

        <div className="form__row">
          <label className="field">
            <span>Комментарий</span>
            <input
              className="input"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={kind === 'in' ? 'Стипендия, подарок…' : 'На что потрачено'}
            />
          </label>
          <label className="field">
            <span>Дата</span>
            <input className="input" type="date" required max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {error && <p className="form__error">{error}</p>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Сохраняем…' : kind === 'in' ? 'Пополнить' : 'Снять'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
