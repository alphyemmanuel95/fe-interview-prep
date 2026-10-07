import { highlightMatches } from '../../lib/highlightMatches'

type HighlightedTextProps = {
  readonly text: string
  readonly query: string
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = highlightMatches(text, query)
  return (
    <>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          // Segments are derived from static text and never reordered, so the
          // index is a stable key here.
          <mark
            key={index}
            className="rounded-sm bg-violet-100 px-0.5 font-semibold text-violet-900"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}
