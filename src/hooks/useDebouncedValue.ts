import { useEffect, useState } from 'react'

/**
 * Returns `value` only once it has stopped changing for `delayMs`. Each new
 * value restarts the timer, so rapid changes produce a single update.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)
    return () => {
      window.clearTimeout(timerId)
    }
  }, [value, delayMs])

  return debouncedValue
}
