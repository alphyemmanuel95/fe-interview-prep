import type { WizardData } from './types'

export type RegistrationReceipt = {
  readonly name: string
  readonly email: string
}

const SIMULATED_LATENCY_MS = 1000

function createAbortError(): DOMException {
  return new DOMException('Registration was aborted.', 'AbortError')
}

/**
 * Simulates sending the registration to a server. Resolves after a short
 * delay, or rejects with an `AbortError` as soon as `signal` aborts.
 */
export function submitRegistration(
  data: WizardData,
  signal: AbortSignal,
): Promise<RegistrationReceipt> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError())
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve({ name: data.name.trim(), email: data.email.trim() })
    }, SIMULATED_LATENCY_MS)
    function handleAbort() {
      clearTimeout(timer)
      reject(createAbortError())
    }
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}
