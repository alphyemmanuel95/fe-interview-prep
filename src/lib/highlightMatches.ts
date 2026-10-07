export type HighlightSegment = {
  readonly text: string
  readonly isMatch: boolean
}

/**
 * Lowercases character by character, keeping any character whose lowercase
 * form has a different length (e.g. "İ"), so indices stay aligned with the
 * original string.
 */
function foldCase(value: string): string {
  return Array.from(value, (char) => {
    const lower = char.toLowerCase()
    return lower.length === char.length ? lower : char
  }).join('')
}

/**
 * Splits `text` into segments, flagging every case-insensitive occurrence of
 * `query`. The query is matched as literal text, never as a pattern.
 */
export function highlightMatches(
  text: string,
  query: string,
): readonly HighlightSegment[] {
  const needle = foldCase(query.trim())
  if (needle === '') {
    return [{ text, isMatch: false }]
  }

  const haystack = foldCase(text)
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
