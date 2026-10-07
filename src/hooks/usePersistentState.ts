import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { readJson, writeJson } from '../lib/storage'

/**
 * `useState` that is restored from and saved to localStorage under `key`.
 * Stored data is validated with `isValid`; anything missing or invalid falls
 * back to `initialValue`. `key` is expected to stay constant for the
 * component's lifetime.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(
    () => readJson(key, isValid) ?? initialValue,
  )

  useEffect(() => {
    writeJson(key, value)
  }, [key, value])

  return [value, setValue]
}
