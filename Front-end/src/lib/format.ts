// Format a whole-rupee amount as INR with Indian grouping, e.g. ₹31,539.
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number): string {
  return inr.format(amount)
}
