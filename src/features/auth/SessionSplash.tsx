export function SessionSplash() {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-xl flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5"
    >
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 motion-reduce:animate-none"
      />
      <p className="mt-4 font-medium text-slate-700">Restoring session…</p>
      <p className="mt-1 text-sm text-slate-500">
        Checking whether you’re still signed in.
      </p>
    </div>
  )
}
