import { COUNTRIES, INDIA, STEPS } from './types'
import type { FieldErrors, StepId, WizardData, WizardField } from './types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s-]+$/
const PHONE_MIN_DIGITS = 7
const PHONE_MAX_DIGITS = 15
const INDIA_POSTAL_PATTERN = /^\d{6}$/

/** Fields in on-screen order, so the first error can receive focus. */
export const STEP_FIELDS: Record<StepId, readonly WizardField[]> = {
  personal: ['name', 'email', 'phone'],
  address: ['country', 'city', 'postalCode'],
  preferences: ['plan', 'skills'],
  review: [],
}

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function validateEmail(email: string): string | undefined {
  if (isBlank(email)) {
    return 'Enter your email address.'
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Enter a valid email address, like name@example.com.'
  }
  return undefined
}

function validatePhone(phone: string): string | undefined {
  if (isBlank(phone)) {
    return 'Enter your phone number.'
  }
  const digitCount = phone.replace(/\D/g, '').length
  if (
    !PHONE_PATTERN.test(phone.trim()) ||
    digitCount < PHONE_MIN_DIGITS ||
    digitCount > PHONE_MAX_DIGITS
  ) {
    return 'Enter a valid phone number with 7 to 15 digits.'
  }
  return undefined
}

function validateCountry(country: string): string | undefined {
  if (isBlank(country)) {
    return 'Select your country.'
  }
  // Stored progress may hold a value the select can't show.
  if (!COUNTRIES.some((option) => option === country)) {
    return 'Select a country from the list.'
  }
  return undefined
}

function validatePostalCode(
  postalCode: string,
  country: string,
): string | undefined {
  if (isBlank(postalCode)) {
    return 'Enter your postal code.'
  }
  if (country === INDIA && !INDIA_POSTAL_PATTERN.test(postalCode.trim())) {
    return 'Indian postal codes must be 6 digits.'
  }
  return undefined
}

/** Drops valid fields so an empty object means "no errors". */
function collectErrors(
  entries: readonly (readonly [WizardField, string | undefined])[],
): FieldErrors {
  const errors: FieldErrors = {}
  for (const [field, message] of entries) {
    if (message !== undefined) {
      errors[field] = message
    }
  }
  return errors
}

export function validatePersonal(data: WizardData): FieldErrors {
  return collectErrors([
    ['name', isBlank(data.name) ? 'Enter your name.' : undefined],
    ['email', validateEmail(data.email)],
    ['phone', validatePhone(data.phone)],
  ])
}

export function validateAddress(data: WizardData): FieldErrors {
  return collectErrors([
    ['country', validateCountry(data.country)],
    ['city', isBlank(data.city) ? 'Enter your city.' : undefined],
    ['postalCode', validatePostalCode(data.postalCode, data.country)],
  ])
}

export function validatePreferences(data: WizardData): FieldErrors {
  return collectErrors([
    ['plan', data.plan === '' ? 'Choose a plan.' : undefined],
    [
      'skills',
      data.skills.length === 0 ? 'Add at least one skill.' : undefined,
    ],
  ])
}

export function validateStep(step: StepId, data: WizardData): FieldErrors {
  switch (step) {
    case 'personal':
      return validatePersonal(data)
    case 'address':
      return validateAddress(data)
    case 'preferences':
      return validatePreferences(data)
    case 'review':
      return {}
  }
}

/** The first invalid field in on-screen order, if any. */
export function findFirstInvalidField(
  step: StepId,
  errors: FieldErrors,
): WizardField | undefined {
  return STEP_FIELDS[step].find((field) => errors[field] !== undefined)
}

/**
 * The earliest step whose data is invalid, or 'review' when every step is
 * valid. Used to never resume stored progress past an invalid step.
 */
export function findFirstInvalidStep(data: WizardData): StepId {
  return (
    STEPS.find((step) => Object.keys(validateStep(step, data)).length > 0) ??
    'review'
  )
}
