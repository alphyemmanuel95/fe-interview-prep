import { Icon } from '../../components/Icon'

type SummaryRow = {
  readonly label: string
  readonly value: string
}

type SummarySectionProps = {
  readonly title: string
  readonly rows: readonly SummaryRow[]
  readonly onEdit: () => void
  readonly isEditDisabled: boolean
}

export function SummarySection({
  title,
  rows,
  onEdit,
  isEditDisabled,
}: SummarySectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          disabled={isEditDisabled}
          aria-label={`Edit ${title.toLowerCase()}`}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          <Icon name="pencil" className="size-4" />
          Edit
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="min-w-0 font-medium wrap-anywhere text-slate-900 sm:col-span-2">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
