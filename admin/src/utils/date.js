export const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

export const dateInputToUTC = (val) => {
  const [y, m, d] = val.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
