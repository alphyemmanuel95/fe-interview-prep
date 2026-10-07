import { useEffect, useEffectEvent, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const DEBOUNCE_MS = 300

type DebouncedTextInputProps = {
  readonly id: string
  readonly label: string
  readonly type: 'search' | 'text'
  /** The committed value; may change from outside (e.g. back/forward). */
  readonly value: string
  readonly onCommit: (value: string) => void
  readonly placeholder?: string
}

/**
 * A text input that shows every keystroke immediately but only commits the
 * text once typing pauses, so each search becomes one history entry.
 */
export function DebouncedTextInput({
  id,
  label,
  type,
  value,
  onCommit,
  placeholder,
}: DebouncedTextInputProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  // When the committed value changes from outside, the draft follows it.
  // Adjusting during render avoids an extra effect-driven render pass.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }
  const debouncedDraft = useDebouncedValue(draft, DEBOUNCE_MS)

  // An effect event reads the latest `value`, so the effect re-runs only when
  // the debounced text settles, never just because `value` changed outside.
  const commit = useEffectEvent((text: string) => {
    if (text !== value) {
      onCommit(text)
    }
  })

  useEffect(() => {
    commit(debouncedDraft)
  }, [debouncedDraft])

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500"
      />
    </div>
  )
}
