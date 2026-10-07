import { describe, expect, it } from 'vitest'
import { createId } from './createId'

describe('createId', () => {
  it.each([true, false])(
    'returns unique ids (secure context: %s)',
    (secure) => {
      const ids = new Set(Array.from({ length: 50 }, () => createId(secure)))
      expect(ids.size).toBe(50)
    },
  )
})
