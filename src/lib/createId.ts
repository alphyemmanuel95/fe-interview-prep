let fallbackCounter = 0

/**
 * Returns a unique id. `crypto.randomUUID` only exists in secure contexts
 * (HTTPS or localhost), so plain-HTTP access, such as a phone on the LAN,
 * uses a time-and-counter fallback instead of throwing.
 */
export function createId(isSecure: boolean = window.isSecureContext): string {
  if (isSecure) {
    return crypto.randomUUID()
  }
  fallbackCounter += 1
  return `${Date.now().toString(36)}-${fallbackCounter.toString(36)}`
}
