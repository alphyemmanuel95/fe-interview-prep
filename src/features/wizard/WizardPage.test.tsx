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
  vi.mocked(submitRegistration).mockClear()
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

    // aria-disabled (not disabled) keeps keyboard focus on the button.
    const submitting = screen.getByRole('button', { name: 'Submitting…' })
    expect(submitting).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(
      screen.getByText('Submitting your registration…'),
    ).toBeInTheDocument()

    // A second click while busy must not send a second request.
    fireEvent.click(submitting)
    expect(submitRegistration).toHaveBeenCalledTimes(1)

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

  it('attaches the error before focusing the first invalid field', () => {
    render(<WizardPage />)
    const name = screen.getByLabelText('Full name')
    let descriptionAtFocus: string | null = null
    name.addEventListener('focus', () => {
      descriptionAtFocus = name.getAttribute('aria-describedby')
    })

    clickButton('Next')

    expect(descriptionAtFocus).not.toBeNull()
  })

  it('clears a previous submit error after editing a step', async () => {
    vi.mocked(submitRegistration).mockRejectedValueOnce(new Error('Down'))
    renderAtStep('review')
    clickButton('Submit')
    await screen.findByRole('alert')

    clickButton('Edit address')
    clickButton('Next')
    clickButton('Next')

    expectStep('Review')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('never resumes stored progress past an invalid step', () => {
    renderAtStep('review', { email: 'not-an-email' })
    expectStep('Personal info')

    // Fixing the field must not jump ahead without pressing Next.
    fillField('Email', 'asha@example.com')
    expectStep('Personal info')
    clickButton('Next')
    expectStep('Address')
  })

  it('treats a stored country that is not in the list as invalid', () => {
    renderAtStep('review', { country: 'Atlantis' })
    expectStep('Address')
  })

  it('keeps progress and aborts the request when leaving mid-submit', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { unmount } = renderAtStep('review')
    clickButton('Submit')
    const signal = vi.mocked(submitRegistration).mock.lastCall?.[1]

    unmount()
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(signal?.aborted).toBe(true)
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    expect(stored).toMatchObject({ step: 'review' })
  })

  it('clears saved progress after a successful submit', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { unmount } = renderAtStep('review')
    clickButton('Submit')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    await screen.findByRole('heading', { name: 'Registration complete' })
    unmount()

    render(<WizardPage />)

    expectStep('Personal info')
    expect(screen.getByLabelText('Full name')).toHaveValue('')
  })

  it('explains a duplicate skill and announces adds and removals', () => {
    renderAtStep('preferences', { skills: ['React'] })
    const skillInput = screen.getByLabelText('Skills')

    fireEvent.change(skillInput, { target: { value: 'react' } })
    clickButton('Add')
    expect(skillInput).toHaveValue('react')
    expect(skillInput).toHaveAccessibleDescription(
      expect.stringContaining('react is already added.'),
    )
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toContain(
      'react is already added.',
    )

    fireEvent.change(skillInput, { target: { value: 'CSS' } })
    clickButton('Add')
    expect(screen.getByText('Added CSS')).toBeInTheDocument()

    clickButton('Remove CSS')
    expect(screen.getByText('Removed CSS')).toBeInTheDocument()
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
