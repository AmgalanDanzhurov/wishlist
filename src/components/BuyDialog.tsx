import { useState, type FormEvent } from 'react'
import { CURRENCY_SYMBOL, formatMoney } from '../lib/currency'
import type { Currency, Item } from '../types'
import { Modal } from './Modal'

interface Props {
  item: Item
  onConfirm: (spent: { amount: number; currency: Currency } | null) => Promise<void>
  onClose: () => void
}

export function BuyDialog({ item, onConfirm, onClose }: Props) {
  const [deduct, setDeduct] = useState(true)
  const [amount, setAmount] = useState(String(item.price))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    let spent = null
    if (deduct) {
      const n = Number(amount.replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) {
        setError('Сумма должна быть числом')
        return
      }
      spent = { amount: Math.round(n * 100) / 100, currency: item.currency }
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(spent)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
      setBusy(false)
    }
  }

  return (
    <Modal title="Отметить купленным" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="buy__lead">
          🎉 <b>{item.title}</b> уйдёт в раздел «Куплено».
        </p>

        <label className="check">
          <input type="checkbox" checked={deduct} onChange={(e) => setDeduct(e.target.checked)} />
          <span>Списать потраченное из накоплений</span>
        </label>

        {deduct && (
          <label className="field">
            <span>Сколько потратил (цена в списке — {formatMoney(item.price, item.currency, true)})</span>
            <div className="input-suffix">
              <input
                className="input"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Потраченная сумма"
              />
              <span>{CURRENCY_SYMBOL[item.currency]}</span>
            </div>
          </label>
        )}

        {error && <p className="form__error">{error}</p>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Куплено!'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
