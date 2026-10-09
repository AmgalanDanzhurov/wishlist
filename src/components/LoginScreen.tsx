import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

// Ошибки Supabase приходят по-английски — переводим самые частые.
function translate(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Неверная почта или пароль'
  if (/already registered/i.test(message)) return 'Такая почта уже зарегистрирована — войди'
  if (/password should be at least/i.test(message)) return 'Пароль должен быть не короче 6 символов'
  if (/email not confirmed/i.test(message)) return 'Почта не подтверждена. Отключи подтверждение почты в Supabase (см. README)'
  if (/signups not allowed/i.test(message)) return 'Регистрация новых пользователей отключена'
  if (/rate limit/i.test(message)) return 'Слишком много попыток, подожди немного'
  return message
}

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const credentials = { email: email.trim(), password }
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials)
    setBusy(false)
    if (error) return setError(translate(error.message))
    // при включённом подтверждении почты сессии после регистрации нет
    if (mode === 'signup' && !data.session) {
      setInfo('Аккаунт создан, но Supabase ждёт подтверждения почты. Проверь письмо или отключи подтверждение.')
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={56} height={56} />
        <h1>My Wish</h1>

        <div className="segmented segmented--full login__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => setMode('signin')}>
            Вход
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>
            Регистрация
          </button>
        </div>

        <form onSubmit={submit}>
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="Почта"
            aria-label="Почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signin' ? 'Пароль' : 'Пароль (от 6 символов)'}
            aria-label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" disabled={busy}>
            {busy ? 'Подождите…' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
          {error && <p className="login__error">{error}</p>}
          {info && <p className="login__hint">{info}</p>}
        </form>
      </div>
    </div>
  )
}
