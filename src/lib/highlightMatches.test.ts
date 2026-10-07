import { describe, expect, it } from 'vitest'
import { highlightMatches } from './highlightMatches'

describe('highlightMatches', () => {
  it('flags a case-insensitive match and keeps the original casing', () => {
    expect(highlightMatches('React Hooks', 'react')).toEqual([
      { text: 'React', isMatch: true },
      { text: ' Hooks', isMatch: false },
    ])
  })

  it('stays aligned when a character lowercases to a different length', () => {
    // 'İ'.toLowerCase() is two code units long; a naive toLowerCase() would
    // shift every later match by one.
    expect(highlightMatches('İstanbul Phone', 'phone')).toEqual([
      { text: 'İstanbul ', isMatch: false },
      { text: 'Phone', isMatch: true },
    ])
  })

  it('flags every occurrence', () => {
    expect(highlightMatches('ab-AB-ab', 'ab')).toEqual([
      { text: 'ab', isMatch: true },
      { text: '-', isMatch: false },
      { text: 'AB', isMatch: true },
      { text: '-', isMatch: false },
      { text: 'ab', isMatch: true },
    ])
  })

  it('treats regex special characters as literal text', () => {
    expect(highlightMatches('Learn C++ (fast)', 'c++')).toEqual([
      { text: 'Learn ', isMatch: false },
      { text: 'C++', isMatch: true },
      { text: ' (fast)', isMatch: false },
    ])
    expect(highlightMatches('Learn C++ (fast)', '(')).toEqual([
      { text: 'Learn C++ ', isMatch: false },
      { text: '(', isMatch: true },
      { text: 'fast)', isMatch: false },
    ])
  })

  it('returns the whole text unflagged when nothing matches', () => {
    expect(highlightMatches('Phone', 'xyz')).toEqual([
      { text: 'Phone', isMatch: false },
    ])
  })

  it('returns the whole text unflagged for a blank query', () => {
    expect(highlightMatches('Phone', '')).toEqual([
      { text: 'Phone', isMatch: false },
    ])
    expect(highlightMatches('Phone', '   ')).toEqual([
      { text: 'Phone', isMatch: false },
    ])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(highlightMatches('Red Phone', ' phone ')).toEqual([
      { text: 'Red ', isMatch: false },
      { text: 'Phone', isMatch: true },
    ])
  })
})
