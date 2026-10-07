import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the home page at the root route', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Frontend Interview Prep',
      }),
    ).toBeInTheDocument()
  })

  it('renders the not-found page for an unknown route', () => {
    renderAt('/does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to all questions' }),
    ).toHaveAttribute('href', '/')
  })
})
