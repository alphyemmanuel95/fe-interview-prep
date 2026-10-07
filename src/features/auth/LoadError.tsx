import { Icon } from '../../components/Icon'

type LoadErrorProps = {
  readonly title: string
  readonly onRetry: () => void
}

export function LoadError({ title, onRetry }: LoadErrorProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <Icon name="alert" className="size-7" />
      </span>
      <h2 className="mt-4 font-medium text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Retry
      </button>
    </div>
  )
}
