import { describe, expect, it } from 'vitest'
import {
  addTodo,
  clearCompleted,
  countActive,
  deleteTodo,
  editTodo,
  filterTodos,
  isFilter,
  isTodoList,
  toggleTodo,
} from './todos'
import type { Todo } from './todos'

const TODOS: readonly Todo[] = [
  { id: '1', title: 'Buy milk', completed: false },
  { id: '2', title: 'Walk dog', completed: true },
  { id: '3', title: 'Write tests', completed: false },
]

describe('todos', () => {
  describe('addTodo', () => {
    it('appends a todo with a trimmed title', () => {
      expect(addTodo([], '  Read book  ', 'a')).toEqual([
        { id: 'a', title: 'Read book', completed: false },
      ])
    })

    it.each(['', '   ', '\t\n'])(
      'ignores the blank title %j and returns the same list',
      (title) => {
        expect(addTodo(TODOS, title, 'a')).toBe(TODOS)
      },
    )
  })

  describe('editTodo', () => {
    it('renames the matching todo with a trimmed title', () => {
      const result = editTodo(TODOS, '1', '  Buy oat milk ')
      expect(result.find((todo) => todo.id === '1')?.title).toBe('Buy oat milk')
    })

    it('keeps the original title when the new title is blank', () => {
      expect(editTodo(TODOS, '1', '   ')).toBe(TODOS)
    })

    it('returns the same list when nothing changes', () => {
      expect(editTodo(TODOS, '1', ' Buy milk ')).toBe(TODOS)
      expect(editTodo(TODOS, 'unknown', 'Anything')).toBe(TODOS)
    })
  })

  it('toggles completion of the matching todo only', () => {
    const result = toggleTodo(TODOS, '1')
    expect(result.map((todo) => todo.completed)).toEqual([true, true, false])
  })

  it('deletes the matching todo', () => {
    expect(deleteTodo(TODOS, '2').map((todo) => todo.id)).toEqual(['1', '3'])
  })

  it('clears completed todos', () => {
    expect(clearCompleted(TODOS).map((todo) => todo.id)).toEqual(['1', '3'])
  })

  it.each([
    ['all', ['1', '2', '3']],
    ['active', ['1', '3']],
    ['completed', ['2']],
  ] as const)('filters by %s', (filter, ids) => {
    expect(filterTodos(TODOS, filter).map((todo) => todo.id)).toEqual(ids)
  })

  it('counts active todos', () => {
    expect(countActive(TODOS)).toBe(2)
  })

  it('validates stored data', () => {
    expect(isTodoList(TODOS)).toBe(true)
    expect(isTodoList([{ id: 1, title: 'x', completed: false }])).toBe(false)
    expect(isTodoList('nope')).toBe(false)
    expect(isFilter('active')).toBe(true)
    expect(isFilter('archived')).toBe(false)
  })
})
