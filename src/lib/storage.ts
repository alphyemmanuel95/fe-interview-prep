/**
 * Reads a JSON value from localStorage and validates its shape.
 * Returns `undefined` when the key is missing, storage is unavailable,
 * the JSON is corrupt, or the value fails validation.
 */
export function readJson<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): T | undefined {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      return undefined
    }
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * Writes a value to localStorage as JSON.
 * Returns `false` when storage is unavailable or full, so callers can decide
 * whether that matters; the in-memory state keeps working either way.
 */
export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
