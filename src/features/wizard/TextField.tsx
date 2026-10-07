import type { HTMLInputAutoCompleteAttribute } from 'react'
import { FieldError } from './FieldError'
import { getInputClass } from './styles'
import { getErrorId, getFieldId } from './types'
import type { WizardField } from './types'

type TextFieldProps = {
  readonly field: WizardField
  readonly label: string
  readonly value: string
  readonly error: string | undefined
  readonly onChange: (value: string) => void
  readonly type?: 'text' | 'email' | 'tel'
  readonly autoComplete: HTMLInputAutoCompleteAttribute
}

export function TextField({
  field,
  label,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
}: TextFieldProps) {
  const id = getFieldId(field)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        autoComplete={autoComplete}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : getErrorId(field)}
        className={`mt-1.5 ${getInputClass(error)}`}
      />
      <FieldError field={field} message={error} />
    </div>
  )
}
