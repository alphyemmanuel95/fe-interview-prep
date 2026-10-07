import { Link } from 'react-router'
import type { Question } from '../questions'

type HomePageProps = {
  readonly questions: readonly Question[]
}

export function HomePage({ questions }: HomePageProps) {
  return (
    <section aria-labelledby="home-heading">
      <h1 id="home-heading" className="text-2xl font-bold sm:text-3xl">
        Frontend Interview Prep
      </h1>
      {questions.length === 0 ? (
        <p className="mt-4 text-slate-600">No questions yet.</p>
      ) : (
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {questions.map(({ id, path, title, summary }) => (
            <li key={id}>
              <Link
                to={path}
                className="block h-full rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-slate-600">
                  {summary}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
