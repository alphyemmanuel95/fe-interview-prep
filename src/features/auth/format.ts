const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const DATE = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

export function formatCurrency(amount: number): string {
  return CURRENCY.format(amount)
}

/** Formats an ISO date (YYYY-MM-DD), which the server sends in UTC. */
export function formatDate(isoDate: string): string {
  return DATE.format(new Date(isoDate))
}
