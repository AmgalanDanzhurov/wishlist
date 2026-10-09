import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from './Modal'

interface Props {
  email: string | undefined
  onClose: () => void
}

export function AccountDialog({ email, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== repeat) return setError('Пароли не совпадают')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(/should be different/i.test(error.message) ? 'Новый пароль совпадает со старым' : error.message)
    } else {
      setSaved(true)
      setPassword('')
      setRepeat('')
    }
  }

  return (
    <Modal title="Аккаунт" onClose={onClose}>
      <div className="form">
        <div className="field">
          <span>Почта</span>
          <b>{email}</b>
        </div>

        <form className="form account__password" onSubmit={submit}>
          <div className="field">
            <span>Новый пароль</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="От 6 символов"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setSaved(false)
              }}
            />
            <input
              className="input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Повтори пароль"
              aria-label="Повтори пароль"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </div>
          {error && <p className="form__error">{error}</p>}
          {saved && <p className="account__ok">Пароль сохранён — теперь можно входить по почте и паролю.</p>}
          <div className="form__actions">
            <button className="btn" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Сохранить пароль'}
            </button>
          </div>
        </form>

        <div className="form__actions account__logout">
          <button type="button" className="btn btn--danger" onClick={() => supabase.auth.signOut()}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </Modal>
  )
}
