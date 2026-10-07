import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { AddressStep } from './AddressStep'
import { PersonalStep } from './PersonalStep'
import { ProgressSteps } from './ProgressSteps'
import { StepActions } from './StepActions'
import { getFieldId, STEPS } from './types'
import type { StepId, WizardData, WizardState } from './types'
import { findFirstInvalidField, validateStep } from './validation'

const INITIAL_STATE: WizardState = {
  step: 'personal',
  data: {
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    postalCode: '',
    plan: '',
    skills: [],
  },
}

const STEP_HEADINGS: Record<StepId, { title: string; description: string }> = {
  personal: {
    title: 'Personal info',
    description: 'Tell us who you are and how to reach you.',
  },
  address: {
    title: 'Address',
    description: 'Where are you based?',
  },
  preferences: {
    title: 'Preferences',
    description: 'Pick a plan and the skills you work with.',
  },
  review: {
    title: 'Review',
    description: 'Check your details before you submit.',
  },
}

function getAdjacentStep(step: StepId, offset: 1 | -1): StepId {
  return STEPS[STEPS.indexOf(step) + offset] ?? step
}

export function WizardPage() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  // Errors stay hidden until the user tries to leave the step, then follow
  // their edits live. Not persisted: a refresh starts the step fresh.
  const [attemptedStep, setAttemptedStep] = useState<StepId | null>(null)
  const { step, data } = state
  const errors = attemptedStep === step ? validateStep(step, data) : {}

  const headingRef = useRef<HTMLHeadingElement>(null)
  const shouldFocusHeading = useRef(false)

  // After a step change the clicked button is gone, so move focus to the new
  // step's heading instead of losing it to <body>.
  useEffect(() => {
    if (shouldFocusHeading.current) {
      shouldFocusHeading.current = false
      headingRef.current?.focus()
    }
  }, [step])

  function goToStep(nextStep: StepId) {
    shouldFocusHeading.current = true
    setAttemptedStep(null)
    setState((current) => ({ ...current, step: nextStep }))
  }

  function handleChange(changes: Partial<WizardData>) {
    setState((current) => ({
      ...current,
      data: { ...current.data, ...changes },
    }))
  }

  function handleNext(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const stepErrors = validateStep(step, data)
    const firstInvalidField = findFirstInvalidField(step, stepErrors)
    if (firstInvalidField !== undefined) {
      setAttemptedStep(step)
      document.getElementById(getFieldId(firstInvalidField))?.focus()
      return
    }
    goToStep(getAdjacentStep(step, 1))
  }

  function handleBack() {
    goToStep(getAdjacentStep(step, -1))
  }

  const heading = STEP_HEADINGS[step]
  const stepProps = { data, errors, onChange: handleChange }

  return (
    <section aria-labelledby="wizard-heading" className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5">
        <header className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 pt-6 pb-5 text-white">
          <h1 id="wizard-heading" className="text-2xl font-bold sm:text-3xl">
            Registration Wizard
          </h1>
          <p className="mt-1 text-sm text-indigo-100">
            Create your account in three quick steps.
          </p>
          <ProgressSteps current={step} />
        </header>

        <form
          noValidate
          onSubmit={handleNext}
          aria-labelledby="wizard-step-heading"
          className="px-6 py-6"
        >
          <h2
            id="wizard-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold text-slate-900"
          >
            {heading.title}
          </h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            {heading.description}
          </p>

          {step === 'personal' && <PersonalStep {...stepProps} />}
          {step === 'address' && <AddressStep {...stepProps} />}

          <StepActions
            submitLabel="Next"
            {...(step === 'personal' ? {} : { onBack: handleBack })}
          />
        </form>
      </div>
    </section>
  )
}
