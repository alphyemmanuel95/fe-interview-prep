import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

const DELAY_MS = 300

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', DELAY_MS))
    expect(result.current).toBe('a')
  })

  it('updates only after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, DELAY_MS),
      { initialProps: { value: 'r' } },
    )

    rerender({ value: 're' })
    act(() => {
      vi.advanceTimersByTime(DELAY_MS - 1)
    })
    rerender({ value: 'rea' })
    act(() => {
      vi.advanceTimersByTime(DELAY_MS - 1)
    })
    expect(result.current).toBe('r')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('rea')
  })

  it('clears the pending timer on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, DELAY_MS),
      { initialProps: { value: 'a' } },
    )
    rerender({ value: 'b' })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
