import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-heading">
      <h1 id="not-found-heading" className="text-2xl font-bold">
        Page not found
      </h1>
      <p className="mt-4">
        <Link
          to="/"
          className="text-blue-700 underline hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Back to all questions
        </Link>
      </p>
    </section>
  )
}
