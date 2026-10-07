import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { submitRegistration } from './api'
import type { WizardData } from './types'

const DATA: WizardData = {
  name: ' Asha Rao ',
  email: 'asha@example.com ',
  phone: '9876543210',
  country: 'India',
  city: 'Kochi',
  postalCode: '682001',
  plan: 'Pro',
  skills: ['React'],
}

describe('submitRegistration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with a receipt after the simulated delay', async () => {
    const result = submitRegistration(DATA, new AbortController().signal)
    vi.advanceTimersByTime(1000)
    await expect(result).resolves.toEqual({
      name: 'Asha Rao',
      email: 'asha@example.com',
    })
  })

  it('rejects with an AbortError when aborted mid-flight', async () => {
    const controller = new AbortController()
    const result = submitRegistration(DATA, controller.signal)
    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      submitRegistration(DATA, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
