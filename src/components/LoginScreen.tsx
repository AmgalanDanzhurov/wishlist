import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <img src="/favicon.svg" alt="" width={56} height={56} />
        <h1>My Wish</h1>
        {status === 'sent' ? (
          <>
            <p className="muted">
              Ссылка для входа отправлена на <b>{email}</b>. Открой письмо на этом устройстве и нажми на ссылку.
            </p>
            <p className="login__hint">Письма нет? Проверь «Спам» или подожди пару минут.</p>
            <button className="btn btn--ghost" onClick={() => setStatus('idle')}>
              Ввести другую почту
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="muted">Войди по почте — пришлём ссылку, пароль не нужен.</p>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Отправляем…' : 'Получить ссылку'}
            </button>
            {error && <p className="login__error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
