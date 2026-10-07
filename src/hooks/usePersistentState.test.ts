import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePersistentState } from './usePersistentState'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

describe('usePersistentState', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() =>
      usePersistentState('greeting', 'hello', isString),
    )
    expect(result.current[0]).toBe('hello')
  })

  it('restores the saved value after a remount', () => {
    const first = renderHook(() =>
      usePersistentState('greeting', 'hello', isString),
    )
    act(() => {
      first.result.current[1]('updated')
    })
    first.unmount()

    const second = renderHook(() =>
      usePersistentState('greeting', 'hello', isString),
    )
    expect(second.result.current[0]).toBe('updated')
  })

  it('falls back to the initial value when stored data is invalid', () => {
    window.localStorage.setItem('greeting', JSON.stringify(42))
    const { result } = renderHook(() =>
      usePersistentState('greeting', 'hello', isString),
    )
    expect(result.current[0]).toBe('hello')
  })

  it('does not overwrite stored data on mount', () => {
    window.localStorage.setItem('greeting', JSON.stringify(42))
    renderHook(() => usePersistentState('greeting', 'hello', isString))
    expect(window.localStorage.getItem('greeting')).toBe('42')
  })
})
