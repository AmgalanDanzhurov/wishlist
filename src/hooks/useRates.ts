import { useEffect, useState } from 'react'
import { FALLBACK_RATES, loadRates, type RatesState } from '../lib/currency'

export function useRates(): RatesState {
  const [state, setState] = useState<RatesState>({ rates: FALLBACK_RATES, updatedAt: null, live: false })

  useEffect(() => {
    let cancelled = false
    loadRates().then((s) => {
      if (!cancelled) setState(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
