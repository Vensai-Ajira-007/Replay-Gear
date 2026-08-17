import { BadRequestError } from 'routing-controllers'
import {
  METRO_BY_PREFIX,
  REMOTE_STATE_BY_PREFIX,
  STATE_BY_PREFIX,
} from '../data/deliveryZones.js'
import { isValidPincode } from './address.js'

export type DeliveryZone = 'metro' | 'regional' | 'remote'

export interface DeliveryCheck {
  pincode: string
  serviceable: boolean
  zone: DeliveryZone | null
  /** Only known for the metro prefixes; null everywhere else. */
  city: string | null
  state: string | null
  etaDays: number | null
  /** ISO yyyy-mm-dd, or null when we don't deliver there. */
  etaDate: string | null
  codAvailable: boolean
  freeShipping: boolean
}

const ETA_DAYS: Record<DeliveryZone, number> = {
  metro: 2,
  regional: 4,
  remote: 7,
}

/** Advance by working days, skipping Sundays (couriers don't deliver then). */
function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from)
  let left = days
  while (left > 0) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0) left--
  }
  return date
}

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

const notServiceable = (pincode: string): DeliveryCheck => ({
  pincode,
  serviceable: false,
  zone: null,
  city: null,
  state: null,
  etaDays: null,
  etaDate: null,
  codAvailable: false,
  freeShipping: false,
})

/**
 * Serviceability + ETA for an Indian PIN code.
 *
 * A malformed PIN is a client error, but a well-formed PIN we simply don't
 * cover is a normal 200 with `serviceable: false` — the product page renders
 * that as an answer, not as a failure.
 */
export function checkPincode(input?: string): DeliveryCheck {
  const pincode = (input ?? '').trim()
  if (!isValidPincode(pincode)) {
    throw new BadRequestError('Enter a valid 6-digit PIN code')
  }

  const three = pincode.slice(0, 3)
  const two = pincode.slice(0, 2)

  // Remote first — those prefixes sit inside a neighbouring circle, so both the
  // longer ETA and their own state have to win over the 2-digit lookup.
  // Longest key first so '6825' (Lakshadweep) beats a shorter overlapping one.
  const remotePrefix = Object.keys(REMOTE_STATE_BY_PREFIX)
    .sort((a, b) => b.length - a.length)
    .find((p) => pincode.startsWith(p))

  let zone: DeliveryZone | null = null
  let city: string | null = null
  let state: string | null = null

  if (remotePrefix) {
    zone = 'remote'
    state = REMOTE_STATE_BY_PREFIX[remotePrefix]
  } else if (METRO_BY_PREFIX[three]) {
    zone = 'metro'
    city = METRO_BY_PREFIX[three]
    state = STATE_BY_PREFIX[two] ?? null
  } else if (STATE_BY_PREFIX[two]) {
    zone = 'regional'
    state = STATE_BY_PREFIX[two]
  }

  if (!zone) return notServiceable(pincode)

  const etaDays = ETA_DAYS[zone]
  return {
    pincode,
    serviceable: true,
    zone,
    city,
    state,
    etaDays,
    etaDate: toIsoDate(addBusinessDays(new Date(), etaDays)),
    codAvailable: zone !== 'remote',
    freeShipping: true,
  }
}
