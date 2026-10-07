import { Icon } from '../../components/Icon'
import { getErrorId } from './types'
import type { WizardField } from './types'

type FieldErrorProps = {
  readonly field: WizardField
  readonly message: string | undefined
}

/** Error text under a field; the field points at it via `aria-describedby`. */
export function FieldError({ field, message }: FieldErrorProps) {
  if (message === undefined) {
    return null
  }
  return (
    <p
      id={getErrorId(field)}
      className="mt-1.5 flex items-start gap-1.5 text-sm text-rose-600"
    >
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  )
}
