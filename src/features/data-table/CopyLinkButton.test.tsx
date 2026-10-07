import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopyLinkButton } from './CopyLinkButton'

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
}

describe('CopyLinkButton', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard')
    vi.useRealTimers()
  })

  it('copies the current URL and confirms it', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    mockClipboard(writeText)
    render(<CopyLinkButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(
      await screen.findByText('Link to this view copied.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('explains the fallback when the clipboard is blocked', async () => {
    mockClipboard(() => Promise.reject(new Error('Denied')))
    render(<CopyLinkButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(
      await screen.findByText(
        'Couldn’t copy the link. Copy the URL from the address bar instead.',
      ),
    ).toBeInTheDocument()
  })

  it('returns to its idle label after a moment', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockClipboard(() => Promise.resolve())
    render(<CopyLinkButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    await screen.findByRole('button', { name: 'Copied' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).toBeInTheDocument()
  })
})
