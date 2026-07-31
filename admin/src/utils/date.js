export const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

export const dateInputToUTC = (val) => {
  const [y, m, d] = val.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Options for the "Period" dropdown filter used across admin report pages
export const PERIOD_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last month', value: '1m' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 12 months', value: '12m' },
]

// Inclusive lower-bound (UTC ms) for a period value, or null for 'all' (no lower bound)
export const getPeriodStartUTC = (period) => {
  const now = new Date()
  switch (period) {
    case '7d': return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case '1m': return Date.UTC(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3m': return Date.UTC(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '12m': return Date.UTC(now.getFullYear(), now.getMonth() - 12, now.getDate())
    default: return null
  }
}
