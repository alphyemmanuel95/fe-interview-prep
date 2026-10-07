import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitRegistration } from './api'
import type * as ApiModule from './api'
import type { WizardState } from './types'
import { WizardPage } from './WizardPage'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, submitRegistration: vi.fn(actual.submitRegistration) }
})

const STORAGE_KEY = 'q3.wizard.v1'

const COMPLETE_DATA: WizardState['data'] = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  country: 'India',
  city: 'Kochi',
  postalCode: '682001',
  plan: 'Pro',
  skills: ['React', 'TypeScript'],
}

/** Renders the wizard as if the user had already reached `step`. */
function renderAtStep(
  step: WizardState['step'],
  data: Partial<WizardState['data']> = {},
) {
  const state: WizardState = { step, data: { ...COMPLETE_DATA, ...data } }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return render(<WizardPage />)
}

function fillField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

function expectStep(title: string) {
  expect(
    screen.getByRole('heading', { level: 2, name: title }),
  ).toBeInTheDocument()
}

function fillPersonalStep() {
  fillField('Full name', 'Asha Rao')
  fillField('Email', 'asha@example.com')
  fillField('Phone', '9876543210')
}

afterEach(() => {
  vi.useRealTimers()
})

describe('WizardPage', () => {
  it('blocks Next on an empty step, shows errors and focuses the first invalid field', () => {
    render(<WizardPage />)
    expect(screen.queryByText('Enter your name.')).not.toBeInTheDocument()

    clickButton('Next')

    expectStep('Personal info')
    const name = screen.getByLabelText('Full name')
    expect(name).toHaveFocus()
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Enter your name.')
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your phone number.')).toBeInTheDocument()

    // Errors follow edits once shown.
    fillField('Full name', 'Asha')
    expect(screen.queryByText('Enter your name.')).not.toBeInTheDocument()
  })

  it('moves to the address step when valid and keeps values on Back', () => {
    render(<WizardPage />)
    fillPersonalStep()
    clickButton('Next')

    expectStep('Address')
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Address',
    )

    clickButton('Back')

    expectStep('Personal info')
    expect(screen.getByLabelText('Full name')).toHaveValue('Asha Rao')
    expect(screen.getByLabelText('Email')).toHaveValue('asha@example.com')
    expect(screen.getByLabelText('Phone')).toHaveValue('9876543210')
  })

  it('requires a 6-digit postal code for India only', () => {
    renderAtStep('address', { country: '', city: '', postalCode: '' })
    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'India' },
    })
    fillField('City', 'Kochi')
    fillField('Postal code', '68200')

    clickButton('Next')

    expectStep('Address')
    const postalCode = screen.getByLabelText('Postal code')
    expect(postalCode).toHaveFocus()
    expect(postalCode).toHaveAccessibleDescription(
      'Indian postal codes must be 6 digits.',
    )

    // Switching country re-validates: any postal code is fine elsewhere.
    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'Germany' },
    })
    expect(
      screen.queryByText('Indian postal codes must be 6 digits.'),
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'India' },
    })
    fillField('Postal code', '682001')
    clickButton('Next')

    expectStep('Preferences')
  })

  it('adds and removes skills and requires at least one', () => {
    renderAtStep('preferences', { skills: [] })
    const skillInput = screen.getByLabelText('Skills')

    fireEvent.change(skillInput, { target: { value: '  React ' } })
    fireEvent.keyDown(skillInput, { key: 'Enter' })
    fireEvent.change(skillInput, { target: { value: 'react' } })
    clickButton('Add')
    fireEvent.change(skillInput, { target: { value: 'CSS' } })
    clickButton('Add')

    expectStep('Preferences')
    const skills = screen.getByRole('list', { name: 'Added skills' })
    expect(
      within(skills)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['React', 'CSS'])
    expect(skillInput).toHaveValue('')

    clickButton('Remove React')
    clickButton('Remove CSS')
    expect(
      screen.queryByRole('list', { name: 'Added skills' }),
    ).not.toBeInTheDocument()
    expect(skillInput).toHaveFocus()

    clickButton('Next')

    expectStep('Preferences')
    expect(skillInput).toHaveAccessibleDescription(
      expect.stringContaining('Add at least one skill.'),
    )
  })

  it('focuses the plan options when no plan is chosen', () => {
    renderAtStep('preferences', { plan: '' })

    clickButton('Next')

    expect(screen.getByRole('radio', { name: /Free/ })).toHaveFocus()
    expect(screen.getByText('Choose a plan.')).toBeInTheDocument()
  })

  it.each([
    ['Edit personal info', 'Personal info'],
    ['Edit address', 'Address'],
    ['Edit preferences', 'Preferences'],
  ])('%s on the review step jumps to that step', (button, heading) => {
    renderAtStep('review')
    expect(screen.getByText('asha@example.com')).toBeInTheDocument()
    expect(screen.getByText('React, TypeScript')).toBeInTheDocument()

    clickButton(button)

    expectStep(heading)
  })

  it('submits, shows progress and then a success message', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderAtStep('review')

    clickButton('Submit')

    const submitting = screen.getByRole('button', { name: 'Submitting…' })
    expect(submitting).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const success = await screen.findByRole('heading', {
      name: 'Registration complete',
    })
    await waitFor(() => {
      expect(success).toHaveFocus()
    })
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('asha@example.com')).toBeInTheDocument()

    clickButton('Start over')

    expectStep('Personal info')
    expect(screen.getByLabelText('Full name')).toHaveValue('')
  })

  it('shows an error and allows a retry when submitting fails', async () => {
    vi.mocked(submitRegistration).mockRejectedValueOnce(
      new Error('Server unavailable'),
    )
    renderAtStep('review')

    clickButton('Submit')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t submit your registration. Please try again.',
    )
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
    expectStep('Review')
  })

  it('restores the step and answers after a remount', () => {
    const { unmount } = render(<WizardPage />)
    fillPersonalStep()
    clickButton('Next')
    fillField('City', 'Kochi')
    unmount()

    render(<WizardPage />)

    expectStep('Address')
    expect(screen.getByLabelText('City')).toHaveValue('Kochi')
    clickButton('Back')
    expect(screen.getByLabelText('Full name')).toHaveValue('Asha Rao')
  })
})
