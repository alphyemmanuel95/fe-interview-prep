import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './storage'

function isNumberList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

describe('storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('round-trips a valid value', () => {
    expect(writeJson('numbers', [1, 2, 3])).toBe(true)
    expect(readJson('numbers', isNumberList)).toEqual([1, 2, 3])
  })

  it('returns undefined for a missing key', () => {
    expect(readJson('missing', isNumberList)).toBeUndefined()
  })

  it('returns undefined for corrupt JSON', () => {
    window.localStorage.setItem('numbers', '{not json')
    expect(readJson('numbers', isNumberList)).toBeUndefined()
  })

  it('returns undefined when the stored shape is invalid', () => {
    window.localStorage.setItem('numbers', JSON.stringify(['a', 'b']))
    expect(readJson('numbers', isNumberList)).toBeUndefined()
  })

  it('reports a failed write instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    expect(writeJson('numbers', [1])).toBe(false)
  })
})
