import type { ReactNode } from 'react'

type PageCardProps = {
  readonly headingId: string
  readonly title: string
  readonly subtitle: string
  readonly children: ReactNode
}

export function PageCard({
  headingId,
  title,
  subtitle,
  children,
}: PageCardProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5"
    >
      <header className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 pt-6 pb-5 text-white">
        <h1 id={headingId} className="text-2xl font-bold sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-indigo-100">{subtitle}</p>
      </header>
      {children}
    </section>
  )
}
