import { BadRequestError } from 'routing-controllers'

/**
 * Where an order ships to. Stored as a single jsonb column in two places:
 * `orders.delivery_address` (an immutable snapshot of what we shipped to) and
 * `users.default_address` (the user's saved default, used to prefill checkout).
 */
export interface DeliveryAddress {
  fullName: string
  /** Normalised to 10 digits, no country code. */
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  /** 6-digit Indian PIN code. */
  pincode: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Strip the formatting people actually type — spaces, dashes, brackets, and a
 * country/trunk prefix — leaving the bare subscriber number.
 *
 * The prefix is only removed when the remaining length says it really is one.
 * A blanket /^91/ strip would mangle valid numbers that simply start with 91,
 * e.g. 9123456780.
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '')
  if (digits.startsWith('+91')) return digits.slice(3)
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

/**
 * Validate an untrusted request body into a DeliveryAddress. Throws
 * BadRequestError with a field-specific message on the first problem found.
 *
 * Hand-written rather than class-validator: `validation` is off globally in
 * index.ts, so decorators would be inert (see the other services for the same
 * pattern).
 */
export function parseDeliveryAddress(input: unknown): DeliveryAddress {
  if (!input || typeof input !== 'object') {
    throw new BadRequestError('Delivery address is required')
  }
  const raw = input as Record<string, unknown>

  const fullName = str(raw.fullName)
  const phone = normalisePhone(str(raw.phone))
  const line1 = str(raw.line1)
  const line2 = str(raw.line2)
  const city = str(raw.city)
  const state = str(raw.state)
  const pincode = str(raw.pincode)

  if (!fullName) throw new BadRequestError('Full name is required')
  if (fullName.length > 120) {
    throw new BadRequestError('Full name is too long (max 120 characters)')
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new BadRequestError(
      'Enter a valid 10-digit Indian mobile number starting with 6-9',
    )
  }
  if (!line1) throw new BadRequestError('Address line 1 is required')
  if (!city) throw new BadRequestError('City is required')
  if (!state) throw new BadRequestError('State is required')
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    throw new BadRequestError('Enter a valid 6-digit PIN code')
  }

  return {
    fullName,
    phone,
    line1,
    line2: line2 || null,
    city,
    state,
    pincode,
  }
}

/** Single-line rendering, used by the confirmation email. */
export function formatAddressLines(address: DeliveryAddress): string[] {
  return [
    address.fullName,
    `Phone: ${address.phone}`,
    address.line1,
    ...(address.line2 ? [address.line2] : []),
    `${address.city}, ${address.state} ${address.pincode}`,
  ]
}
