export type Todo = {
  readonly id: string
  readonly title: string
  readonly completed: boolean
}

export const FILTERS = ['all', 'active', 'completed'] as const

export type Filter = (typeof FILTERS)[number]

export function isTodo(value: unknown): value is Todo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'completed' in value &&
    typeof value.completed === 'boolean'
  )
}

export function isTodoList(value: unknown): value is readonly Todo[] {
  return Array.isArray(value) && value.every(isTodo)
}

export function isFilter(value: unknown): value is Filter {
  return FILTERS.some((filter) => filter === value)
}

/** Appends a todo. Blank titles are ignored and the same list is returned. */
export function addTodo(
  todos: readonly Todo[],
  title: string,
  id: string,
): readonly Todo[] {
  const trimmed = title.trim()
  if (trimmed === '') {
    return todos
  }
  return [...todos, { id, title: trimmed, completed: false }]
}

/**
 * Renames a todo. Blank or unchanged titles (and unknown ids) return the same
 * list, so React can skip the re-render and nothing is re-saved.
 */
export function editTodo(
  todos: readonly Todo[],
  id: string,
  title: string,
): readonly Todo[] {
  const trimmed = title.trim()
  const isChange = todos.some(
    (todo) => todo.id === id && todo.title !== trimmed,
  )
  if (trimmed === '' || !isChange) {
    return todos
  }
  return todos.map((todo) =>
    todo.id === id ? { ...todo, title: trimmed } : todo,
  )
}

export function toggleTodo(
  todos: readonly Todo[],
  id: string,
): readonly Todo[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  )
}

export function deleteTodo(
  todos: readonly Todo[],
  id: string,
): readonly Todo[] {
  return todos.filter((todo) => todo.id !== id)
}

export function clearCompleted(todos: readonly Todo[]): readonly Todo[] {
  return todos.filter((todo) => !todo.completed)
}

export function filterTodos(
  todos: readonly Todo[],
  filter: Filter,
): readonly Todo[] {
  switch (filter) {
    case 'all':
      return todos
    case 'active':
      return todos.filter((todo) => !todo.completed)
    case 'completed':
      return todos.filter((todo) => todo.completed)
  }
}

export function countActive(todos: readonly Todo[]): number {
  return todos.filter((todo) => !todo.completed).length
}
