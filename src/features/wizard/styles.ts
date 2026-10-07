const INPUT_BASE_CLASS =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600'

/** Shared classes for text inputs and selects; invalid fields get a red border. */
export function getInputClass(error: string | undefined): string {
  return `${INPUT_BASE_CLASS} ${error === undefined ? 'border-slate-300' : 'border-rose-500'}`
}

export const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400'

export const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60'
