import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ApiError } from './apiClient'
import { PageCard } from './PageCard'
import { getRedirectTarget } from './routes'
import { SessionSplash } from './SessionSplash'
import { useAuth } from './useAuth'

type FieldErrors = {
  readonly username: string | null
  readonly password: string | null
}

type Submission =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'failed'; readonly message: string }

const NO_FIELD_ERRORS: FieldErrors = { username: null, password: null }
const UNAUTHORIZED = 401

const INPUT_CLASS =
  'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 aria-invalid:border-rose-500'

function validate(username: string, password: string): FieldErrors {
  return {
    username: username.trim() === '' ? 'Enter your username.' : null,
    password: password === '' ? 'Enter your password.' : null,
  }
}

function describeLoginError(error: unknown): string {
  if (error instanceof ApiError && error.status === UNAUTHORIZED) {
    return 'Incorrect username or password.'
  }
  return 'Couldn’t sign in. Check your connection and try again.'
}

export function LoginPage() {
  const { session, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_FIELD_ERRORS)
  const [submission, setSubmission] = useState<Submission>({ status: 'idle' })
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  if (session.status === 'restoring') {
    return <SessionSplash />
  }
  if (session.status === 'authenticated') {
    // Covers both a fresh login and visiting /q5/login while signed in.
    const navigationState: unknown = location.state
    return <Navigate to={getRedirectTarget(navigationState)} replace />
  }

  async function submit() {
    setSubmission({ status: 'submitting' })
    try {
      await login(username.trim(), password)
    } catch (error: unknown) {
      setSubmission({ status: 'failed', message: describeLoginError(error) })
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(username, password)
    setFieldErrors(errors)
    if (errors.username !== null) {
      usernameRef.current?.focus()
      return
    }
    if (errors.password !== null) {
      passwordRef.current?.focus()
      return
    }
    void submit()
  }

  const isSubmitting = submission.status === 'submitting'

  return (
    <div className="mx-auto max-w-md">
      <PageCard
        headingId="login-heading"
        title="Sign in"
        subtitle="Sign in to see your orders."
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4 p-6">
          {session.hasExpired && (
            <p
              role="status"
              className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              Your session expired. Please sign in again.
            </p>
          )}
          {submission.status === 'failed' && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {submission.message}
            </p>
          )}

          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              ref={usernameRef}
              id="login-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
              }}
              aria-invalid={fieldErrors.username !== null}
              aria-describedby={
                fieldErrors.username === null
                  ? undefined
                  : 'login-username-error'
              }
              className={INPUT_CLASS}
            />
            {fieldErrors.username !== null && (
              <p
                id="login-username-error"
                className="mt-1 text-sm text-rose-700"
              >
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              aria-invalid={fieldErrors.password !== null}
              aria-describedby={
                fieldErrors.password === null
                  ? undefined
                  : 'login-password-error'
              }
              className={INPUT_CLASS}
            />
            {fieldErrors.password !== null && (
              <p
                id="login-password-error"
                className="mt-1 text-sm text-rose-700"
              >
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <aside
          aria-label="Demo accounts"
          className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600"
        >
          <p className="font-medium text-slate-700">Demo accounts</p>
          <ul className="mt-1 space-y-0.5">
            <li>
              <code>alice</code> / <code>password123</code> (user)
            </li>
            <li>
              <code>admin</code> / <code>admin123</code> (admin)
            </li>
          </ul>
        </aside>
      </PageCard>
    </div>
  )
}
