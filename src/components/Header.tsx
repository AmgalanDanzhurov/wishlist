import type { ThemeMode } from '../hooks/useTheme'
import { CURRENCY_SYMBOL } from '../lib/currency'
import { CURRENCIES, type Currency } from '../types'
import { AutoIcon, MoonIcon, SunIcon, UserIcon } from './icons'

interface Props {
  mainCurrency: Currency
  onCurrencyChange: (c: Currency) => void
  themeMode: ThemeMode
  onThemeCycle: () => void
  onAccount: () => void
}

const THEME_LABEL: Record<ThemeMode, string> = {
  system: 'Тема: как в системе',
  light: 'Тема: светлая',
  dark: 'Тема: тёмная',
}

export function Header({ mainCurrency, onCurrencyChange, themeMode, onThemeCycle, onAccount }: Props) {
  return (
    <header className="header">
      <div className="logo">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} />
        <span>My Wish</span>
      </div>
      <div className="header__actions">
        <div className="segmented" role="radiogroup" aria-label="Основная валюта">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={c === mainCurrency}
              className={c === mainCurrency ? 'is-active' : ''}
              onClick={() => onCurrencyChange(c)}
            >
              {CURRENCY_SYMBOL[c]}
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={onThemeCycle} title={THEME_LABEL[themeMode]} aria-label={THEME_LABEL[themeMode]}>
          {themeMode === 'light' ? <SunIcon /> : themeMode === 'dark' ? <MoonIcon /> : <AutoIcon />}
        </button>
        <button className="icon-btn" onClick={onAccount} title="Аккаунт" aria-label="Аккаунт">
          <UserIcon />
        </button>
      </div>
    </header>
  )
}
