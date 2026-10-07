import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, SubmitEvent } from 'react'
import { Icon } from '../../components/Icon'
import type { Todo } from './todos'

type TodoItemProps = {
  readonly todo: Todo
  readonly onToggle: (id: string) => void
  readonly onEdit: (id: string, title: string) => void
  readonly onDelete: (id: string) => void
}

const ICON_BUTTON_CLASS =
  'rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

const TEXT_BUTTON_CLASS =
  'rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocus = useRef(false)

  // Return focus to the Edit button after leaving edit mode, so keyboard users
  // don't lose their place in the list.
  useEffect(() => {
    if (!isEditing && shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  function startEditing() {
    setDraft(todo.title)
    setIsEditing(true)
  }

  function stopEditing() {
    shouldRestoreFocus.current = true
    setIsEditing(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onEdit(todo.id, draft)
    stopEditing()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      stopEditing()
    }
  }

  const checkboxId = `todo-${todo.id}`

  if (isEditing) {
    return (
      <li className="bg-indigo-50/60 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            aria-label={`Edit "${todo.title}"`}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 shadow-sm focus-visible:outline-2 focus-visible:outline-indigo-600"
          />
          <button
            type="submit"
            className={`${TEXT_BUTTON_CLASS} bg-indigo-600 text-white hover:bg-indigo-700`}
          >
            Save
          </button>
          <button
            type="button"
            onClick={stopEditing}
            className={`${TEXT_BUTTON_CLASS} text-slate-600 hover:bg-slate-200`}
          >
            Cancel
          </button>
        </form>
      </li>
    )
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <input
          id={checkboxId}
          type="checkbox"
          checked={todo.completed}
          onChange={() => {
            onToggle(todo.id)
          }}
          className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-slate-300 transition checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        />
        <Icon
          name="check"
          className="pointer-events-none absolute size-4 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      <label
        htmlFor={checkboxId}
        className={`min-w-0 flex-1 cursor-pointer break-words transition ${
          todo.completed ? 'text-slate-500 line-through' : 'text-slate-800'
        }`}
      >
        {todo.title}
      </label>
      <div className="flex shrink-0 items-center gap-1">
        <button
          ref={editButtonRef}
          type="button"
          onClick={startEditing}
          aria-label={`Edit "${todo.title}"`}
          className={`${ICON_BUTTON_CLASS} hover:text-indigo-600`}
        >
          <Icon name="pencil" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete(todo.id)
          }}
          aria-label={`Delete "${todo.title}"`}
          className={`${ICON_BUTTON_CLASS} hover:text-rose-600`}
        >
          <Icon name="trash" className="size-4" />
        </button>
      </div>
    </li>
  )
}
