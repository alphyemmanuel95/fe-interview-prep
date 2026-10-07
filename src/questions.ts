import type { ComponentType } from 'react'

export type Question = {
  readonly id: string
  readonly path: string
  readonly title: string
  readonly summary: string
  readonly Page: ComponentType
}

/** Questions in display order. Each question's PR registers its page here. */
export const QUESTIONS: readonly Question[] = []
