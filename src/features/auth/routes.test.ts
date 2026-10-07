import { describe, expect, it } from 'vitest'
import { getRedirectTarget } from './routes'

describe('getRedirectTarget', () => {
  it('returns the page the user was sent away from', () => {
    expect(
      getRedirectTarget({
        from: { pathname: '/q5/orders', search: '?page=2', hash: '#top' },
      }),
    ).toBe('/q5/orders?page=2#top')
  })

  it('falls back to the dashboard without a usable origin', () => {
    expect(getRedirectTarget(null)).toBe('/q5')
    expect(getRedirectTarget({ from: 'oops' })).toBe('/q5')
    expect(getRedirectTarget({ from: { pathname: '/q5/login' } })).toBe('/q5')
  })

  it('never redirects outside Q5', () => {
    expect(getRedirectTarget({ from: { pathname: '/q1' } })).toBe('/q5')
    expect(getRedirectTarget({ from: { pathname: '/q5evil' } })).toBe('/q5')
  })
})
