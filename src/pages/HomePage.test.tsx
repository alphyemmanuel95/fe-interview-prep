import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Question } from '../questions'
import { HomePage } from './HomePage'

function EmptyPage() {
  return null
}

const QUESTIONS_FIXTURE: readonly Question[] = [
  {
    id: 'q1',
    path: '/q1',
    title: 'Todo',
    summary: 'Manage a list of tasks',
    tags: ['localStorage', 'reusable hook'],
    Page: EmptyPage,
  },
  {
    id: 'q2',
    path: '/q2',
    title: 'Search',
    summary: 'Search as you type',
    Page: EmptyPage,
  },
]

function renderHomePage(questions: readonly Question[]) {
  return render(
    <MemoryRouter>
      <HomePage questions={questions} />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('shows an empty state when there are no questions', () => {
    renderHomePage([])
    expect(screen.getByText('No questions yet.')).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: 'Questions' }),
    ).not.toBeInTheDocument()
  })

  it('links to each question in order', () => {
    renderHomePage(QUESTIONS_FIXTURE)
    const links = within(
      screen.getByRole('list', { name: 'Questions' }),
    ).getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(
      within(links[0] ?? document.body).getByText('localStorage'),
    ).toBeInTheDocument()
    expect(links[0]).toHaveAccessibleName(/Todo/)
    expect(links[0]).toHaveAttribute('href', '/q1')
    expect(links[1]).toHaveAccessibleName(/Search/)
    expect(links[1]).toHaveAttribute('href', '/q2')
  })
})
