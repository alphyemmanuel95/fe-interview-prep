import type { Ref } from 'react'
import { Icon } from '../../components/Icon'
import type { RegistrationReceipt } from './api'
import { PRIMARY_BUTTON_CLASS } from './styles'

type SuccessPanelProps = {
  readonly receipt: RegistrationReceipt
  readonly onStartOver: () => void
  readonly headingRef: Ref<HTMLHeadingElement>
}

export function SuccessPanel({
  receipt,
  onStartOver,
  headingRef,
}: SuccessPanelProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Icon name="check" className="size-7" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-xl font-semibold text-slate-900"
      >
        Registration complete
      </h2>
      <p className="mt-2 max-w-full text-slate-600">
        Thanks, <span className="font-medium break-words">{receipt.name}</span>.
        We’ll be in touch at{' '}
        <span className="font-medium break-all">{receipt.email}</span>.
      </p>
      <button
        type="button"
        onClick={onStartOver}
        className={`mt-6 ${PRIMARY_BUTTON_CLASS}`}
      >
        Start over
      </button>
    </div>
  )
}
