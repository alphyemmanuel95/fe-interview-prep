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
