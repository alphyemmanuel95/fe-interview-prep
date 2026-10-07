import { Icon } from '../../components/Icon'
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from './styles'

type StepActionsProps = {
  readonly submitLabel: string
  /** Omitted on the first step, which has nowhere to go back to. */
  readonly onBack?: () => void
  readonly isBusy?: boolean
}

export function StepActions({
  submitLabel,
  onBack,
  isBusy = false,
}: StepActionsProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
      {onBack === undefined ? (
        <span aria-hidden="true" className="hidden sm:block" />
      ) : (
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className={SECONDARY_BUTTON_CLASS}
        >
          <Icon name="arrowLeft" className="size-5" />
          Back
        </button>
      )}
      {/* aria-disabled rather than disabled while busy, so keyboard focus
          stays on the button; the submit handler ignores repeat submits. */}
      <button
        type="submit"
        aria-disabled={isBusy}
        className={`${PRIMARY_BUTTON_CLASS} aria-disabled:cursor-wait aria-disabled:bg-indigo-400`}
      >
        {submitLabel}
        {!isBusy && <Icon name="arrowRight" className="size-5" />}
      </button>
    </div>
  )
}
