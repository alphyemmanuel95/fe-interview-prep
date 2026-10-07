export type TokenStore = {
  readonly get: () => string | null
  readonly set: (token: string) => void
  readonly clear: () => void
}

/**
 * Holds the access token in memory only. Unlike localStorage, a variable is
 * gone on reload and cannot be read by scripts outside this module; the
 * httpOnly refresh cookie is what lets a reload restore the session.
 */
export function createTokenStore(): TokenStore {
  let token: string | null = null
  return {
    get: () => token,
    set: (next) => {
      token = next
    },
    clear: () => {
      token = null
    },
  }
}
