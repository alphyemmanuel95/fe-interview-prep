import { Link, Outlet } from 'react-router'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-4xl items-center px-4 py-3"
        >
          <Link
            to="/"
            className="rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Frontend Interview Prep
          </Link>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
