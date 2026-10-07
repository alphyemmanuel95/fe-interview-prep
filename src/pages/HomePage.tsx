import { Link } from 'react-router'
import { Icon } from '../components/Icon'
import type { Question } from '../questions'

const STACK = [
  'React 19',
  'TypeScript (strict)',
  'Vite',
  'Tailwind CSS',
  'Vitest',
  'Playwright',
] as const

type HomePageProps = {
  readonly questions: readonly Question[]
}

export function HomePage({ questions }: HomePageProps) {
  return (
    <section aria-labelledby="home-heading" className="space-y-8">
      <header className="rounded-2xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 text-white shadow-xl shadow-indigo-900/10 sm:px-8">
        <h1 id="home-heading" className="text-3xl font-bold sm:text-4xl">
          Frontend Interview Prep
        </h1>
        <p className="mt-2 max-w-2xl text-indigo-50">
          Five React + TypeScript challenges, each shipped as its own pull
          request with tests and a review.
        </p>
        <ul aria-label="Tech stack" className="mt-5 flex flex-wrap gap-2">
          {STACK.map((item) => (
            <li
              key={item}
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/25"
            >
              {item}
            </li>
          ))}
        </ul>
      </header>

      {questions.length === 0 ? (
        <p className="text-slate-600">No questions yet.</p>
      ) : (
        <ol aria-label="Questions" className="grid gap-4 sm:grid-cols-2">
          {questions.map(({ id, path, title, summary, tags }) => (
            <li key={id}>
              <Link
                to={path}
                className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700"
                  >
                    {id.toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {title}
                  </span>
                </span>
                <span className="mt-3 block text-sm text-slate-600">
                  {summary}
                </span>
                {tags !== undefined && tags.length > 0 && (
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-indigo-700">
                  Open
                  <Icon
                    name="arrowRight"
                    className="size-4 transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
