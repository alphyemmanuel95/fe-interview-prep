export type HighlightSegment = {
  readonly text: string
  readonly isMatch: boolean
}

/**
 * Splits `text` into segments, flagging every case-insensitive occurrence of
 * `query`. The query is matched as literal text, never as a pattern.
 */
export function highlightMatches(
  text: string,
  query: string,
): readonly HighlightSegment[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') {
    return [{ text, isMatch: false }]
  }

  const haystack = text.toLowerCase()
  const segments: HighlightSegment[] = []
  let start = 0
  let matchIndex = haystack.indexOf(needle, start)

  while (matchIndex !== -1) {
    if (matchIndex > start) {
      segments.push({ text: text.slice(start, matchIndex), isMatch: false })
    }
    const end = matchIndex + needle.length
    segments.push({ text: text.slice(matchIndex, end), isMatch: true })
    start = end
    matchIndex = haystack.indexOf(needle, start)
  }

  if (start < text.length) {
    segments.push({ text: text.slice(start), isMatch: false })
  }
  return segments
}
