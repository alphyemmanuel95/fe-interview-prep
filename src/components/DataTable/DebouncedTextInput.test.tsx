import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DebouncedTextInput } from './DebouncedTextInput'

const DEBOUNCE_MS = 300

function renderInput(value: string, onCommit: (text: string) => void) {
  return render(
    <DebouncedTextInput
      id="search"
      label="Search"
      type="search"
      value={value}
      onCommit={onCommit}
    />,
  )
}

function typeText(text: string) {
  fireEvent.change(screen.getByLabelText('Search'), {
    target: { value: text },
  })
}

function waitForDebounce() {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS)
  })
}

describe('DebouncedTextInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows keystrokes at once and commits once typing pauses', () => {
    const onCommit = vi.fn()
    renderInput('', onCommit)

    typeText('w')
    typeText('wi')
    typeText('wil')
    expect(screen.getByLabelText('Search')).toHaveValue('wil')
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 1)
    })
    expect(onCommit).not.toHaveBeenCalled()

    waitForDebounce()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('wil')
  })

  it('does not commit text that matches the committed value', () => {
    const onCommit = vi.fn()
    renderInput('wilde', onCommit)

    typeText('wild')
    typeText('wilde')
    waitForDebounce()

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('follows an outside change and cancels the pending commit', () => {
    const onCommit = vi.fn()
    const { rerender } = renderInput('', onCommit)

    typeText('wil')
    rerender(
      <DebouncedTextInput
        id="search"
        label="Search"
        type="search"
        value="twain"
        onCommit={onCommit}
      />,
    )
    waitForDebounce()

    expect(screen.getByLabelText('Search')).toHaveValue('twain')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits retyped text after an outside reset', () => {
    const onCommit = vi.fn()
    const { rerender } = renderInput('', onCommit)

    typeText('zzz')
    waitForDebounce()
    expect(onCommit).toHaveBeenLastCalledWith('zzz')
    rerender(
      <DebouncedTextInput
        id="search"
        label="Search"
        type="search"
        value="zzz"
        onCommit={onCommit}
      />,
    )
    rerender(
      <DebouncedTextInput
        id="search"
        label="Search"
        type="search"
        value=""
        onCommit={onCommit}
      />,
    )
    expect(screen.getByLabelText('Search')).toHaveValue('')

    typeText('zzz')
    waitForDebounce()

    expect(onCommit).toHaveBeenCalledTimes(2)
    expect(onCommit).toHaveBeenLastCalledWith('zzz')
  })

  it('never commits after unmounting', () => {
    const onCommit = vi.fn()
    const { unmount } = renderInput('', onCommit)

    typeText('wil')
    unmount()
    waitForDebounce()

    expect(onCommit).not.toHaveBeenCalled()
  })
})
