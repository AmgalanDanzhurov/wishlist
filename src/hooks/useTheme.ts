import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'mywish:theme'

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // нет доступа к хранилищу — тема по системе
  }
  return 'system'
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', mode)
    try {
      if (mode === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, mode)
    } catch {
      // ignore
    }
  }, [mode])

  const cycle = () => setMode((m) => (m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system'))

  return { mode, cycle }
}
