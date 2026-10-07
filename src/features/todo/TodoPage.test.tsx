import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodoPage } from './TodoPage'

function addTodo(title: string) {
  fireEvent.change(screen.getByLabelText('New todo'), {
    target: { value: title },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
}

describe('TodoPage', () => {
  it('adds todos and ignores blank titles', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('   ')
    addTodo('Walk dog')

    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.getByLabelText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('2 items left')).toBeInTheDocument()
  })

  it('completes, filters and clears completed todos', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('Walk dog')

    fireEvent.click(screen.getByLabelText('Buy milk'))
    expect(screen.getByText('1 item left')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByLabelText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Walk dog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear completed' }))
    expect(screen.queryByLabelText('Buy milk')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clear completed' }),
    ).toBeDisabled()
  })

  it('edits a todo and keeps the original title when the edit is blank', () => {
    render(<TodoPage />)
    addTodo('Buy milk')

    fireEvent.click(screen.getByRole('button', { name: 'Edit "Buy milk"' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit "Buy milk"' }), {
      target: { value: 'Buy oat milk' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByLabelText('Buy oat milk')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit "Buy oat milk"' }))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Edit "Buy oat milk"' }),
      { target: { value: '   ' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByLabelText('Buy oat milk')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit "Buy oat milk"' }),
    ).toHaveFocus()
  })

  it('discards the draft and restores focus when editing is cancelled', () => {
    render(<TodoPage />)
    addTodo('Buy milk')

    fireEvent.click(screen.getByRole('button', { name: 'Edit "Buy milk"' }))
    const input = screen.getByRole('textbox', { name: 'Edit "Buy milk"' })
    fireEvent.change(input, { target: { value: 'Something else' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.getByLabelText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText('Something else')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit "Buy milk"' }),
    ).toHaveFocus()
  })

  it('moves focus to the next item after a delete, then to the input', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('Walk dog')

    fireEvent.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))
    expect(screen.getByLabelText('Walk dog')).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Delete "Walk dog"' }))
    expect(screen.getByLabelText('New todo')).toHaveFocus()
  })

  it('keeps focus in the list when completing an item hides it', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('Walk dog')
    fireEvent.click(screen.getByRole('button', { name: 'Active' }))

    fireEvent.click(screen.getByLabelText('Walk dog'))
    expect(screen.getByLabelText('Buy milk')).toHaveFocus()
  })

  it('moves focus to the first remaining item after clearing completed', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('Walk dog')
    fireEvent.click(screen.getByLabelText('Buy milk'))

    fireEvent.click(screen.getByRole('button', { name: 'Clear completed' }))
    expect(screen.getByLabelText('Walk dog')).toHaveFocus()
  })

  it('deletes a todo', () => {
    render(<TodoPage />)
    addTodo('Buy milk')
    fireEvent.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))
    expect(screen.getByText('No todos yet. Add one above.')).toBeInTheDocument()
  })

  it('restores todos and the filter after a remount', () => {
    const { unmount } = render(<TodoPage />)
    addTodo('Buy milk')
    addTodo('Walk dog')
    fireEvent.click(screen.getByLabelText('Buy milk'))
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
    unmount()

    render(<TodoPage />)
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Buy milk')).toBeChecked()
    expect(screen.queryByLabelText('Walk dog')).not.toBeInTheDocument()
  })
})
