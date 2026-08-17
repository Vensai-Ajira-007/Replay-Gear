import type { DeliveryAddress } from './api'

// Format a whole-rupee amount as INR with Indian grouping, e.g. ₹31,539.
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number): string {
  return inr.format(amount)
}

// An ISO yyyy-mm-dd delivery estimate as e.g. "Wed, 19 Aug".
export function formatDeliveryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// A delivery address as display lines. Mirrors formatAddressLines on the server
// (used there for the confirmation email) so both render the same way.
export function formatAddressLines(address: DeliveryAddress): string[] {
  return [
    address.fullName,
    `Phone: ${address.phone}`,
    address.line1,
    ...(address.line2 ? [address.line2] : []),
    `${address.city}, ${address.state} ${address.pincode}`,
  ]
}
