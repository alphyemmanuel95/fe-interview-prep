import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { usePersistentState } from '../../hooks/usePersistentState'
import { createId } from '../../lib/createId'
import { Icon } from '../../components/Icon'
import { TodoFilters } from './TodoFilters'
import { TodoItem } from './TodoItem'
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
import type { Filter, Todo } from './todos'

const TODOS_KEY = 'q1.todos.v1'
const FILTER_KEY = 'q1.filter.v1'
const NO_TODOS: readonly Todo[] = []

export function TodoPage() {
  const [todos, setTodos] = usePersistentState(TODOS_KEY, NO_TODOS, isTodoList)
  const [filter, setFilter] = usePersistentState<Filter>(
    FILTER_KEY,
    'all',
    isFilter,
  )
  const [draft, setDraft] = useState('')

  // Derived during render: storing these would duplicate `todos` and risk drift.
  const visibleTodos = filterTodos(todos, filter)
  const activeCount = countActive(todos)
  const completedCount = todos.length - activeCount
  const progressPercent =
    todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100)

  const newTodoRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  // Index in the visible list of an item that is about to disappear, so focus
  // can move to its neighbour instead of being lost to <body>.
  const focusIndexAfterRemoval = useRef<number | null>(null)

  useEffect(() => {
    const index = focusIndexAfterRemoval.current
    if (index === null) {
      return
    }
    focusIndexAfterRemoval.current = null
    const checkboxes = listRef.current?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    )
    const neighbour =
      checkboxes === undefined
        ? undefined
        : checkboxes[Math.min(index, checkboxes.length - 1)]
    ;(neighbour ?? newTodoRef.current)?.focus()
  }, [todos, filter])

  function rememberFocusIndex(id: string) {
    const index = visibleTodos.findIndex((todo) => todo.id === id)
    focusIndexAfterRemoval.current = index === -1 ? null : index
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = createId()
    setTodos((current) => addTodo(current, draft, id))
    setDraft('')
  }

  function handleToggle(id: string) {
    // Toggling only hides the item when a filter other than "all" is active.
    if (filter !== 'all') {
      rememberFocusIndex(id)
    }
    setTodos((current) => toggleTodo(current, id))
  }

  function handleEdit(id: string, title: string) {
    setTodos((current) => editTodo(current, id, title))
  }

  function handleDelete(id: string) {
    rememberFocusIndex(id)
    setTodos((current) => deleteTodo(current, id))
  }

  function handleClearCompleted() {
    // The button disables itself, so send focus to the first remaining item.
    focusIndexAfterRemoval.current = 0
    setTodos(clearCompleted)
  }

  return (
    <section aria-labelledby="todo-heading" className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5">
        <header className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 pt-6 pb-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 id="todo-heading" className="text-2xl font-bold sm:text-3xl">
                Todo App
              </h1>
              <p className="mt-1 text-sm text-indigo-100">
                Plan it, do it, tick it off.
              </p>
            </div>
            {todos.length > 0 && (
              <p className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                {completedCount} of {todos.length} done
              </p>
            )}
          </div>

          {todos.length > 0 && (
            <div
              aria-hidden="true"
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
            <label htmlFor="new-todo" className="sr-only">
              New todo
            </label>
            <input
              ref={newTodoRef}
              id="new-todo"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
              }}
              placeholder="What needs to be done?"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 sm:px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Icon name="plus" className="size-5" />
              Add
            </button>
          </form>
        </header>

        {todos.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Icon name="clipboard" className="size-7" />
            </span>
            <p className="mt-4 font-medium text-slate-700">
              No todos yet. Add one above.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your list is saved in this browser.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 px-4 py-3">
              <TodoFilters value={filter} onChange={setFilter} />
            </div>

            {visibleTodos.length === 0 ? (
              <p className="px-6 py-10 text-center text-slate-500">
                No {filter} todos.
              </p>
            ) : (
              <ul ref={listRef} className="divide-y divide-slate-100">
                {visibleTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}

            <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
              <p aria-live="polite" className="font-medium text-slate-700">
                {activeCount} {activeCount === 1 ? 'item' : 'items'} left
              </p>
              <button
                type="button"
                onClick={handleClearCompleted}
                disabled={completedCount === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>
    </section>
  )
}
