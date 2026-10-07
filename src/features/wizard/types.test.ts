import { describe, expect, it } from 'vitest'
import { isWizardState } from './types'

const VALID_STATE = {
  step: 'address',
  data: {
    name: 'Asha Rao',
    email: 'asha@example.com',
    phone: '9876543210',
    country: 'India',
    city: '',
    postalCode: '',
    plan: '',
    skills: ['React'],
  },
}

describe('isWizardState', () => {
  it('accepts a well-formed state', () => {
    expect(isWizardState(VALID_STATE)).toBe(true)
  })

  it.each([
    ['null', null],
    ['an unknown step', { ...VALID_STATE, step: 'payment' }],
    ['missing data', { step: 'personal' }],
    [
      'an unknown plan',
      { ...VALID_STATE, data: { ...VALID_STATE.data, plan: 'Gold' } },
    ],
    [
      'non-string skills',
      { ...VALID_STATE, data: { ...VALID_STATE.data, skills: [1] } },
    ],
    ['a missing field', { ...VALID_STATE, data: { name: 'Asha' } }],
  ])('rejects %s', (_label, value) => {
    expect(isWizardState(value)).toBe(false)
  })
})
