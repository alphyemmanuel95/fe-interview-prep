export const STEPS = ['personal', 'address', 'preferences', 'review'] as const

export type StepId = (typeof STEPS)[number]

export const STEP_LABELS: Record<StepId, string> = {
  personal: 'Personal',
  address: 'Address',
  preferences: 'Preferences',
  review: 'Review',
}

export const PLANS = ['Free', 'Pro', 'Team'] as const

export type Plan = (typeof PLANS)[number]

export const INDIA = 'India'

export const COUNTRIES = [
  INDIA,
  'United States',
  'United Kingdom',
  'Germany',
  'Canada',
  'Australia',
] as const

export type WizardData = {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly country: string
  readonly city: string
  readonly postalCode: string
  /** Empty until the user picks a plan. */
  readonly plan: Plan | ''
  readonly skills: readonly string[]
}

export type WizardField = keyof WizardData

export type WizardState = {
  readonly step: StepId
  readonly data: WizardData
}

/** Field → error message. A field without an entry is valid. */
export type FieldErrors = Partial<Record<WizardField, string>>

/** DOM id of the control for `field`, so errors can move focus to it. */
export function getFieldId(field: WizardField): string {
  return `wizard-${field}`
}

export function getPlanOptionId(plan: Plan): string {
  return `${getFieldId('plan')}-${plan.toLowerCase()}`
}

/** The element to focus for `field`; the plan group via its first option. */
export function getFocusTargetId(field: WizardField): string {
  return field === 'plan' ? getPlanOptionId(PLANS[0]) : getFieldId(field)
}

export function getErrorId(field: WizardField): string {
  return `${getFieldId(field)}-error`
}

/** Props shared by the editable steps. */
export type StepFieldsProps = {
  readonly data: WizardData
  readonly errors: FieldErrors
  readonly onChange: (changes: Partial<WizardData>) => void
}
