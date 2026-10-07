import { Icon } from '../../components/Icon'
import { STEP_LABELS, STEPS } from './types'
import type { StepId } from './types'

type ProgressStepsProps = {
  readonly current: StepId
}

export function ProgressSteps({ current }: ProgressStepsProps) {
  const currentIndex = STEPS.indexOf(current)
  const progressPercent = Math.round((currentIndex / (STEPS.length - 1)) * 100)

  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-white">
        Step {currentIndex + 1} of {STEPS.length}
      </p>
      <div
        aria-hidden="true"
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20"
      >
        <div
          className="h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ol
        aria-label="Registration steps"
        className="mt-4 grid grid-cols-4 gap-1 text-center text-xs font-medium sm:text-sm"
      >
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          let markerClass = 'border-2 border-white/70 text-white'
          if (isDone) {
            markerClass = 'bg-white text-indigo-700'
          } else if (isCurrent) {
            markerClass = 'bg-white text-indigo-700 ring-4 ring-white/30'
          }
          return (
            <li
              key={step}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${markerClass}`}
              >
                {isDone ? <Icon name="check" className="size-4" /> : index + 1}
              </span>
              <span
                className={
                  isCurrent ? 'font-semibold text-white' : 'text-white'
                }
              >
                {STEP_LABELS[step]}
                {isDone && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
