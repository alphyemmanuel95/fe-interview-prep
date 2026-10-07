import type { ComponentType } from 'react'
import { SearchPage } from './features/search/SearchPage'
import { TodoPage } from './features/todo/TodoPage'

export type Question = {
  readonly id: string
  readonly path: string
  readonly title: string
  readonly summary: string
  readonly Page: ComponentType
}

/** Questions in display order. Each question's PR registers its page here. */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'q1',
    path: '/q1',
    title: 'Todo App',
    summary: 'Add, edit, complete and filter todos that survive a refresh.',
    Page: TodoPage,
  },
  {
    id: 'q2',
    path: '/q2',
    title: 'Live Search',
    summary:
      'Search products as you type, with debouncing and stale-response protection.',
    Page: SearchPage,
  },
]
