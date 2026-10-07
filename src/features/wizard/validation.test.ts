import { describe, expect, it } from 'vitest'
import type { WizardData } from './types'
import {
  findFirstInvalidField,
  validateAddress,
  validatePersonal,
  validatePreferences,
  validateStep,
} from './validation'

const VALID_DATA: WizardData = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+91 98765-43210',
  country: 'India',
  city: 'Kochi',
  postalCode: '682001',
  plan: 'Pro',
  skills: ['React'],
}

function withData(overrides: Partial<WizardData>): WizardData {
  return { ...VALID_DATA, ...overrides }
}

describe('validatePersonal', () => {
  it('accepts valid personal info', () => {
    expect(validatePersonal(VALID_DATA)).toEqual({})
  })

  it('requires every field, ignoring surrounding spaces', () => {
    expect(
      validatePersonal(withData({ name: '  ', email: '', phone: ' ' })),
    ).toEqual({
      name: 'Enter your name.',
      email: 'Enter your email address.',
      phone: 'Enter your phone number.',
    })
  })

  it.each(['asha', 'asha@', 'asha@example', '@example.com', 'a b@example.com'])(
    'rejects the invalid email %j',
    (email) => {
      expect(validatePersonal(withData({ email })).email).toBe(
        'Enter a valid email address, like name@example.com.',
      )
    },
  )

  it.each(['1234567', '+44 20 7946 0958', '555-123-4567', '123456789012345'])(
    'accepts the phone number %j',
    (phone) => {
      expect(validatePersonal(withData({ phone })).phone).toBeUndefined()
    },
  )

  it.each(['123456', '1234567890123456', '555-CALL-NOW', '12+3456789'])(
    'rejects the phone number %j',
    (phone) => {
      expect(validatePersonal(withData({ phone })).phone).toBe(
        'Enter a valid phone number with 7 to 15 digits.',
      )
    },
  )
})

describe('validateAddress', () => {
  it('accepts a 6-digit Indian postal code', () => {
    expect(validateAddress(VALID_DATA)).toEqual({})
  })

  it.each(['68200', '6820011', '68200A', 'ABCDEF'])(
    'rejects the Indian postal code %j',
    (postalCode) => {
      expect(validateAddress(withData({ postalCode })).postalCode).toBe(
        'Indian postal codes must be 6 digits.',
      )
    },
  )

  it.each(['SW1A 1AA', '10115', 'K1A-0B1', 'x'])(
    'accepts any non-empty postal code %j outside India',
    (postalCode) => {
      expect(
        validateAddress(withData({ country: 'United Kingdom', postalCode })),
      ).toEqual({})
    },
  )

  it('requires every field, including a postal code outside India', () => {
    expect(
      validateAddress(withData({ country: '', city: ' ', postalCode: '' })),
    ).toEqual({
      country: 'Select your country.',
      city: 'Enter your city.',
      postalCode: 'Enter your postal code.',
    })
  })
})

describe('validatePreferences', () => {
  it('accepts a plan with at least one skill', () => {
    expect(validatePreferences(VALID_DATA)).toEqual({})
  })

  it('requires a plan and at least one skill', () => {
    expect(validatePreferences(withData({ plan: '', skills: [] }))).toEqual({
      plan: 'Choose a plan.',
      skills: 'Add at least one skill.',
    })
  })
})

describe('validateStep', () => {
  it('validates only the fields of the given step', () => {
    const data = withData({ name: '', city: '' })
    expect(Object.keys(validateStep('personal', data))).toEqual(['name'])
    expect(Object.keys(validateStep('address', data))).toEqual(['city'])
    expect(validateStep('review', data)).toEqual({})
  })
})

describe('findFirstInvalidField', () => {
  it('returns the first invalid field in on-screen order', () => {
    expect(
      findFirstInvalidField('personal', {
        phone: 'Enter your phone number.',
        email: 'Enter your email address.',
      }),
    ).toBe('email')
  })

  it('returns undefined when the step is valid', () => {
    expect(findFirstInvalidField('address', {})).toBeUndefined()
  })
})
