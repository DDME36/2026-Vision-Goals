'use client'

import { useEffect, useState } from 'react'

/** useState that remembers its value in localStorage (per browser). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) setValue(JSON.parse(raw) as T)
    } catch {
      /* ignore corrupt or unavailable storage */
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or disabled */
    }
  }, [key, value, hydrated])

  return [value, setValue] as const
}
